import { Suspense, lazy, useMemo, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getMemberSession } from "../../services/authSession";
import { dataApi } from "../../services/dataApi";
import { motion, AnimatePresence } from "framer-motion";
import { UniversalSessionGuard } from "../../utils/universalSessionGuard";
import { AISelfHealingEngine } from "../../utils/aiSelfHealingEngine";
import AISelfHealingBoundary from "../../components/ui/AISelfHealingBoundary";
import { useHeadMeta } from "../../hooks/useHeadMeta";

import { resolvePublicTool } from "../../config/publicTools";

const BanhocduongTab = lazy(() => import("../../components/member/banhocduong/BanhocduongTab"));
const TherapyTab = lazy(() => import("../../components/member/banhocduong/TherapyTab"));
const MemberRadioTab = lazy(() => import("../../components/member/MemberRadioTab"));
const MemberAuraTab = lazy(() => import("../../components/member/MemberAuraTab"));
const MemberIdeTab = lazy(() => import("../../components/member/MemberIdeTab"));
const HugoArcadeTab = lazy(() => import("../../components/member/arcade/HugoArcadeTab"));


export default function UtilityPublicPage() {
  const { tool } = useParams();
  const navigate = useNavigate();
  const [activeSession, setActiveSession] = useState(() => getMemberSession());
  const isAuthenticated = !!activeSession?.email;
  const toolConfig = resolvePublicTool(tool);
  const gate = toolConfig?.gate ?? "open";
  const seo = toolConfig ?? {
    title: "Tiện ích Hugo Studio",
    description: "Khám phá tiện ích số trong hệ sinh thái Hugo Studio.",
  };

  useHeadMeta({
    title: seo.title,
    description: seo.description,
    canonicalUrl: `https://www.hugowishpax.studio/${tool}`,
    keywords: `${tool}, tiện ích Hugo Studio, ứng dụng dành cho học sinh sinh viên`,
  });

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

  // "result" tools need an approved student verification, not just a session.
  const isVerified = isAuthenticated && bio?.status !== "pending" && bio?.status !== "rejected";
  const meetsGate = gate === "open" || (gate === "level" ? isAuthenticated : isVerified);

  // Only called when a tool reaches a gated action. Browsing and playing stay
  // open — the old blanket onClickCapture blocked every guest click, which
  // defeated the point of giving each app its own public URL.
  const handleIntercept = (e) => {
    if (meetsGate) return;
    e?.stopPropagation?.();
    e?.preventDefault?.();
    setShowLoginPrompt(true);
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
        if (!meetsGate && type !== "error") setShowLoginPrompt(true);
      },
      isGuestMode: !isAuthenticated,
      requireAccount: handleIntercept
    };

    switch (tool) {
      case "banhocduong":
        return <BanhocduongTab {...commonProps} activeSubTab="chat" onSubTabChange={() => handleIntercept(new Event('click'))} sleepAutoDetect={{}} />;
      case "therapy":
      case "psychology":
        return <TherapyTab {...commonProps} />;
      case "radio":
        return <MemberRadioTab />;
      case "aura":
        return <MemberAuraTab bio={player} setFormData={() => {}} handleSave={() => handleIntercept(new Event('click'))} showToast={commonProps.showToast} />;
      case "ide":
        return <MemberIdeTab />;
      case "arcade":
        return (
          <HugoArcadeTab
            bio={player}
            showToast={commonProps.showToast}
            onBioUpdate={handleIntercept}
            onBack={() => navigate("/introduction")}
          />
        );
      default:
        return (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold mb-4">Công cụ không tồn tại</h2>
            <button onClick={() => navigate("/")} className="text-primary hover:underline">Quay lại trang chủ</button>
          </div>
        );
    }
  };

  // What the visitor is actually being asked for differs per gate, so the prompt
  // says which one and sends them to the step that unblocks it.
  const prompt =
    gate === "level"
      ? {
          icon: "videogame_asset",
          title: "Mở màn tiếp theo",
          body: "Những màn đầu chơi tự do. Để mở màn mới và giữ lại tiến độ, bạn cần tài khoản sinh viên Hugo Studio.",
          action: "Tạo tài khoản sinh viên",
          to: `/login?redirect=/${tool}`,
        }
      : isAuthenticated
        ? {
            icon: "verified_user",
            title: "Tài khoản chưa được xác minh",
            body: "Bạn đã đăng nhập, nhưng cần xác minh email học sinh/sinh viên thì mới nhận được kết quả. Xác minh xong là dùng đầy đủ.",
            action: "Xác minh ngay",
            to: "/member/today",
          }
        : {
            icon: "lock",
            title: "Cần tài khoản để nhận kết quả",
            body: "Bạn dùng thử thoải mái. Để lưu và nhận kết quả của mình, hãy đăng ký tài khoản rồi xác minh email học sinh/sinh viên.",
            action: "Đăng ký & xác minh",
            to: `/login?redirect=/${tool}`,
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

  return (
    <div className="relative min-h-screen bg-surface dark:bg-background pt-24 pb-20 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        {renderToolContent()}
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
                <span className="material-symbols-outlined text-3xl text-primary">{prompt.icon}</span>
              </div>
              <h3 className="text-xl font-black text-foreground mb-3">{prompt.title}</h3>
              <p className="text-muted-foreground text-sm mb-8 leading-relaxed">{prompt.body}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLoginPrompt(false)}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-muted-foreground bg-muted hover:bg-muted/70 transition-colors"
                >
                  Đóng lại
                </button>
                <button
                  onClick={() => navigate(prompt.to)}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 transition-all"
                >
                  {prompt.action}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
