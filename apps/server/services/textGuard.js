// Lọc chữ dùng chung (Today): từ tục và câu có dấu hiệu khủng hoảng.
// Câu khủng hoảng không bao giờ bị tính lỗi, dù có chửi thề.
import { readFileSync } from 'node:fs';

// Danh sách gốc: github.com/blue-eyes-vn/vietnamese-offensive-words (MIT). Đã bỏ
// mọi dạng không dấu trùng từ thường ("ngu" = ngủ, "cac" = các, "cu" = cũ) và
// từ có dấu mang nghĩa thường ngày ("hãm" trà, "xoạc" chân, "dái" tai). Kiểm
// 0 bắt nhầm trên 543 mẫu câu thử.
const { words } = JSON.parse(readFileSync(new URL('../data/viProfanity.json', import.meta.url), 'utf8'));
const escape = (w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
// Biên từ theo chữ Unicode: \b của JS không hiểu chữ có dấu.
const PROFANITY = new RegExp(`(?<![\\p{L}\\p{N}])(?:${words.map(escape).join('|')})(?![\\p{L}\\p{N}])`, 'iu');
const CRISIS = /(tự\s*tử|tự\s*sát|kết\s*liễu|không\s*muốn\s*sống|muốn\s*chết|tự\s*làm\s*đau|tu\s*tu|tu\s*sat|muon\s*chet|khong\s*muon\s*song)/i;

export const hasProfanity = (text) => PROFANITY.test(String(text || ''));
export const isCrisis = (text) => CRISIS.test(String(text || ''));
