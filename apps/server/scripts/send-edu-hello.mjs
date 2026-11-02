/**
 * Thư "Tạm biệt Hugo Team · Xin chào Education Hugo" (02/11/2026).
 *
 *   node apps/server/scripts/send-edu-hello.mjs                 # chạy thử: chỉ in danh sách người nhận
 *   node apps/server/scripts/send-edu-hello.mjs --preview=a@b.c # gửi 1 thư xem trước tới a@b.c
 *   node apps/server/scripts/send-edu-hello.mjs --html          # ghi bản HTML ra edu-hello.html để mở xem
 *   node apps/server/scripts/send-edu-hello.mjs --send          # gửi thật cho mọi người nhận
 *
 * Người nhận = thành viên Hugo Team (hugoteamdevs) ∪ người học Edu (edulearners), bỏ trùng.
 * Thêm --bios để gửi cho mọi thành viên Hugo Studio có Bio.
 * Mascot động là GIF ở education.hugowishpax.studio/edu/mail/anim/ — deploy Edu trước khi gửi.
 */
import 'dotenv/config';
import fs from 'node:fs';
import mongoose from 'mongoose';
import { sendCustomEmail, escapeHtml as e } from '../services/emailService.js';

const EDU = 'https://education.hugowishpax.studio';
const GIF = (name) => `${EDU}/edu/mail/anim/${name}.gif`;
const args = new Set(process.argv.slice(2));
const preview = process.argv.find((a) => a.startsWith('--preview='))?.split('=')[1];

const BLUE = "#1cb0f6";
const SITE = "https://www.hugowishpax.studio";
const font = "font-family:-apple-system,BlinkMacSystemFont,\x27Segoe UI\x27,Roboto,Arial,sans-serif;";
const mascot = (name, w, alt = "") => `<img src="${GIF(name)}" width="${w}" height="${Math.round(w * 270 / 240)}" alt="${alt}" style="display:block;border:0;margin:0 auto;">`;
const button = (label, href = EDU) => `<a href="${href}" style="display:inline-block;background:${BLUE};color:#fff;padding:13px 34px;border-radius:12px;border-bottom:4px solid #1899d6;font-size:15px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;text-decoration:none;">${label}</a>`;
const link = (label, href = EDU) => `<a href="${href}" style="color:${BLUE};font-size:14px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;text-decoration:none;">${label}</a>`;
const hr = `<tr><td style="padding:0 40px;"><div style="border-top:2px solid #e5e5e5;"></div></td></tr>`;
const h = (t) => `<h2 style="margin:0 0 10px;font-size:19px;line-height:1.3;color:#3c3c3c;">${t}</h2>`;
const para = (t) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#4b4b4b;">${t}</p>`;
// Một mục: ảnh một bên, chữ một bên, đổi bên xen kẽ như thư Duolingo.
const row = (img, text, imgRight = false) => {
  const pic = `<td class="col" width="200" valign="middle" align="center" style="padding:28px 10px;">${img}</td>`;
  const txt = `<td class="col" valign="middle" style="padding:28px 10px;">${text}</td>`;
  return `<tr><td style="padding:0 30px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>${imgRight ? txt + pic : pic + txt}</tr></table></td></tr>`;
};

const html = (name) => `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light">
<style>@media (max-width:560px){.col{display:block!important;width:100%!important;text-align:center!important}}</style></head>
<body data-hugo-mail style="margin:0;padding:0;background:#ffffff;${font}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Việc học đã có nhà mới — và vài khoá học bí mật đang chờ bạn mở.</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;">
  <tr><td align="center" style="padding:36px 20px 4px;font-size:24px;font-weight:800;color:#afafaf;letter-spacing:-.5px;">education hugo</td></tr>
  <tr><td align="center" style="padding:10px 40px 0;">${mascot("buddy-done", 190, "Mascot vẫy tay")}</td></tr>
  <tr><td align="center" style="padding:6px 50px 30px;">
    <h1 style="margin:0 0 12px;font-size:28px;color:#3c3c3c;">Chào ${e(name || "bạn")}!</h1>
    <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#4b4b4b;">Hôm nay mình nói <b>tạm biệt</b> với Hugo Team trên Hugo Studio, và nói <b>xin chào</b> với ngôi nhà mới của việc học: <b>Education Hugo</b>. Cảm ơn bạn đã cùng học, cùng làm và cùng góp ý suốt thời gian qua!</p>
    ${button("Ghé nhà mới")}
  </td></tr>
  ${hr}
  ${row(mascot("buddy-learn", 150), h("Tạm biệt Hugo Team") + para("Hugo Team và các khoá học đã rời ứng dụng Hugo Studio. Ví JOY, Danh Thiếp, HugoPSY và các app khác vẫn ở đó như cũ.") + link("Mở Hugo Studio", SITE))}
  ${hr}
  ${row(`<table role="presentation" cellspacing="0" cellpadding="0" align="center"><tr><td>${mascot("cast-1", 80)}</td><td>${mascot("cast-2", 80)}</td></tr><tr><td>${mascot("cast-3", 80)}</td><td>${mascot("cast-5", 80)}</td></tr></table>`,
    h("Xin chào Education Hugo") + para("Miễn phí cho học sinh, sinh viên mọi ngành. Học từng bước nhỏ vài phút, giữ lửa mỗi ngày, nhận <b>Ngọc</b> khi trả lời đúng, kết bạn và hỏi đáp cùng cộng đồng.") + link("Bắt đầu học"), true)}
  ${hr}
  ${row(mascot("buddy-exam", 150, "Mascot giữ bí mật"), h("Bật mí các khoá học…") + para("Chưa kể tên đâu! Chỉ hé lộ: một khoá dắt bạn từ <b>dòng code đầu tiên</b> tới sản phẩm của riêng mình, một khoá dạy bạn <b>trò chuyện với dữ liệu</b> ngay trong trình duyệt, đủ <b>Việt · English · 中文</b> — và những khoá <b>ngoài lập trình</b> đang được soạn.") + link("Mở ra xem"))}
  ${hr}
  <tr><td align="center" style="padding:30px 50px 10px;">
    ${h("Vào học trong 1 phút")}
    ${para("Bấm <b>Đăng nhập bằng Hugo Studio</b> (hoặc Google, passkey/Face ID) rồi thêm vào màn hình chính. Edu dùng dữ liệu mới nên tiến độ bắt đầu lại từ đầu — một khởi đầu thật tươi!")}
    ${button("Học ngay")}
  </td></tr>
  <tr><td style="padding:40px 40px 0;"><div style="border-top:2px solid #e5e5e5;"></div></td></tr>
  <tr><td align="center" style="padding:20px 40px 36px;font-size:12.5px;line-height:1.7;color:#afafaf;">
    Bạn nhận thư này vì từng tham gia Hugo Team hoặc học trên Hugo Studio.<br>
    Hugo Studio · dự án phi lợi nhuận · <a href="${SITE}" style="color:#afafaf;">hugowishpax.studio</a> · <a href="${EDU}" style="color:#afafaf;">education.hugowishpax.studio</a>
  </td></tr>
</table></td></tr></table></body></html>`;
const SUBJECT = 'Tạm biệt Hugo Team, xin chào Education Hugo';

if (args.has('--html')) {
  fs.writeFileSync('edu-hello.html', html('Hugo'));
  console.log('Đã ghi edu-hello.html');
  process.exit(0);
}
if (preview) {
  console.log(await sendCustomEmail(preview, `[Xem trước] ${SUBJECT}`, html('Hugo')));
  process.exit(0);
}

await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection.db;
const emails = async (coll, field = 'email') => (await db.collection(coll).distinct(field)).filter(Boolean).map((x) => String(x).toLowerCase());
const team = await emails('hugoteamdevs');
const edu = await emails('edulearners');
const bios = args.has('--bios') ? await emails('bios') : [];
const recipients = [...new Set([...team, ...edu, ...bios])];
console.log(`Hugo Team: ${team.length} · Người học Edu: ${edu.length}${args.has('--bios') ? ` · Bio: ${bios.length}` : ''} → ${recipients.length} người nhận (đã bỏ trùng)`);

if (!args.has('--send')) {
  recipients.forEach((x) => console.log(' ·', x));
  console.log('\nChạy thử — chưa gửi. Thêm --send để gửi thật.');
  await mongoose.disconnect();
  process.exit(0);
}

const nameOf = async (email) => (await db.collection('bios').findOne({ email }, { projection: { displayName: 1 } }))?.displayName;
let sent = 0;
for (const to of recipients) {
  const r = await sendCustomEmail(to, SUBJECT, html(await nameOf(to)), null, null, null, null, 'essential');
  console.log(r.success ? '✓' : '✗', to, r.error || '');
  if (r.success) sent += 1;
  await new Promise((ok) => setTimeout(ok, 600)); // Resend free: 2 thư/giây
}
console.log(`\nĐã gửi ${sent}/${recipients.length}.`);
await mongoose.disconnect();
