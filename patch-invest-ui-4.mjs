import fs from "fs";

const jsxPath = "src/components/member/invest/HugoInvestTab.jsx";
let content = fs.readFileSync(jsxPath, "utf8");

// Remaining specific instances
content = content.replace(/{trade\.side === "buy" \? "Mua" : "Bán"}/g, '{trade.side === "buy" ? t("invest.ui.buy", "Mua") : t("invest.ui.sell", "Bán")}');
content = content.replace(/>Tất cả</g, '>{t("invest.ui.all", "Tất cả")}<');
content = content.replace(/>Bán</g, '>{t("invest.ui.sell", "Bán")}<');
content = content.replace(/{priceText\(holding\.avgCost\)}/g, '{priceText(holding.avgCost)}'); // Nothing to translate here

fs.writeFileSync(jsxPath, content, "utf8");
console.log("Phase 4 done");
