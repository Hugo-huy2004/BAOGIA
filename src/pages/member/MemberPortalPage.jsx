import { useTranslation } from "react-i18next";
import React, { useEffect, useMemo, useState, useRef } from "react";
import { getMemberSession, logoutAuth } from "../../services/authSession";
import dataApi from "../../services/dataApi";
import ErrorBoundary from "../../components/ErrorBoundary";
import { optimizeCloudinaryUrl } from "../../utils/imageOptimizer";
import OptimizedInput from "../../components/common/OptimizedInput";
import OptimizedTextarea from "../../components/common/OptimizedTextarea";

const MemberProjectsTab = React.lazy(() => import("../../components/member/MemberProjectsTab"));
const MemberServicesTab = React.lazy(() => import("../../components/member/MemberServicesTab"));
const MemberHistoryTab = React.lazy(() => import("../../components/member/MemberHistoryTab"));
const MemberManageTab = React.lazy(() => import("../../components/member/MemberManageTab"));
const MemberPartnerTab = React.lazy(() => import("../../components/member/MemberPartnerTab"));
const MemberUtilitiesTab = React.lazy(() => import("../../components/member/MemberUtilitiesTab"));

// Hugo Studio Brand Logo component to match styling exactly

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



const getBasePackageDetails = (serviceLabel) => {
  const label = serviceLabel || "Student Bio";
  if (label.toLowerCase().includes("signature")) {
    return {
      name: "Signature Portfolio",
      color: "#6366f1",
      benefits: [
        "Thời Hạn 12 Tháng: Sử dụng bio link hoàn toàn miễn phí trong vòng 1 năm kể từ thời điểm kích hoạt.",
        "Thiết Kế Độc Bản Portfolio: Thể hiện cá tính chuyên nghiệp thông qua thiết kế Portfolio tinh tế.",
        "Bố Cục Tối Ưu UX/UI: Giúp các đối tác và khách hàng dễ dàng tương tác và nắm bắt thông tin.",
        "Tốc Độ Siêu Tốc: Trang bio tải tức thì nhờ kiến trúc tối giản và công nghệ tối ưu hóa tài nguyên hình ảnh."
      ]
    };
  }
  if (label.toLowerCase().includes("ultimate")) {
    return {
      name: "Ultimate Web App",
      color: "#ec4899",
      benefits: [
        "Thời Hạn 12 Tháng: Sử dụng bio link hoàn toàn miễn phí trong vòng 1 năm kể từ thời điểm kích hoạt.",
        "Trải Nghiệm Web App Đỉnh Cao: Biến Bio Link thành một ứng dụng web thực thụ mượt mà.",
        "Bố Cục Tối Ưu UX/UI: Giúp các đối tác và khách hàng dễ dàng tương tác và nắm bắt thông tin.",
        "Tốc Độ Siêu Tốc: Trang bio tải tức thì nhờ kiến trúc tối giản và công nghệ tối ưu hóa tài nguyên hình ảnh."
      ]
    };
  }
  if (label.toLowerCase().includes("student")) {
    return {
      name: "Student Bio",
      color: "#0071e3",
      benefits: [
        "Thời Hạn 12 Tháng: Sử dụng bio link hoàn toàn miễn phí trong vòng 1 năm kể từ thời điểm kích hoạt.",
        "3 Giao Diện Độc Bản: Lựa chọn các mẫu giao diện Classic thanh lịch, Brutalism cá tính hoặc Flat Design đa sắc màu.",
        "Tốc Độ Siêu Tốc: Trang bio tải tức thì nhờ kiến trúc tối giản và công nghệ tối ưu hóa tài nguyên hình ảnh.",
        "Không Giới Hạn Kết Nối: Chia sẻ tối đa 5 liên kết mạng xã hội chính của bạn giúp tiếp cận khách hàng tối ưu nhất."
      ]
    };
  }
  return {
    name: "Free Bio",
    color: "#64748b",
    benefits: [
      "Thời Hạn 12 Tháng: Sử dụng bio link hoàn toàn miễn phí trong vòng 1 năm kể từ thời điểm kích hoạt.",
      "Classic Profile Layout: Bố cục Bio Link truyền thống, đơn giản, sạch sẽ và dễ đọc.",
      "Không Quảng Cáo Rác: Cam kết giao diện sạch sẽ, thân thiện và tối ưu nhất cho người xem."
    ]
  };
};

const PackageCard = React.memo(function PackageCard({ name, duration, durationUnit, benefits, color, startLabel, expiresLabel, isBasePackage = false }) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(false);
  const formattedBenefits = benefits || [];

  return (
    <div className="space-y-3">
      {/* Wallet-style iCloud Membership Card */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          background: `linear-gradient(135deg, ${color} 0%, #1c1c24 60%, #111115 100%)`,
          borderColor: `${color}40`
        }}
        className="relative overflow-hidden rounded-[24px] text-white p-6 sm:p-8 border shadow-[0_24px_50px_rgba(0,0,0,0.3)] flex flex-col justify-between h-[200px] sm:h-[245px] group transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_24px_60px_rgba(0,0,0,0.4)] cursor-pointer select-none"
      >
        {/* Premium metallic mesh overlay */}
        <div 
          className="absolute inset-0 opacity-40 pointer-events-none" 
          style={{ backgroundImage: `radial-gradient(circle at 80% 20%, ${color}20 0%, transparent 80%)` }}
        />
        <div className="absolute -bottom-20 -left-20 w-52 h-52 bg-white/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

        <div className="flex justify-between items-start relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-white/60 font-black uppercase text-[9px] tracking-[0.25em]">
              <span className="material-symbols-outlined text-xs">workspace_premium</span>
              {isBasePackage ? t("memberPortal.package.base") : t("memberPortal.package.promo")}
            </div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight uppercase bg-gradient-to-r from-white via-zinc-150 to-zinc-400 bg-clip-text text-transparent">{name}</h3>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-white">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />{t("memberPortal.package.activeStatus")}</div>
        </div>

        <div className="space-y-3 relative z-10 mt-auto">
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div className="text-xs sm:text-sm font-semibold flex items-center gap-4 sm:gap-6">
              <div>
                <span className="text-[8px] sm:text-[9px] block text-white/50 font-bold uppercase tracking-wider mb-0.5">{t("memberPortal.package.startDate")}</span>
                <span className="text-xs sm:text-sm font-mono text-zinc-150">{startLabel}</span>
              </div>
              {expiresLabel && (
                <>
                  <div className="w-[1px] h-6 bg-white/10" />
                  <div>
                    <span className="text-[8px] sm:text-[9px] block text-white/50 font-bold uppercase tracking-wider mb-0.5">{t("memberPortal.package.bioDuration")}</span>
                    <span className="text-red-300 font-bold text-xs sm:text-sm font-mono">{expiresLabel}</span>
                  </div>
                </>
              )}
              {!expiresLabel && (
                <>
                  <div className="w-[1px] h-6 bg-white/10" />
                  <div>
                    <span className="text-[8px] sm:text-[9px] block text-white/50 font-bold uppercase tracking-wider mb-0.5">{t("memberPortal.package.addedDuration")}</span>
                    <span className="text-white font-bold text-xs sm:text-sm font-mono">+{duration} {durationUnit === "days" ? "ngày" : durationUnit === "years" ? "năm" : "tháng"}</span>
                  </div>
                </>
              )}
            </div>
            <div className="text-right flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-white/60 transition-transform duration-300" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}>
                expand_more
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Slide-down benefits container */}
      <div 
        className="transition-all duration-300 ease-in-out overflow-hidden"
        style={{ 
          maxHeight: isOpen ? '1000px' : '0px',
          opacity: isOpen ? 1 : 0
        }}
      >
        <div className="bg-zinc-50 dark:bg-[#181622]/40 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/60 p-6 space-y-4">
          <div className="space-y-0.5">
            <h4 className="text-[11px] sm:text-xs font-black text-zinc-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-sm" style={{ color }}>verified_user</span>{t("memberPortal.package.benefitsTitle")}</h4>
            <p className="text-[9px] sm:text-[10px] text-zinc-400">{t("memberPortal.package.benefitsDesc")}</p>
          </div>

          {formattedBenefits.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {formattedBenefits.map((benefit, i) => (
                <div key={i} className="flex gap-2.5 items-start p-3.5 rounded-2xl bg-white dark:bg-[#1c1c1e] border border-zinc-150 dark:border-zinc-800/60 transition-all hover:scale-[1.01]">
                  <span className="material-symbols-outlined text-[13px] mt-0.5 shrink-0" style={{ color }}>check_circle</span>
                  <p className="text-[10px] sm:text-[11px] font-medium text-zinc-750 dark:text-zinc-300 leading-relaxed">{benefit}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[10px] text-zinc-450 italic py-2">{t("memberPortal.package.noDetails")}</p>
          )}
        </div>
      </div>
    </div>
  );
});

export default function MemberPortalPage() {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language.startsWith("vi") ? "en" : "vi";
    i18n.changeLanguage(newLang);
  };

  const memberSession = getMemberSession();
  const [bio, setBio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "" });
  const [showBirthdaySurprise, setShowBirthdaySurprise] = useState(false);

  // Custom confirmation modal state
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, message: "", onConfirm: null });
  const triggerConfirm = (message, onConfirm) => {
    setConfirmModal({ isOpen: true, message, onConfirm });
  };

  const handleLogout = () => {
    logoutAuth();
    window.location.href = "/login";
  };

  const [activeTab, setActiveTab] = useState("account");
  const [accountSubTab, setAccountSubTab] = useState("profile");
  const [previewMode, setPreviewMode] = useState("mobile");

  // Read History Tracking
  const [readHistoryTimestamp, setReadHistoryTimestamp] = useState(() => {
    return localStorage.getItem("read_history_timestamp") || null;
  });

  useEffect(() => {
    if (activeTab === "history" && bio?.history?.length > 0) {
      const latestTs = bio.history[bio.history.length - 1].timestamp;
      setReadHistoryTimestamp(latestTs);
      localStorage.setItem("read_history_timestamp", latestTs);
    }
  }, [activeTab, bio?.history]);

  const unreadHistoryCount = useMemo(() => {
    if (!bio?.history?.length) return 0;
    if (!readHistoryTimestamp) return bio.history.length;
    
    const readDate = new Date(readHistoryTimestamp).getTime();
    return bio.history.filter(entry => new Date(entry.timestamp).getTime() > readDate).length;
  }, [bio?.history, readHistoryTimestamp]);


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

  const previewIframeRef = useRef(null);

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const list = await dataApi.getPartners();
        setPartners(list);
        if (list.length > 0) {
          setSelectedPartner(list[0]);
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
    tabs: [],
    projects: [],
    services: []
  });

  const [newLinkLabel, setNewLinkLabel] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");





  const [cropModal, setCropModal] = useState({
    isOpen: false,
    imageSrc: null,
    zoom: 1,
    aspect: 1,
    offset: { x: 0, y: 0 }
  });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [isDragOver, setIsDragOver] = useState(false);
  const isFirstLoad = useRef(true);

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
              headline: t("memberPortal.guest.headline"),
              bio: t("memberPortal.guest.bio"),
              birthday: "19/05/2026",
              phone: "0999.888.777",
              hobbies: "Design, Code, Coffee, Music",
              height: "1m75",
              weight: "65kg",
              measurements: "90-60-90",
              address: t("memberPortal.guest.address"),
              education: t("memberPortal.guest.education"),
              skills: "Figma, React, UI/UX",
              jobTitle: "UI/UX Designer",
              contactEmail: "hello@hugostudio.vn",
              avatarUrl: "",
              links: [
                { label: "Instagram", url: "https://instagram.com" },
                { label: t("memberPortal.guest.fb"), url: "https://facebook.com" }
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
              tabs: [],
              projects: [],
              services: []
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
          
          // Check if today is user's birthday and show surprise
          if (b.birthday) {
            const parts = b.birthday.trim().split(/[-/]/);
            if (parts.length >= 2) {
              let day = parseInt(parts[0], 10);
              let month = parseInt(parts[1], 10);
              if (parts[0].length === 4) { // YYYY-MM-DD format
                day = parseInt(parts[2], 10);
                month = parseInt(parts[1], 10);
              }
              
              const now = new Date();
              if (day === now.getDate() && month === (now.getMonth() + 1)) {
                const todayStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
                if (localStorage.getItem("bday_effect_shown") !== todayStr) {
                  setShowBirthdaySurprise(true);
                  localStorage.setItem("bday_effect_shown", todayStr);
                }
              }
            }
          }

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
            tabs: b.tabs || [],
            projects: b.projects || [],
            services: b.services || [],
            secretLinks: b.secretLinks || [],
            slug: b.slug || ""
          });
        }
      } catch (error) {
        console.error(error);
        showToast(t("memberPortal.toast.loadError"), "error");
      } finally {
        setLoading(false);
      }
    };

    loadBio();
  }, [memberSession?.email, isGuestMode]);



  useEffect(() => {
    const postToIframe = () => {
      if (previewIframeRef.current && previewIframeRef.current.contentWindow) {
        previewIframeRef.current.contentWindow.postMessage({
          type: "UPDATE_PREVIEW",
          payload: formData
        }, "*");
      }
    };

    // Post immediately when formData changes
    postToIframe();

    // Listen for iframe readiness to post initial data
    const handleMessage = (e) => {
      if (e.data && e.data.type === "PREVIEW_READY") {
        postToIframe();
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [formData]);

  const avatarInputRef = useRef(null);
  const bioTextareaRef = useRef(null);

  useEffect(() => {
    if (bioTextareaRef.current) {
      bioTextareaRef.current.style.height = "auto";
      bioTextareaRef.current.style.height = `${bioTextareaRef.current.scrollHeight}px`;
    }
  }, [formData.bio, activeTab]);

  const processFile = (file) => {
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      showToast(t("memberPortal.toast.largeImage"), "warning");
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
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    processFile(file);
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
      showToast(t("memberPortal.toast.cropSuccess"), "success");
    };
  };

  const handleRemoveAvatar = () => {
    setFormData((prev) => ({ ...prev, avatarUrl: "" }));
    showToast(t("memberPortal.toast.avatarRemovedTemp"), "success");
  };

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    if (name === "bio") {
      const wordCount = value.trim().split(/\s+/).filter(Boolean).length;
      if (wordCount > 110) {
        showToast(t("memberPortal.toast.descLimit"), "warning");
        return;
      }
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };





  // Social Links Handlers (Manual Save)
  const addSocialLink = async () => {
    if (formData.links.length >= 5) {
      showToast(t("memberPortal.toast.linkLimit"), "warning");
      return;
    }
    if (!newLinkLabel.trim() || !newLinkUrl.trim()) {
      showToast(t("memberPortal.toast.linkEmpty"), "warning");
      return;
    }

    const updatedLinks = [...formData.links, { label: newLinkLabel.trim(), url: newLinkUrl.trim() }];
    const newData = { ...formData, links: updatedLinks };
    setFormData(newData);
    setNewLinkLabel("");
    setNewLinkUrl("");

    if (isGuestMode) {
      setBio(newData);
      localStorage.setItem("hugo_guest_bio", JSON.stringify(newData));
      showToast(t("memberPortal.toast.partnerLinkAdded"), "success");
    } else {
      handleSave(null, newData);
      // Toast is handled by handleSave
    }
  };

  const removeSocialLink = async (indexToKill) => {
    const updatedLinks = formData.links.filter((_, idx) => idx !== indexToKill);
    const newData = { ...formData, links: updatedLinks };
    setFormData(newData);

    if (isGuestMode) {
      setBio(newData);
      localStorage.setItem("hugo_guest_bio", JSON.stringify(newData));
      showToast(t("memberPortal.toast.partnerLinkDeleted"), "success");
    } else {
      handleSave(null, newData);
      // Toast is handled by handleSave
    }
  };





  // Keyboard Enter Interceptors to prevent default form submits
  const handleLinkInputKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSocialLink();
    }
  };



  // Save / Activate flow
  const handleSave = async (e, overrideData = null) => {
    if (e) e.preventDefault();
    const dataToSave = overrideData || formData;

    // Validate bio word count
    if (dataToSave.bio) {
      const wordCount = dataToSave.bio.trim().split(/\s+/).filter(Boolean).length;
      if (wordCount > 110) {
        showToast(t("memberPortal.toast.descLimitExceeded"), "error");
        return;
      }
    }

    setSaving(true);
    try {
      if (isGuestMode) {
        setBio(dataToSave);
        localStorage.setItem("hugo_guest_bio", JSON.stringify(dataToSave));
        showToast(t("memberPortal.toast.partnerSaveSuccess"), "success");
      } else if (bio?._id) {
        const response = await dataApi.updateMemberBio(bio._id, dataToSave);
        setBio(response.bio);
        showToast(t("memberPortal.toast.saveSuccess"), "success");
      } else {
        const response = await dataApi.createMemberBio({
          ...dataToSave,
          email: memberSession.email
        });
        setBio(response.bio);
        showToast(t("memberPortal.toast.activateSuccess"), "success");
      }
    } catch (error) {
      console.error(error);
      showToast(error.message || t("memberPortal.toast.saveError"), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBio = () => {
    if (isGuestMode) {
      triggerConfirm(t("memberPortal.confirm.deletePartner"), () => {
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
        showToast(t("memberPortal.toast.deleteLocalSuccess"), "success");
      });
      return;
    }

    if (!bio?._id) return;
    triggerConfirm(t("memberPortal.confirm.deletePersonal"), async () => {
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
        showToast(t("memberPortal.toast.deletePersonalSuccess"), "success");
        setActiveTab("account");
      } catch (error) {
        console.error(error);
        showToast(t("memberPortal.toast.deletePersonalError"), "error");
      } finally {
        setSaving(false);
      }
    });
  };

  const handleCopyLink = async () => {
    if (!publicLink) return;
    await navigator.clipboard.writeText(publicLink);
    showToast(t("memberPortal.toast.copySuccess"), "success");
  };

  const handleRedeemCode = async (giftCode) => {
    if (!giftCode) return;
    try {
      setSaving(true);
      const res = await dataApi.redeemGiftCode(memberSession.email, giftCode);
      if (res.bio) {
        setBio(res.bio);
        showToast(res.message || t("memberPortal.toast.giftSuccess"), "success");
      }
    } catch (err) {
      showToast(err.message || t("memberPortal.toast.giftError"), "error");
    } finally {
      setSaving(false);
    }
  };

  const renderSimulatedLayout = () => {
    return (
      <iframe
        ref={previewIframeRef}
        src="/preview?v=2"
        className="w-full h-full border-none"
        title="Live Preview"
      />
    );
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#f5f5f7] dark:bg-[#000000]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-[#0071e3] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-[10px] text-zinc-450 font-bold uppercase tracking-widest">{t("memberPortal.loadingConfig")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#000000] text-[#1d1d1f] dark:text-[#f5f5f7] font-body selection:bg-[#0071e3]/20 transition-colors duration-300">



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
                {isGuestMode ? t("memberPortal.titlePartner") : t("memberPortal.titleStudent")}
              </span>
              <h1 className="text-lg sm:text-2xl md:text-3xl font-bold tracking-tight text-black dark:text-white line-clamp-2">
                {isGuestMode ? t("memberPortal.designYourBio") : `${t("memberPortal.greeting")}, ${memberSession?.displayName || t("memberPortal.student")}`}
              </h1>
              <div className="text-[9px] sm:text-xs text-zinc-500 dark:text-zinc-400 flex flex-col sm:flex-row sm:items-center justify-start gap-1 mt-1 sm:mt-0.5">
                {isGuestMode ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider text-[8px] sm:text-[9px] bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/10 px-2 py-0.5 rounded-full">
                    <span className="material-symbols-outlined text-[10px] animate-pulse">local_activity</span>{t("memberPortal.bio.localSave")}</span>
                ) : (
                  <p className="flex flex-col sm:flex-row sm:items-center gap-1">
                    <span className="hidden sm:inline">{t("memberPortal.academicProfile")}:</span>
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
                title={t("memberPortal.logout")}
              >
                <span className="material-symbols-outlined text-sm">logout</span>
              </button>
            )}
          </div>

          {!isGuestMode && (
            <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
              {/* iOS Style Segmented Control */}
              <div className="relative bg-[#767680]/12 dark:bg-[#767680]/24 p-[3px] rounded-full flex w-full md:w-auto md:min-w-[560px] border border-zinc-200/20 dark:border-zinc-800/20 shadow-[inset_0_1px_1px_rgba(0,0,0,0.05)] shrink-0">
                <div
                  className="absolute top-[3px] bottom-[3px] bg-white dark:bg-[#636366] rounded-full shadow-sm transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]"
                  style={{
                    left: activeTab === "account"
                      ? "3px"
                      : activeTab === "manage"
                        ? "calc(20% + 1px)"
                        : activeTab === "partner"
                          ? "calc(40% + 1px)"
                          : activeTab === "utilities"
                            ? "calc(60% + 1px)"
                            : "calc(80% + 1px)",
                    width: "calc(20% - 4px)"
                  }}
                />

                <button
                  type="button"
                  onClick={() => setActiveTab("account")}
                  className={`w-1/5 py-1.5 text-[9px] sm:text-[11px] font-semibold rounded-full relative z-10 transition-colors duration-200 ${activeTab === "account" ? "text-black dark:text-white font-bold" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800"
                    }`}
                >{t("memberPortal.tabs.bio")}</button>
                <button
                  type="button"
                  onClick={() => setActiveTab("manage")}
                  className={`w-1/5 py-1.5 text-[9px] sm:text-[11px] font-semibold rounded-full relative z-10 transition-colors duration-200 ${activeTab === "manage" ? "text-black dark:text-white font-bold" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800"
                    }`}
                >{t("memberPortal.tabs.package")}</button>
                <button
                  type="button"
                  onClick={() => setActiveTab("partner")}
                  className={`w-1/5 py-1.5 text-[9px] sm:text-[11px] font-semibold rounded-full relative z-10 transition-colors duration-200 ${activeTab === "partner" ? "text-black dark:text-white font-bold" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800"
                    }`}
                >{t("memberPortal.tabs.partner")}</button>
                <button
                  type="button"
                  onClick={() => setActiveTab("utilities")}
                  className={`w-1/5 py-1.5 text-[9px] sm:text-[11px] font-semibold rounded-full relative z-10 transition-colors duration-200 ${activeTab === "utilities" ? "text-black dark:text-white font-bold" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800"
                    }`}
                >{t("memberPortal.tabs.utilities")}</button>
                <button
                  type="button"
                  onClick={() => setActiveTab("history")}
                  className={`w-1/5 py-1.5 text-[9px] sm:text-[11px] font-semibold rounded-full relative z-10 transition-colors duration-200 flex items-center justify-center gap-1.5 ${activeTab === "history" ? "text-black dark:text-white font-bold" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800"
                    }`}
                >
                  <span>{t("memberPortal.tabs.history")}</span>
                  {unreadHistoryCount > 0 && (
                    <span className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full min-w-[16px] text-center shadow-sm animate-bounce-short">
                      {unreadHistoryCount > 99 ? '99+' : unreadHistoryCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Desktop Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                className="hidden md:flex px-4 py-2 rounded-full border border-red-200 dark:border-red-900/30 bg-red-500/5 hover:bg-red-500/10 text-red-500 hover:text-red-600 dark:hover:text-red-400 items-center justify-center gap-1.5 text-[9px] sm:text-[11px] font-bold uppercase tracking-wider transition-all duration-200 shadow-sm shrink-0"
              >
                <span className="material-symbols-outlined text-xs sm:text-sm">logout</span>
                <span>{t("memberPortal.logout")}</span>
              </button>
            </div>
          )}
        </section>

        <ErrorBoundary>
          <React.Suspense fallback={
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-zinc-200 border-t-zinc-800 dark:border-zinc-800 dark:border-t-white"></div>
              <p className="text-xs text-zinc-500 font-medium tracking-wide uppercase">Đang tải dữ liệu...</p>
            </div>
          }>
            {/* Tab 1: Account / Profile Details */}
        {activeTab === "account" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 md:gap-8 items-start animate-fadeIn">

            {/* Left Content Area: iOS Form fields with Sub-tabs navigation */}
            <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 items-start">
              
              {/* Local Sub-tabs Navigation Menu */}
              <div className="md:col-span-3 flex md:flex-col overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 gap-1.5 sticky top-20 z-20 scrollbar-none p-1 md:p-0">
                {[
                  { id: "profile", label: t("memberPortal.sidebar.personal"), icon: "person" },
                  { id: "design", label: t("memberPortal.sidebar.theme"), icon: "palette" },
                  { id: "links", label: t("memberPortal.sidebar.links"), icon: "link" },
                  { id: "projects", label: t("memberPortal.sidebar.projects"), icon: "folder_special" },
                  { id: "services", label: t("memberPortal.sidebar.services"), icon: "storefront" },
                  { id: "career", label: t("memberPortal.sidebar.career"), icon: "school" },
                  { id: "body", label: t("memberPortal.sidebar.physical"), icon: "straighten" }
                ].map((tab) => {
                  const isActive = accountSubTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setAccountSubTab(tab.id)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-[10px] font-black uppercase tracking-wider transition-all duration-200 shrink-0 border ${
                        isActive
                          ? "bg-[#0071e3] border-[#0071e3] text-white shadow-md shadow-[#0071e3]/10 transform md:translate-x-1"
                          : "bg-white dark:bg-[#1c1c1e] text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 border-zinc-200 dark:border-zinc-800/60"
                      }`}
                    >
                      <span className="material-symbols-outlined text-base shrink-0">{tab.icon}</span>
                      <span className="truncate">{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Active Form Fields Pane */}
              <div className="md:col-span-9 space-y-4">
                <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-5">
                  
                  {/* profile Sub-Tab */}
                  {accountSubTab === "profile" && (
                    <div className="space-y-4 animate-fadeIn">
                      {/* Section: Avatar Editor */}
                      <div className="space-y-2 text-center py-4 bg-white dark:bg-[#1c1c1e] rounded-2xl border border-zinc-200/50 dark:border-zinc-800/60 shadow-sm">
                        <div
                          className={`relative w-20 h-20 rounded-full border shadow-md bg-zinc-100 dark:bg-zinc-900 mx-auto flex items-center justify-center overflow-hidden group cursor-pointer transition-all duration-200 ${
                            isDragOver
                              ? "border-2 border-dashed border-[#0071e3] scale-105 bg-blue-50/10 dark:bg-blue-900/10"
                              : "border-zinc-200 dark:border-zinc-800"
                          }`}
                          onClick={() => !saving && avatarInputRef.current.click()}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setIsDragOver(true);
                          }}
                          onDragLeave={() => setIsDragOver(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDragOver(false);
                            const file = e.dataTransfer.files[0];
                            processFile(file);
                          }}
                        >
                          {formData.avatarUrl ? (
                            <img src={optimizeCloudinaryUrl(formData.avatarUrl, 300)} alt="Avatar" className="w-full h-full object-cover" />
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
                              <span>{t("memberPortal.bio.changeAvatar")}</span>
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
                          <p className="text-[10px] text-zinc-450 dark:text-zinc-400 font-bold uppercase tracking-wider">{t("memberPortal.bio.avatarTitle")}</p>
                          <p className="text-[8px] text-zinc-400">{t("memberPortal.bio.avatarDesc")}</p>
                          {formData.avatarUrl && (
                            <button
                              type="button"
                              onClick={handleRemoveAvatar}
                              disabled={saving}
                              className="text-[9px] font-bold text-red-500 hover:text-red-650 transition-colors disabled:opacity-50"
                            >{t("memberPortal.bio.removeAvatar")}</button>
                          )}
                        </div>
                      </div>

                      {/* Section A: Basic settings */}
                      <div className="space-y-2">
                        <h3 className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest pl-4">{t("memberPortal.bio.basicInfo")}</h3>
                        <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-zinc-200/50 dark:border-zinc-800/60 shadow-sm overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800/50">
                          {/* Display name */}
                          <div className="flex items-center gap-3 px-4 py-3 min-h-[50px]">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 bg-[#0071e3]">
                              <span className="material-symbols-outlined text-base">person</span>
                            </div>
                            <label className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider w-24 shrink-0">{t("memberPortal.bio.fullName")}</label>
                            <OptimizedInput
                              type="text"
                              name="displayName"
                              value={formData.displayName}
                              onChange={handleFieldChange}
                              required
                              placeholder={t("memberPortal.bio.placeholderName")}
                              className="w-full bg-transparent text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-zinc-400 focus:outline-none text-xs sm:text-sm font-semibold"
                            />
                          </div>

                          {/* Headline */}
                          <div className="flex items-center gap-3 px-4 py-3 min-h-[50px]">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 bg-[#30b0c7]">
                              <span className="material-symbols-outlined text-base">badge</span>
                            </div>
                            <label className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider w-24 shrink-0">{t("memberPortal.bio.nickname")}</label>
                            <OptimizedInput
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
                            <label className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider w-24 shrink-0">{t("memberPortal.bio.birthday")}</label>
                            <OptimizedInput
                              type="text"
                              name="birthday"
                              value={formData.birthday}
                              onChange={handleFieldChange}
                              placeholder={t("memberPortal.bio.placeholderBirthday")}
                              className="w-full bg-transparent text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-zinc-400 focus:outline-none text-xs sm:text-sm font-semibold"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Section B: Contact settings */}
                      <div className="space-y-2">
                        <h3 className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest pl-4">{t("memberPortal.bio.contactInfo")}</h3>
                        <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-zinc-200/50 dark:border-zinc-800/60 shadow-sm overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800/50">
                          {/* Read-only email */}
                          <div className="flex items-center gap-3 px-4 py-3 min-h-[50px] bg-zinc-50/50 dark:bg-zinc-900/10">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 bg-[#34c759]">
                              <span className="material-symbols-outlined text-base">mail</span>
                            </div>
                            <label className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider w-24 shrink-0">
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
                            <label className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider w-24 shrink-0">{t("memberPortal.bio.phone")}</label>
                            <OptimizedInput
                              type="tel"
                              name="phone"
                              value={formData.phone}
                              onChange={handleFieldChange}
                              placeholder={t("memberPortal.bio.placeholderPhone")}
                              className="w-full bg-transparent text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-zinc-400 focus:outline-none text-xs sm:text-sm font-semibold"
                            />
                          </div>

                          {/* Contact Email */}
                          <div className="flex items-center gap-3 px-4 py-3 min-h-[50px]">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 bg-[#0071e3]">
                              <span className="material-symbols-outlined text-base">alternate_email</span>
                            </div>
                            <label className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider w-24 shrink-0">{t("memberPortal.bio.email")}</label>
                            <OptimizedInput
                              type="email"
                              name="contactEmail"
                              value={formData.contactEmail}
                              onChange={handleFieldChange}
                              placeholder={t("memberPortal.bio.placeholderEmail")}
                              className="w-full bg-transparent text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-zinc-400 focus:outline-none text-xs sm:text-sm font-semibold"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* design Sub-Tab */}
                  {accountSubTab === "design" && (
                    <div className="space-y-4 animate-fadeIn">
                      {/* Section: Select Template Style */}
                      <div className="space-y-2">
                        <h3 className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest pl-4">{t("memberPortal.design.title")}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, theme: { ...prev.theme, template: 'default' } }))}
                            className={`p-3.5 rounded-2xl border text-left transition-all ${
                              (formData.theme?.template !== 'brutalism' && formData.theme?.template !== 'flat')
                                ? 'bg-[#0071e3]/10 border-[#0071e3] text-black dark:text-white ring-1 ring-[#0071e3]'
                                : 'bg-white dark:bg-[#1c1c1e] border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-zinc-350 dark:hover:border-zinc-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="material-symbols-outlined text-lg">view_carousel</span>
                              {(formData.theme?.template !== 'brutalism' && formData.theme?.template !== 'flat') && (
                                <span className="material-symbols-outlined text-[#0071e3] text-xs font-bold">check_circle</span>
                              )}
                            </div>
                            <h4 className="text-[11px] font-bold mt-2">{t("memberPortal.design.classicTitle")}</h4>
                            <p className="text-[8.5px] text-zinc-450 dark:text-zinc-500 mt-1 leading-relaxed">{t("memberPortal.design.classicDesc")}</p>
                          </button>

                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, theme: { ...prev.theme, template: 'brutalism' } }))}
                            className={`p-3.5 rounded-2xl border text-left transition-all ${
                              formData.theme?.template === 'brutalism'
                                ? 'bg-[#0071e3]/10 border-[#0071e3] text-black dark:text-white ring-1 ring-[#0071e3]'
                                : 'bg-white dark:bg-[#1c1c1e] border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-zinc-350 dark:hover:border-zinc-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="material-symbols-outlined text-lg">token</span>
                              {formData.theme?.template === 'brutalism' && (
                                <span className="material-symbols-outlined text-[#0071e3] text-xs font-bold">check_circle</span>
                              )}
                            </div>
                            <h4 className="text-[11px] font-bold mt-2 text-red-500 dark:text-red-400">Brutalism</h4>
                            <p className="text-[8.5px] text-zinc-450 dark:text-zinc-500 mt-1 leading-relaxed">{t("memberPortal.design.brutalismDesc")}</p>
                          </button>

                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, theme: { ...prev.theme, template: 'flat' } }))}
                            className={`p-3.5 rounded-2xl border text-left transition-all ${
                              formData.theme?.template === 'flat'
                                ? 'bg-[#0071e3]/10 border-[#0071e3] text-black dark:text-white ring-1 ring-[#0071e3]'
                                : 'bg-white dark:bg-[#1c1c1e] border-zinc-200 dark:border-zinc-850 text-zinc-500 dark:text-zinc-400 hover:border-zinc-350 dark:hover:border-zinc-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="material-symbols-outlined text-lg">grid_view</span>
                              {formData.theme?.template === 'flat' && (
                                <span className="material-symbols-outlined text-[#0071e3] text-xs font-bold">check_circle</span>
                              )}
                            </div>
                            <h4 className="text-[11px] font-bold mt-2 text-teal-650 dark:text-teal-400">{t("memberPortal.design.flatTitle")}</h4>
                            <p className="text-[8.5px] text-zinc-450 dark:text-zinc-500 mt-1 leading-relaxed">{t("memberPortal.design.flatDesc")}</p>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* links Sub-Tab */}
                  {accountSubTab === "links" && (
                    <div className="space-y-4 animate-fadeIn">
                      {/* Section D: Social Network Links */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center px-4">
                          <h3 className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest">{t("memberPortal.links.title")}</h3>
                          <span className="text-[8px] font-semibold text-zinc-400">{t("memberPortal.links.autoSave")}</span>
                        </div>

                        <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-zinc-200/50 dark:border-zinc-800/60 shadow-sm p-4 space-y-4">
                          {formData.links && formData.links.length > 0 ? (
                            <div className="space-y-2">
                              {formData.links.map((link, idx) => {
                                const brand = getSocialBrandStyle(link.label);
                                return (
                                  <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/40 dark:border-zinc-800/40 text-xs transition-all hover:border-zinc-300 dark:hover:border-zinc-700">
                                    <div className="flex items-center gap-2 truncate pr-2">
                                      <span className={`material-symbols-outlined text-base shrink-0 ${brand ? "text-[#0071e3]" : "text-zinc-450"}`}>
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
                              <p className="text-[11px] italic text-zinc-400 mt-1">{t("memberPortal.links.empty")}</p>
                            </div>
                          )}

                          {/* Add new link input rows */}
                          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/50 space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-zinc-450 uppercase pl-1">{t("memberPortal.links.label")}</label>
                                <OptimizedInput
                                  type="text"
                                  value={newLinkLabel}
                                  onKeyDown={handleLinkInputKeyDown}
                                  onChange={(e) => setNewLinkLabel(e.target.value)}
                                  placeholder={t("memberPortal.links.placeholderLabel")}
                                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-[#1d1d1f] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0071e3] text-xs font-semibold"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-zinc-450 uppercase pl-1">{t("memberPortal.links.url")}</label>
                                <OptimizedInput
                                  type="text"
                                  value={newLinkUrl}
                                  onKeyDown={handleLinkInputKeyDown}
                                  onChange={(e) => setNewLinkUrl(e.target.value)}
                                  placeholder={t("memberPortal.links.placeholderUrl")}
                                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-[#1d1d1f] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0071e3] text-xs font-semibold"
                                />
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={addSocialLink}
                              className="w-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1 shadow-sm"
                            >
                              <span className="material-symbols-outlined text-sm">add</span>{t("memberPortal.links.addLink")}</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB: PROJECTS */}
                  {accountSubTab === "projects" && (
                    <MemberProjectsTab
                      formData={formData}
                      setFormData={setFormData}
                      handleSave={handleSave}
                      showToast={showToast}
                      isGuestMode={isGuestMode}
                      bio={bio}
                    />
                  )}

                  {/* SUB-TAB: SERVICES */}
                  {accountSubTab === "services" && (
                    <MemberServicesTab
                      formData={formData}
                      setFormData={setFormData}
                      handleSave={handleSave}
                      showToast={showToast}
                      isGuestMode={isGuestMode}
                      bio={bio}
                    />
                  )}

                  {/* career Sub-Tab */}
                  {accountSubTab === "career" && (
                    <div className="space-y-4 animate-fadeIn">
                      {/* Section C: Portfolio & Education */}
                      <div className="space-y-2">
                        <h3 className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest pl-4">{t("memberPortal.career.title")}</h3>
                        <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-zinc-200/50 dark:border-zinc-800/60 shadow-sm overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800/50">
                          {/* Job Title */}
                          <div className="flex items-center gap-3 px-4 py-3 min-h-[50px]">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 bg-[#af52de]">
                              <span className="material-symbols-outlined text-base">work</span>
                            </div>
                            <label className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider w-24 shrink-0">{t("memberPortal.career.role")}</label>
                            <OptimizedInput
                              type="text"
                              name="jobTitle"
                              value={formData.jobTitle}
                              onChange={handleFieldChange}
                              placeholder={t("memberPortal.career.placeholderRole")}
                              className="w-full bg-transparent text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-zinc-400 focus:outline-none text-xs sm:text-sm font-semibold"
                            />
                          </div>

                          {/* Education */}
                          <div className="flex items-center gap-3 px-4 py-3 min-h-[50px]">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 bg-[#ff9500]">
                              <span className="material-symbols-outlined text-base">school</span>
                            </div>
                            <label className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider w-24 shrink-0">{t("memberPortal.career.education")}</label>
                            <OptimizedInput
                              type="text"
                              name="education"
                              value={formData.education}
                              onChange={handleFieldChange}
                              placeholder={t("memberPortal.career.placeholderEdu")}
                              className="w-full bg-transparent text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-zinc-400 focus:outline-none text-xs sm:text-sm font-semibold"
                            />
                          </div>

                          {/* Skills */}
                          <div className="flex items-center gap-3 px-4 py-3 min-h-[50px]">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 bg-[#34c759]">
                              <span className="material-symbols-outlined text-base">psychology</span>
                            </div>
                            <label className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider w-24 shrink-0">{t("memberPortal.career.skills")}</label>
                            <OptimizedInput
                              type="text"
                              name="skills"
                              value={formData.skills}
                              onChange={handleFieldChange}
                              placeholder={t("memberPortal.career.placeholderSkills")}
                              className="w-full bg-transparent text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-zinc-400 focus:outline-none text-xs sm:text-sm font-semibold"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* body Sub-Tab */}
                  {accountSubTab === "body" && (
                    <div className="space-y-4 animate-fadeIn">
                      {/* Section D: Body Measurements & Location */}
                      <div className="space-y-2">
                        <h3 className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest pl-4">{t("memberPortal.physical.title")}</h3>
                        <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-zinc-200/50 dark:border-zinc-800/60 shadow-sm overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800/50">
                          {/* Height */}
                          <div className="flex items-center gap-3 px-4 py-3 min-h-[50px]">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 bg-[#ff3b30]">
                              <span className="material-symbols-outlined text-base">height</span>
                            </div>
                            <label className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider w-24 shrink-0">{t("memberPortal.physical.height")}</label>
                            <OptimizedInput
                              type="text"
                              name="height"
                              value={formData.height}
                              onChange={handleFieldChange}
                              placeholder={t("memberPortal.physical.placeholderHeight")}
                              className="w-full bg-transparent text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-zinc-400 focus:outline-none text-xs sm:text-sm font-semibold"
                            />
                          </div>

                          {/* Weight */}
                          <div className="flex items-center gap-3 px-4 py-3 min-h-[50px]">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 bg-[#4cd964]">
                              <span className="material-symbols-outlined text-base">monitor_weight</span>
                            </div>
                            <label className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider w-24 shrink-0">{t("memberPortal.physical.weight")}</label>
                            <OptimizedInput
                              type="text"
                              name="weight"
                              value={formData.weight}
                              onChange={handleFieldChange}
                              placeholder={t("memberPortal.physical.placeholderWeight")}
                              className="w-full bg-transparent text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-zinc-400 focus:outline-none text-xs sm:text-sm font-semibold"
                            />
                          </div>

                          {/* Measurements */}
                          <div className="flex items-center gap-3 px-4 py-3 min-h-[50px]">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 bg-[#5856d6]">
                              <span className="material-symbols-outlined text-base">straighten</span>
                            </div>
                            <label className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider w-24 shrink-0">{t("memberPortal.physical.measurements")}</label>
                            <OptimizedInput
                              type="text"
                              name="measurements"
                              value={formData.measurements}
                              onChange={handleFieldChange}
                              placeholder={t("memberPortal.physical.placeholderMeasure")}
                              className="w-full bg-transparent text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-zinc-400 focus:outline-none text-xs sm:text-sm font-semibold"
                            />
                          </div>

                          {/* Address */}
                          <div className="flex items-center gap-3 px-4 py-3 min-h-[50px]">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 bg-[#0071e3]">
                              <span className="material-symbols-outlined text-base">distance</span>
                            </div>
                            <label className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider w-24 shrink-0">{t("memberPortal.physical.location")}</label>
                            <OptimizedInput
                              type="text"
                              name="address"
                              value={formData.address}
                              onChange={handleFieldChange}
                              placeholder={t("memberPortal.physical.placeholderLocation")}
                              className="w-full bg-transparent text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-zinc-400 focus:outline-none text-xs sm:text-sm font-semibold"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Section E: Biography and Hobbies */}
                      <div className="space-y-2">
                        <h3 className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest pl-4">{t("memberPortal.other.title")}</h3>
                        <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-zinc-200/50 dark:border-zinc-800/60 shadow-sm overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800/50">
                          {/* Hobbies */}
                          <div className="flex items-center gap-3 px-4 py-3 min-h-[50px]">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 bg-[#5856d6]">
                              <span className="material-symbols-outlined text-base">star</span>
                            </div>
                            <label className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider w-24 shrink-0">{t("memberPortal.other.hobbies")}</label>
                            <OptimizedInput
                              type="text"
                              name="hobbies"
                              value={formData.hobbies}
                              onChange={handleFieldChange}
                              placeholder={t("memberPortal.other.placeholderHobbies")}
                              className="w-full bg-transparent text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-zinc-400 focus:outline-none text-xs sm:text-sm font-semibold"
                            />
                          </div>

                          {/* Bio text */}
                          <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-3 px-4 py-3 min-h-[70px]">
                            <div className="flex items-center gap-3 shrink-0">
                              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 bg-[#8e8e93]">
                                <span className="material-symbols-outlined text-base">edit_note</span>
                              </div>
                              <label className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider w-24 shrink-0">{t("memberPortal.other.desc")}</label>
                            </div>
                            <div className="flex-grow flex flex-col w-full">
                              <OptimizedTextarea
                                ref={bioTextareaRef}
                                name="bio"
                                value={formData.bio}
                                onChange={handleFieldChange}
                                placeholder={t("memberPortal.other.placeholderDesc")}
                                className="w-full bg-transparent text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-zinc-400 focus:outline-none text-xs sm:text-sm font-semibold resize-none leading-relaxed mt-1 md:mt-0 overflow-hidden"
                              />
                              <div className="flex justify-end text-[9px] font-bold text-zinc-400 dark:text-zinc-500 mt-1 select-none pr-2">
                                {formData.bio ? formData.bio.trim().split(/\s+/).filter(Boolean).length : 0} / 110 chữ
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Submit save button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 transition-colors rounded-2xl py-3 px-4 flex items-center justify-center gap-2 font-bold shadow-sm"
                    >
                      {saving ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin" />
                          <span className="text-[10px] uppercase tracking-wider">{t("memberPortal.updating")}</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-sm">save</span>
                          <span className="text-[10px] uppercase tracking-wider">{t("memberPortal.updateInfo")}</span>
                        </>
                      )}
                    </button>
                  </div>

                </form>
              </div>

            </div>

            {/* Right Sticky Preview Area - Account Tab */}
            <div className="lg:col-span-5 lg:sticky lg:top-6 flex flex-col items-center space-y-3 sm:space-y-4 w-full">
              <div className="flex items-center gap-2 sm:gap-3 w-full justify-center sm:justify-start">
                <span className="text-[8px] sm:text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest">{t("memberPortal.preview.livePreview")}</span>
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
          <MemberManageTab
            bio={bio}
            publicLink={publicLink}
            handleCopyLink={handleCopyLink}
            handleDeleteBio={handleDeleteBio}
            saving={saving}
            handleRedeemCode={handleRedeemCode}
          />
        )}

        {/* Tab 4: Partner Iframe Services inside Member Portal */}
        {activeTab === "partner" && <MemberPartnerTab />}

        {/* Tab 4.5: Member Utilities Dashboard */}
        {activeTab === "utilities" && (
          <MemberUtilitiesTab bio={formData} publicLink={publicLink} showToast={showToast} setFormData={setFormData} handleSave={handleSave} />
        )}

        {/* Tab 5: Lịch Sử & Thông Báo */}
        {activeTab === "history" && <MemberHistoryTab bio={bio} showToast={showToast} />}
          </React.Suspense>
        </ErrorBoundary>

        {/* Cropper Modal */}
        {cropModal.isOpen && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-[#1c1c1e] w-full max-w-sm rounded-3xl border border-zinc-200/50 dark:border-zinc-800/60 shadow-2xl p-6 text-center space-y-6">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">{t("memberPortal.crop.title")}</h3>
                <p className="text-[10px] text-zinc-450 dark:text-zinc-400">{t("memberPortal.crop.desc")}</p>
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
                  <span>{t("memberPortal.crop.zoomOut")}</span>
                  <span>{t("memberPortal.crop.zoomIn")}</span>
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
                >{t("memberPortal.crop.cancel")}</button>
                <button
                  type="button"
                  onClick={handleCropSave}
                  className="py-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-[11px] font-bold shadow-md transition-colors"
                >{t("memberPortal.crop.save")}</button>
              </div>
            </div>
          </div>
        )}
        {/* CUSTOM CONFIRM MODAL */}
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
              <div className="flex items-center gap-2 text-rose-500">
                <span className="material-symbols-outlined text-2xl">warning</span>
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-zinc-900 dark:text-white">{t("memberPortal.confirm.title")}</h3>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {confirmModal.message}
              </p>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmModal({ isOpen: false, message: "", onConfirm: null })}
                  className="py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-[11px] font-bold text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors"
                >{t("memberPortal.confirm.cancel")}</button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirmModal.onConfirm) confirmModal.onConfirm();
                    setConfirmModal({ isOpen: false, message: "", onConfirm: null });
                  }}
                  className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold shadow-md transition-colors"
                >{t("memberPortal.confirm.confirm")}</button>
              </div>
            </div>
          </div>
        )}

        {showBirthdaySurprise && (
          <BirthdaySurprise 
            displayName={formData.displayName} 
            onClose={() => setShowBirthdaySurprise(false)} 
          />
        )}

      </div>
    </div>
  );
}

const BirthdaySurprise = ({ displayName, onClose }) => {
  const canvasRef = useRef(null);
  const audioCtxRef = useRef(null);

  useEffect(() => {
    // 1. Play Happy Birthday synth music
    let hasPlayed = false;
    const playMusic = () => {
      if (hasPlayed) return;
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;

      const runMelody = () => {
        const melody = [
          { note: 392.00, dur: 0.35 }, { note: 392.00, dur: 0.15 }, { note: 440.00, dur: 0.5 }, { note: 392.00, dur: 0.5 }, { note: 523.25, dur: 0.5 }, { note: 493.88, dur: 1.0 },
          { note: 392.00, dur: 0.35 }, { note: 392.00, dur: 0.15 }, { note: 440.00, dur: 0.5 }, { note: 392.00, dur: 0.5 }, { note: 587.33, dur: 0.5 }, { note: 523.25, dur: 1.0 },
          { note: 392.00, dur: 0.35 }, { note: 392.00, dur: 0.15 }, { note: 783.99, dur: 0.5 }, { note: 659.25, dur: 0.5 }, { note: 523.25, dur: 0.5 }, { note: 493.88, dur: 0.5 }, { note: 440.00, dur: 1.0 },
          { note: 698.46, dur: 0.35 }, { note: 698.46, dur: 0.15 }, { note: 659.25, dur: 0.5 }, { note: 523.25, dur: 0.5 }, { note: 587.33, dur: 0.5 }, { note: 523.25, dur: 1.0 }
        ];

        let time = ctx.currentTime;
        melody.forEach((item) => {
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(item.note, time);
          
          gainNode.gain.setValueAtTime(0.12, time);
          gainNode.gain.exponentialRampToValueAtTime(0.001, time + item.dur - 0.05);
          
          osc.connect(gainNode);
          gainNode.connect(ctx.destination);
          osc.start(time);
          osc.stop(time + item.dur - 0.02);
          time += item.dur + 0.08;
        });
      };

      if (ctx.state === 'suspended') {
        const handleGesture = () => {
          ctx.resume().then(() => {
            if (ctx.state === 'running') {
              runMelody();
              cleanup();
            }
          });
        };
        const cleanup = () => {
          window.removeEventListener('click', handleGesture);
          window.removeEventListener('touchstart', handleGesture);
        };
        window.addEventListener('click', handleGesture);
        window.addEventListener('touchstart', handleGesture);
      } else {
        runMelody();
      }
      hasPlayed = true;
    };

    playMusic();

    // 2. Confetti & Fireworks Canvas
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#FF2D55', '#FF9500', '#FFCC00', '#4CD964', '#5AC8FA', '#5856D6', '#FF2D55'];

    class Particle {
      constructor(x, y, isFirework = false) {
        this.x = x;
        this.y = y;
        this.isFirework = isFirework;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        
        if (isFirework) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 4 + 2;
          this.vx = Math.cos(angle) * speed;
          this.vy = Math.sin(angle) * speed;
          this.radius = Math.random() * 2 + 1.5;
          this.alpha = 1;
          this.decay = Math.random() * 0.015 + 0.01;
        } else {
          this.vx = Math.random() * 2 - 1;
          this.vy = Math.random() * 3 + 1;
          this.radius = Math.random() * 3 + 2;
          this.rotation = Math.random() * 360;
          this.rotationSpeed = Math.random() * 4 - 2;
        }
      }

      update() {
        if (this.isFirework) {
          this.x += this.vx;
          this.y += this.vy;
          this.vy += 0.05;
          this.alpha -= this.decay;
        } else {
          this.x += this.vx;
          this.y += this.vy;
          this.rotation += this.rotationSpeed;
          if (this.y > canvas.height) {
            this.y = -10;
            this.x = Math.random() * canvas.width;
          }
        }
      }

      draw() {
        ctx.save();
        if (this.isFirework) {
          ctx.globalAlpha = this.alpha;
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
          ctx.fillStyle = this.color;
          ctx.fill();
        } else {
          ctx.translate(this.x, this.y);
          ctx.rotate((this.rotation * Math.PI) / 180);
          ctx.fillStyle = this.color;
          ctx.fillRect(-this.radius, -this.radius, this.radius * 2, this.radius * 1.5);
        }
        ctx.restore();
      }
    }

    for (let i = 0; i < 80; i++) {
      particles.push(new Particle(Math.random() * canvas.width, Math.random() * canvas.height));
    }

    const createExplosion = (x, y) => {
      for (let i = 0; i < 40; i++) {
        particles.push(new Particle(x, y, true));
      }
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    let fireworkTimer = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      fireworkTimer++;
      if (fireworkTimer % 45 === 0) {
        createExplosion(Math.random() * canvas.width, Math.random() * (canvas.height * 0.6));
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw();
        
        if (p.isFirework && p.alpha <= 0) {
          particles.splice(i, 1);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md transition-all duration-300">
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
      
      <div className="relative max-w-sm w-full mx-4 p-8 rounded-3xl bg-[#1c1c1e] border border-rose-500/30 text-center shadow-[0_0_50px_rgba(255,45,85,0.25)] space-y-6 animate-scaleUp z-10">
        
        {/* Animated Cake Icon */}
        <div className="relative w-20 h-20 mx-auto flex items-center justify-center bg-rose-500/10 rounded-full border border-rose-500/20 text-rose-500 animate-pulse">
          <span className="material-symbols-outlined text-4xl">cake</span>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 bg-clip-text text-transparent uppercase tracking-wider">
            Happy Birthday!
          </h2>
          <p className="text-white text-sm font-semibold">
            Chúc mừng sinh nhật, <span className="text-rose-500 font-bold">{displayName}</span>! 
          </p>
          <p className="text-xs text-zinc-400 leading-relaxed px-2">
            Hugo Studio mến chúc bạn tuổi mới ngập tràn niềm vui, sức khỏe dồi dào, luôn tươi trẻ và gặt hái được nhiều thắng lợi rực rỡ!
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold text-xs uppercase tracking-widest transition-all active:scale-95 shadow-md shadow-rose-500/20"
        >
          Nhận lời chúc
        </button>
      </div>
    </div>
  );
};
