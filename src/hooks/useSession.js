import { useCallback } from 'react'

const SESSION_KEY = 'price-doc-member-session'
const ADMIN_SESSION_KEY = 'price-doc-admin-session'
const SESSION_DURATION = 14 * 24 * 60 * 60 * 1000 // 14 days

export function useSession() {
  const getMemberSession = useCallback(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY)
      if (!raw) return null
      const session = JSON.parse(raw)
      if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
        clearMemberSession()
        return null
      }
      return session
    } catch { return null }
  }, [])

  const setMemberSession = useCallback((data) => {
    const session = {
      ...data,
      loginAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + SESSION_DURATION).toISOString()
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  }, [])

  const clearMemberSession = useCallback(() => {
    localStorage.removeItem(SESSION_KEY)
    sessionStorage.removeItem(SESSION_KEY)
  }, [])

  const getAdminSession = useCallback(() => {
    try {
      const raw = sessionStorage.getItem(ADMIN_SESSION_KEY)
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  }, [])

  return { getMemberSession, setMemberSession, clearMemberSession, getAdminSession }
}
