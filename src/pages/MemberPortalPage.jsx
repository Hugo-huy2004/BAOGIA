import React, { useEffect, useMemo, useState, useRef } from "react";
import { useData } from "../context/DataContext";
import { getMemberSession, logoutAuth } from "../services/authSession";
import dataApi from "../services/dataApi";

const PRESETS = [
  { id: "apple-light", name: "Apple Light Pro", bgColor: "#f5f5f7", textColor: "#1d1d1f", accentColor: "#0071e3", pattern: "none", btnRadius: 12, btnBorderWidth: 0, btnShadow: 2 },
  { id: "google-pixel", name: "Google Material", bgColor: "#f8f9fa", textColor: "#202124", accentColor: "#1a73e8", pattern: "dots", btnRadius: 24, btnBorderWidth: 0, btnShadow: 3 },
  { id: "apple-dark", name: "Apple Dark Glass", bgColor: "#000000", textColor: "#f5f5f7", accentColor: "#a8a8af", pattern: "none", btnRadius: 14, btnBorderWidth: 1, btnShadow: 0 },
  { id: "aurora", name: "Colorful Aurora", bgColor: "#0c0a18", textColor: "#f4f4f5", accentColor: "#ec4899", pattern: "waves", btnRadius: 18, btnBorderWidth: 0, btnShadow: 8 },
  { id: "sunset", name: "Sunset Minimalist", bgColor: "#fff7ed", textColor: "#7c2d12", accentColor: "#ea580c", pattern: "dots", btnRadius: 20, btnBorderWidth: 0, btnShadow: 4 },
  { id: "forest", name: "Nordic Forest", bgColor: "#f4f7f6", textColor: "#164e63", accentColor: "#10b981", pattern: "stripes", btnRadius: 99, btnBorderWidth: 0, btnShadow: 2 },
  { id: "sakura", name: "Sakura Dream", bgColor: "#fff1f2", textColor: "#9f1239", accentColor: "#ec4899", pattern: "dots", btnRadius: 99, btnBorderWidth: 1, btnShadow: 6 },
  { id: "minty", name: "Material Mint", bgColor: "#e8f0fe", textColor: "#1967d2", accentColor: "#12b886", pattern: "dots-dense", btnRadius: 20, btnBorderWidth: 0, btnShadow: 4 }
];

const PATTERNS = [
  { id: "none", name: "Không họa tiết" },
  { id: "dots", name: "Lưới Chấm Tròn" },
  { id: "dots-dense", name: "Hạt Mịn Mật Độ Cao" },
  { id: "stripes", name: "Sọc Chéo Tinh Tế" },
  { id: "grid", name: "Ô Lưới Bản Vẽ" },
  { id: "waves", name: "Lượn Sóng Nhẹ" }
];

// Helper to check if dark contrast is needed
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

// Gradient colors for brand identity
const BRAND_COLORS = ["#EF4444", "#F97316", "#EAB308", "#22C55E", "#3B82F6", "#A855F7"];

// Function to render text with each character in a different color
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

// Hugo Studio Brand Logo component to match styling exactly
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

// Social Brand Style detector
const getSocialBrandStyle = (label = "") => {
  const lowercase = label.toLowerCase();
  if (lowercase.includes("facebook") || lowercase.includes("fb")) {
    return { bgColor: "#e2e8f0", textColor: "#0f172a", icon: "facebook" };
  }
  if (lowercase.includes("zalo")) {
    return { bgColor: "#e2e8f0", textColor: "#0f172a", icon: "chat" };
  }
  if (lowercase.includes("instagram") || lowercase.includes("ig")) {
    return { bgColor: "#e2e8f0", textColor: "#0f172a", icon: "photo_camera" };
  }
  if (lowercase.includes("tiktok")) {
    return { bgColor: "#e2e8f0", textColor: "#0f172a", icon: "music_note" };
  }
  if (lowercase.includes("github") || lowercase.includes("git")) {
    return { bgColor: "#e2e8f0", textColor: "#0f172a", icon: "code" };
  }
  if (lowercase.includes("youtube") || lowercase.includes("yt")) {
    return { bgColor: "#e2e8f0", textColor: "#0f172a", icon: "play_circle" };
  }
  return { bgColor: "#e2e8f0", textColor: "#0f172a", icon: "language" };
};



export default function MemberPortalPage() {
  const { data } = useData();
  const memberSession = getMemberSession();
  const [bio, setBio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "" });

  const handleLogout = () => {
    logoutAuth();
    window.location.href = "/login";
  };

  const [activeTab, setActiveTab] = useState("account");
  const [previewMode, setPreviewMode] = useState("mobile");

  // Partners state & loading
  const [partners, setPartners] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [partnerSearch, setPartnerSearch] = useState("");
  const [partnerPage, setPartnerPage] = useState(1);

  const isEmbedded = useMemo(() => {
    return window.self !== window.top || new URLSearchParams(window.location.search).get("embed") === "true";
  }, []);

  const isGuestMode = useMemo(() => {
    return isEmbedded && !memberSession?.email;
  }, [isEmbedded, memberSession]);

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const res = await fetch("/api/partners");
        if (res.ok) {
          const list = await res.json();
          setPartners(list);
          if (list.length > 0) {
            setSelectedPartner(list[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load partners in member portal:", err);
      }
    };
    fetchPartners();
  }, []);

  const filteredPartners = partners.filter(p =>
    p.name.toLowerCase().includes(partnerSearch.toLowerCase())
  );

  const PARTNERS_PER_PAGE = 12;
  const totalPartnerPages = Math.ceil(filteredPartners.length / PARTNERS_PER_PAGE);
  const paginatedPartners = filteredPartners.slice(
    (partnerPage - 1) * PARTNERS_PER_PAGE,
    partnerPage * PARTNERS_PER_PAGE
  );

  // Form State
  const [formData, setFormData] = useState({
    displayName: memberSession?.displayName || "",
    headline: "",
    bio: "",
    birthday: "",
    phone: "",
    hobbies: "",
    height: "",
    weight: "",
    measurements: "",
    address: "",
    education: "",
    skills: "",
    jobTitle: "",
    contactEmail: "",
    avatarUrl: "",
    links: [],
    theme: {
      bgColor: "#ffffff",
      textColor: "#0f172a",
      accentColor: "#6366f1",
      pattern: "none",
      preset: "default",
      btnRadius: 16,
      btnBorderWidth: 0,
      btnShadow: 4,
      template: "default"
    },
    tabs: []
  });

  const [newLinkLabel, setNewLinkLabel] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");

  const [newTabTitle, setNewTabTitle] = useState("");
  const [newTabContent, setNewTabContent] = useState("");

  const [simActiveTab, setSimActiveTab] = useState(null);

  const [cropModal, setCropModal] = useState({
    isOpen: false,
    imageSrc: null,
    zoom: 1,
    aspect: 1,
    offset: { x: 0, y: 0 }
  });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (!toast.message) return;
    const timer = setTimeout(() => {
      setToast({ message: "", type: "" });
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.message]);

  const publicLink = useMemo(() => {
    if (!bio?.slug) return "";
    return `${window.location.origin}/bio/${bio.slug}`;
  }, [bio]);

  useEffect(() => {
    const loadBio = async () => {
      if (isGuestMode) {
        try {
          const savedLocal = localStorage.getItem("hugo_guest_bio");
          if (savedLocal) {
            const parsed = JSON.parse(savedLocal);
            setBio(parsed);
            setFormData(parsed);
          } else {
            const defaultGuest = {
              displayName: "HUGO STUDIO PARTNER GUEST",
              headline: "THIẾT KẾ BIO PHONG CÁCH BENTO",
              bio: "Chào mừng bạn! Hãy chỉnh sửa thông tin ở cột trái và xem giao diện thay đổi thời gian thực ở chiếc điện thoại bên phải nhé.",
              birthday: "19/05/2026",
              phone: "0999.888.777",
              hobbies: "Design, Code, Coffee, Music",
              height: "1m75",
              weight: "65kg",
              measurements: "90-60-90",
              address: "TP. Hồ Chí Minh",
              education: "Đại học Kiến trúc",
              skills: "Figma, React, UI/UX",
              jobTitle: "UI/UX Designer",
              contactEmail: "hello@hugostudio.vn",
              avatarUrl: "",
              links: [
                { label: "Instagram", url: "https://instagram.com" },
                { label: "Facebook cá nhân", url: "https://facebook.com" }
              ],
              theme: {
                bgColor: "#0f172a",
                textColor: "#f8fafc",
                accentColor: "#6366f1",
                pattern: "stars",
                preset: "indigo-dark",
                btnRadius: 16,
                btnBorderWidth: 1,
                btnShadow: 6,
                template: "default"
              },
              tabs: []
            };
            setBio(defaultGuest);
            setFormData(defaultGuest);
          }
        } catch (e) {
          console.error("Failed to load local guest bio:", e);
        } finally {
          setLoading(false);
        }
        return;
      }

      if (!memberSession?.email) {
        setLoading(false);
        return;
      }

      try {
        const response = await dataApi.getMemberBio(memberSession.email);
        if (response?.bio) {
          const b = response.bio;
          setBio(b);
          setFormData({
            displayName: b.displayName || memberSession.displayName || "",
            headline: b.headline || "",
            bio: b.bio || "",
            birthday: b.birthday || "",
            phone: b.phone || "",
            hobbies: b.hobbies || "",
            height: b.height || "",
            weight: b.weight || "",
            measurements: b.measurements || "",
            address: b.address || "",
            education: b.education || "",
            skills: b.skills || "",
            jobTitle: b.jobTitle || "",
            contactEmail: b.contactEmail || "",
            avatarUrl: b.avatarUrl || "",
            links: b.links || [],
            theme: {
              bgColor: b.theme?.bgColor || "#ffffff",
              textColor: b.theme?.textColor || "#0f172a",
              accentColor: b.theme?.accentColor || "#6366f1",
              pattern: b.theme?.pattern || "none",
              preset: b.theme?.preset || "default",
              btnRadius: typeof b.theme?.btnRadius === "number" ? b.theme.btnRadius : 16,
              btnBorderWidth: typeof b.theme?.btnBorderWidth === "number" ? b.theme.btnBorderWidth : 0,
              btnShadow: typeof b.theme?.btnShadow === "number" ? b.theme.btnShadow : 4,
              template: b.theme?.template || "default"
            },
            tabs: b.tabs || []
          });
        }
      } catch (error) {
        console.error(error);
        showToast("Không thể tải thông tin Bio.", "error");
      } finally {
        setLoading(false);
      }
    };

    loadBio();
  }, [memberSession?.email, isGuestMode]);

  const avatarInputRef = useRef(null);
  const bioTextareaRef = useRef(null);

  useEffect(() => {
    if (bioTextareaRef.current) {
      bioTextareaRef.current.style.height = "auto";
      bioTextareaRef.current.style.height = `${bioTextareaRef.current.scrollHeight}px`;
    }
  }, [formData.bio, activeTab]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("Kích thước ảnh quá lớn (tối đa 5MB).", "warning");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const aspect = img.width / img.height;
        setCropModal({
          isOpen: true,
          imageSrc: event.target.result,
          zoom: 1,
          aspect: aspect,
          offset: { x: 0, y: 0 }
        });
      };
    };
    reader.readAsDataURL(file);
    e.target.value = ""; // Reset file input
  };

  const handleDragStart = (e) => {
    if (e.cancelable) {
      e.preventDefault();
    }
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    setIsDragging(true);
    setStartPos({
      x: clientX - cropModal.offset.x,
      y: clientY - cropModal.offset.y
    });
  };

  const handleDragMove = (e) => {
    if (!isDragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    setCropModal((prev) => ({
      ...prev,
      offset: {
        x: clientX - startPos.x,
        y: clientY - startPos.y
      }
    }));
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleCropSave = () => {
    const imgElement = new Image();
    imgElement.src = cropModal.imageSrc;
    imgElement.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext("2d");

      const baseWidth = 192;
      const baseHeight = baseWidth / cropModal.aspect;

      const zoomedWidth = baseWidth * cropModal.zoom;
      const zoomedHeight = baseHeight * cropModal.zoom;

      const tlX = (96 - zoomedWidth / 2) + cropModal.offset.x;
      const tlY = (96 - zoomedHeight / 2) + cropModal.offset.y;

      const scaleCanvas = 1024 / 192;
      const canvasX = tlX * scaleCanvas;
      const canvasY = tlY * scaleCanvas;
      const canvasW = zoomedWidth * scaleCanvas;
      const canvasH = zoomedHeight * scaleCanvas;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 1024, 1024);
      ctx.drawImage(imgElement, canvasX, canvasY, canvasW, canvasH);

      // Dùng định dạng WebP để ảnh cực kỳ sắc nét nhưng dung lượng siêu nhẹ (giảm gánh nặng cho DB)
      const compressedBase64 = canvas.toDataURL("image/webp", 0.9);
      setFormData((prev) => ({ ...prev, avatarUrl: compressedBase64 }));
      setCropModal({ isOpen: false, imageSrc: null, zoom: 1, aspect: 1, offset: { x: 0, y: 0 } });
      showToast("Cắt ảnh đại diện thành công!", "success");
    };
  };

  const handleRemoveAvatar = () => {
    setFormData((prev) => ({ ...prev, avatarUrl: "" }));
    showToast("Đã gỡ bỏ ảnh đại diện tạm thời.", "success");
  };

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    if (name === "bio") {
      const wordCount = value.trim().split(/\s+/).filter(Boolean).length;
      if (wordCount > 110) {
        showToast("Giới hạn mô tả bản thân dưới 110 chữ.", "warning");
        return;
      }
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleThemeChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      theme: { ...prev.theme, [field]: value }
    }));
  };

  const applyPreset = (preset) => {
    setFormData((prev) => ({
      ...prev,
      theme: {
        ...prev.theme,
        bgColor: preset.bgColor,
        textColor: preset.textColor,
        accentColor: preset.accentColor,
        pattern: preset.pattern,
        preset: preset.id,
        btnRadius: preset.btnRadius,
        btnBorderWidth: preset.btnBorderWidth,
        btnShadow: preset.btnShadow
      }
    }));
    showToast(`Đã áp dụng phối màu: ${preset.name}`, "success");
  };

  const applyRandomTheme = () => {
    const isDarkProfile = Math.random() > 0.5;

    const bgColor = isDarkProfile
      ? ["#09090b", "#0f172a", "#111827", "#1e1b4b", "#1c1917", "#061325"][Math.floor(Math.random() * 6)]
      : ["#ffffff", "#fafaf9", "#f0fdf4", "#fff7ed", "#fff1f2", "#f0f9ff"][Math.floor(Math.random() * 6)];

    const textColor = isDarkProfile ? "#f8fafc" : "#0f172a";

    const accentColors = ["#6366f1", "#ec4899", "#10b981", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6", "#14b8a6"];
    const accentColor = accentColors[Math.floor(Math.random() * accentColors.length)];

    const randomPattern = PATTERNS[Math.floor(Math.random() * PATTERNS.length)].id;
    const randomRadius = Math.floor(Math.random() * 32);
    const randomBorderWidth = Math.random() > 0.6 ? Math.floor(Math.random() * 3) : 0;
    const randomShadow = Math.floor(Math.random() * 12);

    const templatesList = ["default", "retro-grid", "hero-image", "social-branded", "neon-glass", "natural-leaves", "bento-peach", "editorial-mono"];
    const randomTemplate = templatesList[Math.floor(Math.random() * templatesList.length)];

    setFormData((prev) => ({
      ...prev,
      theme: {
        bgColor,
        textColor,
        accentColor,
        pattern: randomPattern,
        preset: "custom",
        btnRadius: randomRadius,
        btnBorderWidth: randomBorderWidth,
        btnShadow: randomShadow,
        template: randomTemplate
      }
    }));

    showToast("Đã thiết kế giao diện ngẫu nhiên!", "success");
  };

  // Social Links Handlers (With Auto-Save capability)
  const addSocialLink = async () => {
    if (formData.links.length >= 5) {
      showToast("Chỉ cho phép thêm tối đa 5 liên kết.", "warning");
      return;
    }
    if (!newLinkLabel.trim() || !newLinkUrl.trim()) {
      showToast("Vui lòng nhập tên nhãn và đường dẫn liên kết.", "warning");
      return;
    }

    const updatedLinks = [...formData.links, { label: newLinkLabel.trim(), url: newLinkUrl.trim() }];

    setFormData((prev) => ({
      ...prev,
      links: updatedLinks
    }));
    setNewLinkLabel("");
    setNewLinkUrl("");

    if (isGuestMode) {
      const updatedBio = { ...formData, links: updatedLinks };
      setBio(updatedBio);
      localStorage.setItem("hugo_guest_bio", JSON.stringify(updatedBio));
      showToast("Đã lưu liên kết đối tác! ", "success");
    } else if (bio?._id) {
      try {
        const response = await dataApi.updateMemberBio(bio._id, {
          ...formData,
          links: updatedLinks
        });
        setBio(response.bio);
        showToast("Đã thêm và lưu liên kết thành công!", "success");
      } catch (err) {
        showToast("Thêm liên kết tạm thời (nhấn Cập Nhật ở dưới để lưu).", "warning");
      }
    } else {
      showToast("Đã thêm liên kết tạm thời (nhấp Lưu thông tin để kích hoạt).", "success");
    }
  };

  const removeSocialLink = async (indexToKill) => {
    const updatedLinks = formData.links.filter((_, idx) => idx !== indexToKill);
    setFormData((prev) => ({
      ...prev,
      links: updatedLinks
    }));

    if (isGuestMode) {
      const updatedBio = { ...formData, links: updatedLinks };
      setBio(updatedBio);
      localStorage.setItem("hugo_guest_bio", JSON.stringify(updatedBio));
      showToast("Đã cập nhật liên kết đối tác! 📋", "success");
    } else if (bio?._id) {
      try {
        const response = await dataApi.updateMemberBio(bio._id, {
          ...formData,
          links: updatedLinks
        });
        setBio(response.bio);
        showToast("Đã xóa và cập nhật liên kết!", "success");
      } catch (err) {
        showToast("Đã xóa liên kết tạm thời.", "warning");
      }
    } else {
      showToast("Đã xóa liên kết tạm thời.", "success");
    }
  };

  // Custom Tabs Handlers (With Auto-Save capability)
  const addCustomTab = async () => {
    if (!newTabTitle.trim() || !newTabContent.trim()) {
      showToast("Vui lòng điền đủ tiêu đề và nội dung thẻ tab.", "warning");
      return;
    }
    const tabId = "tab_" + Date.now();
    const updatedTabs = [...formData.tabs, { id: tabId, title: newTabTitle.trim(), content: newTabContent.trim() }];

    setFormData((prev) => ({
      ...prev,
      tabs: updatedTabs
    }));
    setNewTabTitle("");
    setNewTabContent("");

    if (isGuestMode) {
      const updatedBio = { ...formData, tabs: updatedTabs };
      setBio(updatedBio);
      localStorage.setItem("hugo_guest_bio", JSON.stringify(updatedBio));
      showToast("Đã lưu tab bento đối tác! 📋", "success");
    } else if (bio?._id) {
      try {
        const response = await dataApi.updateMemberBio(bio._id, {
          ...formData,
          tabs: updatedTabs
        });
        setBio(response.bio);
        showToast("Đã lưu tab bento thành công!", "success");
      } catch (err) {
        showToast("Đã thêm tab tạm thời.", "warning");
      }
    } else {
      showToast("Đã thêm tab tạm thời.", "success");
    }
  };

  const removeCustomTab = async (idToKill) => {
    const updatedTabs = formData.tabs.filter((t) => t.id !== idToKill);
    setFormData((prev) => ({
      ...prev,
      tabs: updatedTabs
    }));

    if (isGuestMode) {
      const updatedBio = { ...formData, tabs: updatedTabs };
      setBio(updatedBio);
      localStorage.setItem("hugo_guest_bio", JSON.stringify(updatedBio));
      showToast("Đã cập nhật bento tab! 📋", "success");
    } else if (bio?._id) {
      try {
        const response = await dataApi.updateMemberBio(bio._id, {
          ...formData,
          tabs: updatedTabs
        });
        setBio(response.bio);
        showToast("Đã cập nhật danh sách bento tab!", "success");
      } catch (err) {
        showToast("Đã xóa tab tạm thời.", "warning");
      }
    } else {
      showToast("Đã xóa tab tạm thời.", "success");
    }
  };

  // Keyboard Enter Interceptors to prevent default form submits
  const handleLinkInputKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSocialLink();
    }
  };

  const handleTabInputKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCustomTab();
    }
  };

  // Save / Activate flow
  const handleSave = async (e) => {
    if (e) e.preventDefault();

    // Validate bio word count
    if (formData.bio) {
      const wordCount = formData.bio.trim().split(/\s+/).filter(Boolean).length;
      if (wordCount > 110) {
        showToast("Mô tả bản thân không được vượt quá 110 chữ.", "error");
        return;
      }
    }

    setSaving(true);
    try {
      if (isGuestMode) {
        setBio(formData);
        localStorage.setItem("hugo_guest_bio", JSON.stringify(formData));
        showToast("Lưu cài đặt Bio Đối tác thành công! 🌐", "success");
      } else if (bio?._id) {
        const response = await dataApi.updateMemberBio(bio._id, formData);
        setBio(response.bio);
        showToast("Lưu cài đặt Bio thành công!", "success");
      } else {
        const response = await dataApi.createMemberBio({
          ...formData,
          email: memberSession.email
        });
        setBio(response.bio);
        showToast("Kích hoạt Bio Link thành công!", "success");
      }
    } catch (error) {
      console.error(error);
      showToast(error.message || "Lỗi hệ thống khi lưu thông tin.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBio = async () => {
    if (isGuestMode) {
      if (!window.confirm("Xác nhận xóa hoàn toàn thiết kế Bio đối tác hiện tại?")) return;
      localStorage.removeItem("hugo_guest_bio");
      setBio(null);
      setFormData({
        displayName: "HUGO STUDIO PARTNER GUEST",
        headline: "",
        bio: "",
        birthday: "",
        phone: "",
        hobbies: "",
        height: "",
        weight: "",
        measurements: "",
        address: "",
        education: "",
        skills: "",
        jobTitle: "",
        contactEmail: "",
        avatarUrl: "",
        links: [],
        theme: {
          bgColor: "#0f172a",
          textColor: "#f8fafc",
          accentColor: "#6366f1",
          pattern: "none",
          preset: "default",
          btnRadius: 16,
          btnBorderWidth: 0,
          btnShadow: 4,
          template: "default"
        },
        tabs: []
      });
      showToast("Đã xóa sạch dữ liệu thiết kế cục bộ.", "success");
      return;
    }

    if (!bio?._id) return;
    if (!window.confirm("Xác nhận xóa hoàn toàn Bio cá nhân? Thao tác này không thể hoàn tác.")) return;

    setSaving(true);
    try {
      await dataApi.deleteMemberBio(bio._id);
      setBio(null);
      setFormData({
        displayName: memberSession?.displayName || "",
        headline: "",
        bio: "",
        birthday: "",
        phone: "",
        hobbies: "",
        height: "",
        weight: "",
        measurements: "",
        address: "",
        links: [],
        theme: {
          bgColor: "#ffffff",
          textColor: "#0f172a",
          accentColor: "#6366f1",
          pattern: "none",
          preset: "default",
          btnRadius: 16,
          btnBorderWidth: 0,
          btnShadow: 4,
          template: "default"
        },
        tabs: []
      });
      showToast("Đã gỡ bỏ Bio Link cá nhân của bạn.", "success");
      setActiveTab("account");
    } catch (error) {
      console.error(error);
      showToast("Không gỡ bỏ được Bio.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLink = async () => {
    if (!publicLink) return;
    await navigator.clipboard.writeText(publicLink);
    showToast("Đã sao chép liên kết vào bộ nhớ tạm.", "success");
  };

  // Helper to get CSS inline styles for background patterns
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

  const startLabel = bio?.createdAt
    ? new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(bio.createdAt))
    : "Chưa kích hoạt";

  const expiresLabel = bio?.expiresAt
    ? new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(bio.expiresAt))
    : "Hạn dùng 12 tháng (kể từ ngày tạo)";

  // Live Simulator Templates Renderer matching public page
  const renderSimulatedLayout = () => {
    const bgColor = formData.theme.bgColor || "#000000";
    const accentColor = formData.theme.accentColor || "#ffffff";
    const socialLinks = formData.links ? formData.links.slice(0, 4) : [];
    const activeBentoTab = simActiveTab !== null ? simActiveTab : (formData.tabs?.length > 0 ? 0 : null);

    return (
      <div
        className="absolute inset-0 overflow-y-auto snap-y snap-mandatory scroll-smooth text-white scrollbar-none flex flex-col bg-black"
        style={{
          backgroundColor: bgColor,
          ...getPatternStyle(formData.theme.pattern, bgColor)
        }}
      >
        {/* Global Fixed Background (Avatar Image) */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          {formData.avatarUrl && (
            <img src={formData.avatarUrl} alt="Cover" className="w-full h-full object-cover" />
          )}
          <div
            className="absolute inset-0"
            style={getPatternStyle(formData.theme.pattern, bgColor)}
          />
        </div>

        {/* CSS for custom fonts and styles to match BioPublicPage */}
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
            letter-spacing: -0.02em;
          }

          /* Hide scrollbar for simulator */
          .scrollbar-none::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-none {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>

        {/* SLIDE 1: HERO COVER */}
        <section className="h-full min-h-[520px] w-full snap-start relative z-10 flex flex-col items-center justify-end pb-8 px-4 shrink-0">
          <div className="absolute inset-0 bg-black/20 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/30 to-transparent pointer-events-none" />

          <div className="relative z-20 w-full flex flex-col items-center text-center space-y-3 px-2">
            <h1 className="font-serif text-lg sm:text-xl uppercase tracking-[0.12em] leading-tight we-bare-bears drop-shadow-md">
              <RenderColoredText text={formData.displayName || "HIỂN THỊ TÊN"} />
            </h1>
            {formData.headline && (
              <h2 className="text-[9px] tracking-[0.25em] font-light text-white/80 uppercase mt-1 we-bare-bears drop-shadow-md">
                {formData.headline}
              </h2>
            )}

            {/* Scroll Down Indicator */}
            <div className="pt-4 animate-bounce">
              <span className="material-symbols-outlined text-lg text-white/70">keyboard_arrow_down</span>
            </div>
          </div>
        </section>

        {/* SLIDE 2: INFO (Thông tin) */}
        <section className="h-full min-h-[520px] w-full snap-start relative z-10 flex flex-col items-center justify-center p-4 shrink-0">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md pointer-events-none" />

          <div className="relative z-20 w-full flex flex-col items-center text-center space-y-4">
            <div className="w-8 h-0.5 bg-white/20 rounded-full mb-1" />

            <h3 className="text-[8px] tracking-[0.3em] uppercase text-white/50 font-bold">Về Bản Thân</h3>

            {formData.bio && (
              <p className="text-[10px] sm:text-xs leading-relaxed text-white/90 font-light px-2 font-serif tracking-wide">
                {formData.bio}
              </p>
            )}

            <div className="w-full mt-2 space-y-3">
              {/* Info Banner */}
              {(formData.height || formData.weight || formData.measurements) && (
                <div className="w-full px-2 py-3 rounded-2xl bg-gradient-to-r from-white/10 via-white/15 to-white/10 border border-white/20 backdrop-blur-sm">
                  <div className="grid grid-cols-3 gap-1 w-full">
                    {formData.height && (
                      <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/5">
                        <span className="material-symbols-outlined text-white/70 mb-1 text-sm">height</span>
                        <span className="text-[6px] uppercase tracking-[0.1em] text-white/40 mb-0.5">Chiều cao</span>
                        <p className="text-[9px] font-serif tracking-widest text-white/95">{formData.height}</p>
                      </div>
                    )}
                    {formData.weight && (
                      <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/5">
                        <span className="material-symbols-outlined text-white/70 mb-1 text-sm">monitor_weight</span>
                        <span className="text-[6px] uppercase tracking-[0.1em] text-white/40 mb-0.5">Cân nặng</span>
                        <p className="text-[9px] font-serif tracking-widest text-white/95">{formData.weight}</p>
                      </div>
                    )}
                    {formData.measurements && (
                      <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/5">
                        <span className="material-symbols-outlined text-white/70 mb-1 text-sm">straighten</span>
                        <span className="text-[6px] uppercase tracking-[0.1em] text-white/40 mb-0.5">Số đo</span>
                        <p className="text-[9px] font-serif tracking-widest text-white/95">{formData.measurements}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Other details */}
              {(formData.birthday || formData.address || formData.hobbies || formData.phone) && (
                <div className="w-full p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm text-[8px] sm:text-[9px] space-y-2 text-left">
                  {formData.phone && (
                    <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                      <div className="flex items-center gap-1 text-white/40">
                        <span className="material-symbols-outlined text-xs">call</span>
                        <span className="uppercase tracking-widest text-[7px] sm:text-[8px] font-bold">Booking</span>
                      </div>
                      <p className="font-serif font-bold text-[9px] sm:text-[10px] tracking-widest text-white/90 uppercase">{formData.phone}</p>
                    </div>
                  )}
                  {formData.birthday && (
                    <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                      <div className="flex items-center gap-1 text-white/40">
                        <span className="material-symbols-outlined text-xs">cake</span>
                        <span className="uppercase tracking-widest text-[7px] sm:text-[8px] font-bold">Ngày sinh</span>
                      </div>
                      <p className="font-serif font-bold text-[9px] sm:text-[10px] tracking-widest text-white/90 uppercase">{formData.birthday}</p>
                    </div>
                  )}
                  {formData.address && (
                    <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                      <div className="flex items-center gap-1 text-white/40">
                        <span className="material-symbols-outlined text-xs">distance</span>
                        <span className="uppercase tracking-widest text-[7px] sm:text-[8px] font-bold">Khu vực</span>
                      </div>
                      <p className="font-serif font-bold text-[9px] sm:text-[10px] tracking-widest text-white/90 uppercase">{formData.address}</p>
                    </div>
                  )}
                  {formData.hobbies && (
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-1 text-white/40 mt-0.5">
                        <span className="material-symbols-outlined text-xs">favorite</span>
                        <span className="uppercase tracking-widest text-[7px] sm:text-[8px] font-bold">Sở thích</span>
                      </div>
                      <p className="font-serif font-bold text-[9px] sm:text-[10px] tracking-wide text-white/90 text-right max-w-[65%] leading-relaxed uppercase">{formData.hobbies}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* SLIDE 2B: ACADEMIC & CAREER (Học vấn & Sự nghiệp) - Simulated */}
        {(formData.education || formData.skills || formData.jobTitle || formData.contactEmail) && (
          <section className="h-full min-h-[520px] w-full snap-start relative z-10 flex flex-col items-center justify-center p-4 shrink-0">
            <div className="absolute inset-0 bg-black/45 backdrop-blur-md pointer-events-none" />

            <div className="relative z-20 w-full flex flex-col items-center text-center space-y-4">
              <div className="w-8 h-0.5 bg-white/20 rounded-full mb-1" />

              <h3 className="text-[8px] tracking-[0.3em] uppercase text-white/50 font-bold">Học vấn & Sự nghiệp</h3>

              <div className="w-full mt-2 space-y-3">
                <div className="w-full p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm text-[8px] sm:text-[9px] space-y-2 text-left">
                  {formData.jobTitle && (
                    <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                      <div className="flex items-center gap-1 text-white/40">
                        <span className="material-symbols-outlined text-xs">work</span>
                        <span className="uppercase tracking-widest text-[7px] sm:text-[8px] font-bold">Công việc</span>
                      </div>
                      <p className="font-semibold text-[9px] sm:text-[10px] text-white/90 truncate max-w-[65%] text-right">{formData.jobTitle}</p>
                    </div>
                  )}
                  {formData.education && (
                    <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                      <div className="flex items-center gap-1 text-white/40">
                        <span className="material-symbols-outlined text-xs">school</span>
                        <span className="uppercase tracking-widest text-[7px] sm:text-[8px] font-bold">Học vấn</span>
                      </div>
                      <p className="font-semibold text-[9px] sm:text-[10px] text-white/90 truncate max-w-[65%] text-right">{formData.education}</p>
                    </div>
                  )}
                  {formData.skills && (
                    <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                      <div className="flex items-center gap-1 text-white/40">
                        <span className="material-symbols-outlined text-xs">psychology</span>
                        <span className="uppercase tracking-widest text-[7px] sm:text-[8px] font-bold">Kỹ năng</span>
                      </div>
                      <p className="font-semibold text-[9px] sm:text-[10px] text-white/90 truncate max-w-[65%] text-right">{formData.skills}</p>
                    </div>
                  )}
                  {formData.contactEmail && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-white/40">
                        <span className="material-symbols-outlined text-xs">alternate_email</span>
                        <span className="uppercase tracking-widest text-[7px] sm:text-[8px] font-bold">Email LH</span>
                      </div>
                      <p className="font-semibold text-[9px] sm:text-[10px] text-white/90 truncate max-w-[65%] text-right">{formData.contactEmail}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SLIDE 3: LINKS & TABS (Liên kết mở rộng) */}
        <section className="h-full min-h-[520px] w-full snap-start relative z-10 flex flex-col items-center justify-center p-4 shrink-0">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-lg pointer-events-none" />

          <div className="relative z-20 w-full space-y-4">
            <div className="text-center space-y-1">
              <h3 className="text-[8px] tracking-[0.3em] uppercase text-white/50 font-bold">Các Liên Kết</h3>
            </div>

            {/* Buttons List */}
            {formData.links && formData.links.length > 0 && (
              <div className="space-y-2 max-h-[160px] overflow-y-auto scrollbar-none">
                {formData.links.map((link, idx) => (
                  <div
                    key={idx}
                    className="block w-full py-2.5 px-4 text-center text-[10px] font-bold uppercase tracking-widest transition-all bg-white/10 text-white border border-white/10"
                    style={{ borderRadius: `${formData.theme.btnRadius || 12}px` }}
                  >
                    {link.label}
                  </div>
                ))}
              </div>
            )}

            {/* Tabs */}
            {formData.tabs && formData.tabs.length > 0 && (
              <div className="mt-4 space-y-3">
                <div className="relative bg-white/5 p-1 rounded-xl flex gap-1 border border-white/10 backdrop-blur-md">
                  {formData.tabs.map((tab, idx) => {
                    const isActive = activeBentoTab === idx;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSimActiveTab(idx);
                        }}
                        className={`flex-1 py-1.5 px-2 text-[7px] sm:text-[8px] uppercase font-bold tracking-widest rounded-lg transition-all duration-300 ${isActive
                            ? "bg-white text-black shadow-md scale-[1.02]"
                            : "text-white/50 hover:text-white/80 hover:bg-white/5"
                          }`}
                      >
                        {tab.title}
                      </button>
                    );
                  })}
                </div>
                {activeBentoTab !== null && formData.tabs[activeBentoTab] && (
                  <div className="relative p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl text-[8px] sm:text-[9px] text-white/90 leading-relaxed text-center shadow-2xl max-h-[100px] overflow-y-auto scrollbar-none animate-fadeIn">
                    <div className="absolute -top-12 -left-12 w-24 h-24 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                    <p className="relative z-10 font-medium tracking-wide">
                      {formData.tabs[activeBentoTab].content}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* SLIDE 3.5: PARTNER SERVICE IFRAME (Dịch Vụ Đối Tác) */}
        {data?.partnerIframe && (
          <section className="h-full min-h-[520px] w-full snap-start relative z-10 flex flex-col items-center justify-center p-4 shrink-0">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md pointer-events-none" />

            <div className="relative z-20 w-full flex flex-col h-full justify-center space-y-3 px-2">
              <div className="text-center space-y-1">
                <span className="text-[6px] bg-white/10 text-white/70 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border border-white/10">
                  Đối tác liên kết
                </span>
                <h3 className="text-[10px] tracking-[0.2em] uppercase text-white font-black mt-1">Dịch Vụ Đối Tác</h3>
              </div>

              {/* Iframe wrapper mimicking a mobile frame inside the simulator */}
              <div className="w-full flex-grow max-h-[320px] bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl p-0.5 relative flex flex-col">
                {/* Simulated browser bar */}
                <div className="bg-white/10 border-b border-white/5 px-2 py-1 flex items-center justify-between text-[7px] text-white/60 select-none shrink-0">
                  <div className="flex gap-1 shrink-0">
                    <span className="w-1 h-1 rounded-full bg-red-500/80" />
                    <span className="w-1 h-1 rounded-full bg-yellow-500/80" />
                    <span className="w-1 h-1 rounded-full bg-green-500/80" />
                  </div>
                  <div className="bg-black/40 px-2 py-0.5 rounded-full border border-white/10 truncate max-w-[120px] text-[6px] font-mono">
                    partner.hugostudio.vn
                  </div>
                  <span className="material-symbols-outlined text-[8px]">refresh</span>
                </div>

                {/* Iframe content container */}
                <div
                  className="flex-1 w-full bg-white text-black text-[10px] overflow-hidden rounded-b-xl"
                  dangerouslySetInnerHTML={{ __html: data.partnerIframe }}
                />
              </div>
            </div>
          </section>
        )}

        {/* SLIDE 4: HUGO STUDIO FOOTER */}
        <section className="h-full min-h-[520px] w-full snap-start relative z-10 flex flex-col items-center justify-center p-4 bg-[#09090b] text-white shrink-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.06)_0%,transparent_70%)] pointer-events-none" />

          <div className="relative z-20 w-full text-center space-y-4 max-w-[240px] mx-auto p-4 rounded-2xl bg-white/[0.01] border border-white/5 backdrop-blur-md">
            <div className="flex justify-center">
              <HugoStudioColoredBrandLogo className="text-sm font-black tracking-tight" />
            </div>
            <p className="text-[7px] tracking-[0.2em] font-medium text-white/40 uppercase">Professional Booking & Management</p>

            <div className="inline-block px-4 py-2 rounded-xl bg-white text-black text-[8px] font-bold uppercase tracking-widest we-bare-bears shadow-sm">
              Tạo ngay bio
            </div>

            <div className="pt-4 space-y-1.5 border-t border-white/5 mt-4">
              <p className="text-[6px] text-white/30 uppercase tracking-widest">Sản phẩm được phát triển bởi</p>
              <div className="flex justify-center items-center gap-1 font-display text-[8px] font-black tracking-[0.2em] uppercase text-white/80">
                <span>Hugo</span>
                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                <span>Portal</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  };

  if (loading) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center bg-[#f5f5f7] dark:bg-[#000000]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-[#0071e3] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-[10px] text-zinc-450 font-bold uppercase tracking-widest">Đang tải cấu hình Apple Portal...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f5f7] dark:bg-[#000000] text-[#1d1d1f] dark:text-[#f5f5f7] font-body selection:bg-[#0071e3]/20 transition-colors duration-300">


      {/* Toast Alert */}
      {toast.message && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/90 dark:bg-[#1c1c1e]/90 backdrop-blur-xl shadow-2xl border border-zinc-200/50 dark:border-zinc-800/80 w-[calc(100vw-32px)] max-w-md animate-toast-in">
          <span className={`material-symbols-outlined shrink-0 text-xl ${toast.type === "success" ? "text-[#34c759]" : toast.type === "warning" ? "text-[#ff9500]" : "text-[#ff3b30]"
            }`}>
            {toast.type === "success" ? "check_circle" : toast.type === "warning" ? "warning" : "error"}
          </span>
          <div className="flex-1 text-[11px] sm:text-xs font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] leading-relaxed">
            {toast.message}
          </div>
          <button
            type="button"
            onClick={() => setToast({ message: "", type: "" })}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-white shrink-0 transition-colors"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      )}

      {/* Decorative blurred spots (Apple Product Landing Style) */}
      <div className="absolute top-0 left-1/4 w-[40%] h-[400px] bg-gradient-to-br from-[#0071e3]/10 to-[#5856d6]/10 rounded-full filter blur-[120px] pointer-events-none opacity-40 dark:opacity-20" />
      <div className="absolute top-1/3 right-1/4 w-[35%] h-[350px] bg-gradient-to-br from-[#30b0c7]/10 to-[#34c759]/5 rounded-full filter blur-[100px] pointer-events-none opacity-30 dark:opacity-10" />

      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8 md:py-12 space-y-6 sm:space-y-8 relative z-10">

        {/* Dynamic iOS Segmented Navigation Header */}
        <section className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 md:gap-6 pb-3 sm:pb-4 border-b border-zinc-200/50 dark:border-zinc-800/30">
          <div className="flex justify-between items-start w-full md:w-auto">
            <div className="space-y-1 text-left">
              <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.2em] sm:tracking-[0.25em] text-[#0071e3] dark:text-[#0a84ff] block">
                {isGuestMode ? "CHẾ ĐỘ ĐỐI TÁC" : "BẢNG ĐIỀU KHIỂN SINH VIÊN"}
              </span>
              <h1 className="text-lg sm:text-2xl md:text-3xl font-bold tracking-tight text-black dark:text-white line-clamp-2">
                {isGuestMode ? "Thiết Kế Bio Link Của Bạn" : `Chào, ${memberSession?.displayName || "Bạn học"}`}
              </h1>
              <div className="text-[9px] sm:text-xs text-zinc-500 dark:text-zinc-400 flex flex-col sm:flex-row sm:items-center justify-start gap-1 mt-1 sm:mt-0.5">
                {isGuestMode ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider text-[8px] sm:text-[9px] bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/10 px-2 py-0.5 rounded-full">
                    <span className="material-symbols-outlined text-[10px] animate-pulse">local_activity</span>
                    Lưu trữ trực tiếp trên thiết bị của bạn
                  </span>
                ) : (
                  <p className="flex flex-col sm:flex-row sm:items-center gap-1">
                    <span className="hidden sm:inline">Hồ sơ học thuật:</span>
                    <strong className="text-zinc-700 dark:text-zinc-200 break-all text-[9px] sm:text-xs">{memberSession?.email}</strong>
                  </p>
                )}
              </div>
            </div>

            {/* Elegant Mobile logout button next to the title on small screens */}
            {!isGuestMode && (
              <button
                type="button"
                onClick={handleLogout}
                className="md:hidden w-8 h-8 rounded-full border border-red-200/50 dark:border-red-950/40 bg-red-500/5 flex items-center justify-center text-red-500 hover:text-red-600 active:bg-red-500/10 active:scale-95 transition-all shadow-sm shrink-0"
                title="Đăng xuất"
              >
                <span className="material-symbols-outlined text-sm">logout</span>
              </button>
            )}
          </div>

          {!isGuestMode && (
            <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
              {/* iOS Style Segmented Control */}
              <div className="relative bg-[#767680]/12 dark:bg-[#767680]/24 p-[3px] rounded-full flex w-full md:w-auto md:min-w-[340px] border border-zinc-200/20 dark:border-zinc-800/20 shadow-[inset_0_1px_1px_rgba(0,0,0,0.05)] shrink-0">
                <div
                  className="absolute top-[3px] bottom-[3px] bg-white dark:bg-[#636366] rounded-full shadow-sm transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]"
                  style={{
                    left: activeTab === "account"
                      ? "3px"
                      : activeTab === "manage"
                        ? "calc(33.33% + 1px)"
                        : "calc(66.66% + 1px)",
                    width: "calc(33.33% - 4px)"
                  }}
                />

                <button
                  type="button"
                  onClick={() => setActiveTab("account")}
                  className={`w-1/3 py-1.5 text-[9px] sm:text-[11px] font-semibold rounded-full relative z-10 transition-colors duration-200 ${activeTab === "account" ? "text-black dark:text-white font-bold" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800"
                    }`}
                >
                  Hồ sơ Bio
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("manage")}
                  className={`w-1/3 py-1.5 text-[9px] sm:text-[11px] font-semibold rounded-full relative z-10 transition-colors duration-200 ${activeTab === "manage" ? "text-black dark:text-white font-bold" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800"
                    }`}
                >
                  Gói dịch vụ
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("partner")}
                  className={`w-1/3 py-1.5 text-[9px] sm:text-[11px] font-semibold rounded-full relative z-10 transition-colors duration-200 ${activeTab === "partner" ? "text-black dark:text-white font-bold" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800"
                    }`}
                >
                  Đối tác
                </button>
              </div>

              {/* Desktop Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                className="hidden md:flex px-4 py-2 rounded-full border border-red-200 dark:border-red-900/30 bg-red-500/5 hover:bg-red-500/10 text-red-500 hover:text-red-600 dark:hover:text-red-400 items-center justify-center gap-1.5 text-[9px] sm:text-[11px] font-bold uppercase tracking-wider transition-all duration-200 shadow-sm shrink-0"
              >
                <span className="material-symbols-outlined text-xs sm:text-sm">logout</span>
                <span>Đăng xuất</span>
              </button>
            </div>
          )}
        </section>

        {/* Tab 1: Account / Profile Details */}
        {activeTab === "account" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 md:gap-8 items-start animate-fadeIn">

            {/* Left Content Area: iOS Form fields */}
            <div className="lg:col-span-7 space-y-4 sm:space-y-6">
              <form onSubmit={handleSave} className="space-y-6">

                {/* Section: Avatar Editor */}
                <div className="space-y-2 text-center py-4 bg-white dark:bg-[#1c1c1e] rounded-2xl border border-zinc-200/50 dark:border-zinc-800/60 shadow-sm">
                  <div
                    className="relative w-20 h-20 rounded-full border border-zinc-200 dark:border-zinc-800 shadow-md bg-zinc-100 dark:bg-zinc-900 mx-auto flex items-center justify-center overflow-hidden group cursor-pointer"
                    onClick={() => !saving && avatarInputRef.current.click()}
                  >
                    {formData.avatarUrl ? (
                      <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-850 text-zinc-400 dark:text-zinc-500">
                        <span className="material-symbols-outlined text-3xl">add_a_photo</span>
                      </div>
                    )}
                    {saving ? (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white z-20">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-[7px] mt-1 font-bold tracking-wider">UPLOADING...</span>
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[9px] font-bold z-20">
                        <span className="material-symbols-outlined text-sm">photo_camera</span>
                        <span>THAY ẢNH</span>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={avatarInputRef}
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                    disabled={saving}
                  />
                  <div className="space-y-1">
                    <p className="text-[10px] text-zinc-450 dark:text-zinc-400 font-bold uppercase tracking-wider">Ảnh Đại Diện Bio</p>
                    <p className="text-[8px] text-zinc-400">Được tự động nén nhẹ tối ưu dung lượng trước khi tải lên Cloudinary</p>
                    {formData.avatarUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        disabled={saving}
                        className="text-[9px] font-bold text-red-500 hover:text-red-650 transition-colors disabled:opacity-50"
                      >
                        Gỡ bỏ ảnh
                      </button>
                    )}
                  </div>
                </div>

                {/* Section A: Basic settings */}
                <div className="space-y-2">
                  <h3 className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest pl-4">THÔNG TIN CƠ BẢN</h3>

                  <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-zinc-200/50 dark:border-zinc-800/60 shadow-sm overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800/50">

                    {/* Display name */}
                    <div className="flex items-center gap-3 px-4 py-3 min-h-[50px]">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 bg-[#0071e3]">
                        <span className="material-symbols-outlined text-base">person</span>
                      </div>
                      <label className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider w-36 shrink-0">
                        Họ và Tên
                      </label>
                      <input
                        type="text"
                        name="displayName"
                        value={formData.displayName}
                        onChange={handleFieldChange}
                        required
                        placeholder="Họ tên của bạn..."
                        className="w-full bg-transparent text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-zinc-400 focus:outline-none text-xs sm:text-sm font-semibold"
                      />
                    </div>

                    {/* Headline */}
                    <div className="flex items-center gap-3 px-4 py-3 min-h-[50px]">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 bg-[#30b0c7]">
                        <span className="material-symbols-outlined text-base">badge</span>
                      </div>
                      <label className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider w-36 shrink-0">
                        Biệt danh
                      </label>
                      <input
                        type="text"
                        name="headline"
                        value={formData.headline}
                        onChange={handleFieldChange}
                        placeholder="Designer, Web Architect, Developer..."
                        className="w-full bg-transparent text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-zinc-400 focus:outline-none text-xs sm:text-sm font-semibold"
                      />
                    </div>

                    {/* Birthday */}
                    <div className="flex items-center gap-3 px-4 py-3 min-h-[50px]">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 bg-[#ff2d55]">
                        <span className="material-symbols-outlined text-base">cake</span>
                      </div>
                      <label className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider w-36 shrink-0">
                        Sinh Nhật
                      </label>
                      <input
                        type="text"
                        name="birthday"
                        value={formData.birthday}
                        onChange={handleFieldChange}
                        placeholder="Ví dụ: 20/10/2004..."
                        className="w-full bg-transparent text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-zinc-400 focus:outline-none text-xs sm:text-sm font-semibold"
                      />
                    </div>

                  </div>
                </div>

                {/* Section B: Contact settings */}
                <div className="space-y-2">
                  <h3 className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest pl-4">THÔNG TIN LIÊN HỆ</h3>

                  <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-zinc-200/50 dark:border-zinc-800/60 shadow-sm overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800/50">

                    {/* Read-only email */}
                    <div className="flex items-center gap-3 px-4 py-3 min-h-[50px] bg-zinc-50/50 dark:bg-zinc-900/10">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 bg-[#34c759]">
                        <span className="material-symbols-outlined text-base">mail</span>
                      </div>
                      <label className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider w-36 shrink-0">
                        Gmail
                      </label>
                      <div className="flex-1 flex flex-wrap justify-between items-center gap-2">
                        <span className="text-xs font-semibold text-zinc-500">
                          {memberSession?.email || "-"}
                        </span>
                        <div className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#34c759]/10 border border-[#34c759]/20 text-[9px] font-bold text-[#34c759] shrink-0">
                          <span className="material-symbols-outlined text-[10px]">verified</span>
                          Student verified
                        </div>
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="flex items-center gap-3 px-4 py-3 min-h-[50px]">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 bg-[#34c759]">
                        <span className="material-symbols-outlined text-base">phone</span>
                      </div>
                      <label className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider w-36 shrink-0">
                        Số điện thoại
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleFieldChange}
                        placeholder="Số điện thoại dùng liên hệ..."
                        className="w-full bg-transparent text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-zinc-400 focus:outline-none text-xs sm:text-sm font-semibold"
                      />
                    </div>

                    {/* Contact Email */}
                    <div className="flex items-center gap-3 px-4 py-3 min-h-[50px]">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 bg-[#0071e3]">
                        <span className="material-symbols-outlined text-base">alternate_email</span>
                      </div>
                      <label className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider w-36 shrink-0">
                        Email liên hệ
                      </label>
                      <input
                        type="email"
                        name="contactEmail"
                        value={formData.contactEmail}
                        onChange={handleFieldChange}
                        placeholder="Email hợp tác/công việc..."
                        className="w-full bg-transparent text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-zinc-400 focus:outline-none text-xs sm:text-sm font-semibold"
                      />
                    </div>

                  </div>
                </div>

                {/* Section C: Portfolio & Education */}
                <div className="space-y-2">
                  <h3 className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest pl-4">HỌC VẤN & SỰ NGHIỆP</h3>
                  <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-zinc-200/50 dark:border-zinc-800/60 shadow-sm overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800/50">

                    {/* Job Title */}
                    <div className="flex items-center gap-3 px-4 py-3 min-h-[50px]">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 bg-[#af52de]">
                        <span className="material-symbols-outlined text-base">work</span>
                      </div>
                      <label className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider w-36 shrink-0">
                        Vai trò / Công việc
                      </label>
                      <input
                        type="text"
                        name="jobTitle"
                        value={formData.jobTitle}
                        onChange={handleFieldChange}
                        placeholder="Ví dụ: Photographer, UI/UX Designer..."
                        className="w-full bg-transparent text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-zinc-400 focus:outline-none text-xs sm:text-sm font-semibold"
                      />
                    </div>

                    {/* Education */}
                    <div className="flex items-center gap-3 px-4 py-3 min-h-[50px]">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 bg-[#ff9500]">
                        <span className="material-symbols-outlined text-base">school</span>
                      </div>
                      <label className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider w-36 shrink-0">
                        Học vấn / Trường học
                      </label>
                      <input
                        type="text"
                        name="education"
                        value={formData.education}
                        onChange={handleFieldChange}
                        placeholder="Ví dụ: Đại học Ngoại Thương..."
                        className="w-full bg-transparent text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-zinc-400 focus:outline-none text-xs sm:text-sm font-semibold"
                      />
                    </div>

                    {/* Skills */}
                    <div className="flex items-center gap-3 px-4 py-3 min-h-[50px]">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 bg-[#34c759]">
                        <span className="material-symbols-outlined text-base">psychology</span>
                      </div>
                      <label className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider w-36 shrink-0">
                        Kỹ năng chuyên môn
                      </label>
                      <input
                        type="text"
                        name="skills"
                        value={formData.skills}
                        onChange={handleFieldChange}
                        placeholder="Ví dụ: Photoshop, React, Figma..."
                        className="w-full bg-transparent text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-zinc-400 focus:outline-none text-xs sm:text-sm font-semibold"
                      />
                    </div>

                  </div>
                </div>

                {/* Section D: Body Measurements & Location */}
                <div className="space-y-2">
                  <h3 className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest pl-4">HÌNH THỂ & ĐỊA ĐIỂM</h3>
                  <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-zinc-200/50 dark:border-zinc-800/60 shadow-sm overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800/50">

                    {/* Height */}
                    <div className="flex items-center gap-3 px-4 py-3 min-h-[50px]">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 bg-[#ff3b30]">
                        <span className="material-symbols-outlined text-base">height</span>
                      </div>
                      <label className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider w-36 shrink-0">
                        Chiều cao
                      </label>
                      <input
                        type="text"
                        name="height"
                        value={formData.height}
                        onChange={handleFieldChange}
                        placeholder="Ví dụ: 1m75..."
                        className="w-full bg-transparent text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-zinc-400 focus:outline-none text-xs sm:text-sm font-semibold"
                      />
                    </div>

                    {/* Weight */}
                    <div className="flex items-center gap-3 px-4 py-3 min-h-[50px]">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 bg-[#4cd964]">
                        <span className="material-symbols-outlined text-base">monitor_weight</span>
                      </div>
                      <label className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider w-36 shrink-0">
                        Cân nặng
                      </label>
                      <input
                        type="text"
                        name="weight"
                        value={formData.weight}
                        onChange={handleFieldChange}
                        placeholder="Ví dụ: 65kg..."
                        className="w-full bg-transparent text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-zinc-400 focus:outline-none text-xs sm:text-sm font-semibold"
                      />
                    </div>

                    {/* Measurements */}
                    <div className="flex items-center gap-3 px-4 py-3 min-h-[50px]">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 bg-[#5856d6]">
                        <span className="material-symbols-outlined text-base">straighten</span>
                      </div>
                      <label className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider w-36 shrink-0">
                        Số đo
                      </label>
                      <input
                        type="text"
                        name="measurements"
                        value={formData.measurements}
                        onChange={handleFieldChange}
                        placeholder="Ví dụ: 90-60-90..."
                        className="w-full bg-transparent text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-zinc-400 focus:outline-none text-xs sm:text-sm font-semibold"
                      />
                    </div>

                    {/* Address */}
                    <div className="flex items-center gap-3 px-4 py-3 min-h-[50px]">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 bg-[#0071e3]">
                        <span className="material-symbols-outlined text-base">distance</span>
                      </div>
                      <label className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider w-36 shrink-0">
                        Khu vực
                      </label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleFieldChange}
                        placeholder="Ví dụ: Quận 1, TP. HCM..."
                        className="w-full bg-transparent text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-zinc-400 focus:outline-none text-xs sm:text-sm font-semibold"
                      />
                    </div>

                  </div>
                </div>

                {/* Section E: Biography and Hobbies */}
                <div className="space-y-2">
                  <h3 className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest pl-4">THÔNG TIN KHÁC</h3>

                  <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-zinc-200/50 dark:border-zinc-800/60 shadow-sm overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800/50">

                    {/* Hobbies */}
                    <div className="flex items-center gap-3 px-4 py-3 min-h-[50px]">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 bg-[#5856d6]">
                        <span className="material-symbols-outlined text-base">star</span>
                      </div>
                      <label className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider w-36 shrink-0">
                        Sở thích
                      </label>
                      <input
                        type="text"
                        name="hobbies"
                        value={formData.hobbies}
                        onChange={handleFieldChange}
                        placeholder="Ngăn cách bằng dấu phẩy: Lập Trình, Vẽ Tranh, Chụp Ảnh..."
                        className="w-full bg-transparent text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-zinc-400 focus:outline-none text-xs sm:text-sm font-semibold"
                      />
                    </div>

                    {/* Bio text (vertical on cell, left/right on md) */}
                    <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-3 px-4 py-3 min-h-[70px]">
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 bg-[#8e8e93]">
                          <span className="material-symbols-outlined text-base">edit_note</span>
                        </div>
                        <label className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider w-36 shrink-0 md:w-36">
                          Mô tả
                        </label>
                      </div>
                      <div className="flex-grow flex flex-col w-full">
                        <textarea
                          ref={bioTextareaRef}
                          name="bio"
                          value={formData.bio}
                          onChange={handleFieldChange}
                          placeholder="Viết một vài dòng giới thiệu bản thân của bạn..."
                          className="w-full bg-transparent text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-zinc-400 focus:outline-none text-xs sm:text-sm font-semibold resize-none leading-relaxed mt-1 md:mt-0 overflow-hidden"
                        />
                        <div className="flex justify-end text-[9px] font-bold text-zinc-400 dark:text-zinc-500 mt-1 select-none pr-2">
                          {formData.bio ? formData.bio.trim().split(/\s+/).filter(Boolean).length : 0} / 110 chữ
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Section D: Social Network Links */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-4">
                    <h3 className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest">LIÊN KẾT MẠNG XÃ HỘI</h3>
                    <span className="text-[9px] font-semibold text-zinc-400">Tự động lưu khi thêm/xóa</span>
                  </div>

                  <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-zinc-200/50 dark:border-zinc-800/60 shadow-sm p-4 space-y-4">

                    {formData.links.length > 0 ? (
                      <div className="space-y-2">
                        {formData.links.map((link, idx) => {
                          const brand = getSocialBrandStyle(link.label);
                          return (
                            <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/40 dark:border-zinc-800/40 text-xs transition-all hover:border-zinc-300 dark:hover:border-zinc-700">
                              <div className="flex items-center gap-2 truncate pr-2">
                                <span className={`material-symbols-outlined text-base shrink-0 ${brand ? "text-[#0071e3]" : "text-zinc-450"
                                  }`}>
                                  {brand ? brand.icon : "link"}
                                </span>
                                <span className="font-bold text-zinc-800 dark:text-zinc-200 shrink-0">{link.label}:</span>
                                <span className="text-zinc-450 truncate text-[11px] font-medium">{link.url}</span>
                              </div>

                              <button
                                type="button"
                                onClick={() => removeSocialLink(idx)}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-[#ff3b30] hover:bg-[#ff3b30]/10 transition-colors shrink-0"
                              >
                                <span className="material-symbols-outlined text-base">remove_circle</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-6 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                        <span className="material-symbols-outlined text-2xl text-zinc-300">link_off</span>
                        <p className="text-[11px] italic text-zinc-400 mt-1">Chưa có liên kết xã hội nào.</p>
                      </div>
                    )}

                    {/* Add new link input rows */}
                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/50 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-zinc-450 uppercase pl-1">Nhãn liên kết</label>
                          <input
                            type="text"
                            value={newLinkLabel}
                            onKeyDown={handleLinkInputKeyDown}
                            onChange={(e) => setNewLinkLabel(e.target.value)}
                            placeholder="Ví dụ: Facebook, Github..."
                            className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-[#1d1d1f] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0071e3] text-xs font-semibold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-zinc-450 uppercase pl-1">Địa chỉ URL</label>
                          <input
                            type="text"
                            value={newLinkUrl}
                            onKeyDown={handleLinkInputKeyDown}
                            onChange={(e) => setNewLinkUrl(e.target.value)}
                            placeholder="Ví dụ: https://facebook.com/..."
                            className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-[#1d1d1f] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0071e3] text-xs font-semibold"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={addSocialLink}
                        className="w-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1 shadow-sm"
                      >
                        <span className="material-symbols-outlined text-sm">add</span>
                        Thêm liên kết
                      </button>
                    </div>

                  </div>
                </div>

                {/* Submit save button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-black dark:bg-white text-white dark:text-black hover:opacity-90 font-bold py-3.5 rounded-2xl transition-all shadow-md text-xs sm:text-sm flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin" />
                        <span>Đang xử lý...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-base">cloud_sync</span>
                        <span>{bio ? "Cập Nhật Hồ Sơ & Bio" : "Kích hoạt & Lưu hồ sơ"}</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            </div>

            {/* Right Sticky Preview Area - Account Tab */}
            <div className="lg:col-span-5 lg:sticky lg:top-6 flex flex-col items-center space-y-3 sm:space-y-4 w-full">
              <div className="flex items-center gap-2 sm:gap-3 w-full justify-center sm:justify-start">
                <span className="text-[8px] sm:text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest">XEM TRƯỚC LIVE</span>
                <div className="flex bg-[#767680]/10 dark:bg-[#767680]/20 p-0.5 rounded-full border border-zinc-200/10 dark:border-zinc-800/10 shadow-[inset_0_1px_1px_rgba(0,0,0,0.05)]">
                  <button
                    type="button"
                    onClick={() => setPreviewMode("mobile")}
                    className={`px-2 sm:px-3 py-1 rounded-full text-[8px] sm:text-[9px] font-bold flex items-center gap-0.5 sm:gap-1 transition-all ${previewMode === "mobile" ? "bg-white dark:bg-[#636366] text-black dark:text-white shadow-sm" : "text-zinc-500"
                      }`}
                  >
                    <span className="material-symbols-outlined text-xs">phone_iphone</span>
                    <span className="hidden sm:inline">Mobile</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode("desktop")}
                    className={`px-2 sm:px-3 py-1 rounded-full text-[8px] sm:text-[9px] font-bold flex items-center gap-0.5 sm:gap-1 transition-all ${previewMode === "desktop" ? "bg-white dark:bg-[#636366] text-black dark:text-white shadow-sm" : "text-zinc-500"
                      }`}
                  >
                    <span className="material-symbols-outlined text-xs">laptop</span>
                    <span className="hidden sm:inline">Desktop</span>
                  </button>
                </div>
              </div>

              {/* Dynamic device simulator viewport */}
              <div className={`transition-all duration-300 w-full flex justify-center ${previewMode === "mobile"
                  ? "max-w-[280px] sm:max-w-[295px]"
                  : "max-w-[440px]"
                }`}>
                <div className={`${previewMode === "mobile"
                    ? "w-[280px] sm:w-[295px] h-[580px] sm:h-[610px] rounded-[2.5rem] sm:rounded-[3rem] border-[6px] sm:border-[8px] border-zinc-950 dark:border-zinc-800 bg-black shadow-2xl p-1.5 sm:p-2 relative flex flex-col justify-between"
                    : "w-full h-[580px] sm:h-[610px] rounded-2xl sm:rounded-3xl border-2 sm:border-4 border-zinc-200 dark:border-zinc-800 bg-[#f5f5f7] dark:bg-zinc-950 shadow-2xl p-0.5 sm:p-1 relative flex flex-col justify-between"
                  }`}>
                  {/* Dynamic Island for mobile preview */}
                  {previewMode === "mobile" && (
                    <div className="absolute top-3 sm:top-4 left-1/2 -translate-x-1/2 w-16 sm:w-20 h-3 sm:h-4 bg-black rounded-full z-30 flex items-center justify-center shadow-inner" />
                  )}

                  <div className={`w-full h-full rounded-[1.8rem] sm:rounded-[2.3rem] overflow-hidden bg-white dark:bg-[#09090b] relative flex flex-col border border-zinc-900/10 dark:border-zinc-800/10`}>

                    {/* Simulated Safari URL Bar */}
                    <div className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200/50 dark:border-zinc-800/60 px-3 py-2 flex items-center justify-between text-[9px] text-zinc-450 select-none shrink-0">
                      <div className="flex gap-1 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      </div>
                      <div className="bg-white dark:bg-black px-2.5 py-0.5 rounded-full border border-zinc-200/40 dark:border-zinc-800/60 truncate max-w-[150px] text-[8px] font-mono">
                        {bio?.slug ? `bio.hugostudio.vn/${bio.slug}` : "chua-kich-hoat-slug"}
                      </div>
                      <span className="material-symbols-outlined text-[10px]">refresh</span>
                    </div>

                    {/* Simulator Screen Content */}
                    <div className="flex-1 relative overflow-hidden bg-black">
                      {renderSimulatedLayout()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Package Subscription & Link Management */}
        {activeTab === "manage" && (
          <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6 px-3 sm:px-0 animate-fadeIn">

            {/* Wallet-style iCloud Membership Card */}
            <div className="relative overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] bg-gradient-to-tr from-[#0071e3] via-[#3a39e0] to-[#5856d6] text-white p-4 sm:p-6 md:p-8 shadow-2xl flex flex-col justify-between h-[180px] sm:h-[230px]">
              {/* Glass reflection layer */}
              <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px] pointer-events-none" />
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex justify-between items-start relative z-10">
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-[#00f2fe] font-black uppercase text-[8px] sm:text-[10px] tracking-[0.15em] sm:tracking-[0.2em]">
                    <span className="material-symbols-outlined text-xs">school</span>
                    STUDENT BIO
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold tracking-tight">Student Bio</h3>
                </div>

                <span className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[9px] font-bold uppercase tracking-wider">
                  Active
                </span>
              </div>

              <div className="space-y-1 relative z-10 mt-auto">
                <div className="text-[8px] sm:text-[9px] opacity-60 uppercase tracking-widest">Thời hạn sử dụng</div>
                <div className="flex items-end justify-between flex-wrap gap-2">
                  <div className="text-xs sm:text-sm font-semibold flex items-center gap-1 sm:gap-3">
                    <div>
                      <span className="text-[8px] sm:text-[9px] block opacity-40">Bắt đầu</span>
                      <span className="text-xs sm:text-sm">{startLabel}</span>
                    </div>
                    <span className="opacity-30">/</span>
                    <div>
                      <span className="text-[8px] sm:text-[9px] block opacity-40">Hết hạn</span>
                      <span className="text-red-300 font-bold text-xs sm:text-sm">{expiresLabel}</span>
                    </div>
                  </div>
                  <div className="font-display font-black text-[9px] sm:text-sm tracking-widest opacity-80">HUGO</div>
                </div>
              </div>
            </div>

            {/* Detailed Package Info Card */}
            <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-zinc-200/50 dark:border-zinc-800/60 shadow-sm p-5 space-y-4">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-zinc-800 dark:text-white uppercase tracking-wider pl-1">Quyền lợi dịch vụ Student Bio</h4>
                <p className="text-[10px] text-zinc-400 pl-1">Các tính năng đi kèm trong gói dịch vụ hiện tại được cung cấp bởi Hugo Studio.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <div className="flex gap-2.5 items-start p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/30 dark:border-zinc-850/40">
                  <span className="material-symbols-outlined text-[#34c759] text-base shrink-0">update</span>
                  <div>
                    <h5 className="text-[11px] font-bold text-zinc-800 dark:text-zinc-250 uppercase">Thời Hạn 12 Tháng</h5>
                    <p className="text-[10px] text-zinc-450 dark:text-zinc-500 leading-relaxed mt-0.5">Sử dụng bio link hoàn toàn miễn phí trong vòng 1 năm kể từ thời điểm kích hoạt.</p>
                  </div>
                </div>

                <div className="flex gap-2.5 items-start p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/30 dark:border-zinc-850/40">
                  <span className="material-symbols-outlined text-[#0071e3] text-base shrink-0">edit_attributes</span>
                  <div>
                    <h5 className="text-[11px] font-bold text-zinc-800 dark:text-zinc-250 uppercase">Tùy Biến Không Giới Hạn</h5>
                    <p className="text-[10px] text-zinc-450 dark:text-zinc-500 leading-relaxed mt-0.5">Tự do chỉnh sửa thông tin cá nhân, hình ảnh đại diện, số đo hình thể và các liên kết xã hội.</p>
                  </div>
                </div>

                <div className="flex gap-2.5 items-start p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/30 dark:border-zinc-850/40">
                  <span className="material-symbols-outlined text-[#af52de] text-base shrink-0">grid_view</span>
                  <div>
                    <h5 className="text-[11px] font-bold text-zinc-800 dark:text-zinc-250 uppercase">Bento Tabs slide 3</h5>
                    <p className="text-[10px] text-zinc-450 dark:text-zinc-500 leading-relaxed mt-0.5">Hỗ trợ hiển thị nội dung tùy chỉnh linh hoạt (Dự án, Sở thích, Blog...) qua Bento tabs slide 3.</p>
                  </div>
                </div>

                <div className="flex gap-2.5 items-start p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/30 dark:border-zinc-850/40">
                  <span className="material-symbols-outlined text-[#ff9500] text-base shrink-0">speed</span>
                  <div>
                    <h5 className="text-[11px] font-bold text-zinc-800 dark:text-zinc-250 uppercase">Tải Trang Tối Ưu</h5>
                    <p className="text-[10px] text-zinc-450 dark:text-zinc-500 leading-relaxed mt-0.5">Mã nguồn tối giản giúp trang cá nhân tải siêu nhanh, mang lại trải nghiệm mượt mà nhất.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Public Link Card: Styled like Safari Search Capsule */}
            <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-zinc-200/50 dark:border-zinc-800/60 shadow-sm p-5 space-y-4">
              <div className="space-y-1 text-center md:text-left">
                <h4 className="text-xs font-bold text-zinc-800 dark:text-white uppercase tracking-wider pl-1">LIÊN KẾT BIO CỦA BẠN</h4>
                <p className="text-[10px] text-zinc-400 pl-1">Chia sẻ đường dẫn này lên tiểu sử các nền tảng mạng xã hội của bạn.</p>
              </div>

              {bio?.slug ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 font-mono text-xs text-[#0071e3] font-bold break-all select-all shadow-inner">
                    <span className="material-symbols-outlined text-base text-zinc-400 shrink-0">public</span>
                    <span className="flex-1">{publicLink}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <a
                      href={publicLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-black dark:bg-white text-white dark:text-black hover:opacity-90 font-bold py-2.5 rounded-xl transition-all text-center text-xs shadow-md flex items-center justify-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">open_in_new</span>
                      Xem Trang Live
                    </a>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="bg-zinc-200/60 hover:bg-zinc-250 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 text-black dark:text-white font-bold py-2.5 rounded-xl transition-all text-xs flex items-center justify-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">content_copy</span>
                      Copy Link
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                  <span className="material-symbols-outlined text-2xl text-zinc-300">link_off</span>
                  <p className="text-[11px] italic text-zinc-400 mt-1">Bạn chưa kích hoạt thiết kế Bio. Hãy hoàn thành tại tab "Cài đặt Bio" để nhận link.</p>
                </div>
              )}
            </div>

            {/* Warning Danger Zone */}
            {bio?._id && (
              <div className="bg-red-500/5 dark:bg-red-950/10 border border-red-200/40 dark:border-red-900/30 p-5 rounded-2xl shadow-sm space-y-4">
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 bg-[#ff3b30]">
                    <span className="material-symbols-outlined text-base">warning</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-800 dark:text-white">GỠ BỎ DỊCH VỤ BIO</h4>
                    <p className="text-[10px] text-zinc-450 dark:text-zinc-400 mt-0.5 leading-relaxed">Xóa vĩnh viễn trang Bio Link và thu hồi tên miền riêng của bạn lập tức. Bạn không thể hoàn tác thao tác này.</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDeleteBio}
                  disabled={saving}
                  className="w-full bg-[#ff3b30] hover:bg-[#ff3b30]/90 text-white font-bold py-2.5 rounded-xl transition-all text-xs shadow-sm flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">delete_forever</span>
                  Xóa Bio Cá Nhân
                </button>
              </div>
            )}

          </div>
        )}

        {/* Tab 4: Partner Iframe Services inside Member Portal */}
        {activeTab === "partner" && (
          <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 px-3 sm:px-0 animate-fadeIn">
            <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl p-4 sm:p-6 md:p-8 border border-zinc-200/50 dark:border-zinc-800/80 shadow-xl flex flex-col justify-between min-h-[500px]">

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-zinc-200/50 dark:border-zinc-800/50 pb-4 shrink-0">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-black dark:text-white flex items-center gap-2">
                    Dịch Vụ Đối Tác Liên Kết
                  </h3>
                  <p className="text-[9px] sm:text-xs text-zinc-450 mt-1">Sử dụng dịch vụ của đối tác trực tiếp từ bảng điều khiển của bạn</p>
                </div>

                <span className="text-[8px] bg-zinc-100 dark:bg-zinc-800 text-zinc-550 dark:text-zinc-400 px-3 py-1.5 rounded-full font-bold uppercase tracking-wider border border-zinc-250/20">
                  partner.hugowishpax.studio
                </span>
              </div>

              {/* Multi-Partner list */}
              {partners.length > 0 ? (
                <div className="flex flex-col flex-grow mt-4 gap-4">

                  {/* Search and Page Stats */}
                  <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                    {/* Search Field */}
                    <div className="relative flex-grow max-w-sm">
                      <input
                        type="text"
                        placeholder="Tìm kiếm đối tác liên kết..."
                        value={partnerSearch}
                        onChange={(e) => { setPartnerSearch(e.target.value); setPartnerPage(1); }}
                        className="w-full rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs py-2 pl-9 pr-4 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white font-medium"
                      />
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">search</span>
                    </div>

                    {/* Pagination Indicator */}
                    {totalPartnerPages > 1 && (
                      <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-450 uppercase tracking-wider select-none">
                        <button
                          onClick={() => setPartnerPage(p => Math.max(p - 1, 1))}
                          disabled={partnerPage === 1}
                          className="p-1 rounded bg-zinc-105 hover:bg-zinc-200 dark:bg-zinc-800 disabled:opacity-40 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[10px] leading-none">chevron_left</span>
                        </button>
                        <span>Trang {partnerPage} / {totalPartnerPages}</span>
                        <button
                          onClick={() => setPartnerPage(p => Math.min(p + 1, totalPartnerPages))}
                          disabled={partnerPage === totalPartnerPages}
                          className="p-1 rounded bg-zinc-105 hover:bg-zinc-200 dark:bg-zinc-800 disabled:opacity-40 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[10px] leading-none">chevron_right</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Selector Pills */}
                  {paginatedPartners.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pb-2 border-b border-zinc-150 dark:border-zinc-800">
                      {paginatedPartners.map((p) => {
                        let domain = "google.com";
                        try {
                          let url = p.iframeUrl;
                          if (url.includes('<iframe')) {
                            const match = url.match(/src=["']([^"']+)["']/);
                            if (match) url = match[1];
                          }
                          domain = new URL(url).hostname;
                        } catch (e) { }
                        const faviconUrl = `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;

                        return (
                          <button
                            key={p._id}
                            onClick={() => setSelectedPartner(p)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${selectedPartner?._id === p._id
                                ? "bg-black text-white dark:bg-white dark:text-black shadow-sm"
                                : "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 text-zinc-650 dark:text-zinc-300"
                              }`}
                          >
                            <img
                              src={faviconUrl}
                              alt=""
                              onError={(e) => { e.target.style.display = 'none'; }}
                              className="w-4 h-4 rounded-sm object-contain"
                            />
                            <span>{p.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-zinc-400 text-xs italic border-b border-zinc-150 dark:border-zinc-800">
                      Không tìm thấy đối tác nào phù hợp.
                    </div>
                  )}

                  {/* Selected Iframe Viewport Container */}
                  {selectedPartner && paginatedPartners.some(p => p._id === selectedPartner._id) && (
                    <div className="flex-grow w-full bg-white text-black rounded-2xl overflow-hidden min-h-[450px] border border-zinc-200/60 dark:border-zinc-800/80 relative z-10 shadow-inner">
                      {selectedPartner.iframeUrl.includes('<iframe') ? (
                        <div
                          className="w-full h-full min-h-[450px] flex [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:min-h-[450px]"
                          dangerouslySetInnerHTML={{ __html: selectedPartner.iframeUrl }}
                        />
                      ) : (
                        <iframe
                          src={selectedPartner.iframeUrl}
                          className="w-full h-full min-h-[450px]"
                          style={{ border: 'none' }}
                          allowFullScreen
                        />
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-grow flex flex-col items-center justify-center text-center p-8 space-y-3">
                  <span className="material-symbols-outlined text-4xl text-zinc-400">handshake</span>
                  <h4 className="text-xs font-bold text-zinc-550 dark:text-zinc-400">Không Có Dịch Vụ Đối Tác Kích Hoạt</h4>
                  <p className="text-[10px] text-zinc-400 max-w-sm">Hiện tại chúng tôi chưa thiết lập hoặc liên kết dịch vụ đối tác nào. Vui lòng quay lại sau.</p>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Cropper Modal */}
        {cropModal.isOpen && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-[#1c1c1e] w-full max-w-sm rounded-3xl border border-zinc-200/50 dark:border-zinc-800/60 shadow-2xl p-6 text-center space-y-6">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Cắt ảnh đại diện</h3>
                <p className="text-[10px] text-zinc-450 dark:text-zinc-400">Kéo thả để di chuyển, dùng thanh trượt để phóng to/thu nhỏ</p>
              </div>

              {/* Circular Crop Frame container */}
              <div
                className="w-48 h-48 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-800 relative bg-zinc-950 mx-auto cursor-move select-none shadow-inner"
                style={{ touchAction: 'none' }}
                onMouseDown={handleDragStart}
                onMouseMove={handleDragMove}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
                onTouchStart={handleDragStart}
                onTouchMove={handleDragMove}
                onTouchEnd={handleDragEnd}
              >
                <img
                  src={cropModal.imageSrc}
                  alt="To Crop"
                  className="absolute pointer-events-none origin-center"
                  style={{
                    transform: `translate(${cropModal.offset.x}px, ${cropModal.offset.y}px) scale(${cropModal.zoom})`,
                    left: '50%',
                    top: '50%',
                    marginLeft: '-96px',
                    marginTop: `-${((192 / (cropModal.aspect || 1)) / 2)}px`,
                    maxWidth: 'none',
                    width: '192px',
                  }}
                />
              </div>

              {/* Zoom Slider */}
              <div className="space-y-2 px-4">
                <div className="flex justify-between text-[10px] text-zinc-450 dark:text-zinc-400 font-bold">
                  <span>Thu nhỏ</span>
                  <span>Phóng to</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.05"
                  value={cropModal.zoom}
                  onChange={(e) => setCropModal((prev) => ({ ...prev, zoom: parseFloat(e.target.value) }))}
                  className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#0071e3]"
                />
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCropModal({ isOpen: false, imageSrc: null, zoom: 1, aspect: 1, offset: { x: 0, y: 0 } })}
                  className="py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-[11px] font-bold text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors"
                >
                  HỦY
                </button>
                <button
                  type="button"
                  onClick={handleCropSave}
                  className="py-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-[11px] font-bold shadow-md transition-colors"
                >
                  CẮT & LƯU
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
