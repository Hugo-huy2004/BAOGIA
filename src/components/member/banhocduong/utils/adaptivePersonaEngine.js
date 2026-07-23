/**
 * Adaptive Persona Engine for HugoPSY
 * Dynamically evaluates user state, checkin mood, local hour, message length preferences,
 * and clinical test indicators to recommend the optimal persona mode & system instruction.
 */

export function computeAdaptivePersona(historyLogs = [], bio = {}, lastUserText = "") {
  const isAutoEnabled = localStorage.getItem("hugopsy_auto_adaptive") !== "false";
  if (!isAutoEnabled) {
    return {
      autoEnabled: false,
      mode: "standard",
      label: "Chế độ Chuẩn",
      icon: "psychology",
      hint: ""
    };
  }

  const currentHour = new Date().getHours();
  const isNight = currentHour >= 22 || currentHour < 5;

  // Find recent checkin mood
  let recentMood = 3;
  if (Array.isArray(historyLogs)) {
    const checkins = historyLogs.filter((l) => l.type === "checkin" && typeof l.mood === "number");
    if (checkins.length > 0) {
      const sorted = [...checkins].sort((a, b) => new Date(b.date) - new Date(a.date));
      recentMood = sorted[0].mood;
    }
  }

  // 1. Night Calm Persona
  if (isNight) {
    return {
      autoEnabled: true,
      mode: "night_calm",
      label: "Lắng nghe đêm muộn",
      icon: "bedtime",
      hint: "Đang là đêm muộn (sau 22:00). Giữ giọng điệu cực kỳ dịu dàng, lắng nghe sâu, gợi ý hạ thấp nhịp thở, tránh gây kích động hay phân tích quá nặng nề."
    };
  }

  // 2. Deep Empathetic Persona for low mood
  if (recentMood <= 2) {
    return {
      autoEnabled: true,
      mode: "empathetic",
      label: "Ân cần & Thấu cảm",
      icon: "favorite",
      hint: "Người dùng đang có chỉ số cảm xúc trầm (<=2/5). Ôm ấp cảm xúc, ưu tiên lắng nghe, tuyệt đối không giảng đạo lý, gợi ý nhẹ các bài tập hít thở 4-7-8 hoặc tĩnh tâm."
    };
  }

  // 3. Energetic & Growth Persona for high mood
  if (recentMood >= 4) {
    return {
      autoEnabled: true,
      mode: "energetic",
      label: "Đồng hành năng động",
      icon: "sparkles",
      hint: "Người dùng đang có tâm trạng rất tích cực (>=4/5). Trò chuyện vui tươi, truyền cảm hứng, cùng ăn mừng các cột mốc nhỏ và gợi ý các thử thách phát triển bản thân."
    };
  }

  // 4. Default Balanced Persona
  return {
    autoEnabled: true,
    mode: "balanced",
    label: "Cân bằng & Tự nhiên",
    icon: "spa",
    hint: "Trạng thái tâm lý cân bằng. Giữ tông giọng bạn bè tự nhiên, vừa thấu cảm vừa sẵn sàng tư vấn khi người dùng cần."
  };
}
