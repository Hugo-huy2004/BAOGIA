import { Link } from "react-router-dom";
import { useData } from "../context/DataContext";
import { useTranslation } from "react-i18next";

const footerLinkClass = "text-sm text-muted-foreground transition-colors hover:text-foreground";

export default function Footer() {
  const { data } = useData();
  const { t } = useTranslation();
  const email = data.profile.emailAddress || "hugowishpax@gmail.com";
  const zalo = data.profile.zaloNumber || "0839909399";

  return (
    <footer className="px-3 pb-3 pt-16 sm:px-4 sm:pb-4 md:px-6 md:pb-6 md:pt-24">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-border/55 bg-card/75 shadow-[0_20px_70px_hsl(var(--shadow)/0.07)] backdrop-blur-2xl md:rounded-[2.5rem]">
        <div className="grid gap-10 px-6 py-10 sm:px-8 md:grid-cols-[1.35fr_0.8fr_0.8fr] md:px-12 md:py-14">
          <div className="max-w-md">
            <Link to="/introduction" className="inline-flex items-center gap-2 text-xl font-extrabold tracking-[-0.03em] text-foreground">
              Hugo Studio
              <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {t("footer.tagline", "Một góc số dành cho người học, cá nhân và những cửa hàng nhỏ cần hiện diện chỉn chu trên internet.")}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <a href={`mailto:${email}`} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-muted/70 px-4 text-xs font-semibold text-foreground transition-colors hover:bg-muted">
                <span className="material-symbols-outlined text-[16px]">mail</span>
                Email
              </a>
              <a href={`https://zalo.me/${zalo}`} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-full bg-muted/70 px-4 text-xs font-semibold text-foreground transition-colors hover:bg-muted">
                <span className="material-symbols-outlined text-[16px]">chat_bubble</span>
                Zalo
              </a>
            </div>
          </div>

          <div>
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.12em] text-foreground">
              {t("footer.links", "Khám phá")}
            </p>
            <ul className="space-y-3">
              <li><Link to="/introduction" className={footerLinkClass}>{t("footer.introduction", "Giới thiệu")}</Link></li>
              <li><Link to="/student-benefits" className={footerLinkClass}>{t("navbar.studentBenefits", "Quyền lợi HSSV")}</Link></li>
              <li><Link to="/services" className={footerLinkClass}>{t("footer.services", "Dịch vụ")}</Link></li>
              <li><Link to="/faq" className={footerLinkClass}>{t("navbar.faq", "Hỏi đáp")}</Link></li>
            </ul>
          </div>

          <div>
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.12em] text-foreground">
              {t("footer.connect", "Bắt đầu")}
            </p>
            <ul className="space-y-3">
              <li><Link to="/booking" className={footerLinkClass}>{t("footer.booking", "Đặt lịch trao đổi")}</Link></li>
              <li><Link to="/login" className={footerLinkClass}>{t("navbar.login", "Đăng nhập")}</Link></li>
              <li>
                <button onClick={() => window.dispatchEvent(new CustomEvent("open-donation"))} className={footerLinkClass}>
                  {t("footer.supportServer", "Ủng hộ máy chủ")}
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-border/55 px-6 py-5 text-[11px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8 md:px-12">
          <p>© {new Date().getFullYear()} {data.profile.fullName || "Peter Hugo Wishpax Le"}</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link to="/privacy-policy" className="transition-colors hover:text-foreground">{t("footer.privacyPolicy", "Chính sách bảo mật")}</Link>
            <Link to="/user-guide" className="transition-colors hover:text-foreground">{t("footer.userGuide", "Hướng dẫn sử dụng")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
