import BaseBot from "./BaseBot";

const API_URL = "http://localhost:8000";

export default class AIBot extends BaseBot {

  /**
   * AI Bot calls the Python FastAPI server to generate responses using Google Gemini.
   */
  async getGreeting() {
    try {
      const response = await fetch(`${API_URL}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Hãy đưa ra một câu chào thân mật bằng tiếng Việt dành cho người dùng quay trở lại không gian đồng hành chữa lành sức khỏe tinh thần.",
          history: [],
          bio: this.bio
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.reply;
      }
    } catch (err) {
      console.warn("Lỗi gọi Python AI Backend (getGreeting), sử dụng dự phòng:", err);
    }

    // Fallback nếu không kết nối được backend
    const name = this.bio?.displayName || "cậu";
    if (this.healingActive) {
      return `Chào ${name}! Tớ là trợ lý AI Đồng Hành của cậu đây. Dữ liệu của tớ cho thấy cậu đang trong lộ trình phục hồi. Hôm nay cậu cảm thấy thế nào? Hãy nói cho tớ nghe nhé!`;
    } else {
      return `Chào ${name}! Tớ là AI Đồng Hành chuyên biệt. Tớ ở đây để lắng nghe và phân tích cảm xúc của cậu mà không hề phán xét. Dạo này cậu thế nào?`;
    }
  }

  async getResponse(selectedItem, type) {
    const responses = selectedItem[type];
    let baseText = "";
    
    if (Array.isArray(responses)) {
      baseText = responses[0];
    } else {
      baseText = responses || "";
    }

    try {
      const response = await fetch(`${API_URL}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Viết lại câu phản hồi sau đây một cách đồng cảm, ấm áp, sâu sắc và tự nhiên hơn, xưng hô 'tớ' và 'cậu': "${baseText}"`,
          history: [],
          bio: this.bio
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.reply;
      }
    } catch (err) {
      console.warn("Lỗi gọi Python AI Backend (getResponse), sử dụng dự phòng:", err);
    }
    
    const name = this.bio?.displayName ? this.bio.displayName.split(" ")[this.bio.displayName.split(" ").length - 1] : "cậu";
    return `${baseText} (AI hiểu cậu mà, ${name}!)`;
  }

  async chatAudio(audioBlob, isCallMode = false) {
    try {
      const mappedHistory = (this.historyLogs || []).slice(-8).map(log => ({
        role: log.sender === "bot" ? "model" : "user",
        content: log.text || log.desc || ""
      })).filter(item => item.content !== "");

      const formData = new FormData();
      formData.append("file", audioBlob, "voice.webm");
      formData.append("history", JSON.stringify(mappedHistory));
      formData.append("bio", JSON.stringify(this.bio || {}));
      formData.append("isCallMode", isCallMode);

      const response = await fetch(`${API_URL}/api/ai/chat/audio`, {
        method: "POST",
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (err) {
      console.warn("Lỗi gọi Python AI Backend (chatAudio):", err);
    }
    return null;
  }

  async chat(message) {
    try {
      // Tạo lịch sử tin nhắn cơ bản từ các logs trước đó nếu có
      const mappedHistory = (this.historyLogs || []).slice(-8).map(log => ({
        role: log.sender === "bot" ? "model" : "user",
        content: log.text || log.desc || ""
      })).filter(item => item.content !== "");

      const response = await fetch(`${API_URL}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message,
          history: mappedHistory,
          bio: this.bio
        })
      });

      if (response.ok) {
        const data = await response.json();
        let replyText = data.reply || "";
        
        // Trích xuất thẻ cập nhật hồ sơ [UPDATE_PROFILE: {...}]
        let bioUpdate = null;
        const updateRegex = /\[UPDATE_PROFILE:\s*({.*?})\]/i;
        const match = replyText.match(updateRegex);
        if (match && match[1]) {
          try {
            bioUpdate = JSON.parse(match[1]);
          } catch (e) {
            console.error("Lỗi parse JSON UPDATE_PROFILE:", e);
          }
          // Xóa thẻ khỏi câu trả lời hiển thị cho user
          replyText = replyText.replace(updateRegex, "").trim();
        }
        
        // Phân tích câu trả lời của AI để hiển thị nút Test tương ứng
        const suggestPhq9 = replyText.includes("PHQ-9") || replyText.includes("Trầm cảm");
        const suggestGad7 = replyText.includes("GAD-7") || replyText.includes("Lo âu");
        const suggestWho5 = replyText.includes("WHO-5") || replyText.includes("Hạnh phúc");
        const suggestBigFive = replyText.includes("Big Five") || replyText.includes("MMPI") || replyText.includes("Nhân cách");

        return {
          reply: replyText,
          suggestPhq9,
          suggestGad7,
          suggestWho5,
          suggestBigFive,
          bioUpdate
        };
      }
    } catch (err) {
      console.warn("Lỗi gọi Python AI Backend (chat), sử dụng dự phòng:", err);
    }

    return {
      reply: `Tớ ghi nhận chia sẻ của cậu: "${message}". Hiện tại tớ đang hoạt động ở chế độ ngoại tuyến, nhưng tớ vẫn luôn lắng nghe và bên cạnh cậu nhé!`,
      suggestPhq9: false,
      suggestGad7: false,
      suggestWho5: false,
      suggestBigFive: false
    };
  }

  async chatStream(message, onChunk, onDone) {
    try {
      const mappedHistory = (this.historyLogs || []).slice(-8).map(log => ({
        role: log.sender === "bot" ? "model" : "user",
        content: log.text || log.desc || ""
      })).filter(item => item.content !== "");

      const response = await fetch(`${API_URL}/api/ai/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message,
          history: mappedHistory,
          bio: this.bio
        })
      });

      if (!response.ok) {
        throw new Error("Mạng bị lỗi");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let fullReply = "";
      let buffer = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\\n');
          buffer = lines.pop(); // Giữ lại phần chưa hoàn chỉnh
          
          for (let line of lines) {
            line = line.trim();
            if (line.startsWith("data: ")) {
              const jsonStr = line.substring(6);
              try {
                const parsed = JSON.parse(jsonStr);
                if (parsed.text) {
                  fullReply += parsed.text;
                  if (onChunk) onChunk(fullReply);
                } else if (parsed.error) {
                  fullReply += parsed.error;
                  if (onChunk) onChunk(fullReply);
                }
              } catch (e) {
                // Ignore incomplete JSON chunks or parse errors
              }
            }
          }
        }
      }

      // Xử lý nốt buffer nếu còn
      if (buffer.trim().startsWith("data: ")) {
        const jsonStr = buffer.substring(6).trim();
        try {
          const parsed = JSON.parse(jsonStr);
          if (parsed.text) { fullReply += parsed.text; if (onChunk) onChunk(fullReply); }
          else if (parsed.error) { fullReply += parsed.error; if (onChunk) onChunk(fullReply); }
        } catch (e) {}
      }

      let replyText = fullReply;
      let bioUpdate = null;
      const updateRegex = /\\[UPDATE_PROFILE:\\s*({.*?})\\]/i;
      const match = replyText.match(updateRegex);
      if (match && match[1]) {
        try {
          bioUpdate = JSON.parse(match[1]);
        } catch (e) {}
        replyText = replyText.replace(updateRegex, "").trim();
      }

      const suggestPhq9 = replyText.includes("PHQ-9") || replyText.includes("Trầm cảm");
      const suggestGad7 = replyText.includes("GAD-7") || replyText.includes("Lo âu");
      const suggestWho5 = replyText.includes("WHO-5") || replyText.includes("Hạnh phúc");
      const suggestBigFive = replyText.includes("Big Five") || replyText.includes("MMPI") || replyText.includes("Nhân cách");

      if (onDone) {
        onDone({
          reply: replyText,
          suggestPhq9,
          suggestGad7,
          suggestWho5,
          suggestBigFive,
          bioUpdate
        });
      }
    } catch (err) {
      console.warn("Lỗi gọi Python AI Backend (chatStream), sử dụng dự phòng:", err);
      if (onDone) {
        onDone({
          reply: "Tớ đang gặp lỗi kết nối với trung tâm AI. Cậu hãy thử lại sau nhé!",
          suggestPhq9: false, suggestGad7: false, suggestWho5: false, suggestBigFive: false, bioUpdate: null
        });
      }
    }
  }

  /**
   * Gọi API phân tích kết quả bài kiểm tra trắc nghiệm tâm lý từ Python AI server.
   */
  async analyzeTest(testName, scores, validity = null, clinical = null, lang = "vi") {
    try {
      const response = await fetch(`${API_URL}/api/ai/analyze-test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testName,
          scores,
          validity,
          clinical,
          lang,
          bio: this.bio
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.analysis;
      }
    } catch (err) {
      console.warn("Lỗi gọi Python AI Backend (analyzeTest):", err);
    }
    return null; // Trả về null để frontend xử lý dự phòng (fallback) bằng text tĩnh
  }
}
