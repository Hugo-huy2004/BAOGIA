/**
 * Canh các lớp bảo vệ đăng nhập admin.
 *
 * Ngày 2026-09-02 audit tìm ra: /request-otp phát OTP cho BẤT KỲ AI gọi, nên
 * toàn bộ bảo mật admin rút gọn thành đoán 6 chữ số; token admin không mang
 * uaHash nên phần đối chiếu thiết bị trong requireAdmin là code chết; và JWT
 * 14 ngày không có đường thu hồi.
 *
 * Mấy lớp này im lặng khi bị gỡ — không có lỗi build, không có route đỏ, chỉ
 * là hệ thống lặng lẽ yếu đi. Bộ này giữ chúng lại.
 *
 * Chạy: npm run check:admin-auth
 */
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const serverDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFile(path.join(serverDir, p), "utf8");

const [routes, middleware, model] = await Promise.all([
  read("routes/adminRoutes.js"),
  read("middleware/authMiddleware.js"),
  read("models/Admin.js"),
]);

const checks = [
  {
    name: "Không có cửa phát OTP thiếu xác thực",
    ok: !/router\.(post|get)\(\s*['"]\/request-otp['"]/.test(routes),
    why: "adminRoutes có /request-otp trở lại — nó phát OTP không cần mật khẩu, biến cả lớp bảo mật admin thành 6 chữ số đoán được.",
  },
  {
    name: "Đăng nhập bắt buộc có mật khẩu",
    ok: /verifyAndUpgrade\(adminCandidate, password\)/.test(routes),
    why: "/login không còn đối chiếu mật khẩu trước khi phát OTP.",
  },
  {
    name: "Token admin mang uaHash (ràng buộc thiết bị)",
    ok: /role:\s*'admin',\s*uaHash/.test(routes),
    why: "JWT admin ký thiếu uaHash — phần kiểm thiết bị trong requireAdmin thành code chết, token bị cắp dùng được ở mọi máy.",
  },
  {
    name: "requireAdmin có đối chiếu uaHash",
    ok: /decoded\.uaHash\s*!==\s*currentUaHash/.test(middleware),
    why: "requireAdmin không còn so vân tay thiết bị.",
  },
  {
    name: "/verify-otp có giới hạn số lần",
    ok: /router\.post\(\s*['"]\/verify-otp['"]\s*,\s*otpVerifyLimiter/.test(routes),
    why: "/verify-otp mất rate limit — chỉ còn bộ đếm 5 lần/token, xin token mới là đoán tiếp.",
  },
  {
    name: "Admin có mốc thu hồi phiên",
    ok: /sessionsValidFrom/.test(model),
    why: "Model Admin mất trường sessionsValidFrom — không còn đường thu hồi JWT 14 ngày.",
  },
  {
    name: "requireAdmin từ chối token đã thu hồi",
    ok: /sessionsValidFrom/.test(middleware) && /decoded\.iat/.test(middleware),
    why: "requireAdmin không đối chiếu iat với sessionsValidFrom — đăng xuất lại chỉ xoá cookie ở trình duyệt.",
  },
  {
    name: "Đăng xuất đẩy mốc thu hồi",
    ok: /\/logout['"]\s*,\s*requireAdmin/.test(routes) && /sessionsValidFrom:\s*new Date\(\)/.test(routes),
    why: "/logout không còn thu hồi phiên — token đã bị chép ra vẫn sống hết 14 ngày.",
  },
];

const failed = checks.filter((c) => !c.ok);
for (const c of checks) console.log(`${c.ok ? "OK " : "✗  "} ${c.name}`);

if (failed.length === 0) {
  console.log(`\nCổng admin đạt: ${checks.length} lớp bảo vệ còn nguyên.`);
  process.exit(0);
}
console.error(`\n✗ ${failed.length} lớp bảo vệ admin đã mất:\n`);
for (const c of failed) console.error(`  ${c.name}\n    → ${c.why}\n`);
process.exit(1);
