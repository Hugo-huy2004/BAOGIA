import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { profileSkills, skillsCopy } from "../../data/profileSkills";
import { findProject } from "../../data/projects";
import { cvPdf } from "../../config/publicSites";

export default function ProfileSummary({ education }) {
  const { t, i18n } = useTranslation();
  const language = i18n.language.split("-")[0];
  const code = skillsCopy[language] ? language : "vi";
  const copy = skillsCopy[code];
  return (
    <section id="about" className="scroll-mt-24 border-y border-border bg-background px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <p className="kicker text-muted-foreground">{t("intro.story.profile.kicker")}</p>
        <h2 className="headline-section mt-3">{t("intro.story.profile.heading")}</h2>
        <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">{t("intro.story.profile.summary")}</p>

        <div id="skills" className="scroll-mt-24 mt-14">
          <h3 className="headline-card">{copy.heading}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{copy.note}</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {profileSkills.map((group) => (
              <article key={group.id} className="rounded-2xl border border-border bg-muted/30 p-6">
                <h4 className="text-base font-semibold">{group.title[code]}</h4>
                <ul className="mt-4 space-y-2 text-sm font-medium leading-relaxed">
                  {group.lines.map((line) => <li key={line}>{line}</li>)}
                </ul>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{group.note[code]}</p>
                <p className="mt-5 border-t border-border pt-4 text-xs text-muted-foreground">
                  {copy.evidence}
                </p>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-2 text-sm">
                  {group.projects.map((id) => (
                    <Link key={id} to={`/project/${id}`} className="underline underline-offset-4">{findProject(id).title}</Link>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-14 border-t border-border pt-8">
          <h3 className="headline-card">{t("intro.story.profile.educationHeading")}</h3>
          <ol className="mt-6 grid gap-8 md:grid-cols-2">
            {education.map((item) => (
              <li key={item.school}>
                <p className="text-sm text-muted-foreground">{item.period}</p>
                <h4 className="mt-2 font-semibold">{item.school}</h4>
                <p className="mt-1 text-sm text-muted-foreground">{item.degree}</p>
              </li>
            ))}
          </ol>
        </div>
        <a href={cvPdf(code)} target="_blank" rel="noopener noreferrer" className="btn-secondary mt-10 inline-flex">
          {t("intro.story.profile.cvLabel")}
        </a>
      </div>
    </section>
  );
}
