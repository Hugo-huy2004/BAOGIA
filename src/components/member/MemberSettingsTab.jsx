import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
} from "lucide-react";

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

      {/* ── 3. SUB PROFILE CARD: HUGO BIO PROFILE ──────────────────────────── */}
      <div>
        <div
          onClick={() => {
            hapticSelect();
            if (onSelectUtility) onSelectUtility("bio");
            else if (onSelectTab) onSelectTab("utilities");
            else navigate("/member/utilities/bio");
          }}
          className="hugo-account-bio-card flex items-center justify-between cursor-pointer transition-all active:scale-[0.99]"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-500 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xs font-black text-foreground">{t("memberPortal.settings.account.bioTitle")}</h3>
              <p className="text-[10.5px] text-muted-foreground truncate">
                {t("memberPortal.settings.account.bioDescription")}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground/60 shrink-0" />
        </div>
      </div>

      {/* ── 4. GROUP 1: APPLE ACCOUNT SETTINGS INSET GROUP ──────────────────── */}
      <div className="hugo-account-group">


        {/* Notifications */}
        <div
          onClick={() => { hapticSelect(); setActiveSheet("notifications"); }}
          className="hugo-account-row flex items-center justify-between cursor-pointer"
          data-tone="blue"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-foreground">{t("memberPortal.settings.account.notifications")}</h4>
              <span className="text-[10.5px] text-muted-foreground block">{t("memberPortal.settings.account.notificationsDescription")}</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
        </div>

        {/* Privacy & Access */}
        <div
          onClick={() => { hapticSelect(); setActiveSheet("security"); }}
          className="hugo-account-row flex items-center justify-between cursor-pointer"
          data-tone="purple"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-foreground">{t("memberPortal.settings.account.privacy")}</h4>
              <span className="text-[10.5px] text-muted-foreground block">{t("memberPortal.settings.account.privacyDescription")}</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
        </div>
      </div>

      {/* ── 5. QUICK ACTION PILL BUTTONS (APPLE ACCOUNT 3-COLUMN PILL GRID) ───── */}
      <div className="hugo-account-actions grid grid-cols-3 gap-2.5 text-center">
        <button
          onClick={() => {
            hapticSelect();
            if (onSelectTab) onSelectTab("joy");
            else navigate("/member/joy");
          }}
          className="flex flex-col items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
          data-tone="orange"
        >
          <PlusCircle className="w-5 h-5 text-primary" />
          <span className="text-[10.5px] font-black">{t("memberPortal.settings.account.topUpJoy")}</span>
        </button>

        <button
          onClick={() => {
            hapticSelect();
            if (onSelectTab) onSelectTab("joy");
            else navigate("/member/joy");
          }}
          className="flex flex-col items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
          data-tone="pink"
        >
          <Gift className="w-5 h-5 text-primary" />
          <span className="text-[10.5px] font-black">{t("memberPortal.settings.account.redeemCode")}</span>
        </button>

        <button
          onClick={() => {
            hapticSelect();
            if (onOpenParticleModal) onOpenParticleModal();
            else if (onSelectTab) onSelectTab("joy");
            else navigate("/member/joy");
          }}
          className="flex flex-col items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
          data-tone="green"
        >
          <QrCode className="w-5 h-5 text-primary" />
          <span className="text-[10.5px] font-black">{t("memberPortal.settings.account.giftJoy")}</span>
        </button>
      </div>

      {/* ── 6. GROUP 2: SYSTEM & LANGUAGE INSET GROUP ────────────────────────── */}
      <div className="hugo-account-group">
        {/* Language Selection */}
        <div
          onClick={() => { hapticSelect(); setActiveSheet("language"); }}
          className="hugo-account-row flex items-center justify-between cursor-pointer"
          data-tone="teal"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-foreground">{t("memberPortal.settings.account.language")}</h4>
              <span className="text-[10.5px] text-muted-foreground block">{currentLang === "vi" ? "Tiếng Việt" : "English"}</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
        </div>

        {/* Public Bio Page Link */}
        {publicLink && (
          <a
            href={publicLink}
            target="_blank"
            rel="noreferrer"
            className="hugo-account-row flex items-center justify-between"
            data-tone="cyan"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
                <Share2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-foreground">{t("memberPortal.settings.account.publicBio")}</h4>
                <span className="text-[10.5px] text-muted-foreground block">{t("memberPortal.settings.account.publicBioDescription")}</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
          </a>
        )}
      </div>

      {/* ── 7. SIGN OUT BUTTON (DESTRUCTIVE RED ROW) ─────────────────────────── */}
      <button
        onClick={handleLogout}
        className="hugo-account-logout w-full active:scale-98 transition-all flex items-center justify-center gap-2"
      >
        <LogOut className="w-4 h-4" />
        <span>{t("memberPortal.settings.account.signOut")}</span>
      </button>

      {/* ── 8. MODAL SHEET: PERSONAL INFO ─────────────────────────────────────── */}
      {activeSheet === "personal" && (
        <div className="portal-safe-modal fixed inset-0 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center z-[500] p-0 sm:p-4 animate-fadeIn">
          <div className="bg-card border-t sm:border border-border/60 rounded-t-[32px] sm:rounded-[32px] p-6 max-w-lg w-full space-y-4 shadow-2xl animate-slideUp text-left max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border/30 pb-3">
              <h3 className="text-base font-black text-foreground">{t("memberPortal.settings.account.personalInformation")}</h3>
              <button onClick={() => setActiveSheet(null)} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

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
