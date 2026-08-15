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

// ── Mồi phải ở chỗ rắn CÒN TỚI ĐƯỢC ────────────────────────────────
// Bản cũ chọn ô trống ngẫu nhiên. Về cuối ván, thân rắn dài có thể quây kín một
// vùng; mồi rơi vào đó thì người chơi hoặc bó tay hoặc lao vào tự cắn — chết oan
// đúng lúc đang giữ kỷ lục. Lan vùng từ đầu rắn trước khi chọn ô là xong.

const cellKey = (cell) => `${cell.x},${cell.y}`;
const STEPS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

/**
 * Tập ô (dạng "x,y") mà đầu rắn còn đi tới được.
 * @param {{grid:number, head:{x,y}, blocked?:Array, portals?:Array}} options
 */
export function reachableCells({ grid, head, blocked = [], portals = [] }) {
  const walls = new Set(blocked.filter(Boolean).map(cellKey));
  // Cổng dịch chuyển nối hai vùng rời nhau — bỏ qua thì vùng bên kia bị coi là
  // không tới được, mồi sẽ không bao giờ rơi sang đó dù thực tế tới được.
  const exits = new Map();
  if (portals.length === 2) {
    exits.set(cellKey(portals[0]), portals[1]);
    exits.set(cellKey(portals[1]), portals[0]);
  }

  const seen = new Set([cellKey(head)]);
  const queue = [head];
  while (queue.length) {
    const current = queue.pop();
    for (const [dx, dy] of STEPS) {
      const next = { x: current.x + dx, y: current.y + dy };
      if (next.x < 0 || next.y < 0 || next.x >= grid || next.y >= grid) continue;
      const key = cellKey(next);
      if (seen.has(key) || walls.has(key)) continue;
      seen.add(key);
      queue.push(next);
      const exit = exits.get(key);
      if (exit && !seen.has(cellKey(exit))) { seen.add(cellKey(exit)); queue.push(exit); }
    }
  }
  seen.delete(cellKey(head));
  return seen;
}

/**
 * Ô ngẫu nhiên trong vùng rắn còn tới được, trừ những ô trong `avoid`.
 * Trả về `null` khi không còn ô nào — lúc đó người gọi tự quyết (rơi ngẫu nhiên).
 */
export function pickReachableCell({ grid, head, blocked = [], portals = [], avoid = [], random = Math.random }) {
  const skip = new Set(avoid.filter(Boolean).map(cellKey));
  const candidates = [...reachableCells({ grid, head, blocked, portals })].filter((key) => !skip.has(key));
  if (!candidates.length) return null;
  const [x, y] = candidates[Math.floor(random() * candidates.length)].split(",");
  return { x: Number(x), y: Number(y) };
}
