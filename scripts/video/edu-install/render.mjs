// Dựng video "Cài Education Hugo" bằng code: Chrome vẽ scene.html, chụp từng khung
// (30 fps), ffmpeg ghép thành MP4. Mỗi ngôn ngữ một video.
//
//   node scripts/video/edu-install/render.mjs            # vi, en, zh
//   node scripts/video/edu-install/render.mjs en         # một ngôn ngữ
//   node scripts/video/edu-install/render.mjs --script   # in lời thoại liền một đoạn cho ElevenLabs
//
// Lồng tiếng (ElevenLabs): dán NGUYÊN đoạn của `--script` vào ElevenLabs, xuất MỘT tệp,
// đặt tên voice/<lang>.mp3 (vi.mp3, en.mp3, zh.mp3). Giữa các cảnh có thẻ <break> nên
// giọng đọc ngừng lâu hơn hẳn chỗ khác; script tìm các khoảng lặng đó (ffmpeg silencedetect),
// tự cắt thành 5 cảnh, kéo dài cảnh cho vừa lời rồi ghép tiếng đúng lúc. Chưa có tệp thì
// ra video không tiếng. ElevenLabs v3+ bỏ qua <break>: khi đó ghi mốc cắt tay vào
// copy.json → voiceCuts.<lang> (4 số giây), script bám vào khoảng lặng gần mỗi mốc.
//
// Cần: Google Chrome đã cài, ffmpeg trong PATH.
import fs from "node:fs";
import path from "node:path";
import { spawn, spawnSync, execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../../..");
const EDU = path.join(ROOT, "apps/web/public/edu");
const OUT = path.join(EDU, "video");
const FPS = 30;
const COPY = JSON.parse(fs.readFileSync(path.join(HERE, "copy.json"), "utf8"));
const langs = process.argv.slice(2).length ? process.argv.slice(2) : ["vi", "en", "zh"];

const FILES = {
  "/scene.html": path.join(HERE, "scene.html"),
  "/gsap.min.js": path.join(ROOT, "node_modules/gsap/dist/gsap.min.js"),
};
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".svg": "image/svg+xml", ".png": "image/png" };

// Khoảng nghỉ giữa hai cảnh trong lời thoại — dài hơn mọi chỗ ngắt câu tự nhiên.
const SCENE_BREAK = '<break time="1.5s" />';
const scriptOf = (lang) => COPY[lang].scenes.map((scene) => scene.say).join(` ${SCENE_BREAK} `);
if (process.argv.includes("--script")) {
  for (const lang of ["vi", "en", "zh"]) console.log(`── ${lang} ──\n${scriptOf(lang)}\n`);
  process.exit(0);
}

const seconds = (file) => Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]).toString().trim());

/**
 * Cắt tệp lời thoại chung thành từng cảnh. Chỗ cắt = khoảng lặng gần nhất với vị trí
 * dự kiến (tỉ lệ số chữ của các cảnh), ưu tiên khoảng lặng dài (thẻ <break> giữa cảnh).
 * Trả [[bắt đầu, kết thúc], …] tính bằng giây, đã bỏ phần lặng ở hai đầu.
 */
function splitScenes(file, scenes, manual) {
  const total = seconds(file);
  // silencedetect ghi kết quả ra stderr.
  const log = spawnSync("ffmpeg", ["-hide_banner", "-i", file, "-af", "silencedetect=noise=-38dB:d=0.35", "-f", "null", "-"], { encoding: "utf8" }).stderr;
  const silences = [...log.matchAll(/silence_start: ([\d.]+)[\s\S]*?silence_end: ([\d.]+)/g)].map(([, a, b]) => [Number(a), Number(b)]);
  const lengths = scenes.map((scene) => [...scene.say].length);
  const sum = lengths.reduce((a, b) => a + b, 0);
  const head = silences[0]?.[0] < 0.05 ? silences[0][1] : 0;
  const tail = silences.at(-1)?.[1] > total - 0.05 ? silences.at(-1)[0] : total;
  const cuts = [];
  // Có mốc cắt tay (copy.json voiceCuts): lấy khoảng lặng gần mỗi mốc nhất.
  if (manual?.length === scenes.length - 1) {
    for (const at of manual) {
      const near = [...silences].sort((x, y) => Math.abs((x[0] + x[1]) / 2 - at) - Math.abs((y[0] + y[1]) / 2 - at))[0];
      cuts.push(near && Math.abs((near[0] + near[1]) / 2 - at) < 0.8 ? near : [at, at]);
    }
    return scenes.map((_, i) => [i ? cuts[i - 1][1] : head, i < cuts.length ? cuts[i][0] : tail]);
  }
  let used = 0;
  for (let i = 0; i < scenes.length - 1; i++) {
    used += lengths[i];
    const expected = head + (tail - head) * (used / sum);
    const inner = silences.filter(([a, b]) => a > head + 0.1 && b < tail - 0.1 && !cuts.some((c) => c[0] === a));
    const best = inner.sort((x, y) => (Math.abs((x[0] + x[1]) / 2 - expected) - (x[1] - x[0]) * 2) - (Math.abs((y[0] + y[1]) / 2 - expected) - (y[1] - y[0]) * 2))[0];
    if (!best) throw new Error(`${file}: không tìm thấy khoảng lặng giữa cảnh ${i + 1} và ${i + 2} — kiểm tra thẻ <break> khi tạo giọng.`);
    cuts.push(best);
  }
  cuts.sort((a, b) => a[0] - b[0]);
  return scenes.map((_, i) => [i ? cuts[i - 1][1] : head, i < cuts.length ? cuts[i][0] : tail]);
}

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });

for (const lang of langs) {
  const scenes = COPY[lang].scenes;
  const voice = ["mp3", "wav", "m4a"].map((ext) => path.join(HERE, "voice", `${lang}.${ext}`)).find((f) => fs.existsSync(f));
  const segments = voice ? splitScenes(voice, scenes, COPY.voiceCuts?.[lang]) : null;
  // Cảnh dài bằng đoạn lời của nó + 0,5 giây thở (scene.html giữ thời lượng gốc nếu lời ngắn hơn).
  const durations = segments ? segments.map(([from, to]) => to - from + 0.5) : [];

  const page = await browser.newPage({ viewport: { width: 720, height: 1280 } });
  await page.route("http://video.local/**", (route) => {
    const name = new URL(route.request().url()).pathname;
    const file = FILES[name] || path.join(EDU, path.basename(name));
    route.fulfill({ path: file, contentType: TYPES[path.extname(file)] || "application/octet-stream" });
  });
  await page.addInitScript(`window.VIDEO_COPY = ${JSON.stringify(COPY)};`);
  await page.goto("http://video.local/scene.html", { waitUntil: "networkidle" });
  await page.evaluate(() => window.ready());
  const total = await page.evaluate(([l, d]) => window.build(l, d), [lang, durations]);
  const frames = Math.ceil(total * FPS);

  // Tiếng: cắt từng đoạn khỏi tệp chung, đặt trễ đúng giây cảnh đó bắt đầu rồi trộn lại.
  const sceneStarts = await page.evaluate(() => window.sceneStarts);
  const out = path.join(OUT, `install-${lang}.mp4`);
  const args = ["-y", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-"];
  if (segments) {
    args.push("-i", voice);
    const parts = segments.map(([from, to], i) => {
      const ms = Math.round((sceneStarts[i] + 0.15) * 1000);
      return `[1:a]atrim=start=${from.toFixed(3)}:end=${to.toFixed(3)},asetpts=PTS-STARTPTS,adelay=${ms}|${ms}[a${i}]`;
    });
    args.push("-filter_complex", `${parts.join(";")};${segments.map((_, i) => `[a${i}]`).join("")}amix=inputs=${segments.length}:normalize=0[a]`, "-map", "0:v", "-map", "[a]", "-c:a", "aac", "-b:a", "96k");
  }
  args.push("-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "27", "-preset", "slow", "-movflags", "+faststart", "-t", total.toFixed(2), out);
  const ffmpeg = spawn("ffmpeg", args, { stdio: ["pipe", "ignore", "inherit"] });
  const done = new Promise((resolve, reject) => ffmpeg.on("close", (code) => (code ? reject(new Error(`ffmpeg ${code}`)) : resolve())));

  for (let f = 0; f < frames; f++) {
    await page.evaluate((t) => window.seek(t), f / FPS);
    const shot = await page.screenshot({ type: "jpeg", quality: 90 });
    if (!ffmpeg.stdin.write(shot)) await new Promise((r) => ffmpeg.stdin.once("drain", r));
    // Ảnh bìa: khung lúc Hugo vừa chào xong.
    if (f === Math.round(3.2 * FPS)) fs.writeFileSync(path.join(OUT, `install-${lang}.jpg`), shot);
    if (f % 150 === 0) process.stdout.write(`\r${lang}: ${f}/${frames}`);
  }
  ffmpeg.stdin.end();
  await done;
  await page.close();
  console.log(`\r${lang}: ${(fs.statSync(out).size / 1e6).toFixed(2)} MB, ${total.toFixed(1)} s${segments ? `, lồng tiếng: ${segments.map(([a, b]) => `${a.toFixed(1)}–${b.toFixed(1)}s`).join(" | ")}` : ", chưa lồng tiếng"} → ${path.relative(ROOT, out)}`);
}
await browser.close();
