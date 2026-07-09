/**
 * AI Story Generator utility for Hugo Studio v2.0.0.
 * Dynamic generator that analyzes the user's clinical/personal profile (bio)
 * and generates a unique, artistic story narrative and animated companion.
 */
export function generatePersonalizedStory(bio) {
  const name = bio?.displayName || "Người lữ hành";
  const historyLogs = bio?.historyLogs || [];

  // 1. Analyze clinical distress indicators from recent PHQ-9 / GAD-7 test logs
  const phq9Logs = historyLogs.filter(l => l.test === "phq9");
  const gad7Logs = historyLogs.filter(l => l.test === "gad7");
  const latestPhq9 = phq9Logs[phq9Logs.length - 1];
  const latestGad7 = gad7Logs[gad7Logs.length - 1];

  const hasHighStress = 
    (latestPhq9 && latestPhq9.score >= 10) || 
    (latestGad7 && latestGad7.score >= 10);

  // 2. Identify active healing logs or lack thereof
  const hasTherapyLogs = historyLogs.some(l => l.type === "therapy_activity");

  // 3. Dynamic Story Mapping based on profile
  if (hasHighStress) {
    return {
      companion: "shadow",
      chapterTitle: "Vượt Qua Thung Lũng Sương Mù",
      narrative: `Hồ sơ tinh thần ghi nhận áp lực của ${name} đang ở mức cao. Cậu đang đi qua vùng sương mù dày đặc nhất của khu rừng, nơi Shadow đang lặng yên đồng hành để che chở cậu.`,
      ctaLabel: "Tìm nơi nương tựa cùng Shadow",
      targetTab: "utilities",
      targetSubTab: "psychology",
      targetPsychTab: "chat"
    };
  }

  if (!hasTherapyLogs) {
    return {
      companion: "spark",
      chapterTitle: "Đốm Lửa Khởi Đầu",
      narrative: `Đống lửa trại của ${name} đang cần thêm củi. Chú rồng nhỏ Spark đang nhảy múa nhảy nhót, háo hức chờ cậu thực hiện một thử thách nhỏ để thổi bùng năng lượng tích cực!`,
      ctaLabel: "Thắp lửa cùng Spark",
      targetTab: "utilities",
      targetSubTab: "psychology",
      targetPsychTab: "therapy"
    };
  }

  // Verification stage storytelling
  if (bio?.status === "pending") {
    return {
      companion: "aura",
      chapterTitle: "Lời Chào Từ Người Gác Cổng",
      narrative: `Hồ sơ học sinh của ${name} đang được người gác cổng Thư viện Cổ kiểm duyệt. Hãy kiên nhẫn một chút, cánh cổng tri thức của Hugo Studio sắp sửa mở rộng đón chào cậu rồi.`,
      ctaLabel: "Kiểm tra tiến trình",
      targetTab: "verify",
      targetSubTab: null,
      targetPsychTab: null
    };
  }

  // Default Positive Story
  return {
    companion: "aura",
    chapterTitle: "Khu Vườn Ánh Sáng",
    narrative: `Hồ sơ của ${name} đang ở trạng thái cân bằng tuyệt vời. Aura đang bay lượn trên đồng cỏ xanh mướt, vẫy gọi cậu tiếp tục khám phá những trang sách cuộc đời nhiệm màu tiếp theo.`,
    ctaLabel: "Đến thế giới Cốt Truyện",
    targetTab: "utilities",
    targetSubTab: "psychology",
    targetPsychTab: "story"
  };
}
