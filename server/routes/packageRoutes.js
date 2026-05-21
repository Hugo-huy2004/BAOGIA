import express from 'express';
import Package from '../models/Package.js';
import Bio from '../models/Bio.js';

const router = express.Router();

// ─── Reuse same capped-history helper ────────────────────────────────────────
const pushHistory = (bio, entry) => {
  bio.history.push({ ...entry, timestamp: new Date() });
  if (bio.history.length > 50) {
    bio.history = bio.history.slice(bio.history.length - 50);
  }
};


const LOGO_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#10b981', '#3b82f6', 
  '#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#06b6d4'
];

// Helper to select random logo color
const getRandomLogoColor = () => {
  const randomIndex = Math.floor(Math.random() * LOGO_COLORS.length);
  return LOGO_COLORS[randomIndex];
};

// ----------------------------------------------------
// PACKAGE TEMPLATE ENDPOINTS (CRUD)
// ----------------------------------------------------

// GET all packages
router.get('/', async (req, res) => {
  try {
    const packages = await Package.find().sort({ createdAt: -1 });
    res.json(packages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create package template (color is randomized from logo colors)
router.post('/', async (req, res) => {
  try {
    const { name, duration, durationUnit = 'months', benefits = [] } = req.body;
    if (!name || !duration) {
      return res.status(400).json({ error: 'Name and duration are required' });
    }

    const color = getRandomLogoColor();
    const created = await Package.create({
      name,
      duration: Number(duration),
      durationUnit,
      benefits,
      color
    });

    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// USER ASSIGNED PACKAGES ENDPOINTS
// IMPORTANT: /user routes MUST be declared BEFORE /:id
// to prevent Express matching "user" as a MongoDB ObjectId
// ----------------------------------------------------

// GET packages for specific user by email
router.get('/user', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'Email query param is required' });
    }

    const bio = await Bio.findOne({ email });
    if (!bio) {
      return res.status(404).json({ error: 'Bio not found for this email' });
    }

    res.json({ packages: bio.packages || [], expiresAt: bio.expiresAt });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST assign a package template to a user's Bio and extend their expiration date
router.post('/user', async (req, res) => {
  try {
    const { email, packageId, customDuration } = req.body;
    if (!email || !packageId) {
      return res.status(400).json({ error: 'Email and packageId are required' });
    }

    const pkg = await Package.findById(packageId);
    if (!pkg) {
      return res.status(404).json({ error: 'Package template not found' });
    }

    const bio = await Bio.findOne({ email });
    if (!bio) {
      return res.status(404).json({ error: 'Bio not found for this email' });
    }

    const appliedDuration = customDuration ? Number(customDuration) : pkg.duration;
    const appliedDurationUnit = customDuration ? 'days' : pkg.durationUnit;

    // Add to user packages
    const newPkgInstance = {
      packageId: pkg._id.toString(),
      name: pkg.name,
      duration: appliedDuration,
      durationUnit: appliedDurationUnit,
      benefits: pkg.benefits,
      color: pkg.color,
      addedAt: new Date()
    };

    bio.packages.push(newPkgInstance);

    // Extend expiration date
    let expires = new Date(bio.expiresAt);
    if (isNaN(expires.getTime()) || expires.getTime() < Date.now()) {
      expires = new Date();
    }

    if (appliedDurationUnit === 'days') {
      expires.setDate(expires.getDate() + appliedDuration);
    } else if (appliedDurationUnit === 'years') {
      expires.setFullYear(expires.getFullYear() + appliedDuration);
    } else { // months
      expires.setMonth(expires.getMonth() + appliedDuration);
    }

    bio.expiresAt = expires;

    // Ghi lịch sử: nhận gói từ Hugo Studio (admin)
    const expireStr = expires.toLocaleDateString('vi-VN');
    pushHistory(bio, {
      type: 'package_received',
      icon: 'card_membership',
      title: `Bạn đã được nhận gói "${pkg.name}" từ Hugo Studio`,
      detail: `Gói dịch vụ "${pkg.name}" vừa được kích hoạt cho tài khoản của bạn. Bio Link có hiệu lực đến ngày ${expireStr}.`
    });

    await bio.save();

    res.json({ 
      message: 'Package assigned and expiration extended successfully', 
      packages: bio.packages, 
      expiresAt: bio.expiresAt 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST assign package to ALL users
router.post('/assign-all', async (req, res) => {
  try {
    const { packageId, customDuration } = req.body;
    if (!packageId) {
      return res.status(400).json({ error: 'packageId is required' });
    }

    const pkg = await Package.findById(packageId);
    if (!pkg) return res.status(404).json({ error: 'Package template not found' });

    const appliedDuration = customDuration ? Number(customDuration) : pkg.duration;
    const appliedDurationUnit = customDuration ? 'days' : pkg.durationUnit;

    const allBios = await Bio.find({});
    let updatedCount = 0;

    for (let bio of allBios) {
      const newPkgInstance = {
        packageId: pkg._id.toString(),
        name: pkg.name,
        duration: appliedDuration,
        durationUnit: appliedDurationUnit,
        benefits: pkg.benefits,
        color: pkg.color,
        addedAt: new Date()
      };
      bio.packages.push(newPkgInstance);

      let expires = new Date(bio.expiresAt);
      if (isNaN(expires.getTime()) || expires.getTime() < Date.now()) {
        expires = new Date();
      }

      if (appliedDurationUnit === 'days') {
        expires.setDate(expires.getDate() + appliedDuration);
      } else if (appliedDurationUnit === 'years') {
        expires.setFullYear(expires.getFullYear() + appliedDuration);
      } else { // months
        expires.setMonth(expires.getMonth() + appliedDuration);
      }
      bio.expiresAt = expires;

      const expireStr = expires.toLocaleDateString('vi-VN');
      pushHistory(bio, {
        type: 'package_received_all',
        icon: 'stars',
        title: `Quà tặng toàn hệ thống: Gói "${pkg.name}"`,
        detail: `Hugo Studio gửi tặng toàn bộ người dùng gói dịch vụ "${pkg.name}". Bio Link được gia hạn đến ngày ${expireStr}.`
      });

      await bio.save();
      updatedCount++;
    }

    res.json({ message: `Successfully assigned package to ${updatedCount} users` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST redeem gift code by member
router.post('/redeem', async (req, res) => {
  try {
    const { email, giftCode } = req.body;
    if (!email || !giftCode) {
      return res.status(400).json({ error: 'Email and giftCode are required' });
    }

    const pkg = await Package.findOne({ giftCode: giftCode.toUpperCase().trim() });
    if (!pkg) {
      return res.status(400).json({ error: 'Mã không hợp lệ hoặc đã được sử dụng.' });
    }

    const bio = await Bio.findOne({ email });
    if (!bio) {
      return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });
    }

    // Add package to user
    const newPkgInstance = {
      packageId: pkg._id.toString(),
      name: pkg.name,
      duration: pkg.duration,
      durationUnit: pkg.durationUnit,
      benefits: pkg.benefits,
      color: pkg.color,
      addedAt: new Date()
    };

    bio.packages.push(newPkgInstance);

    let expires = new Date(bio.expiresAt);
    if (isNaN(expires.getTime()) || expires.getTime() < Date.now()) {
      expires = new Date();
    }
    if (pkg.durationUnit === 'days') {
      expires.setDate(expires.getDate() + pkg.duration);
    } else if (pkg.durationUnit === 'years') {
      expires.setFullYear(expires.getFullYear() + pkg.duration);
    } else { // months
      expires.setMonth(expires.getMonth() + pkg.duration);
    }
    bio.expiresAt = expires;

    const expireStr = expires.toLocaleDateString('vi-VN');
    pushHistory(bio, {
      type: 'package_redeemed',
      icon: 'redeem',
      title: `Nhập mã thành công: Đã nhận gói "${pkg.name}"`,
      detail: `Bạn vừa nhập mã Voucher và được tặng gói "${pkg.name}". Bio Link có hiệu lực đến ngày ${expireStr}.`
    });

    await bio.save();

    // Regenerate code immediately
    pkg.giftCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    await pkg.save();

    res.json({ 
      message: 'Redeemed successfully',
      bio: bio
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// DELETE remove an assigned package from a user's Bio and reduce their expiration date
router.delete('/user', async (req, res) => {
  try {
    const { email, packageInstanceId } = req.body;
    if (!email || !packageInstanceId) {
      return res.status(400).json({ error: 'Email and packageInstanceId are required in body' });
    }

    const bio = await Bio.findOne({ email });
    if (!bio) {
      return res.status(404).json({ error: 'Bio not found for this email' });
    }

    const pkgInstance = bio.packages.id(packageInstanceId);
    if (!pkgInstance) {
      return res.status(404).json({ error: 'Package instance not found for this user' });
    }

    // Reduce expiration date
    let expires = new Date(bio.expiresAt);
    if (pkgInstance.durationUnit === 'days') {
      expires.setDate(expires.getDate() - pkgInstance.duration);
    } else if (pkgInstance.durationUnit === 'years') {
      expires.setFullYear(expires.getFullYear() - pkgInstance.duration);
    } else { // months
      expires.setMonth(expires.getMonth() - pkgInstance.duration);
    }

    bio.expiresAt = expires;
    bio.packages.pull(packageInstanceId);

    // Ghi lịch sử: gói bị thu hồi
    pushHistory(bio, {
      type: 'package_removed',
      icon: 'remove_circle',
      title: `Gói "${pkgInstance.name}" đã được gỡ bỏ`,
      detail: `Gói dịch vụ "${pkgInstance.name}" đã bị thu hồi khỏi tài khoản của bạn. Thời hạn Bio Link được điều chỉnh tương ứng.`
    });
    
    await bio.save();

    res.json({ 
      message: 'Package removed and expiration reduced successfully', 
      packages: bio.packages, 
      expiresAt: bio.expiresAt 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// PACKAGE TEMPLATE WILDCARD ENDPOINTS (must come AFTER /user)
// ----------------------------------------------------

// PUT update package template
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, duration, durationUnit, benefits } = req.body;

    const existing = await Package.findById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Package template not found' });
    }

    if (name) existing.name = name;
    if (duration !== undefined) existing.duration = Number(duration);
    if (durationUnit) existing.durationUnit = durationUnit;
    if (benefits) existing.benefits = benefits;

    await existing.save();
    res.json(existing);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST regenerate gift code for a package template
router.post('/:id/regenerate-code', async (req, res) => {
  try {
    const { id } = req.params;
    const pkg = await Package.findById(id);
    if (!pkg) {
      return res.status(404).json({ error: 'Package template not found' });
    }

    pkg.giftCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    await pkg.save();
    res.json({ message: 'Gift code regenerated', package: pkg });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE package template
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Package.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Package template not found' });
    }
    res.json({ message: 'Package template deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



export default router;
