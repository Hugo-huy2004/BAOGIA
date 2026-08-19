// Toán nến của biểu đồ sàn ảo — HÀM THUẦN, tách khỏi phần vẽ để kiểm chứng
// được bằng node: server/scripts/check-invest-chart.mjs

// perCandle đếm theo BƯỚC GIÁ (SEGMENT_SEC = 30 giây), không phải theo phút.
// Đổi SEGMENT_SEC thì phải đổi luôn mấy con số này, nếu không nhãn "5 phút"
// nói một đằng mà nến gộp một nẻo.
export const CANDLE_FRAMES = [
  { key: "2m", label: "2 phút", perCandle: 4 },
  { key: "5m", label: "5 phút", perCandle: 10 },
  { key: "15m", label: "15 phút", perCandle: 30 },
  { key: "session", label: "Phiên", perCandle: 0 },
];

/**
 * Gộp các mốc giá một phút của máy chủ thành nến.
 *
 * Mốc ĐÓNG của nến này chính là mốc MỞ của nến sau (nên lát cắt dài
 * perCandle + 1), đúng như một đường giá liên tục — cắt rời từng khúc thì giữa
 * hai nến hiện ra một khe trống không có thật.
 *
 * Giá giữa hai mốc đi thẳng (priceAt nội suy tuyến tính), nên đỉnh/đáy thật
 * của đoạn luôn rơi đúng vào một mốc ⇒ bóng nến là bóng thật.
 */
export function candlesFromTicks(ticks, perCandle, segmentSec = 60) {
  const prices = ticks?.prices;
  const size = Math.max(1, Math.floor(perCandle) || 1);
  if (!Array.isArray(prices) || prices.length < size + 1) return [];

  const step = Number(ticks.step) || segmentSec;
  const start = Number(ticks.start) || 0;
  const out = [];
  for (let i = 0; i + size < prices.length; i += size) {
    const span = prices.slice(i, i + size + 1);
    out.push({
      time: (start + i * step) * 1000,
      open: span[0],
      close: span[span.length - 1],
      high: Math.max(...span),
      low: Math.min(...span),
    });
  }
  return out;
}

/**
 * NẾN ĐANG HÌNH THÀNH — phần đuôi chưa đủ một nến, cộng giá đang chạy.
 *
 * `candlesFromTicks` chỉ trả về nến ĐÃ ĐÓNG (nhóm đủ `perCandle` mốc), nên
 * biểu đồ chỉ nhúc nhích mỗi lần máy chủ gửi mốc mới — nhìn như đứng hình.
 * Cây nến này là cây bên phải cùng, lớn dần theo từng giây đúng như app chứng
 * khoán thật: mở tại mốc biên gần nhất, đóng tại GIÁ ĐANG KHỚP.
 *
 * Trả `null` khi không có gì đang hình thành — đừng vẽ một cây nến rỗng.
 */
export function formingCandle(ticks, perCandle, livePrice, segmentSec = 60) {
  const prices = ticks?.prices;
  const size = Math.max(1, Math.floor(perCandle) || 1);
  if (!Array.isArray(prices) || prices.length < 2) return null;

  const step = Number(ticks.step) || segmentSec;
  const start = Number(ticks.start) || 0;
  // Mốc biên của nến cuối cùng đã đóng; phần từ đó trở đi là nến đang chạy.
  const closedCount = Math.floor((prices.length - 1) / size);
  const from = closedCount * size;
  const span = prices.slice(from);
  const live = Number(livePrice);
  const points = Number.isFinite(live) && live > 0 ? [...span, live] : span;
  if (points.length < 2) return null;

  return {
    time: (start + from * step) * 1000,
    open: points[0],
    close: points[points.length - 1],
    high: Math.max(...points),
    low: Math.min(...points),
    live: true,
  };
}

/**
 * Nến của các phiên đã chốt. Lịch sử chỉ lưu GIÁ CHỐT từng phiên — không có
 * cao/thấp trong phiên — nên nến ở khung này KHÔNG CÓ BÓNG (`noWick`). Thà
 * thiếu bóng còn hơn vẽ một cái bóng không ai đo được.
 */
export function candlesFromHistory(history) {
  if (!Array.isArray(history) || history.length < 2) return [];
  return history.slice(1).map((point, index) => {
    const open = Number(history[index].price);
    const close = Number(point.price);
    return {
      time: new Date(point.at).getTime(),
      open,
      close,
      high: Math.max(open, close),
      low: Math.min(open, close),
      noWick: true,
    };
  });
}

/** Trung bình động n nến; chưa đủ nến thì trả null chứ không vẽ dối một đoạn. */
export function movingAverage(closes, n) {
  let sum = 0;
  return closes.map((value, index) => {
    sum += value;
    if (index >= n) sum -= closes[index - n];
    return index >= n - 1 ? sum / n : null;
  });
}

/**
 * Khối lượng MÔ PHỎNG: sàn ảo chưa có sổ lệnh nên không có khối lượng thật để
 * bày. Suy từ biên độ nến (thị trường thật: giá càng giật, khối lượng càng
 * lớn) cộng nhiễu cố định theo mốc thời gian — cố định để cột không nhảy múa
 * mỗi lần vẽ lại. Chú giải dưới biểu đồ ghi rõ "KL mô phỏng".
 */
export function volumeOf(candle) {
  const range = candle.open > 0 ? (candle.high - candle.low) / candle.open : 0;
  const noise = Math.abs(Math.sin(candle.time / 60000) * 43758.5453) % 1;
  return Math.round(1000 * (0.3 + range * 45) * (0.6 + noise * 0.8));
}
