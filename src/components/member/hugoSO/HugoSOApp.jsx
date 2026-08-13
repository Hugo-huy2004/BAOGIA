import { useCallback, useEffect, useMemo, useState } from "react";
import BackButton from "../shared/BackButton";
import { useJoyStore } from "../../../stores/joyStore";
import {
  HUGOSO_BUNDLE,
  HUGOSO_CONTENT_AUDIT,
  HUGOSO_COURSE_ORDER,
  HUGOSO_COURSES,
  getCourseProgress,
} from "./hugoSOCourses";
import "./hugo-so.css";
import "../study/study-course-ios17.css";

const API = import.meta.env.VITE_API_URL || "/api";
const OWNED_KEY = "hugoso_owned_courses_v1";
const PROGRESS_KEY = "hugoso_completed_steps_v1";
const VERIFIED_AT = "30/07/2026";

const OFFICE_LAB = {
  calendar: {
    label: "Calendar",
    action: "Mở lịch của tôi",
    href: "https://calendar.google.com/calendar/u/0/r",
    icon: "calendar_month",
    color: "#ff826f",
    soft: "#fff0eb",
    template: "Tạo tuần làm việc",
  },
  docs: {
    label: "Docs",
    action: "Tạo báo cáo mới",
    href: "https://docs.new",
    icon: "description",
    color: "#6aa9ff",
    soft: "#edf5ff",
    template: "Khung báo cáo Harvard",
  },
  sheets: {
    label: "Sheets",
    action: "Tạo bảng tính mới",
    href: "https://sheets.new",
    icon: "table_view",
    color: "#50bf8c",
    soft: "#eaf9f1",
    template: "Tracker công việc",
  },
  gemini: {
    label: "Gemini",
    action: "Mở trợ lý Gemini",
    href: "https://gemini.google.com/app",
    icon: "auto_awesome",
    color: "#9a7cf2",
    soft: "#f2edff",
    template: "Prompt canvas",
  },
};

const readList = (key) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

const normalizeEvidence = (value = "") => value
  .toLocaleLowerCase("vi-VN")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/đ/g, "d")
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

const evidenceLabel = (keyword) => {
  const labels = {
    ho_chi_minh: "Ho Chi Minh",
    all_tabs: "All tabs",
    không_tìm_thấy: "Không tìm thấy",
  };
  return labels[keyword] || keyword.replaceAll("_", " ");
};

const getPracticeEvidence = (lesson, value) => {
  const normalizedValue = normalizeEvidence(value);
  return lesson.practice.keywords.map((keyword) => ({
    keyword,
    label: evidenceLabel(keyword),
    matched: normalizedValue.includes(normalizeEvidence(keyword)),
  }));
};

const postJson = async (path, body) => {
  const response = await fetch(`${API}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Không thể hoàn tất yêu cầu.");
  return data;
};

function ProductMark({ course, size = "normal" }) {
  return (
    <span
      className={`hso-product-mark hso-product-mark--${size}`}
      style={{ "--course": course.color, "--course-soft": course.soft }}
      aria-hidden="true"
    >
      <span className="material-symbols-outlined">{course.icon}</span>
    </span>
  );
}

function ProgressRing({ percent }) {
  return (
    <span className="hso-progress-ring" style={{ "--progress": `${percent * 3.6}deg` }}>
      <span>{percent}%</span>
    </span>
  );
}

function PreviewCoach({ mode, scene }) {
  if (mode === 0) return null;
  return (
    <aside className={`hso-preview-coach hso-preview-coach--${mode === 1 ? "practice" : "mistake"}`}>
      <span className="material-symbols-outlined">{mode === 1 ? "touch_app" : "error"}</span>
      <div>
        <small>{mode === 1 ? "DỪNG VÀ LÀM THEO" : "LỖI PHỔ BIẾN"}</small>
        <strong>{mode === 1 ? scene.heading : `Đừng bỏ qua: ${scene.heading}`}</strong>
        <p>{mode === 1 ? scene.checkpoint : `Đối chiếu hướng dẫn: ${scene.detail}`}</p>
      </div>
    </aside>
  );
}

function OfficePreview({ course, scene, mode }) {
  if (course.id === "calendar") {
    return (
      <div className="hso-preview hso-preview--calendar">
        <header><b>Tháng 7</b><span>Hôm nay</span></header>
        <div className="hso-calendar-days">{["T2", "T3", "T4", "T5", "T6"].map((day) => <span key={day}>{day}</span>)}</div>
        <div className="hso-calendar-board">
          <i className="is-focus">09:00<br /><b>Focus time</b></i>
          <i className="is-meeting">13:30<br /><b>Weekly sync</b></i>
          <i className="is-task">16:00<br /><b>Review task</b></i>
        </div>
        <PreviewCoach mode={mode} scene={scene} />
        <p><strong>{scene.heading}</strong><span>{scene.detail}</span></p>
      </div>
    );
  }

  if (course.id === "docs") {
    return (
      <div className="hso-preview hso-preview--docs">
        <header><b>Báo cáo nghiên cứu</b><span>Đang lưu trên Drive</span></header>
        <div className="hso-doc-sheet">
          <small>STUDY WITH HUGO · HARVARD REPORT</small>
          <h4>1. Introduction</h4>
          <i /><i /><i className="is-short" />
          <h5>1.1 Research context</h5>
          <i /><i className="is-citation" />
          <em>Nguyen (2026) cho rằng…</em>
        </div>
        <PreviewCoach mode={mode} scene={scene} />
        <p><strong>{scene.heading}</strong><span>{scene.detail}</span></p>
      </div>
    );
  }

  if (course.id === "sheets") {
    const cells = Array.from({ length: 24 }, (_, index) => index);
    return (
      <div className="hso-preview hso-preview--sheets">
        <header><b>Work tracker</b><span>fx =SUM(E2:E8)</span></header>
        <div className="hso-sheet-grid">
          {cells.map((cell) => <i key={cell} className={cell === 10 ? "is-active" : ""}>{cell < 6 ? ["Task", "Owner", "Status", "Due", "JOY", "Note"][cell] : ""}</i>)}
        </div>
        <div className="hso-mini-chart"><i /><i /><i /><i /><i /></div>
        <PreviewCoach mode={mode} scene={scene} />
        <p><strong>{scene.heading}</strong><span>{scene.detail}</span></p>
      </div>
    );
  }

  return (
    <div className="hso-preview hso-preview--gemini">
      <header><span className="material-symbols-outlined">auto_awesome</span><b>Gemini workspace</b></header>
      <div className="hso-chat-bubble is-user">Hãy giúp tôi lập kế hoạch, nhưng hỏi lại trước khi kết luận.</div>
      <div className="hso-chat-bubble is-ai"><span className="material-symbols-outlined">auto_awesome</span> Mục tiêu quan trọng nhất và thời hạn của bạn là gì?</div>
      <PreviewCoach mode={mode} scene={scene} />
      <div className="hso-prompt-box"><span>{scene.heading}: {scene.detail}</span><i className="material-symbols-outlined">arrow_upward</i></div>
    </div>
  );
}

function LessonStudio({ lesson, course }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeClip, setActiveClip] = useState(0);

  useEffect(() => {
    setPlaying(false);
    setProgress(0);
    setActiveClip(0);
  }, [lesson.id]);

  useEffect(() => {
    if (!playing || progress >= 100) return undefined;
    const timer = window.setInterval(() => {
      setProgress((current) => Math.min(100, current + 0.8));
    }, 180);
    return () => window.clearInterval(timer);
  }, [playing, progress]);

  useEffect(() => {
    if (progress >= 100) setPlaying(false);
  }, [progress]);

  const clips = [
    { label: "Demo thao tác", icon: "play_circle", note: "Xem quy trình hoàn chỉnh" },
    { label: "Làm cùng Hugo", icon: "touch_app", note: "Dừng ở từng thao tác" },
    { label: "Lỗi thường gặp", icon: "error", note: "Nhận biết và sửa nhanh" },
  ];
  const scenes = lesson.video.scenes;
  const activeScene = Math.min(scenes.length - 1, Math.floor((progress / 100) * scenes.length));
  const scene = scenes[(activeScene + activeClip) % scenes.length];

  return (
    <section className="hso-studio" style={{ "--course": course.color, "--course-soft": course.soft }}>
      <div className="hso-studio__tabs" role="tablist" aria-label="Định dạng hướng dẫn">
        {clips.map((clip, index) => (
          <button
            type="button"
            role="tab"
            aria-selected={activeClip === index}
            key={clip.label}
            className={activeClip === index ? "is-active" : ""}
            onClick={() => {
              setActiveClip(index);
              setProgress(0);
              setPlaying(false);
            }}
          >
            <span className="material-symbols-outlined">{clip.icon}</span>
            <span><b>{clip.label}</b><small>{clip.note}</small></span>
          </button>
        ))}
      </div>

      <div className="hso-studio__stage">
        <div className="hso-studio__topline">
          <span><i /> BẢN HƯỚNG DẪN TƯƠNG TÁC</span>
          <strong>{String(activeScene + 1).padStart(2, "0")} / {String(scenes.length).padStart(2, "0")}</strong>
        </div>
        <div className="hso-studio__device">
          <div className="hso-studio__browser">
            <span /><span /><span />
            <p>{course.shortTitle} · Practice Lab</p>
          </div>
          <OfficePreview course={course} scene={scene} mode={activeClip} />
        </div>
        <button
          type="button"
          className="hso-studio__play"
          onClick={() => {
            if (progress >= 100) setProgress(0);
            setPlaying((value) => !value);
          }}
          aria-label={playing ? "Tạm dừng video minh họa" : "Phát video minh họa"}
        >
          <span className="material-symbols-outlined">{playing ? "pause" : "play_arrow"}</span>
        </button>
      </div>

      <div className="hso-studio__meta">
        <div>
          <p>{clips[activeClip].label.toLocaleUpperCase("vi-VN")}</p>
          <h2>{lesson.video.title}</h2>
        </div>
        <span><span className="material-symbols-outlined">schedule</span>{lesson.duration}</span>
      </div>

      <div className="hso-studio__timeline">
        <i style={{ width: `${progress}%` }} />
      </div>

      <div className="hso-studio__chapters">
        {scenes.map((scene, index) => (
          <button
            type="button"
            key={scene.id}
            className={index === activeScene ? "is-active" : ""}
            onClick={() => setProgress((index / scenes.length) * 100)}
          >
            <span>{index === activeScene ? <span className="material-symbols-outlined">play_arrow</span> : String(index + 1).padStart(2, "0")}</span>
            <span><small>CHƯƠNG {index + 1} · KHỚP BƯỚC {index + 1}</small>{scene.heading}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function PurchaseSheet({ target, access, onClose, onConfirm, buying }) {
  if (!target) return null;
  const isBundle = target === "bundle";
  const course = isBundle ? null : HUGOSO_COURSES[target];
  const fallbackPrice = isBundle ? HUGOSO_BUNDLE.priceJoy : course.priceJoy;
  const quote = access?.pricing?.[target] || {
    priceJoy: fallbackPrice,
    tax: Math.floor(fallbackPrice * 0.1),
    total: fallbackPrice + Math.floor(fallbackPrice * 0.1),
  };

  return (
    <div className="hso-sheet" role="dialog" aria-modal="true" aria-labelledby="hso-purchase-title">
      <button type="button" className="hso-sheet__backdrop" onClick={onClose} aria-label="Đóng" />
      <div className="hso-sheet__panel">
        <span className="hso-sheet__handle" />
        <div className="hso-sheet__icon">
          <span className="material-symbols-outlined">{isBundle ? "workspace_premium" : course.icon}</span>
        </div>
        <p className="hso-kicker">QUYỀN SỞ HỮU TRỌN ĐỜI</p>
        <h2 id="hso-purchase-title">{isBundle ? HUGOSO_BUNDLE.title : course.title}</h2>
        <p className="hso-sheet__copy">
          {isBundle
            ? "Mở toàn bộ 4 khóa, mọi bài thực hành hiện tại và các nội dung cập nhật sau này."
            : "Mở toàn bộ lộ trình, bài thực hành và cập nhật tương lai của khóa học này."}
        </p>
        <dl className="hso-invoice">
          <div><dt>Giá khóa học</dt><dd>{quote.priceJoy.toLocaleString("vi-VN")} JOY</dd></div>
          <div><dt>Phí sáng tạo 10%</dt><dd>{quote.tax.toLocaleString("vi-VN")} JOY</dd></div>
          <div className="is-total"><dt>Tổng trao đổi</dt><dd>{quote.total.toLocaleString("vi-VN")} JOY</dd></div>
        </dl>
        <button type="button" className="hso-primary-action" disabled={buying} onClick={onConfirm}>
          {buying ? "Đang xác nhận…" : `Mở khóa · ${quote.total.toLocaleString("vi-VN")} JOY`}
        </button>
        <button type="button" className="hso-quiet-action" onClick={onClose}>Để sau</button>
        <p className="hso-sheet__note">Không tự gia hạn · JOY không quy đổi thành tiền mặt</p>
      </div>
    </div>
  );
}

export default function HugoSOApp({ bio, showToast, onBioUpdate, onBack, initialCourseId = null, unifiedHome = false }) {
  const walletBalance = useJoyStore((state) => state.balance);
  const setWalletBalance = useJoyStore((state) => state.setBalance);
  const [view, setView] = useState(() => (
    initialCourseId && HUGOSO_COURSES[initialCourseId]
      ? { name: "course", courseId: initialCourseId, stepId: null }
      : { name: "home", courseId: null, stepId: null }
  ));
  const [homeTab, setHomeTab] = useState("today");
  const [owned, setOwned] = useState(() => new Set(readList(OWNED_KEY)));
  const [completed, setCompleted] = useState(() => new Set(readList(PROGRESS_KEY)));
  const [access, setAccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchaseTarget, setPurchaseTarget] = useState(null);
  const [buying, setBuying] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState(null);
  const [practiceText, setPracticeText] = useState("");
  const [didPractice, setDidPractice] = useState(false);
  const [submissionError, setSubmissionError] = useState("");

  const balance = walletBalance || Number(bio?.joyBalance) || 0;

  useEffect(() => {
    let alive = true;
    Promise.allSettled([
      fetch(`${API}/joy/hugoso-access`, { credentials: "include" }).then((response) => {
        if (!response.ok) throw new Error("access");
        return response.json();
      }),
      fetch(`${API}/member/progress`, { credentials: "include" }).then((response) => {
        if (!response.ok) throw new Error("progress");
        return response.json();
      }),
    ]).then(([accessResult, progressResult]) => {
      if (!alive) return;
      if (accessResult.status === "fulfilled") {
        const serverOwned = accessResult.value.ownedCourses || [];
        setOwned(new Set(serverOwned));
        setAccess(accessResult.value);
        localStorage.setItem(OWNED_KEY, JSON.stringify(serverOwned));
        if (accessResult.value.balance != null) setWalletBalance(accessResult.value.balance);
      }
      if (progressResult.status === "fulfilled") {
        const serverProgress = (progressResult.value.lessons || []).filter((id) => id.startsWith("hugoso-"));
        const merged = [...new Set([...readList(PROGRESS_KEY), ...serverProgress])];
        setCompleted(new Set(merged));
        localStorage.setItem(PROGRESS_KEY, JSON.stringify(merged));
      }
      setLoading(false);
    });
    return () => { alive = false; };
  }, [setWalletBalance]);

  useEffect(() => {
    const sheetOpen = Boolean(purchaseTarget);
    window.dispatchEvent(new CustomEvent("hugo:fullsheet", { detail: { open: sheetOpen } }));
    return () => window.dispatchEvent(new CustomEvent("hugo:fullsheet", { detail: { open: false } }));
  }, [purchaseTarget]);

  useEffect(() => {
    setQuizAnswer(null);
    setPracticeText("");
    setDidPractice(false);
    setSubmissionError("");
  }, [view.stepId]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const app = document.querySelector(".hso-app");
      app?.scrollTo({ top: 0, behavior: "auto" });
      let parent = app?.parentElement;
      while (parent && parent !== document.body) {
        const overflowY = window.getComputedStyle(parent).overflowY;
        if (/(auto|scroll)/.test(overflowY) && parent.scrollHeight > parent.clientHeight) {
          parent.scrollTo({ top: 0, behavior: "auto" });
          break;
        }
        parent = parent.parentElement;
      }
      window.scrollTo({ top: 0, behavior: "auto" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [view.name, view.courseId, view.stepId]);

  const courses = useMemo(
    () => HUGOSO_COURSE_ORDER.map((id) => HUGOSO_COURSES[id]),
    [],
  );
  const totalSteps = courses.reduce((sum, course) => sum + course.steps.length, 0);
  const completedCount = [...completed].filter((id) => id.startsWith("hugoso-")).length;
  const selectedCourse = view.courseId ? HUGOSO_COURSES[view.courseId] : null;
  const selectedStep = selectedCourse?.steps.find((step) => step.id === view.stepId) || null;

  const isOwned = useCallback((courseId) => owned.has(courseId), [owned]);

  const openCourse = (courseId) => setView({ name: "course", courseId, stepId: null });
  const openStep = (courseId, stepId) => setView({ name: "lesson", courseId, stepId });

  const canOpenStep = (course, step, index) => {
    if (!step.free && !isOwned(course.id)) return false;
    if (index === 0) return true;
    return completed.has(`hugoso-${course.steps[index - 1].id}`);
  };

  const markCompleted = async () => {
    if (!selectedStep) return;
    const quizPassed = quizAnswer === selectedStep.quiz.correct;
    const evidence = getPracticeEvidence(selectedStep, practiceText);
    const keywordCount = evidence.filter((item) => item.matched).length;
    const practicePassed = keywordCount >= selectedStep.practice.minimumKeywords;

    if (!quizPassed) {
      setSubmissionError("Câu trắc nghiệm chưa đúng. Chọn lại đáp án theo phần giải thích phía trên.");
      return;
    }
    if (!practicePassed) {
      const missing = evidence
        .filter((item) => !item.matched)
        .slice(0, Math.max(1, selectedStep.practice.minimumKeywords - keywordCount))
        .map((item) => item.label)
        .join(", ");
      setSubmissionError(
        `Phần mô tả mới đạt ${keywordCount}/${selectedStep.practice.minimumKeywords} ý cần thiết. Bổ sung: ${missing}.`,
      );
      return;
    }
    if (!didPractice) {
      setSubmissionError(`Hãy thực hiện trên ${selectedCourse.shortTitle}, sau đó bật ô xác nhận “Tôi đã thực hiện”.`);
      return;
    }

    setSubmissionError("");
    const lessonId = `hugoso-${selectedStep.id}`;
    const next = new Set(completed);
    next.add(lessonId);
    setCompleted(next);
    localStorage.setItem(PROGRESS_KEY, JSON.stringify([...next]));
    showToast?.("Đạt yêu cầu! Bước tiếp theo đã được mở.", "success");
    postJson(`/member/progress/lesson/${lessonId}/complete`, {}).catch(() => {});
  };

  const buyCourse = async () => {
    if (!purchaseTarget || buying) return;
    setBuying(true);
    try {
      const result = await postJson("/joy/buy-hugoso-course", { courseId: purchaseTarget });
      const serverOwned = result.ownedCourses || [];
      setOwned(new Set(serverOwned));
      setAccess((current) => ({ ...(current || {}), ownedCourses: serverOwned, balance: result.balance }));
      localStorage.setItem(OWNED_KEY, JSON.stringify(serverOwned));
      setWalletBalance(result.balance);
      onBioUpdate?.({ joyBalance: result.balance, hugoSOCourses: serverOwned });
      setPurchaseTarget(null);
      showToast?.(
        purchaseTarget === "bundle"
          ? "Đã mở trọn bộ Năng suất số và AI. Bắt đầu học thôi!"
          : "Khóa học đã được mở trọn đời.",
        "success",
      );
    } catch (error) {
      showToast?.(error.message, "error");
    } finally {
      setBuying(false);
    }
  };

  const renderCourseCards = () => (
    <section className="hso-class-list">
      {courses.map((course, index) => {
        const progress = getCourseProgress(course, completed);
        const courseOwned = isOwned(course.id);
        return (
          <article
            key={course.id}
            className="hso-class-card"
            style={{ "--course": course.color, "--course-soft": course.soft, "--card-index": index }}
          >
            <button type="button" className="hso-class-card__main" onClick={() => openCourse(course.id)}>
              <span className="hso-class-card__icon"><span className="material-symbols-outlined">{course.icon}</span></span>
              <span className="hso-class-card__copy">
                <small>{course.eyebrow}</small>
                <strong>{course.title}</strong>
                <span>{course.outcome}</span>
              </span>
              <span className="material-symbols-outlined hso-class-card__arrow">chevron_right</span>
            </button>
            <footer>
              <span>{course.steps.length} bài · {course.duration}</span>
              {progress.completed > 0 ? (
                <span className="hso-class-card__progress"><i><b style={{ width: `${progress.percent}%` }} /></i>{progress.percent}%</span>
              ) : courseOwned ? (
                <strong>Đã mở khóa</strong>
              ) : (
                <strong>{course.priceJoy} JOY</strong>
              )}
            </footer>
          </article>
        );
      })}
    </section>
  );

  const renderHome = () => {
    const allLessons = courses.flatMap((course) => course.steps.map((step, index) => ({ course, step, index })));
    const focusLesson = allLessons.find(({ course, step, index }) => (
      !completed.has(`hugoso-${step.id}`) && canOpenStep(course, step, index)
    )) || allLessons[0];
    const focusProgress = getCourseProgress(focusLesson.course, completed);
    const overallPercent = Math.round((completedCount / totalSteps) * 100);
    const learnerName = bio?.displayName || bio?.fullName || bio?.name || "Hugo Learner";
    const firstName = learnerName.trim().split(/\s+/).slice(-1)[0];

    return (
      <div className="hso-classroom">
        <header className="hso-classroom__welcome">
          <div>
            <span>STUDY WITH HUGO · NĂNG SUẤT SỐ VÀ AI</span>
            <h1>Xin chào, {firstName}!</h1>
            <p>Hôm nay mình cùng hoàn thành một kỹ năng thật nhé.</p>
          </div>
          <div className="hso-learner-badge" aria-label={`${overallPercent}% toàn bộ lộ trình`}>
            <ProgressRing percent={overallPercent} />
            <span><b>{completedCount}</b>/{totalSteps}<small>bài đạt</small></span>
          </div>
        </header>

        {homeTab === "today" && (
          <>
            <section className="hso-active-class">
              <div className="hso-active-class__copy">
                <span className="hso-active-class__eyebrow"><i /> BÀI TIẾP THEO · {focusLesson.step.duration}</span>
                <h2>{focusLesson.step.title}</h2>
                <p>{focusLesson.step.summary}</p>
                <div className="hso-active-class__progress">
                  <span><b>{focusLesson.course.shortTitle}</b><small>{focusProgress.completed}/{focusLesson.course.steps.length} bài hoàn thành</small></span>
                  <i><b style={{ width: `${focusProgress.percent}%` }} /></i>
                </div>
                <button type="button" onClick={() => openStep(focusLesson.course.id, focusLesson.step.id)}>
                  <span className="material-symbols-outlined">play_arrow</span>
                  {completedCount ? "Tiếp tục học" : "Bắt đầu bài miễn phí"}
                </button>
              </div>
              <div className="hso-active-class__phone" aria-hidden="true">
                <span className="hso-active-class__notch" />
                <div className="hso-phone-check"><span className="material-symbols-outlined">check</span></div>
                <small>ACTIVE CLASS</small>
                <strong>{focusLesson.course.shortTitle}</strong>
                {focusLesson.step.video.scenes.map((scene, index) => (
                  <i key={scene.id} className={index === 0 ? "is-active" : ""}>
                    <span>{index + 1}</span>{scene.heading}
                  </i>
                ))}
              </div>
            </section>

            <section className="hso-dashboard-section">
              <div className="hso-dashboard-heading">
                <div><span>OFFICE LAB</span><h2>Làm ngay trên công cụ thật</h2></div>
                <button type="button" onClick={() => setHomeTab("lab")}>Xem tất cả</button>
              </div>
              <div className="hso-tool-strip">
                {courses.map((course) => {
                  const tool = OFFICE_LAB[course.id];
                  return (
                    <a key={course.id} href={tool.href} target="_blank" rel="noreferrer" style={{ "--tool": tool.color, "--tool-soft": tool.soft }}>
                      <span className="material-symbols-outlined">{tool.icon}</span>
                      <b>{tool.label}</b>
                      <small>{tool.action}</small>
                      <i className="material-symbols-outlined">north_east</i>
                    </a>
                  );
                })}
              </div>
            </section>

            <section className="hso-dashboard-section">
              <div className="hso-dashboard-heading">
                <div><span>LỚP HỌC CỦA BẠN</span><h2>Học theo kết quả cần đạt</h2></div>
                <button type="button" onClick={() => setHomeTab("courses")}>Tất cả khóa học</button>
              </div>
              {renderCourseCards()}
            </section>
          </>
        )}

        {homeTab === "courses" && (
          <>
            <section className="hso-page-intro">
              <span>4 LỘ TRÌNH THỰC CHIẾN</span>
              <h2>Kỹ năng dùng được ngay,<br />không học chỉ để xem.</h2>
              <p>Mỗi khóa gồm video theo tình huống, bài làm trên công cụ thật và kiểm tra bắt buộc.</p>
            </section>
            {renderCourseCards()}
            {!courses.every((course) => isOwned(course.id)) && (
              <section className="hso-bundle hso-bundle--classroom">
                <div className="hso-bundle__seal"><span>4</span><small>CLASSES</small></div>
                <div>
                  <p className="hso-kicker">OFFICE READY BUNDLE</p>
                  <h2>Một lộ trình cho toàn bộ công việc</h2>
                  <p>Calendar → Docs → Sheets → Gemini, tiết kiệm {HUGOSO_BUNDLE.saving} JOY so với mua lẻ.</p>
                </div>
                <div className="hso-bundle__action">
                  <small><s>{HUGOSO_BUNDLE.regularJoy.toLocaleString("vi-VN")} JOY</s></small>
                  <strong>{HUGOSO_BUNDLE.priceJoy.toLocaleString("vi-VN")} JOY</strong>
                  <button type="button" onClick={() => setPurchaseTarget("bundle")}>Mở trọn bộ</button>
                </div>
              </section>
            )}
          </>
        )}

        {homeTab === "lab" && (
          <>
            <section className="hso-page-intro">
              <span>OFFICE LAB</span>
              <h2>Từ bài học sang sản phẩm thật.</h2>
              <p>Mở ứng dụng Google trong tab mới, làm theo checklist rồi quay lại Study with Hugo để nộp kết quả.</p>
            </section>
            <section className="hso-lab-grid">
              {courses.map((course) => {
                const tool = OFFICE_LAB[course.id];
                return (
                  <article key={course.id} style={{ "--tool": tool.color, "--tool-soft": tool.soft }}>
                    <header>
                      <span className="material-symbols-outlined">{tool.icon}</span>
                      <i>LIVE TOOL</i>
                    </header>
                    <small>{tool.label.toLocaleUpperCase("vi-VN")} WORKSPACE</small>
                    <h3>{tool.template}</h3>
                    <p>{course.outcome}</p>
                    <ol>
                      <li><span>1</span>Mở không gian làm việc mới</li>
                      <li><span>2</span>Áp dụng checklist trong bài học</li>
                      <li><span>3</span>Quay lại nộp phần mô tả kết quả</li>
                    </ol>
                    <a href={tool.href} target="_blank" rel="noreferrer">
                      {tool.action}<span className="material-symbols-outlined">north_east</span>
                    </a>
                  </article>
                );
              })}
            </section>
          </>
        )}

        {homeTab === "progress" && (
          <>
            <section className="hso-progress-hero">
              <ProgressRing percent={overallPercent} />
              <div>
                <span>HỒ SƠ KỸ NĂNG</span>
                <h2>{overallPercent ? `Bạn đã hoàn thành ${overallPercent}%` : "Hành trình bắt đầu từ một bài thực hành"}</h2>
                <p>{completedCount}/{totalSteps} bài đã đạt · Tiến độ được đồng bộ theo tài khoản.</p>
              </div>
            </section>
            <section className="hso-progress-list">
              {courses.map((course) => {
                const progress = getCourseProgress(course, completed);
                return (
                  <button type="button" key={course.id} onClick={() => openCourse(course.id)} style={{ "--course": course.color, "--course-soft": course.soft }}>
                    <ProductMark course={course} />
                    <span><small>{course.shortTitle}</small><strong>{progress.completed}/{course.steps.length} bài đạt</strong><i><b style={{ width: `${progress.percent}%` }} /></i></span>
                    <em>{progress.percent}%</em>
                  </button>
                );
              })}
            </section>
            <p className="hso-verified-note"><span className="material-symbols-outlined">verified</span>Nội dung đã đối chiếu tài liệu chính thức Google ngày {VERIFIED_AT}.</p>
            {/* Bắt buộc giữ: khoá học có thu phí và nhắc tên sản phẩm của Google.
                Nêu tên để hướng dẫn sử dụng là hợp lệ, nhưng phải nói rõ không
                có quan hệ liên kết, nếu không sẽ bị hiểu là được Google bảo trợ. */}
            <p className="hso-verified-note">
              <span className="material-symbols-outlined">info</span>
              Google, Google Calendar, Docs, Sheets và Gemini là nhãn hiệu của Google LLC.
              Study with Hugo là hệ thống học độc lập, không liên kết với và không được Google bảo trợ hay chứng thực.
            </p>
          </>
        )}

        <nav className="hso-classroom-nav" aria-label="Điều hướng Study with Hugo">
          {[
            ["today", "home", "Hôm nay"],
            ["courses", "school", "Khóa học"],
            ["lab", "construction", "Thực hành"],
            ["progress", "donut_large", "Tiến độ"],
          ].map(([id, icon, label]) => (
            <button type="button" key={id} className={homeTab === id ? "is-active" : ""} onClick={() => setHomeTab(id)}>
              <span className="material-symbols-outlined">{icon}</span>
              <small>{label}</small>
            </button>
          ))}
        </nav>
      </div>
    );
  };

  const renderCourse = () => {
    const course = selectedCourse;
    const progress = getCourseProgress(course, completed);
    const courseOwned = isOwned(course.id);
    return (
      <>
        <section className="hso-course-hero" style={{ "--course": course.color, "--course-soft": course.soft }}>
          <button type="button" className="hso-inline-back" onClick={unifiedHome ? onBack : () => setView({ name: "home" })}>
            <span className="material-symbols-outlined">arrow_back</span> Tất cả khóa học
          </button>
          <div className="hso-course-hero__body">
            <ProductMark course={course} size="hero" />
            <div>
              <p className="hso-kicker">{course.eyebrow}</p>
              <h1>{course.title}</h1>
              <p>{course.outcome}</p>
              <div className="hso-course-hero__tags">
                <span>{course.level}</span><span>{course.duration}</span><span>{course.steps.length} bài đánh giá</span>
              </div>
            </div>
            <ProgressRing percent={progress.percent} />
          </div>
          {!courseOwned && (
            <div className="hso-course-hero__offer">
              <span>Bài đầu tiên miễn phí</span>
              <button type="button" onClick={() => setPurchaseTarget(course.id)}>
                Mở khóa trọn đời · {course.priceJoy} JOY
              </button>
            </div>
          )}
        </section>

        <section className="hso-course-value-grid">
          <article>
            <span className="material-symbols-outlined">flag</span>
            <small>SẢN PHẨM CUỐI KHÓA</small>
            <strong>{course.outcome}</strong>
          </article>
          <article>
            <span className="material-symbols-outlined">touch_app</span>
            <small>PHƯƠNG PHÁP</small>
            <strong>Xem demo · Làm trên công cụ thật · Nộp skill check</strong>
          </article>
          <article>
            <span className="material-symbols-outlined">verified</span>
            <small>NỘI DUNG</small>
            <strong>Đối chiếu hướng dẫn chính thức Google ngày {VERIFIED_AT}</strong>
          </article>
          <article>
            <span className="material-symbols-outlined">fact_check</span>
            <small>KIỂM ĐỊNH ĐỒNG BỘ</small>
            <strong>{HUGOSO_CONTENT_AUDIT.passed}/{HUGOSO_CONTENT_AUDIT.total} bài khớp video, nội dung, thực hành và đánh giá</strong>
          </article>
        </section>

        <section className="hso-syllabus">
          <div className="hso-section-heading">
            <div><p className="hso-kicker">STEP BY STEP</p><h2>Giáo trình và bài thực hành</h2></div>
            <a href={course.sourceUrl} target="_blank" rel="noreferrer">
              <span className="material-symbols-outlined">verified</span>
              Nguồn chính thức Google
            </a>
          </div>
          <div className="hso-step-list">
            {course.steps.map((step, index) => {
              const done = completed.has(`hugoso-${step.id}`);
              const open = canOpenStep(course, step, index);
              return (
                <button
                  type="button"
                  key={step.id}
                  className={`hso-step-row ${done ? "is-done" : ""}`}
                  disabled={!open}
                  onClick={() => openStep(course.id, step.id)}
                >
                  <span className="hso-step-row__number">
                    {done
                      ? <span className="material-symbols-outlined">check</span>
                      : String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="hso-step-row__copy">
                    <small>{step.stage.toLocaleUpperCase("vi-VN")} · BƯỚC {index + 1} {step.free ? "· HỌC THỬ" : ""}</small>
                    <strong>{step.title}</strong>
                    <span>{step.summary}</span>
                  </span>
                  <span className="hso-step-row__end">
                    <small>{step.duration}</small>
                    <span className="material-symbols-outlined">{open ? "arrow_forward" : "lock"}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </>
    );
  };

  const renderLesson = () => {
    const course = selectedCourse;
    const lesson = selectedStep;
    const index = course.steps.findIndex((step) => step.id === lesson.id);
    const done = completed.has(`hugoso-${lesson.id}`);
    const nextStep = course.steps[index + 1];
    const practiceEvidence = getPracticeEvidence(lesson, practiceText);
    const matchedEvidence = practiceEvidence.filter((item) => item.matched).length;
    return (
      <div className="hso-lesson">
        <nav className="hso-lesson__nav">
          <button type="button" onClick={() => openCourse(course.id)}>
            <span className="material-symbols-outlined">arrow_back</span>
            Giáo trình
          </button>
          <span>Bước {index + 1}/{course.steps.length}</span>
          <strong style={{ color: course.color }}>{course.shortTitle}</strong>
        </nav>

        <header className="hso-lesson__header">
          <p className="hso-kicker">{lesson.stage.toLocaleUpperCase("vi-VN")} · BƯỚC {String(index + 1).padStart(2, "0")} · {lesson.duration}</p>
          <h1>{lesson.title}</h1>
          <p>{lesson.summary}</p>
        </header>

        <section className="hso-lesson-contract" style={{ "--course": course.color, "--course-soft": course.soft }}>
          <div className="hso-lesson-contract__mission">
            <span className="material-symbols-outlined">flag</span>
            <div><small>NHIỆM VỤ BÀI HỌC</small><strong>{lesson.mission}</strong></div>
          </div>
          <div className="hso-lesson-contract__flow" aria-label="Bốn phần đồng bộ của bài học">
            {[
              ["01", "smart_display", "Xem", `${lesson.video.scenes.length} thao tác`],
              ["02", "menu_book", "Hiểu", `${lesson.guide.length} bước chi tiết`],
              ["03", "touch_app", "Làm", "Một sản phẩm thật"],
              ["04", "quiz", "Kiểm tra", "Một câu hỏi liên kết"],
            ].map(([number, icon, title, detail]) => (
              <article key={number}>
                <span>{number}</span>
                <i className="material-symbols-outlined">{icon}</i>
                <div><strong>{title}</strong><small>{detail}</small></div>
              </article>
            ))}
          </div>
          <p><span className="material-symbols-outlined">inventory_2</span><strong>Sản phẩm cần nộp:</strong> {lesson.deliverable}</p>
        </section>

        <section className="hso-lesson-workbench" style={{ "--course": course.color, "--course-soft": course.soft }}>
          <div>
            <span className="material-symbols-outlined">{OFFICE_LAB[course.id].icon}</span>
            <p><small>CHUẨN BỊ THỰC HÀNH</small><strong>Mở {course.shortTitle} cạnh bài học này</strong></p>
          </div>
          <a href={OFFICE_LAB[course.id].href} target="_blank" rel="noreferrer">
            {OFFICE_LAB[course.id].action}
            <span className="material-symbols-outlined">north_east</span>
          </a>
        </section>

        <LessonStudio lesson={lesson} course={course} />

        <section className="hso-guide" style={{ "--course": course.color, "--course-soft": course.soft }}>
          <header>
            <span className="material-symbols-outlined">format_list_numbered</span>
            <div>
              <p className="hso-kicker">HƯỚNG DẪN CHI TIẾT</p>
              <h2>Làm lần lượt, không bỏ bước</h2>
            </div>
            <a href={lesson.sourceUrl} target="_blank" rel="noreferrer">
              Nguồn Google
              <span className="material-symbols-outlined">north_east</span>
            </a>
          </header>
          <aside>
            <span className="material-symbols-outlined">info</span>
            <p><strong>Khả dụng tính năng</strong>{lesson.availability}</p>
          </aside>
          <div className="hso-guide__steps">
            {lesson.guide.map((guideStep, guideIndex) => (
              <article key={guideStep.heading}>
                <span>{String(guideIndex + 1).padStart(2, "0")}</span>
                <div>
                  <div className="hso-guide__links"><i>VIDEO {guideIndex + 1}</i><i>CHECKLIST {guideIndex + 1}</i></div>
                  <h3>{guideStep.heading}</h3>
                  <p>{guideStep.detail}</p>
                  <small><span className="material-symbols-outlined">task_alt</span>{guideStep.checkpoint}</small>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="hso-learning-block">
          <div className="hso-learning-block__title">
            <span className="material-symbols-outlined">menu_book</span>
            <div><p className="hso-kicker">NỘI DUNG TRỌNG TÂM</p><h2>Sau bước này bạn làm được gì?</h2></div>
          </div>
          <ol>
            {lesson.learn.map((item, itemIndex) => (
              <li key={item}>
                <span>{String(itemIndex + 1).padStart(2, "0")}</span><p>{item}</p>
              </li>
            ))}
          </ol>
          <aside><span className="material-symbols-outlined">lightbulb</span><div><strong>GỢI Ý HỌC TẬP</strong><p>{lesson.tip}</p></div></aside>
        </section>

        <section className="hso-assessment" style={{ "--course": course.color }}>
          <header>
            <span className="material-symbols-outlined">verified_user</span>
            <div><p className="hso-kicker">SKILL CHECK</p><h2>Làm trước, kiểm tra sau</h2><p>Thực hiện đúng sản phẩm của bài rồi trả lời câu hỏi lấy từ chính hướng dẫn trên.</p></div>
          </header>

          <div className="hso-check-part hso-check-part--quiz">
            <span className="hso-check-part__label">02 · TRẮC NGHIỆM LIÊN KẾT</span>
            <p className="hso-quiz-source"><span className="material-symbols-outlined">link</span>Kiểm tra kiến thức ở bước {lesson.quiz.guideIndex + 1}: <strong>{lesson.quiz.guideHeading}</strong></p>
            <h3>{lesson.quiz.question}</h3>
            <div className="hso-options">
              {lesson.quiz.options.map((option, optionIndex) => (
                <button
                  type="button"
                  key={option}
                  className={quizAnswer === optionIndex ? "is-selected" : ""}
                  onClick={() => setQuizAnswer(optionIndex)}
                >
                  <span>{String.fromCharCode(65 + optionIndex)}</span>{option}
                </button>
              ))}
            </div>
            {quizAnswer != null && (
              <p className={`hso-quiz-feedback ${quizAnswer === lesson.quiz.correct ? "is-correct" : "is-wrong"}`}>
                <span className="material-symbols-outlined">
                  {quizAnswer === lesson.quiz.correct ? "check_circle" : "cancel"}
                </span>
                {quizAnswer === lesson.quiz.correct ? "Chính xác. " : "Chưa chính xác. "}
                {lesson.quiz.explanation}
              </p>
            )}
          </div>

          <div className="hso-check-part hso-check-part--practice">
            <span className="hso-check-part__label">01 · THỰC HÀNH BẮT BUỘC</span>
            <h3>{lesson.practice.prompt}</h3>
            <div className="hso-practice-how">
              <div>
                <span>1</span>
                <p><strong>Mở {course.shortTitle}</strong>Làm trực tiếp trên ứng dụng Google.</p>
              </div>
              <div>
                <span>2</span>
                <p><strong>Làm đủ checklist</strong>Hoàn thành đúng {lesson.practice.checklist.length} thao tác đã xem và đọc.</p>
              </div>
              <div>
                <span>3</span>
                <p><strong>Ghi kết quả</strong>Điền vào ô trả lời theo mẫu, rồi xác nhận.</p>
              </div>
            </div>
            <a className="hso-practice-open" href={OFFICE_LAB[course.id].href} target="_blank" rel="noreferrer">
              <span className="material-symbols-outlined">{OFFICE_LAB[course.id].icon}</span>
              Mở {course.shortTitle} để thực hành
              <span className="material-symbols-outlined">north_east</span>
            </a>
            <p className="hso-practice-caption">Checklist thao tác — khớp từng chương video và bước hướng dẫn</p>
            <ul className="hso-practice-criteria">
              {lesson.practice.checklist.map((criterion, criterionIndex) => (
                <li key={criterion.id}>
                  <span>{criterionIndex + 1}</span>
                  <p><strong>{criterion.heading}</strong><small>Video {criterionIndex + 1} · Hướng dẫn {criterion.guideIndex + 1}</small></p>
                </li>
              ))}
            </ul>
            <aside className="hso-practice-example">
              <div><strong>Khung tham khảo — không phải đáp án để sao chép</strong><p>{lesson.practice.placeholder}</p></div>
            </aside>
            <textarea
              value={practiceText}
              onChange={(event) => {
                setPracticeText(event.target.value);
                setSubmissionError("");
              }}
              placeholder="Ghi kết quả bạn vừa thực hiện tại đây…"
              rows={5}
            />
            <div className="hso-evidence">
              <p>
                <span>{matchedEvidence}/{lesson.practice.minimumKeywords}</span>
                ý tối thiểu đã được nhận diện
              </p>
              <div>
                {practiceEvidence.map((item) => (
                  <span key={item.keyword} className={item.matched ? "is-matched" : ""}>
                    <span className="material-symbols-outlined">{item.matched ? "check" : "add"}</span>
                    {item.label}
                  </span>
                ))}
              </div>
            </div>
            <button
              type="button"
              role="checkbox"
              aria-checked={didPractice}
              className={`hso-practice-check ${didPractice ? "is-checked" : ""}`}
              onClick={() => {
                setDidPractice((checked) => !checked);
                setSubmissionError("");
              }}
            >
              <span className="material-symbols-outlined">check</span>
              Tôi xác nhận đã trực tiếp thực hiện thao tác trên {course.shortTitle}.
            </button>
          </div>

          <footer>
            <div><span className="material-symbols-outlined">shield</span><p>Bài làm được đánh giá ngay trên thiết bị. Không tải nội dung thực hành lên dịch vụ AI.</p></div>
            {submissionError && (
              <p className="hso-submit-error" role="alert">
                <span className="material-symbols-outlined">error</span>
                {submissionError}
              </p>
            )}
            <button type="button" onClick={markCompleted} disabled={done}>
              {done ? "Đã hoàn thành" : "Nộp và mở bước tiếp"}
              <span className="material-symbols-outlined">{done ? "verified" : "arrow_forward"}</span>
            </button>
          </footer>
        </section>

        {done && nextStep && canOpenStep(course, nextStep, index + 1) && (
          <button type="button" className="hso-next-lesson" onClick={() => openStep(course.id, nextStep.id)}>
            <span><small>TIẾP THEO</small><strong>{nextStep.title}</strong></span>
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="hso-app">
      <header className="hso-topbar">
        <BackButton iconOnly onClick={view.name === "lesson"
          ? () => openCourse(view.courseId)
          : unifiedHome || view.name === "home"
            ? onBack
            : () => setView({ name: "home", courseId: null, stepId: null })
        } />
        <button type="button" className="hso-wordmark" onClick={unifiedHome ? onBack : () => setView({ name: "home", courseId: null, stepId: null })}>
          <span>H</span><strong>Study with Hugo</strong><small>Năng suất số &amp; AI</small>
        </button>
        <div className="hso-wallet">
          <span className="material-symbols-outlined">toll</span>
          <strong>{balance.toLocaleString("vi-VN")}</strong>
          <small>JOY</small>
        </div>
      </header>

      <main className="hso-main">
        {!unifiedHome && loading && view.name === "home" ? (
          <div className="hso-loading" aria-label="Đang tải khóa học">
            <span /><span /><span />
          </div>
        ) : (
          <>
            {!unifiedHome && view.name === "home" && renderHome()}
            {view.name === "course" && selectedCourse && renderCourse()}
            {view.name === "lesson" && selectedCourse && selectedStep && renderLesson()}
          </>
        )}
      </main>

      <PurchaseSheet
        target={purchaseTarget}
        access={access}
        onClose={() => setPurchaseTarget(null)}
        onConfirm={buyCourse}
        buying={buying}
      />
    </div>
  );
}
