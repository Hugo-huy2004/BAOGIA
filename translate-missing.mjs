import fs from "fs";

const localesDir = "src/i18n/locales";
const languages = ["vi", "zh", "ja", "ko", "th", "es", "fr", "id"];

const enData = JSON.parse(fs.readFileSync(`${localesDir}/en/translation.json`, "utf8"));

// Deep merge with missing key tracking
function collectMissing(sourceObj, targetObj, path = "", missingList = []) {
  for (const key of Object.keys(sourceObj)) {
    const newPath = path ? `${path}.${key}` : key;
    if (typeof sourceObj[key] === "object" && sourceObj[key] !== null && !Array.isArray(sourceObj[key])) {
      if (!targetObj[key] || typeof targetObj[key] !== "object") {
        targetObj[key] = {};
      }
      collectMissing(sourceObj[key], targetObj[key], newPath, missingList);
    } else {
      if (targetObj[key] === undefined) {
        missingList.push({ path: newPath, text: sourceObj[key], parent: targetObj, key });
      }
    }
  }
  return missingList;
}

async function translateText(text, targetLang) {
  if (!text) return text;
  if (typeof text !== "string") return text;
  
  let lang = targetLang;
  if (lang === "zh") lang = "zh-CN";

  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${lang}&dt=t&q=${encodeURIComponent(text)}`;
  
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        if (res.status === 429) {
          await new Promise(r => setTimeout(r, 2000 * attempt));
          continue;
        }
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      let translated = "";
      for (const segment of data[0]) {
        if (segment[0]) translated += segment[0];
      }
      return translated;
    } catch (e) {
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
  return text; // fallback to english
}

async function processMissingForLang(lang) {
  console.log(`Processing ${lang}...`);
  const filePath = `${localesDir}/${lang}/translation.json`;
  let targetData = {};
  if (fs.existsSync(filePath)) {
    targetData = JSON.parse(fs.readFileSync(filePath, "utf8"));
  }

  const missing = collectMissing(enData, targetData);
  console.log(`- Missing ${missing.length} keys for ${lang}`);

  if (missing.length === 0) return;

  // Process in batches
  const batchSize = 10;
  for (let i = 0; i < missing.length; i += batchSize) {
    const batch = missing.slice(i, i + batchSize);
    await Promise.all(batch.map(async (item) => {
      if (typeof item.text === "string") {
         item.parent[item.key] = await translateText(item.text, lang);
      } else if (Array.isArray(item.text)) {
         // handle array
         item.parent[item.key] = await Promise.all(item.text.map(t => typeof t === "string" ? translateText(t, lang) : t));
      } else {
         item.parent[item.key] = item.text;
      }
    }));
    // small delay between batches
    await new Promise(r => setTimeout(r, 200));
  }

  fs.writeFileSync(filePath, JSON.stringify(targetData, null, 2), "utf8");
  console.log(`- Finished ${lang}`);
}

async function main() {
  for (const lang of languages) {
    await processMissingForLang(lang);
  }
  console.log("All missing keys translated and synced!");
}

main();
