/**
 * Sinh `src/components/public/TechLogo.jsx` — logo thương hiệu của các công nghệ
 * xuất hiện trong `src/data/projects.js`.
 *
 * Vì sao sinh ra tệp tĩnh thay vì gọi thư viện icon lúc chạy: @iconify/react tải
 * dữ liệu icon qua mạng (api.iconify.design), mà CSP của site chặn fetch ngoài —
 * icon sẽ trắng trơn trên bản production. Nạp cả gói simple-icons vào trình
 * duyệt thì gánh 3.400 icon để dùng hơn chục cái.
 *
 * Thêm công nghệ mới vào `stack` của một dự án rồi chạy lại:
 *     node scripts/generate-tech-logos.mjs
 * Tên nào chưa khớp slug thì khai báo ở BẢNG TÊN bên dưới; không có logo cũng
 * không sao, chip vẫn hiện chữ.
 */
import fs from "node:fs";
import path from "node:path";
import * as icons from "simple-icons";

const ROOT = path.resolve(import.meta.dirname, "..");

// BẢNG TÊN: chữ hiển thị trên chip → slug của simple-icons.
const SLUGS = {
  react: "react",
  "react native": "react",
  vite: "vite",
  tailwind: "tailwindcss",
  "tailwind css": "tailwindcss",
  javascript: "javascript",
  typescript: "typescript",
  "node.js": "nodedotjs",
  mongodb: "mongodb",
  cloudinary: "cloudinary",
  "google oauth": "google",
  firebase: "firebase",
  firestore: "firebase",
  sqlite: "sqlite",
  expo: "expo",
  java: "openjdk",
  android: "android",
  ios: "apple",
  "next.js": "nextdotjs",
  "next.js 16": "nextdotjs",
  "react 19": "react",
  html: "html5",
  css: "css",
  sharp: null,
  pwa: "pwa",
  capacitor: "capacitor",
  websocket: null, // WebSocket là giao thức, không phải Socket.io
  leaflet: "leaflet",
  "open-meteo": null,
  "expo router": "expo",
  "graph api facebook": "facebook",
  facebook: "facebook",
};

const stacks = new Set();
const source = fs.readFileSync(path.join(ROOT, "src/data/projects.js"), "utf8");
for (const match of source.matchAll(/stack:\s*\[([^\]]+)\]/g)) {
  for (const raw of match[1].split(",")) {
    const name = raw.trim().replace(/^["']|["']$/g, "");
    if (name) stacks.add(name);
  }
}

const entries = [];
const missing = [];
for (const name of [...stacks].sort()) {
  const key = name.toLowerCase();
  const slug = key in SLUGS ? SLUGS[key] : key.replace(/[^a-z0-9]/g, "");
  if (!slug) continue;
  const icon = icons[`si${slug[0].toUpperCase()}${slug.slice(1)}`];
  if (!icon) { missing.push(name); continue; }
  // Logo gần như đen (Next.js, Apple, JavaScript…) biến mất trên nền tối, nên
  // đánh dấu lại để CSS lật sang màu chữ khi ở chế độ tối.
  const [r, g, bl] = [0, 2, 4].map((i) => parseInt(icon.hex.slice(i, i + 2), 16) / 255);
  const dark = 0.2126 * r + 0.7152 * g + 0.0722 * bl < 0.22;
  entries.push({ name, title: icon.title, hex: icon.hex, path: icon.path, dark });
}

const file = `// TỆP SINH TỰ ĐỘNG — đừng sửa tay.
// Chạy lại: node scripts/generate-tech-logos.mjs
//
// Logo lấy từ simple-icons (CC0). Đây là NGOẠI LỆ có chủ đích của quy ước icon
// đơn sắc: người đọc nhận ra một dãy công nghệ bằng logo nhanh hơn bằng chữ,
// và logo thương hiệu thì phải đúng màu của nó mới nhận ra được.

const LOGOS = {
${entries.map((e) => `  ${JSON.stringify(e.name)}: { title: ${JSON.stringify(e.title)}, hex: "#${e.hex}", path: ${JSON.stringify(e.path)}, dark: ${e.dark} },`).join("\n")}
};

export function hasTechLogo(name) {
  return Boolean(LOGOS[name]);
}

export default function TechLogo({ name, size = 18 }) {
  const logo = LOGOS[name];
  if (!logo) return null;
  return (
    <svg
      role="img"
      aria-hidden="true"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={logo.hex}
      data-dark={logo.dark ? "true" : undefined}
      className="tech-logo"
    >
      <path d={logo.path} />
    </svg>
  );
}
`;

fs.writeFileSync(path.join(ROOT, "src/components/public/TechLogo.jsx"), file);
console.log(`TechLogo: ${entries.length} logo (${[...stacks].length} công nghệ).`);
if (missing.length) console.log("Chưa có logo:", missing.join(", "));
