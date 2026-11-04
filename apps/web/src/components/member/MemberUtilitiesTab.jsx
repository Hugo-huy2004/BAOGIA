import { lazy, Suspense, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useData } from "../../context/DataContext";
import { TabFallbackSkeleton } from "../ui/SkeletonLayouts";
import { trackOpen } from "./os/appUsage";
import { APP_COMPONENTS, resolveAppId } from "./os/appIndex";
import { FULLSCREEN_APP_IDS } from "../../../../../packages/shared/appRegistry";
import { useIsMobile } from "../../hooks/useIsMobile";
import BackButton, { CLOSE_BUTTON_EDGE } from "./shared/BackButton";
import LazyBoundary from "./os/LazyBoundary";
import AppLaunchLayer from "./os/AppLaunchLayer";

const MemberUtilitiesDashboard = lazy(() => import("./MemberUtilitiesDashboard"));

export default function MemberUtilitiesTab({ bio, publicLink, showToast, setFormData, handleSave, renderAccountForm, selectedUtility, onSelectUtility, onBioUpdate, appRoute, onAppRouteChange, onOpenParticleModal }) {
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
  // Cùng một nguồn với MemberPortalPage (packages/shared/appRegistry.js). Bio thêm
  // vào đây vì trên điện thoại nó cũng dựng vỏ toàn màn hình.
  const isFullscreenLikeUtility = (selectedUtility === "bio" && isMobile)
    || FULLSCREEN_APP_IDS.includes(selectedUtility);

  // Mọi app nạp qua mục lục chung os/appIndex.js; ở đây chỉ còn việc trao
  // props. Phần chung đi cho mọi app, phần riêng theo id.
  const appId = selectedUtility ? resolveAppId(selectedUtility) : null;
  const ActiveApp = appId ? APP_COMPONENTS[appId] : null;
  const close = () => onSelectUtility(null);
  const sharedProps = { bio, showToast, onBack: close, onBioUpdate };
  const routeProps = { route: appRoute, onRouteChange: onAppRouteChange };
  const appProps = {
    joy_wallet: { ...sharedProps, publicLink, onOpenParticleModal, onSelectUtility },
    arcade: sharedProps,
    qrhugo: { ...sharedProps, ...routeProps },
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
          {ActiveApp && <ActiveApp {...appProps} />}
        </LazyBoundary>
      )}
      </Suspense>

    </div>
  );
}
