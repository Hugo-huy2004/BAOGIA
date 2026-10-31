// Ví JOY: số dư, lịch sử, chuyển, mã QR, PIN — router con của /api/joy (mount trong routes/joyRoutes.js).
import express from 'express';
import Bio from '../../models/Bio.js';
import { getWalletOverview, claimDailyCheckin } from '../../controllers/joyWalletController.js';
import { awardJoy, getJoyHistory, getJoySummary } from '../../utils/joyService.js';
import { ensureReferralCode } from '../../utils/referralService.js';
import { requireAdmin, requireMember, recentlyVerified } from '../../middleware/authMiddleware.js';
import { bioAge, isMinorAge } from '../../utils/memberAge.js';
import { checkMoneyStepUp } from '../../services/moneyStepUp.js';
import { assessTransferHold } from '../../services/transferHold.js';
import { transferFeeRateOf, dailyTransferCapOf } from '../../../../packages/shared/tierFinance.js';
import PendingTransfer from '../../models/PendingTransfer.js';
import UtilityOrder from '../../models/UtilityOrder.js';
import { signQrToken, verifyQrToken, JOY_QR_BUCKET_MS } from '../../utils/joyQrToken.js';
import bcrypt from 'bcryptjs';
import { memberTier } from '../../utils/memberTier.js';
import { acquireIdempotencyLock, releaseIdempotencyLock } from '../../services/idempotencyService.js';
import { denomKey, transferBreakdown } from '../../../../packages/shared/joyCurrency.js';
import { TRANSFER_MIN, TRANSFER_MAX, TRANSFER_MONTHLY_CAP, TRANSFER_MIN_ACCOUNT_AGE_DAYS, todayStr, birthdaySpinStatus, tooManyLookups, isBase64UrlJoyPayload } from './joyShared.js';

const router = express.Router();

// ── ENDPOINTS VÍ JOY: MỘT LƯỢT GỌI CHO CẢ MÀN VÍ ─────────────────────────
// `requireMember` là cổng DUY NHẤT xác định người gọi là ai. Controller chỉ đọc
// `req.memberEmail`, không tự giải mã token và không nhận email từ query — ví là
// nơi rò một dòng là rò số dư + lịch sử giao dịch của người khác.
router.get('/wallet/overview', requireMember, getWalletOverview);

router.post('/wallet/claim-daily', requireMember, claimDailyCheckin);

// GET /api/joy/balance?email=
router.get('/balance', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    if (!email) return res.status(400).json({ error: 'Email query param is required' });

    // Fast path: a lean, projected read of just the two fields we return.
    // Avoids hydrating the whole Bio doc (history/projects/comments arrays) which
    // made this hot endpoint slow. Only the rare "no referral code yet" case
    // falls back to loading a full mongoose doc to generate + save one.
    let bio = await Bio.findOne({ email }, 'joyBalance referralCode').lean();
    if (!bio) bio = await Bio.findOne({ contactEmail: email }, 'joyBalance referralCode').lean();
    if (!bio) return res.json({ balance: 0, referralCode: "" });

    if (bio.referralCode) {
      return res.json({ balance: bio.joyBalance || 0, referralCode: bio.referralCode });
    }

    // First-time only: generate & persist a referral code.
    let full = await Bio.findOne({ email });
    if (!full) full = await Bio.findOne({ contactEmail: email });
    const referralCode = await ensureReferralCode(full);
    res.json({ balance: full.joyBalance || 0, referralCode });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/joy/history?limit=50&days=30
// Trả kèm tổng kết N ngày để ví chỉ cần một lượt gọi. `days=0` bỏ phần tổng kết.
router.get('/history', requireMember, async (req, res) => {
  try {
    const { limit, days } = req.query;
    const email = req.memberEmail;
    if (!email) return res.status(400).json({ error: 'Email query param is required' });

    const wantSummary = days === undefined || Number(days) > 0;
    const [transactions, summary] = await Promise.all([
      getJoyHistory(email, limit),
      wantSummary ? getJoySummary(email, days) : Promise.resolve(null)
    ]);
    res.json({ transactions, summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/joy/adjust (admin-only manual correction tool)
router.post('/adjust', requireAdmin, async (req, res) => {
  try {
    const { email, amount, description } = req.body;
    if (!email || !amount) return res.status(400).json({ error: 'email and amount are required' });

    const result = await awardJoy(email, Number(amount), 'admin_adjustment', description || 'Điều chỉnh JOY bởi quản trị viên');
    res.json({ success: true, balance: result.balance });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/joy/reset-to-zero  { email }  (admin-only — supreme override, e.g.
// for confirmed JOY-trading abuse; see PrivacyPolicyPage Chương XIII điểm d).
// Computes the exact negating delta server-side so Admin never has to know/
// guess the user's current balance — eliminates off-by-one risk of using
// /adjust with a manually typed negative amount.
router.post('/reset-to-zero', requireAdmin, async (req, res) => {
  try {
    const { email, reason } = req.body;
    if (!email) return res.status(400).json({ error: 'email is required' });

    const bio = await Bio.findOne({ email });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy người dùng.' });

    const currentBalance = bio.joyBalance || 0;
    if (currentBalance <= 0) {
      return res.json({ success: true, balance: 0, message: 'Số dư JOY đã là 0.' });
    }

    const result = await awardJoy(
      email,
      -currentBalance,
      'admin_adjustment',
      `Admin thu hồi toàn bộ JOY về 0${reason ? ` — Lý do: ${reason}` : ''}`,
      { bioDoc: bio }
    );
    res.json({ success: true, balance: result.balance });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/joy/perks — mọi ưu đãi người dùng đang cầm, gom về một chỗ:
// voucher hệ thống tặng (quà sinh nhật theo hạng + vòng quay), đơn đã mua bằng
// JOY, và trạng thái vòng quay. Trước đây voucher nằm lẫn trong tab Gói dịch vụ,
// đơn hàng không hiện ở đâu cả, còn vòng quay chỉ mở được từ popup tự bật —
// đóng nhầm là mất lượt xem.
router.get('/perks', requireMember, async (req, res) => {
  try {
    const [bio, orders] = await Promise.all([
      Bio.findOne(
        { email: req.memberEmail },
        'birthDay birthMonth birthYear starVip birthdaySpinYear birthdaySpinPrize serviceVouchers birthdayVoucherCode birthdayVoucherClaimed',
      ).lean(),
      UtilityOrder.find({ email: req.memberEmail }).sort({ createdAt: -1 }).limit(50).lean(),
    ]);
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy tài khoản.' });

    const vouchers = (bio.serviceVouchers || []).map((v) => ({
      code: v.code,
      label: v.label,
      percent: v.percent,
      scope: v.scope,
      issuedAt: v.issuedAt,
      expiresAt: v.expiresAt,
      usedAt: v.usedAt,
    }));

    // Mã BDAY-xx phát trước khi quà sinh nhật dời vào vòng quay. Không phát mới
    // nữa nhưng vẫn đổi được ở trang Gói dịch vụ, nên vẫn phải nhìn thấy.
    if (bio.birthdayVoucherCode && !bio.birthdayVoucherClaimed) {
      vouchers.push({
        code: bio.birthdayVoucherCode,
        label: 'Mã sinh nhật cũ · +14 ngày hạn dùng tài khoản',
        percent: 0,
        scope: 'legacy_birthday',
        issuedAt: null,
        expiresAt: null,
        usedAt: null,
      });
    }

    res.json({
      vouchers,
      orders: orders.map((o) => ({
        id: String(o._id),
        code: o.purchaseCode,
        name: o.productName,
        priceJoy: o.priceJoy,
        status: o.status,
        createdAt: o.createdAt,
      })),
      spin: birthdaySpinStatus(bio),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/joy/resolve-phone?phone= — lookup before sending, MoMo-style confirm.
// Never returns email (privacy) — only what's needed to show "Gửi tới: <name>".
// Tra người nhận bằng số điện thoại. Phải đăng nhập (trước đây mở cho cả
// người lạ), và tài khoản dưới 18 không xuất hiện: bạn bè muốn tặng JOY thì
// quét QR/NFC trực tiếp, không dò được bằng số điện thoại.
router.get('/resolve-phone', requireMember, async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) return res.status(400).json({ error: 'Số điện thoại là bắt buộc.' });

    const bio = await Bio.findOne({ phone: String(phone).trim() });
    if (!bio || isMinorAge(bioAge(bio))) return res.status(404).json({ error: 'Không tìm thấy người dùng với số điện thoại này.' });

    res.json({
      displayName: bio.displayName || 'Người dùng Hugo Studio',
      avatar: bio.avatarUrl || '',
      slug: bio.slug || '',
      joyDenom: denomKey(bio.joyDenom),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/joy/search-user?q=&email= — MoMo-style smart search by any field.
// Returns limited public info only (no email exposed).
router.get('/search-user', requireMember, async (req, res) => {
  try {
    const { q } = req.query;
    // Loại chính mình khỏi kết quả bằng danh tính đã xác thực. Bản cũ nhận
    // `?email=` từ client — một tham số người gọi tự đặt thì không loại đúng ai.
    const email = req.memberEmail;
    if (!q || !q.trim()) return res.json([]);
    const term = q.trim();
    const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const results = await Bio.find({
      ...(email ? { email: { $ne: email } } : {}),
      $or: [
        { displayName: regex },
        { phone: term },
        { referralCode: term.toUpperCase() },
        { contactEmail: regex }
      ]
    })
      .select('displayName avatarUrl referralCode phone slug birthYear birthMonth joyDenom')
      .limit(12)
      .lean();

    res.json(results.filter(b => !isMinorAge(bioAge(b))).slice(0, 6).map(b => ({
      displayName: b.displayName || 'Người dùng',
      avatarUrl: b.avatarUrl || '',
      referralCode: b.referralCode || '',
      slug: b.slug || '',
      maskedPhone: b.phone ? b.phone.slice(0, -3).replace(/\d/g, '*') + b.phone.slice(-3) : '',
      // Đơn vị JOY của người nhận — để màn gửi biết trước có phải đổi đơn vị (phí
      // 15%) hay không, thay vì để người dùng bấm gửi rồi mới thấy bị trừ thêm.
      joyDenom: denomKey(b.joyDenom),
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/joy/qr-payload?email= — generate user's JOY QR payload.
router.get('/qr-payload', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    if (!email) return res.status(400).json({ error: 'Thiếu email.' });
    const bio = await Bio.findOne({ email }).select('displayName avatarUrl referralCode joyBalance');
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ.' });
    if (!bio.referralCode) {
      const { ensureReferralCode } = await import('../../utils/referralService.js');
      await ensureReferralCode(bio);
    }
    res.json({
      // Signed, time-bound token (rotates ~every 2 min). Only this server can
      // mint one; only this server accepts it back at /resolve-qr.
      payload: signQrToken(bio.referralCode),
      refreshMs: JOY_QR_BUCKET_MS, // hint: client should refetch before this elapses
      displayName: bio.displayName || 'Hugo Member',
      avatarUrl: bio.avatarUrl || '',
      balance: bio.joyBalance
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/resolve-member', requireMember, async (req, res) => {
  try {
    const code = String(req.query.code || '').trim().toUpperCase();
    if (!code || code.length > 32) {
      return res.status(400).json({ success: false, error: 'Mã thành viên không hợp lệ.' });
    }
    if (tooManyLookups(req.memberEmail)) {
      return res.status(429).json({ success: false, error: 'Bạn đang tra quá nhanh. Thử lại sau vài phút.' });
    }

    const bio = await Bio.findOne({ referralCode: code })
      .select('displayName avatarUrl referralCode slug')
      .lean();
    if (!bio) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy thành viên với mã này.' });
    }

    return res.json({
      success: true,
      displayName: bio.displayName || 'Thành viên Hugo Studio',
      avatarUrl: bio.avatarUrl || '',
      referralCode: bio.referralCode,
      slug: bio.slug || '',
    });
  } catch (err) {
    console.error('[joy/resolve-member]', err);
    return res.status(500).json({ success: false, error: 'Không tra được mã. Thử lại sau.' });
  }
});

// GET /api/joy/resolve-qr?payload= — decode scanned QR to public info.
router.get('/resolve-qr', async (req, res) => {
  try {
    const payload = String(req.query.payload || '').trim();
    if (!isBase64UrlJoyPayload(payload)) {
      return res.status(400).json({ success: false, error: 'Mã JOY không hợp lệ hoặc đã hết hạn.' });
    }
    // Reject anything not signed by us (forged codes, expired codes, plain
    // referral strings). Only a token this server minted verifies.
    const referralCode = verifyQrToken(payload);
    if (!referralCode) {
      return res.status(400).json({ success: false, error: 'Mã JOY không hợp lệ hoặc đã hết hạn.' });
    }
    const bio = await Bio.findOne({ referralCode }).select('displayName avatarUrl referralCode slug');
    if (!bio) return res.status(404).json({ success: false, error: 'Không tìm thấy người dùng này.' });
    res.json({ success: true, displayName: bio.displayName || 'Hugo Member', avatarUrl: bio.avatarUrl || '', referralCode: bio.referralCode, slug: bio.slug || '' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/joy/has-pin
router.get('/has-pin', requireMember, async (req, res) => {
  try {
    const email = req.memberEmail;
    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });

    res.json({ hasPin: !!bio.transactionPin });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/joy/set-pin
router.post('/set-pin', requireMember, async (req, res) => {
  try {
    const { pin } = req.body;
    const email = req.memberEmail;
    if (!pin || !/^\d{6}$/.test(String(pin))) {
      return res.status(400).json({ error: 'Mã PIN phải có đúng 6 chữ số.' });
    }

    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });

    const hashedPin = await bcrypt.hash(String(pin), 12);
    bio.transactionPin = hashedPin;
    await bio.save();

    res.json({ success: true, message: 'Đã thiết lập mã PIN giao dịch thành công.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/joy/verify-pin
router.post('/verify-pin', requireMember, async (req, res) => {
  try {
    const { pin } = req.body;
    const email = req.memberEmail;
    if (!pin) return res.status(400).json({ error: 'Thiếu mã PIN cần xác thực.' });

    let bio = await Bio.findOne({ email });
    if (!bio) bio = await Bio.findOne({ contactEmail: email });
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ người dùng.' });

    if (!bio.transactionPin) {
      return res.status(400).json({ error: 'Người dùng chưa thiết lập mã PIN.' });
    }

    const isValid = await bcrypt.compare(String(pin), bio.transactionPin);
    res.json({ success: isValid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/transfer', requireMember, async (req, res) => {
  try {
    const { toPhone, toReferralCode, toEmail, amount, message, pin, idempotencyKey } = req.body;
    const fromEmail = req.memberEmail;
    if (!fromEmail || (!toPhone && !toReferralCode && !toEmail)) {
      return res.status(400).json({ error: 'Thiếu thông tin người gửi hoặc người nhận.' });
    }

    // 1. Chống gửi lặp request (khoá idempotency trong RAM)
    const idempotencyLockKey = idempotencyKey ? `idempotency:${fromEmail}:${idempotencyKey}` : null;
    if (idempotencyLockKey) {
      const locked = await acquireIdempotencyLock(idempotencyLockKey, 300);
      if (!locked) {
        return res.status(409).json({ error: 'Giao dịch đang được xử lý hoặc đã gửi trước đó.' });
      }
    }

    const rejectRequest = async (status, errorMsg, code) => {
      if (idempotencyLockKey) {
        await releaseIdempotencyLock(idempotencyLockKey);
      }
      return res.status(status).json({ error: errorMsg, ...(code ? { code } : {}) });
    };

    const numAmount = Number(amount);
    if (!Number.isFinite(numAmount) || !Number.isInteger(numAmount) || numAmount < TRANSFER_MIN || numAmount > TRANSFER_MAX) {
      return rejectRequest(400, `Số JOY gửi phải từ ${TRANSFER_MIN} đến ${TRANSFER_MAX}.`);
    }

    const sender = await Bio.findOne({ email: fromEmail });
    if (!sender) return rejectRequest(404, 'Không tìm thấy hồ sơ người gửi.');

    // 2. Xác thực 2 lớp — dưới ngưỡng giữ luật cũ (PIN nếu đã cài), từ ngưỡng
    // lên bắt buộc PIN + Face ID/Google vừa xong. `numAmount` là JOY gốc nên so
    // ngưỡng trực tiếp. Trả kèm `code` để client biết cần PIN hay Face ID.
    const step = await checkMoneyStepUp({
      senderBio: sender, amountBaseJoy: numAmount, pin, verified: recentlyVerified(req),
    });
    if (!step.ok) return rejectRequest(step.status, step.error, step.code);

    if (sender.joyBalance < 20) {
      return rejectRequest(400, 'Số dư của bạn phải có ít nhất 20 JOY mới được phép chuyển.');
    }

    const accountAgeMs = Date.now() - new Date(sender.createdAt).getTime();
    if (accountAgeMs < TRANSFER_MIN_ACCOUNT_AGE_DAYS * 24 * 60 * 60 * 1000) {
      return rejectRequest(400, `Tài khoản cần đủ ${TRANSFER_MIN_ACCOUNT_AGE_DAYS} ngày tuổi mới được gửi JOY.`);
    }

    let recipient;
    if (toReferralCode) {
      recipient = await Bio.findOne({ referralCode: String(toReferralCode).trim().toUpperCase() });
    } else if (toEmail) {
      recipient = await Bio.findOne({ $or: [{ email: toEmail }, { contactEmail: toEmail }] });
    } else {
      recipient = await Bio.findOne({ phone: String(toPhone).trim() });
    }
    if (!recipient) return rejectRequest(404, 'Không tìm thấy người nhận.');
    if (recipient.email === sender.email) {
      return rejectRequest(400, 'Không thể tự gửi JOY cho chính mình.');
    }

    const today = todayStr();
    const sentTodaySoFar = sender.joySentDate === today ? (sender.joySentToday || 0) : 0;
    // Trần chuyển THEO HẠNG (packages/shared/tierFinance.js). Star-14 thấp hơn — đúng
    // tinh thần "bảo vệ vị thành niên" mà bảng đặc quyền đã hứa từ lâu nhưng
    // chưa bao giờ được cài.
    const senderTier = memberTier(sender);
    const dailyCap = dailyTransferCapOf(senderTier);
    if (sentTodaySoFar + numAmount > dailyCap) {
      return rejectRequest(400, `Vượt giới hạn gửi ${dailyCap} JOY/ngày. Quý thành viên đã gửi ${sentTodaySoFar} JOY hôm nay.`);
    }

    // Trần THÁNG. Trần ngày một mình cho phép 1.000 × 30 = 30.000 JOY/tháng từ
    // một tài khoản — với vài tài khoản nuôi thì đó là đường gom JOY về một ví
    // mà không vi phạm luật nào. Khoá kỳ "YYYY-MM", sang tháng là bộ đếm tự về 0.
    const thisMonth = today.slice(0, 7);
    const sentThisMonthSoFar = sender.joySentMonth === thisMonth ? (sender.joySentMonthTotal || 0) : 0;
    if (sentThisMonthSoFar + numAmount > TRANSFER_MONTHLY_CAP) {
      return rejectRequest(400,
        `Vượt giới hạn gửi ${TRANSFER_MONTHLY_CAP} JOY/tháng. Cậu đã gửi ${sentThisMonthSoFar} JOY trong tháng này.`);
    }

    // JOY chỉ còn MỘT đơn vị nên không có phí đổi đơn vị: `conversionFee` luôn 0.
    // Bỏ luôn lần nạp tỷ giá trước đây đứng ở đây — nó thêm một lượt đọc DB vào
    // đường tiền chỉ để tính một khoản bằng 0.
    // Phí THEO HẠNG: Star-VIP miễn phí hoàn toàn, các hạng khác 5%. Bảng đặc
    // quyền đã hứa điều này; trước đây mọi người đều bị thu 5%.
    const bill = transferBreakdown(numAmount, sender.joyDenom, recipient.joyDenom, transferFeeRateOf(senderTier));
    const feeAmount = bill.creativeFee;
    const conversionFee = bill.conversionFee;
    const totalDeducted = bill.totalDeducted;

    if (sender.joyBalance < totalDeducted) {
      const parts = [`${feeAmount} JOY phí sáng tạo`];
      if (conversionFee) parts.push(`${conversionFee} JOY phí đổi ${bill.fromCode} → ${bill.toCode}`);
      return rejectRequest(400, `Số dư JOY không đủ. Bạn cần ${totalDeducted} JOY (bao gồm ${parts.join(' và ')}).`);
    }

    sender.joySentDate = today;
    sender.joySentToday = sentTodaySoFar + numAmount;
    sender.joySentMonth = thisMonth;
    sender.joySentMonthTotal = sentThisMonthSoFar + numAmount;

    const customMsg = message ? ` Lời nhắn: "${message}"` : '';
    const recipientName = recipient.displayName || 'bạn bè';
    const senderName = sender.displayName || 'Một người bạn';

    // Short, human-readable transaction code shared by both ledger rows —
    // lets the receipt/notification on either side reference the same transfer.
    const txCode = `JOY${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

    // Giữ giao dịch đáng ngờ: qua được 2FA nhưng KHÁC hành vi thường ngày (lần
    // đầu chuyển lớn, hoặc gấp nhiều lần mức cũ) thì không cho đi ngay — tạo
    // lệnh chờ, báo người dùng + Boss, Boss duyệt mới chạy. Không trừ tiền lúc
    // này: tiền chỉ rời ví khi được duyệt (executeHeldTransfer).
    const holdCheck = await assessTransferHold({ senderEmail: sender.email, amountBaseJoy: numAmount });
    if (holdCheck.hold) {
      await PendingTransfer.create({
        txCode, fromEmail: sender.email, toEmail: recipient.email,
        fromName: senderName, toName: recipientName,
        numAmount, totalDeducted, feeAmount, conversionFee,
        fromDenom: bill.fromCode, toDenom: bill.toCode, message: message || '',
        reason: holdCheck.reason,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      // Báo người dùng: giao dịch đang được xem xét, KHÔNG phải thất bại.
      const { notifyMember } = await import('../../utils/notifyMember.js');
      await notifyMember({
        email: sender.email, type: 'info', category: 'joy',
        key: 'source.transfer_held', actionUrl: '/member/account', push: true,
        amount: -totalDeducted, refCode: txCode, counterparty: recipientName,
      }).catch(() => {});
      // Báo Boss kèm nút duyệt/từ chối.
      import('../../services/telegramService.js').then(({ sendTelegramAlert }) => {
        sendTelegramAlert(
          `🔍 <b>[GIỮ GIAO DỊCH LỚN CHỜ RÀ SOÁT]</b>\n\n`
          + `👤 <code>${sender.email}</code> → <code>${recipient.email}</code>\n`
          + `💰 <b>${numAmount.toLocaleString('vi-VN')} JOY</b>\n`
          + `⚠️ ${holdCheck.reason}\n`
          + `📌 Mã: <code>${txCode}</code>`,
          'HTML',
          { inline_keyboard: [[
            { text: '✅ Duyệt & chuyển', callback_data: `cb_hold_ok:${txCode}` },
            { text: '🚫 Từ chối', callback_data: `cb_hold_no:${txCode}` },
          ]] },
        ).catch(() => {});
      }).catch(() => {});
      return res.json({
        success: true, held: true, txCode,
        message: 'Giao dịch lớn đang được giữ an toàn 1 giờ. Hết giờ chờ, Quý thành viên mở Trung Tâm An Ninh và xác nhận bằng Face ID là JOY được chuyển ngay.',
      });
    }

    // Execute concurrently for instant real-time websocket delivery.
    // Pass bioDoc to skip redundant DB reads inside awardJoy.
    // Câu mô tả chỉ nói việc gì đã xảy ra. Số tiền, mã GD và số dư nay là field
    // riêng trên notification (amount/refCode/balanceAfter) — đừng nhét lại vào
    // câu, client sẽ hiện hai lần.
    // 1. Trừ tiền người gửi trước (Atomic CAS đảm bảo số dư người gửi đủ)
    const senderResult = await awardJoy(
      sender.email, -totalDeducted, 'joy_gift_sent',
      `Gửi ${numAmount} JOY cho ${recipientName}, phí sáng tạo ${feeAmount} JOY${
        conversionFee ? `, phí đổi ${bill.fromCode} → ${bill.toCode} ${conversionFee} JOY` : ''
      }.${customMsg}`,
      {
        refId: txCode,
        bioDoc: sender,
        counterparty: recipientName,
        pushNotify: true
      }
    );

    // 2. Thử cộng tiền cho người nhận; nếu thất bại tự động hoàn lại tiền cho người gửi
    try {
      await awardJoy(
        recipient.email, numAmount, 'joy_gift_received',
        `${senderName} đã chuyển JOY cho bạn.${customMsg}`,
        {
          refId: txCode,
          bioDoc: recipient,
          counterparty: senderName,
          pushNotify: true,
          actionUrl: '/member/account'
        }
      );
    } catch (recipientError) {
      console.error('[TRANSFER ROLLBACK] Lỗi cộng tiền người nhận, tự động hoàn trả người gửi:', recipientError.message);
      await awardJoy(
        sender.email, totalDeducted, 'admin_adjustment',
        `Hoàn lại ${totalDeducted} JOY do giao dịch ${txCode} tới ${recipientName} không thể hoàn tất.`,
        { refId: `${txCode}_REV`, rawAmount: true }
      ).catch((refundErr) => {
        console.error('[CRITICAL TRANSFER ERROR] Lỗi hoàn tiền tự động cho sender:', refundErr.message);
      });
      return await rejectRequest(500, 'Không thể chuyển tiền cho người nhận lúc này. Số dư đã được hoàn lại đầy đủ vào ví của bạn.');
    }

    res.json({
      success: true,
      balance: senderResult.balance,
      sentAmount: numAmount,
      netAmount: numAmount,
      feeAmount,
      conversionFee,
      crossDenom: bill.crossDenom,
      fromDenom: bill.fromCode,
      toDenom: bill.toCode,
      totalDeducted,
      recipientName: recipient.displayName || '',
      senderName,
      message: message || '',
      txCode,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    if (req.body && req.body.idempotencyKey) {
      const fromEmail = req.memberEmail;
      const cacheKey = `idempotency:${fromEmail}:${req.body.idempotencyKey}`;
      await releaseIdempotencyLock(cacheKey);
    }
    res.status(400).json({ error: error.message });
  }
});

export default router;
