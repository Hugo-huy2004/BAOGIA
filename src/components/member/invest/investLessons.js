/**
 * Giáo trình sàn ảo Hugo — viết bằng tiếng Việt như HugoCoder và Study with
 * Hugo (tác giả dạy bằng tiếng Việt; xem danh sách EXCLUDED trong
 * scripts/check-i18n-hardcoded.mjs).
 *
 * Nguyên tắc viết: mỗi bài nói MỘT ý, có công thức và có ví dụ bằng số. Mục
 * tiêu là người học mang được kiến thức này ra sàn thật, nên không bài nào hứa
 * "cách thắng chắc" — thứ đó không tồn tại, và tin vào nó là cách mất tiền
 * nhanh nhất ngoài đời.
 */
export const LESSONS = [
  {
    id: "co-phieu",
    title: "Cổ phiếu là gì",
    summary: "Mua cổ phiếu là mua một phần công ty, không phải mua một con số.",
    body: [
      "Hugo Film phát hành 120.000 cổ phiếu. Bạn mua 100 cổ phiếu tức là bạn sở hữu 100/120.000 công ty đó — khoảng 0,08%.",
      "Giá cổ phiếu × số cổ phiếu đã phát hành = VỐN HOÁ, tức thị trường đang định giá cả công ty bao nhiêu. Nhìn vốn hoá để biết công ty lớn cỡ nào, đừng nhìn mỗi giá một cổ phiếu: một mã giá 45 JOY chưa chắc rẻ hơn mã giá 100 JOY.",
    ],
  },
  {
    id: "gia-dong",
    title: "Vì sao giá lên xuống",
    summary: "Giá chạy theo việc công ty làm TỐT HƠN hay KÉM HƠN kỳ vọng.",
    body: [
      "Mỗi phiên, sàn đo hoạt động 7 ngày gần nhất của từng công ty rồi so với mức trung bình 30 ngày của chính nó. Chênh lệch đó gọi là bất ngờ (surprise).",
      "Hugo Arcade tuần này có 150 lượt chơi, trung bình là 100 ⇒ surprise = +50%. Nhân với biên độ riêng của mã (9%) ⇒ giá tăng 4,5% phiên đó.",
      "Bài học mang ra đời thật: thị trường không thưởng cho công ty làm ăn tốt, nó thưởng cho công ty làm tốt HƠN MỨC MỌI NGƯỜI ĐANG CHỜ ĐỢI. Đó là lý do một công ty báo lãi kỷ lục mà cổ phiếu vẫn giảm.",
    ],
  },
  {
    id: "rui-ro",
    title: "Rủi ro đi cùng lợi nhuận",
    summary: "Mã chạy nhanh khi lên cũng là mã rơi nhanh khi xuống.",
    body: [
      "Bốn mã trên sàn có biên độ khác nhau: HARC 9% (mạnh nhất), HNEWS 7%, HFILM 5%, HBANK 3% (êm nhất).",
      "Cùng một tin tốt +50% surprise: HARC tăng 4,5% còn HBANK chỉ tăng 1,5%. Nhưng khi tin xấu, HARC cũng mất 4,5% còn HBANK chỉ mất 1,5%.",
      "Không có mã nào 'lời nhiều mà an toàn'. Ai chào bạn thứ đó ngoài đời thật thì gần như chắc chắn là lừa đảo.",
    ],
  },
  {
    id: "gia-von",
    title: "Giá vốn bình quân",
    summary: "Mua thêm ở giá khác thì giá vốn được tính lại, không phải giá lần cuối.",
    body: [
      "Mua 10 cổ phiếu giá 100, rồi mua thêm 10 cổ phiếu giá 200. Giá vốn = (10×100 + 10×200) / 20 = 150 JOY.",
      "Lãi/lỗ luôn đo từ 150 chứ không phải từ 200. Nhiều người mới nhìn nhầm chỗ này rồi tưởng mình đang lỗ trong khi thật ra đang lãi — hoặc ngược lại.",
    ],
  },
  {
    id: "lai-lo",
    title: "Tính lãi/lỗ cho đúng",
    summary: "Lãi/lỗ = (giá hiện tại − giá vốn) × số lượng. Phần trăm mới là thứ đáng nhìn.",
    body: [
      "Đang nắm 20 cổ phiếu giá vốn 150, giá hiện tại 180 ⇒ lãi = (180 − 150) × 20 = 600 JOY.",
      "Vốn bỏ ra = 150 × 20 = 3.000 JOY ⇒ lãi 20%. Con số 600 tự nó không nói gì: lãi 600 trên vốn 3.000 khác hẳn lãi 600 trên vốn 60.000.",
      "Lãi khi CHƯA BÁN gọi là lãi trên giấy. Nó chỉ thành tiền thật khi bạn bán — và giá có thể quay đầu trước khi bạn kịp bán.",
    ],
  },
  {
    id: "phi",
    title: "Phí ăn mòn lợi nhuận",
    summary: "Mua rồi bán ngay ở đúng giá cũ, bạn vẫn LỖ đúng bằng hai lần phí.",
    body: [
      "Sàn thu 0,5% mỗi chiều, tối thiểu 1 JOY — sàn thật cũng thu phí như vậy, cộng thuế.",
      "Mua 10 cổ phiếu giá 100 (phí 5 JOY), bán lại cũng giá 100 (phí 5 JOY) ⇒ lỗ 10 JOY dù giá không hề đổi.",
      "Đây là lý do mua đi bán lại liên tục thường thua người mua rồi giữ: mỗi vòng lướt là một lần trả phí, còn giá thì chưa chắc đi đâu.",
    ],
  },
  {
    id: "phi-chuyen-doi",
    title: "Phí chuyển đổi khi mua tài sản niêm yết bằng đơn vị khác",
    summary: "Sàn niêm yết bằng JOYka. Ví bạn ở đơn vị khác thì mỗi lệnh là một lần đổi tiền.",
    body: [
      "Toàn sàn dùng MỘT bảng giá bằng JOYka — đơn vị JOY gốc. Ví bạn để ở Mira, Luno hay Zoma thì màn hình tự viết lại con số đó theo đơn vị của bạn, KHÔNG mất phí: đơn vị chỉ là cách viết, số JOY gốc vẫn y nguyên.",
      "Một lệnh 1.000 JOYka với ví khác đơn vị: 5 phí môi giới + 50 phí sáng tạo + 150 phí chuyển đổi = 205, tức hơn 20% giá trị lệnh. Mua rồi bán ngay là mất hơn 40%.",
      "Ngoài đời y hệt: mua cổ phiếu Mỹ bằng tiền Việt thì ngoài phí môi giới còn mất phí đổi ngoại tệ hai chiều. Đó là lý do nhà đầu tư dài hạn ít giao dịch, còn người lướt sóng xuyên tiền tệ thường thua ngay từ bảng phí — trước khi giá kịp chạy.",
      "Bài học rút ra: trước khi đặt lệnh, hãy cộng đủ MỌI khoản phí rồi mới xem mình cần giá chạy bao nhiêu phần trăm mới hoà vốn.",
    ],
  },
  {
    id: "co-tuc",
    title: "Cổ tức",
    summary: "Có công ty trả tiền cho cổ đông đều đặn thay vì chỉ trông vào giá.",
    body: [
      "Hugo Bank trả 0,15% giá cổ phiếu mỗi phiên cho người đang nắm giữ. Giá ít chạy, nhưng dòng tiền về đều.",
      "Ngoài đời, cổ phiếu ngân hàng và tiện ích thường như vậy: tăng giá chậm, bù lại trả cổ tức. Cổ phiếu công nghệ thì ngược lại.",
      "Chọn kiểu nào là tuỳ mục tiêu của bạn — cần tiền đều hay chấp nhận chờ để giá lên.",
    ],
  },
  {
    id: "da-dang-hoa",
    title: "Đừng bỏ hết trứng vào một giỏ",
    summary: "Chia vốn cho nhiều mã khác ngành thì một tin xấu không quét sạch tài khoản.",
    body: [
      "Bốn công ty trên sàn thuộc bốn ngành khác nhau: rạp phim, trò chơi, truyền thông, tài chính. Tin xấu của ngành game không kéo ngân hàng xuống theo.",
      "Thử tự làm một lần: bỏ toàn bộ JOY vào HARC trong một tuần, rồi tuần sau chia đều bốn mã. So hai kết quả — cảm giác khi tài khoản rung lắc cũng là bài học.",
    ],
  },
  {
    id: "ky-luat",
    title: "Kỷ luật quan trọng hơn dự đoán",
    summary: "Quyết định trước điểm bán, đừng để cảm xúc quyết hộ.",
    body: [
      "Trước khi mua, viết ra hai con số: lãi bao nhiêu thì bán, lỗ bao nhiêu thì cắt. Rồi làm đúng như đã viết.",
      "Người mới thường làm ngược: lãi một chút đã bán vì sợ mất, lỗ thì giữ mãi vì tiếc — kết quả là lãi nhỏ, lỗ lớn.",
      "Sàn này dùng JOY nên sai không mất tiền thật. Hãy sai ở đây cho đủ, trước khi mang tiền thật ra sàn thật.",
    ],
  },
  {
    id: "canh-bao",
    title: "Sàn ảo khác sàn thật ở đâu",
    summary: "Hiểu giới hạn của mô phỏng để không mang ảo tưởng ra đời thật.",
    body: [
      "Ở đây giá khớp 3 phiên/ngày (09:00 · 15:00 · 21:00) và luôn khớp đủ số lượng bạn đặt. Sàn thật khớp liên tục, và có lúc không ai mua để bạn bán.",
      "Ở đây công ty không phá sản, giá không về 0. Sàn thật thì có — và cổ đông là người mất cuối cùng.",
      "JOY không phải tiền thật, không quy đổi ra tiền. Kết quả trong app không phải lời hứa cho bất kỳ khoản đầu tư nào ngoài đời.",
    ],
  },
];
