import express from 'express';
import Bio from '../models/Bio.js';
import { uploadAvatar, deleteAvatar } from '../utils/cloudinary.js';
import { requireAdmin } from '../middleware/authMiddleware.js';
import { fetchWithCache, clearCache } from '../utils/cacheHelper.js';
import { cleanupExpiredBirthdayNotifications } from '../utils/birthdayAutomation.js';

const router = express.Router();

const TWELVE_MONTHS_MS = 1000 * 60 * 60 * 24 * 365;

// ─── Helper: Append a history entry (capped at 50) ───────────────────────────
const HISTORY_LABELS = {
  displayName:  'Họ và tên',
  headline:     'Biệt danh',
  bio:          'Mô tả bản thân',
  birthday:     'Sinh nhật',
  phone:        'Số điện thoại',
  contactEmail: 'Email liên hệ',
  hobbies:      'Sở thích',
  height:       'Chiều cao',
  weight:       'Cân nặng',
  measurements: 'Số đo',
  address:      'Địa chỉ',
  education:    'Học vấn',
  skills:       'Kỹ năng',
  jobTitle:     'Nghề nghiệp'
};

const pushHistory = (bio, entry) => {
  bio.history.push({ ...entry, timestamp: new Date() });
  if (bio.history.length > 50) {
    bio.history = bio.history.slice(bio.history.length - 50);
  }
};

const normalizeSlug = (value) => {
  return (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const createUniqueSlug = async (baseSlug, ignoreId = null) => {
  let slug = baseSlug || 'bio';
  let suffix = 1;

  while (true) {
    const query = { slug };
    if (ignoreId) query._id = { $ne: ignoreId };

    const existing = await Bio.findOne(query);
    if (!existing) return slug;

    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
};

const removeExpiredBioIfNeeded = async (bio) => {
  if (bio && bio.expiresAt && new Date(bio.expiresAt).getTime() <= Date.now()) {
    await Bio.deleteOne({ _id: bio._id });
    return null;
  }

  return bio;
};

// GET: Fetch all bios (for Admin Panel) with search, filter, pagination, and stats
router.get('/', requireAdmin, async (req, res) => {
  try {
    const {
      search = '',
      status = '',
      expiration = '',
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    if (search.trim()) {
      query.$or = [
        { displayName: { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } },
        { slug: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    if (status && ['active', 'locked'].includes(status)) {
      query.status = status;
    }

    if (expiration) {
      const now = new Date();
      if (expiration === 'active') {
        query.$or = [
          { expiresAt: { $gt: now } },
          { expiresAt: null }
        ];
      } else if (expiration === 'expired') {
        query.expiresAt = { $lte: now };
      } else if (expiration === 'lifetime') {
        query.expiresAt = null;
      }
    }

    const sortObj = {};
    const order = sortOrder === 'asc' ? 1 : -1;
    sortObj[sortBy] = order;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    // Run parallel counts & query
    const [bios, totalMatched, totalCount, activeCount, lockedCount, lifetimeCount] = await Promise.all([
      Bio.find(query).sort(sortObj).skip(skip).limit(limitNum),
      Bio.countDocuments(query),
      Bio.countDocuments(),
      Bio.countDocuments({ status: 'active' }),
      Bio.countDocuments({ status: 'locked' }),
      Bio.countDocuments({ expiresAt: null })
    ]);

    res.json({
      bios,
      pagination: {
        totalMatched,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(totalMatched / limitNum)
      },
      stats: {
        total: totalCount,
        active: activeCount,
        locked: lockedCount,
        lifetime: lifetimeCount
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH: Lock/Unlock bio
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'active' or 'locked'

    if (!['active', 'locked'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const bio = await Bio.findByIdAndUpdate(id, { status }, { new: true });
    if (!bio) {
      return res.status(404).json({ error: 'Bio not found' });
    }

    // Clear public cache so guest devices reflect status changes instantly
    clearCache(`bio_slug_${bio.slug}`);

    res.json({ bio });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/me', async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    let bioDoc = await Bio.findOne({ email });
    if (!bioDoc) {
      bioDoc = await Bio.findOne({ contactEmail: email });
    }
    const bio = await removeExpiredBioIfNeeded(bioDoc);
    if (bio) {
      await cleanupExpiredBirthdayNotifications(bio);
    }
    return res.json({ bio });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get('/slug/:slug', async (req, res) => {
  try {
    const slug = req.params.slug;
    
    // Thuật toán O(1) Bloom Filter: Chặn ngay nếu Slug không tồn tại trong DB (Tránh DDoS DB)
    if (global.validSlugs && !global.validSlugs.has(slug)) {
      return res.status(404).json({ error: 'Bio not found (Bloom Filter rejected)' });
    }

    const cacheKey = `bio_slug_${slug}`;
    
    // Kích hoạt Single-flight & Stale-while-revalidate (giữ fresh trong 60 giây)
    const bio = await fetchWithCache(cacheKey, 60000, async () => {
      const found = await Bio.findOne({ slug });
      const bioDoc = await removeExpiredBioIfNeeded(found);
      return bioDoc ? bioDoc.toObject() : null;
    });

    if (!bio) {
      // Nếu không tìm thấy, xóa khỏi Bloom Filter
      if (global.validSlugs) global.validSlugs.delete(slug);
      return res.status(404).json({ error: 'Bio not found' });
    }

    res.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    return res.json({ bio });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { 
      email, 
      displayName, 
      headline = '', 
      bio = '',
      birthday = '',
      phone = '',
      hobbies = '',
      height = '',
      weight = '',
      measurements = '',
      address = '',
      education = '',
      skills = '',
      jobTitle = '',
      contactEmail = '',
      socialLinks = {},
      theme = {},
      pricing = { standard: '', premium: '', custom: '' },
      portfolio = [],
      services = [],
      baseSlug = ''
    } = req.body;

    if (!email || !displayName) {
      return res.status(400).json({ error: 'Email and Display Name are required' });
    }

    const newSlug = await createUniqueSlug(baseSlug || normalizeSlug(displayName));

    const welcomeHistory = [
      {
        type: 'welcome',
        icon: 'celebration',
        title: 'Chào mừng bạn đến với Hugo Studio! 🎉',
        detail: `Xin chào ${displayName}! Trang Bio cá nhân của bạn đã được khởi tạo thành công. Hãy thoả sức sáng tạo và cá nhân hoá trang Bio của mình nhé — chúng tôi luôn đồng hành cùng bạn.`,
        timestamp: new Date()
      },
      {
        type: 'bio_link',
        icon: 'link',
        title: 'Bio Link của bạn đã sẵn sàng',
        detail: `Đường dẫn Bio công khai của bạn là: hugowishpax.studio/bio/${newSlug}`,
        timestamp: new Date()
      }
    ];

    const newBio = new Bio({
      email,
      displayName,
      slug: newSlug,
      headline,
      bio,
      birthday,
      phone,
      hobbies,
      height,
      weight,
      measurements,
      address,
      education,
      skills,
      jobTitle,
      contactEmail,
      socialLinks,
      theme,
      pricing,
      portfolio,
      services,
      history: welcomeHistory,
      createdAt: new Date(),
    });

    const savedBio = await newBio.save();
    
    // Cập nhật Bloom Filter
    if (global.validSlugs) global.validSlugs.add(savedBio.slug);

    return res.status(201).json(savedBio);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const existing = await Bio.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Bio not found' });
    }
    
    // Xóa Cache nếu bio bị chỉnh sửa
    clearCache(`bio_slug_${existing.slug}`);
    
    const { 
      displayName, 
      headline = '', 
      bio = '',
      birthday = '',
      phone = '',
      hobbies = '',
      height = '',
      weight = '',
      measurements = '',
      address = '',
      education = '',
      skills = '',
      jobTitle = '',
      contactEmail = '',
      avatarUrl,
      links = [],
      theme = {},
      tabs = [],
      projects = [],
      services = []
    } = req.body;

    // Handle avatar update / delete / overwrite
    if (avatarUrl !== undefined) {
      if (avatarUrl && avatarUrl.startsWith('data:image')) {
        existing.avatarUrl = await uploadAvatar(avatarUrl, existing.email, existing.avatarUrl);
      } else if (avatarUrl === '') {
        if (existing.avatarUrl) {
          await deleteAvatar(existing.avatarUrl);
        }
        existing.avatarUrl = '';
      }
    }

    const nextDisplayName = displayName || existing.displayName;
    const nextSlugBase = normalizeSlug(nextDisplayName || existing.email.split('@')[0]);
    const nextSlug = await createUniqueSlug(nextSlugBase, existing._id);

    // Apply strict property-level defaults
    const finalTheme = {
      bgColor: theme.bgColor || '#ffffff',
      textColor: theme.textColor || '#0f172a',
      accentColor: theme.accentColor || '#6366f1',
      pattern: theme.pattern || 'none',
      preset: theme.preset || 'default',
      btnRadius: typeof theme.btnRadius === 'number' ? theme.btnRadius : 16,
      btnBorderWidth: typeof theme.btnBorderWidth === 'number' ? theme.btnBorderWidth : 0,
      btnShadow: typeof theme.btnShadow === 'number' ? theme.btnShadow : 4,
      template: theme.template || 'default'
    };

    // ── Track field changes for history ──────────────────────────────────────
    const textFields = ['displayName','headline','bio','birthday','phone','contactEmail','hobbies','height','weight','measurements','address','education','skills','jobTitle'];
    const fieldValues = { displayName: nextDisplayName, headline, bio, birthday, phone, contactEmail, hobbies, height, weight, measurements, address, education, skills, jobTitle };

    let updatedFieldsDetail = [];

    for (const field of textFields) {
      const oldVal = (existing[field] || '').toString().trim();
      const newVal = (fieldValues[field] || '').toString().trim();
      if (oldVal !== newVal && (oldVal || newVal)) {
        const label = HISTORY_LABELS[field] || field;
        if (!oldVal) {
          updatedFieldsDetail.push(`• Đã bổ sung mới [${label}]: "${newVal}"`);
        } else if (!newVal) {
          updatedFieldsDetail.push(`• Đã xóa trống [${label}] (Nội dung cũ: "${oldVal}")`);
        } else {
          updatedFieldsDetail.push(`• Đã thay đổi [${label}]: Từ "${oldVal.substring(0,60)}" ➔ Thành "${newVal.substring(0,60)}"`);
        }
      }
    }

    if (updatedFieldsDetail.length > 0) {
      pushHistory(existing, { 
        type: 'profile_updated', 
        icon: 'edit_document', 
        title: 'Đã cập nhật thông tin hồ sơ', 
        detail: `Chi tiết các thay đổi của bạn:\n${updatedFieldsDetail.join('\n')}`
      });
    }

    // Track link changes
    let linksDetail = [];
    const oldLinkUrls = (existing.links || []).map(l => l.url);
    const newLinkUrls = (links || []).map(l => l.url);
    for (const lnk of (links || [])) {
      if (!oldLinkUrls.includes(lnk.url)) {
        linksDetail.push(`• Đã gắn thêm liên kết: ${lnk.label} (${lnk.url})`);
      }
    }
    for (const lnk of (existing.links || [])) {
      if (!newLinkUrls.includes(lnk.url)) {
        linksDetail.push(`• Đã gỡ bỏ liên kết: ${lnk.label} (${lnk.url})`);
      }
    }
    
    if (linksDetail.length > 0) {
      pushHistory(existing, { 
        type: 'link_added', 
        icon: 'link', 
        title: 'Đã thay đổi liên kết mạng xã hội', 
        detail: `Chi tiết các thay đổi liên kết:\n${linksDetail.join('\n')}`
      });
    }
    // ─────────────────────────────────────────────────────────────────────────

    existing.displayName = nextDisplayName;
    existing.headline = headline;
    existing.bio = bio;
    existing.birthday = birthday;
    existing.phone = phone;
    existing.hobbies = hobbies;
    existing.height = height;
    existing.weight = weight;
    existing.measurements = measurements;
    existing.address = address;
    existing.education = education;
    existing.skills = skills;
    existing.jobTitle = jobTitle;
    existing.contactEmail = contactEmail;
    existing.links = links;
    existing.theme = finalTheme;
    existing.tabs = tabs;
    existing.projects = projects;
    existing.services = services;
    existing.slug = nextSlug;
    existing.status = 'active';

    await existing.save();

    return res.json({ bio: existing });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const existing = await Bio.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Bio not found' });
    }

    if (existing.avatarUrl) {
      await deleteAvatar(existing.avatarUrl);
    }
    await Bio.findByIdAndDelete(req.params.id);
    
    // Xóa khỏi Cache và Bloom Filter
    clearCache(`bio_slug_${existing.slug}`);
    if (global.validSlugs) global.validSlugs.delete(existing.slug);

    res.json({ message: 'Bio deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /contacts/sync/:id - Batch synchronize contacts from mobile
router.post('/contacts/sync/:id', async (req, res) => {
  try {
    const bio = await Bio.findById(req.params.id);
    if (!bio) {
      return res.status(404).json({ error: 'Bio not found' });
    }

    const incoming = req.body.contacts || [];
    const existingPhones = new Set(bio.backedUpContacts.map(c => (c.phone || '').replace(/\s+/g, '')));
    
    let addedCount = 0;
    for (const c of incoming) {
      const tel = (c.phone || c.tel || c.telUrl || '').replace(/\s+/g, '').trim();
      const name = (c.name || '').trim();
      if (!name) continue;

      if (!tel || !existingPhones.has(tel)) {
        bio.backedUpContacts.push({
          name,
          phone: tel,
          email: (c.email || '').trim()
        });
        if (tel) {
          existingPhones.add(tel);
        }
        addedCount++;
      }
    }

    if (addedCount > 0) {
      await bio.save();
      clearCache(`bio_slug_${bio.slug}`);
    }

    res.json({ success: true, count: addedCount, contacts: bio.backedUpContacts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /contacts/:id/:contactId - Delete a single backed up contact
router.delete('/contacts/:id/:contactId', async (req, res) => {
  try {
    const bio = await Bio.findById(req.params.id);
    if (!bio) {
      return res.status(404).json({ error: 'Bio not found' });
    }

    bio.backedUpContacts = bio.backedUpContacts.filter(c => c._id.toString() !== req.params.contactId);
    await bio.save();
    clearCache(`bio_slug_${bio.slug}`);

    res.json({ success: true, contacts: bio.backedUpContacts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;