import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import GameSpaceSurvivor from "../GameSpaceSurvivor";

// jsdom không có canvas 2D thật, nên ta cắm một ctx giả ghi lại lời gọi. Mục
// tiêu không phải so pixel mà là CHẠY THẬT vòng lặp vẽ: mọi biến chưa khai báo,
// gradient sai tham số hay save/restore lệch đều ném lỗi ngay tại đây.
function stubContext() {
  const calls = [];
  const gradient = { addColorStop: vi.fn() };
  const rec = (name) => (...args) => { calls.push([name, ...args]); };
  const ctx = {
    calls,
    saveDepth: 0,
    canvas: null,
    createLinearGradient: vi.fn(() => gradient),
    createRadialGradient: vi.fn(() => gradient),
    measureText: vi.fn(() => ({ width: 10 })),
    setTransform: rec("setTransform"),
    save() { this.saveDepth++; calls.push(["save"]); },
    restore() {
      this.saveDepth--;
      if (this.saveDepth < 0) throw new Error("ctx.restore() nhiều hơn ctx.save()");
      calls.push(["restore"]);
    },
  };
  for (const m of [
    "clearRect", "fillRect", "strokeRect", "beginPath", "closePath", "moveTo", "lineTo",
    "arc", "ellipse", "fill", "stroke", "translate", "rotate", "scale", "fillText",
    "strokeText", "setLineDash", "quadraticCurveTo", "roundRect", "drawImage", "clip",
  ]) ctx[m] = rec(m);
  return ctx;
}

let ctx;
let rafQueue;

beforeEach(() => {
  ctx = stubContext();
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(ctx);
  // clientWidth là 0 trong jsdom → engine phải tự lùi về bề rộng mặc định.
  vi.spyOn(HTMLCanvasElement.prototype, "getBoundingClientRect").mockReturnValue({
    left: 0, top: 0, width: 280, height: 420, right: 280, bottom: 420, x: 0, y: 0,
  });

  rafQueue = [];
  vi.stubGlobal("requestAnimationFrame", (cb) => { rafQueue.push(cb); return rafQueue.length; });
  vi.stubGlobal("cancelAnimationFrame", () => {});
});

afterEach(() => {
  // vitest config không bật `globals`, nên auto-cleanup của testing-library
  // không chạy — không gọi tay thì cây DOM của test trước còn lại và query
  // sẽ tìm thấy hai component cùng lúc.
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

/** Chạy n khung hình của vòng lặp game. */
function runFrames(n, startTs = 0) {
  for (let i = 0; i < n; i++) {
    const cb = rafQueue.shift();
    if (!cb) return i;
    act(() => { cb(startTs + i * 16.7); });
  }
  return n;
}

describe("GameSpaceSurvivor", () => {
  it("vẽ được nhiều khung hình liên tiếp mà không ném lỗi", () => {
    render(<GameSpaceSurvivor onGameOver={vi.fn()} />);
    expect(runFrames(120)).toBe(120);
    expect(ctx.calls.length).toBeGreaterThan(500);
  });

  it("cân bằng save/restore — không rò trạng thái canvas qua các khung", () => {
    render(<GameSpaceSurvivor onGameOver={vi.fn()} />);
    runFrames(120);
    expect(ctx.saveDepth).toBe(0);
  });

  it("đặt backing store theo devicePixelRatio và giữ tỉ lệ 360:540", () => {
    vi.stubGlobal("devicePixelRatio", 2);
    const { container } = render(<GameSpaceSurvivor onGameOver={vi.fn()} />);
    const canvas = container.querySelector("canvas");
    expect(canvas.width).toBeGreaterThan(0);
    expect(canvas.height / canvas.width).toBeCloseTo(540 / 360, 2);
  });

  it("bắt đầu với đủ máu và nút xung phá bị khoá", () => {
    render(<GameSpaceSurvivor onGameOver={vi.fn()} />);
    const btn = screen.getByLabelText("Xung phá");
    expect(btn).toBeDisabled();
    expect(screen.getByLabelText("Còn 3 máu")).toBeInTheDocument();
  });

  it("bấm xung phá lúc chưa nạp đầy không làm hỏng vòng lặp", () => {
    render(<GameSpaceSurvivor onGameOver={vi.fn()} />);
    runFrames(30);
    act(() => { window.dispatchEvent(new KeyboardEvent("keydown", { key: " " })); });
    expect(runFrames(30)).toBe(30);
  });

  it("dừng vòng lặp khi bị tạm dừng và không vẽ thêm", () => {
    const { rerender } = render(<GameSpaceSurvivor paused={false} onGameOver={vi.fn()} />);
    runFrames(20);
    rerender(<GameSpaceSurvivor paused onGameOver={vi.fn()} />);
    rafQueue.length = 0;
    const before = ctx.calls.length;
    runFrames(10);
    expect(ctx.calls.length).toBe(before);
  });
});
