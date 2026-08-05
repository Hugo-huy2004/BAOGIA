import React, { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { claimInfoBonus, claimInfoReadBonus } from "../../services/joyApi";
import { useJoyStore } from "../../stores/joyStore";
import { MembershipFactory } from "../../models/membershipTier";
import JoyCard from "./card/JoyCard";
import SubUtilityHeader from "./SubUtilityHeader";
import pkg from "../../../package.json";
import "./info-showcase.css";

// [id, icon, biến màu neon] — icon là Material Symbols đơn sắc, màu do CSS
// custom property `--tone` quyết định nên không cần class Tailwind động.
const HIGHLIGHTS = [
  ["security", "shield_lock", "var(--neon-teal)"],
  ["store", "grid_view", "var(--neon-cyan)"],
  ["ai", "hub", "var(--neon-violet)"],
  ["arcade", "sports_esports", "var(--neon-amber)"],
  ["offline", "cloud_off", "var(--neon-pink)"],
  ["wallet", "account_balance_wallet", "var(--neon-lime)"],
];

const COMPARE_ROWS = [
  ["architecture", "account_tree"],
  ["auth", "lock"],
  ["ai", "neurology"],
  ["arcade", "stadium"],
  ["offline", "wifi_off"],
  ["notify", "notifications"],
];

const SEMVER_PARTS = [
  { id: "major", tone: "var(--neon-pink)", nameKey: "semverMajorName" },
  { id: "minor", tone: "var(--neon-cyan)", nameKey: "semverMinorName" },
  { id: "patch", tone: "var(--neon-lime)", nameKey: "semverPatchName" },
];

// Nguồn tên/mô tả là `utilities.catalog.*` — cùng nguồn với kho ứng dụng.
const ECOSYSTEM = [
  ["bio", "badge"],
  ["joy_wallet", "account_balance_wallet"],
  ["psychology", "psychology"],
  ["ide", "code"],
  ["hugoso", "school"],
  ["arcade", "stadium"],
  ["aura", "blur_on"],
  ["helpdesk", "support_agent"],
  ["handle", "handyman"],
  ["radio", "radio"],
  ["hugoskin", "face"],
  ["team", "groups"],
  ["deco", "chair"],
  ["map", "explore"],
  ["library", "store"],
];

const GUIDE_STEPS = ["step1", "step2", "step3", "step4"];

/** Minh hoạ vẽ hoàn toàn bằng CSS — không ảnh, không SVG ngoài. */
function Mock({ id, label }) {
  const head = (
    <div className="mock__bar">
      <span className="mock__dot mock__dot--live" />
      <span className="mock__dot" />
      <span className="mock__dot" />
      <span className="mock__title">{label}</span>
    </div>
  );

  if (id === "security") {
    return (
      <div className="mock" aria-hidden="true">
        {head}
        <div className="mock-rows">
          <div className="mock-row mock-row--pass">
            <span className="material-symbols-outlined">verified_user</span>
            <span>Google token</span><span>verified</span>
          </div>
          <div className="mock-row mock-row--block">
            <span className="material-symbols-outlined">block</span>
            <span>?email=admin</span><span>denied</span>
          </div>
          <div className="mock-row mock-row--pass">
            <span className="material-symbols-outlined">key</span>
            <span>QR · HMAC</span><span>signed</span>
          </div>
        </div>
      </div>
    );
  }

  if (id === "store") {
    return (
      <div className="mock" aria-hidden="true">
        {head}
        <div className="mock-apps">
          {["badge", "code", "radio", "stadium", "blur_on", "support_agent", "handyman", "explore", "chair", "face"].map((icon, i) => (
            <i key={icon} className={i < 4 ? "on" : i === 4 ? "load on" : ""}>
              <span className="material-symbols-outlined">{icon}</span>
            </i>
          ))}
        </div>
      </div>
    );
  }

  if (id === "ai") {
    return (
      <div className="mock" aria-hidden="true">
        {head}
        <div className="mock-flow">
          <div className="mock-flow__src"><span>PSY</span><span>CODER</span><span>BOT</span></div>
          <div className="mock-flow__wires"><i /><i /><i /></div>
          <div className="mock-flow__gate"><b>GATEWAY</b><small>quota · cache</small></div>
        </div>
      </div>
    );
  }

  if (id === "arcade") {
    return (
      <div className="mock" aria-hidden="true">
        {head}
        <div className="mock-games">
          {["castle", "rocket_launch", "bolt", "view_compact", "grid_view", "close", "spellcheck", "route"].map((icon) => (
            <i key={icon}><span className="material-symbols-outlined">{icon}</span></i>
          ))}
        </div>
      </div>
    );
  }

  if (id === "offline") {
    return (
      <div className="mock" aria-hidden="true">
        {head}
        <div className="mock-sync">
          <div className="mock-sync__state">
            <span className="material-symbols-outlined">wifi_off</span>
            <span>Offline · đã lưu cục bộ</span>
          </div>
          <div className="mock-sync__queue">
            <span>Tetris · 12,480<b>chờ</b></span>
            <span>Snake · 8,120<b>chờ</b></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mock" aria-hidden="true">
      {head}
      <div className="mock-wallet">
        <div className="mock-wallet__balance"><b>12,480</b><small>JOY</small></div>
        <div className="mock-wallet__row"><span>HugoArcade</span><b>+75</b></div>
        <div className="mock-wallet__row"><span>Điểm danh</span><b>+20</b></div>
      </div>
    </div>
  );
}

export default function MemberInfoVersionTab({ bio, onBioUpdate, showToast, onBack }) {
  const { t } = useTranslation();
  const versionDigits = pkg.version.split(".");

  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(!!bio?.infoBonusClaimed);
  const [readClaiming, setReadClaiming] = useState(false);
  const [readClaimed, setReadClaimed] = useState(!!bio?.infoReadBonusClaimed);
  const [readUnlocked, setReadUnlocked] = useState(!!bio?.infoReadBonusClaimed);
  const [progress, setProgress] = useState(0);
  const claimLocksRef = useRef(new Set());

  // Thẻ hiển thị là thẻ thật của người đang đăng nhập, không phải ảnh mẫu.
  const referralCount = useJoyStore((s) => s.referralCount);
  const joyBalance = useJoyStore((s) => s.balance);
  const referralCode = useJoyStore((s) => s.referralCode);
  const walletLoaded = useJoyStore((s) => s.loaded);
  const rank = MembershipFactory.calculateProgressDetails(referralCount);
  const allTiers = MembershipFactory.getAllTiers();

  useEffect(() => {
    if (!walletLoaded && bio?.email) useJoyStore.getState().fetchBalance(bio.email);
  }, [walletLoaded, bio?.email]);

  // Dải thẻ ướm màu — mở ở đúng hạng người dùng đang giữ, rồi vuốt để xem hạng khác.
  const trackRef = useRef(null);
  const currentTierIndex = allTiers.findIndex((tier) => tier.id === rank.currentTier.id);
  const [previewIndex, setPreviewIndex] = useState(Math.max(currentTierIndex, 0));
  const previewTier = allTiers[previewIndex] || rank.currentTier;

  const scrollToTier = useCallback((index) => {
    const track = trackRef.current;
    const slide = track?.children?.[index];
    if (!track || !slide) return;
    track.scrollTo({
      left: slide.offsetLeft - (track.clientWidth - slide.clientWidth) / 2,
      behavior: "smooth",
    });
  }, []);

  // Chỉ số ô đang ở giữa khung nhìn — suy ra từ vị trí cuộn nên vuốt tay,
  // cuộn trackpad hay bấm chấm tròn đều cho cùng một kết quả.
  const handleTrackScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const centre = track.scrollLeft + track.clientWidth / 2;
    let closest = 0;
    let smallest = Infinity;
    Array.from(track.children).forEach((slide, index) => {
      const distance = Math.abs(slide.offsetLeft + slide.clientWidth / 2 - centre);
      if (distance < smallest) { smallest = distance; closest = index; }
    });
    setPreviewIndex(closest);
  }, []);

  // Canh về hạng hiện tại sau khi ví tải xong (hạng có thể đổi khi số liệu về).
  useEffect(() => {
    if (currentTierIndex < 0) return;
    const timer = window.setTimeout(() => scrollToTier(currentTierIndex), 60);
    return () => window.clearTimeout(timer);
  }, [currentTierIndex, scrollToTier]);

  const articleRef = useRef(null);
  const endRef = useRef(null);

  // Mở khoá khi đoạn cuối thực sự lọt vào khung nhìn. IntersectionObserver
  // đúng dù trang cuộn bằng window hay bằng một div lồng bên trong.
  useEffect(() => {
    const target = endRef.current;
    if (!target || readUnlocked) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setReadUnlocked(true); },
      { threshold: 0.6 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [readUnlocked]);

  // Thanh tiến độ đọc. Dùng capture để bắt cả sự kiện cuộn của container lồng.
  useEffect(() => {
    const update = () => {
      const el = articleRef.current;
      if (!el) return;
      const { top, height } = el.getBoundingClientRect();
      const scrollable = height - window.innerHeight;
      if (scrollable <= 0) { setProgress(1); return; }
      setProgress(Math.min(Math.max(-top / scrollable, 0), 1));
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, []);

  const claim = useCallback(async ({ request, setBusy, setDone, bioField, successKey, errorKey }) => {
    if (!bio?.email || claimLocksRef.current.has(bioField)) return;
    claimLocksRef.current.add(bioField);
    setBusy(true);
    try {
      const res = await request(bio.email);
      setDone(true);
      onBioUpdate?.({ [bioField]: true });
      if (!res.alreadyClaimed) {
        showToast?.(t(successKey), "success");
        useJoyStore.getState().fetchBalance(bio.email, undefined, { force: true });
      }
    } catch (_) {
      showToast?.(t(errorKey), "error");
    } finally {
      claimLocksRef.current.delete(bioField);
      setBusy(false);
    }
  }, [bio, onBioUpdate, showToast, t]);

  const handleClaim = () => {
    if (claimed || claiming) return;
    claim({
      request: claimInfoBonus,
      setBusy: setClaiming,
      setDone: setClaimed,
      bioField: "infoBonusClaimed",
      successKey: "memberPortal.infoVersion.bonusSuccess",
      errorKey: "memberPortal.infoVersion.bonusError",
    });
  };

  const handleReadClaim = () => {
    if (readClaimed || readClaiming || !readUnlocked) return;
    claim({
      request: claimInfoReadBonus,
      setBusy: setReadClaiming,
      setDone: setReadClaimed,
      bioField: "infoReadBonusClaimed",
      successKey: "memberPortal.infoVersion.readBonusSuccess",
      errorKey: "memberPortal.infoVersion.readBonusError",
    });
  };

  const k = (key) => t(`memberPortal.infoVersion.${key}`);

  return (
    <div className="mx-auto max-w-2xl">
      <SubUtilityHeader
        title={k("title")}
        icon="info"
        colorClass="text-primary"
        onBack={onBack}
        appId="info"
      />

      <article ref={articleRef} className="infoshow">
        <div className="infoshow__bg" aria-hidden="true" />
        <div className="infoshow__grid" aria-hidden="true" />

        <div className="infoshow__inner">
          <div className="infoshow__progress" aria-hidden="true">
            <i style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>

          {/* ── Hero ── */}
          <header className="infoshow__hero">
            <span className="infoshow__badge">
              <span className="material-symbols-outlined">bolt</span>
              {k("heroTagline")}
            </span>
            <div className="infoshow__version" aria-label={`Version ${pkg.version}`}>
              <i>{versionDigits[0]}</i><b>.</b>
              <i>{versionDigits[1]}</i><b>.</b>
              <i>{versionDigits[2]}</i>
            </div>
            <h1>{k("aboutTitle")}</h1>
            <p>{k("heroBody")}</p>
          </header>

          {/* ── Nổi bật ── */}
          <section>
            <p className="infoshow__eyebrow">
              <span className="material-symbols-outlined">auto_awesome</span>
              {k("highlightsTitle")}
            </p>
            <h2>{k("aboutTitle")}</h2>
            <p className="infoshow__lede">{k("aboutBody")}</p>

            <div className="infoshow__features">
              {HIGHLIGHTS.map(([id, icon, tone]) => (
                <div key={id} className="infoshow__feature" style={{ "--tone": tone }}>
                  <Mock id={id} label={k(`mock.${id}`)} />
                  <div className="infoshow__feature-head">
                    <span className="infoshow__feature-icon">
                      <span className="material-symbols-outlined">{icon}</span>
                    </span>
                    <h3>{k(`highlights.${id}.title`)}</h3>
                  </div>
                  <p>{k(`highlights.${id}.desc`)}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Bộ thẻ thành viên ── */}
          <section>
            <p className="infoshow__eyebrow">
              <span className="material-symbols-outlined">credit_card</span>
              {k("cardsEyebrow")}
            </p>
            <h2>{k("cardsTitle")}</h2>
            <p className="infoshow__lede">{k("cardsLede")}</p>

            {/* Dải thẻ ướm màu: cùng thông tin thật của người dùng, đổi qua
                từng hạng để thấy trước mình sẽ cầm tấm thẻ nào. `inert` vì đây
                là mục giới thiệu — thao tác thật nằm ở tab Ví JOY. */}
            <div className="infoshow__cardstage">
              <div
                ref={trackRef}
                className="infoshow__track"
                onScroll={handleTrackScroll}
                role="group"
                aria-label={k("cardsSwipeHint")}
              >
                {allTiers.map((tier, index) => (
                  <div
                    key={tier.id}
                    className="infoshow__slide"
                    data-active={index === previewIndex}
                    inert=""
                  >
                    <JoyCard
                      referralCount={referralCount}
                      balance={joyBalance}
                      referralCode={referralCode}
                      displayName={bio?.displayName || bio?.name}
                      email={bio?.email}
                      selectedTierOverride={tier}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="infoshow__dots">
              {allTiers.map((tier, index) => (
                <button
                  key={tier.id}
                  type="button"
                  className="infoshow__dot"
                  data-active={index === previewIndex}
                  style={{ "--dot-color": tier.colorHex }}
                  onClick={() => scrollToTier(index)}
                  aria-label={tier.name}
                  aria-current={index === previewIndex}
                />
              ))}
            </div>

            <p className="infoshow__cardcaption">
              <b>{previewTier.name}</b>
              <em>
                {previewTier.id === rank.currentTier.id
                  ? k("cardYoursNow")
                  : previewTier.isUnlocked(referralCount)
                  ? k("cardUnlocked")
                  : (
                    <span className="locked">
                      {t("memberPortal.infoVersion.cardPreviewLocked", {
                        count: previewTier.getReferralsNeeded(referralCount),
                      })}
                    </span>
                  )}
              </em>
              <em>{k("cardsSwipeHint")}</em>
            </p>

            {/* Tiến độ hạng — số liệu thật từ ví */}
            <div className="infoshow__rank">
              <div className="infoshow__rank-top">
                <b>{rank.currentTier.name}</b>
                <span>{t("memberPortal.infoVersion.rankReferrals", { count: rank.referralCount })}</span>
              </div>
              <div className="infoshow__rank-bar">
                <i style={{ width: `${rank.progressPct}%`, background: rank.currentTier.colorHex }} />
              </div>
              <p className="infoshow__rank-next">
                {rank.nextTier
                  ? t("memberPortal.infoVersion.rankNext", {
                      count: rank.referralsNeeded,
                      tier: rank.nextTier.name,
                    })
                  : k("rankMax")}
              </p>
            </div>

            <div className="infoshow__tiers">
              {allTiers.map((tier) => {
                const isNow = tier.id === rank.currentTier.id;
                return (
                  <div
                    key={tier.id}
                    className={`infoshow__tier ${isNow ? "infoshow__tier--now" : ""}`}
                    style={{ "--tier-bg": tier.cardBgStyle, "--tier-color": tier.colorHex }}
                  >
                    <div className="infoshow__tier-head">
                      <span className="infoshow__tier-chip" />
                      <b>{tier.name}</b>
                      {isNow && <span className="infoshow__tier-now">{k("tierNow")}</span>}
                    </div>
                    <span className="infoshow__tier-cond">
                      <span className="material-symbols-outlined">group_add</span>
                      {tier.minReferrals === 0
                        ? k("tierCondBase")
                        : t("memberPortal.infoVersion.tierCond", { count: tier.minReferrals })}
                    </span>
                    <ul className="infoshow__tier-perks">
                      {tier.getPrivileges().map((perk) => (
                        <li key={perk.id}>
                          <span className="material-symbols-outlined">{perk.icon}</span>
                          {perk.title}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>

            {/* Phạm vi sử dụng — nêu rõ để không ai hiểu nhầm là thẻ vật lý */}
            <div className="infoshow__disclaimer">
              <span className="material-symbols-outlined">info</span>
              <div>
                <b>{k("cardNoticeTitle")}</b>
                <p>{k("cardNoticeBody")}</p>
              </div>
            </div>
          </section>

          {/* ── So sánh 1.0 / 2.0 ── */}
          <section>
            <p className="infoshow__eyebrow">
              <span className="material-symbols-outlined">compare_arrows</span>
              {k("compareTitle")}
            </p>
            <h2>{k("compareTitle")}</h2>
            <p className="infoshow__lede">{k("compareHint")}</p>

            <div className="infoshow__tablewrap">
              <table className="infoshow__table">
                <thead>
                  <tr>
                    <th scope="col">{k("compareAspect")}</th>
                    <th scope="col">{k("compareOld")}</th>
                    <th scope="col">{k("compareNew")}</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE_ROWS.map(([row, icon]) => (
                    <tr key={row}>
                      <th scope="row">
                        <span className="infoshow__aspect">
                          <span className="material-symbols-outlined">{icon}</span>
                          {k(`compare.${row}.aspect`)}
                        </span>
                      </th>
                      <td className="infoshow__old">{k(`compare.${row}.old`)}</td>
                      <td className="infoshow__new">{k(`compare.${row}.new`)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ── Nguyên tắc đánh số phiên bản ── */}
          <section>
            <p className="infoshow__eyebrow">
              <span className="material-symbols-outlined">tag</span>
              {k("semverTitle")}
            </p>
            <h2>{k("semverTitle")}</h2>
            <p className="infoshow__lede">{k("semverIntro")}</p>

            {/* Chú thích trực quan: chữ số và tên quy tắc dùng chung một màu */}
            <div className="infoshow__semver-visual">
              {SEMVER_PARTS.map((part, index) => (
                <React.Fragment key={part.id}>
                  {index > 0 && <span>.</span>}
                  <div className="infoshow__semver-part">
                    <b style={{ color: part.tone, textShadow: `0 0 26px ${part.tone}` }}>
                      {versionDigits[index]}
                    </b>
                    <small style={{ color: part.tone }}>{k(part.nameKey)}</small>
                  </div>
                </React.Fragment>
              ))}
            </div>

            <div className="infoshow__semver" style={{ marginTop: 12 }}>
              {SEMVER_PARTS.map((part) => (
                <div key={part.id} className="infoshow__semver-item" style={{ "--tone": part.tone }}>
                  <header>
                    <h3>{k(`semver.${part.id}.title`)}</h3>
                    <code>{k(`semver.${part.id}.example`)}</code>
                  </header>
                  <p>{k(`semver.${part.id}.desc`)}</p>
                </div>
              ))}
            </div>

            <p className="infoshow__note">
              <span className="material-symbols-outlined">info</span>
              {k("semverNote")}
            </p>
          </section>

          {/* ── Hệ sinh thái ── */}
          <section>
            <p className="infoshow__eyebrow">
              <span className="material-symbols-outlined">apps</span>
              {k("ecosystemTitle")}
            </p>
            <h2>{k("ecosystemTitle")}</h2>
            <p className="infoshow__lede">{k("ecosystemHint")}</p>

            <div className="infoshow__apps">
              {ECOSYSTEM.map(([id, icon]) => (
                <div key={id} className="infoshow__app">
                  <span className="infoshow__app-icon">
                    <span className="material-symbols-outlined">{icon}</span>
                  </span>
                  <div className="min-w-0">
                    <b>{t(`utilities.catalog.${id}.title`)}</b>
                    <span>{t(`utilities.catalog.${id}.description`)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Hướng dẫn ── */}
          <section>
            <p className="infoshow__eyebrow">
              <span className="material-symbols-outlined">checklist</span>
              {k("guideTitle")}
            </p>
            <h2>{k("guideTitle")}</h2>
            <div className="infoshow__steps">
              {GUIDE_STEPS.map((step) => (
                <div key={step} className="infoshow__step">
                  <div className="min-w-0">
                    <b>{k(`guide.${step}.title`)}</b>
                    <span>{k(`guide.${step}.desc`)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Thưởng đọc hết ── */}
          <section ref={endRef}>
            <div className={`infoshow__reward ${readUnlocked ? "" : "infoshow__reward--locked"}`}>
              <div className="infoshow__reward-icon">
                <span className="material-symbols-outlined">
                  {readClaimed ? "check_circle" : readUnlocked ? "redeem" : "lock"}
                </span>
              </div>
              <h3>{k("readBonusTitle")}</h3>
              <p>{readUnlocked ? k("readBonusDesc") : k("readBonusLocked")}</p>
              <button
                type="button"
                className="infoshow__btn"
                onClick={handleReadClaim}
                disabled={!readUnlocked || readClaimed || readClaiming}
              >
                <span className="material-symbols-outlined">
                  {readClaimed ? "check_circle" : "card_giftcard"}
                </span>
                {readClaiming
                  ? k("readBonusClaiming")
                  : readClaimed
                  ? k("readBonusClaimed")
                  : readUnlocked
                  ? k("readBonusButton")
                  : k("readBonusLockedButton")}
              </button>

              <button
                type="button"
                className="infoshow__btn infoshow__btn--ghost"
                onClick={handleClaim}
                disabled={claimed || claiming}
              >
                <span className="material-symbols-outlined">
                  {claimed ? "check_circle" : "explore"}
                </span>
                {claiming
                  ? k("bonusClaiming")
                  : claimed
                  ? k("bonusClaimed")
                  : k("bonusButton")}
              </button>
            </div>

            <p className="infoshow__footer">{k("versionLabel")} · v{pkg.version}</p>
          </section>
        </div>
      </article>
    </div>
  );
}
