/**
 * Dịch vụ thông báo Telegram Bot hoàn toàn miễn phí.
 * Gửi tin nhắn cảnh báo khẩn cấp tới Telegram của Boss khi có sự cố,
 * hoặc ticket bực tức 🤬 / nghi vấn gian lận.
 */

export async function sendTelegramAlert(message, parseMode = 'HTML', replyMarkup = null) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId || token.includes('YOUR_')) {
    console.log(`[TELEGRAM BOT SIMULATED] ChatId: ${chatId || 'N/A'} | Content:\n${message}`);
    return { success: true, simulated: true };
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const payload = {
      chat_id: chatId,
      text: message,
      parse_mode: parseMode,
      disable_web_page_preview: true,
    };
    if (replyMarkup) {
      payload.reply_markup = replyMarkup;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
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
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const payload = {
      chat_id: destChatId,
      text: message,
      parse_mode: parseMode,
      disable_web_page_preview: true,
    };
    if (replyMarkup) {
      payload.reply_markup = replyMarkup;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
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

export default {
  sendTelegramAlert,
  sendTelegramMessage,
};
