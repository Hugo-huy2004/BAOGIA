// Vietcombank-based USD/VND exchange rate
// Phí chuyển đổi Vietcombank: ~0.5% (buy) và sell rate
// Source: Vietcombank current rates + fee adjustment

const VCB_BUY_FEE = 0.005; // 0.5% phí mua USD
const VCB_SELL_FEE = 0.005; // 0.5% phí bán USD

// Tỷ giá tham khảo từ Vietcombank (cập nhật thủ công)
// Fetch realtime từ: https://www.vietcombank.com.vn/en/personal/online-service/exchange-rate
const VIETCOMBANK_BASE_RATE = {
  usdToVnd: 24500, // 1 USD = 24,500 VNĐ (tỷ giá VCB trung bình)
  lastUpdated: new Date().toISOString(),
};

const CACHE_KEY = "vcb_exchange_rate";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 giờ

export async function getVietcombankRate() {
  // Kiểm tra cache
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    const { rate, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_DURATION) {
      return rate;
    }
  }

  try {
    // Thử fetch từ public API
    const response = await fetch(
      "https://api.exchangerate-api.com/v4/latest/USD",
      { signal: AbortSignal.timeout(5000) }
    );

    if (response.ok) {
      const data = await response.json();
      const rate = data.rates?.VND || VIETCOMBANK_BASE_RATE.usdToVnd;
      
      // Cache result
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ rate, timestamp: Date.now() })
      );
      
      return rate;
    }
  } catch (error) {
    console.warn("Failed to fetch real-time exchange rate, using fallback", error);
  }

  // Fallback: dùng tỷ giá cố định từ Vietcombank
  return VIETCOMBANK_BASE_RATE.usdToVnd;
}

// Lấy tỷ giá hiện tại từ cache hoặc fallback (sync)
function getCurrentRate() {
  if (typeof window === "undefined") return VIETCOMBANK_BASE_RATE.usdToVnd;

  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    try {
      const { rate } = JSON.parse(cached);
      return rate;
    } catch {
      return VIETCOMBANK_BASE_RATE.usdToVnd;
    }
  }
  return VIETCOMBANK_BASE_RATE.usdToVnd;
}

// Tính giá USD với phí chuyển đổi VCB
export function vndToUsdWithFee(vndPrice) {
  const rate = getCurrentRate();

  // Giá USD = Giá VNĐ / (Tỷ giá + phí)
  const adjustedRate = rate * (1 + VCB_BUY_FEE);

  return Math.round((vndPrice / adjustedRate) * 100) / 100;
}

// Tính giá VNĐ từ USD
export function usdToVndWithFee(usdPrice) {
  const rate = getCurrentRate();

  // Giá VNĐ = Giá USD * (Tỷ giá - phí)
  const adjustedRate = rate * (1 - VCB_SELL_FEE);

  return Math.round(usdPrice * adjustedRate);
}

// Cập nhật tỷ giá thủ công (nếu cần)
export function updateExchangeRate(newRate) {
  localStorage.setItem(
    CACHE_KEY,
    JSON.stringify({ rate: newRate, timestamp: Date.now() })
  );
}
