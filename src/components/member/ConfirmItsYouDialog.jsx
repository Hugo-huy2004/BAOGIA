import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { getMemberSession, loginMemberWithGoogle, loginMemberWithPasskey } from "../../services/api/core/authSession";
import { webauthnHelper } from "../../utils/webauthnHelper";
import { loadGoogleIdentity } from "../../utils/loadGoogleIdentity";
import { nativeGoogleIdToken } from "../../utils/nativeGoogle";
import { IS_NATIVE } from "../../config/platform";

/**
 * "Xác nhận đây là bạn" — kiểu Apple: mở khoá bằng Face ID / vân tay (passkey)
 * hoặc Google, không hỏi thông tin cá nhân. Thành công thì server đóng dấu phiên
 * mới (`verifiedAt`) và thao tác nhạy cảm đi tiếp trong 5 phút.
 *
 * `reason`: một câu nói vì sao đang hỏi. `onCancel` vắng mặt = không có nút huỷ
 * (đợt xác nhận định kỳ).
 */
export default function ConfirmItsYouDialog({ reason, onConfirmed, onCancel }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const googleRef = useRef(null);
  const doneRef = useRef(onConfirmed);
  doneRef.current = onConfirmed;
  // Chủ phiên lúc mở hộp — để nhận ra người dùng lỡ chọn tài khoản khác.
  const expectedRef = useRef(getMemberSession()?.email?.toLowerCase() || "");
  const canPasskey = webauthnHelper.isSupported();

  // Đăng nhập lại bằng tài khoản KHÁC là đổi người dùng, không phải xác nhận.
  const finish = (session, err) => {
    const expected = expectedRef.current;
    if (!session) { setError(err ? t("memberPortal.confirmItsYou.failed") : ""); return; }
    if (expected && session.email.toLowerCase() !== expected) {
      setError(t("memberPortal.confirmItsYou.wrongAccount"));
      window.setTimeout(() => window.location.reload(), 2500);
      return;
    }
    doneRef.current?.();
  };

  const withBusy = (fn) => async () => {
    if (busy) return;
    setBusy(true);
    setError("");
    try { await fn(); } finally { setBusy(false); }
  };

  const usePasskey = withBusy(async () => {
    const { session, error: err } = await loginMemberWithPasskey();
    // Người dùng tự đóng bảng Face ID thì im lặng, không báo lỗi.
    finish(session, err && !/abort|cancel|not allowed/i.test(err) ? err : null);
  });

  const useNativeGoogle = withBusy(async () => {
    try {
      const token = await nativeGoogleIdToken();
      const { session, error: err } = await loginMemberWithGoogle(token);
      finish(session, err);
    } catch (err) {
      if (!/cancel/i.test(err?.message || "")) setError(t("memberPortal.confirmItsYou.failed"));
    }
  });

  // Nút Google của trình duyệt: Google tự vẽ nút vào ô này.
  useEffect(() => {
    if (IS_NATIVE || !import.meta.env.VITE_GOOGLE_CLIENT_ID) return;
    let cancelled = false;
    loadGoogleIdentity().then((googleId) => {
      if (cancelled || !googleRef.current) return;
      googleId.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        use_fedcm_for_prompt: false,
        callback: async ({ credential }) => {
          setBusy(true);
          const { session, error: err } = await loginMemberWithGoogle(credential);
          setBusy(false);
          finish(session, err);
        },
      });
      googleRef.current.innerHTML = "";
      googleId.renderButton(googleRef.current, {
        theme: "outline", size: "large", shape: "pill", text: "continue_with",
        width: Math.round(Math.min(360, googleRef.current.getBoundingClientRect().width || 300)),
      });
    }).catch(() => {});
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-labelledby="confirm-its-you-title">
      <div className="w-full max-w-sm rounded-3xl bg-card text-card-foreground border border-border shadow-2xl p-6 space-y-5">
        <div className="flex flex-col items-center text-center gap-3">
          <span className="material-symbols-outlined text-5xl text-foreground" aria-hidden="true">fingerprint</span>
          <h2 id="confirm-its-you-title" className="text-lg font-bold text-foreground">{t("memberPortal.confirmItsYou.title")}</h2>
          <p className="text-[15px] leading-relaxed text-muted-foreground">{reason || t("memberPortal.confirmItsYou.body")}</p>
        </div>

        {canPasskey && (
          <button type="button" onClick={usePasskey} disabled={busy}
            className="w-full min-h-12 rounded-2xl bg-foreground text-background font-semibold text-[15px] flex items-center justify-center gap-2 disabled:opacity-50">
            <span className={`material-symbols-outlined text-xl ${busy ? "animate-spin" : ""}`} aria-hidden="true">{busy ? "progress_activity" : "face"}</span>
            {t("memberPortal.confirmItsYou.passkey")}
          </button>
        )}

        {canPasskey && <p className="text-center text-xs text-muted-foreground">{t("memberPortal.confirmItsYou.or")}</p>}

        {IS_NATIVE ? (
          <button type="button" onClick={useNativeGoogle} disabled={busy}
            className="w-full min-h-12 rounded-2xl border border-border text-foreground font-semibold text-[15px] disabled:opacity-50">
            {t("memberPortal.confirmItsYou.google")}
          </button>
        ) : (
          <div ref={googleRef} className="flex justify-center min-h-11" />
        )}

        {error && <p role="alert" className="text-sm text-center font-medium text-destructive">{error}</p>}

        <p className="text-xs text-center leading-relaxed text-muted-foreground">{t("memberPortal.confirmItsYou.privacy")}</p>

        {onCancel && (
          <button type="button" onClick={onCancel} disabled={busy} className="w-full min-h-11 text-[15px] font-medium text-muted-foreground">
            {t("memberPortal.confirmItsYou.cancel")}
          </button>
        )}
      </div>
    </div>
  );
}
