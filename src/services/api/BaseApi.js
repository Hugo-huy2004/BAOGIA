import { logoutAuth } from "../authSession";

export class BaseApi {
  constructor(baseUrl = import.meta.env.VITE_API_URL) {
    this.baseUrl = baseUrl;
  }

  async fetchWithAuth(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {})
    };
    
    try {
      const response = await fetch(url, { ...options, credentials: "include", headers });
      if (response.status === 401 || response.status === 403) {
        await logoutAuth();
        window.location.href = '/login';
        throw new Error("Unauthorized");
      }
      return response;
    } catch (error) {
      console.error(`API Error on ${endpoint}:`, error);
      throw error;
    }
  }

  async get(endpoint) {
    const res = await this.fetchWithAuth(endpoint);
    if (!res.ok) throw await res.json().catch(() => new Error('API Error'));
    return res.json();
  }

  async post(endpoint, data) {
    const res = await this.fetchWithAuth(endpoint, {
      method: "POST",
      body: JSON.stringify(data)
    });
    if (!res.ok) throw await res.json().catch(() => new Error('API Error'));
    return res.json();
  }

  async patch(endpoint, data) {
    const res = await this.fetchWithAuth(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data)
    });
    if (!res.ok) throw await res.json().catch(() => new Error('API Error'));
    return res.json();
  }

  async delete(endpoint, data) {
    const options = { method: "DELETE" };
    if (data) options.body = JSON.stringify(data);
    
    const res = await this.fetchWithAuth(endpoint, options);
    if (!res.ok) throw await res.json().catch(() => new Error('API Error'));
    // some deletes return empty body
    try {
      return await res.json();
    } catch {
      return true;
    }
  }
}

export const api = new BaseApi();
