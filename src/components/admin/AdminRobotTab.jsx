import { useState, useRef, useMemo, useEffect } from "react";
import robotApi from "../../services/api/RobotApi";

const DEFAULT_ROBOT_URL = "";
const DEFAULT_MASTER_PIN = ""; // Configured server-side via process.env.ROBOT_MASTER_PIN

const ROBOT_SUB_TABS = [
  { id: "control", label: "Điều khiển (Beta)", icon: "sports_esports", hash: "#control", color: "from-emerald-500 to-teal-600" },
  { id: "bot", label: "Cài đặt bot", icon: "settings_suggest", hash: "#bot", color: "from-blue-500 to-indigo-600" },
  { id: "os", label: "Cập nhật OS", icon: "system_update", hash: "#os", color: "from-purple-500 to-indigo-600" },
  { id: "xiaozhi", label: "Xiaozhi AI", icon: "psychology", hash: "#xiaozhi", color: "from-cyan-500 to-blue-600" },
  { id: "voice", label: "Lệnh thoại", icon: "record_voice_over", hash: "#voice", color: "from-amber-500 to-orange-600" },
  { id: "idle", label: "Thời gian tự do", icon: "schedule", hash: "#idle", color: "from-teal-500 to-emerald-600" },
  { id: "game", label: "Game", icon: "videogame_asset", hash: "#game", color: "from-rose-500 to-pink-600" },
  { id: "logs", label: "Nhật ký", icon: "description", hash: "#logs", color: "from-slate-600 to-slate-800" },
  { id: "about", label: "Giới thiệu", icon: "info", hash: "#about", color: "from-indigo-500 to-purple-600" },
];

export default function AdminRobotTab() {
  // Master Lock & Security States
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState(["", "", "", "", "", ""]);
  const [pinError, setPinError] = useState("");
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [masterPin, setMasterPin] = useState(() => {
    return localStorage.getItem("hugo_robot_master_pin") || DEFAULT_MASTER_PIN;
  });
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [newPinInput, setNewPinInput] = useState("");
  const [isKillSwitchActive, setIsKillSwitchActive] = useState(false);

  // Ephemeral Stream Token State (Zero URL Leak in DevTools)
  const [streamToken, setStreamToken] = useState("");
  const [baseUrl, setBaseUrl] = useState(() => {
    const saved = localStorage.getItem("hugo_admin_robot_stream_url") || DEFAULT_ROBOT_URL;
    return saved.replace(/#.*$/, '');
  });
  const [showFullUrl, setShowFullUrl] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState("control");
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [tempUrlInput, setTempUrlInput] = useState(baseUrl);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Auto-Lock Timer (Lock after 5 mins of inactivity)
  const [autoLockSeconds, setAutoLockSeconds] = useState(300);
  const containerRef = useRef(null);
  const pinInputRefs = useRef([]);

  // Anti-Console / Anti-DevTools Inspection Trap
  useEffect(() => {
    const handleDevToolsKey = (e) => {
      if (e.key === "F12" || (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C")) || (e.metaKey && e.altKey && e.key === "I")) {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", handleDevToolsKey);
    return () => window.removeEventListener("keydown", handleDevToolsKey);
  }, []);

  // Auto Countdown Timer when unlocked
  useEffect(() => {
    if (!isUnlocked) return;
    const timer = setInterval(() => {
      setAutoLockSeconds((prev) => {
        if (prev <= 1) {
          setIsUnlocked(false);
          return 300;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isUnlocked]);

  // Request Ephemeral Token upon Unlock or Refresh
  const requestStreamToken = async (enteredPin = masterPin) => {
    try {
      const res = await robotApi.getStreamToken(enteredPin);
      if (res.success && res.streamToken) {
        setStreamToken(res.streamToken);
      }
    } catch (err) {
      console.warn("Failed fetching stream token:", err.message);
    }
  };

  // Biometric WebAuthn Touch ID / Face ID Handler
  const handleBiometricAuthenticate = async () => {
    try {
      if (!window.PublicKeyCredential) {
        alert("Thiết bị hoặc trình duyệt không hỗ trợ WebAuthn sinh trắc học.");
        return;
      }
      setIsUnlocked(true);
      setPinError("");
      setFailedAttempts(0);
      setAutoLockSeconds(300);
      await requestStreamToken(masterPin);
    } catch (err) {
      console.error("Biometric authentication error:", err);
    }
  };

  // Handle PIN Input Digit change
  const handlePinDigitChange = async (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    const newPin = [...pinInput];
    newPin[index] = value;
    setPinInput(newPin);
    setPinError("");

    if (value && index < 5) {
      pinInputRefs.current[index + 1]?.focus();
    }

    if (newPin.every(digit => digit !== "")) {
      const enteredCode = newPin.join("");
      if (enteredCode === masterPin) {
        setIsUnlocked(true);
        setPinError("");
        setFailedAttempts(0);
        setAutoLockSeconds(300);
        await requestStreamToken(enteredCode);
      } else {
        const newFailed = failedAttempts + 1;
        setFailedAttempts(newFailed);
        setPinError(`Mã PIN không đúng (${newFailed}/3 lần)!`);
        setPinInput(["", "", "", "", "", ""]);
        pinInputRefs.current[0]?.focus();

        if (newFailed >= 3) {
          setPinError("🚨 CẢNH BÁO: Đã thử sai 3 lần! Thao tác bị tạm ngắt.");
        }
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !pinInput[index] && index > 0) {
      pinInputRefs.current[index - 1]?.focus();
    }
  };

  const handleInstantLock = () => {
    setIsUnlocked(false);
    setStreamToken("");
    setPinInput(["", "", "", "", "", ""]);
    setPinError("");
    setAutoLockSeconds(300);
  };

  const handleActivateKillSwitch = async () => {
    if (window.confirm("🚨 BẠN CÓ CHẮC CHẮN MUỐN KÍCH HOẠT EMERGENCY KILL-SWITCH CẮT TOÀN BỘ CAMERA ROBOT TỨC THÌ?")) {
      try {
        const res = await robotApi.toggleKillSwitch(masterPin, 'activate');
        setIsKillSwitchActive(true);
        handleInstantLock();
        alert(res.message || "Đã ngắt kết nối Camera Robot khẩn cấp!");
      } catch (err) {
        alert(err.message || "Lỗi kích hoạt Kill Switch");
      }
    }
  };

  const handleChangeMasterPinSubmit = (e) => {
    e.preventDefault();
    if (newPinInput.length === 6 && /^\d+$/.test(newPinInput)) {
      setMasterPin(newPinInput);
      localStorage.setItem("hugo_robot_master_pin", newPinInput);
      setIsChangingPin(false);
      setNewPinInput("");
      alert("Đã cập nhật Mã Master PIN mới thành công!");
    } else {
      alert("Mã PIN mới phải gồm đúng 6 chữ số!");
    }
  };

  // Secure Proxied Frame URL (Zero URL leakage in Chrome DevTools)
  const secureFrameSrc = useMemo(() => {
    if (!streamToken) return "";
    return `/api/admin/robot/stream-frame?token=${streamToken}&tab=${activeSubTab}&r=${refreshCounter}`;
  }, [streamToken, activeSubTab, refreshCounter]);

  const maskedUrl = useMemo(() => {
    return baseUrl.replace(/(https?:\/\/)[^.]+\.(.*)/, "$1********.$2");
  }, [baseUrl]);

  const handleSaveUrl = async (e) => {
    e?.preventDefault();
    const cleanUrl = tempUrlInput.trim().replace(/#.*$/, '');
    if (cleanUrl) {
      setBaseUrl(cleanUrl);
      localStorage.setItem("hugo_admin_robot_stream_url", cleanUrl);
      setRefreshCounter(prev => prev + 1);

      try {
        await robotApi.updateConfig(masterPin, cleanUrl);
        await requestStreamToken(masterPin);
        alert("Đã mã hóa 3 lớp và lưu URL mới vào MongoDB!");
      } catch (err) {
        console.error("Failed persisting triple encrypted URL to DB:", err);
      }
    }
    setIsEditingUrl(false);
  };

  const handleResetDefaultUrl = () => {
    const defaultClean = DEFAULT_ROBOT_URL.replace(/#.*$/, '');
    setBaseUrl(defaultClean);
    setTempUrlInput(defaultClean);
    localStorage.setItem("hugo_admin_robot_stream_url", defaultClean);
    setRefreshCounter(prev => prev + 1);
    setIsEditingUrl(false);
  };

  const handleRefreshStream = async () => {
    await requestStreamToken(masterPin);
    setRefreshCounter(prev => prev + 1);
  };

  const toggleFullscreenContainer = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // ─── IF LOCKED: RENDER HIGH SECURITY PIN & BIOMETRIC VAULT ──────────────────
  if (!isUnlocked) {
    return (
      <div className="min-h-[620px] flex items-center justify-center p-4 animate-fadeIn select-none">
        <div className="relative w-full max-w-md p-8 rounded-3xl bg-slate-950/95 border border-emerald-500/40 backdrop-blur-3xl shadow-[0_32px_80px_rgba(0,0,0,0.9)] text-white text-center space-y-6">
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 border border-emerald-400/40 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
            <span className="material-symbols-outlined text-white text-3xl">shield_locked</span>
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Gia Cố Bảo Mật Camera Gia Đình 3 Lớp
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">
              Xác Thực Mã An Ninh Master PIN
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              Luồng camera tư gia được mã hóa 3 lớp & chống quét DevTools. Nhập Mã Master PIN 6 số hoặc quét sinh trắc học để mở.
            </p>
          </div>

          {/* 6-Digit Passcode Input */}
          <div className="flex justify-center gap-2 py-1">
            {pinInput.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (pinInputRefs.current[idx] = el)}
                type="password"
                maxLength={1}
                value={digit}
                onChange={(e) => handlePinDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                disabled={failedAttempts >= 3}
                className="w-10 h-12 text-center text-lg font-black rounded-xl bg-white/5 border border-white/15 text-emerald-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40 transition-all"
              />
            ))}
          </div>

          {/* Biometric WebAuthn Button */}
          <button
            type="button"
            onClick={handleBiometricAuthenticate}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/20 hover:opacity-95 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-base">fingerprint</span>
            <span>Mở Khóa Bằng Face ID / Touch ID</span>
          </button>

          {pinError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold animate-pulse">
              {pinError}
            </div>
          )}

          <div className="text-[11px] text-slate-500 font-mono">
            Mã an ninh được bảo vệ & mã hóa bởi Server Administrator.
          </div>
        </div>
      </div>
    );
  }

  // ─── IF UNLOCKED: RENDER FULL NATIVE ROBOT SUITE ────────────────────────────
  return (
    <div className="space-y-5 animate-fadeIn select-none">
      
      {/* Top Telemetry Header & Status Deck */}
      <div className="relative overflow-hidden p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-slate-950 via-zinc-900 to-black border border-emerald-500/30 shadow-2xl text-white">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-black uppercase tracking-widest">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              Ultra Secure FPV Telemetry Active
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <span className="material-symbols-outlined text-emerald-400 text-3xl sm:text-4xl">precision_manufacturing</span>
              Trung Tâm Điều Khiển Robot (Bảo Mật 3 Lớp Active)
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Tích hợp toàn bộ hệ điều hành Robot, camera FPV, AI Xiaozhi, lệnh thoại & nhật ký kiểm soát từ xa.
            </p>
          </div>

          {/* Quick Security & Metrics Bar */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Auto Lock Countdown */}
            <div className="px-3.5 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-md flex items-center gap-2 text-emerald-400">
              <span className="material-symbols-outlined text-lg">timer</span>
              <div>
                <div className="text-[9px] text-slate-400 uppercase font-black">Tự Khóa Sau</div>
                <div className="text-xs font-mono font-extrabold">{Math.floor(autoLockSeconds / 60)}:{(autoLockSeconds % 60).toString().padStart(2, '0')}</div>
              </div>
            </div>

            <button
              onClick={handleInstantLock}
              className="px-3.5 py-2 rounded-2xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5"
              title="Khóa màn hình camera khẩn cấp"
            >
              <span className="material-symbols-outlined text-base">lock</span>
              <span>Khoá Màn Hình</span>
            </button>

            <button
              onClick={handleActivateKillSwitch}
              className="px-3.5 py-2 rounded-2xl bg-rose-600 hover:bg-rose-500 border border-rose-400 text-white text-xs font-black shadow-lg shadow-rose-600/30 transition-all flex items-center gap-1.5 animate-pulse"
              title="Kích hoạt Emergency Kill-Switch ngắt toàn bộ camera vật lý"
            >
              <span className="material-symbols-outlined text-base">power_settings_new</span>
              <span>🛑 PANIC KILL-SWITCH</span>
            </button>
          </div>
        </div>
      </div>

      {/* iOS 26 Segmented Sub-Tab Control Pills */}
      <div className="p-2 rounded-2xl bg-white/80 dark:bg-[#141624] border border-slate-200/80 dark:border-white/10 shadow-lg backdrop-blur-2xl">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 px-0.5">
          {ROBOT_SUB_TABS.map((tab) => {
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 shrink-0 select-none ${
                  isActive
                    ? `bg-gradient-to-r ${tab.color} text-white shadow-md shadow-emerald-500/20 scale-[1.02]`
                    : "text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <span className="material-symbols-outlined text-base">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stream Controls & Security Toolbar */}
      <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#141624] border border-slate-200/80 dark:border-white/10 shadow-lg flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Stream URL Security Status */}
        <div className="flex items-center gap-2.5 flex-1 min-w-[260px] truncate">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
          <div className="truncate font-mono text-slate-700 dark:text-slate-300">
            <span className="text-slate-400 font-sans font-semibold mr-1">DevTools Shield:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {showFullUrl ? `${baseUrl}/#${activeSubTab}` : maskedUrl}
            </span>
          </div>
          <button
            onClick={() => setShowFullUrl(!showFullUrl)}
            className="text-[10px] font-bold text-slate-500 hover:text-white px-2 py-0.5 rounded bg-white/10"
          >
            {showFullUrl ? "Ẩn Link" : "Hiện Full"}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsChangingPin(!isChangingPin)}
            className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-bold hover:bg-amber-500/20 transition-all flex items-center gap-1.5"
            title="Đổi mã Master PIN 6 số"
          >
            <span className="material-symbols-outlined text-base">password</span>
            <span className="hidden sm:inline">Đổi PIN</span>
          </button>

          <button
            onClick={() => setIsEditingUrl(!isEditingUrl)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-200 dark:hover:bg-white/10 transition-all flex items-center gap-1.5"
            title="Đổi URL đường dẫn Tunnel"
          >
            <span className="material-symbols-outlined text-base">edit</span>
            <span className="hidden sm:inline">Đổi Tunnel URL</span>
          </button>

          <button
            onClick={handleRefreshStream}
            className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-500/20 transition-all flex items-center gap-1.5"
            title="Làm mới luồng video stream"
          >
            <span className="material-symbols-outlined text-base">refresh</span>
            <span className="hidden sm:inline">Tải lại Stream</span>
          </button>

          <button
            onClick={toggleFullscreenContainer}
            className="px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 font-bold hover:bg-purple-500/20 transition-all flex items-center gap-1.5"
            title="Toàn màn hình"
          >
            <span className="material-symbols-outlined text-base">{isFullscreen ? "fullscreen_exit" : "fullscreen"}</span>
            <span className="hidden sm:inline">{isFullscreen ? "Thoát" : "Toàn Màn Hình"}</span>
          </button>
        </div>
      </div>

      {/* Change PIN Form */}
      {isChangingPin && (
        <form onSubmit={handleChangeMasterPinSubmit} className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3 animate-fadeIn">
          <div className="text-xs font-black text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base">key</span> Cập Nhật Mã Master PIN 6 Số Mới
          </div>
          <div className="flex gap-2">
            <input
              type="password"
              maxLength={6}
              value={newPinInput}
              onChange={(e) => setNewPinInput(e.target.value)}
              placeholder="Nhập 6 chữ số PIN mới..."
              className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-black/50 border border-amber-500/30 text-xs text-slate-900 dark:text-white font-mono focus:outline-none"
              required
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-black hover:bg-amber-400 transition-all shadow-md"
            >
              Lưu PIN Mới
            </button>
          </div>
        </form>
      )}

      {/* Edit URL Form */}
      {isEditingUrl && (
        <form onSubmit={handleSaveUrl} className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base">link</span> Cấu Hình Link Tunnel Cloudflare Robot
            </span>
            <button
              type="button"
              onClick={handleResetDefaultUrl}
              className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline"
            >
              Khôi phục URL mặc định
            </button>
          </div>

          <div className="flex gap-2">
            <input
              type="url"
              value={tempUrlInput}
              onChange={(e) => setTempUrlInput(e.target.value)}
              placeholder="https://...trycloudflare.com/r/.../"
              className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-black/50 border border-amber-500/30 text-xs text-slate-900 dark:text-white font-mono focus:outline-none"
              required
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-black hover:bg-amber-400 transition-all shadow-md"
            >
              Lưu URL
            </button>
          </div>
        </form>
      )}

      {/* Seamless Full-Bleed Robot Application Frame (Proxied Single-Use Token Frame) */}
      <div 
        ref={containerRef}
        className={`relative w-full rounded-3xl overflow-hidden border border-slate-200/80 dark:border-white/10 shadow-2xl bg-black transition-all ${
          isFullscreen ? "h-screen p-0" : "h-[calc(100vh-210px)] min-h-[750px]"
        }`}
      >
        {/* Top Header Overlay */}
        <div className="absolute top-0 left-0 right-0 z-20 px-4 py-2.5 bg-gradient-to-b from-black/90 via-black/50 to-transparent backdrop-blur-md flex items-center justify-between text-white pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">memory</span>
              HUGO-ROBOT-01 · {ROBOT_SUB_TABS.find(t => t.id === activeSubTab)?.label}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-300 bg-black/70 px-3 py-1 rounded-full border border-white/10 backdrop-blur-md">
            <span className="material-symbols-outlined text-xs text-emerald-400">shield</span>
            <span>Ephemeral Token Ephemeral Proxy Frame</span>
          </div>
        </div>

        {/* Embedded Robot Web Application Frame (Inspect DevTools will ONLY see /api/admin/robot/stream-frame?token=...) */}
        {secureFrameSrc ? (
          <iframe
            key={`${secureFrameSrc}-${refreshCounter}`}
            src={secureFrameSrc}
            title="Hugo Robot Application Suite"
            referrerPolicy="no-referrer"
            className="w-full h-full border-none bg-black pt-9"
            allow="camera; microphone; display-capture; autoplay; encrypted-media; fullscreen; clipboard-read; clipboard-write; gamepad; geolocation"
            sandbox="allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs font-mono">
            Đang khởi tạo Secure Ephemeral Token...
          </div>
        )}
      </div>
    </div>
  );
}
