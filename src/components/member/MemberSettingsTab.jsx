import React, { useEffect, useState } from "react";
import { nom } from "../../lib/nomText";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ChevronLeft,
  ChevronRight,
  Bell,
  Edit3,
  Activity,
  Award,
  Star,
  Heart,
  FileCheck2,
  LogOut,
  Globe,
  Lock,
  ShieldCheck,
  SlidersHorizontal,
  Wallet,
  Camera,
  Check,
  Trash2,
  ClipboardList,
  Sparkles,
  Zap,
  Palette,
  ExternalLink,
  GraduationCap,
  BookOpen,
} from "../ui/HugeIcon";
import { pushService } from "../../services/pushService";
import { webauthnHelper } from "../../utils/webauthnHelper";
import { hapticSelect } from "../../utils/haptics";
import { getAuraTheme, resolveActivePortalTheme } from "../../data/auraThemes";
import { SUPPORTED_LANGUAGES, languageCode, languageLabel } from "../../i18n/languages";
import { changeAppLanguage } from "../../i18n/config";
import { useJoyStore } from "../../stores/joyStore";
import { useJoy } from "../../lib/joyDisplay";
import { fetchJoyPerks, fetchChallengeStatus } from "../../services/api/modules/joyApi";
import { isVoucherActive } from "./joy/voucherStatus";
import BiometricLoginCard from "./BiometricLoginCard";
import SecurityCenter from "./account/SecurityCenter";
import ToggleSwitch from "../common/ToggleSwitch";
import EcoToggle from "../../Save_E/EcoToggle";
import { getMemberToken } from "../../services/api/core/authSession";

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
    icon: FileCheck2,
    gradient: "from-blue-500 via-indigo-600 to-purple-600",
    shadow: "shadow-md shadow-blue-500/25",
  },
  "database-policy": {
    id: "database-policy",
    titleKey: "memberPortal.accountHub.documents.databasePolicyTitle",
    defaultTitle: nom("Quy ước CSDL & Chính sách thành viên"),
    subtitle: nom("Kiến trúc CSDL Zero-Trust, quy chế ví JOY/JOY Gối Đầu và đặc quyền"),
    badge: nom("Quy ước hệ thống"),
    icon: ShieldCheck,
    gradient: "from-emerald-400 via-teal-500 to-green-600",
    shadow: "shadow-md shadow-emerald-500/25",
  },
};

const LEGACY_DOC_MAPPING = {
  "conditions": "terms-manifest",
  "rights-access": "terms-manifest",
  "full-text": "terms-manifest",
  "joy-rules": "database-policy",
  "privileges": "database-policy",
};

/**
 * Pill icon đa màu sắc, phong cách liquid glass dễ thương & cao cấp
 */
function CuteGlassIcon({ icon: Icon, gradient, shadow }) {
  return (
    <div
      className={`size-9 rounded-2xl flex items-center justify-center text-white shrink-0 bg-gradient-to-tr ${gradient} ${shadow} ring-1 ring-white/30 backdrop-blur-md transition-transform duration-200 group-hover:scale-105 group-active:scale-95`}
    >
      <Icon className="size-4.5" strokeWidth={2} />
    </div>
  );
}

/**
 * Khung thẻ Liquid Glass theo chuẩn SwiftUI (Kính mờ đen nhám siêu thực)
 */
function LiquidGlassCard({ children, className = "" }) {
  return (
    <div
      className={`swiftui-liquid-glass relative overflow-hidden rounded-3xl divide-y divide-zinc-200/50 dark:divide-white/[0.08] transition-all ${className}`}
    >
      {/* Specular highlight lớp kính trên cùng của thẻ */}
      <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/80 dark:via-white/35 to-transparent pointer-events-none z-10" />
      {children}
    </div>
  );
}

/**
 * Hàng mục danh sách chạm có hiệu ứng Liquid Glass
 */
function LiquidRow({
  icon,
  gradient,
  shadow,
  title,
  subtitle,
  value,
  badge,
  onClick,
  href,
  trailing,
  isDestructive = false,
}) {
  const content = (
    <>
      <CuteGlassIcon icon={icon} gradient={gradient} shadow={shadow} />
      <div className="min-w-0 flex-1 text-left">
        <p
          className={`text-[14px] font-semibold tracking-tight truncate leading-snug ${
            isDestructive ? "text-rose-500" : "text-foreground"
          }`}
        >
          {title}
        </p>
        {subtitle && (
          <p className="text-[12px] text-muted-foreground truncate leading-tight mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      {badge && (
        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold shrink-0">
          {badge}
        </span>
      )}

      {value && (
        <span className="text-[13px] font-semibold text-muted-foreground shrink-0 tabular-nums">
          {value}
        </span>
      )}

      {trailing !== undefined ? (
        trailing
      ) : href ? (
        <ExternalLink className="size-4 text-muted-foreground/60 shrink-0" />
      ) : (
        <ChevronRight
          className={`size-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 ${
            isDestructive ? "text-rose-400" : "text-zinc-400"
          }`}
        />
      )}
    </>
  );

  const baseClasses =
    "group flex items-center gap-3.5 px-4 py-3.5 w-full transition-colors hover:bg-white/40 dark:hover:bg-white/[0.04] active:bg-white/60 dark:active:bg-white/[0.08] text-left focus:outline-none";

  if (trailing !== undefined) {
    return <div className={baseClasses}>{content}</div>;
  }

  if (href) {
    return (
      <a className={baseClasses} href={href} target="_blank" rel="noreferrer">
        {content}
      </a>
    );
  }

  return (
    <button type="button" className={baseClasses} onClick={onClick}>
      {content}
    </button>
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
  const palette = themeConfig?.palette || ["#007aff", "#5ac8fa", "#af52de", "#34c759"];

  useEffect(() => {
    pushService.isSubscribed().then(setPushEnabled);
    setBiometricSupported(webauthnHelper.isSupported());
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

  return (
    <div className="w-full min-h-screen flex flex-col select-none font-sans bg-[#0c0d12] text-foreground">
      {/* Ẩn file input phục vụ đổi ảnh đại diện */}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarChange}
      />

      {/* ─────────────────────────────────────────────────────────────
          1. ACCOUNT VIEW (MÀN HÌNH TÀI KHOẢN CHÍNH)
         ───────────────────────────────────────────────────────────── */}
      {currentView === "account" && (
        <div
          className="w-full flex-1 flex flex-col relative overflow-hidden animate-in fade-in duration-200 transition-colors"
          style={{
            background: `radial-gradient(ellipse 110% 70% at 50% 12%, ${palette[0]}55 0%, ${palette[1]}30 45%, #08090e 100%), #08090e`,
          }}
        >
          {/* Vầng hào quang ánh sáng Theme trôi dưới lớp kính mờ */}
          <div
            className="absolute -top-12 -left-12 size-72 rounded-full blur-3xl opacity-50 pointer-events-none"
            style={{ background: palette[0] }}
          />
          <div
            className="absolute top-28 -right-16 size-80 rounded-full blur-3xl opacity-40 pointer-events-none"
            style={{ background: palette[1] }}
          />
          <div
            className="absolute top-1/2 left-1/4 size-96 rounded-full blur-[100px] opacity-25 pointer-events-none"
            style={{ background: palette[0] }}
          />
          <div
            className="absolute bottom-1/4 -right-20 size-80 rounded-full blur-3xl opacity-20 pointer-events-none"
            style={{ background: palette[1] }}
          />

          {/* HEADER NỀN THEME SAU LƯNG AVATAR (TRÀN MÉP TRÊN DƯỚI DYNAMIC ISLAND) */}
          <div
            className="relative w-full overflow-hidden pb-10 px-4 flex flex-col items-center justify-center text-center transition-colors z-10"
            style={{
              paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)",
            }}
          >
            {/* Thanh điều hướng đầu trang */}
            <div className="w-full max-w-lg mx-auto flex items-center justify-between mb-4 relative z-10 px-1">
              <button
                type="button"
                onClick={() => navigate("/member/today")}
                className="size-9 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white flex items-center justify-center backdrop-blur-xl border border-white/20 transition-all shadow-sm"
                aria-label="Back"
              >
                <ChevronLeft className="size-4.5" />
              </button>
              <h1 className="text-[15px] font-bold text-white tracking-wide">
                Account
              </h1>
              <button
                type="button"
                onClick={() => navigate("/member/activity")}
                className="size-9 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white flex items-center justify-center backdrop-blur-xl border border-white/20 transition-all shadow-sm"
                aria-label="Notifications"
              >
                <Bell className="size-4" />
              </button>
            </div>

            {/* Avatar trung tâm với nút Camera đổi ảnh */}
            <div className="relative z-10 flex flex-col items-center max-w-lg mx-auto">
              <div
                className="relative group cursor-pointer"
                onClick={() => avatarInputRef?.current?.click()}
              >
                <div
                  className="size-28 sm:size-32 rounded-full overflow-hidden border-[2.5px] border-white/60 shadow-2xl bg-zinc-800 flex items-center justify-center transition-transform group-hover:scale-105"
                  style={{
                    boxShadow: `0 14px 40px ${palette[0]}55`,
                  }}
                >
                  {formData.avatarUrl ? (
                    <img className="size-full object-cover" src={formData.avatarUrl} alt={displayName} />
                  ) : (
                    <span className="text-3xl sm:text-4xl font-bold text-white">
                      {displayName[0]?.toUpperCase()}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  style={{
                    width: "26px",
                    height: "26px",
                    minWidth: "26px",
                    minHeight: "26px",
                    maxWidth: "26px",
                    maxHeight: "26px",
                    borderRadius: "9999px",
                    padding: 0,
                    margin: 0,
                    boxSizing: "border-box",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  className="absolute bottom-1 right-1 bg-zinc-900/95 dark:bg-zinc-800/95 border-[1.5px] border-white/80 text-white shadow-md hover:bg-zinc-800 active:scale-90 transition-transform shrink-0 cursor-pointer overflow-hidden"
                  title="Đổi ảnh đại diện"
                  onClick={(e) => {
                    e.stopPropagation();
                    avatarInputRef?.current?.click();
                  }}
                >
                  <Camera className="size-3 shrink-0" strokeWidth={2.2} />
                </button>
              </div>

              {/* Tên và Email */}
              <h2 className="text-lg font-bold text-white tracking-tight mt-3">
                {displayName}
              </h2>
              <p className="text-xs text-white/70 font-medium mt-0.5">
                {email}
              </p>
            </div>
          </div>

          {/* KHUNG NỘI DUNG KÍNH MỜ ĐEN NHÁM LIQUID GLASS TRÀN MÀN HÌNH ĐẾN TẬN ĐÁY */}
          <div className="relative z-10 flex-1 w-full -mt-4 backdrop-blur-3xl bg-white/70 dark:bg-black/35 rounded-t-[2.5rem] pt-6 pb-40 px-3.5 sm:px-4 space-y-4 border-t border-white/60 dark:border-white/15 shadow-[0_-16px_50px_rgba(0,0,0,0.45)] min-h-[65vh]">
            {/* Specular highlight viền kính cong trên cùng */}
            <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/80 dark:via-white/30 to-transparent pointer-events-none rounded-t-[2.5rem]" />
            <div className="w-full max-w-xl mx-auto space-y-4">
              
              {/* Thẻ 1: Ví JOY & Đặc quyền phần thưởng */}
              <LiquidGlassCard>
                <LiquidRow
                  icon={Wallet}
                  gradient="from-amber-400 via-amber-500 to-orange-500"
                  shadow="shadow-md shadow-amber-500/25"
                  title="Ví JOY & Quà tặng"
                  subtitle={`${activeVoucherCount} voucher khả dụng • Quy đổi đặc quyền`}
                  value={`${joy.number(joyBalance || 0)} ${joy.code}`}
                  onClick={() => openUtility("joy_wallet")}
                />
              </LiquidGlassCard>

              {/* Thẻ 2: Hồ sơ, Danh tính & Trang cá nhân Hugo Bio */}
              <LiquidGlassCard>
                <LiquidRow
                  icon={Edit3}
                  gradient="from-sky-400 via-blue-500 to-indigo-500"
                  shadow="shadow-md shadow-sky-500/25"
                  title="Hồ sơ thành viên"
                  subtitle="Cập nhật thông tin, số điện thoại & liên hệ"
                  onClick={() => openSheet("personal")}
                />
                <LiquidRow
                  icon={Sparkles}
                  gradient="from-violet-500 via-fuchsia-500 to-pink-500"
                  shadow="shadow-md shadow-fuchsia-500/25"
                  title="Trang cá nhân Hugo Bio"
                  subtitle={publicLink ? "Xem & tùy biến liên kết Bio độc bản" : "Khởi tạo Bio cá nhân độc bản"}
                  onClick={() => openUtility("bio")}
                />
                <LiquidRow
                  icon={ClipboardList}
                  gradient="from-orange-400 via-rose-500 to-amber-500"
                  shadow="shadow-md shadow-rose-500/25"
                  title="Nhiệm vụ & Thử thách JOY"
                  subtitle={
                    challengesLoaded
                      ? `${completedMissionsCount}/${challenges.length} nhiệm vụ đã xong`
                      : "Đồng bộ nhiệm vụ"
                  }
                  onClick={() => openUtility("joy_wallet")}
                />
                <LiquidRow
                  icon={Activity}
                  gradient="from-emerald-400 via-teal-500 to-cyan-500"
                  shadow="shadow-md shadow-teal-500/25"
                  title="Nhật ký hoạt động"
                  subtitle="Thông báo bảo mật, quà tặng & lịch sử"
                  onClick={() => navigate("/member/activity")}
                />
              </LiquidGlassCard>

              {/* Thẻ 3: Tiện ích hệ sinh thái & Cài đặt hệ thống */}
              <LiquidGlassCard>
                <LiquidRow
                  icon={SlidersHorizontal}
                  gradient="from-slate-600 via-zinc-700 to-neutral-800 dark:from-zinc-400 dark:to-slate-600"
                  shadow="shadow-md shadow-zinc-500/25"
                  title="Cài đặt hệ thống"
                  subtitle="Theme Aura, Ngôn ngữ, Thông báo & Bảo mật"
                  onClick={() => navigate("/member/account/setting")}
                />
                <LiquidRow
                  icon={Star}
                  gradient="from-yellow-400 via-amber-500 to-orange-400"
                  shadow="shadow-md shadow-yellow-500/25"
                  title="Đặc quyền thành viên"
                  subtitle={bio?.isEduVerified ? "HSSV VIP • Đã xác minh học đường" : "Thành viên chính thức"}
                  onClick={() => openSheet("personal")}
                />
                <LiquidRow
                  icon={Heart}
                  gradient="from-rose-400 via-pink-500 to-red-400"
                  shadow="shadow-md shadow-pink-500/25"
                  title="Bạn Học Đường AI"
                  subtitle="Liệu pháp CBT & đồng hành sức khỏe tinh thần"
                  onClick={() => navigate("/member/utilities/banhocduong")}
                />
                <LiquidRow
                  icon={GraduationCap}
                  gradient="from-indigo-400 via-blue-500 to-cyan-500"
                  shadow="shadow-md shadow-indigo-500/25"
                  title="Hugo Coder Hub"
                  subtitle="Lộ trình học lập trình & cấp chứng chỉ"
                  onClick={() => navigate("/member/utilities/study")}
                />
                <LiquidRow
                  icon={FileCheck2}
                  gradient="from-blue-500 via-indigo-600 to-purple-600"
                  shadow="shadow-md shadow-blue-500/25"
                  title="Quy ước & Văn bản hệ thống"
                  subtitle="Tuyên ngôn dịch vụ & CSDL Zero-Trust"
                  onClick={() => navigate("/member/account/terms-manifest")}
                />
              </LiquidGlassCard>

              {/* Thẻ 4: Đăng xuất an toàn */}
              <LiquidGlassCard>
                <LiquidRow
                  icon={LogOut}
                  gradient="from-rose-500 via-red-600 to-pink-600"
                  shadow="shadow-md shadow-rose-500/25"
                  title="Đăng xuất tài khoản"
                  subtitle="Đăng xuất an toàn khỏi thiết bị này"
                  isDestructive
                  onClick={handleLogout}
                />
              </LiquidGlassCard>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. SETTING VIEW (MÀN HÌNH CÀI ĐẶT CHI TIẾT)
         ───────────────────────────────────────────────────────────── */}
      {currentView === "setting" && (
        <div
          className="w-full flex-1 flex flex-col relative overflow-hidden animate-in fade-in duration-200 transition-colors"
          style={{
            background: `radial-gradient(ellipse 110% 70% at 50% 12%, ${palette[0]}40 0%, ${palette[1]}20 45%, #08090e 100%), #08090e`,
          }}
        >
          {/* Ambient Glow Orbs */}
          <div
            className="absolute -top-12 -left-12 size-72 rounded-full blur-3xl opacity-40 pointer-events-none"
            style={{ background: palette[0] }}
          />
          <div
            className="absolute top-1/2 -right-16 size-80 rounded-full blur-3xl opacity-25 pointer-events-none"
            style={{ background: palette[1] }}
          />

          {/* Thanh điều hướng cố định */}
          <div
            className="sticky top-0 z-20 w-full bg-white/70 dark:bg-black/35 backdrop-blur-2xl border-b border-zinc-200/50 dark:border-white/[0.1] px-4 pb-3"
            style={{
              paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)",
            }}
          >
            <div className="w-full max-w-xl mx-auto flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigate("/member/account")}
                className="size-9 rounded-full bg-zinc-200/70 dark:bg-white/10 hover:bg-zinc-300 dark:hover:bg-white/20 active:scale-95 text-foreground flex items-center justify-center transition-all"
                aria-label="Back"
              >
                <ChevronLeft className="size-4.5" />
              </button>
              <h1 className="text-[15px] font-bold text-foreground tracking-wide">
                Cài đặt & Tùy biến
              </h1>
              <button
                type="button"
                onClick={() => navigate("/member/activity")}
                className="size-9 rounded-full bg-zinc-200/70 dark:bg-white/10 hover:bg-zinc-300 dark:hover:bg-white/20 active:scale-95 text-foreground flex items-center justify-center transition-all"
                aria-label="Notifications"
              >
                <Bell className="size-4" />
              </button>
            </div>
          </div>

          <div className="w-full max-w-xl mx-auto p-3.5 sm:p-4 pb-40 space-y-4 relative z-10">
            
            {/* Nhóm 1: Giao diện, Theme Aura & Ngôn ngữ */}
            <LiquidGlassCard>
              <LiquidRow
                icon={Palette}
                gradient="from-fuchsia-400 via-purple-500 to-indigo-500"
                shadow="shadow-md shadow-fuchsia-500/25"
                title="Nền & Theme Aura"
                subtitle="Tùy biến hiệu ứng Liquid Glass & màu sắc"
                value={themeConfig?.name || "Mặc định"}
                onClick={() => openSheet("themes")}
              />
              <LiquidRow
                icon={Globe}
                gradient="from-teal-400 via-emerald-500 to-cyan-500"
                shadow="shadow-md shadow-teal-500/25"
                title="Ngôn ngữ hệ thống"
                subtitle="Đổi tiếng Việt, English hoặc 中文"
                value={languageLabel(currentLang)}
                onClick={() => openSheet("language")}
              />
              <div className="p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <CuteGlassIcon
                    icon={Zap}
                    gradient="from-lime-400 via-emerald-500 to-teal-500"
                    shadow="shadow-md shadow-lime-500/25"
                  />
                  <div>
                    <p className="text-[14px] font-semibold text-foreground">Tiết kiệm năng lượng</p>
                    <p className="text-[12px] text-muted-foreground">Tối ưu pin & GPU trên thiết bị di động</p>
                  </div>
                </div>
                <EcoToggle />
              </div>
            </LiquidGlassCard>

            {/* Nhóm 2: Bảo mật Zero-Trust & Sinh trắc học */}
            <LiquidGlassCard>
              <LiquidRow
                icon={ShieldCheck}
                gradient="from-emerald-400 via-teal-500 to-green-600"
                shadow="shadow-md shadow-emerald-500/25"
                title="Bảo mật sinh trắc học & PIN"
                subtitle="Xác thực FaceID, TouchID & bảo vệ ví"
                value={biometricSupported ? "Đã bảo vệ" : "Chưa bật PIN"}
                onClick={() => openSheet("security")}
              />
              <LiquidRow
                icon={Lock}
                gradient="from-rose-400 via-pink-500 to-purple-500"
                shadow="shadow-md shadow-rose-500/25"
                title="Quyền truy cập thiết bị"
                subtitle="Kiểm tra quyền Camera, Micro & Thông báo"
                onClick={() => {
                  hapticSelect();
                  window.dispatchEvent(new Event("hugo:show-permission-primer"));
                }}
              />
            </LiquidGlassCard>

            {/* Nhóm 3: Thông báo & Kết nối */}
            <LiquidGlassCard>
              <div className="flex items-center justify-between px-4 py-3.5 w-full">
                <div className="flex items-center gap-3.5">
                  <CuteGlassIcon
                    icon={Bell}
                    gradient="from-orange-400 via-amber-500 to-yellow-500"
                    shadow="shadow-md shadow-orange-500/25"
                  />
                  <div>
                    <p className="text-[14px] font-semibold text-foreground">Thông báo ứng dụng</p>
                    <p className="text-[12px] text-muted-foreground">Nhận tin tức bảo mật & biến động số dư</p>
                  </div>
                </div>
                <ToggleSwitch
                  checked={pushEnabled}
                  onChange={handleTogglePush}
                  disabled={pushBusy}
                  label="Thông báo ứng dụng"
                />
              </div>

              <div className="flex items-center justify-between px-4 py-3.5 w-full">
                <div className="flex items-center gap-3.5">
                  <CuteGlassIcon
                    icon={Bell}
                    gradient="from-sky-400 via-blue-500 to-indigo-500"
                    shadow="shadow-md shadow-sky-500/25"
                  />
                  <div>
                    <p className="text-[14px] font-semibold text-foreground">Email cập nhật Hugo</p>
                    <p className="text-[12px] text-muted-foreground">Mẹo thành viên & tư vấn website</p>
                  </div>
                </div>
                <ToggleSwitch
                  checked={marketingEnabled}
                  onChange={handleToggleMarketing}
                  disabled={marketingBusy}
                  label="Email cập nhật"
                />
              </div>
            </LiquidGlassCard>

            {/* Nhóm 4: Văn bản pháp lý & Quy ước */}
            <LiquidGlassCard>
              <LiquidRow
                icon={FileCheck2}
                gradient="from-blue-500 via-indigo-600 to-purple-600"
                shadow="shadow-md shadow-blue-500/25"
                title={STANDARDIZED_DOCS["terms-manifest"].defaultTitle}
                subtitle={STANDARDIZED_DOCS["terms-manifest"].subtitle}
                badge={STANDARDIZED_DOCS["terms-manifest"].badge}
                onClick={() => navigate("/member/account/terms-manifest")}
              />
              <LiquidRow
                icon={ShieldCheck}
                gradient="from-emerald-400 via-teal-500 to-green-600"
                shadow="shadow-md shadow-emerald-500/25"
                title={STANDARDIZED_DOCS["database-policy"].defaultTitle}
                subtitle={STANDARDIZED_DOCS["database-policy"].subtitle}
                badge={STANDARDIZED_DOCS["database-policy"].badge}
                onClick={() => navigate("/member/account/database-policy")}
              />
              <LiquidRow
                icon={BookOpen}
                gradient="from-slate-500 via-zinc-600 to-neutral-700"
                shadow="shadow-md shadow-slate-500/25"
                title="Cẩm nang quy ước toàn diện"
                subtitle="Xem hướng dẫn kiến trúc & sơ đồ hệ sinh thái"
                href="/terms-and-guide"
              />
            </LiquidGlassCard>

            {/* Nhóm 5: Vùng nhạy cảm & Xoá Bio */}
            {bio?._id && (
              <LiquidGlassCard>
                <LiquidRow
                  icon={Trash2}
                  gradient="from-rose-500 via-red-600 to-pink-600"
                  shadow="shadow-md shadow-rose-500/25"
                  title="Gỡ bỏ dịch vụ Bio"
                  subtitle="Gỡ bỏ hoàn toàn dữ liệu Bio cá nhân"
                  isDestructive
                  onClick={handleDeleteBio}
                />
              </LiquidGlassCard>
            )}
          </div>
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
    </div>
  );
}
