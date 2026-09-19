// Soát danh tính người gọi ở ví JOY — KHÔNG cần DB, KHÔNG cần mạng.
//
// Vì sao phải có bộ này: ví là endpoint trả về SỐ DƯ + LỊCH SỬ GIAO DỊCH. Một
// bản vá ngày 2026-09-20 đã phải gỡ ba đường lấy danh tính tự viết trong
// joyWalletController.js:
//
//   1. `req.query.email` được tin  → `?email=nan-nhan@gmail.com` trả về ví người khác
//   2. `jwt.verify(req.cookies.jwt)` → cookie ADMIN dùng làm danh tính member
//   3. fallback "khách" trả 200      → che mất việc cổng chặn không hề chạy
//
// Luật duy nhất còn lại: `requireMember` là nơi DUY NHẤT nói người gọi là ai, và
// controller chỉ đọc `req.memberEmail`. Bộ này đỏ nếu ai đó mở lại một trong ba
// đường trên.
//
// Chạy: npm run check:wallet-auth
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { getWalletOverview, claimDailyCheckin } from '../controllers/joyWalletController.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const serverDir = path.resolve(here, '..');

let failed = 0;
const check = (ok, label) => { console.log(`${ok ? '✅' : '❌'} ${label}`); if (!ok) failed++; };

/** `res` giả: ghi lại status + payload thay vì gửi đi. */
function fakeRes() {
  const r = { statusCode: 200, body: null };
  r.status = (code) => { r.statusCode = code; return r; };
  r.json = (payload) => { r.body = payload; return r; };
  return r;
}

/**
 * Một request của KẺ TẤN CÔNG: mang đủ mọi thứ mà bản cũ từng tin, nhưng KHÔNG
 * có `req.memberEmail` — tức `requireMember` chưa từng cho nó qua.
 */
const attackerReq = () => ({
  memberEmail: undefined,
  query: { email: 'nan-nhan@gmail.com' },
  body: {},
  cookies: { jwt: 'dấu-cookie-admin', member_jwt: 'token-bịa' },
  headers: { authorization: 'Bearer token-bịa' },
  session: { memberEmail: 'nan-nhan@gmail.com' },
});

// ── 1. Không qua cổng thì không có ví ────────────────────────────────────────
const r1 = fakeRes();
await getWalletOverview(attackerReq(), r1);
check(r1.statusCode === 401, 'overview: không có req.memberEmail → 401 (không phải 200 "khách")');
check(!r1.body?.balance && !r1.body?.card && !r1.body?.recentTransactions,
  'overview: không rò balance / card / recentTransactions khi chưa qua cổng');

const r2 = fakeRes();
await claimDailyCheckin(attackerReq(), r2);
check(r2.statusCode === 401, 'claim-daily: không có req.memberEmail → 401');
check(!r2.body?.reward && !r2.body?.balance, 'claim-daily: không phát thưởng khi chưa qua cổng');

// ── 2. Ba đường lấy danh tính tự viết phải KHÔNG quay lại ────────────────────
const controllerSrc = await readFile(path.join(serverDir, 'controllers/joyWalletController.js'), 'utf8');
const code = controllerSrc.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');  // bỏ comment
check(!/req\.query\??\.email/.test(code), 'controller: không đọc email từ query');
check(!/req\.body\??\.email/.test(code), 'controller: không đọc email từ body');
check(!/jwt\.verify/.test(code), 'controller: không tự jwt.verify (cổng duy nhất là requireMember)');
check(!/req\.cookies/.test(code), 'controller: không tự đọc cookie');

// ── 3. Cổng phải được GẮN ở router, không chỉ "controller tự xử" ─────────────
const routesSrc = await readFile(path.join(serverDir, 'routes/joyRoutes.js'), 'utf8');
for (const [method, route] of [['get', '/wallet/overview'], ['post', '/wallet/claim-daily']]) {
  const re = new RegExp(`router\\.${method}\\(\\s*['"]${route}['"]\\s*,\\s*requireMember\\b`);
  check(re.test(routesSrc), `router: ${method.toUpperCase()} ${route} có requireMember ngay sau đường dẫn`);
}

// ── 4. Cổng joyDenom cũ không được quay lại khoá toàn hệ thống ───────────────
// JOY chỉ còn một đơn vị, nên bảng JOY_DENOMS không còn là thứ để chặn ai cả.
// Cổng cũ so `JOY_DENOMS[bio.joyDenom]` với bảng chỉ có khoá theo mã ngôn ngữ
// (en/vi…) trong khi hồ sơ ghi 'JOY' và schema mặc định là '' → MỌI thành viên
// ăn 403 trên MỌI route member, và onboarding không bao giờ hỏi để thoát ra.
const authSrc = await readFile(path.join(serverDir, 'middleware/authMiddleware.js'), 'utf8');
const authCode = authSrc.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
check(!/JOY_DENOMS\s*\[/.test(authCode),
  'requireMember: không dùng JOY_DENOMS[...] làm cổng chặn (nguồn của 403 toàn hệ thống)');

// Và cái bẫy CỤ THỂ đã gây ra lockout: giá trị hồ sơ THỰC SỰ ghi vào joyDenom
// không nằm trong JOY_DENOMS. Nếu có ai gắn lại cổng tra bảng, nó sẽ khoá sạch —
// nên bộ này khẳng định rõ sự lệch đó tồn tại VÀ không ai dùng nó để chặn.
const { JOY_DENOMS } = await import('../../shared/joyCurrency.js');
const { PROFILE_FIELDS } = await import('../utils/profileRequirements.js');
const denomField = PROFILE_FIELDS.find((f) => f.key === 'joyDenom');
check(!!denomField, 'profileRequirements: vẫn có mục joyDenom để soát');
if (denomField) {
  const written = {};
  denomField.apply(written, 'JOY');
  check(denomField.required === false && denomField.isMissing(written) === false,
    `profileRequirements: joyDenom không còn bắt buộc, onboarding không hỏi (ghi "${written.joyDenom}")`);
  check(!Object.keys(JOY_DENOMS).includes(written.joyDenom),
    `joyDenom hồ sơ ghi ("${written.joyDenom}") KHÔNG phải khoá của JOY_DENOMS `
    + `[${Object.keys(JOY_DENOMS).join(',')}] — nên tuyệt đối không được tra bảng để chặn`);
}

console.log(failed ? `\n❌ Ví JOY: ${failed} mục chưa đạt` : '\n✅ Danh tính người gọi ở ví JOY đạt');
process.exit(failed ? 1 : 0);
