import { useState, useEffect } from 'react'
import { isStandalone } from '../config/platform'

export function usePWA() {
  const [installPrompt, setInstallPrompt] = useState(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e) }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => setIsInstalled(true))
    window.addEventListener('online', () => setIsOnline(true))
    window.addEventListener('offline', () => setIsOnline(false))

    setIsInstalled(isStandalone())

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const install = async () => {
    if (!installPrompt) return false
    const result = await installPrompt.prompt()
    if (result.outcome === 'accepted') setInstallPrompt(null)
    return result.outcome === 'accepted'
  }

  return { canInstall: !!installPrompt, isInstalled, isOnline, install }
}
