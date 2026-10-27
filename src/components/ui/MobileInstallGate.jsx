/**
 * MobileInstallGate.jsx
 *
 * Màn hướng dẫn cài PWA trên điện thoại, theo ngôn ngữ trang hỗ trợ của Apple:
 * nền trơn, chữ hệ thống, video hướng dẫn ở giữa, danh sách bước dạng nhóm
 * (inset grouped), biểu tượng một màu. Các bước theo đúng nền tảng (Safari,
 * trình duyệt trong Zalo/Facebook, Chrome, Samsung Internet, Firefox).
 *
 * Mặc định là cổng của khu thành viên. Trang khác dùng lại được:
 *   title/lede     — lời riêng (vd. trang chiến dịch partner)
 *   copyPath       — đường sẽ chép vào clipboard
 *   allowBypass    — false: bắt buộc dùng app, ẩn "Tiếp tục trên trình duyệt"
 *   onClose        — có thì hiện nút quay lại
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { detectInstallTarget } from "../../config/platform";
import { usePWA } from "../../hooks/usePWA";

// Video hướng dẫn có ba bản (render từ artifacts/pwa-install-guide/source).
// Chữ Nôm dùng bản Việt; ngôn ngữ khác chưa có bản riêng thì xem bản Anh.
function installLang(language = "") {
  const base = language.slice(0, 2);
  if (base === "vi" || language.startsWith("nom")) return "vi";
  return base === "zh" ? "zh" : "en";
}

const COPY = {
  vi: {
    title: "Cài app để tiếp tục",
    lede: "Khu vực thành viên được tối ưu cho ứng dụng Hugo Studio đã cài — mở toàn màn hình, nhanh và gọn.",
    guideFor: (device) => `Hướng dẫn cho ${device}`,
    installNow: "Cài đặt",
    stepsHeader: "Các bước",
    copyLink: "Sao chép liên kết",
    copied: "Đã sao chép",
    bypass: "Tiếp tục trên trình duyệt",
    recheck: "Tôi đã cài xong",
    back: "Quay lại",
    footer: "Trên máy tính, Hugo Studio vẫn dùng bình thường trong trình duyệt.",
    steps: {
      openInSafariInApp: ["Mở bằng Safari", "Trình duyệt trong Zalo hay Facebook không cài được app. Chạm ••• rồi chọn “Mở trong Safari”."],
      openInChromeInApp: ["Mở bằng Chrome", "Trình duyệt trong Zalo hay Facebook không cài được app. Chạm ⋮ rồi chọn “Mở bằng trình duyệt khác” → Chrome."],
      switchToSafari: ["Chuyển sang Safari", "Trên iPhone, chỉ Safari cài app ổn định. Sao chép liên kết rồi dán vào Safari."],
      share: ["Chạm nút Chia sẻ", "Ô vuông có mũi tên hướng lên, ở thanh dưới cùng của Safari."],
      addHome: ["Chọn “Thêm vào Màn hình chính”", "Kéo danh sách lên nếu chưa thấy."],
      webApp: ["Bật “Mở dưới dạng ứng dụng web”, chạm Thêm", "Công tắc này giúp app mở toàn màn hình."],
      openIcon: ["Mở từ màn hình chính", "Chạm biểu tượng Hugo Studio vừa tạo."],
      chromeMenu: ["Chạm ⋮ ở góc trên bên phải", "Menu của Chrome hoặc Edge."],
      chromeInstall: ["Chọn “Cài đặt ứng dụng”, rồi xác nhận", "Một số máy ghi là “Thêm vào màn hình chính”."],
      samsungMenu: ["Chạm ☰ ở góc dưới bên phải", "Thanh công cụ của Samsung Internet."],
      samsungAdd: ["Chọn “Thêm trang vào” → “Màn hình chính”", "Rồi chạm Thêm."],
      firefoxMenu: ["Chạm ⋮ ở góc trên bên phải", "Menu của Firefox."],
      firefoxAdd: ["Chọn “Thêm vào Màn hình chính”", "Giữ nguyên tên rồi xác nhận."],
    },
  },
  en: {
    title: "Install the app to continue",
    lede: "The member area is built for the installed Hugo Studio app — full screen, fast and clean.",
    guideFor: (device) => `Guide for ${device}`,
    installNow: "Install",
    stepsHeader: "Steps",
    copyLink: "Copy link",
    copied: "Copied",
    bypass: "Continue in the browser",
    recheck: "I've installed it",
    back: "Back",
    footer: "On a computer, Hugo Studio works as usual in the browser.",
    steps: {
      openInSafariInApp: ["Open in Safari", "In-app browsers like Zalo or Facebook can't install apps. Tap ••• and choose “Open in Safari”."],
      openInChromeInApp: ["Open in Chrome", "In-app browsers like Zalo or Facebook can't install apps. Tap ⋮ and choose “Open in another browser” → Chrome."],
      switchToSafari: ["Switch to Safari", "On iPhone, only Safari installs apps reliably. Copy the link and paste it into Safari."],
      share: ["Tap Share", "The square with an arrow pointing up, in Safari's bottom bar."],
      addHome: ["Choose “Add to Home Screen”", "Scroll the list up if you don't see it."],
      webApp: ["Turn on “Open as Web App”, tap Add", "This switch makes the app open full screen."],
      openIcon: ["Open it from your home screen", "Tap the new Hugo Studio icon."],
      chromeMenu: ["Tap ⋮ in the top right", "The Chrome or Edge menu."],
      chromeInstall: ["Choose “Install app”, then confirm", "Some phones say “Add to Home screen”."],
      samsungMenu: ["Tap ☰ in the bottom right", "Samsung Internet's toolbar."],
      samsungAdd: ["Choose “Add page to” → “Home screen”", "Then tap Add."],
      firefoxMenu: ["Tap ⋮ in the top right", "The Firefox menu."],
      firefoxAdd: ["Choose “Add to Home screen”", "Keep the name and confirm."],
    },
  },
  zh: {
    title: "安装 App 以继续",
    lede: "会员区专为已安装的 Hugo Studio App 优化——全屏、流畅、简洁。",
    guideFor: (device) => `${device} 安装指南`,
    installNow: "安装",
    stepsHeader: "步骤",
    copyLink: "拷贝链接",
    copied: "已拷贝",
    bypass: "继续在浏览器中使用",
    recheck: "我已安装",
    back: "返回",
    footer: "在电脑上，Hugo Studio 仍可在浏览器中正常使用。",
    steps: {
      openInSafariInApp: ["用 Safari 打开", "Zalo、Facebook 内置浏览器无法安装 App。点按 •••，选择“在 Safari 中打开”。"],
      openInChromeInApp: ["用 Chrome 打开", "Zalo、Facebook 内置浏览器无法安装 App。点按 ⋮，选择“用其他浏览器打开”→ Chrome。"],
      switchToSafari: ["切换到 Safari", "在 iPhone 上，只有 Safari 能稳定安装 App。拷贝链接后粘贴到 Safari。"],
      share: ["点按“共享”", "Safari 底部栏中带向上箭头的方框。"],
      addHome: ["选择“添加到主屏幕”", "没看到的话，把列表往上滑。"],
      webApp: ["打开“作为网页 App 打开”，点按添加", "这样 App 会全屏打开。"],
      openIcon: ["从主屏幕打开", "点按新建的 Hugo Studio 图标。"],
      chromeMenu: ["点按右上角的 ⋮", "Chrome 或 Edge 的菜单。"],
      chromeInstall: ["选择“安装应用”并确认", "部分手机显示为“添加到主屏幕”。"],
      samsungMenu: ["点按右下角的 ☰", "Samsung Internet 的工具栏。"],
      samsungAdd: ["选择“添加页面到”→“主屏幕”", "然后点按添加。"],
      firefoxMenu: ["点按右上角的 ⋮", "Firefox 的菜单。"],
      firefoxAdd: ["选择“添加到主屏幕”", "保留名称并确认。"],
    },
  },
};

/** Danh sách khoá bước theo đúng nền tảng/trình duyệt đang dùng. */
function stepKeys({ iOS, android, inApp, browser }) {
  if (iOS) {
    const safari = ["share", "addHome", "webApp", "openIcon"];
    if (inApp) return ["openInSafariInApp", ...safari];
    if (browser !== "safari") return ["switchToSafari", ...safari];
    return safari;
  }
  if (inApp) return ["openInChromeInApp", "chromeMenu", "chromeInstall", "openIcon"];
  if (android && browser === "samsung") return ["samsungMenu", "samsungAdd", "openIcon"];
  if (android && browser === "firefox") return ["firefoxMenu", "firefoxAdd", "openIcon"];
  return ["chromeMenu", "chromeInstall", "openIcon"];
}

const linkClass = "text-[17px] text-[#0071e3] dark:text-[#2997ff] active:opacity-60";

export default function MobileInstallGate({
  onBypass,
  title,
  lede,
  copyPath = "/member/today",
  allowBypass = true,
  onClose,
}) {
  const target = detectInstallTarget();
  const { i18n } = useTranslation();
  const lang = installLang(i18n.resolvedLanguage || i18n.language);
  const t = COPY[lang];
  const { canInstall, install } = usePWA();
  const [copied, setCopied] = useState(false);
  const steps = stepKeys(target).map((key) => t.steps[key]);
  const device = target.iOS ? "iPhone & iPad" : "Android";

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin + copyPath);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const handleBypassWeb = () => {
    try {
      sessionStorage.setItem("pwa_gate_dismissed", "true");
    } catch { /* storage bị chặn */ }
    if (onBypass) onBypass();
    else window.location.reload();
  };

  return (
    <div className="min-h-[100dvh] bg-[#f5f5f7] text-[#1d1d1f] dark:bg-black dark:text-[#f5f5f7] antialiased">
      <div className="mx-auto w-full max-w-md px-5 pb-[calc(2.5rem+env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
        {onClose ? (
          <button type="button" onClick={onClose} className={`-ml-1 inline-flex h-11 items-center gap-0.5 ${linkClass}`}>
            <span className="material-symbols-outlined text-[26px]" aria-hidden="true">chevron_left</span>
            {t.back}
          </button>
        ) : (
          <div className="h-11" />
        )}

        <header className="mt-4 flex flex-col items-center text-center">
          <img
            src="/favicon/web-app-manifest-512x512.png"
            alt=""
            width="76"
            height="76"
            className="size-[76px] rounded-[22%] shadow-[0_8px_24px_-10px_rgba(0,0,0,.35)]"
          />
          <h1 className="mt-5 text-[30px] font-semibold leading-tight tracking-[-0.02em] [text-wrap:balance]">
            {title || t.title}
          </h1>
          <p className="mt-2 max-w-[22rem] text-[17px] leading-snug text-[#6e6e73] dark:text-[#a1a1a6]">
            {lede || t.lede}
          </p>
        </header>

        <video
          key={lang}
          src={`/video/pwa-install/${lang}.mp4`}
          poster={`/video/pwa-install/${lang}.jpg`}
          controls
          playsInline
          preload="none"
          className="mx-auto mt-7 block aspect-[9/16] w-full max-w-[300px] rounded-[28px] bg-white object-cover shadow-[0_20px_50px_-24px_rgba(0,0,0,.35)] dark:bg-[#1c1c1e]"
        />

        {canInstall && (
          <button
            type="button"
            onClick={install}
            className="mt-7 flex h-[52px] w-full items-center justify-center rounded-full bg-[#0071e3] text-[17px] font-semibold text-white active:opacity-80"
          >
            {t.installNow}
          </button>
        )}

        <section className="mt-8" aria-labelledby="install-steps">
          <div className="flex items-baseline justify-between px-4 pb-2">
            <h2 id="install-steps" className="text-[13px] font-normal uppercase tracking-[0.02em] text-[#6e6e73] dark:text-[#8e8e93]">
              {t.stepsHeader}
            </h2>
            <span className="text-[13px] text-[#6e6e73] dark:text-[#8e8e93]">{t.guideFor(device)}</span>
          </div>
          <ol className="overflow-hidden rounded-2xl bg-white dark:bg-[#1c1c1e]">
            {steps.map(([stepTitle, desc], index) => (
              <li key={stepTitle} className="flex gap-3.5 px-4 py-3.5 [&+&]:border-t [&+&]:border-black/[.08] dark:[&+&]:border-white/10">
                <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-[#e8e8ed] text-[14px] font-semibold dark:bg-[#2c2c2e]">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-[17px] font-medium leading-snug">{stepTitle}</p>
                  <p className="mt-0.5 text-[15px] leading-snug text-[#6e6e73] dark:text-[#a1a1a6]">{desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <div className="mt-6 overflow-hidden rounded-2xl bg-white dark:bg-[#1c1c1e]">
          <button type="button" onClick={copyLink} className={`flex h-12 w-full items-center justify-between px-4 ${linkClass}`}>
            {copied ? t.copied : t.copyLink}
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">{copied ? "check" : "content_copy"}</span>
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className={`flex h-12 w-full items-center justify-between border-t border-black/[.08] px-4 dark:border-white/10 ${linkClass}`}
          >
            {t.recheck}
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">refresh</span>
          </button>
        </div>

        {allowBypass && (
          <button type="button" onClick={handleBypassWeb} className="mx-auto mt-5 block text-[15px] text-[#6e6e73] underline-offset-4 active:opacity-60 dark:text-[#a1a1a6]">
            {t.bypass}
          </button>
        )}

        <p className="mt-6 px-4 text-center text-[13px] leading-snug text-[#86868b]">{t.footer}</p>
      </div>
    </div>
  );
}
