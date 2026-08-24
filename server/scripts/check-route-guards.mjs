/**
 * Canh cổng xác thực của MỌI route.
 *
 * Ngày 2026-08-24 quét lần đầu tìm ra một loạt route ghi/đọc dữ liệu riêng tư mà
 * không có cổng nào — nặng nhất là cả `packageRoutes.js` (cấp gói trả phí cho
 * bất kỳ ai), `webauthnRoutes` (gỡ passkey của người khác) và `cinemaRoutes`
 * `/admin/*`. Chúng lọt được vì không có gì kiểm: thêm một `router.post` không
 * kèm middleware thì không ai hay.
 *
 * Luật: mọi route phải có cổng, HOẶC có tên trong PUBLIC_ROUTES kèm lý do. Không
 * có cửa thứ ba. Đây là danh sách CHO PHÉP — thêm route mới mà quên nghĩ đến
 * xác thực là bộ này đỏ.
 *
 * Chạy: npm run check:guards
 */
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const serverDir = path.resolve(here, "..");
const { SERVICES } = await import(path.join(serverDir, "services.manifest.js"));

/**
 * Route CỐ Ý mở, kèm lý do. Khoá dạng "tệp.js METHOD /đường-dẫn".
 *
 * Trước khi thêm một dòng vào đây, hỏi: người lạ gọi được thì mất gì? Nếu câu
 * trả lời dính tới dữ liệu của người khác, tiền, hay quota AI thì đừng thêm —
 * hãy gắn cổng.
 */
const PUBLIC_ROUTES = {
  // ── Đăng nhập: chính là cửa để lấy token, không thể yêu cầu token ────────
  "adminRoutes.js POST /login": "cửa đăng nhập admin",
  "adminRoutes.js POST /request-otp": "bước 1 của 2FA admin",
  "adminRoutes.js POST /verify-otp": "bước 2 của 2FA admin",
  "adminRoutes.js POST /logout": "xoá cookie, không đọc dữ liệu gì",
  "memberAuthRoutes.js POST /google": "đổi Google ID token lấy member JWT",
  "memberAuthRoutes.js POST /apple": "đổi Apple token lấy member JWT",
  "memberAuthRoutes.js POST /request-otp": "đăng nhập bằng OTP email, bước 1",
  "memberAuthRoutes.js POST /verify-otp": "đăng nhập bằng OTP email, bước 2",
  "memberAuthRoutes.js POST /logout": "xoá cookie",
  "memberAuthRoutes.js POST /dev-login": "chỉ dev — handler trả 404 khi NODE_ENV=production",
  "webauthnRoutes.js POST /login-options": "thử thách WebAuthn, phát trước khi có phiên",
  "webauthnRoutes.js POST /login-verify": "xác minh chữ ký WebAuthn rồi mới cấp token",
  "customerRoutes.js POST /auth": "cửa đăng nhập cổng khách hàng",

  // ── OAuth: chuẩn quy định các endpoint này xác thực bằng client credentials
  "oauthRoutes.js POST /token": "đổi mã PKCE — xác thực bằng client credentials",
  "oauthRoutes.js GET /userinfo": "xác thực bằng access token trong header",
  "oauthRoutes.js POST /revoke": "theo RFC 7009, xác thực bằng client credentials",
  "oauthRoutes.js POST /introspect": "theo RFC 7662, xác thực bằng client credentials",

  // ── Webhook: bên gọi là máy chủ khác, ký bằng secret riêng ───────────────
  "payosRoutes.js POST /webhook": "PayOS gọi, kiểm chữ ký trong handler",
  "telegramWebhookRoutes.js POST /webhook": "Telegram gọi, kiểm secret token trong handler",
  "opsRoutes.js POST /sentry-hook": "Sentry gọi, kiểm chữ ký trong handler",
  "iotRoutes.js POST /vitals": "thiết bị IoT gửi số đo, xác thực bằng khoá thiết bị",

  // ── Nội dung công khai thật sự ───────────────────────────────────────────
  "bioRoutes.js GET /slug/:slug": "trang Bio công khai — mục đích là ai cũng xem được",
  "bioRoutes.js GET /certificate/:slug/:phase": "chứng chỉ công khai, dùng để khoe",
  "bioRoutes.js POST /slug/:slug/secret-link/:linkId/unlock": "mở bằng mật khẩu của chính liên kết đó",
  "profileRoutes.js GET /public/:slug": "hồ sơ công khai theo slug",
  "presenceRoutes.js GET /status-by-slug": "chấm online trên trang Bio công khai; tra bằng slug nên không lộ email",
  "partnerRoutes.js GET /:id/access": "kiểm quyền truy cập trình sửa Bio đối tác",
  "hugoTeamRoutes.js GET /developers": "danh sách đội ngũ, hiện trên trang giới thiệu",
  "contactRoutes.js GET /zalo": "liên kết Zalo công khai",
  "dataRoutes.js GET /": "cấu hình trang công khai (đã bật cache CDN)",
  "packageRoutes.js GET /": "danh mục gói dịch vụ — bảng giá công khai",
  "todayRoutes.js GET /feed": "bảng tin công khai",
  "coderLessonRoutes.js GET /": "danh mục 100 bài — trang /study công khai cần xem trước",
  "coderLessonRoutes.js GET /:lessonId": "nội dung bài; khoá theo gói ở tầng nghiệp vụ, không ở tầng cổng",
  "coderLessonRoutes.js POST /:lessonId/verify": "chấm bài học thử; có rate limit riêng",
  "utilityStoreRoutes.js GET /products": "danh mục sản phẩm công khai",
  "utilityStoreRoutes.js GET /radio-price": "bảng giá token radio",
  "payosRoutes.js GET /supporters": "danh sách người ủng hộ, cố ý hiện công khai",
  "payosRoutes.js GET /bank-apps": "danh sách app ngân hàng, dữ liệu tĩnh",
  "payosRoutes.js GET /info/:customLinkId": "trang thanh toán mở bằng liên kết bí mật",
  "arcadeRoutes.js GET /leaderboard": "bảng xếp hạng công khai",
  "chessRoutes.js GET /leaderboard": "bảng xếp hạng công khai — đã lọc bỏ email khỏi payload",
  "notificationRoutes.js GET /vapid-public-key": "khoá CÔNG KHAI của web push, bản chất là để phát",
  "otaRoutes.js GET /check": "bản build ở store gọi trước khi có ai đăng nhập",
  "otaRoutes.js POST /check": "như trên",
  "radioRoutes.js GET /station": "proxy tra đài từ Radio Browser, không đụng dữ liệu người dùng",
  "radioRoutes.js POST /stations": "như trên",
  "radioRoutes.js POST /click": "đếm lượt bấm gửi về Radio Browser",
  "cinemaRoutes.js GET /stream/:token": "token phát phim ký sẵn, hết hạn ngắn",

  // ── Gửi form từ khách chưa đăng nhập ─────────────────────────────────────
  "bookingRoutes.js POST /": "khách chưa có tài khoản vẫn phải đặt lịch được",
  "emailRoutes.js POST /contact": "biểu mẫu liên hệ công khai",
  "emailRoutes.js POST /support": "biểu mẫu hỗ trợ công khai",
  "supportRoutes.js POST /tickets": "gửi yêu cầu hỗ trợ khi chưa đăng nhập được",
  "opsRoutes.js POST /client-event": "telemetry từ trình duyệt, gồm cả khách vãng lai",

  // ── Mã QR/NFC ký bằng HMAC — bản thân mã là chứng cứ ─────────────────────
  "joyRoutes.js GET /resolve-qr": "mã QR là token HMAC do máy chủ ký; giải mã không lộ gì thêm",
  "joyRoutes.js GET /resolve-nfc": "như trên",

  // ── Công cụ tệp: cổng dùng thử 3 lượt/ngày theo IP (config/publicTools.js)
  "fileToolsRoutes.js POST /extract/upload": "HugoKit cho khách dùng thử; giới hạn theo IP",
  "fileToolsRoutes.js POST /compress": "như trên",
  "fileToolsRoutes.js GET /extract/download/:fileId": "tải về bằng id ngẫu nhiên vừa phát, sống ngắn",
  "fileToolsRoutes.js DELETE /extract/cleanup/:fileId": "dọn tệp tạm của chính phiên đó",

  // ── Robot: cổng riêng, kiểm TRONG thân handler ───────────────────────────
  "robotRoutes.js POST /telegram-link": "bước bắt cặp Telegram, chưa có phiên nào để kiểm",
  "robotRoutes.js POST /request-otp": "phát OTP; có rate limit riêng",
  "robotRoutes.js POST /verify-otp": "đổi OTP lấy session token của robot",
  "robotRoutes.js GET /stream-frame": "kiểm token phát sống-ngắn trong handler (ACTIVE_STREAM_TOKENS)",
};

const KNOWN_GUARDS = /require[A-Z]\w+|rejectMinorActor|verifyRobotAuth/;

const problems = [];
const routesDir = path.join(serverDir, "routes");
const files = (await readdir(routesDir)).filter((name) => name.endsWith(".js"));

// Guard đặt ở MỨC MOUNT trong bản khai (vd /api/ai dùng requireAdultMember) che
// cho mọi route trong tệp — bỏ qua bước này thì cả aiProxyRoutes bị báo nhầm.
const guardedAtMount = new Set(
  SERVICES.filter((service) => service.guard).map((service) => path.basename(service.module)),
);

const seen = new Set();
for (const file of files) {
  if (guardedAtMount.has(file)) continue;
  const src = await readFile(path.join(routesDir, file), "utf8");
  const blanket = /router\.use\(\s*[a-zA-Z]*[Rr]equire\w+/.test(src);

  for (const match of src.matchAll(/router\.(get|post|put|delete|patch)\s*\(/g)) {
    const tail = src.slice(match.index, match.index + 900);
    // Từ dấu mở ngoặc tới đầu hàm xử lý: chứa đường dẫn + mọi middleware, kể cả
    // khi khai báo trải nhiều dòng (hugoTeamRoutes viết kiểu đó và từng bị báo
    // nhầm là không có cổng).
    const [head, ...rest] = tail.split(/=>\s*\{|,\s*async\s*\(|function\s*\(/);
    const body = rest.join("").slice(0, 700);
    const route = (head.match(/(['"`])([^'"`]*)\1/) || [])[2] ?? "?";
    const key = `${file} ${match[1].toUpperCase()} ${route}`;

    // Cổng gọi trong thân handler cũng tính (robotRoutes làm vậy).
    if (blanket || KNOWN_GUARDS.test(head) || /verifyRobotAuth\s*\(/.test(body)) continue;

    seen.add(key);
    if (!(key in PUBLIC_ROUTES)) {
      problems.push(`${key}\n      → không có cổng và chưa khai là công khai. Gắn middleware, hoặc thêm vào PUBLIC_ROUTES kèm lý do.`);
    }
  }
}

// Dòng thừa trong danh sách cho phép cũng là lỗi: route đã gắn cổng hoặc đã xoá
// mà vẫn nằm đây thì lần sau người đọc tưởng nó đang mở.
for (const key of Object.keys(PUBLIC_ROUTES)) {
  if (!seen.has(key)) problems.push(`${key}\n      → nằm trong PUBLIC_ROUTES nhưng route này đã có cổng hoặc không còn tồn tại. Xoá dòng đó.`);
}

if (problems.length) {
  console.error(`Cổng xác thực CHƯA đạt (${problems.length}):\n` + problems.map((p) => `  ✗ ${p}`).join("\n"));
  process.exit(1);
}

console.log(
  `Cổng xác thực đạt: ${files.length} tệp route, ${Object.keys(PUBLIC_ROUTES).length} route công khai đều có lý do.`,
);
process.exit(0);
