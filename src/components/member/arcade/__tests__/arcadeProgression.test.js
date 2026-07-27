import { describe, it, expect } from "vitest";
import { levelFor, levelProgress, maxLevel, ramp, createCombo } from "../arcadeProgression";
import { calcJoy } from "../../../../utils/joyCalculation";

describe("levelFor", () => {
  it("bắt đầu ở cấp 1 và lên cấp đúng mỗi `step` điểm", () => {
    expect(levelFor("snake", 0)).toBe(1);
    expect(levelFor("snake", 59)).toBe(1);
    expect(levelFor("snake", 60)).toBe(2);
    expect(levelFor("snake", 180)).toBe(4);
  });

  it("không bao giờ vượt cấp trần và không âm khi điểm âm", () => {
    expect(levelFor("snake", 10_000_000)).toBe(maxLevel("snake"));
    expect(levelFor("snake", -50)).toBe(1);
  });

  it("game lạ dùng đường cong mặc định thay vì vỡ", () => {
    expect(levelFor("khong-ton-tai", 0)).toBe(1);
    expect(levelFor("khong-ton-tai", 500)).toBe(2);
  });
});

describe("levelProgress", () => {
  it("chạy 0→1 trong một cấp và đầy khi đạt trần", () => {
    expect(levelProgress("snake", 0)).toBe(0);
    expect(levelProgress("snake", 30)).toBeCloseTo(0.5);
    expect(levelProgress("snake", 10_000_000)).toBe(1);
  });
});

describe("ramp", () => {
  it("cấp 1 trả `from`, cấp trần trả `to`, ở giữa thì nội suy", () => {
    expect(ramp("snake", 1, 150, 60)).toBe(150);
    expect(ramp("snake", maxLevel("snake"), 150, 60)).toBe(60);
    const mid = ramp("snake", 7, 150, 60); // 7 trong 1..12 ≈ giữa
    expect(mid).toBeLessThan(150);
    expect(mid).toBeGreaterThan(60);
  });

  it("kẹp lại khi cấp vượt ngoài khoảng", () => {
    expect(ramp("snake", 99, 150, 60)).toBe(60);
    expect(ramp("snake", -3, 150, 60)).toBe(150);
  });
});

describe("createCombo", () => {
  it("nhịp đầu tiên KHÔNG tự cộng chuỗi, kể cả khi cửa sổ là vô hạn", () => {
    const c = createCombo({ windowMs: Infinity, step: 0.2, max: 2 });
    expect(c.hit(1000)).toBe(1);
    expect(c.chain).toBe(0);
    expect(c.hit(2000)).toBeCloseTo(1.2);
  });

  it("nối chuỗi trong cửa sổ và đứt khi quá hạn", () => {
    const c = createCombo({ windowMs: 1000, step: 0.25, max: 3 });
    c.hit(0);
    expect(c.hit(500)).toBeCloseTo(1.25);
    expect(c.hit(900)).toBeCloseTo(1.5);
    expect(c.hit(5000)).toBe(1); // quá hạn → về đầu
  });

  it("không vượt hệ số trần và tick() làm rơi chuỗi", () => {
    const c = createCombo({ windowMs: 1000, step: 1, max: 2 });
    c.hit(0); c.hit(100); c.hit(200); c.hit(300);
    expect(c.mult).toBe(2);
    c.tick(9999);
    expect(c.chain).toBe(0);
    expect(c.mult).toBe(1);
  });
});

// Thang điểm mới lớn hơn thang cũ theo hệ số cố định; các mốc JOY đã được nhân
// lại đúng hệ số đó, nên cùng một màn chơi phải trả ra cùng số JOY như trước.
describe("JOY giữ nguyên sau khi đổi cách tính điểm", () => {
  const OLD_TIERS = {
    snake: [[0, 2, 0.5], [10, 7, 0.35], [40, 17, 0.2], [100, 29, 0.12], [200, 41, 0.08]],
    flappy: [[0, 2, 1.5], [3, 6, 0.8], [10, 12, 0.5], [25, 20, 0.3]],
    tetris: [[0, 2, 0.008], [500, 6, 0.005], [2000, 13, 0.003], [6000, 25, 0.002]],
    survivor: [[0, 2, 0.012], [200, 4, 0.008], [1000, 10, 0.005], [3000, 20, 0.003]],
    "2048": [[0, 2, 0.006], [500, 5, 0.004], [2000, 11, 0.003], [8000, 29, 0.001]],
    wordguess: [[0, 2, 1.2], [5, 8, 0.8], [15, 16, 0.5], [30, 23, 0.35]],
  };
  const FACTORS = { snake: 6, flappy: 7, tetris: 3, survivor: 3, "2048": 2, wordguess: 3 };

  const oldJoy = (game, score) => {
    const tiers = OLD_TIERS[game];
    let base = 1, per = 0, threshold = 0;
    for (let i = tiers.length - 1; i >= 0; i--) {
      if (score >= tiers[i][0]) { [threshold, base, per] = tiers[i]; break; }
    }
    return Math.max(1, Math.floor(base + (score - threshold) * per));
  };

  it.each(Object.keys(FACTORS))("%s trả JOY tương đương thang cũ", (game) => {
    for (const oldScore of [0, 5, 25, 80, 300, 1500, 9000]) {
      const expected = oldJoy(game, oldScore);
      const actual = calcJoy(game, oldScore * FACTORS[game]);
      // Sai số 1 JOY là do làm tròn của floor ở hai thang khác nhau.
      expect(Math.abs(actual - expected)).toBeLessThanOrEqual(1);
    }
  });

  it("luôn tối thiểu 1 JOY", () => {
    expect(calcJoy("snake", 0)).toBeGreaterThanOrEqual(1);
    expect(calcJoy("khong-ton-tai", 0)).toBeGreaterThanOrEqual(1);
  });
});
