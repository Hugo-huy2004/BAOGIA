import { useState, useMemo, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { isMinorMember, ADULT_ONLY_APPS } from "../../lib/memberAge";
import { useNavigate } from "react-router-dom";
import { useData } from "../../context/DataContext";
import memberService from "../../services/classes/MemberService";

// Import modular sub-components
import WidgetRenderer from "./utilities/WidgetRenderer";
import AppIconRenderer from "./utilities/AppIconRenderer";
import LibraryCatalog from "./utilities/LibraryCatalog";
import StandaloneGameShell from "./arcade/StandaloneGameShell";
import { appInstallationPolicy } from "../../../shared/appInstallationPolicy";
import {
  INSTALLED_APPS_KEY,
  HOME_SCREEN_APPS_KEY,
  readStoredList,
  readDownloadedGameAppIds,
  commitInstall,
  commitUninstall,
} from "../../hooks/useAppInstall";
import { Search, X } from "lucide-react";
import UtilityAppIcon from "./utilities/UtilityAppIcon";
import {
  APP_CATALOG_MANIFESTS,
  APP_DESTINATIONS,
  APP_GRADIENTS as GRADIENTS,
  getAppStorageMb,
} from "../../../shared/appRegistry";
import { openDestination } from "./os/appIntent";
import { appOpenOrder } from "./os/appUsage";

const DEFAULT_INSTALLED = appInstallationPolicy.normalizeInstalled();

// Khoá cài đặt và cách ghi chúng nằm ở src/hooks/useAppInstall.js — Thư viện,
// Arcade và Chợ dùng chung một bản.
const UTILITY_SIZES_KEY = "hugo_utility_sizes";
const USER_WIDGET_SIZES = new Set(["medium", "large"]);

const readStoredObject = (key) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
};

// Small is the implicit default. Only explicit widget choices are persisted,
// keeping newly installed apps small and preventing invalid legacy values from
// unexpectedly turning an icon into a widget.
const normalizeUtilitySizes = (sizes = {}) => Object.fromEntries(
  Object.entries(sizes).filter(([, size]) => USER_WIDGET_SIZES.has(size)),
);

export default function MemberUtilitiesDashboard({ bio, onBioUpdate, setSelectedUtility, showToast, initialTab = "my-apps", isVisible = true }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data } = useData();

  // Navigation & Search States
  const [activeTab, setActiveTab] = useState(initialTab);
  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);



  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [isEditMode, setIsEditMode] = useState(false);

  // Thành viên dưới 18 không thấy app 18+ trong danh mục (server vẫn là chốt chặn).
  const minor = isMinorMember(bio);
  const allUtilities = useMemo(
    () => APP_CATALOG_MANIFESTS.filter(({ id }) => !(minor && ADULT_ONLY_APPS.has(id))).map((app) => ({
      ...app,
      badge: t(`utilities.badges.${app.badge}`),
      title: t(`utilities.catalog.${app.id}.title`, app.id),
      subLabel: t(`utilities.catalog.${app.id}.description`, ''),
    })),
    [t, minor],
  );

  // App Ecosystem States
  const [installedApps, setInstalledApps] = useState(() => {
    const fromBio = Array.isArray(bio?.installedUtilities) ? bio.installedUtilities : [];
    return appInstallationPolicy.normalizeInstalled([
      ...DEFAULT_INSTALLED,
      ...fromBio,
      ...readStoredList(INSTALLED_APPS_KEY),
      ...readDownloadedGameAppIds(),
    ]);
  });

  const [utilitySizes, setUtilitySizes] = useState(() => {
    const fromBio = bio?.utilitySizes && typeof bio.utilitySizes === "object"
      ? bio.utilitySizes
      : {};
    return normalizeUtilitySizes({
      ...fromBio,
      ...readStoredObject(UTILITY_SIZES_KEY),
    });
  });

  useEffect(() => {
    if (bio && bio.utilitySizes && typeof bio.utilitySizes === "object") {
      const nextSizes = normalizeUtilitySizes({
        ...bio.utilitySizes,
        ...readStoredObject(UTILITY_SIZES_KEY),
      });
      setUtilitySizes(nextSizes);
      localStorage.setItem(UTILITY_SIZES_KEY, JSON.stringify(nextSizes));
    }
  }, [bio]);

  // Subset of installedApps that also gets a home-screen icon.
  const [homeScreenApps, setHomeScreenApps] = useState(() => {
    const fromBio = Array.isArray(bio?.homeScreenUtilities) ? bio.homeScreenUtilities : [];
    const fromDevice = readStoredList(HOME_SCREEN_APPS_KEY);
    const downloadedGames = readDownloadedGameAppIds();
    const requestedHome = fromBio.length || fromDevice.length
      ? [...fromBio, ...fromDevice, ...downloadedGames]
      : [...installedApps, ...downloadedGames];
    return appInstallationPolicy.normalizeHomeScreen(requestedHome, installedApps);
  });

  const [downloadingAppId, setDownloadingAppId] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState({});
  const [editingApp, setEditingApp] = useState(null);

  // Advanced UI States
  const [flyingApp, setFlyingApp] = useState(null);
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
  const [spotlightQuery, setSpotlightQuery] = useState("");
  const [spotlightSelectedIndex, setSpotlightSelectedIndex] = useState(0);

  useEffect(() => {
    const handleSpotlight = () => setIsSpotlightOpen(true);
    window.addEventListener("hugo:open-spotlight", handleSpotlight);
    return () => window.removeEventListener("hugo:open-spotlight", handleSpotlight);
  }, []);

  // Interactive Live Audios states
  const [isRadioPlaying, setIsRadioPlaying] = useState(false);
  const [isAuraActive, setIsAuraActive] = useState(false);
  const [rainVolume, setRainVolume] = useState(80);
  const [cafeVolume, setCafeVolume] = useState(45);

  const radioAudioRef = useRef(null);
  const rainAudioRef = useRef(null);
  const cafeAudioRef = useRef(null);

  // Long press refs
  const longPressTimerRef = useRef(null);
  const isLongPressTriggered = useRef(false);
  const appGestureRef = useRef(null);
  const legacyArcadeSyncRef = useRef(false);

  // Sync state with prop if bio updates asynchronously
  useEffect(() => {
    if (bio && Array.isArray(bio.installedUtilities)) {
      const appsToSet = appInstallationPolicy.normalizeInstalled([
        ...bio.installedUtilities,
        ...readStoredList(INSTALLED_APPS_KEY),
        ...readDownloadedGameAppIds(),
      ]);
      setInstalledApps((current) => (
        JSON.stringify(appsToSet) !== JSON.stringify(current) ? appsToSet : current
      ));
    }
  }, [bio]);

  // Sync to database and localStorage helper
  const syncInstalledApps = async (updatedApps) => {
    const appsToSave = appInstallationPolicy.normalizeInstalled(updatedApps);
    setInstalledApps(appsToSave);
    localStorage.setItem(INSTALLED_APPS_KEY, JSON.stringify(appsToSave));
    
    if (bio?._id && bio._id !== 'guest') {
      try {
        const res = await memberService.updateMemberBio(bio._id, { installedUtilities: appsToSave });
        if (res?.bio && onBioUpdate) {
          onBioUpdate(res.bio);
        }
      } catch {
        // Soft fail open — local storage maintains installed apps state
      }
    }
  };

  // Keep localStorage synced cleanly with installedApps
  useEffect(() => {
    if (installedApps.length > 0) {
      localStorage.setItem(INSTALLED_APPS_KEY, JSON.stringify(installedApps));
    }
  }, [installedApps]);

  // Sync homeScreenApps with prop if bio updates asynchronously.
  useEffect(() => {
    if (bio && Array.isArray(bio.homeScreenUtilities)) {
      const installed = appInstallationPolicy.normalizeInstalled([
        ...(Array.isArray(bio.installedUtilities) ? bio.installedUtilities : []),
        ...readStoredList(INSTALLED_APPS_KEY),
        ...readDownloadedGameAppIds(),
      ]);
      setHomeScreenApps(appInstallationPolicy.normalizeHomeScreen([
        ...bio.homeScreenUtilities,
        ...readStoredList(HOME_SCREEN_APPS_KEY),
        ...readDownloadedGameAppIds(),
      ], installed));
    }
  }, [bio]);

  // Keep localStorage synced cleanly with homeScreenApps
  useEffect(() => {
    if (homeScreenApps.length > 0) {
      localStorage.setItem(HOME_SCREEN_APPS_KEY, JSON.stringify(homeScreenApps));
    }
  }, [homeScreenApps]);

  // ── CRITICAL: Re-sync from localStorage when Dashboard becomes visible ──────────
  // This fires every time user navigates back from Arcade / any sub-utility.
  useEffect(() => {
    if (!isVisible) return;
    // Update React state from all offline sources when returning from an app.
    const downloadedGames = readDownloadedGameAppIds();
    const diskHome = [...readStoredList(HOME_SCREEN_APPS_KEY), ...downloadedGames];
    const diskInst = [...readStoredList(INSTALLED_APPS_KEY), ...downloadedGames];
    setHomeScreenApps(prev => {
      const merged = appInstallationPolicy.normalizeHomeScreen(
        [...prev, ...diskHome],
        [...installedApps, ...diskInst],
      );
      return JSON.stringify(merged) !== JSON.stringify(prev) ? merged : prev;
    });
    setInstalledApps(prev => {
      const merged = appInstallationPolicy.normalizeInstalled([...prev, ...diskInst]);
      return JSON.stringify(merged) !== JSON.stringify(prev) ? merged : prev;
    });
  }, [installedApps, isVisible]);

  // One-time migration for games downloaded by older builds that only stored
  // their state on this device. This makes those installs portable via bootstrap.
  useEffect(() => {
    if (!isVisible || legacyArcadeSyncRef.current || !bio?._id || bio._id === "guest") return;

    const downloadedGames = readDownloadedGameAppIds();
    if (downloadedGames.length === 0) return;

    const serverInstalled = Array.isArray(bio.installedUtilities) ? bio.installedUtilities : [];
    const serverHome = Array.isArray(bio.homeScreenUtilities) ? bio.homeScreenUtilities : [];
    const appsToSave = appInstallationPolicy.normalizeInstalled([
      ...serverInstalled,
      ...readStoredList(INSTALLED_APPS_KEY),
      ...downloadedGames,
    ]);
    const homeToSave = appInstallationPolicy.normalizeHomeScreen([
      ...serverHome,
      ...readStoredList(HOME_SCREEN_APPS_KEY),
      ...downloadedGames,
    ], appsToSave);
    const alreadySynced = downloadedGames.every((appId) => (
      serverInstalled.includes(appId) && serverHome.includes(appId)
    ));
    if (alreadySynced) return;

    legacyArcadeSyncRef.current = true;
    memberService.updateMemberBio(bio._id, {
      installedUtilities: appsToSave,
      homeScreenUtilities: homeToSave,
    }).then((response) => {
      if (response?.bio) onBioUpdate?.(response.bio);
    }).catch(() => {
      legacyArcadeSyncRef.current = false;
    });
  }, [bio, isVisible, onBioUpdate]);

  // Handle Dynamic Mobile Tab Bar Hiding when editingApp or isSpotlightOpen is active
  useEffect(() => {
    const isOpen = Boolean(editingApp || isSpotlightOpen);
    window.dispatchEvent(new CustomEvent("hugo:fullsheet", { detail: { open: isOpen } }));
    return () => {
      window.dispatchEvent(new CustomEvent("hugo:fullsheet", { detail: { open: false } }));
    };
  }, [editingApp, isSpotlightOpen]);

  // Listen for game installs from HugoArcadeTab (or any sub-component) → add to home screen instantly
  useEffect(() => {
    // Sự kiện mang sẵn hai danh sách đã tính (useAppInstall) — dùng thẳng.
    // Bản cũ chỉ nhận id rồi tự ghim lên màn hình chính, nên cài "chỉ vào Thư
    // viện" hay gỡ ở màn khác đều ra sai.
    const handleInstalled = (e) => {
      const { installed, homeScreen } = e.detail || {};
      if (Array.isArray(installed)) setInstalledApps(installed);
      if (Array.isArray(homeScreen)) setHomeScreenApps(homeScreen);
    };

    // Also listen to storage changes (cross-tab or from HugoArcadeTab writing directly)
    const handleStorage = (e) => {
      if (e.key === HOME_SCREEN_APPS_KEY && e.newValue) {
        try {
          const fresh = JSON.parse(e.newValue);
          setHomeScreenApps(prev => {
            const merged = [...new Set([...prev, ...fresh])];
            return merged.length !== prev.length ? merged : prev;
          });
        } catch {}
      }
      if (e.key === INSTALLED_APPS_KEY && e.newValue) {
        try {
          const fresh = JSON.parse(e.newValue);
          setInstalledApps(prev => {
            const merged = [...new Set([...prev, ...fresh])];
            return merged.length !== prev.length ? merged : prev;
          });
        } catch {}
      }
    };

    window.addEventListener("hugo:app-installed", handleInstalled);
    window.addEventListener("hugo:app-uninstalled", handleInstalled);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("hugo:app-installed", handleInstalled);
      window.removeEventListener("hugo:app-uninstalled", handleInstalled);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  // Clean up audios on unmount
  useEffect(() => {
    return () => {
      if (radioAudioRef.current) {
        radioAudioRef.current.pause();
        radioAudioRef.current = null;
      }
      if (rainAudioRef.current) {
        rainAudioRef.current.pause();
        rainAudioRef.current = null;
      }
      if (cafeAudioRef.current) {
        cafeAudioRef.current.pause();
        cafeAudioRef.current = null;
      }
    };
  }, []);

  // Spotlight tìm cả màn hình bên trong app, không chỉ tên app: gõ "QR" phải ra
  // thẳng công cụ QR của HugoKit chứ không bắt người dùng mở HugoKit rồi tự dò.
  const spotlightFilteredApps = useMemo(() => {
    const byId = new Map(allUtilities.map((util) => [util.id, util]));
    const destinations = APP_DESTINATIONS.flatMap((destination) => {
      const parent = byId.get(destination.appId);
      if (!parent || !installedApps.includes(parent.id)) return [];
      return [{
        ...parent,
        key: `${destination.appId}:${destination.id}`,
        title: t(destination.labelKey),
        subLabel: parent.title,
        destination: destination.id,
      }];
    });

    const apps = allUtilities.map((util) => ({ ...util, key: util.id }));

    if (!spotlightQuery.trim()) {
      // Không gõ gì thì gợi ý app đã cài, app vừa dùng đứng trước.
      const recency = appOpenOrder();
      const rank = (id) => {
        const index = recency.indexOf(id);
        return index === -1 ? Number.MAX_SAFE_INTEGER : index;
      };
      return apps
        .filter((util) => installedApps.includes(util.id))
        .sort((a, b) => rank(a.id) - rank(b.id));
    }

    const query = spotlightQuery.toLowerCase();
    const matches = (entry) =>
      entry.title.toLowerCase().includes(query) || entry.subLabel.toLowerCase().includes(query);
    return [...apps.filter(matches), ...destinations.filter(matches)];
  }, [allUtilities, installedApps, spotlightQuery, t]);

  const handleLaunchSpotlightApp = (app) => {
    setIsSpotlightOpen(false);
    if (!installedApps.includes(app.id)) {
      setActiveTab("library");
      setSearchQuery(app.title);
      return;
    }
    setSelectedUtility(app.id);
    if (app.destination) openDestination(app.id, app.destination);
  };

  // Keyboard shortcut listener for toggle Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSpotlightOpen((prev) => !prev);
        setSpotlightQuery("");
        setSpotlightSelectedIndex(0);
      } else if (e.key === "Escape") {
        setIsSpotlightOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Keyboard navigation inside spotlight
  useEffect(() => {
    if (!isSpotlightOpen) return;

    const handleSpotlightKeys = (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSpotlightSelectedIndex((prev) => 
          prev < spotlightFilteredApps.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSpotlightSelectedIndex((prev) => 
          prev > 0 ? prev - 1 : spotlightFilteredApps.length - 1
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (spotlightFilteredApps[spotlightSelectedIndex]) {
          handleLaunchSpotlightApp(spotlightFilteredApps[spotlightSelectedIndex]);
        }
      }
    };

    window.addEventListener("keydown", handleSpotlightKeys);
    return () => window.removeEventListener("keydown", handleSpotlightKeys);
  }, [isSpotlightOpen, spotlightSelectedIndex, spotlightFilteredApps]);

  useEffect(() => {
    setSpotlightSelectedIndex(0);
  }, [spotlightQuery]);

  const categories = useMemo(() => [
    { id: "all", label: t("utilities.categories.all"), icon: "widgets" },
    { id: "edu", label: t("utilities.categories.education"), icon: "school" },
    { id: "wellness", label: t("utilities.categories.wellness"), icon: "favorite" },
    { id: "tools", label: t("utilities.categories.tools"), icon: "handyman" },
    { id: "arcade", label: t("utilities.categories.entertainment"), icon: "sports_esports" },
  ], [t]);



  // addToHome: true = also pin an icon to the home screen grid (default,
  // matches the previous behavior); false = install into the Library only,
  // still fully usable via "Mở" from there — same install mechanism either way.
  const handleInstallApp = (appId, addToHome = true) => {
    if (appInstallationPolicy.isRequired(appId)) {
      setSelectedUtility(appId);
      return;
    }
    if (downloadingAppId || downloadProgress[appId] !== undefined) return;

    setDownloadingAppId(appId);
    setDownloadProgress((prev) => ({ ...prev, [appId]: 0 }));

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 18) + 8;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        setDownloadProgress((prev) => ({ ...prev, [appId]: 100 }));

        const appSizeMb = getAppStorageMb(appId).toFixed(1);

        setTimeout(() => {
          // Ghi ba kho + bio + bắn sự kiện: xem src/hooks/useAppInstall.js.
          const { installed, homeScreen } = commitInstall(appId, { bio, onBioUpdate, addToHome });
          setInstalledApps(installed);
          setHomeScreenApps(homeScreen);
          setDownloadingAppId(null);
          setDownloadProgress((prev) => {
            const nextProgress = { ...prev };
            delete nextProgress[appId];
            return nextProgress;
          });
          showToast?.(t("utilities.library.installedToast", { size: appSizeMb }), "success");
        }, 850);
      } else {
        setDownloadProgress((prev) => ({ ...prev, [appId]: currentProgress }));
      }
    }, 120);
  };

  const handleUninstallApp = (appId) => {
    if (!appInstallationPolicy.canUninstall(appId)) {
      showToast?.(t("utilities.library.requiredAppNotice"), "info");
      return;
    }
    const appSizeMb = getAppStorageMb(appId).toFixed(1);

    const { installed, homeScreen } = commitUninstall(appId, { bio, onBioUpdate });
    setInstalledApps(installed);
    setHomeScreenApps(homeScreen);

    setEditingApp(null);
    showToast?.(t("utilities.library.removedToast", { size: appSizeMb }), "info");
  };

  const handleSetWidgetSize = async (appId, size) => {
    if (!["small", "medium", "large"].includes(size)) return;
    const updated = { ...utilitySizes };
    if (size === "small") {
      delete updated[appId];
    } else {
      updated[appId] = size;
    }
    setUtilitySizes(updated);
    localStorage.setItem(UTILITY_SIZES_KEY, JSON.stringify(updated));

    if (bio?._id && bio._id !== 'guest') {
      try {
        const res = await memberService.updateMemberBio(bio._id, { utilitySizes: updated });
        if (res?.bio && onBioUpdate) {
          onBioUpdate(res.bio);
        }
      } catch { /* soft fail open */ }
    }
  };

  // Drag and Drop
  const handleDragStart = (e, index, type) => {
    if (!isEditMode) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData("text/plain", index);
    e.dataTransfer.setData("type", type);
  };

  const handleDrop = (e, targetIndex, type) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
    const sourceType = e.dataTransfer.getData("type");

    if (sourceType !== type) return;

    const listToModify = type === "widget" ? myWidgets : myIcons;
    const sourceItem = listToModify[sourceIndex];
    const targetItem = listToModify[targetIndex];

    const actualSourceIdx = installedApps.indexOf(sourceItem.id);
    const actualTargetIdx = installedApps.indexOf(targetItem.id);

    if (actualSourceIdx !== -1 && actualTargetIdx !== -1) {
      const updated = [...installedApps];
      updated[actualSourceIdx] = targetItem.id;
      updated[actualTargetIdx] = sourceItem.id;
      syncInstalledApps(updated);
      showToast?.(t("utilities.library.positionUpdated"), "success");
    }
  };

  // Audio Playback toggling
  const handleToggleRadio = (e) => {
    e.stopPropagation();
    if (!radioAudioRef.current) {
      radioAudioRef.current = new Audio("https://coderadio-admin.freecodecamp.org/radio/8010/radio.mp3");
      radioAudioRef.current.loop = true;
    }

    if (isRadioPlaying) {
      radioAudioRef.current.pause();
      setIsRadioPlaying(false);
      showToast?.(t("utilities.library.radioPaused"), "info");
    } else {
      radioAudioRef.current.play()
        .then(() => {
          setIsRadioPlaying(true);
          showToast?.(t("utilities.library.radioPlaying"), "success");
        })
        .catch((err) => {
          console.error("Audio blocked:", err);
          showToast?.(t("utilities.library.interactionRequired"), "warning");
        });
    }
  };

  const handleToggleAura = (e) => {
    e.stopPropagation();
    if (!rainAudioRef.current) {
      rainAudioRef.current = new Audio("https://www.soundjay.com/nature/sounds/rain-07.mp3");
      rainAudioRef.current.loop = true;
    }
    if (!cafeAudioRef.current) {
      cafeAudioRef.current = new Audio("https://www.soundjay.com/ambient/sounds/subway-station-1.mp3");
      cafeAudioRef.current.loop = true;
    }

    if (isAuraActive) {
      rainAudioRef.current.pause();
      cafeAudioRef.current.pause();
      setIsAuraActive(false);
      showToast?.(t("utilities.library.focusStopped"), "info");
    } else {
      rainAudioRef.current.volume = rainVolume / 100;
      cafeAudioRef.current.volume = cafeVolume / 100;
      Promise.all([
        rainAudioRef.current.play(),
        cafeAudioRef.current.play()
      ])
        .then(() => {
          setIsAuraActive(true);
          showToast?.(t("utilities.library.focusPlaying"), "success");
        })
        .catch((err) => {
          console.error("Aura blocked:", err);
          showToast?.(t("utilities.library.interactionRequired"), "warning");
        });
    }
  };

  const handleRainVolumeChange = (e) => {
    const val = parseInt(e.target.value);
    setRainVolume(val);
    if (rainAudioRef.current) {
      rainAudioRef.current.volume = val / 100;
    }
  };

  const handleCafeVolumeChange = (e) => {
    const val = parseInt(e.target.value);
    setCafeVolume(val);
    if (cafeAudioRef.current) {
      cafeAudioRef.current.volume = val / 100;
    }
  };

  useEffect(() => () => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
    }
  }, []);

  const cancelAppGesture = () => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (appGestureRef.current) {
      appGestureRef.current.cancelled = true;
    }
  };

  // A tap opens an app. Moving the pointer turns the gesture into native scrolling.
  const handleAppTouchStart = (app, event) => {
    if (event?.isPrimary === false) return;

    const startedOnControl = event?.target?.closest?.(
      "button, a, input, textarea, select, [role='button']"
    );

    isLongPressTriggered.current = false;
    appGestureRef.current = {
      appId: app.id,
      pointerId: event?.pointerId,
      startX: event?.clientX ?? 0,
      startY: event?.clientY ?? 0,
      cancelled: Boolean(startedOnControl && startedOnControl !== event?.currentTarget),
    };

    if (appGestureRef.current.cancelled) return;

    longPressTimerRef.current = window.setTimeout(() => {
      if (appGestureRef.current?.cancelled) return;
      isLongPressTriggered.current = true;
      setEditingApp(app);
      try {
        if (navigator.vibrate) {
          navigator.vibrate(35);
        }
      } catch {
        // Silently catch browser policy intervention warnings
      }
    }, 550);
  };

  const handleAppTouchMove = (event) => {
    const gesture = appGestureRef.current;
    if (!gesture || gesture.pointerId !== event?.pointerId) return;

    const distance = Math.hypot(
      (event?.clientX ?? gesture.startX) - gesture.startX,
      (event?.clientY ?? gesture.startY) - gesture.startY
    );
    if (distance > 10) cancelAppGesture();
  };

  const handleAppTouchCancel = () => {
    cancelAppGesture();
    appGestureRef.current = null;
  };

  const [activeArcadeGame, setActiveArcadeGame] = useState(null);

  const handleAppTouchEnd = (app, event) => {
    const gesture = appGestureRef.current;
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    const distance = gesture
      ? Math.hypot(
          (event?.clientX ?? gesture.startX) - gesture.startX,
          (event?.clientY ?? gesture.startY) - gesture.startY
        )
      : Number.POSITIVE_INFINITY;
    const isTap = Boolean(
      gesture
      && gesture.appId === app.id
      && gesture.pointerId === event?.pointerId
      && !gesture.cancelled
      && distance <= 10
    );
    appGestureRef.current = null;

    if (isTap && !isLongPressTriggered.current) {
      if (isEditMode) {
        setEditingApp(app);
        return;
      }
      if (app.id === "store") {
        setSelectedUtility("store");
        return;
      }
      if (app.id.startsWith("arcade_")) {
        const gameKey = app.id.replace("arcade_", "");
        navigate(`/member/utilities/arcade?game=${gameKey}&from=utilities`, { state: { from: "/member/utilities" } });
        return;
      }
      if (data?.systemSettings?.blockUtilities && window.location.hostname === "hugowishpax.studio") {
        const isBlocked = typeof data.systemSettings.blockUtilities === "boolean" 
          ? data.systemSettings.blockUtilities 
          : data.systemSettings.blockUtilities === app.id;

        if (isBlocked) {
          showToast?.(t("utilities.library.upgrading"), "info");
          return;
        }
      }
      setSelectedUtility(app.id);
    }
  };

  const prefetchUtility = (appId) => {
    try {
      switch (appId) {
        case "study": import("./study/StudyWithHugoApp"); break;
        case "handle": import("./hugoKit/HugoKitApp"); break;
        case "psychology": import("./banhocduong/BanhocduongTab"); break;
        case "team": import("./HugoTeamTab"); break;
        case "profile": import("./HugoProfileTab"); break;
        case "radio": import("./MemberRadioTab"); break;
        case "arcade": import("./arcade/HugoArcadeTab"); break;
        case "aura": import("./MemberAuraTab"); break;
        case "info": import("./MemberInfoVersionTab"); break;
        case "bio": import("./BioPreviewTab"); break;
        default: break;
      }
    } catch {
      // Fail silently for prefetching
    }
  };

  const myAppsList = useMemo(() => {
    // Read directly from localStorage so any installs (even from other components) show immediately.
    const downloadedGames = readDownloadedGameAppIds();
    const liveHome = [...readStoredList(HOME_SCREEN_APPS_KEY), ...downloadedGames];
    const liveInst = [...readStoredList(INSTALLED_APPS_KEY), ...downloadedGames];
    // Merge state + localStorage so we capture BOTH sources
    const effectiveInst = appInstallationPolicy.normalizeInstalled([...installedApps, ...liveInst]);
    const effectiveHome = appInstallationPolicy.normalizeHomeScreen(
      [...homeScreenApps, ...liveHome],
      effectiveInst,
    );
    const utilityById = new Map(allUtilities.map((utility) => [utility.id, utility]));
    return effectiveHome.map((appId) => utilityById.get(appId)).filter(Boolean);
  }, [allUtilities, installedApps, homeScreenApps]);

  const libraryAppsList = useMemo(() => {
    return allUtilities.filter((util) => {
      if (util.id === "store") return false;
      const matchesSearch = util.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        util.subLabel.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === "all" || util.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [allUtilities, searchQuery, activeCategory]);

  const myWidgets = useMemo(() => {
    return myAppsList.filter((app) => (utilitySizes[app.id] || "small") !== "small");
  }, [myAppsList, utilitySizes]);

  const myIcons = useMemo(() => {
    return myAppsList.filter(
      (app) => (utilitySizes[app.id] || "small") === "small"
    );
  }, [myAppsList, utilitySizes]);


  return (
    <div className="relative space-y-6 animate-fadeIn pb-24 select-none">
      {/* 🏠 VIEW: MY APPS HOME SCREEN */}
      {activeTab === "my-apps" && (
        <div className="space-y-4">
          <div className="apps-smartbar py-1">
            <button
              type="button"
              onClick={() => { setIsSpotlightOpen(true); setSpotlightQuery(""); setSpotlightSelectedIndex(0); }}
              className="apps-smart-search group flex min-h-11 w-full min-w-0 items-center gap-3 px-4 text-left transition-all active:scale-[0.99]"
              aria-label={t("utilities.library.searchPlaceholder")}
            >
              <Search className="h-[18px] w-[18px] shrink-0 text-muted-foreground transition-colors group-hover:text-primary" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-muted-foreground">
                {t("utilities.library.searchPlaceholder")}
              </span>
              <kbd className="hidden rounded-md border border-border/70 bg-muted/70 px-2 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-block">⌘K</kbd>
            </button>
          </div>

          {myAppsList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center space-y-4 bg-card border border-border/60 rounded-3xl p-8">
              <div className="w-16 h-16 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl">add_to_home_screen</span>
              </div>
              <div className="space-y-1.5">
                <p className="text-lg font-semibold text-foreground">{t("utilities.library.emptyTitle")}</p>
                <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">{t("utilities.library.emptyDescription")}</p>
              </div>
              <button
                onClick={() => setSelectedUtility("store")}
                className="px-5 py-3 bg-primary text-white font-semibold text-sm rounded-2xl hover:opacity-90 active:scale-[0.97] transition-all"
              >
                {t("utilities.library.openLibrary")}
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* SECTION A: PREMIUM WIDGETS DASHBOARD Component */}
              <WidgetRenderer
                myWidgets={myWidgets}
                utilitySizes={utilitySizes}
                isEditMode={isEditMode}
                handleDragStart={handleDragStart}
                handleDrop={handleDrop}
                handleAppTouchStart={handleAppTouchStart}
                handleAppTouchMove={handleAppTouchMove}
                handleAppTouchCancel={handleAppTouchCancel}
                handleAppTouchEnd={handleAppTouchEnd}
                isAuraActive={isAuraActive}
                handleToggleAura={handleToggleAura}
                rainVolume={rainVolume}
                handleRainVolumeChange={handleRainVolumeChange}
                cafeVolume={cafeVolume}
                handleCafeVolumeChange={handleCafeVolumeChange}
                isRadioPlaying={isRadioPlaying}
                handleToggleRadio={handleToggleRadio}
                gradients={GRADIENTS}
                onAppHover={prefetchUtility}
              />

              {/* SECTION B: APP ICONS GRID Component */}
              <AppIconRenderer
                myIcons={myIcons}
                isEditMode={isEditMode}
                handleDragStart={handleDragStart}
                handleDrop={handleDrop}
                handleAppTouchStart={handleAppTouchStart}
                handleAppTouchMove={handleAppTouchMove}
                handleAppTouchCancel={handleAppTouchCancel}
                handleAppTouchEnd={handleAppTouchEnd}
                gradients={GRADIENTS}
                onAppHover={prefetchUtility}
              />
            </div>
          )}
        </div>
      )}

      {/* 🏛️ VIEW: HUGO LIBRARY Component */}
      {activeTab === "library" && (
        <LibraryCatalog
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          categories={categories}
          libraryAppsList={libraryAppsList}
          downloadingAppId={downloadingAppId}
          downloadProgress={downloadProgress}
          installedApps={installedApps}
          handleInstallApp={handleInstallApp}
          setSelectedUtility={setSelectedUtility}
          gradients={GRADIENTS}
          onBack={() => {
            setActiveTab("my-apps");
            if (setSelectedUtility) setSelectedUtility(null);
          }}
        />
      )}

      {/* ⚙️ WIDGET CUSTOMIZER ACTION SHEET MODAL */}
      {editingApp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[200] p-0 sm:p-4 transition-opacity">
          <div className="absolute inset-0" onClick={() => setEditingApp(null)} />

          <div className="pwa-safe-sheet relative w-full sm:max-w-md bg-card border-t sm:border border-border/60 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl z-[210] max-h-[90dvh] overflow-y-auto animate-slideUp text-left">
            <div className="w-9 h-1 bg-muted rounded-full mx-auto mb-5 sm:hidden" />

            <div className="flex items-center gap-4 mb-6">
              <UtilityAppIcon app={editingApp} gradient={GRADIENTS[editingApp.tint] || GRADIENTS.indigo} size="medium" />
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold text-foreground truncate">
                  {editingApp.title}
                </h3>
                <p className="text-sm text-muted-foreground truncate">{editingApp.subLabel}</p>
              </div>
            </div>

            {/* Sizes Segmented Customizer */}
            <div className="space-y-3 mb-6">
              <span className="text-sm font-medium text-muted-foreground block">
                {t("utilities.library.displaySize")}
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "small", label: t("utilities.library.size.small"), desc: t("utilities.library.size.icon") },
                  { id: "medium", label: t("utilities.library.size.medium"), desc: "2×1" },
                  { id: "large", label: t("utilities.library.size.large"), desc: "2×2" },
                ].map((sz) => {
                  const active = (utilitySizes[editingApp.id] || "small") === sz.id;
                  return (
                    <button
                      key={sz.id}
                      onClick={() => handleSetWidgetSize(editingApp.id, sz.id)}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all active:scale-[0.97] ${
                        active
                          ? "bg-primary/10 border-primary text-primary"
                          : "bg-muted/50 border-transparent text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <span className="text-sm font-semibold">{sz.label}</span>
                      <span className="text-[11px] opacity-70 mt-0.5">{sz.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Uninstall / Delete Button */}
            {appInstallationPolicy.canUninstall(editingApp.id) ? (
              <button
                onClick={() => handleUninstallApp(editingApp.id)}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-destructive/10 hover:bg-destructive text-destructive hover:text-white transition-all font-semibold text-sm rounded-2xl mb-3 active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-base">delete</span>
                <span>{t("utilities.library.removeApp")}</span>
              </button>
            ) : (
              <div className="mb-3 flex items-start gap-2 rounded-2xl bg-primary/10 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
                <span className="material-symbols-outlined text-base text-primary">verified_user</span>
                <span>{t("utilities.library.requiredAppDescription")}</span>
              </div>
            )}

            {/* Done Close Button */}
            <button
              onClick={() => setEditingApp(null)}
              className="w-full py-3.5 bg-muted hover:bg-muted/80 text-foreground transition-all font-semibold text-sm rounded-2xl text-center active:scale-[0.98]"
            >
              {t("utilities.library.done")}
            </button>
          </div>
        </div>
      )}

      {/* 🔍 SPOTLIGHT SEARCH OVERLAY */}
      {isSpotlightOpen && (
        <div className="portal-spotlight-overlay fixed inset-0 bg-black/40 backdrop-blur-md z-[550] flex justify-center px-4" onClick={() => setIsSpotlightOpen(false)}>
          <div
            className="w-full max-w-lg bg-card border border-border/60 rounded-3xl shadow-2xl p-4 space-y-3 max-h-[70dvh] flex flex-col animate-slideUp text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input Box */}
            <div className="apps-spotlight-search relative flex items-center shrink-0">
              <Search className="absolute left-3.5 h-[18px] w-[18px] text-muted-foreground/75" aria-hidden="true" />
              <input
                autoFocus
                type="text"
                placeholder={t("utilities.library.searchPlaceholder")}
                value={spotlightQuery}
                onChange={(e) => setSpotlightQuery(e.target.value)}
                className="h-12 w-full bg-transparent pl-11 pr-12 text-base text-foreground outline-none placeholder:text-muted-foreground/55"
              />
              {spotlightQuery ? (
                <button type="button" onClick={() => setSpotlightQuery("")} className="apps-search-clear" aria-label={t("utilities.library.clearSearch")}>
                  <X aria-hidden="true" />
                </button>
              ) : (
                <kbd className="absolute right-3.5 hidden rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground sm:block">ESC</kbd>
              )}
            </div>

            {/* Suggestions/Results List */}
            <div className="overflow-y-auto flex-1 space-y-1 pr-1">
              <p className="text-xs font-medium text-muted-foreground px-2.5 pb-1.5 pt-1 block">
                {spotlightQuery ? t("utilities.library.searchResults") : t("utilities.library.quickSuggestions")}
              </p>
              {spotlightFilteredApps.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  {t("utilities.library.noSpotlightResults")}
                </div>
              ) : (
                spotlightFilteredApps.map((app, index) => {
                  const active = index === spotlightSelectedIndex;
                  const isInstalled = installedApps.includes(app.id);
                  const gradient = GRADIENTS[app.tint] || GRADIENTS.indigo;
                  return (
                    <div
                      key={app.key || app.id}
                      onClick={() => handleLaunchSpotlightApp(app)}
                      onMouseEnter={() => setSpotlightSelectedIndex(index)}
                      className={`flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition-colors ${
                        active ? "bg-muted" : "hover:bg-muted/60"
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <UtilityAppIcon app={app} gradient={gradient} size="small" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground">{app.title}</p>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{app.subLabel}</p>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {isInstalled ? (
                          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">{t("utilities.library.installed")}</span>
                        ) : (
                          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md">{t("utilities.library.store")}</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* 🚀 FLYING APP ICON INSTALLATION EFFECT */}
      {flyingApp && (
        <div 
          className="fixed pointer-events-none z-[999] flex flex-col items-center justify-center transition-all"
          style={{
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
          }}
        >
          <div 
            className="flex flex-col items-center justify-center"
            style={{
              position: "absolute",
              left: `${flyingApp.start.x}px`,
              top: `${flyingApp.start.y}px`,
              transform: "translate(-50%, -50%)",
              "--fly-start-x": "0px",
              "--fly-start-y": "0px",
              "--fly-end-x": `${flyingApp.end.x - flyingApp.start.x}px`,
              "--fly-end-y": `${flyingApp.end.y - flyingApp.start.y}px`,
              animation: "flyToHome 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards"
            }}
          >
            <UtilityAppIcon app={flyingApp} gradient={GRADIENTS[flyingApp.tint] || GRADIENTS.indigo} size="large" className="shadow-2xl" />
            <span className="text-[10px] font-black text-white bg-black/75 px-2.5 py-0.5 rounded-lg mt-2 tracking-wider shadow pointer-events-none z-10">
              {flyingApp.title}
            </span>
          </div>
        </div>
      )}

      {/* 🎮 Standalone Arcade Mini-Game Sheet Launcher */}
      {activeArcadeGame && (
        <StandaloneGameShell
          gameId={activeArcadeGame.replace("arcade_", "")}
          bio={bio}
          onClose={() => setActiveArcadeGame(null)}
        />
      )}

      {/* 🌌 CSS Keyframe Animations Block */}
      <style>{`
        @keyframes eqBar {
          0% { height: 4px; }
          100% { height: 12px; }
        }
        @keyframes progressWave {
          0% { width: 10%; }
          50% { width: 85%; }
          100% { width: 10%; }
        }
        @keyframes flyToHome {
          0% {
            transform: translate3d(var(--fly-start-x), var(--fly-start-y), 0) scale(1.2);
            opacity: 1;
          }
          70% {
            transform: translate3d(var(--fly-mid-x), var(--fly-mid-y), 0) scale(0.6);
            opacity: 0.8;
          }
          100% {
            transform: translate3d(var(--fly-end-x), var(--fly-end-y), 0) scale(0.1);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
