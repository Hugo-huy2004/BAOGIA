/**
 * HugoOS App Registry
 *
 * Nguồn dữ liệu tĩnh duy nhất cho Trang chủ, Thư viện và Hugo Store. File này
 * không phụ thuộc React/i18n nên cả client lẫn server có thể đọc manifest mà
 * không kéo theo mã giao diện.
 */

export const APP_GRADIENTS = Object.freeze({
  indigo: "from-indigo-500 to-indigo-600",
  rose: "from-rose-400 to-rose-600",
  cyan: "from-cyan-400 to-teal-500",
  blue: "from-blue-500 to-indigo-600",
  teal: "from-teal-400 to-emerald-500",
  orange: "from-amber-400 to-orange-500",
  purple: "from-violet-500 to-purple-600",
  slate: "from-slate-500 to-slate-700",
  pink: "from-pink-400 to-fuchsia-600",
});

const manifest = ({
  storageMb = 2.0,
  version = "1.0.0",
  catalog = true,
  store = false,
  game = false,
  storePlanId = undefined,
  destinations = [],
  ...app
}) => Object.freeze({
  ...app,
  storageMb,
  version,
  destinations: Object.freeze(destinations.map((entry) => Object.freeze(entry))),
  surfaces: Object.freeze({ catalog, store }),
  store: store
    ? Object.freeze({ game, planId: storePlanId === undefined ? app.id : storePlanId })
    : null,
});

export const APP_REGISTRY = Object.freeze([
  manifest({ id: "bio", icon: "badge", tint: "purple", category: "edu", rating: "4.9", users: "12k", badge: "hot", storageMb: 1.5, version: "3.2.0", store: true, storeOrder: 1 }),
  manifest({ id: "profile", icon: "verified_user", tint: "indigo", category: "edu", rating: "5.0", users: "1k", badge: "new", store: true, storeOrder: 0 }),
  manifest({ id: "friends", icon: "group", tint: "blue", category: "tools", rating: "5.0", users: "1k", badge: "new", storageMb: 2.0, version: "1.1.0", store: true, storeOrder: 2 }),
  manifest({ id: "study", icon: "school", tint: "purple", category: "edu", rating: "5.0", users: "11k", badge: "new", storageMb: 8.1 }),
  manifest({ id: "team", icon: "groups", tint: "teal", category: "edu", rating: "4.7", users: "2k", badge: "join", storageMb: 1.6, version: "1.4.0", store: true, storeOrder: 6 }),
  manifest({ id: "psychology", icon: "psychology", tint: "cyan", category: "wellness", rating: "5.0", users: "15k", badge: "ai", storageMb: 3.2, version: "5.0.0", store: true, storeOrder: 3 }),
  manifest({ id: "radio", icon: "radio", tint: "teal", category: "wellness", rating: "4.6", users: "5k", badge: "lofi", storageMb: 1.9, version: "2.0.0", store: true, storeOrder: 4 }),
  manifest({
    id: "handle", icon: "handyman", tint: "indigo", category: "tools", rating: "4.9", users: "10k", badge: "utility", storageMb: 1.6, version: "2.0.0", store: true, storeOrder: 5,
    destinations: [
      { id: "qr", icon: "qr_code_2", labelKey: "utilities.qrCode.title" },
      { id: "signature", icon: "draw", labelKey: "utilities.signature.title" },
      { id: "links", icon: "lock", labelKey: "utilities.secretLink.title" },
      { id: "files", icon: "folder_zip", labelKey: "utilities.fileTools.title" },
    ],
  }),
  manifest({ id: "arcade", icon: "stadium", tint: "orange", category: "arcade", rating: "4.9", users: "18k", badge: "games", storageMb: 5.1, version: "3.5.0", store: true, storeOrder: 7 }),
  manifest({ id: "aura", icon: "blur_on", tint: "purple", category: "arcade", rating: "5.0", users: "11k", badge: "focus", storageMb: 1.8, version: "2.1.0", store: true, storeOrder: 8 }),
  manifest({ id: "cinema", icon: "movie", tint: "purple", category: "arcade", rating: "5.0", users: "30k", badge: "cinema", storageMb: 4.8, version: "2.0.0", store: true, storeOrder: 9 }),
  manifest({ id: "invest", icon: "trending_up", tint: "teal", category: "edu", rating: "5.0", users: "1k", badge: "new", storageMb: 5.0, store: true, storeOrder: 10 }),
  manifest({ id: "info", icon: "info", tint: "slate", category: "tools", rating: "4.8", users: "6k", badge: "system", storageMb: 0.8, version: "2.0.0" }),
  manifest({ id: "joy_wallet", icon: "account_balance_wallet", tint: "orange", category: "tools", rating: "5.0", users: "20k", badge: "utility", storageMb: 1.4 }),
  manifest({ id: "store", icon: "store", tint: "blue", category: "tools", rating: "5.0", users: "50k", badge: "store" }),
  manifest({
    id: "supporter", icon: "support_agent", tint: "teal", category: "tools", rating: "5.0", users: "100k", badge: "system", version: "3.0.0",
    destinations: [
      { id: "guides", icon: "menu_book", labelKey: "support.tabGuides" },
      { id: "requests", icon: "confirmation_number", labelKey: "support.tabRequests" },
    ],
  }),
  manifest({ id: "arcade_chess", icon: "castle", tint: "slate", category: "arcade", rating: "4.9", users: "8k", badge: "game", store: true, game: true, storePlanId: "chess", storeOrder: 11 }),
  manifest({ id: "arcade_2048", icon: "casino", tint: "orange", category: "arcade", rating: "4.8", users: "12k", badge: "game", store: true, game: true, storePlanId: null, storeOrder: 15 }),
  manifest({ id: "arcade_caro", icon: "swords", tint: "blue", category: "arcade", rating: "4.7", users: "6k", badge: "game", store: true, game: true, storePlanId: "arcade", storeOrder: 14 }),
  manifest({ id: "arcade_snake", icon: "all_inclusive", tint: "teal", category: "arcade", rating: "4.8", users: "9k", badge: "game", store: true, game: true, storePlanId: "arcade", storeOrder: 13 }),
  manifest({ id: "arcade_survivor", icon: "rocket_launch", tint: "indigo", category: "arcade", rating: "5.0", users: "18k", badge: "game", store: true, game: true, storePlanId: "arcade", storeOrder: 12 }),
]);

export const APP_REGISTRY_BY_ID = new Map(APP_REGISTRY.map((app) => [app.id, app]));
export const APP_CATALOG_MANIFESTS = Object.freeze(APP_REGISTRY.filter((app) => app.surfaces.catalog));
export const APP_STORE_MANIFESTS = Object.freeze(
  APP_REGISTRY.filter((app) => app.surfaces.store).sort((a, b) => a.storeOrder - b.storeOrder),
);

export const REQUIRED_APP_IDS = Object.freeze([
  "store",
  "bio",
  "study",
  "team",
  "psychology",
  "radio",
  "handle",
  "info",
  "joy_wallet",
  "supporter",
]);

export const RETIRED_APP_IDS = Object.freeze(["deco", "map", "hugoskin", "ide", "hugoso", "helpdesk"]);

/**
 * App chiếm trọn màn hình: portal bỏ thanh tab của mình, app tự dựng vỏ `h-full`
 * và tự lo lối thoát bằng nút quay lại.
 *
 * Danh sách này từng nằm hardcode ở HAI chỗ — `MemberPortalPage` và
 * `MemberUtilitiesTab` — và đã lệch nhau: Supporter có ở một bên nên nó dựng vỏ
 * `h-full` bên trong một trang vẫn còn đệm và thanh tab, thành ra app không phủ
 * hết màn và thừa một khoảng đen dưới đáy. Một nguồn thì không lệch được nữa.
 *
 * HugoPSY không có trong đây: nó chỉ toàn màn hình trên điện thoại, còn desktop
 * vẫn là bố cục sidebar — ngoại lệ đó nằm ở MemberPortalPage.
 */
export const FULLSCREEN_APP_IDS = Object.freeze([
  "joy_wallet",
  "study",
  "arcade",
  "store",
  "friends",
  "handle",
  "team",
  "cinema",
  "invest",
  "radio",
  "supporter",
  // Id đã nghỉ hưu nhưng vẫn mở app kế nhiệm; bookmark cũ phải ra đúng vỏ.
  "ide",
  "hugoso",
  "helpdesk",
]);

/**
 * Màu nhấn riêng của từng app. Trước đây mọi app đều lấy `--primary` của portal
 * nên mở app nào cũng ra đúng một màu — app không có bản sắc, và đổi theme
 * portal là đổi luôn màu của cả 20 app.
 */
export const APP_ACCENTS = Object.freeze({
  indigo: "#5B5BD6",
  rose: "#E5484D",
  cyan: "#00A2C7",
  blue: "#0A84FF",
  teal: "#12A594",
  orange: "#F76B15",
  purple: "#8E4EC6",
  slate: "#647084",
  pink: "#D6409F",
});


/**
 * Mọi màn hình con mà Spotlight mở thẳng được, kèm app chứa nó. Khai báo ở đây
 * thay vì trong từng app để tìm kiếm không phải nạp mã giao diện của 20 app chỉ
 * để biết bên trong có gì.
 */
export const APP_DESTINATIONS = Object.freeze(
  APP_REGISTRY.flatMap((app) =>
    app.destinations.map((destination) => Object.freeze({ ...destination, appId: app.id })),
  ),
);

export const getAppManifest = (appId) => APP_REGISTRY_BY_ID.get(String(appId || "")) || null;
export const getAppStorageMb = (appId) => getAppManifest(appId)?.storageMb ?? 2.0;
export const getAppVersion = (appId) => getAppManifest(appId)?.version ?? "1.0.0";
export const getAppAccent = (appId) => APP_ACCENTS[getAppManifest(appId)?.tint] || APP_ACCENTS.blue;
