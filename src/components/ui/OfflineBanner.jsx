import { usePWA } from '../../hooks/usePWA';

export default function OfflineBanner() {
  const { isOnline } = usePWA();
  if (isOnline) return null;
  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2 bg-amber-500 text-slate-950 py-2 px-4 text-xs font-bold shadow-md">
      <span className="material-symbols-outlined text-[16px]">wifi_off</span>
      <span>Đang ở chế độ ngoại tuyến (Offline Mode) · Dữ liệu đã được bảo lưu</span>
    </div>
  );
}
