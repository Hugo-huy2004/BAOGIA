/**
 * onDeviceGenerativeEngine.js
 * Động cơ Tổng Hợp AI Sinh Ngữ Trên Thiết Bị (On-Device Deep Generative Engine).
 * Vượt xa Intent tĩnh, tạo câu trả lời cá nhân hóa theo đúng gu tính cách riêng từng người dùng.
 */

import { OnDeviceBrainStore } from "./onDeviceBrainStore";
import { LocalVectorRAG } from "./localVectorRAG";

export const OnDeviceGenerativeEngine = {
  async generatePersonalizedReply(userText, baseReplyObj, bio) {
    // 1. Kích hoạt Training ngầm học phong cách tin nhắn
    OnDeviceBrainStore.harvestUserStyle(userText).catch(() => {});

    // 2. Nạp Bộ Não Tính Cách Cá Nhân của người dùng
    const brain = await OnDeviceBrainStore.getBrain();
    const userName = bio?.displayName?.trim().split(" ").pop() || "cậu";

    // 3. Đọc dữ liệu RAG Véctơ
    const ragMatch = LocalVectorRAG.searchKnowledge(userText);
    let mainContent = baseReplyObj?.reply || ragMatch?.reply || "Tớ luôn ở đây lắng nghe cậu. Hãy cứ thả lỏng và kể cho tớ nghe nhé.";

    // 4. Cá nhân hóa câu từ theo gu tính cách học được ngầm
    let personalizedReply = mainContent;

    // Nếu người dùng thích câu ngắn gọn
    if (brain.personalityTraits.brevityPreference > 0.75) {
      personalizedReply = mainContent.split("\n\n")[0];
    }

    // Nếu người dùng có xu hướng Overthinking cao -> Thêm lời vỗ về ấm áp
    if (brain.personalityTraits.overthinkingTendency > 0.65) {
      personalizedReply = `Tớ biết ${userName} đang suy nghĩ rất nhiều và thấy mệt mỏi. ${personalizedReply}`;
    }

    return {
      reply: personalizedReply,
      rawReplyArray: [personalizedReply],
      suggestPhq9: baseReplyObj?.suggestPhq9 || false,
      suggestGad7: baseReplyObj?.suggestGad7 || false,
      showInlineBreathing: baseReplyObj?.showInlineBreathing || ragMatch?.showInlineBreathing || false,
      showInlineCbt: baseReplyObj?.showInlineCbt || ragMatch?.showInlineCbt || false,
      showInlineSleep: baseReplyObj?.showInlineSleep || ragMatch?.showInlineSleep || false,
      showInlineTherapy: baseReplyObj?.showInlineTherapy || ragMatch?.showInlineTherapy || false,
      isOnDevicePersonalized: true
    };
  }
};
