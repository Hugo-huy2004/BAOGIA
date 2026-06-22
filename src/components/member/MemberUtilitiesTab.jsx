import React, { lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import SubUtilityHeader from "./SubUtilityHeader";

const MemberUtilitiesDashboard = lazy(() => import("./MemberUtilitiesDashboard"));
const MemberNfcTab = lazy(() => import("./MemberNfcTab"));
const MemberVCardTab = lazy(() => import("./MemberVCardTab"));
const MemberSignatureTab = lazy(() => import("./MemberSignatureTab"));
const MemberSecretLinkTab = lazy(() => import("./MemberSecretLinkTab"));
const MemberFileToolsTab = lazy(() => import("./MemberFileToolsTab"));
const BanhocduongTab = lazy(() => import("./banhocduong/BanhocduongTab"));
const MemberIdeTab = lazy(() => import("./MemberIdeTab"));
const ChessPage = lazy(() => import("../../pages/public/ChessPage"));
const MemberRadioTab = lazy(() => import("./MemberRadioTab"));
const HugoArcadeTab = lazy(() => import("./arcade/HugoArcadeTab"));
const MemberAuraTab = lazy(() => import("./MemberAuraTab"));

export default function MemberUtilitiesTab({ bio, publicLink, showToast, setFormData, handleSave, selectedUtility, onSelectUtility, psychologySubTab, onSelectPsychologySubTab, defaultPsychologyPresetTest, sleepAutoDetect, onBioUpdate }) {
  const { t } = useTranslation();

  // Dynamic API host determination for local dev and hosting domains
  const getApiUrl = () => {
    const envUrl = import.meta.env.VITE_API_URL;
    if (envUrl && envUrl.startsWith("http")) {
      return envUrl;
    }
    if (typeof window !== "undefined") {
      return `${window.location.origin}${envUrl || "/api"}`;
    }
    return "/api";
  };

  const fallback = <div className="flex items-center justify-center py-12 text-slate-400 text-sm">{t("companion.tab.loading", "Đang tải...")}</div>;

  return (
    <div className="space-y-6 animate-fadeIn">
      <Suspense fallback={fallback}>
      {/* Utility Selector Dashboard */}
      {selectedUtility === null && (
        <MemberUtilitiesDashboard setSelectedUtility={onSelectUtility} />
      )}

      {/* NFC Card Tool */}
      {selectedUtility === "nfc" && (
        <div>
          <SubUtilityHeader
            title={t("memberPortal.utilitiesPage.nfc.title")}
            icon="sensors"
            colorClass="text-indigo-500"
            onBack={() => onSelectUtility(null)}
          />
          <MemberNfcTab bio={bio} publicLink={publicLink} showToast={showToast} />
        </div>
      )}

      {/* Smart vCard Tool */}
      {selectedUtility === "vcard" && (
        <MemberVCardTab
          bio={bio}
          showToast={showToast}
          onBack={() => onSelectUtility(null)}
          getApiUrl={getApiUrl}
        />
      )}

      {/* Email Signature Tool */}
      {selectedUtility === "signature" && (
        <MemberSignatureTab
          bio={bio}
          publicLink={publicLink}
          showToast={showToast}
          onBack={() => onSelectUtility(null)}
        />
      )}

      {/* Secret Link Tool */}
      {selectedUtility === "secret_link" && (
        <MemberSecretLinkTab
          bio={bio}
          publicLink={publicLink}
          showToast={showToast}
          onBack={() => onSelectUtility(null)}
          setFormData={setFormData}
          handleSave={handleSave}
        />
      )}

      {/* File Tools */}
      {selectedUtility === "file_tools" && (
        <MemberFileToolsTab
          onBack={() => onSelectUtility(null)}
          showToast={showToast}
          bio={bio}
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

      {/* Chess game */}
      {selectedUtility === "chess" && (
        <ChessPage />
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
      </Suspense>
    </div>
  );
}


