import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useTapGuard } from "./useTapGuard";

/** Giả một sự kiện click/pointer với toạ độ. */
const evt = (x, y) => ({
  clientX: x,
  clientY: y,
  preventDefault: vi.fn(),
  stopPropagation: vi.fn(),
});

const run = (down, up) => {
  const { result } = renderHook(() => useTapGuard());
  result.current.onPointerDown(down);
  result.current.onClickCapture(up);
  return up;
};

describe("useTapGuard", () => {
  it("chạm tại chỗ thì cho qua", () => {
    const click = run(evt(100, 200), evt(103, 202));
    expect(click.stopPropagation).not.toHaveBeenCalled();
  });

  it("vuốt rồi nhả tay thì nuốt click", () => {
    const click = run(evt(100, 200), evt(100, 260));
    expect(click.stopPropagation).toHaveBeenCalled();
    expect(click.preventDefault).toHaveBeenCalled();
  });

  it("click bàn phím (không toạ độ) không bị chặn", () => {
    const click = run(evt(100, 200), evt(0, 0));
    expect(click.stopPropagation).not.toHaveBeenCalled();
  });

  it("click không có pointerdown đi trước thì kệ nó", () => {
    const { result } = renderHook(() => useTapGuard());
    const click = evt(500, 500);
    result.current.onClickCapture(click);
    expect(click.stopPropagation).not.toHaveBeenCalled();
  });
});
