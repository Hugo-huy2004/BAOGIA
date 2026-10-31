/**
 * Dựng sẵn nhân vật bằng DiceBear thành SVG tĩnh — không tốn byte JS nào lúc chạy.
 *   node scripts/generate-mascots.mjs   (npm run gen:mascots)
 *
 * Hai bộ:
 *   /coder/buddy-<mood>.svg  Hugo kiểu "avataaars" (Pablo Stanley, miễn phí cả thương mại) — Coding trong Hugo Studio
 *   /edu/buddy-<mood>.svg    nhân vật "clay" (DiceBear, CC0) — Education Hugo, màu tươi
 *   /edu/cast-<n>.svg        dàn nhân vật clay cho trang giới thiệu Education Hugo
 *   /edu/prof.svg            giáo sư của cảnh trắc nghiệm
 *   Nhân vật chính màu xanh giọt nước của Hugo Studio (hsl 194 100% 58% = #29cdff).
 *   /edu/icon-*.png          icon PWA Education Hugo (chụp buddy-learn bằng Chrome qua playwright-core)
 */
import fs from "node:fs";
import path from "node:path";
import { Avatar, Style } from "@dicebear/core";

const PUBLIC = path.resolve(import.meta.dirname, "../apps/web/public");
const style = (name) => new Style(JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, `../node_modules/@dicebear/styles/dist/${name}.min.json`))));
const write = (dir, file, svg) => {
  fs.mkdirSync(path.join(PUBLIC, dir), { recursive: true });
  fs.writeFileSync(path.join(PUBLIC, dir, file), svg);
};

// ── Hugo (avataaars): tóc đen ngắn, kính râm, hoodie xanh ─────────────────────
const avataaars = style("avataaars");
const HUGO = {
  seed: "hugo",
  topVariant: ["shortFlat"],
  hairColor: ["2c1b18"],
  accessoriesVariant: ["wayfarers"],
  accessoriesProbability: 100,
  accessoriesColor: ["262e33"],
  skinColor: ["ffdbb4"],
  clothesVariant: ["hoodie"],
  clothesColor: ["5199e4"],
  facialHairProbability: 0,
};
const HUGO_FACE = {
  learn: { eyesVariant: ["default"], eyebrowsVariant: ["defaultNatural"], mouthVariant: ["smile"] },
  practice: { eyesVariant: ["squint"], eyebrowsVariant: ["upDownNatural"], mouthVariant: ["default"] },
  exam: { eyesVariant: ["default"], eyebrowsVariant: ["raisedExcitedNatural"], mouthVariant: ["serious"] },
  correct: { eyesVariant: ["happy"], eyebrowsVariant: ["raisedExcitedNatural"], mouthVariant: ["smile"] },
  wrong: { eyesVariant: ["default"], eyebrowsVariant: ["sadConcernedNatural"], mouthVariant: ["concerned"] },
  done: { eyesVariant: ["happy"], eyebrowsVariant: ["raisedExcited"], mouthVariant: ["twinkle"] },
};
for (const [mood, face] of Object.entries(HUGO_FACE)) {
  write("coder", `buddy-${mood}.svg`, new Avatar(avataaars, { ...HUGO, ...face }).toString());
}

// ── Education Hugo (clay): bảng màu tươi, nền trong suốt (backgroundColor: []), có nhịp "thở" sẵn ──
const clay = style("clay");
const VIVID = ["58cc02", "1cb0f6", "ff9600", "ff4b4b", "ce82ff", "ffc800", "00cd9c", "ff86d0"];
const BUDDY = { seed: "edu-hugo", backgroundColor: [], bodyVariant: ["pear"], bodyColor: ["29cdff"], accentColor: ["ffc800"], topVariant: ["ears"], topProbability: 100, patternProbability: 0, animationVariant: ["medium"] };
const BUDDY_FACE = {
  learn: { eyesVariant: ["big"], mouthVariant: ["smile"] },
  practice: { eyesVariant: ["side"], mouthVariant: ["line"] },
  exam: { eyesVariant: ["up"], mouthVariant: ["o"] },
  correct: { eyesVariant: ["happy"], mouthVariant: ["smileBig"] },
  wrong: { eyesVariant: ["down"], mouthVariant: ["frown"] },
  done: { eyesVariant: ["happy"], mouthVariant: ["laugh"] },
};
for (const [mood, face] of Object.entries(BUDDY_FACE)) {
  write("edu", `buddy-${mood}.svg`, new Avatar(clay, { ...BUDDY, ...face }).toString());
}
const CAST = [
  ["boulder", "58cc02", "googly", "smileBig"], ["gumdrop", "ff4b4b", "big", "smileBig"],
  ["egg", "ffc800", "even", "laugh"], ["dollop", "ce82ff", "happy", "smile"],
  ["cube", "ff9600", "big", "grin"], ["blob", "00cd9c", "wink", "smileTongue"],
  ["bell", "ff86d0", "googly", "toothy"], ["squat", "1899d6", "big", "openSmall"],
];
CAST.forEach(([body, color, eyes, mouth], i) => {
  write("edu", `cast-${i + 1}.svg`, new Avatar(clay, {
    seed: `edu-cast-${i}`, backgroundColor: [], bodyVariant: [body], bodyColor: [color], accentColor: [VIVID[(i + 3) % VIVID.length]],
    eyesVariant: [eyes], mouthVariant: [mouth], patternProbability: body === "gumdrop" ? 0 : 55, // hoạ tiết zig dưới miệng gumdrop trông như mếu animationVariant: [["slow", "medium", "slowest", "fast"][i % 4]],
  }).toString());
});

// Giáo sư của cảnh trắc nghiệm (mũ tốt nghiệp vẽ chồng ở EduLanding.jsx).
write("edu", "prof.svg", new Avatar(clay, {
  seed: "edu-prof", backgroundColor: [], bodyVariant: ["bell"], bodyColor: ["ce82ff"], accentColor: ["ffc800"],
  topProbability: 0, patternProbability: 0, eyesVariant: ["even"], mouthVariant: ["smile"], animationVariant: ["slow"],
}).toString());

// ── Icon PWA: iOS và Android đòi PNG. SVG clay đã tự chừa lề nên phóng to hơn khung; maskable nhỏ lại cho vùng an toàn. ──
const { chromium } = await import("playwright-core");
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage();
const buddy = `data:image/svg+xml;base64,${fs.readFileSync(path.join(PUBLIC, "edu/buddy-learn.svg")).toString("base64")}`;
for (const [file, size, scale] of [["icon-192.png", 192, 1.15], ["icon-512.png", 512, 1.15], ["icon-maskable-512.png", 512, 0.9], ["apple-touch-icon.png", 180, 1.1]]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<body style="margin:0;width:${size}px;height:${size}px;background:#fff url('${buddy}') 50% 30% / ${scale * 100}% no-repeat"></body>`);
  await page.waitForTimeout(100);
  await page.screenshot({ path: path.join(PUBLIC, "edu", file), animations: "disabled" });
}
await browser.close();

console.log(`✓ ${Object.keys(HUGO_FACE).length} Hugo → public/coder, ${Object.keys(BUDDY_FACE).length + CAST.length} clay → public/edu`);
