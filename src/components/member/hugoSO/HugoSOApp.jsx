import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import BackButton from "../shared/BackButton";
import { useJoyStore } from "../../../stores/joyStore";
import {
  HUGOSO_BUNDLE,
  HUGOSO_COURSE_ORDER,
  HUGOSO_COURSES,
  getCourseProgress,
} from "./hugoSOCourses";
import "./hugo-so.css";
import "../study/study-course-ios17.css";
import { joyText, joyNumber, joyCode } from "../../../lib/joyDisplay";
import { academyOf } from "./courseAcademy";
import { buildOfficeSteps } from "./officeLessonSteps";
import LessonPlayer from "../hugoCoder/LessonPlayer";

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
  ai: {
    label: "Trợ lý AI",
    action: "Mở Gemini",
    href: "https://gemini.google.com/app",
    icon: "neurology",
    color: "#9a7cf2",
    soft: "#f2edff",
    template: "Bảng so ba trợ lý",
    // Học phần yêu cầu chạy cùng một nhiệm vụ trên cả ba, nên mở được cả ba.
    alsoOpen: [
      { label: "ChatGPT", href: "https://chatgpt.com/" },
      { label: "Claude", href: "https://claude.ai/" },
    ],
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

/**
 * Khối học thuật của một học phần: điều kiện tiên quyết, chuẩn đầu ra, cách
 * đánh giá và thư mục tham khảo.
 *
 * Trước đây trang khoá chỉ có một đường liên kết tới trang trợ giúp của Google.
 * Giáo trình do Hugo Studio biên soạn, nên phải nói được ba điều mà một học phần
 * thật nào cũng phải nói: học xong LÀM ĐƯỢC gì, CHẤM bằng cách nào, và luận điểm
 * dựa trên CÔNG TRÌNH nào. Trích dẫn ghi theo Harvard (Cite Them Right, ấn bản 12).
 */
function CourseAcademy({ course }) {
  const academy = academyOf(course.id);
  // Sắp bảng chữ cái tại chỗ hiển thị, không bắt file dữ liệu giữ thứ tự bằng
  // tay — thêm một tài liệu mới là nó tự vào đúng chỗ.
  const references = useMemo(
    () => [...(academy?.references || [])].sort((a, b) => a.citation.localeCompare(b.citation, "vi")),
    [academy],
  );
  if (!academy) return null;

  return (
    <section className="hso-academy">
      <div className="hso-academy-grid">
        <article className="hso-academy-block">
          <h3>Chuẩn đầu ra</h3>
          <p className="hso-academy-lead">Học xong học phần, người học có thể:</p>
          <ol className="hso-academy-outcomes">
            {academy.outcomes.map((item) => <li key={item}>{item}</li>)}
          </ol>
        </article>

        <details className="hso-academy-block">
          <summary><h3>Điều kiện và đánh giá</h3></summary>
          <dl className="hso-academy-facts">
            <dt>Tiên quyết</dt><dd>{academy.prerequisite}</dd>
            <dt>Hình thức đánh giá</dt><dd>{academy.assessment}</dd>
            <dt>Biên soạn</dt><dd>Hugo Learning (by Hugo Studio) — nội dung độc quyền, trích dẫn theo chuẩn Harvard.</dd>
          </dl>
        </details>
      </div>

      <details className="hso-academy-block hso-academy-refs">
        <summary>
          <h3>Tài liệu tham khảo</h3>
          <span>{references.length} công trình · chuẩn Harvard</span>
        </summary>
        <p className="hso-academy-lead">
          Xếp theo thứ tự bảng chữ cái tên tác giả. Mỗi mục kèm một dòng nói rõ nó chống đỡ luận điểm nào trong học phần.
        </p>
        <ol>
          {references.map((item) => (
            <li key={item.citation}>
              <span className="hso-ref-citation">{item.citation}</span>
              <span className="hso-ref-note">{item.note}</span>
            </li>
          ))}
        </ol>
      </details>
    </section>
  );
}

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




function PurchaseSheet({ target, access, onClose, onConfirm, buying }) {
  const { t } = useTranslation();
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
      <button type="button" className="hso-sheet__backdrop" onClick={onClose} aria-label={t("utilities.hugoso.dong")} />
      <div className="hso-sheet__panel">
        <span className="hso-sheet__handle" />
        <div className="hso-sheet__icon">
          <span className="material-symbols-outlined">{isBundle ? "workspace_premium" : course.icon}</span>
        </div>
        <p className="hso-kicker">{t("utilities.hugoso.quyenSoHuuTron")}</p>
        <h2 id="hso-purchase-title">{isBundle ? HUGOSO_BUNDLE.title : course.title}</h2>
        <p className="hso-sheet__copy">
          {isBundle
            ? t("utilities.hugoso.moToanBo4")
            : t("utilities.hugoso.moToanBoLo")}
        </p>
        <dl className="hso-invoice">
          <div><dt>{t("utilities.hugoso.giaKhoaHoc")}</dt><dd>{joyText(quote.priceJoy)}</dd></div>
          <div><dt>{t("utilities.hugoso.phiSangTao10")}</dt><dd>{joyText(quote.tax)}</dd></div>
          <div className="is-total"><dt>{t("utilities.hugoso.tongTraoDoi")}</dt><dd>{joyText(quote.total)}</dd></div>
        </dl>
        <button type="button" className="hso-primary-action" disabled={buying} onClick={onConfirm}>
          {buying ? t("utilities.hugoso.dangXacNhan") : `Mở khóa · ${joyText(quote.total)}`}
        </button>
        <button type="button" className="hso-quiet-action" onClick={onClose}>{t("utilities.hugoso.deSau")}</button>
        <p className="hso-sheet__note">{t("utilities.hugoso.khongTuGiaHan")}</p>
      </div>
    </div>
  );
}

export default function HugoSOApp({ bio, showToast, onBioUpdate, onBack, initialCourseId = null, unifiedHome = false }) {
  const { t } = useTranslation();
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

  // Bước của bài đang mở, dựng từ chính giáo trình — giáo trình không phải sửa.
  const officeSteps = useMemo(
    () => (selectedStep ? buildOfficeSteps(selectedStep) : null),
    [selectedStep],
  );
  const nextOfficeStep = selectedCourse && selectedStep
    ? selectedCourse.steps[selectedCourse.steps.findIndex((step) => step.id === selectedStep.id) + 1]
    : null;

  /**
   * Ghi nhận hoàn thành khi đi hết các bước trong trình học.
   *
   * Trình học đã tự chặn: câu hỏi phải trả lời đúng mới qua, bước nộp phải đủ từ
   * khoá mới mở nút. Nên tới được đây nghĩa là đã đạt — không kiểm lại lần nữa
   * bằng bộ chấm cũ, vì hai bộ luật khác nhau sẽ có ngày lệch nhau.
   */
  const completeStepFromPlayer = () => {
    if (!selectedStep) return;
    const lessonId = `hugoso-${selectedStep.id}`;
    const next = new Set(completed);
    next.add(lessonId);
    setCompleted(next);
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify([...next]));
    } catch {
      /* hết quota: tiến độ máy chủ vẫn đúng ở lần tải sau */
    }
    postJson(`/member/progress/lesson/${lessonId}/complete`, {}).catch(() => {});
  };

  const canOpenStep = (course, step, index) => {
    if (!step.free && !isOwned(course.id)) return false;
    if (index === 0) return true;
    return completed.has(`hugoso-${course.steps[index - 1].id}`);
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
              <span>{course.steps.length} {t("utilities.hugoso.bai")} {course.duration}</span>
              {progress.completed > 0 ? (
                <span className="hso-class-card__progress"><i><b style={{ width: `${progress.percent}%` }} /></i>{progress.percent}%</span>
              ) : courseOwned ? (
                <strong>{t("utilities.hugoso.daMoKhoa")}</strong>
              ) : (
                <strong>{joyText(course.priceJoy)}</strong>
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
            <span>{t("utilities.hugoso.studyWithHugoNang")}</span>
            <h1>{t("utilities.hugoso.xinChao")} {firstName}!</h1>
            <p>{t("utilities.hugoso.homNayMinhCung")}</p>
          </div>
          <div className="hso-learner-badge" aria-label={`${overallPercent}% toàn bộ lộ trình`}>
            <ProgressRing percent={overallPercent} />
            <span><b>{completedCount}</b>/{totalSteps}<small>{t("utilities.hugoso.baiDat")}</small></span>
          </div>
        </header>

        {homeTab === "today" && (
          <>
            <section className="hso-active-class">
              <div className="hso-active-class__copy">
                <span className="hso-active-class__eyebrow"><i /> {t("utilities.hugoso.baiTiepTheo")} {focusLesson.step.duration}</span>
                <h2>{focusLesson.step.title}</h2>
                <p>{focusLesson.step.summary}</p>
                <div className="hso-active-class__progress">
                  <span><b>{focusLesson.course.shortTitle}</b><small>{focusProgress.completed}/{focusLesson.course.steps.length} {t("utilities.hugoso.baiHoanThanh")}</small></span>
                  <i><b style={{ width: `${focusProgress.percent}%` }} /></i>
                </div>
                <button type="button" onClick={() => openStep(focusLesson.course.id, focusLesson.step.id)}>
                  <span className="material-symbols-outlined">play_arrow</span>
                  {completedCount ? t("utilities.hugoso.tiepTucHoc") : t("utilities.hugoso.batDauBaiMien")}
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
                <div><span>OFFICE LAB</span><h2>{t("utilities.hugoso.lamNgayTrenCong")}</h2></div>
                <button type="button" onClick={() => setHomeTab("lab")}>{t("utilities.hugoso.xemTatCa")}</button>
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
                <div><span>{t("utilities.hugoso.lopHocCuaBan")}</span><h2>{t("utilities.hugoso.hocTheoKetQua")}</h2></div>
                <button type="button" onClick={() => setHomeTab("courses")}>{t("utilities.hugoso.tatCaKhoaHoc")}</button>
              </div>
              {renderCourseCards()}
            </section>
          </>
        )}

        {homeTab === "courses" && (
          <>
            <section className="hso-page-intro">
              <span>{t("utilities.hugoso.4LoTrinhThuc")}</span>
              <h2>{t("utilities.hugoso.kyNangDungDuoc")}<br />{t("utilities.hugoso.khongHocChiDe")}</h2>
              <p>{t("utilities.hugoso.moiKhoaGomVideo")}</p>
            </section>
            {renderCourseCards()}
            {!courses.every((course) => isOwned(course.id)) && (
              <section className="hso-bundle hso-bundle--classroom">
                <div className="hso-bundle__seal"><span>4</span><small>CLASSES</small></div>
                <div>
                  <p className="hso-kicker">OFFICE READY BUNDLE</p>
                  <h2>{t("utilities.hugoso.motLoTrinhCho")}</h2>
                  <p>{t("utilities.hugoso.calendarDocsSheetsGemini")} {HUGOSO_BUNDLE.saving} {t("utilities.hugoso.joySoVoiMua")}</p>
                </div>
                <div className="hso-bundle__action">
                  <small><s>{joyText(HUGOSO_BUNDLE.regularJoy)}</s></small>
                  <strong>{joyText(HUGOSO_BUNDLE.priceJoy)}</strong>
                  <button type="button" onClick={() => setPurchaseTarget("bundle")}>{t("utilities.hugoso.moTronBo")}</button>
                </div>
              </section>
            )}
          </>
        )}

        {homeTab === "lab" && (
          <>
            <section className="hso-page-intro">
              <span>OFFICE LAB</span>
              <h2>{t("utilities.hugoso.tuBaiHocSang")}</h2>
              <p>{t("utilities.hugoso.moUngDungGoogle")}</p>
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
                      <li><span>1</span>{t("utilities.hugoso.moKhongGianLam")}</li>
                      <li><span>2</span>{t("utilities.hugoso.apDungChecklistTrong")}</li>
                      <li><span>3</span>{t("utilities.hugoso.quayLaiNopPhan")}</li>
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
                <span>{t("utilities.hugoso.hoSoKyNang")}</span>
                <h2>{overallPercent ? `Bạn đã hoàn thành ${overallPercent}%` : t("utilities.hugoso.hanhTrinhBatDau")}</h2>
                <p>{completedCount}/{totalSteps} {t("utilities.hugoso.baiDaDatTien")}</p>
              </div>
            </section>
            <section className="hso-progress-list">
              {courses.map((course) => {
                const progress = getCourseProgress(course, completed);
                return (
                  <button type="button" key={course.id} onClick={() => openCourse(course.id)} style={{ "--course": course.color, "--course-soft": course.soft }}>
                    <ProductMark course={course} />
                    <span><small>{course.shortTitle}</small><strong>{progress.completed}/{course.steps.length} {t("utilities.hugoso.baiDat")}</strong><i><b style={{ width: `${progress.percent}%` }} /></i></span>
                    <em>{progress.percent}%</em>
                  </button>
                );
              })}
            </section>
            <p className="hso-verified-note"><span className="material-symbols-outlined">verified</span>{t("utilities.hugoso.noiDungDaDoi")} {VERIFIED_AT}.</p>
            {/* Bắt buộc giữ: khoá học có thu phí và nhắc tên sản phẩm của Google.
                Nêu tên để hướng dẫn sử dụng là hợp lệ, nhưng phải nói rõ không
                có quan hệ liên kết, nếu không sẽ bị hiểu là được Google bảo trợ. */}
            <p className="hso-verified-note">
              <span className="material-symbols-outlined">info</span>
              {t("utilities.hugoso.googleGoogleCalendarDocs")}
            </p>
          </>
        )}

        <nav className="hso-classroom-nav" aria-label={t("utilities.hugoso.dieuHuongStudyWith")}>
          {[
            ["today", "home", t("utilities.hugoso.homNay")],
            ["courses", "school", t("utilities.hugoso.khoaHoc")],
            ["lab", "construction", t("utilities.hugoso.thucHanh")],
            ["progress", "donut_large", t("utilities.hugoso.tienDo")],
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
            <span className="material-symbols-outlined">arrow_back</span> {t("utilities.hugoso.tatCaKhoaHoc")}
          </button>
          {/* Giới thiệu học phần: mã · tên · một câu đầu ra · một dòng số liệu.
              Bốn thẻ cũ bên dưới đã bỏ — một thẻ chép nguyên câu đầu ra ở đây,
              một thẻ lặp lại mã học phần, hai thẻ còn lại quảng cáo "video" và
              "demo" không còn tồn tại sau khi chuyển sang trình học chung. */}
          <div className="hso-course-hero__body">
            {/* Icon nằm cùng hàng với mã và tên, không chiếm một dòng riêng —
                phần giới thiệu phải vừa màn chứ không bắt lướt mới thấy bài học. */}
            <ProductMark course={course} size="hero" />
            <p className="hso-course-code">{course.eyebrow}</p>
            <h1>{course.title}</h1>

            <p className="hso-course-outcome">{course.outcome}</p>

            {/* Số liệu gộp một dòng: giá trị đã tự nói nghĩa ("2 tín chỉ",
                "9 bài"), thêm nhãn chỉ tốn thêm một dòng mà không rõ hơn. */}
            <p className="hso-course-facts">
              <span>{course.level}</span>
              <span>{course.duration}</span>
              <span>{course.steps.length} bài</span>
            </p>

            {progress.percent > 0 && (
              <div className="hso-course-progress" role="img" aria-label={`Tiến độ ${progress.percent}%`}>
                <span><i style={{ width: `${progress.percent}%` }} /></span>
                <b>{progress.percent}%</b>
              </div>
            )}
          </div>
          {!courseOwned && (
            <div className="hso-course-hero__offer">
              <span>{t("utilities.hugoso.baiDauTienMien")}</span>
              <button type="button" onClick={() => setPurchaseTarget(course.id)}>
                {t("utilities.hugoso.moKhoaTronDoi")} {joyText(course.priceJoy)}
              </button>
            </div>
          )}
        </section>

        <CourseAcademy course={course} />

        <section className="hso-syllabus">
          <div className="hso-section-heading">
            <div><p className="hso-kicker">ĐỀ CƯƠNG</p><h2>{t("utilities.hugoso.giaoTrinhVaBai")}</h2></div>
            <a href={course.sourceUrl} target="_blank" rel="noreferrer">
              <span className="material-symbols-outlined">verified</span>
              {course.sourceLabel}
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
                    <small>{step.stage.toLocaleUpperCase("vi-VN")} {t("utilities.hugoso.buoc")} {index + 1} {step.free ? t("utilities.hugoso.hocThu") : ""}</small>
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


  const inLesson = view.name === "lesson" && selectedCourse && selectedStep;

  return (
    // Đang học thì ẩn vỏ ứng dụng: trình học chiếm trọn màn, mà thanh đầu app
    // (z-index 80) lại nằm trên nó (z-index 60) nên đè ngang mặt bài học.
    // Khoá Web cũng ẩn vỏ khi vào bài — giờ hai bên giống nhau.
    <div className={`hso-app${inLesson ? " is-lesson" : ""}`}>
      <header className="hso-topbar">
        <BackButton iconOnly onClick={view.name === "lesson"
          ? () => openCourse(view.courseId)
          : unifiedHome || view.name === "home"
            ? onBack
            : () => setView({ name: "home", courseId: null, stepId: null })
        } />
        <button type="button" className="hso-wordmark" onClick={unifiedHome ? onBack : () => setView({ name: "home", courseId: null, stepId: null })}>
          <span>H</span><strong>Study with Hugo</strong><small>{t("utilities.hugoso.nangSuatSoAi")}</small>
        </button>
        <div className="hso-wallet">
          <span className="material-symbols-outlined">toll</span>
          <strong>{joyNumber(balance)}</strong>
          <small>{joyCode()}</small>
        </div>
      </header>

      <main className="hso-main">
        {!unifiedHome && loading && view.name === "home" ? (
          <div className="hso-loading" aria-label={t("utilities.hugoso.dangTaiKhoaHoc")}>
            <span /><span /><span />
          </div>
        ) : (
          <>
            {!unifiedHome && view.name === "home" && renderHome()}
            {view.name === "course" && selectedCourse && renderCourse()}
          </>
        )}
      </main>

      {/* Trình học đứng NGOÀI <main>: nó chiếm trọn màn, còn <main> bị ẩn khi
          đang học để vỏ ứng dụng không đè lên. */}
      {inLesson && (
        <LessonPlayer
          course={{ id: selectedStep.id, title: selectedStep.title, file: selectedCourse.shortTitle }}
          steps={officeSteps}
          onExit={() => openCourse(selectedCourse.id)}
          onFinished={completeStepFromPlayer}
          onNextLesson={nextOfficeStep ? () => openStep(selectedCourse.id, nextOfficeStep.id) : undefined}
        />
      )}

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
