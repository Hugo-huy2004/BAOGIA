import { useState } from "react";
import { useTranslation } from "react-i18next";
import ThemeGallery from "../ThemeGallery";
import AuraReceiptModal from "../AuraReceiptModal";
import {
  AURA_THEMES,
  auraThemeTranslationKey,
  resolveActivePortalTheme,
} from "../../../data/auraThemes";
import { useJoyStore } from "../../../stores/joyStore";
import { rentPortalTheme, setPortalTheme } from "../../../services/portalThemeApi";
import {
  clearPendingPortalThemeSync,
  setPendingPortalThemeSync,
  setPortalThemePreference,
} from "../../../utils/portalThemePreference";

export default function AccountThemeSheet({ bio, showToast, onBioUpdate }) {
  const { t } = useTranslation();
  const setBalance = useJoyStore((state) => state.setBalance);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const activeThemeId = resolveActivePortalTheme(bio);
  const themeSubject = bio?._id || bio?.email;
  const remoteThemeApiSupported = bio?.__portalThemeApiSupported === true;

  const applyLocalTheme = (themeId) => {
    setPortalThemePreference(themeSubject, themeId);
    onBioUpdate?.({ activePortalTheme: themeId, activeAuraTheme: themeId });
  };

  const isThemeOwned = (themeId) => {
    const theme = AURA_THEMES.find((item) => item.id === themeId);
    if (theme?.free) return true;
    const record = bio?.rentedThemes?.find((item) => item.themeId === themeId);
    return Boolean(record && new Date(record.expiresAt).getTime() > Date.now());
  };

  const getExpiryText = (themeId) => {
    const theme = AURA_THEMES.find((item) => item.id === themeId);
    if (theme?.free) return "";
    const record = bio?.rentedThemes?.find((item) => item.themeId === themeId);
    if (!record) return "";
    const msLeft = new Date(record.expiresAt).getTime() - Date.now();
    if (msLeft <= 0) return "";
    const hours = Math.floor(msLeft / 3_600_000);
    const minutes = Math.floor((msLeft % 3_600_000) / 60_000);
    return hours > 0
      ? t("aura.remainingHoursMinutes", { hours, minutes })
      : t("aura.remainingMinutes", { minutes });
  };

  const applyTheme = async (themeId) => {
    if (!bio?.email) return;
    // Theme is cosmetic and remains usable with an older API deployment. The
    // server is only called after bootstrap explicitly advertises the new
    // activePortalTheme field, preventing the legacy endpoint's 400 loop.
    applyLocalTheme(themeId);
    if (!remoteThemeApiSupported) {
      showToast?.(t("aura.toastSelectSuccess", {
        name: t(auraThemeTranslationKey(themeId, "Name")),
      }), "success");
      return true;
    }
    const result = await setPortalTheme(themeId);
    if (!result.ok) {
      // Theme selection is cosmetic. Keep the member-scoped local choice and
      // queue it for later sync instead of reverting or rejecting the click.
      setPendingPortalThemeSync(themeSubject, themeId);
      showToast?.(t("aura.toastSavedLocally"), "success");
      return true;
    }
    clearPendingPortalThemeSync(themeSubject);
    onBioUpdate?.(result.data.bio || { activePortalTheme: themeId, activeAuraTheme: themeId });
    showToast?.(t("aura.toastSelectSuccess", {
      name: t(auraThemeTranslationKey(themeId, "Name")),
    }), "success");
    return true;
  };

  const rentTheme = async (themeId, duration = "day") => {
    const previousThemeId = resolveActivePortalTheme(bio);
    setProcessing(true);
    applyLocalTheme(themeId);
    try {
      const result = await rentPortalTheme(themeId, duration);
      const data = result.data;
      if (!result.ok) {
        applyLocalTheme(previousThemeId);
        showToast?.(
          data.error || (result.networkUnavailable ? t("aura.toastNetworkError") : t("aura.toastRentFailed")),
          "error",
        );
        setProcessing(false);
        return;
      }
      setSuccess(true);
      applyLocalTheme(themeId);
      onBioUpdate?.(data.bio || { activePortalTheme: themeId, activeAuraTheme: themeId });
      if (Number.isFinite(Number(data.balance))) setBalance(Number(data.balance));
      showToast?.(t("aura.toastRentSuccess", {
        name: t(auraThemeTranslationKey(themeId, "Name")),
      }), "success");
      window.setTimeout(() => {
        setProcessing(false);
        setSuccess(false);
        setSelectedTheme(null);
      }, 1800);
    } catch {
      applyLocalTheme(previousThemeId);
      showToast?.(t("aura.toastNetworkError"), "error");
      setProcessing(false);
    }
  };

  return (
    <>
      <ThemeGallery
        activeThemeId={activeThemeId}
        isThemeOwned={isThemeOwned}
        getExpiryText={getExpiryText}
        onApply={applyTheme}
        onRent={setSelectedTheme}
      />
      <AuraReceiptModal
        isOpen={Boolean(selectedTheme)}
        theme={selectedTheme}
        isProcessing={processing}
        isSuccess={success}
        onConfirm={rentTheme}
        onCancel={() => !processing && !success && setSelectedTheme(null)}
      />
    </>
  );
}
