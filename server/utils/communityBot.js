import cron from 'node-cron';
import CommunityMessage from '../models/CommunityMessage.js';
import { getPopularTopics } from '../services/userUnderstanding.js';

// Bot topic labels aligned to the community's aggregate interest topics, so the
// auto-poster leans toward what the majority actually engages with.
const POPULAR_LABEL = {
  game: 'một câu chuyện hoặc tin thú vị về thế giới game',
  anime: 'một fun fact thú vị về một nhân vật anime nổi tiếng',
  pokemon: 'một điều bất ngờ, thú vị về thế giới Pokémon',
  study: 'một tip học tập / ôn thi hiệu quả cho sinh viên',
  tech: 'một tin công nghệ hoặc lập trình mới lạ, hữu ích',
  health: 'một mẹo giữ sức khỏe cho sinh viên bận rộn',
  mental: 'một lời khuyên nhẹ nhàng về sức khỏe tinh thần cho sinh viên',
  science: 'một hiện tượng khoa học / vật lý bí ẩn thú vị',
  news: 'một tin tức đời sống mới lạ, hữu ích cho sinh viên',
};

// ─── HugoCommunication AI auto-poster ────────────────────────────────────────
// Uses the existing Gemini (HugoPSY) model to auto-publish light "advertising"/
// engagement posts so the feed always has fresh content for members to interact
// with. Posts appear as an anonymous user (or occasionally as Hugo Studio Admin),
// are pre-approved (AI wrote them, no moderation queue) and self-destruct after
// 7 days via the CommunityMessage TTL index (`expiresAt`).
//
// Cadence: one post per 30 minutes, capped at 10 posts/day (DB-counted, so
// server restarts never overshoot the daily limit).

const MODEL = process.env.GEMINI_MODERATION_MODEL || 'gemini-2.5-flash';
const DAILY_LIMIT = 20;
const EXPIRE_DAYS = 7;
// Reusing the owner's verified email makes Admin intro posts show the blue tick
// + "Hugo Studio" identity in the feed (frontend verified check keys off it).
const ADMIN_EMAIL = process.env.ADMIN_BOT_EMAIL || 'huylggcs230377@fpt.edu.vn';
const ANON_EMAIL = 'anon-bot@hugo.studio';

// Allowed topics (per product spec) + fun/entertainment themes. Liên Quân,
// anime and games are posted as open questions to spark discussion.
const TOPICS = [
  { label: 'một tin tức công nghệ hoặc đời sống mới lạ, hữu ích cho sinh viên', category: 'chia sẻ' },
  { label: 'một tip / mẹo kiến thức mới lạ, ít người biết', category: 'chia sẻ' },
  { label: 'một hiện tượng vật lý hoặc khoa học bí ẩn thú vị', category: 'chia sẻ' },
  { label: 'một lời khuyên nhẹ nhàng về sức khỏe tinh thần cho sinh viên', category: 'chia sẻ' },
  { label: 'một sự thật bí mật thú vị về tâm lý / hành vi con người', category: 'chia sẻ' },
  { label: 'một câu chuyện vui, hài hước, "xàm xí" về thế giới game để mọi người cười', category: 'chia sẻ' },
  { label: 'một sự thật thú vị hoặc "fun fact" về một nhân vật anime nổi tiếng', category: 'chia sẻ' },
  { label: 'một điều thú vị, bất ngờ về thế giới Pokémon', category: 'chia sẻ' },
  { label: 'một câu hỏi mở, vui về game Liên Quân Mobile để mọi người cùng thảo luận', category: 'câu hỏi' },
  { label: 'một câu hỏi vui về anime để mọi người cùng bàn luận', category: 'câu hỏi' },
];

// Survey/poll themes — the bot occasionally asks the community about their
// favourites so we can sense majority tastes and post more relevant content.
const SURVEY_THEMES = [
  'nhân vật anime yêu thích nhất của bạn',
  'Pokémon "chân ái" của bạn',
  'vị tướng Liên Quân bạn hay dùng nhất',
  'thể loại game khiến bạn nghiện nhất',
  'nhân vật game hoặc anime bạn muốn cosplay',
  'bộ anime bạn muốn giới thiệu cho mọi người',
];

async function callGemini(prompt) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }] }),
      }
    );
    if (!res.ok) throw new Error('gemini ' + res.status);
    const data = await res.json();
    return (data.candidates?.[0]?.content?.parts?.[0]?.text || '')
      .replace(/```/g, '')
      .replace(/^["'#\s]+|["'\s]+$/g, '')
      .trim();
  } catch (e) {
    console.error('[CommunityBot] gemini failed:', e.message);
    return null;
  }
}

async function generateBotPost() {
  const r = Math.random();
  // 12% admin · 15% làm quen/hẹn hò · 20% khảo sát · 53% chủ đề — xen kẽ cho đa dạng.
  const mode = r < 0.12 ? 'admin' : r < 0.27 ? 'dating' : r < 0.47 ? 'survey' : 'topic';
  let prompt, category, senderName, senderEmail;

  if (mode === 'admin') {
    category = 'chia sẻ';
    senderName = 'Hugo Studio';
    senderEmail = ADMIN_EMAIL;
    prompt = `Bạn là Hugo Studio — nền tảng cộng đồng dành cho học sinh, sinh viên. Viết MỘT bài đăng NGẮN (2-3 câu, tiếng Việt, thân thiện, mời gọi) giới thiệu ngẫu nhiên MỘT tính năng của nền tảng (chọn 1: thưởng JOY khi tương tác, trợ lý tâm lý HugoPSY, trang trí Deco Studio, trang Bio cá nhân, tiện ích HugoCoder/HugoRadio/HugoArcade, cộng đồng HugoCommunication). Chỉ trả về nội dung bài viết, không tiêu đề, không markdown, không hashtag.`;
  } else if (mode === 'dating') {
    const lgbt = Math.random() < 0.6; // 60% LGBT+ · 40% khác giới
    category = 'chia sẻ';
    senderName = 'Người ẩn danh';
    senderEmail = ANON_EMAIL;
    prompt = `Bạn là một bạn sinh viên (18-24 tuổi) vui vẻ, dễ thương trên mạng xã hội sinh viên. Viết MỘT bài tự giới thiệu NGẮN để LÀM QUEN / KẾT BẠN (3-5 câu, tiếng Việt, phong cách gen Z thân thiện, có thể mở đầu kiểu "Chào mọi người, tớ là ..."). ${lgbt ? 'Nhân vật thuộc cộng đồng LGBT+ và muốn tìm người hợp gu để trò chuyện, hẹn hò lành mạnh.' : 'Nhân vật muốn tìm một người bạn khác giới hợp gu để trò chuyện, hẹn hò lành mạnh.'} Hãy đặt một tên gọi dễ thương, nêu vài sở thích và kiểu người muốn làm quen. YÊU CẦU BẮT BUỘC: nội dung TRONG SÁNG, lịch sự, KHÔNG gợi dục / khiêu gợi / thô tục, nhân vật phải TỪ 18 TUỔI trở lên (tuyệt đối không nhắc tuổi vị thành niên). Chỉ trả về nội dung bài viết, không tiêu đề, không markdown, không hashtag.`;
  } else if (mode === 'survey') {
    const theme = SURVEY_THEMES[Math.floor(Math.random() * SURVEY_THEMES.length)];
    category = 'câu hỏi';
    senderName = 'Người ẩn danh';
    senderEmail = ANON_EMAIL;
    prompt = `Bạn là một người dùng ẩn danh vui vẻ trên mạng xã hội sinh viên. Viết MỘT bài khảo sát NGẮN (1-2 câu, tiếng Việt, vui, thân thiện) hỏi cộng đồng về: ${theme}. Mời mọi người bình luận lựa chọn của họ và lý do. Chỉ trả về nội dung bài viết, không tiêu đề, không markdown, không hashtag.`;
  } else {
    // Learning loop: 55% of the time steer toward the community's popular topics.
    let t = null;
    if (Math.random() < 0.55) {
      const pop = await getPopularTopics(4);
      const labels = pop.map((k) => POPULAR_LABEL[k]).filter(Boolean);
      if (labels.length) t = { label: labels[Math.floor(Math.random() * labels.length)], category: 'chia sẻ' };
    }
    if (!t) t = TOPICS[Math.floor(Math.random() * TOPICS.length)];
    category = t.category;
    senderName = 'Người ẩn danh';
    senderEmail = ANON_EMAIL;
    prompt = `Bạn là một người dùng ẩn danh thân thiện trên mạng xã hội sinh viên. Viết MỘT bài đăng NGẮN (2-4 câu, tiếng Việt, tích cực, dễ hiểu, có thể hài hước, tuyệt đối không tục tĩu / sai lệch / chính trị nhạy cảm) về: ${t.label}.${t.category === 'câu hỏi' ? ' Kết thúc bằng một câu hỏi mở mời mọi người trả lời.' : ''} Chỉ trả về nội dung bài viết, không tiêu đề, không markdown, không hashtag.`;
  }

  // Anonymous (non-Admin) posts get a fun Gen Z / teencode voice.
  if (senderEmail === ANON_EMAIL) {
    prompt += ' Viết theo văn phong Gen Z, chèn một chút teencode / tiếng lóng phổ biến cho tự nhiên và vui (ví dụ: "ib", "u là trời", "gét gô", "chằm zn", "khum", "dzậy", "j z tr", "hong"), nhưng vẫn dễ hiểu, không lạm dụng quá đà.';
  }

  const text = await callGemini(prompt);
  if (!text || text.length < 12) return false;

  const now = new Date();
  await CommunityMessage.create({
    senderEmail,
    senderName,
    senderAvatar: '',
    senderSlug: '',
    message: text.slice(0, 2000),
    location: { lat: 10.8, lng: 106.6 },
    sentiment: 'tích cực',
    category,
    status: 'approved',
    isBot: true,
    expiresAt: new Date(now.getTime() + EXPIRE_DAYS * 24 * 60 * 60 * 1000),
    createdAt: now,
  });
  console.log(`[CommunityBot] Posted (${isAdmin ? 'admin' : 'anon'} / ${category}).`);
  return true;
}

async function tick() {
  try {
    if (!process.env.GEMINI_API_KEY) return;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todayCount = await CommunityMessage.countDocuments({ isBot: true, createdAt: { $gte: startOfDay } });
    if (todayCount >= DAILY_LIMIT) return;
    await generateBotPost();
  } catch (e) {
    console.error('[CommunityBot] tick failed:', e.message);
  }
}

let started = false;
export function initCommunityBot() {
  if (started) return;
  started = true;
  // Every 15 minutes. The DB day-count caps it at DAILY_LIMIT posts/day.
  cron.schedule('*/15 * * * *', tick);
  console.log(`[CommunityBot] scheduler started (every 15 min, max ${DAILY_LIMIT} posts/day).`);
}
