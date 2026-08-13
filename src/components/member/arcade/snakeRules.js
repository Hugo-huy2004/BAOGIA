// Hàng chờ hướng rẽ của Snake.
//
// Bản snake thật (Nokia/Google) cho phép rẽ HAI lần trong cùng một nhịp: đang
// chạy sang phải, vuốt lên rồi vuốt sang trái thật nhanh thì con rắn vẫn ăn cả
// hai cú. Trước đây game này chỉ có MỘT ô `nextDir` nên cú vuốt sau ghi đè cú
// trước — người chơi cảm thấy "game không ăn phím", nhất là ở cấp cao khi mỗi
// nhịp chỉ còn 62ms. Đây là lỗi cảm giác nặng nhất của mọi bản snake clone.
//
// Hàng chờ giữ tối đa 2 hướng; mỗi nhịp lấy ra một hướng.

/** Hai hướng có ngược nhau? (quay đầu 180° = tự cắn, luật snake cấm) */
const isReverse = (a, b) => a.x === -b.x && a.y === -b.y;
const isSame = (a, b) => a.x === b.x && a.y === b.y;

/**
 * Xếp một hướng vào hàng chờ. Bỏ qua nếu trùng hướng vừa xếp, nếu là cú quay
 * đầu 180°, hoặc nếu hàng đã đầy.
 * @param {Array<{x:number,y:number}>} queue    hàng chờ (bị thay đổi tại chỗ)
 * @param {{x:number,y:number}} dir             hướng người chơi vừa nhập
 * @param {{x:number,y:number}} currentDir      hướng con rắn đang đi
 * @param {number} max                          độ sâu hàng chờ
 */
export function queueTurn(queue, dir, currentDir, max = 2) {
  // So với hướng CUỐI trong hàng, không phải hướng đang đi: nếu đã xếp "lên"
  // thì cú tiếp theo phải hợp lệ so với "lên".
  const last = queue.length ? queue[queue.length - 1] : currentDir;
  if (isSame(dir, last) || isReverse(dir, last)) return queue;
  if (queue.length >= max) return queue;
  queue.push(dir);
  return queue;
}

/** Lấy hướng cho nhịp này; hàng rỗng thì giữ nguyên hướng đang đi. */
export function nextTurn(queue, currentDir) {
  return queue.length ? queue.shift() : currentDir;
}
