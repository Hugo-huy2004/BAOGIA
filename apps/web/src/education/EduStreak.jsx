import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import confetti from "canvas-confetti";
import { notify } from "../lib/notify";
import { API_BASE } from "../config/apiBase";
import { MAX_FREEZES, THAW_PRICE } from "../../../../packages/shared/eduStreak";
import { NICKNAME_MAX, checkNickname } from "../../../../packages/shared/eduNickname";
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
      {frozen && (
        <g className="flame-frost" stroke="#e3f6fd" strokeWidth="3" strokeLinecap="round">
          {[[16, 34], [84, 48], [22, 96]].map(([x, y]) => <g key={x} transform={`translate(${x} ${y})`}><path d="M0 -7V7M-6 -3.5L6 3.5M-6 3.5L6 -3.5" /></g>)}
        </g>
      )}
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

/** Đặt/sửa biệt danh — bắt buộc để có tên trên bảng thi đua. Máy chủ kiểm lại cùng luật. */
function NicknameCard({ current, onSaved, call }) {
  const { t } = useEduText();
  const [editing, setEditing] = useState(!current);
  const [value, setValue] = useState(current);
  const [busy, setBusy] = useState(false);
  const checked = checkNickname(value);
  const save = async (event) => {
    event.preventDefault();
    if (!checked.ok) return;
    setBusy(true);
    try { onSaved(await call("edu-nickname", { method: "PUT", body: JSON.stringify({ nickname: checked.value }) })); notify.success(t("streak.social.nickSaved")); setEditing(false); }
    catch (error) { notify.error(t(`streak.social.${error.message}`) === `streak.social.${error.message}` ? error.message : t(`streak.social.${error.message}`)); }
    finally { setBusy(false); }
  };
  if (!editing) {
    return (
      <button type="button" className="streak-nick-chip" onClick={() => setEditing(true)}>
        <small>{t("streak.social.nickLabel")}</small><b className="nick-font">{current}</b>
        <span className="material-symbols-outlined" aria-hidden="true">edit</span>
      </button>
    );
  }
  return (
    <form className="streak-nick" onSubmit={save}>
      <b>{t("streak.social.nickTitle")}</b>
      <div className="streak-add">
        <input className="nick-font" value={value} onChange={(event) => setValue(event.target.value)} maxLength={NICKNAME_MAX * 4} placeholder={t("streak.social.nickPlaceholder")} aria-label={t("streak.social.nickLabel")} autoComplete="off" />
        <button type="submit" disabled={busy || !checked.ok}>{t("streak.social.nickSave")}</button>
      </div>
      <small className={value && !checked.ok ? "is-error" : ""}>{value && !checked.ok ? t(`streak.social.${checked.code}`) : t("streak.social.nickHint")}</small>
    </form>
  );
}

/** Thi đua tuần + bạn bè (kiểu Duolingo). Mọi con số do máy chủ trả (/joy/edu-social). */
function StreakSocial() {
  const { t } = useEduText();
  const [tab, setTab] = useState("league");
  const [data, setData] = useState(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const call = async (path, init) => {
    const response = await fetch(`${API_BASE}/joy/${path}`, { credentials: "include", ...init, headers: { "Content-Type": "application/json" } });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || t("streak.social.loadFailed"));
    return body;
  };
  useEffect(() => {
    call("edu-social").then(setData).catch(() => setData({ failed: true }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const follow = async (event) => {
    event.preventDefault();
    setBusy(true);
    try { setData(await call("edu-friends", { method: "POST", body: JSON.stringify({ code }) })); setCode(""); }
    catch (error) { notify.error(error.message); }
    finally { setBusy(false); }
  };
  const unfollow = async (friend) => {
    try { setData(await call(`edu-friends/${encodeURIComponent(friend)}`, { method: "DELETE" })); }
    catch (error) { notify.error(error.message); }
  };
  const copy = () => navigator.clipboard?.writeText(data.code).then(() => notify.success(t("streak.social.copied"))).catch(() => {});
  const rows = tab === "league" ? data?.league : data?.friends;

  return (
    <div className="streak-social">
      <div className="streak-tabs" role="tablist">
        {["league", "friends"].map((id) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? "is-on" : ""} onClick={() => setTab(id)}>
            <span className="material-symbols-outlined" aria-hidden="true">{id === "league" ? "leaderboard" : "group"}</span>{t(`streak.social.${id}`)}
          </button>
        ))}
      </div>
      {data && !data.failed && <NicknameCard key={data.nickname} current={data.nickname} onSaved={setData} call={call} />}
      {tab === "league" && <p className="streak-social-hint">{t("streak.social.leagueHint")}</p>}
      {tab === "friends" && data?.code && (
        <div className="streak-friend-tools">
          <button type="button" className="streak-code" onClick={copy} aria-label={t("streak.social.yourCode")}>
            <small>{t("streak.social.yourCode")}</small><b translate="no">{data.code}</b>
            <span className="material-symbols-outlined" aria-hidden="true">content_copy</span>
          </button>
          <form className="streak-add" onSubmit={follow}>
            <input value={code} onChange={(event) => setCode(event.target.value.toUpperCase().slice(0, 6))} placeholder={t("streak.social.codePlaceholder")} aria-label={t("streak.social.codePlaceholder")} autoCapitalize="characters" autoComplete="off" spellCheck={false} />
            <button type="submit" disabled={busy || code.length !== 6}>{t("streak.social.follow")}</button>
          </form>
        </div>
      )}
      {!data ? <div className="streak-rows is-loading" aria-busy="true" /> : data.failed ? <p className="streak-social-hint">{t("streak.social.loadFailed")}</p> : (
        <ol className="streak-rows">
          {(rows || []).filter((row) => tab === "league" || !row.me || rows.length > 1).map((row, index) => (
            <li key={`${row.code || row.name}-${index}`} className={row.me ? "is-me" : ""}>
              <span className={`streak-rank${index < 3 && tab === "league" ? ` is-top${index + 1}` : ""}`}>{index + 1}</span>
              <span className="streak-avatar nick-font" aria-hidden="true">{[...(row.name || "?")][0].toUpperCase()}</span>
              <span className="streak-who"><b className={row.name ? "nick-font" : "is-anon"}>{row.name || t("streak.social.noNick")}{row.me ? ` · ${t("streak.social.you")}` : ""}</b><small><span className="material-symbols-outlined" aria-hidden="true">local_fire_department</span>{row.streak}</small></span>
              <b className="streak-xp">{t("streak.social.xp", { n: row.xp })}</b>
              {tab === "friends" && !row.me && (
                <button type="button" className="streak-unfollow" onClick={() => unfollow(row.code)} aria-label={t("streak.social.unfollow")}><span className="material-symbols-outlined">person_remove</span></button>
              )}
            </li>
          ))}
          {!rows?.length || (tab === "friends" && rows.length < 2) ? <li className="streak-empty">{t(tab === "league" ? "streak.social.leagueEmpty" : "streak.social.friendsEmpty")}</li> : null}
        </ol>
      )}
    </div>
  );
}

/**
 * Màn chuỗi lửa (/streak) — trang riêng, không dialog, gọn: ngọn lửa + số ngày, trạng thái
 * hôm nay, 3 con số, lịch tháng (bấm ngày đóng băng để phá băng). Mọi con số do máy chủ tính.
 */
export function StreakScreen({ streak, onUpdate }) {
  const { t } = useEduText();
  const [month, setMonth] = useState(streak.today.slice(0, 7));
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("me");
  const frozen = streak.frozenNow && !streak.studiedToday;

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

  const [title] = t(`streak.stages.${streak.stage}`);
  const mood = frozen ? "frozen" : streak.count ? (streak.studiedToday ? "lit" : "idle") : "empty";
  const monthStudied = [...streak.studied, ...streak.thawed].filter((d) => d.startsWith(month)).length;
  const monthFrozen = streak.frozen.filter((d) => d.startsWith(month)).length;
  const monthLabel = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${month}-01T00:00:00Z`));
  const close = () => (window.history.length > 1 ? window.history.back() : window.location.assign("/learn"));
  return (
    <section className={`streak-page is-${mood}`} aria-label={t("streak.title")}>
      <header className="streak-bar">
        <button type="button" className="streak-close" onClick={close} aria-label={t("common.close")}><span className="material-symbols-outlined">close</span></button>
        <h1>{t("streak.title")}</h1>
        <span aria-hidden="true" />
      </header>
      <div className="streak-tabs-line" role="tablist">
        {["me", "friends"].map((id) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? "is-on" : ""} onClick={() => setTab(id)}>{t(`streak.tab.${id}`)}</button>
        ))}
      </div>

      {tab === "me" ? (
        <>
          <div className="streak-band">
            <div>
              <b className="streak-big">{streak.count}</b>
              <span className="streak-big-sub">{t("streak.daysLong")}</span>
              <small className="streak-band-note">{frozen ? t("streak.frozenNow") : streak.studiedToday ? t("streak.today") : t("streak.notToday")}</small>
            </div>
            <FlameBuddy stage={streak.count ? streak.stage : "ember"} frozen={frozen} size={132} className="is-alive" />
          </div>
          <div className="streak-body">
            <div className="streak-month">
              <b>{monthLabel}</b>
              <span>
                <button type="button" onClick={() => shiftMonth(-1)} aria-label="‹"><span className="material-symbols-outlined">chevron_left</span></button>
                <button type="button" onClick={() => shiftMonth(1)} disabled={month >= streak.today.slice(0, 7)} aria-label="›"><span className="material-symbols-outlined">chevron_right</span></button>
              </span>
            </div>
            <div className="streak-pair">
              <span><i className="material-symbols-outlined is-lit" aria-hidden="true">check_circle</i><b>{monthStudied}</b><small>{t("streak.monthStudied")}</small></span>
              <span><i className="material-symbols-outlined is-ice" aria-hidden="true">ac_unit</i><b>{monthFrozen}</b><small>{t("streak.monthFrozen")}</small></span>
            </div>
            <div className="streak-cal-card">
              <MonthCalendar streak={streak} month={month} onThaw={thaw} busy={busy} />
            </div>
            <div className="streak-goal">
              <span className="material-symbols-outlined" aria-hidden="true">flag</span>
              <p><b>{t("streak.next", { d: streak.next.day, joy: streak.next.joy })}</b><small>{t("streak.name")} · {title} · {t("streak.best")} {streak.best}</small></p>
            </div>
            <p className="streak-rule">{t("streak.rule")}</p>
            <RiveCredit />
          </div>
        </>
      ) : (
        <div className="streak-body"><StreakSocial /></div>
      )}
    </section>
  );
}

/**
 * Ngọn lửa Rive (public/edu/rive/spiro-streak.riv, artboard Spiro-v04) cho hoạt cảnh thắp lửa.
 * Runtime WebGL2 + wasm nạp lười, chỉ khi hoạt cảnh mở; lỗi (máy không có WebGL2…) thì
 * gọi onFail để quay về ngọn lửa SVG.
 */
// CC BY 4.0 — bắt buộc ghi công: tên tác phẩm, tác giả, nguồn, giấy phép (không chỉnh sửa tệp).
function RiveCredit() {
  const { t } = useEduText();
  return (
    <p className="rive-credit">
      {t("streak.credit")}: <a href="https://rive.app/marketplace/28749-54458-spiro-streak/" target="_blank" rel="noopener">“Spiro Streak”</a> · Patgrivet ·{" "}
      <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>
    </p>
  );
}

function RiveFlame({ onFail }) {
  const canvas = useRef(null);
  useEffect(() => {
    let rive;
    let dead = false;
    import("@rive-app/webgl2").then(({ Rive, Layout, Fit, RuntimeLoader }) => {
      if (dead) return;
      RuntimeLoader.setWasmUrl("/edu/rive/rive.wasm"); // tự host — không gọi CDN của Rive
      rive = new Rive({
        src: "/edu/rive/spiro-streak.riv", artboard: "Spiro-v04", stateMachines: "State Machine 1",
        canvas: canvas.current, autoplay: true, layout: new Layout({ fit: Fit.Cover }),
        onLoadError: () => !dead && onFail(),
      });
    }).catch(() => !dead && onFail());
    return () => { dead = true; rive?.cleanup(); };
  }, [onFail]);
  return <canvas ref={canvas} className="cel-rive" width={560} height={560} aria-hidden="true" />;
}

/**
 * Hoạt cảnh lửa: "thắp lửa" khi qua bài đầu tiên trong ngày, hoặc chúc mừng mốc (có `joy`).
 * Dựng bằng GSAP: tro → lửa bừng lên, nảy, vòng sáng lan, số chuỗi nhích lên; mốc thì thêm pháo hoa.
 * Mở bằng sự kiện window "edu:streak-milestone" { count, stage, joy? }.
 */
export function StreakCelebration({ count, stage, joy, onClose }) {
  const { t } = useEduText();
  const scope = useRef(null);
  const [shown, setShown] = useState(Math.max(0, count - 1));
  const [lit, setLit] = useState(false);
  const [svgOnly, setSvgOnly] = useState(false);
  const onRiveFail = useCallback(() => setSvgOnly(true), []);

  useLayoutEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { overwrite: "auto" } });
      tl.call(() => playEduSound("whoosh"))
        .from(".cel-flame", { scale: 0.35, y: 40, opacity: 0, duration: 0.45, ease: "power2.out", transformOrigin: "50% 100%" }) // tro đỏ hiện lên
        .to(".cel-spark", { opacity: 1, scale: 1.4, duration: 0.18, ease: "power2.out" })                                           // tia lửa chạm vào
        .call(() => setLit(true))                                                                                                   // bùng cháy
        .to(".cel-spark", { opacity: 0, scale: 2.4, duration: 0.35, ease: "power1.out" })
        .fromTo(".cel-flame", { scaleY: 0.7, scaleX: 1.15 }, { scaleY: 1.18, scaleX: 0.9, duration: 0.18, ease: "power2.out" }, "<")
        .to(".cel-flame", { scaleY: 1, scaleX: 1, duration: 0.8, ease: "elastic.out(1, 0.32)" })
        .fromTo(".cel-ring", { scale: 0.2, opacity: 0.9 }, { scale: 2.6, opacity: 0, duration: 0.9, stagger: 0.16, ease: "power2.out" }, "<-0.2")
        .call(() => { setShown(count); playEduSound("success"); }, null, "<0.1")
        .fromTo(".cel-count", { scale: 0.4 }, { scale: 1, duration: 0.6, ease: "back.out(3)" }, "<")
        .from(".cel-text > *", { y: 24, opacity: 0, duration: 0.4, stagger: 0.1 }, "<0.15");
      if (!reduce) tl.to(".cel-flame", { y: -6, duration: 1.2, ease: "sine.inOut", yoyo: true, repeat: -1 });
      if (!reduce && joy) {
        // Mốc: ba đợt pháo hoa từ hai bên rồi giữa.
        [[1.3, 0.1, 60], [1.7, 0.9, 120], [2.1, 0.5, 90]].forEach(([at, x, angle]) => tl.call(() => {
          playEduSound("coin");
          confetti({ particleCount: 90, spread: 75, angle, startVelocity: 52, origin: { x, y: 0.75 }, colors: ["#ff9600", "#ffc800", "#ff4b4b", "#29cdff", "#58cc02"], zIndex: 1300 });
        }, null, at));
      }
    }, scope);
    return () => ctx.revert();
  }, [count, joy]);

  return (
    <div ref={scope} className="streak-celebrate" role="dialog" aria-modal="true" aria-label={joy ? t("streak.reached", { n: count }) : t("streak.lit")}>
      <div className="cel-stage">
        <span className="cel-ring" /><span className="cel-ring" /><span className="cel-ring" />
        <span className="cel-spark" />
        <div className="cel-flame">{svgOnly ? <FlameBuddy stage={lit ? stage : "ember"} size={190} className="is-alive" /> : <RiveFlame onFail={onRiveFail} />}</div>
        <b className="cel-count">{shown}</b>
      </div>
      <div className="cel-text">
        <h2>{joy ? t("streak.reached", { n: count }) : t("streak.lit")}</h2>
        {joy ? <p className="cel-reward">{t("streak.reward", { joy })}</p> : <p>{t("streak.litBody", { n: count })}</p>}
        <button type="button" className="edu-btn edu-btn--light edu-btn--wide" onClick={onClose}>{t("streak.great")}</button>
        {!svgOnly && <RiveCredit />}
      </div>
    </div>
  );
}

/** Trang /streak: lấy chuỗi của người học; phá băng xong thì cập nhật số dư + mốc. */
export function StreakView({ learner, onLearnerUpdate }) {
  const streak = learner?.edu?.streak;
  if (!streak) return <section className="streak-page" aria-busy="true" />;
  const onUpdate = (data) => {
    onLearnerUpdate?.({ edu: { ...learner.edu, streak: data.streak }, ...(Number.isFinite(data.balance) ? { joyBalance: data.balance } : {}) });
    if (data.milestone) window.dispatchEvent(new CustomEvent("edu:streak-milestone", { detail: { count: data.milestone.day, joy: data.milestone.joy, stage: data.streak.stage } }));
  };
  return <StreakScreen streak={streak} onUpdate={onUpdate} />;
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
