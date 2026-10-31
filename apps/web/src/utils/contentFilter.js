// Từ điển các từ viết tắt, teencode, hoặc từ ngữ thiếu trang trọng
const unprofessionalWords = [
  "ko", "k", "khong", "dc", "đc", "đk", "vs", "ntn", "rùi", "thui", "ms", 
  "lun", "bít", "mik", "mún", "hok", "đx", "j", "hj", "chx", "bh", "hnay",
  "ib", "inbox", "rep", "alo", "như nào", "giá bn", "nhiêu", "giá sao"
];

// Các từ khóa mặc cả, rẻ rúng, hoặc thiếu nghiêm túc
const bargainWords = [
  "giá rẻ", "làm free", "miễn phí", "bớt giá", "giảm giá", "bớt đi", 
  "sale", "phá giá", "rẻ hơn", "rẻ ko", "làm giúp", "làm hộ", "free"
];

// Hàm tự động viết hoa chữ cái đầu tiên (chỉ hỗ trợ làm đẹp câu, không sửa từ lóng)
export const formatMessage = (text) => {
  if (!text) return text;
  let formatted = text;
  try {
    formatted = formatted.replace(/(^\s*|[.!?]\s+)([\p{L}])/gu, (match, prefix, letter) => {
      return prefix + letter.toUpperCase();
    });
  } catch (e) {
    console.warn("Regex unicode support failed", e);
  }
  return formatted;
};

export const validateMessageContent = (message, t, projectType) => {
  // 1. Minimum Effort Check: Nếu có nhắn, phải thể hiện sự nghiêm túc
  if (projectType !== "bio") {
    if (message && message.trim() !== "") {
      const wordCount = message.trim().split(/\s+/).length;
      if (wordCount < 4 || message.trim().length < 15) {
        return {
          isValid: false,
          errorMessage: t ? t("bookingPage.toast.tooShort", "Mô tả dự án quá ngắn. Vui lòng cung cấp thêm thông tin chi tiết và chuyên nghiệp hơn.") : "Mô tả dự án quá ngắn. Vui lòng cung cấp thêm thông tin chi tiết và chuyên nghiệp hơn.",
          fixedMessage: message
        };
      }
    } else {
      // Nếu trống thì cho qua (có thể họ không cần note thêm), hoặc nếu bạn muốn bắt buộc thì đổi ở form
      return { isValid: true, fixedMessage: message };
    }
  } else {
    if (!message || message.trim() === "") {
      return { isValid: true, fixedMessage: message };
    }
  }

  const fixedMessage = formatMessage(message);
  const text = fixedMessage.toLowerCase();
  const textWithoutUrls = text.replace(/https?:\/\/[^\s]+/g, '');

  // 2. Bộ lọc Teencode & Ngôn ngữ kém chuyên nghiệp (Gatekeeper)
  // Nếu bắt được chữ lóng -> Reject thẳng, không tự sửa
  try {
    const teencodeRegex = new RegExp(`(^|[^\\p{L}])(${unprofessionalWords.join('|')})(?=[^\\p{L}]|$)`, 'giu');
    if (teencodeRegex.test(textWithoutUrls)) {
      return {
        isValid: false,
        errorMessage: t ? t("bookingPage.toast.unprofessional", "Vui lòng sử dụng ngôn ngữ chuyên nghiệp, không dùng từ viết tắt hoặc teencode trong văn bản công việc.") : "Vui lòng sử dụng ngôn ngữ chuyên nghiệp, không dùng từ viết tắt hoặc teencode trong văn bản công việc.",
        fixedMessage
      };
    }
  } catch (e) {
    console.warn("Regex check failed", e);
  }

  // 3. Bộ lọc Khách hàng không phù hợp (Mặc cả, xin xỏ)
  // Lưu ý: Có thể loại trừ nếu projectType là "student" vì sinh viên hay nhắc đến giá/miễn phí, 
  // nhưng nếu là doanh nghiệp (newWebsite, improve, portfolio) thì cực kỳ khắt khe.
  // Profile bio cũng không nên kiểm tra mặc cả.
  if (projectType !== "student" && projectType !== "bio") {
    const bargainRegex = new RegExp(`\\b(${bargainWords.join('|')})\\b`, 'i');
    if (bargainRegex.test(textWithoutUrls)) {
      return {
        isValid: false,
        errorMessage: t ? t("bookingPage.toast.bargainError", "Nội dung chứa từ khóa không phù hợp với tiêu chí và tệp khách hàng của studio. Vui lòng điều chỉnh lại.") : "Nội dung chứa từ khóa không phù hợp với tiêu chí và tệp khách hàng của studio. Vui lòng điều chỉnh lại.",
        fixedMessage
      };
    }
  }

  // 4. Community Guidelines - Profanity in 3 languages
  const viProfanity = [
    "đụ", "đũ", "đù", "cặc", "lồn", "buồi", "đĩ", "điếm", "đéo", "địt", 
    "chó đẻ", "mẹ mày", "thằng chó", "con chó", "ngu lồn", "vãi lồn", "vcl", "dcm", "đcm", "đm", "vkl"
  ];
  
  const enProfanity = [
    "fuck", "shit", "bitch", "cunt", "asshole", "nigger", "nigga", "slut", 
    "whore", "faggot", "dick", "pussy", "motherfucker", "bastard"
  ];

  const zhProfanity = [
    "操", "肏", "傻逼", "妈的", "他妈", "干你娘", "屌", "贱人", "婊子", "鸡巴"
  ];
  
  const profanityRegex = new RegExp(`\\b(${[...viProfanity, ...enProfanity].join('|')})\\b|${zhProfanity.join('|')}`, 'i');
  if (profanityRegex.test(textWithoutUrls)) {
    return {
      isValid: false,
      errorMessage: t ? t("bookingPage.toast.profanityError", "Ngôn từ của bạn vi phạm tiêu chuẩn cộng đồng.") : "Ngôn từ của bạn vi phạm tiêu chuẩn cộng đồng.",
      fixedMessage
    };
  }

  // 5. EQ Filter (Emotional Quotient) - Detect aggressive, demanding, or disrespectful behavior
  const lowEqPatterns = [
    "làm ngay", "nhanh lên", "phải làm", "bố mày", "chết đi",
    "do it now", "hurry up", "you must", "stupid", "idiot", "useless",
    "给我做", "马上", "立刻"
  ];

  const lowEqRegex = new RegExp(`\\b(${lowEqPatterns.join('|')})\\b`, 'i');
  const isAllUpperCase = message === message.toUpperCase() && message.length > 15 && /[A-Z]/.test(message);
  const excessivePunctuation = /[!?]{4,}/.test(message);

  if (lowEqRegex.test(textWithoutUrls) || isAllUpperCase || excessivePunctuation) {
    return {
      isValid: false,
      errorMessage: t ? t("bookingPage.toast.lowEqError", "Thái độ và cách giao tiếp không phù hợp với văn hóa làm việc của chúng tôi.") : "Thái độ và cách giao tiếp không phù hợp với văn hóa làm việc của chúng tôi.",
      fixedMessage
    };
  }

  // 6. IQ Filter (Intelligence Quotient) - Detect gibberish, spam, or nonsense
  const hasNoSpaces = textWithoutUrls.length > 25 && !/\s/.test(textWithoutUrls); 
  const hasTooManyConsonants = /[bcdfghjklmnpqrstvwxz]{7,}/.test(textWithoutUrls);
  const excessiveRepetition = /(.)\1{6,}/.test(text); 

  if (hasNoSpaces || hasTooManyConsonants || excessiveRepetition) {
    return {
      isValid: false,
      errorMessage: t ? t("bookingPage.toast.lowIqError", "Nội dung không hợp lệ hoặc chứa các ký tự vô nghĩa (Spam).") : "Nội dung không hợp lệ hoặc chứa các ký tự vô nghĩa (Spam).",
      fixedMessage
    };
  }

  return { isValid: true, fixedMessage };
};
