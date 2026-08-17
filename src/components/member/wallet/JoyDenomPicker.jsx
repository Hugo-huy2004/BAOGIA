import { useState } from "react";
import { useTranslation } from "react-i18next";
import { DENOM_OPTIONS, CROSS_DENOM_FEE, formatDenom } from "../../../../shared/joyCurrency.js";
import { localeForLanguage } from "../../../i18n/languages";
import { chooseJoyDenom } from "../../../services/joyApi";
import { notify } from "../../../lib/notify";

// Chọn đơn vị JOY — hiện khi tài khoản CHƯA chọn.
//
// Vì sao cần màn này dù onboarding đã hỏi: ai đã qua onboarding từ trước thì
// không bị hỏi lại ngay, và ví thì KHÔNG được tự gán một đơn vị rồi hiển thị như
// thể người dùng đã chọn. Chưa chọn thì nói thẳng là chưa chọn.
//
// Chọn xong là cố định (server bỏ qua lần ghi thứ hai) nên phải nói rõ điều đó
// TRƯỚC khi bấm, không phải sau.
export default function JoyDenomPicker({ balance = 0, onChosen }) {
  const { t, i18n } = useTranslation();
  const locale = localeForLanguage(i18n.resolvedLanguage || i18n.language);
  const [picked, setPicked] = useState(null);
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    if (!picked || busy) return;
    setBusy(true);
    try {
      await chooseJoyDenom(picked);
      notify.success(t("memberPortal.walletApp.denomSaved"));
      onChosen?.(picked);
    } catch (error) {
      notify.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="wal-conv">
      <section className="wal-conv__mine">
        <p className="wal-conv__label">{t("memberPortal.walletApp.denomPickTitle")}</p>
        <p className="wal-conv__rate">{t("memberPortal.walletApp.denomPickIntro")}</p>
        <p className="wal-conv__locked">
          <span className="material-symbols-outlined" aria-hidden="true">lock</span>
          {t("memberPortal.walletApp.denomPickLock", { percent: Math.round(CROSS_DENOM_FEE * 100) })}
        </p>
      </section>

      <ul className="wal-conv__list">
        {DENOM_OPTIONS.map((option) => (
          <li key={option.code} className={picked === option.key ? "is-mine" : ""}>
            <button type="button" className="wal-conv__pick" onClick={() => setPicked(option.key)} aria-pressed={picked === option.key}>
              <span className="wal-conv__list-code">
                <strong>{option.code}</strong>
                <small>{option.name}</small>
              </span>
              <span className="wal-conv__list-value">
                {formatDenom(balance, option.key, locale)}
                <small>{t("memberPortal.walletApp.denomPickYourBalance")}</small>
              </span>
              <span className="material-symbols-outlined wal-conv__tick" aria-hidden="true">
                {picked === option.key ? "radio_button_checked" : "radio_button_unchecked"}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <button type="button" className="wal-conv__confirm" onClick={confirm} disabled={!picked || busy}>
        {busy ? t("memberPortal.walletApp.denomSaving") : t("memberPortal.walletApp.denomConfirm")}
      </button>
    </div>
  );
}
