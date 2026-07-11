import { vndToUsdWithFee } from "../services/exchangeRateService";

// Format giá theo language
export function formatPrice(vndPrice, language = "vi") {
  if (language === "en") {
    // Chuyển sang USD với phí VCB
    const usdPrice = vndToUsdWithFee(vndPrice);
    return `$${usdPrice.toFixed(2)}`;
  }

  // VNĐ format
  if (typeof vndPrice === "string") {
    return vndPrice; // đã format sẵn
  }

  return `Từ ${new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(vndPrice)}`;
}

// Chuyển chuỗi giá VI ("Từ 299.000đ", "399.000đ/tháng") thành nhãn USD
// theo tỷ giá VCB realtime. Nguồn chân lý duy nhất là giá VND trong locale vi.
export function usdPriceLabel(viPrice) {
  if (typeof viPrice !== "string") return viPrice;
  const vnd = parsePriceString(viPrice);
  if (!vnd) return viPrice;
  const usd = vndToUsdWithFee(vnd);
  const prefix = /^\s*Từ/i.test(viPrice) ? "From " : "";
  const suffix = viPrice.includes("/tháng") ? "/mo" : "";
  return `${prefix}$${usd.toFixed(2)}${suffix}`;
}

// Ghi đè price/oldPrice bằng giá USD quy đổi từ locale vi khi đang xem EN
export function withUsdPrices(i18n, baseKey, data) {
  if (!i18n.language?.startsWith("en")) return data;
  const tVi = i18n.getFixedT("vi");
  const out = { ...data };
  for (const field of ["price", "oldPrice"]) {
    const viValue = tVi(`${baseKey}.${field}`);
    if (viValue && viValue !== `${baseKey}.${field}`) out[field] = usdPriceLabel(viValue);
  }
  return out;
}

// Extract giá số từ string (e.g., "Từ 999.000đ" -> 999000)
export function parsePriceString(priceStr) {
  const match = priceStr.match(/(\d+[\d.,]*)/);
  if (!match) return 0;

  return parseInt(match[1].replace(/[.,]/g, ""), 10);
}
