import React, { useState, lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import SubUtilityHeader from "./SubUtilityHeader";

const MemberSecretLinkTab = lazy(() => import("./MemberSecretLinkTab"));
const MemberFileToolsTab = lazy(() => import("./MemberFileToolsTab"));

// HugoHandle merges the old HugoOcculta (secret/password-protected links) and
// HugoTractare (file format conversion & compression) utilities into one
// cohesive panel — a single pill-switcher swaps the content inline instead of
// stacking both tools as separate disjointed cards.
const SECTIONS = [
  { id: "secret_link", icon: "lock", label: "Link Bảo Mật" },
  { id: "file_tools", icon: "folder_zip", label: "Đổi Định Dạng & Nén" },
];

export default function HugoHandleTab({ bio, publicLink, showToast, onBack, setFormData, handleSave }) {
  const { t } = useTranslation();
  const [section, setSection] = useState("secret_link");
  const fallback = <div className="flex items-center justify-center py-12 text-slate-400 text-sm">{t("companion.tab.loading", "Đang tải...")}</div>;

  return (
    <div className="animate-fadeIn max-w-4xl mx-auto bg-white dark:bg-background rounded-[2rem] border border-zinc-200/50 dark:border-zinc-800/60 shadow-sm p-6 lg:p-8 space-y-6">
      <SubUtilityHeader title="HugoHandle" icon="handyman" colorClass="text-rose-500" onBack={onBack} />

      <div className="flex bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-md gap-1">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[6px] text-[11px] font-bold uppercase tracking-wider transition-all active:scale-[0.98] ${
              section === s.id
                ? "bg-white dark:bg-zinc-900 shadow-sm text-rose-600 dark:text-rose-400"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">{s.icon}</span>
            {s.label}
          </button>
        ))}
      </div>

      <Suspense fallback={fallback}>
        {section === "secret_link" && <MemberSecretLinkTab bio={bio} publicLink={publicLink} showToast={showToast} setFormData={setFormData} handleSave={handleSave} />}
        {section === "file_tools" && <MemberFileToolsTab showToast={showToast} bio={bio} />}
      </Suspense>
    </div>
  );
}
