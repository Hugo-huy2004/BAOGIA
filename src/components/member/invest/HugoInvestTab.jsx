import { useState, useCallback, useMemo, useEffect } from "react";
import useSWR from "swr";
import { joyText, joyCode, joyFactor, joyDenom, useJoy } from "../../../lib/joyDisplay";
import { useJoyStore } from "../../../stores/joyStore";
import { hapticSelect } from "../../../utils/haptics";
import BackButton from "../shared/BackButton";
import { LESSONS } from "./investLessons";
import { priceAt, tradeCosts, breakEvenPct, STOCK_QUOTE_CODE } from "../../../../shared/stockPricing";
import StockPriceChart from "./StockPriceChart";

const API = import.meta.env.VITE_API_URL || "/api";

const fetcher = (path) => fetch(`${API}${path}`, { credentials: "include" }).then((r) => r.json());

const pctText = (value) => `${value >= 0 ? "+" : ""}${(value * 100).toFixed(2)}%`;

/**
 * TIỀN TRÊN MÀN HÌNH LUÔN LÀ ĐƠN VỊ CỦA VÍ NGƯỜI DÙNG.
 *
 * Sàn niêm yết bằng đơn vị gốc (JOYka) vì cả sàn chỉ được có một bảng giá, còn
 * ví mỗi người một đơn vị. Bản trước in thẳng số JOYka kèm chữ "JOYka" cho mọi
 * con số — trong khi ví, cửa hàng và thông báo của cùng người đó viết bằng Mira
 * — nên "lãi 600" trên sàn và "lãi 15.000" trong ví là cùng một khoản tiền mà
 * nhìn như hai. Ở đây mọi số đi qua joyDisplay; giá niêm yết gốc chỉ hiện thêm
 * một dòng phụ để người học biết sàn đang tính bằng gì.
 *
 * `priceText` giữ hai chữ số lẻ vì GIÁ MỘT CỔ PHIẾU là số nhỏ: làm tròn về số
 * nguyên như số dư ví sẽ xoá mất chính nhịp sóng mà biểu đồ đang vẽ.
 */
const LOCALE = "vi-VN";
/**
 * Hai chữ số lẻ CHỈ khi con số còn nhỏ. Đơn vị ví to (JOYlu: 1 JOYka ≈ 1.400)
 * biến giá một cổ phiếu thành "158.682,62" — sáu chữ số cộng hai số lẻ không
 * lọt hàng OHLC trên điện thoại, mà hai số lẻ đó cũng chẳng nói thêm gì ở thang
 * đó. Ví đơn vị nhỏ vẫn giữ số lẻ vì mất nó là mất luôn nhịp sóng.
 */
const shortNumber = (value) => {
  const shown = Number(value || 0);
  return shown.toLocaleString(LOCALE, { maximumFractionDigits: Math.abs(shown) >= 1000 ? 0 : 2 });
};
const priceText = (joy) => `${shortNumber(Number(joy || 0) * joyFactor())} ${joyCode()}`;
const moneyText = (joy) => joyText(joy);
const quoteText = (joy) => `${(Math.round(Number(joy || 0) * 100) / 100).toLocaleString(LOCALE)} ${STOCK_QUOTE_CODE}`;

/**
 * Định giá lại một vị thế theo giá đang chạy. Cùng công thức máy chủ dùng
 * (shared/stockPricing.positionPL), nhưng chạy mỗi giây trên máy người dùng để
 * bảng lãi/lỗ không đứng hình sau ảnh chụp SWR.
 */
const livePL = (holding, price) => {
  const cost = holding.avgCost * holding.quantity;
  const value = (price || holding.price || holding.avgCost) * holding.quantity;
  const unrealized = Math.round(value - cost);
  return {
    price: price || holding.price,
    cost: Math.round(cost),
    value: Math.round(value),
    unrealized,
    unrealizedPct: cost > 0 ? Math.round((unrealized / cost) * 1e4) / 1e4 : 0,
  };
};

const toneOf = (value) => (value >= 0 ? "text-success dark:text-success" : "text-destructive dark:text-destructive");
const toneBg = (value) => (value >= 0 ? "bg-success/10 text-success dark:text-success border-success/25" : "bg-destructive/10 text-destructive dark:text-destructive border-destructive/25");

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
    example: "Ví dụ: bỏ ra 100.000 mua HFILM, nay số cổ phiếu đó trị giá 125.000 ➔ đang LỜI +25.000 (+25%) trên giấy. Chỉ khi BÁN, trừ hết phí, nó mới thành lãi thật trong ví."
  },
  second_price: {
    title: "Giá chạy liên tục trong phiên",
    icon: "bolt",
    badge: "Không đoán trước được",
    summary: "Đường giá đi theo bước 60 giây, do máy chủ dựng bằng một hạt giống bí mật — mọi thành viên nhìn cùng một đường.",
    details: [
      "Mỗi bước là một mức giá mới; máy chủ gửi cả đường giá xuống nên biểu đồ bạn thấy đúng bằng giá dùng để khớp lệnh.",
      "Thị trường đổi trạng thái mỗi 15 phút: đi ngang, xu hướng lên, xu hướng xuống, bùng nổ, sập, hoặc một cú sốc tin tức.",
      "KHÔNG ai đoán trước được bước kế tiếp — hạt giống nằm ở máy chủ và không bao giờ gửi ra ngoài. Đừng tin bất cứ ai nói họ biết trước đáy hay đỉnh.",
      "Giá luôn bị kéo về mốc neo của phiên (mức do kết quả kinh doanh quyết định), nên xu hướng chạy được hàng giờ nhưng không đi mãi một chiều."
    ],
    example: "Muốn có lãi thật, giá phải chạy đủ xa để bù phí hai chiều — nhấp nhô vài phút thì phí ăn hết."
  },
  conversion_fee: {
    title: "Đơn Vị Ví Không Ảnh Hưởng Giá",
    icon: "currency_exchange",
    badge: "Đã bỏ phí quy đổi",
    summary: "Ví bạn để ở đơn vị nào cũng mua bán đúng một giá — sàn không thu phí đổi đơn vị nữa.",
    details: [
      "Sàn niêm yết giá theo đơn vị chuẩn JOYka (Kavo), còn ví bạn hiện số theo đơn vị bạn chọn (Mira, Luno, Velu...). Đó chỉ là hai cách VIẾT của cùng một số JOY gốc.",
      "Trước đây mỗi lệnh bị tính 15% phí quy đổi ở cả hai chiều, đẩy mốc hoà vốn của ví khác đơn vị lên 51,6% — phải đoán trúng một cú tăng hơn nửa giá trị công ty mới huề vốn.",
      "Khoản đó đã bỏ: sổ cái ghi JOY gốc từ đầu tới cuối nên chưa từng có lần đổi tiền nào thật sự xảy ra. Nay mọi ví đều hoà vốn ở ~1,01%."
    ],
    example: "Ví dụ: mua 1.000, ví trừ 1.005. Giá lên 1.011 là bán đã huề; lên 1.100 thì bán về 1.094, lãi thật 89."
  },
  brokerage_fee: {
    title: "Phí Môi Giới 0,5%",
    icon: "receipt_long",
    badge: "Chi phí giao dịch",
    summary: "Sàn chỉ thu một khoản duy nhất: 0,5% giá trị lệnh, mỗi chiều.",
    details: [
      "Phí môi giới: 0,5% giá trị lệnh, tối thiểu 1 JOY, thu cả khi mua lẫn khi bán — đúng mức các công ty chứng khoán ngoài đời thu.",
      "Phí sáng tạo 5% mỗi chiều đã BỎ: đó là phí chuyển JOY giữa hai người, mà mua cổ phiếu thì không chuyển tiền cho ai cả.",
      "Vì thu hai chiều nên mốc hoà vốn là 1,01% chứ không phải 0,5%: mua trả thêm 0,5%, bán bị trừ 0,5%.",
      "Toàn bộ phí hiện rõ trước khi bạn bấm Xác nhận đặt lệnh."
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
      "NÊN CHỐT LỜI: khi lãi đã vượt mốc hoà vốn 1,01% — dưới mốc đó, bán ra vẫn là lỗ vì phí thu cả hai chiều.",
      "CẢNH BÁO CẮT LỖ: khi cổ phiếu giảm quá 10%.",
      "GIỮ TIẾP: khi đang lãi nhưng chưa qua mốc hoà vốn — bán lúc đó vẫn là lỗ."
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
      aria-label="Giải thích"
      className="ml-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-[12px] font-bold text-muted-foreground transition-colors hover:text-foreground"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-card space-y-4 text-left">
        <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-muted text-foreground border border-border">
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
            </div>
            <div>
              <span className="inline-block rounded-full bg-muted px-2 py-0.5 text-[11.5px] font-bold text-muted-foreground border border-border">
                {item.badge}
              </span>
              <h3 className="text-base font-bold text-foreground">{item.title}</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        <p className="text-[13.5px] font-bold text-foreground leading-relaxed bg-muted p-3 rounded-2xl border border-border font-sans">
          {item.summary}
        </p>

        <div className="space-y-2">
          <h4 className="text-[13.5px] font-bold uppercase tracking-wider text-muted-foreground">Chi tiết cần biết</h4>
          <ul className="space-y-2">
            {item.details.map((desc, idx) => (
              <li key={idx} className="flex items-start gap-2 text-[13.5px] text-foreground leading-relaxed font-sans">
                <span className="text-muted-foreground font-bold mt-0.5">•</span>
                <span>{desc}</span>
              </li>
            ))}
          </ul>
        </div>

        {item.example && (
          <div className="rounded-2xl bg-muted border border-border p-3 text-[13.5px] leading-relaxed text-foreground font-sans">
            <strong>Ví dụ thực tế:</strong> {item.example}
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="h-12 w-full rounded-xl bg-primary text-[14px] font-bold text-primary-foreground transition-transform active:scale-[0.99]"
        >
          Đã hiểu
        </button>
      </div>
    </div>
  );
}

const feeLabel = (name, rate, digits) => (rate ? `${name} (${(rate * 100).toFixed(digits)}%)` : name);

/** Một dòng trong sổ lệnh → đúng hoá đơn đã in lúc khớp. */
function TradeReceiptModal({ trade, onClose }) {
  if (!trade) return null;
  const itemised = Boolean(trade.brokerage || trade.creativeFee || trade.conversionFee);
  return (
    <ReceiptSheet
      onClose={onClose}
      receipt={{
        at: trade.at,
        session: trade.session || "",
        symbol: trade.symbol,
        side: trade.side,
        quantity: trade.quantity,
        price: trade.price,
        gross: Math.round(trade.price * trade.quantity),
        brokerage: trade.brokerage || 0,
        creativeFee: trade.creativeFee || 0,
        conversionFee: trade.conversionFee || 0,
        fees: trade.fee || 0,
        total: trade.total,
        realizedPL: trade.realizedPL || 0,
        balanceAfter: trade.balanceAfter || 0,
        quoteCode: STOCK_QUOTE_CODE,
        walletCode: trade.walletCode || joyCode(),
        itemised,
      }}
    />
  );
}

/**
 * Hoá đơn của một lệnh đã khớp — TỪNG khoản, không gộp thành một chữ "phí".
 *
 * Số liệu lấy nguyên từ máy chủ (`receipt`), không tính lại ở client: hoá đơn
 * phải là bản ghi của cái ĐÃ xảy ra với ví, không phải một ước lượng vẽ lại.
 */
function ReceiptSheet({ receipt, onClose }) {
  if (!receipt) return null;
  const buy = receipt.side === "buy";
  const at = new Date(receipt.at);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-4 sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-card p-5 text-left shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
          <div>
            <p className="text-[11.5px] font-bold uppercase tracking-wider text-muted-foreground">Hoá đơn khớp lệnh</p>
            <h3 className="text-base font-bold text-foreground">
              {buy ? "Mua" : "Bán"} {receipt.quantity.toLocaleString(LOCALE)} {receipt.symbol}
            </h3>
            <p className="text-[12.5px] text-muted-foreground font-sans">
              {at.toLocaleString(LOCALE)}{receipt.session ? ` · phiên ${receipt.session}` : ""}
            </p>
          </div>
          <span className={`rounded-lg border px-2.5 py-1 text-[11.5px] font-bold ${buy ? "border-success/25 bg-success/10 text-success" : "border-destructive/25 bg-destructive/10 text-destructive"}`}>
            {buy ? "Tiền ra" : "Tiền về"}
          </span>
        </div>

        <dl className="space-y-1.5 text-[13.5px] font-sans">
          <Row label="Giá khớp mỗi cổ phiếu" value={priceText(receipt.price)} />
          <Row label={`Giá trị ${receipt.quantity.toLocaleString(LOCALE)} cổ phiếu`} value={moneyText(receipt.gross)} />
          {receipt.itemised === false ? (
            // Lệnh đặt trước khi sổ lệnh tách phí: chỉ có tổng, và nói thẳng là
            // chỉ có tổng — bịa lại ba khoản từ tỷ lệ hôm nay là in một hoá đơn
            // không đúng với cái đã trừ ví.
            <Row label="Tổng phí (lệnh cũ, không tách khoản)" value={`− ${moneyText(receipt.fees)}`} />
          ) : (
            <>
              <Row label={feeLabel("Phí môi giới", receipt.rates?.brokerage, 1)} value={`− ${moneyText(receipt.brokerage)}`} />
              <Row label={feeLabel("Phí sáng tạo", receipt.rates?.creative, 0)} value={`− ${moneyText(receipt.creativeFee)}`} />
              {receipt.conversionFee > 0 && (
                <Row label={feeLabel("Phí đổi đơn vị", receipt.rates?.conversion, 0)} value={`− ${moneyText(receipt.conversionFee)}`} />
              )}
            </>
          )}
          <div className="my-1 border-t border-border" />
          <Row label={buy ? "Tổng đã trừ ví" : "Tổng đã về ví"} value={moneyText(receipt.total)} strong />
          {!buy && (
            <Row
              label="Lãi/lỗ đã chốt (sau phí)"
              value={`${receipt.realizedPL >= 0 ? "+" : "−"}${moneyText(Math.abs(receipt.realizedPL))}`}
              tone={receipt.realizedPL}
              strong
            />
          )}
          {receipt.balanceAfter > 0 && <Row label="Số dư ví sau lệnh" value={moneyText(receipt.balanceAfter)} />}
        </dl>

        <p className="rounded-2xl border border-border bg-muted p-2.5 text-[11.5px] leading-relaxed text-muted-foreground font-sans">
          Sàn niêm yết bằng {receipt.quoteCode} ({quoteText(receipt.price)}/cổ phiếu). Ví của bạn dùng {receipt.walletCode},
          nên mọi con số ở trên đã quy về đơn vị ví theo tỷ giá lúc khớp.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="h-12 w-full rounded-xl border border-border bg-muted text-[14px] font-bold text-foreground transition-transform active:scale-[0.99]"
        >
          Đóng hoá đơn
        </button>
      </div>
    </div>
  );
}

function SmartAdvisorCard({ portfolio, company, onHelp }) {
  if (!portfolio) return null;

  const { holdings = [], crossDenom = false } = portfolio;
  // Mốc hoà vốn THẬT, tính từ phí đang thu chứ không viết tay: 1,01% với mọi
  // ví. Khuyên chốt lời ở một mốc sai là bảo người ta bán lúc đang lỗ.
  const breakEven = breakEvenPct(crossDenom) * 100;
  const cutLoss = -10;

  let iconName = "psychology";
  let title = "Tư vấn Quản gia";
  let message = "";
  let badgeText = "AI Butler";

  if (company) {
    const holding = holdings.find((h) => h.symbol === company.symbol);
    if (holding) {
      const pct = holding.unrealizedPct * 100;
      if (pct >= breakEven) {
        iconName = "trending_up";
        title = `Chốt lời ${company.symbol}`;
        badgeText = "Khuyến nghị Bán";
        message = `Lời +${pct.toFixed(1)}% đã vượt mốc hoà vốn ${breakEven.toFixed(1)}% (đủ bù cả phí mua lẫn phí bán). Bán bây giờ là lãi thật vào ví.`;
      } else if (pct < cutLoss) {
        iconName = "warning";
        title = `Cắt lỗ ${company.symbol}`;
        badgeText = "Cảnh báo rủi ro";
        message = `Cổ phiếu đang giảm ${pct.toFixed(1)}%. Hãy chú ý quản trị vốn hoặc cân nhắc cắt lỗ.`;
      } else if (pct >= 0) {
        iconName = "hourglass_empty";
        title = `Tiếp tục giữ ${company.symbol}`;
        badgeText = "Nắm giữ";
        message = `Lời +${pct.toFixed(1)}% CHƯA đủ hoà vốn: bán lúc này vẫn lỗ vì phí hai chiều. Mốc hoà vốn của ví bạn là +${breakEven.toFixed(1)}%.`;
      } else {
        iconName = "insights";
        title = `Nắm giữ ${company.symbol}`;
        badgeText = "Vị thế tốt";
        message = `Vị thế ${company.symbol} đang ổn định với ${holding.quantity.toLocaleString(LOCALE)} cổ phiếu.`;
      }
    } else {
      iconName = "show_chart";
      title = `Theo dõi ${company.symbol}`;
      badgeText = "Chưa nắm giữ";
      message = `Giá hiện tại ${priceText(company.price)}. Mua vào thì cần giá tăng ${breakEven.toFixed(1)}% mới hoà được phí hai chiều.`;
    }
  } else if (holdings.length > 0) {
    const sorted = [...holdings].sort((a, b) => b.unrealizedPct - a.unrealizedPct);
    const topProfitable = sorted[0];
    const topLosing = sorted[sorted.length - 1];

    if (topProfitable && topProfitable.unrealizedPct * 100 >= breakEven) {
      iconName = "trending_up";
      title = `Chốt lời ${topProfitable.symbol}`;
      badgeText = "Điểm chốt đẹp";
      message = `${topProfitable.symbol} đang lời +${(topProfitable.unrealizedPct * 100).toFixed(1)}%, đã qua mốc hoà vốn ${breakEven.toFixed(1)}%.`;
    } else if (topLosing && topLosing.unrealizedPct * 100 <= cutLoss) {
      iconName = "warning";
      title = `Quản trị rủi ro ${topLosing.symbol}`;
      badgeText = "Cảnh báo";
      message = `${topLosing.symbol} đang giảm ${(topLosing.unrealizedPct * 100).toFixed(1)}%. Cân nhắc hạ tỷ trọng bảo toàn vốn.`;
    } else {
      iconName = "psychology";
      title = "Tư vấn Quản gia tổng quan";
      badgeText = "Tự động";
      message = `Danh mục chưa mã nào qua mốc hoà vốn +${breakEven.toFixed(1)}%. Bán sớm là trả phí hai lần cho một lần đi.`;
    }
  } else {
    iconName = "smart_toy";
    title = "Sàn Ảo Hugo";
    badgeText = "Hướng dẫn";
    message = "Chưa có cổ phiếu trong danh mục. Sang tab Bảng giá chọn một mã để bắt đầu.";
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-3 shadow-card space-y-1 text-left">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="material-symbols-outlined text-sm text-muted-foreground shrink-0">{iconName}</span>
          <span className="text-[13.5px] font-bold text-foreground truncate flex items-center">
            {title}
            <HelpIcon topicKey="smart_advice" onClick={onHelp} />
          </span>
        </div>
        <span className="rounded-md bg-muted border border-border px-2 py-0.5 text-[11.5px] font-bold uppercase tracking-wider text-muted-foreground shrink-0">
          {badgeText}
        </span>
      </div>
      <p className="text-[12.5px] font-sans leading-relaxed text-muted-foreground pl-0.5">{message}</p>
    </div>
  );
}

export default function HugoInvestTab({ onBack, showToast, onSelectUtility }) {
  const joy = useJoy();
  const balance = useJoyStore((state) => state.balance);
  const [tab, setTab] = useState("market");
  const [detail, setDetail] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [nowSec, setNowSec] = useState(() => Math.floor(Date.now() / 1000));
  const [helpTopic, setHelpTopic] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setNowSec(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(timer);
  }, []);

  // Đường giá máy chủ gửi xuống chỉ chạy TRƯỚC hiện tại một bước (60 giây);
  // hết mảng là priceAt giữ nguyên mốc cuối. Không nạp lại đều đặn thì giá trên
  // màn hình đứng hình sau một phút, rồi lệch quá 3% và mọi lệnh bị từ chối.
  const { data: market, mutate: reloadMarket } = useSWR("/stock/market", fetcher, {
    refreshInterval: 30000,
    dedupingInterval: 15000,
  });
  const { data: portfolio, mutate: reloadPortfolio } = useSWR("/stock/portfolio", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });

  // Lệch giờ giữa máy người dùng và máy chủ được bù một lần lúc tải bảng giá:
  // đọc đường giá bằng đồng hồ máy mình là đọc ở một điểm khác với điểm máy chủ
  // dùng để khớp lệnh.
  const clockSkew = useMemo(
    () => (market?.serverTime ? Math.round(market.serverTime / 1000) - Math.floor(Date.now() / 1000) : 0),
    [market?.serverTime],
  );

  const companies = useMemo(() => {
    const at = nowSec + clockSkew;
    return (market?.companies || []).map((c) => {
      const price = priceAt(c, at);
      const prev = c.prevPrice || c.basePrice || 100;
      return { ...c, price, change: prev ? Math.round(((price - prev) / prev) * 1e4) / 1e4 : 0 };
    });
  }, [market, nowSec, clockSkew]);

  const liveMarket = useMemo(() => {
    if (!market) return null;
    return { ...market, companies };
  }, [market, companies]);

  const active = companies.find((c) => c.symbol === detail) || null;

  const TABS = [
    { id: "market", label: "Bảng giá" },
    { id: "portfolio", label: "Danh mục" },
    { id: "learn", label: "Giáo trình" },
  ];

  const afterTrade = useCallback(async () => {
    await Promise.all([reloadPortfolio(), reloadMarket()]);
  }, [reloadPortfolio, reloadMarket]);

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      {/* Help Info Popup Modal */}
      <InfoModalPopup topicKey={helpTopic} onClose={() => setHelpTopic(null)} />

      <header
        className="sticky top-0 z-30 shrink-0 border-b border-border bg-card px-3 pb-2.5"
        style={{ paddingTop: "max(12px, calc(env(safe-area-inset-top, 0px) + 8px))" }}
      >
        <div className="flex h-11 items-center gap-2">
          <BackButton onClick={detail ? () => setDetail(null) : lesson ? () => setLesson(null) : onBack} label="Quay lại" iconOnly />
          <h1 className="min-w-0 flex-1 truncate text-[17px] font-bold text-foreground">
            {active ? active.symbol : lesson ? lesson.title : "Sàn ảo Hugo"}
          </h1>

          {onSelectUtility && (
            <button
              type="button"
              onClick={() => { hapticSelect(); onSelectUtility("joy_wallet"); }}
              className="-mr-2 flex h-11 shrink-0 items-center px-2 text-[14px] font-bold tabular-nums text-muted-foreground"
              title="Số dư ví JOY — bấm để mở ví"
            >
              {joy.number(balance)} {joy.code}
            </button>
          )}
        </div>

        {/*
          Segmented control kiểu iOS: rãnh nền mờ, mục đang chọn là "viên" nổi
          màu thẻ có bóng nhẹ, và vạch tóc chỉ hiện giữa hai mục CÙNG chưa chọn
          — đúng chi tiết của UISegmentedControl. Cao 40px + 2px đệm = 44px, vẫn
          đủ ngưỡng chạm của portal.
        */}
        {!active && !lesson && (
          <nav className="mt-2 flex rounded-[10px] bg-muted p-0.5" role="tablist">
            {TABS.map((item, index) => {
              const selected = tab === item.id;
              const prevSelected = index > 0 && tab === TABS[index - 1].id;
              return (
                <div key={item.id} className="relative flex-1">
                  {index > 0 && !selected && !prevSelected && (
                    <span className="pointer-events-none absolute left-0 top-1/2 h-4 w-px -translate-y-1/2 bg-border" />
                  )}
                  <button
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => { hapticSelect(); setTab(item.id); }}
                    className={`h-10 w-full rounded-lg text-[13.5px] transition-colors ${
                      selected
                        ? "bg-card font-semibold text-foreground shadow-[0_3px_8px_rgb(0_0_0/0.12),0_1px_1px_rgb(0_0_0/0.04)]"
                        : "font-medium text-muted-foreground"
                    }`}
                  >
                    {item.label}
                  </button>
                </div>
              );
            })}
          </nav>
        )}
      </header>

      {/* Main Content Area */}
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 space-y-4" style={{ paddingBottom: "calc(32px + env(safe-area-inset-bottom, 0px))" }}>
        {active ? (
          <CompanyDetail company={active} portfolio={portfolio} market={liveMarket} onTraded={afterTrade} showToast={showToast} onHelp={setHelpTopic} />
        ) : lesson ? (
          <LessonView lesson={lesson} />
        ) : tab === "market" ? (
          <Market market={liveMarket} portfolio={portfolio} onOpen={setDetail} onHelp={setHelpTopic} />
        ) : tab === "portfolio" ? (
          <Portfolio portfolio={portfolio} companies={companies} onOpen={setDetail} onHelp={setHelpTopic} />
        ) : (
          <Learn onOpen={setLesson} />
        )}
      </div>
    </div>
  );
}

function Market({ market, portfolio, onOpen, onHelp }) {
  if (!market) return <Skeleton rows={4} />;

  const featuredCompany = market.companies[0] || null;

  return (
    <div className="space-y-4">
      {/* Smart AI Butler Investment Advisor */}
      <SmartAdvisorCard portfolio={portfolio} onHelp={onHelp} />

      {/* Featured Realtime Chart Card on Market Home */}
      {featuredCompany && (
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-card space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-success" />
              <span className="text-[13.5px] font-bold uppercase tracking-wider text-success flex items-center">
                Xu Hướng Realtime 1s: {featuredCompany.symbol}
                <HelpIcon topicKey="second_price" onClick={onHelp} />
              </span>
            </div>
            <button
              type="button"
              onClick={() => { hapticSelect(); onOpen(featuredCompany.symbol); }}
              className="text-[13.5px] font-bold text-success hover:underline flex items-center gap-1"
            >
              <span>Xem chi tiết</span>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>

          <StockPriceChart company={featuredCompany} />
        </div>
      )}

      {/* Ticker List Tiles */}
      <div className="space-y-2">
        <h3 className="text-[13.5px] font-bold uppercase tracking-wider text-muted-foreground px-1 flex items-center">
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
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-3.5 text-left transition-all duration-300 hover:border-border hover:bg-card active:scale-[0.98] shadow-card"
              >
                <div className="flex items-center justify-between gap-2.5">
                  {/* Left: Symbol & Name */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base font-bold text-foreground group-hover:text-success transition-colors tracking-tight">{company.symbol}</span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11.5px] font-bold text-muted-foreground border border-border">{company.sector}</span>
                    </div>
                    <p className="mt-0.5 truncate text-[12.5px] text-muted-foreground font-sans">{company.name}</p>
                  </div>

                  {/* Center: Mini Sparkline Wave (Visible on Mobile & Desktop) */}
                  <div className="w-20 sm:w-28 shrink-0 opacity-90 group-hover:opacity-100 transition-opacity">
                    <MiniSparkline company={company} isUp={isUp} />
                  </div>

                  {/* Right: Price & Percent Pill */}
                  <div className="shrink-0 text-right min-w-[76px]">
                    <div className="text-sm font-bold tabular-nums text-foreground tracking-tight">{priceText(company.price)}</div>
                    <div className={`mt-0.5 inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[12.5px] font-bold tabular-nums border ${toneBg(company.change)}`}>
                      <span className="material-symbols-outlined text-[12.5px]">{isUp ? "arrow_drop_up" : "arrow_drop_down"}</span>
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

function MiniSparkline({ company, isUp }) {
  // 20 mốc cuối của ĐƯỜNG GIÁ THẬT do máy chủ gửi xuống. Bản trước tự sinh 13
  // điểm bằng công thức của riêng client, nên hình sóng ở đây không liên quan
  // gì tới giá đã khớp.
  const points = useMemo(() => (company.ticks?.prices || []).slice(-20), [company.ticks]);
  if (points.length < 2) return null;

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
    <svg viewBox="0 0 96 32" className={`h-8 w-full overflow-visible ${isUp ? "text-success" : "text-destructive"}`}>
      <path d={path} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CompanyDetail({ company, portfolio, market, onTraded, showToast, onHelp }) {
  const feeRate = market?.feeRate ?? 0.005;
  const creativeRate = market?.creativeFeeRate ?? 0.05;
  const conversionRate = portfolio?.crossDenom ? (market?.conversionFeeRate ?? 0.15) : 0;
  // Ba trạng thái khác nhau, đừng gộp thành số 0:
  //   chưa tải xong  → không biết số dư, KHÔNG được khoá nút
  //   không có ví    → nói thẳng lý do
  //   có ví          → dùng số thật
  const walletLoaded = Boolean(portfolio);
  const hasWallet = portfolio ? portfolio.hasWallet !== false : true;
  const cash = typeof portfolio?.cash === "number" ? portfolio.cash : null;
  const [side, setSide] = useState("buy");
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState(null);

  // Vị thế phải định giá lại theo GIÁ ĐANG CHẠY, không dùng lại ảnh chụp lúc
  // /portfolio trả về: SWR giữ bản đó tới 30 giây trong khi giá nhảy từng giây,
  // nên bản trước hiện "lãi 600" ngay bên dưới một mức giá đã khác hẳn.
  const holding = useMemo(() => {
    const raw = portfolio?.holdings?.find((h) => h.symbol === company.symbol);
    if (!raw) return null;
    return { ...raw, ...livePL(raw, company.price) };
  }, [portfolio, company.symbol, company.price]);

  const qty = Math.max(1, Math.floor(Number(quantity) || 0));
  // Phí tính bằng CHÍNH hàm máy chủ dùng để trừ ví (shared/stockPricing.js).
  // Bản trước chép lại công thức ở đây, và chép sai thì màn xác nhận nói một
  // đằng ví trừ một nẻo.
  const costs = tradeCosts({
    price: company.price,
    quantity: qty,
    side,
    // Đơn vị ví không còn làm đổi giá (phí quy đổi đã bỏ), nhưng vẫn gửi đúng
    // đơn vị để hoá đơn hiện tiền theo đúng thứ người dùng đang nhìn.
    memberDenom: portfolio?.walletDenom || joyDenom(),
  });
  const { gross, brokerage, creativeFee, conversionFee, total } = costs;

  const submit = async () => {
    setBusy(true);
    try {
      const res = await fetch(`${API}/stock/trade`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        // Giá gửi kèm CHỈ để máy chủ đối chiếu rồi từ chối khi lệch quá 3% —
        // giá khớp luôn do máy chủ tự tính.
        body: JSON.stringify({ symbol: company.symbol, side, quantity: qty, expectedPrice: company.price }),
      });
      const data = await res.json();
      if (data.success) {
        setReceipt(data.receipt || null);
        await onTraded();
      }
      showToast?.(data.message || (data.success ? "Đã khớp lệnh thành công" : "Không đặt được lệnh"), data.success ? "success" : "error");
    } catch (error) {
      showToast?.(error.message, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <ReceiptSheet receipt={receipt} onClose={() => setReceipt(null)} />

      {/* Smart AI Financial Advisor Card */}
      <SmartAdvisorCard portfolio={portfolio} company={company} onHelp={onHelp} />

      {/* Stock Header & Price Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-[28px] font-bold leading-none tabular-nums tracking-tight text-foreground">
              {priceText(company.price)}
            </div>
            <p className="mt-1.5 text-[12px] text-muted-foreground">
              Niêm yết {quoteText(company.price)} · quy về ví bạn theo tỷ giá hôm nay
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className={`inline-flex items-center gap-0.5 rounded-lg border px-2 py-0.5 text-[13.5px] font-bold tabular-nums ${toneBg(company.change)}`}>
                <span className="material-symbols-outlined text-[16px]">{company.change >= 0 ? "arrow_drop_up" : "arrow_drop_down"}</span>
                <span>{pctText(company.change)}</span>
              </span>
              <span className="text-[12px] text-muted-foreground">tham chiếu {priceText(company.prevPrice)}</span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-muted px-2 py-1 text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-success" />
            <span className="flex items-center text-[11.5px] font-bold">
              Realtime 1s
              <HelpIcon topicKey="second_price" onClick={onHelp} />
            </span>
          </div>
        </div>

        {/* Biểu đồ biến động giá theo giây + vị thế MUA - BÁN */}
        <StockPriceChart company={company} trades={portfolio?.trades} />
      </div>

      {/* Info Stats */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <div>
          <h3 className="text-sm font-bold text-foreground">{company.name}</h3>
          <p className="mt-1 text-[13.5px] text-muted-foreground leading-relaxed font-sans">{company.description}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
          <Stat label="Cổ phiếu phát hành" value={company.sharesOutstanding.toLocaleString("vi-VN")} />
          <Stat label="Vốn hoá thị trường" value={moneyText(company.marketCap)} onHelp={onHelp} helpKey="market_cap" />
          <Stat label="Biên độ dao động" value={`${(company.volatility * 100).toFixed(0)}%`} />
          <Stat label="Cổ tức mỗi phiên" value={company.dividendRate ? `${(company.dividendRate * 100).toFixed(2)}%` : "Không trả"} />
        </div>
      </div>

      {/* User Holding Info */}
      {holding && (
        <div className="rounded-2xl border border-success/25 bg-success/10 p-4 text-[13.5px] space-y-1">
          <p className="font-bold text-success text-sm flex items-center">
            Bạn đang nắm {holding.quantity.toLocaleString("vi-VN")} cổ phiếu {company.symbol}
            <HelpIcon topicKey="pnl" onClick={onHelp} />
          </p>
          <p className="text-foreground font-sans">
            Giá vốn: <strong className="text-foreground">{priceText(holding.avgCost)}</strong> · Giá trị hiện tại: <strong className="text-foreground">{moneyText(holding.value)}</strong>
          </p>
          <p className="pt-1 flex items-center">
            Lãi/lỗ trên giấy:{" "}
            <strong className={`font-bold text-sm ml-1 ${toneOf(holding.unrealized)}`}>
              {holding.unrealized >= 0 ? "+" : ""}{moneyText(holding.unrealized)} ({pctText(holding.unrealizedPct)})
            </strong>
          </p>
        </div>
      )}

      {/* iOS 27 Order Execution Sheet */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-card">
        <h3 className="text-[14.5px] font-bold text-foreground">Đặt lệnh khớp ngay</h3>

        {/* Side Selector */}
        <div className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-muted p-1">
          <button
            type="button"
            onClick={() => { hapticSelect(); setSide("buy"); }}
            className={`h-11 rounded-lg text-[14px] font-bold transition-colors ${
              side === "buy"
                ? "bg-success text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Mua
          </button>
          <button
            type="button"
            onClick={() => { hapticSelect(); setSide("sell"); }}
            className={`h-11 rounded-lg text-[14px] font-bold transition-colors ${
              side === "sell"
                ? "bg-destructive text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Bán
          </button>
        </div>

        {/* Quantity Input */}
        <div className="space-y-2">
          <label className="block text-[12.5px] font-semibold text-muted-foreground">Số lượng cổ phiếu</label>
          <div className="relative">
            <input
              type="number"
              min="1"
              inputMode="numeric"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="h-12 w-full rounded-xl border border-border bg-background px-3.5 pr-20 text-[16px] font-bold tabular-nums text-foreground outline-none focus:border-primary"
            />
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[12.5px] font-semibold text-muted-foreground">cổ phiếu</span>
          </div>

          {/* Quick Amount Presets */}
          <div className="flex gap-2 pt-1">
            {[1, 10, 50, 100].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => { hapticSelect(); setQuantity(num); }}
                className="h-11 flex-1 rounded-xl border border-border bg-muted text-[13px] font-bold text-foreground transition-transform active:scale-95"
              >
                +{num}
              </button>
            ))}
            {holding && holding.quantity > 0 && (
              <button
                type="button"
                onClick={() => { hapticSelect(); setSide("sell"); setQuantity(holding.quantity); }}
                className="flex-1 py-1.5 rounded-xl bg-destructive/10 hover:bg-destructive/10 border border-destructive/25 text-[13.5px] font-bold text-destructive transition-all active:scale-95"
              >
                Tất cả
              </button>
            )}
          </div>
        </div>

        {/* Fees & Summary Breakdown */}
        <dl className="space-y-1.5 rounded-2xl bg-muted/40 p-3.5 border border-border text-[13.5px] font-sans">
          <Row label={`Giá khớp mỗi cổ phiếu`} value={priceText(company.price)} />
          <Row label={`Giá trị ${qty.toLocaleString(LOCALE)} cổ phiếu`} value={moneyText(gross)} />
          <Row label={`Phí môi giới (${(feeRate * 100).toFixed(1)}%)`} value={moneyText(brokerage)} onHelp={onHelp} helpKey="brokerage_fee" />
          <Row label={`Phí sáng tạo (${(creativeRate * 100).toFixed(0)}%)`} value={moneyText(creativeFee)} onHelp={onHelp} helpKey="brokerage_fee" />
          {conversionRate > 0 && (
            <>
              <Row label={`Phí đổi đơn vị (${(conversionRate * 100).toFixed(0)}%)`} value={moneyText(conversionFee)} onHelp={onHelp} helpKey="conversion_fee" />
              <div className="mt-2 rounded-xl border border-warning/25 bg-warning/10 p-3 text-[13px] leading-relaxed text-foreground flex items-start justify-between gap-1">
                <span>
                  <strong>Ví khác đơn vị gốc:</strong> phí quy đổi 15% thu cả chiều <strong>MUA và BÁN</strong>, nên giá phải tăng{" "}
                  <strong>{(breakEvenPct(true) * 100).toFixed(1)}%</strong> thì bán mới hoà vốn.
                </span>
                <HelpIcon topicKey="conversion_fee" onClick={onHelp} />
              </div>
            </>
          )}
          <div className="my-1 border-t border-border" />
          <Row
            label={side === "buy" ? `Tổng trừ ví (${costs.walletCode})` : `Tổng về ví (${costs.walletCode})`}
            value={moneyText(total)}
            strong
          />
          {side === "buy" && (
            <Row
              label="Số dư ví khả dụng"
              value={cash === null ? (walletLoaded ? "Chưa có ví JOY" : "Đang tải…") : moneyText(cash)}
              tone={cash !== null && total > cash ? -1 : undefined}
            />
          )}
          {side === "buy" && cash !== null && total > cash && (
            <p className="pt-1 text-[11.5px] leading-snug text-destructive font-sans">
              Thiếu {moneyText(total - cash)} để đặt lệnh này. Giảm số lượng hoặc nạp thêm vào ví.
            </p>
          )}
          {side === "buy" && walletLoaded && !hasWallet && (
            <p className="pt-1 text-[11.5px] leading-snug text-destructive font-sans">
              Tài khoản này chưa có ví JOY nên chưa đặt lệnh được. Mở app Tài khoản để tạo hồ sơ trước.
            </p>
          )}
          <p className="pt-1 text-[11.5px] leading-snug text-muted-foreground font-sans">
            Sàn niêm yết bằng {STOCK_QUOTE_CODE}: {quoteText(gross)} cho lệnh này. Số trên đã quy về đơn vị ví của bạn.
          </p>
        </dl>

        {/* Action Button */}
        <button
          type="button"
          // Chỉ khoá khi ĐÃ BIẾT là không đủ. Chưa tải xong số dư mà đã khoá thì
          // người dùng ngồi nhìn một nút chết không hiểu vì sao; máy chủ vẫn là
          // nơi chặn cuối cùng và nó trả lời rõ ràng.
          disabled={busy
            || (side === "buy" && cash !== null && total > cash)
            || (side === "buy" && walletLoaded && !hasWallet)
            || (side === "sell" && (!holding || holding.quantity < qty))}
          onClick={submit}
          className={`h-12 w-full rounded-2xl font-bold text-sm text-foreground shadow-card transition-all duration-300 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2 ${
            side === "buy"
              ? "bg-success"
              : "bg-destructive"
          }`}
        >
          {busy ? (
            <span className="inline-block h-4 w-4 rounded-full border-2 border-white/90 border-t-transparent animate-spin" />
          ) : (
            <>
              <span className="material-symbols-outlined text-lg">{side === "buy" ? "shopping_cart" : "sell"}</span>
              <span>{side === "buy" ? `Xác nhận mua ${qty.toLocaleString(LOCALE)} cổ` : `Xác nhận bán ${qty.toLocaleString(LOCALE)} cổ`}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function Portfolio({ portfolio, companies, onOpen, onHelp }) {
  const [openTrade, setOpenTrade] = useState(null);

  // Toàn bộ bảng này định giá lại theo GIÁ ĐANG CHẠY. Bản trước hiển thị thẳng
  // các con số máy chủ chốt lúc gọi /portfolio (SWR giữ 30 giây), nên tổng lãi
  // ở đây và giá trên bảng giá là hai thời điểm khác nhau — người học không có
  // cách nào biết mình đang nhìn số nào.
  const live = useMemo(() => {
    const raw = portfolio?.holdings || [];
    const priceOf = Object.fromEntries((companies || []).map((c) => [c.symbol, c.price]));
    const holdings = raw.map((h) => ({ ...h, ...livePL(h, priceOf[h.symbol]) }));
    const invested = holdings.reduce((sum, h) => sum + h.cost, 0);
    const value = holdings.reduce((sum, h) => sum + h.value, 0);
    return {
      holdings,
      invested,
      value,
      unrealized: value - invested,
      unrealizedPct: invested > 0 ? (value - invested) / invested : 0,
    };
  }, [portfolio, companies]);

  if (!portfolio) return <Skeleton rows={3} />;

  const { trades = [] } = portfolio;
  const { holdings } = live;
  const unrealizedVal = live.unrealized;
  const isProfit = unrealizedVal >= 0;

  return (
    <div className="space-y-4">
      <TradeReceiptModal trade={openTrade} onClose={() => setOpenTrade(null)} />

      {/* Smart AI Financial Advisor Card */}
      <SmartAdvisorCard portfolio={{ ...portfolio, holdings }} onHelp={onHelp} />

      {/* Prominent Profit / Loss (PnL) Executive Summary Card */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-card space-y-4">

        {/* Top Header */}
        <div className="flex items-center justify-between">
          <p className="text-[13.5px] font-bold uppercase tracking-wider text-muted-foreground flex items-center">
            Tổng Lời / Lỗ Ròng (PnL)
            <HelpIcon topicKey="pnl" onClick={onHelp} />
          </p>
          <span className={`rounded-md bg-muted border border-border px-2.5 py-0.5 text-[11.5px] font-bold uppercase tracking-wider ${toneOf(unrealizedVal)}`}>
            {isProfit ? "Đang lời" : "Đang lỗ"}
          </span>
        </div>

        {/* Big Profit / Loss Display */}
        <div className="space-y-1">
          <div className={`text-[28px] font-bold tabular-nums tracking-tight ${toneOf(unrealizedVal)}`}>
            {isProfit ? "+" : "−"}{moneyText(Math.abs(unrealizedVal))}
          </div>
          <div className="text-[13.5px] font-bold text-foreground font-sans">
            Tỷ lệ sinh lời: <span className={toneOf(unrealizedVal)}>{pctText(live.unrealizedPct)}</span>
          </div>
        </div>

        {/* 3 Key Stats Breakdown */}
        <div className="grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">
          <Stat label="Vốn Đầu Tư" value={moneyText(live.invested)} onHelp={onHelp} helpKey="pnl" />
          <Stat label="Giá Trị Hiện Tại" value={moneyText(live.value)} onHelp={onHelp} helpKey="pnl" />
          <Stat label="Lãi Đã Chốt" value={moneyText(portfolio.realized)} tone={portfolio.realized} onHelp={onHelp} helpKey="pnl" />
        </div>
        {portfolio.dividends > 0 && (
          <p className="text-[12.5px] text-muted-foreground font-sans">
            Cổ tức đã nhận tới nay: <strong className="text-success">{moneyText(portfolio.dividends)}</strong>
          </p>
        )}

        {/* Mốc hoà vốn — hiện cho MỌI ví, vì đơn vị ví không còn làm đổi phí.
            Con số lấy từ breakEvenPct nên sửa phí ở một chỗ là chữ đổi theo. */}
        <div className="rounded-2xl border border-border bg-muted/40 p-3 text-[13px] leading-relaxed text-foreground flex items-center justify-between">
          <span>
            <strong>Mốc hoà vốn:</strong> phí môi giới 0,5% thu cả hai chiều, nên giá phải tăng{" "}
            <strong>{(breakEvenPct(false) * 100).toFixed(2)}%</strong> thì bán mới huề vốn — bán sớm hơn là lỗ.
          </span>
          <HelpIcon topicKey="brokerage_fee" onClick={onHelp} />
        </div>
      </div>

      {/* Holdings List */}
      <div className="space-y-2">
        <h3 className="text-[13.5px] font-bold uppercase tracking-wider text-muted-foreground px-1 flex items-center">
          Danh Mục Đang Nắm Giữ
          <HelpIcon topicKey="pnl" onClick={onHelp} />
        </h3>
        {holdings.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center space-y-3">
            <span className="material-symbols-outlined text-4xl text-success/60">auto_graph</span>
            <p className="text-[13.5px] text-muted-foreground leading-relaxed font-sans max-w-xs mx-auto">
              Chưa nắm giữ cổ phiếu nào. Hãy chuyển sang tab <strong className="text-foreground">Bảng giá</strong> để chọn cổ phiếu và tích lũy lợi nhuận!
            </p>
          </div>
        ) : (
          holdings.map((holding) => (
            <button
              key={holding.symbol}
              type="button"
              onClick={() => { hapticSelect(); onOpen(holding.symbol); }}
              className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-all hover:bg-card active:scale-[0.98]"
            >
              <div>
                <span className="text-base font-bold text-foreground">{holding.symbol}</span>
                <span className="block text-[13.5px] text-muted-foreground mt-0.5 font-sans">
                  {holding.quantity.toLocaleString("vi-VN")} cổ · vốn {priceText(holding.avgCost)}
                </span>
              </div>
              <div className="text-right">
                <span className="block text-base font-bold tabular-nums text-foreground">{moneyText(holding.value)}</span>
                <span className={`block text-[13.5px] font-bold tabular-nums ${toneOf(holding.unrealized)}`}>
                  {pctText(holding.unrealizedPct)}
                </span>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Recent Trades Audit List */}
      {trades.length > 0 && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <p className="border-b border-border px-4 py-3 text-[13.5px] font-bold uppercase tracking-wider text-foreground">Nhật Ký Khớp Lệnh</p>
          <ul className="divide-y divide-border">
            {trades.map((trade, index) => (
              <li key={index}>
                <button
                  type="button"
                  onClick={() => { hapticSelect(); setOpenTrade(trade); }}
                  className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-[13.5px] font-sans transition-colors hover:bg-muted"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-bold ${trade.side === "buy" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                        {trade.side === "buy" ? "Mua" : "Bán"}
                      </span>
                      <span className="truncate text-foreground">
                        {trade.quantity.toLocaleString(LOCALE)} {trade.symbol} @ {priceText(trade.price)}
                      </span>
                    </div>
                    <span className="mt-0.5 block text-[11.5px] text-muted-foreground">
                      {new Date(trade.at).toLocaleString(LOCALE)} · phí {moneyText(trade.fee)} · bấm xem hoá đơn
                    </span>
                  </div>
                  <span className={`shrink-0 tabular-nums font-bold ${trade.side === "sell" ? toneOf(trade.realizedPL) : "text-muted-foreground"}`}>
                    {trade.side === "sell"
                      ? `${trade.realizedPL >= 0 ? "+" : "−"}${moneyText(Math.abs(trade.realizedPL))}`
                      : `−${moneyText(trade.total)}`}
                  </span>
                </button>
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
      <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
        <p className="text-[13.5px] leading-relaxed text-muted-foreground">
          Mười bài học thực chiến thiết kế chuẩn Hugo Studio — giải thích từ cơ bản tới nâng cao với ví dụ bằng số thật.
        </p>
      </div>
      {LESSONS.map((item, index) => (
        <button
          key={item.id}
          type="button"
          onClick={() => { hapticSelect(); onOpen(item); }}
          className="w-full rounded-2xl border border-border bg-card p-4 text-left transition-all hover:bg-card active:scale-[0.98]"
        >
          <p className="text-sm font-bold text-foreground">
            {index + 1}. {item.title}
          </p>
          <p className="mt-1 text-[13.5px] text-muted-foreground font-sans">{item.summary}</p>
        </button>
      ))}
    </div>
  );
}

function LessonView({ lesson }) {
  return (
    <article className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-card">
      <h2 className="text-[19px] font-bold leading-tight text-foreground">{lesson.title}</h2>
      <p className="text-[13.5px] font-bold text-success">{lesson.summary}</p>
      <div className="space-y-3 border-t border-border pt-3">
        {lesson.body.map((paragraph, index) => (
          <p key={index} className="text-[13.5px] leading-relaxed text-foreground font-sans">{paragraph}</p>
        ))}
      </div>
    </article>
  );
}

function Stat({ label, value, tone, onHelp, helpKey }) {
  return (
    <div className="rounded-2xl bg-muted/40 p-2.5 border border-border">
      <dt className="text-[11.5px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
        <span>{label}</span>
        {helpKey && <HelpIcon topicKey={helpKey} onClick={onHelp} />}
      </dt>
      <dd className={`text-[13.5px] font-bold tabular-nums mt-0.5 ${tone === undefined ? "text-foreground" : toneOf(tone)}`}>{value}</dd>
    </div>
  );
}

function Row({ label, value, strong, tone, onHelp, helpKey }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-muted-foreground flex items-center">
        <span>{label}</span>
        {helpKey && <HelpIcon topicKey={helpKey} onClick={onHelp} />}
      </dt>
      <dd className={`tabular-nums ${strong ? "text-sm font-bold text-foreground" : "font-bold text-foreground"} ${tone === undefined ? "" : toneOf(tone)}`}>
        {value}
      </dd>
    </div>
  );
}

function Skeleton({ rows = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="h-24 animate-pulse rounded-2xl bg-card border border-border" />
      ))}
    </div>
  );
}
