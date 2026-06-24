import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { webauthnHelper } from "../../utils/webauthnHelper";

// Lets a member register this device's fingerprint/Face ID so future logins
// don't require re-accepting the Google prompt every time.
// `bare` drops the own card chrome (border/shadow/bg) so it can nest inside
// another card — e.g. MemberSettingsTab's grouped "Đăng nhập" section.
export default function BiometricLoginCard({ memberSession, showToast, bare = false }) {
  const { t } = useTranslation();
  const [supported, setSupported] = useState(false);
  const [devices, setDevices] = useState([]);
  const [busy, setBusy] = useState(false);
  const email = memberSession?.email;

  useEffect(() => {
    setSupported(webauthnHelper.isSupported());
  }, []);

  useEffect(() => {
    if (!email) return;
    webauthnHelper.listDevices(email).then(setDevices).catch(() => {});
  }, [email]);

  if (!supported || !email) return null;

  const handleRegister = async () => {
    setBusy(true);
    try {
      const deviceName = /iphone|ipad/i.test(navigator.userAgent) ? 'iPhone/iPad'
        : /android/i.test(navigator.userAgent) ? 'Android'
        : /mac/i.test(navigator.userAgent) ? 'Mac' : t("memberPortal.settings.biometric.deviceComputer");
      await webauthnHelper.registerDevice(email, deviceName);
      webauthnHelper.markDeviceFlag(email);
      const updated = await webauthnHelper.listDevices(email);
      setDevices(updated);
      showToast?.(t("memberPortal.settings.biometric.registerSuccess"), "success");
    } catch (err) {
      if (err?.name !== 'NotAllowedError') showToast?.(t("memberPortal.settings.biometric.registerError"), "error");
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (id) => {
    const ok = await webauthnHelper.removeDevice(id, email);
    if (ok) setDevices(prev => prev.filter(d => d._id !== id));
  };

  return (
    <div className={bare ? "p-4 space-y-3" : "bg-white dark:bg-card rounded-lg border border-zinc-200/50 dark:border-zinc-800/60 shadow-sm p-4 space-y-3"}>
      <div className="flex items-center gap-3">
        <span className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-base text-emerald-500">fingerprint</span>
        </span>
        <div>
          <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-100">
            {t("memberPortal.settings.biometric.title")}
          </h3>
          <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
            {t("memberPortal.settings.biometric.desc")}
          </p>
        </div>
      </div>

      {devices.length > 0 && (
        <div className="space-y-1.5">
          {devices.map(d => (
            <div key={d._id} className="flex items-center justify-between text-[11px] px-2.5 py-1.5 rounded-md bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800">
              <span className="text-zinc-600 dark:text-zinc-300 font-medium">{d.deviceName}</span>
              <button onClick={() => handleRemove(d._id)} className="text-rose-500 hover:text-rose-600 font-bold">{t("memberPortal.settings.biometric.removeBtn")}</button>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={handleRegister}
        disabled={busy}
        className="w-full py-2 rounded-md bg-primary/10 text-primary hover:bg-primary/15 text-xs font-bold transition-all disabled:opacity-50"
      >
        {busy ? t("memberPortal.settings.biometric.registering") : t("memberPortal.settings.biometric.registerBtn")}
      </button>
    </div>
  );
}
