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

export default function ChatTab({ onNavigateToTab, bio, historyLogs, onUpdateCompanionState, chatMessages }) {
  const [completedMessageIds, setCompletedMessageIds] = useState(new Set());
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showTestsMenu, setShowTestsMenu] = useState(false);

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

      // Fallback: If no history exists, set the initial bot greeting
      const initMsg = {
        id: "init",
        sender: "bot",
        text: "Chào em, tôi là Chuyên viên Đồng Hành của em. Tại đây, mọi chia sẻ của em luôn được lắng nghe trong không gian bảo mật và tuyệt đối không phán xét. Dạo gần đây, việc học tập, sức khỏe hay cuộc sống cá nhân của em thế nào? Em có điều gì bận tâm muốn chia sẻ, hoặc muốn cùng tôi thực hiện các bài đánh giá tâm lý chuẩn lâm sàng không?",
        time: new Date()
      };
      setMessages([initMsg]);
      setCompletedMessageIds(new Set(["init"]));
      lastSavedMessageIdRef.current = "init";
    }
  }, [bio?.email]);

  // Auto-save new chat messages to MongoDB and sync to localStorage synchronously to prevent tab unmount data loss
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("banhocduong_chat_messages", JSON.stringify(messages));
      
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.id !== lastSavedMessageIdRef.current) {
        lastSavedMessageIdRef.current = lastMsg.id;
        const sliced = messages.slice(-30);
        onUpdateCompanionState({ chatMessages: sliced });
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
          text: `Cảm ơn em đã chia sẻ chân thành. Với mức độ ảnh hưởng này, tôi khuyên em nên dành ra vài phút làm bài đánh giá ${sevOpt.testLabel} hoặc Quét kết quả phòng khám lâm sàng để tôi chẩn đoán chính xác nhất.`,
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
          text: `Để hỗ trợ tốt nhất cho tình trạng hiện tại của em, tôi khuyên em nên kích hoạt **${name}** với thời gian **${sevOpt.recommendedDays} ngày** để tôi đồng hành chăm sóc sức khỏe tinh thần hàng ngày. Em có muốn kích hoạt lộ trình này ngay bây giờ không?`,
          time: new Date(Date.now() + 10),
          isCompanionSetup: true,
          recommendedDays: sevOpt.recommendedDays
        };

        setMessages((prev) => [...prev, botMsg, proposalMsg]);
        setLoading(false);
        setDialogStage(5);
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
        text: `Em đồng ý kích hoạt lộ trình trị liệu ${duration} ngày.`,
        time: new Date()
      };
      const botMsg = {
        id: `bot-confirm-${Date.now()}`,
        sender: "bot",
        text: `Tôi đã thiết lập lộ trình đồng hành ${duration} ngày cho em. Kể từ ngày mai, em hãy duy trì việc check-in cảm xúc hằng ngày tại đây để nhận các bài tập tự chữa lành thích ứng nhé.`,
        time: new Date(),
        showTherapyButton: true
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
      id: `user-test-${Date.now()}`,
      sender: "user",
      text: `Tôi muốn thực hiện bài test ${test.name}`,
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
      reviewText = `Tôi đã hoàn thành phân tích. Kết quả đánh giá Trầm cảm PHQ-9 của em đạt ${score}/27 điểm (${interpretation.severity}).\n\n${interpretation.desc}`;
      
      const updatedLogs = [...historyLogs, {
        date: new Date().toISOString(),
        test: "phq9",
        score,
        severity: interpretation.severity
      }];
      onUpdateCompanionState({
        lastTestDate: new Date().toDateString(),
        historyLogs: updatedLogs
      });
    } else if (testId === "gad7") {
      const interpretation = CLINICAL_TESTS.gad7.getInterpretation(score);
      reviewText = `Tôi đã phân tích xong. Kết quả đánh giá Lo âu GAD-7 của em là ${score}/21 điểm (${interpretation.severity}).\n\n${interpretation.desc}`;
      
      const updatedLogs = [...historyLogs, {
        date: new Date().toISOString(),
        test: "gad7",
        score,
        severity: interpretation.severity
      }];
      onUpdateCompanionState({
        lastTestDate: new Date().toDateString(),
        historyLogs: updatedLogs
      });
    } else if (testId === "who5") {
      const interpretation = CLINICAL_TESTS.who5.getInterpretation(score);
      reviewText = `Đã có kết quả phân tích. Chỉ số trạng thái hạnh phúc WHO-5 của em đạt ${score}/25 điểm (${interpretation.status}).\n\n${interpretation.desc}`;
      
      const updatedLogs = [...historyLogs, {
        date: new Date().toISOString(),
        type: "clinical_test",
        test: "who5",
        score,
        status: interpretation.status,
        percent: score * 4
      }];
      onUpdateCompanionState({
        lastTestDate: new Date().toDateString(),
        historyLogs: updatedLogs
      });
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

      const proposalMsg = {
        id: `bot-proposal-${Date.now() + 10}`,
        sender: "bot",
        text: `Dựa trên kết quả đánh giá ${testId.toUpperCase()} vừa rồi, tôi khuyên em nên kích hoạt **${name}** với thời gian **${days} ngày** để tôi đồng hành chăm sóc sức khỏe tinh thần hàng ngày. Em có muốn kích hoạt lộ trình này ngay bây giờ không?`,
        time: new Date(Date.now() + 10),
        isCompanionSetup: true,
        recommendedDays: days
      };
      newMsgs.push(proposalMsg);
      setDialogStage(5);
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

      responseMsgText = `Tôi đã phân tích kết quả DASS-42 lâm sàng trích xuất từ hồ sơ phòng khám của em:\n\n` +
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

      responseMsgText = `Tôi đã hoàn tất trích xuất và phân tích 13 chỉ số nhân cách Mini-MMPI từ bệnh án phòng khám:\n\n` +
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

    const proposalMsg = {
      id: `bot-proposal-${Date.now() + 10}`,
      sender: "bot",
      text: `Dựa trên kết quả Quét hồ sơ lâm sàng của em, tôi khuyên em nên kích hoạt **${pkgName}** với thời gian **${recommendedDays} ngày** để tôi đồng hành chăm sóc sức khỏe tinh thần hàng ngày. Em có muốn kích hoạt lộ trình này ngay bây giờ không?`,
      time: new Date(Date.now() + 10),
      isCompanionSetup: true,
      recommendedDays: recommendedDays
    };

    setMessages((prev) => [...prev, botMsg, proposalMsg]);
    setChatMode("normal");
    setDialogStage(5); // Show companion setup choice inside bubble
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
