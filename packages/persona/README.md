# packages/persona — Persona Hugo Studio

Danh tính hiển thị **công khai** của một tài khoản Hugo Studio: **biệt danh** + **nhân vật pixel-art**
(DiceBear "Pixel Art", CC0 1.0). Một bản cho mọi web/app — Education Hugo là nơi dùng đầu tiên,
web/app khách thuộc hay ngoài Hugo Studio dùng lại y nguyên. Không chứa tên thật, email, ảnh thật.

| File | Chạy ở | Việc |
|---|---|---|
| `nickname.js` | web + máy chủ | `checkNickname`: chỉ chữ + emoji, 2–20 ký tự |
| `avatar.js` | web + máy chủ | `AVATAR_PARTS`, `AVATAR_COLORS`, `checkAvatar` (chỉ nhận mã trong danh sách), `randomAvatar` |
| `PersonaClient.js` | web/app | lớp gọi `GET/PUT /api/persona` (cookie phiên hoặc bearer) |
| `render.js` | trình duyệt | `avatarSvg`, `avatarDataUri` — import riêng để không kéo DiceBear vào bundle khi không cần |

Máy chủ: `apps/server/models/Persona.js` (khoá email) → `apps/server/modules/persona/PersonaService.js`
(module khác đọc/ghi qua lớp này, `forEmails` cho bảng xếp hạng) → `apps/server/routes/personaRoutes.js`
(`requireMemberSession`, danh tính lấy từ `req.memberEmail`).

```js
import { PersonaClient } from '../../packages/persona';
const persona = new PersonaClient({ baseUrl: '/api' });
const me = await persona.get();                 // { nickname, avatar, complete }
await persona.save({ nickname: 'Lửa Xanh 🔥', avatar });
```

Luồng bắt buộc (Edu, `apps/web/src/education/EduPersona.jsx` → `PersonaGate`): đăng nhập → hồ sơ
Hugo Studio còn thiếu (tài khoản mới; máy chủ quyết thiếu gì) → biệt danh → nhân vật. Toàn màn,
phải xong mới vào. Sửa lại ở trang Hồ sơ. Web mới muốn cùng luồng: dùng `PersonaClient` + dựng màn
tương tự, không thêm route máy chủ.
