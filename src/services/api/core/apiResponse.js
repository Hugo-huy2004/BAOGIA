export class ApiError extends Error {
  constructor(response, payload) {
    const rawError = payload?.error;
    const code = (typeof rawError === "object" && rawError?.code)
      || payload?.code
      || (response.status === 401 ? "UNAUTHORIZED"
        : response.status === 403 ? "FORBIDDEN"
        : response.status === 404 ? "NOT_FOUND"
        : response.status === 429 ? "RATE_LIMITED"
        : response.status === 503 ? "SERVICE_DEGRADED"
        : response.status >= 500 ? "SERVER_ERROR"
        : "HTTP_ERROR");

    const message = (typeof rawError === "string" && rawError.trim())
      || (typeof rawError === "object" && rawError?.message)
      || (typeof payload === "string" && payload.trim())
      || payload?.message
      || `HTTP ${response.status}`;

    super(typeof message === "string" ? message : `HTTP ${response.status}`);
    this.name = "ApiError";
    this.status = response.status;
    this.code = code;
    this.payload = payload;
    this.retryable = response.status === 429 || response.status >= 500;
  }

  /**
   * Trả về thông điệp lỗi đã được địa phương hóa theo ngôn ngữ hiện tại của i18n
   */
  getLocalizedMessage(t) {
    if (typeof t !== "function") return this.message;
    const i18nKey = `apiErrors.${this.code}`;
    const translated = t(i18nKey, { defaultValue: "" });
    if (translated && translated !== i18nKey) return translated;
    return this.message;
  }
}

/**
 * Format bất kỳ lỗi nào (ApiError, Error thường hoặc chuỗi) sang thông điệp hiển thị cho người dùng
 */
export function formatErrorMessage(err, t, fallback = "Đã xảy ra sự cố. Vui lòng thử lại sau.") {
  if (!err) return fallback;
  if (err instanceof ApiError && typeof t === "function") {
    return err.getLocalizedMessage(t);
  }
  if (typeof err === "string") return err;
  return err.message || fallback;
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
