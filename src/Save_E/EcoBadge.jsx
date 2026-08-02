/**
 * Huy hiệu của chế độ Bảo vệ môi trường.
 *
 * CỐ Ý KHÔNG ghi "CARBON NEUTRAL": đó là tuyên bố khẳng định toàn bộ phát thải
 * của dịch vụ đã được kiểm kê và bù trừ về 0, có đơn vị xác minh cấp chứng chỉ.
 * Hugo Studio chưa có kiểm kê nào, dán chữ đó lên là quảng cáo sai và phá luôn
 * độ tin cậy của phần số liệu có dẫn nguồn ngay bên dưới. Khi nào có chứng chỉ
 * thật thì truyền `label` và `issuer` vào.
 */
export default function EcoBadge({ label = "Tiết kiệm năng lượng", issuer = "", size = "md" }) {
  const compact = size === "sm";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: compact ? 7 : 9,
        maxWidth: "100%",
        padding: compact ? "5px 12px 5px 6px" : "7px 16px 7px 8px",
        border: "1px solid hsl(142 45% 45% / 0.4)",
        borderRadius: 999,
        background: "hsl(142 55% 45% / 0.12)",
        color: "hsl(142 60% 42%)",
        whiteSpace: "nowrap",
      }}
    >
      {/* Chiếc lá tròn trịa, bo hết góc — vẽ tay, không mượn biểu trưng của bất
          kỳ tổ chức chứng nhận nào. */}
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: compact ? 22 : 26,
          height: compact ? 22 : 26,
          borderRadius: "50%",
          background: "hsl(142 55% 42%)",
          color: "#ffffff",
          flexShrink: 0,
        }}
      >
        <svg width={compact ? 13 : 15} height={compact ? 13 : 15} viewBox="0 0 24 24" role="img" aria-label="">
          <path
            d="M19.5 4.5c.6 7.4-2.9 13.8-8.6 14.4-3.4.4-6.2-1.6-6.6-4.7-.6-4.8 3.4-8.6 15.2-9.7Z"
            fill="currentColor"
          />
          <path
            d="M5 20c1.6-3.4 4.3-6 7.8-7.6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
          />
        </svg>
      </span>

      <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.2, minWidth: 0 }}>
        <strong
          style={{
            fontSize: compact ? 12 : 13.5,
            fontWeight: 700,
            letterSpacing: "0.01em",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {label}
        </strong>
        {issuer ? (
          <small style={{ fontSize: 10.5, opacity: 0.8 }}>Chứng nhận bởi {issuer}</small>
        ) : null}
      </span>
    </span>
  );
}
