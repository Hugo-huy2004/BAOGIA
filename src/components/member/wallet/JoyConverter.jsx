import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  DENOM_OPTIONS, CROSS_DENOM_FEE,
  denomKey, denomOf, toDenom, fromDenom, formatDenom, isCrossDenom,
} from "../../../../shared/joyCurrency.js";
import { localeForLanguage } from "../../../i18n/languages";
import { useJoy } from "../../../lib/joyDisplay";
import JoyRateChart from "./JoyRateChart";

// Bộ đối chiếu đơn vị.
//
// Một số tiền, viết theo tất cả các đơn vị. Điều quan trọng nhất để không ai đọc
// màn này mà hiểu sai: GIÁ TRỊ KHÔNG ĐỔI — 10.000 JOYmi và 400 JOYka mua được
// đúng những thứ như nhau, chỉ là hai cách viết cùng một số. Vì vậy màn này
// không hiện "đơn vị tính bên trong" nữa: người dùng chỉ cần thấy số của mình
// đọc ra sao ở đơn vị khác, còn phép tính là việc của hệ thống.
export default function JoyConverter({ balance = 0, denom }) {
  const { t, i18n } = useTranslation();
  const myDenom = denomKey(denom);
  const locale = localeForLanguage(i18n.resolvedLanguage || i18n.language);
  const mine = denomOf(myDenom);
  const { rates } = useJoy();
  const pct = (value) => `${value > 0 ? "+" : ""}${(value * 100).toFixed(2)}%`;

  // Gõ theo đơn vị của mình, không phải gõ JOY — đây là điểm của cả tính năng.
  const [input, setInput] = useState(() => String(toDenom(balance, myDenom).amount));
  const joy = useMemo(() => fromDenom(input.replace(",", "."), myDenom), [input, myDenom]);

  return (
    <div className="wal-conv">
      <section className="wal-conv__mine">
        <p className="wal-conv__label">{t("memberPortal.walletApp.convMyDenom")}</p>
        <p className="wal-conv__code">{mine.code}</p>
        <p className="wal-conv__locked">
          <span className="material-symbols-outlined" aria-hidden="true">lock</span>
          {t("memberPortal.walletApp.convLocked")}
        </p>
      </section>

      <section className="wal-conv__box">
        <label className="wal-conv__field">
          <small>{t("memberPortal.walletApp.convAmountIn", { code: mine.code })}</small>
          <input
            type="text"
            inputMode="decimal"
            value={input}
            onChange={(event) => setInput(event.target.value.replace(/[^\d.,]/g, ""))}
            aria-label={t("memberPortal.walletApp.convAmountIn", { code: mine.code })}
          />
        </label>
        <button type="button" className="wal-conv__fill" onClick={() => setInput(String(toDenom(balance, myDenom).amount))}>
          {t("memberPortal.walletApp.convUseBalance", { amount: formatDenom(balance, myDenom, locale) })}
        </button>
      </section>

      {/* Đường tỷ giá của chính đơn vị người dùng đang dùng — thứ đầu tiên họ
          muốn thấy khi mở màn Tỷ Giá. */}
      <JoyRateChart denom={myDenom} code={mine.code} />

      {/* Vì sao con số nhúc nhích mỗi ngày — nói thẳng, kèm đúng hai đầu vào.
          Không nói thì người dùng mở ví thấy số khác hôm qua và tưởng bị trừ. */}
      {rates?.gold && (
        <section className="wal-conv__market">
          <p className="wal-conv__label">{t("memberPortal.walletApp.marketTitle")}</p>
          <p className="wal-conv__market-note">
            {t("memberPortal.walletApp.marketWhy", {
              income: Math.round(rates.dailyIncome || 0).toLocaleString(locale),
              gold: Math.round(rates.gold.price || 0).toLocaleString(locale),
            })}
          </p>
          <p className="wal-conv__market-note is-fixed">
            <span className="material-symbols-outlined" aria-hidden="true">lock</span>
            {t("memberPortal.walletApp.marketPricesFixed")}
          </p>
        </section>
      )}

      {/* Cùng một số JOY, viết theo mọi đơn vị — nhìn là hiểu đơn vị không đổi giá trị */}
      <h3 className="wal-conv__title">{t("memberPortal.walletApp.convTableTitle", { joy })}</h3>
      <ul className="wal-conv__list">
        {DENOM_OPTIONS.map((option) => {
          const cross = isCrossDenom(myDenom, option.key);
          return (
            <li key={option.code} className={option.code === mine.code ? "is-mine" : ""}>
              <span className="wal-conv__list-code">
                <strong>{option.code}</strong>
                {/* Tên riêng của đơn vị — không dịch, và không phải tên tiền
                    thật của nước nào. */}
                <small>{option.name}</small>
              </span>
              <span className="wal-conv__list-value">
                {formatDenom(joy, option.key, locale)}
                {/* Biến động trong ngày — dấu và màu nói hướng, con số nói mức */}
                {rates?.change?.[option.key] !== undefined && (
                  <small className={`wal-conv__move${rates.change[option.key] >= 0 ? " is-up" : " is-down"}`}>
                    <span className="material-symbols-outlined" aria-hidden="true">
                      {rates.change[option.key] >= 0 ? "trending_up" : "trending_down"}
                    </span>
                    {pct(rates.change[option.key])}
                  </small>
                )}
                {cross && (
                  <small>{t("memberPortal.walletApp.convFeeNote", { percent: Math.round(CROSS_DENOM_FEE * 100) })}</small>
                )}
              </span>
            </li>
          );
        })}
      </ul>

      <p className="wal-conv__note">
        {t("memberPortal.walletApp.convExplain", {
          units: DENOM_OPTIONS.length,
          percent: Math.round(CROSS_DENOM_FEE * 100),
        })}
      </p>
    </div>
  );
}
