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
      const ua = navigator.userAgent;
      const isIOS = /iphone|ipad|ipod/i.test(ua);
      const isAndroid = /android/i.test(ua);
      const isMac = /macintosh|mac os x/i.test(ua);
      const isWindows = /windows/i.test(ua);
      
      let os = isIOS ? 'iPhone/iPad' : isAndroid ? 'Android' : isMac ? 'Mac' : isWindows ? 'Windows' : t("memberPortal.settings.biometric.deviceComputer");
      
      let browser = '';
      if (/edg/i.test(ua)) browser = 'Edge';
      else if (/crios|chrome/i.test(ua)) browser = 'Chrome';
      else if (/fxios|firefox/i.test(ua)) browser = 'Firefox';
      else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) browser = 'Safari';
      
      const baseDevice = browser ? `${os} (${browser})` : os;
      
      let city = "";
      try {
        const { resolveCoords } = await import("../../utils/weather");
        const coords = await resolveCoords({ preferGeo: false, timeoutMs: 3000 });
        if (coords && coords.city) city = coords.city;
      } catch {}

      const deviceName = city ? `${baseDevice} - ${city}` : baseDevice;

      await webauthnHelper.registerDevice(email, deviceName, baseDevice);
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
    <div className={bare ? "p-4 space-y-3" : "bg-white dark:bg-card rounded-lg border border-border/50 shadow-sm p-4 space-y-3"}>
      <div className="flex items-center gap-3">
        <span className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-base text-success">fingerprint</span>
        </span>
        <div>
          <h3 className="text-xs font-bold text-foreground">
            {t("memberPortal.settings.biometric.title")}
          </h3>
          <p className="text-[10.5px] text-muted-foreground leading-relaxed">
            {t("memberPortal.settings.biometric.desc")}
          </p>
        </div>
      </div>

      {devices.length > 0 && (
        <div className="space-y-1.5">
          {devices.map(d => {
            const addedDate = d.createdAt ? new Date(d.createdAt).toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit', year: 'numeric' }) : "";
            return (
              <div key={d._id} className="flex items-center justify-between text-[11px] px-2.5 py-1.5 rounded-md bg-muted/50 border border-border/60">
                <div className="flex flex-col">
                  <span className="text-foreground/80 font-bold">{d.deviceName}</span>
                  {addedDate && <span className="text-[9px] text-zinc-400 font-medium">Thêm: {addedDate}</span>}
                </div>
                <button onClick={() => handleRemove(d._id)} className="text-rose-500 hover:text-rose-600 font-bold px-2 py-1">{t("memberPortal.settings.biometric.removeBtn")}</button>
              </div>
            );
          })}
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
