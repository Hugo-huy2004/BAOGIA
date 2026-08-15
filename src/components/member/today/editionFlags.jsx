// Quốc kỳ vẽ bằng hình học, tô vào bên trong đường viền bản đồ của từng ấn bản.
//
// Vì sao không dùng ảnh cờ hay emoji: emoji cờ không hiện trên Windows, còn ảnh
// thì không cắt được theo hình đất nước. Mỗi lá cờ ở đây chỉ là vài hình cơ bản
// nên vẽ thẳng bằng SVG là rẻ nhất — và phóng cỡ nào cũng sắc nét.
//
// QUY TẮC: dải ngang/dọc vẽ theo tỉ lệ khung (không méo được), còn biểu tượng
// (sao, mặt trời, thái cực) vẽ theo BỀ NGANG khung và đặt ở vị trí khai trong
// EMBLEM để không bị hình đất nước cắt mất.
// Đây là ngoại lệ có chủ đích của quy ước icon đơn sắc: quốc kỳ phải đúng màu.

const star = (cx, cy, r, rotate = -90) => {
  const points = [];
  for (let i = 0; i < 10; i += 1) {
    const radius = i % 2 === 0 ? r : r * 0.382;   // tỉ lệ sao 5 cánh chuẩn
    const angle = (rotate + i * 36) * Math.PI / 180;
    points.push(`${(cx + radius * Math.cos(angle)).toFixed(1)} ${(cy + radius * Math.sin(angle)).toFixed(1)}`);
  }
  return `M${points.join('L')}Z`;
};

const band = (x, y, w, h, fill) => <rect key={`${fill}${y}${x}`} x={x} y={y} width={w} height={h} fill={fill} />;

// Chỗ đặt biểu tượng, tính theo tỉ lệ khung bản đồ. Tâm khung KHÔNG dùng được:
// với Việt Nam nó rơi đúng khúc eo miền Trung, với Nhật thì rơi ra biển — ngôi
// sao và đĩa mặt trời bị cắt mất gần hết. Ba con số này đặt tay cho vừa phần
// đất rộng nhất của từng nước (đã soi bằng ảnh render, không đoán).
const EMBLEM = {
  vi: { x: 0.42, y: 0.12, r: 0.15 },   // đồng bằng Bắc Bộ
  ja: { x: 0.52, y: 0.5, r: 0.085 },   // giữa Honshu, chỗ đảo rộng nhất
  ko: { x: 0.5, y: 0.4, r: 0.19 },     // giữa bán đảo, chừa chỗ cho bốn quẻ
};
const emblemOf = (code, w, h) => {
  const spot = EMBLEM[code] || { x: 0.5, y: 0.5, r: 0.3 };
  return { cx: w * spot.x, cy: h * spot.y, r: w * spot.r };
};

// Mỗi lá cờ nhận khung (w, h) của bản đồ và trả về các hình phủ kín khung đó.
export const EDITION_FLAGS = {
  // Cờ đỏ sao vàng.
  vi: (w, h) => {
    const { cx, cy, r } = emblemOf('vi', w, h);
    return [
      band(0, 0, w, h, '#DA251D'),
      <path key="star" d={star(cx, cy, r)} fill="#FFCD00" />,
    ];
  },

  // KHÔNG có `en`: tiếng Anh là ngôn ngữ chung của 59 nước, treo cờ Mỹ lên ấn
  // bản EN là nói sai về ngôn ngữ đó. Ấn bản ấy dùng bản đồ thế giới tô các
  // nước nói tiếng Anh — xem EnglishEditionMark trong EditionMark.jsx.

  // Ngũ sắc: đỏ – trắng – xanh (dải giữa dày gấp đôi) – trắng – đỏ.
  th: (w, h) => [
    band(0, 0, w, h * (1 / 6), '#A51931'),
    band(0, h * (1 / 6), w, h * (1 / 6), '#F4F5F8'),
    band(0, h * (2 / 6), w, h * (2 / 6), '#2D2A4A'),
    band(0, h * (4 / 6), w, h * (1 / 6), '#F4F5F8'),
    band(0, h * (5 / 6), w, h * (1 / 6), '#A51931'),
  ],

  // Nhật chương — đĩa mặt trời đặt giữa đảo Honshu.
  ja: (w, h) => {
    const { cx, cy, r } = emblemOf('ja', w, h);
    return [
      band(0, 0, w, h, '#fff'),
      <circle key="sun" cx={cx} cy={cy} r={r} fill="#BC002D" />,
    ];
  },

  // Thái cực kỳ: vòng âm dương nghiêng 33° + bốn quẻ.
  ko: (w, h) => {
    const { cx, cy, r } = emblemOf('ko', w, h);
    // Hai giọt thái cực: mỗi nửa là một nửa vòng lớn nối hai nửa vòng nhỏ
    // đường kính r — đó là đường lượn chữ S ở giữa.
    const taeguk = (sign) => `M${cx - r} ${cy}A${r} ${r} 0 0 ${sign > 0 ? 1 : 0} ${cx + r} ${cy}`
      + `A${r / 2} ${r / 2} 0 0 ${sign > 0 ? 0 : 1} ${cx} ${cy}`
      + `A${r / 2} ${r / 2} 0 0 ${sign > 0 ? 1 : 0} ${cx - r} ${cy}Z`;
    const bar = (group, index, angle, on) => {
      const length = r * 1.1;
      const thick = r * 0.18;
      const distance = r * 1.7 + index * (thick + r * 0.1);
      const rad = angle * Math.PI / 180;
      return (
        <g
          key={`${group}-${index}`}
          transform={`translate(${(cx + distance * Math.cos(rad)).toFixed(1)} ${(cy + distance * Math.sin(rad)).toFixed(1)}) rotate(${angle + 90})`}
        >
          {on
            ? <rect x={-length / 2} y={-thick / 2} width={length} height={thick} fill="#0F0F0F" />
            : [-1, 1].map((side) => (
              <rect
                key={side}
                x={side < 0 ? -length / 2 : length * 0.09}
                y={-thick / 2}
                width={length * 0.41}
                height={thick}
                fill="#0F0F0F"
              />
            ))}
        </g>
      );
    };
    // Càn (3 vạch liền) – Ly – Khảm – Khôn (3 vạch đứt), theo đúng bốn góc cờ.
    const trigrams = [
      [135, [true, true, true]],
      [45, [false, true, false]],
      [225, [true, false, true]],
      [315, [false, false, false]],
    ];
    return [
      band(0, 0, w, h, '#fff'),
      <g key="taeguk" transform={`rotate(-33 ${cx} ${cy})`}>
        <path d={taeguk(1)} fill="#CD2E3A" />
        <path d={taeguk(-1)} fill="#0047A0" />
      </g>,
      ...trigrams.flatMap(([angle, bars], group) => bars.map((on, index) => bar(group, index, angle, on))),
    ];
  },

  // Sang Saka Merah-Putih: đỏ trên, trắng dưới.
  id: (w, h) => [
    band(0, 0, w, h / 2, '#CE1126'),
    band(0, h / 2, w, h / 2, '#F5F5F5'),
  ],

  // Rojigualda: đỏ – vàng (dày gấp đôi) – đỏ.
  es: (w, h) => [
    band(0, 0, w, h / 4, '#AA151B'),
    band(0, h / 4, w, h / 2, '#F1BF00'),
    band(0, h * 0.75, w, h / 4, '#AA151B'),
  ],

  // Tricolore: ba dải dọc.
  fr: (w, h) => [
    band(0, 0, w / 3, h, '#002395'),
    band(w / 3, 0, w / 3, h, '#F5F5F5'),
    band(w * (2 / 3), 0, w / 3, h, '#ED2939'),
  ],
};

// Quốc hiệu viết bằng chính ngôn ngữ nước đó + màu nhấn lấy từ lá cờ. Không
// thêm hoa văn "đặc trưng dân tộc" nào khác ở đây: cờ và hình đất nước đã là
// thứ chính xác nhất; phần khí chất riêng của từng nước nằm ở culturalThemes.js.
export const EDITION_IDENTITY = {
  vi: { name: 'Cộng hoà Xã hội chủ nghĩa Việt Nam', accent: '#FFCD00', lang: 'vi' },
  th: { name: 'ราชอาณาจักรไทย', accent: '#2D2A4A', lang: 'th' },
  ja: { name: '日本国', accent: '#BC002D', lang: 'ja' },
  ko: { name: '대한민국', accent: '#0047A0', lang: 'ko' },
  id: { name: 'Republik Indonesia', accent: '#CE1126', lang: 'id' },
  es: { name: 'Reino de España', accent: '#AA151B', lang: 'es' },
  fr: { name: 'République française', accent: '#002395', lang: 'fr' },
  zh: { name: '中华人民共和国', accent: '#D9A521', lang: 'zh-CN' },
};
