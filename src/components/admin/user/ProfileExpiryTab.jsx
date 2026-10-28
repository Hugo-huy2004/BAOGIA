import { useEffect, useMemo, useRef, useState } from "react";
import { notify } from "../../../lib/notify";
import { maskPhone } from "../../../utils/phoneSecurity";
import { countryDisplayName, profileAnswerDisplayName, religionDisplayName, RELIGION_LABELS } from "../../../lib/profileDisplay";

/**
 * Tab "Hồ sơ & HSD" trong cửa sổ chi tiết thành viên (admin).
 *
 * Bản cũ có hai bố cục khác nhau cho xem và sửa: nhiều ô chỉ hiện khi bấm sửa
 * (quốc gia, toạ độ, ngày sinh), ô khác chỉ hiện khi xem (thẻ địa chỉ gộp), và
 * nút lưu gửi lại MỌI ô — kể cả ô admin không chạm (đơn vị JOY mặc định 'vi'
 * ghi đè 'JOY'). Ở đây mỗi thông tin là một dòng cố định trong một nhóm; xem
 * thì hiện giá trị, sửa thì dòng đó thành ô nhập tại chỗ, và chỉ gửi những ô đã
 * đổi.
 */

const LANGUAGE_NAMES = { vi: "Tiếng Việt", en: "English", zh: "中文" };
const DAY_MS = 24 * 60 * 60 * 1000;
const pad2 = (n) => String(n).padStart(2, "0");
const formatDate = (value) => (value && !Number.isNaN(new Date(value).getTime()) ? new Date(value).toLocaleDateString("vi-VN") : "");
const toDateInput = (value) => (value && !Number.isNaN(new Date(value).getTime()) ? new Date(value).toISOString().slice(0, 10) : "");

const birthDateOf = (bio) => (bio?.birthYear && bio?.birthMonth && bio?.birthDay
  ? `${bio.birthYear}-${pad2(bio.birthMonth)}-${pad2(bio.birthDay)}`
  : "");

function ageOf(birthDate) {
  if (!birthDate) return null;
  const [y, m, d] = birthDate.split("-").map(Number);
  const now = new Date();
  let age = now.getFullYear() - y;
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) age -= 1;
  return age;
}

/** Giá trị form lấy từ hồ sơ — cũng là mốc để biết ô nào đã đổi. */
const formFromBio = (bio) => ({
  displayName: bio?.displayName || "",
  headline: bio?.headline || "",
  birthDate: birthDateOf(bio),
  birthday: bio?.birthday || "",
  jobTitle: bio?.jobTitle || "",
  education: bio?.education || "",
  bio: bio?.bio || "",
  language: bio?.language || "",
  phone: bio?.phone || "",
  contactEmail: bio?.contactEmail || "",
  address: bio?.address || "",
  countryCode: bio?.countryCode || "",
  adminArea: bio?.adminArea || "",
  locality: bio?.locality || "",
  exactAddress: bio?.exactAddress || "",
  verifiedLatitude: bio?.verifiedLatitude || "",
  verifiedLongitude: bio?.verifiedLongitude || "",
  ethnicity: bio?.ethnicity || "",
  religion: bio?.religion || "",
});

/** Ô đã đổi → payload cho PUT update-profile (ngày sinh tách 3 số như server cần). */
function changedFields(initial, form) {
  const out = {};
  for (const key of Object.keys(form)) {
    if (form[key] === initial[key]) continue;
    if (key === "birthDate") {
      const [birthYear = 0, birthMonth = 0, birthDay = 0] = form.birthDate ? form.birthDate.split("-").map(Number) : [];
      Object.assign(out, { birthYear, birthMonth, birthDay });
    } else {
      out[key] = form[key];
    }
  }
  if ("verifiedLatitude" in out || "verifiedLongitude" in out) {
    out.locationVerifiedAt = form.verifiedLatitude && form.verifiedLongitude ? new Date().toISOString() : null;
  }
  return out;
}

/** Hạn dùng HIỆU LỰC — đúng luật cổng thành viên (authMiddleware.readMemberGate). */
function accessOf(bio) {
  const followsTrial = !bio?.isEduVerified && Boolean(bio?.trialExpiresAt);
  const until = followsTrial ? bio.trialExpiresAt : bio?.expiresAt;
  if (!until) return { until: null, followsTrial, daysLeft: null };
  const daysLeft = Math.ceil((new Date(until).getTime() - Date.now()) / DAY_MS);
  return { until, followsTrial, daysLeft };
}

/**
 * Ảnh chọn từ máy → JPEG tối đa 512px. Ảnh điện thoại gốc vài MB vượt trần 1MB
 * của API; 512px là đủ cho ảnh đại diện và Cloudinary còn nén tiếp.
 */
function shrinkImage(file, maxSide = 512) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.86));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Không đọc được ảnh này.")); };
    img.src = url;
  });
}

const inputClass = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-[13px] text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-white/15 dark:bg-black/40 dark:text-white";

function Row({ label, hint, wide, children }) {
  return (
    <div className={`min-w-0 py-2.5 ${wide ? "sm:col-span-2" : ""}`}>
      <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="mt-1 min-w-0 break-words text-[14px] font-semibold text-slate-900 select-text dark:text-white">{children}</dd>
      {hint && <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  );
}

const Empty = () => <span className="font-normal text-slate-400 dark:text-slate-500">Chưa có</span>;

function Section({ icon, title, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
      <h5 className="flex items-center gap-2 text-[12px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">
        <span className="material-symbols-outlined text-base text-blue-500" aria-hidden="true">{icon}</span>{title}
      </h5>
      <dl className="mt-1 grid grid-cols-1 gap-x-6 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

function StatusChip({ icon, label, value, tone }) {
  const tones = {
    ok: "text-emerald-600 dark:text-emerald-400",
    warn: "text-amber-600 dark:text-amber-400",
    bad: "text-rose-600 dark:text-rose-400",
    muted: "text-slate-500 dark:text-slate-400",
  };
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-1 flex items-center gap-1.5 text-[13px] font-black ${tones[tone]}`}>
        <span className="material-symbols-outlined text-base" aria-hidden="true">{icon}</span>
        <span className="min-w-0 truncate">{value}</span>
      </p>
    </div>
  );
}

export default function ProfileExpiryTab({ bio, saving, onSave, onExtend, onSetExpiry, onToggleWalletFreeze, onToggleEdu, onRevokeSession }) {
  const initial = useMemo(() => formFromBio(bio), [bio]);
  const [form, setForm] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const access = accessOf(bio);
  const [expiryDate, setExpiryDate] = useState(toDateInput(access.until));
  const avatarInput = useRef(null);
  const [avatarBusy, setAvatarBusy] = useState(false);

  const changeAvatar = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { notify.error("Hãy chọn một tệp ảnh."); return; }
    setAvatarBusy(true);
    try {
      await onSave({ avatarUrl: await shrinkImage(file) });
    } catch (error) {
      notify.error(error.message);
    } finally {
      setAvatarBusy(false);
    }
  };
  const removeAvatar = async () => {
    const ok = await notify.confirm({ title: "Xoá ảnh đại diện?", message: `Ảnh của ${bio.displayName || bio.email} sẽ bị xoá vĩnh viễn.`, confirmText: "Xoá ảnh", danger: true });
    if (!ok) return;
    setAvatarBusy(true);
    try { await onSave({ avatarUrl: "" }); } finally { setAvatarBusy(false); }
  };

  // Hồ sơ tải lại (sau khi lưu, gia hạn…) → form và ô ngày theo dữ liệu mới.
  useEffect(() => {
    setForm(initial);
    setExpiryDate(toDateInput(accessOf(bio).until));
  }, [initial, bio]);

  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  const changes = changedFields(initial, form);
  const changeCount = Object.keys(changes).filter((key) => !["birthMonth", "birthDay", "locationVerifiedAt"].includes(key)).length;

  const save = async (event) => {
    event.preventDefault();
    if (!changeCount) { setEditing(false); return; }
    const ok = await onSave(changes);
    if (ok) setEditing(false);
  };
  const cancel = () => { setForm(initial); setEditing(false); };

  const text = (key, props = {}) => (editing
    ? <input id={`admin-profile-${key}`} className={inputClass} value={form[key]} onChange={set(key)} {...props} />
    : form[key] || <Empty />);

  const ic = bio.identityCheck || {};
  const icFailed = (ic.failStreak || 0) > 0;
  const icOverdue = ic.nextDueAt && new Date(ic.nextDueAt) <= new Date();
  const age = ageOf(form.birthDate);
  const hasCoords = Number.isFinite(Number.parseFloat(form.verifiedLatitude)) && Number.isFinite(Number.parseFloat(form.verifiedLongitude));

  const expiryTone = access.daysLeft === null ? "ok" : access.daysLeft < 0 ? "bad" : access.daysLeft <= 7 ? "warn" : "ok";
  const expiryText = access.until
    ? access.daysLeft < 0 ? `Đã hết hạn ${-access.daysLeft} ngày` : `Còn ${access.daysLeft} ngày`
    : "Không giới hạn";

  return (
    <div className="space-y-5">
      {/* ── Thời hạn sử dụng: trạng thái, gia hạn nhanh, đặt ngày cụ thể ── */}
      <section className="rounded-3xl border border-blue-500/30 bg-blue-500/[0.07] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-widest text-blue-800 dark:text-blue-300">Thời hạn sử dụng</p>
            <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{access.until ? formatDate(access.until) : "Vĩnh viễn"}</p>
            <p className="mt-1 text-[12px] text-slate-600 dark:text-slate-400">
              {access.followsTrial
                ? "Tính theo hạn dùng thử (chưa xác minh EDU) — hết hạn là tài khoản bị khoá rồi tự xoá."
                : bio.isEduVerified ? "Tài khoản EDU — tính theo hạn tài khoản & trang Bio." : "Tính theo hạn tài khoản & trang Bio."}
            </p>
          </div>
          <span className={`rounded-full px-3 py-1 text-[12px] font-black ${
            expiryTone === "bad" ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
              : expiryTone === "warn" ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"}`}>
            {expiryText}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {[[7, "+7 ngày"], [30, "+1 tháng"], [90, "+3 tháng"], [365, "+1 năm"]].map(([days, label]) => (
            <button key={days} type="button" disabled={saving} onClick={() => onExtend(days)}
              className="rounded-full bg-blue-600 px-4 py-2 text-[12px] font-extrabold text-white hover:bg-blue-500 disabled:opacity-50">
              {label}
            </button>
          ))}
          <span className="mx-1 hidden h-6 w-px bg-blue-500/30 sm:block" aria-hidden="true" />
          <label htmlFor="admin-expiry-date" className="sr-only">Đặt ngày hết hạn</label>
          <input id="admin-expiry-date" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)}
            className={inputClass.replace("w-full", "w-40")} />
          <button type="button" disabled={saving || !expiryDate || expiryDate === toDateInput(access.until)}
            onClick={() => onSetExpiry(new Date(`${expiryDate}T23:59:59`).toISOString())}
            className="rounded-full border border-blue-600 px-4 py-2 text-[12px] font-extrabold text-blue-700 hover:bg-blue-600 hover:text-white disabled:opacity-40 dark:text-blue-300">
            Đặt ngày
          </button>
        </div>
        <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">Gia hạn cộng nối vào hạn hiện tại (hoặc từ hôm nay nếu đã hết hạn).</p>
      </section>

      {/* ── Trạng thái nhanh ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatusChip label="Ví JOY" icon={bio.isJoyWalletFrozen ? "ac_unit" : "check_circle"}
          value={bio.isJoyWalletFrozen ? "Đang đóng băng" : "Hoạt động"} tone={bio.isJoyWalletFrozen ? "bad" : "ok"} />
        <StatusChip label="Giáo dục (EDU)" icon="school"
          value={bio.isEduVerified ? "Đã xác minh" : "Chưa xác minh"} tone={bio.isEduVerified ? "ok" : "muted"} />
        <StatusChip label="Hồ sơ bắt buộc" icon={bio.onboardingCompleted ? "task_alt" : "pending"}
          value={bio.onboardingCompleted ? "Đã đủ" : "Còn thiếu"} tone={bio.onboardingCompleted ? "ok" : "warn"} />
        <StatusChip label="Kiểm tra định kỳ" icon={icFailed ? "gpp_bad" : icOverdue ? "pending" : "verified_user"}
          value={icFailed ? `Trượt ${ic.failStreak} đợt` : icOverdue ? "Chờ trả lời" : ic.lastVerifiedAt ? `Đạt ${formatDate(ic.lastVerifiedAt)}` : "Chưa tới đợt"}
          tone={icFailed ? "bad" : icOverdue ? "warn" : "ok"} />
      </div>

      {/* ── Hồ sơ: một bố cục cho cả xem và sửa ── */}
      <form onSubmit={save} className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h4 className="flex items-center gap-2 text-[15px] font-black text-slate-900 dark:text-white">
            <span className="material-symbols-outlined text-blue-500" aria-hidden="true">badge</span>Hồ sơ thành viên
          </h4>
          {editing ? (
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-slate-500 dark:text-slate-400">{changeCount ? `${changeCount} mục đã đổi` : "Chưa đổi gì"}</span>
              <button type="button" onClick={cancel} className="rounded-full border border-slate-300 px-4 py-2 text-[12px] font-bold text-slate-700 hover:bg-slate-100 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/10">Huỷ</button>
              <button type="submit" disabled={saving || !changeCount} className="rounded-full bg-blue-600 px-5 py-2 text-[12px] font-black text-white hover:bg-blue-500 disabled:opacity-50">Lưu</button>
            </div>
          ) : (
            <button type="button" onClick={() => setEditing(true)} className="flex items-center gap-1.5 rounded-full border border-blue-600 px-4 py-2 text-[12px] font-extrabold text-blue-700 hover:bg-blue-600 hover:text-white dark:text-blue-300">
              <span className="material-symbols-outlined text-base" aria-hidden="true">edit</span>Sửa hồ sơ
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
          {bio.avatarUrl
            ? <img src={bio.avatarUrl} alt="" className="h-16 w-16 rounded-2xl object-cover" />
            : <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-200 text-2xl font-black text-slate-500 dark:bg-white/10 dark:text-slate-300">{(bio.displayName || bio.email || "?")[0].toUpperCase()}</span>}
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Ảnh đại diện</p>
            <p className="mt-0.5 text-[12px] text-slate-500 dark:text-slate-400">
              {bio.antiDeepfakeLock ? "Thành viên đang bật khoá chống giả mạo ảnh — admin vẫn đổi được." : "Đổi hoặc xoá ảnh thay thành viên (vd. ảnh vi phạm)."}
            </p>
          </div>
          <input ref={avatarInput} id="admin-avatar-file" type="file" accept="image/*" className="sr-only" onChange={changeAvatar} />
          <div className="flex gap-2">
            <button type="button" disabled={avatarBusy || saving} onClick={() => avatarInput.current?.click()}
              className="flex items-center gap-1.5 rounded-full border border-blue-600 px-4 py-2 text-[12px] font-extrabold text-blue-700 hover:bg-blue-600 hover:text-white disabled:opacity-50 dark:text-blue-300">
              <span className="material-symbols-outlined text-base" aria-hidden="true">{avatarBusy ? "progress_activity" : "photo_camera"}</span>
              {avatarBusy ? "Đang lưu…" : "Đổi ảnh"}
            </button>
            {bio.avatarUrl && (
              <button type="button" disabled={avatarBusy || saving} onClick={removeAvatar}
                className="rounded-full border border-rose-500 px-4 py-2 text-[12px] font-extrabold text-rose-600 hover:bg-rose-500 hover:text-white disabled:opacity-50 dark:text-rose-400">
                Xoá ảnh
              </button>
            )}
          </div>
        </div>

        <Section icon="account_circle" title="Tài khoản">
          <Row label="Email đăng nhập (Google)" hint={editing ? "Gắn với tài khoản Google, không sửa được." : null}>{bio.email}</Row>
          <Row label="Ngôn ngữ chính">
            {editing ? (
              <select id="admin-profile-language" className={inputClass} value={form.language} onChange={set("language")}>
                <option value="">Chưa chọn</option>
                {Object.entries(LANGUAGE_NAMES).map(([code, name]) => <option key={code} value={code}>{name}</option>)}
              </select>
            ) : LANGUAGE_NAMES[form.language] || form.language || <Empty />}
          </Row>
          <Row label="Ngày tạo tài khoản">{formatDate(bio.createdAt) || <Empty />}</Row>
          <Row label="Trang Bio">{bio.slug ? `/bio/${bio.slug}` : <Empty />}</Row>
          <Row label="Mã giới thiệu">{bio.referralCode || <Empty />}</Row>
          <Row label="Người giới thiệu">{bio.referredBy || <Empty />}</Row>
        </Section>

        <Section icon="person" title="Cá nhân">
          <Row label="Tên hiển thị">{text("displayName")}</Row>
          <Row label="Biệt danh / tiêu đề">{text("headline")}</Row>
          <Row label="Ngày sinh" hint={editing ? "Thành viên chỉ khai được một lần. Để trống để bắt khai lại." : null}>
            {editing
              ? <input id="admin-profile-birthDate" type="date" className={inputClass} value={form.birthDate} max={new Date().toISOString().slice(0, 10)} onChange={set("birthDate")} />
              : form.birthDate ? `${formatDate(form.birthDate)} · ${age} tuổi` : <Empty />}
          </Row>
          <Row label="Đồng ý của phụ huynh">{bio.guardianConsentAt ? `Đã xác nhận ${formatDate(bio.guardianConsentAt)}` : age !== null && age < 16 ? <span className="text-amber-600 dark:text-amber-400">Chưa có (dưới 16 tuổi)</span> : "Không cần"}</Row>
          <Row label="Sinh nhật trên Bio (tự ghi)">{text("birthday")}</Row>
          <Row label="Nghề nghiệp">{text("jobTitle")}</Row>
          <Row label="Học vấn">{text("education")}</Row>
          <Row label="Giới thiệu bản thân" wide>
            {editing
              ? <textarea id="admin-profile-bio" rows={3} className={inputClass} value={form.bio} onChange={set("bio")} />
              : form.bio ? <span className="whitespace-pre-line font-normal">{form.bio}</span> : <Empty />}
          </Row>
        </Section>

        <Section icon="call" title="Liên hệ">
          <Row label="Số điện thoại / Zalo">
            {editing ? text("phone", { inputMode: "tel" }) : form.phone ? (
              <span className="flex flex-wrap items-center gap-2 font-mono">
                {showPhone ? form.phone : maskPhone(form.phone)}
                <button type="button" onClick={() => setShowPhone((v) => !v)} className="font-sans text-[11px] font-bold text-blue-600 hover:underline dark:text-blue-400">
                  {showPhone ? "Che" : "Hiện số"}
                </button>
              </span>
            ) : <Empty />}
          </Row>
          <Row label="Email liên hệ">{editing ? text("contactEmail", { type: "email" }) : form.contactEmail || <span className="font-normal text-slate-500">Dùng email đăng nhập</span>}</Row>
          <Row label="Địa điểm công khai trên Bio" wide>{text("address")}</Row>
        </Section>

        <Section icon="home_pin" title="Địa chỉ riêng tư">
          <Row label="Quốc gia">
            {editing
              ? <input id="admin-profile-countryCode" className={inputClass} value={form.countryCode} maxLength={2} placeholder="VN"
                  onChange={(e) => setForm((c) => ({ ...c, countryCode: e.target.value.toUpperCase() }))} />
              : form.countryCode ? `${countryDisplayName(form.countryCode, "vi")} (${form.countryCode})` : <Empty />}
          </Row>
          <Row label="Tỉnh / Thành phố / Bang">{text("adminArea")}</Row>
          <Row label="Phường / Xã / Khu vực">{text("locality")}</Row>
          <Row label="Số nhà, đường, toà nhà">{text("exactAddress")}</Row>
          <Row label="Toạ độ đã xác minh" wide hint={!editing && bio.locationVerifiedAt ? `Xác minh ngày ${formatDate(bio.locationVerifiedAt)}` : null}>
            {editing ? (
              <span className="grid grid-cols-2 gap-2">
                <input id="admin-profile-lat" className={inputClass} placeholder="Vĩ độ" value={form.verifiedLatitude} onChange={set("verifiedLatitude")} />
                <input id="admin-profile-lng" className={inputClass} placeholder="Kinh độ" value={form.verifiedLongitude} onChange={set("verifiedLongitude")} />
              </span>
            ) : hasCoords ? (
              <a className="text-blue-600 hover:underline dark:text-blue-400" target="_blank" rel="noreferrer"
                href={`https://www.openstreetmap.org/?mlat=${form.verifiedLatitude}&mlon=${form.verifiedLongitude}#map=18/${form.verifiedLatitude}/${form.verifiedLongitude}`}>
                {form.verifiedLatitude}, {form.verifiedLongitude} · xem bản đồ
              </a>
            ) : <Empty />}
          </Row>
        </Section>

        <Section icon="shield_person" title="Thông tin nhạy cảm (tuỳ chọn)">
          <Row label="Dân tộc">{editing ? text("ethnicity") : profileAnswerDisplayName(form.ethnicity, "vi") || <Empty />}</Row>
          <Row label="Tôn giáo">
            {editing ? (
              <select id="admin-profile-religion" className={inputClass} value={form.religion} onChange={set("religion")}>
                <option value="">Chưa khai</option>
                {form.religion && !RELIGION_LABELS.vi[form.religion] && <option value={form.religion}>{religionDisplayName(form.religion, "vi")}</option>}
                {Object.entries(RELIGION_LABELS.vi).filter(([code]) => code !== "self_describe").map(([code, label]) => <option key={code} value={code}>{label}</option>)}
              </select>
            ) : religionDisplayName(form.religion, "vi") || <Empty />}
          </Row>
        </Section>
      </form>

      {/* ── Thao tác quản trị ── */}
      <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
        <h4 className="text-[12px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">Thao tác quản trị</h4>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <button type="button" onClick={onToggleWalletFreeze}
            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-3 py-3 text-[12px] font-extrabold text-slate-900 hover:bg-slate-100 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">
            <span className="material-symbols-outlined text-lg" aria-hidden="true">{bio.isJoyWalletFrozen ? "lock_open" : "ac_unit"}</span>
            {bio.isJoyWalletFrozen ? "Mở đóng băng ví" : "Đóng băng ví JOY"}
          </button>
          <button type="button" onClick={onToggleEdu}
            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-3 py-3 text-[12px] font-extrabold text-slate-900 hover:bg-slate-100 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">
            <span className="material-symbols-outlined text-lg" aria-hidden="true">school</span>
            {bio.isEduVerified ? "Thu hồi xác minh EDU" : "Xác minh EDU"}
          </button>
          <button type="button" onClick={onRevokeSession}
            className="flex items-center justify-center gap-2 rounded-2xl bg-rose-600 px-3 py-3 text-[12px] font-extrabold text-white hover:bg-rose-500">
            <span className="material-symbols-outlined text-lg" aria-hidden="true">logout</span>
            Đăng xuất mọi thiết bị
          </button>
        </div>
      </section>
    </div>
  );
}
