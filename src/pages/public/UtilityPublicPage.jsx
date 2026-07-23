import React, { Suspense, lazy, useMemo, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getMemberSession } from "../../services/authSession";
import { dataApi } from "../../services/dataApi";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { UniversalSessionGuard } from "../../utils/universalSessionGuard";
import { AISelfHealingEngine } from "../../utils/aiSelfHealingEngine";
import AISelfHealingBoundary from "../../components/ui/AISelfHealingBoundary";

const BanhocduongTab = lazy(() => import("../../components/member/banhocduong/BanhocduongTab"));
const TherapyTab = lazy(() => import("../../components/member/banhocduong/TherapyTab"));
const MemberRadioTab = lazy(() => import("../../components/member/MemberRadioTab"));
const MemberAuraTab = lazy(() => import("../../components/member/MemberAuraTab"));
const MemberIdeTab = lazy(() => import("../../components/member/MemberIdeTab"));
const HugoSkinTab = lazy(() => import("../../components/member/HugoSkinTab"));
const ChessGame = lazy(() => import("../../components/chess/ChessGame"));

const TITLES = {
  "banhocduong": "Bạn Học Đường - AI Trợ Lý Học Tập | Hugo Studio",
  "therapy": "Hugo PSY - AI Trợ Lý Trị Liệu Tâm Lý | Hugo Studio",
  "psychology": "Hugo PSY - AI Trợ Lý Trị Liệu Tâm Lý | Hugo Studio",
  "hugoskin": "Hugo Skin - Phân Tích Da & Tỷ Lệ Vàng | Hugo Studio",
  "radio": "Hugo Radio - Trạm Phát Sóng Cảm Xúc",
  "aura": "Aura AI - Hình Nền Năng Lượng Độc Bản",
  "ide": "Web IDE Cùng AI - Hugo Studio",
  "arcade": "Hugo Arcade - Trò Chơi Giải Trí",
  "helpdesk": "Hugo HelpDesk - Thẻ Thông Minh & Chữ Ký Email"
};

export default function UtilityPublicPage() {
  const { tool } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeSession, setActiveSession] = useState(() => getMemberSession());
  const isAuthenticated = !!activeSession?.email;

  const [bio, setBio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    AISelfHealingEngine.initGlobalErrorCatchers();
    UniversalSessionGuard.getOrRefreshSession()
      .then(validSession => {
        if (validSession) {
          setActiveSession(validSession);
          return dataApi.getMemberBio(validSession.email, validSession.displayName, validSession.avatarUrl);
        }
      })
      .then(res => {
        if (res?.bio) setBio(res.bio);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Provide mock bio for guest mode if needed
  const player = useMemo(() => {
    if (bio) return bio;
    if (activeSession) return {
      email: activeSession.email,
      displayName: activeSession.displayName || activeSession.name || activeSession.email?.split("@")[0] || "Người chơi",
      avatarUrl: activeSession.avatarUrl || "",
    };
    return null;
  }, [bio, activeSession]);

  const handleIntercept = (e) => {
    if (!isAuthenticated) {
      e?.stopPropagation?.();
      e?.preventDefault?.();
      setShowLoginPrompt(true);
    }
  };

  const renderTool = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    const commonProps = {
      bio: player,
      showToast: (msg, type) => {
        if (!isAuthenticated && type !== 'error') setShowLoginPrompt(true);
      },
      isGuestMode: !isAuthenticated
    };

    switch (tool) {
      case "banhocduong":
        return <BanhocduongTab {...commonProps} activeSubTab="chat" onSubTabChange={() => handleIntercept(new Event('click'))} sleepAutoDetect={{}} />;
      case "therapy":
      case "psychology":
        return <TherapyTab {...commonProps} />;
      case "hugoskin":
        return <HugoSkinTab bio={player} showToast={commonProps.showToast} />;
      case "radio":
        return <MemberRadioTab />;
      case "aura":
        return <MemberAuraTab bio={player} setFormData={() => {}} handleSave={() => handleIntercept(new Event('click'))} showToast={commonProps.showToast} />;
      case "ide":
        return <MemberIdeTab />;
      case "arcade":
        return <ChessGame bio={player} onBack={() => navigate("/")} />;
      default:
        return (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold mb-4">Công cụ không tồn tại</h2>
            <button onClick={() => navigate("/")} className="text-primary hover:underline">Quay lại trang chủ</button>
          </div>
        );
    }
  };

  const renderToolContent = () => (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }
    >
      <AISelfHealingBoundary>
        {renderTool()}
      </AISelfHealingBoundary>
    </Suspense>
  );

  useEffect(() => {
    if (TITLES[tool]) {
      document.title = TITLES[tool];
    }
  }, [tool]);

  return (
    <div className="relative min-h-screen bg-surface dark:bg-background pt-24 pb-20 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <div onClickCapture={!isAuthenticated ? handleIntercept : undefined}>
          {renderToolContent()}
        </div>
      </div>

      <AnimatePresence>
        {showLoginPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-card rounded-3xl p-8 max-w-md w-full text-center shadow-2xl border border-border"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-3xl text-primary">lock</span>
              </div>
              <h3 className="text-xl font-black text-foreground mb-3">Vui lòng đăng nhập</h3>
              <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
                Để sử dụng đầy đủ các tính năng lưu trữ, cá nhân hoá và tương tác với tiện ích này, bạn cần đăng nhập vào tài khoản Hugo Studio.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLoginPrompt(false)}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-muted-foreground bg-muted hover:bg-muted/70 transition-colors"
                >
                  Đóng lại
                </button>
                <button
                  onClick={() => navigate(`/login?redirect=/${tool}`)}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 transition-all"
                >
                  Đăng Nhập
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
