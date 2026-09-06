// Mẫu câu cốt lõi (句型) để DẠY ĐẶT CÂU. Giải thích bằng tiếng Việt (để học
// được), ví dụ bằng chữ Hán + pinyin. Không phải icon — là học liệu.
// structure: khung câu; vi: công dụng; example: {zh, py, vi}.
export const SENTENCE_PATTERNS = [
  {
    id: "shi", name: "A 是 B", structure: "A + 是 + B",
    vi: "A là B — câu khẳng định danh tính/loại. 是 KHÔNG dùng trước tính từ (đừng nói 我是高).",
    example: { zh: "我是学生。", py: "wǒ shì xuéshēng.", vi: "Tôi là học sinh." },
  },
  {
    id: "de", name: "…的… (sở hữu/định ngữ)", structure: "N1 + 的 + N2",
    vi: "的 nối định ngữ với danh từ: 'của' hoặc mệnh đề bổ nghĩa. 我的书 = sách của tôi.",
    example: { zh: "这是我的书。", py: "zhè shì wǒ de shū.", vi: "Đây là sách của tôi." },
  },
  {
    id: "zai", name: "在 + nơi chốn", structure: "S + 在 + nơi chốn (+ V)",
    vi: "在 chỉ vị trí/đang ở đâu. Khác tiếng Việt: nơi chốn đứng TRƯỚC động từ.",
    example: { zh: "我在家看书。", py: "wǒ zài jiā kàn shū.", vi: "Tôi ở nhà đọc sách." },
  },
  {
    id: "you", name: "有 / 没有", structure: "S + 有 / 没有 + O",
    vi: "有 = có; phủ định là 没有 (KHÔNG dùng 不有).",
    example: { zh: "我没有时间。", py: "wǒ méiyǒu shíjiān.", vi: "Tôi không có thời gian." },
  },
  {
    id: "xiang", name: "想 / 要 + động từ", structure: "S + 想/要 + V",
    vi: "想 = muốn (thiên về mong muốn), 要 = muốn/sẽ (thiên về ý định).",
    example: { zh: "我想去中国。", py: "wǒ xiǎng qù Zhōngguó.", vi: "Tôi muốn đi Trung Quốc." },
  },
  {
    id: "le", name: "了 (hoàn thành)", structure: "S + V + 了 (+ O)",
    vi: "了 đánh dấu hành động đã xảy ra/hoàn thành. Đặt sau động từ.",
    example: { zh: "我吃了饭。", py: "wǒ chī le fàn.", vi: "Tôi ăn cơm rồi." },
  },
  {
    id: "bi", name: "A 比 B + tính từ", structure: "A + 比 + B + adj",
    vi: "So sánh hơn. KHÔNG thêm 很 (đừng nói A 比 B 很高). Muốn nhấn: …高一点/高得多.",
    example: { zh: "他比我高。", py: "tā bǐ wǒ gāo.", vi: "Anh ấy cao hơn tôi." },
  },
  {
    id: "ba", name: "把 字句", structure: "S + 把 + O + V + kết quả",
    vi: "Nhấn vào việc XỬ LÝ đối tượng O ra sao. Sau động từ thường có bổ ngữ kết quả.",
    example: { zh: "我把作业做完了。", py: "wǒ bǎ zuòyè zuò wán le.", vi: "Tôi làm xong bài tập rồi." },
  },
  {
    id: "yinwei", name: "因为…所以…", structure: "因为 + lý do, 所以 + kết quả",
    vi: "Vì… nên… Có thể dùng cả cặp (khác tiếng Việt hay bỏ một vế).",
    example: { zh: "因为下雨，所以我没去。", py: "yīnwèi xiàyǔ, suǒyǐ wǒ méi qù.", vi: "Vì trời mưa nên tôi không đi." },
  },
  {
    id: "suiran", name: "虽然…但是…", structure: "虽然 + A, 但是 + B",
    vi: "Tuy… nhưng… Dùng cặp liên từ; 但是 KHÔNG bỏ dù đã có 虽然.",
    example: { zh: "虽然很累，但是很开心。", py: "suīrán hěn lèi, dànshì hěn kāixīn.", vi: "Tuy mệt nhưng rất vui." },
  },
  {
    id: "yibian", name: "一边…一边…", structure: "一边 + V1 + 一边 + V2",
    vi: "Vừa… vừa… (hai việc cùng lúc).",
    example: { zh: "他一边走一边唱。", py: "tā yìbiān zǒu yìbiān chàng.", vi: "Anh ấy vừa đi vừa hát." },
  },
  {
    id: "hui", name: "会 / 能 / 可以", structure: "S + 会/能/可以 + V",
    vi: "会 = biết (kỹ năng học được), 能 = có khả năng/điều kiện, 可以 = được phép.",
    example: { zh: "我会说中文。", py: "wǒ huì shuō Zhōngwén.", vi: "Tôi biết nói tiếng Trung." },
  },
];
