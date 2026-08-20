// Đơn vị hiển thị của JOY — người dùng chọn một bậc số cho quen mắt.
//
// ── NGUYÊN TẮC QUAN TRỌNG NHẤT ─────────────────────────────────────
// JOY LƯU TRONG VÍ CHỈ CÓ MỘT ĐƠN VỊ DUY NHẤT (gọi là JOY gốc). Mọi giá, mọi
// trần thưởng, mọi bản ghi sổ ví, mọi phép tính ở server đều bằng JOY gốc. Đơn
// vị dưới đây là LỚP HIỂN THỊ: nó đổi con số cho quen mắt, không đổi giá trị.
//
// Vì sao phải như vậy: nếu mỗi ngôn ngữ có giá riêng thì đổi ngôn ngữ là đổi
// giá — người dùng chỉ cần chuyển sang tiếng có giá rẻ nhất để mua. Giữ một đơn
// vị gốc thì không có kẽ hở đó, và toàn bộ bảng giá hiện có vẫn đúng.
//
// ── TÊN VÀ HỆ SỐ ĐỀU LÀ CỦA HUGO STUDIO ────────────────────────────
// Không đơn vị nào mang tên, ký hiệu HAY TỶ GIÁ của một đồng tiền có thật:
// không "JOY$", không "JOYyen", không "Đô la Mỹ", và cũng không neo theo USD/VND
// nữa. JOY không phải tiền và không quy đổi ra tiền, nên mượn tên hay tỷ giá
// tiền thật vừa sai bản chất vừa là mượn nhận diện của ngân hàng trung ương
// nước người ta. Người dùng nhận ra đơn vị hợp với mình qua ĐỘ LỚN con số.
//
// HỆ SỐ LÀ SỐ NGUYÊN, KHÔNG CÓ SỐ LẺ — cố ý. Hệ số cũ neo theo tỷ giá thật có
// cái nhỏ hơn 1 (1 JOY = 0,001), nên mọi số nhỏ hiển thị thành "0,00" và cả app
// thành không đọc được với người chọn đơn vị đó. Số nguyên thì đơn vị nhỏ nhất
// (Kavo) vẫn còn 1 JOY = 1, và không có phép làm tròn nào rơi mất giá trị.

/**
 * `code`   — mã ngắn viết cạnh số
 * `name`   — tên riêng của đơn vị, KHÔNG dịch (danh từ riêng, như mọi tên tiền)
 * `factor` — 1 JOY gốc bằng bao nhiêu đơn vị hiển thị (luôn là số nguyên ≥ 1)
 */
export const JOY_DENOMS = {
  en: { code: "JOYka", name: "Kavo", factor: 1 },
  es: { code: "JOYve", name: "Velu", factor: 5 },
  fr: { code: "JOYve", name: "Velu", factor: 5 },
  zh: { code: "JOYra", name: "Rami", factor: 10 },
  id: { code: "JOYse", name: "Sela", factor: 16 },
  vi: { code: "JOYmi", name: "Mira", factor: 25 },
  th: { code: "JOYti", name: "Tinu", factor: 50 },
  ja: { code: "JOYzo", name: "Zoma", factor: 150 },
  ko: { code: "JOYlu", name: "Luno", factor: 1350 },
};

export const DEFAULT_DENOM = "vi";

/**
 * ĐƠN VỊ CHUẨN của cả hệ thống: Kavo (bản tiếng Anh), hệ số 1 — tức 1 Kavo
 * đúng bằng 1 JOY gốc, không hơn không kém. Mọi đơn vị khác đều được NIÊM YẾT
 * theo nó, đúng cách bảng tỷ giá quốc tế lấy một đồng làm gốc rồi quy mọi đồng
 * còn lại về đó.
 *
 * Vì sao là bản tiếng Anh: nó là đơn vị MẠNH NHẤT trong bảng (một Kavo đổi được
 * 1350 Luno, 25 Mira…), nên mọi tỷ giá quy về nó đều là số ≥ 1 — đọc bảng không
 * phải nhìn số 0,00074. Đây cũng là lý do bảng tỷ giá thật lấy đồng mạnh làm gốc.
 */
export const BASE_DENOM = "en";

/** Danh sách chọn theo trải nghiệm ngôn ngữ/quốc gia — giữ cả Pháp và Tây Ban Nha. */
export const DENOM_ACCOUNT_OPTIONS = Object.entries(JOY_DENOMS).map(([key, denom]) => ({
  key,
  ...denom,
  localeKeys: [key],
}));

/** Danh sách bảng tỷ giá — gộp các vùng dùng chung đúng một mã đơn vị. */
export const DENOM_OPTIONS = Object.entries(JOY_DENOMS).reduce((list, [key, denom]) => {
  const existing = list.find((item) => item.code === denom.code);
  if (existing) existing.localeKeys.push(key);
  else list.push({ key, ...denom, localeKeys: [key] });
  return list;
}, []);

/** Phí đổi đơn vị khi gửi JOY sang người dùng đơn vị khác. */
export const CROSS_DENOM_FEE = 0.15;

/** Mã ngôn ngữ (vi-VN, en_US…) → khoá đơn vị. Lạ thì về đơn vị mặc định. */
export function denomKey(language) {
  const base = String(language || "").toLowerCase().replace("_", "-").split("-")[0];
  return JOY_DENOMS[base] ? base : DEFAULT_DENOM;
}

export const denomOf = (language) => JOY_DENOMS[denomKey(language)];

// ── TỶ GIÁ SỐNG ────────────────────────────────────────────────────
// `factor` ở bảng trên là hệ số NỀN. Tỷ giá thật chạy quanh nó theo ngày, do
// server tính (server/utils/joyRateService.js) và nạp vào đây một lần lúc khởi
// động màn hình. Không có tỷ giá thì mọi thứ chạy đúng bằng hệ số nền — thị
// trường hỏng không được phép làm hỏng ví.
//
// Đây vẫn CHỈ LÀ LỚP HIỂN THỊ: giá của mọi thứ trong app niêm yết bằng JOY gốc,
// nên tỷ giá lên xuống không làm ai mua được nhiều hay ít hơn. Nó đổi CÁCH VIẾT
// con số, không đổi sức mua — đó là lý do thả nổi được mà không mở ra kẽ hở
// mua rẻ bán đắt nào.
let liveFactors = null;

/** Nạp tỷ giá ngày (map khoá đơn vị → hệ số). `null` để quay về hệ số nền. */
export function setLiveFactors(map) {
  liveFactors = (map && typeof map === "object") ? map : null;
}

/** Hệ số đang có hiệu lực của một đơn vị. */
export function factorOf(language) {
  const key = denomKey(language);
  const live = Number(liveFactors?.[key]);
  return Number.isFinite(live) && live > 0 ? live : JOY_DENOMS[key].factor;
}

/** JOY gốc → số hiển thị theo đơn vị của người đó (luôn là số nguyên). */
export function toDenom(joy, language) {
  const parsed = Number(joy);
  const safeJoy = Number.isFinite(parsed) ? parsed : 0;
  return {
    amount: Math.round(safeJoy * factorOf(language)),
    code: denomOf(language).code,
  };
}

/** Số người dùng nhập theo đơn vị của họ → JOY gốc (làm tròn về số nguyên). */
export function fromDenom(amount, language) {
  const factor = factorOf(language);
  if (!factor) return 0;
  return Math.round(Number(amount || 0) / factor);
}

/** Chuỗi hiển thị đầy đủ, theo cách viết số của đúng ngôn ngữ đó. */
export function formatDenom(joy, language, locale) {
  const { amount, code } = toDenom(joy, language);
  return `${amount.toLocaleString(locale || language || "vi")} ${code}`;
}

/**
 * Tỷ giá của một đơn vị so với ĐƠN VỊ CHUẨN: "1 Kavo = ? đơn vị này".
 * Đây là con số bảng biến động hiển thị, và cũng là con số dùng để quy đổi khi
 * gửi JOY cho người dùng đơn vị khác — một nguồn duy nhất cho cả hai việc.
 */
export function rateAgainstBase(language) {
  const base = factorOf(BASE_DENOM) || 1;
  return factorOf(language) / base;
}

/**
 * Đổi một số tiền ĐANG HIỂN THỊ ở đơn vị này sang số hiển thị ở đơn vị kia,
 * theo đúng tỷ giá đang chạy. Đi vòng qua JOY gốc chứ không nhân chéo hai hệ
 * số đã làm tròn.
 */
export function convertDenom(amount, fromLanguage, toLanguage) {
  return toDenom(fromDenom(amount, fromLanguage), toLanguage).amount;
}

/** Hai đơn vị này có phải đổi tiền không (es/fr cùng JOY€ nên KHÔNG tính). */
export const isCrossDenom = (a, b) => denomOf(a).code !== denomOf(b).code;

/**
 * Bảng số của một lần gửi JOY. Phí CỘNG THÊM vào phần người gửi trả — người nhận
 * luôn nhận đủ số đã gửi, giống phí sáng tạo 5% đang chạy.
 *
 * Tính bằng JOY GỐC, không tính trên số hiển thị: quy đổi hai lần trên số đã làm
 * tròn là cách chắc chắn làm lệch vài đơn vị mỗi giao dịch.
 *
 * Dùng CHUNG cho client và server: màn xác nhận và lệnh trừ ví phải ra cùng con
 * số, nếu không sẽ có ngày "màn hình nói 105, ví trừ 120".
 */
export function transferBreakdown(joy, fromDenomLang, toDenomLang, creativeFeeRate = 0) {
  const sent = Math.max(0, Math.round(Number(joy) || 0));
  const crossDenom = isCrossDenom(fromDenomLang, toDenomLang);
  const creativeFee = Math.floor(sent * creativeFeeRate);
  const conversionFee = crossDenom ? Math.floor(sent * CROSS_DENOM_FEE) : 0;
  return {
    sent,
    received: sent,
    creativeFee,
    conversionFee,
    totalDeducted: sent + creativeFee + conversionFee,
    crossDenom,
    conversionFeeRate: crossDenom ? CROSS_DENOM_FEE : 0,
    fromCode: denomOf(fromDenomLang).code,
    toCode: denomOf(toDenomLang).code,
    // Tỷ giá ĐANG CHẠY tại thời điểm lập hoá đơn, kèm số tiền mỗi bên nhìn thấy
    // bằng đơn vị của mình. Thiếu ba con số này thì màn xác nhận phải tự tính
    // lại bằng hệ số nền, và đó là lúc "màn hình nói một đằng, ví trừ một nẻo".
    rate: {
      base: denomOf(BASE_DENOM).code,
      fromPerBase: Math.round(rateAgainstBase(fromDenomLang) * 1e4) / 1e4,
      toPerBase: Math.round(rateAgainstBase(toDenomLang) * 1e4) / 1e4,
    },
    sentDisplay: toDenom(sent, fromDenomLang).amount,
    receivedDisplay: toDenom(sent, toDenomLang).amount,
    totalDeductedDisplay: toDenom(sent + creativeFee + conversionFee, fromDenomLang).amount,
  };
}
