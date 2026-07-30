/**
 * Proactive Idle Chunk Prefetcher
 * Prefetches lazy component JS bundles when user hovers over icons or during idle time.
 * Provides instant 0ms app launches.
 */

const PREFETCH_MAP = {
  hugoskin: () => import("../components/member/HugoSkinTab"),
  ide: () => import("../components/member/MemberIdeTab"),
  hugoso: () => import("../components/member/hugoSO/HugoSOApp"),
  psychology: () => import("../components/member/banhocduong/TherapyTab"),
  arcade: () => import("../components/member/arcade/HugoArcadeTab"),
  radio: () => import("../components/member/MemberRadioTab"),
  chess: () => import("../components/chess/ChessGame"),
  aura: () => import("../components/member/MemberAuraTab"),
  banhocduong: () => import("../components/member/banhocduong/BanhocduongTab"),
};

const prefetchedSet = new Set();

export function prefetchChunk(appId) {
  if (!appId || prefetchedSet.has(appId)) return;
  const loader = PREFETCH_MAP[appId];
  if (loader) {
    prefetchedSet.add(appId);
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      window.requestIdleCallback(() => {
        loader().catch(() => {});
      });
    } else {
      setTimeout(() => {
        loader().catch(() => {});
      }, 50);
    }
  }
}
