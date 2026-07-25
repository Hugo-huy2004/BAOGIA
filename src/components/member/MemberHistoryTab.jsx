import React, { useState, useMemo } from "react";
import { withTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll";
import { notify } from "../../lib/notify";
import { hapticSelect } from "../../utils/haptics";
import {
  Bell,
  RotateCw,
  CheckCheck,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CreditCard,
  Shield,
  AlertCircle,
  CheckCircle2,
  Info,
  Gift,
  ExternalLink,
  Sliders,
  Wallet,
  User,
  Zap,
  ArrowUpRight,
  ArrowDownLeft
} from "lucide-react";

const getHistoryTypeConfig = (t) => ({
  welcome: { color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20", label: t("memberTabs.history.labels.welcome"), cat: "account", icon: User },
  bio_link: { color: "text-sky-500", bg: "bg-sky-500/10 border-sky-500/20", label: "Bio Link", cat: "account", icon: ExternalLink },
  package_received: { color: "text-indigo-500", bg: "bg-indigo-500/10 border-indigo-500/20", label: t("memberTabs.history.labels.package_received"), cat: "package", icon: CreditCard },
  package_removed: { color: "text-rose-500", bg: "bg-rose-500/10 border-rose-500/20", label: t("memberTabs.history.labels.package_removed"), cat: "package", icon: AlertCircle },
  profile_updated: { color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20", label: t("memberTabs.history.labels.profile_updated"), cat: "account", icon: User },
  link_added: { color: "text-sky-500", bg: "bg-sky-500/10 border-sky-500/20", label: t("memberTabs.history.labels.link_added"), cat: "account", icon: ExternalLink },
  link_removed: { color: "text-muted-foreground", bg: "bg-muted border-border", label: t("memberTabs.history.labels.link_removed"), cat: "account", icon: X },
  birthday_wish: { color: "text-pink-500", bg: "bg-pink-500/10 border-pink-500/20", label: t("memberTabs.history.labels.birthday"), cat: "gift", icon: Gift },
  birthday_voucher: { color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20", label: t("memberTabs.history.labels.gift"), cat: "gift", icon: Gift }
});

const NOTIF_CATEGORY_CONFIG = {
  joy: { color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20", cat: "joy", icon: Wallet },
  payment: { color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20", cat: "joy", icon: CreditCard },
  package: { color: "text-indigo-500", bg: "bg-indigo-500/10 border-indigo-500/20", cat: "package", icon: CreditCard },
  verification: { color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20", cat: "account", icon: Shield },
  security: { color: "text-rose-500", bg: "bg-rose-500/10 border-rose-500/20", cat: "account", icon: AlertCircle },
  wellness: { color: "text-teal-500", bg: "bg-teal-500/10 border-teal-500/20", cat: "account", icon: Sparkles },
  system: { color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20", cat: "system", icon: Info },
  general: { color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20", cat: "system", icon: Bell }
};

const formatTime = (ts, t) => {
  if (!ts) return "";
  const d = new Date(ts);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return t("memberTabs.history.time.just_now");
  if (diff < 3600) return `${Math.floor(diff / 60)} ${t("memberTabs.history.time.minutes_ago")}`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ${t("memberTabs.history.time.hours_ago")}`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} ${t("memberTabs.history.time.days_ago")}`;
  return d.toLocaleDateString(t("memberTabs.history.localeCode", "vi-VN"), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

function parseJoyDetail(text) {
  if (!text) return { raw: text };
  let txId = null;
  const txMatch = text.match(/Mã GD:\s*([A-Z0-9]+)/);
  if (txMatch) txId = txMatch[1];

  let balance = null;
  const balMatch = text.match(/Số dư:\s*([\d,.]+)\s*JOY/);
  if (balMatch) balance = balMatch[1];

  let message = null;
  const msgMatch = text.match(/Lời nhắn:\s*"([^"]+)"/);
  if (msgMatch) message = msgMatch[1];

  let amount = null;
  let isPositive = null;
  const recvMatch = text.match(/chuyển\s*([\d,.]+)\s*JOY đến bạn/);
  if (recvMatch) {
    amount = recvMatch[1];
    isPositive = true;
  }
  const sendMatch = text.match(/\(\s*-([\d,.]+)\s*JOY/);
  if (sendMatch) {
    amount = sendMatch[1];
    isPositive = false;
  }

  let cleanText = text
    .replace(/Mã GD:\s*[A-Z0-9]+[.]?\s*/, "")
    .replace(/Số dư:\s*[\d,.]+\s*JOY[.]?\s*/, "")
    .replace(/Lời nhắn:\s*"[^"]+"[.]?\s*/, "")
    .trim();

  return { raw: text, cleanText, txId, balance, message, amount, isPositive };
}

function MemberHistoryTab({ bio, t, notifications = [], onMarkRead, onMarkAllRead, onDismiss }) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [claimedCodes, setClaimedCodes] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  const typeConfig = getHistoryTypeConfig(t);

  const mergedEntries = useMemo(() => {
    const fromBio = [...(bio?.history || [])].reverse().map((entry, idx) => {
      const cfg = typeConfig[entry.type] || typeConfig["profile_updated"];
      return {
        key: `bio-${idx}-${entry.timestamp}`,
        source: "bio",
        timestamp: entry.timestamp,
        title: entry.title,
        detail: entry.detail,
        cfg,
        raw: entry
      };
    });

    const fromNotif = notifications.map((n) => {
      const cfg = NOTIF_CATEGORY_CONFIG[n.category] || NOTIF_CATEGORY_CONFIG.system;
      return {
        key: `notif-${n._id}`,
        source: "notification",
        id: n._id,
        timestamp: n.createdAt,
        title: n.title,
        detail: n.message,
        cfg,
        read: n.read
      };
    });

    return [...fromBio, ...fromNotif].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [bio?.history, notifications, typeConfig]);

  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  const filteredEntries = useMemo(() => {
    return mergedEntries.filter((entry) => {
      if (activeFilter === "all") return true;
      return entry.cfg.cat === activeFilter;
    });
  }, [mergedEntries, activeFilter]);

  const { visibleItems: visibleEntries, sentinelRef, hasMore } = useInfiniteScroll(filteredEntries, { pageSize: 25 });

  const handleRefresh = () => {
    hapticSelect();
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast?.("Đã làm mới danh sách thông báo", "success");
    }, 600);
  };

  const onCopyVoucher = (code) => {
    navigator.clipboard.writeText(code);
    setClaimedCodes((prev) => ({ ...prev, [code]: true }));
    setTimeout(() => setClaimedCodes((prev) => ({ ...prev, [code]: false })), 2000);
    notify.success(t("memberTabs.history.copy_success_msg"));
  };

  const filters = [
    { id: "all", label: "Tất cả", count: mergedEntries.length },
    { id: "joy", label: "Ví JOY", count: mergedEntries.filter((e) => e.cfg.cat === "joy").length },
    { id: "system", label: "Hệ thống", count: mergedEntries.filter((e) => e.cfg.cat === "system").length },
    { id: "account", label: "Tài khoản", count: mergedEntries.filter((e) => e.cfg.cat === "account").length },
    { id: "package", label: "Gói cước", count: mergedEntries.filter((e) => e.cfg.cat === "package").length }
  ];

  return (
    <div className="max-w-md mx-auto space-y-4 animate-fadeIn text-left select-none pb-28 font-sans">
      {/* ── 1. FLOATING NOTIFICATION PANEL HEADER ────────────────────────────── */}
      <div className="bg-card border border-border/40 rounded-[24px] p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-black text-foreground tracking-tight">Notifications</h2>
            {unreadNotifCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-primary text-white text-[10px] font-black font-mono">
                {unreadNotifCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {unreadNotifCount > 0 && (
              <button
                onClick={() => {
                  hapticSelect();
                  onMarkAllRead?.();
                }}
                className="px-2.5 py-1 rounded-full bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-all active:scale-95 flex items-center gap-1"
                title="Đánh dấu tất cả đã đọc"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Đọc tất cả</span>
              </button>
            )}
            <button
              onClick={handleRefresh}
              className={`w-8 h-8 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground flex items-center justify-center transition-all active:scale-95 ${
                isRefreshing ? "animate-spin text-primary" : ""
              }`}
              title="Làm mới thông báo"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── 2. SEGMENTED PILL FILTER BAR ────────────────────────────────────── */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1">
          {filters.map((f) => {
            const active = activeFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => {
                  hapticSelect();
                  setActiveFilter(f.id);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 active:scale-95 ${
                  active
                    ? "bg-foreground text-background shadow-xs"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <span>{f.label}</span>
                {f.count > 0 && (
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${active ? "bg-background/20 text-background" : "bg-border/60 text-muted-foreground"}`}>
                    {f.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 3. EMPTY STATE ─────────────────────────────────────────────────── */}
      {filteredEntries.length === 0 && (
        <div className="bg-card border border-border/40 rounded-[24px] p-8 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground mx-auto">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-black text-foreground">Không Có Thông Báo Mới</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Bạn đã cập nhật tất cả thông báo hệ thống và giao dịch.
            </p>
          </div>
        </div>
      )}

      {/* ── 4. NOTIFICATION LIST ITEMS (EXPANDABLE CARD FEED) ──────────────── */}
      <div className="space-y-2.5">
        {visibleEntries.map((entry) => {
          const cfg = entry.cfg;
          const IconComp = cfg.icon || Bell;
          const isNotif = entry.source === "notification";
          const unread = isNotif && !entry.read;
          const isExpanded = expandedId === entry.key;

          let parsedJoy = null;
          if (cfg.cat === "joy") {
            parsedJoy = parseJoyDetail(entry.detail);
          }

          return (
            <div
              key={entry.key}
              className={`bg-card border rounded-[22px] p-3.5 shadow-xs transition-all duration-200 text-left ${
                unread
                  ? "border-primary/40 bg-primary/5 dark:bg-primary/10"
                  : "border-border/40 hover:border-border"
              }`}
            >
              {/* Top Row: Icon + Title + Meta Actions */}
              <div className="flex items-start gap-3">
                {/* Category Icon Badge */}
                <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 border ${cfg.bg} ${cfg.color}`}>
                  <IconComp className="w-4.5 h-4.5" />
                </div>

                {/* Main Content Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-black text-foreground leading-snug truncate">
                      {entry.title}
                    </h4>

                    <div className="flex items-center gap-1 shrink-0">
                      {unread && isNotif && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            hapticSelect();
                            onMarkRead?.(entry.id);
                          }}
                          className="p-1.5 rounded-full text-primary hover:bg-primary/10 active:scale-95 transition-all flex items-center justify-center"
                          title="Đánh dấu đã đọc"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => {
                          hapticSelect();
                          setExpandedId(isExpanded ? null : entry.key);
                          if (unread) onMarkRead?.(entry.id);
                        }}
                        className="p-1 rounded-full text-muted-foreground hover:bg-muted active:scale-95 transition-all"
                        title={isExpanded ? "Thu gọn" : "Xem thêm"}
                      >
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {isNotif && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDismiss?.(entry.id);
                          }}
                          className="p-1 rounded-full text-muted-foreground hover:text-rose-500 active:scale-95 transition-all"
                          title="Xóa thông báo"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Subtitle / Domain Chip & Time Row */}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {formatTime(entry.timestamp, t)}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground/60">•</span>
                    <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider">
                      {cfg.cat}
                    </span>
                  </div>

                  {/* Parsed JOY Details */}
                  {parsedJoy && parsedJoy.amount ? (
                    <div className="mt-2 space-y-1.5">
                      <div className="flex items-center justify-between bg-muted/40 p-2.5 rounded-xl border border-border/30">
                        <p className="text-xs font-bold text-foreground truncate">
                          {parsedJoy.cleanText || entry.title}
                        </p>
                        <span className={`text-xs font-black font-mono shrink-0 ml-2 ${parsedJoy.isPositive ? "text-emerald-500" : "text-foreground"}`}>
                          {parsedJoy.isPositive ? "+" : "-"}{parsedJoy.amount} JOY
                        </span>
                      </div>

                      {/* Receipt Metadata Chips */}
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {parsedJoy.txId && (
                          <span className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-mono font-bold text-muted-foreground border border-border/30">
                            GD: {parsedJoy.txId}
                          </span>
                        )}
                        {parsedJoy.balance && (
                          <span className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-bold text-muted-foreground border border-border/30">
                            Dư: {parsedJoy.balance} JOY
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Standard Message Preview */
                    entry.detail && !isExpanded && (
                      <p className="text-xs text-muted-foreground leading-relaxed mt-1 line-clamp-2">
                        {entry.detail}
                      </p>
                    )
                  )}

                  {/* Expandable Body Accordion */}
                  <AnimatePresence>
                    {isExpanded && entry.detail && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 pt-2 border-t border-border/30 space-y-2 text-xs text-foreground leading-relaxed"
                      >
                        <p className="whitespace-pre-wrap">{entry.detail}</p>

                        {/* Birthday Voucher Copy Action */}
                        {entry.raw?.type === "birthday_voucher" && bio?.birthdayVoucherCode && (
                          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-bold text-amber-500 uppercase block">Voucher Sinh Nhật</span>
                              <span className="text-xs font-mono font-black text-foreground">{bio.birthdayVoucherCode}</span>
                            </div>
                            <button
                              onClick={() => onCopyVoucher(bio.birthdayVoucherCode)}
                              className="px-3 py-1 bg-amber-500 text-white font-black text-[10.5px] uppercase rounded-lg shadow-xs hover:opacity-90 active:scale-95"
                            >
                              {claimedCodes[bio.birthdayVoucherCode] ? "Đã chép" : "Sao chép"}
                            </button>
                          </div>
                        )}

                        {/* Interactive Okay / Mark Read Action Button */}
                        {unread && (
                          <button
                            onClick={() => onMarkRead?.(entry.id)}
                            className="px-3 py-1 bg-primary text-white font-black text-[10.5px] uppercase tracking-wider rounded-lg shadow-xs hover:opacity-90 active:scale-95 transition-all mt-1"
                          >
                            Đánh dấu đã đọc
                          </button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Infinite Scroll Sentinel */}
      <div ref={sentinelRef} className="h-1" />
      {hasMore && (
        <div className="flex justify-center py-4">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* ── 5. BOTTOM ACTION FOOTER BAR ─────────────────────────────────────── */}
      <div className="bg-card border border-border/40 rounded-[20px] p-3 shadow-xs flex items-center justify-between">
        <button
          onClick={() => {
            hapticSelect();
            if (unreadNotifCount > 0) onMarkAllRead?.();
          }}
          disabled={unreadNotifCount === 0}
          className="text-xs font-bold text-primary hover:underline disabled:opacity-40 disabled:no-underline flex items-center gap-1 active:scale-95 transition-all"
        >
          <CheckCheck className="w-4 h-4" />
          <span>{t("memberPortal.historyActions.markAllRead")}</span>
        </button>

        <button
          onClick={() => {
            hapticSelect();
            window.location.href = "/member/settings";
          }}
          className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 active:scale-95 transition-all"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>{t("memberPortal.historyActions.settingsBtn")}</span>
        </button>
      </div>
    </div>
  );
}

export default withTranslation()(MemberHistoryTab);
