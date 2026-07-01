import React, { lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";

const MemberUtilitiesDashboard = lazy(() => import("./MemberUtilitiesDashboard"));
const HugoHelpdeskTab = lazy(() => import("./HugoHelpdeskTab"));
const HugoHandleTab = lazy(() => import("./HugoHandleTab"));
const BanhocduongTab = lazy(() => import("./banhocduong/BanhocduongTab"));
const MemberIdeTab = lazy(() => import("./MemberIdeTab"));
const MemberRadioTab = lazy(() => import("./MemberRadioTab"));
const HugoArcadeTab = lazy(() => import("./arcade/HugoArcadeTab"));
const MemberAuraTab = lazy(() => import("./MemberAuraTab"));
const MemberInfoVersionTab = lazy(() => import("./MemberInfoVersionTab"));

export default function MemberUtilitiesTab({ bio, publicLink, showToast, setFormData, handleSave, selectedUtility, onSelectUtility, psychologySubTab, onSelectPsychologySubTab, defaultPsychologyPresetTest, sleepAutoDetect, onBioUpdate }) {
  const { t } = useTranslation();

  const fallback = <div className="flex items-center justify-center py-12 text-slate-400 text-sm">{t("companion.tab.loading", "Đang tải...")}</div>;

  const isFullscreenLikeUtility = selectedUtility === "psychology" || selectedUtility === "ide" || selectedUtility === "arcade";

  return (
    <div className={isFullscreenLikeUtility ? "h-full min-h-0 overflow-hidden" : "space-y-6 animate-fadeIn"}>
      <Suspense fallback={fallback}>
      {/* Utility Selector Dashboard */}
      {selectedUtility === null && (
        <MemberUtilitiesDashboard setSelectedUtility={onSelectUtility} showToast={showToast} />
      )}

      {/* HugoHelpdesk — QR/NFC + Email Signature merged */}
      {selectedUtility === "helpdesk" && (
        <HugoHelpdeskTab
          bio={bio}
          publicLink={publicLink}
          showToast={showToast}
          onBack={() => onSelectUtility(null)}
        />
      )}

      {/* HugoHandle — Secret Link + File Tools merged */}
      {selectedUtility === "handle" && (
        <HugoHandleTab
          bio={bio}
          publicLink={publicLink}
          showToast={showToast}
          onBack={() => onSelectUtility(null)}
          setFormData={setFormData}
          handleSave={handleSave}
        />
      )}

      {/* Psychology Advisor Tool - HugoPSY */}
      {selectedUtility === "psychology" && (
        <BanhocduongTab
          onBack={() => onSelectUtility(null)}
          activeSubTab={psychologySubTab}
          onSubTabChange={onSelectPsychologySubTab}
          defaultPresetTest={defaultPsychologyPresetTest}
          bio={bio}
          showToast={showToast}
          setFormData={setFormData}
          handleSave={handleSave}
          sleepAutoDetect={sleepAutoDetect}
        />
      )}

      {/* Web IDE Tool */}
      {selectedUtility === "ide" && (
        <MemberIdeTab onBack={() => onSelectUtility(null)} bio={bio} showToast={showToast} onBioUpdate={onBioUpdate} />
      )}

      {/* HugoRadio */}
      {selectedUtility === "radio" && (
        <MemberRadioTab onBack={() => onSelectUtility(null)} showToast={showToast} bio={bio} onBioUpdate={onBioUpdate} />
      )}

      {/* HugoArcade */}
      {selectedUtility === "arcade" && (
        <HugoArcadeTab onBack={() => onSelectUtility(null)} bio={bio} showToast={showToast} onBioUpdate={onBioUpdate} />
      )}

      {/* HugoAura Focus */}
      {selectedUtility === "aura" && (
        <MemberAuraTab onBack={() => onSelectUtility(null)} bio={bio} showToast={showToast} onBioUpdate={onBioUpdate} />
      )}

      {/* Info & Version */}
      {selectedUtility === "info" && (
        <MemberInfoVersionTab onBack={() => onSelectUtility(null)} bio={bio} showToast={showToast} onBioUpdate={onBioUpdate} />
      )}
      </Suspense>
    </div>
  );
}

