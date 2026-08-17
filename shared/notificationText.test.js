import { describe, expect, it } from "vitest";
import {
  NOTIFICATION_LANGUAGES,
  NOTIFICATION_TEXT,
  notificationLanguage,
  renderNotification,
} from "./notificationText.js";
import { JOY_SOURCE_KEYS } from "../server/utils/joySources.js";

// Thông báo là thứ duy nhất trong hệ thống được sinh ra ở server rồi đọc ở
// client bằng ngôn ngữ khác. Ba bất biến dưới đây là thứ giữ cho nó không âm
// thầm rơi về tiếng Việt: đủ khoá ở mọi ngôn ngữ, mọi nguồn JOY đều có tên, và
// tham số trong câu phải trùng nhau giữa các ngôn ngữ (thiếu {{amount}} ở một
// bản dịch là mất luôn số tiền ở đúng nước đó).
const KEYS = Object.keys(NOTIFICATION_TEXT.vi);
const placeholders = (text) => [...text.matchAll(/\{\{(\w+)\}\}/g)].map(m => m[1]).sort();

describe("shared/notificationText", () => {
  it.each(NOTIFICATION_LANGUAGES)("%s có đúng bộ khoá như tiếng Việt", (language) => {
    expect(Object.keys(NOTIFICATION_TEXT[language]).sort()).toEqual([...KEYS].sort());
  });

  it.each(NOTIFICATION_LANGUAGES)("%s giữ nguyên tham số trong mọi câu", (language) => {
    const mismatched = KEYS.filter(key => (
      placeholders(NOTIFICATION_TEXT[language][key]).join() !== placeholders(NOTIFICATION_TEXT.vi[key]).join()
    ));
    expect(mismatched).toEqual([]);
  });

  it("mọi nguồn JOY đều có tiêu đề", () => {
    const missing = JOY_SOURCE_KEYS.filter(source => !NOTIFICATION_TEXT.vi[`source.${source}`]);
    expect(missing).toEqual([]);
  });

  it("dựng câu theo ngôn ngữ được yêu cầu", () => {
    expect(renderNotification("source.checkin", {}, "ko").title).toBe("일일 출석");
    expect(renderNotification("event.adminBonus", { amount: 1500 }, "en", "en").message)
      .toBe("The admin just gave you 1,500 JOYka.");
  });

  it("số tiền viết theo đơn vị NGƯỜI NHẬN, không theo ngôn ngữ của câu", () => {
    // Hai thứ độc lập: câu dịch theo ngôn ngữ thiết bị, số tiền viết theo
    // `Bio.joyDenom` của người nhận. Nếu hàm này bỏ qua tham số đơn vị thì thành
    // viên dùng Zoma sẽ nhận thông báo ghi số của Mira — sai số tiền, không chỉ
    // sai chữ. Mọi nơi gọi thật đều truyền đơn vị (pushNotifier, notifyMember,
    // useNotifications).
    const zoma = renderNotification("event.adminBonus", { amount: 1500 }, "en", "ja").message;
    const mira = renderNotification("event.adminBonus", { amount: 1500 }, "en", "vi").message;
    expect(zoma).toContain("JOYzo");
    expect(mira).toContain("JOYmi");
    expect(zoma).not.toBe(mira);
  });

  it("lời nhắn người dùng tự viết được giữ nguyên, không dịch", () => {
    const text = renderNotification("event.appGift", { sender: "Hugo", item: "X", note: "Chúc mừng!" }, "fr");
    expect(text.message).toBe("Chúc mừng!");
  });

  it("khoá lạ trả null để nơi gọi dùng lại chữ đã lưu trong DB", () => {
    expect(renderNotification("", {}, "vi")).toBeNull();
    expect(renderNotification("event.khongTonTai", {}, "vi")).toBeNull();
  });

  it("mã ngôn ngữ dạng vùng miền vẫn nhận đúng", () => {
    expect(notificationLanguage("ko-KR")).toBe("ko");
    expect(notificationLanguage("zh_CN")).toBe("zh");
    expect(notificationLanguage("xx")).toBe("vi");
    expect(notificationLanguage(undefined)).toBe("vi");
  });
});
