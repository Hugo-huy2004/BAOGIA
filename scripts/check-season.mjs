/* Kiểm tra khoảng ngày của trang trí theo mùa: node scripts/check-season.mjs
   (Chạy được thẳng bằng node vì src/config/season.js không import gì.) */
import assert from "node:assert/strict";
import { activeSeason, SEASONS } from "../src/config/season.js";

const on = (y, m, d) => activeSeason(new Date(y, m - 1, d));

// Cửa sổ người nhện user đặt: 31/07 → hết 15/08.
assert.equal(on(2026, 7, 31), "spider", "31/07 là ngày đầu, phải bật");
assert.equal(on(2026, 8, 15), "spider", "hết 15/08 vẫn còn bật");
assert.equal(on(2026, 7, 30), null, "30/07 chưa tới thì ẩn");
assert.equal(on(2026, 8, 16), null, "16/08 là ẩn");

assert.equal(on(2026, 10, 31), "halloween", "đúng ngày Halloween phải bật");
assert.equal(on(2026, 10, 20), "halloween", "ngày đầu mùa tính là trong mùa");
assert.equal(on(2026, 11, 2), "halloween", "ngày cuối mùa tính là trong mùa");
assert.equal(on(2026, 10, 19), null, "trước mùa một ngày thì tắt");
assert.equal(on(2026, 11, 3), null, "sau mùa một ngày thì tắt");
assert.equal(on(2026, 9, 1), null, "ngoài mọi mùa thì không có gì");

// Mùa vắt qua giao thừa (Noel → năm mới) phải tính đúng cả hai phía.
SEASONS.__wrap = { from: 1215, to: 105 };
assert.equal(on(2026, 12, 25), "__wrap");
assert.equal(on(2026, 1, 3), "__wrap");
assert.equal(on(2026, 6, 1), null);
delete SEASONS.__wrap;

console.log("season ranges ok");
