import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import confetti from "canvas-confetti";
import { notify } from "../lib/notify";
import { API_BASE } from "../config/apiBase";
import { joyText } from "../lib/joyDisplay";
import { FLAME_STAGES, MAX_FREEZES, STREAK_MILESTONES, THAW_PRICE } from "../../../../packages/shared/eduStreak";
import { useEduText } from "./eduText";
import { playEduSound } from "./eduSound";

/**
 * Chuỗi lửa "Lửa Nhỏ": nút lửa trên thanh trên, bảng lịch tháng (đóng băng / phá băng,
 * mốc thưởng, câu chuyện) và màn chúc mừng khi chạm mốc. Luật ở packages/shared/eduStreak.js.
 */

// Màu ngọn lửa theo chương — lửa lớn và sáng dần; đóng băng thì xanh lạnh.
const LOOK = {
  ember: ["#b9aca2", "#e4dad2", 0.62], spark: ["#ff9600", "#ffd84d", 0.7], candle: ["#ff8a00", "#ffd84d", 0.78],
  campfire: ["#ff6b00", "#ffc800", 0.86], torch: ["#ff5a1f", "#ffc800", 0.92], lantern: ["#ff4b4b", "#ffc800", 0.95],
  bonfire: ["#ff3d2e", "#ffb800", 1], lighthouse: ["#ff6b00", "#fff1a8", 1], phoenix: ["#ff3d6e", "#ffc800", 1],
  sun: ["#ffb300", "#fff1a8", 1], star: ["#ffd000", "#ffffff", 1],
};

export function FlameBuddy({ stage = "spark", frozen = false, size = 120, className = "" }) {
  const [outer, inner, scale] = frozen ? ["#8fd3f4", "#e3f6fd", LOOK[stage]?.[2] || 0.8] : LOOK[stage] || LOOK.spark;
  const asleep = stage === "ember" || frozen;
  return (
    <svg className={`flame-buddy${frozen ? " is-frozen" : ""} ${className}`} width={size} height={size * 1.2} viewBox="0 0 100 120" aria-hidden="true">
      {/* Đạo cụ theo chương: nến, củi, cán đuốc, khung đèn lồng */}
      {stage === "candle" && <rect x="38" y="96" width="24" height="22" rx="4" fill="#fff3c4" stroke="#e9c46a" strokeWidth="3" />}
      {["campfire", "bonfire"].includes(stage) && <><rect x="18" y="104" width="64" height="10" rx="5" fill="#8d5a2b" transform="rotate(-12 50 109)" /><rect x="18" y="104" width="64" height="10" rx="5" fill="#a86b35" transform="rotate(12 50 109)" /></>}
      {stage === "torch" && <rect x="44" y="96" width="12" height="24" rx="4" fill="#8d5a2b" />}
      {stage === "lantern" && <rect x="16" y="14" width="68" height="100" rx="18" fill="none" stroke="#3c3c3c" strokeWidth="4" />}
      {["sun", "star", "phoenix", "lighthouse"].includes(stage) && !frozen && (
        <g className="flame-rays">{[0, 45, 90, 135, 180, 225, 270, 315].map((r) => <rect key={r} x="48" y="0" width="4" height="12" rx="2" fill={inner} transform={`rotate(${r} 50 62)`} />)}</g>
      )}
      <g className="flame-body" style={{ transformOrigin: "50% 100%", transform: `scale(${scale})`, "--s": scale }}>
        <path d="M50 10C64 32 84 46 82 74C80 98 66 110 50 110C34 110 20 98 18 74C16 50 38 36 50 10Z" fill={outer} />
        <path d="M50 46C58 58 68 66 67 82C66 96 59 102 50 102C41 102 34 96 33 82C32 68 43 60 50 46Z" fill={inner} />
        {asleep ? (
          <g stroke="#3c3c3c" strokeWidth="3" strokeLinecap="round" fill="none"><path d="M37 74q4 4 8 0" /><path d="M55 74q4 4 8 0" /></g>
        ) : (
          <g className="flame-eyes"><circle cx="41" cy="73" r="5" fill="#3c3c3c" /><circle cx="59" cy="73" r="5" fill="#3c3c3c" /><circle cx="43" cy="71" r="1.6" fill="#fff" /><circle cx="61" cy="71" r="1.6" fill="#fff" /></g>
        )}
        <path d={frozen ? "M44 88q6 -4 12 0" : "M43 85q7 7 14 0"} stroke="#3c3c3c" strokeWidth="3" strokeLinecap="round" fill="none" />
        {!asleep && <><circle cx="33" cy="82" r="4" fill="#ff86d0" opacity=".6" /><circle cx="67" cy="82" r="4" fill="#ff86d0" opacity=".6" /></>}
      </g>
      {frozen && <rect x="10" y="20" width="80" height="96" rx="16" fill="#cdeefc" fillOpacity=".55" stroke="#8fd3f4" strokeWidth="3" />}
    </svg>
  );
}

/** Nút lửa trên thanh trên/cột phải. Xám khi hôm nay chưa học, xanh băng khi đang đóng băng. */
export function StreakChip({ streak, onOpen }) {
  const { t } = useEduText();
  const count = streak?.count || 0;
  const state = streak?.frozenNow && !streak.studiedToday ? "frozen" : streak?.studiedToday ? "lit" : "idle";
  return (
    <button type="button" className={`edu-chip edu-streak-chip is-${state}`} onClick={onOpen} aria-label={t("streak.chip", { n: count })}>
      <FlameBuddy stage={streak?.stage || "ember"} frozen={state === "frozen"} size={24} />
      <b>{count}</b>
    </button>
  );
}

const pad = (n) => String(n).padStart(2, "0");

function MonthCalendar({ streak, month, onThaw, busy }) {
  const { t } = useEduText();
  const [y, m] = month.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const lead = (first.getUTCDay() + 6) % 7; // thứ Hai đứng đầu
  const total = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells = [...Array(lead).fill(null), ...Array.from({ length: total }, (_, i) => `${month}-${pad(i + 1)}`)];
  const studied = new Set(streak.studied);
  const frozen = new Set(streak.frozen);
  const thawed = new Set(streak.thawed);
  return (
    <div className="streak-cal">
      {t("streak.week").map((d) => <span key={d} className="streak-cal-head">{d}</span>)}
      {cells.map((day, i) => {
        if (!day) return <span key={`x${i}`} />;
        const kind = studied.has(day) ? "lit" : thawed.has(day) ? "thawed" : frozen.has(day) ? "frozen" : "";
        const canThaw = kind === "frozen" && streak.count > 0 && day >= streak.start;
        const label = Number(day.slice(8));
        return canThaw ? (
          <button key={day} type="button" className="streak-day is-frozen is-thawable" disabled={busy} onClick={() => onThaw(day)} title={t("streak.thaw", { price: THAW_PRICE })}>{label}</button>
        ) : (
          <span key={day} className={`streak-day${kind ? ` is-${kind}` : ""}${day === streak.today ? " is-today" : ""}`}>{label}</span>
        );
      })}
    </div>
  );
}

export function StreakSheet({ streak, onClose, onUpdate }) {
  const { t } = useEduText();
  const [month, setMonth] = useState(streak.today.slice(0, 7));
  const [busy, setBusy] = useState(false);
  const stageIndex = FLAME_STAGES.findIndex((s) => s.id === streak.stage);
  useEffect(() => {
    const onKey = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const shiftMonth = (by) => {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(Date.UTC(y, m - 1 + by, 1));
    setMonth(`${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`);
  };

  const thaw = async (day) => {
    const ok = await notify.confirm({ title: t("streak.thaw", { price: THAW_PRICE }), message: t("streak.thawConfirm", { price: THAW_PRICE, day }), confirmText: t("streak.thaw", { price: THAW_PRICE }) });
    if (!ok) return;
    setBusy(true);
    try {
      const response = await fetch(`${API_BASE}/joy/edu-streak/thaw`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ day }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || t("streak.thawFailed"));
      playEduSound("boing", { unlock: true });
      notify.success(t("streak.thawDone"));
      onUpdate(data);
    } catch (error) {
      notify.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  const [title, line] = t(`streak.stages.${streak.stage}`);
  return (
    <div className="edu-sheet" role="dialog" aria-modal="true" aria-label={t("streak.title")} onClick={onClose}>
      <div className="edu-sheet-card streak-sheet" onClick={(event) => event.stopPropagation()}>
        <div className="streak-hero">
          <FlameBuddy stage={streak.stage} frozen={streak.frozenNow && !streak.studiedToday} size={110} className="is-alive" />
          <div>
            <b className="streak-count">{streak.count}<small> {t("streak.days")}</small></b>
            <span className="streak-stage">{t("streak.name")} · {title}</span>
            <p>{line}</p>
          </div>
        </div>
        <p className={`streak-status${streak.studiedToday ? " is-lit" : ""}`}>
          {streak.frozenNow && !streak.studiedToday ? t("streak.frozenNow") : streak.studiedToday ? t("streak.today") : t("streak.notToday")}
        </p>
        <div className="streak-stats">
          <span><b>{streak.best}</b>{t("streak.best")}</span>
          <span><b>{streak.freezesThisMonth}/{MAX_FREEZES}</b>{t("streak.freezes")}</span>
          <span><b>+{streak.next.joy}</b>{t("streak.next", { d: streak.next.day, joy: streak.next.joy }).split("·")[0]}</span>
        </div>

        <div className="streak-month">
          <button type="button" onClick={() => shiftMonth(-1)} aria-label="‹"><span className="material-symbols-outlined">chevron_left</span></button>
          <b>{new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${month}-01T00:00:00Z`))}</b>
          <button type="button" onClick={() => shiftMonth(1)} disabled={month >= streak.today.slice(0, 7)} aria-label="›"><span className="material-symbols-outlined">chevron_right</span></button>
        </div>
        <MonthCalendar streak={streak} month={month} onThaw={thaw} busy={busy} />
        <p className="streak-legend"><i className="is-lit" />{t("streak.legendStudied")}<i className="is-frozen" />{t("streak.legendFrozen")}<i className="is-thawed" />{t("streak.legendThawed")}</p>
        <p className="streak-rule">{t("streak.rule")}</p>

        <h3>{t("streak.road")}</h3>
        <ol className="streak-road">
          {STREAK_MILESTONES.map(([day, joy]) => (
            <li key={day} className={streak.count >= day ? "is-done" : day === streak.next.day ? "is-next" : ""}>
              <b>{day}</b><span>{joyText(joy)}</span>
            </li>
          ))}
        </ol>

        <h3>{t("streak.story")}</h3>
        <ol className="streak-story">
          {FLAME_STAGES.slice(1).map((stage, i) => {
            const open = i + 1 <= stageIndex;
            const [name, text] = t(`streak.stages.${stage.id}`);
            return (
              <li key={stage.id} className={open ? "is-open" : ""}>
                <FlameBuddy stage={open ? stage.id : "ember"} size={40} />
                <div><b>{open ? name : "• • •"}</b><small>{open ? text : t("streak.locked", { d: stage.from })}</small></div>
              </li>
            );
          })}
        </ol>
        <button type="button" className="edu-btn edu-btn--wide" onClick={onClose}>{t("install.ok")}</button>
      </div>
    </div>
  );
}

/**
 * Màn chúc mừng mốc chuỗi — "video" dựng bằng code: lửa bừng lên, số chuỗi bật ra,
 * tiếng lửa bùng và pháo hoa. Mở bằng sự kiện window "edu:streak-milestone".
 */
export function StreakCelebration({ milestone, stage, onClose }) {
  const { t } = useEduText();
  const scope = useRef(null);
  const [shown, setShown] = useState(Math.max(0, milestone.day - 1));

  useLayoutEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      tl.call(() => playEduSound("whoosh"))
        .from(".cel-flame", { scale: 0.15, y: 80, duration: 0.5, ease: "power2.out", transformOrigin: "50% 100%" })   // lửa bừng lên
        .to(".cel-flame", { scaleY: 1.25, scaleX: 0.85, duration: 0.14, ease: "power2.out" })
        .to(".cel-flame", { scaleY: 1, scaleX: 1, duration: 0.6, ease: "elastic.out(1, 0.35)" })
        .fromTo(".cel-ring", { scale: 0.2, opacity: 0.9 }, { scale: 2.6, opacity: 0, duration: 0.9, stagger: 0.18, ease: "power2.out" }, 0.45)
        .call(() => { setShown(milestone.day); playEduSound("success"); }, null, 0.7)
        .fromTo(".cel-count", { scale: 0.4 }, { scale: 1, duration: 0.6, ease: "back.out(3)" }, 0.7)
        .from(".cel-text > *", { y: 24, opacity: 0, duration: 0.4, stagger: 0.12 }, 0.9);
      if (!reduce) {
        // Pháo hoa: ba đợt bắn từ hai bên rồi giữa, mỗi đợt một tiếng nổ.
        [[1, 0.1, 60], [1.4, 0.9, 120], [1.8, 0.5, 90]].forEach(([at, x, angle]) => tl.call(() => {
          playEduSound("coin");
          confetti({ particleCount: 90, spread: 75, angle, startVelocity: 52, origin: { x, y: 0.75 }, colors: ["#ff9600", "#ffc800", "#ff4b4b", "#29cdff", "#58cc02"], zIndex: 1300 });
        }, null, at));
      }
    }, scope);
    return () => ctx.revert();
  }, [milestone.day]);

  return (
    <div ref={scope} className="streak-celebrate" role="dialog" aria-modal="true" aria-label={t("streak.reached", { n: milestone.day })}>
      <div className="cel-stage">
        <span className="cel-ring" /><span className="cel-ring" /><span className="cel-ring" />
        <div className="cel-flame"><FlameBuddy stage={stage} size={190} className="is-alive" /></div>
        <b className="cel-count">{shown}</b>
      </div>
      <div className="cel-text">
        <h2>{t("streak.reached", { n: milestone.day })}</h2>
        <p className="cel-reward">{t("streak.reward", { joy: milestone.joy })}</p>
        <p>{t(`streak.stages.${stage}`)[1]}</p>
        <button type="button" className="edu-btn edu-btn--light edu-btn--wide" onClick={onClose}>{t("streak.great")}</button>
      </div>
    </div>
  );
}

/** Lắng nghe mốc mới (từ trình học) và hiện màn chúc mừng. */
export function useStreakCelebration() {
  const [event, setEvent] = useState(null);
  useEffect(() => {
    const on = (e) => setEvent(e.detail);
    window.addEventListener("edu:streak-milestone", on);
    return () => window.removeEventListener("edu:streak-milestone", on);
  }, []);
  return useMemo(() => ({ event, close: () => setEvent(null) }), [event]);
}
