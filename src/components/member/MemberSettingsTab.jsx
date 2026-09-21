import React, { useEffect, useMemo, useState } from "react";
import { nom } from "../../lib/nomText";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  User,
  Edit3,
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
  FileCheck2,
  ShieldCheck,
  Zap,
  SlidersHorizontal,
  Check,
} from "lucide-react";
import { pushService } from "../../services/pushService";
import { webauthnHelper } from "../../utils/webauthnHelper";
import { hapticSelect } from "../../utils/haptics";
import { auraThemeTranslationKey, resolveActivePortalTheme } from "../../data/auraThemes";
import { SUPPORTED_LANGUAGES, languageCode, languageLabel } from "../../i18n/languages";
import { changeAppLanguage } from "../../i18n/config";
import { useJoyStore } from "../../stores/joyStore";
import { useJoy } from "../../lib/joyDisplay";
import { fetchJoyPerks, fetchChallengeStatus } from "../../services/joyApi";
import { isVoucherActive } from "./joy/voucherStatus";
import BiometricLoginCard from "./BiometricLoginCard";
import SecurityCenter from "./account/SecurityCenter";
import ToggleSwitch from "../common/ToggleSwitch";
import EcoToggle from "../../Save_E/EcoToggle";

const AccountSheet = React.lazy(() => import("./account/AccountSheet"));
const AccountThemeSheet = React.lazy(() => import("./account/AccountThemeSheet"));
const PersonalInfoSubTab = React.lazy(() => import("./PersonalInfoSubTab"));
const MemberManageTab = React.lazy(() => import("./MemberManageTab"));
const MemberDocReader = React.lazy(() => import("./account/MemberDocReader"));

const SheetFallback = () => {
  const { t } = useTranslation();
  return (
    <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground">
      <div className="size-5 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
      <p className="text-xs font-medium">{t("memberPortal.accountHub.opening", nom("Đang tải..."))}</p>
    </div>
  );
};

// 2 BẢN VĂN BẢN QUY CHUẨN DUY NHẤT VÀ ÁNH XẠ TƯƠNG THÍCH NGƯỢC
const STANDARDIZED_DOCS = {
  "terms-manifest": {
    id: "terms-manifest",
    titleKey: "memberPortal.accountHub.documents.termsManifestTitle",
    defaultTitle: nom("Điều khoản dịch vụ & Tuyên ngôn hệ thống"),
    subtitle: "Cam kết vận hành bền vững, quyền lợi thành viên và nguyên tắc tương hỗ",
    badge: nom("Bản hiện hành"),
    icon: FileCheck2,
    color: "bg-blue-500/10 text-blue-500",
  },
  "database-policy": {
    id: "database-policy",
    titleKey: "memberPortal.accountHub.documents.databasePolicyTitle",
    defaultTitle: nom("Quy ước CSDL & Chính sách thành viên"),
    subtitle: nom("Kiến trúc CSDL Zero-Trust, quy chế ví JOY/JOYlater và đặc quyền"),
    badge: nom("Quy ước hệ thống"),
    icon: ShieldCheck,
    color: "bg-emerald-500/10 text-emerald-500",
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
 * Khung Apple Inset Grouped Section
 */
function AppleGroupSection({ title, children }) {
  return (
    <div className="space-y-1.5 text-left">
      {title && (
        <h3 className="px-4 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground/85">
          {title}
        </h3>
      )}
      <div className="overflow-hidden rounded-2xl border border-border/50 bg-card/85 dark:bg-card/45 backdrop-blur-xl divide-y divide-border/40 shadow-xs transition-colors">
        {children}
      </div>
    </div>
  );
}

/**
 * Dòng mục cài đặt chuẩn Apple Settings Row
 */
function AppleRowItem({
  icon: Icon,
  iconColor = "bg-primary/10 text-primary",
  title,
  subtitle,
  value,
  badge,
  onClick,
  href,
  trailing,
}) {
  const innerContent = (
    <>
      <div className={`size-8 shrink-0 rounded-xl flex items-center justify-center ${iconColor}`}>
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1 text-left">
        <p className="text-[14px] font-semibold text-foreground tracking-tight truncate leading-tight">
          {title}
        </p>
        {subtitle && (
          <p className="text-[12px] text-muted-foreground truncate mt-0.5 leading-tight">
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
        <span className="text-[13px] font-medium text-muted-foreground shrink-0 truncate max-w-[40%]">
          {value}
        </span>
      )}
      {trailing !== undefined ? (
        trailing
      ) : href ? (
        <ExternalLink className="size-4 text-muted-foreground/60 shrink-0" />
      ) : (
        <ChevronRight className="size-4 text-muted-foreground/60 shrink-0" />
      )}
    </>
  );

  const baseStyle =
    "flex min-h-[50px] w-full items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/40 active:bg-muted/60 focus-visible:outline-none";

  if (trailing !== undefined) {
    return <div className={baseStyle}>{innerContent}</div>;
  }

  if (href) {
    return (
      <a className={baseStyle} href={href} target="_blank" rel="noreferrer">
        {innerContent}
      </a>
    );
  }

  return (
    <button type="button" className={baseStyle} onClick={onClick}>
      {innerContent}
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

  const [activeSheet, setActiveSheet] = useState(null);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
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
  const usernameSlug = bio?.slug || "member";

  const schoolName = [
    formData.education,
    bio?.verificationRequest?.schoolName,
    bio?.schoolName,
  ].find((v) => typeof v === "string" && v.trim() && !v.startsWith("$enc$") && !v.startsWith("enc:"))?.trim() || "";

  const profileBio = formData.bio || bio?.bio || formData.headline || bio?.headline || "";

  // Khởi tạo kiểm tra tính năng thiết bị
  useEffect(() => {
    pushService.isSubscribed().then(setPushEnabled);
    setBiometricSupported(webauthnHelper.isSupported());
  }, []);

  // Tải thông tin đặc quyền và thử thách JOY
  useEffect(() => {
    if (!email || email === "—") return;
    fetchJoyPerks(bio).then((data) => {
      setPerks(data);
      setPerksLoaded(true);
    }).catch(() => {});
    fetchChallengeStatus(email).then((data) => {
      setChallenges(data);
      setChallengesLoaded(true);
    }).catch(() => {});
  }, [email, bio]);

  // Xử lý deep link /member/account/:subTab (có fallback tương thích ngược)
  useEffect(() => {
    if (!accountSubTab) return;
    const resolvedDocId = LEGACY_DOC_MAPPING[accountSubTab] || accountSubTab;
    if (STANDARDIZED_DOCS[resolvedDocId]) {
      setActiveSheet(`doc:${resolvedDocId}`);
    }
  }, [accountSubTab]);

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

  const selectLanguage = async (code) => {
    if (code === currentLang) return;
    await changeAppLanguage(code);
  };

  return (
    <div className="mx-auto w-full max-w-xl sm:max-w-2xl space-y-5 pb-28 text-left animate-in fade-in duration-200 font-sans select-none px-2 sm:px-0">
      
      {/* ── 1. APPLE ACCOUNT CARD (PROFILE HEADER) ── */}
      <section className="overflow-hidden rounded-3xl border border-border/50 bg-card/85 dark:bg-card/45 p-5 sm:p-6 backdrop-blur-xl shadow-xs space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
            {/* Avatar với nút chạm tải ảnh */}
            <div className="relative shrink-0">
              <div className="size-16 sm:size-18 rounded-full overflow-hidden border border-border bg-muted flex items-center justify-center shadow-xs">
                {formData.avatarUrl ? (
                  <img className="size-full object-cover" src={formData.avatarUrl} alt={displayName} />
                ) : (
                  <span className="text-xl sm:text-2xl font-bold text-primary">
                    {displayName[0]?.toUpperCase()}
                  </span>
                )}
              </div>
              {bio?.isEduVerified && (
                <span
                  className="absolute bottom-0 right-0 size-5 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-card shadow-xs"
                  title={t("memberPortal.account.eduVerified", nom("Đã xác minh sinh viên"))}
                >
                  <GraduationCap className="size-3" />
                </span>
              )}
            </div>

            {/* Thông tin tên & email */}
            <div className="min-w-0 flex-1 space-y-0.5">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground truncate">
                {displayName}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium truncate">
                {email}
              </p>
              <p className="text-[11px] sm:text-xs text-muted-foreground/80 font-mono truncate">
                @{usernameSlug}
              </p>
            </div>
          </div>

          {/* Nút Cài đặt hồ sơ nhanh */}
          <button
            type="button"
            onClick={() => openSheet("manage")}
            className="p-2 rounded-xl border border-border/60 bg-muted/40 hover:bg-muted/70 text-foreground transition-colors shrink-0"
            title={t("memberPortal.accountProfile.settings", nom("Cài đặt"))}
          >
            <SlidersHorizontal className="size-4 text-muted-foreground" />
          </button>
        </div>

        {/* Thông tin phụ: Trường học & Tiểu sử (nếu có) */}
        {(schoolName || profileBio) && (
          <div className="pt-1 space-y-2">
            {schoolName && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold border border-primary/20 max-w-full truncate">
                <GraduationCap className="size-3.5 shrink-0" />
                <span className="truncate">{t("memberPortal.accountProfile.studentBadge", nom("HSSV tại {{school}}"), { school: schoolName })}</span>
              </div>
            )}
            {profileBio && (
              <p className="text-xs text-muted-foreground leading-relaxed italic bg-muted/30 p-2.5 rounded-xl border border-border/40">
                "{profileBio}"
              </p>
            )}
          </div>
        )}

        {/* 2 nút hành động chính chuẩn Apple */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/40">
          <button
            type="button"
            onClick={() => openSheet("personal")}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-border/60 bg-muted/40 hover:bg-muted/80 text-foreground font-semibold text-xs sm:text-[13px] transition-colors active:scale-[0.98]"
          >
            <Edit3 className="size-3.5 text-primary shrink-0" />
            <span className="truncate">{t("memberPortal.accountProfile.editProfile", nom("Chỉnh sửa hồ sơ"))}</span>
          </button>
          <button
            type="button"
            onClick={() => openUtility("bio")}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-border/60 bg-muted/40 hover:bg-muted/80 text-foreground font-semibold text-xs sm:text-[13px] transition-colors active:scale-[0.98]"
          >
            <Sparkles className="size-3.5 text-indigo-500 shrink-0" />
            <span className="truncate">{t("memberPortal.accountProfile.viewBio", "Xem Hugo Bio")}</span>
          </button>
        </div>
      </section>

      {/* ── 2. WALLET & REWARDS SUMMARY (APPLE WALLET STYLE BANNER) ── */}
      <button
        type="button"
        onClick={() => openUtility("joy_wallet")}
        className="w-full text-left overflow-hidden rounded-2xl border border-amber-500/25 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-4 flex items-center justify-between gap-3 hover:from-amber-500/15 transition-all shadow-xs active:scale-[0.99]"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-10 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/20">
            <Award className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                {t("memberPortal.accountProfile.joyWallet", nom("Ví JOY"))}
              </span>
              <strong className="text-base sm:text-lg font-bold text-foreground tabular-nums">
                {joy.number(joyBalance || 0)}
              </strong>
              <span className="text-xs font-semibold text-muted-foreground">{joy.code}</span>
            </div>
            <p className="text-[11.5px] text-muted-foreground truncate mt-0.5">
              {challengesLoaded ? `${completedMissionsCount}/${challenges.length} nhiệm vụ đã xong` : nom("Đang đồng bộ")} • {activeVoucherCount} vouchers ưu đãi
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 shrink-0">
          <span>{nom(nom("Chi tiết"))}</span>
          <ChevronRight className="size-4" />
        </div>
      </button>

      {/* ── 3. GROUP 1: HỒ SƠ & CÁ NHÂN HÓA ── */}
      <AppleGroupSection title={nom("Hồ sơ & Danh tính")}>
        <AppleRowItem
          icon={User}
          iconColor="bg-blue-500/10 text-blue-500"
          title={t("memberPortal.accountProfile.manageProfile", nom("Quản lý hồ sơ chi tiết"))}
          subtitle={t("memberPortal.accountProfile.manageProfileDetail", nom("Cập nhật avatar, số điện thoại và thông tin liên hệ"))}
          onClick={() => openSheet("manage")}
        />
        <AppleRowItem
          icon={Sparkles}
          iconColor="bg-indigo-500/10 text-indigo-500"
          title={t("memberPortal.accountProfile.personalBioPage", nom("Trang cá nhân Hugo Bio"))}
          subtitle={t("memberPortal.accountProfile.personalBioPageDetail", nom("Trang cá nhân công khai độc bản"))}
          onClick={() => openUtility("bio")}
        />
        {publicLink && (
          <AppleRowItem
            icon={Share2}
            iconColor="bg-sky-500/10 text-sky-500"
            title={t("memberPortal.accountProfile.publicWebBio", nom("Xem trang Bio trên Web"))}
            subtitle={t("memberPortal.accountProfile.publicWebBioDetail", nom("Mở liên kết bio cá nhân trong trình duyệt"))}
            href={publicLink}
          />
        )}
      </AppleGroupSection>

      {/* ── 4. GROUP 2: TÙY BIẾN & HỆ THỐNG (INLINE TOGGLES) ── */}
      <AppleGroupSection title={nom("Tùy biến & Tiết kiệm năng lượng")}>
        <AppleRowItem
          icon={Palette}
          iconColor="bg-violet-500/10 text-violet-500"
          title={t("memberPortal.accountProfile.personalTheme", nom("Nền & Theme Aura"))}
          value={t(auraThemeTranslationKey(resolveActivePortalTheme(bio), "Name"), nom("Mặc định"))}
          onClick={() => openSheet("themes")}
        />
        <AppleRowItem
          icon={Globe}
          iconColor="bg-teal-500/10 text-teal-500"
          title={t("memberPortal.accountProfile.systemLanguage", nom("Ngôn ngữ hệ thống"))}
          value={languageLabel(currentLang)}
          onClick={() => openSheet("language")}
        />
        {/* Inline Toggle: Thông báo đẩy */}
        <AppleRowItem
          icon={Bell}
          iconColor="bg-amber-500/10 text-amber-500"
          title={t("memberPortal.settings.appNotifications", nom("Thông báo ứng dụng"))}
          subtitle={t("memberPortal.settings.appNotificationsDesc", nom("Nhận tin tức bảo mật và biến động số dư"))}
          trailing={
            <ToggleSwitch
              checked={pushEnabled}
              onChange={handleTogglePush}
              disabled={pushBusy}
              label={t("memberPortal.settings.enableNotifications", nom("Bật thông báo"))}
            />
          }
        />
        {/* Inline Toggle: Chế độ tiết kiệm năng lượng Eco */}
        <div className="px-4 py-2.5">
          <EcoToggle />
        </div>
      </AppleGroupSection>

      {/* ── 5. GROUP 3: BẢO MẬT & QUYỀN TRUY CẬP ── */}
      <AppleGroupSection title={nom("Bảo mật & Quyền riêng tư")}>
        <AppleRowItem
          icon={Lock}
          iconColor="bg-rose-500/10 text-rose-500"
          title={t("memberPortal.accountProfile.security", nom("Bảo mật sinh trắc học & PIN"))}
          subtitle={t("memberPortal.accountProfile.biometricsDetail", nom("Xác thực FaceID, TouchID và WebAuthn"))}
          onClick={() => openSheet("security")}
        />
        <AppleRowItem
          icon={Zap}
          iconColor="bg-orange-500/10 text-orange-500"
          title={t("memberPortal.accountProfile.devicePermissions", nom("Quyền truy cập thiết bị"))}
          subtitle={t("memberPortal.accountProfile.devicePermissionsDetail", nom("Kiểm tra camera, microphone và thông báo"))}
          onClick={() => {
            hapticSelect();
            window.dispatchEvent(new Event("hugo:show-permission-primer"));
          }}
        />
      </AppleGroupSection>

      {/* ── 6. GROUP 4: 2 BẢN VĂN BẢN QUY CHUẨN DUY NHẤT ── */}
      <AppleGroupSection title={nom("Văn bản pháp lý & Quy ước hệ thống")}>
        <AppleRowItem
          icon={STANDARDIZED_DOCS["terms-manifest"].icon}
          iconColor={STANDARDIZED_DOCS["terms-manifest"].color}
          title={t(STANDARDIZED_DOCS["terms-manifest"].titleKey, STANDARDIZED_DOCS["terms-manifest"].defaultTitle)}
          subtitle={STANDARDIZED_DOCS["terms-manifest"].subtitle}
          badge={STANDARDIZED_DOCS["terms-manifest"].badge}
          onClick={() => navigate("/member/account/terms-manifest")}
        />
        <AppleRowItem
          icon={STANDARDIZED_DOCS["database-policy"].icon}
          iconColor={STANDARDIZED_DOCS["database-policy"].color}
          title={t(STANDARDIZED_DOCS["database-policy"].titleKey, STANDARDIZED_DOCS["database-policy"].defaultTitle)}
          subtitle={STANDARDIZED_DOCS["database-policy"].subtitle}
          badge={STANDARDIZED_DOCS["database-policy"].badge}
          onClick={() => navigate("/member/account/database-policy")}
        />
        <AppleRowItem
          icon={BookOpen}
          iconColor="bg-muted text-muted-foreground"
          title="Cẩm nang quy ước toàn diện"
          subtitle={nom("Xem hướng dẫn kiến trúc bảo mật & sơ đồ hệ sinh thái trên web")}
          href="/terms-and-guide"
        />
      </AppleGroupSection>

      {/* ── 7. GROUP 5: ĐĂNG XUẤT ── */}
      <div className="overflow-hidden rounded-2xl border border-border/50 bg-card/85 dark:bg-card/45 shadow-xs">
        <button
          type="button"
          onClick={handleLogout}
          className="flex min-h-[48px] w-full items-center justify-center gap-2 text-[14px] font-semibold text-rose-500 hover:bg-rose-500/10 active:bg-rose-500/20 transition-colors"
        >
          <LogOut className="size-4" />
          <span>{t("memberPortal.accountProfile.logout", nom("Đăng xuất tài khoản"))}</span>
        </button>
      </div>

      {/* ── SHEET MODALS ── */}
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

      {activeSheet === "manage" && (
        <AccountSheet
          title={t("memberPortal.accountProfile.manageProfile", nom("Quản lý hồ sơ"))}
          onClose={closeSheet}
          wide
        >
          <React.Suspense fallback={<SheetFallback />}>
            <MemberManageTab
              bio={bio}
              publicLink={publicLink}
              handleCopyLink={handleDeleteBio}
              handleDeleteBio={handleDeleteBio}
              saving={saving}
            />
          </React.Suspense>
        </AccountSheet>
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
