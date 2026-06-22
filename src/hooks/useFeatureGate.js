// Live-derives subscription status from `expiresAt` — mirrors the backend's
// isFeatureActive() in server/utils/featureSubscriptionService.js so the UI
// never trusts a stale cached `active` flag.
export function useFeatureGate(bio, featureKey) {
  const sub = bio?.featureSubscriptions?.[featureKey];
  const expiresAt = sub?.expiresAt ? new Date(sub.expiresAt) : null;
  const active = !!expiresAt && expiresAt.getTime() > Date.now();
  return { active, expiresAt };
}
