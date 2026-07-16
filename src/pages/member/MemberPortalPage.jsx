import { useTranslation } from "react-i18next";
import React, { useEffect, useMemo, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { getMemberSession, logoutAuth } from "../../services/authSession";
import ErrorBoundary from "../../components/ErrorBoundary";
import memberService from "../../services/classes/MemberService";
import dataApi from "../../services/dataApi";
import { useNotifications } from "../../hooks/useNotifications";
import { useHealingJourney } from "../../hooks/useHealingJourney";
import HealingModal from "../../components/member/portal/HealingModal";
import { useTourStore } from "../../stores/tourStore";
import TourSystem from "../../components/TourSystem";
import { useJoyStore } from "../../stores/joyStore";
import { usePresenceHeartbeat } from "../../hooks/usePresenceHeartbeat";
import { useKeyboardVisible } from "../../hooks/useKeyboardVisible";
import { useSleepAutoDetect } from "../../hooks/useSleepAutoDetect";
import { useLocationGuard } from "../../hooks/useLocationGuard";
import LocationAnomalyDialog from "../../components/member/LocationAnomalyDialog";
import WeatherAlertWatcher from "../../components/weather/WeatherAlertWatcher";
import WeatherLayer from "../../components/weather/WeatherLayer";
import { isWeatherBgEnabled } from "../../utils/weatherPrefs";
import { useIsMobile } from "../../hooks/useIsMobile";
import JoyCoinBadge from "../../components/shared/JoyCoinBadge";
import { HugoNoticeToast } from "../../components/shared/HugoNotice";
import OnboardingProfileModal from "../../components/member/OnboardingProfileModal";
import PaymentRequestModal from "../../components/member/PaymentRequestModal";
import { getCachedBio, setCachedBio, clearCachedBio } from "../../utils/bioCache";
import ParticleConnectModal from "../../components/member/shared/ParticleConnectModal";
import { DashboardSkeleton } from "../../components/ui/SkeletonLayouts";
// Maps a raw Bio document onto the editable formData shape — pulled out so
// both the lazy-cache hydrate (instant paint) and the real fetch (revalidate)
// build the exact same shape.
function bioToFormData(b, fallbackDisplayName, emptyTheme) {
  return {
    email: b.email||"", displayName: b.displayName||fallbackDisplayName||"", headline: b.headline||"",
    bio: b.bio||"", birthday: b.birthday||"", phone: b.phone||"", hobbies: b.hobbies||"",
    height: b.height||"", weight: b.weight||"", measurements: b.measurements||"",
    address: b.address||"", education: b.education||"", skills: b.skills||"",
    jobTitle: b.jobTitle||"", contactEmail: b.contactEmail||"", avatarUrl: b.avatarUrl||"",
    links: b.links||[], theme: { ...emptyTheme, ...b.theme }, tabs: b.tabs||[],
    projects: b.projects||[], services: b.services||[], secretLinks: b.secretLinks||[], slug: b.slug||"",
    antiDeepfakeLock: b.antiDeepfakeLock || false,
    autoLogoutMinutes: b.autoLogoutMinutes || 0,
    privateMode: b.privateMode || false,
  };
}

// Sub-components
import BirthdaySurprise from "../../components/member/BirthdaySurprise";
import CropModal from "../../components/member/CropModal";
import RejectedVerification from "../../components/member/RejectedVerification";
import VerificationForm from "../../components/member/VerificationForm";
import VerificationModal from "../../components/member/VerificationModal";
import PendingVerification from "../../components/member/PendingVerification";
import PreviewSimulator from "../../components/member/PreviewSimulator";
import PersonalInfoSubTab from "../../components/member/PersonalInfoSubTab";
import MemberSettingsTab from "../../components/member/MemberSettingsTab";
import DesignSubTab from "../../components/member/DesignSubTab";
import LinksSubTab from "../../components/member/LinksSubTab";
import QuickWidgetGrid from "../../components/member/QuickWidgetGrid";
// Lazy-loaded main tabs
const AchievementsSubTab = React.lazy(() => import("../../components/member/AchievementsSubTab"));
const MemberHistoryTab   = React.lazy(() => import("../../components/member/MemberHistoryTab"));
const MemberPartnerTab   = React.lazy(() => import("../../components/member/MemberPartnerTab"));
const MemberUtilitiesTab = React.lazy(() => import("../../components/member/MemberUtilitiesTab"));
const MemberJoyTab       = React.lazy(() => import("../../components/member/MemberJoyTab"));
const DiscoveryMap       = React.lazy(() => import("../../components/member/DiscoveryMap"));

// The green "verified" tick is reserved for accounts whose education info has
// actually been approved (isEduVerified) — an active 30-day trial account
// must show a neutral "đang dùng thử" state instead, even though its status
// is technically 'active' (full portal access during the trial window).
function StatusBadge({ status, isEduVerified }) {
  const { t } = useTranslation();
  const cfg = {
    active:   { label: t("memberPortal.status.active") || 'Đã xác minh', color: 'bg-success/10 text-success border-success/20', icon: 'verified' },
    trial:    { label: 'Đang dùng thử', color: 'bg-warning/10 text-warning border-warning/20', icon: 'hourglass_top' },
    pending:  { label: t("memberPortal.status.pending") || 'Đang chờ',    color: 'bg-warning/10 text-warning border-warning/20',   icon: 'pending' },
    rejected: { label: t("memberPortal.status.rejected") || 'Bị từ chối',  color: 'bg-destructive/10 text-destructive border-destructive/20',           icon: 'cancel' },
  };
  const key = status === 'active' && !isEduVerified ? 'trial' : status;
  const c = cfg[key] || cfg.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${c.color}`}>
      <span className="material-symbols-outlined text-[10px]">{c.icon}</span>{c.label}
    </span>
  );
}

export default function MemberPortalPage() {
  const { t } = useTranslation();
  const memberSession = getMemberSession();
  // Instant-paint from the last-known-good copy on this device — the real
  // fetch below still always runs to revalidate, this just avoids showing a
  // blank loading spinner on every reload for a returning member.
  const cachedBioRef = useRef(getCachedBio(memberSession?.email));

  // ── Core state ──────────────────────────────────────────────────────────────
  const [bio, setBio]         = useState(() => cachedBioRef.current);
  const [loading, setLoading] = useState(() => !cachedBioRef.current);
  const [saving, setSaving]   = useState(false);
  const [showBirthdaySurprise, setShowBirthdaySurprise] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [particleOpen, setParticleOpen] = useState(false);
  const fetchJoyBalance = useJoyStore(s => s.fetchBalance);
  const joyBalance = useJoyStore(s => s.balance);
  usePresenceHeartbeat(memberSession?.email);
  // Hides the fixed mobile bottom bar while the on-screen keyboard is up —
  // without this, the bar visibly jitters/jumps as the keyboard opens/closes
  // because it's fixed against a viewport that's actively resizing.
  const isKeyboardVisible = useKeyboardVisible();
  const isMobileView = useIsMobile();
  // A full-screen sheet (e.g. community composer/comments) asks to hide the
  // bottom tab-bar so it doesn't peek out from under the sheet. Fixed z-index
  // alone can fail when an ancestor creates a stacking context, so we truly
  // unmount the bar via this signal.
  const [fullSheetOpen, setFullSheetOpen] = useState(false);
  useEffect(() => {
    const h = (e) => setFullSheetOpen(!!e.detail?.open);
    window.addEventListener("hugo:fullsheet", h);
    return () => window.removeEventListener("hugo:fullsheet", h);
  }, []);
  const [verificationForm, setVerificationForm] = useState({
    fullName: memberSession?.displayName || "", birthday: "", schoolLevel: "",
    schoolName: "", schoolIdCode: "", phoneZalo: "", acceptTerms: false, acceptContact: false,
  });
  const [verifying, setVerifying] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, message: "", onConfirm: null });
  const triggerConfirm = (message, onConfirm) => setConfirmModal({ isOpen: true, message, onConfirm });

  // ── Tab state derived from URL ──────────────────────────────────────────────
  const { tab, subTab, psychTab } = useParams();
  const navigate = useNavigate();

  const activeTab = tab || "map";
  const accountSubTab = subTab || "profile";
  const mobileSubSection = subTab || null;

  // Lazy tabs (joy/partner/utilities/history/settings) used to fully unmount
  // whenever you left them — every revisit re-triggered the lazy chunk load,
  // every internal useEffect fetch, and a full re-render from scratch, which
  // is what made switching back to an already-visited tab feel laggy. Once a
  // tab has been visited, keep it mounted and just hide it with CSS instead —
  // switching back to it becomes a free, instant DOM show/hide.
  const [visitedTabs, setVisitedTabs] = useState(() => new Set([activeTab]));
  useEffect(() => {
    if (!visitedTabs.has(activeTab)) setVisitedTabs(prev => new Set(prev).add(activeTab));
  }, [activeTab]); // eslint-disable-line

  const [previewMode, setPreviewMode]     = useState("mobile");
  // Mobile account sections collapse into an accordion (one open at a time)
  // instead of all-stacked — all-stacked made the page very long to scroll.
  const [mobileExpandedSection, setMobileExpandedSection] = useState("profile");

  // ── Utilities navigation — synced to the URL so a page refresh keeps the
  // member on the exact same utility/sub-tab instead of bouncing them back to
  // the utilities dashboard (e.g. /member/utilities/psychology/therapy). ──────
  const utilitySelection = activeTab === "utilities" ? (subTab || null) : null;
  const psychologySubTabFromUrl = activeTab === "utilities" && subTab === "psychology" ? (psychTab || "chat") : "chat";
  const [defaultPsychologyPresetTest, setDefaultPsychologyPresetTest] = useState(null);

  const handleSelectUtility = (utilityId) => {
    navigate(utilityId ? `/member/utilities/${utilityId}` : "/member/utilities");
  };
  const handleSelectPsychologySubTab = (subTabId) => {
    navigate(`/member/utilities/psychology/${subTabId}`);
  };

  const { notifications, unreadCount: unreadNotifCount, toast, setToast,
    showToast, sendNotification, markRead, markAllRead, dismiss, refresh: refreshInbox,
  } = useNotifications(memberSession?.email || null);

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
    let count = unreadNotifCount || 0;
    if (bio?.history?.length) {
      if (!readHistoryTimestamp) count += bio.history.length;
      else {
        const ref = new Date(readHistoryTimestamp).getTime();
        count += bio.history.filter(e => new Date(e.timestamp).getTime() > ref).length;
      }
    }
    return count;
  }, [bio?.history, readHistoryTimestamp, unreadNotifCount]);

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
  const [formData, setFormData] = useState(() =>
    cachedBioRef.current
      ? bioToFormData(cachedBioRef.current, memberSession?.displayName, emptyTheme)
      : {
          displayName: memberSession?.displayName || "", headline:"", bio:"", birthday:"", phone:"",
          hobbies:"", height:"", weight:"", measurements:"", address:"", education:"", skills:"",
          jobTitle:"", contactEmail:"", avatarUrl:"", links:[], theme: emptyTheme, tabs:[], projects:[], services:[],
        }
  );
  const [newLinkLabel, setNewLinkLabel] = useState("");
  const [newLinkUrl, setNewLinkUrl]     = useState("");
  const [cropModal, setCropModal]       = useState({ isOpen:false, imageSrc:null, zoom:1, aspect:1, offset:{x:0,y:0} });
  const [isDragging, setIsDragging]     = useState(false);
  const [startPos, setStartPos]         = useState({ x:0, y:0 });
  const [isDragOver, setIsDragOver]     = useState(false);

  const avatarInputRef  = useRef(null);
  // Separate ref for the mobile hero card's own avatar — it must stay
  // clickable even when the "Thông tin cá nhân" accordion section (which owns
  // avatarInputRef) is collapsed and not mounted.
  const heroAvatarInputRef = useRef(null);
  const bioTextareaRef  = useRef(null);
  const previewIframeRef = useRef(null);

  const [activePaymentNotification, setActivePaymentNotification] = useState(null);
  useEffect(() => {
    const unreadPayment = notifications.find(n => !n.read && n.category === 'payment');
    if (unreadPayment && (!activePaymentNotification || activePaymentNotification._id !== unreadPayment._id)) {
      setActivePaymentNotification(unreadPayment);
    }
  }, [notifications, activePaymentNotification]);

  // ── Passive sleep auto-detection ─────────────────────────────────────────────
  // Mounted here (portal-wide) instead of inside SleepTracker so the 8-signal
  // detection (IdleDetector, DeviceMotion, etc.) keeps listening for as long as
  // the member has ANY portal page open — not just while they're sitting in the
  // HugoPSY > Sleep sub-tab, which nobody does while actually asleep.
  const [pendingSleepCycle, setPendingSleepCycle] = useState(null);
  const [locationAnomaly, setLocationAnomaly] = useState(null);
  const handleSleepAutoDetect = React.useCallback((cycle) => {
    setPendingSleepCycle(cycle);
    showToast("Hệ thống tự động ghi nhận giấc ngủ đêm qua!", "success");
  }, [showToast]);
  const sleepDetect = useSleepAutoDetect({
    email: memberSession?.email,
    onAutoDetect: handleSleepAutoDetect,
    enabled: !!memberSession?.email,
  });
  const sleepAutoDetect = useMemo(() => ({
    ...sleepDetect,
    pendingCycle: pendingSleepCycle,
    clearPendingCycle: () => setPendingSleepCycle(null),
  }), [sleepDetect, pendingSleepCycle]);

  // Anomalous-login guard — forces re-login if the device strays >50km from
  // the member's trusted location. Opt-in via the browser's native
  // geolocation permission prompt; fails open if denied/unavailable.
  useLocationGuard({
    email: memberSession?.email,
    enabled: !!memberSession?.email,
    onAnomaly: ({ distanceKm, lat, lng }) => {
      setLocationAnomaly({ distanceKm, lat, lng });
    },
  });

  // ── Healing journey hook ──────────────────────────────────────────────────────
  const isEmbedded = useMemo(() => window.self !== window.top || new URLSearchParams(window.location.search).get("embed") === "true", []);
  const isGuestMode = useMemo(() => isEmbedded && !memberSession?.email, [isEmbedded, memberSession]);
  const publicLink  = useMemo(() => bio?.slug ? `${window.location.origin}/bio/${bio.slug}` : "", [bio]);

  const healing = useHealingJourney({
    email: memberSession?.email || null,
    onNavigate: (tab, utility, subTab, presetTest) => {
      setDefaultPsychologyPresetTest(presetTest);
      const path = utility
        ? (subTab ? `/member/${tab}/${utility}/${subTab}` : `/member/${tab}/${utility}`)
        : `/member/${tab}`;
      navigate(path);
    },
    showToast, sendNotification,
  });

  useEffect(() => { healing.syncFromStorage(); }, [activeTab]); // eslint-disable-line

  const registerPortalActions = useTourStore(state => state.registerPortalActions);
  useEffect(() => {
    registerPortalActions({
      switchTab: (tabId) => {
        navigate(`/member/${tabId}`);
      },
      switchSubTab: (subTabId) => {
        if (subTabId) {
          navigate(`/member/account/${subTabId}`);
        } else {
          navigate(`/member/account`);
        }
      }
    });
  }, [navigate, registerPortalActions]);

  // ── Mobile account section definitions ───────────────────────────────────────
  const ACCOUNT_SECTIONS = useMemo(() => [
    { id:'profile',      label:'Thông tin cá nhân', sub:t("memberPortal.bento.profileSub"),  icon:'person',          grad:'from-card to-card'  },
    { id:'design',       label:t("memberPortal.sidebar.theme"),     sub:t("memberPortal.bento.designSub"),   icon:'palette',         grad:'from-card to-card'  },
    { id:'links',        label:t("memberPortal.sidebar.links"),     sub:t("memberPortal.bento.linksSub", { count: formData.links?.length || 0 }), icon:'link',    grad:'from-card to-card'  },
    { id:'achievements', label:'Thành tích',        sub:t("memberPortal.bento.projectsSub", { count: (formData.projects?.length || 0) + (formData.services?.length || 0) }), icon:'military_tech', grad:'from-card to-card' },
  ], [formData.links?.length, formData.projects?.length, formData.services?.length, t]);

  const renderBasicInfoCard = () => {
    return (
      <div className="relative overflow-hidden rounded-[24px] p-5 sm:p-6 bg-gradient-to-br from-zinc-50 via-zinc-100/50 to-zinc-50 dark:from-[#13121f] dark:via-[#1e1c2a] dark:to-[#13121f] border border-border/25 shadow-xl">
        {/* Glow Effects */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-gradient-to-br from-[#0071e3]/15 to-transparent rounded-full filter blur-2xl pointer-events-none opacity-0 dark:opacity-100" />
        <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-gradient-to-br from-[#af52de]/15 to-transparent rounded-full filter blur-2xl pointer-events-none opacity-0 dark:opacity-100" />

        <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
          {/* Avatar Area */}
          <div className="relative w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-2xl shrink-0 shadow-md border border-border overflow-hidden">
            {formData.avatarUrl ? (
              <img src={formData.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#0071e3] to-[#5856d6] flex items-center justify-center text-white font-black text-2xl">
                {(formData.displayName || "?")[0]?.toUpperCase()}
              </div>
            )}
          </div>

          {/* User Details */}
          <div className="flex-1 min-w-0 w-full space-y-1.5">
            <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2">
              <h2 className="font-black text-lg text-foreground leading-tight">
                {formData.displayName || t("memberPortal.bio.noName")}
              </h2>
              {bio?.status && !isGuestMode && <StatusBadge status={bio.status} isEduVerified={bio.isEduVerified} />}
            </div>
            
            <p className="text-muted-foreground text-xs font-semibold">
              {formData.headline || "Chưa thiết lập tiêu đề tiểu sử"}
            </p>

            <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2.5 pt-1 text-[11px] font-medium text-muted-foreground dark:text-zinc-400">
              {formData.birthday && (
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[13px]">cake</span>
                  {formData.birthday}
                </span>
              )}
              {formData.address && (
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[13px]">location_on</span>
                  {formData.address}
                </span>
              )}
              {!isGuestMode && (
                <button
                  type="button"
                  onClick={() => onTabClick({ id: "joy" })}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-warning/20 dark:border-warning/30 bg-warning/5 text-warning font-bold active:scale-95 transition-all text-[10px]"
                >
                  <JoyCoinBadge size="sm" />
                </button>
              )}
            </div>
          </div>

          {/* Edit bio button redirecting to Settings tab */}
          <div className="sm:self-start mt-2 sm:mt-0 shrink-0">
            <button
              type="button"
              onClick={() => onTabClick({ id: "settings" })}
              className="flex items-center gap-1.5 px-3.5 py-2 text-[10px] font-black uppercase tracking-wider text-foreground/80 bg-white/40 dark:bg-white/5 border border-border rounded-xl hover:bg-muted dark:hover:bg-white/10 active:scale-95 transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">tune</span>
              Cài đặt Bio
            </button>
          </div>
        </div>

        {/* Info stats row */}
        <div className="mt-5 pt-4 border-t border-border/80 grid grid-cols-3 gap-2 text-center text-[10px] font-bold text-muted-foreground font-mono tracking-wider">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-foreground text-xs font-black">{formData.links?.length || 0}</span>
            <span className="uppercase text-[8px] tracking-widest text-muted-foreground">Liên kết</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 border-x border-border/80">
            <span className="text-foreground text-xs font-black">{formData.projects?.length || 0}</span>
            <span className="uppercase text-[8px] tracking-widest text-muted-foreground">Thành tích</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-foreground text-xs font-black">{(formData.theme?.template || "Classic").toUpperCase()}</span>
            <span className="uppercase text-[8px] tracking-widest text-muted-foreground">Theme</span>
          </div>
        </div>
      </div>
    );
  };

  // ── Render account sub-tab form (shared desktop + mobile) ────────────────────
  const renderAccountForm = (tabId, opts = {}) => {
    switch(tabId) {
      case 'profile':      return <PersonalInfoSubTab formData={formData} handleFieldChange={handleFieldChange} saving={saving} isDragOver={isDragOver} setIsDragOver={setIsDragOver} processFile={processFile} avatarInputRef={avatarInputRef} handleAvatarChange={handleAvatarChange} handleRemoveAvatar={handleRemoveAvatar} memberSession={memberSession} bio={bio} hideAvatarSection={opts.hideAvatarSection} t={t} />;
      case 'design':       return <DesignSubTab formData={formData} setFormData={setFormData} t={t} bio={bio} onBioUpdate={setBio} showToast={showToast} />;
      case 'links':        return <LinksSubTab formData={formData} newLinkLabel={newLinkLabel} setNewLinkLabel={setNewLinkLabel} newLinkUrl={newLinkUrl} setNewLinkUrl={setNewLinkUrl} handleLinkInputKeyDown={handleLinkInputKeyDown} addSocialLink={addSocialLink} removeSocialLink={removeSocialLink} handleFieldChange={handleFieldChange} bioTextareaRef={bioTextareaRef} t={t} />;
      case 'achievements': return <AchievementsSubTab formData={formData} setFormData={setFormData} handleSave={handleSave} showToast={showToast} isGuestMode={isGuestMode} bio={bio} />;
      default: return null;
    }
  };

  // ── Bio loading ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlTab = params.get("tab");
    if (urlTab) navigate(`/member/${urlTab}`, { replace: true });
  }, [navigate]);

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
          
          // Theme rental expiration validation
          if (b.activeAuraTheme && b.activeAuraTheme !== 'default') {
            const themeRecord = b.rentedThemes?.find(t => t.themeId === b.activeAuraTheme);
            if (!themeRecord || new Date(themeRecord.expiresAt).getTime() <= Date.now()) {
              b.activeAuraTheme = 'default';
              const apiBase = import.meta.env.VITE_API_URL || '/api';
              fetch(`${apiBase}/joy/set-theme`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: b.email, themeId: 'default' })
              }).catch(console.error);
            }
          }
          
          setBio(b);
          // Defer balance/referral-code fetch until onboarding (phone capture) is done —
          // GET /api/joy/balance eagerly calls ensureReferralCode, and we want phone
          // saved first so the generated code is phone-derived, not random.
          if (b.onboardingCompleted) fetchJoyBalance(memberSession.email);
          else setShowOnboarding(true);
          if (b.status === 'active' && b.verificationRequest?.notifiedStatus === 'approved') {
            sendNotification({ category: 'verification', type: 'success', title: t("memberPortal.toast.verifySuccessTitle"), message: t("memberPortal.toast.verifySuccessMsg") });
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
          setFormData(bioToFormData(b, memberSession.displayName, emptyTheme));
          // Fire-and-forget — Companion/banhocduong history only seeds a localStorage
          // cache for a separate utility tab, it must not block the portal's own render.
          dataApi.getCompanionHistory(memberSession.email).then(comp => {
            if (!comp) return;
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
          }).catch(() => {});
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
              sendNotification({ category: 'verification', type: 'success', title: t("memberPortal.toast.verifySuccessTitle"), message: t("memberPortal.toast.verifySuccessMsg") });
              memberService.dismissVerificationNotification(memberSession.email).catch(console.error);
            } else {
              sendNotification({ category: 'verification', type: 'error', title: t("memberPortal.toast.verifyRejectedTitle"), message: t("memberPortal.toast.verifyRejectedMsg") });
            }
          }
        }
      } catch { /* ignore */ }
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

  // Keep the instant-paint cache in sync with whatever the real API last
  // returned (or any local mutation), so the *next* load/reload starts from
  // up-to-date data instead of last session's snapshot.
  useEffect(() => {
    if (!isGuestMode && memberSession?.email && bio) setCachedBio(memberSession.email, bio);
  }, [bio, isGuestMode, memberSession?.email]);

  // Realtime: admin approved/rejected a verification request over WS (see
  // PWARealtimeBridge) — merge straight into state so the portal updates
  // instantly without the member needing to reload.
  useEffect(() => {
    const handleBioUpdate = (e) => {
      const { status, isEduVerified, expiresAt } = e.detail || {};
      setBio(prev => prev ? { ...prev, status, isEduVerified, expiresAt, verificationRequest: { ...prev.verificationRequest, submitted: isEduVerified ? prev.verificationRequest?.submitted : false } } : prev);
    };
    window.addEventListener('hugo:bio-update', handleBioUpdate);
    return () => window.removeEventListener('hugo:bio-update', handleBioUpdate);
  }, []);

  // Security Session Shield: Auto-Logout idle timer
  useEffect(() => {
    const idleMinutes = bio?.autoLogoutMinutes || 0;
    if (idleMinutes <= 0 || isGuestMode) return undefined;

    let timeoutId;
    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        showToast("Phiên làm việc đã hết hạn bảo mật. Hệ thống tự động đăng xuất để bảo vệ tài khoản.", "warning");
        setTimeout(() => {
          handleLogout();
        }, 1500);
      }, idleMinutes * 60 * 1000);
    };

    const events = ['mousemove', 'keydown', 'touchstart', 'click', 'scroll'];
    events.forEach(event => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [bio?.autoLogoutMinutes, isGuestMode]);

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const handleLogout = () => { if (memberSession?.email) clearCachedBio(memberSession.email); logoutAuth(); window.location.assign("/login"); };

  const handleVerificationSubmit = async (e) => {
    e.preventDefault();
    if (!verificationForm.acceptTerms || !verificationForm.acceptContact) { showToast(t("memberPortal.toast.acceptTermsWarning"), "error"); return; }
    if (!verificationForm.fullName || !verificationForm.birthday || !verificationForm.schoolLevel || !verificationForm.schoolName || !verificationForm.schoolIdCode || !verificationForm.phoneZalo) { showToast(t("memberPortal.toast.fillAllWarning"), "error"); return; }
    setVerifying(true);
    try {
      const res = await memberService.submitVerification(memberSession.email, { fullName: verificationForm.fullName, birthday: verificationForm.birthday, schoolLevel: verificationForm.schoolLevel, schoolName: verificationForm.schoolName, schoolIdCode: verificationForm.schoolIdCode, phoneZalo: verificationForm.phoneZalo });
      if (res.success) {
        showToast(res.bio?.isEduVerified ? "Xác minh thành công! Bạn đã có thể sử dụng đầy đủ tính năng." : t("memberPortal.toast.submitSuccess"), "success");
        setBio(res.bio);
      }
    } catch (err) { showToast(err.message || t("memberPortal.toast.submitError"), "error"); }
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
    antiDeepfakeLock: false,
    autoLogoutMinutes: 0,
    privateMode: false,
  });

  const handleDeleteBio = () => {
    if (isGuestMode) {
      triggerConfirm(t("memberPortal.confirm.deletePartner"), () => { memberService.deleteGuestBio(); setBio(null); setFormData(emptyFormReset(true)); showToast(t("memberPortal.toast.deleteLocalSuccess"), "success"); });
      return;
    }
    if (!bio?._id) return;
    triggerConfirm(t("memberPortal.confirm.deletePersonal"), async () => {
      setSaving(true);
      try { await memberService.deleteMemberBio(bio._id); if (memberSession?.email) clearCachedBio(memberSession.email); setBio(null); setFormData(emptyFormReset(false)); showToast(t("memberPortal.toast.deletePersonalSuccess"), "success"); navigate("/member/account"); }
      catch (_) { showToast(t("memberPortal.toast.deletePersonalError"), "error"); }
      finally { setSaving(false); }
    });
  };

  const handleCopyLink = async () => { if (!publicLink) return; await navigator.clipboard.writeText(publicLink); showToast(t("memberPortal.toast.copySuccess"), "success"); };

  // ── Tab definitions ───────────────────────────────────────────────────────────
  const needsEduVerification = !isGuestMode && bio?.status === 'active' && bio?.isEduVerified === false;

  const desktopTabs = useMemo(() => {
    return [
      ...(!isGuestMode ? [
        { id: "joy",       label: t("memberPortal.tabs.joy"),        icon: "account_balance_wallet", partner: false },
      ] : []),
      { id: "map",       label: "Khám Phá",        icon: "explore",                partner: false },
      { id: "utilities", label: t("memberPortal.tabs.utilities"),  icon: "apps",            partner: false },
      { id: "history",   label: t("memberPortal.tabs.history"),    icon: "notifications",   partner: false },
      ...(!isGuestMode ? [
        { id: "partner",   label: t("memberPortal.tabs.partner"),    icon: "handshake",       partner: true  }
      ] : []),
      ...(needsEduVerification ? [
        { id: "verify",    label: t("memberPortal.tabs.verifyEduPending"), icon: "school",          partner: false, alert: !bio?.verificationRequest?.submitted }
      ] : []),
      ...(!isGuestMode ? [
        { id: "settings",  label: t("memberPortal.tabs.settings"),  icon: "person",        partner: false }
      ] : []),
    ];
  }, [isGuestMode, t, needsEduVerification, bio?.verificationRequest?.submitted]);

  const mobileTabs = useMemo(() => {
    if (isGuestMode) {
      return [
        { id: "map",       label: "Khám Phá",        icon: "explore" },
        { id: "utilities", label: t("memberPortal.tabs.utilities"),  icon: "apps" },
        { id: "history",   label: t("memberPortal.tabs.history"),    icon: "notifications" },
        { id: "login",     label: t("navbar.login", "Đăng Nhập"),    icon: "login" }
      ];
    } else {
      return [
        { id: "joy",       label: t("memberPortal.tabs.joy"),        icon: "account_balance_wallet" },
        { id: "map",       label: "Khám Phá",        icon: "explore" },
        { id: "utilities", label: t("memberPortal.tabs.utilities"),  icon: "apps" },
        { id: "history",   label: t("memberPortal.tabs.history"),    icon: "notifications" },
        ...(needsEduVerification ? [
          { id: "verify",  label: t("memberPortal.tabs.verify"),    icon: "school", alert: !bio?.verificationRequest?.submitted }
        ] : []),
        { id: "settings",  label: t("memberPortal.tabs.settings"),  icon: "person" },
      ];
    }
  }, [isGuestMode, t, needsEduVerification, bio?.verificationRequest?.submitted]);

  const [showVerifyModal, setShowVerifyModal] = useState(false);

  // HugoPSY (or anywhere deep) can ask to open the verification form for a
  // locked-field change via a global event, since it may run fullscreen and
  // can't reach this state directly.
  useEffect(() => {
    const open = () => setShowVerifyModal(true);
    window.addEventListener("hugo:open-verification", open);
    return () => window.removeEventListener("hugo:open-verification", open);
  }, []);

  const onTabClick = (tab) => {
    if (tab.id === "login") {
      window.location.assign("/login");
      return;
    }
    if (tab.partner) {
      window.open("https://hwagfu.dev", "_blank", "noopener,noreferrer");
      return;
    }
    // Verification used to be its own tab — now it opens as a popup on top
    // of whatever tab the member is already on, instead of navigating away.
    if (tab.id === "verify") {
      setShowVerifyModal(true);
      return;
    }
    navigate(`/member/${tab.id}`);
  };

  // ── Loading screen ────────────────────────────────────────────────────────────
  if (loading) {
    return <DashboardSkeleton />;
  }

  // ── Active section info (mobile) ──────────────────────────────────────────────
  const activeSectionInfo = ACCOUNT_SECTIONS.find(s => s.id === mobileSubSection);

  // HugoPSY gets the same true top-level fullscreen takeover as HugoCoder/
  // HugoArcade, but mobile-only — nesting a CSS `position: fixed` deep inside
  // the normal page tree doesn't actually escape the portal header/bottom tab
  // bar (they're siblings in the SAME stacking context, so it just gets
  // squeezed between them instead of covering them). This early-return branch
  // is the only way that's worked elsewhere in this codebase.
  //
  // On mobile, ALL of HugoPSY funnels through chat now (Sleep/Evaluation tabs
  // are gone from the mobile nav, Therapy opens as an in-chat overlay) — so
  // any psychology sub-tab gets the fullscreen takeover there. Desktop is
  // unchanged from before — normal sidebar+tabs UI, never fullscreen.
  const isFullscreenUtility = activeTab === "utilities" && (
    subTab === "ide" || subTab === "arcade" ||
    (subTab === "psychology" && isMobileView)
  );

  if (isFullscreenUtility) {
    // h-[100dvh] (not h-screen/100vh) so this actually shrinks with the
    // on-screen keyboard on iOS/Android instead of staying pinned to the
    // full layout viewport while content underneath gets covered.
    return (
      <div className="fixed inset-0 z-[120] w-screen bg-background overflow-hidden flex flex-col font-body" style={{ height: '100dvh' }}>

        <HugoNoticeToast
          open={Boolean(toast.message)}
          type={toast.type || "info"}
          message={toast.message}
          onClose={() => setToast({ message: "", type: "" })}
          zIndex={300}
        />
        
        <div className="flex-1 w-full h-full overflow-hidden">
          <ErrorBoundary>
            <React.Suspense fallback={<div className="flex items-center justify-center h-full w-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
              <MemberUtilitiesTab
                bio={bio}
                publicLink={publicLink}
                showToast={showToast}
                setFormData={setFormData}
                handleSave={handleSave}
                selectedUtility={utilitySelection}
                onSelectUtility={handleSelectUtility}
                psychologySubTab={psychologySubTabFromUrl}
                onSelectPsychologySubTab={handleSelectPsychologySubTab}
                defaultPsychologyPresetTest={defaultPsychologyPresetTest}
                sleepAutoDetect={sleepAutoDetect}
                onBioUpdate={(patch) => setBio(prev => prev ? { ...prev, ...patch } : prev)}
                ideLessonId={activeTab === "utilities" && subTab === "ide" ? psychTab : null}
              />
            </React.Suspense>
          </ErrorBoundary>
        </div>
        
        <CropModal cropModal={cropModal} setCropModal={setCropModal} handleDragStart={handleDragStart} handleDragMove={handleDragMove} handleDragEnd={handleDragEnd} handleCropSave={handleCropSave} t={t} />
        {showOnboarding && !isGuestMode && memberSession?.email && (
          <OnboardingProfileModal
            email={memberSession.email}
            onSkip={() => setShowOnboarding(false)}
            onDone={(result) => {
              setShowOnboarding(false);
              if (result?.referralCode) setBio(prev => prev ? { ...prev, referralCode: result.referralCode, onboardingCompleted: true } : prev);
              fetchJoyBalance(memberSession.email);
            }}
          />
        )}
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  const weatherOn = isWeatherBgEnabled();
  return (
    <>
    <WeatherAlertWatcher />
    <div className="relative isolate min-h-screen bg-background text-foreground font-body selection:bg-primary/20 transition-colors duration-300">
      {/* Flat "app" look: the animated weather/aura backdrops are off by default —
          a calm solid background reads as an app, not a busy website. Kept
          behind the (still user-toggleable) weather pref so it can be re-enabled.
          WeatherAlertWatcher above still runs for safety alerts. */}
      <WeatherLayer enabled={weatherOn && activeTab === "map"} immersive mode="hero" />

      <HealingModal
        showModal={healing.showModal} subStep={healing.subStep} state={healing.state}
        consecutiveLow={healing.consecutiveLow}
        historyLogs={healing.historyLogs} onSubmit={healing.handleSubmit} onWheelSubmit={healing.handleWheelSubmit}
        onGraduation={healing.handleGraduation} onGoToTest={healing.goToTest} onGoToBreath={healing.goToBreath}
        onGoToChat={healing.goToChat}
        onDismiss={() => { healing.setShowModal(false); showToast(t("memberPortal.toast.healingSuccess"), "success"); }}
        showToast={showToast}
      />

      <HugoNoticeToast
        open={Boolean(toast.message)}
        type={toast.type || "info"}
        message={toast.message}
        onClose={() => setToast({ message: "", type: "" })}
        zIndex={300}
      />

      {/* Animated aura backdrop disabled for a flat, calm "app" surface — a
          constantly-moving full-screen canvas read as a busy website. Re-add
          <AuraBackground theme={bio?.activeAuraTheme || 'default'} /> to restore. */}

      <div className={`max-w-6xl mx-auto sm:px-4 ${activeTab === 'account' ? 'pt-2 pb-20 md:pb-12' : 'pt-4 sm:pt-6 md:pt-8 pb-28 md:pb-12'} space-y-5 sm:space-y-6 relative z-10`}>
        {/* ── Portal Header ─────────────────────────────────────────────────── */}
        <header style={{ padding: ""}} className={`${(activeTab === "utilities" && mobileSubSection) || (activeTab === 'account' && !mobileSubSection) ? "hidden md:block" : ""} bg-card border border-border/60 rounded-2xl px-3 sm:px-3 py-2.5 shadow-sm`}>
          <div className="flex items-center justify-between gap-2">
            {/* Left */}
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              {mobileSubSection && (
                <button type="button" onClick={() => navigate("/member/account")}
                  className="md:hidden w-7 h-7 rounded-xl bg-muted flex items-center justify-center shrink-0 active:scale-90 transition-transform">
                  <span className="material-symbols-outlined text-xs text-muted-foreground">arrow_back_ios_new</span>
                </button>
              )}
              <div className={`relative shrink-0 flex items-center ${mobileSubSection ? 'hidden md:block' : ''} ${activeTab === 'account' && !mobileSubSection ? 'hidden md:block' : ''}`}>
                {formData.avatarUrl ? (
                  <img src={formData.avatarUrl} alt="avatar" className="w-10 h-10 rounded-full object-cover ring-2 ring-border shadow-sm" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0071e3] to-[#5856d6] flex items-center justify-center text-white font-black text-sm shadow-sm">
                    {(formData.displayName||"?")[0]?.toUpperCase()}
                  </div>
                )}
                {bio?.status === 'active' && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-success rounded-full border-2 border-border/60" />
                )}
              </div>
              <div className="min-w-0">
                {mobileSubSection ? (
                  <div className="md:hidden">
                    <p className="text-[11px] font-black text-foreground truncate">{activeSectionInfo?.label}</p>
                    <p className="text-[9px] text-zinc-400 truncate">{activeSectionInfo?.sub}</p>
                  </div>
                ) : null}
                {activeTab === 'account' && !mobileSubSection && (
                  <div className="md:hidden flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>badge</span>
                    <span className="text-[10px] font-black uppercase tracking-[0.1em] text-foreground">{t("memberPortal.tabs.bio").toUpperCase()}</span>
                  </div>
                )}
                <div className={`${mobileSubSection ? 'hidden md:block' : ''} ${activeTab === 'account' && !mobileSubSection ? 'hidden md:block' : ''} flex flex-col justify-center`}>
                  <div className="flex items-center gap-1.5">
                    <h1 className="text-[13px] sm:text-sm font-bold tracking-tight text-foreground truncate">
                      {isGuestMode ? t("memberPortal.designYourBio") : memberSession?.displayName || t("memberPortal.student")}
                    </h1>
                    {bio?.status && !isGuestMode && <StatusBadge status={bio.status} isEduVerified={bio.isEduVerified} />}
                  </div>
                  <span className="text-[9px] sm:text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground truncate mt-0.5">
                    {isGuestMode ? t("memberPortal.titlePartner") : t("memberPortal.titleStudent")}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Particle QR + Logout */}
            <div className={`flex items-center gap-2 shrink-0 ${activeTab === 'account' && !mobileSubSection ? 'hidden md:flex' : ''}`}>
              {!isGuestMode && (
                <button type="button" onClick={() => setParticleOpen(true)}
                  className="w-9 h-9 rounded-full flex items-center justify-center bg-muted text-foreground/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors shadow-sm ring-1 ring-black/5 dark:ring-white/10 active:scale-95">
                  <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
                </button>
              )}
              {isGuestMode ? (
                <button type="button" onClick={() => window.location.href = "/login"}
                  className="w-[32px] h-[32px] rounded-full flex items-center justify-center bg-primary/10 text-primary border border-primary/20 shadow-sm active:scale-95 transition-all">
                  <span className="material-symbols-outlined text-[16px]">login</span>
                </button>
              ) : (
                <button type="button" onClick={handleLogout}
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-destructive/20 dark:border-destructive/30 bg-destructive/5 hover:bg-destructive/10 text-destructive text-[9px] font-bold uppercase tracking-wider transition-all duration-200 shrink-0">
                  <span className="material-symbols-outlined text-sm">logout</span>
                  <span className="hidden sm:inline">{t("memberPortal.logout")}</span>
                </button>
              )}
            </div>
          </div>

          {/* Desktop tab navigation */}
          {bio?.status !== 'pending' && (
            <div className="hidden md:flex items-center gap-1 mt-3 pt-3 border-t border-border/50">
              {desktopTabs.map(tab => {
                const isActive = !tab.partner && activeTab === tab.id;
                return (
                  <button id={`portal-tab-${tab.id}`} key={tab.id} type="button" onClick={() => onTabClick(tab)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[10px] sm:text-[11px] font-bold transition-all duration-200 relative ${
                      isActive ? 'bg-foreground/8 text-foreground shadow-sm' : 'text-muted-foreground hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/40'
                    }`}>
                    <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>{tab.icon}</span>
                    <span>{tab.label}</span>
                    {tab.partner && <span className="material-symbols-outlined text-[9px] opacity-50">open_in_new</span>}
                    {tab.id === 'history' && unreadHistoryCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-destructive text-white text-[8px] font-black px-1 py-0.5 rounded-full min-w-[14px] text-center leading-none shadow-sm">
                        {unreadHistoryCount > 99 ? '99+' : unreadHistoryCount}
                      </span>
                    )}
                    {tab.alert && (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-warning ring-2 ring-white dark:ring-[#0c0b11]" />
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
              <p className="text-xs text-zinc-500 font-medium tracking-wide uppercase">{t("memberPortal.bio.loading")}</p>
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
                {visitedTabs.has("joy") && (
                  <div style={{ display: activeTab === "joy" ? undefined : "none", padding: "0 12px" }}>
                    <MemberJoyTab bio={bio} showToast={showToast} onBioUpdate={(patch) => setBio(prev => prev ? { ...prev, ...patch } : prev)} publicLink={publicLink} handleCopyLink={handleCopyLink} handleDeleteBio={handleDeleteBio} saving={saving} onOpenParticleModal={() => setParticleOpen(true)} />
                  </div>
                )}
                {visitedTabs.has("partner") && (
                  <div style={{ display: activeTab === "partner" ? undefined : "none", padding: "0 12px"  }}>
                    <MemberPartnerTab />
                  </div>
                )}
                {visitedTabs.has("map") && (
                  <div style={{ display: activeTab === "map" ? undefined : "none", padding: "0 12px" }}>
                    <DiscoveryMap />
                  </div>
                )}
                {visitedTabs.has("utilities") && (
                  <div style={{ display: activeTab === "utilities" ? undefined : "none", padding: "0 12px"  }}>
                    <MemberUtilitiesTab bio={bio} publicLink={publicLink} showToast={showToast} setFormData={setFormData} handleSave={handleSave} renderAccountForm={renderAccountForm} selectedUtility={utilitySelection} onSelectUtility={handleSelectUtility} psychologySubTab={psychologySubTabFromUrl} onSelectPsychologySubTab={handleSelectPsychologySubTab} defaultPsychologyPresetTest={defaultPsychologyPresetTest} sleepAutoDetect={sleepAutoDetect} onBioUpdate={(patch) => setBio(prev => prev ? { ...prev, ...patch } : prev)} ideLessonId={activeTab === "utilities" && subTab === "ide" ? psychTab : null} />
                  </div>
                )}
                {visitedTabs.has("history") && (
                  <div style={{ display: activeTab === "history" ? undefined : "none", padding: "0 12px"  }}>
                    <MemberHistoryTab bio={bio} showToast={showToast} notifications={notifications} onMarkRead={markRead} onMarkAllRead={markAllRead} onDismiss={dismiss} />
                  </div>
                )}
                {visitedTabs.has("settings") && (
                  <div style={{ display: activeTab === "settings" ? undefined : "none", padding: "0 12px"  }}>
                    <MemberSettingsTab
                      memberSession={memberSession}
                      showToast={showToast}
                      handleLogout={handleLogout}
                      bio={bio}
                      joyBalance={joyBalance}
                      formData={formData}
                      setFormData={setFormData}
                      handleFieldChange={handleFieldChange}
                      publicLink={publicLink}
                      saving={saving}
                      isDragOver={isDragOver}
                      setIsDragOver={setIsDragOver}
                      processFile={processFile}
                      avatarInputRef={avatarInputRef}
                      handleAvatarChange={handleAvatarChange}
                      handleRemoveAvatar={handleRemoveAvatar}
                      handleSave={handleSave}
                      isGuestMode={isGuestMode}
                      newLinkLabel={newLinkLabel}
                      setNewLinkLabel={setNewLinkLabel}
                      newLinkUrl={newLinkUrl}
                      setNewLinkUrl={setNewLinkUrl}
                      handleLinkInputKeyDown={handleLinkInputKeyDown}
                      addSocialLink={addSocialLink}
                      removeSocialLink={removeSocialLink}
                      bioTextareaRef={bioTextareaRef}
                    />
                  </div>
                )}
              </>
            )}
          </React.Suspense>
        </ErrorBoundary>

        <CropModal cropModal={cropModal} setCropModal={setCropModal} handleDragStart={handleDragStart} handleDragMove={handleDragMove} handleDragEnd={handleDragEnd} handleCropSave={handleCropSave} t={t} />

        <VerificationModal
          open={showVerifyModal}
          onClose={() => setShowVerifyModal(false)}
          bio={bio}
          verificationForm={verificationForm}
          setVerificationForm={setVerificationForm}
          handleVerificationSubmit={handleVerificationSubmit}
          handleLogout={handleLogout}
          verifying={verifying}
        />

        <PaymentRequestModal
          isOpen={!!activePaymentNotification} 
          notification={activePaymentNotification} 
          onClose={() => {
            if (activePaymentNotification) markRead(activePaymentNotification._id);
            setActivePaymentNotification(null);
          }}
          onAction={() => {
            if (activePaymentNotification?.actionUrl) {
              window.location.href = activePaymentNotification.actionUrl;
            }
            if (activePaymentNotification) markRead(activePaymentNotification._id);
            setActivePaymentNotification(null);
          }}
        />

        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
              <div className="flex items-center gap-2 text-destructive">
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings:"'FILL' 1" }}>warning</span>
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-foreground">{t("memberPortal.confirm.title")}</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{confirmModal.message}</p>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button type="button" onClick={() => setConfirmModal({ isOpen:false, message:"", onConfirm:null })}
                  className="py-2.5 rounded-xl border border-border text-[11px] font-bold text-zinc-500 hover:bg-zinc-50 dark:hover:bg-muted transition-colors">
                  {t("memberPortal.confirm.cancel")}
                </button>
                <button type="button" onClick={() => { confirmModal.onConfirm?.(); setConfirmModal({ isOpen:false, message:"", onConfirm:null }); }}
                  className="py-2.5 rounded-xl bg-destructive hover:bg-destructive/90 text-white text-[11px] font-bold shadow-md transition-colors">
                  {t("memberPortal.confirm.confirm")}
                </button>
              </div>
            </div>
          </div>
        )}

        {showBirthdaySurprise && <BirthdaySurprise displayName={formData.displayName} onClose={() => setShowBirthdaySurprise(false)} />}
        {showOnboarding && !isGuestMode && memberSession?.email && (
          <OnboardingProfileModal
            email={memberSession.email}
            onSkip={() => setShowOnboarding(false)}
            onDone={(result) => {
              setShowOnboarding(false);
              
              if (result?.referralCode) setBio(prev => prev ? { ...prev, referralCode: result.referralCode, onboardingCompleted: true } : prev);
              fetchJoyBalance(memberSession.email);
            }}
          />
        )}
        <TourSystem />
      </div>

      {/* ── Mobile bottom tab bar ─────────────────────────────────────────────── */}
      {bio?.status !== 'pending' && !isKeyboardVisible && (
        <div className={`fixed bottom-0 left-0 right-0 z-[100] md:hidden glass border-t border-border/40 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.5)] ${fullSheetOpen ? "hidden" : ""}`}
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)', paddingTop: '10px' }}>
          <div className="flex justify-around px-2">
            {mobileTabs.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button id={`portal-tab-${tab.id}-mobile`} key={tab.id} type="button" onClick={() => onTabClick(tab)}
                  className="flex flex-col items-center justify-center gap-0.5 flex-1 relative py-1 px-1 transition-colors duration-200">
                  {/* Active pill indicator */}
                  {isActive && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
                  )}
                  <span
                    className={`material-symbols-outlined transition-all duration-200 ${isActive ? 'text-primary text-2xl' : 'text-muted-foreground/70 text-[22px]'}`}
                    style={{ fontVariationSettings: isActive ? "'FILL' 1, 'wght' 500" : "'FILL' 0, 'wght' 400" }}
                  >
                    {tab.icon}
                  </span>
                  <span className={`text-[10.5px] font-semibold tracking-tight truncate max-w-full transition-colors duration-200 ${isActive ? 'text-primary' : 'text-muted-foreground/70'}`}>
                    {tab.label}
                  </span>
                  {tab.id === "history" && unreadHistoryCount > 0 && (
                    <span className="absolute top-0.5 right-[18%] bg-destructive text-white text-[8px] font-black px-1 py-0.5 rounded-full min-w-[14px] text-center leading-none shadow-sm">
                      {unreadHistoryCount > 99 ? '99+' : unreadHistoryCount}
                    </span>
                  )}
                  {tab.alert && (
                    <span className="absolute top-0.5 right-[22%] w-2 h-2 rounded-full bg-warning ring-2 ring-white dark:ring-[#0c0b11]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>

    {locationAnomaly && (
      <LocationAnomalyDialog
        email={memberSession?.email}
        distanceKm={locationAnomaly.distanceKm}
        lat={locationAnomaly.lat}
        lng={locationAnomaly.lng}
        onDismiss={() => setLocationAnomaly(null)}
      />
    )}

    <ParticleConnectModal
      open={particleOpen}
      bio={bio}
      onClose={() => setParticleOpen(false)}
      onSuccess={(data) => {
        if (bio?.email) fetchJoyBalance(bio.email);
      }}
    />
    </>
  );
}
