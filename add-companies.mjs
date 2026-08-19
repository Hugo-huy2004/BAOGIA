import fs from "fs";
import { COMPANIES } from "./server/services/stockMarket.js";

const enFile = "src/i18n/locales/en/translation.json";
const enData = JSON.parse(fs.readFileSync(enFile, "utf8"));

if (!enData.invest) enData.invest = {};
if (!enData.invest.companies) enData.invest.companies = {};

let changed = false;

COMPANIES.forEach(company => {
  if (!enData.invest.companies[company.symbol]) {
    enData.invest.companies[company.symbol] = {};
  }
  
  if (!enData.invest.companies[company.symbol].name) {
    enData.invest.companies[company.symbol].name = company.name;
    changed = true;
  }
  
  if (!enData.invest.companies[company.symbol].sector) {
    enData.invest.companies[company.symbol].sector = company.sector;
    changed = true;
  }
  
  if (!enData.invest.companies[company.symbol].description) {
    enData.invest.companies[company.symbol].description = company.description;
    changed = true;
  }
});

if (changed) {
  fs.writeFileSync(enFile, JSON.stringify(enData, null, 2), "utf8");
  console.log("Added companies to translation.json");
} else {
  console.log("Companies already exist in translation.json");
}

// Now replace company.description in JSX
const jsxPath = "src/components/member/invest/HugoInvestTab.jsx";
let content = fs.readFileSync(jsxPath, "utf8");
content = content.replace(/{company\.description}/g, '{t(`invest.companies.${company.symbol}.description`, company.description)}');
fs.writeFileSync(jsxPath, content, "utf8");
console.log("Patched company.description in JSX");

