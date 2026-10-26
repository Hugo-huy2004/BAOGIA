// Canh cửa chat nhân vật đồng hành: tục tĩu, xâm nhập/phá hoại, gọi dồn dập.
// Luật: cảnh cáo lần 1 và 2, lần 3 trong 7 ngày → khoá tài khoản (màn khoá có
// sẵn đường gửi mail cho admin). Đếm chung một sổ "companion_abuse".
//
// AN TOÀN NGƯỜI DÙNG: đây là app sức khoẻ tinh thần. Câu có dấu hiệu khủng hoảng
// KHÔNG BAO GIỜ bị tính lỗi, dù có chửi thề — người đang suy sụp cần được đỡ,
// không cần cảnh cáo. Client đã bắt khủng hoảng trước; ở đây chặn thêm một lần.
import { readFileSync } from 'node:fs';
import { assessHugoPsyContent, recordSecurityViolation } from './securityEnforcement.js';

// Danh sách gốc: github.com/blue-eyes-vn/vietnamese-offensive-words (MIT). Đã bỏ
// mọi dạng không dấu trùng từ thường ("ngu" = ngủ, "cac" = các, "cu" = cũ) và
// từ có dấu mang nghĩa thường ngày ("hãm" trà, "xoạc" chân, "dái" tai). Kiểm
// 0 bắt nhầm trên 543 mẫu câu intent.
const { words } = JSON.parse(readFileSync(new URL('../data/viProfanity.json', import.meta.url), 'utf8'));
const escape = (w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
// Biên từ theo chữ Unicode: \b của JS không hiểu chữ có dấu.
const PROFANITY = new RegExp(`(?<![\\p{L}\\p{N}])(?:${words.map(escape).join('|')})(?![\\p{L}\\p{N}])`, 'iu');
const CRISIS = /(tự\s*tử|tự\s*sát|kết\s*liễu|không\s*muốn\s*sống|muốn\s*chết|tự\s*làm\s*đau|tu\s*tu|tu\s*sat|muon\s*chet|khong\s*muon\s*song)/i;

export const hasProfanity = (text) => PROFANITY.test(String(text || ''));

// Gọi dồn dập: người thật gõ không nổi 15 tin/phút. Mỗi đợt dồn chỉ tính MỘT
// lỗi trong 10 phút, để một tab bị lỗi lặp vô hạn không tự khoá chính chủ
// trong vài giây — muốn tới lần 3 phải dồn ba đợt cách nhau.
// ponytail: bộ nhớ tiến trình; Render chạy một tiến trình nên đủ.
const FLOOD_PER_MINUTE = 15;
const FLOOD_COOLDOWN_MS = 10 * 60 * 1000;
const hits = new Map();
const lastFloodStrike = new Map();

function isFlooding(email) {
  const now = Date.now();
  const recent = (hits.get(email) || []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(email, recent);
  if (hits.size > 5000) hits.delete(hits.keys().next().value);
  if (recent.length <= FLOOD_PER_MINUTE) return false;
  if (now - (lastFloodStrike.get(email) || 0) < FLOOD_COOLDOWN_MS) return false;
  lastFloodStrike.set(email, now);
  return true;
}

const WARNINGS = {
  profanity: 'Tớ vẫn ở đây nghe cậu, nhưng mình nói chuyện nhẹ nhàng hơn một chút nha. Cậu có thể kể tớ nghe điều gì đang làm cậu bực đến vậy không?',
  flood: 'Tin nhắn tới dồn dập quá, tớ đọc không kịp. Mình nói chậm lại từng câu nha.',
  attack: 'Tớ không giúp được việc này đâu. Mình quay lại chuyện của cậu nhé?',
};

/**
 * null = cho qua. Ngược lại trả { status, body } để route gửi thẳng:
 * 200 + warning ở lần 1–2 (client hiện như lời nhân vật), 403 ACCESS_BLOCKED ở lần 3.
 */
export async function guardCompanionMessage(req, text) {
  const value = String(text || '');
  const email = req.memberEmail;
  const flooding = isFlooding(email);
  if (CRISIS.test(value)) return null;

  const threat = assessHugoPsyContent(value);
  // Đe doạ bạo lực có thật vẫn khoá ngay theo luật cũ, không đợi ba lần.
  const immediate = threat?.enforcement === 'immediate';
  const kind = threat ? 'attack' : hasProfanity(value) ? 'profanity' : flooding ? 'flood' : null;
  if (!kind) return null;

  const result = await recordSecurityViolation({
    req,
    email,
    category: immediate ? threat.category : 'companion_abuse',
    severity: threat?.severity || 'high',
    ruleId: threat?.ruleId || `companion_${kind}`,
    evidence: value.slice(0, 500),
    enforcement: immediate ? 'immediate' : 'strikes',
    // Tục tĩu/dồn dập không đáng làm phiền Boss; xâm nhập thì có.
    notify: kind === 'attack',
  });
  if (result.block) return { status: 403, block: result.block };
  return { status: 200, body: { warning: WARNINGS[kind], strike: result.strike } };
}
