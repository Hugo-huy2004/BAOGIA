import { useState, useCallback, useMemo } from "react";
import useSWR from "swr";
import { joyText } from "../../../lib/joyDisplay";
import { hapticSelect } from "../../../utils/haptics";
import BackButton from "../shared/BackButton";
import { LESSONS } from "./investLessons";

/**
 * Hugo Invest — sàn chứng khoán ảo để học đầu tư bằng JOY.
 *
 * Bốn màn: Bảng giá (giá bốn công ty + vì sao đổi), Danh mục (lãi/lỗ của
 * chính mình), Đặt lệnh, và Học (giáo trình trong investLessons.js).
 *
 * Nội dung dạy viết bằng tiếng Việt, cùng quy ước với HugoCoder và Study with
 * Hugo: tác giả dạy bằng tiếng Việt nên bài giảng không dịch máy sang 9 thứ
 * tiếng — dịch sai một công thức tài chính thì người học mang cái sai ra sàn
 * thật.
 *
 * Mọi con số tiền đều do MÁY CHỦ tính (giá, phí, lãi/lỗ). Client chỉ bày ra —
 * client tự tính giá là client tự đặt giá cho mình.
 */

const API = import.meta.env.VITE_API_URL || "/api";

const fetcher = (path) => fetch(`${API}${path}`, { credentials: "include" }).then((r) => r.json());

const pctText = (value) => `${value >= 0 ? "+" : ""}${(value * 100).toFixed(2)}%`;

/**
 * Giá cổ phiếu LUÔN viết bằng đơn vị gốc tiếng Anh (Kavo) — sàn chỉ có một
 * bảng giá cho tất cả mọi người, giống một sàn thật niêm yết bằng một đồng
 * tiền duy nhất. Còn `joyText()` chỉ dùng cho số tiền THẬT SỰ rời ví, vì ví
 * của mỗi người có thể đang ở đơn vị khác.
 */
const quoteText = (value, code = "JOYka") => `${Math.round(value).toLocaleString("vi-VN")} ${code}`;
const toneOf = (value) => (value >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400");

export default function HugoInvestTab({ onBack, showToast }) {
  const [tab, setTab] = useState("market");
  const [detail, setDetail] = useState(null);
  const [lesson, setLesson] = useState(null);

  const { data: market, mutate: reloadMarket } = useSWR("/stock/market", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 120000,
  });
  const { data: portfolio, mutate: reloadPortfolio } = useSWR("/stock/portfolio", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });

  const companies = market?.companies || [];
  const quoteCode = market?.quoteCode || "JOYka";
  const active = companies.find((c) => c.symbol === detail) || null;

  const afterTrade = useCallback(async () => {
    await Promise.all([reloadPortfolio(), reloadMarket()]);
  }, [reloadPortfolio, reloadMarket]);

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <header className="shrink-0 border-b border-border bg-background" style={{ paddingTop: "max(4px, env(safe-area-inset-top, 0px))" }}>
        <div className="flex items-center gap-2 px-2">
          <BackButton onClick={detail ? () => setDetail(null) : lesson ? () => setLesson(null) : onBack} label="Quay lại" iconOnly />
          <h1 className="min-w-0 flex-1 truncate text-[17px] font-black">
            {active ? `${active.symbol} · ${active.name}` : lesson ? lesson.title : "Sàn Ảo Hugo"}
          </h1>
        </div>
        {!active && !lesson && (
          <nav className="flex gap-1 px-2 pb-2">
            {[
              { id: "market", label: "Bảng giá" },
              { id: "portfolio", label: "Danh mục" },
              { id: "learn", label: "Học" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => { hapticSelect(); setTab(item.id); }}
                aria-current={tab === item.id}
                className={`h-11 flex-1 rounded-xl text-[14px] font-bold transition-colors ${
                  tab === item.id ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4" style={{ paddingBottom: "calc(32px + env(safe-area-inset-bottom, 0px))" }}>
        {active ? (
          <CompanyDetail company={active} portfolio={portfolio} market={market} onTraded={afterTrade} showToast={showToast} />
        ) : lesson ? (
          <LessonView lesson={lesson} />
        ) : tab === "market" ? (
          <Market market={market} onOpen={setDetail} quoteCode={quoteCode} />
        ) : tab === "portfolio" ? (
          <Portfolio portfolio={portfolio} onOpen={setDetail} quoteCode={quoteCode} />
        ) : (
          <Learn onOpen={setLesson} />
        )}
      </div>
    </div>
  );
}

function Market({ market, onOpen, quoteCode }) {
  if (!market) return <Skeleton rows={4} />;

  return (
    <div className="space-y-3">
      <p className="rounded-2xl border border-border bg-card p-3 text-[13px] leading-relaxed text-muted-foreground">
        Giá khớp <strong className="text-foreground">3 phiên mỗi ngày</strong>: 09:00 · 15:00 · 21:00, và luôn niêm yết bằng{" "}
        <strong className="text-foreground">{quoteCode}</strong> — đơn vị JOY gốc, một bảng giá chung cho tất cả mọi người.
        Giá đổi theo hoạt động thật của từng mảng trong portal, không phải số ngẫu nhiên — chạm vào một mã để xem vì sao.
      </p>

      {market.companies.map((company) => (
        <button
          key={company.symbol}
          type="button"
          onClick={() => onOpen(company.symbol)}
          className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 text-left"
        >
          <span className="min-w-0">
            <span className="flex items-center gap-2">
              <span className="text-[15px] font-black text-foreground">{company.symbol}</span>
              <span className="truncate text-[13px] text-muted-foreground">{company.name}</span>
            </span>
            <span className="mt-0.5 block text-[12px] text-muted-foreground">{company.sector}</span>
          </span>
          <span className="shrink-0 text-right">
            <span className="block text-[15px] font-black tabular-nums text-foreground">{quoteText(company.price, quoteCode)}</span>
            <span className={`block text-[12px] font-bold tabular-nums ${toneOf(company.change)}`}>{pctText(company.change)}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

function CompanyDetail({ company, portfolio, market, onTraded, showToast }) {
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
  // Ba khoản phí, tính y hệt máy chủ (services/stockMarket.js → tradeCosts).
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
      showToast?.(data.message || (data.success ? "Đã khớp lệnh" : "Không đặt được lệnh"), data.success ? "success" : "error");
      if (data.success) await onTraded();
    } catch (error) {
      showToast?.(error.message, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-[26px] font-black tabular-nums text-foreground">{quoteText(company.price, quoteCode)}</p>
        <p className={`text-[13px] font-bold ${toneOf(company.change)}`}>
          {pctText(company.change)} so với phiên trước ({quoteText(company.prevPrice, quoteCode)})
        </p>
        <Sparkline history={company.history} up={company.change >= 0} />
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 text-[13px] leading-relaxed">
        <p className="font-bold text-foreground">{company.name} · {company.sector}</p>
        <p className="mt-1 text-muted-foreground">{company.description}</p>
        <dl className="mt-3 grid grid-cols-2 gap-2">
          <Stat label="Cổ phiếu phát hành" value={company.sharesOutstanding.toLocaleString("vi-VN")} />
          <Stat label="Vốn hoá" value={quoteText(company.marketCap, quoteCode)} />
          <Stat label="Biên độ mỗi phiên" value={`${(company.volatility * 100).toFixed(0)}%`} />
          <Stat label="Cổ tức mỗi phiên" value={company.dividendRate ? `${(company.dividendRate * 100).toFixed(2)}%` : "Không trả"} />
        </dl>
      </div>

      {company.signal?.average > 0 && (
        <div className="rounded-2xl border border-border bg-muted p-4 text-[13px] leading-relaxed">
          <p className="font-bold text-foreground">Vì sao giá đổi phiên này</p>
          <p className="mt-1 text-muted-foreground">
            Hoạt động 7 ngày: <strong className="text-foreground">{Math.round(company.signal.activity).toLocaleString("vi-VN")}</strong> ·
            mức trung bình: <strong className="text-foreground">{Math.round(company.signal.average).toLocaleString("vi-VN")}</strong> ⇒
            chênh <strong className={toneOf(company.signal.surprise)}>{pctText(company.signal.surprise)}</strong>.
          </p>
          <p className="mt-1 text-muted-foreground">
            Nhân với biên độ {(company.volatility * 100).toFixed(0)}% của mã này ⇒ giá đổi{" "}
            <strong className={toneOf(company.signal.move)}>{pctText(company.signal.move)}</strong>.
          </p>
        </div>
      )}

      {holding && (
        <div className="rounded-2xl border border-border bg-card p-4 text-[13px]">
          <p className="font-bold text-foreground">Bạn đang nắm {holding.quantity.toLocaleString("vi-VN")} cổ phiếu</p>
          <p className="mt-1 text-muted-foreground">
            Giá vốn {quoteText(holding.avgCost, quoteCode)} · giá trị {quoteText(holding.value, quoteCode)} ·{" "}
            <strong className={toneOf(holding.unrealized)}>
              {holding.unrealized >= 0 ? "lãi" : "lỗ"} {quoteText(Math.abs(holding.unrealized), quoteCode)} ({pctText(holding.unrealizedPct)})
            </strong>
          </p>
        </div>
      )}

      {/* Đặt lệnh */}
      <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex gap-2">
          {[
            { id: "buy", label: "Mua" },
            { id: "sell", label: "Bán" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSide(item.id)}
              className={`h-11 flex-1 rounded-xl text-[15px] font-black transition-colors ${
                side === item.id
                  ? item.id === "buy" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <label className="block">
          <span className="mb-1 block text-[12px] font-bold text-muted-foreground">Số lượng cổ phiếu</span>
          <input
            type="number"
            min="1"
            inputMode="numeric"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-[15px] font-bold tabular-nums text-foreground outline-none"
          />
        </label>

        <dl className="space-y-1 text-[13px]">
          <Row label={`Giá trị (${qty.toLocaleString("vi-VN")} × ${quoteText(company.price, quoteCode)})`} value={quoteText(gross, quoteCode)} />
          <Row label={`Phí môi giới ${(feeRate * 100).toFixed(1)}%`} value={quoteText(brokerage, quoteCode)} />
          <Row label={`Phí sáng tạo ${(creativeRate * 100).toFixed(0)}%`} value={quoteText(creativeFee, quoteCode)} />
          {conversionRate > 0 && (
            <Row label={`Phí chuyển đổi ${(conversionRate * 100).toFixed(0)}%`} value={quoteText(conversionFee, quoteCode)} />
          )}
          <Row
            label={side === "buy" ? "Tổng trừ ví" : "Tiền về ví"}
            value={joyText(total)}
            strong
          />
          <Row label="Quy ra đơn vị ví của bạn" value={joyText(total)} />
          {side === "buy" && <Row label="Số dư ví" value={joyText(cash)} />}
          {side === "sell" && holding && (
            <Row
              label="Lãi/lỗ chốt nếu bán"
              value={quoteText(Math.round((company.price - holding.avgCost) * qty - fee), quoteCode)}
              tone={(company.price - holding.avgCost) * qty - fee}
            />
          )}
        </dl>

        <button
          type="button"
          disabled={busy || (side === "buy" && total > cash) || (side === "sell" && (!holding || holding.quantity < qty))}
          onClick={submit}
          className="h-12 w-full rounded-xl bg-primary text-[15px] font-black text-white disabled:opacity-50"
        >
          {busy ? "Đang khớp lệnh…" : side === "buy" ? `Mua ${qty} ${company.symbol}` : `Bán ${qty} ${company.symbol}`}
        </button>

        <p className="text-[12px] leading-relaxed text-muted-foreground">
          Phí thu cả hai chiều: mua rồi bán ngay ở đúng giá cũ vẫn lỗ{" "}
          <strong className="text-foreground">{quoteText(fee * 2, quoteCode)}</strong> ({((fee * 2 / gross) * 100).toFixed(1)}% giá trị lệnh).
          {conversionRate > 0 && " Ví bạn đang để ở đơn vị khác nên mỗi lệnh gánh thêm 15% phí chuyển đổi — đúng như mua cổ phiếu nước ngoài bằng nội tệ ngoài đời."}
        </p>
      </div>
    </div>
  );
}

function Portfolio({ portfolio, onOpen, quoteCode }) {
  if (!portfolio) return <Skeleton rows={3} />;

  const { holdings = [], trades = [] } = portfolio;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-[12px] font-bold text-muted-foreground">Tổng giá trị cổ phiếu đang nắm</p>
        <p className="text-[26px] font-black tabular-nums text-foreground">{quoteText(portfolio.value, quoteCode)}</p>
        <p className={`text-[13px] font-bold ${toneOf(portfolio.unrealized)}`}>
          {portfolio.unrealized >= 0 ? "Lãi" : "Lỗ"} trên giấy {quoteText(Math.abs(portfolio.unrealized), quoteCode)} ({pctText(portfolio.unrealizedPct)})
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <Stat label="Vốn đã bỏ" value={quoteText(portfolio.invested, quoteCode)} />
          <Stat label="JOY còn lại" value={joyText(portfolio.cash)} />
          <Stat label="Lãi/lỗ đã chốt" value={quoteText(portfolio.realized, quoteCode)} tone={portfolio.realized} />
        </div>
      </div>

      {holdings.length === 0 ? (
        <p className="rounded-2xl border border-border bg-card p-6 text-center text-[13px] text-muted-foreground">
          Chưa nắm cổ phiếu nào. Mở tab Bảng giá, chọn một mã và mua thử — sai ở đây không mất tiền thật.
        </p>
      ) : (
        holdings.map((holding) => (
          <button
            key={holding.symbol}
            type="button"
            onClick={() => onOpen(holding.symbol)}
            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 text-left"
          >
            <span className="min-w-0">
              <span className="block text-[15px] font-black text-foreground">{holding.symbol}</span>
              <span className="block text-[12px] text-muted-foreground">
                {holding.quantity.toLocaleString("vi-VN")} cổ phiếu · vốn {quoteText(holding.avgCost, quoteCode)}
              </span>
            </span>
            <span className="shrink-0 text-right">
              <span className="block text-[15px] font-black tabular-nums text-foreground">{quoteText(holding.value, quoteCode)}</span>
              <span className={`block text-[12px] font-bold tabular-nums ${toneOf(holding.unrealized)}`}>
                {pctText(holding.unrealizedPct)}
              </span>
            </span>
          </button>
        ))
      )}

      {trades.length > 0 && (
        <div className="rounded-2xl border border-border bg-card">
          <p className="border-b border-border px-4 py-2 text-[13px] font-black text-foreground">Sổ lệnh gần đây</p>
          <ul className="divide-y divide-border">
            {trades.map((trade, index) => (
              <li key={index} className="flex items-center justify-between gap-2 px-4 py-2.5 text-[13px]">
                <span>
                  <strong className={trade.side === "buy" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                    {trade.side === "buy" ? "Mua" : "Bán"}
                  </strong>{" "}
                  {trade.quantity} {trade.symbol} @ {quoteText(trade.price, quoteCode)}
                </span>
                <span className={`shrink-0 tabular-nums ${trade.side === "sell" ? toneOf(trade.realizedPL) : "text-muted-foreground"}`}>
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
      <p className="rounded-2xl border border-border bg-card p-3 text-[13px] leading-relaxed text-muted-foreground">
        Mười bài ngắn, mỗi bài một ý và có ví dụ bằng số. Học xong bạn dùng được đúng những khái niệm này trên sàn thật.
      </p>
      {LESSONS.map((item, index) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onOpen(item)}
          className="w-full rounded-2xl border border-border bg-card p-4 text-left"
        >
          <p className="text-[15px] font-bold text-foreground">
            {index + 1}. {item.title}
          </p>
          <p className="mt-1 text-[13px] text-muted-foreground">{item.summary}</p>
        </button>
      ))}
    </div>
  );
}

function LessonView({ lesson }) {
  return (
    <article className="space-y-3">
      <h2 className="text-[20px] font-black text-foreground">{lesson.title}</h2>
      <p className="text-[14px] font-bold text-muted-foreground">{lesson.summary}</p>
      {lesson.body.map((paragraph, index) => (
        <p key={index} className="text-[14px] leading-relaxed text-foreground/90">{paragraph}</p>
      ))}
    </article>
  );
}

function Sparkline({ history = [], up }) {
  const path = useMemo(() => {
    const values = history.map((point) => point.price).filter(Number.isFinite);
    if (values.length < 2) return "";
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    return values
      .map((value, index) => {
        const x = (index / (values.length - 1)) * 300;
        const y = 60 - ((value - min) / span) * 52;
        return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  }, [history]);

  if (!path) {
    return <p className="mt-3 text-[12px] text-muted-foreground">Chưa đủ phiên để vẽ biểu đồ — quay lại sau vài phiên.</p>;
  }

  return (
    <svg viewBox="0 0 300 64" className="mt-3 h-16 w-full" role="img" aria-label="Biểu đồ giá các phiên gần đây">
      <path d={path} fill="none" stroke={up ? "#10b981" : "#f43f5e"} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function Stat({ label, value, tone }) {
  return (
    <div className="rounded-xl bg-muted p-2">
      <dt className="text-[11px] font-bold text-muted-foreground">{label}</dt>
      <dd className={`text-[13px] font-black tabular-nums ${tone === undefined ? "text-foreground" : toneOf(tone)}`}>{value}</dd>
    </div>
  );
}

function Row({ label, value, strong, tone }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={`tabular-nums ${strong ? "text-[15px] font-black" : "font-bold"} ${tone === undefined ? "text-foreground" : toneOf(tone)}`}>
        {value}
      </dd>
    </div>
  );
}

function Skeleton({ rows = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="h-20 animate-pulse rounded-2xl bg-muted" />
      ))}
    </div>
  );
}
