import { useCallback, useEffect, useMemo, useState } from "react";
import { PersonaAvatar, PersonaGate, PersonaInfoForm } from "./EduPersona";
import { Link, NavLink } from "react-router-dom";
import HugoLogo from "../components/HugoLogo";
import { notify } from "../lib/notify";
import { playEduSound } from "./eduSound";
import { joyText } from "../lib/joyDisplay";
import { useStandalone } from "../hooks/usePWA";
import { detectInstallTarget } from "../config/platform";
import { useCoderLessons } from "../hooks/useCoderLessons";
import { API_BASE } from "../config/apiBase";
import { ACCOUNT_EXTENSION, EXCHANGE_TAX_RATE } from "../../../../packages/shared/joyPrices";
import { CODER_JOY_PER_CORRECT } from "../../../../packages/shared/coderProgression";
import { canPromptInstall, promptInstall } from "./eduHead";
import { rich, useEduText } from "./eduText";
import { FlameBuddy } from "./EduStreak";
import { useEduCourse } from "./useEduCourse";
import { legalFor } from "./legalText";
import { supportMailUrl } from "./eduSupport";
import EduTopBar, { JoyCoin, useEduInbox } from "./EduTopBar";
import AnimIcon from "../components/icons/animated/AnimIcon";
import EduSettings from "./EduSettings";
import { FeedbackHistory } from "./EduFeedback";
import { useLocation, useNavigate } from "react-router-dom";

const STUDIO = "https://www.hugowishpax.studio";
const NAV = [
  { to: "/learn", icon: "home", key: "learn" },
  { to: "/progress", icon: "chart", key: "progress" },
  { to: "/friends", icon: "users", key: "friends" },
  { to: "/community", icon: "message", key: "community" },
  { to: "/store", icon: "bag", key: "store" },
  { to: "/profile", icon: "user", key: "profile" },
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
  // Số liệu theo khoá đang học (chọn ở bảng "Khoá học của bạn").
  const { courses, stages } = useCoderLessons(null, { course: useEduCourse() });
  return useMemo(() => {
    const done = new Set(learner?.completedLessons || []);
    const ids = courses.map((course) => course.id);
    const stageRows = stages.map((stage, index) => {
      const stepIds = ids.slice(stage.from, stage.to);
      const finished = stepIds.filter((id) => done.has(id)).length;
      return { ...stage, index, total: stepIds.length, finished, complete: stepIds.length > 0 && finished === stepIds.length };
    });
    const scores = ids.map((id) => learner?.hugoCoderExamScores?.[id]).filter(Boolean).map((entry) => Number(entry?.best) || 0);
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

export default function EduShell({ view, learner, signedIn, onLearnerUpdate, children }) {
  const { t } = useEduText();
  const stats = useLearnerStats(learner);
  const location = useLocation();
  const navigate = useNavigate();
  // ?streak=1 (thông báo đẩy cũ) → màn chuỗi lửa.
  useEffect(() => {
    if (new URLSearchParams(location.search).has("streak")) navigate("/streak", { replace: true });
  }, [location.search, navigate]);
  const openStreak = () => navigate("/streak");
  const nav = NAV.map((item) => ({ ...item, label: t(`nav.${item.key}`), to: signedIn || item.to === "/learn" ? item.to : "/login" }));

  const inbox = useEduInbox(signedIn);
  const chips = <EduTopBar learner={learner} signedIn={signedIn} stats={stats} inbox={inbox} />;

  return (
    <div className={`edu-app edu-view-${view}`}>
      <aside className="edu-side">
        <EduBrand />
        <nav aria-label="Education Hugo">
          {nav.map((item) => (
            <NavLink key={item.key} to={item.to} className={({ isActive }) => `edu-nav${isActive && item.to !== "/login" ? " is-active" : ""}`}>
              <AnimIcon name={item.icon} size={26} />
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

      <header className="edu-top">{chips}</header>

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
            <AnimIcon name={item.icon} size={26} />
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
  // MỘT biểu đồ cho cả tình hình: 4 thanh, mỗi thanh một chỉ số 0–100%.
  const rings = [
    { key: "today", to: "/profile", color: "#58cc02", value: today ? Math.min(1, today.done / today.goal) : 0, text: today ? `${Math.min(today.done, today.goal)}/${today.goal}` : "—" },
    { key: "stage", to: "/learn", color: "#1cb0f6", value: current?.total ? current.finished / current.total : 0, text: current ? `${current.finished}/${current.total}` : "—", label: current?.code },
    { key: "streak", to: "/streak", color: "#ff9600", value: streak?.next?.day ? Math.min(1, streak.count / streak.next.day) : 0, text: streak ? `${streak.count}/${streak.next.day}` : "0" },
    { key: "score", to: "/progress", color: "#ce82ff", value: (stats.average || 0) / 100, text: stats.average === null ? "—" : `${stats.average}%` },
  ];
  return (
    <>
      <section className="edu-card edu-dash">
        {/* Biểu đồ thanh: mỗi chỉ số một thanh dày cùng thang 0–100%, nhìn một lượt là thấy cả tình hình. */}
        <ul className="edu-dash-bars">
          {rings.map((ring, i) => (
            <li key={ring.key}>
              <Link to={ring.to}>
                <span>{ring.label || t(`rail.${ring.key}`)}</span>
                <b style={{ color: ring.color }}>{ring.text}</b>
                <i style={{ "--c": ring.color, "--v": ring.value, "--i": i }} />
              </Link>
            </li>
          ))}
        </ul>
        {!learner?.isEduVerified && stats.days !== null && stats.days <= 3 && (
          <Link className="edu-dash-warn" to="/store">{stats.days > 0 ? t("shell.keepLeft", { n: stats.days }) : t("shell.expired")}</Link>
        )}
        {zips.length > 0 && (
          <div className="edu-dash-zips">
            {zips.map((row) => (
              <a key={row.id} href={`/downloads/coding/${CODE_ZIPS[row.index]}`} download title={t("shell.codeTitle")}>
                <span className="material-symbols-outlined" aria-hidden="true">download</span>{row.code || t("common.stage", { n: row.phaseNumber })}
              </a>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

/** Cửa hàng riêng của Education Hugo: duy trì tài khoản bằng JOY. */
/**
 * Vật phẩm do admin bày bán (tab "Cửa hàng Edu"), mua bằng JOY, có tác dụng ngay:
 * Khiên lửa (tự phá băng lúc 8h), Nhân đôi XP (cộng dồn giờ), Huy hiệu (đeo trên thẻ thành viên).
 */
function EduShop({ balance, onBalance }) {
  const { t, lang } = useEduText();
  const [items, setItems] = useState(null);
  const [perks, setPerks] = useState(null);
  const [busy, setBusy] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const load = useCallback(() => fetch(`${API_BASE}/joy/edu-store`, { credentials: "include" })
    .then((r) => (r.ok ? r.json() : Promise.reject())).then((d) => { setItems(d.items); setPerks(d.perks); }).catch(() => setItems([])), []);
  useEffect(() => { load(); }, [load]);
  const pick = (field) => field?.[lang] || field?.vi || "";
  const post = async (path) => {
    const r = await fetch(`${API_BASE}/joy/edu-store/${path}`, { method: "POST", credentials: "include" });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || t("store.failed"));
    return d;
  };

  const buy = async (item) => {
    const ok = await notify.confirm({ title: t("shop.confirm", { name: pick(item.name) }), message: t(`shop.effect.${item.kind}`, { n: item.value, price: joyText(item.priceJoy) }), confirmText: t("shop.buy") });
    if (!ok) return;
    setBusy(item.id);
    try {
      const d = await post(`${item.id}/buy`);
      onBalance(d.balance);
      setPerks(d.perks);
      playEduSound("coin");
      setReceipt(d.receipt);
      load();
    } catch (error) {
      notify.error(error.message);
    } finally {
      setBusy(null);
    }
  };
  const wear = async (item) => {
    try { const d = await post(`${item.id}/equip`); setPerks((p) => ({ ...p, badge: d.badge })); playEduSound("pop"); } catch (error) { notify.error(error.message); }
  };

  if (!items?.length) return null;
  const hoursLeft = perks?.xpBoostUntil ? Math.max(1, Math.ceil((new Date(perks.xpBoostUntil) - Date.now()) / 3600_000)) : 0;
  const status = (item) => (item.kind === "streak_shield" ? (perks?.shields ? t("shop.shields", { n: perks.shields }) : "")
    : item.kind === "xp_boost" ? (hoursLeft ? t("shop.boostLeft", { n: hoursLeft }) : "") : "");
  const owned = items.filter((i) => i.kind === "badge" && i.ownedAt);
  const num = (x) => Number(x || 0).toLocaleString(lang);
  return (
    <>
      {receipt && (
        <div className="edu-receipt-wrap" role="dialog" aria-modal="true" aria-label={t("shop.receipt.title")} onClick={() => setReceipt(null)}>
          <div className="edu-receipt" onClick={(event) => event.stopPropagation()}>
            <img src="/edu/cast-5.svg" alt="" width="84" height="84" />
            <h2>{t("shop.receipt.title")}</h2>
            <p className="edu-receipt-amount">-{num(receipt.priceJoy)} <JoyCoin size={26} /></p>
            <dl>
              <dt>{t("shop.receipt.code")}</dt><dd translate="no">{receipt.code}</dd>
              <dt>{t("shop.receipt.item")}</dt><dd>{pick(receipt.name)}</dd>
              <dt>{t("shop.receipt.effect")}</dt><dd>{t(`shop.receipt.kinds.${receipt.kind === "collectible" ? "badge" : receipt.kind}`, { n: receipt.value })}</dd>
              <dt>{t("shop.receipt.before")}</dt><dd>{num(receipt.balanceBefore)} JOY</dd>
              <dt>{t("shop.receipt.after")}</dt><dd>{num(receipt.balanceAfter)} JOY</dd>
              <dt>{t("shop.receipt.at")}</dt><dd>{new Date(receipt.createdAt).toLocaleString(lang)}</dd>
            </dl>
            <small>{t("shop.receipt.sent")}</small>
            <button type="button" className="edu-btn edu-btn--wide" onClick={() => setReceipt(null)}>{t("shop.receipt.ok")}</button>
          </div>
        </div>
      )}
      <h2 className="edu-subhead">{t("shop.title")}</h2>
      <div className="edu-shop">
        {items.map((item) => {
          const wearing = item.kind === "badge" && perks?.badge === item.image && item.ownedAt;
          return (
            <article key={item.id} className={`edu-shop-item${item.ownedAt || status(item) ? " is-owned" : ""}`}>
              <img src={item.image} alt="" width="84" height="84" />
              <div>
                <b>{pick(item.name)}</b>
                <p>{pick(item.description)}</p>
                {status(item) && <small className="edu-shop-status">{status(item)}</small>}
                {item.kind === "badge" && item.ownedAt ? (
                  <button type="button" className="edu-shop-price" disabled={wearing} onClick={() => wear(item)}>{t(wearing ? "shop.wearing" : "shop.wear")}</button>
                ) : (
                  <button type="button" className="edu-shop-price" disabled={busy === item.id || item.left === 0 || balance < item.priceJoy} onClick={() => buy(item)}>
                    {item.left === 0 ? t("shop.soldOut") : <><JoyCoin size={22} />{item.priceJoy.toLocaleString(lang)}</>}
                  </button>
                )}
                {item.left !== null && item.left > 0 && !item.ownedAt && <small className="edu-shop-left">{t("shop.left", { n: item.left })}</small>}
              </div>
            </article>
          );
        })}
      </div>
      {owned.length > 0 && (
        <>
          <h2 className="edu-subhead">{t("shop.bag")}</h2>
          <div className="edu-bag">
            {owned.map((i) => (
              <button key={i.id} type="button" className={perks?.badge === i.image ? "is-on" : ""} onClick={() => wear(i)} aria-label={pick(i.name)} title={pick(i.name)}>
                <img src={i.image} alt="" width="56" height="56" />
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}

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
        <JoyCoin size={40} />
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

      <EduShop balance={balance} onBalance={(joyBalance) => onLearnerUpdate({ joyBalance })} />

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
      {icon === "joy" ? <JoyCoin size={32} /> : <span className={`material-symbols-outlined edu-tone-${tone}`} aria-hidden="true">{icon}</span>}
      <div><b>{value}</b><small>{label}</small></div>
    </div>
  );
}

/** Hồ sơ: một tài khoản Hugo Studio dùng cho cả hai nơi. */
export function EduProfile({ learner, persona, onPersona, onSignOut, onLearnerUpdate }) {
  const { lang: legalLang } = useEduText();
  const legal = legalFor(legalLang);
  const support = supportMailUrl({ lang: legalLang, nickname: persona?.nickname });
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

      <PersonaInfoForm key={`${persona?.nickname}|${persona?.intro}`} current={persona} onSaved={onPersona} />
      <Link className="edu-btn is-ghost" to="/friends">{t("friends.cardLink")}</Link>
      {editing && <PersonaGate editOnly email={learner?.email} current={persona} onDone={(saved) => { if (saved) onPersona(saved); setEditing(false); }} />}
      <div className="edu-stats">
        <Stat icon="local_fire_department" tone="orange" value={learner?.edu?.streak?.count ?? 0} label={t("streak.title")} />
        <Stat icon="task_alt" tone="blue" value={`${stats.done}/${stats.total || 26}`} label={t("profile.steps")} />
        <Stat icon="joy" tone="blue" value={joyText(learner?.joyBalance || 0).replace(" JOY", "")} label="JOY" />
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
      <EduSettings embedded learner={learner} onLearnerUpdate={onLearnerUpdate} />
      <Link className="edu-btn edu-btn--ghost" to="/feedback">{t("history.write")}</Link>
      {/* Hỗ trợ: mở app Mail (điện thoại) hoặc Gmail web (máy tính) với thư soạn sẵn thông tin thành viên. */}
      <a className="edu-btn edu-btn--ghost" href={support} target={support.startsWith("mailto:") ? undefined : "_blank"} rel="noopener">{t("common.support")}</a>
      <FeedbackHistory />
      <p className="edu-legal">
        <Link to="/terms">{legal.terms.title}</Link> · <Link to="/privacy">{legal.privacy.title}</Link> · <Link to="/guidelines">{legal.guidelines.title}</Link> · <a href={support} target={support.startsWith("mailto:") ? undefined : "_blank"} rel="noopener">{t("common.support")}</a>
      </p>
    </section>
  );
}
