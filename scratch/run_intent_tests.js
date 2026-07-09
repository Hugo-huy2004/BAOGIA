import fs from 'fs';
import path from 'path';

// Mock localStorage for node execution
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
};

let code = fs.readFileSync('./src/components/member/banhocduong/constants/intentClassifier.js', 'utf8');

// Replace relative imports to support node ESM resolution
code = code.replace('import { matchTherapyMethod } from "./therapyMethods";', 'import { matchTherapyMethod } from "../src/components/member/banhocduong/constants/therapyMethods.js";');
code = code.replace('import { loadSecureMemory, saveSecureMemory, updateMemoryFromText } from "../utils/secureMemory";', 'import { loadSecureMemory, saveSecureMemory, updateMemoryFromText } from "../src/components/member/banhocduong/utils/secureMemory.js";');

// Inject console.logs into matching steps for diagnostic
code = code.replace(
  'if (rule.regex.test(cleanText)) {',
  'if (rule.regex.test(cleanText)) { console.log("Matched regex rule:", rule.id);'
);

code = code.replace(
  'if (results.length > 0 && results[0].score < 0.50) {',
  'if (results.length > 0 && results[0].score < 0.50) { console.log("Fuse search results:", results.slice(0, 3));'
);

code = code.replace(
  'if (score > highestScore) {',
  'if (score > highestScore) { console.log("Dice loop updating highestScore:", score, "for intent:", item.intent.id);'
);

// Write to temporary test runner
fs.writeFileSync('./scratch/temp_runner.js', code);

// Now import the runner and evaluate
const { findMatchingIntent } = await import('./temp_runner.js');

const bio = { displayName: "HUY" };
const historyLogs = [];

const testCases = [
  "Tôi sẽ được đi chơi",
  "Không",
  "Mai tôi đi Đà Lạt ấy"
];

for (const text of testCases) {
  console.log(`\n--- Testing: "${text}" ---`);
  const matched = findMatchingIntent(text, bio, historyLogs);
  console.log("Matched Intent ID:", matched?.id);
}
