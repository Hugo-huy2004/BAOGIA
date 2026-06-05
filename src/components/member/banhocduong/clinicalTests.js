export const CLINICAL_TESTS = {
  phq9: {
    id: "phq9",
    name: "Đánh giá Trầm cảm PHQ-9",
    questions: [
      "Mức độ hứng thú và niềm vui của cậu đối với các hoạt động học tập, giải trí dạo gần đây bị suy giảm rõ rệt.",
      "Tần suất cậu thấy tâm trạng mình chùng xuống, cảm giác u sầu, tẻ nhạt hoặc trống rỗng tuyệt vọng.",
      "Giấc ngủ bị xáo trộn thất thường (cậu khó vào giấc, hay giật mình thức giấc giữa đêm, hoặc ngủ mê mệt li bì).",
      "Cơ thể cậu phản hồi với trạng thái uể oải, cạn kiệt sinh lực ngay cả khi không làm việc nặng.",
      "Khẩu vị thay đổi rõ rệt (cậu chán ăn, ăn không ngon miệng hoặc ngược lại ăn quá nhiều một cách mất kiểm soát).",
      "Cậu có xu hướng tự trách móc bản thân, tự phán xét mình thất bại hoặc làm gia đình thất vọng.",
      "Khả năng tập trung suy nghĩ dạo này thế nào (ví dụ lúc ôn bài học tập, đọc tài liệu hoặc nghe giảng)?",
      "Phản ứng vận động chậm chạp bất thường khiến người xung quanh nhận thấy; hoặc ngược lại cậu bồn chồn đứng ngồi không yên.",
      "Trong đầu xuất hiện những ý nghĩ muốn buông xuôi mọi thứ hoặc tự làm tổn thương mình để giải tỏa."
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
        desc: "Tâm trạng của cậu hiện tại khá **ổn định**, hầu như không có biểu hiện trầm cảm.\n\n💡 **Giải pháp & Lời khuyên:** Hãy tiếp tục duy trì lối sống tích cực, ăn uống điều độ và dành thời gian thư giãn. Cậu có thể tham gia bài tập **Đọc sách Trị liệu** trong thẻ Trị Liệu để duy trì năng lượng tích cực này nhé!" 
      };
      if (score <= 9) return { 
        severity: "Trầm cảm Nhẹ", 
        desc: "Cậu đang có một vài biểu hiện **trầm cảm nhẹ** (do áp lực học tập hoặc sinh hoạt tạm thời).\n\n💡 **Giải pháp & Lời khuyên:** Cậu cần chú ý cân bằng thời gian nghỉ ngơi, ngủ đủ giấc từ **7-8 tiếng** mỗi ngày và chia sẻ áp lực với bạn bè hoặc chuyên viên. Bài tập **Đọc sách Trị liệu** hoặc **Điều hòa nhịp thở 4-7-8** trong thẻ Trị Liệu đã được mở khóa để hỗ trợ cậu nhé." 
      };
      if (score <= 14) return { 
        severity: "Trầm cảm Vừa", 
        desc: "Mức độ trầm cảm ghi nhận ở mức **trung bình**. Cậu thường xuyên cảm thấy mệt mỏi, cạn kiệt năng lượng hoặc mất hứng thú.\n\n💡 **Giải pháp & Lời khuyên:** Cậu nên thực hành liệu pháp **Trị liệu Trầm cảm (CBT)** bằng cách viết nhật ký tích cực trong thẻ Trị Liệu. Hãy cố gắng không tự cô lập bản thân, tập thể dục nhẹ nhàng 15 phút và trò chuyện cùng Chuyên viên Đồng Hành thường xuyên hơn." 
      };
      if (score <= 19) return { 
        severity: "Trầm cảm Trung bình Nặng", 
        desc: "Biểu hiện trầm cảm khá rõ nét và **nặng nề**, ảnh hưởng lớn đến học tập và sinh hoạt của cậu.\n\n💡 **Giải pháp & Lời khuyên:** Hãy cam kết thực hành bài tập **Trị liệu Trầm cảm (CBT)** và **Ngồi Tĩnh Tâm** đều đặn mỗi ngày. Đồng thời, tớ khuyên cậu nên chủ động trò chuyện sâu hơn với **Chuyên viên Đồng Hành** hoặc liên hệ phòng tư vấn học đường để có điểm tựa nâng đỡ tinh thần nhé." 
      };
      return { 
        severity: "Trầm cảm Nặng", 
        desc: "Mức độ trầm cảm ghi nhận ở ngưỡng **nghiêm trọng lâm sàng**. Cậu có thể đang cảm thấy vô cùng bế tắc và bất an.\n\n⚠️ **QUAN TRỌNG:** Đây là dấu hiệu cảnh báo khẩn cấp. Hãy liên hệ ngay với **Chuyên viên Đồng Hành**, người thân hoặc cơ sở y tế gần nhất để được hỗ trợ chuyên sâu kịp thời. Hãy nhớ rằng cậu không đơn độc và luôn có tớ sẵn sàng hỗ trợ cậu." 
      };
    }
  },
  gad7: {
    id: "gad7",
    name: "Đánh giá Lo âu GAD-7",
    questions: [
      "Tần suất cậu cảm thấy bồn chồn, lo âu dồn dập đến mức căng thẳng thần kinh cực độ dạo gần đây.",
      "Tình trạng cậu thấy bất lực, không thể tự kiểm soát hoặc ngăn chặn sự lo lắng quá mức bộc phát.",
      "Cậu nhận thấy mình lo nghĩ quá nhiều về nhiều vấn đề khác nhau cùng lúc (học tập, sức khỏe, tương lai).",
      "Đầu óc cậu gặp khó khăn trong việc tìm kiếm cảm giác thư thái, khó thả lỏng và tĩnh tâm.",
      "Sự bồn chồn lo âu diễn ra ở mức độ khiến cậu cảm thấy khó có thể ngồi yên một chỗ.",
      "Cậu nhận thấy bản thân dễ bị kích động, nổi nóng hoặc dễ cáu gắt vô cớ vì những chuyện nhỏ.",
      "Cảm giác sợ hãi mơ hồ như thể có điều gì tồi tệ, không hay sắp sửa xảy ra với mình."
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
        desc: "Mức độ lo âu **tối thiểu**, tinh thần của cậu đang được kiểm soát rất tốt trước các áp lực bên ngoài." 
      };
      if (score <= 9) return { 
        severity: "Lo âu Nhẹ", 
        desc: "Cậu đang gặp tình trạng **lo âu nhẹ**, có thể xuất phát từ áp lực thi cử hoặc bài vở dồn dập.\n\n💡 **Giải pháp & Lời khuyên:** Hãy thực hành bài tập **Điều hòa nhịp thở 4-7-8** trong thẻ Trị Liệu để xoa dịu thần kinh tức thì. Cậu cũng nên chia nhỏ mục tiêu học tập để tránh bị choáng ngợp nhé." 
      };
      if (score <= 14) return { 
        severity: "Lo âu Vừa", 
        desc: "Lo âu ở mức **trung bình**. Cậu thường xuyên cảm thấy bồn chồn lo lắng, khó thả lỏng đầu óc hoặc dễ bị cáu gắt.\n\n💡 **Giải pháp & Lời khuyên:** Nên duy trì bài tập **Điều hòa nhịp thở 4-7-8** 2 lần mỗi ngày và tập **Ngồi Tĩnh Tâm** từ 10-15 phút trước khi ngủ để ổn định nhịp tim và thư giãn sóng não." 
      };
      return { 
        severity: "Lo âu Nặng", 
        desc: "Mức độ lo âu **nghiêm trọng lâm sàng**, gây ảnh hưởng xấu đến giấc ngủ và thể chất của cậu (tim đập nhanh, sợ hãi vô cớ).\n\n💡 **Giải pháp & Lời khuyên:** Hãy thực hiện ngay các bài tập **Điều hòa nhịp thở 4-7-8** để cắt cơn lo âu bộc phát. Cậu nên giảm bớt khối lượng học tập và thảo luận thêm với **Chuyên viên Đồng Hành** để tìm phương pháp tháo gỡ áp lực." 
      };
    }
  },
  who5: {
    id: "who5",
    name: "Chỉ số Hạnh phúc WHO-5",
    questions: [
      "Dạo này tớ thấy tinh thần mình vui vẻ, sảng khoái và tràn đầy năng lượng tích cực.",
      "Tớ cảm thấy lòng mình bình yên, nhẹ nhàng và thư thái trước mọi áp lực xung quanh.",
      "Cơ thể tớ năng động, tràn đầy sinh lực và sức sống dồi dào mỗi ngày.",
      "Mỗi sáng thức dậy, tớ thấy đầu óc tỉnh táo, sảng khoái sẵn sàng cho ngày mới.",
      "Tớ cảm nhận cuộc sống hàng ngày chứa đựng nhiều điều thú vị và ý nghĩa."
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
        desc: `Chỉ số sức khỏe tinh thần và cảm giác hạnh phúc của cậu ở mức **rất tốt** (${percentage}%).\n\n💡 **Giải pháp & Lời khuyên:** Hãy tiếp tục duy trì trạng thái tích cực này. Cậu có thể tham khảo chuyên mục **Đọc sách Trị liệu** để nuôi dưỡng tâm hồn thêm phong phú nhé!` 
      };
      return { 
        status: "Hạnh phúc thấp (Cần lưu ý)", 
        percent: percentage, 
        desc: `Chỉ số cảm nhận hạnh phúc của cậu hiện tại khá **thấp** (${percentage}%).\n\n💡 **Giải pháp & Lời khuyên:** Đầu óc cậu có thể đang bị quá tải và thiếu năng lượng tích cực. Hãy thực hành ngay liệu pháp **Ngồi Tĩnh Tâm** hoặc nghe nhạc tần số cao trong thẻ Trị Liệu để tái tạo năng lượng sống.` 
      };
    }
  },
  bigfive: {
    id: "bigfive",
    name: "Trắc nghiệm Nhân cách Big Five",
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
