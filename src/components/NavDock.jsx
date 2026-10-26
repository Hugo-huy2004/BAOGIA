import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { changeAppLanguage } from "../i18n/config";
import { SELECTABLE_LANGUAGES, languageCode } from "../i18n/languages";
import { getMemberSession, isAdminAuthenticated, isMemberAuthenticated } from "../services/api/core/authSession";

/**
 * Viên điều khiển của thanh điều hướng (26/10/2026): ngôn ngữ, ủng hộ, tài khoản
 * gom thành một khối thay vì ba nút xám rời nhau. Chỉ có ba ngôn ngữ chọn được
 * nên dùng công tắc trượt một chạm, không cần mở danh sách.
 */
const SHORT = { vi: "VI", en: "EN", zh: "中" };

export function LanguageSwitch({ className = "" }) {
  const { t, i18n } = useTranslation();
  const [busy, setBusy] = useState(false);
  const current = languageCode(i18n.resolvedLanguage || i18n.language);
  const index = SELECTABLE_LANGUAGES.findIndex((language) => language.code === current);

  const pick = async (code) => {
    if (code === current || busy) return;
    setBusy(true);
    try {
      await changeAppLanguage(code);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label={t("navbar.chooseLanguage")}
      className={`relative grid grid-cols-3 rounded-full p-0.5 ${className}`}
      style={{ "--i": Math.max(index, 0) }}
    >
      {/* Chữ Nôm không nằm trong công tắc: đang dùng Nôm thì không tô ô nào. */}
      <span
        aria-hidden="true"
        className={`absolute inset-y-0.5 left-0.5 w-[calc((100%-0.25rem)/3)] translate-x-[calc(var(--i)*100%)] rounded-full bg-background shadow-[0_1px_4px_rgb(0_0_0/0.14)] transition-transform duration-300 [transition-timing-function:cubic-bezier(.3,1.4,.5,1)] ${index < 0 ? "opacity-0" : ""}`}
      />
      {SELECTABLE_LANGUAGES.map((language) => (
        <button
          key={language.code}
          type="button"
          role="radio"
          aria-checked={language.code === current}
          aria-label={language.label}
          title={language.label}
          disabled={busy}
          onClick={() => pick(language.code)}
          className={`relative z-[1] min-w-9 rounded-full px-2 text-[11px] font-bold tracking-wide transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
            language.code === current ? "text-foreground" : "text-foreground/45 hover:text-foreground/80"
          }`}
        >
          {SHORT[language.code] || language.code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export function SupportHeart({ className = "", onDone }) {
  const { t } = useTranslation();
  const label = t("footer.supportServer", "Ủng hộ máy chủ");
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => {
        onDone?.();
        window.dispatchEvent(new CustomEvent("open-donation"));
      }}
      className={`group/heart grid place-items-center rounded-full text-foreground/60 transition-colors hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${className}`}
    >
      <span className="material-symbols-outlined text-[19px] transition-transform duration-300 group-hover/heart:animate-[heartbeat_1s_ease-in-out_infinite] group-hover/heart:[font-variation-settings:'FILL'_1]" aria-hidden="true">
        favorite
      </span>
    </button>
  );
}

/** Vòng màu thương hiệu quanh ảnh đại diện; đã đăng nhập thì hiện chữ cái đầu tên. */
export function AccountOrb({ className = "", onClick, size = "h-9 w-9" }) {
  const { t } = useTranslation();
  const session = getMemberSession();
  const path = isAdminAuthenticated() ? "/admin" : (isMemberAuthenticated() ? "/member" : "/login");
  const initial = (session?.displayName || "").trim().charAt(0).toUpperCase();
  return (
    <Link
      to={path}
      viewTransition
      onClick={onClick}
      aria-label={session ? t("navbar.account", "Tài khoản") : t("navbar.login", "Đăng nhập")}
      title={session?.displayName || t("navbar.login", "Đăng nhập")}
      className={`group/orb relative grid shrink-0 place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${size} ${className}`}
    >
      <span aria-hidden="true" className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,#22d3ee,#6366f1,#ec4899,#f59e0b,#22d3ee)] opacity-80 transition-opacity group-hover/orb:animate-[spin_2.4s_linear_infinite] group-hover/orb:opacity-100" />
      <span className="relative grid h-[calc(100%-4px)] w-[calc(100%-4px)] place-items-center overflow-hidden rounded-full bg-background text-foreground">
        {session?.avatarUrl ? (
          <img src={session.avatarUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
        ) : initial ? (
          <span className="text-[13px] font-extrabold">{initial}</span>
        ) : (
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">person</span>
        )}
      </span>
    </Link>
  );
}

export default function NavDock({ className = "" }) {
  return (
    <div className={`flex items-center gap-1 rounded-full border border-border/60 bg-muted/50 p-1 ${className}`}>
      <LanguageSwitch className="h-9" />
      <span aria-hidden="true" className="mx-0.5 h-5 w-px bg-border" />
      <SupportHeart className="h-9 w-9" />
      <AccountOrb />
    </div>
  );
}
