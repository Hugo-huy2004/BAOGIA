import { useState, useRef, useMemo, useEffect } from "react";
import robotApi from "../../services/api/RobotApi";

const DEFAULT_ROBOT_URL = "";

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

export default function AdminRobotTab({ deepLinkToken = "" }) {
  // OTP Auth States
  const [otpStep, setOtpStep] = useState(() => (deepLinkToken ? "unlocked" : "idle"));
  const [otpTempToken, setOtpTempToken] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [otpDelivered, setOtpDelivered] = useState(null);
  const [sessionToken, setSessionToken] = useState(deepLinkToken);
  const [sessionCountdown, setSessionCountdown] = useState(deepLinkToken ? 600 : 0);
  const [isKillSwitchActive, setIsKillSwitchActive] = useState(false);

  // Ephemeral Stream Token State
  const [streamToken, setStreamToken] = useState("");
  const [streamTokenError, setStreamTokenError] = useState("");
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

  const containerRef = useRef(null);
  const otpInputRefs = useRef([]);

  // Anti-DevTools
  useEffect(() => {
    const handleDevToolsKey = (e) => {
      if (e.key === "F12" || (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C")) || (e.metaKey && e.altKey && e.key === "I")) {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", handleDevToolsKey);
    return () => window.removeEventListener("keydown", handleDevToolsKey);
  }, []);

  // Deep-link: auto-request stream token when unlocked via Telegram link
  useEffect(() => {
    if (deepLinkToken && otpStep === "unlocked") {
      // Clean URL (remove robotToken param)
      const url = new URL(window.location);
      url.searchParams.delete("robotToken");
      window.history.replaceState({}, "", url.pathname + url.search);
      requestStreamToken(deepLinkToken);
    }
  }, [deepLinkToken]);

  // OTP request countdown (resend cooldown)
  useEffect(() => {
    if (otpCountdown <= 0) return;
    const timer = setInterval(() => {
      setOtpCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCountdown]);

  // Session expiry countdown (auto-lock after 5 min)
  useEffect(() => {
    if (otpStep !== "unlocked" || sessionCountdown <= 0) return;
    const timer = setInterval(() => {
      setSessionCountdown((prev) => {
        if (prev <= 1) {
          handleInstantLock();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [otpStep, sessionCountdown]);

  // ── OTP Flow Handlers ──────────────────────────────────────────────────

  const handleRequestOtp = async () => {
    try {
      setOtpError("");
      setOtpStep("requesting");
      const res = await robotApi.requestOtp();
      if (res.success && res.tempToken) {
        setOtpTempToken(res.tempToken);
        setOtpDelivered(res.otpDelivered);
        setOtpCountdown(res.expiresIn || 300);
        setOtpStep("verifying");
        setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
      }
    } catch (err) {
      setOtpError(err.message || "Lỗi gửi mã OTP");
      setOtpStep("idle");
    }
  };

  const handleOtpDigitChange = async (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = value;
    setOtpDigits(newDigits);
    setOtpError("");

    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    if (newDigits.every((d) => d !== "")) {
      const code = newDigits.join("");
      try {
        const res = await robotApi.verifyOtp(otpTempToken, code);
        if (res.success && res.sessionToken) {
          setSessionToken(res.sessionToken);
          setSessionCountdown(res.expiresIn || 300);
          setOtpStep("unlocked");
          setOtpDigits(["", "", "", "", "", ""]);
          await requestStreamToken(res.sessionToken);
        }
      } catch (err) {
        const newFailed = otpDigits.filter((d) => d !== "").length;
        setOtpError(err.message || "Mã OTP không chính xác");
        setOtpDigits(["", "", "", "", "", ""]);
        otpInputRefs.current[0]?.focus();
      }
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleInstantLock = () => {
    setOtpStep("idle");
    setSessionToken("");
    setStreamToken("");
    setOtpDigits(["", "", "", "", "", ""]);
    setOtpError("");
    setOtpTempToken("");
    setSessionCountdown(0);
  };

  // ── Stream Token ───────────────────────────────────────────────────────

  const requestStreamToken = async (token = sessionToken) => {
    try {
      setStreamTokenError("");
      const res = await robotApi.getStreamToken(token);
      if (res.success && res.streamToken) {
        setStreamToken(res.streamToken);
      }
    } catch (err) {
      if (err.message.includes("Phiên đăng nhập đã hết hạn")) {
        setStreamTokenError("Phiên đăng nhập đã hết hạn. Đang chuyển về trang đăng nhập...");
        return;
      }
      setStreamTokenError(err.message || "Lỗi khởi tạo phiên bảo mật");
    }
  };

  // ── Action Handlers ────────────────────────────────────────────────────

  const handleActivateKillSwitch = async () => {
    if (window.confirm("🚨 BẠN CÓ CHẮC CHẮN MUỐN KÍCH HOẠT EMERGENCY KILL-SWITCH CẮT TOÀN BỘ CAMERA ROBOT TỨC THÌ?")) {
      try {
        const res = await robotApi.toggleKillSwitch(sessionToken, "activate");
        setIsKillSwitchActive(true);
        handleInstantLock();
        alert(res.message || "Đã ngắt kết nối Camera Robot khẩn cấp!");
      } catch (err) {
        alert(err.message || "Lỗi kích hoạt Kill Switch");
      }
    }
  };

  const handleRefreshStream = async () => {
    await requestStreamToken(sessionToken);
    setRefreshCounter((prev) => prev + 1);
  };

  const handleSaveUrl = async (e) => {
    e?.preventDefault();
    const cleanUrl = tempUrlInput.trim().replace(/#.*$/, "");
    if (cleanUrl) {
      setBaseUrl(cleanUrl);
      localStorage.setItem("hugo_admin_robot_stream_url", cleanUrl);
      setRefreshCounter((prev) => prev + 1);
      try {
        await robotApi.updateConfig(sessionToken, cleanUrl);
        await requestStreamToken(sessionToken);
        alert("Đã mã hóa 3 lớp và lưu URL mới vào MongoDB!");
      } catch (err) {
        console.error("Failed persisting triple encrypted URL to DB:", err);
      }
    }
    setIsEditingUrl(false);
  };

  const handleResetDefaultUrl = () => {
    const defaultClean = DEFAULT_ROBOT_URL.replace(/#.*$/, "");
    setBaseUrl(defaultClean);
    setTempUrlInput(defaultClean);
    localStorage.setItem("hugo_admin_robot_stream_url", defaultClean);
    setRefreshCounter((prev) => prev + 1);
    setIsEditingUrl(false);
  };

  const toggleFullscreenContainer = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // ── Derived ────────────────────────────────────────────────────────────

  const secureFrameSrc = useMemo(() => {
    if (!streamToken) return "";
    return `/api/admin/robot/stream-frame?token=${streamToken}&tab=${activeSubTab}&r=${refreshCounter}`;
  }, [streamToken, activeSubTab, refreshCounter]);

  const maskedUrl = useMemo(() => {
    return baseUrl.replace(/(https?:\/\/)[^.]+\.(.*)/, "$1********.$2");
  }, [baseUrl]);

  const formatCountdown = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  // ─── IF LOCKED: RENDER OTP VAULT ───────────────────────────────────────
  if (otpStep !== "unlocked") {
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
              Bảo Mật Camera — OTP Telegram
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">
              {otpStep === "idle" && "Xác Thúc Camera Robot"}
              {otpStep === "requesting" && "Đang Gửi Mã OTP..."}
              {otpStep === "verifying" && "Nhập Mã OTP 6 Chữ Số"}
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              {otpStep === "idle" && "Bấm nút bên dưới để nhận mã OTP 6 chữ số qua Telegram. Mã có hiệu lực 5 phút."}
              {otpStep === "requesting" && "Đang gửi mã xác thực qua Telegram..."}
              {otpStep === "verifying" && (
                <>
                  Mã đã gửi tới Telegram.
                  {otpCountdown > 0 && <span className="text-emerald-400 font-mono"> Còn {formatCountdown(otpCountdown)}</span>}
                </>
              )}
            </p>
          </div>

          {/* Step: Idle — Request OTP Button */}
          {otpStep === "idle" && (
            <button
              type="button"
              onClick={handleRequestOtp}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold text-sm shadow-lg shadow-emerald-500/20 hover:opacity-95 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-base">send</span>
              Gửi Mã OTP Qua Telegram
            </button>
          )}

          {/* Step: Requesting — Loading */}
          {otpStep === "requesting" && (
            <div className="flex items-center justify-center gap-3 py-3">
              <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs text-emerald-400 font-bold">Đang gửi mã...</span>
            </div>
          )}

          {/* Step: Verifying — OTP Input */}
          {otpStep === "verifying" && (
            <>
              <div className="flex justify-center gap-2 py-1">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpInputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpDigitChange(idx, e.target.value.replace(/\D/g, ""))}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-11 h-13 text-center text-xl font-black rounded-xl bg-white/5 border border-white/15 text-emerald-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40 transition-all"
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={handleRequestOtp}
                disabled={otpCountdown > 0}
                className={`w-full py-3 rounded-2xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 ${
                  otpCountdown > 0
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                    : "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 hover:opacity-95"
                }`}
              >
                <span className="material-symbols-outlined text-base">refresh</span>
                {otpCountdown > 0 ? `Gửi lại sau ${formatCountdown(otpCountdown)}` : "Gửi lại mã OTP"}
              </button>
            </>
          )}

          {/* Error */}
          {otpError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold animate-pulse">
              {otpError}
            </div>
          )}

          {/* Delivery status */}
          {otpStep === "verifying" && otpDelivered === false && (
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px]">
              Telegram chưa cấu hình. Xem mã OTP trong log server.
            </div>
          )}

          <div className="text-[11px] text-slate-500 font-mono">
            Mã OTP hết hiệu lực sau 5 phút. Bảo vệ bởi Server Administrator.
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
              Trung Tâm Điều Khiển Robot (OTP Verified)
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Tích hợp toàn bộ hệ điều hành Robot, camera FPV, AI Xiaozhi, lệnh thoại & nhật ký kiểm soát từ xa.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Session Countdown */}
            <div className="px-3.5 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-md flex items-center gap-2 text-emerald-400">
              <span className="material-symbols-outlined text-lg">timer</span>
              <div>
                <div className="text-[9px] text-slate-400 uppercase font-black">Phiên Còn</div>
                <div className="text-xs font-mono font-extrabold">{formatCountdown(sessionCountdown)}</div>
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

      {/* Sub-Tab Pills */}
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

      {/* Stream Controls */}
      <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-[#141624] border border-slate-200/80 dark:border-white/10 shadow-lg flex flex-wrap items-center justify-between gap-3 text-xs">
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

        <div className="flex items-center gap-2 shrink-0">
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

      {/* Robot Application Frame */}
      <div
        ref={containerRef}
        className={`relative w-full rounded-3xl overflow-hidden border border-slate-200/80 dark:border-white/10 shadow-2xl bg-black transition-all ${
          isFullscreen ? "h-screen p-0" : "h-[calc(100vh-210px)] min-h-[750px]"
        }`}
      >
        <div className="absolute top-0 left-0 right-0 z-20 px-4 py-2.5 bg-gradient-to-b from-black/90 via-black/50 to-transparent backdrop-blur-md flex items-center justify-between text-white pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">memory</span>
              HUGO-ROBOT-01 · {ROBOT_SUB_TABS.find((t) => t.id === activeSubTab)?.label}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-300 bg-black/70 px-3 py-1 rounded-full border border-white/10 backdrop-blur-md">
            <span className="material-symbols-outlined text-xs text-emerald-400">shield</span>
            <span>OTP Verified Session</span>
          </div>
        </div>

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
        ) : streamTokenError ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-rose-400">
            <span className="material-symbols-outlined text-5xl">error</span>
            <div className="text-center space-y-2">
              <p className="text-sm font-bold">{streamTokenError}</p>
              <p className="text-xs text-slate-500">Phiên OTP đã hết hạn. Vui lòng xác thực lại.</p>
            </div>
            <button
              onClick={handleInstantLock}
              className="px-4 py-2 rounded-xl bg-rose-500 text-white text-xs font-bold hover:bg-rose-400 transition-all"
            >
              Xác thực lại
            </button>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs font-mono">
            Đang khởi tạo Secure Ephemeral Token...
          </div>
        )}
      </div>
    </div>
  );
}
