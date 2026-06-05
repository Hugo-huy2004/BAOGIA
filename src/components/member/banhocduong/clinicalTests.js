export const CLINICAL_TESTS = {
  phq9: {
    id: "phq9",
    name: "Đánh giá Trầm cảm PHQ-9",
    questions: [
      "Ít hứng thú hoặc niềm vui trong việc thực hiện các hoạt động thường ngày.",
      "Cảm thấy xuống tinh thần, trầm cảm hoặc tuyệt vọng.",
      "Gặp khó khăn về giấc ngủ (khó ngủ, ngủ chập chọn hoặc ngủ quá nhiều).",
      "Cảm thấy mệt mỏi, uể oải hoặc thiếu năng lượng hoạt động.",
      "Ăn uống không ngon miệng hoặc ăn quá nhiều một cách mất kiểm soát.",
      "Cảm thấy tồi tệ về bản thân - tự trách mình là người thất bại hoặc làm gia đình thất vọng.",
      "Khó tập trung vào các công việc như học tập, đọc sách hay xem tivi.",
      "Nói hoặc di chuyển chậm chạp đến mức người khác nhận thấy; hoặc ngược lại, bồn chồn đến mức đứng ngồi không yên.",
      "Có suy nghĩ muốn tự làm tổn thương bản thân hoặc thà chết đi cho nhẹ lòng."
    ],
    options: [
      { value: 0, label: "Không bao giờ" },
      { value: 1, label: "Vài ngày" },
      { value: 2, label: "Hơn một nửa số ngày" },
      { value: 3, label: "Gần như mỗi ngày" }
    ],
    getInterpretation: (score) => {
      if (score <= 4) return { severity: "Bình thường / Tối thiểu", desc: "Tâm trạng ổn định, hầu như không có biểu hiện trầm cảm." };
      if (score <= 9) return { severity: "Trầm cảm Nhẹ", desc: "Có một vài biểu hiện trầm cảm nhẹ, cần chú ý nghỉ ngơi và chia sẻ cảm xúc." };
      if (score <= 14) return { severity: "Trầm cảm Vừa", desc: "Mức độ trầm cảm trung bình, khuyên dùng liệu pháp trị liệu trầm cảm và thư giãn." };
      if (score <= 19) return { severity: "Trầm cảm Trung bình Nặng", desc: "Biểu hiện trầm cảm khá rõ nét, nên thực hành trị liệu hằng ngày và nói chuyện với chuyên gia." };
      return { severity: "Trầm cảm Nặng", desc: "Mức độ trầm cảm nghiêm trọng lâm sàng, cần liên hệ chuyên viên y tế hoặc tư vấn học đường ngay lập tức." };
    }
  },
  gad7: {
    id: "gad7",
    name: "Đánh giá Lo âu GAD-7",
    questions: [
      "Cảm thấy bồn chồn, lo lắng hoặc căng thẳng thần kinh cực độ.",
      "Không thể kiểm soát hoặc ngăn chặn sự lo lắng quá mức.",
      "Lo lắng quá nhiều về nhiều vấn đề khác nhau trong cuộc sống/học tập.",
      "Khó khăn trong việc thả lỏng và thư giãn đầu óc.",
      "Cực kỳ bồn chồn lo âu đến mức khó có thể ngồi yên một chỗ.",
      "Dễ bị cáu gắt, nổi nóng hoặc phật ý vì những chuyện nhỏ.",
      "Cảm thấy sợ hãi vô cớ như thể có điều gì tồi tệ sắp sửa xảy ra."
    ],
    options: [
      { value: 0, label: "Không bao giờ" },
      { value: 1, label: "Vài ngày" },
      { value: 2, label: "Hơn một nửa số ngày" },
      { value: 3, label: "Gần như mỗi ngày" }
    ],
    getInterpretation: (score) => {
      if (score <= 4) return { severity: "Bình thường / Tối thiểu", desc: "Mức độ lo âu tối thiểu, tinh thần kiểm soát tốt." };
      if (score <= 9) return { severity: "Lo âu Nhẹ", desc: "Lo âu nhẹ, có thể do áp lực học tập tạm thời. Nên thực hành thở 4-7-8." };
      if (score <= 14) return { severity: "Lo âu Vừa", desc: "Lo âu vừa phải, khuyên cậu nên tập thở sâu và thư giãn đều đặn." };
      return { severity: "Lo âu Nặng", desc: "Lo âu nặng lâm sàng, ảnh hưởng xấu đến sinh hoạt, cần hỗ trợ y tế học đường sớm." };
    }
  },
  who5: {
    id: "who5",
    name: "Chỉ số Hạnh phúc WHO-5",
    questions: [
      "Tôi cảm thấy vui vẻ và tinh thần sảng khoái.",
      "Tôi cảm thấy bình tĩnh, nhẹ nhàng và thư thái.",
      "Tôi cảm thấy năng động, tràn đầy sinh lực và sức sống.",
      "Tôi thức dậy và cảm thấy tỉnh táo, sảng khoái đầu óc.",
      "Cuộc sống hàng ngày của tôi chứa đầy những điều thú vị và ý nghĩa."
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
      if (percentage >= 50) return { status: "Hạnh phúc tốt", percent: percentage, desc: `Chỉ số sức khỏe tinh thần và cảm giác hạnh phúc của cậu rất tốt (${percentage}%).` };
      return { status: "Hạnh phúc thấp (Cần lưu ý)", percent: percentage, desc: `Chỉ số hạnh phúc khá thấp (${percentage}%), khuyên cậu thực hành ngồi tĩnh tâm để phục hồi năng lượng.` };
    }
  },
  bigfive: {
    id: "bigfive",
    name: "Trắc nghiệm Nhân cách Big Five",
    questions: [
      "Tôi thấy mình là người hướng ngoại, năng động, thích giao thiệp rộng.",
      "Tôi thấy mình là người hay hoài nghi, dễ gây tranh cãi với người khác.",
      "Tôi thấy mình là người chu đáo, đáng tin cậy, tự giác và kỷ luật.",
      "Tôi thấy mình là người dễ lo âu, nhạy cảm và dễ bị kích động cảm xúc.",
      "Tôi thấy mình là người cởi mở với trải nghiệm mới, giàu trí tưởng tượng.",
      "Tôi thấy mình là người kín đáo, trầm lặng và ít nói.",
      "Tôi thấy mình là người biết cảm thông, ấm áp và có lòng trắc ẩn.",
      "Tôi thấy mình là người hay cẩu thả, bừa bộn và thiếu ngăn nắp.",
      "Tôi thấy mình là người bình tĩnh, ổn định cảm xúc, ít khi lo lắng vô cớ.",
      "Tôi thấy mình là người thực tế, khuôn mẫu, không thích nghệ thuật bay bổng."
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
        desc: `Hướng ngoại: ${extraversion}/5 • Dễ chịu: ${agreeableness}/5 • Tận tụy: ${conscientiousness}/5 • Nhạy cảm: ${neuroticism}/5 • Cởi mở: ${openness}/5.`
      };
    }
  }
};
