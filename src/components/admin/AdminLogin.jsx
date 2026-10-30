import { useEffect, useState } from "react";
import { OTPInput, REGEXP_ONLY_DIGITS } from "input-otp";
import { loginAdmin, verifyAdminOtp } from "../../services/api/core/authSession";

/**
 * Đăng nhập quản trị — chỉ sống ở /admin, không còn là một thẻ trên /login của
 * thành viên. Hai yếu tố: mật khẩu đúng rồi mới tới mã Telegram 30 giây.
 */
export default function AdminLogin({ onSuccess }) {
  const [step, setStep] = useState("password"); // password | otp
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [tempToken, setTempToken] = useState("");
  const [otp, setOtp] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (step !== "otp" || secondsLeft <= 0) return undefined;
    const timer = setTimeout(() => setSecondsLeft((n) => n - 1), 1000);
    return () => clearTimeout(timer);
  }, [step, secondsLeft]);

  const submitPassword = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res = await loginAdmin({ username: username.trim(), password });
    setBusy(false);
    if (!res.tempToken) {
      setError(res.error === "network" ? "Chưa kết nối được máy chủ." : res.error === "invalid_credentials" ? "Tên đăng nhập hoặc mật khẩu không đúng." : res.error || "Máy chủ báo lỗi.");
      return;
    }
    setTempToken(res.tempToken);
    setPassword("");
    setOtp("");
    setSecondsLeft(res.expiresIn || 30);
    setStep("otp");
    if (!res.otpDelivered) setError(res.message || "Chưa gửi được mã qua Telegram.");
  };

  const submitOtp = async (code) => {
    if (code.length !== 6 || busy) return;
    if (secondsLeft <= 0) { setError("Mã đã hết hạn. Bấm “Gửi lại” để nhận mã mới."); return; }
    setError("");
    setBusy(true);
    const { session, error: err } = await verifyAdminOtp(tempToken, code, { remember: true });
    setBusy(false);
    if (!session) { setError(err || "Mã không đúng."); setOtp(""); return; }
    onSuccess();
  };

  const field = "w-full min-h-12 rounded-xl border border-border bg-background px-4 text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/40";

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 text-foreground">
      <div className="w-full max-w-sm">
        <span aria-hidden className="material-symbols-outlined text-[36px] text-muted-foreground">admin_panel_settings</span>
        <h1 className="mt-2 text-2xl font-semibold tracking-[-.02em]">Quản trị Hugo Studio</h1>

        {step === "password" ? (
          <form onSubmit={submitPassword} className="mt-6 space-y-3">
            <input className={field} autoComplete="username" placeholder="Tên đăng nhập" aria-label="Tên đăng nhập" value={username} onChange={(e) => setUsername(e.target.value)} required />
            <input className={field} type="password" autoComplete="current-password" placeholder="Mật khẩu" aria-label="Mật khẩu" value={password} onChange={(e) => setPassword(e.target.value)} required />
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <button disabled={busy} className="min-h-12 w-full rounded-xl bg-foreground text-[15px] font-semibold text-background disabled:opacity-50">
              {busy ? "Đang kiểm tra…" : "Tiếp tục"}
            </button>
            <p className="text-center text-xs text-muted-foreground">Bước sau: mã 6 số gửi qua Telegram.</p>
          </form>
        ) : (
          <div className="mt-6 space-y-4">
            <p className="text-[15px] text-muted-foreground">Nhập mã 6 số vừa gửi qua Telegram.</p>
            <OTPInput
              maxLength={6}
              pattern={REGEXP_ONLY_DIGITS}
              value={otp}
              onChange={setOtp}
              onComplete={submitOtp}
              autoFocus
              aria-label="Mã xác thực 6 số"
              containerClassName="flex justify-between"
              render={({ slots }) => slots.map((slot, i) => (
                <div key={i} className={`grid h-14 w-12 place-items-center rounded-xl border text-xl font-semibold tabular-nums ${slot.isActive ? "border-foreground" : "border-border"}`}>
                  {slot.char ?? (slot.hasFakeCaret ? <span className="h-6 w-px animate-pulse bg-foreground" /> : null)}
                </div>
              ))}
            />
            <p className="text-sm text-muted-foreground">{secondsLeft > 0 ? `Mã hết hạn sau ${secondsLeft} giây` : "Mã đã hết hạn"}</p>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <button type="button" disabled={busy || otp.length !== 6} onClick={() => submitOtp(otp)} className="min-h-12 w-full rounded-xl bg-foreground text-[15px] font-semibold text-background disabled:opacity-50">
              {busy ? "Đang xác thực…" : "Vào trang quản trị"}
            </button>
            <button type="button" onClick={() => { setStep("password"); setError(""); }} className="min-h-11 w-full text-sm font-medium text-muted-foreground">
              Gửi lại mã (nhập lại mật khẩu)
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
