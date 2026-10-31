import { hasAppModule, prefetchApp } from "../components/member/os/appIndex";

/**
 * Tải trước mã của app khi rê/chạm vào icon. Mã app đọc từ mục lục chung
 * `os/appIndex.js`, nên lazy và tải trước dùng cùng một lời hứa. Ngoài mục lục
 * chỉ còn những màn con nặng mở thẳng từ Trang chủ.
 */
const EXTRA_CHUNKS = {
  arcade_chess: () => import("../components/member/arcade/GameChess3D"),
};

const prefetched = new Set();

export function prefetchChunk(appId) {
  if (!appId) return;
  if (hasAppModule(appId)) {
    prefetchApp(appId);
    return;
  }
  const loader = EXTRA_CHUNKS[appId];
  if (!loader || prefetched.has(appId)) return;
  prefetched.add(appId);
  loader().catch(() => prefetched.delete(appId));
}
