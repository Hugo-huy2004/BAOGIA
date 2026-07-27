import React, { lazy, Suspense, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useData } from "../../context/DataContext";
import { TabFallbackSkeleton } from "../ui/SkeletonLayouts";
import SubUtilityHeader from "./SubUtilityHeader";

const MemberUtilitiesDashboard = lazy(() => import("./MemberUtilitiesDashboard"));
const HugoHelpdeskTab = lazy(() => import("./HugoHelpdeskTab"));
const HugoHandleTab = lazy(() => import("./HugoHandleTab"));
const BanhocduongTab = lazy(() => import("./banhocduong/BanhocduongTab"));
const HugoCoderHub = lazy(() => import("./hugoCoder/HugoCoderHub"));
const HugoTeamTab = lazy(() => import("./HugoTeamTab"));
const MemberRadioTab = lazy(() => import("./MemberRadioTab"));
const HugoArcadeTab = lazy(() => import("./arcade/HugoArcadeTab"));
const MemberAuraTab = lazy(() => import("./MemberAuraTab"));
const MemberInfoVersionTab = lazy(() => import("./MemberInfoVersionTab"));
const DecoStudioTab = lazy(() => import("./DecoStudioTab"));
const BioPreviewTab = lazy(() => import("./BioPreviewTab"));
const HugoSkinTab = lazy(() => import("./HugoSkinTab"));
const MemberJoyTab = lazy(() => import("./MemberJoyTab"));
const HugoStoreTab = lazy(() => import("./hugoStore/HugoStoreTab"));

export default function MemberUtilitiesTab({ bio, publicLink, showToast, setFormData, handleSave, renderAccountForm, selectedUtility, onSelectUtility, psychologySubTab, onSelectPsychologySubTab, defaultPsychologyPresetTest, sleepAutoDetect, onBioUpdate, ideLessonId }) {
  const { t } = useTranslation();
  const { data } = useData();

  useEffect(() => {
    if (selectedUtility && data?.systemSettings?.blockUtilities && window.location.hostname === "hugowishpax.studio") {
      const isBlocked = typeof data.systemSettings.blockUtilities === "boolean" 
        ? data.systemSettings.blockUtilities 
        : data.systemSettings.blockUtilities === selectedUtility;

      if (isBlocked) {
        if (showToast) {
          showToast("Hugo... đang được hệ thống tiến hành nâng cấp lên phiên bản mới nhất, hẹn gặp bạn sau 24 tiếng", "info");
        }
        onSelectUtility(null);
      }
    }
  }, [data?.systemSettings?.blockUtilities, selectedUtility, onSelectUtility, showToast]);

  const fallback = <TabFallbackSkeleton />;

  const isFullscreenLikeUtility = selectedUtility === "psychology" || selectedUtility === "ide" || selectedUtility === "arcade" || selectedUtility === "deco" || selectedUtility === "store";

  return (
    <div className={isFullscreenLikeUtility ? "h-full min-h-0 overflow-hidden" : "space-y-6 animate-fadeIn"}>
      <Suspense fallback={fallback}>
      {/* Utility Selector Dashboard — always mounted so event listeners & state persist */}
      <div style={{ display: selectedUtility === null ? "block" : "none" }}>
        <MemberUtilitiesDashboard
          bio={bio}
          onBioUpdate={onBioUpdate}
          setSelectedUtility={onSelectUtility}
          showToast={showToast}
          initialTab="my-apps"
          isVisible={selectedUtility === null}
        />
      </div>

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
        <HugoCoderHub onBack={() => onSelectUtility(null)} bio={bio} showToast={showToast} onBioUpdate={onBioUpdate} urlLessonId={ideLessonId} />
      )}

      {/* Hugo Team — Recruitment */}
      {selectedUtility === "team" && (
        <HugoTeamTab onBack={() => onSelectUtility(null)} />
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

      {/* Deco Studio */}
      {selectedUtility === "deco" && (
        <DecoStudioTab onBack={() => onSelectUtility(null)} bio={bio} showToast={showToast} onBioUpdate={onBioUpdate} />
      )}

      {/* Trang Bio — public bio preview (edit via Settings) */}
      {selectedUtility === "bio" && (
        <BioPreviewTab onBack={() => onSelectUtility(null)} bio={bio} publicLink={publicLink} showToast={showToast} renderAccountForm={renderAccountForm} handleSave={handleSave} />
      )}

      {/* HugoSkin */}
      {selectedUtility === "hugoskin" && (
        <div className="text-left">
          <SubUtilityHeader title="HugoSkin" icon="face" colorClass="text-slate-500" onBack={() => onSelectUtility(null)} appId="hugoskin" />
          <HugoSkinTab />
        </div>
      )}

      {/* Ví JOY Wallet */}
      {selectedUtility === "joy_wallet" && (
        <div className="text-left">
          {/* Ví JOY tự dựng phần đỉnh: thẻ JOY đã là tiêu đề, thêm thanh header
              nữa thành hai lớp chrome chồng nhau. */}
          <MemberJoyTab bio={bio} showToast={showToast} publicLink={publicLink} onBack={() => onSelectUtility(null)} />
        </div>
      )}

      {/* Hugo Store */}
      {selectedUtility === "store" && (
        <HugoStoreTab
          bio={bio}
          showToast={showToast}
          onBioUpdate={onBioUpdate}
          onBack={() => onSelectUtility(null)}
          onOpenUtility={onSelectUtility}
        />
      )}
      </Suspense>

    </div>
  );
}
