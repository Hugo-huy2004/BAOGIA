import fs from "fs";
import path from "path";

const localesDir = "src/i18n/locales";
const dirs = fs.readdirSync(localesDir);

const replacements = [
  { key: "brokerageFeeLbl", find: "${(feeRate * 100).toFixed(1)}", replace: "{{feeRate}}" },
  { key: "creativeFeeLbl", find: "${(creativeRate * 100).toFixed(0)}", replace: "{{creativeRate}}" },
  { key: "conversionFeeLbl", find: "${(conversionRate * 100).toFixed(0)}", replace: "{{conversionRate}}" },
  { key: "diffWalletNotice", find: "${(breakEvenPct(true) * 100).toFixed(1)}", replace: "{{breakEven}}" },
  { key: "totalDeducted", find: "${costs.walletCode}", replace: "{{walletCode}}" },
  { key: "totalAdded", find: "${costs.walletCode}", replace: "{{walletCode}}" },
  { key: "confirmBuy", find: "${qty.toLocaleString(LOCALE)}", replace: "{{qty}}" },
  { key: "confirmSell", find: "${qty.toLocaleString(LOCALE)}", replace: "{{qty}}" },
  { key: "breakEvenNotice", find: "${(breakEvenPct(false) * 100).toFixed(2)}", replace: "{{breakEven}}" },
  { key: "advisorTakeProfitMsg", find: "${pct.toFixed(1)}", replace: "{{pct}}" },
  { key: "advisorTakeProfitMsg", find: "${breakEven.toFixed(1)}", replace: "{{breakEven}}" },
  { key: "advisorCutLossMsg", find: "${pct.toFixed(1)}", replace: "{{pct}}" },
  { key: "advisorKeepHoldingMsg", find: "${pct.toFixed(1)}", replace: "{{pct}}" },
  { key: "advisorKeepHoldingMsg", find: "${breakEven.toFixed(1)}", replace: "{{breakEven}}" },
  { key: "advisorGoodPositionMsg", find: "${company.symbol}", replace: "{{symbol}}" },
  { key: "advisorGoodPositionMsg", find: "${holding.quantity.toLocaleString(LOCALE)}", replace: "{{quantity}}" },
  { key: "advisorWatchMsg", find: "${priceText(company.price)}", replace: "{{price}}" },
  { key: "advisorWatchMsg", find: "${breakEven.toFixed(1)}", replace: "{{breakEven}}" },
  { key: "advisorGoodExitMsg", find: "${topProfitable.symbol}", replace: "{{symbol}}" },
  { key: "advisorGoodExitMsg", find: "${(topProfitable.unrealizedPct * 100).toFixed(1)}", replace: "{{pct}}" },
  { key: "advisorGoodExitMsg", find: "${breakEven.toFixed(1)}", replace: "{{breakEven}}" },
  { key: "advisorRiskMgmtMsg", find: "${topLosing.symbol}", replace: "{{symbol}}" },
  { key: "advisorRiskMgmtMsg", find: "${(topLosing.unrealizedPct * 100).toFixed(1)}", replace: "{{pct}}" },
  { key: "advisorNoBreakEvenMsg", find: "${breakEven.toFixed(1)}", replace: "{{breakEven}}" }
];

for (const dir of dirs) {
  const filePath = path.join(localesDir, dir, "translation.json");
  if (!fs.existsSync(filePath)) continue;
  let text = fs.readFileSync(filePath, "utf8");
  
  for (const r of replacements) {
    // Escape string for regex
    const escapedFind = r.find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedFind, "g");
    text = text.replace(regex, r.replace);
  }
  
  fs.writeFileSync(filePath, text);
  console.log(`Updated ${dir}/translation.json`);
}
