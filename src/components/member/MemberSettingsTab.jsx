import React, { useEffect, useState } from "react";
import { nom } from "../../lib/nomText";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Camera, Check, HugeIcon, Wallet } from "../ui/HugeIcon";
import { useIsMobile } from "../../hooks/useIsMobile";
import { sensory } from "../../lib/sensory";
import ToggleSwitch from "../common/ToggleSwitch";
import { pushService } from "../../services/pushService";
import { hapticSelect } from "../../utils/haptics";
import { getAuraTheme, resolveActivePortalTheme } from "../../data/auraThemes";
import { SUPPORTED_LANGUAGES, languageCode, languageLabel } from "../../i18n/languages";
import { changeAppLanguage } from "../../i18n/config";
import { useJoyStore } from "../../stores/joyStore";
import { useJoy } from "../../lib/joyDisplay";
import { fetchJoyPerks, fetchChallengeStatus } from "../../services/api/modules/joyApi";
import { isVoucherActive } from "./joy/voucherStatus";
import EcoToggle from "../../Save_E/EcoToggle";
import { getMemberToken } from "../../services/api/core/authSession";

const BiometricLoginCard = React.lazy(() => import("./BiometricLoginCard"));
const SecurityCenter = React.lazy(() => import("./account/SecurityCenter"));
const AccountSheet = React.lazy(() => import("./account/AccountSheet"));
const AccountThemeSheet = React.lazy(() => import("./account/AccountThemeSheet"));
const PersonalInfoSubTab = React.lazy(() => import("./PersonalInfoSubTab"));
const MemberDocReader = React.lazy(() => import("./account/MemberDocReader"));
const apiBase = import.meta.env.VITE_API_URL || "/api";

const SheetFallback = () => {
  const { t } = useTranslation();
  return (
    <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground">
      <div className="size-5 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
      <p className="text-xs font-medium">{t("memberPortal.accountHub.opening", nom("Đang tải..."))}</p>
    </div>
  );
};

const STANDARDIZED_DOCS = {
  "terms-manifest": {
    id: "terms-manifest",
    titleKey: "memberPortal.accountHub.documents.termsManifestTitle",
    defaultTitle: nom("Điều khoản dịch vụ & Tuyên ngôn hệ thống"),
    subtitle: "Cam kết vận hành bền vững, quyền lợi thành viên và nguyên tắc tương hỗ",
    badge: nom("Bản hiện hành"),
    icon: "gavel",
  },
  "database-policy": {
    id: "database-policy",
    titleKey: "memberPortal.accountHub.documents.databasePolicyTitle",
    defaultTitle: nom("Quy ước CSDL & Chính sách thành viên"),
    subtitle: nom("Kiến trúc CSDL Zero-Trust, quy chế ví JOY/JOY Gối Đầu và đặc quyền"),
    badge: nom("Quy ước hệ thống"),
    icon: "policy",
  },
};

const LEGACY_DOC_MAPPING = {
  "conditions": "terms-manifest",
  "rights-access": "terms-manifest",
  "full-text": "terms-manifest",
  "joy-rules": "database-policy",
  "privileges": "database-policy",
};

// Màn Tài khoản dùng CÙNG ngôn ngữ thiết kế với trang Today: thẻ kính trắng
// (bg-white/80 · viền trắng mờ · bo 24–30px) theo token portal nên tự lật
// sáng/tối, BorderBeam ở khối nổi bật + thanh điều hướng dính, liquid-gooey cho
// chip trên desktop, HugeIcon đơn sắc. Bản cũ tự dựng nền tối cố định #0c0d12,
// 4 quầng sáng mờ, mỗi dòng một ô gradient màu khác nhau và chữ 11–12px.
const GLASS = "swiftui-liquid-glass relative overflow-hidden rounded-[24px] divide-y divide-zinc-200/40 dark:divide-white/[0.06] shadow-[0_8px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)]";
const SHEEN = <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/80 dark:via-white/35 to-transparent" />;

function Section({ title, footer, children }) {
  return (
    <section className="min-w-0 space-y-2">
      {title && <h2 className="px-1 text-[13px] font-black uppercase tracking-wider text-muted-foreground">{title}</h2>}
      <div className={GLASS}>
        {SHEEN}
        {children}
      </div>
      {footer && <p className="px-1 text-[13px] text-muted-foreground">{footer}</p>}
    </section>
  );
}

function Row({ icon, title, subtitle, value, trailing, onClick, danger = false, external = false }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick ? () => { sensory.tap(); onClick(); } : undefined}
      className={`group flex min-h-[56px] w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${onClick ? "hover:bg-white/30 active:bg-zinc-100/40 dark:hover:bg-white/[0.04] dark:active:bg-white/[0.08]" : ""}`}
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${danger ? "bg-rose-500/10 text-rose-500" : "bg-zinc-100/70 text-foreground dark:bg-white/[0.08]"}`}>
        <HugeIcon name={icon} size={19} />
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-[15px] font-bold tracking-tight ${danger ? "text-rose-500" : "text-foreground"}`}>{title}</span>
        {subtitle && <span className="block truncate text-[13px] text-muted-foreground">{subtitle}</span>}
      </span>
      {value && <span className="shrink-0 text-[13px] font-bold tabular-nums text-muted-foreground">{value}</span>}
      {trailing && <span className="shrink-0">{trailing}</span>}
      {onClick && !trailing && (
        <HugeIcon name={external ? "open_in_new" : "chevron_right"} size={17} className="shrink-0 text-muted-foreground/70 transition-transform group-hover:translate-x-0.5" />
      )}
    </Tag>
  );
}

export default function MemberSettingsTab({
  memberSession,
  showToast,
  handleLogout,
  bio,
  formData,
  handleFieldChange,
  publicLink,
  saving,
  isDragOver,
  setIsDragOver,
  processFile,
  avatarInputRef,
  handleAvatarChange,
  handleRemoveAvatar,
  handleSave,
  handleDeleteBio,
  onBioUpdate,
  onSelectTab,
  onSelectUtility,
  accountSubTab,
}) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const currentView = accountSubTab === "setting" ? "setting" : "account";

  const [activeSheet, setActiveSheet] = useState(null);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [marketingEnabled, setMarketingEnabled] = useState(false);
  const [marketingBusy, setMarketingBusy] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);

  const joy = useJoy();
  const joyBalance = useJoyStore((state) => state.balance);

  const [perks, setPerks] = useState(null);
  const [perksLoaded, setPerksLoaded] = useState(false);
  const [challenges, setChallenges] = useState([]);
  const [challengesLoaded, setChallengesLoaded] = useState(false);

  const currentLang = languageCode(i18n.resolvedLanguage || i18n.language);
  const email = memberSession?.email || bio?.email || "—";
  const displayName =
    formData?.displayName ||
    bio?.displayName ||
    memberSession?.displayName ||
    t("memberPortal.navigation.memberFallback", nom("Thành viên Hugo"));

  // Lấy màu nền theme Aura hiện hành cho vùng avatar
  const activeThemeKey = resolveActivePortalTheme(bio);
  const themeConfig = getAuraTheme(activeThemeKey);
  const isMobile = useIsMobile();

  useEffect(() => {
    pushService.isSubscribed().then(setPushEnabled);
    setBiometricSupported(typeof window !== "undefined" && typeof window.PublicKeyCredential === "function");
    const token = getMemberToken();
    if (!token) return;
    fetch(`${apiBase}/profile/me/marketing`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setMarketingEnabled(Boolean(data.enabled));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!email || email === "—") return;
    fetchJoyPerks(bio)
      .then((data) => {
        setPerks(data);
        setPerksLoaded(true);
      })
      .catch(() => {});
    fetchChallengeStatus(email)
      .then((data) => {
        setChallenges(data);
        setChallengesLoaded(true);
      })
      .catch(() => {});
  }, [email, bio]);

  useEffect(() => {
    if (!accountSubTab || accountSubTab === "setting") return;
    const resolvedDocId = LEGACY_DOC_MAPPING[accountSubTab] || accountSubTab;
    if (STANDARDIZED_DOCS[resolvedDocId]) {
      setActiveSheet(`doc:${resolvedDocId}`);
    }
  }, [accountSubTab]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("hugo:fullsheet", { detail: { open: Boolean(activeSheet) } }));
    return () => window.dispatchEvent(new CustomEvent("hugo:fullsheet", { detail: { open: false } }));
  }, [activeSheet]);

  const activeVoucherCount = perksLoaded
    ? (perks?.vouchers || []).filter((v) => isVoucherActive(v)).length
    : (Array.isArray(bio?.serviceVouchers) ? bio.serviceVouchers.filter((v) => isVoucherActive(v)).length : 0);

  const completedMissionsCount = challenges.filter((c) => c.completed).length;

  const openSheet = (id) => {
    hapticSelect();
    setActiveSheet(id);
  };

  const closeSheet = () => {
    if (activeSheet?.startsWith("doc:")) {
      navigate("/member/account", { replace: true });
    }
    setActiveSheet(null);
  };

  const openUtility = (id) => {
    hapticSelect();
    if (onSelectUtility) onSelectUtility(id);
    else onSelectTab?.("utilities");
  };

  const handleTogglePush = async () => {
    setPushBusy(true);
    try {
      if (pushEnabled) {
        await pushService.unsubscribe();
        setPushEnabled(false);
        showToast?.(t("memberPortal.settings.pushDisabledToast", nom("Đã tắt thông báo đẩy")), "success");
      } else {
        const result = await pushService.subscribe(email);
        if (result === "granted") {
          setPushEnabled(true);
          showToast?.(t("memberPortal.settings.pushEnabledToast", nom("Đã bật thông báo đẩy")), "success");
        }
      }
    } catch {
      showToast?.(t("memberPortal.settings.pushErrorToast", nom("Không thể cài đặt thông báo")), "error");
    } finally {
      setPushBusy(false);
    }
  };

  const handleToggleMarketing = async () => {
    setMarketingBusy(true);
    try {
      const token = getMemberToken();
      const next = !marketingEnabled;
      const res = await fetch(`${apiBase}/profile/me/marketing`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        credentials: "include",
        body: JSON.stringify({ enabled: next }),
      });
      if (!res.ok) throw new Error("marketing preference failed");
      setMarketingEnabled(next);
      showToast?.(next ? nom("Đã bật email cập nhật Hugo Studio") : nom("Đã tắt email cập nhật Hugo Studio"), "success");
    } catch {
      showToast?.(nom("Không thể cập nhật tùy chọn email"), "error");
    } finally {
      setMarketingBusy(false);
    }
  };

  const selectLanguage = async (code) => {
    if (code === currentLang) return;
    await changeAppLanguage(code);
  };

  const views = [
    { id: "account", label: t("memberPortal.navigation.account", nom("Tài khoản")), icon: "person", path: "/member/account" },
    { id: "setting", label: nom("Cài đặt"), icon: "settings", path: "/member/account/setting" },
  ];
  const chip = (view) => {
    const active = currentView === view.id;
    return (
      <button
        type="button"
        onClick={() => { sensory.tap(); navigate(view.path); }}
        aria-current={active ? "page" : undefined}
        className={`flex min-h-[40px] items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-[13px] font-extrabold shadow-sm transition-all active:scale-95 ${
          active ? "bg-foreground text-background shadow-md" : "bg-zinc-100/80 text-muted-foreground hover:bg-zinc-200/70 hover:text-foreground dark:bg-white/[0.06] dark:hover:bg-white/[0.1]"
        }`}
      >
        <HugeIcon name={view.icon} size={15} />
        <span>{view.label}</span>
      </button>
    );
  };

  return (
    <section className="mx-auto flex w-full max-w-3xl min-w-0 flex-col space-y-4 pb-36 sm:space-y-5 sm:pb-24" aria-labelledby="account-title">
      {/* Ẩn file input phục vụ đổi ảnh đại diện */}
      <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

      {/* ── 1. ĐẦU TRANG — Chuẩn Apple Liquid Glass (Nhỏ gọn, thông minh, chống tràn tên dài) ── */}
      <header className="swiftui-liquid-glass relative overflow-hidden rounded-[24px] p-3.5 sm:p-5 shadow-[0_8px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
        {SHEEN}
        <div className="relative z-10 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Vùng hồ sơ chính: Avatar + Tên + Badge + Email */}
          <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => avatarInputRef?.current?.click()}
              aria-label={nom("Đổi ảnh đại diện")}
              className="group relative shrink-0 transition-transform active:scale-95"
            >
              <span className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center overflow-hidden rounded-full bg-blue-600 text-xl sm:text-2xl font-black text-white ring-2 ring-white/90 shadow-md transition-all group-hover:ring-blue-400 dark:ring-white/15">
                {formData?.avatarUrl
                  ? <img className="h-full w-full object-cover" src={formData.avatarUrl} alt={displayName} />
                  : displayName[0]?.toUpperCase()}
              </span>
              <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full border border-white bg-foreground text-background shadow-xs transition-transform group-hover:scale-110 dark:border-[#13131c]">
                <Camera className="size-2.5 sm:size-3" strokeWidth={2.2} />
              </span>
            </button>

            <div
              className="min-w-0 flex-1 space-y-0.5 cursor-pointer select-none"
              onClick={() => openSheet("personal")}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") openSheet("personal"); }}
              aria-label={nom("Xem và sửa thông tin cá nhân")}
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[11px] font-bold text-blue-600 dark:text-blue-400">
                  <Check className="size-3" strokeWidth={2.5} />
                  <span>{bio?.isEduVerified ? nom("HSSV đã xác minh") : nom("Thành viên chính thức")}</span>
                </span>
              </div>
              <h1
                id="account-title"
                className="break-words text-[17px] sm:text-[20px] font-black leading-snug tracking-tight text-foreground line-clamp-2"
                title={displayName}
              >
                {displayName}
              </h1>
              <p className="truncate text-[12px] font-medium text-muted-foreground" title={email}>
                {email}
              </p>
            </div>

            <button
              type="button"
              onClick={() => openSheet("personal")}
              aria-label={nom("Chỉnh sửa thông tin cá nhân")}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/60 bg-white/40 text-muted-foreground transition-all hover:bg-white hover:text-foreground active:scale-95 dark:border-white/10 dark:bg-white/[0.06] dark:hover:bg-white/[0.15]"
              title={nom("Chỉnh sửa hồ sơ")}
            >
              <HugeIcon name="edit" size={15} />
            </button>
          </div>

          {/* Khối Ví JOY — Dải kính siêu gọn (Sleek Apple Wallet Capsule) */}
          <div className="w-full md:w-auto md:shrink-0">
            <button
              type="button"
              onClick={() => openUtility("joy_wallet")}
              className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-white/70 bg-white/45 px-3 py-2 text-left shadow-2xs backdrop-blur-xl transition-all hover:bg-white/70 active:scale-[0.99] dark:border-white/10 dark:bg-white/[0.05] dark:hover:bg-white/[0.09] md:min-w-[270px] sm:px-3.5 sm:py-2.5"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xs shadow-blue-500/20">
                  <Wallet className="size-4" strokeWidth={2} />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Ví JOY</span>
                    <span className="text-[14px] sm:text-[15px] font-black tabular-nums tracking-tight text-foreground">
                      {joy.number(joyBalance || 0)} {joy.code}
                    </span>
                  </div>
                  <div className="truncate text-[11px] sm:text-[11.5px] text-muted-foreground">
                    {activeVoucherCount} {nom("voucher")} · {challengesLoaded ? `${completedMissionsCount}/${challenges.length} ${nom("nhiệm vụ")}` : nom("đang đồng bộ")}
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1 text-[11.5px] font-semibold text-muted-foreground/80">
                <HugeIcon name="chevron_right" size={16} className="text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* ── 2. THANH ĐIỀU HƯỚNG DÍNH — cùng khuôn thanh chuyên mục của Today ── */}
      <div className="sticky top-2 z-20 w-full min-w-0">
        <div className="relative flex items-center justify-between gap-1.5 overflow-hidden rounded-[24px] border border-white/70 bg-white/70 p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] backdrop-blur-3xl dark:border-white/12 dark:bg-white/[0.06] dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
          {SHEEN}
          <div className="min-w-0 flex-1 overflow-x-auto scrollbar-hide">
            <div className="flex min-w-max items-center gap-1.5">
              {views.map((v) => (
                <div key={v.id} className="transition-transform duration-200 active:scale-95">
                  {chip(v)}
                </div>
              ))}
            </div>
          </div>
          <div className="flex shrink-0 items-center border-l border-zinc-200/60 pl-1.5 dark:border-white/10">
            <button
              type="button"
              onClick={() => { sensory.tap(); navigate("/member/activity"); }}
              aria-label={nom("Thông báo")}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/60 bg-zinc-100/90 text-muted-foreground shadow-xs transition-all hover:bg-white hover:text-foreground active:scale-90 dark:border-white/12 dark:bg-white/[0.08] dark:hover:bg-white/[0.18]"
            >
              <HugeIcon name="notifications" size={17} />
            </button>
          </div>
        </div>
      </div>

      {/* ── 3. NỘI DUNG ──────────────────────────────────────────────────── */}
      {currentView === "account" && (
        <div className="grid gap-4 sm:gap-5 md:grid-cols-2 md:items-start">
          <Section title={nom("Hồ sơ")}>
            <Row icon="person" title={nom("Thông tin cá nhân")} subtitle={nom("Tên, liên hệ, học vấn")} onClick={() => openSheet("personal")} />
            <Row icon="link" title={nom("Trang Hugo Bio")} subtitle={publicLink ? nom("Xem và tuỳ biến trang của bạn") : nom("Tạo trang Bio cá nhân")} onClick={() => openUtility("bio")} />
            <Row icon="activity" title={nom("Nhật ký hoạt động")} subtitle={nom("Bảo mật, quà tặng, lịch sử")} onClick={() => navigate("/member/activity")} />
          </Section>

          <Section title={nom("Phần thưởng")}>
            <Row icon="clipboard_list" title={nom("Nhiệm vụ JOY")} value={challengesLoaded ? `${completedMissionsCount}/${challenges.length}` : undefined} onClick={() => openUtility("joy_wallet")} />
            <Row icon="gift" title={nom("Voucher của tôi")} value={String(activeVoucherCount)} onClick={() => openUtility("joy_wallet")} />
            <Row icon="award" title={nom("Đặc quyền thành viên")} subtitle={bio?.isEduVerified ? nom("Đặc quyền HSSV") : nom("Thành viên chính thức")} onClick={() => openUtility("joy_wallet")} />
          </Section>

          <Section title={nom("Khác")}>
            <Row icon="settings" title={nom("Cài đặt")} subtitle={nom("Giao diện, ngôn ngữ, thông báo, bảo mật")} onClick={() => navigate("/member/account/setting")} />
            <Row icon="file_check" title={nom("Điều khoản & chính sách")} onClick={() => navigate("/member/account/terms-manifest")} />
          </Section>

          <Section>
            <Row icon="logout" title={nom("Đăng xuất")} subtitle={nom("Đăng xuất khỏi thiết bị này")} danger onClick={handleLogout} />
          </Section>
        </div>
      )}

      {currentView === "setting" && (
        <div className="grid gap-4 sm:gap-5 md:grid-cols-2 md:items-start">
          <Section title={nom("Giao diện")}>
            <Row icon="palette" title={nom("Nền & Theme Aura")} value={themeConfig?.name || nom("Mặc định")} onClick={() => openSheet("themes")} />
            <Row icon="globe" title={nom("Ngôn ngữ")} value={languageLabel(currentLang)} onClick={() => openSheet("language")} />
          </Section>

          {/* EcoToggle là cả một thẻ giải thích (tự ẩn trên máy không đủ điều kiện),
              không phải công tắc — bản cũ nhét nó vào cuối một dòng nên bị bóp méo. */}
          <div className="min-w-0 md:row-span-2"><EcoToggle /></div>

          <Section title={nom("Bảo mật")}>
            <Row icon="shield_check" title={nom("Sinh trắc học & PIN")} value={biometricSupported ? nom("Đã bật") : nom("Chưa bật")} onClick={() => openSheet("security")} />
            <Row icon="lock" title={nom("Quyền truy cập thiết bị")} subtitle={nom("Camera, micro, thông báo")} onClick={() => { hapticSelect(); window.dispatchEvent(new Event("hugo:show-permission-primer")); }} />
          </Section>

          <Section title={nom("Thông báo")}>
            <Row icon="bell" title={nom("Thông báo ứng dụng")} subtitle={nom("Bảo mật và biến động số dư")} trailing={<ToggleSwitch checked={pushEnabled} onChange={handleTogglePush} disabled={pushBusy} label={nom("Thông báo ứng dụng")} />} />
            <Row icon="mail" title={nom("Email cập nhật Hugo")} subtitle={nom("Mẹo thành viên và tư vấn website")} trailing={<ToggleSwitch checked={marketingEnabled} onChange={handleToggleMarketing} disabled={marketingBusy} label={nom("Email cập nhật")} />} />
          </Section>

          <Section title={nom("Văn bản & quy ước")}>
            {Object.values(STANDARDIZED_DOCS).map((doc) => (
              <Row key={doc.id} icon={doc.icon === "gavel" ? "file_check" : "shield_check"} title={doc.defaultTitle} subtitle={doc.badge} onClick={() => navigate(`/member/account/${doc.id}`)} />
            ))}
            <Row icon="book_open" title={nom("Cẩm nang quy ước toàn diện")} external onClick={() => window.open("/terms-and-guide", "_blank", "noopener")} />
          </Section>

          {bio?._id && (
            <Section footer={nom("Gỡ bỏ hoàn toàn dữ liệu trang Bio cá nhân. Không thể hoàn tác.")}>
              <Row icon="delete" title={nom("Gỡ bỏ dịch vụ Bio")} danger onClick={handleDeleteBio} />
            </Section>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. SHEET MODALS & DIALOGS
         ───────────────────────────────────────────────────────────── */}
      {activeSheet === "personal" && (
        <React.Suspense fallback={<SheetFallback />}>
          <AccountSheet
            title={t("memberPortal.account.personalInformation", nom("Thông tin cá nhân"))}
            subtitle={t("memberPortal.account.personalInformationDescription", nom("Cập nhật thông tin chi tiết"))}
            onClose={closeSheet}
            wide
          >
            <PersonalInfoSubTab
              formData={formData}
              handleFieldChange={handleFieldChange}
              handleSave={async (event) => {
                await handleSave(event);
                closeSheet();
              }}
              saving={saving}
              isDragOver={isDragOver}
              setIsDragOver={setIsDragOver}
              processFile={processFile}
              avatarInputRef={avatarInputRef}
              handleAvatarChange={handleAvatarChange}
              handleRemoveAvatar={handleRemoveAvatar}
              memberSession={memberSession}
              bio={bio}
              hideAvatarSection={false}
              t={t}
            />
          </AccountSheet>
        </React.Suspense>
      )}

      {activeSheet === "themes" && (
        <React.Suspense fallback={<SheetFallback />}>
          <AccountSheet
            title={t("memberPortal.accountProfile.personalTheme", nom("Nền & Theme Aura"))}
            subtitle={t("memberPortal.settings.customizeThemeDesc", nom("Tùy chỉnh giao diện portal"))}
            onClose={closeSheet}
            wide
          >
            <AccountThemeSheet bio={bio} showToast={showToast} onBioUpdate={onBioUpdate} />
          </AccountSheet>
        </React.Suspense>
      )}

      {activeSheet?.startsWith("doc:") && (
        <AccountSheet
          title={
            STANDARDIZED_DOCS[activeSheet.replace("doc:", "")]?.defaultTitle ||
            t("memberPortal.accountProfile.memberDocuments", nom("Tài liệu quy chuẩn"))
          }
          onClose={closeSheet}
          wide
        >
          <React.Suspense fallback={<SheetFallback />}>
            <MemberDocReader docId={activeSheet.replace("doc:", "")} />
          </React.Suspense>
        </AccountSheet>
      )}

      {activeSheet === "security" && (
        <React.Suspense fallback={<SheetFallback />}>
          <AccountSheet
            title={t("memberPortal.accountProfile.security", nom("Bảo mật tài khoản"))}
            onClose={closeSheet}
          >
            <div className="space-y-5">
              <SecurityCenter />
              <div className="border-t border-border pt-4">
                {biometricSupported && email ? (
                  <BiometricLoginCard memberSession={memberSession} showToast={showToast} bare />
                ) : (
                  <p className="text-[13px] text-muted-foreground">
                    {t("memberPortal.settings.biometricNotSupported", nom("Thiết bị không hỗ trợ đăng nhập sinh trắc học"))}
                  </p>
                )}
              </div>
            </div>
          </AccountSheet>
        </React.Suspense>
      )}

      {activeSheet === "language" && (
        <AccountSheet
          title={t("memberPortal.accountProfile.systemLanguage", nom("Chọn ngôn ngữ"))}
          onClose={closeSheet}
        >
          <div className="space-y-2">
            {SUPPORTED_LANGUAGES.map((lng) => {
              const active = currentLang === lng.code;
              return (
                <button
                  key={lng.code}
                  onClick={async () => {
                    await selectLanguage(lng.code);
                    closeSheet();
                  }}
                  className={`flex min-h-[48px] w-full items-center justify-between rounded-xl border px-4 text-[14px] transition-all ${
                    active
                      ? "border-primary bg-primary/10 font-bold text-primary"
                      : "border-border bg-card text-foreground hover:bg-muted/50 font-medium"
                  }`}
                >
                  <span>{lng.label}</span>
                  {active && <Check className="size-4 text-primary" />}
                </button>
              );
            })}
          </div>
        </AccountSheet>
      )}
    </section>
  );
}
