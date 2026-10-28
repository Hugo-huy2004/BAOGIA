import { lazy, Suspense, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { ProgressBar, Segmented, Button, Sheet } from "../demos/iosKit";
import AppFrame from "./os/AppFrame";
import LazyBoundary from "./os/LazyBoundary";
import { notify } from "../../lib/notify";
import { getMemberSession } from "../../services/api/core/authSession";
import { API_BASE } from "../../config/apiBase";
import { localeForLanguage, languageCode } from "../../i18n/languages";
import { canTranslate, guessLanguage, translateText } from "../../lib/textTranslator";
import { useJoyStore } from "../../stores/joyStore";
import "../../styles/hugoTeam.css";
import { CODER_TOTAL_STEPS, HUGOTEAM_CODING_DAYS, completedCoderSteps } from "../../../shared/coderProgression";

const HugoCoderHub = lazy(() => import("./hugoCoder/HugoCoderHub"));

// Sáu lợi ích của thành viên HugoTeam. Chỉ giữ icon + khoá dịch: chữ nằm ở
// memberPortal.team.benefit* nên đổi ngôn ngữ là đổi theo, không phải sửa code.
const BENEFITS = [
  { icon: "school", key: "benefit1" },
  { icon: "co_present", key: "benefit2" },
  { icon: "work_history", key: "benefit3" },
  { icon: "workspace_premium", key: "benefit4" },
  { icon: "schedule", key: "benefit5" },
  { icon: "diversity_3", key: "benefit6" },
];

const fetchHugoTeamRead = async (url) => {
  let response;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    response = await fetch(url);
    if (![502, 503, 504].includes(response.status) || attempt === 2) return response;
    await new Promise((resolve) => window.setTimeout(resolve, 500 * (attempt + 1)));
  }
  return response;
};

/**
 * Quy chế làm việc của HugoTeam. Nội dung nằm trong i18n (memberPortal.team.rules)
 * nên nó theo ngôn ngữ đang chọn như mọi phần khác, và mỗi điều đều bám đúng cơ
 * chế hệ thống đang chạy — bốn trạng thái task, luật ghi giờ, mốc 500 giờ.
 */
function TeamRulesSheet({ open, onClose }) {
  const { t } = useTranslation();
  const sections = t("memberPortal.team.rules.sections", { returnObjects: true });

  return (
    <Sheet open={open} onClose={onClose} title={t("memberPortal.team.rules.title")}>
      <p className="pb-1 text-[13px] leading-relaxed" style={{ color: "var(--ios-label-2)" }}>
        {t("memberPortal.team.rules.intro")}
      </p>
      <div className="space-y-5 pt-3">
        {(Array.isArray(sections) ? sections : []).map((section) => (
          <section key={section.title}>
            <h3 className="text-[15px] font-semibold tracking-[-0.01em]">{section.title}</h3>
            <ul className="mt-2 space-y-2">
              {section.items.map((item, index) => (
                <li key={index} className="flex gap-2.5 text-[14px] leading-relaxed" style={{ color: "var(--ios-label-2)" }}>
                  <span className="mt-[0.55em] size-[3px] shrink-0 rounded-full" style={{ background: "var(--ios-label-2)" }} aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Sheet>
  );
}

/** Vỏ app: NavBar cố định + vùng cuộn riêng. Lối ra duy nhất là nút back trên
 *  NavBar — tab-bar của portal đã ẩn khi Hugo Team mở (MemberUtilitiesTab). */
/**
 * Vỏ của Hugo Team.
 *
 * Trước đây file này TỰ DỰNG lại đúng những gì `AppFrame` làm: một `IosApp`, bảng
 * `--ios-*` trỏ về token portal, `NavBar` tiêu đề lớn, `Scroll`, cộng `mr-11`
 * đoán tay để né nút X, và một MutationObserver riêng để dò dark mode. Nay chỉ
 * còn khai báo phần KHÁC BIỆT của app này.
 *
 * `paletteVars` giữ nguyên chủ ý cũ: trang tuyển dụng bên trong viết bằng token
 * portal (`bg-card`, `text-foreground`), nên vỏ phải cùng hệ màu đó chứ không
 * lấy tint riêng như các app khác.
 */
function TeamShell({ onBack, children }) {
  const { t } = useTranslation();
  const [rulesOpen, setRulesOpen] = useState(false);

  return (
    <AppFrame
      appId="team"
      title="HugoTeam"
      contentMaxWidth="1180px"
      onBack={onBack}
      paletteVars={{
        "--ios-bg": "hsl(var(--background))",
        "--ios-elevated": "hsl(var(--card))",
        "--ios-surface": "hsl(var(--card))",
        "--ios-surface-2": "hsl(var(--muted))",
        "--ios-label": "hsl(var(--foreground))",
        "--ios-label-2": "hsl(var(--muted-foreground))",
        "--ios-sep": "hsl(var(--border))",
        "--ios-fill": "hsl(var(--muted))",
        "--ios-fill-2": "hsl(var(--muted))",
        "--ios-chrome": "hsl(var(--background) / .82)",
      }}
      actions={(
        <button
          type="button"
          onClick={() => setRulesOpen(true)}
          aria-label={t("memberPortal.team.rules.title")}
          title={t("memberPortal.team.rules.title")}
          className="grid h-11 w-11 place-items-center rounded-full text-[17px] font-bold"
          style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))" }}
        >
          !
        </button>
      )}
    >
      <div className="hugo-team">
        <LazyBoundary resetKey="hugoteam" onBack={onBack}>{children}</LazyBoundary>
      </div>
      <TeamRulesSheet open={rulesOpen} onClose={() => setRulesOpen(false)} />
    </AppFrame>
  );
}

function AssessmentExam({ active, onFinish }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [seconds, setSeconds] = useState(active.questions[0].timeLimit || 10);
  const [locked, setLocked] = useState(false);
  const question = active.questions[index];

  const finish = (nextAnswers = answers, violationReason = "") => {
    if (locked) return;
    setLocked(true);
    onFinish(nextAnswers, violationReason);
  };
  const advance = (nextAnswers) => {
    if (index >= active.questions.length - 1) finish(nextAnswers);
    else { setIndex((value) => value + 1); setSeconds(active.questions[index + 1].timeLimit || 10); }
  };
  useEffect(() => {
    const onVisibility = () => { if (document.hidden) finish(answers, "tab_switch"); };
    const onContext = (event) => event.preventDefault();
    const onKeyDown = (event) => { if ((event.ctrlKey || event.metaKey) && ["c", "u", "s", "p"].includes(event.key.toLowerCase())) event.preventDefault(); if (event.key === "F12" || (event.ctrlKey && event.shiftKey && ["i", "j"].includes(event.key.toLowerCase()))) event.preventDefault(); };
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("contextmenu", onContext);
    document.addEventListener("keydown", onKeyDown);
    document.body.classList.add("overflow-hidden");
    document.documentElement.requestFullscreen?.().catch(() => {});
    return () => { document.removeEventListener("visibilitychange", onVisibility); document.removeEventListener("contextmenu", onContext); document.removeEventListener("keydown", onKeyDown); document.body.classList.remove("overflow-hidden"); if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {}); };
  }, [answers]);
  useEffect(() => {
    const timeLimit = question.timeLimit || 10;
    const timer = window.setInterval(() => setSeconds((value) => {
      if (value <= 1) { const next = { ...answers, [question.id]: Number.isInteger(answers[question.id]) ? answers[question.id] : -1 }; window.clearInterval(timer); advance(next); return timeLimit; }
      return value - 1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [index, question.id, answers]);
  const choose = (optionIndex) => { const next = { ...answers, [question.id]: optionIndex }; setAnswers(next); window.setTimeout(() => advance(next), 180); };
  const progress = ((index + 1) / active.questions.length) * 100;
  const dimensionLabel = question.dimension === "logic"
    ? "Logic / IQ · 25 giây"
    : question.dimension === "creativity"
      ? "Tư duy sáng tạo · 10 giây"
      : "EQ · 10 giây";

  return createPortal(
    <div className="ht-exam fixed inset-0 z-[2147483000] h-[100dvh] w-screen overflow-y-auto text-white">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-5xl flex-col px-5 py-5 sm:px-10 sm:py-8">
        <header className="flex items-start justify-between gap-5 border-b border-white/10 pb-5">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#c8f45b]">HugoTeam Assessment</p>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/60">Không rời tab hoặc sao chép. Đáp án được chấm và xác thực tại máy chủ.</p>
          </div>
          <div aria-label={`Còn ${seconds} giây`} className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl border text-xl font-black ${seconds <= 3 ? "animate-pulse border-rose-400 bg-rose-500" : "border-white/15 bg-white/[.07]"}`}>{seconds}s</div>
        </header>

        <div className="mt-6 flex items-center justify-between text-sm font-semibold text-white/60">
          <span>Câu {index + 1} / {active.questions.length}</span>
          <span>{Math.round(progress)}% hoàn tất</span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-[#24c7d9] transition-all" style={{ width: `${progress}%` }} />
        </div>

        <main className="my-auto py-10 sm:py-14">
          <p className="mb-5 inline-flex rounded-lg bg-white/[.08] px-3 py-2 text-sm font-black uppercase tracking-wider text-cyan-200">{dimensionLabel}</p>
          <h1 className="max-w-4xl text-3xl font-black leading-[1.08] tracking-[-0.035em] sm:text-5xl">{question.text}</h1>
          <div className="mt-8 grid gap-3 sm:mt-10">
            {question.options.map((option, optionIndex) => (
              <button type="button" key={option} onClick={() => choose(optionIndex)} className="group flex min-h-16 items-center gap-4 rounded-2xl border border-white/10 bg-white/[.055] p-4 text-left text-base transition hover:-translate-y-0.5 hover:border-[#24c7d9] hover:bg-[#24c7d9]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8f45b] sm:p-5 sm:text-lg">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-sm font-black text-white/70 group-hover:bg-[#c8f45b] group-hover:text-[#071525]">{String.fromCharCode(65 + optionIndex)}</span>
                <span>{option}</span>
              </button>
            ))}
          </div>
        </main>

        <footer className="flex flex-col gap-1 border-t border-white/10 pt-4 text-sm text-white/45 sm:flex-row sm:justify-between">
          <span>Rời trang sẽ kết thúc lượt làm bài.</span>
          <span>Logic 25 giây · Sáng tạo và EQ 10 giây.</span>
        </footer>
      </div>
    </div>,
    document.body,
  );
}

function AssessmentPanel({ userStatus, onPassed }) {
  const { t } = useTranslation();
  const joyBalance = useJoyStore((store) => store.balance);
  const walletLoaded = useJoyStore((store) => store.loaded);
  const fetchBalance = useJoyStore((store) => store.fetchBalance);
  const [state, setState] = useState(null);
  const [answers, setAnswers] = useState({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [examOpen, setExamOpen] = useState(false);

  const load = async () => {
    try {
      const session = await getMemberSession();
      if (session?.email) await fetchBalance(session.email);
      const res = await fetchHugoTeamRead(`${API_BASE}/hugoteam/assessment/status`);
      if (res.ok) {
        const data = await res.json();
        setState(data);
        if (data.active) setExamOpen(true);
      }
    } catch (error) { console.error("Failed to load assessment:", error); }
  };
  useEffect(() => { load(); }, []);

  const start = async () => {
    setBusy(true);
    try {
      const session = await getMemberSession();
      if (session?.email) {
        await fetchBalance(session.email, undefined, { force: true });
        const currentBalance = useJoyStore.getState().balance;
        if (currentBalance < 250) {
          notify.error(`Bạn cần 250 JOY để bắt đầu bài đánh giá (hiện có ${currentBalance} JOY).`);
          return;
        }
      }
      const res = await fetch(`${API_BASE}/hugoteam/assessment/start`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: session?.displayName || session?.name || "" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể bắt đầu bài đánh giá");
      setState((current) => ({ ...(current || {}), active: data }));
      setAnswers({}); setResult(null); setExamOpen(true);
    } catch (error) { notify.error(error.message); } finally { setBusy(false); }
  };
  const submitExam = async (examAnswers, violationReason = "") => {
    if (!state?.active) return;
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/hugoteam/assessment/submit`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId: state.active.attemptId || state.active.id, answers: examAnswers, violationReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể chấm bài");
      setResult(data); setState((current) => ({ ...(current || {}), active: null, latest: data })); setExamOpen(false);
      if (data.passed || data.scores?.passed) await onPassed?.();
    } catch (error) { notify.error(error.message); } finally { setBusy(false); }
  };

  const active = state?.active;
  const latest = result || state?.latest;
  const latestPassed = latest?.passed ?? latest?.scores?.passed ?? false;
  return (
    <div className="ht-assessment">
      <div className="ht-assessment-head">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-black tracking-tight">Đánh giá năng lực</h2>
          <span className="rounded-lg bg-[#c8f45b] px-3 py-2 text-sm font-black text-[#071525]">250 JOY</span>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/65">18 câu hỏi sinh mới mỗi lượt, đo Logic/IQ, tư duy sáng tạo và EQ. Đây là chỉ số sàng lọc nội bộ, không phải chẩn đoán lâm sàng.</p>
      </div>
      <div className="ht-assessment-body space-y-5">
      <div className="grid grid-cols-3 gap-2 text-center text-sm"><div className="rounded-xl bg-muted/60 p-3"><b className="block text-xl text-foreground">6</b>Logic</div><div className="rounded-xl bg-muted/60 p-3"><b className="block text-xl text-foreground">6</b>Sáng tạo</div><div className="rounded-xl bg-muted/60 p-3"><b className="block text-xl text-foreground">6</b>EQ</div></div>
      <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4"><p className="text-sm font-bold uppercase tracking-widest text-primary">Ngưỡng cần đạt</p><div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4"><span className="rounded-xl bg-card px-3 py-2 text-center"><b className="block text-foreground">≥70%</b><small className="text-muted-foreground">Logic</small></span><span className="rounded-xl bg-card px-3 py-2 text-center"><b className="block text-foreground">≥65%</b><small className="text-muted-foreground">Sáng tạo</small></span><span className="rounded-xl bg-card px-3 py-2 text-center"><b className="block text-foreground">≥65%</b><small className="text-muted-foreground">EQ</small></span><span className="rounded-xl bg-card px-3 py-2 text-center"><b className="block text-foreground">≥68%</b><small className="text-muted-foreground">Tổng</small></span></div></div>
      {active && examOpen ? <AssessmentExam active={active} onFinish={submitExam} /> : active ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Bạn đang có một lượt làm bài chưa hoàn tất.</p><button type="button" onClick={() => setExamOpen(true)} className="w-full rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">Tiếp tục bài test</button>
        </div>
      ) : latest ? (
        <div className="space-y-5"><div className={`rounded-2xl p-5 ${latestPassed ? "bg-emerald-500/10" : "bg-amber-500/10"}`}><p className="text-lg font-bold leading-snug text-foreground">{latest.securityViolation ? "Lượt test đã bị kết thúc vì rời tab" : latestPassed ? "Bạn đã vượt qua vòng đánh giá" : "Bạn chưa đạt ngưỡng vòng này"}</p><p className="mt-2 text-sm leading-7 text-muted-foreground">{latest.advice?.next || (latestPassed ? (state?.codingComplete ? "Coding đã hoàn tất. Hồ sơ đang chờ chuyển sang Mentor 30 ngày." : "Bước bắt buộc tiếp theo: hoàn tất Coding để vào giai đoạn Mentor 30 ngày.") : "Bạn có thể luyện tập và dùng lượt còn lại để thử lại.")}</p></div><div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">{[["Logic", latest.scores.logic], ["Sáng tạo", latest.scores.creativity], ["EQ", latest.scores.eq], ["Tổng", latest.scores.overall]].map(([label, value]) => <div key={label} className="rounded-2xl border border-border/50 bg-muted/50 p-4"><b className="block text-2xl text-foreground">{value}%</b><span className="mt-1 block text-sm text-muted-foreground">{label}</span></div>)}</div>{latest.advice && <div className="grid grid-cols-1 gap-3 text-sm leading-7 text-muted-foreground sm:grid-cols-3"><p className="rounded-2xl border border-border/50 bg-muted/50 p-4"><b className="mb-1 block text-base text-foreground">Logic</b>{latest.advice.logic}</p><p className="rounded-2xl border border-border/50 bg-muted/50 p-4"><b className="mb-1 block text-base text-foreground">Sáng tạo</b>{latest.advice.creativity}</p><p className="rounded-2xl border border-border/50 bg-muted/50 p-4"><b className="mb-1 block text-base text-foreground">EQ</b>{latest.advice.eq}</p></div>}{!latestPassed && !latest.securityViolation && (state?.attemptsRemaining || 0) > 0 && <button type="button" onClick={start} disabled={busy} className="w-full rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">Thi lại · còn {state.attemptsRemaining} lượt</button>}</div>
      ) : (
        <div className="space-y-4"><ul className="space-y-2 text-sm text-muted-foreground"><li>• Mỗi thành viên tối đa 3 lượt.</li><li>• Logic/tính toán có 25 giây; Sáng tạo và EQ có 10 giây.</li><li>• Rời tab hoặc chuyển cửa sổ sẽ kết thúc lượt.</li><li>• Đạt bài test chưa là thành viên chính thức; cần hoàn tất Coding và Mentor.</li></ul>{walletLoaded && <p className={`rounded-2xl px-4 py-3 text-sm ${joyBalance >= 250 ? "bg-emerald-500/10 text-emerald-700" : "bg-amber-500/10 text-amber-700"}`}>Ví hiện có <b>{joyBalance} JOY</b> · cần 250 JOY/lượt{joyBalance < 250 ? ` · còn thiếu ${250 - joyBalance} JOY` : ""}</p>}<button type="button" onClick={start} disabled={busy || state?.attemptsRemaining === 0 || (walletLoaded && joyBalance < 250)} className="w-full rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">{busy ? "Đang tạo đề…" : walletLoaded && joyBalance < 250 ? "Cần nạp thêm JOY để bắt đầu" : `Bắt đầu đánh giá · ${state?.attemptsRemaining ?? 3} lượt còn lại`}</button></div>
      )}
      </div>
    </div>
  );
}

function CodingStageDashboard({ me, onBack, reload, bio, onBioUpdate }) {
  const [selectedStep, setSelectedStep] = useState(null);
  useEffect(() => {
    fetch(`${API_BASE}/hugoteam/assessment/status`).then((res) => res.ok && res.json()).then((data) => {
      if (data?.stage && data.stage !== me?.assessmentStage) reload();
    }).catch(() => {});
  }, [me?.assessmentStage, reload]);
  const daysLeft = me?.codingDeadline ? Math.max(0, Math.ceil((new Date(me.codingDeadline) - Date.now()) / 86400000)) : HUGOTEAM_CODING_DAYS;
  // Cùng một nguồn với ứng dụng Coding: số step đã xong ở đây = ở Coding.
  const completed = completedCoderSteps(bio?.completedLessons).length;
  return <TeamShell onBack={onBack}><div className="space-y-5"><StageCard eyebrow="HUGOTEAM · BƯỚC 2/4" title="Coding HugoTeam"><p className="mt-3 text-sm leading-relaxed text-muted-foreground">HugoTeam dùng chính chương trình Coding: cùng {CODER_TOTAL_STEPS} step, cùng 6 chặng, cùng kết quả. Step đã xong ở Coding được tính ở đây và ngược lại.</p><div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-emerald-500/10 p-4"><p className="text-2xl font-bold text-emerald-600">{completed}/{CODER_TOTAL_STEPS}</p><p className="text-sm text-muted-foreground">Step Coding đã hoàn tất</p></div><div className="rounded-2xl bg-primary/10 p-4"><p className="text-2xl font-bold text-primary">{daysLeft} ngày</p><p className="text-sm text-muted-foreground">Còn lại trong {HUGOTEAM_CODING_DAYS} ngày</p></div><div className="rounded-2xl bg-muted/50 p-4"><p className="text-2xl font-bold text-foreground">Không yêu cầu</p><p className="text-sm text-muted-foreground">Dự án cuối ở bước này</p></div></div><div className="mt-5 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm leading-relaxed text-amber-800">Quá {HUGOTEAM_CODING_DAYS} ngày chưa hoàn tất thì phải làm lại bài đánh giá HugoTeam. Tiến độ Coding của bạn vẫn được giữ nguyên.</div><div className="mt-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm leading-relaxed text-muted-foreground">Hoàn tất đủ {CODER_TOTAL_STEPS} step (6 chặng CODE 101 → CODE 302) sẽ chuyển sang Mentor.</div></StageCard><div className="overflow-hidden rounded-3xl border border-border/60 bg-card"><Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Đang tải chương trình Coding HugoTeam…</div>}><HugoCoderHub bio={bio} onBioUpdate={onBioUpdate} onBack={() => setSelectedStep(null)} urlLessonId={selectedStep} framed={!selectedStep} program="hugoteam" programProgress={bio?.completedLessons || []} onLessonChange={setSelectedStep} onProgramProgress={reload} /></Suspense></div></div></TeamShell>;
}

function StageCard({ title, eyebrow, children }) {
  return <div className="ht-stage-card"><p>{eyebrow}</p><h2>{title}</h2>{children}</div>;
}

function MentorMonthDashboard({ me }) {
  const remaining = me?.mentorEndsAt ? Math.max(0, Math.ceil((new Date(me.mentorEndsAt) - Date.now()) / 86400000)) : 30;
  return <div className="space-y-5"><StageCard eyebrow="MENTOR · 30 NGÀY" title="Chặng đồng hành và dự án cuối"><p className="mt-3 text-sm leading-relaxed text-muted-foreground">Bạn có một Mentor đồng hành liên tục trong tháng đầu. Dự án cuối được thực hiện ở giai đoạn này, không còn là điều kiện hoàn tất chương trình Coding HugoTeam.</p><div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-primary/10 p-4"><p className="text-3xl font-bold text-primary">{remaining}</p><p className="text-sm text-muted-foreground">ngày còn lại</p></div><div className="rounded-2xl bg-muted/50 p-4"><p className="text-3xl font-bold text-foreground">{me?.mentor?.name || "Đang phân công"}</p><p className="text-sm text-muted-foreground">Mentor của bạn</p></div><div className="rounded-2xl bg-emerald-500/10 p-4"><p className="text-3xl font-bold text-emerald-600">{me?.contributionScore || 0}</p><p className="text-sm text-muted-foreground">điểm đóng góp</p></div></div><div className="mt-5 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm leading-relaxed text-muted-foreground"><b className="text-foreground">Dự án cuối:</b> Mentor giao phạm vi, tiêu chí và hình thức phối hợp. HugoTeam ghi nhận nhiệm vụ, phản hồi và điểm đóng góp.</div></StageCard><StageCard eyebrow="CHECK-IN" title="Nhật ký phát triển"><div className="mt-4 space-y-3"><div className="flex items-center justify-between rounded-2xl bg-muted/50 p-4 text-sm"><span>Mentor đã được kết nối</span><span className="font-semibold text-emerald-600">{me?.mentor?.email || "Chờ phân công"}</span></div><div className="flex items-center justify-between rounded-2xl bg-muted/50 p-4 text-sm"><span>Trạng thái chuyển tiếp</span><span className="font-semibold text-primary">Sau khi đủ 30 ngày và hoàn tất dự án</span></div></div></StageCard></div>;
}

function TeamDashboard({ me }) {
  const [team, setTeam] = useState(null);
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  useEffect(() => { fetch(`${API_BASE}/hugoteam/team/dashboard`).then((res) => res.ok && res.json()).then(setTeam).catch(() => {}); }, []);
  const createTask = async () => { if (!title || !target) return; await fetch(`${API_BASE}/hugoteam/team/tasks`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, email: target }) }); setTitle(""); setTarget(""); };
  return <div className="space-y-5"><StageCard eyebrow="TEAMWORK" title={`Team ${team?.teamId || me?.teamId || "đang chuẩn bị"}`}><p className="mt-3 text-sm leading-relaxed text-muted-foreground">Team tối đa 10 thành viên. Các bạn tự chủ động giao tiếp và phối hợp bên ngoài; hệ thống giữ vai trò minh bạch hóa thành viên, nhiệm vụ và đóng góp.</p><div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-primary/10 p-4"><p className="text-3xl font-bold text-primary">{team?.members?.length || 0}/10</p><p className="text-sm text-muted-foreground">thành viên</p></div><div className="rounded-2xl bg-muted/50 p-4"><p className="text-3xl font-bold text-foreground">{team?.members?.filter((item) => item.teamRole === "teamlead").length || 0}</p><p className="text-sm text-muted-foreground">Teamlead</p></div><div className="rounded-2xl bg-emerald-500/10 p-4"><p className="text-3xl font-bold text-emerald-600">{team?.members?.reduce((sum, item) => sum + item.openTasks, 0) || 0}</p><p className="text-sm text-muted-foreground">nhiệm vụ mở</p></div></div></StageCard><StageCard eyebrow="MEMBERS" title="Những người cùng team"><div className="mt-4 grid gap-3 sm:grid-cols-2">{(team?.members || []).map((member) => <div key={member.email} className="flex items-center justify-between rounded-2xl border border-border/60 p-4"><div><p className="font-semibold text-foreground">{member.name}</p><p className="text-sm text-muted-foreground">{member.teamRole === "teamlead" ? "Teamlead" : "Member"}</p></div><span className="rounded-full bg-muted px-3 py-1 text-sm">{member.contributionScore}/100</span></div>)}</div>{team?.members?.some((member) => member.email === me?.email && member.teamRole === "teamlead") && <div className="mt-5 grid gap-2 sm:grid-cols-[1fr_1fr_auto]"><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Tên nhiệm vụ" className="rounded-xl border border-border bg-background px-3 py-2 text-sm" /><select value={target} onChange={(event) => setTarget(event.target.value)} className="rounded-xl border border-border bg-background px-3 py-2 text-sm"><option value="">Chọn thành viên</option>{team.members.map((member) => <option key={member.email} value={member.email}>{member.name}</option>)}</select><button type="button" onClick={createTask} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Giao</button></div>}</StageCard></div>;
}

function MentorDashboard({ onBack }) {
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(80);
  const [note, setNote] = useState("");
  const load = () => fetch(`${API_BASE}/hugoteam/mentor/dashboard`).then((res) => res.ok && res.json()).then(setData).catch(() => {});
  useEffect(() => { load(); }, []);
  const save = async () => { if (!selected) return; await fetch(`${API_BASE}/hugoteam/mentor/mentees/${encodeURIComponent(selected)}/feedback`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ score, note }) }); setSelected(null); setNote(""); load(); };
  return <TeamShell onBack={onBack}><div className="space-y-5"><StageCard eyebrow="MENTOR CONSOLE" title="Dashboard Mentor"><p className="mt-3 text-sm text-muted-foreground">Theo dõi nhịp đồng hành, phản hồi định kỳ và sức chứa tối đa 100 mentee trong một đợt.</p><div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-primary/10 p-4"><p className="text-3xl font-bold text-primary">{data?.capacity?.used || 0}/{data?.capacity?.max || 100}</p><p className="text-sm text-muted-foreground">sức chứa</p></div><div className="rounded-2xl bg-emerald-500/10 p-4"><p className="text-3xl font-bold text-emerald-600">{data?.mentees?.filter((item) => item.contributionScore >= 70).length || 0}</p><p className="text-sm text-muted-foreground">đang tiến triển tốt</p></div><div className="rounded-2xl bg-muted/50 p-4"><p className="text-3xl font-bold text-foreground">30 ngày</p><p className="text-sm text-muted-foreground">mỗi chu kỳ</p></div></div></StageCard><StageCard eyebrow="MENTEES" title="Danh sách đồng hành"><div className="mt-4 space-y-3">{(data?.mentees || []).map((mentee) => <div key={mentee.email} className="flex flex-col gap-3 rounded-2xl border border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-foreground">{mentee.name}</p><p className="text-sm text-muted-foreground">{mentee.openTasks} nhiệm vụ mở · {mentee.approvedHours} giờ được ghi nhận</p></div><div className="flex items-center gap-2"><span className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">{mentee.contributionScore}/100</span><button type="button" onClick={() => setSelected(mentee.email)} className="rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">Đánh giá</button></div></div>)}</div></StageCard></div>{selected && <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"><div className="w-full max-w-md rounded-3xl bg-card p-6"><h3 className="text-lg font-bold text-foreground">Cập nhật đóng góp</h3><input type="range" min="0" max="100" value={score} onChange={(event) => setScore(Number(event.target.value))} className="mt-5 w-full" /><p className="mt-2 text-center text-2xl font-bold text-primary">{score}/100</p><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Nhận xét ngắn" className="mt-4 min-h-24 w-full rounded-2xl border border-border bg-background p-3 text-sm" /><div className="mt-4 flex justify-end gap-2"><button type="button" onClick={() => setSelected(null)} className="rounded-xl px-4 py-2 text-sm">Huỷ</button><button type="button" onClick={save} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Lưu</button></div></div></div>}</TeamShell>;
}

export default function HugoTeamTab({ onBack, bio, onBioUpdate }) {
  const { t, i18n } = useTranslation();
  const locale = localeForLanguage(i18n.resolvedLanguage || i18n.language);
  const [developers, setDevelopers] = useState([]);
  /*
   * ĐANG tải danh sách, khác với ĐÃ tải xong mà rỗng.
   *
   * Trước đây chỉ có `developers` khởi tạo `[]`, nên trong lúc chờ mạng app hiện
   * nguyên khối "chưa có lập trình viên nào" rồi mới nháy sang danh sách thật —
   * người dùng đọc được một thông báo SAI trong khoảnh khắc đầu. Phải phân biệt
   * hai trạng thái đó thì mới nói đúng.
   */
  const [devsLoading, setDevsLoading] = useState(true);
  const [me, setMe] = useState(null); // GET /me payload — status + dashboard data
  const userStatus = me?.status ?? null;

  useEffect(() => {
    loadDevelopers();
    loadMe();
  }, []);

  const loadDevelopers = async () => {
    try {
      const res = await fetchHugoTeamRead(`${API_BASE}/hugoteam/developers`);
      if (res.ok) {
        const data = await res.json();
        setDevelopers(data.developers || []);
      }
    } catch (error) {
      console.error("Failed to load developers:", error);
    } finally {
      setDevsLoading(false);
    }
  };

  const loadMe = async () => {
    try {
      const session = await getMemberSession();
      if (!session?.email) return;
      const res = await fetchHugoTeamRead(`${API_BASE}/hugoteam/me`);
      if (res.ok) setMe(await res.json());
    } catch (error) {
      console.error("Failed to load hugoteam profile:", error);
    }
  };

  const handleAssessmentPassed = async () => {
    await loadMe();
  };

  // Dev đã được duyệt → HugoTeam trở thành workspace: task, giờ đồng hành, trao đổi.
  if (me?.role === "mentor") return <MentorDashboard onBack={onBack} />;
  if (me?.assessmentStage === "coding") return <CodingStageDashboard me={me} onBack={onBack} reload={loadMe} bio={bio} onBioUpdate={onBioUpdate} />;
  if (me?.assessmentStage === "mentor") return <TeamShell onBack={onBack}><MentorMonthDashboard me={me} /></TeamShell>;
  if (me?.assessmentStage === "team") return <TeamShell onBack={onBack}><TeamDashboard me={me} /></TeamShell>;
  if (userStatus === "approved") {
    const membershipEnd = me?.membershipEnd ? new Date(me.membershipEnd) : null;
    const daysRemaining = membershipEnd ? Math.ceil((membershipEnd - new Date()) / (24 * 60 * 60 * 1000)) : null;
    return (
      <TeamShell onBack={onBack}>
        {/* Dải VVIP: một dòng chữ, không khung — khung chỉ để trang trí. */}
        <p className="flex items-baseline justify-between gap-3 pb-3 pt-1 text-[13px]" style={{ color: "var(--ios-label-2)" }}>
          <span>{t("memberPortal.team.membershipEnds", { date: membershipEnd?.toLocaleDateString(locale), days: daysRemaining })}</span>
          <span className="shrink-0 font-bold" style={{ color: "var(--ax)" }}>VVIP</span>
        </p>
        <DevWorkspace me={me} reload={loadMe} locale={locale} />
      </TeamShell>
    );
  }

  return (
    <TeamShell onBack={onBack}>
      <div className="hugo-team-marketing">

      <div>
      <div>
      {/* Hero */}
      <div className="ht-hero">
        <div className="relative z-[1]">
          <div className="ht-kicker"><span className="material-symbols-outlined text-lg">hub</span> HugoTeam · cộng đồng phát triển</div>
          <h1>Học thật. Làm thật. Lớn lên cùng một team.</h1>
          <p className="ht-hero-copy">Dành cho thành viên từ 14 tuổi muốn rèn tư duy, kỹ năng lập trình và teamwork qua một lộ trình minh bạch: đánh giá năng lực, Coding HugoTeam, Mentor và team dự án.</p>
          <div className="ht-hero-actions">
            <a href="#hugo-team-assessment" className="ht-button ht-button-primary">Bắt đầu đánh giá <span className="material-symbols-outlined text-lg">arrow_downward</span></a>
            <a href="#hugo-team-roadmap" className="ht-button ht-button-secondary">Xem lộ trình</a>
          </div>
        </div>
        <div className="ht-hero-facts">
          <div className="ht-hero-fact"><strong>4 chặng</strong><span>Từ đánh giá đến teamwork</span></div>
          <div className="ht-hero-fact"><strong>30 ngày</strong><span>Đồng hành trực tiếp cùng Mentor</span></div>
          <div className="ht-hero-fact"><strong>10 người</strong><span>Tối đa trong mỗi team</span></div>
        </div>
      </div>

      {/* Benefits */}
      <div className="ht-section">
        <div className="ht-section-head">
          <div className="ht-kicker text-[#087f8c]">Quyền lợi thực tế</div>
          <h2>{t("memberPortal.team.benefitsTitle")}</h2>
          <p>{t("memberPortal.team.benefitsDesc")}</p>
        </div>
        <div className="ht-benefits">
          {BENEFITS.map((b) => (
            <div key={b.key} className="ht-benefit">
              <span className="material-symbols-outlined">{b.icon}</span>
              <h3>{t(`memberPortal.team.${b.key}Title`)}</h3>
              <p>{t(`memberPortal.team.${b.key}Desc`)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How Hugo Studio takes care of members */}
      <div className="ht-section ht-split">
        <div className="ht-panel">
        <h2 className="text-lg font-semibold text-foreground mb-4">{t("memberPortal.team.careTitle")}</h2>
        <div className="grid gap-3 text-sm leading-relaxed text-muted-foreground max-w-3xl sm:grid-cols-2">
          <p>
            <span className="font-semibold text-foreground">{t("memberPortal.team.careWeek1Label")}</span> {t("memberPortal.team.careWeek1")}
          </p>
          <p>
            <span className="font-semibold text-foreground">{t("memberPortal.team.careWeeklyLabel")}</span> {t("memberPortal.team.careWeekly")}
          </p>
          <p>
            <span className="font-semibold text-foreground">{t("memberPortal.team.careStuckLabel")}</span> {t("memberPortal.team.careStuck")}
          </p>
          <p>
            <span className="font-semibold text-foreground">{t("memberPortal.team.careHoursLabel")}</span> {t("memberPortal.team.careHours")}
          </p>
        </div>
        </div>

      {/* Membership & 500-hour milestone */}
      <div>
        <div className="ht-panel ht-panel-dark">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <span className="material-symbols-outlined text-[24px]">military_tech</span>
            </span>
            <h2 className="text-lg font-semibold text-foreground">{t("memberPortal.team.loyaltyTitle")}</h2>
          </div>

          {/* Membership info */}
          <div className="bg-muted/50 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="material-symbols-outlined text-base text-primary">verified</span>
              <span className="font-semibold text-foreground">{t("memberPortal.team.membershipLine")}</span>
            </div>
            <p className="text-[13px] text-muted-foreground">{t("memberPortal.team.membershipDesc")}</p>
          </div>

          <p className="text-sm leading-relaxed text-muted-foreground">{t("memberPortal.team.loyaltyText")}</p>
          <div className="ht-rewards">
            <div className="ht-reward"><strong>365 ngày</strong><span>quyền lợi sau hoàn tất</span></div>
            <div className="ht-reward"><strong>10.000 JOY</strong><span>quà gia nhập dự kiến</span></div>
            <div className="ht-reward"><strong>75% OFF</strong><span>khi giới thiệu 4 bạn</span></div>
          </div>
          <div className="bg-muted/50 rounded-xl p-3.5 space-y-2">
            <p className="text-sm font-semibold text-foreground">{t("memberPortal.team.milestone500Title")}</p>
            <ul className="text-[13px] text-muted-foreground space-y-1 ml-4">
              <li>• {t("memberPortal.team.milestone500a")}</li>
              <li>• {t("memberPortal.team.milestone500b")}</li>
              <li>• {t("memberPortal.team.milestone500c")}</li>
              <li>• {t("memberPortal.team.milestone500d")}</li>
            </ul>
          </div>
        </div>
      </div>
      </div>

      {/* Requirements */}
      <div className="ht-section ht-panel">
        <h2>{t("memberPortal.team.reqTitle")}</h2>
        <div className="space-y-3 text-sm">
          <div className="flex gap-3">
            <span className="font-bold text-foreground w-24">{t("memberPortal.team.reqAudienceLabel")}</span>
            <span className="text-muted-foreground">{t("memberPortal.team.reqAudience")}</span>
          </div>
          <div className="flex gap-3">
            <span className="font-bold text-foreground w-24">{t("memberPortal.team.reqWorkLabel")}</span>
            <span className="text-muted-foreground">{t("memberPortal.team.reqWork")}</span>
          </div>
          <div className="flex gap-3">
            <span className="font-bold text-foreground w-24">{t("memberPortal.team.reqTimeLabel")}</span>
            <span className="text-muted-foreground">{t("memberPortal.team.reqTime")}</span>
          </div>
          <div className="flex gap-3">
            <span className="font-bold text-foreground w-24">{t("memberPortal.team.reqNatureLabel")}</span>
            <span className="text-muted-foreground">{t("memberPortal.team.reqNature")}</span>
          </div>
        </div>
      </div>

      {/* Info about process */}
      <div id="hugo-team-roadmap" className="ht-section">
        <div className="ht-section-head"><div className="ht-kicker text-[#087f8c]">Lộ trình minh bạch</div><h2>{t("memberPortal.team.processTitle")}</h2><p>Mỗi chặng có điều kiện hoàn tất riêng và dashboard tự thay đổi theo trạng thái của thành viên.</p></div>
        <ol className="ht-journey">
          <li className="ht-journey-step">
            <b>01</b><div><h3>Đánh giá năng lực</h3><p>{t("memberPortal.team.process1")}</p></div><span>18 câu · 250 JOY</span>
          </li>
          <li className="ht-journey-step">
            <b>02</b><div><h3>Coding HugoTeam</h3><p>{t("memberPortal.team.process2")}</p></div><span>{CODER_TOTAL_STEPS} step Coding · tối đa {HUGOTEAM_CODING_DAYS} ngày</span>
          </li>
          <li className="ht-journey-step">
            <b>03</b><div><h3>Mentor và dự án cuối</h3><p>{t("memberPortal.team.process3")}</p></div><span>30 ngày đồng hành</span>
          </li>
          <li className="ht-journey-step">
            <b>04</b><div><h3>Teamwork chính thức</h3><p>{t("memberPortal.team.process4")}</p></div><span>Tối đa 10 người/team</span>
          </li>
        </ol>
      </div>

      </div>{/* end left column */}

      </div>{/* end 2-column grid */}

      {/* Full-width below the grid */}
      <div>
      {/* Developers List — nâng cấp */}
      <div className="ht-section">
        <div className="ht-section-head">
          <div className="ht-kicker text-[#087f8c]">Cộng đồng hiện tại</div>
          <h2>{t("memberPortal.team.devsTitle", { count: developers.length })}</h2>
          <p>{t("memberPortal.team.devsDesc")}</p>
        </div>
        {devsLoading ? (
          /* Khung xương đúng dáng thẻ thật để nội dung không nhảy khi dữ liệu về. */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-busy="true" aria-label={t("memberPortal.team.devsTitle", { count: 0 })}>
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[168px] animate-pulse rounded-2xl border border-border/40 bg-muted/40" />
            ))}
          </div>
        ) : developers.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-border/50 text-center">
            <span className="material-symbols-outlined text-3xl text-muted-foreground block mb-2">groups</span>
            <p className="text-sm text-muted-foreground">{t("memberPortal.team.devsEmpty")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {developers.map((dev) => (
              <div key={dev.id} className="ht-benefit relative">
                {/* Developer Badge */}
                <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[13px] font-medium">
                  {t("memberPortal.team.devBadge")}
                </div>

                {/* Avatar + Name */}
                <div className="flex items-start gap-3 pt-1">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#0b2138] text-lg font-semibold text-[#c8f45b]">
                    {dev.name[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0 pr-16">
                    <p className="font-semibold text-foreground text-sm leading-tight break-words">{dev.name}</p>
                    {dev.school && <p className="text-[13px] text-muted-foreground mt-0.5 break-words">{dev.school}</p>}
                  </div>
                </div>

                {/* Membership Status */}
                <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                  <span className="material-symbols-outlined text-sm">verified</span>
                  <span>{t("memberPortal.team.membership3y")}</span>
                </div>

                {/* Verified Check */}
                <div className="flex items-center pt-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[13px] font-medium">
                    <span className="material-symbols-outlined text-[13px]">check_circle</span>
                    {t("memberPortal.team.approved")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contact */}
      <div className="ht-section border-t border-border pt-8 text-center space-y-2">
        <p className="text-sm text-muted-foreground">{t("memberPortal.team.contactTitle")}</p>
        <div className="flex flex-wrap items-center justify-center gap-4 text-[13px] font-semibold">
          <a href="mailto:education@hugowishpax.studio?subject=%5BHugo%20Team%5D%20Th%E1%BA%AFc%20m%E1%BA%AFc%20%C4%90%C3%A0o%20t%E1%BA%A1o%20%26%20Tuy%E1%BB%83n%20d%E1%BB%A5ng" className="text-primary hover:underline flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px]">school</span>
            Đào tạo & Ứng tuyển: education@hugowishpax.studio
          </a>
          <span className="text-muted-foreground/40">·</span>
          <a href="mailto:support@hugowishpax.studio?subject=%5BHugo%20Team%5D%20H%E1%BB%97%20tr%E1%BB%A3%20k%E1%BB%B9%20thu%E1%BA%ADt%20th%C3%A0nh%20vi%C3%AAn" className="text-primary hover:underline flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px]">support_agent</span>
            Hỗ trợ kỹ thuật: support@hugowishpax.studio
          </a>
        </div>
      </div>
      <section className="ht-section" aria-labelledby="hugo-team-assessment">
        <div className="ht-section-head">
          <div className="ht-kicker text-[#087f8c]">Bước đầu tiên</div>
          <h2 id="hugo-team-assessment">Sẵn sàng kiểm tra năng lực?</h2>
          <p>Khi đã hiểu rõ lộ trình, bạn có thể bắt đầu bài đánh giá toàn màn hình. Logic có 25 giây; Sáng tạo và EQ có 10 giây mỗi câu.</p>
        </div>
        <div><AssessmentPanel userStatus={userStatus} onPassed={handleAssessmentPassed} /></div>
      </section>
      </div>
      </div>
    </TeamShell>
  );
}

/* ───────────────────────── Dev Workspace (đã được duyệt) ───────────────────────── */

// Nhãn trạng thái đi bằng khoá, màu đi bằng class: bảng này nằm ngoài
// component nên không gọi được hook dịch, còn StatusChip thì gọi được.
const TASK_STATUS_META = {
  assigned:  { key: "statusAssigned",  cls: "bg-info/10 text-info" },
  doing:     { key: "statusDoing",     cls: "bg-warning/10 text-warning" },
  submitted: { key: "statusSubmitted", cls: "bg-primary/10 text-primary" },
  done:      { key: "statusDone",      cls: "bg-success/10 text-success" },
  cancelled: { key: "statusCancelled", cls: "bg-muted text-muted-foreground" },
};

const LOG_STATUS_META = {
  pending:  { key: "logPending",  cls: "bg-warning/10 text-warning" },
  approved: { key: "logApproved", cls: "bg-success/10 text-success" },
  rejected: { key: "logRejected", cls: "bg-destructive/10 text-destructive" },
};

// Ngày tháng cũng là ngôn ngữ: "vi-VN" cứng trong hàm này khiến người đọc
// tiếng Nhật thấy 13/08/2026 thay vì 2026/08/13.
const fmtDate = (d, locale) => (d ? new Date(d).toLocaleDateString(locale) : "—");

function StatusChip({ meta }) {
  const { t } = useTranslation();
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[13px] font-bold ${meta.cls}`}>
      {t(`memberPortal.team.${meta.key}`)}
    </span>
  );
}

/**
 * Bảng làm việc: hàng đợi việc ở trên, dòng thời gian ở dưới.
 *
 * Bản cũ chia ba tab rời (Việc / Giờ / Trao đổi) nên muốn biết "hôm nay có gì"
 * phải mở lần lượt cả ba, và số việc đang mở bị lặp ở hai khối thống kê khác
 * nhau. Ở đây mọi thứ nằm trên một màn: việc cần tay mình thì nổi lên trên,
 * còn lại chảy xuống một dòng sự kiện lọc được.
 */
function DevWorkspace({ me, reload, locale }) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState("all");
  const [composer, setComposer] = useState(null); // null | "message" | "hours"
  const stats = me?.stats || {};
  const goal = 500;
  const approved = stats.approvedHours || 0;
  const progress = Math.min(100, (approved / goal) * 100);
  const isMilestone = approved >= goal;

  const tasks = me.tasks || [];
  const openTasks = tasks.filter((task) => ["assigned", "doing", "submitted"].includes(task.status));

  // Mở bảng = đã đọc tin của admin. Trước đây phải bấm sang tab Trao đổi mới
  // đánh dấu, nên huy hiệu đỏ bám dai dù người dùng đã thấy nội dung.
  useEffect(() => {
    if ((me.messages || []).some((m) => m.from === "admin" && !m.readByDev)) {
      fetch(`${API_BASE}/hugoteam/me/messages/read`, { method: "POST" }).then(reload).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const feed = buildFeed(me, t);
  const shown = filter === "all" ? feed : feed.filter((item) => item.kind === filter);

  const FILTERS = [
    { id: "all", label: t("memberPortal.team.filterAll") },
    { id: "task", label: t("memberPortal.team.sectionTasks") },
    { id: "hours", label: t("memberPortal.team.sectionHours") },
    { id: "message", label: t("memberPortal.team.sectionChat") },
  ];

  return (
    <div className="space-y-5">
      {/* Dải trạng thái: lời chào, membership và tiến độ giờ gộp trong một thẻ */}
      <section className="rounded-[12px] p-4" style={{ background: "var(--ios-surface)" }}>
        <p className="text-[15px] font-semibold tracking-[-0.01em]">
          {t("memberPortal.team.greeting", { name: me.name })}
        </p>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-[34px] font-bold leading-none tracking-[-0.02em]" style={{ color: isMilestone ? "#30D158" : "var(--ax)" }}>
            {approved}h
          </span>
          <span className="text-[15px]" style={{ color: "var(--ios-label-2)" }}>/ {goal}h</span>
        </div>
        <div className="mt-3">
          <ProgressBar value={progress} />
        </div>

        <dl className="mt-4 grid grid-cols-3 gap-3 border-t-[0.5px] pt-3.5" style={{ borderColor: "var(--ios-sep)" }}>
          {[
            { value: openTasks.length, label: t("memberPortal.team.statOpenTasks") },
            { value: stats.doneTasks || 0, label: t("memberPortal.team.statDoneTasks") },
            { value: `${stats.pendingHours || 0}h`, label: t("memberPortal.team.pendingApproval") },
          ].map((stat) => (
            <div key={stat.label}>
              <dd className="text-[20px] font-semibold leading-none">{stat.value}</dd>
              <dt className="mt-1.5 text-[13px] leading-tight" style={{ color: "var(--ios-label-2)" }}>{stat.label}</dt>
            </div>
          ))}
        </dl>

        {isMilestone && (
          <p className="mt-4 flex items-center gap-2 rounded-[10px] px-3 py-2 text-[13px] font-semibold" style={{ background: "rgba(48,209,88,.12)", color: "#30D158" }}>
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">military_tech</span>
            {t("memberPortal.team.milestoneTitle")}
          </p>
        )}
      </section>

      {/* Hàng đợi: chỉ việc còn cần tay mình, mỗi thẻ đúng một hành động chính */}
      <section aria-labelledby="team-todo">
        <h2 id="team-todo" className="px-4 pb-1.5 text-[13px] uppercase tracking-[0.03em]" style={{ color: "var(--ios-label-2)" }}>
          {t("memberPortal.team.boardTodo")} · {openTasks.length}
        </h2>
        {openTasks.length === 0 ? (
          <p className="rounded-[12px] px-4 py-6 text-center text-[15px]" style={{ background: "var(--ios-surface)", color: "var(--ios-label-2)" }}>
            {t("memberPortal.team.allClear")}
          </p>
        ) : (
          <ul className="overflow-hidden rounded-[12px]" style={{ background: "var(--ios-surface)" }}>
            {openTasks.map((task, index) => (
              <li key={task._id}>
                <TaskCard task={task} reload={reload} locale={locale} last={index === openTasks.length - 1} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Soạn: nhắn tin hoặc ghi giờ, mở ngay tại chỗ thay vì đổi tab */}
      <section>
        {composer === null ? (
          <div className="grid grid-cols-2 gap-2.5">
            <Button variant="gray" size="md" full onClick={() => setComposer("hours")}>
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">schedule</span>
              {t("memberPortal.team.composerHours")}
            </Button>
            <Button variant="gray" size="md" full onClick={() => setComposer("message")}>
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">forum</span>
              {t("memberPortal.team.composerMessage")}
            </Button>
          </div>
        ) : (
          <div className="rounded-[12px] p-4" style={{ background: "var(--ios-surface)" }}>
            {composer === "hours"
              ? <HourForm tasks={tasks} reload={reload} onClose={() => setComposer(null)} />
              : <MessageForm reload={reload} onClose={() => setComposer(null)} />}
          </div>
        )}
      </section>

      {/* Dòng thời gian: việc, giờ và tin nhắn trộn chung theo thời gian */}
      <section aria-labelledby="team-feed">
        <div className="mb-2.5 flex flex-wrap items-center gap-2">
          <h2 id="team-feed" className="w-full px-4 text-[13px] uppercase tracking-[0.03em]" style={{ color: "var(--ios-label-2)" }}>{t("memberPortal.team.boardFeed")}</h2>
          <Segmented items={FILTERS} value={filter} onChange={setFilter} className="w-full" />
        </div>

        {shown.length === 0 ? (
          <p className="rounded-[12px] px-4 py-6 text-center text-[15px]" style={{ background: "var(--ios-surface)", color: "var(--ios-label-2)" }}>
            {t("memberPortal.team.feedEmpty")}
          </p>
        ) : (
          <ol className="overflow-hidden rounded-[12px]" style={{ background: "var(--ios-surface)" }}>
            {shown.map((item, index) => (
              <FeedRow key={item.id} item={item} locale={locale} reload={reload} last={index === shown.length - 1} />
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

/** Trộn ba nguồn thành một danh sách sự kiện, mới nhất lên đầu. */
function buildFeed(me, t) {
  const events = [];
  for (const task of me.tasks || []) {
    events.push({
      id: `task-${task._id}`,
      kind: "task",
      at: task.assignedAt,
      icon: task.status === "done" ? "task_alt" : "assignment",
      title: task.title,
      detail: t(`memberPortal.team.${(TASK_STATUS_META[task.status] || TASK_STATUS_META.assigned).key}`),
    });
  }
  for (const log of me.hourLogs || []) {
    events.push({
      id: `hours-${log._id}`,
      kind: "hours",
      at: log.date,
      icon: "schedule",
      title: t("memberPortal.team.eventHours", { hours: log.hours }),
      detail: log.note || t(`memberPortal.team.${(LOG_STATUS_META[log.status] || LOG_STATUS_META.pending).key}`),
      log,
    });
  }
  for (const message of me.messages || []) {
    events.push({
      id: `msg-${message._id}`,
      kind: "message",
      translatable: message.from === "admin",
      at: message.at,
      icon: "forum",
      title: message.from === "admin" ? t("memberPortal.team.eventMessageAdmin") : t("memberPortal.team.eventMessageDev"),
      detail: message.text,
    });
  }
  return events.sort((a, b) => new Date(b.at) - new Date(a.at));
}

function FeedRow({ item, locale, reload, last }) {
  const { t, i18n } = useTranslation();
  const [translated, setTranslated] = useState(null);
  const [busy, setBusy] = useState(false);

  // Admin soạn bằng tiếng Việt hoặc tiếng Anh. Chỉ mời dịch khi ngôn ngữ Dev
  // đang chọn khác ngôn ngữ của tin — cùng thứ tiếng thì nút chỉ tổ vướng.
  const uiLanguage = languageCode(i18n.resolvedLanguage || i18n.language);
  const sourceLanguage = item.translatable ? guessLanguage(item.detail) : null;
  const offerTranslation = Boolean(item.translatable && canTranslate() && sourceLanguage !== uiLanguage);

  const toggleTranslation = async () => {
    if (translated) {
      setTranslated(null);
      return;
    }
    setBusy(true);
    try {
      setTranslated(await translateText(item.detail, { from: sourceLanguage, to: uiLanguage }));
    } catch (error) {
      notify.error(t(error.message === "unavailable"
        ? "memberPortal.team.translateUnavailable"
        : "memberPortal.team.translateError"));
    } finally {
      setBusy(false);
    }
  };

  const withdraw = async () => {
    const ok = await notify.confirm({
      title: t("memberPortal.team.confirmWithdrawTitle"),
      message: t("memberPortal.team.confirmWithdrawDesc"),
      danger: true,
    });
    if (!ok) return;
    try {
      const res = await fetch(`${API_BASE}/hugoteam/me/hours/${item.log._id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || t("memberPortal.team.toastError"));
      notify.success(t("memberPortal.team.toastWithdrawn"));
      reload();
    } catch (error) {
      notify.error(error.message);
    }
  };

  return (
    <li className="flex items-start gap-3 px-4">
      <span className="material-symbols-outlined mt-3.5 text-[18px]" style={{ color: "var(--ios-label-2)" }} aria-hidden="true">{item.icon}</span>
      <div className={`min-w-0 flex-1 py-3 ${last ? "" : "border-b-[0.5px]"}`} style={{ borderColor: "var(--ios-sep)" }}>
        <p className="text-[15px] font-semibold leading-snug">{item.title}</p>
        {item.detail && (
          <p className="mt-0.5 whitespace-pre-wrap text-[13px] leading-relaxed" style={{ color: "var(--ios-label-2)" }}>
            {translated ?? item.detail}
          </p>
        )}
        {item.translatable && offerTranslation && (
          <button
            type="button"
            onClick={toggleTranslation}
            disabled={busy}
            className="mt-1.5 text-[13px] font-semibold disabled:opacity-60"
            style={{ color: "var(--ax)" }}
          >
            {busy
              ? t("memberPortal.team.translating")
              : translated
                ? t("memberPortal.team.showOriginal")
                : t("memberPortal.team.translate")}
          </button>
        )}
        <p className="mt-1 text-[13px]" style={{ color: "var(--ios-label-2)" }}>{fmtDate(item.at, locale)}</p>
      </div>
      {item.log?.status === "pending" && (
        <button
          type="button"
          onClick={withdraw}
          aria-label={t("memberPortal.team.withdraw")}
          className="mt-3 grid h-7 w-7 shrink-0 place-items-center rounded-full" style={{ color: "var(--ios-label-2)" }}
        >
          <span className="material-symbols-outlined text-[16px]" aria-hidden="true">delete</span>
        </button>
      )}
    </li>
  );
}

function TaskCard({ task, reload, locale, last }) {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const [note, setNote] = useState(task.devNote || "");

  const updateTask = async (body) => {
    try {
      const res = await fetch(`${API_BASE}/hugoteam/me/tasks/${task._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("memberPortal.team.toastTaskUpdateError"));
      notify.success(body.status === "submitted" ? t("memberPortal.team.toastTaskSubmitted") : t("memberPortal.team.toastTaskUpdated"));
      setSubmitting(false);
      reload();
    } catch (error) {
      notify.error(error.message);
    }
  };

  return (
    <article className={`px-4 py-3.5 ${last ? "" : "border-b-[0.5px]"}`} style={{ borderColor: "var(--ios-sep)" }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[16px] font-semibold tracking-[-0.01em]">{task.title}</h3>
          <p className="mt-0.5 text-[13px]" style={{ color: "var(--ios-label-2)" }}>
            {t("memberPortal.team.assignedOn", { date: fmtDate(task.assignedAt, locale) })}
            {task.deadline && (
              <> {t("memberPortal.team.han")} <span className="font-semibold text-foreground">{fmtDate(task.deadline, locale)}</span></>
            )}
          </p>
        </div>
        <StatusChip meta={TASK_STATUS_META[task.status] || TASK_STATUS_META.assigned} />
      </div>

      {task.guide && (
        <details className="mt-3">
          <summary className="cursor-pointer text-[13px] font-semibold text-muted-foreground">{t("memberPortal.team.huongDanTuAdmin")}</summary>
          <p className="mt-2 whitespace-pre-wrap rounded-xl bg-muted/60 p-3 text-[13px] leading-relaxed text-muted-foreground">{task.guide}</p>
        </details>
      )}
      {task.adminNote && (
        <p className="mt-3 whitespace-pre-wrap rounded-xl border border-primary/20 bg-primary/5 p-3 text-[13px] leading-relaxed text-muted-foreground">
          <span className="font-bold text-foreground">{t("memberPortal.team.nhanXetNghiemThu")} </span>
          {task.adminNote}
        </p>
      )}

      {task.status === "assigned" && (
        <Button variant="filled" size="sm" onClick={() => updateTask({ status: "doing" })} className="mt-3">
          {t("memberPortal.team.batDauThucHien")}
        </Button>
      )}

      {task.status === "doing" && (submitting ? (
        <div className="mt-3 space-y-2">
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={t("memberPortal.team.moTaNganNhung")}
            rows={3}
            className="w-full rounded-[10px] border-0 px-3 py-2.5 text-[16px]" style={{ background: "var(--ios-fill)", color: "var(--ios-label)" }}
          />
          <div className="flex gap-2">
            <Button variant="filled" size="sm" onClick={() => updateTask({ status: "submitted", devNote: note })}>
              {t("memberPortal.team.xacNhanNop")}
            </Button>
            <Button variant="gray" size="sm" onClick={() => setSubmitting(false)}>
              {t("memberPortal.team.huy")}
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="filled" size="sm" onClick={() => setSubmitting(true)} className="mt-3">
          {t("memberPortal.team.nopTask")}
        </Button>
      ))}

      {task.status === "submitted" && task.devNote && (
        <p className="mt-3 text-[13px] italic text-muted-foreground">{t("memberPortal.team.ghiChuCuaBan")} {task.devNote}</p>
      )}
    </article>
  );
}

function HourForm({ tasks, reload, onClose }) {
  const { t } = useTranslation();
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ date: today, hours: "", note: "", taskId: "" });
  const [saving, setSaving] = useState(false);
  const linkable = tasks.filter((task) => ["doing", "submitted", "done"].includes(task.status));

  const submit = async () => {
    const hours = Number(form.hours);
    if (!form.date || !Number.isFinite(hours) || hours <= 0) {
      notify.error(t("memberPortal.team.toastInvalidHours"));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/hugoteam/me/hours`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, hours, taskId: form.taskId || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("memberPortal.team.toastLogError"));
      notify.success(t("memberPortal.team.toastLogged"));
      onClose();
      reload();
    } catch (error) {
      notify.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-[17px] font-semibold tracking-[-0.01em]">{t("memberPortal.team.logHoursTitle")}</p>
      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1.5 text-[13px]">
          <span className="font-medium" style={{ color: "var(--ios-label-2)" }}>{t("memberPortal.team.fieldDate")}</span>
          <input
            type="date"
            max={today}
            value={form.date}
            onChange={(event) => setForm({ ...form, date: event.target.value })}
            className="w-full rounded-[10px] border-0 px-3 py-2.5 text-[16px]" style={{ background: "var(--ios-fill)", color: "var(--ios-label)" }}
          />
        </label>
        <label className="space-y-1.5 text-[13px]">
          <span className="font-medium" style={{ color: "var(--ios-label-2)" }}>{t("memberPortal.team.fieldHours")}</span>
          <input
            type="number"
            min="0.25"
            max="24"
            step="0.25"
            value={form.hours}
            onChange={(event) => setForm({ ...form, hours: event.target.value })}
            placeholder={t("memberPortal.team.hoursPlaceholder")}
            className="w-full rounded-[10px] border-0 px-3 py-2.5 text-[16px]" style={{ background: "var(--ios-fill)", color: "var(--ios-label)" }}
          />
        </label>
      </div>
      {linkable.length > 0 && (
        <label className="block space-y-1.5 text-[13px]">
          <span className="font-medium" style={{ color: "var(--ios-label-2)" }}>{t("memberPortal.team.fieldTask")}</span>
          <select
            value={form.taskId}
            onChange={(event) => setForm({ ...form, taskId: event.target.value })}
            className="w-full rounded-[10px] border-0 px-3 py-2.5 text-[16px]" style={{ background: "var(--ios-fill)", color: "var(--ios-label)" }}
          >
            <option value="">{t("memberPortal.team.noTask")}</option>
            {linkable.map((task) => <option key={task._id} value={task._id}>{task.title}</option>)}
          </select>
        </label>
      )}
      <label className="block space-y-1.5 text-[13px]">
        <span className="font-medium" style={{ color: "var(--ios-label-2)" }}>{t("memberPortal.team.fieldWhat")}</span>
        <input
          value={form.note}
          maxLength={500}
          onChange={(event) => setForm({ ...form, note: event.target.value })}
          placeholder={t("memberPortal.team.whatPlaceholder")}
          className="w-full rounded-[10px] border-0 px-3 py-2.5 text-[16px]" style={{ background: "var(--ios-fill)", color: "var(--ios-label)" }}
        />
      </label>
      <div className="flex gap-2">
        <Button variant="filled" size="sm" onClick={submit} disabled={saving}>
          {saving ? t("memberPortal.team.saving") : t("memberPortal.team.logHours")}
        </Button>
        <Button variant="gray" size="sm" onClick={onClose}>{t("memberPortal.team.huy")}</Button>
      </div>
    </div>
  );
}

function MessageForm({ reload, onClose }) {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/hugoteam/me/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: body }),
      });
      if (!res.ok) throw new Error((await res.json()).error || t("memberPortal.team.toastSendError"));
      setText("");
      onClose();
      reload();
    } catch (error) {
      notify.error(error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-[17px] font-semibold tracking-[-0.01em]">{t("memberPortal.team.composerMessage")}</p>
      <textarea
        value={text}
        maxLength={2000}
        rows={3}
        onChange={(event) => setText(event.target.value)}
        placeholder={t("memberPortal.team.chatPlaceholder")}
        className="w-full rounded-[10px] border-0 px-3 py-2.5 text-[16px]" style={{ background: "var(--ios-fill)", color: "var(--ios-label)" }}
      />
      <div className="flex gap-2">
        <Button variant="filled" size="sm" onClick={send} disabled={sending || !text.trim()}>
          {sending ? t("memberPortal.team.saving") : t("memberPortal.team.send")}
        </Button>
        <Button variant="gray" size="sm" onClick={onClose}>{t("memberPortal.team.huy")}</Button>
      </div>
    </div>
  );
}
