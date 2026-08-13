#!/usr/bin/env node
/**
 * iOS web app: khi KHÔNG có apple-touch-startup-image khớp cỡ máy, iOS lấy ẢNH
 * CHỤP phiên trước làm màn hình khởi động rồi cross-fade → thấy tab-bar và nội
 * dung cũ đè lên giao diện mới. Có ảnh khớp thì iOS dùng ảnh, hết chồng lớp.
 *
 * ponytail: ảnh chỉ là nền đặc #0b0a0f — đúng bằng nền .hugo-splash trong
 * index.html (trong PWA splash luôn tối, kể cả máy đang theme sáng), nên không
 * cần bản sáng và không cần vẽ logo: React vẽ tiếp spinner lên đúng nền đó.
 *
 * Chạy lại sau khi thêm máy mới vào DEVICES: node scripts/generate-ios-splash.mjs
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const BG = "#0b0a0f";
const OUT_DIR = path.resolve("public/splash");
const HTML = path.resolve("index.html");
const START = "<!-- ios-splash:start (scripts/generate-ios-splash.mjs) -->";
const END = "<!-- ios-splash:end -->";

// [device-width, device-height, dpr] — chỉ dọc, chỉ iPhone.
const DEVICES = [
  [375, 667, 2], // SE 2/3, 8
  [414, 736, 3], // 8 Plus
  [375, 812, 3], // X, XS, 11 Pro, 12/13 mini
  [414, 896, 2], // XR, 11
  [414, 896, 3], // XS Max, 11 Pro Max
  [390, 844, 3], // 12/13/14, 16e
  [428, 926, 3], // 12/13 Pro Max, 14 Plus
  [393, 852, 3], // 14 Pro, 15, 15 Pro, 16
  [430, 932, 3], // 14 Pro Max, 15 Plus/Pro Max, 16 Plus
  [402, 874, 3], // 16 Pro
  [440, 956, 3], // 16 Pro Max
];

await mkdir(OUT_DIR, { recursive: true });

const tags = [];
for (const [w, h, dpr] of DEVICES) {
  const px = { width: w * dpr, height: h * dpr };
  const file = `splash-${px.width}x${px.height}.png`;
  await sharp({ create: { ...px, channels: 3, background: BG } })
    .png({ compressionLevel: 9, palette: true })
    .toFile(path.join(OUT_DIR, file));
  tags.push(
    `    <link rel="apple-touch-startup-image" href="/splash/${file}" ` +
      `media="(device-width: ${w}px) and (device-height: ${h}px) and ` +
      `(-webkit-device-pixel-ratio: ${dpr}) and (orientation: portrait)" />`
  );
}

const html = await readFile(HTML, "utf8");
const from = html.indexOf(START);
const to = html.indexOf(END, from);
if (from < 0 || to < 0) throw new Error(`index.html thiếu cặp mốc ${START} … ${END}`);
const block = [START, ...tags, `    ${END}`].join("\n");
await writeFile(HTML, html.slice(0, from) + block + html.slice(to + END.length));

console.log(`${DEVICES.length} ảnh → public/splash/, đã cập nhật index.html`);
