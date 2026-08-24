import express from 'express';
import Data from '../models/Data.js';
import { requireAdmin } from '../middleware/authMiddleware.js';
import { fetchWithCache, clearCache } from '../utils/cacheHelper.js';
import webpush from 'web-push';
import NotificationSubscription from '../models/NotificationSubscription.js';
import Bio from '../models/Bio.js';
import { vapidKeys } from './notificationRoutes.js';

if (vapidKeys.publicKey && vapidKeys.privateKey) {
  const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:support@hugostudio.vn';
  try {
    webpush.setVapidDetails(
      vapidSubject,
      vapidKeys.publicKey,
      vapidKeys.privateKey
    );
  } catch (_) {}
}

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
    birthday: "Gen Z",
    education: "Software Engineering • Greenwich VN 🎓",
    storyTitle: "Kiến tạo trải nghiệm bằng cả trái tim",
    storyContent: "Tôi theo đuổi triết lý lập trình kết hợp nghệ thuật: mỗi giao diện đều phải có linh hồn, mang lại sự ngạc nhiên, ngọt ngào cho người sử dụng từ cái nhìn đầu tiên, nhưng đồng thời bên dưới phải là hệ thống mã nguồn cực kỳ gọn gàng, hiệu năng vượt trội và chuẩn SEO tối đa.",
    avatarUrl: "https://res.cloudinary.com/dyehwoscu/image/upload/e_bgremoval,f_auto,q_auto,w_300/v1779116182/A%CC%89nh_ma%CC%80n_hi%CC%80nh_2026-05-18_lu%CC%81c_21.56.14_imhujt.png",
    meetingQrUrl: "",
    bankName: "",
    accountNumber: "",
    accountHolder: "",
    zaloNumber: "",
    emailAddress: "contact@hugowishpax.studio"
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
    alertCrisis: true,
    autoApproveNew: false,
    autoLockInactive: false,
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
        delete sanitized.profile.meetingQrUrl;
        delete sanitized.profile.zaloNumber;
        sanitized.profile.birthday = 'Gen Z';
        sanitized.profile.emailAddress = 'contact@hugowishpax.studio';
      }
      // These biography sections reveal protected personal attributes and are
      // not required by the current public portfolio UI.
      delete sanitized.dongThap;
      delete sanitized.catholicism;
      return sanitized;
    });

    res.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    res.json(sanitizedData);
  } catch (error) {
    console.error('[public data]', error.message);
    res.status(500).json({ error: 'Không thể tải dữ liệu công khai.' });
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
router.post('/upload-ad', requireAdmin, async (req, res) => {
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
router.delete('/delete-ad', requireAdmin, async (req, res) => {
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

// POST: Psychology Chat
router.post('/broadcast-notification', requireAdmin, async (req, res) => {
  try {
    const { message, all, status } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Nội dung tin nhắn là bắt buộc.' });
    }

    let subscriptions = [];
    if (all) {
      subscriptions = await NotificationSubscription.find({});
    } else if (status) {
      const bios = await Bio.find({ status });
      const emails = bios.map(b => b.email);
      subscriptions = await NotificationSubscription.find({ email: { $in: emails } });
    } else {
      return res.status(400).json({ error: 'Đối tượng nhận thông báo không hợp lệ.' });
    }

    if (subscriptions.length === 0) {
      return res.json({ success: true, count: 0, message: 'Không tìm thấy thiết bị đăng ký nhận thông báo nào.' });
    }

    const payload = JSON.stringify({
      title: 'Thông báo từ Ban Giám Hiệu / Admin',
      body: message,
      icon: '/image/avt7.png',
      url: '/member/utilities/psychology'
    });

    const sendPromises = subscriptions.map(sub => 
      webpush.sendNotification(sub.subscription, payload)
        .catch(err => {
          console.error(`Gửi thông báo thất bại cho endpoint: ${sub.subscription.endpoint}`, err);
          if (err.statusCode === 410 || err.statusCode === 404) {
            return NotificationSubscription.deleteOne({ _id: sub._id });
          }
        })
    );

    await Promise.all(sendPromises);
    res.json({ success: true, count: subscriptions.length, message: `Đã phát thông báo hàng loạt tới ${subscriptions.length} thiết bị.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
