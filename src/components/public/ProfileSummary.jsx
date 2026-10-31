import { ArrowUpRight, Check, GraduationCap } from "lucide-react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { profileSkills, skillsCopy } from "../../data/profileSkills";
import { findProject } from "../../data/projects";
import { cvPdf } from "../../config/publicSites";

export default function ProfileSummary({ education }) {
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const language = i18n.language.split("-")[0];
  const code = skillsCopy[language] ? language : "vi";
  const copy = skillsCopy[code];

  return (
    <section id="about" data-anchor="about" className="portfolio-profile">
      <div className="portfolio-profile-intro">
        <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4 }}>
          <p className="portfolio-eyebrow"><span />03 · {t("intro.story.profile.kicker")}</p>
          <h2>{t("intro.story.profile.heading")}</h2>
        </motion.div>
        <motion.div className="portfolio-profile-summary" initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.35 }}>
          <p>{t("intro.story.profile.summary")}</p>
          <div className="profile-facts">
            <p><span>{t("intro.story.profile.statusLabel")}</span><b>{t("intro.story.profile.statusValue")}</b></p>
            <p><span>{t("intro.story.profile.focusLabel")}</span><b>{t("intro.story.profile.focusValue")}</b></p>
            <p><span>{t("intro.story.profile.languageLabel")}</span><b>VSTEP B2 · 2024</b></p>
          </div>
        </motion.div>
      </div>

      <div id="skills" className="portfolio-skills">
        <div className="portfolio-section-heading">
          <div><p>{copy.heading}</p><span>{copy.note}</span></div>
          <a href={cvPdf(code)} target="_blank" rel="noopener noreferrer">{t("intro.story.profile.cvLabel")} <ArrowUpRight size={15} /></a>
        </div>
        <div className="portfolio-skill-grid">
          {profileSkills.map((group, index) => (
            <motion.article key={group.id} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }} viewport={{ once: true, amount: 0.4 }}>
              <span>0{index + 1}</span>
              <h3>{group.title[code]}</h3>
              <ul>{group.lines.map((line) => <li key={line}><Check size={14} />{line}</li>)}</ul>
              <p>{group.note[code]}</p>
              <div>{group.projects.map((id) => (
                <Link key={id} to={`/project/${id}`} state={{ from: `${location.pathname}${location.search}${location.hash}` }}>{findProject(id).title}<ArrowUpRight size={12} /></Link>
              ))}</div>
            </motion.article>
          ))}
        </div>
      </div>

      <div className="portfolio-education">
        <div className="education-copy">
          <GraduationCap size={22} />
          <p>{t("intro.story.profile.educationHeading")}</p>
          <h3>{t("intro.story.profile.educationTitle")}</h3>
          <span>{t("intro.story.profile.educationIntro")}</span>
        </div>
        <ol>
          {education.map((item) => (
            <li key={item.school}>
              <span>{item.year}</span>
              <div><p>{item.period}</p><h4>{item.school}</h4><b>{item.degree}</b><small>{item.description}</small></div>
            </li>
          ))}
        </ol>
      </div>

      <motion.div className="portfolio-internship" initial={{ opacity: 0, scale: 0.98 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, amount: 0.45 }}>
        <p>{t("intro.story.profile.internshipLabel")}</p>
        <h3>{t("intro.story.profile.internshipHeading")}</h3>
        <span>{t("intro.story.profile.internshipDesc")}</span>
        <a href="mailto:contact@hugowishpax.studio">{t("intro.story.profile.internshipCta")} <ArrowUpRight size={16} /></a>
      </motion.div>
    </section>
  );
}
