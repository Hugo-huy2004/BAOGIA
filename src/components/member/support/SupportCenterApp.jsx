import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import AppFrame from "../os/AppFrame";
import { ContinueCard, EmptyState, HomeHero, HomeSection, QuickGrid, StatStrip } from "../os/AppHome";
import { useAppIntent } from "../os/appIntent";
import notify from "../../../lib/notify";

/**
 * Trung Tâm Hỗ Trợ — không có AI.
 *
 * Bản trước là một khung chat bot: mỗi câu hỏi gọi lên Gemini, và tệ hơn, mỗi
 * tin nhắn còn tạo một phiếu hỗ trợ thật. Người dùng nhận câu trả lời máy soạn
 * cho một hệ thống mà nó không thực sự biết, còn quản trị viên thì ngập phiếu.
 *
 * Ở đây chỉ còn hai đường: đọc hướng dẫn viết sẵn, hoặc gửi yêu cầu thẳng cho
 * quản trị viên kèm số liên lạc để người thật gọi lại. Không đoán, không bịa.
 */

// Câu hỏi và câu trả lời đều là văn bản đã viết sẵn trong 9 ngôn ngữ; thêm mục
// mới nghĩa là thêm một cặp khoá `support.gNq` / `support.gNa`.
const GUIDES = [
  { id: "wallet", icon: "account_balance_wallet", q: "support.g1q", a: "support.g1a" },
  { id: "denom", icon: "currency_exchange", q: "support.g2q", a: "support.g2a" },
  { id: "account", icon: "manage_accounts", q: "support.g3q", a: "support.g3a" },
  { id: "apps", icon: "apps", q: "support.g4q", a: "support.g4a" },
  { id: "tokens", icon: "toll", q: "support.g5q", a: "support.g5a" },
  { id: "other", icon: "help", q: "support.g6q", a: "support.g6a" },
];

export default function SupportCenterApp({ bio, onClose, isGuestMode = false, requireAccount }) {
  const { t, i18n } = useTranslation();
  const [tab, setTab] = useState("home");
  const [openGuide, setOpenGuide] = useState(null);
  const [tickets, setTickets] = useState(null); // null = chưa tải xong
  const [issue, setIssue] = useState("");
  const [phone, setPhone] = useState(() => bio?.phone || "");
  const [sending, setSending] = useState(false);

  useAppIntent("supporter", (destination) => setTab(destination || "home"));

  // Khách chưa đăng nhập thì không có hộp thư yêu cầu nào để tải — gọi vào cũng
  // chỉ nhận 401 rồi bắn một toast lỗi vô nghĩa ngay khi mở trang công khai.
  const loadTickets = useCallback(async () => {
    if (isGuestMode) {
      setTickets([]);
      return;
    }
    try {
      const res = await fetch("/api/support/my-tickets");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTickets(Array.isArray(data.tickets) ? data.tickets : []);
    } catch {
      setTickets([]);
      notify.error(t("support.loadError"));
    }
  }, [t, isGuestMode]);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  const openCount = useMemo(() => (tickets || []).filter((x) => x.status === "pending").length, [tickets]);
  const resolvedCount = useMemo(() => (tickets || []).filter((x) => x.status === "resolved").length, [tickets]);
  const latestTicket = tickets?.[0] || null;

  const showGuide = (id) => {
    setOpenGuide((current) => (current === id ? null : id));
    setTab("guides");
  };

  const submit = async () => {
    const text = issue.trim();
    if (sending) return;
    if (text.length < 10) {
      notify.warning(t("support.tooShort"));
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/support/my-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issue: text, phone: phone.trim(), fullName: bio?.displayName }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setIssue("");
      notify.success(t("support.created"));
      await loadTickets();
    } catch {
      notify.error(t("support.failed"));
    } finally {
      setSending(false);
    }
  };

  const dateLabel = (value) => (value ? new Date(value).toLocaleDateString(i18n.resolvedLanguage || "vi") : "");
  const appTitle = t("utilities.catalog.supporter.title", "Trung Tâm Hỗ Trợ");

  const tabs = [
    { id: "home", icon: "home", label: t("os.home") },
    { id: "guides", icon: "menu_book", label: t("support.tabGuides") },
    { id: "requests", icon: "confirmation_number", label: t("support.tabRequests"), badge: openCount },
  ];

  return (
    <AppFrame
      appId="supporter"
      title={appTitle}
      onBack={onClose}
      tabs={tabs}
      tab={tab}
      onTabChange={setTab}
      largeTitle={tab === "home"}
    >
      {tab === "home" && (
        <>
          <HomeHero
            icon="support_agent"
            title={appTitle}
            tagline={t("support.tagline")}
            actionLabel={t("support.askAdmin")}
            onAction={() => setTab("requests")}
          />

          {tickets?.length > 0 && (
            <HomeSection className="mb-5">
              <StatStrip
                items={[
                  { id: "open", value: openCount, label: t("support.statOpen") },
                  { id: "done", value: resolvedCount, label: t("support.statResolved") },
                ]}
              />
            </HomeSection>
          )}

          {latestTicket && (
            <HomeSection className="mb-5">
              <ContinueCard
                icon="confirmation_number"
                label={latestTicket.status === "pending" ? t("support.statusPending") : t("support.statusResolved")}
                title={latestTicket.issue}
                subtitle={dateLabel(latestTicket.createdAt)}
                onClick={() => setTab("requests")}
              />
            </HomeSection>
          )}

          <HomeSection
            title={t("support.guidesTitle")}
            actionLabel={t("os.seeAll")}
            onAction={() => setTab("guides")}
          >
            <QuickGrid
              items={GUIDES.slice(0, 4).map((guide) => ({
                id: guide.id,
                icon: guide.icon,
                label: t(guide.q),
                onClick: () => showGuide(guide.id),
              }))}
            />
          </HomeSection>
        </>
      )}

      {tab === "guides" && (
        <HomeSection title={t("support.guidesTitle")}>
          <div className="space-y-2.5">
            {GUIDES.map((guide) => {
              const open = openGuide === guide.id;
              return (
                <div key={guide.id} className="overflow-hidden rounded-[16px]" style={{ background: "var(--ios-surface)" }}>
                  <button
                    type="button"
                    onClick={() => setOpenGuide(open ? null : guide.id)}
                    aria-expanded={open}
                    className="flex w-full items-center gap-3 p-4 text-left"
                  >
                    <span
                      className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px]"
                      style={{ background: "var(--ios-fill)" }}
                    >
                      <span className="material-symbols-outlined text-[20px]" style={{ color: "var(--ax)" }} aria-hidden="true">
                        {guide.icon}
                      </span>
                    </span>
                    <span className="min-w-0 flex-1 text-[16px] font-semibold leading-snug">{t(guide.q)}</span>
                    <span
                      className="material-symbols-outlined shrink-0 text-[22px] transition-transform"
                      style={{ color: "var(--ios-label-3)", transform: open ? "rotate(180deg)" : "none" }}
                      aria-hidden="true"
                    >
                      expand_more
                    </span>
                  </button>
                  {open && (
                    <p className="px-4 pb-4 text-[15px] leading-relaxed" style={{ color: "var(--ios-label-2)" }}>
                      {t(guide.a)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setTab("requests")}
            className="mt-4 min-h-[44px] w-full rounded-[12px] text-[17px] font-semibold"
            style={{ background: "var(--ios-fill)", color: "var(--ax)" }}
          >
            {t("support.askAdmin")}
          </button>
        </HomeSection>
      )}

      {tab === "requests" && isGuestMode && (
        <HomeSection title={t("support.newRequest")}>
          <div className="rounded-[16px] p-5 text-center" style={{ background: "var(--ios-surface)" }}>
            <span className="material-symbols-outlined text-[40px]" style={{ color: "var(--ios-label-3)" }} aria-hidden="true">
              account_circle
            </span>
            <p className="mt-2 text-[17px] font-semibold">{t("support.guestTitle")}</p>
            <p className="mt-1 text-[15px] leading-snug" style={{ color: "var(--ios-label-2)" }}>
              {t("support.guestBody")}
            </p>
            <button
              type="button"
              onClick={() => requireAccount?.()}
              className="mt-4 min-h-[44px] w-full rounded-[12px] text-[17px] font-semibold text-white"
              style={{ background: "var(--ax)" }}
            >
              {t("support.guestSignIn")}
            </button>
          </div>
        </HomeSection>
      )}

      {tab === "requests" && !isGuestMode && (
        <>
          <HomeSection title={t("support.newRequest")}>
            <div className="rounded-[16px] p-4" style={{ background: "var(--ios-surface)" }}>
              <textarea
                value={issue}
                onChange={(e) => setIssue(e.target.value)}
                rows={5}
                maxLength={4000}
                placeholder={t("support.requestPlaceholder")}
                className="w-full resize-none rounded-[12px] p-3 text-[16px] leading-snug outline-none"
                style={{ background: "var(--ios-fill)", color: "var(--ios-label)" }}
              />

              <label className="mt-3 block text-[13px] font-medium" style={{ color: "var(--ios-label-2)" }}>
                {t("support.phoneLabel")}
              </label>
              <input
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={20}
                placeholder={t("support.phonePlaceholder")}
                className="mt-1.5 min-h-[44px] w-full rounded-[12px] px-3 text-[16px] outline-none"
                style={{ background: "var(--ios-fill)", color: "var(--ios-label)" }}
              />
              <p className="mt-1.5 text-[13px] leading-snug" style={{ color: "var(--ios-label-3)" }}>
                {t("support.phoneHint")}
              </p>

              <button
                type="button"
                onClick={submit}
                disabled={!issue.trim() || sending}
                className="mt-3 min-h-[44px] w-full rounded-[12px] text-[17px] font-semibold text-white disabled:opacity-40"
                style={{ background: "var(--ax)" }}
              >
                {t("support.submit")}
              </button>
            </div>
          </HomeSection>

          <HomeSection title={t("support.requestsTitle")}>
            {tickets === null ? (
              <div className="h-[120px] animate-pulse rounded-[16px]" style={{ background: "var(--ios-fill)" }} aria-hidden="true" />
            ) : tickets.length === 0 ? (
              <EmptyState icon="confirmation_number" title={t("support.requestsEmpty")} body={t("support.requestsEmptyBody")} />
            ) : (
              <div className="space-y-2.5">
                {tickets.map((ticket) => (
                  <article key={ticket._id} className="rounded-[16px] p-4" style={{ background: "var(--ios-surface)" }}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-[12px] font-semibold uppercase tracking-[0.04em]" style={{ color: "var(--ios-label-2)" }}>
                        {ticket.status === "pending" ? t("support.statusPending") : t("support.statusResolved")}
                      </span>
                      <span className="text-[12px]" style={{ color: "var(--ios-label-3)" }}>{dateLabel(ticket.createdAt)}</span>
                    </div>
                    <p className="mt-1.5 whitespace-pre-wrap text-[16px] leading-snug">{ticket.issue}</p>

                    {ticket.adminReply ? (
                      <div className="mt-3 rounded-[12px] p-3" style={{ background: "var(--ios-fill-2)" }}>
                        <p className="text-[12px] font-semibold uppercase tracking-[0.04em]" style={{ color: "var(--ios-label-2)" }}>
                          {t("support.replyLabel")}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-[15px] leading-snug">{ticket.adminReply}</p>
                      </div>
                    ) : (
                      <p className="mt-2 text-[13px] leading-snug" style={{ color: "var(--ios-label-3)" }}>
                        {t("support.waitingReply")}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </HomeSection>
        </>
      )}
    </AppFrame>
  );
}
