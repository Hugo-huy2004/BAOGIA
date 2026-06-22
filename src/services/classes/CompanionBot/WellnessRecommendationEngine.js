export default class WellnessRecommendationEngine {
  /**
   * Generates highly personalized suggestions based on user profile, history, and chat messages.
   * @param {Object} bio - User profile
   * @param {Array} historyLogs - Array of history logs
   * @param {Array} chatMessages - Array of user-bot messages
   */
  static generateSuggestions(bio, historyLogs = [], chatMessages = []) {
    const checkins = (historyLogs || [])
      .filter(l => l.type === "checkin" && l.mood)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const latestMood = checkins.length ? checkins[checkins.length - 1].mood : null;

    // 1. Calculate check-in streak
    let streak = 0;
    const days = new Set(checkins.map(c => new Date(c.date).toDateString()));
    let d = new Date();
    while (days.has(d.toDateString())) {
      streak++;
      d.setDate(d.getDate() - 1);
    }

    // 2. Calculate mood trend
    let trend = "stable";
    if (checkins.length >= 4) {
      const avg = arr => arr.reduce((a, b) => a + b, 0) / (arr.length || 1);
      const recent = avg(checkins.slice(-3).map(c => c.mood));
      const prior = avg(checkins.slice(-6, -3).map(c => c.mood));
      if (recent - prior >= 0.5) trend = "up";
      else if (prior - recent >= 0.5) trend = "down";
    }

    // 3. Get latest test results
    const clinicalLogs = (historyLogs || [])
      .filter(l => l.test || l.type === "clinical_test")
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    const latestClinical = clinicalLogs[clinicalLogs.length - 1] || null;

    // 4. Chat keyword detection
    const lastUserMessage = [...(chatMessages || [])]
      .reverse()
      .find(m => m.sender === "user")?.text?.toLowerCase() || "";

    const hasStressKeywords = ["áp lực", "căng thẳng", "stress", "mệt mỏi", "kiệt sức", "quá tải"].some(kw => lastUserMessage.includes(kw));
    const hasSleepKeywords = ["mất ngủ", "khó ngủ", "ngủ", "chập chờn", "thức giấc"].some(kw => lastUserMessage.includes(kw));
    const hasSadKeywords = ["buồn", "khóc", "tệ", "chán", "cô đơn", "tuyệt vọng"].some(kw => lastUserMessage.includes(kw));

    // 5. Generate recommendations list
    const recommendations = [];

    // Rule A: High stress / exhaustion
    if (latestMood !== null && latestMood <= 2 || hasStressKeywords) {
      recommendations.push({
        id: "breath",
        type: "therapy",
        label: "Hít thở 4-7-8",
        reason: "Tâm trạng đang có dấu hiệu căng thẳng hoặc mệt mỏi. Tập thở nhịp 4-7-8 giúp cậu xoa dịu hệ thần kinh tức thì.",
        icon: "air"
      });
    }

    // Rule B: Poor sleep logs / sleep talk keywords
    if (hasSleepKeywords) {
      if (bio?.unlockedCompanionFeatures?.includes("soundscape")) {
        recommendations.push({
          id: "soundscape",
          type: "therapy",
          label: "Âm thanh thiên nhiên",
          reason: "Cậu đang gặp vấn đề về giấc ngủ. Hãy nghe tiếng mưa rơi hoặc tiếng lửa trại để dễ đi vào giấc ngủ hơn nhé.",
          icon: "headphones"
        });
      } else {
        recommendations.push({
          id: "soundscape",
          type: "unlock",
          label: "Mở khóa Âm thanh Thiên nhiên",
          reason: "Dễ ngủ và ngủ sâu giấc hơn bằng bộ âm thanh tự nhiên chất lượng cao (Mở khóa chỉ với 150 JOY).",
          icon: "lock"
        });
      }
    }

    // Rule C: Sadness signals / CBT suggestion
    if (hasSadKeywords || (latestMood !== null && latestMood <= 2)) {
      if (bio?.unlockedCompanionFeatures?.includes("depression")) {
        recommendations.push({
          id: "depression",
          type: "therapy",
          label: "Bảng ghi suy nghĩ CBT",
          reason: "Tâm lý đang chịu cảm xúc tiêu cực. Sử dụng CBT Worksheet để phân tích và tái cơ cấu nhận thức.",
          icon: "psychology"
        });
      } else {
        recommendations.push({
          id: "depression",
          type: "unlock",
          label: "CBT Worksheet Cá nhân hóa",
          reason: "Chế ngự những suy nghĩ tiêu cực khi mệt mỏi với phương pháp CBT cá nhân hóa (Mở khóa bằng 150 JOY).",
          icon: "lock"
        });
      }
    }

    // Rule D: Test check-up intervals
    if (clinicalLogs.length === 0) {
      recommendations.push({
        id: "evaluation",
        type: "test",
        label: "Làm test đánh giá tâm lý",
        reason: "Hãy thử bài trắc nghiệm nhanh PHQ-9 hoặc GAD-7 để có chỉ số đánh giá tổng quát về sức khỏe tinh thần.",
        icon: "assignment"
      });
    } else {
      const lastTestDate = new Date(latestClinical.date);
      const elapsedDays = Math.floor((Date.now() - lastTestDate.getTime()) / 86400000);
      if (elapsedDays >= 14) {
        recommendations.push({
          id: "evaluation",
          type: "test",
          label: "Đánh giá định kỳ",
          reason: `Đã ${elapsedDays} ngày kể từ bài test ${latestClinical.test?.toUpperCase()} cuối cùng. Cậu nên làm lại đánh giá để theo dõi sát sao biểu đồ tiến triển.`,
          icon: "monitoring"
        });
      }
    }

    // Fallbacks
    if (recommendations.length < 3) {
      recommendations.push({
        id: "soundscape",
        type: "therapy",
        label: "Âm thanh thiên nhiên",
        reason: "Tự trộn âm thanh tiếng mưa rơi, sóng biển và lửa trại để có không gian học tập và thư giãn tĩnh tâm.",
        icon: "spa"
      });
    }

    if (recommendations.length < 3) {
      recommendations.push({
        id: "chat",
        type: "chat",
        label: "Trò chuyện tự do",
        reason: "Tớ luôn sẵn sàng lắng nghe. Cứ chia sẻ bất cứ điều gì đang diễn ra trong tâm trí cậu nhé.",
        icon: "chat"
      });
    }

    return {
      latestMood,
      streak,
      trend,
      latestClinical,
      recommendations: recommendations.slice(0, 3) // Return top 3 recommendations
    };
  }
}
