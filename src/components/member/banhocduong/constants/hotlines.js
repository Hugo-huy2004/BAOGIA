// Vietnam support contacts shown when self-harm risk is detected. Keep this
// centralized so chat replies, banners and safety prompts never drift apart.
export const DEFAULT_HOTLINES = [
  { label: "Tổng đài Quốc gia Bảo vệ Trẻ em", number: "111", note: "Miễn phí, 24/7" },
  { label: "Ngày Mai", number: "+84963061414", display: "+84963061414", note: "13:00–20:30, Thứ Tư–Chủ Nhật" },
  { label: "Cấp cứu y tế", number: "115", note: "Nguy hiểm tức thời" },
];

// Single-line text form for the AI/local-fallback crisis reply.
export const CRISIS_HOTLINE_TEXT =
  "Nếu cậu đang có ý nghĩ làm hại bản thân, hãy liên hệ NGAY: " +
  "Tổng đài 111 (bảo vệ trẻ em, 24/7), Ngày Mai +84963061414 " +
  "(13:00–20:30, Thứ Tư–Chủ Nhật), " +
  "hoặc 115 nếu đang nguy hiểm tức thời. Cậu không hề một mình.";
