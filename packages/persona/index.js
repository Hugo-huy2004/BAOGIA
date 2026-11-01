// Persona — danh tính hiển thị CÔNG KHAI của một tài khoản Hugo Studio (biệt danh + nhân vật
// pixel-art), dùng chung cho Education Hugo và mọi web/app sau này, kể cả web khách ngoài
// Hugo Studio. Không bao giờ chứa tên thật, email hay ảnh thật.
//
//   luật kiểm (web + máy chủ):  checkNickname, checkAvatar
//   gọi API /api/persona:        new PersonaClient({ baseUrl })
//   vẽ nhân vật (chỉ trình duyệt): import { avatarSvg } from 'packages/persona/render.js'
export { NICKNAME_MAX, NICKNAME_MIN, checkNickname } from './nickname.js';
export { AVATAR_COLORS, AVATAR_PARTS, checkAvatar, randomAvatar } from './avatar.js';
export { PersonaClient, PersonaError } from './PersonaClient.js';
