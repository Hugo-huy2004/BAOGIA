import "./apple-account.css";
import { memberTier, TierBadge } from "../../lib/memberTier";
import { optimizeCloudinaryUrl } from "../../utils/imageOptimizer";
import { formatFullAddress, profileAnswerDisplayName, religionDisplayName } from "../../lib/profileDisplay";
import OptimizedInput from "../common/OptimizedInput";

const FIELD_CLASS =
  "apple-account-input w-full min-w-0 bg-transparent text-foreground placeholder:text-muted-foreground/55 focus:outline-none";

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

function VerifiedRow({ icon, label, value, lockLabel, multiline = false }) {
  return (
    <div className="apple-account-row apple-account-row--verified">
      <span className="apple-account-row-icon material-symbols-outlined" aria-hidden="true">{icon}</span>
      <span className="apple-account-row-label">{label}</span>
      <span className={`min-w-0 flex-1 text-[15px] font-medium text-foreground ${multiline ? "whitespace-normal text-right leading-snug" : "truncate"}`}>
        {value || "—"}
      </span>
      <span className="apple-account-lock" title={lockLabel}>
        <span className="material-symbols-outlined" aria-hidden="true">lock</span>
        <span className="sr-only">{lockLabel}</span>
      </span>
    </div>
  );
}

function TierRow({ bio, formData, t }) {
  const tier = memberTier({ ...formData, starVip: bio?.starVip });
  if (!tier) return null;
  return (
    <div className="apple-account-row">
      <span className="apple-account-row-icon material-symbols-outlined" aria-hidden="true">military_tech</span>
      <span className="apple-account-row-label">{t("memberPortal.account.membershipTier")}</span>
      <span className="flex min-w-0 flex-1 justify-end">
        <TierBadge tier={tier} />
      </span>
    </div>
  );
}

function BirthGateRow({ formData, onChange, t }) {
  const locked = Boolean(formData.birthYear);
  const thisYear = new Date().getFullYear();

  if (locked) {
    return (
      <VerifiedRow
        icon="calendar_month"
        label={t("memberPortal.account.birthMonthYear")}
        value={`${String(formData.birthMonth || 1).padStart(2, "0")}/${formData.birthYear}`}
        lockLabel={t("memberPortal.account.birthDateLocked")}
      />
    );
  }

  return (
    <div className="apple-account-row">
      <span className="apple-account-row-icon material-symbols-outlined" aria-hidden="true">calendar_month</span>
      <span className="apple-account-row-label">{t("memberPortal.account.birthMonthYear")}</span>
      <span className="flex min-w-0 flex-1 gap-2">
        <select className={FIELD_CLASS} name="birthMonth" value={formData.birthMonth || ""} onChange={onChange} aria-label={t("memberPortal.onboarding.monthAria")}>
          <option value="">{t("memberPortal.onboarding.month")}</option>
          {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
            <option key={month} value={month}>{t("memberPortal.onboarding.monthOption", { month })}</option>
          ))}
        </select>
        <select className={FIELD_CLASS} name="birthYear" value={formData.birthYear || ""} onChange={onChange} aria-label={t("memberPortal.onboarding.yearAria")}>
          <option value="">{t("memberPortal.onboarding.year")}</option>
          {Array.from({ length: 80 }, (_, index) => thisYear - 14 - index).map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </span>
    </div>
  );
}

function AccountGroup({ title, description, icon, children, optional = false }) {
  const content = (
    <>
      <div className="apple-account-section-heading">
        {icon ? <span className="material-symbols-outlined" aria-hidden="true">{icon}</span> : null}
        <span>
          <h3>{title}</h3>
          {description ? <p>{description}</p> : null}
        </span>
      </div>
      <div className="apple-account-group">{children}</div>
    </>
  );

  if (optional) {
    return (
      <details className="apple-account-section apple-account-section--optional">
        <summary>
          <span className="material-symbols-outlined" aria-hidden="true">{icon}</span>
          <span className="min-w-0 flex-1">
            <strong>{title}</strong>
            {description ? <small>{description}</small> : null}
          </span>
          <span className="material-symbols-outlined apple-account-disclosure" aria-hidden="true">chevron_right</span>
        </summary>
        <div className="apple-account-group">{children}</div>
      </details>
    );
  }

  return (
    <section className="apple-account-section">{content}</section>
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
  const cleanVal = (val) => {
    if (typeof val !== "string" || !val) return "";
    if (val.startsWith("$enc$") || val.startsWith("enc:")) return "";
    return val;
  };

  const verifiedSchool =
    cleanVal(formData.education) ||
    cleanVal(bio?.verificationRequest?.schoolName) ||
    "";
  const verifiedPhone =
    cleanVal(formData.phone) ||
    cleanVal(bio?.verificationRequest?.phoneZalo) ||
    cleanVal(bio?.phone) ||
    "";
  const profileLanguage = bio?.language || "vi";
  const isVietnamese = String(profileLanguage).toLowerCase().startsWith("vi");
  const privateAddress = formatFullAddress(formData, profileLanguage);
  const identityLockLabel = isVietnamese ? "Muốn thay đổi, vui lòng liên hệ admin" : "Contact an administrator to make changes";

  return (
    <form className="apple-account-shell apple-account-shell--ios27 animate-fadeIn" onSubmit={handleSave}>
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
        <div className="apple-account-hero-copy min-w-0 flex-1 text-center sm:text-left">
          <p className="apple-account-identity-kicker">{t("memberPortal.account.appleAccount")}</p>
          <h2>
            {formData.displayName || t("memberPortal.bio.noName")}
          </h2>
          <p>{memberSession?.email || "—"}</p>
          <div className="apple-account-hero-badges">
            <div className={`apple-account-status ${bio?.isEduVerified ? "is-verified" : ""}`}>
              <span className="material-symbols-outlined" aria-hidden="true">
                {bio?.isEduVerified ? "verified" : "schedule"}
              </span>
              {bio?.isEduVerified
                ? t("memberPortal.account.eduVerified")
                : t("memberPortal.account.verificationPending")}
            </div>
            <TierBadge tier={memberTier({ ...formData, starVip: bio?.starVip })} />
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
        icon="person"
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
        <BirthGateRow formData={formData} onChange={handleFieldChange} t={t} />
        <TierRow bio={bio} formData={formData} t={t} />
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
        icon="verified_user"
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

      <AccountGroup
        title={isVietnamese ? "Thông tin cư trú & bản sắc" : "Residence & identity"}
        description={isVietnamese ? "Thông tin riêng tư đã xác minh và được khóa sau khi lưu." : "Verified private information, locked after it is saved."}
        icon="shield_lock"
      >
        <VerifiedRow
          icon="home_pin"
          label={isVietnamese ? "Địa chỉ cư trú" : "Residence address"}
          value={privateAddress}
          lockLabel={identityLockLabel}
          multiline
        />

        <VerifiedRow
          icon="location_on"
          label={isVietnamese ? "Định vị" : "Location"}
          value={bio?.locationVerifiedAt ? (isVietnamese ? "Đã xác minh trên bản đồ" : "Verified on map") : "—"}
          lockLabel={identityLockLabel}
        />

        <VerifiedRow
          icon="diversity_3"
          label={isVietnamese ? "Dân tộc" : "Ethnicity"}
          value={profileAnswerDisplayName(formData.ethnicity, profileLanguage)}
          lockLabel={identityLockLabel}
          multiline
        />
        <VerifiedRow
          icon="account_balance"
          label={isVietnamese ? "Tôn giáo / hệ phái" : "Religion / denomination"}
          value={religionDisplayName(formData.religion, profileLanguage)}
          lockLabel={identityLockLabel}
          multiline
        />
        <div className="apple-account-security-note">
          <span className="material-symbols-outlined" aria-hidden="true">lock</span>
          <p>{identityLockLabel}. {isVietnamese ? "Các thông tin này không hiển thị trên Bio công khai." : "This information is never shown on your public Bio."}</p>
        </div>
      </AccountGroup>

      <AccountGroup
        title={t("memberPortal.career.title")}
        description={t("memberPortal.career.placeholderSkills")}
        icon="work"
        optional
      >
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
        icon="tune"
        optional
      >
        <EditableRow icon="palette" label="Sở thích & Thói quen" name="hobbies" value={formData.hobbies} onChange={handleFieldChange} placeholder="Ví dụ: Đọc sách, Chơi cờ, Lập trình..." />
        <EditableRow icon="height" label={t("memberPortal.physical.height")} name="height" value={formData.height} onChange={handleFieldChange} placeholder={t("memberPortal.physical.placeholderHeight")} />
        <EditableRow icon="monitor_weight" label={t("memberPortal.physical.weight")} name="weight" value={formData.weight} onChange={handleFieldChange} placeholder={t("memberPortal.physical.placeholderWeight")} />
        <EditableRow icon="straighten" label={t("memberPortal.physical.measurements")} name="measurements" value={formData.measurements} onChange={handleFieldChange} placeholder={t("memberPortal.physical.placeholderMeasure")} />
        <EditableRow icon="location_on" label={isVietnamese ? "Địa điểm hiển thị công khai" : "Public display location"} name="address" value={formData.address} onChange={handleFieldChange} placeholder={t("memberPortal.physical.placeholderLocation")} />
      </AccountGroup>

      <div className="apple-account-savebar">
        <div>
          <span className="apple-account-save-state" aria-hidden="true" />
          <span>
            <strong>{t("memberPortal.account.saveTitle")}</strong>
            <small>{t("memberPortal.account.saveDescription")}</small>
          </span>
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
