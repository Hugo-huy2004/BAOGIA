import React, { useState, useEffect, useRef } from "react";
import { CLINICAL_TESTS } from "./clinicalTests";
import ChatMessages from "./ChatMessages";
import ClinicalTestPanel from "./ClinicalTestPanel";
import ClinicScanner from "./ClinicScanner";
import { webPushHelper } from "../../../utils/webPushHelper";

const DIALOGUE_TREE = {
  aspects: [
    {
      id: "studying",
      text: "Tớ đang gặp áp lực lớn từ học tập và thi cử",
      reply: "Tớ hiểu áp lực thi cử đó mà cậu yêu. Việc đối mặt với thi cử liên tục và khối lượng bài vở dồn dập rất dễ khiến tinh thần cậu bị căng thẳng quá mức. Có phải cậu đang cảm thấy lo lắng rằng kết quả không tốt sẽ làm bản thân hoặc gia đình thất vọng? Đừng sợ, có tớ ở đây bên cậu rồi.",
      options: [
        {
          id: "study_fail",
          text: "Đúng thế cậu ơi, tớ rất sợ thi trượt và kết quả kém",
          followUp: "Sự lo sợ thất bại học đường có thể gây sức ép đè nặng lên tinh thần cậu, tớ thương cậu nhiều lắm. Nỗi lo lắng này có xuất hiện thường xuyên đến mức làm cậu bị mất ngủ, bỏ bữa hay mất tập trung học tập suốt cả ngày không cậu?",
          severityOptions: [
            { id: "study_fail_high", text: "Có chứ, nỗi lo âu này lặp lại nhiều lần khiến tớ mất tập trung và kiệt quệ", nextAction: "recommend_test", test: "gad7", testLabel: "[GAD-7] Trắc nghiệm Lo âu" },
            { id: "study_fail_low", text: "Không quá nghiêm trọng đâu, tớ vẫn kiểm soát được nhưng đôi lúc thấy nản chí", nextAction: "direct_advice", advice: "Áp lực học tập đôi khi là động lực nhưng cũng rất dễ làm ta kiệt sức cậu yêu nhé. Cậu hãy học cách chia nhỏ mục tiêu học tập, cho bản thân những khoảng nghỉ ngơi ngắn và hít thở sâu để điều hòa tinh thần cùng tớ nha.", quote: "Thành công không phải là cuối cùng, thất bại không phải là tử địa: đó là lòng dũng cảm để tiếp tục mới là quan trọng.", recommendedDays: 14 }
          ]
        },
        {
          id: "study_overload",
          text: "Không hẳn thế, tớ chỉ thấy quá tải vì khối lượng bài vở quá nhiều thôi",
          followUp: "Lượng bài vở dồn dập khiến thời gian tự chăm sóc bản thân của cậu yêu bị thu hẹp lại. Cảm giác quá tải này có lặp đi lặp lại liên tục khiến cậu cảm thấy bế tắc, bất lực không kể tớ nghe nào?",
          severityOptions: [
            { id: "study_overload_high", text: "Có chứ, tớ cảm thấy bế tắc hoàn toàn trước đống bài vở và bài tập", nextAction: "recommend_test", test: "gad7", testLabel: "[GAD-7] Trắc nghiệm Lo âu" },
            { id: "study_overload_low", text: "Tớ chỉ thấy mệt lúc làm bài quá sức thôi, nghỉ ngơi đầy đủ sẽ đỡ hơn", nextAction: "direct_advice", advice: "Quá tải bài vở là tình trạng phổ biến tuổi học trò mà cậu. Cậu nên học cách phân chia thời gian học tập khoa học hơn, ví dụ áp dụng phương pháp Pomodoro làm việc 25 phút và nghỉ 5 phút để bảo vệ sức khỏe nhé cậu yêu.", quote: "Cách tốt nhất để bắt đầu là ngừng nói và bắt đầu làm.", recommendedDays: 7 }
          ]
        }
      ]
    },
    {
      id: "family",
      text: "Tớ thấy ngột ngạt vì các vấn đề gia đình",
      reply: "Tớ ôm cậu một cái thật chặt nhé. Tớ rất hiểu và chia sẻ với những gì cậu đang trải qua. Áp lực từ sự kỳ vọng hay những bất đồng ý kiến từ cha mẹ thực sự dễ gây tổn thương sâu sắc cho cậu. Có phải cậu cảm thấy thiếu sự lắng nghe và thấu hiểu từ những người thân yêu nhất?",
      options: [
        {
          id: "family_lonely",
          text: "Đúng vậy cậu ạ, tớ cảm thấy cô độc ngay trong chính ngôi nhà của mình",
          followUp: "Cảm giác đơn độc trong chính ngôi nhà của mình là một trải nghiệm đau lòng vô cùng, cậu của tớ đã vất vả rồi. Sự cô độc này có kéo dài liên tục làm cậu thu mình lại, không muốn trò chuyện hay kết nối với bất kỳ ai nữa không cậu yêu?",
          severityOptions: [
            { id: "family_lonely_high", text: "Có chứ, tớ hầu như luôn thu mình lại và cảm thấy lạc lõng sâu sắc", nextAction: "recommend_test", test: "phq9", testLabel: "[PHQ-9] Trắc nghiệm Trầm cảm" },
            { id: "family_lonely_low", text: "Chỉ là đôi khi tớ cảm thấy bị ngột ngạt thôi, thỉnh thoảng vẫn giãi bày được với bạn bè", nextAction: "direct_advice", advice: "Gia đình là chỗ dựa quan trọng nhưng khi gặp bất đồng, cậu có thể tìm kiếm điểm tựa tinh thần lành mạnh từ bạn bè thân thiết hoặc ghi nhật ký để giải tỏa bớt những dồn nén trong lòng nha cậu yêu. Tớ luôn coi cậu như người nhà.", quote: "Không có ai cô độc khi họ biết tự yêu thương và trân trọng bản thân mình.", recommendedDays: 14 }
          ]
        },
        {
          id: "family_conflict",
          text: "Gia đình thường xuyên xảy ra tranh cãi căng thẳng khiến tớ mệt mỏi",
          followUp: "Bầu không khí căng thẳng thường trực trong gia đình dễ bào mòn năng lượng tinh thần của cậu lắm. Những cuộc tranh cãi này có diễn ra liên tục khiến cậu luôn bất an, tim đập nhanh hay sợ hãi mỗi khi ở nhà không cậu yêu của tớ?",
          severityOptions: [
            { id: "family_conflict_high", text: "Có chứ, không khí gia đình vô cùng căng thẳng khiến tớ thường xuyên bất an, hoảng sợ", nextAction: "recommend_test", test: "phq9", testLabel: "[PHQ-9] Trắc nghiệm Trầm cảm" },
            { id: "family_conflict_low", text: "Thỉnh thoảng mới tranh cãi lớn, khi mọi chuyện lắng xuống tớ thấy ổn hơn", nextAction: "direct_advice", advice: "Khi gia đình xảy ra xung đột, việc bảo vệ không gian bình yên trong tâm trí cậu là ưu tiên hàng đầu của tớ. Hãy tránh tranh luận trực tiếp khi cơn nóng giận của mọi người đang ở đỉnh điểm nha cậu.", quote: "Hòa bình bắt đầu bằng một nụ cười và sự thấu hiểu từ bên trong.", recommendedDays: 7 }
          ]
        }
      ]
    },
    {
      id: "relationships",
      text: "Tớ gặp phiền muộn trong tình cảm hoặc bạn bè",
      reply: "Những tổn thương và rạn nứt trong các mối quan hệ xã hội luôn khiến tớ xót xa khi nhìn cậu chịu đựng. Nó thường để lại những cảm xúc hụt hẫng, bứt rứt khó chịu. Hiện tại cậu đang cảm thấy bị cô lập hay có sự hiểu lầm nào chưa thể tháo gỡ được?",
      options: [
        {
          id: "rel_isolated",
          text: "Đúng thế cậu ạ, tớ cảm thấy lạc lõng và bị cô lập",
          followUp: "Bị cô lập hoặc không được tập thể chấp nhận đem lại nỗi buồn rất lớn cho một người ngoan như cậu. Tình trạng này có diễn ra lâu ngày làm cậu hoài nghi giá trị bản thân hay chán ghét việc đến trường không cậu?",
          severityOptions: [
            { id: "rel_isolated_high", text: "Có chứ, tớ thấy vô cùng lạc lõng và chán nản việc đi học mỗi ngày", nextAction: "recommend_test", test: "who5", testLabel: "[WHO-5] Đo chỉ số Hạnh phúc" },
            { id: "rel_isolated_low", text: "Tớ vẫn có những người bạn khác bên ngoài nhưng vẫn buồn vì chuyện này", nextAction: "direct_advice", advice: "Mối quan hệ bạn bè sẽ thay đổi theo từng giai đoạn phát triển cậu yêu ạ. Đôi khi việc chấp nhận buông bỏ những mối quan hệ độc hại là cơ hội lớn để cậu gặp gỡ những người thực sự trân trọng cậu.", quote: "Hãy là chính mình, bởi vì những người quan tâm không quan trọng, và những người quan trọng sẽ không quan tâm.", recommendedDays: 14 }
          ]
        },
        {
          id: "rel_fight",
          text: "Chỉ là một vài bất đồng nhỏ thôi nhưng vẫn khiến tớ suy nghĩ và buồn bã",
          followUp: "Những xích mích nhỏ đôi khi vẫn khiến tâm trí cậu suy nghĩ lặp đi lặp lại. Cảm xúc buồn bã này có xuất hiện thường trực khiến cậu khó chịu và ảnh hưởng đến năng lượng học tập hàng ngày không cậu yêu?",
          severityOptions: [
            { id: "rel_fight_high", text: "Có chứ, tớ luôn suy nghĩ lặp đi lặp lại về chuyện đó khiến cơ thể mệt mỏi", nextAction: "recommend_test", test: "who5", testLabel: "[WHO-5] Đo chỉ số Hạnh phúc" },
            { id: "rel_fight_low", text: "Không quá nhiều đâu, tớ tin hai bên sẽ sớm làm hòa nhưng vẫn thấy bận lòng một chút", nextAction: "direct_advice", advice: "Bất đồng nhỏ là cơ hội để hai bên hiểu nhau sâu sắc hơn. Cậu hãy chủ động trò chuyện thẳng thắn và lắng nghe đối phương khi cả hai đã hoàn toàn bình tĩnh nhé.", quote: "Lòng bao dung là bông hoa đẹp nhất của tâm hồn.", recommendedDays: 7 }
          ]
        }
      ]
    },
    {
      id: "self",
      text: "Tớ cảm thấy mệt mỏi kéo dài, kiệt sức và mất ngủ",
      reply: "Tình trạng kiệt quệ thể chất và mất ngủ làm tớ lo lắng cho cậu nhiều lắm. Giấc ngủ không sâu sẽ càng làm suy giảm năng lượng và tăng cảm giác lo âu. Cậu có thường xuyên bị trằn trọc bởi những suy nghĩ tiêu cực vào ban đêm không cậu yêu?",
      options: [
        {
          id: "self_insomnia",
          text: "Đúng thế cậu ạ, tớ liên tục suy nghĩ lo âu đến mất ngủ",
          followUp: "Mất ngủ kéo dài làm suy nhược cả thể chất lẫn tinh thần của cậu yêu. Tình trạng này có diễn ra liên tiếp trên 3-4 ngày một tuần và khiến cậu thức dậy trong trạng thái cạn kiệt năng lượng không?",
          severityOptions: [
            { id: "self_insomnia_high", text: "Có chứ, hầu như đêm nào tớ cũng trằn trọc và thức giấc mệt mỏi", nextAction: "recommend_test", test: "phq9", testLabel: "[PHQ-9] Trắc nghiệm Trầm cảm" },
            { id: "self_insomnia_low", text: "Thỉnh thoảng tớ mới khó ngủ vào những hôm có nhiều suy nghĩ bận tâm thôi cậu ạ", nextAction: "direct_advice", advice: "Để cải thiện giấc ngủ, cậu hãy thử tạo thói quen thư giãn trước khi ngủ như nghe nhạc nhẹ trị liệu, tắt điện thoại trước 30 phút và thực hiện bài tập thở 4-7-8 cùng tớ nhé.", quote: "Một đêm ngủ ngon giấc có thể giải quyết được rất nhiều vấn đề tinh thần.", recommendedDays: 14 }
          ]
        },
        {
          id: "self_exhausted",
          text: "Tớ cảm thấy cơ thể uể oải, cạn kiệt năng lượng để hoạt động",
          followUp: "Sự kiệt quệ này có đi kèm cảm giác mất đi hoàn toàn động lực hoặc hứng thú đối với các sở thích, học tập hàng ngày của cậu không?",
          severityOptions: [
            { id: "self_exhausted_high", text: "Có chứ, tớ cảm thấy mất đi niềm vui và không có động lực làm bất cứ việc gì", nextAction: "recommend_test", test: "phq9", testLabel: "[PHQ-9] Trắc nghiệm Trầm cảm" },
            { id: "self_exhausted_low", text: "Cơ thể chỉ mệt mỏi thể chất thôi, tớ vẫn giữ được hứng thú giải trí nhẹ nhàng", nextAction: "direct_advice", advice: "Hãy cho phép cơ thể nghỉ ngơi thực sự cậu nhé. Bổ sung dinh dưỡng đầy đủ và vận động nhẹ nhàng ngoài trời để giải phóng Endorphin giúp tinh thần phấn chấn hơn nhé cậu yêu.", quote: "Chăm sóc bản thân không phải là ích kỷ, đó là sự chuẩn bị để có thể sống tốt hơn.", recommendedDays: 7 }
          ]
        }
      ]
    },
    {
      id: "normal",
      text: "Hiện tại tinh thần tớ khá ổn định và thoải mái",
      reply: "Rất tốt khi cậu yêu của tớ đang duy trì được trạng thái cân bằng. Tuy nhiên, đôi khi nhịp sống hằng ngày bận rộn dễ khiến chúng ta bỏ quên việc tự lắng nghe bản thân. Cậu có muốn cùng tớ thực hiện một bài đánh giá ngắn để đo lường chỉ số hạnh phúc hiện tại không?",
      options: [
        {
          id: "normal_happy",
          text: "Uầy được chứ, nhờ cậu đo thử giúp tớ nha",
          followUp: "Cậu muốn thực hiện bài test để theo dõi sức khỏe tinh thần định kỳ hay chỉ muốn nhận một lời khuyên truyền cảm hứng ấm áp cho ngày hôm nay từ tớ thôi?",
          severityOptions: [
            { id: "normal_happy_high", text: "Tớ muốn đo lường chính xác bằng bài test khoa học WHO-5", nextAction: "recommend_test", test: "who5", testLabel: "[WHO-5] Đo chỉ số Hạnh phúc" },
            { id: "normal_happy_low", text: "Tớ chỉ cần một lời khuyên chân thành và tích cực thôi cậu ạ", nextAction: "direct_advice", advice: "Sự bình yên trong tâm hồn là món quà vô giá cậu yêu ạ. Hãy tiếp tục trân trọng khoảnh khắc hiện tại và chia sẻ năng lượng tích cực này đến mọi người xung quanh nhé.", quote: "Hạnh phúc không phải là thứ có sẵn. Nó đến từ chính những hành động của bạn.", recommendedDays: 7 }
          ]
        },
        {
          id: "normal_personality",
          text: "Tớ muốn làm trắc nghiệm tính cách năm nhân tố (Big Five)",
          followUp: "Trắc nghiệm Big Five là bài test khám phá sâu sắc về các khía cạnh tính cách. Cậu sẵn lòng dành 5 phút thực hiện bài đánh giá khoa học này cùng tớ chứ?",
          severityOptions: [
            { id: "normal_personality_high", text: "Tớ sẵn sàng làm bài test Big Five ngay bây giờ rồi", nextAction: "recommend_test", test: "bigfive", testLabel: "[Big Five] Trắc nghiệm Nhân cách" },
            { id: "normal_personality_low", text: "Hiện tại tớ chưa muốn làm test dài, chỉ muốn trò chuyện nhẹ nhàng thôi", nextAction: "direct_advice", advice: "Hành trình thấu hiểu bản thân là cả một quá trình lâu dài cậu yêu ạ. Cậu hãy tự do khám phá khi tinh thần thoải mái nhất, không cần phải vội vã đâu nhé.", quote: "Biết người là trí, biết mình là sáng.", recommendedDays: 7 }
          ]
        }
      ]
    }
  ]
};

const COMPANION_DIALOGUE_TREE = {
  aspects: [
    {
      id: "checkin_progress",
      text: "Tớ muốn báo cáo tiến triển và cảm xúc hôm nay cho cậu",
      reply: "Tớ nghe đây cậu yêu. Tớ luôn dõi theo hành trình tự chữa lành của cậu mỗi ngày. Cậu đã kiên trì thực hành các bài tập trị liệu chánh niệm và check-in cảm xúc chứ? Hôm nay cậu thấy trong lòng đã nhẹ nhõm hơn nhiều chưa, hay vẫn còn điều gì đè nặng khiến cậu băn khoăn? Kể tớ nghe, tớ thương cậu lắm.",
      options: [
        {
          id: "progress_better",
          text: "Dạ thưa cậu, tớ thấy lòng nhẹ nhõm và tích cực hơn nhiều rồi!",
          followUp: "Nghe cậu nói vậy, tớ hạnh phúc và tự hào về cậu vô cùng! Cậu yêu của tớ thực sự rất dũng cảm và kiên trì. Để ghi nhận cột mốc bình yên này, cậu có muốn cùng tớ thực hiện trắc nghiệm WHO-5 để đo lường chính xác chỉ số hạnh phúc ngày hôm nay không?",
          severityOptions: [
            { id: "progress_better_yes", text: "Dạ có chứ, tớ muốn đo lường chỉ số hạnh phúc hôm nay luôn", nextAction: "recommend_test", test: "who5", testLabel: "[WHO-5] Đo chỉ số Hạnh phúc" },
            { id: "progress_better_no", text: "Tớ chưa cần đâu, tớ chỉ muốn nghe lời dặn dò yêu thương từ cậu thôi", nextAction: "direct_advice", advice: "Cảm ơn cậu đã luôn kiên cường. Hãy duy trì thói quen đi dạo nhẹ nhàng, hít thở khí trời và luôn nhớ rằng cậu xứng đáng nhận được tất cả những điều ngọt ngào nhất trên thế gian này. Tớ luôn bên cậu.", quote: "Hạnh phúc không phải là điểm đến, mà là hành trình chúng ta đang nâng đỡ lẫn nhau.", recommendedDays: 7 }
          ]
        },
        {
          id: "progress_struggling",
          text: "Tớ vẫn cảm thấy mệt mỏi, áp lực chưa hoàn toàn giải tỏa được cậu ạ...",
          followUp: "Tớ hiểu mà, thương cậu quá. Hành trình phục hồi tâm hồn luôn có những ngày nắng ấm áp và cả những ngày giông bão bất chợt. Đừng tự trách mình nhé cậu yêu, cậu đã nỗ lực nhiều rồi. Dạo này cậu có bị mất ngủ hay gặp khó khăn gì khi thực hành thiền tĩnh tâm và thở chánh niệm không?",
          severityOptions: [
            { id: "progress_struggling_test", text: "Tớ muốn làm bài test để cậu chẩn đoán lại chỉ số cho tớ nhé", nextAction: "recommend_test", test: "phq9", testLabel: "[PHQ-9] Tầm soát Trầm cảm" },
            { id: "progress_struggling_talk", text: "Tớ chỉ cần cậu lắng nghe và cho tớ lời khuyên xoa dịu thôi", nextAction: "direct_advice", advice: "Nếu mỏi mệt quá, cậu hãy cho phép mình được dừng lại và nghỉ ngơi trọn vẹn nhé cậu yêu. Hãy nhắm mắt lại, thực hiện bài tập thở 4-7-8 mà tớ đã hướng dẫn và thả lỏng hoàn toàn cơ thể. Tớ và mọi người luôn bên cạnh che chở cho cậu.", quote: "Đi qua những ngày mưa ta mới biết trân trọng những ngày nắng. Tớ luôn tin cậu sẽ vượt qua.", recommendedDays: 14 }
          ]
        }
      ]
    },
    {
      id: "recheck_evaluation",
      text: "Tớ muốn thực hiện bài test lâm sàng để đánh giá lại chỉ số định kỳ",
      reply: "Tớ hoàn toàn ủng hộ cậu chủ động đánh giá lại sức khỏe tinh thần. Việc này giúp tớ nắm bắt chính xác biểu đồ tiến trình cảm xúc của cậu để điều chỉnh lộ trình thích ứng tốt nhất. Hôm nay cậu muốn kiểm tra mức độ lo âu hay trầm cảm?",
      options: [
        {
          id: "recheck_anxiety",
          text: "Tớ muốn thực hiện bài test đánh giá lại mức độ lo âu (GAD-7)",
          followUp: "Tớ sẽ cùng cậu thực hiện bài test Lo âu GAD-7 nhé. Cậu hãy trả lời các câu hỏi thật tự nhiên theo cảm nhận thực tế của mình trong những ngày qua. Hãy để tớ đồng hành cùng cậu.",
          severityOptions: [
            { id: "recheck_anxiety_ready", text: "Tớ sẵn sàng làm bài test GAD-7 ngay đây rồi", nextAction: "recommend_test", test: "gad7", testLabel: "[GAD-7] Đánh giá Lo âu" }
          ]
        },
        {
          id: "recheck_depression",
          text: "Tớ muốn thực hiện bài test đánh giá lại mức độ trầm cảm (PHQ-9)",
          followUp: "Tớ sẽ hỗ trợ cậu làm bài test Trầm cảm PHQ-9. Hãy thả lỏng cơ thể, hít thở đều và để tớ cùng cậu xoa dịu những suy nghĩ nặng nề này nhé. Bắt đầu thôi cậu yêu.",
          severityOptions: [
            { id: "recheck_depression_ready", text: "Tớ sẵn sàng làm bài test PHQ-9 ngay đây rồi", nextAction: "recommend_test", test: "phq9", testLabel: "[PHQ-9] Tầm soát Trầm cảm" }
          ]
        }
      ]
    },
    {
      id: "doctor_sharing",
      text: "Tớ muốn trò chuyện, giãi bày thêm với cậu hôm nay",
      reply: "Tớ nghe đây cậu yêu của tớ. Cậu hãy cứ tự nhiên giãi bày nhé, xem tớ như người nhà ruột thịt vậy. Hôm nay cậu đi học thế nào? Có chuyện vui nào muốn khoe hay có điều gì làm cậu ấm ức không?",
      options: [
        {
          id: "sharing_happy_news",
          text: "Tớ vừa đạt kết quả tốt/có chuyện vui muốn khoe với cậu nè!",
          followUp: "Ôi tuyệt vời quá cậu ơi! Tớ vui mừng khôn xiết khi nghe tin này. Cậu thấy không, những nỗ lực âm thầm của cậu cuối cùng cũng đã đơm hoa kết trái rồi. Tớ tự hào về cậu lắm! Cậu đã cảm nhận được sức mạnh của việc kiên trì chưa?",
          severityOptions: [
            { id: "sharing_happy_reward", text: "Tớ cảm thấy rất phấn chấn và muốn ghi lại điều tích cực này", nextAction: "direct_advice", advice: "Hãy trân trọng và tận hưởng trọn vẹn niềm vui này cậu nhé. Hãy viết điều này vào nhật ký tích cực trong mục Trị Liệu Trầm cảm để giữ mãi năng lượng này nha cậu yêu.", quote: "Mỗi niềm vui nhỏ hôm nay là viên gạch xây dựng nên ngôi nhà bình yên ngày mai.", recommendedDays: 7 }
          ]
        },
        {
          id: "sharing_confide",
          text: "Dạ hôm nay tớ gặp chuyện không vui, lòng thấy hơi tủi thân...",
          followUp: "Đến đây với tớ nào. Trút hết những ấm ức, muộn phiền đó ra đi cậu, đừng giữ trong lòng mà đau. Cậu cứ kể chi tiết câu chuyện cho tớ nghe, tớ sẽ luôn đứng về phía cậu và bảo vệ cậu.",
          severityOptions: [
            { id: "sharing_confide_yes", text: "Tớ cảm ơn cậu nhiều lắm, tớ thấy ấm lòng và nhẹ nhõm hơn nhiều rồi", nextAction: "direct_advice", advice: "Cậu của tớ ngoan lắm. Đời người ai cũng có lúc gặp những chuyện bất như ý, quan trọng là cậu biết yêu thương bản thân mình trước tiên. Tối nay hãy ngâm chân nước ấm, nghe một bản nhạc nhẹ và ngủ thật ngon nhé.", quote: "Có tớ luôn bên cậu, giông bão ngoài kia hãy cứ để lại sau cánh cửa.", recommendedDays: 14 }
          ]
        }
      ]
    }
  ]
};

export default function ChatTab({ onNavigateToTab, bio, historyLogs, onUpdateCompanionState, chatMessages, presetTest, setPresetTest, showToast, healingActive }) {
  const [completedMessageIds, setCompletedMessageIds] = useState(new Set());
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showTestsMenu, setShowTestsMenu] = useState(false);

  // Auto-launch preset test from redirects
  useEffect(() => {
    if (presetTest) {
      handleStartTest(presetTest);
      if (setPresetTest) {
        setPresetTest(null);
      }
    }
  }, [presetTest]);

  // dialogStage: 1 (aspect concern), 2 (probing question), 3 (severity check), 4 (test recommend), 5 (advice duration setup), 0 (loop options)
  const [dialogStage, setDialogStage] = useState(1);
  const [selectedAspect, setSelectedAspect] = useState(null);
  const [selectedSubOption, setSelectedSubOption] = useState(null);

  // chatMode: 'normal' | 'test' | 'scan'
  const [chatMode, setChatMode] = useState("normal");
  const [activeTest, setActiveTest] = useState(null);


  const lastMessage = messages[messages.length - 1];
  const isLastMessageCompleted = !lastMessage || lastMessage.sender === "user" || lastMessage.id === "init" || completedMessageIds.has(lastMessage.id);

  const messagesEndRef = useRef(null);
  const lastSavedMessageIdRef = useRef("");

  // Sync messages state when chatMessages prop updates from DB
  useEffect(() => {
    if (chatMessages && chatMessages.length > 0) {
      setMessages(chatMessages);
      lastSavedMessageIdRef.current = chatMessages[chatMessages.length - 1].id;
      const ids = chatMessages.map(m => m.id);
      setCompletedMessageIds(new Set(ids));
    }
  }, [chatMessages]);

  // Load chat messages from local storage/cache on mount
  useEffect(() => {
    if (bio?.email) {
      const localMsgs = localStorage.getItem("banhocduong_chat_messages");
      if (localMsgs) {
        try {
          const parsed = JSON.parse(localMsgs);
          if (parsed.length > 0) {
            const mapped = parsed.map(m => ({ ...m, time: new Date(m.time) }));
            setMessages(mapped);
            lastSavedMessageIdRef.current = mapped[mapped.length - 1].id;
            
            // Mark all existing loaded messages as completed immediately
            const ids = mapped.map(m => m.id);
            setCompletedMessageIds(new Set(ids));
            return;
          }
        } catch (e) {
          console.error("Failed to parse local chat messages", e);
        }
      }

      // Fallback: If no history exists, set the initial bot greeting based on companion status
      const greetingText = healingActive
        ? "Chào cậu! Chào mừng cậu trở lại với không gian đồng hành hàng ngày cùng tớ. Hôm nay cậu cảm thấy thế nào? Cậu có muốn cùng tớ check-in cảm xúc, thực hiện bài trắc nghiệm định kỳ để đánh giá lại tiến độ, hay muốn trò chuyện và tìm các bài tập hỗ trợ xoa dịu tâm trí không? Tớ luôn bên cậu."
        : "Chào cậu, tớ là Chuyên viên Đồng Hành của cậu đây. Tại đây, mọi chia sẻ của cậu luôn được tớ lắng nghe trong không gian bảo mật và tuyệt đối không phán xét. Dạo gần đây, việc học tập, sức khỏe hay cuộc sống cá nhân của cậu thế nào? Cậu có điều gì bận tâm muốn chia sẻ, hoặc muốn cùng tớ thực hiện các bài đánh giá tâm lý chuẩn lâm sàng không?";

      const initMsg = {
        id: "init",
        sender: "bot",
        text: greetingText,
        time: new Date()
      };
      setMessages([initMsg]);
      setCompletedMessageIds(new Set(["init"]));
      lastSavedMessageIdRef.current = "init";
    }
  }, [bio?.email, healingActive]);

  // Auto-save new chat messages to MongoDB and sync to localStorage synchronously to prevent tab unmount data loss
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("banhocduong_chat_messages", JSON.stringify(messages));
      
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.id !== lastSavedMessageIdRef.current) {
        lastSavedMessageIdRef.current = lastMsg.id;
        onUpdateCompanionState({ chatMessages: messages });
      }
    }
  }, [messages]);

  useEffect(() => {
    setTimeout(() => {
      const scrollContainer = document.getElementById("chat-messages-container");
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }, 100);
  }, [messages, loading, chatMode]);



  // Stage 1 -> Stage 2
  const handleAspectSelect = (aspect) => {
    const userMsg = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: aspect.text,
      time: new Date()
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setSelectedAspect(aspect);

    setTimeout(() => {
      const botMsg = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: aspect.reply,
        time: new Date()
      };
      setMessages((prev) => [...prev, botMsg]);
      setLoading(false);
      setDialogStage(2);
    }, 1000);
  };

  // Stage 2 -> Stage 3 (Severity check-in follow-up)
  const handleSubAspectSelect = (subOpt) => {
    const userMsg = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: subOpt.text,
      time: new Date()
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setSelectedSubOption(subOpt);

    setTimeout(() => {
      const botMsg = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: subOpt.followUp,
        time: new Date()
      };
      setMessages((prev) => [...prev, botMsg]);
      setLoading(false);
      setDialogStage(3);
    }, 1000);
  };

  // Stage 3 -> Stage 4 (Recommend test) or Stage 5 (Direct advice)
  const handleSeveritySelect = (sevOpt) => {
    const userMsg = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: sevOpt.text,
      time: new Date()
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    setTimeout(() => {
      if (sevOpt.nextAction === "recommend_test") {
        const botMsg = {
          id: `bot-${Date.now()}`,
          sender: "bot",
          text: `Cảm ơn cậu đã chia sẻ chân thành. Với mức độ ảnh hưởng này, tớ khuyên cậu nên dành ra vài phút làm bài đánh giá ${sevOpt.testLabel} hoặc Quét kết quả phòng khám lâm sàng để tớ chẩn đoán chính xác nhất nhé.`,
          time: new Date()
        };
        setMessages((prev) => [...prev, botMsg]);
        setLoading(false);
        setDialogStage(4);
      } else {
        const botMsgId = `bot-${Date.now()}`;
        const botMsg = {
          id: botMsgId,
          sender: "bot",
          text: `${sevOpt.advice}\n\n💡 Lời khuyên vàng: ${sevOpt.quote}`,
          time: new Date()
        };

        if (healingActive) {
          setMessages((prev) => [...prev, botMsg]);
          setLoading(false);
          setDialogStage(0);
        } else {
          const pkgNames = {
            7: "Hành trình Nuôi dưỡng Bình yên (Peace)",
            14: "Hành trình Chăm sóc Tinh thần (Mindfulness)",
            30: "Hành trình Tái tạo Cân bằng (Balance)",
            50: "Hành trình Phục hồi Thấu cảm (Compassionate)",
            90: "Hành trình Đồng hành Chuyên sâu (Intensive)"
          };
          const name = pkgNames[sevOpt.recommendedDays] || "Hành trình Chăm sóc Tinh thần (Mindfulness)";

          const proposalMsg = {
            id: `bot-proposal-${Date.now() + 10}`,
            sender: "bot",
            text: `Để hỗ trợ tốt nhất cho tình trạng hiện tại của cậu, tớ khuyên cậu nên kích hoạt **${name}** với thời gian **${sevOpt.recommendedDays} ngày** để tớ đồng hành chăm sóc sức khỏe tinh thần hàng ngày cùng cậu. Cậu có muốn kích hoạt lộ trình này ngay bây giờ không?`,
            time: new Date(Date.now() + 10),
            isCompanionSetup: true,
            recommendedDays: sevOpt.recommendedDays
          };

          setMessages((prev) => [...prev, botMsg, proposalMsg]);
          setLoading(false);
          setDialogStage(5);
        }
      }
    }, 1000);
  };

  // Duration adjustments agreement option
  const handleSelectDuration = (msgId, duration) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === msgId) {
          return { ...m, selectedChoice: duration };
        }
        return m;
      })
    );

    if (typeof duration === "number") {
      const isCurrentlyActive = healingActive;
      const healingStartDateStr = localStorage.getItem("banhocduong_healing_start_date") || "";
      let currentDay = 1;
      if (healingStartDateStr) {
        const start = new Date(healingStartDateStr).getTime();
        const now = new Date().getTime();
        currentDay = Math.max(1, Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1);
      }

      const updatedLogs = [...historyLogs, {
        date: new Date().toISOString(),
        type: "duration_change",
        reason: isCurrentlyActive
          ? `Điều chỉnh thời gian lộ trình đồng hành thành: ${duration} ngày.`
          : `Kích hoạt lộ trình đồng hành: ${duration} ngày.`
      }];
      
      onUpdateCompanionState({
        healingActive: true,
        healingDuration: duration,
        healingStartDate: isCurrentlyActive 
          ? (healingStartDateStr || new Date().toISOString())
          : new Date().toISOString(),
        historyLogs: updatedLogs
      });

      // Request push notification permission and register service worker subscription
      if (webPushHelper.isSupported()) {
        webPushHelper.requestPermission().then((permission) => {
          if (permission === 'granted' && bio && bio.email) {
            webPushHelper.registerAndSubscribe(bio.email).catch((err) => {
              console.error('Failed to register web push subscription:', err);
            });
          }
        });
      }

      const userMsg = {
        id: `user-select-${Date.now()}`,
        sender: "user",
        text: isCurrentlyActive
          ? `Dạ, tớ đồng ý điều chỉnh thời gian lộ trình thành ${duration} ngày cùng cậu.`
          : `Dạ, tớ đồng ý kích hoạt lộ trình trị liệu ${duration} ngày cùng cậu.`,
        time: new Date()
      };
      const botMsg = {
        id: `bot-confirm-${Date.now()}`,
        sender: "bot",
        text: isCurrentlyActive
          ? `Tớ đã cập nhật tổng thời gian lộ trình đồng hành thành ${duration} ngày cho cậu rồi. Mọi dữ liệu check-in và tiến trình ngày thứ ${currentDay} của cậu đều được giữ nguyên vẹn nhé cậu yêu! 🌟`
          : `Tớ đã thiết lập lộ trình đồng hành ${duration} ngày cho cậu rồi. Kể từ ngày mai, cậu hãy duy trì việc check-in cảm xúc hằng ngày tại đây để nhận các bài tập tự chữa lành thích ứng từ tớ nhé.`,
        time: new Date(),
        showTherapyButton: true
      };
      setMessages((prev) => [...prev, userMsg, botMsg]);
    } else {
      const userMsg = {
        id: `user-select-${Date.now()}`,
        sender: "user",
        text: `Tớ chưa muốn tham gia lộ trình lúc này.`,
        time: new Date()
      };
      const botMsg = {
        id: `bot-confirm-${Date.now()}`,
        sender: "bot",
        text: `Tớ tôn trọng quyết định của cậu. Bất cứ khi nào cảm thấy cần người đồng hành hoặc muốn thực hiện kiểm tra tinh thần, cậu luôn có thể trò chuyện với tớ tại đây nhé. Chúc cậu luôn bình yên!`,
        time: new Date()
      };
      setMessages((prev) => [...prev, userMsg, botMsg]);
    }
    setDialogStage(0);
  };

  const handleStartTest = (testId) => {
    const baseTest = CLINICAL_TESTS[testId];
    if (!baseTest) return;

    // Sample a random variant for each question index
    let randomizedQuestions = [];
    if (baseTest.questionPool) {
      randomizedQuestions = baseTest.questionPool.map((variants) => {
        const idx = Math.floor(Math.random() * variants.length);
        return variants[idx];
      });
    } else {
      randomizedQuestions = [...baseTest.questions];
    }

    const testInstance = {
      ...baseTest,
      questions: randomizedQuestions
    };

    setShowTestsMenu(false);
    setChatMode("test");
    setActiveTest(testInstance);

    const userMsg = {
      id: `user-test-${Date.now()}`,
      sender: "user",
      text: `Tớ muốn thực hiện bài test ${baseTest.name}`,
      time: new Date()
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 600);
  };



  const handleTestComplete = (testId, score, answers) => {
    let reviewText = "";
    let eventLog = null;
    if (testId === "phq9") {
      const interpretation = CLINICAL_TESTS.phq9.getInterpretation(score);
      reviewText = `Tớ đã hoàn thành phân tích rồi. Kết quả đánh giá Trầm cảm PHQ-9 của cậu đạt ${score}/27 điểm (${interpretation.severity}).\n\n${interpretation.desc}`;
      
      eventLog = {
        date: new Date().toISOString(),
        test: "phq9",
        score,
        severity: interpretation.severity
      };
    } else if (testId === "gad7") {
      const interpretation = CLINICAL_TESTS.gad7.getInterpretation(score);
      reviewText = `Tớ đã phân tích xong rồi. Kết quả đánh giá Lo âu GAD-7 của cậu là ${score}/21 điểm (${interpretation.severity}).\n\n${interpretation.desc}`;
      
      eventLog = {
        date: new Date().toISOString(),
        test: "gad7",
        score,
        severity: interpretation.severity
      };
    } else if (testId === "who5") {
      const interpretation = CLINICAL_TESTS.who5.getInterpretation(score);
      reviewText = `Đã có kết quả phân tích rồi nè. Chỉ số trạng thái hạnh phúc WHO-5 của cậu đạt ${score}/25 điểm (${interpretation.status}).\n\n${interpretation.desc}`;
      
      eventLog = {
        date: new Date().toISOString(),
        test: "who5",
        score,
        status: interpretation.status,
        percent: score * 4
      };
    } else if (testId === "bigfive") {
      const interpretation = test.getInterpretation(answers);
      reviewText = `Biểu đồ năm nhân tố tính cách Big Five của cậu đã hoàn thành rồi:\n${interpretation.desc}\n\nTớ đã cập nhật các bài tập tự chữa lành thích ứng ở phần Trị Liệu để cậu rèn luyện hằng ngày nhé.`;
      eventLog = {
        date: new Date().toISOString(),
        type: "clinical_test",
        test: "bigfive",
        traits: {
          extraversion: parseFloat(interpretation.extraversion),
          agreeableness: parseFloat(interpretation.agreeableness),
          conscientiousness: parseFloat(interpretation.conscientiousness),
          neuroticism: parseFloat(interpretation.neuroticism),
          openness: parseFloat(interpretation.openness)
        },
        desc: interpretation.desc
      };
    }

    if (eventLog) {
      const updatedLogs = [...historyLogs, eventLog];
      onUpdateCompanionState({
        lastTestDate: new Date().toDateString(),
        historyLogs: updatedLogs
      });
    }

    const botReviewMsgId = `bot-review-${Date.now()}`;
    const botReviewMsg = {
      id: botReviewMsgId,
      sender: "bot",
      text: reviewText,
      time: new Date()
    };

    let newMsgs = [botReviewMsg];

    if (["phq9", "gad7", "who5"].includes(testId)) {
      let days = 14;
      let name = "Hành trình Chăm sóc Tinh thần (Mindfulness)";

      if (testId === "phq9") {
        if (score >= 20) { days = 90; name = "Hành trình Đồng hành Chuyên sâu (Intensive)"; }
        else if (score >= 15) { days = 50; name = "Hành trình Phục hồi Thấu cảm (Compassionate)"; }
        else if (score >= 10) { days = 30; name = "Hành trình Tái tạo Cân bằng (Balance)"; }
        else if (score >= 5) { days = 14; name = "Hành trình Chăm sóc Tinh thần (Mindfulness)"; }
        else { days = 7; name = "Hành trình Nuôi dưỡng Bình yên (Peace)"; }
      } else if (testId === "gad7") {
        if (score >= 15) { days = 50; name = "Hành trình Phục hồi Thấu cảm (Compassionate)"; }
        else if (score >= 10) { days = 30; name = "Hành trình Tái tạo Cân bằng (Balance)"; }
        else if (score >= 5) { days = 14; name = "Hành trình Chăm sóc Tinh thần (Mindfulness)"; }
        else { days = 7; name = "Hành trình Nuôi dưỡng Bình yên (Peace)"; }
      } else if (testId === "who5") {
        if (score <= 8) { days = 50; name = "Hành trình Phục hồi Thấu cảm (Compassionate)"; }
        else if (score <= 12) { days = 30; name = "Hành trình Tái tạo Cân bằng (Balance)"; }
        else if (score <= 17) { days = 14; name = "Hành trình Chăm sóc Tinh thần (Mindfulness)"; }
        else { days = 7; name = "Hành trình Nuôi dưỡng Bình yên (Peace)"; }
      }

      // Check if this test score is worse than the previous test result of the same type
      const pastTests = historyLogs.filter(log => (log.test === testId || (testId === "who5" && log.type === "clinical_test" && log.test === "who5")));
      let isWorse = false;
      let isImproved = false;
      let diffVal = 0;
      if (pastTests.length > 0) {
        const lastPast = pastTests[pastTests.length - 1];
        const lastScore = lastPast.score;
        if (testId === "who5") {
          // For WHO-5, lower score is worse
          if (score < lastScore) {
            isWorse = true;
            diffVal = lastScore - score;
          } else if (score > lastScore) {
            isImproved = true;
            diffVal = score - lastScore;
          }
        } else {
          // For PHQ-9 and GAD-7, higher score is worse
          if (score > lastScore) {
            isWorse = true;
            diffVal = score - lastScore;
          } else if (score < lastScore) {
            isImproved = true;
            diffVal = lastScore - score;
          }
        }
      } else {
        // Fallback: If no past tests, compare current recommended package days with active duration
        const healingDurationVal = parseInt(localStorage.getItem("banhocduong_healing_duration") || "30", 10);
        if (days > healingDurationVal) {
          isWorse = true;
          diffVal = Math.ceil((days - healingDurationVal) / 10) || 1;
        } else if (days < healingDurationVal) {
          isImproved = true;
          diffVal = Math.ceil((healingDurationVal - days) / 10) || 1;
        }
      }

      if (healingActive) {
        // If already active, we adjust relative to the remaining duration rather than resetting from scratch
        const healingStartDateStr = localStorage.getItem("banhocduong_healing_start_date") || "";
        const healingDurationVal = parseInt(localStorage.getItem("banhocduong_healing_duration") || "30", 10);
        let progressDays = 1;
        if (healingStartDateStr) {
          const start = new Date(healingStartDateStr).getTime();
          const now = new Date().getTime();
          progressDays = Math.max(1, Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1);
        }
        const remainingDays = Math.max(0, healingDurationVal - progressDays);

        if (progressDays >= healingDurationVal) {
          // Exceeded current duration (e.g. Day 57 of a 50-day journey)
          if (isImproved || days <= 14) {
            // Suggest graduation!
            const graduationMsg = {
              id: `bot-graduation-${Date.now() + 5}`,
              sender: "bot",
              text: `🎉 **Ghi nhận Tiến trình Phục hồi Tuyệt vời**: Chỉ số tái đánh giá ${testId.toUpperCase()} cho thấy sức khỏe tinh thần của cậu chuyển biến rất tốt và đã ổn định trở lại! \n\nCậu đã kiên trì vượt qua **${progressDays} ngày** của lộ trình tự chữa lành một cách xuất sắc. Tớ rất tự hào về cậu! Cậu hoàn toàn đã sẵn sàng để **tốt nghiệp lộ trình đồng hành** này rồi nhé. Cậu hãy bấm sang tab **Trị Liệu** hoặc **Hồ Sơ** để thực hiện tốt nghiệp nha! 🌸`,
              time: new Date(Date.now() + 5)
            };
            newMsgs.push(graduationMsg);
            setDialogStage(0);
          } else {
            // Suggest extension
            const extendDays = days;
            const finalRecommendedDuration = healingDurationVal + extendDays;
            const extensionMsg = {
              id: `bot-extend-${Date.now() + 5}`,
              sender: "bot",
              text: `📊 **Tái đánh giá Tinh thần**: Cậu đã đi qua **${progressDays} ngày** của lộ trình, nhưng kết quả test ${testId.toUpperCase()} lần này ghi nhận cậu vẫn còn gặp khá nhiều lo âu/mệt mỏi (${score} điểm). \n\nĐể tiếp tục nâng đỡ và hỗ trợ tinh thần cậu tốt nhất mà **không làm mất đi ${progressDays} ngày cậu đã kiên trì qua**, tớ đề xuất mở rộng thêm **+${extendDays} ngày** hỗ trợ (Tổng lộ trình nâng lên **${finalRecommendedDuration} ngày**, cậu còn **${remainingDays + extendDays} ngày**). Cậu có đồng ý áp dụng đề xuất thích ứng mới này không?`,
              time: new Date(Date.now() + 5),
              isCompanionSetup: true,
              recommendedDays: finalRecommendedDuration
            };
            newMsgs.push(extensionMsg);
            setDialogStage(5);
          }
        } else {
          // Within active journey
          if (isWorse) {
            // Calculate dynamically how many additional days of recovery support are needed depending on symptom surge
            let addDays = 7;
            if (testId === "phq9" && diffVal >= 5) addDays = 14;
            if (testId === "gad7" && diffVal >= 4) addDays = 14;
            if (testId === "who5" && diffVal >= 3) addDays = 10;
            if (pastTests.length === 0) addDays = Math.max(7, days - healingDurationVal);

            const finalRecommendedDuration = healingDurationVal + addDays;
            const worseningMsg = {
              id: `bot-worsening-${Date.now() + 5}`,
              sender: "bot",
              text: `📊 **Tái đánh giá Thích ứng**: Kết quả trắc nghiệm ${testId.toUpperCase()} ghi nhận chỉ số chuyển biến chưa thuận lợi (tăng ${diffVal} điểm so với lần trước). \n\nĐể hỗ trợ cậu vượt qua giai đoạn nhạy cảm này mà **không làm gián đoạn hay bác bỏ hành trình ${progressDays} ngày cậu đã cố gắng qua**, tớ đề xuất giữ nguyên tiến trình cũ và bổ sung thêm **+${addDays} ngày** hỗ trợ đặc biệt (Nâng tổng lộ trình thành **${finalRecommendedDuration} ngày**, cậu còn **${remainingDays + addDays} ngày** phía trước). Cậu có đồng ý áp dụng đề xuất này để tớ tiếp tục bên cạnh che chở cậu không?`,
              time: new Date(Date.now() + 5),
              isCompanionSetup: true,
              recommendedDays: finalRecommendedDuration
            };
            newMsgs.push(worseningMsg);
            setDialogStage(5);
          } else if (isImproved) {
            // If there is progress/improvement, check if we can reduce remaining days slightly to motivate, while keeping the journey intact
            let reduceDays = 0;
            if (pastTests.length > 0) {
              reduceDays = Math.min(Math.floor(remainingDays / 2), Math.max(3, diffVal * 2));
            } else {
              reduceDays = Math.min(Math.floor(remainingDays / 2), Math.max(3, Math.floor((healingDurationVal - days) / 2)));
            }

            if (reduceDays > 0 && remainingDays > 3) {
              const finalRecommendedDuration = Math.max(progressDays + 3, healingDurationVal - reduceDays);
              const progressMsg = {
                id: `bot-improvement-${Date.now() + 5}`,
                sender: "bot",
                text: `🎉 **Ghi nhận Tiến trình Tuyệt vời**: Chỉ số tái đánh giá tinh thần của cậu chuyển biến rất khả quan! Dưới góc nhìn khoa học hành vi, các hoạt động chánh niệm trị liệu đang thích ứng và phát huy tác dụng tích lũy lên trường năng lượng nội tại.\n\nĐể khích lệ và tối ưu lộ trình **dựa trên số liệu khoa học thực tế**, tớ đề xuất rút ngắn thời gian điều trị còn lại đi **-${reduceDays} ngày** (Tổng lộ trình đồng hành rút xuống **${finalRecommendedDuration} ngày**, cậu còn lại **${remainingDays - reduceDays} ngày** và giữ nguyên tiến trình đã tích lũy). Cậu có đồng ý áp dụng đề xuất thích ứng mới này không?`,
                time: new Date(Date.now() + 5),
                isCompanionSetup: true,
                recommendedDays: finalRecommendedDuration
              };
              newMsgs.push(progressMsg);
              setDialogStage(5);
            } else {
              // Stable
              const stayMsg = {
                id: `bot-proposal-${Date.now() + 10}`,
                sender: "bot",
                text: `Kết quả đánh giá định kỳ cho thấy tinh thần của cậu đang duy trì ở mức ổn định. Cậu hãy tiếp tục theo sát lộ trình chăm sóc hiện tại (**${remainingDays} ngày** còn lại trên tổng số **${healingDurationVal} ngày**) nhé!`,
                time: new Date(Date.now() + 10)
              };
              newMsgs.push(stayMsg);
              setDialogStage(0);
            }
          } else {
            // Stable
            const stayMsg = {
              id: `bot-proposal-${Date.now() + 10}`,
              sender: "bot",
              text: `Kết quả đánh giá định kỳ cho thấy tinh thần của cậu đang duy trì ở mức ổn định. Cậu hãy tiếp tục theo sát lộ trình chăm sóc hiện tại (**${remainingDays} ngày** còn lại trên tổng số **${healingDurationVal} ngày**) nhé!`,
              time: new Date(Date.now() + 10)
            };
            newMsgs.push(stayMsg);
            setDialogStage(0);
          }
        }
      } else {
        // Normal setup proposal for new journeys
        const proposalMsg = {
          id: `bot-proposal-${Date.now() + 10}`,
          sender: "bot",
          text: `Dựa trên kết quả đánh giá ${testId.toUpperCase()} vừa rồi, tớ khuyên cậu nên kích hoạt **${name}** với thời gian **${days} ngày** để tớ đồng hành chăm sức khỏe tinh thần hàng ngày cùng cậu. Cậu có muốn kích hoạt lộ trình này ngay bây giờ không?`,
          time: new Date(Date.now() + 10),
          isCompanionSetup: true,
          recommendedDays: days
        };
        newMsgs.push(proposalMsg);
        setDialogStage(5);
      }
    } else {
      setDialogStage(0);
    }

    setMessages((prev) => [...prev, ...newMsgs]);
    setChatMode("normal");
    setActiveTest(null);
  };

  const handleScanComplete = (testType, resultLog) => {
    let responseMsgText = "";
    if (testType === "dass") {
      const getDassInterpret = (scale, score) => {
        if (scale === "D") {
          if (score <= 9) return "Bình thường";
          if (score <= 13) return "Nhẹ";
          if (score <= 20) return "Vừa phải";
          if (score <= 27) return "Nặng";
          return "Rất nặng";
        }
        if (scale === "A") {
          if (score <= 7) return "Bình thường";
          if (score <= 9) return "Nhẹ";
          if (score <= 14) return "Vừa phải";
          if (score <= 19) return "Nặng";
          return "Rất nặng";
        }
        if (score <= 14) return "Bình thường";
        if (score <= 18) return "Nhẹ";
        if (score <= 25) return "Vừa phải";
        if (score <= 33) return "Nặng";
        return "Rất nặng";
      };

      const dSev = getDassInterpret("D", resultLog.scores.D);
      const aSev = getDassInterpret("A", resultLog.scores.A);
      const sSev = getDassInterpret("S", resultLog.scores.S);

      let solutions = [];
      if (resultLog.scores.D >= 10) {
        solutions.push(`Thực hành liệu pháp **Trị liệu Trầm cảm (CBT)** để xoa dịu u uất.`);
      }
      if (resultLog.scores.A >= 8) {
        solutions.push(`Tập thở chánh niệm **Điều hòa nhịp thở 4-7-8** để cắt lo âu tức thì.`);
      }
      if (resultLog.scores.S >= 15) {
        solutions.push(`Dành 10-15 phút **Ngồi Tĩnh Tâm** trước khi ngủ để thư giãn sóng não.`);
      }
      if (solutions.length === 0) {
        solutions.push(`Các chỉ số tốt. Hãy rèn luyện thể chất và trải nghiệm **Đọc sách Trị liệu**.`);
      }

      responseMsgText = `Tớ đã phân tích kết quả DASS-42 lâm sàng trích xuất từ hồ sơ phòng khám của cậu:\n\n` +
        `• **Trầm cảm (D):** ${resultLog.scores.D}/42 điểm (${dSev})\n` +
        `• **Lo âu (A):** ${resultLog.scores.A}/42 điểm (${aSev})\n` +
        `• **Căng thẳng (S):** ${resultLog.scores.S}/42 điểm (${sSev})\n\n` +
        `💡 **Giải pháp & Lộ trình đề xuất:**\n• ${solutions.join("\n• ")}`;
    } else {
      const scaleNames = { 
        Hs: "Nghi bệnh", D: "Trầm cảm", Hy: "Hysteria", Pd: "Sai lệch nhân cách", 
        Mf: "Nam/Nữ tính", Pa: "Hoang tưởng", Pt: "Suy nhược", 
        Sc: "Tâm thần phân liệt", Ma: "Hưng cảm nhẹ", Si: "Hướng ngoại xã hội" 
      };

      const validity = resultLog.validity;
      const clinical = resultLog.clinical;
      const elevated = clinical.filter(c => c.score >= 70);

      let solutions = [];
      if (elevated.length > 0) {
        elevated.forEach(e => {
          if (e.code === "Hs" || e.code === "Hy") {
            solutions.push(`Thang **${scaleNames[e.code]}** cao: Áp lực chuyển hóa thể chất. Hãy tập **Thở 4-7-8** để làm dịu.`);
          } else if (e.code === "D") {
            solutions.push(`Thang **Trầm cảm (D)** cao: Hãy viết nhật ký tích cực trong thẻ **Trị liệu Trầm cảm (CBT)**.`);
          } else if (e.code === "Pd") {
            solutions.push(`Thang **Sai lệch (Pd)** cao: Hãy ghi lại nhật ký cảm xúc để kiềm chế xung động.`);
          } else if (e.code === "Pt" || e.code === "Sc") {
            solutions.push(`Thang **${scaleNames[e.code]}** cao: Thường lo âu ám ảnh. Hãy rèn luyện thẻ **Ngồi Tĩnh Tâm**.`);
          } else if (e.code === "Si") {
            solutions.push(`Thang **Hướng nội (Si)** cao: Thiếu năng lượng xã hội. Hãy tham khảo **Đọc sách Trị liệu** tĩnh lặng.`);
          } else {
            solutions.push(`Thang **${scaleNames[e.code]}** cao: Thực hành các bài tập chánh niệm để tái tạo cân bằng.`);
          }
        });
      } else {
        solutions.push(`Các chỉ số nhân cách thích ứng tốt. Đề xuất thực hành **Đọc sách Trị liệu**.`);
      }

      responseMsgText = `Tớ đã hoàn tất trích xuất và phân tích 13 chỉ số nhân cách Mini-MMPI từ bệnh án phòng khám của cậu:\n\n` +
        `🔍 **Chỉ số kiểm định độ tin cậy (L-F-K):**\n` +
        `• L (Lie/Nói dối): **${validity.L} T-score** (${validity.L >= 70 ? "Vượt ngưỡng" : "Bình thường"})\n` +
        `• F (Infrequency/Dị biệt): **${validity.F} T-score** (${validity.F >= 80 ? "Cảnh báo" : "Bình thường"})\n` +
        `• K (Correction/Phòng vệ): **${validity.K} T-score** (${validity.K >= 70 ? "Vượt ngưỡng" : "Bình thường"})\n` +
        `• Đánh giá chung: **${resultLog.isReliable ? "Báo cáo hợp lệ" : "Báo cáo có độ tin cậy thấp"}**\n\n` +
        `📊 **Kết quả 10 Thang đo Lâm sàng:**\n` +
        clinical.map(c => `• ${scaleNames[c.code] || c.code}: **${c.score} T-score** ${c.score >= 70 ? "⚠️" : ""}`).join("\n") + `\n\n` +
        `💡 **Giải pháp tự chữa lành thích ứng:**\n• ${solutions.join("\n• ")}`;
    }

    const updatedLogs = [...historyLogs, resultLog];
    onUpdateCompanionState({
      lastTestDate: new Date().toDateString(),
      historyLogs: updatedLogs
    });

    const botMsgId = `bot-scan-${Date.now()}`;
    const botMsg = {
      id: botMsgId,
      sender: "bot",
      text: responseMsgText,
      time: new Date()
    };

    // Calculate recommended days based on scan metrics
    let recommendedDays = 7;
    let pkgName = "Hành trình Nuôi dưỡng Bình yên (Peace)";
    if (testType === "dass") {
      const { D, A, S } = resultLog.scores;
      if (D >= 28) { recommendedDays = 90; pkgName = "Hành trình Đồng hành Chuyên sâu (Intensive)"; }
      else if (D >= 21 || A >= 20 || S >= 26) { recommendedDays = 50; pkgName = "Hành trình Phục hồi Thấu cảm (Compassionate)"; }
      else if (D >= 14 || A >= 10 || S >= 19) { recommendedDays = 30; pkgName = "Hành trình Tái tạo Cân bằng (Balance)"; }
      else if (D >= 10 || A >= 8 || S >= 15) { recommendedDays = 14; pkgName = "Hành trình Chăm sóc Tinh thần (Mindfulness)"; }
    } else {
      const elevatedCount = resultLog.clinical.filter(c => c.score >= 70).length;
      if (elevatedCount >= 5) { recommendedDays = 90; pkgName = "Hành trình Đồng hành Chuyên sâu (Intensive)"; }
      else if (elevatedCount >= 3) { recommendedDays = 50; pkgName = "Hành trình Phục hồi Thấu cảm (Compassionate)"; }
      else if (elevatedCount >= 1) { recommendedDays = 30; pkgName = "Hành trình Tái tạo Cân bằng (Balance)"; }
      else if (!resultLog.isReliable) { recommendedDays = 14; pkgName = "Hành trình Chăm sóc Tinh thần (Mindfulness)"; }
    }

    let proposalMsg = null;
    let targetDialogStage = 5;

    if (healingActive) {
      const healingStartDateStr = localStorage.getItem("banhocduong_healing_start_date") || "";
      const healingDurationVal = parseInt(localStorage.getItem("banhocduong_healing_duration") || "30", 10);
      let progressDays = 1;
      if (healingStartDateStr) {
        const start = new Date(healingStartDateStr).getTime();
        const now = new Date().getTime();
        progressDays = Math.max(1, Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1);
      }
      const remainingDays = Math.max(0, healingDurationVal - progressDays);

      // Compare new scan with the previous test logs of same type
      let isWorse = false;
      let isImproved = false;
      let diffVal = 0;
      if (testType === "dass") {
        const pastDass = historyLogs.filter(l => l.scores && l.scores.D !== undefined);
        if (pastDass.length > 0) {
          const lastPast = pastDass[pastDass.length - 1];
          const newSum = resultLog.scores.D + resultLog.scores.A + resultLog.scores.S;
          const prevSum = lastPast.scores.D + lastPast.scores.A + lastPast.scores.S;
          if (newSum > prevSum) {
            isWorse = true;
            diffVal = newSum - prevSum;
          } else if (newSum < prevSum) {
            isImproved = true;
            diffVal = prevSum - newSum;
          }
        } else {
          if (recommendedDays > healingDurationVal) {
            isWorse = true;
            diffVal = Math.ceil((recommendedDays - healingDurationVal) / 10) || 1;
          } else if (recommendedDays < healingDurationVal) {
            isImproved = true;
            diffVal = Math.ceil((healingDurationVal - recommendedDays) / 10) || 1;
          }
        }
      } else {
        const pastMmpi = historyLogs.filter(l => l.clinical);
        if (pastMmpi.length > 0) {
          const lastPast = pastMmpi[pastMmpi.length - 1];
          const newElevated = resultLog.clinical.filter(c => c.score >= 70).length;
          const prevElevated = lastPast.clinical.filter(c => c.score >= 70).length;
          if (newElevated > prevElevated) {
            isWorse = true;
            diffVal = newElevated - prevElevated;
          } else if (newElevated < prevElevated) {
            isImproved = true;
            diffVal = prevElevated - newElevated;
          }
        } else {
          if (recommendedDays > healingDurationVal) {
            isWorse = true;
            diffVal = Math.ceil((recommendedDays - healingDurationVal) / 10) || 1;
          } else if (recommendedDays < healingDurationVal) {
            isImproved = true;
            diffVal = Math.ceil((healingDurationVal - recommendedDays) / 10) || 1;
          }
        }
      }

      if (progressDays >= healingDurationVal) {
        // Exceeded current duration (e.g. Day 57 of a 50-day journey)
        if (isImproved || recommendedDays <= 14) {
          // Suggest graduation!
          proposalMsg = {
            id: `bot-graduation-${Date.now() + 10}`,
            sender: "bot",
            text: `🎉 **Ghi nhận Tiến trình Phục hồi Tuyệt vời**: Kết quả quét hồ sơ lâm sàng mới nhất cho thấy tình trạng của cậu chuyển biến rất tốt và đã ổn định trở lại! \n\nCậu đã kiên trì vượt qua **${progressDays} ngày** của lộ trình tự chữa lành một cách xuất sắc. Tớ rất tự hào về cậu! Cậu hoàn toàn đã sẵn sàng để **tốt nghiệp lộ trình đồng hành** này rồi nhé. Cậu hãy bấm sang tab **Trị Liệu** hoặc **Hồ Sơ** để thực hiện tốt nghiệp nha! 🌸`,
            time: new Date(Date.now() + 10)
          };
          targetDialogStage = 0;
        } else {
          // Suggest extension
          const extendDays = recommendedDays;
          const finalRecommendedDuration = healingDurationVal + extendDays;
          proposalMsg = {
            id: `bot-extend-${Date.now() + 10}`,
            sender: "bot",
            text: `📊 **Tái đánh giá Tinh thần**: Cậu đã đi qua **${progressDays} ngày** của lộ trình, nhưng kết quả quét hồ sơ lâm sàng lần này ghi nhận cậu vẫn còn gặp một số áp lực lâm sàng. \n\nĐể tiếp tục nâng đỡ và hỗ trợ tinh thần cậu tốt nhất mà **không làm mất đi ${progressDays} ngày cậu đã kiên trì qua**, tớ đề xuất mở rộng thêm **+${extendDays} ngày** hỗ trợ (Tổng lộ trình nâng lên **${finalRecommendedDuration} ngày**, cậu còn **${remainingDays + extendDays} ngày**). Cậu có đồng ý áp dụng đề xuất thích ứng mới này không?`,
            time: new Date(Date.now() + 10),
            isCompanionSetup: true,
            recommendedDays: finalRecommendedDuration
          };
          targetDialogStage = 5;
        }
      } else {
        // Within active journey
        if (isWorse) {
          const addDays = testType === "dass" ? Math.min(14, Math.max(7, diffVal)) : Math.min(14, diffVal * 7);
          const finalRecommendedDuration = healingDurationVal + addDays;
          
          proposalMsg = {
            id: `bot-worsening-${Date.now() + 10}`,
            sender: "bot",
            text: `📊 **Tái đánh giá Thích ứng**: Kết quả quét bệnh án mới nhất cho thấy tình trạng của cậu có phần căng thẳng hơn trước (các chỉ số lâm sàng tăng nhẹ). \n\nĐể hỗ trợ cậu vượt qua giai đoạn này mà **không làm mất đi ${progressDays} ngày cậu đã cố gắng trước đó**, tớ đề xuất giữ nguyên tiến trình cũ và bổ sung thêm **+${addDays} ngày** đồng hành hỗ trợ (Nâng tổng lộ trình thành **${finalRecommendedDuration} ngày**, cậu còn **${remainingDays + addDays} ngày** phía trước). Cậu có đồng ý áp dụng đề xuất thích ứng mới này không?`,
            time: new Date(Date.now() + 10),
            isCompanionSetup: true,
            recommendedDays: finalRecommendedDuration
          };
          targetDialogStage = 5;
        } else if (isImproved) {
          // Improvement
          let reduceDays = 0;
          if (testType === "dass") {
            const pastDass = historyLogs.filter(l => l.scores && l.scores.D !== undefined);
            if (pastDass.length > 0) {
              reduceDays = Math.min(Math.floor(remainingDays / 2), Math.max(3, diffVal));
            } else {
              reduceDays = Math.min(Math.floor(remainingDays / 2), Math.max(3, Math.floor((healingDurationVal - recommendedDays) / 2)));
            }
          } else {
            const pastMmpi = historyLogs.filter(l => l.clinical);
            if (pastMmpi.length > 0) {
              reduceDays = Math.min(Math.floor(remainingDays / 2), Math.max(3, diffVal * 3));
            } else {
              reduceDays = Math.min(Math.floor(remainingDays / 2), Math.max(3, Math.floor((healingDurationVal - recommendedDays) / 2)));
            }
          }

          if (reduceDays > 0 && remainingDays > 3) {
            const finalRecommendedDuration = Math.max(progressDays + 3, healingDurationVal - reduceDays);
            proposalMsg = {
              id: `bot-improvement-${Date.now() + 10}`,
              sender: "bot",
              text: `🎉 **Ghi nhận Tiến trình Tuyệt vời**: Chỉ số tái đánh giá tinh thần qua bệnh án mới quét của cậu chuyển biến rất khả quan! \n\nĐể khích lệ và tối ưu lộ trình **dựa trên số liệu khoa học thực tế**, tớ đề xuất rút ngắn thời gian điều trị còn lại đi **-${reduceDays} ngày** (Tổng lộ trình đồng hành rút xuống **${finalRecommendedDuration} ngày**, cậu còn lại **${remainingDays - reduceDays} ngày** và giữ nguyên tiến trình đã tích lũy). Cậu có đồng ý áp dụng đề xuất thích ứng mới này không?`,
              time: new Date(Date.now() + 10),
              isCompanionSetup: true,
              recommendedDays: finalRecommendedDuration
            };
            targetDialogStage = 5;
          } else {
            proposalMsg = {
              id: `bot-proposal-${Date.now() + 10}`,
              sender: "bot",
              text: `Kết quả quét bệnh án định kỳ cho thấy tinh thần của cậu đang duy trì ở mức ổn định. Cậu hãy tiếp tục theo sát lộ trình chăm sóc hiện tại (**${remainingDays} ngày** còn lại trên tổng số **${healingDurationVal} ngày**) nhé!`,
              time: new Date(Date.now() + 10)
            };
            targetDialogStage = 0;
          }
        } else {
          // Stable
          proposalMsg = {
            id: `bot-proposal-${Date.now() + 10}`,
            sender: "bot",
            text: `Kết quả quét bệnh án định kỳ cho thấy tinh thần của cậu đang duy trì ở mức ổn định. Cậu hãy tiếp tục theo sát lộ trình chăm sóc hiện tại (**${remainingDays} ngày** còn lại trên tổng số **${healingDurationVal} ngày**) nhé!`,
            time: new Date(Date.now() + 10)
          };
          targetDialogStage = 0;
        }
      }
    } else {
      // Normal setup proposal for new journeys
      proposalMsg = {
        id: `bot-proposal-${Date.now() + 10}`,
        sender: "bot",
        text: `Dựa trên kết quả Quét hồ sơ lâm sàng của cậu, tớ khuyên cậu nên kích hoạt **${pkgName}** với thời gian **${recommendedDays} ngày** để tớ đồng hành chăm sóc sức khỏe tinh thần hàng ngày cùng cậu. Cậu có muốn kích hoạt lộ trình này ngay bây giờ không?`,
        time: new Date(Date.now() + 10),
        isCompanionSetup: true,
        recommendedDays: recommendedDays
      };
      targetDialogStage = 5;
    }

    setMessages((prev) => [...prev, botMsg, ...(proposalMsg ? [proposalMsg] : [])]);
    setChatMode("normal");
    setDialogStage(targetDialogStage);
  };

  return (
    <div className="flex flex-col min-h-[580px] md:min-h-[600px] h-[580px] md:h-[600px] justify-between relative bg-zinc-50/20 dark:bg-black/10 animate-fadeIn">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float-mascot {
          0% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-8px) scale(1.01); }
          100% { transform: translateY(0px) scale(1); }
        }
        .animate-float-mascot {
          animation: float-mascot 4s ease-in-out infinite;
        }
        .comic-dotted-bg {
          background-image: radial-gradient(rgba(0, 0, 0, 0.04) 1.5px, transparent 1.5px);
          background-size: 16px 16px;
        }
        .dark .comic-dotted-bg {
          background-image: radial-gradient(rgba(255, 255, 255, 0.04) 1.5px, transparent 1.5px);
        }
      `}} />

      {/* Header Info */}
      <div className="px-5 py-3.5 bg-white dark:bg-[#12111a] border-b-2 border-zinc-900 dark:border-zinc-800 flex items-center justify-between shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 flex items-center justify-center">
            <span className="material-symbols-outlined text-sm font-black">healing</span>
          </div>
          <div>
            <h4 className="text-xs font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">Chuyên viên Đồng Hành</h4>
            <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">Trị liệu & Chăm sóc Thích ứng</p>
          </div>
        </div>

        {healingActive && (
          <button
            type="button"
            onClick={() => {
              const lastTestDateStr = localStorage.getItem("banhocduong_last_test_date");
              if (lastTestDateStr) {
                const lastTestTime = new Date(lastTestDateStr).getTime();
                const nowTime = new Date().getTime();
                const hoursDiff = (nowTime - lastTestTime) / (1000 * 60 * 60);
                if (hoursDiff < 32) {
                  const remainingHours = Math.ceil(32 - hoursDiff);
                  if (showToast) {
                    showToast(`Cậu vừa làm bài test chưa lâu. Vui lòng đợi thêm ${remainingHours} giờ để tiếp tục đánh giá chính xác nhé.`, "warning");
                  }
                  return;
                }
              }
              setShowTestsMenu(true);
            }}
            className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-500 to-indigo-650 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-md text-[9px] font-black uppercase tracking-wider shadow-md transition-all active:scale-[0.98] flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[10px] font-bold">refresh</span>
            Chủ động test lại
          </button>
        )}
      </div>

      {/* Clinical Test Selection Menu Popup */}
      {showTestsMenu && (
        <div className="absolute top-[55px] right-4 w-64 p-4 rounded-lg border-2 border-zinc-900 dark:border-zinc-800 bg-white dark:bg-[#12111a] shadow-xl z-20 space-y-2 animate-scaleUp">
          <div className="flex justify-between items-center pb-1 border-b border-zinc-150/40">
            <h5 className="text-[9.5px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Bài đánh giá chuẩn lâm sàng</h5>
            <button type="button" onClick={() => setShowTestsMenu(false)} className="text-zinc-400 hover:text-zinc-650 text-[10px] font-bold">Đóng</button>
          </div>
          <div className="flex flex-col gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => handleStartTest("phq9")}
              className="w-full text-left px-3 py-2 bg-red-500/5 hover:bg-red-500/10 text-red-650 rounded-md text-[10px] font-black uppercase tracking-wider border border-red-500/10"
            >
              [PHQ-9] Đánh giá Trầm cảm
            </button>
            <button
              type="button"
              onClick={() => handleStartTest("gad7")}
              className="w-full text-left px-3 py-2 bg-cyan-500/5 hover:bg-cyan-500/10 text-cyan-650 rounded-md text-[10px] font-black uppercase tracking-wider border border-cyan-500/10"
            >
              [GAD-7] Đánh giá Lo âu
            </button>
            <button
              type="button"
              onClick={() => handleStartTest("who5")}
              className="w-full text-left px-3 py-2 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-650 rounded-md text-[10px] font-black uppercase tracking-wider border border-emerald-500/10"
            >
              [WHO-5] Đánh giá Hạnh phúc
            </button>
            <button
              type="button"
              onClick={() => handleStartTest("bigfive")}
              className="w-full text-left px-3 py-2 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-655 rounded-md text-[10px] font-black uppercase tracking-wider border border-indigo-500/10"
            >
              [Big Five] Trắc nghiệm Nhân cách
            </button>
          </div>
        </div>
      )}

      {/* Main Comic Strip Layout */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 comic-dotted-bg">
        {/* Left Column: Mascot */}
        <div className="hidden md:flex md:w-[26%] flex-col justify-end items-center relative select-none pb-2 border-r border-zinc-200/50 dark:border-zinc-800/20">
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-100/50 via-transparent to-transparent dark:from-zinc-950/20 pointer-events-none" />
          <img
            src="/image/avt7.png"
            alt="Chuyên viên đồng hành"
            className="w-full max-w-[200px] h-[340px] object-contain animate-float-mascot z-10 filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.15)]"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/image/avt6.png"; 
            }}
          />
          <span className="mb-2 px-3 py-1 rounded-full bg-zinc-900/90 text-white dark:bg-white/90 dark:text-zinc-900 text-[8px] font-black tracking-widest uppercase z-10 shadow-sm">
            Chuyên viên Đồng Hành
          </span>
        </div>

        {/* Right Column: Dialogue and Actions */}
        <div className="flex-1 flex flex-col min-h-0 justify-between p-4">
          {chatMode === "normal" && (
            <ChatMessages
              messages={messages}
              completedMessageIds={completedMessageIds}
              setCompletedMessageIds={setCompletedMessageIds}
              onStartTest={handleStartTest}
              onSelectDuration={handleSelectDuration}
              loading={loading}
              onNavigateToTab={onNavigateToTab}
              messagesEndRef={messagesEndRef}
            />
          )}

          {chatMode === "test" && activeTest && (
            <ClinicalTestPanel
              activeTest={activeTest}
              onTestComplete={handleTestComplete}
              onCancel={() => {
                setChatMode("normal");
                setActiveTest(null);
              }}
            />
          )}

          {chatMode === "scan" && (
            <ClinicScanner
              onScanComplete={handleScanComplete}
              onCancel={() => setChatMode("normal")}
            />
          )}

          {/* Action Options Menu (No text typing allowed) */}
          {chatMode === "normal" && !loading && isLastMessageCompleted && (
            <>
              {dialogStage === 1 && (
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-200/50 dark:border-zinc-800/10 shrink-0">
                  {(healingActive ? COMPANION_DIALOGUE_TREE : DIALOGUE_TREE).aspects.map(aspect => (
                    <button
                      key={aspect.id}
                      type="button"
                      onClick={() => handleAspectSelect(aspect)}
                      className="py-2.5 px-3 rounded-md border-2 border-zinc-900 dark:border-zinc-855 bg-white dark:bg-zinc-900 text-[9.5px] font-black uppercase text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-[1px_1px_0px_0px_rgba(9,9,11,1)] text-left flex items-center justify-between"
                    >
                      <span>{aspect.text}</span>
                      <span className="material-symbols-outlined text-[11px]">arrow_forward</span>
                    </button>
                  ))}
                </div>
              )}

              {dialogStage === 2 && selectedAspect && (
                <div className="flex flex-col gap-2 pt-2 border-t border-zinc-200/50 dark:border-zinc-800/10 shrink-0">
                  {selectedAspect.options.map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSubAspectSelect(opt)}
                      className="py-2.5 px-3 rounded-md border-2 border-zinc-900 dark:border-zinc-850 bg-white dark:bg-zinc-900 text-[9.5px] font-black uppercase text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-[1px_1px_0px_0px_rgba(9,9,11,1)] text-left flex items-center justify-between"
                    >
                      <span>{opt.text}</span>
                      <span className="material-symbols-outlined text-[11px]">arrow_forward</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setDialogStage(1);
                      const botMsg = {
                        id: `bot-reset-${Date.now()}`,
                        sender: "bot",
                        text: healingActive
                          ? "Tớ luôn bên cậu lắng nghe cậu yêu, cậu có muốn chia sẻ thêm khía cạnh nào khác không?"
                          : "Tớ luôn sẵn lòng lắng nghe cậu yêu, cậu có muốn chia sẻ về khía cạnh nào khác không?",
                        time: new Date()
                      };
                      setMessages(prev => [...prev, botMsg]);
                    }}
                    className="py-2.5 px-3 rounded-md border-2 border-zinc-900 dark:border-zinc-850 bg-zinc-100 dark:bg-zinc-900 text-[9.5px] font-black uppercase text-zinc-550 hover:bg-zinc-50 shadow-[1px_1px_0px_0px_rgba(9,9,11,1)] text-center"
                  >
                    Quay lại chọn khía cạnh khác
                  </button>
                </div>
              )}

              {dialogStage === 3 && selectedSubOption && (
                <div className="flex flex-col gap-2 pt-2 border-t border-zinc-200/50 dark:border-zinc-800/10 shrink-0">
                  {selectedSubOption.severityOptions.map(sevOpt => (
                    <button
                      key={sevOpt.id}
                      type="button"
                      onClick={() => handleSeveritySelect(sevOpt)}
                      className="py-2.5 px-3 rounded-md border-2 border-zinc-900 dark:border-zinc-850 bg-white dark:bg-zinc-900 text-[9.5px] font-black uppercase text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-[1px_1px_0px_0px_rgba(9,9,11,1)] text-left flex items-center justify-between"
                    >
                      <span>{sevOpt.text}</span>
                      <span className="material-symbols-outlined text-[11px]">arrow_forward</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setDialogStage(2);
                    }}
                    className="py-2.5 px-3 rounded-md border-2 border-zinc-900 dark:border-zinc-850 bg-zinc-100 dark:bg-zinc-900 text-[9.5px] font-black uppercase text-zinc-550 hover:bg-zinc-50 shadow-[1px_1px_0px_0px_rgba(9,9,11,1)] text-center"
                  >
                    Quay lại câu trước
                  </button>
                </div>
              )}

              {dialogStage === 4 && selectedSubOption && (
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-200/50 dark:border-zinc-800/10 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const sevHigh = selectedSubOption.severityOptions.find(o => o.nextAction === "recommend_test");
                      if (sevHigh) handleStartTest(sevHigh.test);
                    }}
                    className="py-2.5 px-3 rounded-md border-2 border-zinc-900 dark:border-zinc-850 bg-[#0071e3] text-white text-[9.5px] font-black uppercase hover:bg-[#0077ed] shadow-[1px_1px_0px_0px_rgba(9,9,11,1)] text-left flex items-center justify-between"
                  >
                    <span>Làm bài test đánh giá</span>
                    <span className="material-symbols-outlined text-[11px]">play_arrow</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setChatMode("scan")}
                    className="py-2.5 px-3 rounded-md border-2 border-zinc-900 dark:border-zinc-850 bg-white dark:bg-zinc-900 text-[9.5px] font-black uppercase text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-[1px_1px_0px_0px_rgba(9,9,11,1)] text-left flex items-center justify-between"
                  >
                    <span>Quét kết quả phòng khám</span>
                    <span className="material-symbols-outlined text-[11px]">cloud_upload</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDialogStage(1);
                      const botMsg = {
                        id: `bot-reset-${Date.now()}`,
                        sender: "bot",
                        text: healingActive
                          ? "Tớ hiểu rồi cậu yêu. Cậu có muốn giãi bày hay chia sẻ thêm khía cạnh nào khác với tớ không?"
                          : "Tớ hiểu rồi cậu yêu. Cậu muốn chia sẻ thêm khía cạnh nào khác không? Hãy cứ thoải mái bày tỏ suy nghĩ của cậu với tớ nhé.",
                        time: new Date()
                      };
                      setMessages(prev => [...prev, botMsg]);
                    }}
                    className="py-2.5 px-3 rounded-md border-2 border-zinc-900 dark:border-zinc-855 bg-zinc-150 dark:bg-zinc-900 hover:bg-zinc-250 dark:hover:bg-zinc-800 text-[9.5px] font-black uppercase text-zinc-600 dark:text-zinc-300 shadow-[1px_1px_0px_0px_rgba(9,9,11,1)] text-center col-span-2"
                  >
                    Quay lại từ đầu
                  </button>
                </div>
              )}

              {dialogStage === 5 && (
                <div className="flex flex-col gap-2 pt-2 border-t border-zinc-200/50 dark:border-zinc-800/10 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setDialogStage(1);
                      const botMsg = {
                        id: `bot-reset-${Date.now()}`,
                        sender: "bot",
                        text: healingActive
                          ? "Tớ luôn bên cậu yêu. Dạo này tiến trình tự chữa lành và cảm xúc của cậu thế nào? Hãy chọn chia sẻ dưới đây nhé."
                          : "Tớ luôn sẵn lòng lắng nghe cậu yêu. Dạo gần đây có chuyện gì làm cậu bận tâm nhất? Hãy chọn chia sẻ với tớ dưới đây nhé.",
                        time: new Date()
                      };
                      setMessages(prev => [...prev, botMsg]);
                    }}
                    className="py-2.5 px-3 rounded-md border-2 border-zinc-900 dark:border-zinc-855 bg-zinc-100 dark:bg-zinc-900 text-[9.5px] font-black uppercase text-zinc-550 hover:bg-zinc-50 shadow-[1px_1px_0px_0px_rgba(9,9,11,1)] text-center"
                  >
                    Quay lại từ đầu
                  </button>
                </div>
              )}

              {dialogStage === 0 && (
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-200/50 dark:border-zinc-800/10 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setDialogStage(1);
                      const botMsg = {
                        id: `bot-loop-${Date.now()}`,
                        sender: "bot",
                        text: healingActive
                          ? "Tớ luôn sẵn lòng đồng hành và lắng nghe cậu yêu. Hôm nay cậu muốn chia sẻ hay tâm sự thêm điều gì với tớ không?"
                          : "Tớ luôn sẵn lòng đồng hành cùng cậu yêu. Gần đây điều gì khiến cậu suy nghĩ nhiều nhất? Cậu có thể chọn chia sẻ dưới đây với tớ nhé.",
                        time: new Date()
                      };
                      setMessages(prev => [...prev, botMsg]);
                    }}
                    className="py-2.5 px-3 rounded-md border-2 border-zinc-900 dark:border-zinc-850 bg-white dark:bg-zinc-900 text-[9.5px] font-black uppercase text-zinc-805 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-[1px_1px_0px_0px_rgba(9,9,11,1)] text-left flex items-center justify-between"
                  >
                    <span>[Trò chuyện] Chia sẻ thêm khía cạnh khác</span>
                    <span className="material-symbols-outlined text-[11px]">chat</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTestsMenu(true)}
                    className="py-2.5 px-3 rounded-md border-2 border-zinc-900 dark:border-zinc-850 bg-white dark:bg-zinc-900 text-[9.5px] font-black uppercase text-zinc-805 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-[1px_1px_0px_0px_rgba(9,9,11,1)] text-left flex items-center justify-between"
                  >
                    <span>[Đánh giá] Thực hiện bài test</span>
                    <span className="material-symbols-outlined text-[11px]">arrow_forward</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setChatMode("scan")}
                    className="py-2.5 px-3 rounded-md border-2 border-zinc-900 dark:border-zinc-850 bg-white dark:bg-zinc-900 text-[9.5px] font-black uppercase text-zinc-805 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-[1px_1px_0px_0px_rgba(9,9,11,1)] text-left flex items-center justify-between"
                  >
                    <span>[Quét kết quả] Phân tích hồ sơ</span>
                    <span className="material-symbols-outlined text-[11px]">cloud_upload</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
