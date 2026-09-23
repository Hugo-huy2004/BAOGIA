const API_BASE = import.meta.env.VITE_API_URL || '/api';
const WORKFORCE_URL = `${API_BASE}/admin/workforce`;

async function request(path, options = {}) {
  const response = await fetch(`${WORKFORCE_URL}${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || 'Không thể kết nối AI Workforce');
  }
  return payload;
}

export const aiWorkforceApi = {
  getAgents() {
    return request('/agents');
  },

  getTasks({ status = '', agentKey = '', limit = 50 } = {}) {
    const query = new URLSearchParams({ limit: String(limit) });
    if (status) query.set('status', status);
    if (agentKey) query.set('agentKey', agentKey);
    return request(`/tasks?${query.toString()}`);
  },

  createTask({ agentKey, objective, context = {} }) {
    return request('/tasks', {
      method: 'POST',
      body: JSON.stringify({ agentKey, objective, context }),
    });
  },

  approveTask(taskId, note = '') {
    return request(`/tasks/${taskId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    });
  },

  rejectTask(taskId, note = '') {
    return request(`/tasks/${taskId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    });
  },
};

export default aiWorkforceApi;
