import { lazy, Suspense, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { isMinorMember } from "../../lib/memberAge";
import { useData } from "../../context/DataContext";
import { TabFallbackSkeleton } from "../ui/SkeletonLayouts";

const MemberUtilitiesDashboard = lazy(() => import("./MemberUtilitiesDashboard"));
const HugoKitApp = lazy(() => import("./hugoKit/HugoKitApp"));
const BanhocduongTab = lazy(() => import("./banhocduong/BanhocduongTab"));
const HugoTeamTab = lazy(() => import("./HugoTeamTab"));
const MemberRadioTab = lazy(() => import("./MemberRadioTab"));
const HugoArcadeTab = lazy(() => import("./arcade/HugoArcadeTab"));
const MemberAuraTab = lazy(() => import("./MemberAuraTab"));
const MemberInfoVersionTab = lazy(() => import("./MemberInfoVersionTab"));
const BioPreviewTab = lazy(() => import("./BioPreviewTab"));
const HugoStoreTab = lazy(() => import("./hugoStore/HugoStoreTab"));
const StudyWithHugoApp = lazy(() => import("./study/StudyWithHugoApp"));

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
          showToast(t("utilities.upgradeUnavailable"), "info");
        }
        onSelectUtility(null);
      }
    }
  }, [data?.systemSettings?.blockUtilities, selectedUtility, onSelectUtility, showToast, t]);

  const fallback = <TabFallbackSkeleton />;

  const isFullscreenLikeUtility = ["psychology", "study", "ide", "arcade", "store", "hugoso", "handle", "helpdesk"].includes(selectedUtility);

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

      {/* HugoKit — QR/NFC, chữ ký email, link bảo mật và xử lý tệp gộp làm một.
          Id cũ "helpdesk" vẫn mở app này để bookmark và icon đã cài không hỏng. */}
      {["handle", "helpdesk"].includes(selectedUtility) && (
        <HugoKitApp
          bio={bio}
          publicLink={publicLink}
          showToast={showToast}
          onBack={() => onSelectUtility(null)}
          setFormData={setFormData}
          handleSave={handleSave}
        />
      )}

      {/* HugoPSY chỉ dành cho thành viên từ 18 tuổi */}
      {selectedUtility === "psychology" && isMinorMember(bio) && (
        <AdultOnlyNotice onBack={() => onSelectUtility(null)} />
      )}

      {/* Psychology Advisor Tool - HugoPSY */}
      {selectedUtility === "psychology" && !isMinorMember(bio) && (
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

      {/* Study with Hugo — cổng học tập chung. Hai ID cũ vẫn mở đúng nội dung
          để bookmark và liên kết đã chia sẻ không bị hỏng. */}
      {["study", "ide", "hugoso"].includes(selectedUtility) && (
        <StudyWithHugoApp
          onBack={() => onSelectUtility(null)}
          bio={bio}
          showToast={showToast}
          onBioUpdate={onBioUpdate}
          coderLessonId={ideLessonId}
        />
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

      {/* Trang Bio — public bio preview (edit via Settings) */}
      {selectedUtility === "bio" && (
        <BioPreviewTab onBack={() => onSelectUtility(null)} bio={bio} publicLink={publicLink} showToast={showToast} renderAccountForm={renderAccountForm} handleSave={handleSave} />
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

// Vào thẳng bằng URL /member/utilities/psychology thì vẫn gặp màn này; API phía
// sau cũng đã khoá nên đây chỉ là phần giải thích cho người dùng.
function AdultOnlyNotice({ onBack }) {
  return (
    <div className="mx-auto max-w-md px-4 py-14 text-center">
      <span className="material-symbols-outlined text-[56px] text-muted-foreground" aria-hidden="true">shield_person</span>
      <p className="mt-4 text-lg font-black text-foreground">HugoPSY dành cho thành viên từ 18 tuổi</p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Nội dung sức khoẻ tinh thần cần người trưởng thành tự chịu trách nhiệm với lựa chọn của mình.
        Nếu bạn đang cần giúp đỡ, hãy nói với cha mẹ, người giám hộ, thầy cô hoặc gọi tổng đài
        bảo vệ trẻ em <a href="tel:111" className="font-bold text-foreground underline">111</a> (miễn phí, 24/7).
      </p>
      <button
        type="button"
        onClick={onBack}
        className="mt-6 min-h-11 rounded-full border border-border px-5 text-sm font-bold text-foreground transition-colors hover:bg-muted"
      >
        Quay lại
      </button>
    </div>
  );
}
