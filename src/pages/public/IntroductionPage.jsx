import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUpRight, FileText, Mail, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, useMotionValueEvent, useScroll, useTransform } from "motion/react";
import { cvPdf } from "../../config/publicSites";
import { useData } from "../../context/DataContext";
import { featuredProjects, shotUrl } from "../../data/projects";
import WorkStory from "../../components/public/hwagfu/WorkStory";
import ProfileSummary from "../../components/public/ProfileSummary";
import CinematicAtmosphere from "../../components/public/cine/CinematicAtmosphere";
import { syncScrollFilmBeat, playHapticTick } from "../../utils/CinematicSoundEngine";
import "../../components/public/hwagfu/hwagfu.css";

const scenes = [
  { id: "hero", number: "01" },
  { id: "projects", number: "02" },
  { id: "about", number: "03" },
  { id: "contact", number: "04" },
];

function FilmRail({ active }) {
  return (
    <aside className="film-rail" aria-hidden="true">
      {scenes.map((scene) => (
        <span key={scene.id} className={active === scene.id ? "is-active" : ""}>
          <i /> {scene.number}
        </span>
      ))}
    </aside>
  );
}

function Hero({ name, t, language }) {
  const ref = useRef(null);
  const scrollRootRef = useRef(document.getElementById("root"));
  const { scrollYProgress } = useScroll({ container: scrollRootRef, target: ref, offset: ["start start", "end start"] });
  const visualY = useTransform(scrollYProgress, [0, 1], [0, 110]);
  const visualRotate = useTransform(scrollYProgress, [0, 1], [0, -4]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, 54]);

  return (
    <section ref={ref} data-anchor="hero" className="portfolio-hero">
      <div className="portfolio-hero-glow" aria-hidden="true" />
      <motion.div className="portfolio-hero-copy" style={{ y: copyY }}>
        <p className="portfolio-eyebrow"><span />{t("intro.story.hero.eyebrow")}</p>
        <h1>{t("intro.story.hero.title")}<span>{t("intro.story.hero.accent")}</span></h1>
        <p className="portfolio-hero-lede">{t("intro.story.hero.lede", { name })}</p>
        <div className="portfolio-hero-actions">
          <a href="#projects" className="btn-primary" onClick={playHapticTick}>{t("intro.story.hero.ctaWork")} <ArrowDown size={16} /></a>
          <a href={cvPdf(language)} target="_blank" rel="noopener noreferrer" className="btn-secondary" onClick={playHapticTick}>{t("intro.story.hero.ctaCv")} <FileText size={15} /></a>
        </div>
        <div className="portfolio-hero-meta">
          <span><i className="status-dot" />{t("intro.story.hero.availability")}</span>
          <span><MapPin size={14} />Ho Chi Minh City</span>
        </div>
      </motion.div>

      <motion.div className="portfolio-hero-visual" style={{ y: visualY, rotate: visualRotate }} role="img" aria-label={t("intro.story.hero.visualLabel")}>
        <div className="portfolio-window-bar"><span /><span /><span /><b>hugo / portfolio</b></div>
        <div className="portfolio-window-body">
          <div className="portfolio-code-card">
            <p><em>01</em><span>const</span> product = &#123;</p>
            <p><em>02</em>&nbsp;&nbsp;question: <b>“why?”</b>,</p>
            <p><em>03</em>&nbsp;&nbsp;craft: <b>“design + code”</b>,</p>
            <p><em>04</em>&nbsp;&nbsp;state: <b>“shipped”</b></p>
            <p><em>05</em>&#125;;</p>
          </div>
          <div className="portfolio-mini-product">
            <div className="mini-orb" />
            <p>{t("intro.story.hero.visualKicker")}</p>
            <strong>{t("intro.story.hero.visualTitle")}</strong>
            <div><span>React</span><span>TypeScript</span><span>Node.js</span></div>
          </div>
        </div>
        <div className="portfolio-floating-note note-one"><span>Live</span>{t("intro.story.hero.noteBuild")}</div>
        <div className="portfolio-floating-note note-two"><span>03</span>{t("intro.story.hero.noteProjects")}</div>
      </motion.div>
      <a className="portfolio-scroll-cue" href="#projects"><span>{t("intro.story.hero.scroll")}</span><i aria-hidden="true" /></a>
    </section>
  );
}

function Contact({ email, t }) {
  const submit = (event) => {
    event.preventDefault();
    playHapticTick();
    const form = new FormData(event.currentTarget);
    const subject = t("intro.story.contact.mailSubject", { name: form.get("name") });
    const body = `${form.get("message")}\n\nEmail: ${form.get("email")}`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <section id="contact" data-anchor="contact" className="hwagfu-contact portfolio-contact">
      <div className="hwagfu-contact-grid max-w-6xl mx-auto">
        <div>
          <p className="portfolio-eyebrow"><span />04 · {t("intro.story.contact.kicker")}</p>
          <h2>{t("intro.story.contact.heading1")}<br /><span>{t("intro.story.contact.heading2")}</span></h2>
          <p>{t("intro.story.contact.desc")}</p>
          <a className="hwagfu-email group" href={`mailto:${email}`} onClick={playHapticTick}>
            <i><Mail size={20} /></i><span>{t("intro.story.contact.emailLabel")}<b>{email}</b></span><ArrowUpRight size={18} />
          </a>
        </div>
        <form className="hwagfu-contact-card" onSubmit={submit}>
          <label>{t("intro.story.contact.nameLabel")}<input name="name" required placeholder={t("intro.story.contact.namePlaceholder")} /></label>
          <label>{t("intro.story.contact.emailFieldLabel")}<input name="email" type="email" required placeholder={t("intro.story.contact.emailPlaceholder")} /></label>
          <label>{t("intro.story.contact.messageLabel")}<textarea name="message" required placeholder={t("intro.story.contact.messagePlaceholder")} /></label>
          <button type="submit">{t("intro.story.contact.submit")} <ArrowUpRight size={16} /></button>
        </form>
      </div>
    </section>
  );
}

export default function IntroductionPage() {
  const { t, i18n } = useTranslation();
  const { data } = useData();
  const [activeScene, setActiveScene] = useState("hero");
  const name = data?.profile?.fullName || "Hugo Wishpax";
  const email = data?.profile?.emailAddress || "contact@hugowishpax.studio";

  useEffect(() => {
    document.title = t("intro.apple.meta.title", "Hugo Wishpax — Portfolio");
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && setActiveScene(entry.target.dataset.anchor)),
      { rootMargin: "-35% 0px -45%", threshold: 0 },
    );
    document.querySelectorAll("[data-anchor]").forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [t]);

  const projects = useMemo(
    () => featuredProjects.slice(0, 3).map((project) => ({
      id: project.id,
      title: project.title,
      tagline: t(`projectsPage.items.${project.id}.tagline`, project.tagline),
      image: { src: shotUrl(project.id, project.cover || project.shots[0].src), alt: project.title },
    })),
    [t],
  );

  const education = useMemo(
    () => [{ key: "school1", year: "2022" }, { key: "school2", year: "2027", website: "https://greenwich.edu.vn/" }]
      .map(({ key, year, ...school }) => ({
        year,
        school: t(`intro.story.profile.${key}.school`),
        period: t(`intro.story.profile.${key}.period`),
        degree: t(`intro.story.profile.${key}.degree`),
        description: t(`intro.story.profile.${key}.description`),
        ...school,
      })),
    [t],
  );

  const scrollRootRef = useRef(document.getElementById("root"));
  const { scrollYProgress } = useScroll({ container: scrollRootRef });
  useMotionValueEvent(scrollYProgress, "change", (latest) => syncScrollFilmBeat(latest, [0.12, 0.38, 0.65, 0.88]));

  return (
    <div className="hwagfu-copy portfolio-experience">
      <CinematicAtmosphere />
      <FilmRail active={activeScene} />
      <Hero name={name} t={t} language={i18n.language} />
      <div id="projects" className="scroll-mt-24" />
      <WorkStory label={t("intro.story.work.label")} heading={t("intro.story.work.heading")} subtitle={t("intro.story.work.subtitle")} viewAll={t("intro.story.work.viewAll")} projects={projects} />
      <ProfileSummary education={education} />
      <Contact email={email} t={t} />
    </div>
  );
}
