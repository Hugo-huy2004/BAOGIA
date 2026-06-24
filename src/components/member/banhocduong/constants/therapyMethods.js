/**
 * Lightweight metadata mirror of TherapyTab.jsx's ALL_METHODS (+ the 3
 * always-free panels), kept deliberately separate from that file — it has
 * heavy UI-only fields (Icon components, gradients) that have no business
 * being imported into the chat-intent matching logic. `id`/`lockKey`/`cost`
 * here MUST stay in sync with TherapyTab.jsx's ALL_METHODS if either changes.
 *
 * Used by intentClassifier.js to recognize "tớ muốn tập thiền" style requests
 * in free chat and route them straight to the right therapy panel — or, if
 * locked, to a buy-now prompt — without the member ever switching tabs.
 */
export const THERAPY_METHODS = [
  { id: "breath", lockKey: "breathing", name: "Hít Thở 4-7-8", cost: 150, joyLockable: true,
    keywords: ["hit tho", "tho 4 7 8", "tho sau", "tho cham", "lam diu lo au", "thu gian co"] },
  { id: "soundscape", lockKey: "soundscape", name: "Âm Thanh Thiên Nhiên", cost: 150, joyLockable: true,
    keywords: ["am thanh thien nhien", "tieng mua", "song bien", "lua trai", "nhac thien nhien", "am thanh thu gian"] },
  { id: "reading", lockKey: "reading", name: "Đọc Truyện & Giải Mã Giấc Mơ AI", cost: 150, joyLockable: true,
    keywords: ["doc truyen", "giai ma giac mo", "ke truyen tri lieu", "truyen tri lieu"] },
  { id: "meditation", lockKey: "meditation", name: "Thiền Định Giọng Nói AI", cost: 150, joyLockable: true,
    keywords: ["thien dinh", "ngoi tinh tam", "huong dan thien", "giong doc thien", "tap thien"] },
  { id: "depression", lockKey: "depression", name: "CBT Worksheet & Lộ Trình", cost: 150, joyLockable: true,
    keywords: ["cbt", "worksheet", "tri lieu tram cam", "bang ghi suy nghi", "lieu phap nhan thuc"] },
  { id: "deep_report", lockKey: "deep_report", name: "Báo Cáo Sức Khỏe Tâm Lý Chuyên Sâu", cost: 150, joyLockable: true,
    keywords: ["bao cao chuyen sau", "bao cao tam ly", "ho so gui chuyen gia", "bao cao suc khoe tam ly"] },
  { id: "writing", lockKey: null, name: "Viết Tự Do", cost: 0, joyLockable: false,
    keywords: ["viet tu do", "viet bieu dat cam xuc", "viet ra cam xuc", "nhat ky cam xuc"] },
  { id: "exercise", lockKey: null, name: "Vận Động Nhẹ", cost: 0, joyLockable: false,
    keywords: ["van dong nhe", "tap the duc nhe", "di bo nhe", "van dong co the"] },
  { id: "social", lockKey: null, name: "Kết Nối Xã Hội", cost: 0, joyLockable: false,
    keywords: ["ket noi xa hoi", "goi cho ban be", "tro chuyen voi nguoi than", "ket noi voi ai do"] },
];

/** Returns the first THERAPY_METHODS entry whose keyword appears in de-accented `cleanText`, or null. */
export function matchTherapyMethod(cleanText) {
  for (const method of THERAPY_METHODS) {
    if (method.keywords.some(kw => cleanText.includes(kw))) return method;
  }
  return null;
}
