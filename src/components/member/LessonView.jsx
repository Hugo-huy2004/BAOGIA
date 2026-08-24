import { useMemo, useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { STUDY_LIFETIME } from "../../../shared/joyPrices";
import { getCoderStageGate } from "../../../shared/coderProgression.js";
import { FileCode, FileText, FileJson
} from "lucide-react";
import { notify } from "../../lib/notify";
import confetti from "canvas-confetti";
import { HugoConfirmNotice } from "../shared/HugoNotice";
import { getMemberSession } from "../../services/authSession";
import { useJoyStore } from "../../stores/joyStore";
import { TEMPLATES, INITIAL_WORKSPACE } from "./ideData";
import { getStageBenefitsFromCatalog, useCoderLessons } from "../../hooks/useCoderLessons";
import { verifyLessonCode } from "../../services/coderLessonsApi";
import { hugoCoderApi } from "../../services/hugoCoderApi";
import { API_BASE } from "../../config/apiBase";
import { getMobileVisualSet } from "./hugoCoder/VisualIllustrations";
import InteractivePuzzles from "./hugoCoder/InteractivePuzzles";
import MobileGuidebook from "./hugoCoder/MobileGuidebook";
import { runMockSql, runMockPhp } from "./hugoCoder/mockRunner";
import {
  CODER_STORAGE_KEYS,
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
import { STUDY_ALL_STAGES_PRICE } from "../../../shared/joyPrices.js";
import { joyText } from "../../lib/joyDisplay";

// Phí duy trì tháng và thưởng mỗi chặng, tính bằng JOY gốc.
const IDE_MAINTENANCE = 50;
const IDE_PHASE_REWARD = 800;

// embedded=true: chạy trong vỏ chung HugoCoderHub — bỏ FeatureGate riêng,
// bỏ shell fullscreen và nút Back riêng (Hub đã lo các thứ đó).
export default function LessonView({
  onBack,
  onExitLesson,
  bio,
  onBioUpdate,
  urlLessonId,
  embedded = false,
  publicMode = false,
  basePath = "/member/utilities/ide",
}) {
  const { t } = useTranslation();
  const [isDesktop, setIsDesktop] = useState(true);
  const [activeSidebarTab, setActiveSidebarTab] = useState("explorer"); // explorer, learn, db

  const navigate = useNavigate();
  const [activeCourseId, setActiveCourseId] = useState(() => {
    return urlLessonId || null;
  });
  const {
    courses: WEB_COURSES,
    stages: STAGES,
    selectedLesson,
    loading: lessonsLoading,
  } = useCoderLessons(activeCourseId);
  const getStageBenefits = (stageId) => (
    getStageBenefitsFromCatalog(stageId, STAGES)
  );

  useEffect(() => {
    if (urlLessonId !== activeCourseId) {
      setActiveCourseId(urlLessonId || null);
    }
  }, [urlLessonId]);

  // Địa chỉ phải đi theo bài đang học, và phải giữ đúng nhánh người học vào.
  // Trước đây chỗ này ghi cứng `/member/utilities/ide`: vào từ Study là bị đẩy
  // sang nhánh ide, nên nút quay lại và tab đang sáng chỉ về hai nơi khác nhau.
  useEffect(() => {
    if (publicMode) return;
    navigate(activeCourseId ? `${basePath}/${activeCourseId}` : basePath, { replace: true });
  }, [activeCourseId, navigate, publicMode, basePath]);

  // Nhớ bài đang học để lần mở sau vào thẳng, không bắt bấm "tiếp tục" lại từ
  // trang chủ Study. Ghi ở máy vì đây là chỗ đang đọc dở, không phải tiến độ đã
  // được máy chủ chấm — tiến độ thật nằm ở `completedLessons`.
  useEffect(() => {
    if (!activeCourseId) return;
    try {
      localStorage.setItem(CODER_STORAGE_KEYS.lastLesson, activeCourseId);
    } catch {
      /* chế độ riêng tư hoặc hết quota: mất chỗ đang đọc dở không đáng làm vỡ bài học */
    }
  }, [activeCourseId]);

  const [mobileStudyMode, setMobileStudyMode] = useState("story");
  const [completedLessons, setCompletedLessons] = useState(() => {
    if (Array.isArray(bio?.completedLessons)) return bio.completedLessons;
    try {
      return JSON.parse(localStorage.getItem("student_ide_progress") || "[]");
    } catch {
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
  // Đề thi do máy chủ ra (chống gian lận) — null nghĩa là đang dùng đề cục bộ (khách/offline)
  const [examId, setExamId] = useState(null);
  const [exchangeSubmitting, setExchangeSubmitting] = useState(false);

  const getLessonTierAndAccess = (lessonId) => {
    if (!lessonId) return { tier: "basic", tierLabel: "Chặng 1: Phản Xạ Cơ Bản (Bài 1-10)", hasAccess: false, price: 1500, subKey: "hugoCoder" };
    const num = parseInt(lessonId.replace("lesson", ""), 10);

    // Trọn gói 6 chặng (khoá DB giữ tên cũ hugoCoderAll7Lifetime)
    const hasAllLifetime = !!bio?.hugoCoderAll7Lifetime;

    const maintenanceActive = hasAllLifetime || (bio?.featureSubscriptions?.hugoCoder?.expiresAt
      ? new Date(bio.featureSubscriptions.hugoCoder.expiresAt).getTime() > Date.now()
      : false);

    const buildTier = (tier, tierLabel, price, subKey, lifetime) => {
      const stageGate = getCoderStageGate(completedLessons, tier);
      return {
        tier,
        tierLabel,
        price,
        subKey,
        lifetime: hasAllLifetime || lifetime,
        maintenanceActive,
        progressionUnlocked: stageGate.unlocked,
        firstMissingLesson: stageGate.missingLessons[0] || null,
        missingLessonCount: stageGate.missingLessons.length,
        hasAccess: (hasAllLifetime || lifetime) && maintenanceActive && stageGate.unlocked,
      };
    };

    if (num <= 10) return buildTier("basic", "Chặng 1: Phản Xạ Cơ Bản (Bài 1-10)", STUDY_LIFETIME.basic, "hugoCoderBasic", !!bio?.hugoCoderBasicLifetime);
    if (num <= 25) return buildTier("intermediate", "Chặng 2: Tư Duy Kiến Trúc (Bài 11-25)", STUDY_LIFETIME.intermediate, "hugoCoderIntermediate", !!bio?.hugoCoderIntermediateLifetime);
    if (num <= 50) return buildTier("advanced", "Chặng 3: CTDL, Giải Thuật & Mật Mã (Bài 26-50)", STUDY_LIFETIME.advanced, "hugoCoderAdvanced", !!bio?.hugoCoderAdvancedLifetime);
    // Chặng 4 gộp 3 gói cũ (Bảo mật + Kiểm tra + Tối ưu) — ai đã mua 1 trong 3 đều có quyền
    if (num <= 70) return buildTier("security", "Chặng 4: Kỹ Sư Bảo Mật & Tiền Đề AI (Bài 51-70)", STUDY_LIFETIME.security, "hugoCoderSecurity",
      !!(bio?.hugoCoderSecurityLifetime || bio?.hugoCoderExamLifetime || bio?.hugoCoderOptimizeLifetime));
    if (num <= 90) return buildTier("project", "Chặng 5: Siêu Đồ Án Full-Stack & AI (Bài 71-90)", STUDY_LIFETIME.project, "hugoCoderUltimate", !!bio?.hugoCoderUltimateLifetime);
    // Chặng 6 tách từ gói Ultimate cũ (71-100) — ultimate cũ vẫn có quyền
    return buildTier("devops", "Chặng 6: Kỹ Sư DevOps & Phát Hành (Bài 91-100)", STUDY_LIFETIME.devops, "hugoCoderUltimate",
      !!(bio?.hugoCoderDevopsLifetime || bio?.hugoCoderUltimateLifetime));
  };

  const handleExchangeSubscription = (tierInfo) => {
    notify.info((t) => (
      <HugoConfirmNotice
        type="warning"
        title={t("utilities.ide.xacNhanTraoDoi")}
        message={
          <>
            {t("utilities.ide.banCoDongY")} <strong>{joyText(tierInfo.price)}</strong> {t("utilities.ide.10PhiSangTao")} <strong>{tierInfo.tierLabel}</strong> {t("utilities.ide.khong")}
          </>
        }
        onCancel={() => notify.dismiss(t.id)}
        onConfirm={async () => {
          notify.dismiss(t.id);
          setExchangeSubmitting(true);
          try {
            const data = await hugoCoderApi.subscribeFeature({
              email: bio.email,
              featureKey: tierInfo.subKey,
              months: 1,
            });
            
            notify.success(t("utilities.ide.dangKyThanhCong"));
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
            notify.error(err.message || t("utilities.ide.loiGiaoDich"));
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

  const handleBuyLifetimeUnlock = async (tier) => {
    const labels = {
      basic: 'Chặng 1: Phản Xạ Cơ Bản (Bài 1-10)',
      intermediate: 'Chặng 2: Tư Duy Kiến Trúc (Bài 11-25)',
      advanced: 'Chặng 3: CTDL, Giải Thuật & Mật Mã (Bài 26-50)',
      security: 'Chặng 4: Kỹ Sư Bảo Mật & Tiền Đề AI (Bài 51-70)',
      project: 'Chặng 5: Siêu Đồ Án Full-Stack & AI (Bài 71-90)',
      devops: 'Chặng 6: Kỹ Sư DevOps & Phát Hành (Bài 91-100)'
    };
    // Giá dự phòng khi quote của server chưa về — đọc CÙNG bảng với server
    // (shared/joyPrices.js) nên không thể lệch như bản viết tay trước đây.
    const tierPrices = STUDY_LIFETIME;
    let quote;
    try {
      quote = await hugoCoderApi.getLifetimeUnlockQuote(tier);
    } catch (err) {
      notify.error(err.message || "Không thể kiểm tra điều kiện mở khóa.");
      return;
    }

    if (!quote.eligible) {
      notify.error(quote.error || "Bạn chưa đủ điều kiện mở khóa chặng này.");
      return;
    }

    const price = quote.priceJoy ?? tierPrices[tier] ?? 0;
    const tierLabel = quote.label ?? labels[tier] ?? 'Khóa học';
    notify.info((t) => (
      <HugoConfirmNotice
        type="warning"
        title={t("utilities.ide.muaGoiVinhVien")}
        message={
          <>
            {t("utilities.ide.banCoDongY")} <strong>{joyText(quote.total)}</strong> {t("utilities.ide.gom")} {price} {t("utilities.ide.joyVa")} {quote.tax} {t("utilities.ide.joyPhiSangTao")} <strong>{tierLabel}</strong>?
            <span className="block mt-1.5 text-[11px] opacity-90">
              {getStageBenefits(tier).map((b, i) => (
                <span key={i} className="block">— {b}</span>
              ))}
            </span>
          </>
        }
        onCancel={() => notify.dismiss(t.id)}
        onConfirm={async () => {
          notify.dismiss(t.id);
          setExchangeSubmitting(true);
          try {
            const data = await hugoCoderApi.buyLifetimeUnlock(tier);
            
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
            notify.error(err.message || t("utilities.ide.loiGiaoDich"));
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
        title={t("utilities.ide.giaHanBoPhat")}
        message={
          <>
            {t("utilities.ide.banCoDongY")} <strong>{joyText(IDE_MAINTENANCE)}</strong> {t("utilities.ide.10PhiSangTao2")}
          </>
        }
        onCancel={() => notify.dismiss(t.id)}
        onConfirm={async () => {
          notify.dismiss(t.id);
          setExchangeSubmitting(true);
          try {
            const data = await hugoCoderApi.subscribeFeature({
              email: bio.email,
              featureKey: "hugoCoder",
              months: 1,
            });
            
            notify.success(t("utilities.ide.dongPhiBaoTri"));
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
            notify.error(err.message || t("utilities.ide.loiGiaoDich"));
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
        title={t("utilities.ide.muaTronGoi6")}
        message={
          <>
            {t("utilities.ide.banCoDongY")} <strong>{joyText(STUDY_ALL_STAGES_PRICE)}</strong> {t("utilities.ide.10PhiSangTao3")}
          </>
        }
        onCancel={() => notify.dismiss(t.id)}
        onConfirm={async () => {
          notify.dismiss(t.id);
          setExchangeSubmitting(true);
          try {
            const data = await hugoCoderApi.buyAllStagesBundle();
            
            if (data.alreadyOwned) {
              notify.success(t("utilities.ide.quyenSoHuuTron"));
            } else {
              notify.success(t("utilities.ide.moKhoaTronGoi"));
            }
            useJoyStore.getState().setBalance(data.balance);
            if (onBioUpdate) {
              onBioUpdate(data.bio);
            }
          } catch (err) {
            notify.error(err.message || t("utilities.ide.loiGiaoDich"));
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
      const data = await hugoCoderApi.claimMilestoneReward(phaseNum);

      import("canvas-confetti").then((module) => {
        const conf = module.default || module;
        conf({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      });

      notify.success(`Chúc mừng! Bạn đã nhận thưởng +${joyText(IDE_PHASE_REWARD)} cho Chặng ${phaseNum}! 🎁`);
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
        if (!token) return;
        const headers = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        const res = await fetch(`${API_BASE}/member/progress`, {
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
  const [quizReview, setQuizReview] = useState([]);

  useEffect(() => {
    const targetCourseId = activeCourseId || WEB_COURSES[0]?.id;
    if (!targetCourseId) return;
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
    setQuizReview([]);
    setInteractivePassed(false);
    setMiniQuizPassed(false);
    setMiniQuizAnswers({});

    const course = WEB_COURSES.find(c => c.id === targetCourseId);
    if (!course) return;

    // Catalog rows only contain lightweight metadata. Wait for the selected
    // lesson detail before touching practice payloads such as dragBlocks or
    // quizPool; otherwise the public route can crash while that detail request
    // is still in flight.
    if (course.practiceType === "drag_drop_html" && Array.isArray(course.dragBlocks)) {
      const shuffled = [...course.dragBlocks].sort(() => Math.random() - 0.5);
      setHtmlBlocks(shuffled);
    } else if (course.practiceType === "drag_drop_sql" && Array.isArray(course.dragBlocks)) {
      const shuffled = [...course.dragBlocks].sort(() => Math.random() - 0.5);
      setSqlBlocks(shuffled);
    } else if (
      course.practiceType === "quiz"
      && Number.isFinite(course.quizSize)
      && Array.isArray(course.quizPool)
    ) {
      startServerExam(course);
    }
  }, [
    activeCourseId,
    selectedLesson?.id,
    selectedLesson?.practiceType,
    selectedLesson?.dragBlocks,
    selectedLesson?.quizPool,
    selectedLesson?.quizSize,
  ]);

  useEffect(() => {
    setTimeLeft(0);
  }, [activeCourseId]);




  // Bài thi trắc nghiệm: máy chủ ra đề và giữ đáp án. Khách chưa đăng nhập/offline
  // rơi về đề cục bộ (chỉ luyện tập, không có thưởng JOY từ server).
  const startServerExam = async (course, confirmRetake = false) => {
    setExamId(null);
    const session = getMemberSession();
    if (session?.email) {
      try {
        const res = await fetch(`${API_BASE}/joy/coder-exam/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lessonId: course.id, confirmRetake })
        });
        const data = await res.json().catch(() => ({}));

        // Lượt thi trong gói đã dùng — hỏi xác nhận trước khi trừ JOY
        if (res.status === 402 && data.requiresFee) {
          const ok = await notify.confirm({
            title: "Thi lại bài kiểm tra",
            message: `Lượt thi trong gói đã dùng (đã nộp ${data.attemptsUsed} lần). Thi lại tốn ${joyText(data.requiresFee)}/lần — đồng ý trừ và nhận đề mới?`,
            confirmText: `Trừ ${joyText(data.requiresFee)} & thi lại`,
            danger: true
          });
          if (ok) return startServerExam(course, true);
          setQuizQuestions([]);
          return;
        }

        if (res.ok) {
          setExamId(data.examId);
          setQuizQuestions(data.questions);
          if (data.charged > 0) {
            useJoyStore.getState().setBalance(data.balance);
            notify.info(`Đã trừ ${joyText(data.charged)} cho lượt thi lại. Chúc bạn thi tốt!`);
          }
          return;
        }
        if (data.error) {
          // Lỗi có chủ đích (vd: thiếu JOY) — không phát đề luyện tập thay thế
          notify.error(data.error);
          setQuizQuestions([]);
          return;
        }
      } catch (e) {
        console.error("Không lấy được đề từ máy chủ, dùng đề luyện tập cục bộ:", e);
      }
    }
    const pool = Array.isArray(course.quizPool) ? course.quizPool : [];
    if (pool.length === 0) {
      notify.error("Bài thi chưa có ngân hàng câu hỏi hợp lệ. Hệ thống đã chặn để tránh phát đề sai.");
      setQuizQuestions([]);
      return;
    }
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, course.quizSize);
    setQuizQuestions(shuffled);
  };

  const handleVerifyLesson = async (course) => {
    const fileObj = workspaceFiles.find(f => f.path === course.file);
    if (!fileObj) {
      notify.error(`Vui lòng nạp bài học để tạo file ${course.file} trước!`);
      return;
    }
    
    // Verification rules stay on the server with the paginated lesson source.
    let isCorrect = false;
    try {
      const result = await verifyLessonCode(
        course.id,
        stripCodeComments(fileObj.content),
      );
      isCorrect = Boolean(result?.passed);
    } catch {
      notify.error("Không thể kết nối máy chủ chấm bài. Vui lòng thử lại.");
      return;
    }
    if (isCorrect) {
      setVerificationStatus("success");
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      const session = getMemberSession();
      let completionAccepted = true;
      if (session?.email) {
        if (!completedLessons.includes(course.id)) {
          try {
            const r = await fetch(`${API_BASE}/joy/award-learning`, {
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
            notify.success(resData.evidence
              ? "Đã hoàn thành! Minh chứng mới đã được lưu vào Hugo Profile."
              : "Chính xác! Bài học đã được xác minh hoàn thành.");
            recordCoderLessonEvent({ lessonId: course.id, type: "desktop_award", status: "accepted" });
          } catch (e) {
            completionAccepted = false;
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
      
      if (completionAccepted && !completedLessons.includes(course.id)) {
        const nextCompleted = [...completedLessons, course.id];
        setCompletedLessons(nextCompleted);
        localStorage.setItem("student_ide_progress", JSON.stringify(nextCompleted));
      } else if (!completionAccepted) {
        setVerificationStatus(null);
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

  useEffect(() => {
    if (!activeCourseId || selectedLesson?.id !== activeCourseId || !selectedLesson?.file) return;
    const lessonPath = selectedLesson.file;
    setWorkspaceFiles((current) => {
      if (current.some((file) => file.path === lessonPath)) return current;
      return [
        ...current,
        {
          path: lessonPath,
          name: lessonPath.split("/").pop(),
          content: selectedLesson.starterCode || "",
          language: getLanguageFromExt(lessonPath.split(".").pop().toLowerCase()),
        },
      ];
    });
    setOpenTabs((current) => (
      current.includes(lessonPath) ? current : [...current, lessonPath]
    ));
    setActiveTabPath(lessonPath);
    setActiveSidebarTab("learn");
  }, [activeCourseId, selectedLesson?.id, selectedLesson?.file, selectedLesson?.starterCode]);

  const mobileCourse = useMemo(
    () => WEB_COURSES.find(c => c.id === activeCourseId) || WEB_COURSES[0],
    [activeCourseId, WEB_COURSES]
  );

  const mobileExtra = useMemo(
    () => mobileCourse?.mobileExtra || {},
    [mobileCourse]
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
    () => Math.round((mobileCompletedCount / Math.max(WEB_COURSES.length, 1)) * 100),
    [mobileCompletedCount, WEB_COURSES.length]
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
              } catch {
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
      } catch {
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
        title={t("utilities.ide.xacNhanXoa")}
        message={<>{t("utilities.ide.banCoChacChan")} {type === "folder" ? t("utilities.ide.thuMuc") : "file"} "{targetPath.split('/').pop()}{t("utilities.ide.khongHanhDongNay")}</>}
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
      let score = 0;
      if (examId) {
        // Máy chủ chấm — client chỉ gửi lựa chọn, không gửi điểm
        try {
          const res = await fetch(`${API_BASE}/joy/coder-exam/submit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              examId,
              answers: quizQuestions.map((q, idx) => quizAnswers[idx] ?? -1)
            })
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            notify.error(data.error || "Không nộp được bài thi, hãy đổi đề và thử lại.");
            setExamId(null);
            return;
          }
          score = data.score;
          setQuizReview(Array.isArray(data.review) ? data.review : []);
          setExamId(null); // đề dùng một lần
        } catch {
          notify.error("Mất kết nối máy chủ chấm thi, hãy thử lại.");
          return;
        }
      } else {
        // Đề luyện tập cục bộ (khách/offline)
        let correct = 0;
        quizQuestions.forEach((q, idx) => {
          if (quizAnswers[idx] === q.a) correct++;
        });
        score = Math.round((correct / quizQuestions.length) * 100);
        setQuizReview(quizQuestions.map((question, index) => ({
          questionIndex: index,
          selectedAnswer: quizAnswers[index] ?? -1,
          correctAnswer: question.a,
          correct: quizAnswers[index] === question.a,
          correctText: question.o?.[question.a] || "",
        })));
      }
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
        notify.error(`Bài thi chưa đạt yêu cầu! Điểm của bạn: ${verifiedScore}% (Yêu cầu ≥60%). Xem đáp án đúng bên dưới để ôn lại.`);
      } else {
        notify.error("Yêu cầu thực hành chưa chính xác, hãy xem lại đề bài!");
      }
    }
  };

  const handleRewardMobileLesson = async (course, verifiedScore = 100) => {
    setVerificationStatus("success");
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    
    const session = getMemberSession();
    let completionAccepted = true;
    if (session?.email) {
      if (!completedLessons.includes(course.id)) {
        try {
          const r = await fetch(`${API_BASE}/joy/award-learning`, {
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
          notify.success(resData.evidence
            ? "Đã hoàn thành! Minh chứng mới đã được lưu vào Hugo Profile."
            : "Chính xác! Bạn đã hoàn thành bài học.");
        } catch (e) {
          completionAccepted = false;
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

    if (completionAccepted && !completedLessons.includes(course.id)) {
      const nextCompleted = [...completedLessons, course.id];
      setCompletedLessons(nextCompleted);
      localStorage.setItem("student_ide_progress", JSON.stringify(nextCompleted));
    } else if (!completionAccepted) {
      setVerificationStatus(null);
    }
  };

  const handleRetakeQuiz = () => {
    setQuizAnswers({});
    setQuizCompleted(false);
    setQuizScore(0);
    setQuizReview([]);
    setQuizCurrentIndex(0);
    setVerificationStatus(null);
    const course = WEB_COURSES.find(c => c.id === activeCourseId);
    if (course) {
      startServerExam(course);
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
        quizReview={quizReview}
        quizCurrentIndex={quizCurrentIndex}
        setQuizCurrentIndex={setQuizCurrentIndex}
        quizAnswers={quizAnswers}
        setQuizAnswers={setQuizAnswers}
        handleRetakeQuiz={handleRetakeQuiz}
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

  if (lessonsLoading && WEB_COURSES.length === 0) {
    return (
      <div className="flex min-h-[420px] items-center justify-center text-sm text-muted-foreground">
        <span className="material-symbols-outlined mr-2 animate-spin">progress_activity</span>
        {t("utilities.ide.dangTaiLoTrinh")}
      </div>
    );
  }

  // Một màn hình bài học duy nhất cho mọi kích thước. Nhánh desktop trước đây
  // là trình soạn thảo Monaco kèm cây thư mục và khung xem trước — đã gỡ theo
  // yêu cầu: học viên gõ code trong công cụ thật của mình, phần thực hành ở
  // đây là bảng bước (PracticeSteps) rồi tới câu hỏi chốt bài.
  return (
    <MobileGuidebook
      embedded={embedded || publicMode}
      onExitLesson={onExitLesson}
      activeCourseId={activeCourseId}
      bio={bio}
      onBioUpdate={onBioUpdate}
      onBack={onBack}
      completedLessons={completedLessons}
      mobileProgress={mobileProgress}
      mobileCourse={mobileCourse}
      mobileCompletedCount={mobileCompletedCount}
      WEB_COURSES={WEB_COURSES}
      STAGES={STAGES}
      getStageBenefits={getStageBenefits}
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
      quizReview={quizReview}
      quizCurrentIndex={quizCurrentIndex}
      setQuizCurrentIndex={setQuizCurrentIndex}
      quizAnswers={quizAnswers}
      setQuizAnswers={setQuizAnswers}
      handleRetakeQuiz={handleRetakeQuiz}
      verifyInteractivePractice={verifyInteractivePractice}
    />
  );}
