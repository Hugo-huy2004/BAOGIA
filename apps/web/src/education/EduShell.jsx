import { useEffect, useMemo, useState } from "react";
import { PersonaAvatar, PersonaGate } from "./EduPersona";
import { Link, NavLink } from "react-router-dom";
import HugoLogo from "../components/HugoLogo";
import { notify } from "../lib/notify";
import { joyText } from "../lib/joyDisplay";
import { useStandalone } from "../hooks/usePWA";
import { detectInstallTarget } from "../config/platform";
import { useCoderLessons } from "../hooks/useCoderLessons";
import { API_BASE } from "../config/apiBase";
import { ACCOUNT_EXTENSION, EXCHANGE_TAX_RATE } from "../../../../packages/shared/joyPrices";
import { CODER_JOY_PER_CORRECT } from "../../../../packages/shared/coderProgression";
import { canPromptInstall, promptInstall } from "./eduHead";
import { rich, useEduText } from "./eduText";
import { FlameBuddy, StreakChip } from "./EduStreak";
import { useLocation, useNavigate } from "react-router-dom";

const STUDIO = "https://www.hugowishpax.studio";
const NAV = [
  { to: "/learn", icon: "school", key: "learn" },
  { to: "/progress", icon: "monitoring", key: "progress" },
  { to: "/store", icon: "storefront", key: "store" },
  { to: "/profile", icon: "person", key: "profile" },
  { to: "/settings", icon: "settings", key: "settings" },
];

// Mã Nhịp tải về theo chặng (public/downloads/coding) — mở khi xong chặng đó.
const CODE_ZIPS = [
  "nhip-chang1-html-css-js.zip", "nhip-chang2-php-mysql.zip", "nhip-chang3-mang-xa-hoi.zip",
  "nhip-chang4-bao-mat.zip", "nhip-chang5-hoan-thien.zip", "nhip-hoan-chinh.zip",
];

const DAY_MS = 24 * 60 * 60 * 1000;
const daysLeft = (deadline) => (deadline ? Math.ceil((new Date(deadline).getTime() - Date.now()) / DAY_MS) : null);

/** "EDUCATION HUGO", dưới là "thuộc [giọt nước] Hugo Studio". */
export function EduBrand({ to = "/learn" }) {
  const { t } = useEduText();
  return (
    <Link to={to} className="edu-brand" aria-label={t("brand.aria")}>
      <img src="/edu/buddy-learn.svg" alt="" className="edu-brand-mark" />
      <span className="edu-brand-text">
        <b>EDUCATION HUGO</b>
        <small>{t("brand.of")} <HugoLogo className="h-3.5 w-3.5" aria-hidden="true" /> Hugo Studio</small>
      </span>
    </Link>
  );
}

/**
 * Nút cài app: máy tính có hộp cài thật thì mở luôn, còn lại sang trang /install
 * (video mascot + từng bước). Video dựng bằng scripts/video/edu-install/render.mjs.
 */
export function EduInstall({ className = "edu-btn edu-btn--ghost" }) {
  const { t } = useEduText();
  const standalone = useStandalone();
  const navigate = useNavigate();
  if (standalone) return null;
  const target = detectInstallTarget();
  const onClick = async () => {
    if (!(target.iOS || target.android) && (await promptInstall())) return;
    navigate("/install");
  };
  return (
    <button type="button" className={className} onClick={onClick}>
      <span className="material-symbols-outlined" aria-hidden="true">install_mobile</span> {t("install.button")}
    </button>
  );
}

const INSTALL_STEPS = {
  ios: [["language", "install.ios1"], ["ios_share", "install.ios2"], ["add_box", "install.ios3"], ["check_circle", "install.ios4"]],
  android: [["language", "install.android1"], ["more_vert", "install.android2"], ["install_mobile", "install.android3"]],
};

/**
 * Trang cài app (/install). Điện thoại dùng trình duyệt cũng bị đưa về đây ở mọi trang
 * học: Education Hugo chỉ học trong app (chủ dự án quyết định 31/10).
 */
export function EduInstallGate() {
  const { t, lang } = useEduText();
  const target = detectInstallTarget();
  const [os, setOs] = useState(target.android ? "android" : "ios");
  return (
    <div className="edu-gate">
      <header className="edu-gate-top">
        <EduBrand to="/" />
        <Link className="edu-gate-back" to="/" aria-label={t("install.back")}>
          <span className="material-symbols-outlined" aria-hidden="true">close</span>
        </Link>
      </header>
      <main className="edu-gate-main">
        <div className="edu-gate-phone">
          <video src={`/edu/video/install-${lang}.mp4`} poster={`/edu/video/install-${lang}.jpg`} controls autoPlay playsInline />
        </div>
        <div className="edu-gate-copy">
          <h1>{t("install.title")}</h1>
          <p className="edu-gate-lead">{t("install.lead")}</p>
          {target.inApp && <p className="edu-alert">{t("install.inApp")}</p>}
          {canPromptInstall() && <button type="button" className="edu-btn edu-btn--wide" onClick={() => promptInstall()}>{t("install.now")}</button>}
          <section className="edu-gate-card">
            <h2>{t("install.stepsTitle")}</h2>
            <div className="edu-gate-tabs" role="tablist">
              {["ios", "android"].map((id) => (
                <button key={id} type="button" role="tab" aria-selected={os === id} className={os === id ? "is-on" : ""} onClick={() => setOs(id)}>{t(`install.${id}`)}</button>
              ))}
            </div>
            <ol className="edu-gate-steps">
              {INSTALL_STEPS[os].map(([icon, key], i) => (
                <li key={key}>
                  <span className="edu-gate-num">{i + 1}</span>
                  <span>{rich(t(key))}</span>
                  <span className="material-symbols-outlined" aria-hidden="true">{icon}</span>
                </li>
              ))}
            </ol>
            <p className="edu-gate-done">{t("install.done")}</p>
          </section>
          <ul className="edu-gate-why">
            {[["home_app_logo", "why1"], ["fullscreen", "why2"], ["local_fire_department", "why3"]].map(([icon, key]) => (
              <li key={key}><span className="material-symbols-outlined" aria-hidden="true">{icon}</span>{t(`install.${key}`)}</li>
            ))}
          </ul>
          <Link className="edu-link" to="/">{t("install.back")}</Link>
        </div>
      </main>
    </div>
  );
}

/** Số liệu dùng chung cho thanh trên (điện thoại) và cột phải (máy tính). */
function useLearnerStats(learner) {
  const { courses, stages } = useCoderLessons(null);
  return useMemo(() => {
    const done = new Set(learner?.completedLessons || []);
    const ids = courses.map((course) => course.id);
    const stageRows = stages.map((stage, index) => {
      const stepIds = ids.slice(stage.from, stage.to);
      const finished = stepIds.filter((id) => done.has(id)).length;
      return { ...stage, index, total: stepIds.length, finished, complete: stepIds.length > 0 && finished === stepIds.length };
    });
    const scores = Object.values(learner?.hugoCoderExamScores || {}).map((entry) => Number(entry?.best) || 0);
    return {
      done: ids.filter((id) => done.has(id)).length,
      total: ids.length,
      current: stageRows.find((row) => !row.complete) || stageRows.at(-1) || null,
      stages: stageRows,
      average: scores.length ? Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length) : null,
      days: daysLeft(learner?.accessExpiresAt),
    };
  }, [courses, stages, learner]);
}

function StatChip({ icon, tone, children, label, to }) {
  const body = (
    <>
      <span className={`material-symbols-outlined edu-chip-icon edu-tone-${tone}`} aria-hidden="true">{icon}</span>
      <b>{children}</b>
    </>
  );
  return to
    ? <Link to={to} className="edu-chip" aria-label={label}>{body}</Link>
    : <span className="edu-chip" aria-label={label}>{body}</span>;
}

export default function EduShell({ view, learner, signedIn, onLearnerUpdate, children }) {
  const { t } = useEduText();
  const stats = useLearnerStats(learner);
  const streak = learner?.edu?.streak;
  const location = useLocation();
  const navigate = useNavigate();
  // ?streak=1 (thông báo đẩy cũ) → màn chuỗi lửa.
  useEffect(() => {
    if (new URLSearchParams(location.search).has("streak")) navigate("/streak", { replace: true });
  }, [location.search, navigate]);
  const openStreak = () => navigate("/streak");
  const nav = NAV.map((item) => ({ ...item, label: t(`nav.${item.key}`), to: signedIn || item.to === "/learn" ? item.to : "/login" }));

  const chips = (
    <>
      {signedIn && streak
        ? <StreakChip streak={streak} onOpen={openStreak} />
        : <StatChip icon="local_fire_department" tone="orange" label={t("streak.title")} to="/login">0</StatChip>}
      {signedIn && <StatChip icon="diamond" tone="blue" label={t("shell.balance", { joy: joyText(learner?.joyBalance || 0) })} to="/store">{joyText(learner?.joyBalance || 0).replace(" JOY", "")}</StatChip>}
      {signedIn && !learner?.isEduVerified && stats.days !== null && (
        <StatChip icon="event_available" tone={stats.days <= 3 ? "red" : "green"} label={t("shell.daysLeft", { n: stats.days })} to="/store">{Math.max(0, stats.days)}</StatChip>
      )}
    </>
  );

  return (
    <div className={`edu-app edu-view-${view}`}>
      <aside className="edu-side">
        <EduBrand />
        <nav aria-label="Education Hugo">
          {nav.map((item) => (
            <NavLink key={item.key} to={item.to} className={({ isActive }) => `edu-nav${isActive && item.to !== "/login" ? " is-active" : ""}`}>
              <span className="material-symbols-outlined" aria-hidden="true">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="edu-side-foot">
          <EduInstall className="edu-nav" />
          <a className="edu-nav" href={STUDIO} target="_blank" rel="noopener">
            <HugoLogo className="h-6 w-6" aria-hidden="true" /> Hugo Studio
          </a>
        </div>
      </aside>

      <header className="edu-top">
        <EduBrand />
        <div className="edu-top-chips">{chips}</div>
      </header>

      <main className="edu-main">
        {children}
        {view === "progress" && signedIn && <div className="edu-rail-inline"><Rail learner={learner} signedIn stats={stats} /></div>}
      </main>

      <aside className="edu-rail">
        <div className="edu-rail-chips">{chips}</div>
        <Rail learner={learner} signedIn={signedIn} stats={stats} onStreak={openStreak} />
      </aside>

      <nav className="edu-tabs" aria-label="Education Hugo">
        {nav.map((item) => (
          <NavLink key={item.key} to={item.to} className={({ isActive }) => (isActive && item.to !== "/login" ? "is-active" : "")} aria-label={item.label}>
            <span className="material-symbols-outlined" aria-hidden="true">{item.icon}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

function Rail({ learner, signedIn, stats, onStreak }) {
  const { t } = useEduText();
  if (!signedIn) {
    return (
      <section className="edu-card edu-card--cta">
        <img src="/edu/buddy-correct.svg" alt="" width="72" height="72" />
        <h2>{t("shell.ctaTitle")}</h2>
        <p>{t("shell.ctaBody")}</p>
        <Link className="edu-btn" to="/login">{t("shell.ctaButton")}</Link>
      </section>
    );
  }
  const { current } = stats;
  const zips = stats.stages.filter((row) => row.complete);
  const today = learner?.edu?.today;
  const streak = learner?.edu?.streak;
  return (
    <>
      {streak && (
        <button type="button" className="edu-card edu-card--streak" onClick={onStreak}>
          <FlameBuddy stage={streak.stage} frozen={streak.frozenNow && !streak.studiedToday} size={56} className="is-alive" />
          <div>
            <b>{t("streak.chip", { n: streak.count })}</b>
            <small>{streak.studiedToday ? t("streak.today") : t("streak.notToday")}</small>
            <small>{t("streak.next", { d: streak.next.day, joy: streak.next.joy })}</small>
          </div>
        </button>
      )}
      {today && (
        <section className={`edu-card${today.done >= today.goal ? " edu-card--done" : ""}`}>
          <header><h2>{t("shell.goalTitle")}</h2><Link to="/settings">{t("shell.edit")}</Link></header>
          <div className="edu-bar" aria-label={`${Math.min(today.done, today.goal)}/${today.goal} step`}><i style={{ width: `${Math.min(100, (today.done / today.goal) * 100)}%` }} /></div>
          <p className="edu-card-meta">{today.done >= today.goal ? t("shell.goalDone") : t("shell.goalToday", { done: today.done, goal: today.goal })}</p>
        </section>
      )}
      {current && (
        <section className="edu-card">
          <header><h2>{current.code || t("common.stage", { n: current.phaseNumber })}</h2><Link to="/learn">{t("shell.continue")}</Link></header>
          <p className="edu-card-sub">{String(current.title || "").replace(/^CODE \d+ · /, "")}</p>
          <div className="edu-bar" aria-label={`${current.finished}/${current.total} step`}><i style={{ width: `${current.total ? (current.finished / current.total) * 100 : 0}%` }} /></div>
          <p className="edu-card-meta">{t("shell.inStage", { done: current.finished, total: current.total })}</p>
        </section>
      )}
      {!learner?.isEduVerified && stats.days !== null && (
        <section className={`edu-card${stats.days <= 3 ? " edu-card--warn" : ""}`}>
          <header><h2>{t("shell.keepTitle")}</h2><Link to="/store">{t("shell.renew")}</Link></header>
          <p>{stats.days > 0 ? t("shell.keepLeft", { n: stats.days }) : t("shell.expired")} {t("shell.keepRule", { days: ACCOUNT_EXTENSION.days, price: joyText(ACCOUNT_EXTENSION.priceJoy), joy: CODER_JOY_PER_CORRECT })}</p>
        </section>
      )}
      <section className="edu-card">
        <header><h2>{t("shell.codeTitle")}</h2></header>
        {zips.length ? (
          <ul className="edu-zips">
            {zips.map((row) => (
              <li key={row.id}><a href={`/downloads/coding/${CODE_ZIPS[row.index]}`} download><span className="material-symbols-outlined" aria-hidden="true">folder_zip</span>{row.code || t("common.stage", { n: row.phaseNumber })}</a></li>
            ))}
          </ul>
        ) : <p>{t("shell.codeEmpty")}</p>}
      </section>
      {stats.average !== null && (
        <section className="edu-card">
          <header><h2>{t("shell.scoreTitle")}</h2><Link to="/progress">{t("shell.view")}</Link></header>
          <p className="edu-big">{stats.average}%</p>
          <p className="edu-card-meta">{t("shell.scoreMeta")}</p>
        </section>
      )}
    </>
  );
}

/** Cửa hàng riêng của Education Hugo: duy trì tài khoản bằng JOY. */
export function EduStore({ learner, onLearnerUpdate }) {
  const { t } = useEduText();
  const [busy, setBusy] = useState(false);
  const days = daysLeft(learner?.accessExpiresAt);
  const tax = Math.floor(ACCOUNT_EXTENSION.priceJoy * EXCHANGE_TAX_RATE);
  const total = ACCOUNT_EXTENSION.priceJoy + tax;
  const balance = Number(learner?.joyBalance) || 0;

  const buy = async () => {
    const ok = await notify.confirm({
      title: t("store.confirmTitle", { days: ACCOUNT_EXTENSION.days }),
      message: t("store.confirmBody", { price: joyText(ACCOUNT_EXTENSION.priceJoy), tax: joyText(tax), total: joyText(total) }),
      confirmText: t("store.confirmButton", { total: joyText(total) }),
    });
    if (!ok) return;
    setBusy(true);
    try {
      const response = await fetch(`${API_BASE}/joy/extend-account`, { method: "POST", credentials: "include" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || t("store.failed"));
      onLearnerUpdate({ joyBalance: data.balance, accessExpiresAt: data.accessExpiresAt });
      notify.success(t("store.renewed", { n: data.days }));
    } catch (error) {
      notify.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="edu-page">
      <h1 className="edu-page-title">{t("store.title")}</h1>
      <div className="edu-wallet">
        <span className="material-symbols-outlined edu-tone-blue" aria-hidden="true">diamond</span>
        <div><b>{joyText(balance)}</b><small>{t("store.wallet")}</small></div>
      </div>

      {learner?.isEduVerified ? (
        <article className="edu-offer">
          <img src="/edu/buddy-done.svg" alt="" width="88" height="88" />
          <div>
            <h2>{t("store.verifiedTitle")}</h2>
            <p>{t("store.verifiedBody", { left: days !== null ? t("store.verifiedLeft", { n: days }) : "" })}</p>
          </div>
        </article>
      ) : (
        <>
          <article className="edu-offer">
            <img src="/edu/buddy-learn.svg" alt="" width="88" height="88" />
            <div>
              <h2>{t("store.offerTitle", { days: ACCOUNT_EXTENSION.days })}</h2>
              <p>{days === null ? "" : days > 0 ? t("store.current", { n: days }) : t("store.expired")}{t("store.chain")}</p>
              <p className="edu-price">{joyText(ACCOUNT_EXTENSION.priceJoy)} <small>{t("store.fee", { tax: joyText(tax) })}</small></p>
            </div>
            <button type="button" className="edu-btn" disabled={busy || balance < total} onClick={buy}>
              {balance < total ? t("store.notEnough") : busy ? t("store.renewing") : t("store.exchange")}
            </button>
          </article>
          <article className="edu-offer edu-offer--soft">
            <span className="material-symbols-outlined edu-offer-icon" aria-hidden="true">verified</span>
            <div>
              <h2>{t("store.studentTitle")}</h2>
              <p>{t("store.studentBody")}</p>
            </div>
            <a className="edu-btn edu-btn--ghost" href={`${STUDIO}/login?redirect=${encodeURIComponent("/member/account")}`} target="_blank" rel="noopener">{t("store.verify")}</a>
          </article>
        </>
      )}

      <h2 className="edu-subhead">{t("store.earnTitle")}</h2>
      <ul className="edu-earn">
        <li><span className="material-symbols-outlined" aria-hidden="true">task_alt</span>{rich(t("store.earnFirst", { joy: CODER_JOY_PER_CORRECT }))}</li>
        <li><span className="material-symbols-outlined" aria-hidden="true">replay</span>{t("store.earnReplay")}</li>
      </ul>
    </section>
  );
}

function Stat({ icon, tone, value, label }) {
  return (
    <div className="edu-stat">
      <span className={`material-symbols-outlined edu-tone-${tone}`} aria-hidden="true">{icon}</span>
      <div><b>{value}</b><small>{label}</small></div>
    </div>
  );
}

/** Hồ sơ: một tài khoản Hugo Studio dùng cho cả hai nơi. */
export function EduProfile({ learner, persona, onPersona, onSignOut }) {
  const { t } = useEduText();
  const [editing, setEditing] = useState(false);
  const stats = useLearnerStats(learner);
  const days = stats.days;
  const [installable, setInstallable] = useState(false);
  useEffect(() => {
    const on = () => setInstallable(true);
    window.addEventListener("edu:installable", on);
    return () => window.removeEventListener("edu:installable", on);
  }, []);

  return (
    <section className="edu-page">
      <h1 className="edu-page-title">{t("profile.title")}</h1>
      <div className="edu-profile">
        <PersonaAvatar avatar={persona?.avatar} name={persona?.nickname || learner?.displayName} size={72} />
        <div>
          <b className={persona?.nickname ? "nick-font" : ""}>{persona?.nickname || learner?.displayName || t("profile.learner")}</b>
          <small>{learner?.email}</small>
        </div>
        <button type="button" className="edu-btn is-ghost" onClick={() => setEditing(true)}>{t("persona.edit")}</button>
      </div>

      {editing && <PersonaGate editOnly email={learner?.email} current={persona} onDone={(saved) => { if (saved) onPersona(saved); setEditing(false); }} />}
      <div className="edu-stats">
        <Stat icon="local_fire_department" tone="orange" value={learner?.edu?.streak?.count ?? 0} label={t("streak.title")} />
        <Stat icon="task_alt" tone="blue" value={`${stats.done}/${stats.total || 26}`} label={t("profile.steps")} />
        <Stat icon="diamond" tone="blue" value={joyText(learner?.joyBalance || 0).replace(" JOY", "")} label="JOY" />
        <Stat icon="military_tech" tone="green" value={stats.average === null ? "—" : `${stats.average}%`} label={t("profile.average")} />
        <Stat icon="event_available" tone={!learner?.isEduVerified && days !== null && days <= 3 ? "red" : "green"} value={learner?.isEduVerified ? t("common.oneYear") : days === null ? "—" : Math.max(0, days)} label={learner?.isEduVerified ? t("profile.verified") : t("profile.left")} />
      </div>

      <dl className="edu-facts">
        <dt>{t("profile.account")}</dt>
        <dd>{t("profile.accountBody")}</dd>
        <dt>{t("profile.keep")}</dt>
        <dd>{learner?.isEduVerified ? t("profile.keepVerified") : days === null ? "—" : days > 0 ? t("profile.keepLeft", { n: days }) : t("profile.keepExpired")}</dd>
      </dl>

      <div className="edu-actions">
        <a className="edu-btn" href={`${STUDIO}/login?redirect=${encodeURIComponent("/member")}`} target="_blank" rel="noopener">{t("profile.openStudio")}</a>
        {(installable || detectInstallTarget().iOS) && <EduInstall />}
        <button type="button" className="edu-btn edu-btn--ghost" onClick={onSignOut}>{t("profile.signOut")}</button>
      </div>
      <p className="edu-legal">
        <a href={`${STUDIO}/terms`} target="_blank" rel="noopener">{t("common.terms")}</a> · <a href={`${STUDIO}/privacy-policy`} target="_blank" rel="noopener">{t("common.privacy")}</a> · <a href={`${STUDIO}/support-request`} target="_blank" rel="noopener">{t("common.support")}</a>
      </p>
    </section>
  );
}
