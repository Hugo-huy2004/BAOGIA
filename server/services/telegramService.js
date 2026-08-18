/**
 * Dịch vụ thông báo Telegram Bot hoàn toàn miễn phí.
 * Gửi tin nhắn cảnh báo khẩn cấp tới Telegram của Boss khi có sự cố,
 * hoặc ticket bực tức 🤬 / nghi vấn gian lận.
 */

/**
 * Gửi 1 lần. Trả { ok, description } để nơi gọi tự quyết định có thử lại không.
 */
async function postMessage(token, payload) {
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return response.json();
}

/**
 * Telegram chỉ nhận một nhúm thẻ HTML. Câu trả lời do AI sinh ra rất hay lọt
 * <h3>, <ul> hay một thẻ mở chưa đóng — Telegram trả "can't parse entities" và
 * VỨT NGUYÊN CẢ TIN. Với con bot trò chuyện thì đó là im lặng không lời giải
 * thích, tệ hơn nhiều so với một tin mất định dạng. Nên: hỏng cú pháp thì gửi
 * lại dạng chữ trơn.
 */
function stripHtml(text) {
  return String(text)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}

export async function sendTelegramAlert(message, parseMode = 'HTML', replyMarkup = null) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId || token.includes('YOUR_')) {
    console.log(`[TELEGRAM BOT SIMULATED] ChatId: ${chatId || 'N/A'} | Content:\n${message}`);
    return { success: true, simulated: true };
  }

  try {
    const payload = {
      chat_id: chatId,
      text: message,
      parse_mode: parseMode,
      disable_web_page_preview: true,
    };
    if (replyMarkup) {
      payload.reply_markup = replyMarkup;
    }

    let data = await postMessage(token, payload);
    if (!data.ok && /parse|entit|tag/i.test(data.description || '')) {
      data = await postMessage(token, { ...payload, text: stripHtml(message), parse_mode: undefined });
    }
    if (!data.ok) {
      console.warn('⚠️ Telegram Bot API returned error:', data.description);
      return { success: false, error: data.description };
    }

    console.log('✅ Telegram alert sent successfully');
    return { success: true };
  } catch (error) {
    console.warn('⚠️ Telegram alert send failed:', error.message);
    return { success: false, error: error.message };
  }
}

export async function sendTelegramMessage(targetChatId, message, parseMode = 'HTML', replyMarkup = null) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const destChatId = targetChatId || process.env.TELEGRAM_CHAT_ID;

  if (!token || !destChatId || token.includes('YOUR_')) {
    console.log(`[TELEGRAM BOT SIMULATED] ChatId: ${destChatId || 'N/A'} | Content:\n${message}`);
    return { success: true, simulated: true };
  }

  try {
    const payload = {
      chat_id: destChatId,
      text: message,
      parse_mode: parseMode,
      disable_web_page_preview: true,
    };
    if (replyMarkup) {
      payload.reply_markup = replyMarkup;
    }

    let data = await postMessage(token, payload);
    if (!data.ok && /parse|entit|tag/i.test(data.description || '')) {
      data = await postMessage(token, { ...payload, text: stripHtml(message), parse_mode: undefined });
    }
    if (!data.ok) {
      console.warn('⚠️ Telegram Bot API returned error:', data.description);
      return { success: false, error: data.description };
    }

    return { success: true };
  } catch (error) {
    console.warn('⚠️ Telegram message send failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Sửa nội dung tin đã gửi. Đây là thứ biến chuỗi tin nhắn thành một MÀN HÌNH:
 * bấm nút thì tin cũ đổi nội dung tại chỗ, thay vì đẩy thêm một tin mới và để
 * Boss cuộn qua mười cái thẻ chết.
 *
 * Telegram trả lỗi "message is not modified" khi nội dung y hệt — không phải
 * hỏng, chỉ là bấm lại đúng nút đang mở, nên nuốt riêng lỗi đó.
 */
export async function editTelegramMessage(chatId, messageId, message, replyMarkup = null) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || !chatId || !messageId) return { success: false, error: 'missing_target' };

  const payload = {
    chat_id: chatId,
    message_id: messageId,
    text: message,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    ...(replyMarkup ? { reply_markup: replyMarkup } : { reply_markup: { inline_keyboard: [] } }),
  };

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    let data = await res.json();
    if (!data.ok && /parse|entit|tag/i.test(data.description || '')) {
      data = await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, text: stripHtml(message), parse_mode: undefined }),
      }).then((r) => r.json());
    }
    if (!data.ok && !/not modified/i.test(data.description || '')) {
      console.warn('⚠️ Telegram editMessageText:', data.description);
      return { success: false, error: data.description };
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Hỏi Boss một câu và mở sẵn ô nhập bên dưới (ForceReply). Dùng cho tra cứu tự
 * do: gõ gì cũng được — email, tên, slug hay số điện thoại.
 */
export async function askTelegramInput(chatId, question, placeholder = 'Nhập nội dung…') {
  return sendTelegramMessage(chatId, question, 'HTML', {
    force_reply: true,
    input_field_placeholder: placeholder.slice(0, 64),
    selective: false,
  });
}

export default {
  sendTelegramAlert,
  editTelegramMessage,
  askTelegramInput,
  sendTelegramMessage,
};
