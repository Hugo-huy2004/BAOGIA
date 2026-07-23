/**
 * routePrefetcher.js
 * Tải trước (Pre-fetch) tài nguyên ứng dụng khi di chuột/chạm nhẹ vào Icon theo chuẩn Apple.
 * Giúp mở ứng dụng với tốc độ 0ms tức thì.
 */

const PREFETCH_MAP = {
  hugoskin: () => import("../components/member/HugoSkinTab"),
  psychology: () => import("../components/member/banhocduong/TherapyTab"),
  therapy: () => import("../components/member/banhocduong/TherapyTab"),
  banhocduong: () => import("../components/member/banhocduong/BanhocduongTab"),
  radio: () => import("../components/member/MemberRadioTab"),
  aura: () => import("../components/member/MemberAuraTab"),
  ide: () => import("../components/member/MemberIdeTab"),
  arcade: () => import("../components/chess/ChessGame")
};

const prefetchedSet = new Set();

export const RoutePrefetcher = {
  prefetchApp(appId) {
    if (!appId || prefetchedSet.has(appId)) return;
    const loader = PREFETCH_MAP[appId];
    if (loader) {
      prefetchedSet.add(appId);
      loader().catch(() => {
        prefetchedSet.delete(appId);
      });
    }
  }
};
