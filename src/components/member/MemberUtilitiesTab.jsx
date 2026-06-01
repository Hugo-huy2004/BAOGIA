import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import MemberNfcTab from "./MemberNfcTab";
import MemberUtilitiesDashboard from "./MemberUtilitiesDashboard";
import MemberVCardTab from "./MemberVCardTab";
import MemberSignatureTab from "./MemberSignatureTab";
import SubUtilityHeader from "./SubUtilityHeader";

export default function MemberUtilitiesTab({ bio, publicLink, showToast }) {
  const { t } = useTranslation();
  const [selectedUtility, setSelectedUtility] = useState(null); // null, 'nfc', 'vcard', 'signature'

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

  return (
    <div className="space-y-6 animate-fadeIn">
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
    </div>
  );
}


