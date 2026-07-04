import React, { useEffect, useState } from "react";
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
import DesignSubTab from "./DesignSubTab";
import LinksSubTab from "./LinksSubTab";
import AchievementsSubTab from "./AchievementsSubTab";

const LANGUAGES = [
  { code: "vi", label: "Tiếng Việt" },
  { code: "en", label: "English" },
];

// Collapsible section ("option xổ xuống"): a header button toggles a smoothly
// animated body (grid-rows 1fr/0fr trick). First section opens by default.
function SettingsGroup({ label, children, defaultOpen = false }) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-3xl border border-foreground/10 bg-white/70 shadow-[0_12px_30px_-20px_rgba(99,102,241,0.35)] backdrop-blur-md transition-all duration-300 dark:bg-zinc-900/40 dark:shadow-[0_0_26px_-14px_rgba(129,140,248,0.4)]">
      <button
        type="button"
        onClick={() => { hapticSelect(); setOpen((o) => !o); }}
        className="flex w-full items-center gap-2.5 px-4 py-3.5 text-left transition-colors hover:bg-foreground/[0.03]"
      >
        <span className="h-2 w-2 shrink-0 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" />
        <span className="flex-1 text-[11px] font-black uppercase tracking-[0.16em] text-foreground">{label}</span>
        <span className={`material-symbols-outlined text-[20px] text-muted-foreground transition-transform duration-300 ${open ? "rotate-180" : ""}`}>expand_more</span>
      </button>
      <div className={`grid transition-all duration-300 ease-out ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="overflow-hidden">
          <div className="border-t border-foreground/[0.06]">{children}</div>
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
        <p className="text-xs font-black text-zinc-800 dark:text-zinc-150">{title}</p>
        {desc && <p className="text-[10.5px] font-medium text-zinc-500 dark:text-zinc-400 leading-relaxed">{desc}</p>}
        {warn && <p className="text-[10px] text-amber-600 dark:text-amber-500 font-semibold pt-0.5">{warn}</p>}
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
    icon: "text-blue-500 dark:text-blue-300",
    badge: "bg-blue-500/12 ring-blue-400/40 dark:bg-blue-400/15 dark:ring-blue-300/30",
    bar: "from-blue-500 to-cyan-400",
    border: "border-blue-500/20 dark:border-blue-400/25",
    wash: "from-blue-50/70 to-transparent dark:from-blue-950/30 dark:to-transparent",
    glow: "shadow-[0_14px_34px_-16px_rgba(59,130,246,0.5)] group-hover:shadow-[0_16px_40px_-14px_rgba(59,130,246,0.62)] dark:shadow-[0_0_26px_-6px_rgba(96,165,250,0.5)] dark:group-hover:shadow-[0_0_34px_-4px_rgba(96,165,250,0.7)]",
    blob: "bg-blue-400/25 dark:bg-blue-400/25",
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
    icon: "text-amber-500 dark:text-amber-300",
    badge: "bg-amber-500/12 ring-amber-400/40 dark:bg-amber-400/15 dark:ring-amber-300/30",
    bar: "from-amber-500 to-orange-400",
    border: "border-amber-500/20 dark:border-amber-400/25",
    wash: "from-amber-50/70 to-transparent dark:from-amber-950/30 dark:to-transparent",
    glow: "shadow-[0_14px_34px_-16px_rgba(245,158,11,0.5)] group-hover:shadow-[0_16px_40px_-14px_rgba(245,158,11,0.62)] dark:shadow-[0_0_26px_-6px_rgba(251,191,36,0.5)] dark:group-hover:shadow-[0_0_34px_-4px_rgba(251,191,36,0.7)]",
    blob: "bg-amber-400/25 dark:bg-amber-400/25",
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
    icon: "text-emerald-500 dark:text-emerald-300",
    badge: "bg-emerald-500/12 ring-emerald-400/40 dark:bg-emerald-400/15 dark:ring-emerald-300/30",
    bar: "from-emerald-500 to-teal-400",
    border: "border-emerald-500/20 dark:border-emerald-400/25",
    wash: "from-emerald-50/70 to-transparent dark:from-emerald-950/30 dark:to-transparent",
    glow: "shadow-[0_14px_34px_-16px_rgba(16,185,129,0.5)] group-hover:shadow-[0_16px_40px_-14px_rgba(16,185,129,0.62)] dark:shadow-[0_0_26px_-6px_rgba(52,211,153,0.5)] dark:group-hover:shadow-[0_0_34px_-4px_rgba(52,211,153,0.7)]",
    blob: "bg-emerald-400/25 dark:bg-emerald-400/25",
  },
};

// Colourful, neon-glowing preference card. Full light/dark support via the
// accent palette above; a blurred colour blob + coloured shadow give the glow.
function PrefCard({ icon, title, desc, control, warn, index = 0, accent = "blue" }) {
  const a = ACCENTS[accent] || ACCENTS.blue;
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border ${a.border} bg-white dark:bg-zinc-900/50 p-3 text-left transition-all duration-300 ${a.glow}`}
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
            {warn && <p className="mt-0.5 text-[9.5px] font-semibold text-amber-600 dark:text-amber-400">{warn}</p>}
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
        <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-indigo-400/25 blur-3xl dark:bg-indigo-500/30" style={{ animation: "settingsPulse 6s ease-in-out infinite" }} />
        <div className="pointer-events-none absolute -bottom-12 left-8 h-32 w-32 rounded-full bg-cyan-400/20 blur-3xl dark:bg-cyan-500/25" />
        <div className="relative flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-white shadow-lg shadow-indigo-500/40"
            style={{ background: "linear-gradient(135deg,#6366f1,#a855f7)" }}>
            <span className="material-symbols-outlined text-[21px]" style={{ animation: "settingsSpin 9s linear infinite" }}>auto_awesome</span>
          </span>
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-500 dark:text-indigo-300">Trung tâm điều khiển</p>
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

  const activeThemeName = (formData?.theme?.template || "Classic").toUpperCase();

  return (
    <div className="space-y-5 animate-fadeIn md:space-y-6">
      {/* Hero — matches the Utilities page: spectrum accent bar + badge + big title */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm md:p-8">
        <span className="absolute left-0 right-0 top-0 h-1.5 bg-[linear-gradient(90deg,#ef4444,#f97316,#eab308,#22c55e,#06b6d4,#6366f1,#a855f7)]" />
        <div className="space-y-2 md:space-y-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-[linear-gradient(90deg,#6366f122,#a855f722)] px-3 py-1 text-[9px] font-black uppercase tracking-widest text-foreground">
            <span className="material-symbols-outlined text-[12px]">tune</span>
            Hồ sơ &amp; Cài đặt
          </span>
          <h2 className="text-base font-black tracking-tight text-foreground md:text-2xl">Trung tâm cá nhân hóa</h2>
          <p className="max-w-2xl text-[10.5px] leading-relaxed text-muted-foreground md:text-xs">
            Quản lý thẻ Member Pass, thông tin cá nhân và tùy chỉnh trải nghiệm Hugo Studio theo đúng phong cách của bạn.
            <span className="hidden md:inline"> Hugo tự động thông minh theo ngữ cảnh — bạn chỉ cần chỉnh khi thật sự muốn.</span>
          </p>
        </div>
      </div>

      <div className="relative mx-auto grid w-full max-w-md grid-cols-2 gap-1 rounded-xl bg-foreground/[0.05] p-0.5 ring-1 ring-inset ring-foreground/10">
        <span
          className="pointer-events-none absolute inset-y-0.5 w-[calc(50%-1px)] rounded-lg shadow-[0_2px_14px_-2px_rgba(99,102,241,0.55)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ transform: `translateX(calc(${settingsTab === "system" ? 1 : 0} * (100% + 2px)))`, background: "linear-gradient(135deg,#6366f1,#a855f7)" }}
        />
        {[{ id: "personal", label: settingsTabLabels.personal, icon: "badge" }, { id: "system", label: settingsTabLabels.system, icon: "tune" }].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => { hapticSelect(); setSettingsTab(tab.id); }}
            className={`relative z-10 flex items-center justify-center gap-1.5 rounded-lg py-2 font-display text-[12px] font-black tracking-wide transition-colors active:scale-[0.98] ${
              settingsTab === tab.id ? "text-white" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {settingsTab === "personal" && (
        <div className="lg:flex lg:items-start lg:gap-5">
      {/* ── Left column: Member Pass card (sticky on desktop/ipad) ── */}
      <div className="space-y-3 lg:w-[340px] lg:shrink-0 lg:sticky lg:top-4 lg:self-start">
      {/* Member Pass — full neon glowing card (fill glows, not just the border) */}
      <div className="relative overflow-hidden rounded-[24px] border border-indigo-400/30 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-4 shadow-[0_20px_50px_-24px_rgba(99,102,241,0.55)] dark:border-indigo-400/25 dark:from-indigo-950/70 dark:via-zinc-950 dark:to-violet-950/50 dark:shadow-[0_0_44px_-8px_rgba(129,140,248,0.55)]"
        style={{ animation: "settingsRise .5s cubic-bezier(.22,1,.36,1) both" }}>
        {/* neon light filling the whole card */}
        <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-indigo-400/25 blur-3xl dark:bg-indigo-500/30" style={{ animation: "settingsPulse 6s ease-in-out infinite" }} />
        <div className="pointer-events-none absolute -bottom-12 -left-8 h-36 w-36 rounded-full bg-violet-400/20 blur-3xl dark:bg-violet-500/25" />

        <div className="relative">
          {/* Header: avatar (no ring, tap to edit) + identity */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => !saving && avatarInputRef.current?.click()}
              title="Đổi ảnh đại diện"
              className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-muted shadow-lg"
            >
              {formData.avatarUrl ? (
                <img src={formData.avatarUrl} alt="avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-foreground/10 text-2xl font-black text-foreground">
                  {(formData.displayName || "?")[0]?.toUpperCase()}
                </div>
              )}
              {saving ? (
                <span className="absolute inset-0 grid place-items-center bg-black/55">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                </span>
              ) : (
                <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="material-symbols-outlined text-[18px] text-white">photo_camera</span>
                </span>
              )}
              {/* always-visible edit badge */}
              <span className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-indigo-500 text-white shadow-md ring-2 ring-white dark:ring-zinc-950">
                <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>photo_camera</span>
              </span>
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="text-[8.5px] font-black uppercase tracking-[0.2em] text-indigo-500 dark:text-indigo-300">Hugo Member Pass</p>
                {bio?.status && (
                  <span className="rounded-full border border-foreground/15 bg-foreground/[0.04] px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.12em] text-foreground/70">
                    {bio.isEduVerified ? "Đã xác minh" : "Đang hoạt động"}
                  </span>
                )}
              </div>
              <h2 className="mt-0.5 truncate font-display text-lg font-black leading-tight text-foreground">
                {formData.displayName || t("memberPortal.bio.noName")}
              </h2>
              <p className="truncate text-[11px] font-bold text-muted-foreground">
                {formData.headline || "Biệt danh chưa được thiết lập"}
              </p>
            </div>
          </div>

          {/* Avatar edit actions — monochrome */}
          <div className="mt-2.5 flex items-center gap-2">
            <button
              type="button"
              onClick={() => !saving && avatarInputRef.current?.click()}
              disabled={saving}
              className="inline-flex items-center gap-1 rounded-lg bg-foreground/[0.06] px-2.5 py-1 text-[10px] font-black text-foreground/80 transition hover:bg-foreground/10 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[13px]">photo_camera</span>
              Đổi ảnh đại diện
            </button>
            {formData.avatarUrl && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                disabled={saving}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold text-muted-foreground transition hover:text-foreground disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[13px]">delete</span>
                Gỡ
              </button>
            )}
          </div>

          {/* JOY highlight */}
          <div className="mt-3 flex items-center justify-between rounded-2xl border border-amber-500/20 bg-amber-500/[0.07] px-3 py-2">
            <span className="flex items-center gap-1.5 text-[10.5px] font-bold text-amber-600 dark:text-amber-300">
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>Số dư JOY
            </span>
            <span className="font-display text-base font-black text-foreground">{(joyBalance ?? 0).toLocaleString()}</span>
          </div>

          {/* Contact rows — monochrome icons */}
          <div className="mt-2.5 space-y-1">
            {[
              { icon: "call", val: formData.phone || memberSession?.phone || "Chưa có số điện thoại" },
              { icon: "location_on", val: formData.address || "Chưa có vị trí" },
              { icon: "link", val: publicLink || "Bio chưa sẵn sàng" },
            ].map((r, i) => (
              <div key={i} className="flex items-center gap-2 text-[11px]">
                <span className="material-symbols-outlined text-[16px] text-muted-foreground">{r.icon}</span>
                <span className="truncate font-semibold text-foreground/85">{r.val}</span>
              </div>
            ))}
          </div>

          {/* Stat pills */}
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            {[
              { label: "Liên kết", val: formData.links?.length || 0 },
              { label: "Thành tích", val: formData.projects?.length || 0 },
              { label: "Giao diện", val: activeThemeName },
            ].map((s, i) => (
              <div key={i} className="rounded-xl border border-foreground/10 bg-foreground/[0.03] px-2.5 py-1.5 text-center">
                <p className="text-[8px] font-black uppercase tracking-[0.12em] text-muted-foreground">{s.label}</p>
                <p className="mt-0.5 truncate text-[12px] font-black text-foreground">{s.val}</p>
              </div>
            ))}
          </div>

          {/* Open Bio — monochrome solid button */}
          <a
            href={publicLink || "#"}
            target="_blank"
            rel="noreferrer"
            onClick={() => hapticSelect()}
            className={`mt-3 flex items-center justify-center gap-1.5 rounded-2xl bg-indigo-500 px-4 py-2.5 text-[12px] font-black text-white shadow-lg shadow-indigo-500/30 transition-all hover:bg-indigo-600 active:scale-[0.98] ${publicLink ? "" : "pointer-events-none opacity-50"}`}
          >
            <span className="material-symbols-outlined text-[16px]">open_in_new</span>
            Mở link Bio của bạn
          </a>
        </div>
      </div>

      {/* Save — sticky with the card on desktop, moves to bottom on mobile via order */}
      <button
        type="button"
        disabled={saving}
        onClick={() => handleSave()}
        className="hidden w-full items-center justify-center gap-2 rounded-2xl bg-foreground py-3 text-[11px] font-black uppercase tracking-widest text-background shadow-md transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 lg:flex"
      >
        {saving ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
            <span>Đang lưu...</span>
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-base">save</span>
            <span>Lưu thay đổi</span>
          </>
        )}
      </button>
      </div>

      {/* ── Right column: editable form sections ── */}
      <div className="mt-4 space-y-4 lg:mt-0 lg:flex-1 lg:min-w-0">
      <SettingsGroup label="1. Thông tin cơ bản" defaultOpen>
        <div className="p-4 text-left sm:p-5">
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
      </SettingsGroup>

      <SettingsGroup label="2. Giao diện & Theme">
        <div className="p-4 text-left sm:p-5">
          <DesignSubTab
            formData={formData}
            setFormData={setFormData}
            bio={bio}
            onBioUpdate={setFormData}
            showToast={showToast}
            t={t}
          />
        </div>
      </SettingsGroup>

      <SettingsGroup label="3. Danh thiếp liên kết">
        <div className="p-4 text-left sm:p-5">
          <LinksSubTab
            formData={formData}
            newLinkLabel={newLinkLabel}
            setNewLinkLabel={setNewLinkLabel}
            newLinkUrl={newLinkUrl}
            setNewLinkUrl={setNewLinkUrl}
            handleLinkInputKeyDown={handleLinkInputKeyDown}
            addSocialLink={addSocialLink}
            removeSocialLink={removeSocialLink}
            handleFieldChange={handleFieldChange}
            bioTextareaRef={bioTextareaRef}
            t={t}
          />
        </div>
      </SettingsGroup>

      <SettingsGroup label="4. Dự án & Tác phẩm">
        <div className="p-4 text-left sm:p-5">
          <AchievementsSubTab
            formData={formData}
            setFormData={setFormData}
            handleSave={handleSave}
            showToast={showToast}
            isGuestMode={isGuestMode}
            bio={bio}
          />
        </div>
      </SettingsGroup>

      {/* Save (mobile/tablet — hidden on desktop where the sticky one shows) */}
      <div className="pt-2 lg:hidden">
        <button
          type="button"
          disabled={saving}
          onClick={() => handleSave()}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground py-3.5 text-xs font-black uppercase tracking-widest text-background shadow-md transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
        >
          {saving ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
              <span>Đang lưu toàn bộ cấu hình...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-base">save</span>
              <span>Lưu thay đổi trang cá nhân</span>
            </>
          )}
        </button>
      </div>
      </div>
        </div>
      )}

      {settingsTab === "system" && (
        <div className="space-y-3.5 py-0.5">
          <style>{SETTINGS_CSS}</style>

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
            <p className="px-1 text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground">Tuỳ chọn thông minh</p>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {pushSupported && (
              <PrefCard index={0} icon="notifications" accent="blue"
                title={t("memberPortal.settings.pushTitle")}
                desc={t("memberPortal.settings.pushDesc")}
                control={
                  <div className="flex items-center justify-between rounded-xl bg-foreground/[0.05] px-3 py-1.5 ring-1 ring-inset ring-foreground/10">
                    <span className="text-[10px] font-bold text-muted-foreground">{pushEnabled ? "Đang bật thông báo đẩy" : "Nhận thông báo quan trọng"}</span>
                    <ToggleSwitch checked={pushEnabled} onChange={handleTogglePush} disabled={pushBusy} label={t("memberPortal.settings.pushTitle")} />
                  </div>
                }
              />
            )}
            <PrefCard index={1} icon="graphic_eq" accent="violet"
              title={t("memberPortal.settings.soundTitle")}
              desc="Tự động im lặng giờ khuya (22:00–07:00), tự bật lại ban ngày."
              control={<AutoControl value={prefs.sound} effective={effective("sound")} onChange={(v) => changePref("sound", v)} />}
            />
            <PrefCard index={2} icon="partly_cloudy_day" accent="amber"
              title="Nền động theo thời tiết"
              desc="Sống động ban ngày & khi mưa bão, tự tắt đêm quang để tiết kiệm pin."
              control={<AutoControl value={prefs.weatherBg} effective={effective("weatherBg")} onChange={(v) => changePref("weatherBg", v)} />}
            />
            <PrefCard index={3} icon="crisis_alert" accent="rose"
              title="Cảnh báo thời tiết bất thường"
              desc="Nhắc bạn chuẩn bị khi trời trở xấu — tự bật khi đã có quyền Vị trí & Thông báo."
              control={<AutoControl value={prefs.weatherAlert} effective={effective("weatherAlert")} onChange={(v) => changePref("weatherAlert", v)} />}
            />
            <PrefCard index={4} icon="favorite" accent="emerald"
              title={t("memberPortal.settings.donationTitle")}
              desc="Ẩn gọn để không làm phiền; bật khi bạn muốn ủng hộ Hugo."
              control={<AutoControl value={prefs.donation} effective={effective("donation")} onChange={(v) => changePref("donation", v)} />}
            />
            </div>
          </div>

          <div className="grid gap-3.5 lg:grid-cols-2">
          {/* Language segmented */}
          <div className="space-y-2">
            <p className="px-1 text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground">Ngôn ngữ</p>
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

          {/* Quick login */}
          {biometricSupported && email && (
            <div className="space-y-2">
              <p className="px-1 text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground">Đăng nhập nhanh</p>
              <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-3">
                <BiometricLoginCard memberSession={memberSession} showToast={showToast} bare />
              </div>
            </div>
          )}
          </div>
        </div>
      )}

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
