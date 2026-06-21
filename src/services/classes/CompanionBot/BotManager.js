import RandomBot from "./RandomBot";
import AIBot from "./AIBot";

export default class BotManager {
  constructor(bio, historyLogs, healingActive) {
    this.randomBot = new RandomBot(bio, historyLogs, healingActive);
    this.aiBot = new AIBot(bio, historyLogs, healingActive);
  }

  /**
   * Internal routing: Route 100% to AI Bot for full testing and interaction
   */
  _route() {
    return this.aiBot;
  }

  async getGreeting() {
    const bot = this._route();
    return await bot.getGreeting();
  }

  async getResponse(selectedItem, type) {
    const bot = this._route();
    return await bot.getResponse(selectedItem, type);
  }

  async streamResponse(selectedItem, type, onChunk, onDone) {
    const bot = this._route();
    if (typeof bot.streamResponse === 'function') {
      return await bot.streamResponse(selectedItem, type, onChunk, onDone);
    }
    const res = await bot.getResponse(selectedItem, type);
    if (onDone) onDone({ reply: res });
  }

  async chat(message) {
    const bot = this._route();
    return await bot.chat(message);
  }

  async chatStream(message, onChunk, onDone) {
    const bot = this._route();
    if (typeof bot.chatStream === 'function') {
      return await bot.chatStream(message, onChunk, onDone);
    }
    // Fallback
    const res = await bot.chat(message);
    if (onDone) onDone(res);
  }

  async classifyIntent(message) {
    const bot = this._route();
    if (typeof bot.classifyIntent === 'function') {
      return await bot.classifyIntent(message);
    }
    return { intent: "fallback" };
  }

  async getRemainingTokens() {
    const bot = this._route();
    if (typeof bot.getRemainingTokens === 'function') {
      return await bot.getRemainingTokens();
    }
    return null;
  }

  logLocalMatch(message, intentId) {
    const bot = this._route();
    if (typeof bot.logLocalMatch === 'function') {
      bot.logLocalMatch(message, intentId);
    }
  }

  async chatAudio(audioBlob, isCallMode = false) {
    const bot = this._route();
    if (typeof bot.chatAudio === 'function') {

      return await bot.chatAudio(audioBlob, isCallMode);
    }
    return { text: "Xin lỗi, tính năng gọi điện AI hiện đang bảo trì.", audio_base64: null };
  }
}
