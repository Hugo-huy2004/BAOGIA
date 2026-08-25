import { lazy, Suspense, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { changeAppLanguage } from "../../i18n/config";
import { psychologyGate } from "../../lib/memberAge";
import { useData } from "../../context/DataContext";
import { TabFallbackSkeleton } from "../ui/SkeletonLayouts";
import { trackOpen } from "./os/appUsage";
import { FULLSCREEN_APP_IDS } from "../../../shared/appRegistry";
import { readInstalledApps } from "../../hooks/useAppInstall";

const MemberUtilitiesDashboard = lazy(() => import("./MemberUtilitiesDashboard"));
const HugoKitApp = lazy(() => import("./hugoKit/HugoKitApp"));
const BanhocduongTab = lazy(() => import("./banhocduong/BanhocduongTab"));
const HugoTeamTab = lazy(() => import("./HugoTeamTab"));
const HugoProfileTab = lazy(() => import("./HugoProfileTab"));
const MemberRadioTab = lazy(() => import("./MemberRadioTab"));
const HugoArcadeTab = lazy(() => import("./arcade/HugoArcadeTab"));
const MemberAuraTab = lazy(() => import("./MemberAuraTab"));
const MemberInfoVersionTab = lazy(() => import("./MemberInfoVersionTab"));
const BioPreviewTab = lazy(() => import("./BioPreviewTab"));
const HugoStoreTab = lazy(() => import("./hugoStore/HugoStoreTab"));
const StudyWithHugoApp = lazy(() => import("./study/StudyWithHugoApp"));
const HugoWalletApp = lazy(() => import("./wallet/HugoWalletApp"));
const HugoCinemaTab = lazy(() => import("./cinema/HugoCinemaTab"));
const HugoInvestTab = lazy(() => import("./invest/HugoInvestTab"));
const SupportCenterApp = lazy(() => import("./support/SupportCenterApp"));
const FriendsApp = lazy(() => import("./FriendsApp"));

export default function MemberUtilitiesTab({ bio, publicLink, showToast, setFormData, handleSave, renderAccountForm, selectedUtility, onSelectUtility, psychologySubTab, onSelectPsychologySubTab, radioPage, onSelectRadioPage, defaultPsychologyPresetTest, sleepAutoDetect, onBioUpdate, studyRoute, studySub, onOpenParticleModal }) {
  const { t, i18n } = useTranslation();
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

  // Ghi nhật ký "vừa mở" ở đây — chỗ duy nhất mọi đường vào đều đi qua (icon
  // Home, Thư viện, Spotlight, Hugo Store, URL dán tay). Ghi ở từng nút bấm thì
  // thiếu một chỗ là Spotlight xếp sai thứ tự.
  useEffect(() => {
    if (selectedUtility) trackOpen(selectedUtility);
  }, [selectedUtility]);

  const fallback = <TabFallbackSkeleton />;
  const friendsInstalled = readInstalledApps(bio).includes("friends");

  // Cùng một nguồn với MemberPortalPage (shared/appRegistry.js). HugoPSY thêm
  // vào đây vì trên điện thoại nó cũng dựng vỏ toàn màn hình.
  const isFullscreenLikeUtility = selectedUtility === "psychology"
    || FULLSCREEN_APP_IDS.includes(selectedUtility);

  // Chặn ở đây — chỗ app được render — nên mọi đường vào đều bị chặn như nhau:
  // icon ngoài Home, Thư viện, Spotlight, Hugo Store, liên kết dán tay, và cả
  // điều hướng từ `useHealingJourney`. Chặn ở từng chỗ bấm thì thiếu một chỗ là
  // lọt. Thứ tự hai cửa (ngôn ngữ trước tuổi) nằm trong lib/memberAge.js.
  const psyGate = selectedUtility === "psychology"
    ? psychologyGate(i18n.resolvedLanguage || i18n.language, bio)
    : null;

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

      {/* HugoPSY chỉ soạn bằng tiếng Việt (kể cả đường dây nóng là số Việt Nam) */}
      {psyGate === "language" && (
        <VietnameseOnlyNotice onBack={() => onSelectUtility(null)} />
      )}

      {/* HugoPSY chỉ dành cho thành viên từ 18 tuổi. Màn này để nguyên tiếng
          Việt là đúng: cổng ngôn ngữ ở trên đã lọc trước nó. */}
      {psyGate === "minor" && (
        <AdultOnlyNotice onBack={() => onSelectUtility(null)} />
      )}

      {/* Psychology Advisor Tool - HugoPSY */}
      {psyGate === "open" && (
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

      {/* Ví JOY — ứng dụng riêng, toàn màn hình. Mọi panel bên trong là component
          dùng chung với trang Tài khoản, nên không có hai bản ví trôi lệch nhau. */}
      {selectedUtility === "joy_wallet" && (
        <HugoWalletApp
          bio={bio}
          publicLink={publicLink}
          onBack={() => onSelectUtility(null)}
          showToast={showToast}
          onBioUpdate={onBioUpdate}
          onOpenParticleModal={onOpenParticleModal}
          onSelectUtility={onSelectUtility}
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
          studyRoute={studyRoute}
          studySub={studySub}
        />
      )}

      {/* Hugo Profile — hồ sơ năng lực có kiểm chứng, gắn vào trang Bio */}
      {selectedUtility === "profile" && (
        <HugoProfileTab onBack={() => onSelectUtility(null)} publicLink={publicLink} />
      )}

      {selectedUtility === "friends" && friendsInstalled && (
        <FriendsApp onBack={() => onSelectUtility(null)} />
      )}

      {selectedUtility === "friends" && !friendsInstalled && (
        <FriendsInstallNotice
          onBack={() => onSelectUtility(null)}
          onOpenStore={() => onSelectUtility("store")}
        />
      )}

      {/* Hugo Team — Recruitment */}
      {selectedUtility === "team" && (
        <HugoTeamTab onBack={() => onSelectUtility(null)} />
      )}

      {/* HugoRadio */}
      {selectedUtility === "radio" && (
        <MemberRadioTab
          onBack={() => onSelectUtility(null)}
          showToast={showToast}
          bio={bio}
          onBioUpdate={onBioUpdate}
          activePage={radioPage || "home"}
          onPageChange={onSelectRadioPage}
        />
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

      {/* Sàn chứng khoán ảo — học đầu tư bằng JOY */}
      {selectedUtility === "invest" && (
        <HugoInvestTab
          onBack={() => onSelectUtility(null)}
          showToast={showToast}
          onSelectUtility={onSelectUtility}
        />
      )}

      {/* Hugo Cinema */}
      {selectedUtility === "cinema" && (
        <HugoCinemaTab
          onBack={() => onSelectUtility(null)}
          bio={bio}
          showToast={showToast}
        />
      )}

      {/* Trung Tâm Hỗ Trợ — hướng dẫn viết sẵn và yêu cầu gửi thẳng cho quản
          trị viên. Id cũ "helpdesk" KHÔNG vào đây: nó đã sáp nhập vào HugoKit ở
          trên, và khi cả hai nhánh cùng nhận "helpdesk" thì hai app dựng chồng
          lên nhau trong cùng một màn. */}
      {selectedUtility === "supporter" && (
        <SupportCenterApp
          bio={bio}
          onClose={() => onSelectUtility(null)}
        />
      )}
      </Suspense>

    </div>
  );
}

function FriendsInstallNotice({ onBack, onOpenStore }) {
  const { t } = useTranslation();
  return (
    <div className="mx-auto grid min-h-[60dvh] max-w-md place-items-center px-4 py-12 text-center">
      <div>
        <span className="material-symbols-outlined text-[56px] text-primary" aria-hidden="true">download_for_offline</span>
        <h1 className="mt-4 text-xl font-black text-foreground">{t("friends.installRequiredTitle")}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("friends.installRequiredBody")}</p>
        <div className="mt-6 flex justify-center gap-2">
          <button type="button" onClick={onBack} className="min-h-11 rounded-xl border border-border px-4 text-sm font-bold text-foreground hover:bg-muted">{t("friends.back")}</button>
          <button type="button" onClick={onOpenStore} className="min-h-11 rounded-xl bg-foreground px-4 text-sm font-black text-background hover:opacity-90">{t("friends.openStore")}</button>
        </div>
      </div>
    </div>
  );
}

// Vào thẳng bằng URL /member/utilities/psychology thì vẫn gặp màn này; API phía
// sau cũng đã khoá nên đây chỉ là phần giải thích cho người dùng.
function VietnameseOnlyNotice({ onBack }) {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-md px-4 py-14 text-center">
      <span className="material-symbols-outlined text-[56px] text-muted-foreground" aria-hidden="true">translate</span>
      <p className="mt-4 text-lg font-black text-foreground">{t("hugoPsy.vietnameseOnly.title")}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("hugoPsy.vietnameseOnly.body")}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => changeAppLanguage("vi")}
          className="min-h-11 rounded-full bg-foreground px-5 text-sm font-bold text-background transition-opacity hover:opacity-90"
        >
          {t("hugoPsy.vietnameseOnly.switchToVi")}
        </button>
        <button
          type="button"
          onClick={onBack}
          className="min-h-11 rounded-full border border-border px-5 text-sm font-bold text-foreground transition-colors hover:bg-muted"
        >
          {t("hugoPsy.vietnameseOnly.back")}
        </button>
      </div>
    </div>
  );
}

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
