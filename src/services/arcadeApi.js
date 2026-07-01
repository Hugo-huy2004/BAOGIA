// Client for HugoArcade's score/leaderboard endpoints (server/routes/arcadeRoutes.js).

const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.startsWith("http")) return envUrl;
  if (typeof window !== "undefined") return `${window.location.origin}${envUrl || "/api"}`;
  return "/api";
};

// ─── IndexedDB offline score queue ───────────────────────────────────────────

const QUEUE_DB   = "hugo-arcade-queue";
const QUEUE_VER  = 1;
const QUEUE_STORE = "pending-scores";

function openQueueDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(QUEUE_DB, QUEUE_VER);
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(QUEUE_STORE, { keyPath: "id", autoIncrement: true });
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror   = (e) => reject(e.target.error);
  });
}

async function enqueueScore(payload) {
  try {
    const db = await openQueueDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(QUEUE_STORE, "readwrite");
      tx.objectStore(QUEUE_STORE).add({ payload, queuedAt: Date.now() });
      tx.oncomplete = resolve;
      tx.onerror = (e) => reject(e.target.error);
    });
    // Ask service worker to sync when online
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready;
      await reg.sync?.register("arcade-score-sync").catch(() => {});
    }
  } catch { /* indexedDB unavailable (e.g. private browsing with storage blocked) */ }
}

async function dequeueScore(id, db) {
  return new Promise((resolve) => {
    const tx = db.transaction(QUEUE_STORE, "readwrite");
    tx.objectStore(QUEUE_STORE).delete(id);
    tx.oncomplete = resolve;
  });
}

// Called on submit success and on window 'online' event — drains the queue.
export async function flushScoreQueue() {
  let db;
  try { db = await openQueueDb(); } catch { return; }

  const pending = await new Promise((resolve) => {
    const tx  = db.transaction(QUEUE_STORE, "readonly");
    const req = tx.objectStore(QUEUE_STORE).getAll();
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror   = () => resolve([]);
  });

  for (const item of pending) {
    try {
      const res = await fetch(`${getApiUrl()}/arcade/score`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(item.payload),
      });
      if (res.ok) await dequeueScore(item.id, db);
    } catch { break; } // still offline — stop draining
  }
}

// Auto-flush when network comes back
if (typeof window !== "undefined") {
  window.addEventListener("online", () => flushScoreQueue().catch(() => {}));
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function submitScore(game, { score, difficulty, result }, bio) {
  const body = {
    email:       bio?.email,
    game,
    score,
    difficulty,
    result,
    displayName: bio?.displayName || "",
    avatarUrl:   bio?.avatar || bio?.avatarUrl || "",
  };

  try {
    const res = await fetch(`${getApiUrl()}/arcade/score`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });
    if (!res.ok) return null;
    const data = await res.json();
    // Drain any previously queued scores now that we're online
    flushScoreQueue().catch(() => {});
    return data;
  } catch {
    // Network unavailable — queue for later
    await enqueueScore(body);
    return { joyDelta: 0, joyAwarded: false, queued: true };
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

const ZERO_RECORD  = () => ({ easy: { wins: 0, losses: 0 }, medium: { wins: 0, losses: 0 }, hard: { wins: 0, losses: 0 } });
const EMPTY_PROFILE = () => ({
  "2048":    { bestScore: 0, gamesPlayed: 0, record: ZERO_RECORD() },
  caro:      { bestScore: 0, gamesPlayed: 0, record: ZERO_RECORD() },
  wordguess: { bestScore: 0, gamesPlayed: 0, record: ZERO_RECORD() },
  survivor:  { bestScore: 0, gamesPlayed: 0, record: ZERO_RECORD() },
  snake:     { bestScore: 0, gamesPlayed: 0, record: ZERO_RECORD() },
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
