// Random bot response bank — used to respond without consuming AI tokens
const R = {
  greeting: [
    "Chào cậu! 😊 Hôm nay cậu cảm thấy thế nào rồi?",
    "Cậu đã đến rồi! Dạo này cậu ổn không? Cứ kể tớ nghe nhé.",
    "Xin chào! Tớ đang ở đây và sẵn sàng lắng nghe cậu đó.",
    "Chào mừng cậu trở lại! Tớ nhớ cậu lắm đó. Hôm nay có gì muốn chia sẻ không?",
    "Hey! Tớ ở đây rồi. Cậu vừa đến đúng lúc — tớ muốn nghe về ngày hôm nay của cậu.",
  ],

  empathy: [
    "Tớ hiểu cảm giác đó. Bình thường lắm khi cảm thấy như vậy.",
    "Cậu chia sẻ điều đó rất dũng cảm. Tớ đang lắng nghe mà.",
    "Ừ, đôi khi cuộc sống thật nặng nề. Nhưng cậu không cô đơn đâu nhé.",
    "Nghe cậu kể tớ thấy thương cậu lắm. Đừng giữ trong lòng — cứ nói ra nhé.",
    "Cảm xúc của cậu hoàn toàn có giá trị. Tớ hiểu tại sao cậu cảm thấy vậy.",
    "Điều cậu đang trải qua là rất thật. Tớ ở đây cùng cậu.",
    "Tớ nghe thấy cậu rồi. Không sao hết — cứ từ từ nói cho tớ nghe nhé.",
  ],

  question: [
    "Cậu có thể kể thêm cho tớ nghe không? Tớ muốn hiểu rõ hơn.",
    "Điều này ảnh hưởng đến cậu như thế nào trong cuộc sống hàng ngày?",
    "Cậu đã cảm thấy như vậy được bao lâu rồi?",
    "Có điều gì xảy ra gần đây khiến cậu cảm thấy vậy không?",
    "Ngoài điều đó ra, còn có gì khác đang làm cậu băn khoăn không?",
    "Khi cậu cảm thấy vậy, cậu thường làm gì để vượt qua?",
    "Cậu nghĩ điều gì đang tác động nhiều nhất đến cậu lúc này?",
  ],

  stress: [
    "Căng thẳng là điều hoàn toàn bình thường khi cậu đang cố gắng. Thử thở sâu một cái nhé? 🌬️",
    "Khi bị áp lực, cơ thể mình cần được nghỉ ngơi. Cậu đã tự chăm sóc bản thân hôm nay chưa?",
    "Tớ gợi ý cậu thử kỹ thuật thở 4-7-8: hít vào 4 giây, giữ 7 giây, thở ra 8 giây. Thử xem nhé!",
    "Áp lực quá nhiều có thể khiến mọi thứ trở nên mờ nhạt. Hãy chia nhỏ vấn đề ra — cái nào quan trọng nhất?",
    "Cậu đang mang quá nhiều thứ cùng một lúc. Tớ ở đây để cậu không phải gánh một mình nhé.",
    "Đôi khi chỉ cần dừng lại 5 phút, nhắm mắt và hít thở là đủ để reset rồi đó cậu.",
  ],

  sad: [
    "Buồn không phải là yếu đuối — đó là cảm xúc rất người. Tớ ở đây với cậu.",
    "Đôi khi khóc ra cũng tốt lắm cậu ơi. Đừng kìm nén cảm xúc của mình nhé.",
    "Nỗi buồn sẽ qua đi. Tớ tin cậu có đủ sức mạnh để vượt qua điều này.",
    "Cậu được phép buồn. Cảm xúc không cần phải được 'giải thích' hay 'biện hộ'.",
    "Tớ hiểu lắm. Đôi khi không cần lý do cũng vẫn cảm thấy buồn — và điều đó ổn thôi.",
    "Tối nay cậu đừng ở một mình nhé. Nếu không có ai bên cạnh, tớ ở đây mà.",
  ],

  sleep: [
    "Giấc ngủ ảnh hưởng trực tiếp đến sức khỏe tinh thần đó cậu. Gần đây cậu ngủ được mấy tiếng?",
    "Thử không dùng điện thoại trước khi ngủ 30 phút nhé, não sẽ dễ thư giãn hơn nhiều!",
    "Ngủ đủ giấc là liều thuốc tốt nhất cho tinh thần cậu ơi. 💤",
    "Mất ngủ thường là dấu hiệu của căng thẳng tích lũy. Cậu có muốn tớ gợi ý một số kỹ thuật giúp ngủ ngon không?",
    "Phòng ngủ mát, tối và yên tĩnh — ba điều đơn giản giúp cậu ngủ sâu hơn nhiều đó.",
    "Đừng ép bản thân phải ngủ. Hãy thử đọc sách hoặc nghe nhạc nhẹ thay vì scroll điện thoại nhé.",
  ],

  relationship: [
    "Các mối quan hệ đôi khi phức tạp lắm. Cậu muốn kể tớ nghe không?",
    "Việc đặt ra ranh giới lành mạnh trong các mối quan hệ là điều rất quan trọng và tốt cho bản thân mình.",
    "Tớ hiểu rằng tổn thương từ người thân yêu bao giờ cũng đau hơn. Cậu không sao đâu.",
    "Đôi khi 'buông' không có nghĩa là 'từ bỏ' — mà là tự bảo vệ mình. Cậu nghĩ sao?",
    "Mọi mối quan hệ đều cần được vun trồng từ hai phía. Cậu đang cảm thấy không được đáp lại à?",
    "Trong mối quan hệ, điều quan trọng nhất là cậu có cảm thấy được tôn trọng và an toàn không?",
  ],

  academic: [
    "Áp lực học hành có thể thật sự nặng nề. Cậu đang gặp khó khăn ở môn nào?",
    "Đôi khi nghỉ ngơi ngắn cũng là một chiến lược học tập hiệu quả đó cậu.",
    "Cậu đang làm hết sức rồi. Đừng quá khắt khe với bản thân nhé.",
    "Điểm số không nói lên tất cả về giá trị của cậu. Hãy nhớ điều đó nhé.",
    "Chia nhỏ mục tiêu học tập thành các phần nhỏ hơn giúp mọi thứ bớt áp đảo hơn nhiều đó.",
    "Cậu không phải hoàn hảo — chỉ cần cố gắng hết sức là đủ rồi. Tớ tin vào cậu!",
  ],

  family: [
    "Gia đình là nền tảng quan trọng nhưng cũng có thể là nguồn áp lực lớn. Cậu muốn chia sẻ thêm không?",
    "Hiểu lẫn nhau trong gia đình đôi khi cần thời gian và sự kiên nhẫn.",
    "Tớ nghĩ cậu rất quan tâm đến gia đình mình. Điều đó thật đáng trân trọng.",
    "Đôi khi những người thân yêu nhất lại không biết cách thể hiện tình yêu đúng cách. Điều đó không có nghĩa là họ không yêu cậu.",
    "Kỳ vọng của gia đình đôi khi có thể nặng lắm. Cậu cảm thấy thế nào với những kỳ vọng đó?",
  ],

  loneliness: [
    "Cô đơn không có nghĩa là không được yêu thương. Tớ ở đây với cậu mà.",
    "Đôi khi cảm thấy lạc lõng trong đám đông còn cô đơn hơn ở một mình. Tớ hiểu điều đó.",
    "Cậu không hề một mình. Tớ luôn sẵn sàng lắng nghe cậu bất cứ lúc nào.",
    "Cô đơn là tín hiệu cho thấy cậu cần kết nối hơn. Điều đó rất bình thường và ổn.",
    "Tớ ở đây này. Cậu không cần phải mang điều này một mình đâu nhé.",
  ],

  positive: [
    "Wow, nghe thật tuyệt! Cậu xứng đáng được hạnh phúc như vậy! 🎉",
    "Rất vui khi nghe cậu kể điều này! Tiếp tục lan tỏa năng lượng tích cực nhé!",
    "Tớ thấy cậu đang tiến bộ rất nhiều rồi đó! Tự hào về cậu lắm!",
    "Tuyệt vời! Cậu đang làm rất tốt — hãy giữ vững năng lượng này nhé. ✨",
    "Nghe điều này tớ cũng vui lây! Cậu xứng đáng với tất cả những điều tốt đẹp đang đến.",
  ],

  motivation: [
    "Mỗi ngày cậu đến đây để chia sẻ đã là một hành động dũng cảm rồi! 🌟",
    "Nhớ nhé: tiến bộ không cần phải hoàn hảo. Chậm mà chắc vẫn là tiến bộ!",
    "Cậu đang làm rất tốt — dù có những lúc khó khăn. Tớ tự hào về cậu đấy!",
    "Đừng bỏ cuộc. Những ngày khó khăn nhất thường là những ngày cậu lớn lên nhiều nhất.",
    "Cậu đã vượt qua được những thử thách trước đây rồi — và cậu sẽ vượt qua cái này nữa.",
  ],

  anxiety: [
    "Lo âu là tín hiệu của bộ não đang cố bảo vệ cậu — dù đôi khi nó hơi quá mức. 😊",
    "Khi lo lắng, hãy tự hỏi: 'Điều tệ nhất có thể xảy ra là gì? Và nếu xảy ra, tớ có thể đối phó không?'",
    "Thở chậm và sâu là cách nhanh nhất để xoa dịu hệ thần kinh khi lo âu đó cậu.",
    "Lo âu không định nghĩa cậu. Đó chỉ là một trạng thái tạm thời mà thôi.",
    "Đôi khi chỉ cần đặt tên cho nỗi lo — 'tớ đang lo về X' — là cảm giác đã nhẹ hơn một chút.",
  ],

  default: [
    "Cảm ơn cậu đã chia sẻ với tớ. Cậu có thể kể thêm không?",
    "Tớ đang lắng nghe cậu. Cậu muốn nói thêm điều gì không?",
    "Tớ hiểu rồi. Dạo này cậu thấy thế nào về tổng thể?",
    "Ừ, tớ đang ở đây với cậu. Cứ tâm sự thoải mái nhé.",
    "Cậu cảm thấy điều đó như thế nào trong cuộc sống hằng ngày?",
    "Tớ nghe thấy cậu. Điều gì đang chiếm nhiều năng lượng của cậu nhất lúc này?",
    "Hãy cứ nói tiếp đi — tớ đang lắng nghe mà không phán xét gì hết.",
  ],

  // Stage-specific responses for dialog tree
  stage_stress:      ["Tớ hiểu. Căng thẳng có thể đến từ rất nhiều nguồn. Gần đây cậu đang bị áp lực từ điều gì nhiều nhất — học tập, công việc, hay mối quan hệ?",
                      "Cậu đang cảm thấy bị áp đảo à? Điều đó nghe nặng nề lắm. Hãy kể thêm cho tớ nghe nhé.",
                      "Khi cậu nói căng thẳng, cậu cảm thấy điều đó ở đâu trong cơ thể mình? Đầu, ngực, hay bụng?"],
  stage_mood:        ["Tâm trạng cậu gần đây lên xuống thất thường à? Tớ muốn hiểu hơn — có điều gì cụ thể nào đang kéo cậu xuống không?",
                      "Cảm xúc dao động là điều rất bình thường. Nhưng nếu nó xảy ra thường xuyên, chúng ta nên chú ý hơn. Cậu thấy thế nào khi ngủ dậy?",
                      "Tớ đang lắng nghe. Trong những lúc tâm trạng tệ nhất, cậu thường nghĩ đến điều gì?"],
  stage_sleep:       ["Giấc ngủ của cậu đang gặp vấn đề à? Cậu khó đi vào giấc ngủ, hay hay thức dậy giữa đêm, hay ngủ không sâu?",
                      "Mất ngủ thực sự mệt mỏi lắm — không chỉ thể xác mà còn cả tinh thần. Gần đây cậu ngủ được mấy tiếng mỗi đêm?"],
  stage_relationship:["Mối quan hệ nào đang khiến cậu trăn trở — bạn bè, gia đình, hay người thân thiết?",
                      "Những tổn thương trong các mối quan hệ thường rất sâu. Cậu có muốn kể tớ nghe chuyện gì đang xảy ra không?"],
  stage_selftalk:    ["Cách cậu nói chuyện với bản thân rất quan trọng đó. Cậu có hay tự trách mình không?",
                      "Tớ muốn hỏi: Nếu một người bạn của cậu đang trải qua những gì cậu đang trải qua, cậu sẽ nói gì với họ?"],
  stage_motivation:  ["Mất động lực đôi khi là dấu hiệu của kiệt sức. Cậu còn tìm thấy niềm vui trong những thứ cậu từng thích không?",
                      "Cảm giác không muốn làm gì có thể rất khó chịu. Dạo gần đây có điều gì thay đổi trong cuộc sống của cậu không?"],
};

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getRandomResponse(userText = "", aspectId = null) {
  const t = (userText || "").toLowerCase();

  // Stage-specific responses (when coming from dialog tree)
  if (aspectId) {
    const key = `stage_${aspectId}`;
    if (R[key]) return pickRandom(R[key]);
  }

  // Keyword matching — order matters (most specific first)
  if (/tự tử|muốn chết|không muốn sống|tự làm đau|làm hại bản thân/.test(t)) {
    return "Tớ rất lo khi nghe điều này. Cậu đang an toàn chứ? Hãy nói chuyện với người thân tin tưởng nhất ngay bây giờ, hoặc gọi đường dây hỗ trợ tâm lý 1800 599 920 (miễn phí). Tớ ở đây với cậu.";
  }
  if (/căng thẳng|stress|áp lực|quá tải|kiệt sức|burn.?out|overwhelm/.test(t)) return pickRandom(R.stress);
  if (/lo âu|lo lắng|sợ hãi|hoảng loạn|anxiety|panic/.test(t)) return pickRandom(R.anxiety);
  if (/buồn|khóc|đau|chán|tệ|tồi|không ổn|thất vọng|nản lòng|mệt mỏi tinh thần/.test(t)) return pickRandom(R.sad);
  if (/ngủ|mất ngủ|thức khuya|không ngủ được|khó ngủ|insomnia/.test(t)) return pickRandom(R.sleep);
  if (/bạn bè|tình bạn|người yêu|yêu|chia tay|mối quan hệ|bạn trai|bạn gái|hẹn hò/.test(t)) return pickRandom(R.relationship);
  if (/học|thi|điểm|trường|thầy|cô|bài|môn|đại học|tốt nghiệp/.test(t)) return pickRandom(R.academic);
  if (/gia đình|bố|mẹ|anh|chị|em|ba|má|con cái|bố mẹ/.test(t)) return pickRandom(R.family);
  if (/cô đơn|một mình|lạc lõng|không ai|không có ai|external/.test(t)) return pickRandom(R.loneliness);
  if (/vui|hạnh phúc|tốt|ổn|khỏe|tuyệt|tích cực|phấn khích|excited/.test(t)) return pickRandom(R.positive);
  if (/động lực|cảm hứng|mất hứng|không muốn|lười/.test(t)) return pickRandom(R.motivation);

  // Short messages → ask follow-up question
  if (userText.length < 20) return pickRandom(R.question);

  // Default: alternate empathy + question
  const pool = [...R.empathy.slice(0, 3), ...R.question.slice(0, 3)];
  return pickRandom(pool);
}

export function needsAI(userText = "") {
  const t = userText.toLowerCase();
  // Use AI only for: crisis, complex clinical questions, or very long messages
  if (/tự tử|muốn chết|không muốn sống/.test(t)) return true;
  if (/phq|gad|trầm cảm nặng|lo âu nặng|rối loạn|tâm thần|lâm sàng|điều trị|thuốc|bác sĩ/.test(t)) return true;
  if (userText.length > 120) return true;
  return false;
}
