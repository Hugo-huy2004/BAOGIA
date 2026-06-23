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

export async function resolvePhone(phone) {
  const res = await fetch(`${getApiUrl()}/joy/resolve-phone?phone=${encodeURIComponent(phone)}`);
  return parseOrThrow(res);
}

export async function transferJoy({ fromEmail, toPhone, amount, message }) {
  const res = await fetch(`${getApiUrl()}/joy/transfer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fromEmail, toPhone, amount, message })
  });
  return parseOrThrow(res);
}

export async function fetchChallengeStatus(email) {
  try {
    const res = await fetch(`${getApiUrl()}/companion/challenges-status?email=${encodeURIComponent(email)}`);
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
    body: JSON.stringify({ email, challengeId })
  });
  return parseOrThrow(res);
}

export async function claimInfoBonus(email) {
  const res = await fetch(`${getApiUrl()}/joy/claim-info-bonus`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });
  return parseOrThrow(res);
}
