class PsychologyService {
  constructor() {
    // Keywords matching dictionary for 5 aspects of student life
    this.aspects = {
      studying: ["học", "thi", "deadline", "đồ án", "môn học", "trường", "lớp", "giảng đường", "bài tập", "kiểm tra", "trượt"],
      work: ["làm thêm", "công việc", "sếp", "đồng nghiệp", "parttime", "kiếm tiền", "đồng lương", "đi làm"],
      family: ["bố", "mẹ", "gia đình", "nhà", "phụ huynh", "cha mẹ", "anh chị", "em"],
      relationships: ["người yêu", "bạn bè", "crush", "chia tay", "cãi nhau", "giận", "đơn phương", "người ấy"],
      self: ["bản thân", "mệt", "kiệt sức", "khóc", "stress", "căng thẳng", "buồn", "nản", "chán", "mất ngủ", "sức khỏe", "cô đơn", "trống trải", "bất lực", "sụp đổ"]
    };

    // Distress indicators that recommend DASS-21 (Depression, Anxiety, Stress)
    this.dassIndicators = [
      "mệt mỏi", "kiệt sức", "áp lực", "stress", "căng thẳng", "chán nản", "buồn", "khóc", 
      "mất ngủ", "trống rỗng", "bất lực", "sụp đổ", "ngột ngạt", "quá tải", "muốn buông xuôi"
    ];

    // Extreme symptoms or personality variance indicators that recommend MMPI-2
    this.mmpiIndicators = [
      "hoang tưởng", "theo dõi", "âm thanh lạ", "ảo giác", "xa lánh", "không muốn gặp ai", 
      "đau ngực không rõ", "tim đập nhanh vô cớ", "chống đối", "bứt rứt cực độ", "mất kiểm soát"
    ];

    this.phq9Indicators = [
      "trầm cảm", "buồn chán", "khóc", "tuyệt vọng", "chết", "buông xuôi", 
      "không muốn sống", "trống rỗng", "tự trách", "kém cỏi", "buồn tủi"
    ];

    this.gad7Indicators = [
      "lo âu", "bồn chồn", "lo lắng", "sợ hãi", "hoảng loạn", "hồi hộp", 
      "lo nghĩ", "căng thẳng", "áp lực", "stress", "hoảng sợ"
    ];

    this.who5Indicators = [
      "mệt mỏi", "kiệt sức", "mất ngủ", "u uất", "nhạt nhẽo", "chán nản", 
      "không có hứng thú", "hạnh phúc", "vui vẻ", "sức sống"
    ];

    this.bigFiveIndicators = [
      "tính cách", "nhân cách", "đặc điểm", "hướng nội", "hướng ngoại", 
      "cởi mở", "tôi thế nào", "bản thân tớ"
    ];
  }

  /**
   * Helper to detect the conversational aspect from user message and history logs.
   * Filters out assistant/bot responses to avoid matching bot question keywords.
   */
  detectAspect(message, history = []) {
    // Extract only user messages to prevent locking on keywords in bot's own questions
    const userMsgs = history
      .filter(h => h.sender === "user" || h.role === "user")
      .map(h => h.text || h.content || "");
    
    const currentMsg = message.toLowerCase();
    
    // Check for aspect negations in current message (e.g. "không phải chuyện học")
    const negations = ["không phải", "không liên quan", "chả liên quan", "ko phải", "k phải", "chẳng phải", "không có chuyện"];
    const rejectedAspects = [];
    
    for (const [aspect, keywords] of Object.entries(this.aspects)) {
      keywords.forEach(keyword => {
        negations.forEach(neg => {
          if (currentMsg.includes(`${neg} ${keyword}`) || currentMsg.includes(`${keyword} ${neg}`)) {
            if (!rejectedAspects.includes(aspect)) {
              rejectedAspects.push(aspect);
            }
          }
        });
      });
    }

    // Now calculate matches for valid (non-rejected) aspects
    let matchedAspect = null;
    let maxMatches = 0;
    
    for (const [aspect, keywords] of Object.entries(this.aspects)) {
      if (rejectedAspects.includes(aspect)) continue;

      let score = 0;
      keywords.forEach(keyword => {
        // High weight for matching current user input
        if (currentMsg.includes(keyword)) {
          score += 3;
        }
        // Low weight for matching historical user inputs
        userMsgs.forEach(um => {
          if (um.toLowerCase().includes(keyword)) {
            score += 1;
          }
        });
      });

      if (score > maxMatches) {
        maxMatches = score;
        matchedAspect = aspect;
      }
    }

    return { matchedAspect, rejectedAspects };
  }

  /**
   * Generates warm, context-aware, stateful replies based on conversation depth.
   */
  getReplyForDepth(message, history, aspectInfo, depth) {
    const cleanMsg = message.toLowerCase().trim();
    const { matchedAspect, rejectedAspects } = aspectInfo;

    // 1. Explicit test requests
    const isTestRequest = ["test", "trắc nghiệm", "kiểm tra tâm lý", "khảo sát", "dass", "mmpi"].some(w => cleanMsg.includes(w));
    const isTestNegation = ["không", "ko", "k", "chưa", "đâu"].some(neg => {
      return cleanMsg.includes(`${neg} muốn`) || cleanMsg.includes(`${neg} làm`) || cleanMsg.includes(`${neg} test`) || cleanMsg.includes(`${neg} trắc nghiệm`);
    });

    if (isTestRequest && !isTestNegation) {
      return "Tớ có sẵn hai bài kiểm tra chuẩn khoa học tâm lý học đường cho cậu đây: DASS-21 (đo chỉ số Trầm cảm, Lo âu, Căng thẳng) và MMPI-30 (phân tích đa chiều tính cách & hành vi lâm sàng). Cậu muốn làm bài trắc nghiệm nào dưới đây?";
    }

    // 2. Standard greetings
    const greetings = ["chào", "hello", "hi", "bạn ơi", "trợ lý", "xin chào"];
    if (greetings.some(g => cleanMsg.startsWith(g)) && depth <= 1) {
      return "Chào cậu thương mến! Tớ luôn ở đây để lắng nghe và san sẻ lo toan cùng cậu. Dạo gần đây cuộc sống hoặc học tập của cậu có điều gì làm cậu mệt mỏi hay bận lòng không? Kể tớ nghe nhé.";
    }

    // 3. Smart Category Scoring based on keyword density
    const categories = [
      {
        id: "depression_severe",
        keywords: ["muốn chết", "tự tử", "tự hại", "biến mất", "tuyệt vọng", "chết đi", "kết thúc cuộc sống", "rạch tay", "buông xuôi", "không muốn sống"],
        reply: "Tớ ôm cậu thật chặt nhé... Nghe cậu nói thế tớ lo lắm. Khi nỗi đau quá lớn khiến cậu có suy nghĩ muốn giải thoát hay buông xuôi, xin cậu hãy nhớ rằng cậu không phải đối mặt với nó một mình. Hãy chia sẻ với tớ, hoặc kết nối ngay với chuyên viên đồng hành để tụi mình cùng vượt qua nhé. Cậu rất quan trọng."
      },
      {
        id: "family_pressure",
        keywords: ["bố", "mẹ", "ba", "má", "phụ huynh", "gia đình", "cha mẹ", "so sánh", "áp đặt", "kỳ vọng", "bố mẹ", "ba mẹ", "ở nhà"],
        reply: "Tớ hiểu mà... Cảm giác luôn bị so sánh với 'con nhà người ta' hay gánh trên vai kỳ vọng quá lớn của bố mẹ thực sự rất mệt mỏi và tổn thương. Bố mẹ thương mình nhưng đôi khi cách thể hiện lại áp đặt và vô tình làm mình đau. Cậu có muốn tâm sự thêm về chuyện này không?"
      },
      {
        id: "academic_stress",
        keywords: ["học", "thi", "deadline", "đồ án", "môn học", "trường", "lớp", "giảng đường", "bài tập", "kiểm tra", "trượt môn", "điểm thấp", "học hành"],
        reply: "Áp lực thi cử, bài tập chất đống hay deadline dồn dập thực sự rất ngột ngạt. Cậu đang cố gắng rất nhiều rồi, đừng tự trách bản thân nếu mọi thứ chưa hoàn hảo nhé. Có bài tập hay môn học nào đang làm cậu lo lắng nhất lúc này không?"
      },
      {
        id: "work_stress",
        keywords: ["làm thêm", "công việc", "sếp", "đồng nghiệp", "parttime", "kiếm tiền", "đi làm", "lương"],
        reply: "Vừa đi học vừa xoay xở đi làm thêm quả thực rất vất vả và dễ kiệt sức. Áp lực từ sếp, đồng nghiệp hay nỗi lo cơm áo gạo tiền ở tuổi sinh viên không hề dễ dàng chút nào. Cậu nhớ giữ gìn sức khỏe nhé, có chuyện gì ở chỗ làm làm cậu bực dọc không?"
      },
      {
        id: "relationship_stress",
        keywords: ["chia tay", "cãi nhau", "giận", "người yêu", "crush", "bạn trai", "bạn gái", "phản bội", "đơn phương", "cắm sừng"],
        reply: "Những rạn nứt trong tình cảm luôn khiến trái tim mình đau nhói và đầu óc rối bời. Cảm giác nhớ nhung, giận hờn hay hụt hẫng sau cãi vã thực sự rất khó chịu đựng. Cậu và người ấy đang gặp chuyện gì thế, kể tớ nghe cho nhẹ lòng nhé."
      },
      {
        id: "friendship_stress",
        keywords: ["bạn bè", "chơi xấu", "tẩy chay", "cô lập", "bị bỏ rơi", "xa lánh", "lạc lõng", "không ai chơi"],
        reply: "Cảm giác bị bạn bè xa lánh, cô lập hoặc lạc lõng giữa đám đông thực sự rất đáng sợ và tổn thương. Ai cũng cần những người bạn thực sự thấu hiểu mình. Cậu đang gặp chuyện không vui với nhóm bạn ở lớp hay sao?"
      },
      {
        id: "anxiety",
        keywords: ["lo âu", "bồn chồn", "lo lắng", "sợ hãi", "hoảng loạn", "hồi hộp", "tim đập nhanh", "khó thở", "run", "lo nghĩ"],
        reply: "Tớ nghe đây... Cảm giác bồn chồn lo âu, tim đập nhanh hay bứt rứt vô cớ thực sự rất ngột ngạt. Hãy cùng tớ hít thở sâu một nhịp nhé. Cậu có muốn làm thử bài đánh giá lo âu GAD-7 để tụi mình xem mức độ thế nào không?"
      },
      {
        id: "sleep_issues",
        keywords: ["mất ngủ", "không ngủ được", "khó ngủ", "trằn trọc", "thức đêm", "ác mộng", "ngủ"],
        reply: "Mất ngủ trằn trọc cả đêm thực sự làm cơ thể và trí óc cậu kiệt quệ lắm. Khi giấc ngủ không trọn vẹn, tinh thần mình cũng dễ nhạy cảm hơn. Cậu có muốn thử bài tập thở 4-7-8 hoặc nghe nhạc thiền tĩnh tâm để dễ ngủ hơn không?"
      },
      {
        id: "depression_general",
        keywords: ["buồn", "chán", "nản", "mệt", "kiệt sức", "khóc", "trống rỗng", "bất lực", "suy sụp", "oải", "mệt mỏi", "trầm cảm"],
        reply: "Thương cậu nhiều... Những lúc cạn kiệt năng lượng và kiệt sức như thế này, ngay cả việc thở thôi cũng thấy mệt mỏi đúng không cậu. Cậu đã vất Hình vả gồng gánh nhiều rồi, giờ hãy cho phép bản thân được nghỉ ngơi một chút nhé. Tớ luôn ở bên cậu và sẵn sàng lắng nghe mọi chuyện."
      },
      {
        id: "cognitive_distortion",
        keywords: ["luôn luôn", "không bao giờ", "tất cả", "chẳng ai", "vô dụng", "kẻ thất bại", "tồi tệ nhất"],
        reply: "Tớ nhận thấy dường như cậu đang có những suy nghĩ mang tính 'khái quát hóa quá mức' - một dạng bẫy tâm lý phổ biến. Những từ như 'không bao giờ' hay 'vô dụng' thường làm phóng đại tổn thương và khiến mình đau lòng hơn. Thử chậm lại một chút cùng tớ, hít thở sâu, và tìm thử một điều nhỏ nhoi chứng minh điều ngược lại xem sao cậu nhé?"
      }
    ];

    // Score categories
    let bestCategory = null;
    let highestScore = 0;

    categories.forEach(cat => {
      let score = 0;
      cat.keywords.forEach(keyword => {
        if (cleanMsg.includes(keyword)) {
          score += 1;
        }
      });
      if (score > highestScore) {
        highestScore = score;
        bestCategory = cat;
      }
    });

    // If we have a clear match, return its reply
    if (highestScore > 0 && bestCategory) {
      return bestCategory.reply;
    }

    // 4. Fallback to conversation history context if input is short/agreement/negation
    const lastBotMsg = history.length > 0 ? [...history].reverse().find(h => h.sender === "bot")?.text || "" : "";
    const lastBotMsgLower = lastBotMsg.toLowerCase();

    const isAgreement = ["đúng", "ừ", "ừm", "um", "uh", "uhm", "vâng", "dạ", "chuẩn", "đúng vậy", "chính xác", "mệt chứ", "đúng rồi", "rồi", "có", "ok", "oke"].some(w => cleanMsg === w || cleanMsg.startsWith(w + " "));
    const isNegation = ["không", "chưa", "ko", "k", "chẳng", "đâu có", "không có", "đâu"].some(w => cleanMsg === w || cleanMsg.startsWith(w + " "));

    if (cleanMsg.length < 8) {
      if (isAgreement) {
        if (lastBotMsgLower.includes("bố mẹ thương mình") || lastBotMsgLower.includes("so sánh")) {
          return "Tớ hiểu cảm giác đó, bất hòa với gia đình khó chịu và cô đơn lắm. Bố mẹ không chịu lắng nghe làm cậu buồn lòng nhiều đúng không?";
        }
        if (lastBotMsgLower.includes("bài tập") || lastBotMsgLower.includes("thi cử") || lastBotMsgLower.includes("deadline")) {
          return "Ừm... Việc học hành thi cử áp lực dồn dập mệt mỏi thật cậu nhỉ. Cứ trút lòng ra nhé, chuyện bài vở dạo này cụ thể thế nào?";
        }
        if (lastBotMsgLower.includes("kiệt sức") || lastBotMsgLower.includes("mệt mỏi")) {
          return "Tớ nghe đây... Cậu cứ từ từ chia sẻ nhé, có chuyện gì đã và đang đè nặng lên suy nghĩ của cậu nhất vậy?";
        }
        if (lastBotMsgLower.includes("ngủ")) {
          return "Thương cậu quá. Mất ngủ hay đảo lộn sinh hoạt sẽ càng làm tinh thần cậu mệt mỏi hơn đấy. Tình trạng này kéo dài lâu chưa cậu?";
        }
        if (lastBotMsgLower.includes("mối quan hệ") || lastBotMsgLower.includes("giận hờn")) {
          return "Ừm, những giận hờn hay tổn thương từ mối quan hệ luôn khiến mình suy sụp ghê gớm. Cậu và người ấy đang có chuyện gì xảy ra vậy?";
        }
      }
      if (isNegation) {
        return "Tớ hiểu rồi. Nếu cậu chưa sẵn sàng nói sâu hơn thì không sao cả nhé. Tụi mình cứ nói chuyện nhẹ nhàng thôi, hoặc cậu muốn tớ im lặng để cậu tĩnh tâm chút không?";
      }
    }

    // 5. Depth/Aspect Fallbacks if no categories match
    if (depth <= 1) {
      switch (matchedAspect) {
        case "studying":
          return "Tớ nghe đây cậu ơi. Chuyện học tập, bài vở dạo này đang làm cậu thấy quá tải lắm đúng không? Cậu đang gặp khó khăn với kỳ thi hay deadline nào à, kể tớ nghe nhé.";
        case "work":
          return "Vừa đi học vừa làm thêm thực sự vất vả ghê á. Công việc dạo này bận rộn hay có chuyện gì xảy ra khiến cậu mệt mỏi vậy cậu?";
        case "family":
          return "Bất đồng hay áp lực từ gia đình lúc nào cũng khiến mình tổn thương sâu sắc nhất. Ở nhà đang có chuyện gì làm cậu buồn lòng thế?";
        case "relationships":
          return "Xung đột trong tình cảm hoặc bạn bè làm lòng mình nhói đau ghê gớm. Cậu và bạn bè hay người yêu đang có chuyện không vui à?";
        case "self":
          return "Nghe cậu nói vậy, tớ cảm nhận được một nỗi buồn và sự kiệt sức rất lớn ở cậu. Cậu có muốn kể cho tớ nghe điều gì đang diễn ra không? Cứ thong thả nhé.";
        default:
          return "Tớ luôn sẵn sàng lắng nghe đây. Dạo gần đây cậu đang gặp chuyện gì làm cậu bận lòng nhất? Hãy cứ chia sẻ tự nhiên nhé.";
      }
    }

    if (depth === 2) {
      switch (matchedAspect) {
        case "studying":
          return "Hóa ra là vậy... Đi học mà phải gánh những áp lực bài vở dồn dập như thế thực sự kiệt sức. Áp lực học hành này có ảnh hưởng nhiều đến giấc ngủ hay sinh hoạt hàng ngày của cậu chưa?";
        case "work":
          return "Tớ hiểu rồi, công việc mệt mỏi mà còn phải cân bằng học hành nữa thì quá tải thật sự. Cậu có cảm thấy sức khỏe thể chất của mình dạo này bị đi xuống không?";
        case "family":
          return "Nghe cậu chia sẻ mà tớ thấy nhói lòng. Kỳ vọng hay mâu thuẫn từ bố mẹ quả thực rất ngột ngạt. Trước đây cậu đã từng thử nói ra nỗi lòng này với gia đình chưa?";
        case "relationships":
          return "Tình cảm rạn nứt hay bạn bè xa cách dễ làm mình thấy trống trải và cô độc lắm. Cậu có ai bên cạnh làm chỗ dựa hay đang phải chịu đựng chuyện này một mình?";
        case "self":
          return "Tớ biết giữ những cảm xúc ngổn ngang này một mình mệt mỏi vô cùng. Cho tớ hỏi nhé, cậu có thường xuyên bị mất ngủ hay cảm thấy bứt rứt, lo lắng vô cớ trong người dạo gần đây không?";
        default:
          return "Cảm ơn cậu đã tin tưởng kể cho tớ nghe nhé. Giữ những lo toan này một mình chắc chắn là không dễ dàng gì. Cậu có thường xuyên cảm thấy ngột ngạt như vậy không?";
      }
    }

    if (depth === 3) {
      return "Tớ hiểu cảm giác của cậu rồi. Đối mặt với những điều đó thực sự cần rất nhiều dũng khí. Những lúc cảm thấy quá tải hay buồn bã như thế này, cậu thường làm gì để giải tỏa lòng mình?";
    }

    // Phase 4: Proposing tests/remedies only at Depth >= 4
    const hasDassKeywords = this.dassIndicators.some(ind => cleanMsg.includes(ind));
    const hasMmpiKeywords = this.mmpiIndicators.some(ind => cleanMsg.includes(ind));

    if (hasDassKeywords || hasMmpiKeywords) {
      if (hasMmpiKeywords) {
        return "Tớ thấy những chia sẻ của cậu dạo gần đây có những biểu hiện nhạy cảm tâm lý khá sâu sắc. Để hiểu rõ hơn bản thân và nhận được những khuyến nghị chuẩn y khoa nhất, cậu có thể cùng tớ làm bài trắc nghiệm Đặc điểm Nhân cách Big Five hoặc các đánh giá lâm sàng như PHQ-9, GAD-7 ngay tại đây nhé.";
      }
      return "Nãy giờ trò chuyện, tớ nhận thấy cậu đang chịu đựng khá nhiều căng thẳng tích tụ. Cậu nghĩ sao về việc cùng tớ thực hiện bài kiểm tra lo âu GAD-7 hoặc trầm cảm PHQ-9 để tớ đưa ra chỉ định chính xác nhất?";
    }

    if (matchedAspect === "self" || matchedAspect === "studying") {
      return "Lòng cậu lúc này chắc hẳn vẫn còn nhiều ngổn ngang. Cậu có muốn cùng tớ bắt đầu các bài tập trị liệu ở thẻ 'Trị Liệu' bên cạnh, hoặc làm một bài đánh giá chỉ số Hạnh phúc WHO-5 không?";
    }
    
    // Rich adaptive fallbacks
    const adaptiveFallbacks = [
      "Tớ vẫn ở đây lắng nghe cậu nè. Cậu cứ chia sẻ nhé, tớ ở đây để làm bạn với cậu mà.",
      "Ừm, tớ đang nghe đây. Theo góc nhìn tâm lý học, việc nói ra được những băn khoăn là bước đầu tiên của tự chữa lành rồi đó. Cậu cứ kể cho tớ nghe nhé.",
      "Tớ thấu cảm cảm giác ngổn ngang hiện tại của cậu. Đừng cố ép bản thân phải ổn ngay lập tức. Cậu cứ cho phép mình buồn một chút cũng không sao nha.",
      "Cậu đã nỗ lực chịu đựng mọi áp lực một mình nhiều rồi. Ở đây hoàn toàn bảo mật, cậu cứ trút lòng ra cho nhẹ nhõm nha.",
      "Tớ luôn ở bên làm chỗ dựa tinh thần cho cậu. Cậu không cô đơn đâu."
    ];
    return adaptiveFallbacks[history.length % adaptiveFallbacks.length];
  }

  /**
   * Generates an empathetic reply client-side using keyword matching and conversational guides.
   * Runs 100% locally client-side to ensure zero API costs and infinite concurrency.
   */
  async sendChatMessage(message, history = []) {
    await new Promise((resolve) => setTimeout(resolve, 400));

    const lowerMsg = message.toLowerCase().trim();
    const userMsgs = history.filter(h => h.sender === "user" || h.role === "user");
    const depth = userMsgs.length;

    const isTestRequest = ["test", "trắc nghiệm", "kiểm tra tâm lý", "khảo sát", "phq", "gad", "who", "big five", "bigfive", "nhân cách"].some(w => lowerMsg.includes(w));
    const isTestNegation = ["không", "ko", "k", "chưa", "đâu"].some(neg => {
      return lowerMsg.includes(`${neg} muốn`) || lowerMsg.includes(`${neg} làm`) || lowerMsg.includes(`${neg} test`) || lowerMsg.includes(`${neg} trắc nghiệm`);
    });

    const isExplicitRequest = lowerMsg.includes("đánh giá") || lowerMsg.includes("kết quả") || lowerMsg.includes("nhận xét") || lowerMsg.includes("điểm số") || lowerMsg.includes("tâm lý của tôi") || lowerMsg.includes("trắc nghiệm") || (isTestRequest && !isTestNegation);

    const aspectInfo = this.detectAspect(message, history);
    const reply = this.getReplyForDepth(message, history, aspectInfo, depth);

    let suggestPhq9 = false;
    let suggestGad7 = false;
    let suggestWho5 = false;
    let suggestBigFive = false;
    
    if (depth >= 3 || isExplicitRequest) {
      suggestPhq9 = this.phq9Indicators.some(ind => lowerMsg.includes(ind));
      suggestGad7 = this.gad7Indicators.some(ind => lowerMsg.includes(ind));
      suggestWho5 = this.who5Indicators.some(ind => lowerMsg.includes(ind));
      suggestBigFive = this.bigFiveIndicators.some(ind => lowerMsg.includes(ind));
      
      if (isExplicitRequest) {
        if (lowerMsg.includes("trầm cảm") || lowerMsg.includes("phq")) suggestPhq9 = true;
        else if (lowerMsg.includes("lo âu") || lowerMsg.includes("gad")) suggestGad7 = true;
        else if (lowerMsg.includes("hạnh phúc") || lowerMsg.includes("who")) suggestWho5 = true;
        else if (lowerMsg.includes("nhân cách") || lowerMsg.includes("big")) suggestBigFive = true;
        else {
          suggestPhq9 = true;
          suggestGad7 = true;
        }
      }
    }

    return {
      reply,
      suggestPhq9,
      suggestGad7,
      suggestWho5,
      suggestBigFive
    };
  }

  /**
   * Evaluates emotional improvement based on history logs and adaptively decreases journey duration.
   * Compares the latest test scores with previous scores of the same type.
   */
  evaluateProgressAndAdaptDuration() {
    try {
      const healingActive = localStorage.getItem("banhocduong_healing_mode") === "active";
      if (!healingActive) return null;

      const rawLogs = localStorage.getItem("banhocduong_history");
      if (!rawLogs) return null;
      const logs = JSON.parse(rawLogs);

      const currentDuration = parseInt(localStorage.getItem("banhocduong_healing_duration") || "30", 10);
      
      const dassTests = logs.filter(l => l.test === "dass42");
      const mmpiTests = logs.filter(l => l.test === "mmpi30");
      const phq9Tests = logs.filter(l => l.test === "phq9");
      const gad7Tests = logs.filter(l => l.test === "gad7");
      const who5Tests = logs.filter(l => l.test === "who5");

      let adaptation = null;

      // 1. Check PHQ-9 progress
      if (!adaptation && phq9Tests.length >= 2) {
        const latest = phq9Tests[phq9Tests.length - 1];
        const previous = phq9Tests[phq9Tests.length - 2];
        if (latest.score < previous.score) {
          const decrease = previous.score - latest.score;
          let reducedDays = decrease * 5;
          
          const startDateStr = localStorage.getItem("banhocduong_healing_start_date") || "";
          let currentProgressDay = 1;
          if (startDateStr) {
            const start = new Date(startDateStr).getTime();
            const now = new Date().getTime();
            currentProgressDay = Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;
          }
          const newDuration = Math.max(currentProgressDay + 3, currentDuration - reducedDays);
          if (newDuration < currentDuration) {
            adaptation = {
              type: "phq9",
              improvement: `chỉ số trầm cảm PHQ-9 giảm từ ${previous.score} xuống ${latest.score} điểm (giảm ${decrease} điểm)`,
              reducedDays: currentDuration - newDuration,
              oldDuration: currentDuration,
              newDuration: newDuration
            };
          }
        } else if (latest.score > previous.score) {
          const increase = latest.score - previous.score;
          let addedDays = Math.min(increase * 2, 7);
          const newDuration = currentDuration + addedDays;
          adaptation = {
            type: "phq9",
            worsen: true,
            improvement: `chỉ số trầm cảm PHQ-9 tăng từ ${previous.score} lên ${latest.score} điểm`,
            addedDays: addedDays,
            oldDuration: currentDuration,
            newDuration: newDuration
          };
        }
      }

      // 2. Check GAD-7 progress
      if (!adaptation && gad7Tests.length >= 2) {
        const latest = gad7Tests[gad7Tests.length - 1];
        const previous = gad7Tests[gad7Tests.length - 2];
        if (latest.score < previous.score) {
          const decrease = previous.score - latest.score;
          let reducedDays = decrease * 5;
          
          const startDateStr = localStorage.getItem("banhocduong_healing_start_date") || "";
          let currentProgressDay = 1;
          if (startDateStr) {
            const start = new Date(startDateStr).getTime();
            const now = new Date().getTime();
            currentProgressDay = Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;
          }
          const newDuration = Math.max(currentProgressDay + 3, currentDuration - reducedDays);
          if (newDuration < currentDuration) {
            adaptation = {
              type: "gad7",
              improvement: `chỉ số lo âu GAD-7 giảm từ ${previous.score} xuống ${latest.score} điểm (giảm ${decrease} điểm)`,
              reducedDays: currentDuration - newDuration,
              oldDuration: currentDuration,
              newDuration: newDuration
            };
          }
        } else if (latest.score > previous.score) {
          const increase = latest.score - previous.score;
          let addedDays = Math.min(increase * 2, 7);
          const newDuration = currentDuration + addedDays;
          adaptation = {
            type: "gad7",
            worsen: true,
            improvement: `chỉ số lo âu GAD-7 tăng từ ${previous.score} lên ${latest.score} điểm`,
            addedDays: addedDays,
            oldDuration: currentDuration,
            newDuration: newDuration
          };
        }
      }

      // 3. Check WHO-5 progress
      if (!adaptation && who5Tests.length >= 2) {
        const latest = who5Tests[who5Tests.length - 1];
        const previous = who5Tests[who5Tests.length - 2];
        if (latest.score > previous.score) {
          const increase = latest.score - previous.score;
          let reducedDays = increase * 4;
          
          const startDateStr = localStorage.getItem("banhocduong_healing_start_date") || "";
          let currentProgressDay = 1;
          if (startDateStr) {
            const start = new Date(startDateStr).getTime();
            const now = new Date().getTime();
            currentProgressDay = Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;
          }
          const newDuration = Math.max(currentProgressDay + 3, currentDuration - reducedDays);
          if (newDuration < currentDuration) {
            adaptation = {
              type: "who5",
              improvement: `chỉ số hạnh phúc WHO-5 tăng từ ${previous.score} lên ${latest.score} điểm (tăng ${increase} điểm)`,
              reducedDays: currentDuration - newDuration,
              oldDuration: currentDuration,
              newDuration: newDuration
            };
          }
        } else if (latest.score < previous.score) {
          const decrease = previous.score - latest.score;
          let addedDays = Math.min(decrease * 2, 7);
          const newDuration = currentDuration + addedDays;
          adaptation = {
            type: "who5",
            worsen: true,
            improvement: `chỉ số hạnh phúc WHO-5 giảm từ ${previous.score} xuống ${latest.score} điểm`,
            addedDays: addedDays,
            oldDuration: currentDuration,
            newDuration: newDuration
          };
        }
      }

      // 4. Check DASS-21 progress (DASS total score decrease)
      if (!adaptation && dassTests.length >= 2) {
        const latest = dassTests[dassTests.length - 1];
        const previous = dassTests[dassTests.length - 2];
        
        const latestSum = latest.scores.D + latest.scores.A + latest.scores.S;
        const prevSum = previous.scores.D + previous.scores.A + previous.scores.S;

        if (latestSum < prevSum) {
          const decrease = prevSum - latestSum;
          const pct = ((prevSum - latestSum) / prevSum) * 100;
          
          if (decrease >= 5 || pct >= 15) {
            let reducedDays = 0;
            if (decrease >= 15) reducedDays = 20;
            else if (decrease >= 10) reducedDays = 15;
            else if (decrease >= 5) reducedDays = 10;

            const startDateStr = localStorage.getItem("banhocduong_healing_start_date") || "";
            let currentProgressDay = 1;
            if (startDateStr) {
              const start = new Date(startDateStr).getTime();
              const now = new Date().getTime();
              const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;
              currentProgressDay = diffDays;
            }

            const newDuration = Math.max(currentProgressDay + 3, currentDuration - reducedDays);
            
            if (newDuration < currentDuration) {
              adaptation = {
                type: "dass",
                improvement: `chỉ số DASS giảm từ ${prevSum} xuống ${latestSum} điểm (giảm ${decrease} điểm, tương đương ${Math.round(pct)}%)`,
                reducedDays: currentDuration - newDuration,
                oldDuration: currentDuration,
                newDuration: newDuration
              };
            }
          }
        } else if (latestSum > prevSum) {
          const increase = latestSum - prevSum;
          if (increase >= 5) {
            let addedDays = Math.min(Math.floor(increase / 2), 7);
            const newDuration = currentDuration + addedDays;
            adaptation = {
              type: "dass",
              worsen: true,
              improvement: `chỉ số DASS tăng từ ${prevSum} lên ${latestSum} điểm`,
              addedDays: addedDays,
              oldDuration: currentDuration,
              newDuration: newDuration
            };
          }
        }
      }

      // 5. Check MMPI-30 progress (Aligned pathology T-score >= 70)
      if (!adaptation && mmpiTests.length >= 2) {
        const latest = mmpiTests[mmpiTests.length - 1];
        const previous = mmpiTests[mmpiTests.length - 2];

        const latestElevated = latest.clinical ? latest.clinical.filter(c => c.score >= 70).length : 0;
        const prevElevated = previous.clinical ? previous.clinical.filter(c => c.score >= 70).length : 0;

        if (latestElevated < prevElevated) {
          const decrease = prevElevated - latestElevated;
          let reducedDays = decrease * 10; 

          const startDateStr = localStorage.getItem("banhocduong_healing_start_date") || "";
          let currentProgressDay = 1;
          if (startDateStr) {
            const start = new Date(startDateStr).getTime();
            const now = new Date().getTime();
            const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;
            currentProgressDay = diffDays;
          }

          const newDuration = Math.max(currentProgressDay + 3, currentDuration - reducedDays);

          if (newDuration < currentDuration) {
            adaptation = {
              type: "mmpi",
              improvement: `số thang đo MMPI vượt ngưỡng cảnh báo giảm từ ${prevElevated} xuống ${latestElevated} thang đo (giảm ${decrease} thang đo)`,
              reducedDays: currentDuration - newDuration,
              oldDuration: currentDuration,
              newDuration: newDuration
            };
          }
        } else if (latestElevated > prevElevated) {
          const increase = latestElevated - prevElevated;
          let addedDays = Math.min(increase * 3, 7);
          const newDuration = currentDuration + addedDays;
          adaptation = {
            type: "mmpi",
            worsen: true,
            improvement: `số thang đo MMPI vượt ngưỡng cảnh báo tăng từ ${prevElevated} lên ${latestElevated} thang đo`,
            addedDays: addedDays,
            oldDuration: currentDuration,
            newDuration: newDuration
          };
        }
      }

      if (adaptation) {
        localStorage.setItem("banhocduong_healing_duration", adaptation.newDuration.toString());
        
        logs.push({
          date: new Date().toISOString(),
          type: "duration_change",
          oldDuration: adaptation.oldDuration,
          newDuration: adaptation.newDuration,
          reason: adaptation.worsen
            ? `Tăng lộ trình từ ${adaptation.oldDuration} ngày lên ${adaptation.newDuration} ngày do tiến triển tinh thần có dấu hiệu chững lại: ${adaptation.improvement}.`
            : `Rút ngắn lộ trình từ ${adaptation.oldDuration} ngày xuống ${adaptation.newDuration} ngày do tiến triển tinh thần cải thiện rõ rệt: ${adaptation.improvement}.`
        });
        localStorage.setItem("banhocduong_history", JSON.stringify(logs));
        return adaptation;
      }
    } catch (e) {
      console.error("Failed to adapt duration", e);
    }
    return null;
  }
}

export const psychologyService = new PsychologyService();
export default psychologyService;
