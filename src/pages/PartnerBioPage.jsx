import React, { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import dataApi from "../services/dataApi";

const isColorDark = (color) => {
  if (!color) return false;
  const c = color.substring(1);
  const rgb = parseInt(c, 16);
  if (isNaN(rgb)) return false;
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luma < 140;
};

const BRAND_COLORS = ["#EF4444", "#F97316", "#EAB308", "#22C55E", "#3B82F6", "#A855F7"];

const DEFAULT_PARTNER_THEME = {
  bgColor: "#f5f5f7",
  textColor: "#1d1d1f",
  accentColor: "#0071e3",
  pattern: "none",
  preset: "apple-light",
  btnRadius: 12,
  btnBorderWidth: 0,
  btnShadow: 2,
  template: "default"
};

const RenderColoredText = ({ text }) => {
  if (!text) return null;
  return (
    <>
      {text.split("").map((char, idx) => (
        <span key={idx} style={{ color: BRAND_COLORS[idx % BRAND_COLORS.length] }}>
          {char}
        </span>
      ))}
    </>
  );
};

const HugoStudioColoredBrandLogo = ({ className = "text-xl sm:text-2xl" }) => {
  const chars = [
    { char: "H", color: "#EF4444" },
    { char: "u", color: "#F97316" },
    { char: "g", color: "#EAB308" },
    { char: "o", color: "#22C55E" },
    { char: " ", color: "transparent" },
    { char: "S", color: "#3B82F6" },
    { char: "t", color: "#6366F1" },
    { char: "u", color: "#A855F7" },
    { char: "d", color: "#EC4899" },
    { char: "i", color: "#06B6D4" },
    { char: "o", color: "#0ea5e9" }
  ];
  return (
    <span className={`we-bare-bears select-none ${className}`}>
      {chars.map((item, idx) => (
        <span key={idx} style={{ color: item.color }}>
          {item.char}
        </span>
      ))}
    </span>
  );
};

const PreviewTypographyStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&display=swap');

    .hugo-studio-gradient {
      background: linear-gradient(90deg, #EF4444 0%, #F97316 20%, #EAB308 40%, #22C55E 60%, #3B82F6 80%, #A855F7 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .we-bare-bears {
      font-family: 'Fredoka', sans-serif;
      font-weight: 700;
    }
  `}</style>
);

const getPatternStyle = (pattern, bgColor) => {
  const isDark = isColorDark(bgColor);
  const opacityColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  switch (pattern) {
    case "dots":
      return {
        backgroundImage: `radial-gradient(${opacityColor} 1.5px, transparent 1.5px)`,
        backgroundSize: "16px 16px"
      };
    case "dots-dense":
      return {
        backgroundImage: `radial-gradient(${opacityColor} 1.2px, transparent 1.2px)`,
        backgroundSize: "8px 8px"
      };
    case "stripes":
      return {
        backgroundImage: `linear-gradient(135deg, ${opacityColor} 25%, transparent 25%, transparent 50%, ${opacityColor} 50%, ${opacityColor} 75%, transparent 75%, transparent)`,
        backgroundSize: "24px 24px"
      };
    case "grid":
      return {
        backgroundImage: `linear-gradient(${opacityColor} 1px, transparent 1px), linear-gradient(90deg, ${opacityColor} 1px, transparent 1px)`,
        backgroundSize: "20px 20px"
      };
    case "waves":
      return {
        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 8px, ${opacityColor} 8px, ${opacityColor} 16px)`
      };
    default:
      return {};
  }
};

const normalizeEmail = (value = "") => value.trim().toLowerCase();

const isValidEmail = (value = "") => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export default function PartnerBioPage() {
  const [searchParams] = useSearchParams();
  const emailParam = normalizeEmail(searchParams.get("email") || "");
  const partnerId = searchParams.get("partnerId");
  const accessToken = searchParams.get("token") || "";

  const [inputEmail, setInputEmail] = useState("");
  const [email, setEmail] = useState("");
  const [partner, setPartner] = useState(null);
  const [accessStatus, setAccessStatus] = useState("validating");
  const [bioData, setBioData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [devicePreviewMode, setDevicePreviewMode] = useState("mobile"); // 'mobile' vs 'editor' on small screens
  
  // Modal crop image
  const [cropper, setCropper] = useState({ isOpen: false, imageSrc: null, zoom: 1, aspect: 1, offset: { x: 0, y: 0 } });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Input states
  const [newLinkLabel, setNewLinkLabel] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [toast, setToast] = useState({ message: "", type: "success" });
  const avatarInputRef = useRef(null);

  const showNotification = (message, type = "success") => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (!toast.message) return;
    const timer = setTimeout(() => setToast({ message: "", type: "success" }), 4000);
    return () => clearTimeout(timer);
  }, [toast.message]);

  useEffect(() => {
    if (accessStatus === "authorized" && email) {
      loadBio(email);
    }
  }, [accessStatus, email]);

  useEffect(() => {
    if (!partnerId || !accessToken) {
      setAccessStatus("denied");
      return;
    }

    let isMounted = true;
    setAccessStatus("validating");
    dataApi.getPartner(partnerId, accessToken)
      .then((payload) => {
        if (!isMounted) return;
        setPartner(payload);
        setAccessStatus("authorized");
        if (isValidEmail(emailParam)) setEmail(emailParam);
      })
      .catch((error) => {
        console.warn("Unable to load partner metadata:", error);
        if (isMounted) setAccessStatus("denied");
      });

    return () => {
      isMounted = false;
    };
  }, [partnerId, accessToken, emailParam]);

  const loadBio = async (userEmail) => {
    const normalizedEmail = normalizeEmail(userEmail);
    if (!isValidEmail(normalizedEmail)) {
      showNotification("Email không hợp lệ. Vui lòng kiểm tra lại.", "error");
      setEmail("");
      return;
    }

    setLoading(true);
    try {
      const response = await dataApi.getMemberBio(normalizedEmail);
      if (response && response.bio) {
        setBioData({ ...response.bio, theme: DEFAULT_PARTNER_THEME });
      } else {
        // Auto create empty bio for partner user
        const defaultBio = {
          email: normalizedEmail,
          displayName: normalizedEmail.split("@")[0].toUpperCase(),
          headline: "THIẾT KẾ BIO LINK",
          bio: "Chào mừng bạn! Hãy chỉnh sửa thông tin ở cột trái và xem giao diện thay đổi thời gian thực.",
          avatarUrl: "",
          links: [
            { label: partner?.name || "Hugo Studio", url: "https://hugostudio.vn" }
          ],
          theme: DEFAULT_PARTNER_THEME
        };
        const created = await dataApi.createMemberBio(defaultBio);
        setBioData(created.bio);
        showNotification("Đã khởi tạo Bio Link miễn phí cho tài khoản của bạn!", "success");
      }
    } catch (error) {
      console.error("Error loading partner bio:", error);
      showNotification("Lỗi khi tải hoặc khởi tạo Bio Link.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!bioData || !bioData._id) return;
    setSaving(true);
    try {
      const response = await dataApi.updateMemberBio(bioData._id, {
        ...bioData,
        theme: DEFAULT_PARTNER_THEME
      });
      setBioData({ ...response.bio, theme: DEFAULT_PARTNER_THEME });
      showNotification("Cập nhật Bio Link thành công! ✨", "success");
    } catch (error) {
      console.error("Error saving partner bio:", error);
      showNotification("Không thể lưu cấu hình Bio.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setBioData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    const normalizedEmail = normalizeEmail(inputEmail);
    if (!isValidEmail(normalizedEmail)) {
      showNotification("Vui lòng nhập email hợp lệ để tạo Bio Link.", "error");
      return;
    }
    setEmail(normalizedEmail);
  };

  // Avatar Upload / Compression
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showNotification("Ảnh vượt quá giới hạn 5MB.", "warning");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const aspect = img.width / img.height;
        setCropper({
          isOpen: true,
          imageSrc: event.target.result,
          zoom: 1,
          aspect,
          offset: { x: 0, y: 0 }
        });
      };
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const startDrag = (e) => {
    e.cancelable && e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setIsDragging(true);
    setDragStart({
      x: clientX - cropper.offset.x,
      y: clientY - cropper.offset.y
    });
  };

  const doDrag = (e) => {
    if (!isDragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setCropper(prev => ({
      ...prev,
      offset: {
        x: clientX - dragStart.x,
        y: clientY - dragStart.y
      }
    }));
  };

  const endDrag = () => {
    setIsDragging(false);
  };

  const saveCroppedImage = () => {
    const img = new Image();
    img.src = cropper.imageSrc;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext("2d");
      const baseWidth = 192;
      const baseHeight = baseWidth / cropper.aspect;
      const w = baseWidth * cropper.zoom;
      const h = baseHeight * cropper.zoom;
      const x = 96 - w / 2 + cropper.offset.x;
      const y = 96 - h / 2 + cropper.offset.y;
      
      const ratio = 1024 / 192;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 1024, 1024);
      ctx.drawImage(img, x * ratio, y * ratio, w * ratio, h * ratio);

      const base64 = canvas.toDataURL("image/jpeg", 0.95);
      setBioData(prev => ({
        ...prev,
        avatarUrl: base64
      }));
      setCropper({ isOpen: false, imageSrc: null, zoom: 1, aspect: 1, offset: { x: 0, y: 0 } });
      showNotification("Đã chỉnh sửa ảnh đại diện thành công!");
    };
  };

  const removeAvatar = () => {
    setBioData(prev => ({
      ...prev,
      avatarUrl: ""
    }));
    showNotification("Đã gỡ bỏ ảnh đại diện.");
  };

  // Links CRUD
  const addLink = () => {
    if (bioData.links.length >= 5) {
      showNotification("Chỉ cho phép thêm tối đa 5 liên kết.", "warning");
      return;
    }
    if (!newLinkLabel.trim() || !newLinkUrl.trim()) {
      showNotification("Nhãn và liên kết không được để trống.", "warning");
      return;
    }
    setBioData(prev => ({
      ...prev,
      links: [...prev.links, { label: newLinkLabel.trim(), url: newLinkUrl.trim() }]
    }));
    setNewLinkLabel("");
    setNewLinkUrl("");
    showNotification("Đã thêm liên kết mới!");
  };

  const removeLink = (index) => {
    setBioData(prev => ({
      ...prev,
      links: prev.links.filter((_, idx) => idx !== index)
    }));
    showNotification("Đã gỡ bỏ liên kết.");
  };

  const shareUrl = bioData ? `${window.location.origin}/bio/${bioData.slug}` : "";
  const partnerName = partner?.name || "Đối tác liên kết";

  if (accessStatus === "validating") {
    return (
      <main className="min-h-screen bg-[#f5f5f7] dark:bg-[#000000] flex items-center justify-center text-center">
        <div className="space-y-3">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Đang xác thực quyền đối tác...</p>
        </div>
      </main>
    );
  }

  if (accessStatus === "denied") {
    return (
      <main className="min-h-screen bg-[#f5f5f7] dark:bg-[#000000] text-[#1d1d1f] dark:text-[#f5f5f7] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#12111a] border border-zinc-200/50 dark:border-zinc-800/80 p-8 rounded-3xl max-w-sm w-full shadow-2xl text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-950/20 text-rose-500 flex items-center justify-center">
            <span className="material-symbols-outlined">lock</span>
          </div>
          <h2 className="text-base font-bold">Không Có Quyền Truy Cập</h2>
          <p className="text-xs text-zinc-550 dark:text-zinc-400 leading-relaxed">
            Trang tạo Bio này chỉ hoạt động qua link hoặc iframe đã được Hugo Studio cấp riêng cho đối tác.
          </p>
        </div>
      </main>
    );
  }

  if (!email) {
    return (
      <main className="min-h-screen bg-[#f5f5f7] dark:bg-[#000000] text-[#1d1d1f] dark:text-[#f5f5f7] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#12111a] border border-zinc-200/50 dark:border-zinc-800/80 p-8 rounded-3xl max-w-sm w-full shadow-2xl text-center space-y-6">
          <div className="flex justify-center">
            <HugoStudioColoredBrandLogo className="text-sm font-black" />
          </div>
          <div className="space-y-2">
            <h2 className="text-base font-bold">Kích Hoạt Bio Link</h2>
            <p className="text-xs text-zinc-550 dark:text-zinc-400 leading-relaxed">
              {partnerName} cần cung cấp email người dùng để Hugo Studio tạo và đồng bộ Bio Link miễn phí, không cần đăng nhập vào hệ thống Hugo Studio.
            </p>
          </div>

          {toast.message && (
            <div className="text-[10px] font-semibold text-rose-500 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl px-3 py-2">
              {toast.message}
            </div>
          )}

          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="Email của bạn..."
              value={inputEmail}
              onChange={(e) => setInputEmail(e.target.value)}
              className="w-full text-center px-4 py-3 rounded-xl bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-800 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
              required
            />
            <button
              type="submit"
              className="w-full bg-primary hover:bg-indigo-650 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-all"
            >
              Thiết Kế Ngay
            </button>
          </form>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f5f7] dark:bg-[#000000] flex items-center justify-center text-center">
        <div className="space-y-3">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Đang tải cấu hình Bio...</p>
        </div>
      </main>
    );
  }

  if (!bioData) return null;

  return (
    <main className="min-h-screen bg-[#f5f5f7] dark:bg-[#000000] text-[#1d1d1f] dark:text-[#f5f5f7] transition-colors duration-300">
      <PreviewTypographyStyles />
      
      {/* Toast alert */}
      {toast.message && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/90 dark:bg-[#1c1c1e]/90 backdrop-blur-xl shadow-2xl border border-zinc-200/50 dark:border-zinc-800/80 w-[calc(100vw-32px)] max-w-md animate-toast-in">
          <span className={`material-symbols-outlined shrink-0 text-xl ${
            toast.type === "success" ? "text-emerald-500" : "text-rose-500"
          }`}>
            {toast.type === "success" ? "check_circle" : "error"}
          </span>
          <div className="flex-1 text-[11px] font-semibold leading-relaxed">
            {toast.message}
          </div>
        </div>
      )}

      {/* Embedded editor workspace */}
      <div className="max-w-[1400px] mx-auto p-3 sm:p-6 lg:p-8">
        
        {/* Apple Style Segmented Navigation Header */}
        <section className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 pb-3 border-b border-zinc-200/50 dark:border-zinc-800/30">
          <div className="space-y-0.5">
            <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-[#0071e3] dark:text-[#0a84ff] block">
              {partnerName} • HUGO STUDIO
            </span>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-black dark:text-white">
              Cá nhân hóa Bio Link của: <span className="text-zinc-650 dark:text-zinc-350">{email}</span>
            </h1>
          </div>

          <div className="flex items-center gap-3 justify-between md:justify-end">
            {/* Quick Editor/Preview Toggle on Mobile */}
            <button
              onClick={() => setDevicePreviewMode(devicePreviewMode === "mobile" ? "editor" : "mobile")}
              className="lg:hidden p-2 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 flex items-center justify-center text-zinc-500"
            >
              <span className="material-symbols-outlined text-sm">
                {devicePreviewMode === "mobile" ? "edit_note" : "phone_iphone"}
              </span>
            </button>
          </div>
        </section>

        {/* Workspace Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 items-start">
          
          {/* Left column: Editor */}
          <div className={`lg:col-span-7 space-y-6 ${devicePreviewMode === "mobile" ? "hidden lg:block" : "block"}`}>
            <form onSubmit={handleSave} className="space-y-6">
              
              <div className="space-y-4">
                  {/* Photo upload header */}
                  <div className="flex items-center gap-4 bg-white dark:bg-[#1c1c1e] p-4 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/60 shadow-sm">
                    <div 
                      onClick={() => avatarInputRef.current?.click()}
                      className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center cursor-pointer overflow-hidden group relative shrink-0"
                    >
                      {bioData.avatarUrl ? (
                        <img src={bioData.avatarUrl} alt="Avatar" className="w-full h-full object-cover relative z-10" />
                      ) : (
                        <span className="material-symbols-outlined text-zinc-400 text-2xl relative z-10">add_a_photo</span>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[8px] font-bold z-20">
                        <span className="material-symbols-outlined text-xs">photo_camera</span>
                        <span>SỬA</span>
                      </div>
                    </div>
                    <input
                      type="file"
                      ref={avatarInputRef}
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    <div className="space-y-1">
                      <p className="text-[10px] text-zinc-450 dark:text-zinc-400 font-bold uppercase tracking-wider">Ảnh đại diện</p>
                      <p className="text-[8px] text-zinc-400">Hình ảnh hiển thị trung tâm trên thiết bị của đối tác.</p>
                      {bioData.avatarUrl && (
                        <button
                          type="button"
                          onClick={removeAvatar}
                          className="text-[9px] font-bold text-red-500 hover:underline"
                        >
                          Gỡ ảnh
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Basic fields */}
                  <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl border border-zinc-200/50 dark:border-zinc-800/60 shadow-sm overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800/50">
                    <div className="flex items-center gap-3 px-4 py-3 min-h-[48px]">
                      <span className="material-symbols-outlined text-zinc-400 text-lg shrink-0">person</span>
                      <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider w-24 shrink-0">Họ và Tên</label>
                      <input
                        type="text"
                        name="displayName"
                        value={bioData.displayName}
                        onChange={handleFieldChange}
                        required
                        className="w-full bg-transparent text-xs font-semibold focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-3 px-4 py-3 min-h-[48px]">
                      <span className="material-symbols-outlined text-zinc-400 text-lg shrink-0">badge</span>
                      <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider w-24 shrink-0">Biệt danh</label>
                      <input
                        type="text"
                        name="headline"
                        value={bioData.headline}
                        onChange={handleFieldChange}
                        className="w-full bg-transparent text-xs focus:outline-none"
                      />
                    </div>
                    <div className="flex items-start gap-3 px-4 py-3 min-h-[48px]">
                      <span className="material-symbols-outlined text-zinc-400 text-lg shrink-0 mt-0.5">description</span>
                      <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider w-24 shrink-0 mt-1">Giới thiệu</label>
                      <textarea
                        name="bio"
                        rows={2}
                        value={bioData.bio}
                        onChange={handleFieldChange}
                        className="w-full bg-transparent text-xs focus:outline-none resize-none"
                      />
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl border border-zinc-200/50 dark:border-zinc-800/60 shadow-sm overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800/50">
                    <div className="flex items-center gap-3 px-4 py-3 min-h-[48px]">
                      <span className="material-symbols-outlined text-zinc-400 text-lg shrink-0">school</span>
                      <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider w-24 shrink-0">Học vấn</label>
                      <input
                        type="text"
                        name="education"
                        value={bioData.education || ""}
                        onChange={handleFieldChange}
                        className="w-full bg-transparent text-xs focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-3 px-4 py-3 min-h-[48px]">
                      <span className="material-symbols-outlined text-zinc-400 text-lg shrink-0">work</span>
                      <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider w-24 shrink-0">Nghề nghiệp</label>
                      <input
                        type="text"
                        name="jobTitle"
                        value={bioData.jobTitle || ""}
                        onChange={handleFieldChange}
                        className="w-full bg-transparent text-xs focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-3 px-4 py-3 min-h-[48px]">
                      <span className="material-symbols-outlined text-zinc-400 text-lg shrink-0">call</span>
                      <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider w-24 shrink-0">Số điện thoại</label>
                      <input
                        type="text"
                        name="phone"
                        value={bioData.phone || ""}
                        onChange={handleFieldChange}
                        className="w-full bg-transparent text-xs focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-3 px-4 py-3 min-h-[48px]">
                      <span className="material-symbols-outlined text-zinc-400 text-lg shrink-0">mail</span>
                      <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider w-24 shrink-0">Email liên hệ</label>
                      <input
                        type="text"
                        name="contactEmail"
                        value={bioData.contactEmail || ""}
                        onChange={handleFieldChange}
                        className="w-full bg-transparent text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Links Editor */}
                  <div className="bg-white dark:bg-[#1c1c1e] p-5 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/60 shadow-sm space-y-4">
                    <h3 className="text-[10px] font-bold text-zinc-450 uppercase tracking-widest">LIÊN KẾT MẠNG XÃ HỘI (Tối đa 5)</h3>
                    
                    {bioData.links.length > 0 && (
                      <div className="space-y-2">
                        {bioData.links.map((link, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-black/25 border border-zinc-150 dark:border-zinc-800/80">
                            <div className="min-w-0">
                              <span className="font-bold text-xs block text-slate-800 dark:text-zinc-100 truncate">{link.label}</span>
                              <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono truncate block max-w-md">{link.url}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeLink(idx)}
                              className="text-red-500 hover:text-red-600 p-1 rounded-full"
                            >
                              <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {bioData.links.length < 5 && (
                      <div className="bg-zinc-50 dark:bg-black/10 p-3.5 rounded-2xl border border-zinc-200/40 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder="Nhãn (VD: Zalo, Instagram...)"
                            value={newLinkLabel}
                            onChange={(e) => setNewLinkLabel(e.target.value)}
                            className="bg-white dark:bg-[#12111a] border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs focus:outline-none"
                          />
                          <input
                            type="url"
                            placeholder="https://link-lien-ket.com"
                            value={newLinkUrl}
                            onChange={(e) => setNewLinkUrl(e.target.value)}
                            className="bg-white dark:bg-[#12111a] border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs focus:outline-none"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={addLink}
                          className="w-full bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold py-2 rounded-xl text-[10px] uppercase tracking-wider transition-colors"
                        >
                          + Thêm liên kết mạng xã hội
                        </button>
                      </div>
                    )}
                  </div>
              </div>

              {/* Form submit controller */}
              <div className="flex items-center justify-between gap-4 p-4 bg-white dark:bg-[#1c1c1e] rounded-3xl border border-zinc-200/50 dark:border-zinc-800/60 shadow-sm">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">LƯU CÀI ĐẶT</p>
                  <p className="text-[8px] text-zinc-400 truncate">Hệ thống đồng bộ dữ liệu đám mây của đối tác.</p>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-indigo-600 hover:bg-indigo-650 disabled:bg-indigo-400 text-white font-bold text-[10px] px-6 py-2.5 rounded-full uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/10 shrink-0"
                >
                  {saving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-xs">save</span>
                      <span>Lưu thông tin</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>

          {/* Right column: Interactive phone simulator */}
          <div className={`lg:col-span-5 flex flex-col items-center justify-center py-4 ${devicePreviewMode === "editor" ? "hidden lg:flex" : "flex"}`}>
            <div className="relative w-full max-w-[340px] aspect-[390/844] select-none">
              <div className="absolute -left-[5px] top-[106px] h-16 w-[4px] rounded-l-full bg-zinc-800 shadow-sm" />
              <div className="absolute -left-[5px] top-[188px] h-[46px] w-[4px] rounded-l-full bg-zinc-800 shadow-sm" />
              <div className="absolute -left-[5px] top-[246px] h-[46px] w-[4px] rounded-l-full bg-zinc-800 shadow-sm" />
              <div className="absolute -right-[5px] top-[178px] h-[88px] w-[4px] rounded-r-full bg-zinc-800 shadow-sm" />

              <div className="absolute inset-0 rounded-[62px] bg-gradient-to-br from-zinc-700 via-zinc-950 to-black shadow-[0_30px_80px_-20px_rgba(0,0,0,0.75),inset_0_0_0_1px_rgba(255,255,255,0.14)]" />
              <div className="absolute inset-[4px] rounded-[58px] bg-black shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]" />

              <div className="absolute inset-[11px] rounded-[48px] overflow-hidden bg-black shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] z-10">
                <div className="absolute inset-[2px] rounded-[44px] overflow-hidden bg-white">
                  <div className="absolute inset-x-0 top-0 h-[54px] z-40 pointer-events-none">
                    <div className="absolute left-7 top-[17px] text-[11px] font-black text-black mix-blend-difference invert">
                      9:41
                    </div>
                    <div className="absolute right-7 top-[17px] flex items-center gap-1.5 text-black mix-blend-difference invert">
                      <span className="material-symbols-outlined text-[13px] leading-none">signal_cellular_alt</span>
                      <span className="material-symbols-outlined text-[13px] leading-none">wifi</span>
                      <div className="w-[21px] h-[10px] rounded-[3px] border border-current p-[1px] relative">
                        <div className="h-full w-[14px] rounded-[1.5px] bg-current" />
                        <div className="absolute -right-[3px] top-[2px] h-[4px] w-[2px] rounded-r-sm bg-current" />
                      </div>
                    </div>
                  </div>

                  <div className="absolute top-[11px] left-1/2 -translate-x-1/2 w-[116px] h-[32px] rounded-full bg-black z-50 shadow-[inset_0_-1px_2px_rgba(255,255,255,0.16),0_2px_6px_rgba(0,0,0,0.3)] pointer-events-none">
                    <div className="absolute right-[14px] top-1/2 -translate-y-1/2 w-[9px] h-[9px] rounded-full bg-[#111827] border border-[#1f2937]">
                      <div className="absolute left-[2px] top-[2px] w-[3px] h-[3px] rounded-full bg-blue-500/50" />
                    </div>
                  </div>
              
                  {/* Dynamic screen view */}
                  <div 
                    className="absolute inset-0 overflow-y-auto scrollbar-none snap-y snap-mandatory text-white bg-black"
                    style={{
                      backgroundColor: bioData.theme.bgColor || "#000000",
                      ...getPatternStyle(bioData.theme.pattern, bioData.theme.bgColor || "#000000")
                    }}
                  >
                    <div className="absolute inset-0 z-0 pointer-events-none">
                      {bioData.avatarUrl && (
                        <img src={bioData.avatarUrl} alt="Cover" className="w-full h-full object-cover" />
                      )}
                      <div 
                        className="absolute inset-0"
                        style={getPatternStyle(bioData.theme.pattern, bioData.theme.bgColor || "#000000")}
                      />
                    </div>

                    {/* Slide 1: same first impression as the public Bio page */}
                    <section className="h-full w-full snap-start relative z-10 flex flex-col items-center justify-end px-6 pb-14 pt-[70px]">
                      <div className="absolute inset-0 bg-black/20 pointer-events-none" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/30 to-transparent pointer-events-none" />

                      <div className="relative z-20 w-full flex flex-col items-center text-center space-y-4 px-2">
                        <div className="space-y-2 w-full drop-shadow-lg">
                          <h2 className="font-serif text-2xl uppercase tracking-[0.14em] leading-tight we-bare-bears break-words">
                            <RenderColoredText text={bioData.displayName || "CHƯA NHẬP TÊN"} />
                          </h2>
                          {bioData.headline && (
                            <p className="text-[9px] tracking-[0.26em] font-light text-white/80 uppercase we-bare-bears">
                              {bioData.headline}
                            </p>
                          )}
                        </div>

                        <div className="pt-5 animate-bounce">
                          <span className="material-symbols-outlined text-3xl text-white/70">keyboard_arrow_down</span>
                        </div>
                      </div>
                    </section>

                    {/* Slide 2: identity info */}
                    <section className="h-full w-full snap-start relative z-10 flex flex-col items-center justify-center p-6 pt-[72px]">
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-lg pointer-events-none" />

                      <div className="relative z-20 w-full flex flex-col items-center text-center space-y-5">
                        <div className="w-12 h-1 bg-white/20 rounded-full" />
                        <div className="space-y-1 text-center drop-shadow-md">
                          <div className="inline-flex items-center gap-1.5 text-[9px] tracking-[0.25em] uppercase font-bold text-white/50">
                            <span className="material-symbols-outlined text-[11px] text-white/40">fingerprint</span>
                            IDENTITY PROFILE
                          </div>
                          <h3 className="text-xl font-black uppercase tracking-[0.1em] font-serif we-bare-bears hugo-studio-gradient">
                            Về Bản Thân
                          </h3>
                        </div>

                        {bioData.bio && (
                          <div className="relative w-full p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-inner text-left">
                            <span className="absolute -top-3 -left-1 font-serif text-4xl text-white/20 select-none">“</span>
                            <p className="text-xs leading-relaxed text-white/90 font-serif tracking-wide italic pl-4 pr-2">
                              {bioData.bio}
                            </p>
                            <span className="absolute -bottom-7 -right-1 font-serif text-4xl text-white/20 select-none">”</span>
                          </div>
                        )}

                        {(bioData.education || bioData.jobTitle || bioData.phone || bioData.contactEmail) && (
                          <div className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm text-[10px] space-y-3 text-left">
                            {bioData.jobTitle && (
                              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                <div className="flex items-center gap-1.5 text-white/40">
                                  <span className="material-symbols-outlined text-sm">work</span>
                                  <span className="uppercase tracking-widest text-[8px]">Công việc</span>
                                </div>
                                <p className="font-semibold tracking-wide text-white/90 text-right max-w-[58%]">{bioData.jobTitle}</p>
                              </div>
                            )}
                            {bioData.education && (
                              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                <div className="flex items-center gap-1.5 text-white/40">
                                  <span className="material-symbols-outlined text-sm">history_edu</span>
                                  <span className="uppercase tracking-widest text-[8px]">Học vấn</span>
                                </div>
                                <p className="font-semibold tracking-wide text-white/90 text-right max-w-[58%]">{bioData.education}</p>
                              </div>
                            )}
                            {bioData.phone && (
                              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                <div className="flex items-center gap-1.5 text-white/40">
                                  <span className="material-symbols-outlined text-sm">call</span>
                                  <span className="uppercase tracking-widest text-[8px]">Booking</span>
                                </div>
                                <p className="font-semibold tracking-wide text-white/90 text-right max-w-[58%]">{bioData.phone}</p>
                              </div>
                            )}
                            {bioData.contactEmail && (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-white/40">
                                  <span className="material-symbols-outlined text-sm">alternate_email</span>
                                  <span className="uppercase tracking-widest text-[8px]">Email LH</span>
                                </div>
                                <p className="font-semibold tracking-wide text-white/90 break-all text-right max-w-[58%]">{bioData.contactEmail}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </section>

                    {/* Slide 3: links */}
                    <section className="min-h-full w-full snap-start relative z-10 flex flex-col items-center justify-center p-6 py-20">
                      <div className="absolute inset-0 bg-black/50 backdrop-blur-xl pointer-events-none" />

                      <div className="relative z-20 w-full space-y-7">
                        <div className="text-center">
                          <h3 className="text-[10px] tracking-[0.35em] uppercase text-white/50 font-bold">Các Liên Kết</h3>
                        </div>

                        {bioData.links && bioData.links.length > 0 ? (
                          <div className="space-y-3">
                            {bioData.links.map((link, idx) => (
                              <a
                                key={idx}
                                href={link.url?.startsWith("http") ? link.url : `https://${link.url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full py-4 px-5 text-center text-[10px] font-bold uppercase tracking-widest transition-all hover:scale-[1.02] bg-white/10 hover:bg-white/20 text-white border border-white/10"
                                style={{ borderRadius: `${Math.max(12, bioData.theme.btnRadius || 12)}px` }}
                              >
                                {link.label}
                              </a>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center text-[10px] text-white/50 italic">Chưa thêm liên kết nào...</p>
                        )}

                      </div>
                    </section>

                  </div>

                  <div className="absolute left-1/2 bottom-[8px] -translate-x-1/2 w-[118px] h-[4px] rounded-full bg-black/80 z-50 pointer-events-none" />
                  <div className="absolute inset-0 rounded-[44px] pointer-events-none z-50 bg-[linear-gradient(115deg,rgba(255,255,255,0.28)_0%,rgba(255,255,255,0.08)_16%,transparent_32%,transparent_100%)] opacity-40" />
                </div>
              </div>
            </div>

            {/* Quick Public Link Preview */}
            {shareUrl && (
              <div className="mt-4 flex flex-col items-center space-y-1 text-center">
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Đường dẫn công khai:</span>
                <a 
                  href={shareUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <span>{shareUrl}</span>
                  <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                </a>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* CROPPER IMAGE MODAL */}
      {cropper.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#12111a] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="text-center space-y-1">
              <h3 className="font-bold text-xs text-slate-800 dark:text-white uppercase tracking-wider">Căn Chỉnh Hình Ảnh</h3>
              <p className="text-[9px] text-zinc-400">Nhấn và kéo để di chuyển vùng cắt thích hợp.</p>
            </div>

            <div 
              className="w-48 h-48 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-black/40 mx-auto relative cursor-move select-none"
              onMouseDown={startDrag}
              onMouseMove={doDrag}
              onMouseUp={endDrag}
              onMouseLeave={endDrag}
              onTouchStart={startDrag}
              onTouchMove={doDrag}
              onTouchEnd={endDrag}
            >
              <div 
                className="absolute"
                style={{
                  width: `${192 * cropper.zoom}px`,
                  height: `${(192 / cropper.aspect) * cropper.zoom}px`,
                  left: `calc(50% - ${(192 * cropper.zoom) / 2}px + ${cropper.offset.x}px)`,
                  top: `calc(50% - ${(192 / cropper.aspect * cropper.zoom) / 2}px + ${cropper.offset.y}px)`,
                  backgroundImage: `url(${cropper.imageSrc})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center"
                }}
              />
              {/* Highlight circle boundary overlay */}
              <div className="absolute inset-0 border border-indigo-500/30 rounded-2xl pointer-events-none" />
            </div>

            {/* Slider zoom */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[8px] font-bold text-zinc-400">
                <span>TỶ LỆ PHÓNG TO</span>
                <span>{Math.round(cropper.zoom * 100)}%</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={2.5}
                step={0.1}
                value={cropper.zoom}
                onChange={(e) => setCropper(prev => ({ ...prev, zoom: parseFloat(e.target.value) }))}
                className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 appearance-none cursor-pointer"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCropper({ isOpen: false, imageSrc: null, zoom: 1, aspect: 1, offset: { x: 0, y: 0 } })}
                className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-zinc-200 py-2.5 rounded-xl text-[10px] font-bold transition-all"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={saveCroppedImage}
                className="flex-grow bg-indigo-650 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-[10px] font-bold transition-all"
              >
                Lưu Vùng Cắt
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
