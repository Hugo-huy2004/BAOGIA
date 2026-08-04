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
    } catch (_) {}
  }

  // 1. Try 14-char signed token
  if (/^[A-Za-z0-9_-]{14}$/.test(cleanPayload)) {
    try {
      const res = await fetch(`${getApiUrl()}/joy/resolve-qr?payload=${encodeURIComponent(cleanPayload)}`);
      const data = await parseOrThrow(res);
      if (data && data.success !== false) return data;
    } catch (_) {}
  }

  // 2. Fallback: Search user by Referral Code / Email / Query
  try {
    const searchResults = await searchJoyUser(cleanPayload, "");
    if (searchResults && searchResults.length > 0) {
      return searchResults[0];
    }
  } catch (_) {}

  throw new Error("Mã JOY không hợp lệ hoặc không tìm thấy người nhận.");
}

export async function transferJoy({ fromEmail, toPhone, toReferralCode, toEmail, amount, message, pin, idempotencyKey }) {
  const res = await fetch(`${getApiUrl()}/joy/transfer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fromEmail, toPhone, toReferralCode, toEmail, amount, message, pin, idempotencyKey }),
    credentials: "include"
  });
  return parseOrThrow(res);
}

/**
 * Lịch sử ví + tổng kết N ngày trong một lượt gọi.
 * Nhãn (`title`) và nhóm (`group`) do máy chủ gắn — client không giữ bản sao
 * nào của danh mục nguồn JOY.
 */
export async function fetchJoyHistory({ limit = 50, days = 30 } = {}) {
  const res = await fetch(
    `${getApiUrl()}/joy/history?limit=${limit}&days=${days}`,
    { credentials: "include" }
  );
  const data = await parseOrThrow(res);
  return { transactions: data.transactions || [], summary: data.summary || null };
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

export async function resolveNfcCode(code) {
  const res = await fetch(`${getApiUrl()}/joy/resolve-nfc?code=${encodeURIComponent(code)}`);
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
