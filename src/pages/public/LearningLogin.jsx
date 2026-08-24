import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { loginMemberWithGoogle } from "../../services/authSession";
import { loadGoogleIdentity } from "../../utils/loadGoogleIdentity";

/**
 * Đăng nhập ngay trong Hugo Learning — `/study/login`.
 *
 * Trước đây nút đăng nhập ném người dùng sang `/login` của Hugo Studio: đang ở
 * một dịch vụ riêng mà bị đá sang trang khác, quay lại thì mất chỗ đang đứng.
 * Ở đây người học ở nguyên trong Hugo Learning, trên cùng một tab.
 *
 * TÀI KHOẢN VẪN LÀ MỘT: nút Google gọi đúng `POST /api/auth/member/google` mà
 * Hugo Studio dùng; máy chủ xác minh token và phát JWT thành viên. Không có
 * đường xác thực thứ hai — thêm một đường là thêm một chỗ để thủng.
 *
 * Bố cục và sắc màu chép theo trang đăng nhập chính (LoginPage): nền quầng sáng,
 * thẻ kính mờ bo tròn, chữ ký mờ ở góc. Cùng một hành động thì phải trông giống
 * nhau, dù ở hai dịch vụ.
 */
export default function LearningLogin({ onSignedIn, reason = null }) {
  const buttonRef = useRef(null);
  const handlerRef = useRef(() => {});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  handlerRef.current = async (response) => {
    if (!response?.credential || busy) return;
    setBusy(true);
    setError("");
    try {
      // Máy chủ mới là nơi xác minh: client chỉ chuyển tiếp credential.
      const result = await loginMemberWithGoogle(response.credential);
      if (!result?.email) throw new Error("Máy chủ không trả về phiên đăng nhập.");
      onSignedIn?.(result);
    } catch (err) {
      setError(err?.message || "Đăng nhập chưa thành công. Hãy thử lại.");
      setBusy(false);
    }
  };

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError("Chưa cấu hình VITE_GOOGLE_CLIENT_ID nên không dựng được nút đăng nhập.");
      return undefined;
    }

    let cancelled = false;

    // Thư viện Google KHÔNG nạp sẵn trong index.html — dùng bộ nạp dùng chung
    // thay vì tự dò `window.google` (dò mãi mà không ai nạp thì nút không hiện).
    loadGoogleIdentity()
      .then((googleId) => {
        if (cancelled || !googleId || !buttonRef.current) return;
        googleId.initialize({
          client_id: clientId,
          callback: (response) => handlerRef.current(response),
          use_fedcm_for_prompt: false,
        });
        buttonRef.current.innerHTML = "";
        googleId.renderButton(buttonRef.current, {
          theme: document.documentElement.classList.contains("dark") ? "filled_black" : "outline",
          size: "large",
          width: 320,
          text: "continue_with",
        });
      })
      .catch(() => {
        if (!cancelled) setError("Không tải được dịch vụ đăng nhập của Google. Kiểm tra kết nối rồi thử lại.");
      });

    return () => { cancelled = true; };
  }, []);

  return (
    <div className="relative flex min-h-[calc(100svh-66px)] items-center justify-center overflow-hidden px-4 py-12 text-foreground">
      {/* Quầng sáng nền — cùng công thức với trang đăng nhập chính. */}
      <div className="pointer-events-none absolute left-[-10%] top-[-10%] h-[50%] w-[50%] rounded-full bg-gradient-to-tr from-primary/10 to-accent/10 blur-[130px]" />
      <div className="pointer-events-none absolute bottom-[-10%] right-[-10%] h-[45%] w-[45%] rounded-full bg-gradient-to-tr from-info/10 to-primary/10 blur-[130px]" />

      <div className="cine-card-bg cine-border-c relative z-10 w-full max-w-md rounded-[1.75rem] border p-6 transition-all sm:p-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="ios-kicker">Hugo Learning · Hugo Studio</p>
          <h1 className="text-2xl font-extrabold tracking-[-0.035em] text-foreground">
            {reason ? `${reason} cần đăng nhập` : "Đăng nhập Hugo Learning"}
          </h1>
          <p className="cine-muted text-xs leading-relaxed">
            Dùng chung tài khoản với Hugo Studio. Đăng nhập một lần là dùng được cả hai, và tiến độ
            học theo tài khoản chứ không theo thiết bị.
          </p>
        </div>

        <div className="flex flex-col items-center gap-3 py-6">
          <div ref={buttonRef} aria-busy={busy} className="flex min-h-[44px] justify-center" />
          {busy && <p className="text-[11px] text-muted-foreground">Đang xác thực với máy chủ…</p>}
        </div>

        {error && (
          <p className="mb-4 text-center text-[11px] font-medium text-destructive" role="alert">
            {error}
          </p>
        )}

        <div className="flex gap-3 rounded-2xl border border-primary/20 bg-primary/[0.07] p-4 text-left text-[11px] leading-relaxed text-primary">
          <span className="material-symbols-outlined mt-0.5 shrink-0 select-none text-lg text-primary">school</span>
          <div>
            <span className="mb-0.5 block font-bold text-primary">Tài khoản mới</span>
            Bạn sẽ điền vài thông tin bắt buộc để tạo hồ sơ học viên. Email trường học được duyệt mở
            quyền dài hạn; email thường dùng thử 30 ngày.
          </div>
        </div>

        <p className="mt-5 text-center text-[10.5px] leading-relaxed text-muted-foreground">
          Khi đăng nhập, bạn đồng ý với{" "}
          <Link to="/terms" className="text-primary hover:underline">Điều khoản sử dụng</Link> và{" "}
          <Link to="/privacy-policy" className="text-primary hover:underline">Chính sách bảo mật</Link>{" "}
          của Hugo Studio.
        </p>
      </div>
    </div>
  );
}
