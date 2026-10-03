/**
 * MobileInstallGate.jsx
 *
 * Màn hình chuẩn phong cách SwiftUI Liquid Glass (@expo/ui/swift-ui)
 * Hướng dẫn cài đặt PWA theo đúng nền tảng (iOS Safari, Android Chrome, Samsung Internet...)
 * đồng thời cung cấp tuỳ chọn "Tiếp tục trên trình duyệt" để không chặn người dùng hay lập trình viên thử nghiệm.
 */

import { useState } from "react";
import { detectInstallTarget } from "../../config/platform";
import { usePWA } from "../../hooks/usePWA";
import { SwiftUIButton } from "./swiftui";

const SAFARI_STEPS = [
  {
    icon: "ios_share",
    tint: "from-blue-500 to-indigo-600",
    title: "Nhấn nút Chia sẻ",
    desc: "Ô vuông có mũi tên hướng lên, nằm giữa thanh công cụ dưới cùng của Safari.",
  },
  {
    icon: "add_box",
    tint: "from-purple-500 to-pink-600",
    title: 'Chọn "Thêm vào MH chính"',
    desc: 'Vuốt danh sách lên tới mục "Thêm vào Màn hình chính" (Add to Home Screen).',
  },
  {
    icon: "check_circle",
    tint: "from-emerald-500 to-teal-600",
    title: 'Nhấn "Thêm"',
    desc: "Nút ở góc trên bên phải. Icon Hugo Studio xuất hiện ngay trên màn hình chính.",
  },
  {
    icon: "touch_app",
    tint: "from-sky-500 to-cyan-600",
    title: "Mở app từ màn hình chính",
    desc: "Thoát Safari và mở bằng icon vừa tạo — từ đây app chạy full màn hình.",
  },
];

function stepsFor({ iOS, android, inApp, browser }) {
  const openInSystemBrowser = {
    icon: "open_in_new",
    tint: "from-amber-500 to-orange-600",
    title: iOS ? "Mở lại bằng Safari" : "Mở lại bằng Chrome",
    desc: iOS
      ? 'Trình duyệt bên trong Zalo/Facebook không cài được app. Nhấn "..." ở góc màn hình rồi chọn "Mở trong Safari", hoặc sao chép liên kết bên dưới và dán vào Safari.'
      : 'Trình duyệt bên trong Zalo/Facebook không cài được app. Nhấn "⋮" ở góc màn hình rồi chọn "Mở bằng trình duyệt khác" → Chrome, hoặc sao chép liên kết bên dưới và dán vào Chrome.',
  };

  if (iOS) {
    const steps = [...SAFARI_STEPS];
    if (inApp) return [openInSystemBrowser, ...steps];
    if (browser !== "safari") {
      return [
        {
          icon: "open_in_new",
          tint: "from-blue-500 to-sky-600",
          title: "Chuyển sang Safari",
          desc: "Trên iPhone chỉ Safari cài app ổn định. Sao chép liên kết bên dưới, mở Safari và dán vào thanh địa chỉ.",
        },
        ...steps,
      ];
    }
    return steps;
  }

  if (inApp) {
    return [
      openInSystemBrowser,
      {
        icon: "install_mobile",
        tint: "from-blue-500 to-indigo-600",
        title: 'Chọn "Cài đặt ứng dụng"',
        desc: "Chrome sẽ tự hiện thanh mời cài. Nếu không thấy, mở menu ⋮ ở góc trên bên phải.",
      },
    ];
  }

  if (android && browser === "samsung") {
    return [
      {
        icon: "menu",
        tint: "from-purple-500 to-indigo-600",
        title: "Nhấn nút ☰ ở góc dưới bên phải",
        desc: "Thanh công cụ của Samsung Internet nằm ở cạnh dưới màn hình.",
      },
      {
        icon: "add_to_home_screen",
        tint: "from-cyan-500 to-blue-600",
        title: 'Chọn "Thêm trang vào"',
        desc: 'Rồi chọn tiếp "Màn hình chính".',
      },
      {
        icon: "check_circle",
        tint: "from-emerald-500 to-teal-600",
        title: 'Nhấn "Thêm"',
        desc: "Icon Hugo Studio xuất hiện trên màn hình chính.",
      },
    ];
  }

  if (android && browser === "firefox") {
    return [
      {
        icon: "more_vert",
        tint: "from-orange-500 to-amber-600",
        title: "Nhấn nút ⋮ ở góc trên bên phải",
        desc: "Menu của Firefox cho Android.",
      },
      {
        icon: "add_to_home_screen",
        tint: "from-blue-500 to-indigo-600",
        title: 'Chọn "Thêm vào Màn hình chính"',
        desc: "Firefox sẽ hỏi tên icon, giữ nguyên rồi xác nhận.",
      },
    ];
  }

  return [
    {
      icon: "more_vert",
      tint: "from-blue-500 to-indigo-600",
      title: "Nhấn nút ⋮ ở góc trên bên phải",
      desc: "Menu của Chrome/Edge cho Android.",
    },
    {
      icon: "install_mobile",
      tint: "from-purple-500 to-pink-600",
      title: 'Chọn "Cài đặt ứng dụng"',
      desc: 'Một số máy hiển thị là "Thêm vào Màn hình chính".',
    },
    {
      icon: "check_circle",
      tint: "from-emerald-500 to-teal-600",
      title: 'Nhấn "Cài đặt" để xác nhận',
      desc: "Icon Hugo Studio xuất hiện trên màn hình chính.",
    },
  ];
}

export default function MobileInstallGate({ onBypass }) {
  const target = detectInstallTarget();
  const { canInstall, install } = usePWA();
  const [copied, setCopied] = useState(false);
  const steps = stepsFor(target);
  const deviceLabel = target.iOS ? "iPhone / iPad" : "Android";

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin + "/member/today");
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const handleBypassWeb = () => {
    try {
      sessionStorage.setItem("pwa_gate_dismissed", "true");
    } catch {}
    if (onBypass) {
      onBypass();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="relative min-h-[100dvh] flex flex-col items-center justify-center bg-background px-4 py-8 text-foreground overflow-x-hidden">
      {/* Ambient background glow & mesh lights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] bg-primary/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[280px] h-[280px] bg-sky-500/10 rounded-full blur-[90px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md mx-auto space-y-5 text-left">
        {/* Header Hero Card with Liquid Glass */}
        <div className="swiftui-liquid-glass p-6 text-center flex flex-col items-center">
          {/* iOS App Icon Squircle */}
          <div className="relative mb-4">
            <div className="size-16 rounded-[22%] bg-gradient-to-tr from-primary to-sky-400 p-[1px] shadow-xl flex items-center justify-center">
              <div className="size-full rounded-[21%] bg-card flex items-center justify-center backdrop-blur-md">
                <span className="material-symbols-outlined text-[32px] text-primary">
                  install_mobile
                </span>
              </div>
            </div>
            <span className="absolute -bottom-1 -right-1 size-5 rounded-full bg-emerald-500 border-2 border-card flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-white text-[13px] font-black">
                arrow_downward
              </span>
            </span>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Cài app để tiếp tục
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground max-w-sm">
            Để có trải nghiệm mượt mà với hiệu năng native, khu vực thành viên được tối ưu cho ứng dụng Hugo Studio đã cài.
          </p>

          <div className="mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1 swiftui-glass text-primary text-[13px] font-semibold border border-primary/20">
            <span className="material-symbols-outlined text-[16px]">
              {target.iOS ? "phone_iphone" : "phone_android"}
            </span>
            <span>Hướng dẫn cho {deviceLabel}</span>
          </div>
        </div>

        {/* 1-Tap Quick Install Button (if browser supports BeforeInstallPrompt) */}
        {canInstall && (
          <SwiftUIButton
            variant="prominent"
            size="lg"
            className="w-full font-bold shadow-lg"
            onClick={install}
            icon="download"
          >
            Cài đặt ngay (1 chạm)
          </SwiftUIButton>
        )}

        {/* Step-by-step Installation Inset Grouped Section */}
        <div className="swiftui-grouped-card divide-y divide-border/40">
          <div className="px-4 py-3 bg-muted/30 border-b border-border/40 text-[13px] font-semibold uppercase tracking-wider text-muted-foreground/80">
            Các bước cài đặt ({steps.length} bước)
          </div>

          {steps.map((step, i) => (
            <div key={step.title} className="flex items-start gap-3.5 p-4 hover:bg-muted/20 transition-colors">
              <div className={`size-8 shrink-0 rounded-xl bg-gradient-to-tr ${step.tint || "from-primary to-sky-500"} text-white flex items-center justify-center text-[13px] font-bold shadow-xs mt-0.5`}>
                {i + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-[15px] font-bold text-foreground">
                  <span className="material-symbols-outlined text-[18px] text-muted-foreground">
                    {step.icon}
                  </span>
                  <span>{step.title}</span>
                </div>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Action Controls */}
        <div className="space-y-2.5 pt-1">
          <SwiftUIButton
            variant="bordered"
            size="md"
            className="w-full font-semibold"
            onClick={copyLink}
            icon={copied ? "check" : "content_copy"}
          >
            {copied ? "Đã sao chép liên kết" : "Sao chép liên kết"}
          </SwiftUIButton>

          {/* Bypass Button: Allows web browsing without barrier */}
          <SwiftUIButton
            variant="tinted"
            size="md"
            className="w-full font-semibold"
            onClick={handleBypassWeb}
            icon="open_in_browser"
          >
            Tiếp tục trên trình duyệt (Dùng thử Web)
          </SwiftUIButton>
        </div>

        {/* Re-check trigger */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="text-[13px] font-medium text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
          >
            Tôi đã cài xong — kiểm tra lại
          </button>
        </div>

        <p className="text-center text-[13px] leading-relaxed text-muted-foreground/75 px-2">
          Máy tính vẫn dùng được bình thường qua trình duyệt. Cần hỗ trợ, nhắn cho Hugo Studio từ trang chủ.
        </p>
      </div>
    </div>
  );
}
