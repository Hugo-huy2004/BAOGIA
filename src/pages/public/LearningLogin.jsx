import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { loginMemberWithGoogle } from "../../services/authSession";
import { loadGoogleIdentity } from "../../utils/loadGoogleIdentity";

/**
 * Liên kết tài khoản — `/study/login`.
 *
 * Đây không phải "một cái nút Google giữa màn hình trống". Với người mới, đây
 * là chỗ họ quyết định có giao email của mình cho một dịch vụ lạ hay không, nên
 * màn này phải trả lời ba câu trước khi hỏi: liên kết để được gì, lấy những gì
 * của tôi, và ai đứng sau.
 *
 * TÀI KHOẢN VẪN LÀ MỘT: nút Google gọi đúng `POST /api/auth/member/google` mà
 * Hugo Studio dùng; máy chủ xác minh token và phát JWT thành viên. Không có
 * đường xác thực thứ hai — thêm một đường là thêm một chỗ để thủng.
 */

const BENEFITS = [
  {
    icon: "sync_alt",
    title: "Tiến độ đi theo bạn",
    body: "Học dở trên điện thoại, mở máy tính là học tiếp đúng chỗ đó. Tiến độ lưu theo tài khoản chứ không theo trình duyệt.",
  },
  {
    icon: "workspace_premium",
    title: "Chứng nhận đứng tên bạn",
    body: "Điểm thi, xếp loại và giấy chứng nhận gắn với tài khoản, có địa chỉ công khai để người khác tự đối chiếu.",
  },
  {
    icon: "apps",
    title: "Một tài khoản, cả hệ sinh thái",
    body: "Cùng tài khoản dùng được Hugo Learning và các sản phẩm khác của Hugo Studio. Đăng nhập một lần là xong.",
  },
  {
    icon: "lock",
    title: "Chỉ lấy thứ cần thiết",
    body: "Google chỉ chuyển tên, email và ảnh đại diện. Hugo Studio không thấy mật khẩu của bạn và không đăng gì thay bạn.",
  },
];

export default function LearningLogin({ onSignedIn, reason = null }) {
  const buttonRef = useRef(null);
  const handlerRef = useRef(() => {});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  // Nút Google dựng bên trong một iframe của Google. Nó hỏng ÂM THẦM khi tên
  // miền đang mở chưa nằm trong "Authorized JavaScript origins" của client ID —
  // không ném lỗi, chỉ không có gì hiện ra. Đo bằng chiều cao thật của khung.
  const [buttonBlocked, setButtonBlocked] = useState(false);

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
    let checkTimer;

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
        checkTimer = setTimeout(() => {
          if (!cancelled) setButtonBlocked((buttonRef.current?.offsetHeight || 0) < 20);
        }, 2500);
      })
      .catch(() => {
        if (!cancelled) setButtonBlocked(true);
      });

    return () => { cancelled = true; clearTimeout(checkTimer); };
  }, []);

  return (
    <section className="learning-link">
      {/* Ba khối anh em, KHÔNG lồng nhau: trên điện thoại lưới xếp lại thành
          tiêu đề → nút → lý do, để việc cần làm không bị bốn đoạn giải thích
          đẩy xuống dưới màn. */}
      <div className="learning-link-head">
        <p className="landing-eyebrow">Liên kết tài khoản</p>
        <h1>{reason ? `${reason} cần tài khoản Hugo Studio` : "Liên kết tài khoản Hugo Studio"}</h1>
        <p className="learning-link-lead">
          Hugo Learning không có tài khoản riêng. Bạn liên kết bằng tài khoản Hugo Studio — đăng nhập
          một lần là dùng được cả hai, và việc học của bạn không còn phụ thuộc vào chiếc máy đang ngồi.
        </p>
      </div>

      <ul className="learning-link-benefits">
        {BENEFITS.map((item) => (
          <li key={item.icon}>
            <span className="material-symbols-outlined" aria-hidden="true">{item.icon}</span>
            <div>
              <strong>{item.title}</strong>
              <span>{item.body}</span>
            </div>
          </li>
        ))}
      </ul>

      <div className="learning-link-card">
        <p className="learning-link-brands">
          <b>Hugo Studio</b>
          <i aria-hidden="true" />
          <span>Google</span>
        </p>

        <div ref={buttonRef} aria-busy={busy} className="learning-link-google" />
        {busy && <p className="learning-link-note">Đang xác thực với máy chủ…</p>}

        {buttonBlocked && (
          <div className="learning-link-alert" role="alert">
            <strong>Chưa hiện được nút Google</strong>
            Dịch vụ đăng nhập của Google không dựng được nút ở địa chỉ đang mở
            (<code>{window.location.origin}</code>). Thường là do tiện ích chặn quảng cáo, hoặc do
            địa chỉ này chưa được khai báo cho ứng dụng Google của Hugo Studio.
            <button type="button" className="landing-btn" onClick={() => window.location.reload()}>
              Tải lại trang
            </button>
          </div>
        )}

        {error && <p className="learning-link-error" role="alert">{error}</p>}

        <p className="learning-link-new">
          <strong>Lần đầu dùng?</strong> Bạn sẽ điền vài thông tin để tạo hồ sơ học viên. Email
          trường học được duyệt mở quyền dài hạn; email thường dùng thử 30 ngày.
        </p>

        {/* Cửa thứ hai, luôn có mặt: nút Google hỏng (chặn quảng cáo, sai khai báo
            tên miền, cookie bên thứ ba) thì vẫn còn đường vào bằng trang đăng
            nhập của chính Hugo Studio. Một màn đăng nhập chỉ có đúng một lối
            là một ngõ cụt chờ sẵn. */}
        <p className="learning-link-note">
          Không đăng nhập được ở đây?{" "}
          <a href="/login?redirect=%2Fstudy%2Fkhoa-hoc" target="_blank" rel="noopener">
            Mở trang đăng nhập Hugo Studio
          </a>
        </p>

        <p className="learning-link-terms">
          Khi liên kết, bạn đồng ý với{" "}
          <Link to="/terms">Điều khoản sử dụng</Link> và{" "}
          <Link to="/privacy-policy">Chính sách bảo mật</Link> của Hugo Studio.
        </p>
      </div>
    </section>
  );
}
