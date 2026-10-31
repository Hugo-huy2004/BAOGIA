import { useEffect, useMemo, useState } from "react";
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
import { promptInstall } from "./eduHead";

const STUDIO = "https://www.hugowishpax.studio";
const NAV = [
  { to: "/learn", icon: "school", label: "Học" },
  { to: "/progress", icon: "monitoring", label: "Tiến độ" },
  { to: "/store", icon: "storefront", label: "Cửa hàng" },
  { to: "/profile", icon: "person", label: "Hồ sơ" },
  { to: "/settings", icon: "settings", label: "Cài đặt" },
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
  return (
    <Link to={to} className="edu-brand" aria-label="Education Hugo, thuộc Hugo Studio">
      <img src="/edu/buddy-learn.svg" alt="" className="edu-brand-mark" />
      <span className="edu-brand-text">
        <b>EDUCATION HUGO</b>
        <small>thuộc <HugoLogo className="h-3.5 w-3.5" aria-hidden="true" /> Hugo Studio</small>
      </span>
    </Link>
  );
}

/** Nút cài app. Chrome/Edge/Android: hộp cài thật; iOS không có nên chỉ cách. */
export function EduInstall({ className = "edu-btn edu-btn--ghost" }) {
  const standalone = useStandalone();
  const [guide, setGuide] = useState(false);
  if (standalone) return null;
  const onClick = async () => {
    if (!(await promptInstall())) setGuide(true);
  };
  const ios = detectInstallTarget().iOS;
  return (
    <>
      <button type="button" className={className} onClick={onClick}>
        <span className="material-symbols-outlined" aria-hidden="true">install_mobile</span> Cài ứng dụng
      </button>
      {guide && (
        <div className="edu-sheet" role="dialog" aria-modal="true" aria-label="Cài Education Hugo" onClick={() => setGuide(false)}>
          <div className="edu-sheet-card" onClick={(event) => event.stopPropagation()}>
            <img src="/edu/buddy-correct.svg" alt="" width="88" height="88" />
            <h2>Cài Education Hugo</h2>
            {ios ? (
              <ol>
                <li>Mở trang này bằng Safari.</li>
                <li>Bấm nút <b>Chia sẻ</b> <span className="material-symbols-outlined" aria-hidden="true">ios_share</span>.</li>
                <li>Chọn <b>Thêm vào MH chính</b>.</li>
              </ol>
            ) : (
              <p>Mở menu của trình duyệt (⋮) rồi chọn <b>Cài đặt ứng dụng</b> hoặc <b>Thêm vào màn hình chính</b>.</p>
            )}
            <button type="button" className="edu-btn" onClick={() => setGuide(false)}>Đã hiểu</button>
          </div>
        </div>
      )}
    </>
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

export default function EduShell({ view, learner, signedIn, children }) {
  const stats = useLearnerStats(learner);
  const nav = NAV.map((item) => ({ ...item, to: signedIn || item.to === "/learn" ? item.to : "/login" }));

  const chips = (
    <>
      <StatChip icon="local_fire_department" tone="orange" label={`Đã xong ${stats.done} trên ${stats.total} step`} to="/progress">{stats.done}/{stats.total || 26}</StatChip>
      {signedIn && <StatChip icon="diamond" tone="blue" label={`Số dư ${joyText(learner?.joyBalance || 0)}`} to="/store">{joyText(learner?.joyBalance || 0).replace(" JOY", "")}</StatChip>}
      {signedIn && !learner?.isEduVerified && stats.days !== null && (
        <StatChip icon="event_available" tone={stats.days <= 3 ? "red" : "green"} label={`Tài khoản còn ${stats.days} ngày`} to="/store">{Math.max(0, stats.days)}</StatChip>
      )}
    </>
  );

  return (
    <div className={`edu-app edu-view-${view}`}>
      <aside className="edu-side">
        <EduBrand />
        <nav aria-label="Education Hugo">
          {nav.map((item) => (
            <NavLink key={item.label} to={item.to} className={({ isActive }) => `edu-nav${isActive && item.to !== "/login" ? " is-active" : ""}`}>
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
        <Rail learner={learner} signedIn={signedIn} stats={stats} />
      </aside>

      <nav className="edu-tabs" aria-label="Education Hugo">
        {nav.map((item) => (
          <NavLink key={item.label} to={item.to} className={({ isActive }) => (isActive && item.to !== "/login" ? "is-active" : "")} aria-label={item.label}>
            <span className="material-symbols-outlined" aria-hidden="true">{item.icon}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

function Rail({ learner, signedIn, stats }) {
  if (!signedIn) {
    return (
      <section className="edu-card edu-card--cta">
        <img src="/edu/buddy-correct.svg" alt="" width="72" height="72" />
        <h2>Tạo tài khoản để lưu tiến độ</h2>
        <p>Chặng 1 học thử ngay không cần tài khoản. Từ step 7 cần đăng nhập — khoá học vẫn miễn phí.</p>
        <Link className="edu-btn" to="/login">Đăng nhập / Đăng ký</Link>
      </section>
    );
  }
  const { current } = stats;
  const zips = stats.stages.filter((row) => row.complete);
  const today = learner?.edu?.today;
  return (
    <>
      {today && (
        <section className={`edu-card${today.done >= today.goal ? " edu-card--done" : ""}`}>
          <header><h2>Mục tiêu hôm nay</h2><Link to="/settings">Sửa</Link></header>
          <div className="edu-bar" aria-label={`${Math.min(today.done, today.goal)}/${today.goal} step`}><i style={{ width: `${Math.min(100, (today.done / today.goal) * 100)}%` }} /></div>
          <p className="edu-card-meta">{today.done >= today.goal ? "Đã đạt — học thêm vẫn được cộng JOY." : `${today.done}/${today.goal} step hôm nay`}</p>
        </section>
      )}
      {current && (
        <section className="edu-card">
          <header><h2>{current.code || `Chặng ${current.phaseNumber}`}</h2><Link to="/learn">Học tiếp</Link></header>
          <p className="edu-card-sub">{String(current.title || "").replace(/^CODE \d+ · /, "")}</p>
          <div className="edu-bar" aria-label={`${current.finished}/${current.total} step`}><i style={{ width: `${current.total ? (current.finished / current.total) * 100 : 0}%` }} /></div>
          <p className="edu-card-meta">{current.finished}/{current.total} step trong chặng</p>
        </section>
      )}
      {!learner?.isEduVerified && stats.days !== null && (
        <section className={`edu-card${stats.days <= 3 ? " edu-card--warn" : ""}`}>
          <header><h2>Duy trì tài khoản</h2><Link to="/store">Gia hạn</Link></header>
          <p>{stats.days > 0 ? `Còn ${stats.days} ngày.` : "Đã hết hạn."} {ACCOUNT_EXTENSION.days} ngày = {joyText(ACCOUNT_EXTENSION.priceJoy)}; qua mỗi step được +{CODER_JOY_PER_CORRECT} JOY mỗi câu đúng.</p>
        </section>
      )}
      <section className="edu-card">
        <header><h2>Mã nguồn Nhịp</h2></header>
        {zips.length ? (
          <ul className="edu-zips">
            {zips.map((row) => (
              <li key={row.id}><a href={`/downloads/coding/${CODE_ZIPS[row.index]}`} download><span className="material-symbols-outlined" aria-hidden="true">folder_zip</span>{row.code || `Chặng ${row.phaseNumber}`}</a></li>
            ))}
          </ul>
        ) : <p>Xong chặng 1 là tải được mã Nhịp của chặng đó, chạy thử ngay trên máy.</p>}
      </section>
      {stats.average !== null && (
        <section className="edu-card">
          <header><h2>Điểm trắc nghiệm</h2><Link to="/progress">Xem</Link></header>
          <p className="edu-big">{stats.average}%</p>
          <p className="edu-card-meta">trung bình điểm cao nhất mỗi step</p>
        </section>
      )}
    </>
  );
}

/** Cửa hàng riêng của Education Hugo: duy trì tài khoản bằng JOY. */
export function EduStore({ learner, onLearnerUpdate }) {
  const [busy, setBusy] = useState(false);
  const days = daysLeft(learner?.accessExpiresAt);
  const tax = Math.floor(ACCOUNT_EXTENSION.priceJoy * EXCHANGE_TAX_RATE);
  const total = ACCOUNT_EXTENSION.priceJoy + tax;
  const balance = Number(learner?.joyBalance) || 0;

  const buy = async () => {
    const ok = await notify.confirm({
      title: `Duy trì tài khoản +${ACCOUNT_EXTENSION.days} ngày`,
      message: `${joyText(ACCOUNT_EXTENSION.priceJoy)} + ${joyText(tax)} phí sáng tạo = ${joyText(total)}.`,
      confirmText: `Đổi ${joyText(total)}`,
    });
    if (!ok) return;
    setBusy(true);
    try {
      const response = await fetch(`${API_BASE}/joy/extend-account`, { method: "POST", credentials: "include" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Chưa gia hạn được, thử lại sau.");
      onLearnerUpdate({ joyBalance: data.balance, accessExpiresAt: data.accessExpiresAt });
      notify.success(`Đã gia hạn +${data.days} ngày.`);
    } catch (error) {
      notify.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="edu-page">
      <h1 className="edu-page-title">Cửa hàng</h1>
      <div className="edu-wallet">
        <span className="material-symbols-outlined edu-tone-blue" aria-hidden="true">diamond</span>
        <div><b>{joyText(balance)}</b><small>Số dư ví JOY — dùng chung với Hugo Studio</small></div>
      </div>

      {learner?.isEduVerified ? (
        <article className="edu-offer">
          <img src="/edu/buddy-done.svg" alt="" width="88" height="88" />
          <div>
            <h2>Đã xác minh giáo dục</h2>
            <p>Tài khoản được duy trì miễn phí{days !== null ? ` — còn ${days} ngày` : ""}. Không cần gia hạn bằng JOY.</p>
          </div>
        </article>
      ) : (
        <>
          <article className="edu-offer">
            <img src="/edu/buddy-learn.svg" alt="" width="88" height="88" />
            <div>
              <h2>Duy trì tài khoản +{ACCOUNT_EXTENSION.days} ngày</h2>
              <p>{days === null ? "" : days > 0 ? `Hạn hiện tại: còn ${days} ngày. ` : "Tài khoản đã hết hạn. "}Gia hạn nối tiếp vào hạn hiện tại.</p>
              <p className="edu-price">{joyText(ACCOUNT_EXTENSION.priceJoy)} <small>+ {joyText(tax)} phí sáng tạo</small></p>
            </div>
            <button type="button" className="edu-btn" disabled={busy || balance < total} onClick={buy}>
              {balance < total ? "Chưa đủ JOY" : busy ? "Đang gia hạn…" : "Đổi JOY"}
            </button>
          </article>
          <article className="edu-offer edu-offer--soft">
            <span className="material-symbols-outlined edu-offer-icon" aria-hidden="true">verified</span>
            <div>
              <h2>Học sinh – sinh viên: miễn phí 1 năm</h2>
              <p>Xác minh giáo dục (email trường hoặc hồ sơ học sinh – sinh viên) để được duy trì tài khoản miễn phí một năm, giống Hugo Studio.</p>
            </div>
            <a className="edu-btn edu-btn--ghost" href={`${STUDIO}/login?redirect=${encodeURIComponent("/member/account")}`} target="_blank" rel="noopener">Xác minh</a>
          </article>
        </>
      )}

      <h2 className="edu-subhead">Kiếm JOY</h2>
      <ul className="edu-earn">
        <li><span className="material-symbols-outlined" aria-hidden="true">task_alt</span>Qua một step lần đầu: <b>+{CODER_JOY_PER_CORRECT} JOY</b> cho mỗi câu trắc nghiệm đúng.</li>
        <li><span className="material-symbols-outlined" aria-hidden="true">replay</span>Học lại step đã qua để ôn — không cộng thêm JOY.</li>
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
export function EduProfile({ learner, onSignOut }) {
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
      <h1 className="edu-page-title">Hồ sơ</h1>
      <div className="edu-profile">
        {learner?.avatarUrl
          ? <img src={learner.avatarUrl} alt="" className="edu-avatar" referrerPolicy="no-referrer" />
          : <span className="edu-avatar">{(learner?.displayName || learner?.email || "?").slice(0, 1).toUpperCase()}</span>}
        <div>
          <b>{learner?.displayName || "Học viên"}</b>
          <small>{learner?.email}</small>
        </div>
      </div>

      <div className="edu-stats">
        <Stat icon="local_fire_department" tone="orange" value={`${stats.done}/${stats.total || 26}`} label="Step đã qua" />
        <Stat icon="diamond" tone="blue" value={joyText(learner?.joyBalance || 0).replace(" JOY", "")} label="JOY" />
        <Stat icon="military_tech" tone="green" value={stats.average === null ? "—" : `${stats.average}%`} label="Điểm trung bình" />
        <Stat icon="event_available" tone={!learner?.isEduVerified && days !== null && days <= 3 ? "red" : "green"} value={learner?.isEduVerified ? "1 năm" : days === null ? "—" : Math.max(0, days)} label={learner?.isEduVerified ? "Đã xác minh" : "Ngày còn lại"} />
      </div>

      <dl className="edu-facts">
        <dt>Tài khoản</dt>
        <dd>Tài khoản Hugo Studio — đăng nhập bằng cùng Google/passkey ở education.hugowishpax.studio và www.hugowishpax.studio. Ví JOY, tiến độ và hồ sơ là một.</dd>
        <dt>Duy trì</dt>
        <dd>{learner?.isEduVerified ? "Đã xác minh giáo dục — miễn phí." : days === null ? "—" : days > 0 ? `Còn ${days} ngày. Gia hạn trong Cửa hàng.` : "Đã hết hạn — gia hạn trong Cửa hàng để giữ tài khoản."}</dd>
      </dl>

      <div className="edu-actions">
        <a className="edu-btn" href={`${STUDIO}/login?redirect=${encodeURIComponent("/member")}`} target="_blank" rel="noopener">Mở Hugo Studio</a>
        {(installable || detectInstallTarget().iOS) && <EduInstall />}
        <button type="button" className="edu-btn edu-btn--ghost" onClick={onSignOut}>Đăng xuất</button>
      </div>
      <p className="edu-legal">
        <a href={`${STUDIO}/terms`} target="_blank" rel="noopener">Điều khoản</a> · <a href={`${STUDIO}/privacy-policy`} target="_blank" rel="noopener">Bảo mật</a> · <a href={`${STUDIO}/support-request`} target="_blank" rel="noopener">Hỗ trợ</a>
      </p>
    </section>
  );
}
