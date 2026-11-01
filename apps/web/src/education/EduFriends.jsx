import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { notify } from "../lib/notify";
import { API_BASE } from "../config/apiBase";
import { PersonaAvatar } from "./EduPersona";
import { useEduText } from "./eduText";
import { playEduSound } from "./eduSound";
import AnimIcon from "../components/icons/animated/AnimIcon";

/**
 * Bạn bè + thi đua tuần (/friends) và hồ sơ công khai (/u/:code) của Education Hugo.
 *  - Kết bạn HAI CHIỀU có duyệt: gửi lời mời bằng mã / QR / tìm kiếm → người kia đồng ý.
 *  - Bảng tuần "trực tiếp": tự tải lại mỗi LIVE_MS khi trang đang mở (WebSocket chỉ chạy ở app gốc).
 *  - Máy tính: 2 cột (bảng tuần | bạn bè + thêm bạn). Điện thoại: 3 thẻ Thi đua · Bạn bè · Thêm bạn.
 * Mọi con số do máy chủ trả (services/eduSocial.js); không có email trong dữ liệu.
 */
const LIVE_MS = 15000;
const PROFILE_URL = (code) => `https://education.hugowishpax.studio/u/${code}`;

async function call(path, init) {
  const response = await fetch(`${API_BASE}/joy/${path}`, { credentials: "include", ...init, headers: { "Content-Type": "application/json" } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(body.error || body.code || "FAILED"), { code: body.code, status: response.status });
  return body;
}

/** Dữ liệu bạn bè + bảng tuần, tự làm mới khi trang đang hiện. */
function useSocial() {
  const [data, setData] = useState(null);
  // Thiếu trường (máy chủ cũ đang chạy, lỗi giữa chừng) thì coi là rỗng — trang không được sập.
  const take = (d) => setData({ ...d, me: d.me || {}, league: d.league || [], friends: d.friends || [], requestsIn: d.requestsIn || [], requestsOut: d.requestsOut || [] });
  const load = useCallback(() => call("edu-social").then(take).catch(() => setData((cur) => cur || { failed: true })), []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    load();
    const tick = () => document.visibilityState === "visible" && load();
    const timer = setInterval(tick, LIVE_MS);
    document.addEventListener("visibilitychange", tick);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", tick); };
  }, [load]);
  const act = async (path, init) => {
    try { take(await call(path, init)); return true; } catch (error) { notify.error(error.message); return false; }
  };
  return { data, act };
}

/** Bảng tuần: bục 3 người đầu + danh sách có thanh XP so với người dẫn đầu. */
function League({ rows }) {
  const { t } = useEduText();
  if (!rows.length) return <p className="fr-empty">{t("friends.leagueEmpty")}</p>;
  const top = Math.max(1, rows[0].xp);
  const podium = rows.slice(0, 3);
  return (
    <>
      <div className="fr-podium">
        {[podium[1], podium[0], podium[2]].map((row, i) => row && (
          <Link key={row.code || i} to={row.code ? `/u/${row.code}` : "#"} className={`fr-podium-spot is-${[2, 1, 3][i]}${row.me ? " is-me" : ""}`}>
            <PersonaAvatar avatar={row.avatar} name={row.name} size={[2, 1, 3][i] === 1 ? 72 : 56} />
            <b className="nick-font">{row.name}</b>
            <small>{t("friends.xp", { n: row.xp })}</small>
            <span className="fr-podium-block">{[2, 1, 3][i]}</span>
          </Link>
        ))}
      </div>
      <ol className="fr-rows">
        {rows.map((row, index) => (
          <li key={`${row.code}-${index}`} className={row.me ? "is-me" : ""}>
            <Link to={row.code ? `/u/${row.code}` : "#"}>
              <span className={`fr-rank${index < 3 ? ` is-top${index + 1}` : ""}`}>{index + 1}</span>
              <PersonaAvatar avatar={row.avatar} name={row.name} size={44} />
              <span className="fr-who">
                <b className="nick-font">{row.name}{row.me ? ` · ${t("friends.you")}` : ""}</b>
                <i className="fr-xpbar"><i style={{ width: `${(row.xp / top) * 100}%` }} /></i>
              </span>
              <b className="fr-xp">{t("friends.xp", { n: row.xp })}</b>
            </Link>
          </li>
        ))}
      </ol>
    </>
  );
}

function PersonRow({ row, children }) {
  return (
    <li className="fr-person">
      <Link to={`/u/${row.code}`} className="fr-person-main">
        <PersonaAvatar avatar={row.avatar} name={row.name} size={44} />
        <span><b className="nick-font">{row.name}</b><small><AnimIcon name="sparkles" size={14} /> {row.streak} · {row.xp} XP</small></span>
      </Link>
      {children}
    </li>
  );
}

/** Quét QR của bạn bằng camera — BarcodeDetector của trình duyệt (không thư viện). iOS Safari chưa có: dùng app Camera. */
function Scanner({ onCode, onClose }) {
  const { t } = useEduText();
  const video = useRef(null);
  useEffect(() => {
    let stream; let stop = false;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        video.current.srcObject = stream;
        await video.current.play();
        const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
        while (!stop) {
          const [hit] = await detector.detect(video.current).catch(() => []);
          const code = hit?.rawValue?.match(/\/u\/([A-Z0-9]{6})/i)?.[1] || (/^[A-Z0-9]{6}$/i.test(hit?.rawValue || "") ? hit.rawValue : null);
          if (code) { playEduSound("success"); onCode(code.toUpperCase()); return; }
          await new Promise((r) => setTimeout(r, 300));
        }
      } catch { notify.error(t("friends.scanFailed")); onClose(); }
    })();
    return () => { stop = true; stream?.getTracks().forEach((track) => track.stop()); };
  }, [onCode, onClose, t]);
  return (
    <div className="fr-scan" role="dialog" aria-modal="true" aria-label={t("friends.scan")}>
      <video ref={video} playsInline muted />
      <span className="fr-scan-frame" aria-hidden="true" />
      <button type="button" className="edu-btn is-ghost" onClick={onClose}>{t("common.close")}</button>
    </div>
  );
}

/**
 * Thẻ thành viên kiểu Duolingo: nhân vật lớn trên nền xám, biệt danh, mã bạn, chữ Education Hugo
 * và QR (có mascot ở giữa) trỏ tới hồ sơ công khai /u/<mã> — quét bằng app Camera là thấy nhau.
 */
export function MemberCard({ name, avatar, code, badge }) {
  return (
    <figure className="fr-card">
      <div className="fr-card-head">
        <div className="fr-card-art"><PersonaAvatar avatar={avatar} name={name} size={96} />{badge && <img className="fr-card-badge" src={badge} alt="" width="40" height="40" />}</div>
        <div className="fr-card-id">
          <b className="nick-font">{name || "Hugo learner"}</b>
          <small translate="no">{code}</small>
        </div>
      </div>
      <figcaption>
        <span className="fr-card-brand">Education<br />Hugo</span>
        <QRCodeSVG value={PROFILE_URL(code)} size={120} level="H" bgColor="transparent" fgColor="#3c3c3c"
          imageSettings={{ src: "/edu/buddy-learn.svg", height: 26, width: 26, excavate: true }} />
      </figcaption>
    </figure>
  );
}

/** Thêm bạn: thẻ thành viên (QR + mã) của mình, nhập mã, quét QR, tìm theo biệt danh / mã / email. */
function AddFriend({ code, me, onRequest }) {
  const { t } = useEduText();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [results, setResults] = useState(null);
  const [scanning, setScanning] = useState(false);
  const canScan = typeof window !== "undefined" && "BarcodeDetector" in window && navigator.mediaDevices?.getUserMedia;
  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) { setResults(null); return undefined; }
    const timer = setTimeout(() => call(`edu-search?q=${encodeURIComponent(query)}`).then((d) => setResults(d.results)).catch(() => setResults([])), 300);
    return () => clearTimeout(timer);
  }, [q]);
  const share = async () => {
    const url = PROFILE_URL(code);
    try { if (navigator.share) await navigator.share({ title: "Education Hugo", url }); else { await navigator.clipboard.writeText(url); notify.success(t("friends.copied")); } } catch { /* người dùng huỷ chia sẻ */ }
  };
  const onScanned = useCallback((scanned) => { setScanning(false); navigate(`/u/${scanned}`); }, [navigate]);
  const closeScan = useCallback(() => setScanning(false), []);
  return (
    <div className="fr-add">
      <MemberCard name={me?.name} avatar={me?.avatar} code={code} badge={me?.badge} />
      <button type="button" className="edu-btn is-ghost" onClick={share}><AnimIcon name="link" size={20} />{t("friends.share")}</button>
      <form className="fr-search" onSubmit={(event) => { event.preventDefault(); const c = q.trim().toUpperCase(); if (/^[A-Z0-9]{6}$/.test(c)) onRequest(c); }}>
        <input value={q} onChange={(event) => setQ(event.target.value)} placeholder={t("friends.searchPlaceholder")} aria-label={t("friends.searchPlaceholder")} autoComplete="off" spellCheck={false} />
        {canScan && <button type="button" className="fr-scan-btn" onClick={() => setScanning(true)} aria-label={t("friends.scan")}><span className="material-symbols-outlined" aria-hidden="true">qr_code_scanner</span></button>}
      </form>
      {!canScan && <small className="fr-hint">{t("friends.scanHint")}</small>}
      {results && (results.length ? (
        <ul className="fr-list">
          {results.map((row) => (
            <PersonRow key={row.code} row={row}>
              <button type="button" className="edu-btn" onClick={() => onRequest(row.code)}>{t("friends.add")}</button>
            </PersonRow>
          ))}
        </ul>
      ) : <p className="fr-empty">{t("friends.noResults")}</p>)}
      {scanning && <Scanner onCode={onScanned} onClose={closeScan} />}
    </div>
  );
}

export default function EduFriends({ embedded = false }) {
  const { t } = useEduText();
  const { data, act } = useSocial();
  const [tab, setTab] = useState("league");
  const request = (code) => act("edu-friends", { method: "POST", body: JSON.stringify({ code }) }).then((ok) => ok && notify.success(t("friends.sent")));
  const accept = (code) => act(`edu-friends/${code}/accept`, { method: "POST" }).then((ok) => ok && playEduSound("success"));
  const decline = (code) => act(`edu-friends/${code}/decline`, { method: "POST" });
  const remove = async (code) => { if (await notify.confirm({ title: t("friends.removeAsk") })) act(`edu-friends/${code}`, { method: "DELETE" }); };

  if (!data) return <p className="fr-empty">{t("common.loading")}…</p>;
  if (data.failed) return <p className="fr-empty">{t("friends.failed")}</p>;
  const pending = data.requestsIn.length;

  return (
    <section className={`${embedded ? "" : "edu-page "}fr fr-tab-${tab}`}>
      {!embedded && <h1 className="edu-page-title">{t("friends.title")}</h1>}
      {!data.me.name && <Link className="fr-warn" to="/profile">{t("friends.needNick")}</Link>}
      <div className="fr-tabs" role="tablist">
        {["league", "friends", "add"].map((id) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? "is-on" : ""} onClick={() => setTab(id)}>
            {t(`friends.tab.${id}`)}{id === "friends" && pending > 0 && <i>{pending}</i>}
          </button>
        ))}
      </div>
      <div className="fr-grid">
        <section className="fr-col fr-col-league">
          <header className="fr-head"><h2>{t("friends.league")}</h2><span className="fr-live"><i />{t("friends.live")}</span></header>
          <p className="fr-sub">{t("friends.leagueHint")}</p>
          <League rows={data.league} />
        </section>
        <section className="fr-col fr-col-friends">
          {pending > 0 && (
            <>
              <h2>{t("friends.requests")}</h2>
              <ul className="fr-list">
                {data.requestsIn.map((row) => (
                  <PersonRow key={row.code} row={row}>
                    <span className="fr-actions">
                      <button type="button" className="edu-btn" onClick={() => accept(row.code)}>{t("friends.accept")}</button>
                      <button type="button" className="edu-btn is-ghost" onClick={() => decline(row.code)} aria-label={t("friends.decline")}><AnimIcon name="close" size={20} /></button>
                    </span>
                  </PersonRow>
                ))}
              </ul>
            </>
          )}
          <h2>{t("friends.friendsTitle", { n: data.friends.length - 1 })}</h2>
          {data.friends.length > 1 ? (
            <ol className="fr-list">
              {data.friends.filter((row) => !row.me).map((row) => (
                <PersonRow key={row.code} row={row}>
                  <button type="button" className="fr-icon-btn" onClick={() => remove(row.code)} aria-label={t("friends.remove")}><AnimIcon name="delete" size={20} /></button>
                </PersonRow>
              ))}
            </ol>
          ) : <p className="fr-empty">{t("friends.friendsEmpty")}</p>}
          {data.requestsOut.length > 0 && (
            <>
              <h2>{t("friends.sentTitle")}</h2>
              <ul className="fr-list">
                {data.requestsOut.map((row) => (
                  <PersonRow key={row.code} row={row}>
                    <button type="button" className="edu-btn is-ghost" onClick={() => act(`edu-friends/${row.code}`, { method: "DELETE" })}>{t("friends.cancel")}</button>
                  </PersonRow>
                ))}
              </ul>
            </>
          )}
        </section>
        <section className="fr-col fr-col-add">
          <h2>{t("friends.addTitle")}</h2>
          <AddFriend code={data.code} me={data.me} onRequest={request} />
        </section>
      </div>
    </section>
  );
}

const REPORT_REASONS = ["nickname", "avatar", "intro", "harassment", "cheating", "other"];

/** Báo cáo người dùng: chọn lý do + ghi chú tuỳ chọn → admin xem xét (không tự khoá ai). */
function ReportSheet({ code, name, onClose }) {
  const { t } = useEduText();
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const send = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await call("edu-report", { method: "POST", body: JSON.stringify({ code, reason, note }) });
      notify.success(t("friends.reportSent"));
      onClose();
    } catch (error) { notify.error(error.message); } finally { setBusy(false); }
  };
  return (
    <div className="fr-sheet-backdrop" role="presentation" onClick={onClose}>
      <form className="fr-sheet" role="dialog" aria-modal="true" aria-labelledby="fr-report-title" onSubmit={send} onClick={(e) => e.stopPropagation()}>
        <h2 id="fr-report-title">{t("friends.reportTitle", { name })}</h2>
        <p>{t("friends.reportBody")}</p>
        <div className="fr-reasons" role="radiogroup">
          {REPORT_REASONS.map((key) => (
            <label key={key} className={reason === key ? "is-on" : ""}>
              <input type="radio" name="reason" value={key} checked={reason === key} onChange={() => setReason(key)} />
              {t(`friends.reasons.${key}`)}
            </label>
          ))}
        </div>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={3} placeholder={t("friends.reportNote")} />
        <div className="fr-sheet-actions">
          <button type="button" className="edu-btn is-ghost" onClick={onClose}>{t("common.close")}</button>
          <button type="submit" className="edu-btn is-danger" disabled={busy || !reason}>{t("friends.reportSend")}</button>
        </div>
      </form>
    </div>
  );
}

/** Hồ sơ công khai (/u/:code) kiểu Duolingo: băng màu + nhân vật, thống kê, tiến độ chặng, nút kết bạn. */
export function EduPublicProfile() {
  const { t, lang } = useEduText();
  const { code } = useParams();
  const [p, setP] = useState(null);
  const [reporting, setReporting] = useState(false);
  const load = useCallback(() => call(`edu-profile/${encodeURIComponent(code)}`).then(setP).catch((e) => setP({ missing: e.status === 404, failed: true })), [code]);
  useEffect(() => { load(); }, [load]);
  const act = async (path, init) => { try { await call(path, init); playEduSound("success"); load(); } catch (error) { notify.error(error.message); } };
  if (!p) return <section className="edu-page"><p className="fr-empty">{t("common.loading")}…</p></section>;
  if (p.failed) return <section className="edu-page"><p className="fr-empty">{t(p.missing ? "friends.notFound" : "friends.failed")}</p><Link className="edu-btn is-ghost" to="/friends">{t("friends.back")}</Link></section>;
  const button = {
    self: <Link className="edu-btn is-ghost" to="/profile">{t("friends.editMine")}</Link>,
    friend: <button type="button" className="edu-btn is-ghost" disabled><AnimIcon name="check" size={20} />{t("friends.isFriend")}</button>,
    out: <button type="button" className="edu-btn is-ghost" onClick={() => act(`edu-friends/${p.code}`, { method: "DELETE" })}>{t("friends.cancel")}</button>,
    in: <button type="button" className="edu-btn" onClick={() => act(`edu-friends/${p.code}/accept`, { method: "POST" })}>{t("friends.accept")}</button>,
    none: <button type="button" className="edu-btn" onClick={() => act("edu-friends", { method: "POST", body: JSON.stringify({ code: p.code }) })}><AnimIcon name="add" size={20} />{t("friends.add")}</button>,
  }[p.relation];
  return (
    <section className="edu-page fr-profile">
      <div className="fr-profile-hero"><PersonaAvatar avatar={p.avatar} name={p.name} size={140} /></div>
      <div className="fr-profile-head">
        <div>
          <h1 className="nick-font">{p.name}</h1>
          <small>{p.joined ? t("friends.joined", { date: new Date(p.joined).toLocaleDateString(lang, { month: "long", year: "numeric" }) }) : ""} · {t("friends.friendCount", { n: p.friends })}</small>
        </div>
        {button}
      </div>
      {p.intro && <p className="fr-profile-intro">{p.intro}</p>}
      <MemberCard name={p.name} avatar={p.avatar} code={p.code} badge={p.badge} />
      <div className="fr-stats">
        <div><b>{p.streak}</b><small>{t("friends.statStreak")}</small></div>
        <div><b>{p.xp}</b><small>{t("friends.statXp")}</small></div>
        <div><b>{p.steps}/26</b><small>{t("friends.statSteps")}</small></div>
      </div>
      <h2>{t("friends.progress")}</h2>
      {(() => {
        // Một khoá = một thanh: gộp các chặng lại.
        const done = p.stages.reduce((n, s) => n + s.done, 0);
        const total = p.stages.reduce((n, s) => n + s.total, 0) || 1;
        return (
          <ul className="fr-stagebars">
            <li><span>Coding</span><i><i style={{ width: `${(done / total) * 100}%` }} /></i><b>{done}/{total}</b></li>
          </ul>
        );
      })()}
      {p.relation !== "self" && (
        <button type="button" className="fr-report" onClick={() => setReporting(true)}>
          <AnimIcon name="alert" size={20} />{t("friends.report")}
        </button>
      )}
      {reporting && <ReportSheet code={p.code} name={p.name} onClose={() => setReporting(false)} />}
    </section>
  );
}
