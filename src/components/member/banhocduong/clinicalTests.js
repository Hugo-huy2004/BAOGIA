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
      if (score <= 4) return { 
        severity: "Bình thường / Tối thiểu", 
        desc: "Tâm trạng của em hiện tại khá **ổn định**, hầu như không có biểu hiện trầm cảm.\n\n💡 **Giải pháp & Lời khuyên:** Hãy tiếp tục duy trì lối sống tích cực, ăn uống điều độ và dành thời gian thư giãn. Em có thể tham gia bài tập **Đọc sách Trị liệu** trong thẻ Trị Liệu để duy trì năng lượng tích cực này nhé!" 
      };
      if (score <= 9) return { 
        severity: "Trầm cảm Nhẹ", 
        desc: "Em đang có một vài biểu hiện **trầm cảm nhẹ** (do áp lực học tập hoặc sinh hoạt tạm thời).\n\n💡 **Giải pháp & Lời khuyên:** Em cần chú ý cân bằng thời gian nghỉ ngơi, ngủ đủ giấc từ **7-8 tiếng** mỗi ngày và chia sẻ áp lực với bạn bè hoặc chuyên viên. Bài tập **Đọc sách Trị liệu** hoặc **Điều hòa nhịp thở 4-7-8** trong thẻ Trị Liệu đã được mở khóa để hỗ trợ em." 
      };
      if (score <= 14) return { 
        severity: "Trầm cảm Vừa", 
        desc: "Mức độ trầm cảm ghi nhận ở mức **trung bình**. Em thường xuyên cảm thấy mệt mỏi, cạn kiệt năng lượng hoặc mất hứng thú.\n\n💡 **Giải pháp & Lời khuyên:** Em nên thực hành liệu pháp **Trị liệu Trầm cảm (CBT)** bằng cách viết nhật ký tích cực trong thẻ Trị Liệu. Hãy cố gắng không tự cô lập bản thân, tập thể dục nhẹ nhàng 15 phút và trò chuyện cùng Chuyên viên Đồng Hành thường xuyên hơn." 
      };
      if (score <= 19) return { 
        severity: "Trầm cảm Trung bình Nặng", 
        desc: "Biểu hiện trầm cảm khá rõ nét và **nặng nề**, ảnh hưởng lớn đến học tập và sinh hoạt của em.\n\n💡 **Giải pháp & Lời khuyên:** Hãy cam kết thực hành bài tập **Trị liệu Trầm cảm (CBT)** và **Ngồi Tĩnh Tâm** đều đặn mỗi ngày. Đồng thời, tôi khuyên em nên chủ động trò chuyện sâu hơn với **Chuyên viên Đồng Hành** hoặc liên hệ phòng tư vấn học đường của trường để có điểm tựa nâng đỡ tinh thần nhé." 
      };
      return { 
        severity: "Trầm cảm Nặng", 
        desc: "Mức độ trầm cảm ghi nhận ở ngưỡng **nghiêm trọng lâm sàng**. Em có thể đang cảm thấy vô cùng bế tắc và bất an.\n\n⚠️ **QUAN TRỌNG:** Đây là dấu hiệu cảnh báo khẩn cấp. Hãy liên hệ ngay với **Chuyên viên Đồng Hành**, phụ huynh hoặc cơ sở y tế gần nhất để được hỗ trợ chuyên sâu kịp thời. Hãy nhớ rằng em không đơn độc và luôn có người sẵn sàng giúp đỡ em." 
      };
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
      if (score <= 4) return { 
        severity: "Bình thường / Tối thiểu", 
        desc: "Mức độ lo âu **tối thiểu**, tinh thần của em đang được kiểm soát rất tốt trước các áp lực bên ngoài." 
      };
      if (score <= 9) return { 
        severity: "Lo âu Nhẹ", 
        desc: "Em đang gặp tình trạng **lo âu nhẹ**, có thể xuất phát từ áp lực thi cử hoặc bài vở dồn dập.\n\n💡 **Giải pháp & Lời khuyên:** Hãy thực hành bài tập **Điều hòa nhịp thở 4-7-8** trong thẻ Trị Liệu để xoa dịu thần kinh tức thì. Em cũng nên chia nhỏ mục tiêu học tập để tránh bị choáng ngợp nhé." 
      };
      if (score <= 14) return { 
        severity: "Lo âu Vừa", 
        desc: "Lo âu ở mức **trung bình**. Em thường xuyên cảm thấy bồn chồn lo lắng, khó thả lỏng đầu óc hoặc dễ bị cáu gắt.\n\n💡 **Giải pháp & Lời khuyên:** Nên duy trì bài tập **Điều hòa nhịp thở 4-7-8** 2 lần mỗi ngày và tập **Ngồi Tĩnh Tâm** từ 10-15 phút trước khi ngủ để ổn định nhịp tim và thư giãn sóng não." 
      };
      return { 
        severity: "Lo âu Nặng", 
        desc: "Mức độ lo âu **nghiêm trọng lâm sàng**, gây ảnh hưởng xấu đến giấc ngủ và thể chất của em (tim đập nhanh, sợ hãi vô cớ).\n\n💡 **Giải pháp & Lời khuyên:** Hãy thực hiện ngay các bài tập **Điều hòa nhịp thở 4-7-8** để cắt cơn lo âu bộc phát. Cậu nên giảm bớt khối lượng học tập và thảo luận thêm với **Chuyên viên Đồng Hành** để tìm phương pháp tháo gỡ áp lực." 
      };
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
      if (percentage >= 50) return { 
        status: "Hạnh phúc tốt", 
        percent: percentage, 
        desc: `Chỉ số sức khỏe tinh thần và cảm giác hạnh phúc của em ở mức **rất tốt** (${percentage}%).\n\n💡 **Giải pháp & Lời khuyên:** Hãy tiếp tục duy trì trạng thái tích cực này. Em có thể tham khảo chuyên mục **Đọc sách Trị liệu** để nuôi dưỡng tâm hồn thêm phong phú nhé!` 
      };
      return { 
        status: "Hạnh phúc thấp (Cần lưu ý)", 
        percent: percentage, 
        desc: `Chỉ số cảm nhận hạnh phúc của em hiện tại khá **thấp** (${percentage}%).\n\n💡 **Giải pháp & Lời khuyên:** Đầu óc em có thể đang bị quá tải và thiếu năng lượng tích cực. Hãy thực hành ngay liệu pháp **Ngồi Tĩnh Tâm** hoặc nghe nhạc tần số cao trong thẻ Trị Liệu để tái tạo năng lượng sống.` 
      };
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
        desc: `Hướng ngoại: **${extraversion}/5** • Dễ chịu: **${agreeableness}/5** • Tận tụy: **${conscientiousness}/5** • Nhạy cảm: **${neuroticism}/5** • Cởi mở: **${openness}/5**.`
      };
    }
  }
};
