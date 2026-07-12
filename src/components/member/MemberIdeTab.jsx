import React, { useMemo, useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import { 
  FolderOpen, Folder, BookOpen, Database, Play, Plus, X, 
  Terminal, AlertTriangle, ArrowLeft, Save, Eye,
  Edit2, Trash2, ChevronDown, ChevronRight, FileCode, FileText, FileJson,
  Sparkles, CheckCircle, Award, RefreshCw, Smartphone, ListChecks, Globe, Archive
} from "lucide-react";
import { notify } from "../../lib/notify";
import confetti from "canvas-confetti";
import { HugoConfirmNotice } from "../shared/HugoNotice";
import { getMemberSession } from "../../services/authSession";
import { useJoyStore } from "../../stores/joyStore";
import { TEMPLATES, INITIAL_WORKSPACE, QUIZ_POOL_1, QUIZ_POOL_2 } from "./ideData";
import { WEB_COURSES, MOBILE_GUIDE_EXTRAS } from "./hugoCoder/lessons";
import { renderMobileIllustration, getMobileVisualSet, renderVisualArtwork } from "./hugoCoder/VisualIllustrations";
import InteractivePuzzles from "./hugoCoder/InteractivePuzzles";
import CertificateModal from "./hugoCoder/CertificateModal";
import MobileGuidebook from "./hugoCoder/MobileGuidebook";
import LessonsSidebar from "./hugoCoder/LessonsSidebar";
import FileExplorerSidebar from "./hugoCoder/FileExplorerSidebar";
import { runMockSql, runMockPhp } from "./hugoCoder/mockRunner";
import FeatureGate from "./shared/FeatureGate";
import {
  CODER_STORAGE_KEYS,
  MIN_LESSON_STUDY_MS,
  buildLessonEvidence,
  buildPreviewHtml,
  createWorkspaceZipBlob,
  downloadBlob,
  makeSerializableWorkspace,
  recordCoderLessonEvent,
  scoreScreenshotSubmission,
  stripCodeComments
} from "./hugoCoder/workspaceUtils";

// Helper to resolve language from file extension
const getLanguageFromExt = (ext) => {
  switch (ext) {
    case "py": return "python";
    case "js": return "javascript";
    case "cs": return "csharp";
    case "cpp": case "c": return "cpp";
    case "html": return "html";
    case "css": return "css";
    case "php": return "php";
    case "md": return "markdown";
    case "json": return "json";
    default: return "plaintext";
  }
};

// Helper to render extension icon with semantic colors
const getFileIcon = (fileName) => {
  const ext = fileName.split(".").pop().toLowerCase();
  switch (ext) {
    case "py":
      return <FileCode className="w-3.5 h-3.5 text-warning flex-shrink-0" />;
    case "cpp":
    case "c":
      return <FileCode className="w-3.5 h-3.5 text-info flex-shrink-0" />;
    case "cs":
      return <FileCode className="w-3.5 h-3.5 text-accent flex-shrink-0" />;
    case "php":
      return <FileCode className="w-3.5 h-3.5 text-accent flex-shrink-0" />;
    case "html":
      return <FileCode className="w-3.5 h-3.5 text-warning flex-shrink-0" />;
    case "css":
      return <FileCode className="w-3.5 h-3.5 text-info flex-shrink-0" />;
    case "js":
      return <FileCode className="w-3.5 h-3.5 text-warning flex-shrink-0" />;
    case "md":
      return <FileText className="w-3.5 h-3.5 text-success flex-shrink-0" />;
    case "json":
      return <FileJson className="w-3.5 h-3.5 text-warning flex-shrink-0" />;
    default:
      return <FileText className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />;
  }
};





import { useNavigate } from "react-router-dom";

export default function MemberIdeTab({ onBack, bio, onBioUpdate, urlLessonId }) {
  const [isDesktop, setIsDesktop] = useState(true);
  const [activeSidebarTab, setActiveSidebarTab] = useState("explorer"); // explorer, learn, db

  const navigate = useNavigate();
  const [activeCourseId, setActiveCourseId] = useState(() => {
    return urlLessonId || null;
  });

  useEffect(() => {
    if (urlLessonId !== activeCourseId) {
      setActiveCourseId(urlLessonId || null);
    }
  }, [urlLessonId]);

  useEffect(() => {
    if (activeCourseId) {
      navigate(`/member/utilities/ide/${activeCourseId}`, { replace: true });
    } else {
      navigate(`/member/utilities/ide`, { replace: true });
    }
  }, [activeCourseId, navigate]);

  const [mobileStudyMode, setMobileStudyMode] = useState("story");
  const [completedLessons, setCompletedLessons] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("student_ide_progress") || "[]");
    } catch (_) {
      return [];
    }
  });
  const [verificationStatus, setVerificationStatus] = useState(null); // null, 'success', 'failed'
  const [timeLeft, setTimeLeft] = useState(0);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [certificateType, setCertificateType] = useState("intermediate"); // "intermediate" or "advanced"
  const handleShowCertificate = (type) => {
    setCertificateType(type);
    setShowCertificateModal(true);
  };
  const [mobilePuzzleAnswer, setMobilePuzzleAnswer] = useState(null);
  const [exchangeSubmitting, setExchangeSubmitting] = useState(false);

  const getLessonTierAndAccess = (lessonId) => {
    if (!lessonId) return { tier: "basic", tierLabel: "Chặng 1: Phản Xạ Cơ Bản (Bài 1-10)", hasAccess: false, price: 1500, subKey: "hugoCoder" };
    const num = parseInt(lessonId.replace("lesson", ""), 10);

    // Trọn gói 6 chặng (khoá DB giữ tên cũ hugoCoderAll7Lifetime)
    const hasAllLifetime = !!bio?.hugoCoderAll7Lifetime;

    const maintenanceActive = hasAllLifetime || (bio?.featureSubscriptions?.hugoCoder?.expiresAt
      ? new Date(bio.featureSubscriptions.hugoCoder.expiresAt).getTime() > Date.now()
      : false);

    const buildTier = (tier, tierLabel, price, subKey, lifetime) => ({
      tier, tierLabel, price, subKey,
      lifetime: hasAllLifetime || lifetime,
      maintenanceActive,
      hasAccess: (hasAllLifetime || lifetime) && maintenanceActive
    });

    if (num <= 10) return buildTier("basic", "Chặng 1: Phản Xạ Cơ Bản (Bài 1-10)", 1500, "hugoCoderBasic", !!bio?.hugoCoderBasicLifetime);
    if (num <= 25) return buildTier("intermediate", "Chặng 2: Tư Duy Kiến Trúc (Bài 11-25)", 2600, "hugoCoderIntermediate", !!bio?.hugoCoderIntermediateLifetime);
    if (num <= 50) return buildTier("advanced", "Chặng 3: CTDL, Giải Thuật & Mật Mã (Bài 26-50)", 2600, "hugoCoderAdvanced", !!bio?.hugoCoderAdvancedLifetime);
    // Chặng 4 gộp 3 gói cũ (Bảo mật + Kiểm tra + Tối ưu) — ai đã mua 1 trong 3 đều có quyền
    if (num <= 70) return buildTier("security", "Chặng 4: Kỹ Sư Bảo Mật & Tiền Đề AI (Bài 51-70)", 2600, "hugoCoderSecurity",
      !!(bio?.hugoCoderSecurityLifetime || bio?.hugoCoderExamLifetime || bio?.hugoCoderOptimizeLifetime));
    if (num <= 90) return buildTier("project", "Chặng 5: Siêu Đồ Án Full-Stack & AI (Bài 71-90)", 3500, "hugoCoderUltimate", !!bio?.hugoCoderUltimateLifetime);
    // Chặng 6 tách từ gói Ultimate cũ (71-100) — ultimate cũ vẫn có quyền
    return buildTier("devops", "Chặng 6: Kỹ Sư DevOps & Phát Hành (Bài 91-100)", 1500, "hugoCoderUltimate",
      !!(bio?.hugoCoderDevopsLifetime || bio?.hugoCoderUltimateLifetime));
  };

  const handleExchangeSubscription = (tierInfo) => {
    notify.info((t) => (
      <HugoConfirmNotice
        type="warning"
        title="Xác nhận trao đổi"
        message={
          <>
            Bạn có đồng ý dùng <strong>{tierInfo.price} JOY</strong> (+ 10% phí sáng tạo) để đăng ký 1 tháng cho gói <strong>{tierInfo.tierLabel}</strong> không?
          </>
        }
        onCancel={() => notify.dismiss(t.id)}
        onConfirm={async () => {
          notify.dismiss(t.id);
          setExchangeSubmitting(true);
          try {
            const token = getMemberSession()?.token;
            const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8081/api"}/joy/subscribe-feature`, {
              method: "POST",
              headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              },
              body: JSON.stringify({ email: bio.email, featureKey: tierInfo.subKey, months: 1 })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Giao dịch thất bại.");
            
            notify.success("Đăng ký thành công! Giai đoạn học này đã được mở khóa.");
            useJoyStore.getState().setBalance(data.balance);
            if (onBioUpdate) {
              const updatedBio = {
                ...bio,
                joyBalance: data.balance,
                featureSubscriptions: {
                  ...(bio.featureSubscriptions || {}),
                  [tierInfo.subKey]: { active: true, expiresAt: data.expiresAt }
                }
              };
              onBioUpdate(updatedBio);
            }
          } catch (err) {
            notify.error(err.message || "Lỗi giao dịch.");
          } finally {
            setExchangeSubmitting(false);
          }
        }}
      />
    ), {
      duration: 10000,
      position: 'top-center',
      style: { padding: 0, background: 'transparent', boxShadow: 'none' }
    });
  };

  const handleBuyLifetimeUnlock = (tier) => {
    const labels = {
      basic: 'Chặng 1: Phản Xạ Cơ Bản (Bài 1-10)',
      intermediate: 'Chặng 2: Tư Duy Kiến Trúc (Bài 11-25)',
      advanced: 'Chặng 3: CTDL, Giải Thuật & Mật Mã (Bài 26-50)',
      security: 'Chặng 4: Kỹ Sư Bảo Mật & Tiền Đề AI (Bài 51-70)',
      project: 'Chặng 5: Siêu Đồ Án Full-Stack & AI (Bài 71-90)',
      devops: 'Chặng 6: Kỹ Sư DevOps & Phát Hành (Bài 91-100)'
    };
    const tierPrices = {
      basic: 1500,
      intermediate: 2600,
      advanced: 2600,
      security: 2600,
      project: 3500,
      devops: 1500
    };
    const price = tierPrices[tier] || 0;
    const tierLabel = labels[tier] || 'Khóa học';
    notify.info((t) => (
      <HugoConfirmNotice
        type="warning"
        title="Mua gói Vĩnh Viễn"
        message={
          <>
            Bạn có đồng ý dùng <strong>{price} JOY</strong> (+ 10% phí sáng tạo) để mở khóa vĩnh viễn quyền học và thực hành các bài học thuộc <strong>{tierLabel}</strong> không?
          </>
        }
        onCancel={() => notify.dismiss(t.id)}
        onConfirm={async () => {
          notify.dismiss(t.id);
          setExchangeSubmitting(true);
          try {
            const token = getMemberSession()?.token;
            const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8081/api"}/joy/buy-lifetime-unlock`, {
              method: "POST",
              headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              },
              body: JSON.stringify({ tier })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Giao dịch thất bại.");
            
            notify.success(`Mở khóa vĩnh viễn ${tierLabel} thành công!`);
            useJoyStore.getState().setBalance(data.balance);
            if (onBioUpdate) {
              const keyMap = {
                basic: 'hugoCoderBasicLifetime',
                intermediate: 'hugoCoderIntermediateLifetime',
                advanced: 'hugoCoderAdvancedLifetime',
                security: 'hugoCoderSecurityLifetime',
                project: 'hugoCoderUltimateLifetime',
                devops: 'hugoCoderDevopsLifetime'
              };
              const key = keyMap[tier];
              const updatedBio = {
                ...bio,
                joyBalance: data.balance,
                [key]: true
              };
              onBioUpdate(updatedBio);
            }
          } catch (err) {
            notify.error(err.message || "Lỗi giao dịch.");
          } finally {
            setExchangeSubmitting(false);
          }
        }}
      />
    ), {
      duration: 10000,
      position: 'top-center',
      style: { padding: 0, background: 'transparent', boxShadow: 'none' }
    });
  };

  const handlePayMaintenance = () => {
    notify.info((t) => (
      <HugoConfirmNotice
        type="warning"
        title="Gia hạn phí bảo trì HugoCoder"
        message={
          <>
            Bạn có đồng ý dùng <strong>50 JOY</strong> (+ 10% phí sáng tạo) để đóng phí bảo trì 30 ngày cho HugoCoder không?
          </>
        }
        onCancel={() => notify.dismiss(t.id)}
        onConfirm={async () => {
          notify.dismiss(t.id);
          setExchangeSubmitting(true);
          try {
            const token = getMemberSession()?.token;
            const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8081/api"}/joy/subscribe-feature`, {
              method: "POST",
              headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              },
              body: JSON.stringify({ email: bio.email, featureKey: "hugoCoder", months: 1 })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Giao dịch thất bại.");
            
            notify.success("Đóng phí bảo trì thành công!");
            useJoyStore.getState().setBalance(data.balance);
            if (onBioUpdate) {
              const updatedBio = {
                ...bio,
                joyBalance: data.balance,
                featureSubscriptions: {
                  ...(bio.featureSubscriptions || {}),
                  hugoCoder: { active: true, expiresAt: data.expiresAt }
                }
              };
              onBioUpdate(updatedBio);
            }
          } catch (err) {
            notify.error(err.message || "Lỗi giao dịch.");
          } finally {
            setExchangeSubmitting(false);
          }
        }}
      />
    ), {
      duration: 10000,
      position: 'top-center',
      style: { padding: 0, background: 'transparent', boxShadow: 'none' }
    });
  };

  const handleBuyAllStagesBundle = () => {
    notify.info((t) => (
      <HugoConfirmNotice
        type="warning"
        title="Mua Trọn Gói 6 Chặng"
        message={
          <>
            Bạn có đồng ý dùng <strong>16.000 JOY</strong> (+ 10% phí sáng tạo) để mở khóa vĩnh viễn TOÀN BỘ 6 chặng học HugoCoder và được miễn phí phí bảo trì trọn đời không?
          </>
        }
        onCancel={() => notify.dismiss(t.id)}
        onConfirm={async () => {
          notify.dismiss(t.id);
          setExchangeSubmitting(true);
          try {
            const token = getMemberSession()?.token;
            const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8081/api"}/joy/buy-all-stages-bundle`, {
              method: "POST",
              headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Giao dịch thất bại.");
            
            notify.success("Mở khóa trọn gói vĩnh viễn thành công! Bạn đã được kích hoạt toàn bộ các chặng học và được miễn phí bảo trì trọn đời.");
            useJoyStore.getState().setBalance(data.balance);
            if (onBioUpdate) {
              onBioUpdate(data.bio);
            }
          } catch (err) {
            notify.error(err.message || "Lỗi giao dịch.");
          } finally {
            setExchangeSubmitting(false);
          }
        }}
      />
    ), {
      duration: 10000,
      position: 'top-center',
      style: { padding: 0, background: 'transparent', boxShadow: 'none' }
    });
  };

  const handleClaimMilestoneReward = async (phaseNum) => {
    try {
      const token = getMemberSession()?.token;
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8081/api"}/joy/claim-milestone-reward`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ phase: phaseNum })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Nhận thưởng thất bại.");

      import("canvas-confetti").then((module) => {
        const conf = module.default || module;
        conf({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      });

      notify.success(`Chúc mừng! Bạn đã nhận thưởng +800 JOY cho Chặng ${phaseNum}! 🎁`);
      useJoyStore.getState().setBalance(data.balance);
      if (onBioUpdate) {
        onBioUpdate(data.bio);
      }
    } catch (err) {
      notify.error(err.message || "Lỗi khi nhận thưởng.");
    }
  };


  // Sync progress from server on mount (cross-device sync)
  useEffect(() => {
    const loadProgressFromServer = async () => {
      try {
        const token = getMemberSession()?.token;
        const headers = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8081/api"}/member/progress`, {
          headers
        });
        if (res.ok) {
          const data = await res.json();
          if (data.lessons && Array.isArray(data.lessons)) {
            setCompletedLessons(data.lessons);
            localStorage.setItem("student_ide_progress", JSON.stringify(data.lessons));
          }
        }
      } catch (error) {
        console.error("Failed to load progress from server:", error);
        // Fallback to localStorage
      }
    };
    loadProgressFromServer();
  }, []);

  // Interactive Practice states
  const [htmlBlocks, setHtmlBlocks] = useState([]);
  const [themeBg, setThemeBg] = useState("#ffffff");
  const [themeText, setThemeText] = useState("#000000");
  const [clickCount, setClickCount] = useState(0);
  const [sqlBlocks, setSqlBlocks] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState({}); // { key: val }
  const [blankAnswers, setBlankAnswers] = useState({ blank1: "", blank2: "" });
  const [interactivePassed, setInteractivePassed] = useState(false);
  const [miniQuizAnswers, setMiniQuizAnswers] = useState({});
  const [miniQuizPassed, setMiniQuizPassed] = useState(false);
  
  // Screenshot Upload states
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanScore, setScanScore] = useState(0);
  
  // Quiz states
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizCurrentIndex, setQuizCurrentIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState({}); // { questionIndex: optionIndex }
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  useEffect(() => {
    const targetCourseId = activeCourseId || WEB_COURSES[0].id;
    setVerificationStatus(null);
    
    // Reset states
    setThemeBg("#ffffff");
    setThemeText("#000000");
    setClickCount(0);
    setMatchedPairs({});
    setBlankAnswers({ blank1: "", blank2: "" });
    setScreenshotFile(null);
    setIsScanning(false);
    setScanProgress(0);
    setScanScore(0);
    setQuizCurrentIndex(0);
    setQuizAnswers({});
    setQuizCompleted(false);
    setQuizScore(0);
    setInteractivePassed(false);
    setMiniQuizPassed(false);
    setMiniQuizAnswers({});

    const course = WEB_COURSES.find(c => c.id === targetCourseId);
    if (!course) return;

    if (course.practiceType === "drag_drop_html") {
      const shuffled = [...course.dragBlocks].sort(() => Math.random() - 0.5);
      setHtmlBlocks(shuffled);
    } else if (course.practiceType === "drag_drop_sql") {
      const shuffled = [...course.dragBlocks].sort(() => Math.random() - 0.5);
      setSqlBlocks(shuffled);
    } else if (course.practiceType === "quiz") {
      const pool = course.quizPool || (course.id === "lesson6" ? QUIZ_POOL_1 : QUIZ_POOL_2);
      const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, course.quizSize);
      setQuizQuestions(shuffled);
    }
  }, [activeCourseId]);

  useEffect(() => {
    setTimeLeft(0);
    setMobilePuzzleAnswer(null);
  }, [activeCourseId]);



  const handleVerifyLesson = async (course) => {
    const fileObj = workspaceFiles.find(f => f.path === course.file);
    if (!fileObj) {
      notify.error(`Vui lòng nạp bài học để tạo file ${course.file} trước!`);
      return;
    }
    
    // Chấm trên code đã loại bỏ comment — chữ trong TODO/hướng dẫn không tính là bài làm
    const isCorrect = course.verify(stripCodeComments(fileObj.content));
    if (isCorrect) {
      setVerificationStatus("success");
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      const session = getMemberSession();
      if (session?.email) {
        if (!completedLessons.includes(course.id)) {
          try {
            const apiBase = import.meta.env.VITE_API_URL || '/api';
            const r = await fetch(`${apiBase}/joy/award-learning`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: session.email,
                lessonId: course.id,
                evidence: buildLessonEvidence(course, { channel: "desktop", score: 100 })
              })
            });
            const resData = await r.json().catch(() => ({}));
            if (!r.ok) {
              throw new Error(resData.error || `API award-learning failed with status ${r.status}`);
            }
            notify.success("Chính xác! Bài học đã được xác minh hoàn thành.");
            recordCoderLessonEvent({ lessonId: course.id, type: "desktop_award", status: "accepted" });
          } catch (e) {
            console.error("Error awarding joy for learning:", e);
            recordCoderLessonEvent({ lessonId: course.id, type: "desktop_award", status: "failed", message: e.message });
            notify.error(e.message || "Không thể ghi nhận phần thưởng JOY, vui lòng thử lại.");
          }
        } else {
          notify.success("Chính xác! Bài học đã được xác minh hoàn thành.");
        }
      } else {
        notify.success("Chính xác! Đăng nhập để nhận thưởng JOY.");
      }
      
      if (!completedLessons.includes(course.id)) {
        const nextCompleted = [...completedLessons, course.id];
        setCompletedLessons(nextCompleted);
        localStorage.setItem("student_ide_progress", JSON.stringify(nextCompleted));
        // Sync progress to server (cross-device sync)
        const token = getMemberSession()?.token;
        const headers = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8081/api"}/member/progress/lesson/${course.id}/complete`, { 
          method: "POST",
          headers
        })
          .catch(err => console.error("Failed to sync progress:", err));
      }
    } else {
      setVerificationStatus("failed");
      notify.error("Mã nguồn chưa chính xác, hãy kiểm tra lại yêu cầu đề bài!");
    }
  };

  const handleRunSandbox = () => {
    if (!activeFile) {
      notify.error("Vui lòng mở một file để chạy thử.");
      return;
    }
    const ext = activeFile.name.split(".").pop().toLowerCase();
    setTerminalTab("console");
    if (ext === "php") {
      setConsoleOutput("[Giả lập PHP Engine v8.2]\nĐang biên dịch và thực thi...\n\n" + runMockPhp(activeFile.content));
      notify.success("Chạy thử code PHP thành công!");
    } else if (ext === "sql") {
      setConsoleOutput("[Giả lập MySQL Engine v8.0]\nĐang kết nối cơ sở dữ liệu và truy vấn...\n\n" + runMockSql(activeFile.content));
      notify.success("Truy vấn SQL thành công!");
    } else {
      setConsoleOutput(`[Hệ thống] Trình chạy giả lập (Mock Sandboxed Runner) chỉ hỗ trợ kiểm tra nhanh cho PHP và SQL.\nVới file .${ext}, hãy tải về máy và chạy local theo Bảng Hướng dẫn Chạy.`);
      notify.info("Ngôn ngữ này chỉ hỗ trợ chạy local.");
    }
  };

  // File System state
  const [workspaceFiles, setWorkspaceFiles] = useState([]);
  const [folders, setFolders] = useState([
    "src",
    "src/oop",
    "src/database",
    "src/web"
  ]);
  const [expandedFolders, setExpandedFolders] = useState({
    "src": true,
    "src/oop": true,
    "src/database": false,
    "src/web": false
  });

  // Editor Tabs state
  const [openTabs, setOpenTabs] = useState(["README.md"]);
  const [activeTabPath, setActiveTabPath] = useState("README.md");

  // Local File System Picker handle
  const [dirHandle, setDirHandle] = useState(null);

  // Preview state
  const [previewMode, setPreviewMode] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [saveStatus, setSaveStatus] = useState("Đã lưu tất cả");
  const [mobileRunKey, setMobileRunKey] = useState(0);
  const [terminalTab, setTerminalTab] = useState("guide"); // "guide" or "console"
  const [consoleOutput, setConsoleOutput] = useState("");

  // Inline inputs state (New File, New Folder, Rename)
  // { type: 'new_file' | 'new_folder' | 'rename', parentPath?: string, targetPath?: string, oldName?: string, value: string }
  const [inlineAction, setInlineAction] = useState(null);
  const inputRef = useRef(null);

  const activeFile = useMemo(
    () => workspaceFiles.find(f => f.path === activeTabPath) || null,
    [workspaceFiles, activeTabPath]
  );

  const workspaceTree = useMemo(
    () => buildTree(workspaceFiles, folders),
    [workspaceFiles, folders]
  );

  const mobileCourse = useMemo(
    () => WEB_COURSES.find(c => c.id === activeCourseId) || WEB_COURSES[0],
    [activeCourseId]
  );

  const mobileExtra = useMemo(
    () => MOBILE_GUIDE_EXTRAS[mobileCourse?.id] || {},
    [mobileCourse?.id]
  );

  const mobileVisualSet = useMemo(
    () => getMobileVisualSet(mobileExtra.visualType, mobileCourse?.id, mobileCourse?.title),
    [mobileExtra.visualType, mobileCourse?.id, mobileCourse?.title]
  );

  const mobileDemoCode = useMemo(
    () => mobileExtra.demoCode || mobileCourse?.starterCode || "",
    [mobileExtra.demoCode, mobileCourse?.starterCode]
  );

  const mobileCompletedCount = useMemo(
    () => completedLessons.filter(id => WEB_COURSES.some(course => course.id === id)).length,
    [completedLessons]
  );

  const mobileProgress = useMemo(
    () => Math.round((mobileCompletedCount / WEB_COURSES.length) * 100),
    [mobileCompletedCount]
  );

  const canPreviewMobileCourse = mobileCourse?.lang === "html";

  // Track desktop size
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Sync editor theme with web theme
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkTheme(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // Update HTML Live Preview
  useEffect(() => {
    if (activeFile && activeFile.language === "html" && previewMode) {
      const html = buildPreviewHtml(activeFile, workspaceFiles);
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [activeFile, previewMode, workspaceFiles]);
  // Load workspace from localStorage on mount (for virtual files)
  useEffect(() => {
    const savedWorkspace = localStorage.getItem(CODER_STORAGE_KEYS.workspace);
    const savedFolders = localStorage.getItem(CODER_STORAGE_KEYS.folders);
    if (savedWorkspace) {
      try {
        const parsed = JSON.parse(savedWorkspace);
        if (Array.isArray(parsed)) {
          const cleaned = parsed
            .filter(f => f && typeof f.path === "string" && typeof f.name === "string")
            .map(f => ({
              path: f.path,
              name: f.name,
              content: typeof f.content === "string" ? f.content : "",
              language: typeof f.language === "string" ? f.language : "plaintext",
              handle: null
            }));
          
          if (cleaned.length > 0) {
            setWorkspaceFiles(cleaned);
            if (savedFolders) {
              try {
                const parsedFolders = JSON.parse(savedFolders);
                if (Array.isArray(parsedFolders)) {
                  setFolders(parsedFolders.filter(f => typeof f === "string"));
                }
              } catch (_) {
                // Ignore corrupt folder cache and keep the recovered files.
              }
            }
            
            const readme = cleaned.find(f => f.name.toLowerCase() === "readme.md");
            const defaultTab = readme ? readme.path : cleaned[0].path;
            setOpenTabs([defaultTab]);
            setActiveTabPath(defaultTab);
            return;
          }
        }
      } catch (e) {
        console.error("Failed to load saved workspace", e);
      }
    }
    
    // Fallback if load fails or has no valid files
    setWorkspaceFiles(INITIAL_WORKSPACE);
    setOpenTabs(["README.md"]);
    setActiveTabPath("README.md");
  }, []);

  // Save virtual workspace to localStorage (debounced)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (dirHandle) return;
      localStorage.setItem(CODER_STORAGE_KEYS.workspace, JSON.stringify(makeSerializableWorkspace(workspaceFiles)));
      localStorage.setItem(CODER_STORAGE_KEYS.folders, JSON.stringify(folders));
    }, 1000);

    return () => clearTimeout(delayDebounceFn);
  }, [workspaceFiles, folders, dirHandle]);

  // Auto-save active local file to physical disk (debounced)
  useEffect(() => {
    if (!activeFile || !activeFile.handle) return;

    setSaveStatus("Đang lưu...");
    const delayDebounceFn = setTimeout(async () => {
      try {
        const writable = await activeFile.handle.createWritable();
        await writable.write(activeFile.content);
        await writable.close();
        setSaveStatus("Đã lưu vào đĩa");
      } catch (err) {
        console.error("Auto-save error:", err);
        setSaveStatus("Lỗi tự động lưu");
      }
    }, 1000);

    return () => clearTimeout(delayDebounceFn);
  }, [activeFile?.content, activeFile?.handle]);

  // Save status for virtual files
  useEffect(() => {
    if (!activeFile || activeFile.handle) return;

    setSaveStatus("Đang lưu (ảo)...");
    const delayDebounceFn = setTimeout(() => {
      setSaveStatus("Đã lưu (localStorage)");
    }, 1000);

    return () => clearTimeout(delayDebounceFn);
  }, [activeFile?.content, activeFile?.handle]);

  // Focus and Selection logic for inline actions
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      if (inlineAction && inlineAction.type === "rename") {
        const name = inlineAction.oldName;
        const lastDot = name.lastIndexOf(".");
        if (lastDot > 0) {
          // Select name without extension
          inputRef.current.setSelectionRange(0, lastDot);
        } else {
          inputRef.current.select();
        }
      } else {
        inputRef.current.select();
      }
    }
  }, [inlineAction]);

  // Folder toggle handler
  const toggleFolder = (folderPath) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderPath]: !prev[folderPath]
    }));
  };

  // Get parent folder of the active file
  const getActiveFolder = () => {
    if (!activeTabPath) return "";
    const parts = activeTabPath.split("/");
    if (parts.length <= 1) return "";
    return parts.slice(0, -1).join("/");
  };

  // Recursive Directory Reader for Local Workspace
  const refreshLocalDirectory = async () => {
    if (!dirHandle) return;
    try {
      const loadedFiles = [];
      const loadedFolders = [];
      
      const readDirectory = async (directoryHandle, relativePath = "") => {
        for await (const entry of directoryHandle.values()) {
          const entryPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
          
          if (entry.kind === "file") {
            const file = await entry.getFile();
            const ext = file.name.split(".").pop().toLowerCase();
            const supportedExts = ["c", "cpp", "cs", "py", "html", "css", "js", "php", "txt", "md", "json"];
            
            if (supportedExts.includes(ext)) {
              const content = await file.text();
              loadedFiles.push({
                path: entryPath,
                name: file.name,
                content: content,
                language: getLanguageFromExt(ext),
                handle: entry
              });
            }
          } else if (entry.kind === "directory") {
            loadedFolders.push(entryPath);
            await readDirectory(entry, entryPath);
          }
        }
      };

      await readDirectory(dirHandle);
      setWorkspaceFiles(loadedFiles);
      setFolders(loadedFolders);
      
      // Clean up openTabs for missing files
      setOpenTabs(prev => {
        const filtered = prev.filter(t => loadedFiles.some(f => f.path === t));
        if (activeTabPath && !loadedFiles.some(f => f.path === activeTabPath)) {
          if (filtered.length > 0) {
            setActiveTabPath(filtered[0]);
          } else {
            setActiveTabPath(null);
          }
        }
        return filtered;
      });
    } catch (err) {
      console.error("Failed to refresh local directory:", err);
    }
  };

  const getDirHandleByPath = async (rootHandle, path) => {
    const parts = path.split("/");
    if (parts.length <= 1) return rootHandle;
    
    let current = rootHandle;
    for (let i = 0; i < parts.length - 1; i++) {
      current = await current.getDirectoryHandle(parts[i], { create: true });
    }
    return current;
  };

  // Physical disk operations
  const localCreateFile = async (fullPath) => {
    if (!dirHandle) return;
    try {
      const parentDir = await getDirHandleByPath(dirHandle, fullPath);
      const name = fullPath.split("/").pop();
      const newFileHandle = await parentDir.getFileHandle(name, { create: true });
      
      const writable = await newFileHandle.createWritable();
      await writable.write("");
      await writable.close();
      
      await refreshLocalDirectory();
      
      setOpenTabs(prev => !prev.includes(fullPath) ? [...prev, fullPath] : prev);
      setActiveTabPath(fullPath);
      notify.success(`Đã tạo file: ${fullPath}`);
    } catch (e) {
      console.error(e);
      notify.error("Lỗi khi tạo file: " + e.message);
    }
  };

  const localCreateFolder = async (fullPath) => {
    if (!dirHandle) return;
    try {
      const parentDir = await getDirHandleByPath(dirHandle, fullPath);
      const name = fullPath.split("/").pop();
      await parentDir.getDirectoryHandle(name, { create: true });
      
      await refreshLocalDirectory();
      setExpandedFolders(prev => ({ ...prev, [fullPath]: true }));
      notify.success(`Đã tạo thư mục: ${fullPath}`);
    } catch (e) {
      console.error(e);
      notify.error("Lỗi khi tạo thư mục: " + e.message);
    }
  };

  const localDeleteEntry = async (fullPath, type) => {
    if (!dirHandle) return;
    try {
      const parentDir = await getDirHandleByPath(dirHandle, fullPath);
      const name = fullPath.split("/").pop();
      await parentDir.removeEntry(name, { recursive: true });
      
      // Clean up openTabs
      setOpenTabs(prev => prev.filter(t => t !== fullPath && !t.startsWith(`${fullPath}/`)));
      if (activeTabPath === fullPath || (activeTabPath && activeTabPath.startsWith(`${fullPath}/`))) {
        setActiveTabPath(null);
      }
      
      await refreshLocalDirectory();
      notify.success(`Đã xóa: ${fullPath}`);
    } catch (e) {
      console.error(e);
      notify.error("Lỗi khi xóa: " + e.message);
    }
  };

  const localRenameEntry = async (oldFullPath, newFullPath) => {
    if (!dirHandle) return;
    try {
      const parentDir = await getDirHandleByPath(dirHandle, oldFullPath);
      const oldName = oldFullPath.split("/").pop();
      const newName = newFullPath.split("/").pop();
      
      let entryHandle;
      try {
        entryHandle = await parentDir.getFileHandle(oldName);
      } catch (_) {
        entryHandle = await parentDir.getDirectoryHandle(oldName);
      }
      
      if (entryHandle.move) {
        await entryHandle.move(newName);
      } else {
        if (entryHandle.kind === "file") {
          const file = await entryHandle.getFile();
          const text = await file.text();
          const newFileHandle = await parentDir.getFileHandle(newName, { create: true });
          const writable = await newFileHandle.createWritable();
          await writable.write(text);
          await writable.close();
          await parentDir.removeEntry(oldName);
        } else {
          throw new Error("Trình duyệt không hỗ trợ đổi tên thư mục.");
        }
      }
      
      // Update tabs
      setOpenTabs(prev => prev.map(t => {
        if (t === oldFullPath) return newFullPath;
        if (t.startsWith(`${oldFullPath}/`)) return t.replace(oldFullPath, newFullPath);
        return t;
      }));
      if (activeTabPath === oldFullPath) {
        setActiveTabPath(newFullPath);
      } else if (activeTabPath && activeTabPath.startsWith(`${oldFullPath}/`)) {
        setActiveTabPath(activeTabPath.replace(oldFullPath, newFullPath));
      }
      
      await refreshLocalDirectory();
      notify.success(`Đã đổi tên thành: ${newFullPath}`);
    } catch (e) {
      console.error(e);
      notify.error("Lỗi khi đổi tên: " + e.message);
    }
  };

  // Open Local Folder Picker
  const handleOpenFolder = async () => {
    try {
      if (!window.showDirectoryPicker) {
        notify.error("Trình duyệt không hỗ trợ File System Access API. Dùng chế độ lưu ảo thay thế.");
        return;
      }
      
      const handle = await window.showDirectoryPicker();
      setDirHandle(handle);
      
      const loadedFiles = [];
      const loadedFolders = [];
      
      const readDirectory = async (directoryHandle, relativePath = "") => {
        for await (const entry of directoryHandle.values()) {
          const entryPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
          
          if (entry.kind === "file") {
            const file = await entry.getFile();
            const ext = file.name.split(".").pop().toLowerCase();
            const supportedExts = ["c", "cpp", "cs", "py", "html", "css", "js", "php", "txt", "md", "json"];
            
            if (supportedExts.includes(ext)) {
              const content = await file.text();
              loadedFiles.push({
                path: entryPath,
                name: file.name,
                content: content,
                language: getLanguageFromExt(ext),
                handle: entry
              });
            }
          } else if (entry.kind === "directory") {
            loadedFolders.push(entryPath);
            await readDirectory(entry, entryPath);
          }
        }
      };

      await readDirectory(handle);

      if (loadedFiles.length > 0) {
        setWorkspaceFiles(loadedFiles);
        setFolders(loadedFolders);
        
        // Open the first loaded file or README
        const readme = loadedFiles.find(f => f.name.toLowerCase() === "readme.md");
        const defaultTab = readme ? readme.path : loadedFiles[0].path;
        setOpenTabs([defaultTab]);
        setActiveTabPath(defaultTab);
        
        notify.success(`Đã tải ${loadedFiles.length} file từ thư mục cục bộ!`);
      } else {
        notify.error("Không tìm thấy file code được hỗ trợ trong thư mục này.");
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error(err);
        if (err.message.includes("sensitive") || err.message.includes("system") || err.name === "SecurityError") {
          notify.error("Lỗi bảo mật: Vui lòng chọn một thư mục con (ví dụ: tạo thư mục 'Dự án' trên Desktop). Trình duyệt không cho phép chọn trực tiếp Desktop gốc.");
        } else {
          notify.error("Lỗi khi mở thư mục: " + err.message);
        }
      }
    }
  };

  // Open file in Editor Tab
  const handleOpenFile = (path) => {
    if (!openTabs.includes(path)) {
      setOpenTabs([...openTabs, path]);
    }
    setActiveTabPath(path);
  };

  // Close editor tab (keeps file in workspace)
  const handleCloseTab = (path, e) => {
    if (e) e.stopPropagation();
    const updated = openTabs.filter(t => t !== path);
    setOpenTabs(updated);
    
    if (activeTabPath === path) {
      if (updated.length > 0) {
        const closedIdx = openTabs.indexOf(path);
        const nextIdx = Math.min(closedIdx, updated.length - 1);
        setActiveTabPath(updated[nextIdx]);
      } else {
        setActiveTabPath(null);
      }
    }
  };

  // Manual save trigger
  const handleSaveFile = async () => {
    if (!activeFile) return;

    if (activeFile.handle) {
      try {
        const writable = await activeFile.handle.createWritable();
        await writable.write(activeFile.content);
        await writable.close();
        notify.success(`Đã lưu "${activeFile.name}" thành công vào máy tính!`);
      } catch (err) {
        console.error(err);
        notify.error("Lỗi lưu file: " + err.message);
      }
    } else {
      // Download fallback
      const blob = new Blob([activeFile.content], { type: "text/plain" });
      downloadBlob(blob, activeFile.name);
      notify.success(`Đã tải xuống file "${activeFile.name}"!`);
    }
  };

  const handleExportProjectZip = async () => {
    try {
      if (!workspaceFiles.length) {
        notify.error("Workspace hiện chưa có file để xuất.");
        return;
      }
      const blob = await createWorkspaceZipBlob(workspaceFiles);
      downloadBlob(blob, "hugo-coder-project.zip");
      recordCoderLessonEvent({ type: "export_zip", fileCount: workspaceFiles.length });
      notify.success("Đã xuất toàn bộ workspace thành file ZIP.");
    } catch (err) {
      console.error("Export ZIP error:", err);
      notify.error("Không thể xuất ZIP: " + err.message);
    }
  };

  // Delete workspace file / folder
  const handleDeleteEntry = (targetPath, type) => {
    notify.info((t) => (
      <HugoConfirmNotice
        type="error"
        title="Xác nhận xóa"
        message={<>Bạn có chắc chắn muốn xóa {type === "folder" ? "thư mục" : "file"} "{targetPath.split('/').pop()}" không? Hành động này không thể hoàn tác.</>}
        onCancel={() => notify.dismiss(t.id)}
        onConfirm={async () => {
          notify.dismiss(t.id);
          if (dirHandle) {
            await localDeleteEntry(targetPath, type);
          } else {
            if (type === "file") {
              setWorkspaceFiles(prev => prev.filter(f => f.path !== targetPath));
              setOpenTabs(prev => prev.filter(t => t !== targetPath));
              if (activeTabPath === targetPath) {
                setActiveTabPath(prev => {
                  const nextTabs = openTabs.filter(t => t !== targetPath);
                  return nextTabs.length > 0 ? nextTabs[0] : null;
                });
              }
              notify.success(`Đã xóa file ảo: ${targetPath}`);
            } else {
              setFolders(prev => prev.filter(d => d !== targetPath && !d.startsWith(`${targetPath}/`)));
              setWorkspaceFiles(prev => prev.filter(f => !f.path.startsWith(`${targetPath}/`)));
              setOpenTabs(prev => prev.filter(t => !t.startsWith(`${targetPath}/`)));
              if (activeTabPath && activeTabPath.startsWith(`${targetPath}/`)) {
                setActiveTabPath(null);
              }
              notify.success(`Đã xóa thư mục ảo: ${targetPath}`);
            }
          }
        }}
      />
    ), {
      duration: 10000,
      position: 'top-center',
      style: { padding: 0, background: 'transparent', boxShadow: 'none' }
    });
  };

  // Inline action key down handler (Enter, Escape)
  const handleInlineInputKeyDown = (e, action) => {
    if (e.key === "Enter") {
      e.preventDefault();
      executeInlineAction(action);
    } else if (e.key === "Escape") {
      setInlineAction(null);
    }
  };

  // Inline action blur handler
  const handleInlineInputBlur = (action) => {
    if (action.value && action.value.trim() !== "") {
      executeInlineAction(action);
    } else {
      setInlineAction(null);
    }
  };

  // Execute inline file/folder action
  const executeInlineAction = async (action) => {
    const name = action.value.trim();
    if (!name) {
      setInlineAction(null);
      return;
    }
    
    setInlineAction(null);

    if (action.type === "new_file") {
      const fullPath = action.parentPath ? `${action.parentPath}/${name}` : name;
      if (dirHandle) {
        await localCreateFile(fullPath);
      } else {
        if (workspaceFiles.some(f => f.path.toLowerCase() === fullPath.toLowerCase())) {
          notify.error("File đã tồn tại!");
          return;
        }
        const ext = name.split(".").pop().toLowerCase();
        const newFile = {
          path: fullPath,
          name: name,
          content: TEMPLATES[ext] || "",
          language: getLanguageFromExt(ext)
        };
        setWorkspaceFiles(prev => [...prev, newFile]);
        setOpenTabs(prev => [...prev, fullPath]);
        setActiveTabPath(fullPath);
        notify.success(`Đã tạo file ảo: ${fullPath}`);
      }
    } else if (action.type === "new_folder") {
      const fullPath = action.parentPath ? `${action.parentPath}/${name}` : name;
      if (dirHandle) {
        await localCreateFolder(fullPath);
      } else {
        if (folders.includes(fullPath)) {
          notify.error("Thư mục đã tồn tại!");
          return;
        }
        setFolders(prev => [...prev, fullPath]);
        setExpandedFolders(prev => ({ ...prev, [fullPath]: true }));
        notify.success(`Đã tạo thư mục ảo: ${fullPath}`);
      }
    } else if (action.type === "rename") {
      if (name === action.oldName) return;
      
      const parts = action.targetPath.split("/");
      parts[parts.length - 1] = name;
      const newFullPath = parts.join("/");
      
      if (dirHandle) {
        await localRenameEntry(action.targetPath, newFullPath);
      } else {
        const isFolder = folders.includes(action.targetPath);
        if (isFolder) {
          if (folders.includes(newFullPath)) {
            notify.error("Thư mục đã tồn tại!");
            return;
          }
          setFolders(prev => prev.map(d => {
            if (d === action.targetPath) return newFullPath;
            if (d.startsWith(`${action.targetPath}/`)) {
              return d.replace(action.targetPath, newFullPath);
            }
            return d;
          }));
          setWorkspaceFiles(prev => prev.map(f => {
            if (f.path.startsWith(`${action.targetPath}/`)) {
              return {
                ...f,
                path: f.path.replace(action.targetPath, newFullPath)
              };
            }
            return f;
          }));
          setOpenTabs(prev => prev.map(t => {
            if (t.startsWith(`${action.targetPath}/`)) {
              return t.replace(action.targetPath, newFullPath);
            }
            return t;
          }));
          if (activeTabPath && activeTabPath.startsWith(`${action.targetPath}/`)) {
            setActiveTabPath(activeTabPath.replace(action.targetPath, newFullPath));
          }
          notify.success(`Đã đổi tên thư mục ảo thành: ${newFullPath}`);
        } else {
          if (workspaceFiles.some(f => f.path.toLowerCase() === newFullPath.toLowerCase())) {
            notify.error("File đã tồn tại!");
            return;
          }
          setWorkspaceFiles(prev => prev.map(f => {
            if (f.path === action.targetPath) {
              return {
                ...f,
                path: newFullPath,
                name: name
              };
            }
            return f;
          }));
          setOpenTabs(prev => prev.map(t => t === action.targetPath ? newFullPath : t));
          if (activeTabPath === action.targetPath) {
            setActiveTabPath(newFullPath);
          }
          notify.success(`Đã đổi tên file ảo thành: ${newFullPath}`);
        }
      }
    }
  };

  // Open sample tutorial template
  const openTemplate = (langKey) => {
    const pathMap = {
      c: "src/oop/Vehicle.c",
      cpp: "src/oop/Shape.cpp",
      csharp: "src/oop/BankAccount.cs",
      python: "src/oop/Animal.py",
      html: "src/web/index.html",
      php: "src/database/DBConnection.php"
    };

    const targetPath = pathMap[langKey];
    
    // Check if template tab is already open
    if (openTabs.includes(targetPath)) {
      setActiveTabPath(targetPath);
      notify.success(`Đã mở bài học ${langKey.toUpperCase()}`);
      return;
    }

    // Check if file exists in workspace
    const exists = workspaceFiles.some(f => f.path === targetPath);
    if (!exists) {
      const ext = targetPath.split(".").pop().toLowerCase();
      const newFile = {
        path: targetPath,
        name: targetPath.split("/").pop(),
        content: TEMPLATES[langKey],
        language: getLanguageFromExt(ext)
      };
      setWorkspaceFiles(prev => [...prev, newFile]);
    }

    setOpenTabs(prev => [...prev, targetPath]);
    setActiveTabPath(targetPath);
    notify.success(`Đã nạp bài học & code mẫu ${langKey.toUpperCase()}`);
  };

  // Build recursive structure for tree display
  function buildTree(files, folderPaths) {
    const root = { name: "Root", path: "", type: "folder", children: [] };
    
    if (Array.isArray(folderPaths)) {
      folderPaths.forEach(fPath => {
        if (!fPath || typeof fPath !== "string") return;
        const parts = fPath.split("/");
        let current = root;
        let curPath = "";
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          if (!part) continue;
          curPath = curPath ? `${curPath}/${part}` : part;
          let child = current.children.find(c => c.path === curPath && c.type === "folder");
          if (!child) {
            child = { name: part, path: curPath, type: "folder", children: [] };
            current.children.push(child);
          }
          current = child;
        }
      });
    }

    if (Array.isArray(files)) {
      files.forEach(file => {
        if (!file || !file.path || typeof file.path !== "string") return;
        const parts = file.path.split("/");
        let current = root;
        let curPath = "";
        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i];
          if (!part) continue;
          curPath = curPath ? `${curPath}/${part}` : part;
          let child = current.children.find(c => c.path === curPath && c.type === "folder");
          if (!child) {
            child = { name: part, path: curPath, type: "folder", children: [] };
            current.children.push(child);
          }
          current = child;
        }
        const fileName = parts[parts.length - 1];
        if (fileName && !current.children.some(c => c.path === file.path && c.type === "file")) {
          current.children.push({
            name: fileName,
            path: file.path,
            type: "file",
            file: file
          });
        }
      });
    }

    return root;
  }

  // Recursive Tree Rendering function



  const moveBlock = (index, direction, type) => {
    const blocks = type === "html" ? [...htmlBlocks] : [...sqlBlocks];
    const setBlocks = type === "html" ? setHtmlBlocks : setSqlBlocks;
    if (direction === "up" && index > 0) {
      [blocks[index], blocks[index - 1]] = [blocks[index - 1], blocks[index]];
    } else if (direction === "down" && index < blocks.length - 1) {
      [blocks[index], blocks[index + 1]] = [blocks[index + 1], blocks[index]];
    }
    setBlocks(blocks);
  };

  const handlePairMatch = (side, item) => {
    if (side === "left") {
      setMatchedPairs(prev => ({ ...prev, activeLeft: item }));
    } else if (side === "right" && matchedPairs.activeLeft) {
      const leftItem = matchedPairs.activeLeft;
      const course = WEB_COURSES.find(c => c.id === activeCourseId);
      if (course && course.matchPairs) {
        const correctPair = course.matchPairs.find(p => p.key === leftItem);
        if (correctPair && correctPair.val === item) {
          setMatchedPairs(prev => {
            const next = { ...prev };
            next[leftItem] = item;
            delete next.activeLeft;
            return next;
          });
          notify.success("Nối chính xác!", { id: "pair-toast" });
        } else {
          notify.error("Nối chưa chính xác, hãy chọn lại!", { id: "pair-toast" });
          setMatchedPairs(prev => {
            const next = { ...prev };
            delete next.activeLeft;
            return next;
          });
        }
      }
    }
  };

  const handleScreenshotSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setScreenshotFile(URL.createObjectURL(file));
      setIsScanning(true);
      setScanProgress(0);
      setScanScore(0);
      const finalScore = scoreScreenshotSubmission(file);
      
      const interval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsScanning(false);
            setScanScore(finalScore);
            return 100;
          }
          return prev + 10;
        });
      }, 300);
    }
  };

  const verifyInteractivePractice = async () => {
    const course = WEB_COURSES.find(c => c.id === activeCourseId) || WEB_COURSES[0];
    let isCorrect = false;
    let verifiedScore = 100;

    if (course.practiceType === "drag_drop_html") {
      const currentOrder = htmlBlocks.map(b => b.id);
      isCorrect = JSON.stringify(currentOrder) === JSON.stringify(course.correctOrder);
    } else if (course.practiceType === "theme_match") {
      isCorrect = themeBg.toLowerCase() === course.requiredBg.toLowerCase() && 
                  themeText.toLowerCase() === course.requiredText.toLowerCase();
    } else if (course.practiceType === "js_button") {
      isCorrect = clickCount >= 3;
    } else if (course.practiceType === "drag_drop_sql") {
      const currentOrder = sqlBlocks.map(b => b.id);
      isCorrect = JSON.stringify(currentOrder) === JSON.stringify(course.correctOrder);
    } else if (course.practiceType === "code_challenge" || course.practiceType === "capstone") {
      isCorrect = true; // Checked locally via handleVerifyPuzzle trigger
    } else if (course.practiceType === "php_match") {
      const totalPairs = course.matchPairs.length;
      const matchedKeys = Object.keys(matchedPairs).filter(k => k !== "activeLeft");
      isCorrect = matchedKeys.length === totalPairs;
    } else if (course.practiceType === "fill_blank") {
      isCorrect = blankAnswers.blank1.trim().toLowerCase() === course.correctBlanks.blank1.toLowerCase() &&
                  blankAnswers.blank2.trim().toLowerCase() === course.correctBlanks.blank2.toLowerCase();
    } else if (course.practiceType === "screenshot_upload") {
      isCorrect = screenshotFile && !isScanning && scanScore >= 60;
      verifiedScore = scanScore;
    } else if (course.practiceType === "quiz") {
      let correct = 0;
      quizQuestions.forEach((q, idx) => {
        if (quizAnswers[idx] === q.a) correct++;
      });
      const score = Math.round((correct / quizQuestions.length) * 100);
      setQuizScore(score);
      setQuizCompleted(true);
      isCorrect = score >= 60;
      verifiedScore = score;
      if (isCorrect) {
        localStorage.setItem(`student_ide_score_${course.id}`, score);
      }
    }

    if (isCorrect) {
      recordCoderLessonEvent({
        lessonId: course.id,
        type: "practice_verify",
        practiceType: course.practiceType,
        score: verifiedScore,
        status: "passed"
      });
      if (course.miniQuiz && !interactivePassed) {
        setInteractivePassed(true);
        notify.success(`Thực hành thành công! Hãy hoàn thành ${course.miniQuiz.length} câu trắc nghiệm để qua bài.`);
        return;
      }
      await handleRewardMobileLesson(course, verifiedScore);
    } else {
      setVerificationStatus("failed");
      recordCoderLessonEvent({
        lessonId: course.id,
        type: "practice_verify",
        practiceType: course.practiceType,
        status: "failed"
      });
      if (course.practiceType === "quiz") {
        notify.error(`Bài thi chưa đạt yêu cầu! Điểm của bạn: ${Math.round((quizQuestions.filter((q, idx) => quizAnswers[idx] === q.a).length / quizQuestions.length) * 100)}% (Yêu cầu >60%)`);
      } else {
        notify.error("Yêu cầu thực hành chưa chính xác, hãy xem lại đề bài!");
      }
    }
  };

  const handleRewardMobileLesson = async (course, verifiedScore = 100) => {
    setVerificationStatus("success");
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    
    const session = getMemberSession();
    if (session?.email) {
      if (!completedLessons.includes(course.id)) {
        try {
          const apiBase = import.meta.env.VITE_API_URL || '/api';
          const r = await fetch(`${apiBase}/joy/award-learning`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: session.email,
              lessonId: course.id,
              evidence: buildLessonEvidence(course, {
                channel: "mobile",
                score: verifiedScore
              })
            })
          });
          const resData = await r.json().catch(() => ({}));
          if (!r.ok) {
            throw new Error(resData.error || `API award-learning failed with status ${r.status}`);
          }
          notify.success("Chính xác! Bạn đã hoàn thành bài học.");
        } catch (e) {
          console.error("Error awarding joy:", e);
          recordCoderLessonEvent({ lessonId: course.id, type: "mobile_award", status: "failed", message: e.message });
          notify.error(e.message || "Lỗi lưu tiến trình, vui lòng thử lại.");
        }
      } else {
        notify.success("Chính xác! Bạn đã hoàn thành bài học.");
      }
    } else {
      notify.success("Chính xác! Bạn đã hoàn thành bài học.");
    }

    if (!completedLessons.includes(course.id)) {
      const nextCompleted = [...completedLessons, course.id];
      setCompletedLessons(nextCompleted);
      localStorage.setItem("student_ide_progress", JSON.stringify(nextCompleted));
      const token = getMemberSession()?.token;
      const headers = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8081/api"}/member/progress/lesson/${course.id}/complete`, { 
        method: "POST",
        headers
      })
        .catch(err => console.error("Failed to sync progress:", err));
    }
  };

  const handleRetakeQuiz = () => {
    setQuizAnswers({});
    setQuizCompleted(false);
    setQuizScore(0);
    setQuizCurrentIndex(0);
    setVerificationStatus(null);
    const course = WEB_COURSES.find(c => c.id === activeCourseId);
    if (course) {
      const pool = course.quizPool || (course.id === "lesson6" ? QUIZ_POOL_1 : QUIZ_POOL_2);
      const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, course.quizSize);
      setQuizQuestions(shuffled);
    }
    notify.success("Đã đổi đề thi mới! Hãy làm lại bài thi.");
  };

  const renderInteractivePractice = (course) => {
    return (
      <InteractivePuzzles
        course={course}
        completedLessons={completedLessons}
        interactivePassed={interactivePassed}
        bio={bio}
        onBioUpdate={onBioUpdate}
        miniQuizAnswers={miniQuizAnswers}
        setMiniQuizAnswers={setMiniQuizAnswers}
        setMiniQuizPassed={setMiniQuizPassed}
        handleRewardMobileLesson={handleRewardMobileLesson}
        htmlBlocks={htmlBlocks}
        sqlBlocks={sqlBlocks}
        moveBlock={moveBlock}
        themeBg={themeBg}
        setThemeBg={setThemeBg}
        themeText={themeText}
        setThemeText={setThemeText}
        clickCount={clickCount}
        setClickCount={setClickCount}
        matchedPairs={matchedPairs}
        handlePairMatch={handlePairMatch}
        blankAnswers={blankAnswers}
        setBlankAnswers={setBlankAnswers}
        screenshotFile={screenshotFile}
        handleScreenshotSelect={handleScreenshotSelect}
        isScanning={isScanning}
        scanProgress={scanProgress}
        scanScore={scanScore}
        quizQuestions={quizQuestions}
        quizCompleted={quizCompleted}
        quizScore={quizScore}
        quizCurrentIndex={quizCurrentIndex}
        setQuizCurrentIndex={setQuizCurrentIndex}
        quizAnswers={quizAnswers}
        setQuizAnswers={setQuizAnswers}
        handleRetakeQuiz={handleRetakeQuiz}
        mobilePuzzleAnswer={mobilePuzzleAnswer}
        setMobilePuzzleAnswer={setMobilePuzzleAnswer}
        verifyInteractivePractice={verifyInteractivePractice}
      />
    );
  };

  const currentMobileCourseIndex = WEB_COURSES.findIndex(c => c.id === mobileCourse?.id);
  
  const handlePrevMobileLesson = () => {
    if (currentMobileCourseIndex > 0) {
      setActiveCourseId(WEB_COURSES[currentMobileCourseIndex - 1].id);
      setMobileStudyMode("story");
      setVerificationStatus(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextMobileLesson = () => {
    if (currentMobileCourseIndex < WEB_COURSES.length - 1) {
      const nextCourse = WEB_COURSES[currentMobileCourseIndex + 1];
      const isCurrentCompleted = completedLessons.includes(mobileCourse?.id);
      
      if (!isCurrentCompleted) {
        notify.error("Vui lòng hoàn thành bài học hiện tại để mở khóa bài tiếp theo!");
        return;
      }
      
      setActiveCourseId(nextCourse.id);
      setMobileStudyMode("story");
      setVerificationStatus(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (!isDesktop) {
    return (
      <MobileGuidebook
        activeCourseId={activeCourseId}
        bio={bio}
        onBioUpdate={onBioUpdate}
        onBack={onBack}
        completedLessons={completedLessons}
        mobileProgress={mobileProgress}
        mobileCourse={mobileCourse}
        mobileCompletedCount={mobileCompletedCount}
        WEB_COURSES={WEB_COURSES}
        setActiveCourseId={setActiveCourseId}
        setMobileStudyMode={setMobileStudyMode}
        setVerificationStatus={setVerificationStatus}
        getLessonTierAndAccess={getLessonTierAndAccess}
        handleExchangeSubscription={handleExchangeSubscription}
        exchangeSubmitting={exchangeSubmitting}
        handleBuyLifetimeUnlock={handleBuyLifetimeUnlock}
        handleClaimMilestoneReward={handleClaimMilestoneReward}
        handlePayMaintenance={handlePayMaintenance}
        handleBuyAllStagesBundle={handleBuyAllStagesBundle}
        mobileStudyMode={mobileStudyMode}
        mobileVisualSet={mobileVisualSet}
        mobileExtra={mobileExtra}
        timeLeft={timeLeft}
        verificationStatus={verificationStatus}
        mobileRunKey={mobileRunKey}
        setMobileRunKey={setMobileRunKey}
        mobileDemoCode={mobileDemoCode}
        canPreviewMobileCourse={canPreviewMobileCourse}
        currentMobileCourseIndex={currentMobileCourseIndex}
        handlePrevMobileLesson={handlePrevMobileLesson}
        handleNextMobileLesson={handleNextMobileLesson}
        onShowCertificate={handleShowCertificate}
        // Puzzle props
        interactivePassed={interactivePassed}
        miniQuizAnswers={miniQuizAnswers}
        setMiniQuizAnswers={setMiniQuizAnswers}
        setMiniQuizPassed={setMiniQuizPassed}
        handleRewardMobileLesson={handleRewardMobileLesson}
        htmlBlocks={htmlBlocks}
        sqlBlocks={sqlBlocks}
        moveBlock={moveBlock}
        themeBg={themeBg}
        setThemeBg={setThemeBg}
        themeText={themeText}
        setThemeText={setThemeText}
        clickCount={clickCount}
        setClickCount={setClickCount}
        matchedPairs={matchedPairs}
        handlePairMatch={handlePairMatch}
        blankAnswers={blankAnswers}
        setBlankAnswers={setBlankAnswers}
        screenshotFile={screenshotFile}
        handleScreenshotSelect={handleScreenshotSelect}
        isScanning={isScanning}
        scanProgress={scanProgress}
        scanScore={scanScore}
        quizQuestions={quizQuestions}
        quizCompleted={quizCompleted}
        quizScore={quizScore}
        quizCurrentIndex={quizCurrentIndex}
        setQuizCurrentIndex={setQuizCurrentIndex}
        quizAnswers={quizAnswers}
        setQuizAnswers={setQuizAnswers}
        handleRetakeQuiz={handleRetakeQuiz}
        mobilePuzzleAnswer={mobilePuzzleAnswer}
        setMobilePuzzleAnswer={setMobilePuzzleAnswer}
        verifyInteractivePractice={verifyInteractivePractice}
      />
    );
  }

  return (
    <FeatureGate
      bio={bio}
      featureKey="hugoCoder"
      priceJoy={1500}
      icon="terminal"
      title="Trao đổi JOY để mở khóa HugoCoder"
      description="Soạn code, học bài tương tác và nhận JOY khi hoàn thành bài học."
      onBioUpdate={onBioUpdate}
      onBack={onBack}
      className="max-w-lg mx-auto mt-10"
    >
    <div className="flex flex-col bg-background h-screen w-screen text-foreground relative overflow-hidden">
      {/* Top IDE Header Control Bar */}
      <div className="bg-card border-b border-border px-4 py-2.5 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="flex items-center gap-1.5 font-bold uppercase hover:text-white transition-colors border-r border-border pr-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
          <div className="flex items-center gap-1.5 font-mono text-muted-foreground">
            <span className="w-2.5 h-2.5 rounded-full bg-primary" />
            <span>STUDENT WORKSPACE</span>
          </div>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-2">
          {activeFile && (
            <button 
              onClick={handleSaveFile}
              className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-white font-bold px-3 py-1.5 rounded transition-all shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              {activeFile.handle ? "Lưu Trực Tiếp (Disk)" : "Tải Về Máy (Local)"}
            </button>
          )}

          <button
            onClick={handleExportProjectZip}
            className="flex items-center gap-1.5 bg-muted hover:bg-muted-foreground text-foreground font-bold px-3 py-1.5 rounded transition-all border border-border"
            title="Xuất toàn bộ workspace hiện tại thành file ZIP"
          >
            <Archive className="w-3.5 h-3.5" /> Xuất ZIP
          </button>

          <button 
            onClick={handleOpenFolder}
            className="flex items-center gap-1.5 bg-muted hover:bg-muted-foreground text-foreground font-bold px-3 py-1.5 rounded transition-all border border-border"
            title="Đồng bộ trực tiếp với thư mục trên máy tính của bạn thông qua File System API"
          >
            <FolderOpen className="w-3.5 h-3.5" /> Mở Thư Mục Cục Bộ
          </button>
        </div>
      </div>

      {/* Main IDE Workspace */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Side Icon Navigation Menu */}
        <div className="w-14 bg-card border-r border-border flex flex-col items-center py-4 justify-between">
          <div className="flex flex-col items-center gap-5 w-full">
            <button 
              onClick={() => setActiveSidebarTab("explorer")}
              className={`p-2.5 rounded-lg transition-all ${activeSidebarTab === "explorer" ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground"}`}
              title="Quản lý File"
            >
              <Folder className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setActiveSidebarTab("learn")}
              className={`p-2.5 rounded-lg transition-all ${activeSidebarTab === "learn" ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground"}`}
              title="Khóa học & Code mẫu"
            >
              <BookOpen className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setActiveSidebarTab("db")}
              className={`p-2.5 rounded-lg transition-all ${activeSidebarTab === "db" ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground"}`}
              title="PHP & phpMyAdmin localhost"
            >
              <Database className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-col items-center gap-4 text-[9px] text-muted-foreground font-mono">
            <span>v1.1</span>
          </div>
        </div>

        {/* Sidebar Tab Panels */}
        <div className="w-64 bg-card border-r border-border flex flex-col text-xs">
          
          {/* TAB 1: File Explorer */}
          {activeSidebarTab === "explorer" && (
            <FileExplorerSidebar
              workspaceTree={workspaceTree}
              activeTabPath={activeTabPath}
              expandedFolders={expandedFolders}
              setExpandedFolders={setExpandedFolders}
              inlineAction={inlineAction}
              setInlineAction={setInlineAction}
              inputRef={inputRef}
              dirHandle={dirHandle}
              toggleFolder={toggleFolder}
              handleOpenFile={handleOpenFile}
              getFileIcon={getFileIcon}
              handleInlineInputKeyDown={handleInlineInputKeyDown}
              handleInlineInputBlur={handleInlineInputBlur}
              handleDeleteEntry={handleDeleteEntry}
              getActiveFolder={getActiveFolder}
            />
          )}

          {/* TAB 2: Tutorials & Learning */}
          {activeSidebarTab === "learn" && (
            <LessonsSidebar
              WEB_COURSES={WEB_COURSES}
              completedLessons={completedLessons}
              activeCourseId={activeCourseId}
              setActiveCourseId={setActiveCourseId}
              setVerificationStatus={setVerificationStatus}
              getLessonTierAndAccess={getLessonTierAndAccess}
              handleExchangeSubscription={handleExchangeSubscription}
              exchangeSubmitting={exchangeSubmitting}
              handleBuyLifetimeUnlock={handleBuyLifetimeUnlock}
              handleClaimMilestoneReward={handleClaimMilestoneReward}
              bio={bio}
              MOBILE_GUIDE_EXTRAS={MOBILE_GUIDE_EXTRAS}
              workspaceFiles={workspaceFiles}
              setWorkspaceFiles={setWorkspaceFiles}
              openTabs={openTabs}
              setOpenTabs={setOpenTabs}
              setActiveTabPath={setActiveTabPath}
              handleVerifyLesson={handleVerifyLesson}
              verificationStatus={verificationStatus}
              onShowCertificate={handleShowCertificate}
              handlePayMaintenance={handlePayMaintenance}
              handleBuyAllStagesBundle={handleBuyAllStagesBundle}
            />
          )}

          {/* TAB 3: phpMyAdmin Local Database Setup */}
          {activeSidebarTab === "db" && (
            <div className="p-4 flex-1 flex flex-col overflow-y-auto space-y-4 font-sans">
              <span className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">PHP & phpMyAdmin Local</span>
              <p className="text-[10.5px] text-muted-foreground leading-relaxed">
                Để chạy PHP và quản lý cơ sở dữ liệu qua phpMyAdmin trên máy tính cá nhân (localhost), 
                sử dụng Docker Compose là phương án gọn nhẹ và dễ tách khỏi dữ liệu thật.
              </p>

              <div className="space-y-3">
                <div className="bg-muted/30 border border-border p-2.5 rounded-lg space-y-1">
                  <p className="font-bold text-[10px] text-foreground">Bước 1: Cài đặt Docker Desktop</p>
                  <p className="text-[9.5px] text-muted-foreground">Tải Docker Desktop từ trang chủ docker.com và cài lên máy tính.</p>
                </div>

                <div className="bg-muted/30 border border-border p-2.5 rounded-lg space-y-2">
                  <p className="font-bold text-[10px] text-foreground">Bước 2: Tạo file docker-compose.yml</p>
                  <p className="text-[9.5px] text-muted-foreground">Tạo file docker-compose.yml cùng thư mục với dự án PHP trên máy của bạn với nội dung sau:</p>
                  <pre className="text-[8.5px] font-mono bg-background p-2 rounded text-muted-foreground overflow-x-auto select-all max-h-32">
{`version: '3.8'
services:
  web:
    image: php:8.2-apache
    ports:
      - "8000:80"
    volumes:
      - ./src:/var/www/html
  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root
    ports:
      - "3306:3306"
  phpmyadmin:
    image: phpmyadmin:latest
    ports:
      - "8080:80"
    environment:
      PMA_HOST: db`}
                  </pre>
                </div>

                <div className="bg-muted/30 border border-border p-2.5 rounded-lg space-y-1">
                  <p className="font-bold text-[10px] text-foreground">Bước 3: Khởi động hệ thống</p>
                  <p className="text-[9.5px] text-muted-foreground">Chạy terminal tại thư mục chứa file và gõ lệnh:</p>
                  <code className="block bg-background p-1.5 text-[9px] font-mono text-primary rounded">docker-compose up -d</code>
                </div>

                <div className="bg-muted/30 border border-border p-2.5 rounded-lg space-y-1">
                  <p className="font-bold text-[10px] text-foreground">Bước 4: Truy cập phpMyAdmin</p>
                  <p className="text-[9.5px] text-muted-foreground">
                    Mở trình duyệt truy cập:
                    <a href="http://localhost:8080" target="_blank" rel="noreferrer" className="block text-primary font-bold mt-1">http://localhost:8080</a>
                    Tài khoản: root / Mật khẩu: root. Đây là môi trường học tập cục bộ; không dùng mật khẩu mẫu này cho hệ thống thật.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Editor Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-background">

          <div className="flex items-center bg-card border-b border-border px-2 overflow-x-auto gap-0.5 select-none scrollbar-hide">
            {openTabs.map((path) => {
              if (!path || typeof path !== "string") return null;
              const fileObj = workspaceFiles.find(f => f && f.path === path);
              const name = fileObj ? fileObj.name : path.split("/").pop();
              const isActive = path === activeTabPath;

              return (
                <div 
                  key={path}
                  onClick={() => setActiveTabPath(path)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold border-t-2 cursor-pointer transition-all ${
                    isActive 
                      ? "bg-background border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-background/50"
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{name}</span>
                  <button
                    onClick={(e) => handleCloseTab(path, e)}
                    className="hover:text-destructive p-0.5 rounded transition-all ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Monaco Editor or Live Preview */}
          <div className="flex-1 relative flex flex-col min-h-0">
            {activeCourseId && !getLessonTierAndAccess(activeCourseId).hasAccess ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-zinc-50/50 dark:bg-zinc-950/20 backdrop-blur-sm select-none font-sans">
                <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-border flex items-center justify-center text-muted-foreground mb-4">
                  <span className="material-symbols-outlined text-2xl animate-pulse">lock</span>
                </div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-foreground mb-1">Không gian soạn thảo bị khóa</h4>
                <p className="text-[10px] text-muted-foreground max-w-xs leading-relaxed">
                  Vui lòng kích hoạt thuê bao hoặc mua gói mở khóa vĩnh viễn ở cột bên trái để bắt đầu lập trình bài học này.
                </p>
              </div>
            ) : previewMode && activeFile?.language === "html" ? (
              <div className="flex-1 flex flex-col bg-white h-full">
                <div className="bg-muted border-b border-border px-4 py-1.5 flex items-center justify-between text-xs text-foreground">
                  <span className="font-bold flex items-center gap-1"><Globe className="w-4 h-4" /> Web Frame Live Preview</span>
                  <button 
                    onClick={() => setPreviewMode(false)}
                    className="flex items-center gap-1 hover:text-foreground font-semibold"
                  >
                    <Eye className="w-3.5 h-3.5" /> Trở lại Editor
                  </button>
                </div>
                <iframe 
                  src={previewUrl}
                  title="Web Live Preview"
                  className="w-full flex-1 border-0 bg-white"
                  sandbox="allow-scripts allow-modals"
                />
              </div>
            ) : (
              <div className="w-full h-full">
                {activeFile ? (
                  <Editor
                    height="100%"
                    language={activeFile.language}
                    theme={isDarkTheme ? "vs-dark" : "light"}
                    value={activeFile.content}
                    onChange={(val) => {
                      setWorkspaceFiles(prev => prev.map(f => {
                        if (f.path === activeTabPath) {
                          return { ...f, content: val || "" };
                        }
                        return f;
                      }));
                    }}
                    options={{
                      fontSize: 13,
                      fontFamily: "Fira Code, Source Code Pro, Consolas, monospace",
                      minimap: { enabled: false },
                      automaticLayout: true,
                      scrollBeyondLastLine: false,
                      tabSize: 4,
                      suggestOnTriggerCharacters: true
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2 font-sans">
                    <AlertTriangle className="w-8 h-8 text-primary/45" />
                    <p className="text-xs">Không có file nào đang mở. Hãy mở một file từ File Explorer hoặc nạp bài học.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Execution Panel / Output Panel */}
          <div className="bg-card border-t border-border px-5 py-4 min-h-[160px] max-h-[190px] flex flex-col font-sans">
            <div className="flex items-center justify-between pb-2 border-b border-border text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setTerminalTab("guide")}
                  className={`flex items-center gap-1.5 pb-1 border-b-2 transition-all ${terminalTab === "guide" ? "border-primary text-foreground" : "border-transparent hover:text-foreground"}`}
                >
                  <Terminal className="w-3.5 h-3.5" /> Hướng dẫn Chạy
                </button>
                <button 
                  onClick={() => {
                    if (!consoleOutput) {
                      setConsoleOutput("[Hệ thống] Nhấn nút 'Chạy Code thử' để giả lập chạy code.");
                    }
                    setTerminalTab("console");
                  }}
                  className={`flex items-center gap-1.5 pb-1 border-b-2 transition-all ${terminalTab === "console" ? "border-primary text-foreground" : "border-transparent hover:text-foreground"}`}
                >
                  <FileCode className="w-3.5 h-3.5" /> Chạy thử Console
                </button>
                <span className="mx-1 text-border">|</span>
                <span className={`font-mono text-[9px] ${saveStatus.includes("Lỗi") ? "text-destructive" : (saveStatus.includes("Đang") ? "text-warning" : "text-success")}`}>
                  ● {saveStatus}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                {(activeFile?.name?.endsWith(".php") || activeFile?.name?.endsWith(".sql") || activeFile?.language === "php" || activeFile?.language === "sql") && (
                  <button 
                    onClick={handleRunSandbox}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-success/15 hover:bg-success/25 text-success border border-success/30 text-[10px] transition-all font-bold font-sans"
                    title="Chạy thử mã nguồn bằng Sandbox Giả lập trực tiếp trên trình duyệt"
                  >
                    <Play className="w-3 h-3 text-success" /> Chạy Code thử
                  </button>
                )}
                {activeFile?.language === "html" && (
                  <button 
                    onClick={() => setPreviewMode(!previewMode)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-[10px] transition-all font-bold font-sans"
                  >
                    <Play className="w-3 h-3" /> {previewMode ? "Dừng Xem" : "Xem Live Preview"}
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pt-3 text-xs leading-relaxed text-muted-foreground">
              {terminalTab === "console" ? (
                <pre className="h-full bg-zinc-950/90 text-emerald-400 rounded-lg p-3 font-mono text-[10.5px] overflow-y-auto leading-relaxed whitespace-pre-wrap select-text border border-zinc-800/80 shadow-inner">
                  {consoleOutput}
                </pre>
              ) : (
                <div className="space-y-1 font-mono text-[11px]">
                  {activeFile?.language === "html" && (
                    <p className="text-muted-foreground">File dạng Web (HTML/CSS/JS). Bạn bấm vào nút **Xem Live Preview** phía trên bên phải để trực quan hóa giao diện ngay lập trình duyệt!</p>
                  )}
                  {activeFile?.language === "python" && (
                    <>
                      <p className="text-muted-foreground">Đối với Python, bạn mở Terminal trên máy tính (local) của bạn tại thư mục chứa file đã tải về và gõ lệnh chạy:</p>
                      <code className="block bg-background p-2 text-success rounded mt-1 border border-border">python3 {activeFile.name}</code>
                    </>
                  )}
                  {activeFile?.language === "c" && (
                    <>
                      <p className="text-muted-foreground">Đối với ngôn ngữ C, hãy cài đặt compiler GCC. Biên dịch và thực thi bằng lệnh Terminal:</p>
                      <code className="block bg-background p-2 text-success rounded mt-1 border border-border">gcc {activeFile.name} -o output && ./output</code>
                    </>
                  )}
                  {activeFile?.language === "cpp" && (
                    <>
                      <p className="text-muted-foreground">Đối với C++, biên dịch bằng trình biên dịch g++:</p>
                      <code className="block bg-background p-2 text-success rounded mt-1 border border-border">g++ {activeFile.name} -o output && ./output</code>
                    </>
                  )}
                  {activeFile?.language === "csharp" && (
                    <>
                      <p className="text-muted-foreground">Đối với C#, hãy cài đặt .NET SDK trên máy. Tạo project Console mới và chạy:</p>
                      <code className="block bg-background p-2 text-success rounded mt-1 border border-border">dotnet run</code>
                    </>
                  )}
                  {activeFile?.language === "php" && (
                    <>
                      <p className="text-muted-foreground">Đối với PHP, bạn có thể chạy server PHP tích hợp cục bộ để test nhanh mà không cần Apache:</p>
                      <code className="block bg-background p-2 text-success rounded mt-1 border border-border">php -S localhost:8000</code>
                      <p className="text-[10px] text-muted-foreground mt-1">Truy cập http://localhost:8000 trên máy tính của bạn để xem kết quả.</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* ── Certificate Modal ────────────────────────────────────────────────── */}
      <CertificateModal
        open={showCertificateModal}
        bio={bio}
        onClose={() => setShowCertificateModal(false)}
        certType={certificateType}
        onBioUpdate={onBioUpdate}
      />

    </div>
    </FeatureGate>
  );
}
