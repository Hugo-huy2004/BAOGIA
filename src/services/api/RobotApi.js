import { getAdminSession } from '../authSession';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const getHeaders = (masterPin = '') => {
  const headers = {
    'Content-Type': 'application/json',
    'x-robot-master-pin': masterPin
  };
  const session = getAdminSession();
  if (session && session.token) {
    headers['Authorization'] = `Bearer ${session.token}`;
  }
  return headers;
};

export const robotApi = {
  /**
   * Lấy cấu hình URL camera Robot đã giải mã 3 lớp từ MongoDB
   */
  async getConfig(masterPin = '') {
    const response = await fetch(`${API_BASE}/admin/robot/config`, {
      method: 'GET',
      headers: getHeaders(masterPin),
      credentials: 'include'
    });
    if (!response.ok) {
      throw new Error(`Lỗi kết nối server: ${response.status}`);
    }
    return await response.json();
  },

  /**
   * Tạo Ephemeral Stream Token thời hạn 60s để nạp vào Secure Stream Frame
   */
  async getStreamToken(masterPin = '') {
    const response = await fetch(`${API_BASE}/admin/robot/stream-token`, {
      method: 'POST',
      headers: getHeaders(masterPin),
      credentials: 'include'
    });
    if (!response.ok) {
      throw new Error(`Lỗi khởi tạo phiên bảo mật: ${response.status}`);
    }
    return await response.json();
  },

  /**
   * Kích hoạt hoặc hủy Emergency Kill Switch
   */
  async toggleKillSwitch(masterPin = '', action = 'activate') {
    const response = await fetch(`${API_BASE}/admin/robot/kill-switch`, {
      method: 'POST',
      headers: getHeaders(masterPin),
      body: JSON.stringify({ action }),
      credentials: 'include'
    });
    if (!response.ok) {
      throw new Error(`Lỗi thực thi Kill Switch: ${response.status}`);
    }
    return await response.json();
  },

  /**
   * Cập nhật URL camera Robot mới (Mã hóa 3 lớp & lưu MongoDB)
   */
  async updateConfig(masterPin, url) {
    const response = await fetch(`${API_BASE}/admin/robot/config`, {
      method: 'PUT',
      headers: getHeaders(masterPin),
      body: JSON.stringify({ url }),
      credentials: 'include'
    });
    if (!response.ok) {
      throw new Error(`Lỗi kết nối server: ${response.status}`);
    }
    return await response.json();
  }
};

export default robotApi;
