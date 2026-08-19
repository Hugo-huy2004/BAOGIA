import fs from "fs";

const jsxPath = "src/components/member/invest/HugoInvestTab.jsx";
let content = fs.readFileSync(jsxPath, "utf8");

const replacements = [
  { match: "Tư vấn Quản gia tổng quan", key: "invest.ui.smartAdvisorTitle", en: "Overview Butler Advice" },
  { match: "TỰ ĐỘNG", key: "invest.ui.auto", en: "AUTO" },
  { match: "Danh mục chưa mã nào qua mốc hoà vốn \\+1.0%. Bán sớm là trả phí hai lần cho một lần đi.", key: "invest.ui.smartAdvisorWarning", en: "No stock has crossed the +1.0% breakeven mark yet. Selling early means paying fees twice for a single trip." },
  { match: "Xu Hướng Realtime 1s:", key: "invest.ui.realtimeTrend", en: "Realtime 1s Trend:" },
  { match: "Xem chi tiết", key: "invest.ui.viewDetail", en: "View Details" },
  { match: ">2 phút<", key: ">invest.ui.2min<", en: "2 mins", raw: true, replace: ">{t('invest.ui.2min', '2 phút')}<" },
  { match: ">5 phút<", key: ">invest.ui.5min<", en: "5 mins", raw: true, replace: ">{t('invest.ui.5min', '5 phút')}<" },
  { match: ">15 phút<", key: ">invest.ui.15min<", en: "15 mins", raw: true, replace: ">{t('invest.ui.15min', '15 phút')}<" },
  { match: ">Phiên<", key: ">invest.ui.session<", en: "Session", raw: true, replace: ">{t('invest.ui.session', 'Phiên')}<" },
  { match: "30 nến", key: "invest.ui.30candles", en: "30 candles" },
  { match: "Danh Sách Mã Chứng Khoán", key: "invest.ui.stockList", en: "Stock Market List" },
  { match: "Tổng Lời / Lỗ Ròng \\(PnL\\)", key: "invest.ui.totalPnl", en: "Total Net Profit / Loss (PnL)" },
  { match: "ĐANG LỖ", key: "invest.ui.losing", en: "LOSING" },
  { match: "CÓ LÃI", key: "invest.ui.profitable", en: "PROFITABLE" },
  { match: "Tỷ lệ sinh lời:", key: "invest.ui.roi", en: "Return on Investment:" },
  { match: "Vốn Đầu Tư", key: "invest.ui.investedCapital", en: "Invested Capital" },
  { match: "Giá Trị Hiện Tại", key: "invest.ui.currentValue", en: "Current Value" },
  { match: "Lãi Đã Chốt", key: "invest.ui.realizedProfit", en: "Realized Profit" },
  { match: "Cổ tức đã nhận tới nay:", key: "invest.ui.dividendsReceived", en: "Dividends received so far:" },
  { match: "Mốc hoà vốn: phí môi giới 0,5% thu cả hai chiều, nên giá phải tăng 1.01% thì bán mới huề vốn — bán sớm hơn là lỗ.", key: "invest.ui.breakevenNote", en: "Breakeven mark: 0.5% brokerage fee is charged on both sides, so the price must increase by 1.01% to break even — selling earlier is a loss." },
  { match: "Danh Mục Đang Nắm Giữ", key: "invest.ui.holdingPortfolio", en: "Holding Portfolio" },
  { match: "Nhật Ký Khớp Lệnh", key: "invest.ui.orderHistory", en: "Order Execution History" },
  { match: ">Bán<", key: ">invest.ui.sell<", en: "Sell", raw: true, replace: ">{t('invest.ui.sell', 'Bán')}<" },
  { match: ">Mua<", key: ">invest.ui.buy<", en: "Buy", raw: true, replace: ">{t('invest.ui.buy', 'Mua')}<" },
  { match: "phí", key: "invest.ui.fee", en: "fee" },
  { match: "bấm xem hoá đơn", key: "invest.ui.viewReceipt", en: "click to view receipt" },
  { match: "xem hoá đơn", key: "invest.ui.viewReceiptShort", en: "view receipt" },
  { match: "vốn", key: "invest.ui.capital", en: "capital" },
  { match: "cổ", key: "invest.ui.shares", en: "shares" },
];

const newEnKeys = {};

replacements.forEach(rep => {
  if (rep.raw) {
    content = content.replace(new RegExp(rep.match, "g"), rep.replace);
    newEnKeys[rep.key.replace(/>|</g, "")] = rep.en;
  } else {
    // Regex to match the text outside of tags or attributes, or we can just replace the literal string
    // Let's replace the string directly assuming it's used directly in JSX or strings
    const escapedMatch = rep.match;
    // Replace text between > and <
    content = content.replace(new RegExp(`>\\s*${escapedMatch}\\s*<`, "g"), `>{t('${rep.key}', '${rep.match.replace(/\\/g, '')}')}<`);
    // Replace in template literals if present
    content = content.replace(new RegExp(`\`${escapedMatch}\``, "g"), `t('${rep.key}', '${rep.match.replace(/\\/g, '')}')`);
    content = content.replace(new RegExp(`"${escapedMatch}"`, "g"), `t('${rep.key}', '${rep.match.replace(/\\/g, '')}')`);
    content = content.replace(new RegExp(`'${escapedMatch}'`, "g"), `t('${rep.key}', '${rep.match.replace(/\\/g, '')}')`);
    // Also replace standalone inside strings if not matched above
    
    // Some are mixed in strings like `vốn ${...}`
    if (rep.match === "vốn" || rep.match === "cổ" || rep.match === "phí" || rep.match === "bấm xem hoá đơn") {
       // We'll handle these manually below if they didn't match.
    }
    
    newEnKeys[rep.key.split('.').pop()] = rep.en;
  }
});

fs.writeFileSync(jsxPath, content, "utf8");

// Save to en JSON
const enData = JSON.parse(fs.readFileSync("src/i18n/locales/en/translation.json", "utf8"));
if (!enData.invest.ui) enData.invest.ui = {};
Object.assign(enData.invest.ui, newEnKeys);
fs.writeFileSync("src/i18n/locales/en/translation.json", JSON.stringify(enData, null, 2), "utf8");

console.log("JSX and EN JSON patched");
