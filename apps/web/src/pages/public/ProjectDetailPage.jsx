import { ArrowLeft, ArrowUpRight, Info } from "lucide-react";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { findProject, projects, shotUrl } from "../../data/projects";
import "../../components/public/hwagfu/hwagfu.css";
import "./projects.css";
import { useHeadMeta } from "../../hooks/useHeadMeta";
import { useServicesFonts } from "../../hooks/useServicesFonts";
import TechLogo from "../../components/public/TechLogo";
import { Browser, Phone, toneOf } from "./ProjectsPage";

/**
 * /project/:slug — một dự án, một trang. 09/11/2026: cùng chất sticker neon
 * với /project. Hình đi trước chữ: đầu trang là thẻ màu của dự án với ảnh bìa
 * trong máy ảo; ảnh chụp là một dải máy vuốt ngang; câu chuyện gập lại, mục
 * đầu mở sẵn.
 *
 * Thứ tự vẫn là thứ tự người đọc hỏi: đây là cái gì → viết bằng gì → làm được
 * những gì → cho tôi xem. Người đọc trang này phần lớn là người tuyển dụng và
 * khách kỹ tính; họ muốn biết công cụ trước khi nghe kể chuyện.
 *
 * Chữ nghĩa lấy từ `projectsPage.*` (vi/en/zh) với bản tiếng Việt trong
 * `apps/web/src/data/projects.js` làm nguồn dự phòng.
 */

export default function ProjectDetailPage() {
  const { slug } = useParams();
  const location = useLocation();
  const { t } = useTranslation();
  useServicesFonts();
  const project = findProject(slug);
  const returnTo = location.state?.from;
  const backTo = typeof returnTo === "string" && returnTo.startsWith("/") && !returnTo.startsWith("//")
    ? returnTo
    : "/project";

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
  const base = `projectsPage.items.${project.id}`;
  const summary = t(`${base}.summary`, project.summary);
  const techNote = t(`${base}.techNote`, project.techNote || "");
  const highlights = t(`${base}.highlights`, { returnObjects: true, defaultValue: project.highlights });
  const closing = t(`${base}.closing`, project.closing || "");
  const caption = (src, fallback) => t(`${base}.shots.${src}`, fallback);
  const Device = project.phone ? Phone : Browser;

  return (
    <div className="hwagfu-copy pj-page">
      <div className="pj-wrap">
        <Link to={backTo} className="pj-back"><ArrowLeft size={16} /> {t("projectsPage.backToSource")}</Link>

        {/* ── Đầu trang: thẻ màu của dự án ───────────────────── */}
        <header className="pj-hero" style={toneOf(project.id)}>
          <div className="pj-hero__copy">
            <p className="pj-tags">
              <span className="pj-chip">{kind}</span>
              <span>{period}</span>
            </p>
            <h1 className="pj-hero__title">{project.title}</h1>
            <p className="pj-hero__lede">{summary}</p>
            <div className="pj-links">
              {project.url && (
                <a href={project.url} target="_blank" rel="noreferrer" className="pj-btn">
                  {t("projectsPage.openSite", { label: project.urlLabel })} <ArrowUpRight size={16} />
                </a>
              )}
              {project.repo && (
                <a href={project.repo} target="_blank" rel="noreferrer" className="pj-btn pj-btn--light">
                  {t("projectsPage.openRepo")} <ArrowUpRight size={16} />
                </a>
              )}
            </div>
          </div>
          <div className={`pj-stage pj-stage--hero${project.phone ? " pj-stage--duo" : ""}`}>
            <Browser src={shotUrl(project.id, project.cover || project.shots[0].src)} alt={project.title} />
            {project.phone ? (
              <div className="pj-stage__phone"><Phone src={shotUrl(project.id, project.phone)} alt={project.title} /></div>
            ) : null}
          </div>
        </header>

        <dl className="pj-meta">
          <div><dt>{t("projectsPage.roleLabel")}</dt><dd>{role}</dd></div>
          <div><dt>{t("projectsPage.periodLabel")}</dt><dd>{period}</dd></div>
          {project.partner && <div><dt>{t("projectsPage.partnerLabel")}</dt><dd>{project.partner}</dd></div>}
        </dl>

        {project.note && (
          <p className="pj-note"><Info size={20} aria-hidden /><span>{project.note}</span></p>
        )}

        {/* ── Viết bằng gì: nhãn dán có logo ───────────────────── */}
        <section className="pj-section">
          <h2 className="pj-h2">{t("projectsPage.techTitle")}</h2>
          <ul className="pj-stack">
            {project.stack.map((tech) => (
              <li key={tech}><TechLogo name={tech} />{tech}</li>
            ))}
          </ul>
          {techNote && <p className="pj-tech-note">{techNote}</p>}
        </section>

        {/* ── Ảnh từ bản đang chạy: một dải máy ảo ───────────── */}
        <section className="pj-section">
          <h2 className="pj-h2">{t("projectsPage.shotsTitle")}</h2>
          <ol className={`pj-rail${project.phone ? " pj-rail--phones" : ""}`}>
            {project.shots.map((shot) => (
              <li key={shot.src}>
                <Device src={shotUrl(project.id, shot.src)} alt={caption(shot.src, shot.caption)} />
                <p>{caption(shot.src, shot.caption)}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ── Câu chuyện: gập lại, mục đầu mở sẵn ────────────── */}
        <section className="pj-section">
          <h2 className="pj-h2">{t("projectsPage.featuresTitle")}</h2>
          <div className="pj-story">
            {highlights.map((item, i) => (
              <details key={item.title} open={i === 0}>
                <summary>
                  <span className="pj-story__n" aria-hidden>{String(i + 1).padStart(2, "0")}</span>
                  <b>{item.title}</b>
                  <span className="pj-story__chev" aria-hidden>+</span>
                </summary>
                <p>{item.body}</p>
              </details>
            ))}
          </div>
          {closing && <p className="pj-closing">{closing}</p>}
        </section>

        <Link to={`/project/${next.id}`} state={{ from: backTo }} className="pj-next" style={toneOf(next.id)}>
          <span>
            <small>{t("projectsPage.nextProject")}</small>
            <b>{next.title}</b>
          </span>
          <ArrowUpRight size={26} aria-hidden />
        </Link>
      </div>
    </div>
  );
}
