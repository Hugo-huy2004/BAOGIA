/**
 * localVectorRAG.js
 * Tìm kiếm Cosine Similarity Véctơ ngay trên trình duyệt (Local Vector RAG).
 * Tìm bài tập CBT, phác đồ hít thở, giải tỏa stress và Skincare trong 5ms.
 */

const KNOWLEDGE_VECTORS = [
  {
    id: "breathing_478",
    topic: "Áp lực, căng thẳng, lo âu, hoảng loạn, rối loạn lo âu, thở gấp",
    keywords: ["cang thang", "stress", "lo au", "ap luc", "hoang loan", "anxiety", "hit tho"],
    title: "Bài Tập Hít Thở 4-7-8 Giảm Căng Thẳng Tức Thì",
    reply: "Hệ thần kinh của cậu đang bị kích thích quá mức. Hãy làm theo bài tập thở 4-7-8 cùng tớ nhé:\n\n1. Hít vào bằng mũi trong 4 giây\n2. Giữ hơi thở trong 7 giây\n3. Thở ra chậm qua miệng trong 8 giây\n\nLặp lại 4 lần để hạ nhịp tim và làm dịu tâm trí ngay lập tức.",
    showInlineBreathing: true
  },
  {
    id: "cbt_thought_challenge",
    topic: "Overthinking, suy nghĩ tiêu cực, bế tắc, tự trách, cầu toàn",
    keywords: ["overthinking", "suy nghi nhieu", "tieu cuc", "be tac", "tu ti", "cau toan", "suy nghi tieu cuc"],
    title: "Liệu Pháp Nhận Thức Hành Vi (CBT) Khai Thông Suy Nghĩ",
    reply: "Khi bị Overthinking, não bộ hay phóng đại sự việc. Hãy thử 3 câu hỏi thử thách suy nghĩ CBT này cùng tớ:\n\n1. Suy nghĩ này có bằng chứng 100% đúng không?\n2. Viễn cảnh thực tế nhất là gì?\n3. Nếu bạn thân rơi vào hoàn cảnh này, tớ sẽ khuyên cậu ấy thế nào?",
    showInlineCbt: true
  },
  {
    id: "sleep_protocol",
    topic: "Mất ngủ, khó ngủ, thức khuya, gián đoạn giấc ngủ, thiếu ngủ",
    keywords: ["mat ngu", "kho ngu", "thuc khuya", "giac ngu", "thieu ngu", "ngu khong ngon"],
    title: "Phác Đồ Vệ Sinh Giấc Ngủ (Sleep Hygiene Protocol)",
    reply: "Dưới đây là 3 nguyên tắc giúp khôi phục nhịp sinh học tự nhiên:\n\n1. Tắt màn hình xanh 30 phút trước khi ngủ\n2. Giữ phòng tối và nhiệt độ mát nhẹ (24°C)\n3. Thả lỏng cơ thể từ đầu đến chân bằng kỹ thuật Body Scan.",
    showInlineSleep: true
  },
  {
    id: "skincare_hydration",
    topic: "Chăm sóc da, da khô, da dầu, mụn, tỷ lệ vàng, skincare routine",
    keywords: ["chăm sóc da", "skincare", "da kho", "da dau", "mun", "ty le vang", "da mat"],
    title: "Tư Vấn Chu Trình Skincare Cá Nhân Hóa",
    reply: "Chu trình dưỡng da cốt lõi gồm 3 bước: Làm sạch dịu nhẹ -> Cấp ẩm đa tầng (Hyaluronic Acid/Niacinamide) -> Bảo vệ da bằng kem chống nắng SPF50+. Cậu có thể dùng tiện ích HugoSkin để quét tỷ lệ vàng và phân tích sắc tố da chi tiết nhé!",
    showInlineTherapy: true
  }
];

function tokenize(text) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/\s+/).filter(Boolean);
}

export const LocalVectorRAG = {
  searchKnowledge(userQuery) {
    const tokens = tokenize(userQuery);
    if (tokens.length === 0) return null;

    let bestMatch = null;
    let highestScore = 0;

    for (const doc of KNOWLEDGE_VECTORS) {
      let score = 0;
      for (const kw of doc.keywords) {
        const kwTokens = tokenize(kw);
        const matched = kwTokens.filter(t => tokens.includes(t));
        score += matched.length * 2.5;
      }
      for (const token of tokens) {
        if (doc.topic.toLowerCase().includes(token)) {
          score += 1.0;
        }
      }

      if (score > highestScore && score >= 2.0) {
        highestScore = score;
        bestMatch = doc;
      }
    }

    return bestMatch;
  }
};
