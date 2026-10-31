import { lazy } from "react";

/**
 * HugoOS — mục lục DUY NHẤT của mã giao diện từng app.
 *
 * `packages/shared/appRegistry.js` khai báo app (icon, màu, danh mục, cửa hàng) và không
 * được chạm React. File này là nửa còn lại: app nào nạp từ tệp nào. Trước đây
 * nửa này nằm ở HAI chỗ — `lazy()` trong MemberUtilitiesTab và bảng tải trước
 * trong utils/chunkPrefetcher — và đã lệch nhau: bảng tải trước trỏ HugoPSY vào
 * một tệp không phải tệp app mở thật, còn Ví, HugoKit, Cửa Hàng, Danh Thiếp thì
 * không có, nên bấm icon vẫn phải chờ tải dù đã "tải trước". Một bảng thì lazy
 * và tải trước dùng chung đúng một lời hứa, không lệch được nữa.
 *
 * Thêm app mới: một dòng ở APP_LOADERS (và một dòng manifest trong appRegistry).
 */
const APP_LOADERS = {
  handle: () => import("../hugoKit/HugoKitApp"),
  psychology: () => import("../banhocduong/BanhocduongTab"),
  joy_wallet: () => import("../wallet/JoyWalletApp"),
  team: () => import("../HugoTeamTab"),
  arcade: () => import("../arcade/HugoArcadeTab"),
  nom: () => import("../nom/MemberNomTab"),
  aura: () => import("../MemberAuraTab"),
  bio: () => import("../BioPreviewTab"),
  store: () => import("../hugoStore/HugoStoreTab"),
};

// Id đã nghỉ hưu vẫn mở app kế nhiệm: bookmark và icon đã cài không được hỏng.
const APP_ALIASES = {
  helpdesk: "handle",
  study: "team",
  ide: "team",
  hugoso: "team",
};

export const resolveAppId = (appId) => APP_ALIASES[appId] || appId;
export const hasAppModule = (appId) => Boolean(APP_LOADERS[resolveAppId(appId)]);

const pending = new Map();
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Nạp mã của một app, một lần cho cả phiên. Rớt mạng giữa chừng thì thử lại một
 * lần sau 800 ms trước khi để LazyBoundary báo lỗi — 4G chập chờn là chuyện
 * thường, còn chunk đã bị thay sau deploy thì lần thử lại cũng hỏng nhanh.
 */
function loadApp(appId) {
  const id = resolveAppId(appId);
  const loader = APP_LOADERS[id];
  if (!loader) return Promise.reject(new Error(`Unknown app: ${appId}`));
  if (!pending.has(id)) {
    const promise = loader()
      .catch(() => wait(800).then(loader))
      .catch((error) => {
        pending.delete(id);
        throw error;
      });
    pending.set(id, promise);
  }
  return pending.get(id);
}

export const APP_COMPONENTS = Object.freeze(
  Object.fromEntries(Object.keys(APP_LOADERS).map((id) => [id, lazy(() => loadApp(id))])),
);

/** Tải trước NGAY (khi chạm/rê vào icon): tới lúc nhả tay mã đã về hoặc đang về. */
export function prefetchApp(appId) {
  if (hasAppModule(appId)) loadApp(appId).catch(() => {});
}

const slowNetwork = () => {
  const connection = typeof navigator !== "undefined" ? navigator.connection : null;
  return Boolean(connection?.saveData || /(^|-)2g|3g/.test(connection?.effectiveType || ""));
};

/**
 * Tải trước các app trên Trang chủ lúc máy rảnh, từng cái một để không giành
 * băng thông với thứ người dùng đang xem. Bỏ qua khi bật tiết kiệm dữ liệu hoặc
 * mạng chậm. Tệp tĩnh đi từ CDN nên không đụng tới máy chủ API.
 */
export function prefetchAppsWhenIdle(appIds, limit = 6) {
  if (typeof window === "undefined" || slowNetwork()) return () => {};
  const queue = [...new Set(appIds.map(resolveAppId))].filter((id) => APP_LOADERS[id] && !pending.has(id)).slice(0, limit);
  let cancelled = false;
  let handle = null;
  const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 300));
  const cancelIdle = window.cancelIdleCallback || clearTimeout;
  const next = () => {
    if (cancelled || queue.length === 0) return;
    handle = idle(() => {
      loadApp(queue.shift()).catch(() => {}).finally(next);
    }, { timeout: 4000 });
  };
  // Chờ màn đầu vẽ xong và các request dữ liệu chính đã đi trước.
  const start = setTimeout(next, 2500);
  return () => {
    cancelled = true;
    clearTimeout(start);
    if (handle !== null) cancelIdle(handle);
  };
}
