import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { notify } from "../../lib/notify";

const apiBase = import.meta.env.VITE_API_URL || "/api";

const FIELD_META = {
  phone: { icon: "smartphone", inputMode: "tel", autoComplete: "off" },
  birthday: { icon: "cake", inputMode: "numeric", autoComplete: "off" },
  email: { icon: "mark_email_read", inputMode: "numeric", autoComplete: "one-time-code" },
};

/**
 * Đợt kiểm tra thông tin định kỳ. Không có nút "để sau": bỏ qua được thì
 * người khai man chỉ việc bỏ qua mãi mãi, và cả tính năng thành đồ trang trí.
 */
export default function IdentityCheckDialog({ field, attemptsLeft: initialAttempts, emailHint, onPassed, onBlocked, onSwitched }) {
  const { t } = useTranslation();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [attemptsLeft, setAttemptsLeft] = useState(initialAttempts ?? 2);
  const [otpSent, setOtpSent] = useState(false);
  const meta = FIELD_META[field] || FIELD_META.phone;

  // Món "email" xác thực bằng mã gửi tới hòm thư, nên gửi ngay khi mở hộp thoại.
  useEffect(() => {
    if (field !== "email" || otpSent) return;
    setOtpSent(true);
    fetch(`${apiBase}/bios/me/identity-check/send-otp`, { method: "POST", credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        // Máy chủ không gửi được thư thì nó đã tự đổi sang hỏi mục khác — nạp
        // lại câu hỏi thay vì bắt người dùng chờ một mã không bao giờ tới.
        if (d?.error === "EMAIL_UNAVAILABLE") onSwitched?.();
      })
      .catch(() => setError(t("memberPortal.identityCheck.otpSendFailed")));
  }, [field, otpSent, t, onSwitched]);

  const submit = async (e) => {
    e?.preventDefault();
    if (!value.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`${apiBase}/bios/me/identity-check/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ value: value.trim(), field }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.correct) {
        notify.success(t("memberPortal.identityCheck.passed"));
        onPassed?.();
        return;
      }
      // Hết lượt: server đã khoá tài khoản và trả về màn chặn.
      if (res.status === 403 || data.error === "ACCESS_BLOCKED") {
        onBlocked?.(data);
        return;
      }
      // Câu hỏi vừa đổi dưới chân người dùng — nạp lại, không trừ lượt.
      if (data.error === "QUESTION_CHANGED") { onSwitched?.(); return; }
      // Mã hết hạn / chưa gửi: KHÔNG phải trả lời sai, không trừ lượt.
      if (data.error === "NO_ACTIVE_CODE") {
        setOtpSent(false);
        setError(t("memberPortal.identityCheck.codeExpired"));
        setValue("");
        return;
      }
      setAttemptsLeft(data.attemptsLeft ?? 0);
      setError(t("memberPortal.identityCheck.wrongAnswer"));
      setValue("");
    } catch {
      setError(t("memberPortal.identityCheck.networkError"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white dark:bg-background rounded-3xl shadow-2xl border border-border/50 p-6 space-y-5 animate-scaleIn">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-foreground text-3xl shrink-0 mt-0.5">{meta.icon}</span>
          <div>
            <h2 className="font-bold text-base text-foreground leading-tight">
              {t("memberPortal.identityCheck.title")}
            </h2>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {t(`memberPortal.identityCheck.ask.${field}`, { email: emailHint || "" })}
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            inputMode={meta.inputMode}
            autoComplete={meta.autoComplete}
            placeholder={t(`memberPortal.identityCheck.placeholder.${field}`)}
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
          />

          {error && (
            <p className="text-xs font-semibold text-destructive leading-relaxed">
              {error}{" "}
              {attemptsLeft > 0
                ? t("memberPortal.identityCheck.attemptsLeft", { count: attemptsLeft })
                : t("memberPortal.identityCheck.lastChance")}
            </p>
          )}

          <button
            type="submit"
            disabled={busy || !value.trim()}
            className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-base ${busy ? "animate-spin" : ""}`}>
              {busy ? "progress_activity" : "verified_user"}
            </span>
            {t("memberPortal.identityCheck.submit")}
          </button>
        </form>

        <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
          {t("memberPortal.identityCheck.warning")}
        </p>
      </div>
    </div>
  );
}
