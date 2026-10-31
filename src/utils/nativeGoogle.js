/**
 * ID token Google từ bảng chọn tài khoản của hệ điều hành (bản app trên store).
 *
 * Google Identity Services là thư viện trình duyệt: nó đối chiếu origin với
 * Console, mà origin của WebView là `capacitor://localhost` — Google không nhận.
 * Bản store đi qua bảng chọn tài khoản của máy, trả về cùng loại ID token, nên
 * mọi thứ phía sau (kể cả server) giữ nguyên.
 *
 * Ném lỗi `code: "NO_PLUGIN"` khi binary đang cài chưa có plugin native: khi đó
 * Capacitor lặng lẽ rơi về bản web của plugin, mở accounts.google.com trong
 * WebView và Google chặn bằng "Error 400: invalid_request" — người dùng không
 * thể đoán ra rằng việc cần làm là cài lại app.
 */
export async function nativeGoogleIdToken() {
  const { Capacitor } = await import("@capacitor/core");
  if (!Capacitor.isPluginAvailable("SocialLogin")) throw Object.assign(new Error("NO_PLUGIN"), { code: "NO_PLUGIN" });
  const { SocialLogin } = await import("@capgo/capacitor-social-login");
  await SocialLogin.initialize({
    google: {
      iOSClientId: import.meta.env.VITE_GOOGLE_IOS_CLIENT_ID,
      // Credential Manager của Android cần client id *web*, và nhờ nó `aud`
      // của token trả về khớp với bản web.
      webClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    },
  });
  const { result } = await SocialLogin.login({ provider: "google", options: { scopes: ["email", "profile"] } });
  return result?.idToken;
}
