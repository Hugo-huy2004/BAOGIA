// Soát chế tài nợ JOYlater. KHÔNG cần DB, KHÔNG cần mạng.
//
// Bậc thang này lấy đi quyền của người dùng và cuối cùng là khoá tài khoản họ.
// Một mốc sai hay một phép so sánh ngược là phạt người không làm gì sai, và
// người bị phạt oan thường không báo — họ chỉ bỏ đi. Nên mọi nhánh phải kiểm
// được mà không cần dựng database.
//
// Chạy: npm run check:joylater-policy
import {
  DEBT_STAGES, RESTRICTIONS, stageFor, nextStage, isRestricted, stageRank,
  REPEAT_SPEEDUP, IGNORE_BELOW,
} from '../../shared/joyLaterPolicy.js';
import { daysOverdueOf } from '../services/joyLaterEnforcement.js';
import { NOTIFICATION_TEXT } from '../../shared/notificationText.js';

let failed = 0;
const check = (ok, label) => { console.log(`${ok ? '✅' : '❌'} ${label}`); if (!ok) failed++; };

const at = (days, over = {}) => stageFor({ daysOverdue: days, outstanding: 500, ...over });

// ── 1. BẬC THANG ĐI ĐÚNG HƯỚNG ───────────────────────────────────────────────
check(at(-1).id === 'ontime', 'chưa tới hạn → không bậc nào');
check(at(0).id === 'grace', 'vừa quá hạn → chỉ nhắc, chưa lấy quyền nào');
check(at(6).id === 'grace', 'ngày thứ 6 → vẫn chỉ nhắc');
check(at(7).id === 'restricted', 'đúng ngày thứ 7 → bắt đầu hạn chế');
check(at(20).id === 'restricted', 'ngày 20 → vẫn ở bậc hạn chế');
check(at(21).id === 'frozen', 'ngày 21 → đóng băng chi tiêu');
check(at(45).id === 'locked', 'ngày 45 → khoá tài khoản có thời hạn');
check(at(90).id === 'review', 'ngày 90 → lập hồ sơ trình quản trị');
check(at(3650).id === 'review', 'mười năm sau vẫn là bậc cuối, không tràn ra ngoài bảng');

// Bậc phải đơn điệu: không bao giờ nhẹ đi khi trễ thêm.
let previous = -1;
for (let d = 0; d <= 200; d += 1) {
  const rank = stageRank(at(d).id);
  if (rank < previous) { check(false, `ngày ${d} nhẹ hơn ngày ${d - 1} — bậc thang đi lùi`); break; }
  previous = rank;
}
check(true, 'suốt 200 ngày, bậc chỉ nặng thêm, không có chỗ nào nhẹ đi');

// ── 2. NỢ QUÁ NHỎ THÌ BỎ QUA ─────────────────────────────────────────────────
// Khoá tài khoản một người vì vài chục JOY là mất cân xứng đến mức lố bịch.
check(at(200, { outstanding: IGNORE_BELOW }).id === 'ontime',
  `nợ đúng ngưỡng ${IGNORE_BELOW} JOY → không chế tài dù trễ 200 ngày`);
check(at(200, { outstanding: IGNORE_BELOW + 1 }).id === 'review',
  'trên ngưỡng một JOY → mới vào bậc thang');
check(at(200, { outstanding: 0 }).id === 'ontime', 'không nợ → không bậc nào');

// ── 3. TÁI PHẠM LEO NHANH GẤP ĐÔI ────────────────────────────────────────────
const repeat = (d) => stageFor({ daysOverdue: d, outstanding: 500, priorDefaults: 1 }).id;
check(repeat(4) === 'restricted', `đã từng bị ghi sổ: ngày 4 đã bị hạn chế (mốc 7 × ${REPEAT_SPEEDUP})`);
check(repeat(11) === 'frozen', 'đã từng bị ghi sổ: ngày 11 đã đóng băng');
check(repeat(45) === 'review', 'đã từng bị ghi sổ: ngày 45 đã lên hồ sơ');
check(repeat(0) === 'grace',
  'tái phạm vẫn được NHẮC trước — không ai bị lấy mất quyền mà chưa từng được báo');

// ── 4. QUYỀN BỊ THU HỒI ĐÚNG THỨ TỰ ──────────────────────────────────────────
check(!isRestricted('grace', RESTRICTIONS.TRANSFER), 'bậc nhắc: chuyển JOY vẫn bình thường');
check(isRestricted('restricted', RESTRICTIONS.TRANSFER),
  'CHUYỂN JOY bị chặn ngay bậc đầu tiên có chế tài — đó là đường duy nhất để tẩu tán số dư');
check(isRestricted('restricted', RESTRICTIONS.NEW_LOAN), 'bậc hạn chế: không vay thêm');
check(!isRestricted('restricted', RESTRICTIONS.SPEND),
  'bậc hạn chế: VẪN tiêu được — siết hết ngay thì người ta không còn lý do quay lại trả nợ');
check(isRestricted('frozen', RESTRICTIONS.SPEND), 'bậc đóng băng: mới chặn tiêu');
check(DEBT_STAGES.find((s) => s.id === 'frozen').lockDays === 0,
  'bậc đóng băng KHÔNG khoá tài khoản — phải vào được app thì mới kiếm JOY mà trả');
check(DEBT_STAGES.find((s) => s.id === 'locked').lockDays === 30, 'bậc khoá: đúng 30 ngày');

// ── 5. BẬC CUỐI KHÔNG ĐƯỢC TỰ ĐỘNG ───────────────────────────────────────────
// Đây là bài kiểm quan trọng nhất trong tệp: cấm vĩnh viễn không gỡ lại được.
const review = DEBT_STAGES.find((s) => s.id === 'review');
check(review.needsAdmin === true, 'bậc cuối BẮT BUỘC admin duyệt, không tự thi hành');
check(DEBT_STAGES.filter((s) => s.needsAdmin).length === 1,
  'đúng MỘT bậc cần admin — không bậc nào khác lặng lẽ có quyền cấm vĩnh viễn');
check(DEBT_STAGES.every((s) => s.lockDays <= 30),
  'không bậc nào tự khoá quá 30 ngày; dài hơn thế phải qua tay người');

// ── 6. BÁO TRƯỚC BẬC KẾ TIẾP ─────────────────────────────────────────────────
check(nextStage({ daysOverdue: 0 })?.inDays === 7, 'ngày 0 → báo còn 7 ngày tới bậc hạn chế');
check(nextStage({ daysOverdue: 6 })?.inDays === 1, 'ngày 6 → báo còn 1 ngày');
check(nextStage({ daysOverdue: 0, priorDefaults: 1 })?.inDays === 4, 'tái phạm → báo mốc đã rút ngắn');
check(nextStage({ daysOverdue: 999 }) === null, 'ở bậc cuối → không hứa hẹn bậc nào nữa');
for (let d = 0; d <= 89; d += 1) {
  if (!nextStage({ daysOverdue: d })) { check(false, `ngày ${d} không báo được bậc kế tiếp`); break; }
}
check(true, 'mọi ngày trước bậc cuối đều báo trước được bậc kế tiếp');

// ── 7. ĐẾM NGÀY QUÁ HẠN ──────────────────────────────────────────────────────
const NOW = Date.UTC(2026, 8, 20);
const daysAgo = (n) => new Date(NOW - n * 86400000);
const loan = (over = {}) => ({ principal: 400, fee: 100, penalty: 0, paid: 0, dueAt: [], ...over });

check(daysOverdueOf(loan()) === 0, 'chưa có lịch đợt → 0 ngày, không ném lỗi');
check(daysOverdueOf(loan({ dueAt: [daysAgo(-5)] }), NOW) === 0, 'đợt còn 5 ngày nữa mới tới hạn → 0');
check(daysOverdueOf(loan({ dueAt: [daysAgo(10)] }), NOW) === 10, 'một đợt trễ 10 ngày → 10');
check(daysOverdueOf(loan({ dueAt: [daysAgo(30), daysAgo(10)] }), NOW) === 30,
  'hai đợt trễ → lấy đợt TRỄ NHẤT (30), không phải đợt gần nhất');

// Trả dư ở đợt đầu phải được tính cho đợt sau. Không có luật này thì người đã
// trả sạch đợt một vẫn bị báo trễ đợt một.
const twoStep = loan({ dueAt: [daysAgo(30), daysAgo(10)] });
check(daysOverdueOf({ ...twoStep, paid: 250 }, NOW) === 10,
  'đã hoàn đủ đợt 1 → chỉ còn tính đợt 2 trễ 10 ngày');
check(daysOverdueOf({ ...twoStep, paid: 500 }, NOW) === 0,
  'đã hoàn cả hai đợt → 0 ngày quá hạn');
check(daysOverdueOf({ ...twoStep, paid: 249 }, NOW) === 30,
  'thiếu 1 JOY của đợt 1 → vẫn tính từ đợt 1, không được làm tròn cho qua');

// ── 8. THÔNG BÁO CÓ ĐỦ CHO MỌI BẬC ───────────────────────────────────────────
// Bậc có chế tài mà thiếu chữ thì người dùng bị lấy quyền trong im lặng.
for (const stage of DEBT_STAGES) {
  if (stage.id === 'ontime') continue;
  for (const lang of ['vi', 'en', 'zh']) {
    const title = NOTIFICATION_TEXT[lang][`event.joyLaterStage.${stage.id}.title`];
    const message = NOTIFICATION_TEXT[lang][`event.joyLaterStage.${stage.id}.message`];
    if (!title || !message) {
      check(false, `[${lang}] thiếu chữ cho bậc "${stage.id}" — người dùng bị lấy quyền trong im lặng`);
    }
  }
}
check(true, 'mọi bậc có chế tài đều có thông báo đủ ba ngôn ngữ');
for (const stage of DEBT_STAGES) {
  if (stage.id === 'ontime') continue;
  const msg = NOTIFICATION_TEXT.vi[`event.joyLaterStage.${stage.id}.message`];
  // Nhận MỌI bộ định dạng của hai tham số đó (`joy`, `sinojoy`, `sino`,
  // `sinodays`…). Bài kiểm này canh một SỰ THẬT — rằng thông báo có nói số nợ
  // và số ngày — chứ không canh một cách trình bày cố định. Bản đầu dò đúng
  // chuỗi "{{amount, joy}}" nên báo đỏ ngay khi đổi sang chữ số Hán Việt, dù
  // nội dung vẫn nói đủ cả hai điều.
  if (!/\{\{amount[,}]/.test(msg || '') || !/\{\{days[,}]/.test(msg || '')) {
    check(false, `bậc "${stage.id}" không nói rõ nợ bao nhiêu và trễ mấy ngày`);
  }
}
check(true, 'mọi thông báo đều nói rõ SỐ NỢ và SỐ NGÀY trễ, không chỉ nói "bạn vi phạm"');

console.log(failed
  ? `\n❌ Chế tài JOYlater: ${failed} mục chưa đạt`
  : '\n✅ Chế tài JOYlater đạt — leo bậc có báo trước, cấm vĩnh viễn phải qua tay người');
process.exit(failed ? 1 : 0);
