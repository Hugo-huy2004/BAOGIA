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
  const expectedUsernameHash = import.meta.env.VITE_ADMIN_USERNAME_HASH || "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918";
  const expectedPasswordHash = import.meta.env.VITE_ADMIN_PASSWORD_HASH || "2403926830cc16d2db7b34fe5047b2029577501a3e61c5b8b9f39e31d4d38c53";

  // SHA-256 helper
  const sha256 = async (message) => {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const usernameHash = await sha256(credentials.username || '');
  const passwordHash = await sha256(credentials.password || '');

  if (
    usernameHash !== expectedUsernameHash ||
    passwordHash !== expectedPasswordHash
  ) {
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
};

export const logoutAuth = () => {
  localStorage.removeItem(MEMBER_SESSION_KEY);
  localStorage.removeItem(ADMIN_SESSION_KEY);
  sessionStorage.removeItem(MEMBER_SESSION_KEY);
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
};

export const isMemberAuthenticated = () => Boolean(getMemberSession());
export const isAdminAuthenticated = () => Boolean(getAdminSession());