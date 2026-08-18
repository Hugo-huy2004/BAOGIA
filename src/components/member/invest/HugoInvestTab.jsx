import { useState, useCallback, useMemo, useEffect } from "react";
import useSWR from "swr";
import { joyText } from "../../../lib/joyDisplay";
import { hapticSelect } from "../../../utils/haptics";
import BackButton from "../shared/BackButton";
import { LESSONS } from "./investLessons";

const API = import.meta.env.VITE_API_URL || "/api";

const fetcher = (path) => fetch(`${API}${path}`, { credentials: "include" }).then((r) => r.json());

const pctText = (value) => `${value >= 0 ? "+" : ""}${(value * 100).toFixed(2)}%`;

/**
 * Tính giá cổ phiếu theo từng GIÂY (Deterministic Time Harmonic Algorithm).
 * Cả client và server dùng CHUNG một công thức thuần theo timestamp.
 */
export function calculateSecondPrice(company, timestampSec = Math.floor(Date.now() / 1000)) {
  if (!company) return 0;
  const base = company.price || company.basePrice || 100;
  const vol = company.volatility || 0.05;
  const symbol = company.symbol || 'HFILM';

  const waveLong = Math.sin((timestampSec % 3600) / 3600 * 2 * Math.PI) * 0.03;
  const waveMedium = Math.sin((timestampSec % 300) / 300 * 2 * Math.PI) * 0.015;
  const waveShort = Math.cos((timestampSec % 15) / 15 * 2 * Math.PI) * 0.008;

  const hashSeed = Math.abs(
    (symbol.charCodeAt(0) * 31 + symbol.charCodeAt(symbol.length - 1)) ^ timestampSec
  ) % 1000 / 1000;
  const microNoise = (hashSeed - 0.5) * 0.004;

  const totalRate = (waveLong + waveMedium + waveShort + microNoise) * (vol / 0.05);
  const raw = base * (1 + totalRate);
  const currentPrice = Math.max((company.basePrice || 50) * 0.2, Math.min((company.basePrice || 50) * 5, raw));

  return Math.round(currentPrice * 100) / 100;
}

const quoteText = (value, code = "JOYka") => `${Math.round(value).toLocaleString("vi-VN")} ${code}`;
const toneOf = (value) => (value >= 0 ? "text-emerald-500 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400");
const toneBg = (value) => (value >= 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20");

export const INVEST_HELP_DICTIONARY = {
  pnl: {
    title: "Tổng Lời / Lỗ Ròng (PnL & ROI)",
    icon: "trending_up",
    badge: "Chỉ số quan trọng nhất",
    summary: "Cho biết bạn đang thắng hay thua bao nhiêu tiền sau khi trừ mọi chi phí.",
    details: [
      "Vốn đầu tư: Tổng số tiền bạn đã bỏ ra để mua các cổ phiếu hiện tại.",
      "Giá trị hiện tại: Số tiền bạn thu về được nếu lập tức bán hết toàn bộ cổ phiếu theo giá thị trường thời gian thực.",
      "Lời/Lỗ ròng (Unrealized PnL): Lấy Giá trị hiện tại trừ Vốn đầu tư. Số dương (+) là bạn đang LỜI, số âm (-) là bạn đang LỖ."
    ],
    example: "Ví dụ: Bạn bỏ ra 100,000 Mira mua cổ phiếu HFILM. Hiện tại cổ phiếu tăng giá và số cổ phiếu đó trị giá 125,000 Mira ➔ Bạn LỜI +25,000 Mira (+25%)."
  },
  second_price: {
    title: "Giá Khớp Lệnh Realtime 1 Giây",
    icon: "bolt",
    badge: "Công nghệ thời gian thực",
    summary: "Giá cổ phiếu thay đổi từng giây liên tục theo chuỗi thuật toán hài hòa (Deterministic Time Harmonic).",
    details: [
      "Mô phỏng sóng thị trường tài chính thực tế với các nhịp sóng ngắn (15s), sóng trung (5 phút) và sóng dài (1 giờ).",
      "Giá cả hoàn toàn đồng bộ thời gian thực giữa tất cả các thành viên mà không gây giật lag hay quá tải máy chủ.",
      "Bạn có thể canh nhịp sóng giảm để Mua vào và canh nhịp sóng tăng đỉnh để Bán ra."
    ],
    example: "Ví dụ: Cổ phiếu HFILM có nhịp sóng dâng lên 150 JOYka lúc 10:00:15 và lùi về 142 JOYka lúc 10:00:22."
  },
  conversion_fee: {
    title: "Phí Quy Đổi Đơn Vị 15%",
    icon: "currency_exchange",
    badge: "Quy tắc ví cá nhân hóa",
    summary: "Áp dụng khi đơn vị hiển thị mặc định của ví khác với đơn vị niêm yết của sàn (JOYka).",
    details: [
      "Sàn ảo Hugo niêm yết giá theo đơn vị chuẩn JOYka (Kavo).",
      "Nếu tài khoản của bạn đang chọn đơn vị ví khác (như Mira, Luno, Velu...), hệ thống tự động quy đổi và áp dụng 15% phí quy đổi ở cả 2 chiều MUA và BÁN.",
      "Lời khuyên Quản Gia: Bạn nên giữ cổ phiếu đến khi mức LỜI > 15-20% để vừa hòa vốn phí quy đổi, vừa chốt lãi thực sự vào ví!"
    ],
    example: "Ví dụ: Bạn mua cổ phiếu và tăng giá +20%. Sau khi trừ 15% phí quy đổi, bạn vẫn còn LỜI ròng +5% thực nhận về ví."
  },
  brokerage_fee: {
    title: "Phí Môi Giới & Phí Sáng Tạo",
    icon: "receipt_long",
    badge: "Chi phí giao dịch",
    summary: "Phí nhỏ khấu trừ khi đặt lệnh để duy trì thanh khoản sàn và ủng hộ tác giả.",
    details: [
      "Phí môi giới sàn: 0.5% tổng giá trị giao dịch (dùng duy trì khớp lệnh tự động).",
      "Phí sáng tạo: 5% ủng hộ các nhà tạo nội dung và doanh nghiệp phát hành cổ phiếu.",
      "Tất cả khoản phí được tính công khai trước khi bạn bấm nút Xác nhận đặt lệnh."
    ]
  },
  market_cap: {
    title: "Vốn Hóa Thị Trường (Market Cap)",
    icon: "domain",
    badge: "Định giá doanh nghiệp",
    summary: "Tổng giá trị tiền tệ của toàn bộ số cổ phiếu mà công ty đã phát hành.",
    details: [
      "Công thức: Vốn hóa = (Giá cổ phiếu hiện tại) × (Tổng số cổ phiếu phát hành).",
      "Công ty có vốn hóa lớn thường biến động ổn định, an toàn. Công ty vốn hóa nhỏ dễ tăng vọt nhưng biến động cao hơn."
    ]
  },
  smart_advice: {
    title: "Tín Hiệu Tư Vấn AI Quản Gia",
    icon: "psychology",
    badge: "Trợ lý đầu tư tự động",
    summary: "Hệ thống AI tự động phân tích thị trường và danh mục của bạn để đưa ra lời khuyên tối ưu.",
    details: [
      "🟢 NÊN CHỐT LỜI: Đưa ra khi lợi nhuận cổ phiếu đã vượt mốc an toàn và thắng phí quy đổi.",
      "🔴 CẢNH BÁO CẮT LỖ: Đưa ra khi cổ phiếu giảm sâu quá ngưỡng quản trị rủi ro (10-15%).",
      "🟡 GIỮ TIẾP / THỜI ĐIỂM CHỜ: Đưa ra khi lợi nhuận đang dương nhưng chưa đủ bù chi phí quy đổi."
    ]
  }
};

function HelpIcon({ topicKey, onClick }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        hapticSelect();
        onClick?.(topicKey);
      }}
      title="Bấm xem giải thích chi tiết"
      className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white/10 text-[9px] font-bold text-zinc-300 border border-white/15 hover:bg-white/20 hover:text-white transition-all transform active:scale-95 ml-1 shrink-0 cursor-pointer"
    >
      ?
    </button>
  );
}

function InfoModalPopup({ topicKey, onClose }) {
  if (!topicKey) return null;
  const item = INVEST_HELP_DICTIONARY[topicKey];
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-zinc-900/95 p-5 shadow-2xl space-y-4 animate-scaleUp text-left">
        <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-zinc-200 border border-white/15">
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
            </div>
            <div>
              <span className="inline-block rounded-full bg-white/5 px-2 py-0.5 text-[9px] font-bold text-zinc-400 border border-white/10">
                {item.badge}
              </span>
              <h3 className="text-base font-black text-white">{item.title}</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-zinc-400 hover:bg-white/20 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        <p className="text-xs font-bold text-zinc-200 leading-relaxed bg-white/5 p-3 rounded-2xl border border-white/10 font-sans">
          💡 {item.summary}
        </p>

        <div className="space-y-2">
          <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">Chi tiết cần biết:</h4>
          <ul className="space-y-2">
            {item.details.map((desc, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-zinc-300 leading-relaxed font-sans">
                <span className="text-zinc-400 font-bold mt-0.5">•</span>
                <span>{desc}</span>
              </li>
            ))}
          </ul>
        </div>

        {item.example && (
          <div className="rounded-2xl bg-white/5 border border-white/10 p-3 text-xs leading-relaxed text-zinc-300 font-sans">
            <strong>Ví dụ thực tế:</strong> {item.example}
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="h-11 w-full rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-xs font-black text-white border border-white/15 shadow-lg active:scale-95 transition-all"
        >
          ĐÃ HỂU
        </button>
      </div>
    </div>
  );
}

function SmartAdvisorCard({ portfolio, company, quoteCode, onHelp }) {
  if (!portfolio) return null;

  const { holdings = [], crossDenom = false } = portfolio;
  let iconName = "psychology";
  let title = "Tư vấn Quản gia";
  let message = "";
  let badgeText = "AI Butler";

  if (company) {
    const holding = holdings.find((h) => h.symbol === company.symbol);
    if (holding) {
      const pct = holding.unrealizedPct * 100;
      if (pct >= 15) {
        iconName = "trending_up";
        title = `Chốt lời ${company.symbol}`;
        badgeText = "Khuyến nghị Bán";
        message = `Mức lời +${pct.toFixed(1)}% đã bù đủ phí quy đổi (${crossDenom ? "15%" : "0%"}). Bạn nên chốt lời bảo toàn vốn.`;
      } else if (pct < -10) {
        iconName = "warning";
        title = `Cắt lỗ ${company.symbol}`;
        badgeText = "Cảnh báo rủi ro";
        message = `Cổ phiếu đang giảm -${Math.abs(pct).toFixed(1)}%. Hãy chú ý quản trị vốn hoặc cân nhắc cắt lỗ.`;
      } else if (pct >= 0 && pct < 15 && crossDenom) {
        iconName = "hourglass_empty";
        title = `Tiếp tục giữ ${company.symbol}`;
        badgeText = "Nắm giữ";
        message = `Lời +${pct.toFixed(1)}% chưa đủ bù 15% phí quy đổi. Nên tiếp tục giữ chờ mốc tăng >15%.`;
      } else {
        iconName = "insights";
        title = `Nắm giữ ${company.symbol}`;
        badgeText = "Vị thế tốt";
        message = `Vị thế ${company.symbol} đang ổn định với ${holding.quantity.toLocaleString()} cổ phiếu.`;
      }
    } else {
      iconName = "show_chart";
      title = `Cơ hội đầu tư ${company.symbol}`;
      badgeText = "Theo dõi 1s";
      message = `Giá hiện tại ${quoteText(company.price, quoteCode)}. Bạn có thể căn nhịp sóng 1s để chọn điểm MUA đẹp.`;
    }
  } else if (holdings.length > 0) {
    const topProfitable = [...holdings].sort((a, b) => b.unrealizedPct - a.unrealizedPct)[0];
    const topLosing = [...holdings].sort((a, b) => a.unrealizedPct - b.unrealizedPct)[0];

    if (topProfitable && topProfitable.unrealizedPct >= 0.15) {
      iconName = "trending_up";
      title = `Chốt lời ${topProfitable.symbol}`;
      badgeText = "Điểm chốt đẹp";
      message = `Cổ phiếu ${topProfitable.symbol} đang tăng +${(topProfitable.unrealizedPct * 100).toFixed(1)}%. Thời điểm thích hợp để chốt lãi về ví!`;
    } else if (topLosing && topLosing.unrealizedPct <= -0.1) {
      iconName = "warning";
      title = `Quản trị rủi ro ${topLosing.symbol}`;
      badgeText = "Cảnh báo";
      message = `Cổ phiếu ${topLosing.symbol} đang giảm -${Math.abs(topLosing.unrealizedPct * 100).toFixed(1)}%. Cân nhắc hạ tỷ trọng bảo toàn vốn.`;
    } else {
      iconName = "psychology";
      title = `Tư vấn Quản gia tổng quan`;
      badgeText = "Tự động";
      message = `Danh mục đang duy trì mức ổn định. Hãy kiên nhẫn nắm giữ chờ nhịp sóng tăng mạnh!`;
    }
  } else {
    iconName = "smart_toy";
    title = `Sàn ảo Hugo Pro`;
    badgeText = "Hướng dẫn";
    message = `Chưa có cổ phiếu trong danh mục. Hãy sang tab Bảng Giá chọn các mã chứng khoán tiềm năng để bắt đầu tích lũy!`;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60 p-3 backdrop-blur-xl shadow-lg space-y-1 text-left">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="material-symbols-outlined text-sm text-zinc-400 shrink-0">{iconName}</span>
          <span className="text-xs font-bold text-zinc-200 truncate flex items-center">
            {title}
            <HelpIcon topicKey="smart_advice" onClick={onHelp} />
          </span>
        </div>
        <span className="rounded-md bg-white/5 border border-white/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-400 shrink-0">
          {badgeText}
        </span>
      </div>
      <p className="text-[11px] font-sans leading-relaxed text-zinc-400 pl-0.5">{message}</p>
    </div>
  );
}

export default function HugoInvestTab({ onBack, showToast }) {
  const [tab, setTab] = useState("market");
  const [detail, setDetail] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [nowSec, setNowSec] = useState(() => Math.floor(Date.now() / 1000));
  const [helpTopic, setHelpTopic] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setNowSec(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: market, mutate: reloadMarket } = useSWR("/stock/market", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 120000,
  });
  const { data: portfolio, mutate: reloadPortfolio } = useSWR("/stock/portfolio", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });

  const rawCompanies = market?.companies || [];
  const companies = useMemo(() => {
    return rawCompanies.map((c) => {
      const livePrice = calculateSecondPrice(c, nowSec);
      const prev = c.prevPrice || c.basePrice || 100;
      const change = prev ? Math.round(((livePrice - prev) / prev) * 1e4) / 1e4 : 0;
      return { ...c, price: livePrice, change };
    });
  }, [rawCompanies, nowSec]);

  const liveMarket = useMemo(() => {
    if (!market) return null;
    return { ...market, companies };
  }, [market, companies]);

  const quoteCode = market?.quoteCode || "JOYka";
  const active = companies.find((c) => c.symbol === detail) || null;

  const afterTrade = useCallback(async () => {
    await Promise.all([reloadPortfolio(), reloadMarket()]);
  }, [reloadPortfolio, reloadMarket]);

  return (
    <div className="flex h-full flex-col bg-zinc-950 text-white font-sans selection:bg-emerald-500/30 relative">
      {/* Help Info Popup Modal */}
      <InfoModalPopup topicKey={helpTopic} onClose={() => setHelpTopic(null)} />

      {/* iOS 27 Translucent Frosted Glass Header */}
      <header className="shrink-0 sticky top-0 z-30 border-b border-white/10 bg-zinc-950/70 backdrop-blur-2xl px-3 py-2.5 transition-all">
        <div className="flex items-center gap-2">
          <BackButton onClick={detail ? () => setDetail(null) : lesson ? () => setLesson(null) : onBack} label="Quay lại" iconOnly />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-black tracking-tight text-white flex items-center gap-2">
              {active ? (
                <>
                  <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">{active.symbol}</span>
                  <span className="text-zinc-400 text-xs font-normal font-sans">· {active.name}</span>
                </>
              ) : lesson ? (
                lesson.title
              ) : (
                <>
                  <span>Sàn Ảo Hugo</span>
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">Hugo Pro</span>
                </>
              )}
            </h1>
          </div>
        </div>

        {/* iOS 27 Segmented Control */}
        {!active && !lesson && (
          <nav className="mt-2.5 flex rounded-2xl bg-zinc-900/80 p-1 border border-white/5 backdrop-blur-md">
            {[
              { id: "market", label: "Bảng giá", icon: "show_chart" },
              { id: "portfolio", label: "Danh mục", icon: "account_balance_wallet" },
              { id: "learn", label: "Giáo trình", icon: "menu_book" },
            ].map((item) => {
              const selected = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { hapticSelect(); setTab(item.id); }}
                  aria-current={selected}
                  className={`relative flex-1 py-2 flex items-center justify-center gap-1.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                    selected
                      ? "bg-gradient-to-b from-white/20 to-white/10 text-white shadow-lg shadow-black/40 border border-white/20"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        )}
      </header>

      {/* Main Content Area */}
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 space-y-4" style={{ paddingBottom: "calc(32px + env(safe-area-inset-bottom, 0px))" }}>
        {active ? (
          <CompanyDetail company={active} portfolio={portfolio} market={liveMarket} nowSec={nowSec} onTraded={afterTrade} showToast={showToast} onHelp={setHelpTopic} />
        ) : lesson ? (
          <LessonView lesson={lesson} />
        ) : tab === "market" ? (
          <Market market={liveMarket} portfolio={portfolio} onOpen={setDetail} quoteCode={quoteCode} nowSec={nowSec} onHelp={setHelpTopic} />
        ) : tab === "portfolio" ? (
          <Portfolio portfolio={portfolio} onOpen={setDetail} quoteCode={quoteCode} onHelp={setHelpTopic} />
        ) : (
          <Learn onOpen={setLesson} />
        )}
      </div>
    </div>
  );
}

function Market({ market, portfolio, onOpen, quoteCode, nowSec, onHelp }) {
  if (!market) return <Skeleton rows={4} />;

  const featuredCompany = market.companies[0] || null;

  return (
    <div className="space-y-4">
      {/* Smart AI Butler Investment Advisor */}
      <SmartAdvisorCard portfolio={portfolio} quoteCode={quoteCode} onHelp={onHelp} />

      {/* Featured Realtime Chart Card on Market Home */}
      {featuredCompany && (
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900/90 via-zinc-900/60 to-zinc-950/90 p-4 backdrop-blur-xl shadow-2xl space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center">
                Xu Hướng Realtime 1s: {featuredCompany.symbol}
                <HelpIcon topicKey="second_price" onClick={onHelp} />
              </span>
            </div>
            <button
              type="button"
              onClick={() => { hapticSelect(); onOpen(featuredCompany.symbol); }}
              className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>Xem chi tiết</span>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>

          <StockPriceChart company={featuredCompany} nowSec={nowSec} quoteCode={quoteCode} />
        </div>
      )}

      {/* Ticker List Tiles */}
      <div className="space-y-2">
        <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 px-1 flex items-center">
          Danh Sách Mã Chứng Khoán
          <HelpIcon topicKey="second_price" onClick={onHelp} />
        </h3>
        <div className="grid grid-cols-1 gap-2.5">
          {market.companies.map((company) => {
            const isUp = company.change >= 0;
            return (
              <button
                key={company.symbol}
                type="button"
                onClick={() => { hapticSelect(); onOpen(company.symbol); }}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/40 p-3.5 text-left backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:bg-zinc-900/70 active:scale-[0.98] shadow-lg shadow-black/20"
              >
                <div className="flex items-center justify-between gap-2.5">
                  {/* Left: Symbol & Name */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base font-black text-white group-hover:text-emerald-400 transition-colors tracking-tight">{company.symbol}</span>
                      <span className="rounded-full bg-white/5 px-2 py-0.5 text-[9px] font-bold text-zinc-400 border border-white/5">{company.sector}</span>
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-zinc-400 font-sans">{company.name}</p>
                  </div>

                  {/* Center: Mini Sparkline Wave (Visible on Mobile & Desktop) */}
                  <div className="w-20 sm:w-28 shrink-0 opacity-90 group-hover:opacity-100 transition-opacity">
                    <MiniSparkline company={company} nowSec={nowSec} isUp={isUp} />
                  </div>

                  {/* Right: Price & Percent Pill */}
                  <div className="shrink-0 text-right min-w-[76px]">
                    <div className="text-sm font-black tabular-nums text-white tracking-tight">{quoteText(company.price, quoteCode)}</div>
                    <div className={`mt-0.5 inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-black tabular-nums border ${toneBg(company.change)}`}>
                      <span className="material-symbols-outlined text-[12px]">{isUp ? "arrow_drop_up" : "arrow_drop_down"}</span>
                      <span>{pctText(company.change)}</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MiniSparkline({ company, nowSec, isUp }) {
  const points = useMemo(() => {
    const pts = [];
    const baseTime = nowSec || Math.floor(Date.now() / 1000);
    for (let i = 12; i >= 0; i--) {
      const t = baseTime - i * 3;
      pts.push(calculateSecondPrice(company, t));
    }
    return pts;
  }, [company, nowSec]);

  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;

  const path = points
    .map((v, idx) => {
      const x = (idx / (points.length - 1)) * 96;
      const y = 28 - ((v - min) / span) * 22;
      return `${idx === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 96 32" className="h-8 w-full overflow-visible">
      <path d={path} fill="none" stroke={isUp ? "#10b981" : "#f43f5e"} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CompanyDetail({ company, portfolio, market, nowSec, onTraded, showToast, onHelp }) {
  const quoteCode = market?.quoteCode || "JOYka";
  const feeRate = market?.feeRate ?? 0.005;
  const creativeRate = market?.creativeFeeRate ?? 0.05;
  const conversionRate = portfolio?.crossDenom ? (market?.conversionFeeRate ?? 0.15) : 0;
  const holding = portfolio?.holdings?.find((h) => h.symbol === company.symbol);
  const cash = portfolio?.cash ?? 0;
  const [side, setSide] = useState("buy");
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);

  const qty = Math.max(1, Math.floor(Number(quantity) || 0));
  const gross = Math.round(company.price * qty);
  const brokerage = Math.max(1, Math.round(gross * feeRate));
  const creativeFee = Math.floor(gross * creativeRate);
  const conversionFee = Math.floor(gross * conversionRate);
  const fee = brokerage + creativeFee + conversionFee;
  const total = side === "buy" ? gross + fee : gross - fee;

  const submit = async () => {
    setBusy(true);
    try {
      const res = await fetch(`${API}/stock/trade`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: company.symbol, side, quantity: qty }),
      });
      const data = await res.json();
      showToast?.(data.message || (data.success ? "Đã khớp lệnh thành công" : "Không đặt được lệnh"), data.success ? "success" : "error");
      if (data.success) await onTraded();
    } catch (error) {
      showToast?.(error.message, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Smart AI Financial Advisor Card */}
      <SmartAdvisorCard portfolio={portfolio} company={company} quoteCode={quoteCode} onHelp={onHelp} />

      {/* Stock Header & Price Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/70 p-5 backdrop-blur-2xl shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-black tabular-nums tracking-tight text-white">{quoteText(company.price, quoteCode)}</span>
            </div>
            <div className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-xs font-black tabular-nums border ${toneBg(company.change)}`}>
              <span className="material-symbols-outlined text-xs">{company.change >= 0 ? "arrow_drop_up" : "arrow_drop_down"}</span>
              <span>{pctText(company.change)} ({quoteText(company.prevPrice, quoteCode)})</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 border border-emerald-500/20 text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[10px] font-black tracking-wider uppercase flex items-center">
              REALTIME 1S
              <HelpIcon topicKey="second_price" onClick={onHelp} />
            </span>
          </div>
        </div>

        {/* Biểu đồ biến động giá theo giây + vị thế MUA - BÁN */}
        <StockPriceChart company={company} trades={portfolio?.trades} nowSec={nowSec} quoteCode={quoteCode} />
      </div>

      {/* Info Stats */}
      <div className="rounded-3xl border border-white/10 bg-zinc-900/50 p-4 backdrop-blur-xl space-y-3">
        <div>
          <h3 className="text-sm font-black text-white">{company.name}</h3>
          <p className="mt-1 text-xs text-zinc-400 leading-relaxed font-sans">{company.description}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
          <Stat label="Cổ phiếu phát hành" value={company.sharesOutstanding.toLocaleString("vi-VN")} />
          <Stat label="Vốn hoá thị trường" value={quoteText(company.marketCap, quoteCode)} onHelp={onHelp} helpKey="market_cap" />
          <Stat label="Biên độ dao động" value={`${(company.volatility * 100).toFixed(0)}%`} />
          <Stat label="Cổ tức mỗi phiên" value={company.dividendRate ? `${(company.dividendRate * 100).toFixed(2)}%` : "Không trả"} />
        </div>
      </div>

      {/* User Holding Info */}
      {holding && (
        <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-4 backdrop-blur-xl text-xs space-y-1">
          <p className="font-black text-emerald-400 text-sm flex items-center">
            Bạn đang nắm {holding.quantity.toLocaleString("vi-VN")} cổ phiếu {company.symbol}
            <HelpIcon topicKey="pnl" onClick={onHelp} />
          </p>
          <p className="text-zinc-300 font-sans">
            Giá vốn: <strong className="text-white">{quoteText(holding.avgCost, quoteCode)}</strong> · Giá trị hiện tại: <strong className="text-white">{quoteText(holding.value, quoteCode)}</strong>
          </p>
          <p className="pt-1 flex items-center">
            Lãi/lỗ trên giấy:{" "}
            <strong className={`font-black text-sm ml-1 ${toneOf(holding.unrealized)}`}>
              {holding.unrealized >= 0 ? "+" : ""}{quoteText(holding.unrealized, quoteCode)} ({pctText(holding.unrealizedPct)})
            </strong>
          </p>
        </div>
      )}

      {/* iOS 27 Order Execution Sheet */}
      <div className="rounded-3xl border border-white/10 bg-zinc-900/80 p-5 backdrop-blur-2xl space-y-4 shadow-2xl">
        <h3 className="text-sm font-black uppercase tracking-wider text-zinc-300">Đặt Lệnh Khớp Ngay</h3>

        {/* Side Selector */}
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-zinc-950 p-1 border border-white/5">
          <button
            type="button"
            onClick={() => { hapticSelect(); setSide("buy"); }}
            className={`py-2.5 rounded-xl text-sm font-black transition-all ${
              side === "buy"
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            MUA {company.symbol}
          </button>
          <button
            type="button"
            onClick={() => { hapticSelect(); setSide("sell"); }}
            className={`py-2.5 rounded-xl text-sm font-black transition-all ${
              side === "sell"
                ? "bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-lg shadow-rose-500/20"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            BÁN {company.symbol}
          </button>
        </div>

        {/* Quantity Input */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-zinc-400">Số Lượng Cổ Phiếu</label>
          <div className="relative">
            <input
              type="number"
              min="1"
              inputMode="numeric"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="h-12 w-full rounded-2xl border border-white/10 bg-zinc-950/80 px-4 text-base font-black tabular-nums text-white outline-none focus:border-emerald-500 transition-colors"
            />
            <span className="absolute right-4 top-3 text-xs font-bold text-zinc-500">Cổ phiếu</span>
          </div>

          {/* Quick Amount Presets */}
          <div className="flex gap-2 pt-1">
            {[1, 10, 50, 100].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => { hapticSelect(); setQuantity(num); }}
                className="flex-1 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-xs font-bold text-zinc-300 transition-all active:scale-95"
              >
                +{num}
              </button>
            ))}
            {holding && holding.quantity > 0 && (
              <button
                type="button"
                onClick={() => { hapticSelect(); setSide("sell"); setQuantity(holding.quantity); }}
                className="flex-1 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-xs font-bold text-rose-300 transition-all active:scale-95"
              >
                Tất cả
              </button>
            )}
          </div>
        </div>

        {/* Fees & Summary Breakdown */}
        <dl className="space-y-1.5 rounded-2xl bg-zinc-950/60 p-3.5 border border-white/5 text-xs font-sans">
          <Row label={`Giá trị thực (${qty.toLocaleString("vi-VN")} cổ)`} value={quoteText(gross, quoteCode)} />
          <Row label={`Phí môi giới (${(feeRate * 100).toFixed(1)}%)`} value={quoteText(brokerage, quoteCode)} onHelp={onHelp} helpKey="brokerage_fee" />
          <Row label={`Phí sáng tạo (${(creativeRate * 100).toFixed(0)}%)`} value={quoteText(creativeFee, quoteCode)} onHelp={onHelp} helpKey="brokerage_fee" />
          {conversionRate > 0 && (
            <>
              <Row label={`Phí đổi đơn vị (${(conversionRate * 100).toFixed(0)}%)`} value={quoteText(conversionFee, quoteCode)} onHelp={onHelp} helpKey="conversion_fee" />
              <div className="mt-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-[11px] leading-snug text-amber-200 flex items-start justify-between gap-1">
                <span>
                  ⚠️ <strong>Lưu ý ví khác đơn vị gốc:</strong> Khác đơn vị ví sẽ áp dụng phí quy đổi 15% cho cả 2 chiều <strong>MUA và BÁN</strong>.
                </span>
                <HelpIcon topicKey="conversion_fee" onClick={onHelp} />
              </div>
            </>
          )}
          <div className="my-1 border-t border-white/10" />
          <Row
            label={side === "buy" ? "Tổng trừ ví JOY" : "Tổng thực nhận về ví JOY"}
            value={joyText(total)}
            strong
          />
          {side === "buy" && <Row label="Số dư JOY khả dụng" value={joyText(cash)} />}
        </dl>

        {/* Action Button */}
        <button
          type="button"
          disabled={busy || (side === "buy" && total > cash) || (side === "sell" && (!holding || holding.quantity < qty))}
          onClick={submit}
          className={`h-13 w-full rounded-2xl font-black text-sm text-white shadow-xl transition-all duration-300 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2 ${
            side === "buy"
              ? "bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 shadow-emerald-500/30 hover:brightness-110"
              : "bg-gradient-to-r from-rose-500 via-red-500 to-rose-600 shadow-rose-500/30 hover:brightness-110"
          }`}
        >
          {busy ? (
            <span className="inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
          ) : (
            <>
              <span className="material-symbols-outlined text-lg">{side === "buy" ? "shopping_cart" : "sell"}</span>
              <span>{side === "buy" ? `XÁC NHẬN MUA (${qty} cổ)` : `XÁC NHẬN BÁN (${qty} cổ)`}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function Portfolio({ portfolio, onOpen, quoteCode, onHelp }) {
  if (!portfolio) return <Skeleton rows={3} />;

  const { holdings = [], trades = [], crossDenom = false } = portfolio;
  const unrealizedVal = portfolio.unrealized || 0;
  const isProfit = unrealizedVal >= 0;

  return (
    <div className="space-y-4">
      {/* Smart AI Financial Advisor Card */}
      <SmartAdvisorCard portfolio={portfolio} quoteCode={quoteCode} onHelp={onHelp} />

      {/* Prominent Profit / Loss (PnL) Executive Summary Card */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900/90 via-zinc-900/70 to-zinc-950/90 p-5 backdrop-blur-2xl shadow-2xl space-y-4">
        <div className="absolute -top-12 -right-12 h-36 w-36 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center">
            Tổng Lời / Lỗ Ròng (PnL)
            <HelpIcon topicKey="pnl" onClick={onHelp} />
          </p>
          <span className={`rounded-md bg-white/5 border border-white/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${toneOf(unrealizedVal)}`}>
            {isProfit ? "LỜI RÒNG" : "LỖ RÒNG"}
          </span>
        </div>

        {/* Big Profit / Loss Display */}
        <div className="space-y-1">
          <div className={`text-3xl font-black tabular-nums tracking-tight ${toneOf(unrealizedVal)}`}>
            {isProfit ? "+" : ""}{quoteText(unrealizedVal, quoteCode)}
          </div>
          <div className="text-xs font-bold text-zinc-300 font-sans">
            Tỷ lệ sinh lời: <span className={toneOf(unrealizedVal)}>{pctText(portfolio.unrealizedPct)}</span>
          </div>
        </div>

        {/* 3 Key Stats Breakdown */}
        <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-3 text-center">
          <Stat label="Vốn Đầu Tư" value={quoteText(portfolio.invested, quoteCode)} onHelp={onHelp} helpKey="pnl" />
          <Stat label="Giá Trị Hiện Tại" value={quoteText(portfolio.value, quoteCode)} onHelp={onHelp} helpKey="pnl" />
          <Stat label="Lãi Đã Chốt" value={quoteText(portfolio.realized, quoteCode)} tone={portfolio.realized} onHelp={onHelp} helpKey="pnl" />
        </div>

        {/* Cross Denom Fee Warning */}
        {crossDenom && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-200 flex items-center justify-between">
            <span>
              ⚠️ <strong>Ví khác đơn vị gốc:</strong> Áp dụng 15% phí quy đổi 2 chiều. Nên chốt lời khi lãi {">"} 15%!
            </span>
            <HelpIcon topicKey="conversion_fee" onClick={onHelp} />
          </div>
        )}
      </div>

      {/* Holdings List */}
      <div className="space-y-2">
        <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 px-1 flex items-center">
          Danh Mục Đang Nắm Giữ
          <HelpIcon topicKey="pnl" onClick={onHelp} />
        </h3>
        {holdings.length === 0 ? (
          <div className="rounded-3xl border border-white/5 bg-zinc-900/40 p-8 text-center backdrop-blur-xl space-y-3">
            <span className="material-symbols-outlined text-4xl text-emerald-500/60">auto_graph</span>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans max-w-xs mx-auto">
              Chưa nắm giữ cổ phiếu nào. Hãy chuyển sang tab <strong className="text-white">Bảng giá</strong> để chọn cổ phiếu và tích lũy lợi nhuận!
            </p>
          </div>
        ) : (
          holdings.map((holding) => (
            <button
              key={holding.symbol}
              type="button"
              onClick={() => { hapticSelect(); onOpen(holding.symbol); }}
              className="flex w-full items-center justify-between gap-3 rounded-3xl border border-white/10 bg-zinc-900/40 p-4 text-left backdrop-blur-xl transition-all hover:bg-zinc-900/70 active:scale-[0.98]"
            >
              <div>
                <span className="text-base font-black text-white">{holding.symbol}</span>
                <span className="block text-xs text-zinc-400 mt-0.5 font-sans">
                  {holding.quantity.toLocaleString("vi-VN")} cổ · vốn {quoteText(holding.avgCost, quoteCode)}
                </span>
              </div>
              <div className="text-right">
                <span className="block text-base font-black tabular-nums text-white">{quoteText(holding.value, quoteCode)}</span>
                <span className={`block text-xs font-bold tabular-nums ${toneOf(holding.unrealized)}`}>
                  {pctText(holding.unrealizedPct)}
                </span>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Recent Trades Audit List */}
      {trades.length > 0 && (
        <div className="rounded-3xl border border-white/10 bg-zinc-900/40 backdrop-blur-xl overflow-hidden">
          <p className="border-b border-white/5 px-4 py-3 text-xs font-black uppercase tracking-wider text-zinc-300">Nhật Ký Khớp Lệnh</p>
          <ul className="divide-y divide-white/5">
            {trades.map((trade, index) => (
              <li key={index} className="flex items-center justify-between gap-2 px-4 py-3 text-xs font-sans">
                <div className="flex items-center gap-2">
                  <span className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase ${trade.side === "buy" ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}>
                    {trade.side === "buy" ? "MUA" : "BÁN"}
                  </span>
                  <span className="text-zinc-200">
                    {trade.quantity} {trade.symbol} @ {quoteText(trade.price, quoteCode)}
                  </span>
                </div>
                <span className={`tabular-nums font-bold ${trade.side === "sell" ? toneOf(trade.realizedPL) : "text-zinc-400"}`}>
                  {trade.side === "sell" ? joyText(trade.realizedPL) : `−${joyText(trade.total)}`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Learn({ onOpen }) {
  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-white/10 bg-zinc-900/40 p-4 backdrop-blur-xl">
        <p className="text-xs leading-relaxed text-zinc-300 font-sans">
          Mười bài học thực chiến thiết kế chuẩn Hugo Studio — giải thích từ cơ bản tới nâng cao với ví dụ bằng số thật.
        </p>
      </div>
      {LESSONS.map((item, index) => (
        <button
          key={item.id}
          type="button"
          onClick={() => { hapticSelect(); onOpen(item); }}
          className="w-full rounded-3xl border border-white/10 bg-zinc-900/40 p-4 text-left backdrop-blur-xl transition-all hover:bg-zinc-900/70 active:scale-[0.98]"
        >
          <p className="text-sm font-bold text-white">
            {index + 1}. {item.title}
          </p>
          <p className="mt-1 text-xs text-zinc-400 font-sans">{item.summary}</p>
        </button>
      ))}
    </div>
  );
}

function LessonView({ lesson }) {
  return (
    <article className="space-y-4 rounded-3xl border border-white/10 bg-zinc-900/60 p-5 backdrop-blur-2xl">
      <h2 className="text-xl font-black text-white">{lesson.title}</h2>
      <p className="text-xs font-bold text-emerald-400">{lesson.summary}</p>
      <div className="space-y-3 border-t border-white/5 pt-3">
        {lesson.body.map((paragraph, index) => (
          <p key={index} className="text-xs leading-relaxed text-zinc-300 font-sans">{paragraph}</p>
        ))}
      </div>
    </article>
  );
}

function StockPriceChart({ company, trades = [], nowSec, quoteCode }) {
  const [timeframe, setTimeframe] = useState("live");
  const [scrubIndex, setScrubIndex] = useState(null);

  const chartPoints = useMemo(() => {
    if (timeframe === "session" && company.history?.length >= 2) {
      return company.history.map((h) => ({
        label: new Date(h.at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        price: h.price,
        time: new Date(h.at).getTime(),
      }));
    }
    const points = [];
    const baseTime = nowSec || Math.floor(Date.now() / 1000);
    for (let i = 29; i >= 0; i--) {
      const t = baseTime - i * 2;
      const price = calculateSecondPrice(company, t);
      points.push({
        label: new Date(t * 1000).toLocaleTimeString("vi-VN", { minute: "2-digit", second: "2-digit" }),
        price,
        time: t * 1000,
      });
    }
    return points;
  }, [company, timeframe, nowSec]);

  const prices = chartPoints.map((p) => p.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceSpan = maxPrice - minPrice || 1;
  const isUp = (prices[prices.length - 1] || 0) >= (prices[0] || 0);

  const width = 460;
  const height = 200;
  const paddingY = 38; // Increased padding so top/bottom badges never get clipped
  const paddingX = 18;
  const graphWidth = width - paddingX * 2;
  const graphHeight = height - paddingY * 2;

  const coords = useMemo(() => {
    return chartPoints.map((pt, idx) => {
      const x = paddingX + (idx / Math.max(1, chartPoints.length - 1)) * graphWidth;
      const y = height - paddingY - ((pt.price - minPrice) / priceSpan) * graphHeight;
      return { ...pt, x, y };
    });
  }, [chartPoints, minPrice, priceSpan, graphWidth, graphHeight]);

  const linePath = useMemo(() => {
    if (coords.length < 2) return "";
    return coords.reduce((acc, pt, i) => `${acc} ${i === 0 ? "M" : "L"} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`, "");
  }, [coords]);

  const areaPath = useMemo(() => {
    if (coords.length < 2) return "";
    const firstX = coords[0].x.toFixed(1);
    const lastX = coords[coords.length - 1].x.toFixed(1);
    const bottomY = (height - paddingY).toFixed(1);
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [linePath, coords]);

  const symbolTrades = useMemo(() => {
    return (trades || []).filter((t) => t.symbol === company.symbol).slice(-4);
  }, [trades, company.symbol]);

  const tradeMarkers = useMemo(() => {
    if (!symbolTrades.length || !coords.length) return [];
    const minTime = chartPoints[0]?.time || Date.now() - 60000;
    const maxTime = chartPoints[chartPoints.length - 1]?.time || Date.now();
    const timeSpan = maxTime - minTime || 1;

    return symbolTrades.map((trade) => {
      const tradeTime = new Date(trade.at || Date.now()).getTime();
      const inWindow = tradeTime >= minTime && tradeTime <= maxTime;
      const timeRatio = inWindow ? (tradeTime - minTime) / timeSpan : 0.18;
      const x = paddingX + timeRatio * graphWidth;
      const rawY = height - paddingY - ((trade.price - minPrice) / priceSpan) * graphHeight;
      const y = Math.max(paddingY + 8, Math.min(height - paddingY - 8, rawY));
      return { ...trade, x, y, rawY, inWindow };
    });
  }, [symbolTrades, coords, minPrice, priceSpan, graphHeight, graphWidth, chartPoints]);

  const activePoint = scrubIndex !== null ? coords[scrubIndex] : null;
  const strokeColor = isUp ? "#34c759" : "#ff3b30";
  const gradientId = `chartGradPro_${company.symbol}`;

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const touchX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, (touchX - paddingX) / graphWidth));
    const index = Math.round(ratio * (coords.length - 1));
    setScrubIndex(index);
  };

  return (
    <div className="mt-3 space-y-2 rounded-2xl border border-white/10 bg-zinc-950/70 p-4 backdrop-blur-2xl shadow-xl">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400">
            {activePoint ? `${activePoint.label} · ${quoteText(activePoint.price, quoteCode)}` : timeframe === "live" ? "Sóng Giá Trực Tiếp (1s)" : "Các Phiên Chốt Lịch Sử"}
          </span>
        </div>

        <div className="flex gap-1 rounded-lg bg-zinc-900 p-0.5 border border-white/5">
          <button
            type="button"
            onClick={() => setTimeframe("live")}
            className={`rounded-md px-2.5 py-0.5 text-[10px] font-bold transition-all ${
              timeframe === "live" ? "bg-white/20 text-white shadow-xs" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            1s
          </button>
          <button
            type="button"
            onClick={() => setTimeframe("session")}
            className={`rounded-md px-2.5 py-0.5 text-[10px] font-bold transition-all ${
              timeframe === "session" ? "bg-white/20 text-white shadow-xs" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Phiên
          </button>
        </div>
      </div>

      <div
        className="relative touch-none overflow-visible"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setScrubIndex(null)}
      >
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48 overflow-visible">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.32" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Reference Lines */}
          <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="currentColor" strokeDasharray="3 3" className="text-white/15" strokeWidth="1" />
          <text x={width - paddingX} y={paddingY - 6} textAnchor="end" className="fill-zinc-400 text-[10px] font-black">
            Đỉnh: {quoteText(maxPrice, quoteCode)}
          </text>

          <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="currentColor" strokeDasharray="3 3" className="text-white/15" strokeWidth="1" />
          <text x={width - paddingX} y={height - paddingY + 16} textAnchor="end" className="fill-zinc-400 text-[10px] font-black">
            Đáy: {quoteText(minPrice, quoteCode)}
          </text>

          {/* Fill Area */}
          {areaPath && <path d={areaPath} fill={`url(#${gradientId})`} />}

          {/* Main Price Curve */}
          {linePath && <path d={linePath} fill="none" stroke={strokeColor} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />}

          {/* Trade Positions: Dashed Price Level Line + Smart Flipping Badge Capsule */}
          {tradeMarkers.map((trade, idx) => {
            const isBuy = trade.side === "buy";
            const badgeColor = isBuy ? "#34c759" : "#ff3b30";
            // Flip badge downwards if point is near the top edge (< paddingY + 22)
            const badgeY = trade.y < paddingY + 22 ? trade.y + 10 : trade.y - 23;

            return (
              <g key={idx}>
                {/* Horizontal Entry Price Dashed Line */}
                <line
                  x1={paddingX}
                  y1={trade.y}
                  x2={width - paddingX}
                  y2={trade.y}
                  stroke={badgeColor}
                  strokeDasharray="4 3"
                  strokeWidth="1.2"
                  opacity="0.8"
                />

                {/* Point Marker Circle */}
                <circle cx={trade.x} cy={trade.y} r="5.5" fill={badgeColor} stroke="#ffffff" strokeWidth="2" />

                {/* Badge Capsule with Smart Direction */}
                <rect
                  x={trade.x - 22}
                  y={badgeY}
                  width="44"
                  height="15"
                  rx="4.5"
                  fill={badgeColor}
                  className="shadow-md"
                />
                <text
                  x={trade.x}
                  y={badgeY + 10.5}
                  textAnchor="middle"
                  fill="#ffffff"
                  className="text-[8.5px] font-black pointer-events-none tracking-wider"
                >
                  {isBuy ? "▲ MUA" : "▼ BÁN"}
                </text>
              </g>
            );
          })}

          {/* Live Pulse Circle */}
          {coords.length > 0 && !activePoint && (
            <g transform={`translate(${coords[coords.length - 1].x}, ${coords[coords.length - 1].y})`}>
              <circle r="7" fill={strokeColor} className="animate-ping opacity-75" />
              <circle r="4.5" fill={strokeColor} stroke="#ffffff" strokeWidth="2" />
            </g>
          )}

          {/* Interactive Touch/Hover Scrub Line */}
          {activePoint && (
            <g transform={`translate(${activePoint.x}, 0)`}>
              <line x1="0" y1={paddingY} x2="0" y2={height - paddingY} stroke="#ffffff" strokeDasharray="2 2" strokeWidth="1.5" opacity="0.8" />
              <circle cx="0" cy={activePoint.y} r="5" fill={strokeColor} stroke="#ffffff" strokeWidth="2" />
            </g>
          )}
        </svg>
      </div>

      <div className="flex items-center justify-between border-t border-white/10 pt-2 text-xs text-zinc-400 font-sans">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-black text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> ▲ Lệnh MUA
          </span>
          <span className="flex items-center gap-1.5 font-black text-rose-400">
            <span className="h-2 w-2 rounded-full bg-rose-500" /> ▼ Lệnh BÁN
          </span>
        </div>
        <span className="font-bold text-zinc-300">
          {symbolTrades.length > 0 ? `${symbolTrades.length} lệnh đã khớp` : "Chưa có lệnh giao dịch"}
        </span>
      </div>
    </div>
  );
}

function Stat({ label, value, tone, onHelp, helpKey }) {
  return (
    <div className="rounded-2xl bg-zinc-950/70 p-2.5 border border-white/5">
      <dt className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
        <span>{label}</span>
        {helpKey && <HelpIcon topicKey={helpKey} onClick={onHelp} />}
      </dt>
      <dd className={`text-xs font-black tabular-nums mt-0.5 ${tone === undefined ? "text-white" : toneOf(tone)}`}>{value}</dd>
    </div>
  );
}

function Row({ label, value, strong, tone, onHelp, helpKey }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-zinc-400 flex items-center">
        <span>{label}</span>
        {helpKey && <HelpIcon topicKey={helpKey} onClick={onHelp} />}
      </dt>
      <dd className={`tabular-nums ${strong ? "text-sm font-black text-white" : "font-bold text-zinc-200"} ${tone === undefined ? "" : toneOf(tone)}`}>
        {value}
      </dd>
    </div>
  );
}

function Skeleton({ rows = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="h-24 animate-pulse rounded-3xl bg-zinc-900/60 border border-white/5" />
      ))}
    </div>
  );
}
