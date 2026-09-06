import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import AppFrame from "../os/AppFrame";
import { GRAMMAR_LESSONS } from "./grammarLessons";
import { SENTENCE_PATTERNS } from "./sentencePatterns";
import { startPresence, stopPresence, subscribeNearby, subscribeToss, tossCard } from "./vocabToss";

// Base URL suy ra như các service khác (không có module chung để import).
const apiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.startsWith("http")) return envUrl;
  if (typeof window !== "undefined") return `${window.location.origin}${envUrl || "/api"}`;
  return "/api";
};
const api = (path, opts = {}) =>
  fetch(`${apiUrl()}${path}`, { credentials: "include", ...opts }).then((r) => r.json());

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
function PinyinText({ text, className, style }) {
  const tokens = String(text || "").split(/(\s+)/);
  return (
    <span className={className} style={style}>
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
// Kiểu THƯ PHÁP cho tiêu đề/hero chữ Hán (KHÔNG dùng cho chữ đang học trên thẻ —
// từ vựng phải thấy nét chuẩn). Font nạp động khi mở app (xem loadCalligraphy).
const CAL = { fontFamily: '"Ma Shan Zheng","KaiTi","STKaiti","Kaiti SC",serif' };
function loadCalligraphy() {
  if (typeof document === "undefined" || document.getElementById("vocab-cal-font")) return;
  const l = document.createElement("link");
  l.id = "vocab-cal-font"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&display=swap";
  document.head.appendChild(l);
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
// Thẻ TÍNH NĂNG (trò chơi/hoạt động) — đầu màu + mặt cười, thân có icon + mô tả.
function FeatureCard({ color, icon, title, sub, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="overflow-hidden rounded-[24px] text-left shadow-sm active:scale-[0.97] transition-transform disabled:opacity-45"
      style={{ ...CARD, border: `1px solid ${SEP}` }}>
      <div className="flex h-[70px] items-center justify-center" style={{ background: color }}><Face /></div>
      <div className="flex items-start gap-2 p-3.5">
        <Icon name={icon} size={20} color={color} fill />
        <div className="min-w-0">
          <div className="text-[14px] font-black" style={{ color: LABEL }}>{title}</div>
          <div className="text-[11px] leading-tight" style={{ color: LABEL2 }}>{sub}</div>
        </div>
      </div>
    </button>
  );
}

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

export default function HugoVocabApp({ onBack }) {
  const [view, setView] = useState("loading"); // loading|track|placement|home|review|exit|grammar|essay
  const [deck, setDeck] = useState("hsk1");
  const [mode, setMode] = useState("recognize");
  const [status, setStatus] = useState(null);
  const [progress, setProgress] = useState(null);
  const [langPair, setLangPair] = useState("vi_zh");
  // Trạng thái màn nằm trong URL (?v=&deck=&mode=) để RELOAD vẫn ở đúng chỗ.
  const initial = useRef(new URLSearchParams(typeof window !== "undefined" ? window.location.search : ""));

  const loadHome = useCallback(async () => {
    // Gọi SONG SONG cho nhanh; /progress bỏ đi nếu chưa chọn khoá/chưa test.
    const [st, p] = await Promise.all([api("/vocab/status"), api("/vocab/progress").catch(() => null)]);
    setStatus(st || null);
    if (st?.needsTrack) { setProgress(null); setView("track"); return; }
    if (st?.langPair) setLangPair(st.langPair);
    setProgress(p || null);
    if (st && !st.placed) { setView("placement"); return; }
    // Khôi phục màn/bộ/chế độ từ URL (một lần) — cổng gating ở trên luôn thắng.
    const q = initial.current; initial.current = new URLSearchParams();
    if (q.get("mode")) setMode(q.get("mode"));
    setDeck(q.get("deck") || st?.activeDeck || "hsk1");
    const iv = q.get("v");
    setView(["review", "exit", "essay", "grammar", "skip", "history", "hanviet"].includes(iv) ? iv : "home");
  }, []);
  useEffect(() => { loadHome(); }, [loadHome]);

  // Bật "presence" khi mở app: báo cho các thiết bị khác cùng tài khoản biết máy
  // này đang mở vocab, để bật tính năng tung thẻ (xem vocabToss.js).
  useEffect(() => { startPresence(); return () => stopPresence(); }, []);
  useEffect(() => { loadCalligraphy(); }, []); // font thư pháp (nạp một lần)

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
    const p = new URLSearchParams();
    p.set("v", view);
    if (view === "review") { p.set("deck", deck); p.set("mode", mode); }
    window.history.replaceState(null, "", `${window.location.pathname}?${p.toString()}`);
  }, [view, deck, mode]);

  const subtitle = view === "review" ? DECK_LABELS[deck]
    : view === "placement" ? "分级测试"
    : view === "exit" ? "结业测验"
    : view === "skip" ? "跳级测试"
    : view === "essay" ? "写作考试"
    : view === "track" ? "选择课程"
    : view === "grammar" ? "重点语法"
    : view === "sentence" ? "造句"
    : view === "history" ? "已掌握"
    : view === "hanviet" ? "汉越词"
    : view === "coach" ? "学习顾问"
    : view === "settings" ? "设置"
    : (status?.trackLabel || "华语学习");

  const startToday = () => { setMode("recognize"); if (status?.activeDeck) setDeck(status.activeDeck); setView("review"); };

  return (
    <AppFrame
      appId="vocab"
      forceScheme="light"
      title="华语"
      subtitle={subtitle}
      actions={view === "home" ? <button onClick={() => setView("settings")} aria-label="设置" className="grid h-9 w-9 place-items-center rounded-full" style={{ background: CHIP }}><Icon name="settings" size={20} /></button> : null}
      onBack={["review", "exit", "grammar", "essay", "skip", "history", "hanviet", "settings", "coach", "sentence"].includes(view) ? () => { setView("home"); loadHome(); } : onBack}
    >
      <div key={view} className="animate-fadeIn">
      {view === "loading" && <div className="mt-10 h-72 animate-pulse rounded-[28px] bg-black/5" />}
      {view === "track" && <TrackPicker tracks={status?.tracks || []} onDone={() => loadHome()} />}
      {view === "grammar" && <Grammar />}
      {view === "placement" && <Quiz type="placement" onFinish={() => loadHome()} />}
      {view === "exit" && <Quiz type="exit" onFinish={() => loadHome()} />}
      {view === "essay" && <Essay onDone={() => { setView("home"); loadHome(); }} />}
      {view === "skip" && <Quiz type="skip" onFinish={() => loadHome()} />}
      {view === "history" && <History lang={langPair} />}
      {view === "hanviet" && <HanViet lang={langPair} />}
      {view === "settings" && <Settings status={status} onDone={() => { setView("home"); loadHome(); }} />}
      {view === "home" && (
        <Home progress={progress} status={status}
          onStudyDeck={(d) => { setMode("recognize"); setDeck(d); setView("review"); }}
          onStudyMode={(m) => { setMode(m); if (status?.activeDeck) setDeck(status.activeDeck); setView("review"); }}
          onGrammar={() => setView("grammar")} onEssay={() => setView("essay")}
          onSkip={() => setView("skip")} onHistory={() => setView("history")} onHanViet={() => setView("hanviet")}
          onCoach={() => setView("coach")} onSentence={() => setView("sentence")} />
      )}
      {view === "coach" && <Coach lang={langPair} onStart={startToday} />}
      {view === "sentence" && <SentenceBuild />}
      {view === "review" && <Review deck={deck} mode={mode} lang={langPair} onDone={() => { setView("home"); loadHome(); }} />}
      </div>
      <TossLayer />
    </AppFrame>
  );
}

function Home({ progress, status, onStudyDeck, onStudyMode, onGrammar, onEssay, onSkip, onHistory, onHanViet, onCoach, onSentence }) {
  const cal = calendarLinks(20);
  const ladder = status?.ladder || [];
  const activeDeck = status?.activeDeck || "hsk1";

  const FEATURES = [
    { id: "grammar", color: "#8b5cf6", icon: "menu_book", title: "语法", sub: "课程 + 练习", onClick: onGrammar },
    { id: "sentence", color: "#0ea5e9", icon: "format_quote", title: "造句", sub: "句型 + AI 检查", onClick: onSentence },
    { id: "hanviet", color: "#22c55e", icon: "compare_arrows", title: "汉越词", sub: "国家 → quốc gia", onClick: onHanViet },
    { id: "essay", color: "#14b8a6", icon: "edit_note", title: "写作", sub: "AI 母语点评", onClick: onEssay },
    { id: "listen", color: "#3b82f6", icon: "hearing", title: "听力", sub: "听 → 选义", onClick: () => onStudyMode("listen") },
    { id: "guess", color: "#f97316", icon: "quiz", title: "猜词", sub: "选择题游戏", onClick: () => onStudyMode("meaning") },
    { id: "history", color: "#ec4899", icon: "history", title: "已掌握", sub: `${progress?.mastered ?? 0} 个牢记的词`, onClick: onHistory },
  ];

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
          <div className="text-[19px] font-black" style={{ color: LABEL, ...CAL }}>你好 👋</div>
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
            <Icon name="auto_awesome" size={18} color={ACCENT} fill /> <span style={CAL}>学习顾问</span>
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

      {/* ── TÍNH NĂNG (trò chơi/luyện tập) ── */}
      <SectionTitle>功能</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        {FEATURES.map((f) => <FeatureCard key={f.id} {...f} />)}
      </div>

      {/* Nhắc lịch */}
      <div className="rounded-2xl border p-4" style={{ ...CARD, borderColor: SEP }}>
        <div className="flex items-center gap-2"><Icon name="alarm" size={18} /><span className="text-[13px] font-black" style={{ color: LABEL }}>加入日历提醒</span></div>
        <div className="mt-3 flex gap-2">
          <a href={cal.icsUrl} download="hugo-vocab.ics" className="flex-1 rounded-xl border py-2.5 text-center text-[12.5px] font-bold" style={{ borderColor: SEP, color: LABEL }}>加入日历</a>
          <a href={cal.gcal} target="_blank" rel="noreferrer" className="flex-1 rounded-xl border py-2.5 text-center text-[12.5px] font-bold" style={{ borderColor: SEP, color: LABEL }}>Google 日历</a>
        </div>
      </div>
    </div>
  );
}

const rand = (arr) => arr.map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(([, v]) => v);

// Ôn tập = TRÒ CHƠI trắc nghiệm (đoán nghĩa / đoán từ / nghe chọn), tự chấm.
// Từ MỚI: học nhanh rồi chọn "Đã thuộc" (vào lịch sử) hoặc "Học tiếp".
// ── CỐ VẤN HỌC TẬP (tiến độ khoa học + định hướng + bạn học) ──────────────────
const WD = ["日", "一", "二", "三", "四", "五", "六"];
const wd = (iso) => WD[new Date(iso + "T00:00:00").getDay()];
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
  const maxF = Math.max(1, ...d.forecast.map((f) => f.n));
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

      <div>
        <SectionTitle>你的词汇</SectionTitle>
        <div className="flex h-3 w-full overflow-hidden rounded-full" style={{ background: "rgba(0,0,0,.06)" }}>
          {seg.map((s, i) => s.n > 0 && <div key={i} style={{ width: `${(s.n / scTotal) * 100}%`, background: s.c }} />)}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] font-bold" style={{ color: LABEL2 }}>
          {seg.map((s, i) => <span key={i} className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full" style={{ background: s.c }} />{s.label}: {s.n}</span>)}
        </div>
      </div>

      <div>
        <SectionTitle>未来7天复习量</SectionTitle>
        <div className="flex items-end justify-between gap-1.5 rounded-[18px] border p-3" style={{ ...CARD, borderColor: SEP, height: 92 }}>
          {d.forecast.map((f) => (
            <div key={f.d} className="flex flex-1 flex-col items-center justify-end gap-1">
              <div className="w-full rounded-md transition-all" style={{ height: `${Math.max(4, (f.n / maxF) * 52)}px`, background: f.n ? ACCENT : "rgba(0,0,0,.08)" }} />
              <span className="text-[9.5px] font-bold" style={{ color: LABEL2 }}>{wd(f.d)}</span>
            </div>
          ))}
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

function Review({ deck, mode = "recognize", lang = "vi_zh", onDone }) {
  const [queue, setQueue] = useState(null);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null); // đáp án đã chọn (game)
  const [flip, setFlip] = useState(false);    // lật thẻ (học từ mới)
  const [done, setDone] = useState(0);
  const nearby = useNearby();
  const shownAt = useRef(Date.now()); // đo thời gian trả lời → theo dõi tốc độ

  useEffect(() => {
    let alive = true;
    api(`/vocab/due?deck=${deck}`).then((d) => { if (alive) { setQueue(d.queue || []); setIdx(0); setPicked(null); setFlip(false); } });
    return () => { alive = false; };
  }, [deck]);

  const card = queue && idx < queue.length ? queue[idx] : null;
  // Loại game theo chế độ: nhận diện=đoán nghĩa, nhớ ngược=đoán từ, nghe=nghe chọn.
  const game = mode === "produce" ? "word" : mode === "listen" ? "listen" : "meaning";
  // Mở thẻ là TỰ ĐỌC một lần — trừ game "đoán từ" (chữ Hán là đáp án, đọc sẽ lộ).
  useEffect(() => {
    if (!card) return;
    shownAt.current = Date.now();
    if (card.kind === "new" || game === "meaning" || game === "listen") speak(card.hanzi);
  }, [card, game]);

  const post = (cardId, g) => api("/vocab/review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cardId, grade: g, ms: Date.now() - shownAt.current }) }).catch(() => {});
  const advance = () => { setPicked(null); setFlip(false); setDone((n) => n + 1); setIdx((i) => i + 1); };
  const learn = (g) => { post(card._id, g); advance(); };
  const answer = (opt, correct) => {
    if (picked) return;
    setPicked({ opt, right: opt === correct });
    post(card._id, opt === correct ? 2 : 0);
    setTimeout(advance, opt === correct ? 550 : 1300);
  };

  if (queue === null) return <div className="mt-10 h-72 animate-pulse rounded-[28px] bg-black/5" />;
  if (queue.length === 0) return <Finish icon="local_fire_department" title="太棒了！" body="本级可学内容已学完。升级或稍后再来吧。" onDone={onDone} />;
  if (idx >= queue.length) return <Finish icon="local_fire_department" title={`学完 ${done} 个词！`} body="继续学吗？回首页再进来就有新一批。" onDone={onDone} />;

  const progress = (
    <>
      <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-black/10">
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.round((idx / queue.length) * 100)}%`, background: ACCENT }} />
      </div>
      <div className="mb-3 text-[12px] font-bold" style={{ color: LABEL2 }}>
        {idx + 1} / {queue.length} · {card.kind === "new" ? "生词" : card.kind === "ahead" ? "预习" : "复习"}
      </div>
    </>
  );

  // ── TỪ MỚI: FLASHCARD lật đẹp (mặt trước chữ, lật ra nghĩa) ──
  if (card.kind === "new") {
    return (
      <div className="flex flex-col items-center pt-2">
        {progress}
        {nearby && (
          <div className="mb-2 flex items-center gap-1.5 text-[12px] font-black" style={{ color: ACCENT }}>
            <Icon name="swipe_up" size={16} color={ACCENT} /> 另一台设备已打开 — 向上甩牌发送过去
          </div>
        )}
        {/* Thẻ trên nền gradient cho nổi bật, giống mẫu */}
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
                <div className="mt-3 text-[12px] font-bold" style={{ color: LABEL2 }}>点击下方翻牌</div>
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
          <button onClick={() => { setFlip(true); speak(card.hanzi); }} className="mt-4 w-full rounded-2xl py-4 text-[15px] font-black text-white active:scale-[0.98] transition-transform" style={{ background: GRAD }}>
            翻牌
          </button>
        ) : (
          <div className="mt-4 grid w-full grid-cols-2 gap-2">
            <button onClick={() => learn(3)} className="rounded-2xl border py-3.5 text-[14px] font-black active:scale-95 transition-transform" style={{ borderColor: SEP, color: LABEL, ...CARD }}>已掌握</button>
            <button onClick={() => learn(2)} className="rounded-2xl py-3.5 text-[14px] font-black text-white active:scale-95 transition-transform" style={{ background: GRAD }}>学这个词</button>
          </div>
        )}
        <FriendSend card={card} />
      </div>
    );
  }

  // ── ÔN LẠI = TRÒ CHƠI TRẮC NGHIỆM ──
  const pool = queue.filter((c) => c._id !== card._id);
  const val = (c) => (game === "word" ? c.hanzi : mn(c, lang));
  const correct = val(card);
  const distractors = rand([...new Set(pool.map(val).filter((v) => v && v !== correct))]).slice(0, 3);
  const options = rand([correct, ...distractors]);
  const prompt = game === "word"
    ? <div className="px-4 text-[24px] font-black" style={{ color: LABEL }}>{mn(card, lang)}</div>
    : game === "listen"
      ? <button onClick={() => speak(card.hanzi)} className="grid h-24 w-24 place-items-center rounded-full" style={{ background: CHIP }}><Icon name="volume_up" size={44} /></button>
      : (<><div className="text-[64px] font-black leading-none" style={{ color: LABEL }} lang="zh">{card.hanzi}</div><PinyinText text={card.pinyin} className="mt-2 block text-[18px] font-black" /></>);
  const question = game === "word" ? "选择正确汉字" : "选择正确释义";

  return (
    <div className="flex flex-col items-center pt-2">
      {progress}
      <div className="mb-2 text-[12px] font-bold" style={{ color: LABEL2 }}>{question}</div>
      <div className="mb-4 flex min-h-[180px] w-full flex-col items-center justify-center rounded-[28px] border p-6 text-center shadow-sm" style={{ ...CARD, borderColor: SEP }}>
        {prompt}
      </div>
      <div className="grid w-full grid-cols-1 gap-2">
        {options.map((opt) => {
          let st = { ...CARD, borderColor: SEP, color: LABEL };
          if (picked) {
            if (opt === correct) st = { background: "#16a34a", borderColor: "transparent", color: "#fff" };
            else if (opt === picked.opt) st = { background: "#ef4444", borderColor: "transparent", color: "#fff" };
            else st = { ...st, opacity: 0.5 };
          }
          return (
            <button key={opt} onClick={() => answer(opt, correct)} disabled={!!picked}
              className={`rounded-2xl border px-4 py-3.5 text-center font-black active:scale-[0.99] transition-all ${game === "word" ? "text-[22px]" : "text-[15px]"}`}
              style={st} lang={game === "word" ? "zh" : undefined}>{opt}</button>
          );
        })}
      </div>
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
            {[["grammar", "语法 · Ngữ pháp"], ["vocabulary", "词汇 · Từ vựng"], ["coherence", "连贯 · Mạch lạc"]].map(([k, label]) => {
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
      <p className="text-[12.5px]" style={{ color: LABEL2 }}>Nắm {SENTENCE_PATTERNS.length} mẫu câu cốt lõi — khung để đặt câu đúng.</p>
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
    const r = await api("/vocab/sentence/check", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ word: word?.hanzi, text }) }).catch(() => ({ error: "Lỗi mạng, thử lại." }));
    setResult(r?.error ? { error: r.error } : r); setChecking(false);
  };
  if (loading) return <div className="mt-6 h-56 animate-pulse rounded-[28px] bg-black/5" />;
  if (!word) return <div className="mt-6 text-center text-[13px]" style={{ color: LABEL2 }}>Chưa có từ để luyện. Học vài từ trước nhé.</div>;
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
        <div className="text-[24px] font-black" style={{ color: LABEL, ...CAL }}>选择课程</div>
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
function Settings({ status, onDone }) {
  const cal = calendarLinks(20);
  const [track, setTrack] = useState(status?.track || "simplified");
  const [lang, setLang] = useState(status?.langPair || "vi_zh");
  const [push, setPush] = useState(status?.pushEnabled !== false);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");

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
