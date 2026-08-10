import { useTranslation } from "react-i18next";
import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getMemberSession, logoutAuth } from "../../services/authSession";
import ErrorBoundary from "../../components/ErrorBoundary";
import memberService from "../../services/classes/MemberService";
import dataApi from "../../services/dataApi";
import { useNotifications } from "../../hooks/useNotifications";
import { useHealingJourney } from "../../hooks/useHealingJourney";
import { useTourStore } from "../../stores/tourStore";
import TourSystem from "../../components/TourSystem";
import { useJoyStore } from "../../stores/joyStore";
import { usePresenceHeartbeat } from "../../hooks/usePresenceHeartbeat";
import { useSleepAutoDetect } from "../../hooks/useSleepAutoDetect";
import { useLocationGuard } from "../../hooks/useLocationGuard";
import LocationAnomalyDialog from "../../components/member/LocationAnomalyDialog";
import WeatherAlertWatcher from "../../components/weather/WeatherAlertWatcher";
import WeatherLayer from "../../components/weather/WeatherLayer";
import { isWeatherBgEnabled } from "../../utils/weatherPrefs";
import { useIsMobile } from "../../hooks/useIsMobile";
import { useQueryClient } from "@tanstack/react-query";
import { memberBootstrapKey, useMemberBootstrap } from "../../hooks/useMemberBootstrap";
import DesktopAppleLayout from "../../components/desktop/DesktopAppleLayout";
import AuraBackground from "../../components/member/portal/AuraBackground";
import VersionAnnouncement from "../../components/member/portal/VersionAnnouncement";
import { HugoNoticeToast } from "../../components/shared/HugoNotice";
import OnboardingProfileModal from "../../components/member/OnboardingProfileModal";
import PaymentRequestModal from "../../components/member/PaymentRequestModal";
import { getCachedBio, setCachedBio, clearCachedBio } from "../../utils/bioCache";
import { DashboardSkeleton } from "../../components/ui/SkeletonLayouts";
import "../../styles/memberPortal27.css";
// Maps a raw Bio document onto the editable formData shape — pulled out so
// both the lazy-cache hydrate (instant paint) and the real fetch (revalidate)
// build the exact same shape.
function bioToFormData(b, fallbackDisplayName, emptyTheme) {
  return {
    email: b.email||"", displayName: b.displayName||fallbackDisplayName||"", headline: b.headline||"",
    bio: b.bio||"", birthday: b.birthday||"", phone: b.phone||"", hobbies: b.hobbies||"",
    birthYear: b.birthYear||0, birthMonth: b.birthMonth||0,
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

function MobilePortalNav({
  tabs,
  activeArea,
  unreadCount,
  navigationLabel,
  onTabClick,
}) {
  return (
    <nav
      id="mobile-primary-navigation"
      className="mobile-portal-nav"
      aria-label={navigationLabel}
    >
      <div className="mobile-portal-nav__track">
        {tabs.map((tab) => {
          const isActive = activeArea === tab.id;
          return (
            <button
              id={`portal-tab-${tab.id}-mobile`}
              key={tab.id}
              type="button"
              data-section={tab.id}
              aria-current={isActive ? "page" : undefined}
              aria-label={tab.label}
              className={isActive ? "is-active" : ""}
              onClick={() => onTabClick(tab)}
            >
              <span className="mobile-portal-nav__icon">
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontVariationSettings: isActive
                      ? "'FILL' 1, 'wght' 550"
                      : "'FILL' 0, 'wght' 420",
                  }}
                >
                  {tab.icon}
                </span>
                {tab.id === "activity" && unreadCount > 0 && (
                  <span className="mobile-portal-nav__badge">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
                {tab.alert && <span className="mobile-portal-nav__alert" />}
              </span>
              <span className="mobile-portal-nav__label">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// Sub-components
import CropModal from "../../components/member/CropModal";
import RejectedVerification from "../../components/member/RejectedVerification";
import VerificationForm from "../../components/member/VerificationForm";
import VerificationModal from "../../components/member/VerificationModal";
import PendingVerification from "../../components/member/PendingVerification";
import PersonalInfoSubTab from "../../components/member/PersonalInfoSubTab";
import DesignSubTab from "../../components/member/DesignSubTab";
import LinksSubTab from "../../components/member/LinksSubTab";
import RadioMiniPlayer from "../../components/member/portal/RadioMiniPlayer";
// Lazy-loaded main tabs
const AchievementsSubTab = React.lazy(() => import("../../components/member/AchievementsSubTab"));
const MemberHistoryTab   = React.lazy(() => import("../../components/member/MemberHistoryTab"));
const MemberPartnerTab   = React.lazy(() => import("../../components/member/MemberPartnerTab"));
const MemberUtilitiesTab = React.lazy(() => import("../../components/member/MemberUtilitiesTab"));
const MemberJoyTab       = React.lazy(() => import("../../components/member/MemberJoyTab"));
const DiscoveryMap       = React.lazy(() => import("../../components/member/DiscoveryMap"));
const MemberSettingsTab  = React.lazy(() => import("../../components/member/MemberSettingsTab"));
const MemberTodayTab     = React.lazy(() => import("../../components/member/MemberTodayTab"));
const TodayArticleReader = React.lazy(() => import("../../components/member/TodayArticleReader"));
const ParticleConnectModal = React.lazy(() => import("../../components/member/shared/ParticleConnectModal"));
const BirthdaySurprise   = React.lazy(() => import("../../components/member/BirthdaySurprise"));
const BirthdayWheel      = React.lazy(() => import("../../components/member/BirthdayWheel"));
const PWAPermissionOnboarding = React.lazy(() => import("../../components/permissions/PWAPermissionOnboarding"));

function MemberPortalPage() {
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
  const [birthdayMode, setBirthdayMode] = useState("day");
  const [showBirthdayWheel, setShowBirthdayWheel] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [particleOpen, setParticleOpen] = useState(false);
  // Ví JOY mở modal này ở ba chế độ khác nhau (gửi / mã của tôi / quét).
  // Chỉ nhận chuỗi: nhiều nút truyền thẳng event handler vào đây.
  const [particleMode, setParticleMode] = useState("search");
  const openParticleModal = useCallback((mode) => {
    setParticleMode(typeof mode === "string" ? mode : "search");
    setParticleOpen(true);
  }, []);
  const fetchJoyBalance = useJoyStore(s => s.fetchBalance);
  const hydrateWallet = useJoyStore(s => s.hydrateWallet);
  const joyBalance = useJoyStore(s => s.balance);
  usePresenceHeartbeat(memberSession?.email);
  const isMobileView = useIsMobile();
  // Full-screen sheets temporarily remove the primary navigation.
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
  const isEmbedded = useMemo(
    () => window.self !== window.top || new URLSearchParams(window.location.search).get("embed") === "true",
    []
  );
  const isGuestMode = isEmbedded && !memberSession?.email;
  const queryClient = useQueryClient();
  const {
    data: bootstrapData,
    isLoading: bootstrapLoading,
    error: bootstrapError,
  } = useMemberBootstrap(memberSession?.email, !isGuestMode);
  const patchMemberBio = React.useCallback((patch) => {
    if (!patch) return;
    setBio((previous) => previous ? { ...previous, ...patch } : patch);
    queryClient.setQueryData(
      memberBootstrapKey(memberSession?.email),
      (current) => current
        ? { ...current, bio: { ...(current.bio || {}), ...patch } }
        : current,
    );
  }, [memberSession?.email, queryClient]);

  const activeTab = tab || (isGuestMode ? "apps" : "today");
  const portalArea = useMemo(() => {
    if (activeTab === "today" || activeTab === "joy") return "today";
    if (["apps", "utilities", "map", "partner"].includes(activeTab)) return "apps";
    if (["activity", "history"].includes(activeTab)) return "activity";
    return "account";
  }, [activeTab]);
  const accountSubTab = subTab || "profile";
  // /member/today/<id> mở trang đọc bài ngay trong portal.
  const todayArticleId = activeTab === "today" ? (subTab || null) : null;

  // ── Utilities navigation — synced to the URL so a page refresh keeps the
  // member on the exact same utility/sub-tab instead of bouncing them back to
  // the utilities dashboard (e.g. /member/utilities/psychology/therapy). ──────
  const utilitySelection = activeTab === "utilities" ? (subTab || null) : null;
  const psychologySubTabFromUrl = activeTab === "utilities" && subTab === "psychology" ? (psychTab || "chat") : "chat";
  const [defaultPsychologyPresetTest, setDefaultPsychologyPresetTest] = useState(null);

  const handleSelectUtility = (utilityId) => {
    if (utilityId === "map") {
      navigate("/member/map");
      return;
    }
    navigate(utilityId ? `/member/utilities/${utilityId}` : "/member/utilities");
  };
  const handleSelectPsychologySubTab = (subTabId) => {
    navigate(`/member/utilities/psychology/${subTabId}`);
  };

  const { notifications, unreadCount: loadedUnreadCount, toast, setToast,
    showToast, sendNotification, markRead, markAllRead, dismiss, refresh: refreshNotifications,
  } = useNotifications(
    memberSession?.email || null,
    bootstrapData?.notifications?.recent,
    bootstrapData?.notifications?.unreadCount,
  );
  const unreadNotifCount = loadedUnreadCount;
  useEffect(() => {
    if (portalArea !== "activity") return;
    refreshNotifications();
  }, [portalArea, refreshNotifications]);

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
    showToast(t("memberPortal.toast.sleepDetected"), "success");
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

  // ── Render account sub-tab form (shared desktop + mobile) ────────────────────
  const renderAccountForm = (tabId, opts = {}) => {
    switch(tabId) {
      case 'profile':      return <PersonalInfoSubTab formData={formData} handleFieldChange={handleFieldChange} handleSave={handleSave} saving={saving} isDragOver={isDragOver} setIsDragOver={setIsDragOver} processFile={processFile} avatarInputRef={avatarInputRef} handleAvatarChange={handleAvatarChange} handleRemoveAvatar={handleRemoveAvatar} memberSession={memberSession} bio={bio} hideAvatarSection={opts.hideAvatarSection} t={t} />;
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
      if (!bootstrapData) {
        if (!bootstrapLoading) {
          if (bootstrapError) showToast(t("memberPortal.toast.loadError"), "error");
          setLoading(false);
        }
        return;
      }
      try {
        const res = { bio: bootstrapData.bio };
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
          // Thiếu ngày sinh thì buộc khai ngay: cổng độ tuổi đứng trên dữ liệu này.
          if (b.onboardingCompleted && b.birthYear) hydrateWallet(memberSession.email, bootstrapData.wallet);
          else setShowOnboarding(true);
          if (b.status === 'active' && b.verificationRequest?.notifiedStatus === 'approved') {
            sendNotification({ category: 'verification', type: 'success', title: t("memberPortal.toast.verifySuccessTitle"), message: t("memberPortal.toast.verifySuccessMsg") });
            memberService.dismissVerificationNotification(memberSession.email).catch(console.error);
            b.verificationRequest.notifiedStatus = 'done';
          }
          // Sinh nhật: đúng ngày thì chúc mừng sinh nhật, còn lại trong tháng
          // sinh thì chúc mừng tháng sinh nhật ở lượt đầu tiên của tháng. Đóng
          // lời chúc là mở vòng quay quà (server tự từ chối nếu hết lượt).
          if (b.birthMonth) {
            const now = new Date();
            const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            const isBirthMonth = Number(b.birthMonth) === now.getMonth() + 1;
            const isBirthDay = isBirthMonth && Number(b.birthDay) === now.getDate();
            if (isBirthDay && localStorage.getItem("bday_effect_shown") !== `${monthKey}-${now.getDate()}`) {
              setBirthdayMode("day");
              setShowBirthdaySurprise(true);
              localStorage.setItem("bday_effect_shown", `${monthKey}-${now.getDate()}`);
            } else if (isBirthMonth && localStorage.getItem("bday_month_shown") !== monthKey) {
              setBirthdayMode("month");
              setShowBirthdaySurprise(true);
              localStorage.setItem("bday_month_shown", monthKey);
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
  }, [memberSession?.email, isGuestMode, bootstrapData, bootstrapLoading, bootstrapError]); // eslint-disable-line

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
  }, [formData.bio, activeTab, accountSubTab]);

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
        showToast(t("memberPortal.toast.sessionExpired"), "warning");
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
    // Mã học sinh: nhiều trường không cấp nên chỉ điền nếu có.
    if (!verificationForm.fullName || !verificationForm.birthday || !verificationForm.schoolLevel || !verificationForm.schoolName || !verificationForm.phoneZalo) { showToast(t("memberPortal.toast.fillAllWarning"), "error"); return; }
    setVerifying(true);
    try {
      const res = await memberService.submitVerification(memberSession.email, { fullName: verificationForm.fullName, birthday: verificationForm.birthday, schoolLevel: verificationForm.schoolLevel, schoolName: verificationForm.schoolName, schoolIdCode: verificationForm.schoolIdCode, phoneZalo: verificationForm.phoneZalo });
      if (res.success) {
        showToast(res.bio?.isEduVerified ? t("memberPortal.toast.eduVerified") : t("memberPortal.toast.submitSuccess"), "success");
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
      else if (bio?._id) {
        const r = await memberService.updateMemberBio(bio._id, data);
        setBio(r.bio);
        queryClient.setQueryData(memberBootstrapKey(memberSession.email), (current) => (
          current ? { ...current, bio: r.bio } : current
        ));
        showToast(t("memberPortal.toast.saveSuccess"), "success");
      }
      else {
        const r = await memberService.createMemberBio({ ...data, email: memberSession.email });
        setBio(r.bio);
        queryClient.invalidateQueries({ queryKey: memberBootstrapKey(memberSession.email) });
        showToast(t("memberPortal.toast.activateSuccess"), "success");
      }
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

  const mobileTabs = useMemo(() => {
    return [
      { id: "today", label: t("memberPortal.navigation.today"), icon: "today", path: "/member/today" },
      { id: "apps", label: t("memberPortal.navigation.apps"), icon: "apps", path: "/member/apps" },
      { id: "activity", label: t("memberPortal.navigation.activity"), icon: "notifications", path: "/member/activity" },
      {
        id: "account",
        label: isGuestMode ? t("navbar.login") : t("memberPortal.navigation.account"),
        icon: isGuestMode ? "login" : "person",
        path: isGuestMode ? "/login" : "/member/account",
        alert: needsEduVerification && !bio?.verificationRequest?.submitted,
      },
    ];
  }, [isGuestMode, t, needsEduVerification, bio?.verificationRequest?.submitted]);

  const renderSettings = () => (
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
      handleCopyLink={handleCopyLink}
      handleDeleteBio={handleDeleteBio}
      onOpenParticleModal={openParticleModal}
      onSelectTab={(tabId) => navigate(`/member/${tabId}`)}
      onSelectUtility={handleSelectUtility}
    />
  );

  const [showVerifyModal, setShowVerifyModal] = useState(false);

  // Verification is a modal now (opened from the tab click), so /member/verify
  // has no inline content and rendered blank on direct navigation/bookmark.
  // Land there → open the modal and fall back to a real tab.
  useEffect(() => {
    if (activeTab === "verify") {
      setShowVerifyModal(true);
      navigate("/member/joy", { replace: true });
    }
  }, [activeTab, navigate]);

  // Preserve old bookmarks while keeping Settings inside the four-area
  // information architecture: Today – Apps – Activity – Account.
  useEffect(() => {
    if (activeTab === "settings") {
      navigate("/member/account", { replace: true });
    }
  }, [activeTab, navigate]);

  // HugoPSY (or anywhere deep) can ask to open the verification form for a
  // locked-field change via a global event, since it may run fullscreen and
  // can't reach this state directly.
  useEffect(() => {
    const open = () => setShowVerifyModal(true);
    window.addEventListener("hugo:open-verification", open);
    return () => window.removeEventListener("hugo:open-verification", open);
  }, []);

  const onTabClick = (tab) => {
    if (tab.path === "/login") {
      window.location.assign(tab.path);
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
    navigate(tab.path || `/member/${tab.id}`);
  };

  // ── Loading screen ────────────────────────────────────────────────────────────
  if (loading) {
    return <DashboardSkeleton />;
  }

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
  // Bản đồ là một ỨNG DỤNG chứ không phải tab: mở ra là chiếm trọn màn hình,
  // thanh tab của portal biến mất, và lối duy nhất quay lại là nút thoát của
  // chính nó — giống HugoIDE / HugoArcade.
  const isFullscreenUtility = (activeTab === "utilities" && (
    subTab === "ide" || subTab === "arcade" || subTab === "store" || subTab === "hugoso" || subTab === "deco" ||
    (subTab === "psychology" && isMobileView)
  )) || activeTab === "map";

  // Một ứng dụng đang mở thì nó chiếm trọn màn hình: điều hướng diễn ra BÊN
  // TRONG app và lối ra là nút "Quay lại" của chính app đó. Giữ thêm thanh tab
  // của portal chỉ tổ chồng hai lớp điều hướng và ăn mất chiều cao.
  const isAppOpen = isMobileView
    && activeTab === "utilities"
    && Boolean(utilitySelection);
  const showMobileNavigation = isMobileView
    && bio?.status !== "pending"
    && !isAppOpen
    && !fullSheetOpen;

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
              {activeTab === "map" ? (
                <DiscoveryMap
                  userAvatarUrl={formData.avatarUrl || bio?.avatarUrl}
                  userName={formData.displayName || memberSession?.displayName}
                  onExit={() => navigate("/member/apps")}
                />
              ) : (
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
              )}
            </React.Suspense>
          </ErrorBoundary>
        </div>
        
        <CropModal cropModal={cropModal} setCropModal={setCropModal} handleDragStart={handleDragStart} handleDragMove={handleDragMove} handleDragEnd={handleDragEnd} handleCropSave={handleCropSave} t={t} />
        {showOnboarding && !isGuestMode && memberSession?.email && (
          <OnboardingProfileModal
            email={memberSession.email}
            requireBirthDate={!bio?.birthYear}
            onSkip={bio?.birthYear ? () => setShowOnboarding(false) : undefined}
            onDone={(result) => {
              setShowOnboarding(false);
              if (result?.referralCode) setBio(prev => prev ? { ...prev, referralCode: result.referralCode, onboardingCompleted: true } : prev);
              if (result?.birth) setBio(prev => prev ? { ...prev, ...result.birth } : prev);
              fetchJoyBalance(memberSession.email);
            }}
          />
        )}
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────
  const weatherOn = isWeatherBgEnabled();
  return (
    <>
      <WeatherAlertWatcher />
      <div
        className={`member-portal-shell ${isMobileView ? "portal-mobile-layout" : "portal-workspace-layout"} relative isolate min-h-[100dvh] bg-background text-foreground font-body selection:bg-primary/20 transition-colors duration-300`}
        data-portal-area={portalArea}
      >
        <AuraBackground theme={bio?.activeAuraTheme || 'default'} area={portalArea} />
        {weatherOn && <WeatherLayer preferGeo zIndex={-1} opacity={0.25} />}

        {/* ── 💻 DESKTOP APPLE WORKSPACE (hidden md:block) ────────────────── */}
        {!isMobileView && (
        <div>
        <DesktopAppleLayout
          memberSession={memberSession}
          bio={bio}
          notifications={notifications}
          unreadCount={unreadNotifCount}
          onMarkRead={markRead}
          onMarkAllRead={markAllRead}
          onDismiss={dismiss}
          onOpenSpotlight={() => {
            window.dispatchEvent(new CustomEvent("hugo:open-spotlight"));
          }}
          activeTab={portalArea}
          selectedUtility={utilitySelection}
          isGuestMode={isGuestMode}
        >
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
                  {activeTab === "today" && (
                    /* /member/today/<id> là trang đọc bài; không có id thì là feed. */
                    todayArticleId ? (
                      <TodayArticleReader
                        articleId={todayArticleId}
                        onBack={() => navigate("/member/today")}
                      />
                    ) : (
                      <>
                        {/* Quảng cáo bản 2.0 — tự im sau 10/08/2026 */}
                        <VersionAnnouncement />
                        <MemberTodayTab
                          bio={bio}
                          onNavigate={navigate}
                        />
                      </>
                    )
                  )}
                  {activeTab === "joy" && (
                    <div>
                      <MemberJoyTab bio={bio} showToast={showToast} onBioUpdate={(patch) => setBio(prev => prev ? { ...prev, ...patch } : prev)} publicLink={publicLink} handleCopyLink={handleCopyLink} handleDeleteBio={handleDeleteBio} saving={saving} onOpenParticleModal={openParticleModal} />
                    </div>
                  )}
                  {activeTab === "partner" && (
                    <div>
                      <MemberPartnerTab />
                    </div>
                  )}
                  {(activeTab === "utilities" || activeTab === "apps") && (
                    <div>
                      <MemberUtilitiesTab bio={bio} publicLink={publicLink} showToast={showToast} setFormData={setFormData} handleSave={handleSave} renderAccountForm={renderAccountForm} selectedUtility={utilitySelection} onSelectUtility={handleSelectUtility} psychologySubTab={psychologySubTabFromUrl} onSelectPsychologySubTab={handleSelectPsychologySubTab} defaultPsychologyPresetTest={defaultPsychologyPresetTest} sleepAutoDetect={sleepAutoDetect} onBioUpdate={patchMemberBio} ideLessonId={activeTab === "utilities" && subTab === "ide" ? psychTab : null} />
                    </div>
                  )}
                  {(activeTab === "history" || activeTab === "activity") && (
                    <div>
                      <MemberHistoryTab showToast={showToast} notifications={notifications} onMarkRead={markRead} onMarkAllRead={markAllRead} onDismiss={dismiss} />
                    </div>
                  )}
                  {activeTab === "settings" && (
                    <div>
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
                        handleCopyLink={handleCopyLink}
                        handleDeleteBio={handleDeleteBio}
                        onOpenParticleModal={openParticleModal}
                        renderAccountForm={renderAccountForm}
                      />
                    </div>
                  )}
                  {activeTab === "account" && (
                    <div>
                      {renderSettings()}
                    </div>
                  )}
                </>
              )}
            </React.Suspense>
          </ErrorBoundary>
        </DesktopAppleLayout>
      </div>
      )}

      {/* ── 📱 MOBILE VIEW (md:hidden) ─────────────────────────────────── */}
      {isMobileView && (
      <div className="portal-mobile-main">
        {/* `w-full` là bắt buộc, không thừa: trên mobile `.portal-mobile-main` là
            flex cột, và margin ngang `auto` của `mx-auto` HUỶ `align-items: stretch`
            — ô này co về min-content (rộng hơn màn) và mọi tab tràn ngang. */}
        <div className={`mobile-portal-content ${isAppOpen ? "mobile-portal-content--app" : ""} w-full max-w-6xl mx-auto sm:px-4 ${(activeTab === 'utilities' || activeTab === 'apps') ? 'pt-0 space-y-0' : activeTab === 'account' ? 'pt-2 space-y-4' : 'pt-2 sm:pt-4 space-y-4'} relative z-10`}>
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
                  {activeTab === "today" && (
                    <div className="px-3">
                      {todayArticleId ? (
                        <TodayArticleReader
                          articleId={todayArticleId}
                          onBack={() => navigate("/member/today")}
                        />
                      ) : (
                        <MemberTodayTab
                          bio={bio}
                          onNavigate={navigate}
                        />
                      )}
                    </div>
                  )}
                  {activeTab === "joy" && (
                    <div style={{ padding: "0 12px" }}>
                      <MemberJoyTab bio={bio} showToast={showToast} onBioUpdate={(patch) => setBio(prev => prev ? { ...prev, ...patch } : prev)} publicLink={publicLink} handleCopyLink={handleCopyLink} handleDeleteBio={handleDeleteBio} saving={saving} onOpenParticleModal={openParticleModal} />
                    </div>
                  )}
                  {activeTab === "partner" && (
                    <div style={{ padding: "0 12px"  }}>
                      <MemberPartnerTab />
                    </div>
                  )}
                  {(activeTab === "utilities" || activeTab === "apps") && (
                    <div style={{ padding: "0 12px"  }}>
                      <MemberUtilitiesTab bio={bio} publicLink={publicLink} showToast={showToast} setFormData={setFormData} handleSave={handleSave} renderAccountForm={renderAccountForm} selectedUtility={utilitySelection} onSelectUtility={handleSelectUtility} psychologySubTab={psychologySubTabFromUrl} onSelectPsychologySubTab={handleSelectPsychologySubTab} defaultPsychologyPresetTest={defaultPsychologyPresetTest} sleepAutoDetect={sleepAutoDetect} onBioUpdate={patchMemberBio} ideLessonId={activeTab === "utilities" && subTab === "ide" ? psychTab : null} />
                    </div>
                  )}
                  {(activeTab === "history" || activeTab === "activity") && (
                    <div style={{ padding: "0 12px"  }}>
                      <MemberHistoryTab showToast={showToast} notifications={notifications} onMarkRead={markRead} onMarkAllRead={markAllRead} onDismiss={dismiss} />
                    </div>
                  )}
                  {activeTab === "settings" && (
                    <div style={{ padding: "0 12px"  }}>
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
                        handleCopyLink={handleCopyLink}
                        handleDeleteBio={handleDeleteBio}
                        onOpenParticleModal={openParticleModal}
                        renderAccountForm={renderAccountForm}
                      />
                    </div>
                  )}
                  {activeTab === "account" && (
                    <div style={{ padding: "0 12px"  }}>
                      {renderSettings()}
                    </div>
                  )}
                </>
              )}
            </React.Suspense>
          </ErrorBoundary>
        </div>

        {/* Ngay trên tab bar, giống Podcasts: thanh này chỉ hiện khi có đài
            đang phát, và hiện ở mọi tab vì audio sống trong radioStore. */}
        {showMobileNavigation && (
          <RadioMiniPlayer onOpen={() => navigate("/member/utilities/radio")} />
        )}

        {showMobileNavigation && (
          <MobilePortalNav
            tabs={mobileTabs}
            activeArea={portalArea}
            unreadCount={unreadNotifCount}
            navigationLabel={t("memberPortal.navigation.primaryNavigation")}
            onTabClick={onTabClick}
          />
        )}
      </div>
      )}

        {!isGuestMode && memberSession?.email ? (
          <React.Suspense fallback={null}>
            <PWAPermissionOnboarding
              email={memberSession.email}
              enabled={!loading && !showOnboarding && !showVerifyModal}
            />
          </React.Suspense>
        ) : null}

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

        {showBirthdaySurprise && (
          <React.Suspense fallback={null}>
            <BirthdaySurprise
              displayName={formData.displayName}
              mode={birthdayMode}
              onClose={() => { setShowBirthdaySurprise(false); setShowBirthdayWheel(true); }}
            />
          </React.Suspense>
        )}
        {showBirthdayWheel && !isGuestMode && memberSession?.email && (
          <React.Suspense fallback={null}>
            <BirthdayWheel
              onClose={() => setShowBirthdayWheel(false)}
              onAwarded={() => fetchJoyBalance(memberSession.email)}
            />
          </React.Suspense>
        )}
        {showOnboarding && !isGuestMode && memberSession?.email && (
          <OnboardingProfileModal
            email={memberSession.email}
            requireBirthDate={!bio?.birthYear}
            onSkip={bio?.birthYear ? () => setShowOnboarding(false) : undefined}
            onDone={(result) => {
              setShowOnboarding(false);

              if (result?.referralCode) setBio(prev => prev ? { ...prev, referralCode: result.referralCode, onboardingCompleted: true } : prev);
              if (result?.birth) setBio(prev => prev ? { ...prev, ...result.birth } : prev);
              fetchJoyBalance(memberSession.email);
            }}
          />
        )}
        <TourSystem />

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

    {particleOpen && (
      <React.Suspense fallback={null}>
        <ParticleConnectModal
          open
          bio={bio}
          initialMode={particleMode}
          onClose={() => setParticleOpen(false)}
          onSuccess={() => {
            if (bio?.email) fetchJoyBalance(bio.email);
          }}
        />
      </React.Suspense>
    )}
    </>
  );
}

export default MemberPortalPage;
