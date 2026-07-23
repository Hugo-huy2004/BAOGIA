import { DASS21_QUESTION_POOL, MMPI_QUESTION_POOL, MMPI_SUPPLEMENTARY_QUESTION_POOL } from "./constants/testQuestions";

export const CLINICAL_TESTS = {
  mmpi30: {
    id: "mmpi30",
    name: "Sàng lọc nhân cách 30 câu",
    standard: "Thang Đo Tham Khảo Tự Nhận Thức",
    standardBadge: "Tham Khảo Tự Nhận Thức",
    disclaimer: "Kết quả mang tính tham khảo giúp nâng cao tự nhận thức bản thân, không phải cơ sở chẩn đoán hay điều trị y tế chuyên khoa.",
    questionPool: [...MMPI_QUESTION_POOL, ...MMPI_SUPPLEMENTARY_QUESTION_POOL].map(variants => variants.map(v => v.text)),
    questions: [...MMPI_QUESTION_POOL, ...MMPI_SUPPLEMENTARY_QUESTION_POOL].map(v => v[0].text),
    options: [
      { value: 1, label: "Đúng" },
      { value: 0, label: "Sai" }
    ],
    getInterpretation: () => {
       return { severity: "Đang phân tích...", desc: "Kết quả chi tiết được cung cấp qua Chat." };
    }
  },
  dass42: {
    id: "dass42",
    name: "Stress, Lo âu, Trầm cảm (DASS-42)",
    standard: "Thang Đo Tham Khảo Tự Nhận Thức",
    standardBadge: "Tham Khảo Tự Nhận Thức",
    disclaimer: "Kết quả mang tính tham khảo giúp nâng cao tự nhận thức bản thân, không phải cơ sở chẩn đoán hay điều trị y tế chuyên khoa.",
    questionPool: DASS21_QUESTION_POOL.map(variants => variants.map(v => v.text)),
    questions: DASS21_QUESTION_POOL.map(v => v[0].text),
    options: [
      { value: 0, label: "Không đúng" },
      { value: 1, label: "Thỉnh thoảng" },
      { value: 2, label: "Khá nhiều" },
      { value: 3, label: "Rất nhiều" }
    ],
    getInterpretation: (score) => {
       return { severity: "Đang phân tích...", desc: "Kết quả chi tiết được cung cấp qua Chat." };
    }
  },
  phq9: {
    id: "phq9",
    name: "Đánh giá Trầm cảm PHQ-9",
    standard: "Thang Đo Tham Khảo Tự Nhận Thức",
    standardBadge: "💡 Tham Khảo Tự Nhận Thức",
    disclaimer: "Kết quả mang tính tham khảo giúp nâng cao tự nhận thức bản thân, không phải cơ sở chẩn đoán hay điều trị y tế chuyên khoa.",
    questionPool: [
      [
        "Mức độ hứng thú và niềm vui của cậu đối với các hoạt động học tập, giải trí dạo gần đây bị suy giảm rõ rệt.",
        "Cậu dạo này có thấy chán nản, ít khi tìm thấy niềm vui trong học tập hay sở thích cũ không?",
        "Mức hứng thú của cậu với cuộc sống dạo gần đây thế nào, có bị giảm sút đi nhiều không cậu yêu?"
      ],
      [
        "Tần suất cậu thấy tâm trạng mình chùng xuống, cảm giác u sầu, tẻ nhạt hoặc trống rỗng tuyệt vọng.",
        "Cậu dạo gần đây có thường xuyên thấy trĩu nặng trong lòng, u sầu hay có cảm xúc tuyệt vọng không?",
        "Cảm giác buồn bã, trống trải hoặc chán nản kéo dài trong tâm trí cậu xuất hiện ở mức độ nào dạo này?"
      ],
      [
        "Giấc ngủ bị xáo trộn thất thường (cậu khó vào giấc, hay giật mình thức giấc giữa đêm, hoặc ngủ mê mệt li bì).",
        "Giấc ngủ của cậu dạo này ra sao (có bị khó ngủ, chập chờn hay ngủ quá nhiều không)?",
        "Cậu có hay gặp các vấn đề về giấc ngủ như thao thức mãi mới ngủ được hoặc ngủ li bì mệt mỏi không?"
      ],
      [
        "Cơ thể cậu phản hồi với trạng thái uể oải, cạn kiệt sinh lực ngay cả khi không làm việc nặng.",
        "Cậu dạo này có thường thấy người mỏi mệt, thiếu sức sống và cạn kiệt năng lượng hoạt động không?",
        "Tình trạng thể chất của cậu dạo này có hay bị uể oải, rã rời dù không vận động gì nhiều không?"
      ],
      [
        "Khẩu vị thay đổi rõ rệt (cậu chán ăn, ăn không ngon miệng hoặc ngược lại ăn quá nhiều một cách mất kiểm soát).",
        "Cậu ăn uống dạo này thế nào, có bị chán ăn mất ngon hay lại ăn quá nhiều để giải tỏa không?",
        "Thói quen ăn uống của cậu dạo này có thay đổi bất thường (ăn quá ít hay thèm ăn vô tội vạ) không?"
      ],
      [
        "Cậu có xu hướng tự trách móc bản thân, tự phán xét mình thất bại hoặc làm gia đình thất vọng.",
        "Cậu có hay suy nghĩ tiêu cực về bản thân, tự trách mình kém cỏi hoặc cảm thấy mình là gánh nặng không?",
        "Tần suất cậu tự phán xét bản thân là người thất bại hoặc làm cho những người thân yêu thất vọng dạo này."
      ],
      [
        "Khả năng tập trung suy nghĩ dạo này thế nào (ví dụ lúc ôn bài học tập, đọc tài liệu hoặc nghe giảng)?",
        "Cậu có thấy khó tập trung đầu óc khi làm việc, học tập hoặc khi đọc sách báo dạo gần đây không?",
        "Đầu óc cậu dạo này có hay bị phân tâm, khó chú ý lắng nghe hay hoàn thành bài vở không?"
      ],
      [
        "Phản ứng vận động chậm chạp bất thường khiến người xung quanh nhận thấy; hoặc ngược lại cậu bồn chồn đứng ngồi không yên.",
        "Cậu có nhận thấy mình nói năng, đi lại chậm chạp hơn hẳn hoặc ngược lại bứt rứt, bồn chồn không ngừng không?",
        "Những cử chỉ, hành động của cậu dạo này có bị chậm đi rõ rệt hay lại cuống cuồng, đứng ngồi không yên?"
      ],
      [
        "Trong đầu xuất hiện những ý nghĩ muốn buông xuôi mọi thứ hoặc tự làm tổn thương mình để giải tỏa.",
        "Cậu dạo gần đây có từng xuất hiện suy nghĩ muốn tự giải thoát hoặc làm đau bản thân không?",
        "Những ý nghĩ muốn buông bỏ tất cả hoặc tự làm hại chính mình có thỉnh thoảng thoáng qua đầu cậu không?"
      ]
    ],
    // Fallback static array for compatibility
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
    standard: "Thang Đo Tham Khảo Tự Nhận Thức",
    standardBadge: "💡 Tham Khảo Tự Nhận Thức",
    disclaimer: "Kết quả mang tính tham khảo giúp nâng cao tự nhận thức bản thân, không phải cơ sở chẩn đoán hay điều trị y tế chuyên khoa.",
    questionPool: [
      [
        "Tần suất cậu cảm thấy bồn chồn, lo âu dồn dập đến mức căng thẳng thần kinh cực độ dạo gần đây.",
        "Cậu có hay bị cảm giác đứng ngồi không yên, lo lắng dồn dập làm đầu óc căng như dây đàn không?",
        "Mức độ cậu cảm thấy bồn chồn lo âu, thần kinh căng thẳng đến mức khó chịu dạo này thế nào?"
      ],
      [
        "Tình trạng cậu thấy bất lực, không thể tự kiểm soát hoặc ngăn chặn sự lo lắng quá mức bộc phát.",
        "Cậu có thấy mình không cách nào ngăn nổi những suy nghĩ lo âu cứ tự động tuôn ra trong đầu không?",
        "Tần suất cậu cảm thấy đầu hàng, hoàn toàn bất lực trong việc kiềm chế nỗi lo âu của bản thân."
      ],
      [
        "Cậu nhận thấy mình lo nghĩ quá nhiều về nhiều vấn đề khác nhau cùng lúc (học tập, sức khỏe, tương lai).",
        "Đầu óc cậu dạo này có bị quá tải vì lo lắng lung tung hết chuyện này đến chuyện khác không?",
        "Mức độ cậu thường xuyên suy nghĩ lan man, lo lắng đủ thứ việc từ học hành đến cuộc sống hàng ngày."
      ],
      [
        "Đầu óc cậu gặp khó khăn trong việc tìm kiếm cảm giác thư thái, khó thả lỏng và tĩnh tâm.",
        "Cậu có thấy rất khó để cho đầu óc mình được lắng xuống, thư thái và bình yên không?",
        "Tần suất cậu cảm thấy tâm trí mình luôn trong trạng thái căng thẳng, không thể thả lỏng nổi dạo này."
      ],
      [
        "Sự bồn chồn lo âu diễn ra ở mức độ khiến cậu cảm thấy khó có thể ngồi yên một chỗ.",
        "Cơn lo lắng dạo này có khiến cậu bứt rứt, cứ phải đi lại hoặc không thể ngồi yên được không?",
        "Cậu có thấy cơ thể mình bồn chồn đến mức đứng ngồi không yên vì tâm trạng lo âu không?"
      ],
      [
        "Cậu nhận thấy bản thân dễ bị kích động, nổi nóng hoặc dễ cáu gắt vô cớ vì những chuyện nhỏ.",
        "Tâm trạng cậu dạo này có dễ bị châm ngòi, hay bực bội hoặc nổi cáu vì những điều nhỏ nhặt không?",
        "Mức độ cậu dễ mất bình tĩnh, cáu gắt vô cớ với mọi người xung quanh dạo gần đây ra sao?"
      ],
      [
        "Cảm giác sợ hãi mơ hồ như thể có điều gì tồi tệ, không hay sắp sửa xảy ra với mình.",
        "Cậu có hay bị nỗi sợ vô hình đeo bám, cứ lo lắng có chuyện xui xẻo sắp ập xuống đầu mình không?",
        "Cảm giác bất an, sợ hãi mơ hồ rằng sắp có tai ương hay điều tồi tệ xảy ra xuất hiện nhiều không cậu?"
      ]
    ],
    // Fallback static array
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
    questionPool: [
      [
        "Dạo này tớ thấy tinh thần mình vui vẻ, sảng khoái và tràn đầy năng lượng tích cực.",
        "Thời gian qua cậu có cảm thấy tinh thần sảng khoái, vui tươi và ngập tràn năng lượng sống không?",
        "Cậu có thường trải qua những khoảnh khắc vui vẻ, tràn đầy sức sống và tinh thần lạc quan dạo này không?"
      ],
      [
        "Tớ cảm thấy lòng mình bình yên, nhẹ nhàng và thư thái trước mọi áp lực xung quanh.",
        "Cậu có hay cảm thấy tâm hồn mình được yên ả, thanh thản và thoải mái không?",
        "Tâm trí cậu dạo này có được bình yên, nhẹ nhàng và cân bằng trước cuộc sống không?"
      ],
      [
        "Cơ thể tớ năng động, tràn đầy sinh lực và sức sống dồi dào mỗi ngày.",
        "Cậu thấy thể chất của mình dạo này có dẻo dai, năng động và tràn trề năng lượng không?",
        "Mỗi ngày trôi qua, cậu có cảm thấy cơ thể dồi dào sức sống và năng nổ hoạt động không?"
      ],
      [
        "Mỗi sáng thức dậy, tớ thấy đầu óc tỉnh táo, sảng khoái sẵn sàng cho ngày mới.",
        "Khi thức giấc vào buổi sáng, cậu có thấy tinh thần minh mẫn, tỉnh táo và dễ chịu không?",
        "Buổi sáng mở mắt ra, cậu có đón nhận ngày mới bằng sự tỉnh táo và hứng khởi không?"
      ],
      [
        "Tớ cảm nhận cuộc sống hàng ngày chứa đựng nhiều điều thú vị và ý nghĩa.",
        "Cậu có thấy cuộc sống quanh mình ngập tràn những điều thú vị, bổ ích và đáng sống không?",
        "Hàng ngày, cậu có cảm nhận được ý nghĩa và những điều tốt đẹp từ các việc mình làm không?"
      ]
    ],
    // Fallback static array
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
    questionPool: [
      [
        "Tớ thấy mình là người hướng ngoại, thích kết bạn và chủ động giao thiệp rộng.",
        "Tớ là người khá cởi mở, thích kết nối với mọi người và tích cực tham gia các hoạt động tập thể.",
        "Tớ cảm thấy mình hướng ngoại, thích trò chuyện và dễ dàng hòa nhập vào đám đông."
      ],
      [
        "Tớ hay hoài nghi người khác, đôi khi dễ xảy ra tranh cãi để bảo vệ quan điểm.",
        "Tớ có xu hướng nghi ngờ động cơ của người khác và sẵn sàng tranh luận nảy lửa khi bất đồng ý kiến.",
        "Tớ hay đề phòng xung quanh và đôi khi cự cãi khá gay gắt để bảo vệ lập trường của mình."
      ],
      [
        "Tớ là người chu đáo, tự giác, luôn giữ kỷ luật và đáng tin cậy trong mọi việc.",
        "Tớ làm việc rất cẩn thận, có trách nhiệm, luôn tôn trọng giờ giấc và kỷ luật bản thân.",
        "Tớ tự thấy mình ngăn nắp, đáng tin cậy và luôn hoàn thành nhiệm vụ một cách chỉn chu."
      ],
      [
        "Tớ dễ bị lo lắng, nhạy cảm trước ý kiến người khác và dễ dao động cảm xúc.",
        "Tâm trạng tớ rất dễ bị ảnh hưởng bởi lời người khác nói, dễ lo âu và thất thường cảm xúc.",
        "Tớ là người nhạy cảm, hay suy nghĩ nhiều, dễ lo lắng và xúc động trước các tình huống."
      ],
      [
        "Tớ thích khám phá những điều mới lạ, giàu trí tưởng tượng và cởi mở.",
        "Tớ rất tò mò về thế giới xung quanh, thích sáng tạo và hứng thú với các ý tưởng mới mẻ.",
        "Đầu óc tớ giàu trí tưởng tượng, thích nghệ thuật và luôn cởi mở đón nhận trải nghiệm mới."
      ],
      [
        "Tớ thích không gian yên tĩnh, trầm lặng và ít khi chủ động bắt chuyện trước.",
        "Tớ thiên về hướng nội, thích ở một mình và thường ngại là người mở lời trước trong cuộc đối thoại.",
        "Tớ cảm thấy thoải mái nhất khi ở không gian tĩnh lặng, không thích xã giao xô bồ."
      ],
      [
        "Tớ là người giàu lòng trắc ẩn, dễ cảm thông và luôn muốn nâng đỡ người khác.",
        "Tớ dễ xúc động trước hoàn cảnh của người khác, luôn sẵn lòng giúp đỡ và quan tâm họ nhiệt tình.",
        "Tớ có tấm lòng bao dung, hay đồng cảm và thích chia sẻ, nâng đỡ những người xung quanh."
      ],
      [
        "Tớ hay làm việc theo cảm hứng nhất thời, đôi lúc bừa bộn hoặc thiếu ngăn nắp.",
        "Tớ thường hành động ngẫu hứng, thỉnh thoảng hơi lười biếng hoặc để đồ đạc lộn xộn.",
        "Tớ dễ làm việc tùy hứng, không thích các quy trình gò bó và đôi khi thiếu tính tổ chức."
      ],
      [
        "Tớ giữ được sự bình tĩnh cao trước áp lực, ít khi lo lắng hoảng sợ vô cớ.",
        "Tớ có tinh thần thép trước khó khăn, rất hiếm khi bị rối trí hay mất kiểm soát cảm xúc.",
        "Tớ luôn vững vàng dưới áp lực cuộc sống, giữ được sự tĩnh tâm tốt và không dễ hoang mang."
      ],
      [
        "Tớ là người thực tế, ưa chuộng sự ổn định hơn là những thứ nghệ thuật bay bổng.",
        "Tớ thực tế, thích những gì rõ ràng, hữu dụng hơn là những ý tưởng trừu tượng hay nghệ thuật.",
        "Tớ trọng tính thực tế và ổn định, ít khi thả mình theo những mộng mơ bay bổng vô thực."
      ]
    ],
    // Fallback static array
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
