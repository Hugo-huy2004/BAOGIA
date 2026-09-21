import i18n from "i18next";

/**
 * Dịch chữ NẰM CỨNG trong mã giao diện sang chữ Nôm.
 *
 * ── VÌ SAO CÓ CÁI NÀY ───────────────────────────────────────────────────────
 * Bản dịch chữ Nôm phủ `locales/vi/translation.json`, nhưng khoảng 13.400
 * chuỗi tiếng Việt khác nằm thẳng trong JSX và không đi qua i18n — nên màn
 * Ngân Khố với màn Tài khoản gần như nguyên tiếng Việt dù con số phủ báo 94%.
 *
 * Đưa từng chuỗi ấy vào i18n là việc đúng nhưng trải khắp 250 tệp. Trong khi
 * chờ làm việc đó, hàm này tra bảng dựng sẵn (`data/nom-ui.json`) THEO CHÍNH
 * CÂU TIẾNG VIỆT — không cần đặt khoá mới, và các ngôn ngữ khác không đổi gì.
 *
 * ── VÌ SAO LÀ HÀM THƯỜNG, KHÔNG PHẢI HOOK ───────────────────────────────────
 * Chuỗi cần dịch nằm rải khắp: trong component chính, trong component con, và
 * cả trong mảng dữ liệu cấp mô-đun (bảng hạng thẻ). Hook chỉ gọi được trong
 * component, nên bản đầu dùng hook đã để lại 87 chỗ `nom is not defined` —
 * phải gắn móc vào từng component con, hoặc gỡ bọc ở dữ liệu rồi bọc lại ở nơi
 * hiển thị. Một hàm nhập khẩu bình thường dùng được ở cả ba nơi.
 *
 * ponytail: tra bảng tĩnh, không dịch lúc chạy. Bộ cắt cụm và bảng tra nặng
 * hàng trăm KB; tải về trình duyệt chỉ để dựng lại đúng kết quả đã biết trước
 * là vô nghĩa. Bảng chỉ tải khi người dùng thật sự chọn chữ Nôm.
 *
 * Ngôn ngữ khác chữ Nôm thì trả về NGUYÊN VĂN — không ngoại lệ nào, nên bọc
 * một chuỗi bằng hàm này không bao giờ làm hỏng bản tiếng Việt.
 */
let table = null;
let loading = false;

const isNom = () => String(i18n.resolvedLanguage || i18n.language || "").startsWith("nom");

const load = () => {
  if (table || loading) return;
  loading = true;
  import("../../data/nom-ui.json")
    .then((mod) => {
      table = mod.default || mod;
      // Bảng về sau khi cây đã vẽ xong, nên phải báo cho React vẽ lại. Mượn
      // đúng sự kiện mà i18next vẫn dùng để thông báo đổi ngôn ngữ.
      i18n.emit("languageChanged", i18n.resolvedLanguage || i18n.language);
    })
    .catch(() => { table = {}; })
    .finally(() => { loading = false; });
};

/** `nom("Chủ thẻ")` → "卡牌之主" khi đang ở chữ Nôm, còn lại giữ nguyên. */
export function nom(text) {
  if (typeof text !== "string" || !isNom()) return text;
  load();
  return table?.[text] || text;
}

export default nom;
