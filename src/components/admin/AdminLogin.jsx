import { useState } from "react";
import { OTPInput, REGEXP_ONLY_DIGITS } from "input-otp";
import { sendAdminCode, verifyAdminCode } from "../../services/api/core/authSession";

/**
 * Đăng nhập quản trị — chỉ sống ở /admin. Không mật khẩu: nhập email, nhận mã 6 số
 * gửi về chính email đó. Email không phải tài khoản quản trị thì không nhận được mã
 * (máy chủ vẫn trả "đã gửi" để không lộ ai là admin).
 */
export default function AdminLogin({ onSuccess }) {
  const [step, setStep] = useState("email"); // email | code
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const sendCode = async (e) => {
    e?.preventDefault();
    setError("");
    setBusy(true);
    const { error: err } = await sendAdminCode(email);
    setBusy(false);
    if (err) { setError(err); return; }
    setCode("");
    setStep("code");
  };

  const submitCode = async (value) => {
    if (value.length !== 6 || busy) return;
    setError("");
    setBusy(true);
    const { session, error: err } = await verifyAdminCode(email, value);
    setBusy(false);
    if (!session) { setError(err); setCode(""); return; }
    onSuccess();
  };

  const field = "w-full min-h-12 rounded-xl border border-border bg-background px-4 text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/40";
  const primary = "min-h-12 w-full rounded-xl bg-foreground text-[15px] font-semibold text-background disabled:opacity-50";

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 text-foreground">
      <div className="w-full max-w-sm">
        <span aria-hidden className="material-symbols-outlined text-[36px] text-muted-foreground">admin_panel_settings</span>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-.02em]">Quản trị Hugo Studio</h1>

        {step === "email" ? (
          <form onSubmit={sendCode} className="mt-6 space-y-3">
            <input className={field} type="email" autoComplete="email" inputMode="email" placeholder="Email quản trị" aria-label="Email quản trị" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <button disabled={busy} className={primary}>{busy ? "Đang gửi…" : "Gửi mã đăng nhập"}</button>
            <p className="text-center text-xs text-muted-foreground">Mã 6 số gửi về email này, dùng trong 5 phút.</p>
          </form>
        ) : (
          <div className="mt-6 space-y-4">
            <p className="text-[15px] text-muted-foreground">Nhập mã vừa gửi tới <span className="font-medium text-foreground">{email}</span>. Không thấy thư thì xem mục Spam.</p>
            <OTPInput
              maxLength={6}
              pattern={REGEXP_ONLY_DIGITS}
              value={code}
              onChange={setCode}
              onComplete={submitCode}
              autoFocus
              aria-label="Mã đăng nhập 6 số"
              containerClassName="flex justify-between"
              render={({ slots }) => slots.map((slot, i) => (
                <div key={i} className={`grid h-14 w-12 place-items-center rounded-xl border text-xl font-semibold tabular-nums ${slot.isActive ? "border-foreground" : "border-border"}`}>
                  {slot.char ?? (slot.hasFakeCaret ? <span className="h-6 w-px animate-pulse bg-foreground" /> : null)}
                </div>
              ))}
            />
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <button type="button" disabled={busy || code.length !== 6} onClick={() => submitCode(code)} className={primary}>
              {busy ? "Đang kiểm tra…" : "Vào trang quản trị"}
            </button>
            <div className="flex justify-between text-sm font-medium text-muted-foreground">
              <button type="button" onClick={() => { setStep("email"); setError(""); }} className="min-h-11">Đổi email</button>
              <button type="button" disabled={busy} onClick={sendCode} className="min-h-11">Gửi lại mã</button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
