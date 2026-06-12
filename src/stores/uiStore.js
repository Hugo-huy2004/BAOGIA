import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useUIStore = create(persist(
  (set, get) => ({
    theme: 'light',
    language: 'vi',
    sidebarOpen: false,
    notifications: [],

    setTheme: (theme) => set({ theme }),
    setLanguage: (lang) => set({ language: lang }),
    toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
    addNotification: (notif) => set(s => ({
      notifications: [notif, ...s.notifications].slice(0, 50)
    })),
    clearNotifications: () => set({ notifications: [] }),
  }),
  { name: 'ui-store', partialize: s => ({ theme: s.theme, language: s.language }) }
))
