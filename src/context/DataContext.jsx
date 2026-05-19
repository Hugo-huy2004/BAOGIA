import React, { createContext, useContext, useState, useEffect } from "react";
import dataApi from "../services/dataApi";

const DataContext = createContext();

// Initial data structure (fallback if API is unavailable)
const initialData = {
  profile: {
    fullName: "Peter Hugo Wishpax Le",
    shortName: "Hugo Studio",
    title: "Peter Hugo Wishpax Le • Bio & Premium Services ✨",
    introBadge: "Hello! Chào mừng tới vũ trụ của Hugo Studio!",
    headline: "Xin chào! Tôi là Peter Hugo Wishpax Le",
    subtitle: "Kiến tạo thế giới số bằng những dòng code kẹo ngọt, thiết kế Claymorphism tinh tế kết hợp hiệu năng vượt trội.",
    country: "Việt Nam 🇻🇳",
    birthday: "2004",
    education: "IT • Greenwich VN 🎓",
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
    intro: "Đồng Tháp là vùng đất sông nước hiền hòa bên dòng sông Tiền, nổi tiếng với sắc sen hồng rực rỡ bát ngát, di tích Xẻo Quýt hào hùng, Vườn quốc gia Tràm Chim cùng những con người miền Tây đôn hậu, mến khách. Hãy cùng Hugo khám phá những thước ảnh bình yên mộc mạc quê mình nhé!",
    content: `Chào bạn nha! Nếu bạn yêu thích cái yên bình của sông nước Cửu Long, muốn ngửi thấy hương sen thơm nức mũi trong nắng sớm, thì Đồng Tháp chính là thiên đường thu nhỏ đó! 🌾🌸\n\nĐối với Hugo, Đồng Tháp không chỉ đơn thuần là quê hương sinh ra và lớn lên, mà còn là một phần tâm hồn mộc mạc, hiền hòa luôn chảy trong huyết quản. Quê hương tụi mình có ba câu nói nổi tiếng lắm đó:\n👉 *"Đồng Tháp Mười cò bay thẳng cánh, Nước Tháp Mười lấp lánh cá tôm."*\n\nNơi đây hiền hòa vô cùng, có cánh đồng sen nở rộ thơm ngát cả một góc trời Cao Lãnh, Sa Đéc. Có làng hoa kiểng Sa Đéc rực rỡ sắc màu cung cấp hoa Tết cho cả miền Nam. Có vườn quýt hồng Lai Vung mọng nước ngọt thanh như mật ong rừng. Và đặc biệt là Vườn Quốc Gia Tràm Chim - trạm dừng chân thiêng liêng của loài sếu đầu đỏ quý hiếm! 🕊️✨\n\nNgười Đồng Tháp tụi mình xưa nay nổi tiếng là đôn hậu, mến khách và vô cùng chân chất thật thà. Mỗi lần có khách ghé chơi, tụi mình lại đãi những món ngon đậm chất miền Tây sông nước như cá lóc nướng trui cuốn lá sen non, lẩu mắm bông súng thơm nồng nàn hay hủ tiếu Sa Đéc ngọt thanh mê đắm lòng người! Nếu có dịp ghé thăm miền Tây, bạn hãy nhắn Hugo dắt bạn đi vi vu qua những cánh đồng lúa chín vàng ươm, ngồi xuồng ba lá len lỏi trong rừng tràm xanh mát rượi nhé!`,
    photos: [
      {
        id: "dtp1",
        url: "https://res.cloudinary.com/dyehwoscu/image/upload/v1779117377/c9da96fe_dcrslx.jpg",
        caption: "Bình minh rực rỡ giữa đầm sen Đồng Tháp"
      },
      {
        id: "dtp2",
        url: "https://res.cloudinary.com/dyehwoscu/image/upload/v1779117392/xun_sdec_o7w2e1.jpg",
        caption: "Vẻ đẹp quyến rũ trăm hoa đua nở tại Làng hoa Sa Đéc"
      },
      {
        id: "dtp3",
        url: "https://res.cloudinary.com/dyehwoscu/image/upload/v1779117409/trm_chim_qchzsh.jpg",
        caption: "Cánh chim tung bay bình yên tại Tràm Chim quốc gia"
      }
    ]
  },
  catholicism: {
    badge: "Đức Tin Công Giáo",
    emoji: "⛪",
    title: "Sứ Vụ Huynh Trưởng TNTT",
    intro: "Đời sống tâm linh và hành trình tông đồ đầy ý nghĩa dưới vai trò là Huynh Trưởng Thiếu Nhi Thánh Thể. Không chỉ hướng dẫn giáo lý, đây còn là hành trình bác ái xã hội thiêng liêng, rèn luyện tư cách đạo đức siêu nhiên và tự nhiên tốt lành cho thế hệ măng non.",
    mainImageUrl: "https://res.cloudinary.com/dyehwoscu/image/upload/v1779117963/erjri4f8ncia1zxxbu5t.jpg",
    content: `Chào bạn nha! Ở trang chính Bio Portal, bạn chắc chắn đã thấy Hugo giới thiệu đức tin của mình là **Công Giáo Roma** đúng không nè? Hôm nay, bạn hãy cùng Hugo ngồi lại đây, nhâm nhi một tách trà sen mát rượi và để Hugo kể bạn nghe một cách thật gần gũi, chân thành về đức tin yêu thương cũng như lý giải chi tiết **Huynh Trưởng Thiếu Nhi Thánh Thể** thực sự là một người như thế nào nhé! 🕊️✨\n\nĐối với Hugo, Công Giáo Roma (được gọi gần gũi là đạo Thiên Chúa hay Công Giáo) không chỉ là một tôn giáo, mà chính là kim chỉ nam cuộc sống, là ngọn hải đăng bình yên dẫn lối trong mọi nẻo đường lập trình và học tập đầy áp lực. Đức tin dạy Hugo biết hạ mình phụng sự, yêu thương đồng loại như chính mình và luôn nỗ lực hết mình để làm đẹp thế giới bằng tài năng Chúa trao tặng! ❤️\n\n### 👥 HUYNH TRƯỞNG THIẾU NHI THÁNH THỂ LÀ AI NHỈ? 🤔\nTheo từ điển Tiếng Việt chuẩn:\n- **Huynh** chính là một người anh.\n- **Trưởng** chính là người dẫn đầu.\n👉 Do đó, **Huynh trưởng** chính là một người anh cả mến khách, là người dẫn đầu đầy trách nhiệm của một nhóm, một đoàn thể.\n\nNhưng chưa dừng lại ở đó đâu nha! Chữ **Trưởng** ở đây còn mang một ý nghĩa vô cùng thiêng liêng là **Trưởng Thành** nữa đó! Một người Huynh trưởng thực thụ trong Thiếu Nhi Thánh Thể phải là người đã trưởng thành vững vàng về cả hai mặt:\n1. **Tự nhiên:** Thành một người tốt (có tư cách lịch thiệp, tác phong gương mẫu, đức tính tốt lành để hướng dẫn các em).\n2. **Siêu nhiên:** Thành một Kitô hữu tốt (có đời sống đạo đức sốt sắng, sống bác ái, yêu thương sâu đậm và gắn kết mật thiết với Chúa).\n\n🌟 **Định nghĩa đề nghị chuẩn mực:**\n> *"Huynh trưởng TNTT là Kitô hữu được mời gọi, sai đi, tham gia vào công tác tông đồ của Giáo Hội. Huynh trưởng là người trưởng thành, đã được đào tạo có tư cách, tác phong, đạo đức và những đức tính tốt để trở thành một người anh hướng dẫn các em Thiếu Nhi."*\n\nLàm Huynh trưởng và Giáo lý viên nghĩa là dấn thân hy sinh ngày chủ nhật mỗi tuần, để dạy các em nhỏ biết sống ngoan hiền, bác ái, tránh xa các tệ nạn và rèn luyện những kỹ năng sống bổ ích. Đó là niềm vui siêu nhiên cực kỳ ngọt ngào!`,
    hierarchyImageUrl: "https://res.cloudinary.com/dyehwoscu/image/upload/v1779117987/83928340_49676971467264_n_wtseuq.jpg",
    popeImageUrl: "https://res.cloudinary.com/dyehwoscu/image/upload/v1779118047/c8a3665e3390d3b1_fhwcox.jpg",
    popeName: "Đức Giáo Hoàng Phanxicô (Pope Francis)",
    popeDesc: "Vị cha chung thứ 266 của Giáo Hội Công Giáo toàn cầu, nổi tiếng với sự khiêm nhường, yêu thương người nghèo khổ và nỗ lực kiến tạo hòa bình thế giới.",
    hugoServicePhotos: [
      {
        url: "https://res.cloudinary.com/dyehwoscu/image/upload/v1779118162/A%CC%89nh_ma%CC%80n_hi%CC%80nh_2026-05-18_lu%CC%81c_22.28.10_vbw52a.png",
        caption: "Hugo hoạt động sinh hoạt dã ngoại ngoài trời cùng các em thiếu nhi"
      },
      {
        url: "https://res.cloudinary.com/dyehwoscu/image/upload/v1779118168/A%CC%89nh_ma%CC%80n_hi%CC%80nh_2026-05-18_lu%CC%81c_22.29.17_dkroui.png",
        caption: "Khóa huấn luyện Huynh trưởng sa mạc đầy thử thách của Hugo"
      },
      {
        url: "https://res.cloudinary.com/dyehwoscu/image/upload/v1779118232/A%CC%89nh_ma%CC%80n_hi%CC%80nh_2026-05-18_lu%CC%81c_22.30.11_bburw2.png",
        caption: "Hugo nghiêm trang nhận khăn quàng Huynh trưởng tuyên hứa dấn thân"
      }
    ],
    faq: [
      {
        q: "Hỏi: Tại sao phong trào lại gọi là 'Thiếu Nhi Thánh Thể'?",
        a: "Đáp: Bởi vì phong trào tụi mình lấy Chúa Giêsu Thánh Thể làm trung tâm, làm lý tưởng sống và là người bạn đồng hành lớn nhất trong mọi hoạt động giáo dục thanh thiếu nhi! Tên gọi Thánh Thể nhắc nhở mỗi em thiếu nhi và Huynh trưởng luôn biết siêng năng rước lễ, sống kết hợp mật thiết với Chúa Giêsu để lan tỏa yêu thương ấm áp đến muôn nơi! ❤️"
      },
      {
        q: "Hỏi: Huynh trưởng Thiếu Nhi Thánh Thể đeo khăn màu gì?",
        a: "Đáp: Khăn quàng của Huynh trưởng Thiếu Nhi Thánh Thể có màu đỏ viền vàng, tượng trưng cho tinh thần hy sinh dấn thân dũng cảm, dòng máu nhiệt huyết nóng hổi rực rỡ và luôn mang trong mình ngọn lửa yêu thương chân thành để thắp sáng tâm hồn các em nhỏ! 🎗️🔥"
      },
      {
        q: "Hỏi: Cơ cấu phẩm trật trong Giáo Hội Công Giáo gồm những bậc nào?",
        a: "Đáp: Giáo Hội Công Giáo Roma có cơ cấu phẩm trật chặt chẽ từ trên xuống dưới nhằm giữ gìn sự thống nhất đức tin: Đứng đầu là Đức Thánh Cha (Giáo Hoàng) kế vị Thánh Phêrô, tiếp đến là Hồng Y Đoàn, các Đức Giám Mục cai quản các Giáo phận, các Linh Mục đồng hành chăm sóc các Giáo xứ, và toàn thể Cộng đồng Dân Chúa (Giáo dân) đang dấn thân làm chứng cho Tin Mừng giữa đời thường! ⛪✨"
      }
    ]
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

export const DataProvider = ({ children }) => {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data from MongoDB on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const fetchedData = await dataApi.getData();
        setData(fetchedData);
        setError(null);
      } catch (err) {
        // Suppress console spam for expected missing backend in local dev/demo
        // console.error("Failed to fetch data from API, using local cache:", err);
        // Use initial data as fallback
        setData(initialData);
        setError("Using cached data - API unavailable");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const updateProfile = async (profileUpdates) => {
    const newData = {
      ...data,
      profile: { ...data.profile, ...profileUpdates }
    };
    setData(newData);
    try {
      await dataApi.updateField('profile', newData.profile);
    } catch (err) {
      console.error("Error updating profile:", err);
    }
  };

  const updateHobbies = async (hobbiesList) => {
    const newData = { ...data, hobbies: hobbiesList };
    setData(newData);
    try {
      await dataApi.updateField('hobbies', hobbiesList);
    } catch (err) {
      console.error("Error updating hobbies:", err);
    }
  };

  const updateGallery = async (galleryList) => {
    const newData = { ...data, gallery: galleryList };
    setData(newData);
    try {
      await dataApi.updateField('gallery', galleryList);
    } catch (err) {
      console.error("Error updating gallery:", err);
    }
  };

  const updateDongThap = async (dongThapUpdates) => {
    const newData = {
      ...data,
      dongThap: { ...data.dongThap, ...dongThapUpdates }
    };
    setData(newData);
    try {
      await dataApi.updateField('dongThap', newData.dongThap);
    } catch (err) {
      console.error("Error updating dongThap:", err);
    }
  };

  const updateCatholicism = async (catholicismUpdates) => {
    const newData = {
      ...data,
      catholicism: { ...data.catholicism, ...catholicismUpdates }
    };
    setData(newData);
    try {
      await dataApi.updateField('catholicism', newData.catholicism);
    } catch (err) {
      console.error("Error updating catholicism:", err);
    }
  };

  const updatePricing = async (pricingUpdates) => {
    const newData = {
      ...data,
      pricing: { ...data.pricing, ...pricingUpdates }
    };
    setData(newData);
    try {
      await dataApi.updateField('pricing', newData.pricing);
    } catch (err) {
      console.error("Error updating pricing:", err);
    }
  };

  const updatePartnerIframe = async (iframeValue) => {
    const newData = {
      ...data,
      partnerIframe: iframeValue
    };
    setData(newData);
    try {
      await dataApi.updateField('partnerIframe', iframeValue);
    } catch (err) {
      console.error("Error updating partnerIframe:", err);
    }
  };

  const resetToDefaults = async () => {
    setData(initialData);
    try {
      await dataApi.resetData();
    } catch (err) {
      console.error("Error resetting data:", err);
    }
  };

  return (
    <DataContext.Provider
      value={{
        data,
        loading,
        error,
        updateProfile,
        updateHobbies,
        updateGallery,
        updateDongThap,
        updateCatholicism,
        updatePricing,
        updatePartnerIframe,
        resetToDefaults
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};
