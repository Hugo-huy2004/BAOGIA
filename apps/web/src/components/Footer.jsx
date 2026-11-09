import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import HugoLogo from "./HugoLogo";
import { API_BASE } from "../config/apiBase";
import { DONATION_CONFIG } from "../config/donationConfig";
import { STUDIO_SOCIAL_LINKS } from "../config/studioSocialLinks";
import { servicePackages } from "../data/servicePackages";
import { SocialBrandIcon } from "../utils/socialBrandHelper";
import { EMAIL_CHANNELS, createMailtoUrl } from "../../../../packages/shared/emailChannels";
import "./footer.css";

// Footer theo portfolio.hugowishpax.studio (08/11/2026): nền gần đen, cột
// thương hiệu + bốn cột liên kết, dòng bản quyền và chữ "HUGO STUDIO" chìm.
// Băng logo "chứng nhận" cũ đã bỏ: phần lớn không phải chứng nhận thật.
const COPY = {
  vi: { packages: "Gói dịch vụ", contact: "Liên hệ", support: "Ủng hộ", about: "Giới thiệu", all: "Bảng giá đầy đủ →",
    rights: "Dự án cá nhân, phi lợi nhuận." },
  en: { packages: "Packages", contact: "Contact", support: "Support", about: "About", all: "Full pricing →",
    rights: "A personal, nonprofit project." },
  zh: { packages: "服务套餐", contact: "联系", support: "支持", about: "关于", all: "完整价格 →",
    rights: "个人非营利项目。" },
};

export default function Footer() {
  const { t, i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage || "vi").slice(0, 2);
  const c = COPY[lang] || COPY.en;

  return (
    <footer className="hs-footer">
      <div className="hs-footer__inner">
        <div className="hs-footer__grid">
          <div className="hs-footer__brand-col">
            <Link to="/" className="hs-footer__brand" aria-label="Hugo Studio">
              <HugoLogo className="h-8 w-8" /><span translate="no">Hugo Studio</span>
            </Link>
            <p className="hs-footer__bio">{t("footer.tagline")}</p>
            <nav aria-label={t("servicePkg.page.socialLinks")} className="hs-footer__socials">
              {STUDIO_SOCIAL_LINKS.map(({ labelKey, fallbackLabel, href, platform }) => {
                const label = t(`servicePkg.page.${labelKey}`, { defaultValue: fallbackLabel });
                return (
                  <a key={labelKey} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label}>
                    <SocialBrandIcon platform={platform} className="size-[18px]" />
                  </a>
                );
              })}
            </nav>
          </div>

          <div className="hs-footer__col">
            <h4>{c.packages}</h4>
            <ul>
              {servicePackages.map((pkg) => <li key={pkg.id}><Link to={`/services/${pkg.slug}`} translate="no">{pkg.name}</Link></li>)}
              <li><Link to="/services#services-packages">{c.all}</Link></li>
            </ul>
          </div>

          <div className="hs-footer__col">
            <h4>{c.contact}</h4>
            <ul>
              <li><Link to="/services#dat-lich">{t("footer.booking", "Đặt lịch")}</Link></li>
              <li><a href={`${API_BASE}/contact/zalo`} target="_blank" rel="noreferrer">Zalo</a></li>
              {Object.values(EMAIL_CHANNELS).map((channel) => (
                <li key={channel.id}><a href={createMailtoUrl(channel.id, { lang })}>{channel.label[lang] || channel.label.vi}</a></li>
              ))}
            </ul>
          </div>

          <div className="hs-footer__col">
            <h4>{c.support}</h4>
            <ul>
              <li><button type="button" onClick={() => window.dispatchEvent(new CustomEvent("open-donation"))}>{t("footer.supportServer", "Ủng hộ máy chủ")}</button></li>
              <li><a href={DONATION_CONFIG.buyMeACoffeeUrl} target="_blank" rel="noopener noreferrer">Buy Me a Coffee</a></li>
              <li><a href={DONATION_CONFIG.kofiUrl} target="_blank" rel="noopener noreferrer">Ko-fi</a></li>
              <li><a href={DONATION_CONFIG.paypalUrl} target="_blank" rel="noopener noreferrer">PayPal</a></li>
              <li><a href={DONATION_CONFIG.githubSponsorsUrl} target="_blank" rel="noopener noreferrer">GitHub Sponsors</a></li>
            </ul>
          </div>

          <div className="hs-footer__col">
            <h4>{c.about}</h4>
            <ul>
              <li><a href="https://portfolio.hugowishpax.studio/">{t("footer.introduction", "Giới thiệu")}</a></li>
              <li><Link to="/project">{t("projectsPage.navLabel", "Dự án")}</Link></li>
              <li><Link to="/faq">{t("navbar.faq", "Hỏi đáp")}</Link></li>
              <li><Link to="/terms">{t("footer.terms", "Điều khoản sử dụng")}</Link></li>
              <li><Link to="/privacy-policy">{t("footer.privacyPolicy", "Chính sách bảo mật")}</Link></li>
              <li><Link to="/login">{t("navbar.login", "Đăng nhập")}</Link></li>
            </ul>
          </div>
        </div>

        <div className="hs-footer__copyright">
          <p>© {new Date().getFullYear()} Hugo Studio · Hugo Wishpax. {c.rights}</p>
        </div>
        <div className="hs-footer__watermark" aria-hidden="true" translate="no">HUGO STUDIO</div>
      </div>
    </footer>
  );
}
