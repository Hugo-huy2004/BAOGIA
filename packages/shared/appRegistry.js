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
  manifest({ id: "bio", icon: "badge", tint: "purple", category: "edu", badge: "hot", storageMb: 1.5, version: "3.2.0", store: true, storeOrder: 1 }),
  manifest({ id: "arcade", icon: "stadium", tint: "orange", category: "arcade", badge: "games", storageMb: 5.1, version: "3.5.0", store: true, storeOrder: 7 }),
  manifest({ id: "aura", icon: "blur_on", tint: "purple", category: "arcade", badge: "focus", storageMb: 1.8, version: "2.1.0", store: true, storeOrder: 8 }),
  manifest({ id: "eduhugo", icon: "school", tint: "cyan", category: "edu", badge: "new", storageMb: 0.3, version: "1.0.0" }),
  manifest({ id: "qrhugo", icon: "api", tint: "blue", category: "tools", badge: "new", storageMb: 0.4, version: "2.0.0" }),
  manifest({ id: "joy_wallet", icon: "account_balance_wallet", tint: "orange", category: "tools", badge: "utility", storageMb: 1.4 }),
  manifest({ id: "store", icon: "store", tint: "blue", category: "tools", badge: "store" }),
  manifest({ id: "arcade_chess", icon: "castle", tint: "slate", category: "arcade", badge: "game", store: true, game: true, storePlanId: "chess", storeOrder: 11 }),
  manifest({ id: "arcade_2048", icon: "casino", tint: "orange", category: "arcade", badge: "game", store: true, game: true, storePlanId: null, storeOrder: 15 }),
  manifest({ id: "arcade_caro", icon: "swords", tint: "blue", category: "arcade", badge: "game", store: true, game: true, storePlanId: "arcade", storeOrder: 14 }),
  manifest({ id: "arcade_snake", icon: "all_inclusive", tint: "teal", category: "arcade", badge: "game", store: true, game: true, storePlanId: "arcade", storeOrder: 13 }),
]);

const APP_REGISTRY_BY_ID = new Map(APP_REGISTRY.map((app) => [app.id, app]));
export const APP_CATALOG_MANIFESTS = Object.freeze(APP_REGISTRY.filter((app) => app.surfaces.catalog));
export const APP_STORE_MANIFESTS = Object.freeze(
  APP_REGISTRY.filter((app) => app.surfaces.store).sort((a, b) => a.storeOrder - b.storeOrder),
);

export const REQUIRED_APP_IDS = Object.freeze([
  "store",
  "bio",
  // "vocab" (Hoa Ngữ) đã gỡ 21/09/2026 — nếu để lại đây thì `normalizeInstalled`
  // vẫn nhồi nó vào danh sách đã cài của MỌI người, và một icon trỏ vào app
  // không còn tồn tại sẽ quay lại sau mỗi lần đồng bộ.
  // "nom" (chữ Nôm) đã gỡ hẳn 08/11/2026.
  // "psychology" (HugoPSY / Bạn Học Đường) đã gỡ hẳn 04/11/2026.
  // "radio" gộp vào Chuyên Chú 25/10/2026 — Chuyên Chú cài sẵn thay chỗ nó.
  "aura",
  "joy_wallet",
  // Cổng chuyển tiếp chính thức từ HugoCoding sang Education Hugo.
  "eduhugo",
  // Cài sẵn: người từ qr.hugowishpax.studio đăng nhập là thấy app lấy key ngay.
  "qrhugo",
]);

export const RETIRED_APP_IDS = Object.freeze([
  // Hugo Team + Coding chuyển sang Education Hugo (repo riêng) 02/11/2026.
  "team",
  "study",
  "vocab",
  "deco",
  "map",
  "hugoskin",
  "ide",
  "hugoso",
  // HugoKit ngừng hoạt động 04/11/2026; QR đã tách thành website riêng.
  "handle",
  "helpdesk",
  "cinema",
  "invest",
  "supporter",
  "support",
  "info",
  "friends",
  // Gộp thành tab "Hồ sơ năng lực" trong Danh Thiếp 25/10/2026.
  "profile",
  // Gộp thành tab "Đài" trong Chuyên Chú 25/10/2026.
  "radio",
  // Ẩn khỏi sảnh Arcade và Cửa Hàng 25/10/2026 — chỉ giữ 4 game hiện hành.
  "arcade_pinball",
  "arcade_survivor",
]);

/**
 * App chiếm trọn màn hình: portal bỏ thanh tab của mình, app tự dựng vỏ `h-full`
 * và tự lo lối thoát bằng nút quay lại.
 *
 * Danh sách này từng nằm hardcode ở HAI chỗ — `MemberPortalPage` và
 * `MemberUtilitiesTab` — và đã lệch nhau: Supporter có ở một bên nên nó dựng vỏ
 * `h-full` bên trong một trang vẫn còn đệm và thanh tab, thành ra app không phủ
 * hết màn và thừa một khoảng đen dưới đáy. Một nguồn thì không lệch được nữa.
 *
 * ── LUẬT: app dùng khung chung `os/AppFrame` thì BẮT BUỘC có tên ở đây ───────
 * `AppFrame` tự dựng trọn bộ vỏ của nó — thanh tiêu đề, điều hướng, safe-area,
 * vùng cuộn riêng. Lồng một cái vỏ hoàn chỉnh vào trong vỏ của portal là có HAI
 * lớp chrome chồng nhau: app thu lại thành một khung hẹp giữa màn, thừa mép nền
 * hai bên, sinh thanh cuộn thứ hai, và nút X đóng app bị đẩy ra rìa. Trên điện
 * thoại và trong PWA, app phải ĐỘC LẬP với bố cục portal.
 *
 * Thiếu sót đã gặp thật: `aura` và `profile` chuyển sang AppFrame mà quên thêm
 * vào đây, nên chúng render lồng trong portal đúng như mô tả trên.
 */
export const FULLSCREEN_APP_IDS = Object.freeze([
  "joy_wallet",
  "aura",
  "bio",
  "arcade",
  "store",
  "eduhugo",
  // QR Hugo: cổng nối tài khoản với qr.hugowishpax.studio (04/11/2026).
  "qrhugo",
]);

/**
 * Màu nhấn riêng của từng app. Trước đây mọi app đều lấy `--primary` của portal
 * nên mở app nào cũng ra đúng một màu — app không có bản sắc, và đổi theme
 * portal là đổi luôn màu của cả 20 app.
 */
const APP_ACCENTS = Object.freeze({
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

const getAppManifest = (appId) => APP_REGISTRY_BY_ID.get(String(appId || "")) || null;
export const getAppStorageMb = (appId) => getAppManifest(appId)?.storageMb ?? 2.0;
export const getAppVersion = (appId) => getAppManifest(appId)?.version ?? "1.0.0";
export const getAppAccent = (appId) => APP_ACCENTS[getAppManifest(appId)?.tint] || APP_ACCENTS.blue;
