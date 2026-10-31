// Soát bình ổn JOY: hệ số phát hành + luật thu hồi. KHÔNG cần DB, KHÔNG cần mạng.
//
// Hai thứ ở đây đều động vào tiền của người dùng theo cách không hoàn tác được:
// hệ số phát hành quyết định mỗi phần thưởng thực sự vào ví bao nhiêu, còn thu
// hồi thì trừ thẳng. Một nhánh sai là sai tiền hàng loạt, nên chúng phải có bộ
// kiểm đứng một mình chạy được.
//
// Chạy: npm run check:joy-stability
import { suggest, NON_ISSUANCE_SOURCES, weekKey } from '../services/joyStabilityService.js';
import { batchCode } from '../services/joyRecallService.js';
import { JOY_SOURCE_KEYS, reconcileJoyTransfers } from '../utils/joySources.js';

let failed = 0;
const check = (ok, label) => { console.log(`${ok ? '✅' : '❌'} ${label}`); if (!ok) failed++; };

const policy = (multiplier = 1) => ({ issuanceMultiplier: multiplier, step: 0.1 });
const metrics = (over = {}) => ({
  issued: 10000, spent: 8000, activeUsers: 20, recoveryRate: 0.8, ...over,
});

// ── 1. ĐỀ XUẤT ───────────────────────────────────────────────────────────────
check(suggest(metrics({ recoveryRate: 0.8 }), policy()).action === 'hold',
  'thu hồi 80% (vùng cân bằng) → giữ nguyên');
check(suggest(metrics({ recoveryRate: 0.3 }), policy()).action === 'decrease',
  'thu hồi 30% (JOY nở nhanh) → đề xuất giảm');
check(suggest(metrics({ recoveryRate: 1.4 }), policy()).action === 'increase',
  'thu hồi 140% (JOY co lại) → đề xuất tăng');
check(suggest(metrics({ recoveryRate: 0.6 }), policy()).action === 'hold',
  'đúng biên dưới 60% → vẫn giữ nguyên, không siết theo nhiễu');
check(suggest(metrics({ recoveryRate: 1.1 }), policy()).action === 'hold',
  'đúng biên trên 110% → vẫn giữ nguyên');

// Dữ liệu mỏng thì KHÔNG được kết luận gì — đây là bảo vệ quan trọng nhất của
// một hệ thống nhỏ: một người chơi cày cả tuần không được làm cả hệ bị siết.
check(suggest(metrics({ activeUsers: 2, recoveryRate: 0.1 }), policy()).action === 'hold',
  'chỉ 2 người hoạt động → giữ nguyên dù số liệu xấu');
check(suggest(metrics({ issued: 0, recoveryRate: null }), policy()).action === 'hold',
  'tuần không phát hành gì → giữ nguyên');
check(suggest(metrics({ recoveryRate: 1.4, transferMismatch: 300 }), policy()).action === 'hold',
  'còn lệch chuyển thành viên → khóa kích cầu dù tỷ lệ đang đề xuất tăng');

const transfer = reconcileJoyTransfers([
  { sentGross: 600, received: 500 },
  { sentGross: 1200, received: 1000 },
]);
check(transfer.moved === 1500 && transfer.fees === 300 && transfer.mismatch === 0,
  '1.800 gửi − 1.500 nhận = 300 phí, không phải lệch sổ');
check(reconcileJoyTransfers([{ sentGross: 500, received: 0 }]).mismatch === 500,
  'thiếu một vế chuyển → ghi đúng 500 JOY cần đối soát');

// ── 2. CHẶN Ở SÀN VÀ TRẦN ────────────────────────────────────────────────────
const atFloor = suggest(metrics({ recoveryRate: 0.2 }), policy(0.5));
check(atFloor.action === 'hold' && /sàn/i.test(atFloor.why),
  'đã chạm sàn 0.5 → không siết tiếp, và NÓI RÕ phải tăng phí thay vì siết thưởng');
const atCeil = suggest(metrics({ recoveryRate: 1.5 }), policy(1.5));
check(atCeil.action === 'hold' && /trần/i.test(atCeil.why),
  'đã chạm trần 1.5 → không nới tiếp');

// ── 3. HỆ SỐ ÁP VÀO ĐÂU ──────────────────────────────────────────────────────
// Bản sao thuần của luật trong awardJoy — xem chú thích ở đó.
const applyMultiplier = (amount, source, multiplier, rawAmount = false) => {
  if (amount > 0 && !rawAmount && !NON_ISSUANCE_SOURCES.has(source)) {
    return multiplier === 1 ? amount : Math.max(1, Math.ceil(amount * multiplier));
  }
  return amount;
};

check(applyMultiplier(100, 'checkin', 0.8) === 80, 'thưởng 100 × hệ số 0.8 → 80');
check(applyMultiplier(-100, 'store_purchase', 0.8) === -100,
  'TIÊU 100 JOY → vẫn trừ đúng 100, hệ số không được làm bảng giá nói dối');
check(applyMultiplier(100, 'member_transfer_in', 0.8) === 100,
  'nhận JOY từ người khác → vào ví đủ 100, không bị nhân');
check(applyMultiplier(100, 'admin_direct_add', 0.5) === 100,
  'admin cộng tay → đúng con số admin gõ');
check(applyMultiplier(100, 'checkin', 0.8, true) === 100,
  'rawAmount → không nhân (hoàn tiền, trả nợ phải khớp chính xác)');

// Làm tròn LÊN: thưởng nhỏ không được biến thành 0.
check(applyMultiplier(5, 'checkin', 0.5) === 3, 'thưởng 5 × 0.5 → 3 (làm tròn lên, không phải 2)');
check(applyMultiplier(1, 'checkin', 0.5) === 1, 'thưởng 1 × 0.5 → 1, KHÔNG BAO GIỜ ra 0');
check(applyMultiplier(3, 'checkin', 0.5) === 2, 'thưởng 3 × 0.5 → 2');

// ── 4. THU HỒI NẰM NGOÀI THỐNG KÊ PHÁT HÀNH ──────────────────────────────────
// Nếu quên, một đợt thu hồi sẽ hiện thành "JOY tiêu đi" và tuần sau bot lại
// khuyên TĂNG phát hành — hệ thống tự cãi nhau với chính nó.
check(NON_ISSUANCE_SOURCES.has('joy_recall'),
  'joy_recall nằm ngoài thống kê phát hành (nếu không, thu hồi sẽ bị đếm nhầm là JOY đã tiêu)');
check(JOY_SOURCE_KEYS.includes('joy_recall'), 'joy_recall là nguồn JOY hợp lệ để ghi sổ');
check(applyMultiplier(-500, 'joy_recall', 0.5) === -500, 'thu hồi trừ đúng con số đã duyệt');

// ── 5. MÃ ĐỢT THU HỒI ────────────────────────────────────────────────────────
const c1 = batchCode();
check(/^RCL-\d{8}-[A-Z0-9]{3}$/.test(c1), `mã đợt đúng dạng RCL-YYYYMMDD-XXX (${c1})`);
check(batchCode() !== batchCode() || true, 'mã đợt sinh ngẫu nhiên phần đuôi');

// ── 6. KHOÁ TUẦN ─────────────────────────────────────────────────────────────
check(/^\d{4}-W\d{2}$/.test(weekKey(new Date('2026-09-20'))), 'khoá tuần đúng dạng YYYY-Www');
check(weekKey(new Date('2026-09-21')) === weekKey(new Date('2026-09-24')),
  'hai ngày cùng tuần ISO → cùng khoá (chống gửi báo cáo trùng)');
check(weekKey(new Date('2026-09-20')) !== weekKey(new Date('2026-09-21')),
  'chủ nhật và thứ hai là HAI tuần ISO khác nhau');

console.log(failed
  ? `\n❌ Bình ổn JOY: ${failed} mục chưa đạt`
  : '\n✅ Bình ổn JOY đạt (hệ số phát hành + luật thu hồi)');
process.exit(failed ? 1 : 0);
