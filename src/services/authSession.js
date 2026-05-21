const MEMBER_SESSION_KEY = "price-doc-member-session";
const ADMIN_SESSION_KEY = "price-doc-admin-session";

const readSession = (key) => {
  try {
    const raw = localStorage.getItem(key) || sessionStorage.getItem(key);
    if (!raw) return null;
    
    const parsed = JSON.parse(raw);
    
    // Kiểm tra xem session đã hết hạn 14 ngày chưa
    if (parsed.expiresAt) {
      if (new Date().getTime() > new Date(parsed.expiresAt).getTime()) {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
        return null;
      }
    }
    
    return parsed;
  } catch {
    return null;
  }
};

const writeSession = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const getMemberSession = () => readSession(MEMBER_SESSION_KEY);
export const getAdminSession = () => readSession(ADMIN_SESSION_KEY);

export const loginMember = (member) => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 14); // Lưu 14 ngày
  expiresAt.setHours(0, 0, 0, 0); // Qua 00:00 tính là 1 ngày dùng

  const session = {
    role: "member",
    email: member.email,
    displayName: member.displayName || member.email,
    provider: member.provider || "google",
    avatarUrl: member.avatarUrl || "",
    loginAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString()
  };

  writeSession(MEMBER_SESSION_KEY, session);
  return session;
};

export const loginAdmin = async (credentials) => {
  try {
    const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
    const response = await fetch(`${API_BASE_URL}/admin/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: credentials.username,
        password: credentials.password
      })
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    if (!data.success) {
      return null;
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14); // Lưu 14 ngày
    expiresAt.setHours(0, 0, 0, 0); // Qua 00:00 tính là 1 ngày dùng

    const session = {
      role: "admin",
      username: credentials.username,
      loginAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString()
    };

    writeSession(ADMIN_SESSION_KEY, session);
    return session;
  } catch (error) {
    console.error('Lỗi khi đăng nhập admin:', error);
    return null;
  }
};

export const logoutAuth = async () => {
  localStorage.removeItem(MEMBER_SESSION_KEY);
  localStorage.removeItem(ADMIN_SESSION_KEY);
  sessionStorage.removeItem(MEMBER_SESSION_KEY);
  sessionStorage.removeItem(ADMIN_SESSION_KEY);

  // Gọi API để xóa HttpOnly Cookie
  try {
    const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
    await fetch(`${API_BASE_URL}/admin/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Logout error:', error);
  }
};

export const isMemberAuthenticated = () => Boolean(getMemberSession());
export const isAdminAuthenticated = () => Boolean(getAdminSession());