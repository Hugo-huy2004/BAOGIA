import { useEffect, useState } from "react";
import { notify } from "../lib/notify";
import { API_BASE } from "../config/apiBase";
import { webPushHelper } from "../utils/webPushHelper";
import { detectInstallTarget } from "../config/platform";
import { useStandalone } from "../hooks/usePWA";
import { EDU_DEFAULT_PREFS, EDU_GOALS, EDU_REMINDER_HOURS, cleanEduPrefs } from "../../../../packages/shared/eduPrefs";
import { changeAppLanguage } from "../i18n/config";
import { EduInstall } from "./EduShell";
import { useEduText } from "./eduText";
import { EDU_LANGS } from "./eduCopy";
import { webauthnHelper } from "../utils/webauthnHelper";

/** Passkey (Face ID / vân tay) của tài khoản: xem, thêm máy này, gỡ máy cũ — Better Auth phía máy chủ. */
function Passkeys() {
  const { t } = useEduText();
  const [list, setList] = useState(null);
  const [busy, setBusy] = useState(false);
  const supported = webauthnHelper.isSupported();
  const load = () => webauthnHelper.listDevices().then(setList).catch(() => setList([]));
  useEffect(() => { if (supported) load(); }, [supported]);
  const add = async () => {
    setBusy(true);
    try {
      const { iOS, android } = detectInstallTarget();
      await webauthnHelper.registerDevice(null, iOS ? "iPhone / iPad" : android ? "Android" : navigator.platform || "Passkey");
      notify.success(t("settings.passkeyAdded"));
      load();
    } catch (error) {
      if (error.name !== "NotAllowedError") notify.error(t("settings.passkeyFailed"));
    } finally { setBusy(false); }
  };
  const remove = async (id) => {
    if (!(await notify.confirm({ title: t("settings.passkeyRemoveAsk") }))) return;
    if (await webauthnHelper.removeDevice(id)) setList((all) => all.filter((p) => p._id !== id));
    else notify.error(t("settings.passkeyFailed"));
  };
  return (
    <div className="edu-set">
      <h2>{t("settings.passkey")}</h2>
      <p className="edu-set-note">{supported ? t("settings.passkeyHint") : t("settings.passkeyUnsupported")}</p>
      {list?.map((p) => (
        <div key={p._id} className="edu-set-row">
          <div><b>{p.deviceName}</b><small>{new Date(p.createdAt).toLocaleDateString()}</small></div>
          <button type="button" className="edu-btn is-ghost" onClick={() => remove(p._id)}>{t("settings.passkeyRemove")}</button>
        </div>
      ))}
      {supported && <button type="button" className="edu-btn" disabled={busy} onClick={add}>{t("settings.passkeyAdd")}</button>}
    </div>
  );
}

function Switch({ checked, onChange, label, disabled }) {
  return <button type="button" role="switch" className="edu-switch" aria-checked={checked} aria-label={label} disabled={disabled} onClick={() => onChange(!checked)} />;
}

function Seg({ value, options, onChange, label }) {
  return (
    <div className="edu-seg" role="group" aria-label={label}>
      {options.map(([key, text]) => (
        <button key={key} type="button" aria-pressed={value === key} onClick={() => onChange(key)}>{text}</button>
      ))}
    </div>
  );
}

/** Thông báo trên MÁY NÀY: quyền của trình duyệt + đăng ký push (gắn site Edu ở máy chủ). */
function DevicePush({ email }) {
  const { t } = useEduText();
  const supported = webPushHelper.isSupported();
  const standalone = useStandalone();
  const iosWeb = detectInstallTarget().iOS && !standalone;
  const [permission, setPermission] = useState(() => (typeof Notification === "undefined" ? "denied" : Notification.permission));
  const [busy, setBusy] = useState(false);

  // Đã cho phép từ trước: đăng ký lại cho chắc (máy chủ có thể đã dọn đăng ký chết).
  useEffect(() => {
    if (supported && permission === "granted") webPushHelper.registerAndSubscribe(email).catch(() => {});
  }, [supported, permission, email]);

  const enable = async () => {
    setBusy(true);
    try {
      const result = await webPushHelper.requestPermission();
      setPermission(result);
      if (result !== "granted") {
        notify.warning(t("settings.pushDenied"));
        return;
      }
      await webPushHelper.registerAndSubscribe(email);
      notify.success(t("settings.pushDone"));
    } catch (error) {
      notify.error(error.message || t("settings.pushFailed"));
    } finally {
      setBusy(false);
    }
  };

  if (iosWeb) {
    return (
      <div className="edu-set-row">
        <div><b>{t("settings.pushIosTitle")}</b><small>{t("settings.pushIosHint")}</small></div>
        <EduInstall className="edu-btn edu-btn--ghost" />
      </div>
    );
  }
  return (
    <div className="edu-set-row">
      <div>
        <b>{t("settings.pushTitle")}</b>
        <small>{!supported ? t("settings.pushUnsupported") : permission === "granted" ? t("settings.pushOn") : permission === "denied" ? t("settings.pushBlocked") : t("settings.pushOff")}</small>
      </div>
      {supported && permission !== "granted" && permission !== "denied" && (
        <button type="button" className="edu-btn" onClick={enable} disabled={busy}>{t("settings.pushEnable")}</button>
      )}
    </div>
  );
}

/**
 * Cài đặt cá nhân Education Hugo. Lưu trên máy chủ ngay khi đổi, nên máy khác
 * cùng tài khoản nhận cài đặt mới ở lần mở/quay lại tab tiếp theo.
 */
/** `embedded`: nằm trong trang Hồ sơ (Hồ sơ + Cài đặt gộp một trang) — bỏ khung và tiêu đề trang. */
export default function EduSettings({ learner, onLearnerUpdate, embedded = false }) {
  const { t, lang } = useEduText();
  const prefs = cleanEduPrefs(learner?.edu?.prefs || EDU_DEFAULT_PREFS);

  const set = async (patch) => {
    const next = { ...prefs, ...patch };
    const today = learner?.edu?.today;
    onLearnerUpdate({ edu: { ...learner?.edu, prefs: next, ...(today && patch.dailyGoal ? { today: { ...today, goal: patch.dailyGoal } } : {}) } });
    try {
      const response = await fetch(`${API_BASE}/joy/edu-settings`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prefs: next }),
      });
      if (!response.ok) throw new Error();
    } catch {
      onLearnerUpdate({ edu: { ...learner?.edu, prefs } });
      notify.error(t("settings.saveFailed"));
    }
  };

  const Wrap = embedded ? "div" : "section";
  return (
    <Wrap className={embedded ? "edu-settings-embedded" : "edu-page"}>
      {embedded ? <h2 className="edu-page-title">{t("settings.title")}</h2> : <h1 className="edu-page-title">{t("settings.title")}</h1>}

      <div className="edu-set">
        <h2>{t("settings.study")}</h2>
        <div className="edu-set-row">
          <div><b>{t("settings.goal")}</b><small>{t("settings.goalHint")}</small></div>
          <Seg label={t("settings.goal")} value={prefs.dailyGoal} options={EDU_GOALS.map((goal) => [goal, String(goal)])} onChange={(dailyGoal) => set({ dailyGoal })} />
        </div>
        <div className="edu-set-row">
          <div><b>{t("settings.sound")}</b><small>{t("settings.soundHint")}</small></div>
          <Switch label={t("settings.sound")} checked={prefs.sound} onChange={(sound) => set({ sound })} />
        </div>
        <div className="edu-set-row">
          <div><b>{t("settings.textSize")}</b></div>
          <Seg label={t("settings.textSize")} value={prefs.textSize} options={[["md", t("settings.textMd")], ["lg", t("settings.textLg")]]} onChange={(textSize) => set({ textSize })} />
        </div>
        <div className="edu-set-row">
          <div><b>{t("settings.language")}</b><small>{t("settings.languageHint")}</small></div>
          <Seg label={t("settings.language")} value={lang} options={EDU_LANGS.map(({ code, label }) => [code, label])} onChange={(code) => changeAppLanguage(code)} />
        </div>
      </div>

      <div className="edu-set">
        <h2>{t("settings.notify")}</h2>
        <DevicePush email={learner?.email} />
        <div className="edu-set-row">
          <div><b>{t("settings.reminder")}</b><small>{t("settings.reminderHint")}</small></div>
          <Switch label={t("settings.reminder")} checked={prefs.reminder} onChange={(reminder) => set({ reminder })} />
        </div>
        <div className="edu-set-row">
          <div><b>{t("settings.hour")}</b><small>{t("settings.hourHint")}</small></div>
          <select aria-label={t("settings.hour")} value={prefs.reminderHour} disabled={!prefs.reminder} onChange={(event) => set({ reminderHour: Number(event.target.value) })}>
            {EDU_REMINDER_HOURS.map((hour) => <option key={hour} value={hour}>{`${hour}:00`}</option>)}
          </select>
        </div>
        <div className="edu-set-row">
          <div><b>{t("settings.expiry")}</b><small>{t("settings.expiryHint")}</small></div>
          <Switch label={t("settings.expiryLabel")} checked={prefs.notifyAccount} onChange={(notifyAccount) => set({ notifyAccount })} />
        </div>
        <div className="edu-set-row">
          <div><b>{t("settings.security")}</b><small>{t("settings.securityHint")}</small></div>
          <Switch label={t("settings.securityLabel")} checked={prefs.notifySecurity} onChange={(notifySecurity) => set({ notifySecurity })} />
          <Switch label={t("settings.emailLabel")} checked={prefs.notifyEmail} onChange={(notifyEmail) => set({ notifyEmail })} />
        </div>
      </div>

      <div className="edu-set">
        <h2>{t("settings.look")}</h2>
        <div className="edu-set-row">
          <div><b>{t("settings.theme")}</b></div>
          <Seg label={t("settings.theme")} value={prefs.theme} options={[["system", t("settings.themeSystem")], ["light", t("settings.themeLight")], ["dark", t("settings.themeDark")]]} onChange={(theme) => set({ theme })} />
        </div>
        <p className="edu-set-note">{t("settings.note")}</p>
      </div>
      <Passkeys />
    </Wrap>
  );
}
