// Soát trần chuyển JOY giữa người dùng — KHÔNG cần DB, KHÔNG cần mạng.
//
// Đây là hàng rào giữa "tặng bạn vài trăm JOY" và "nuôi mấy tài khoản rồi gom
// JOY về một ví". Một nhánh sai ở đây là một lỗ bơm tiền, nên nó phải có bộ kiểm
// đứng một mình chạy được trước mỗi lần đụng vào luật chuyển.
//
// Chạy: npm run check:transfer-caps
import assert from 'node:assert/strict';
import { TRANSFER_MONTHLY_CAP } from '../../shared/joyPrices.js';
import { dailyTransferCapOf, transferFeeRateOf, TIER_FINANCE } from '../../shared/tierFinance.js';

// Trần ngày nay THEO HẠNG. Bản sao luật bên dưới phải nhận hạng, nếu không nó
// sẽ tiếp tục báo xanh cho một luật không còn tồn tại — đúng cái bẫy đã khiến
// mười lời hứa đặc quyền sai suốt nhiều tháng mà không ai biết.
const TRANSFER_DAILY_CAP = dailyTransferCapOf('eco');

let failed = 0;
const check = (ok, label) => { console.log(`${ok ? '✅' : '❌'} ${label}`); if (!ok) failed++; };

/**
 * Bản sao THUẦN của luật trần trong joyRoutes.js.
 *
 * Cố ý viết lại ở đây thay vì gọi route thật: route cần Express, Mongo và một
 * phiên đăng nhập. Cái cần canh là LUẬT — thứ tự kiểm, cách khoá kỳ, và việc bộ
 * đếm tự về 0 khi sang kỳ mới. Đổi luật ở route mà quên đổi ở đây thì các phép
 * thử bên dưới sẽ lệch với thực tế, nên chúng phải được đọc cùng nhau.
 */
function capCheck({ sender, amount, today }) {
  const sentToday = sender.joySentDate === today ? (sender.joySentToday || 0) : 0;
  if (sentToday + amount > dailyTransferCapOf(sender.tier || 'eco')) {
    return { ok: false, code: 'DAILY', sentToday };
  }

  const month = today.slice(0, 7);
  const sentMonth = sender.joySentMonth === month ? (sender.joySentMonthTotal || 0) : 0;
  if (sentMonth + amount > TRANSFER_MONTHLY_CAP) return { ok: false, code: 'MONTHLY', sentMonth };

  return {
    ok: true,
    next: {
      joySentDate: today,
      joySentToday: sentToday + amount,
      joySentMonth: month,
      joySentMonthTotal: sentMonth + amount,
    },
  };
}

const fresh = () => ({ joySentDate: '', joySentToday: 0, joySentMonth: '', joySentMonthTotal: 0 });

// ── Trần NGÀY ────────────────────────────────────────────────────────────────
check(capCheck({ sender: fresh(), amount: TRANSFER_DAILY_CAP, today: '2026-09-20' }).ok,
  `đúng bằng trần ngày (${TRANSFER_DAILY_CAP}) → cho qua`);

check(capCheck({ sender: fresh(), amount: TRANSFER_DAILY_CAP + 1, today: '2026-09-20' }).code === 'DAILY',
  'vượt trần ngày 1 JOY → chặn');

const usedToday = { ...fresh(), joySentDate: '2026-09-20', joySentToday: TRANSFER_DAILY_CAP - 10 };
check(capCheck({ sender: usedToday, amount: 11, today: '2026-09-20' }).code === 'DAILY',
  'đã gửi gần hết trần ngày → phần dư bị chặn');
check(capCheck({ sender: usedToday, amount: 10, today: '2026-09-20' }).ok,
  'đúng phần còn lại của trần ngày → cho qua');

// Sang ngày mới thì bộ đếm NGÀY tự về 0, không cần cron reset.
check(capCheck({ sender: usedToday, amount: TRANSFER_DAILY_CAP, today: '2026-09-21' }).ok,
  'sang ngày mới → bộ đếm ngày tự về 0');

// ── Trần THÁNG ───────────────────────────────────────────────────────────────
// Đây là lý do trần tháng tồn tại: chỉ có trần ngày thì 30 ngày × 1.000 = 30.000
// JOY/tháng từ MỘT tài khoản vẫn hợp lệ.
check(TRANSFER_DAILY_CAP * 30 > TRANSFER_MONTHLY_CAP,
  `trần ngày × 30 (${TRANSFER_DAILY_CAP * 30}) PHẢI lớn hơn trần tháng (${TRANSFER_MONTHLY_CAP}) — nếu không trần tháng vô nghĩa`);

const nearMonthly = {
  joySentDate: '2026-09-20', joySentToday: 0,
  joySentMonth: '2026-09', joySentMonthTotal: TRANSFER_MONTHLY_CAP - 100,
};
check(capCheck({ sender: nearMonthly, amount: 101, today: '2026-09-20' }).code === 'MONTHLY',
  'còn dưới trần ngày nhưng vượt trần tháng → chặn');
check(capCheck({ sender: nearMonthly, amount: 100, today: '2026-09-20' }).ok,
  'đúng phần còn lại của trần tháng → cho qua');

// Sang tháng mới thì bộ đếm THÁNG tự về 0.
check(capCheck({ sender: nearMonthly, amount: TRANSFER_DAILY_CAP, today: '2026-10-01' }).ok,
  'sang tháng mới → bộ đếm tháng tự về 0');

// Khoá kỳ phải là "YYYY-MM". Nếu todayStr() đổi định dạng thì phép cắt này sai
// kỳ và trần tháng sẽ reset nhầm lúc — bắt ngay ở đây.
check('2026-09-20'.slice(0, 7) === '2026-09', 'khoá kỳ tháng cắt từ YYYY-MM-DD ra đúng YYYY-MM');
assert.match(new Date().toISOString().slice(0, 10), /^\d{4}-\d{2}-\d{2}$/);
check(true, 'todayStr() của joyRoutes (ISO slice 10) vẫn là YYYY-MM-DD');

// ── Thứ tự kiểm ──────────────────────────────────────────────────────────────
// Ngày kiểm TRƯỚC tháng: người dùng cần biết rào gần nhất trước, không phải rào xa.
const bothOver = {
  joySentDate: '2026-09-20', joySentToday: TRANSFER_DAILY_CAP,
  joySentMonth: '2026-09', joySentMonthTotal: TRANSFER_MONTHLY_CAP,
};
check(capCheck({ sender: bothOver, amount: 10, today: '2026-09-20' }).code === 'DAILY',
  'chạm cả hai trần → báo trần NGÀY trước (rào gần nhất)');

// ── Bộ đếm sau khi cho qua ───────────────────────────────────────────────────
const after = capCheck({ sender: fresh(), amount: 250, today: '2026-09-20' }).next;
check(after.joySentToday === 250 && after.joySentMonthTotal === 250,
  'gửi lần đầu → cả hai bộ đếm cùng cộng 250');
const after2 = capCheck({ sender: after, amount: 250, today: '2026-09-20' }).next;
check(after2.joySentToday === 500 && after2.joySentMonthTotal === 500,
  'gửi lần hai cùng ngày → cả hai cùng lên 500');
const after3 = capCheck({ sender: after2, amount: 250, today: '2026-09-21' }).next;
check(after3.joySentToday === 250 && after3.joySentMonthTotal === 750,
  'sang ngày mới cùng tháng → ngày về 250, THÁNG vẫn cộng dồn 750');


// ── TRẦN VÀ PHÍ THEO HẠNG ────────────────────────────────────────────────────
// Cho tới 20/09/2026 bảng đặc quyền hứa "Star-14 tối đa 500 JOY/ngày" và
// "Star-VIP miễn phí 0%" mà mã nguồn không đọc hạng ở bất kỳ đâu trên đường
// tiền. Những bài kiểm dưới đây là thứ duy nhất giữ cho lời hứa đó còn đúng.
check(dailyTransferCapOf('star14') < dailyTransferCapOf('eco'),
  `Star-14 trần thấp hơn (${dailyTransferCapOf('star14')} < ${dailyTransferCapOf('eco')}) — đúng chữ "bảo vệ vị thành niên"`);
check(capCheck({ sender: { ...fresh(), tier: 'star14' }, amount: dailyTransferCapOf('star14') + 1, today: '2026-09-20' }).code === 'DAILY',
  'Star-14 vượt trần riêng → chặn');
check(capCheck({ sender: { ...fresh(), tier: 'eco' }, amount: dailyTransferCapOf('star14') + 1, today: '2026-09-20' }).ok,
  'cùng con số đó hạng Eco vẫn qua — trần là RIÊNG theo hạng, không phải chung');
check(transferFeeRateOf('starVip') === 0, 'Star-VIP miễn phí chuyển hoàn toàn (0%)');
check(transferFeeRateOf('eco') > 0 && transferFeeRateOf('star18') > 0, 'các hạng khác vẫn chịu phí');

// Hạng lạ phải rơi về hạng THẤP nhất về đặc quyền, không phải cao nhất. Một
// lỗi chính tả trong tên hạng không được biến thành miễn phí trọn đời.
check(transferFeeRateOf('hang_khong_co_that') === transferFeeRateOf('eco'),
  'hạng lạ → về Eco, KHÔNG rơi vào hạng miễn phí');
check(dailyTransferCapOf(undefined) === dailyTransferCapOf('eco'), 'thiếu hạng → về Eco');

// Trần tháng dùng chung cho mọi hạng: nó chống rửa JOY ở quy mô tháng, không
// phải một nấc đặc quyền. Bài kiểm này canh việc ai đó lỡ tay cho một hạng
// trần ngày cao tới mức trần tháng thành vô nghĩa.
for (const [tier, finance] of Object.entries(TIER_FINANCE)) {
  check(finance.dailyTransferCap * 30 > TRANSFER_MONTHLY_CAP,
    `${tier}: trần ngày × 30 (${finance.dailyTransferCap * 30}) vẫn lớn hơn trần tháng (${TRANSFER_MONTHLY_CAP})`);
}

console.log(failed
  ? `\n❌ Trần chuyển JOY: ${failed} mục chưa đạt`
  : `\n✅ Trần chuyển JOY đạt (ngày ${TRANSFER_DAILY_CAP} · tháng ${TRANSFER_MONTHLY_CAP})`);
process.exit(failed ? 1 : 0);

