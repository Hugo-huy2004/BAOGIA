export class ApiError extends Error {
  constructor(response, payload) {
    const message = (typeof payload === "string" && payload.trim())
      || payload?.message
      || payload?.error
      || `HTTP ${response.status}`;
    super(typeof message === "string" ? message : `HTTP ${response.status}`);
    this.name = "ApiError";
    this.status = response.status;
    this.code = payload?.code || "HTTP_ERROR";
    this.payload = payload;
    this.retryable = response.status === 429 || response.status >= 500;
  }
}

/** Read a response exactly once and preserve the server's status/code/message. */
export async function readApiResponse(response) {
  if (response.status === 204) return null;

  const text = await response.text();
  let payload = text;
  if (text) {
    try { payload = JSON.parse(text); } catch { /* text response */ }
  } else {
    payload = null;
  }

  if (!response.ok) throw new ApiError(response, payload);
  return payload;
}
