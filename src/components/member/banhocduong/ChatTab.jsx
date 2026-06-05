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
      text: "Em đang gặp áp lực lớn từ học tập và thi cử",
      reply: "Tôi hiểu áp lực đó. Việc đối mặt với thi cử liên tục và khối lượng bài vở dồn dập rất dễ khiến tinh thần em bị căng thẳng quá mức. Có phải em đang cảm thấy lo lắng rằng kết quả không tốt sẽ làm bản thân hoặc gia đình thất vọng?",
      options: [
        {
          id: "study_fail",
          text: "Đúng vậy, em rất sợ thi trượt và kết quả kém",
          followUp: "Sự lo sợ thất bại học đường có thể gây sức ép đè nặng lên tinh thần em. Nỗi lo lắng này có xuất hiện thường xuyên đến mức làm em bị mất ngủ, bỏ bữa hay mất tập trung học tập suốt cả ngày không?",
          severityOptions: [
            { id: "study_fail_high", text: "Có, nỗi lo âu này lặp lại nhiều lần khiến em mất tập trung và kiệt quệ", nextAction: "recommend_test", test: "gad7", testLabel: "[GAD-7] Trắc nghiệm Lo âu" },
            { id: "study_fail_low", text: "Không quá nghiêm trọng, em vẫn kiểm soát được nhưng đôi lúc thấy nản chí", nextAction: "direct_advice", advice: "Áp lực học tập đôi khi là động lực nhưng cũng rất dễ làm ta kiệt sức. Em hãy học cách chia nhỏ mục tiêu học tập, cho bản thân những khoảng nghỉ ngơi ngắn và hít thở sâu để điều hòa tinh thần.", quote: "“Thành công không phải là cuối cùng, thất bại không phải là tử địa: đó là lòng dũng cảm để tiếp tục mới là quan trọng.” - Winston Churchill", recommendedDays: 14 }
          ]
        },
        {
          id: "study_overload",
          text: "Không hẳn, em chỉ thấy quá tải vì khối lượng bài vở quá nhiều",
          followUp: "Lượng bài vở dồn dập khiến thời gian tự chăm sóc bản thân của em bị thu hẹp. Cảm giác quá tải này có lặp đi lặp lại liên tục khiến em cảm thấy bế tắc, bất lực không?",
          severityOptions: [
            { id: "study_overload_high", text: "Có, em cảm thấy bế tắc hoàn toàn trước đống bài vở và bài tập", nextAction: "recommend_test", test: "gad7", testLabel: "[GAD-7] Trắc nghiệm Lo âu" },
            { id: "study_overload_low", text: "Em chỉ thấy mệt lúc làm bài quá sức, nghỉ ngơi đầy đủ sẽ đỡ hơn", nextAction: "direct_advice", advice: "Quá tải bài vở là tình trạng phổ biến. Em nên học cách phân chia thời gian học tập khoa học hơn, ví dụ áp dụng phương pháp Pomodoro để làm việc 25 phút và nghỉ 5 phút.", quote: "“Cách tốt nhất để bắt đầu là ngừng nói và bắt đầu làm.” - Walt Disney", recommendedDays: 7 }
          ]
        }
      ]
    },
    {
      id: "family",
      text: "Em thấy ngột ngạt vì các vấn đề gia đình",
      reply: "Tôi chia sẻ với những gì em đang trải qua. Áp lực từ sự kỳ vọng hay những bất đồng ý kiến từ cha mẹ thực sự rất dễ gây tổn thương tinh thần. Có phải em cảm thấy thiếu sự lắng nghe và thấu hiểu từ những người thân yêu?",
      options: [
        {
          id: "family_lonely",
          text: "Đúng vậy, em cảm thấy cô độc ngay trong chính ngôi nhà của mình",
          followUp: "Cảm giác đơn độc trong chính ngôi nhà của mình là một trải nghiệm rất đau lòng. Sự cô độc này có kéo dài liên tục làm em thu mình lại, không muốn trò chuyện hay kết nối với bất kỳ ai nữa không?",
          severityOptions: [
            { id: "family_lonely_high", text: "Có, em hầu như luôn thu mình lại và cảm thấy lạc lõng sâu sắc", nextAction: "recommend_test", test: "phq9", testLabel: "[PHQ-9] Trắc nghiệm Trầm cảm" },
            { id: "family_lonely_low", text: "Chỉ là đôi khi em cảm thấy bị ngột ngạt, thỉnh thoảng vẫn giãi bày được với bạn bè", nextAction: "direct_advice", advice: "Gia đình là chỗ dựa quan trọng nhưng khi gặp bất đồng, em có thể tìm kiếm điểm tựa tinh thần lành mạnh từ bạn bè thân thiết hoặc ghi nhật ký để giải tỏa bớt những dồn nén trong lòng.", quote: "“Không có ai cô độc khi họ biết tự yêu thương và trân trọng bản thân mình.” - Phật Thích Ca Mâu Ni", recommendedDays: 14 }
          ]
        },
        {
          id: "family_conflict",
          text: "Gia đình thường xuyên xảy ra tranh cãi căng thẳng khiến em mệt mỏi",
          followUp: "Bầu không khí căng thẳng thường trực trong gia đình rất dễ bào mòn tinh thần. Những cuộc tranh cãi này có diễn ra liên tục khiến em luôn bất an, tim đập nhanh hay sợ hãi mỗi khi ở nhà không?",
          severityOptions: [
            { id: "family_conflict_high", text: "Có, không khí gia đình vô cùng căng thẳng khiến em thường xuyên bất an, hoảng sợ", nextAction: "recommend_test", test: "phq9", testLabel: "[PHQ-9] Trắc nghiệm Trầm cảm" },
            { id: "family_conflict_low", text: "Thỉnh thoảng mới tranh cãi lớn, khi mọi chuyện lắng xuống em thấy ổn hơn", nextAction: "direct_advice", advice: "Khi gia đình xảy ra xung đột, việc bảo vệ không gian bình yên trong tâm trí em là ưu tiên hàng đầu. Hãy tránh tranh luận trực tiếp khi cơn nóng giận của mọi người đang ở đỉnh điểm.", quote: "“Hòa bình bắt đầu bằng một nụ cười và sự thấu hiểu từ bên trong.” - Mẹ Teresa", recommendedDays: 7 }
          ]
        }
      ]
    },
    {
      id: "relationships",
      text: "Em gặp phiền muộn trong tình cảm hoặc bạn bè",
      reply: "Những tổn thương và rạn nứt trong các mối quan hệ xã hội thường để lại những cảm xúc hụt hẫng, bứt rứt khó chịu. Hiện tại em đang cảm thấy bị cô lập hay có sự hiểu lầm nào chưa thể tháo gỡ?",
      options: [
        {
          id: "rel_isolated",
          text: "Đúng vậy, em cảm thấy lạc lõng và bị cô lập",
          followUp: "Bị cô lập hoặc không được tập thể chấp nhận đem lại cảm xúc hụt hẫng rất lớn. Tình trạng này có diễn ra lâu ngày làm em hoài nghi giá trị bản thân hay chán ghét việc đến trường không?",
          severityOptions: [
            { id: "rel_isolated_high", text: "Có, em thấy vô cùng lạc lõng và chán nản việc đi học mỗi ngày", nextAction: "recommend_test", test: "who5", testLabel: "[WHO-5] Đo chỉ số Hạnh phúc" },
            { id: "rel_isolated_low", text: "Em vẫn có những người bạn khác bên ngoài nhưng vẫn buồn vì chuyện này", nextAction: "direct_advice", advice: "Mối quan hệ bạn bè sẽ thay đổi theo từng giai đoạn phát triển. Đôi khi việc chấp nhận buông bỏ những mối quan hệ độc hại là cơ hội lớn để em gặp gỡ những người thực sự trân trọng em.", quote: "“Hãy là chính mình, bởi vì những người quan tâm không quan trọng, và những người quan trọng sẽ không quan tâm.” - Dr. Seuss", recommendedDays: 14 }
          ]
        },
        {
          id: "rel_fight",
          text: "Chỉ là một vài bất đồng nhỏ nhưng vẫn khiến em suy nghĩ và buồn bã",
          followUp: "Những xích mích nhỏ đôi khi vẫn khiến ta suy nghĩ lặp đi lặp lại. Cảm xúc buồn bã này có xuất hiện thường trực khiến em khó chịu và ảnh hưởng đến năng lượng học tập hàng ngày không?",
          severityOptions: [
            { id: "rel_fight_high", text: "Có, em luôn suy nghĩ lặp đi lặp lại về chuyện đó khiến cơ thể mệt mỏi", nextAction: "recommend_test", test: "who5", testLabel: "[WHO-5] Đo chỉ số Hạnh phúc" },
            { id: "rel_fight_low", text: "Không quá nhiều, em tin hai bên sẽ sớm làm hòa nhưng vẫn thấy bận lòng một chút", nextAction: "direct_advice", advice: "Bất đồng nhỏ là cơ hội để hai bên hiểu nhau sâu sắc hơn. Hãy chủ động trò chuyện thẳng thắn và lắng nghe đối phương khi cả hai đã hoàn toàn bình tĩnh nhé.", quote: "“Lòng bao dung là bông hoa đẹp nhất của tâm hồn.” - Helen Keller", recommendedDays: 7 }
          ]
        }
      ]
    },
    {
      id: "self",
      text: "Em cảm thấy mệt mỏi kéo dài, kiệt sức và mất ngủ",
      reply: "Tình trạng kiệt quệ thể chất và mất ngủ là những dấu hiệu cảnh báo tinh thần đang quá tải. Giấc ngủ không sâu sẽ càng làm suy giảm năng lượng và tăng cảm giác lo âu. Em có thường xuyên bị trằn trọc bởi những suy nghĩ tiêu cực vào ban đêm không?",
      options: [
        {
          id: "self_insomnia",
          text: "Đúng vậy, em liên tục suy nghĩ lo âu đến mất ngủ",
          followUp: "Mất ngủ kéo dài làm suy nhược cả thể chất lẫn tinh thần. Tình trạng này có diễn ra liên tiếp trên 3-4 ngày một tuần và khiến em thức dậy trong trạng thái cạn kiệt năng lượng không?",
          severityOptions: [
            { id: "self_insomnia_high", text: "Có, hầu như đêm nào em cũng trằn trọc và thức giấc mệt mỏi", nextAction: "recommend_test", test: "phq9", testLabel: "[PHQ-9] Trắc nghiệm Trầm cảm" },
            { id: "self_insomnia_low", text: "Thỉnh thoảng em mới khó ngủ vào những hôm có nhiều suy nghĩ bận tâm", nextAction: "direct_advice", advice: "Để cải thiện giấc ngủ, em hãy thử tạo thói quen thư giãn trước khi ngủ như nghe nhạc nhẹ trị liệu, tắt điện thoại trước 30 phút và thực hiện bài tập thở 4-7-8.", quote: "“Một đêm ngủ ngon giấc có thể giải quyết được rất nhiều vấn đề tinh thần.” - Đạt Lai Lạt Ma", recommendedDays: 14 }
          ]
        },
        {
          id: "self_exhausted",
          text: "Em cảm thấy cơ thể uể oải, cạn kiệt năng lượng để hoạt động",
          followUp: "Sự kiệt quệ này có đi kèm cảm giác mất đi hoàn toàn động lực hoặc hứng thú đối với các sở thích, công việc hàng ngày của em không?",
          severityOptions: [
            { id: "self_exhausted_high", text: "Có, em cảm thấy mất đi niềm vui và không có động lực làm bất cứ việc gì", nextAction: "recommend_test", test: "phq9", testLabel: "[PHQ-9] Trắc nghiệm Trầm cảm" },
            { id: "self_exhausted_low", text: "Cơ thể chỉ mệt mỏi thể chất, em vẫn giữ được hứng thú giải trí nhẹ nhàng", nextAction: "direct_advice", advice: "Hãy cho phép cơ thể nghỉ ngơi thực sự, bổ sung dinh dưỡng đầy đủ và vận động nhẹ nhàng ngoài trời để giải phóng Endorphin giúp tinh thần phấn chấn hơn.", quote: "“Chăm sóc bản thân không phải là ích kỷ, đó là sự chuẩn bị để có thể sống tốt hơn.” - Eleanor Brownn", recommendedDays: 7 }
          ]
        }
      ]
    },
    {
      id: "normal",
      text: "Hiện tại tinh thần em khá ổn định và thoải mái",
      reply: "Rất tốt khi thấy em đang duy trì được trạng thái cân bằng. Tuy nhiên, đôi khi nhịp sống hằng ngày bận rộn dễ khiến chúng ta bỏ quên việc tự lắng nghe bản thân. Em có muốn cùng tôi thực hiện một bài đánh giá ngắn để đo lường chỉ số hạnh phúc hiện tại không?",
      options: [
        {
          id: "normal_happy",
          text: "Vâng, nhờ Chuyên viên đo thử giúp em",
          followUp: "Em muốn thực hiện bài test để theo dõi sức khỏe tinh thần định kỳ hay chỉ muốn nhận một lời khuyên truyền cảm hứng cho ngày hôm nay?",
          severityOptions: [
            { id: "normal_happy_high", text: "Em muốn đo lường chính xác bằng bài test khoa học WHO-5", nextAction: "recommend_test", test: "who5", testLabel: "[WHO-5] Đo chỉ số Hạnh phúc" },
            { id: "normal_happy_low", text: "Em chỉ cần một lời khuyên chân thành và tích cực thôi", nextAction: "direct_advice", advice: "Sự bình yên trong tâm hồn là món quà vô giá. Hãy tiếp tục trân trọng khoảnh khắc hiện tại và chia sẻ năng lượng tích cực này đến những người xung quanh em nhé.", quote: "“Hạnh phúc không phải là thứ có sẵn. Nó đến từ chính những hành động của bạn.” - Đạt Lai Lạt Ma", recommendedDays: 7 }
          ]
        },
        {
          id: "normal_personality",
          text: "Em muốn làm trắc nghiệm tính cách năm nhân tố (Big Five)",
          followUp: "Trắc nghiệm Big Five là bài test khám phá sâu sắc về các khía cạnh tính cách. Em sẵn lòng dành 5 phút thực hiện bài đánh giá khoa học này chứ?",
          severityOptions: [
            { id: "normal_personality_high", text: "Em sẵn sàng làm bài test Big Five ngay bây giờ", nextAction: "recommend_test", test: "bigfive", testLabel: "[Big Five] Trắc nghiệm Nhân cách" },
            { id: "normal_personality_low", text: "Hiện tại em chưa muốn làm test dài, chỉ muốn trò chuyện nhẹ nhàng thôi", nextAction: "direct_advice", advice: "Hành trình thấu hiểu bản thân là cả một quá trình. Em hãy tự do khám phá khi tinh thần thoải mái nhất, không cần phải vội vã.", quote: "“Biết người là trí, biết mình là sáng.” - Lão Tử", recommendedDays: 7 }
          ]
        }
      ]
    }
  ]
};

export default function ChatTab({ onNavigateToTab, bio, historyLogs, onUpdateCompanionState }) {
  const [completedMessageIds, setCompletedMessageIds] = useState(new Set());
  const [messages, setMessages] = useState([
    {
      id: "init",
      sender: "bot",
      text: "Chào em, tôi là Chuyên viên Đồng Hành của em. Tại đây, mọi chia sẻ của em luôn được lắng nghe trong không gian bảo mật và tuyệt đối không phán xét. Dạo gần đây, việc học tập, sức khỏe hay cuộc sống cá nhân của em thế nào? Em có điều gì bận tâm muốn chia sẻ, hoặc muốn cùng tôi thực hiện các bài đánh giá tâm lý chuẩn lâm sàng không?",
      time: new Date()
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [showTestsMenu, setShowTestsMenu] = useState(false);

  // dialogStage: 1 (aspect concern), 2 (probing question), 3 (severity check), 4 (test recommend), 5 (advice duration setup), 0 (loop options)
  const [dialogStage, setDialogStage] = useState(1);
  const [selectedAspect, setSelectedAspect] = useState(null);
  const [selectedSubOption, setSelectedSubOption] = useState(null);

  // chatMode: 'normal' | 'test' | 'scan'
  const [chatMode, setChatMode] = useState("normal");
  const [activeTest, setActiveTest] = useState(null);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
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

  const triggerDirectCompanionRecommendation = (recommendedDays) => {
    const name = recommendedDays === 7 ? "Hành trình Nuôi dưỡng Bình yên (Peace)" : "Hành trình Chăm sóc Tinh thần (Mindfulness)";
    const proposalMsg = {
      id: `bot-proposal-${Date.now()}`,
      sender: "bot",
      text: `Tôi khuyên em nên kích hoạt ${name} với thời gian ${recommendedDays} ngày để đồng hành chăm sóc sức khỏe tinh thần hàng ngày. Em có muốn kích hoạt lộ trình này ngay bây giờ không?`,
      time: new Date(),
      isCompanionSetup: true,
      recommendedDays: recommendedDays
    };
    setMessages((prev) => [...prev, proposalMsg]);
    setDialogStage(5); // Stage 5: showing companion setup choice inside bubble
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
          text: `Cảm ơn em đã chia sẻ chân thành. Với mức độ ảnh hưởng này, tôi khuyên em nên dành ra vài phút làm bài đánh giá ${sevOpt.testLabel} hoặc Quét kết quả phòng khám lâm sàng để tôi chẩn đoán chính xác nhất.`,
          time: new Date()
        };
        setMessages((prev) => [...prev, botMsg]);
        setLoading(false);
        setDialogStage(4);
      } else {
        const botMsg = {
          id: `bot-${Date.now()}`,
          sender: "bot",
          text: `${sevOpt.advice}\n\n💡 Lời khuyên vàng: ${sevOpt.quote}`,
          time: new Date()
        };
        setMessages((prev) => [...prev, botMsg]);
        setLoading(false);
        setTimeout(() => triggerDirectCompanionRecommendation(sevOpt.recommendedDays), 1000);
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
      const updatedLogs = [...historyLogs, {
        date: new Date().toISOString(),
        type: "duration_change",
        reason: `Kích hoạt lộ trình đồng hành: ${duration} ngày.`
      }];
      
      onUpdateCompanionState({
        healingActive: true,
        healingDuration: duration,
        healingStartDate: new Date().toISOString(),
        historyLogs: updatedLogs
      });

      const userMsg = {
        id: `user-select-${Date.now()}`,
        sender: "user",
        text: `Em đồng ý kích hoạt lộ trình trị liệu ${duration} ngày.`,
        time: new Date()
      };
      const botMsg = {
        id: `bot-confirm-${Date.now()}`,
        sender: "bot",
        text: `Tôi đã thiết lập lộ trình đồng hành ${duration} ngày cho em. Kể từ ngày mai, em hãy duy trì việc check-in cảm xúc hằng ngày tại đây để nhận các bài tập tự chữa lành thích ứng nhé.`,
        time: new Date()
      };
      setMessages((prev) => [...prev, userMsg, botMsg]);
    } else {
      const userMsg = {
        id: `user-select-${Date.now()}`,
        sender: "user",
        text: `Em chưa muốn tham gia lộ trình lúc này.`,
        time: new Date()
      };
      const botMsg = {
        id: `bot-confirm-${Date.now()}`,
        sender: "bot",
        text: `Tôi tôn trọng quyết định của em. Bất cứ khi nào cảm thấy cần người đồng hành hoặc muốn thực hiện kiểm tra tinh thần, em luôn có thể trò chuyện với tôi tại đây. Chúc em luôn bình yên!`,
        time: new Date()
      };
      setMessages((prev) => [...prev, userMsg, botMsg]);
    }
    setDialogStage(0);
  };

  const handleStartTest = (testId) => {
    const test = CLINICAL_TESTS[testId];
    if (!test) return;
    setShowTestsMenu(false);
    setChatMode("test");
    setActiveTest(test);

    const userMsg = {
      id: `user-test-req-${Date.now()}`,
      sender: "user",
      text: `Em muốn bắt đầu làm bài đánh giá ${test.name}.`,
      time: new Date()
    };
    setMessages((prev) => [...prev, userMsg]);
  };

  const triggerCompanionAdjustmentRecommendation = (testType, score) => {
    let days = 14;
    let name = "Hành trình Chăm sóc Tinh thần (Mindfulness)";

    if (testType === "phq9") {
      if (score >= 20) { days = 90; name = "Hành trình Đồng hành Chuyên sâu (Intensive)"; }
      else if (score >= 15) { days = 50; name = "Hành trình Phục hồi Thấu cảm (Compassionate)"; }
      else if (score >= 10) { days = 30; name = "Hành trình Tái tạo Cân bằng (Balance)"; }
      else if (score >= 5) { days = 14; name = "Hành trình Chăm sóc Tinh thần (Mindfulness)"; }
      else { days = 7; name = "Hành trình Nuôi dưỡng Bình yên (Peace)"; }
    } else if (testType === "gad7") {
      if (score >= 15) { days = 50; name = "Hành trình Phục hồi Thấu cảm (Compassionate)"; }
      else if (score >= 10) { days = 30; name = "Hành trình Tái tạo Cân bằng (Balance)"; }
      else if (score >= 5) { days = 14; name = "Hành trình Chăm sóc Tinh thần (Mindfulness)"; }
      else { days = 7; name = "Hành trình Nuôi dưỡng Bình yên (Peace)"; }
    } else if (testType === "who5") {
      if (score <= 8) { days = 50; name = "Hành trình Phục hồi Thấu cảm (Compassionate)"; }
      else if (score <= 12) { days = 30; name = "Hành trình Tái tạo Cân bằng (Balance)"; }
      else if (score <= 17) { days = 14; name = "Hành trình Chăm sóc Tinh thần (Mindfulness)"; }
      else { days = 7; name = "Hành trình Nuôi dưỡng Bình yên (Peace)"; }
    }

    const proposalMsg = {
      id: `bot-proposal-${Date.now()}`,
      sender: "bot",
      text: `Dựa trên kết quả đánh giá ${testType.toUpperCase()} vừa rồi, tôi khuyên em nên kích hoạt ${name} (${days} ngày). Em có muốn kích hoạt ngay bây giờ không?`,
      time: new Date(),
      isCompanionSetup: true,
      recommendedDays: days
    };
    setMessages((prev) => [...prev, proposalMsg]);
  };

  const handleTestComplete = (testId, score, answers) => {
    const test = CLINICAL_TESTS[testId];
    let eventLog = null;
    let reviewText = "";

    if (testId === "phq9") {
      const interpretation = test.getInterpretation(score);
      reviewText = `Cảm ơn em đã hoàn thành. Kết quả đánh giá Trầm cảm PHQ-9 của em là ${score}/27 điểm (${interpretation.severity}).\n\n${interpretation.desc}`;
      eventLog = {
        date: new Date().toISOString(),
        type: "clinical_test",
        test: "phq9",
        score,
        severity: interpretation.severity
      };
      setTimeout(() => triggerCompanionAdjustmentRecommendation("phq9", score), 1000);
    } else if (testId === "gad7") {
      const interpretation = test.getInterpretation(score);
      reviewText = `Tôi đã phân tích xong. Kết quả đánh giá Lo âu GAD-7 của em là ${score}/21 điểm (${interpretation.severity}).\n\n${interpretation.desc}`;
      eventLog = {
        date: new Date().toISOString(),
        type: "clinical_test",
        test: "gad7",
        score,
        severity: interpretation.severity
      };
      setTimeout(() => triggerCompanionAdjustmentRecommendation("gad7", score), 1000);
    } else if (testId === "who5") {
      const interpretation = test.getInterpretation(score);
      reviewText = `Đã có kết quả phân tích. Chỉ số trạng thái hạnh phúc WHO-5 của em đạt ${score}/25 điểm (${interpretation.status}).\n\n${interpretation.desc}`;
      eventLog = {
        date: new Date().toISOString(),
        type: "clinical_test",
        test: "who5",
        score,
        status: interpretation.status,
        percent: score * 4
      };
      setTimeout(() => triggerCompanionAdjustmentRecommendation("who5", score), 1000);
    } else if (testId === "bigfive") {
      const interpretation = test.getInterpretation(answers);
      reviewText = `Biểu đồ năm nhân tố tính cách Big Five của em đã hoàn thành:\n${interpretation.desc}\n\nTôi đã cập nhật các bài tập tự chữa lành thích ứng ở phần Trị Liệu để em rèn luyện hằng ngày nhé.`;
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

    const botReviewMsg = {
      id: `bot-review-${Date.now()}`,
      sender: "bot",
      text: reviewText,
      time: new Date()
    };

    setMessages((prev) => [...prev, botReviewMsg]);
    setChatMode("normal");
    setActiveTest(null);
    setDialogStage(0); // transition to post-assessment companion loop
  };

  const handleScanComplete = (testType, resultLog) => {
    let responseMsgText = "";
    if (testType === "dass") {
      responseMsgText = `Tôi đã ghi nhận kết quả Quét DASS-42 lâm sàng của em vào hồ sơ đồng hành:\n` +
        `• Trầm cảm: ${resultLog.scores.D}/42 điểm (${resultLog.severities.D})\n` +
        `• Lo âu: ${resultLog.scores.A}/42 điểm (${resultLog.severities.A})\n` +
        `• Căng thẳng: ${resultLog.scores.S}/42 điểm (${resultLog.severities.S})\n\n` +
        `Các liệu pháp trị liệu tương ứng ở thẻ Trị Liệu đã được cập nhật mở khóa.`;
    } else {
      const elevatedCount = resultLog.clinical.filter(v => v.score >= 70).length;
      responseMsgText = `Tôi đã ghi nhận kết quả Quét MMPI-30 nhân cách của em vào hồ sơ đồng hành:\n` +
        `• Độ tin cậy kiểm chứng: ${resultLog.isReliable ? "Hợp lệ" : "Nghi ngờ"}\n` +
        `• Chỉ số vượt ngưỡng cảnh báo: ${elevatedCount}/10 thang đo\n\n` +
        `Hồ sơ đã được lưu trữ an toàn bảo mật.`;
    }

    const updatedLogs = [...historyLogs, resultLog];
    onUpdateCompanionState({
      lastTestDate: new Date().toDateString(),
      historyLogs: updatedLogs
    });

    const botMsg = {
      id: `bot-scan-${Date.now()}`,
      sender: "bot",
      text: responseMsgText,
      time: new Date()
    };

    setMessages((prev) => [...prev, botMsg]);
    setChatMode("normal");
    setDialogStage(0); // transition to post-assessment companion loop
  };

  return (
    <div className="flex flex-col h-[560px] justify-between relative bg-zinc-50/20 dark:bg-black/10 animate-fadeIn">
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
      </div>

      {/* Clinical Test Selection Menu Popup */}
      {showTestsMenu && (
        <div className="absolute top-[55px] right-4 w-64 p-4 rounded-2xl border-2 border-zinc-900 dark:border-zinc-800 bg-white dark:bg-[#12111a] shadow-xl z-20 space-y-2 animate-scaleUp">
          <div className="flex justify-between items-center pb-1 border-b border-zinc-150/40">
            <h5 className="text-[9.5px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Bài đánh giá chuẩn lâm sàng</h5>
            <button type="button" onClick={() => setShowTestsMenu(false)} className="text-zinc-400 hover:text-zinc-650 text-[10px] font-bold">Đóng</button>
          </div>
          <div className="flex flex-col gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => handleStartTest("phq9")}
              className="w-full text-left px-3 py-2 bg-red-500/5 hover:bg-red-500/10 text-red-650 rounded-xl text-[10px] font-black uppercase tracking-wider border border-red-500/10"
            >
              [PHQ-9] Đánh giá Trầm cảm
            </button>
            <button
              type="button"
              onClick={() => handleStartTest("gad7")}
              className="w-full text-left px-3 py-2 bg-cyan-500/5 hover:bg-cyan-500/10 text-cyan-650 rounded-xl text-[10px] font-black uppercase tracking-wider border border-cyan-500/10"
            >
              [GAD-7] Đánh giá Lo âu
            </button>
            <button
              type="button"
              onClick={() => handleStartTest("who5")}
              className="w-full text-left px-3 py-2 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-650 rounded-xl text-[10px] font-black uppercase tracking-wider border border-emerald-500/10"
            >
              [WHO-5] Đánh giá Hạnh phúc
            </button>
            <button
              type="button"
              onClick={() => handleStartTest("bigfive")}
              className="w-full text-left px-3 py-2 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-655 rounded-xl text-[10px] font-black uppercase tracking-wider border border-indigo-500/10"
            >
              [Big Five] Trắc nghiệm Nhân cách
            </button>
          </div>
        </div>
      )}

      {/* Main Comic Strip Layout */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 comic-dotted-bg">
        {/* Left Column: Mascot */}
        <div className="hidden md:flex md:w-[35%] flex-col justify-end items-center relative select-none pb-2 border-r border-zinc-200/50 dark:border-zinc-800/20">
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
          {chatMode === "normal" && !loading && (
            <>
              {dialogStage === 1 && (
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-200/50 dark:border-zinc-800/10 shrink-0">
                  {DIALOGUE_TREE.aspects.map(aspect => (
                    <button
                      key={aspect.id}
                      type="button"
                      onClick={() => handleAspectSelect(aspect)}
                      className="py-2.5 px-3 rounded-xl border-2 border-zinc-900 dark:border-zinc-855 bg-white dark:bg-zinc-900 text-[9.5px] font-black uppercase text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-[1px_1px_0px_0px_rgba(9,9,11,1)] text-left flex items-center justify-between"
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
                      className="py-2.5 px-3 rounded-xl border-2 border-zinc-900 dark:border-zinc-850 bg-white dark:bg-zinc-900 text-[9.5px] font-black uppercase text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-[1px_1px_0px_0px_rgba(9,9,11,1)] text-left flex items-center justify-between"
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
                        text: "Tôi luôn lắng nghe em, có vấn đề nào khác khiến em bận tâm không?",
                        time: new Date()
                      };
                      setMessages(prev => [...prev, botMsg]);
                    }}
                    className="py-2.5 px-3 rounded-xl border-2 border-zinc-900 dark:border-zinc-850 bg-zinc-100 dark:bg-zinc-900 text-[9.5px] font-black uppercase text-zinc-550 hover:bg-zinc-50 shadow-[1px_1px_0px_0px_rgba(9,9,11,1)] text-center"
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
                      className="py-2.5 px-3 rounded-xl border-2 border-zinc-900 dark:border-zinc-850 bg-white dark:bg-zinc-900 text-[9.5px] font-black uppercase text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-[1px_1px_0px_0px_rgba(9,9,11,1)] text-left flex items-center justify-between"
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
                    className="py-2.5 px-3 rounded-xl border-2 border-zinc-900 dark:border-zinc-850 bg-zinc-100 dark:bg-zinc-900 text-[9.5px] font-black uppercase text-zinc-550 hover:bg-zinc-50 shadow-[1px_1px_0px_0px_rgba(9,9,11,1)] text-center"
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
                    className="py-2.5 px-3 rounded-xl border-2 border-zinc-900 dark:border-zinc-850 bg-[#0071e3] text-white text-[9.5px] font-black uppercase hover:bg-[#0077ed] shadow-[1px_1px_0px_0px_rgba(9,9,11,1)] text-left flex items-center justify-between"
                  >
                    <span>Làm bài test đánh giá</span>
                    <span className="material-symbols-outlined text-[11px]">play_arrow</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setChatMode("scan")}
                    className="py-2.5 px-3 rounded-xl border-2 border-zinc-900 dark:border-zinc-850 bg-white dark:bg-zinc-900 text-[9.5px] font-black uppercase text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-[1px_1px_0px_0px_rgba(9,9,11,1)] text-left flex items-center justify-between"
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
                        text: "Tôi hiểu rồi. Em muốn chia sẻ về khía cạnh nào khác? Hãy cứ bày tỏ suy nghĩ của em nhé.",
                        time: new Date()
                      };
                      setMessages(prev => [...prev, botMsg]);
                    }}
                    className="py-2.5 px-3 rounded-xl border-2 border-zinc-900 dark:border-zinc-855 bg-zinc-150 dark:bg-zinc-900 hover:bg-zinc-250 dark:hover:bg-zinc-800 text-[9.5px] font-black uppercase text-zinc-600 dark:text-zinc-300 shadow-[1px_1px_0px_0px_rgba(9,9,11,1)] text-center col-span-2"
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
                        text: "Tôi luôn sẵn lòng lắng nghe. Dạo gần đây em bận tâm chuyện gì nhất? Hãy chọn chia sẻ dưới đây nhé.",
                        time: new Date()
                      };
                      setMessages(prev => [...prev, botMsg]);
                    }}
                    className="py-2.5 px-3 rounded-xl border-2 border-zinc-900 dark:border-zinc-850 bg-zinc-100 dark:bg-zinc-900 text-[9.5px] font-black uppercase text-zinc-550 hover:bg-zinc-50 shadow-[1px_1px_0px_0px_rgba(9,9,11,1)] text-center"
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
                        text: "Tôi luôn sẵn lòng đồng hành cùng em. Gần đây điều gì khiến em suy nghĩ nhiều nhất? Em có thể chọn chia sẻ dưới đây.",
                        time: new Date()
                      };
                      setMessages(prev => [...prev, botMsg]);
                    }}
                    className="py-2.5 px-3 rounded-xl border-2 border-zinc-900 dark:border-zinc-850 bg-white dark:bg-zinc-900 text-[9.5px] font-black uppercase text-zinc-805 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-[1px_1px_0px_0px_rgba(9,9,11,1)] text-left flex items-center justify-between"
                  >
                    <span>[Trò chuyện] Chia sẻ thêm khía cạnh khác</span>
                    <span className="material-symbols-outlined text-[11px]">chat</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTestsMenu(true)}
                    className="py-2.5 px-3 rounded-xl border-2 border-zinc-900 dark:border-zinc-850 bg-white dark:bg-zinc-900 text-[9.5px] font-black uppercase text-zinc-805 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-[1px_1px_0px_0px_rgba(9,9,11,1)] text-left flex items-center justify-between"
                  >
                    <span>[Đánh giá] Thực hiện bài test</span>
                    <span className="material-symbols-outlined text-[11px]">arrow_forward</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setChatMode("scan")}
                    className="py-2.5 px-3 rounded-xl border-2 border-zinc-900 dark:border-zinc-850 bg-white dark:bg-zinc-900 text-[9.5px] font-black uppercase text-zinc-805 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-[1px_1px_0px_0px_rgba(9,9,11,1)] text-left flex items-center justify-between"
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
