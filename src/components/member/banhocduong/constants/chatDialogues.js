// Tự động sinh ra bởi script
export const DIALOGUE_TREE = {
  aspects: [
    {
      id: "studying",
      text: "Tớ đang gặp áp lực lớn từ học tập và thi cử",
      reply: [
        `Tớ hiểu áp lực thi cử đó mà cậu yêu. Việc đối mặt với thi cử liên tục và khối lượng bài vở dồn dập rất dễ khiến tinh thần cậu bị căng thẳng quá mức. Có phải cậu đang cảm thấy lo lắng rằng kết quả không tốt sẽ làm bản thân hoặc gia đình thất vọng? Đừng sợ, có tớ ở đây bên cậu rồi.`,
        `Mình hiểu áp lực thi cử đó mà bạn nhé. Việc đối mặt với thi cử liên tục và khối lượng bài vở dồn dập rất dễ khiến tinh thần bạn bị căng thẳng quá mức. Có phải bạn đang cảm thấy lo lắng rằng kết quả không tốt sẽ làm bản thân hoặc gia đình thất vọng? Đừng sợ, có tớ ở đây bên bạn rồi.`,
        `AI hiểu áp lực thi cử đó mà bạn ơi. Việc đối mặt với thi cử liên tục và khối lượng bài vở dồn dập rất dễ khiến tinh thần bạn bị căng thẳng quá mức. Có phải bạn đang cảm thấy lo lắng rằng kết quả không tốt sẽ làm bản thân hoặc gia đình thất vọng? Đừng sợ, có tớ ở đây bên bạn rồi.`
      ],
      options: [
        {
          id: "study_fail",
          text: "Đúng thế cậu ơi, tớ rất sợ thi trượt và kết quả kém",
          followUp: [
        `Sự lo sợ thất bại học đường có thể gây sức ép đè nặng lên tinh thần cậu, tớ thương cậu nhiều lắm. Nỗi lo lắng này có xuất hiện thường xuyên đến mức làm cậu bị mất ngủ, bỏ bữa hay mất tập trung học tập suốt cả ngày không cậu?`,
        `Sự lo sợ thất bại học đường có thể gây sức ép đè nặng lên tinh thần bạn, tớ thương bạn nhiều lắm. Nỗi lo lắng này có xuất hiện thường xuyên đến mức làm bạn bị mất ngủ, bỏ bữa hay mất tập trung học tập suốt cả ngày không bạn?`,
        `Sự lo sợ thất bại học đường có thể gây sức ép đè nặng lên tinh thần bạn, tớ thương bạn nhiều lắm. Nỗi lo lắng này có xuất hiện thường xuyên đến mức làm bạn bị mất ngủ, bỏ bữa hay mất tập trung học tập suốt cả ngày không bạn?`
      ],
          severityOptions: [
            { id: "study_fail_high", text: "Có chứ, nỗi lo âu này lặp lại nhiều lần khiến tớ mất tập trung và kiệt quệ", nextAction: "recommend_test", test: "gad7", testLabel: "[GAD-7] Trắc nghiệm Lo âu" },
            { id: "study_fail_low", text: "Không quá nghiêm trọng đâu, tớ vẫn kiểm soát được nhưng đôi lúc thấy nản chí", nextAction: "direct_advice", advice: [
        `Áp lực học tập đôi khi là động lực nhưng cũng rất dễ làm ta kiệt sức cậu yêu nhé. Cậu hãy học cách chia nhỏ mục tiêu học tập, cho bản thân những khoảng nghỉ ngơi ngắn và hít thở sâu để điều hòa tinh thần cùng tớ nha.`,
        `Áp lực học tập đôi khi là động lực nhưng cũng rất dễ làm ta kiệt sức bạn nhé nhé. Cậu hãy học cách chia nhỏ mục tiêu học tập, cho bản thân những khoảng nghỉ ngơi ngắn và hít thở sâu để điều hòa tinh thần cùng tớ nha.`,
        `Áp lực học tập đôi khi là động lực nhưng cũng rất dễ làm ta kiệt sức bạn ơi nhé. Cậu hãy học cách chia nhỏ mục tiêu học tập, cho bản thân những khoảng nghỉ ngơi ngắn và hít thở sâu để điều hòa tinh thần cùng tớ nha.`
      ], quote: "Thành công không phải là cuối cùng, thất bại không phải là tử địa: đó là lòng dũng cảm để tiếp tục mới là quan trọng.", recommendedDays: 14 }
          ]
        },
        {
          id: "study_overload",
          text: "Không hẳn thế, tớ chỉ thấy quá tải vì khối lượng bài vở quá nhiều thôi",
          followUp: [
        `Lượng bài vở dồn dập khiến thời gian tự chăm sóc bản thân của cậu yêu bị thu hẹp lại. Cảm giác quá tải này có lặp đi lặp lại liên tục khiến cậu cảm thấy bế tắc, bất lực không kể tớ nghe nào?`,
        `Lượng bài vở dồn dập khiến thời gian tự chăm sóc bản thân của bạn nhé bị thu hẹp lại. Cảm giác quá tải này có lặp đi lặp lại liên tục khiến bạn cảm thấy bế tắc, bất lực không kể tớ nghe nào?`,
        `Lượng bài vở dồn dập khiến thời gian tự chăm sóc bản thân của bạn ơi bị thu hẹp lại. Cảm giác quá tải này có lặp đi lặp lại liên tục khiến bạn cảm thấy bế tắc, bất lực không kể tớ nghe nào?`
      ],
          severityOptions: [
            { id: "study_overload_high", text: "Có chứ, tớ cảm thấy bế tắc hoàn toàn trước đống bài vở và bài tập", nextAction: "recommend_test", test: "gad7", testLabel: "[GAD-7] Trắc nghiệm Lo âu" },
            { id: "study_overload_low", text: "Tớ chỉ thấy mệt lúc làm bài quá sức thôi, nghỉ ngơi đầy đủ sẽ đỡ hơn", nextAction: "direct_advice", advice: [
        `Quá tải bài vở là tình trạng phổ biến tuổi học trò mà cậu. Cậu nên học cách phân chia thời gian học tập khoa học hơn, ví dụ áp dụng phương pháp Pomodoro làm việc 25 phút và nghỉ 5 phút để bảo vệ sức khỏe nhé cậu yêu.`,
        `Quá tải bài vở là tình trạng phổ biến tuổi học trò mà bạn. Cậu nên học cách phân chia thời gian học tập khoa học hơn, ví dụ áp dụng phương pháp Pomodoro làm việc 25 phút và nghỉ 5 phút để bảo vệ sức khỏe nhé bạn nhé.`,
        `Quá tải bài vở là tình trạng phổ biến tuổi học trò mà bạn. Cậu nên học cách phân chia thời gian học tập khoa học hơn, ví dụ áp dụng phương pháp Pomodoro làm việc 25 phút và nghỉ 5 phút để bảo vệ sức khỏe nhé bạn ơi.`
      ], quote: "Cách tốt nhất để bắt đầu là ngừng nói và bắt đầu làm.", recommendedDays: 7 }
          ]
        }
      ]
    },
    {
      id: "family",
      text: "Tớ thấy ngột ngạt vì các vấn đề gia đình",
      reply: [
        `Tớ ôm cậu một cái thật chặt nhé. Tớ rất hiểu và chia sẻ với những gì cậu đang trải qua. Áp lực từ sự kỳ vọng hay những bất đồng ý kiến từ cha mẹ thực sự dễ gây tổn thương sâu sắc cho cậu. Có phải cậu cảm thấy thiếu sự lắng nghe và thấu hiểu từ những người thân yêu nhất?`,
        `Mình ôm bạn một cái thật chặt nhé. Mình rất hiểu và chia sẻ với những gì bạn đang trải qua. Áp lực từ sự kỳ vọng hay những bất đồng ý kiến từ cha mẹ thực sự dễ gây tổn thương sâu sắc cho bạn. Có phải bạn cảm thấy thiếu sự lắng nghe và thấu hiểu từ những người thân nhé nhất?`,
        `AI ôm bạn một cái thật chặt nhé. AI rất hiểu và chia sẻ với những gì bạn đang trải qua. Áp lực từ sự kỳ vọng hay những bất đồng ý kiến từ cha mẹ thực sự dễ gây tổn thương sâu sắc cho bạn. Có phải bạn cảm thấy thiếu sự lắng nghe và thấu hiểu từ những người thân ơi nhất?`
      ],
      options: [
        {
          id: "family_lonely",
          text: "Đúng vậy cậu ạ, tớ cảm thấy cô độc ngay trong chính ngôi nhà của mình",
          followUp: [
        `Cảm giác đơn độc trong chính ngôi nhà của mình là một trải nghiệm đau lòng vô cùng, cậu của tớ đã vất vả rồi. Sự cô độc này có kéo dài liên tục làm cậu thu mình lại, không muốn trò chuyện hay kết nối với bất kỳ ai nữa không cậu yêu?`,
        `Cảm giác đơn độc trong chính ngôi nhà của mình là một trải nghiệm đau lòng vô cùng, bạn của tớ đã vất vả rồi. Sự cô độc này có kéo dài liên tục làm bạn thu mình lại, không muốn trò chuyện hay kết nối với bất kỳ ai nữa không bạn nhé?`,
        `Cảm giác đơn độc trong chính ngôi nhà của mình là một trải nghiệm đau lòng vô cùng, bạn của tớ đã vất vả rồi. Sự cô độc này có kéo dài liên tục làm bạn thu mình lại, không muốn trò chuyện hay kết nối với bất kỳ ai nữa không bạn ơi?`
      ],
          severityOptions: [
            { id: "family_lonely_high", text: "Có chứ, tớ hầu như luôn thu mình lại và cảm thấy lạc lõng sâu sắc", nextAction: "recommend_test", test: "phq9", testLabel: "[PHQ-9] Trắc nghiệm Trầm cảm" },
            { id: "family_lonely_low", text: "Chỉ là đôi khi tớ cảm thấy bị ngột ngạt thôi, thỉnh thoảng vẫn giãi bày được với bạn bè", nextAction: "direct_advice", advice: [
        `Gia đình là chỗ dựa quan trọng nhưng khi gặp bất đồng, cậu có thể tìm kiếm điểm tựa tinh thần lành mạnh từ bạn bè thân thiết hoặc ghi nhật ký để giải tỏa bớt những dồn nén trong lòng nha cậu yêu. Tớ luôn coi cậu như người nhà.`,
        `Gia đình là chỗ dựa quan trọng nhưng khi gặp bất đồng, bạn có thể tìm kiếm điểm tựa tinh thần lành mạnh từ bạn bè thân thiết hoặc ghi nhật ký để giải tỏa bớt những dồn nén trong lòng nha bạn nhé. Mình luôn coi bạn như người nhà.`,
        `Gia đình là chỗ dựa quan trọng nhưng khi gặp bất đồng, bạn có thể tìm kiếm điểm tựa tinh thần lành mạnh từ bạn bè thân thiết hoặc ghi nhật ký để giải tỏa bớt những dồn nén trong lòng nha bạn ơi. AI luôn coi bạn như người nhà.`
      ], quote: "Không có ai cô độc khi họ biết tự yêu thương và trân trọng bản thân mình.", recommendedDays: 14 }
          ]
        },
        {
          id: "family_conflict",
          text: "Gia đình thường xuyên xảy ra tranh cãi căng thẳng khiến tớ mệt mỏi",
          followUp: [
        `Bầu không khí căng thẳng thường trực trong gia đình dễ bào mòn năng lượng tinh thần của cậu lắm. Những cuộc tranh cãi này có diễn ra liên tục khiến cậu luôn bất an, tim đập nhanh hay sợ hãi mỗi khi ở nhà không cậu yêu của tớ?`,
        `Bầu không khí căng thẳng thường trực trong gia đình dễ bào mòn năng lượng tinh thần của bạn lắm. Những cuộc tranh cãi này có diễn ra liên tục khiến bạn luôn bất an, tim đập nhanh hay sợ hãi mỗi khi ở nhà không bạn nhé của tớ?`,
        `Bầu không khí căng thẳng thường trực trong gia đình dễ bào mòn năng lượng tinh thần của bạn lắm. Những cuộc tranh cãi này có diễn ra liên tục khiến bạn luôn bất an, tim đập nhanh hay sợ hãi mỗi khi ở nhà không bạn ơi của tớ?`
      ],
          severityOptions: [
            { id: "family_conflict_high", text: "Có chứ, không khí gia đình vô cùng căng thẳng khiến tớ thường xuyên bất an, hoảng sợ", nextAction: "recommend_test", test: "phq9", testLabel: "[PHQ-9] Trắc nghiệm Trầm cảm" },
            { id: "family_conflict_low", text: "Thỉnh thoảng mới tranh cãi lớn, khi mọi chuyện lắng xuống tớ thấy ổn hơn", nextAction: "direct_advice", advice: [
        `Khi gia đình xảy ra xung đột, việc bảo vệ không gian bình yên trong tâm trí cậu là ưu tiên hàng đầu của tớ. Hãy tránh tranh luận trực tiếp khi cơn nóng giận của mọi người đang ở đỉnh điểm nha cậu.`,
        `Khi gia đình xảy ra xung đột, việc bảo vệ không gian bình yên trong tâm trí bạn là ưu tiên hàng đầu của tớ. Hãy tránh tranh luận trực tiếp khi cơn nóng giận của mọi người đang ở đỉnh điểm nha bạn.`,
        `Khi gia đình xảy ra xung đột, việc bảo vệ không gian bình yên trong tâm trí bạn là ưu tiên hàng đầu của tớ. Hãy tránh tranh luận trực tiếp khi cơn nóng giận của mọi người đang ở đỉnh điểm nha bạn.`
      ], quote: "Hòa bình bắt đầu bằng một nụ cười và sự thấu hiểu từ bên trong.", recommendedDays: 7 }
          ]
        }
      ]
    },
    {
      id: "relationships",
      text: "Tớ gặp phiền muộn trong tình cảm hoặc bạn bè",
      reply: [
        `Những tổn thương và rạn nứt trong các mối quan hệ xã hội luôn khiến tớ xót xa khi nhìn cậu chịu đựng. Nó thường để lại những cảm xúc hụt hẫng, bứt rứt khó chịu. Hiện tại cậu đang cảm thấy bị cô lập hay có sự hiểu lầm nào chưa thể tháo gỡ được?`,
        `Những tổn thương và rạn nứt trong các mối quan hệ xã hội luôn khiến tớ xót xa khi nhìn bạn chịu đựng. Nó thường để lại những cảm xúc hụt hẫng, bứt rứt khó chịu. Hiện tại bạn đang cảm thấy bị cô lập hay có sự hiểu lầm nào chưa thể tháo gỡ được?`,
        `Những tổn thương và rạn nứt trong các mối quan hệ xã hội luôn khiến tớ xót xa khi nhìn bạn chịu đựng. Nó thường để lại những cảm xúc hụt hẫng, bứt rứt khó chịu. Hiện tại bạn đang cảm thấy bị cô lập hay có sự hiểu lầm nào chưa thể tháo gỡ được?`
      ],
      options: [
        {
          id: "rel_isolated",
          text: "Đúng thế cậu ạ, tớ cảm thấy lạc lõng và bị cô lập",
          followUp: [
        `Bị cô lập hoặc không được tập thể chấp nhận đem lại nỗi buồn rất lớn cho một người ngoan như cậu. Tình trạng này có diễn ra lâu ngày làm cậu hoài nghi giá trị bản thân hay chán ghét việc đến trường không cậu?`,
        `Bị cô lập hoặc không được tập thể chấp nhận đem lại nỗi buồn rất lớn cho một người ngoan như bạn. Tình trạng này có diễn ra lâu ngày làm bạn hoài nghi giá trị bản thân hay chán ghét việc đến trường không bạn?`,
        `Bị cô lập hoặc không được tập thể chấp nhận đem lại nỗi buồn rất lớn cho một người ngoan như bạn. Tình trạng này có diễn ra lâu ngày làm bạn hoài nghi giá trị bản thân hay chán ghét việc đến trường không bạn?`
      ],
          severityOptions: [
            { id: "rel_isolated_high", text: "Có chứ, tớ thấy vô cùng lạc lõng và chán nản việc đi học mỗi ngày", nextAction: "recommend_test", test: "who5", testLabel: "[WHO-5] Đo chỉ số Hạnh phúc" },
            { id: "rel_isolated_low", text: "Tớ vẫn có những người bạn khác bên ngoài nhưng vẫn buồn vì chuyện này", nextAction: "direct_advice", advice: [
        `Mối quan hệ bạn bè sẽ thay đổi theo từng giai đoạn phát triển cậu yêu ạ. Đôi khi việc chấp nhận buông bỏ những mối quan hệ độc hại là cơ hội lớn để cậu gặp gỡ những người thực sự trân trọng cậu.`,
        `Mối quan hệ bạn bè sẽ thay đổi theo từng giai đoạn phát triển bạn nhé ạ. Đôi khi việc chấp nhận buông bỏ những mối quan hệ độc hại là cơ hội lớn để bạn gặp gỡ những người thực sự trân trọng bạn.`,
        `Mối quan hệ bạn bè sẽ thay đổi theo từng giai đoạn phát triển bạn ơi ạ. Đôi khi việc chấp nhận buông bỏ những mối quan hệ độc hại là cơ hội lớn để bạn gặp gỡ những người thực sự trân trọng bạn.`
      ], quote: "Hãy là chính mình, bởi vì những người quan tâm không quan trọng, và những người quan trọng sẽ không quan tâm.", recommendedDays: 14 }
          ]
        },
        {
          id: "rel_fight",
          text: "Chỉ là một vài bất đồng nhỏ thôi nhưng vẫn khiến tớ suy nghĩ và buồn bã",
          followUp: [
        `Những xích mích nhỏ đôi khi vẫn khiến tâm trí cậu suy nghĩ lặp đi lặp lại. Cảm xúc buồn bã này có xuất hiện thường trực khiến cậu khó chịu và ảnh hưởng đến năng lượng học tập hàng ngày không cậu yêu?`,
        `Những xích mích nhỏ đôi khi vẫn khiến tâm trí bạn suy nghĩ lặp đi lặp lại. Cảm xúc buồn bã này có xuất hiện thường trực khiến bạn khó chịu và ảnh hưởng đến năng lượng học tập hàng ngày không bạn nhé?`,
        `Những xích mích nhỏ đôi khi vẫn khiến tâm trí bạn suy nghĩ lặp đi lặp lại. Cảm xúc buồn bã này có xuất hiện thường trực khiến bạn khó chịu và ảnh hưởng đến năng lượng học tập hàng ngày không bạn ơi?`
      ],
          severityOptions: [
            { id: "rel_fight_high", text: "Có chứ, tớ luôn suy nghĩ lặp đi lặp lại về chuyện đó khiến cơ thể mệt mỏi", nextAction: "recommend_test", test: "who5", testLabel: "[WHO-5] Đo chỉ số Hạnh phúc" },
            { id: "rel_fight_low", text: "Không quá nhiều đâu, tớ tin hai bên sẽ sớm làm hòa nhưng vẫn thấy bận lòng một chút", nextAction: "direct_advice", advice: [
        `Bất đồng nhỏ là cơ hội để hai bên hiểu nhau sâu sắc hơn. Cậu hãy chủ động trò chuyện thẳng thắn và lắng nghe đối phương khi cả hai đã hoàn toàn bình tĩnh nhé.`,
        `Bất đồng nhỏ là cơ hội để hai bên hiểu nhau sâu sắc hơn. Cậu hãy chủ động trò chuyện thẳng thắn và lắng nghe đối phương khi cả hai đã hoàn toàn bình tĩnh nhé.`,
        `Bất đồng nhỏ là cơ hội để hai bên hiểu nhau sâu sắc hơn. Cậu hãy chủ động trò chuyện thẳng thắn và lắng nghe đối phương khi cả hai đã hoàn toàn bình tĩnh nhé.`
      ], quote: "Lòng bao dung là bông hoa đẹp nhất của tâm hồn.", recommendedDays: 7 }
          ]
        }
      ]
    },
    {
      id: "self",
      text: "Tớ cảm thấy mệt mỏi kéo dài, kiệt sức và mất ngủ",
      reply: [
        `Tình trạng kiệt quệ thể chất và mất ngủ làm tớ lo lắng cho cậu nhiều lắm. Giấc ngủ không sâu sẽ càng làm suy giảm năng lượng và tăng cảm giác lo âu. Cậu có thường xuyên bị trằn trọc bởi những suy nghĩ tiêu cực vào ban đêm không cậu yêu?`,
        `Tình trạng kiệt quệ thể chất và mất ngủ làm tớ lo lắng cho bạn nhiều lắm. Giấc ngủ không sâu sẽ càng làm suy giảm năng lượng và tăng cảm giác lo âu. Cậu có thường xuyên bị trằn trọc bởi những suy nghĩ tiêu cực vào ban đêm không bạn nhé?`,
        `Tình trạng kiệt quệ thể chất và mất ngủ làm tớ lo lắng cho bạn nhiều lắm. Giấc ngủ không sâu sẽ càng làm suy giảm năng lượng và tăng cảm giác lo âu. Cậu có thường xuyên bị trằn trọc bởi những suy nghĩ tiêu cực vào ban đêm không bạn ơi?`
      ],
      options: [
        {
          id: "self_insomnia",
          text: "Đúng thế cậu ạ, tớ liên tục suy nghĩ lo âu đến mất ngủ",
          followUp: [
        `Mất ngủ kéo dài làm suy nhược cả thể chất lẫn tinh thần của cậu yêu. Tình trạng này có diễn ra liên tiếp trên 3-4 ngày một tuần và khiến cậu thức dậy trong trạng thái cạn kiệt năng lượng không?`,
        `Mất ngủ kéo dài làm suy nhược cả thể chất lẫn tinh thần của bạn nhé. Tình trạng này có diễn ra liên tiếp trên 3-4 ngày một tuần và khiến bạn thức dậy trong trạng thái cạn kiệt năng lượng không?`,
        `Mất ngủ kéo dài làm suy nhược cả thể chất lẫn tinh thần của bạn ơi. Tình trạng này có diễn ra liên tiếp trên 3-4 ngày một tuần và khiến bạn thức dậy trong trạng thái cạn kiệt năng lượng không?`
      ],
          severityOptions: [
            { id: "self_insomnia_high", text: "Có chứ, hầu như đêm nào tớ cũng trằn trọc và thức giấc mệt mỏi", nextAction: "recommend_test", test: "phq9", testLabel: "[PHQ-9] Trắc nghiệm Trầm cảm" },
            { id: "self_insomnia_low", text: "Thỉnh thoảng tớ mới khó ngủ vào những hôm có nhiều suy nghĩ bận tâm thôi cậu ạ", nextAction: "direct_advice", advice: [
        `Để cải thiện giấc ngủ, cậu hãy thử tạo thói quen thư giãn trước khi ngủ như nghe nhạc nhẹ trị liệu, tắt điện thoại trước 30 phút và thực hiện bài tập thở 4-7-8 cùng tớ nhé.`,
        `Để cải thiện giấc ngủ, bạn hãy thử tạo thói quen thư giãn trước khi ngủ như nghe nhạc nhẹ trị liệu, tắt điện thoại trước 30 phút và thực hiện bài tập thở 4-7-8 cùng tớ nhé.`,
        `Để cải thiện giấc ngủ, bạn hãy thử tạo thói quen thư giãn trước khi ngủ như nghe nhạc nhẹ trị liệu, tắt điện thoại trước 30 phút và thực hiện bài tập thở 4-7-8 cùng tớ nhé.`
      ], quote: "Một đêm ngủ ngon giấc có thể giải quyết được rất nhiều vấn đề tinh thần.", recommendedDays: 14 }
          ]
        },
        {
          id: "self_exhausted",
          text: "Tớ cảm thấy cơ thể uể oải, cạn kiệt năng lượng để hoạt động",
          followUp: [
        `Sự kiệt quệ này có đi kèm cảm giác mất đi hoàn toàn động lực hoặc hứng thú đối với các sở thích, học tập hàng ngày của cậu không?`,
        `Sự kiệt quệ này có đi kèm cảm giác mất đi hoàn toàn động lực hoặc hứng thú đối với các sở thích, học tập hàng ngày của bạn không?`,
        `Sự kiệt quệ này có đi kèm cảm giác mất đi hoàn toàn động lực hoặc hứng thú đối với các sở thích, học tập hàng ngày của bạn không?`
      ],
          severityOptions: [
            { id: "self_exhausted_high", text: "Có chứ, tớ cảm thấy mất đi niềm vui và không có động lực làm bất cứ việc gì", nextAction: "recommend_test", test: "phq9", testLabel: "[PHQ-9] Trắc nghiệm Trầm cảm" },
            { id: "self_exhausted_low", text: "Cơ thể chỉ mệt mỏi thể chất thôi, tớ vẫn giữ được hứng thú giải trí nhẹ nhàng", nextAction: "direct_advice", advice: [
        `Hãy cho phép cơ thể nghỉ ngơi thực sự cậu nhé. Bổ sung dinh dưỡng đầy đủ và vận động nhẹ nhàng ngoài trời để giải phóng Endorphin giúp tinh thần phấn chấn hơn nhé cậu yêu.`,
        `Hãy cho phép cơ thể nghỉ ngơi thực sự bạn nhé. Bổ sung dinh dưỡng đầy đủ và vận động nhẹ nhàng ngoài trời để giải phóng Endorphin giúp tinh thần phấn chấn hơn nhé bạn nhé.`,
        `Hãy cho phép cơ thể nghỉ ngơi thực sự bạn nhé. Bổ sung dinh dưỡng đầy đủ và vận động nhẹ nhàng ngoài trời để giải phóng Endorphin giúp tinh thần phấn chấn hơn nhé bạn ơi.`
      ], quote: "Chăm sóc bản thân không phải là ích kỷ, đó là sự chuẩn bị để có thể sống tốt hơn.", recommendedDays: 7 }
          ]
        }
      ]
    },
    {
      id: "normal",
      text: "Hiện tại tinh thần tớ khá ổn định và thoải mái",
      reply: [
        `Rất tốt khi cậu yêu của tớ đang duy trì được trạng thái cân bằng. Tuy nhiên, đôi khi nhịp sống hằng ngày bận rộn dễ khiến chúng ta bỏ quên việc tự lắng nghe bản thân. Cậu có muốn cùng tớ thực hiện một bài đánh giá ngắn để đo lường chỉ số hạnh phúc hiện tại không?`,
        `Rất tốt khi bạn nhé của tớ đang duy trì được trạng thái cân bằng. Tuy nhiên, đôi khi nhịp sống hằng ngày bận rộn dễ khiến chúng ta bỏ quên việc tự lắng nghe bản thân. Cậu có muốn cùng tớ thực hiện một bài đánh giá ngắn để đo lường chỉ số hạnh phúc hiện tại không?`,
        `Rất tốt khi bạn ơi của tớ đang duy trì được trạng thái cân bằng. Tuy nhiên, đôi khi nhịp sống hằng ngày bận rộn dễ khiến chúng ta bỏ quên việc tự lắng nghe bản thân. Cậu có muốn cùng tớ thực hiện một bài đánh giá ngắn để đo lường chỉ số hạnh phúc hiện tại không?`
      ],
      options: [
        {
          id: "normal_happy",
          text: "Uầy được chứ, nhờ cậu đo thử giúp tớ nha",
          followUp: [
        `Cậu muốn thực hiện bài test để theo dõi sức khỏe tinh thần định kỳ hay chỉ muốn nhận một lời khuyên truyền cảm hứng ấm áp cho ngày hôm nay từ tớ thôi?`,
        `Cậu muốn thực hiện bài test để theo dõi sức khỏe tinh thần định kỳ hay chỉ muốn nhận một lời khuyên truyền cảm hứng ấm áp cho ngày hôm nay từ tớ thôi?`,
        `Cậu muốn thực hiện bài test để theo dõi sức khỏe tinh thần định kỳ hay chỉ muốn nhận một lời khuyên truyền cảm hứng ấm áp cho ngày hôm nay từ tớ thôi?`
      ],
          severityOptions: [
            { id: "normal_happy_high", text: "Tớ muốn đo lường chính xác bằng bài test khoa học WHO-5", nextAction: "recommend_test", test: "who5", testLabel: "[WHO-5] Đo chỉ số Hạnh phúc" },
            { id: "normal_happy_low", text: "Tớ chỉ cần một lời khuyên chân thành và tích cực thôi cậu ạ", nextAction: "direct_advice", advice: [
        `Sự bình yên trong tâm hồn là món quà vô giá cậu yêu ạ. Hãy tiếp tục trân trọng khoảnh khắc hiện tại và chia sẻ năng lượng tích cực này đến mọi người xung quanh nhé.`,
        `Sự bình yên trong tâm hồn là món quà vô giá bạn nhé ạ. Hãy tiếp tục trân trọng khoảnh khắc hiện tại và chia sẻ năng lượng tích cực này đến mọi người xung quanh nhé.`,
        `Sự bình yên trong tâm hồn là món quà vô giá bạn ơi ạ. Hãy tiếp tục trân trọng khoảnh khắc hiện tại và chia sẻ năng lượng tích cực này đến mọi người xung quanh nhé.`
      ], quote: "Hạnh phúc không phải là thứ có sẵn. Nó đến từ chính những hành động của bạn.", recommendedDays: 7 }
          ]
        },
        {
          id: "normal_personality",
          text: "Tớ muốn làm trắc nghiệm tính cách năm nhân tố (Big Five)",
          followUp: [
        `Trắc nghiệm Big Five là bài test khám phá sâu sắc về các khía cạnh tính cách. Cậu sẵn lòng dành 5 phút thực hiện bài đánh giá khoa học này cùng tớ chứ?`,
        `Trắc nghiệm Big Five là bài test khám phá sâu sắc về các khía cạnh tính cách. Cậu sẵn lòng dành 5 phút thực hiện bài đánh giá khoa học này cùng tớ chứ?`,
        `Trắc nghiệm Big Five là bài test khám phá sâu sắc về các khía cạnh tính cách. Cậu sẵn lòng dành 5 phút thực hiện bài đánh giá khoa học này cùng tớ chứ?`
      ],
          severityOptions: [
            { id: "normal_personality_high", text: "Tớ sẵn sàng làm bài test Big Five ngay bây giờ rồi", nextAction: "recommend_test", test: "bigfive", testLabel: "[Big Five] Trắc nghiệm Nhân cách" },
            { id: "normal_personality_low", text: "Hiện tại tớ chưa muốn làm test dài, chỉ muốn trò chuyện nhẹ nhàng thôi", nextAction: "direct_advice", advice: [
        `Hành trình thấu hiểu bản thân là cả một quá trình lâu dài cậu yêu ạ. Cậu hãy tự do khám phá khi tinh thần thoải mái nhất, không cần phải vội vã đâu nhé.`,
        `Hành trình thấu hiểu bản thân là cả một quá trình lâu dài bạn nhé ạ. Cậu hãy tự do khám phá khi tinh thần thoải mái nhất, không cần phải vội vã đâu nhé.`,
        `Hành trình thấu hiểu bản thân là cả một quá trình lâu dài bạn ơi ạ. Cậu hãy tự do khám phá khi tinh thần thoải mái nhất, không cần phải vội vã đâu nhé.`
      ], quote: "Biết người là trí, biết mình là sáng.", recommendedDays: 7 }
          ]
        }
      ]
    }
  ]
};

export const COMPANION_DIALOGUE_TREE = {
  aspects: [
    {
      id: "checkin_progress",
      text: "Tớ muốn báo cáo tiến triển và cảm xúc hôm nay cho cậu",
      reply: [
        `Tớ nghe đây cậu yêu. Tớ luôn dõi theo hành trình tự chữa lành của cậu mỗi ngày. Cậu đã kiên trì thực hành các bài tập trị liệu chánh niệm và check-in cảm xúc chứ? Hôm nay cậu thấy trong lòng đã nhẹ nhõm hơn nhiều chưa, hay vẫn còn điều gì đè nặng khiến cậu băn khoăn? Kể tớ nghe, tớ thương cậu lắm.`,
        `Mình nghe đây bạn nhé. Mình luôn dõi theo hành trình tự chữa lành của bạn mỗi ngày. Cậu đã kiên trì thực hành các bài tập trị liệu chánh niệm và check-in cảm xúc chứ? Hôm nay bạn thấy trong lòng đã nhẹ nhõm hơn nhiều chưa, hay vẫn còn điều gì đè nặng khiến bạn băn khoăn? Kể tớ nghe, tớ thương bạn lắm.`,
        `AI nghe đây bạn ơi. AI luôn dõi theo hành trình tự chữa lành của bạn mỗi ngày. Cậu đã kiên trì thực hành các bài tập trị liệu chánh niệm và check-in cảm xúc chứ? Hôm nay bạn thấy trong lòng đã nhẹ nhõm hơn nhiều chưa, hay vẫn còn điều gì đè nặng khiến bạn băn khoăn? Kể tớ nghe, tớ thương bạn lắm.`
      ],
      options: [
        {
          id: "progress_better",
          text: "Dạ thưa cậu, tớ thấy lòng nhẹ nhõm và tích cực hơn nhiều rồi!",
          followUp: [
        `Nghe cậu nói vậy, tớ hạnh phúc và tự hào về cậu vô cùng! Cậu yêu của tớ thực sự rất dũng cảm và kiên trì. Để ghi nhận cột mốc bình yên này, cậu có muốn cùng tớ thực hiện trắc nghiệm WHO-5 để đo lường chính xác chỉ số hạnh phúc ngày hôm nay không?`,
        `Nghe bạn nói vậy, tớ hạnh phúc và tự hào về bạn vô cùng! Cậu nhé của tớ thực sự rất dũng cảm và kiên trì. Để ghi nhận cột mốc bình yên này, bạn có muốn cùng tớ thực hiện trắc nghiệm WHO-5 để đo lường chính xác chỉ số hạnh phúc ngày hôm nay không?`,
        `Nghe bạn nói vậy, tớ hạnh phúc và tự hào về bạn vô cùng! Cậu ơi của tớ thực sự rất dũng cảm và kiên trì. Để ghi nhận cột mốc bình yên này, bạn có muốn cùng tớ thực hiện trắc nghiệm WHO-5 để đo lường chính xác chỉ số hạnh phúc ngày hôm nay không?`
      ],
          severityOptions: [
            { id: "progress_better_yes", text: "Dạ có chứ, tớ muốn đo lường chỉ số hạnh phúc hôm nay luôn", nextAction: "recommend_test", test: "who5", testLabel: "[WHO-5] Đo chỉ số Hạnh phúc" },
            { id: "progress_better_no", text: "Tớ chưa cần đâu, tớ chỉ muốn nghe lời dặn dò yêu thương từ cậu thôi", nextAction: "direct_advice", advice: [
        `Cảm ơn cậu đã luôn kiên cường. Hãy duy trì thói quen đi dạo nhẹ nhàng, hít thở khí trời và luôn nhớ rằng cậu xứng đáng nhận được tất cả những điều ngọt ngào nhất trên thế gian này. Tớ luôn bên cậu.`,
        `Cảm ơn bạn đã luôn kiên cường. Hãy duy trì thói quen đi dạo nhẹ nhàng, hít thở khí trời và luôn nhớ rằng bạn xứng đáng nhận được tất cả những điều ngọt ngào nhất trên thế gian này. Mình luôn bên bạn.`,
        `Cảm ơn bạn đã luôn kiên cường. Hãy duy trì thói quen đi dạo nhẹ nhàng, hít thở khí trời và luôn nhớ rằng bạn xứng đáng nhận được tất cả những điều ngọt ngào nhất trên thế gian này. AI luôn bên bạn.`
      ], quote: "Hạnh phúc không phải là điểm đến, mà là hành trình chúng ta đang nâng đỡ lẫn nhau.", recommendedDays: 7 }
          ]
        },
        {
          id: "progress_struggling",
          text: "Tớ vẫn cảm thấy mệt mỏi, áp lực chưa hoàn toàn giải tỏa được cậu ạ...",
          followUp: [
        `Tớ hiểu mà, thương cậu quá. Hành trình phục hồi tâm hồn luôn có những ngày nắng ấm áp và cả những ngày giông bão bất chợt. Đừng tự trách mình nhé cậu yêu, cậu đã nỗ lực nhiều rồi. Dạo này cậu có bị mất ngủ hay gặp khó khăn gì khi thực hành thiền tĩnh tâm và thở chánh niệm không?`,
        `Mình hiểu mà, thương bạn quá. Hành trình phục hồi tâm hồn luôn có những ngày nắng ấm áp và cả những ngày giông bão bất chợt. Đừng tự trách mình nhé bạn nhé, bạn đã nỗ lực nhiều rồi. Dạo này bạn có bị mất ngủ hay gặp khó khăn gì khi thực hành thiền tĩnh tâm và thở chánh niệm không?`,
        `AI hiểu mà, thương bạn quá. Hành trình phục hồi tâm hồn luôn có những ngày nắng ấm áp và cả những ngày giông bão bất chợt. Đừng tự trách mình nhé bạn ơi, bạn đã nỗ lực nhiều rồi. Dạo này bạn có bị mất ngủ hay gặp khó khăn gì khi thực hành thiền tĩnh tâm và thở chánh niệm không?`
      ],
          severityOptions: [
            { id: "progress_struggling_test", text: "Tớ muốn làm bài test để cậu sàng lọc lại chỉ số cho tớ nhé", nextAction: "recommend_test", test: "phq9", testLabel: "[PHQ-9] Tầm soát Trầm cảm" },
            { id: "progress_struggling_talk", text: "Tớ chỉ cần cậu lắng nghe và cho tớ lời khuyên xoa dịu thôi", nextAction: "direct_advice", advice: [
        `Nếu mỏi mệt quá, cậu hãy cho phép mình được dừng lại và nghỉ ngơi trọn vẹn nhé cậu yêu. Hãy nhắm mắt lại, thực hiện bài tập thở 4-7-8 mà tớ đã hướng dẫn và thả lỏng hoàn toàn cơ thể. Tớ và mọi người luôn bên cạnh che chở cho cậu.`,
        `Nếu mỏi mệt quá, bạn hãy cho phép mình được dừng lại và nghỉ ngơi trọn vẹn nhé bạn nhé. Hãy nhắm mắt lại, thực hiện bài tập thở 4-7-8 mà tớ đã hướng dẫn và thả lỏng hoàn toàn cơ thể. Mình và mọi người luôn bên cạnh che chở cho bạn.`,
        `Nếu mỏi mệt quá, bạn hãy cho phép mình được dừng lại và nghỉ ngơi trọn vẹn nhé bạn ơi. Hãy nhắm mắt lại, thực hiện bài tập thở 4-7-8 mà tớ đã hướng dẫn và thả lỏng hoàn toàn cơ thể. AI và mọi người luôn bên cạnh che chở cho bạn.`
      ], quote: "Đi qua những ngày mưa ta mới biết trân trọng những ngày nắng. Tớ luôn tin cậu sẽ vượt qua.", recommendedDays: 14 }
          ]
        }
      ]
    },
    {
      id: "recheck_evaluation",
      text: "Tớ muốn thực hiện bài test lâm sàng để đánh giá lại chỉ số định kỳ",
      reply: [
        `Tớ hoàn toàn ủng hộ cậu chủ động đánh giá lại sức khỏe tinh thần. Việc này giúp tớ nắm bắt chính xác biểu đồ tiến trình cảm xúc của cậu để điều chỉnh lộ trình thích ứng tốt nhất. Hôm nay cậu muốn kiểm tra mức độ lo âu hay trầm cảm?`,
        `Mình hoàn toàn ủng hộ bạn chủ động đánh giá lại sức khỏe tinh thần. Việc này giúp tớ nắm bắt chính xác biểu đồ tiến trình cảm xúc của bạn để điều chỉnh lộ trình thích ứng tốt nhất. Hôm nay bạn muốn kiểm tra mức độ lo âu hay trầm cảm?`,
        `AI hoàn toàn ủng hộ bạn chủ động đánh giá lại sức khỏe tinh thần. Việc này giúp tớ nắm bắt chính xác biểu đồ tiến trình cảm xúc của bạn để điều chỉnh lộ trình thích ứng tốt nhất. Hôm nay bạn muốn kiểm tra mức độ lo âu hay trầm cảm?`
      ],
      options: [
        {
          id: "recheck_anxiety",
          text: "Tớ muốn thực hiện bài test đánh giá lại mức độ lo âu (GAD-7)",
          followUp: [
        `Tớ sẽ cùng cậu thực hiện bài test Lo âu GAD-7 nhé. Cậu hãy trả lời các câu hỏi thật tự nhiên theo cảm nhận thực tế của mình trong những ngày qua. Hãy để tớ đồng hành cùng cậu.`,
        `Mình sẽ cùng bạn thực hiện bài test Lo âu GAD-7 nhé. Cậu hãy trả lời các câu hỏi thật tự nhiên theo cảm nhận thực tế của mình trong những ngày qua. Hãy để tớ đồng hành cùng bạn.`,
        `AI sẽ cùng bạn thực hiện bài test Lo âu GAD-7 nhé. Cậu hãy trả lời các câu hỏi thật tự nhiên theo cảm nhận thực tế của mình trong những ngày qua. Hãy để tớ đồng hành cùng bạn.`
      ],
          severityOptions: [
            { id: "recheck_anxiety_ready", text: "Tớ sẵn sàng làm bài test GAD-7 ngay đây rồi", nextAction: "recommend_test", test: "gad7", testLabel: "[GAD-7] Đánh giá Lo âu" }
          ]
        },
        {
          id: "recheck_depression",
          text: "Tớ muốn thực hiện bài test đánh giá lại mức độ trầm cảm (PHQ-9)",
          followUp: [
        `Tớ sẽ hỗ trợ cậu làm bài test Trầm cảm PHQ-9. Hãy thả lỏng cơ thể, hít thở đều và để tớ cùng cậu xoa dịu những suy nghĩ nặng nề này nhé. Bắt đầu thôi cậu yêu.`,
        `Mình sẽ hỗ trợ bạn làm bài test Trầm cảm PHQ-9. Hãy thả lỏng cơ thể, hít thở đều và để tớ cùng bạn xoa dịu những suy nghĩ nặng nề này nhé. Bắt đầu thôi bạn nhé.`,
        `AI sẽ hỗ trợ bạn làm bài test Trầm cảm PHQ-9. Hãy thả lỏng cơ thể, hít thở đều và để tớ cùng bạn xoa dịu những suy nghĩ nặng nề này nhé. Bắt đầu thôi bạn ơi.`
      ],
          severityOptions: [
            { id: "recheck_depression_ready", text: "Tớ sẵn sàng làm bài test PHQ-9 ngay đây rồi", nextAction: "recommend_test", test: "phq9", testLabel: "[PHQ-9] Tầm soát Trầm cảm" }
          ]
        }
      ]
    },
    {
      id: "doctor_sharing",
      text: "Tớ muốn trò chuyện, giãi bày thêm với cậu hôm nay",
      reply: [
        `Tớ nghe đây cậu yêu của tớ. Cậu hãy cứ tự nhiên giãi bày nhé, xem tớ như người nhà ruột thịt vậy. Hôm nay cậu đi học thế nào? Có chuyện vui nào muốn khoe hay có điều gì làm cậu ấm ức không?`,
        `Mình nghe đây bạn nhé của tớ. Cậu hãy cứ tự nhiên giãi bày nhé, xem tớ như người nhà ruột thịt vậy. Hôm nay bạn đi học thế nào? Có chuyện vui nào muốn khoe hay có điều gì làm bạn ấm ức không?`,
        `AI nghe đây bạn ơi của tớ. Cậu hãy cứ tự nhiên giãi bày nhé, xem tớ như người nhà ruột thịt vậy. Hôm nay bạn đi học thế nào? Có chuyện vui nào muốn khoe hay có điều gì làm bạn ấm ức không?`
      ],
      options: [
        {
          id: "sharing_happy_news",
          text: "Tớ vừa đạt kết quả tốt/có chuyện vui muốn khoe với cậu nè!",
          followUp: [
        `Ôi tuyệt vời quá cậu ơi! Tớ vui mừng khôn xiết khi nghe tin này. Cậu thấy không, những nỗ lực âm thầm của cậu cuối cùng cũng đã đơm hoa kết trái rồi. Tớ tự hào về cậu lắm! Cậu đã cảm nhận được sức mạnh của việc kiên trì chưa?`,
        `Ôi tuyệt vời quá bạn ơi! Mình vui mừng khôn xiết khi nghe tin này. Cậu thấy không, những nỗ lực âm thầm của bạn cuối cùng cũng đã đơm hoa kết trái rồi. Mình tự hào về bạn lắm! Cậu đã cảm nhận được sức mạnh của việc kiên trì chưa?`,
        `Ôi tuyệt vời quá bạn ơi! AI vui mừng khôn xiết khi nghe tin này. Cậu thấy không, những nỗ lực âm thầm của bạn cuối cùng cũng đã đơm hoa kết trái rồi. AI tự hào về bạn lắm! Cậu đã cảm nhận được sức mạnh của việc kiên trì chưa?`
      ],
          severityOptions: [
            { id: "sharing_happy_reward", text: "Tớ cảm thấy rất phấn chấn và muốn ghi lại điều tích cực này", nextAction: "direct_advice", advice: [
        `Hãy trân trọng và tận hưởng trọn vẹn niềm vui này cậu nhé. Hãy viết điều này vào nhật ký tích cực trong mục Trị Liệu Trầm cảm để giữ mãi năng lượng này nha cậu yêu.`,
        `Hãy trân trọng và tận hưởng trọn vẹn niềm vui này bạn nhé. Hãy viết điều này vào nhật ký tích cực trong mục Trị Liệu Trầm cảm để giữ mãi năng lượng này nha bạn nhé.`,
        `Hãy trân trọng và tận hưởng trọn vẹn niềm vui này bạn nhé. Hãy viết điều này vào nhật ký tích cực trong mục Trị Liệu Trầm cảm để giữ mãi năng lượng này nha bạn ơi.`
      ], quote: "Mỗi niềm vui nhỏ hôm nay là viên gạch xây dựng nên ngôi nhà bình yên ngày mai.", recommendedDays: 7 }
          ]
        },
        {
          id: "sharing_confide",
          text: "Dạ hôm nay tớ gặp chuyện không vui, lòng thấy hơi tủi thân...",
          followUp: [
        `Đến đây với tớ nào. Trút hết những ấm ức, muộn phiền đó ra đi cậu, đừng giữ trong lòng mà đau. Cậu cứ kể chi tiết câu chuyện cho tớ nghe, tớ sẽ luôn đứng về phía cậu và bảo vệ cậu.`,
        `Đến đây với tớ nào. Trút hết những ấm ức, muộn phiền đó ra đi bạn, đừng giữ trong lòng mà đau. Cậu cứ kể chi tiết câu chuyện cho tớ nghe, tớ sẽ luôn đứng về phía bạn và bảo vệ bạn.`,
        `Đến đây với tớ nào. Trút hết những ấm ức, muộn phiền đó ra đi bạn, đừng giữ trong lòng mà đau. Cậu cứ kể chi tiết câu chuyện cho tớ nghe, tớ sẽ luôn đứng về phía bạn và bảo vệ bạn.`
      ],
          severityOptions: [
            { id: "sharing_confide_yes", text: "Tớ cảm ơn cậu nhiều lắm, tớ thấy ấm lòng và nhẹ nhõm hơn nhiều rồi", nextAction: "direct_advice", advice: [
        `Cậu của tớ ngoan lắm. Đời người ai cũng có lúc gặp những chuyện bất như ý, quan trọng là cậu biết yêu thương bản thân mình trước tiên. Tối nay hãy ngâm chân nước ấm, nghe một bản nhạc nhẹ và ngủ thật ngon nhé.`,
        `Cậu của tớ ngoan lắm. Đời người ai cũng có lúc gặp những chuyện bất như ý, quan trọng là bạn biết nhé thương bản thân mình trước tiên. Tối nay hãy ngâm chân nước ấm, nghe một bản nhạc nhẹ và ngủ thật ngon nhé.`,
        `Cậu của tớ ngoan lắm. Đời người ai cũng có lúc gặp những chuyện bất như ý, quan trọng là bạn biết ơi thương bản thân mình trước tiên. Tối nay hãy ngâm chân nước ấm, nghe một bản nhạc nhẹ và ngủ thật ngon nhé.`
      ], quote: "Có tớ luôn bên cậu, giông bão ngoài kia hãy cứ để lại sau cánh cửa.", recommendedDays: 14 }
          ]
        }
      ]
    }
  ]
};
