import { API_BASE } from '../../config/apiBase';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}/profile/me/evidence${path}`, {
    credentials: 'include',
    ...options,
  });
  if (response.status === 204) return null;
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || 'PROFILE_EVIDENCE_REQUEST_FAILED');
    error.status = response.status;
    throw error;
  }
  return payload;
}

export const profileEvidenceApi = {
  list({ cursor = '', limit = 20 } = {}) {
    const query = new URLSearchParams({ limit: String(limit) });
    if (cursor) query.set('cursor', cursor);
    return request(`?${query.toString()}`);
  },

  remove(evidenceId) {
    return request(`/${encodeURIComponent(evidenceId)}`, { method: 'DELETE' });
  },
};

export default profileEvidenceApi;
