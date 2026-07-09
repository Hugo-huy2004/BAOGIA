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

// Extract giá số từ string (e.g., "Từ 999.000đ" -> 999000)
export function parsePriceString(priceStr) {
  const match = priceStr.match(/(\d+[\d.,]*)/);
  if (!match) return 0;

  return parseInt(match[1].replace(/[.,]/g, ""), 10);
}
