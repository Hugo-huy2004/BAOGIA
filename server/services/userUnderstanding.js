import UserProfile from '../models/UserProfile.js';
import { embedText } from './embeddingService.js';

// Lightweight keyword → topic tagging (Vietnamese-first). Cheap, deterministic,
// no API cost — good enough to build an interest profile from post/comment text.
const TOPICS = {
  game: ['game', 'gaming', 'chơi game', 'liên quân', 'lienquan', 'esports', 'tướng', 'rank', 'valorant', 'lol'],
  anime: ['anime', 'manga', 'otaku', 'waifu', 'cosplay', 'nhân vật anime', 'one piece', 'naruto'],
  pokemon: ['pokemon', 'pokémon', 'pikachu', 'pokedex'],
  study: ['học', 'bài tập', 'thi', 'deadline', 'môn', 'trường', 'đại học', 'kiến thức', 'ôn', 'điểm'],
  tech: ['code', 'lập trình', 'react', 'python', 'ai', 'công nghệ', 'máy tính', 'developer', 'web', 'app'],
  health: ['sức khỏe', 'ngủ', 'tập', 'gym', 'ăn uống', 'dinh dưỡng', 'chạy bộ'],
  mental: ['tâm lý', 'stress', 'lo âu', 'buồn', 'cảm xúc', 'động lực', 'áp lực', 'cô đơn', 'mệt mỏi'],
  science: ['vật lý', 'khoa học', 'vũ trụ', 'hoá', 'sinh học', 'bí ẩn', 'thí nghiệm'],
  news: ['tin tức', 'thời sự', 'mới nhất', 'sự kiện', 'ra mắt'],
};

// Vietnamese label used to build the embedding text for each topic.
const TOPIC_VI = {
  game: 'trò chơi điện tử esports', anime: 'anime manga nhân vật', pokemon: 'pokémon',
  study: 'học tập thi cử kiến thức', tech: 'lập trình công nghệ máy tính',
  health: 'sức khỏe thể chất luyện tập', mental: 'sức khỏe tinh thần cảm xúc động lực',
  science: 'khoa học vật lý vũ trụ', news: 'tin tức đời sống', qna: 'hỏi đáp thảo luận',
  general: 'đời sống sinh viên',
};

export function extractTopics(text = '', category = '') {
  const t = `${text} ${category}`.toLowerCase();
  const found = [];
  for (const [topic, kws] of Object.entries(TOPICS)) {
    if (kws.some((k) => t.includes(k))) found.push(topic);
  }
  if (category === 'câu hỏi') found.push('qna');
  return found.length ? found : ['general'];
}

const DECAY = 0.985; // recent interests weigh more; old ones fade

// Record a behaviour signal (fire-and-forget from routes). Never throws.
export async function recordSignal(email, { text = '', category = '', weight = 1, hour = null } = {}) {
  if (!email) return;
  try {
    const topics = extractTopics(text, category);
    let profile = await UserProfile.findOne({ email });
    if (!profile) profile = new UserProfile({ email });
    for (const topic of topics) {
      const cur = profile.interests.get(topic) || 0;
      profile.interests.set(topic, Number((cur * DECAY + weight).toFixed(3)));
    }
    const h = hour == null ? new Date().getHours() : hour;
    if (h >= 0 && h < 24) {
      const arr = profile.activeHours?.length === 24 ? profile.activeHours : new Array(24).fill(0);
      arr[h] = (arr[h] || 0) + 1;
      profile.activeHours = arr;
    }
    profile.engagementCount = (profile.engagementCount || 0) + 1;
    profile.lastSignalAt = new Date();
    await profile.save();
  } catch (e) {
    console.warn('[recordSignal]', e.message);
  }
}

export async function getTopInterests(email, n = 6) {
  const p = await UserProfile.findOne({ email }).lean();
  if (!p || !p.interests) return [];
  return Object.entries(p.interests)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([topic, weight]) => ({ topic, weight: Number(weight) }));
}

// Peak activity hour (for smart notification timing).
export async function getPeakHour(email) {
  const p = await UserProfile.findOne({ email }).lean();
  if (!p || !Array.isArray(p.activeHours)) return null;
  let best = -1, bestVal = 0;
  p.activeHours.forEach((v, h) => { if (v > bestVal) { bestVal = v; best = h; } });
  return best >= 0 ? best : null;
}

// (Re)build the interest embedding from the user's top topics.
export async function refreshInterestEmbedding(email) {
  const top = await getTopInterests(email, 6);
  if (!top.length) return null;
  const text = top.map((t) => TOPIC_VI[t.topic] || t.topic).join(', ');
  const vec = await embedText(text);
  if (vec) {
    await UserProfile.updateOne({ email }, { interestEmbedding: vec, interestEmbeddingAt: new Date() });
  }
  return vec;
}

// Read the interest embedding (opt-in select) for feed ranking.
export async function getInterestEmbedding(email) {
  const p = await UserProfile.findOne({ email }).select('+interestEmbedding').lean();
  return { vec: (p?.interestEmbedding && p.interestEmbedding.length) ? p.interestEmbedding : null, at: p?.interestEmbeddingAt || null };
}

// Aggregate the community's collective top interests — powers the bot's
// "post better / understand the majority" learning loop.
let popularCache = { at: 0, topics: [] };
export async function getPopularTopics(limit = 4) {
  if (Date.now() - popularCache.at < 30 * 60 * 1000 && popularCache.topics.length) {
    return popularCache.topics;
  }
  try {
    const profiles = await UserProfile.find({}, 'interests').limit(3000).lean();
    const totals = {};
    for (const p of profiles) {
      if (!p.interests) continue;
      for (const [topic, w] of Object.entries(p.interests)) {
        if (topic === 'general' || topic === 'qna') continue;
        totals[topic] = (totals[topic] || 0) + Number(w);
      }
    }
    const topics = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([t]) => t);
    popularCache = { at: Date.now(), topics };
    return topics;
  } catch (e) {
    console.warn('[getPopularTopics]', e.message);
    return popularCache.topics;
  }
}
