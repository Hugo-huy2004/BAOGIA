const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const adminBrainApi = {
  /**
   * Lấy báo cáo chẩn đoán an ninh & hệ thống từ AI Brain
   */
  async getDiagnosis() {
    const res = await fetch(`${API_BASE}/admin/brain/diagnose`, {
      credentials: 'include'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Không thể lấy báo cáo chẩn đoán từ Bộ Não AI');
    }
    return res.json();
  },

  /**
   * Trò chuyện và ra lệnh cho Bộ Não AI
   */
  async sendPrompt(prompt, extraContext = null) {
    const res = await fetch(`${API_BASE}/admin/brain/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ prompt, extraContext })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Lỗi gửi lệnh đến Bộ Não AI');
    }
    return res.json();
  },

  /**
   * Tự động soạn phản hồi ticket
   */
  async draftTicketReply(ticketId) {
    const res = await fetch(`${API_BASE}/admin/brain/draft-reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ticketId })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Không thể tạo phản hồi tự động');
    }
    return res.json();
  },

  /**
   * Soạn và gửi email cho người dùng
   */
  async sendUserEmail({ toEmail, subject, instructions, fromName }) {
    const res = await fetch(`${API_BASE}/admin/brain/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ toEmail, subject, instructions, fromName })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Không thể gửi email cho người dùng');
    }
    return res.json();
  },

  /**
   * Lấy chi tiết hồ sơ người dùng (Bio, JoyLedger, Security, Tickets)
   */
  async getUserDetails(userId) {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/details`, {
      credentials: 'include'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Không thể lấy thông tin chi tiết người dùng');
    }
    return res.json();
  },

  /**
   * Điều chỉnh số dư JOY của người dùng (+/- JOY) theo đơn vị (JOY, kJOY, MJOY)
   */
  async adjustUserJoy(userId, amount, description, unit = 'JOY') {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/adjust-joy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ amount, description, unit })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Lỗi khi điều chỉnh số dư JOY');
    }
    return res.json();
  },

  /**
   * Thu hồi phiên làm việc người dùng
   */
  async revokeUserSession(userId) {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/revoke-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Không thể thu hồi phiên làm việc');
    }
    return res.json();
  },

  /**
   * Gửi email trực tiếp người dùng từ Admin Panel
   */
  async sendDirectUserEmail(userId, { subject, htmlMessage, instructions }) {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ subject, htmlMessage, instructions })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Không thể gửi email trực tiếp');
    }
    return res.json();
  },

  /**
   * Kiểm tra đối soát số dư Ví JOY theo tổng sổ cái JoyLedger
   */
  async getJoyReconciliation(userId) {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/joy-reconciliation`, {
      credentials: 'include'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Lỗi kiểm tra đối soát JOY');
    }
    return res.json();
  },

  /**
   * Khôi phục & Đồng bộ hóa chuẩn số dư Ví JOY theo Sổ cái
   */
  async executeJoyReconciliation(userId) {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/reconcile-joy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Lỗi thực thi đối soát số dư JOY');
    }
    return res.json();
  },

  /**
   * Lấy danh sách nhật ký kiểm toán thao tác quản trị viên (Admin Audit Logs)
   */
  async getAuditLogs(limit = 50) {
    const res = await fetch(`${API_BASE}/admin/audit-logs?limit=${limit}`, {
      credentials: 'include'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Không thể lấy nhật ký kiểm toán');
    }
    return res.json();
  },

  /**
   * Lấy danh sách toàn bộ sản phẩm Store cho Admin
   */
  async getStoreProducts() {
    const res = await fetch(`${API_BASE}/admin/store/products`, {
      credentials: 'include'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Không thể lấy sản phẩm Store');
    }
    return res.json();
  },

  /**
   * Tạo mới sản phẩm Utility Store
   */
  async createStoreProduct(productData) {
    const res = await fetch(`${API_BASE}/admin/store/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(productData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Không thể tạo sản phẩm');
    }
    return res.json();
  },

  /**
   * Cập nhật thông tin sản phẩm Utility Store
   */
  async updateStoreProduct(productId, productData) {
    const res = await fetch(`${API_BASE}/admin/store/products/${productId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(productData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Không thể cập nhật sản phẩm');
    }
    return res.json();
  },

  /**
   * Bật / Tắt kích hoạt sản phẩm Utility Store
   */
  async toggleStoreProduct(productId) {
    const res = await fetch(`${API_BASE}/admin/store/products/${productId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Không thể bật/tắt sản phẩm');
    }
    return res.json();
  },

  /**
   * Lấy danh sách đơn hàng mua sắm Utility Store
   */
  async getStoreOrders(limit = 100) {
    const res = await fetch(`${API_BASE}/admin/store/orders?limit=${limit}`, {
      credentials: 'include'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Không thể lấy danh sách đơn hàng');
    }
    return res.json();
  },

  /**
   * Hủy đơn hàng và Hoàn tiền JOY 1-Click
   */
  async cancelAndRefundStoreOrder(orderId) {
    const res = await fetch(`${API_BASE}/admin/store/orders/${orderId}/cancel-refund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Lỗi khi hủy đơn và hoàn JOY');
    }
    return res.json();
  },

  /**
   * Đóng băng / Mở đóng băng Ví JOY người dùng
   */
  async toggleUserWalletFreeze(userId) {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/toggle-wallet-freeze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Lỗi đóng băng Ví JOY');
    }
    return res.json();
  },

  /**
   * Phê duyệt / Thu hồi trạng thái Sinh viên EDU
   */
  async toggleUserEduStatus(userId) {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/toggle-edu-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Lỗi cập nhật trạng thái EDU');
    }
    return res.json();
  },

  /**
   * Cập nhật cài đặt tài khoản Admin & Đổi mật khẩu
   */
  async updateAdminAccountSettings(data) {
    const res = await fetch(`${API_BASE}/admin/account-settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Không thể cập nhật tài khoản Admin');
    }
    return res.json();
  },

  /**
   * Chỉnh sửa thông tin thành viên và gia hạn thời hạn sử dụng (expiresAt)
   */
  async updateUserProfileAndExpiration(userId, updateData) {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/update-profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updateData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Không thể cập nhật hồ sơ người dùng');
    }
    return res.json();
  },

  /**
   * Gửi tặng Voucher & Quà tặng JOY tự động dịch theo ngôn ngữ của thành viên
   */
  async sendUserVoucher(userId, voucherData) {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/send-voucher`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(voucherData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Lỗi gửi Voucher quà tặng');
    }
    return res.json();
  },

  /**
   * Quét rủi ro an ninh & biến động JOY tự động (AI Auto-Moderator)
   */
  async runAutoModerationScan() {
    const res = await fetch(`${API_BASE}/admin/brain/auto-moderator/scan`, {
      credentials: 'include'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Không thể chạy AI Auto-Moderator Scan');
    }
    return res.json();
  },

  /**
   * Xử lý cảnh báo rủi ro an ninh AI
   */
  async resolveRiskFlag(userId, freezeWallet = false, action = 'DISMISS') {
    const res = await fetch(`${API_BASE}/admin/brain/auto-moderator/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ userId, freezeWallet, action })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Lỗi xử lý cảnh báo AI risk');
    }
    return res.json();
  }
};

export default adminBrainApi;
