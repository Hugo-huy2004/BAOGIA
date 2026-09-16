import { useEffect, useMemo, useRef } from "react";
import { FileText, Mail } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useScroll, useMotionValueEvent } from "motion/react";
import { useData } from "../../context/DataContext";
import { featuredProjects, shotUrl } from "../../data/projects";
import Aura from "../../components/public/hwagfu/Aura";
import FloatingOrbs from "../../components/public/hwagfu/FloatingOrbs";
import HeroScrollFx from "../../components/public/hwagfu/HeroScrollFx";
import RainbowText from "../../components/public/hwagfu/RainbowText";
import WorkStory from "../../components/public/hwagfu/WorkStory";
import ServicesStory from "../../components/public/hwagfu/ServicesStory";
import ProfileStory from "../../components/public/hwagfu/ProfileStory";
import CinematicAtmosphere from "../../components/public/cine/CinematicAtmosphere";
import { syncScrollFilmBeat, playHapticTick } from "../../utils/CinematicSoundEngine";
import "../../components/public/hwagfu/hwagfu.css";

/**
 * Mọi chữ trên trang này nằm ở khoá `intro.story.*` trong ba tệp locale
 * (vi/en/zh). Trước đây viết thẳng tiếng Việt vào file nên hai ngôn ngữ kia
 * không dịch được gì. Thêm chữ mới = thêm khoá ở cả ba tệp.
 */

// Trên điện thoại, nội dung hero chỉ cao ~540px giữa màn 852px nên phía dưới
// hở ra một mảng trống bằng nửa màn hình. Cho section cao tối thiểu bằng màn
// rồi căn giữa: nền và bong bóng lấp trọn khung đầu tiên.
function Hero({ name, t }) {
  return (
    <section
      data-anchor="hero"
      className="relative isolate flex min-h-[calc(100svh-4rem)] flex-col justify-center overflow-hidden px-5 pb-20 pt-16 sm:min-h-0 sm:px-8 sm:pb-36 sm:pt-32"
    >
      <Aura />
      <FloatingOrbs />
      <HeroScrollFx className="relative z-10 mx-auto flex max-w-5xl flex-col items-center text-center">
        {/* Cinematic Slate / Shot Index */}
        <div className="animate-rise inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.68rem] font-mono font-semibold tracking-[0.22em] text-[#00f0ff] uppercase backdrop-blur-md dark:border-white/10 dark:bg-black/30 mb-6">
          <span className="size-1.5 rounded-full bg-[#00f0ff] animate-pulse" />
          <span>SCENE 01 · THE HORIZON</span>
        </div>

        <h1 className="headline-hero text-foreground">
          {[t("intro.story.hero.line1"), t("intro.story.hero.line2")].map((line, index) => (
            <span key={line} className="animate-rise block text-foreground/90 dark:text-white" style={{ animationDelay: `${index * 110}ms` }}>
              {line}
            </span>
          ))}
          <span className="animate-rise block" style={{ animationDelay: "220ms" }}>
            <RainbowText>{t("intro.story.hero.line3")}</RainbowText>
          </span>
        </h1>
        <p className="animate-rise lede mt-7 max-w-3xl !text-foreground/75 dark:!text-white/75" style={{ animationDelay: "385ms" }}>
          {/* Tên người nằm giữa câu và phải in đậm, nên tách câu tại chỗ chèn
              thay vì nhét thẻ HTML vào tệp dịch. */}
          {t("intro.story.hero.lede", { name: "\u0000" })
            .split("\u0000")
            .flatMap((chunk, index) =>
              index === 0
                ? [chunk]
                : [<span key="name" className="font-semibold text-foreground underline decoration-[#00f0ff]/40 underline-offset-4">{name}</span>, chunk],
            )}
        </p>
        <div className="animate-rise mt-10 flex flex-col items-center gap-3 sm:flex-row" style={{ animationDelay: "495ms" }}>
          <a
            href="#contact"
            onClick={() => playHapticTick()}
            className="btn-primary"
          >
            {t("intro.story.hero.ctaStart")}
          </a>
          <a
            href="/cv/index.html"
            onClick={() => playHapticTick()}
            className="btn-secondary"
            aria-label={t("intro.story.hero.ctaCvAria", { name })}
          >
            {t("intro.story.hero.ctaCv")} <FileText className="h-4 w-4 text-[#00f0ff]" />
          </a>
        </div>
      </HeroScrollFx>
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
    <section id="contact" className="hwagfu-contact relative isolate overflow-hidden">
      <div className="hwagfu-contact-grid max-w-6xl mx-auto">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.68rem] font-mono font-semibold tracking-[0.22em] text-[#00f0ff] uppercase backdrop-blur-md dark:bg-black/30 mb-5">
            <span className="size-1.5 rounded-full bg-[#00f0ff]" />
            <span>SCENE 05 · EPILOGUE</span>
          </div>
          <h2>
            {t("intro.story.contact.heading1")}
            <br />
            <span>{t("intro.story.contact.heading2")}</span>
          </h2>
          <p>{t("intro.story.contact.desc")}</p>
          <a className="hwagfu-email group" href={`mailto:${email}`} onClick={() => playHapticTick()}>
            <i><Mail size={20} className="group-hover:scale-110 transition-transform" /></i>
            <span>{t("intro.story.contact.emailLabel")}<b>{email}</b></span>
          </a>
        </div>
        <form className="hwagfu-contact-card" onSubmit={submit}>
          <label>
            {t("intro.story.contact.nameLabel")}
            <input name="name" required placeholder={t("intro.story.contact.namePlaceholder")} />
          </label>
          <label>
            {t("intro.story.contact.emailFieldLabel")}
            <input name="email" type="email" required placeholder={t("intro.story.contact.emailPlaceholder")} />
          </label>
          <label>
            {t("intro.story.contact.messageLabel")}
            <textarea name="message" required placeholder={t("intro.story.contact.messagePlaceholder")} />
          </label>
          <button type="submit">{t("intro.story.contact.submit")}</button>
        </form>
      </div>
    </section>
  );
}

export default function IntroductionPage() {
  const { t } = useTranslation();
  const { data } = useData();
  const name = data?.profile?.fullName || "Peter Hugo Wishpax Lê";
  const email = data?.profile?.emailAddress || "contact@hugowishpax.studio";

  useEffect(() => {
    document.title = t("intro.apple.meta.title", "Peter Hugo Wishpax Lê — Portfolio");
  }, [t]);

  // Ba thẻ nổi bật lấy từ src/data/projects.js — cùng nguồn với trang /project.
  // Khối này dựng cho ĐÚNG BA thẻ, nên cắt ở ba: đánh dấu `featured` thêm dự án
  // thứ tư thì nó chờ tới lượt chứ không phá lưới.
  // Tagline lấy chung với trang /project (`projectsPage.items.*`), để một dự án
  // chỉ có MỘT câu giới thiệu trong cả ba ngôn ngữ.
  const projects = useMemo(
    () =>
      featuredProjects.slice(0, 3).map((project) => ({
        id: project.id,
        title: project.title,
        tagline: t(`projectsPage.items.${project.id}.tagline`, project.tagline),
        image: { src: shotUrl(project.id, project.cover || project.shots[0].src), alt: project.title },
      })),
    [t],
  );

  const serviceChapters = useMemo(
    () =>
      ["chapter1", "chapter2", "chapter3"].map((key) => ({
        eyebrow: t(`intro.story.services.${key}.eyebrow`),
        title: t(`intro.story.services.${key}.title`),
        description: t(`intro.story.services.${key}.description`),
      })),
    [t],
  );

  const education = useMemo(
    () =>
      [
        { key: "school1", year: "2023" },
        { key: "school2", year: "2027" },
      ].map(({ key, year }) => ({
        year,
        school: t(`intro.story.profile.${key}.school`),
        period: t(`intro.story.profile.${key}.period`),
        degree: t(`intro.story.profile.${key}.degree`),
        description: t(`intro.story.profile.${key}.description`),
      })),
    [t],
  );

  const promises = useMemo(
    () =>
      ["promise1", "promise2", "promise3"].map((key) => ({
        title: t(`intro.story.profile.${key}.title`),
        desc: t(`intro.story.profile.${key}.desc`),
      })),
    [t],
  );

  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll();

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    syncScrollFilmBeat(latest, [0.12, 0.38, 0.65, 0.88]);
  });

  return (
    <div ref={containerRef} className="hwagfu-copy relative">
      <CinematicAtmosphere />
      <Hero name={name} t={t} />
      <WorkStory
        label={t("intro.story.work.label")}
        heading={t("intro.story.work.heading")}
        subtitle={t("intro.story.work.subtitle")}
        viewAll={t("intro.story.work.viewAll")}
        projects={projects}
      />
      <ServicesStory
        label={t("intro.story.services.label")}
        heading={t("intro.story.services.heading")}
        chapters={serviceChapters}
        progressLabels={[
          t("intro.story.services.progress1"),
          t("intro.story.services.progress2"),
          t("intro.story.services.progress3"),
        ]}
        speedUnit={t("intro.story.services.speedUnit")}
        mergeLabel={t("intro.story.services.mergeLabel")}
        seoBurst={[t("intro.story.services.seoBurst1"), t("intro.story.services.seoBurst2")]}
        cta={t("intro.story.services.cta")}
      />
      <ProfileStory
        kicker={t("intro.story.profile.kicker")}
        heading={t("intro.story.profile.heading")}
        summary={t("intro.story.profile.summary")}
        educationHeading={t("intro.story.profile.educationHeading")}
        education={education}
        milestones={["2023", "2027", t("intro.story.profile.milestoneNow")]}
        techHeading={t("intro.story.profile.techHeading")}
        techNote={t("intro.story.profile.techNote")}
        categories={{
          frontend: t("intro.story.profile.catFrontend"),
          backend: t("intro.story.profile.catBackend"),
          database: t("intro.story.profile.catDatabase"),
          devops: t("intro.story.profile.catDevops"),
        }}
        promiseLabel={t("intro.story.profile.promiseLabel")}
        promiseHeading={t("intro.story.profile.promiseHeading")}
        promises={promises}
        cvLabel={t("intro.story.profile.cvLabel")}
      />
      <Contact email={email} t={t} />
    </div>
  );
}

