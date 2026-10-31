/**
 * Tách file lời đọc liền một mạch (ElevenLabs) thành 7 đoạn theo cảnh.
 *
 *   node artifacts/pwa-install-guide/source/split-voice.mjs vi 5.17,13.96,18.11,21.53,27.25,34.65
 *
 * Vào: ../voice/source/<lang>.mp3 · Ra: ../voice/<lang>-01.mp3 … -07.mp3
 * Điểm cắt (giây) đặt ở giữa khoảng lặng giữa hai đoạn — xem bằng:
 *   ffmpeg -i voice/source/vi.mp3 -af silencedetect=noise=-35dB:d=0.35 -f null -
 * Mỗi đoạn được bỏ lặng ở hai đầu; render.mjs tự thêm khoảng thở.
 */
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const voiceDir = join(dirname(fileURLToPath(import.meta.url)), "..", "voice");
const [lang, cutsArg] = process.argv.slice(2);
const cuts = String(cutsArg || "").split(",").map(Number).filter((n) => n > 0);
if (!lang || cuts.length !== 6) {
  console.error("Cần: <lang> và đúng 6 điểm cắt, vd. vi 5.17,13.96,18.11,21.53,27.25,34.65");
  process.exit(1);
}
const source = join(voiceDir, "source", `${lang}.mp3`);
const bounds = [0, ...cuts, null];
const trim = "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.08,areverse";
for (let i = 0; i < 7; i += 1) {
  const out = join(voiceDir, `${lang}-${String(i + 1).padStart(2, "0")}.mp3`);
  const range = ["-ss", String(bounds[i]), ...(bounds[i + 1] ? ["-to", String(bounds[i + 1])] : [])];
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", source, ...range, "-af", trim, "-c:a", "libmp3lame", "-q:a", "2", out]);
  const seconds = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", out], { encoding: "utf8" }).trim();
  console.log(`${out}  ${Number(seconds).toFixed(2)}s`);
}
