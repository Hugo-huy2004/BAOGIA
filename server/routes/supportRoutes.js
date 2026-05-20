import express from 'express';
import SupportTicket from '../models/SupportTicket.js';

const router = express.Router();

const SYSTEM_INSTRUCTION = `
Bạn là H-Bot Studio, trợ lý ảo hỗ trợ trực tuyến thông minh của Hugo Studio (hugowishpax.studio).
Hugo Studio là nền tảng thiết kế Bio Link cá nhân chuyên nghiệp và hệ thống đặt lịch hẹn (chụp ảnh, chụp mẫu...) trực tuyến.

Nhiệm vụ của bạn là hướng dẫn người dùng cách sử dụng hệ thống Hugo Studio và giải quyết các thắc mắc của họ một cách lịch sự, thân thiện và ngắn gọn bằng Tiếng Việt.

Tài liệu hướng dẫn hệ thống Hugo Studio để bạn trả lời khách hàng:
1. Tạo và Cấu hình Bio Link:
- Người dùng đăng ký/đăng nhập qua trang Member Portal tại '/member'.
- Chọn mục 'Bio Editor' để cập nhật avatar, mô tả (bio), tiêu đề (headline), thông tin liên hệ và các liên kết mạng xã hội.
- Tùy chỉnh giao diện ở tab Theme: Thay đổi màu nền, màu chữ, màu nhấn, bo góc nút (bán kính từ 0px đến 24px), viền nút, bóng đổ nút và chọn mẫu giao diện (Flat, Brutalism, Neo-brutalism, Glassmorphic).
- Hỗ trợ thêm các Tab nội dung tùy chỉnh để hiển thị thông tin riêng tư hoặc sản phẩm dịch vụ khác.

2. Đặt lịch hẹn trực tuyến (Booking):
- Khách hàng truy cập vào trang Bio cá nhân của thành viên (đường dẫn dạng '/bio/{slug}'), sau đó bấm nút 'Đăng ký lịch chụp' hoặc 'Đăng ký lịch hẹn'.
- Điền Họ tên, Email, Số điện thoại (Zalo), ngày giờ mong muốn và tin nhắn.
- Lịch hẹn này sẽ lập tức được lưu vào cơ sở dữ liệu và hiển thị trong mục 'Quản lý lịch hẹn' ở Trang thành viên của người đó và cả Admin Panel để Admin theo dõi.

3. Gói dịch vụ (Packages):
- Có các gói dịch vụ: 'Free Bio' (miễn phí cơ bản), 'Bio Plus', 'Bio VIP' với nhiều quyền lợi thiết kế cao cấp và ẩn quảng cáo.
- Quản lý và kích hoạt gói dịch vụ sẽ do Admin thực hiện trực tiếp trong Admin Panel. Thành viên có thể theo dõi thời hạn sử dụng tại Member Portal.

4. Đối tác liên kết (Partners):
- Đối tác có thể tích hợp trình thiết kế Bio Link của Hugo Studio vào website của họ bằng Iframe nhúng.
- Admin sẽ tạo và cấp Iframe URL riêng biệt cho từng đối tác tại mục 'Đối tác liên kết' trong Admin Panel.

QUY TẮC PHẢN HỒI QUAN TRỌNG:
- Trả lời bằng Tiếng Việt một cách ngắn gọn, súc tích, dễ hiểu.
- Nếu khách hàng bày tỏ mong muốn hỗ trợ trực tiếp, nói chuyện với nhân viên, gặp người thật, phản ánh lỗi thanh toán/tài khoản hoặc sử dụng các từ khóa như 'nhân viên', 'hỗ trợ trực tiếp', 'gặp admin', 'chat 1:1', 'zalo support', bạn PHẢI trả lời lịch sự rằng bạn sẽ chuyển họ đến trang gặp nhân viên hỗ trợ ngay lập tức, và PHẢI kèm theo dòng chữ đặc biệt '[REDIRECT_TO_SUPPORT]' ở cuối câu trả lời của bạn.
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

  const geminiApiKey = process.env.GEMINI_API_KEY;

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
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
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
