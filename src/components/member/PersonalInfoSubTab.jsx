import { memberTier, TierBadge } from "../../lib/memberTier";
import { optimizeCloudinaryUrl } from "../../utils/imageOptimizer";
import OptimizedInput from "../common/OptimizedInput";

const FIELD_CLASS =
  "apple-account-input w-full min-w-0 bg-transparent text-[15px] text-foreground placeholder:text-muted-foreground/55 focus:outline-none";

function EditableRow({ icon, label, name, value, onChange, placeholder, type = "text", required = false }) {
  return (
    <label className="apple-account-row">
      <span className="apple-account-row-icon material-symbols-outlined" aria-hidden="true">{icon}</span>
      <span className="apple-account-row-label">{label}</span>
      <OptimizedInput
        className={FIELD_CLASS}
        type={type}
        name={name}
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
      />
    </label>
  );
}

function VerifiedRow({ icon, label, value, lockLabel }) {
  return (
    <div className="apple-account-row apple-account-row--verified">
      <span className="apple-account-row-icon material-symbols-outlined" aria-hidden="true">{icon}</span>
      <span className="apple-account-row-label">{label}</span>
      <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-foreground">
        {value || "—"}
      </span>
      <span className="apple-account-lock" title={lockLabel}>
        <span className="material-symbols-outlined" aria-hidden="true">lock</span>
        <span className="sr-only">{lockLabel}</span>
      </span>
    </div>
  );
}

// Tháng/năm sinh quyết định quyền dùng các tính năng 18+, nên khai một lần là
// khoá luôn — sửa được thì cổng độ tuổi chỉ còn là hình thức. Không hỏi ngày
// sinh vì việc chặn chỉ cần tới tháng.
// Hạng Star tự suy ra từ ngày sinh nên không có gì để sửa ở đây — chỉ hiển thị.
function TierRow({ bio, formData }) {
  const tier = memberTier({ ...formData, starVip: bio?.starVip });
  if (!tier) return null;
  return (
    <div className="apple-account-row">
      <span className="apple-account-row-icon material-symbols-outlined" aria-hidden="true">military_tech</span>
      <span className="apple-account-row-label">Hạng thành viên</span>
      <span className="flex min-w-0 flex-1 justify-end">
        <TierBadge tier={tier} />
      </span>
    </div>
  );
}

function BirthGateRow({ formData, onChange }) {
  const locked = Boolean(formData.birthYear);
  const thisYear = new Date().getFullYear();

  if (locked) {
    return (
      <VerifiedRow
        icon="calendar_month"
        label="Tháng/năm sinh"
        value={`${String(formData.birthMonth || 1).padStart(2, "0")}/${formData.birthYear}`}
        lockLabel="Chỉ khai một lần. Cần sửa thì liên hệ quản trị viên."
      />
    );
  }

  return (
    <div className="apple-account-row">
      <span className="apple-account-row-icon material-symbols-outlined" aria-hidden="true">calendar_month</span>
      <span className="apple-account-row-label">Tháng/năm sinh</span>
      <span className="flex min-w-0 flex-1 gap-2">
        <select className={FIELD_CLASS} name="birthMonth" value={formData.birthMonth || ""} onChange={onChange} aria-label="Tháng sinh">
          <option value="">Tháng</option>
          {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
            <option key={month} value={month}>Tháng {month}</option>
          ))}
        </select>
        <select className={FIELD_CLASS} name="birthYear" value={formData.birthYear || ""} onChange={onChange} aria-label="Năm sinh">
          <option value="">Năm</option>
          {Array.from({ length: 80 }, (_, index) => thisYear - 14 - index).map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </span>
    </div>
  );
}

function AccountGroup({ title, description, children }) {
  return (
    <section className="space-y-2.5">
      <div className="px-1">
        <h3 className="text-[13px] font-semibold tracking-tight text-foreground">{title}</h3>
        {description ? <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</p> : null}
      </div>
      <div className="apple-account-group">{children}</div>
    </section>
  );
}

export default function PersonalInfoSubTab({
  formData,
  handleFieldChange,
  handleSave,
  saving,
  isDragOver,
  setIsDragOver,
  processFile,
  avatarInputRef,
  handleAvatarChange,
  memberSession,
  bio,
  hideAvatarSection,
  t,
}) {
  const verifiedSchool =
    formData.education ||
    bio?.verificationRequest?.schoolName ||
    "";
  const verifiedPhone =
    formData.phone ||
    bio?.verificationRequest?.phoneZalo ||
    "";

  return (
    <form className="apple-account-shell animate-fadeIn" onSubmit={handleSave}>
      <header className="apple-account-hero">
        <div className={`apple-account-avatar-control ${hideAvatarSection ? "apple-account-avatar-control--compact" : ""}`}>
        <div
          className={`apple-account-avatar group ${isDragOver && !formData.antiDeepfakeLock ? "is-dragging" : ""} ${hideAvatarSection ? "apple-account-avatar--compact" : ""}`}
          onClick={() => !saving && !formData.antiDeepfakeLock && avatarInputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            if (!formData.antiDeepfakeLock) setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragOver(false);
            if (!formData.antiDeepfakeLock) processFile(event.dataTransfer.files[0]);
          }}
          role="button"
          tabIndex={formData.antiDeepfakeLock ? -1 : 0}
          onKeyDown={(event) => {
            if ((event.key === "Enter" || event.key === " ") && !formData.antiDeepfakeLock) {
              event.preventDefault();
              avatarInputRef.current?.click();
            }
          }}
          aria-label={t("memberPortal.bio.changeAvatar")}
        >
          {formData.avatarUrl ? (
            <img
              src={optimizeCloudinaryUrl(formData.avatarUrl, 320)}
              alt={formData.displayName || t("memberPortal.bio.avatarTitle")}
            />
          ) : (
            <span className="material-symbols-outlined" aria-hidden="true">person</span>
          )}
        </div>
        <button
          type="button"
          className="apple-account-avatar-action"
          onClick={() => !saving && !formData.antiDeepfakeLock && avatarInputRef.current?.click()}
          disabled={saving || formData.antiDeepfakeLock}
          aria-label={t("memberPortal.bio.changeAvatar")}
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            {formData.antiDeepfakeLock ? "lock" : "photo_camera"}
          </span>
        </button>
        </div>
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="portal-eyebrow">{t("memberPortal.account.appleAccount")}</p>
          <h2 className="mt-1 break-words text-[28px] font-semibold leading-tight tracking-[-0.035em] text-foreground sm:text-[32px]">
            {formData.displayName || t("memberPortal.bio.noName")}
          </h2>
          <p className="mt-1 truncate text-sm text-muted-foreground">{memberSession?.email || "—"}</p>
          <div className={`apple-account-status ${bio?.isEduVerified ? "is-verified" : ""}`}>
            <span className="material-symbols-outlined" aria-hidden="true">
              {bio?.isEduVerified ? "verified" : "schedule"}
            </span>
            {bio?.isEduVerified
              ? t("memberPortal.account.eduVerified")
              : t("memberPortal.account.verificationPending")}
          </div>
        </div>
      </header>

      <input
        type="file"
        ref={avatarInputRef}
        accept="image/*"
        onChange={handleAvatarChange}
        className="hidden"
        disabled={saving || formData.antiDeepfakeLock}
      />

      <AccountGroup
        title={t("memberPortal.account.personalInformation")}
        description={t("memberPortal.account.personalInformationDescription")}
      >
        <EditableRow
          icon="person"
          label={t("memberPortal.bio.fullName")}
          name="displayName"
          value={formData.displayName}
          onChange={handleFieldChange}
          placeholder={t("memberPortal.bio.placeholderName")}
          required
        />
        <EditableRow
          icon="badge"
          label={t("memberPortal.bio.nickname")}
          name="headline"
          value={formData.headline}
          onChange={handleFieldChange}
          placeholder={t("memberPortal.bio.placeholderHeadline")}
        />
        <EditableRow
          icon="cake"
          label={t("memberPortal.bio.birthday")}
          name="birthday"
          value={formData.birthday}
          onChange={handleFieldChange}
          placeholder={t("memberPortal.bio.placeholderBirthday")}
        />
        <BirthGateRow formData={formData} onChange={handleFieldChange} />
        <TierRow bio={bio} formData={formData} />
        <label className="apple-account-row apple-account-row--textarea">
          <span className="apple-account-row-icon material-symbols-outlined" aria-hidden="true">notes</span>
          <span className="apple-account-row-label">{t("memberPortal.account.about")}</span>
          <textarea
            name="bio"
            value={formData.bio || ""}
            onChange={handleFieldChange}
            placeholder={t("memberPortal.account.aboutPlaceholder")}
            rows={3}
            className={`${FIELD_CLASS} resize-y leading-relaxed`}
          />
        </label>
      </AccountGroup>

      <AccountGroup
        title={t("memberPortal.account.verifiedIdentity")}
        description={t("memberPortal.account.verifiedIdentityDescription")}
      >
        <VerifiedRow
          icon="mail"
          label={t("memberPortal.bio.gmail")}
          value={memberSession?.email}
          lockLabel={t("memberPortal.account.eduFieldLocked")}
        />
        <VerifiedRow
          icon="phone"
          label={t("memberPortal.bio.phone")}
          value={verifiedPhone}
          lockLabel={t("memberPortal.account.eduFieldLocked")}
        />
        <VerifiedRow
          icon="school"
          label={t("memberPortal.career.education")}
          value={verifiedSchool}
          lockLabel={t("memberPortal.account.eduFieldLocked")}
        />
        <div className="apple-account-security-note">
          <span className="material-symbols-outlined" aria-hidden="true">verified_user</span>
          <p>{t("memberPortal.account.eduProtectionNote")}</p>
        </div>
      </AccountGroup>

      <AccountGroup title={t("memberPortal.career.title")}>
        <EditableRow
          icon="work"
          label={t("memberPortal.career.role")}
          name="jobTitle"
          value={formData.jobTitle}
          onChange={handleFieldChange}
          placeholder={t("memberPortal.career.placeholderRole")}
        />
        <EditableRow
          icon="psychology"
          label={t("memberPortal.career.skills")}
          name="skills"
          value={formData.skills}
          onChange={handleFieldChange}
          placeholder={t("memberPortal.career.placeholderSkills")}
        />
      </AccountGroup>

      <AccountGroup
        title={t("memberPortal.account.optionalDetails")}
        description={t("memberPortal.account.optionalDetailsDescription")}
      >
        <EditableRow icon="height" label={t("memberPortal.physical.height")} name="height" value={formData.height} onChange={handleFieldChange} placeholder={t("memberPortal.physical.placeholderHeight")} />
        <EditableRow icon="monitor_weight" label={t("memberPortal.physical.weight")} name="weight" value={formData.weight} onChange={handleFieldChange} placeholder={t("memberPortal.physical.placeholderWeight")} />
        <EditableRow icon="straighten" label={t("memberPortal.physical.measurements")} name="measurements" value={formData.measurements} onChange={handleFieldChange} placeholder={t("memberPortal.physical.placeholderMeasure")} />
        <EditableRow icon="location_on" label={t("memberPortal.physical.location")} name="address" value={formData.address} onChange={handleFieldChange} placeholder={t("memberPortal.physical.placeholderLocation")} />
      </AccountGroup>

      <div className="apple-account-savebar">
        <div>
          <strong>{t("memberPortal.account.saveTitle")}</strong>
          <small>{t("memberPortal.account.saveDescription")}</small>
        </div>
        <button type="submit" className="apple-account-save" disabled={saving}>
          {saving ? (
            <span className="apple-account-spinner" aria-hidden="true" />
          ) : (
            <span className="material-symbols-outlined" aria-hidden="true">check</span>
          )}
          {saving ? t("memberPortal.bio.saving") : t("memberPortal.bio.saveChanges")}
        </button>
      </div>
    </form>
  );
}
