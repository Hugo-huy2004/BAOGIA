import fs from "node:fs";
import { profileSkills } from "../apps/web/src/data/profileSkills.js";

const file = new URL("../apps/web/public/cv/index.html", import.meta.url);
const escape = (value) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
let html = fs.readFileSync(file, "utf8");
for (const language of ["vi", "en", "zh"]) {
  const block = profileSkills.map((group) =>
    `<div class="skill-group"><h3>${escape(group.title[language])}</h3>` +
    group.lines.map((line) => `<p class="skill-line">${escape(line)}</p>`).join("") +
    `<p class="skill-context">${escape(group.note[language])}</p></div>`,
  ).join("\n        ");
  const pattern = new RegExp(`<!-- skills:${language}:start -->[\\s\\S]*?<!-- skills:${language}:end -->`);
  if (!pattern.test(html)) throw new Error(`Missing CV skills marker: ${language}`);
  html = html.replace(pattern, `<!-- skills:${language}:start -->\n        ${block}\n        <!-- skills:${language}:end -->`);
}
fs.writeFileSync(file, html);
