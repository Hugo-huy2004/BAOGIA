import express from 'express';
import Package from '../models/Package.js';
import Bio from '../models/Bio.js';
import JoyGiftCard from '../models/JoyGiftCard.js';
import { parseBirthday } from '../utils/birthdayAutomation.js';
import { sendPushNotification } from '../utils/pushNotifier.js';
import { fetchWithCache } from '../utils/cacheHelper.js';

const router = express.Router();

// ─── Reuse same capped-history helper ────────────────────────────────────────
const pushHistory = (bio, entry) => {
  bio.history.push({ ...entry, timestamp: new Date() });
  if (bio.history.length > 50) {
    bio.history = bio.history.slice(bio.history.length - 50);
  }
  if (bio.email) {
    sendPushNotification(
      bio.email,
      entry.title || 'Thông báo mới',
      entry.detail || 'Bạn có cập nhật mới trong tài khoản.',
      '/member/portal?tab=history'
    ).catch(err => console.error('[pushHistory Notification] Error:', err));
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

// GET all packages — public catalog, rarely changes. Cache 60s (SWR + single-
// flight) so a burst of visitors collapses to one DB read; admin edits appear
// within ~60s via background revalidation. Also set a CDN edge-cache header.
router.get('/', async (req, res) => {
  try {
    const packages = await fetchWithCache('all_packages', 60000, () =>
      Package.find().sort({ createdAt: -1 }).lean()
    );
    res.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
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

    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
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

    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
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

    const cleanCode = giftCode.toUpperCase().trim();
    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) {
      return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });
    }

    // Find if this birthday voucher code belongs to anyone in the database
    const targetBio = await Bio.findOne({ birthdayVoucherCode: cleanCode });
    if (targetBio) {
      if (targetBio.email !== bio.email && targetBio.contactEmail !== bio.email) {
        return res.status(400).json({ 
          error: `Mã Quà Tặng này không dành cho bạn, đây là món quà do Hugo Studio dành tặng cho ${targetBio.displayName}.` 
        });
      }

      if (bio.birthdayVoucherClaimed) {
        return res.status(400).json({ error: 'Mã quà tặng sinh nhật này đã được sử dụng.' });
      }

      // Check if it is currently their birthday month
      const parsed = parseBirthday(bio.birthday);
      const currentMonth = new Date().getMonth() + 1;
      if (!parsed || parsed.month !== currentMonth) {
        return res.status(400).json({ error: 'Mã quà tặng sinh nhật này chỉ có hiệu lực trong tháng sinh nhật của bạn.' });
      }

      // Check if remaining days < 365
      let remainingDays = 0;
      const now = new Date();
      if (bio.expiresAt) {
        const diffTime = new Date(bio.expiresAt).getTime() - now.getTime();
        remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
      if (bio.expiresAt && remainingDays >= 365) {
        return res.status(400).json({ error: 'Gói dịch vụ còn lại của bạn lớn hơn hoặc bằng 365 ngày, không đủ điều kiện nhận quà.' });
      }

      // Successful birthday voucher claim!
      const birthdayPkg = {
        packageId: 'birthday_gift',
        name: 'Card Sinh Nhật',
        duration: 14,
        durationUnit: 'days',
        benefits: ['14 ngày sử dụng Bio Link', 'Thiệp chúc mừng sinh nhật từ Hugo Studio'],
        color: '#ff2d55',
        addedAt: new Date()
      };
      bio.packages.push(birthdayPkg);

      let expires = new Date(bio.expiresAt);
      if (isNaN(expires.getTime()) || expires.getTime() < Date.now()) {
        expires = new Date();
      }
      expires.setDate(expires.getDate() + 14);
      bio.expiresAt = expires;

      bio.birthdayVoucherClaimed = true;

      const expireStr = expires.toLocaleDateString('vi-VN');
      pushHistory(bio, {
        type: 'package_redeemed',
        icon: 'redeem',
        title: `Nhận quà sinh nhật thành công! 🎁`,
        detail: `Bạn đã nhận quà sinh nhật từ Hugo Studio thành công. Gói "Card Sinh Nhật" (thêm 14 ngày) đã được kích hoạt. Bio Link có hiệu lực đến ngày ${expireStr}.`
      });

      await bio.save();
      return res.json({ 
        message: 'Redeemed successfully',
        bio: bio
      });
    }

    // Fallback to standard packages
    const pkg = await Package.findOne({ giftCode: cleanCode });
    if (!pkg) {
      // Check if it's a Joy Gift Card
      const joyCard = await JoyGiftCard.findOne({ code: cleanCode });
      if (joyCard) {
        if (joyCard.redeemed) return res.status(400).json({ error: 'Mã Joy này đã được sử dụng.' });
        
        joyCard.redeemed = true;
        joyCard.redeemedBy = email;
        joyCard.redeemedAt = new Date();
        await joyCard.save();

        bio.joyCoins = (bio.joyCoins || 0) + joyCard.joyValue;
        
        pushHistory(bio, {
          type: 'joy_gift_redeemed',
          icon: 'redeem',
          title: `Nhận ${joyCard.joyValue} Joy thành công!`,
          detail: `Bạn vừa nhập mã Voucher và nhận được ${joyCard.joyValue} Joy.`
        });
        
        await bio.save();
        
        return res.json({ 
          message: `Nhận thành công ${joyCard.joyValue} Joy!`,
          bio: bio
        });
      }

      return res.status(400).json({ error: 'Mã không hợp lệ hoặc đã được sử dụng.' });
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

    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
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
