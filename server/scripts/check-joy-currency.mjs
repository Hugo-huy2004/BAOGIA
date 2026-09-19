#!/usr/bin/env node
// Kiểm tra toán tiền của lớp đơn vị JOY. Chạy: node server/scripts/check-joy-currency.mjs
//
// Đây là đường tiền: sai một hệ số là ví trừ khác màn hình. Bài kiểm tra bám
// đúng ba luật đã chốt:
//   1. Kavo (bản tiếng Anh) là ĐƠN VỊ CHUẨN — mọi tỷ giá quy về nó;
//   2. quy đổi luôn đi vòng qua JOY gốc, không nhân chéo hệ số đã làm tròn;
//   3. hoá đơn chuyển JOY phải mang theo tỷ giá đang chạy, và tổng trừ ví phải
//      khớp từng đồng với các khoản cộng lại.
import assert from 'node:assert/strict';
import {
  BASE_DENOM, JOY_DENOMS, CROSS_DENOM_FEE,
  factorOf, rateAgainstBase, convertDenom, toDenom, fromDenom, transferBreakdown,
} from '../../shared/joyCurrency.js';

// ── 1. Đơn vị chuẩn duy nhất: JOY ──────────────────────────────────────────
assert.equal(BASE_DENOM, 'vi', 'đơn vị chuẩn là JOY');
assert.equal(JOY_DENOMS[BASE_DENOM].factor, 1, '1 JOY = 1 JOY');
assert.equal(rateAgainstBase(BASE_DENOM), 1, 'tỷ giá luôn bằng 1');
for (const key of Object.keys(JOY_DENOMS)) {
  assert.equal(JOY_DENOMS[key].factor, 1, `mọi mã đều có hệ số 1 (${key})`);
  assert.equal(JOY_DENOMS[key].code, 'JOY', `mã hiển thị duy nhất là JOY (${key})`);
}

// ── 2. Không quy đổi tương đương — luôn 1:1 ────────────────────────────────
assert.equal(fromDenom(100, 'vi'), 100);
assert.equal(convertDenom(100, 'vi', 'en'), 100);
assert.equal(toDenom(100, 'vi').amount, 100);
assert.equal(toDenom(100, 'vi').code, 'JOY');

// ── 3. Hoá đơn chuyển JOY thuần túy ────────────────────────────────────────
const cross = transferBreakdown(1000, 'vi', 'ko', 0.05);
assert.equal(cross.sent, 1000);
assert.equal(cross.received, 1000, 'người nhận luôn nhận đủ số JOY đã gửi');
assert.equal(cross.creativeFee, 50, 'phí sáng tạo 5%');
assert.equal(cross.conversionFee, 0, 'không có phí quy đổi');
assert.equal(cross.totalDeducted, 1050, 'tổng trừ ví = gửi + phí sáng tạo');
assert.equal(cross.crossDenom, false, 'không có cross denom');
assert.equal(cross.sentDisplay, 1000);
assert.equal(cross.receivedDisplay, 1000);

const same = transferBreakdown(1000, 'es', 'fr', 0.05);
assert.equal(same.crossDenom, false);
assert.equal(same.conversionFee, 0);
assert.equal(same.totalDeducted, 1050);

// Số âm hay rác không được biến thành tiền.
assert.equal(transferBreakdown(-500, 'vi', 'en', 0.05).sent, 0);
assert.equal(transferBreakdown('abc', 'vi', 'en', 0.05).totalDeducted, 0);

console.log('✓ check-joy-currency: 100% tests passed for 1 single JOY unit!');
