export default class BaseBot {
  constructor(bio, historyLogs, healingActive, chatMessages = []) {
    this.bio = bio;
    this.historyLogs = historyLogs;
    this.healingActive = healingActive;
    // Recent raw chat turns (last 7 days only — see CHAT_RETENTION_MS in
    // ChatTab.jsx) used for short-term conversational context. Long-term
    // "memory" instead comes from historyLogs (mood/test indicators), which
    // are never pruned — see AIBot._buildWellnessSummary().
    this.chatMessages = chatMessages || [];
  }

  /**
   * Generates a greeting message based on the user's status.
   * @returns {Promise<string>}
   */
  async getGreeting() {
    throw new Error("Method not implemented.");
  }

  /**
   * Processes a selection (aspect or sub-aspect) from the dialogue tree.
   * @param {Object} selectedItem - The selected option object.
   * @param {String} type - "reply", "followUp", or "advice".
   * @returns {Promise<string>}
   */
  async getResponse(selectedItem, type) {
    throw new Error("Method not implemented.");
  }

  /**
   * Handles free-text chat input (optional for AI).
   * @param {String} message 
   * @returns {Promise<string>}
   */
  async chat(message) {
    throw new Error("Method not implemented.");
  }
}
