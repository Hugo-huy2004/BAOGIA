import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import BiometricLoginCard from "./BiometricLoginCard";
import ToggleSwitch from "../common/ToggleSwitch";
import { webPushHelper } from "../../utils/webPushHelper";
import { webauthnHelper } from "../../utils/webauthnHelper";
import { hapticSelect } from "../../utils/haptics";
import PersonalInfoSubTab from "./PersonalInfoSubTab";
import {
  ChevronRight,
  User,
  CreditCard,
  Bell,
  Lock,
  Globe,
  Sparkles,
  QrCode,
  Gift,
  PlusCircle,
  LogOut,
  Sliders,
  Check,
  X,
  Share2,
  ShieldCheck,
  Smartphone,
  Copy
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
  bioTextareaRef,
  onOpenParticleModal,
  onSelectTab,
  onSelectUtility
}) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [activeSheet, setActiveSheet] = useState(null); // null | "personal" | "notifications" | "security" | "language"

  const [pushSupported, setPushSupported] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const email = memberSession?.email;

  useEffect(() => {
    setPushSupported(webPushHelper.isSupported());
    webPushHelper.isSubscribed().then(setPushEnabled);
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

  const currentLang = i18n.language?.startsWith("en") ? "en" : "vi";
  const selectLanguage = (code) => {
    if (code === currentLang) return;
    i18n.changeLanguage(code);
  };

  const displayName = formData?.displayName || bio?.displayName || memberSession?.displayName || "LE GIA HUY";

  return (
    <div className="max-w-md mx-auto space-y-4 animate-fadeIn text-left select-none pb-28 font-sans">
      {/* ── 1. APPLE ACCOUNT TOP BAR ────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-1 py-1">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-xs">store</span>
          </div>
          <span className="text-base font-black tracking-tight text-foreground">
            Hugo <span className="text-primary">Account</span>
          </span>
        </div>

        <button
          onClick={() => {
            hapticSelect();
            if (onSelectTab) onSelectTab("utilities");
            else navigate("/member/utilities");
          }}
          className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground flex items-center justify-center active:scale-95 transition-all"
          title="Đóng cài đặt"
        >
          <X className="w-4 h-4 text-foreground" />
        </button>
      </div>

      {/* ── 2. HERO PROFILE APPLE ACCOUNT CARD ─────────────────────────────── */}
      <div
        onClick={() => { hapticSelect(); setActiveSheet("personal"); }}
        className="bg-card border border-border/40 rounded-[24px] p-4 shadow-xs flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-all active:scale-[0.99]"
      >
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          {/* Large Avatar */}
          <div className="relative w-14 h-14 rounded-full bg-muted overflow-hidden shrink-0 ring-2 ring-border shadow-xs">
            {formData.avatarUrl ? (
              <img src={formData.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-indigo-600 text-white text-xl font-black">
                {displayName[0]?.toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-base font-black text-foreground truncate leading-snug">
              {displayName}
            </h2>
            <p className="text-[11px] font-medium text-muted-foreground truncate mt-0.5">
              Account info, payments, and settings
            </p>
          </div>
        </div>

        <ChevronRight className="w-5 h-5 text-muted-foreground/60 shrink-0 ml-2" />
      </div>

      {/* ── 3. SUB PROFILE CARD: HUGO BIO PROFILE ──────────────────────────── */}
      <div className="space-y-1.5">
        <div
          onClick={() => {
            hapticSelect();
            if (onSelectUtility) onSelectUtility("bio");
            else if (onSelectTab) onSelectTab("utilities");
            else navigate("/member/utilities/bio");
          }}
          className="bg-card border border-border/40 rounded-[20px] p-3.5 shadow-xs flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-all active:scale-[0.99]"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-500 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xs font-black text-foreground">Hugo Bio Profile</h3>
              <p className="text-[10.5px] text-muted-foreground truncate">
                Tùy chỉnh giao diện, danh thiếp &amp; liên kết xã hội
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground/60 shrink-0" />
        </div>

        <p className="text-[10px] text-muted-foreground/80 px-2 leading-relaxed">
          Tên và hình ảnh hồ sơ của bạn sẽ được hiển thị công khai trên cổng kết nối Greenwich.
        </p>
      </div>

      {/* ── 4. GROUP 1: APPLE ACCOUNT SETTINGS INSET GROUP ──────────────────── */}
      <div className="bg-card border border-border/40 rounded-[24px] overflow-hidden shadow-xs divide-y divide-border/30">
        {/* Subscriptions */}
        <div
          onClick={() => {
            hapticSelect();
            if (onSelectTab) onSelectTab("joy", "store");
            else navigate("/member/joy?tab=store");
          }}
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-foreground">Subscription</h4>
              <span className="text-[10.5px] text-muted-foreground block">Gói dịch vụ &amp; Đăng ký VIP</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
        </div>

        {/* Purchase History */}
        <div
          onClick={() => {
            hapticSelect();
            if (onSelectTab) onSelectTab("joy", "card");
            else navigate("/member/joy?tab=card");
          }}
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-foreground">Purchase History</h4>
              <span className="text-[10.5px] text-muted-foreground block">Lịch sử giao dịch &amp; Ví JOY ({(joyBalance ?? 0).toLocaleString()} JOY)</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
        </div>

        {/* Notifications */}
        <div
          onClick={() => { hapticSelect(); setActiveSheet("notifications"); }}
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-foreground">Notifications</h4>
              <span className="text-[10.5px] text-muted-foreground block">Cấu hình thông báo Web Push</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
        </div>

        {/* Privacy & Access */}
        <div
          onClick={() => { hapticSelect(); setActiveSheet("security"); }}
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-foreground">Privacy &amp; Access</h4>
              <span className="text-[10.5px] text-muted-foreground block">Quyền riêng tư &amp; Đăng nhập sinh trắc</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
        </div>
      </div>

      {/* ── 5. QUICK ACTION PILL BUTTONS (APPLE ACCOUNT 3-COLUMN PILL GRID) ───── */}
      <div className="grid grid-cols-3 gap-2.5 text-center">
        <button
          onClick={() => {
            hapticSelect();
            if (onSelectTab) onSelectTab("joy");
            else navigate("/member/joy");
          }}
          className="flex flex-col items-center justify-center gap-1 p-3 rounded-2xl bg-card border border-border/40 shadow-xs hover:bg-muted/40 active:scale-95 transition-all cursor-pointer"
        >
          <PlusCircle className="w-5 h-5 text-primary" />
          <span className="text-[10.5px] font-black text-primary">Nạp JOY</span>
        </button>

        <button
          onClick={() => {
            hapticSelect();
            if (onSelectTab) onSelectTab("joy");
            else navigate("/member/joy");
          }}
          className="flex flex-col items-center justify-center gap-1 p-3 rounded-2xl bg-card border border-border/40 shadow-xs hover:bg-muted/40 active:scale-95 transition-all cursor-pointer"
        >
          <Gift className="w-5 h-5 text-primary" />
          <span className="text-[10.5px] font-black text-primary">Đổi Code</span>
        </button>

        <button
          onClick={() => {
            hapticSelect();
            if (onOpenParticleModal) onOpenParticleModal();
            else if (onSelectTab) onSelectTab("joy");
            else navigate("/member/joy");
          }}
          className="flex flex-col items-center justify-center gap-1 p-3 rounded-2xl bg-card border border-border/40 shadow-xs hover:bg-muted/40 active:scale-95 transition-all cursor-pointer"
        >
          <QrCode className="w-5 h-5 text-primary" />
          <span className="text-[10.5px] font-black text-primary">Tặng JOY</span>
        </button>
      </div>

      {/* ── 6. GROUP 2: SYSTEM & LANGUAGE INSET GROUP ────────────────────────── */}
      <div className="bg-card border border-border/40 rounded-[24px] overflow-hidden shadow-xs divide-y divide-border/30">
        {/* Language Selection */}
        <div
          onClick={() => { hapticSelect(); setActiveSheet("language"); }}
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-foreground">Language</h4>
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
            className="flex items-center justify-between p-4 hover:bg-muted/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
                <Share2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-foreground">Public Bio Page</h4>
                <span className="text-[10.5px] text-muted-foreground block">Mở trang Bio công khai</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
          </a>
        )}
      </div>

      {/* ── 7. SIGN OUT BUTTON (DESTRUCTIVE RED ROW) ─────────────────────────── */}
      <button
        onClick={handleLogout}
        className="w-full py-3.5 rounded-[20px] bg-card border border-rose-500/20 text-rose-600 dark:text-rose-400 font-black text-xs uppercase tracking-wider shadow-xs hover:bg-rose-500/10 active:scale-98 transition-all flex items-center justify-center gap-2"
      >
        <LogOut className="w-4 h-4" />
        <span>Đăng Xuất Tài Khoản</span>
      </button>

      {/* ── 8. MODAL SHEET: PERSONAL INFO ─────────────────────────────────────── */}
      {activeSheet === "personal" && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center z-[500] p-0 sm:p-4 animate-fadeIn">
          <div className="bg-card border-t sm:border border-border/60 rounded-t-[32px] sm:rounded-[32px] p-6 max-w-lg w-full space-y-4 shadow-2xl animate-slideUp text-left max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border/30 pb-3">
              <h3 className="text-base font-black text-foreground">Thông Tin Cá Nhân</h3>
              <button onClick={() => setActiveSheet(null)} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

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
              hideAvatarSection={false}
              t={t}
            />

            <button
              disabled={saving}
              onClick={async () => {
                await handleSave();
                setActiveSheet(null);
              }}
              className="w-full py-3 bg-primary text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-md hover:opacity-95 transition-all"
            >
              {saving ? "Đang lưu..." : "Lưu Thông Tin"}
            </button>
          </div>
        </div>
      )}

      {/* ── 9. MODAL SHEET: NOTIFICATIONS ────────────────────────────────────── */}
      {activeSheet === "notifications" && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center z-[500] p-0 sm:p-4 animate-fadeIn">
          <div className="bg-card border-t sm:border border-border/60 rounded-t-[32px] sm:rounded-[32px] p-6 max-w-sm w-full space-y-4 shadow-2xl animate-slideUp text-left">
            <div className="flex items-center justify-between border-b border-border/30 pb-3">
              <h3 className="text-base font-black text-foreground">Cấu Hình Thông Báo</h3>
              <button onClick={() => setActiveSheet(null)} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/40 border border-border/30">
              <div>
                <h4 className="text-xs font-black text-foreground">Thông Báo Web Push</h4>
                <p className="text-[10.5px] text-muted-foreground">Nhận thông báo sự kiện, tin nhắn &amp; điểm thưởng</p>
              </div>
              <ToggleSwitch checked={pushEnabled} onChange={handleTogglePush} disabled={pushBusy} label="Push Notif" />
            </div>

            <button
              onClick={() => setActiveSheet(null)}
              className="w-full py-2.5 bg-muted text-foreground font-black text-xs uppercase tracking-wider rounded-xl"
            >
              Xong
            </button>
          </div>
        </div>
      )}

      {/* ── 10. MODAL SHEET: PRIVACY & ACCESS ──────────────────────────────────── */}
      {activeSheet === "security" && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center z-[500] p-0 sm:p-4 animate-fadeIn">
          <div className="bg-card border-t sm:border border-border/60 rounded-t-[32px] sm:rounded-[32px] p-6 max-w-sm w-full space-y-4 shadow-2xl animate-slideUp text-left">
            <div className="flex items-center justify-between border-b border-border/30 pb-3">
              <h3 className="text-base font-black text-foreground">Quyền Riêng Tư &amp; Sinh Trắc</h3>
              <button onClick={() => setActiveSheet(null)} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {biometricSupported && email ? (
              <div className="p-2">
                <BiometricLoginCard memberSession={memberSession} showToast={showToast} bare />
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Thiết bị không hỗ trợ FaceID / WebAuthn.</p>
            )}

            <button
              onClick={() => setActiveSheet(null)}
              className="w-full py-2.5 bg-muted text-foreground font-black text-xs uppercase tracking-wider rounded-xl"
            >
              Xong
            </button>
          </div>
        </div>
      )}

      {/* ── 11. MODAL SHEET: LANGUAGE SELECTION ──────────────────────────────── */}
      {activeSheet === "language" && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center z-[500] p-0 sm:p-4 animate-fadeIn">
          <div className="bg-card border-t sm:border border-border/60 rounded-t-[32px] sm:rounded-[32px] p-6 max-w-sm w-full space-y-4 shadow-2xl animate-slideUp text-left">
            <div className="flex items-center justify-between border-b border-border/30 pb-3">
              <h3 className="text-base font-black text-foreground">Chọn Ngôn Ngữ</h3>
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
