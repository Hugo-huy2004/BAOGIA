export const CLINICAL_TESTS = {
  phq9: {
    id: "phq9",
    name: "Sàng lọc triệu chứng PHQ-9",
    standard: "Thang Đo Tham Khảo Tự Nhận Thức",
    standardBadge: "💡 Tham Khảo Tự Nhận Thức",
    timeframe: "2 tuần vừa qua",
    sourceLabel: "PHQ Screeners / Pfizer",
    sourceUrl: "https://www.phqscreeners.com/",
    disclaimer: "PHQ-9 là công cụ sàng lọc triệu chứng, không tự xác lập chẩn đoán. Bản tiếng Việt trong HugoPSY là bản dịch sử dụng trong ứng dụng.",
    questions: [
      "Ít hứng thú hoặc ít thấy vui khi làm mọi việc.",
      "Cảm thấy buồn, chán nản hoặc vô vọng.",
      "Khó ngủ, ngủ không sâu hoặc ngủ quá nhiều.",
      "Cảm thấy mệt mỏi hoặc có ít năng lượng.",
      "Chán ăn hoặc ăn quá nhiều.",
      "Cảm thấy bản thân tệ, thất bại hoặc làm bản thân hay gia đình thất vọng.",
      "Khó tập trung vào việc như đọc tài liệu, học tập hoặc xem chương trình.",
      "Di chuyển hoặc nói chậm đến mức người khác có thể nhận thấy; hoặc ngược lại, bồn chồn và di chuyển nhiều hơn thường lệ.",
      "Có ý nghĩ rằng thà không còn sống hoặc muốn tự làm đau bản thân."
    ],
    options: [
      { value: 0, label: "Không hề" },
      { value: 1, label: "Vài ngày" },
      { value: 2, label: "Hơn một nửa số ngày" },
      { value: 3, label: "Gần như mỗi ngày" }
    ],
    getInterpretation: (score) => {
      if (score <= 4) return {
        severity: "Mức tối thiểu",
        desc: "Điểm số ghi nhận **ít triệu chứng trong 2 tuần qua**. Đây vẫn chỉ là kết quả sàng lọc, không phải kết luận về tình trạng sức khỏe."
      };
      if (score <= 9) return {
        severity: "Mức nhẹ",
        desc: "Điểm số nằm trong **khoảng triệu chứng nhẹ**. Cậu có thể tiếp tục theo dõi và cân nhắc trao đổi với chuyên gia nếu các khó khăn kéo dài hoặc ảnh hưởng sinh hoạt."
      };
      if (score <= 14) return {
        severity: "Mức vừa",
        desc: "Điểm số nằm trong **khoảng triệu chứng vừa**. Một chuyên gia đủ chuyên môn có thể giúp đánh giá thêm bối cảnh và mức ảnh hưởng đến cuộc sống."
      };
      if (score <= 19) return {
        severity: "Mức vừa–nặng",
        desc: "Điểm số nằm trong **khoảng triệu chứng vừa–nặng**. Cậu nên ưu tiên trao đổi với một chuyên gia đủ chuyên môn để được đánh giá trực tiếp."
      };
      return {
        severity: "Mức nặng",
        desc: "Điểm số nằm trong **khoảng triệu chứng nặng**. Kết quả không tự xác lập chẩn đoán, nhưng nên được trao đổi sớm với chuyên gia đủ chuyên môn."
      };
    }
  },
  gad7: {
    id: "gad7",
    name: "Sàng lọc triệu chứng GAD-7",
    standard: "Thang Đo Tham Khảo Tự Nhận Thức",
    standardBadge: "💡 Tham Khảo Tự Nhận Thức",
    timeframe: "2 tuần vừa qua",
    sourceLabel: "GAD-7 / Pfizer",
    sourceUrl: "https://www.phqscreeners.com/",
    disclaimer: "GAD-7 là công cụ sàng lọc triệu chứng lo âu, không tự xác lập chẩn đoán. Bản tiếng Việt trong HugoPSY là bản dịch sử dụng trong ứng dụng.",
    questions: [
      "Cảm thấy căng thẳng, lo âu hoặc bồn chồn.",
      "Không thể ngừng hoặc kiểm soát sự lo lắng.",
      "Lo lắng quá nhiều về những việc khác nhau.",
      "Khó thư giãn.",
      "Bồn chồn đến mức khó ngồi yên.",
      "Dễ khó chịu hoặc cáu gắt.",
      "Cảm thấy sợ như thể điều tồi tệ có thể xảy ra."
    ],
    options: [
      { value: 0, label: "Không hề" },
      { value: 1, label: "Vài ngày" },
      { value: 2, label: "Hơn một nửa số ngày" },
      { value: 3, label: "Gần như mỗi ngày" }
    ],
    getInterpretation: (score) => {
      if (score <= 4) return {
        severity: "Mức tối thiểu",
        desc: "Điểm số ghi nhận **ít triệu chứng lo âu trong 2 tuần qua**. Đây là kết quả sàng lọc, không phải chẩn đoán."
      };
      if (score <= 9) return {
        severity: "Mức nhẹ",
        desc: "Điểm số nằm trong **khoảng triệu chứng nhẹ**. Hãy tiếp tục theo dõi và tìm hỗ trợ nếu lo âu kéo dài hoặc ảnh hưởng sinh hoạt."
      };
      if (score <= 14) return {
        severity: "Mức vừa",
        desc: "Điểm số nằm trong **khoảng triệu chứng vừa**. Cậu có thể cân nhắc trao đổi với chuyên gia đủ chuyên môn để đánh giá thêm."
      };
      return {
        severity: "Mức nặng",
        desc: "Điểm số nằm trong **khoảng triệu chứng nặng**. Kết quả không tự xác lập chẩn đoán, nhưng nên được trao đổi sớm với chuyên gia đủ chuyên môn."
      };
    }
  },
  who5: {
    id: "who5",
    name: "Chỉ số trạng thái tinh thần WHO-5",
    timeframe: "2 tuần vừa qua",
    sourceLabel: "Tổ chức Y tế Thế giới, WHO-5 (2024)",
    sourceUrl: "https://www.who.int/publications/m/item/WHO-UCN-MSD-MHE-2024.01",
    disclaimer: "WHO-5 là công cụ tự báo cáo về trạng thái tinh thần, không phải chẩn đoán. Bản tiếng Việt trong HugoPSY là bản dịch không chính thức.",
    questions: [
      "Tớ cảm thấy vui vẻ và có tinh thần tốt.",
      "Tớ cảm thấy bình tĩnh và thư giãn.",
      "Tớ cảm thấy năng động và tràn đầy sinh lực.",
      "Khi thức dậy, tớ cảm thấy sảng khoái và được nghỉ ngơi.",
      "Cuộc sống hằng ngày của tớ có nhiều điều khiến tớ quan tâm."
    ],
    options: [
      { value: 5, label: "Mọi lúc" },
      { value: 4, label: "Hầu hết thời gian" },
      { value: 3, label: "Hơn một nửa thời gian" },
      { value: 2, label: "Dưới một nửa thời gian" },
      { value: 1, label: "Đôi khi" },
      { value: 0, label: "Không bao giờ" }
    ],
    getInterpretation: (score) => {
      const percentage = score * 4;
      if (percentage >= 50) return {
        status: "Không dưới ngưỡng gợi ý",
        percent: percentage,
        desc: `Điểm WHO-5 quy đổi của cậu là **${percentage}/100**. Điểm số không nằm dưới ngưỡng gợi ý 50, nhưng không thể tự khẳng định tình trạng sức khỏe tinh thần.`
      };
      return {
        status: "Dưới ngưỡng gợi ý",
        percent: percentage,
        desc: `Điểm WHO-5 quy đổi của cậu là **${percentage}/100**. WHO ghi nhận điểm dưới 50 từng được đề xuất làm dấu hiệu nên đánh giá thêm; đây không phải chẩn đoán.`
      };
    }
  },
  bigfive: {
    id: "bigfive",
    name: "Tự nhìn nhận Big Five · 10 mục",
    standard: "Công cụ tự quan sát, không lâm sàng",
    standardBadge: "Tự nhìn nhận",
    timeframe: "Cách cậu thường nhìn nhận bản thân",
    disclaimer: "Kết quả mô tả câu trả lời hiện tại theo năm nhóm đặc điểm. Đây không phải đánh giá lâm sàng và không phải nhãn tính cách cố định.",
    questions: [
      "Tớ thấy mình là người hướng ngoại, thích kết bạn và chủ động giao thiệp rộng.",
      "Tớ hay hoài nghi người khác, đôi khi dễ xảy ra tranh cãi để bảo vệ quan điểm.",
      "Tớ là người chu đáo, tự giác, luôn giữ kỷ luật và đáng tin cậy trong mọi việc.",
      "Tớ dễ bị lo lắng, nhạy cảm trước ý kiến người khác và dễ dao động cảm xúc.",
      "Tớ thích khám phá những điều mới lạ, giàu trí tưởng tượng và cởi mở.",
      "Tớ thích không gian yên tĩnh, trầm lặng và ít khi chủ động bắt chuyện trước.",
      "Tớ là người giàu lòng trắc ẩn, dễ cảm thông và luôn muốn nâng đỡ người khác.",
      "Tớ hay làm việc theo cảm hứng nhất thời, đôi lúc bừa bộn hoặc thiếu ngăn nắp.",
      "Tớ giữ được sự bình tĩnh cao trước áp lực, ít khi lo lắng hoảng sợ vô cớ.",
      "Tớ là người thực tế, ưa chuộng sự ổn định hơn là những thứ nghệ thuật bay bổng."
    ],
    options: [
      { value: 1, label: "Rất không đồng ý" },
      { value: 2, label: "Hơi không đồng ý" },
      { value: 3, label: "Bình thường" },
      { value: 4, label: "Hơi đồng ý" },
      { value: 5, label: "Rất đồng ý" }
    ],
    getInterpretation: (answers) => {
      const r = (val) => 6 - val; 
      const extraversion = ((answers[0] + r(answers[5])) / 2).toFixed(1);
      const agreeableness = ((answers[6] + r(answers[1])) / 2).toFixed(1);
      const conscientiousness = ((answers[2] + r(answers[7])) / 2).toFixed(1);
      const neuroticism = ((answers[3] + r(answers[8])) / 2).toFixed(1);
      const openness = ((answers[4] + r(answers[9])) / 2).toFixed(1);
      return {
        extraversion,
        agreeableness,
        conscientiousness,
        neuroticism,
        openness,
        desc: `Hướng ngoại: **${extraversion}/5** • Dễ chịu: **${agreeableness}/5** • Tận tụy: **${conscientiousness}/5** • Nhạy cảm: **${neuroticism}/5** • Cởi mở: **${openness}/5**.`
      };
    }
  }
};
