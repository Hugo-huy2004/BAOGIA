import React, { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { useJoyStore } from "../../../stores/joyStore";
import {
  fetchJoyPerks, fetchChallengeStatus, checkHasPin, fetchJoyHistory, getJoyLaterStatus, claimTreeBonus,
} from "../../../services/joyApi";
import { localeForLanguage } from "../../../i18n/languages";
import { JOY_DENOMS } from "../../../../shared/joyCurrency.js";
import { useJoy } from "../../../lib/joyDisplay";
import { hapticSelect } from "../../../utils/haptics";
import BackButton from "../shared/BackButton";
import "./wallet-app.css";

// Ví JOY — ứng dụng riêng, toàn màn hình.
//
// BỐ CỤC: số dư là thứ to nhất màn hình, rồi tới việc đang chờ bạn xử lý, rồi
// giao dịch mới nhất. KHÔNG bọc từng thứ trong một thẻ viền riêng — dùng danh
// sách nhóm kiểu iOS: một khối bo góc, các hàng cách nhau bằng gạch mảnh thụt
// vào ngang mép chữ.
//
// Thẻ thành viên và thẻ điểm danh vẫn còn nhưng nằm ở MÀN RIÊNG của chúng, giống
// Apple Wallet: màn chính là số dư + danh sách giao dịch, hình thẻ có màn riêng.
//
// Không chép logic ví: mọi panel là component dùng chung với phần còn lại của
// portal, nên sửa một chỗ là mọi nơi đổi theo.
const JoyMissions = lazy(() => import("../joy/JoyMissions"));
const JoyHistory = lazy(() => import("../joy/JoyHistory"));
const JoyPerks = lazy(() => import("../joy/JoyPerks"));
const JoyRedeem = lazy(() => import("../joy/JoyRedeem"));
const MemberUtilityStoreTab = lazy(() => import("../MemberUtilityStoreTab"));
const JoyLaterSheet = lazy(() => import("../account/JoyLaterSheet"));
const CheckinCard = lazy(() => import("../CheckinCard"));
const MembershipTab = lazy(() => import("./MembershipTab"));
const JoyTree = lazy(() => import("./JoyTree"));
const JoyConverter = lazy(() => import("./JoyConverter"));
const JoyDenomPicker = lazy(() => import("./JoyDenomPicker"));
import TransactionReceiptModal from "./TransactionReceiptModal";

const TABS = [
  { id: "overview", icon: "account_balance_wallet", labelKey: "memberPortal.walletApp.tabOverview" },
  { id: "membership", icon: "badge", labelKey: "memberPortal.walletApp.tabMembership" },
  { id: "missions", icon: "task_alt", labelKey: "memberPortal.walletApp.tabMissions" },
  { id: "history", icon: "receipt_long", labelKey: "memberPortal.walletApp.tabHistory" },
  { id: "later", icon: "schedule_send", labelKey: "memberPortal.walletApp.tabLater" },
];

const Panel = ({ children }) => (
  <Suspense fallback={<p className="wal-loading">…</p>}>{children}</Suspense>
);

/** Ô vuông trong lưới lối tắt — icon đơn sắc trên nền thẻ, nhãn hai dòng. */
function Tile({ icon, label, badge, onClick }) {
  return (
    <button type="button" className="wal-tile" onClick={onClick}>
      <span className="material-symbols-outlined" aria-hidden="true">{icon}</span>
      <small>{label}</small>
      {badge > 0 && <b className="wal-tile__badge">{badge}</b>}
    </button>
  );
}

/** Nút tròn trong ô số dư — icon trong vòng tròn, nhãn nằm dưới. */
function Act({ icon, label, onClick }) {
  return (
    <button type="button" className="wal-act" onClick={onClick}>
      <span className="material-symbols-outlined" aria-hidden="true">{icon}</span>
      <small>{label}</small>
    </button>
  );
}

/** Một hàng trong danh sách nhóm. Icon đơn sắc, không huy hiệu màu. */
function Row({ icon, title, detail, value, valueTone, badge, onClick }) {
  return (
    <button type="button" className="wal-row" onClick={onClick}>
      <span className="wal-row__icon material-symbols-outlined" aria-hidden="true">{icon}</span>
      <span className="wal-row__body">
        <strong>{title}</strong>
        {detail && <small>{detail}</small>}
      </span>
      {value && <span className={`wal-row__value${valueTone ? ` is-${valueTone}` : ""}`}>{value}</span>}
      {badge > 0 && <b className="wal-row__badge">{badge}</b>}
      <span className="wal-row__chevron material-symbols-outlined" aria-hidden="true">chevron_right</span>
    </button>
  );
}

export default function HugoWalletApp({ bio, onBack, showToast, onBioUpdate, onOpenParticleModal, publicLink, onSelectUtility }) {
  const { t, i18n } = useTranslation();
  const locale = localeForLanguage(i18n.resolvedLanguage || i18n.language);
  const joy = useJoy();
  const fmt = joy.number;
  // Đơn vị JOY của tài khoản — CHỌN MỘT LẦN rồi cố định, không theo ngôn ngữ
  // giao diện (xem Bio.joyDenom).
  const myDenom = JOY_DENOMS[bio?.joyDenom] ? bio.joyDenom : null;

  const balance = useJoyStore((state) => state.balance);
  const referralCount = useJoyStore((state) => state.referralCount);
  const setBalance = useJoyStore((state) => state.setBalance);

  const API = import.meta.env.VITE_API_URL || "/api";
  const { data: stockPortfolio } = useSWR("/stock/portfolio", (path) =>
    fetch(`${API}${path}`, { credentials: "include" }).then((r) => (r.ok ? r.json() : null)),
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  );

  const stockTotalVal = stockPortfolio?.totalValue || 0;
  const stockPnL = stockPortfolio?.unrealizedPnL || 0;
  const stockPnLPct = stockPortfolio?.unrealizedPct || 0;
  const totalNetWorth = balance + stockTotalVal;

  const [searchParams] = useSearchParams();
  const paramTab = searchParams.get("tab");
  const paramSub = searchParams.get("sub");
  const [tab, setTab] = useState(() => paramTab || "overview");
  const [sub, setSub] = useState(() => paramSub || null);

  useEffect(() => {
    if (paramTab) setTab(paramTab);
    if (paramSub) setSub(paramSub);
  }, [paramTab, paramSub]);
  const [selectedTx, setSelectedTx] = useState(null);
  const [perks, setPerks] = useState(null);
  const [perksLoading, setPerksLoading] = useState(false);
  const [perksError, setPerksError] = useState("");
  const [challenges, setChallenges] = useState([]);
  const [challengesLoading, setChallengesLoading] = useState(false);
  const [recent, setRecent] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loan, setLoan] = useState(null);
  const [hasPin, setHasPin] = useState(null);
  const [treeBonusTaken, setTreeBonusTaken] = useState(false);
  const [treeBusy, setTreeBusy] = useState(false);
  const perksRequest = useRef(null);
  const challengeRequest = useRef(null);

  const email = bio?.email || bio?.contactEmail || "";

  const loadPerks = useCallback(() => {
    if (!email || perksRequest.current) return perksRequest.current || Promise.resolve();
    setPerksError("");
    setPerksLoading(true);
    const request = fetchJoyPerks(bio)
      .then(setPerks)
      .catch((error) => setPerksError(error.message || t("memberPortal.accountHub.perksLoadError")))
      .finally(() => { setPerksLoading(false); perksRequest.current = null; });
    perksRequest.current = request;
    return request;
  }, [bio, email, t]);

  const loadChallenges = useCallback(() => {
    if (!email || challengeRequest.current) return challengeRequest.current || Promise.resolve();
    setChallengesLoading(true);
    const request = fetchChallengeStatus(email)
      .then(setChallenges)
      .finally(() => { setChallengesLoading(false); challengeRequest.current = null; });
    challengeRequest.current = request;
    return request;
  }, [email]);

  // Sáu giao dịch gần nhất hiện thẳng ở màn đầu — không phải bấm sang tab khác
  // mới biết mình vừa nhận hay vừa trả bao nhiêu.
  const loadRecent = useCallback(() => {
    fetchJoyHistory({ limit: 6, days: 30 })
      .then(({ transactions, summary: sum }) => { setRecent(transactions); setSummary(sum); })
      .catch(() => {});
  }, []);

  const loadLoan = useCallback(() => {
    getJoyLaterStatus().then((data) => setLoan(data.loan)).catch(() => setLoan(null));
  }, []);

  useEffect(() => {
    if (!email) return;
    loadPerks();
    loadChallenges();
    loadRecent();
    loadLoan();
    checkHasPin().then((data) => setHasPin(Boolean(data.hasPin))).catch(() => {});
  }, [email, loadPerks, loadChallenges, loadRecent, loadLoan]);

  // Số dư đổi ở bất cứ đâu cũng đẩy sự kiện này (WebSocket joy_update) — cập
  // nhật ngay, không polling.
  useEffect(() => {
    const refresh = () => { loadRecent(); loadLoan(); };
    window.addEventListener("hugo:notification", refresh);
    return () => window.removeEventListener("hugo:notification", refresh);
  }, [loadRecent, loadLoan]);

  useEffect(() => {
    if (sub === "perks" && !perks) loadPerks();
    if (tab === "missions" && challenges.length === 0) loadChallenges();
  }, [sub, tab, perks, challenges.length, loadPerks, loadChallenges]);

  const pendingMissions = challenges.filter((item) => item.completed && !item.claimed);
  const claimedCount = challenges.filter((item) => item.claimed).length;
  const pendingJoy = pendingMissions.reduce((sum, item) => sum + (item.amount || 0), 0);
  const activeVoucherCount = perks?.vouchers?.filter((voucher) => !voucher.used)?.length || 0;
  const spinAvailable = Boolean(perks?.spin?.available);

  const openSub = (id) => {
    hapticSelect();
    if (id === "perks" && !perks) loadPerks();
    setSub(id);
  };
  const timeOf = (iso) => new Date(iso).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="wal">
      {/* Không có thanh tiêu đề — chỉ nút quay lại nổi trên nội dung, như mọi
          app ví. Tên màn đã nằm trong chính nội dung màn đó. */}
      <BackButton
        className={`wal-back${!sub && tab === "overview" ? " is-on-hero" : ""}`}
        onClick={sub ? () => setSub(null) : onBack}
        iconOnly
      />

      <main className="wal-main">
        {/* ── Màn con: mỗi thứ một màn, không nhồi hết vào màn chính ── */}
        {sub === "perks" && <Panel><JoyPerks perks={perks} loading={perksLoading} error={perksError} onReload={loadPerks} email={email} /></Panel>}
        {sub === "store" && (
          <Panel>
            <MemberUtilityStoreTab
              bio={bio} balance={balance}
              onPurchased={(next) => { setBalance(next); loadPerks(); loadRecent(); }}
              onBioUpdate={onBioUpdate} showToast={showToast}
            />
          </Panel>
        )}
        {sub === "redeem" && <Panel><JoyRedeem email={email} bio={bio} showToast={showToast} onBioUpdate={onBioUpdate} /></Panel>}
        {sub === "convert" && (
          <Panel>
            {myDenom
              ? <JoyConverter balance={balance} denom={myDenom} />
              : <JoyDenomPicker
                  balance={balance}
                  onChosen={(denom) => { onBioUpdate?.({ joyDenom: denom }); setSub(null); }}
                />}
          </Panel>
        )}

        {/* ── Màn chính ── */}
        {!sub && tab === "overview" && (
          <>
            {/* Tab JOY chỉ hiển thị SỐ DƯ — thẻ thành viên ở tab Membership */}
            <section className="wal-hero">
              <div className="wal-hero__top">
                {bio?.avatarUrl
                  ? <img className="wal-hero__avatar" src={bio.avatarUrl} alt="" />
                  : <span className="wal-hero__avatar is-empty material-symbols-outlined" aria-hidden="true">person</span>}
                <strong>{t("memberPortal.navigation.todayGreeting", { name: bio?.displayName || "" })}</strong>
              </div>
              <p className="wal-hero__label">{t("memberPortal.walletApp.balanceLabel")}</p>
              {/* Số dư viết bằng ĐƠN VỊ CỦA TÀI KHOẢN — như mọi con số khác
                  trong app. JOY gốc chỉ còn là đơn vị tính toán bên trong. */}
              <p className="wal-hero__amount">{joy.number(balance)}<span>{joy.code}</span></p>
              {!myDenom && (
                <button type="button" className="wal-hero__denom" onClick={() => openSub("convert")}>
                  {t("memberPortal.walletApp.denomPickCta")}
                  <span className="material-symbols-outlined" aria-hidden="true">chevron_right</span>
                </button>
              )}
              {summary && (
                <p className="wal-hero__sub">
                  {t("memberPortal.walletApp.monthSummary", {
                    earned: fmt(summary.earned),
                    spent: fmt(Math.abs(summary.spent || 0)),
                  })}
                </p>
              )}
              <div className="wal-hero__actions">
                {/* MỘT nút gửi. Trước đây ba nút (gửi / mã nhận / quét) mở đúng
                    cùng một modal — mà modal đó đã có sẵn ba tab bên trong, nên
                    ba nút ngoài chỉ là ba đường vào một chỗ. */}
                <Act icon="north_east" label={t("memberPortal.walletApp.sendJoy")} onClick={() => { hapticSelect(); onOpenParticleModal?.("search"); }} />
                <Act icon="show_chart" label={t("memberPortal.walletApp.convert")} onClick={() => openSub("convert")} />
                <Act icon="schedule_send" label={t("memberPortal.walletApp.tabLater")} onClick={() => { hapticSelect(); setTab("later"); }} />
              </div>
            </section>

            {/* Việc đang chờ — chỉ hiện khi thật sự có, không chiếm chỗ vô ích */}
            {(pendingJoy > 0 || loan || hasPin === false) && (
              <section className="wal-group" aria-label={t("memberPortal.walletApp.needsYou")}>
                {pendingJoy > 0 && (
                  <Row
                    icon="redeem"
                    title={t("memberPortal.walletApp.claimReady")}
                    detail={t("memberPortal.walletApp.claimCount", { count: pendingMissions.length })}
                    value={`+${fmt(pendingJoy)}`}
                    valueTone="in"
                    onClick={() => { hapticSelect(); setTab("missions"); }}
                  />
                )}
                {loan && (
                  <Row
                    icon="schedule_send"
                    title={t("memberPortal.joyLater.owing")}
                    detail={t("memberPortal.joyLater.days", { count: loan.remainingDays })}
                    value={`−${fmt(loan.outstanding)}`}
                    valueTone="out"
                    onClick={() => { hapticSelect(); setTab("later"); }}
                  />
                )}
                {hasPin === false && (
                  <Row
                    icon="lock_open"
                    title={t("memberPortal.accountHub.pinMissing")}
                    detail={t("memberPortal.accountHub.pinDescription")}
                    onClick={() => { hapticSelect(); onOpenParticleModal?.("setup-pin"); }}
                  />
                )}
              </section>
            )}

            {/* Điểm danh NGAY tại đây — việc làm mỗi ngày thì không nên bắt mở
                thêm một màn nữa mới bấm được. */}
            <Panel>
              <CheckinCard
                email={email}
                showToast={showToast}
                onClaimed={() => { loadRecent(); loadChallenges(); }}
              />
            </Panel>

            {/* Ecosystem Asset Allocation & Stock Portfolio Card */}
            <section className="wal-group my-3">
              <div className="p-4 rounded-3xl bg-gradient-to-br from-indigo-950/90 via-zinc-900/95 to-purple-950/80 border border-indigo-500/30 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                      <span className="material-symbols-outlined text-xl">candlestick_chart</span>
                    </div>
                    <div className="text-left">
                      <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-indigo-300">Hệ Sinh Thái Hugo Invest</span>
                      <h4 className="text-xs font-black text-white">Tài Sản & Chứng Khoán</h4>
                    </div>
                  </div>
                  {onSelectUtility && (
                    <button
                      type="button"
                      onClick={() => { hapticSelect(); onSelectUtility("invest"); }}
                      className="px-3 py-1.5 rounded-full text-xs font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/30 active:scale-95 transition-all flex items-center gap-1 shrink-0"
                    >
                      <span>Vào Sàn Stock</span>
                      <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-left">
                  <div className="bg-black/40 p-2.5 rounded-2xl border border-white/5">
                    <span className="text-[10px] text-zinc-400 font-medium block">Tổng Tài Sản Net Worth:</span>
                    <div className="text-sm font-black text-amber-400 font-mono mt-0.5">
                      {fmt(totalNetWorth)} <small className="text-[9.5px] font-bold text-amber-300/80">{joy.code}</small>
                    </div>
                  </div>
                  <div className="bg-black/40 p-2.5 rounded-2xl border border-white/5">
                    <span className="text-[10px] text-zinc-400 font-medium block">Giá Trị Cổ Phiếu (PnL):</span>
                    <div className={`text-sm font-black font-mono mt-0.5 flex items-center gap-1 ${stockPnL >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      <span>{fmt(stockTotalVal)}</span>
                      <span className="text-[9px] px-1 py-0.2 rounded-md bg-white/10 font-sans">
                        {stockPnL >= 0 ? "+" : ""}{(stockPnLPct * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Lối tắt đặt TRÊN sổ giao dịch: đây là chỗ để bấm, còn sổ giao dịch
                là chỗ để đọc — thứ bấm được phải nằm trong tầm ngón tay. */}
            <h2 className="wal-title">{t("memberPortal.walletApp.more")}</h2>
            <section className="wal-grid">
              <Tile
                icon="confirmation_number"
                label={t("memberPortal.accountHub.myPerks")}
                badge={(spinAvailable ? 1 : 0) + activeVoucherCount}
                onClick={() => openSub("perks")}
              />
              <Tile icon="storefront" label={t("memberPortal.accountHub.perksStore")} onClick={() => openSub("store")} />
              <Tile icon="redeem" label={t("memberPortal.accountHub.redeemReferral")} onClick={() => openSub("redeem")} />
            </section>

            {/* Giao dịch mới nhất — ngay màn đầu, đúng như một ví điện tử */}
            <h2 className="wal-title">{t("memberPortal.walletApp.latest")}</h2>
            <section className="wal-group">
              {recent.length === 0 && <p className="wal-empty">{t("memberPortal.walletApp.noTransactions")}</p>}
              {recent.slice(0, 4).map((tx) => (
                <button
                  key={tx.id}
                  type="button"
                  onClick={() => { hapticSelect(); setSelectedTx(tx); }}
                  className="wal-row text-left"
                >
                  <span className={`wal-row__icon material-symbols-outlined ${tx.amount >= 0 ? "text-emerald-500" : "text-rose-500"}`} aria-hidden="true">
                    {tx.amount >= 0 ? "south_west" : "north_east"}
                  </span>
                  <span className="wal-row__body">
                    <strong>{tx.title}</strong>
                    <small>{timeOf(tx.createdAt)}{tx.description ? ` · ${tx.description}` : ""}</small>
                  </span>
                  <span className={`wal-row__value is-${tx.amount >= 0 ? "in" : "out"}`}>
                    {tx.amount >= 0 ? "+" : "−"}{fmt(Math.abs(tx.amount))}
                  </span>
                  <span className="wal-row__chevron material-symbols-outlined" aria-hidden="true">chevron_right</span>
                </button>
              ))}
              {recent.length > 0 && (
                <Row icon="more_horiz" title={t("memberPortal.walletApp.seeAll")} onClick={() => { hapticSelect(); setTab("history"); }} />
              )}
            </section>
          </>
        )}

        {!sub && tab === "membership" && (
          <Panel>
            <MembershipTab
              bio={bio}
              publicLink={publicLink}
              referralCount={referralCount}
              referralCode={bio?.referralCode}
              onCopyReferral={async () => {
                try {
                  await navigator.clipboard.writeText(bio?.referralCode || "");
                  showToast?.(t("memberPortal.joy.referral.copied"), "success");
                } catch {
                  showToast?.(t("memberPortal.bioPreview.copyError"), "error");
                }
              }}
            />
          </Panel>
        )}

        {!sub && tab === "missions" && (
          <Panel>
            {/* Cây lớn theo số nhiệm vụ đã nhận — xong hết thì thưởng thêm */}
            <JoyTree
              claimed={claimedCount}
              total={challenges.length}
              bonusClaimed={treeBonusTaken}
              busy={treeBusy}
              onClaimBonus={async () => {
                setTreeBusy(true);
                try {
                  const result = await claimTreeBonus();
                  setTreeBonusTaken(true);
                  setBalance(result.balance);
                  loadRecent();
                  showToast?.(t("memberPortal.walletApp.tree.bonusTaken", { amount: result.awarded }), "success");
                } catch (error) {
                  // Đã nhận rồi thì ghi nhớ để không mời nhận lần nữa.
                  if (/đã nhận/i.test(error.message)) setTreeBonusTaken(true);
                  showToast?.(error.message, "error");
                } finally {
                  setTreeBusy(false);
                }
              }}
            />
            <JoyMissions
              email={email} showToast={showToast} challenges={challenges}
              loading={challengesLoading}
              onReload={() => { loadChallenges(); loadRecent(); }}
              onSelectUtility={onSelectUtility}
              onGoToWalletTab={setTab}
            />
          </Panel>
        )}
        {!sub && tab === "history" && <Panel><JoyHistory showToast={showToast} /></Panel>}
        {!sub && tab === "later" && <Panel><JoyLaterSheet onBalanceChange={() => { loadPerks(); loadRecent(); loadLoan(); }} /></Panel>}
      </main>

      {!sub && (
        <nav className="wal-nav" aria-label={t("memberPortal.walletApp.navAria")}>
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={tab === item.id ? "is-active" : ""}
              aria-current={tab === item.id ? "page" : undefined}
              onClick={() => { hapticSelect(); setTab(item.id); }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: tab === item.id ? "'FILL' 1" : "" }}
                aria-hidden="true"
              >
                {item.icon}
              </span>
              <small>{t(item.labelKey)}</small>
              {item.id === "missions" && pendingJoy > 0 && <b className="wal-dot" aria-hidden="true" />}
            </button>
          ))}
        </nav>
      )}

      {selectedTx && (
        <TransactionReceiptModal
          tx={selectedTx}
          onClose={() => setSelectedTx(null)}
          showToast={showToast}
        />
      )}
    </div>
  );
}
