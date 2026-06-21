export const getAiUrl = () => {
  if (import.meta.env.VITE_AI_URL) return import.meta.env.VITE_AI_URL;
  const apiUrl = import.meta.env.VITE_API_URL || "";
  if (apiUrl.startsWith("http")) {
    try {
      const url = new URL(apiUrl);
      if (url.hostname.startsWith("api.")) {
        url.hostname = url.hostname.replace("api.", "ai.");
        return `${url.protocol}//${url.hostname}`;
      }
    } catch (e) {}
  }
  if (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    if (window.location.hostname.includes("hugowishpax.studio")) {
      return `${window.location.protocol}//ai.hugowishpax.studio`;
    }
  }
  return "http://localhost:8000";
};

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const AI_URL = getAiUrl()

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
