import React, { useState, useMemo, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useData } from "../../context/DataContext";
import memberService from "../../services/classes/MemberService";

// Import modular sub-components
import WidgetRenderer from "./utilities/WidgetRenderer";
import AppIconRenderer from "./utilities/AppIconRenderer";
import LibraryCatalog from "./utilities/LibraryCatalog";
import StandaloneGameShell from "./arcade/StandaloneGameShell";
import { triggerPWAInstallDirectly } from "../../utils/pwaInstallTrigger";

// Dynamic On-Demand PWA App Storage Footprint (MB)
export const APP_STORAGE_MB = {
  hugoskin: 2.8,
  ide: 4.5,
  psychology: 3.2,
  arcade: 5.1,
  radio: 1.9,
  helpdesk: 1.4,
  handle: 1.2,
  aura: 1.8,
  deco: 3.8,
  team: 1.6,
  bio: 1.5,
  info: 0.8,
  joy_wallet: 1.1
};

// Styling constants
const GRADIENTS = {
  indigo:  "from-indigo-500 to-indigo-600",
  rose:    "from-rose-400 to-rose-600",
  cyan:    "from-cyan-400 to-teal-500",
  blue:    "from-blue-500 to-indigo-600",
  teal:    "from-teal-400 to-emerald-500",
  orange:  "from-amber-400 to-orange-500",
  purple:  "from-violet-500 to-purple-600",
  slate:   "from-slate-500 to-slate-700",
  pink:    "from-pink-400 to-fuchsia-600",
};

const DEFAULT_INSTALLED = [
  "library", "bio", "ide", "psychology", "radio", "helpdesk", "handle", "arcade", "aura",
  "arcade_chess", "arcade_2048", "arcade_tetris", "arcade_survivor", "info"
];

const DEFAULT_SIZES = {};

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

  const allUtilities = useMemo(() => [
    {
      id: "bio",
      icon: "badge",
      tint: "purple",
      title: "Trang Bio",
      category: "edu",
      subLabel: "Hồ sơ cá nhân & Biolink",
      rating: "4.9",
      users: "12k",
      badge: "HOT"
    },
    {
      id: "ide",
      icon: "code",
      tint: "blue",
      title: t("utilities.dashboard.ide.title", "HugoCoder"),
      category: "edu",
      subLabel: "Trình soạn code & Học lập trình",
      rating: "4.8",
      users: "8k",
      badge: "PRO"
    },
    {
      id: "team",
      icon: "groups",
      tint: "teal",
      title: "Hugo Team",
      category: "edu",
      subLabel: "Tuyển dụng & Dự án sinh viên",
      rating: "4.7",
      users: "2k",
      badge: "JOIN"
    },
    {
      id: "psychology",
      icon: "psychology",
      tint: "cyan",
      title: t("companion.tab.title", "HugoPSY"),
      category: "wellness",
      subLabel: "AI tư vấn tâm lý & Giấc ngủ",
      rating: "5.0",
      users: "15k",
      badge: "AI"
    },
    {
      id: "hugoskin",
      icon: "face",
      tint: "slate",
      title: "HugoSkin",
      category: "wellness",
      subLabel: "AI phân tích sắc tố da & Skincare",
      rating: "4.7",
      users: "4k",
      badge: "AI"
    },
    {
      id: "radio",
      icon: "radio",
      tint: "teal",
      title: "HugoRadio",
      category: "wellness",
      subLabel: "Radio tin tức & Nhạc Lofi",
      rating: "4.6",
      users: "5k",
      badge: "LOFI"
    },
    {
      id: "helpdesk",
      icon: "support_agent",
      tint: "indigo",
      title: "HugoHelpdesk",
      category: "tools",
      subLabel: "Mã QR/NFC & Chữ ký email",
      rating: "4.8",
      users: "9k",
      badge: "FREE"
    },
    {
      id: "handle",
      icon: "handyman",
      tint: "rose",
      title: "HugoHandle",
      category: "tools",
      subLabel: "Nén ảnh & Rút gọn link bảo mật",
      rating: "4.9",
      users: "10k",
      badge: "UTILITY"
    },
    {
      id: "arcade",
      icon: "stadium",
      tint: "orange",
      title: "HugoArcade",
      category: "arcade",
      subLabel: "Mini game giải trí nhận JOY",
      rating: "4.9",
      users: "18k",
      badge: "GAMES"
    },
    {
      id: "aura",
      icon: "blur_on",
      tint: "purple",
      title: "HugoAura",
      category: "arcade",
      subLabel: "Pomodoro tập trung & Nhạc sóng não",
      rating: "5.0",
      users: "11k",
      badge: "FOCUS"
    },
    {
      id: "deco",
      icon: "chair",
      tint: "pink",
      title: "Deco Studio",
      category: "arcade",
      subLabel: "Trang trí ký túc xá ảo của bạn",
      rating: "4.5",
      users: "3k",
      badge: "CREATIVE"
    },
    {
      id: "info",
      icon: "info",
      tint: "slate",
      title: "Info & Version",
      category: "tools",
      subLabel: "Thông tin & Nhật ký cập nhật",
      rating: "4.8",
      users: "6k",
      badge: "SYSTEM"
    },
    {
      id: "joy_wallet",
      icon: "account_balance_wallet",
      tint: "orange",
      title: "Ví JOY Widget",
      category: "tools",
      subLabel: "Xem số dư & Chuyển khoản nhanh",
      rating: "5.0",
      users: "30k",
      badge: "WALLET"
    },
    {
      id: "library",
      icon: "store",
      tint: "blue",
      title: "Hugo Library",
      category: "tools",
      subLabel: "Kho ứng dụng & tiện ích học tập",
      rating: "5.0",
      users: "50k",
      badge: "STORE"
    },
    { id: "arcade_chess", icon: "castle", tint: "slate", title: "Cờ Vua AI", category: "arcade", subLabel: "Thách đấu AI Master ELO 2500", rating: "4.9", users: "8k", badge: "GAME" },
    { id: "arcade_2048", icon: "casino", tint: "orange", title: "2048 Fusion", category: "arcade", subLabel: "Gộp số 2048 mở rộng", rating: "4.8", users: "12k", badge: "GAME" },
    { id: "arcade_caro", icon: "swords", tint: "blue", title: "Caro Master", category: "arcade", subLabel: "Cờ Caro đối kháng 5 cấp", rating: "4.7", users: "6k", badge: "GAME" },
    { id: "arcade_wordguess", icon: "keyboard", tint: "purple", title: "Mật Mã Từ", category: "arcade", subLabel: "Từ vựng Hán Việt 3D", rating: "4.6", users: "4k", badge: "GAME" },
    { id: "arcade_tetris", icon: "grid_view", tint: "cyan", title: "Tetris Neon", category: "arcade", subLabel: "Xếp hình Neon 3D 60fps", rating: "4.9", users: "15k", badge: "GAME" },
    { id: "arcade_snake", icon: "all_inclusive", tint: "teal", title: "Rắn 3D Pro", category: "arcade", subLabel: "Hugo Snake 3D cổ điển", rating: "4.8", users: "9k", badge: "GAME" },
    { id: "arcade_survivor", icon: "rocket_launch", tint: "indigo", title: "Space Survivor", category: "arcade", subLabel: "Bắn máy bay Space 3D", rating: "5.0", users: "18k", badge: "GAME" },
    { id: "arcade_flappy", icon: "bolt", tint: "rose", title: "Flappy Cyber", category: "arcade", subLabel: "Bay Cyberpunk không gian", rating: "4.7", users: "7k", badge: "GAME" }
  ], [t]);

  // App Ecosystem States
  const [installedApps, setInstalledApps] = useState(() => {
    if (bio && Array.isArray(bio.installedUtilities) && bio.installedUtilities.length > 0) {
      return bio.installedUtilities;
    }
    const saved = localStorage.getItem("hugo_installed_utilities_v2");
    return saved ? JSON.parse(saved) : DEFAULT_INSTALLED;
  });

  const [utilitySizes, setUtilitySizes] = useState(() => {
    if (bio && bio.utilitySizes && typeof bio.utilitySizes === 'object') {
      return bio.utilitySizes;
    }
    const saved = localStorage.getItem("hugo_utility_sizes");
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    if (bio && bio.utilitySizes && typeof bio.utilitySizes === 'object') {
      setUtilitySizes(bio.utilitySizes);
    }
  }, [bio]);

  // Subset of installedApps that also gets a home-screen icon — see
  // handleInstallApp's addToHome choice and syncHomeScreenApps below.
  const [homeScreenApps, setHomeScreenApps] = useState(() => {
    if (bio && Array.isArray(bio.homeScreenUtilities) && bio.homeScreenUtilities.length > 0) {
      return bio.homeScreenUtilities;
    }
    const saved = localStorage.getItem("hugo_home_screen_utilities_v1");
    if (saved) return JSON.parse(saved);
    // No home-screen data saved yet (pre-migration) — fall back to "every
    // installed app is on the home screen", matching behavior before this
    // install-location choice existed, so nothing disappears on upgrade.
    return bio && Array.isArray(bio.installedUtilities) && bio.installedUtilities.length > 0
      ? bio.installedUtilities
      : DEFAULT_INSTALLED;
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

  // Refresh key: increment this to force myAppsList to re-read from localStorage
  const [refreshKey, setRefreshKey] = useState(0);

  // Sync state with prop if bio updates asynchronously
  useEffect(() => {
    if (bio && Array.isArray(bio.installedUtilities)) {
      let appsToSet = bio.installedUtilities.length > 0 ? bio.installedUtilities : ["library", "info"];
      if (!appsToSet.includes("library")) appsToSet.unshift("library");
      if (!appsToSet.includes("info")) appsToSet.push("info");
      if (JSON.stringify(appsToSet) !== JSON.stringify(installedApps)) {
        setInstalledApps(appsToSet);
      }
    }
  }, [bio]);

  // Sync to database and localStorage helper
  const syncInstalledApps = async (updatedApps) => {
    let appsToSave = [...new Set(updatedApps)];
    if (!appsToSave.includes("library")) appsToSave.unshift("library");
    if (!appsToSave.includes("info")) appsToSave.push("info");
    setInstalledApps(appsToSave);
    localStorage.setItem("hugo_installed_utilities_v2", JSON.stringify(appsToSave));
    
    if (bio?._id && bio._id !== 'guest') {
      try {
        const res = await memberService.updateMemberBio(bio._id, { installedUtilities: appsToSave });
        if (res?.bio && onBioUpdate) {
          onBioUpdate(res.bio);
        }
      } catch (err) {
        // Soft fail open — local storage maintains installed apps state
      }
    }
  };

  // Keep localStorage synced cleanly with installedApps
  useEffect(() => {
    if (installedApps.length > 0) {
      localStorage.setItem("hugo_installed_utilities_v2", JSON.stringify(installedApps));
    }
  }, [installedApps]);

  // Sync homeScreenApps with prop if bio updates asynchronously.
  useEffect(() => {
    if (bio && Array.isArray(bio.homeScreenUtilities)) {
      setHomeScreenApps(bio.homeScreenUtilities);
    }
  }, [bio]);

  const syncHomeScreenApps = async (updatedApps) => {
    let appsToSave = [...new Set(updatedApps)];
    if (!appsToSave.includes("library")) appsToSave.unshift("library");
    if (!appsToSave.includes("info")) appsToSave.push("info");
    setHomeScreenApps(appsToSave);
    localStorage.setItem("hugo_home_screen_utilities_v1", JSON.stringify(appsToSave));

    if (bio?._id && bio._id !== 'guest') {
      try {
        const res = await memberService.updateMemberBio(bio._id, { homeScreenUtilities: appsToSave });
        if (res?.bio && onBioUpdate) {
          onBioUpdate(res.bio);
        }
      } catch (err) {
        // Soft fail open — local storage maintains home screen apps state
      }
    }
  };

  // Keep localStorage synced cleanly with homeScreenApps
  useEffect(() => {
    if (homeScreenApps.length > 0) {
      localStorage.setItem("hugo_home_screen_utilities_v1", JSON.stringify(homeScreenApps));
    }
  }, [homeScreenApps]);

  // ── CRITICAL: Re-sync from localStorage when Dashboard becomes visible ──────────
  // This fires every time user navigates back from Arcade / any sub-utility.
  // Incrementing refreshKey forces myAppsList to re-read fresh from localStorage.
  useEffect(() => {
    if (!isVisible) return;
    // 1. Bump refresh key → myAppsList will recompute from localStorage
    setRefreshKey(k => k + 1);
    // 2. Also update React state so other derived state stays consistent
    const diskHome = JSON.parse(localStorage.getItem("hugo_home_screen_utilities_v1") || "[]");
    const diskInst = JSON.parse(localStorage.getItem("hugo_installed_utilities_v2") || "[]");
    setHomeScreenApps(prev => {
      const merged = [...new Set([...prev, ...diskHome])];
      return merged.length !== prev.length ? merged : prev;
    });
    setInstalledApps(prev => {
      const merged = [...new Set([...prev, ...diskInst])];
      return merged.length !== prev.length ? merged : prev;
    });
  }, [isVisible]);

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
    const handleInstalled = (e) => {
      const { appId } = e.detail || {};
      if (!appId) return;
      setInstalledApps(prev => {
        if (prev.includes(appId)) return prev;
        const next = [...prev, appId];
        localStorage.setItem("hugo_installed_utilities_v2", JSON.stringify(next));
        return next;
      });
      setHomeScreenApps(prev => {
        if (prev.includes(appId)) return prev;
        const next = [...prev, appId];
        localStorage.setItem("hugo_home_screen_utilities_v1", JSON.stringify(next));
        return next;
      });
    };

    // Also listen to storage changes (cross-tab or from HugoArcadeTab writing directly)
    const handleStorage = (e) => {
      if (e.key === "hugo_home_screen_utilities_v1" && e.newValue) {
        try {
          const fresh = JSON.parse(e.newValue);
          setHomeScreenApps(prev => {
            const merged = [...new Set([...prev, ...fresh])];
            return merged.length !== prev.length ? merged : prev;
          });
        } catch {}
      }
      if (e.key === "hugo_installed_utilities_v2" && e.newValue) {
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
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("hugo:app-installed", handleInstalled);
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

  const spotlightFilteredApps = useMemo(() => {
    if (!spotlightQuery.trim()) {
      return allUtilities.filter((util) => installedApps.includes(util.id));
    }
    const query = spotlightQuery.toLowerCase();
    return allUtilities.filter(
      (util) =>
        util.title.toLowerCase().includes(query) ||
        util.subLabel.toLowerCase().includes(query)
    );
  }, [allUtilities, installedApps, spotlightQuery]);

  const handleLaunchSpotlightApp = (app) => {
    setIsSpotlightOpen(false);
    if (!installedApps.includes(app.id)) {
      setActiveTab("library");
      setSearchQuery(app.title);
      return;
    }
    if (app.id === "library") {
      setActiveTab("library");
    } else {
      setSelectedUtility(app.id);
    }
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
    { id: "all", label: "Tất cả", icon: "widgets" },
    { id: "edu", label: "Học tập", icon: "school" },
    { id: "wellness", label: "Sức khỏe", icon: "favorite" },
    { id: "tools", label: "Công cụ", icon: "handyman" },
    { id: "arcade", label: "Giải trí", icon: "sports_esports" },
  ], []);



  // addToHome: true = also pin an icon to the home screen grid (default,
  // matches the previous behavior); false = install into the Library only,
  // still fully usable via "Mở" from there — same install mechanism either way.
  const handleInstallApp = (appId, addToHome = true) => {
    if (downloadingAppId || downloadProgress[appId] !== undefined) return;
    
    // 🚀 Trigger 1-Tap Native PWA Add to Home Screen Prompt
    triggerPWAInstallDirectly().catch(() => {});

    setDownloadingAppId(appId);
    setDownloadProgress((prev) => ({ ...prev, [appId]: 0 }));

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 18) + 8;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        setDownloadProgress((prev) => ({ ...prev, [appId]: 100 }));

        const appSizeMb = (APP_STORAGE_MB[appId] || 2.0).toFixed(1);

        // On-Demand PWA Storage Caching
        try {
          localStorage.setItem(`hugo_pwa_app_${appId}`, JSON.stringify({
            installedAt: new Date().toISOString(),
            sizeMb: appSizeMb
          }));
          if ('caches' in window) {
            caches.open('hugo-on-demand-apps-v1').then((cache) => {
              cache.put(
                `/pwa-app-bundle-${appId}`,
                new Response(JSON.stringify({ appId, sizeMb: appSizeMb, cached: true }), {
                  headers: { 'Content-Type': 'application/json' }
                })
              );
            }).catch(() => {});
          }
        } catch (e) {
          console.warn("Storage cache error:", e);
        }

        setTimeout(() => {
          setInstalledApps(prev => {
            const nextInstalled = [...new Set([...prev, appId])];
            syncInstalledApps(nextInstalled);
            return nextInstalled;
          });
          setHomeScreenApps(prev => {
            const nextHome = [...new Set([...prev, appId])];
            syncHomeScreenApps(nextHome);
            return nextHome;
          });
          window.dispatchEvent(new CustomEvent("hugo:app-installed", { detail: { appId } }));
          setDownloadingAppId(null);
          setDownloadProgress((prev) => {
            const nextProgress = { ...prev };
            delete nextProgress[appId];
            return nextProgress;
          });
          showToast?.(`Đã tải ứng dụng (+${appSizeMb} MB bộ nhớ máy)!`, "success");
        }, 850);
      } else {
        setDownloadProgress((prev) => ({ ...prev, [appId]: currentProgress }));
      }
    }, 120);
  };

  const handleUninstallApp = (appId) => {
    const appSizeMb = (APP_STORAGE_MB[appId] || 2.0).toFixed(1);
    
    // Clear On-Demand PWA Storage
    try {
      localStorage.removeItem(`hugo_pwa_app_${appId}`);
      if ('caches' in window) {
        caches.open('hugo-on-demand-apps-v1').then((cache) => {
          cache.delete(`/pwa-app-bundle-${appId}`);
        }).catch(() => {});
      }
    } catch (e) {
      console.warn("Storage cache clear error:", e);
    }

    const nextInstalled = installedApps.filter((id) => id !== appId);
    const nextHomeScreen = homeScreenApps.filter((id) => id !== appId);

    setInstalledApps(nextInstalled);
    setHomeScreenApps(nextHomeScreen);
    localStorage.setItem("hugo_installed_utilities_v2", JSON.stringify(nextInstalled));
    localStorage.setItem("hugo_home_screen_utilities_v1", JSON.stringify(nextHomeScreen));

    syncInstalledApps(nextInstalled);
    syncHomeScreenApps(nextHomeScreen);

    setEditingApp(null);
    showToast?.(`Đã gỡ ứng dụng (Giải phóng -${appSizeMb} MB bộ nhớ máy)!`, "info");
  };

  const handleSetWidgetSize = async (appId, size) => {
    const updated = { ...utilitySizes, [appId]: size };
    setUtilitySizes(updated);
    localStorage.setItem("hugo_utility_sizes", JSON.stringify(updated));

    if (bio?._id && bio._id !== 'guest') {
      try {
        const res = await memberService.updateMemberBio(bio._id, { utilitySizes: updated });
        if (res?.bio && onBioUpdate) {
          onBioUpdate(res.bio);
        }
      } catch (err) { /* soft fail open */ }
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
      showToast?.("Đã cập nhật vị trí ứng dụng!", "success");
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
      showToast?.("Đã tạm dừng Radio", "info");
    } else {
      radioAudioRef.current.play()
        .then(() => {
          setIsRadioPlaying(true);
          showToast?.("Đang phát Lofi Code Radio 24/7 🎵", "success");
        })
        .catch((err) => {
          console.error("Audio blocked:", err);
          showToast?.("Hãy nhấp vào trang trước để phát nhạc", "warning");
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
      showToast?.("Đã tắt âm thanh tập trung", "info");
    } else {
      rainAudioRef.current.volume = rainVolume / 100;
      cafeAudioRef.current.volume = cafeVolume / 100;
      Promise.all([
        rainAudioRef.current.play(),
        cafeAudioRef.current.play()
      ])
        .then(() => {
          setIsAuraActive(true);
          showToast?.("Đang phát âm thanh tập trung 🌧️☕", "success");
        })
        .catch((err) => {
          console.error("Aura blocked:", err);
          showToast?.("Hãy nhấp vào trang trước để phát nhạc", "warning");
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

  // Touch and hold triggers customizer
  const handleAppTouchStart = (app) => {
    isLongPressTriggered.current = false;
    // Store timer globally to allow modular components to clear it easily onMouseLeave
    window.longPressTimer = setTimeout(() => {
      isLongPressTriggered.current = true;
      setEditingApp(app);
      try {
        if (navigator.vibrate) {
          navigator.vibrate(35);
        }
      } catch (err) {
        // Silently catch browser policy intervention warnings
      }
    }, 550);
  };

  const [activeArcadeGame, setActiveArcadeGame] = useState(null);

  const handleAppTouchEnd = (app, e) => {
    clearTimeout(window.longPressTimer);
    if (!isLongPressTriggered.current) {
      if (isEditMode) {
        setEditingApp(app);
        return;
      }
      if (app.id === "library") {
        setActiveTab("library");
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
          showToast?.("Hugo... đang nâng cấp phiên bản mới", "info");
          return;
        }
      }
      setSelectedUtility(app.id);
    }
  };

  const prefetchUtility = (appId) => {
    try {
      switch (appId) {
        case "helpdesk": import("./HugoHelpdeskTab"); break;
        case "handle": import("./HugoHandleTab"); break;
        case "psychology": import("./banhocduong/BanhocduongTab"); break;
        case "ide": import("./hugoCoder/HugoCoderHub"); break;
        case "team": import("./HugoTeamTab"); break;
        case "radio": import("./MemberRadioTab"); break;
        case "arcade": import("./arcade/HugoArcadeTab"); break;
        case "aura": import("./MemberAuraTab"); break;
        case "info": import("./MemberInfoVersionTab"); break;
        case "deco": import("./DecoStudioTab"); break;
        case "bio": import("./BioPreviewTab"); break;
        case "hugoskin": import("./HugoSkinTab"); break;
        default: break;
      }
    } catch (err) {
      // Fail silently for prefetching
    }
  };

  const myAppsList = useMemo(() => {
    // Read directly from localStorage so any installs (even from other components) show immediately.
    // refreshKey and state vars are both deps so this recomputes whenever either changes.
    const liveHome = JSON.parse(localStorage.getItem("hugo_home_screen_utilities_v1") || "[]");
    const liveInst = JSON.parse(localStorage.getItem("hugo_installed_utilities_v2") || "[]");
    // Merge state + localStorage so we capture BOTH sources
    const effectiveHome = [...new Set([...homeScreenApps, ...liveHome])];
    const effectiveInst = [...new Set([...installedApps, ...liveInst])];
    return allUtilities.filter((util) => effectiveHome.includes(util.id) || effectiveInst.includes(util.id));
  }, [allUtilities, installedApps, homeScreenApps, refreshKey]);

  const libraryAppsList = useMemo(() => {
    return allUtilities.filter((util) => {
      if (util.id === "library") return false;
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

  const joyBalance = data?.member?.joyBalance || 1540;

  return (
    <div className="relative space-y-6 animate-fadeIn pb-24 select-none">
      {/* 🏠 VIEW: MY APPS HOME SCREEN */}
      {activeTab === "my-apps" && (
        <div className="space-y-4">
          {/* 🔍 AUTHENTIC APPLE LIQUID GLASS SEARCH CAPSULE BAR 🔍 */}
          <div className="w-full flex flex-col items-center gap-3 py-2">
            <div
              onClick={() => { setIsSpotlightOpen(true); setSpotlightQuery(""); setSpotlightSelectedIndex(0); }}
              className="w-full relative flex items-center justify-between px-6 py-3.5 sm:py-4 rounded-full bg-white/40 dark:bg-white/10 backdrop-blur-3xl border border-white/70 dark:border-white/20 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.8),0_12px_32px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.25),0_12px_32px_rgba(0,0,0,0.4)] hover:bg-white/50 dark:hover:bg-white/15 transition-all cursor-pointer group active:scale-[0.99]"
            >
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 flex-1 tracking-tight select-none">
                Tìm kiếm ứng dụng, trò chơi, tiện ích...
              </span>

              <div className="flex items-center gap-3">
                <kbd className="hidden sm:inline-block px-2.5 py-1 bg-white/60 dark:bg-black/40 rounded-full text-[10px] font-mono font-black border border-white/80 dark:border-white/20 text-slate-600 dark:text-slate-300 shadow-xs">
                  ⌘K
                </kbd>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-slate-800 dark:text-white group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-2xl font-light">search</span>
                </div>
              </div>
            </div>

            {/* Apple Liquid Glass Control Pills (Matching Image 2) */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-4 px-5 py-2 rounded-full bg-white/40 dark:bg-white/10 backdrop-blur-3xl border border-white/70 dark:border-white/20 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.8),0_8px_20px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.2),0_8px_20px_rgba(0,0,0,0.3)]">
                <button
                  onClick={() => navigate(-1)}
                  className="text-slate-800 dark:text-white hover:opacity-70 transition-opacity flex items-center justify-center"
                  title="Quay lại"
                >
                  <span className="material-symbols-outlined text-xl">chevron_left</span>
                </button>
                <button
                  onClick={() => navigate(1)}
                  className="text-slate-800 dark:text-white hover:opacity-70 transition-opacity flex items-center justify-center"
                  title="Tiếp theo"
                >
                  <span className="material-symbols-outlined text-xl">chevron_right</span>
                </button>
              </div>

              <button
                onClick={() => setActiveTab("library")}
                className="w-10 h-10 rounded-full bg-white/40 dark:bg-white/10 backdrop-blur-3xl border border-white/70 dark:border-white/20 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.8),0_8px_20px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.2),0_8px_20px_rgba(0,0,0,0.3)] text-slate-800 dark:text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
                title="Khám phá Thư viện App"
              >
                <span className="material-symbols-outlined text-lg">grid_view</span>
              </button>
            </div>
          </div>

          {myAppsList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center space-y-4 bg-card border border-border/60 rounded-3xl p-8">
              <div className="w-16 h-16 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl">add_to_home_screen</span>
              </div>
              <div className="space-y-1.5">
                <p className="text-lg font-semibold text-foreground">Màn hình trống</p>
                <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">Tải các tiện ích học tập bạn cần từ Hugo Library.</p>
              </div>
              <button
                onClick={() => setActiveTab("library")}
                className="px-5 py-3 bg-primary text-white font-semibold text-sm rounded-2xl hover:opacity-90 active:scale-[0.97] transition-all"
              >
                Khám phá Hugo Library
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* SECTION A: PREMIUM WIDGETS DASHBOARD Component */}
              <WidgetRenderer
                bio={bio}
                myWidgets={myWidgets}
                utilitySizes={utilitySizes}
                isEditMode={isEditMode}
                handleDragStart={handleDragStart}
                handleDrop={handleDrop}
                handleAppTouchStart={handleAppTouchStart}
                handleAppTouchEnd={handleAppTouchEnd}
                isAuraActive={isAuraActive}
                handleToggleAura={handleToggleAura}
                rainVolume={rainVolume}
                handleRainVolumeChange={handleRainVolumeChange}
                cafeVolume={cafeVolume}
                handleCafeVolumeChange={handleCafeVolumeChange}
                isRadioPlaying={isRadioPlaying}
                handleToggleRadio={handleToggleRadio}
                joyBalance={joyBalance}
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

          <div className="relative w-full sm:max-w-md bg-card border-t sm:border border-border/60 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl z-[210] max-h-[90vh] overflow-y-auto animate-slideUp text-left">
            <div className="w-9 h-1 bg-muted rounded-full mx-auto mb-5 sm:hidden" />

            <div className="flex items-center gap-4 mb-6">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${GRADIENTS[editingApp.tint] || GRADIENTS.indigo} flex items-center justify-center shadow-sm shrink-0`}>
                <span className="material-symbols-outlined text-white text-[26px]" style={{ fontVariationSettings: "'FILL' 1" }}>{editingApp.icon}</span>
              </div>
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
                Kích cỡ hiển thị
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "small", label: "Nhỏ", desc: "Biểu tượng" },
                  { id: "medium", label: "Vừa", desc: "2×1" },
                  { id: "large", label: "Lớn", desc: "2×2" },
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
            {editingApp.id !== "library" && (
              <button
                onClick={() => handleUninstallApp(editingApp.id)}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-destructive/10 hover:bg-destructive text-destructive hover:text-white transition-all font-semibold text-sm rounded-2xl mb-3 active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-base">delete</span>
                <span>Gỡ khỏi màn hình chính</span>
              </button>
            )}

            {/* Done Close Button */}
            <button
              onClick={() => setEditingApp(null)}
              className="w-full py-3.5 bg-muted hover:bg-muted/80 text-foreground transition-all font-semibold text-sm rounded-2xl text-center active:scale-[0.98]"
            >
              Xong
            </button>
          </div>
        </div>
      )}

      {/* 🔍 SPOTLIGHT SEARCH OVERLAY */}
      {isSpotlightOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[550] flex justify-center pt-24 px-4" onClick={() => setIsSpotlightOpen(false)}>
          <div
            className="w-full max-w-lg bg-card border border-border/60 rounded-3xl shadow-2xl p-4 space-y-3 max-h-[70vh] flex flex-col animate-slideUp text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input Box */}
            <div className="relative flex items-center shrink-0">
              <span className="material-symbols-outlined text-muted-foreground/70 absolute left-3.5">search</span>
              <input
                autoFocus
                type="text"
                placeholder="Tìm ứng dụng, tiện ích…"
                value={spotlightQuery}
                onChange={(e) => setSpotlightQuery(e.target.value)}
                className="w-full h-12 bg-muted/60 text-base text-foreground placeholder-muted-foreground/60 rounded-2xl pl-11 pr-16 outline-none border border-transparent focus:border-primary/40 transition-all"
              />
              <span className="absolute right-3.5 text-[10px] font-medium text-muted-foreground/70 border border-border/60 px-2 py-0.5 rounded select-none pointer-events-none">ESC</span>
            </div>

            {/* Suggestions/Results List */}
            <div className="overflow-y-auto flex-1 space-y-1 pr-1">
              <p className="text-xs font-medium text-muted-foreground px-2.5 pb-1.5 pt-1 block">
                {spotlightQuery ? "Kết quả tìm kiếm" : "Gợi ý nhanh"}
              </p>
              {spotlightFilteredApps.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Không tìm thấy ứng dụng phù hợp
                </div>
              ) : (
                spotlightFilteredApps.map((app, index) => {
                  const active = index === spotlightSelectedIndex;
                  const isInstalled = installedApps.includes(app.id);
                  const gradient = GRADIENTS[app.tint] || GRADIENTS.indigo;
                  return (
                    <div
                      key={app.id}
                      onClick={() => handleLaunchSpotlightApp(app)}
                      onMouseEnter={() => setSpotlightSelectedIndex(index)}
                      className={`flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition-colors ${
                        active ? "bg-muted" : "hover:bg-muted/60"
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 shadow-sm`}>
                          <span className="material-symbols-outlined text-white text-[20px]">{app.icon}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground">{app.title}</p>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{app.subLabel}</p>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {isInstalled ? (
                          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">Đã tải</span>
                        ) : (
                          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md">Cửa hàng</span>
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
            <div className={`w-16 h-16 rounded-[16px] bg-gradient-to-br bg-gradient-to-r flex items-center justify-center shadow-2xl relative overflow-hidden`} style={{ background: `linear-gradient(to bottom right, var(--tw-gradient-stops))` }}>
              <div className={`absolute inset-0 bg-gradient-to-br ${GRADIENTS[flyingApp.tint] || GRADIENTS.indigo} rounded-[16px]`} />
              <span className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/15 opacity-55 pointer-events-none rounded-[16px]" />
              <span className="material-symbols-outlined text-white text-[32px] z-10" style={{ fontVariationSettings: "'FILL' 1" }}>{flyingApp.icon}</span>
            </div>
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
          onBioUpdate={onBioUpdate}
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
