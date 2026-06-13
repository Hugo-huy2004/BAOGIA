import { useTranslation } from "react-i18next";
import React, { useEffect, useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { getMemberSession, logoutAuth } from "../../services/authSession";
import ErrorBoundary from "../../components/ErrorBoundary";
import memberService from "../../services/classes/MemberService";
import dataApi from "../../services/dataApi";
import { useNotifications } from "../../hooks/useNotifications";
import { useHealingJourney } from "../../hooks/useHealingJourney";
import HealingModal from "../../components/member/portal/HealingModal";
import NotificationBell from "../../components/member/portal/NotificationBell";

// Sub-components
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

// Lazy-loaded main tabs
const MemberProjectsTab  = React.lazy(() => import("../../components/member/MemberProjectsTab"));
const MemberServicesTab  = React.lazy(() => import("../../components/member/MemberServicesTab"));
const MemberHistoryTab   = React.lazy(() => import("../../components/member/MemberHistoryTab"));
const MemberManageTab    = React.lazy(() => import("../../components/member/MemberManageTab"));
const MemberPartnerTab   = React.lazy(() => import("../../components/member/MemberPartnerTab"));
const MemberUtilitiesTab = React.lazy(() => import("../../components/member/MemberUtilitiesTab"));

function StatusBadge({ status }) {
  const cfg = {
    active:   { label: 'Đã xác minh', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', icon: 'verified' },
    pending:  { label: 'Đang chờ',    color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',   icon: 'pending' },
    rejected: { label: 'Bị từ chối',  color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',           icon: 'cancel' },
  };
  const c = cfg[status] || cfg.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${c.color}`}>
      <span className="material-symbols-outlined text-[10px]">{c.icon}</span>{c.label}
    </span>
  );
}

export default function MemberPortalPage() {
  const { t } = useTranslation();
  const memberSession = getMemberSession();

  // ── Core state ──────────────────────────────────────────────────────────────
  const [bio, setBio]         = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [showBirthdaySurprise, setShowBirthdaySurprise] = useState(false);
  const [verificationForm, setVerificationForm] = useState({
    fullName: memberSession?.displayName || "", birthday: "", schoolLevel: "",
    schoolName: "", phoneZalo: "", acceptTerms: false, acceptContact: false,
  });
  const [verifying, setVerifying] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, message: "", onConfirm: null });
  const triggerConfirm = (message, onConfirm) => setConfirmModal({ isOpen: true, message, onConfirm });

  // ── Tab state ────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab]         = useState("account");
  const [accountSubTab, setAccountSubTab] = useState("profile");
  const [mobileSubSection, setMobileSubSection] = useState(null); // mobile section detail
  const [previewMode, setPreviewMode]     = useState("mobile");
  const [mobileView, setMobileView]       = useState("edit");

  // ── Utilities redirect state ─────────────────────────────────────────────────
  const [defaultUtility, setDefaultUtility] = useState(null);
  const [defaultPsychologySubTab, setDefaultPsychologySubTab] = useState("chat");
  const [defaultPsychologyPresetTest, setDefaultPsychologyPresetTest] = useState(null);

  // ── History unread badge ─────────────────────────────────────────────────────
  const [readHistoryTimestamp, setReadHistoryTimestamp] = useState(
    () => localStorage.getItem("read_history_timestamp") || null
  );
  useEffect(() => {
    if (activeTab === "history" && bio?.history?.length > 0) {
      const ts = bio.history[bio.history.length - 1].timestamp;
      setReadHistoryTimestamp(ts); localStorage.setItem("read_history_timestamp", ts);
    }
  }, [activeTab, bio?.history]);
  const unreadHistoryCount = useMemo(() => {
    if (!bio?.history?.length) return 0;
    if (!readHistoryTimestamp) return bio.history.length;
    const ref = new Date(readHistoryTimestamp).getTime();
    return bio.history.filter(e => new Date(e.timestamp).getTime() > ref).length;
  }, [bio?.history, readHistoryTimestamp]);

  // ── Partners ──────────────────────────────────────────────────────────────────
  const [partners, setPartners] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [partnerSearch, setPartnerSearch]     = useState("");
  const [partnerPage, setPartnerPage]         = useState(1);
  useEffect(() => {
    memberService.getPartners().then(list => { setPartners(list); if (list.length) setSelectedPartner(list[0]); }).catch(console.error);
  }, []);
  const PARTNERS_PER_PAGE  = 12;
  const filteredPartners   = partners.filter(p => p.name.toLowerCase().includes(partnerSearch.toLowerCase()));
  const paginatedPartners  = filteredPartners.slice((partnerPage-1)*PARTNERS_PER_PAGE, partnerPage*PARTNERS_PER_PAGE);

  // ── Form state ────────────────────────────────────────────────────────────────
  const emptyTheme = { bgColor:"#ffffff", textColor:"#0f172a", accentColor:"#6366f1", pattern:"none", preset:"default", btnRadius:16, btnBorderWidth:0, btnShadow:4, template:"default" };
  const [formData, setFormData] = useState({
    displayName: memberSession?.displayName || "", headline:"", bio:"", birthday:"", phone:"",
    hobbies:"", height:"", weight:"", measurements:"", address:"", education:"", skills:"",
    jobTitle:"", contactEmail:"", avatarUrl:"", links:[], theme: emptyTheme, tabs:[], projects:[], services:[],
  });
  const [newLinkLabel, setNewLinkLabel] = useState("");
  const [newLinkUrl, setNewLinkUrl]     = useState("");
  const [cropModal, setCropModal]       = useState({ isOpen:false, imageSrc:null, zoom:1, aspect:1, offset:{x:0,y:0} });
  const [isDragging, setIsDragging]     = useState(false);
  const [startPos, setStartPos]         = useState({ x:0, y:0 });
  const [isDragOver, setIsDragOver]     = useState(false);

  const avatarInputRef  = useRef(null);
  const bioTextareaRef  = useRef(null);
  const previewIframeRef = useRef(null);

  // ── Smart notification system ─────────────────────────────────────────────────
  const { notifications, unreadCount: unreadNotifCount, toast, setToast,
    showToast, sendNotification, markRead, markAllRead, dismiss, refresh: refreshInbox,
  } = useNotifications(memberSession?.email || null);

  // ── Healing journey hook ──────────────────────────────────────────────────────
  const isEmbedded = useMemo(() => window.self !== window.top || new URLSearchParams(window.location.search).get("embed") === "true", []);
  const isGuestMode = useMemo(() => isEmbedded && !memberSession?.email, [isEmbedded, memberSession]);
  const publicLink  = useMemo(() => bio?.slug ? `${window.location.origin}/bio/${bio.slug}` : "", [bio]);

  const healing = useHealingJourney({
    email: memberSession?.email || null,
    onNavigate: (tab, utility, subTab, presetTest) => {
      setDefaultUtility(utility); setDefaultPsychologySubTab(subTab);
      setDefaultPsychologyPresetTest(presetTest); setActiveTab(tab);
    },
    showToast, sendNotification,
  });

  useEffect(() => { healing.syncFromStorage(); }, [activeTab]); // eslint-disable-line

  // ── Mobile account section definitions ───────────────────────────────────────
  const ACCOUNT_SECTIONS = useMemo(() => [
    { id:'profile',  label:'Cá nhân',    sub:'Ảnh đại diện, tên & giới thiệu',   icon:'person',          grad:'from-[#0071e3] to-[#5856d6]'  },
    { id:'design',   label:'Giao diện',  sub:'Màu sắc, nền & template bio',       icon:'palette',         grad:'from-[#af52de] to-[#5856d6]'  },
    { id:'links',    label:'Liên kết',   sub:`${formData.links?.length||0} link xã hội`, icon:'link',    grad:'from-[#ff9500] to-[#ff3b30]'  },
    { id:'projects', label:'Dự án',      sub:`${formData.projects?.length||0} dự án nổi bật`, icon:'folder_special', grad:'from-[#30b0c7] to-[#0071e3]' },
    { id:'services', label:'Dịch vụ',    sub:`${formData.services?.length||0} dịch vụ`,  icon:'storefront', grad:'from-[#34c759] to-[#30b0c7]' },
    { id:'career',   label:'Học vấn',    sub:'Kỹ năng & kinh nghiệm',             icon:'school',          grad:'from-[#ffd60a] to-[#ff9500]'  },
    { id:'body',     label:'Thể trạng',  sub:'Chiều cao, cân nặng & số đo',       icon:'monitor_heart',   grad:'from-[#ff453a] to-[#af52de]'  },
  ], [formData.links?.length, formData.projects?.length, formData.services?.length]);

  // ── Render account sub-tab form (shared desktop + mobile) ────────────────────
  const renderAccountForm = (tabId) => {
    switch(tabId) {
      case 'profile':  return <ProfileSubTab formData={formData} handleFieldChange={handleFieldChange} saving={saving} isDragOver={isDragOver} setIsDragOver={setIsDragOver} processFile={processFile} avatarInputRef={avatarInputRef} handleAvatarChange={handleAvatarChange} handleRemoveAvatar={handleRemoveAvatar} memberSession={memberSession} t={t} />;
      case 'design':   return <DesignSubTab formData={formData} setFormData={setFormData} t={t} />;
      case 'links':    return <LinksSubTab formData={formData} newLinkLabel={newLinkLabel} setNewLinkLabel={setNewLinkLabel} newLinkUrl={newLinkUrl} setNewLinkUrl={setNewLinkUrl} handleLinkInputKeyDown={handleLinkInputKeyDown} addSocialLink={addSocialLink} removeSocialLink={removeSocialLink} handleFieldChange={handleFieldChange} bioTextareaRef={bioTextareaRef} t={t} />;
      case 'projects': return <MemberProjectsTab formData={formData} setFormData={setFormData} handleSave={handleSave} showToast={showToast} isGuestMode={isGuestMode} bio={bio} />;
      case 'services': return <MemberServicesTab formData={formData} setFormData={setFormData} handleSave={handleSave} showToast={showToast} isGuestMode={isGuestMode} bio={bio} />;
      case 'career':   return <CareerSubTab formData={formData} handleFieldChange={handleFieldChange} t={t} />;
      case 'body':     return <BodySubTab formData={formData} handleFieldChange={handleFieldChange} t={t} />;
      default: return null;
    }
  };

  // ── Bio loading ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlTab = params.get("tab");
    if (urlTab) setActiveTab(urlTab);
  }, []);

  useEffect(() => {
    const load = async () => {
      if (isGuestMode) {
        const g = memberService.getGuestBio(t);
        if (g) { setBio(g); setFormData(g); }
        setLoading(false); return;
      }
      if (!memberSession?.email) { setLoading(false); return; }
      try {
        const res = await memberService.getMemberBio(memberSession.email, memberSession.displayName, memberSession.avatarUrl);
        if (res?.bio) {
          const b = res.bio;
          setBio(b);
          if (b.status === 'active' && b.verificationRequest?.notifiedStatus === 'approved') {
            sendNotification({ category: 'verification', type: 'success', title: 'Xác minh tài khoản thành công! 🎉', message: 'Email giáo dục của bạn đã được xác nhận. Chào mừng đến với Hugo Studio!' });
            memberService.dismissVerificationNotification(memberSession.email).catch(console.error);
            b.verificationRequest.notifiedStatus = 'done';
          }
          if (b.birthday) {
            const parts = b.birthday.trim().split(/[-/]/);
            let day = parseInt(parts[0], 10), month = parseInt(parts[1], 10);
            if (parts[0].length === 4) { day = parseInt(parts[2], 10); month = parseInt(parts[1], 10); }
            const now = new Date();
            if (day === now.getDate() && month === now.getMonth()+1) {
              const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
              if (localStorage.getItem("bday_effect_shown") !== todayStr) { setShowBirthdaySurprise(true); localStorage.setItem("bday_effect_shown", todayStr); }
            }
          }
          setFormData({
            email: b.email||"", displayName: b.displayName||memberSession.displayName||"", headline: b.headline||"",
            bio: b.bio||"", birthday: b.birthday||"", phone: b.phone||"", hobbies: b.hobbies||"",
            height: b.height||"", weight: b.weight||"", measurements: b.measurements||"",
            address: b.address||"", education: b.education||"", skills: b.skills||"",
            jobTitle: b.jobTitle||"", contactEmail: b.contactEmail||"", avatarUrl: b.avatarUrl||"",
            links: b.links||[], theme: { ...emptyTheme, ...b.theme }, tabs: b.tabs||[],
            projects: b.projects||[], services: b.services||[], secretLinks: b.secretLinks||[], slug: b.slug||"",
          });
          try {
            const comp = await dataApi.getCompanionHistory(memberSession.email);
            if (comp) {
              healing.setHistoryLogs(comp.historyLogs || []);
              if (comp.healingActive && comp.healingStartDate) {
                const diffDays = Math.floor((Date.now() - new Date(comp.healingStartDate).getTime()) / 86_400_000) + 1;
                healing.setState({ active: comp.healingActive, day: diffDays, duration: comp.healingDuration, isExpired: diffDays > comp.healingDuration });
              }
              ['mode','duration','start_date','last_checkin_date','last_test_date','chat_distress_count'].forEach(k => {
                const val = { mode: comp.healingActive?'active':'', duration: comp.healingDuration, start_date: comp.healingStartDate||'', last_checkin_date: comp.lastCheckinDate||'', last_test_date: comp.lastTestDate||'', chat_distress_count: comp.chatDistressCount||0 }[k];
                localStorage.setItem(`banhocduong_${k}`, String(val));
              });
              localStorage.setItem("banhocduong_history", JSON.stringify(comp.historyLogs||[]));
            }
          } catch (_) {}
        }
      } catch (err) { showToast(t("memberPortal.toast.loadError"), "error"); }
      finally { setLoading(false); }
    };
    load();
  }, [memberSession?.email, isGuestMode]); // eslint-disable-line

  // Verification polling
  useEffect(() => {
    if (!bio || bio.status !== 'pending' || !bio.verificationRequest?.submitted || isGuestMode || !memberSession?.email) return;
    const interval = setInterval(async () => {
      try {
        const res = await memberService.getMemberBio(memberSession.email, memberSession.displayName, memberSession.avatarUrl);
        if (res?.bio) {
          const b = res.bio;
          if (b.status === 'active' || b.status === 'rejected') {
            setBio(b);
            if (b.status === 'active') {
              setFormData(prev => ({ ...prev, ...b, theme: { ...prev.theme, ...b.theme } }));
              sendNotification({ category: 'verification', type: 'success', title: 'Xác minh tài khoản thành công! 🎉', message: 'Email giáo dục của bạn đã được xác nhận.' });
              memberService.dismissVerificationNotification(memberSession.email).catch(console.error);
            } else {
              sendNotification({ category: 'verification', type: 'error', title: 'Yêu cầu xác minh bị từ chối', message: 'Vui lòng kiểm tra lại thông tin và gửi lại yêu cầu.' });
            }
          }
        }
      } catch (_) {}
    }, 5000);
    return () => clearInterval(interval);
  }, [bio?.status, bio?.verificationRequest?.submitted, isGuestMode, memberSession]); // eslint-disable-line

  // Preview iframe sync
  useEffect(() => {
    const post = () => previewIframeRef.current?.contentWindow?.postMessage({ type:"UPDATE_PREVIEW", payload: formData }, "*");
    post();
    const handler = (e) => { if (e.data?.type === "PREVIEW_READY") post(); };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [formData]);

  // Bio textarea auto-height
  useEffect(() => {
    if (bioTextareaRef.current) { bioTextareaRef.current.style.height = "auto"; bioTextareaRef.current.style.height = `${bioTextareaRef.current.scrollHeight}px`; }
  }, [formData.bio, activeTab, accountSubTab, mobileSubSection]);

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const handleLogout = () => { logoutAuth(); window.location.href = "/login"; };

  const handleVerificationSubmit = async (e) => {
    e.preventDefault();
    if (!verificationForm.acceptTerms || !verificationForm.acceptContact) { showToast("Vui lòng đồng ý với điều khoản.", "error"); return; }
    if (!verificationForm.fullName || !verificationForm.birthday || !verificationForm.schoolLevel || !verificationForm.schoolName || !verificationForm.phoneZalo) { showToast("Vui lòng điền đầy đủ thông tin.", "error"); return; }
    setVerifying(true);
    try {
      const res = await memberService.submitVerification(memberSession.email, { fullName: verificationForm.fullName, birthday: verificationForm.birthday, schoolLevel: verificationForm.schoolLevel, schoolName: verificationForm.schoolName, phoneZalo: verificationForm.phoneZalo });
      if (res.success) { showToast("Gửi yêu cầu xác minh thành công! 🚀", "success"); setBio(res.bio); }
    } catch (err) { showToast(err.message || "Không thể gửi yêu cầu.", "error"); }
    finally { setVerifying(false); }
  };

  const processFile = (file) => {
    if (!file) return;
    if (file.size > 20*1024*1024) { showToast(t("memberPortal.toast.largeImage"), "warning"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image(); img.src = ev.target.result;
      img.onload = () => setCropModal({ isOpen:true, imageSrc:ev.target.result, zoom:1, aspect: img.width/img.height, offset:{x:0,y:0} });
    };
    reader.readAsDataURL(file);
  };
  const handleAvatarChange = (e) => { processFile(e.target.files[0]); e.target.value = ""; };
  const handleDragStart = (e) => { if (e.cancelable) e.preventDefault(); setIsDragging(true); setStartPos({ x:(e.touches?e.touches[0].clientX:e.clientX)-cropModal.offset.x, y:(e.touches?e.touches[0].clientY:e.clientY)-cropModal.offset.y }); };
  const handleDragMove = (e) => { if (!isDragging) return; setCropModal(p => ({ ...p, offset:{ x:(e.touches?e.touches[0].clientX:e.clientX)-startPos.x, y:(e.touches?e.touches[0].clientY:e.clientY)-startPos.y } })); };
  const handleDragEnd  = () => setIsDragging(false);
  const handleCropSave = () => {
    const img = new Image(); img.src = cropModal.imageSrc;
    img.onload = () => {
      const c = document.createElement("canvas"); c.width = c.height = 1024;
      const ctx = c.getContext("2d");
      const bw = 192, bh = bw/cropModal.aspect, zw = bw*cropModal.zoom, zh = bh*cropModal.zoom, sc = 1024/192;
      ctx.fillStyle = "#fff"; ctx.fillRect(0,0,1024,1024);
      ctx.drawImage(img, ((96-zw/2)+cropModal.offset.x)*sc, ((96-zh/2)+cropModal.offset.y)*sc, zw*sc, zh*sc);
      setFormData(p => ({ ...p, avatarUrl: c.toDataURL("image/webp", 0.9) }));
      setCropModal({ isOpen:false, imageSrc:null, zoom:1, aspect:1, offset:{x:0,y:0} });
      showToast(t("memberPortal.toast.cropSuccess"), "success");
    };
  };
  const handleRemoveAvatar = () => { setFormData(p => ({ ...p, avatarUrl:"" })); showToast(t("memberPortal.toast.avatarRemovedTemp"), "success"); };

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    if (name === "bio" && value.trim().split(/\s+/).filter(Boolean).length > 110) { showToast(t("memberPortal.toast.descLimit"), "warning"); return; }
    setFormData(p => ({ ...p, [name]: value }));
  };

  const addSocialLink = async () => {
    if (formData.links.length >= 5) { showToast(t("memberPortal.toast.linkLimit"), "warning"); return; }
    if (!newLinkLabel.trim() || !newLinkUrl.trim()) { showToast(t("memberPortal.toast.linkEmpty"), "warning"); return; }
    const newData = { ...formData, links: [...formData.links, { label:newLinkLabel.trim(), url:newLinkUrl.trim() }] };
    setFormData(newData); setNewLinkLabel(""); setNewLinkUrl("");
    isGuestMode ? (setBio(newData), memberService.saveGuestBio(newData), showToast(t("memberPortal.toast.partnerLinkAdded"), "success")) : handleSave(null, newData);
  };
  const removeSocialLink = (idx) => {
    const newData = { ...formData, links: formData.links.filter((_,i)=>i!==idx) };
    setFormData(newData);
    isGuestMode ? (setBio(newData), memberService.saveGuestBio(newData), showToast(t("memberPortal.toast.partnerLinkDeleted"), "success")) : handleSave(null, newData);
  };
  const handleLinkInputKeyDown = (e) => { if (e.key === "Enter") { e.preventDefault(); addSocialLink(); } };

  const handleSave = async (e, override = null) => {
    if (e) e.preventDefault();
    const data = override || formData;
    if (data.bio && data.bio.trim().split(/\s+/).filter(Boolean).length > 110) { showToast(t("memberPortal.toast.descLimitExceeded"), "error"); return; }
    setSaving(true);
    try {
      if (isGuestMode) { setBio(data); memberService.saveGuestBio(data); showToast(t("memberPortal.toast.partnerSaveSuccess"), "success"); }
      else if (bio?._id) { const r = await memberService.updateMemberBio(bio._id, data); setBio(r.bio); showToast(t("memberPortal.toast.saveSuccess"), "success"); }
      else { const r = await memberService.createMemberBio({ ...data, email: memberSession.email }); setBio(r.bio); showToast(t("memberPortal.toast.activateSuccess"), "success"); }
    } catch (err) { showToast(err.message || t("memberPortal.toast.saveError"), "error"); }
    finally { setSaving(false); }
  };

  const emptyFormReset = (guest=false) => ({
    displayName: guest ? "HUGO STUDIO PARTNER GUEST" : (memberSession?.displayName||""),
    headline:"", bio:"", birthday:"", phone:"", hobbies:"", height:"", weight:"", measurements:"", address:"",
    education:"", skills:"", jobTitle:"", contactEmail:"", avatarUrl:"", links:[],
    theme: guest ? { ...emptyTheme, bgColor:"#0f172a", textColor:"#f8fafc" } : emptyTheme, tabs:[],
  });

  const handleDeleteBio = () => {
    if (isGuestMode) {
      triggerConfirm(t("memberPortal.confirm.deletePartner"), () => { memberService.deleteGuestBio(); setBio(null); setFormData(emptyFormReset(true)); showToast(t("memberPortal.toast.deleteLocalSuccess"), "success"); });
      return;
    }
    if (!bio?._id) return;
    triggerConfirm(t("memberPortal.confirm.deletePersonal"), async () => {
      setSaving(true);
      try { await memberService.deleteMemberBio(bio._id); setBio(null); setFormData(emptyFormReset(false)); showToast(t("memberPortal.toast.deletePersonalSuccess"), "success"); setActiveTab("account"); }
      catch (_) { showToast(t("memberPortal.toast.deletePersonalError"), "error"); }
      finally { setSaving(false); }
    });
  };

  const handleCopyLink = async () => { if (!publicLink) return; await navigator.clipboard.writeText(publicLink); showToast(t("memberPortal.toast.copySuccess"), "success"); };
  const handleRedeemCode = async (code) => {
    if (!code) return; setSaving(true);
    try {
      const r = await memberService.redeemGiftCode(memberSession.email, code);
      if (r.bio) { setBio(r.bio); sendNotification({ category:'package', type:'success', title:'Gói dịch vụ đã được kích hoạt!', message: r.message || t("memberPortal.toast.giftSuccess") }); }
    } catch (err) { showToast(err.message || t("memberPortal.toast.giftError"), "error"); }
    finally { setSaving(false); }
  };

  // ── Tab definitions ───────────────────────────────────────────────────────────
  const TABS = [
    { id:"account",   label: t("memberPortal.tabs.bio"),       icon:"person",          partner: false },
    { id:"manage",    label: t("memberPortal.tabs.package"),    icon:"card_membership", partner: false },
    { id:"partner",   label: t("memberPortal.tabs.partner"),    icon:"handshake",       partner: true  },
    { id:"utilities", label: t("memberPortal.tabs.utilities"),  icon:"apps",            partner: false },
    { id:"history",   label: t("memberPortal.tabs.history"),    icon:"history",         partner: false },
  ];
  const onTabClick = (tab) => {
    if (tab.partner) { window.open("https://hwagfu.dev", "_blank", "noopener,noreferrer"); return; }
    setActiveTab(tab.id); setMobileSubSection(null);
  };

  // ── Loading screen ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#f5f5f7] dark:bg-[#000000]">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-[10px] text-zinc-450 font-bold uppercase tracking-widest">{t("memberPortal.loadingConfig")}</p>
        </div>
      </div>
    );
  }

  // ── Active section info (mobile) ──────────────────────────────────────────────
  const activeSectionInfo = ACCOUNT_SECTIONS.find(s => s.id === mobileSubSection);

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f5f5f7] dark:bg-[#000000] text-[#1d1d1f] dark:text-[#f5f5f7] font-body selection:bg-[#0071e3]/20 transition-colors duration-300">

      <HealingModal
        showModal={healing.showModal} subStep={healing.subStep} state={healing.state}
        mood={healing.mood} setMood={healing.setMood} note={healing.note} setNote={healing.setNote}
        consecutiveLow={healing.consecutiveLow} wheelRatings={healing.wheelRatings} setWheelRatings={healing.setWheelRatings}
        historyLogs={healing.historyLogs} onSubmit={healing.handleSubmit} onWheelSubmit={healing.handleWheelSubmit}
        onGraduation={healing.handleGraduation} onGoToTest={healing.goToTest} onGoToBreath={healing.goToBreath}
        onGoToChat={healing.goToChat}
        onDismiss={() => { healing.setShowModal(false); showToast("Chúc cậu luôn kiên cường và bình an nhé! ❤️", "success"); }}
        showToast={showToast}
      />

      {/* Toast */}
      <AnimatePresence>
        {toast.message && (
          <motion.div key="toast"
            initial={{ opacity:0, y:-16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-16 }}
            transition={{ type:"spring", stiffness:400, damping:28 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-xl shadow-2xl border border-zinc-200/60 dark:border-zinc-800/80 w-[calc(100vw-32px)] max-w-md"
          >
            <span className={`material-symbols-outlined shrink-0 text-xl ${toast.type==="success"?"text-[#34c759]":toast.type==="warning"?"text-[#ff9500]":"text-[#ff3b30]"}`} style={{ fontVariationSettings:"'FILL' 1" }}>
              {toast.type==="success"?"check_circle":toast.type==="warning"?"warning":"error"}
            </span>
            <p className="flex-1 text-[11px] sm:text-xs font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] leading-relaxed">{toast.message}</p>
            <button type="button" onClick={()=>setToast({message:"",type:""})} className="text-zinc-400 hover:text-zinc-600 shrink-0 transition-colors">
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background decorators */}
      <div className="absolute top-0 left-1/4 w-[40%] h-[400px] bg-gradient-to-br from-[#0071e3]/8 to-[#5856d6]/8 rounded-full filter blur-[120px] pointer-events-none opacity-60 dark:opacity-20" />
      <div className="absolute top-1/3 right-1/4 w-[35%] h-[350px] bg-gradient-to-br from-[#30b0c7]/8 to-[#34c759]/5 rounded-full filter blur-[100px] pointer-events-none opacity-40 dark:opacity-10" />

      <div className="max-w-6xl mx-auto px-3 sm:px-4 pt-4 sm:pt-6 md:pt-8 pb-28 md:pb-12 space-y-5 sm:space-y-6 relative z-10">

        {/* ── Portal Header ─────────────────────────────────────────────────── */}
        <header className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-2xl backdrop-saturate-200 border border-white/30 dark:border-zinc-800/40 rounded-2xl px-4 sm:px-5 py-3.5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            {/* Left */}
            <div className="flex items-center gap-3 min-w-0">
              {/* Back button on mobile sub-section */}
              {mobileSubSection && (
                <button type="button" onClick={() => setMobileSubSection(null)}
                  className="md:hidden w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 active:scale-90 transition-transform">
                  <span className="material-symbols-outlined text-sm text-zinc-600 dark:text-zinc-300">arrow_back_ios_new</span>
                </button>
              )}
              <div className={`relative shrink-0 ${mobileSubSection ? 'hidden md:block' : ''}`}>
                {formData.avatarUrl ? (
                  <img src={formData.avatarUrl} alt="avatar" className="w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-zinc-800 shadow-sm" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0071e3] to-[#5856d6] flex items-center justify-center text-white font-black text-sm shadow-sm">
                    {(formData.displayName||"?")[0]?.toUpperCase()}
                  </div>
                )}
                {bio?.status === 'active' && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-zinc-900" />
                )}
              </div>
              <div className="min-w-0">
                {mobileSubSection ? (
                  <div className="md:hidden">
                    <p className="text-xs font-black text-zinc-800 dark:text-white truncate">{activeSectionInfo?.label}</p>
                    <p className="text-[9px] text-zinc-400 truncate">{activeSectionInfo?.sub}</p>
                  </div>
                ) : null}
                <div className={mobileSubSection ? 'hidden md:block' : ''}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[#0071e3] dark:text-[#0a84ff]">
                      {isGuestMode ? t("memberPortal.titlePartner") : t("memberPortal.titleStudent")}
                    </span>
                    {bio?.status && !isGuestMode && <StatusBadge status={bio.status} />}
                  </div>
                  <h1 className="text-sm sm:text-base font-bold tracking-tight text-black dark:text-white truncate">
                    {isGuestMode ? t("memberPortal.designYourBio") : `${t("memberPortal.greeting")}, ${memberSession?.displayName || t("memberPortal.student")}`}
                  </h1>
                  <p className="text-[9px] sm:text-[10px] text-zinc-400 truncate hidden sm:block">{memberSession?.email}</p>
                </div>
              </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-3 shrink-0">
              {!isGuestMode && (
                <NotificationBell notifications={notifications} unreadCount={unreadNotifCount}
                  onMarkRead={markRead} onMarkAllRead={markAllRead} onDismiss={dismiss} onOpen={refreshInbox} />
              )}
              <button type="button" onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-red-200/60 dark:border-red-900/30 bg-red-500/5 hover:bg-red-500/10 text-red-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider transition-all duration-200">
                <span className="material-symbols-outlined text-sm">logout</span>
                <span className="hidden sm:inline">{t("memberPortal.logout")}</span>
              </button>
            </div>
          </div>

          {/* Desktop tab navigation */}
          {!isGuestMode && bio?.status !== 'pending' && (
            <div className="hidden md:flex items-center gap-1 mt-3 pt-3 border-t border-zinc-200/50 dark:border-zinc-800/30">
              {TABS.map(tab => {
                const isActive = !tab.partner && activeTab === tab.id;
                return (
                  <button key={tab.id} type="button" onClick={() => onTabClick(tab)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[10px] sm:text-[11px] font-bold transition-all duration-200 relative ${
                      isActive ? 'bg-black/8 dark:bg-white/10 text-black dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/40'
                    }`}>
                    <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>{tab.icon}</span>
                    <span>{tab.label}</span>
                    {tab.partner && <span className="material-symbols-outlined text-[9px] opacity-50">open_in_new</span>}
                    {tab.id === 'history' && unreadHistoryCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[8px] font-black px-1 py-0.5 rounded-full min-w-[14px] text-center leading-none shadow-sm">
                        {unreadHistoryCount > 99 ? '99+' : unreadHistoryCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </header>

        {/* ── Tab Content ─────────────────────────────────────────────────────── */}
        <ErrorBoundary>
          <React.Suspense fallback={
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-zinc-200 border-t-zinc-800 dark:border-zinc-800 dark:border-t-white" />
              <p className="text-xs text-zinc-500 font-medium tracking-wide uppercase">Đang tải...</p>
            </div>
          }>
            {bio?.status === 'rejected' ? (
              <RejectedVerification handleLogout={handleLogout} />
            ) : bio?.status === 'pending' && !bio?.verificationRequest?.submitted ? (
              <VerificationForm verificationForm={verificationForm} setVerificationForm={setVerificationForm} handleVerificationSubmit={handleVerificationSubmit} handleLogout={handleLogout} verifying={verifying} />
            ) : bio?.status === 'pending' && bio?.verificationRequest?.submitted ? (
              <PendingVerification fullName={bio?.verificationRequest?.fullName || memberSession?.displayName} handleLogout={handleLogout} />
            ) : (
              <>
                {/* ── Account Tab ───────────────────────────────────────────── */}
                {activeTab === "account" && (
                  <div className="space-y-4">

                    {/* ── DESKTOP layout (md+): sidebar + form + preview ──── */}
                    <div className="hidden md:block animate-fadeIn">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        {/* Form column */}
                        <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                          {/* Vertical sub-tab sidebar */}
                          <div className="md:col-span-3 flex flex-col gap-1.5 sticky top-20 z-20">
                            {[
                              { id:"profile",  label:t("memberPortal.sidebar.personal"), icon:"person" },
                              { id:"design",   label:t("memberPortal.sidebar.theme"),    icon:"palette" },
                              { id:"links",    label:t("memberPortal.sidebar.links"),    icon:"link" },
                              { id:"projects", label:t("memberPortal.sidebar.projects"), icon:"folder_special" },
                              { id:"services", label:t("memberPortal.sidebar.services"), icon:"storefront" },
                              { id:"career",   label:t("memberPortal.sidebar.career"),   icon:"school" },
                              { id:"body",     label:t("memberPortal.sidebar.physical"), icon:"straighten" },
                            ].map(tab => {
                              const active = accountSubTab === tab.id;
                              return (
                                <button key={tab.id} type="button" onClick={() => setAccountSubTab(tab.id)}
                                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-[10px] font-black uppercase tracking-wider transition-all duration-200 border ${
                                    active ? "bg-[#0071e3] border-[#0071e3] text-white shadow-md shadow-[#0071e3]/10 translate-x-1" : "bg-white dark:bg-[#1c1c1e] text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 border-zinc-200 dark:border-zinc-800/60"
                                  }`}>
                                  <span className="material-symbols-outlined text-base shrink-0" style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>{tab.icon}</span>
                                  <span className="truncate">{tab.label}</span>
                                </button>
                              );
                            })}
                          </div>
                          {/* Form pane */}
                          <div className="md:col-span-9 space-y-4">
                            <form onSubmit={e => { e.preventDefault(); handleSave(); }} className="space-y-5">
                              {renderAccountForm(accountSubTab)}
                              <div className="pt-2">
                                <button type="submit" disabled={saving}
                                  className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 transition-colors rounded-xl py-3 px-4 flex items-center justify-center gap-2 font-bold shadow-sm">
                                  {saving ? <><div className="w-3.5 h-3.5 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin" /><span className="text-[10px] uppercase tracking-wider">{t("memberPortal.updating")}</span></>
                                         : <><span className="material-symbols-outlined text-sm">save</span><span className="text-[10px] uppercase tracking-wider">{t("memberPortal.updateInfo")}</span></>}
                                </button>
                              </div>
                            </form>
                          </div>
                        </div>
                        {/* Preview column (lg+) */}
                        <div className="hidden lg:flex lg:col-span-5 lg:sticky lg:top-6 justify-center">
                          <PreviewSimulator previewMode={previewMode} setPreviewMode={setPreviewMode} previewIframeRef={previewIframeRef} slug={bio?.slug} t={t} />
                        </div>
                      </div>
                    </div>

                    {/* ── MOBILE layout (<md): app-like cards ────────────── */}
                    <div className="md:hidden">
                      {mobileSubSection ? (
                        /* ── Sub-section detail view ── */
                        <motion.div key={mobileSubSection} initial={{ x: 24, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type:'spring', stiffness:380, damping:30 }} className="space-y-4">
                          {/* Section header bar */}
                          <div className={`flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r ${activeSectionInfo?.grad} text-white shadow-lg`}>
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings:"'FILL' 1" }}>{activeSectionInfo?.icon}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-extrabold text-sm leading-tight">{activeSectionInfo?.label}</p>
                              <p className="text-white/70 text-[10px] truncate">{activeSectionInfo?.sub}</p>
                            </div>
                          </div>
                          {/* Form content */}
                          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4">
                            {renderAccountForm(mobileSubSection)}
                          </div>
                          {/* Save button */}
                          <button type="button" onClick={() => handleSave()} disabled={saving}
                            className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-2xl font-extrabold flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all disabled:opacity-50">
                            {saving
                              ? <><div className="w-4 h-4 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin" /><span className="text-xs uppercase tracking-wider">Đang lưu...</span></>
                              : <><span className="material-symbols-outlined text-base" style={{ fontVariationSettings:"'FILL' 1" }}>save</span><span className="text-xs uppercase tracking-wider">Lưu thay đổi</span></>
                            }
                          </button>
                        </motion.div>
                      ) : mobileView === "preview" ? (
                        /* ── Preview mode ── */
                        <div className="flex justify-center">
                          <PreviewSimulator previewMode={previewMode} setPreviewMode={setPreviewMode} previewIframeRef={previewIframeRef} slug={bio?.slug} t={t} />
                        </div>
                      ) : (
                        /* ── Section overview ── */
                        <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                          {/* Profile hero card */}
                          <div className="relative bg-gradient-to-br from-[#0071e3] via-[#5856d6] to-[#af52de] rounded-2xl p-5 overflow-hidden shadow-lg">
                            <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/8 rounded-full" />
                            <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-white/5 rounded-full" />
                            <div className="relative flex items-center gap-4">
                              {formData.avatarUrl ? (
                                <img src={formData.avatarUrl} alt="avatar" className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white/30 shadow-lg shrink-0" />
                              ) : (
                                <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-white font-black text-2xl shadow-lg shrink-0">
                                  {(formData.displayName||'?')[0]?.toUpperCase()}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-extrabold text-base text-white leading-tight truncate">{formData.displayName || 'Chưa đặt tên'}</p>
                                <p className="text-white/70 text-xs mt-0.5 line-clamp-1">{formData.headline || 'Chưa có tiêu đề'}</p>
                                {publicLink ? (
                                  <a href={publicLink} target="_blank" rel="noopener noreferrer"
                                    className="mt-2 inline-flex items-center gap-1 text-white/85 text-[10px] font-bold bg-white/15 px-2.5 py-1 rounded-full">
                                    Xem bio <span className="material-symbols-outlined text-[11px]">open_in_new</span>
                                  </a>
                                ) : (
                                  <span className="mt-2 inline-flex items-center gap-1 text-white/50 text-[10px] font-semibold">
                                    <span className="material-symbols-outlined text-[11px]">link_off</span>Chưa kích hoạt
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Edit/preview toggle */}
                          <div className="relative bg-[#767680]/12 dark:bg-[#767680]/24 p-[3px] rounded-xl flex border border-zinc-200/10 dark:border-zinc-800/20 shadow-inner">
                            <div className="absolute top-[3px] bottom-[3px] bg-white dark:bg-[#636366] rounded-lg shadow-sm transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]"
                              style={{ left: mobileView==="edit"?"3px":"calc(50% + 1px)", width:"calc(50% - 4px)" }} />
                            {["edit","preview"].map(v => (
                              <button key={v} type="button" onClick={() => setMobileView(v)}
                                className={`w-1/2 py-2 text-xs font-black uppercase tracking-wider rounded-lg relative z-10 transition-colors ${mobileView===v?"text-black dark:text-white":"text-zinc-500"}`}>
                                {v === "edit" ? "Chỉnh sửa" : "Xem trước"}
                              </button>
                            ))}
                          </div>

                          {/* Section cards — 2-column grid */}
                          <div className="grid grid-cols-2 gap-3">
                            {ACCOUNT_SECTIONS.map((sec, idx) => {
                              const isLastOdd = ACCOUNT_SECTIONS.length % 2 !== 0 && idx === ACCOUNT_SECTIONS.length - 1;
                              return (
                                <button
                                  key={sec.id}
                                  type="button"
                                  onClick={() => { setAccountSubTab(sec.id); setMobileSubSection(sec.id); }}
                                  className={`bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/80 rounded-2xl p-4 text-left active:scale-[0.96] transition-all duration-150 shadow-sm hover:shadow-md ${isLastOdd ? 'col-span-2' : ''}`}
                                >
                                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${sec.grad} flex items-center justify-center mb-3 shadow-sm`}>
                                    <span className="material-symbols-outlined text-white text-[22px]" style={{ fontVariationSettings:"'FILL' 1" }}>{sec.icon}</span>
                                  </div>
                                  <p className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200 leading-tight">{sec.label}</p>
                                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 line-clamp-1">{sec.sub}</p>
                                  <span className="material-symbols-outlined text-zinc-300 dark:text-zinc-600 text-base mt-2 block">chevron_right</span>
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "manage"    && <MemberManageTab bio={bio} publicLink={publicLink} handleCopyLink={handleCopyLink} handleDeleteBio={handleDeleteBio} saving={saving} handleRedeemCode={handleRedeemCode} />}
                {activeTab === "partner"   && <MemberPartnerTab />}
                {activeTab === "utilities" && <MemberUtilitiesTab bio={bio} publicLink={publicLink} showToast={showToast} setFormData={setFormData} handleSave={handleSave} defaultUtility={defaultUtility} defaultPsychologySubTab={defaultPsychologySubTab} defaultPsychologyPresetTest={defaultPsychologyPresetTest} />}
                {activeTab === "history"   && <MemberHistoryTab bio={bio} showToast={showToast} />}
              </>
            )}
          </React.Suspense>
        </ErrorBoundary>

        <CropModal cropModal={cropModal} setCropModal={setCropModal} handleDragStart={handleDragStart} handleDragMove={handleDragMove} handleDragEnd={handleDragEnd} handleCropSave={handleCropSave} t={t} />

        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
              <div className="flex items-center gap-2 text-rose-500">
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings:"'FILL' 1" }}>warning</span>
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-zinc-900 dark:text-white">{t("memberPortal.confirm.title")}</h3>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{confirmModal.message}</p>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button type="button" onClick={() => setConfirmModal({ isOpen:false, message:"", onConfirm:null })}
                  className="py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-[11px] font-bold text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors">
                  {t("memberPortal.confirm.cancel")}
                </button>
                <button type="button" onClick={() => { confirmModal.onConfirm?.(); setConfirmModal({ isOpen:false, message:"", onConfirm:null }); }}
                  className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold shadow-md transition-colors">
                  {t("memberPortal.confirm.confirm")}
                </button>
              </div>
            </div>
          </div>
        )}

        {showBirthdaySurprise && <BirthdaySurprise displayName={formData.displayName} onClose={() => setShowBirthdaySurprise(false)} />}
      </div>

      {/* ── Mobile bottom tab bar ─────────────────────────────────────────────── */}
      {!isGuestMode && bio?.status !== 'pending' && (
        <div className="fixed bottom-0 left-0 right-0 z-[100] md:hidden bg-white/85 dark:bg-[#111]/85 backdrop-blur-2xl backdrop-saturate-200 border-t border-zinc-200/40 dark:border-zinc-800/30 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.5)]"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)', paddingTop: '10px' }}>
          <div className="flex justify-around px-2">
            {TABS.map(tab => {
              const isActive = !tab.partner && activeTab === tab.id;
              return (
                <button key={tab.id} type="button" onClick={() => onTabClick(tab)}
                  className="flex flex-col items-center justify-center gap-0.5 flex-1 relative py-1 px-1 transition-colors duration-200">
                  {/* Active pill indicator */}
                  {isActive && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#0071e3] dark:bg-[#0a84ff] rounded-full" />
                  )}
                  <span
                    className={`material-symbols-outlined transition-all duration-200 ${isActive ? 'text-[#0071e3] dark:text-[#0a84ff] text-2xl' : 'text-zinc-400 dark:text-zinc-500 text-[22px]'}`}
                    style={{ fontVariationSettings: isActive ? "'FILL' 1, 'wght' 500" : "'FILL' 0, 'wght' 400" }}
                  >
                    {tab.icon}
                  </span>
                  <span className={`text-[9px] font-bold tracking-wide truncate max-w-full transition-colors duration-200 ${isActive ? 'text-[#0071e3] dark:text-[#0a84ff]' : 'text-zinc-400 dark:text-zinc-500'}`}>
                    {tab.label}
                  </span>
                  {tab.id === "history" && unreadHistoryCount > 0 && (
                    <span className="absolute top-0.5 right-[18%] bg-red-500 text-white text-[8px] font-black px-1 py-0.5 rounded-full min-w-[14px] text-center leading-none shadow-sm">
                      {unreadHistoryCount > 99 ? '99+' : unreadHistoryCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
