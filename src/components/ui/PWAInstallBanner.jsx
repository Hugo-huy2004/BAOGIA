import { usePWA } from '../../hooks/usePWA'

export default function PWAInstallBanner() {
  const { canInstall, isInstalled, isOnline, install } = usePWA()

  if (!canInstall || isInstalled) return null

  return (
    <div className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+5.5rem)] md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-[150]
                    bg-card rounded-2xl shadow-xl border border-primary/10
                    p-4 flex items-center gap-3 animate-slide-up">
      <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
        <span className="text-white text-lg">📱</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">Cài đặt ứng dụng</p>
        <p className="text-xs text-muted-foreground truncate">Truy cập nhanh hơn, dùng offline</p>
      </div>
      <button onClick={install}
              className="shrink-0 px-3 py-1.5 bg-primary text-white text-xs font-medium
                         rounded-lg hover:bg-primary/90 transition-colors">
        Cài ngay
      </button>
    </div>
  )
}
