/**
 * Local Intent Classifier for "Bạn Học Đường"
 * Computes client-side string similarity using the Sørensen-Dice coefficient (character bigrams)
 * normalized for accented and de-accented Vietnamese text.
 * Integrates user profile (`bio`) and historical test scores (`historyLogs`) to construct dynamic responses.
 */

// Helper to isolate user's friendly name (first name)
function getFriendlyName(bio) {
  if (!bio?.displayName) return "cậu";
  const parts = bio.displayName.trim().split(" ");
  return parts[parts.length - 1]; // get first name
}

// Convert scores to Vietnamese clinical severity text
function getPhq9SeverityVi(score) {
  if (score <= 4) return "tối thiểu (bình thường)";
  if (score <= 9) return "nhẹ";
  if (score <= 14) return "trung bình";
  if (score <= 19) return "trung bình nặng";
  return "nghiêm trọng";
}

function getGad7SeverityVi(score) {
  if (score <= 4) return "tối thiểu (bình thường)";
  if (score <= 9) return "nhẹ";
  if (score <= 14) return "trung bình";
  return "nghiêm trọng";
}

// Helper to remove accents/diacritics from Vietnamese strings for robust matching
export function removeVietnameseTones(str) {
  if (!str) return "";
  let result = str.toLowerCase();
  result = result.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  result = result.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  result = result.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  result = result.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  result = result.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  result = result.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  result = result.replace(/đ/g, "d");
  
  // Normalize character composition NFD and strip combining diacritic marks
  result = result.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return result;
}

// Calculate Sørensen-Dice coefficient similarity between two strings
export function getDiceSimilarity(str1, str2) {
  const getBigrams = (str) => {
    const bigrams = new Set();
    for (let i = 0; i < str.length - 1; i++) {
      bigrams.add(str.substring(i, i + 2));
    }
    return bigrams;
  };

  const clean = (s) => (s || "").toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").replace(/\s+/g, " ").trim();
  const s1 = clean(str1);
  const s2 = clean(str2);
  
  if (s1 === s2) return 1.0;
  if (s1.length < 2 || s2.length < 2) return 0.0;

  const b1 = getBigrams(s1);
  const b2 = getBigrams(s2);
  
  let intersection = 0;
  for (const bigram of b1) {
    if (b2.has(bigram)) intersection++;
  }
  
  return (2.0 * intersection) / (b1.size + b2.size);
}

// Get the maximum similarity score considering both accented and unaccented variations
export function getSimilarityScore(s1, s2) {
  const scoreAccented = getDiceSimilarity(s1, s2);
  const scoreUnaccented = getDiceSimilarity(removeVietnameseTones(s1), removeVietnameseTones(s2));
  return Math.max(scoreAccented, scoreUnaccented);
}

// Database of local intents, patterns, and dynamic response generators
export const INTENT_DATABASE = [
  {
    id: "greeting",
    tier: "free",
    patterns: [
      "chào cậu",
      "chào bạn",
      "hello",
      "hi",
      "xin chào",
      "chào bot",
      "chào bạn học đường",
      "chào chuyên viên",
      "chào nha",
      "helo cậu",
      "helo",
      "lo cau"
    ],
    generateResponse: (bio, historyLogs) => {
      const name = getFriendlyName(bio);
      const checkins = (historyLogs || []).filter(l => l.type === "checkin" && l.mood);
      
      // Calculate active checkin streak (today or yesterday)
      let streak = 0;
      const days = new Set(checkins.map(c => new Date(c.date).toDateString()));
      let dateCursor = new Date();
      if (!days.has(dateCursor.toDateString())) {
        dateCursor.setDate(dateCursor.getDate() - 1);
      }
      while (days.has(dateCursor.toDateString())) {
        streak++;
        dateCursor.setDate(dateCursor.getDate() - 1);
      }

      if (streak > 1) {
        return `Chào ${name}! Thật vui vì thấy cậu vẫn bền bỉ quay lại đồng hành cùng tớ liên tục ${streak} ngày qua. Hôm nay của cậu thế nào rồi? Cứ chia sẻ với tớ nhé.`;
      }
      if (checkins.length > 0) {
        const latest = checkins[checkins.length - 1];
        if (latest.mood <= 2) {
          return `Chào ${name}. Tớ nhớ trong lần check-in cảm xúc gần nhất, lòng cậu có chút trĩu nặng. Hiện tại cậu đã thấy dễ thở hơn chút nào chưa?`;
        }
      }
      return `Chào ${name}! 😊 Tớ luôn ở đây để lắng nghe cậu. Hôm nay của cậu thế nào? Cậu có chuyện gì vui hay bận tâm muốn chia sẻ với tớ không?`;
    }
  },
  {
    id: "goodbye",
    tier: "free",
    patterns: [
      "tạm biệt",
      "bye",
      "bye bye",
      "hẹn gặp lại",
      "tớ đi ngủ đây",
      "tớ đi học đây",
      "tạm biệt cậu nhé",
      "tớ offline đây"
    ],
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return `Tạm biệt ${name} nhé! Hãy cho bản thân được nghỉ ngơi thoải mái và hồi phục năng lượng. Khi nào cần, tớ luôn ở đây cùng cậu.`;
    }
  },
  {
    id: "identity",
    tier: "paid",
    patterns: [
      "cậu là ai",
      "bạn là ai",
      "tên cậu là gì",
      "bạn học đường là ai",
      "đây là bot gì",
      "giới thiệu bản thân",
      "cậu tên gì",
      "bạn tên gì",
      "cậu là bot hay người"
    ],
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return `Tớ là Bạn Học Đường, một chuyên viên đồng hành AI được thiết kế riêng để lắng nghe tâm tư, nâng cao nhận thức cảm xúc và luôn đồng hành cùng ${name} trong hành trình học tập cũng như chăm sóc sức khỏe tinh thần. 🌸`;
    }
  },
  {
    id: "features",
    tier: "paid",
    patterns: [
      "cậu có thể làm gì",
      "tính năng của ứng dụng",
      "hướng dẫn sử dụng",
      "giúp tớ thế nào",
      "tính năng trị liệu là gì",
      "ứng dụng này giúp gì cho tớ",
      "bot này làm được gì",
      "chức năng của cậu là gì",
      "tính năng của app"
    ],
    generateResponse: () => {
      return `Tớ có các công cụ giúp cậu tự điều hòa cảm xúc: Hít Thở 4-7-8 làm dịu căng thẳng tức thì, Thư Giãn Cơ Sâu (PMR) xoa dịu cơ thể gồng cứng do stress, Âm Thanh Thiên Nhiên giúp tăng sự tập trung hoặc dễ ngủ, và các bài trắc nghiệm tâm lý lâm sàng (PHQ-9, GAD-7) để theo dõi trạng thái. Cậu có thể chọn tab 'Trị Liệu' hoặc 'Đánh Giá' để bắt đầu khám phá nhé!`;
    }
  },
  {
    id: "academic_stress",
    tier: "paid",
    patterns: [
      "áp lực học tập",
      "học hành mệt mỏi",
      "sợ thi rớt",
      "học không vào",
      "áp lực điểm số",
      "căng thẳng vì học hành",
      "áp lực thi cử",
      "stress học tập",
      "mệt mỏi vì thi cử"
    ],
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return `Áp lực học tập và thi cử quả thực có thể khiến não bộ của ${name} bị quá tải nhận thức (cognitive overload), dẫn đến kiệt sức và mất phương hướng. Về mặt tâm lý học, điểm số chỉ phản ánh hiệu suất nhất thời chứ không định nghĩa giá trị con người cậu. Hãy thử chia nhỏ bài tập, thực hành thở 4-7-8 để giảm cortisol (hormone stress) và nhớ ngủ đủ giấc nhé. Suy nghĩ tự chỉ trích (negative self-talk) nào đang đè nặng lên cậu nhất lúc này?`;
    }
  },
  {
    id: "sleep",
    tier: "paid",
    patterns: [
      "tớ bị mất ngủ",
      "khó ngủ quá",
      "làm sao để ngủ ngon",
      "không ngủ được",
      "thức khuya quá",
      "mẹo ngủ ngon",
      "làm sao ngủ ngon",
      "mất ngủ kéo dài"
    ],
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return `Mất ngủ thường phản ánh trạng thái 'quá kích thích' (hyperarousal) của hệ thần kinh, khi não bộ của ${name} vẫn đang cố xử lý các lo âu ban ngày lúc đang cần thư giãn. Cậu hãy thử áp dụng vệ sinh giấc ngủ: không dùng điện thoại trước khi ngủ 30 phút, giữ phòng tối mát và nghe tiếng mưa rơi/nhạc thiền ở tab 'Trị Liệu'. Hôm nay cậu đã ngủ được mấy tiếng rồi?`;
    }
  },
  {
    id: "anxiety",
    tier: "paid",
    patterns: [
      "tớ thấy lo lắng",
      "bị lo âu quá",
      "hoảng sợ",
      "lo sợ mọi thứ",
      "cảm thấy bồn chồn",
      "lo âu nặng",
      "làm sao hết lo âu",
      "tớ lo sợ quá"
    ],
    generateResponse: (bio, historyLogs) => {
      const name = getFriendlyName(bio);
      const gad7Logs = (historyLogs || []).filter(l => l.test === "gad7");
      if (gad7Logs.length > 0) {
        const latest = gad7Logs[gad7Logs.length - 1];
        const dateStr = new Date(latest.date).toLocaleDateString("vi-VN");
        const severity = getGad7SeverityVi(latest.score);
        return `Dựa trên kết quả test GAD-7 gần nhất của cậu vào ngày ${dateStr} với số điểm ${latest.score}/21, tớ biết mức độ lo âu của ${name} đang ở ngưỡng ${severity}. Về mặt tâm lý, lo âu là phản ứng tự nhiên để bảo vệ cậu trước mối nguy hiểm, nhưng đôi khi hệ thần kinh bị báo động quá mức. Hãy thử ôm nhận (mindful acceptance) cảm giác bồn chồn này mà không phán xét. Hãy thở sâu 4-7-8 cùng tớ nhé.`;
      }
      return `Cơn lo âu (anxiety) giống như một cơn bão đi qua cơ thể, làm tim ${name} đập nhanh và suy nghĩ dồn dập. Hãy cùng tớ neo đậu lại hiện tại bằng cách hít thở thật sâu. Cậu cảm thấy cơ thể mình đang gồng cứng hay bồn chồn ở vùng nào nhất lúc này?`;
    }
  },
  {
    id: "sadness",
    tier: "paid",
    patterns: [
      "tớ buồn quá",
      "chán nản mọi thứ",
      "thấy mệt mỏi buồn bã",
      "muốn khóc",
      "tâm trạng tồi tệ",
      "tâm trạng đi xuống",
      "tớ thấy buồn",
      "buồn chán quá"
    ],
    generateResponse: (bio, historyLogs) => {
      const name = getFriendlyName(bio);
      const phq9Logs = (historyLogs || []).filter(l => l.test === "phq9");
      if (phq9Logs.length > 0) {
        const latest = phq9Logs[phq9Logs.length - 1];
        const dateStr = new Date(latest.date).toLocaleDateString("vi-VN");
        const severity = getPhq9SeverityVi(latest.score);
        return `Tớ nhớ bài test PHQ-9 gần nhất của cậu vào ngày ${dateStr} đạt ${latest.score}/27 điểm, phản ánh trạng thái trầm cảm của ${name} đang ở ngưỡng ${severity}. Nỗi buồn là một tín hiệu cho thấy tâm hồn cậu đang quá tải và cần được phục hồi. Đừng ép bản thân phải tỏ ra mạnh mẽ. Cậu muốn chia sẻ điều gì đang làm cậu thấy bế tắc nhất hôm nay không?`;
      }
      return `Nỗi buồn không định nghĩa con người cậu, ${name} ạ. Đó chỉ là một phản ứng tự nhiên của tâm trí khi mỏi mệt. Hãy cho phép bản thân được ôm lấy nỗi buồn này một cách dịu dàng (self-compassion). Cậu có muốn viết hết những suy nghĩ đó ra ở bài 'Viết Tự Do' trong tab Trị liệu không?`;
    }
  },
  {
    id: "crisis",
    tier: "free",
    patterns: [
      "tớ muốn tự tử",
      "muốn chết",
      "không muốn sống nữa",
      "tự tử ở đâu",
      "làm hại bản thân",
      "muốn kết liễu đời mình",
      "muốn tự sát"
    ],
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return `${name} ơi, tớ nghe thấy nỗi đau đớn tột cùng của cậu lúc này. Xin cậu hãy nhớ rằng cậu cực kỳ quan trọng và không cô đơn. Hãy gọi ngay 115 (Cấp cứu) hoặc đường dây nóng tư vấn tâm lý khẩn cấp 1800 599 920. Cậu cũng có thể liên hệ với người thân hoặc bất kỳ ai cậu tin tưởng nhất để họ ở bên cậu ngay lúc này nhé. Tớ luôn ở đây mong cậu an toàn.`;
    }
  },
  {
    id: "clinical_tests",
    tier: "paid",
    patterns: [
      "test trầm cảm",
      "test lo âu",
      "kiểm tra sức khỏe tinh thần",
      "bài test phq9",
      "bài test gad7",
      "trắc nghiệm tâm lý",
      "kiểm tra trầm cảm",
      "làm bài test",
      "bài trắc nghiệm tâm lý"
    ],
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return `Việc thực hiện các bài đánh giá chuẩn lâm sàng (như PHQ-9 cho trầm cảm, GAD-7 cho lo âu) là bước đầu tiên để ${name} tự nhận thức rõ ràng (self-awareness) tình trạng của mình thay vì mơ hồ lo sợ. Cậu hãy chuyển sang tab 'Đánh Giá' để làm trắc nghiệm nhé, tớ sẽ lưu kết quả để theo dõi tiến triển cho cậu.`;
    },
    suggestPhq9: true,
    suggestGad7: true
  },
  {
    id: "gratitude",
    tier: "free",
    patterns: [
      "cảm ơn cậu",
      "thank you",
      "cảm ơn bạn học đường",
      "bot dễ thương quá",
      "cảm ơn chuyên viên",
      "cậu tốt quá",
      "bot hữu ích quá",
      "cảm ơn bot"
    ],
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return `Tớ rất trân trọng sự tin tưởng và những chia sẻ chân thành của ${name}. Đồng hành cùng cậu trên hành trình tự nhận thức và chữa lành là ý nghĩa của sự tồn tại của tớ. Chúc cậu một ngày thật nhẹ nhàng nhé! 😊`;
    }
  },
  {
    id: "positive",
    tier: "free",
    patterns: [
      "tớ thấy vui",
      "hôm nay rất vui",
      "mọi thứ tốt",
      "tớ thấy ổn",
      "tớ rất khỏe",
      "tâm trạng tốt",
      "ngày hôm nay tuyệt vời",
      "tớ thấy hạnh phúc",
      "moi thu on"
    ],
    generateResponse: (bio) => {
      const name = getFriendlyName(bio);
      return `Thật tuyệt vời khi thấy ${name} có một ngày tích cực như vậy! Hãy lưu giữ cảm giác dễ chịu này nhé. Hôm nay có điều gì cụ thể đã đem lại niềm vui cho cậu thế?`;
    }
  },
  {
    id: "test_inventory",
    tier: "paid",
    patterns: [
      "bạn có bao nhiêu bài test",
      "có những bài test gì",
      "danh sách bài test",
      "ứng dụng có mấy bài trắc nghiệm",
      "các bài kiểm tra tâm lý",
      "test tâm lý gồm những gì",
      "có bao nhiêu bài trắc nghiệm"
    ],
    generateResponse: () => {
      return `Hệ thống hiện có 4 bài đánh giá tâm lý chuẩn lâm sàng: **DASS-21/DASS-42** (tổng quan Trầm cảm - Lo âu - Căng thẳng), **MMPI** (chuyên sâu các rối loạn tâm lý lâm sàng), **PHQ-9** (chuyên sâu mức độ Trầm cảm) và **GAD-7** (chuyên sâu mức độ Lo âu). Cậu hãy chia sẻ tình trạng hiện tại của mình với tớ, tớ sẽ gợi ý bài phù hợp nhất, hoặc cậu có thể vào tab 'Đánh Giá' để chọn làm trực tiếp nhé!`;
    }
  },
  {
    id: "therapy_catalog",
    tier: "paid",
    patterns: [
      "có liệu pháp gì",
      "trị liệu gồm những gì",
      "các liệu pháp tự chữa lành",
      "hướng dẫn dùng liệu pháp",
      "tớ nên dùng liệu pháp nào"
    ],
    generateResponse: () => {
      return `Tớ có 4 liệu pháp tự chữa lành chính: **Điều hòa nhịp thở 4-7-8** (làm dịu hệ thần kinh ngay lập tức, hợp với lo âu/mất ngủ), **Ngồi Tĩnh Tâm** (thiền chánh niệm, hợp với căng thẳng/suy nghĩ dồn dập), **Trị liệu Trầm cảm (CBT)** (tái cấu trúc suy nghĩ tiêu cực) và **Đọc sách Trị liệu** (chiêm nghiệm, phù hợp khi muốn phát triển bản thân). Ngoài ra còn vài liệu pháp AI cá nhân hoá cao cấp có thể mở khoá bằng JOY. Cậu vào tab 'Trị Liệu' để khám phá chi tiết nhé!`;
    }
  },
  {
    id: "pricing_package",
    tier: "paid",
    patterns: [
      "gói cước giá bao nhiêu",
      "làm sao mua gói",
      "cách hủy gói",
      "cách đổi gói",
      "gói nào phù hợp với tớ",
      "phí dịch vụ là bao nhiêu",
      "có mất phí không"
    ],
    generateResponse: () => {
      return `Thông tin chi tiết về giá và các gói đồng hành hiện có, cậu xem trực tiếp ở tab 'Quản lý' trong Cổng thành viên nhé — ở đó có đầy đủ mô tả từng gói và nút kích hoạt/đổi gói. Nếu cậu mô tả tình trạng của mình, tớ có thể gợi ý gói phù hợp; còn việc thanh toán/hủy gói thì tab 'Quản lý' sẽ xử lý chính xác và cập nhật nhất.`;
    }
  },
  {
    id: "joy_currency",
    tier: "paid",
    patterns: [
      "joy là gì",
      "làm sao có joy",
      "joy dùng để làm gì",
      "kiếm joy thế nào",
      "joy là tiền gì"
    ],
    generateResponse: () => {
      return `JOY là đồng tiền nội bộ của hệ thống. Cậu kiếm JOY bằng cách giới thiệu bạn bè (referral) hoặc đổi từ quà tặng/gift card. JOY dùng để mở khoá các liệu pháp AI cá nhân hoá cao cấp hoặc mua vật phẩm trong Cửa hàng tiện ích (ví dụ thêm token chat). Cậu xem chi tiết số dư và lịch sử ở tab 'JOY' trong Cổng thành viên nhé!`;
    }
  },
  {
    id: "token_limit",
    tier: "paid",
    patterns: [
      "mỗi ngày chat được mấy lần",
      "hết token thì sao",
      "token chat là gì",
      "tại sao bị trừ token",
      "khi nào token được làm mới"
    ],
    generateResponse: () => {
      return `Mỗi ngày cậu có 10 token để trò chuyện cùng tớ. Những lời chào hỏi, cảm ơn hay tâm sự thuần cảm xúc thì hoàn toàn miễn phí. Khi cậu hỏi một câu hỏi cụ thể, nếu tớ trả lời được ngay bằng kiến thức có sẵn thì chỉ tốn 1 token, còn nếu cần tớ suy nghĩ sâu và trò chuyện đầy đủ thì tốn 3 token. Token sẽ làm mới vào ngày mới, hoặc cậu có thể dùng JOY mua thêm ở Cửa hàng tiện ích nếu cần dùng ngay.`;
    }
  },
  {
    id: "about_creator",
    tier: "paid",
    patterns: [
      "ai tạo ra app này",
      "hugo studio là gì",
      "đội ngũ phát triển là ai",
      "app này của ai"
    ],
    generateResponse: () => {
      return `Tớ được Hugo Studio xây dựng và huấn luyện, với mục tiêu trở thành người bạn đồng hành sức khỏe tâm lý học đường cho học sinh, sinh viên Việt Nam. Tớ luôn được cải tiến để lắng nghe và hỗ trợ cậu tốt hơn mỗi ngày!`;
    }
  },
  {
    id: "data_privacy",
    tier: "paid",
    patterns: [
      "dữ liệu của tớ có an toàn không",
      "ai xem được tin nhắn của tớ",
      "thông tin có bị lộ không",
      "có ai đọc được tâm sự của tớ không"
    ],
    generateResponse: () => {
      return `Mọi tâm sự và dữ liệu hồ sơ của cậu được lưu trữ bảo mật trên hệ thống và chỉ được dùng để tớ cá nhân hoá hỗ trợ cậu tốt hơn — không chia sẻ cho bên thứ ba. Cậu có thể hoàn toàn yên tâm chia sẻ thật lòng với tớ nhé.`;
    }
  },
  {
    id: "support_contact",
    tier: "paid",
    patterns: [
      "liên hệ hỗ trợ thế nào",
      "báo lỗi ở đâu",
      "gặp vấn đề kỹ thuật thì sao",
      "tớ muốn gặp nhân viên hỗ trợ"
    ],
    generateResponse: () => {
      return `Nếu cậu gặp vấn đề kỹ thuật hoặc cần hỗ trợ trực tiếp từ con người, cậu hãy dùng khung chat hỗ trợ (biểu tượng trợ lý) ở trang chủ hoặc mục liên hệ trong tài khoản — đội ngũ Hugo Studio sẽ phản hồi sớm cho cậu. Còn nếu là chuyện tâm lý, tớ luôn ở đây lắng nghe cậu trước nhé!`;
    }
  }
];

// Main function to check input against database. Returns matched object with reply if similarity >= 0.8
export function findMatchingIntent(userText, bio, historyLogs = []) {
  if (!userText) return null;
  const text = userText.trim();
  if (text.length === 0) return null;

  let bestMatch = null;
  let highestScore = 0;

  for (const intent of INTENT_DATABASE) {
    for (const pattern of intent.patterns) {
      const score = getSimilarityScore(text, pattern);
      if (score > highestScore) {
        highestScore = score;
        bestMatch = intent;
      }
    }
  }

  // Exact matching keyword fallback for safety (e.g. self-harm / crisis keywords)
  const cleanText = removeVietnameseTones(text);
  if (/tu tu|muon chet|khong muon song|tu lam dau|lam hai ban than/.test(cleanText)) {
    const crisisIntent = INTENT_DATABASE.find(i => i.id === "crisis");
    if (crisisIntent) {
      return {
        reply: crisisIntent.generateResponse(bio, historyLogs),
        id: "crisis",
        tier: "free",
        companionUpdate: {
          newLog: { date: new Date().toISOString(), type: "checkin", mood: 1, note: "Crisis matched locally" }
        }
      };
    }
  }

  // If match similarity is >= 80% (0.8)
  if (highestScore >= 0.8 && bestMatch) {
    const replyText = bestMatch.generateResponse(bio, historyLogs);
    
    // Automatically harvest and log user emotional status based on the matched intent
    let companionUpdate = null;
    if (bestMatch.id === "sadness") {
      companionUpdate = { newLog: { date: new Date().toISOString(), type: "checkin", mood: 2, note: "Local intent: Sadness" } };
    } else if (bestMatch.id === "anxiety") {
      companionUpdate = { newLog: { date: new Date().toISOString(), type: "checkin", mood: 2, note: "Local intent: Anxiety" } };
    } else if (bestMatch.id === "academic_stress") {
      companionUpdate = { newLog: { date: new Date().toISOString(), type: "checkin", mood: 2, note: "Local intent: Academic Stress" } };
    } else if (bestMatch.id === "positive") {
      companionUpdate = { newLog: { date: new Date().toISOString(), type: "checkin", mood: 4, note: "Local intent: Positive" } };
    }

    return {
      reply: replyText,
      id: bestMatch.id,
      tier: bestMatch.tier || "paid",
      suggestPhq9: bestMatch.suggestPhq9 || false,
      suggestGad7: bestMatch.suggestGad7 || false,
      companionUpdate
    };
  }

  return null;
}
