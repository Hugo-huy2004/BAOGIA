import React, { useEffect, useState } from "react";
import { webauthnHelper } from "../../utils/webauthnHelper";

// Lets a member register this device's fingerprint/Face ID so future logins
// don't require re-accepting the Google prompt every time.
export default function BiometricLoginCard({ memberSession, showToast }) {
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
        : /mac/i.test(navigator.userAgent) ? 'Mac' : 'Máy tính';
      await webauthnHelper.registerDevice(email, deviceName);
      webauthnHelper.markDeviceFlag(email);
      const updated = await webauthnHelper.listDevices(email);
      setDevices(updated);
      showToast?.("Đã bật đăng nhập bằng vân tay/Face ID cho thiết bị này!", "success");
    } catch (err) {
      if (err?.name !== 'NotAllowedError') showToast?.("Không thể bật đăng nhập vân tay. Hãy thử lại.", "error");
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (id) => {
    const ok = await webauthnHelper.removeDevice(id, email);
    if (ok) setDevices(prev => prev.filter(d => d._id !== id));
  };

  return (
    <div className="bg-white dark:bg-card rounded-lg border border-zinc-200/50 dark:border-zinc-800/60 shadow-sm p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-primary text-lg">fingerprint</span>
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-200">
          Đăng nhập bằng vân tay / Face ID
        </h3>
      </div>
      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
        Bật để lần sau mở Hugo Studio trên thiết bị này, bạn chỉ cần quét vân tay hoặc Face ID thay vì đăng nhập lại bằng Google.
      </p>

      {devices.length > 0 && (
        <div className="space-y-1.5">
          {devices.map(d => (
            <div key={d._id} className="flex items-center justify-between text-[11px] px-2.5 py-1.5 rounded-md bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800">
              <span className="text-zinc-600 dark:text-zinc-300 font-medium">{d.deviceName}</span>
              <button onClick={() => handleRemove(d._id)} className="text-rose-500 hover:text-rose-600 font-bold">Xoá</button>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={handleRegister}
        disabled={busy}
        className="w-full py-2 rounded-md bg-primary/10 text-primary hover:bg-primary/15 text-xs font-bold transition-all disabled:opacity-50"
      >
        {busy ? "Đang xử lý..." : "+ Bật cho thiết bị này"}
      </button>
    </div>
  );
}
