// Quản gia AI: tự đi lấy dữ liệu nó cần, rồi đề xuất việc cần làm.
//
// Bản trước nhét SẴN mọi thứ model có thể cần vào prompt — 8 truy vấn Mongo cho
// mỗi tin nhắn, kể cả "chào em", mà vẫn thiếu đúng thứ Boss đang hỏi. Giờ nó
// hỏi cái gì thì lấy cái đó, tối đa 3 lượt.
//
// Ranh giới không đổi: mọi công cụ ở đây đều CHỈ ĐỌC. Việc có ghi vào dữ liệu
// đi qua đúng một cửa — `de_xuat_lenh` — và cửa đó chỉ dựng nút cho Boss bấm,
// không tự chạy. Xem docs/ai-workforce.md.
import Bio from '../models/Bio.js';
import SupportTicket from '../models/SupportTicket.js';
import { capabilityList } from './telegramCommands.js';

const MAX_ROUNDS = 3;

const compactBio = (b) => ({
  ten: b.displayName || 'chưa đặt tên',
  email: b.email,
  slug: b.slug || '',
  vi: Number(b.joyBalance || 0),
  donVi: b.joyDenom || 'JOY',
  viKhoa: Boolean(b.isJoyWalletFrozen),
  taiKhoan: b.status === 'suspended' ? 'đình chỉ' : 'hoạt động',
  edu: Boolean(b.isEduVerified),
});

const TOOL_IMPL = {
  async tim_thanh_vien({ tu_khoa = '' }) {
    const words = String(tu_khoa).split(/\s+/).filter((w) => w.length >= 2)
      .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    if (!words.length) return { loi: 'thiếu từ khoá' };
    const re = new RegExp(words.join('|'), 'i');
    const rows = await Bio.find({ $or: [{ email: re }, { displayName: re }, { slug: re }] }).limit(5).lean();
    return { soKetQua: rows.length, danhSach: rows.map(compactBio) };
  },

  async thong_ke_he_thong() {
    const [members, tickets, frozen, suspended] = await Promise.all([
      Bio.countDocuments(),
      SupportTicket.countDocuments({ status: 'pending' }),
      Bio.countDocuments({ isJoyWalletFrozen: true }),
      Bio.countDocuments({ status: 'suspended' }),
    ]);
    return { thanhVien: members, ticketCho: tickets, viDongBang: frozen, taiKhoanDinhChi: suspended, baoTri: Boolean(global.IS_SYSTEM_MAINTENANCE) };
  },

  async top_joy({ so_luong = 5 }) {
    const rows = await Bio.find().sort({ joyBalance: -1 }).limit(Math.min(10, Number(so_luong) || 5)).lean();
    return { danhSach: rows.map(compactBio) };
  },

  async thanh_vien_moi({ so_luong = 5 }) {
    const rows = await Bio.find().sort({ createdAt: -1 }).limit(Math.min(10, Number(so_luong) || 5)).lean();
    return { danhSach: rows.map(compactBio) };
  },

  async bao_cao_an_ninh({ so_gio = 24 }) {
    const { securityDigest } = await import('./securityEnforcement.js');
    return { bang: await securityDigest(Math.min(168, Number(so_gio) || 24)) };
  },

  async loi_may_chu({ so_dong = 5 }) {
    const { errorDigest } = await import('../utils/alert.js');
    return { bang: await errorDigest(Number(so_dong) || 5) };
  },
};

const TOOLS = [{
  functionDeclarations: [
    {
      name: 'tim_thanh_vien',
      description: 'Tìm thành viên theo tên, email hoặc slug. Dùng khi Boss nhắc tới một người cụ thể.',
      parameters: { type: 'OBJECT', properties: { tu_khoa: { type: 'STRING', description: 'Tên, email hoặc slug cần tìm' } }, required: ['tu_khoa'] },
    },
    {
      name: 'thong_ke_he_thong',
      description: 'Số liệu tổng: tổng thành viên, ticket chờ, ví đóng băng, tài khoản đình chỉ, trạng thái bảo trì.',
      parameters: { type: 'OBJECT', properties: {} },
    },
    {
      name: 'top_joy',
      description: 'Danh sách thành viên nhiều JOY nhất.',
      parameters: { type: 'OBJECT', properties: { so_luong: { type: 'NUMBER' } } },
    },
    {
      name: 'thanh_vien_moi',
      description: 'Thành viên đăng ký gần đây nhất.',
      parameters: { type: 'OBJECT', properties: { so_luong: { type: 'NUMBER' } } },
    },
    {
      name: 'bao_cao_an_ninh',
      description: 'Bản tổng kết an ninh: máy quét dạo, khoá tự động, ca chờ duyệt.',
      parameters: { type: 'OBJECT', properties: { so_gio: { type: 'NUMBER' } } },
    },
    {
      name: 'loi_may_chu',
      description: 'Các lỗi máy chủ gần nhất, gộp theo nội dung.',
      parameters: { type: 'OBJECT', properties: { so_dong: { type: 'NUMBER' } } },
    },
    {
      name: 'de_xuat_lenh',
      description: 'Đề xuất MỘT việc cần làm khi Boss muốn thực hiện, viết đúng cú pháp trong danh sách năng lực. Không tự chạy: hệ thống sẽ hiện nút cho Boss duyệt.',
      parameters: {
        type: 'OBJECT',
        properties: {
          lenh: { type: 'STRING', description: 'Câu lệnh đúng cú pháp, ví dụ: Khóa ví an@gmail.com' },
          giai_thich: { type: 'STRING', description: 'Một câu nói với Boss là sắp làm gì' },
        },
        required: ['lenh'],
      },
    },
  ],
}];

function systemPrompt() {
  return `Bạn là Quản Gia AI của Hugo Studio, xưng "em", gọi người dùng là "Boss", trả lời ngắn gọn và lịch sự.

Bạn có công cụ để TỰ TRA dữ liệu — đừng đoán, đừng bịa số. Cần số liệu thì gọi công cụ.

Khi Boss muốn LÀM một việc, gọi công cụ de_xuat_lenh với đúng một trong các cú pháp sau:
${capabilityList()}

QUY TẮC:
- Không bịa email. Thiếu email hoặc thiếu số tiền thì HỎI LẠI Boss, đừng đề xuất lệnh.
- Chỉ đề xuất khi Boss thật sự muốn làm ngay; hỏi han hay trò chuyện thì trả lời bình thường.
- Trả lời bằng HTML Telegram (<b>đậm</b>, <code>mã</code>), KHÔNG dùng Markdown.`;
}

/**
 * Trả về { reply, command } — `command` rỗng nghĩa là chỉ trò chuyện.
 * Không ném lỗi ra ngoài: quản gia im lặng còn tệ hơn quản gia trả lời cụt.
 */
export async function askButler({ text, history = [] }) {
  const { generateRaw } = await import('./aiGateway.js');
  const contents = [...history, { role: 'user', parts: [{ text }] }];

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const content = await generateRaw({
      systemInstruction: { parts: [{ text: systemPrompt() }] },
      contents,
      tools: TOOLS,
      generationConfig: { temperature: 0.6 },
      returnParts: true,
    });
    if (!content) return { reply: '', command: '' };

    const parts = content.parts || [];
    const calls = parts.filter((p) => p.functionCall).map((p) => p.functionCall);
    const said = parts.map((p) => p.text || '').join('').trim();

    const proposal = calls.find((c) => c.name === 'de_xuat_lenh');
    if (proposal) {
      return {
        reply: said || String(proposal.args?.giai_thich || 'Dạ thưa Boss, em chuẩn bị làm việc này ạ.'),
        command: String(proposal.args?.lenh || '').trim(),
      };
    }

    const reads = calls.filter((c) => TOOL_IMPL[c.name]);
    if (!reads.length) return { reply: said, command: '' };

    // Chạy công cụ rồi đưa kết quả lại cho model — nó tự quyết còn cần hỏi gì nữa.
    contents.push(content);
    for (const call of reads) {
      let result;
      try {
        result = await TOOL_IMPL[call.name](call.args || {});
      } catch (error) {
        result = { loi: error.message };
      }
      contents.push({ role: 'user', parts: [{ functionResponse: { name: call.name, response: { result } } }] });
    }
  }

  // Hết lượt mà vẫn đòi tra tiếp: dừng, đừng để một vòng lặp ăn hết hạn mức.
  return { reply: 'Dạ thưa Boss, em tra hơi lâu mà chưa ra kết luận. Boss hỏi cụ thể hơn giúp em ạ.', command: '' };
}
