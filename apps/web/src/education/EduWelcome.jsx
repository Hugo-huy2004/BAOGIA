import { useState } from "react";
import { changeAppLanguage } from "../i18n/config";
import { EDU_LANGS } from "./eduCopy";
import { rich, useEduText } from "./eduText";
import { playEduSound } from "./eduSound";

/**
 * Lần đầu mở Education Hugo: (1) chọn ngôn ngữ, (2) quyền riêng tư & điều khoản.
 *
 * Làm theo luật, không theo thói quen "bấm Đồng ý hết":
 *  - Cookie: site chỉ dùng loại THIẾT YẾU (phiên đăng nhập, lưu cài đặt) — không quảng
 *    cáo, không theo dõi bên thứ ba — nên chỉ cần thông báo, không có ô bật/tắt giả.
 *    Thêm công cụ phân tích/quảng cáo sau này thì PHẢI thêm lựa chọn riêng, mặc định tắt.
 *  - Điều khoản và độ tuổi (từ 14, dưới 18 cần người giám hộ): hai ô riêng, không tick
 *    sẵn (NĐ 13/2023: đồng ý phải rõ ràng, tự nguyện; GDPR điều 7).
 *  - Vị trí: KHÔNG xin. Education Hugo không dùng vị trí; xin quyền không có mục đích là
 *    trái nguyên tắc tối thiểu hoá dữ liệu. Màn này nói rõ điều đó.
 * Ghi lại phiên bản + thời điểm đồng ý trên máy; đổi điều khoản thì tăng VERSION để hỏi lại.
 */
const KEY = "edu.consent";
const VERSION = 1;

export function needsWelcome() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "null")?.v !== VERSION;
  } catch {
    return false; // không có bộ nhớ (chế độ riêng tư chặn): đừng chặn người học mỗi lần tải
  }
}

const WWW = "https://www.hugowishpax.studio";

export default function EduWelcome({ onDone }) {
  const { t, lang } = useEduText();
  const [step, setStep] = useState(0);
  const [terms, setTerms] = useState(false);
  const [age, setAge] = useState(false);

  const pickLanguage = async (code) => {
    await changeAppLanguage(code);
    setStep(1);
  };
  const accept = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ v: VERSION, at: new Date().toISOString(), lang, terms: true, age: true, cookies: "essential" }));
    } catch { /* không lưu được thì lần sau hỏi lại */ }
    playEduSound("success", { unlock: true });
    onDone();
  };

  return (
    <div className="edu-welcome" role="dialog" aria-modal="true" aria-labelledby="edu-welcome-title">
      <div className="edu-welcome-card">
        <img src={step ? "/edu/buddy-correct.svg" : "/edu/buddy-learn.svg"} alt="" className="edu-welcome-buddy" />
        {step === 0 ? (
          <>
            <h2 id="edu-welcome-title">{t("welcome.langTitle")}</h2>
            <p>{t("welcome.langBody")}</p>
            <div className="edu-welcome-langs">
              {EDU_LANGS.map(({ code, label }) => (
                <button key={code} type="button" lang={code} className={`edu-welcome-lang${code === lang ? " is-on" : ""}`} onClick={() => pickLanguage(code)}>
                  {label}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <h2 id="edu-welcome-title">{t("welcome.privacyTitle")}</h2>
            <ul className="edu-welcome-facts">
              <li><span className="material-symbols-outlined" aria-hidden="true">cookie</span><div><b>{t("welcome.cookiesTitle")}</b><small>{t("welcome.cookiesBody")}</small></div></li>
              <li><span className="material-symbols-outlined" aria-hidden="true">location_off</span><div><b>{t("welcome.locationTitle")}</b><small>{t("welcome.locationBody")}</small></div></li>
            </ul>
            {/* Danh sách đúng những gì site đặt — thêm cookie/khoá lưu mới thì phải thêm vào welcome.cookieList. */}
            <details className="edu-welcome-more">
              <summary>{t("welcome.cookieMore")}</summary>
              <dl>
                {t("welcome.cookieList").map(([name, kind, why]) => (
                  <div key={name}><dt>{name} <small>· {kind}</small></dt><dd>{why}</dd></div>
                ))}
              </dl>
            </details>
            <label className="edu-welcome-check">
              <input type="checkbox" checked={terms} onChange={(event) => setTerms(event.target.checked)} />
              <span>
                {t("welcome.termsA")} <a href="/terms">{t("common.terms")}</a> {t("login.agreeAnd")}{" "}
                <a href="/privacy">{t("login.policy")}</a>{t("welcome.termsB")}
              </span>
            </label>
            <label className="edu-welcome-check">
              <input type="checkbox" checked={age} onChange={(event) => setAge(event.target.checked)} />
              <span>{rich(t("welcome.age"))}</span>
            </label>
            <button type="button" className="edu-btn edu-btn--wide" disabled={!terms || !age} onClick={accept}>{t("welcome.accept")}</button>
            <button type="button" className="edu-link" onClick={() => setStep(0)}>{t("welcome.back")}</button>
          </>
        )}
        <span className="edu-welcome-dots" aria-hidden="true"><i className={step === 0 ? "is-on" : ""} /><i className={step === 1 ? "is-on" : ""} /></span>
      </div>
    </div>
  );
}
