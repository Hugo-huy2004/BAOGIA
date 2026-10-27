import express from 'express';
import rateLimit from 'express-rate-limit';
import Bio from '../models/Bio.js';
import Counter from '../models/Counter.js';
import PartnerClaim from '../models/PartnerClaim.js';
import { requireMember, requireAdmin, invalidateMemberGate } from '../middleware/authMiddleware.js';
import { missingProfileFields } from '../utils/profileRequirements.js';
import { awardJoy } from '../utils/joyService.js';
import { broadcastToEmail } from '../utils/realtime.js';
import { signedClientIp } from '../utils/clientIp.js';
import { securityHash } from '../services/securityEnforcement.js';
import { normalizePhone } from '../utils/identityCheck.js';
import { getPartnerCampaign, isPartnerCampaignOpen, extendFrom } from '../../shared/partnerCampaigns.js';

// ==========================================
// API CHA: /api/partner-campaigns
// Quà chiến dịch hợp tác (partner.hugowishpax.studio). Ai cũng mở được link,
// nhưng quà chỉ cộng cho tài khoản đã đăng nhập, đã điền đủ hồ sơ, chưa ai
// cùng người nhận trước, và còn suất. Nội dung chiến dịch: shared/partnerCampaigns.js.
// ==========================================

const router = express.Router();
const DAY_MS = 24 * 60 * 60 * 1000;

// Trần lượt theo TÀI KHOẢN (đặt sau requireMember): IP ở đây là IP của edge
// (Cloudflare/Vercel), dùng chung cho cả nghìn người — đếm theo IP vừa chặn
// nhầm người thật vừa để kẻ xoay tài khoản lọt. Trần chung theo IP thật vẫn do
// globalLimiter ở server.js lo.
const memberLimiter = (max) => rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? max : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `partner:${req.memberEmail}`,
  message: { error: 'Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.' },
});
const claimLimiter = memberLimiter(10);
const meLimiter = memberLimiter(60);

const slotKey = (slug) => `partner-campaign:${slug}:slots`;

const slotsUsed = async (slug) => (await Counter.findById(slotKey(slug)).lean())?.seq || 0;

// GET /:slug không cần đăng nhập — ai cũng gọi được, nên không để mỗi lượt gọi
// thành một lượt đọc DB. Trạng thái "còn suất" giữ 15 giây trong tiến trình
// (cộng cache CDN ở route): lũ request dừng ở đây, DB chỉ thấy vài lượt/phút.
const OPEN_CACHE_MS = 15 * 1000;
const openCache = new Map();
const cachedSlotsUsed = async (slug) => {
  const hit = openCache.get(slug);
  if (hit && Date.now() - hit.at < OPEN_CACHE_MS) return hit.used;
  const used = await slotsUsed(slug);
  openCache.set(slug, { at: Date.now(), used });
  return used;
};

// Giữ một suất — nguyên tử: chỉ tăng khi còn dưới trần, nên 250 người bấm cùng
// giây cũng không vượt. Trả false khi đã hết.
const reserveSlot = async (campaign) => {
  await Counter.updateOne({ _id: slotKey(campaign.slug) }, { $setOnInsert: { seq: 0 } }, { upsert: true });
  const taken = await Counter.findOneAndUpdate(
    { _id: slotKey(campaign.slug), seq: { $lt: campaign.maxClaims } },
    { $inc: { seq: 1 } },
    { new: true },
  );
  return Boolean(taken);
};
const releaseSlot = (campaign) => Counter.updateOne({ _id: slotKey(campaign.slug), seq: { $gt: 0 } }, { $inc: { seq: -1 } });

// Số suất còn lại KHÔNG công bố ra ngoài — trang chỉ cần biết còn mở hay không.
// Hết suất người ta vẫn đăng nhập được, chỉ không nhận quà chiến dịch.
const publicCampaign = async (campaign, { fresh = false } = {}) => {
  const used = fresh ? await slotsUsed(campaign.slug) : await cachedSlotsUsed(campaign.slug);
  return {
    slug: campaign.slug,
    partnerName: campaign.partnerName,
    partnerUrl: campaign.partnerUrl,
    bioDays: campaign.bioDays,
    eduBonusDays: campaign.eduBonusDays,
    joy: campaign.joy,
    open: isPartnerCampaignOpen(campaign) && used < campaign.maxClaims,
    endsAt: campaign.endsAt,
  };
};

// Riêng cho admin: kèm số suất đã dùng / còn lại.
const adminCampaign = async (campaign) => {
  const used = await slotsUsed(campaign.slug);
  return { ...(await publicCampaign(campaign, { fresh: true })), maxClaims: campaign.maxClaims, used, remaining: Math.max(0, campaign.maxClaims - used) };
};

const findBio = async (email) => (await Bio.findOne({ email })) || Bio.findOne({ contactEmail: email });

// Gmail coi "an.nguyen+abc@gmail.com", "annguyen@googlemail.com" là MỘT hộp
// thư. Chuẩn hoá để biến thể của cùng hộp thư không thành "người mới".
export const emailKeyOf = (email) => {
  const [local = '', domain = ''] = String(email || '').trim().toLowerCase().split('@');
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    return `${local.split('+')[0].replace(/\./g, '')}@gmail.com`;
  }
  return `${local.split('+')[0]}@${domain}`;
};

// Chỉ nhận đúng định dạng client sinh ra (src/utils/deviceSignals.js): mã
// thiết bị 48 hex, vân tay SHA-256 64 hex. Chuỗi khác coi như không gửi.
const hexToken = (value, length) => {
  const text = String(value || '').trim().toLowerCase();
  return new RegExp(`^[a-f0-9]{${length}}$`).test(text) ? text : '';
};

// Mạng /24 (IPv4) hoặc /48 (IPv6): một nhà, một quán cà phê. Đủ hẹp để "cùng
// vân tay + cùng mạng" gần như chắc chắn là cùng một máy.
const networkOf = (ip) => {
  const text = String(ip || '').replace(/^::ffff:/, '');
  if (text.includes(':')) return text.split(':').slice(0, 3).join(':');
  return text.split('.').slice(0, 3).join('.');
};

// Ô ~11 m quanh toạ độ đã xác minh ở bước hồ sơ (4 chữ số thập phân).
const locationCellOf = (bio) => {
  const lat = Number(bio.verifiedLatitude);
  const lng = Number(bio.verifiedLongitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || (!lat && !lng)) return '';
  return `${lat.toFixed(4)},${lng.toFixed(4)}`;
};

const identitySignals = (req, bio) => {
  // Chỉ IP đã được edge ký mới đáng tin để đếm (xem signedClientIp). Thiếu chữ
  // ký thì bỏ qua hai luật dựa trên mạng, vẫn còn điện thoại + thiết bị + vị trí.
  const ip = signedClientIp(req);
  const deviceId = hexToken(req.body?.deviceId, 48);
  const deviceFp = hexToken(req.body?.deviceFp, 64);
  // "0912 345 678" và "+84 912-345-678" là một số: chuẩn hoá rồi mới băm.
  const phone = normalizePhone(bio.phone);
  const location = locationCellOf(bio);
  return {
    phoneHash: phone ? securityHash('partner-phone', phone) : null,
    // Mã băm kiểu cũ (số thô) — chỉ để so trùng với lượt nhận trước bản chuẩn
    // hoá; không có trong schema nên PartnerClaim.create bỏ qua, không lưu.
    legacyPhoneHash: securityHash('phone', bio.phone) || null,
    deviceIdHash: deviceId ? securityHash('partner-device', deviceId) : null,
    deviceFpHash: deviceFp ? securityHash('partner-fp', deviceFp) : null,
    deviceNetHash: deviceFp && ip ? securityHash('partner-fpnet', `${deviceFp}|${networkOf(ip)}`) : null,
    ipHash: ip ? securityHash('ip', ip) : null,
    locationHash: location ? securityHash('partner-geo', location) : null,
  };
};

// Người dùng chỉ thấy MỘT câu chung, không biết dấu hiệu nào khớp — nói rõ
// "trùng thiết bị" hay "trùng mạng" là chỉ đường cho người cố lách. Lý do thật
// nằm ở PartnerClaim.reason + log, admin xem qua GET /admin/:slug/claims.
const REJECT_MESSAGE = 'Tài khoản này chưa đủ điều kiện nhận ưu đãi.';

// Một người, một lần. Trả lý do từ chối hoặc '' nếu không thấy trùng.
const findDuplicate = async (campaign, signals) => {
  const granted = { campaign: campaign.slug, status: 'granted' };
  // So cả mã băm kiểu cũ (số thô, trước khi chuẩn hoá) để không bỏ lọt lượt đã nhận trước bản này.
  const phoneHashes = [signals.phoneHash, signals.legacyPhoneHash].filter(Boolean);
  if (phoneHashes.length && await PartnerClaim.exists({ ...granted, phoneHash: { $in: phoneHashes } })) return 'duplicate_phone';
  if (signals.deviceIdHash && await PartnerClaim.exists({ ...granted, deviceIdHash: signals.deviceIdHash })) return 'duplicate_device';
  if (signals.deviceNetHash && await PartnerClaim.exists({ ...granted, deviceNetHash: signals.deviceNetHash })) return 'duplicate_device';
  // Ngưỡng thật đặt bằng env trên server (repo công khai — đừng để số đang
  // dùng nằm trong mã); giá trị trong shared/partnerCampaigns.js chỉ là mặc định.
  const envNumber = (name, fallback) => (Number(process.env[name]) > 0 ? Number(process.env[name]) : fallback);
  const maxPerIpPerDay = envNumber('PARTNER_MAX_PER_IP_DAY', campaign.antiAbuse?.maxPerIpPerDay);
  const maxPerLocation = envNumber('PARTNER_MAX_PER_LOCATION', campaign.antiAbuse?.maxPerLocation);
  if (signals.ipHash && maxPerIpPerDay) {
    const sameIp = await PartnerClaim.countDocuments({ ...granted, ipHash: signals.ipHash, createdAt: { $gte: new Date(Date.now() - DAY_MS) } });
    if (sameIp >= maxPerIpPerDay) return 'ip_limit';
  }
  if (signals.locationHash && maxPerLocation) {
    const sameSpot = await PartnerClaim.countDocuments({ ...granted, locationHash: signals.locationHash });
    if (sameSpot >= maxPerLocation) return 'location_limit';
  }
  return '';
};

const rejectClaim = async (res, { campaign, bio, signals, reason }) => {
  try {
    await PartnerClaim.create({ campaign: campaign.slug, email: bio.email, emailKey: emailKeyOf(bio.email), status: 'rejected', reason, ...signals });
  } catch (error) {
    if (error?.code !== 11000) console.error('[partner claim reject log]', error.message);
  }
  console.warn(`[partner-campaign] ${campaign.slug}: từ chối ${reason}`);
  return res.status(403).json({ code: 'DUPLICATE_PERSON', error: REJECT_MESSAGE });
};

const claimView = (claim, bio) => ({
  claimed: claim?.status === 'granted' && Boolean(claim.daysApplied && claim.joyApplied),
  rejected: claim?.status === 'rejected',
  rejectReason: claim?.status === 'rejected' ? REJECT_MESSAGE : '',
  claimedAt: claim?.createdAt || null,
  eduBonusApplied: Boolean(claim?.eduBonusApplied),
  isEduVerified: Boolean(bio?.isEduVerified),
  expiresAt: bio?.expiresAt || null,
  joyBalance: Number(bio?.joyBalance) || 0,
});

const loadCampaign = (req, res, next) => {
  const campaign = getPartnerCampaign(String(req.params.slug || '').toLowerCase());
  if (!campaign) return res.status(404).json({ error: 'Không tìm thấy chiến dịch.' });
  req.campaign = campaign;
  return next();
};

// ── Admin: theo dõi suất, xem lượt bị chặn, gỡ chặn nhầm ──────────────────────
router.get('/admin/:slug/claims', requireAdmin, loadCampaign, async (req, res) => {
  try {
    const { campaign } = req;
    const [granted, rejected, recent] = await Promise.all([
      PartnerClaim.countDocuments({ campaign: campaign.slug, status: 'granted' }),
      PartnerClaim.countDocuments({ campaign: campaign.slug, status: 'rejected' }),
      PartnerClaim.find({ campaign: campaign.slug })
        .sort({ createdAt: -1 })
        .limit(Math.min(500, Number(req.query.limit) || 200))
        .select('email status reason eduBonusApplied createdAt')
        .lean(),
    ]);
    return res.json({ campaign: await adminCampaign(campaign), granted, rejected, claims: recent });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Gỡ một lượt BỊ TỪ CHỐI (chặn nhầm người thật) để tài khoản đó thử nhận lại.
// Lượt đã nhận quà thì không gỡ ở đây — quà đã vào ví, gỡ claim chỉ mở đường nhận hai lần.
router.delete('/admin/:slug/claims/:id', requireAdmin, loadCampaign, async (req, res) => {
  try {
    const result = await PartnerClaim.deleteOne({ _id: req.params.id, campaign: req.campaign.slug, status: 'rejected' });
    if (!result.deletedCount) return res.status(404).json({ error: 'Không tìm thấy lượt bị từ chối này.' });
    return res.json({ success: true });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// GET /:slug — thông tin công khai của chiến dịch (số quà, còn mở hay không).
router.get('/:slug', loadCampaign, async (req, res) => {
  try {
    // Công khai, không gắn người dùng: cho CDN giữ 30 giây (cachePolicy tự đổi
    // sang no-store nếu request có cookie/token).
    res.set('Cache-Control', 'public, max-age=15, s-maxage=30');
    return res.json({ campaign: await publicCampaign(req.campaign) });
  } catch (error) {
    console.error('GET /partner-campaigns/:slug error:', error.message);
    return res.status(500).json({ error: 'Không đọc được chiến dịch lúc này.' });
  }
});

// GET /:slug/me — người đang đăng nhập đã nhận chưa, hồ sơ còn thiếu gì.
router.get('/:slug/me', requireMember, meLimiter, loadCampaign, async (req, res) => {
  try {
    const bio = await findBio(req.memberEmail);
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ thành viên.' });
    const claim = await PartnerClaim.findOne({ campaign: req.campaign.slug, emailKey: emailKeyOf(bio.email) }).lean();
    return res.json({
      campaign: await publicCampaign(req.campaign),
      profileComplete: missingProfileFields(bio).length === 0,
      displayName: bio.displayName || '',
      ...claimView(claim, bio),
    });
  } catch (error) {
    console.error('GET /partner-campaigns/:slug/me error:', error.message);
    return res.status(500).json({ error: 'Không đọc được trạng thái ưu đãi lúc này.' });
  }
});

// Cộng ngày duy trì: nối vào hạn cũ. Tài khoản chưa xác minh giáo dục đang đi
// theo hạn dùng thử (trialExpiresAt) — cổng thành viên và lịch dọn tài khoản
// đọc hạn đó, nên phải dời CẢ HAI, không thì quà 6 tháng vẫn bị xoá sau 7 ngày.
const extendAccess = (bio, days) => {
  const current = bio.isEduVerified || !bio.trialExpiresAt ? bio.expiresAt : bio.trialExpiresAt;
  const next = extendFrom(current, days);
  bio.expiresAt = next;
  if (!bio.isEduVerified) bio.trialExpiresAt = next;
  return next;
};

const pushHistory = (bio, campaign, detail) => {
  bio.history.push({
    type: 'partner_campaign',
    icon: 'handshake',
    title: `Quà hợp tác Hugo Studio × ${campaign.partnerName}`,
    detail,
    timestamp: new Date(),
  });
  if (bio.history.length > 50) bio.history = bio.history.slice(bio.history.length - 50);
};

// Tạo lượt nhận mới: so trùng người → giữ suất → ghi claim. Trả claim, hoặc
// đã tự trả response (từ chối / hết suất) và trả null.
const createGrantedClaim = async (req, res, campaign, bio) => {
  if (!isPartnerCampaignOpen(campaign)) {
    res.status(410).json({ code: 'CAMPAIGN_CLOSED', error: 'Chiến dịch đã kết thúc.', ...claimView(null, bio) });
    return null;
  }
  const signals = identitySignals(req, bio);
  if (!signals.deviceIdHash || !signals.deviceFpHash) {
    res.status(400).json({ code: 'DEVICE_REQUIRED', error: 'Không xác định được thiết bị. Tải lại trang rồi thử lại.' });
    return null;
  }
  const duplicate = await findDuplicate(campaign, signals);
  if (duplicate) {
    await rejectClaim(res, { campaign, bio, signals, reason: duplicate });
    return null;
  }
  if (!await reserveSlot(campaign)) {
    // Trả kèm trạng thái tài khoản: trang vẫn chào mừng, chỉ báo là quà
    // chiến dịch đã trao hết (JOY khởi tạo của hệ thống vẫn còn nguyên).
    res.status(410).json({ code: 'SOLD_OUT', error: 'Ưu đãi hợp tác đã được trao hết.', ...claimView(null, bio) });
    return null;
  }
  try {
    return await PartnerClaim.create({
      campaign: campaign.slug, email: bio.email, emailKey: emailKeyOf(bio.email), status: 'granted', ...signals,
    });
  } catch (error) {
    await releaseSlot(campaign);
    if (error?.code !== 11000) throw error;
    // Trùng {campaign, emailKey}: chính tài khoản này vừa nhận ở yêu cầu song
    // song → đọc lại và đi tiếp. Trùng điện thoại/thiết bị: tài khoản KHÁC trên
    // cùng máy vừa thắng cuộc đua → từ chối như mọi lượt trùng người.
    if (error.keyPattern?.emailKey) return PartnerClaim.findOne({ campaign: campaign.slug, emailKey: emailKeyOf(bio.email) });
    await rejectClaim(res, { campaign, bio, signals, reason: error.keyPattern?.phoneHash ? 'duplicate_phone' : 'duplicate_device' });
    return null;
  }
};

// POST /:slug/claim  { deviceId, deviceFp } — nhận quà. Gọi lại an toàn: đã
// nhận thì chỉ cộng nốt phần giáo dục nếu tài khoản vừa được xác minh.
router.post('/:slug/claim', requireMember, claimLimiter, loadCampaign, async (req, res) => {
  const { campaign } = req;
  try {
    const bio = await findBio(req.memberEmail);
    if (!bio) return res.status(404).json({ error: 'Không tìm thấy hồ sơ thành viên.' });

    const missing = missingProfileFields(bio);
    if (missing.length) {
      return res.status(409).json({
        code: 'PROFILE_INCOMPLETE',
        error: 'Hoàn tất thông tin hồ sơ trước khi nhận ưu đãi.',
        missing: missing.map((field) => field.key),
      });
    }

    let claim = await PartnerClaim.findOne({ campaign: campaign.slug, emailKey: emailKeyOf(bio.email) });
    if (claim?.status === 'rejected') {
      return res.status(403).json({ code: 'DUPLICATE_PERSON', error: REJECT_MESSAGE });
    }
    if (!claim) {
      claim = await createGrantedClaim(req, res, campaign, bio);
      if (!claim) return undefined;
    }

    const granted = { bioDays: 0, eduBonusDays: 0, joy: 0 };

    // Mỗi phần chỉ được cộng bởi yêu cầu lật được cờ của nó — hai lần bấm song
    // song thì lần thua không cộng gì.
    const daysLock = await PartnerClaim.findOneAndUpdate(
      { _id: claim._id, daysApplied: false },
      { $set: { daysApplied: true, bioDays: campaign.bioDays } },
      { new: true },
    );
    if (daysLock) {
      claim = daysLock;
      extendAccess(bio, campaign.bioDays);
      granted.bioDays = campaign.bioDays;
      pushHistory(bio, campaign, `+${campaign.bioDays} ngày duy trì tài khoản & trang Bio`);
      await bio.save();
    }

    const joyLock = await PartnerClaim.findOneAndUpdate(
      { _id: claim._id, joyApplied: false },
      { $set: { joyApplied: true, joy: campaign.joy } },
      { new: true },
    );
    if (joyLock) {
      claim = joyLock;
      try {
        await awardJoy(
          bio.email,
          campaign.joy,
          'partner_campaign',
          `Quà hợp tác Hugo Studio × ${campaign.partnerName}`,
          // Con số đã hứa công khai trên trang — không để hệ số bình ổn co lại.
          { rawAmount: true, refId: `partner:${campaign.slug}`, pushNotify: true },
        );
        granted.joy = campaign.joy;
      } catch (error) {
        // Ví bị đóng băng, mất kết nối… → trả cờ để lần sau cộng lại phần JOY.
        await PartnerClaim.updateOne({ _id: claim._id }, { $set: { joyApplied: false, joy: 0 } });
        console.error('[partner claim joy]', error.message);
        return res.status(409).json({
          code: 'JOY_FAILED',
          error: 'Đã cộng ngày duy trì nhưng chưa cộng được JOY. Vui lòng thử lại hoặc liên hệ hỗ trợ.',
        });
      }
    }

    // Phần thưởng giáo dục — có thể đến cùng lúc hoặc ở lần ghé sau.
    if (bio.isEduVerified && !claim.eduBonusApplied) {
      const eduLock = await PartnerClaim.findOneAndUpdate(
        { _id: claim._id, eduBonusApplied: false },
        { $set: { eduBonusApplied: true, eduBonusDays: campaign.eduBonusDays, eduBonusAt: new Date() } },
        { new: true },
      );
      if (eduLock) {
        claim = eduLock;
        extendAccess(bio, campaign.eduBonusDays);
        granted.eduBonusDays = campaign.eduBonusDays;
        pushHistory(bio, campaign, `+${campaign.eduBonusDays} ngày nhờ đã xác minh giáo dục`);
        await bio.save();
      }
    }

    if (granted.bioDays || granted.eduBonusDays) {
      await PartnerClaim.updateOne({ _id: claim._id }, { $set: { expiresAtAfter: bio.expiresAt } });
      invalidateMemberGate(bio.email);
      broadcastToEmail(bio.email, { type: 'bio_status_update', status: bio.status, isEduVerified: bio.isEduVerified, expiresAt: bio.expiresAt });
    }

    const fresh = await findBio(bio.email);
    return res.json({
      success: true,
      alreadyClaimed: !granted.bioDays && !granted.eduBonusDays && !granted.joy,
      granted,
      ...claimView(claim, fresh || bio),
    });
  } catch (error) {
    console.error('POST /partner-campaigns/:slug/claim error:', error.message);
    return res.status(500).json({ error: 'Chưa nhận được ưu đãi lúc này. Vui lòng thử lại.' });
  }
});

export default router;
