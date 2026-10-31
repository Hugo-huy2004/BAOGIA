/**
 * Render video hướng dẫn cài PWA → public/video/pwa-install/<lang>.mp4 (+ .jpg).
 *
 *   node artifacts/pwa-install-guide/source/render.mjs            # cả 3 thứ tiếng
 *   node artifacts/pwa-install-guide/source/render.mjs vi         # một thứ tiếng
 *
 * Lời đọc: ../voice/<lang>-01.mp3 … <lang>-07.mp3 (thu bằng ElevenLabs theo
 * ../voice-script.md). Có file thì mỗi cảnh kéo dài theo lời đọc; thiếu file
 * thì cảnh dùng độ dài mặc định và video không có tiếng.
 *
 * Từng khung hình được dựng bằng window.seek(t) trong index.html rồi chụp lại,
 * nên video giống hệt nhau ở mọi lần render, không phụ thuộc tốc độ máy.
 */
import { chromium } from "playwright-core";
import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const voiceDir = join(here, "..", "voice");
const outDir = join(here, "..", "..", "..", "public", "video", "pwa-install");
const FPS = 30;
const SCENES = 7;
const LEAD = 0.55;   // lặng trước lời đọc, sau khi cảnh hiện
const TAIL = 1.1;    // lặng sau lời đọc, để thao tác trên máy kịp xong
const MIN = [5.5, 6.5, 5, 5, 6, 7, 8.5]; // thao tác trên máy cần ít nhất chừng này

const probe = (file) => Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", file], { encoding: "utf8" }).trim());

mkdirSync(outDir, { recursive: true });
const langs = process.argv[2] ? [process.argv[2]] : ["vi", "en", "zh"];
// Trình duyệt: CHROME_PATH nếu đặt, không thì Chrome trên macOS, hoặc Chromium của Playwright.
const CHROMES = [process.env.CHROME_PATH, "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/opt/pw-browsers/chromium/chrome-linux64/chrome", "/opt/pw-browsers/chromium-1243/chrome-linux64/chrome"];
const executablePath = CHROMES.find((path) => path && existsSync(path));
const browser = await chromium.launch({ executablePath, args: ["--allow-file-access-from-files"] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });

for (const lang of langs) {
  const voices = Array.from({ length: SCENES }, (_, i) => join(voiceDir, `${lang}-${String(i + 1).padStart(2, "0")}.mp3`));
  const haveVoice = voices.every(existsSync);
  if (!haveVoice && voices.some(existsSync)) console.warn(`[${lang}] thiếu một vài file lời đọc — render không tiếng.`);
  const durations = haveVoice
    ? voices.map((file, i) => Math.max(MIN[i], LEAD + probe(file) + TAIL))
    : MIN.map((d, i) => [5.5, 9, 6, 5.5, 7.5, 9.5, 9][i] || d);

  await page.goto(`file://${join(here, "index.html")}?lang=${lang}&render=1&durations=${durations.map((d) => d.toFixed(2)).join(",")}`);
  await page.evaluate(() => window.ready);
  const total = await page.evaluate(() => window.TOTAL);
  const starts = await page.evaluate(() => window.SCENE_STARTS);
  const output = join(outDir, `${lang}.mp4`);

  // Âm thanh: mỗi đoạn lời đọc đặt đúng đầu cảnh của nó (+ LEAD).
  const audioArgs = haveVoice
    ? [...voices.flatMap((file) => ["-i", file]),
      "-filter_complex",
      voices.map((_, i) => `[${i + 1}:a]aresample=48000,adelay=${Math.round((starts[i] + LEAD) * 1000)}:all=1[a${i}]`).join(";")
        + `;${voices.map((_, i) => `[a${i}]`).join("")}amix=inputs=${SCENES}:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11,apad[aout]`,
      "-map", "0:v", "-map", "[aout]"]
    : ["-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo", "-map", "0:v", "-map", "1:a"];

  const ffmpeg = spawn("ffmpeg", [
    "-v", "error", "-y",
    "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-",
    ...audioArgs,
    "-t", total.toFixed(3),
    "-c:v", "libx264", "-preset", "slow", "-crf", "24", "-pix_fmt", "yuv420p", "-tune", "animation",
    "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", output,
  ], { stdio: ["pipe", "inherit", "inherit"] });
  const done = new Promise((resolve, reject) => ffmpeg.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg ${code}`)))));

  const frames = Math.ceil(total * FPS);
  for (let f = 0; f < frames; f += 1) {
    await page.evaluate((t) => window.seek(t), f / FPS);
    const shot = await page.screenshot({ type: "jpeg", quality: 92 });
    if (!ffmpeg.stdin.write(shot)) await new Promise((r) => ffmpeg.stdin.once("drain", r));
  }
  ffmpeg.stdin.end();
  await done;

  // Ảnh bìa: khoảnh khắc mở đầu đã hiện đủ.
  await page.evaluate(() => window.seek(2.2));
  await page.screenshot({ path: join(outDir, `${lang}.png`) });
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", join(outDir, `${lang}.png`), "-vf", "scale=540:-1", "-q:v", "4", join(outDir, `${lang}.jpg`)]);
  execFileSync("rm", ["-f", join(outDir, `${lang}.png`)]);
  console.log(`${output}  ${total.toFixed(1)}s  ${haveVoice ? "có lời đọc" : "chưa có lời đọc"}`);
}
await browser.close();
