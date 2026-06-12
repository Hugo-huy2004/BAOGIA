import { usePWA } from '../../hooks/usePWA'

export default function PWAInstallBanner() {
  const { canInstall, isInstalled, isOnline, install } = usePWA()

  if (!canInstall || isInstalled) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50
                    bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-indigo-100
                    dark:border-gray-700 p-4 flex items-center gap-3 animate-slide-up">
      <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center shrink-0">
        <span className="text-white text-lg">📱</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">Cài đặt ứng dụng</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Truy cập nhanh hơn, dùng offline</p>
      </div>
      <button onClick={install}
              className="shrink-0 px-3 py-1.5 bg-indigo-500 text-white text-xs font-medium
                         rounded-lg hover:bg-indigo-600 transition-colors">
        Cài ngay
      </button>
    </div>
  )
}
