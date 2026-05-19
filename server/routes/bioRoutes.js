import express from 'express';
import Bio from '../models/Bio.js';
import { uploadAvatar, deleteAvatar } from '../utils/cloudinary.js';

const router = express.Router();

const TWELVE_MONTHS_MS = 1000 * 60 * 60 * 24 * 365;

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

// GET: Fetch all bios (for Admin Panel)
router.get('/', async (req, res) => {
  try {
    const bios = await Bio.find().sort({ createdAt: -1 });
    res.json(bios);
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

    const bio = await removeExpiredBioIfNeeded(await Bio.findOne({ email }));
    return res.json({ bio });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get('/slug/:slug', async (req, res) => {
  try {
    const bio = await removeExpiredBioIfNeeded(await Bio.findOne({ slug: req.params.slug }));

    if (!bio) {
      return res.status(404).json({ error: 'Bio not found' });
    }

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
      avatarUrl = '',
      links = [],
      theme = {},
      tabs = []
    } = req.body;

    if (!email || !displayName) {
      return res.status(400).json({ error: 'Email and displayName are required' });
    }

    const existing = await Bio.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'Bio already exists for this email' });
    }

    const baseSlug = normalizeSlug(displayName || email.split('@')[0]);
    const slug = await createUniqueSlug(baseSlug);

    // Upload to Cloudinary if base64 avatar is provided
    let finalAvatarUrl = '';
    if (avatarUrl && avatarUrl.startsWith('data:image')) {
      finalAvatarUrl = await uploadAvatar(avatarUrl, email);
    } else if (avatarUrl) {
      finalAvatarUrl = avatarUrl;
    }

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

    const created = await Bio.create({
      email,
      displayName,
      slug,
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
      avatarUrl: finalAvatarUrl,
      links,
      theme: finalTheme,
      tabs,
      serviceLabel: 'Free Bio',
      status: 'active',
      expiresAt: new Date(Date.now() + TWELVE_MONTHS_MS)
    });

    return res.status(201).json({ bio: created });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
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
      tabs = []
    } = req.body;

    const existing = await Bio.findById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Bio not found' });
    }

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
    existing.slug = nextSlug;
    existing.status = 'active';

    await existing.save();

    return res.json({ bio: existing });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Bio.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Bio not found' });
    }

    // Clean up avatar image on Cloudinary
    if (deleted.avatarUrl) {
      await deleteAvatar(deleted.avatarUrl);
    }

    return res.json({ message: 'Bio deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;