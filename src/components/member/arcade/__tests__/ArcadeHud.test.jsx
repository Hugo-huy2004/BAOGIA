import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ArcadeHud from "../ArcadeHud";

afterEach(() => {
  vi.useRealTimers();
});

describe("ArcadeHud toast", () => {
  it("hiện combo dưới dạng overlay rồi tự ẩn, không tạo card trong luồng", () => {
    vi.useFakeTimers();
    const { container } = render(
      <ArcadeHud gameId="2048" score={100} combo={2} multiplier={1.5} />,
    );

    expect(screen.getByText("2× liên hoàn")).toBeTruthy();
    expect(container.querySelector(".ahud__combo")).toBeNull();
    expect(container.querySelector(".ahud__toast-region")).toBeTruthy();

    act(() => vi.advanceTimersByTime(1400));
    expect(screen.queryByText("2× liên hoàn")).toBeNull();
  });

  it("toast mới thay toast cũ thay vì xếp chồng làm giật màn hình", () => {
    vi.useFakeTimers();
    const { rerender } = render(
      <ArcadeHud gameId="2048" score={100} combo={2} multiplier={1.5} />,
    );
    rerender(
      <ArcadeHud gameId="2048" score={120} combo={3} multiplier={2} notice="Lên cấp 2" />,
    );

    expect(screen.queryByText("2× liên hoàn")).toBeNull();
    expect(screen.getByText("Lên cấp 2")).toBeTruthy();
    expect(document.querySelectorAll(".ahud__toast")).toHaveLength(1);
  });
});
