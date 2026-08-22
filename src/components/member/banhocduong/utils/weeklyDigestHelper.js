/**
 * weeklyDigestHelper.js
 * Utility helper to compute Weekly Healing Digest & 7-Day Periodic Assessment statistics.
 */

export function computeWeeklyDigest(historyLogs = [], bio = {}, secureMemory = {}, sleepLogs = []) {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86_400_000);

  // 1. Filter logs from last 7 days
  const recentLogs = historyLogs.filter(l => {
    if (!l.date) return false;
    const d = new Date(l.date);
    return d >= sevenDaysAgo && d <= now;
  });

  // 2. Checkins & streak in past 7 days
  const checkins = recentLogs.filter(l => l.type === "checkin" && Number(l.mood) >= 1);
  const checkinDaysCount = new Set(checkins.map(c => new Date(c.date).toDateString())).size;

  // 3. Completed therapy activities count
  const activities = recentLogs.filter(l => l.type === "therapy_activity");
  const activityCount = activities.length;

  // 4. Clinical Score Deltas (compare recent vs past tests)
  const getTestLogs = (testId) => historyLogs
    .filter(l => l.test === testId || (l.type === "clinical_test" && l.test === testId))
    .sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
  
  const phq9Logs = getTestLogs("phq9");
  const gad7Logs = getTestLogs("gad7");
  const dassLogs = getTestLogs("dass42");

  const getDelta = (logs) => {
    if (logs.length < 2) return null;
    const latest = logs[logs.length - 1].score ?? logs[logs.length - 1].scores?.D ?? 0;
    const previous = logs[logs.length - 2].score ?? logs[logs.length - 2].scores?.D ?? 0;
    return latest - previous;
  };

  const phq9Delta = getDelta(phq9Logs);
  const gad7Delta = getDelta(gad7Logs);
  const dassDelta = getDelta(dassLogs);

  // Coverage reflects how much evidence the report has, not mental health.
  const hasWeeklyData = recentLogs.length > 0;
  const recentSleep = sleepLogs.filter((log) => {
    const d = new Date(log.date || log.createdAt || 0);
    return d >= sevenDaysAgo && d <= now && Number(log.duration) > 0;
  });
  const evidencePoints = checkinDaysCount + Math.min(recentSleep.length, 7) + Math.min(phq9Logs.length + gad7Logs.length, 2);
  const dataCoverage = Math.min(100, Math.round((evidencePoints / 16) * 100));
  const dataConfidence = evidencePoints >= 10 ? "Cao" : evidencePoints >= 5 ? "Vừa" : "Thấp";
  // Kept as an alias for old consumers. It is now explicitly data coverage.
  const overallRecoveryScore = hasWeeklyData ? dataCoverage : null;

  const average = (items, field) => {
    const values = items.map((item) => Number(item[field])).filter(Number.isFinite);
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
  };
  const avgMood = average(checkins, "mood");
  const avgEnergy = average(checkins, "energy");
  const avgStress = average(checkins, "stress");
  const avgSleep = average(recentSleep, "duration");
  const needs = checkins.reduce((counts, log) => {
    if (log.need) counts[log.need] = (counts[log.need] || 0) + 1;
    return counts;
  }, {});
  const dominantNeed = Object.entries(needs).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  const notableSignals = [];
  if (checkinDaysCount < 3) {
    notableSignals.push(`Mới có ${checkinDaysCount}/7 ngày check-in; chưa đủ để kết luận xu hướng cảm xúc.`);
  } else {
    if (avgStress != null) notableSignals.push(`Áp lực tự ghi nhận trung bình ${avgStress.toFixed(1)}/5 trong ${checkinDaysCount} ngày.`);
    if (avgEnergy != null) notableSignals.push(`Năng lượng tự ghi nhận trung bình ${avgEnergy.toFixed(1)}/5.`);
    if (avgMood != null) notableSignals.push(`Tâm trạng tự ghi nhận trung bình ${avgMood.toFixed(1)}/5.`);
  }
  if (recentSleep.length === 0) {
    notableSignals.push("Chưa có dữ liệu giấc ngủ tuần này để đối chiếu với năng lượng và áp lực.");
  } else {
    notableSignals.push(`Giấc ngủ trung bình ${avgSleep.toFixed(1)} giờ/đêm từ ${recentSleep.length} đêm ghi nhận.`);
  }
  if (phq9Delta == null && phq9Logs.length === 1) {
    notableSignals.push("PHQ-9 mới có một mốc; không thể gọi là ổn định hay biến động.");
  }

  const actionPlan = [];
  if (checkinDaysCount < 3) actionPlan.push("Check-in Daily Pulse hôm nay để tăng độ tin cậy của báo cáo.");
  if (avgStress != null && avgStress >= 4) actionPlan.push("Chọn một bài thở 3 phút hoặc bài grounding trước nhiệm vụ khó nhất.");
  if (avgEnergy != null && avgEnergy <= 2.5) actionPlan.push("Giảm một việc không cấp thiết và đặt một khoảng nghỉ 15 phút.");
  if (recentSleep.length < 2) actionPlan.push("Ghi giờ ngủ, giờ dậy và chất lượng cho đêm nay.");
  if (actionPlan.length < 3 && dominantNeed === "focus") actionPlan.push("Chọn một việc 25 phút, tắt thông báo và nghỉ 5 phút sau đó.");
  if (actionPlan.length < 3 && dominantNeed === "talk") actionPlan.push("Viết ra điều nặng nhất trong đầu hoặc nhắn HugoPSY để sắp xếp suy nghĩ.");
  if (actionPlan.length < 3) actionPlan.push("Dành 10 phút cho một hoạt động tự chăm sóc có thể hoàn thành ngay.");
  if (actionPlan.length < 3) actionPlan.push("Check-in lại vào cuối ngày và ghi điều đã giúp hoặc chưa giúp.");

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
    dataCoverage,
    dataConfidence,
    evidencePoints,
    sleepNightsCount: recentSleep.length,
    avgMood,
    avgEnergy,
    avgStress,
    avgSleep,
    notableSignals: notableSignals.slice(0, 3),
    actionPlan: actionPlan.slice(0, 3),
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
