// Soát bộ đọc số Hán Việt. Không cần DB, không cần mạng.
//
// Số đọc sai trong một bản chiếu là loại lỗi tệ nhất của cả hệ giọng văn này:
// mục đích của nó là để người dùng gặp lại lối đếm của người Việt xưa, nên dạy
// sai còn tệ hơn không dạy. Và không ai báo lỗi — người đọc chỉ ngầm tin.
//
// Chạy: npm run check:sino
import { sino, sinoWithDigits, sinoDays } from '../../shared/sinoNumerals.js';

let failed = 0;
const check = (ok, label) => { console.log(`${ok ? '✅' : '❌'} ${label}`); if (!ok) failed++; };
const eq = (n, want) => check(sino(n) === want, `${String(n).padStart(9)} → ${want}${sino(n) === want ? '' : `  (ra "${sino(n)}")`}`);

// ── ĐƠN VỊ VÀ HÀNG CHỤC ─────────────────────────────────────────────────────
eq(0, 'không'); eq(1, 'nhất'); eq(5, 'ngũ'); eq(9, 'cửu');
// 十五 đọc "thập ngũ", KHÔNG đọc "nhất thập ngũ" — luật riêng của hàng chục đầu.
eq(10, 'thập'); eq(15, 'thập ngũ'); eq(19, 'thập cửu');
eq(20, 'nhị thập'); eq(30, 'tam thập'); eq(45, 'tứ thập ngũ'); eq(99, 'cửu thập cửu');

// ── HÀNG TRĂM, HÀNG NGHÌN ───────────────────────────────────────────────────
eq(100, 'nhất bách'); eq(110, 'nhất bách nhất thập'); eq(895, 'bát bách cửu thập ngũ');
eq(1000, 'nhất thiên'); eq(2000, 'nhị thiên'); eq(5200, 'ngũ thiên nhị bách');

// Số 0 ở GIỮA đọc "linh" đúng MỘT lần; số 0 ở CUỐI thì im lặng.
eq(101, 'nhất bách linh nhất');
eq(1001, 'nhất thiên linh nhất');
check(!sino(2000).includes('linh'), '2.000 KHÔNG đọc "nhị thiên linh" — số 0 cuối thì im lặng');
check(sino(10001).split('linh').length === 2, '10.001 chỉ chêm "linh" một lần dù có ba số 0 liền');

// ── HÀNG VẠN — lối đếm của người Việt xưa ───────────────────────────────────
eq(10000, 'nhất vạn');
eq(52000, 'ngũ vạn nhị thiên');
eq(190895, 'thập cửu vạn linh bát bách cửu thập ngũ');
eq(474268, 'tứ thập thất vạn tứ thiên nhị bách lục thập bát');
eq(1000000, 'nhất bách vạn');
check(sino(100000000).includes('ức'), '10⁸ đọc theo bậc "ức", trên bậc "vạn"');

// ── ĐẦU VÀO XẤU KHÔNG ĐƯỢC LÀM CHẾT THÔNG BÁO ───────────────────────────────
check(sino(NaN) === '', 'NaN → chuỗi rỗng, không ném lỗi');
check(sino(undefined) === '', 'undefined → chuỗi rỗng');
check(sino(null) === 'không', 'null → "không" (Number(null) là 0)');
check(sino(-45) === 'âm tứ thập ngũ', 'số âm đọc có chữ "âm" dẫn đầu');
check(sino(45.9) === sino(45), 'phần thập phân bị cắt, không làm tròn lên');

// ── DẠNG ĐỐI CHIẾU: CHỮ TRƯỚC, SỐ SAU ───────────────────────────────────────
check(sinoWithDigits(52000) === 'ngũ vạn nhị thiên (52.000)',
  'kèm số Ả Rập trong ngoặc để đối chiếu');
check(sinoDays(45) === 'tứ thập ngũ nhật (45 ngày)',
  'đơn vị đếm nằm TRONG ngoặc cùng chữ số ("nhật" và "ngày" là một)');
check(sinoDays(30) === 'tam thập nhật (30 ngày)', 'tam thập nhật (30 ngày)');

// ── ĐỌC LIÊN TỤC 1–200 KHÔNG SINH CHỮ LẠ ────────────────────────────────────
const VALID = new Set(['không','linh','nhất','nhị','tam','tứ','ngũ','lục','thất','bát','cửu',
  'thập','bách','thiên','vạn','ức','âm']);
let strange = null;
for (let n = 0; n <= 20000 && !strange; n += 1) {
  const words = sino(n).split(' ');
  const bad = words.find((w) => !VALID.has(w));
  if (bad) strange = `${n} sinh chữ lạ "${bad}" trong "${sino(n)}"`;
}
check(!strange, strange || 'đọc suốt 0–20.000 chỉ dùng đúng bộ chữ số Hán Việt, không sinh chữ lạ');

console.log(failed
  ? `\n❌ Số đếm Hán Việt: ${failed} mục chưa đạt`
  : '\n✅ Số đếm Hán Việt đạt — đọc theo bậc vạn, linh đúng chỗ, đầu vào xấu không làm chết thông báo');
process.exit(failed ? 1 : 0);
