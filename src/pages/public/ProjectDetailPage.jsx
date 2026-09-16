import { ArrowLeft, ArrowUpRight, Info } from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { findProject, projects, shotUrl } from "../../data/projects";
import "../../components/public/hwagfu/hwagfu.css";
import "./projects.css";
import { useHeadMeta } from "../../hooks/useHeadMeta";
import TechLogo from "../../components/public/TechLogo";

/**
 * /project/:slug — một dự án, một trang.
 *
 * Thứ tự các phần là thứ tự người đọc hỏi: đây là cái gì → viết bằng gì →
 * làm được những gì → cho tôi xem. Phần "viết bằng gì" đứng trước phần tính
 * năng vì người đọc trang này phần lớn là người tuyển dụng và khách kỹ tính;
 * họ muốn biết công cụ trước khi nghe kể chuyện.
 *
 * Chữ nghĩa lấy từ `projectsPage.*` (vi/en/zh) với bản tiếng Việt trong
 * `src/data/projects.js` làm nguồn dự phòng.
 */

export default function ProjectDetailPage() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const project = findProject(slug);

  useHeadMeta({
    title: project ? `${project.title} — ${t("projectsPage.kicker")} · Hugo Studio` : t("projectsPage.metaTitle"),
    description: project ? t(`projectsPage.items.${project.id}.summary`, project.summary) : "",
    canonicalUrl: project ? `https://www.hugowishpax.studio/project/${project.id}` : "https://www.hugowishpax.studio/project",
  });

  if (!project) return <Navigate to="/project" replace />;

  const next = projects[(projects.findIndex((p) => p.id === project.id) + 1) % projects.length];
  const kind = t(`projectsPage.kinds.${project.kind}`, project.kind);
  const period = project.period.replace("{now}", t("projectsPage.periodNow"));
  const role = t(`projectsPage.items.${project.id}.role`, project.role);
  // Nội dung dự án lấy theo ngôn ngữ đang chọn; bản tiếng Việt trong
  // `src/data/projects.js` là nguồn dự phòng nếu khoá dịch còn thiếu.
  const base = `projectsPage.items.${project.id}`;
  const summary = t(`${base}.summary`, project.summary);
  const techNote = t(`${base}.techNote`, project.techNote || "");
  const highlights = t(`${base}.highlights`, { returnObjects: true, defaultValue: project.highlights });
  const closing = t(`${base}.closing`, project.closing || "");
  const caption = (src, fallback) => t(`${base}.shots.${src}`, fallback);

  return (
    <div className="hwagfu-copy pj-page">
      <div className="pj-wrap pj-wrap--narrow">
        <Link to="/project" className="link-more pj-back">
          <ArrowLeft size={16} /> {t("projectsPage.allProjects")}
        </Link>

        {/* ── Giới thiệu ────────────────────────────────────── */}
        <header>
          <div className="pj-tags">
            <span className="pj-chip">{kind}</span>
            <span>{period}</span>
          </div>
          <h1 className="headline-hero">{project.title}</h1>
          <p className="lede pj-hero-lede">{summary}</p>
          <div className="pj-links">
            {project.url && (
              <a href={project.url} target="_blank" rel="noreferrer" className="btn-primary pj-cta">
                {t("projectsPage.openSite", { label: project.urlLabel })} <ArrowUpRight size={16} />
              </a>
            )}
            {project.repo && (
              <a href={project.repo} target="_blank" rel="noreferrer" className="link-more pj-repo">
                {t("projectsPage.openRepo")} <ArrowUpRight size={16} />
              </a>
            )}
          </div>
        </header>

        <dl className="pj-meta">
          <div>
            <dt>{t("projectsPage.roleLabel")}</dt>
            <dd>{role}</dd>
          </div>
          <div>
            <dt>{t("projectsPage.periodLabel")}</dt>
            <dd>{period}</dd>
          </div>
          {project.partner && (
            <div>
              <dt>{t("projectsPage.partnerLabel")}</dt>
              <dd>{project.partner}</dd>
            </div>
          )}
        </dl>

        {project.note && (
          <p className="pj-note">
            <Info size={20} aria-hidden />
            <span>{project.note}</span>
          </p>
        )}

        {/* ── Viết bằng gì ──────────────────────────────────── */}
        <section className="pj-section">
          <h2 className="headline-section">{t("projectsPage.techTitle")}</h2>
          <div className="pj-stack pj-stack--big">
            {project.stack.map((tech) => (
              <span key={tech}>
                <TechLogo name={tech} />
                {tech}
              </span>
            ))}
          </div>
          {techNote && <p className="pj-tech-note">{techNote}</p>}
        </section>

        {/* ── Câu chuyện ────────────────────────────────────── */}
        <section className="pj-section">
          <h2 className="headline-section">{t("projectsPage.featuresTitle")}</h2>
          <div className="pj-story">
            {highlights.map((item) => (
              <article key={item.title}>
                <h3 className="headline-card">{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
          {closing && <p className="pj-closing">{closing}</p>}
        </section>

        {/* ── Ảnh từ bản đang chạy ──────────────────────────── */}
        <section className="pj-section">
          <h2 className="headline-section">{t("projectsPage.shotsTitle")}</h2>
          <div className="pj-figures">
            {project.shots.map((shot) => (
              <figure key={shot.src}>
                <div>
                  <img src={shotUrl(project.id, shot.src)} alt={caption(shot.src, shot.caption)} loading="lazy" />
                </div>
                <figcaption>{caption(shot.src, shot.caption)}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        <Link to={`/project/${next.id}`} className="pj-next">
          <span>
            <small>{t("projectsPage.nextProject")}</small>
            <b className="headline-card">{next.title}</b>
          </span>
          <ArrowUpRight size={24} aria-hidden />
        </Link>
      </div>
    </div>
  );
}
