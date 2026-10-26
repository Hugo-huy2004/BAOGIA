import { chromium } from "playwright-core";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const work = join(here, ".render");
const outDir = join(here, "..", "..", "..", "public", "video", "pwa-install");
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
// Giọng đọc có sẵn trên macOS cho từng ngôn ngữ; lời đọc khớp chữ trên cảnh trong index.html.
const LANGS = {
  vi: { voice: "Linh", rate: "178", scripts: [
    "Cài Hugo Studio như một ứng dụng trên điện thoại chỉ mất khoảng ba mươi giây. Đây là cách đúng cho cả iPhone và Android.",
    "Trên iPhone hoặc iPad, mở trang Hugo Studio bằng Safari. Nếu đang ở Zalo, Facebook hoặc Chrome, Quý thành viên sao chép liên kết rồi mở lại bằng Safari.",
    "Trong Safari, chạm nút Chia sẻ, là ô vuông có mũi tên hướng lên. Tùy bố cục Safari, nút Chia sẻ có thể nằm trong menu trang.",
    "Vuốt danh sách và chọn Thêm vào Màn hình chính. Nếu chưa thấy, cuộn xuống Sửa tác vụ rồi thêm mục này.",
    "Giữ tên Hugo Studio, bật Mở dưới dạng ứng dụng web, rồi nhấn Thêm ở góc trên bên phải. Bước này giúp ứng dụng mở toàn màn hình.",
    "Trên Android dùng Chrome, cách nhanh nhất là nhấn Cài đặt ngay trên portal, rồi xác nhận Cài đặt trong hộp thoại hệ thống.",
    "Nếu không thấy nút nhanh, mở menu ba chấm của Chrome, chọn Cài đặt ứng dụng rồi xác nhận. Một số máy ghi là Thêm vào màn hình chính.",
    "Quay về màn hình chính và mở biểu tượng Hugo Studio vừa tạo. Ứng dụng sẽ chạy toàn màn hình, không còn thanh địa chỉ.",
    "Cài đặt đã hoàn tất. Nếu vẫn thấy thanh địa chỉ, xóa biểu tượng và cài lại đúng theo các bước vừa xem.",
  ] },
  en: { voice: "Samantha", rate: "180", scripts: [
    "Installing Hugo Studio as an app on your phone takes about thirty seconds. Here is the right way for both iPhone and Android.",
    "On iPhone or iPad, open Hugo Studio in Safari. If you are in Zalo, Facebook or Chrome, copy the link and open it again in Safari.",
    "In Safari, tap the Share button, the square with an arrow pointing up. Depending on the layout, Share may be inside the page menu.",
    "Scroll the list and choose Add to Home Screen. If it is not there, scroll down to Edit Actions and add it.",
    "Keep the name Hugo Studio, turn on Open as Web App, then tap Add in the top right corner. This makes the app open full screen.",
    "On Android with Chrome, the fastest way is to tap Install now on the portal, then confirm Install in the system dialog.",
    "If there is no quick button, open Chrome's three dot menu, choose Install app, and confirm. On some phones it reads Add to Home screen.",
    "Go back to the home screen and open the new Hugo Studio icon. The app runs full screen, with no address bar.",
    "That's it. If you still see an address bar, delete the icon and install again following these steps.",
  ] },
  zh: { voice: "Tingting", rate: "190", scripts: [
    "把 Hugo Studio 安装成手机应用，只需要大约三十秒。下面是 iPhone 和安卓的正确方法。",
    "在 iPhone 或 iPad 上，请用 Safari 打开 Hugo Studio。如果正在 Zalo、Facebook 或 Chrome 中，请复制链接，再用 Safari 打开。",
    "在 Safari 中，点击共享按钮，也就是带向上箭头的方框。根据布局不同，共享按钮可能在页面菜单里。",
    "滑动列表，选择添加到主屏幕。如果没看到，请滚动到编辑操作，把这一项加进去。",
    "保留名称 Hugo Studio，打开作为网页 App 打开，然后点右上角的添加。这样应用就会全屏打开。",
    "在使用 Chrome 的安卓手机上，最快的方法是点击门户上的立即安装，然后在系统对话框中确认安装。",
    "如果没有快捷按钮，请打开 Chrome 的三点菜单，选择安装应用并确认。部分手机显示为添加到主屏幕。",
    "回到主屏幕，打开新建的 Hugo Studio 图标。应用会全屏运行，不再有地址栏。",
    "安装完成。如果仍然看到地址栏，请删除图标，并按刚才的步骤重新安装。",
  ] },
};

rmSync(work, { recursive: true, force: true });
mkdirSync(work, { recursive: true });

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ executablePath: chrome, headless: true, args: ["--allow-file-access-from-files"] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
for (const [lang, { voice, rate, scripts }] of Object.entries(LANGS)) {
for (let i = 0; i < scripts.length; i += 1) {
  await page.goto(`file://${join(here, "index.html")}?lang=${lang}&scene=${i}`, { waitUntil: "networkidle" });
  await page.screenshot({ path: join(work, `scene-${i}.png`) });
}
const output = join(outDir, `${lang}.mp4`);
execFileSync("ffmpeg", ["-v", "error", "-y", "-i", join(work, "scene-0.png"), "-vf", "scale=540:-1", "-q:v", "5", join(outDir, `${lang}.jpg`)]);

const concatLines = [];
for (let i = 0; i < scripts.length; i += 1) {
  const audio = join(work, `voice-${i}.aiff`);
  execFileSync("say", ["-v", voice, "-r", rate, "-o", audio, scripts[i]]);
  const seconds = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", audio], { encoding: "utf8" }).trim()) + 1.0;
  const clip = join(work, `clip-${i}.mp4`);
  const vf = "scale=1100:1956,crop=1080:1920:x='10+4*sin(t*0.65)':y='18+4*cos(t*0.55)',fade=t=in:st=0:d=0.35,fade=t=out:st=" + Math.max(.2, seconds - .35).toFixed(2) + ":d=0.35";
  const result = spawnSync("ffmpeg", ["-y", "-loop", "1", "-i", join(work, `scene-${i}.png`), "-i", audio, "-t", seconds.toFixed(2), "-vf", vf, "-af", "afade=t=in:st=0:d=0.18,afade=t=out:st=" + Math.max(.2, seconds - .28).toFixed(2) + ":d=0.28,volume=1.5", "-r", "30", "-c:v", "libx264", "-preset", "medium", "-crf", "30", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", clip], { stdio: "ignore" });
  if (result.status !== 0) process.exit(result.status ?? 1);
  concatLines.push(`file '${clip.replaceAll("'", "'\\''")}'`);
}

const concatFile = join(work, "clips.txt");
writeFileSync(concatFile, `${concatLines.join("\n")}\n`);
execFileSync("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", concatFile, "-c", "copy", "-movflags", "+faststart", output], { stdio: "ignore" });
console.log(output);
}
await browser.close();
