import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { projects, shotUrl } from "../../data/projects";
import { PhoneFrame } from "../../components/public/hwagfu/ServicesStory";
import "../../components/public/hwagfu/hwagfu.css";
import "./projects.css";
import { useHeadMeta } from "../../hooks/useHeadMeta";
import { useServicesFonts } from "../../hooks/useServicesFonts";

/**
 * /project — triển lãm theo dòng thời gian, 09/11/2026: cùng chất sticker neon
 * với trang Dịch vụ. Mỗi dự án là một thẻ màu: ảnh chụp thật đứng trong cửa sổ
 * trình duyệt ảo (và điện thoại ảo nếu dự án có ảnh màn hình điện thoại), chữ
 * chỉ còn loại · thời gian · tên · một câu.
 *
 * Xếp từ dự án đầu tiên tới nay, mốc năm là nhãn dán. Cố ý KHÔNG đếm "n dự án":
 * danh sách còn dài ra, con số viết hôm nay thì sai ngay lần thêm dự án sau.
 *
 * Thêm dự án = thêm một phần tử trong `apps/web/src/data/projects.js` với
 * `startedAt` đúng; nó tự rơi vào đúng chỗ, không phải sửa trang này.
 */

/** Cặp màu neon xoay vòng theo thứ tự trong data — thẻ ở /project và đầu trang chi tiết cùng màu. */
const NEON = [
  ["#00f5d4", "#00bbf9"],
  ["#b14bff", "#ff4fc3"],
  ["#ffe53b", "#ff6a00"],
  ["#c6ff00", "#00e5a0"],
  ["#ff2e93", "#ff8a5b"],
  ["#2f6bff", "#00c2ff"],
];
export const toneOf = (id) => {
  const [a, b] = NEON[Math.max(0, projects.findIndex((p) => p.id === id)) % NEON.length];
  return { "--a": a, "--b": b };
};

/** Cửa sổ trình duyệt ảo kiểu sticker: viền mực, ba chấm, ảnh chụp bên trong. */
export function Browser({ src, alt = "" }) {
  return (
    <div className="pj-browser">
      <span className="pj-browser__bar" aria-hidden><i /><i /><i /></span>
      <img src={src} alt={alt} loading="lazy" />
    </div>
  );
}

/** Ảnh màn hình điện thoại trong khung iPhone dùng chung với trang Dịch vụ. */
export function Phone({ src, alt = "" }) {
  return (
    <PhoneFrame label={alt}>
      <img src={src} alt="" loading="lazy" className="pj-phone-shot" />
    </PhoneFrame>
  );
}

export default function ProjectsPage() {
  const { t } = useTranslation();
  const location = useLocation();
  useServicesFonts();
  const currentPath = `${location.pathname}${location.search}${location.hash}`;
  const returnTo = location.state?.from;
  const backTo = typeof returnTo === "string" && returnTo.startsWith("/") && !returnTo.startsWith("//")
    ? returnTo
    : "/introduction";

  useHeadMeta({ title: t("projectsPage.metaTitle"), canonicalUrl: "https://www.hugowishpax.studio/project" });

  const ordered = [...projects].sort((a, b) => String(a.startedAt).localeCompare(String(b.startedAt)));
  const years = [];
  for (const project of ordered) {
    const year = String(project.startedAt).slice(0, 4);
    if (years.at(-1)?.year !== year) years.push({ year, items: [] });
    years.at(-1).items.push(project);
  }

  return (
    <div className="hwagfu-copy pj-page">
      <div className="pj-wrap">
        <Link to={backTo} className="pj-back"><ArrowLeft size={16} /> {t("projectsPage.backToSource")}</Link>

        <header className="pj-head">
          <p className="pj-kicker">{t("projectsPage.kicker")}</p>
          <h1 className="pj-title">{t("projectsPage.title")}</h1>
          <p className="pj-lede">{t("projectsPage.lede")}</p>
        </header>

        {years.map(({ year, items }) => (
          <section key={year} className="pj-year-group" aria-label={year}>
            <p className="pj-year" aria-hidden>{year}</p>
            <ol className="pj-grid">
              {items.map((project) => (
                <li key={project.id}>
                  <Link to={`/project/${project.id}`} state={{ from: currentPath }} className="pj-card" style={toneOf(project.id)}>
                    <div className={`pj-stage${project.phone ? " pj-stage--duo" : ""}`}>
                      <Browser src={shotUrl(project.id, project.cover || project.shots[0].src)} />
                      {project.phone ? (
                        <div className="pj-stage__phone"><Phone src={shotUrl(project.id, project.phone)} alt={project.title} /></div>
                      ) : null}
                    </div>
                    <div className="pj-card__text">
                      <p className="pj-tags">
                        <span className="pj-chip">{t(`projectsPage.kinds.${project.kind}`, project.kind)}</span>
                        <span>{project.period.replace("{now}", t("projectsPage.periodNow"))}</span>
                      </p>
                      <h2 className="pj-card__title">{project.title}</h2>
                      <p className="pj-card__line">{t(`projectsPage.items.${project.id}.tagline`, project.tagline)}</p>
                      <span className="pj-go" aria-hidden><ArrowUpRight size={20} /></span>
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        ))}

        {/* Dây thời gian không kết thúc: còn dự án đang tới. */}
        <p className="pj-more">{t("projectsPage.more")}</p>
      </div>
    </div>
  );
}
