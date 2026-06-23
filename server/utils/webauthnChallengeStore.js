// Short-lived in-memory store for WebAuthn registration/login challenges.
// A challenge is only needed for the few seconds between "generate options"
// and "verify response", so a process-local Map (cleaned up on a timer) is
// sufficient — no need for a DB collection or Redis here.
const store = new Map();
const TTL_MS = 5 * 60 * 1000;

export function saveChallenge(key, challenge) {
  store.set(key, { challenge, expiresAt: Date.now() + TTL_MS });
}

export function consumeChallenge(key) {
  const entry = store.get(key);
  store.delete(key);
  if (!entry || entry.expiresAt < Date.now()) return null;
  return entry.challenge;
}

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.expiresAt < now) store.delete(key);
  }
}, TTL_MS).unref?.();
