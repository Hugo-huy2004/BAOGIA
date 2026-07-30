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

  // This is an engagement score, not a mental-health or recovery score.
  // It only reflects actions recorded in the product during the last 7 days.
  const hasWeeklyData = recentLogs.length > 0;
  const overallRecoveryScore = hasWeeklyData
    ? Math.min(100, (checkinDaysCount * 10) + (Math.min(activityCount, 5) * 6))
    : null;

  // 6. AI Personalized Encouragement Synthesis
  const friendlyName = (bio?.displayName || bio?.name || "cậu").trim().split(" ").pop();
  let weeklyAiEncouragement = "";
  if (!hasWeeklyData) {
    weeklyAiEncouragement = `${friendlyName} chưa có hoạt động trong 7 ngày gần nhất. Bắt đầu bằng một lần check-in ngắn để HugoPSY tạo bản tổng kết từ dữ liệu thật nhé.`;
  } else if (checkinDaysCount >= 5) {
    weeklyAiEncouragement = `${friendlyName} đã check-in ${checkinDaysCount}/7 ngày và hoàn thành ${activityCount} hoạt động tự chăm sóc trong tuần qua.`;
  } else {
    weeklyAiEncouragement = `${friendlyName} đã có ${checkinDaysCount} ngày check-in và ${activityCount} hoạt động được ghi nhận trong 7 ngày gần nhất.`;
  }

  return {
    checkinDaysCount,
    activityCount,
    phq9Delta,
    gad7Delta,
    dassDelta,
    overallRecoveryScore,
    hasWeeklyData,
    weeklyAiEncouragement,
    totalLogsCount: historyLogs.length
  };
}

export function checkPeriodicAssessmentDue(historyLogs = [], lastTestDate = "") {
  const periodicScreeners = new Set(["phq9", "gad7", "who5"]);
  const testLogs = historyLogs.filter((log) => periodicScreeners.has(log.test));
  if (testLogs.length === 0) {
    return { isDue: true, daysElapsed: null, recommendedTests: ["phq9", "gad7", "who5", "bigfive"] };
  }

  const latestTest = testLogs[testLogs.length - 1];
  const testTime = new Date(latestTest.date || lastTestDate || Date.now()).getTime();
  const daysElapsed = Math.floor((Date.now() - testTime) / 86_400_000);

  const isDue = daysElapsed >= 14;
  return {
    isDue,
    daysElapsed,
    recommendedTests: isDue ? ["phq9", "gad7", "who5"] : []
  };
}
