import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import BiometricLoginCard from "./BiometricLoginCard";
import ToggleSwitch from "../common/ToggleSwitch";
import { webPushHelper } from "../../utils/webPushHelper";
import { webauthnHelper } from "../../utils/webauthnHelper";
import { playNotificationSound } from "../../utils/audio";
import { isNotificationSoundEnabled, setNotificationSoundEnabled } from "../../utils/notificationSoundPref";

const LANGUAGES = [
  { code: "vi", label: "Tiếng Việt" },
  { code: "en", label: "English" },
];

// One grouped card per section (notifications / login / preferences), each
// holding one or more rows separated by a hairline divider — replaces the
// old "one floating box per setting" layout with the denser native-settings
// look (iOS Settings / Android system settings) members already know.
function SettingsGroup({ label, children }) {
  return (
    <div className="space-y-2">
      {label && <p className="px-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{label}</p>}
      <div className="bg-white dark:bg-card rounded-xl border border-zinc-200/50 dark:border-zinc-800/60 shadow-sm divide-y divide-zinc-100 dark:divide-zinc-800/60 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function SettingsRow({ icon, iconColor = "text-primary", iconBg = "bg-primary/10", title, desc, control, warn }) {
  return (
    <div className="flex items-start gap-3 p-4">
      <span className={`w-8 h-8 rounded-full ${iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
        <span className={`material-symbols-outlined text-base ${iconColor}`}>{icon}</span>
      </span>
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-xs font-bold text-zinc-800 dark:text-zinc-100">{title}</p>
        {desc && <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400 leading-relaxed">{desc}</p>}
        {warn && <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold pt-0.5">{warn}</p>}
      </div>
      {control && <div className="shrink-0 self-center">{control}</div>}
    </div>
  );
}

// One settings hub for everything that used to be scattered (the biometric
// card lived inline in Personal Info, notifications had no UI at all) — a
// single "Cài đặt" tab so members have one place to find this instead of
// digging through Personal Info for account-level toggles.
export default function MemberSettingsTab({ memberSession, showToast, handleLogout }) {
  const { t, i18n } = useTranslation();
  const [pushSupported, setPushSupported] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => isNotificationSoundEnabled());
  const [biometricSupported, setBiometricSupported] = useState(false);
  const email = memberSession?.email;

  useEffect(() => {
    setPushSupported(webPushHelper.isSupported());
    webPushHelper.isSubscribed().then(setPushEnabled);
    setBiometricSupported(webauthnHelper.isSupported());
  }, []);

  const handleTogglePush = async () => {
    setPushBusy(true);
    try {
      if (pushEnabled) {
        await webPushHelper.unsubscribe();
        setPushEnabled(false);
        showToast?.(t("memberPortal.settings.pushDisabledToast"), "success");
      } else {
        const perm = await webPushHelper.requestPermission();
        if (perm === "granted" && email) {
          await webPushHelper.registerAndSubscribe(email);
          setPushEnabled(true);
          showToast?.(t("memberPortal.settings.pushEnabledToast"), "success");
        } else if (perm === "denied") {
          showToast?.(t("memberPortal.settings.pushDeniedToast"), "warning");
        }
      }
    } catch (_) {
      showToast?.(t("memberPortal.settings.pushErrorToast"), "error");
    } finally {
      setPushBusy(false);
    }
  };

  const handleToggleSound = (next) => {
    setSoundEnabled(next);
    setNotificationSoundEnabled(next);
    if (next) playNotificationSound(); // instant preview so the toggle's effect is obvious
  };

  const currentLang = i18n.language?.startsWith("en") ? "en" : "vi";
  const selectLanguage = (code) => {
    if (code === currentLang) return;
    i18n.changeLanguage(code); // persists to localStorage via i18next-browser-languagedetector — becomes the default on next visit
  };

  return (
    <div className="max-w-xl mx-auto space-y-5 animate-fadeIn">
      <div className="space-y-1 text-left px-1">
        <h2 className="text-sm font-black text-zinc-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-primary">settings</span>
          {t("memberPortal.settings.title")}
        </h2>
        <p className="text-[10px] text-zinc-455 dark:text-zinc-400">{t("memberPortal.settings.desc")}</p>
      </div>

      <SettingsGroup label={t("memberPortal.settings.groupNotifications")}>
        <SettingsRow
          icon="notifications"
          title={t("memberPortal.settings.pushTitle")}
          desc={pushSupported ? t("memberPortal.settings.pushDesc") : null}
          warn={!pushSupported ? t("memberPortal.settings.pushUnsupported") : null}
          control={pushSupported && (
            <ToggleSwitch checked={pushEnabled} onChange={handleTogglePush} disabled={pushBusy} label={t("memberPortal.settings.pushTitle")} />
          )}
        />
        <SettingsRow
          icon="volume_up"
          iconColor="text-amber-500"
          iconBg="bg-amber-500/10"
          title={t("memberPortal.settings.soundTitle")}
          desc={t("memberPortal.settings.soundDesc")}
          control={<ToggleSwitch checked={soundEnabled} onChange={handleToggleSound} label={t("memberPortal.settings.soundTitle")} />}
        />
      </SettingsGroup>

      {biometricSupported && email && (
        <SettingsGroup label={t("memberPortal.settings.groupLogin")}>
          <BiometricLoginCard memberSession={memberSession} showToast={showToast} bare />
        </SettingsGroup>
      )}

      <SettingsGroup label={t("memberPortal.settings.groupPreferences")}>
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-violet-500/10 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-base text-violet-500">language</span>
            </span>
            <div>
              <p className="text-xs font-bold text-zinc-800 dark:text-zinc-100">{t("memberPortal.settings.languageTitle")}</p>
              <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400 leading-relaxed">{t("memberPortal.settings.languageDesc")}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 pl-11">
            {LANGUAGES.map((lng) => (
              <button
                key={lng.code}
                onClick={() => selectLanguage(lng.code)}
                className={`relative flex items-center justify-center gap-2 py-2.5 rounded-md text-xs font-bold transition-all border ${
                  currentLang === lng.code
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "bg-transparent text-zinc-500 dark:text-zinc-400 border-zinc-200/70 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
                }`}
              >
                {lng.label}
                {currentLang === lng.code && (
                  <span className="material-symbols-outlined text-sm absolute right-2.5">check_circle</span>
                )}
              </button>
            ))}
          </div>
        </div>
        <SettingsRow icon="more_horiz" iconColor="text-zinc-400" iconBg="bg-zinc-400/10" title={t("memberPortal.settings.comingSoonTitle")} desc={t("memberPortal.settings.comingSoonDesc")} />
      </SettingsGroup>

      <button
        onClick={handleLogout}
        className="w-full py-2.5 rounded-md border border-destructive/20 bg-destructive/5 text-destructive hover:bg-destructive/10 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
      >
        <span className="material-symbols-outlined text-sm">logout</span>
        {t("memberPortal.settings.logout")}
      </button>
    </div>
  );
}
