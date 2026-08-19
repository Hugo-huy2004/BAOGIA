// Toán giá và toán tiền của sàn ảo Hugo — MỘT bản duy nhất cho cả hai phía.
//
// Trước đây công thức giá theo giây nằm hai nơi: server/services/stockMarket.js
// và src/components/member/invest/HugoInvestTab.jsx, chép tay cạnh nhau. Hai
// bản đã lệch thật: server đưa xuống `price` ĐÃ dao động rồi, client lại lấy
// chính con số đó làm gốc để dao động lần nữa — sóng chồng sóng, nên màn hình
// nói một giá còn ví trừ theo giá khác. Sửa gốc: một file, cả hai bên import.

import { BASE_DENOM, CROSS_DENOM_FEE, denomOf, isCrossDenom, toDenom } from './joyCurrency.js';
import { TRANSFER_FEE_RATE } from './joyPrices.js';

/** Phí môi giới mỗi chiều — sàn thật cũng thu. */
export const TRADING_FEE_RATE = 0.005;
export const MIN_FEE = 1;

/**
 * MỌI CỔ PHIẾU NIÊM YẾT BẰNG ĐƠN VỊ GỐC (Kavo) — sàn chỉ có MỘT bảng giá cho
 * tất cả mọi người. Ai để ví ở đơn vị khác thì mỗi lệnh là một lần đổi tiền,
 * nên chịu thêm phí chuyển đổi 15%, y như mua cổ phiếu Mỹ bằng tiền Việt.
 */
export const STOCK_QUOTE_DENOM = BASE_DENOM;
export const STOCK_QUOTE_CODE = denomOf(BASE_DENOM).code;

/**
 * SÀN CHỈ THU PHÍ MÔI GIỚI. Hai khoản từng chồng lên mỗi lệnh đã bỏ:
 *
 * · Phí sáng tạo 5% (TRANSFER_FEE_RATE) là phí CHUYỂN JOY GIỮA HAI NGƯỜI. Mua
 *   cổ phiếu không phải chuyển tiền cho ai, vậy mà mỗi lệnh bị tính như một
 *   lần tặng JOY.
 * · Phí đổi đơn vị 15% thu cho một lần đổi tiền KHÔNG HỀ XẢY RA. Đơn vị JOY
 *   (Kavo/Mira/Luno…) là LỚP HIỂN THỊ trên cùng một số JOY gốc — sổ cái ghi
 *   JOY gốc từ đầu tới cuối, không có đồng nào đổi sang đồng nào. Thu 15% mỗi
 *   chiều cho việc đó đẩy mốc hoà vốn của ví khác đơn vị lên 51,6%: người học
 *   phải đoán đúng một cú tăng hơn nửa giá trị công ty mới huề vốn, tức là sàn
 *   dạy "đừng bao giờ giao dịch" chứ không dạy đầu tư.
 *
 * Còn lại 0,5%/chiều ⇒ hoà vốn ~1,01%, đúng tầm phí môi giới ngoài đời và vẫn
 * đủ để dạy bài học "lướt sóng liên tục thì phí ăn hết lãi".
 *
 * ponytail: giữ hai hằng số dưới đây ở 0 thay vì xoá, vì server và client còn
 * đọc chúng để hiện bảng phí. Muốn thu lại thì đổi số ở đây, KHÔNG rải phí
 * mới vào route.
 */
export const CREATIVE_FEE_RATE = 0;
export const STOCK_CONVERSION_FEE_RATE = 0;

/** Phí một lệnh: 0,5% giá trị, tối thiểu 1 JOY. */
export function tradingFee(value) {
  return Math.max(MIN_FEE, Math.round(Math.abs(value) * TRADING_FEE_RATE));
}

/**
 * ── ĐƯỜNG GIÁ LIÊN TỤC (bước 60 giây) ────────────────────────────────────────
 *
 * Sàn chạy suốt ngày đêm chứ không đứng yên giữa hai phiên. Đường giá đi theo
 * BƯỚC 60 GIÂY: mỗi bước là một mức giá mới, client nối hai bước liền nhau để
 * vẽ và để hiện con số nhấp nháy từng giây.
 *
 * BA điều làm nên "đủ mọi hình thái" của một biểu đồ thật:
 *
 * 1. NGẪU NHIÊN CÓ HẠT GIỐNG BÍ MẬT. Mỗi bước lấy một số ngẫu nhiên từ
 *    hash(bí mật máy chủ, mã, số thứ tự bước). Hàm thuần nên không cần ghi
 *    database, không cần timer nền — nhưng KHÔNG ĐOÁN TRƯỚC ĐƯỢC vì hạt giống
 *    nằm ở máy chủ. Bản cũ dùng ba sóng sin theo đồng hồ: đẹp nhưng ai đọc
 *    bundle cũng biết trước đáy và đỉnh của giờ sau.
 *
 * 2. CHẾ ĐỘ THỊ TRƯỜNG đổi mỗi 15 phút, bốc bằng chính hạt giống đó: đi ngang
 *    (tích luỹ), xu hướng lên, xu hướng xuống, bùng nổ, sập, và cú sốc tin tức
 *    (một bước nhảy dựng đứng rồi đi tiếp). Đó là toàn bộ hình thái mà một
 *    biểu đồ ngoài đời có: nền phẳng, dốc đều, cây nến dài, gap, hồi phục.
 *
 * 3. NEO VỀ GIÁ CƠ BẢN. Mỗi bước bị kéo nhẹ về giá chốt phiên (giá do kết quả
 *    kinh doanh quyết định). Xu hướng vẫn chạy được hàng giờ, nhưng không có
 *    chuyện đi thẳng một mạch tới vô cực — đúng như thị trường thật luôn bị
 *    giá trị cơ bản kéo lại.
 *
 * TRẦN MỘT BƯỚC PHẢI NHỎ HƠN PHÍ KHỨ HỒI — RÀNG BUỘC CỨNG, ĐỪNG TÁCH RỜI HAI
 * CON SỐ NÀY. Máy chủ tiết lộ trước mốc giá của bước đang chạy (client cần nó
 * để vẽ mượt và để hiện đúng giá sắp khớp), nên bước đó là phần DUY NHẤT người
 * dùng biết trước tương lai. Biết trước một cú tăng LỚN HƠN phí khứ hồi =
 * mua-bán ăn chắc không rủi ro = sàn thành máy in JOY.
 *
 * Phí khứ hồi giờ là 2 × 0,5% = 1% (trước là 11% vì có phí sáng tạo), nên trần
 * một bước hạ từ 2,5% xuống 0,6%. Để biên độ cả phiên không tụt theo, bước rút
 * ngắn từ 60 giây xuống 30 giây — gấp đôi số bước bù lại trần thấp đi bốn lần.
 *
 * ponytail: trần 0,6%/bước bám theo phí 1%. Đổi phí giao dịch thì PHẢI xem lại
 * con số này; check-stock-market.mjs có assert giữ đúng quan hệ đó.
 */
export const SEGMENT_SEC = 30;
// Số bước gửi kèm mỗi lần client hỏi giá: 120 bước = 1 giờ biểu đồ.
export const TICK_WINDOW = 120;
export const MAX_SEGMENT_MOVE = 0.006;
// Giá trong một phiên không rời quá 35% × hệ số biến động của mã khỏi giá cơ
// bản phiên đó (HBANK ~21%, HARC ~63%) — chạm trần thì biểu đồ thành đường
// thẳng, nên trần phải rộng hơn mức mà chế độ thị trường thường đẩy tới.
const MAX_SESSION_DRIFT = 0.9;
// Lực kéo về giá cơ bản mỗi bước: nửa đời ~70 phút, đủ để một xu hướng chạy
// hết buổi sáng rồi mới tan, nhưng không cho giá đi thẳng tới trần.
const REVERSION = 0.0015;
// Độ lớn cú giật mỗi bước, trước khi nhân hệ số biến động của mã.
const STEP_SIGMA = 0.0025;
// 15 phút một chế độ thị trường (bước 30 giây ⇒ 30 bước).
const REGIME_SEGMENTS = 30;
// Nhấp nhô hiển thị giữa hai bước, ±0,1% — chỉ để con số trên màn hình sống,
// nhỏ hơn phí hàng chục lần nên không đẻ ra kẽ hở kiếm lời.
const WIGGLE = 0.001;

const clamp = (value, limit) => Math.max(-limit, Math.min(limit, value));

/**
 * FNV-1a + bước trộn cuối. Bước trộn KHÔNG phải trang trí: thiếu nó, hai chuỗi
 * chỉ khác nhau ở ký tự cuối (đúng trường hợp "…|bước 5001" và "…|bước 5002")
 * cho ra hai số lệch nhau chưa tới 1%, nên hàng chục khối liền nhau bốc trúng
 * cùng một chế độ thị trường — biểu đồ thành một đường dốc thẳng suốt ba tiếng.
 */
function hash01(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

const rnd = (...parts) => hash01(parts.join('|'));
// Xấp xỉ phân phối chuẩn bằng ba số đều (định lý giới hạn trung tâm rút gọn):
// nằm trong ±1,5 nên không bao giờ đẻ ra một cú giật vô lý.
const gauss = (...parts) => rnd('a', ...parts) + rnd('b', ...parts) + rnd('c', ...parts) - 1.5;

/**
 * TÂM TRẠNG CẢ PHIÊN — thứ tạo ra phiên "siêu cao" và "siêu thấp".
 *
 * Chỉ đổi chế độ mỗi 15 phút thì phiên nào cũng na ná nhau: các nhịp lên xuống
 * triệt tiêu lẫn nhau nên đo ra biên độ phiên gần như không bao giờ vượt 40%.
 * Thị trường thật không vậy — thỉnh thoảng có một phiên mà CẢ NGÀY chỉ có một
 * chiều (hưng phấn hoặc hoảng loạn), và đó mới là phiên người ta nhớ.
 *
 * 7% số phiên là phiên hưng phấn, 7% là phiên hoảng loạn. Độ dốc nhỏ nhưng đi
 * suốt phiên nên cộng dồn rất xa: điểm cân bằng với lực kéo về mốc neo nằm ở
 * e^(bias/REVERSION), tức khoảng ×2,5 cho phiên hưng phấn — trước khi chạm
 * `room`. Đo trên 500 phiên: ~8% số phiên có đỉnh ≥ +60%, ~10% có đáy ≤ −40%,
 * còn phiên thường vẫn quanh 35%.
 */
const MOOD_CHANCE = 0.07;
const MOOD_UP = 0.0014;
const MOOD_DOWN = -0.0016;

export function moodOf(seed, symbol) {
  const r = rnd(seed, symbol, 'mood');
  if (r < MOOD_CHANCE) return { name: 'euphoria', bias: MOOD_UP };
  if (r < MOOD_CHANCE * 2) return { name: 'panic', bias: MOOD_DOWN };
  return { name: 'normal', bias: 0 };
}

/**
 * Chế độ thị trường của một khối 15 phút. Xác suất chọn theo đúng cảm giác của
 * một sàn thật: phần lớn thời gian là đi ngang, sập thì hiếm nhưng sâu.
 *
 * ĐỘ DỐC PHẢI NHỎ HƠN TRẦN MỘT BƯỚC (sau khi nhân beta), nếu không mọi bước
 * trong khối đều bị kẹp và biểu đồ thành một đường thẳng kẻ bằng thước — đo
 * được: dốc vượt trần đẩy tỷ lệ bước chạm trần từ 8% lên 33%.
 */
export function regimeOf(seed, symbol, block) {
  const r = rnd(seed, symbol, 'regime', block);
  if (r < 0.30) return { name: 'range', drift: 0, vol: 0.6 };
  if (r < 0.48) return { name: 'up', drift: 0.0007, vol: 1.0 };
  if (r < 0.66) return { name: 'down', drift: -0.0007, vol: 1.0 };
  if (r < 0.78) return { name: 'rally', drift: 0.0013, vol: 1.4 };
  if (r < 0.90) return { name: 'crash', drift: -0.0015, vol: 1.6 };
  if (r < 0.945) return { name: 'mania', drift: 0.0020, vol: 1.9 };
  if (r < 0.985) return { name: 'collapse', drift: -0.0024, vol: 2.1 };
  // Cú sốc tin tức: một bước nhảy dựng đứng ở giữa khối, rồi thị trường tiêu hoá nó.
  return { name: 'shock', drift: 0, vol: 1.1, shockAt: Math.floor(rnd(seed, symbol, 'shock', block) * REGIME_SEGMENTS) };
}

/**
 * Dựng các mốc giá từ đầu phiên tới hết bước đang chạy — HÀM THUẦN.
 * `prices[i]` là giá tại mốc thời gian `start + i * step`.
 *
 * Chỉ MÁY CHỦ gọi hàm này (nó cầm `seed`); client chỉ nhận mảng kết quả.
 */
export function buildTicks({ symbol, anchor, basePrice, volatility, seed, startSec, nowSec, limit = TICK_WINDOW }) {
  const base = Number(anchor) || Number(basePrice) || 100;
  const floorRef = Number(basePrice) || base;
  // Mã biến động mạnh giật mạnh: HBANK 0,6 · HFILM 1 · HNEWS 1,4 · HARC 1,8.
  const beta = Math.max(0.4, (Number(volatility) || 0.05) / 0.05);
  const room = Math.min(1.2, MAX_SESSION_DRIFT * beta);
  const low = Math.max(floorRef * 0.2, base * (1 - room));
  const high = Math.min(floorRef * 5, base * (1 + room));

  const first = Math.floor(Number(startSec) / SEGMENT_SEC);
  // +1: mốc của bước ĐANG chạy, để client có hai đầu mà nội suy ra giá lúc này.
  const last = Math.floor(Number(nowSec) / SEGMENT_SEC) + 1;

  const mood = moodOf(seed, String(symbol));

  const prices = [];
  let price = base;
  for (let k = first; k <= last; k += 1) {
    const block = Math.floor(k / REGIME_SEGMENTS);
    const regime = regimeOf(seed, String(symbol), block);

    // Hệ số biến động của mã nhân vào CẢ độ dốc lẫn độ giật: nếu chỉ nhân vào
    // độ giật thì mọi mã cùng dốc như nhau và HBANK "ổn định nhất" chỉ còn là
    // một dòng chữ trong mô tả công ty.
    let move = (regime.drift + mood.bias + gauss(seed, String(symbol), k) * STEP_SIGMA * regime.vol) * beta
      // Neo về giá cơ bản: càng xa càng bị kéo mạnh.
      - REVERSION * Math.log(price / base);

    // Cú sốc tin tức trải qua 4 bước (2 phút) CÙNG MỘT CHIỀU. Trần 0,6% một
    // bước không dựng nổi cây nến dài, mà tin nóng ngoài đời cũng không nuốt
    // trong một nhịp — nó đẩy giá liên tiếp vài phút rồi thị trường mới tiêu hoá.
    const sinceShock = regime.shockAt === undefined ? -1 : k - block * REGIME_SEGMENTS - regime.shockAt;
    if (sinceShock >= 0 && sinceShock < 4) {
      move += (rnd(seed, String(symbol), 'jump', block) - 0.5) * 0.04 * beta;
    }

    price = Math.min(high, Math.max(low, price * (1 + clamp(move, MAX_SEGMENT_MOVE))));
    prices.push(Math.round(price * 100) / 100);
  }

  const cut = Math.max(0, prices.length - limit);
  return { step: SEGMENT_SEC, start: (first + cut) * SEGMENT_SEC, prices: prices.slice(cut) };
}

/**
 * Giá tại một thời điểm, nội suy giữa hai mốc — HÀM THUẦN, client và máy chủ
 * dùng CHUNG nên màn hình và ví không bao giờ ra hai con số.
 *
 * `company.ticks` là mảng mốc do máy chủ gửi xuống. Thiếu nó thì rơi về giá
 * chốt phiên, chứ không tự bịa ra một đường giá.
 */
export function priceAt(company, tsSec = Math.floor(Date.now() / 1000)) {
  if (!company) return 0;
  const ticks = company.ticks;
  const prices = ticks?.prices;
  if (!Array.isArray(prices) || prices.length < 2) {
    return Math.round((Number(company.sessionPrice ?? company.price ?? company.basePrice) || 0) * 100) / 100;
  }

  const step = Number(ticks.step) || SEGMENT_SEC;
  const x = (Number(tsSec) - Number(ticks.start)) / step;
  const i = Math.max(0, Math.min(prices.length - 2, Math.floor(x)));
  const f = Math.max(0, Math.min(1, x - i));
  const value = prices[i] + (prices[i + 1] - prices[i]) * f;

  return Math.round(value * (1 + Math.sin(Number(tsSec) / 7) * WIGGLE) * 100) / 100;
}

/**
 * Toàn bộ chi phí của một lệnh — HÀM THUẦN, dùng chung cho màn xác nhận, hoá
 * đơn và lệnh trừ ví. Ba nơi phải ra CÙNG một con số, nếu không sẽ có ngày
 * "màn hình nói 1.050, ví trừ 1.200".
 *
 * Mua:  trừ ví = giá trị + môi giới + sáng tạo + chuyển đổi
 * Bán:  về ví  = giá trị − môi giới − sáng tạo − chuyển đổi
 */
export function tradeCosts({ price, quantity, side, memberDenom }) {
  const gross = Math.round(Number(price) * Number(quantity));
  const brokerage = tradingFee(gross);
  const creativeFee = Math.floor(gross * CREATIVE_FEE_RATE);
  const crossDenom = isCrossDenom(memberDenom, BASE_DENOM);
  const conversionFee = crossDenom ? Math.floor(gross * STOCK_CONVERSION_FEE_RATE) : 0;
  const fees = brokerage + creativeFee + conversionFee;
  // Bán mà phí ăn hết tiền thì tiền VỀ là 0, không bao giờ âm: một con số âm ở
  // đây sẽ đi thẳng vào awardJoy và trừ ví người vừa bán.
  const total = side === 'buy' ? gross + fees : Math.max(0, gross - fees);

  return {
    gross,
    brokerage,
    creativeFee,
    conversionFee,
    crossDenom,
    fees,
    total,
    rates: {
      brokerage: TRADING_FEE_RATE,
      creative: CREATIVE_FEE_RATE,
      conversion: crossDenom ? STOCK_CONVERSION_FEE_RATE : 0,
    },
    quoteCode: STOCK_QUOTE_CODE,
    walletCode: denomOf(memberDenom).code,
    // Cùng số tiền đó viết theo đơn vị ví của người dùng, để họ đối chiếu được.
    totalInWallet: toDenom(total, memberDenom).amount,
  };
}

/**
 * GIÁ PHẢI TĂNG BAO NHIÊU THÌ MỚI HOÀ VỐN.
 *
 * Mua trả `gross × (1+f)`, bán nhận `gross × (1−f)`, nên hoà vốn khi giá bán
 * gấp `(1+f)/(1−f)` giá mua — KHÔNG phải "bằng tổng phí". Với f = 0,5% thì mốc
 * hoà vốn là ~1,01%, giống mọi ví vì sàn không còn phân biệt đơn vị ví nữa.
 *
 * Con số này phải TÍNH, đừng viết tay: bảo người học chốt lời ở một mốc sai là
 * dạy họ bán lúc đang lỗ.
 */
export function breakEvenPct(crossDenom) {
  const f = TRADING_FEE_RATE + CREATIVE_FEE_RATE + (crossDenom ? STOCK_CONVERSION_FEE_RATE : 0);
  return (1 + f) / (1 - f) - 1;
}

/**
 * Lãi/lỗ của một vị thế:
 *   lãi/lỗ = (giá hiện tại − giá vốn bình quân) × số lượng
 */
export function positionPL(position, price) {
  const cost = position.avgCost * position.quantity;
  const value = price * position.quantity;
  const unrealized = Math.round(value - cost);
  return {
    cost: Math.round(cost),
    value: Math.round(value),
    unrealized,
    unrealizedPct: cost > 0 ? Math.round((unrealized / cost) * 1e4) / 1e4 : 0,
  };
}
