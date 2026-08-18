import StockCompany from '../models/StockCompany.js';
import StockPosition from '../models/StockPosition.js';
import ArcadeScore from '../models/ArcadeScore.js';
import JoyLedger from '../models/JoyLedger.js';
import Bio from '../models/Bio.js';
import { awardJoy } from '../utils/joyService.js';
import { sessionKey, sessionStart } from '../utils/joyRateService.js';
import { BASE_DENOM, CROSS_DENOM_FEE, denomOf, isCrossDenom, toDenom } from '../../shared/joyCurrency.js';
import { TRANSFER_FEE_RATE } from '../../shared/joyPrices.js';

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
 * 3. BA PHIÊN MỘT NGÀY. Giá khớp lúc 09:00 · 15:00 · 21:00 giờ Việt Nam, dùng
 *    chung mốc phiên với tỷ giá JOY. Giữa hai phiên giá đứng yên: người học
 *    nhìn thấy rõ "chốt phiên" là gì, và máy chủ chỉ tính 3 lần/ngày.
 */

// Phí giao dịch mỗi chiều — sàn thật cũng thu, và nó là lý do "lướt sóng" liên
// tục thường lỗ dù giá không đổi.
export const TRADING_FEE_RATE = 0.005;
export const MIN_FEE = 1;

/**
 * MỌI CỔ PHIẾU NIÊM YẾT BẰNG ĐƠN VỊ GỐC (Kavo, bản tiếng Anh) — xem BASE_DENOM
 * trong shared/joyCurrency.js. Sàn chỉ có MỘT bảng giá cho tất cả mọi người,
 * đúng như một sàn thật niêm yết bằng một đồng tiền duy nhất.
 *
 * Hệ quả: ai để ví ở đơn vị khác thì mỗi lệnh là một lần ĐỔI TIỀN, nên phải
 * chịu phí chuyển đổi 15% — y hệt việc mua cổ phiếu Mỹ bằng tiền Việt ngoài
 * đời. Cộng thêm phí sáng tạo 5% như mọi giao dịch JOY khác.
 */
export const STOCK_QUOTE_DENOM = BASE_DENOM;
export const STOCK_QUOTE_CODE = denomOf(BASE_DENOM).code;
export const CREATIVE_FEE_RATE = TRANSFER_FEE_RATE;

/**
 * Toàn bộ chi phí của một lệnh — HÀM THUẦN, dùng chung cho màn xác nhận và lệnh
 * trừ ví. Hai bên phải ra CÙNG một con số, nếu không sẽ có ngày "màn hình nói
 * 1.050, ví trừ 1.200".
 *
 * Mua:  trừ ví = giá trị + phí môi giới + phí sáng tạo + phí chuyển đổi
 * Bán:  về ví  = giá trị − phí môi giới − phí sáng tạo − phí chuyển đổi
 */
export function tradeCosts({ price, quantity, side, memberDenom }) {
  const gross = Math.round(price * quantity);
  const brokerage = tradingFee(gross);
  const creativeFee = Math.floor(gross * CREATIVE_FEE_RATE);
  const crossDenom = isCrossDenom(memberDenom, BASE_DENOM);
  const conversionFee = crossDenom ? Math.floor(gross * CROSS_DENOM_FEE) : 0;
  const fees = brokerage + creativeFee + conversionFee;

  return {
    gross,
    brokerage,
    creativeFee,
    conversionFee,
    crossDenom,
    fees,
    // Số JOY gốc thật sự rời ví (mua) hoặc về ví (bán).
    total: side === 'buy' ? gross + fees : gross - fees,
    rates: {
      brokerage: TRADING_FEE_RATE,
      creative: CREATIVE_FEE_RATE,
      conversion: crossDenom ? CROSS_DENOM_FEE : 0,
    },
    quoteCode: STOCK_QUOTE_CODE,
    walletCode: denomOf(memberDenom).code,
    // Cùng số tiền đó viết theo đơn vị ví của người dùng, để họ đối chiếu được.
    totalInWallet: toDenom(side === 'buy' ? gross + fees : gross - fees, memberDenom).amount,
  };
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
      'Vận hành rạp Chill Premium. Doanh thu đo bằng số phút thành viên thật sự ngồi xem phim — càng nhiều người xem, công ty càng khoẻ.',
    sharesOutstanding: 120000,
    basePrice: 100,
    volatility: 0.05,
    dividendRate: 0,
    signal: 'watchMinutes',
  },
  {
    symbol: 'HARC',
    name: 'Hugo Arcade',
    sector: 'Trò chơi',
    description:
      'Sở hữu toàn bộ trò chơi trong HugoArcade. Doanh thu đo bằng số lượt chơi có ghi điểm. Đây là mã BIẾN ĐỘNG MẠNH NHẤT sàn: lượt chơi lên xuống theo mùa thi, nghỉ hè, game mới.',
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

/** Phí một lệnh: 0,5% giá trị, tối thiểu 1 JOY. */
export function tradingFee(value) {
  return Math.max(MIN_FEE, Math.round(Math.abs(value) * TRADING_FEE_RATE));
}

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

/**
 * Lãi/lỗ của một vị thế. Đây là công thức người học phải thuộc:
 *   lãi/lỗ = (giá hiện tại − giá vốn bình quân) × số lượng
 *   % lãi/lỗ = lãi/lỗ / (giá vốn × số lượng)
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
  const [arcade, news, bank, tokens] = await Promise.all([
    ArcadeScore.countDocuments({ createdAt: { $gte: new Date(Date.now() - days * 86400000) } }),
    ledgerVolume(['info_read_bonus', 'info_bonus'], days),
    ledgerVolume(['joylater_open', 'joylater_repay', 'joy_gift_sent', 'joy_gift_received', 'member_transfer_out', 'member_transfer_in'], days),
    Bio.aggregate([{ $group: { _id: null, minutes: { $sum: '$radioTokens.weeklyUsedMinutes' } } }]),
  ]);

  return {
    arcadePlays: arcade,
    newsReads: news.count,
    bankFlow: bank.total,
    // Phút xem/nghe đã dùng trong tuần — kho token dùng chung của rạp và radio.
    watchMinutes: Math.round(tokens[0]?.minutes || 0),
  };
}

/** Tạo bốn công ty ở lần chạy đầu tiên. */
export async function seedCompanies() {
  for (const company of COMPANIES) {
    await StockCompany.findOneAndUpdate(
      { symbol: company.symbol },
      {
        $setOnInsert: {
          symbol: company.symbol,
          name: company.name,
          sector: company.sector,
          description: company.description,
          sharesOutstanding: company.sharesOutstanding,
          basePrice: company.basePrice,
          price: company.basePrice,
          prevPrice: company.basePrice,
          volatility: company.volatility,
          dividendRate: company.dividendRate,
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

    const { price, surprise, move } = nextPrice({
      price: company.price,
      basePrice: company.basePrice,
      volatility: company.volatility,
      activity,
      average,
    });

    company.prevPrice = company.price;
    company.price = price;
    company.lastSignal = { activity, average: Math.round(average), surprise, market: 0, move, sessionKey: key };
    company.history.push({ at, price });
    // Giữ 90 phiên gần nhất (khoảng một tháng) — đủ vẽ biểu đồ, không phình.
    if (company.history.length > 90) company.history = company.history.slice(-90);
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
