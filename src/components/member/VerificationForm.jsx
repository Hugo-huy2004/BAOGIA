import { useState } from "react";
import { useTranslation } from "react-i18next";

// Recognized level tokens a member might accidentally type into the school
// name field (e.g. "THCS Nguyễn Du") — stripped automatically, and used to
// auto-fill the level dropdown so they don't have to pick it manually.
const LEVEL_TOKENS = [
  { re: /^trung học cơ sở[\s.:-]+/i, level: "THCS" },
  { re: /^trung học phổ thông[\s.:-]+/i, level: "THPT" },
  { re: /^tiểu học[\s.:-]+/i, level: "TH" },
  { re: /^cao đẳng[\s.:-]+/i, level: "CD" },
  { re: /^đại học[\s.:-]+/i, level: "DH" },
  { re: /^thcs[\s.:-]+/i, level: "THCS" },
  { re: /^thpt[\s.:-]+/i, level: "THPT" },
  { re: /^cđ[\s.:-]+/i, level: "CD" },
  { re: /^đh[\s.:-]+/i, level: "DH" },
  { re: /^th[\s.:-]+/i, level: "TH" },
];

function parseSchoolName(rawValue, currentLevel) {
  for (const { re, level } of LEVEL_TOKENS) {
    if (re.test(rawValue)) {
      return { schoolName: rawValue.replace(re, "").trim(), schoolLevel: level };
    }
  }
  return { schoolName: rawValue, schoolLevel: currentLevel };
}

export default function VerificationForm({
  bio,
  verificationForm,
  setVerificationForm,
  handleVerificationSubmit,
  handleVerificationAppeal,
  handleLogout,
  verifying,
  appealSubmitting,
  appealSent,
}) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [fileError, setFileError] = useState("");
  const [stepError, setStepError] = useState("");
  const updateForm = (patch) => setVerificationForm((current) => ({ ...current, ...patch }));
  const request = bio?.verificationRequest || {};
  const submissionCount = Math.max(Number(request.submissionCount) || 0, request.notifiedStatus === "rejected" ? 1 : 0);
  const attemptsRemaining = Math.max(0, 2 - submissionCount);
  const wasRejected = request.notifiedStatus === "rejected";
  const supportAppealForm = (
    <form onSubmit={handleVerificationAppeal} className="space-y-3 rounded-lg border border-border p-4 text-left">
      <div className="space-y-1">
        <label htmlFor="verification-support-contact" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          {t("memberPortal.verify.supportContact")}
        </label>
        <input
          id="verification-support-contact"
          type="text"
          autoComplete="email"
          maxLength={200}
          value={verificationForm.supportContact || ""}
          onChange={(event) => updateForm({ supportContact: event.target.value })}
          placeholder={t("memberPortal.verify.supportContactPlaceholder")}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="verification-support-message" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          {t("memberPortal.verify.supportMessage")}
        </label>
        <textarea
          id="verification-support-message"
          rows={3}
          maxLength={1000}
          value={verificationForm.supportMessage || ""}
          onChange={(event) => updateForm({ supportMessage: event.target.value })}
          placeholder={t("memberPortal.verify.supportMessagePlaceholder")}
          className="w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      {appealSent && <p role="status" className="text-xs text-emerald-600">{t("memberPortal.verify.supportSent")}</p>}
      <button
        type="submit"
        disabled={appealSubmitting}
        className="w-full rounded-md bg-primary px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"
      >
        {appealSubmitting ? t("memberPortal.verify.supportSending") : t("memberPortal.verify.supportSubmit")}
      </button>
    </form>
  );
  const handleStepSubmit = (event) => {
    event.preventDefault();
    setStepError("");
    if (step === 0) {
      const requiredFields = ["fullName", "birthday", "phoneZalo", "schoolName", "schoolLevel"];
      if (requiredFields.some((field) => !String(verificationForm[field] || "").trim())) {
        setStepError(t("memberPortal.toast.fillAllWarning"));
        return;
      }
      setStep(1);
      return;
    }
    if (step === 1) {
      const evidenceCount = (verificationForm.evidenceFiles || []).filter(Boolean).length;
      if (!verificationForm.evidenceFiles?.[0] || evidenceCount > 2) {
        setStepError(t("memberPortal.verify.evidenceRequired"));
        return;
      }
      setStep(2);
      return;
    }
    if (!verificationForm.acceptTerms || !verificationForm.acceptContact) {
      setStepError(t("memberPortal.toast.acceptTermsWarning"));
      return;
    }
    handleVerificationSubmit(event);
  };
  const handleSchoolNameChange = (e) => {
    const { schoolName, schoolLevel } = parseSchoolName(e.target.value, verificationForm.schoolLevel);
    updateForm({ schoolName, schoolLevel });
  };

  if (wasRejected && attemptsRemaining === 0) {
    return (
      <div className="max-w-xl mx-auto py-8 px-4">
        <div className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-xl sm:p-8">
          <div className="space-y-2 text-center">
            <span className="material-symbols-outlined text-4xl text-destructive">report</span>
            <h2 className="font-display text-xl font-black text-foreground">{t("memberPortal.verify.attemptsExhausted")}</h2>
            <p className="text-xs leading-relaxed text-muted-foreground">{t("memberPortal.verify.rejectionSupportHint")}</p>
          </div>
          {supportAppealForm}
          <a
            href="mailto:contact@hugowishpax.studio?subject=Student%20verification%20review"
            className="block text-center text-xs font-semibold text-primary underline underline-offset-2"
          >
            {t("memberPortal.verify.emailSupport")}
          </a>
          <button type="button" onClick={handleLogout} className="w-full rounded-md border border-border py-2.5 text-xs font-bold text-foreground">
            {t("memberPortal.verify.logoutBtn")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-8 px-4 animate-fadeIn">
      <div className="bg-white/80 dark:bg-card/80 backdrop-blur-md border border-border/50 p-6 sm:p-8 rounded-xl shadow-xl space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-purple-500 to-pink-500" />

        <div className="text-center space-y-2">
          <span className="material-symbols-outlined text-4xl text-primary">
            school
          </span>
          <h2 className="font-display text-xl sm:text-2xl font-black text-foreground uppercase tracking-tight">
            {t("memberPortal.verify.title")}
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t("memberPortal.verify.desc")}
          </p>
        </div>

        {wasRejected && (
          <div role="alert" className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs">
            <p className="font-semibold text-foreground">{t("memberPortal.verify.rejectionNote", { count: attemptsRemaining })}</p>
            <a
              href="mailto:contact@hugowishpax.studio?subject=Student%20verification%20review"
              className="font-semibold text-primary underline underline-offset-2"
            >
              {t("memberPortal.verify.emailSupport")}
            </a>
          </div>
        )}

        <div
          className="flex items-center gap-2"
          role="progressbar"
          aria-label={t("memberPortal.verify.stepProgress")}
          aria-valuemin={1}
          aria-valuemax={3}
          aria-valuenow={step + 1}
          aria-valuetext={t(`memberPortal.verify.step${["Details", "Evidence", "Review"][step]}`)}
        >
          {[0, 1, 2].map((item) => (
            <div key={item} className={`h-1.5 flex-1 rounded-full ${item <= step ? "bg-primary" : "bg-border"}`} />
          ))}
        </div>
        <p className="text-center text-[11px] font-semibold text-muted-foreground" aria-live="polite">
          {t(`memberPortal.verify.step${["Details", "Evidence", "Review"][step]}`)}
        </p>
        <form onSubmit={handleStepSubmit} className="space-y-5">
          <div className="space-y-4">
            {step === 0 && (
              <>
            {/* Full Name */}
            <div className="space-y-1">
              <label htmlFor="verification-full-name" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                {t("memberPortal.verify.fullName")}
              </label>
              <input
                id="verification-full-name"
                type="text"
                placeholder={t("memberPortal.verify.fullNamePlaceholder")}
                value={verificationForm.fullName}
                onChange={(e) => updateForm({ fullName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-md border border-border bg-zinc-50/50 dark:bg-background text-xs text-foreground outline-none focus:ring-2 focus:ring-primary transition-all placeholder-zinc-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Birthday */}
              <div className="space-y-1">
                <label htmlFor="verification-birthday" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  {t("memberPortal.verify.birthday")}
                </label>
                <input
                  id="verification-birthday"
                  type="date"
                  value={verificationForm.birthday}
                  onChange={(e) => updateForm({ birthday: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-md border border-border bg-zinc-50/50 dark:bg-background text-xs text-foreground outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>

              {/* Phone Zalo */}
              <div className="space-y-1">
                <label htmlFor="verification-phone" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  {t("memberPortal.verify.phoneZalo")}
                </label>
                <input
                  id="verification-phone"
                  type="tel"
                  placeholder={t("memberPortal.verify.phoneZaloPlaceholder")}
                  value={verificationForm.phoneZalo}
                  onChange={(e) => updateForm({ phoneZalo: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-md border border-border bg-zinc-50/50 dark:bg-background text-xs text-foreground outline-none focus:ring-2 focus:ring-primary transition-all placeholder-zinc-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* School Name — just type the name, level is auto-detected */}
              <div className="space-y-1">
                <label htmlFor="verification-school-name" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  {t("memberPortal.verify.schoolName")}
                </label>
                <input
                  id="verification-school-name"
                  type="text"
                  placeholder={t("memberPortal.verify.schoolNamePlaceholder")}
                  value={verificationForm.schoolName}
                  onChange={handleSchoolNameChange}
                  className="w-full px-4 py-2.5 rounded-md border border-border bg-zinc-50/50 dark:bg-background text-xs text-foreground outline-none focus:ring-2 focus:ring-primary transition-all placeholder-zinc-400"
                />
              </div>

              {/* School Level — auto-filled from the name above, can override manually */}
              <div className="space-y-1">
                <label htmlFor="verification-school-level" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  {t("memberPortal.verify.schoolLevel")}
                </label>
                <select
                  id="verification-school-level"
                  value={verificationForm.schoolLevel}
                  onChange={(e) => updateForm({ schoolLevel: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-md border border-border bg-zinc-50/50 dark:bg-background text-xs text-foreground outline-none focus:ring-2 focus:ring-primary transition-all"
                >
                  <option value="">{t("memberPortal.verify.schoolLevelPlaceholder")}</option>
                  <option value="TH">{t("memberPortal.verify.levelTH")}</option>
                  <option value="THCS">{t("memberPortal.verify.levelTHCS")}</option>
                  <option value="THPT">{t("memberPortal.verify.levelTHPT")}</option>
                  <option value="CD">{t("memberPortal.verify.levelCD")}</option>
                  <option value="DH">{t("memberPortal.verify.levelDH")}</option>
                </select>
              </div>
            </div>

            {/* Student/School ID code */}
            <div className="space-y-1">
              <label htmlFor="verification-student-id" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                {t("memberPortal.verify.studentId")} <span className="normal-case text-muted-foreground/70">(nếu có)</span>
              </label>
              <input
                id="verification-student-id"
                type="text"
                placeholder={t("memberPortal.verify.studentIdPlaceholder")}
                value={verificationForm.schoolIdCode}
                onChange={(e) => updateForm({ schoolIdCode: e.target.value })}
                className="w-full px-4 py-2.5 rounded-md border border-border bg-zinc-50/50 dark:bg-background text-xs text-foreground outline-none focus:ring-2 focus:ring-primary transition-all placeholder-zinc-400"
              />
            </div>

              </>
            )}
            {step === 1 && (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground">{t("memberPortal.verify.evidenceHint")}</p>
                <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
                  <p>{t("memberPortal.verify.evidenceQuality")}</p>
                  <p className="mt-2">{t("memberPortal.verify.privacyNotice")}</p>
                </div>
                {[0, 1].map((index) => (
                  <div key={index} className="space-y-1">
                    <label htmlFor={`verification-evidence-${index}`} className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      {t("memberPortal.verify.evidenceSlot", { count: index + 1 })}
                      <span className="ml-1 normal-case font-medium text-muted-foreground/70">
                        {index === 0 ? t("memberPortal.verify.requiredBadge") : t("memberPortal.verify.optionalBadge")}
                      </span>
                    </label>
                    <input
                      id={`verification-evidence-${index}`}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        const files = [...(verificationForm.evidenceFiles || [])];
                        if (file && file.size > 4 * 1024 * 1024) {
                          e.target.value = "";
                          setFileError(t("memberPortal.verify.evidenceTooLarge"));
                          return;
                        }
                        files[index] = file;
                        setFileError("");
                        updateForm({ evidenceFiles: files });
                      }}
                      className="w-full text-xs text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-xs file:font-bold file:text-primary"
                    />
                    {verificationForm.evidenceFiles?.[index] && (
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] text-muted-foreground truncate">{verificationForm.evidenceFiles[index].name}</p>
                        <button
                          type="button"
                          onClick={() => {
                            const files = [...verificationForm.evidenceFiles];
                            files[index] = null;
                            updateForm({ evidenceFiles: files });
                          }}
                          className="text-[11px] font-semibold text-destructive"
                        >
                          {t("memberPortal.verify.removeEvidence")}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {fileError && <p className="text-[11px] text-destructive">{fileError}</p>}
              </div>
            )}
            {step === 2 && (
              <div className="space-y-4">
                <dl className="space-y-2 rounded-lg border border-border p-3 text-xs">
                  <div className="flex justify-between gap-3"><dt className="text-muted-foreground">{t("memberPortal.verify.fullName")}</dt><dd className="text-right font-semibold">{verificationForm.fullName}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-muted-foreground">{t("memberPortal.verify.schoolName")}</dt><dd className="text-right font-semibold">{verificationForm.schoolName}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-muted-foreground">{t("memberPortal.verify.evidenceCount")}</dt><dd className="text-right font-semibold">{(verificationForm.evidenceFiles || []).filter(Boolean).length}/2</dd></div>
                </dl>
                <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
                  <p>{t("memberPortal.verify.privacyNotice")}</p>
                  <p className="mt-2">{t("memberPortal.verify.securityNotice")}</p>
                  <p className="mt-2">{t("memberPortal.verify.emailSupportDetail")}</p>
                </div>
              </div>
            )}
          </div>

          {/* Checkboxes */}
          {step === 2 && <div className="space-y-3 pt-2">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={verificationForm.acceptTerms}
                onChange={(e) => updateForm({ acceptTerms: e.target.checked })}
                className="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-[11px] text-muted-foreground dark:text-zinc-400 leading-normal">
                {t("memberPortal.verify.acceptTerms")}
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={verificationForm.acceptContact}
                onChange={(e) => updateForm({ acceptContact: e.target.checked })}
                className="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-[11px] text-muted-foreground dark:text-zinc-400 leading-normal">
                {t("memberPortal.verify.acceptContact")}
              </span>
            </label>
          </div>}
          {stepError && <p role="alert" className="text-center text-xs text-destructive">{stepError}</p>}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleLogout}
              className="flex-1 py-2.5 border border-border hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-foreground/80 text-xs font-bold rounded-md transition-all active:scale-95"
            >
              {t("memberPortal.verify.logoutBtn")}
            </button>
            {step > 0 && (
              <button
                type="button"
                onClick={() => { setStep((current) => Math.max(0, current - 1)); setStepError(""); }}
                className="flex-1 py-2.5 border border-border text-foreground/80 text-xs font-bold rounded-md"
              >
                {t("memberPortal.verify.backBtn")}
              </button>
            )}
            <button
              type="submit"
              disabled={verifying || attemptsRemaining === 0}
              className="flex-[2] py-2.5 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-md transition-all active:scale-95 shadow-md shadow-primary/40 dark:shadow-none flex justify-center items-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none"
            >
              {verifying && (
                <span className="animate-spin border-2 border-white border-t-transparent w-3 h-3 rounded-full shrink-0" />
              )}
              {step < 2 ? t("memberPortal.verify.continueBtn") : t("memberPortal.verify.submitBtn")}
              <span className="material-symbols-outlined text-xs">{step < 2 ? "arrow_forward" : "send"}</span>
            </button>
          </div>
        </form>
        {wasRejected && (
          <div className="space-y-3 border-t border-border pt-4">
            <h3 className="text-sm font-bold text-foreground">{t("memberPortal.verify.supportTitle")}</h3>
            {supportAppealForm}
          </div>
        )}
      </div>
    </div>
  );
}
