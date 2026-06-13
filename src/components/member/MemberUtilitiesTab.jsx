import React, { useState, useEffect, lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import SubUtilityHeader from "./SubUtilityHeader";

const MemberUtilitiesDashboard = lazy(() => import("./MemberUtilitiesDashboard"));
const MemberNfcTab = lazy(() => import("./MemberNfcTab"));
const MemberVCardTab = lazy(() => import("./MemberVCardTab"));
const MemberSignatureTab = lazy(() => import("./MemberSignatureTab"));
const MemberSecretLinkTab = lazy(() => import("./MemberSecretLinkTab"));
const MemberFileToolsTab = lazy(() => import("./MemberFileToolsTab"));
const BanhocduongTab = lazy(() => import("./banhocduong/BanhocduongTab"));

export default function MemberUtilitiesTab({ bio, publicLink, showToast, setFormData, handleSave, defaultUtility, defaultPsychologySubTab, defaultPsychologyPresetTest }) {
  const { t } = useTranslation();
  const [selectedUtility, setSelectedUtility] = useState(defaultUtility || null); // null, 'nfc', 'vcard', 'signature'

  useEffect(() => {
    if (defaultUtility) {
      setSelectedUtility(defaultUtility);
    }
  }, [defaultUtility]);

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

  const fallback = <div className="flex items-center justify-center py-12 text-slate-400 text-sm">Đang tải...</div>;

  return (
    <div className="space-y-6 animate-fadeIn">
      <Suspense fallback={fallback}>
      {/* Utility Selector Dashboard */}
      {selectedUtility === null && (
        <MemberUtilitiesDashboard setSelectedUtility={setSelectedUtility} />
      )}

      {/* NFC Card Tool */}
      {selectedUtility === "nfc" && (
        <div>
          <SubUtilityHeader 
            title={t("memberPortal.utilitiesPage.nfc.title")} 
            icon="sensors" 
            colorClass="text-indigo-500" 
            onBack={() => setSelectedUtility(null)}
          />
          <MemberNfcTab bio={bio} publicLink={publicLink} showToast={showToast} />
        </div>
      )}

      {/* Smart vCard Tool */}
      {selectedUtility === "vcard" && (
        <MemberVCardTab 
          bio={bio} 
          showToast={showToast} 
          onBack={() => setSelectedUtility(null)} 
          getApiUrl={getApiUrl} 
        />
      )}

      {/* Email Signature Tool */}
      {selectedUtility === "signature" && (
        <MemberSignatureTab 
          bio={bio} 
          publicLink={publicLink} 
          showToast={showToast} 
          onBack={() => setSelectedUtility(null)} 
        />
      )}

      {/* Secret Link Tool */}
      {selectedUtility === "secret_link" && (
        <MemberSecretLinkTab 
          bio={bio} 
          publicLink={publicLink} 
          showToast={showToast} 
          onBack={() => setSelectedUtility(null)} 
          setFormData={setFormData}
          handleSave={handleSave}
        />
      )}

      {/* File Tools */}
      {selectedUtility === "file_tools" && (
        <MemberFileToolsTab 
          onBack={() => setSelectedUtility(null)} 
          showToast={showToast} 
        />
      )}

      {/* Psychology Advisor Tool - Bạn Học Đường */}
      {selectedUtility === "psychology" && (
        <BanhocduongTab 
          onBack={() => setSelectedUtility(null)} 
          defaultSubTab={defaultPsychologySubTab}
          defaultPresetTest={defaultPsychologyPresetTest}
          bio={bio}
          showToast={showToast}
          setFormData={setFormData}
          handleSave={handleSave}
        />
      )}
      </Suspense>
    </div>
  );
}


