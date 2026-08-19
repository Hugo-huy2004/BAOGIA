import fs from "fs";

const jsxPath = "src/components/member/invest/HugoInvestTab.jsx";
let content = fs.readFileSync(jsxPath, "utf8");

const replacements = [
  // company.sector and company.name
  { match: ">{company.sector}<", replace: ">{t(`invest.companies.${company.symbol}.sector`, company.sector)}<" },
  { match: ">{company.name}<", replace: ">{t(`invest.companies.${company.symbol}.name`, company.name)}<" },
  // 30 nến -> 30 candles
  { match: "30 nến", replace: "30 candles" }, // wait, I will use t("invest.ui.30candles", "30 nến")
  { match: ">{buy \\? \"Mua\" : \"Bán\"}", replace: ">{buy ? t('invest.ui.buy', 'Mua') : t('invest.ui.sell', 'Bán')}" },
  { match: ">{trade.side === \"buy\" \\? \"Mua\" : \"Bán\"}", replace: ">{trade.side === \"buy\" ? t('invest.ui.buy', 'Mua') : t('invest.ui.sell', 'Bán')}" },
  { match: "Bảng giá", replace: "Market" },
  { match: "Danh mục", replace: "Portfolio" },
  { match: "Giáo trình", replace: "Lessons" },
  { match: "Sàn ảo Hugo", replace: "Hugo Invest Market" },
];

// For exact string replacements
replacements.forEach(rep => {
  if (rep.match === "30 nến") {
    content = content.replace(/>30 nến</g, ">{t('invest.ui.30candles', '30 nến')}<");
  } else if (rep.match === "Bảng giá") {
    content = content.replace(/>Bảng giá</g, ">{t('invest.ui.marketTab', 'Bảng giá')}<");
  } else if (rep.match === "Danh mục") {
    content = content.replace(/>Danh mục</g, ">{t('invest.ui.portfolioTab', 'Danh mục')}<");
  } else if (rep.match === "Giáo trình") {
    content = content.replace(/>Giáo trình</g, ">{t('invest.ui.lessonsTab', 'Giáo trình')}<");
  } else if (rep.match === "Sàn ảo Hugo") {
    content = content.replace(/>Sàn ảo Hugo</g, ">{t('invest.ui.marketTitle', 'Sàn ảo Hugo')}<");
  } else {
    content = content.replace(new RegExp(rep.match, "g"), rep.replace);
  }
});

// For complex ones like `company.sector`
content = content.replace(/\{company\.sector\}/g, "{t(`invest.sector.${company.symbol}`, company.sector)}");
content = content.replace(/\{company\.name\}/g, "{t(`invest.name.${company.symbol}`, company.name)}");

fs.writeFileSync(jsxPath, content, "utf8");

console.log("JSX patched round 2");
