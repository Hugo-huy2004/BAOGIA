/**
 * weeklyDigestHelper.js
 * Utility helper to compute Weekly Healing Digest & 7-Day Periodic Assessment statistics.
 */

export function computeWeeklyDigest(historyLogs = [], bio = {}, secureMemory = {}) {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86_400_000);

  // 1. Filter logs from last 7 days
  const recentLogs = historyLogs.filter(l => {
    if (!l.date) return false;
    const d = new Date(l.date);
    return d >= sevenDaysAgo && d <= now;
  });

  // 2. Checkins & streak in past 7 days
  const checkins = recentLogs.filter(l => l.type === "checkin" && l.mood);
  const checkinDaysCount = new Set(checkins.map(c => new Date(c.date).toDateString())).size;

  // 3. Completed therapy activities count
  const activities = recentLogs.filter(l => l.type === "therapy_activity" || l.type === "clinical_test" || l.test);
  const activityCount = activities.length;

  // 4. Clinical Score Deltas (compare recent vs past tests)
  const getTestLogs = (testId) => historyLogs.filter(l => l.test === testId || (l.type === "clinical_test" && l.test === testId));
  
  const phq9Logs = getTestLogs("phq9");
  const gad7Logs = getTestLogs("gad7");
  const dassLogs = getTestLogs("dass42");

  const getDelta = (logs) => {
    if (logs.length < 2) return 0;
    const latest = logs[logs.length - 1].score ?? logs[logs.length - 1].scores?.D ?? 0;
    const previous = logs[logs.length - 2].score ?? logs[logs.length - 2].scores?.D ?? 0;
    return latest - previous;
  };

  const phq9Delta = getDelta(phq9Logs);
  const gad7Delta = getDelta(gad7Logs);
  const dassDelta = getDelta(dassLogs);

  // 5. Adaptive Recovery Score (0 - 100)
  // Higher score = better mental wellness & recovery progress
  let baseScore = 75;
  if (checkinDaysCount >= 5) baseScore += 10;
  if (activityCount >= 3) baseScore += 10;
  if (phq9Delta < 0) baseScore += 5; // improvement
  if (gad7Delta < 0) baseScore += 5; // improvement
  if (phq9Delta > 0 || gad7Delta > 0) baseScore -= 10;
  const overallRecoveryScore = Math.max(20, Math.min(100, baseScore));

  // 6. AI Personalized Encouragement Synthesis
  const friendlyName = (bio?.displayName || bio?.name || "cậu").trim().split(" ").pop();
  let weeklyAiEncouragement = "";
  if (overallRecoveryScore >= 85) {
    weeklyAiEncouragement = `Chúc mừng ${friendlyName}! Tuần qua cậu đã thể hiện khả năng phục hồi tinh thần tuyệt vời với ${checkinDaysCount}/7 ngày check-in kiên trì. Hãy tiếp tục phát huy nguồn năng lượng tích cực này nhé! 🎉`;
  } else if (overallRecoveryScore >= 65) {
    weeklyAiEncouragement = `Tuần qua ${friendlyName} đã hoàn thành ${activityCount} lượt tự chăm sóc tinh thần và duy trì cảm xúc khá ổn định. Cậu đang đi đúng hướng trên hành trình chữa lành đấy! 🌸`;
  } else {
    weeklyAiEncouragement = `Tuần vừa rồi có một vài thời điểm căng thẳng, nhưng ${friendlyName} vẫn luôn dũng cảm đối mặt. Hãy dành thêm vài phút tập thở 4-7-8 và trút bầu tâm sự cùng AI để lấy lại sự nhẹ nhõm nhé! 💚`;
  }

  return {
    checkinDaysCount,
    activityCount,
    phq9Delta,
    gad7Delta,
    dassDelta,
    overallRecoveryScore,
    weeklyAiEncouragement,
    totalLogsCount: historyLogs.length
  };
}

export function checkPeriodicAssessmentDue(historyLogs = [], lastTestDate = "") {
  const testLogs = historyLogs.filter(l => l.test || l.type === "clinical_test");
  if (testLogs.length === 0) {
    return { isDue: true, daysElapsed: 7, recommendedTests: ["phq9", "gad7", "who5", "bigfive", "dass42", "mmpi30"] };
  }

  const latestTest = testLogs[testLogs.length - 1];
  const testTime = new Date(latestTest.date || lastTestDate || Date.now()).getTime();
  const daysElapsed = Math.floor((Date.now() - testTime) / 86_400_000);

  const isDue = daysElapsed >= 7;
  return {
    isDue,
    daysElapsed,
    recommendedTests: isDue ? ["phq9", "gad7", "who5", "dass42"] : []
  };
}
