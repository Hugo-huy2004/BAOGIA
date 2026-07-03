import React, { createContext, useContext, useState, useEffect } from "react";
import toast from "react-hot-toast";
import dataApi from "../services/dataApi";

const DataContext = createContext();

// Initial data structure (fallback if API is unavailable)
const initialData = {
  profile: {
    fullName: "Peter Hugo Wishpax Le",
    shortName: "Hugo Studio",
    title: "Peter Hugo Wishpax Le • Bio & Premium Services",
    introBadge: "Hello! Chào mừng tới vũ trụ của Hugo Studio!",
    headline: "Xin chào! Tôi là Peter Hugo Wishpax Le",
    subtitle: "Kiến tạo thế giới số bằng những dòng code kẹo ngọt, thiết kế Claymorphism tinh tế kết hợp hiệu năng vượt trội.",
    country: "Việt Nam",
    birthday: "2004",
    education: "IT • Greenwich VN",
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
  partnerIframe: "",
  advertisement: {
    imageUrl: "",
    linkUrl: "",
    isActive: false
  }
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

  // Optimistic update with rollback: apply locally first (instant UI), then
  // persist; if the server rejects, restore the previous state and tell the
  // user — silently swallowing the error made people believe unsaved data was saved.
  const applyAndPersist = async (field, newData) => {
    const previousData = data;
    setData(newData);
    try {
      await dataApi.updateField(field, newData[field]);
    } catch (err) {
      console.error(`Error updating ${field}:`, err);
      setData(previousData);
      toast.error("Lưu thay đổi thất bại — dữ liệu đã được khôi phục. Kiểm tra kết nối và thử lại nhé.");
    }
  };

  const updateProfile = (profileUpdates) =>
    applyAndPersist('profile', { ...data, profile: { ...data.profile, ...profileUpdates } });

  const updateHobbies = (hobbiesList) =>
    applyAndPersist('hobbies', { ...data, hobbies: hobbiesList });

  const updateGallery = (galleryList) =>
    applyAndPersist('gallery', { ...data, gallery: galleryList });

  const updatePricing = (pricingUpdates) =>
    applyAndPersist('pricing', { ...data, pricing: { ...data.pricing, ...pricingUpdates } });

  const updatePartnerIframe = (iframeValue) =>
    applyAndPersist('partnerIframe', { ...data, partnerIframe: iframeValue });

  const updateAdvertisement = (adUpdates) =>
    applyAndPersist('advertisement', { ...data, advertisement: { ...(data.advertisement || {}), ...adUpdates } });

  const updateSystemSettings = (settingsUpdates) =>
    applyAndPersist('systemSettings', { ...data, systemSettings: { ...(data.systemSettings || {}), ...settingsUpdates } });

  const resetToDefaults = async () => {
    const previousData = data;
    setData(initialData);
    try {
      await dataApi.resetData();
    } catch (err) {
      console.error("Error resetting data:", err);
      setData(previousData);
      toast.error("Không thể khôi phục dữ liệu mặc định. Thử lại nhé.");
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
        updatePricing,
        updatePartnerIframe,
        updateAdvertisement,
        updateSystemSettings,
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
