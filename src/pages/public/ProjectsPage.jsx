import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { projects, shotUrl } from "../../data/projects";
import "../../components/public/hwagfu/hwagfu.css";
import "./projects.css";
import { useHeadMeta } from "../../hooks/useHeadMeta";

/**
 * /project — triển lãm theo dòng thời gian.
 *
 * Xếp từ dự án đầu tiên tới nay, sổ dọc theo một sợi dây thời gian, mốc năm
 * chen giữa. Cố ý KHÔNG đếm "n dự án" ở đâu cả: danh sách còn dài ra, mà một
 * con số viết vào hôm nay thì sai ngay lần thêm dự án sau.
 *
 * Thêm dự án = thêm một phần tử trong `src/data/projects.js` với `startedAt`
 * đúng; nó tự rơi vào đúng chỗ trên dây, không phải sửa trang này.
 */

export default function ProjectsPage() {
  const { t } = useTranslation();

  useHeadMeta({ title: t("projectsPage.metaTitle"), canonicalUrl: "https://www.hugowishpax.studio/project" });

  const ordered = [...projects].sort((a, b) => String(a.startedAt).localeCompare(String(b.startedAt)));

  let lastYear = null;

  return (
    <div className="hwagfu-copy pj-page">
      <div className="pj-wrap">
        <Link to="/introduction" className="link-more pj-back">
          <ArrowLeft size={16} /> {t("projectsPage.backLink")}
        </Link>

        <header className="pj-head">
          <p className="kicker pj-kicker">{t("projectsPage.kicker")}</p>
          <h1 className="headline-hero">{t("projectsPage.title")}</h1>
          <p className="lede pj-lede">{t("projectsPage.lede")}</p>
        </header>

        <ol className="pj-timeline">
          {ordered.map((project) => {
            const year = String(project.startedAt).slice(0, 4);
            const newYear = year !== lastYear;
            lastYear = year;
            const period = project.period.replace("{now}", t("projectsPage.periodNow"));
            return (
              <li key={project.id} className="pj-entry">
                {newYear && <p className="pj-year">{year}</p>}
                {/* Chấm mốc nằm NGOÀI thẻ: thẻ có overflow:hidden để bo ảnh, để
                    bên trong thì chấm bị cắt mất. */}
                <div className="pj-entry-body">
                  <span className="pj-node" aria-hidden />
                  <Link to={`/project/${project.id}`} className="pj-entry-link">
                  <div className="pj-entry-text">
                    <div className="pj-tags">
                      <span className="pj-chip">{t(`projectsPage.kinds.${project.kind}`, project.kind)}</span>
                      <span>{period}</span>
                    </div>
                    <h2 className="headline-section">{project.title}</h2>
                    <p>{t(`projectsPage.items.${project.id}.tagline`, project.tagline)}</p>
                    <span className="pj-arrow" aria-hidden>
                      <ArrowUpRight size={18} />
                    </span>
                  </div>
                  <div className={`pj-shot${project.coverContain ? " pj-shot--contain" : ""}`}>
                    {/* Ảnh bìa mặc định là ảnh đầu tiên; `cover` để chọn tấm khác. */}
                    <img src={shotUrl(project.id, project.cover || project.shots[0].src)} alt="" loading="lazy" />
                  </div>
                  </Link>
                </div>
              </li>
            );
          })}

          {/* Dây thời gian không kết thúc: còn dự án đang tới. */}
          <li className="pj-entry pj-entry--open">
            <span className="pj-node pj-node--open" aria-hidden />
            <p>{t("projectsPage.more")}</p>
          </li>
        </ol>
      </div>
    </div>
  );
}
