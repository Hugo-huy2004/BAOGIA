import { Suspense, lazy, useMemo, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getMemberSession } from "../../services/authSession";
import { dataApi } from "../../services/dataApi";
import { motion, AnimatePresence } from "framer-motion";
import { UniversalSessionGuard } from "../../utils/universalSessionGuard";
import { AISelfHealingEngine } from "../../utils/aiSelfHealingEngine";
import AISelfHealingBoundary from "../../components/ui/AISelfHealingBoundary";
import { useHeadMeta } from "../../hooks/useHeadMeta";
import { notify } from "../../lib/notify";

import { resolvePublicTool } from "../../config/publicTools";

const BanhocduongTab = lazy(() => import("../../components/member/banhocduong/BanhocduongTab"));
const TherapyTab = lazy(() => import("../../components/member/banhocduong/TherapyTab"));
const MemberRadioTab = lazy(() => import("../../components/member/MemberRadioTab"));
const MemberAuraTab = lazy(() => import("../../components/member/MemberAuraTab"));
const HugoArcadeTab = lazy(() => import("../../components/member/arcade/HugoArcadeTab"));
const HugoKitApp = lazy(() => import("../../components/member/hugoKit/HugoKitApp"));
const SupportCenterApp = lazy(() => import("../../components/member/support/SupportCenterApp"));
const StandaloneGameShell = lazy(() => import("../../components/member/arcade/StandaloneGameShell"));
const StudyWithHugoApp = lazy(() => import("../../components/member/study/StudyWithHugoApp"));

// Khách chưa đăng nhập được 3 lượt demo HugoKit mỗi ngày. Các tool thuần client
// (QR, chữ ký) đếm bằng localStorage; endpoint file phía server tự đếm theo IP.
const HUGOKIT_DEMO_USES_PER_DAY = 3;

const PUBLIC_TOOL_VISUALS = Object.freeze({
  banhocduong: {
    icon: "school",
    page: "from-sky-500/15 via-cyan-400/8 to-background",
    glowA: "bg-sky-400/25",
    glowB: "bg-cyan-300/20",
    line: "from-sky-500 via-cyan-400 to-blue-600",
    button: "from-sky-500 to-blue-600 shadow-sky-500/25",
  },
  therapy: {
    icon: "psychology",
    page: "from-fuchsia-500/14 via-violet-400/8 to-background",
    glowA: "bg-fuchsia-400/25",
    glowB: "bg-violet-400/20",
    line: "from-fuchsia-500 via-violet-500 to-indigo-600",
    button: "from-fuchsia-500 to-violet-600 shadow-fuchsia-500/25",
  },
  radio: {
    icon: "radio",
    page: "from-orange-500/15 via-rose-400/8 to-background",
    glowA: "bg-orange-400/25",
    glowB: "bg-rose-400/20",
    line: "from-orange-500 via-rose-500 to-fuchsia-600",
    button: "from-orange-500 to-rose-600 shadow-orange-500/25",
  },
  aura: {
    icon: "flare",
    page: "from-emerald-500/14 via-teal-400/8 to-background",
    glowA: "bg-emerald-400/25",
    glowB: "bg-teal-300/20",
    line: "from-emerald-500 via-teal-400 to-cyan-600",
    button: "from-emerald-500 to-teal-600 shadow-emerald-500/25",
  },
  arcade: {
    icon: "sports_esports",
    page: "from-violet-500/15 via-indigo-400/8 to-background",
    glowA: "bg-violet-400/25",
    glowB: "bg-indigo-300/20",
    line: "from-violet-500 via-indigo-500 to-blue-600",
    button: "from-violet-500 to-indigo-600 shadow-violet-500/25",
  },
  hugokit: {
    icon: "folder_zip",
    page: "from-blue-500/14 via-indigo-400/8 to-background",
    glowA: "bg-blue-400/25",
    glowB: "bg-indigo-300/20",
    line: "from-blue-500 via-indigo-500 to-violet-600",
    button: "from-blue-500 to-indigo-600 shadow-blue-500/25",
  },
});

const DEFAULT_TOOL_VISUAL = PUBLIC_TOOL_VISUALS.banhocduong;


export default function UtilityPublicPage() {
  const { tool, page, sub } = useParams();
  const navigate = useNavigate();
  const [activeSession, setActiveSession] = useState(() => getMemberSession());
  const isAuthenticated = !!activeSession?.email;
  const toolConfig = resolvePublicTool(tool);
  const gate = toolConfig?.gate ?? "open";
  const seo = toolConfig ?? {
    title: "Tiện ích Hugo Studio",
    description: "Khám phá tiện ích số trong hệ sinh thái Hugo Studio.",
  };
  const visual = PUBLIC_TOOL_VISUALS[toolConfig?.slug] || DEFAULT_TOOL_VISUAL;

  useHeadMeta({
    title: seo.title,
    description: seo.description,
    canonicalUrl: `https://www.hugowishpax.studio/${tool}`,
    keywords: `${tool}, tiện ích Hugo Studio, ứng dụng dành cho học sinh sinh viên`,
  });

  const [bio, setBio] = useState(null);
  const [therapyState, setTherapyState] = useState({
    historyLogs: [],
    chatMessages: [],
    claimedChallengesToday: [],
  });
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

  useEffect(() => {
    if (toolConfig?.slug !== "therapy" || !activeSession?.email) {
      setTherapyState({ historyLogs: [], chatMessages: [], claimedChallengesToday: [] });
      return undefined;
    }

    let cancelled = false;
    dataApi.getCompanionHistory(activeSession.email)
      .then((snapshot) => {
        if (!cancelled && snapshot) {
          setTherapyState({
            historyLogs: snapshot.historyLogs || [],
            chatMessages: snapshot.chatMessages || [],
            claimedChallengesToday: snapshot.claimedChallengesToday || [],
          });
        }
      })
      .catch((error) => console.error("Public therapy history:", error));

    return () => {
      cancelled = true;
    };
  }, [activeSession?.email, toolConfig?.slug]);

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
  const meetsGate =
    gate === "open" || (gate === "level" || gate === "demo" ? isAuthenticated : isVerified);

  // Lượt demo trong ngày cho tool thuần client của HugoKit (QR, chữ ký).
  const takeDemoUse = () => {
    if (isAuthenticated) return true;
    const key = `hugokit_demo_${new Date().toISOString().slice(0, 10)}`;
    const used = Number(localStorage.getItem(key) || 0);
    if (used >= HUGOKIT_DEMO_USES_PER_DAY) {
      setShowLoginPrompt(true);
      return false;
    }
    localStorage.setItem(key, String(used + 1));
    return true;
  };

  // Only called when a tool reaches a gated action. Browsing and playing stay
  // open — the old blanket onClickCapture blocked every guest click, which
  // defeated the point of giving each app its own public URL.
  const handleIntercept = (e) => {
    if (meetsGate) return true;
    e?.stopPropagation?.();
    e?.preventDefault?.();
    setShowLoginPrompt(true);
    return false;
  };

  const handleBioUpdate = (updates) => {
    setBio((current) => ({ ...(current || {}), ...(updates || {}) }));
  };

  const handleTherapyStateUpdate = async (updates) => {
    if (!handleIntercept()) return;

    setTherapyState((current) => ({ ...current, ...updates }));
    try {
      const result = await dataApi.saveCompanionHistory({
        email: activeSession.email,
        ...updates,
      });
      if (result?.companionHistory) {
        const snapshot = result.companionHistory;
        setTherapyState((current) => ({
          ...current,
          historyLogs: snapshot.historyLogs || current.historyLogs,
          chatMessages: snapshot.chatMessages || current.chatMessages,
          claimedChallengesToday: snapshot.claimedChallengesToday || current.claimedChallengesToday,
        }));
      }
    } catch (error) {
      console.error("Public therapy save:", error);
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
        if (!meetsGate && type !== "error") setShowLoginPrompt(true);
      },
      isGuestMode: !isAuthenticated,
      canUseAccountFeatures: meetsGate,
      requireAccount: handleIntercept,
      onBioUpdate: handleBioUpdate,
    };

    // Game một-URL: mọi mục có `game` dùng chung một nhánh, thêm game mới chỉ
    // là thêm một mục trong publicTools.js chứ không phải một `case` nữa.
    if (toolConfig?.game) {
      return (
        <StandaloneGameShell
          gameId={toolConfig.game}
          bio={player}
          onClose={() => navigate("/arcade")}
        />
      );
    }

    switch (tool) {
      case "banhocduong":
        return <BanhocduongTab {...commonProps} activeSubTab="chat" onSubTabChange={() => handleIntercept(new Event('click'))} sleepAutoDetect={{}} />;
      case "therapy":
      case "psychology":
        return (
          <TherapyTab
            {...commonProps}
            historyLogs={therapyState.historyLogs}
            chatMessages={therapyState.chatMessages}
            claimedChallengesToday={therapyState.claimedChallengesToday}
            onUpdateCompanionState={handleTherapyStateUpdate}
          />
        );
      // Hướng dẫn đọc được không cần tài khoản; tab Yêu cầu tự đổi thành thẻ
      // mời đăng nhập khi `isGuestMode`, nên không cần chặn gì thêm ở đây.
      case "support":
      case "supporter":
        return (
          <SupportCenterApp
            bio={player}
            isGuestMode={!isAuthenticated}
            requireAccount={handleIntercept}
            onClose={() => navigate("/introduction")}
          />
        );
      // Study đứng riêng được: xem trọn lộ trình 100 bài và học thật 10 bài đầu
      // mà không cần tài khoản; bài 11 trở đi mới hiện thẻ đăng nhập + mở gói.
      case "study":
      case "hugoso":
        return (
          <StudyWithHugoApp
            bio={player}
            showToast={commonProps.showToast}
            onBioUpdate={handleBioUpdate}
            previewLessons={toolConfig.previewLessons}
            studyRoute={page || null}
            studySub={sub || null}
            onBack={() => navigate("/introduction")}
          />
        );
      case "radio":
        return <MemberRadioTab {...commonProps} />;
      case "aura":
        return <MemberAuraTab {...commonProps} />;
      case "hugokit":
      case "handle":
        return (
          <HugoKitApp
            bio={player}
            publicLink=""
            showToast={(msg, type) =>
              (notify[type === "error" ? "error" : type === "warning" ? "warning" : "success"])(msg)
            }
            onBack={() => navigate("/introduction")}
            guardTool={(id) => {
              if (id === "links") {
                // LinksTool lưu qua chuỗi setFormData/handleSave của portal —
                // bản public không có, nên đưa thẳng về nơi dùng được.
                if (isAuthenticated) navigate("/member/utilities/handle");
                else setShowLoginPrompt(true);
                return false;
              }
              if (id === "files") return true; // server tự đếm 3 lượt/ngày theo IP
              return takeDemoUse();
            }}
          />
        );
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
    gate === "demo"
      ? {
          icon: "lock_open",
          title: "Đăng nhập để tiếp tục",
          body: `Khách được ${HUGOKIT_DEMO_USES_PER_DAY} lượt demo HugoKit mỗi ngày. Đăng nhập Google miễn phí để dùng không giới hạn và mở đủ 3 mức nén.`,
          action: "Tiếp tục với Google",
          to: `/login?redirect=/${tool}`,
        }
      : gate === "level"
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
            icon: "verified_user",
            title: "Xác thực để trải nghiệm trọn vẹn",
            body: "Đăng nhập Google để lưu dữ liệu và đồng bộ tiến độ. Tài khoản thường được 30 ngày miễn phí; học sinh, sinh viên có email giáo dục được 365 ngày miễn phí.",
            action: "Tiếp tục với Google",
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
    <div className={`relative min-h-screen overflow-hidden bg-gradient-to-b ${visual.page} pt-24 pb-20 px-4 md:px-8`}>
      <div className={`pointer-events-none absolute -left-24 top-8 h-80 w-80 rounded-full ${visual.glowA} blur-[110px]`} />
      <div className={`pointer-events-none absolute -right-20 top-52 h-96 w-96 rounded-full ${visual.glowB} blur-[130px]`} />

      <div className="relative max-w-6xl mx-auto">
        <section className="relative mb-7 overflow-hidden rounded-[2rem] border border-white/35 dark:border-white/10 bg-white/72 dark:bg-card/72 p-6 md:p-8 shadow-2xl shadow-black/5 backdrop-blur-2xl">
          <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${visual.line}`} />
          <div className={`pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full ${visual.glowA} blur-3xl`} />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                <span className="material-symbols-outlined text-[15px]">{visual.icon}</span>
                Hugo Studio · Live demo
              </div>
              <h1 className="text-3xl md:text-5xl font-black tracking-[-0.04em] text-foreground">
                {toolConfig?.heading || seo.title}
              </h1>
              <p className="mt-3 max-w-xl text-sm md:text-base leading-relaxed text-muted-foreground">
                {toolConfig?.summary || seo.description}
              </p>
            </div>

            <div className="w-full lg:w-auto lg:min-w-[360px]">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-2xl border border-border/70 bg-card/70 p-3 backdrop-blur">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {toolConfig?.slug === "radio" ? "Radio demo" : toolConfig?.slug === "hugokit" ? "HugoKit demo" : "Tài khoản thường"}
                  </p>
                  <p className="mt-1 text-base font-black text-foreground">
                    {toolConfig?.slug === "radio" ? "Nghe thử 15 phút" : toolConfig?.slug === "hugokit" ? "3 lượt mỗi ngày" : "30 ngày miễn phí"}
                  </p>
                </div>
                <div className="rounded-2xl border border-primary/20 bg-primary/10 p-3 backdrop-blur">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Học sinh · Sinh viên</p>
                  <p className="mt-1 text-base font-black text-foreground">365 ngày miễn phí</p>
                </div>
              </div>

              {!isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => navigate(`/login?redirect=${encodeURIComponent(`/${tool}`)}`)}
                  className={`mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r ${visual.button} text-sm font-black text-white shadow-lg transition-transform hover:-translate-y-0.5 active:scale-[0.98]`}
                >
                  <span className="material-symbols-outlined text-[18px]">verified_user</span>
                  Xác thực hoặc đăng ký bằng Google
                </button>
              ) : (
                <div className="mt-3 flex h-12 items-center justify-center gap-2 rounded-xl border border-success/25 bg-success/10 text-sm font-bold text-success">
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                  {bio?.isEduVerified ? "Đã xác thực HSSV · 365 ngày" : "Đã đăng nhập · Gói trải nghiệm 30 ngày"}
                </div>
              )}
            </div>
          </div>
        </section>

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
