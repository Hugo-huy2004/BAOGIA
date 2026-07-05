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

// Realistic modern Vietnamese names + Gen Z nicknames for the "làm quen" bot
// persona, so the character reads like a real 2k*-gen student, not an AI.
const DATING_NAMES = ['Gia Bảo', 'Minh Khang', 'Nhật Minh', 'Đức Anh', 'Hoàng Phúc', 'Quang Huy', 'Hải Đăng', 'Tuấn Kiệt', 'Khánh Vy', 'Bảo Ngọc', 'Gia Hân', 'Tuệ Nhi', 'Thảo Vy', 'Phương Anh', 'Thiên An', 'Trúc Linh'];
const DATING_NICKS = ['Bin', 'Su', 'Na', 'Sam', 'Ken', 'Mèo', 'Bơ', 'Tôm', 'Miu', 'Đậu', 'Xu', 'Sóc', 'Cam', 'Nấm', 'Jerry', 'Bư'];
// Real community identity slang (how people actually self-describe in feeds).
const DATING_IDENTITIES = ['top', 'bot', 'cent', 'les', 'les fem', 'les sb', 'gay', 'bi', 'nam thẳng', 'nữ thẳng'];
// Interests that actually match the 2k10-and-later crowd.
const GENZ_INTERESTS = 'Liên Quân, Free Fire, Roblox, Genshin, TikTok, edit CapCut, nghe tlinh / HIEUTHUHAI / Wren Evans, cày phim, anime, sưu tầm blindbox / Labubu, pickleball, cầu lông, chụp ảnh gu, Discord';

// Shared voice guide — appended to every anonymous prompt. Short, dry, modern;
// the old bot read "sến" (cheesy) so this deliberately caps emotion & length.
const GENZ_STYLE = ` Văn phong: Gen Z đời 2k10 nhắn tin thật — câu NGẮN, tự nhiên, hơi lười viết hoa cũng được, chêm nhẹ teencode khi hợp ("ib", "khum", "hong", "z", "vv", "real"). TUYỆT ĐỐI không sến, không "các bạn ơi", không giọng văn mẫu; hạn chế dấu chấm than và từ cảm thán; tối đa 1 emoji hoặc không dùng. Được phép xuống dòng giữa các ý cho dễ đọc.`;

async function generateBotPost() {
  const r = Math.random();
  // 12% admin · 15% làm quen/hẹn hò · 20% khảo sát · 53% chủ đề — xen kẽ cho đa dạng.
  const mode = r < 0.12 ? 'admin' : r < 0.27 ? 'dating' : r < 0.47 ? 'survey' : 'topic';
  let prompt, category, senderName, senderEmail;

  if (mode === 'admin') {
    category = 'chia sẻ';
    senderName = 'Hugo Studio';
    senderEmail = ADMIN_EMAIL;
    prompt = `Bạn là Hugo Studio — nền tảng cộng đồng dành cho học sinh, sinh viên. Viết MỘT bài đăng NGẮN (tối đa 2 câu, tiếng Việt, tự nhiên, không sáo rỗng) giới thiệu ngẫu nhiên MỘT tính năng của nền tảng (chọn 1: thưởng JOY khi tương tác, trợ lý tâm lý HugoPSY, trang trí Deco Studio, trang Bio cá nhân, tiện ích HugoCoder/HugoRadio/HugoArcade, cộng đồng HugoCommunication). Hạn chế dấu chấm than, tối đa 1 emoji. Chỉ trả về nội dung bài viết, không tiêu đề, không markdown, không hashtag.`;
  } else if (mode === 'dating') {
    const name = DATING_NAMES[Math.floor(Math.random() * DATING_NAMES.length)];
    const nick = DATING_NICKS[Math.floor(Math.random() * DATING_NICKS.length)];
    const identity = DATING_IDENTITIES[Math.floor(Math.random() * DATING_IDENTITIES.length)];
    category = 'chia sẻ';
    senderName = 'Người ẩn danh';
    senderEmail = ANON_EMAIL;
    prompt = `Bạn là một bạn trẻ 18-22 tuổi đăng bài LÀM QUEN trên feed cộng đồng học sinh - sinh viên. Viết MỘT bài tự giới thiệu NGẮN (2-4 câu ngắn, tiếng Việt) theo đúng kiểu bài "tìm ny/tìm bạn" thật trên mạng hiện nay. Thông tin nhân vật: tên ${name}, biệt danh ${nick}, tự nhận là "${identity}" (dùng đúng từ này một cách tự nhiên như cách cộng đồng vẫn viết, KHÔNG dùng chữ "LGBT"). Nêu 2-3 sở thích chọn từ: ${GENZ_INTERESTS}. Nói ngắn gọn kiểu người muốn làm quen, kết bằng "ib mình nhé" hoặc tương tự. YÊU CẦU BẮT BUỘC: nội dung TRONG SÁNG, lịch sự, KHÔNG gợi dục / khiêu gợi / thô tục, nhân vật TỪ 18 TUỔI trở lên. Chỉ trả về nội dung bài viết, không tiêu đề, không markdown, không hashtag.`;
  } else if (mode === 'survey') {
    const theme = SURVEY_THEMES[Math.floor(Math.random() * SURVEY_THEMES.length)];
    category = 'câu hỏi';
    senderName = 'Người ẩn danh';
    senderEmail = ANON_EMAIL;
    prompt = `Bạn là một người dùng ẩn danh trên mạng xã hội học sinh - sinh viên. Viết MỘT bài khảo sát RẤT NGẮN (1-2 câu, tiếng Việt) hỏi cộng đồng về: ${theme}. Hỏi thẳng, tự nhiên như hỏi bạn bè, mời mọi người rep lựa chọn của họ. Chỉ trả về nội dung bài viết, không tiêu đề, không markdown, không hashtag.`;
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
    prompt = `Bạn là một người dùng ẩn danh trên mạng xã hội học sinh - sinh viên. Viết MỘT bài đăng NGẮN (2-3 câu ngắn, tiếng Việt, dễ hiểu, có thể hài khô, tuyệt đối không tục tĩu / sai lệch / chính trị nhạy cảm) về: ${t.label}.${t.category === 'câu hỏi' ? ' Kết thúc bằng một câu hỏi mở mời mọi người trả lời.' : ''} Chỉ trả về nội dung bài viết, không tiêu đề, không markdown, không hashtag.`;
  }

  // Anonymous (non-Admin) posts share the same Gen Z voice guide.
  if (senderEmail === ANON_EMAIL) prompt += GENZ_STYLE;

  const text = await callGemini(prompt);
  if (!text || text.length < 12) return false;

  const now = new Date();
  const isAnon = senderEmail === ANON_EMAIL;
  // Hugo Studio accents — anonymous posts (bot or human) share the same look,
  // so bot posts are indistinguishable from real anonymous members.
  const ANON_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'];
  await CommunityMessage.create({
    senderEmail,
    senderName,
    senderAvatar: '',
    senderSlug: '',
    anonymous: isAnon,
    anonColor: isAnon ? ANON_COLORS[Math.floor(Math.random() * ANON_COLORS.length)] : '',
    message: text.slice(0, 2000),
    location: { lat: 10.8, lng: 106.6 },
    sentiment: 'tích cực',
    category,
    status: 'approved',
    isBot: true,
    expiresAt: new Date(now.getTime() + EXPIRE_DAYS * 24 * 60 * 60 * 1000),
    createdAt: now,
  });
  console.log(`[CommunityBot] Posted (${mode} / ${category}).`);
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
