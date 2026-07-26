import { describe, expect, it } from "vitest";
import BotManager from "../BotManager";

describe("HugoPSY conversation context", () => {
  it("keeps the latest eight real chat turns after the manager context updates", () => {
    const manager = new BotManager({}, [], false, []);
    const messages = Array.from({ length: 10 }, (_, index) => ({
      id: String(index),
      sender: index % 2 === 0 ? "user" : "bot",
      text: `message-${index}`,
    }));

    manager.updateContext({}, [], false, messages);

    expect(manager.aiBot._buildHistory()).toHaveLength(8);
    expect(manager.aiBot._buildHistory()[0].content).toBe("message-2");
    expect(manager.aiBot._buildHistory().at(-1).content).toBe("message-9");
  });

  it("adds a privacy-safe dominant-topic summary without raw identifiers", () => {
    const manager = new BotManager(
      { email: "student@example.edu", displayName: "Huy" },
      [],
      false,
      [
        { sender: "user", text: "Mình lo về kỳ thi và deadline đồ án" },
        { sender: "bot", text: "Tớ đang nghe đây" },
        { sender: "user", text: "Tối qua mình cũng mất ngủ vì thi" },
      ],
    );

    const payload = manager.aiBot._bioWithSummary();

    expect(payload.companionContext).toContain("học tập");
    expect(payload).not.toHaveProperty("email");
    expect(JSON.stringify(payload)).not.toContain("student@example.edu");
  });
});
