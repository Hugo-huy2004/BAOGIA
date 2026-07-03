// Vietnam crisis hotlines shown whenever self-harm risk is detected. These are
// established, free, national lines — always correct, so they display
// unconditionally (unlike a site-specific number that could be misconfigured).
// An admin-set line via VITE_CRISIS_HOTLINE is shown IN ADDITION, never instead.
export const DEFAULT_HOTLINES = [
  { label: "Tổng đài Quốc gia Bảo vệ Trẻ em", number: "111", note: "Miễn phí, 24/7" },
  { label: "Ngày Mai — Phòng chống tự tử", number: "0963061414", display: "096 306 1414" },
  { label: "Cấp cứu y tế", number: "115", note: "Nguy hiểm tức thời" },
];

// Single-line text form for the AI/local-fallback crisis reply.
export const CRISIS_HOTLINE_TEXT =
  "Nếu cậu đang có ý nghĩ làm hại bản thân, hãy liên hệ NGAY: " +
  "Tổng đài 111 (bảo vệ trẻ em, 24/7), Ngày Mai 096 306 1414, " +
  "hoặc 115 nếu đang nguy hiểm tức thời. Cậu không hề một mình.";
