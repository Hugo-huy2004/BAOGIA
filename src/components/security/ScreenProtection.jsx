import { useEffect, useState, useCallback } from "react";

/**
 * Danh sách thông điệp cảnh báo bảo mật dịch ra 9 ngôn ngữ chính thức của Hugo Studio:
 * "Hugo Studio phát hiện bạn chụp màn hình, chúng tôi không cho phép điều đó để
 * tránh tiết lộ thông tin cá nhân hoá người dùng"
 */
const SECURITY_TRANSLATIONS = [
  {
    code: "vi",
    flag: "🇻🇳",
    label: "Tiếng Việt",
    message: "Hugo Studio phát hiện bạn chụp màn hình, chúng tôi không cho phép điều đó để tránh tiết lộ thông tin cá nhân hoá người dùng.",
  },
  {
    code: "en",
    flag: "🇺🇸",
    label: "English",
    message: "Hugo Studio detected a screenshot attempt. We do not allow screen capture to prevent disclosure of personalized user information.",
  },
  {
    code: "zh",
    flag: "🇨🇳",
    label: "中文",
    message: "Hugo Studio 检测到截屏操作。为防止泄露用户个性化信息，我们不允许进行屏幕截图。",
  },
  {
    code: "ja",
    flag: "🇯🇵",
    label: "日本語",
    message: "Hugo Studioがスクリーンショットを検知しました。ユーザーのパーソナライズ情報の漏洩を防ぐため、画面の撮影は許可されていません。",
  },
  {
    code: "ko",
    flag: "🇰🇷",
    label: "한국어",
    message: "Hugo Studio가 스크린샷 시도를 감지했습니다. 개인화된 사용자 정보 유출을 방지하기 위해 화면 캡처가 허용되지 않습니다.",
  },
  {
    code: "th",
    flag: "🇹🇭",
    label: "ไทย",
    message: "Hugo Studio ตรวจพบการจับภาพหน้าจอ เราไม่อนุญาตให้ทำเช่นนั้นเพื่อป้องกันการเปิดเผยข้อมูลส่วนบุคคลของผู้ใช้",
  },
  {
    code: "id",
    flag: "🇮🇩",
    label: "Bahasa Indonesia",
    message: "Hugo Studio mendeteksi tangkapan layar. Kami tidak mengizinkan pengambilan gambar layar untuk mencegah kebocoran informasi personalisasi pengguna.",
  },
  {
    code: "es",
    flag: "🇪🇸",
    label: "Español",
    message: "Hugo Studio ha detectado un intento de captura de pantalla. No permitimos la captura de pantalla para evitar la divulgación de información personalizada del usuario.",
  },
  {
    code: "fr",
    flag: "🇫🇷",
    label: "Français",
    message: "Hugo Studio a détecté une tentative de capture d'écran. Nous n'autorisons pas la capture d'écran afin d'éviter la divulgation d'informations personnalisées de l'utilisateur.",
  },
];

export default function ScreenProtection() {
  const [blackout, setBlackout] = useState(false);
  const [countdown, setCountdown] = useState(6);
  const [obfuscated, setObfuscated] = useState(false);

  const triggerBlackout = useCallback(() => {
    setBlackout(true);
    setCountdown(6);
  }, []);

  const dismissBlackout = useCallback(() => {
    setBlackout(false);
  }, []);

  // Đếm ngược tự đóng màn hình đen
  useEffect(() => {
    if (!blackout) return undefined;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setBlackout(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [blackout]);

  useEffect(() => {
    // 1. Chống copy/cut toàn hệ thống
    const handleCopyCut = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleSelectStart = (e) => {
      // Cho phép chọn chữ trong input / textarea nếu đang gõ
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || e.target?.isContentEditable) {
        return;
      }
      e.preventDefault();
    };

    // 2. Chống Zoom dưới mọi hình thức (Ctrl/Cmd + Wheel, phím tắt, Safari gestures)
    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };

    const handleGesture = (e) => {
      e.preventDefault();
    };

    // 3. Bắt phím tắt Zoom + Copy + Phím chụp màn hình (PrintScreen, Cmd+Shift+3/4/5, Win+Shift+S)
    const handleKeyDown = (e) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      const key = e.key;

      // ── Bắt phím tắt ZOOM (Ctrl/Cmd + '+', '-', '=', '0') ──
      if (
        isCtrlOrCmd &&
        (key === "+" ||
          key === "-" ||
          key === "=" ||
          key === "0" ||
          e.code === "NumpadAdd" ||
          e.code === "NumpadSubtract" ||
          e.code === "Numpad0")
      ) {
        e.preventDefault();
        return;
      }

      // ── Bắt phím tắt COPY / CUT / VIEW SOURCE (Ctrl/Cmd + C, X, U) ──
      if (isCtrlOrCmd && (key === "c" || key === "C" || key === "x" || key === "X" || key === "u" || key === "U")) {
        const tag = e.target?.tagName?.toLowerCase();
        if (!(tag === "input" || tag === "textarea" || e.target?.isContentEditable)) {
          e.preventDefault();
        }
      }

      // ── Bắt phím CHỤP MÀN HÌNH (PrintScreen, Snipping Tool, Mac Shortcut) ──
      if (
        key === "PrintScreen" ||
        e.code === "PrintScreen" ||
        (e.metaKey && e.shiftKey && (key === "3" || key === "4" || key === "5" || key === "6")) ||
        (e.shiftKey && (e.metaKey || e.winKey || e.key === "OS") && (key === "s" || key === "S")) ||
        (isCtrlOrCmd && (key === "p" || key === "P"))
      ) {
        e.preventDefault();
        triggerBlackout();
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === "PrintScreen" || e.code === "PrintScreen") {
        e.preventDefault();
        triggerBlackout();
      }
    };

    // 4. Chỉ che khi tài liệu thật sự chuyển nền. `window.blur` cũng chạy khi
    // người dùng bấm DevTools hoặc hộp thoại hệ thống và từng làm app đen vĩnh viễn.
    const handleVisibilityChange = () => {
      if (document.hidden || document.visibilityState === "hidden") {
        setObfuscated(true);
      } else {
        setObfuscated(false);
      }
    };

    // Đăng ký event listeners toàn cục
    document.addEventListener("copy", handleCopyCut, true);
    document.addEventListener("cut", handleCopyCut, true);
    document.addEventListener("selectstart", handleSelectStart, true);
    window.addEventListener("wheel", handleWheel, { passive: false });
    document.addEventListener("gesturestart", handleGesture, { passive: false });
    document.addEventListener("gesturechange", handleGesture, { passive: false });
    document.addEventListener("gestureend", handleGesture, { passive: false });
    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("keyup", handleKeyUp, true);
    document.addEventListener("visibilitychange", handleVisibilityChange, true);

    return () => {
      document.removeEventListener("copy", handleCopyCut, true);
      document.removeEventListener("cut", handleCopyCut, true);
      document.removeEventListener("selectstart", handleSelectStart, true);
      window.removeEventListener("wheel", handleWheel);
      document.removeEventListener("gesturestart", handleGesture);
      document.removeEventListener("gesturechange", handleGesture);
      document.removeEventListener("gestureend", handleGesture);
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("keyup", handleKeyUp, true);
      document.removeEventListener("visibilitychange", handleVisibilityChange, true);
    };
  }, [triggerBlackout]);

  return (
    <>
      {/* ── MÀN HÌNH ĐEN ẨN DANH KHI MẤT FOCUS ── */}
      {obfuscated && !blackout && (
        <div
          className="fixed inset-0 z-[9999999] bg-black pointer-events-none"
          style={{ backgroundColor: "#000000" }}
        />
      )}

      {/* ── MÀN HÌNH ĐEN FULLSCREEN NẾU PHÁT HIỆN CHỤP MÀN HÌNH ── */}
      {blackout && (
        <div
          id="screenshot-blackout-overlay"
          className="fixed inset-0 z-[9999999] bg-black text-white flex flex-col items-center justify-between p-6 sm:p-10 overflow-y-auto select-none font-sans"
          style={{ backgroundColor: "#000000" }}
        >
          {/* Header cảnh báo */}
          <header className="flex flex-col items-center text-center pt-4 space-y-3 max-w-2xl">
            <div className="w-16 h-16 rounded-full bg-red-950/80 border border-red-500/40 flex items-center justify-center text-red-500 shadow-2xl shadow-red-900/50 animate-pulse">
              <span className="material-symbols-outlined text-4xl">no_photography</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Hugo Studio Security Alert
            </h1>
            <p className="text-xs uppercase tracking-widest text-red-400 font-semibold">
              Hệ thống bảo vệ thông tin cá nhân hoá người dùng
            </p>
          </header>

          {/* Khung 9 ngôn ngữ */}
          <div className="w-full max-w-4xl my-6 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-left">
            {SECURITY_TRANSLATIONS.map((item) => (
              <div
                key={item.code}
                className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 shadow-lg flex items-start space-x-3.5"
              >
                <span className="text-2xl flex-shrink-0 leading-none pt-0.5">{item.flag}</span>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                      {item.label}
                    </span>
                    <span className="text-[10px] text-red-400 font-mono">PROTECTED</span>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-200 font-medium leading-relaxed">
                    {item.message}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer & Nút đóng */}
          <footer className="w-full max-w-md pb-4 flex flex-col items-center space-y-3 text-center">
            <button
              type="button"
              onClick={dismissBlackout}
              className="w-full min-h-[48px] px-6 rounded-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 active:scale-95 text-white font-bold text-sm tracking-wide shadow-xl shadow-red-950/60 transition-all flex items-center justify-center space-x-2"
            >
              <span className="material-symbols-outlined text-lg">shield</span>
              <span>Đã hiểu ({countdown}s) — Quay lại ứng dụng</span>
            </button>
            <p className="text-[11px] text-zinc-500">
              Chính sách bảo mật Hugo Studio © 2026. Mọi hành vi sao chép hay chụp màn hình đều bị chặn.
            </p>
          </footer>
        </div>
      )}

      {/* ── BẢO VỆ IN ẤN/EXPORT PDF BẰNG CSS MEDIA PRINT ── */}
      <style>{`
        @media print {
          html, body {
            background-color: #000000 !important;
            color: #ffffff !important;
          }
          body * {
            display: none !important;
          }
          html::before {
            content: "Hugo Studio phát hiện bạn chụp màn hình / in ấn. Chúng tôi không cho phép điều đó để tránh tiết lộ thông tin cá nhân hoá người dùng.\\n\\nHugo Studio detected a screenshot / print attempt. We do not allow screen capture to prevent disclosure of personalized user information.";
            display: flex !important;
            position: fixed !important;
            inset: 0 !important;
            background: #000000 !important;
            color: #ffffff !important;
            font-size: 20px !important;
            font-weight: bold !important;
            text-align: center !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 40px !important;
            white-space: pre-wrap !important;
            z-index: 99999999 !important;
          }
        }
      `}</style>
    </>
  );
}
