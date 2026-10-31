import { useEffect, useState } from "react";
import { notify } from "../lib/notify";
import { API_BASE } from "../config/apiBase";
import { webPushHelper } from "../utils/webPushHelper";
import { detectInstallTarget } from "../config/platform";
import { useStandalone } from "../hooks/usePWA";
import { EDU_DEFAULT_PREFS, EDU_GOALS, EDU_REMINDER_HOURS, cleanEduPrefs } from "../../../../packages/shared/eduPrefs";
import { EduInstall } from "./EduShell";

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
        notify.warning("Trình duyệt chưa cho phép thông báo. Mở cài đặt trang web để bật lại.");
        return;
      }
      await webPushHelper.registerAndSubscribe(email);
      notify.success("Đã bật thông báo trên máy này.");
    } catch (error) {
      notify.error(error.message || "Chưa bật được thông báo.");
    } finally {
      setBusy(false);
    }
  };

  if (iosWeb) {
    return (
      <div className="edu-set-row">
        <div><b>Thông báo trên iPhone/iPad</b><small>iOS chỉ gửi thông báo cho ứng dụng đã cài vào màn hình chính.</small></div>
        <EduInstall className="edu-btn edu-btn--ghost" />
      </div>
    );
  }
  return (
    <div className="edu-set-row">
      <div>
        <b>Thông báo trên máy này</b>
        <small>{!supported ? "Trình duyệt này không hỗ trợ thông báo đẩy." : permission === "granted" ? "Đang bật." : permission === "denied" ? "Đã bị chặn — bật lại trong cài đặt trang web của trình duyệt." : "Chưa bật."}</small>
      </div>
      {supported && permission !== "granted" && permission !== "denied" && (
        <button type="button" className="edu-btn" onClick={enable} disabled={busy}>Bật</button>
      )}
    </div>
  );
}

/**
 * Cài đặt cá nhân Education Hugo. Lưu trên máy chủ ngay khi đổi, nên máy khác
 * cùng tài khoản nhận cài đặt mới ở lần mở/quay lại tab tiếp theo.
 */
export default function EduSettings({ learner, onLearnerUpdate }) {
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
      notify.error("Chưa lưu được cài đặt, thử lại sau.");
    }
  };

  return (
    <section className="edu-page">
      <h1 className="edu-page-title">Cài đặt</h1>

      <div className="edu-set">
        <h2>Học tập</h2>
        <div className="edu-set-row">
          <div><b>Mục tiêu mỗi ngày</b><small>Số step qua lần đầu trong một ngày.</small></div>
          <Seg label="Mục tiêu mỗi ngày" value={prefs.dailyGoal} options={EDU_GOALS.map((goal) => [goal, String(goal)])} onChange={(dailyGoal) => set({ dailyGoal })} />
        </div>
        <div className="edu-set-row">
          <div><b>Âm thanh trong bài</b><small>Tiếng chọn đáp án, qua bài.</small></div>
          <Switch label="Âm thanh trong bài" checked={prefs.sound} onChange={(sound) => set({ sound })} />
        </div>
        <div className="edu-set-row">
          <div><b>Cỡ chữ bài học</b></div>
          <Seg label="Cỡ chữ bài học" value={prefs.textSize} options={[["md", "Vừa"], ["lg", "Lớn"]]} onChange={(textSize) => set({ textSize })} />
        </div>
      </div>

      <div className="edu-set">
        <h2>Thông báo</h2>
        <DevicePush email={learner?.email} />
        <div className="edu-set-row">
          <div><b>Nhắc học mỗi ngày</b><small>Chỉ nhắc khi hôm nay chưa đạt mục tiêu.</small></div>
          <Switch label="Nhắc học mỗi ngày" checked={prefs.reminder} onChange={(reminder) => set({ reminder })} />
        </div>
        <div className="edu-set-row">
          <div><b>Giờ nhắc</b><small>Giờ Việt Nam.</small></div>
          <select aria-label="Giờ nhắc" value={prefs.reminderHour} disabled={!prefs.reminder} onChange={(event) => set({ reminderHour: Number(event.target.value) })}>
            {EDU_REMINDER_HOURS.map((hour) => <option key={hour} value={hour}>{`${hour}:00`}</option>)}
          </select>
        </div>
        <div className="edu-set-row">
          <div><b>Hạn tài khoản</b><small>Báo trước 3 ngày và 1 ngày.</small></div>
          <Switch label="Báo hạn tài khoản" checked={prefs.notifyAccount} onChange={(notifyAccount) => set({ notifyAccount })} />
        </div>
        <div className="edu-set-row">
          <div><b>Bảo mật</b><small>Báo khi tài khoản đăng nhập trên máy mới.</small></div>
          <Switch label="Báo đăng nhập mới" checked={prefs.notifySecurity} onChange={(notifySecurity) => set({ notifySecurity })} />
        </div>
      </div>

      <div className="edu-set">
        <h2>Giao diện</h2>
        <div className="edu-set-row">
          <div><b>Chế độ màu</b></div>
          <Seg label="Chế độ màu" value={prefs.theme} options={[["system", "Theo máy"], ["light", "Sáng"], ["dark", "Tối"]]} onChange={(theme) => set({ theme })} />
        </div>
        <p className="edu-set-note">Cài đặt lưu theo tài khoản — đổi ở máy này, máy khác tự theo.</p>
      </div>
    </section>
  );
}
