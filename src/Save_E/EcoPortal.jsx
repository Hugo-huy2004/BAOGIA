import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import MemberTodayTab from "../components/member/MemberTodayTab";
import TodayArticleReader from "../components/member/TodayArticleReader";
import EcoAccount from "./EcoAccount";
import EcoBadge from "./EcoBadge";
import EcoSaved from "./EcoSaved";
import EcoSaveBar from "./EcoSaveBar";
import EcoGreen from "./EcoGreen";
import { isEcoOn, subscribeEcoMode } from "./ecoMode";
import { startEcoClock, stopEcoClock, listSaved } from "./ecoStore";
import "./save-e.css";

// Vỏ portal của chế độ Bảo vệ môi trường: bốn mục, tất cả đều rẻ.
//
// Trang Today dùng lại nguyên component của chế độ thường (yêu cầu: "Today giữ
// nguyên") — chỉ đổi bảng màu bằng CSS và chặn nó gọi máy chủ theo chu kỳ
// (xem `isEcoOn()` trong useTodayFeed).
const TABS = [
  { id: "today", icon: "news", label: "Bản tin" },
  { id: "saved", icon: "recycling", label: "Đọc lại" },
  { id: "account", icon: "account_balance_wallet", label: "Ví" },
  { id: "green", icon: "eco", label: "Xanh" },
];

export default function EcoPortal() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("today");
  const [articleId, setArticleId] = useState(null);
  const exit = () => navigate("/member/today", { replace: true });

  // Người dùng tắt chế độ ở tab khác, chuyển sang mức "tự động" rồi cắm sạc,
  // hoặc mở lại bằng trình duyệt thường: trả về portal bình thường thay vì kẹt.
  useEffect(() => {
    if (!isEcoOn()) exit();
    return subscribeEcoMode(() => { if (!isEcoOn()) exit(); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Đồng hồ tiết kiệm: chỉ tính lúc app thực sự đang mở trước mặt người dùng.
  useEffect(() => {
    startEcoClock();
    const onVisibility = () => (document.hidden ? stopEcoClock() : startEcoClock());
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      stopEcoClock();
    };
  }, []);

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

  const active = TABS.find((item) => item.id === tab);

  return (
    <div className="save-e">
      <header className="save-e-top">
        <strong>Hugo · {active?.label}</strong>
        <EcoBadge label="Tiết kiệm" size="sm" />
      </header>

      <main className="save-e-main">
        {tab === "today" ? (
          articleId ? (
            <>
              <EcoSaveBar articleId={articleId} />
              <TodayArticleReader articleId={articleId} onBack={() => setArticleId(null)} />
            </>
          ) : (
            <MemberTodayTab bio={null} onNavigate={handleNavigate} />
          )
        ) : null}
        {tab === "saved" ? <EcoSaved /> : null}
        {tab === "account" ? <EcoAccount /> : null}
        {tab === "green" ? <EcoGreen onExitEco={exit} /> : null}
      </main>

      <nav className="save-e-tabs" aria-label="Điều hướng">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-current={tab === item.id ? "page" : undefined}
            onClick={() => { setTab(item.id); setArticleId(null); }}
          >
            <span className="material-symbols-outlined" aria-hidden="true">{item.icon}</span>
            {item.label}
            {item.id === "saved" && listSaved().length ? (
              <span className="save-e-dot" aria-hidden="true" />
            ) : null}
          </button>
        ))}
      </nav>
    </div>
  );
}
