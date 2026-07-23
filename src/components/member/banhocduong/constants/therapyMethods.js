/**
 * Lightweight metadata mirror of TherapyTab.jsx's ALL_METHODS, kept
 * deliberately separate from that file — it has heavy UI-only fields (Icon
 * components, gradients) that have no business being imported into the
 * chat-intent matching logic. `id`/`lockKey`/`cost` here MUST stay in sync
 * with TherapyTab.jsx's ALL_METHODS if either changes.
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
  { id: "depression", lockKey: "depression", name: "CBT Worksheet & Lộ Trình", cost: 150, joyLockable: true,
    keywords: ["cbt", "worksheet", "tri lieu tram cam", "bang ghi suy nghi", "lieu phap nhan thuc"] },
  { id: "writing", lockKey: "writing", name: "Viết Cảm Xúc", cost: 150, joyLockable: true,
    keywords: ["viet cam xuc", "viet tu do", "viet tri lieu", "viet nhat ky", "viet giam stress"] },
  { id: "exercise", lockKey: "exercise", name: "Vận Động Nhẹ", cost: 150, joyLockable: true,
    keywords: ["van dong nhe", "tap the duc", "tap luyen", "giai phong endorphin", "giam stress bang van dong"] },
  { id: "social", lockKey: "social", name: "Kết Nối Xã Hội", cost: 150, joyLockable: true,
    keywords: ["ket noi xa hoi", "ket noi ban be", "giao tiep", "ho tro xa hoi", "giam tram cam"] },
];

/** Returns the first THERAPY_METHODS entry whose keyword appears in de-accented `cleanText`, or null. */
export function matchTherapyMethod(cleanText) {
  for (const method of THERAPY_METHODS) {
    if (method.keywords.some(kw => cleanText.includes(kw))) return method;
  }
  return null;
}
