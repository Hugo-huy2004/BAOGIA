/**
 * SỐ ĐẾM HÁN VIỆT — đọc số theo lối văn thư triều đình.
 * ============================================================================
 *
 *   45      → tứ thập ngũ
 *   30      → tam thập
 *   52.000  → ngũ vạn nhị thiên
 *   190.895 → thập cửu vạn linh bát bách cửu thập ngũ
 *
 * ── VÌ SAO LUÔN KÈM SỐ Ả RẬP TRONG NGOẶC ────────────────────────────────────
 * Một bản chiếu viết "tứ thập ngũ nhật" là đẹp, nhưng người đọc cần biết ngay
 * đó là bao nhiêu ngày mà không phải dịch trong đầu. Văn thư triều đình xưa
 * cũng làm đúng vậy: chữ số viết bằng chữ, rồi ghi lại bằng số để đối chiếu,
 * vì chữ thì khó sửa còn số thì dễ đọc. Ở đây giữ cả hai với cùng lý do.
 *
 * ── LUẬT ĐỌC ────────────────────────────────────────────────────────────────
 * Đọc theo nhóm VẠN (10⁴) như Hán văn, không theo nhóm nghìn như lối Tây:
 *   · trong mỗi nhóm bốn chữ số: thiên – bách – thập – đơn vị
 *   · 10–19 đọc "thập", không đọc "nhất thập" (十五 = thập ngũ)
 *   · số 0 ở giữa đọc "linh" MỘT lần, dù có liền mấy số 0
 *   · số 0 ở cuối thì im lặng (二千 = nhị thiên, không phải "nhị thiên linh")
 */

const DIGITS = ["linh", "nhất", "nhị", "tam", "tứ", "ngũ", "lục", "thất", "bát", "cửu"];
const PLACES = ["", "thập", "bách", "thiên"];

/** Đọc một nhóm 4 chữ số (1–9999). */
function readGroup(value) {
  const parts = [];
  const digits = String(value).padStart(4, "0").split("").map(Number);
  let pendingZero = false;

  digits.forEach((digit, index) => {
    const place = PLACES[3 - index];
    if (digit === 0) {
      // Chỉ ghi nhận CÓ số 0, chưa đọc ngay: còn phải biết phía sau có chữ số
      // khác không. "2000" không đọc "nhị thiên linh".
      if (parts.length) pendingZero = true;
      return;
    }
    if (pendingZero) { parts.push("linh"); pendingZero = false; }
    // 10–19: 十五 đọc "thập ngũ", không đọc "nhất thập ngũ".
    if (digit === 1 && place === "thập" && !parts.length) parts.push("thập");
    else parts.push(place ? `${DIGITS[digit]} ${place}` : DIGITS[digit]);
  });

  return parts.join(" ");
}

/**
 * Số → chữ Hán Việt. Trả chuỗi rỗng cho đầu vào không hợp lệ, KHÔNG ném lỗi:
 * một thông báo không được chết vì con số trong nó.
 */
export function sino(value) {
  const n = Math.trunc(Number(value));
  if (!Number.isFinite(n)) return "";
  if (n === 0) return "không";
  if (n < 0) return `âm ${sino(-n)}`;

  // Tách theo nhóm VẠN, từ lớn xuống nhỏ.
  const SCALES = [
    [100000000, "ức"],   // 10⁸ — theo lối Hán văn, ức đứng trên vạn
    [10000, "vạn"],
  ];
  for (const [scale, label] of SCALES) {
    if (n >= scale) {
      const high = Math.floor(n / scale);
      const low = n % scale;
      const head = `${sino(high)} ${label}`;
      if (!low) return head;
      // Phần dư nhỏ hơn 1/10 bậc trên thì phải chêm "linh": 190.895 đọc
      // "thập cửu vạn LINH bát bách…" vì hàng thiên bỏ trống.
      const needsLinh = low < scale / 10;
      return `${head} ${needsLinh ? "linh " : ""}${sino(low)}`;
    }
  }
  return readGroup(n);
}

/** "tứ thập ngũ (45)" — chữ trước, số sau, đúng lối văn thư đối chiếu. */
export const sinoWithDigits = (value, locale = "vi-VN") =>
  `${sino(value)} (${Number(value || 0).toLocaleString(locale)})`;

/** Đơn vị đếm quen dùng trong văn thư: nhật (ngày), nguyệt (tháng), niên (năm). */
export const sinoDays = (n, locale) => `${sino(n)} nhật (${Number(n || 0).toLocaleString(locale)} ngày)`;
export const sinoMonths = (n, locale) => `${sino(n)} nguyệt (${Number(n || 0).toLocaleString(locale)} tháng)`;

export default { sino, sinoWithDigits, sinoDays };
