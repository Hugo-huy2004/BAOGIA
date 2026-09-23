import { useState, useEffect, useSyncExternalStore } from 'react'
import { isStandalone, subscribeDisplayMode } from '../config/platform'

export const useStandalone = () => useSyncExternalStore(subscribeDisplayMode, isStandalone, () => false)

export function usePWA() {
  const [installPrompt, setInstallPrompt] = useState(null)
  const [installedThisSession, setInstalledThisSession] = useState(false)
  const standalone = useStandalone()
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e) }
    const installed = () => { setInstalledThisSession(true); setInstallPrompt(null) }
    const online = () => setIsOnline(navigator.onLine)
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', installed)
    window.addEventListener('online', online)
    window.addEventListener('offline', online)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', installed)
      window.removeEventListener('online', online)
      window.removeEventListener('offline', online)
    }
  }, [])

  const install = async () => {
    if (!installPrompt) return false
    const result = await installPrompt.prompt()
    setInstallPrompt(null)
    return result.outcome === 'accepted'
  }

  const isInstalled = standalone || installedThisSession
  return { canInstall: !!installPrompt && !isInstalled, isInstalled, isOnline, install }
}
