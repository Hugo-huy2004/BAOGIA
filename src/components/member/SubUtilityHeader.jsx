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
    // KHÔNG dùng margin âm ở đây. Trang không có đệm hai bên trên điện thoại,
    // nên `-mx-*` làm header rộng hơn trang đúng bằng ngần ấy và tràn ra ngoài
    // — mọi app dùng header này đều bị cắt mép.
    <header className="sticky top-0 z-40 mb-5 flex w-full items-center gap-1 border-b border-border/60 bg-background/80 px-1 py-1.5 backdrop-blur-xl">
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
