// Test script to diagnose the intent matching bug
import { findMatchingIntent } from "../src/components/member/banhocduong/constants/intentClassifier.js";

const bio = { displayName: "HUY" };
const historyLogs = [];

const text1 = "Ngày hôm nay chán lắm, mưa suốt không có gì chơi";
const matched1 = findMatchingIntent(text1, bio, historyLogs);
console.log(`\nText: "${text1}"`);
console.log("Matched Intent ID:", matched1?.id);
console.log("Matched Response:", matched1?.reply);

const text2 = "Không";
const matched2 = findMatchingIntent(text2, bio, historyLogs);
console.log(`\nText: "${text2}"`);
console.log("Matched Intent ID:", matched2?.id);
console.log("Matched Response:", matched2?.reply);
