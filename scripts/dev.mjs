/**
 * `npm run dev` — một lệnh, một cổng cho trình duyệt.
 *
 * Vite (3000) là thứ duy nhất bạn mở; nó proxy /api và /ws sang Node (8099).
 * Trước đây phải nhớ chạy hai lệnh ở hai cửa sổ, và quên một cái thì trình duyệt
 * lặng lẽ quay sang backend production — sửa code server ở máy mà không hiểu sao
 * không ăn.
 *
 * Không thêm thư viện chạy song song nào: spawn của Node đủ dùng.
 */
import { spawn } from "node:child_process";
import net from "node:net";
import process from "node:process";

const BACKEND_PORT = Number(process.env.PORT || 8099);
const FRONTEND_PORT = 3000; // khớp `server.port` trong vite.config.js

/**
 * Cổng có đang bận không.
 *
 * Phải thử BÌNH ĐẲNG cách server thật bind — `listen(port)` trên mọi giao diện
 * (Node mặc định `::`). Thử riêng 127.0.0.1 là bỏ sót: Metro/Expo giữ `*:8081`
 * qua IPv6, IPv4 vẫn nhận nên phép thử báo "trống", rồi backend chết vì
 * EADDRINUSE đúng lúc mọi thứ đã khởi động.
 */
function portInUse(port) {
  return new Promise((resolve) => {
    const probe = net.createServer();
    probe.once("error", (err) => resolve(err.code === "EADDRINUSE"));
    probe.once("listening", () => probe.close(() => resolve(false)));
    probe.listen(port);
  });
}

function waitForPort(port, timeoutMs = 30000) {
  const startedAt = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      const probe = net.createConnection({ port, host: "127.0.0.1" });
      probe.once("connect", () => {
        probe.destroy();
        resolve();
      });
      probe.once("error", () => {
        probe.destroy();
        if (Date.now() - startedAt >= timeoutMs) {
          reject(new Error(`Backend không lắng nghe cổng ${port} sau ${timeoutMs / 1000}s.`));
          return;
        }
        setTimeout(check, 250);
      });
    };
    check();
  });
}

// Cái bẫy đắt nhất của thiết lập này: một tiến trình LẠ đang giữ cổng backend.
// Metro/Expo (mặc định 8081) trả HTML kèm status 200 cho mọi đường dẫn, nên
// `/api/*` không báo lỗi — nó "thành công" với một trang web. Thà dừng ngay và
// nói thẳng còn hơn để người dùng đi dò một lỗi không tồn tại trong mã.
if (await portInUse(BACKEND_PORT)) {
  console.error(`\n✖ Cổng ${BACKEND_PORT} đang bị chiếm — backend không khởi động được.\n`);
  console.error(`  Xem ai giữ:  lsof -nP -iTCP:${BACKEND_PORT} -sTCP:LISTEN`);
  console.error(`  Rồi tắt nó, hoặc đổi cổng:  PORT=8100 npm run dev\n`);
  process.exit(1);
}

// Vite bận cổng 3000 thì nó tự nhảy sang 3001, 3002… — mà cả điểm của thiết lập
// này là chỉ có ĐÚNG MỘT địa chỉ để mở. Dừng lại còn hơn để bạn mở nhầm một
// phiên cũ đang chạy ở 3000 rồi tưởng code mới không ăn.
if (await portInUse(FRONTEND_PORT)) {
  console.error(`\n✖ Cổng ${FRONTEND_PORT} đang bị chiếm — có thể là một phiên dev cũ chưa tắt.\n`);
  console.error(`  Xem ai giữ:  lsof -nP -iTCP:${FRONTEND_PORT} -sTCP:LISTEN\n`);
  process.exit(1);
}

const children = [];
function run(name, command, args, options = {}) {
  const child = spawn(command, args, { stdio: "inherit", shell: false, ...options });
  child.on("exit", (code) => {
    // Một nửa chết thì nửa kia vô dụng — đừng để lại tiến trình mồ côi giữ cổng.
    if (!shuttingDown) {
      console.error(`\n✖ ${name} đã dừng (mã ${code}). Đang tắt phần còn lại.`);
      shutdown(code ?? 1);
    }
  });
  children.push(child);
  return child;
}

let shuttingDown = false;
function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) child.kill("SIGTERM");
  process.exit(code);
}
process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

// `npm run dev` ở server/ là nodemon, `npm start` là node trần. Dùng bản trần
// thì sửa route xong server vẫn chạy code cũ, và triệu chứng là một endpoint
// mới toanh trả 404 y như chưa từng viết — mất cả buổi đi tìm lỗi trong code
// đúng. Cùng họ với vụ PayOS "lỗi code" hoá ra là tiến trình cũ chưa chết.
run("backend", "npm", ["run", "dev"], { cwd: "server", env: { ...process.env, PORT: String(BACKEND_PORT) } });

try {
  await waitForPort(BACKEND_PORT);
} catch (error) {
  console.error(`\n✖ ${error.message}`);
  shutdown(1);
}

run("vite", "npx", ["vite"], {
  env: { ...process.env, VITE_DEV_BACKEND_URL: process.env.VITE_DEV_BACKEND_URL || `http://localhost:${BACKEND_PORT}` },
});
