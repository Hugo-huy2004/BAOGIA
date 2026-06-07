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

  async chat(message) {
    const bot = this._route();
    return await bot.chat(message);
  }

  async chatAudio(audioBlob, isCallMode = false) {
    const bot = this._route();
    if (typeof bot.chatAudio === 'function') {
      return await bot.chatAudio(audioBlob, isCallMode);
    }
    return { text: "Xin lỗi, tính năng gọi điện AI hiện đang bảo trì.", audio_base64: null };
  }
}
