// Finds user-facing copy that never reaches i18next: Vietnamese literals
// written straight into components. Those strings stay Vietnamese in every
// language, which is what makes a screen look half-translated.
//
//   node scripts/check-i18n-hardcoded.mjs            # ranked file list
//   node scripts/check-i18n-hardcoded.mjs <path>     # every hit in one file
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const VIETNAMESE = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
// Vietnamese by decision, not by neglect. Counting these as debt keeps the
// number permanently scary and hides the work that is actually left.
//
//  * admin screens and demo fixtures — one operator, Vietnamese is enough;
//  * the HugoCoder curriculum, Study with Hugo courses and HugoPSY content —
//    the author teaches and counsels in Vietnamese, so the copy stays Vietnamese
//    (HugoPSY is already gated to Vietnamese readers in lib/memberAge.js);
//  * the public Privacy Policy and Terms pages — the binding text already
//    exists in nine hand-written languages under Account → Full terms, and
//    machine-translating a legal page is a risk with no upside.
const EXCLUDED = new RegExp([
  "node_modules", "/locales/", "/admin/", "/demos/",
  "hugoCoder/", "hugoSO", "study/", "studyCurriculum", "ideData",
  "banhocduong/", "intentClassifier", "clinicalTests",
  "PrivacyPolicyPage", "TermsPage",
  // Nguồn song ngữ có chủ đích: bản tiếng Việt của tài liệu thành viên và khối
  // tiếng Việt trong bản điều khoản toàn văn 9 ngôn ngữ.
  "memberDocs.js", "legalFullText.js",
].join("|"));

function sourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return EXCLUDED.test(target) ? [] : sourceFiles(target);
    return /\.jsx?$/.test(entry.name) && !entry.name.includes(".test.") && !EXCLUDED.test(target)
      ? [target]
      : [];
  });
}

function hardcodedStrings(file) {
  return fs.readFileSync(file, "utf8").split("\n").flatMap((rawLine, index) => {
    if (/^\s*(\/\/|\*|\/\*)/.test(rawLine)) return [];
    // `t("some.key", "Bản tiếng Việt")` is a fallback, not a leak: the key wins
    // whenever the dictionary has it. Drop those before scanning.
    const line = rawLine.replace(/\bt\(\s*(["'])[\w.-]+\1\s*,\s*(["'`])(?:[^"'`\\]|\\.)*?\2/g, "t(KEY");
    const found = [
      ...[...line.matchAll(/(["'`])((?:[^"'`\\]|\\.){3,120}?)\1/g)].map((match) => match[2]),
      ...[...line.matchAll(/>([^<>{}\n]{4,80})</g)].map((match) => match[1].trim()),
    ].filter((text) => VIETNAMESE.test(text));
    return found.map((text) => ({ line: index + 1, text }));
  });
}

const [target] = process.argv.slice(2);
if (target) {
  hardcodedStrings(target).forEach(({ line, text }) => console.log(`${line}: ${text}`));
  process.exit(0);
}

const counts = sourceFiles("src")
  .map((file) => [file, hardcodedStrings(file).length])
  .filter(([, count]) => count > 0)
  .sort((a, b) => b[1] - a[1]);
const total = counts.reduce((sum, [, count]) => sum + count, 0);
console.log(`${total} hardcoded Vietnamese strings in ${counts.length} files\n`);
counts.forEach(([file, count]) => console.log(String(count).padStart(5), file));
