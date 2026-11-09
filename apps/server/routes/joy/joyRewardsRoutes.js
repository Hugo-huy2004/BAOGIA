// Thưởng JOY: vòng quay sinh nhật, mốc, học tập, tập trung — router con của /api/joy (mount trong routes/joyRoutes.js).
import express from 'express';
import Bio from '../../models/Bio.js';
import { awardJoy } from '../../utils/joyService.js';
import { requireMember } from '../../middleware/authMiddleware.js';
import { randomInt, randomBytes } from 'node:crypto';
import { memberTier, tierGifts, TIER_LABELS, VOUCHER_VALID_DAYS, voucherCode } from '../../utils/memberTier.js';
import { FOCUS_DAILY_JOY_CAP, todayStr, BIRTHDAY_PRIZES, birthdaySpinStatus } from './joyShared.js';

const router = express.Router();

// POST /api/joy/focus-start — stamps the start of a focus block.
router.post('/focus-start', requireMember, async (req, res) => {
  try {
    const updated = await Bio.findOneAndUpdate(
      { $or: [{ email: req.memberEmail }, { contactEmail: req.memberEmail }] },
      { $set: { focusStartedAt: new Date() } },
      { projection: { _id: 1 } },
    );
    if (!updated) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/joy/award-focus
router.post('/award-focus', requireMember, async (req, res) => {
  try {
    const { minutes } = req.body;
    const email = req.memberEmail;
    const numMinutes = Number(minutes);
    if (!email || !Number.isFinite(numMinutes) || !Number.isInteger(numMinutes) || numMinutes < 1 || numMinutes > 1440) {
      return res.status(400).json({ error: 'Số phút tập trung không hợp lệ.' });
    }

    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });

    // Base rewards x3.
    let joyAmount = 0;
    if (numMinutes >= 180) joyAmount = 150;
    else if (numMinutes >= 60) joyAmount = 45;
    else if (numMinutes >= 25) joyAmount = 15;

    if (joyAmount <= 0) {
      return res.status(400).json({ error: 'Thời gian tập trung chưa đủ để nhận thưởng JOY.' });
    }

    // Consume the server-stamped start; 30s slack covers network latency.
    const startedBy = new Date(Date.now() - numMinutes * 60 * 1000 + 30 * 1000);
    const started = await Bio.findOneAndUpdate(
      { _id: bio._id, focusStartedAt: { $ne: null, $lte: startedBy } },
      { $set: { focusStartedAt: null } },
      { projection: { _id: 1 } },
    );
    if (!started) {
      return res.status(400).json({ error: 'Thời gian tập trung chưa đủ để nhận thưởng JOY.' });
    }

    const today = todayStr();
    await Bio.updateOne(
      { _id: bio._id, focusJoyDate: { $ne: today } },
      { $set: { focusJoyDate: today, focusJoyToday: 0 } },
    );
    const reserved = await Bio.findOneAndUpdate(
      { _id: bio._id, focusJoyDate: today, focusJoyToday: { $lte: FOCUS_DAILY_JOY_CAP - joyAmount } },
      { $inc: { focusJoyToday: joyAmount } },
      { new: true, projection: { focusJoyToday: 1 } },
    );
    if (!reserved) {
      return res.status(429).json({ error: `Đã đạt giới hạn ${FOCUS_DAILY_JOY_CAP} JOY tập trung trong ngày.` });
    }

    let result;
    try {
      result = await awardJoy(email, joyAmount, 'focus_session', `Tập trung sâu HugoAura: ${numMinutes} phút`);
    } catch (error) {
      await Bio.updateOne(
        { _id: bio._id, focusJoyDate: today, focusJoyToday: { $gte: joyAmount } },
        { $inc: { focusJoyToday: -joyAmount } },
      );
      throw error;
    }

    res.json({ success: true, balance: result.balance, awarded: joyAmount, dailyAwarded: reserved.focusJoyToday });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/joy/birthday-spin — còn lượt quay không, và danh sách ô để vẽ vòng.
router.get('/birthday-spin', requireMember, async (req, res) => {
  try {
    const bio = await Bio.findOne(
      { email: req.memberEmail },
      'birthDay birthMonth birthYear starVip birthdaySpinYear birthdaySpinPrize displayName',
    ).lean();
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy tài khoản.' });
    res.json(birthdaySpinStatus(bio));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/joy/birthday-spin — bốc thưởng và cộng JOY.
router.post('/birthday-spin', requireMember, async (req, res) => {
  try {
    const bio = await Bio.findOne({ email: req.memberEmail });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy tài khoản.' });

    const now = new Date();
    if (Number(bio.birthMonth) !== now.getMonth() + 1) {
      return res.status(403).json({ error: 'Vòng quay chỉ mở trong tháng sinh nhật của bạn.' });
    }
    if (!memberTier(bio)) {
      return res.status(403).json({ error: 'Cần khai đủ ngày sinh để nhận quà sinh nhật.' });
    }

    // Chốt lượt TRƯỚC khi cộng JOY: hai request bấm cùng lúc thì chỉ một cái
    // đổi được birthdaySpinYear, cái còn lại không khớp điều kiện nên trượt.
    const claimed = await Bio.findOneAndUpdate(
      { _id: bio._id, birthdaySpinYear: { $ne: now.getFullYear() } },
      { $set: { birthdaySpinYear: now.getFullYear() } },
      { new: true },
    );
    if (!claimed) {
      return res.status(409).json({ error: 'Bạn đã dùng lượt quay của năm nay rồi.' });
    }

    // randomInt của crypto: phân phối đều thật sự, không lệch như Math.random()
    // nhân rồi làm tròn. Bảy ô cùng xác suất — không ô nào bị "gài".
    const index = randomInt(BIRTHDAY_PRIZES.length);
    const prize = BIRTHDAY_PRIZES[index];

    try {
      await awardJoy(req.memberEmail, prize, 'birthday_spin', `Quà tháng sinh nhật ${now.getMonth() + 1}/${now.getFullYear()}`);
    } catch (awardError) {
      // Cộng JOY hỏng thì trả lại lượt quay, đừng để mất trắng.
      await Bio.updateOne({ _id: bio._id }, { $set: { birthdaySpinYear: Number(bio.birthdaySpinYear) || 0 } });
      throw awardError;
    }

    // Quà theo hạng đi cùng lượt quay: cộng ngày duy trì và phát voucher.
    // `claimed` là bản đã chốt lượt ở trên nên đọc từ đó, không đọc lại bio cũ.
    const tier = memberTier(claimed);
    const gifts = tierGifts(tier);
    const issuedVouchers = [];
    let days = 0;

    if (gifts && Number(claimed.birthdayGiftYear) !== now.getFullYear()) {
      days = gifts.days;
      const expires = new Date(Math.max(new Date(claimed.expiresAt || 0).getTime(), now.getTime()));
      expires.setDate(expires.getDate() + days);

      const voucherExpiry = new Date(now);
      voucherExpiry.setDate(voucherExpiry.getDate() + VOUCHER_VALID_DAYS);
      for (const voucher of gifts.vouchers) {
        issuedVouchers.push({
          ...voucher,
          code: voucherCode(voucher.percent, randomBytes(3).toString('hex').toUpperCase()),
          issuedAt: now,
          expiresAt: voucherExpiry,
          usedAt: null,
        });
      }

      await Bio.updateOne(
        { _id: bio._id },
        {
          $set: { expiresAt: expires, birthdayGiftYear: now.getFullYear() },
          ...(issuedVouchers.length ? { $push: { serviceVouchers: { $each: issuedVouchers } } } : {}),
        },
      );
    }

    await Bio.updateOne({ _id: bio._id }, { $set: { birthdaySpinPrize: prize } });

    res.json({
      success: true,
      prize,
      index,
      prizes: BIRTHDAY_PRIZES,
      tier,
      tierLabel: tier ? TIER_LABELS[tier] : '',
      days,
      vouchers: issuedVouchers.map(({ code, percent, label, expiresAt }) => ({ code, percent, label, expiresAt })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
