import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { loginMemberWithGoogle, loginMemberWithPasskey } from "../services/api/core/authSession";
import { loadGoogleIdentity } from "../utils/loadGoogleIdentity";
import { EduBrand } from "./EduShell";

/**
 * Đăng nhập = đăng ký: lần đầu bấm Google là máy chủ (Better Auth) tạo tài khoản
 * Hugo Studio kèm hồ sơ. Không có đường xác thực thứ hai — cùng
 * `POST /api/auth/sign-in/social` và passkey như www, nên tài khoản tạo ở đây
 * đăng nhập được bên Hugo Studio và ngược lại.
 */
export default function EduLogin({ onSignedIn }) {
  const buttonRef = useRef(null);
  const handlerRef = useRef(() => {});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  // Nút Google hỏng ÂM THẦM khi tên miền chưa nằm trong "Authorized JavaScript
  // origins" của client ID (hoặc bị chặn quảng cáo) — đo chiều cao khung để biết.
  const [blocked, setBlocked] = useState(false);

  const finish = ({ session, error: failure }) => {
    if (session) return onSignedIn(session);
    setError(failure || "Đăng nhập chưa thành công. Thử lại nhé.");
    setBusy(false);
  };

  handlerRef.current = async (response) => {
    if (!response?.credential || busy) return;
    setBusy(true);
    setError("");
    finish(await loginMemberWithGoogle(response.credential));
  };

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setBlocked(true);
      return undefined;
    }
    let cancelled = false;
    let timer;
    loadGoogleIdentity()
      .then((googleId) => {
        if (cancelled || !buttonRef.current) return;
        googleId.initialize({ client_id: clientId, callback: (response) => handlerRef.current(response), use_fedcm_for_prompt: false });
        buttonRef.current.innerHTML = "";
        googleId.renderButton(buttonRef.current, { theme: "outline", size: "large", shape: "pill", width: 300, text: "continue_with" });
        timer = setTimeout(() => !cancelled && setBlocked((buttonRef.current?.offsetHeight || 0) < 20), 2500);
      })
      .catch(() => !cancelled && setBlocked(true));
    return () => { cancelled = true; clearTimeout(timer); };
  }, []);

  const passkey = async () => {
    setBusy(true);
    setError("");
    finish(await loginMemberWithPasskey());
  };

  return (
    <div className="edu-login">
      <header className="edu-login-top"><EduBrand to="/" /></header>
      <main className="edu-login-card">
        <img src="/edu/buddy-correct.svg" alt="" width="120" height="120" />
        <h1>Đăng nhập hoặc tạo tài khoản</h1>
        <p>Một tài khoản dùng cho cả Education Hugo và Hugo Studio. Lần đầu bấm Google là có tài khoản ngay.</p>

        <div ref={buttonRef} className="edu-google" aria-busy={busy} />
        {blocked && (
          <p className="edu-alert" role="alert">
            Chưa hiện được nút Google ở <code>{window.location.origin}</code> — có thể do trình chặn quảng cáo. Thử tải lại trang hoặc dùng passkey.
          </p>
        )}
        <button type="button" className="edu-btn edu-btn--ghost edu-btn--wide" onClick={passkey} disabled={busy}>
          <span className="material-symbols-outlined" aria-hidden="true">passkey</span> Đăng nhập bằng passkey
        </button>
        {busy && <p className="edu-note">Đang xác thực…</p>}
        {error && <p className="edu-alert" role="alert">{error}</p>}

        <p className="edu-note">
          Dành cho người từ 14 tuổi. Học miễn phí; tài khoản được duy trì theo quy định của Hugo Studio (gia hạn bằng JOY kiếm được khi học, hoặc miễn phí 1 năm khi xác minh giáo dục).
        </p>
        <p className="edu-legal">
          Khi tiếp tục, bạn đồng ý với <a href="https://www.hugowishpax.studio/terms" target="_blank" rel="noopener">Điều khoản</a> và{" "}
          <a href="https://www.hugowishpax.studio/privacy-policy" target="_blank" rel="noopener">Chính sách bảo mật</a> của Hugo Studio.
        </p>
        <Link className="edu-link" to="/learn">Học thử chặng 1 trước, không cần tài khoản</Link>
      </main>
    </div>
  );
}
