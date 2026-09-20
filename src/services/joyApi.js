// Client for the JOY wallet's phone-transfer and daily-mission endpoints
// (server/routes/joyRoutes.js, server/routes/companionRoutes.js).
const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.startsWith("http")) return envUrl;
  if (typeof window !== "undefined") return `${window.location.origin}${envUrl || "/api"}`;
  return "/api";
};

async function parseOrThrow(res) {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Đã có lỗi xảy ra.");
  return data;
}

function validateJoyQrPayload(payload) {
  if (!payload || typeof payload !== "string") {
    throw new Error("Mã JOY không hợp lệ.");
  }
  // JOY QR tokens are always 10 bytes encoded as 14 base64url chars.
  if (!/^[A-Za-z0-9_-]{14}$/.test(payload)) {
    throw new Error("Mã JOY không hợp lệ hoặc đã hết hạn.");
  }
}

export async function resolvePhone(phone) {
  const res = await fetch(`${getApiUrl()}/joy/resolve-phone?phone=${encodeURIComponent(phone)}`);
  return parseOrThrow(res);
}

export async function searchJoyUser(q, email) {
  const res = await fetch(`${getApiUrl()}/joy/search-user?q=${encodeURIComponent(q)}&email=${encodeURIComponent(email || "")}`);
  return parseOrThrow(res);
}

export async function getJoyQrPayload(email) {
  const res = await fetch(`${getApiUrl()}/joy/qr-payload?email=${encodeURIComponent(email)}`, {
    credentials: "include"
  });
  return parseOrThrow(res);
}

export async function resolveJoyQr(payload) {
  if (!payload || typeof payload !== "string") {
    throw new Error("Mã JOY không hợp lệ.");
  }
  let cleanPayload = payload.trim();
  if (cleanPayload.includes("://") || cleanPayload.includes("?ref=")) {
    try {
      const u = new URL(cleanPayload, window.location.origin);
      cleanPayload = u.searchParams.get("ref") || u.pathname.split("/").pop() || cleanPayload;
    } catch {}
  }

  // 1. Try 14-char signed token
  if (/^[A-Za-z0-9_-]{14}$/.test(cleanPayload)) {
    try {
      const res = await fetch(`${getApiUrl()}/joy/resolve-qr?payload=${encodeURIComponent(cleanPayload)}`);
      const data = await parseOrThrow(res);
      if (data && data.success !== false) return data;
    } catch {}
  }

  // 2. Fallback: Search user by Referral Code / Email / Query
  try {
    const searchResults = await searchJoyUser(cleanPayload, "");
    if (searchResults && searchResults.length > 0) {
      return searchResults[0];
    }
  } catch {}

  throw new Error("Mã JOY không hợp lệ hoặc không tìm thấy người nhận.");
}

export async function transferJoy({ fromEmail, toPhone, toReferralCode, toEmail, amount, message, pin, otp, idempotencyKey }) {
  const res = await fetch(`${getApiUrl()}/joy/transfer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fromEmail, toPhone, toReferralCode, toEmail, amount, message, pin, otp, idempotencyKey }),
    credentials: "include"
  });
  const data = await res.json();
  // Server đòi thêm lớp xác thực (PIN/OTP) không phải LỖI — trả `code` để UI mở
  // đúng bước nhập, thay vì ném ra một thông báo đỏ.
  if (res.status === 428 && data.code) return { stepUp: data.code, message: data.error };
  if (!res.ok) throw new Error(data.error || "Đã có lỗi xảy ra.");
  return data;
}

export async function fetchJoyHistory({ limit = 50, days = 30 } = {}) {
  const res = await fetch(
    `${getApiUrl()}/joy/history?limit=${limit}&days=${days}`,
    { credentials: "include" }
  );
  const data = await parseOrThrow(res);
  return { transactions: data.transactions || [], summary: data.summary || null };
}

const vouchersFromBio = (bio) => {
  const vouchers = Array.isArray(bio?.serviceVouchers)
    ? bio.serviceVouchers.map((voucher) => ({
        code: voucher.code,
        label: voucher.label,
        percent: voucher.percent,
        scope: voucher.scope,
        issuedAt: voucher.issuedAt,
        expiresAt: voucher.expiresAt,
        usedAt: voucher.usedAt,
      }))
    : [];

  if (bio?.birthdayVoucherCode && !bio?.birthdayVoucherClaimed) {
    vouchers.push({
      code: bio.birthdayVoucherCode,
      label: "Mã sinh nhật cũ · +14 ngày hạn dùng tài khoản",
      percent: 0,
      scope: "legacy_birthday",
      issuedAt: null,
      expiresAt: null,
      usedAt: null,
    });
  }
  return vouchers;
};

let supportsAggregatedPerks = true;

async function fetchLegacyJoyPerks(bio) {
  const [spinRes, ordersRes] = await Promise.all([
    fetch(`${getApiUrl()}/joy/birthday-spin`, { credentials: "include" }),
    fetch(`${getApiUrl()}/utility-store/orders`, { credentials: "include" }),
  ]);
  const [spin, rawOrders] = await Promise.all([
    parseOrThrow(spinRes),
    parseOrThrow(ordersRes),
  ]);

  const orders = (Array.isArray(rawOrders) ? rawOrders : []).map((order) => ({
    id: String(order._id || order.id || order.purchaseCode),
    code: order.purchaseCode || order.code,
    name: order.productName || order.name,
    priceJoy: order.priceJoy,
    status: order.status,
    createdAt: order.createdAt,
  }));

  return { vouchers: vouchersFromBio(bio), orders, spin: spin || null };
}

/** Một request ở backend mới; chỉ fallback cho bản production cũ chưa deploy. */
export async function fetchJoyPerks(bio) {
  if (supportsAggregatedPerks) {
    const response = await fetch(`${getApiUrl()}/joy/perks`, { credentials: "include" });
    if (response.status !== 404) return parseOrThrow(response);
    supportsAggregatedPerks = false;
  }
  return fetchLegacyJoyPerks(bio);
}

export async function checkHasPin() {
  const res = await fetch(`${getApiUrl()}/joy/has-pin`, { credentials: "include" });
  return parseOrThrow(res);
}

export async function setTransactionPin(pin) {
  const res = await fetch(`${getApiUrl()}/joy/set-pin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pin }),
    credentials: "include"
  });
  return parseOrThrow(res);
}

export async function verifyTransactionPin(pin) {
  const res = await fetch(`${getApiUrl()}/joy/verify-pin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pin }),
    credentials: "include"
  });
  return parseOrThrow(res);
}

/**
 * Tra người nhận từ MÃ TRÊN THẺ (mã vạch CODE128, hoặc gõ tay, hoặc thẻ NFC).
 *
 * Trước đây có hai đường làm đúng một việc: `/joy/resolve-nfc` (không cổng,
 * không giới hạn tần suất) và `/joy/resolve-member`. Cái thứ nhất đã bị gỡ —
 * để ngỏ thì bất kỳ ai cũng dò được "mã giới thiệu → tên + ảnh", mà mã giới
 * thiệu lại có thể sinh từ sáu số cuối điện thoại.
 */
/** Nộp hồ sơ tín dụng JOYlater. Chỉ nộp được một lần. */
export async function applyJoyLater() {
  const res = await fetch(`${getApiUrl()}/joy/joylater/apply`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  return parseOrThrow(res);
}

export async function resolveMemberCode(code) {
  const res = await fetch(`${getApiUrl()}/joy/resolve-member?code=${encodeURIComponent(code)}`, {
    credentials: "include",
  });
  return parseOrThrow(res);
}

export async function fetchChallengeStatus(email) {
  try {
    const res = await fetch(`${getApiUrl()}/companion/challenges-status?email=${encodeURIComponent(email)}`, {
      credentials: "include"
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.challenges || [];
  } catch {
    return [];
  }
}

export async function claimChallenge(email, challengeId) {
  const res = await fetch(`${getApiUrl()}/companion/claim-challenge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, challengeId }),
    credentials: "include"
  });
  return parseOrThrow(res);
}

export async function claimInfoBonus(email) {
  const res = await fetch(`${getApiUrl()}/joy/claim-info-bonus`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
    credentials: "include"
  });
  return parseOrThrow(res);
}

// Thưởng riêng khi đọc hết ghi chú nâng cấp 2.0 — máy chủ mới là nơi chốt
// một-lần-duy-nhất, phía client chỉ mở khoá nút bấm.
export async function claimInfoReadBonus(email) {
  const res = await fetch(`${getApiUrl()}/joy/claim-info-read-bonus`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
    credentials: "include"
  });
  return parseOrThrow(res);
}

// ── JOYlater ───────────────────────────────────────────────────────
// Mọi con số (hạn mức, phí, số ngày) do server tính từ shared/joyLater.js —
// client chỉ hiển thị, không tự tính, để màn xác nhận không bao giờ lệch với
// số thật bị trừ.
export async function getJoyLaterStatus() {
  const res = await fetch(`${getApiUrl()}/joy/joylater`, { credentials: "include" });
  return parseOrThrow(res);
}

/** Mọi lượt đã mở trước, mới nhất trước, kèm từng dòng đã hoàn. */
export async function getJoyLaterHistory() {
  const res = await fetch(`${getApiUrl()}/joy/joylater/history`, { credentials: "include" });
  return parseOrThrow(res);
}

/** Báo giá kèm bảng so sánh của MỌI mức chia đợt (`quote.options`). */
export async function quoteJoyLater(amount, cycles = 1) {
  const query = `amount=${encodeURIComponent(amount)}&cycles=${encodeURIComponent(cycles)}`;
  const res = await fetch(`${getApiUrl()}/joy/joylater/quote?${query}`, {
    credentials: "include",
  });
  return parseOrThrow(res);
}

export async function openJoyLater({ amount, itemLabel, itemKey, cycles }) {
  const res = await fetch(`${getApiUrl()}/joy/joylater/open`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ amount, itemLabel, itemKey, cycles }),
  });
  return parseOrThrow(res);
}

/** Trả đúng một đợt. Số tiền do server tính, client không gửi lên. */
export async function payInstallmentJoyLater() {
  const res = await fetch(`${getApiUrl()}/joy/joylater/pay-installment`, {
    method: "POST",
    credentials: "include",
  });
  return parseOrThrow(res);
}

export async function payOffJoyLater() {
  const res = await fetch(`${getApiUrl()}/joy/joylater/payoff`, {
    method: "POST",
    credentials: "include",
  });
  return parseOrThrow(res);
}

/** Thưởng khi cây nhiệm vụ lớn hết — mỗi ngày một lần, server tự chặn trùng. */
export async function claimTreeBonus() {
  const res = await fetch(`${getApiUrl()}/companion/claim-tree-bonus`, {
    method: "POST",
    credentials: "include",
  });
  return parseOrThrow(res);
}

/**
 * Chọn đơn vị JOY của tài khoản. Đi qua chính endpoint onboarding vì đó là nơi
 * duy nhất ghi trường này — và nó vốn BỎ QUA mục đã có giá trị, nên đơn vị vẫn
 * là ghi-một-lần: không cần thêm khoá riêng ở đây, và cũng không thể lách phí
 * đổi đơn vị bằng cách gọi lại.
 */
export async function chooseJoyDenom(joyDenom) {
  const res = await fetch(`${getApiUrl()}/bios/me/onboarding`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ joyDenom }),
  });
  return parseOrThrow(res);
}
