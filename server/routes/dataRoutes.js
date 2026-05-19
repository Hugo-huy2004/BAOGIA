import express from 'express';
import Data from '../models/Data.js';

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
    avatarUrl: "https://res.cloudinary.com/dyehwoscu/image/upload/e_bgremoval/v1779116182/A%CC%89nh_ma%CC%80n_hi%CC%80nh_2026-05-18_lu%CC%81c_21.56.14_imhujt.png",
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
      title: "Trồng Dương Xỉ 🌿",
      desc: "Đam mê trồng các loại cây dương xỉ xanh mướt, mang lại cảm giác bình yên và dịu dàng."
    },
    {
      id: "hobby2",
      icon: "favorite",
      title: "Thích Cute & 3D 🍭",
      desc: "Thích những trải nghiệm số mang phong cách kẹo ngọt Claymorphism bóng bẩy đầy bất ngờ."
    }
  ],
  gallery: [
    {
      id: "photo1",
      url: "https://res.cloudinary.com/dyehwoscu/image/upload/v1779117104/A%CC%89nh_ma%CC%80n_hi%CC%80nh_2026-05-18_lu%CC%81c_22.11.38_vlij7l.png",
      title: "Peter Hugo Wishpax Lê",
      category: "Chân dung cá nhân",
      desc: "Hình ảnh đại diện mang đậm phong thái lập trình viên & nhà thiết kế sáng tạo."
    },
    {
      id: "photo2",
      url: "https://res.cloudinary.com/dyehwoscu/image/upload/v1779117069/A%CC%89nh_ma%CC%80n_hi%CC%80nh_2026-05-18_lu%CC%81c_22.10.59_cqxjne.png",
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
        url: "https://res.cloudinary.com/dyehwoscu/image/upload/v1779117377/c9da96fe_dcrslx.jpg",
        caption: "Bình minh rực rỡ giữa đầm sen Đồng Tháp"
      }
    ]
  },
  catholicism: {
    badge: "Đức Tin Công Giáo",
    emoji: "⛪",
    title: "Sứ Vụ Huynh Trưởng TNTT",
    intro: "Đời sống tâm linh và hành trình tông đồ đầy ý nghĩa dưới vai trò là Huynh Trưởng Thiếu Nhi Thánh Thể.",
    mainImageUrl: "https://res.cloudinary.com/dyehwoscu/image/upload/v1779117963/erjri4f8ncia1zxxbu5t.jpg",
    content: `Chào bạn nha! Ở trang chính Bio Portal, bạn chắc chắn đã thấy Hugo giới thiệu đức tin của mình là Công Giáo Roma.`,
    hierarchyImageUrl: "https://res.cloudinary.com/dyehwoscu/image/upload/v1779117987/83928340_49676971467264_n_wtseuq.jpg",
    popeImageUrl: "https://res.cloudinary.com/dyehwoscu/image/upload/v1779118047/c8a3665e3390d3b1_fhwcox.jpg",
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
  partnerIframe: ""
};

// GET: Fetch all data
router.get('/', async (req, res) => {
  try {
    let data = await Data.findOne({ userId: 'default' });
    
    // If no data exists, create with initial data
    if (!data) {
      data = await Data.create(initialData);
    }
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT: Update entire data
router.put('/', async (req, res) => {
  try {
    let data = await Data.findOneAndUpdate(
      { userId: 'default' },
      req.body,
      { new: true, upsert: true }
    );
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH: Update specific fields
router.patch('/', async (req, res) => {
  try {
    const { field, value } = req.body;
    const updateData = { [field]: value };
    
    let data = await Data.findOneAndUpdate(
      { userId: 'default' },
      updateData,
      { new: true }
    );
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST: Reset to initial data
router.post('/reset', async (req, res) => {
  try {
    await Data.deleteOne({ userId: 'default' });
    const data = await Data.create(initialData);
    res.json({ message: 'Data reset to defaults', data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
