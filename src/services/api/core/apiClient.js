// Python AI server KHÔNG có host riêng cho trình duyệt. Mọi thứ đi qua Node ở
// `/api/*`; riêng `/api/ai/*` được server/routes/aiProxyRoutes.js chuyển tiếp và
// tự gắn `X-Internal-Key` từ process.env. Client không giữ key nào cả — trước
// đây `VITE_INTERNAL_API_KEY` bị nhồi thẳng vào bundle, ai xem source cũng đọc được.
import { API_BASE as BASE_URL } from '../../../config/apiBase'
import { readApiResponse } from './apiResponse'

export async function apiFetch(path, options = {}) {
  const rest = { ...options }
  delete rest.auth
  const headers = new Headers(rest.headers)
  if (rest.body != null && !(rest.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  const res = await fetch(`${BASE_URL}${path}`, { ...rest, headers })
  return readApiResponse(res)
}

export { BASE_URL }
