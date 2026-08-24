/**
 * MobileInstallGate.jsx
 *
 * Trên điện thoại, khu vực thành viên chỉ chạy trong app đã cài: trình duyệt
 * di động bị khoá và thay bằng màn hướng dẫn cài đặt này.
 *
 * Hướng dẫn bám theo NHẬN DIỆN THIẾT BỊ (config/platform.js) chứ không phải
 * một bộ bước chung chung: nút Chia sẻ của Safari nằm ở thanh dưới, menu của
 * Chrome Android là ba chấm ở góc trên, Samsung Internet là ba gạch ở góc
 * dưới — chỉ ra sai một chỗ là người dùng bỏ cuộc ngay.
 */

import { useState } from "react";
import { detectInstallTarget } from "../../config/platform";
import { usePWA } from "../../hooks/usePWA";

const SAFARI_STEPS = [
  {
    icon: "ios_share",
    title: "Nhấn nút Chia sẻ",
    desc: "Ô vuông có mũi tên hướng lên, nằm giữa thanh công cụ dưới cùng của Safari.",
  },
  {
    icon: "add_box",
    title: 'Chọn "Thêm vào MH chính"',
    desc: 'Vuốt danh sách lên tới mục "Thêm vào Màn hình chính" (Add to Home Screen).',
  },
  {
    icon: "check_circle",
    title: 'Nhấn "Thêm"',
    desc: "Nút ở góc trên bên phải. Icon Hugo Studio xuất hiện ngay trên màn hình chính.",
  },
  {
    icon: "touch_app",
    title: "Mở app từ màn hình chính",
    desc: "Thoát Safari và mở bằng icon vừa tạo — từ đây app chạy full màn hình.",
  },
];

function stepsFor({ iOS, android, inApp, browser }) {
  const openInSystemBrowser = {
    icon: "open_in_new",
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
        title: 'Chọn "Cài đặt ứng dụng"',
        desc: "Chrome sẽ tự hiện thanh mời cài. Nếu không thấy, mở menu ⋮ ở góc trên bên phải.",
      },
    ];
  }

  if (android && browser === "samsung") {
    return [
      {
        icon: "menu",
        title: "Nhấn nút ☰ ở góc dưới bên phải",
        desc: "Thanh công cụ của Samsung Internet nằm ở cạnh dưới màn hình.",
      },
      {
        icon: "add_to_home_screen",
        title: 'Chọn "Thêm trang vào"',
        desc: 'Rồi chọn tiếp "Màn hình chính".',
      },
      {
        icon: "check_circle",
        title: 'Nhấn "Thêm"',
        desc: "Icon Hugo Studio xuất hiện trên màn hình chính.",
      },
    ];
  }

  if (android && browser === "firefox") {
    return [
      {
        icon: "more_vert",
        title: "Nhấn nút ⋮ ở góc trên bên phải",
        desc: "Menu của Firefox cho Android.",
      },
      {
        icon: "add_to_home_screen",
        title: 'Chọn "Thêm vào Màn hình chính"',
        desc: "Firefox sẽ hỏi tên icon, giữ nguyên rồi xác nhận.",
      },
    ];
  }

  return [
    {
      icon: "more_vert",
      title: "Nhấn nút ⋮ ở góc trên bên phải",
      desc: "Menu của Chrome/Edge cho Android.",
    },
    {
      icon: "install_mobile",
      title: 'Chọn "Cài đặt ứng dụng"',
      desc: 'Một số máy hiển thị là "Thêm vào Màn hình chính".',
    },
    {
      icon: "check_circle",
      title: 'Nhấn "Cài đặt" để xác nhận',
      desc: "Icon Hugo Studio xuất hiện trên màn hình chính.",
    },
  ];
}

export default function MobileInstallGate() {
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

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background px-5 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] pt-[calc(env(safe-area-inset-top,0px)+2rem)] text-foreground">
      <div className="mx-auto w-full max-w-md">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
          <span className="material-symbols-outlined text-[28px] text-foreground">install_mobile</span>
        </div>

        <h1 className="mt-5 text-2xl font-black leading-tight tracking-tight">
          Cài app để tiếp tục
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
          Trên điện thoại, khu vực thành viên chỉ mở trong ứng dụng Hugo Studio
          đã cài — không dùng qua trình duyệt. Cài mất khoảng 15 giây, miễn phí
          và không qua kho ứng dụng.
        </p>

        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5">
          <span className="material-symbols-outlined text-[18px] text-muted-foreground">
            {target.iOS ? "phone_iphone" : "phone_android"}
          </span>
          <span className="text-[13px] font-semibold">Hướng dẫn cho {deviceLabel}</span>
        </div>

        {canInstall && (
          <button
            type="button"
            onClick={install}
            className="mt-5 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-[15px] font-bold text-primary-foreground active:scale-[0.99]"
          >
            <span className="material-symbols-outlined text-[20px]">download</span>
            Cài đặt ngay (1 chạm)
          </button>
        )}

        <ol className="mt-6 space-y-3">
          {steps.map((step, i) => (
            <li key={step.title} className="flex gap-3 rounded-2xl bg-card p-4 ring-1 ring-border">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-[13px] font-black">
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-[15px] font-bold leading-snug">
                  <span className="material-symbols-outlined text-[18px] text-muted-foreground">{step.icon}</span>
                  {step.title}
                </p>
                <p className="mt-1 text-[13.5px] leading-relaxed text-muted-foreground">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>

        <button
          type="button"
          onClick={copyLink}
          className="mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-muted px-5 text-[14px] font-bold active:scale-[0.99]"
        >
          <span className="material-symbols-outlined text-[19px]">
            {copied ? "check" : "content_copy"}
          </span>
          {copied ? "Đã sao chép liên kết" : "Sao chép liên kết"}
        </button>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-3 min-h-[44px] w-full text-[14px] font-semibold text-muted-foreground underline underline-offset-4"
        >
          Tôi đã cài xong — kiểm tra lại
        </button>

        <p className="mt-5 text-[13px] leading-relaxed text-muted-foreground">
          Máy tính vẫn dùng được bình thường qua trình duyệt. Cần hỗ trợ, nhắn
          cho Hugo Studio từ trang chủ.
        </p>
      </div>
    </div>
  );
}
