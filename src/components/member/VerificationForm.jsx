import React from "react";
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
  verificationForm,
  setVerificationForm,
  handleVerificationSubmit,
  handleLogout,
  verifying
}) {
  const { t } = useTranslation();
  const handleSchoolNameChange = (e) => {
    const { schoolName, schoolLevel } = parseSchoolName(e.target.value, verificationForm.schoolLevel);
    setVerificationForm({ ...verificationForm, schoolName, schoolLevel });
  };

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

        <form onSubmit={handleVerificationSubmit} className="space-y-5">
          <div className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                {t("memberPortal.verify.fullName")}
              </label>
              <input
                type="text"
                required
                placeholder={t("memberPortal.verify.fullNamePlaceholder")}
                value={verificationForm.fullName}
                onChange={(e) => setVerificationForm({ ...verificationForm, fullName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-md border border-border bg-zinc-50/50 dark:bg-background text-xs text-foreground outline-none focus:ring-2 focus:ring-primary transition-all placeholder-zinc-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Birthday */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  {t("memberPortal.verify.birthday")}
                </label>
                <input
                  type="date"
                  required
                  value={verificationForm.birthday}
                  onChange={(e) => setVerificationForm({ ...verificationForm, birthday: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-md border border-border bg-zinc-50/50 dark:bg-background text-xs text-foreground outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>

              {/* Phone Zalo */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  {t("memberPortal.verify.phoneZalo")}
                </label>
                <input
                  type="tel"
                  required
                  placeholder={t("memberPortal.verify.phoneZaloPlaceholder")}
                  value={verificationForm.phoneZalo}
                  onChange={(e) => setVerificationForm({ ...verificationForm, phoneZalo: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-md border border-border bg-zinc-50/50 dark:bg-background text-xs text-foreground outline-none focus:ring-2 focus:ring-primary transition-all placeholder-zinc-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* School Name — just type the name, level is auto-detected */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  {t("memberPortal.verify.schoolName")}
                </label>
                <input
                  type="text"
                  required
                  placeholder={t("memberPortal.verify.schoolNamePlaceholder")}
                  value={verificationForm.schoolName}
                  onChange={handleSchoolNameChange}
                  className="w-full px-4 py-2.5 rounded-md border border-border bg-zinc-50/50 dark:bg-background text-xs text-foreground outline-none focus:ring-2 focus:ring-primary transition-all placeholder-zinc-400"
                />
              </div>

              {/* School Level — auto-filled from the name above, can override manually */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  {t("memberPortal.verify.schoolLevel")}
                </label>
                <select
                  required
                  value={verificationForm.schoolLevel}
                  onChange={(e) => setVerificationForm({ ...verificationForm, schoolLevel: e.target.value })}
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
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                {t("memberPortal.verify.studentId")}
              </label>
              <input
                type="text"
                required
                placeholder={t("memberPortal.verify.studentIdPlaceholder")}
                value={verificationForm.schoolIdCode}
                onChange={(e) => setVerificationForm({ ...verificationForm, schoolIdCode: e.target.value })}
                className="w-full px-4 py-2.5 rounded-md border border-border bg-zinc-50/50 dark:bg-background text-xs text-foreground outline-none focus:ring-2 focus:ring-primary transition-all placeholder-zinc-400"
              />
            </div>
          </div>

          {/* Checkboxes */}
          <div className="space-y-3 pt-2">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                required
                checked={verificationForm.acceptTerms}
                onChange={(e) => setVerificationForm({ ...verificationForm, acceptTerms: e.target.checked })}
                className="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-[11px] text-muted-foreground dark:text-zinc-400 leading-normal">
                {t("memberPortal.verify.acceptTerms")}
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                required
                checked={verificationForm.acceptContact}
                onChange={(e) => setVerificationForm({ ...verificationForm, acceptContact: e.target.checked })}
                className="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-[11px] text-muted-foreground dark:text-zinc-400 leading-normal">
                {t("memberPortal.verify.acceptContact")}
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleLogout}
              className="flex-1 py-2.5 border border-border hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-foreground/80 text-xs font-bold rounded-md transition-all active:scale-95"
            >
              {t("memberPortal.verify.logoutBtn")}
            </button>
            <button
              type="submit"
              disabled={verifying}
              className="flex-[2] py-2.5 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-md transition-all active:scale-95 shadow-md shadow-primary/40 dark:shadow-none flex justify-center items-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none"
            >
              {verifying && (
                <span className="animate-spin border-2 border-white border-t-transparent w-3 h-3 rounded-full shrink-0" />
              )}
              {t("memberPortal.verify.submitBtn")}
              <span className="material-symbols-outlined text-xs">send</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
