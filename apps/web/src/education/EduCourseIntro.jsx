import { useNavigate, useParams } from "react-router-dom";
import { courseById, CATALOG } from "../../../../packages/courses/catalog";
import { localizeStage, localizeStepTitle, useEduText } from "./eduText";
import { setEduCourse } from "./useEduCourse";
import { playEduSound } from "./eduSound";
import EduStatus from "./EduStatus";

/**
 * Trang giới thiệu công khai của một khoá (/courses/coding, /courses/sql): nhân vật, số liệu, từng chặng
 * (nhân vật riêng + học gì + danh sách step mở được) và nút bắt đầu. Bản HTML tĩnh cho Google do
 * scripts/generate-seo.mjs dựng từ cùng packages/courses/catalog.js.
 */
export default function EduCourseIntro() {
  const { id } = useParams();
  const { t, lang } = useEduText();
  const navigate = useNavigate();
  const course = courseById(id);
  if (!course) return <EduStatus kind="notFound" />;
  // Bản dịch tên chặng/step hiện chỉ có cho khoá Coding.
  const stages = course.stages.map((s) => (course.id === "coding" ? localizeStage(s, lang) : s));
  const stepTitle = (title, i) => (course.id === "coding" ? localizeStepTitle(`${i + 1}. ${title}`, i, lang) : `${i + 1}. ${title}`);
  const start = () => { playEduSound("whoosh"); setEduCourse(course.id); navigate("/learn"); };
  const other = CATALOG.filter((c) => c.id !== course.id);

  return (
    <article className="edu-page cintro">
      <header className="cintro-hero">
        <img className="cintro-mascot" src={`/edu/cast-${course.cast}.svg`} alt="" width="150" height="150" />
        <div>
          <p className="cintro-kicker">{t("courses.kicker")}</p>
          <h1>{course.title[lang] || course.title.vi}</h1>
          <p className="cintro-lead">{course.tagline[lang] || course.tagline.vi}</p>
          <ul className="cintro-stats">
            <li><b>{course.outline.length}</b><small>{t("courses.steps")}</small></li>
            <li><b>{course.stages.length}</b><small>{t("courses.stages")}</small></li>
            <li><b>≈{course.hours}h</b><small>{t("courses.hours")}</small></li>
            <li><b>0đ</b><small>{t("courses.free")}</small></li>
          </ul>
          <button type="button" className="edu-btn edu-ob-go cintro-go" onClick={start}>{t("courses.start")}</button>
        </div>
      </header>

      <h2 className="edu-subhead">{t("courses.path")}</h2>
      <ol className="cintro-stages">
        {stages.map((stage, si) => (
          <li key={stage.id} style={{ "--i": si }}>
            <img src={`/edu/cast-${course.stageCast[stage.id] || course.cast}.svg`} alt="" width="72" height="72" />
            <div>
              <small>{stage.code}</small>
              <h3>{stage.title.replace(/^[A-Z]+ \d+ · /, "")}</h3>
              {stage.intro?.tagline && <p>{stage.intro.tagline}</p>}
              <ul className="cintro-learn">{(stage.intro?.learn || []).map((x) => <li key={x}>{x}</li>)}</ul>
              <details>
                <summary>{t("courses.seeSteps", { n: stage.to - stage.from })}</summary>
                <ol start={stage.from + 1}>
                  {course.outline.slice(stage.from, stage.to).map(([, title], k) => (
                    <li key={title}>{stepTitle(title, stage.from + k).replace(/^\d+\.\s*/, "")}</li>
                  ))}
                </ol>
              </details>
            </div>
          </li>
        ))}
      </ol>

      <section className="cintro-end">
        <button type="button" className="edu-btn edu-btn--wide edu-ob-go" onClick={start}>{t("courses.start")}</button>
        {other.map((c) => (
          <a key={c.id} className="cintro-other" href={`/courses/${c.id}`}>
            <img src={`/edu/cast-${c.cast}.svg`} alt="" width="48" height="48" />
            <span><small>{t("courses.also")}</small><b>{c.title[lang] || c.title.vi}</b></span>
          </a>
        ))}
      </section>
    </article>
  );
}
