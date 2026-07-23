/**
 * onDeviceBrainStore.js
 * Bộ Não Cá Nhân Hóa & Training Tính Cách Tự Động Ngầm Trên Điện Thoại (On-Device Persona Brain)
 * Chạy hoàn toàn ngầm tại PWA client, không tốn 1ms CPU server.
 */

import { IndexedDBStorage } from "../../../utils/indexedDBStorage";
import { ZeroKnowledgeCrypto } from "../../../utils/zeroKnowledgeCrypto";

const DEFAULT_BRAIN = {
  personalityTraits: {
    introvertScore: 0.6,
    overthinkingTendency: 0.5,
    warmthPreference: 0.8,
    brevityPreference: 0.4
  },
  communicationStyle: {
    preferredPronouns: "tớ - cậu",
    tone: "thấu cảm, ấm áp, lắng nghe chân thành",
    favoriteKeywords: []
  },
  frequentTriggers: [],
  sessionCount: 0,
  lastTrainedAt: null
};

export const OnDeviceBrainStore = {
  async getBrain() {
    try {
      const scans = await IndexedDBStorage.getPendingSyncQueue();
      const brainRecord = scans.find(s => s.endpoint === "on_device_brain");
      if (brainRecord?.payload?.cipherText) {
        const rawJson = await ZeroKnowledgeCrypto.decryptData(brainRecord.payload.cipherText);
        return JSON.parse(rawJson);
      }
    } catch (e) {
      console.warn("Lỗi nạp OnDeviceBrain:", e);
    }
    return DEFAULT_BRAIN;
  },

  /**
   * Training ngầm học phong cách người dùng qua mỗi tin nhắn
   */
  async harvestUserStyle(userText) {
    if (!userText || userText.length < 3) return;

    try {
      const brain = await this.getBrain();
      const textLower = userText.toLowerCase();

      // Analyze overthinking markers
      if (/\b(overthinking|suy nghi nhieu|bẽ tac|dem muon|thuc khuya|lo lang)\b/.test(textLower)) {
        brain.personalityTraits.overthinkingTendency = Math.min(1.0, brain.personalityTraits.overthinkingTendency + 0.05);
      }

      // Analyze length preference
      if (userText.length < 15) {
        brain.personalityTraits.brevityPreference = Math.min(1.0, brain.personalityTraits.brevityPreference + 0.04);
      } else if (userText.length > 80) {
        brain.personalityTraits.brevityPreference = Math.max(0.1, brain.personalityTraits.brevityPreference - 0.04);
      }

      // Analyze triggers
      if (/\b(hoc tap|thi cu|diem so|truong lop)\b/.test(textLower)) {
        if (!brain.frequentTriggers.includes("học tập & thi cử")) brain.frequentTriggers.push("học tập & thi cử");
      }
      if (/\b(gia dinh|bo me|ba me)\b/.test(textLower)) {
        if (!brain.frequentTriggers.includes("gia đình")) brain.frequentTriggers.push("gia đình");
      }

      brain.sessionCount += 1;
      brain.lastTrainedAt = new Date().toISOString();

      // Encrypt and save back silently to IndexedDB
      const encryptedBrain = await ZeroKnowledgeCrypto.encryptData(JSON.stringify(brain));
      await IndexedDBStorage.enqueuePendingSync("on_device_brain", { cipherText: encryptedBrain });
    } catch (e) {
      console.warn("Lỗi training ngầm OnDeviceBrain:", e);
    }
  }
};
