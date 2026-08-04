// Python AI server KHÔNG có host riêng cho trình duyệt. Mọi thứ đi qua Node ở
// `/api/*`; riêng `/api/ai/*` được server/routes/aiProxyRoutes.js chuyển tiếp và
// tự gắn `X-Internal-Key` từ process.env. Client không giữ key nào cả — trước
// đây `VITE_INTERNAL_API_KEY` bị nhồi thẳng vào bundle, ai xem source cũng đọc được.
const BASE_URL = import.meta.env.VITE_API_URL || '/api'

export async function apiFetch(path, options = {}) {
  const { auth = true, ...rest } = options
  const headers = { 'Content-Type': 'application/json', ...(rest.headers || {}) }

  if (auth) {
    try {
      const session = JSON.parse(localStorage.getItem('price-doc-member-session') || '{}')
      if (session.token) headers['Authorization'] = `Bearer ${session.token}`
    } catch { /* ignore */ }
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...rest, headers })
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem('price-doc-member-session')
      window.location.href = '/login'
    }
    throw new Error(`API Error ${res.status}: ${await res.text()}`)
  }
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) return res.json()
  const text = await res.text()
  try { return JSON.parse(text) } catch { return text }
}

export { BASE_URL }
