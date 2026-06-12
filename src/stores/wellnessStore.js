import { create } from 'zustand'

export const useWellnessStore = create((set, get) => ({
  companionData: null,
  chatMessages: [],
  historyLogs: [],
  iotVitals: [],
  dailyTokens: { chat: 0, audio: 0 },

  setCompanionData: (data) => set({ companionData: data }),
  setChatMessages: (msgs) => set({ chatMessages: msgs }),
  addChatMessage: (msg) => set(s => ({ chatMessages: [...s.chatMessages, msg] })),
  setHistoryLogs: (logs) => set({ historyLogs: logs }),
  addHistoryLog: (log) => set(s => ({ historyLogs: [...s.historyLogs, log] })),
  setIoTVitals: (vitals) => set({ iotVitals: vitals }),
  addIoTVital: (vital) => set(s => ({ iotVitals: [vital, ...s.iotVitals].slice(0, 100) })),
  incrementToken: (type) => set(s => ({
    dailyTokens: { ...s.dailyTokens, [type]: s.dailyTokens[type] + 1 }
  })),
  resetDailyTokens: () => set({ dailyTokens: { chat: 0, audio: 0 } }),
}))
