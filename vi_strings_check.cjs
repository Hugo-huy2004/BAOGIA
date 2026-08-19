const fs = require("fs");
const content = fs.readFileSync("src/components/member/invest/HugoInvestTab.jsx", "utf8");

const lines = content.split('\n');
const viLines = [];
const regex = /[^\x00-\x7F]+/;

lines.forEach((line, i) => {
  if (regex.test(line)) {
    viLines.push(`${i + 1}: ${line.trim()}`);
  }
});

fs.writeFileSync("vi-strings.txt", viLines.join('\n'));
console.log("Done.");
