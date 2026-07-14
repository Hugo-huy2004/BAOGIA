import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import BiometricLoginCard from "./BiometricLoginCard";
import ToggleSwitch from "../common/ToggleSwitch";
import { webPushHelper } from "../../utils/webPushHelper";
import { webauthnHelper } from "../../utils/webauthnHelper";
import { playNotificationSound } from "../../utils/audio";
import { getPref, setPref, resolvePref } from "../../utils/autoPrefs";
import AutoControl from "./AutoControl";
import { hapticSelect } from "../../utils/haptics";
import { useWeather } from "../../hooks/useWeather";
import { describeCondition } from "../../utils/weather";

import PersonalInfoSubTab from "./PersonalInfoSubTab";

const LANGUAGES = [
  { code: "vi", label: "Tiếng Việt" },
  { code: "en", label: "English" },
];

// Collapsible section ("option xổ xuống"): a header button toggles a smoothly
// animated body (grid-rows 1fr/0fr trick). First section opens by default.
// Small uppercase section label (iOS Settings style).
function SectionLabel({ children }) {
  return <p className="mb-1.5 px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{children}</p>;
}

// iOS-style settings row that expands to reveal its editor. Icon in a tinted
// rounded square, label, optional value, chevron.
function SettingsGroup({ label, icon = "tune", iconTint = "bg-primary/10 text-primary", value, children, defaultOpen = false }) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <button
        type="button"
        onClick={() => { hapticSelect(); setOpen((o) => !o); }}
        className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-foreground/[0.03]"
      >
        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-[10px] ${iconTint}`}>
          <span className="material-symbols-outlined text-[17px]">{icon}</span>
        </span>
        <span className="flex-1 text-[13px] font-semibold text-foreground">{label}</span>
        {value != null && <span className="text-[11.5px] font-medium text-muted-foreground">{value}</span>}
        <span className={`material-symbols-outlined text-[19px] text-muted-foreground/60 transition-transform duration-300 ${open ? "rotate-90" : ""}`}>chevron_right</span>
      </button>
      <div className={`grid transition-all duration-300 ease-out ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="overflow-hidden">
          <div className="border-t border-border">{children}</div>
        </div>
      </div>
    </div>
  );
}

function SettingsRow({ icon, iconColor = "text-primary", iconBg = "bg-primary/10", title, desc, control, warn }) {
  return (
    <div className="flex items-start gap-3.5 p-4.5">
      <span className={`w-8 h-8 rounded-full ${iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
        <span className={`material-symbols-outlined text-base ${iconColor}`}>{icon}</span>
      </span>
      <div className="min-w-0 flex-1 space-y-0.5 text-left">
        <p className="text-xs font-black text-foreground">{title}</p>
        {desc && <p className="text-[10.5px] font-medium text-muted-foreground leading-relaxed">{desc}</p>}
        {warn && <p className="text-[10px] text-warning font-semibold pt-0.5">{warn}</p>}
      </div>
      {control && <div className="shrink-0 self-center">{control}</div>}
    </div>
  );
}

// Neon accent palette — full static class strings so Tailwind's JIT keeps them.
// Each accent has light + dark variants for text, badge, top bar, glowing card
// shadow, border tint, gradient wash and the blurred glow blob.
const ACCENTS = {
  blue: {
    icon: "text-primary/40",
    badge: "bg-primary/12 ring-primary/40 dark:bg-primary/15 dark:ring-primary/30",
    bar: "from-primary to-info",
    border: "border-primary/20 dark:border-primary/25",
    wash: "from-primary/70 to-transparent dark:from-primary/30 dark:to-transparent",
    glow: "shadow-[0_14px_34px_-16px_rgba(59,130,246,0.5)] group-hover:shadow-[0_16px_40px_-14px_rgba(59,130,246,0.62)] dark:shadow-[0_0_26px_-6px_rgba(96,165,250,0.5)] dark:group-hover:shadow-[0_0_34px_-4px_rgba(96,165,250,0.7)]",
    blob: "bg-primary/25",
  },
  violet: {
    icon: "text-violet-500 dark:text-violet-300",
    badge: "bg-violet-500/12 ring-violet-400/40 dark:bg-violet-400/15 dark:ring-violet-300/30",
    bar: "from-violet-500 to-fuchsia-400",
    border: "border-violet-500/20 dark:border-violet-400/25",
    wash: "from-violet-50/70 to-transparent dark:from-violet-950/30 dark:to-transparent",
    glow: "shadow-[0_14px_34px_-16px_rgba(139,92,246,0.5)] group-hover:shadow-[0_16px_40px_-14px_rgba(139,92,246,0.62)] dark:shadow-[0_0_26px_-6px_rgba(167,139,250,0.5)] dark:group-hover:shadow-[0_0_34px_-4px_rgba(167,139,250,0.7)]",
    blob: "bg-violet-400/25 dark:bg-violet-400/25",
  },
  amber: {
    icon: "text-warning/40",
    badge: "bg-warning/12 ring-warning/40 dark:bg-warning/15 dark:ring-warning/30",
    bar: "from-warning to-orange-400",
    border: "border-warning/20 dark:border-warning/25",
    wash: "from-warning/70 to-transparent dark:from-warning/30 dark:to-transparent",
    glow: "shadow-[0_14px_34px_-16px_rgba(245,158,11,0.5)] group-hover:shadow-[0_16px_40px_-14px_rgba(245,158,11,0.62)] dark:shadow-[0_0_26px_-6px_rgba(251,191,36,0.5)] dark:group-hover:shadow-[0_0_34px_-4px_rgba(251,191,36,0.7)]",
    blob: "bg-warning/25",
  },
  rose: {
    icon: "text-rose-500 dark:text-rose-300",
    badge: "bg-rose-500/12 ring-rose-400/40 dark:bg-rose-400/15 dark:ring-rose-300/30",
    bar: "from-rose-500 to-pink-400",
    border: "border-rose-500/20 dark:border-rose-400/25",
    wash: "from-rose-50/70 to-transparent dark:from-rose-950/30 dark:to-transparent",
    glow: "shadow-[0_14px_34px_-16px_rgba(244,63,94,0.5)] group-hover:shadow-[0_16px_40px_-14px_rgba(244,63,94,0.62)] dark:shadow-[0_0_26px_-6px_rgba(251,113,133,0.5)] dark:group-hover:shadow-[0_0_34px_-4px_rgba(251,113,133,0.7)]",
    blob: "bg-rose-400/25 dark:bg-rose-400/25",
  },
  emerald: {
    icon: "text-success/40",
    badge: "bg-success/12 ring-success/40 dark:bg-success/15 dark:ring-success/30",
    bar: "from-success to-teal-400",
    border: "border-success/20 dark:border-success/25",
    wash: "from-success/70 to-transparent dark:from-success/30 dark:to-transparent",
    glow: "shadow-[0_14px_34px_-16px_rgba(16,185,129,0.5)] group-hover:shadow-[0_16px_40px_-14px_rgba(16,185,129,0.62)] dark:shadow-[0_0_26px_-6px_rgba(52,211,153,0.5)] dark:group-hover:shadow-[0_0_34px_-4px_rgba(52,211,153,0.7)]",
    blob: "bg-success/25",
  },
};

// Colourful, neon-glowing preference card. Full light/dark support via the
// accent palette above; a blurred colour blob + coloured shadow give the glow.
function PrefCard({ icon, title, desc, control, warn, index = 0, accent = "blue" }) {
  const a = ACCENTS[accent] || ACCENTS.blue;
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border ${a.border} bg-card p-3 text-left transition-all duration-300 ${a.glow}`}
      style={{ animation: `settingsRise .5s cubic-bezier(.22,1,.36,1) ${index * 55}ms both` }}
    >
      {/* accent wash + top bar + glow blob */}
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${a.wash}`} />
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${a.bar}`} />
      <div className={`pointer-events-none absolute -right-6 -top-8 h-20 w-20 rounded-full blur-2xl ${a.blob}`} />
      <div className="relative">
        <div className="flex items-start gap-2.5">
          <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ring-1 ring-inset transition-transform group-hover:scale-105 ${a.badge}`}>
            <span className={`material-symbols-outlined text-[16px] ${a.icon}`} style={{ fontVariationSettings: "'FILL' 1, 'wght' 500" }}>{icon}</span>
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11.5px] font-black text-foreground">{title}</p>
            <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">{desc}</p>
            {warn && <p className="mt-0.5 text-[9.5px] font-semibold text-warning">{warn}</p>}
          </div>
        </div>
        {control && <div className="mt-2.5">{control}</div>}
      </div>
    </div>
  );
}

// Vivid gradient hero — a full neon frame in both themes.
function SettingsHero({ autoCount, total }) {
  return (
    <div className="relative overflow-hidden rounded-[22px] p-[2.5px] shadow-[0_20px_50px_-24px_rgba(99,102,241,0.55)] dark:shadow-[0_0_40px_-8px_rgba(129,140,248,0.6)]"
      style={{ background: "linear-gradient(135deg,#6366f1,#a855f7,#22d3ee)" }}>
      <div className="relative overflow-hidden rounded-[19.5px] bg-white p-4 ring-1 ring-inset ring-black/5 backdrop-blur-xl dark:bg-zinc-950 dark:ring-white/10">
        <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-primary/25 blur-3xl dark:bg-primary/30" style={{ animation: "settingsPulse 6s ease-in-out infinite" }} />
        <div className="pointer-events-none absolute -bottom-12 left-8 h-32 w-32 rounded-full bg-info/20 blur-3xl dark:bg-info/25" />
        <div className="relative flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-white shadow-lg shadow-primary/40"
            style={{ background: "linear-gradient(135deg,#6366f1,#a855f7)" }}>
            <span className="material-symbols-outlined text-[21px]" style={{ animation: "settingsSpin 9s linear infinite" }}>auto_awesome</span>
          </span>
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/40">Trung tâm điều khiển</p>
            <h3 className="font-display text-base font-black text-foreground">Chế độ Tự động</h3>
            <p className="mt-0.5 text-[10.5px] leading-snug text-muted-foreground">
              <b className="text-foreground">{autoCount}/{total}</b> mục đang để Hugo tự quyết theo ngữ cảnh. Bạn chỉ chỉnh khi cần.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const SETTINGS_CSS = `
@keyframes settingsRise { from { opacity:0; transform: translateY(10px); } to { opacity:1; transform:none; } }
@keyframes settingsPulse { 0%,100% { opacity:.5; transform: scale(1); } 50% { opacity:.9; transform: scale(1.15); } }
@keyframes settingsSpin { to { transform: rotate(360deg); } }
`;

export default function MemberSettingsTab({
  memberSession,
  showToast,
  handleLogout,
  bio,
  joyBalance = 0,
  formData,
  setFormData,
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
  isGuestMode,
  newLinkLabel,
  setNewLinkLabel,
  newLinkUrl,
  setNewLinkUrl,
  handleLinkInputKeyDown,
  addSocialLink,
  removeSocialLink,
  bioTextareaRef
}) {
  const { t, i18n } = useTranslation();
  const [expandedSection, setExpandedSection] = useState(null);
  const navigate = useNavigate();
  const [settingsTab, setSettingsTab] = useState("personal");
  const [pushSupported, setPushSupported] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [hasNotifPerm, setHasNotifPerm] = useState(() =>
    typeof Notification !== "undefined" && Notification.permission === "granted"
  );
  // Tri-state prefs ('auto' | 'on' | 'off') — the automation-first model.
  const [prefs, setPrefs] = useState(() => ({
    sound: getPref("sound"),
    weatherBg: getPref("weatherBg"),
    weatherAlert: getPref("weatherAlert"),
    donation: getPref("donation"),
  }));
  const { weather: liveWeather } = useWeather({ enabled: true });
  const email = memberSession?.email;

  useEffect(() => {
    setPushSupported(webPushHelper.isSupported());
    webPushHelper.isSubscribed().then(setPushEnabled);
    setBiometricSupported(webauthnHelper.isSupported());
  }, []);

  // Context for resolving "auto" into an effective on/off shown as a hint.
  const prefCtx = {
    isDay: liveWeather ? liveWeather.isDay : undefined,
    condition: liveWeather?.condition,
    hasNotifPermission: hasNotifPerm,
    hasLocation: undefined,
  };
  const effective = (key) => resolvePref(key, prefCtx);

  const changePref = async (key, value) => {
    hapticSelect(); // tactile feedback — multi-sensory response to every touch
    setPref(key, value);
    setPrefs((p) => ({ ...p, [key]: value }));
    // Side effects when the user actively turns something ON.
    if (value === "on") {
      if (key === "sound") { try { playNotificationSound(); } catch { /* ignore */ } }
      if (key === "weatherAlert") {
        try {
          const perm = await Notification?.requestPermission?.();
          setHasNotifPerm(perm === "granted");
        } catch { /* ignore */ }
        try { navigator.geolocation?.getCurrentPosition(() => {}, () => {}, { timeout: 8000 }); } catch { /* ignore */ }
      }
    }
  };

  const handleTogglePush = async () => {
    setPushBusy(true);
    try {
      if (pushEnabled) {
        await webPushHelper.unsubscribe();
        setPushEnabled(false);
        showToast?.(t("memberPortal.settings.pushDisabledToast"), "success");
      } else {
        const perm = await webPushHelper.requestPermission();
        setHasNotifPerm(perm === "granted");
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

  const currentLang = i18n.language?.startsWith("en") ? "en" : "vi";
  const settingsTabLabels = {
    personal: currentLang === "vi" ? "Thông tin cá nhân" : "Personal info",
    system: currentLang === "vi" ? "Tùy chọn hệ thống" : "System settings",
  };
  const selectLanguage = (code) => {
    if (code === currentLang) return;
    i18n.changeLanguage(code);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4 animate-fadeIn pb-2">
      <style>{SETTINGS_CSS}</style>
      {/* Profile header — avatar (no camera icon) + name + email, JOY chip */}
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
        <button
          type="button"
          onClick={() => !saving && avatarInputRef.current?.click()}
          title={t("memberPortal.settings.page.changeAvatar")}
          className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-muted shadow-sm"
        >
          {formData.avatarUrl ? (
            <img src={formData.avatarUrl} alt="avatar" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-foreground/10 text-xl font-black text-foreground">
              {(formData.displayName || "?")[0]?.toUpperCase()}
            </div>
          )}
          {saving && (
            <span className="absolute inset-0 grid place-items-center bg-black/55">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            </span>
          )}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <h2 className="truncate text-[15px] font-black leading-tight text-foreground">{formData.displayName || t("memberPortal.bio.noName")}</h2>
            {bio?.isEduVerified && <span className="material-symbols-outlined text-[14px] text-[#0095f6]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>}
          </div>
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{memberSession?.email || formData.headline || "—"}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1 rounded-full bg-warning/10 px-2.5 py-1">
          <span className="material-symbols-outlined text-[14px] text-warning" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
          <span className="text-[12px] font-black text-foreground">{(joyBalance ?? 0).toLocaleString()}</span>
        </div>
      </div>

      {/* THÔNG TIN CÁ NHÂN — shown directly, not buried in a collapsible */}
      <div className="space-y-2">
        <SectionLabel>{currentLang === "vi" ? "Thông tin cá nhân" : "Personal info"}</SectionLabel>
        <div className="rounded-2xl border border-border bg-card p-4 text-left shadow-sm sm:p-5">
          <PersonalInfoSubTab
            formData={formData}
            handleFieldChange={handleFieldChange}
            saving={saving}
            isDragOver={isDragOver}
            setIsDragOver={setIsDragOver}
            processFile={processFile}
            avatarInputRef={avatarInputRef}
            handleAvatarChange={handleAvatarChange}
            handleRemoveAvatar={handleRemoveAvatar}
            memberSession={memberSession}
            bio={bio}
            hideAvatarSection={true}
            t={t}
          />
        </div>

        {/* Bio-page styling (theme/links/projects) now lives in the free Bio utility */}
        <button
          type="button"
          onClick={() => { hapticSelect(); navigate("/member/utilities/bio"); }}
          className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-3.5 py-3 text-left shadow-sm transition-colors hover:bg-foreground/[0.03]"
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-violet-500/10 text-violet-500">
            <span className="material-symbols-outlined text-[18px]">palette</span>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13.5px] font-semibold text-foreground">{currentLang === "vi" ? "Tùy chỉnh trang Bio" : "Customize your Bio page"}</span>
            <span className="block text-[11px] text-muted-foreground">{currentLang === "vi" ? "Giao diện · liên kết · thành tích — trong Tiện ích › Trang Bio" : "Theme · links · projects — in Utilities › Bio"}</span>
          </span>
          <span className="material-symbols-outlined text-[20px] text-muted-foreground/60">chevron_right</span>
        </button>
      </div>

      {/* HIỂN THỊ TRANG BIO */}
      <div className="space-y-2">
        <SectionLabel>{t("memberPortal.settings.page.showBio")}</SectionLabel>
        <a
          href={publicLink || "#"}
          target="_blank"
          rel="noreferrer"
          onClick={() => hapticSelect()}
          className={`flex items-center gap-3 rounded-2xl border border-border bg-card px-3.5 py-3 shadow-sm transition-colors hover:bg-foreground/[0.03] ${publicLink ? "" : "pointer-events-none opacity-50"}`}
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-info/10 text-info">
            <span className="material-symbols-outlined text-[18px]">public</span>
          </span>
          <span className="flex-1 text-[13.5px] font-semibold text-foreground">{t("memberPortal.settings.page.openBioPublic")}</span>
          <span className="material-symbols-outlined text-[20px] text-muted-foreground/60">chevron_right</span>
        </a>
      </div>

      {/* CÀI ĐẶT HỆ THỐNG */}
      <div className="space-y-2">
        <SectionLabel>{t("memberPortal.settings.page.systemSettings")}</SectionLabel>
        <SettingsGroup icon="tune" iconTint="bg-slate-500/10 text-slate-600 dark:text-slate-300" label={t("memberPortal.settings.page.prefsNotifs")}>
          <div className="space-y-3 p-3">
          <SettingsHero autoCount={Object.values(prefs).filter((v) => v === "auto").length} total={Object.keys(prefs).length} />

          {/* Live weather strip — drives the "auto" decisions above */}
          {liveWeather && (
            <div className="flex items-center gap-2.5 rounded-2xl border border-foreground/10 bg-foreground/[0.02] px-3 py-2" style={{ animation: "settingsRise .5s cubic-bezier(.22,1,.36,1) both" }}>
              <span className="material-symbols-outlined text-[20px] text-foreground">{describeCondition(liveWeather.condition, liveWeather.isDay).icon}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-black text-foreground">{describeCondition(liveWeather.condition, liveWeather.isDay).label}</p>
                <p className="text-[9.5px] text-muted-foreground">Cảm giác {liveWeather.feelsC}° · Gió {liveWeather.windKph} km/h · Ẩm {liveWeather.humidity}%</p>
              </div>
              <span className="font-display text-base font-black text-foreground">{liveWeather.tempC}°</span>
            </div>
          )}

          {/* Preferences — automation-first */}
          <div className="space-y-2">
            <p className="px-1 text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground">{t("memberPortal.settings.page.smartPrefs")}</p>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {pushSupported && (
              <PrefCard index={0} icon="notifications" accent="blue"
                title={t("memberPortal.settings.pushTitle")}
                desc={t("memberPortal.settings.pushDesc")}
                control={
                  <div className="flex items-center justify-between rounded-xl bg-foreground/[0.05] px-3 py-1.5 ring-1 ring-inset ring-foreground/10">
                    <span className="text-[10px] font-bold text-muted-foreground">{pushEnabled ? t("memberPortal.settings.page.pushStatusOn") : t("memberPortal.settings.page.pushStatusPrompt")}</span>
                    <ToggleSwitch checked={pushEnabled} onChange={handleTogglePush} disabled={pushBusy} label={t("memberPortal.settings.pushTitle")} />
                  </div>
                }
              />
            )}
            <PrefCard index={1} icon="graphic_eq" accent="violet"
              title={t("memberPortal.settings.soundTitle")}
              desc={t("memberPortal.settings.page.soundDescShort")}
              control={<AutoControl value={prefs.sound} effective={effective("sound")} onChange={(v) => changePref("sound", v)} />}
            />
            <PrefCard index={2} icon="partly_cloudy_day" accent="amber"
              title={t("memberPortal.settings.page.weatherBgTitle")}
              desc={t("memberPortal.settings.page.weatherBgDesc")}
              control={<AutoControl value={prefs.weatherBg} effective={effective("weatherBg")} onChange={(v) => changePref("weatherBg", v)} />}
            />
            <PrefCard index={3} icon="crisis_alert" accent="rose"
              title={t("memberPortal.settings.page.weatherAlertTitle")}
              desc={t("memberPortal.settings.page.weatherAlertDesc")}
              control={<AutoControl value={prefs.weatherAlert} effective={effective("weatherAlert")} onChange={(v) => changePref("weatherAlert", v)} />}
            />
            <PrefCard index={4} icon="favorite" accent="emerald"
              title={t("memberPortal.settings.donationTitle")}
              desc={t("memberPortal.settings.page.donationDescShort")}
              control={<AutoControl value={prefs.donation} effective={effective("donation")} onChange={(v) => changePref("donation", v)} />}
            />
            </div>
          </div>

          {/* Quick login */}
          {biometricSupported && email && (
            <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-3">
              <p className="mb-2 px-1 text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground">{t("memberPortal.settings.page.quickLogin")}</p>
              <BiometricLoginCard memberSession={memberSession} showToast={showToast} bare />
            </div>
          )}
          </div>
        </SettingsGroup>
      </div>

      {/* NGÔN NGỮ */}
      <div className="space-y-2">
        <SectionLabel>{t("memberPortal.settings.page.language")}</SectionLabel>
        <SettingsGroup icon="translate" iconTint="bg-success/10 text-success" label={t("memberPortal.settings.page.language")} value={currentLang === "vi" ? "Tiếng Việt" : "English"}>
          <div className="p-3">
            <div className="grid grid-cols-2 gap-1.5 rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-1.5">
              {LANGUAGES.map((lng) => {
                const active = currentLang === lng.code;
                return (
                  <button key={lng.code} type="button"
                    onClick={() => { hapticSelect(); selectLanguage(lng.code); }}
                    className={`flex items-center justify-center gap-1 rounded-xl py-2 text-[12px] font-bold transition-all active:scale-95 ${
                      active ? "text-white shadow-sm" : "text-muted-foreground hover:bg-foreground/[0.05]"
                    }`}
                    style={active ? { background: "linear-gradient(135deg,#6366f1,#a855f7)" } : undefined}>
                    {active && <span className="material-symbols-outlined text-[14px]">check</span>}
                    {lng.label}
                  </button>
                );
              })}
            </div>
          </div>
        </SettingsGroup>
      </div>

      {/* Save */}
      <button
        type="button"
        disabled={saving}
        onClick={() => handleSave()}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground py-3.5 text-xs font-black uppercase tracking-widest text-background shadow-md transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
      >
        {saving ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
            <span>{t("memberPortal.settings.page.saving")}</span>
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-base">save</span>
            <span>{t("memberPortal.settings.page.save")}</span>
          </>
        )}
      </button>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="w-full rounded-lg border border-rose-500/20 bg-rose-500/5 py-2.5 text-xs font-black uppercase tracking-wider text-rose-600 shadow-sm transition-all hover:bg-rose-500/10 dark:text-rose-400 flex items-center justify-center gap-1.5 active:scale-98"
      >
        <span className="material-symbols-outlined text-sm">logout</span>
        {t("memberPortal.settings.logout")}
      </button>
    </div>
  );
}
