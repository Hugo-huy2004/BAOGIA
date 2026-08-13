import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_LANGUAGE, getStoredAppLanguage, persistAppLanguage } from '../i18n/languages'

export const useUIStore = create(persist(
  (set) => ({
    theme: 'light',
    language: getStoredAppLanguage() || DEFAULT_LANGUAGE,
    sidebarOpen: false,
    notifications: [],

    setTheme: (theme) => set({ theme }),
    setLanguage: (lang) => {
      const language = persistAppLanguage(lang)
      set({ language })
      void import('../i18n/config').then(({ changeAppLanguage }) => changeAppLanguage(language))
    },
    toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
    addNotification: (notif) => set(s => ({
      notifications: [notif, ...s.notifications].slice(0, 50)
    })),
    clearNotifications: () => set({ notifications: [] }),
  }),
  { name: 'ui-store', partialize: s => ({ theme: s.theme, language: s.language }) }
))
