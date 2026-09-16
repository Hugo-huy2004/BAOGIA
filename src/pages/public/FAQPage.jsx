import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import "../../components/public/hwagfu/hwagfu.css";
import { useHeadMeta } from "../../hooks/useHeadMeta";
import { useJsonLd } from "../../hooks/useJsonLd";
import { API_BASE } from "../../config/apiBase";

/**
 * /faq — một câu hỏi, một câu trả lời, không có gì khác trên đường đi.
 *
 * Trang này cố tình trơn: một nền, không quầng sáng, không chữ đổ màu, không
 * dải nền đổi tông. Thứ duy nhất được phép nổi lên là câu hỏi và nút đặt lịch.
 *
 * Toàn bộ chữ nằm trong i18n (`faqPage.*`, 9 ngôn ngữ) nên trang này chỉ dựng
 * hình; thêm câu hỏi thì thêm một phần tử vào `FAQS` và một khoá dịch cùng chỉ
 * số — hai bên phải khớp thứ tự, đó là lý do mảng dưới đây chỉ có icon.
 */

const FAQS = [
  { icon: "schedule" },
  { icon: "group" },
  { icon: "featured_seasonal_and_gifts", actionLink: "/student-pricing" },
  { icon: "payments" },
  { icon: "flight_takeoff" },
];

export default function FAQPage() {
  const { t, i18n } = useTranslation();

  useHeadMeta({
    title: t("faqPage.meta.title"),
    description: t("faqPage.meta.description"),
    keywords: t("faqPage.meta.keywords"),
    canonicalUrl: "https://www.hugowishpax.studio/faq",
  });

  useJsonLd(
    "faq-schema",
    useMemo(
      () => ({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: FAQS.map((_, idx) => ({
          "@type": "Question",
          name: t(`faqPage.faqs.${idx}.question`),
          acceptedAnswer: { "@type": "Answer", text: t(`faqPage.faqs.${idx}.answer`) },
        })),
      }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [t, i18n.language],
    ),
  );

  return (
    <div className="hwagfu-copy text-foreground">
      {/* ── Đầu trang ──────────────────────────────────────── */}
      <section className="bg-background px-5 pb-12 pt-28 sm:px-8 sm:pb-16 sm:pt-32">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium text-muted-foreground">{t("faqPage.header.badge")}</p>
          <h1 className="mt-4 text-[clamp(2.6rem,1.9rem+2.6vw,4rem)] font-semibold leading-[1.05] tracking-[-.04em]">
            {t("faqPage.header.title1")} {t("faqPage.header.title2")}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-[1.05rem] leading-8 text-muted-foreground">
            {t("faqPage.header.desc")}
          </p>
        </div>
      </section>

      {/* ── Danh sách câu hỏi ──────────────────────────────── */}
      <section className="bg-background px-5 pb-16 sm:px-8 sm:pb-24">
        <div className="mx-auto max-w-3xl border-t border-border">
          {FAQS.map((faq, idx) => (
            <details key={faq.icon} className="group border-b border-border py-5" open={idx === 0}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-1 text-[1.05rem] font-medium leading-snug tracking-[-.015em]">
                {t(`faqPage.faqs.${idx}.question`)}
                <span className="shrink-0 text-2xl font-light text-muted-foreground transition-transform group-open:rotate-45" aria-hidden>
                  +
                </span>
              </summary>
              <div className="mt-3">
                <p className="max-w-2xl text-[0.98rem] leading-8 text-muted-foreground">
                  {t(`faqPage.faqs.${idx}.answer`)}
                </p>
                {faq.actionLink ? (
                  <Link to={faq.actionLink} className="link-more mt-4 inline-flex items-center gap-1.5 text-sm">
                    {t(`faqPage.faqs.${idx}.actionText`)} <ArrowRight size={14} />
                  </Link>
                ) : null}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* ── Vẫn còn thắc mắc ───────────────────────────────── */}
      <section className="border-t border-border bg-background px-5 py-20 text-center sm:px-8 sm:py-24">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-[clamp(1.9rem,1.5rem+1.4vw,2.6rem)] font-semibold leading-tight tracking-[-.035em]">
            {t("faqPage.contact.title")}
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[1.02rem] leading-8 text-muted-foreground">
            {t("faqPage.contact.desc")}
          </p>
          {/* Một lối đi chính: đặt lịch. Hai kênh còn lại tụt xuống thành chữ,
              vì ba cái nút ngang hàng nhau là ba lần bắt người ta phải chọn. */}
          <div className="mt-8 flex justify-center">
            <Link to="/booking" className="btn-primary">
              {t("navbar.booking", "Đặt lịch")} <CalendarCheck size={17} />
            </Link>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            <a href={`${API_BASE}/contact/zalo`} target="_blank" rel="noreferrer" className="link-more">
              {t("faqPage.contact.chatBtn")}
            </a>
            <span aria-hidden className="mx-2 opacity-50">·</span>
            <a href="mailto:contact@hugowishpax.studio" className="link-more">
              {t("faqPage.contact.emailBtn")}
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
