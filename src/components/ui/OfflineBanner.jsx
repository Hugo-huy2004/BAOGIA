import { usePWA } from '../../hooks/usePWA'

export default function OfflineBanner() {
  const { isOnline } = usePWA()
  if (isOnline) return null
  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-amber-500 text-white text-center
                    py-2 text-sm font-medium">
      ⚠️ Đang ngoại tuyến — Một số tính năng có thể không hoạt động
    </div>
  )
}
