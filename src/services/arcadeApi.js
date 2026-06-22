// Client for HugoArcade's score/leaderboard endpoints (server/routes/arcadeRoutes.js).
const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.startsWith("http")) return envUrl;
  if (typeof window !== "undefined") return `${window.location.origin}${envUrl || "/api"}`;
  return "/api";
};

export async function submitScore(game, { score, difficulty, result }, bio) {
  try {
    const res = await fetch(`${getApiUrl()}/arcade/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: bio?.email,
        game,
        score,
        difficulty,
        result,
        displayName: bio?.displayName || "",
        avatarUrl: bio?.avatar || bio?.avatarUrl || ""
      })
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchLeaderboard(game, limit = 30) {
  try {
    const res = await fetch(`${getApiUrl()}/arcade/leaderboard?game=${encodeURIComponent(game)}&limit=${limit}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.leaderboard || [];
  } catch {
    return [];
  }
}

export async function fetchMyBest(game, email) {
  try {
    const res = await fetch(`${getApiUrl()}/arcade/me?email=${encodeURIComponent(email)}&game=${encodeURIComponent(game)}`);
    if (!res.ok) return { bestScore: 0, gamesPlayed: 0 };
    return await res.json();
  } catch {
    return { bestScore: 0, gamesPlayed: 0 };
  }
}

const ZERO_RECORD = () => ({ easy: { wins: 0, losses: 0 }, medium: { wins: 0, losses: 0 }, hard: { wins: 0, losses: 0 } });
const EMPTY_PROFILE = () => ({
  "2048": { bestScore: 0, gamesPlayed: 0, record: ZERO_RECORD() },
  caro: { bestScore: 0, gamesPlayed: 0, record: ZERO_RECORD() },
  wordguess: { bestScore: 0, gamesPlayed: 0, record: ZERO_RECORD() }
});

export async function fetchProfile(email) {
  if (!email) return EMPTY_PROFILE();
  try {
    const res = await fetch(`${getApiUrl()}/arcade/profile?email=${encodeURIComponent(email)}`);
    if (!res.ok) return EMPTY_PROFILE();
    const data = await res.json();
    return data.profile || EMPTY_PROFILE();
  } catch {
    return EMPTY_PROFILE();
  }
}
