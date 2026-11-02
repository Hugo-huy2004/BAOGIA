import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SignInPanel } from "./EduLogin";
import { PersonaAvatar } from "./EduPersona";
import { useEduText } from "./eduText";
import { playEduSound } from "./eduSound";

/**
 * Đăng nhập / tạo tài khoản trong PWA (chỉ điện thoại đã cài app; web máy tính giữ /login cũ):
 *   splash → mở đầu (BẮT ĐẦU · TÔI ĐÃ CÓ TÀI KHOẢN)
 *     BẮT ĐẦU   → chọn mục tiêu ngày → tạo hồ sơ (Google / passkey) hoặc học thử
 *     ĐÃ CÓ     → tài khoản đã lưu trên máy (chạm = đăng nhập gợi sẵn email) · thêm tài khoản khác
 * Mục tiêu chọn lúc chưa có tài khoản được giữ trên máy rồi lưu lên sau khi đăng nhập (takePendingGoal).
 */
import { ACCOUNTS, GOAL, GOALS, read, write } from "./eduAccounts";
export { rememberAccount, takePendingGoal } from "./eduAccounts";

const done = () => {
  const next = new URLSearchParams(window.location.search).get("next") || "";
  window.location.assign(/^\/(?!\/)/.test(next) ? next : "/learn");
};

export default function EduOnboard({ start = "start" }) {
  const { t } = useEduText();
  // Splash chỉ một lần mỗi lần mở app.
  const [step, setStep] = useState(() => (start === "start" && !sessionStorage.getItem("edu.splash") ? "splash" : start));
  const [goal, setGoal] = useState(2);
  const [accounts, setAccounts] = useState(() => read(ACCOUNTS, []));
  const [as, setAs] = useState(null);
  const [manage, setManage] = useState(false);

  useEffect(() => {
    if (step !== "splash") return undefined;
    sessionStorage.setItem("edu.splash", "1");
    const timer = setTimeout(() => setStep("start"), 1400);
    return () => clearTimeout(timer);
  }, [step]);

  const go = (next) => { playEduSound("whoosh"); setStep(next); };
  const forget = (email) => { const next = accounts.filter((a) => a.email !== email); write(ACCOUNTS, next); setAccounts(next); if (!next.length) setManage(false); };

  if (step === "splash") {
    return (
      <div className="edu-ob edu-ob-splash">
        <img className="edu-ob-pop" src="/edu/buddy-learn.svg" alt="" width="140" height="140" />
        <b className="edu-ob-word">Education Hugo</b>
      </div>
    );
  }

  const back = (to) => <button type="button" className="edu-ob-back" onClick={() => go(to)} aria-label={t("onboard.back")}><span className="material-symbols-outlined">arrow_back</span></button>;

  if (step === "start") {
    return (
      <div className="edu-ob">
        <main className="edu-ob-main">
          <div className="edu-ob-crew" aria-hidden="true">
            {[3, 6, 1, 8, 5].map((n, i) => <img key={n} src={`/edu/cast-${n}.svg`} alt="" style={{ "--i": i }} />)}
          </div>
          <h1 className="edu-ob-brand">Education Hugo</h1>
          <p className="edu-ob-lead">{t("onboard.tagline")}</p>
        </main>
        <footer className="edu-ob-foot">
          <button type="button" className="edu-btn edu-btn--wide edu-ob-go" onClick={() => go("goal")}>{t("onboard.start")}</button>
          <button type="button" className="edu-btn edu-btn--ghost edu-btn--wide" onClick={() => go(accounts.length ? "signin" : "signinAs")}>{t("onboard.have")}</button>
        </footer>
      </div>
    );
  }

  if (step === "goal") {
    return (
      <div className="edu-ob">
        <header className="edu-ob-bar">{back("start")}<span className="edu-ob-progress"><i style={{ width: "50%" }} /></span></header>
        <main className="edu-ob-main is-top">
          <h1 className="edu-ob-title">{t("onboard.goalTitle")}</h1>
          <div className="edu-ob-goals" role="radiogroup">
            {GOALS.map((n, i) => (
              <button key={n} type="button" role="radio" aria-checked={goal === n} className={goal === n ? "is-on" : ""} onClick={() => { playEduSound("tick"); setGoal(n); }}>
                <b>{t(`onboard.goal${i}`)}</b><small>{t("onboard.goalMins", { n: n * 5, s: n })}</small>
              </button>
            ))}
          </div>
          <div className="edu-ob-say"><img src="/edu/cast-6.svg" alt="" width="96" height="96" /><p>{t("onboard.goalSay")}</p></div>
        </main>
        <footer className="edu-ob-foot">
          <button type="button" className="edu-btn edu-btn--wide edu-ob-go" onClick={() => { write(GOAL, goal); go("create"); }}>{t("onboard.setGoal")}</button>
        </footer>
      </div>
    );
  }

  if (step === "create") {
    return (
      <div className="edu-ob">
        <header className="edu-ob-bar">{back("goal")}<span className="edu-ob-progress"><i style={{ width: "100%" }} /></span></header>
        <main className="edu-ob-main">
          <img className="edu-ob-hero" src="/edu/buddy-correct.svg" alt="" width="140" height="140" />
          <h1 className="edu-ob-title">{t("onboard.createTitle")}</h1>
          <p className="edu-ob-lead">{t("onboard.createBody")}</p>
          <SignInPanel onSignedIn={done} />
          <p className="edu-legal">
            {t("login.agreeA")} <a href="/terms">{t("common.terms")}</a> {t("login.agreeAnd")} <a href="/privacy">{t("login.policy")}</a>{t("login.agreeB")}
          </p>
        </main>
        <footer className="edu-ob-foot"><Link className="edu-ob-later" to="/learn">{t("onboard.later")}</Link></footer>
      </div>
    );
  }

  if (step === "signin") {
    return (
      <div className="edu-ob">
        <header className="edu-ob-bar">{back("start")}</header>
        <main className="edu-ob-main">
          <img className="edu-ob-hero is-wave" src="/edu/cast-1.svg" alt="" width="130" height="130" />
          <h1 className="edu-ob-title">{t("onboard.backTitle")}</h1>
          <p className="edu-ob-lead">{t("onboard.backBody")}</p>
          <ul className="edu-ob-accounts">
            {accounts.map((a) => (
              <li key={a.email}>
                <button type="button" onClick={() => (manage ? forget(a.email) : (setAs(a.email), go("signinAs")))}>
                  <PersonaAvatar avatar={a.avatar} name={a.name || a.email} size={48} />
                  <span><b>{a.name || a.email.split("@")[0]}</b><small>{a.email}</small></span>
                  <span className="material-symbols-outlined" aria-hidden="true">{manage ? "close" : "chevron_right"}</span>
                </button>
              </li>
            ))}
            <li>
              <button type="button" className="is-add" onClick={() => { setAs(null); go("signinAs"); }}>
                <span className="edu-ob-plus material-symbols-outlined" aria-hidden="true">add</span>
                <span><b>{t("onboard.addAccount")}</b></span>
              </button>
            </li>
          </ul>
        </main>
        <footer className="edu-ob-foot">
          <button type="button" className="edu-ob-later" onClick={() => setManage(!manage)}>{t(manage ? "onboard.doneManage" : "onboard.manage")}</button>
        </footer>
      </div>
    );
  }

  // signinAs: đăng nhập (Google gợi sẵn email đã lưu, hoặc passkey).
  return (
    <div className="edu-ob">
      <header className="edu-ob-bar">{back(accounts.length ? "signin" : "start")}</header>
      <main className="edu-ob-main">
        <img className="edu-ob-hero" src="/edu/buddy-learn.svg" alt="" width="130" height="130" />
        <h1 className="edu-ob-title">{as ? t("onboard.asTitle") : t("onboard.signinTitle")}</h1>
        <p className="edu-ob-lead">{as || t("onboard.signinBody")}</p>
        <SignInPanel onSignedIn={done} hint={as || ""} />
      </main>
    </div>
  );
}
