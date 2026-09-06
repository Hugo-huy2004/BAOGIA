// "Tung thẻ" giữa các thiết bị cùng tài khoản, qua socket live sẵn có.
// PWA KHÔNG cảm biến được khoảng cách thật (iOS không có Web Bluetooth/NFC, không
// API quét proximity nền), nên "gần nhau" = một thiết bị khác của cùng tài khoản
// đang MỞ app vocab ngay lúc này (ping presence). Vẩy thẻ → gửi qua máy kia.
//
// Bus: PWARealtimeBridge sở hữu socket. Gửi bằng window event "hugo:realtime-send";
// nhận thì bridge phát lại thành "hugo:vocab-presence" / "hugo:vocab-toss".

const NEARBY_TTL = 12000;       // presence cũ hơn 12s coi như máy kia đã tắt
const HEARTBEAT = 4000;

let timer = null;
let refs = 0;
let lastSeen = 0;               // ts presence gần nhất từ THIẾT BỊ KHÁC
const nearbySubs = new Set();
const tossSubs = new Set();

const send = (msg) => window.dispatchEvent(new CustomEvent("hugo:realtime-send", { detail: msg }));
const isNearby = () => Date.now() - lastSeen < NEARBY_TTL;
const emitNearby = () => { const n = isNearby(); nearbySubs.forEach((f) => f(n)); };

const onPresence = () => { lastSeen = Date.now(); emitNearby(); };
const onToss = (e) => { const d = e.detail || {}; if (d.card) tossSubs.forEach((f) => f(d.card, d.from)); };

export function startPresence() {
  refs += 1;
  if (timer) return;
  window.addEventListener("hugo:vocab-presence", onPresence);
  window.addEventListener("hugo:vocab-toss", onToss);
  send({ type: "vocab:presence" });                 // báo mặt ngay
  timer = window.setInterval(() => { send({ type: "vocab:presence" }); emitNearby(); }, HEARTBEAT);
}

export function stopPresence() {
  refs -= 1;
  if (refs > 0) return;
  window.clearInterval(timer); timer = null;
  window.removeEventListener("hugo:vocab-presence", onPresence);
  window.removeEventListener("hugo:vocab-toss", onToss);
  lastSeen = 0;
}

export function subscribeNearby(fn) { nearbySubs.add(fn); fn(isNearby()); return () => nearbySubs.delete(fn); }
export function subscribeToss(fn) { tossSubs.add(fn); return () => tossSubs.delete(fn); }

export function tossCard(card) {
  if (!card) return;
  const s = (v) => (v == null ? undefined : String(v).slice(0, 160));
  send({ type: "vocab:toss", card: {
    hanzi: s(card.hanzi), pinyin: s(card.pinyin), meaning: s(card.meaning), meaningEn: s(card.meaningEn),
    hanViet: s(card.hanViet), example: s(card.example), examplePinyin: s(card.examplePinyin), exampleMeaning: s(card.exampleMeaning),
  } });
}
