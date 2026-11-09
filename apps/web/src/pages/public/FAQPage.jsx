import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import "../../components/public/hwagfu/hwagfu.css";
import "./sticker-pages.css";
import { useServicesFonts } from "../../hooks/useServicesFonts";
import { useHeadMeta } from "../../hooks/useHeadMeta";
import { useJsonLd } from "../../hooks/useJsonLd";
import { API_BASE } from "../../config/apiBase";
import { createMailtoUrl } from "../../../../../packages/shared/emailChannels";

/**
 * /faq — một câu hỏi, một câu trả lời. 09/11/2026: cùng chất sticker neon với
 * trang Dịch vụ — mỗi câu hỏi là một nhãn dán có icon màu, mở ra mới đọc; khối
 * liên hệ là một thẻ màu với đúng một nút chính (đặt lịch).
 *
 * Toàn bộ chữ nằm trong i18n (`faqPage.*`, 9 ngôn ngữ) nên trang này chỉ dựng
 * hình; thêm câu hỏi thì thêm một phần tử vào `FAQS` và một khoá dịch cùng chỉ
 * số — hai bên phải khớp thứ tự, đó là lý do mảng dưới đây chỉ có icon.
 */

const FAQS = [
  { icon: "schedule", tone: "#00f5d4" },
  { icon: "group", tone: "#ff2e93" },
  { icon: "featured_seasonal_and_gifts", tone: "#c6ff00" },
  { icon: "payments", tone: "#ffe53b" },
  { icon: "flight_takeoff", tone: "#2f6bff" },
];

export default function FAQPage() {
  const { t, i18n } = useTranslation();
  useServicesFonts();

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

  // Chỉ in TÊN kênh, không in địa chỉ email lên trang (user 09/11: bảo mật
  // thông tin) — địa chỉ chỉ nằm trong liên kết mailto do emailChannels dựng.
  const mails = [
    ["support", "support_agent", t("faqPage.contact.mailSupport", "Hỗ trợ")],
    ["education", "school", t("faqPage.contact.mailEducation", "Học tập")],
    ["contact", "work", t("faqPage.contact.mailProject", "Dự án")],
  ];

  return (
    <div className="hwagfu-copy sk-page">
      <header className="sk-head">
        <p className="sk-kicker">{t("faqPage.header.badge")}</p>
        <h1 className="sk-title">{t("faqPage.header.title1")} <em>{t("faqPage.header.title2")}</em></h1>
        <p className="sk-lede">{t("faqPage.header.desc")}</p>
      </header>

      <div className="sk-faq">
        {FAQS.map((faq, idx) => (
          <details key={faq.icon} open={idx === 0} style={{ "--tone": faq.tone }}>
            <summary>
              <span aria-hidden className="material-symbols-outlined sk-faq__icon">{faq.icon}</span>
              <b>{t(`faqPage.faqs.${idx}.question`)}</b>
              <span aria-hidden className="sk-faq__plus">+</span>
            </summary>
            <p>{t(`faqPage.faqs.${idx}.answer`)}</p>
            {faq.actionLink ? (
              <Link to={faq.actionLink} className="sk-faq__more">
                {t(`faqPage.faqs.${idx}.actionText`)} <ArrowRight size={14} />
              </Link>
            ) : null}
          </details>
        ))}
      </div>

      {/* Một lối đi chính: đặt lịch. Nhắn tin và email tụt xuống thành nhãn nhỏ. */}
      <section className="sk-contact">
        <h2>{t("faqPage.contact.title")}</h2>
        <p>{t("faqPage.contact.desc")}</p>
        <div className="sk-contact__actions">
          <Link to="/booking" className="sk-btn">{t("navbar.booking", "Đặt lịch")} <CalendarCheck size={18} /></Link>
          <a href={`${API_BASE}/contact/zalo`} target="_blank" rel="noreferrer" className="sk-btn sk-btn--light">{t("faqPage.contact.chatBtn")}</a>
        </div>
        <ul className="sk-mails">
          {mails.map(([channel, icon, label]) => (
            <li key={channel}>
              <a href={createMailtoUrl(channel, { lang: i18n.language })} aria-label={`Email · ${label}`}>
                <span aria-hidden className="material-symbols-outlined">{icon}</span>{label}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
