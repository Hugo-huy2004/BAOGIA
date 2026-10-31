// Tạo, sửa, xoá Bio và đồng bộ danh bạ — router con của /api/bios (mount trong routes/bioRoutes.js).
import express from 'express';
import Bio from '../../models/Bio.js';
import { uploadAvatar, deleteAvatar } from '../../utils/cloudinary.js';
import { requireAdmin, requireMember, invalidateMemberGate } from '../../middleware/authMiddleware.js';
import { bioAge, isMinorAge } from '../../utils/memberAge.js';
import { clearCache } from '../../utils/cacheHelper.js';
import { appInstallationPolicy } from '../../../shared/appInstallationPolicy.js';
import slugIndex from '../../services/slugIndex.js';
import { deleteMemberAccountPermanently } from '../../services/memberAccountLifecycle.js';
import { clearPublicBioCache, rejectBlacklistedPhone, ownsBio, HISTORY_LABELS, pushHistory, normalizeSlug, createUniqueSlug, processSecretLinks } from './bioShared.js';

const router = express.Router();

router.post('/', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
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
      socialLinks = {},
      theme = {},
      pricing = { standard: '', premium: '', custom: '' },
      portfolio = [],
      services = [],
      secretLinks = [],
      baseSlug = ''
    } = req.body;

    if (!email || !displayName) {
      return res.status(400).json({ error: 'Email and Display Name are required' });
    }
    if (await rejectBlacklistedPhone(res, phone)) return;

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
      secretLinks: await processSecretLinks(secretLinks || []),
      history: welcomeHistory,
      createdAt: new Date(),
    });

    const savedBio = await newBio.save();
    
    await savedBio.save();
    slugIndex.addSlug(savedBio.slug);

    return res.status(201).json(savedBio);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.put('/:id', requireMember, async (req, res) => {
  try {
    const existing = await Bio.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Bio not found' });
    }
    // _id is exposed on the public bio page — without this check anyone could
    // overwrite any member's bio.
    if (!ownsBio(req, existing)) {
      return res.status(403).json({ error: 'Bạn không có quyền chỉnh sửa Bio này.' });
    }
    const previousSlug = existing.slug;

    // Tháng/năm sinh: khai một lần rồi khoá. Nếu sửa được thoải mái thì cổng
    // 18+ vô nghĩa — ai cũng chỉ cần lùi năm sinh một phút là qua. Sai sót thì
    // admin sửa qua công cụ quản trị.
    const incomingYear = Number(req.body.birthYear);
    const incomingMonth = Number(req.body.birthMonth);
    const incomingDay = Number(req.body.birthDay);
    if (!existing.birthYear && Number.isInteger(incomingYear)) {
      const thisYear = new Date().getFullYear();
      if (incomingYear < 1900 || incomingYear > thisYear) {
        return res.status(400).json({ error: 'Năm sinh không hợp lệ.' });
      }
      existing.birthYear = incomingYear;
      if (Number.isInteger(incomingMonth) && incomingMonth >= 1 && incomingMonth <= 12) {
        existing.birthMonth = incomingMonth;
      }
      if (Number.isInteger(incomingDay) && incomingDay >= 1 && incomingDay <= 31) {
        existing.birthDay = incomingDay;
      }
    }

    // Thành viên dưới 18: khoá cứng những trường có thể lần ra người thật ngoài
    // đời, và mọi liên kết bí mật phải có mật khẩu. Chặn tại đây thay vì ở giao
    // diện vì PUT này gọi thẳng được.
    if (isMinorAge(bioAge(existing))) {
      for (const field of ['address', 'measurements', 'height', 'weight']) {
        if (field in req.body) req.body[field] = '';
      }
      if (Array.isArray(req.body.secretLinks)) {
        req.body.secretLinks = req.body.secretLinks.filter((link) => link?.password);
      }
    }

    
    const { 
      displayName, 
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
      avatarUrl,
      links,
      theme,
      tabs,
      projects,
      services,
      secretLinks,
      antiDeepfakeLock,
      autoLogoutMinutes,
      privateMode,
      installedUtilities,
      homeScreenUtilities
    } = req.body;

    // Handle avatar update / delete / overwrite
    if (avatarUrl !== undefined) {
      if (existing.antiDeepfakeLock && avatarUrl !== existing.avatarUrl) {
        return res.status(403).json({ error: 'Khóa chống giả mạo ảnh đại diện (Anti-Deepfake Lock) đang hoạt động. Vui lòng tắt khóa trước khi thay đổi ảnh.' });
      }
      if (avatarUrl && avatarUrl.startsWith('data:image')) {
        existing.avatarUrl = await uploadAvatar(avatarUrl, existing.email, existing.avatarUrl);
      } else if (avatarUrl === '') {
        if (existing.avatarUrl) {
          await deleteAvatar(existing.avatarUrl);
        }
        existing.avatarUrl = '';
      }
    }

    // Phone, school and login email are EDU identity attributes. They are
    // immutable for every member and can only be changed through the
    // verification/admin workflow. Name and birthday remain member-editable.
    // Preserve this rule at the API boundary so direct requests cannot bypass
    // the Account UI.
    const preserve = (incoming, current) => incoming === undefined ? current : incoming;
    const nextEditableDisplayName = preserve(displayName, existing.displayName);
    const nextEditableBirthday = preserve(birthday, existing.birthday);
    const lockedPhone = existing.phone;
    const lockedEducation = existing.education;
    // Members get exactly one email — the one they signed in with. The
    // separate "Contact Email" field is banned outright (not just for
    // verified accounts) so it can never be (re)introduced via direct API
    // calls now that the UI field is gone; existing legacy values are left
    // alone since other routes still fall back to matching by contactEmail.
    const lockedContactEmail = existing.contactEmail;

    const nextDisplayName = nextEditableDisplayName || existing.displayName;
    const displayNameChanged =
      displayName !== undefined &&
      String(nextDisplayName) !== String(existing.displayName || '');
    const nextSlug = displayNameChanged
      ? await createUniqueSlug(
          normalizeSlug(nextDisplayName || existing.email.split('@')[0]),
          existing._id,
        )
      : existing.slug;

    // Apply strict property-level defaults
    // All 6 new themes are 100% free and unlocked for all members
    const ALLOWED_TEMPLATES = [
      'edu', 'workspace', 'sunset', 'brutalism', 'creative', 'studio', 'stone',
      'default', 'frost', 'graphite', 'aurora', 'flat'
    ];
    let incomingTemplate = theme?.template;
    if (incomingTemplate === 'stone') incomingTemplate = 'studio';
    const resolvedTemplate = ALLOWED_TEMPLATES.includes(incomingTemplate)
      ? incomingTemplate
      : (existing.theme?.template || 'workspace');

    const finalTheme = theme === undefined
      ? existing.theme
      : {
          bgColor: theme.bgColor || '#ffffff',
          textColor: theme.textColor || '#0f172a',
          accentColor: theme.accentColor || '#6366f1',
          pattern: theme.pattern || 'none',
          preset: theme.preset || 'default',
          btnRadius: typeof theme.btnRadius === 'number' ? theme.btnRadius : 16,
          btnBorderWidth: typeof theme.btnBorderWidth === 'number' ? theme.btnBorderWidth : 0,
          btnShadow: typeof theme.btnShadow === 'number' ? theme.btnShadow : 4,
          template: resolvedTemplate
        };

    const nextHeadline = preserve(headline, existing.headline);
    const nextBio = preserve(bio, existing.bio);
    const nextHobbies = preserve(hobbies, existing.hobbies);
    const nextHeight = preserve(height, existing.height);
    const nextWeight = preserve(weight, existing.weight);
    const nextMeasurements = preserve(measurements, existing.measurements);
    const nextAddress = preserve(address, existing.address);
    const nextSkills = preserve(skills, existing.skills);
    const nextJobTitle = preserve(jobTitle, existing.jobTitle);
    const nextLinks = preserve(links, existing.links);
    const nextTabs = preserve(tabs, existing.tabs);
    const nextProjects = preserve(projects, existing.projects);
    const nextServices = preserve(services, existing.services);

    // ── Track field changes for history ──────────────────────────────────────
    const textFields = ['displayName','headline','bio','birthday','phone','contactEmail','hobbies','height','weight','measurements','address','education','skills','jobTitle'];
    const fieldValues = {
      displayName: nextDisplayName,
      headline: nextHeadline,
      bio: nextBio,
      birthday: nextEditableBirthday,
      phone: lockedPhone,
      contactEmail: lockedContactEmail,
      hobbies: nextHobbies,
      height: nextHeight,
      weight: nextWeight,
      measurements: nextMeasurements,
      address: nextAddress,
      education: lockedEducation,
      skills: nextSkills,
      jobTitle: nextJobTitle,
    };

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
    const newLinkUrls = (nextLinks || []).map(l => l.url);
    for (const lnk of (nextLinks || [])) {
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
    existing.headline = nextHeadline;
    existing.bio = nextBio;
    existing.birthday = nextEditableBirthday;
    existing.phone = lockedPhone;
    existing.hobbies = nextHobbies;
    existing.height = nextHeight;
    existing.weight = nextWeight;
    existing.measurements = nextMeasurements;
    existing.address = nextAddress;
    existing.education = lockedEducation;
    existing.skills = nextSkills;
    existing.jobTitle = nextJobTitle;
    existing.contactEmail = lockedContactEmail;
    existing.links = nextLinks;
    existing.theme = finalTheme;
    existing.tabs = nextTabs;
    existing.projects = nextProjects;
    existing.services = nextServices;
    if (secretLinks !== undefined) {
      existing.secretLinks = await processSecretLinks(secretLinks, existing.secretLinks || []);
    }
    existing.slug = nextSlug;
    existing.status = 'active';
    if (installedUtilities !== undefined) {
      existing.installedUtilities = appInstallationPolicy.normalizeInstalled(installedUtilities);
    }
    if (homeScreenUtilities !== undefined) {
      const installed = installedUtilities !== undefined
        ? appInstallationPolicy.normalizeInstalled(installedUtilities)
        : appInstallationPolicy.normalizeInstalled(existing.installedUtilities);
      existing.homeScreenUtilities = appInstallationPolicy.normalizeHomeScreen(homeScreenUtilities, installed);
    }

    // Địa chỉ cư trú, vị trí, dân tộc và tôn giáo chỉ được khai một lần qua
    // onboarding. Thành viên gửi thẳng PUT này cũng không thể sửa; chỉ route
    // quản trị riêng mới có quyền cập nhật khi đã xác minh yêu cầu hỗ trợ.

    if (antiDeepfakeLock !== undefined) existing.antiDeepfakeLock = !!antiDeepfakeLock;
    if (autoLogoutMinutes !== undefined) existing.autoLogoutMinutes = Number(autoLogoutMinutes);
    if (privateMode !== undefined) existing.privateMode = !!privateMode;

    await existing.save();

    await clearPublicBioCache(existing);
    if (previousSlug !== existing.slug) await clearCache(`bio_slug_${previousSlug}`);

    // Keep the in-memory valid-slug set consistent on rename — otherwise the
    // new slug 404s (not in set) while the old one stays "valid" forever.
    if (previousSlug !== existing.slug) {
      slugIndex.deleteSlug(previousSlug);
      slugIndex.addSlug(existing.slug);
    }

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

    const deleted = await deleteMemberAccountPermanently(existing._id);
    if (!deleted) return res.status(404).json({ error: 'Bio not found' });
    invalidateMemberGate(existing.email);
    return res.json({ success: true, message: 'Bio deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /contacts/sync/:id - Batch synchronize contacts from mobile
router.post('/contacts/sync/:id', requireMember, async (req, res) => {
  try {
    const bio = await Bio.findById(req.params.id);
    if (!bio) {
      return res.status(404).json({ error: 'Bio not found' });
    }
    if (!ownsBio(req, bio)) {
      return res.status(403).json({ error: 'Bạn không có quyền thao tác trên Bio này.' });
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
      await clearPublicBioCache(bio);
    }

    res.json({ success: true, count: addedCount, contacts: bio.backedUpContacts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /contacts/:id/:contactId - Delete a single backed up contact
router.delete('/contacts/:id/:contactId', requireMember, async (req, res) => {
  try {
    const bio = await Bio.findById(req.params.id);
    if (!bio) {
      return res.status(404).json({ error: 'Bio not found' });
    }
    if (!ownsBio(req, bio)) {
      return res.status(403).json({ error: 'Bạn không có quyền thao tác trên Bio này.' });
    }

    bio.backedUpContacts = bio.backedUpContacts.filter(c => c._id.toString() !== req.params.contactId);
    await bio.save();
    await clearPublicBioCache(bio);

    res.json({ success: true, contacts: bio.backedUpContacts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
