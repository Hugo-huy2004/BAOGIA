import { API_BASE } from "../../../config/apiBase";
import { readApiResponse } from "./apiResponse";

export class BaseApi {
  constructor(baseUrl = API_BASE) {
    this.baseUrl = baseUrl;
  }

  async fetchWithAuth(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = new Headers(options.headers);
    if (options.body != null && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    return fetch(url, { ...options, credentials: "include", headers });
  }

  async get(endpoint, options = {}) {
    return readApiResponse(await this.fetchWithAuth(endpoint, options));
  }

  async post(endpoint, data, options = {}) {
    return readApiResponse(await this.fetchWithAuth(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(data)
    }));
  }

  async patch(endpoint, data, options = {}) {
    return readApiResponse(await this.fetchWithAuth(endpoint, {
      ...options,
      method: "PATCH",
      body: JSON.stringify(data)
    }));
  }

  async delete(endpoint, data, options = {}) {
    return readApiResponse(await this.fetchWithAuth(endpoint, {
      ...options,
      method: "DELETE",
      ...(data === undefined ? {} : { body: JSON.stringify(data) })
    }));
  }
}

export const api = new BaseApi();
