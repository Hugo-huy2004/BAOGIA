import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  Atom,
  Bot,
  Check,
  ChevronDown,
  Flame,
  FlaskConical,
  Lock,
  Microscope,
  Play,
  Sparkles,
  Star,
  Trophy,
  Zap,
} from "lucide-react";
import { STAGE_THEME } from "./stageThemes";
import { CODER_STORAGE_KEYS } from "./workspaceUtils";

const STAGE_TONES = {
  basic: "blue",
  intermediate: "green",
  advanced: "purple",
  security: "pink",
  project: "indigo",
  devops: "orange",
};

function readLocalList(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function calculateStreak(events) {
  const activeDays = new Set(
    events
      .filter((event) => event?.status === "accepted" && event?.at)
      .map((event) => new Date(event.at).toISOString().slice(0, 10)),
  );
  if (activeDays.size === 0) return 0;

  const cursor = new Date();
  const todayKey = cursor.toISOString().slice(0, 10);
  if (!activeDays.has(todayKey)) cursor.setDate(cursor.getDate() - 1);

  let streak = 0;
  while (activeDays.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function lessonNumber(course) {
  return Number.parseInt(String(course?.id || "").replace(/\D/g, ""), 10) || 0;
}

function CoderLabScene() {
  return (
    <div className="coder-lab-scene" aria-hidden="true">
      <span className="coder-lab-orbit"><Atom /></span>
      <div className="coder-lab-shelf">
        <span><FlaskConical /></span>
        <span><FlaskConical /></span>
        <span><FlaskConical /></span>
      </div>
      <div className="coder-lab-robot">
        <span className="coder-lab-antenna" />
        <Bot />
        <i />
      </div>
      <div className="coder-lab-microscope"><Microscope /></div>
      <div className="coder-lab-desk">
        <span>&lt;/&gt;</span>
        <i />
        <i />
      </div>
      <span className="coder-lab-bubble coder-lab-bubble-one" />
      <span className="coder-lab-bubble coder-lab-bubble-two" />
      <span className="coder-lab-bubble coder-lab-bubble-three" />
    </div>
  );
}

export default function CoderLearningJourney({
  courses,
  stages,
  loading,
  onOpenLesson,
}) {
  const { t } = useTranslation();
  const completedLessons = readLocalList(CODER_STORAGE_KEYS.progress);
  const analytics = readLocalList(CODER_STORAGE_KEYS.analytics);
  const completedSet = useMemo(
    () => new Set(completedLessons),
    [completedLessons],
  );
  const completedCount = courses.filter((course) => completedSet.has(course.id)).length;
  const progress = courses.length
    ? Math.round((completedCount / courses.length) * 100)
    : 0;
  const firstIncompleteIndex = courses.findIndex(
    (course) => !completedSet.has(course.id),
  );
  const currentIndex = firstIncompleteIndex === -1
    ? Math.max(0, courses.length - 1)
    : firstIncompleteIndex;
  const currentCourse = courses[currentIndex] || courses[0];
  const currentStage = stages.find(
    (stage) => currentIndex >= stage.from && currentIndex < stage.to,
  ) || stages[0];
  const [expandedStage, setExpandedStage] = useState(currentStage?.id || "basic");
  const streak = calculateStreak(analytics);
  const xp = completedCount * 20;

  if (loading && courses.length === 0) {
    return (
      <div className="coder-journey-loading" aria-live="polite">
        <span />
        <p>{t("hugoCoderLearning.loading")}</p>
      </div>
    );
  }

  return (
    <main className="coder-journey">
      <section className="coder-journey-hero">
        <div className="coder-journey-hero-copy">
          <span className="coder-kicker">
            <Sparkles aria-hidden="true" />
            {t("hugoCoderLearning.hero.kicker")}
          </span>
          <h1>{t("hugoCoderLearning.hero.title")}</h1>
          <p>{t("hugoCoderLearning.hero.description")}</p>
        </div>

        <div className="coder-hero-lab-column">
          <CoderLabScene />
          <button
            type="button"
            className="coder-continue"
            onClick={() => currentCourse && onOpenLesson(currentCourse.id)}
            disabled={!currentCourse}
          >
            <span className="coder-continue-icon">
              <Play aria-hidden="true" />
            </span>
            <span>
              <small>{t("hugoCoderLearning.hero.continue")}</small>
              <strong>
                {currentCourse?.title?.replace(/^\d+\.\s*/, "")
                  || t("hugoCoderLearning.hero.firstLesson")}
              </strong>
            </span>
            <ArrowRight aria-hidden="true" />
          </button>
        </div>
      </section>

      <section className="coder-stats" aria-label={t("hugoCoderLearning.stats.label")}>
        <div>
          <span className="coder-stat-icon coder-stat-flame"><Flame aria-hidden="true" /></span>
          <p><strong>{streak}</strong><small>{t("hugoCoderLearning.stats.streak")}</small></p>
        </div>
        <div>
          <span className="coder-stat-icon coder-stat-xp"><Zap aria-hidden="true" /></span>
          <p><strong>{xp.toLocaleString()}</strong><small>XP</small></p>
        </div>
        <div>
          <span className="coder-stat-icon coder-stat-course"><Trophy aria-hidden="true" /></span>
          <p><strong>{completedCount}/{courses.length || 100}</strong><small>{t("hugoCoderLearning.stats.lessons")}</small></p>
        </div>
      </section>

      <section className="coder-overall-progress">
        <div>
          <span>{t("hugoCoderLearning.progress.title")}</span>
          <strong>{progress}%</strong>
        </div>
        <div className="coder-progress-track" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </div>
      </section>

      <section className="coder-path-heading">
        <div>
          <span>{t("hugoCoderLearning.path.eyebrow")}</span>
          <h2>{t("hugoCoderLearning.path.title")}</h2>
        </div>
        <p>{t("hugoCoderLearning.path.description")}</p>
      </section>

      <div className="coder-stage-list">
        {stages.map((stage) => {
          const theme = STAGE_THEME[stage.id] || STAGE_THEME.basic;
          const StageIcon = theme.icon;
          const stageCourses = courses.slice(stage.from, stage.to);
          const stageCompleted = stageCourses.filter((course) => completedSet.has(course.id)).length;
          const stageProgress = stageCourses.length
            ? Math.round((stageCompleted / stageCourses.length) * 100)
            : 0;
          const expanded = expandedStage === stage.id;
          const stageLocked = stage.from > currentIndex;
          const tone = STAGE_TONES[stage.id] || "blue";

          return (
            <section
              key={stage.id}
              className={`coder-stage coder-tone-${tone} ${expanded ? "is-expanded" : ""}`}
            >
              <button
                type="button"
                className="coder-stage-summary"
                onClick={() => setExpandedStage(expanded ? null : stage.id)}
                aria-expanded={expanded}
              >
                <span className="coder-stage-icon"><StageIcon aria-hidden="true" /></span>
                <span className="coder-stage-title">
                  <small>
                    {t("hugoCoderLearning.path.stage", { number: stage.phaseNumber })}
                    {" · "}
                    {stageCourses.length} {t("hugoCoderLearning.stats.lessons").toLowerCase()}
                  </small>
                  <strong>{stage.title.replace(/^Chặng \d+:\s*/, "")}</strong>
                </span>
                <span className="coder-stage-meta">
                  <small>{stageCompleted}/{stageCourses.length}</small>
                  {stageLocked ? <Lock aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
                </span>
              </button>

              <div className="coder-stage-progress" aria-hidden="true">
                <span style={{ width: `${stageProgress}%` }} />
              </div>

              {expanded && (
                <div className="coder-lesson-path">
                  {stageCourses.map((course, index) => {
                    const globalIndex = stage.from + index;
                    const complete = completedSet.has(course.id);
                    const locked = globalIndex > currentIndex;
                    const current = globalIndex === currentIndex;
                    const boss = course.practiceType === "quiz"
                      || course.practiceType === "graduation_submission";
                    const wave = ["left", "center", "right", "center"][index % 4];

                    return (
                      <div
                        key={course.id}
                        className={`coder-path-stop coder-path-${wave} ${
                          complete ? "is-complete" : current ? "is-current" : "is-locked"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => !locked && onOpenLesson(course.id)}
                          disabled={locked}
                          aria-label={`${lessonNumber(course)}. ${course.title}`}
                        >
                          {complete ? <Check aria-hidden="true" /> : locked
                            ? <Lock aria-hidden="true" />
                            : boss ? <Star aria-hidden="true" /> : <Play aria-hidden="true" />}
                        </button>
                        <span>
                          <small>
                            {t("hugoCoderLearning.path.lesson", { number: lessonNumber(course) })}
                          </small>
                          <strong>{course.title.replace(/^\d+\.\s*/, "")}</strong>
                          {current && <em>{t("hugoCoderLearning.path.next")}</em>}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}
