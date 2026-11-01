import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { API_BASE } from "../config/apiBase";
import { changeAppLanguage } from "../i18n/config";
import { FEEDBACK_QUESTIONS } from "../../../../packages/shared/eduFeedback";
import { useEduText } from "./eduText";
import { playEduSound } from "./eduSound";
import EduStatus from "./EduStatus";

/**
 * /feedback — bài đánh giá Education Hugo: 5 câu chấm sao + 1 ô góp ý (link trong thư xin tài trợ
 * mở trang này với ?from=mail&lang=…). Bài nộp lưu vĩnh viễn: admin xem ở tab "Đánh giá",
 * người học xem lại ở Hồ sơ > Lịch sử phản hồi (FeedbackHistory bên dưới).
 */
const DONATE = "https://www.hugowishpax.studio/?donate=1";

function Stars({ value, onChange, label }) {
  return (
    <div className="edu-fb-stars" role="radiogroup" aria-label={label}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n}/5`} className={n <= value ? "is-on" : ""}
          onClick={() => { playEduSound(n === 5 ? "coin" : "pop"); onChange(n); }}>
          <span className="material-symbols-outlined" aria-hidden="true">star</span>
        </button>
      ))}
    </div>
  );
}

export default function EduFeedback() {
  const { t, lang } = useEduText();
  const [params] = useSearchParams();
  const [ratings, setRatings] = useState({});
  const [comment, setComment] = useState("");
  const [state, setState] = useState("form"); // form · sending · done
  const [error, setError] = useState("");

  useEffect(() => {
    const want = params.get("lang");
    if (["vi", "en", "zh"].includes(want) && want !== lang) changeAppLanguage(want);
  }, [params]); // eslint-disable-line react-hooks/exhaustive-deps

  const complete = FEEDBACK_QUESTIONS.every((q) => ratings[q]);
  const submit = async (event) => {
    event.preventDefault();
    if (!complete) return;
    setState("sending");
    setError("");
    try {
      const response = await fetch(`${API_BASE}/joy/edu-feedback`, {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ratings, comment, lang, source: params.get("from") === "mail" ? "mail" : "app" }),
      });
      if (response.status === 429) throw new Error(t("feedback.tooSoon"));
      if (!response.ok) throw new Error(t("feedback.failed"));
      playEduSound("success");
      setState("done");
    } catch (failure) {
      setError(failure.message);
      setState("form");
    }
  };

  if (state === "done") {
    return (
      <section className="edu-page edu-fb-done">
        <img className="edu-ob-hero" src="/edu/buddy-done.svg" alt="" width="150" height="150" />
        <h1 className="edu-ob-title">{t("feedback.thanksTitle")}</h1>
        <p className="edu-ob-lead">{t("feedback.thanksBody")}</p>
        <a className="edu-btn edu-btn--wide edu-ob-go" href={DONATE} target="_blank" rel="noopener">{t("feedback.donate")}</a>
        <Link className="edu-ob-later" to="/learn">{t("status.home")}</Link>
      </section>
    );
  }

  return (
    <form className="edu-page edu-fb" onSubmit={submit}>
      <div className="edu-ob-say"><img src="/edu/cast-3.svg" alt="" width="88" height="88" /><p>{t("feedback.intro")}</p></div>
      <h1 className="edu-page-title">{t("feedback.title")}</h1>
      <ol className="edu-fb-list">
        {FEEDBACK_QUESTIONS.map((q, i) => (
          <li key={q}>
            <b>{i + 1}. {t(`feedback.q.${q}`)}</b>
            <Stars value={ratings[q] || 0} label={t(`feedback.q.${q}`)} onChange={(n) => setRatings((r) => ({ ...r, [q]: n }))} />
          </li>
        ))}
        <li>
          <b>6. {t("feedback.comment")}</b>
          <textarea rows={4} maxLength={2000} value={comment} onChange={(event) => setComment(event.target.value)} placeholder={t("feedback.commentHint")} />
        </li>
      </ol>
      {error && <p className="edu-alert" role="alert">{error}</p>}
      <button type="submit" className="edu-btn edu-btn--wide edu-ob-go" disabled={!complete || state === "sending"}>{t(state === "sending" ? "feedback.sending" : "feedback.submit")}</button>
    </form>
  );
}

/** Hồ sơ > Lịch sử phản hồi: mọi đánh giá, báo cáo người dùng, báo lỗi bài học, yêu cầu hỗ trợ đã gửi (lưu vĩnh viễn). */
export function FeedbackHistory() {
  const { t, lang } = useEduText();
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open || data) return;
    fetch(`${API_BASE}/joy/edu-history`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setData({ failed: true }));
  }, [open, data]);

  const when = (d) => new Date(d).toLocaleDateString(lang, { dateStyle: "medium" });
  const rows = data && !data.failed ? [
    ...(data.feedback || []).map((x) => ({ id: x._id, at: x.createdAt, kind: "feedback", cast: "cast-3", title: t("history.feedback", { avg: (Object.values(x.ratings).reduce((a, b) => a + b, 0) / 5).toFixed(1) }), body: x.comment })),
    ...(data.reports || []).map((x) => ({ id: x._id, at: x.createdAt, kind: "report", cast: "buddy-exam", title: t("history.report", { code: x.targetCode || "?" }), body: x.note, status: x.status })),
    ...(data.lessons || []).map((x) => ({ id: x._id, at: x.createdAt, kind: "lesson", cast: "buddy-practice", title: t("history.lesson", { id: x.lessonId, n: x.stepIndex + 1 }), body: x.message, status: x.status })),
    ...(data.tickets || []).map((x) => ({ id: x._id, at: x.createdAt, kind: "ticket", cast: "cast-5", title: t("history.ticket"), body: x.issue, reply: x.adminReply, status: x.status })),
  ].sort((a, b) => new Date(b.at) - new Date(a.at)) : null;

  return (
    <details className="edu-history" onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary><span>{t("history.title")}</span><small>{t("history.hint")}</small></summary>
      {!open ? null : !data ? <EduStatus kind="loading" compact /> : data.failed ? <p className="edu-alert">{t("feedback.failed")}</p> : !rows.length ? (
        <div className="edu-pop-empty"><img src="/edu/buddy-learn.svg" alt="" width="72" height="72" /><p>{t("history.empty")}</p><Link className="edu-btn" to="/feedback">{t("history.write")}</Link></div>
      ) : (
        <ul>
          {rows.map((row) => (
            <li key={`${row.kind}-${row.id}`}>
              <img src={`/edu/${row.cast}.svg`} alt="" width="40" height="40" />
              <div>
                <b>{row.title}</b>
                {row.body && <p>{row.body}</p>}
                {row.reply && <p className="edu-history-reply">{t("history.reply")}: {row.reply}</p>}
                <small>{when(row.at)}{row.status ? ` · ${t(`history.status.${row.status}`)}` : ""}</small>
              </div>
            </li>
          ))}
        </ul>
      )}
    </details>
  );
}
