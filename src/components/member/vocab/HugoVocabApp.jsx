import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import AppFrame from "../os/AppFrame";
import { GRAMMAR_LESSONS } from "./grammarLessons";
import { SENTENCE_PATTERNS } from "./sentencePatterns";
import { startPresence, stopPresence, subscribeNearby, subscribeToss, tossCard } from "./vocabToss";
import vocabApi from "../../../services/classes/VocabService";
import { IndexedDBStorage } from "../../../utils/indexedDBStorage";
import { BackgroundSyncEngine } from "../../../utils/backgroundSyncEngine";

const api = (path, opts = {}) => vocabApi.request(path, opts);

const loadWithTimeout = (promise, timeoutMs = 12000) => Promise.race([
  promise,
  new Promise((_, reject) => window.setTimeout(() => reject(new Error("REQUEST_TIMEOUT")), timeoutMs)),
]);

// Phát âm bằng giọng đọc sẵn của trình duyệt (miễn phí). Đọc CHẬM và chọn giọng
// tiếng Trung chất lượng cao nếu có (Ting-Ting/Mei-Jia/Google) — dễ nghe, dễ nhại.
function pickZhVoice(voices) {
  const pref = [/Tingting|Ting-Ting/i, /Meijia|Mei-Jia/i, /Google\s*普通话|Google.*(Mandarin|Chinese)/i, /Yaoyao|Sinji|Li-?mu/i, /zh[-_]CN/i, /zh[-_]TW/i, /zh|cmn|Chinese/i];
  for (const re of pref) { const v = voices.find((x) => re.test(x.name) || re.test(x.lang)); if (v) return v; }
  return null;
}
// Mở khoá phát âm: trình duyệt (nhất là iOS/Safari) CHẶN speechSynthesis.speak()
// cho tới khi có thao tác người dùng. Auto-đọc nằm trong effect (chạy SAU fetch)
// nên tách khỏi cú chạm → bị chặn im lặng. Ta "mồi" engine bằng một câu rỗng
// ngay thao tác ĐẦU TIÊN trong app; sau đó mọi lần đọc tự động đều phát được.
let _speechPrimed = false;
function primeSpeechOnce() {
  if (_speechPrimed) return;
  const synth = window.speechSynthesis;
  if (!synth) return;
  _speechPrimed = true;
  try {
    synth.resume();
    const u = new SpeechSynthesisUtterance(" ");
    u.volume = 0;                 // im lặng, chỉ để mở khoá
    synth.speak(u);
  } catch { /* noop */ }
}

function speak(text) {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    synth.resume();               // iOS đôi khi để hàng đợi ở trạng thái paused
    let ran = false;
    const go = () => {
      if (ran) return; ran = true; // chống chạy đôi (event + timeout cùng gọi)
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "zh-CN";
      const v = pickZhVoice(synth.getVoices() || []);
      if (v) u.voice = v;
      u.rate = 0.65;   // chậm, rõ từng âm
      u.pitch = 1.0;
      synth.speak(u);
    };
    // Danh sách giọng đôi khi nạp trễ — chờ một nhịp nếu chưa có.
    if (!synth.getVoices().length) { synth.onvoiceschanged = go; setTimeout(go, 250); }
    else go();
  } catch { /* im lặng nếu trình duyệt chặn */ }
}

// ── Pinyin tô màu theo THANH ĐIỆU ────────────────────────────────────────────
// Đây KHÔNG phải icon — là công cụ học: mỗi thanh một màu, nhìn là nhớ thanh.
const TONE_COLOR = { 1: "#ef4444", 2: "#f59e0b", 3: "#16a34a", 4: "#3b82f6", 0: "#94a3b8" };
const TONE_MARK = {
  ā: 1, ē: 1, ī: 1, ō: 1, ū: 1, ǖ: 1,
  á: 2, é: 2, í: 2, ó: 2, ú: 2, ǘ: 2,
  ǎ: 3, ě: 3, ǐ: 3, ǒ: 3, ǔ: 3, ǚ: 3,
  à: 4, è: 4, ì: 4, ò: 4, ù: 4, ǜ: 4,
};
const toneOf = (syl) => { for (const ch of String(syl)) if (TONE_MARK[ch]) return TONE_MARK[ch]; return 0; };
// Pinyin LUÔN dùng font sạch (không theo kiểu chữ Hán đã chọn) để 行书/报刊 không
// làm phần latin khó đọc. Chỉ chữ Hán mới đổi theo lựa chọn.
const PINYIN_FONT = '-apple-system,"Segoe UI",Roboto,sans-serif';
function PinyinText({ text, className, style }) {
  const tokens = String(text || "").split(/(\s+)/);
  return (
    <span className={className} style={{ fontFamily: PINYIN_FONT, ...style }}>
      {tokens.map((tok, i) => (tok.trim() === "" ? tok : <span key={i} style={{ color: TONE_COLOR[toneOf(tok)] }}>{tok}</span>))}
    </span>
  );
}

// Chọn nghĩa theo ngôn ngữ học: en_zh → tiếng Anh (nếu có), còn lại tiếng Việt.
const mn = (c, lang) => (lang === "en_zh" && c?.meaningEn ? c.meaningEn : c?.meaning) || "";

function HanVietChip({ text }) {
  if (!text) return null;
  return <span className="mt-1 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-bold" style={{ background: CHIP, color: LABEL }}><Icon name="compare_arrows" size={13} /> 汉越：{text}</span>;
}

const DECK_LABELS = {
  hsk1: "HSK 1", hsk2: "HSK 2", hsk3: "HSK 3", hsk4: "HSK 4", hsk5: "HSK 5", hsk6: "HSK 6",
  tocfl1: "TOCFL 1", tocfl2: "TOCFL 2", tocfl3: "TOCFL 3", tocfl4: "TOCFL 4", tocfl5: "TOCFL 5", tocfl6: "TOCFL 6",
};

function calendarLinks(hour = 20) {
  const hh = String(hour).padStart(2, "0");
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Hugo Studio//Vocab//VI",
    "BEGIN:VEVENT", `DTSTART:20260101T${hh}0000`, "RRULE:FREQ=DAILY",
    "SUMMARY:复习中文词汇 (Hugo)", "DESCRIPTION:花5分钟复习单词。",
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  return {
    icsUrl: `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`,
    gcal: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent("复习中文词汇 (Hugo)")}&recur=RRULE:FREQ=DAILY`,
  };
}

// Hệ màu GIẤY cố định — mực ấm đậm trên nền ngà, KHÔNG dùng token lật theo dark
// mode (đó là lý do chữ Hán từng chìm trắng-trên-trắng). Một app = một hệ màu.
const ACCENT = "#e11d48";
// Tươi mới: một dải gradient chủ đạo (hồng → cam) cho hero/nút chính. Đây là
// điểm nhấn có chủ đích cho app học, không phải nền động toàn portal.
const GRAD = "linear-gradient(135deg,#fb7185 0%,#e11d48 55%,#f97316 130%)";
const GRAD_SOFT = "linear-gradient(135deg,#fff1f2,#ffedd5)";
const CARD = { background: "#fffdf8" };   // thẻ giấy trắng ấm
const SEP = "#e8e1d3";                     // đường kẻ ấm
const LABEL = "#2b2620";                   // mực ấm đậm (luôn đọc được)
const LABEL2 = "#8a8175";                  // mực nhạt ấm
const CHIP = "rgba(120,113,108,0.12)"; // nền chip icon đơn sắc (trung tính ấm)
// ── KIỂU CHỮ CHỮ HÁN cá nhân hoá (chọn trong Cài đặt) ──
//  modern = hiện đại (sans, dễ đọc — mặc định)
//  print  = kiểu chữ IN kiểu văn tự báo 1900s (Tống/Minh có chân)
//  cal    = HÀNH THƯ / thư pháp (Ma Shan Zheng)
// Áp qua biến --vocab-zh cho mọi chữ có lang="zh" trong app; latin/pinyin giữ nguyên.
const ZH_FONTS = {
  modern: '-apple-system,"PingFang SC","HarmonyOS Sans SC","Microsoft YaHei",sans-serif',
  print: '"Noto Serif SC","Songti SC","Source Han Serif SC","SimSun",serif',
  cal: '"Ma Shan Zheng","KaiTi","STKaiti","Kaiti SC",cursive',
};
const ZH_FONT_LINK = {
  print: "https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@500;700&display=swap",
  cal: "https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&display=swap",
};
function loadZhFontLink(style) {
  const href = ZH_FONT_LINK[style];
  if (!href || typeof document === "undefined" || document.getElementById(`zhfont-${style}`)) return;
  const l = document.createElement("link"); l.id = `zhfont-${style}`; l.rel = "stylesheet"; l.href = href;
  document.head.appendChild(l);
}
function ensureZhFonts() { loadZhFontLink("print"); loadZhFontLink("cal"); } // nạp để xem trước trong Cài đặt
function applyZhFont(style) {
  const s = ZH_FONTS[style] ? style : "modern";
  loadZhFontLink(s);
  try { document.documentElement.style.setProperty("--vocab-zh", ZH_FONTS[s]); } catch { /* noop */ }
}
function clearZhFont() { try { document.documentElement.style.removeProperty("--vocab-zh"); } catch { /* noop */ } }

// Hiệu ứng game + áp font chữ Hán theo lựa chọn (biến --vocab-zh).
function injectVocabStyles() {
  if (typeof document === "undefined" || document.getElementById("vocab-anim")) return;
  const s = document.createElement("style");
  s.id = "vocab-anim";
  s.textContent = `
[lang="zh"]{font-family:var(--vocab-zh, inherit)}
@keyframes v-pop{0%{transform:scale(.82)}55%{transform:scale(1.14)}100%{transform:scale(1)}}
@keyframes v-shake{0%,100%{transform:translateX(0)}18%{transform:translateX(-8px)}36%{transform:translateX(8px)}54%{transform:translateX(-6px)}72%{transform:translateX(6px)}90%{transform:translateX(-3px)}}
@keyframes v-float{0%{opacity:0;transform:translate(-50%,4px) scale(.85)}25%{opacity:1}100%{opacity:0;transform:translate(-50%,-34px) scale(1.15)}}
@keyframes v-burst{0%{opacity:0;transform:translate(-50%,-50%) scale(.5)}40%{opacity:1;transform:translate(-50%,-50%) scale(1.15)}100%{opacity:0;transform:translate(-50%,-50%) scale(1.35)}}
.v-pop{animation:v-pop .38s cubic-bezier(.2,1.5,.4,1)}
.v-shake{animation:v-shake .42s}
.v-float{animation:v-float 1s ease-out forwards}
.v-burst{animation:v-burst .9s ease-out forwards}`;
  document.head.appendChild(s);
}

// NỀN theo KHOÁ (halftone chấm, pastel, mờ, lệch góc — tinh thần spec editorial):
//  HSK (giản thể) → Tử Cấm Thành / Thiên An Môn (mực coral + lam-lục).
//  TOCFL (phồn thể) → Đài Bắc 101 (mực lam-lục + son nhạt).
// Nếu có ảnh thật /image/vocab-bg-*.png thì ưu tiên (đổi 1 dòng khi bạn thả file).
function VocabBg({ track }) {
  const tw = track === "traditional";
  const inkA = tw ? "#3f8f86" : "#c9736a";
  const inkB = tw ? "#c9736a" : "#3f8f86";
  const id = tw ? "tw" : "cn";
  // Nếu có ảnh thật (bạn sinh theo VISUAL SPECIFICATION rồi thả vào public/image/)
  // thì ưu tiên; không có (onError) thì rơi về motif SVG halftone bên dưới.
  const [imgOk, setImgOk] = useState(false);
  const src = tw ? "/image/vocab-bg-tocfl.png" : "/image/vocab-bg-hsk.png";
  return (
    <div className="relative h-full w-full">
      <img
        src={src}
        alt=""
        aria-hidden="true"
        onLoad={() => setImgOk(true)}
        onError={() => setImgOk(false)}
        className={`absolute inset-0 h-full w-full object-cover object-bottom transition-opacity duration-500 ${imgOk ? "opacity-60" : "pointer-events-none h-px w-px opacity-0"}`}
      />
      <svg viewBox="0 0 160 90" preserveAspectRatio="xMidYMax slice" className={`h-full w-full transition-opacity duration-500 ${imgOk ? "opacity-0" : "opacity-100"}`} style={{ opacity: imgOk ? 0 : 0.58 }} aria-hidden="true">
      <defs>
        <linearGradient id={`wash-${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={inkA} stopOpacity="0.08" /><stop offset="1" stopColor={inkB} stopOpacity="0.02" /></linearGradient>
        <linearGradient id={`land-${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={inkA} stopOpacity="0.22" /><stop offset="1" stopColor={inkA} stopOpacity="0.05" /></linearGradient>
        <filter id={`soft-${id}`}><feGaussianBlur stdDeviation="2.2" /></filter>
      </defs>
      <rect width="160" height="90" fill={`url(#wash-${id})`} />
      <path d="M0 68 C24 59 38 65 57 62 C78 58 93 66 112 61 C132 56 145 61 160 57 V90 H0Z" fill={`url(#land-${id})`} opacity="0.7" />
      <g fill="none" stroke={inkB} strokeWidth="0.7" opacity="0.18">
        <path d="M0 72 C28 64 45 71 68 67 S112 65 160 70" />
        <path d="M0 78 C26 72 44 78 70 74 S120 72 160 77" />
        <path d="M8 24 C28 18 44 20 61 25 S94 31 112 24 S142 18 156 22" />
      </g>
      {tw ? (
        <g>
          {/* Skyline Đài Bắc: 101 ở trung tâm, đồi xanh và dãy công trình thấp. */}
          <path d="M0 60 C18 49 32 54 47 47 C63 39 76 47 92 40 C111 32 132 43 160 35 V90 H0Z" fill="#65a84c" opacity="0.34" />
          <path d="M0 80h160v10H0z" fill="#2e5960" opacity="0.28" />
          <g fill="#c87561" opacity="0.56">
            <path d="M0 66h12v24H0z" /><path d="M14 70h12v20H14z" /><path d="M29 62h9v28h-9z" />
            <path d="M119 63h14v27h-14z" /><path d="M135 70h12v20h-12z" /><path d="M150 65h10v25h-10z" />
          </g>
          <g fill="#d4a84f" opacity="0.65">
            <path d="M0 64h12l-2-4H2z" /><path d="M28 60h11l-2-4h-7z" /><path d="M118 61h16l-3-4h-10z" />
            <path d="M148 63h12l-2-4h-8z" />
          </g>
          <g transform="translate(86 90)">
            <path d="M-7 0h14L5-4H-5z" fill="#315b5c" opacity="0.8" />
            <rect x="-6" y="-55" width="12" height="55" rx="1" fill="#3e9490" opacity="0.78" />
            {Array.from({ length: 8 }).map((_, k) => <path key={k} d={`M -6 ${-6 - k * 6} H 6 L 4 ${-10 - k * 6} H -4 Z`} fill="#b7dfc4" opacity="0.7" />)}
            <path d="M-8-56h16l-2-4H-6zM-4-60h8l-2-5H-2zM-1-65h2v-9h-2zM-3-74h6l-3-5z" fill="#29585d" opacity="0.9" />
          </g>
          <g fill="#6b4d42" opacity="0.72">
            <path d="M42 75h16v15H42z" /><path d="M46 69h8l-4-5z" />
            <path d="M105 73h12v17h-12z" /><path d="M106 70h10l-2-4h-6z" />
          </g>
          <g fill="#f0c86b" opacity="0.7">
            {Array.from({ length: 9 }).map((_, k) => <rect key={k} x={k * 18 + 2} y={84 - (k % 2) * 3} width="6" height="1.2" rx="0.6" />)}
          </g>
          <path d="M0 89h160" stroke="#26484f" strokeWidth="1.5" opacity="0.75" />
        </g>
      ) : (
        <g>
          {/* Cận cảnh tường son + mái xanh ngói vàng, theo cảm giác Tử Cấm Thành. */}
          <path d="M-8 42 L168 4 V91 H-8Z" fill="#a91619" opacity="0.32" />
          <path d="M-8 36 L168 -3 L168 6 L-8 46Z" fill="#173f36" opacity="0.72" />
          <path d="M-8 33 L168 -6 L168 -1 L-8 39Z" fill="#d09a42" opacity="0.72" />
          <path d="M-8 28 L168 -10 L168 -5 L-8 34Z" fill="#4d241c" opacity="0.76" />
          <path d="M-8 26 L168 -12 L168 -8 L-8 30Z" fill="#2b1714" opacity="0.82" />
          <path d="M40 23 L76 5 L91 14 L55 35Z" fill="#251514" opacity="0.8" />
          <path d="M38 22 L75 0 L92 10 L56 29Z" fill="#315d59" opacity="0.58" />
          <path d="M34 21 L75 -3 L96 9 L91 12 L75 5 L42 25Z" fill="#b9793f" opacity="0.62" />
          <path d="M-8 45 L168 7" stroke="#f0c84b" strokeWidth="1.2" opacity="0.8" />
          <path d="M-8 51 L168 13" stroke="#641719" strokeWidth="0.65" opacity="0.34" />
          <g fill="#f2c96b" opacity="0.55">
            {Array.from({ length: 11 }).map((_, k) => <circle key={k} cx={k * 17 - 3} cy={39 - k * 3.7} r="1.35" />)}
          </g>
          <path d="M0 62h160v28H0z" fill="#7d171a" opacity="0.12" />
        </g>
      )}
      <g fill={inkB} opacity="0.17">
        <path d="M8 70h22l-4-6H13z" />
        <path d="M43 75h18l-3-5H46z" />
        <path d="M72 72h23l-4-7H77z" />
        <path d="M137 70h16l-3-6h-10z" />
      </g>
      <path d="M0 86 C28 79 49 88 76 82 S126 78 160 84V90H0Z" fill={inkB} opacity="0.08" filter={`url(#soft-${id})`} />
      </svg>
    </div>
  );
}

// Icon ĐƠN SẮC dùng chung: nền trung tính, ký hiệu màu chữ (không màu mè).
function Icon({ name, size = 22, color = LABEL, fill = false }) {
  return <span className="material-symbols-outlined" style={{ fontSize: size, color, fontVariationSettings: fill ? "'FILL' 1" : undefined }}>{name}</span>;
}
function IconChip({ name, size = 22 }) {
  return <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl" style={{ background: CHIP }}><Icon name={name} size={size} /></span>;
}
// Tiêu đề khu + ô thao tác nhanh — giúp bố cục gọn, rõ từng nhóm.
function SectionTitle({ children }) {
  return <p className="mb-2 mt-1 px-1 text-[12px] font-black uppercase tracking-wider" style={{ color: LABEL2 }}>{children}</p>;
}
const CARD_COLORS = ["#8b5cf6", "#f97316", "#22c55e", "#ec4899", "#3b82f6", "#14b8a6"];
// Vòng tiến độ tròn (SVG) — hiện % tổng ở giữa.
function Ring({ pct = 0, size = 62, stroke = 7, color = ACCENT }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(100, pct) / 100)} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" style={{ fontWeight: 900, fontSize: size * 0.26, fill: LABEL }}>{pct}%</text>
    </svg>
  );
}

// Mặt cười ngộ nghĩnh (SVG trắng) cho đầu thẻ khoá học — vui, sinh động.
function Face() {
  return (
    <svg width="62" height="40" viewBox="0 0 62 40" aria-hidden="true">
      <ellipse cx="22" cy="16" rx="11" ry="12" fill="#fff" />
      <ellipse cx="44" cy="16" rx="11" ry="12" fill="#fff" />
      <circle cx="24" cy="17" r="4.5" fill="#1f2937" />
      <circle cx="42" cy="17" r="4.5" fill="#1f2937" />
      <path d="M22 33 Q31 40 40 33" stroke="#fff" strokeWidth="3.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

// Thẻ khoá học nhiều màu (kiểu Duolingo): đầu màu + mặt cười, thân trắng có tiến độ.
function LessonCard({ color, title, sub, done, total, pct, onClick, disabled }) {
  const hasNum = Number.isFinite(done) && Number.isFinite(total) && total > 0;
  const p = pct ?? (hasNum ? Math.round((done / total) * 100) : 0);
  return (
    <button onClick={onClick} disabled={disabled}
      className="overflow-hidden rounded-[24px] text-left shadow-sm active:scale-[0.97] transition-transform disabled:opacity-45"
      style={{ ...CARD, border: `1px solid ${SEP}` }}>
      <div className="flex h-[76px] items-center justify-center" style={{ background: color }}><Face /></div>
      <div className="p-3.5">
        <div className="text-[15px] font-black" style={{ color: LABEL }}>{title}</div>
        <div className="mt-0.5 truncate text-[11.5px]" style={{ color: LABEL2 }}>{sub}</div>
        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-black/10">
          <div className="h-full rounded-full transition-all" style={{ width: `${p}%`, background: color }} />
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[11px] font-bold" style={{ color: LABEL2 }}>
          <span>{hasNum ? `${done}/${total} 词` : sub && ""}</span>
          <span style={{ color: LABEL }}>{p}%</span>
        </div>
      </div>
    </button>
  );
}

export default function HugoVocabApp({ onBack, routeView, onRouteChange }) {
  const [view, setView] = useState("loading"); // loading|track|placement|home|review|exit|grammar|essay
  const [deck, setDeck] = useState("hsk1");
  const [mode, setMode] = useState("recognize");
  const [status, setStatus] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loadError, setLoadError] = useState("");
  const loadRequest = useRef(0);
  const [langPair, setLangPair] = useState("vi_zh");
  // Kiểu chữ Hán cá nhân hoá (lưu localStorage cho tức thì, theo máy).
  const [fontStyle, setFontStyle] = useState(() => {
    try { return localStorage.getItem("hugo:vocab-font") || "modern"; } catch { return "modern"; }
  });
  const pickFont = useCallback((f) => {
    setFontStyle(f);
    try { localStorage.setItem("hugo:vocab-font", f); } catch { /* noop */ }
  }, []);
  // Trạng thái màn nằm trong URL (?v=&deck=&mode=) để RELOAD vẫn ở đúng chỗ.
  const initial = useRef(new URLSearchParams(typeof window !== "undefined" ? window.location.search : ""));
  const initialRouteView = useRef(routeView);

  const topTab = ["review"].includes(view) ? "learn"
    : ["coach", "history"].includes(view) ? "progress"
    : ["settings"].includes(view) ? "settings"
    : ["practice", "reading", "conversation", "hanzi", "grammar", "essay", "sentence", "expand", "tones", "cloze"].includes(view) ? "practice"
    : "home";
  const tabs = [
    { id: "home", icon: "home", label: "首页" },
    { id: "learn", icon: "school", label: "学习" },
    { id: "practice", icon: "auto_awesome", label: "练习" },
    { id: "progress", icon: "insights", label: "进度" },
    { id: "settings", icon: "settings", label: "设置" },
  ];

  const changeTopTab = (next) => {
    if (next === "home") setView("home");
    if (next === "learn") startToday();
    if (next === "practice") setView("practice");
    if (next === "progress") setView("coach");
    if (next === "settings") setView("settings");
  };

  const loadHome = useCallback(async () => {
    const requestId = ++loadRequest.current;
    setLoadError("");
    setView("loading");
    try {
      // Gọi SONG SONG cho nhanh; /progress bỏ đi nếu chưa chọn khoá/chưa test.
      const [st, p] = await loadWithTimeout(Promise.all([api("/vocab/status"), api("/vocab/progress").catch(() => null)]));
      if (requestId !== loadRequest.current) return;
      if (st?.error) throw new Error(st.error);
      setStatus(st || null);
      if (st?.needsTrack) { setProgress(null); setView("track"); return; }
      if (st?.langPair) setLangPair(st.langPair);
      setProgress(p || null);
      if (st && !st.placed) { setView("placement"); return; }
      // Khôi phục màn/bộ/chế độ từ URL (một lần) — cổng gating ở trên luôn thắng.
      const q = initial.current; initial.current = new URLSearchParams();
      if (q.get("mode")) setMode(q.get("mode"));
      setDeck(q.get("deck") || st?.activeDeck || "hsk1");
      const iv = initialRouteView.current || q.get("v");
      setView(["review", "exit", "essay", "grammar", "skip", "history", "hanviet", "practice", "reading", "conversation", "hanzi", "coach", "settings", "sentence", "expand", "tones", "cloze"].includes(iv) ? iv : "home");
    } catch (error) {
      if (requestId !== loadRequest.current) return;
      setLoadError(error.message === "REQUEST_TIMEOUT" ? "连接学习服务超时。" : "暂时无法加载学习资料。");
      setView("error");
    }
  }, []);
  useEffect(() => { loadHome(); }, [loadHome]);

  // Bật "presence" khi mở app: báo cho các thiết bị khác cùng tài khoản biết máy
  // này đang mở vocab, để bật tính năng tung thẻ (xem vocabToss.js).
  useEffect(() => { startPresence(); return () => stopPresence(); }, []);
  useEffect(() => { injectVocabStyles(); }, []); // hiệu ứng game + rule font chữ Hán
  // Áp kiểu chữ Hán đã chọn; dọn biến khi rời app để không ảnh hưởng nơi khác.
  useEffect(() => { applyZhFont(fontStyle); }, [fontStyle]);
  useEffect(() => () => clearZhFont(), []);

  // Mở khoá phát âm ngay thao tác đầu tiên (cú chạm điều hướng vào màn học cũng
  // tính) → thẻ đầu tiên tự đọc được, không cần bấm loa trước.
  useEffect(() => {
    const prime = () => primeSpeechOnce();
    window.addEventListener("pointerdown", prime, { passive: true });
    window.addEventListener("keydown", prime);
    return () => { window.removeEventListener("pointerdown", prime); window.removeEventListener("keydown", prime); };
  }, []);

  // Ghi màn hiện tại vào URL (giữ nguyên path của portal, chỉ thêm query).
  useEffect(() => {
    if (view === "loading" || typeof window === "undefined") return;
    if (onRouteChange) {
      onRouteChange(view, { deck, mode });
      return;
    }
    const p = new URLSearchParams();
    p.set("v", view);
    if (view === "review") { p.set("deck", deck); p.set("mode", mode); }
    window.history.replaceState(null, "", `${window.location.pathname}?${p.toString()}`);
  }, [view, deck, mode, onRouteChange]);

  const subtitle = view === "review" ? DECK_LABELS[deck]
    : view === "placement" ? "分级测试"
    : view === "exit" ? "结业测验"
    : view === "skip" ? "跳级测试"
    : view === "essay" ? "写作考试"
    : view === "track" ? "选择课程"
    : view === "grammar" ? "重点语法"
    : view === "sentence" ? "造句"
    : view === "expand" ? "扩展词汇"
    : view === "tones" ? "声调"
    : view === "cloze" ? "完形填空"
    : view === "history" ? "已掌握"
    : view === "hanviet" ? "汉越词"
    : view === "coach" ? "学习顾问"
    : view === "practice" ? "练习"
    : view === "reading" ? "阅读"
    : view === "conversation" ? "对话"
    : view === "hanzi" ? "汉字"
    : view === "settings" ? "设置"
    : (status?.trackLabel || "华语学习");

  const startToday = () => { setMode("recognize"); if (status?.activeDeck) setDeck(status.activeDeck); setView("review"); };

  return (
    <AppFrame
      appId="vocab"
      forceScheme="light"
      title="华语"
      subtitle={subtitle}
      tabs={tabs}
      tab={topTab}
      onTabChange={changeTopTab}
      actions={null}
      bgLayer={status?.track ? <VocabBg track={status.track} /> : null}
      onBack={["review", "exit", "grammar", "essay", "skip", "history", "hanviet", "settings", "coach", "practice", "reading", "conversation", "hanzi", "sentence", "expand", "tones", "cloze"].includes(view) ? () => { setView("home"); loadHome(); } : onBack}
    >
      <div key={view} className="animate-fadeIn" style={{ fontFamily: "var(--vocab-zh, inherit)" }}>
      {view === "loading" && <LoadingState />}
      {view === "error" && <LoadError message={loadError} onRetry={loadHome} onBack={onBack} />}
      {view === "track" && <TrackPicker tracks={status?.tracks || []} onDone={() => loadHome()} />}
      {view === "grammar" && <Grammar />}
      {view === "placement" && <Quiz type="placement" onFinish={() => loadHome()} />}
      {view === "exit" && <Quiz type="exit" onFinish={() => loadHome()} />}
      {view === "essay" && <Essay onDone={() => { setView("home"); loadHome(); }} />}
      {view === "skip" && <Quiz type="skip" onFinish={() => loadHome()} />}
      {view === "history" && <History lang={langPair} />}
      {view === "hanviet" && <HanViet lang={langPair} />}
      {view === "settings" && <Settings status={status} fontStyle={fontStyle} onFont={pickFont} onDone={() => { setView("home"); loadHome(); }} />}
      {view === "reading" && <Reading />}
      {view === "conversation" && <Conversation />}
      {view === "hanzi" && <HanziLab />}
      {view === "practice" && (
        <PracticeHub
          onGrammar={() => setView("grammar")} onEssay={() => setView("essay")}
          onSentence={() => setView("sentence")} onExpand={() => setView("expand")}
          onTones={() => setView("tones")} onCloze={() => setView("cloze")}
          onListen={() => { setMode("listen"); if (status?.activeDeck) setDeck(status.activeDeck); setView("review"); }}
          onGuess={() => { setMode("meaning"); if (status?.activeDeck) setDeck(status.activeDeck); setView("review"); }}
          onHanViet={() => setView("hanviet")} onHistory={() => setView("history")}
          onReading={() => setView("reading")} onConversation={() => setView("conversation")} onHanzi={() => setView("hanzi")}
          onExam={() => setView("exam")}
        />
      )}
      {view === "home" && (
        <Home progress={progress} status={status}
          onStudyDeck={(d) => { setMode("recognize"); setDeck(d); setView("review"); }}
          onSkip={() => setView("skip")}
          onCoach={() => setView("coach")} />
      )}
      {view === "coach" && <Coach lang={langPair} onStart={startToday} />}
      {view === "sentence" && <SentenceBuild />}
      {view === "expand" && <Expand lang={langPair} />}
      {view === "tones" && <ToneDrill />}
      {view === "cloze" && <Cloze />}
      {view === "exam" && <MockExam onDone={() => { setView("practice"); }} />}
      {view === "review" && <Review deck={deck} mode={mode} lang={langPair} onDone={() => { setView("home"); loadHome(); }} onSkip={() => setView("skip")} canSkip={Boolean(status?.canSkipLevel)} />}
      </div>
      <TossLayer />
    </AppFrame>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
      <div className="mb-5 grid h-16 w-16 place-items-center rounded-[22px]" style={{ background: GRAD_SOFT }}>
        <Icon name="menu_book" size={30} color={ACCENT} />
      </div>
      <div className="text-[18px] font-black" style={{ color: LABEL }} lang="zh">正在准备学习空间</div>
      <div className="mt-1 text-[13px]" style={{ color: LABEL2 }} lang="zh">正在同步你的课程和进度…</div>
      <div className="mt-5 flex gap-1.5" aria-label="Loading">
        {[0, 1, 2].map((item) => <span key={item} className="h-2 w-2 animate-pulse rounded-full" style={{ background: ACCENT, animationDelay: `${item * 160}ms` }} />)}
      </div>
    </div>
  );
}

function LoadError({ message, onRetry, onBack }) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
      <div className="mb-5 grid h-16 w-16 place-items-center rounded-full" style={{ background: "rgba(239,68,68,.1)" }}>
        <Icon name="cloud_off" size={30} color="#dc2626" />
      </div>
      <div className="text-[18px] font-black" style={{ color: LABEL }} lang="zh">学习空间暂时打不开</div>
      <div className="mt-2 max-w-[280px] text-[13px] leading-5" style={{ color: LABEL2 }}>{message}</div>
      <div className="mt-5 flex w-full max-w-[280px] gap-2">
        <button type="button" onClick={onRetry} className="flex-1 rounded-2xl py-3 text-[14px] font-black text-white" style={{ background: ACCENT }} lang="zh">重新加载</button>
        {onBack && <button type="button" onClick={onBack} className="flex-1 rounded-2xl border py-3 text-[14px] font-black" style={{ ...CARD, borderColor: SEP, color: LABEL }} lang="zh">退出</button>}
      </div>
    </div>
  );
}

function Home({ progress, status, onStudyDeck, onSkip, onCoach }) {
  const ladder = status?.ladder || [];
  const activeDeck = status?.activeDeck || "hsk1";

  // Mỗi thẻ khoá = MỘT CẤP (HSK1, HSK2… / TOCFL1…). Bấm vào học đúng cấp đó.
  const LESSONS = ladder.map((d, i) => ({
    id: d.deck,
    color: CARD_COLORS[i % CARD_COLORS.length],
    title: DECK_LABELS[d.deck] || d.deck,
    sub: d.passed ? "已达标 · 复习" : d.deck === activeDeck ? "学习中" : d.hasContent ? `共 ${d.target} 词` : "即将推出",
    done: d.mastered, total: d.total, pct: d.passed ? 100 : d.percent,
    onClick: () => onStudyDeck(d.deck),
    disabled: !d.hasContent,
  }));

  return (
    <div className="space-y-4 pt-2">
      {/* Lời chào */}
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-full" style={{ background: GRAD_SOFT }}><Icon name="sentiment_satisfied" size={24} color={ACCENT} fill /></div>
        <div className="flex-1">
          <div className="text-[19px] font-black" style={{ color: LABEL }} lang="zh">你好 👋</div>
          <div className="text-[12.5px]" style={{ color: LABEL2 }}>一起学中文吧！</div>
        </div>
        <span className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-black" style={{ background: CHIP, color: LABEL }}>
          <Icon name="local_fire_department" size={15} color={ACCENT} fill /> {progress?.streak ?? 0}
        </span>
      </div>

      {/* Tổng quan: vòng tiến độ tới đích — chạm mở CỐ VẤN học tập */}
      <button onClick={onCoach} className="flex w-full items-center gap-4 rounded-[24px] border p-4 text-left shadow-sm active:scale-[0.99] transition-transform" style={{ ...CARD, borderColor: SEP }}>
        <div className="flex-1">
          <div className="flex items-center gap-1.5 text-[16px] font-black" style={{ color: LABEL }}>
            <Icon name="auto_awesome" size={18} color={ACCENT} fill /> <span lang="zh">学习顾问</span>
          </div>
          <div className="mt-0.5 text-[12.5px]" style={{ color: LABEL2 }}>
            今天已复习 <b style={{ color: LABEL }}>{progress?.reviewsToday ?? 0}</b> 次 · 进度、方向与学友
          </div>
        </div>
        <Ring pct={progress?.goalPercent ?? 0} />
        <Icon name="chevron_right" size={22} color={LABEL2} />
      </button>

      {/* Các khoá học — thẻ nhiều màu */}
      <SectionTitle>你的课程</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        {LESSONS.map((l) => <LessonCard key={l.id} {...l} />)}
      </div>

      {/* HỌC NHANH → mời VƯỢT CẤP ngay */}
      {status?.canSkipLevel && (
        <button onClick={onSkip} className="flex w-full items-center gap-3 rounded-[22px] p-4 text-left shadow-md active:scale-[0.98] transition-transform" style={{ background: GRAD_SOFT, border: `1.5px solid ${ACCENT}` }}>
          <IconChip name="bolt" />
          <div className="flex-1">
            <div className="text-[14px] font-black" style={{ color: LABEL }}>你学得很快！</div>
            <div className="text-[12px]" style={{ color: LABEL2 }}>参加 {DECK_LABELS[status?.activeDeck]} 跳级测试，立即升级</div>
          </div>
          <Icon name="chevron_right" color={ACCENT} />
        </button>
      )}

      {status?.noContentYet && (
        <div className="rounded-[24px] border p-5 text-center" style={{ ...CARD, borderColor: SEP }}>
          <div className="mx-auto mb-2 grid h-14 w-14 place-items-center rounded-full" style={{ background: GRAD_SOFT }}><Icon name="rocket_launch" size={30} color={ACCENT} fill /></div>
          <div className="text-[15px] font-black" style={{ color: LABEL }}>你已通过 {DECK_LABELS[status?.testedOutThrough] || "现有级别"}！</div>
          <p className="mt-1 text-[12.5px]" style={{ color: LABEL2 }}>{DECK_LABELS[status?.nextLevel] || "下一级"} 内容即将推出。</p>
        </div>
      )}

      {status?.completed && (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <Icon name="workspace_premium" color="#16a34a" fill />
          <span className="text-[14px] font-black text-emerald-600">课程已完成！</span>
        </div>
      )}
    </div>
  );
}

function Reading() {
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lookup, setLookup] = useState({});
  const [selectedWord, setSelectedWord] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  useEffect(() => {
    let alive = true;
    Promise.all([
      vocabApi.cachedGet("/vocab/reading", "reading-current"),
    ]).then(([data]) => {
      if (!alive) return;
      if (data?.error || !data?.lesson) throw new Error(data?.error || "暂无阅读内容");
      setLesson(data.lesson);
      const chunks = segmentReadingText(data.lesson.body).filter((token) => /[\u3400-\u9fff]/.test(token));
      return api("/vocab/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ words: [...new Set(chunks)] }),
      });
    }).then((data) => {
      if (alive && data?.found) setLookup(data.found);
    }).catch((loadError) => {
      if (alive) setError(loadError.message || "暂无阅读内容");
    }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const tokens = useMemo(() => segmentReadingText(lesson?.body || ""), [lesson]);
  const complete = async () => {
    const data = await api("/vocab/reading/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId: lesson.id, answers }),
    }).catch(() => ({ error: "提交失败，请稍后再试。" }));
    setResult(data);
  };
  const queueWord = async () => {
    if (!selectedWord?.cardId) return;
    await api("/vocab/queue-card", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId: selectedWord.cardId }),
    });
    setSelectedWord((word) => ({ ...word, queued: true }));
  };

  if (loading) return <LoadingState />;
  if (error || !lesson) return <div className="mt-10 rounded-3xl border p-6 text-center" style={{ ...CARD, borderColor: SEP, color: LABEL2 }}>{error || "暂无阅读内容"}</div>;
  return (
    <div className="space-y-4 pt-1">
      <div className="rounded-[24px] p-5" style={{ background: GRAD }}>
        <div className="text-[11px] font-bold text-white/75" lang="zh">{lesson.subtitle}</div>
        <div className="mt-1 text-[24px] font-black text-white" lang="zh">{lesson.title}</div>
        <div className="mt-2 text-[12px] font-semibold text-white/85" lang="zh">点击文章中的词，查看拼音和意思</div>
      </div>

      <article className="rounded-[24px] border p-5 shadow-sm" style={{ ...CARD, borderColor: SEP }}>
        <p className="text-[20px] leading-[2.05]" lang="zh">
          {tokens.map((token, index) => {
            const word = lookup[token];
            if (!word) return <span key={`${token}-${index}`}>{token}</span>;
            return <button key={`${token}-${index}`} type="button" onClick={() => { setSelectedWord(word); speak(word.hanzi); }} className="mx-0.5 border-b-2 border-dashed px-0.5 font-semibold" style={{ borderColor: ACCENT, color: LABEL }} lang="zh">{token}</button>;
          })}
        </p>
      </article>

      {selectedWord && (
        <div className="rounded-[22px] border p-4" style={{ ...CARD, borderColor: ACCENT }}>
          <div className="flex items-start gap-3">
            <button type="button" onClick={() => speak(selectedWord.hanzi)} className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl" style={{ background: GRAD }}>
              <Icon name="volume_up" size={22} color="#fff" />
            </button>
            <div className="min-w-0 flex-1">
              <div className="text-[28px] font-black leading-none" style={{ color: LABEL }} lang="zh">{selectedWord.hanzi}</div>
              <PinyinText text={selectedWord.pinyin} className="mt-1 block text-[15px] font-black" />
              <div className="mt-1 text-[13px]" style={{ color: LABEL2 }}>{selectedWord.meaning}</div>
            </div>
            <button type="button" onClick={queueWord} disabled={selectedWord.queued} className="rounded-xl px-3 py-2 text-[12px] font-black text-white disabled:opacity-60" style={{ background: ACCENT }} lang="zh">{selectedWord.queued ? "已加入" : "加入学习"}</button>
          </div>
        </div>
      )}

      {!result ? (
        <div className="space-y-3">
          <SectionTitle>理解问题</SectionTitle>
          {lesson.questions.map((question) => (
            <div key={question.id} className="rounded-2xl border p-4" style={{ ...CARD, borderColor: SEP }}>
              <div className="mb-2 text-[14px] font-black" style={{ color: LABEL }} lang="zh">{question.prompt}</div>
              <div className="grid gap-2">
                {question.options.map((option) => <button key={option} type="button" onClick={() => setAnswers((current) => ({ ...current, [question.id]: option }))} className="rounded-xl border px-3 py-2.5 text-left text-[13px] font-semibold" style={answers[question.id] === option ? { background: ACCENT, borderColor: ACCENT, color: "#fff" } : { ...CARD, borderColor: SEP, color: LABEL }}>{option}</button>)}
              </div>
            </div>
          ))}
          <button type="button" onClick={complete} disabled={Object.keys(answers).length < lesson.questions.length} className="w-full rounded-2xl py-3.5 text-[15px] font-black text-white disabled:opacity-45" style={{ background: GRAD }} lang="zh">提交答案</button>
        </div>
      ) : (
        <div className="rounded-[24px] border p-6 text-center" style={{ ...CARD, borderColor: SEP }}>
          <div className="text-[44px] font-black" style={{ color: ACCENT }}>{result.score}%</div>
          <div className="mt-1 text-[14px] font-black" style={{ color: LABEL }} lang="zh">{result.score >= 80 ? "理解得很好！" : "再读一次会更好"}</div>
          <div className="mt-1 text-[12px]" style={{ color: LABEL2 }}>{result.correct}/{result.total} · 阅读完成</div>
        </div>
      )}
    </div>
  );
}

function segmentReadingText(text) {
  if (!text) return [];
  if (typeof Intl !== "undefined" && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter("zh", { granularity: "word" });
    return [...segmenter.segment(text)].map((part) => part.segment);
  }
  return String(text).match(/[\u3400-\u9fff]|[^\u3400-\u9fff]+/g) || [];
}

function Conversation() {
  const [scenario, setScenario] = useState("餐厅点餐");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const scenarios = ["餐厅点餐", "购物", "旅行问路", "自我介绍"];

  const send = async () => {
    const message = input.trim();
    if (!message || sending) return;
    const next = [...messages, { role: "user", content: message }];
    setMessages(next);
    setInput("");
    setSending(true);
    const reply = { role: "model", content: "" };
    setMessages((current) => [...current, reply]);
    try {
      await vocabApi.stream("/ai/chat/stream", {
        message: `你是中文老师，正在进行${scenario}情境练习。请只用适合初学者的中文回复，并在最后用简短中文指出一个可以改进的地方。学生说：${message}`,
        history: next.slice(-8),
        persona: "vocab_teacher",
      }, (chunk) => {
        reply.content += chunk;
        setMessages((current) => current.map((item, index) => index === current.length - 1 ? { ...item, content: reply.content } : item));
      });
    } catch (error) {
      setMessages((current) => current.map((item, index) => index === current.length - 1 ? { ...item, content: error.message || "暂时无法连接老师。" } : item));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex min-h-[520px] flex-col gap-3 pt-1">
      <div className="rounded-[24px] p-5" style={{ background: GRAD }}>
        <div className="text-[11px] font-bold text-white/75" lang="zh">AI 中文老师</div>
        <div className="mt-1 text-[23px] font-black text-white" lang="zh">情境对话</div>
        <div className="mt-1 text-[12px] text-white/85" lang="zh">选择场景，用中文说出来。</div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {scenarios.map((item) => <button key={item} type="button" onClick={() => setScenario(item)} className="shrink-0 rounded-full px-3 py-2 text-[12px] font-black" style={scenario === item ? { background: ACCENT, color: "#fff" } : { ...CARD, border: `1px solid ${SEP}`, color: LABEL }} lang="zh">{item}</button>)}
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto rounded-[22px] border p-3" style={{ ...CARD, borderColor: SEP }}>
        {messages.length === 0 && <div className="py-14 text-center text-[13px]" style={{ color: LABEL2 }} lang="zh">老师在等你开口…</div>}
        {messages.map((message, index) => <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}><div className="max-w-[86%] rounded-2xl px-3.5 py-2.5 text-[14px] leading-6" style={message.role === "user" ? { background: ACCENT, color: "#fff" } : { background: CHIP, color: LABEL }} lang="zh">{message.content || "…"}</div></div>)}
      </div>
      <div className="flex items-end gap-2">
        <textarea value={input} onChange={(event) => setInput(event.target.value)} rows={2} placeholder="用中文输入…" className="min-w-0 flex-1 resize-none rounded-2xl border p-3 text-[14px] outline-none" style={{ ...CARD, borderColor: SEP, color: LABEL }} lang="zh" />
        <button type="button" onClick={send} disabled={sending || !input.trim()} className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white disabled:opacity-40" style={{ background: ACCENT }} aria-label="发送"><Icon name="send" size={20} color="#fff" /></button>
      </div>
    </div>
  );
}

function HanziLab() {
  const [input, setInput] = useState("学");
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [picked, setPicked] = useState("");
  const [quiz, setQuiz] = useState(null);

  const load = async (value = input) => {
    const hanzi = String(value).trim().slice(0, 1);
    if (!hanzi) return;
    setLoading(true); setQuiz(null); setPicked("");
    const data = await api(`/vocab/hanzi/${encodeURIComponent(hanzi)}`).catch(() => ({ error: "暂时无法加载汉字资料。" }));
    setCharacter(data?.character || null);
    setLoading(false);
    if (data?.character?.hanzi) speak(data.character.hanzi);
  };
  useEffect(() => { load("学"); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const answer = async (radical) => {
    if (!character || quiz) return;
    setPicked(radical);
    const result = await api("/vocab/hanzi/quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hanzi: character.hanzi, radical }),
    }).catch(() => ({ correct: false }));
    setQuiz(result);
  };

  return (
    <div className="space-y-4 pt-1">
      <div className="rounded-[24px] p-5" style={{ background: GRAD }}>
        <div className="text-[11px] font-bold text-white/75" lang="zh">汉字实验室</div>
        <div className="mt-1 text-[23px] font-black text-white" lang="zh">认识一个字</div>
        <div className="mt-1 text-[12px] text-white/85" lang="zh">从部件、意义和读音开始理解汉字。</div>
      </div>
      <div className="flex gap-2">
        <input value={input} onChange={(event) => setInput(event.target.value)} maxLength={1} className="min-w-0 flex-1 rounded-2xl border p-3 text-center text-[26px] font-black outline-none" style={{ ...CARD, borderColor: SEP, color: LABEL }} lang="zh" aria-label="输入汉字" />
        <button type="button" onClick={() => load()} className="rounded-2xl px-4 text-[14px] font-black text-white" style={{ background: ACCENT }} lang="zh">查看</button>
      </div>
      {loading && <LoadingState />}
      {!loading && character && (
        <>
          <div className="rounded-[24px] border p-5" style={{ ...CARD, borderColor: SEP }}>
            <div className="flex items-center gap-4">
              <button type="button" onClick={() => speak(character.hanzi)} className="grid h-24 w-24 shrink-0 place-items-center rounded-[26px]" style={{ background: GRAD }}>
                <span className="text-[64px] font-black leading-none text-white" lang="zh">{character.hanzi}</span>
              </button>
              <div className="min-w-0">
                <PinyinText text={character.pinyin} className="block text-[20px] font-black" />
                <div className="mt-1 text-[14px]" style={{ color: LABEL2 }}>{character.meaning}</div>
                {character.strokeCount && <div className="mt-2 text-[12px] font-bold" style={{ color: LABEL2 }} lang="zh">笔画：{character.strokeCount}</div>}
              </div>
            </div>
            <div className="mt-4 rounded-2xl p-3" style={{ background: CHIP }}>
              <div className="text-[12px] font-black" style={{ color: LABEL }} lang="zh">部首：{character.radical || "资料整理中"}</div>
              <div className="mt-1 text-[12.5px]" style={{ color: LABEL2 }} lang="zh">组成：{character.components?.join(" · ")}</div>
              <div className="mt-2 text-[13px] leading-5" style={{ color: LABEL }}>{character.explanation}</div>
            </div>
          </div>
          {character.quizOptions?.length > 0 && (
            <div className="rounded-[22px] border p-4" style={{ ...CARD, borderColor: SEP }}>
              <div className="mb-3 text-[14px] font-black" style={{ color: LABEL }} lang="zh">选择这个字的部首</div>
              <div className="grid grid-cols-2 gap-2">
                {character.quizOptions.map((option) => <button key={option} type="button" onClick={() => answer(option)} className="rounded-2xl border py-3 text-[20px] font-black" style={quiz && option === quiz.answer ? { background: "#16a34a", borderColor: "#16a34a", color: "#fff" } : quiz && option === picked ? { background: "#ef4444", borderColor: "#ef4444", color: "#fff" } : { ...CARD, borderColor: SEP, color: LABEL }} lang="zh">{option}</button>)}
              </div>
              {quiz && <div className="mt-3 text-center text-[13px] font-black" style={{ color: quiz.correct ? "#16a34a" : "#ef4444" }} lang="zh">{quiz.correct ? "答对了！" : `正确答案：${quiz.answer || "资料整理中"}`}</div>}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Ô luyện GỌN (icon + 1 nhãn) — thay danh sách dòng dài để đỡ rối.
function PracticeTile({ icon, color, title, onClick }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 rounded-2xl border p-3 active:scale-95 transition-transform" style={{ ...CARD, borderColor: SEP }}>
      <span className="grid h-11 w-11 place-items-center rounded-xl" style={{ background: `${color}18` }}><Icon name={icon} size={22} color={color} /></span>
      <span className="text-[12.5px] font-black leading-tight" style={{ color: LABEL }} lang="zh">{title}</span>
    </button>
  );
}

// Gom nhóm cho gọn: 输入 (nạp) · 词汇 · 练习 · 测验. Lưới 3 cột, nhãn ngắn.
function PracticeHub({ onGrammar, onEssay, onSentence, onExpand, onTones, onCloze, onListen, onGuess, onHanViet, onHistory, onReading, onConversation, onHanzi, onExam }) {
  const groups = [
    { title: "输入", items: [
      { icon: "menu_book", color: "#e11d48", title: "阅读", onClick: onReading },
      { icon: "forum", color: "#2563eb", title: "对话", onClick: onConversation },
      { icon: "translate", color: "#0f766e", title: "汉字", onClick: onHanzi },
      { icon: "school", color: "#8b5cf6", title: "语法", onClick: onGrammar },
    ] },
    { title: "词汇", items: [
      { icon: "hub", color: "#14b8a6", title: "扩展", onClick: onExpand },
      { icon: "compare_arrows", color: "#22c55e", title: "汉越", onClick: onHanViet },
      { icon: "history", color: "#ec4899", title: "已掌握", onClick: onHistory },
    ] },
    { title: "练习", items: [
      { icon: "format_quote", color: "#0ea5e9", title: "造句", onClick: onSentence },
      { icon: "hearing", color: "#3b82f6", title: "听力", onClick: onListen },
      { icon: "graphic_eq", color: "#a855f7", title: "声调", onClick: onTones },
      { icon: "short_text", color: "#f59e0b", title: "完形", onClick: onCloze },
      { icon: "quiz", color: "#f97316", title: "猜词", onClick: onGuess },
    ] },
    { title: "测验", items: [
      { icon: "edit_note", color: "#0d9488", title: "写作", onClick: onEssay },
      { icon: "fact_check", color: "#e11d48", title: "模拟考", onClick: onExam },
    ] },
  ];
  return (
    <div className="space-y-4 pt-2">
      {groups.map((g) => (
        <div key={g.title}>
          <SectionTitle>{g.title}</SectionTitle>
          <div className="grid grid-cols-3 gap-2.5">
            {g.items.filter((it) => it.onClick).map((it) => <PracticeTile key={it.title} {...it} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

const rand = (arr) => arr.map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(([, v]) => v);

// Ôn tập = TRÒ CHƠI trắc nghiệm (đoán nghĩa / đoán từ / nghe chọn), tự chấm.
// Từ MỚI: học nhanh rồi chọn "Đã thuộc" (vào lịch sử) hoặc "Học tiếp".
// ── CỐ VẤN HỌC TẬP (tiến độ khoa học + định hướng + bạn học) ──────────────────
const fmtDate = (iso) => { const p = String(iso).split("-"); return `${p[2]}/${p[1]}`; };
const TIP_TEXT = {
  keepStreak: { t: "保持连续学习！", s: "今天还没学 — 复习几个词，别断了连续天数。" },
  clearBacklog: { t: "先清复习", s: "到期的词有点多。先复习完再学新词，记得更牢。" },
  drillWeak: { t: "攻克易忘词", s: "有些词总记不住。今天专门练它们，一举拿下。" },
  slowDown: { t: "稳扎稳打", s: "正确率偏低 — 少学新词，把每个词吃透。" },
  reviewFirst: { t: "先复习到期词", s: "在快忘时复习，是最有效的记忆法（间隔重复）。" },
  levelDone: { t: "本级完成！", s: "这一级已全部掌握 — 去跳级或参加结业测验吧。" },
  learnMore: { t: "状态很好！", s: "记得很牢 — 多学些新词，进步更快。" },
  steady: { t: "每天坚持", s: "每天学一点，间隔重复负责其余。" },
};

function StatChip({ icon, value, label, color = LABEL }) {
  return (
    <div className="flex-1 rounded-2xl border px-1.5 py-2.5 text-center" style={{ ...CARD, borderColor: SEP }}>
      <div className="flex items-center justify-center gap-1"><Icon name={icon} size={15} color={color} /><span className="text-[17px] font-black tabular-nums" style={{ color: LABEL }}>{value}</span></div>
      <div className="mt-0.5 text-[10px] font-bold" style={{ color: LABEL2 }}>{label}</div>
    </div>
  );
}

function Missions() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState("");
  const load = () => api("/vocab/missions").then(setData).catch(() => setData({ missions: [] }));
  useEffect(() => { load(); }, []);
  if (!data?.missions?.length) return null;
  const claim = async (m) => {
    setBusy(m.id);
    await api("/vocab/missions/claim", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: m.id }) }).catch(() => {});
    setBusy("");
    load(); // làm mới trạng thái đã nhận (server là nguồn thật)
  };
  return (
    <div>
      <SectionTitle>今日任务</SectionTitle>
      <div className="space-y-2">
        {data.missions.map((mission) => {
          const percent = Math.min(100, Math.round((mission.progress / mission.target) * 100));
          const canClaim = mission.complete && !mission.claimed && !mission.auto;
          return (
            <div key={mission.id} className="rounded-2xl border p-3" style={{ ...CARD, borderColor: mission.complete ? "rgba(22,163,74,.35)" : SEP }}>
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl" style={{ background: mission.complete ? "rgba(22,163,74,.12)" : CHIP }}><Icon name={mission.complete ? "check_circle" : mission.icon} size={19} color={mission.complete ? "#16a34a" : ACCENT} fill={mission.complete} /></span>
                <span className="min-w-0 flex-1 text-[13px] font-black" style={{ color: LABEL }} lang="zh">{mission.title}</span>
                <span className="text-[11px] font-black" style={{ color: mission.complete ? "#16a34a" : LABEL2 }}>{mission.progress}/{mission.target}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/5"><div className="h-full rounded-full transition-all" style={{ width: `${percent}%`, background: mission.complete ? "#16a34a" : ACCENT }} /></div>
              <div className="mt-1.5 flex items-center justify-between">
                <span className="text-[10px] font-bold" style={{ color: LABEL2 }}>{mission.period === "weekly" ? "本周" : "今日"} · +{mission.reward} JOY{mission.auto ? " · 自动" : ""}</span>
                {canClaim ? (
                  <button onClick={() => claim(mission)} disabled={busy === mission.id} className="rounded-full px-3 py-1 text-[11px] font-black text-white active:scale-95 transition-transform disabled:opacity-50" style={{ background: "#16a34a" }} lang="zh">{busy === mission.id ? "…" : "领取"}</button>
                ) : mission.claimed ? (
                  <span className="text-[10px] font-black" style={{ color: "#16a34a" }} lang="zh">已领取 ✓</span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AchievementBadge({ icon, title, color }) {
  return (
    <div className="flex min-h-[48px] items-center gap-2 rounded-2xl border px-2.5 py-1.5" style={{ ...CARD, borderColor: `${color}45`, boxShadow: "0 2px 8px rgba(43,38,32,.05)" }}>
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl" style={{ background: `${color}18` }}>
        <Icon name={icon} size={19} color={color} fill />
      </span>
      <span className="text-[12px] font-black leading-tight" style={{ color: LABEL }} lang="zh">{title}</span>
    </div>
  );
}

function Coach({ lang, onStart }) {
  const [d, setD] = useState(null);
  const [board, setBoard] = useState(null);
  const [peek, setPeek] = useState(null);
  useEffect(() => {
    api("/vocab/insights").then(setD).catch(() => setD({ error: true }));
    api("/vocab/board").then(setBoard).catch(() => setBoard({ rows: [] }));
  }, []);
  if (!d) return <div className="mt-10 h-72 animate-pulse rounded-[28px] bg-black/5" />;
  if (d.needsTrack || d.error) return <div className="mt-12 text-center text-[14px] font-semibold" style={{ color: LABEL2 }}>选择课程并完成分级测试即可开启学习顾问。</div>;
  const tip = TIP_TEXT[d.tip?.key] || TIP_TEXT.steady;
  const tone = { warn: "#f59e0b", info: ACCENT, good: "#16a34a" }[d.tip?.tone] || ACCENT;
  const sc = d.statusCounts; const scTotal = Math.max(1, sc.new + sc.learning + sc.review + sc.mastered);
  const seg = [
    { n: sc.mastered, c: "#16a34a", label: "已掌握" },
    { n: sc.review, c: ACCENT, label: "复习中" },
    { n: sc.learning, c: "#f59e0b", label: "新学" },
  ];
  return (
    <div className="space-y-4 pt-1">
      <div className="flex items-center gap-4 rounded-[26px] p-4" style={{ background: GRAD }}>
        <Ring pct={d.percent} size={78} stroke={9} color="#fff" />
        <div className="min-w-0 flex-1 text-white">
          <div className="text-[12.5px] font-bold opacity-90">{d.trackLabel} → {String(d.goalDeck || "").toUpperCase()}</div>
          <div className="text-[22px] font-black leading-tight">{d.mastered}/{d.goalTotal} 词</div>
          <div className="text-[12px] font-semibold opacity-90">{d.etaDate ? `预计达标 ~ ${fmtDate(d.etaDate)}` : "坚持学习以获得预计日期"}</div>
        </div>
      </div>

      <div className="rounded-[22px] border p-4" style={{ ...CARD, borderColor: SEP }}>
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full" style={{ background: tone }}><Icon name="lightbulb" size={20} color="#fff" /></span>
          <div className="min-w-0">
            <div className="text-[15px] font-black" style={{ color: LABEL }}>{tip.t}</div>
            <div className="text-[12.5px] font-semibold" style={{ color: LABEL2 }}>{tip.s}</div>
          </div>
        </div>
        <div className="mt-2 text-[12px] font-bold" style={{ color: LABEL2 }}>今天：复习 {d.plan.review} · 新学 {d.plan.learn}</div>
        <button onClick={onStart} className="mt-2 w-full rounded-2xl py-3.5 text-[15px] font-black text-white active:scale-[0.98] transition-transform" style={{ background: tone }}>今天学习</button>
      </div>

      <div className="flex gap-2">
        <StatChip icon="local_fire_department" value={d.streak} label="连续天" color="#f97316" />
        <StatChip icon="target" value={d.accuracy != null ? `${d.accuracy}%` : "—"} label="正确率" color="#16a34a" />
        <StatChip icon="bolt" value={d.avgSec != null ? `${d.avgSec}s` : "—"} label="速度" color={ACCENT} />
        <StatChip icon="task_alt" value={`${d.reviewsToday}/${d.dailyGoal}`} label="今天" color={LABEL} />
      </div>

      <Missions />

      {(() => {
        const badges = [];
        [[7, "local_fire_department", "连续 7 天", "#f97316"], [30, "local_fire_department", "连续 30 天", "#e11d48"], [100, "local_fire_department", "连续 100 天", "#b45309"]].forEach(([n, icon, title, color]) => { if (d.streak >= n) badges.push({ icon, title, color }); });
        [[50, "menu_book", "掌握 50 词", "#3b82f6"], [150, "auto_stories", "掌握 150 词", "#0f766e"], [300, "library_books", "掌握 300 词", "#2563eb"], [600, "school", "掌握 600 词", "#7c3aed"]].forEach(([n, icon, title, color]) => { if (d.mastered >= n) badges.push({ icon, title, color }); });
        if (d.accuracy != null && d.accuracy >= 90) badges.push({ icon: "target", title: "正确率 90%+", color: "#16a34a" });
        if (!badges.length) return null;
        return (
          <div>
            <SectionTitle>成就</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {badges.map((b, k) => (
                <AchievementBadge key={k} {...b} />
              ))}
            </div>
          </div>
        );
      })()}

      <div>
        <SectionTitle>你的词汇</SectionTitle>
        <div className="flex h-3 w-full overflow-hidden rounded-full" style={{ background: "rgba(0,0,0,.06)" }}>
          {seg.map((s, i) => s.n > 0 && <div key={i} style={{ width: `${(s.n / scTotal) * 100}%`, background: s.c }} />)}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] font-bold" style={{ color: LABEL2 }}>
          {seg.map((s, i) => <span key={i} className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full" style={{ background: s.c }} />{s.label}: {s.n}</span>)}
        </div>
      </div>

      {d.weak.length > 0 && (
        <div>
          <SectionTitle>易忘词 — 点击听音、看义</SectionTitle>
          <div className="space-y-2">
            {d.weak.map((w) => (
              <button key={w._id} onClick={() => { speak(w.hanzi); setPeek(peek === w._id ? null : w._id); }} className="flex w-full items-center gap-3 rounded-2xl border p-3 text-left active:scale-[.99] transition-transform" style={{ ...CARD, borderColor: SEP }}>
                <span className="text-[28px] font-black leading-none" style={{ color: LABEL }} lang="zh">{w.hanzi}</span>
                <span className="min-w-0 flex-1">
                  <PinyinText text={w.pinyin} className="block text-[13px] font-black" />
                  {peek === w._id && <span className="block text-[13px] font-bold" style={{ color: LABEL }}>{mn(w, lang)}</span>}
                </span>
                <span className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-black" style={{ background: "rgba(239,68,68,.12)", color: "#ef4444" }}>忘 {w.lapses} 次</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <SectionTitle>学友</SectionTitle>
        {board?.rows?.length > 0 ? (
          <div className="space-y-2">
            {board.rows.map((r, i) => (
              <div key={i} className="flex items-center gap-3 rounded-2xl border p-2.5" style={{ ...CARD, borderColor: r.me ? ACCENT : SEP, borderWidth: r.me ? 2 : 1 }}>
                <span className="w-5 text-center text-[13px] font-black" style={{ color: i < 3 ? "#f59e0b" : LABEL2 }}>{i + 1}</span>
                {r.avatar
                  ? <img src={r.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
                  : <span className="grid h-9 w-9 place-items-center rounded-full text-[14px] font-black text-white" style={{ background: GRAD }}>{(r.name || "?")[0].toUpperCase()}</span>}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-black" style={{ color: LABEL }}>{r.name}{r.me ? "（你）" : ""}</span>
                  <span className="block text-[11.5px] font-bold" style={{ color: LABEL2 }}>🔥{r.streak} · 本周 {r.weekly} 次</span>
                </span>
                <span className="text-right"><span className="block text-[16px] font-black tabular-nums" style={{ color: LABEL }}>{r.mastered}</span><span className="block text-[10px] font-bold" style={{ color: LABEL2 }}>已掌握</span></span>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border p-4 text-center text-[13px] font-semibold" style={{ ...CARD, borderColor: SEP, color: LABEL2 }}>
            在「朋友」应用里加好友，一起学习、比拼、互相发词。
          </div>
        )}
      </div>
    </div>
  );
}

// ── TUNG THẺ QUA MÁY KHÁC (cùng tài khoản, qua socket live) ───────────────────
function useNearby() {
  const [nearby, setNearby] = useState(false);
  useEffect(() => subscribeNearby(setNearby), []);
  return nearby;
}

// Bọc thẻ: vẩy LÊN khi có máy kia đang mở → tung thẻ đi rồi thẻ tự về chỗ cũ.
function TossableCard({ nearby, onToss, children }) {
  const [dy, setDy] = useState(0);
  const [flying, setFlying] = useState(false);
  const start = useRef(null);
  const captured = useRef(false);
  const onDown = (e) => { if (!nearby || flying) return; start.current = { y: e.clientY, t: Date.now(), id: e.pointerId, el: e.currentTarget }; };
  const onMove = (e) => {
    if (!start.current) return;
    const d = e.clientY - start.current.y;
    if (d < 0) {
      setDy(d);
      if (!captured.current && d < -8) { captured.current = true; try { start.current.el.setPointerCapture(start.current.id); } catch { /* noop */ } }
    }
  };
  const finish = (e) => {
    if (!start.current) return;
    const d = e.clientY - start.current.y; const dt = Date.now() - start.current.t;
    start.current = null; captured.current = false;
    if (nearby && (d < -70 || (d < -35 && dt < 260))) {
      setFlying(true); onToss();
      window.setTimeout(() => { setFlying(false); setDy(0); }, 640);
    } else setDy(0);
  };
  const style = flying
    ? { transform: "translateY(-130vh) rotate(-7deg) scale(.9)", opacity: 0, transition: "transform .5s cubic-bezier(.5,0,.75,0), opacity .5s" }
    : { transform: dy ? `translateY(${dy}px) rotate(${dy / 70}deg)` : "none", opacity: dy ? Math.max(0.4, 1 + dy / 400) : 1, transition: dy ? "none" : "transform .4s cubic-bezier(.2,1.5,.4,1), opacity .3s", touchAction: nearby ? "pan-x" : "auto" };
  return <div onPointerDown={onDown} onPointerMove={onMove} onPointerUp={finish} onPointerCancel={finish} style={style}>{children}</div>;
}

// Lớp phủ: thẻ từ máy kia BAY VÀO từ mép trên, dừng giữa, tự đọc, rồi bay đi.
function TossLayer() {
  const [card, setCard] = useState(null);
  const [from, setFrom] = useState("");
  const [phase, setPhase] = useState("in"); // in | show | out
  const timers = useRef([]);
  const clear = () => { timers.current.forEach((id) => window.clearTimeout(id)); timers.current = []; };
  useEffect(() => subscribeToss((c, sender) => {
    clear();
    setCard(c); setFrom(sender || ""); setPhase("in"); speak(c.hanzi);
    timers.current.push(window.setTimeout(() => setPhase("show"), 40));
    timers.current.push(window.setTimeout(() => setPhase("out"), 5200));
    timers.current.push(window.setTimeout(() => setCard(null), 5700));
  }), []);
  useEffect(() => clear, []);
  if (!card) return null;
  const dismiss = () => { clear(); setPhase("out"); window.setTimeout(() => setCard(null), 480); };
  const tf = phase === "in" ? "translateY(-130vh) rotate(8deg) scale(.85)"
    : phase === "out" ? "translateY(130vh) rotate(-6deg) scale(.9)" : "translateY(0) rotate(0) scale(1)";
  return createPortal(
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-5"
      style={{ background: phase === "show" ? "rgba(0,0,0,.45)" : "rgba(0,0,0,0)", backdropFilter: phase === "show" ? "blur(6px)" : "none", transition: "background .4s, backdrop-filter .4s" }}
      onClick={dismiss}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm overflow-hidden rounded-[28px] p-4 shadow-2xl"
        style={{ background: GRAD, transform: tf, opacity: phase === "show" ? 1 : 0.2, transition: "transform .55s cubic-bezier(.2,1.1,.3,1), opacity .4s" }}>
        <div className="mb-2 flex items-center justify-center gap-1.5 text-[12px] font-black" style={{ color: "rgba(255,255,255,.92)" }}>
          <Icon name="send_to_mobile" size={16} color="#fff" /> {from ? `${from} 发来一个词` : "另一台设备发来的词"}
        </div>
        <div className="flex min-h-[240px] flex-col items-center justify-center rounded-[22px] p-6 text-center" style={{ background: "#fffdf8" }}>
          <div className="text-[72px] font-black leading-none" style={{ color: LABEL }} lang="zh">{card.hanzi}</div>
          <div className="mt-3 flex items-center gap-2">
            <PinyinText text={card.pinyin} className="text-[22px] font-black" />
            <span onClick={() => speak(card.hanzi)}><Icon name="volume_up" size={22} color={ACCENT} /></span>
          </div>
          <div className="mt-2 text-[18px] font-black" style={{ color: LABEL }}>{card.meaning || card.meaningEn}</div>
          {card.hanViet && <div className="mt-1"><HanVietChip text={card.hanViet} /></div>}
          {card.example && (
            <div className="mt-3 border-t pt-3 text-[13px]" style={{ borderColor: SEP, color: LABEL2 }}>
              <div className="text-[15px] font-bold" style={{ color: LABEL }} lang="zh">{card.example}</div>
              {card.examplePinyin && <PinyinText text={card.examplePinyin} className="block text-[12px] font-semibold" />}
              {card.exampleMeaning && <div>{card.exampleMeaning}</div>}
            </div>
          )}
        </div>
        <button onClick={dismiss} className="mt-3 w-full rounded-2xl py-3 text-[14px] font-black text-white active:scale-95 transition-transform" style={{ background: "rgba(255,255,255,.22)" }}>关闭</button>
      </div>
    </div>,
    document.body,
  );
}

// Gửi từ đang học cho MỘT người bạn (qua socket live nếu bạn đang online).
function FriendSend({ card }) {
  const [friends, setFriends] = useState(null);
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState("");
  useEffect(() => { api("/vocab/friends").then((d) => setFriends(d.friends || [])).catch(() => setFriends([])); }, []);
  if (!friends || friends.length === 0) return null;
  const send = async (f) => {
    setOpen(false);
    try {
      const r = await api("/vocab/toss-friend", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to: f.email, card }) });
      setSent(r?.delivered > 0 ? `已发给 ${f.name} ✓` : `${f.name} 不在线 — 稍后再试`);
    } catch { setSent("发送失败"); }
    window.setTimeout(() => setSent(""), 2500);
  };
  return (
    <div className="mt-2 w-full">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-center gap-1.5 rounded-2xl border py-2.5 text-[13px] font-black active:scale-[.99] transition-transform" style={{ borderColor: SEP, color: LABEL, ...CARD }}>
        <Icon name="send" size={16} color={ACCENT} /> {sent || "把这个词发给朋友"}
      </button>
      {open && (
        <div className="mt-2 space-y-1.5">
          {friends.map((f) => (
            <button key={f.email} onClick={() => send(f)} className="flex w-full items-center gap-2.5 rounded-xl border p-2 text-left active:scale-[.99] transition-transform" style={{ ...CARD, borderColor: SEP }}>
              {f.avatar ? <img src={f.avatar} alt="" className="h-7 w-7 rounded-full object-cover" /> : <span className="grid h-7 w-7 place-items-center rounded-full text-[12px] font-black text-white" style={{ background: GRAD }}>{(f.name || "?")[0].toUpperCase()}</span>}
              <span className="flex-1 truncate text-[13px] font-bold" style={{ color: LABEL }}>{f.name}</span>
              <span className="text-[11px] font-bold" style={{ color: f.online ? "#16a34a" : LABEL2 }}>{f.online ? "● 在线" : "离线"}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// HỌC VÔ HẠN theo SET XOAY: luôn hiện thẻ đầu hàng đợi. Từ MỚI → dạy (flashcard
// lật) rồi TỰ KIỂM (trắc nghiệm). Đúng → tự chấm theo tốc độ, bỏ ra, kéo thẻ mới
// vào. Sai → lặp lại (đẩy về sau) + được xem đáp án. KHÔNG tự đánh giá tay. Độ
// chính xác cao + đủ nhiều → MỜI THI VƯỢT CẤP.
function Review({ deck, mode = "recognize", lang = "vi_zh", onDone, onSkip, canSkip = false }) {
  const [queue, setQueue] = useState(null);   // [0] = thẻ hiện tại; xoay vòng. Mỗi thẻ có stage: teach|quiz
  const [flip, setFlip] = useState(false);
  const [picked, setPicked] = useState(null);
  const [combo, setCombo] = useState(0);
  const [celebrate, setCelebrate] = useState(0);
  const [reward, setReward] = useState(0); // thưởng JOY mục tiêu ngày (hiện ăn mừng)
  const [stats, setStats] = useState({ answered: 0, correct: 0, learned: 0 });
  const [skipOffered, setSkipOffered] = useState(false);
  const [empty, setEmpty] = useState(false);
  const nearby = useNearby();
  const shownAt = useRef(Date.now());
  const seen = useRef(new Set());     // id đã kéo vào phiên (tránh trùng)
  const fetching = useRef(false);
  const SET = 10;         // set xoay ~10 thẻ một lúc
  const GRADUATE_AT = 3;  // từ MỚI phải ĐÚNG cách quãng đủ số lần này mới bỏ ra (sai → reset)
  const REFILL_AT = 4;    // queue tụt tới đây → kéo thêm thẻ mới cho đủ SET
  const SPACE_OK = 6;     // đúng nhưng CHƯA ĐỦ → hỏi lại sau ~vài vòng
  const SPACE_WRONG = 2;  // sai → hỏi lại sớm (dạy lại)

  const game = mode === "produce" ? "word" : mode === "listen" ? "listen" : "meaning";

  // Kéo thẻ CHƯA có trong phiên. KHÔNG tự thêm vào `seen` ở đây — người gọi thêm
  // đúng những thẻ thực sự lấy (nhờ vậy phần dư vẫn kéo lại được ở lần sau).
  const fetchRaw = useCallback(async () => {
    const d = await api(`/vocab/due?deck=${deck}`).catch(() => null);
    return (d?.queue || [])
      .filter((c) => c?._id && !seen.current.has(String(c._id)))
      .map((c) => ({ ...c, stage: c.kind === "new" ? "teach" : "quiz" }));
  }, [deck]);

  useEffect(() => {
    let alive = true;
    fetching.current = false; seen.current = new Set();
    setQueue(null); setEmpty(false); setStats({ answered: 0, correct: 0, learned: 0 });
    setCombo(0); setSkipOffered(false); setPicked(null); setFlip(false);
    // Chỉ GHI seen ở lần chạy còn sống (alive) → StrictMode gọi 2 lần không giẫm nhau.
    fetchRaw().then((q) => {
      if (!alive) return;
      const take = q.slice(0, SET);
      take.forEach((c) => seen.current.add(String(c._id)));
      setQueue(take);
      if (!take.length) setEmpty(true);
    }).catch(() => { if (alive) setEmpty(true); });
    return () => { alive = false; };
  }, [deck, fetchRaw]);

  // Giữ set ~SET thẻ: khi tụt xuống ≤ REFILL_AT và còn thẻ mới → kéo thêm cho đủ.
  useEffect(() => {
    if (!queue || fetching.current || empty || queue.length > REFILL_AT) return;
    fetching.current = true;
    fetchRaw().then((q) => {
      fetching.current = false;
      if (!q.length) { if (queue.length === 0) setEmpty(true); return; }
      const take = q.slice(0, Math.max(1, SET - queue.length));
      take.forEach((c) => seen.current.add(String(c._id)));
      setQueue((cur) => [...(cur || []), ...take]);
    }).catch(() => { fetching.current = false; });
  }, [queue, empty, fetchRaw]);

  const card = queue && queue.length ? queue[0] : null;
  const phase = card?.stage === "quiz" ? "quiz" : "teach";

  useEffect(() => {
    if (!card) return;
    shownAt.current = Date.now();
    // Tự đọc khi DẠY, và ở quiz đoán-nghĩa/nghe. KHÔNG đọc ở quiz đoán-từ (lộ đáp án).
    if (phase === "teach" || game === "meaning" || game === "listen") speak(card.hanzi);
  }, [card, phase, game]);

  const post = async (cardId, g) => {
    const payload = {
      cardId,
      grade: g,
      ms: Date.now() - shownAt.current,
      clientEventId: typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    };
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      await IndexedDBStorage.enqueuePendingSync("vocab/review", payload);
      return;
    }
    try {
      const response = await vocabApi.post("/vocab/review", payload);
      if (!response._ok) throw new Error(response.error || "REVIEW_FAILED");
    } catch {
      await BackgroundSyncEngine.enqueueOfflineRequest("vocab/review", payload);
    }
  };

  const answer = (opt, correctVal) => {
    if (picked || !card) return;
    const right = opt === correctVal;
    const ms = Date.now() - shownAt.current;
    const cid = card._id;
    const needed = card.kind === "new" ? GRADUATE_AT : 1; // đã học rồi thì đúng 1 lần là xong lượt
    setPicked({ opt, right });
    if (right) {
      const nextCombo = combo + 1; setCombo(nextCombo);
      if (nextCombo >= 3 && nextCombo % 3 === 0) { setCelebrate(nextCombo); window.setTimeout(() => setCelebrate(0), 900); }
      const nCorrect = (card.correct || 0) + 1;
      const graduating = nCorrect >= needed;
      setStats((s) => ({ answered: s.answered + 1, correct: s.correct + 1, learned: s.learned + (graduating ? 1 : 0) }));
      if (graduating) post(cid, card.wrong ? 2 : (ms < 6000 ? 3 : 2)).then((r) => { if (r?.dailyReward) { setReward(r.dailyReward); window.setTimeout(() => setReward(0), 2600); } }); // CHỈ ghi SRS khi TỐT NGHIỆP
      window.setTimeout(() => {
        setPicked(null); setFlip(false);
        setQueue((cur) => {
          if (!cur || cur[0]?._id !== cid) return cur;
          const [head, ...rest] = cur;
          if (graduating) return rest;                                // TỐT NGHIỆP → bỏ ra, KHÔNG lặp lại
          const upd = { ...head, stage: "quiz", correct: nCorrect };  // đúng CHƯA ĐỦ → hỏi lại sau vài vòng
          const at = Math.min(rest.length, SPACE_OK);
          return [...rest.slice(0, at), upd, ...rest.slice(at)];
        });
      }, 520);
    } else {
      setCombo(0);
      setStats((s) => ({ answered: s.answered + 1, correct: s.correct, learned: s.learned }));
      window.setTimeout(() => { // SAI → RESET chuỗi đúng + dạy lại sớm
        setPicked(null); setFlip(false);
        setQueue((cur) => {
          if (!cur || cur[0]?._id !== cid) return cur;
          const [head, ...rest] = cur;
          const upd = { ...head, stage: "quiz", correct: 0, wrong: (head.wrong || 0) + 1 };
          const at = Math.min(rest.length, SPACE_WRONG);
          return [...rest.slice(0, at), upd, ...rest.slice(at)];
        });
      }, 1300);
    }
  };

  const startQuiz = () => setQueue((cur) => (cur && cur.length ? [{ ...cur[0], stage: "quiz" }, ...cur.slice(1)] : cur));

  // Mời thi vượt cấp khi làm rất tốt (đủ nhiều + độ chính xác cao).
  const acc = stats.answered ? stats.correct / stats.answered : 0;
  useEffect(() => {
    if (!skipOffered && onSkip && canSkip && stats.answered >= 12 && acc >= 0.85) setSkipOffered(true);
  }, [stats.answered, acc, skipOffered, onSkip, canSkip]);

  // Trắc nghiệm CỐ ĐỊNH theo thẻ: tính đáp án + THỨ TỰ đúng một lần mỗi lần hiện
  // thẻ, KHÔNG xáo lại mỗi render. (Bug cũ: options dùng random mỗi render nên nút
  // nhảy loạn và highlight đúng/sai rơi nhầm ô.)
  const quiz = useMemo(() => {
    if (!card || card.stage !== "quiz") return null;
    const pool = (queue || []).filter((c) => c._id !== card._id);
    const val = (c) => (game === "word" ? c.hanzi : mn(c, lang));
    const correct = val(card);
    const distractors = rand([...new Set(pool.map(val).filter((v) => v && v !== correct))]).slice(0, 3);
    return { correct, options: rand([correct, ...distractors]) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card?._id, card?.stage, game, lang]);

  if (queue === null) return <div className="mt-10 h-72 animate-pulse rounded-[28px] bg-black/5" />;
  if (!card) return empty
    ? <Finish icon="local_fire_department" title="太棒了！" body={`本轮学了 ${stats.learned} 个词。回首页再进来就有新一批。`} onDone={onDone} />
    : <div className="mt-10 h-72 animate-pulse rounded-[28px] bg-black/5" />;

  const hud = (
    <div className="mb-3 flex items-center gap-2">
      <span className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-black" style={{ background: CHIP, color: LABEL }}>
        <Icon name="school" size={13} color={ACCENT} /> {stats.learned}
      </span>
      {stats.answered >= 3 && (
        <span className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-black" style={{ background: CHIP, color: acc >= 0.8 ? "#16a34a" : LABEL }}>
          <Icon name="target" size={13} color={acc >= 0.8 ? "#16a34a" : LABEL2} /> {Math.round(acc * 100)}%
        </span>
      )}
      {combo >= 2 && (
        <span key={combo} className="v-pop flex items-center gap-0.5 rounded-full px-2.5 py-1 text-[11.5px] font-black" style={{ background: "rgba(249,115,22,.14)", color: "#f97316" }}>
          <Icon name="local_fire_department" size={13} color="#f97316" fill /> {combo}
        </span>
      )}
    </div>
  );

  const skipBanner = skipOffered ? (
    <div className="mb-3 flex items-center gap-3 rounded-[20px] p-3.5" style={{ background: GRAD_SOFT, border: `1.5px solid ${ACCENT}` }}>
      <Icon name="rocket_launch" size={22} color={ACCENT} fill />
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-black" style={{ color: LABEL }} lang="zh">你学得很棒！({Math.round(acc * 100)}%)</div>
        <div className="text-[11.5px]" style={{ color: LABEL2 }}>Thi vượt cấp để lên ngay · 去做跳级测试</div>
      </div>
      <button onClick={onSkip} className="shrink-0 rounded-full px-3 py-1.5 text-[12px] font-black text-white" style={{ background: ACCENT }} lang="zh">测试</button>
      <button onClick={() => setSkipOffered(false)} className="shrink-0" aria-label="关闭"><Icon name="close" size={18} color={LABEL2} /></button>
    </div>
  ) : null;

  const rewardBurst = reward > 0 ? (
    <div className="v-burst pointer-events-none fixed left-1/2 top-1/3 z-[500] text-center" aria-hidden="true">
      <div className="text-[44px] leading-none">🎉</div>
      <div className="mt-1 rounded-full px-4 py-1.5 text-[15px] font-black text-white" style={{ background: "#16a34a" }} lang="zh">+{reward} JOY · 达成每日目标!</div>
    </div>
  ) : null;

  // ── DẠY (flashcard lật) → bấm "测一测" chuyển sang tự kiểm ──
  if (phase === "teach") {
    return (
      <div className="flex flex-col items-center pt-2">
        {hud}{skipBanner}{rewardBurst}
        {nearby && (
          <div className="mb-2 flex items-center gap-1.5 text-[12px] font-black" style={{ color: ACCENT }}>
            <Icon name="swipe_up" size={16} color={ACCENT} /> 另一台设备已打开 — 向上甩牌发送过去
          </div>
        )}
        <TossableCard nearby={nearby} onToss={() => tossCard(card)}>
        <div className="w-full overflow-hidden rounded-[28px] p-4" style={{ background: GRAD }}>
          <div className="mx-auto flex h-[360px] w-full flex-col items-center justify-center overflow-y-auto rounded-[22px] p-6 text-center" style={{ background: "#fffdf8" }}>
            {!flip ? (
              <>
                <div className="text-[88px] font-black leading-none" style={{ color: LABEL }} lang="zh">{card.hanzi}</div>
                <div className="mt-4 flex items-center gap-2">
                  <PinyinText text={card.pinyin} className="text-[24px] font-black" />
                  <span onClick={() => speak(card.hanzi)}><Icon name="volume_up" size={24} color={ACCENT} /></span>
                </div>
                <div className="mt-3 text-[12px] font-bold" style={{ color: LABEL2 }} lang="zh">点击下方翻牌</div>
              </>
            ) : (
              <div className="w-full">
                <div className="flex items-center justify-center gap-2">
                  <div className="text-[44px] font-black leading-none" style={{ color: LABEL }} lang="zh">{card.hanzi}</div>
                  <span onClick={() => speak(card.hanzi)}><Icon name="volume_up" size={22} color={ACCENT} /></span>
                </div>
                <PinyinText text={card.pinyin} className="mt-1.5 block text-[18px] font-black" />
                <div className="mt-2 text-[20px] font-black" style={{ color: LABEL }}>{mn(card, lang)}</div>
                <div className="mt-1 flex justify-center"><HanVietChip text={card.hanViet} /></div>
                {card.example && (
                  <div className="mt-3 border-t pt-3 text-[13px]" style={{ borderColor: SEP, color: LABEL2 }}>
                    <div className="text-[16px] font-bold" style={{ color: LABEL }} lang="zh">{card.example}</div>
                    {card.examplePinyin && <PinyinText text={card.examplePinyin} className="block text-[12.5px] font-semibold" />}
                    {card.exampleMeaning && <div>{card.exampleMeaning}</div>}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        </TossableCard>
        {!flip ? (
          <button onClick={() => { setFlip(true); speak(card.hanzi); }} className="mt-4 w-full rounded-2xl py-4 text-[15px] font-black text-white active:scale-[0.98] transition-transform" style={{ background: GRAD }} lang="zh">翻牌</button>
        ) : (
          <button onClick={startQuiz} className="mt-4 w-full rounded-2xl py-4 text-[15px] font-black text-white active:scale-[0.98] transition-transform" style={{ background: ACCENT }} lang="zh">记住了，测一测</button>
        )}
        <FriendSend card={card} />
      </div>
    );
  }

  // ── TỰ KIỂM (trắc nghiệm, tự chấm) — đáp án/thứ tự lấy từ memo (cố định theo thẻ) ──
  const correct = quiz ? quiz.correct : (game === "word" ? card.hanzi : mn(card, lang));
  const options = quiz ? quiz.options : [correct];
  const prompt = game === "word"
    ? <div className="px-4 text-[24px] font-black" style={{ color: LABEL }}>{mn(card, lang)}</div>
    : game === "listen"
      ? <button onClick={() => speak(card.hanzi)} className="grid h-24 w-24 place-items-center rounded-full" style={{ background: CHIP }}><Icon name="volume_up" size={44} /></button>
      : (<><div className="text-[64px] font-black leading-none" style={{ color: LABEL }} lang="zh">{card.hanzi}</div><PinyinText text={card.pinyin} className="mt-2 block text-[18px] font-black" /></>);
  const question = game === "word" ? "选择正确汉字" : game === "listen" ? "听 → 选择释义" : "选择正确释义";

  return (
    <div className="relative flex flex-col items-center pt-2">
      {hud}{skipBanner}{rewardBurst}
      <div className="mb-2 text-[12px] font-bold" style={{ color: LABEL2 }} lang="zh">{question}</div>
      <div className="mb-4 flex min-h-[180px] w-full flex-col items-center justify-center rounded-[28px] border p-6 text-center shadow-sm" style={{ ...CARD, borderColor: SEP }}>
        {prompt}
      </div>
      <div className="grid w-full grid-cols-1 gap-2">
        {options.map((opt) => {
          let st = { ...CARD, borderColor: SEP, color: LABEL };
          let anim = "";
          if (picked) {
            if (opt === correct) { st = { background: "#16a34a", borderColor: "transparent", color: "#fff" }; anim = "v-pop"; }
            else if (opt === picked.opt) { st = { background: "#ef4444", borderColor: "transparent", color: "#fff" }; anim = "v-shake"; }
            else st = { ...st, opacity: 0.5 };
          }
          return (
            <button key={opt} onClick={() => answer(opt, correct)} disabled={!!picked}
              className={`rounded-2xl border px-4 py-3.5 text-center font-black active:scale-[0.99] transition-all ${game === "word" ? "text-[22px]" : "text-[15px]"} ${anim}`}
              style={st} lang={game === "word" ? "zh" : undefined}>{opt}</button>
          );
        })}
      </div>
      {celebrate > 0 && (
        <div className="v-burst pointer-events-none fixed left-1/2 top-1/2 z-[400] text-center" aria-hidden="true">
          <div className="text-[64px] leading-none">🔥</div>
          <div className="text-[20px] font-black" style={{ color: "#f97316" }} lang="zh">连对 {celebrate}！</div>
        </div>
      )}
      {picked && !picked.right && (
        <div className="mt-3 w-full rounded-2xl p-3 text-center" style={{ background: CHIP }}>
          <span className="text-[18px] font-black" style={{ color: LABEL }} lang="zh">{card.hanzi}</span>
          <PinyinText text={card.pinyin} className="ml-2 text-[14px] font-bold" />
          <div className="text-[13px]" style={{ color: LABEL2 }}>{mn(card, lang)}</div>
          <HanVietChip text={card.hanViet} />
        </div>
      )}
    </div>
  );
}

function Finish({ icon = "check_circle", title, body, onDone }) {
  return (
    <div className="mt-10 rounded-[28px] border p-8 text-center shadow-sm" style={{ ...CARD, borderColor: SEP }}>
      <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-full" style={{ background: GRAD_SOFT }}><Icon name={icon} size={34} color={ACCENT} fill /></div>
      <div className="text-[22px] font-black" style={{ color: LABEL }}>{title}</div>
      <p className="mt-2 text-[13.5px]" style={{ color: LABEL2 }}>{body}</p>
      <button onClick={onDone} className="mt-6 w-full rounded-2xl py-3.5 text-[15px] font-black text-white" style={{ background: GRAD }}>回首页</button>
    </div>
  );
}

function Quiz({ type, onFinish }) {
  const [questions, setQuestions] = useState(null);
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    api(`/vocab/test?type=${type}`).then((d) => { if (!alive) return; if (d.error) setError(d.error); else setQuestions(d.questions || []); });
    return () => { alive = false; };
  }, [type]);

  // Mỗi câu hiện là tự đọc chữ Hán một lần.
  useEffect(() => { if (questions && questions[i] && !result) speak(questions[i].hanzi); }, [questions, i, result]);

  const choose = async (choice) => {
    if (locked) return;
    const q = questions[i];
    const next = [...answers, { cardId: q.cardId, choice }];
    setAnswers(next);
    if (i + 1 < questions.length) { setI(i + 1); return; }
    setLocked(true);
    setResult(await api("/vocab/test/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, answers: next }) }));
  };

  if (error) return <Finish icon="lock" title="暂时无法开始测试" body={error} onDone={onFinish} />;
  if (questions === null) return <div className="mt-10 h-72 animate-pulse rounded-[28px] bg-black/5" />;

  if (result) {
    const ok = type === "placement" ? true : result.passed;
    return (
      <div className="mt-8 rounded-[28px] border p-8 text-center shadow-sm" style={{ ...CARD, borderColor: SEP }}>
        <div className="text-[52px] font-black leading-none" style={{ color: ok ? ACCENT : "#ef4444" }}>{result.score}%</div>
        <div className="mt-3 text-[16px] font-black" style={{ color: LABEL }}>
          {type === "placement"
            ? (result.testedOutThrough ? `已通过 ${DECK_LABELS[result.testedOutThrough]} → 进入 ${DECK_LABELS[result.startDeck] || "下一级"}` : `从 ${DECK_LABELS[result.startDeck] || "第一级"} 开始`)
            : type === "skip"
              ? (result.passed ? `跳级成功！已达标 ${DECK_LABELS[result.deck] || ""}` : `未达跳级线（需 ${result.passMark}%）`)
              : result.passed ? "通过！完成本阶段" : `未通过（需 ${result.passMark}%）`}
        </div>
        <p className="mt-2 text-[13px]" style={{ color: LABEL2 }}>
          {type === "placement" ? (result.testedOutThrough ? "已通过的级别按100%计 — 无需重学。" : "从基础开始，打牢根基。")
            : type === "skip" ? (result.passed ? "已升到下一级 — 继续加油！" : "再多学一点，稍后再跳级。")
            : result.passed ? "恭喜！" : "多复习后再考。"}
        </p>
        <button onClick={onFinish} className="mt-6 w-full rounded-2xl py-3.5 text-[15px] font-black text-white" style={{ background: GRAD }}>{type === "placement" || (type === "skip" && result.passed) ? "继续学习" : "回首页"}</button>
      </div>
    );
  }

  const q = questions[i];
  return (
    <div className="flex flex-col items-center pt-2">
      <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-black/10"><div className="h-full rounded-full transition-all" style={{ width: `${Math.round((i / questions.length) * 100)}%`, background: ACCENT }} /></div>
      <div className="mb-1 text-[12px] font-bold" style={{ color: LABEL2 }}>第 {i + 1} / {questions.length} 题</div>
      {type === "placement" && i === 0 && <p className="mb-3 text-center text-[12.5px]" style={{ color: LABEL2 }}>完成本测试，系统会把你分到合适的级别。</p>}
      <div className="mb-5 mt-2 flex w-full flex-col items-center rounded-[28px] border px-8 py-10 shadow-sm" style={{ ...CARD, borderColor: SEP }}>
        <div className="flex items-center gap-2">
          <div className="text-[72px] font-black leading-none" style={{ color: LABEL }} lang="zh">{q.hanzi}</div>
          <span onClick={() => speak(q.hanzi)}><Icon name="volume_up" /></span>
        </div>
        <PinyinText text={q.pinyin} className="mt-2 text-[17px] font-black" />
      </div>
      <div className="w-full space-y-2">
        {q.options.map((opt) => (
          <button key={opt} onClick={() => choose(opt)} disabled={locked} className="w-full rounded-2xl border px-4 py-3.5 text-left text-[14.5px] font-semibold active:scale-[0.99] transition-transform disabled:opacity-50" style={{ ...CARD, borderColor: SEP, color: LABEL }}>{opt}</button>
        ))}
      </div>
    </div>
  );
}

// ── Thi viết luận: viết 100% tiếng Trung, AI chấm + chỉ lỗi + gợi ý bản xứ ────
function Essay({ onDone }) {
  const [prompt, setPrompt] = useState(null);
  const [text, setText] = useState("");
  const [state, setState] = useState("write"); // write | grading | result | error
  const [feedback, setFeedback] = useState(null);
  const [msg, setMsg] = useState("");

  useEffect(() => { api("/vocab/essay/prompt").then((d) => setPrompt(d?.error ? null : d)); }, []);
  const hanzi = (text.match(/[一-鿿]/g) || []).length;
  const minChars = prompt?.minChars || 20;
  const words = prompt?.words || [];

  const submit = async () => {
    setState("grading"); setMsg("");
    const r = await api("/vocab/essay/grade", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic: prompt?.topic, text, words: words.map((w) => w.hanzi) }) });
    if (r?.error) { setMsg(r.error); setState("error"); return; }
    setFeedback(r.feedback); setState("result");
  };

  if (state === "result" && feedback) {
    return (
      <div className="space-y-4 pt-2">
        <div className="rounded-[28px] border p-6 text-center shadow-sm" style={{ ...CARD, borderColor: SEP }}>
          <div className="text-[52px] font-black leading-none" style={{ color: ACCENT }}>{feedback.score ?? "?"}<span className="text-[20px]">/100</span></div>
          {feedback.level && <div className="mt-1 text-[13px] font-bold" style={{ color: LABEL2 }}>预估水平：{feedback.level}</div>}
          {feedback.comment && <p className="mt-3 text-[13.5px]" style={{ color: LABEL }}>{feedback.comment}</p>}
        </div>
        {feedback.dimensions && (
          <div className="rounded-2xl border p-4" style={{ ...CARD, borderColor: SEP }}>
            {[["grammar", "语法"], ["vocabulary", "词汇"], ["coherence", "连贯"]].map(([k, label]) => {
              const v = Math.max(0, Math.min(100, Number(feedback.dimensions[k]) || 0));
              return (
                <div key={k} className="mb-2 last:mb-0">
                  <div className="mb-1 flex justify-between text-[12px] font-bold" style={{ color: LABEL2 }}><span>{label}</span><span style={{ color: LABEL }}>{v}</span></div>
                  <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: "rgba(0,0,0,.06)" }}><div className="h-full rounded-full" style={{ width: `${v}%`, background: v >= 70 ? "#16a34a" : v >= 40 ? "#f59e0b" : "#ef4444" }} /></div>
                </div>
              );
            })}
          </div>
        )}
        {Array.isArray(feedback.usedWords) && feedback.usedWords.length > 0 && (
          <div className="rounded-2xl border p-4" style={{ ...CARD, borderColor: SEP }}>
            <div className="mb-2 flex items-center gap-2"><Icon name="check_circle" size={18} color="#16a34a" /><span className="text-[13px] font-black" style={{ color: LABEL }}>已用学过的词</span></div>
            <div className="flex flex-wrap gap-1.5">
              {feedback.usedWords.map((w, k) => <span key={k} className="rounded-full px-2.5 py-1 text-[13px] font-black" style={{ background: "rgba(22,163,74,.12)", color: "#16a34a" }} lang="zh">{w}</span>)}
            </div>
          </div>
        )}
        {Array.isArray(feedback.strengths) && feedback.strengths.length > 0 && (
          <div className="rounded-2xl border p-4" style={{ ...CARD, borderColor: SEP }}>
            <div className="mb-2 flex items-center gap-2"><Icon name="thumb_up" size={18} color="#16a34a" /><span className="text-[13px] font-black" style={{ color: LABEL }}>做得好</span></div>
            <ul className="space-y-1 text-[13px]" style={{ color: LABEL }}>{feedback.strengths.map((s, k) => <li key={k}>• {s}</li>)}</ul>
          </div>
        )}
        {Array.isArray(feedback.errors) && feedback.errors.length > 0 && (
          <div className="rounded-2xl border p-4" style={{ ...CARD, borderColor: SEP }}>
            <div className="mb-2 flex items-center gap-2"><Icon name="error" size={18} /><span className="text-[13px] font-black" style={{ color: LABEL }}>错误</span></div>
            <div className="space-y-2">
              {feedback.errors.map((e, k) => (
                <div key={k} className="rounded-xl p-3" style={{ background: CHIP }}>
                  <div className="text-[14px]" lang="zh"><s style={{ color: "#ef4444" }}>{e.original}</s> → <b style={{ color: "#16a34a" }}>{e.correction}</b></div>
                  {e.explanation && <div className="mt-1 text-[12px]" style={{ color: LABEL2 }}>{e.explanation}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
        {Array.isArray(feedback.suggestions) && feedback.suggestions.length > 0 && (
          <div className="rounded-2xl border p-4" style={{ ...CARD, borderColor: SEP }}>
            <div className="mb-2 flex items-center gap-2"><Icon name="tips_and_updates" size={18} /><span className="text-[13px] font-black" style={{ color: LABEL }}>更自然的表达</span></div>
            <ul className="space-y-1 text-[13px]" style={{ color: LABEL }}>{feedback.suggestions.map((s, k) => <li key={k}>• {s}</li>)}</ul>
          </div>
        )}
        {feedback.nativeVersion && (
          <div className="rounded-2xl border p-4" style={{ ...CARD, borderColor: SEP }}>
            <div className="mb-2 flex items-center gap-2"><Icon name="auto_awesome" size={18} /><span className="text-[13px] font-black" style={{ color: LABEL }}>母语改写版</span>
              <span className="ml-auto" onClick={() => speak(feedback.nativeVersion)}><Icon name="volume_up" size={18} /></span></div>
            <div className="text-[15px] leading-7" style={{ color: LABEL }} lang="zh">{feedback.nativeVersion}</div>
          </div>
        )}
        <button onClick={onDone} className="w-full rounded-2xl py-3.5 text-[15px] font-black text-white" style={{ background: GRAD }}>完成</button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-2">
      <div className="rounded-2xl border p-4" style={{ ...CARD, borderColor: SEP }}>
        <div className="flex items-center gap-2"><Icon name="assignment" size={18} /><span className="text-[13px] font-black" style={{ color: LABEL }}>题目</span></div>
        <div className="mt-2 text-[18px] font-bold" style={{ color: LABEL }} lang="zh">{prompt?.topic || "…"}</div>
      </div>

      {words.length > 0 && (
        <div className="rounded-2xl border p-4" style={{ ...CARD, borderColor: SEP }}>
          <div className="mb-2 flex items-center gap-2"><Icon name="auto_awesome" size={18} color={ACCENT} /><span className="text-[13px] font-black" style={{ color: LABEL }}>试着用这些学过的词</span></div>
          <div className="flex flex-wrap gap-2">
            {words.map((w, k) => (
              <button key={k} onClick={() => speak(w.hanzi)} className="flex items-center gap-1 rounded-full px-2.5 py-1 active:scale-95 transition-transform" style={{ background: CHIP }} lang="zh">
                <span className="text-[14px] font-black" style={{ color: LABEL }}>{w.hanzi}</span>
                <Icon name="volume_up" size={13} color={ACCENT} />
              </button>
            ))}
          </div>
        </div>
      )}

      {prompt?.willCharge && (
        <div className="flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3">
          <Icon name="paid" size={18} color="#d97706" />
          <span className="text-[12.5px] font-semibold" style={{ color: LABEL }}>本次重考需 <b>{prompt.cost} JOY</b>（按你的单位折算）。</span>
        </div>
      )}

      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={7}
        placeholder="请用中文写…" lang="zh"
        className="w-full rounded-2xl border p-4 text-[16px] leading-7 outline-none"
        style={{ ...CARD, borderColor: SEP, color: LABEL }} />
      <div className="-mt-2 flex justify-between text-[11.5px]" style={{ color: hanzi >= minChars ? "#16a34a" : LABEL2 }}>
        <span>100% 用中文写</span><span>{hanzi} 个汉字 {hanzi < minChars ? `(需 ≥ ${minChars})` : "✓"}</span>
      </div>

      {msg && <p className="text-[12.5px] font-semibold text-rose-500">{msg}</p>}
      <button onClick={submit} disabled={hanzi < minChars || state === "grading"} className="w-full rounded-2xl py-3.5 text-[15px] font-black text-white disabled:opacity-50" style={{ background: ACCENT }}>
        {state === "grading" ? "AI 批改中…" : "提交 · AI 批改"}
      </button>
    </div>
  );
}

// ── DẠY ĐẶT CÂU (造句): mẫu câu + luyện viết câu có AI kiểm ──
function SentenceBuild() {
  const [tab, setTab] = useState("practice"); // practice | patterns
  return (
    <div className="pt-2">
      <div className="mb-3 grid grid-cols-2 gap-2">
        {[["practice", "练习造句"], ["patterns", "句型"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className="rounded-xl py-2.5 text-[13px] font-black transition-all"
            style={tab === id ? { background: GRAD, color: "#fff" } : { ...CARD, border: `1px solid ${SEP}`, color: LABEL }} lang="zh">{label}</button>
        ))}
      </div>
      {tab === "practice" ? <SentencePractice /> : <SentencePatterns />}
    </div>
  );
}

function SentencePatterns() {
  const [open, setOpen] = useState(null);
  return (
    <div className="space-y-2.5">
      <p className="text-[12.5px]" style={{ color: LABEL2 }}>掌握 {SENTENCE_PATTERNS.length} 个核心句型，是造句的框架。</p>
      {SENTENCE_PATTERNS.map((p) => (
        <div key={p.id} className="rounded-2xl border p-4" style={{ ...CARD, borderColor: SEP }}>
          <button onClick={() => setOpen(open === p.id ? null : p.id)} className="flex w-full items-center gap-2 text-left">
            <span className="text-[15px] font-black" style={{ color: LABEL }} lang="zh">{p.name}</span>
            <Icon name={open === p.id ? "expand_less" : "expand_more"} size={20} color={LABEL2} />
          </button>
          <div className="mt-1 text-[12.5px] font-bold" style={{ color: ACCENT }} lang="zh">{p.structure}</div>
          {open === p.id && (
            <div className="mt-2">
              <div className="text-[13px]" style={{ color: LABEL2 }}>{p.vi}</div>
              <div className="mt-2 rounded-xl p-3" style={{ background: CHIP }}>
                <div className="flex items-center gap-2">
                  <span className="text-[17px] font-black" style={{ color: LABEL }} lang="zh">{p.example.zh}</span>
                  <span onClick={() => speak(p.example.zh)}><Icon name="volume_up" size={18} color={ACCENT} /></span>
                </div>
                <PinyinText text={p.example.py} className="block text-[13px] font-bold" />
                <div className="text-[12.5px]" style={{ color: LABEL2 }}>{p.example.vi}</div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function SentencePractice() {
  const [word, setWord] = useState(null);
  const [text, setText] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const load = () => {
    setResult(null); setText(""); setWord(null); setLoading(true);
    api("/vocab/sentence/task").then((d) => { setWord(d?.word || null); setLoading(false); if (d?.word) speak(d.word.hanzi); }).catch(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);
  const check = async () => {
    setChecking(true); setResult(null);
    const r = await api("/vocab/sentence/check", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ word: word?.hanzi, text }) }).catch(() => ({ error: "网络错误，请重试。" }));
    setResult(r?.error ? { error: r.error } : r); setChecking(false);
  };
  if (loading) return <div className="mt-6 h-56 animate-pulse rounded-[28px] bg-black/5" />;
  if (!word) return <div className="mt-6 text-center text-[13px]" style={{ color: LABEL2 }}>还没有词可练，先学几个词吧。</div>;
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border p-4 text-center" style={{ ...CARD, borderColor: SEP }}>
        <div className="text-[12px] font-bold" style={{ color: LABEL2 }} lang="zh">用这个词造句</div>
        <div className="mt-1 flex items-center justify-center gap-2">
          <span className="text-[40px] font-black leading-none" style={{ color: LABEL }} lang="zh">{word.hanzi}</span>
          <span onClick={() => speak(word.hanzi)}><Icon name="volume_up" size={22} color={ACCENT} /></span>
        </div>
        <PinyinText text={word.pinyin} className="mt-1 block text-[16px] font-black" />
        <div className="text-[13px]" style={{ color: LABEL2 }}>{word.meaning || word.meaningEn}</div>
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="请写一个句子…" lang="zh"
        className="w-full rounded-2xl border p-4 text-[16px] leading-7 outline-none" style={{ ...CARD, borderColor: SEP, color: LABEL }} />
      <div className="flex gap-2">
        <button onClick={load} className="rounded-2xl border px-4 py-3 text-[14px] font-black" style={{ borderColor: SEP, color: LABEL, ...CARD }} lang="zh">换一个</button>
        <button onClick={check} disabled={checking || (text.match(/[一-鿿]/g) || []).length < 2} className="flex-1 rounded-2xl py-3 text-[15px] font-black text-white disabled:opacity-50" style={{ background: ACCENT }} lang="zh">{checking ? "AI 检查中…" : "检查 · AI"}</button>
      </div>
      {result && !result.error && (
        <div className="rounded-2xl border p-4" style={{ ...CARD, borderColor: result.ok ? "#16a34a" : "#f59e0b" }}>
          <div className="flex items-center gap-1.5 text-[14px] font-black" style={{ color: result.ok ? "#16a34a" : "#f59e0b" }} lang="zh">
            <Icon name={result.ok ? "check_circle" : "info"} size={18} color={result.ok ? "#16a34a" : "#f59e0b"} fill />
            {result.ok ? "很好！" : "可以更好"}{typeof result.score === "number" ? ` · ${result.score}` : ""}
          </div>
          {result.comment && <div className="mt-1 text-[13px]" style={{ color: LABEL }}>{result.comment}</div>}
          {result.correction && (
            <div className="mt-2 rounded-xl p-3" style={{ background: CHIP }}>
              <div className="text-[11px] font-bold" style={{ color: LABEL2 }} lang="zh">修改：</div>
              <div className="flex items-center gap-2"><span className="text-[16px] font-black" style={{ color: LABEL }} lang="zh">{result.correction}</span><span onClick={() => speak(result.correction)}><Icon name="volume_up" size={16} color={ACCENT} /></span></div>
              {result.pinyin && <PinyinText text={result.pinyin} className="block text-[12.5px] font-bold" />}
            </div>
          )}
          {result.nativeExample && (
            <div className="mt-2 flex items-start gap-1.5 text-[13px]">
              <Icon name="lightbulb" size={16} color={ACCENT} />
              <span lang="zh" style={{ color: LABEL }}>{result.nativeExample} <span onClick={() => speak(result.nativeExample)}><Icon name="volume_up" size={14} color={ACCENT} /></span></span>
            </div>
          )}
        </div>
      )}
      {result?.error && <p className="text-[12.5px] font-semibold text-rose-500">{result.error}</p>}
    </div>
  );
}

// ── LUYỆN THANH ĐIỆU (声调) ───────────────────────────────────────────────────
const TONE_STRIP = { "ā":"a","á":"a","ǎ":"a","à":"a","ē":"e","é":"e","ě":"e","è":"e","ī":"i","í":"i","ǐ":"i","ì":"i","ō":"o","ó":"o","ǒ":"o","ò":"o","ū":"u","ú":"u","ǔ":"u","ù":"u","ǖ":"ü","ǘ":"ü","ǚ":"ü","ǜ":"ü" };
const stripTone = (s) => String(s || "").split("").map((c) => TONE_STRIP[c] || c).join("");
const TONE_BTN = [{ t: 1, mk: "ˉ" }, { t: 2, mk: "ˊ" }, { t: 3, mk: "ˇ" }, { t: 4, mk: "ˋ" }, { t: 0, mk: "˙" }];

function ToneDrill() {
  const [queue, setQueue] = useState(null);
  const [i, setI] = useState(0);
  const [picks, setPicks] = useState([]);
  const [checked, setChecked] = useState(false);
  useEffect(() => { api("/vocab/due").then((d) => { setQueue((d?.queue || []).filter((c) => c?.hanzi && c?.pinyin)); setI(0); }).catch(() => setQueue([])); }, []);
  const card = queue && i < queue.length ? queue[i] : null;
  const sylls = useMemo(() => (card ? String(card.pinyin).trim().split(/\s+/).filter(Boolean) : []), [card]);
  useEffect(() => { if (card) { setPicks(Array(sylls.length).fill(null)); setChecked(false); speak(card.hanzi); } }, [card]); // eslint-disable-line react-hooks/exhaustive-deps
  if (queue === null) return <div className="mt-10 h-72 animate-pulse rounded-[28px] bg-black/5" />;
  if (!card) return <Finish icon="graphic_eq" title="太棒了！" body="本轮声调练习完成。回首页再来吧。" onDone={() => {}} />;
  const allPicked = picks.length === sylls.length && picks.every((p) => p !== null);
  const correctAll = checked && sylls.every((s, j) => picks[j] === toneOf(s));
  return (
    <div className="flex flex-col items-center pt-2">
      <div className="mb-3 text-[12px] font-bold" style={{ color: LABEL2 }} lang="zh">听发音，选每个字的声调</div>
      <div className="mb-4 flex min-h-[150px] w-full flex-col items-center justify-center rounded-[28px] border p-6" style={{ ...CARD, borderColor: SEP }}>
        <div className="flex items-center gap-2">
          <span className="text-[64px] font-black leading-none" style={{ color: LABEL }} lang="zh">{card.hanzi}</span>
          <span onClick={() => speak(card.hanzi)}><Icon name="volume_up" size={28} color={ACCENT} /></span>
        </div>
        {checked ? <PinyinText text={card.pinyin} className="mt-2 text-[20px] font-black" /> : <div className="mt-2 text-[16px] font-bold tracking-wide" style={{ color: LABEL2 }}>{sylls.map(stripTone).join(" ")}</div>}
      </div>
      <div className="w-full space-y-2.5">
        {sylls.map((s, j) => (
          <div key={j} className="flex items-center gap-2">
            <span className="w-12 shrink-0 text-[13px] font-black" style={{ color: LABEL2 }}>{stripTone(s)}</span>
            <div className="flex flex-1 gap-1.5">
              {TONE_BTN.map(({ t, mk }) => {
                const on = picks[j] === t;
                let st = { ...CARD, border: `1px solid ${SEP}`, color: TONE_COLOR[t] };
                if (checked && toneOf(s) === t) st = { background: "#16a34a", border: "0", color: "#fff" };
                else if (checked && on) st = { background: "#ef4444", border: "0", color: "#fff" };
                else if (on) st = { background: CHIP, border: `1.5px solid ${ACCENT}`, color: TONE_COLOR[t] };
                return <button key={t} disabled={checked} onClick={() => setPicks((p) => p.map((v, k) => (k === j ? t : v)))} className="flex-1 rounded-xl py-2.5 text-[20px] font-black" style={st}>{mk}</button>;
              })}
            </div>
          </div>
        ))}
      </div>
      {!checked ? (
        <button onClick={() => setChecked(true)} disabled={!allPicked} className="mt-4 w-full rounded-2xl py-3.5 text-[15px] font-black text-white disabled:opacity-50" style={{ background: ACCENT }} lang="zh">检查</button>
      ) : (
        <div className="mt-4 w-full text-center">
          <div className="mb-2 text-[15px] font-black" style={{ color: correctAll ? "#16a34a" : "#f59e0b" }} lang="zh">{correctAll ? "很好！" : "再听一遍"}</div>
          <button onClick={() => setI((x) => x + 1)} className="w-full rounded-2xl py-3.5 text-[15px] font-black text-white" style={{ background: GRAD }} lang="zh">下一个</button>
        </div>
      )}
    </div>
  );
}

// ── ĐIỀN CHỖ TRỐNG (完形) ─────────────────────────────────────────────────────
function Cloze() {
  const [queue, setQueue] = useState(null);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState(null);
  useEffect(() => { api("/vocab/due").then((d) => { setQueue((d?.queue || []).filter((c) => c?.example && c?.hanzi && c.example.includes(c.hanzi))); setI(0); }).catch(() => setQueue([])); }, []);
  const card = queue && i < queue.length ? queue[i] : null;
  useEffect(() => { setPicked(null); }, [card]);
  const opts = useMemo(() => {
    if (!card || !queue) return [];
    const pool = [...new Set(queue.filter((c) => c.hanzi !== card.hanzi).map((c) => c.hanzi))];
    return rand([card.hanzi, ...rand(pool).slice(0, 3)]);
  }, [card, queue]);
  if (queue === null) return <div className="mt-10 h-72 animate-pulse rounded-[28px] bg-black/5" />;
  if (!card) return <Finish icon="edit_note" title="太棒了！" body="还没有例句可填，或已完成。学一些带例句的词后再来。" onDone={() => {}} />;
  const blanked = card.example.split(card.hanzi).join("﹍");
  return (
    <div className="flex flex-col items-center pt-2">
      <div className="mb-2 text-[12px] font-bold" style={{ color: LABEL2 }} lang="zh">选词填空</div>
      <div className="mb-3 flex min-h-[120px] w-full flex-col items-center justify-center rounded-[28px] border p-6 text-center" style={{ ...CARD, borderColor: SEP }}>
        <div className="text-[22px] font-black leading-relaxed" style={{ color: LABEL }} lang="zh">{picked ? card.example : blanked}</div>
        {card.exampleMeaning && <div className="mt-2 text-[13px]" style={{ color: LABEL2 }}>{card.exampleMeaning}</div>}
        {picked && <span className="mt-1" onClick={() => speak(card.example)}><Icon name="volume_up" size={20} color={ACCENT} /></span>}
      </div>
      <div className="grid w-full grid-cols-2 gap-2">
        {opts.map((o) => {
          let st = { ...CARD, border: `1px solid ${SEP}`, color: LABEL }; let anim = "";
          if (picked) { if (o === card.hanzi) { st = { background: "#16a34a", border: "0", color: "#fff" }; anim = "v-pop"; } else if (o === picked) { st = { background: "#ef4444", border: "0", color: "#fff" }; anim = "v-shake"; } else st = { ...st, opacity: 0.5 }; }
          return <button key={o} disabled={!!picked} onClick={() => { if (!picked) { setPicked(o); if (o === card.hanzi) speak(card.example); } }} className={`rounded-2xl px-4 py-4 text-[22px] font-black active:scale-[0.99] transition-all ${anim}`} style={st} lang="zh">{o}</button>;
        })}
      </div>
      {picked && <button onClick={() => setI((x) => x + 1)} className="mt-4 w-full rounded-2xl py-3.5 text-[15px] font-black text-white" style={{ background: GRAD }} lang="zh">下一句</button>}
    </div>
  );
}

// ── MỞ RỘNG VỐN TỪ theo HỌ CHỮ (字族) ────────────────────────────────────────
function Expand({ lang = "vi_zh" }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState({});
  const load = (char) => {
    setLoading(true); setAdded({});
    api(`/vocab/expand${char ? `?char=${encodeURIComponent(char)}` : ""}`)
      .then((d) => { setData(d || { char: null, family: [] }); setLoading(false); if (d?.char) speak(d.char); })
      .catch(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);
  const addWord = async (w) => {
    setAdded((a) => ({ ...a, [w.cardId]: true }));
    await api("/vocab/queue-card", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cardId: w.cardId }) }).catch(() => {});
  };
  if (loading) return <div className="mt-6 h-72 animate-pulse rounded-[28px] bg-black/5" />;
  if (!data?.char) return <div className="mt-10 text-center text-[14px] font-semibold" style={{ color: LABEL2 }}>先学几个词，再按字族扩展。</div>;
  return (
    <div className="space-y-3 pt-1">
      <div className="flex items-center gap-4 rounded-[26px] p-4" style={{ background: GRAD }}>
        <button onClick={() => speak(data.char)} className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl bg-white/20 active:scale-95 transition-transform">
          <span className="text-[52px] font-black leading-none text-white" lang="zh">{data.char}</span>
        </button>
        <div className="min-w-0 flex-1 text-white">
          <div className="text-[12.5px] font-bold opacity-90">字族</div>
          <div className="text-[18px] font-black leading-tight" lang="zh">{data.family.length} 个含「{data.char}」的词</div>
          <div className="text-[12px] font-semibold opacity-90">点击听音 · 把新词加入学习</div>
        </div>
      </div>
      <button onClick={() => load()} className="flex w-full items-center justify-center gap-1.5 rounded-2xl border py-2.5 text-[13px] font-black active:scale-[.99] transition-transform" style={{ borderColor: SEP, color: LABEL, ...CARD }} lang="zh">
        <Icon name="casino" size={16} color={ACCENT} /> 换一个字
      </button>
      <div className="space-y-2">
        {data.family.map((w) => (
          <div key={w.cardId} className="flex items-center gap-3 rounded-2xl border p-3" style={{ ...CARD, borderColor: SEP }}>
            <button onClick={() => speak(w.hanzi)} className="shrink-0 active:scale-95 transition-transform"><span className="text-[26px] font-black leading-none" style={{ color: LABEL }} lang="zh">{w.hanzi}</span></button>
            <div className="min-w-0 flex-1">
              <PinyinText text={w.pinyin} className="block text-[13px] font-black" />
              <div className="truncate text-[13px]" style={{ color: LABEL2 }}>{mn(w, lang)}</div>
            </div>
            {w.known ? (
              <span className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-black" style={{ background: "rgba(22,163,74,.12)", color: "#16a34a" }} lang="zh">已掌握</span>
            ) : added[w.cardId] ? (
              <span className="shrink-0 text-[11px] font-black" style={{ color: "#16a34a" }} lang="zh">已加入 ✓</span>
            ) : (
              <button onClick={() => addWord(w)} className="shrink-0 rounded-full px-3 py-1 text-[12px] font-black text-white active:scale-95 transition-transform" style={{ background: ACCENT }} lang="zh">学</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── THI THỬ (模拟考): mô phỏng HSK/TOCFL có giờ, chấm ở server ──
function MockExam({ onDone }) {
  const [data, setData] = useState(null);
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [left, setLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const submittedRef = useRef(false);
  useEffect(() => { api("/vocab/exam").then((d) => { setData(d || { questions: [] }); setLeft(d?.durationSec || 0); }).catch(() => setData({ questions: [] })); }, []);
  const q = data && i < (data.questions?.length || 0) ? data.questions[i] : null;

  const submit = useCallback(async (ans) => {
    if (submittedRef.current) return; submittedRef.current = true;
    setSubmitting(true);
    const r = await api("/vocab/exam/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answers: ans }) }).catch(() => ({ error: "评分出错，请重试。" }));
    setResult(r); setSubmitting(false);
  }, []);

  useEffect(() => {
    if (!data || result || !data.questions?.length) return undefined;
    if (left <= 0) { submit(answers); return undefined; }
    const t = window.setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [left, data, result, answers, submit]);

  useEffect(() => { if (q && q.section === "listen") speak(q.hanzi); }, [q]);

  if (!data) return <div className="mt-10 h-72 animate-pulse rounded-[28px] bg-black/5" />;
  if (!data.questions?.length) return <Finish icon="fact_check" title="暂时无法开始" body="内容还不够，学多一点再来考。" onDone={onDone} />;

  if (result) {
    if (result.error) return <Finish icon="error" title="出错" body={result.error} onDone={onDone} />;
    const pass = result.score >= 60;
    return (
      <div className="mt-6 space-y-4">
        <div className="rounded-[28px] border p-8 text-center shadow-sm" style={{ ...CARD, borderColor: SEP }}>
          <div className="text-[56px] font-black leading-none" style={{ color: pass ? "#16a34a" : "#ef4444" }}>{result.score}%</div>
          <div className="mt-2 text-[15px] font-black" style={{ color: LABEL }} lang="zh">{pass ? "合格！" : "继续加油"}</div>
          <div className="mt-1 text-[13px]" style={{ color: LABEL2 }}>答对 {result.correct}/{result.total} 题</div>
        </div>
        {result.perDeck && Object.keys(result.perDeck).length > 0 && (
          <div className="rounded-2xl border p-4" style={{ ...CARD, borderColor: SEP }}>
            <div className="mb-2 text-[13px] font-black" style={{ color: LABEL }}>按级别</div>
            {Object.entries(result.perDeck).map(([d, s]) => (
              <div key={d} className="mb-1.5 flex items-center gap-2">
                <span className="w-16 shrink-0 text-[12px] font-bold" style={{ color: LABEL2 }}>{DECK_LABELS[d] || d}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: "rgba(0,0,0,.06)" }}><div className="h-full rounded-full" style={{ width: `${Math.round((s.correct / s.total) * 100)}%`, background: ACCENT }} /></div>
                <span className="text-[12px] font-black" style={{ color: LABEL }}>{s.correct}/{s.total}</span>
              </div>
            ))}
          </div>
        )}
        <button onClick={onDone} className="w-full rounded-2xl py-3.5 text-[15px] font-black text-white" style={{ background: GRAD }} lang="zh">完成</button>
      </div>
    );
  }

  const choose = (opt) => {
    if (submitting) return;
    const ans = [...answers, { cardId: q.cardId, choice: opt }];
    setAnswers(ans);
    if (i + 1 < data.questions.length) setI(i + 1);
    else submit(ans);
  };
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  return (
    <div className="flex flex-col items-center pt-2">
      <div className="mb-2 flex w-full items-center justify-between text-[12px] font-bold" style={{ color: LABEL2 }}>
        <span lang="zh">第 {i + 1}/{data.questions.length} 题 · {q.section === "listen" ? "听力" : "阅读"}</span>
        <span className="flex items-center gap-1" style={{ color: left < 30 ? "#ef4444" : LABEL2 }}><Icon name="timer" size={14} color={left < 30 ? "#ef4444" : LABEL2} /> {mm}:{ss}</span>
      </div>
      <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-black/10"><div className="h-full rounded-full transition-all" style={{ width: `${Math.round((i / data.questions.length) * 100)}%`, background: ACCENT }} /></div>
      <div className="mb-4 flex min-h-[150px] w-full flex-col items-center justify-center rounded-[28px] border p-6 text-center shadow-sm" style={{ ...CARD, borderColor: SEP }}>
        {q.section === "listen"
          ? <button onClick={() => speak(q.hanzi)} className="grid h-24 w-24 place-items-center rounded-full" style={{ background: CHIP }}><Icon name="volume_up" size={44} /></button>
          : (<><div className="text-[56px] font-black leading-none" style={{ color: LABEL }} lang="zh">{q.hanzi}</div><PinyinText text={q.pinyin} className="mt-2 block text-[16px] font-black" /></>)}
      </div>
      <div className="grid w-full grid-cols-1 gap-2">
        {q.options.map((o) => (
          <button key={o} onClick={() => choose(o)} disabled={submitting} className="rounded-2xl border px-4 py-3.5 text-center text-[15px] font-black active:scale-[0.99] transition-transform disabled:opacity-50" style={{ ...CARD, borderColor: SEP, color: LABEL }}>{o}</button>
        ))}
      </div>
    </div>
  );
}

function TrackPicker({ tracks, onDone }) {
  const [busy, setBusy] = useState("");
  const meta = {
    simplified: { title: "简体字", sub: "HSK · 中国大陆", desc: "简体字，考 HSK。使用最广。", zh: "汉" },
    traditional: { title: "繁體字", sub: "TOCFL · 台灣", desc: "繁体字，考 TOCFL。", zh: "漢" },
  };
  const pick = async (id) => { setBusy(id); await api("/vocab/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ track: id }) }).catch(() => {}); onDone(); };
  const list = tracks.length ? tracks : [{ id: "simplified" }, { id: "traditional" }];
  return (
    <div className="space-y-4 pt-8">
      <div className="text-center">
        <div className="text-[24px] font-black" style={{ color: LABEL }} lang="zh">选择课程</div>
        <p className="mt-1 text-[13px]" style={{ color: LABEL2 }}>你想学哪种字体？</p>
      </div>
      {list.map(({ id }) => {
        const m = meta[id] || { title: id, sub: "", desc: "", zh: "中" };
        return (
          <button key={id} onClick={() => pick(id)} disabled={busy} className="flex w-full items-center gap-4 rounded-[28px] border p-5 text-left shadow-sm active:scale-[0.98] transition-transform disabled:opacity-60" style={{ ...CARD, borderColor: SEP }}>
            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl text-[44px] font-black" style={{ background: CHIP, color: LABEL }} lang="zh">{m.zh}</div>
            <div className="min-w-0 flex-1">
              <div className="text-[18px] font-black" style={{ color: LABEL }}>{m.title}</div>
              <div className="text-[12px] font-black" style={{ color: ACCENT }}>{m.sub}</div>
              <div className="mt-1 text-[12.5px]" style={{ color: LABEL2 }}>{m.desc}</div>
            </div>
            <Icon name={busy === id ? "hourglass_top" : "chevron_right"} color="#c4c4c6" />
          </button>
        );
      })}
    </div>
  );
}

function Grammar() {
  const [open, setOpen] = useState(null);
  if (open) {
    const g = open;
    return (
      <div className="space-y-4 pt-2">
        <button onClick={() => setOpen(null)} className="flex items-center text-[13px] font-bold" style={{ color: ACCENT }}><Icon name="chevron_left" size={18} color={ACCENT} /> 列表</button>
        <div className="rounded-[28px] border p-5 shadow-sm" style={{ ...CARD, borderColor: SEP }}>
          <div className="flex items-center gap-2"><IconChip name={g.icon} /><h2 className="text-[18px] font-black" style={{ color: LABEL }}>{g.title}</h2></div>
          <div className="mt-4 rounded-2xl p-3 text-[13px]" style={{ background: CHIP, color: LABEL }}><b>Khác tiếng Việt:</b> {g.diff}</div>
          <div className="mt-3 flex items-start gap-2 text-[13.5px] font-semibold" style={{ color: LABEL }}><Icon name="rule" size={18} /> <span>{g.rule}</span></div>
          <div className="mt-4 space-y-3">
            {g.examples.map((ex, k) => (
              <div key={k} className="rounded-2xl border p-3" style={{ borderColor: SEP }}>
                <div className="flex items-center gap-2"><span className="text-[22px] font-black" style={{ color: LABEL }} lang="zh">{ex.zh}</span><span onClick={() => speak(ex.zh)}><Icon name="volume_up" size={20} /></span></div>
                <PinyinText text={ex.py} className="block text-[13.5px] font-bold" />
                <div className="text-[13px]" style={{ color: LABEL2 }}>{ex.vi}</div>
              </div>
            ))}
          </div>
          {g.tip && <div className="mt-4 flex items-start gap-2 rounded-2xl p-3 text-[13px]" style={{ background: CHIP, color: LABEL }}><Icon name="lightbulb" size={18} /> <span>{g.tip}</span></div>}
        </div>
        {g.practice && <GrammarPractice practice={g.practice} />}
      </div>
    );
  }
  return (
    <div className="space-y-2.5 pt-2">
      <p className="text-[12.5px]" style={{ color: LABEL2 }}>Đa số ngữ pháp tiếng Trung giống tiếng Việt. Đây là {GRAMMAR_LESSONS.length} điểm KHÁC — học đúng chỗ hay sai.</p>
      {GRAMMAR_LESSONS.map((g) => (
        <button key={g.id} onClick={() => setOpen(g)} className="flex w-full items-center gap-3 rounded-2xl border p-4 text-left active:scale-[0.99] transition-transform" style={{ ...CARD, borderColor: SEP }}>
          <IconChip name={g.icon} />
          <div className="min-w-0 flex-1"><div className="text-[14px] font-black" style={{ color: LABEL }}>{g.title}</div><div className="truncate text-[12px]" style={{ color: LABEL2 }}>{g.diff}</div></div>
          <Icon name="chevron_right" color="#c4c4c6" />
        </button>
      ))}
    </div>
  );
}

// ── Lịch sử: các từ đã thuộc (không học lại, lưu ở đây) ─────────────────────
function History({ lang = "vi_zh" }) {
  const [data, setData] = useState(null);
  useEffect(() => { api("/vocab/history").then((d) => setData(d?.error ? { items: [], total: 0 } : d)); }, []);
  if (!data) return <div className="mt-10 h-72 animate-pulse rounded-[28px] bg-black/5" />;
  if (!data.items.length) return <Finish icon="history" title="还没有词" body="评为「已掌握」的词会存在这里，无需重学。" onDone={() => {}} />;
  return (
    <div className="space-y-2 pt-2">
      <p className="text-[12.5px]" style={{ color: LABEL2 }}>{data.total} 个已掌握 — 无需重学。</p>
      {data.items.map((c, i) => (
        <div key={i} className="flex items-center gap-3 rounded-2xl border p-3" style={{ ...CARD, borderColor: SEP }}>
          <div className="text-[24px] font-black" style={{ color: LABEL }} lang="zh">{c.hanzi}</div>
          <div className="min-w-0 flex-1">
            <PinyinText text={c.pinyin} className="block text-[13px] font-bold" />
            <div className="truncate text-[13px]" style={{ color: LABEL2 }}>{mn(c, lang)}</div>
            <HanVietChip text={c.hanViet} />
          </div>
          <span onClick={() => speak(c.hanzi)}><Icon name="volume_up" size={20} /></span>
        </div>
      ))}
    </div>
  );
}

// ── Từ giống tiếng Việt (âm Hán-Việt) ───────────────────────────────────────
function HanViet({ lang = "vi_zh" }) {
  const [data, setData] = useState(null);
  const [onlyCognate, setOnlyCognate] = useState(false);
  useEffect(() => { api("/vocab/hanviet").then((d) => setData(d?.error ? { items: [] } : d)); }, []);
  if (!data) return <div className="mt-10 h-72 animate-pulse rounded-[28px] bg-black/5" />;
  const items = onlyCognate ? data.items.filter((i) => i.cognate) : data.items;
  return (
    <div className="space-y-2 pt-2">
      <div className="rounded-2xl border p-4" style={{ ...CARD, borderColor: SEP }}>
        <p className="text-[12.5px]" style={{ color: LABEL }}>
          Rất nhiều từ tiếng Trung có <b>âm Hán-Việt</b> trùng tiếng Việt — học là nhớ ngay.
          Có <b>{data.cognateCount}</b> từ khớp sát nghĩa ở cấp này.
        </p>
        <button onClick={() => setOnlyCognate((v) => !v)} className="mt-2 rounded-full px-3 py-1 text-[12px] font-black" style={{ background: onlyCognate ? ACCENT : CHIP, color: onlyCognate ? "#fff" : LABEL }}>
          {onlyCognate ? "Đang xem: khớp sát nghĩa" : "Chỉ xem từ khớp sát nghĩa"}
        </button>
      </div>
      {items.map((c, i) => (
        <div key={i} className="flex items-center gap-3 rounded-2xl border p-3" style={{ ...CARD, borderColor: c.cognate ? ACCENT : SEP }}>
          <div className="text-[24px] font-black" style={{ color: LABEL }} lang="zh">{c.hanzi}</div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <PinyinText text={c.pinyin} className="text-[13px] font-bold" />
              <span className="rounded-full px-2 py-0.5 text-[11px] font-black" style={{ background: CHIP, color: LABEL }}>{c.hanViet}</span>
              {c.cognate && <Icon name="verified" size={15} color={ACCENT} fill />}
            </div>
            <div className="truncate text-[12.5px]" style={{ color: LABEL2 }}>{mn(c, lang)}</div>
          </div>
          <span onClick={() => speak(c.hanzi)}><Icon name="volume_up" size={20} /></span>
        </div>
      ))}
    </div>
  );
}

// ── Cài đặt ──────────────────────────────────────────────────────────────────
function Settings({ status, fontStyle = "modern", onFont, onDone }) {
  const cal = calendarLinks(20);
  const [track, setTrack] = useState(status?.track || "simplified");
  const [lang, setLang] = useState(status?.langPair || "vi_zh");
  const [push, setPush] = useState(status?.pushEnabled !== false);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  useEffect(() => { ensureZhFonts(); }, []); // nạp 报刊/行书 để xem trước

  const savePrefs = (patch) => api("/vocab/prefs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) }).catch(() => {});

  const retake = async () => {
    setBusy("retake");
    await api("/vocab/reset-placement", { method: "POST" }).catch(() => {});
    onDone(); // về home → gặp test đầu vào
  };
  const switchTrack = async (tId) => {
    setTrack(tId);
    setBusy("track");
    await api("/vocab/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ track: tId }) }).catch(() => {});
    setMsg("已切换字体 — 需为新课程重新分级。");
    setBusy("");
  };
  const pickLang = (l) => { setLang(l); savePrefs({ langPair: l }); };
  const togglePush = () => { const v = !push; setPush(v); savePrefs({ pushEnabled: v }); };

  const Row = ({ icon, title, children }) => (
    <div className="rounded-[22px] border p-4" style={{ ...CARD, borderColor: SEP }}>
      <div className="mb-2 flex items-center gap-2"><Icon name={icon} size={18} /><span className="text-[13.5px] font-black" style={{ color: LABEL }}>{title}</span></div>
      {children}
    </div>
  );
  const Seg = ({ options, value, onPick }) => (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length},1fr)` }}>
      {options.map((o) => {
        const on = o.id === value;
        return (
          <button key={o.id} onClick={() => onPick(o.id)}
            className="rounded-xl py-2.5 text-[13px] font-black transition-all"
            style={on ? { background: GRAD, color: "#fff" } : { ...CARD, border: `1px solid ${SEP}`, color: LABEL }}>{o.label}</button>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-3 pt-2">
      <Row icon="font_download" title="字体">
        <div className="grid grid-cols-3 gap-2">
          {[["modern", "现代"], ["print", "报刊"], ["cal", "行书"]].map(([id, label]) => (
            <button key={id} onClick={() => onFont && onFont(id)} lang="zh"
              className="rounded-xl py-3 text-[22px] font-black transition-all active:scale-95"
              style={fontStyle === id
                ? { background: GRAD, color: "#fff", fontFamily: ZH_FONTS[id] }
                : { ...CARD, border: `1px solid ${SEP}`, color: LABEL, fontFamily: ZH_FONTS[id] }}>{label}</button>
          ))}
        </div>
        <p className="mt-2 text-[11.5px]" style={{ color: LABEL2 }}>现代 = hiện đại · 报刊 = kiểu in báo 1900s · 行书 = thư pháp</p>
      </Row>

      <Row icon="restart_alt" title="水平测试">
        <p className="mb-2 text-[12px]" style={{ color: LABEL2 }}>重做入学测试，重新分到合适级别。</p>
        <button onClick={retake} disabled={busy === "retake"} className="w-full rounded-xl py-2.5 text-[13px] font-black text-white" style={{ background: GRAD }}>重新测试</button>
      </Row>

      <Row icon="translate" title="字体">
        <Seg value={track} onPick={switchTrack} options={[{ id: "simplified", label: "简体 · HSK" }, { id: "traditional", label: "繁体 · TOCFL" }]} />
      </Row>

      <Row icon="language" title="释义语言">
        <Seg value={lang} onPick={pickLang} options={[{ id: "vi_zh", label: "越–中" }, { id: "en_zh", label: "英–中" }]} />
      </Row>

      <Row icon="event" title="加入日历">
        <p className="mb-2 text-[12px]" style={{ color: LABEL2 }}>把每天 20:00 的复习加入设备日历。</p>
        <div className="flex gap-2">
          <a href={cal.icsUrl} download="hugo-vocab.ics" className="flex-1 rounded-xl border py-2.5 text-center text-[12.5px] font-bold" style={{ borderColor: SEP, color: LABEL }}>加入日历</a>
          <a href={cal.gcal} target="_blank" rel="noreferrer" className="flex-1 rounded-xl border py-2.5 text-center text-[12.5px] font-bold" style={{ borderColor: SEP, color: LABEL }}>Google 日历</a>
        </div>
      </Row>

      <Row icon="notifications" title="复习提醒">
        <button onClick={togglePush} className="flex w-full items-center justify-between">
          <span className="text-[12.5px]" style={{ color: LABEL2 }}>按时接收复习提醒（推送）</span>
          <span className="relative inline-block h-6 w-11 rounded-full transition-all" style={{ background: push ? "#16a34a" : "#cbd5e1" }}>
            <span className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all" style={{ left: push ? 22 : 2 }} />
          </span>
        </button>
      </Row>

      {msg && <p className="px-1 text-[12px] font-semibold" style={{ color: ACCENT }}>{msg}</p>}
      <button onClick={onDone} className="w-full rounded-2xl py-3.5 text-[15px] font-black text-white" style={{ background: GRAD }}>完成</button>
    </div>
  );
}

// ── Thực hành ngữ pháp: SẮP XẾP CÂU (chạm từ theo đúng thứ tự) ──────────────
function GrammarPractice({ practice }) {
  const answerKey = practice.tokens;
  const [pool, setPool] = useState(() => rand(answerKey.map((t, i) => ({ t, i }))));
  const [chosen, setChosen] = useState([]); // {t, i}
  const done = chosen.length === answerKey.length;
  const correct = done && chosen.every((c, k) => c.t === answerKey[k]);

  const pick = (item) => { if (done) return; setChosen([...chosen, item]); setPool(pool.filter((x) => x.i !== item.i)); };
  const undo = (item) => { setChosen(chosen.filter((x) => x.i !== item.i)); setPool([...pool, item]); };
  const reset = () => { setChosen([]); setPool(rand(answerKey.map((t, i) => ({ t, i })))); };

  return (
    <div className="rounded-[28px] border p-5 shadow-sm" style={{ ...CARD, borderColor: SEP }}>
      <div className="mb-1 flex items-center gap-2"><Icon name="extension" size={18} color={ACCENT} /><span className="text-[14px] font-black" style={{ color: LABEL }}>练习：组句</span></div>
      <p className="mb-3 text-[12.5px]" style={{ color: LABEL2 }}>按正确顺序点词组句： <b style={{ color: LABEL }}>{practice.vi}</b></p>

      {/* Hàng đáp án */}
      <div className="min-h-[52px] rounded-2xl border p-2 flex flex-wrap gap-2" style={{ borderColor: done ? (correct ? "#16a34a" : "#ef4444") : SEP, background: "rgba(0,0,0,0.02)" }}>
        {chosen.length === 0 && <span className="self-center px-2 text-[12px]" style={{ color: LABEL2 }}>点击下方的词…</span>}
        {chosen.map((item) => (
          <button key={item.i} onClick={() => undo(item)} className="rounded-xl px-3 py-2 text-[18px] font-black" style={{ background: CHIP, color: LABEL }} lang="zh">{item.t}</button>
        ))}
      </div>

      {/* Kho từ xáo trộn */}
      <div className="mt-3 flex flex-wrap gap-2">
        {pool.map((item) => (
          <button key={item.i} onClick={() => pick(item)} className="rounded-xl px-3 py-2 text-[18px] font-black active:scale-95 transition-transform" style={{ ...CARD, border: `1.5px solid ${SEP}`, color: LABEL }} lang="zh">{item.t}</button>
        ))}
      </div>

      {done && (
        <div className="mt-3 rounded-2xl p-3 text-center" style={{ background: correct ? "rgba(22,163,74,0.1)" : "rgba(239,68,68,0.1)" }}>
          <div className="flex items-center justify-center gap-1.5 text-[14px] font-black" style={{ color: correct ? "#16a34a" : "#ef4444" }}>
            <Icon name={correct ? "check_circle" : "cancel"} size={18} color={correct ? "#16a34a" : "#ef4444"} fill />
            {correct ? "正确！" : "不对"}
          </div>
          {!correct && (
            <div className="mt-1 text-[16px] font-black" style={{ color: LABEL }} lang="zh">
              {answerKey.join(" ")} <span onClick={() => speak(answerKey.join(""))}><Icon name="volume_up" size={16} color={ACCENT} /></span>
            </div>
          )}
          <button onClick={reset} className="mt-2 rounded-xl px-4 py-2 text-[12.5px] font-black text-white" style={{ background: GRAD }}>再试一次</button>
        </div>
      )}
    </div>
  );
}
