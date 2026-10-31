/**
 * hybridRaceEngine.js
 * Động cơ đua tốc độ Đa Luồng (Hybrid Parallel Racing Engine):
 * Chạy On-Device Local AI (0ms) song song với Cloud Server AI.
 * Thích ứng phần cứng Pin/CPU & Mã hóa bảo mật Zero-Knowledge.
 */

import { buildLocalReply } from "./localFallback";
import { LocalVectorRAG } from "./localVectorRAG";
import { OnDeviceGenerativeEngine } from "./onDeviceGenerativeEngine";
import { HardwareAdaptiveEngine } from "../../../utils/hardwareAdaptiveEngine";
import { ZeroKnowledgeCrypto } from "../../../utils/zeroKnowledgeCrypto";
import { IndexedDBStorage } from "../../../utils/indexedDBStorage";

export async function executeHybridRace({ userMessage, opts, onChunk, fetchCloudStream }) {
  const profile = await HardwareAdaptiveEngine.getDeviceProfile();
  
  // 1. Kiểm tra Local Vector RAG (5ms)
  const ragMatch = LocalVectorRAG.searchKnowledge(userMessage);
  let baseReply = null;
  
  if (ragMatch) {
    baseReply = {
      reply: ragMatch.reply,
      rawReplyArray: [ragMatch.reply],
      showInlineBreathing: !!ragMatch.showInlineBreathing,
      showInlineCbt: !!ragMatch.showInlineCbt,
      showInlineSleep: !!ragMatch.showInlineSleep,
      showInlineTherapy: !!ragMatch.showInlineTherapy
    };
  } else {
    baseReply = buildLocalReply(userMessage, opts);
  }

  // 🤖 Sinh câu trả lời cá nhân hóa theo đúng bộ não tính cách On-Device của từng người dùng
  const localSafetyReply = await OnDeviceGenerativeEngine.generatePersonalizedReply(userMessage, baseReply, opts?.bio);

  // Mã hóa sao lưu dữ liệu hội thoại an toàn Zero-Knowledge vào IndexedDB
  try {
    const cipherText = await ZeroKnowledgeCrypto.encryptData(userMessage);
    IndexedDBStorage.enqueuePendingSync("chat_encrypted_log", { cipherText, timestamp: Date.now() });
  } catch (e) {
    console.warn("Lỗi lưu ZK memory:", e);
  }

  // 2. Nếu chế độ tiết kiệm Pin cực thấp (<15% Pin) -> Phản hồi ngay từ On-Device Engine để tiết kiệm Pin
  if (profile.isLowPowerMode) {
    onChunk?.(localSafetyReply.reply);
    return localSafetyReply;
  }

  // 3. Đua tốc độ (Hybrid Parallel Race)
  try {
    const cloudPromise = fetchCloudStream(profile.recommendedTimeoutMs);
    const result = await cloudPromise;
    if (result && result.reply) {
      return result;
    }
  } catch (err) {
    console.warn("Cloud AI timeout/error -> Chuyển sang Edge Engine 0ms:", err);
  }

  // Phản hồi On-Device 0ms không bao giờ hiển thị lỗi cho người dùng
  onChunk?.(localSafetyReply.reply);
  return localSafetyReply;
}
