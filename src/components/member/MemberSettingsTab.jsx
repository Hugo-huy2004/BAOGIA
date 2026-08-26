import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  UserCheck,
  Edit3,
  User,
  Users,
  Shield,
  Heart,
  Briefcase,
  Sparkles,
  Palette,
  Globe,
  Bell,
  Lock,
  ChevronRight,
  LogOut,
  Share2,
  ExternalLink,
  GraduationCap,
  Award,
  BookOpen,
  FileText,
  HelpCircle,
  Radio,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { pushService } from "../../services/pushService";
import { webauthnHelper } from "../../utils/webauthnHelper";
import { hapticSelect } from "../../utils/haptics";
import { auraThemeTranslationKey, resolveActivePortalTheme } from "../../data/auraThemes";
import { SUPPORTED_LANGUAGES, languageCode, languageLabel } from "../../i18n/languages";
import { changeAppLanguage } from "../../i18n/config";
import { formatFullAddress, profileAnswerDisplayName, religionDisplayName } from "../../lib/profileDisplay";
import { useJoyStore } from "../../stores/joyStore";
import { useJoy } from "../../lib/joyDisplay";
import { fetchJoyPerks, fetchChallengeStatus } from "../../services/joyApi";
import { isVoucherActive } from "./joy/voucherStatus";
import BiometricLoginCard from "./BiometricLoginCard";
import ToggleSwitch from "../common/ToggleSwitch";
import EcoToggle from "../../Save_E/EcoToggle";

const AccountSheet = React.lazy(() => import("./account/AccountSheet"));
const AccountThemeSheet = React.lazy(() => import("./account/AccountThemeSheet"));
const PersonalInfoSubTab = React.lazy(() => import("./PersonalInfoSubTab"));
const MemberManageTab = React.lazy(() => import("./MemberManageTab"));
const MemberDocReader = React.lazy(() => import("./account/MemberDocReader"));

const SheetFallback = () => {
  const { t } = useTranslation();
  return <p className="py-8 text-center text-[13px] font-semibold text-muted-foreground">{t("memberPortal.accountHub.opening", "Đang tải...")}</p>;
};

function LiquidGlassSectionGroup({ title, children }) {
  return (
    <section className="relative overflow-hidden rounded-[26px] border border-white/35 dark:border-white/12 bg-white/70 dark:bg-slate-900/65 shadow-[0_12px_40px_rgba(0,0,0,0.12)] backdrop-blur-3xl space-y-0 transition-all duration-300" aria-label={title}>
      {/* iOS 27 Specular Light Sheen Overlay */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-white/30 dark:from-white/10 via-white/5 to-transparent rounded-t-[26px]" />
      
      <h2 className="relative border-b border-white/20 dark:border-white/10 bg-white/40 dark:bg-slate-800/40 px-4 py-3 text-[11.5px] font-black uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      <div className="divide-y divide-white/20 dark:divide-white/10 relative">{children}</div>
    </section>
  );
}

function CompactRowItem({ icon: Icon, title, detail, value, badge, onClick, href }) {
  const content = (
    <>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/80 dark:bg-slate-800/80 text-foreground shadow-xs border border-white/40 dark:border-white/10">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1 text-left">
        <strong className="block text-[13.5px] font-extrabold text-foreground truncate leading-tight">{title}</strong>
        {detail && <small className="block text-[11.5px] font-medium leading-tight text-muted-foreground truncate mt-0.5">{detail}</small>}
      </span>
      {badge > 0 && (
        <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[10.5px] font-black shrink-0 shadow-xs">
          {badge}
        </span>
      )}
      {value && <span className="max-w-[40%] truncate text-[12.5px] font-bold text-muted-foreground">{value}</span>}
      {href ? (
        <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
      ) : (
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      )}
    </>
  );

  const className = "flex min-h-[52px] w-full items-center gap-3 px-4 py-2.5 transition-all hover:bg-white/40 dark:hover:bg-slate-800/50 focus-visible:outline-none cursor-pointer active:scale-[0.99]";
  if (href) return <a className={className} href={href} target="_blank" rel="noreferrer">{content}</a>;
  return <button type="button" className={className} onClick={onClick}>{content}</button>;
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
  handleCopyLink,
  handleDeleteBio,
  onBioUpdate,
  onSelectTab,
  onSelectUtility,
  accountSubTab,
}) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [activeSheet, setActiveSheet] = useState(null);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [socialSummary, setSocialSummary] = useState(null);

  const joy = useJoy();
  const joyBalance = useJoyStore((state) => state.balance);

  const [perks, setPerks] = useState(null);
  const [perksLoaded, setPerksLoaded] = useState(false);
  const [challenges, setChallenges] = useState([]);
  const [challengesLoaded, setChallengesLoaded] = useState(false);

  const currentLang = languageCode(i18n.resolvedLanguage || i18n.language);
  const email = memberSession?.email || bio?.email || "—";
  const displayName = formData?.displayName || bio?.displayName || memberSession?.displayName || t("memberPortal.navigation.memberFallback", "Thành viên Hugo");
  const usernameSlug = bio?.slug || "member";

  const schoolName = [
    formData.education,
    bio?.verificationRequest?.schoolName,
    bio?.schoolName,
  ].find((v) => typeof v === "string" && v.trim() && !v.startsWith("$enc$") && !v.startsWith("enc:"))?.trim() || "";

  const profileBio = formData.bio || bio?.bio || formData.headline || bio?.headline || "";
  const ethnicity = profileAnswerDisplayName(formData.ethnicity, currentLang) || "";
  const religion = religionDisplayName(formData.religion, currentLang) || "";

  const memberDocuments = useMemo(() => ({
    "doc:joy-rules": { id: "joy-rules", title: t("memberPortal.accountHub.documents.joyRulesTitle", "Quy tắc điểm thưởng JOY") },
    "doc:privileges": { id: "privileges", title: t("memberPortal.accountHub.documents.privilegesTitle", "Đặc quyền thành viên VIP") },
    "doc:conditions": { id: "conditions", title: t("memberPortal.accountHub.documents.conditionsTitle", "Điều khoản dịch vụ") },
    "doc:rights-access": { id: "rights-access", title: t("memberPortal.accountHub.documents.rightsTitle", "Quyền riêng tư & Truy cập") },
    "doc:full-text": { id: "full-text", title: t("memberPortal.accountHub.documents.fullTextTitle", "Văn bản pháp lý đầy đủ") },
  }), [t]);

  useEffect(() => {
    pushService.isSubscribed().then(setPushEnabled);
    setBiometricSupported(webauthnHelper.isSupported());
  }, []);

  useEffect(() => {
    if (!email || email === "—") return;
    fetchJoyPerks(bio).then((data) => { setPerks(data); setPerksLoaded(true); }).catch(() => {});
    fetchChallengeStatus(email).then((data) => { setChallenges(data); setChallengesLoaded(true); }).catch(() => {});
  }, [email, bio]);

  useEffect(() => {
    if (!email || email === "—") return undefined;
    let active = true;
    fetch("/api/friends")
      .then((res) => res.ok ? res.json() : Promise.reject())
      .then((data) => {
        if (active) setSocialSummary({ friends: data.friends?.length || 0, requests: data.incoming?.length || 0 });
      })
      .catch(() => { if (active) setSocialSummary(null); });
    return () => { active = false; };
  }, [email]);

  useEffect(() => {
    const sheetId = `doc:${accountSubTab || ""}`;
    if (memberDocuments[sheetId]) {
      setActiveSheet(sheetId);
    }
  }, [accountSubTab, memberDocuments]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("hugo:fullsheet", { detail: { open: Boolean(activeSheet) } }));
    return () => window.dispatchEvent(new CustomEvent("hugo:fullsheet", { detail: { open: false } }));
  }, [activeSheet]);

  const activeVoucherCount = useMemo(() => {
    const vouchers = perksLoaded ? (perks?.vouchers || []) : (Array.isArray(bio?.serviceVouchers) ? bio.serviceVouchers : []);
    return vouchers.filter((v) => isVoucherActive(v)).length;
  }, [bio?.serviceVouchers, perks, perksLoaded]);

  const completedMissionsCount = challenges.filter((c) => c.completed).length;

  const openSheet = (id) => {
    hapticSelect();
    setActiveSheet(id);
  };
  const closeSheet = () => {
    if (activeSheet?.startsWith("doc:")) navigate("/member/account", { replace: true });
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
        showToast?.(t("memberPortal.settings.pushDisabledToast", "Đã tắt thông báo đẩy"), "success");
      } else {
        const result = await pushService.subscribe(email);
        if (result === "granted") {
          setPushEnabled(true);
          showToast?.(t("memberPortal.settings.pushEnabledToast", "Đã bật thông báo đẩy"), "success");
        }
      }
    } catch {
      showToast?.(t("memberPortal.settings.pushErrorToast", "Không thể cài đặt thông báo"), "error");
    } finally {
      setPushBusy(false);
    }
  };

  const selectLanguage = async (code) => {
    if (code === currentLang) return;
    await changeAppLanguage(code);
  };

  const openFriendsApp = (view = "friends") => {
    hapticSelect();
    if (onSelectUtility) onSelectUtility(`friends?view=${view}`);
    else if (onSelectTab) onSelectTab("utilities");
  };

  return (
    <div className="mx-auto w-full max-w-2xl sm:max-w-3xl space-y-4 pb-28 text-left animate-fadeIn font-sans select-none px-2 sm:px-0">
      
      {/* ── UNIFIED INSTAGRAM-STYLE LIQUID GLASS PROFILE CARD (SINGLE CARD) ── */}
      <section className="relative overflow-hidden rounded-[28px] border border-white/40 dark:border-white/15 bg-white/70 dark:bg-slate-900/70 p-4 sm:p-6 shadow-[0_16px_48px_rgba(0,0,0,0.16)] backdrop-blur-3xl space-y-4 transition-all duration-300">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/35 dark:from-white/10 via-white/10 to-transparent rounded-t-[28px]" />
        <div className="pointer-events-none absolute -top-16 -left-16 w-56 h-56 rounded-full bg-rose-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -right-16 w-56 h-56 rounded-full bg-violet-500/15 blur-3xl" />

        {/* 1. Header Row (@username & Settings Button) */}
        <div className="relative flex items-center justify-between">
          <span className="text-[14px] font-black tracking-tight text-foreground/80 flex items-center gap-1.5">
            <span className="text-rose-500 font-extrabold">@</span>{usernameSlug}
          </span>
          <button
            type="button"
            onClick={() => openSheet("manage")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/30 dark:border-white/10 bg-white/60 dark:bg-slate-800/60 font-extrabold text-[12px] text-foreground hover:bg-white/80 dark:hover:bg-slate-700/80 active:scale-95 transition-all shadow-xs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-rose-500" />
            <span>{t("memberPortal.accountProfile.settings", "Cài đặt")}</span>
          </button>
        </div>

        {/* 2. Instagram Avatar + Stats Row */}
        <div className="relative flex items-center justify-between gap-3 sm:gap-4 pt-1">
          {/* Avatar */}
          <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-full p-[2.5px] bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-400 shadow-lg shrink-0">
            <div className="w-full h-full rounded-full bg-card overflow-hidden relative flex items-center justify-center">
              {formData.avatarUrl ? (
                <img className="w-full h-full object-cover" src={formData.avatarUrl} alt={displayName} />
              ) : (
                <span className="text-2xl font-black text-rose-500">{displayName[0]?.toUpperCase()}</span>
              )}
            </div>
            {bio?.isEduVerified && (
              <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-card shadow-xs" title={t("memberPortal.account.eduVerified", "Đã xác minh sinh viên")}>
                <UserCheck className="w-3 h-3" />
              </span>
            )}
          </div>

          {/* Instagram Stats Columns */}
          <div className="flex-1 grid grid-cols-3 gap-1.5 sm:gap-2 text-center">
            <button
              type="button"
              onClick={() => openUtility("joy_wallet")}
              className="p-2 sm:p-2.5 rounded-2xl border border-amber-500/25 bg-amber-500/10 hover:bg-amber-500/15 transition-all active:scale-95 min-w-0"
            >
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 block truncate">{t("memberPortal.accountProfile.joyWallet", "VÍ JOY")}</span>
              <strong className="block text-[14px] sm:text-[16px] font-black text-foreground tabular-nums truncate">{joy.number(joyBalance || 0)}</strong>
              <span className="text-[10px] font-extrabold text-muted-foreground block truncate">{joy.code}</span>
            </button>

            <button
              type="button"
              onClick={() => openUtility("joy_wallet?tab=missions")}
              className="p-2 sm:p-2.5 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 hover:bg-emerald-500/15 transition-all active:scale-95 min-w-0"
            >
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block truncate">{t("memberPortal.accountProfile.missions", "NHIỆM VỤ")}</span>
              <strong className="block text-[14px] sm:text-[16px] font-black text-foreground tabular-nums truncate">{challengesLoaded ? `${completedMissionsCount}/${challenges.length}` : "0"}</strong>
              <span className="text-[10px] font-extrabold text-muted-foreground block truncate">{t("memberPortal.accountProfile.completedMissions", "Đã làm xong")}</span>
            </button>

            <button
              type="button"
              onClick={() => openUtility("joy_wallet?sub=perks")}
              className="p-2 sm:p-2.5 rounded-2xl border border-violet-500/25 bg-violet-500/10 hover:bg-violet-500/15 transition-all active:scale-95 min-w-0"
            >
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-violet-600 dark:text-violet-400 block truncate">{t("memberPortal.accountProfile.vipPerks", "ƯU ĐÃI VIP")}</span>
              <strong className="block text-[14px] sm:text-[16px] font-black text-foreground tabular-nums truncate">{activeVoucherCount}</strong>
              <span className="text-[10px] font-extrabold text-muted-foreground block truncate">Vouchers</span>
            </button>
          </div>
        </div>

        {/* 3. Name, Email, Badge & Bio Info under Avatar */}
        <div className="relative space-y-2 pt-1">
          <div className="space-y-0.5">
            <h1 className="text-[18px] sm:text-[20px] font-black text-foreground tracking-tight">{displayName}</h1>
            <p className="text-[12px] sm:text-[12.5px] font-semibold text-muted-foreground truncate">{email}</p>
          </div>

          {schoolName && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[11.5px] font-extrabold border border-rose-500/20 max-w-full truncate">
              <GraduationCap className="w-3.5 h-3.5 shrink-0 text-rose-500" />
              <span className="truncate">{t("memberPortal.accountProfile.studentBadge", "HSSV tại {{school}}", { school: schoolName })}</span>
            </div>
          )}

          {profileBio && (
            <p className="text-[12.5px] font-medium text-foreground/90 leading-relaxed italic bg-white/40 dark:bg-slate-800/40 p-2.5 rounded-xl border border-white/20 dark:border-white/10">
              "{profileBio}"
            </p>
          )}

        </div>

        {/* 5. Instagram Action Buttons Row (At Card Bottom) */}
        <div className="relative grid grid-cols-3 gap-2 pt-2">
          <button
            type="button"
            onClick={() => openSheet("personal")}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-2xl border border-white/30 dark:border-white/10 bg-white/60 dark:bg-slate-800/60 font-black text-[12px] sm:text-[12.5px] text-foreground hover:bg-white/80 dark:hover:bg-slate-700/80 active:scale-95 transition-all shadow-xs truncate"
          >
            <Edit3 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span className="truncate">{t("memberPortal.accountProfile.editProfile", "Chỉnh sửa")}</span>
          </button>
          <button
            type="button"
            onClick={() => openUtility("bio")}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-2xl border border-white/30 dark:border-white/10 bg-white/60 dark:bg-slate-800/60 font-black text-[12px] sm:text-[12.5px] text-foreground hover:bg-white/80 dark:hover:bg-slate-700/80 active:scale-95 transition-all shadow-xs truncate"
          >
            <User className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span className="truncate">{t("memberPortal.accountProfile.viewBio", "Xem Bio")}</span>
          </button>
          <button
            type="button"
            onClick={() => openFriendsApp("friends")}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-2xl border border-white/30 dark:border-white/10 bg-white/60 dark:bg-slate-800/60 font-black text-[12px] sm:text-[12.5px] text-foreground hover:bg-white/80 dark:hover:bg-slate-700/80 active:scale-95 transition-all shadow-xs truncate"
          >
            <Users className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="truncate">{t("memberPortal.accountProfile.friends", "Bạn bè")}</span>
          </button>
        </div>
      </section>

      {/* ── 4. SHORTCUTS GRID (8 Micro Buttons) ── */}
      <section className="relative overflow-hidden p-4 rounded-[26px] border border-white/30 dark:border-white/12 bg-white/70 dark:bg-slate-900/65 shadow-[0_12px_40px_rgba(0,0,0,0.12)] backdrop-blur-3xl space-y-3">
        <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground block px-1">
          {t("memberPortal.accountProfile.quickShortcuts", "Phím Tắt Thao Tác Nhanh")}
        </span>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 text-center">
          <button type="button" onClick={() => openUtility("joy_wallet")} className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-white/40 dark:hover:bg-slate-800/40 transition-all group active:scale-95">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs border border-amber-500/20">
              <Award className="w-5 h-5" />
            </div>
            <span className="text-[11.5px] font-black text-foreground">{t("memberPortal.accountProfile.joyWalletTitle", "Ví JOY")}</span>
          </button>

          <button type="button" onClick={() => openUtility("bio")} className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-white/40 dark:hover:bg-slate-800/40 transition-all group active:scale-95">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs border border-indigo-500/20">
              <User className="w-5 h-5" />
            </div>
            <span className="text-[11.5px] font-black text-foreground">{t("memberPortal.accountProfile.hugoBio", "Hugo Bio")}</span>
          </button>

          <button type="button" onClick={() => openSheet("themes")} className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-white/40 dark:hover:bg-slate-800/40 transition-all group active:scale-95">
            <div className="w-10 h-10 rounded-2xl bg-violet-500/10 text-violet-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs border border-violet-500/20">
              <Palette className="w-5 h-5" />
            </div>
            <span className="text-[11.5px] font-black text-foreground">{t("memberPortal.accountProfile.theme", "Giao diện")}</span>
          </button>

          <button type="button" onClick={() => openSheet("security")} className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-white/40 dark:hover:bg-slate-800/40 transition-all group active:scale-95">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs border border-sky-500/20">
              <Lock className="w-5 h-5" />
            </div>
            <span className="text-[11.5px] font-black text-foreground">{t("memberPortal.accountProfile.security", "Bảo mật")}</span>
          </button>

          <button type="button" onClick={() => openSheet("notifications")} className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-white/40 dark:hover:bg-slate-800/40 transition-all group active:scale-95">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs border border-rose-500/20">
              <Bell className="w-5 h-5" />
            </div>
            <span className="text-[11.5px] font-black text-foreground">{t("memberPortal.accountProfile.notifications", "Thông báo")}</span>
          </button>

          <button type="button" onClick={() => openSheet("language")} className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-white/40 dark:hover:bg-slate-800/40 transition-all group active:scale-95">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs border border-emerald-500/20">
              <Globe className="w-5 h-5" />
            </div>
            <span className="text-[11.5px] font-black text-foreground">{t("memberPortal.accountProfile.language", "Ngôn ngữ")}</span>
          </button>

          <button type="button" onClick={() => openUtility("radio")} className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-white/40 dark:hover:bg-slate-800/40 transition-all group active:scale-95">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs border border-teal-500/20">
              <Radio className="w-5 h-5" />
            </div>
            <span className="text-[11.5px] font-black text-foreground">{t("memberPortal.accountProfile.radio", "Radio")}</span>
          </button>

          <button type="button" onClick={() => window.dispatchEvent(new CustomEvent("hugo:open-spotlight"))} className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-white/40 dark:hover:bg-slate-800/40 transition-all group active:scale-95">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs border border-blue-500/20">
              <Search className="w-5 h-5" />
            </div>
            <span className="text-[11.5px] font-black text-foreground">{t("memberPortal.accountProfile.search", "Tìm kiếm")}</span>
          </button>
        </div>
      </section>

      {/* ── 5. iOS 27 LIQUID GLASS MENU GROUPS ── */}
      <LiquidGlassSectionGroup title={t("memberPortal.accountProfile.profileAndWalletGroup", "Hồ sơ & Ví cá nhân")}>
        <CompactRowItem icon={User} title={t("memberPortal.accountProfile.manageProfile", "Quản lý hồ sơ cá nhân")} detail={t("memberPortal.accountProfile.manageProfileDetail", "Cập nhật avatar, tiểu sử và thông tin liên hệ")} onClick={() => openSheet("manage")} />
        <CompactRowItem icon={Sparkles} title={t("memberPortal.accountProfile.personalBioPage", "Trang Bio cá nhân")} detail={t("memberPortal.accountProfile.personalBioPageDetail", "Trang cá nhân công khai độc bản")} onClick={() => openUtility("bio")} />
        {publicLink && <CompactRowItem icon={Share2} title={t("memberPortal.accountProfile.publicWebBio", "Xem trang Bio trên Web")} detail={t("memberPortal.accountProfile.publicWebBioDetail", "Mở liên kết bio cá nhân trong trình duyệt")} href={publicLink} />}
        <CompactRowItem icon={Award} title={t("memberPortal.accountProfile.joyApp", "Ứng dụng Ví JOY")} detail={t("memberPortal.accountProfile.joyAppDetail", "Số dư, nạp rút và chuyển điểm JOY nhanh")} onClick={() => openUtility("joy_wallet")} />
      </LiquidGlassSectionGroup>

      <LiquidGlassSectionGroup title={t("memberPortal.accountProfile.interfaceAndSystemGroup", "Giao diện & Hệ thống")}>
        <CompactRowItem icon={Palette} title={t("memberPortal.accountProfile.personalTheme", "Nền & Theme cá nhân")} value={t(auraThemeTranslationKey(resolveActivePortalTheme(bio), "Name"), "Theme")} onClick={() => openSheet("themes")} />
        <CompactRowItem icon={Globe} title={t("memberPortal.accountProfile.systemLanguage", "Ngôn ngữ hệ thống")} value={languageLabel(currentLang)} onClick={() => openSheet("language")} />
        <div className="px-4 py-2.5">
          <EcoToggle />
        </div>
      </LiquidGlassSectionGroup>

      <LiquidGlassSectionGroup title={t("memberPortal.accountProfile.securityAndPrivacyGroup", "Bảo mật & Quyền riêng tư")}>
        <CompactRowItem icon={Bell} title={t("memberPortal.accountProfile.notificationSettings", "Cài đặt thông báo")} detail={t("memberPortal.accountProfile.notificationSettingsDetail", "Quản lý thông báo đẩy ứng dụng")} onClick={() => openSheet("notifications")} />
        <CompactRowItem icon={Shield} title={t("memberPortal.accountProfile.devicePermissions", "Quyền thiết bị & Định vị")} detail={t("memberPortal.accountProfile.devicePermissionsDetail", "Bật/tắt camera, GPS và bộ nhớ")} onClick={() => { hapticSelect(); window.dispatchEvent(new Event("hugo:show-permission-primer")); }} />
        <CompactRowItem icon={Lock} title={t("memberPortal.accountProfile.biometrics", "Bảo mật sinh trắc học & Passkey")} detail={t("memberPortal.accountProfile.biometricsDetail", "Xác thực FaceID, TouchID và WebAuthn")} onClick={() => openSheet("security")} />
      </LiquidGlassSectionGroup>

      <LiquidGlassSectionGroup title={t("memberPortal.accountProfile.documentsAndLegalGroup", "Tài liệu & Pháp lý")}>
        <CompactRowItem icon={BookOpen} title={t("memberPortal.accountHub.documents.joyRulesTitle", "Quy tắc điểm thưởng JOY")} onClick={() => navigate("/member/account/joy-rules")} />
        <CompactRowItem icon={Shield} title={t("memberPortal.accountHub.documents.rightsTitle", "Quyền riêng tư & Truy cập")} onClick={() => navigate("/member/account/rights-access")} />
        <CompactRowItem icon={Award} title={t("memberPortal.accountHub.documents.privilegesTitle", "Đặc quyền thành viên VIP")} onClick={() => navigate("/member/account/privileges")} />
        <CompactRowItem icon={FileText} title={t("memberPortal.accountHub.documents.conditionsTitle", "Điều khoản dịch vụ")} onClick={() => navigate("/member/account/conditions")} />
        <CompactRowItem icon={HelpCircle} title={t("memberPortal.accountHub.documents.fullTextTitle", "Văn bản pháp lý đầy đủ")} onClick={() => navigate("/member/account/full-text")} />
      </LiquidGlassSectionGroup>

      {/* ── 6. SIGN OUT ── */}
      <div className="overflow-hidden rounded-[24px] border border-white/30 dark:border-white/12 bg-white/70 dark:bg-slate-900/65 shadow-lg backdrop-blur-3xl p-1">
        <button
          type="button"
          onClick={handleLogout}
          className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-2xl text-[14px] font-black text-rose-500 hover:bg-rose-500/10 active:scale-95 transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>{t("memberPortal.accountProfile.logout", "Đăng xuất tài khoản")}</span>
        </button>
      </div>

      {/* ── SHEETS ── */}
      {activeSheet === "personal" && (
        <React.Suspense fallback={<SheetFallback />}>
          <AccountSheet title={t("memberPortal.account.personalInformation", "Thông tin cá nhân")} subtitle={t("memberPortal.account.personalInformationDescription", "Cập nhật thông tin chi tiết")} onClose={closeSheet} wide>
            <PersonalInfoSubTab
              formData={formData} handleFieldChange={handleFieldChange} handleSave={async (event) => { await handleSave(event); closeSheet(); }}
              saving={saving} isDragOver={isDragOver} setIsDragOver={setIsDragOver} processFile={processFile} avatarInputRef={avatarInputRef}
              handleAvatarChange={handleAvatarChange} handleRemoveAvatar={handleRemoveAvatar} memberSession={memberSession} bio={bio} hideAvatarSection={false} t={t}
            />
          </AccountSheet>
        </React.Suspense>
      )}

      {activeSheet === "themes" && (
        <React.Suspense fallback={<SheetFallback />}>
          <AccountSheet title={t("memberPortal.accountProfile.personalTheme", "Nền & Theme cá nhân")} subtitle={t("memberPortal.settings.customizeThemeDesc", "Tùy chỉnh giao diện portal")} onClose={closeSheet} wide>
            <AccountThemeSheet bio={bio} showToast={showToast} onBioUpdate={onBioUpdate} />
          </AccountSheet>
        </React.Suspense>
      )}

      {activeSheet === "manage" && (
        <AccountSheet title={t("memberPortal.accountProfile.manageProfile", "Quản lý hồ sơ")} onClose={closeSheet} wide>
          <React.Suspense fallback={<SheetFallback />}>
            <MemberManageTab bio={bio} publicLink={publicLink} handleCopyLink={handleDeleteBio} handleDeleteBio={handleDeleteBio} saving={saving} />
          </React.Suspense>
        </AccountSheet>
      )}

      {activeSheet?.startsWith("doc:") && (
        <AccountSheet title={memberDocuments[activeSheet]?.title || t("memberPortal.accountProfile.memberDocuments", "Tài liệu thành viên")} onClose={closeSheet} wide>
          <React.Suspense fallback={<SheetFallback />}>
            <MemberDocReader docId={memberDocuments[activeSheet]?.id} />
          </React.Suspense>
        </AccountSheet>
      )}

      {activeSheet === "notifications" && (
        <AccountSheet title={t("memberPortal.accountProfile.notificationSettings", "Cài đặt thông báo")} onClose={closeSheet}>
          <div className="flex items-center justify-between rounded-2xl border border-white/20 bg-card p-4">
            <div className="min-w-0 pr-3">
              <h4 className="text-[14px] font-black text-foreground">{t("memberPortal.settings.appNotifications", "Thông báo ứng dụng")}</h4>
              <p className="text-[11.5px] text-muted-foreground">{t("memberPortal.settings.appNotificationsDesc", "Nhận tin tức và thông báo hoạt động hệ thống")}</p>
            </div>
            <ToggleSwitch checked={pushEnabled} onChange={handleTogglePush} disabled={pushBusy} label={t("memberPortal.settings.enableNotifications", "Bật thông báo")} />
          </div>
        </AccountSheet>
      )}

      {activeSheet === "security" && (
        <AccountSheet title={t("memberPortal.accountProfile.biometrics", "Bảo mật sinh trắc học")} onClose={closeSheet}>
          {biometricSupported && email ? (
            <BiometricLoginCard memberSession={memberSession} showToast={showToast} bare />
          ) : (
            <p className="text-[13px] text-muted-foreground">{t("memberPortal.settings.biometricNotSupported", "Thiết bị không hỗ trợ đăng nhập sinh trắc học")}</p>
          )}
        </AccountSheet>
      )}

      {activeSheet === "language" && (
        <AccountSheet title={t("memberPortal.accountProfile.systemLanguage", "Chọn ngôn ngữ")} onClose={closeSheet}>
          <div className="space-y-2">
            {SUPPORTED_LANGUAGES.map((lng) => {
              const active = currentLang === lng.code;
              return (
                <button
                  key={lng.code}
                  onClick={async () => { await selectLanguage(lng.code); closeSheet(); }}
                  className={`flex min-h-[48px] w-full items-center justify-between rounded-2xl border px-4 text-[14.5px] transition-all ${
                    active ? "border-primary bg-primary/10 font-black text-primary" : "border-border bg-card text-foreground hover:bg-muted/50"
                  }`}
                >
                  <span>{lng.label}</span>
                  {active && <span className="font-black text-primary text-base">✓</span>}
                </button>
              );
            })}
          </div>
        </AccountSheet>
      )}
    </div>
  );
}
