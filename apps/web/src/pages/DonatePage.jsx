import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import dataApi from "../services/api/modules/dataApi";
import HugoLogo from "../components/HugoLogo";
import { notify } from "../lib/notify";
import { legalDoc } from "../content/legal";

// Khớp DONATION_MIN_AMOUNT / DONATION_MAX_AMOUNT / DONATION_STEP ở apps/server/routes/payosRoutes.js.
const MIN_AMOUNT = 20000;
const MAX_AMOUNT = 100000000;
const STEP = 1000;
// Bấm một mức là sang thẳng màn trả tiền, khỏi gõ.
const QUICK_AMOUNTS = [20000, 50000, 100000, 200000];

// Trang không được liên kết từ đâu cả: chỉ ai có đường dẫn /pay/donate mới vào.
// Việc trả tiền, tự xác nhận và lời cảm ơn do PaymentGatewayPage (/pay/:id) lo.
export default function DonatePage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage || i18n.language;
  const navigate = useNavigate();
  const [digits, setDigits] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const amount = Number(digits);
  const valid = amount >= MIN_AMOUNT && amount <= MAX_AMOUNT && amount % STEP === 0;

  const pay = async (value) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const result = await dataApi.createDonationLink({ amount: value, termsAccepted: true });
      navigate(`/pay/${result.data.customLinkId}`);
    } catch (error) {
      notify.error(error?.message || t("paymentGateway.donateFailed"));
      setSubmitting(false);
    }
  };

  const submit = (event) => {
    event.preventDefault();
    if (valid) pay(amount);
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6 text-foreground sm:py-10">
      <main className="mx-auto w-full max-w-md">
        <header className="mb-5">
          <a href="/" aria-label="Hugo Studio"><HugoLogo className="h-8 w-8" /></a>
        </header>

        <form onSubmit={submit} className="rounded-[28px] border border-border bg-card p-6 shadow-sm sm:p-8">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">{t("paymentGateway.khoanUngHoTu")}</p>
          <h1 className="mt-2 text-2xl font-black sm:text-3xl">{t("paymentGateway.donateTitle")}</h1>

          <div className="mt-6 grid grid-cols-2 gap-2">
            {QUICK_AMOUNTS.map((value) => (
              <button key={value} type="button" disabled={submitting} onClick={() => pay(value)} className="min-h-12 rounded-xl border border-border bg-background text-[15px] font-bold hover:bg-muted disabled:opacity-50">
                {value.toLocaleString("vi-VN")}
              </button>
            ))}
          </div>

          <label className="mt-5 block">
            <span className="text-[15px] text-muted-foreground">{t("paymentGateway.donateAmount")}</span>
            <input
              inputMode="numeric"
              value={digits ? amount.toLocaleString("vi-VN") : ""}
              onChange={(event) => setDigits(event.target.value.replace(/\D/g, "").slice(0, 9))}
              placeholder="50.000"
              className="mt-2 min-h-14 w-full rounded-xl border border-border bg-background px-4 text-2xl font-black outline-none placeholder:text-muted-foreground/50 focus:border-primary"
            />
          </label>
          <p className="mt-2 text-[13px] text-muted-foreground">{t("paymentGateway.donateMin")}</p>

          <button type="submit" disabled={!valid || submitting} className="mt-6 min-h-12 w-full rounded-xl bg-primary px-6 text-[15px] font-bold text-white disabled:opacity-50">
            {submitting ? t("paymentGateway.dangChuanBiThong") : t("paymentGateway.donateContinue")}
          </button>
          <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground">{t("paymentGateway.donateConsent")}</p>
        </form>

        {legalDoc("donate", lang).sections.map((section) => (
          <details key={section.h} className="mt-3 rounded-2xl border border-border bg-card px-5">
            <summary className="flex min-h-12 cursor-pointer items-center text-[15px] font-bold">{section.h}</summary>
            <ul className="list-disc space-y-2 pb-5 pl-5 text-[15px] leading-relaxed text-muted-foreground">
              {section.li.map((text) => <li key={text}>{text}</li>)}
            </ul>
          </details>
        ))}
        <p className="mt-4 text-center text-[13px] text-muted-foreground">
          <a href="/terms" className="underline">{legalDoc("terms", lang).title}</a>
          {" · "}
          <a href="/privacy-policy" className="underline">{legalDoc("privacy", lang).title}</a>
        </p>
      </main>
    </div>
  );
}
