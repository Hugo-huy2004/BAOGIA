#!/usr/bin/env node
// Lịch đợt gửi ra giao diện phải cộng lại đúng bằng tổng phải hoàn, và phần đã
// hoàn phải rơi đúng vào các đợt đầu. Chạy: node server/scripts/check-joylater-steps.mjs
import assert from 'node:assert/strict';
import { installmentSchedule, loanTotal, nextInstallment } from '../../shared/joyLater.js';

// Cùng công thức describeLoan() dùng — giữ ở đây để kiểm được không cần cơ sở dữ liệu.
const stepsOf = (total, count, paid) => {
  const schedule = installmentSchedule(total, count);
  let covered = 0;
  return schedule.map((amount, i) => {
    const paidHere = Math.max(0, Math.min(amount, paid - covered));
    covered += amount;
    return { index: i + 1, amount, paid: paidHere, due: amount - paidHere };
  });
};

for (let count = 1; count <= 4; count += 1) {
  const { total } = loanTotal(741, count);
  for (const paid of [0, 1, 22, Math.floor(total / 2), total]) {
    const steps = stepsOf(total, count, paid);
    assert.equal(steps.length, count, 'đủ số đợt đã chọn');
    assert.equal(steps.reduce((s, x) => s + x.amount, 0), total, 'các đợt cộng lại bằng tổng');
    assert.equal(steps.reduce((s, x) => s + x.paid, 0), Math.min(paid, total), 'đã hoàn không rơi mất');
    const next = nextInstallment(steps.map((x) => x.amount), paid);
    const firstDue = steps.find((x) => x.due > 0);
    if (firstDue) {
      assert.equal(next.index, firstDue.index, 'đợt kế tiếp = đợt đầu tiên còn thiếu');
      assert.equal(next.due, firstDue.due, 'số còn thiếu của đợt kế tiếp khớp');
    }
  }
}
console.log('OK — lịch đợt khớp với đợt kế tiếp ở mọi mức chia và mọi mức đã hoàn');
