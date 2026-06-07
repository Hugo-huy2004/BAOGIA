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
}
