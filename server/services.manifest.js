/**
 * BẢN KHAI CÁC SERVICE — nguồn duy nhất cho cổng API.
 * ============================================================================
 *
 * Trước đây `server.js` có 51 dòng `app.use('/api/...', xxxRoutes)` viết tay,
 * và nginx/Vercel không hề biết danh sách đó. Thêm một tính năng là phải nhớ
 * sửa nhiều nơi rời nhau, và không có gì báo khi quên.
 *
 * Giờ mỗi service khai MỘT dòng ở đây. Cùng một mảng này nuôi ba chỗ:
 *
 *   server.js                  → mount router (đang chạy chung một process)
 *   scripts/gen-nginx.mjs      → sinh nginx/gateway.conf
 *   scripts/check-gateway.mjs  → chặn khi có route mount ngoài bản khai
 *
 * ── THÊM TÍNH NĂNG MỚI ──────────────────────────────────────────────────────
 *   1. Viết `routes/abcRoutes.js` (export default một express.Router).
 *   2. Thêm một dòng vào SERVICES bên dưới.
 *   Hết. Không đụng vào server.js.
 *
 * ── TÁCH RA PROCESS RIÊNG (về sau) ──────────────────────────────────────────
 *   Đổi `mode: "inline"` → `mode: "process"` và cho nó một `port`. server.js
 *   thôi mount router đó; nginx tự trỏ prefix sang cổng mới. Không file nào
 *   khác phải sửa.
 *
 * ── VÌ SAO MANIFEST NÀY KHÔNG IMPORT GÌ ─────────────────────────────────────
 * Cố ý chỉ chứa DỮ LIỆU THUẦN: chuỗi và số, không `import` router hay
 * middleware. `gen-nginx.mjs` và `check-gateway.mjs` phải đọc được nó mà không
 * kéo theo mongoose, Sentry hay cả app — nếu không, sinh một file cấu hình sẽ
 * mở kết nối database. `guard` vì thế là TÊN middleware, server.js tra trong
 * bảng `GUARDS` của nó.
 */

/** Thứ tự trong mảng = thứ tự mount trong Express. Đừng sắp xếp lại tuỳ tiện:
 *  hai prefix lồng nhau (`/api/admin` và `/api/admin/brain`) phụ thuộc vào nó. */
export const SERVICES = Object.freeze([
  // ── Vận hành & bảo mật ────────────────────────────────────────────────────
  { id: "ops", prefix: "/api/ops", module: "./routes/opsRoutes.js" },
  { id: "security", prefix: "/api/security", module: "./routes/securityRoutes.js" },
  // Cố ý KHÔNG xác thực: bản build ở store gọi trước khi có ai đăng nhập, và
  // nó chỉ trả con trỏ bản phát hành công khai.
  { id: "ota", prefix: "/api/ota", module: "./routes/otaRoutes.js", public: true },

  // ── Danh tính ─────────────────────────────────────────────────────────────
  { id: "auth", prefix: "/api/auth/member", module: "./routes/memberAuthRoutes.js", public: true },
  { id: "oauth", prefix: "/api/oauth", module: "./routes/oauthRoutes.js", public: true },
  { id: "webauthn", prefix: "/api/webauthn", module: "./routes/webauthnRoutes.js", public: true },

  // ── Hồ sơ & nội dung công khai ────────────────────────────────────────────
  { id: "member-progress", prefix: "/api/member/progress", module: "./routes/memberProgressRoutes.js" },
  { id: "hugoteam", prefix: "/api/hugoteam", module: "./routes/hugoTeamRoutes.js" },
  { id: "email", prefix: "/api/email", module: "./routes/emailRoutes.js" },
  { id: "contact", prefix: "/api/contact", module: "./routes/contactRoutes.js" },
  { id: "data", prefix: "/api/data", module: "./routes/dataRoutes.js", cacheable: true },
  { id: "bios", prefix: "/api/bios", module: "./routes/bioRoutes.js", cacheable: true },
  { id: "profile", prefix: "/api/profile", module: "./routes/profileRoutes.js" },
  { id: "bookings", prefix: "/api/bookings", module: "./routes/bookingRoutes.js" },
  { id: "partners", prefix: "/api/partners", module: "./routes/partnerRoutes.js" },
  { id: "packages", prefix: "/api/packages", module: "./routes/packageRoutes.js", cacheable: true },
  { id: "support", prefix: "/api/support", module: "./routes/supportRoutes.js" },

  // ── Quản trị ──────────────────────────────────────────────────────────────
  // `/api/admin` đứng TRƯỚC ba prefix con của nó. Express khớp theo thứ tự và
  // router cha rơi tiếp khi không có route khớp; nginx khớp theo prefix dài
  // nhất. Cả hai đều đúng với thứ tự này — đảo lại thì Express hỏng.
  { id: "admin", prefix: "/api/admin", module: "./routes/adminRoutes.js" },
  { id: "admin-brain", prefix: "/api/admin/brain", module: "./routes/adminBrainRoutes.js" },
  { id: "admin-robot", prefix: "/api/admin/robot", module: "./routes/robotRoutes.js" },
  { id: "admin-workforce", prefix: "/api/admin/workforce", module: "./routes/aiWorkforceRoutes.js" },

  // ── Học tập ───────────────────────────────────────────────────────────────
  { id: "coder-resources", prefix: "/api/coder-resources", module: "./routes/coderResourceRoutes.js" },
  { id: "coder-lessons", prefix: "/api/coder-lessons", module: "./routes/coderLessonRoutes.js", cacheable: true },
  { id: "today", prefix: "/api/today", module: "./routes/todayRoutes.js" },

  // ── Tiện ích & AI ─────────────────────────────────────────────────────────
  { id: "files", prefix: "/api/files", module: "./routes/fileToolsRoutes.js" },
  { id: "companion", prefix: "/api/companion", module: "./routes/companionRoutes.js" },
  // Proxy sang python-ai-server. `requireAdultMember` chặn ở cổng vào, đừng bỏ.
  { id: "ai", prefix: "/api/ai", module: "./routes/aiProxyRoutes.js", guard: "requireAdultMember" },
  { id: "sleep", prefix: "/api/sleep", module: "./routes/sleepRoutes.js" },
  { id: "iot", prefix: "/api/iot", module: "./routes/iotRoutes.js" },

  // ── Thương mại ────────────────────────────────────────────────────────────
  { id: "customer-projects", prefix: "/api/customer-projects", module: "./routes/customerRoutes.js" },
  { id: "payos", prefix: "/api/payos", module: "./routes/payosRoutes.js", public: true },
  { id: "joy", prefix: "/api/joy", module: "./routes/joyRoutes.js" },
  { id: "referral", prefix: "/api/referral", module: "./routes/referralRoutes.js" },
  { id: "utility-store", prefix: "/api/utility-store", module: "./routes/utilityStoreRoutes.js" },
  // Ba router cùng đứng trên /api/store, chia nhau các đường con. Chúng phải
  // cùng `mode`: nginx chỉ trỏ được một prefix tới một nơi. check-gateway.mjs
  // canh đúng chuyện này.
  { id: "store-cart", prefix: "/api/store", module: "./routes/storeCartRoutes.js" },
  { id: "store-promo", prefix: "/api/store", module: "./routes/storePromoRoutes.js" },
  { id: "store-plan", prefix: "/api/store", module: "./routes/storePlanRoutes.js" },
  { id: "joy-gift-cards", prefix: "/api/joy-gift-cards", module: "./routes/joyGiftCardRoutes.js" },

  // ── Ứng dụng thành viên ───────────────────────────────────────────────────
  { id: "notifications", prefix: "/api/notifications", module: "./routes/notificationRoutes.js" },
  { id: "inbox", prefix: "/api/inbox", module: "./routes/inboxRoutes.js" },
  { id: "chess", prefix: "/api/chess", module: "./routes/chessRoutes.js" },
  { id: "checkin", prefix: "/api/checkin", module: "./routes/checkinRoutes.js" },
  { id: "presence", prefix: "/api/presence", module: "./routes/presenceRoutes.js" },
  { id: "radio", prefix: "/api/radio", module: "./routes/radioRoutes.js" },
  { id: "arcade", prefix: "/api/arcade", module: "./routes/arcadeRoutes.js" },
  { id: "cinema", prefix: "/api/cinema", module: "./routes/cinemaRoutes.js" },
  { id: "stock", prefix: "/api/stock", module: "./routes/stockRoutes.js" },

  // ── Webhook bên ngoài ─────────────────────────────────────────────────────
  // Telegram gọi vào bằng secret của chính nó, không có JWT thành viên.
  { id: "telegram", prefix: "/api/telegram", module: "./routes/telegramWebhookRoutes.js", public: true },
]);

/**
 * Tệp trong `routes/` CỐ Ý không mount — phải nêu lý do.
 *
 * Không có danh sách này thì một tệp route quên khai trông y hệt một tệp cố ý
 * để đó: cả hai đều im lặng, không route nào chạy, không có gì báo. Bắt khai
 * tường minh nghĩa là "quên" luôn làm check-gateway đỏ, còn "cố ý" thì đọc
 * được lý do ngay tại đây.
 *
 * Đang rỗng — và nên giữ vậy. `metaWebhookRoutes.js` từng nằm đây, đã xoá hẳn
 * ngày 2026-08-24 vì không có một tham chiếu nào; cần lại thì lấy từ git.
 */
export const UNMOUNTED = Object.freeze({});

/**
 * Kênh WebSocket. nginx cần khối `Upgrade` riêng cho từng đường — proxy_pass
 * thường sẽ nuốt mất handshake và client treo ở trạng thái "connecting".
 *
 * Cả hai đang do chính process Node phục vụ (xem `server.on('upgrade')`).
 * Tách realtime ra riêng thì đổi `mode`/`port` ở đây, y như SERVICES.
 */
export const WS_CHANNELS = Object.freeze([
  { id: "realtime", path: "/ws", note: "ví + thông báo, xác thực bằng member JWT trong query ?token=" },
  { id: "chess", path: "/ws/chess", note: "ván cờ realtime" },
]);

/** Nơi mọi prefix chưa tách process trỏ về. */
export const CORE_UPSTREAM = Object.freeze({
  id: "core",
  host: process.env.CORE_HOST || "127.0.0.1",
  port: Number(process.env.PORT || 8099),
});

/** Service chạy process riêng (`mode: "process"`), dùng để sinh upstream nginx. */
export function processServices() {
  return SERVICES.filter((service) => service.mode === "process");
}

/**
 * Gộp các entry theo prefix, giữ nguyên thứ tự lần xuất hiện đầu.
 *
 * nginx chỉ có MỘT `location` cho một prefix, trong khi Express cho phép nhiều
 * router chồng lên nhau (`/api/store` có ba). Bộ sinh cấu hình phải nhìn theo
 * prefix chứ không theo service, nếu không nó đẻ ra ba khối `location` trùng
 * tên và nginx từ chối khởi động.
 */
export function prefixRoutingTable() {
  const table = new Map();
  for (const service of SERVICES) {
    const existing = table.get(service.prefix);
    if (existing) existing.services.push(service);
    else table.set(service.prefix, { prefix: service.prefix, services: [service] });
  }
  return [...table.values()];
}

/**
 * Mount mọi service `inline` vào một app Express, theo đúng thứ tự khai báo.
 *
 * Router nạp bằng `import()` động nên chính tệp này vẫn là dữ liệu thuần khi
 * chỉ đọc để sinh cấu hình — không có router nào bị nạp trừ khi hàm này chạy.
 * `guards` do server.js truyền vào cùng lý do: middleware kéo theo model, model
 * kéo theo mongoose.
 *
 * Service `mode: "process"` bị bỏ qua ở đây — nginx trỏ thẳng prefix của nó
 * sang cổng riêng, request không bao giờ chạm vào process này.
 */
export async function mountServices(app, guards = {}) {
  const mounted = [];
  for (const service of SERVICES) {
    if (service.mode === "process") continue;

    const module = await import(service.module);
    const router = module.default;
    if (typeof router !== "function") {
      throw new Error(`[gateway] ${service.id}: ${service.module} không export default một Router.`);
    }

    if (service.guard) {
      const guard = guards[service.guard];
      // Đừng mount trần khi thiếu guard: `/api/ai` mất requireAdultMember là mở
      // toang proxy Gemini. Thà chết lúc khởi động còn hơn rò lúc chạy.
      //
      // Guard có thể là MỘT hàm hoặc một MẢNG middleware — `requireAdultMember`
      // là mảng (requireMember rồi mới kiểm tuổi). Express nhận cả hai, nên chỉ
      // kiểm `typeof === "function"` là chặn nhầm một guard hợp lệ và chết cả
      // máy chủ lúc khởi động.
      const ok = typeof guard === "function"
        || (Array.isArray(guard) && guard.length > 0 && guard.every((item) => typeof item === "function"));
      if (!ok) {
        throw new Error(`[gateway] ${service.id}: không tìm thấy guard "${service.guard}".`);
      }
      app.use(service.prefix, guard, router);
    } else {
      app.use(service.prefix, router);
    }
    mounted.push(service.id);
  }
  return mounted;
}
