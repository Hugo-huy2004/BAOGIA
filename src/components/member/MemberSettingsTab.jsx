import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import BiometricLoginCard from "./BiometricLoginCard";
import ToggleSwitch from "../common/ToggleSwitch";
import { webPushHelper } from "../../utils/webPushHelper";

const LANGUAGES = [
  { code: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

function SettingsSection({ icon, title, desc, children }) {
  return (
    <div className="bg-white dark:bg-card rounded-lg border border-zinc-200/50 dark:border-zinc-800/60 shadow-sm p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-primary text-lg">{icon}</span>
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-200">{title}</h3>
      </div>
      {desc && <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">{desc}</p>}
      {children}
    </div>
  );
}

// One settings hub for everything that used to be scattered (the biometric
// card lived inline in Personal Info, notifications had no UI at all) — a
// single "Cài đặt" tab so members have one place to find this instead of
// digging through Personal Info for account-level toggles.
export default function MemberSettingsTab({ memberSession, showToast, handleLogout }) {
  const { i18n } = useTranslation();
  const [pushSupported, setPushSupported] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const email = memberSession?.email;

  useEffect(() => {
    setPushSupported(webPushHelper.isSupported());
    webPushHelper.isSubscribed().then(setPushEnabled);
  }, []);

  const handleTogglePush = async () => {
    setPushBusy(true);
    try {
      if (pushEnabled) {
        await webPushHelper.unsubscribe();
        setPushEnabled(false);
        showToast?.("Đã tắt thông báo đẩy.", "success");
      } else {
        const perm = await webPushHelper.requestPermission();
        if (perm === "granted" && email) {
          await webPushHelper.registerAndSubscribe(email);
          setPushEnabled(true);
          showToast?.("Đã bật thông báo đẩy!", "success");
        } else if (perm === "denied") {
          showToast?.("Quyền thông báo bị từ chối. Bật lại trong cài đặt trình duyệt.", "warning");
        }
      }
    } catch (_) {
      showToast?.("Không thể thay đổi trạng thái thông báo lúc này.", "error");
    } finally {
      setPushBusy(false);
    }
  };

  const currentLang = i18n.language?.startsWith("en") ? "en" : "vi";
  const selectLanguage = (code) => {
    if (code === currentLang) return;
    i18n.changeLanguage(code); // persists to localStorage via i18next-browser-languagedetector — becomes the default on next visit
  };

  return (
    <div className="max-w-xl mx-auto space-y-4 animate-fadeIn">
      <div className="space-y-1 text-left px-1">
        <h2 className="text-sm font-black text-zinc-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-primary">settings</span>
          Cài đặt
        </h2>
        <p className="text-[10px] text-zinc-455 dark:text-zinc-400">Quản lý thông báo, đăng nhập nhanh và các tuỳ chọn khác cho tài khoản của bạn.</p>
      </div>

      <SettingsSection
        icon="notifications"
        title="Thông báo đẩy"
        desc="Bật để nhận thông báo về JOY, gói dịch vụ, xác minh và các cập nhật quan trọng khác — ngay cả khi không mở Hugo Studio."
      >
        {pushSupported ? (
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-200">
              {pushBusy ? "Đang xử lý..." : pushEnabled ? "Đã bật" : "Đang tắt"}
            </span>
            <ToggleSwitch checked={pushEnabled} onChange={handleTogglePush} disabled={pushBusy} label="Thông báo đẩy" />
          </div>
        ) : (
          <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">Thiết bị/trình duyệt này không hỗ trợ thông báo đẩy.</p>
        )}
      </SettingsSection>

      <BiometricLoginCard memberSession={memberSession} showToast={showToast} />

      <SettingsSection icon="language" title="Ngôn ngữ mặc định" desc="Chọn ngôn ngữ hiển thị mặc định cho Hugo Studio — được nhớ cho lần truy cập sau.">
        <div className="grid grid-cols-2 gap-2">
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
              <span className="text-base leading-none">{lng.flag}</span>
              {lng.label}
              {currentLang === lng.code && (
                <span className="material-symbols-outlined text-sm absolute right-2.5">check_circle</span>
              )}
            </button>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection icon="more_horiz" title="Sắp ra mắt" desc="Thêm các tuỳ chọn cài đặt khác (giao diện, quyền riêng tư...) sẽ xuất hiện ở đây." />

      <button
        onClick={handleLogout}
        className="w-full py-2.5 rounded-md border border-destructive/20 bg-destructive/5 text-destructive hover:bg-destructive/10 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
      >
        <span className="material-symbols-outlined text-sm">logout</span>
        Đăng xuất
      </button>
    </div>
  );
}
