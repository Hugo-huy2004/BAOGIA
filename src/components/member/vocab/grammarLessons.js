// Ngữ pháp tiếng Trung — CHỈ những điểm KHÁC tiếng Việt.
//
// Tiếng Việt và tiếng Trung giống nhau nhiều (đều SVO, đều dùng lượng từ, không
// chia động từ), nên đa số ngữ pháp không cần học lại. File này gom đúng những
// chỗ NGƯỜI VIỆT HAY SAI vì khác tiếng mẹ đẻ — mỗi bài ngắn, một quy tắc, ví dụ
// thật. Nội dung gốc do Hugo Studio soạn (không sao chép giáo trình nào).
export const GRAMMAR_LESSONS = [
  {
    id: 'le', title: 'Trợ từ 了 (le)', icon: 'check_circle',
    diff: 'Tiếng Việt chỉ có "rồi"; 了 vừa báo HOÀN THÀNH vừa báo THAY ĐỔI trạng thái, và vị trí đặt khác.',
    rule: 'Động từ + 了 = việc đã hoàn thành. Cuối câu + 了 = tình huống MỚI xuất hiện.',
    examples: [
      { zh: '我吃了饭。', py: 'Wǒ chī le fàn.', vi: 'Tôi ăn cơm rồi. (đã hoàn thành)' },
      { zh: '下雨了。', py: 'Xià yǔ le.', vi: 'Trời mưa rồi. (trạng thái mới)' },
    ],
    tip: 'Câu phủ định dùng 没 và BỎ 了: 我没吃饭 (tôi chưa ăn), không nói 没吃了.',
  },
  {
    id: 'ba', title: 'Câu chữ 把 (bǎ)', icon: 'swap_horiz',
    diff: 'Tiếng Việt không có cấu trúc này. 把 đưa tân ngữ LÊN TRƯỚC động từ để nhấn "xử lý cái gì".',
    rule: 'Chủ ngữ + 把 + tân ngữ + động từ + (kết quả/nơi chốn). Dùng khi tác động làm đối tượng thay đổi.',
    examples: [
      { zh: '我把书放在桌子上。', py: 'Wǒ bǎ shū fàng zài zhuōzi shàng.', vi: 'Tôi đặt sách lên bàn.' },
      { zh: '请把门关上。', py: 'Qǐng bǎ mén guān shàng.', vi: 'Làm ơn đóng cửa lại.' },
    ],
    tip: 'Động từ trong câu 把 hầu như luôn có thành phần đi kèm (了/kết quả/nơi chốn), không đứng trơ.',
  },
  {
    id: 'shide', title: 'Cấu trúc 是…的 (shì…de)', icon: 'font_download',
    diff: 'Để nhấn THỜI GIAN / NƠI CHỐN / CÁCH THỨC của một việc ĐÃ xảy ra — tiếng Việt chỉ nhấn bằng ngữ điệu.',
    rule: '是 + (thời gian/nơi/cách) + động từ + 的. Nhấn vào phần nằm giữa 是…的.',
    examples: [
      { zh: '我是昨天来的。', py: 'Wǒ shì zuótiān lái de.', vi: 'Tôi đến từ hôm qua. (nhấn: HÔM QUA)' },
      { zh: '他是坐飞机去的。', py: 'Tā shì zuò fēijī qù de.', vi: 'Anh ấy đi bằng máy bay. (nhấn: BẰNG MÁY BAY)' },
    ],
    tip: 'Chỉ dùng cho việc đã hoàn thành trong quá khứ.',
  },
  {
    id: 'de-degree', title: 'Bổ ngữ trình độ 得 (de)', icon: 'trending_up',
    diff: 'Muốn nói "làm việc gì đó tốt/nhanh/…" phải chèn 得 giữa động từ và mức độ — khác trật tự tiếng Việt.',
    rule: 'Động từ + 得 + tính từ chỉ mức độ. Nếu có tân ngữ: lặp động từ (V tân ngữ + V + 得…).',
    examples: [
      { zh: '他说得很好。', py: 'Tā shuō de hěn hǎo.', vi: 'Anh ấy nói rất giỏi.' },
      { zh: '她说汉语说得很流利。', py: 'Tā shuō Hànyǔ shuō de hěn liúlì.', vi: 'Cô ấy nói tiếng Trung rất trôi chảy.' },
    ],
    tip: 'Đừng nhầm 得 (bổ ngữ) với 的 (sở hữu) và 地 (trạng ngữ) — xem bài "Ba chữ de".',
  },
  {
    id: 'complement', title: 'Bổ ngữ kết quả & xu hướng', icon: 'east',
    diff: 'Tiếng Trung ghép kết quả/hướng NGAY SAU động từ thành một khối; tiếng Việt tách thành nhiều từ.',
    rule: 'Động từ + (完/好/到/见…) = kết quả; Động từ + (出来/进去/上/下…) = hướng di chuyển.',
    examples: [
      { zh: '我看完了。', py: 'Wǒ kàn wán le.', vi: 'Tôi xem xong rồi.' },
      { zh: '请拿出来。', py: 'Qǐng ná chūlái.', vi: 'Xin lấy ra.' },
    ],
    tip: '听懂 (nghe hiểu), 找到 (tìm thấy) — nhớ theo cụm động từ+kết quả, đừng dịch từng chữ.',
  },
  {
    id: 'bi', title: 'So sánh với 比 (bǐ)', icon: 'compare_arrows',
    diff: 'Tiếng Việt: "A cao HƠN B". Tiếng Trung KHÔNG thêm "hơn" sau tính từ — dùng 比 trước tính từ.',
    rule: 'A + 比 + B + tính từ. Muốn nói hơn bao nhiêu: A 比 B + adj + (số lượng).',
    examples: [
      { zh: '我比他高。', py: 'Wǒ bǐ tā gāo.', vi: 'Tôi cao hơn anh ấy.' },
      { zh: '今天比昨天冷一点。', py: 'Jīntiān bǐ zuótiān lěng yìdiǎn.', vi: 'Hôm nay lạnh hơn hôm qua một chút.' },
    ],
    tip: 'KHÔNG nói 我比他很高. Sau 比 không dùng 很/非常.',
  },
  {
    id: 'three-de', title: 'Ba chữ "de": 的 / 地 / 得', icon: 'spellcheck',
    diff: 'Tiếng Việt chỉ một cách; tiếng Trung ba chữ đồng âm "de" cho ba vai trò khác nhau.',
    rule: '的 = sở hữu/định ngữ (danh từ). 地 = trạng ngữ (trước động từ). 得 = bổ ngữ (sau động từ).',
    examples: [
      { zh: '我的书', py: 'wǒ de shū', vi: 'sách của tôi (的)' },
      { zh: '认真地学习', py: 'rènzhēn de xuéxí', vi: 'học tập một cách chăm chỉ (地)' },
      { zh: '跑得很快', py: 'pǎo de hěn kuài', vi: 'chạy rất nhanh (得)' },
    ],
    tip: 'Mẹo: đứng trước danh từ → 的; trước động từ → 地; sau động từ → 得.',
  },
  {
    id: 'zai-place', title: 'Nơi chốn với 在 đứng TRƯỚC động từ', icon: 'place',
    diff: 'Tiếng Việt đặt nơi chốn ở cuối ("ăn cơm Ở NHÀ"); tiếng Trung đặt 在+nơi chốn TRƯỚC động từ.',
    rule: 'Chủ ngữ + 在 + nơi chốn + động từ + tân ngữ.',
    examples: [
      { zh: '我在家吃饭。', py: 'Wǒ zài jiā chī fàn.', vi: 'Tôi ăn cơm ở nhà.' },
      { zh: '他在图书馆学习。', py: 'Tā zài túshūguǎn xuéxí.', vi: 'Anh ấy học ở thư viện.' },
    ],
    tip: 'Nói 我吃饭在家 là sai trật tự.',
  },
  {
    id: 'measure', title: 'Lượng từ bắt buộc', icon: 'tag',
    diff: 'Cả hai đều có lượng từ, nhưng tiếng Trung BẮT BUỘC dùng và chọn đúng lượng từ cho từng loại.',
    rule: 'Số + lượng từ + danh từ. 个 dùng chung; 本 (sách), 张 (tờ/phẳng), 只 (con vật), 杯 (cốc)…',
    examples: [
      { zh: '一本书', py: 'yì běn shū', vi: 'một quyển sách' },
      { zh: '三杯茶', py: 'sān bēi chá', vi: 'ba cốc trà' },
    ],
    tip: 'Không nói 一书. Không chắc thì dùng 个, nhưng nên học đúng lượng từ hay gặp.',
  },
  {
    id: 'liang', title: '两 (liǎng) vs 二 (èr)', icon: 'looks_two',
    diff: 'Tiếng Việt chỉ có "hai"; tiếng Trung phân biệt 两 (số lượng) và 二 (số đếm/thứ tự).',
    rule: 'Đếm số lượng đồ vật → 两 + lượng từ. Đọc con số, số thứ tự, số điện thoại → 二.',
    examples: [
      { zh: '两个人', py: 'liǎng gè rén', vi: 'hai người' },
      { zh: '第二课', py: 'dì èr kè', vi: 'bài thứ hai' },
    ],
    tip: '两点 (2 giờ) nhưng 十二 (mười hai).',
  },
  {
    id: 'zheng-fan', title: 'Câu hỏi chính–phản', icon: 'help',
    diff: 'Ngoài 吗, tiếng Trung hỏi bằng cách ghép "động từ + 不 + động từ" — cấu trúc tiếng Việt không có.',
    rule: 'V + 不 + V (hoặc adj + 不 + adj) = hỏi "có… không". Tương đương thêm 吗 nhưng tự nhiên hơn.',
    examples: [
      { zh: '你去不去？', py: 'Nǐ qù bu qù?', vi: 'Bạn đi hay không đi?' },
      { zh: '好不好？', py: 'Hǎo bu hǎo?', vi: 'Được không?' },
    ],
    tip: 'Đã dùng chính–phản thì KHÔNG thêm 吗 nữa.',
  },
];

export default GRAMMAR_LESSONS;
