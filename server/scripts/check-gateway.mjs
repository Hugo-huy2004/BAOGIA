/**
 * Canh cho BẢN KHAI và thực tế không trôi khỏi nhau.
 *
 * Lời hứa của services.manifest.js là "thêm service = khai một dòng". Lời hứa
 * đó chỉ đúng nếu không ai lén `app.use('/api/...')` thẳng trong server.js —
 * route như vậy vẫn chạy trên Render (cùng process) nhưng nginx không biết nó
 * tồn tại, nên sẽ 404 ngay hôm tách service. Đó là loại lỗi chỉ lộ ra lúc
 * deploy, nên phải bắt ở đây.
 *
 * Chạy: npm run check:gateway
 */
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const serverDir = path.resolve(here, "..");

const { SERVICES, WS_CHANNELS, prefixRoutingTable } = await import(
  path.join(serverDir, "services.manifest.js")
);

const problems = [];
const fail = (message) => problems.push(message);

// ── 1. id phải là duy nhất — nó thành tên upstream nginx và tên container ───
const seen = new Set();
for (const service of SERVICES) {
  if (seen.has(service.id)) fail(`id trùng: "${service.id}"`);
  seen.add(service.id);
  if (!service.prefix?.startsWith("/api/")) fail(`${service.id}: prefix phải bắt đầu bằng /api/ (đang là "${service.prefix}")`);
  if (!service.module?.startsWith("./routes/")) fail(`${service.id}: module phải trỏ vào ./routes/`);
}

// ── 2. Mỗi module phải nạp được và export default một Router ────────────────
// Không có bước này thì gõ sai tên tệp chỉ vỡ lúc khởi động production.
for (const service of SERVICES) {
  try {
    const module = await import(path.join(serverDir, service.module));
    if (typeof module.default !== "function") {
      fail(`${service.id}: ${service.module} không export default một Router`);
    }
  } catch (error) {
    fail(`${service.id}: nạp ${service.module} lỗi — ${error.message}`);
  }
}

// ── 3. Cùng một prefix thì phải cùng mode ───────────────────────────────────
// nginx chỉ trỏ được MỘT prefix tới MỘT nơi. /api/store có ba router; tách một
// cái ra process riêng mà quên hai cái kia là mất route âm thầm.
for (const { prefix, services } of prefixRoutingTable()) {
  const modes = new Set(services.map((service) => service.mode || "inline"));
  if (modes.size > 1) {
    fail(`prefix "${prefix}" có ${services.length} service nhưng khác mode (${[...modes].join(", ")}) — nginx chỉ trỏ được một nơi`);
  }
  const ports = new Set(services.filter((s) => s.mode === "process").map((s) => s.port));
  if (ports.has(undefined)) fail(`prefix "${prefix}": mode "process" phải khai "port"`);
}

// ── 4. Không còn mount tay nào trong server.js ──────────────────────────────
const serverSource = await readFile(path.join(serverDir, "server.js"), "utf8");
const manualMounts = [...serverSource.matchAll(/^app\.use\((['"`])(\/api\/[^'"`]+)\1\s*,\s*(\w+)/gm)]
  // Middleware theo prefix (cors, rate-limit) không phải service — nhận diện
  // bằng việc đối số thứ hai là lời gọi hàm, không phải một router đã import.
  .filter(([, , , second]) => !["cors", "rateLimit", "helmet", "express"].includes(second));

for (const [, , prefix] of manualMounts) {
  fail(`server.js còn mount tay "${prefix}" — chuyển nó vào services.manifest.js`);
}

// ── 5. Kênh WebSocket phải có handler thật trong server.js ──────────────────
for (const channel of WS_CHANNELS) {
  if (!serverSource.includes(`'${channel.path}'`)) {
    fail(`kênh WS "${channel.path}" có trong bản khai nhưng server.js không xử lý upgrade cho nó`);
  }
}

if (problems.length) {
  console.error("Cổng API KHÔNG đồng bộ:\n" + problems.map((p) => `  ✗ ${p}`).join("\n"));
  process.exit(1);
}

const inline = SERVICES.filter((s) => (s.mode || "inline") === "inline").length;
const split = SERVICES.length - inline;
console.log(
  `Cổng API đồng bộ: ${SERVICES.length} service (${inline} chung process, ${split} tách riêng), ` +
  `${prefixRoutingTable().length} prefix, ${WS_CHANNELS.length} kênh WS.`
);

// Thoát tường minh: nạp router kéo theo scheduler và pool Mongo, chúng giữ event
// loop sống mãi và script treo cho tới khi CI giết. Đã kiểm xong thì đi.
process.exit(0);
