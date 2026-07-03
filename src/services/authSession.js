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

const writeSession = (key, value, persist = true) => {
  const target = persist ? localStorage : sessionStorage;
  target.setItem(key, JSON.stringify(value));
};

export const getMemberSession = () => {
  const session = readSession(MEMBER_SESSION_KEY);
  // Sessions minted before server-side auth existed carry no token — the API
  // would reject every call, so treat them as expired and force a clean re-login.
  if (session && !session.token) {
    localStorage.removeItem(MEMBER_SESSION_KEY);
    sessionStorage.removeItem(MEMBER_SESSION_KEY);
    return null;
  }
  return session;
};
export const getAdminSession = () => readSession(ADMIN_SESSION_KEY);

// Bearer token attached to member API calls (see apiAuthInterceptor.js).
export const getMemberToken = () => getMemberSession()?.token || null;

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
    token: member.token || "",
    loginAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString()
  };

  writeSession(MEMBER_SESSION_KEY, session);
  return session;
};

// Server-verified Google login: exchanges the Google ID token for our own
// member session token. Returns { session, error } — never trusts a
// client-side-decoded Google payload for identity.
export const loginMemberWithGoogle = async (credential) => {
  try {
    const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
    const response = await fetch(`${API_BASE_URL}/auth/member/google`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) {
      return { session: null, error: data.error || 'invalid_credential' };
    }
    const session = loginMember({ ...data.member, token: data.token });
    return { session, error: null };
  } catch (error) {
    console.error('Lỗi khi đăng nhập Google:', error);
    return { session: null, error: 'network' };
  }
};

// Returns { session, error } instead of throwing/null so the caller can show
// a specific message (wrong credentials vs. network/server failure).
export const loginAdmin = async (credentials, { remember = true } = {}) => {
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

    if (response.status === 401 || response.status === 403) {
      return { session: null, error: 'invalid_credentials' };
    }
    if (!response.ok) {
      return { session: null, error: 'server_error' };
    }

    const data = await response.json();

    if (!data.success) {
      return { session: null, error: 'invalid_credentials' };
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

    writeSession(ADMIN_SESSION_KEY, session, remember);
    return { session, error: null };
  } catch (error) {
    console.error('Lỗi khi đăng nhập admin:', error);
    return { session: null, error: 'network' };
  }
};

export const logoutAuth = async () => {
  localStorage.removeItem(MEMBER_SESSION_KEY);
  localStorage.removeItem(ADMIN_SESSION_KEY);
  sessionStorage.removeItem(MEMBER_SESSION_KEY);
  sessionStorage.removeItem(ADMIN_SESSION_KEY);

  // Gọi API để xóa HttpOnly Cookie (admin + member)
  try {
    const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
    await Promise.allSettled([
      fetch(`${API_BASE_URL}/admin/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      }),
      fetch(`${API_BASE_URL}/auth/member/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      })
    ]);
  } catch (error) {
    console.error('Logout error:', error);
  }
};

export const isMemberAuthenticated = () => Boolean(getMemberSession());
export const isAdminAuthenticated = () => Boolean(getAdminSession());