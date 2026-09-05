import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import AppFrame from "../os/AppFrame";
import { GRAMMAR_LESSONS } from "./grammarLessons";

// Base URL suy ra như các service khác (không có module chung để import).
const apiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.startsWith("http")) return envUrl;
  if (typeof window !== "undefined") return `${window.location.origin}${envUrl || "/api"}`;
  return "/api";
};
const api = (path, opts = {}) =>
  fetch(`${apiUrl()}${path}`, { credentials: "include", ...opts }).then((r) => r.json());

// Phát âm bằng giọng đọc sẵn của trình duyệt (miễn phí). Ưu tiên giọng Trung.
function speak(text) {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "zh-CN";
    const zh = synth.getVoices().find((v) => /zh|cmn|Chinese/i.test(v.lang || v.name));
    if (zh) u.voice = zh;
    u.rate = 0.85;
    synth.speak(u);
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

function HanVietChip({ text }) {
  if (!text) return null;
  return <span className="mt-1 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-bold" style={{ background: CHIP, color: LABEL }}><Icon name="compare_arrows" size={13} /> Hán-Việt: {text}</span>;
}

const MODES = [
  { id: "recognize", label: "Nhận diện", icon: "visibility", hint: "Nhìn chữ → nhớ nghĩa" },
  { id: "produce", label: "Nhớ ngược", icon: "translate", hint: "Nhìn nghĩa → nhớ chữ" },
  { id: "listen", label: "Nghe", icon: "hearing", hint: "Nghe → đoán nghĩa" },
];
const DECK_LABELS = {
  hsk1: "HSK 1", hsk2: "HSK 2", hsk3: "HSK 3", hsk4: "HSK 4", hsk5: "HSK 5", hsk6: "HSK 6",
  tocfl1: "TOCFL 1", tocfl2: "TOCFL 2", tocfl3: "TOCFL 3", tocfl4: "TOCFL 4", tocfl5: "TOCFL 5", tocfl6: "TOCFL 6",
};

function calendarLinks(hour = 20) {
  const hh = String(hour).padStart(2, "0");
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Hugo Studio//Vocab//VI",
    "BEGIN:VEVENT", `DTSTART:20260101T${hh}0000`, "RRULE:FREQ=DAILY",
    "SUMMARY:Ôn từ vựng tiếng Trung (Hugo)", "DESCRIPTION:Dành 5 phút ôn thẻ.",
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  return {
    icsUrl: `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`,
    gcal: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent("Ôn từ vựng tiếng Trung (Hugo)")}&recur=RRULE:FREQ=DAILY`,
  };
}

const ACCENT = "var(--ios-accent,#e11d48)";
// Tươi mới: một dải gradient chủ đạo (hồng → cam) cho hero/nút chính. Đây là
// điểm nhấn có chủ đích cho app học, không phải nền động toàn portal.
const GRAD = "linear-gradient(135deg,#fb7185 0%,#e11d48 55%,#f97316 130%)";
const GRAD_SOFT = "linear-gradient(135deg,#fff1f2,#ffedd5)";
const CARD = { background: "var(--ios-fill,#fff)" };
const SEP = "var(--ios-separator,#e5e7eb)";
const LABEL = "var(--ios-label,#111)";
const LABEL2 = "var(--ios-label-2,#6b7280)";
const CHIP = "rgba(120,120,128,0.12)"; // nền chip icon đơn sắc

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
function QuickTile({ icon, title, sub, onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="flex flex-col items-start gap-2.5 rounded-[22px] border p-4 text-left active:scale-[0.97] transition-transform disabled:opacity-45"
      style={{ ...CARD, borderColor: SEP }}>
      <IconChip name={icon} />
      <div>
        <div className="text-[13.5px] font-black" style={{ color: LABEL }}>{title}</div>
        <div className="text-[11px] leading-tight" style={{ color: LABEL2 }}>{sub}</div>
      </div>
    </button>
  );
}

export default function HugoVocabApp({ onBack }) {
  const { t } = useTranslation();
  const [view, setView] = useState("loading"); // loading|track|placement|home|review|exit|grammar|essay
  const [deck, setDeck] = useState("hsk1");
  const [mode, setMode] = useState("recognize");
  const [status, setStatus] = useState(null);
  const [progress, setProgress] = useState(null);
  // Trạng thái màn nằm trong URL (?v=&deck=&mode=) để RELOAD vẫn ở đúng chỗ.
  const initial = useRef(new URLSearchParams(typeof window !== "undefined" ? window.location.search : ""));

  const loadHome = useCallback(async () => {
    const st = await api("/vocab/status");
    setStatus(st || null);
    if (st?.needsTrack) { setProgress(null); setView("track"); return; }
    const p = await api("/vocab/progress");
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

  // Ghi màn hiện tại vào URL (giữ nguyên path của portal, chỉ thêm query).
  useEffect(() => {
    if (view === "loading" || typeof window === "undefined") return;
    const p = new URLSearchParams();
    p.set("v", view);
    if (view === "review") { p.set("deck", deck); p.set("mode", mode); }
    window.history.replaceState(null, "", `${window.location.pathname}?${p.toString()}`);
  }, [view, deck, mode]);

  const subtitle = view === "review" ? DECK_LABELS[deck]
    : view === "placement" ? "Kiểm tra xếp lớp"
    : view === "exit" ? "Thi đoán từ"
    : view === "skip" ? "Thi vượt cấp"
    : view === "essay" ? "Thi viết luận"
    : view === "track" ? "Chọn khoá học"
    : view === "grammar" ? "Ngữ pháp trọng điểm"
    : view === "history" ? "Từ đã thuộc"
    : view === "hanviet" ? "Từ gốc Hán-Việt"
    : (status?.trackLabel || "Tiếng Trung theo thẻ");

  return (
    <AppFrame
      appId="vocab"
      title={t("memberApps.vocab.name", "Học Từ Vựng")}
      subtitle={subtitle}
      onBack={["review", "exit", "grammar", "essay", "skip", "history", "hanviet"].includes(view) ? () => { setView("home"); loadHome(); } : onBack}
    >
      {view === "loading" && <div className="mt-10 h-72 animate-pulse rounded-[28px] bg-black/5" />}
      {view === "track" && <TrackPicker tracks={status?.tracks || []} onDone={() => loadHome()} />}
      {view === "grammar" && <Grammar />}
      {view === "placement" && <Quiz type="placement" onFinish={() => loadHome()} />}
      {view === "exit" && <Quiz type="exit" onFinish={() => loadHome()} />}
      {view === "essay" && <Essay onDone={() => { setView("home"); loadHome(); }} />}
      {view === "skip" && <Quiz type="skip" onFinish={() => loadHome()} />}
      {view === "history" && <History />}
      {view === "hanviet" && <HanViet />}
      {view === "home" && (
        <Home progress={progress} status={status} mode={mode}
          onPickMode={setMode} onStart={() => setView("review")}
          onExitTest={() => setView("exit")} onGrammar={() => setView("grammar")} onEssay={() => setView("essay")}
          onSkip={() => setView("skip")} onHistory={() => setView("history")} onHanViet={() => setView("hanviet")} />
      )}
      {view === "review" && <Review deck={deck} mode={mode} onDone={() => { setView("home"); loadHome(); }} />}
    </AppFrame>
  );
}

function Home({ progress, status, mode, onPickMode, onStart, onExitTest, onGrammar, onEssay, onSkip, onHistory, onHanViet }) {
  const cal = calendarLinks(20);
  const ladder = status?.ladder || [];
  const goal = status?.goal || null;
  const activeDeck = status?.activeDeck || "hsk1";
  const activeHasContent = ladder.find((d) => d.deck === activeDeck)?.hasContent ?? true;
  const goalRing = Math.min(100, progress?.dailyGoal ? Math.round(((progress?.reviewsToday || 0) / progress.dailyGoal) * 100) : 0);

  return (
    <div className="space-y-4 pt-2">
      {/* HERO — gradient tươi mới + khối trang trí mềm */}
      <div className="relative overflow-hidden rounded-[32px] p-5 text-white shadow-xl" style={{ background: GRAD }}>
        <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full" style={{ background: "rgba(255,255,255,0.16)" }} />
        <div className="pointer-events-none absolute -bottom-16 -left-8 h-36 w-36 rounded-full" style={{ background: "rgba(255,255,255,0.10)" }} />
        <div className="relative flex items-start justify-between">
          <div>
            <div className="text-[12px] font-bold uppercase tracking-wider text-white/85">Tiến độ tới {DECK_LABELS[progress?.goalDeck] || progress?.goalDeck || ""}</div>
            <div className="mt-1 text-[48px] font-black leading-none tracking-tight">{progress?.goalPercent ?? 0}%</div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className="flex items-center gap-1 rounded-full bg-white/25 px-3 py-1 text-[13px] font-black backdrop-blur-sm">
              <Icon name="local_fire_department" size={16} color="#fff" fill /> {progress?.streak ?? 0}
            </span>
            <span className="text-[11px] font-semibold text-white/85">{status?.trackLabel}</span>
          </div>
        </div>
        <div className="relative mt-4 h-2.5 w-full overflow-hidden rounded-full bg-white/25">
          <div className="h-full rounded-full bg-white transition-all" style={{ width: `${progress?.goalPercent ?? 0}%` }} />
        </div>
        <div className="relative mt-4 grid grid-cols-3 gap-2 text-center">
          {[["Đã học", progress?.learned], ["Đã thuộc", progress?.mastered], ["Cần ôn", progress?.dueNow]].map(([k, v]) => (
            <div key={k} className="rounded-2xl bg-white/20 py-2 backdrop-blur-sm">
              <div className="text-[20px] font-black leading-none">{v ?? 0}</div>
              <div className="mt-1 text-[10.5px] font-bold text-white/85">{k}</div>
            </div>
          ))}
        </div>
      </div>

      {/* HỌC NHANH → mời VƯỢT CẤP ngay */}
      {status?.canSkipLevel && (
        <button onClick={onSkip} className="flex w-full items-center gap-3 rounded-[22px] p-4 text-left shadow-md active:scale-[0.98] transition-transform" style={{ background: GRAD_SOFT, border: `1.5px solid ${ACCENT}` }}>
          <IconChip name="bolt" />
          <div className="flex-1">
            <div className="text-[14px] font-black" style={{ color: LABEL }}>Bạn học rất nhanh!</div>
            <div className="text-[12px]" style={{ color: LABEL2 }}>Thi vượt {DECK_LABELS[status?.activeDeck]} để lên cấp ngay</div>
          </div>
          <Icon name="chevron_right" color={ACCENT} />
        </button>
      )}

      {/* ── KHU: HỌC (hành động chính + chọn cách học) ── */}
      <SectionTitle>Học ngay</SectionTitle>
      {status?.noContentYet ? (
        <div className="rounded-[24px] border p-5 text-center" style={{ ...CARD, borderColor: SEP }}>
          <div className="mx-auto mb-2 grid h-14 w-14 place-items-center rounded-full" style={{ background: GRAD_SOFT }}><Icon name="rocket_launch" size={30} color={ACCENT} fill /></div>
          <div className="text-[15px] font-black" style={{ color: LABEL }}>Bạn đã vượt {DECK_LABELS[status?.testedOutThrough] || "các cấp hiện có"}!</div>
          <p className="mt-1 text-[12.5px]" style={{ color: LABEL2 }}>Nội dung {DECK_LABELS[status?.nextLevel] || "cấp kế tiếp"} sắp ra mắt.</p>
        </div>
      ) : (
        <button onClick={onStart} disabled={!activeHasContent}
          className="flex w-full items-center justify-center gap-2 rounded-[22px] text-[16px] font-black text-white active:scale-[0.98] transition-transform disabled:opacity-50"
          style={{ background: GRAD, paddingTop: 18, paddingBottom: 18, boxShadow: "0 10px 24px rgba(225,29,72,0.35)" }}>
          <Icon name="play_arrow" size={22} color="#fff" fill />
          {activeHasContent ? `Học ${DECK_LABELS[activeDeck] || activeDeck}` : "Chưa có nội dung"}
        </button>
      )}
      <div className="grid grid-cols-3 gap-2">
        {MODES.map((m) => {
          const on = mode === m.id;
          return (
            <button key={m.id} onClick={() => onPickMode(m.id)}
              className="rounded-2xl border p-3 text-center transition-all active:scale-95"
              style={on ? { background: GRAD, borderColor: "transparent" } : { ...CARD, borderColor: SEP }}>
              <Icon name={m.icon} size={22} color={on ? "#fff" : LABEL2} />
              <div className="mt-0.5 text-[12px] font-black" style={{ color: on ? "#fff" : LABEL }}>{m.label}</div>
            </button>
          );
        })}
      </div>
      <p className="-mt-2 text-center text-[11.5px]" style={{ color: LABEL2 }}>{MODES.find((m) => m.id === mode)?.hint}</p>

      {/* ── KHU: TIẾN ĐỘ (mục tiêu 30 ngày + hôm nay) ── */}
      <SectionTitle>Tiến độ</SectionTitle>
      {goal && activeHasContent && (
        <div className="rounded-[24px] border p-4" style={{ ...CARD, borderColor: SEP }}>
          <div className="flex items-center gap-2">
            <Icon name="flag" size={20} />
            <div className="text-[14px] font-black" style={{ color: LABEL }}>Mục tiêu {goal.days} ngày</div>
            <span className="ml-auto rounded-full px-2.5 py-0.5 text-[11px] font-black" style={{ background: CHIP, color: LABEL }}>còn {goal.daysLeft} ngày</span>
          </div>
          <p className="mt-2 text-[12.5px]" style={{ color: LABEL2 }}>
            Hoàn thành <b style={{ color: LABEL }}>{DECK_LABELS[goal.deck]}</b> ({goal.mastered}/{goal.target} từ). Mỗi ngày thuộc <b style={{ color: LABEL }}>{goal.dailyTarget}</b> từ là kịp.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/10">
              <div className="h-full rounded-full transition-all" style={{ width: `${goal.target ? Math.round((goal.mastered / goal.target) * 100) : 0}%`, background: ACCENT }} />
            </div>
            <span className="text-[11px] font-bold" style={{ color: goal.onTrack ? "#16a34a" : "#d97706" }}>{goal.onTrack ? "Đúng nhịp" : "Cố hơn"}</span>
          </div>
        </div>
      )}
      <div className="flex items-center gap-3 rounded-2xl border p-4" style={{ ...CARD, borderColor: SEP }}>
        <IconChip name={progress?.goalMet ? "task_alt" : "bolt"} />
        <div className="flex-1">
          <div className="text-[13.5px] font-black" style={{ color: LABEL }}>
            {progress?.goalMet ? "Đã đạt mục tiêu hôm nay" : `Hôm nay: ${progress?.reviewsToday ?? 0}/${progress?.dailyGoal ?? 20} lượt ôn`}
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-black/10">
            <div className="h-full rounded-full transition-all" style={{ width: `${goalRing}%`, background: progress?.goalMet ? "#16a34a" : ACCENT }} />
          </div>
        </div>
      </div>

      {/* ── KHU: THAO TÁC NHANH (lưới gọn) ── */}
      <SectionTitle>Khám phá & luyện thêm</SectionTitle>
      <div className="grid grid-cols-2 gap-2">
        <QuickTile icon="quiz" title="Thi đoán từ" sub={status?.eligibleForExit ? "Sẵn sàng thi" : "Cần học thêm"} onClick={onExitTest} disabled={!status?.eligibleForExit} />
        <QuickTile icon="edit_note" title="Thi viết luận" sub="AI chấm bản xứ" onClick={onEssay} />
        <QuickTile icon="compare_arrows" title="Từ giống tiếng Việt" sub="Âm Hán-Việt: 国家 → quốc gia" onClick={onHanViet} />
        <QuickTile icon="menu_book" title="Ngữ pháp" sub={`${GRAMMAR_LESSONS.length} điểm khác tiếng Việt`} onClick={onGrammar} />
        <QuickTile icon="history" title="Từ đã thuộc" sub={`${progress?.mastered ?? 0} từ đã nắm chắc`} onClick={onHistory} />
      </div>

      {status?.completed && (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <Icon name="workspace_premium" color="#16a34a" fill />
          <span className="text-[14px] font-black text-emerald-600">Đã hoàn tất khoá!</span>
        </div>
      )}

      {/* Lộ trình */}
      <div>
        <SectionTitle>Lộ trình</SectionTitle>
        <div className="space-y-2">
          {ladder.length === 0 && <div className="h-14 animate-pulse rounded-2xl bg-black/5" />}
          {ladder.map((d) => {
            const isActive = d.deck === activeDeck && !d.passed;
            return (
              <div key={d.deck} className="flex items-center gap-3 rounded-2xl border px-4 py-3"
                style={{ ...CARD, ...(isActive ? { borderColor: "transparent", boxShadow: `0 0 0 2px ${ACCENT}` } : { borderColor: SEP }), opacity: d.hasContent || d.passed ? 1 : 0.55 }}>
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[13px] font-black"
                  style={{ background: CHIP, color: LABEL }}>
                  {d.passed ? <Icon name="check" size={18} /> : (DECK_LABELS[d.deck] || d.deck).replace(/\D/g, "")}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-[14px] font-black" style={{ color: LABEL }}>
                    {DECK_LABELS[d.deck] || d.deck}
                    {isActive && <span className="rounded-full px-2 py-0.5 text-[9.5px] font-black text-white" style={{ background: ACCENT }}>ĐANG HỌC</span>}
                    {!d.hasContent && !d.passed && <Icon name="lock" size={15} color="#c4c4c6" />}
                  </div>
                  <div className="text-[11.5px]" style={{ color: LABEL2 }}>
                    {d.passed ? "Đã đạt (test xếp lớp)" : d.hasContent ? `${d.mastered}/${d.total} đã thuộc · chuẩn ${d.target} từ` : `Sắp ra mắt · chuẩn ${d.target} từ`}
                  </div>
                </div>
                <span className="text-[13px] font-black" style={{ color: d.passed ? "#16a34a" : LABEL2 }}>{d.percent ?? 0}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Nhắc lịch */}
      <div className="rounded-2xl border p-4" style={{ ...CARD, borderColor: SEP }}>
        <div className="flex items-center gap-2"><Icon name="alarm" size={18} /><span className="text-[13px] font-black" style={{ color: LABEL }}>Nhắc ôn vào lịch</span></div>
        <div className="mt-3 flex gap-2">
          <a href={cal.icsUrl} download="hugo-vocab.ics" className="flex-1 rounded-xl border py-2.5 text-center text-[12.5px] font-bold" style={{ borderColor: SEP, color: LABEL }}>Thêm vào lịch</a>
          <a href={cal.gcal} target="_blank" rel="noreferrer" className="flex-1 rounded-xl border py-2.5 text-center text-[12.5px] font-bold" style={{ borderColor: SEP, color: LABEL }}>Google Calendar</a>
        </div>
      </div>
    </div>
  );
}

const rand = (arr) => arr.map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(([, v]) => v);

// Ôn tập = TRÒ CHƠI trắc nghiệm (đoán nghĩa / đoán từ / nghe chọn), tự chấm.
// Từ MỚI: học nhanh rồi chọn "Đã thuộc" (vào lịch sử) hoặc "Học tiếp".
function Review({ deck, mode = "recognize", onDone }) {
  const [queue, setQueue] = useState(null);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null); // đáp án đã chọn (game)
  const [done, setDone] = useState(0);

  useEffect(() => {
    let alive = true;
    api(`/vocab/due?deck=${deck}`).then((d) => { if (alive) { setQueue(d.queue || []); setIdx(0); setPicked(null); } });
    return () => { alive = false; };
  }, [deck]);

  const card = queue && idx < queue.length ? queue[idx] : null;
  // Loại game theo chế độ: nhận diện=đoán nghĩa, nhớ ngược=đoán từ, nghe=nghe chọn.
  const game = mode === "produce" ? "word" : mode === "listen" ? "listen" : "meaning";
  useEffect(() => { if (card && card.kind !== "new" && game === "listen") speak(card.hanzi); }, [card, game]);

  const post = (cardId, g) => api("/vocab/review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cardId, grade: g }) }).catch(() => {});
  const advance = () => { setPicked(null); setDone((n) => n + 1); setIdx((i) => i + 1); };
  const learn = (g) => { post(card._id, g); advance(); };
  const answer = (opt, correct) => {
    if (picked) return;
    setPicked({ opt, right: opt === correct });
    post(card._id, opt === correct ? 2 : 0);
    setTimeout(advance, opt === correct ? 750 : 1600);
  };

  if (queue === null) return <div className="mt-10 h-72 animate-pulse rounded-[28px] bg-black/5" />;
  if (queue.length === 0) return <Finish icon="local_fire_department" title="Tuyệt vời!" body="Bạn đã học hết phần khả dụng. Lên cấp hoặc quay lại sau nhé." onDone={onDone} />;
  if (idx >= queue.length) return <Finish icon="local_fire_department" title={`Xong ${done} từ!`} body="Học tiếp nữa không? Bấm về trang chủ rồi vào lại là có mẻ mới." onDone={onDone} />;

  const progress = (
    <>
      <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-black/10">
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.round((idx / queue.length) * 100)}%`, background: ACCENT }} />
      </div>
      <div className="mb-3 text-[12px] font-bold" style={{ color: LABEL2 }}>
        {idx + 1} / {queue.length} · {card.kind === "new" ? "Từ mới" : card.kind === "ahead" ? "Ôn sớm" : "Ôn lại"}
      </div>
    </>
  );

  // ── TỪ MỚI: học nhanh rồi chọn đã thuộc / học tiếp ──
  if (card.kind === "new") {
    return (
      <div className="flex flex-col items-center pt-2">
        {progress}
        <div className="flex min-h-[280px] w-full flex-col items-center justify-center rounded-[32px] border p-6 text-center shadow-sm" style={{ ...CARD, borderColor: SEP }}>
          <div className="flex items-center gap-2">
            <div className="text-[72px] font-black leading-none" style={{ color: LABEL }} lang="zh">{card.hanzi}</div>
            <span onClick={() => speak(card.hanzi)}><Icon name="volume_up" /></span>
          </div>
          <PinyinText text={card.pinyin} className="mt-2 text-[20px] font-black" />
          <div className="mt-1 text-[16px] font-semibold" style={{ color: LABEL }}>{card.meaning}</div>
          <HanVietChip text={card.hanViet} />
          {card.example && (
            <div className="mt-3 border-t pt-3 text-[13px]" style={{ borderColor: SEP, color: LABEL2 }}>
              <div className="text-[15px] font-bold" style={{ color: LABEL }} lang="zh">{card.example}</div>
              {card.examplePinyin && <PinyinText text={card.examplePinyin} className="block text-[12.5px] font-semibold" />}
              {card.exampleMeaning && <div>{card.exampleMeaning}</div>}
            </div>
          )}
        </div>
        <div className="mt-4 grid w-full grid-cols-2 gap-2">
          <button onClick={() => learn(3)} className="rounded-2xl border py-3.5 text-[14px] font-black active:scale-95 transition-transform" style={{ borderColor: SEP, color: LABEL, ...CARD }}>Đã thuộc luôn</button>
          <button onClick={() => learn(2)} className="rounded-2xl py-3.5 text-[14px] font-black text-white active:scale-95 transition-transform" style={{ background: ACCENT }}>Học từ này</button>
        </div>
      </div>
    );
  }

  // ── ÔN LẠI = TRÒ CHƠI TRẮC NGHIỆM ──
  const pool = queue.filter((c) => c._id !== card._id);
  const key = game === "word" ? "hanzi" : "meaning";
  const correct = card[key];
  const distractors = rand([...new Set(pool.map((c) => c[key]).filter((v) => v && v !== correct))]).slice(0, 3);
  const options = rand([correct, ...distractors]);
  const prompt = game === "word"
    ? <div className="px-4 text-[24px] font-black" style={{ color: LABEL }}>{card.meaning}</div>
    : game === "listen"
      ? <button onClick={() => speak(card.hanzi)} className="grid h-24 w-24 place-items-center rounded-full" style={{ background: CHIP }}><Icon name="volume_up" size={44} /></button>
      : (<><div className="text-[64px] font-black leading-none" style={{ color: LABEL }} lang="zh">{card.hanzi}</div><PinyinText text={card.pinyin} className="mt-2 block text-[18px] font-black" /></>);
  const question = game === "word" ? "Chọn chữ Hán đúng" : "Chọn nghĩa đúng";

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
          <div className="text-[13px]" style={{ color: LABEL2 }}>{card.meaning}</div>
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
      <button onClick={onDone} className="mt-6 w-full rounded-2xl py-3.5 text-[15px] font-black text-white" style={{ background: GRAD }}>Về trang chủ</button>
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

  const choose = async (choice) => {
    if (locked) return;
    const q = questions[i];
    const next = [...answers, { cardId: q.cardId, choice }];
    setAnswers(next);
    if (i + 1 < questions.length) { setI(i + 1); return; }
    setLocked(true);
    setResult(await api("/vocab/test/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, answers: next }) }));
  };

  if (error) return <Finish icon="lock" title="Chưa mở được bài thi" body={error} onDone={onFinish} />;
  if (questions === null) return <div className="mt-10 h-72 animate-pulse rounded-[28px] bg-black/5" />;

  if (result) {
    const ok = type === "placement" ? true : result.passed;
    return (
      <div className="mt-8 rounded-[28px] border p-8 text-center shadow-sm" style={{ ...CARD, borderColor: SEP }}>
        <div className="text-[52px] font-black leading-none" style={{ color: ok ? ACCENT : "#ef4444" }}>{result.score}%</div>
        <div className="mt-3 text-[16px] font-black" style={{ color: LABEL }}>
          {type === "placement"
            ? (result.testedOutThrough ? `Đã vượt ${DECK_LABELS[result.testedOutThrough]} → vào ${DECK_LABELS[result.startDeck] || "cấp kế"}` : `Bắt đầu từ ${DECK_LABELS[result.startDeck] || "cấp 1"}`)
            : type === "skip"
              ? (result.passed ? `Vượt cấp thành công! ${DECK_LABELS[result.deck] || ""} đã đạt` : `Chưa đủ để vượt (cần ${result.passMark}%)`)
              : result.passed ? "Đạt! Hoàn tất chặng" : `Chưa đạt (cần ${result.passMark}%)`}
        </div>
        <p className="mt-2 text-[13px]" style={{ color: LABEL2 }}>
          {type === "placement" ? (result.testedOutThrough ? "Cấp đã vượt tính 100% — không học lại." : "Bắt đầu từ nền tảng cho chắc gốc.")
            : type === "skip" ? (result.passed ? "Bạn đã lên cấp kế tiếp — tiếp tục chinh phục!" : "Cứ học thêm chút nữa rồi vượt sau nhé.")
            : result.passed ? "Chúc mừng!" : "Ôn thêm rồi thi lại nhé."}
        </p>
        <button onClick={onFinish} className="mt-6 w-full rounded-2xl py-3.5 text-[15px] font-black text-white" style={{ background: GRAD }}>{type === "placement" || (type === "skip" && result.passed) ? "Tiếp tục học" : "Về trang chủ"}</button>
      </div>
    );
  }

  const q = questions[i];
  return (
    <div className="flex flex-col items-center pt-2">
      <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-black/10"><div className="h-full rounded-full transition-all" style={{ width: `${Math.round((i / questions.length) * 100)}%`, background: ACCENT }} /></div>
      <div className="mb-1 text-[12px] font-bold" style={{ color: LABEL2 }}>Câu {i + 1} / {questions.length}</div>
      {type === "placement" && i === 0 && <p className="mb-3 text-center text-[12.5px]" style={{ color: LABEL2 }}>Làm bài này để hệ thống xếp bạn vào đúng trình độ.</p>}
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

  const submit = async () => {
    setState("grading"); setMsg("");
    const r = await api("/vocab/essay/grade", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic: prompt?.topic, text }) });
    if (r?.error) { setMsg(r.error); setState("error"); return; }
    setFeedback(r.feedback); setState("result");
  };

  if (state === "result" && feedback) {
    return (
      <div className="space-y-4 pt-2">
        <div className="rounded-[28px] border p-6 text-center shadow-sm" style={{ ...CARD, borderColor: SEP }}>
          <div className="text-[52px] font-black leading-none" style={{ color: ACCENT }}>{feedback.score ?? "?"}<span className="text-[20px]">/100</span></div>
          {feedback.level && <div className="mt-1 text-[13px] font-bold" style={{ color: LABEL2 }}>Trình độ ước lượng: {feedback.level}</div>}
          {feedback.comment && <p className="mt-3 text-[13.5px]" style={{ color: LABEL }}>{feedback.comment}</p>}
        </div>
        {Array.isArray(feedback.errors) && feedback.errors.length > 0 && (
          <div className="rounded-2xl border p-4" style={{ ...CARD, borderColor: SEP }}>
            <div className="mb-2 flex items-center gap-2"><Icon name="error" size={18} /><span className="text-[13px] font-black" style={{ color: LABEL }}>Lỗi trong bài</span></div>
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
            <div className="mb-2 flex items-center gap-2"><Icon name="tips_and_updates" size={18} /><span className="text-[13px] font-black" style={{ color: LABEL }}>Gợi ý tự nhiên hơn</span></div>
            <ul className="space-y-1 text-[13px]" style={{ color: LABEL }}>{feedback.suggestions.map((s, k) => <li key={k}>• {s}</li>)}</ul>
          </div>
        )}
        {feedback.nativeVersion && (
          <div className="rounded-2xl border p-4" style={{ ...CARD, borderColor: SEP }}>
            <div className="mb-2 flex items-center gap-2"><Icon name="auto_awesome" size={18} /><span className="text-[13px] font-black" style={{ color: LABEL }}>Bản viết lại bản xứ</span>
              <span className="ml-auto" onClick={() => speak(feedback.nativeVersion)}><Icon name="volume_up" size={18} /></span></div>
            <div className="text-[15px] leading-7" style={{ color: LABEL }} lang="zh">{feedback.nativeVersion}</div>
          </div>
        )}
        <button onClick={onDone} className="w-full rounded-2xl py-3.5 text-[15px] font-black text-white" style={{ background: GRAD }}>Xong</button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-2">
      <div className="rounded-2xl border p-4" style={{ ...CARD, borderColor: SEP }}>
        <div className="flex items-center gap-2"><Icon name="assignment" size={18} /><span className="text-[13px] font-black" style={{ color: LABEL }}>Đề bài</span></div>
        <div className="mt-2 text-[18px] font-bold" style={{ color: LABEL }} lang="zh">{prompt?.topic || "…"}</div>
      </div>

      {prompt?.willCharge && (
        <div className="flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3">
          <Icon name="paid" size={18} color="#d97706" />
          <span className="text-[12.5px] font-semibold" style={{ color: LABEL }}>Lần thi lại này tốn <b>{prompt.cost} JOY</b> (quy đổi theo đơn vị của bạn).</span>
        </div>
      )}

      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={7}
        placeholder="请用中文写…" lang="zh"
        className="w-full rounded-2xl border p-4 text-[16px] leading-7 outline-none"
        style={{ ...CARD, borderColor: SEP, color: LABEL }} />
      <div className="-mt-2 flex justify-between text-[11.5px]" style={{ color: hanzi >= 20 ? "#16a34a" : LABEL2 }}>
        <span>Viết 100% tiếng Trung</span><span>{hanzi} chữ Hán {hanzi < 20 ? "(cần ≥ 20)" : "✓"}</span>
      </div>

      {msg && <p className="text-[12.5px] font-semibold text-rose-500">{msg}</p>}
      <button onClick={submit} disabled={hanzi < 20 || state === "grading"} className="w-full rounded-2xl py-3.5 text-[15px] font-black text-white disabled:opacity-50" style={{ background: ACCENT }}>
        {state === "grading" ? "AI đang chấm…" : "Nộp bài · AI chấm"}
      </button>
    </div>
  );
}

function TrackPicker({ tracks, onDone }) {
  const [busy, setBusy] = useState("");
  const meta = {
    simplified: { title: "Giản thể", sub: "HSK · 简体字", desc: "Chữ giản thể, thi HSK (Trung Quốc đại lục). Phổ biến nhất.", zh: "汉" },
    traditional: { title: "Phồn thể", sub: "TOCFL · 繁體字", desc: "Chữ phồn thể, thi TOCFL (Đài Loan).", zh: "漢" },
  };
  const pick = async (id) => { setBusy(id); await api("/vocab/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ track: id }) }).catch(() => {}); onDone(); };
  const list = tracks.length ? tracks : [{ id: "simplified" }, { id: "traditional" }];
  return (
    <div className="space-y-4 pt-8">
      <div className="text-center">
        <div className="text-[22px] font-black" style={{ color: LABEL }}>Chọn khoá học</div>
        <p className="mt-1 text-[13px]" style={{ color: LABEL2 }}>Bạn muốn học hệ chữ nào?</p>
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
        <button onClick={() => setOpen(null)} className="flex items-center text-[13px] font-bold" style={{ color: ACCENT }}><Icon name="chevron_left" size={18} color={ACCENT} /> Danh sách</button>
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
function History() {
  const [data, setData] = useState(null);
  useEffect(() => { api("/vocab/history").then((d) => setData(d?.error ? { items: [], total: 0 } : d)); }, []);
  if (!data) return <div className="mt-10 h-72 animate-pulse rounded-[28px] bg-black/5" />;
  if (!data.items.length) return <Finish icon="history" title="Chưa có từ nào" body="Từ bạn đánh giá 'Dễ' hoặc đã thuộc sẽ được lưu ở đây, không phải học lại." onDone={() => {}} />;
  return (
    <div className="space-y-2 pt-2">
      <p className="text-[12.5px]" style={{ color: LABEL2 }}>{data.total} từ đã thuộc — không cần học lại.</p>
      {data.items.map((c, i) => (
        <div key={i} className="flex items-center gap-3 rounded-2xl border p-3" style={{ ...CARD, borderColor: SEP }}>
          <div className="text-[24px] font-black" style={{ color: LABEL }} lang="zh">{c.hanzi}</div>
          <div className="min-w-0 flex-1">
            <PinyinText text={c.pinyin} className="block text-[13px] font-bold" />
            <div className="truncate text-[13px]" style={{ color: LABEL2 }}>{c.meaning}</div>
            <HanVietChip text={c.hanViet} />
          </div>
          <span onClick={() => speak(c.hanzi)}><Icon name="volume_up" size={20} /></span>
        </div>
      ))}
    </div>
  );
}

// ── Từ giống tiếng Việt (âm Hán-Việt) ───────────────────────────────────────
function HanViet() {
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
            <div className="truncate text-[12.5px]" style={{ color: LABEL2 }}>{c.meaning}</div>
          </div>
          <span onClick={() => speak(c.hanzi)}><Icon name="volume_up" size={20} /></span>
        </div>
      ))}
    </div>
  );
}
