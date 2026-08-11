import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { memberTier, TierBadge } from "../../lib/memberTier";
import BiometricLoginCard from "./BiometricLoginCard";
import ToggleSwitch from "../common/ToggleSwitch";
import { pushService } from "../../services/pushService";
import { webauthnHelper } from "../../utils/webauthnHelper";
import { hapticSelect } from "../../utils/haptics";
import PersonalInfoSubTab from "./PersonalInfoSubTab";
import JoyCard from "./card/JoyCard";
import { useJoyStore } from "../../stores/joyStore";
import {
  ChevronRight,
  Bell,
  Lock,
  Globe,
  Sparkles,
  QrCode,
  Gift,
  PlusCircle,
  LogOut,
  Check,
  X,
  Share2,
  LocateFixed,
} from "lucide-react";
import EcoToggle from "../../Save_E/EcoToggle";

const LANGUAGES = [
  { code: "vi", label: "Tiếng Việt" },
  { code: "en", label: "English" }
];

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
  onOpenParticleModal,
  onSelectTab,
  onSelectUtility
}) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [activeSheet, setActiveSheet] = useState(null); // null | "personal" | "notifications" | "security" | "language"

  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const email = memberSession?.email;
  const joyBalance = useJoyStore((state) => state.balance);
  const referralCode = useJoyStore((state) => state.referralCode);
  const referralCount = useJoyStore((state) => state.referralCount);

  useEffect(() => {
    pushService.isSubscribed().then(setPushEnabled);
    setBiometricSupported(webauthnHelper.isSupported());
  }, []);

  useEffect(() => {
    const isOpen = Boolean(activeSheet);
    window.dispatchEvent(new CustomEvent("hugo:fullsheet", { detail: { open: isOpen } }));
    return () => {
      window.dispatchEvent(new CustomEvent("hugo:fullsheet", { detail: { open: false } }));
    };
  }, [activeSheet]);

  const handleTogglePush = async () => {
    setPushBusy(true);
    try {
      if (pushEnabled) {
        await pushService.unsubscribe();
        setPushEnabled(false);
        showToast?.(t("memberPortal.settings.pushDisabledToast"), "success");
      } else {
        // One call for both shells: Web Push on the browser, APNs/FCM in the
        // store builds. The facade returns the outcome instead of throwing.
        const result = await pushService.subscribe(email);
        if (result === "granted") {
          setPushEnabled(true);
          showToast?.(t("memberPortal.settings.pushEnabledToast"), "success");
        } else if (result === "denied") {
          showToast?.(t("memberPortal.settings.pushDeniedToast"), "warning");
        }
      }
    } catch {
      showToast?.(t("memberPortal.settings.pushErrorToast"), "error");
    } finally {
      setPushBusy(false);
    }
  };

  const currentLang = i18n.language?.startsWith("en") ? "en" : "vi";
  const selectLanguage = (code) => {
    if (code === currentLang) return;
    i18n.changeLanguage(code);
  };

  const displayName = formData?.displayName || bio?.displayName || memberSession?.displayName || t("memberPortal.navigation.memberFallback");

  const copyReferralCode = async () => {
    const code = referralCode || bio?.referralCode;
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      showToast?.(t("memberPortal.joy.referral.copied"), "success");
    } catch {
      showToast?.(t("memberPortal.bioPreview.copyError"), "error");
    }
  };

  return (
    <div className="hugo-account-shell mx-auto space-y-3 animate-fadeIn text-left select-none pb-28 font-sans">
      {/* Identity sits outside the settings cards, like an Apple Account header. */}
      <header className="hugo-account-header">
        <div className="hugo-account-titlebar">
          <span>Hugo Account</span>
        </div>
      <button
        type="button"
        onClick={() => { hapticSelect(); setActiveSheet("personal"); }}
        className="hugo-account-member flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          <div className="hugo-account-avatar relative rounded-full bg-muted overflow-hidden shrink-0">
            {formData.avatarUrl ? (
              <img src={formData.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary text-white text-xl font-semibold">
                {displayName[0]?.toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-base font-black text-foreground truncate leading-snug">
              {displayName}
            </h2>
            <p className="text-[11px] font-medium text-muted-foreground truncate mt-0.5">
              {memberSession?.email || t("memberPortal.settings.account.personalInformation")}
            </p>
            {/* Hạng Star nằm ngay dưới tên — đây là nơi người dùng tìm "mình là ai". */}
            <TierBadge tier={memberTier({ ...formData, starVip: bio?.starVip })} className="mt-1.5" />
          </div>
        </div>

        <span className="hugo-account-member-edit" aria-hidden="true">
          <ChevronRight className="w-4 h-4" />
        </span>
      </button>
      </header>

      <section className="hugo-account-joy-card" aria-label={t("memberPortal.account.membershipCard")}>
        <JoyCard
          referralCount={referralCount}
          balance={joyBalance}
          referralCode={referralCode || bio?.referralCode}
          displayName={displayName}
          email={email}
          onCopyReferral={copyReferralCode}
          onOpenTransferModal={() => onOpenParticleModal?.()}
        />
      </section>

      {/* ── 3. CÁC NHÓM CÀI ĐẶT (danh sách inset kiểu iOS Settings) ────────── */}
      <AccountSection title={t("memberPortal.settings.account.bioTitle")}>
        <AccountRow
          icon={Sparkles}
          tint="violet"
          title={t("memberPortal.settings.account.bioTitle")}
          detail={t("memberPortal.settings.account.bioDescription")}
          onClick={() => {
            hapticSelect();
            if (onSelectUtility) onSelectUtility("bio");
            else if (onSelectTab) onSelectTab("utilities");
            else navigate("/member/utilities/bio");
          }}
        />
        {publicLink && (
          <AccountRow
            as="a"
            href={publicLink}
            icon={Share2}
            tint="sky"
            title={t("memberPortal.settings.account.publicBio")}
            detail={t("memberPortal.settings.account.publicBioDescription")}
            trailingIcon="open_in_new"
          />
        )}
      </AccountSection>

      <AccountSection title="Ví & JOY">
        <AccountRow
          icon={PlusCircle}
          tint="orange"
          title={t("memberPortal.settings.account.topUpJoy")}
          onClick={() => { hapticSelect(); if (onSelectTab) onSelectTab("joy"); else navigate("/member/joy"); }}
        />
        <AccountRow
          icon={Gift}
          tint="pink"
          title={t("memberPortal.settings.account.redeemCode")}
          onClick={() => { hapticSelect(); if (onSelectTab) onSelectTab("joy"); else navigate("/member/joy"); }}
        />
        <AccountRow
          icon={QrCode}
          tint="green"
          title={t("memberPortal.settings.account.giftJoy")}
          onClick={() => {
            hapticSelect();
            if (onOpenParticleModal) onOpenParticleModal();
            else if (onSelectTab) onSelectTab("joy");
            else navigate("/member/joy");
          }}
        />
      </AccountSection>

      <AccountSection title="Quyền riêng tư & thông báo">
        <AccountRow
          icon={Bell}
          tint="blue"
          title={t("memberPortal.settings.account.notifications")}
          detail={t("memberPortal.settings.account.notificationsDescription")}
          onClick={() => { hapticSelect(); setActiveSheet("notifications"); }}
        />
        <AccountRow
          icon={LocateFixed}
          tint="emerald"
          title={t("memberPortal.permissions.title")}
          detail={t("memberPortal.permissions.description")}
          onClick={() => { hapticSelect(); window.dispatchEvent(new Event("hugo:show-permission-primer")); }}
        />
        <AccountRow
          icon={Lock}
          tint="purple"
          title={t("memberPortal.settings.account.privacy")}
          detail={t("memberPortal.settings.account.privacyDescription")}
          onClick={() => { hapticSelect(); setActiveSheet("security"); }}
        />
      </AccountSection>

      <AccountSection title="Hệ thống">
        <AccountRow
          icon={Globe}
          tint="teal"
          title={t("memberPortal.settings.account.language")}
          value={currentLang === "vi" ? "Tiếng Việt" : "English"}
          onClick={() => { hapticSelect(); setActiveSheet("language"); }}
        />
      </AccountSection>

      {/* ── 6b. CHẾ ĐỘ BẢO VỆ MÔI TRƯỜNG (dưới mọi mục, trên nút đăng xuất) ─── */}
      <EcoToggle />

      {/* ── 7. SIGN OUT BUTTON (DESTRUCTIVE RED ROW) ─────────────────────────── */}
      <div className="hugo-account-group">
        <button type="button" onClick={handleLogout} className="hugo-account-logout">
          <LogOut className="w-[18px] h-[18px]" />
          <span>{t("memberPortal.settings.account.signOut")}</span>
        </button>
      </div>

      {/* ── 8. MODAL SHEET: PERSONAL INFO ─────────────────────────────────────── */}
      {activeSheet === "personal" && (
        <div className="portal-safe-modal fixed inset-0 bg-black/45 backdrop-blur-xl flex items-end sm:items-center justify-center z-[500] p-0 sm:p-4 animate-fadeIn">
          {/* Sheet kiểu iOS: thanh kéo, tiêu đề lớn, nút "Xong" bên phải. */}
          <div className="ios-sheet-panel bg-card border-t sm:border border-border/60 rounded-t-[34px] sm:rounded-[30px] max-w-lg w-full shadow-2xl animate-slideUp text-left flex flex-col max-h-[92dvh] sm:max-h-[88vh]">
            <div className="shrink-0 px-5 pt-2.5 pb-3">
              <span className="mx-auto mb-3 block h-1.5 w-10 rounded-full bg-foreground/15 sm:hidden" aria-hidden="true" />
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-[22px] font-bold tracking-[-0.02em] text-foreground">
                  {t("memberPortal.settings.account.personalInformation")}
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveSheet(null)}
                  className="min-h-11 shrink-0 px-1 text-[17px] font-semibold text-primary active:opacity-60"
                >
                  Xong
                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5">

            <PersonalInfoSubTab
              formData={formData}
              handleFieldChange={handleFieldChange}
              handleSave={async (event) => {
                await handleSave(event);
                setActiveSheet(null);
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
            </div>
          </div>
        </div>
      )}

      {/* ── 9. MODAL SHEET: NOTIFICATIONS ────────────────────────────────────── */}
      {activeSheet === "notifications" && (
        <div className="portal-safe-modal fixed inset-0 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center z-[500] p-0 sm:p-4 animate-fadeIn">
          <div className="bg-card border-t sm:border border-border/60 rounded-t-[32px] sm:rounded-[32px] p-6 max-w-sm w-full space-y-4 shadow-2xl animate-slideUp text-left">
            <div className="flex items-center justify-between border-b border-border/30 pb-3">
              <h3 className="text-base font-black text-foreground">{t("memberPortal.settings.account.notificationSettings")}</h3>
              <button onClick={() => setActiveSheet(null)} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/40 border border-border/30">
              <div>
                <h4 className="text-xs font-black text-foreground">{t("memberPortal.settings.pushTitle")}</h4>
                <p className="text-[10.5px] text-muted-foreground">{t("memberPortal.settings.account.pushDescription")}</p>
              </div>
              <ToggleSwitch checked={pushEnabled} onChange={handleTogglePush} disabled={pushBusy} label={t("memberPortal.settings.pushTitle")} />
            </div>

            <button
              onClick={() => setActiveSheet(null)}
              className="w-full py-2.5 bg-muted text-foreground font-black text-xs uppercase tracking-wider rounded-xl"
            >
              {t("memberPortal.settings.account.done")}
            </button>
          </div>
        </div>
      )}

      {/* ── 10. MODAL SHEET: PRIVACY & ACCESS ──────────────────────────────────── */}
      {activeSheet === "security" && (
        <div className="portal-safe-modal fixed inset-0 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center z-[500] p-0 sm:p-4 animate-fadeIn">
          <div className="bg-card border-t sm:border border-border/60 rounded-t-[32px] sm:rounded-[32px] p-6 max-w-sm w-full space-y-4 shadow-2xl animate-slideUp text-left">
            <div className="flex items-center justify-between border-b border-border/30 pb-3">
              <h3 className="text-base font-black text-foreground">{t("memberPortal.settings.account.privacyBiometrics")}</h3>
              <button onClick={() => setActiveSheet(null)} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {biometricSupported && email ? (
              <div className="p-2">
                <BiometricLoginCard memberSession={memberSession} showToast={showToast} bare />
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">{t("memberPortal.settings.account.biometricUnsupported")}</p>
            )}

            <button
              onClick={() => setActiveSheet(null)}
              className="w-full py-2.5 bg-muted text-foreground font-black text-xs uppercase tracking-wider rounded-xl"
            >
              {t("memberPortal.settings.account.done")}
            </button>
          </div>
        </div>
      )}

      {/* ── 11. MODAL SHEET: LANGUAGE SELECTION ──────────────────────────────── */}
      {activeSheet === "language" && (
        <div className="portal-safe-modal fixed inset-0 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center z-[500] p-0 sm:p-4 animate-fadeIn">
          <div className="bg-card border-t sm:border border-border/60 rounded-t-[32px] sm:rounded-[32px] p-6 max-w-sm w-full space-y-4 shadow-2xl animate-slideUp text-left">
            <div className="flex items-center justify-between border-b border-border/30 pb-3">
              <h3 className="text-base font-black text-foreground">{t("memberPortal.settings.account.chooseLanguage")}</h3>
              <button onClick={() => setActiveSheet(null)} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-2">
              {LANGUAGES.map((lng) => {
                const active = currentLang === lng.code;
                return (
                  <button
                    key={lng.code}
                    onClick={() => { selectLanguage(lng.code); setActiveSheet(null); }}
                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                      active ? "bg-primary/10 border-primary text-primary font-black" : "bg-card border-border/40 text-foreground font-bold"
                    }`}
                  >
                    <span>{lng.label}</span>
                    {active && <Check className="w-4 h-4 text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const ROW_TINTS = {
  violet: "#7C5CFF", sky: "#0A84FF", blue: "#0A84FF", emerald: "#30D158",
  purple: "#BF5AF2", teal: "#40C8E0", orange: "#FF9F0A", pink: "#FF375F",
  green: "#30D158",
};

/** Tiêu đề nhóm + khối inset — cấu trúc của Cài đặt trên iOS. */
function AccountSection({ title, children }) {
  return (
    <section className="hugo-account-section">
      {title && <h3 className="hugo-account-section-title">{title}</h3>}
      <div className="hugo-account-group">{children}</div>
    </section>
  );
}

/**
 * Một hàng cài đặt. Trước đây mỗi hàng là <div onClick> nên bàn phím không tới
 * được và không có viền focus — bấm bằng chuột thì chạy, dùng phím thì như nút
 * chết. Giờ luôn là <button> (hoặc <a> khi mở link ngoài).
 */
function AccountRow({ as = "button", icon: Icon, tint = "blue", title, detail, value, trailingIcon = "chevron", onClick, href }) {
  const Tag = as;
  const props = as === "a"
    ? { href, target: "_blank", rel: "noreferrer" }
    : { type: "button", onClick };

  return (
    <Tag {...props} className="hugo-account-row">
      <span className="hugo-account-row-icon" style={{ background: ROW_TINTS[tint] || ROW_TINTS.blue }}>
        <Icon className="w-[17px] h-[17px]" strokeWidth={2.2} />
      </span>
      <span className="hugo-account-row-text">
        <span className="hugo-account-row-title">{title}</span>
        {detail && <span className="hugo-account-row-detail">{detail}</span>}
      </span>
      {value && <span className="hugo-account-row-value">{value}</span>}
      {trailingIcon === "chevron"
        ? <ChevronRight className="hugo-account-row-chevron" />
        : <span className="material-symbols-outlined hugo-account-row-chevron" aria-hidden="true">{trailingIcon}</span>}
    </Tag>
  );
}
