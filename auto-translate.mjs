import fs from "fs";

const languages = ["zh", "ja", "ko", "th", "es", "fr", "id"];
const localesDir = "src/i18n/locales";

// Read English as source
const enData = JSON.parse(fs.readFileSync(`${localesDir}/en/translation.json`, "utf8"));
const investEn = enData.invest;

async function translateText(text, targetLang) {
  if (!text) return text;
  
  // Quick fix for zh, Google Translate expects zh-CN or zh-TW
  let lang = targetLang;
  if (lang === "zh") lang = "zh-CN";

  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${lang}&dt=t&q=${encodeURIComponent(text)}`;
  
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      let translated = "";
      for (const segment of data[0]) {
        if (segment[0]) translated += segment[0];
      }
      return translated;
    } catch (e) {
      console.log(`Error translating "${text.substring(0,20)}..." to ${lang}. Attempt ${attempt}`);
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
  return text; // fallback to English
}

async function translateObject(obj, targetLang) {
  const result = {};
  for (const [key, val] of Object.entries(obj)) {
    if (typeof val === "string") {
      result[key] = await translateText(val, targetLang);
      // throttle
      await new Promise(r => setTimeout(r, 200));
    } else if (Array.isArray(val)) {
      result[key] = [];
      for (const item of val) {
        if (typeof item === "string") {
          result[key].push(await translateText(item, targetLang));
          await new Promise(r => setTimeout(r, 200));
        } else {
          result[key].push(item);
        }
      }
    } else if (typeof val === "object" && val !== null) {
      result[key] = await translateObject(val, targetLang);
    } else {
      result[key] = val;
    }
  }
  return result;
}

async function main() {
  for (const lang of languages) {
    console.log(`Translating to ${lang}...`);
    const filePath = `${localesDir}/${lang}/translation.json`;
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    
    // We already have investEn, let's translate it
    const translatedInvest = await translateObject(investEn, lang);
    
    data.invest = translatedInvest;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
    console.log(`Finished ${lang}`);
  }
  console.log("All done!");
}

main();
