import { lazy, Suspense, useMemo, useState } from "react";
import RegionNote from "../../public/RegionNote";
import { useTranslation } from "react-i18next";
import { languageCode } from "../../../i18n/languages";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  Search,
} from "lucide-react";
import { HUGOSO_COURSES } from "../hugoSO/hugoSOCourses";
import {
  COURSE_MAP_ROUTE,
  STUDY_COLLECTIONS,
  STUDY_COPY,
  localize,
  resolveStudyRoute,
} from "./studyCurriculum";
import { useCoderLessons } from "../../../hooks/useCoderLessons";
import "./study-with-hugo.css";

const WebLearningApp = lazy(() => import("../hugoCoder/HugoCoderHub"));

/**
 * Các bảng ở trang chủ Study — KHAI BÁO MỘT CHỖ.
 *
 * Trước đây thêm một bảng phải sửa ba nơi rời nhau: mảng nút bấm, một nhánh
 * `filter === "..." && <Panel/>`, và một dòng import lười. Giờ một mục ở đây là
 * đủ; `pick` nói bảng cần gì từ dữ liệu chung, nên vỏ app không phải biết bên
 * trong bảng có gì.
 *
 * Mục không có `Panel` là lưới khoá học (mặc định) — không nạp lười, không cần
 * dữ liệu gì thêm.
 */
const HOME_PANELS = Object.freeze([
  { id: "all", labelKey: "all" },
  {
    id: "resources",
    labelKey: "tabResources",
    Panel: lazy(() => import("../hugoCoder/HugoCoderHub").then((m) => ({ default: m.ResourceGrid }))),
    pick: ({ stages }) => ({ stages }),
  },
  {
    id: "quality",
    labelKey: "tabQuality",
    Panel: lazy(() => import("../hugoCoder/HugoCoderHub").then((m) => ({ default: m.HugoStudioQuality }))),
    pick: ({ courses, stages }) => ({ courses, stages }),
  },
  {
    id: "progress",
    labelKey: "tabProgress",
    Panel: lazy(() => import("../hugoCoder/HugoCoderHub").then((m) => ({ default: m.ManageTab }))),
    pick: ({ bio, onBioUpdate, courses, stages }) => ({ bio, onBioUpdate, courses, stages }),
  },
]);

/**
 * Ba chỉ số của NGƯỜI HỌC (không phải của tủ sách).
 *
 * `tone` là tên sắc trong study-with-hugo.css, dùng chung bảng màu với các phần
 * học — thêm chỉ số mới chỉ cần một dòng ở đây, không phải viết luật CSS riêng.
 */
const LEARNER_STATS = Object.freeze([
  { id: "done", tone: "green", labelKey: "done", value: (s) => s.completed },
  { id: "active", tone: "blue", labelKey: "learning", value: (s) => s.inProgress },
  { id: "left", tone: "indigo", labelKey: "remaining", value: (s) => s.total - s.completed },
]);

const OFFICE_PROGRESS_KEY = "hugoso_completed_steps_v1";

function readOfficeProgress() {
  try {
    const value = JSON.parse(localStorage.getItem(OFFICE_PROGRESS_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function percentage(completed, total) {
  return total ? Math.round((completed / total) * 100) : 0;
}

function format(template, values) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replace(`{{${key}}}`, String(value)),
    template,
  );
}

/** Số bài đã xong của một phần — hai loại bộ lộ trình đếm theo hai nguồn khác nhau. */
function countPartProgress(part, kind, coderDone, officeDone) {
  if (kind === "coder") {
    return Array.from({ length: part.lessonCount }, (_, index) => `lesson${part.from + index}`)
      .filter((id) => coderDone.has(id)).length;
  }
  return HUGOSO_COURSES[part.id].steps.filter((step) => officeDone.has(`hugoso-${step.id}`)).length;
}

/**
 * Chuyển đổi MỘT học phần office thành định dạng `{ courses, stages }` mà
 * CourseMap và HugoCoderHub kỳ vọng. Mỗi học phần = 1 "chặng" trên bản đồ.
 *
 * Bài cuối cùng được đánh dấu là bài kiểm tra (`practiceType: "quiz"`):
 * gộp toàn bộ câu hỏi quiz từ các bài trước thành đề thi, đạt >=60% là cấp
 * chứng nhận.
 */
function adaptOfficePartToCoderFormat(part, locale) {
  const officeCourse = HUGOSO_COURSES[part.id];
  if (!officeCourse) return null;

  // Thu thập toàn bộ câu hỏi quiz từ tất cả bài thành quizPool cho đề thi cuối.
  const quizPool = officeCourse.steps.flatMap((step) => {
    if (!step.quiz) return [];
    return [{
      q: step.quiz.question,
      o: step.quiz.options,
      a: step.quiz.correct,
    }];
  });

  const courses = officeCourse.steps.map((step, index) => {
    const isLast = index === officeCourse.steps.length - 1;
    return {
      id: step.id,
      title: step.title,
      duration: step.duration,
      summary: step.summary,
      overview: { description: step.summary, outcomes: [] },
      // Dữ liệu thô để LessonPlayer dùng buildOfficeSteps thay vì buildSteps.
      _officeLesson: step,
      // Bài cuối = bài kiểm tra tổng hợp.
      ...(isLast ? {
        practiceType: "quiz",
        quizPool,
        quizSize: quizPool.length,
      } : {}),
    };
  });

  const stages = [{
    id: part.id,
    tone: part.tone,
    phaseNumber: 1,
    title: localize(part.title, locale),
    rangeText: `1 - ${courses.length}`,
    from: 0,
    to: courses.length,
  }];

  return { courses, stages };
}

// ── Mảnh giao diện dùng lại ────────────────────────────────────────────────

function AppLoading({ copy }) {
  return (
    <div className="study-app-loading" aria-label={copy.continue}>
      <span />
      <p>{copy.continue}…</p>
    </div>
  );
}

function ProgressRing({ value }) {
  return (
    <span className="study-progress-ring" style={{ "--progress": `${value * 3.6}deg` }} aria-label={`${value}%`}>
      <b>{value}%</b>
    </span>
  );
}

/** Biểu tượng vuông bo góc, mang sắc của phần học nó đại diện. */
function ToneSymbol({ tone, icon }) {
  return (
    <span className={`study-part-symbol is-${tone}`}>
      <span className="material-symbols-outlined">{icon}</span>
    </span>
  );
}

function StudyTopBar({ copy, percent, onBack }) {
  return (
    <header className="study-topbar">
      <button type="button" className="study-back" onClick={onBack} aria-label={copy.back}>
        <ArrowLeft aria-hidden="true" />
      </button>
      <div className="study-nav-title">
        <strong>{copy.largeTitle}</strong>
      </div>
      <div className="study-nav-progress" aria-label={`${copy.progress}: ${percent}%`}>
        <b>{percent}%</b>
        <small>{copy.progress}</small>
      </div>
    </header>
  );
}

function StudyHero({ copy }) {
  return (
    <section className="study-intro" aria-labelledby="study-title">
      <div className="study-hero-copy">
        <span>{copy.appName}</span>
        <h1 id="study-title">{copy.heroTitle}</h1>
        <p>{copy.intro}</p>
        {/* Vỏ app đã dịch, nhưng bài học do tác giả viết bằng tiếng Việt.
            Nói thẳng ra trước khi người đọc mở bài rồi mới ngỡ ngàng. */}
        <RegionNote group="vietnameseContentOnly" scope="course" />
      </div>
    </section>
  );
}

function ResumeCard({ copy, part, locale, onOpen }) {
  return (
    <section className={`study-resume is-${part.tone}`} aria-label={copy.suggested}>
      <ToneSymbol tone={part.tone} icon={part.icon} />
      <div className="study-resume-copy">
        <small>{copy.suggested}</small>
        <h2>{localize(part.title, locale)}</h2>
        <p>{part.completed}/{part.lessonCount} {copy.completed} · {localize(part.duration, locale)}</p>
        <div className="study-resume-progress" aria-label={`${copy.progress}: ${part.progress}%`}>
          <span style={{ width: `${part.progress}%` }} />
          <b>{part.progress}%</b>
        </div>
      </div>
      <button type="button" onClick={onOpen}>
        {part.progress ? copy.continue : copy.start}<ArrowRight aria-hidden="true" />
      </button>
    </section>
  );
}

function LearnerStats({ copy, totals }) {
  return (
    <div className="study-stats">
      {LEARNER_STATS.map((stat) => (
        <span key={stat.id} className={`is-${stat.tone}`}>
          <b>{stat.value(totals)}</b>
          <small>{copy[stat.labelKey]}</small>
        </span>
      ))}
    </div>
  );
}

/**
 * Nhóm nút chọn bảng. KHÔNG phải tablist: các bảng bên dưới không có
 * `role="tabpanel"`, khai tab là hứa với trình đọc màn hình một thứ không tồn
 * tại. `aria-pressed` mô tả đúng cái đang xảy ra.
 */
function PanelSwitch({ copy, activeId, onSelect, hide = [] }) {
  return (
    <div className="study-filters" role="group" aria-label={copy.library}>
      {HOME_PANELS.filter((item) => !hide.includes(item.id)).map((panel) => (
        <button
          key={panel.id}
          type="button"
          aria-pressed={activeId === panel.id}
          className={activeId === panel.id ? "is-active" : ""}
          onClick={() => onSelect(panel.id)}
        >
          {copy[panel.labelKey]}
        </button>
      ))}
    </div>
  );
}

/**
 * Thẻ MỘT học phần độc lập.
 *
 * Chương trình Năng suất gồm bốn học phần mua riêng và học riêng, không có thứ
 * tự bắt buộc — gộp vào một thẻ thì trang chủ trông như chỉ có hai khoá học.
 * Thẻ này hiển thị mã học phần lấy từ tiêu đề ("CAL 101 · …") thành một nhãn
 * riêng, đúng lối trường lớp.
 */
function CourseCard({ copy, course, locale, onOpen, onSyllabus }) {
  const full = localize(course.title, locale);
  const [, code, name] = /^([A-Z]{2,4}\s?\d{3})\s·\s(.+)$/.exec(full) || [null, "", full];

  return (
    <article className={`study-collection study-course is-${course.tone}`}>
      <header className="study-collection-header">
        <span className="study-collection-icon">
          <span className="material-symbols-outlined">{course.icon}</span>
        </span>
        <div>
          {code && <span className="study-course-code">{code}</span>}
          <h3>{name}</h3>
          <p>{localize(course.summary, locale)}</p>
          <div className="study-collection-meta">
            <span>{format(copy.lessonCount, { count: course.lessonCount })}</span>
            <span>{localize(course.duration, locale)}</span>
          </div>
        </div>
        <ProgressRing value={course.progress} />
      </header>

      <footer className="study-collection-foot">
        <button type="button" className="study-collection-open" onClick={onOpen}>
          {course.progress ? copy.continue : copy.start}
          <ArrowRight aria-hidden="true" />
        </button>
        <button
          type="button"
          className="study-collection-help"
          onClick={onSyllabus}
          aria-label={`${copy.knowledge} — ${name}`}
        >
          ?
        </button>
      </footer>
    </article>
  );
}

function CollectionCard({ copy, collection, locale, onOpen, onSyllabus }) {
  return (
    <article className={`study-collection is-${collection.tone}`}>
      <header className="study-collection-header">
        <span className="study-collection-icon">
          <span className="material-symbols-outlined">{collection.icon}</span>
        </span>
        <div>
          <h3>{localize(collection.title, locale)}</h3>
          <p>{localize(collection.summary, locale)}</p>
          <div className="study-collection-meta">
            {/* Dấu chấm phân cách là ::before của mục sau, không phải thẻ riêng:
                mục nào xuống dòng thì mang theo dấu của nó, thay vì bỏ lại một
                dấu "·" lơ lửng cuối dòng trên. */}
            <span>{format(copy.partCount, { count: collection.parts.length })}</span>
            <span>{format(copy.lessonCount, { count: collection.total })}</span>
            <span>{localize(collection.duration, locale)}</span>
          </div>
        </div>
        <ProgressRing value={collection.progress} />
      </header>

      <footer className="study-collection-foot">
        <button type="button" className="study-collection-open" onClick={onOpen}>
          {collection.progress ? copy.continue : copy.start}
          <ArrowRight aria-hidden="true" />
        </button>
        <button
          type="button"
          className="study-collection-help"
          onClick={onSyllabus}
          aria-label={`${copy.knowledge} — ${localize(collection.title, locale)}`}
        >
          ?
        </button>
      </footer>
    </article>
  );
}

function SyllabusPart({ copy, part, index, locale }) {
  return (
    <section className={`study-syllabus-part is-${part.tone}`}>
      <h4>
        <ToneSymbol tone={part.tone} icon={part.icon} />
        <span>
          <small>
            {String(index + 1).padStart(2, "0")}
            {" · "}{format(copy.lessonCount, { count: part.lessonCount })}
            {" · "}{localize(part.duration, locale)}
          </small>
          <strong>{localize(part.title, locale)}</strong>
        </span>
        <b>{part.progress}%</b>
      </h4>
      <p>{localize(part.summary, locale)}</p>
      <ul>
        {localize(part.knowledge, locale).map((item) => (
          <li key={item}><Check aria-hidden="true" />{item}</li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Nội dung TOÀN KHOÁ — mở từ nút ? trên thẻ khoá. Đặt ở popup thay vì liệt kê
 * ra trang: sắp tới còn nhiều khoá, mỗi khoá sáu dòng thì trang danh sách thành
 * một mục lục không ai đọc.
 */
function SyllabusSheet({ copy, collection, locale, onClose, onOpen }) {
  return (
    <div
      className="study-syllabus-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={localize(collection.title, locale)}
      onClick={onClose}
    >
      <div className={`study-syllabus is-${collection.tone}`} onClick={(event) => event.stopPropagation()}>
        <header>
          <ToneSymbol tone={collection.tone} icon={collection.icon} />
          <div>
            <small>
              {format(copy.partCount, { count: collection.parts.length })}
              {" · "}
              {format(copy.lessonCount, { count: collection.total })}
            </small>
            <h3>{localize(collection.title, locale)}</h3>
          </div>
          <button type="button" onClick={onClose} aria-label={copy.back}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        <div className="study-syllabus-body">
          <p className="study-part-summary">{localize(collection.summary, locale)}</p>
          {collection.parts.map((part, partIndex) => (
            <SyllabusPart key={part.id} copy={copy} part={part} index={partIndex} locale={locale} />
          ))}
        </div>

        <footer>
          <span><Clock3 aria-hidden="true" />{copy.estimated}: {localize(collection.duration, locale)}</span>
          <button type="button" onClick={onOpen}>
            {copy.openPart}<ArrowRight aria-hidden="true" />
          </button>
        </footer>
      </div>
    </div>
  );
}

// ── Vỏ ứng dụng ────────────────────────────────────────────────────────────

export default function StudyWithHugoApp({
  bio,
  showToast,
  onBioUpdate,
  onBack,
  // Đoạn thứ ba của địa chỉ — xem STUDY ROUTE trong studyCurriculum.js.
  studyRoute = null,
  // Đoạn thứ tư: bài học trong khoá — xem STUDY ROUTE trong studyCurriculum.js.
  studySub = null,
  // > 0 trên trang công khai /study: học thật được `previewLessons` bài đầu rồi
  // mới phải đăng nhập và mua gói. Portal thành viên để 0, hành vi giữ nguyên.
  previewLessons = 0,
  // Nhúng trong vỏ Hugo Learning: vỏ đó đã có thanh thương hiệu và tab-bar
  // riêng, nên app không dựng thêm thanh đầu của mình — hai tầng tab chồng nhau
  // là thứ làm màn hình rối nhất.
  embedded = false,
  // GỐC của các khoá học, khi nó KHÁC địa chỉ đang đứng.
  //
  // Vỏ Hugo Learning treo thư viện ở /study/khoa-hoc, nhưng khoá học vẫn phải ở
  // /study/<khoá> vì địa chỉ chỉ có ba đoạn (xem STUDY ROUTE). Suy gốc từ
  // pathname như mặc định thì gốc thành "/study/khoa-hoc", "Bắt đầu" đi tới
  // /study/khoa-hoc/web — một địa chỉ không phải khoá nào cả, nên màn hình chỉ
  // vẽ lại chính thư viện: không khoá nào mở được.
  studyBasePath = null,
  // Nơi "thoát khoá" quay về — thư viện, không phải gốc dịch vụ.
  studyHomePath = null,
}) {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const locale = languageCode(i18n.resolvedLanguage || i18n.language) === "vi" ? "vi" : "en";
  const copy = STUDY_COPY[locale];

  // Màn đang mở SUY RA TỪ ĐỊA CHỈ, không giữ trong state — xem resolveStudyRoute.
  const { view, courseId, lessonId, basePath: routeBasePath } =
    resolveStudyRoute(useLocation().pathname, studyRoute, studySub);
  const basePath = studyBasePath || routeBasePath;

  const [panelId, setPanelId] = useState(HOME_PANELS[0].id);
  const [query, setQuery] = useState("");
  // Khoá đang xem nội dung trong popup; null là đang đóng.
  const [syllabusCollection, setSyllabusCollection] = useState(null);

  // Danh mục bài dùng chung cho các bảng ở trang chủ. Hook có bộ nhớ đệm nên mở
  // bảng nào cũng không gọi lại mạng.
  const { courses: coderCourses, stages: coderStages } = useCoderLessons(null);

  const completedIds = useMemo(() => new Set(bio?.completedLessons || []), [bio?.completedLessons]);
  const officeCompletedIds = useMemo(
    () => new Set([...completedIds, ...readOfficeProgress()]),
    [completedIds],
  );

  const collections = useMemo(() => STUDY_COLLECTIONS.map((collection) => {
    const parts = collection.parts.map((part) => {
      const completed = countPartProgress(part, collection.kind, completedIds, officeCompletedIds);
      return { ...part, kind: collection.kind, collectionId: collection.id, completed, progress: percentage(completed, part.lessonCount) };
    });
    const completed = parts.reduce((sum, part) => sum + part.completed, 0);
    const total = parts.reduce((sum, part) => sum + part.lessonCount, 0);
    return { ...collection, parts, completed, total, progress: percentage(completed, total) };
  }), [completedIds, officeCompletedIds]);

  const allParts = collections.flatMap((collection) => collection.parts);
  const totals = {
    completed: collections.reduce((sum, collection) => sum + collection.completed, 0),
    total: collections.reduce((sum, collection) => sum + collection.total, 0),
    inProgress: allParts.filter((part) => part.progress > 0 && part.progress < 100).length,
  };
  const continuePart = allParts.find((part) => part.progress > 0 && part.progress < 100)
    || allParts.find((part) => part.progress < 100)
    || allParts[0];

  const visibleCollections = useMemo(() => {
    const collator = locale === "en" ? "en-US" : "vi-VN";
    const normalizedQuery = query.trim().toLocaleLowerCase(collator);
    if (!normalizedQuery) return collections;
    return collections.map((collection) => ({
      ...collection,
      parts: collection.parts.filter((part) => [
        localize(collection.title, locale),
        localize(part.title, locale),
        localize(part.summary, locale),
        ...localize(part.knowledge, locale),
        ...localize(part.outcomes, locale),
      ].join(" ").toLocaleLowerCase(collator).includes(normalizedQuery)),
    })).filter((collection) => collection.parts.length > 0);
  }, [collections, locale, query]);

  // Mở BẢN ĐỒ khoá học, không nhảy thẳng vào một bài. Người học phải thấy mình
  // đang ở đâu trên con đường trước khi bước tiếp — nhảy thẳng vào bài là lý do
  // trước giờ không ai nhìn thấy bản đồ. Cả coder lẫn office đều mở CourseMap.
  // Địa chỉ mang đúng tên khoá, không phải lúc nào cũng "web": mở CAL 101 mà
  // thanh địa chỉ ghi /study/web thì chia sẻ hay tải lại đều ra khoá khác.
  const openPart = (part, collection) => {
    const kind = collection?.kind || (HUGOSO_COURSES[part.id] ? "office" : "coder");
    navigate(`${basePath}/${kind === "office" ? part.id : COURSE_MAP_ROUTE}`);
  };
  const backToStudy = () => navigate(studyHomePath || basePath);

  // Khoá đang xem lấy THẲNG từ địa chỉ — `resolveStudyRoute` đã xác định và đã
  // kiểm bài có thuộc khoá đó không. Không còn suy từ navigation state, vì state
  // mất khi tải lại trang và địa chỉ sẽ nói một đằng, màn hình hiện một nẻo.
  const officeCollection = STUDY_COLLECTIONS.find((item) => item.kind === "office");
  const isOfficeCourse = Boolean(courseId) && courseId !== COURSE_MAP_ROUTE;
  const viewedCollectionId = isOfficeCourse ? officeCollection?.id : "web-development";
  const viewedCourseId = isOfficeCourse ? courseId : null;
  const viewedCollection = collections.find((c) => c.id === viewedCollectionId) || collections[0];
  const isOfficeCollection = viewedCollection.kind === "office";

  // Office: chỉ chuyển học phần đang chọn sang định dạng CourseMap.
  const viewedPart = isOfficeCollection
    ? viewedCollection.parts.find((p) => p.id === viewedCourseId) || viewedCollection.parts[0]
    : null;
  const officeAdaptedData = useMemo(
    () => viewedPart ? adaptOfficePartToCoderFormat(viewedPart, locale) : null,
    [viewedPart, locale],
  );

  // CẢ HAI loại khoá đều render qua đây: học phần Năng suất đã được
  // `adaptOfficePartToCoderFormat` chuyển sang đúng định dạng bản đồ, nên chỉ
  // cần biết địa chỉ có trỏ vào một khoá hay không.
  if (view) {
    return (
      <Suspense fallback={<AppLoading copy={copy} />}>
        <WebLearningApp
          bio={bio}
          showToast={showToast}
          onBioUpdate={onBioUpdate}
          urlLessonId={lessonId}
          previewLessons={previewLessons}
          basePath={`${basePath}/${courseId || COURSE_MAP_ROUTE}`}
          onBack={backToStudy}
          externalCourses={officeAdaptedData?.courses}
          externalStages={officeAdaptedData?.stages}
        />
      </Suspense>
    );
  }

  const panel = HOME_PANELS.find((item) => item.id === panelId) || HOME_PANELS[0];
  const panelProps = panel.pick?.({
    bio,
    onBioUpdate,
    courses: coderCourses,
    stages: coderStages,
  });

  return (
    <div className="study-app" data-locale={locale}>
      {!embedded && (
        <StudyTopBar copy={copy} percent={percentage(totals.completed, totals.total)} onBack={onBack} />
      )}

      <main className="study-main">
        <StudyHero copy={copy} />
        <ResumeCard copy={copy} part={continuePart} locale={locale} onOpen={() => openPart(continuePart, collections.find((c) => c.id === continuePart.collectionId))} />
        <LearnerStats copy={copy} totals={totals} />

        <section className="study-library" aria-labelledby="study-library-title">
          <div className="study-library-heading">
            <h2 id="study-library-title">{copy.library}</h2>
            {/* Ô tìm kiếm chỉ lọc lưới khoá học; các bảng khác không dùng đến nó. */}
            {!panel.Panel && (
              <label className="study-search">
                <Search aria-hidden="true" />
                <span className="sr-only">{copy.search}</span>
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.search} />
              </label>
            )}
          </div>

          <PanelSwitch
            copy={copy}
            activeId={panel.id}
            onSelect={setPanelId}
            hide={embedded ? ["progress"] : []}
          />

          {/* Các bảng này nói về CẢ chương trình, không riêng khoá nào — nên
              chúng thuộc về trang chủ, không phải thanh tab bên trong một khoá. */}
          {panel.Panel ? (
            <Suspense fallback={<AppLoading copy={copy} />}>
              <panel.Panel {...panelProps} />
            </Suspense>
          ) : visibleCollections.length ? (
            <div className="study-collection-grid">
              {visibleCollections.flatMap((collection) => (
                // Chương trình gồm các học phần độc lập thì hiện từng thẻ; lộ
                // trình liền mạch thì vẫn là một thẻ duy nhất.
                collection.splitCourses
                  ? collection.parts.map((course) => (
                    <CourseCard
                      key={`${collection.id}-${course.id}`}
                      copy={copy}
                      course={course}
                      locale={locale}
                      onOpen={() => openPart(course, collection)}
                      onSyllabus={() => setSyllabusCollection({ ...collection, parts: [course] })}
                    />
                  ))
                  : [(
                    <CollectionCard
                      key={collection.id}
                      copy={copy}
                      collection={collection}
                      locale={locale}
                      onOpen={() => openPart(collection.parts[0], collection)}
                      onSyllabus={() => setSyllabusCollection(collection)}
                    />
                  )]
              ))}
            </div>
          ) : (
            <div className="study-empty"><Search aria-hidden="true" /><p>{copy.noResults}</p></div>
          )}
        </section>
      </main>

      {syllabusCollection && (
        <SyllabusSheet
          copy={copy}
          collection={syllabusCollection}
          locale={locale}
          onClose={() => setSyllabusCollection(null)}
          onOpen={() => {
            const target = syllabusCollection;
            setSyllabusCollection(null);
            openPart(target.parts[0], target);
          }}
        />
      )}
    </div>
  );
}
