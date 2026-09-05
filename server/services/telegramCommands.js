// Danh mục năng lực của bot Telegram — MỘT nguồn duy nhất cho ba việc:
//   1. Màn "Trợ giúp" Boss đọc.
//   2. Bản mô tả năng lực nhét vào prompt AI, để quản gia biết mình làm được gì.
//   3. HÀNG RÀO duyệt lệnh do AI đề xuất — AI không tự chế ra hành động mới
//      được, chỉ chọn trong đúng danh sách này.
//
// Vì sao cần hàng rào: quản gia giờ dịch tiếng người thành lệnh thật (dặn
// "khoá ví thằng abc lại" là ra lệnh `Khóa ví abc@...`). Nếu tin AI vô điều
// kiện thì một câu chữ lạ cũng thành lệnh chạy trên dữ liệu thật. Ở đây lệnh
// AI đề xuất phải KHỚP TUYỆT ĐỐI một mẫu dưới đây mới được hiện nút xác nhận,
// và mẫu nào `danger: true` thì luôn phải Boss bấm nút mới chạy — đúng luật
// "hành động ghi phải có người duyệt" trong docs/ai-workforce.md.

import crypto from 'node:crypto';

const EMAIL = String.raw`[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}`;

// Đơn vị JOY theo nước (xem docs/JOY denominations). Route webhook import lại
// hằng này thay vì giữ bản sao thứ hai — thêm đơn vị mới chỉ phải sửa một chỗ.
export const DENOM_PATTERN = 'joy|xu|điểm|diem|gem|gold|joyka|joyve|joyra|joyse|joymi|joyti|joyzo|joylu|kavo|velu|rami|sela|mira|tinu|zoma|luno';

// `danger: true` = có ghi vào dữ liệu thật (tiền, khoá, danh tính, gửi đi cho
// người dùng). Những lệnh này AI chỉ được ĐỀ XUẤT, Boss bấm nút mới chạy.
export const COMMANDS = [
  {
    id: 'check', danger: false, group: 'Thành viên',
    syntax: 'Kiểm tra <email>', example: 'Kiểm tra an@gmail.com',
    desc: 'Hồ sơ đầy đủ: ví, đơn vị tiền, trạng thái khoá, phiên đăng nhập',
    pattern: new RegExp(`^(?:kiểm tra|kiem tra|info|tra cứu|tra cuu)\\s+${EMAIL}$`, 'i'),
  },
  {
    id: 'filter', danger: false, group: 'Thành viên',
    syntax: 'Lọc <từ khoá>', example: 'Lọc ví trống',
    desc: 'Tìm thành viên theo tên, email, slug hoặc tiêu chí (ví trống, khoá ví…)',
    pattern: new RegExp('^(?:lọc|loc|bộ lọc|bo loc|filter|tìm|tim|tìm kiếm|tim kiem)\\s+.{2,}$', 'i'),
  },
  {
    id: 'joy', danger: true, group: 'Ví JOY',
    syntax: 'Cộng|Trừ|Gửi <số> <đơn vị> cho <email>', example: 'Cộng 500 kavo cho an@gmail.com',
    desc: 'Cộng hoặc trừ JOY, hiểu đơn vị riêng của từng tài khoản',
    pattern: new RegExp(
      `^(?:gửi|cộng|tặng|thưởng|trừ|chuyển)\\s+(?:(?:đến|cho|vào|của)?\\s*${EMAIL}\\s+[+-]?\\d+(?:[.,]\\d+)?\\s*(?:${DENOM_PATTERN})?`
      + `|[+-]?\\d+(?:[.,]\\d+)?\\s*(?:${DENOM_PATTERN})?\\s+(?:đến|cho|vào|của)?\\s*${EMAIL})$`, 'i'),
  },
  {
    id: 'wallet_lock', danger: true, group: 'Ví JOY',
    syntax: 'Khóa ví|Mở khóa ví <email>', example: 'Khóa ví an@gmail.com',
    desc: 'Đóng băng ví: không tiêu, không nhận, không chuyển',
    pattern: new RegExp(`^(?:khóa ví|mở khóa ví|khoa vi|mo khoa vi)\\s+${EMAIL}$`, 'i'),
  },
  {
    id: 'account_lock', danger: true, group: 'An ninh',
    syntax: 'Khóa tài khoản|Mở tài khoản <email>', example: 'Khóa tài khoản an@gmail.com',
    desc: 'Đình chỉ tài khoản, chặn đăng nhập',
    pattern: new RegExp(`^(?:khóa tài khoản|khoa tai khoan|mở tài khoản|mo tai khoan)\\s+${EMAIL}$`, 'i'),
  },
  {
    id: 'logout', danger: true, group: 'An ninh',
    syntax: 'Đăng xuất <email>', example: 'Đăng xuất an@gmail.com',
    desc: 'Thu hồi toàn bộ phiên đăng nhập của một người',
    pattern: new RegExp(`^(?:đăng xuất|dang xuat|logout|thu hồi phiên|thu hoi phien|reset mật khẩu|reset mat khau|reset pass)\\s+${EMAIL}$`, 'i'),
  },
  {
    id: 'rename', danger: true, group: 'Thành viên',
    syntax: 'Đổi tên <email> thành <tên>', example: 'Đổi tên an@gmail.com thành Nguyễn An',
    desc: 'Đổi tên hiển thị',
    pattern: new RegExp(`^(?:đổi tên|doi ten|change name)\\s+${EMAIL}\\s+(?:thành|thanh|to|=|:)?\\s*.{1,}$`, 'i'),
  },
  {
    id: 'reslug', danger: true, group: 'Thành viên',
    syntax: 'Đổi slug <email> thành <slug>', example: 'Đổi slug an@gmail.com thành nguyen-an',
    desc: 'Đổi địa chỉ trang bio công khai',
    pattern: new RegExp(`^(?:đổi slug|doi slug|change slug)\\s+${EMAIL}\\s+(?:thành|thanh|to|=|:)?\\s*[a-zA-Z0-9_-]+$`, 'i'),
  },
  {
    id: 'edu', danger: true, group: 'Thành viên',
    syntax: 'Bật edu|Tắt edu <email>', example: 'Bật edu an@gmail.com',
    desc: 'Duyệt hoặc huỷ xác minh sinh viên',
    pattern: new RegExp(`^(?:bật edu|bat edu|duyệt edu|duyet edu|xác minh edu|xac minh edu|tắt edu|tat edu)\\s+${EMAIL}$`, 'i'),
  },
  {
    id: 'notify', danger: true, group: 'Thành viên',
    syntax: 'Gửi thông báo <email> nội dung <lời nhắn>', example: 'Gửi thông báo an@gmail.com nội dung Chúc mừng bạn',
    desc: 'Đẩy một thông báo tới đúng một người',
    pattern: new RegExp(`^(?:gửi thông báo|gui thong bao|thông báo|thong bao|notify)\\s+${EMAIL}\\s+(?:nội dung|noi dung|content|=|:)?\\s*.{1,}$`, 'i'),
  },
  {
    id: 'maintenance', danger: true, group: 'Hệ thống',
    syntax: 'Bật bảo trì | Tắt bảo trì', example: 'Bật bảo trì',
    desc: 'Đóng/mở cổng toàn hệ thống',
    pattern: /^(?:bật bảo trì|bat bao tri|enable maintenance|tắt bảo trì|tat bao tri|disable maintenance)$/i,
  },
  {
    id: 'report', danger: false, group: 'Hệ thống',
    syntax: 'Báo cáo', example: 'Báo cáo',
    desc: 'Tổng quan: số thành viên, ticket chờ, ví đóng băng, bảo trì',
    pattern: /^(?:báo cáo|bao cao|briefing|status)$/i,
  },
  {
    id: 'security', danger: false, group: 'An ninh',
    syntax: 'An ninh [số giờ]', example: 'An ninh 24',
    desc: 'Bản tổng kết an ninh: máy quét dạo, khoá tự động, ca chờ duyệt',
    pattern: /^(?:an ninh|an ninh|security|bảo mật|bao mat)(?:\s+\d{1,3})?$/i,
  },
  {
    id: 'errors', danger: false, group: 'Hệ thống',
    syntax: 'Lỗi [số dòng]', example: 'Lỗi 5',
    desc: 'Các lỗi máy chủ gần nhất, gộp theo nội dung',
    pattern: /^(?:lỗi|loi|errors?|sự cố|su co)(?:\s+\d{1,2})?$/i,
  },
  {
    id: 'audit', danger: false, group: 'An ninh',
    syntax: 'Nhật ký', example: 'Nhật ký',
    desc: 'Nhật ký thao tác admin gần đây',
    pattern: /^(?:nhật ký|nhat ky|audit log)$/i,
  },
  {
    id: 'robot', danger: false, group: 'Hệ thống',
    syntax: 'Mở camera', example: 'Mở camera',
    desc: 'Link điều khiển robot/camera, hiệu lực ngắn',
    pattern: /^(?:mở vector|mo vector|open robot|mở robot|mo robot|mở cam|mở camera|open cam)$/i,
  },
  {
    id: 'geoblock', danger: true, group: 'An ninh',
    syntax: 'Chặn quốc gia <MÃ> | Chặn ASN <AS####>', example: 'Chặn quốc gia CN',
    desc: 'Chặn cả quốc gia (mã ISO 2 chữ) hoặc một nhà mạng (ASN) ở tường lửa Cloudflare',
    pattern: /^(?:chặn|chan|block)\s+(?:quốc gia|quoc gia|country)\s+[a-zA-Z]{2}$|^(?:chặn|chan|block)\s+asn\s+AS?\d{1,10}$/i,
  },
  {
    id: 'geounblock', danger: true, group: 'An ninh',
    syntax: 'Bỏ chặn quốc gia <MÃ> | Bỏ chặn ASN <AS####>', example: 'Bỏ chặn quốc gia CN',
    desc: 'Gỡ lệnh chặn quốc gia/ASN đã đặt ở Cloudflare',
    pattern: /^(?:bỏ chặn|bo chan|unblock)\s+(?:quốc gia|quoc gia|country)\s+[a-zA-Z]{2}$|^(?:bỏ chặn|bo chan|unblock)\s+asn\s+AS?\d{1,10}$/i,
  },
  {
    id: 'help', danger: false, group: 'Hệ thống',
    syntax: 'Trợ giúp', example: 'Trợ giúp',
    desc: 'Danh sách toàn bộ việc bot làm được',
    pattern: /^(?:trợ giúp|tro giup|help|\/help|lệnh|lenh)$/i,
  },
];

// Lệnh AI đề xuất phải khớp TRỌN VẸN một mẫu mới được chạy.
export function findCommand(text) {
  const value = String(text || '').trim();
  if (!value) return null;
  return COMMANDS.find((c) => c.pattern.test(value)) || null;
}

// Bảng năng lực cho prompt AI: đủ để nó viết đúng cú pháp, không kèm regex.
export function capabilityList() {
  return COMMANDS.map((c) => `- ${c.syntax}${c.danger ? ' [CẦN BOSS DUYỆT]' : ''} — ${c.desc}. Ví dụ: ${c.example}`).join('\n');
}

export function helpScreen() {
  const groups = new Map();
  for (const c of COMMANDS) {
    if (!groups.has(c.group)) groups.set(c.group, []);
    groups.get(c.group).push(c);
  }
  const body = [...groups.entries()].map(([group, list]) => (
    `<b>${group}</b>\n${list.map((c) => `• <code>${c.syntax}</code>${c.danger ? ' 🔒' : ''}\n   <i>${c.desc}</i>`).join('\n')}`
  )).join('\n\n');
  return `🤖 <b>QUẢN GIA HUGO LÀM ĐƯỢC GÌ</b>\n\n${body}\n\n🔒 <i>= việc có ghi dữ liệu, luôn hỏi Boss trước khi chạy.</i>\n\n💬 <i>Không nhớ cú pháp cũng không sao — cứ nói bằng tiếng thường ("khoá ví thằng an lại giúp anh"), em dịch ra lệnh rồi đưa nút để Boss duyệt.</i>`;
}

// ─── LỆNH AI ĐỀ XUẤT, CHỜ BOSS BẤM NÚT ───────────────────────────────────────
// callback_data của Telegram tối đa 64 BYTE — nhét nguyên câu "Gửi thông báo
// a@b.com nội dung ..." vào là Telegram từ chối CẢ TIN NHẮN, nút không bao giờ
// hiện và không có lỗi nào báo ra. Nên chỉ gửi đi một mã 8 ký tự; câu lệnh thật
// nằm dưới Mongo (TelegramState), sống qua mọi lần Render restart.
export const PENDING_TTL_MS = 10 * 60 * 1000;

export async function stashCommand(command, kind = 'pending', ttlMs = PENDING_TTL_MS) {
  const TelegramState = (await import('../models/TelegramState.js')).default;
  const id = crypto.randomBytes(4).toString('hex');
  await TelegramState.create({
    key: `${kind}:${id}`,
    kind,
    data: { command },
    expiresAt: new Date(Date.now() + ttlMs),
  });
  return id;
}

// Dùng MỘT LẦN: Telegram gửi lại callback khi mạng chập chờn, và Boss bấm hai
// cái liên tiếp là chuyện thường. `findOneAndDelete` là thao tác nguyên tử —
// hai lần bấm song song thì chỉ một lần lấy được câu lệnh, nên "Cộng 500 JOY"
// không bao giờ thành 1000.
export async function takeCommand(id, kind = 'pending') {
  const TelegramState = (await import('../models/TelegramState.js')).default;
  const doc = await TelegramState.findOneAndDelete({ key: `${kind}:${id}` }).lean();
  if (!doc) return null;
  if (new Date(doc.expiresAt).getTime() < Date.now()) return null;
  return doc.data?.command || null;
}

// ─── HOÀN TÁC ────────────────────────────────────────────────────────────────
// Quản gia dịch tiếng người sang lệnh, nên sẽ có lúc dịch sai ý Boss. Một nút
// hoàn tác đáng giá hơn mọi lớp hỏi lại: nghịch đảo của một lệnh trong danh mục
// CŨNG là một lệnh trong danh mục, nên chạy lại bằng đúng đường cũ, không đẻ ra
// đường thực thi thứ hai.
//
// Chỉ những việc đảo ngược được mới có nút. Gửi thông báo (người ta đọc rồi) và
// thu hồi phiên (không dựng lại được phiên đã huỷ) thì không — thà không có nút
// còn hơn có nút bấm vào không trả lại được gì.
export function inverseCommand(command, before = {}) {
  const value = String(command || '').trim();
  const m = (re) => value.match(re);

  // Định tuyến theo danh mục, KHÔNG đoán qua từ đầu: "Gửi thông báo…" và "Gửi
  // 500 joy…" đều mở đầu bằng "Gửi" nhưng nghịch đảo khác hẳn nhau (một cái
  // không đảo được). Nhầm hai cái là hoàn tác ra một lệnh vô nghĩa.
  const cmd = findCommand(value);
  if (!cmd) return null;

  if (cmd.id === 'joy') {
    const joy = m(/^(gửi|cộng|tặng|thưởng|trừ|chuyển)\s+(.*)$/i);
    return `${/^trừ$/i.test(joy[1]) ? 'Cộng' : 'Trừ'} ${joy[2]}`;
  }

  const wallet = m(/^(khóa ví|mở khóa ví|khoa vi|mo khoa vi)\s+(\S+)$/i);
  if (wallet) return `${/^(khóa ví|khoa vi)$/i.test(wallet[1]) ? 'Mở khóa ví' : 'Khóa ví'} ${wallet[2]}`;

  const acc = m(/^(khóa tài khoản|khoa tai khoan|mở tài khoản|mo tai khoan)\s+(\S+)$/i);
  if (acc) return `${/^(khóa tài khoản|khoa tai khoan)$/i.test(acc[1]) ? 'Mở tài khoản' : 'Khóa tài khoản'} ${acc[2]}`;

  const edu = m(/^(bật edu|bat edu|duyệt edu|duyet edu|xác minh edu|xac minh edu|tắt edu|tat edu)\s+(\S+)$/i);
  if (edu) return `${/tắt|tat/i.test(edu[1]) ? 'Bật edu' : 'Tắt edu'} ${edu[2]}`;

  // Tên và slug cũ phải chụp lại TRƯỚC khi đổi, nếu không thì không biết trả về đâu.
  const rename = m(/^(?:đổi tên|doi ten|change name)\s+(\S+@\S+)\s+/i);
  if (rename && before.displayName) return `Đổi tên ${rename[1]} thành ${before.displayName}`;

  const reslug = m(/^(?:đổi slug|doi slug|change slug)\s+(\S+@\S+)\s+/i);
  if (reslug && before.slug) return `Đổi slug ${reslug[1]} thành ${before.slug}`;

  if (/^(?:bật bảo trì|bat bao tri|enable maintenance)$/i.test(value)) return 'Tắt bảo trì';
  if (/^(?:tắt bảo trì|tat bao tri|disable maintenance)$/i.test(value)) return 'Bật bảo trì';

  return null;
}

// ─── LỆNH PHẢI GÕ TAY XÁC NHẬN ───────────────────────────────────────────────
// Một nút bấm nhầm không được phép đóng cửa cả hệ thống. OTP không giúp gì ở
// đây: kênh duy nhất là Telegram, gửi mã về đúng khung chat vừa bấm thì chỉ là
// thêm một nút nữa. Thứ thật sự chặn được lỗi TAY NHANH HƠN ĐẦU là bắt gõ lại
// một câu — máy không gõ hộ, và AI cũng không.
export const TYPED_CONFIRM = {
  maintenance: 'BAT BAO TRI',
};

export function typedConfirmFor(command) {
  const cmd = findCommand(command);
  if (!cmd) return null;
  if (cmd.id === 'maintenance' && /^(?:bật bảo trì|bat bao tri|enable maintenance)$/i.test(String(command).trim())) {
    return TYPED_CONFIRM.maintenance;
  }
  return null;
}
