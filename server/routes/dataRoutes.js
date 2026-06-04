import express from 'express';
import Data from '../models/Data.js';
import { requireAdmin } from '../middleware/authMiddleware.js';
import { fetchWithCache, clearCache } from '../utils/cacheHelper.js';

const router = express.Router();

// Default initial data
const initialData = {
  userId: 'default',
  profile: {
    fullName: "Peter Hugo Wishpax Lê",
    shortName: "Hugo",
    title: "Peter Hugo Wishpax Lê • Bio & Premium Services ✨",
    introBadge: "Hello! Chào mừng tới vũ trụ của Hugo!",
    headline: "Xin chào! Tôi là Peter Hugo Wishpax Lê",
    subtitle: "Kiến tạo thế giới số bằng những dòng code kẹo ngọt, thiết kế Claymorphism tinh tế kết hợp hiệu năng vượt trội.",
    country: "Việt Nam 🇻🇳",
    birthday: "2004",
    education: "Software Engineering • Greenwich VN 🎓",
    storyTitle: "Kiến tạo trải nghiệm bằng cả trái tim",
    storyContent: "Tôi theo đuổi triết lý lập trình kết hợp nghệ thuật: mỗi giao diện đều phải có linh hồn, mang lại sự ngạc nhiên, ngọt ngào cho người sử dụng từ cái nhìn đầu tiên, nhưng đồng thời bên dưới phải là hệ thống mã nguồn cực kỳ gọn gàng, hiệu năng vượt trội và chuẩn SEO tối đa.",
    avatarUrl: "https://res.cloudinary.com/dyehwoscu/image/upload/e_bgremoval,f_auto,q_auto,w_300/v1779116182/A%CC%89nh_ma%CC%80n_hi%CC%80nh_2026-05-18_lu%CC%81c_21.56.14_imhujt.png",
    meetingQrUrl: "https://img.vietqr.io/image/MB-827052004-compact.png?amount=0&addInfo=Hugo%20Dat%20Lich%20Hen%20Thiet%20Ke&accountName=LE%20GIA%20HUY",
    bankName: "MBBank",
    accountNumber: "827052004",
    accountHolder: "LE GIA HUY",
    zaloNumber: "0839909399",
    emailAddress: "hugowishpax@gmail.com"
  },
  hobbies: [
    {
      id: "hobby1",
      icon: "potted_plant",
      title: "Trồng Dương Xỉ",
      desc: "Đam mê trồng các loại cây dương xỉ xanh mướt, mang lại cảm giác bình yên và dịu dàng."
    },
    {
      id: "hobby2",
      icon: "favorite",
      title: "Thích Cute & 3D",
      desc: "Thích những trải nghiệm số mang phong cách kẹo ngọt Claymorphism bóng bẩy đầy bất ngờ."
    }
  ],
  gallery: [
    {
      id: "photo1",
      url: "https://res.cloudinary.com/dyehwoscu/image/upload/f_auto,q_auto,w_800/v1779117104/A%CC%89nh_ma%CC%80n_hi%CC%80nh_2026-05-18_lu%CC%81c_22.11.38_vlij7l.png",
      title: "Peter Hugo Wishpax Lê",
      category: "Chân dung cá nhân",
      desc: "Hình ảnh đại diện mang đậm phong thái lập trình viên & nhà thiết kế sáng tạo."
    },
    {
      id: "photo2",
      url: "https://res.cloudinary.com/dyehwoscu/image/upload/f_auto,q_auto,w_800/v1779117069/A%CC%89nh_ma%CC%80n_hi%CC%80nh_2026-05-18_lu%CC%81c_22.10.59_cqxjne.png",
      title: "Phụng Sự Cộng Đồng Xã Hội",
      category: "Hành trình tình nguyện",
      desc: "Tích cực tham gia các dự án thiện nguyện, trao đi yêu thương và san sẻ khó khăn."
    }
  ],
  dongThap: {
    badge: "Quê Hương",
    emoji: "🌸",
    title: "Đất Sen Hồng Đồng Tháp Mười",
    intro: "Đồng Tháp là vùng đất sông nước hiền hòa bên dòng sông Tiền, nổi tiếng với sắc sen hồng rực rỡ bát ngát, di tích Xẻo Quýt hào hùng, Vườn quốc gia Tràm Chim cùng những con người miền Tây đôn hậu, mến khách.",
    content: `Chào bạn nha! Nếu bạn yêu thích cái yên bình của sông nước Cửu Long, muốn ngửi thấy hương sen thơm nức mũi trong nắng sớm, thì Đồng Tháp chính là thiên đường thu nhỏ đó! 🌾🌸`,
    photos: [
      {
        id: "dtp1",
        url: "https://res.cloudinary.com/dyehwoscu/image/upload/f_auto,q_auto,w_800/v1779117377/c9da96fe_dcrslx.jpg",
        caption: "Bình minh rực rỡ giữa đầm sen Đồng Tháp"
      }
    ]
  },
  catholicism: {
    badge: "Đức Tin Công Giáo",
    emoji: "⛪",
    title: "Sứ Vụ Huynh Trưởng TNTT",
    intro: "Đời sống tâm linh và hành trình tông đồ đầy ý nghĩa dưới vai trò là Huynh Trưởng Thiếu Nhi Thánh Thể.",
    mainImageUrl: "https://res.cloudinary.com/dyehwoscu/image/upload/f_auto,q_auto,w_800/v1779117963/erjri4f8ncia1zxxbu5t.jpg",
    content: `Chào bạn nha! Ở trang chính Bio Portal, bạn chắc chắn đã thấy Hugo giới thiệu đức tin của mình là Công Giáo Roma.`,
    hierarchyImageUrl: "https://res.cloudinary.com/dyehwoscu/image/upload/f_auto,q_auto,w_800/v1779117987/83928340_49676971467264_n_wtseuq.jpg",
    popeImageUrl: "https://res.cloudinary.com/dyehwoscu/image/upload/f_auto,q_auto,w_500/v1779118047/c8a3665e3390d3b1_fhwcox.jpg",
    popeName: "Đức Giáo Hoàng Phanxicô (Pope Francis)",
    popeDesc: "Vị cha chung thứ 266 của Giáo Hội Công Giáo toàn cầu.",
    hugoServicePhotos: [],
    faq: []
  },
  pricing: {
    tiers: {
      portfolio: 800000,
      single_page: 800000,
      basic: 3000000,
      plus: 6500000,
      premium: 14000000
    },
    addons: {
      cms: 1200000,
      biometric: 800000,
      sound: 450000,
      seo: 650000,
      anims: 500000,
      copyright: 350000
    }
  },
  partnerIframe: "",
  advertisement: {
    imageUrl: "",
    linkUrl: "",
    isActive: false
  },
  systemSettings: {
    maintenanceMode: false,
    enableHBot: true,
    vacationMode: false,
    globalSeo: {
      title: "Hugo Studio - Professional Bio & Booking Platform",
      description: "Nền tảng quản lý bio, booking và portfolio chuyên nghiệp cho influencer, freelancer và entrepreneur.",
      keywords: "Hugo Studio, Tạo bio, Bio page, Booking platform"
    }
  }
};

// GET: Fetch all data
router.get('/', async (req, res) => {
  try {
    // Thuật toán Queue / LRU: Check Cache với Single-flight & SWR O(1)
    const sanitizedData = await fetchWithCache("public_data", 60000, async () => {
      let data = await Data.findOne({ userId: 'default' });
      
      // If no data exists, create with initial data
      if (!data) {
        data = await Data.create(initialData);
      }
      
      // Create sanitized version for public viewing
      const sanitized = data.toObject();
      if (sanitized.profile) {
        delete sanitized.profile.accountNumber;
        delete sanitized.profile.bankName;
        delete sanitized.profile.accountHolder;
      }
      return sanitized;
    });

    res.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    res.json(sanitizedData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET: Fetch all data for ADMIN ONLY
router.get('/admin', requireAdmin, async (req, res) => {
  try {
    let data = await Data.findOne({ userId: 'default' });
    if (!data) {
      data = await Data.create(initialData);
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT: Update entire data
router.put('/', requireAdmin, async (req, res) => {
  try {
    let data = await Data.findOneAndUpdate(
      { userId: 'default' },
      req.body,
      { new: true, upsert: true }
    );
    
    // Xóa Cache ngay lập tức khi Admin cập nhật dữ liệu
    clearCache("public_data");
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH: Update specific field
router.patch('/', requireAdmin, async (req, res) => {
  try {
    const { field, value } = req.body;
    const updateData = { [field]: value };
    
    let data = await Data.findOneAndUpdate(
      { userId: 'default' },
      updateData,
      { new: true }
    );
    
    // Xóa Cache ngay lập tức khi Admin cập nhật dữ liệu
    clearCache("public_data");

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

import cloudinaryUtil from '../utils/cloudinary.js';

// POST: Upload Ad Image
router.post('/upload-ad', async (req, res) => {
  try {
    const { base64Str, oldUrl } = req.body;
    if (!base64Str) return res.status(400).json({ error: "Missing image data" });
    
    const secureUrl = await cloudinaryUtil.uploadAdImage(base64Str, oldUrl);
    res.json({ url: secureUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE: Delete Ad Image
router.delete('/delete-ad', async (req, res) => {
  try {
    const { url } = req.body;
    if (url) {
      await cloudinaryUtil.deleteAvatar(url);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Reset to default data
router.post('/reset', requireAdmin, async (req, res) => {
  try {
    await Data.deleteOne({ userId: 'default' });
    const data = await Data.create(initialData);
    res.json({ message: 'Data reset to defaults', data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rule-based local fallback for psychology chat
const fallbackPsychologyReply = (message, history = []) => {
  const cleanMsg = message.toLowerCase().trim();
  const lastBotMsg = history.length > 0 ? [...history].reverse().find(h => h.sender === 'bot')?.text || '' : '';
  const lastBotMsgLower = lastBotMsg.toLowerCase();
  
  // Calculate depth
  const userMsgs = history.filter(h => h.sender === 'user');
  const depth = userMsgs.length;

  // Detect aspect
  const aspects = {
    studying: ["học", "thi", "deadline", "đồ án", "môn học", "trường", "lớp", "giảng đường", "bài tập", "kiểm tra", "trượt"],
    work: ["làm thêm", "công việc", "sếp", "đồng nghiệp", "parttime", "kiếm tiền", "đồng lương", "đi làm"],
    family: ["bố", "mẹ", "gia đình", "nhà", "phụ huynh", "cha mẹ", "anh chị", "em"],
    relationships: ["người yêu", "bạn bè", "crush", "chia tay", "cãi nhau", "giận", "đơn phương", "người ấy"],
    self: ["bản thân", "mệt", "kiệt sức", "khóc", "stress", "căng thẳng", "buồn", "nản", "chán", "mất ngủ", "sức khỏe", "cô đơn", "trống trải", "bất lực", "sụp đổ"]
  };
  const textToAnalyze = (message + " " + history.map(h => h.text || "").join(" ")).toLowerCase();
  let aspect = null;
  let maxMatches = 0;
  for (const [asp, keywords] of Object.entries(aspects)) {
    let count = 0;
    keywords.forEach(keyword => {
      if (textToAnalyze.includes(keyword)) count++;
    });
    if (count > maxMatches) {
      maxMatches = count;
      aspect = asp;
    }
  }

  // Greetings
  const greetings = ["chào", "hello", "hi", "bạn ơi", "trợ lý", "xin chào"];
  if (greetings.some(g => cleanMsg.startsWith(g)) && depth <= 1) {
    return "Chào cậu thương mến! Tớ luôn ở đây để lắng nghe và san sẻ lo toan cùng cậu. Dạo gần đây cuộc sống hoặc học tập của cậu có điều gì làm cậu mệt mỏi hay bận lòng không? Kể tớ nghe nhé.";
  }

  const isAgreement = ["đúng", "ừ", "ừm", "um", "uh", "uhm", "vâng", "dạ", "chuẩn", "đúng vậy", "chính xác", "mệt chứ", "đúng rồi", "rồi", "có", "ok", "oke"].some(w => cleanMsg === w || cleanMsg.startsWith(w + " "));
  const isNegation = ["không", "chưa", "ko", "k", "chẳng", "đâu có", "không có", "đâu"].some(w => cleanMsg === w || cleanMsg.startsWith(w + " "));

  if (cleanMsg.length < 8) {
    if (isAgreement) {
      if (lastBotMsgLower.includes("quá tải lắm đúng không") || lastBotMsgLower.includes("gặp khó khăn với kỳ thi")) {
        return "Ừm... Việc học hành thi cử áp lực dồn dập mệt mỏi thật cậu nhỉ. Cứ trút lòng ra nhé, chuyện bài vở dạo này cụ thể thế nào?";
      }
      if (lastBotMsgLower.includes("vừa đi học vừa làm thêm")) {
        return "Tớ biết mà, vừa học vừa đi làm thêm cực kỳ mệt mỏi và dễ quá tải. Công việc của cậu cụ thể là gì, kể tớ nghe xem có khó khăn gì dạo gần đây không?";
      }
      if (lastBotMsgLower.includes("áp lực từ gia đình lúc nào cũng khiến")) {
        return "Tớ hiểu cảm giác đó, bất hòa với gia đình khó chịu và cô đơn lắm. Bố mẹ không chịu lắng nghe làm cậu buồn lòng nhiều đúng không?";
      }
      if (lastBotMsgLower.includes("xung đột trong tình cảm hoặc bạn bè")) {
        return "Ừm, những giận hờn hay tổn thương từ mối quan hệ luôn khiến mình suy sụp ghê gớm. Cậu và người ấy đang có chuyện gì xảy ra vậy?";
      }
      if (lastBotMsgLower.includes("nỗi buồn và sự kiệt sức rất lớn")) {
        return "Tớ nghe đây... Cậu cứ từ từ chia sẻ nhé, có chuyện gì đã và đang đè nặng lên suy nghĩ của cậu nhất vậy?";
      }
      if (lastBotMsgLower.includes("ảnh hưởng nhiều đến giấc ngủ hay sinh hoạt")) {
        return "Thương cậu quá. Mất ngủ hay đảo lộn sinh hoạt sẽ càng làm tinh thần cậu mệt mỏi hơn đấy. Tình trạng này kéo dài lâu chưa cậu?";
      }
      if (lastBotMsgLower.includes("sức khỏe thể chất của mình dạo này bị đi xuống")) {
        return "Quá tải cả thể chất lẫn tinh thần thực sự nguy hiểm lắm cậu ơi. Cậu có thể sắp xếp giảm bớt việc hay dành một chút thời gian nghỉ ngơi không?";
      }
      if (lastBotMsgLower.includes("thử nói ra nỗi lòng này với gia đình chưa")) {
        return "Cậu đã từng nói ra rồi nhưng bố mẹ vẫn không hiểu đúng không... Cảm giác cố gắng kết nối nhưng chỉ nhận lại sự phớt lờ thực sự rất cô đơn và bất lực.";
      }
      if (lastBotMsgLower.includes("chỗ dựa hay đang phải chịu đựng")) {
        return "Có người bên cạnh làm điểm tựa là tốt rồi cậu ạ. Họ có giúp cậu vơi đi phần nào áp lực này không, hay cậu vẫn thấy nặng trĩu lòng?";
      }
      if (lastBotMsgLower.includes("bị mất ngủ hay cảm thấy bứt rứt")) {
        return "Tình trạng mất ngủ và bứt rứt kéo dài thực sự rất kiệt sức. Cậu có muốn thử một bài tập hít thở sâu 4-7-8 cùng tớ để điều hòa lại nhịp tim và thư giãn đầu óc một chút không?";
      }
      if (lastBotMsgLower.includes("thiết lập một lộ trình đồng hành")) {
        return "Tuyệt vời quá! Hãy cùng tớ thiết lập hành trình chăm sóc tinh thần bằng cách kích hoạt chế độ đồng hành nhé. Tớ sẽ luôn ở đây nhắc nhở và lắng nghe cậu.";
      }
      if (aspect === "studying") return "Ừm... Chuyện bài vở, học hành dạo này cụ thể thế nào làm cậu lo lắng vậy? Kể tớ nghe sâu hơn nhé.";
      if (aspect === "family") return "Tớ hiểu, mâu thuẫn hay áp lực gia đình rất khó đối mặt. Ở nhà có chuyện gì cụ thể xảy ra vậy cậu?";
      if (aspect === "relationships") return "Ừm, những tổn thương từ bạn bè hay tình cảm rất nhức nhối. Cậu đang vướng mắc chuyện gì với người đó vậy?";
      return "Tớ nghe đây... Cậu có muốn kể rõ hơn chuyện gì đã làm cậu thấy buồn lòng không?";
    }

    if (isNegation) {
      if (lastBotMsgLower.includes("quá tải lắm đúng không") || lastBotMsgLower.includes("gặp khó khăn với kỳ thi")) {
        return "Ồ, hóa ra không phải do áp lực thi cử hay học tập à? Vậy dạo gần đây có chuyện gì khác về gia đình, bạn bè hay bản thân làm cậu phiền lòng không? Kể tớ nghe nhé.";
      }
      if (lastBotMsgLower.includes("vừa đi học vừa làm thêm")) {
        return "Thế thì tốt quá, công việc làm thêm của cậu vẫn suôn sẻ đúng không. Vậy có điều gì khác trong cuộc sống đang làm cậu bận lòng vậy?";
      }
      if (lastBotMsgLower.includes("áp lực từ gia đình lúc nào cũng khiến")) {
        return "Ồ, vậy gia đình không phải là lý do khiến cậu buồn lòng lúc này. Thế còn chuyện học hành, công việc hay các mối quan hệ bạn bè thì sao cậu?";
      }
      if (lastBotMsgLower.includes("xung đột trong tình cảm hoặc bạn bè")) {
        return "À, vậy tình cảm và bạn bè của cậu vẫn tốt đẹp đúng không. Thế điều gì khác đang làm tâm trạng cậu bị trầm xuống vậy cậu?";
      }
      if (lastBotMsgLower.includes("ảnh hưởng nhiều đến giấc ngủ hay sinh hoạt")) {
        return "Giấc ngủ và sinh hoạt hàng ngày vẫn ổn định là một tín hiệu rất đáng mừng rồi cậu ạ. Vậy cụ thể chuyện học hành dạo này đang gặp khó khăn gì nhất khiến cậu mệt mỏi?";
      }
      if (lastBotMsgLower.includes("sức khỏe thể chất của mình dạo này bị đi xuống")) {
        return "Sức khỏe thể chất vẫn ổn định là mừng rồi cậu ạ. Thế còn tinh thần dạo này của cậu có cảm thấy quá tải vì lịch trình bận rộn không?";
      }
      if (lastBotMsgLower.includes("thử nói ra nỗi lòng này với gia đình chưa")) {
        return "Chưa từng nói ra đúng không cậu... Tớ biết đối thoại với bố mẹ nhiều khi khó khăn cực kỳ vì khoảng cách thế hệ. Cậu có người bạn thân nào khác để chia sẻ bớt không?";
      }
      if (lastBotMsgLower.includes("chỗ dựa hay đang phải chịu đựng")) {
        return "Phải chịu đựng một mình sao... Nghe thôi tớ đã thấy thương cậu rồi. Từ bây giờ cậu không còn cô đơn nữa đâu, tớ luôn ở đây sẵn sàng đồng hành cùng cậu.";
      }
      if (lastBotMsgLower.includes("bị mất ngủ hay cảm thấy bứt rứt")) {
        return "Cơ thể vẫn ổn định không có dấu hiệu mất ngủ hay bứt rứt là rất tốt rồi cậu ơi. Vậy điều gì trong suy nghĩ đang làm cậu lấn cấn nhiều nhất thế?";
      }
      if (lastBotMsgLower.includes("thường làm gì để giải tỏa lòng mình")) {
        return "Không làm gì hoặc chỉ im lặng chịu đựng thôi đúng không cậu... Giữ mọi cảm xúc tiêu cực trong lòng ngột ngạt lắm á. Cậu có muốn thử một bài tập hít thở sâu để giải tỏa bớt không?";
      }
      if (lastBotMsgLower.includes("thiết lập một lộ trình đồng hành")) {
        return "Tớ hiểu rồi. Cậu cứ thong thả suy nghĩ nhé. Khi nào cần, tớ luôn sẵn sàng đồng hành và lắng nghe cậu.";
      }
      return "Tớ hiểu rồi. Nếu cậu chưa sẵn sàng nói sâu hơn thì không sao cả nhé. Tụi mình cứ nói chuyện nhẹ nhàng thôi, hoặc cậu muốn tớ im lặng để cậu tĩnh tâm chút không?";
    }

    const shortReplies = [
      "Tớ vẫn đang ở đây lắng nghe cậu mà. Cậu cứ thong thả chia sẻ nhé.",
      "Ừm, tớ nghe đây. Có chuyện gì làm cậu buồn lòng nhất lúc này không cậu?",
      "Tớ hiểu. Cậu cứ tự nhiên nói nhé, ở đây hoàn toàn bảo mật và không phán xét đâu."
    ];
    return shortReplies[history.length % shortReplies.length];
  }

  // Contextual check for longer inputs
  if (lastBotMsg) {
    if (lastBotMsgLower.includes("ảnh hưởng nhiều đến giấc ngủ hay sinh hoạt")) {
      if (isAgreement || cleanMsg.includes("mất ngủ") || cleanMsg.includes("mệt")) {
        return "Thương cậu quá... Khi tinh thần bất ổn, cơ thể và giấc ngủ luôn phải chịu trận đầu tiên. Cậu có muốn tụi mình nói chuyện thêm một lúc nữa để lòng nhẹ bớt rồi đi nghỉ ngơi sớm không?";
      }
      if (isNegation) {
        return "Cơ thể vẫn ổn định là một tín hiệu rất đáng mừng rồi cậu ạ. Vậy điều gì trong lòng đang làm cậu thấy lấn cấn và suy nghĩ nhiều nhất thế?";
      }
    }
    if (lastBotMsgLower.includes("thử nói ra nỗi lòng này với gia đình chưa")) {
      if (isAgreement || cleanMsg.includes("rồi") || cleanMsg.includes("đã từng")) {
        return "Cậu đã từng thử nói ra rồi nhưng bố mẹ vẫn không hiểu hay lắng nghe đúng không... Cảm giác cố gắng kết nối nhưng chỉ nhận lại sự phớt lờ thực sự rất cô đơn và bất lực. Cậu có ai khác để làm chỗ dựa không?";
      }
      if (isNegation || cleanMsg.includes("chưa")) {
        return "Chưa từng nói ra đúng không cậu... Tớ biết đối thoại với bố mẹ nhiều khi khó khăn cực kỳ vì khoảng cách thế hệ. Cậu có người bạn thân nào khác để chia sẻ bớt không?";
      }
    }
  }

  // Core dialog flow based on depth
  if (depth <= 1) {
    switch (aspect) {
      case "studying":
        return "Tớ nghe đây cậu ơi. Chuyện học tập, bài vở dạo này đang làm cậu thấy quá tải lắm đúng không? Cậu đang gặp khó khăn với kỳ thi hay deadline nào à, kể tớ nghe nhé.";
      case "work":
        return "Vừa đi học vừa làm thêm thực sự vất vả ghê á. Công việc dạo này bận rộn hay có chuyện gì xảy ra khiến cậu mệt mỏi vậy cậu?";
      case "family":
        return "Bất đồng hay áp lực từ gia đình lúc nào cũng khiến mình tổn thương sâu sắc nhất. Ở nhà đang có chuyện gì làm cậu buồn lòng thế?";
      case "relationships":
        return "Xung đột trong tình cảm hoặc bạn bè làm lòng mình nhói đau ghê gớm. Cậu và bạn bè hay người yêu đang có chuyện không vui à?";
      case "self":
        return "Nghe cậu nói vậy, tớ cảm nhận được một nỗi buồn và sự kiệt sức rất lớn ở cậu. Cậu có muốn kể cho tớ nghe điều gì đang diễn ra không? Cứ thong thả nhé.";
      default:
        return "Tớ luôn sẵn sàng lắng nghe đây. Dạo gần đây cậu đang gặp chuyện gì làm cậu bận lòng nhất? Hãy cứ chia sẻ tự nhiên nhé.";
    }
  }

  if (depth === 2) {
    switch (aspect) {
      case "studying":
        return "Hóa ra là vậy... Đi học mà phải gánh những áp lực bài vở dồn dập như thế thực sự kiệt sức. Áp lực học hành này có ảnh hưởng nhiều đến giấc ngủ hay sinh hoạt hàng ngày của cậu chưa?";
      case "work":
        return "Tớ hiểu rồi, công việc mệt mỏi mà còn phải cân bằng học hành nữa thì quá tải thật sự. Cậu có cảm thấy sức khỏe thể chất của mình dạo này bị đi xuống không?";
      case "family":
        return "Nghe cậu chia sẻ mà tớ thấy nhói lòng. Kỳ vọng hay mâu thuẫn từ bố mẹ quả thực rất ngột ngạt. Trước đây cậu đã từng thử nói ra nỗi lòng này với gia đình chưa?";
      case "relationships":
        return "Tình cảm rạn nứt hay bạn bè xa cách dễ làm mình thấy trống trải và cô độc lắm. Cậu có ai bên cạnh làm chỗ dựa hay đang phải chịu đựng chuyện này một mình?";
      case "self":
        return "Tớ biết giữ những cảm xúc ngổn ngang này một mình mệt mỏi vô cùng. Cho tớ hỏi nhé, cậu có thường xuyên bị mất ngủ hay cảm thấy bứt rứt, lo lắng vô cớ trong người dạo gần đây không?";
      default:
        return "Cảm ơn cậu đã tin tưởng kể cho tớ nghe nhé. Giữ những lo toan này một mình chắc chắn là không dễ dàng gì. Cậu có thường xuyên cảm thấy ngột ngạt như vậy không?";
    }
  }

  if (depth === 3) {
    return "Tớ hiểu cảm giác của cậu rồi. Đối mặt với những điều đó thực sự cần rất nhiều dũng khí. Những lúc cảm thấy quá tải hay buồn bã như thế này, cậu thường làm gì để giải tỏa lòng mình?";
  }

  if (aspect === "self" || aspect === "studying") {
    return "Lòng cậu lúc này chắc hẳn vẫn còn nhiều ngổn ngang. Cậu nghĩ sao về việc cùng tớ làm một bài hít thở sâu 4-7-8 ở tab 'Hít Thở 4-7-8' để làm dịu nhịp tim và thư giãn đầu óc một chút nhé?";
  }

  return "Tớ rất vui vì được làm bạn lắng nghe cậu trút bầu tâm sự hôm nay. Cậu có muốn tụi mình cùng nhau thiết lập một lộ trình đồng hành thích ứng để tớ có thể nhắc nhở và chăm sóc tinh thần cho cậu mỗi ngày không?";
};

const PSYCHOLOGY_SYSTEM_INSTRUCTION = `
Bạn là "Trợ lý Bạn Học Đường", chuyên gia tư vấn tâm lý học đường và một người bạn lắng nghe thấu cảm. Bạn hoạt động trên một nền tảng khép kín dành cho học sinh, sinh viên. Nhiệm vụ của bạn là lắng nghe, thấu cảm, theo dõi và hỗ trợ sức khỏe tinh thần của học sinh qua các khía cạnh: Bản thân, Học tập, Công việc, Gia đình và Mối quan hệ.

PHƯƠNG PHÁP ĐÁNH GIÁ & QUY TẮC PHẢN HỒI:
1. Giao tiếp bằng tiếng Việt tự nhiên, gần gũi, xưng hô tôn trọng và ấm áp ("tớ" - "cậu").
2. Tuyệt đối KHÔNG đưa ra các câu hỏi trắc nghiệm cứng nhắc hay đè nặng áp lực lên người dùng trong 3 lượt chat đầu tiên. Hãy dành thời gian để lắng nghe nỗi buồn của họ, thừa nhận (validate) cảm xúc đau khổ, căng thẳng của họ bằng sự thấu cảm cao nhất.
3. Khi người dùng nói rằng vấn đề của họ "không phải chuyện học" hoặc "không liên quan đến học tập", hãy lắng nghe kỹ và khéo léo tìm hiểu xem họ đang gặp vấn đề gì ở gia đình, công việc, các mối quan hệ bạn bè hoặc bất ổn nội tâm của bản thân, KHÔNG ĐƯỢC lặp lại các câu hỏi rập khuôn về chuyện thi cử/áp lực học tập.
4. Nếu người dùng thể hiện các triệu chứng căng thẳng, lo âu, trầm cảm (theo tiêu chí DASS-21) hoặc các dấu hiệu tâm lý nghiêm trọng trong cuộc hội thoại từ lượt thứ 4 trở đi, hãy nhẹ nhàng khuyên họ thực hiện bài kiểm tra tâm lý DASS-42 hoặc MMPI-30 trong tab "Trắc nghiệm" để có đánh giá khoa học và chuẩn y khoa nhất.
5. Luôn ưu tiên lắng nghe thấu đáo trước khi đưa ra bất kỳ lời khuyên hay phương pháp điều trị nào. Hãy giữ thái độ không phán xét và bảo mật tuyệt đối.
`;

// POST: Psychology Chat
router.post('/psychology-chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (geminiApiKey) {
      try {
        const contents = history
          .filter(msg => msg.text && msg.text.trim())
          .map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
          }));

        contents.push({
          role: 'user',
          parts: [{ text: message }]
        });

        // Call Gemini 1.5 Flash (Generous free tier model)
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              contents,
              systemInstruction: {
                parts: [{ text: PSYCHOLOGY_SYSTEM_INSTRUCTION }]
              },
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 800
              }
            })
          }
        );

        if (response.ok) {
          const data = await response.json();
          const botText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (botText.trim()) {
            return res.json({ reply: botText.trim() });
          }
        }
        
        console.warn('Gemini API call was not ok or returned empty, falling back to rule-based engine');
      } catch (geminiErr) {
        console.error('Error calling Gemini API for psychology chat:', geminiErr);
      }
    }

    // If Gemini key is not configured or fails, use the highly optimized rule-based engine
    const fallbackReply = fallbackPsychologyReply(message, history);
    res.json({ reply: fallbackReply });
  } catch (error) {
    console.error('Error in psychology-chat handler:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
