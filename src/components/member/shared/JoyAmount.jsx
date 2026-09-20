import { joyParts } from "../../../lib/joyDisplay";

/**
 * Con số JOY với chữ đơn vị "vạn" thu nhỏ.
 *
 * ── VÌ SAO CHỮ ĐƠN VỊ PHẢI NHỎ ──────────────────────────────────────────────
 * "19 vạn 895" viết cùng một cỡ thì mắt đọc thành ba khối ngang hàng nhau và
 * phải dừng lại để hiểu cái nào là số, cái nào là đơn vị. Cho "vạn" nhỏ lại và
 * nhạt đi thì hai con số tự nổi lên trước, còn chữ đơn vị lui về đúng vai trò
 * của nó — giống cách "₫" hay "kg" vẫn luôn nhỏ hơn con số nó đi kèm.
 *
 * Dùng `em` chứ không phải px: thẻ này xuất hiện ở cả số dư to đùng trên đầu
 * ngân khố lẫn huy hiệu nhỏ ở thanh bên, và nó phải co theo chỗ đặt.
 */
export default function JoyAmount({ value, className = "", unitClassName = "" }) {
  return (
    <span className={className}>
      {joyParts(value).map((part, index) => (
        part.unit ? (
          <span
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            className={`text-[0.62em] font-medium opacity-70 ${unitClassName}`}
          >
            {part.text}
          </span>
        ) : (
          // eslint-disable-next-line react/no-array-index-key
          <span key={index}>{part.text}</span>
        )
      ))}
    </span>
  );
}
