import React, { useState, lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import SubUtilityHeader from "./SubUtilityHeader";

const MemberNfcTab = lazy(() => import("./MemberNfcTab"));
const MemberSignatureTab = lazy(() => import("./MemberSignatureTab"));

// HugoHelpdesk merges what's left of NFC/QR card setup and Email Signature
// into one cohesive panel — a single pill-switcher swaps the content inline
// instead of stacking both tools as separate disjointed cards, or making the
// member navigate through a tool-picker step.
// HugoVCard was removed outright: MemberNfcTab's QR generator already has a
// "vcard" data type that covers the same save-to-contacts use case.
const SECTIONS = [
  { id: "qr", icon: "qr_code_2", label: "Mã QR & NFC" },
  { id: "signature", icon: "signature", label: "Chữ ký Email" },
];

export default function HugoHelpdeskTab({ bio, publicLink, showToast, onBack }) {
  const { t } = useTranslation();
  const [section, setSection] = useState("qr");
  const fallback = <div className="flex items-center justify-center py-12 text-slate-400 text-sm">{t("companion.tab.loading", "Đang tải...")}</div>;

  return (
    <div className="animate-fadeIn max-w-4xl mx-auto bg-white dark:bg-background rounded-[2rem] border border-zinc-200/50 dark:border-zinc-800/60 shadow-sm p-6 lg:p-8 space-y-6">
      <SubUtilityHeader title="HugoHelpdesk" icon="support_agent" colorClass="text-indigo-500" onBack={onBack} />

      <div className="flex bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-md gap-1">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[6px] text-[11px] font-bold uppercase tracking-wider transition-all active:scale-[0.98] ${
              section === s.id
                ? "bg-white dark:bg-zinc-900 shadow-sm text-indigo-600 dark:text-indigo-400"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">{s.icon}</span>
            {s.label}
          </button>
        ))}
      </div>

      <Suspense fallback={fallback}>
        {section === "qr" && <MemberNfcTab bio={bio} publicLink={publicLink} showToast={showToast} />}
        {section === "signature" && <MemberSignatureTab bio={bio} publicLink={publicLink} showToast={showToast} />}
      </Suspense>
    </div>
  );
}
