import { lazy, Suspense, useMemo, useState } from "react";
import RegionNote from "../../public/RegionNote";
import { useTranslation } from "react-i18next";
import { languageCode } from "../../../i18n/languages";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Clock3,
  Search,
  Sparkles,
} from "lucide-react";
import { HUGOSO_COURSES } from "../hugoSO/hugoSOCourses";
import { STUDY_COLLECTIONS, STUDY_COPY, localize } from "./studyCurriculum";
import "./study-with-hugo.css";

const WebLearningApp = lazy(() => import("../hugoCoder/HugoCoderHub"));
const ProductivityLearningApp = lazy(() => import("../hugoSO/HugoSOApp"));

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

export default function StudyWithHugoApp({
  bio,
  showToast,
  onBioUpdate,
  onBack,
  coderLessonId = null,
}) {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const locale = languageCode(i18n.resolvedLanguage || i18n.language) === "vi" ? "vi" : "en";
  const copy = STUDY_COPY[locale];
  const validLessonId = /^lesson(?:[1-9]|[1-9]\d|100)$/.test(coderLessonId || "") ? coderLessonId : null;

  const [activeExperience, setActiveExperience] = useState(() => (validLessonId ? "coder" : null));
  const [officeCourseId, setOfficeCourseId] = useState(null);
  const [coderStartLesson, setCoderStartLesson] = useState(() => validLessonId);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [expandedPart, setExpandedPart] = useState(null);

  const completedIds = useMemo(() => new Set(bio?.completedLessons || []), [bio?.completedLessons]);
  const officeCompletedIds = useMemo(
    () => new Set([...completedIds, ...readOfficeProgress()]),
    [completedIds],
  );

  const collections = useMemo(() => STUDY_COLLECTIONS.map((collection) => {
    const parts = collection.parts.map((part) => {
      const completed = collection.kind === "coder"
        ? Array.from({ length: part.lessonCount }, (_, index) => `lesson${part.from + index}`)
          .filter((lessonId) => completedIds.has(lessonId)).length
        : HUGOSO_COURSES[part.id].steps
          .filter((step) => officeCompletedIds.has(`hugoso-${step.id}`)).length;
      return { ...part, kind: collection.kind, completed, progress: percentage(completed, part.lessonCount) };
    });
    const completed = parts.reduce((sum, part) => sum + part.completed, 0);
    const total = parts.reduce((sum, part) => sum + part.lessonCount, 0);
    return { ...collection, parts, completed, total, progress: percentage(completed, total) };
  }), [completedIds, officeCompletedIds]);

  const totalCompleted = collections.reduce((sum, collection) => sum + collection.completed, 0);
  const totalLessons = collections.reduce((sum, collection) => sum + collection.total, 0);
  const overallPercent = percentage(totalCompleted, totalLessons);
  const allParts = collections.flatMap((collection) => collection.parts.map((part) => ({ ...part, collection })));
  const continuePart = allParts.find((part) => part.progress > 0 && part.progress < 100)
    || allParts.find((part) => part.progress < 100)
    || allParts[0];

  const visibleCollections = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase(locale === "en" ? "en-US" : "vi-VN");
    return collections.map((collection) => {
      const parts = collection.parts.filter((part) => {
        const matchesFilter = filter === "all"
          || filter === collection.kind
          || (filter === "progress" && part.progress > 0 && part.progress < 100);
        const searchText = [
          localize(collection.title, locale),
          localize(part.title, locale),
          localize(part.summary, locale),
          ...localize(part.knowledge, locale),
          ...localize(part.outcomes, locale),
        ].join(" ").toLocaleLowerCase(locale === "en" ? "en-US" : "vi-VN");
        return matchesFilter && (!normalizedQuery || searchText.includes(normalizedQuery));
      });
      return { ...collection, parts };
    }).filter((collection) => collection.parts.length > 0);
  }, [collections, filter, locale, query]);

  const openPart = (part) => {
    if (part.kind === "coder") {
      const nextLesson = Math.min(part.to, part.from + part.completed);
      const lessonId = `lesson${nextLesson}`;
      setCoderStartLesson(lessonId);
      setActiveExperience("coder");
      navigate(`/member/utilities/study/${lessonId}`);
      return;
    }
    setOfficeCourseId(part.id);
    setActiveExperience("office");
  };

  const backToStudy = () => {
    navigate("/member/utilities/study", { replace: true });
    setOfficeCourseId(null);
    setActiveExperience(null);
  };

  if (activeExperience === "coder") {
    return (
      <Suspense fallback={<AppLoading copy={copy} />}>
        <WebLearningApp
          bio={bio}
          showToast={showToast}
          onBioUpdate={onBioUpdate}
          urlLessonId={coderStartLesson}
          unifiedHome
          onBack={backToStudy}
        />
      </Suspense>
    );
  }

  if (activeExperience === "office") {
    return (
      <Suspense fallback={<AppLoading copy={copy} />}>
        <ProductivityLearningApp
          bio={bio}
          showToast={showToast}
          onBioUpdate={onBioUpdate}
          initialCourseId={officeCourseId}
          unifiedHome
          onBack={backToStudy}
        />
      </Suspense>
    );
  }

  return (
    <div className="study-app" data-locale={locale}>
      <header className="study-topbar">
        <button type="button" className="study-back" onClick={onBack} aria-label={copy.back}>
          <ArrowLeft aria-hidden="true" />
        </button>
        <div className="study-nav-title">
          <strong>{copy.largeTitle}</strong>
          <small>{copy.appName}</small>
        </div>
        <div className="study-nav-progress" aria-label={`${copy.progress}: ${overallPercent}%`}>
          <b>{overallPercent}%</b>
          <small>{copy.progress}</small>
        </div>
      </header>

      <main className="study-main">
        <section className="study-intro" aria-labelledby="study-title">
          <div className="study-hero-copy">
            <span>{copy.appName}</span>
            <h1 id="study-title">{copy.heroTitle}</h1>
            <p>{copy.intro}</p>
            {/* Vỏ app đã dịch, nhưng bài học do tác giả viết bằng tiếng Việt.
                Nói thẳng ra trước khi người đọc mở bài rồi mới ngỡ ngàng. */}
            <RegionNote group="vietnameseContentOnly" scope="course" />
          </div>
          <div className="study-hero-facts">
            <div className="study-original-seal"><Sparkles aria-hidden="true" /><span><b>{copy.original}</b><small>{copy.authored}</small></span></div>
            <div className="study-summary-stats">
              <span><b>2</b><small>{copy.collections}</small></span>
              <span><b>10</b><small>{copy.parts}</small></span>
              <span><b>{totalLessons}</b><small>{copy.lessons}</small></span>
            </div>
          </div>
        </section>

        <section className="study-resume" aria-label={copy.suggested}>
          <div className="study-resume-top">
            <span className={`study-part-symbol is-${continuePart.tone}`}><span className="material-symbols-outlined">{continuePart.icon}</span></span>
            <div className="study-resume-copy">
              <small>{copy.suggested}</small>
              <h2>{localize(continuePart.title, locale)}</h2>
              <p>{continuePart.completed}/{continuePart.lessonCount} {copy.completed} · {localize(continuePart.duration, locale)}</p>
            </div>
            <button type="button" onClick={() => openPart(continuePart)}>
              {continuePart.progress ? copy.continue : copy.start}<ArrowRight aria-hidden="true" />
            </button>
          </div>
          <div className="study-resume-progress" aria-label={`${copy.progress}: ${continuePart.progress}%`}>
            <span style={{ width: `${continuePart.progress}%` }} />
            <b>{continuePart.progress}%</b>
          </div>
          <button type="button" className="study-resume-mobile-action" onClick={() => openPart(continuePart)}>
            {continuePart.progress ? copy.continue : copy.start}<ArrowRight aria-hidden="true" />
          </button>
        </section>

        <section className="study-library" aria-labelledby="study-library-title">
          <div className="study-library-heading">
            <h2 id="study-library-title">{copy.library}</h2>
            <label className="study-search">
              <Search aria-hidden="true" />
              <span className="sr-only">{copy.search}</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.search} />
            </label>
          </div>

          <div className="study-filters" role="tablist" aria-label={copy.library}>
            {[
              ["all", copy.all],
              ["coder", copy.web],
              ["office", copy.digital],
              ["progress", copy.learning],
            ].map(([id, label]) => (
              <button key={id} type="button" role="tab" aria-selected={filter === id} className={filter === id ? "is-active" : ""} onClick={() => setFilter(id)}>{label}</button>
            ))}
          </div>

          {visibleCollections.length ? visibleCollections.map((collection) => (
            <article key={collection.id} className={`study-collection is-${collection.tone}`}>
              <header className="study-collection-header">
                <span className="study-collection-icon"><span className="material-symbols-outlined">{collection.icon}</span></span>
                <div>
                  <span className="study-original-chip"><Sparkles aria-hidden="true" />{copy.original}</span>
                  <h3>{localize(collection.title, locale)}</h3>
                  <p>{localize(collection.summary, locale)}</p>
                  <div className="study-collection-meta">
                    <span>{format(copy.partCount, { count: collection.parts.length })}</span>
                    <i />
                    <span>{format(copy.lessonCount, { count: collection.total })}</span>
                    <i />
                    <span>{localize(collection.duration, locale)}</span>
                  </div>
                </div>
                <ProgressRing value={collection.progress} />
              </header>

              <div className="study-part-list">
                {collection.parts.map((part, index) => {
                  const key = `${collection.id}:${part.id}`;
                  const expanded = expandedPart === key;
                  return (
                    <section key={part.id} className={`study-part ${expanded ? "is-expanded" : ""}`}>
                      <button type="button" className="study-part-row" onClick={() => setExpandedPart(expanded ? null : key)} aria-expanded={expanded}>
                        <span className={`study-part-symbol is-${part.tone}`}><span className="material-symbols-outlined">{part.icon}</span></span>
                        <span className="study-part-number">{String(index + 1).padStart(2, "0")}</span>
                        <span className="study-part-title">
                          <strong>{localize(part.title, locale)}</strong>
                          <small>{format(copy.lessonCount, { count: part.lessonCount })} · {localize(part.duration, locale)}</small>
                        </span>
                        <span className="study-part-percent">{part.progress}%</span>
                        <ChevronDown className="study-part-chevron" aria-hidden="true" />
                      </button>

                      {expanded && (
                        <div className="study-part-detail">
                          <p className="study-part-summary">{localize(part.summary, locale)}</p>
                          <div className="study-detail-grid">
                            <div>
                              <h4><span className="material-symbols-outlined">menu_book</span>{copy.knowledge}</h4>
                              <ul>{localize(part.knowledge, locale).map((item) => <li key={item}><Check aria-hidden="true" />{item}</li>)}</ul>
                            </div>
                            <div>
                              <h4><span className="material-symbols-outlined">route</span>{copy.guidance}</h4>
                              <ol>{localize(part.guidance, locale).map((item, itemIndex) => <li key={item}><span>{itemIndex + 1}</span>{item}</li>)}</ol>
                            </div>
                            <div>
                              <h4><span className="material-symbols-outlined">verified</span>{copy.outcomes}</h4>
                              <ul>{localize(part.outcomes, locale).map((item) => <li key={item}><Check aria-hidden="true" />{item}</li>)}</ul>
                            </div>
                            <div className="study-deliverable">
                              <h4><span className="material-symbols-outlined">inventory_2</span>{copy.deliverable}</h4>
                              <p>{localize(part.deliverable, locale)}</p>
                            </div>
                          </div>
                          <footer className="study-part-actions">
                            <span><Clock3 aria-hidden="true" />{copy.estimated}: {localize(part.duration, locale)}</span>
                            <button type="button" onClick={() => openPart(part)}>{copy.openPart}<ArrowRight aria-hidden="true" /></button>
                          </footer>
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            </article>
          )) : <div className="study-empty"><Search aria-hidden="true" /><p>{copy.noResults}</p></div>}
        </section>
      </main>
    </div>
  );
}
