import { lazy, Suspense, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { changeAppLanguage } from "../../i18n/config";
import { psychologyGate } from "../../lib/memberAge";
import { useData } from "../../context/DataContext";
import { TabFallbackSkeleton } from "../ui/SkeletonLayouts";
import { trackOpen } from "./os/appUsage";
import { APP_COMPONENTS, resolveAppId } from "./os/appIndex";
import { FULLSCREEN_APP_IDS } from "../../../shared/appRegistry";
import { useIsMobile } from "../../hooks/useIsMobile";
import BackButton, { CLOSE_BUTTON_EDGE } from "./shared/BackButton";
import LazyBoundary from "./os/LazyBoundary";
import AppLaunchLayer from "./os/AppLaunchLayer";

const MemberUtilitiesDashboard = lazy(() => import("./MemberUtilitiesDashboard"));

export default function MemberUtilitiesTab({ bio, publicLink, showToast, setFormData, handleSave, renderAccountForm, selectedUtility, onSelectUtility, defaultPsychologyPresetTest, sleepAutoDetect, onBioUpdate, appRoute, onAppRouteChange, onOpenParticleModal }) {
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

  useEffect(() => {
    if (selectedUtility === "friends") onSelectUtility(null);
  }, [selectedUtility, onSelectUtility]);

  // Ghi nhật ký "vừa mở" ở đây — chỗ duy nhất mọi đường vào đều đi qua (icon
  // Home, Thư viện, Spotlight, Hugo Store, URL dán tay). Ghi ở từng nút bấm thì
  // thiếu một chỗ là Spotlight xếp sai thứ tự.
  useEffect(() => {
    if (selectedUtility) trackOpen(selectedUtility);
  }, [selectedUtility]);

  const fallback = <TabFallbackSkeleton />;
  const isMobile = useIsMobile();
  // Cùng một nguồn với MemberPortalPage (shared/appRegistry.js). HugoPSY & Bio thêm
  // vào đây vì trên điện thoại nó cũng dựng vỏ toàn màn hình.
  const isFullscreenLikeUtility = selectedUtility === "psychology"
    || (selectedUtility === "bio" && isMobile)
    || FULLSCREEN_APP_IDS.includes(selectedUtility);

  // Chặn ở đây — chỗ app được render — nên mọi đường vào đều bị chặn như nhau:
  // icon ngoài Home, Thư viện, Spotlight, Hugo Store, liên kết dán tay, và cả
  // điều hướng từ `useHealingJourney`. Chặn ở từng chỗ bấm thì thiếu một chỗ là
  // lọt. Thứ tự hai cửa (ngôn ngữ trước tuổi) nằm trong lib/memberAge.js.
  const psyGate = selectedUtility === "psychology"
    ? psychologyGate(i18n.resolvedLanguage || i18n.language, bio)
    : null;

  // Mọi app nạp qua mục lục chung os/appIndex.js; ở đây chỉ còn việc trao
  // props. Phần chung đi cho mọi app, phần riêng theo id.
  const appId = selectedUtility ? resolveAppId(selectedUtility) : null;
  const ActiveApp = appId ? APP_COMPONENTS[appId] : null;
  const close = () => onSelectUtility(null);
  const sharedProps = { bio, showToast, onBack: close, onBioUpdate };
  const routeProps = { route: appRoute, onRouteChange: onAppRouteChange };
  const appProps = {
    // Màn đang mở của HugoKit đọc từ URL (/member/utilities/handle/<toolId>):
    // tải lại trang, back của máy hay dán link đều về đúng công cụ đó.
    handle: { ...sharedProps, ...routeProps, publicLink, setFormData, handleSave },
    psychology: {
      ...sharedProps, route: appRoute || "chat", onRouteChange: onAppRouteChange,
      defaultPresetTest: defaultPsychologyPresetTest, setFormData, handleSave, sleepAutoDetect,
    },
    joy_wallet: { ...sharedProps, publicLink, onOpenParticleModal, onSelectUtility },
    team: sharedProps,
    arcade: sharedProps,
    nom: { onBack: close, ...routeProps },
    aura: { ...sharedProps, ...routeProps },
    bio: { ...sharedProps, ...routeProps, publicLink, renderAccountForm, handleSave },
    store: { ...sharedProps, ...routeProps, onOpenUtility: onSelectUtility },
  }[appId] || sharedProps;

  return (
    <div className={isFullscreenLikeUtility ? "h-full min-h-0 overflow-hidden relative" : "space-y-6 animate-fadeIn relative"}>
      {/* ── Nút Đóng / Thoát Ứng Dụng Chuẩn Hoá Toàn Cục (Top-Right Red X Circle) ── */}
      {selectedUtility !== null && (
        <div
          className="fixed z-[9999] pointer-events-auto"
          style={{
            top: "max(12px, env(safe-area-inset-top, 12px))",
            // Cùng hằng số mà AppFrame dùng để chừa chỗ — xem shared/BackButton.jsx.
            right: `max(${CLOSE_BUTTON_EDGE}px, env(safe-area-inset-right, ${CLOSE_BUTTON_EDGE}px))`,
          }}
        >
          <BackButton
            onClick={() => onSelectUtility(null)}
            label={t("common.close", "Đóng tiện ích")}
            className="shadow-xl ring-2 ring-black/10 dark:ring-white/10"
          />
        </div>
      )}

      <AppLaunchLayer />

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

      {selectedUtility !== null && (
        <LazyBoundary resetKey={selectedUtility} onBack={() => onSelectUtility(null)}>
          {/* HugoPSY chỉ soạn bằng tiếng Việt (kể cả đường dây nóng là số Việt
              Nam) và chỉ dành cho thành viên từ 18 tuổi. Màn "minor" để nguyên
              tiếng Việt là đúng: cổng ngôn ngữ đã lọc trước nó. */}
          {psyGate === "language" && <VietnameseOnlyNotice onBack={close} />}
          {psyGate === "minor" && <AdultOnlyNotice onBack={close} />}
          {ActiveApp && psyGate !== "language" && psyGate !== "minor" && <ActiveApp {...appProps} />}
        </LazyBoundary>
      )}
      </Suspense>

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
