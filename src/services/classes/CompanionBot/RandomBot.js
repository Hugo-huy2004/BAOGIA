import BaseBot from "./BaseBot";

export default class RandomBot extends BaseBot {
  
  async getGreeting() {
    const activeGreetings = [
      "Chào cậu! Chào mừng cậu trở lại với không gian đồng hành hàng ngày cùng tớ. Hôm nay cậu cảm thấy thế nào? Cậu có muốn cùng tớ check-in cảm xúc, thực hiện bài trắc nghiệm định kỳ để đánh giá lại tiến độ, hay muốn trò chuyện và tìm các bài tập hỗ trợ xoa dịu tâm trí không? Tớ luôn bên cậu.",
      "Chào bạn nhé! Tớ rất vui được gặp lại cậu trong không gian bình yên này. Hôm nay tâm trạng cậu ra sao? Cậu muốn tâm sự, check-in cảm xúc hay thực hành một bài tập trị liệu nhỏ cùng tớ nào?",
      "Xin chào cậu yêu! Mỗi ngày thấy cậu ghé thăm là tớ thấy vui lắm. Cậu có điều gì băn khoăn muốn kể tớ nghe không, hay mình cùng đánh giá lại tiến trình phục hồi nhé?"
    ];

    const inactiveGreetings = [
      "Chào cậu, tớ là Chuyên viên Đồng Hành của cậu đây. Tại đây, mọi chia sẻ của cậu luôn được tớ lắng nghe trong không gian bảo mật và tuyệt đối không phán xét. Dạo gần đây, việc học tập, sức khỏe hay cuộc sống cá nhân của cậu thế nào? Cậu có điều gì bận tâm muốn chia sẻ, hoặc muốn cùng tớ thực hiện các bài đánh giá tâm lý chuẩn lâm sàng không?",
      "Chào bạn nhé, tớ là người bạn đồng hành luôn sẵn sàng lắng nghe mọi nỗi niềm của cậu. Dạo này học hành và cuộc sống của cậu có ổn không? Đừng ngần ngại chia sẻ với tớ hoặc làm bài đánh giá tâm lý nếu cậu thấy áp lực nhé.",
      "Xin chào cậu! Tớ ở đây để lắng nghe cậu vô điều kiện. Nếu cậu đang gặp khó khăn trong học tập hay các mối quan hệ, hãy kể tớ nghe. Hoặc cậu có thể bắt đầu bằng một bài test lâm sàng để tớ hiểu rõ hơn về tình trạng của cậu nha."
    ];

    const pool = this.healingActive ? activeGreetings : inactiveGreetings;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  async getResponse(selectedItem, type) {
    const responses = selectedItem[type];
    if (!responses) return "";
    
    // If it's a string, return as is. If array, pick random.
    if (Array.isArray(responses)) {
      return responses[Math.floor(Math.random() * responses.length)];
    }
    return responses;
  }

  async chat(message) {
    return "Tớ là Chuyên Viên Tâm Lý. Tớ chưa được lập trình để nói chuyện tự do đâu nhé!";
  }
}
