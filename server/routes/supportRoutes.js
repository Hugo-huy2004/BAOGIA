import express from 'express';
import SupportTicket from '../models/SupportTicket.js';

const router = express.Router();

const SYSTEM_INSTRUCTION = `
Bạn là H-Bot Studio, trợ lý ảo AI thông minh và tận tâm của Hugo Studio (hugowishpax.studio).
Hugo Studio là một nền tảng tiên tiến kết hợp giữa xây dựng trang liên kết cá nhân (Bio Link) chuyên nghiệp (đặc biệt tối ưu cho người mẫu, nhiếp ảnh gia, nghệ sĩ, KOL) và hệ thống đặt lịch hẹn (Booking) trực tuyến.

Nhiệm vụ của bạn là giải đáp tất cả các thắc mắc về tính năng hệ thống, cách tùy chỉnh trang cá nhân, đăng ký gói dịch vụ và đặt lịch.

TÀI LIỆU CHI TIẾT HUẤN LUYỆN HỆ THỐNG HUGO STUDIO:

1. Trình Biên Tập Bio Link (Bio Editor):
- Địa chỉ: Đăng nhập vào trang cổng thành viên Member Portal tại '/member' -> Chọn tab "Bio Editor".
- Thông tin cá nhân cơ bản: Thành viên có thể cập nhật Ảnh đại diện (avatarUrl), Họ và tên hiển thị (displayName), Tiêu đề ngắn (headline), Tiêu đề công việc (jobTitle) và Email liên hệ (contactEmail), Điện thoại (phone), Địa chỉ (address), Học vấn (education).
- Hồ sơ thông số chi tiết (Đặc biệt dành cho người mẫu/KOL): Hỗ trợ cập nhật đầy đủ các thông tin chuyên nghiệp gồm: Ngày sinh (birthday), Sở thích (hobbies), Chiều cao (height), Cân nặng (weight), Số đo 3 vòng (measurements) và Kỹ năng đặc biệt (skills).
- Quản lý các liên kết mạng xã hội (links): Thành viên có thể thêm/bớt/sửa các đường link tùy ý dẫn đến Facebook, Instagram, TikTok, Youtube, Zalo, Telegram, v.v.
- Các Tab nội dung tùy chỉnh (tabs): Thành viên có thể thêm nhiều tab nội dung khác nhau để phân chia danh mục ảnh, thông tin hoặc dịch vụ một cách gọn gàng, tăng trải nghiệm người dùng.
- Tùy chỉnh Giao Diện & Theme:
  + Thay đổi màu sắc nền (bgColor), màu chữ (textColor) và màu nhấn chủ đạo (accentColor).
  + Định cấu hình bo góc nút liên kết (bán kính từ 0px đến 24px).
  + Tùy biến kiểu viền nút bấm và hiệu ứng bóng đổ nút để tăng tính độc bản.
  + Chọn giữa 4 phong cách giao diện thời thượng: Flat (Tối giản), Brutalism (Góc cạnh thô ráp), Neo-brutalism (Nổi bật, phá cách), Glassmorphism (Kính mờ trong suốt, hiện đại).

2. Đặt Lịch Hẹn Trực Tuyến (Booking System):
- Khách truy cập vào Bio Link công khai của thành viên (dạng '/bio/{slug}') -> nhấn nút "Đăng ký lịch chụp" hoặc "Đặt lịch hẹn".
- Biểu mẫu đặt lịch yêu cầu: Họ tên khách hàng, Email, Số điện thoại (Zalo), ngày giờ mong muốn và lời nhắn cụ thể.
- Quản lý: Lịch hẹn sau khi gửi sẽ tự động được đồng bộ và hiển thị tức thì trong mục "Quản Lý Lịch Hẹn" tại Cổng thành viên của người đó để họ liên hệ trực tiếp qua Zalo/Email. Admin cũng có thể theo dõi danh sách đặt lịch của toàn bộ hệ thống qua Admin Panel.

3. Gói Dịch Vụ & Thời Hạn Sử Dụng (Packages):
- Các mẫu gói dịch vụ do Admin cấu hình sẵn gồm: tên gói, thời hạn sử dụng (ngày, tháng hoặc năm) và các quyền lợi đi kèm.
- Gia hạn/Nâng cấp: Khi Admin chỉ định gói dịch vụ cho một thành viên trong Admin Panel, thời hạn hết hạn (expiresAt) của thành viên đó sẽ tự động được cộng thêm (ví dụ gia hạn thêm 6 tháng hoặc 1 năm). Ngược lại, nếu Admin xóa gói, thời hạn sử dụng sẽ giảm tương đương.
- Thành viên xem thông tin gói hiện tại và thời gian hết hạn trực tiếp tại Cổng thành viên. Nếu tài khoản hết hạn, trang Bio công khai của họ sẽ tạm ngưng hiển thị cho đến khi được gia hạn.

4. Dịch Vụ Đối Tác (Partners Integration):
- Cho phép đối tác nhúng trực tiếp trình biên tập Bio Link vào website riêng của đối tác bằng cách sử dụng Iframe URL.
- Admin sẽ tạo, cấp khóa và lấy đường dẫn URL nhúng Iframe cho từng đối tác tại mục "Đối tác liên kết" trên Admin Panel.

QUY TẮC PHẢN HỒI QUAN TRỌNG:
- Trả lời bằng Tiếng Việt thân thiện, rõ ràng, ngắn gọn và tập trung đúng câu hỏi.
- KHÔNG tự bịa ra các đường dẫn URL khác ngoài các đường dẫn được liệt kê ở đây.
- NGUYÊN TẮC GẶP NHÂN VIÊN HỖ TRỢ: Nếu khách hàng hỏi về các vấn đề giao dịch chuyển khoản, lỗi kích hoạt gói, khóa tài khoản hoặc có nhu cầu gặp người thật, nhân viên kỹ thuật, admin, hoặc dùng các từ khóa như 'nhân viên', 'gặp admin', 'hỗ trợ trực tiếp', 'zalo support', 'chat 1:1', 'zalo chat', bạn cần trả lời lịch sự rằng bạn sẽ chuyển họ đến trang gửi yêu cầu liên hệ trực tiếp ngay, và BẮT BUỘC chèn thêm dòng mã: [REDIRECT_TO_SUPPORT] vào cuối câu trả lời. Dòng mã này không được dịch hay chỉnh sửa vì hệ thống cần nó để tự động chuyển trang.
`;

const LOCAL_FAQ = [
  {
    keywords: ['tạo bio', 'tao bio', 'chỉnh sửa bio', 'chinh sua bio', 'bio link', 'edit bio', 'giao diện', 'giao dien', 'theme'],
    answer: "Để tạo và thiết kế Bio Link, bạn hãy đăng nhập vào Trang Thành Viên (Member Portal) -> chọn 'Bio Editor'. Bạn có thể thay đổi avatar, thêm liên kết mạng xã hội, tạo tab tùy chỉnh và phối màu nền/nút/chữ ở tab 'Giao diện' (Theme) với các mẫu Flat, Brutalism, Neo-brutalism, Glassmorphic."
  },
  {
    keywords: ['đặt lịch', 'dat lich', 'lịch hẹn', 'lich hen', 'chụp ảnh', 'chup anh', 'booking'],
    answer: "Hugo Studio hỗ trợ đặt lịch hẹn trực tuyến. Khách hàng chỉ cần vào trang Bio công khai của bạn ('/bio/your-slug'), nhấn 'Đăng ký lịch hẹn' và điền thông tin. Lịch hẹn này sẽ hiển thị ngay trong mục 'Quản lý lịch hẹn' tại Trang Thành Viên của bạn."
  },
  {
    keywords: ['gói dịch vụ', 'package', 'plus', 'vip', 'nâng cấp', 'nang cap', 'gia hạn', 'thanh toan', 'nâng gói'],
    answer: "Hugo Studio có các gói Free Bio, Bio Plus và Bio VIP. Các gói Plus/VIP mở khóa giao diện độc quyền và không hiển thị quảng cáo. Việc kích hoạt/nâng cấp gói sẽ do Admin thực hiện trong Admin Panel. Bạn có thể gửi yêu cầu hỗ trợ trực tiếp để Admin xử lý."
  },
  {
    keywords: ['đối tác', 'doi tac', 'iframe', 'nhúng', 'nhung', 'partner'],
    answer: "Đối tác liên kết có thể nhúng trình chỉnh sửa Bio Link của Hugo Studio vào website cá nhân thông qua Iframe URL. Vui lòng liên hệ Admin tại Admin Panel để được cấp URL tích hợp."
  },
  {
    keywords: ['nhân viên', 'gặp nhân viên', 'trực tiếp', 'ho tro truc tiep', 'gặp người', 'zalo', 'liên hệ', 'lien he', 'chat 1:1', 'support', 'human', 'admin'],
    answer: "Tôi hiểu bạn muốn gặp nhân viên để hỗ trợ trực tiếp 1:1. Tôi đang chuyển bạn sang trang gửi yêu cầu hỗ trợ với nhân viên ngay bây giờ! [REDIRECT_TO_SUPPORT]"
  }
];

// POST: Chat with H-Bot AI Support
router.post('/chat', async (req, res) => {
  const { message, history = [] } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const useLocalAi = process.env.USE_LOCAL_AI === 'true';
  const localAiUrl = process.env.LOCAL_AI_URL || 'http://localhost:11434/api/chat';
  const localAiModel = process.env.LOCAL_AI_MODEL || 'qwen2.5:3b';
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (useLocalAi) {
    try {
      // Build OpenAI/Ollama compatible messages format
      const messages = history.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      }));
      
      // Prepend system instruction
      messages.unshift({
        role: 'system',
        content: SYSTEM_INSTRUCTION
      });

      // Append current message
      messages.push({
        role: 'user',
        content: message
      });

      const response = await fetch(localAiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: localAiModel,
          messages,
          stream: false
        })
      });

      if (response.ok) {
        const data = await response.json();
        const botText = data.message?.content || '';
        return res.json({ reply: botText.trim() });
      } else {
        throw new Error(`Local AI (Ollama) returned status ${response.status}`);
      }
    } catch (err) {
      console.error('Error calling Local AI (Ollama), trying Gemini or FAQ:', err);
    }
  }

  if (geminiApiKey) {
    try {
      // Build request contents format for Gemini API
      // Map frontend message history format to Gemini role: "user" | "model"
      const contents = history.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));

      // Append current message
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents,
            systemInstruction: {
              parts: [{ text: SYSTEM_INSTRUCTION }]
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API returned status ${response.status}`);
      }

      const data = await response.json();
      const botText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      return res.json({ reply: botText.trim() });
    } catch (err) {
      console.error('Error calling Gemini API, falling back to local FAQ engine:', err);
      // Fallback below
    }
  }

  // Local rule-based FAQ Engine Fallback
  const lowerMsg = message.toLowerCase();
  let matchedAnswer = '';

  for (const faq of LOCAL_FAQ) {
    const hasKeyword = faq.keywords.some(keyword => lowerMsg.includes(keyword));
    if (hasKeyword) {
      matchedAnswer = faq.answer;
      break;
    }
  }

  if (!matchedAnswer) {
    matchedAnswer = "Chào bạn! Tôi là H-Bot Studio, trợ lý hỗ trợ trực tuyến của Hugo Studio. Bạn có thể hỏi tôi về cách tạo Bio Link, xem gói dịch vụ hoặc cài đặt lịch hẹn. Nếu bạn gặp vấn đề cần xử lý riêng hoặc muốn gặp nhân viên hỗ trợ trực tiếp 1:1, hãy nói 'tôi muốn gặp nhân viên hỗ trợ' nhé!";
  }

  return res.json({ reply: matchedAnswer });
});

// POST: Create a support ticket
router.post('/tickets', async (req, res) => {
  try {
    const { fullName, email, phone, issue } = req.body;
    if (!fullName || !email || !phone || !issue) {
      return res.status(400).json({ error: 'All fields (fullName, email, phone, issue) are required' });
    }

    const ticket = await SupportTicket.create({
      fullName,
      email,
      phone,
      issue,
      status: 'pending'
    });

    res.status(201).json(ticket);
  } catch (err) {
    console.error('Error creating support ticket:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET: Fetch all support tickets (Admin Only - in real system would check auth)
router.get('/tickets', async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = {};
    if (status) {
      query.status = status;
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [tickets, totalCount, pendingCount] = await Promise.all([
      SupportTicket.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      SupportTicket.countDocuments(query),
      SupportTicket.countDocuments({ status: 'pending' })
    ]);

    res.json({
      tickets,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(totalCount / limitNum)
      },
      pendingCount
    });
  } catch (err) {
    console.error('Error fetching support tickets:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH: Resolve a support ticket
router.patch('/tickets/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await SupportTicket.findByIdAndUpdate(
      id,
      { status: 'resolved' },
      { new: true }
    );

    if (!ticket) {
      return res.status(404).json({ error: 'Support ticket not found' });
    }

    res.json(ticket);
  } catch (err) {
    console.error('Error resolving support ticket:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
