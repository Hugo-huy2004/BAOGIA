import AIBot from "./AIBot";

/**
 * BotManager: Central orchestrator and router for HugoPSY AI service.
 */
export default class BotManager {
  constructor(bio, historyLogs, healingActive, chatMessages = []) {
    this.aiBot = new AIBot(bio, historyLogs, healingActive, chatMessages);
  }

  _route() {
    return this.aiBot;
  }

  static getActiveBot(bio, historyLogs, healingActive, chatMessages) {
    return new AIBot(bio, historyLogs, healingActive, chatMessages);
  }

  async getGreeting() {
    return await this._route().getGreeting();
  }

  async getResponse(selectedItem, type) {
    return await this._route().getResponse(selectedItem, type);
  }

  async streamResponse(selectedItem, type, onChunk, onDone) {
    const bot = this._route();
    if (typeof bot.streamResponse === "function") {
      return await bot.streamResponse(selectedItem, type, onChunk, onDone);
    }
    const res = await bot.getResponse(selectedItem, type);
    if (onDone) onDone({ reply: res });
  }

  async chat(message) {
    return await this._route().chat(message);
  }

  async chatStream(message, onChunk, onDone) {
    const bot = this._route();
    if (typeof bot.chatStream === "function") {
      return await bot.chatStream(message, onChunk, onDone);
    }
    const res = await bot.chat(message);
    if (onDone) onDone(res);
  }

  async classifyIntent(message) {
    const bot = this._route();
    if (typeof bot.classifyIntent === "function") {
      return await bot.classifyIntent(message);
    }
    return { intent: "fallback" };
  }

  async getRemainingTokens() {
    const bot = this._route();
    if (typeof bot.getRemainingTokens === "function") {
      return await bot.getRemainingTokens();
    }
    return null;
  }

  logLocalMatch(message, intentId) {
    const bot = this._route();
    if (typeof bot.logLocalMatch === "function") {
      bot.logLocalMatch(message, intentId);
    }
  }

  async chatAudio(audioBlob, isCallMode = false) {
    const bot = this._route();
    if (typeof bot.chatAudio === "function") {
      return await bot.chatAudio(audioBlob, isCallMode);
    }
    return { text: "Xin lỗi, tính năng này đang bảo trì.", audio_base64: null };
  }
}
