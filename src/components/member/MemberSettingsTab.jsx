import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { memberTier, TierBadge } from "../../lib/memberTier";
import BiometricLoginCard from "./BiometricLoginCard";
import ToggleSwitch from "../common/ToggleSwitch";
import { pushService } from "../../services/pushService";
import { webauthnHelper } from "../../utils/webauthnHelper";
import { hapticSelect } from "../../utils/haptics";
import PersonalInfoSubTab from "./PersonalInfoSubTab";
import CheckinCard from "./CheckinCard";
import MemberCardStack from "./card/MemberCardStack";
import AccountSheet from "./account/AccountSheet";
import AccountThemeSheet from "./account/AccountThemeSheet";
import { auraThemeTranslationKey, resolveActivePortalTheme } from "../../data/auraThemes";
import { useJoyStore } from "../../stores/joyStore";
import { fetchJoyPerks, fetchChallengeStatus, checkHasPin } from "../../services/joyApi";
import { isVoucherActive } from "./joy/voucherStatus";
import {
  ChevronRight,
  Bell,
  Lock,
  Globe,
  Sparkles,
  LogOut,
  Check,
  Share2,
  LocateFixed,
} from "lucide-react";
import EcoToggle from "../../Save_E/EcoToggle";
import {
  SUPPORTED_LANGUAGES,
  languageCode,
  languageLabel,
  localeForLanguage,
} from "../../i18n/languages";
import { changeAppLanguage } from "../../i18n/config";
import { useJoy } from "../../lib/joyDisplay";

// Ví JOY sống trong Tài khoản, nhưng mỗi màn chỉ nạp khi thật sự mở ra — trang
// Tài khoản là màn hay vào nhất, đừng bắt nó tải cả cửa hàng lẫn tài liệu.
const MemberManageTab = React.lazy(() => import("./MemberManageTab"));
const MemberDocReader = React.lazy(() => import("./account/MemberDocReader"));

const SheetFallback = () => {
  const { t } = useTranslation();
  return <p className="py-10 text-center text-[14px] text-muted-foreground">{t("memberPortal.accountHub.opening")}</p>;
};

export default function MemberSettingsTab({
  memberSession,
  showToast,
  handleLogout,
  bio,
  formData,
  handleFieldChange,
  publicLink,
  saving,
  isDragOver,
  setIsDragOver,
  processFile,
  avatarInputRef,
  handleAvatarChange,
  handleRemoveAvatar,
  handleSave,
  handleCopyLink,
  handleDeleteBio,
  onBioUpdate,
  onOpenParticleModal,
  onSelectTab,
  onSelectUtility,
  accountSubTab,
  isGuestMode,
  initialHasPin,
}) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const memberDocuments = useMemo(() => ({
    "doc:joy-rules": {
      id: "joy-rules",
      title: t("memberPortal.accountHub.documents.joyRulesTitle"),
      subtitle: t("memberPortal.accountHub.documents.joyRulesSubtitle"),
    },
    "doc:privileges": {
      id: "privileges",
      title: t("memberPortal.accountHub.documents.privilegesTitle"),
      subtitle: t("memberPortal.accountHub.documents.privilegesSubtitle"),
    },
    "doc:conditions": {
      id: "conditions",
      title: t("memberPortal.accountHub.documents.conditionsTitle"),
      subtitle: t("memberPortal.accountHub.documents.conditionsSubtitle"),
    },
    "doc:rights-access": {
      id: "rights-access",
      title: t("memberPortal.accountHub.documents.rightsTitle"),
      subtitle: t("memberPortal.accountHub.documents.rightsSubtitle"),
    },
    "doc:full-text": {
      id: "full-text",
      title: t("memberPortal.accountHub.documents.fullTextTitle"),
      subtitle: t("memberPortal.accountHub.documents.fullTextSubtitle"),
    },
  }), [t]);
  // null | personal | notifications | security | language | wallet | perks | missions
  //      | history | store | redeem | manage | doc:privileges | doc:conditions
  //      | doc:rights-access
  const [activeSheet, setActiveSheet] = useState(null);

  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const email = memberSession?.email;
  const joy = useJoy();
  const joyBalance = useJoyStore((state) => state.balance);
  const referralCode = useJoyStore((state) => state.referralCode);
  const referralCount = useJoyStore((state) => state.referralCount);
  
  // Dữ liệu phụ của ví chỉ tải khi mở đúng sheet. Trang Tài khoản dùng dữ liệu
  // bootstrap sẵn có nên không tạo thêm request ngay khi vừa vào.
  const [perks, setPerks] = useState(null);
  // Giá trị loading/error chỉ dùng để hiện trong sheet ví — sheet đó đã chuyển
  // sang app Ví JOY, nhưng loader vẫn cần setter để badge ở hàng dẫn vào app đúng.
  const [, setPerksLoading] = useState(false);
  const [perksLoaded, setPerksLoaded] = useState(false);
  const [, setPerksError] = useState("");
  const [challenges, setChallenges] = useState([]);
  const [, setChallengesLoading] = useState(false);
  const [challengesLoaded, setChallengesLoaded] = useState(false);
  const [hasPin, setHasPin] = useState(
    typeof initialHasPin === "boolean" ? initialHasPin : null,
  );
  const perksRequestRef = useRef(null);
  const challengesRequestRef = useRef(null);

  const walletReady = Boolean(email) && !isGuestMode;

  const loadPerks = useCallback(() => {
    if (!walletReady) return Promise.resolve();
    if (perksRequestRef.current) return perksRequestRef.current;
    setPerksError("");
    setPerksLoading(true);
    const request = fetchJoyPerks(bio)
      .then(setPerks)
      .catch((e) => setPerksError(e.message || t("memberPortal.accountHub.perksLoadError")))
      .finally(() => {
        setPerksLoading(false);
        setPerksLoaded(true);
        perksRequestRef.current = null;
      });
    perksRequestRef.current = request;
    return request;
  }, [walletReady, bio, t]);

  const loadChallenges = useCallback(() => {
    if (!walletReady) return Promise.resolve();
    if (challengesRequestRef.current) return challengesRequestRef.current;
    setChallengesLoading(true);
    const request = fetchChallengeStatus(email)
      .then(setChallenges)
      .finally(() => {
        setChallengesLoading(false);
        setChallengesLoaded(true);
        challengesRequestRef.current = null;
      });
    challengesRequestRef.current = request;
    return request;
  }, [walletReady, email]);

  useEffect(() => {
    if (typeof initialHasPin === "boolean") setHasPin(initialHasPin);
  }, [initialHasPin]);

  useEffect(() => {
    const onPinSet = () => setHasPin(true);
    window.addEventListener("hugo:pin-set", onPinSet);
    return () => window.removeEventListener("hugo:pin-set", onPinSet);
  }, []);

  useEffect(() => {
    pushService.isSubscribed().then(setPushEnabled);
    setBiometricSupported(webauthnHelper.isSupported());
  }, []);

  useEffect(() => {
    const isOpen = Boolean(activeSheet);
    window.dispatchEvent(new CustomEvent("hugo:fullsheet", { detail: { open: isOpen } }));
    return () => {
      window.dispatchEvent(new CustomEvent("hugo:fullsheet", { detail: { open: false } }));
    };
  }, [activeSheet]);

  const handleTogglePush = async () => {
    setPushBusy(true);
    try {
      if (pushEnabled) {
        await pushService.unsubscribe();
        setPushEnabled(false);
        showToast?.(t("memberPortal.settings.pushDisabledToast"), "success");
      } else {
        // One call for both shells: Web Push on the browser, APNs/FCM in the
        // store builds. The facade returns the outcome instead of throwing.
        const result = await pushService.subscribe(email);
        if (result === "granted") {
          setPushEnabled(true);
          showToast?.(t("memberPortal.settings.pushEnabledToast"), "success");
        } else if (result === "denied") {
          showToast?.(t("memberPortal.settings.pushDeniedToast"), "warning");
        }
      }
    } catch {
      showToast?.(t("memberPortal.settings.pushErrorToast"), "error");
    } finally {
      setPushBusy(false);
    }
  };

  const currentLang = languageCode(i18n.resolvedLanguage || i18n.language);
  const numberLocale = localeForLanguage(currentLang);
  const selectLanguage = async (code) => {
    if (code === currentLang) return;
    await changeAppLanguage(code);
  };

  const displayName = formData?.displayName || bio?.displayName || memberSession?.displayName || t("memberPortal.navigation.memberFallback");

  const copyReferralCode = async () => {
    const code = referralCode || bio?.referralCode;
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      showToast?.(t("memberPortal.joy.referral.copied"), "success");
    } catch {
      showToast?.(t("memberPortal.bioPreview.copyError"), "error");
    }
  };

  const openSheet = (id) => {
    hapticSelect();
    setActiveSheet(id);
    if ((id === "wallet" || id === "perks") && !perksLoaded) loadPerks();
    if ((id === "wallet" || id === "missions") && !challengesLoaded) loadChallenges();
    if (id === "wallet" && hasPin === null && typeof initialHasPin !== "boolean") {
      checkHasPin().then((data) => setHasPin(Boolean(data.hasPin))).catch(() => {});
    }
  };
  // Ví JOY giờ là ỨNG DỤNG riêng. Trang Tài khoản chỉ còn một cửa dẫn vào đó —
  // không giữ bản ví thứ hai để hai nơi không trôi lệch nhau.
  const openWalletApp = (query = "") => {
    hapticSelect();
    if (onSelectUtility) onSelectUtility(`joy_wallet${query}`);
    else if (onSelectTab) onSelectTab("utilities");
  };

  const openMemberDocument = (id) => {
    hapticSelect();
    navigate(`/member/account/${id}`);
  };
  const closeSheet = () => {
    if (activeSheet?.startsWith("doc:")) navigate("/member/account", { replace: true });
    setActiveSheet(null);
  };

  useEffect(() => {
    const sheetId = `doc:${accountSubTab || ""}`;
    setActiveSheet((current) => {
      if (memberDocuments[sheetId]) return sheetId;
      return current?.startsWith("doc:") ? null : current;
    });
  }, [accountSubTab, memberDocuments]);

  // ── Tóm tắt cho các hàng: cái gì đang chờ người dùng thì nói ra ngay ở hàng,
  //    khỏi phải mở từng mục để dò.
  const activeVoucherCount = useMemo(() => {
    const vouchers = perksLoaded
      ? (perks?.vouchers || [])
      : (Array.isArray(bio?.serviceVouchers) ? bio.serviceVouchers : []);
    return vouchers.filter((voucher) => isVoucherActive(voucher)).length;
  }, [bio?.serviceVouchers, perks, perksLoaded]);
  const spinAvailable = Boolean(perks?.spin?.available);
  const pendingMissions = challenges.filter((c) => c.completed && !c.claimed);
  const pendingJoy = pendingMissions.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const completedCount = challenges.filter((c) => c.completed).length;

  // MỘT lối vào duy nhất. Ba nút "gửi / mã nhận / quét" mở đúng cùng một modal,
  // và modal đó đã có sẵn ba tab bên trong — ba nút ngoài chỉ làm người dùng phải
  // chọn trước khi biết mình chọn gì.
  const quickActions = [
    { mode: "search", icon: "send", label: t("memberPortal.walletApp.sendJoy") },
  ];

  return (
    <div className="hugo-account-shell hugo-account-shell--remade mx-auto space-y-3 animate-fadeIn text-left select-none pb-28 font-sans">
      {/* Identity sits outside the settings cards, like an Apple Account header. */}
      <header className="hugo-account-header">
        <div className="hugo-account-titlebar">
          <span><small>{t("memberPortal.accountHub.eyebrow")}</small><strong>{t("memberPortal.accountHub.title")}</strong><em>{t("memberPortal.accountHub.subtitle")}</em></span>
        </div>
      <button
        type="button"
        onClick={() => openSheet("personal")}
        className="hugo-account-member hugo-account-member--ios27 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          <div className="hugo-account-avatar relative rounded-full bg-muted overflow-hidden shrink-0">
            {formData.avatarUrl ? (
              <img src={formData.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary text-white text-xl font-semibold">
                {displayName[0]?.toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <span className="hugo-account-member-kicker">{t("memberPortal.accountHub.eyebrow")}</span>
            <h2 className="text-base font-black text-foreground truncate leading-snug">
              {displayName}
            </h2>
            <p className="text-[11px] font-medium text-muted-foreground truncate mt-0.5">
              {memberSession?.email || t("memberPortal.settings.account.personalInformation")}
            </p>
            <div className="hugo-account-member-statuses">
              <TierBadge tier={memberTier({ ...formData, starVip: bio?.starVip })} />
              {bio?.isEduVerified ? (
                <span className="hugo-account-verified"><span className="material-symbols-outlined">verified</span>{t("memberPortal.accountHub.verified")}</span>
              ) : null}
            </div>
          </div>
        </div>

        <span className="hugo-account-member-edit" aria-hidden="true">
          <span>{t("memberPortal.accountHub.edit")}</span><ChevronRight className="w-4 h-4" />
        </span>
      </button>
      </header>

      {walletReady && (
        <>
          <section className="hugo-account-overview" aria-label={t("memberPortal.accountHub.overviewAria")}>
            <button type="button" onClick={() => openWalletApp()}>
              <span className="material-symbols-outlined">toll</span>
              <small>{t("memberPortal.accountHub.balance")}</small>
              <strong>{joy.number(joyBalance || 0)}</strong>
              <em>{joy.code}</em>
            </button>
            <button type="button" onClick={() => openWalletApp("?tab=missions")}>
              <span className="material-symbols-outlined">task_alt</span>
              <small>{t("memberPortal.accountHub.missions")}</small>
              <strong>{challengesLoaded ? `${completedCount}/${challenges.length}` : t("memberPortal.accountHub.open")}</strong>
              <em>{pendingMissions.length ? t("memberPortal.accountHub.pendingJoy", { amount: joy.number(pendingJoy) }) : t("memberPortal.accountHub.today")}</em>
            </button>
            <button type="button" onClick={() => openWalletApp("?sub=perks")}>
              <span className="material-symbols-outlined">confirmation_number</span>
              <small>{t("memberPortal.accountHub.perks")}</small>
              <strong>{activeVoucherCount}</strong>
              <em>{spinAvailable ? t("memberPortal.accountHub.spinAvailable") : t("memberPortal.accountHub.activeVouchers")}</em>
            </button>
          </section>

          <section className="hugo-account-quickbar" aria-label={t("memberPortal.accountHub.quickActionsAria")}>
            <button type="button" onClick={openWalletApp}>
              <span className="material-symbols-outlined">account_balance_wallet</span><small>{t("memberPortal.accountHub.center")}</small>
            </button>
            {quickActions.map((action) => (
              <button
                key={action.mode}
                type="button"
                onClick={() => { hapticSelect(); onOpenParticleModal?.(action.mode); }}
              >
                <span className="material-symbols-outlined">{action.icon}</span><small>{action.label}</small>
              </button>
            ))}
          </section>

          {(hasPin === false || pendingMissions.length > 0) && (
            <section className="hugo-account-attention" aria-label={t("memberPortal.accountHub.attentionAria")}>
              <header><span className="material-symbols-outlined">notifications_active</span><strong>{t("memberPortal.accountHub.attention")}</strong></header>
              {hasPin === false && (
                <button type="button" onClick={() => { hapticSelect(); onOpenParticleModal?.("setup-pin"); }}>
                  <span className="material-symbols-outlined">lock_open</span>
                  <span><strong>{t("memberPortal.accountHub.setPin")}</strong><small>{t("memberPortal.accountHub.pinDescription")}</small></span>
                  <ChevronRight />
                </button>
              )}
              {pendingMissions.length > 0 && (
                <button type="button" onClick={() => openWalletApp("?tab=missions")}>
                  <span className="material-symbols-outlined">redeem</span>
                  <span><strong>{t("memberPortal.accountHub.claimJoy", { amount: joy.number(pendingJoy) })}</strong><small>{t("memberPortal.accountHub.missionsWaiting", { count: pendingMissions.length })}</small></span>
                  <ChevronRight />
                </button>
              )}
            </section>
          )}
        </>
      )}

      {/* ── THẺ THÀNH VIÊN + VÍ JOY ─────────────────────────────────────────
          Ví không còn là một "app" riêng: số dư, ba nút hay dùng nhất và mọi
          việc của ví đều nằm thẳng ở đây. */}
      {activeSheet === "__legacy-card" && <section className="hugo-account-joy-card" aria-label={t("memberPortal.account.membershipCard")}>
        <MemberCardStack
          referralCount={referralCount}
          referralCode={referralCode || bio?.referralCode}
          displayName={displayName}
          email={email}
          onCopyReferral={copyReferralCode}
        />
      </section>}

      {activeSheet === "__legacy-wallet" && walletReady && (
        <>
          {/* Ba lối vào ví: vòng tròn icon, không khung thẻ. Ba tấm thẻ trắng
              cao 76px cho ba nút là ba khối chữ nhật nữa trong một trang vốn
              đã toàn khối chữ nhật. */}
          <div className="flex items-start justify-center gap-7">
            {quickActions.map((a) => (
              <button
                key={a.mode}
                type="button"
                onClick={() => { hapticSelect(); onOpenParticleModal?.(a.mode); }}
                className="flex w-[72px] flex-col items-center gap-1.5 text-foreground"
              >
                <span className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-card border border-border/60 transition-colors active:bg-muted">
                  <span className="material-symbols-outlined text-[24px]">{a.icon}</span>
                </span>
                <span className="text-[12.5px] font-medium">{a.label}</span>
              </button>
            ))}
          </div>

          {/* Điểm danh: thao tác một chạm mỗi ngày, để trong sheet là bắt người
              dùng mở thêm một lớp mới bấm được. CheckinCard tự nó đã là một
              thẻ — đừng bọc thêm khung nữa. */}
          <CheckinCard email={email} showToast={showToast} />

          {hasPin === false && (
            <button
              type="button"
              onClick={() => { hapticSelect(); onOpenParticleModal?.("setup-pin"); }}
              className="flex w-full items-center gap-3 rounded-2xl border border-border/50 bg-card px-4 py-3.5 text-left transition-colors active:bg-muted"
            >
              <span className="material-symbols-outlined text-[22px] text-muted-foreground">lock_open</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold text-foreground">{t("memberPortal.accountHub.pinMissing")}</span>
                <span className="block text-[12.5px] text-muted-foreground">{t("memberPortal.accountHub.pinDescription")}</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          )}

          <AccountSection title={t("memberPortal.accountHub.walletSection")}>
            <AccountRow
              symbol="account_balance_wallet"
              tint="orange"
              title={t("memberPortal.walletApp.title")}
              detail={t("utilities.catalog.joy_wallet.description")}
              badge={(spinAvailable ? 1 : 0) + activeVoucherCount + pendingMissions.length}
              onClick={openWalletApp}
            />
          </AccountSection>
        </>
      )}

      {/* ── TÀI LIỆU THÀNH VIÊN ────────────────────────────────────────────
          Đặc quyền và điều kiện là thứ để TRA, nên viết thành văn bản như trang
          chính sách chứ không phải carousel thẻ vuốt ngang. */}
      <AccountSection title={t("memberPortal.accountHub.memberSection")}>
        <AccountRow
          symbol="toll"
          tint="amber"
          title={t("memberPortal.accountHub.documents.joyRulesTitle")}
          detail={t("memberPortal.accountHub.documents.joyRulesDetail")}
          onClick={() => openMemberDocument("joy-rules")}
        />
        <AccountRow
          symbol="shield_lock"
          tint="blue"
          title={t("memberPortal.accountHub.documents.rightsTitle")}
          detail={t("memberPortal.accountHub.documents.rightsDetail")}
          onClick={() => openMemberDocument("rights-access")}
        />
        <AccountRow
          symbol="workspace_premium"
          tint="teal"
          title={t("memberPortal.accountHub.documents.privilegesTitle")}
          detail={t("memberPortal.accountHub.documents.privilegesDetail")}
          onClick={() => openMemberDocument("privileges")}
        />
        <AccountRow
          symbol="gavel"
          tint="purple"
          title={t("memberPortal.accountHub.documents.conditionsTitle")}
          detail={t("memberPortal.accountHub.documents.conditionsDetail")}
          onClick={() => openMemberDocument("conditions")}
        />
        <AccountRow
          symbol="menu_book"
          tint="violet"
          title={t("memberPortal.accountHub.documents.fullTextTitle")}
          detail={t("memberPortal.accountHub.documents.fullTextDetail")}
          onClick={() => openMemberDocument("full-text")}
        />
      </AccountSection>

      <AccountSection title={t("memberPortal.settings.account.bioTitle")}>
        <AccountRow
          symbol="package_2"
          tint="emerald"
          title={t("memberPortal.accountHub.manageTitle")}
          detail={t("memberPortal.accountHub.manageDetail")}
          onClick={() => openSheet("manage")}
        />
        <AccountRow
          icon={Sparkles}
          tint="violet"
          title={t("memberPortal.settings.account.bioTitle")}
          detail={t("memberPortal.settings.account.bioDescription")}
          onClick={() => {
            hapticSelect();
            if (onSelectUtility) onSelectUtility("bio");
            else if (onSelectTab) onSelectTab("utilities");
            else navigate("/member/utilities/bio");
          }}
        />
        {publicLink && (
          <AccountRow
            as="a"
            href={publicLink}
            icon={Share2}
            tint="sky"
            title={t("memberPortal.settings.account.publicBio")}
            detail={t("memberPortal.settings.account.publicBioDescription")}
            trailingIcon="open_in_new"
          />
        )}
      </AccountSection>

      <AccountSection title={t("memberPortal.accountHub.privacySection")}>
        <AccountRow
          icon={Bell}
          tint="blue"
          title={t("memberPortal.settings.account.notifications")}
          detail={t("memberPortal.settings.account.notificationsDescription")}
          onClick={() => openSheet("notifications")}
        />
        <AccountRow
          icon={LocateFixed}
          tint="emerald"
          title={t("memberPortal.permissions.title")}
          detail={t("memberPortal.permissions.description")}
          onClick={() => { hapticSelect(); window.dispatchEvent(new Event("hugo:show-permission-primer")); }}
        />
        <AccountRow
          icon={Lock}
          tint="purple"
          title={t("memberPortal.settings.account.privacy")}
          detail={t("memberPortal.settings.account.privacyDescription")}
          onClick={() => openSheet("security")}
        />
      </AccountSection>

      <AccountSection title={t("memberPortal.accountHub.systemSection")}>
        <AccountRow
          symbol="palette"
          tint="violet"
          title={t("aura.accountThemeTitle")}
          detail={t(auraThemeTranslationKey(resolveActivePortalTheme(bio), "Name"))}
          onClick={() => openSheet("themes")}
        />
        <AccountRow
          icon={Globe}
          tint="teal"
          title={t("memberPortal.settings.account.language")}
          value={languageLabel(currentLang)}
          onClick={() => openSheet("language")}
        />
        <div className="hugo-account-eco-inset"><EcoToggle /></div>
      </AccountSection>

      <div className="hugo-account-group">
        <button type="button" onClick={handleLogout} className="hugo-account-logout">
          <LogOut className="w-[18px] h-[18px]" />
          <span>{t("memberPortal.settings.account.signOut")}</span>
        </button>
      </div>

      {/* ── SHEETS ─────────────────────────────────────────────────────────── */}
      {activeSheet === "personal" && (
        <AccountSheet
          title={t("memberPortal.settings.account.personalInformation")}
          subtitle={t("memberPortal.account.personalInformationDescription")}
          onClose={closeSheet}
          wide
        >
          <PersonalInfoSubTab
            formData={formData}
            handleFieldChange={handleFieldChange}
            handleSave={async (event) => {
              await handleSave(event);
              closeSheet();
            }}
            saving={saving}
            isDragOver={isDragOver}
            setIsDragOver={setIsDragOver}
            processFile={processFile}
            avatarInputRef={avatarInputRef}
            handleAvatarChange={handleAvatarChange}
            handleRemoveAvatar={handleRemoveAvatar}
            memberSession={memberSession}
            bio={bio}
            hideAvatarSection={false}
            t={t}
          />
        </AccountSheet>
      )}

      

      {activeSheet === "themes" && (
        <AccountSheet
          title={t("aura.accountThemeTitle")}
          subtitle={t("aura.accountThemeDescription")}
          onClose={closeSheet}
          wide
        >
          <AccountThemeSheet bio={bio} showToast={showToast} onBioUpdate={onBioUpdate} />
        </AccountSheet>
      )}

      

      

      

      

      

      

      {activeSheet === "manage" && (
        <AccountSheet title={t("memberPortal.accountHub.manageTitle")} onClose={closeSheet} wide>
          <React.Suspense fallback={<SheetFallback />}>
            <MemberManageTab
              bio={bio}
              publicLink={publicLink}
              handleCopyLink={handleCopyLink}
              handleDeleteBio={handleDeleteBio}
              saving={saving}
            />
          </React.Suspense>
        </AccountSheet>
      )}

      {activeSheet?.startsWith("doc:") && (
        <AccountSheet
          title={memberDocuments[activeSheet]?.title || t("memberPortal.accountHub.memberDocument")}
          subtitle={memberDocuments[activeSheet]?.subtitle}
          onClose={closeSheet}
          wide
        >
          <React.Suspense fallback={<SheetFallback />}>
            <MemberDocReader docId={memberDocuments[activeSheet]?.id} />
          </React.Suspense>
        </AccountSheet>
      )}

      {activeSheet === "notifications" && (
        <AccountSheet title={t("memberPortal.settings.account.notificationSettings")} onClose={closeSheet}>
          <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
            <div className="min-w-0 pr-3">
              <h4 className="text-[15px] font-semibold text-foreground">{t("memberPortal.settings.pushTitle")}</h4>
              <p className="text-[12.5px] text-muted-foreground">{t("memberPortal.settings.account.pushDescription")}</p>
            </div>
            <ToggleSwitch checked={pushEnabled} onChange={handleTogglePush} disabled={pushBusy} label={t("memberPortal.settings.pushTitle")} />
          </div>
        </AccountSheet>
      )}

      {activeSheet === "security" && (
        <AccountSheet title={t("memberPortal.settings.account.privacyBiometrics")} onClose={closeSheet}>
          {biometricSupported && email ? (
            <BiometricLoginCard memberSession={memberSession} showToast={showToast} bare />
          ) : (
            <p className="text-[14px] text-muted-foreground">{t("memberPortal.settings.account.biometricUnsupported")}</p>
          )}
        </AccountSheet>
      )}

      {activeSheet === "language" && (
        <AccountSheet title={t("memberPortal.settings.account.chooseLanguage")} onClose={closeSheet}>
          <div className="space-y-2">
            {SUPPORTED_LANGUAGES.map((lng) => {
              const active = currentLang === lng.code;
              return (
                <button
                  key={lng.code}
                  onClick={async () => { await selectLanguage(lng.code); closeSheet(); }}
                  className={`flex min-h-[52px] w-full items-center justify-between rounded-2xl border px-4 text-[16px] transition-colors ${
                    active ? "border-primary bg-primary/10 font-semibold text-primary" : "border-border bg-card text-foreground"
                  }`}
                >
                  <span>{lng.label}</span>
                  {active && <Check className="h-4 w-4 text-primary" />}
                </button>
              );
            })}
          </div>
        </AccountSheet>
      )}
    </div>
  );
}

const ROW_TINTS = {
  violet: "#7C5CFF", sky: "#0A84FF", blue: "#0A84FF", emerald: "#30D158",
  purple: "#BF5AF2", teal: "#40C8E0", orange: "#FF9F0A", pink: "#FF375F",
  green: "#30D158",
};

/** Nhóm thu gọn: màn chính chỉ cho thấy danh mục, chạm mới mở các thao tác con. */
function AccountSection({ title, children }) {
  return (
    <details className="hugo-account-section">
      <summary className="hugo-account-section-summary">
        <span>{title}</span>
        <ChevronRight aria-hidden="true" />
      </summary>
      <div className="hugo-account-group">{children}</div>
    </details>
  );
}

/**
 * Một hàng cài đặt. Luôn là <button> (hoặc <a> khi mở link ngoài) để bàn phím
 * tới được và có viền focus.
 *
 * `icon` là component lucide, `symbol` là tên Material Symbol — các hàng của ví
 * dùng đúng bộ icon đơn sắc mà phần còn lại của portal đang dùng. `badge` là số
 * việc đang chờ; 0 thì không vẽ gì.
 */
function AccountRow({
  as = "button", icon: Icon, symbol, tint = "blue", title, detail, value,
  badge = 0, trailingIcon = "chevron", onClick, href,
}) {
  const Tag = as;
  const props = as === "a"
    ? { href, target: "_blank", rel: "noreferrer" }
    : { type: "button", onClick };

  return (
    <Tag {...props} className="hugo-account-row">
      <span className="hugo-account-row-icon" style={{ background: ROW_TINTS[tint] || ROW_TINTS.blue }}>
        {Icon
          ? <Icon className="w-[17px] h-[17px]" strokeWidth={2.2} />
          : <span className="material-symbols-outlined text-[17px]" aria-hidden="true">{symbol}</span>}
      </span>
      <span className="hugo-account-row-text">
        <span className="hugo-account-row-title">{title}</span>
        {detail && <span className="hugo-account-row-detail">{detail}</span>}
      </span>
      {badge > 0 && (
        <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[12.5px] font-semibold tabular-nums text-white">
          {badge}
        </span>
      )}
      {value && <span className="hugo-account-row-value">{value}</span>}
      {trailingIcon === "chevron"
        ? <ChevronRight className="hugo-account-row-chevron" />
        : <span className="material-symbols-outlined hugo-account-row-chevron" aria-hidden="true">{trailingIcon}</span>}
    </Tag>
  );
}
