import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import ChatMessages from "../ChatMessages";

const baseProps = {
  completedMessageIds: new Set(["bot-1", "user-1"]),
  setCompletedMessageIds: vi.fn(),
  onStartTest: vi.fn(),
  onSelectDuration: vi.fn(),
  onNavigateToTab: vi.fn(),
  messagesEndRef: React.createRef(),
  onUnlockFeature: vi.fn(),
  onMoodSelect: vi.fn(),
  moodCheckinDone: true,
};

describe("ChatMessages", () => {
  it("renders bot and user bubbles without scroll ref crashes", () => {
    render(
      <div style={{ height: 500 }}>
        <ChatMessages
          {...baseProps}
          messages={[
            { id: "bot-1", sender: "bot", text: "Tớ đang ở đây cùng cậu.", time: new Date() },
            { id: "user-1", sender: "user", text: "Mình thấy hơi áp lực.", time: new Date() },
          ]}
        />
      </div>
    );

    expect(screen.getByText("Tớ đang ở đây cùng cậu.")).toBeInTheDocument();
    expect(screen.getByText("Mình thấy hơi áp lực.")).toBeInTheDocument();
  });

  it("handles manual scrolling and shows the scroll-to-bottom control", () => {
    const { container } = render(
      <div style={{ height: 120 }}>
        <ChatMessages
          {...baseProps}
          messages={[
            { id: "bot-1", sender: "bot", text: "Tin nhắn cũ", time: new Date() },
            { id: "user-1", sender: "user", text: "Tin nhắn mới", time: new Date() },
          ]}
        />
      </div>
    );

    const scroller = container.querySelector(".overflow-y-auto");
    Object.defineProperty(scroller, "scrollHeight", { value: 500, configurable: true });
    Object.defineProperty(scroller, "clientHeight", { value: 100, configurable: true });
    scroller.scrollTop = 0;
    fireEvent.scroll(scroller);

    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});
