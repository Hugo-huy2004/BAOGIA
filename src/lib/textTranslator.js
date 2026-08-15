// Dịch văn bản bằng Translator API có sẵn trong trình duyệt (Chrome 138+).
//
// Chọn API này thay vì gọi một dịch vụ dịch qua mạng vì ba lý do hợp với PWA:
// chạy ngay trên máy nên nội dung trao đổi nội bộ không rời thiết bị, dùng được
// khi mất mạng sau lần tải gói ngôn ngữ đầu, và không tốn khoá hay hạn mức.
//
// Trình duyệt không hỗ trợ thì `canTranslate()` trả về false và giao diện chỉ
// đơn giản là không hiện nút dịch — không có đường dự phòng nào gửi chữ ra ngoài.

// Translator API dùng thẻ BCP-47. Mã locale của app trùng luôn, trừ tiếng Trung:
// "zh" là chưa xác định giản/phồn thể, phải nói rõ là giản thể.
const BCP47 = { zh: "zh-Hans" };
const tag = (code) => BCP47[code] || code;

export function canTranslate() {
  return typeof self !== "undefined" && "Translator" in self;
}

/** Ký tự chỉ tiếng Việt mới có — ê/ô/â bị loại vì trùng tiếng Pháp. */
const VIETNAMESE = /[ăđơưĂĐƠƯ]|[ạảấầẩẫậắằẳẵặẹẻẽếềểễệịỉĩọỏốồổỗộớờởỡợụủũứừửữựỳỵỷỹ]/;

/**
 * Admin chỉ soạn bằng tiếng Việt hoặc tiếng Anh, nên một phép thử ký tự là đủ
 * và không phải chờ tải thêm mô hình nhận diện ngôn ngữ.
 */
export function guessLanguage(text) {
  return VIETNAMESE.test(String(text)) ? "vi" : "en";
}

/**
 * Trả về bản dịch, hoặc ném lỗi kèm lý do đọc được.
 * `onProgress` nhận số 0–1 trong lúc tải gói ngôn ngữ lần đầu.
 */
export async function translateText(text, { from, to, onProgress } = {}) {
  if (!canTranslate()) throw new Error("unsupported");
  if (!text || from === to) return text;

  const pair = { sourceLanguage: tag(from), targetLanguage: tag(to) };
  const availability = await self.Translator.availability(pair);
  if (availability === "unavailable") throw new Error("unavailable");

  const translator = await self.Translator.create({
    ...pair,
    monitor(monitor) {
      monitor.addEventListener("downloadprogress", (event) => {
        onProgress?.(event.loaded);
      });
    },
  });
  try {
    return await translator.translate(String(text));
  } finally {
    // Gói ngôn ngữ nặng; giữ lại sau khi dịch xong chỉ tổ chiếm bộ nhớ.
    translator.destroy?.();
  }
}
