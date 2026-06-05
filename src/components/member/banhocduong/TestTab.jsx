import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import psychologyService from "../../../services/classes/PsychologyService";

// DASS-21 Question Pool (Each item contains 3 expert Vietnamese variations with identical type and id)
const DASS21_QUESTION_POOL = [
  [
    { id: 1, type: "S", text: "Tớ cảm thấy khó mà thoải mái và thả lỏng đầu óc được" },
    { id: 1, type: "S", text: "Tớ thấy cơ bắp và đầu óc mình luôn căng cứng, khó tìm được cảm giác thư giãn" },
    { id: 1, type: "S", text: "Dạo này tớ thấy rất khó để cơ thể và tâm trí được nghỉ ngơi thoải mái thực sự" }
  ],
  [
    { id: 2, type: "A", text: "Cơ thể tớ có biểu hiện bị khô miệng khi lo âu xuất hiện" },
    { id: 2, type: "A", text: "Mỗi lần thấy lo lắng, miệng và cổ họng tớ lại khô khốc khó chịu" },
    { id: 2, type: "A", text: "Tớ nhận thấy khoang miệng mình hay bị khô mỗi khi tâm trạng bồn chồn lo âu" }
  ],
  [
    { id: 3, type: "D", text: "Tớ dường như chẳng cảm nhận được chút cảm xúc tích cực nào dạo này" },
    { id: 3, type: "D", text: "Tớ thấy mình như mất đi khả năng cảm nhận niềm vui hay những điều vui vẻ dạo gần đây" },
    { id: 3, type: "D", text: "Hầu như dạo này tớ không còn cảm giác hào hứng hay vui vẻ với bất kỳ điều gì" }
  ],
  [
    { id: 4, type: "A", text: "Tớ bị rối loạn nhịp thở (thở gấp, hụt hơi dù không vận động nặng)" },
    { id: 4, type: "A", text: "Nhiều lúc tớ cảm thấy ngột ngạt, thở dốc hoặc hụt hơi dù chỉ đang ngồi yên" },
    { id: 4, type: "A", text: "Nhịp thở của tớ đôi khi bị dồn dập, khó thở nhẹ mà không rõ lý do thể chất" }
  ],
  [
    { id: 5, type: "D", text: "Tớ thấy vô cùng khó khăn để bắt tay vào làm một công việc hay học tập" },
    { id: 5, type: "D", text: "Mỗi khi cần ôn bài hay bắt đầu công việc gì, tớ phải đấu tranh tư tưởng rất mệt mỏi" },
    { id: 5, type: "D", text: "Tớ gặp khó khăn lớn trong việc khơi dậy động lực để bắt đầu làm một việc gì đó" }
  ],
  [
    { id: 6, type: "S", text: "Tớ có xu hướng phản ứng quá lên hoặc gồng mình trước mọi tình huống" },
    { id: 6, type: "S", text: "Tớ thường làm quá vấn đề lên hoặc phản ứng căng thẳng hơn bình thường trước các sự việc xảy ra" },
    { id: 6, type: "S", text: "Mọi chuyện nhỏ dường như cũng dễ khiến tớ phải gồng mình chịu đựng hoặc phản ứng thái quá" }
  ],
  [
    { id: 7, type: "A", text: "Tớ hay bị đổ mồ hôi trộm (chẳng hạn như mồ hôi tay chân bộc phát vô cớ)" },
    { id: 7, type: "A", text: "Tớ nhận thấy bàn tay, bàn chân hoặc cơ thể hay toát mồ hôi lạnh dù trời không nóng" },
    { id: 7, type: "A", text: "Cơ thể tớ thỉnh thoảng tự dưng vã mồ hôi lạnh khi cảm giác bất an ập đến" }
  ],
  [
    { id: 8, type: "S", text: "Tớ thấy mình đang tiêu tốn quá nhiều năng lượng thần kinh cho việc nghĩ ngợi" },
    { id: 8, type: "S", text: "Đầu óc tớ luôn hoạt động hết công suất để suy nghĩ, khiến tớ kiệt sức" },
    { id: 8, type: "S", text: "Tớ tốn quá nhiều sức lực cho việc suy nghĩ vẩn vơ, không thể để đầu óc nghỉ ngơi" }
  ],
  [
    { id: 9, type: "A", text: "Tớ lo sợ những tình huống bất ngờ làm mình hoảng loạn hoặc biến mình thành trò cười" },
    { id: 9, type: "A", text: "Tớ thường hoang mang, sợ hãi trước những viễn cảnh bất chợt làm mình xấu hổ hoặc mất bình tĩnh" },
    { id: 9, type: "A", text: "Ý nghĩ về việc đột nhiên bị hoảng sợ hay mất kiểm soát trước mặt người khác khiến tớ e dè" }
  ],
  [
    { id: 10, type: "D", text: "Tớ thấy tương lai mịt mờ, dường như chẳng có gì để mong đợi cả" },
    { id: 10, type: "D", text: "Nhìn về phía trước, tớ chỉ thấy mọi thứ thật u tối và khó lòng tìm thấy hy vọng" },
    { id: 10, type: "D", text: "Tớ cảm thấy tương lai của mình không có triển vọng gì để mong chờ hay phấn đấu nữa" }
  ],
  [
    { id: 11, type: "S", text: "Tớ nhận thấy bản thân dễ bị kích động, nổi nóng vô cớ dạo gần đây" },
    { id: 11, type: "S", text: "Tâm trạng tớ rất dễ bị kích thích, trở nên cáu gắt và nổi giận vô cớ với mọi người" },
    { id: 11, type: "S", text: "Dạo gần đây tớ hay bực bội, khó chịu trong người và dễ nổi nóng vì những chuyện vặt vãnh" }
  ],
  [
    { id: 12, type: "S", text: "Tớ thấy rất khó để thư giãn đầu óc hoàn toàn khi nằm nghỉ" },
    { id: 12, type: "S", text: "Ngay cả khi nằm xuống nghỉ ngơi, đầu óc tớ vẫn quay cuồng, không thể thả lỏng nổi" },
    { id: 12, type: "S", text: "Việc tìm kiếm một trạng thái tĩnh tâm, thư giãn thực sự đối với tớ dạo này rất gian nan" }
  ],
  [
    { id: 13, type: "D", text: "Tớ cảm thấy chán nản, u sầu và thất vọng về bản thân mình" },
    { id: 13, type: "D", text: "Tớ thường xuyên thấy lòng nặng trĩu buồn bã, tự ti và thất vọng về chính mình" },
    { id: 13, type: "D", text: "Cảm giác chán ghét bản thân và u uất gặm nhấm tâm trí tớ mỗi ngày" }
  ],
  [
    { id: 14, type: "S", text: "Tớ khó chịu và không chấp nhận được việc có điều gì cản trở thứ tớ đang làm" },
    { id: 14, type: "S", text: "Tớ cực kỳ bức bối, mất kiên nhẫn khi gặp phải bất kỳ sự chậm trễ hay cản trở nào" },
    { id: 14, type: "S", text: "Chỉ một chút gián đoạn trong công việc hay bài học cũng đủ khiến tớ thấy rất bực mình" }
  ],
  [
    { id: 15, type: "A", text: "Tớ cảm giác như mình sắp sửa rơi vào trạng thái hoảng loạn cực độ" },
    { id: 15, type: "A", text: "Đôi khi tớ sợ hãi tột cùng, cảm giác như một cơn hoảng loạn lớn sắp bùng phát" },
    { id: 15, type: "A", text: "Có những khoảnh khắc tớ thấy vô cùng bất an, như thể sắp mất đi hoàn toàn sự bình tĩnh" }
  ],
  [
    { id: 16, type: "D", text: "Tớ không thấy hào hứng hay muốn bắt đầu bất kỳ việc gì nữa dạo này" },
    { id: 16, type: "D", text: "Mọi hứng thú trong tớ dường như biến mất, tớ không muốn bắt tay vào việc gì cả" },
    { id: 16, type: "D", text: "Tớ cảm giác mình cạn kiệt đam mê, không còn động lực để làm bất cứ chuyện gì" }
  ],
  [
    { id: 17, type: "D", text: "Tớ cảm thấy tự ti, nghĩ mình kém cỏi và vô giá trị trước mọi người" },
    { id: 17, type: "D", text: "Tớ hay so sánh rồi thấy mình thua kém, vô dụng và không có giá trị gì với xung quanh" },
    { id: 17, type: "D", text: "Cảm giác mình là kẻ bỏ đi, không làm được trò trống gì cứ lởn vởn trong đầu tớ" }
  ],
  [
    { id: 18, type: "S", text: "Tớ thấy mình khá nhạy cảm, dễ phật ý và dễ tự ái vì lời nói nhỏ" },
    { id: 18, type: "S", text: "Tớ trở nên rất nhạy cảm dạo này, chỉ một lời nói hay cử chỉ nhỏ của người khác cũng làm tớ suy nghĩ, chạnh lòng" },
    { id: 18, type: "S", text: "Cảm xúc của tớ dạo này rất dễ bị tổn thương hoặc phật lòng vì những phản hồi vụn vặt" }
  ],
  [
    { id: 19, type: "A", text: "Tớ nghe thấy rõ tiếng nhịp tim đập thình thịch dù đang ngồi yên" },
    { id: 19, type: "A", text: "Nhiều lúc tớ cảm nhận rõ ràng lồng ngực mình đập thình thịch, dồn dập ngay cả khi đang nghỉ ngơi" },
    { id: 19, type: "A", text: "Dù không hoạt động gì nặng, tớ vẫn nghe thấy nhịp tim đập nhanh và mạnh một cách bất thường" }
  ],
  [
    { id: 20, type: "A", text: "Tớ hay có cảm giác hoảng sợ vô cớ dù không có mối đe dọa trực tiếp nào" },
    { id: 20, type: "A", text: "Nỗi sợ hãi vô hình thỉnh thoảng ập đến làm tớ giật mình, dù xung quanh hoàn toàn an toàn" },
    { id: 20, type: "A", text: "Tớ thường xuyên thấy sợ sệt, bất an trong lòng mà không rõ bản thân đang sợ điều gì" }
  ],
  [
    { id: 21, type: "D", text: "Tớ cảm thấy cuộc sống dạo này trống rỗng và vô nghĩa" },
    { id: 21, type: "D", text: "Mỗi ngày trôi qua với tớ đều nhạt nhẽo, trống rỗng và tớ không thấy cuộc sống này có ý nghĩa gì" },
    { id: 21, type: "D", text: "Tớ thấy cuộc đời mình dạo này tẻ nhạt, thiếu vắng mục đích sống và trống rỗng vô cùng" }
  ]
];

const DASS21_QUESTIONS = DASS21_QUESTION_POOL.map(v => v[0]);

const DASS_OPTIONS = [
  { value: 0, label: "Không ảnh hưởng", desc: "Không áp dụng đối với tớ tí nào" },
  { value: 1, label: "Đôi chút", desc: "Áp dụng đối với tớ ở mức độ nào đó" },
  { value: 2, label: "Đáng kể", desc: "Áp dụng đối với tớ phần lớn thời gian" },
  { value: 3, label: "Rất nhiều", desc: "Áp dụng đối với tớ hầu như lúc nào cũng vậy" }
];

// MMPI-30 Question Pool (Each item contains 3 expert Vietnamese variations with identical type and id)
const MMPI_QUESTION_POOL = [
  [
    { id: 1, type: "Hs", text: "Cơ thể tớ thường đau nhức triền miên hoặc mệt mỏi rã rời mà khám không ra bệnh." },
    { id: 1, type: "Hs", text: "Tớ hay gặp các triệu chứng nhức mỏi, đau người ê ẩm kéo dài dù bác sĩ bảo không sao." },
    { id: 1, type: "Hs", text: "Cơ thể tớ thường xuyên cảm thấy rã rời, đau mỏi không rõ nguyên nhân y khoa cụ thể." }
  ],
  [
    { id: 2, type: "D", text: "Hầu như cả ngày tớ thấy lòng u sầu, trống rỗng và thiếu đi niềm vui thực tại." },
    { id: 2, type: "D", text: "Tớ thường xuyên chìm trong cảm giác buồn nản, tẻ nhạt và không tìm thấy niềm vui trong cuộc sống." },
    { id: 2, type: "D", text: "Nỗi buồn hoang hoải và cảm giác trống trải ngự trị tâm trí tớ hầu như mọi lúc trong ngày." }
  ],
  [
    { id: 3, type: "L", text: "Tớ chưa từng nổi giận hay nói lời nặng nề với bất kỳ ai trong suốt cuộc đời." },
    { id: 3, type: "L", text: "Trong suốt cuộc đời mình, tớ chưa bao giờ nổi nóng hay nói lời khó nghe với bất kỳ ai." },
    { id: 3, type: "L", text: "Tớ tin chắc mình chưa từng có một giây phút nào giận dữ hay buông lời ác ý với ai trong đời." }
  ],
  [
    { id: 4, type: "Hy", text: "Lồng ngực tớ nghẹn lại, tim đập dồn dập khi rơi vào trạng thái căng thẳng tột độ." },
    { id: 4, type: "Hy", text: "Mỗi khi bị áp lực lớn, tớ lại bị nghẹt thở, tức ngực và tim đập thình thịch liên hồi." },
    { id: 4, type: "Hy", text: "Cơ thể tớ phản ứng mạnh với stress bằng các triệu chứng như khó thở, tim đập nhanh dữ dội." }
  ],
  [
    { id: 5, type: "Pd", text: "Tớ cảm thấy các khuôn khổ pháp lý hoặc nội quy trường học gò bó và muốn chống đối." },
    { id: 5, type: "Pd", text: "Tớ rất ghét các quy tắc gò bó hay nội quy kỷ luật và thường có xu hướng muốn làm ngược lại." },
    { id: 5, type: "Pd", text: "Các rào cản nội quy ở trường hay xã hội khiến tớ ngột ngạt và muốn phá vỡ them." }
  ],
  [
    { id: 6, type: "F", text: "Tớ nghi ngờ có một thiết bị vô hình đang truyền sóng não để điều khiển hành vi của tớ." },
    { id: 6, type: "F", text: "Tớ thỉnh thoảng lo sợ có luồng sóng lạ đang xâm nhập đầu óc để chi phối suy nghĩ của tớ." },
    { id: 6, type: "F", text: "Ý nghĩ có ai đó đang dùng công nghệ sóng vô hình kiểm soát hành động của tớ lởn vởn trong đầu." }
  ],
  [
    { id: 7, type: "Mf", text: "Tớ nhạy cảm với vẻ đẹp nghệ thuật, thơ ca và cảm xúc nội tâm hơn các bạn khác." },
    { id: 7, type: "Mf", text: "Tớ có tâm hồn bay bổng, dễ rung động trước cái đẹp nghệ thuật và văn thơ hơn số đông." },
    { id: 7, type: "Mf", text: "Trí tưởng tượng và cảm xúc nghệ thuật của tớ phong phú hơn nhiều so với các bạn cùng trang lứa." }
  ],
  [
    { id: 8, type: "Pa", text: "Tớ có cảm giác mọi người xung quanh luôn bàn tán sau lưng và dò xét tớ." },
    { id: 8, type: "Pa", text: "Tớ luôn ngờ vực rằng người ta đang xầm xì, soi mói và phán xét tớ ở sau lưng." },
    { id: 8, type: "Pa", text: "Cảm giác bị những người xung quanh theo dõi, âm thầm nói xấu mình xuất hiện liên tục trong tớ." }
  ],
  [
    { id: 9, type: "Pt", text: "Tớ bị dằn vặt triền miên bởi những lỗi lầm cũ và không thể ngừng suy nghĩ về chúng." },
    { id: 9, type: "Pt", text: "Tớ liên tục dằn vặt, hối hận về những sai sót trong quá khứ mà không sao gạt đi được." },
    { id: 9, type: "Pt", text: "Những ám ảnh và cảm giác tội lỗi về sai lầm cũ cứ lặp đi lặp lại trong tâm trí tớ." }
  ],
  [
    { id: 10, type: "K", text: "Gia đình tớ luôn hòa thuận tuyệt đối, chưa từng xảy ra bất kỳ bất đồng hay cãi vã nào." },
    { id: 10, type: "K", text: "Nhà tớ luôn êm ấm hoàn hảo, chưa từng có một cuộc tranh cãi hay xích mích nào giữa các thành viên." },
    { id: 10, type: "K", text: "Tớ đoan chắc gia đình tớ chưa từng có bất kỳ mâu thuẫn lớn nhỏ nào kể từ khi tớ lớn lên." }
  ],
  [
    { id: 11, type: "Hs", text: "Tớ tốn rất nhiều thời gian lo sợ mình đang mang trong người một căn bệnh nan y nguy hiểm." },
    { id: 11, type: "Hs", text: "Tớ thường nơm nớp lo sợ mình mắc phải một chứng bệnh hiểm nghèo mà y học chưa phát hiện ra." },
    { id: 11, type: "Hs", text: "Mối lo ngại về việc cơ thể đang ủ một căn bệnh nan y nghiêm trọng chiếm hữu tâm trí tớ quá nhiều." }
  ],
  [
    { id: 12, type: "D", text: "Tớ mất hoàn toàn động lực phấn đấu, thường muốn buông xuôi việc học lẫn cuộc sống." },
    { id: 12, type: "D", text: "Động lực sống và học tập của tớ tiêu tan hết, tớ chỉ muốn buông bỏ tất cả mọi thứ." },
    { id: 12, type: "D", text: "Tớ rơi vào trạng thái chán chường sâu sắc, muốn bỏ mặc tương lai và buông xuôi mọi việc." }
  ],
  [
    { id: 13, type: "L", text: "Tớ luôn nói thật 100% trong mọi tình huống, dù cho điều đó có mang lại hậu quả xấu cho tớ." },
    { id: 13, type: "L", text: "Tớ chưa từng nói dối bất kỳ một câu nào trong đời, kể cả những lời nói dối vô hại nhất." },
    { id: 13, type: "L", text: "Trong mọi hoàn cảnh, tớ luôn tuyệt đối trung thực và không bao giờ biết nói sai sự thật." }
  ],
  [
    { id: 14, type: "Hy", text: "Tớ thường bị đau nửa đầu dữ dội hoặc co thắt dạ dày đột ngột khi bước vào mùa thi cử." },
    { id: 14, type: "Hy", text: "Mỗi khi đến kỳ kiểm tra lớn, tớ lại đau đầu búa bổ hoặc đau dạ dày quằn quại." },
    { id: 14, type: "Hy", text: "Áp lực thi cử thường chuyển hóa thành những cơn đau nửa đầu hoặc co thắt ruột dữ dội." }
  ],
  [
    { id: 15, type: "Pd", text: "Tớ thường hành động bộc phát theo cảm xúc nhất thời mà không nghĩ tới hậu quả." },
    { id: 15, type: "Pd", text: "Tớ rất dễ bốc đồng làm theo ý thích tức thời mà bỏ qua những rủi ro hay hậu quả sau đó." },
    { id: 15, type: "Pd", text: "Tính cách tớ khá nông nổi, dễ làm những việc bộc phát mà không suy tính trước sau." }
  ],
  [
    { id: 16, type: "F", text: "Tớ đôi khi nghe thấy những tiếng nói kỳ lạ vang vọng bên tai khi ở phòng một mình." },
    { id: 16, type: "F", text: "Khi ở một mình trong phòng tĩnh lặng, tớ thỉnh thoảng nghe thấy âm thanh hay tiếng nói mơ hồ." },
    { id: 16, type: "F", text: "Tớ từng trải qua việc nghe thấy tiếng thì thầm bên tai dù xung quanh hoàn toàn không có ai." }
  ],
  [
    { id: 17, type: "Mf", text: "Tớ thích những công việc thiên về chăm sóc tinh thần, lắng nghe chia sẻ hơn là tranh đua." },
    { id: 17, type: "Mf", text: "Tớ ưa chuộng những vai trò hỗ trợ, đồng cảm và lắng nghe hơn là lao vào các cuộc cạnh tranh khốc liệt." },
    { id: 17, type: "Mf", text: "Tớ thấy bản thân hợp với việc xoa dịu, chăm sóc cảm xúc người khác hơn là tranh giành vị trí." }
  ],
  [
    { id: 18, type: "Pa", text: "Tớ tin chắc có người đang đố kỵ và âm thầm tìm cách phá hoại bài thi hay đồ án của tớ." },
    { id: 18, type: "Pa", text: "Tớ luôn có cảm giác có kẻ ghen ghét và đang lập mưu hãm hại kết quả học tập của tớ." },
    { id: 18, type: "Pa", text: "Sự nghi ngờ có người cố tình chơi xấu, phá hoại công sức của tớ luôn thường trực trong lòng." }
  ],
  [
    { id: 19, type: "Pt", text: "Tớ có xu hướng kiểm tra đi kiểm tra lại đồ đạc, hoặc làm sạch tay liên tục để bớt lo lắng." },
    { id: 19, type: "Pt", text: "Để xoa dịu nỗi lo âu, tớ hay lặp lại việc kiểm tra cửa khóa, đồ đạc hoặc rửa tay nhiều lần." },
    { id: 19, type: "Pt", text: "Tớ thường bị thôi thúc phải kiểm tra đồ dùng hoặc lau dọn liên tục nhằm giảm bớt cảm giác bất an." }
  ],
  [
    { id: 20, type: "K", text: "Tớ hoàn toàn tự tin rằng mình không có bất kỳ khuyết điểm hay tính xấu nào cần sửa." },
    { id: 20, type: "K", text: "Tớ tự đánh giá mình là người hoàn mỹ, không có một thói hư tật xấu nào cần khắc phục." },
    { id: 20, type: "K", text: "Tớ đoan chắc bản thân hoàn hảo về mọi mặt và không có điểm yếu nào đáng chê trách." }
  ],
  [
    { id: 21, type: "Sc", text: "Có những lúc đầu óc tớ trống rỗng hoàn toàn, cảm giác như đang tách rời khỏi thế giới thực." },
    { id: 21, type: "Sc", text: "Thỉnh thoảng tớ thấy tâm trí mình bay bổng đi đâu mất, tựa như đang đứng ngoài thế giới này." },
    { id: 21, type: "Sc", text: "Tớ có cảm giác ngơ ngác, trống rỗng và tách biệt hoàn toàn khỏi thực tại đang diễn ra." }
  ],
  [
    { id: 22, type: "Sc", text: "Tớ thích chìm đắm trong thế giới tưởng tượng của riêng mình hơn là nói chuyện với mọi người." },
    { id: 22, type: "Sc", text: "Việc thu mình vào thế giới mộng tưởng cá nhân lôi cuốn tớ hơn là giao tiếp xã hội." },
    { id: 22, type: "Sc", text: "Tớ ưa thích việc mơ mộng trong thế giới riêng hơn là kết nối, trò chuyện với xung quanh." }
  ],
  [
    { id: 23, type: "L", text: "Tớ chưa bao giờ có lòng đố kỵ hay thầm ghét bỏ bất kỳ một ai trên đời." },
    { id: 23, type: "L", text: "Lòng đố kỵ chưa từng tồn tại trong tớ và tớ luôn yêu mến mọi người vô điều kiện." },
    { id: 23, type: "L", text: "Tớ chưa bao giờ có một suy nghĩ ghét bỏ hay ghen tị với thành công của bất kỳ ai." }
  ],
  [
    { id: 24, type: "Ma", text: "Có những giai đoạn tớ thấy hưng phấn tột độ, đầu óc chạy dồn dập và thức trắng đêm học tập." },
    { id: 24, type: "Ma", text: "Tớ từng có những lúc năng lượng tràn trề, suy nghĩ nhanh bất thường và thức trắng đêm không mệt." },
    { id: 24, type: "Ma", text: "Có thời điểm tớ vô cùng phấn chấn, đầu óc hoạt động liên tục khiến tớ mất ngủ cả đêm để làm việc." }
  ],
  [
    { id: 25, type: "Ma", text: "Tớ thường nói rất nhanh, chuyển từ chủ đề này sang chủ đề khác liên tục khi hào hứng." },
    { id: 25, type: "Ma", text: "Khi phấn khích, tớ hay nói liến thoắng và nhảy từ chuyện này sang chuyện khác rất nhanh." },
    { id: 25, type: "Ma", text: "Tớ nhận thấy mình hay nói nhanh dồn dập, đổi đề tài liên tục mỗi khi tâm trạng đi lên." }
  ],
  [
    { id: 26, type: "F", text: "Tớ có cảm giác các bộ phận trên cơ thể mình biến đổi kích thước bất thường." },
    { id: 26, type: "F", text: "Tớ thỉnh thoảng cảm thấy tay, chân hoặc cơ thể mình to ra hay nhỏ lại một cách kỳ lạ." },
    { id: 26, type: "F", text: "Cảm giác méo mó về kích thước các bộ phận cơ thể đôi lúc xuất hiện trong nhận thức của tớ." }
  ],
  [
    { id: 27, type: "Si", text: "Tớ thấy cực kỳ cạn kiệt năng lượng sau khi giao tiếp xã hội và cần ở một mình để phục hồi." },
    { id: 27, type: "Si", text: "Gặp gỡ mọi người làm tớ nhanh chóng hết năng lượng, tớ cần khoảng lặng cô độc để sạc lại pin." },
    { id: 27, type: "Si", text: "Tớ thấy kiệt quệ tinh thần sau các cuộc hội họp và chỉ muốn rút lui về thế giới riêng của mình." }
  ],
  [
    { id: 28, type: "Si", text: "Tớ luôn tìm cách né tránh các buổi tụ tập đông người hay sự kiện lớn ở trường học." },
    { id: 28, type: "Si", text: "Các sự kiện lớn hay đám đông ồn ào ở trường luôn là nơi tớ chủ động né tránh xa." },
    { id: 28, type: "Si", text: "Tớ thường tìm lý do trốn tránh những buổi họp mặt đông đúc hoặc liên hoan náo nhiệt." }
  ],
  [
    { id: 29, type: "K", text: "Tớ chưa từng cảm thấy bồn chồn lo âu hay sợ hãi về tương lai của mình dù chỉ một chút." },
    { id: 29, type: "K", text: "Ý nghĩ lo sợ hay bất an về tương lai chưa bao giờ thoáng qua đầu óc tớ dù chỉ một lần." },
    { id: 29, type: "K", text: "Tớ tuyệt đối không có bất kỳ lo lắng, phiền muộn hay bất an nào về cuộc sống sắp tới." }
  ],
  [
    { id: 30, type: "F", text: "Tớ tin mình có năng lực ngoại cảm đặc biệt có thể đọc được suy nghĩ của người khác." },
    { id: 30, type: "F", text: "Tớ có giác quan thứ sáu cực nhạy giúp tớ nắm bắt và thấu suốt suy nghĩ của người bên cạnh." },
    { id: 30, type: "F", text: "Tớ tin bản thân sở hữu một khả năng tâm linh đặc biệt giúp thấu thị đầu óc đối phương." }
  ]
];

const MMPI_QUESTIONS = MMPI_QUESTION_POOL.map(v => v[0]);

// Additional Validity Verification questions (10 questions for Test Bổ Sung)
const MMPI_SUPPLEMENTARY_QUESTION_POOL = [
  [
    { id: 101, type: "L_VAL", text: "Thỉnh thoảng tớ có nói dối một chút để tránh phiền phức không đáng có." },
    { id: 101, type: "L_VAL", text: "Đôi lúc tớ cũng nói tránh đi một chút để giảm thiểu rắc rối cho bản thân." },
    { id: 101, type: "L_VAL", text: "Nói dối vô hại đôi khi là cách tớ chọn để né tránh những rắc rối vụn vặt." }
  ],
  [
    { id: 102, type: "L_LIE", text: "Tớ luôn kiểm soát tốt cảm xúc của mình và chưa từng cáu gắt với ai." },
    { id: 102, type: "L_LIE", text: "Tớ tự hào vì mình chưa bao giờ mất bình tĩnh hay nổi giận với bất cứ ai." },
    { id: 102, type: "L_LIE", text: "Cơn nóng giận hay cáu kỉnh chưa từng xuất hiện trong cách tớ ứng xử với mọi người." }
  ],
  [
    { id: 103, type: "L_VAL", text: "Đôi khi tớ có những suy nghĩ ích kỷ mà tớ sẽ xấu hổ nếu người khác biết được." },
    { id: 103, type: "L_VAL", text: "Tớ thỉnh thoảng có vài suy nghĩ tư lợi cá nhân mà tớ sẽ rất ngượng nếu bị lộ." },
    { id: 103, type: "L_VAL", text: "Có những suy nghĩ ích kỷ thoáng qua khiến tớ thấy xấu hổ nếu người khác đọc vị được." }
  ],
  [
    { id: 104, type: "F_INF", text: "Tớ tin rằng đồ ăn hoặc nước uống của tớ thường xuyên bị người khác lén bỏ độc." },
    { id: 104, type: "F_INF", text: "Tớ thường lo ngại thức ăn hoặc đồ uống của mình bị kẻ xấu đầu độc một cách bí mật." },
    { id: 104, type: "F_INF", text: "Nỗi sợ có người lén pha chất độc vào đồ ăn nước uống của tớ xảy ra khá thường xuyên." }
  ],
  [
    { id: 105, type: "F_INF", text: "Tớ thỉnh thoảng thấy tâm trí mình trống rỗng và bị điều khiển bởi thế lực vô hình." },
    { id: 105, type: "F_INF", text: "Tâm trí tớ có những lúc bị khóa lại và chịu sự kiểm soát của một nguồn năng lượng vô hình." },
    { id: 105, type: "F_INF", text: "Tớ cảm thấy đầu óc mình đôi khi bị thế lực siêu nhiên nào đó xâm nhập và điều khiển." }
  ],
  [
    { id: 106, type: "L_LIE", text: "Tớ chưa bao giờ vi phạm bất kỳ một quy định hay nội quy nhỏ nhặt nào ở trường học." },
    { id: 106, type: "L_LIE", text: "Tớ luôn chấp hành nội quy trường học tuyệt đối, chưa từng mắc lỗi dù là nhỏ nhất." },
    { id: 106, type: "L_LIE", text: "Việc đi học muộn hay làm trái quy định nhỏ nhặt ở trường chưa từng xảy ra với tớ." }
  ],
  [
    { id: 107, type: "F_INF", text: "Đôi khi tớ có ảo giác nhìn thấy mọi thứ xung quanh biến dạng thành các hình thù lạ." },
    { id: 107, type: "F_INF", text: "Tớ thỉnh thoảng trông thấy cảnh vật quanh mình bị biến đổi hình dạng hoặc méo mó kỳ dị." },
    { id: 107, type: "F_INF", text: "Những ảo ảnh hay hình thù quái lạ đôi lúc xuất hiện trước mắt tớ một cách bất chợt." }
  ],
  [
    { id: 108, type: "K_VAL", text: "Tớ có những lo lắng và đôi chút tự ti về con đường học tập, sự nghiệp sau này." },
    { id: 108, type: "K_VAL", text: "Tương lai sự nghiệp và học hành đôi lúc khiến tớ trăn trở, lo âu và tự ti." },
    { id: 108, type: "K_VAL", text: "Tớ thi thoảng cảm thấy hoang mang và thiếu tự tin khi nghĩ về chặng đường phía trước." }
  ],
  [
    { id: 109, type: "K_VAL", text: "Tớ thỉnh thoảng lo lắng đến mức mất ngủ trước các buổi thuyết trình đồ án lớn." },
    { id: 109, type: "K_VAL", text: "Việc chuẩn bị báo cáo hay thuyết trình lớn đôi khi làm tớ căng thẳng trằn trọc cả đêm." },
    { id: 109, type: "K_VAL", text: "Tớ thỉnh thoảng mất ngủ vì quá hồi hộp trước những sự kiện kiểm tra, đánh giá lớn." }
  ],
  [
    { id: 110, type: "L_LIE", text: "Tớ luôn yêu mến và bao dung cho tất cả mọi người tớ từng gặp trên đời này." },
    { id: 110, type: "L_LIE", text: "Tâm hồn tớ luôn ngập tràn tình yêu thương, tớ không oán ghét bất kỳ ai tớ từng tiếp xúc." },
    { id: 110, type: "L_LIE", text: "Tớ luôn sẵn lòng tha thứ và yêu thương tất cả mọi người xung quanh mà không giữ lòng thù hận." }
  ]
];

const MMPI_SUPPLEMENTARY_QUESTIONS = MMPI_SUPPLEMENTARY_QUESTION_POOL.map(v => v[0]);

const CLINICAL_SCALES_INFO = {
  Hs: { code: "Hs", name: "Nghi bệnh (Hs)", desc: "Sự bận tâm quá mức về thể chất, nghi ngờ bệnh tật vô cớ." },
  D: { code: "D", name: "Trầm cảm (D)", desc: "Trạng thái u buồn, giảm hoạt động, thiếu hụt niềm vui sống." },
  Hy: { code: "Hy", name: "Cơ thể hóa (Hy)", desc: "Chuyển áp lực tâm lý thành triệu chứng thực thể cơ thể." },
  Pd: { code: "Pd", name: "Lệch lạc (Pd)", desc: "Thái độ chống đối nội quy, hành động bốc đồng thiếu kiềm chế." },
  Mf: { code: "Mf", name: "Nhạy cảm (Mf)", desc: "Độ nhạy cảm giới, đồng cảm cao, thiên hướng nghệ thuật." },
  Pa: { code: "Pa", name: "Hoang tưởng (Pa)", desc: "Nghi ngờ người khác xung quanh, cảm giác bị theo dõi/phán xét." },
  Pt: { code: "Pt", name: "Suy nhược (Pt)", desc: "Nỗi sợ ám ảnh, hành vi lặp lại, dằn vặt lỗi lầm nhỏ." },
  Sc: { code: "Sc", name: "Phân liệt (Sc)", desc: "Nhận thức xa rời thực tế, thích sống biệt lập trong tưởng tượng." },
  Ma: { code: "Ma", name: "Hưng cảm (Ma)", desc: "Năng lượng dư thừa bất thường, suy nghĩ dồn dập gây mất ngủ." },
  Si: { code: "Si", name: "Hướng nội (Si)", desc: "Xu hướng thu mình tránh né giao tiếp đông người, cạn kiệt năng lượng xã hội." }
};

export default function TestTab({ presetTest, bio, onNavigateToTab }) {
  const [selectedTest, setSelectedTest] = useState(null); // 'dass', 'mmpi', null
  const [testState, setTestState] = useState("intro"); // 'intro', 'testing', 'result', 'supplementary', 'completed'

  const getRandomDass = () => DASS21_QUESTION_POOL.map(variants => {
    const idx = Math.floor(Math.random() * variants.length);
    return variants[idx];
  });
  const getRandomMmpi = () => MMPI_QUESTION_POOL.map(variants => {
    const idx = Math.floor(Math.random() * variants.length);
    return variants[idx];
  });
  const getRandomSupplementary = () => MMPI_SUPPLEMENTARY_QUESTION_POOL.map(variants => {
    const idx = Math.floor(Math.random() * variants.length);
    return variants[idx];
  });

  const [activeDassQuestions, setActiveDassQuestions] = useState(getRandomDass);
  const [activeMmpiQuestions, setActiveMmpiQuestions] = useState(getRandomMmpi);
  const [activeSupplementaryQuestions, setActiveSupplementaryQuestions] = useState(getRandomSupplementary);

  const getUserAge = () => {
    if (!bio?.birthday) return 19;
    try {
      const parts = bio.birthday.trim().split(/[-/]/);
      if (parts.length === 3) {
        let birthYear = parseInt(parts[2], 10);
        if (parts[0].length === 4) {
          birthYear = parseInt(parts[0], 10);
        }
        const currentYear = new Date().getFullYear();
        return currentYear - birthYear;
      }
    } catch (e) {
      console.error(e);
    }
    return 19;
  };

  const getUserGender = () => {
    if (bio?.gender) return bio.gender.toLowerCase();
    if (bio?.sex) return bio.sex.toLowerCase();
    
    const name = (bio?.displayName || "").toLowerCase();
    if (name.includes(" thị ") || name.includes("thị ") || name.endsWith(" thị")) return "female";
    
    const femaleNames = ["hồng", "nhi", "vy", "yến", "mai", "lan", "quỳnh", "thảo", "trang", "huyền", "hoa", "phương", "ngọc", "tuyết", "linh", "anh", "cúc", "huệ", "chi", "bích", "hạnh", "dung", "hương", "trúc"];
    const maleNames = ["văn", "đức", "hữu", "quang", "minh", "hoàng", "sơn", "hải", "tuấn", "long", "tùng", "bách", "nam", "quốc", "thành", "phong", "tiến", "huy", "khánh", "dương", "anh", "khoa", "thắng", "trung"];
    
    const words = name.split(/\s+/);
    const lastWord = words[words.length - 1];
    
    if (femaleNames.includes(lastWord)) {
      if (words.some(w => ["văn", "đức", "hữu", "quốc"].includes(w))) {
        return "male";
      }
      return "female";
    }
    
    if (maleNames.includes(lastWord) || words.includes("văn")) {
      return "male";
    }
    
    return "neutral";
  };

  const getSubjectPronoun = () => {
    const age = getUserAge();
    const gender = getUserGender();
    
    if (age < 12) {
      return "Con";
    }
    if (age < 18) {
      return "Mình";
    }
    if (gender === "female") {
      return "Em";
    }
    return "Tôi";
  };

  const adaptedDassQuestions = React.useMemo(() => {
    const age = getUserAge();
    const pronoun = getSubjectPronoun();
    return activeDassQuestions.map(q => {
      let text = q.text;
      if (text.startsWith("Tôi ")) {
        text = text.replace(/^Tôi /, pronoun + " ");
      }
      if (age < 12) {
        text = text
          .replace(/áp lực/g, "mệt mỏi")
          .replace(/căng thẳng thần kinh/g, "lo lắng trong người")
          .replace(/thư giãn/g, "vui chơi, nghỉ ngơi")
          .replace(/giảng đường|trường học/g, "lớp học")
          .replace(/bất kỳ điều gì/g, "hoạt động nào")
          .replace(/vô nghĩa/g, "không vui vẻ")
          .replace(/tương lai của mình vô vọng/g, "sau này sẽ không có chuyện gì vui");
      } else if (age < 18) {
        text = text
          .replace(/giảng đường/g, "trường lớp")
          .replace(/đồ án/g, "bài tập lớn")
          .replace(/sức khỏe đột ngột/g, "sức khỏe khi học tập");
      }
      return { ...q, text };
    });
  }, [activeDassQuestions, bio?.birthday, bio?.displayName, bio?.gender, bio?.sex]);

  const adaptedMmpiQuestions = React.useMemo(() => {
    const age = getUserAge();
    const pronoun = getSubjectPronoun();
    return activeMmpiQuestions.map(q => {
      let text = q.text;
      if (text.startsWith("Tôi ")) {
        text = text.replace(/^Tôi /, pronoun + " ");
      }
      if (age < 12) {
        text = text
          .replace(/đồ án/g, "bài tập")
          .replace(/giảng đường/g, "lớp học")
          .replace(/mâu thuẫn/g, "cãi nhau")
          .replace(/hành vi/g, "hành động")
          .replace(/áp lực tâm lý/g, "nỗi buồn bã")
          .replace(/ảo giác/g, "nhìn thấy những hình ảnh lạ")
          .replace(/hoang tưởng/g, "lo lắng vô lý")
          .replace(/đối diện với kỳ thi cử/g, "khi chuẩn bị kiểm tra")
          .replace(/ngoại cảm đặc biệt/g, "phép thuật hay siêu năng lực");
      } else if (age < 18) {
        text = text
          .replace(/giảng đường/g, "trường lớp")
          .replace(/đồ án/g, "bài tập lớn")
          .replace(/giao tiếp xã hội/g, "nói chuyện với bạn bè")
          .replace(/áp lực tâm lý/g, "mệt mỏi tâm lý");
      }
      return { ...q, text };
    });
  }, [activeMmpiQuestions, bio?.birthday, bio?.displayName, bio?.gender, bio?.sex]);

  const adaptedSupplementaryQuestions = React.useMemo(() => {
    const age = getUserAge();
    const pronoun = getSubjectPronoun();
    return activeSupplementaryQuestions.map(q => {
      let text = q.text;
      if (text.startsWith("Tôi ")) {
        text = text.replace(/^Tôi /, pronoun + " ");
      }
      if (age < 12) {
        text = text
          .replace(/ảo giác/g, "nhìn thấy những hình ảnh lạ")
          .replace(/suy nghĩ ích kỷ/g, "suy nghĩ chưa tốt cho bạn bè")
          .replace(/thuyết trình đồ án lớn/g, "khi làm bài kiểm tra trước lớp")
          .replace(/ảo giác/g, "những hình thù lạ")
          .replace(/vi phạm bất kỳ một quy định/g, "làm sai nội quy");
      } else if (age < 18) {
        text = text
          .replace(/thuyết trình đồ án lớn/g, "thuyết trình bài học lớn");
      }
      return { ...q, text };
    });
  }, [activeSupplementaryQuestions, bio?.birthday, bio?.displayName, bio?.gender, bio?.sex]);

  const handleTransitionToChat = () => {
    try {
      const raw = localStorage.getItem("banhocduong_history");
      const list = raw ? JSON.parse(raw) : [];
      if (list.length > 0) {
        const latest = list[list.length - 1];
        localStorage.setItem("banhocduong_pending_report", JSON.stringify(latest));
      }
    } catch (e) {
      console.error(e);
    }
    if (onNavigateToTab) {
      onNavigateToTab("chat");
    }
  };
  
  // DASS-42 Testing State
  const [dassAnswers, setDassAnswers] = useState({}); // { [qId]: value }
  const [dassPage, setDassPage] = useState(0); // 6 pages of 7 questions
  const questionsPerPage = 7;

  // MMPI Testing State
  const [mmpiAnswers, setMmpiAnswers] = useState({}); // { [qId]: boolean }
  const [mmpiPageIndex, setMmpiPageIndex] = useState(0);

  // MMPI Supplementary Testing State (Test Bổ sung)
  const [supplementaryAnswers, setSupplementaryAnswers] = useState({});
  const [suppPageIndex, setSuppPageIndex] = useState(0);

  // Keep track of final validity check status
  const [validityStatus, setValidityStatus] = useState({ isReliable: true, reason: "", scores: { L: 50, F: 50, K: 50 } });

  useEffect(() => {
    if (presetTest) {
      setSelectedTest(presetTest);
      setTestState("testing");
      if (presetTest === "dass") {
        setDassAnswers({});
        setDassPage(0);
        setActiveDassQuestions(getRandomDass());
      } else {
        setMmpiAnswers({});
        setMmpiPageIndex(0);
        setSupplementaryAnswers({});
        setSuppPageIndex(0);
        setActiveMmpiQuestions(getRandomMmpi());
        setActiveSupplementaryQuestions(getRandomSupplementary());
      }
    }
  }, [presetTest]);

  // DASS-21 Clinical Interpretation (Exact standard scoring aligned with clinical reports)
  const getDASS21Interpretation = (scale, score) => {
    // Score passed is already multiplied by 2 (0-42 scale)
    if (scale === "D") {
      if (score <= 9) return { level: "Bình thường", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", desc: "Tâm trạng cậu ở mức ổn định hoàn toàn. Cậu vẫn tìm thấy niềm vui trong cuộc sống." };
      if (score <= 13) return { level: "Nhẹ", color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20", desc: "Có dấu hiệu buồn chán nhẹ. Cậu nên tăng cường đi dạo, trò chuyện và nghỉ ngơi hợp lý." };
      if (score <= 20) return { level: "Vừa phải", color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20", desc: "Trầm cảm mức độ vừa phải. Có biểu hiện cạn kiệt động lực và trống rỗng tâm lý kéo dài." };
      if (score <= 27) return { level: "Nặng", color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20", desc: "Trầm cảm mức độ nặng nề. Cậu thường xuyên cảm thấy bế tắc, cô độc sâu sắc. Hãy chia sẻ với người thân thiết." };
      return { level: "Rất nặng", color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20", desc: "Nguy cơ trầm cảm vô cùng nghiêm trọng. Hãy kết nối khẩn cấp với chuyên viên đồng hành hoặc chuyên gia tâm lý để được chẩn đoán và can thiệp." };
    }
    if (scale === "A") {
      if (score <= 7) return { level: "Bình thường", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", desc: "Hệ thống thần kinh lo âu bình thường, khả năng thích ứng cơ thể trước áp lực ở mức an toàn." };
      if (score <= 9) return { level: "Nhẹ", color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20", desc: "Cậu có đôi chút hồi hộp, bồn chồn lo sợ nhẹ trước kỳ thi hay deadline. Thực hành tập thở sâu 4-7-8." };
      if (score <= 14) return { level: "Vừa phải", color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20", desc: "Lo âu ở mức vừa phải. Cậu dễ rơi vào bất an thần kinh, khó ngủ và thỉnh thoảng bị khô miệng." };
      if (score <= 19) return { level: "Nặng", color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20", desc: "Lo âu ở mức độ nặng. Hệ thần kinh phản ứng báo động liên tục, gây khó chịu thể xác." };
      return { level: "Rất nặng", color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20", desc: "Lo âu hoảng loạn cực kỳ nghiêm trọng. Đề nghị chẩn đoán lâm sàng tại cơ sở y tế." };
    }
    // Stress
    if (score <= 14) return { level: "Bình thường", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", desc: "Căng thẳng ở mức kiểm soát được. Cậu đang điều tiết cân bằng thời gian tốt." };
    if (score <= 18) return { level: "Nhẹ", color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20", desc: "Có căng thẳng nhẹ, dễ cáu gắt khi công việc chồng chéo. Nên sắp xếp thứ tự ưu tiên." };
    if (score <= 25) return { level: "Vừa phải", color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20", desc: "Căng thẳng ở mức trung bình. Cậu khó thư giãn, hay cảm thấy bứt rứt mệt mỏi trong người." };
    if (score <= 33) return { level: "Nặng", color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20", desc: "Căng thẳng thần kinh nặng nề, năng lượng thần kinh bị vắt kiệt." };
    return { level: "Rất nặng", color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20", desc: "Cực kỳ căng thẳng và quá tải. Hệ miễn dịch và thần kinh báo động đỏ, tìm chuyên gia hỗ trợ ngay." };
  };

  // Start Test
  const handleStartTest = (type) => {
    setSelectedTest(type);
    setTestState("testing");
    if (type === "dass") {
      setDassAnswers({});
      setDassPage(0);
      setActiveDassQuestions(getRandomDass());
    } else {
      setMmpiAnswers({});
      setMmpiPageIndex(0);
      setSupplementaryAnswers({});
      setSuppPageIndex(0);
      setActiveMmpiQuestions(getRandomMmpi());
      setActiveSupplementaryQuestions(getRandomSupplementary());
    }
  };

  // Check DASS page completion
  const isDassPageComplete = () => {
    const start = dassPage * questionsPerPage;
    const end = start + questionsPerPage;
    const activeQuestions = adaptedDassQuestions.slice(start, end);
    return activeQuestions.every(q => dassAnswers[q.id] !== undefined);
  };

  const handleDassNext = () => {
    if (isDassPageComplete()) {
      const maxDassPage = Math.ceil(adaptedDassQuestions.length / questionsPerPage) - 1;
      if (dassPage < maxDassPage) {
        setDassPage(prev => prev + 1);
      } else {
        calculateDassResult();
        setTestState("completed");
      }
    }
  };

  const handleDassPrev = () => {
    if (dassPage > 0) {
      setDassPage(prev => prev - 1);
    }
  };

  // MMPI Answer and Navigation
  const handleMmpiAnswer = (ans) => {
    const currentQ = activeMmpiQuestions[mmpiPageIndex];
    setMmpiAnswers(prev => ({ ...prev, [currentQ.id]: ans }));
    
    if (mmpiPageIndex < activeMmpiQuestions.length - 1) {
      setMmpiPageIndex(prev => prev + 1);
    } else {
      // Completed MMPI-30 -> Run validity check first
      evaluateValidity(mmpiAnswers, {});
    }
  };

  const handleMmpiPrev = () => {
    if (mmpiPageIndex > 0) {
      setMmpiPageIndex(prev => prev - 1);
    }
  };

  // Supplementary test answers handler
  const handleSupplementaryAnswer = (ans) => {
    const currentQ = activeSupplementaryQuestions[suppPageIndex];
    const newSuppAnswers = { ...supplementaryAnswers, [currentQ.id]: ans };
    setSupplementaryAnswers(newSuppAnswers);
    
    if (suppPageIndex < activeSupplementaryQuestions.length - 1) {
      setSuppPageIndex(prev => prev + 1);
    } else {
      // Completed supplementary -> Re-evaluate validity combining both answers
      evaluateValidity(mmpiAnswers, newSuppAnswers);
    }
  };

  const handleSuppPrev = () => {
    if (suppPageIndex > 0) {
      setSuppPageIndex(prev => prev - 1);
    }
  };

  // Validity Calculation
  const evaluateValidity = (mainAnswers, suppAnswers) => {
    // 1. Lie (L) Scale: MMPI_QUESTIONS Q3, Q13, Q23.
    // Supplementary L: Q101 (ĐÚNG reduces L), Q102 (ĐÚNG increases L), Q103 (ĐÚNG reduces L), Q106 (ĐÚNG increases L), Q110 (ĐÚNG increases L)
    let lCount = 0;
    if (mainAnswers[3] === true) lCount++;
    if (mainAnswers[13] === true) lCount++;
    if (mainAnswers[23] === true) lCount++;

    let suppLScore = 0;
    if (suppAnswers[101] === false) suppLScore++;
    if (suppAnswers[102] === true) suppLScore++;
    if (suppAnswers[103] === false) suppLScore++;
    if (suppAnswers[106] === true) suppLScore++;
    if (suppAnswers[110] === true) suppLScore++;

    // Calculate T-Score for L
    // If supplementary taken, we scale the score. Otherwise use base.
    const isSuppTaken = Object.keys(suppAnswers).length > 0;
    const tL = isSuppTaken
      ? Math.round(50 + ((lCount + suppLScore) / 8) * 30) // Scale to T max 80
      : Math.round(50 + (lCount / 3) * 30);

    // 2. Infrequency (F) Scale: MMPI_QUESTIONS Q6, Q16, Q26, Q30.
    // Supp F: Q104 (ĐÚNG increases F), Q105 (ĐÚNG increases F), Q107 (ĐÚNG increases F)
    let fCount = 0;
    if (mainAnswers[6] === true) fCount++;
    if (mainAnswers[16] === true) fCount++;
    if (mainAnswers[26] === true) fCount++;
    if (mainAnswers[30] === true) fCount++;

    let suppFScore = 0;
    if (suppAnswers[104] === true) suppFScore++;
    if (suppAnswers[105] === true) suppFScore++;
    if (suppAnswers[107] === true) suppFScore++;

    const tF = isSuppTaken
      ? Math.round(50 + ((fCount + suppFScore) / 7) * 32)
      : Math.round(50 + (fCount / 4) * 30);

    // 3. Correction (K) Scale: MMPI_QUESTIONS Q10, Q20, Q29.
    // Supp K: Q108 (ĐÚNG reduces K), Q109 (ĐÚNG reduces K)
    let kCount = 0;
    if (mainAnswers[10] === true) kCount++;
    if (mainAnswers[20] === true) kCount++;
    if (mainAnswers[29] === true) kCount++;

    let suppKScore = 0;
    if (suppAnswers[108] === false) suppKScore++;
    if (suppAnswers[109] === false) suppKScore++;

    const tK = isSuppTaken
      ? Math.round(50 + ((kCount + suppKScore) / 5) * 30)
      : Math.round(50 + (kCount / 3) * 30);

    // Determine reliability status
    let isReliable = true;
    let reason = "";

    if (tL >= 70) {
      isReliable = false;
      reason = "Chỉ số nói dối L vượt ngưỡng (T >= 70). Nghi ngờ cậu có xu hướng cố gắng tô vẽ một hình ảnh cá nhân quá hoàn hảo, thiếu tự nhiên.";
    } else if (tF >= 80) {
      isReliable = false;
      reason = "Chỉ số dị biệt F vượt ngưỡng (T >= 80). Ghi nhận xu hướng trả lời phóng đại các triệu chứng hoặc làm bài một cách ngẫu nhiên/thiếu kiên nhẫn.";
    } else if (tK >= 70) {
      isReliable = false;
      reason = "Chỉ số phòng vệ K vượt ngưỡng (T >= 70). Cậu có cơ chế phòng vệ tâm lý rất mạnh, né tránh thừa nhận những khuyết điểm hoặc lo toan thật sự.";
    }

    setValidityStatus({ isReliable, reason, scores: { L: tL, F: tF, K: tK } });

    if (!isReliable && !isSuppTaken) {
      // Trigger supplementary test modal/view
      setTestState("supplementary");
    } else {
      calculateMmpiResult({ L: tL, F: tF, K: tK }, isReliable);
      setTestState("completed");
    }
  };

  // DASS-21 scoring result calculation (Sum of subscales multiplied by 2 for standard clinical comparison)
  const calculateDassResult = () => {
    let dSum = 0;
    let aSum = 0;
    let sSum = 0;

    activeDassQuestions.forEach(q => {
      const val = dassAnswers[q.id] || 0;
      if (q.type === "D") dSum += val;
      if (q.type === "A") aSum += val;
      if (q.type === "S") sSum += val;
    });

    const dFinal = dSum * 2;
    const aFinal = aSum * 2;
    const sFinal = sSum * 2;

    // Save history to localStorage/DB for companion tracking
    const newLog = {
      date: new Date().toISOString(),
      test: "dass42", // Keep database key compatible
      scores: { D: dFinal, A: aFinal, S: sFinal },
      severities: {
        D: getDASS21Interpretation("D", dFinal).level,
        A: getDASS21Interpretation("A", aFinal).level,
        S: getDASS21Interpretation("S", sFinal).level
      }
    };
    savePsychHistory(newLog);

    return {
      D: { score: dFinal, max: 42, ...getDASS21Interpretation("D", dFinal) },
      A: { score: aFinal, max: 42, ...getDASS21Interpretation("A", aFinal) },
      S: { score: sFinal, max: 42, ...getDASS21Interpretation("S", sFinal) }
    };
  };

  // MMPI T-scores calculation
  const calculateMmpiResult = (passedScores, passedIsReliable) => {
    const vScores = passedScores || validityStatus.scores;
    const vReliable = passedIsReliable !== undefined ? passedIsReliable : validityStatus.isReliable;

    const scales = { Hs: 0, D: 0, Hy: 0, Pd: 0, Mf: 0, Pa: 0, Pt: 0, Sc: 0, Ma: 0, Si: 0 };
    
    // Group clinical answers (2 items per scale)
    activeMmpiQuestions.forEach(q => {
      if (scales[q.type] !== undefined) {
        if (mmpiAnswers[q.id] === true) {
          scales[q.type]++;
        }
      }
    });

    const report = Object.entries(scales).map(([scaleCode, count]) => {
      const tScore = 50 + count * 15; // 0 correct -> 50, 1 -> 65, 2 -> 80
      const isElevated = tScore >= 70;
      const info = CLINICAL_SCALES_INFO[scaleCode];
      
      return {
        code: scaleCode,
        name: info.name,
        description: info.desc,
        tScore,
        elevated: isElevated,
        advice: isElevated 
          ? `Ghi nhận xu hướng vượt ngưỡng của ${info.name}. Cậu có thể đang gặp phải một số bất ổn liên quan. Bạn Học Đường khuyên cậu nên chú ý giải tỏa tâm lý.`
          : `Thang đo nằm trong giới hạn thích ứng bình thường.`
      };
    });

    // Save history
    const newLog = {
      date: new Date().toISOString(),
      test: "mmpi30",
      validity: vScores,
      isReliable: vReliable,
      clinical: report.map(r => ({ code: r.code, score: r.tScore }))
    };
    savePsychHistory(newLog);

    return report;
  };

  const savePsychHistory = (newLog) => {
    try {
      const raw = localStorage.getItem("banhocduong_history");
      const list = raw ? JSON.parse(raw) : [];
      list.push(newLog);
      localStorage.setItem("banhocduong_history", JSON.stringify(list));
      
      // Update check-in date so daily blocker knows test is taken today
      localStorage.setItem("banhocduong_last_test_date", new Date().toDateString());

      // Evaluate progress & adapt companion days
      if (psychologyService && typeof psychologyService.evaluateProgressAndAdaptDuration === "function") {
        const adaptation = psychologyService.evaluateProgressAndAdaptDuration();
        if (adaptation) {
          localStorage.setItem("banhocduong_duration_adaptation_alert", JSON.stringify(adaptation));
        }
      }
    } catch (e) {
      console.error("Failed to save psych log", e);
    }
  };

  const handleReset = () => {
    setSelectedTest(null);
    setTestState("intro");
  };

  // Helper to draw the custom SVG line graph for L, F, K validity scales
  const renderValidityGraph = (scores) => {
    // scores: { L: number, F: number, K: number }
    // Coordinates mapping:
    // Graph width 320, height 180.
    // L lies at x = 70, F at x = 160, K at x = 250.
    // y-axis goes from 0 to 120 T-score. Y = Height - (T * ScaleY).
    const graphH = 185;
    const graphW = 320;
    const getY = (val) => graphH - 20 - ((val - 20) / 100) * (graphH - 40);

    const lY = getY(scores.L);
    const fY = getY(scores.F);
    const kY = getY(scores.K);

    return (
      <div className="bg-[#15141c] rounded-xl p-4.5 border border-zinc-800/80 shadow-2xl relative">
        <h4 className="text-[10px] font-black tracking-widest text-[#0071e3] uppercase mb-3 text-center">
          Biểu đồ Kiểm định độ tin cậy L - F - K
        </h4>
        <div className="relative flex justify-center">
          <svg width={graphW} height={graphH} className="overflow-visible select-none">
            {/* Draw Horizontal Gridlines (T-score 30, 50, 70, 90, 110) */}
            {[30, 50, 70, 90, 110].map((t) => {
              const y = getY(t);
              return (
                <g key={t}>
                  <line x1={40} y1={y} x2={graphW - 20} y2={y} className="stroke-zinc-800" strokeWidth="0.8" strokeDasharray="3 3" />
                  <text x={32} y={y + 3} className="fill-zinc-650 font-mono text-[8px] text-right" textAnchor="end">{t}</text>
                  {t === 70 && (
                    <text x={graphW - 18} y={y - 4} className="fill-red-500/80 font-bold text-[7px]" textAnchor="end">Ngưỡng Lâm Sàng (70)</text>
                  )}
                </g>
              );
            })}

            {/* Draw Vertical spokes */}
            {[
              { x: 70, label: "L (Lie)" },
              { x: 160, label: "F (Infrequency)" },
              { x: 250, label: "K (Correction)" }
            ].map((spoke, idx) => (
              <g key={idx}>
                <line x1={spoke.x} y1={getY(20)} x2={spoke.x} y2={getY(120)} className="stroke-zinc-800" strokeWidth="1" />
                <text x={spoke.x} y={graphH - 5} className="fill-zinc-400 font-black text-[9px] tracking-wide" textAnchor="middle">{spoke.label}</text>
              </g>
            ))}

            {/* Graph Line */}
            <polyline
              points={`70,${lY} 160,${fY} 250,${kY}`}
              fill="none"
              className="stroke-emerald-400"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Vertex Dots */}
            {[
              { x: 70, y: lY, val: scores.L, color: scores.L >= 70 ? "fill-red-500" : "fill-emerald-400" },
              { x: 160, y: fY, val: scores.F, color: scores.F >= 74 ? "fill-red-500" : "fill-emerald-400" },
              { x: 250, y: kY, val: scores.K, color: scores.K >= 70 ? "fill-red-500" : "fill-emerald-400" }
            ].map((dot, idx) => (
              <g key={idx}>
                <circle cx={dot.x} cy={dot.y} r="5" className={`${dot.color} stroke-[#15141c]`} strokeWidth="1.5" />
                <text x={dot.x + 9} y={dot.y - 7} className="fill-white font-mono font-black text-[9.5px] bg-[#15141c] px-1 py-0.5 rounded shadow-sm">{dot.val}</text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 min-h-[500px] flex flex-col justify-between">
      <AnimatePresence mode="wait">
        {/* 1. INTRO / SELECTOR SCREEN */}
        {testState === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-6 w-full"
          >
          <div className="text-center max-w-md mx-auto space-y-1.5">
            <h4 className="text-sm font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
              Khảo Sát Lâm Sàng Bạn Học Đường
            </h4>
            <p className="text-xs text-zinc-550 dark:text-zinc-450 leading-relaxed">
              Vui lòng chọn bài đánh giá. Để đảm bảo kết quả chính xác so với chẩn đoán tại bệnh viện, hãy trả lời trung thực nhất có thể. Dữ liệu được tính toán offline cục bộ và bảo mật tuyệt đối.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl mx-auto pt-2">
            {/* DASS-42 card */}
            <div className="group border border-zinc-200/50 dark:border-zinc-800/60 bg-gradient-to-b from-white to-zinc-50/50 dark:from-[#1b1a24]/30 dark:to-zinc-950/20 rounded-lg p-5 hover:border-[#0071e3] transition-all flex flex-col justify-between h-[220px] shadow-sm hover:shadow-xl duration-300">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                  <span className="material-symbols-outlined text-xl">psychology_alt</span>
                </div>
                <div className="space-y-1">
                  <h3 className="text-xs font-black text-zinc-850 dark:text-zinc-200 uppercase tracking-wider">Đánh giá DASS-42 chuẩn</h3>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-450 leading-relaxed font-semibold">
                    Đầy đủ 42 câu hỏi chuẩn y tế chia đều cho 3 khía cạnh: <b>Trầm cảm (14 câu)</b>, <b>Lo âu (14 câu)</b> và <b>Căng thẳng (14 câu)</b> giúp phản ánh chân thực tình trạng tâm lý lâm sàng của cậu.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleStartTest("dass")}
                className="w-full py-2.5 bg-gradient-to-r from-[#0071e3] to-[#0077ed] hover:from-[#0077ed] hover:to-[#007fed] text-white rounded-md text-[10px] font-black uppercase tracking-wider transition-all shadow-md active:scale-[0.98]"
              >
                Bắt đầu khảo sát DASS-42
              </button>
            </div>

            {/* MMPI-30 card */}
            <div className="group border border-zinc-200/50 dark:border-zinc-800/60 bg-gradient-to-b from-white to-zinc-50/50 dark:from-[#1b1a24]/30 dark:to-zinc-950/20 rounded-lg p-5 hover:border-indigo-500 transition-all flex flex-col justify-between h-[220px] shadow-sm hover:shadow-xl duration-300">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-md bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
                  <span className="material-symbols-outlined text-xl">neurology</span>
                </div>
                <div className="space-y-1">
                  <h3 className="text-xs font-black text-zinc-850 dark:text-zinc-200 uppercase tracking-wider">Kiểm định Mini-MMPI (30 câu)</h3>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-450 leading-relaxed font-semibold">
                    Tích hợp <b>thang đo độ tin cậy L-F-K</b> của y khoa để loại trừ các trường hợp nói dối, phòng vệ tâm lý hoặc phóng đại triệu chứng, giúp chẩn đoán sát với thực tế nhất.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleStartTest("mmpi")}
                className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-md text-[10px] font-black uppercase tracking-wider transition-all shadow-md active:scale-[0.98]"
              >
                Bắt đầu khảo sát MMPI-30
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* 2. MAIN TESTING PROCESS */}
      {testState === "testing" && (
        <motion.div
          key="testing"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25 }}
          className="space-y-6 w-full"
        >
          {/* Top Progress bar */}
          <div className="bg-zinc-100/50 dark:bg-zinc-900/40 p-4.5 rounded-lg border border-zinc-200/40 dark:border-zinc-800/45 flex items-center justify-between">
            <div>
              <span className="text-[8px] font-black tracking-widest text-[#0071e3] uppercase block">
                Đang tiến hành đánh giá
              </span>
              <h3 className="text-xs font-black text-zinc-850 dark:text-zinc-200 uppercase tracking-wider mt-0.5">
                {selectedTest === "dass" ? "Trắc nghiệm tâm lý lâm sàng DASS-21 (Chuẩn Bộ Y Tế)" : "Kiểm định nhân cách lâm sàng Mini-MMPI"}
              </h3>
            </div>
            {selectedTest === "dass" ? (
              <div className="flex items-center gap-2">
                {[0, 1, 2, 3, 4, 5].map(p => (
                  <span
                    key={p}
                    className={`w-3.5 h-1.5 rounded-full transition-all ${
                      dassPage === p ? "bg-[#0071e3] w-6" : dassPage > p ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"
                    }`}
                  />
                ))}
                <span className="text-[10px] font-mono font-black text-zinc-550 ml-2">
                  Trang {dassPage + 1}/6
                </span>
              </div>
            ) : (
              <div className="text-right">
                <span className="text-[10px] font-mono font-black text-zinc-500 block">
                  Câu hỏi {mmpiPageIndex + 1}/30
                </span>
                <div className="w-24 h-1.5 bg-zinc-250 dark:bg-zinc-700 rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full bg-indigo-500 transition-all duration-300"
                    style={{ width: `${((mmpiPageIndex + 1) / 30) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* DASS-21 Grid */}
          {selectedTest === "dass" && (
            <motion.div
              key={`dass-page-${dassPage}`}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              <div className="divide-y divide-zinc-200/40 dark:divide-zinc-800/40 border border-zinc-200/50 dark:border-zinc-850/50 bg-white/40 dark:bg-black/5 rounded-lg overflow-hidden shadow-inner p-3 sm:p-5">
                {adaptedDassQuestions.slice(dassPage * questionsPerPage, (dassPage + 1) * questionsPerPage).map((q, idx) => {
                  const globalIdx = dassPage * questionsPerPage + idx + 1;
                  const currentAnswer = dassAnswers[q.id];
                  return (
                    <div key={q.id} className="py-4 first:pt-1 last:pb-1 space-y-3.5 px-2">
                      <div className="flex gap-2">
                        <span className="text-xs font-mono font-black text-[#0071e3] bg-[#0071e3]/10 px-1.5 py-0.5 rounded">
                          {globalIdx.toString().padStart(2, "0")}
                        </span>
                        <p className="text-xs font-bold text-zinc-750 dark:text-zinc-300">
                          {q.text}
                        </p>
                      </div>
                      
                      {/* Rating choices */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {DASS_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setDassAnswers(prev => ({ ...prev, [q.id]: opt.value }))}
                            className={`flex flex-col items-center p-2 rounded-md border text-center transition-all duration-200 hover:scale-[1.02] ${
                              currentAnswer === opt.value
                                ? "bg-[#0071e3]/10 border-[#0071e3] text-[#0071e3] dark:text-[#0077ed] shadow-sm"
                                : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-550 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700"
                            }`}
                          >
                            <span className="text-xs font-black">{opt.value}</span>
                            <span className="text-[9px] font-black mt-0.5">{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Navigation controls */}
              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={handleDassPrev}
                  disabled={dassPage === 0}
                  className="px-5 py-2.5 rounded-md border border-zinc-350 dark:border-zinc-700 text-zinc-650 dark:text-zinc-450 text-xs font-black transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none uppercase tracking-wider"
                >
                  Quay lại
                </button>
                <button
                  type="button"
                  onClick={handleDassNext}
                  disabled={!isDassPageComplete()}
                  className="px-6 py-2.5 rounded-md bg-gradient-to-r from-[#0071e3] to-[#0077ed] hover:from-[#0077ed] hover:to-[#007fed] text-white text-xs font-black transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none uppercase tracking-wider shadow-sm"
                >
                  {dassPage === 5 ? "Nộp bài & Xem kết quả" : "Tiếp theo"}
                </button>
              </div>
            </motion.div>
          )}

          {/* MMPI-30 question step by step */}
          {selectedTest === "mmpi" && (
            <div className="space-y-6 max-w-xl mx-auto py-4">
              <motion.div
                key={`mmpi-question-${mmpiPageIndex}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="border border-zinc-200/50 dark:border-zinc-850/50 bg-gradient-to-b from-white to-zinc-50/50 dark:from-[#1b1a24]/30 dark:to-zinc-950/20 rounded-xl p-6 sm:p-8 space-y-6 shadow-md text-center"
              >
                <span className="px-3 py-1 rounded-full text-[8.5px] font-black tracking-widest bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 uppercase">
                  Câu hỏi {mmpiPageIndex + 1} trên 30
                </span>
                
                <h3 className="text-sm sm:text-base font-bold text-zinc-800 dark:text-zinc-150 leading-relaxed max-w-md mx-auto">
                  "{adaptedMmpiQuestions[mmpiPageIndex].text}"
                </h3>

                <div className="grid grid-cols-2 gap-4 pt-4 max-w-xs mx-auto">
                  <button
                    type="button"
                    onClick={() => handleMmpiAnswer(true)}
                    className="py-4 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/10 transition-all active:scale-95 duration-200"
                  >
                    ĐÚNG
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMmpiAnswer(false)}
                    className="py-4 rounded-lg bg-red-500 hover:bg-red-600 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-red-500/10 transition-all active:scale-95 duration-200"
                  >
                    SAI
                  </button>
                </div>
              </motion.div>

              <div className="flex justify-start">
                <button
                  type="button"
                  onClick={handleMmpiPrev}
                  disabled={mmpiPageIndex === 0}
                  className="px-5 py-2.5 rounded-md border border-zinc-350 dark:border-zinc-700 text-zinc-650 dark:text-zinc-450 text-xs font-black transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none uppercase tracking-wider"
                >
                  Quay lại câu trước
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* 3. SUPPLEMENTARY TESTING STATE (Test Bổ sung) */}
      {testState === "supplementary" && (
        <motion.div
          key="supplementary"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25 }}
          className="space-y-6 max-w-xl mx-auto py-4"
        >
          <div className="p-4 rounded-lg border border-amber-500/20 bg-amber-500/5 text-amber-700 dark:text-amber-400 space-y-1.5 text-center">
            <div className="flex justify-center items-center gap-1.5 font-black text-xs uppercase tracking-wider">
              <span className="material-symbols-outlined text-sm font-black">report</span>
              Phát hiện phản hồi không nhất quán
            </div>
            <p className="text-[10px] leading-relaxed font-semibold">
              Điểm số kiểm định độ tin cậy ghi nhận sự chênh lệch (K hoặc L scale của cậu ở ngưỡng phản phòng thủ/đề phòng). Vui lòng hoàn thành thêm 10 câu hỏi kiểm chứng dưới đây để tối ưu hóa kết quả lâm sàng đúng nhất.
            </p>
          </div>

          <motion.div
            key={`supp-question-${suppPageIndex}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="border border-zinc-200/50 dark:border-zinc-850/50 bg-gradient-to-b from-white to-zinc-50/50 dark:from-[#1b1a24]/30 dark:to-zinc-950/20 rounded-xl p-6 sm:p-8 space-y-6 shadow-md text-center"
          >
            <span className="px-3 py-1 rounded-full text-[8.5px] font-black tracking-widest bg-[#0071e3]/10 border border-[#0071e3]/20 text-[#0071e3] uppercase">
              Xác thực bổ sung {suppPageIndex + 1} trên 10
            </span>
            
            <h3 className="text-sm sm:text-base font-bold text-zinc-800 dark:text-zinc-150 leading-relaxed max-w-md mx-auto">
              "{adaptedSupplementaryQuestions[suppPageIndex].text}"
            </h3>

            <div className="grid grid-cols-2 gap-4 pt-4 max-w-xs mx-auto">
              <button
                type="button"
                onClick={() => handleSupplementaryAnswer(true)}
                className="py-4 rounded-lg bg-indigo-650 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/10 transition-all active:scale-95"
              >
                ĐÚNG
              </button>
              <button
                type="button"
                onClick={() => handleSupplementaryAnswer(false)}
                className="py-4 rounded-lg bg-zinc-700 hover:bg-zinc-850 text-white font-black text-xs uppercase tracking-wider shadow-lg transition-all active:scale-95"
              >
                SAI
              </button>
            </div>
          </motion.div>

          <div className="flex justify-start">
            <button
              type="button"
              onClick={handleSuppPrev}
              disabled={suppPageIndex === 0}
              className="px-5 py-2.5 rounded-md border border-zinc-350 dark:border-zinc-700 text-zinc-650 dark:text-zinc-450 text-xs font-black transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none uppercase tracking-wider"
            >
              Quay lại câu trước
            </button>
          </div>
        </motion.div>
      )}

      {/* 4. CLINICAL REPORTS AND CHARTS */}
      {testState === "result" && (
        <motion.div
          key="result"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25 }}
          className="space-y-6"
        >
          {/* Header row */}
          <div className="bg-gradient-to-r from-zinc-900 via-zinc-850 to-zinc-800 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 rounded-xl p-6 text-white border border-zinc-200/10 shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[9px] font-black tracking-widest text-[#0071e3] uppercase block">
                Bản đồ Sức khỏe Tâm thần Lâm sàng
              </span>
              <h3 className="text-sm font-black uppercase tracking-wider text-white">
                Báo cáo kết quả phân tích Bạn Học Đường
              </h3>
              <p className="text-[10px] text-zinc-450 font-bold">
                Tương ứng với bộ chỉ số khoa học thực tế dùng trong bệnh viện tâm thần học.
              </p>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="px-4.5 py-2.5 bg-white/10 hover:bg-white/15 border border-white/20 text-white rounded-md text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 shadow-sm"
            >
              Làm lại bài test
            </button>
          </div>

          {/* DASS-42 RESULTS */}
          {selectedTest === "dass" && (() => {
            const results = calculateDassResult();
            return (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {[
                    { key: "D", title: "Trầm Cảm (Depression)", color: "bg-red-500", raw: results.D },
                    { key: "A", title: "Lo Âu (Anxiety)", color: "bg-amber-500", raw: results.A },
                    { key: "S", title: "Căng Thẳng (Stress)", color: "bg-blue-500", raw: results.S }
                  ].map((scale) => (
                    <div
                      key={scale.key}
                      className="border border-zinc-250/50 dark:border-zinc-800/50 bg-white/40 dark:bg-black/10 rounded-lg p-5 space-y-4 shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      <div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-zinc-850 dark:text-zinc-250 uppercase tracking-wider">{scale.title}</span>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${scale.raw.bg} ${scale.raw.color} border ${scale.raw.border}`}>
                            {scale.raw.level}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-1 mt-2.5">
                          <span className="text-2xl font-mono font-black text-zinc-800 dark:text-zinc-100">{scale.raw.score}</span>
                          <span className="text-[10px] font-mono text-zinc-400">/{scale.raw.max} (DASS-21 score)</span>
                        </div>
                      </div>

                      {/* Visual indicator bar */}
                      <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-850 rounded-full overflow-hidden relative">
                        <div
                          className={`h-full ${scale.color} transition-all duration-1000`}
                          style={{ width: `${(scale.raw.score / scale.raw.max) * 100}%` }}
                        />
                      </div>

                      <p className="text-[10px] text-zinc-550 dark:text-zinc-400 leading-relaxed font-bold">
                        {scale.raw.desc}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Synthesis Recommendations */}
                <div className="border border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-55/40 dark:bg-zinc-950/20 rounded-lg p-5 space-y-4 shadow-inner">
                  <div className="flex items-center gap-2 text-emerald-500">
                    <span className="material-symbols-outlined text-lg">verified_user</span>
                    <h4 className="text-xs font-black text-zinc-850 dark:text-zinc-200 uppercase tracking-wider">
                      Đồng hành & Hướng giải quyết lâm sàng
                    </h4>
                  </div>
                  <p className="text-xs text-zinc-650 dark:text-zinc-400 leading-relaxed font-medium">
                    Bạn Học Đường ghi nhận chẩn đoán cục bộ của cậu. Để cải thiện cán cân tâm trạng một cách chuẩn khoa học và tự nhiên nhất:
                  </p>
                  <ul className="list-disc pl-5 text-[11px] text-zinc-650 dark:text-zinc-400 space-y-2 font-bold">
                    <li>Thực hiện hít thở sâu tại tab <b>Hít thở 4-7-8</b> để chặn đứng cơn lo âu kích ứng đột ngột.</li>
                    <li>Sử dụng tab <b>Giải tỏa tiêu cực</b> thường xuyên để làm trống dòng suy nghĩ trước khi đi ngủ.</li>
                    <li>Bật <b>Chế độ Chăm sóc Sức khỏe Tinh thần</b> bên dưới để hệ thống Bạn Học Đường tự động gợi ý check-in cảm xúc hàng ngày và giám sát hành trình giúp cậu.</li>
                    <li>Nếu có thang đo rơi vào ngưỡng <b>Nặng hoặc Rất nặng</b>, đừng ngần ngại nhấp liên hệ chia sẻ trực tiếp với phòng tham vấn học đường hoặc giáo viên tin cậy nhất.</li>
                  </ul>
                </div>
              </div>
            );
          })()}

          {/* MMPI-30 RESULTS */}
          {selectedTest === "mmpi" && (() => {
            const results = calculateMmpiResult();
            const elevations = results.filter(r => r.elevated);
            return (
              <div className="space-y-6">
                
                {/* 1. Validity Check Status & warning if unreliable */}
                {!validityStatus.isReliable ? (
                  <div className="p-5 rounded-lg border border-red-500/20 bg-red-500/5 text-red-650 dark:text-red-400 space-y-2 animate-pulse">
                    <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider">
                      <span className="material-symbols-outlined">warning</span>
                      Kết quả độ tin cậy không đạt (Low Reliability Warning)
                    </div>
                    <p className="text-xs leading-relaxed font-semibold">
                      {validityStatus.reason} Báo cáo lâm sàng dưới đây chỉ mang tính chất tham khảo do biểu hiện phòng thủ hoặc nói dối vượt khung quy chuẩn. Cậu hãy cân nhắc làm lại bài test sau khi thư giãn hoàn toàn để có độ chuẩn chuyên gia cao nhất.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg border border-emerald-500/25 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 flex items-center gap-3">
                    <span className="material-symbols-outlined">verified</span>
                    <div className="text-xs font-black uppercase tracking-wider">Kết quả bài test đã qua kiểm định độ tin cậy lâm sàng</div>
                  </div>
                )}

                {/* Grid layout containing SVG Line chart (Validity) and Clinical scores */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Left Column: SVG line chart (L-F-K validity) */}
                  <div className="lg:col-span-5 space-y-4">
                    {renderValidityGraph(validityStatus.scores)}
                    
                    <div className="border border-zinc-200/50 dark:border-zinc-800/50 bg-white/40 dark:bg-black/10 rounded-lg p-4.5 space-y-3.5 shadow-sm text-[10px] text-zinc-550 dark:text-zinc-400 leading-relaxed font-bold">
                      <p className="uppercase tracking-widest text-[#0071e3] text-[9px] font-black">
                        Giải nghĩa thang kiểm chứng:
                      </p>
                      <p>
                        <b>L Scale (Lie)</b>: Đánh giá xu hướng né tránh lỗi lầm của bản thân để tạo vẻ ngoài lý tưởng. (Bình thường &lt; 70).
                      </p>
                      <p>
                        <b>F Scale (Infrequency)</b>: Đánh giá việc cường điệu triệu chứng tâm lý hoặc nhầm lẫn câu trả lời. (Bình thường &lt; 74).
                      </p>
                      <p>
                        <b>K Scale (Correction)</b>: Đánh giá sự phòng thủ và không sẵn lòng bộc lộ các vấn đề sâu kín. (Bình thường &lt; 70).
                      </p>
                    </div>
                  </div>

                  {/* Right Column: 10 clinical scales bars list */}
                  <div className="lg:col-span-7 border border-zinc-250/50 dark:border-zinc-800/50 bg-white/40 dark:bg-black/10 rounded-xl p-5 space-y-5 shadow-sm">
                    <h4 className="text-xs font-black text-zinc-850 dark:text-zinc-200 uppercase tracking-wider border-b border-zinc-200/40 dark:border-zinc-800/40 pb-2 flex justify-between items-center">
                      <span>10 Chỉ số Nhân Cách Lâm Sàng (MMPI T-Score)</span>
                      {elevations.length > 0 && (
                        <span className="text-[9px] font-black px-2 py-0.5 bg-red-500/10 text-red-500 rounded border border-red-500/20 uppercase animate-pulse">
                          Phát hiện {elevations.length} dấu hiệu tăng cao
                        </span>
                      )}
                    </h4>

                    <div className="space-y-4">
                      {results.map((res) => (
                        <div key={res.code} className="space-y-1">
                          <div className="flex justify-between items-center text-[10.5px] font-bold">
                            <span className="text-zinc-700 dark:text-zinc-350 flex items-center gap-1.5">
                              {res.name}
                              {res.elevated && (
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                              )}
                            </span>
                            <span className={`font-mono font-black ${res.elevated ? "text-red-500" : "text-zinc-550"}`}>
                              T-score: {res.tScore}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-zinc-200 dark:bg-zinc-850 rounded-full overflow-hidden relative shadow-inner">
                              <div
                                className={`h-full rounded-full transition-all duration-800 ${
                                  res.elevated ? "bg-red-500" : "bg-[#0071e3]"
                                }`}
                                style={{ width: `${(res.tScore / 120) * 100}%` }}
                              />
                            </div>
                            <span className="text-[8.5px] font-black text-zinc-400 w-8 text-right">
                              {res.elevated ? "VƯỢT" : "OK"}
                            </span>
                          </div>
                          <p className={`text-[9.5px] leading-relaxed font-semibold pl-1 ${
                            res.elevated ? "text-red-500/90 font-black" : "text-zinc-400"
                          }`}>
                            {res.elevated ? res.advice : res.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>
            );
          })()}
        </motion.div>
      )}

      {testState === "completed" && (
        <motion.div
          key="completed"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="space-y-6 max-w-md mx-auto py-8 text-center flex flex-col items-center justify-center"
        >
          <div className="relative mb-2">
            <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping opacity-75" />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="material-symbols-outlined text-4xl text-white font-black">done_all</span>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-black text-zinc-850 dark:text-zinc-150 uppercase tracking-wide">
              Đã Hoàn Thành Khảo Sát!
            </h3>
            <p className="text-xs text-zinc-550 dark:text-zinc-400 leading-relaxed max-w-sm font-semibold">
              Bài kiểm nghiệm tâm lý của cậu đã được xử lý và lưu trữ an toàn cục bộ. Hãy nhấp vào nút bên dưới để chuyển sang Trợ lý ảo nhận báo cáo chi tiết và đề xuất lộ trình chăm sóc tinh thần nhé.
            </p>
          </div>

          <button
            type="button"
            onClick={handleTransitionToChat}
            className="mt-4 px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.03] active:scale-[0.98] duration-200 flex items-center gap-2"
          >
            <span>Xem kết quả & Nhận đề xuất</span>
            <span className="material-symbols-outlined text-sm font-black">arrow_forward</span>
          </button>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
