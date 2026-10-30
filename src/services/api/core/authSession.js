import { API_BASE, isCrossOriginApi } from "../../../config/apiBase";

const MEMBER_SESSION_KEY = "price-doc-member-session";
const ADMIN_SESSION_KEY = "price-doc-admin-session";

// Login/OTP writes are never retried: the server may already have consumed them.
const fetchAuth = (url, options) => fetch(url, {
  ...options,
  signal: AbortSignal.timeout(30000),
});

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
  (persist ? sessionStorage : localStorage).removeItem(key);
};

export const getMemberSession = () => {
  const session = readSession(MEMBER_SESSION_KEY);
  // Cross-origin/native clients need the Bearer fallback; same-origin web
  // sessions deliberately keep the token only in the HttpOnly cookie.
  if (session && isCrossOriginApi && !session.token) {
    localStorage.removeItem(MEMBER_SESSION_KEY);
    sessionStorage.removeItem(MEMBER_SESSION_KEY);
    return null;
  }
  return session;
};
export const getAdminSession = () => readSession(ADMIN_SESSION_KEY);
export const updateAdminSession = (admin) => {
  const current = readSession(ADMIN_SESSION_KEY);
  if (!current || !admin) return current;
  const next = {
    ...current,
    id: admin.id || current.id,
    displayName: admin.displayName || current.displayName || current.username,
    adminRole: admin.adminRole || admin.role || current.adminRole || 'owner',
    permissions: Array.isArray(admin.permissions) ? admin.permissions : (current.permissions || ['*']),
  };
  writeSession(ADMIN_SESSION_KEY, next, Boolean(localStorage.getItem(ADMIN_SESSION_KEY)));
  return next;
};

export const clearAdminSession = () => {
  localStorage.removeItem(ADMIN_SESSION_KEY);
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("hugo:admin-session-expired"));
  }
};

export const clearMemberSession = () => {
  localStorage.removeItem(MEMBER_SESSION_KEY);
  sessionStorage.removeItem(MEMBER_SESSION_KEY);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("hugo:member-session-expired"));
  }
};

// Bearer token attached to member API calls (see apiAuthInterceptor.js).
export const getMemberToken = () => getMemberSession()?.token || null;
export const getAdminToken = () => getAdminSession()?.token || null;

export const loginMember = (member) => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 14); // Lưu 14 ngày

  const session = {
    role: "member",
    email: member.email,
    displayName: member.displayName || member.email,
    provider: member.provider || "google",
    avatarUrl: member.avatarUrl || "",
    isEduVerified: member.isEduVerified === true,
    // Same-origin web uses the HttpOnly cookie; only native/cross-origin
    // clients need a JavaScript-readable Bearer fallback.
    token: isCrossOriginApi ? (member.token || "") : "",
    loginAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString()
  };

  writeSession(MEMBER_SESSION_KEY, session);
  return session;
};

const authClients = () => import("../../../lib/authClient");
const errorText = (error, fallback) => error?.message || error?.statusText || fallback;

// Đăng nhập Google: máy chủ (Better Auth) tự xác minh ID token với Google.
// Trả { session, error } — không bao giờ tin payload Google giải mã ở client.
export const loginMemberWithGoogle = async (credential) => {
  try {
    const response = await fetchAuth(`${API_BASE}/auth/sign-in/social`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: "google", idToken: { token: credential } }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.user) {
      return { session: null, error: data.message || "invalid_credential" };
    }
    const session = loginMember({
      email: data.user.email,
      displayName: data.user.name,
      avatarUrl: data.user.image,
      provider: "google",
      token: response.headers.get("set-auth-token") || data.token,
    });
    return { session, error: null };
  } catch (error) {
    console.error("Lỗi khi đăng nhập Google:", error);
    return { session: null, error: "network" };
  }
};

// Đăng nhập bằng passkey (vân tay / Face ID) đã đăng ký trên máy này.
export const loginMemberWithPasskey = async () => {
  const { memberAuthClient } = await authClients();
  let token = "";
  const { data, error } = await memberAuthClient.signIn.passkey({
    fetchOptions: { onSuccess: (ctx) => { token = ctx.response.headers.get("set-auth-token") || ""; } },
  });
  const user = data?.user || (await memberAuthClient.getSession()).data?.user;
  if (error || !user) return { session: null, error: errorText(error, "Không đăng nhập được bằng passkey.") };
  return { session: loginMember({ email: user.email, displayName: user.name, avatarUrl: user.image, provider: "passkey", token }), error: null };
};

// Quản trị: mã 6 số gửi về email của chính admin đó (không mật khẩu, không Telegram).
export const sendAdminCode = async (email) => {
  const { adminAuthClient } = await authClients();
  const { error } = await adminAuthClient.emailOtp.sendVerificationOtp({ email: email.trim().toLowerCase(), type: "sign-in" });
  return { error: error ? errorText(error, "Chưa gửi được mã.") : null };
};

export const verifyAdminCode = async (email, otp) => {
  const { adminAuthClient } = await authClients();
  let token = "";
  const { data, error } = await adminAuthClient.signIn.emailOtp({
    email: email.trim().toLowerCase(),
    otp,
    fetchOptions: { onSuccess: (ctx) => { token = ctx.response.headers.get("set-auth-token") || ""; } },
  });
  if (error || !data?.user) {
    const message = error?.code === "INVALID_OTP" || error?.code === "OTP_EXPIRED"
      ? "Mã không đúng hoặc đã hết hạn."
      : errorText(error, "Không đăng nhập được.");
    return { session: null, error: message };
  }
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 14);
  const session = {
    role: "admin",
    // Token chỉ lưu ở máy khi API khác origin (bản native); web dùng cookie httpOnly.
    token: isCrossOriginApi ? token : "",
    username: data.user.email,
    displayName: data.user.name,
    loginAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
  writeSession(ADMIN_SESSION_KEY, session, true);
  return { session, error: null };
};

export const logoutAuth = async () => {
  localStorage.removeItem(MEMBER_SESSION_KEY);
  localStorage.removeItem(ADMIN_SESSION_KEY);
  sessionStorage.removeItem(MEMBER_SESSION_KEY);
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  const post = (path) => fetchAuth(`${API_BASE}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  await Promise.allSettled([post("/admin-auth/sign-out"), post("/auth/sign-out")]);
};

export const isMemberAuthenticated = () => Boolean(getMemberSession());
export const isAdminAuthenticated = () => Boolean(getAdminSession());
