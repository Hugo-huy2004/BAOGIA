const fs = require("fs");

let lessonsStr = fs.readFileSync("src/components/member/invest/investLessons.js", "utf8");
lessonsStr = lessonsStr.replace(/export\s+const\s+LESSONS\s*=\s*/, "return ");
const getLessons = new Function(lessonsStr);
const LESSONS = getLessons();

let investTabStr = fs.readFileSync("src/components/member/invest/HugoInvestTab.jsx", "utf8");
let dictMatch = investTabStr.match(/export const INVEST_HELP_DICTIONARY = (\{[\s\S]*?\n\});/);
let dictStr = "return " + dictMatch[1];
const getDict = new Function(dictStr);
const INVEST_HELP_DICTIONARY = getDict();

const investVi = {
  lessons: {},
  dictionary: {}
};

LESSONS.forEach(lesson => {
  investVi.lessons[lesson.id] = {
    title: lesson.title,
    summary: lesson.summary,
    body: lesson.body
  };
});

Object.entries(INVEST_HELP_DICTIONARY).forEach(([key, val]) => {
  investVi.dictionary[key] = {
    title: val.title,
    badge: val.badge,
    summary: val.summary,
    details: val.details,
    example: val.example
  };
});

fs.writeFileSync("invest_vi.json", JSON.stringify({ invest: investVi }, null, 2), "utf8");
console.log("Done");
