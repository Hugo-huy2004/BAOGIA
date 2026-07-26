import React from "react";
import StandaloneInstallButton from "../ui/StandaloneInstallButton";
import BackButton from "./shared/BackButton";

/**
 * Thanh tiêu đề dùng chung cho các tiện ích con.
 *
 * Nút bấm ở đây tuân theo chuẩn "app phẳng": vùng chạm tối thiểu 44px, nền
 * đặc (không gradient/blur chồng lớp), và hai nút hai bên cùng một hình khối
 * để không bên nào trông nặng hơn bên nào.
 */
export default function SubUtilityHeader({ title, icon, colorClass, onBack, appId }) {
  return (
    <header className="sticky top-0 z-40 -mx-2 mb-6 flex items-center gap-2 border-b border-border bg-card px-2 py-2">
      {onBack ? <BackButton onClick={onBack} /> : <span className="h-11 w-1 shrink-0" />}

      <div className="flex min-w-0 flex-1 items-center justify-center gap-1.5">
        <span className={`material-symbols-outlined shrink-0 text-[20px] ${colorClass || "text-muted-foreground"}`}>
          {icon}
        </span>
        <h1 className="truncate text-[15px] font-semibold text-foreground">{title}</h1>
      </div>

      {/* Ẩn khi đã chạy dạng PWA độc lập */}
      <StandaloneInstallButton appTitle={title} appId={appId} />
    </header>
  );
}
