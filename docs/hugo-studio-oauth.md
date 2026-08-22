# Đăng nhập bằng Hugo Studio (OAuth 2.0)

Hugo Studio cung cấp luồng OAuth 2.0 Authorization Code bắt buộc PKCE S256 để
app/web khác có thể dùng tài khoản thành viên Hugo Studio làm danh tính đăng
nhập. Hệ thống ngoài không nhận mật khẩu, cookie hoặc JWT nội bộ của Hugo
Studio.

## 1. Đăng ký ứng dụng

1. Đăng nhập Admin Hugo Studio.
2. Mở `/admin?tab=oauth` → **Thêm ứng dụng**.
3. Chọn đúng loại client:
   - **Web có backend / confidential**: secret chỉ đặt ở backend.
   - **Mobile hoặc SPA / public**: không có secret, bảo vệ bằng PKCE.
4. Khai báo callback URL. URI callback gửi lúc đăng nhập phải khớp tuyệt đối,
   bao gồm scheme, host, port và path.
5. Sao chép `client_id` và, với confidential client, `client_secret`. Secret
   chỉ được hiển thị đúng một lần.

Production callback phải dùng HTTPS. HTTP chỉ được dùng với `localhost` hoặc
loopback. App native có thể đăng ký custom scheme, ví dụ
`com.example.myapp://oauth/hugo`.

## 2. Endpoint

Với production issuer `https://www.hugowishpax.studio`:

| Mục đích | Endpoint |
|---|---|
| Xin người dùng cấp quyền | `GET /oauth/authorize` |
| Đổi/refresh token | `POST /api/oauth/token` |
| Đọc hồ sơ | `GET /api/oauth/userinfo` |
| Thu hồi token | `POST /api/oauth/revoke` |
| Kiểm tra token (confidential) | `POST /api/oauth/introspect` |
| Metadata chuẩn RFC 8414 | `GET /.well-known/oauth-authorization-server` |

Scope hiện có:

- `profile`: tên hiển thị, ảnh đại diện.
- `email`: email đã xác minh.

`sub` là định danh ổn định nhưng riêng biệt theo từng client. Hai ứng dụng
không thể dùng `sub` để âm thầm đối chiếu cùng một người.

## 3. Bắt đầu đăng nhập

App tạo ba giá trị ngẫu nhiên và lưu chúng trong session phía app:

- `state`: chống CSRF ở callback.
- `code_verifier`: chuỗi ngẫu nhiên 43–128 ký tự thuộc tập ký tự PKCE.
- `code_challenge = BASE64URL(SHA256(code_verifier))`.

Ví dụ trên Node.js 18+:

```js
import crypto from "node:crypto";

const base64url = (buffer) => buffer.toString("base64url");
const state = base64url(crypto.randomBytes(24));
const verifier = base64url(crypto.randomBytes(48));
const challenge = base64url(crypto.createHash("sha256").update(verifier).digest());

// Lưu state + verifier vào session của app trước khi redirect.
req.session.hugoOAuth = { state, verifier };

const authorize = new URL("https://www.hugowishpax.studio/oauth/authorize");
authorize.search = new URLSearchParams({
  response_type: "code",
  client_id: process.env.HUGO_CLIENT_ID,
  redirect_uri: "https://your-app.com/auth/hugo/callback",
  scope: "profile email",
  state,
  code_challenge: challenge,
  code_challenge_method: "S256",
}).toString();

res.redirect(authorize.toString());
```

Người chưa đăng nhập sẽ được đưa tới trang đăng nhập Hugo Studio rồi quay lại
màn hình cấp quyền. Khi đồng ý, Hugo Studio redirect về callback:

```text
https://your-app.com/auth/hugo/callback?code=hsc_...&state=...
```

Nếu từ chối, callback nhận `error=access_denied` và cùng `state` ban đầu.

## 4. Callback và đổi code lấy token

App bắt buộc so sánh `state` bằng giá trị đã lưu trước khi dùng `code`. Với
confidential client, thao tác đổi token phải diễn ra ở backend:

```js
app.get("/auth/hugo/callback", async (req, res) => {
  const pending = req.session.hugoOAuth;
  if (!pending || req.query.state !== pending.state) {
    return res.status(400).send("Invalid OAuth state");
  }
  if (req.query.error) return res.status(401).send("Hugo login was denied");

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: process.env.HUGO_CLIENT_ID,
    client_secret: process.env.HUGO_CLIENT_SECRET,
    code: String(req.query.code),
    redirect_uri: "https://your-app.com/auth/hugo/callback",
    code_verifier: pending.verifier,
  });

  const tokenResponse = await fetch("https://www.hugowishpax.studio/api/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const tokens = await tokenResponse.json();
  if (!tokenResponse.ok) return res.status(401).json(tokens);

  const profileResponse = await fetch("https://www.hugowishpax.studio/api/oauth/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const profile = await profileResponse.json();

  // Upsert local user by provider="hugo" + providerUserId=profile.sub.
  // Sau đó phát session/cookie CỦA APP BẠN, không chuyển access token ra URL.
  const user = await upsertUser({
    provider: "hugo",
    providerUserId: profile.sub,
    email: profile.email,
    name: profile.name,
    avatarUrl: profile.picture,
  });
  req.session.userId = user.id;
  delete req.session.hugoOAuth;
  res.redirect("/dashboard");
});
```

Public client bỏ `client_secret` nhưng vẫn gửi `client_id`, `code_verifier` và
đúng `redirect_uri`. Không bao giờ đóng gói confidential secret vào JavaScript,
IPA hoặc APK.

## 5. Refresh, logout và thu hồi

Access token sống 1 giờ. Refresh token sống tối đa 30 ngày và được xoay sau mỗi
lần dùng:

```http
POST /api/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token&client_id=...&client_secret=...&refresh_token=hsr_...
```

App phải thay cả access token và refresh token bằng cặp mới trong response.

Khi người dùng ngắt kết nối, gọi:

```http
POST /api/oauth/revoke
Content-Type: application/x-www-form-urlencoded

client_id=...&client_secret=...&token=hsr_...
```

Admin có thể thu hồi toàn bộ token, tắt client hoặc xoay secret tại
`/admin?tab=oauth`. Xoay secret tự động thu hồi toàn bộ token cũ.

## 6. Checklist production

- Đặt `OAUTH_ISSUER=https://www.hugowishpax.studio` trong backend.
- Dùng HTTPS cho cả Hugo Studio và callback app.
- Lưu client secret/refresh token trong secret manager hoặc dữ liệu mã hóa.
- Cookie session của app callback phải `HttpOnly`, `Secure`, `SameSite=Lax`.
- Kiểm tra `state`, dùng PKCE S256 và không log code/token/secret.
- Dùng `sub` làm khóa liên kết; email có thể thay đổi trong tương lai.
- Khi nghi ngờ lộ secret: xoay secret trong Admin rồi cập nhật app ngay.
