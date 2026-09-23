import { getAdminSession } from '../core/authSession';
import { readApiResponse } from '../core/apiResponse';
import { API_BASE } from '../../../config/apiBase';

const getAuthHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  const session = getAdminSession();
  if (session && session.token) {
    headers['Authorization'] = `Bearer ${session.token}`;
  }
  return headers;
};

const request = async (path, options = {}) => readApiResponse(await fetch(`${API_BASE}${path}`, {
  credentials: 'include',
  ...options,
}));

export const robotApi = {
  /**
   * Yêu cầu mã OTP 6 chữ số gửi qua Telegram (hiệu lực 5 phút)
   * Không cần admin JWT — OTP gửi về Telegram là yếu tố xác thực.
   */
  async requestOtp() {
    return request('/admin/robot/request-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
  },

  /**
   * Xác thực mã OTP → trả về session token hiệu lực 5 phút
   * Không cần admin JWT — mã OTP là yếu tố xác thực duy nhất.
   */
  async verifyOtp(tempToken, otpCode) {
    return request('/admin/robot/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tempToken, otpCode }),
    });
  },

  /**
   * Lấy cấu hình URL camera Robot đã giải mã 3 lớp từ MongoDB
   */
  async getConfig(sessionToken = '') {
    const headers = getAuthHeaders();
    if (sessionToken) headers['x-robot-session-token'] = sessionToken;
    return request('/admin/robot/config', {
      method: 'GET',
      headers,
    });
  },

  /**
   * Tạo Ephemeral Stream Token thời hạn 60s để nạp vào Secure Stream Frame
   */
  async getStreamToken(sessionToken = '') {
    const headers = getAuthHeaders();
    if (sessionToken) headers['x-robot-session-token'] = sessionToken;
    return request('/admin/robot/stream-token', {
      method: 'POST',
      headers,
    });
  },

  /**
   * Kích hoạt hoặc hủy Emergency Kill Switch
   */
  async toggleKillSwitch(sessionToken = '', action = 'activate') {
    const headers = getAuthHeaders();
    if (sessionToken) headers['x-robot-session-token'] = sessionToken;
    return request('/admin/robot/kill-switch', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action }),
    });
  },

  /**
   * Cập nhật URL camera Robot mới (Mã hóa 3 lớp & lưu MongoDB)
   */
  async updateConfig(sessionToken, url) {
    const headers = getAuthHeaders();
    if (sessionToken) headers['x-robot-session-token'] = sessionToken;
    return request('/admin/robot/config', {
      method: 'PUT',
      headers,
      body: JSON.stringify({ url }),
    });
  }
};

export default robotApi;
