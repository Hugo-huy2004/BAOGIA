/**
 * Phần dùng chung của các route Ví JOY (hàm phụ, limiter, hằng số). Tách từ
 * joyRoutes.js cũ — mỗi thứ chỉ có MỘT bản ở đây nên các router con dùng chung
 * trạng thái (bộ đếm limiter, cache) như khi còn chung một tệp.
 */
import { FEATURE_PRICES } from '../../utils/featureSubscriptionService.js';
import {
  BIO_THEME_RENTAL_PRICE as SHARED_BIO_THEME_RENTAL_PRICE,
  TRANSFER_MONTHLY_CAP as SHARED_TRANSFER_MONTHLY_CAP,
} from '../../../../packages/shared/joyPrices.js';
import { ownExchangeItems } from '../../utils/appPlanService.js';
import { STEP_IDS } from '../../../web/src/components/member/hugoCoder/lessons/stages.js';
import { memberTier, tierGifts, TIER_LABELS } from '../../utils/memberTier.js';

export const BIO_THEME_RENTAL_PRICE = SHARED_BIO_THEME_RENTAL_PRICE;

export const COMPRESS_CHARGE = 50;

export const CODER_LESSON_IDS = STEP_IDS;

// Item labels shown on the invoice modal, keyed the same way the frontend
// calls /exchange-quote — kept here (not duplicated client-side) so price
// changes only ever need updating in one place.
export const EXCHANGE_ITEMS = {
  hugoArcade: { label: 'HugoArcade — Bứt phá & Huyền thoại (1 tháng)', priceJoy: FEATURE_PRICES.hugoArcade },
  hugoChess: { label: 'HugoChess — Cờ vua đỉnh cao (1 tháng)', priceJoy: FEATURE_PRICES.hugoChess },
  bioThemeBrutalism: { label: 'Giao diện Bio: Brutalism (1 tháng)', priceJoy: BIO_THEME_RENTAL_PRICE },
  bioThemeFlat: { label: 'Giao diện Bio: Flat (1 tháng)', priceJoy: BIO_THEME_RENTAL_PRICE },
  fileCompression: { label: 'Nén file HugoTractare', priceJoy: COMPRESS_CHARGE },
  // Bậc "sở hữu vĩnh viễn" của Hugo Store, sinh từ APP_PLANS nên bảng giá chỉ
  // có một chỗ để sửa (apps/server/utils/appPlanService.js).
  ...ownExchangeItems()
};

// Phone-based P2P JOY transfer — "send JOY by phone like MoMo" without real
// SMS/OTP infra (none exists in this codebase): Bio.phone is enforced unique
// at the DB level (see Bio.js's partial index), so "verified" here means
// guaranteed-single-owner, not SMS-verified. A 5% friction fee discourages
// spammy transfers without acting as a platform revenue cut ("phi lợi nhuận").
export const TRANSFER_MIN = 10;

export const TRANSFER_MAX = 1000;

// Trần NGÀY và PHÍ nay lấy theo HẠNG (packages/shared/tierFinance.js) — hai hằng số
// dùng chung trước đây đã bị gỡ khỏi đường chuyển tiền. `TRANSFER_MONTHLY_CAP`
// vẫn dùng chung cho mọi hạng: nó là tấm chắn chống rửa JOY ở quy mô tháng,
// không phải một đặc quyền để phân hạng.
export const TRANSFER_MONTHLY_CAP = SHARED_TRANSFER_MONTHLY_CAP;

export const TRANSFER_MIN_ACCOUNT_AGE_DAYS = 3;

export const FOCUS_DAILY_JOY_CAP = 150;

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// ─── Vòng quay tháng sinh nhật ───────────────────────────────────────────────
// Mỗi thành viên một lượt mỗi năm, chỉ trong tháng sinh của mình. Phần thưởng
// do server bốc, client chỉ nhận kết quả rồi quay hình cho khớp — nếu để client
// tự bốc thì sửa vài dòng trong DevTools là ra 10.000 JOY.
export const BIRTHDAY_PRIZES = [10, 50, 100, 500, 1000, 5000, 10000];

// Trạng thái vòng quay sinh nhật. Dùng chung cho GET /birthday-spin và /perks —
// ví hỏi cùng một câu, đừng trả lời bằng hai bản sao dễ lệch nhau.
export function birthdaySpinStatus(bio, now = new Date()) {
  const isBirthMonth = Number(bio.birthMonth) === now.getMonth() + 1;
  const spunThisYear = Number(bio.birthdaySpinYear) === now.getFullYear();
  const tier = memberTier(bio);
  return {
    prizes: BIRTHDAY_PRIZES,
    isBirthMonth,
    birthMonth: Number(bio.birthMonth) || 0,
    available: isBirthMonth && !spunThisYear && Boolean(tier),
    spunThisYear,
    lastPrize: spunThisYear ? Number(bio.birthdaySpinPrize) || 0 : 0,
    tier,
    tierLabel: tier ? TIER_LABELS[tier] : '',
    gifts: tierGifts(tier),
  };
}

/**
 * GET /api/joy/resolve-member?code= — tra người nhận từ MÃ VẠCH trên thẻ.
 *
 * Thẻ thành viên (MetalCard3D) in `referralCode` thành mã vạch để bạn bè quét mà
 * tặng JOY. Mã QR có đường riêng (/resolve-qr, token ký HMAC), còn mã vạch mang
 * mã thô nên cần đường này.
 *
 * ── VÌ SAO KHÔNG GIỐNG BẢN CŨ ────────────────────────────────────────────────
 * Bản trước KHÔNG có cổng và trả về cả `joyBalance` + `createdAt`: ai cũng đọc
 * được số dư của bất kỳ ai chỉ bằng một mã giới thiệu. Nó đã bị gỡ ngày 20/09 vì
 * lý do đó. Bản này dựng lại đúng tính năng, bỏ đi phần rò:
 *
 *   1. `requireMember` — chỉ thành viên đã đăng nhập mới tra được.
 *   2. Trả ĐÚNG những gì cần để xác nhận "đúng người này chứ?" trước khi gửi:
 *      tên, ảnh, mã, slug. KHÔNG số dư, KHÔNG email, KHÔNG số điện thoại,
 *      KHÔNG ngày tham gia.
 *   3. Giới hạn tần suất theo người tra. `referralCode` có thể sinh từ SÁU SỐ
 *      CUỐI điện thoại (referralService.normalizePhoneToCode), nên không giới
 *      hạn thì đây thành máy dò "số điện thoại → tên + ảnh".
 */
export const RESOLVE_LOOKUP_WINDOW_MS = 5 * 60 * 1000;

export const RESOLVE_LOOKUP_MAX = 30;

export const resolveLookupHits = new Map();

export function tooManyLookups(email) {
  const now = Date.now();
  const key = String(email || '').toLowerCase();
  const hits = (resolveLookupHits.get(key) || []).filter((at) => now - at < RESOLVE_LOOKUP_WINDOW_MS);
  hits.push(now);
  resolveLookupHits.set(key, hits);
  // Dọn định kỳ để Map không phình theo số người dùng đã từng tra.
  if (resolveLookupHits.size > 5000) {
    for (const [k, v] of resolveLookupHits) {
      if (!v.some((at) => now - at < RESOLVE_LOOKUP_WINDOW_MS)) resolveLookupHits.delete(k);
    }
  }
  return hits.length > RESOLVE_LOOKUP_MAX;
}

export const isBase64UrlJoyPayload = (payload) => typeof payload === 'string' && /^[A-Za-z0-9_-]{14}$/.test(payload);
