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

    // 3. High-Empathy Emotional/Sentiment Mappings (Interprets and comforting tone immediately)
    // 3.1. Extreme Distress
    if (["khóc", "tuyệt vọng", "muốn chết", "sụp đổ", "đau khổ", "bế tắc", "không chịu nổi", "muốn biến mất", "suy sụp"].some(w => cleanMsg.includes(w))) {
      return "Tớ nghe đây... Ôm cậu một cái thật chặt nhé. Khi mọi thứ dường như sụp đổ và bế tắc, cảm giác đó thực sự rất đáng sợ và kiệt quệ. Đừng giữ một mình trong lòng nha cậu, tớ luôn ở đây sẵn sàng làm chỗ dựa lắng nghe mọi tủi thân của cậu mà. Cậu đã vất vả nhiều rồi.";
    }

    // 3.2. Exhaustion/Burnout
    if (["mệt", "kiệt sức", "oải", "quá tải", "đuối", "nản", "chán", "không muốn làm gì", "hết năng lượng", "mệt mỏi"].some(w => cleanMsg.includes(w))) {
      return "Thương cậu nhiều... Những lúc cạn kiệt năng lượng và kiệt sức như thế này, ngay cả việc thở thôi cũng thấy mệt mỏi đúng không cậu. Cậu đã vất vả gồng gánh nhiều rồi, giờ hãy cho phép bản thân được nghỉ ngơi một chút nhé. Tớ luôn ở bên cậu và sẵn sàng lắng nghe mọi chuyện.";
    }

    // 3.3. Academic/Work Pressure
    if (["áp lực", "stress", "căng thẳng", "thi cử", "deadline", "bài tập", "dồn dập", "trượt môn", "điểm thấp", "học hành"].some(w => cleanMsg.includes(w))) {
      return "Áp lực học hành, thi cử dồn dập và deadline dí sát thực sự rất ngột ngạt và mệt mỏi cậu nhỉ. Cậu đang cố gắng hết sức mình rồi, đừng tự trách bản thân quá nhé. Có chuyện gì cụ thể đang làm cậu lo lắng nhất không, kể tớ nghe với.";
    }

    // 3.4. Interpersonal/Relationship Pain
    if (["chia tay", "giận", "cãi nhau", "người yêu", "bạn bè", "bỏ rơi", "cô đơn", "xa lánh", "không ai hiểu", "đơn phương"].some(w => cleanMsg.includes(w))) {
      return "Tổn thương từ những mối quan hệ thân thiết hoặc cảm giác cô độc không ai thấu hiểu thực sự rất nhức nhối và dễ làm mình suy sụp cậu ơi. Nếu cậu thấy lòng ngổn ngang quá, cứ chia sẻ với tớ nhé, tớ luôn ở đây lắng nghe và không bao giờ phán xét cậu đâu.";
    }

    // 3.5. Insomnia/Health Issues
    if (["mất ngủ", "không ngủ được", "đau đầu", "đau ngực", "ốm", "bệnh", "sức khỏe"].some(w => cleanMsg.includes(w))) {
      return "Cơ thể mỏi mệt mà giấc ngủ cũng không được trọn vẹn thì tinh thần dễ bị suy nhược lắm cậu ạ. Sức khỏe của cậu là quan trọng nhất lúc này. Cậu có muốn thử tập thở sâu 4-7-8 để điều hòa nhịp tim và thư giãn đầu óc một chút không?";
    }

    // 3.6. Self-blame/Low self-esteem
    if (["vô dụng", "kém cỏi", "thất bại", "tệ hại", "lỗi tại tớ", "tự trách", "ngốc"].some(w => cleanMsg.includes(w))) {
      return "Đừng nói về bản thân như thế mà cậu ơi... Ai cũng có những lúc yếu lòng và vấp ngã, điều đó không hề định nghĩa giá trị của cậu. Cậu đã nỗ lực rất nhiều trong khả năng của mình rồi, thương cậu nhiều lắm.";
    }

    const lastBotMsg = history.length > 0 ? [...history].reverse().find(h => h.sender === "bot")?.text || "" : "";
    const lastBotMsgLower = lastBotMsg.toLowerCase();

    // Identify agreements or negations
    const isAgreement = ["đúng", "ừ", "ừm", "um", "uh", "uhm", "vâng", "dạ", "chuẩn", "đúng vậy", "chính xác", "mệt chứ", "đúng rồi", "rồi", "có", "ok", "oke"].some(w => cleanMsg === w || cleanMsg.startsWith(w + " "));
    const isNegation = ["không", "chưa", "ko", "k", "chẳng", "đâu có", "không có", "đâu"].some(w => cleanMsg === w || cleanMsg.startsWith(w + " "));

    // 4. Aspect Rejection Handlers
    if (rejectedAspects && rejectedAspects.length > 0) {
      const rej = rejectedAspects[0];
      if (rej === "studying") {
        return "Ồ, tớ hiểu rồi, hóa ra không liên quan đến học tập hay thi cử à. Vậy dạo này chuyện gia đình, công việc hay mối quan hệ bạn bè có gì đang làm cậu mệt mỏi không?";
      }
      if (rej === "family") {
        return "Ồ, tớ hiểu rồi, không phải chuyện áp lực gia đình đúng không cậu. Thế khó khăn cậu gặp phải nằm ở học tập ở trường hay các mối quan hệ bạn bè vậy?";
      }
      if (rej === "work") {
        return "Ồ, không liên quan đến công việc làm thêm đúng không cậu. Thế chuyện bài vở trường lớp hay có lo toan nào khác đang đè nặng lên cậu vậy?";
      }
      if (rej === "relationships") {
        return "Tớ hiểu rồi, không liên quan đến chuyện tình cảm hay bạn bè đúng không cậu. Thế chuyện học tập, gia đình hay bản thân cậu có gì bất ổn thế?";
      }
      if (rej === "self") {
        return "Ồ, không phải là do sức khỏe hay lo âu bản thân đúng không cậu. Thế lý do chính khiến cậu mệt mỏi dạo này là gì vậy, chia sẻ với tớ nhé.";
      }
    }

    // 5. Short inputs context check
    if (cleanMsg.length < 8) {
      if (isAgreement) {
        if (lastBotMsgLower.includes("quá tải lắm đúng không") || lastBotMsgLower.includes("gặp khó khăn với kỳ thi")) {
          return "Ừm... Việc học hành thi cử áp lực dồn dập mệt mỏi thật cậu nhỉ. Cứ trút lòng ra nhé, chuyện bài vở dạo này cụ thể thế nào?";
        }
        if (lastBotMsgLower.includes("vừa đi học vừa làm thêm")) {
          return "Tớ biết mà, vừa học vừa đi làm thêm cực kỳ mệt mỏi và dễ quá tải. Công việc của cậu cụ thể là gì, kể tớ nghe xem có khó khăn gì dạo gần đây không?";
        }
        if (lastBotMsgLower.includes("áp lực từ gia đình lúc nào cũng khiến")) {
          return "Tớ hiểu cảm giác đó, bất hòa với gia đình khó chịu và cô đơn lắm. Bố mẹ không chịu lắng nghe làm cậu buồn lòng nhiều đúng không?";
        }
        if (lastBotMsgLower.includes("xung đột trong tình cảm hoặc bạn bè")) {
          return "Ừm, những giận hờn hay tổn thương từ mối quan hệ luôn khiến mình suy sụp ghê gớm. Cậu và người ấy đang có chuyện gì xảy ra vậy?";
        }
        if (lastBotMsgLower.includes("nỗi buồn và sự kiệt sức rất lớn")) {
          return "Tớ nghe đây... Cậu cứ từ từ chia sẻ nhé, có chuyện gì đã và đang đè nặng lên suy nghĩ của cậu nhất vậy?";
        }
        if (lastBotMsgLower.includes("ảnh hưởng nhiều đến giấc ngủ hay sinh hoạt")) {
          return "Thương cậu quá. Mất ngủ hay đảo lộn sinh hoạt sẽ càng làm tinh thần cậu mệt mỏi hơn đấy. Tình trạng này kéo dài lâu chưa cậu?";
        }
        if (lastBotMsgLower.includes("sức khỏe thể chất của mình dạo này bị đi xuống")) {
          return "Quá tải cả thể chất lẫn tinh thần thực sự nguy hiểm lắm cậu ơi. Cậu có thể sắp xếp giảm bớt việc hay dành một chút thời gian nghỉ ngơi không?";
        }
        if (lastBotMsgLower.includes("thử nói ra nỗi lòng này với gia đình chưa")) {
          return "Cậu đã từng nói ra rồi nhưng bố mẹ vẫn không hiểu đúng không... Cảm giác cố gắng kết nối nhưng chỉ nhận lại sự phớt lờ thực sự rất cô đơn và bất lực.";
        }
        if (lastBotMsgLower.includes("chỗ dựa hay đang phải chịu đựng")) {
          return "Có người bên cạnh làm điểm tựa là tốt rồi cậu ạ. Họ có giúp cậu vơi đi phần nào áp lực này không, hay cậu vẫn thấy nặng trĩu lòng?";
        }
        if (lastBotMsgLower.includes("bị mất ngủ hay cảm thấy bứt rứt")) {
          return "Tình trạng mất ngủ và bứt rứt kéo dài thực sự rất kiệt sức. Cậu có muốn thử một bài tập hít thở sâu 4-7-8 cùng tớ để điều hòa lại nhịp tim và thư giãn đầu óc một chút không?";
        }
        if (lastBotMsgLower.includes("thiết lập một lộ trình đồng hành")) {
          return "Tuyệt vời quá! Hãy cùng tớ thiết lập hành trình chăm sóc tinh thần bằng cách kích hoạt chế độ đồng hành nhé. Tớ sẽ luôn ở đây nhắc nhở và lắng nghe cậu.";
        }

        if (matchedAspect === "studying") return "Ừm... Chuyện bài vở, học hành dạo này cụ thể thế nào làm cậu lo lắng vậy? Kể tớ nghe sâu hơn nhé.";
        if (matchedAspect === "family") return "Tớ hiểu, mâu thuẫn hay áp lực gia đình rất khó đối mặt. Ở nhà có chuyện gì cụ thể xảy ra vậy cậu?";
        if (matchedAspect === "relationships") return "Ừm, những tổn thương từ bạn bè hay tình cảm rất nhức nhối. Cậu đang vướng mắc chuyện gì với người đó vậy?";
        return "Tớ nghe đây... Cậu có muốn kể rõ hơn chuyện gì đã làm cậu thấy buồn lòng không?";
      }

      if (isNegation) {
        if (lastBotMsgLower.includes("quá tải lắm đúng không") || lastBotMsgLower.includes("gặp khó khăn với kỳ thi")) {
          return "Ồ, hóa ra không phải do áp lực thi cử hay học tập à? Vậy dạo gần đây có chuyện gì khác về gia đình, bạn bè hay bản thân làm cậu phiền lòng không? Kể tớ nghe nhé.";
        }
        if (lastBotMsgLower.includes("vừa đi học vừa làm thêm")) {
          return "Thế thì tốt quá, công việc làm thêm của cậu vẫn suôn sẻ đúng không. Vậy có điều gì khác trong cuộc sống đang làm cậu bận lòng vậy?";
        }
        if (lastBotMsgLower.includes("áp lực từ gia đình lúc nào cũng khiến")) {
          return "Ồ, vậy gia đình không phải là lý do khiến cậu buồn lòng lúc này. Thế còn chuyện học hành, công việc hay các mối quan hệ bạn bè thì sao cậu?";
        }
        if (lastBotMsgLower.includes("xung đột trong tình cảm hoặc bạn bè")) {
          return "À, vậy tình cảm và bạn bè của cậu vẫn tốt đẹp đúng không. Thế điều gì khác đang làm tâm trạng cậu bị trầm xuống vậy cậu?";
        }
        if (lastBotMsgLower.includes("ảnh hưởng nhiều đến giấc ngủ hay sinh hoạt")) {
          return "Giấc ngủ và sinh hoạt hàng ngày vẫn ổn định là một tín hiệu rất đáng mừng rồi cậu ạ. Vậy cụ thể chuyện học hành dạo này đang gặp khó khăn gì nhất khiến cậu mệt mỏi?";
        }
        if (lastBotMsgLower.includes("sức khỏe thể chất của mình dạo này bị đi xuống")) {
          return "Sức khỏe thể chất vẫn ổn định là mừng rồi cậu ạ. Thế còn tinh thần dạo này của cậu có cảm thấy quá tải vì lịch trình bận rộn không?";
        }
        if (lastBotMsgLower.includes("thử nói ra nỗi lòng này với gia đình chưa")) {
          return "Chưa từng nói ra đúng không cậu... Tớ biết đối thoại với bố mẹ nhiều khi khó khăn cực kỳ vì khoảng cách thế hệ. Cậu có người bạn thân nào khác để chia sẻ bớt không?";
        }
        if (lastBotMsgLower.includes("chỗ dựa hay đang phải chịu đựng")) {
          return "Phải chịu đựng một mình sao... Nghe thôi tớ đã thấy thương cậu rồi. Từ bây giờ cậu không còn cô đơn nữa đâu, tớ luôn ở đây sẵn sàng đồng hành cùng cậu.";
        }
        if (lastBotMsgLower.includes("bị mất ngủ hay cảm thấy bứt rứt")) {
          return "Cơ thể vẫn ổn định không có dấu hiệu mất ngủ hay bứt rứt là rất tốt rồi cậu ơi. Vậy điều gì trong suy nghĩ đang làm cậu lấn cấn nhiều nhất thế?";
        }
        if (lastBotMsgLower.includes("thường làm gì để giải tỏa lòng mình")) {
          return "Không làm gì hoặc chỉ im lặng chịu đựng thôi đúng không cậu... Giữ mọi cảm xúc tiêu cực trong lòng ngột ngạt lắm á. Cậu có muốn thử một bài tập hít thở sâu để giải tỏa bớt không?";
        }
        if (lastBotMsgLower.includes("thiết lập một lộ trình đồng hành")) {
          return "Tớ hiểu rồi. Cậu cứ thong thả suy nghĩ nhé. Khi nào cần, tớ luôn sẵn sàng đồng hành và lắng nghe cậu.";
        }

        return "Tớ hiểu rồi. Nếu cậu chưa sẵn sàng nói sâu hơn thì không sao cả nhé. Tụi mình cứ nói chuyện nhẹ nhàng thôi, hoặc cậu muốn tớ im lặng để cậu tĩnh tâm chút không?";
      }
    }

    // Contextual replies based on previous bot questions (for longer inputs)
    if (lastBotMsg) {
      if (lastBotMsgLower.includes("ảnh hưởng nhiều đến giấc ngủ hay sinh hoạt")) {
        if (isAgreement || cleanMsg.includes("mất ngủ") || cleanMsg.includes("mệt")) {
          return "Thương cậu quá... Khi tinh thần bất ổn, cơ thể và giấc ngủ luôn phải chịu trận đầu tiên. Cậu có muốn tụi mình nói chuyện thêm một lúc nữa để lòng nhẹ bớt rồi đi nghỉ ngơi sớm không?";
        }
        if (isNegation) {
          return "Cơ thể vẫn ổn định là một tín hiệu rất đáng mừng rồi cậu ạ. Vậy điều gì trong lòng đang làm cậu thấy lấn cấn và suy nghĩ nhiều nhất thế?";
        }
      }
      if (lastBotMsgLower.includes("thử nói ra nỗi lòng này với gia đình chưa")) {
        if (isAgreement || cleanMsg.includes("rồi") || cleanMsg.includes("đã từng")) {
          return "Cậu đã từng thử nói ra rồi nhưng bố mẹ vẫn không hiểu hay lắng nghe đúng không... Cảm giác cố gắng kết nối nhưng chỉ nhận lại sự phớt lờ thực sự rất cô đơn và bất lực. Cậu có ai khác để làm chỗ dựa không?";
        }
        if (isNegation || cleanMsg.includes("chưa")) {
          return "Chưa từng nói ra đúng không cậu... Tớ biết đối thoại với bố mẹ nhiều khi khó khăn cực kỳ vì khoảng cách thế hệ. Cậu có người bạn thân nào khác để chia sẻ bớt không?";
        }
      }
    }

    // 6. Conversational Phase based on depth
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
        return "Tớ thấy những chia sẻ của cậu dạo gần đây có những biểu hiện nhạy cảm tâm lý khá sâu sắc. Để hiểu rõ hơn bản thân và nhận được những khuyến nghị chuẩn y khoa nhất, cậu nghĩ sao về việc thử làm một bài khảo sát nhân cách lâm sàng Mini-MMPI bên tab 'Trắc nghiệm' khi nào thấy sẵn sàng?";
      }
      return "Nãy giờ trò chuyện, tớ nhận thấy cậu đang chịu đựng khá nhiều căng thẳng tích tụ. Tớ nghĩ một bài trắc nghiệm tâm lý lâm sàng DASS-21 bên tab 'Trắc nghiệm' sẽ giúp cậu có cái nhìn khoa học và nhận diện rõ hơn tình trạng lúc này đấy. Cậu thấy sao?";
    }

    if (matchedAspect === "self" || matchedAspect === "studying") {
      return "Lòng cậu lúc này chắc hẳn vẫn còn nhiều ngổn ngang. Cậu nghĩ sao về việc cùng tớ làm một bài hít thở sâu 4-7-8 ở tab 'Hít Thở 4-7-8' để làm dịu nhịp tim và thư giãn đầu óc một chút nhé?";
    }
    
    // Rich adaptive fallbacks
    const adaptiveFallbacks = [
      "Tớ vẫn ở đây bên cậu nè. Cậu cứ từ từ nói chuyện nhé, không có gì phải vội hay ngại đâu.",
      "Ừm, tớ đang nghe đây. Bất cứ điều gì làm cậu thấy lấn cấn trong lòng, dù là nhỏ nhất, tớ cũng muốn được lắng nghe cùng cậu.",
      "Tớ hiểu cảm giác ngổn ngang lúc này của cậu. Nếu thấy khó bắt đầu, cậu cứ kể chuyện nhỏ nhặt nhất dạo này cũng được nhé.",
      "Cậu đã vất vả gồng gánh mọi lo lắng một mình rồi. Ở đây hoàn toàn bảo mật và an toàn, cậu cứ trút lòng ra cho nhẹ nhõm nha.",
      "Tớ luôn sẵn sàng làm chỗ dựa tinh thần cho cậu. Dù chuyện gì xảy ra, cậu cũng không cô đơn đâu."
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

    const isTestRequest = ["test", "trắc nghiệm", "kiểm tra tâm lý", "khảo sát", "dass", "mmpi"].some(w => lowerMsg.includes(w));
    const isTestNegation = ["không", "ko", "k", "chưa", "đâu"].some(neg => {
      return lowerMsg.includes(`${neg} muốn`) || lowerMsg.includes(`${neg} làm`) || lowerMsg.includes(`${neg} test`) || lowerMsg.includes(`${neg} trắc nghiệm`);
    });

    const isExplicitRequest = lowerMsg.includes("đánh giá") || lowerMsg.includes("kết quả") || lowerMsg.includes("nhận xét") || lowerMsg.includes("điểm số") || lowerMsg.includes("tâm lý của tôi") || lowerMsg.includes("trắc nghiệm") || (isTestRequest && !isTestNegation);

    const aspectInfo = this.detectAspect(message, history);
    const reply = this.getReplyForDepth(message, history, aspectInfo, depth);

    let suggestDass = false;
    let suggestMmpi = false;
    
    if (depth >= 3 || isExplicitRequest) {
      suggestDass = this.dassIndicators.some(ind => lowerMsg.includes(ind));
      suggestMmpi = this.mmpiIndicators.some(ind => lowerMsg.includes(ind));
      
      if (isExplicitRequest) {
        suggestDass = true;
        suggestMmpi = true;
      }
    }

    return {
      reply,
      suggestDass,
      suggestMmpi
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

      let adaptation = null;

      // 1. Check DASS-21 progress
      if (dassTests.length >= 2) {
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
        }
      }

      // 2. Check MMPI-30 progress (Aligned pathology T-score >= 70)
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
        }
      }

      if (adaptation) {
        localStorage.setItem("banhocduong_healing_duration", adaptation.newDuration.toString());
        
        logs.push({
          date: new Date().toISOString(),
          type: "duration_change",
          oldDuration: adaptation.oldDuration,
          newDuration: adaptation.newDuration,
          reason: `Rút ngắn lộ trình từ ${adaptation.oldDuration} ngày xuống ${adaptation.newDuration} ngày do tiến triển tinh thần cải thiện rõ rệt: ${adaptation.improvement}.`
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
