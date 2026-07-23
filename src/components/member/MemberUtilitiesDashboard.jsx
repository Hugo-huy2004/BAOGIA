import React, { useState, useMemo, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useData } from "../../context/DataContext";
import memberService from "../../services/classes/MemberService";

// Import modular sub-components
import WidgetRenderer from "./utilities/WidgetRenderer";
import AppIconRenderer from "./utilities/AppIconRenderer";
import WallpaperSelector from "./utilities/WallpaperSelector";
import LibraryCatalog from "./utilities/LibraryCatalog";
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
  indigo:  "from-indigo-500 via-purple-500 to-pink-500",
  rose:    "from-rose-500 via-pink-500 to-red-500",
  cyan:    "from-cyan-400 via-teal-500 to-emerald-500",
  blue:    "from-blue-600 via-indigo-600 to-violet-600",
  teal:    "from-teal-400 via-emerald-500 to-success",
  orange:  "from-amber-500 via-orange-500 to-rose-500",
  purple:  "from-violet-600 via-purple-600 to-fuchsia-600",
  slate:   "from-slate-600 via-zinc-600 to-stone-600",
  pink:    "from-pink-500 via-fuchsia-500 to-purple-500",
};

const CARD_THEMES = {
  indigo:  "from-indigo-500/8 via-purple-500/3 to-transparent",
  rose:    "from-rose-500/8 via-pink-500/3 to-transparent",
  cyan:    "from-cyan-500/8 via-teal-500/3 to-transparent",
  blue:    "from-blue-600/8 via-indigo-600/3 to-transparent",
  teal:    "from-teal-500/8 via-emerald-500/3 to-transparent",
  orange:  "from-amber-500/8 via-orange-500/3 to-transparent",
  purple:  "from-violet-600/8 via-purple-600/3 to-transparent",
  slate:   "from-slate-600/8 via-zinc-600/3 to-transparent",
  pink:    "from-pink-500/8 via-fuchsia-500/3 to-transparent",
};

const GLOW_SHADOWS = {
  indigo:  "hover:shadow-[0_20px_50px_rgba(99,102,241,0.2)] dark:hover:shadow-[0_20px_50px_rgba(99,102,241,0.12)]",
  rose:    "hover:shadow-[0_20px_50px_rgba(244,63,94,0.2)] dark:hover:shadow-[0_20px_50px_rgba(244,63,94,0.12)]",
  cyan:    "hover:shadow-[0_20px_50px_rgba(6,182,212,0.2)] dark:hover:shadow-[0_20px_50px_rgba(6,182,212,0.12)]",
  blue:    "hover:shadow-[0_20px_50px_rgba(59,130,246,0.2)] dark:hover:shadow-[0_20px_50px_rgba(59,130,246,0.12)]",
  teal:    "hover:shadow-[0_20px_50px_rgba(20,184,166,0.2)] dark:hover:shadow-[0_20px_50px_rgba(20,184,166,0.12)]",
  orange:  "hover:shadow-[0_20px_50px_rgba(245,158,11,0.2)] dark:hover:shadow-[0_20px_50px_rgba(245,158,11,0.12)]",
  purple:  "hover:shadow-[0_20px_50px_rgba(139,92,246,0.2)] dark:hover:shadow-[0_20px_50px_rgba(139,92,246,0.12)]",
  slate:   "hover:shadow-[0_20px_50px_rgba(100,116,139,0.2)] dark:hover:shadow-[0_20px_50px_rgba(100,116,139,0.12)]",
  pink:    "hover:shadow-[0_20px_50px_rgba(236,72,153,0.2)] dark:hover:shadow-[0_20px_50px_rgba(236,72,153,0.12)]",
};

const THEMES = [
  { id: "default", label: "Mặc định", style: "" },
  { id: "aurora", label: "Cực quang", style: "bg-gradient-to-tr from-purple-950/20 via-indigo-900/10 to-cyan-950/20 dark:from-purple-950/30 dark:via-indigo-950/15 dark:to-cyan-950/30 rounded-[30px] p-6 shadow-lg shadow-purple-500/5" },
  { id: "cyberpunk", label: "Cyberpunk", style: "bg-[#090d16]/90 rounded-[30px] p-6 shadow-[0_0_30px_rgba(6,182,212,0.06)]" },
  { id: "pastel", label: "Pastel", style: "bg-gradient-to-br from-rose-100/50 via-peach-100/30 to-amber-100/40 dark:from-rose-950/10 dark:via-zinc-900/20 dark:to-amber-950/10 rounded-[30px] p-6 shadow-md shadow-orange-500/5" },
];

const DEFAULT_INSTALLED = ["library", "info"];

const DEFAULT_SIZES = {
  psychology: "medium",
  ide: "large",
  aura: "medium",
  joy_wallet: "medium",
};

export default function MemberUtilitiesDashboard({ bio, onBioUpdate, setSelectedUtility, showToast }) {
  const { t } = useTranslation();
  const { data } = useData();

  // Navigation & Search States
  const [activeTab, setActiveTab] = useState("my-apps");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [isEditMode, setIsEditMode] = useState(false);
  const [showWallpaperSelector, setShowWallpaperSelector] = useState(false);

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
    }
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
    const saved = localStorage.getItem("hugo_utility_sizes");
    return saved ? JSON.parse(saved) : DEFAULT_SIZES;
  });

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

  const [activeWallpaper, setActiveWallpaper] = useState(() => {
    return localStorage.getItem("hugo_wallpaper") || "default";
  });

  const [downloadingAppId, setDownloadingAppId] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState({});
  const [editingApp, setEditingApp] = useState(null);

  // Advanced UI States
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [ripples, setRipples] = useState([]);
  const [flyingApp, setFlyingApp] = useState(null);
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
  const [spotlightQuery, setSpotlightQuery] = useState("");
  const [spotlightSelectedIndex, setSpotlightSelectedIndex] = useState(0);

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
    let appsToSave = [...updatedApps];
    if (!appsToSave.includes("library")) appsToSave.unshift("library");
    if (!appsToSave.includes("info")) appsToSave.push("info");
    setInstalledApps(appsToSave);
    localStorage.setItem("hugo_installed_utilities_v2", JSON.stringify(appsToSave));
    
    if (bio?._id) {
      try {
        const res = await memberService.updateMemberBio(bio._id, { installedUtilities: appsToSave });
        if (res?.bio && onBioUpdate) {
          onBioUpdate(res.bio);
        }
      } catch (err) {
        console.error("Failed to sync installed utilities to DB:", err);
      }
    }
  };

  // Sync to localStorage fallback
  useEffect(() => {
    localStorage.setItem("hugo_installed_utilities_v2", JSON.stringify(installedApps));
  }, [installedApps]);

  // Sync homeScreenApps with prop if bio updates asynchronously
  useEffect(() => {
    if (bio && Array.isArray(bio.homeScreenUtilities) && bio.homeScreenUtilities.length > 0) {
      if (JSON.stringify(bio.homeScreenUtilities) !== JSON.stringify(homeScreenApps)) {
        setHomeScreenApps(bio.homeScreenUtilities);
      }
    }
  }, [bio]);

  const syncHomeScreenApps = async (updatedApps) => {
    let appsToSave = [...new Set(updatedApps)];
    if (!appsToSave.includes("library")) appsToSave.unshift("library");
    if (!appsToSave.includes("info")) appsToSave.push("info");
    setHomeScreenApps(appsToSave);
    localStorage.setItem("hugo_home_screen_utilities_v1", JSON.stringify(appsToSave));

    if (bio?._id) {
      try {
        const res = await memberService.updateMemberBio(bio._id, { homeScreenUtilities: appsToSave });
        if (res?.bio && onBioUpdate) {
          onBioUpdate(res.bio);
        }
      } catch (err) {
        console.error("Failed to sync home-screen utilities to DB:", err);
      }
    }
  };

  useEffect(() => {
    localStorage.setItem("hugo_home_screen_utilities_v1", JSON.stringify(homeScreenApps));
  }, [homeScreenApps]);

  // Handle Dynamic Mobile Tab Bar Hiding
  useEffect(() => {
    const tabbar = document.getElementById("mobile-bottom-tab-bar");
    if (tabbar) {
      if (editingApp) {
        tabbar.classList.add("hidden");
      } else {
        tabbar.classList.remove("hidden");
      }
    }
    return () => {
      if (tabbar) {
        tabbar.classList.remove("hidden");
      }
    };
  }, [editingApp]);

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
          syncInstalledApps([...installedApps, appId]);
          if (addToHome) syncHomeScreenApps([...homeScreenApps, appId]);
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

    syncInstalledApps(installedApps.filter((id) => id !== appId));
    setEditingApp(null);
    showToast?.(`Đã gỡ ứng dụng (Giải phóng -${appSizeMb} MB bộ nhớ máy)!`, "info");
  };

  const handleSetWidgetSize = (appId, size) => {
    setUtilitySizes((prev) => {
      const updated = { ...prev, [appId]: size };
      localStorage.setItem("hugo_utility_sizes", JSON.stringify(updated));
      return updated;
    });
  };

  const handleSetWallpaper = (themeId) => {
    setActiveWallpaper(themeId);
    localStorage.setItem("hugo_wallpaper", themeId);
    showToast?.("Đã thay đổi hình nền bàn làm việc!", "success");
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

  const handleMouseMove = (e) => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const { clientX, clientY } = e;
    const x = (clientX - window.innerWidth / 2) / 60;
    const y = (clientY - window.innerHeight / 2) / 60;
    setMousePos({ x, y });
  };

  const handleDesktopClick = (e) => {
    if (e.target.id === "workspace-bg") {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = Date.now() + Math.random();
      setRipples((prev) => [...prev, { id, x, y }]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 800);
    }
  };

  const myAppsList = useMemo(() => {
    return allUtilities.filter((util) => installedApps.includes(util.id) && homeScreenApps.includes(util.id));
  }, [allUtilities, installedApps, homeScreenApps]);

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

  const DOCK_APPS = useMemo(() => ["library", "info", "bio"], []);

  const myIcons = useMemo(() => {
    return myAppsList.filter(
      (app) => (utilitySizes[app.id] || "small") === "small" && !DOCK_APPS.includes(app.id)
    );
  }, [myAppsList, utilitySizes, DOCK_APPS]);

  const myDockApps = useMemo(() => {
    return myAppsList.filter(
      (app) => DOCK_APPS.includes(app.id) && (utilitySizes[app.id] || "small") === "small"
    );
  }, [myAppsList, utilitySizes, DOCK_APPS]);

  const joyBalance = data?.member?.joyBalance || 1540;
  const activeThemeClass = THEMES.find((t) => t.id === activeWallpaper)?.style || "";

  return (
    <div 
      onMouseMove={handleMouseMove}
      onClick={handleDesktopClick}
      className="relative space-y-8 animate-fadeIn pb-36 select-none transition-all duration-500 overflow-hidden rounded-[30px]"
    >
      {/* 🌌 Parallax Wallpaper Background Layer */}
      <div 
        id="workspace-bg"
        className={`absolute inset-[-20px] transition-transform duration-200 ease-out pointer-events-auto z-0 ${activeThemeClass || "bg-card/20"}`}
        style={{ 
          transform: `translate3d(${mousePos.x}px, ${mousePos.y}px, 0)`,
          willChange: "transform"
        }}
      />

      {/* 🌊 Fluid Ripple Overlays */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-white/25 dark:bg-white/10 pointer-events-none z-10"
          style={{
            left: ripple.x,
            top: ripple.y,
            transform: "translate(-50%, -50%)",
            animation: "rippleEffect 0.8s cubic-bezier(0.1, 0.8, 0.3, 1) forwards",
          }}
        />
      ))}

      {/* 🏠 VIEW: MY APPS HOME SCREEN */}
      {activeTab === "my-apps" && (
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-2 text-left gap-3 border-b border-border/45 pb-3">
            <div>
              <h2 className="text-base font-black uppercase tracking-wider text-foreground">Bàn làm việc</h2>
              <p className="text-[11px] text-muted-foreground/80 font-bold mt-0.5">💡 Nhấn giữ (Long press) hoặc Sắp xếp để tùy biến & kéo thả thứ tự ứng dụng</p>
            </div>
            <div className="flex items-center gap-2 self-start">
              {/* Spotlight Search Toggle Button */}
              <button
                onClick={() => { setIsSpotlightOpen(true); setSpotlightQuery(""); setSpotlightSelectedIndex(0); }}
                className="flex items-center justify-center w-9 h-9 rounded-full border bg-card/75 border-border text-foreground hover:bg-muted transition-all active:scale-95"
                title="Tìm kiếm nhanh (Cmd + K)"
              >
                <span className="material-symbols-outlined text-lg animate-pulse">search</span>
              </button>

              {/* Theme Settings Button */}
              <button
                onClick={() => setShowWallpaperSelector(!showWallpaperSelector)}
                className={`flex items-center justify-center w-9 h-9 rounded-full border transition-all active:scale-95 ${
                  showWallpaperSelector
                    ? "bg-primary border-primary text-white shadow-md"
                    : "bg-card/75 border-border text-foreground hover:bg-muted"
                }`}
                title="Thay đổi hình nền"
              >
                <span className="material-symbols-outlined text-lg">palette</span>
              </button>

              {/* Sorting Mode Button */}
              <button
                onClick={() => setIsEditMode(!isEditMode)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black uppercase border transition-all active:scale-95 ${
                  isEditMode
                    ? "bg-success border-success text-white shadow-md"
                    : "bg-card/75 border-border text-foreground hover:bg-muted"
                }`}
              >
                <span className="material-symbols-outlined text-sm">{isEditMode ? "done" : "tune"}</span>
                <span>{isEditMode ? "Xong" : "Sắp xếp"}</span>
              </button>
            </div>
          </div>

          {/* Wallpaper Selection Drawer Component */}
          <WallpaperSelector
            showWallpaperSelector={showWallpaperSelector}
            activeWallpaper={activeWallpaper}
            handleSetWallpaper={handleSetWallpaper}
            themes={THEMES}
          />

          {myAppsList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center space-y-4 glossy-card border border-border/75 rounded-[32px] p-8 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl">add_to_home_screen</span>
              </div>
              <div className="space-y-1">
                <p className="text-base font-black text-foreground uppercase tracking-wider">Trống màn hình</p>
                <p className="text-xs text-muted-foreground/70 max-w-xs leading-relaxed">Hãy tải các tiện ích học tập bạn cần từ thư viện Hugo Library.</p>
              </div>
              <button
                onClick={() => setActiveTab("library")}
                className="px-6 py-3 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg hover:opacity-90 active:scale-95 transition-all"
              >
                Khám phá Hugo Library
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
                cardThemes={CARD_THEMES}
                glowShadows={GLOW_SHADOWS}
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

              {/* 🖥️ macOS/iOS GLASSMORPHIC APPLICATION DOCK */}
              {myDockApps.length > 0 && (
                <div className="fixed right-4 top-1/2 -translate-y-1/2 z-40 h-max max-h-[85vh] py-4 animate-fadeIn">
                  <div className="flex flex-col items-center gap-4 px-3.5 py-5 rounded-[28px] bg-gradient-to-b from-white/45 via-white/20 to-white/10 dark:from-white/10 dark:via-black/35 dark:to-black/55 border border-white/40 dark:border-white/15 backdrop-blur-[24px] transition-all duration-300 liquid-glass-dock">
                    {myDockApps.map((app) => {
                      const gradient = GRADIENTS[app.tint] || GRADIENTS.indigo;
                      const touchProps = {
                        onMouseEnter: () => prefetchUtility(app.id),
                        onMouseDown: () => handleAppTouchStart(app),
                        onMouseUp: (e) => handleAppTouchEnd(app, e),
                        onMouseLeave: () => clearTimeout(window.longPressTimer),
                        onTouchStart: () => handleAppTouchStart(app),
                        onTouchEnd: (e) => handleAppTouchEnd(app, e),
                      };

                      return (
                        <div
                          key={app.id}
                          {...touchProps}
                          className="relative group flex flex-col items-center cursor-pointer transition-all duration-300 w-14 h-14"
                        >
                          {/* Tooltip on Hover - Appears on the Left side */}
                          <span className="absolute right-16 top-1/2 -translate-y-1/2 scale-0 group-hover:scale-100 transition-all duration-200 bg-black/80 backdrop-blur-md text-[10px] font-black text-white px-2.5 py-1 rounded-lg uppercase tracking-wider shadow pointer-events-none whitespace-nowrap z-50">
                            {app.title}
                          </span>
                          
                          <div className="w-14 h-14 rounded-[16px] bg-gradient-to-br flex items-center justify-center shadow-md relative shrink-0 transition-all duration-200 hover:-translate-x-2.5 hover:scale-110 active:scale-95" style={{ background: `linear-gradient(to bottom right, var(--tw-gradient-stops))` }}>
                            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} rounded-[16px]`} />
                            <span className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/15 opacity-50 pointer-events-none rounded-[16px]" />
                            <span className="material-symbols-outlined text-white text-[28px] z-10" style={{ fontVariationSettings: "'FILL' 1" }}>{app.icon}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
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
          onBack={() => setActiveTab("my-apps")}
        />
      )}

      {/* ⚙️ WIDGET CUSTOMIZER ACTION SHEET MODAL */}
      {editingApp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[200] p-0 sm:p-4 transition-opacity">
          <div className="absolute inset-0" onClick={() => setEditingApp(null)} />

          <div className="relative w-full sm:max-w-md bg-card/95 border-t sm:border border-border/75 rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl z-[210] max-h-[90vh] overflow-y-auto animate-slideUp text-left glossy-card">
            <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-5 sm:hidden" />

            <div className="flex items-center gap-4 mb-6">
              <div className={`w-14 h-14 rounded-[14px] bg-gradient-to-br ${GRADIENTS[editingApp.tint] || GRADIENTS.indigo} flex items-center justify-center shadow-md relative overflow-hidden shrink-0`}>
                <span className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
                <span className="material-symbols-outlined text-white text-[26px]" style={{ fontVariationSettings: "'FILL' 1" }}>{editingApp.icon}</span>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-black text-foreground truncate">
                  Tùy chỉnh: {editingApp.title}
                </h3>
                <p className="text-xs text-muted-foreground truncate">{editingApp.subLabel}</p>
              </div>
            </div>

            {/* Sizes Segmented Customizer */}
            <div className="space-y-3 mb-6">
              <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground block">
                Chọn kích cỡ hiển thị:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "small", label: "Nhỏ (Icon)", desc: "1x1 Icon" },
                  { id: "medium", label: "Vừa", desc: "2x1 Widget" },
                  { id: "large", label: "Lớn", desc: "2x2 Widget" },
                ].map((sz) => {
                  const active = (utilitySizes[editingApp.id] || "small") === sz.id;
                  return (
                    <button
                      key={sz.id}
                      onClick={() => handleSetWidgetSize(editingApp.id, sz.id)}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all active:scale-95 ${
                        active
                          ? "bg-primary/10 border-primary text-primary"
                          : "bg-muted/40 border-border/50 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <span className="text-xs font-black">{sz.label}</span>
                      <span className="text-[9.5px] opacity-75 font-semibold mt-0.5">{sz.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Uninstall / Delete Button */}
            {editingApp.id !== "library" && (
              <button
                onClick={() => handleUninstallApp(editingApp.id)}
                className="w-full flex items-center justify-center gap-2 py-3 border border-destructive/30 hover:border-transparent bg-destructive/10 hover:bg-destructive text-destructive hover:text-white transition-all font-black text-xs uppercase tracking-wider rounded-2xl mb-4 active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-base">delete_forever</span>
                <span>Gỡ khỏi màn hình chính</span>
              </button>
            )}

            {/* Done Close Button */}
            <button
              onClick={() => setEditingApp(null)}
              className="w-full py-3 bg-muted hover:bg-muted/80 text-foreground transition-all font-black text-xs uppercase tracking-wider rounded-2xl text-center active:scale-[0.98]"
            >
              Xong
            </button>
          </div>
        </div>
      )}

      {/* 🔍 SPOTLIGHT SEARCH OVERLAY */}
      {isSpotlightOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[550] flex justify-center pt-24 px-4" onClick={() => setIsSpotlightOpen(false)}>
          <div 
            className="w-full max-w-lg bg-[#0a0f1d] border border-white/10 rounded-2xl shadow-2xl p-4 space-y-4 max-h-[70vh] flex flex-col animate-slideUp text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input Box */}
            <div className="relative flex items-center shrink-0">
              <span className="material-symbols-outlined text-zinc-400 absolute left-3.5">search</span>
              <input
                autoFocus
                type="text"
                placeholder="Tìm kiếm ứng dụng, tiện ích... (Dùng mũi tên ↑↓ để chọn)"
                value={spotlightQuery}
                onChange={(e) => setSpotlightQuery(e.target.value)}
                className="w-full h-12 bg-white/5 text-sm text-white placeholder-zinc-500 rounded-xl pl-11 pr-24 outline-none border border-white/10 focus:border-primary/50 transition-all font-medium"
              />
              <span className="absolute right-3.5 text-[9px] font-black text-zinc-500 border border-zinc-700 px-2 py-0.5 rounded uppercase select-none pointer-events-none">ESC</span>
            </div>

            {/* Suggestions/Results List */}
            <div className="overflow-y-auto flex-1 space-y-1.5 pr-1 divide-y divide-white/5">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2.5 pb-2 pt-1 block">
                {spotlightQuery ? "Kết quả tìm kiếm" : "Gợi ý ứng dụng nhanh"}
              </p>
              {spotlightFilteredApps.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 text-xs">
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
                      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border border-transparent ${
                        active 
                          ? "bg-white/10 border-l-4 border-l-primary" 
                          : "hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 shadow-sm relative overflow-hidden`}>
                          <span className="material-symbols-outlined text-white text-[20px]">{app.icon}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-white">{app.title}</p>
                          <p className="text-[10px] text-zinc-400 truncate mt-0.5">{app.subLabel}</p>
                        </div>
                      </div>
                      
                      <div className="shrink-0 flex items-center gap-2">
                        {isInstalled ? (
                          <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider bg-emerald-400/10 px-2 py-0.5 rounded-md">Đã tải</span>
                        ) : (
                          <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded-md border border-white/5">Cửa hàng</span>
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

      {/* 🌌 CSS Keyframe Animations Block */}
      <style>{`
        @keyframes rippleEffect {
          0% {
            width: 0px;
            height: 0px;
            opacity: 0.6;
          }
          100% {
            width: 140px;
            height: 140px;
            opacity: 0;
          }
        }
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
        .liquid-glass-dock {
          animation: liquidGlowLight 6s infinite alternate ease-in-out;
        }
        .dark .liquid-glass-dock {
          animation: liquidGlowDark 6s infinite alternate ease-in-out;
        }
        @keyframes liquidGlowLight {
          0% {
            box-shadow: inset 0 2px 3px rgba(255,255,255,0.6), inset 0 -2px 3px rgba(0,0,0,0.05), 0 10px 25px -5px rgba(0,0,0,0.1), 0 0 10px 1px rgba(255,255,255,0.05);
            border-color: rgba(255, 255, 255, 0.4);
          }
          100% {
            box-shadow: inset 0 3px 5px rgba(255,255,255,0.75), inset 0 -3px 5px rgba(0,0,0,0.1), 0 16px 35px -5px rgba(0,0,0,0.18), 0 0 18px 3px rgba(255,255,255,0.15);
            border-color: rgba(255, 255, 255, 0.6);
          }
        }
        @keyframes liquidGlowDark {
          0% {
            box-shadow: inset 0 1px 2px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.3), 0 10px 25px -5px rgba(0,0,0,0.3);
            border-color: rgba(255, 255, 255, 0.15);
          }
          100% {
            box-shadow: inset 0 2px 4px rgba(255,255,255,0.45), inset 0 -3px 6px rgba(0,0,0,0.4), 0 16px 35px -5px rgba(0,0,0,0.45), 0 0 12px 2px rgba(255,255,255,0.1);
            border-color: rgba(255, 255, 255, 0.28);
          }
        }
      `}</style>
    </div>
  );
}
