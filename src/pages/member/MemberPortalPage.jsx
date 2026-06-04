import { useTranslation } from "react-i18next";
import React, { useEffect, useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { getMemberSession, logoutAuth } from "../../services/authSession";
import ErrorBoundary from "../../components/ErrorBoundary";
import memberService from "../../services/classes/MemberService";

// Extracted Subcomponents
import BirthdaySurprise from "../../components/member/BirthdaySurprise";
import CropModal from "../../components/member/CropModal";
import RejectedVerification from "../../components/member/RejectedVerification";
import VerificationForm from "../../components/member/VerificationForm";
import PendingVerification from "../../components/member/PendingVerification";
import PreviewSimulator from "../../components/member/PreviewSimulator";
import ProfileSubTab from "../../components/member/ProfileSubTab";
import DesignSubTab from "../../components/member/DesignSubTab";
import LinksSubTab from "../../components/member/LinksSubTab";
import CareerSubTab from "../../components/member/CareerSubTab";
import BodySubTab from "../../components/member/BodySubTab";

// Lazy-loaded Main Tabs
const MemberProjectsTab = React.lazy(() => import("../../components/member/MemberProjectsTab"));
const MemberServicesTab = React.lazy(() => import("../../components/member/MemberServicesTab"));
const MemberHistoryTab = React.lazy(() => import("../../components/member/MemberHistoryTab"));
const MemberManageTab = React.lazy(() => import("../../components/member/MemberManageTab"));
const MemberPartnerTab = React.lazy(() => import("../../components/member/MemberPartnerTab"));
const MemberUtilitiesTab = React.lazy(() => import("../../components/member/MemberUtilitiesTab"));

export default function MemberPortalPage() {
  const { t, i18n } = useTranslation();

  const memberSession = getMemberSession();
  const [bio, setBio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "" });
  const [showBirthdaySurprise, setShowBirthdaySurprise] = useState(false);
  const [verificationForm, setVerificationForm] = useState({
    fullName: memberSession?.displayName || "",
    birthday: "",
    schoolLevel: "",
    schoolName: "",
    phoneZalo: "",
    acceptTerms: false,
    acceptContact: false
  });
  const [verifying, setVerifying] = useState(false);

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

  // --- Chế độ Chăm sóc Sức khỏe Tinh thần (Healing Journey) ---
  const [showHealingModal, setShowHealingModal] = useState(false);
  const [healingState, setHealingState] = useState({
    active: false,
    day: 1,
    duration: 30,
    isExpired: false
  });
  const [healingMood, setHealingMood] = useState(3);
  const [healingNote, setHealingNote] = useState("");
  const [healingSubStep, setHealingSubStep] = useState("checkin"); // 'checkin', 'reminder', 'graduation'
  const [consecutiveLowMood, setConsecutiveLowMood] = useState(false);
  const [wheelRatings, setWheelRatings] = useState([5, 5, 5, 5, 5]);

  // Redirection states for MemberUtilitiesTab
  const [defaultUtility, setDefaultUtility] = useState(null);
  const [defaultPsychologySubTab, setDefaultPsychologySubTab] = useState("chat");
  const [defaultPsychologyPresetTest, setDefaultPsychologyPresetTest] = useState(null);

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
        const list = await memberService.getPartners();
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
        const guestBio = memberService.getGuestBio(t);
        if (guestBio) {
          setBio(guestBio);
          setFormData(guestBio);
        }
        setLoading(false);
        return;
      }

      if (!memberSession?.email) {
        setLoading(false);
        return;
      }

      try {
        const response = await memberService.getMemberBio(memberSession.email, memberSession.displayName, memberSession.avatarUrl);
        if (response?.bio) {
          const b = response.bio;
          setBio(b);

          // Alert user on successful student verification approval upon login
          if (b.status === 'active' && b.verificationRequest?.notifiedStatus === 'approved') {
            showToast("Bạn đã xác minh thành công mail giáo dục! 🎉", "success");
            memberService.dismissVerificationNotification(memberSession.email).catch(console.error);
            b.verificationRequest.notifiedStatus = 'done';
          }
          
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

  // --- Check-in Blocker logic for Mental Health Care Mode ---
  useEffect(() => {
    const mode = localStorage.getItem("banhocduong_healing_mode");
    if (mode === "active") {
      const startDateStr = localStorage.getItem("banhocduong_healing_start_date") || "";
      const duration = parseInt(localStorage.getItem("banhocduong_healing_duration") || "30", 10);
      const lastCheckIn = localStorage.getItem("banhocduong_last_checkin_date") || "";

      if (startDateStr) {
        const start = new Date(startDateStr).getTime();
        const now = new Date().getTime();
        const diffTime = Math.max(0, now - start);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

        if (diffDays > duration) {
          // Journey completed!
          setHealingState({
            active: true,
            day: diffDays,
            duration,
            isExpired: true
          });
          setHealingSubStep("graduation");
          setShowHealingModal(true);
        } else {
          // Check if checked in today
          const todayStr = new Date().toDateString();
          if (lastCheckIn !== todayStr) {
            setHealingState({
              active: true,
              day: diffDays,
              duration,
              isExpired: false
            });
            setHealingSubStep("checkin");
            setShowHealingModal(true);
          }
        }
      }
    }
  }, [activeTab]);

  useEffect(() => {
    if (showHealingModal && healingSubStep === "graduation") {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });
      
      const end = Date.now() + (3 * 1000);
      const interval = setInterval(() => {
        if (Date.now() > end) {
          return clearInterval(interval);
        }
        confetti({
          startVelocity: 30,
          spread: 360,
          ticks: 60,
          origin: { x: Math.random(), y: Math.random() - 0.2 }
        });
      }, 500);
      return () => clearInterval(interval);
    }
  }, [showHealingModal, healingSubStep]);

  const finalizeHealingCheckIn = (mood, note, wheelData) => {
    try {
      const rawLogs = localStorage.getItem("banhocduong_history");
      const logs = rawLogs ? JSON.parse(rawLogs) : [];
      
      const newLog = {
        date: new Date().toISOString(),
        type: "checkin",
        day: healingState.day,
        mood: mood,
        note: note,
        wheelRatings: wheelData
      };
      logs.push(newLog);
      localStorage.setItem("banhocduong_history", JSON.stringify(logs));
      localStorage.setItem("banhocduong_last_checkin_date", new Date().toDateString());

      // Check if consecutive low mood (<= 2) for last two checkins
      const checkins = logs.filter(item => item.type === "checkin");
      let consecutiveLow = false;
      if (checkins.length >= 2) {
        const last = checkins[checkins.length - 1];
        const prev = checkins[checkins.length - 2];
        if (last.mood <= 2 && prev.mood <= 2) {
          consecutiveLow = true;
        }
      }
      setConsecutiveLowMood(consecutiveLow);

      // Check if a clinical test is recommended:
      const lastTestDate = localStorage.getItem("banhocduong_last_test_date") || "";
      let needsTest = false;
      if (mood <= 2) {
        needsTest = true;
      } else if (lastTestDate) {
        const lastT = new Date(lastTestDate).getTime();
        const now = new Date().getTime();
        const diffDays = Math.floor((now - lastT) / (1000 * 60 * 60 * 24));
        const interval = mood >= 4 ? 6 : 3;
        if (diffDays >= interval) {
          needsTest = true;
        }
      } else {
        needsTest = true; // First check-in requires a baseline test
      }

      if (needsTest) {
        setHealingSubStep("reminder");
      } else {
        setShowHealingModal(false);
        if (mood >= 4) {
          showToast("Thật tuyệt khi biết hôm nay cậu có tâm trạng tốt! Hãy tiếp tục duy trì năng lượng tích cực này nhé! ☀️", "success");
        } else {
          showToast("Đã ghi nhận cảm xúc của cậu hôm nay! Chúc cậu một ngày tốt lành 🌟", "success");
        }
      }
    } catch (err) {
      console.error(err);
      setShowHealingModal(false);
    }
  };

  const handleHealingSubmit = () => {
    const isWheelDay = healingState.day === 1 || healingState.day % 3 === 0;
    if (isWheelDay) {
      // Direct to Wheel of life evaluation sub-step first
      setHealingSubStep("wheel");
    } else {
      finalizeHealingCheckIn(healingMood, healingNote, null);
    }
  };

  const handleHealingWheelSubmit = () => {
    finalizeHealingCheckIn(healingMood, healingNote, wheelRatings);
  };

  const handleGraduationConfirm = () => {
    // Purge all psychological data!
    localStorage.removeItem("banhocduong_healing_mode");
    localStorage.removeItem("banhocduong_healing_duration");
    localStorage.removeItem("banhocduong_healing_start_date");
    localStorage.removeItem("banhocduong_last_checkin_date");
    localStorage.removeItem("banhocduong_history");
    localStorage.removeItem("banhocduong_last_test_date");
    localStorage.removeItem("banhocduong_chat_distress_count");
    
    setShowHealingModal(false);
    showToast("Hoàn thành hành trình chữa lành! Cảm ơn cậu đã tin tưởng Bạn Học Đường 💖", "success");
  };

  const handleGoToTest = () => {
    setShowHealingModal(false);
    setDefaultUtility("psychology");
    setDefaultPsychologySubTab("tests");
    setDefaultPsychologyPresetTest("dass");
    setActiveTab("utilities");
    showToast("Đã chuyển hướng cậu đến bài trắc nghiệm lâm sàng DASS-42.", "success");
  };

  const handleGoToBreath = () => {
    setShowHealingModal(false);
    setDefaultUtility("psychology");
    setDefaultPsychologySubTab("breath");
    setDefaultPsychologyPresetTest(null);
    setActiveTab("utilities");
    showToast("Đã chuyển hướng cậu đến bài tập Hít thở 4-7-8.", "success");
  };

  const handleGoToChat = () => {
    setShowHealingModal(false);
    setDefaultUtility("psychology");
    setDefaultPsychologySubTab("chat");
    setDefaultPsychologyPresetTest(null);
    setActiveTab("utilities");
    showToast("Đã chuyển hướng cậu đến Trợ lý Bạn Học Đường.", "success");
  };

  const handleVerificationSubmit = async (e) => {
    e.preventDefault();
    if (!verificationForm.acceptTerms || !verificationForm.acceptContact) {
      showToast("Vui lòng đồng ý với các điều khoản để gửi yêu cầu xác minh.", "error");
      return;
    }
    if (!verificationForm.fullName || !verificationForm.birthday || !verificationForm.schoolLevel || !verificationForm.schoolName || !verificationForm.phoneZalo) {
      showToast("Vui lòng điền đầy đủ các thông tin yêu cầu.", "error");
      return;
    }
    
    setVerifying(true);
    try {
      const response = await memberService.submitVerification(memberSession.email, {
        fullName: verificationForm.fullName,
        birthday: verificationForm.birthday,
        schoolLevel: verificationForm.schoolLevel,
        schoolName: verificationForm.schoolName,
        phoneZalo: verificationForm.phoneZalo
      });
      if (response.success) {
        showToast("Gửi yêu cầu xác minh thành công! 🚀", "success");
        setBio(response.bio);
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || "Không thể gửi yêu cầu xác minh.", "error");
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    if (!bio || bio.status !== 'pending' || !bio.verificationRequest?.submitted || isGuestMode || !memberSession?.email) return;

    // Check status every 5 seconds
    const interval = setInterval(async () => {
      try {
        const response = await memberService.getMemberBio(memberSession.email, memberSession.displayName, memberSession.avatarUrl);
        if (response?.bio) {
          const b = response.bio;
          if (b.status === 'active' || b.status === 'rejected') {
            setBio(b);
            if (b.status === 'active') {
              setFormData(prev => ({
                ...prev,
                ...b,
                theme: {
                  ...prev.theme,
                  ...b.theme
                }
              }));
              showToast("Bạn đã xác minh thành công mail giáo dục! 🎉", "success");
              memberService.dismissVerificationNotification(memberSession.email).catch(console.error);
            }
          }
        }
      } catch (err) {
        console.error("Error polling bio status:", err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [bio?.status, bio?.verificationRequest?.submitted, isGuestMode, memberSession]);

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
  }, [formData.bio, activeTab, accountSubTab]);

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
      memberService.saveGuestBio(newData);
      showToast(t("memberPortal.toast.partnerLinkAdded"), "success");
    } else {
      handleSave(null, newData);
    }
  };

  const removeSocialLink = async (indexToKill) => {
    const updatedLinks = formData.links.filter((_, idx) => idx !== indexToKill);
    const newData = { ...formData, links: updatedLinks };
    setFormData(newData);

    if (isGuestMode) {
      setBio(newData);
      memberService.saveGuestBio(newData);
      showToast(t("memberPortal.toast.partnerLinkDeleted"), "success");
    } else {
      handleSave(null, newData);
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
        memberService.saveGuestBio(dataToSave);
        showToast(t("memberPortal.toast.partnerSaveSuccess"), "success");
      } else if (bio?._id) {
        const response = await memberService.updateMemberBio(bio._id, dataToSave);
        setBio(response.bio);
        showToast(t("memberPortal.toast.saveSuccess"), "success");
      } else {
        const response = await memberService.createMemberBio({
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
        memberService.deleteGuestBio();
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
        await memberService.deleteMemberBio(bio._id);
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
      const res = await memberService.redeemGiftCode(memberSession.email, giftCode);
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
      
      <AnimatePresence>
        {showHealingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-white/80 dark:bg-[#12111a]/80 backdrop-blur-2xl border border-zinc-200/50 dark:border-zinc-800/60 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[40px] pointer-events-none" />
              
              {/* Step 1: Graduation completed journey message */}
              {healingSubStep === "graduation" && (
                <div className="space-y-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-pink-500 to-indigo-500 flex items-center justify-center mx-auto text-white shadow-lg animate-bounce-short">
                    <span className="material-symbols-outlined text-2xl">workspace_premium</span>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[8.5px] font-black tracking-widest text-indigo-500 dark:text-indigo-400 uppercase">
                      Hành trình hoàn tất
                    </span>
                    <h3 className="text-base font-black text-zinc-900 dark:text-white uppercase tracking-wider">
                      Chúc mừng cậu đã hoàn thành!
                    </h3>
                    <p className="text-xs text-zinc-650 dark:text-zinc-350 leading-relaxed font-semibold">
                      Hành trình chữa lành của bạn đã hết rồi. Tớ hy vọng bạn đã vượt qua tất cả, bạn thực sự rất mạnh mẽ và xứng đáng được hạnh phúc... Nếu muốn kích hoạt lại, cậu sẽ cần thực hiện bài đánh giá mới vì toàn bộ dữ liệu trước đó đã được xóa sạch bảo mật.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleGraduationConfirm}
                    className="w-full py-3 bg-gradient-to-r from-pink-500 to-indigo-650 hover:from-pink-650 hover:to-indigo-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md active:scale-[0.98]"
                  >
                    Hoàn thành và Xóa dữ liệu bảo mật
                  </button>
                </div>
              )}

              {/* Step 2: Daily Check-in Form */}
              {healingSubStep === "checkin" && (
                <div className="space-y-5">
                  <div className="text-center space-y-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[8.5px] font-black tracking-widest bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 dark:text-indigo-400 uppercase">
                      Ngày {healingState.day} của lộ trình
                    </span>
                    <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider mt-1">
                      Hôm nay cậu thế nào?
                    </h3>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-450 leading-relaxed font-bold">
                      Hãy chia sẻ ngắn cảm xúc của cậu cùng Bạn Học Đường nhé.
                    </p>
                  </div>

                  {/* Emojis list selection */}
                  <div className="flex justify-between gap-2 py-2">
                    {[
                      { val: 1, char: "😢", label: "Rất tệ" },
                      { val: 2, char: "😕", label: "Hơi buồn" },
                      { val: 3, char: "😐", label: "Bình thường" },
                      { val: 4, char: "🙂", label: "Khá tốt" },
                      { val: 5, char: "😄", label: "Rất tuyệt" }
                    ].map((item) => (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => setHealingMood(item.val)}
                        className={`flex-1 py-3.5 rounded-2xl border text-center transition-all ${
                          healingMood === item.val
                            ? "bg-indigo-500/10 border-indigo-500 scale-[1.08] shadow-md shadow-indigo-500/5"
                            : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:scale-[1.02]"
                        }`}
                      >
                        <span className="text-2xl block">{item.char}</span>
                        <span className="text-[7.5px] font-black uppercase tracking-wider block mt-1">{item.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10.5px] font-bold text-zinc-500 dark:text-zinc-450 pl-0.5">
                      Ghi lại một chút suy nghĩ của cậu lúc này (nếu muốn):
                    </label>
                    <textarea
                      placeholder="Đồ án khó, thi cử áp lực, hay hôm nay là một ngày tuyệt vời..."
                      value={healingNote}
                      onChange={(e) => setHealingNote(e.target.value)}
                      className="w-full h-20 px-3 py-2.5 rounded-2xl border border-zinc-250 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/20 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-zinc-400 font-semibold"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleHealingSubmit}
                    className="w-full py-3 bg-gradient-to-r from-indigo-650 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md active:scale-[0.98]"
                  >
                    Tiếp tục
                  </button>
                </div>
              )}

              {/* Step 2b: Wheel of Life assessment sub-step */}
              {healingSubStep === "wheel" && (
                <div className="space-y-5 animate-scaleUp">
                  <div className="text-center space-y-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[8.5px] font-black tracking-widest bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 uppercase">
                      Cập nhật Bánh xe Cuộc sống
                    </span>
                    <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider mt-1">
                      Định vị Cân Bằng Hôm Nay
                    </h3>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-450 leading-relaxed font-bold">
                      Nhìn nhận mức độ hài lòng (1-10) trong 5 khía cạnh cốt lõi của cậu.
                    </p>
                  </div>

                  <div className="flex flex-col items-center gap-4">
                    {/* Compact Radar SVG */}
                    <div className="relative w-40 h-40 bg-white dark:bg-[#15141c] rounded-2xl border border-zinc-200/50 dark:border-zinc-800/40 shadow-inner flex items-center justify-center">
                      <svg className="w-full h-full" viewBox="0 0 300 300">
                        {/* Concentric grid lines pentagons */}
                        {[2, 4, 6, 8, 10].map((level) => {
                          const r = level * 10;
                          const pts = [90, 18, 306, 234, 162]
                            .map((angle) => {
                              const rad = (angle * Math.PI) / 180;
                              return `${150 + r * Math.cos(rad)},${150 - r * Math.sin(rad)}`;
                            })
                            .join(" ");
                          return (
                            <polygon
                              key={level}
                              points={pts}
                              fill="none"
                              className="stroke-zinc-200 dark:stroke-zinc-800"
                              strokeWidth="1"
                              strokeDasharray={level === 10 ? "0" : "3 3"}
                            />
                          );
                        })}

                        {/* Web spokes */}
                        {[90, 18, 306, 234, 162].map((angle, idx) => {
                          const rad = (angle * Math.PI) / 180;
                          const x = 150 + 100 * Math.cos(rad);
                          const y = 150 - 100 * Math.sin(rad);
                          return (
                            <line
                              key={idx}
                              x1={150}
                              y1={150}
                              x2={x}
                              y2={y}
                              className="stroke-zinc-200 dark:stroke-zinc-800"
                              strokeWidth="1"
                            />
                          );
                        })}

                        {/* Rating Polygon */}
                        <polygon
                          points={wheelRatings
                            .map((v, i) => {
                              const rad = ([90, 18, 306, 234, 162][i] * Math.PI) / 180;
                              const r = v * 10;
                              return `${150 + r * Math.cos(rad)},${150 - r * Math.sin(rad)}`;
                            })
                            .join(" ")}
                          fill="rgba(16, 185, 129, 0.12)"
                          className="stroke-emerald-500 dark:stroke-emerald-400"
                          strokeWidth="2.5"
                        />

                        {/* Axis Vertex Dots */}
                        {wheelRatings.map((v, i) => {
                          const rad = ([90, 18, 306, 234, 162][i] * Math.PI) / 180;
                          const r = v * 10;
                          return (
                            <circle
                              key={i}
                              cx={150 + r * Math.cos(rad)}
                              cy={150 - r * Math.sin(rad)}
                              r="4"
                              className="fill-emerald-500 dark:fill-emerald-450 stroke-white dark:stroke-[#15141c]"
                              strokeWidth="1.5"
                            />
                          );
                        })}
                      </svg>
                    </div>

                    {/* Sliders list */}
                    <div className="w-full space-y-2.5 max-h-48 overflow-y-auto pr-1">
                      {["Bản thân", "Học tập", "Công việc", "Gia đình", "Mối quan hệ"].map((cat, idx) => (
                        <div key={idx} className="space-y-0.5">
                          <div className="flex justify-between text-[10px] font-bold text-zinc-650 dark:text-zinc-450 pl-0.5">
                            <span>{cat}</span>
                            <span className="font-mono text-emerald-500 font-black">{wheelRatings[idx]}/10</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="10"
                            value={wheelRatings[idx]}
                            onChange={(e) => {
                              const copy = [...wheelRatings];
                              copy[idx] = parseInt(e.target.value, 10);
                              setWheelRatings(copy);
                            }}
                            className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleHealingWheelSubmit}
                    className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-650 hover:from-emerald-600 hover:to-teal-750 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md active:scale-[0.98]"
                  >
                    Gửi cảm xúc & Bắt đầu ngày mới
                  </button>
                </div>
              )}

              {/* Step 3: periodic test reminder prompt */}
              {healingSubStep === "reminder" && (
                <div className="space-y-5 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-550/10 border border-indigo-550/20 text-indigo-500 flex items-center justify-center mx-auto shadow-sm">
                    <span className="material-symbols-outlined text-2xl animate-pulse">quiz</span>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[8.5px] font-black tracking-widest text-indigo-500 dark:text-indigo-400 uppercase">
                      {consecutiveLowMood ? "Hỗ trợ phục hồi khẩn cấp" : "Đề xuất kiểm tra định kỳ"}
                    </span>
                    <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider">
                      {consecutiveLowMood ? "Hãy yêu thương bản thân hơn nhé" : "Đã đến lúc làm bài trắc nghiệm lâm sàng"}
                    </h3>
                    <p className="text-xs text-zinc-650 dark:text-zinc-350 leading-relaxed font-semibold max-w-sm mx-auto">
                      {consecutiveLowMood 
                        ? "Bạn Học Đường nhận thấy tâm trạng cậu đang khá trầm xuống liên tục trong 2 ngày qua. Hãy thực hành một số bài tập điều hòa nhịp thở hoặc trò chuyện tâm sự cùng tớ để lòng dịu lại nha." 
                        : "Bạn Học Đường nhận thấy tâm trạng cậu có chút mỏi mệt hoặc đã đến chu kỳ đánh giá định kỳ (3 ngày). Cậu hãy làm một bài test DASS-42 nhỏ để tớ đối chiếu chẩn đoán chính xác nhất nhé."
                      }
                    </p>
                  </div>
                  
                  {consecutiveLowMood ? (
                    <div className="flex flex-col gap-2 pt-2">
                      <button
                        type="button"
                        onClick={handleGoToBreath}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-[10px] font-black uppercase tracking-wider shadow-md transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-sm">air</span>
                        Luyện Hít Thở 4-7-8 (2 phút)
                      </button>
                      <button
                        type="button"
                        onClick={handleGoToChat}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-550 to-indigo-650 hover:from-indigo-650 hover:to-indigo-750 text-white text-[10px] font-black uppercase tracking-wider shadow-md transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-sm">forum</span>
                        Tâm sự giải tỏa cùng Trợ lý (3 phút)
                      </button>
                      <button
                        type="button"
                        onClick={handleGoToTest}
                        className="w-full py-2 rounded-xl border border-zinc-250 dark:border-zinc-800 text-[9.5px] font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors"
                      >
                        Làm test lâm sàng DASS-42
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowHealingModal(false);
                          showToast("Chúc cậu luôn kiên cường và bình an nhé! ❤️", "success");
                        }}
                        className="py-2 text-[9px] font-bold text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 uppercase tracking-wider"
                      >
                        Bỏ qua
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowHealingModal(false);
                          showToast("Cậu đã chọn làm khảo sát sau. Hãy chú ý giữ gìn sức khỏe nhé! 🌟", "success");
                        }}
                        className="py-2.5 rounded-xl border border-zinc-250 dark:border-zinc-800 text-[10px] font-black uppercase tracking-wider text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors"
                      >
                        Để sau
                      </button>
                      <button
                        type="button"
                        onClick={handleGoToTest}
                        className="py-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-[10px] font-black uppercase tracking-wider shadow-md transition-colors"
                      >
                        Làm test ngay
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Alert */}
      {toast.message && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/90 dark:bg-[#1c1c1e]/90 backdrop-blur-xl shadow-2xl border border-zinc-200/50 dark:border-zinc-800/80 w-[calc(100vw-32px)] max-w-md animate-toast-in">
          <span className={`material-symbols-outlined shrink-0 text-xl ${
            toast.type === "success" ? "text-[#34c759]" : toast.type === "warning" ? "text-[#ff9500]" : "text-[#ff3b30]"
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
                    <span className="material-symbols-outlined text-[10px] animate-pulse">local_activity</span>{t("memberPortal.bio.localSave")}
                  </span>
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
                className="md:hidden w-8 h-8 rounded-full border border-red-200/50 dark:border-red-950/40 bg-red-500/5 flex items-center justify-center text-red-500 hover:text-red-650 active:bg-red-500/10 active:scale-95 transition-all shadow-sm shrink-0"
                title={t("memberPortal.logout")}
              >
                <span className="material-symbols-outlined text-sm">logout</span>
              </button>
            )}
          </div>

          {!isGuestMode && (
            <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
              {/* iOS Style Segmented Control */}
              {bio?.status !== 'pending' && (
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
                    className={`w-1/5 py-1.5 text-[9px] sm:text-[11px] font-semibold rounded-full relative z-10 transition-colors duration-200 ${
                      activeTab === "account" ? "text-black dark:text-white font-bold" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800"
                    }`}
                  >{t("memberPortal.tabs.bio")}</button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("manage")}
                    className={`w-1/5 py-1.5 text-[9px] sm:text-[11px] font-semibold rounded-full relative z-10 transition-colors duration-200 ${
                      activeTab === "manage" ? "text-black dark:text-white font-bold" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800"
                    }`}
                  >{t("memberPortal.tabs.package")}</button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("partner")}
                    className={`w-1/5 py-1.5 text-[9px] sm:text-[11px] font-semibold rounded-full relative z-10 transition-colors duration-200 ${
                      activeTab === "partner" ? "text-black dark:text-white font-bold" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800"
                    }`}
                  >{t("memberPortal.tabs.partner")}</button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("utilities")}
                    className={`w-1/5 py-1.5 text-[9px] sm:text-[11px] font-semibold rounded-full relative z-10 transition-colors duration-200 ${
                      activeTab === "utilities" ? "text-black dark:text-white font-bold" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800"
                    }`}
                  >{t("memberPortal.tabs.utilities")}</button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("history")}
                    className={`w-1/5 py-1.5 text-[9px] sm:text-[11px] font-semibold rounded-full relative z-10 transition-colors duration-200 flex items-center justify-center gap-1.5 ${
                      activeTab === "history" ? "text-black dark:text-white font-bold" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800"
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
              )}

              {/* Desktop Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                className="hidden md:flex px-4 py-2 rounded-full border border-red-200 dark:border-red-900/30 bg-red-500/5 hover:bg-red-500/10 text-red-500 hover:text-red-650 dark:hover:text-red-400 items-center justify-center gap-1.5 text-[9px] sm:text-[11px] font-bold uppercase tracking-wider transition-all duration-200 shadow-sm shrink-0"
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
            {bio?.status === 'rejected' ? (
              <RejectedVerification handleLogout={handleLogout} />
            ) : bio?.status === 'pending' && !bio?.verificationRequest?.submitted ? (
              <VerificationForm 
                verificationForm={verificationForm} 
                setVerificationForm={setVerificationForm} 
                handleVerificationSubmit={handleVerificationSubmit} 
                handleLogout={handleLogout} 
                verifying={verifying} 
              />
            ) : bio?.status === 'pending' && bio?.verificationRequest?.submitted ? (
              <PendingVerification 
                fullName={bio?.verificationRequest?.fullName || memberSession?.displayName} 
                handleLogout={handleLogout} 
              />
            ) : (
              <>
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
                            <ProfileSubTab 
                              formData={formData}
                              handleFieldChange={handleFieldChange}
                              saving={saving}
                              isDragOver={isDragOver}
                              setIsDragOver={setIsDragOver}
                              processFile={processFile}
                              avatarInputRef={avatarInputRef}
                              handleAvatarChange={handleAvatarChange}
                              handleRemoveAvatar={handleRemoveAvatar}
                              memberSession={memberSession}
                              t={t}
                            />
                          )}

                          {/* design Sub-Tab */}
                          {accountSubTab === "design" && (
                            <DesignSubTab 
                              formData={formData}
                              setFormData={setFormData}
                              t={t}
                            />
                          )}

                          {/* links Sub-Tab */}
                          {accountSubTab === "links" && (
                            <LinksSubTab 
                              formData={formData}
                              newLinkLabel={newLinkLabel}
                              setNewLinkLabel={setNewLinkLabel}
                              newLinkUrl={newLinkUrl}
                              setNewLinkUrl={setNewLinkUrl}
                              handleLinkInputKeyDown={handleLinkInputKeyDown}
                              addSocialLink={addSocialLink}
                              removeSocialLink={removeSocialLink}
                              handleFieldChange={handleFieldChange}
                              bioTextareaRef={bioTextareaRef}
                              t={t}
                            />
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
                            <CareerSubTab 
                              formData={formData}
                              handleFieldChange={handleFieldChange}
                              t={t}
                            />
                          )}

                          {/* body Sub-Tab */}
                          {accountSubTab === "body" && (
                            <BodySubTab 
                              formData={formData}
                              handleFieldChange={handleFieldChange}
                              t={t}
                            />
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
                    <PreviewSimulator 
                      previewMode={previewMode}
                      setPreviewMode={setPreviewMode}
                      previewIframeRef={previewIframeRef}
                      slug={bio?.slug}
                      t={t}
                    />

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
                  <MemberUtilitiesTab 
                    bio={formData} 
                    publicLink={publicLink} 
                    showToast={showToast} 
                    setFormData={setFormData} 
                    handleSave={handleSave} 
                    defaultUtility={defaultUtility}
                    defaultPsychologySubTab={defaultPsychologySubTab}
                    defaultPsychologyPresetTest={defaultPsychologyPresetTest}
                  />
                )}

                {/* Tab 5: Lịch Sử & Thông Báo */}
                {activeTab === "history" && <MemberHistoryTab bio={bio} showToast={showToast} />}
              </>
            )}
          </React.Suspense>
        </ErrorBoundary>

        {/* Cropper Modal */}
        <CropModal 
          cropModal={cropModal}
          setCropModal={setCropModal}
          handleDragStart={handleDragStart}
          handleDragMove={handleDragMove}
          handleDragEnd={handleDragEnd}
          handleCropSave={handleCropSave}
          t={t}
        />

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
