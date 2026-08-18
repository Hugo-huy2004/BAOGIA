import StockCompany from '../models/StockCompany.js';
import StockPosition from '../models/StockPosition.js';
import ArcadeScore from '../models/ArcadeScore.js';
import JoyLedger from '../models/JoyLedger.js';
import UtilityOrder from '../models/UtilityOrder.js';
import { awardJoy } from '../utils/joyService.js';

/**
 * ĐỒNG HỒ PHIÊN CỦA RIÊNG SÀN — 09:00 · 15:00 · 21:00 giờ Việt Nam.
 *
 * Trước đây sàn mượn `sessionKey` của joyRateService. Hai thứ chỉ TÌNH CỜ chung
 * lịch: tỷ giá JOY có thể đổi sang nhịp khác bất cứ lúc nào, và hôm đó cổ tức
 * HBANK sẽ trả theo nhịp mới — 24 lần một ngày thay vì 3 — còn "kết quả kinh
 * doanh" cũng cộng vào giá 24 lần. Một mốc phiên là một quyết định của SÀN, nên
 * nó phải nằm ở đây.
 */
export const SESSION_HOURS_VN = [9, 15, 21];
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

/** Khoá phiên: "2026-08-18-09". Trước 09:00 vẫn thuộc phiên 21:00 hôm trước. */
export function sessionKey(date = new Date()) {
  const vn = new Date(date.getTime() + VN_OFFSET_MS);
  const hour = vn.getUTCHours();
  let session = [...SESSION_HOURS_VN].reverse().find((h) => hour >= h);
  if (session === undefined) {
    vn.setUTCDate(vn.getUTCDate() - 1);
    session = SESSION_HOURS_VN[SESSION_HOURS_VN.length - 1];
  }
  return `${vn.toISOString().slice(0, 10)}-${String(session).padStart(2, '0')}`;
}

/** Mốc bắt đầu (UTC) của một phiên. */
export function sessionStart(key) {
  const [date, hour] = [key.slice(0, 10), Number(key.slice(11, 13))];
  return new Date(new Date(`${date}T00:00:00.000Z`).getTime() + hour * 3600000 - VN_OFFSET_MS);
}

/**
 * Sàn chứng khoán ảo Hugo — bốn công ty, giá chạy bằng SỐ LIỆU THẬT.
 *
 * Sàn này để dạy, nên mọi con số phải giải thích được. Ba luật:
 *
 * 1. GIÁ ĐỔI VÌ CÔNG TY LÀM ĂN. Mỗi mã gắn với một mảng có thật của portal
 *    (rạp phim, trò chơi, tin tức, ví JOY). Mỗi phiên, hệ thống đo hoạt động
 *    của mảng đó trong 7 ngày rồi so với mức trung bình 30 ngày của chính nó —
 *    đúng khái niệm "earnings surprise" ngoài đời: thị trường không thưởng cho
 *    doanh nghiệp làm tốt, nó thưởng cho doanh nghiệp làm TỐT HƠN KỲ VỌNG.
 *
 * 2. RỦI RO ĐI CÙNG LỢI NHUẬN. Mỗi mã có `volatility` riêng (beta). HARC dao
 *    động mạnh nhất — lời nhanh, lỗ cũng nhanh; HBANK dao động thấp nhất nhưng
 *    trả cổ tức đều. Đây là bài học người mới hay trả giá đắt nhất để học.
 *
 * 3. BA PHIÊN MỘT NGÀY, GIÁ CHẠY LIÊN TỤC. Kết quả kinh doanh chốt lúc 09:00 ·
 *    15:00 · 21:00 giờ Việt Nam (chung mốc phiên với tỷ giá JOY) và đặt MỐC NEO
 *    của phiên. Trong phiên, giá đi theo đường ngẫu nhiên có hạt giống bí mật
 *    trong shared/stockPricing.js — hạt giống nằm ở máy chủ nên không ai đoán
 *    trước được, và mỗi bước bị chặn dưới mức phí khứ hồi.
 *
 * Toán giá và toán phí nằm ở shared/stockPricing.js — client dùng CHUNG file
 * đó, nên màn xác nhận và ví không bao giờ ra hai con số khác nhau.
 */
export {
  TRADING_FEE_RATE, MIN_FEE, STOCK_QUOTE_DENOM, STOCK_QUOTE_CODE, CREATIVE_FEE_RATE,
  TICK_WINDOW, MAX_SEGMENT_MOVE, tradingFee, tradeCosts, positionPL,
} from '../../shared/stockPricing.js';

import { buildTicks, priceAt, SEGMENT_SEC } from '../../shared/stockPricing.js';

export { buildTicks, priceAt, SEGMENT_SEC };

/**
 * HẠT GIỐNG của đường giá — thứ DUY NHẤT giữ cho sàn không đoán trước được.
 *
 * Công thức giá nằm trong bundle trình duyệt (client cần nó để nội suy), nên
 * bí mật không thể nằm ở công thức. Nếu hạt giống lộ, ai cũng dựng lại được
 * toàn bộ đường giá của phiên rồi mua đúng đáy bán đúng đỉnh — biên độ một
 * phiên tới ±45%, tức là in JOY. Nó KHÔNG BAO GIỜ được gửi xuống client.
 *
 * Trên production máy chủ không khởi động nổi nếu thiếu JWT_SECRET (xem
 * utils/secrets.js), nên nhánh dự phòng chỉ dùng được ở máy dev.
 */
const MARKET_SEED = process.env.STOCK_MARKET_SEED || process.env.JWT_SECRET || 'hugo-invest-dev';
const seedFor = (key) => `${MARKET_SEED}|${key}`;

const secondsOf = (date) => Math.floor(date.getTime() / 1000);

/**
 * Đường giá của một mã trong một phiên. Hàm thuần theo (hạt giống, phiên, mốc
 * neo) nên khởi động lại máy chủ không làm giá nhảy, và không cần ghi gì thêm.
 */
export function ticksFor(company, { key = sessionKey(), nowSec = Math.floor(Date.now() / 1000) } = {}) {
  return buildTicks({
    symbol: company.symbol,
    anchor: company.price,
    basePrice: company.basePrice,
    volatility: company.volatility,
    seed: seedFor(key),
    startSec: secondsOf(sessionStart(key)),
    nowSec,
  });
}

/** Giá đang khớp của một mã — mốc neo + đường giá của phiên hiện tại. */
export function livePrice(company, { key = sessionKey(), nowSec = Math.floor(Date.now() / 1000) } = {}) {
  return priceAt({ ...company, ticks: ticksFor(company, { key, nowSec }) }, nowSec);
}

/**
 * Lịch sử phiên, MỖI MỐC THỜI GIAN ĐÚNG MỘT ĐIỂM, cũ trước mới sau.
 *
 * Mốc phiên từng đổi (sàn mượn đồng hồ của bảng tỷ giá JOY, bên đó chuyển sang
 * nhịp giờ), nên dữ liệu cũ có hai điểm trùng giờ — biểu đồ nhận hai nến cùng
 * `time` và React kêu trùng key. Dọn ở CẢ hai đầu: chỗ ghi không đẻ thêm điểm
 * trùng, chỗ đọc chữa lành dữ liệu đã lỡ có, khỏi phải chạy migration.
 */
export function tidyHistory(history) {
  const byTime = new Map();
  for (const point of history || []) {
    const at = new Date(point.at).getTime();
    if (!Number.isFinite(at)) continue;
    // Điểm ghi sau thắng: nó là lần chốt phiên gần nhất của mốc đó.
    byTime.set(at, { at: new Date(at), price: point.price });
  }
  return [...byTime.entries()].sort((a, b) => a[0] - b[0]).map(([, point]) => point);
}

/** Phiên liền trước một phiên. */
export function previousSession(key) {
  return sessionKey(new Date(sessionStart(key).getTime() - 1000));
}

/**
 * Giá ĐÓNG CỬA của phiên trước: mốc cuối cùng của đường giá phiên đó. Phiên mới
 * phải nối tiếp từ đây chứ không quay về mốc neo cũ — nếu không, mỗi lần chốt
 * phiên giá lại búng ngược về chỗ cũ và mọi lãi/lỗ trong phiên bốc hơi.
 */
function closeOf(company, key) {
  const ticks = ticksFor(company, {
    key: previousSession(key),
    nowSec: secondsOf(sessionStart(key)) - SEGMENT_SEC,
  });
  return ticks.prices[ticks.prices.length - 1] ?? company.price;
}

// Trần dao động một phiên: ±10% quanh giá phiên trước.
const MAX_MOVE = 0.1;
const WINDOW_DAYS = 7;
const BASELINE_DAYS = 30;

export const COMPANIES = [
  {
    symbol: 'HFILM',
    name: 'Hugo Film',
    sector: 'Giải trí · Rạp phim',
    description:
      'Vận hành rạp Chill Premium và HugoRadio. Doanh thu đo bằng số JOY thành viên chi ra mua token xem/nghe trong kỳ — bán được nhiều vé thì công ty khoẻ.',
    sharesOutstanding: 120000,
    basePrice: 100,
    volatility: 0.05,
    dividendRate: 0,
    signal: 'mediaRevenue',
  },
  {
    symbol: 'HARC',
    name: 'Hugo Arcade',
    sector: 'Trò chơi',
    description:
      'Sở hữu toàn bộ trò chơi trong HugoArcade. Doanh thu đo bằng số người chơi có ghi điểm trong kỳ. Đây là mã BIẾN ĐỘNG MẠNH NHẤT sàn: lượt chơi lên xuống theo mùa thi, nghỉ hè, game mới.',
    sharesOutstanding: 80000,
    basePrice: 60,
    volatility: 0.09,
    dividendRate: 0,
    signal: 'arcadePlays',
  },
  {
    symbol: 'HNEWS',
    name: 'Hugo News',
    sector: 'Truyền thông',
    description:
      'Toà soạn của tab Hôm Nay. Doanh thu đo bằng số lượt đọc tin được ghi nhận. Ngành truyền thông sống bằng lượng đọc, nên tin nóng đẩy giá lên nhanh và nguội cũng nhanh.',
    sharesOutstanding: 100000,
    basePrice: 45,
    volatility: 0.07,
    dividendRate: 0,
    signal: 'newsReads',
  },
  {
    symbol: 'HBANK',
    name: 'Hugo Bank',
    sector: 'Tài chính',
    description:
      'Giữ ví JOY, cho vay JOYlater và thu phí chuyển đổi. Doanh thu đo bằng lượng JOY luân chuyển qua vay và chuyển tiền. Biến động thấp nhất sàn nhưng TRẢ CỔ TỨC mỗi phiên — đúng kiểu cổ phiếu ngân hàng ngoài đời.',
    sharesOutstanding: 150000,
    basePrice: 80,
    volatility: 0.03,
    dividendRate: 0.0015,
    signal: 'bankFlow',
  },
];

/**
 * Giá phiên kế tiếp — HÀM THUẦN, để kiểm chứng không cần database.
 *
 * surprise = hoạt động 7 ngày / trung bình 30 ngày − 1
 *   > 0: làm tốt hơn kỳ vọng → giá lên
 *   < 0: kém hơn kỳ vọng     → giá xuống
 * move = (surprise × volatility + nhịp thị trường chung) và bị kẹp trong ±10%.
 */
export function nextPrice({ price, basePrice, volatility, activity, average, market = 0 }) {
  const surprise = average > 0 ? activity / average - 1 : 0;
  const clampedSurprise = Math.max(-1, Math.min(1, surprise));
  const move = Math.max(-MAX_MOVE, Math.min(MAX_MOVE, clampedSurprise * volatility + market));

  // Sàn ảo vẫn phải có sàn/trần tuyệt đối: giá không bao giờ về 0 (công ty
  // không phá sản trong bài học này) và không vượt 5 lần giá niêm yết đầu.
  const raw = price * (1 + move);
  const next = Math.max(basePrice * 0.2, Math.min(basePrice * 5, raw));

  return {
    price: Math.round(next * 100) / 100,
    surprise: Math.round(clampedSurprise * 1e4) / 1e4,
    move: Math.round(move * 1e4) / 1e4,
  };
}

/** Giá vốn bình quân sau khi mua thêm — bình quân gia quyền, như sàn thật. */
export function applyBuy(position, quantity, price) {
  const totalCost = position.avgCost * position.quantity + price * quantity;
  const totalQty = position.quantity + quantity;
  return {
    quantity: totalQty,
    avgCost: totalQty > 0 ? Math.round((totalCost / totalQty) * 100) / 100 : 0,
  };
}

/**
 * Bán: lãi/lỗ chốt = (giá bán − giá vốn) × số lượng, ĐÃ trừ TOÀN BỘ phí (môi
 * giới + sáng tạo + chuyển đổi). Trừ thiếu một khoản là dạy người học một con
 * số lãi không có thật.
 */
export function applySell(position, quantity, price, fee) {
  const proceeds = price * quantity;
  const cost = position.avgCost * quantity;
  return {
    quantity: position.quantity - quantity,
    // Giá vốn không đổi khi bán bớt — phần còn lại vẫn mua ở giá đó.
    avgCost: position.quantity - quantity > 0 ? position.avgCost : 0,
    proceeds: Math.round(proceeds - fee),
    realizedPL: Math.round(proceeds - cost - fee),
  };
}

// ── Đo hoạt động thật của từng mảng ──────────────────────────────────────────

async function ledgerVolume(sources, days) {
  const since = new Date(Date.now() - days * 86400000);
  const rows = await JoyLedger.aggregate([
    { $match: { createdAt: { $gte: since }, source: { $in: sources } } },
    { $group: { _id: null, total: { $sum: { $abs: '$amount' } }, count: { $sum: 1 } } },
  ]);
  return { total: rows[0]?.total || 0, count: rows[0]?.count || 0 };
}

async function measure(days) {
  const since = new Date(Date.now() - days * 86400000);
  const [arcade, news, bank, media] = await Promise.all([
    // ArcadeScore KHÔNG có `createdAt` (schema không bật timestamps), nên bản
    // trước lọc theo trường đó và luôn đếm được 0 — HARC đứng giá vĩnh viễn.
    // `lastPlayedAt` là mốc duy nhất có thật trong tài liệu đó.
    ArcadeScore.countDocuments({ lastPlayedAt: { $gte: since } }),
    ledgerVolume(['info_read_bonus', 'info_bonus'], days),
    ledgerVolume(['joylater_open', 'joylater_repay', 'joy_gift_sent', 'joy_gift_received', 'member_transfer_out', 'member_transfer_in'], days),
    // Doanh thu bán token xem/nghe (rạp + radio dùng chung kho token). Bản
    // trước cộng `radioTokens.weeklyUsedMinutes` của mọi Bio — một con số TÍCH
    // LUỸ, không có mốc thời gian, nên cửa sổ 7 ngày và nền 30 ngày ra ĐÚNG
    // BẰNG NHAU: surprise = 30/7 − 1 → luôn bị kẹp ở +1, tức HFILM tăng kịch
    // trần mỗi phiên, mãi mãi. Đơn hàng có createdAt nên đo được thật.
    UtilityOrder.aggregate([
      { $match: { createdAt: { $gte: since }, status: { $ne: 'cancelled' }, productName: /token/i } },
      { $group: { _id: null, total: { $sum: '$priceJoy' } } },
    ]),
  ]);

  return {
    arcadePlays: arcade,
    newsReads: news.count,
    bankFlow: bank.total,
    mediaRevenue: Math.round(media[0]?.total || 0),
  };
}

/**
 * Tạo bốn công ty ở lần chạy đầu tiên, và giữ HỒ SƠ công ty khớp với mã nguồn.
 *
 * Phần mô tả/ngành/beta là cấu hình do tác giả viết nên luôn ghi đè; giá, lịch
 * sử và số cổ phần đang lưu hành thì chỉ đặt lúc tạo — ghi đè mấy thứ đó là xoá
 * sạch diễn biến thị trường mỗi lần khởi động lại máy chủ.
 */
export async function seedCompanies() {
  for (const company of COMPANIES) {
    await StockCompany.findOneAndUpdate(
      { symbol: company.symbol },
      {
        $set: {
          name: company.name,
          sector: company.sector,
          description: company.description,
          volatility: company.volatility,
          dividendRate: company.dividendRate,
        },
        $setOnInsert: {
          symbol: company.symbol,
          sharesOutstanding: company.sharesOutstanding,
          basePrice: company.basePrice,
          price: company.basePrice,
          prevPrice: company.basePrice,
          history: [{ at: new Date(), price: company.basePrice }],
        },
      },
      { upsert: true, new: true }
    );
  }
}

/**
 * Khớp giá cho phiên hiện tại. Chạy tối đa một lần mỗi phiên; mọi lượt xem sau
 * đó chỉ đọc lại bản ghi, nên sàn không thêm tải cho máy chủ.
 */
let lastSession = null;
export async function runSession({ force = false } = {}) {
  const key = sessionKey();
  if (!force && lastSession === key) return { session: key, skipped: true };

  await seedCompanies();
  const companies = await StockCompany.find({});
  const already = companies.every((c) => c.lastSignal?.sessionKey === key);
  if (!force && already) {
    lastSession = key;
    return { session: key, skipped: true };
  }

  const [recent, baseline] = await Promise.all([measure(WINDOW_DAYS), measure(BASELINE_DAYS)]);
  const at = sessionStart(key);

  for (const company of companies) {
    const meta = COMPANIES.find((c) => c.symbol === company.symbol);
    if (!meta) continue;

    const activity = recent[meta.signal] || 0;
    // Trung bình một tuần trong 30 ngày, để so cùng đơn vị với cửa sổ 7 ngày.
    const average = (baseline[meta.signal] || 0) * (WINDOW_DAYS / BASELINE_DAYS);

    // Kết quả kinh doanh tác động lên GIÁ ĐÓNG CỬA phiên trước, không lên mốc
    // neo cũ: bản trước bỏ qua toàn bộ đường giá trong phiên, nên cứ tới giờ
    // chốt là giá búng về chỗ cũ và người đang lãi trong phiên mất trắng.
    const close = closeOf(company, key);
    const { price, surprise, move } = nextPrice({
      price: close,
      basePrice: company.basePrice,
      volatility: company.volatility,
      activity,
      average,
    });

    company.prevPrice = close;
    company.price = price;
    company.lastSignal = { activity, average: Math.round(average), surprise, market: 0, move, sessionKey: key };
    // Giữ 90 phiên gần nhất (khoảng một tháng) — đủ vẽ biểu đồ, không phình.
    company.history = tidyHistory([...(company.history || []), { at, price }]).slice(-90);
    company.markModified('history');
    await company.save();

    // Cổ tức tính trên giá VỪA CHỐT của phiên này.
    await payDividends(company, key);
  }

  lastSession = key;
  return { session: key, skipped: false };
}

/**
 * Cổ tức: trả cho người đang nắm giữ, mỗi phiên một lần, chỉ với mã có
 * `dividendRate`. Chạy sau khi giá phiên mới đã chốt, nên cổ tức tính trên giá
 * vừa khớp — đúng cách sàn thật chốt danh sách cổ đông rồi mới chi trả.
 */
export async function payDividends(company, session) {
  if (!company.dividendRate) return { paid: 0, holders: 0 };

  const positions = await StockPosition.find({ symbol: company.symbol, quantity: { $gt: 0 } });
  let paid = 0;
  let holders = 0;

  for (const position of positions) {
    const amount = Math.round(company.price * company.dividendRate * position.quantity);
    if (amount <= 0) continue;
    try {
      await awardJoy(
        position.email,
        amount,
        'stock_dividend',
        `Cổ tức ${company.symbol} phiên ${session}: ${position.quantity} cổ phiếu`,
        { refId: company.symbol },
      );
      position.dividendReceived = (position.dividendReceived || 0) + amount;
      await position.save();
      paid += amount;
      holders += 1;
    } catch (error) {
      // Ví bị đóng băng hay tài khoản đã xoá: bỏ qua một người, không chặn cả phiên.
      console.error(`[STOCK] Không trả được cổ tức cho ${position.email}:`, error.message);
    }
  }

  return { paid, holders };
}
