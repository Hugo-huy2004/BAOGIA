import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MemberTodayTab from "../components/member/MemberTodayTab";
import TodayArticleReader from "../components/member/TodayArticleReader";
import EcoAccount from "./EcoAccount";
import EcoBadge from "./EcoBadge";
import { isEcoOn } from "./ecoMode";
import "./save-e.css";

// Vỏ portal của chế độ Bảo vệ môi trường: đúng HAI tab.
//
// Trang Today dùng lại nguyên component của chế độ thường (yêu cầu: "Today giữ
// nguyên") — chỉ đổi bảng màu bằng CSS và chặn nó gọi máy chủ theo chu kỳ
// (xem `isEcoOn()` trong useTodayFeed).
export default function EcoPortal() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("today");
  const [articleId, setArticleId] = useState(null);

  // Người dùng tắt chế độ ở tab khác, hoặc mở lại bằng trình duyệt thường:
  // trả về portal bình thường thay vì kẹt ở đây.
  useEffect(() => {
    if (!isEcoOn()) navigate("/member/today", { replace: true });
  }, [navigate]);

  // Nút back của Android/PWA phải đóng bài đang đọc trước, không thoát app.
  useEffect(() => {
    if (!articleId) return undefined;
    const close = () => setArticleId(null);
    window.history.pushState({ ecoReader: true }, "");
    window.addEventListener("popstate", close);
    return () => {
      window.removeEventListener("popstate", close);
      if (window.history.state?.ecoReader) window.history.back();
    };
  }, [articleId]);

  // MemberTodayTab điều hướng bằng đường dẫn `/member/today/<id>`; ở đây chặn
  // lại để mở ngay trong vỏ này, không rơi ra portal thường.
  const handleNavigate = (path) => {
    const match = /^\/member\/today\/([^?]+)/.exec(path);
    if (match) setArticleId(match[1]);
    else navigate(path);
  };

  return (
    <div className="save-e">
      <header className="save-e-top">
        <strong>Hugo · {tab === "today" ? "Bản tin" : "Tài khoản"}</strong>
        <EcoBadge label="Tiết kiệm" size="sm" />
      </header>

      <main className="save-e-main">
        {tab === "today" ? (
          articleId ? (
            <TodayArticleReader articleId={articleId} onBack={() => setArticleId(null)} />
          ) : (
            <MemberTodayTab bio={null} onNavigate={handleNavigate} />
          )
        ) : (
          <EcoAccount onExitEco={() => navigate("/member/today", { replace: true })} />
        )}
      </main>

      <nav className="save-e-tabs" aria-label="Điều hướng">
        <button
          type="button"
          aria-current={tab === "today" ? "page" : undefined}
          onClick={() => { setTab("today"); setArticleId(null); }}
        >
          <span className="material-symbols-outlined" aria-hidden="true">news</span>
          Bản tin
        </button>
        <button
          type="button"
          aria-current={tab === "account" ? "page" : undefined}
          onClick={() => setTab("account")}
        >
          <span className="material-symbols-outlined" aria-hidden="true">person</span>
          Tài khoản
        </button>
      </nav>
    </div>
  );
}
