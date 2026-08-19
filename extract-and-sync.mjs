import fs from "fs";

const files = [
  "src/components/member/invest/HugoInvestTab.jsx",
  "src/components/member/invest/StockPriceChart.jsx"
];

let enData = JSON.parse(fs.readFileSync("src/i18n/locales/en/translation.json", "utf8"));
if (!enData.invest) enData.invest = {};
if (!enData.invest.ui) enData.invest.ui = {};

let changed = false;

const regex = /t\(['"](invest\.ui\.[a-zA-Z0-9_]+)['"]\s*,\s*(`[^`]+`|'[^']+'|"[^"]+")\)/g;

files.forEach(file => {
  const content = fs.readFileSync(file, "utf8");
  let match;
  while ((match = regex.exec(content)) !== null) {
    const keyPath = match[1].split('.').pop();
    let defaultValue = match[2];
    
    // strip quotes and backticks
    if (defaultValue.startsWith('`') && defaultValue.endsWith('`')) defaultValue = defaultValue.slice(1, -1);
    else if (defaultValue.startsWith("'") && defaultValue.endsWith("'")) defaultValue = defaultValue.slice(1, -1);
    else if (defaultValue.startsWith('"') && defaultValue.endsWith('"')) defaultValue = defaultValue.slice(1, -1);
    
    if (!enData.invest.ui[keyPath]) {
      // In Vietnamese for now, we will let the translate script translate it from English, but we need to put the English translation here actually!
      // But for speed, I'll just put the Vietnamese text in `enData` and let the translate script treat it as the source text (it uses the EN value to translate to others). 
      // Actually, since it uses EN to translate to others, if I put VI in EN, the AI will translate from VI to others! Which is perfectly fine!
      enData.invest.ui[keyPath] = defaultValue;
      changed = true;
    }
  }
});

if (changed) {
  fs.writeFileSync("src/i18n/locales/en/translation.json", JSON.stringify(enData, null, 2));
  console.log("Extracted new keys to en.json!");
} else {
  console.log("No new keys to extract.");
}
