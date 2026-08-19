import { getAdminSession, logoutAuth } from '../authSession';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const getAuthHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  const session = getAdminSession();
  if (session && session.token) {
    headers['Authorization'] = `Bearer ${session.token}`;
  }
  return headers;
};

const handleAuthError = async (response) => {
  if (response.status === 401 || response.status === 403) {
    await logoutAuth();
    window.location.href = '/login';
    throw new Error('Phiên đăng nhập đã hết hạn. Đang chuyển về trang đăng nhập...');
  }
};

export const robotApi = {
  /**
   * Yêu cầu mã OTP 6 chữ số (hiệu lực 5 phút)
   */
  async requestOtp() {
    const response = await fetch(`${API_BASE}/admin/robot/request-otp`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include'
    });
    await handleAuthError(response);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || data.message || `Lỗi gửi OTP: ${response.status}`);
    }
    return await response.json();
  },

  /**
   * Xác thực mã OTP → trả về session token hiệu lực 5 phút
   */
  async verifyOtp(tempToken, otpCode) {
    const response = await fetch(`${API_BASE}/admin/robot/verify-otp`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ tempToken, otpCode }),
      credentials: 'include'
    });
    await handleAuthError(response);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || data.message || `Lỗi xác thực OTP: ${response.status}`);
    }
    return await response.json();
  },

  /**
   * Lấy cấu hình URL camera Robot đã giải mã 3 lớp từ MongoDB
   */
  async getConfig(sessionToken = '') {
    const headers = getAuthHeaders();
    if (sessionToken) headers['x-robot-session-token'] = sessionToken;
    const response = await fetch(`${API_BASE}/admin/robot/config`, {
      method: 'GET',
      headers,
      credentials: 'include'
    });
    await handleAuthError(response);
    if (!response.ok) {
      throw new Error(`Lỗi kết nối server: ${response.status}`);
    }
    return await response.json();
  },

  /**
   * Tạo Ephemeral Stream Token thời hạn 60s để nạp vào Secure Stream Frame
   */
  async getStreamToken(sessionToken = '') {
    const headers = getAuthHeaders();
    if (sessionToken) headers['x-robot-session-token'] = sessionToken;
    const response = await fetch(`${API_BASE}/admin/robot/stream-token`, {
      method: 'POST',
      headers,
      credentials: 'include'
    });
    await handleAuthError(response);
    if (!response.ok) {
      throw new Error(`Lỗi khởi tạo phiên bảo mật: ${response.status}`);
    }
    return await response.json();
  },

  /**
   * Kích hoạt hoặc hủy Emergency Kill Switch
   */
  async toggleKillSwitch(sessionToken = '', action = 'activate') {
    const headers = getAuthHeaders();
    if (sessionToken) headers['x-robot-session-token'] = sessionToken;
    const response = await fetch(`${API_BASE}/admin/robot/kill-switch`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ action }),
      credentials: 'include'
    });
    await handleAuthError(response);
    if (!response.ok) {
      throw new Error(`Lỗi thực thi Kill Switch: ${response.status}`);
    }
    return await response.json();
  },

  /**
   * Cập nhật URL camera Robot mới (Mã hóa 3 lớp & lưu MongoDB)
   */
  async updateConfig(sessionToken, url) {
    const headers = getAuthHeaders();
    if (sessionToken) headers['x-robot-session-token'] = sessionToken;
    const response = await fetch(`${API_BASE}/admin/robot/config`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ url }),
      credentials: 'include'
    });
    await handleAuthError(response);
    if (!response.ok) {
      throw new Error(`Lỗi kết nối server: ${response.status}`);
    }
    return await response.json();
  }
};

export default robotApi;
