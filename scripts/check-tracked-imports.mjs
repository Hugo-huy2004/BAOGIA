// Bắt lỗi "chạy trên máy tôi mà hỏng trên CI": một file ĐÃ commit import sang
// một file CHƯA commit. Build cục bộ luôn xanh vì file vẫn nằm trên đĩa; chỉ khi
// CI clone sạch mới nổ UNRESOLVED_IMPORT. Nên `npm run build` không phát hiện
// được — phải đối chiếu với đúng những gì git đang theo dõi.
//
// Chạy: node scripts/check-tracked-imports.mjs
import { execSync } from "node:child_process";
import { statSync } from "node:fs";
import path from "node:path";

const sh = (cmd) => execSync(cmd, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const tracked = new Set(sh("git ls-files").split("\n").filter(Boolean));

// Vite thử lần lượt các đuôi này khi import không ghi rõ phần mở rộng.
const EXTS = ["", ".jsx", ".js", ".ts", ".tsx", "/index.jsx", "/index.js", "/index.ts"];

// Chỉ bắt câu lệnh import đứng đầu dòng — đủ cho ES module thật.
const IMPORT_RE = /^\s*(?:import|export)[^'"\n]*?from\s*["'](\.[^"']+)["']|^\s*import\s*\(\s*["'](\.[^"']+)["']/gm;

// Thư mục bài học chứa code mẫu cho học viên trong template literal, không phải
// module thật — quét vào sẽ toàn dương tính giả.
const SKIP = /^src\/components\/member\/hugoCoder\/lessons\//;

const isFile = (p) => {
  try { return statSync(p).isFile(); } catch { return false; }
};

const sources = [...tracked].filter((f) => /^src\/.*\.(jsx?|tsx?)$/.test(f) && !SKIP.test(f));
const problems = [];

for (const file of sources) {
  const dir = path.dirname(file);
  // Đọc bản ĐÃ COMMIT, không đọc file trên đĩa: CI build từ HEAD, còn trên đĩa
  // có thể đang có sửa đổi chưa commit khiến kết quả sai lệch cả hai chiều.
  const code = sh(`git show HEAD:"${file}"`);
  for (const m of code.matchAll(IMPORT_RE)) {
    const spec = m[1] ?? m[2];
    const base = path.normalize(path.join(dir, spec));
    const resolved = EXTS.map((e) => base + e).find(isFile);
    if (!resolved) problems.push(`${file}\n    import "${spec}" → không tìm thấy file nào khớp`);
    else if (!tracked.has(resolved)) problems.push(`${file}\n    import "${spec}" → ${resolved} chưa được commit`);
  }
}

if (problems.length === 0) {
  console.log(`✓ ${sources.length} file đã commit — mọi import cục bộ đều trỏ tới file đã commit.`);
  process.exit(0);
}

console.error(`✗ ${problems.length} import sẽ làm hỏng build trên CI:\n`);
for (const p of problems) console.error(`  ${p}\n`);
console.error("Cách sửa: git add file còn thiếu, hoặc bỏ import nếu không dùng nữa.");
process.exit(1);
