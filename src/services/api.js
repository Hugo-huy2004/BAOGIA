const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const AI_URL = import.meta.env.VITE_AI_URL || 'http://localhost:8000'

const getInternalKey = () => import.meta.env.VITE_INTERNAL_API_KEY || ''

const defaultHeaders = () => ({
  'Content-Type': 'application/json',
  'X-Internal-Key': getInternalKey(),
})

export async function apiFetch(path, options = {}) {
  const { auth = true, ...rest } = options
  const headers = { ...defaultHeaders(), ...(rest.headers || {}) }

  if (auth) {
    try {
      const session = JSON.parse(localStorage.getItem('price-doc-member-session') || '{}')
      if (session.token) headers['Authorization'] = `Bearer ${session.token}`
    } catch {}
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...rest, headers })
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem('price-doc-member-session')
      window.location.href = '/login'
    }
    throw new Error(`API Error ${res.status}: ${await res.text()}`)
  }
  return res.json()
}

export async function aiFetch(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'X-Internal-Key': getInternalKey(),
    ...(options.headers || {})
  }
  const res = await fetch(`${AI_URL}${path}`, { ...options, headers })
  if (!res.ok) throw new Error(`AI API Error ${res.status}`)
  return res
}

export { BASE_URL, AI_URL }
