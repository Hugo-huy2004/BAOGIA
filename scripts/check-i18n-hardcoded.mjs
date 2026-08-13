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
// Course material, admin-only screens and demo fixtures are Vietnamese by
// design; they are not part of the member-facing translation surface.
const EXCLUDED = /node_modules|\/locales\/|\/admin\/|\/demos\/|hugoCoder\/lessons\/|hugoSOCourses|studyCurriculum|ideData|intentClassifier|clinicalTests/;

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
