import { getMemberSession } from "./authSession";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export class HugoCoderApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = "HugoCoderApiError";
    this.status = status;
  }
}

class HugoCoderApi {
  async request(path, { method = "POST", body } = {}) {
    if (!getMemberSession()?.token) {
      throw new HugoCoderApiError(
        "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.",
        401,
      );
    }

    let response;
    try {
      response = await fetch(`${API_BASE_URL}${path}`, {
        method,
        credentials: "include",
        headers: body === undefined ? undefined : { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch {
      throw new HugoCoderApiError(
        "Không thể kết nối máy chủ. Hãy kiểm tra mạng rồi thử lại.",
      );
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const fallback = response.status === 401
        ? "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
        : "Giao dịch chưa thể hoàn tất. Vui lòng thử lại.";
      throw new HugoCoderApiError(data.error || fallback, response.status);
    }

    return data;
  }

  subscribeFeature({ email, featureKey, months = 1 }) {
    return this.request("/joy/subscribe-feature", {
      body: { email, featureKey, months },
    });
  }

  buyLifetimeUnlock(tier) {
    return this.request("/joy/buy-lifetime-unlock", {
      body: { tier },
    });
  }

  getLifetimeUnlockQuote(tier) {
    return this.request(
      `/joy/lifetime-unlock-quote?tier=${encodeURIComponent(tier)}`,
      { method: "GET" },
    );
  }

  getAccessSnapshot() {
    return this.request("/joy/coder-access", { method: "GET" });
  }

  buyAllStagesBundle() {
    return this.request("/joy/buy-all-stages-bundle");
  }

  claimMilestoneReward(phase) {
    return this.request("/joy/claim-milestone-reward", {
      body: { phase },
    });
  }
}

export const hugoCoderApi = new HugoCoderApi();
