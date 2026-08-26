import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Bell,
  ChevronRight,
  ExternalLink,
  FileText,
  Fingerprint,
  Globe,
  GraduationCap,
  LogOut,
  MapPin,
  Palette,
  Settings2,
  ShieldCheck,
  UserRound,
  WalletCards,
} from "lucide-react";
import { pushService } from "../../services/pushService";
import { webauthnHelper } from "../../utils/webauthnHelper";
import { hapticSelect } from "../../utils/haptics";
import { auraThemeTranslationKey, resolveActivePortalTheme } from "../../data/auraThemes";
import { SUPPORTED_LANGUAGES, languageCode, languageLabel } from "../../i18n/languages";
import { changeAppLanguage } from "../../i18n/config";
import { formatFullAddress, profileAnswerDisplayName, religionDisplayName } from "../../lib/profileDisplay";
import BiometricLoginCard from "./BiometricLoginCard";

const AccountSheet = React.lazy(() => import("./account/AccountSheet"));
const AccountThemeSheet = React.lazy(() => import("./account/AccountThemeSheet"));
const PersonalInfoSubTab = React.lazy(() => import("./PersonalInfoSubTab"));
const MemberManageTab = React.lazy(() => import("./MemberManageTab"));
const MemberDocReader = React.lazy(() => import("./account/MemberDocReader"));

const DOCUMENTS = {
  "joy-rules": "memberPortal.accountHub.documents.joyRulesTitle",
  "rights-access": "memberPortal.accountHub.documents.rightsTitle",
  privileges: "memberPortal.accountHub.documents.privilegesTitle",
  conditions: "memberPortal.accountHub.documents.conditionsTitle",
  "full-text": "memberPortal.accountHub.documents.fullTextTitle",
};

function Row({ icon: Icon, title, detail, value, onClick, href }) {
  const content = (
    <>
      <Icon className="h-[18px] w-[18px] shrink-0 text-muted-foreground" aria-hidden="true" />
      <span className="min-w-0 flex-1 text-left">
        <strong className="block truncate text-[14px] font-semibold text-foreground">{title}</strong>
        {detail && <small className="mt-0.5 block truncate text-[11.5px] text-muted-foreground">{detail}</small>}
      </span>
      {value && <span className="max-w-[36%] truncate text-[12px] font-medium text-muted-foreground">{value}</span>}
      {href ? <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
    </>
  );
  const className = "flex min-h-[54px] w-full items-center gap-3 px-4 py-2.5 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset";
  if (href) return <a className={className} href={href} target="_blank" rel="noreferrer">{content}</a>;
  return <button type="button" className={className} onClick={onClick}>{content}</button>;
}

function Info({ label, value, wide = false }) {
  return (
    <div className={wide ? "col-span-2 min-w-0" : "min-w-0"}>
      <span className="block text-[10px] sm:text-[10.5px] font-extrabold uppercase tracking-wider text-muted-foreground">{label}</span>
      <strong className="mt-0.5 block text-[13px] sm:text-[13.5px] font-bold leading-snug text-foreground">{value || "—"}</strong>
    </div>
  );
}

export default function MemberSettingsTabRemade({
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
  const [socialSummary, setSocialSummary] = useState(null);
  const currentLang = languageCode(i18n.resolvedLanguage || i18n.language);
  const email = memberSession?.email || bio?.email || "—";
  const displayName = formData?.displayName || bio?.displayName || memberSession?.displayName || t("memberPortal.navigation.memberFallback");
  const schoolName = bio?.isEduVerified
    ? [bio?.verificationRequest?.schoolName, formData.education]
      .find((value) => typeof value === "string" && value.trim() && !value.startsWith("$enc$") && !value.startsWith("enc:"))?.trim() || ""
    : "";
  const profileBio = formData.bio || bio?.bio || formData.headline || bio?.headline || "";
  const privateAddress = formatFullAddress(formData, currentLang) || "—";
  const ethnicity = profileAnswerDisplayName(formData.ethnicity, currentLang) || "—";
  const religion = religionDisplayName(formData.religion, currentLang) || "—";
  const verifiedLat = Number(formData.verifiedLatitude || bio?.verifiedLatitude);
  const verifiedLon = Number(formData.verifiedLongitude || bio?.verifiedLongitude);
  const hasCoordinates = Number.isFinite(verifiedLat) && Number.isFinite(verifiedLon) && (verifiedLat !== 0 || verifiedLon !== 0);
  const locationVerified = Boolean(bio?.locationVerifiedAt || hasCoordinates);
  const identityComplete = privateAddress !== "—" && ethnicity !== "—" && religion !== "—" && locationVerified;
  const mapUrl = hasCoordinates
    ? `https://www.openstreetmap.org/?mlat=${verifiedLat}&mlon=${verifiedLon}#map=16/${verifiedLat}/${verifiedLon}`
    : "";
  const projectCount = Array.isArray(formData.projects) ? formData.projects.length : (Array.isArray(bio?.projects) ? bio.projects.length : 0);
  const skillsAndHobbies = [formData.skills, formData.hobbies].filter(Boolean).join(" · ");

  const memberDocument = useMemo(() => {
    if (!DOCUMENTS[accountSubTab]) return null;
    return { id: accountSubTab, title: t(DOCUMENTS[accountSubTab]) };
  }, [accountSubTab, t]);

  useEffect(() => {
    pushService.isSubscribed().then(setPushEnabled);
  }, []);

  useEffect(() => {
    if (!memberSession?.email) return undefined;
    let active = true;
    fetch("/api/friends")
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((result) => {
        if (active) setSocialSummary({ friends: result.friends?.length || 0, requests: result.incoming?.length || 0 });
      })
      .catch(() => { if (active) setSocialSummary(null); });
    return () => { active = false; };
  }, [memberSession?.email]);

  useEffect(() => {
    if (memberDocument) setActiveSheet(`doc:${memberDocument.id}`);
  }, [memberDocument]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("hugo:fullsheet", { detail: { open: Boolean(activeSheet) } }));
    return () => window.dispatchEvent(new CustomEvent("hugo:fullsheet", { detail: { open: false } }));
  }, [activeSheet]);

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
  const togglePush = async () => {
    setPushBusy(true);
    try {
      if (pushEnabled) {
        await pushService.unsubscribe();
        setPushEnabled(false);
      } else {
        setPushEnabled((await pushService.subscribe(email)) === "granted");
      }
    } catch {
      showToast?.(t("memberPortal.settings.pushErrorToast"), "error");
    } finally {
      setPushBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-28 text-left animate-fadeIn px-2 sm:px-0">
      <section className="relative overflow-hidden rounded-[28px] border border-white/40 dark:border-white/15 bg-white/70 dark:bg-slate-900/70 p-4 sm:p-6 shadow-[0_16px_48px_rgba(0,0,0,0.16)] backdrop-blur-3xl space-y-4 transition-all duration-300" aria-label={t("memberPortal.accountHub.overviewAria")}>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/35 dark:from-white/10 via-white/10 to-transparent rounded-t-[28px]" />
        <div className="pointer-events-none absolute -top-16 -left-16 w-56 h-56 rounded-full bg-blue-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -right-16 w-56 h-56 rounded-full bg-emerald-500/15 blur-3xl" />

        {/* 1. Header Row (@username & Settings Button) */}
        <div className="relative flex items-center justify-between">
          <span className="text-[14px] font-black tracking-tight text-foreground/80 flex items-center gap-1.5">
            <span className="text-primary font-extrabold">@</span>{bio?.slug || "member"}
          </span>
          <button
            type="button"
            onClick={() => openSheet("personal")}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 dark:border-white/10 bg-white/60 dark:bg-slate-800/60 font-extrabold text-[12px] text-foreground hover:bg-white/80 dark:hover:bg-slate-700/80 active:scale-95 transition-all shadow-xs"
          >
            <Settings2 className="w-4 h-4 text-foreground/80" />
          </button>
        </div>

        {/* 2. Avatar + Stats Row */}
        <div className="relative flex items-center justify-between gap-4 pt-1">
          {/* Avatar */}
          <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-full p-[2.5px] bg-gradient-to-tr from-primary via-blue-500 to-sky-400 shadow-lg shrink-0">
            <div className="w-full h-full rounded-full bg-card overflow-hidden relative flex items-center justify-center">
              {formData.avatarUrl ? (
                <img className="w-full h-full object-cover" src={formData.avatarUrl} alt={displayName} />
              ) : (
                <span className="text-2xl font-black text-primary">{displayName.charAt(0).toUpperCase()}</span>
              )}
            </div>
          </div>

          {/* Stats Columns */}
          <div className="flex-1 grid grid-cols-3 gap-1 text-center">
            <div className="min-w-0 flex flex-col items-center justify-center">
              <strong className="block text-[18px] font-black text-foreground tabular-nums truncate">{projectCount}</strong>
              <span className="text-[11px] font-bold tracking-wide text-muted-foreground block truncate">{t("memberPortal.accountProfile.projects")}</span>
            </div>
            <div className="min-w-0 flex flex-col items-center justify-center">
              <strong className="block text-[18px] font-black text-foreground tabular-nums truncate">{socialSummary?.friends ?? "0"}</strong>
              <span className="text-[11px] font-bold tracking-wide text-muted-foreground block truncate">{t("memberPortal.accountProfile.friends")}</span>
            </div>
            <div className="min-w-0 flex flex-col items-center justify-center">
              <strong className="block text-[18px] font-black text-foreground tabular-nums truncate">{socialSummary?.requests ?? "0"}</strong>
              <span className="text-[11px] font-bold tracking-wide text-muted-foreground block truncate">{t("memberPortal.accountProfile.requests")}</span>
            </div>
          </div>
        </div>

        {/* 3. Name, Email, Badge & Bio Info */}
        <div className="relative space-y-2 pt-1">
          <div className="space-y-0.5">
            <h1 className="text-[18px] sm:text-[20px] font-black text-foreground tracking-tight">{displayName}</h1>
            <p className="text-[12px] sm:text-[12.5px] font-semibold text-muted-foreground truncate">{email}</p>
          </div>

          {schoolName && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11.5px] font-extrabold border border-primary/20 max-w-full truncate">
              <GraduationCap className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{t("memberPortal.accountProfile.studentBadge", { school: schoolName })}</span>
            </div>
          )}

          {profileBio && (
            <p className="text-[12.5px] font-medium text-foreground/90 leading-relaxed italic bg-white/40 dark:bg-slate-800/40 p-2.5 rounded-xl border border-white/20 dark:border-white/10 mt-1">
              "{profileBio}"
            </p>
          )}

          {formData.jobTitle && <div className="mt-2"><Info label={t("memberPortal.accountProfile.jobTitle")} value={formData.jobTitle} wide /></div>}
          {skillsAndHobbies && <div className="mt-2"><Info label={t("memberPortal.accountProfile.skillsHobbies")} value={skillsAndHobbies} wide /></div>}
        </div>

        {/* 4. Verification and Details */}
        <div className="relative mt-4 pt-4 border-t border-white/20 dark:border-white/10">
          <button type="button" onClick={() => openSheet("identity-info")} className={`absolute right-0 top-3 flex h-8 w-8 items-center justify-center rounded-full transition-colors ${identityComplete ? "text-emerald-500 bg-emerald-500/10" : "text-amber-500 bg-amber-500/10"}`} aria-label={t("memberPortal.accountProfile.verificationTitle")}>
            <ShieldCheck className="h-4 w-4" />
          </button>
          
          <div className="grid grid-cols-2 gap-x-4 gap-y-4 pr-10">
            <Info label={t("memberPortal.accountProfile.residenceAddress")} value={privateAddress} wide />
            <Info label={t("memberPortal.accountProfile.ethnicity")} value={ethnicity} />
            <Info label={t("memberPortal.accountProfile.religion")} value={religion} />
          </div>

          <div className="mt-4 pt-4 border-t border-white/20 dark:border-white/10 flex items-center gap-2 text-[12px] font-medium text-muted-foreground">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="flex-1 truncate">{t(locationVerified ? "memberPortal.accountProfile.locationVerified" : "memberPortal.accountProfile.noVerifiedLocation")}</span>
            {mapUrl && <a className="font-bold text-primary hover:underline shrink-0" href={mapUrl} target="_blank" rel="noreferrer">{t("memberPortal.accountProfile.viewLocation")}</a>}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[26px] border border-white/20 bg-card/60 shadow-[0_14px_40px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur-[24px]" aria-label={t("memberPortal.accountProfile.settings")}>
        <h2 className="border-b border-white/15 px-4 py-3 text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground">{t("memberPortal.accountProfile.settings")}</h2>
        <div className="divide-y divide-white/10">
          <Row icon={UserRound} title={t("memberPortal.accountProfile.hugoBio")} detail={t("memberPortal.accountProfile.personalBioPageDetail")} onClick={() => openUtility("bio")} />
          <Row icon={WalletCards} title={t("memberPortal.accountProfile.joyWalletTitle")} detail={t("memberPortal.accountProfile.joyAppDetail")} onClick={() => openUtility("joy_wallet")} />
          <Row icon={Palette} title={t("memberPortal.accountProfile.personalTheme")} value={t(auraThemeTranslationKey(resolveActivePortalTheme(bio), "Name"))} onClick={() => openSheet("themes")} />
          <Row icon={Globe} title={t("memberPortal.accountProfile.systemLanguage")} value={languageLabel(currentLang)} onClick={() => openSheet("language")} />
          <Row icon={Bell} title={t("memberPortal.accountProfile.notificationSettings")} detail={t("memberPortal.accountProfile.notificationSettingsDetail")} onClick={() => openSheet("notifications")} />
          <Row icon={MapPin} title={t("memberPortal.accountProfile.devicePermissions")} detail={t("memberPortal.accountProfile.devicePermissionsDetail")} onClick={() => window.dispatchEvent(new Event("hugo:show-permission-primer"))} />
          <Row icon={Fingerprint} title={t("memberPortal.accountProfile.biometrics")} detail={t("memberPortal.accountProfile.biometricsDetail")} onClick={() => openSheet("security")} />
          <Row icon={Settings2} title={t("memberPortal.accountProfile.manageProfile")} detail={t("memberPortal.accountProfile.manageProfileDetail")} onClick={() => openSheet("manage")} />
        </div>
        <details className="border-t border-white/15">
          <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between px-4 text-[14px] font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset">
            <span className="flex items-center gap-3"><FileText className="h-[18px] w-[18px] text-muted-foreground" />{t("memberPortal.accountProfile.documentsAndLegalGroup")}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </summary>
          <div className="divide-y divide-white/10 border-t border-white/10">
            {Object.entries(DOCUMENTS).map(([id, key]) => <Row key={id} icon={FileText} title={t(key)} onClick={() => navigate(`/member/account/${id}`)} />)}
          </div>
        </details>
      </section>

      <button type="button" onClick={handleLogout} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[18px] text-[14px] font-semibold text-red-500 transition-colors hover:bg-red-500/10">
        <LogOut className="h-[18px] w-[18px]" />
        {t("memberPortal.accountProfile.logout")}
      </button>

      <React.Suspense fallback={activeSheet ? <p className="py-8 text-center text-sm text-muted-foreground">{t("memberPortal.accountHub.opening")}</p> : null}>
        {activeSheet === "personal" && (
          <AccountSheet title={t("memberPortal.account.personalInformation")} onClose={closeSheet} wide>
            <PersonalInfoSubTab
              formData={formData} handleFieldChange={handleFieldChange} saving={saving} isDragOver={isDragOver}
              setIsDragOver={setIsDragOver} processFile={processFile} avatarInputRef={avatarInputRef}
              handleAvatarChange={handleAvatarChange} handleRemoveAvatar={handleRemoveAvatar}
              memberSession={memberSession} bio={bio} t={t} handleSave={handleSave}
            />
          </AccountSheet>
        )}
        {activeSheet === "manage" && (
          <AccountSheet title={t("memberPortal.accountProfile.manageProfile")} onClose={closeSheet} wide>
            <MemberManageTab bio={bio} publicLink={publicLink} handleCopyLink={handleCopyLink} handleDeleteBio={handleDeleteBio} saving={saving} />
          </AccountSheet>
        )}
        {activeSheet === "identity-info" && (
          <AccountSheet title={t("memberPortal.accountProfile.verificationTitle")} onClose={closeSheet}>
            <div className="space-y-3 text-[14px] leading-relaxed text-foreground/85">
              <ShieldCheck className={`h-8 w-8 ${identityComplete ? "text-emerald-500" : "text-amber-500"}`} aria-hidden="true" />
              <p>{t(identityComplete ? "memberPortal.accountProfile.verifiedDescription" : "memberPortal.accountProfile.incompleteDescription")}</p>
              <p className="font-semibold text-foreground">{t("memberPortal.accountProfile.adminChangeDescription")}</p>
            </div>
          </AccountSheet>
        )}
        {activeSheet === "themes" && (
          <AccountSheet title={t("memberPortal.accountProfile.personalTheme")} onClose={closeSheet} wide>
            <AccountThemeSheet bio={bio} showToast={showToast} onBioUpdate={onBioUpdate} />
          </AccountSheet>
        )}
        {activeSheet === "language" && (
          <AccountSheet title={t("memberPortal.accountProfile.systemLanguage")} onClose={closeSheet}>
            <div className="space-y-2">
              {SUPPORTED_LANGUAGES.map((language) => (
                <button key={language.code} type="button" onClick={() => changeAppLanguage(language.code)} className={`flex min-h-[50px] w-full items-center justify-between rounded-2xl border px-4 text-left text-[14px] ${currentLang === language.code ? "border-primary bg-primary/10 font-semibold text-primary" : "border-border bg-card text-foreground"}`}>
                  {language.label}
                  {currentLang === language.code && <ShieldCheck className="h-4 w-4" />}
                </button>
              ))}
            </div>
          </AccountSheet>
        )}
        {activeSheet === "notifications" && (
          <AccountSheet title={t("memberPortal.accountProfile.notificationSettings")} onClose={closeSheet}>
            <button type="button" onClick={togglePush} disabled={pushBusy} aria-pressed={pushEnabled} className="flex min-h-[58px] w-full items-center justify-between rounded-2xl border border-border bg-card px-4 text-left">
              <span><strong className="block text-[14px] text-foreground">{t("memberPortal.accountProfile.notifications")}</strong><small className="text-[12px] text-muted-foreground">{t("memberPortal.accountProfile.notificationSettingsDetail")}</small></span>
              <span className={`h-7 w-12 rounded-full p-1 transition-colors ${pushEnabled ? "bg-primary" : "bg-muted"}`}><span className={`block h-5 w-5 rounded-full bg-white transition-transform ${pushEnabled ? "translate-x-5" : ""}`} /></span>
            </button>
          </AccountSheet>
        )}
        {activeSheet === "security" && (
          <AccountSheet title={t("memberPortal.accountProfile.biometrics")} onClose={closeSheet}>
            {webauthnHelper.isSupported() && email ? <BiometricLoginCard memberSession={memberSession} showToast={showToast} bare /> : <p className="text-sm text-muted-foreground">{t("memberPortal.accountProfile.biometricsDetail")}</p>}
          </AccountSheet>
        )}
        {activeSheet?.startsWith("doc:") && memberDocument && (
          <AccountSheet title={memberDocument.title} onClose={closeSheet} wide>
            <MemberDocReader docId={memberDocument.id} />
          </AccountSheet>
        )}
      </React.Suspense>
    </div>
  );
}
