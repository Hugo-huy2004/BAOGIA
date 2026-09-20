// Soát khảo sát định kỳ. KHÔNG cần DB, KHÔNG cần mạng.
//
// Hai luật ở đây là lời hứa với người dùng, không phải tuỳ chọn: không lặp câu
// trong một năm, và không hỏi về thứ họ chưa từng dùng. Cả hai đều là loại lỗi
// không ai báo — người ta chỉ lặng lẽ thôi trả lời. Nên phải mô phỏng đủ 12
// tháng ở đây mới biết bộ câu hỏi có thật sự đủ không.
//
// Chạy: npm run check:survey
import {
  buildSurvey, renderQuestion, parseQuestionId, scoreOf, isPositive,
  APP_TEMPLATES, SYSTEM_TEMPLATES, SURVEY_ANSWERS, QUESTIONS_PER_ROUND,
  MIN_OPENS, RECENT_DAYS, NO_REPEAT_DAYS, eligibleApps, isLiveApp,
} from '../../shared/surveyQuestions.js';
import { APP_REGISTRY, RETIRED_APP_IDS } from '../../shared/appRegistry.js';

let failed = 0;
const check = (ok, label) => { console.log(`${ok ? '✅' : '❌'} ${label}`); if (!ok) failed++; };

const LANGS = ['vi', 'en', 'zh'];
const ALL = [...APP_TEMPLATES, ...SYSTEM_TEMPLATES];

// ── 1. BỘ CÂU HỎI LÀNH LẶN ───────────────────────────────────────────────────
const ids = ALL.map((t) => t.id);
check(new Set(ids).size === ids.length, `không có id trùng (${ids.length} template)`);
check(ALL.every((t) => LANGS.every((l) => typeof t[l] === 'string' && t[l].trim())),
  'mọi template có đủ ba ngôn ngữ vi/en/zh');
check(APP_TEMPLATES.every((t) => LANGS.every((l) => t[l].includes('{{app}}'))),
  'câu hỏi về ứng dụng có {{app}} ở CẢ ba ngôn ngữ (thiếu một bản là câu cụt)');
check(SYSTEM_TEMPLATES.every((t) => LANGS.every((l) => !t[l].includes('{{app}}'))),
  'câu hỏi hệ thống KHÔNG có {{app}} (không có app nào để thay vào)');
check(ALL.every((t) => LANGS.every((l) => t[l].trim().endsWith('?') || t[l].trim().endsWith('？'))),
  'mọi câu đều là câu hỏi, kết thúc bằng dấu hỏi');
check(ALL.every((t) => t.facet), 'mọi template có khía cạnh (facet) để gom báo cáo');

// Chiều âm phải được khai. Đây là lỗi im lặng nguy hiểm nhất của cả hệ: quên
// `negative` thì app bị chê nhiều nhất sẽ leo lên đầu bảng "được khen nhất".
const NEGATIVE_MUST = ['feature.guess', 'feature.broken', 'notify.many', 'joy.limit'];
for (const id of NEGATIVE_MUST) {
  check(ALL.find((t) => t.id === id)?.negative === true, `"${id}" khai negative (Có = tin xấu)`);
}
check(ALL.filter((t) => t.negative).length === NEGATIVE_MUST.length,
  'không có câu âm nào ngoài danh sách đã biết — thêm câu âm thì phải khai vào đây');

// ── 2. KHÔNG LẶP TRONG MỘT NĂM ───────────────────────────────────────────────
// Mô phỏng đúng cách dùng thật: mỗi tháng lấy một đợt, dồn vào lịch sử, tháng
// sau lấy tiếp.
const simulateYear = (usedApps, months = 12) => {
  const asked = [];
  const rounds = [];
  for (let m = 1; m <= months; m += 1) {
    const round = buildSurvey({
      usedApps, askedIds: asked, seed: `nguoi@vidu.com2026-${String(m).padStart(2, '0')}`,
    });
    rounds.push(round);
    asked.push(...round.map((q) => q.id));
  }
  return { asked, rounds };
};

const heavy = simulateYear(['vocab', 'arcade', 'study', 'psychology', 'bio']);
check(new Set(heavy.asked).size === heavy.asked.length,
  `người dùng 5 ứng dụng: ${heavy.asked.length} câu trong 12 tháng, KHÔNG câu nào lặp`);
check(heavy.rounds.every((r) => r.length === QUESTIONS_PER_ROUND),
  `đủ ${QUESTIONS_PER_ROUND} câu mỗi tháng suốt 12 tháng (bộ câu hỏi không cạn)`);

// Người chỉ dùng MỘT ứng dụng: bộ câu ít hơn hẳn, nhưng vẫn không được lặp.
const light = simulateYear(['vocab']);
check(new Set(light.asked).size === light.asked.length,
  `người dùng 1 ứng dụng: ${light.asked.length} câu, vẫn không lặp câu nào`);

// Người MỚI TOANH, chưa dùng app nào: chỉ còn câu hệ thống.
const fresh = simulateYear([]);
check(new Set(fresh.asked).size === fresh.asked.length,
  `người chưa dùng ứng dụng nào: ${fresh.asked.length} câu hệ thống, không lặp`);
check(fresh.asked.length <= SYSTEM_TEMPLATES.length,
  'không bịa thêm câu khi chỉ có câu hệ thống');

// Cạn bộ câu thì HỎI ÍT ĐI, tuyệt đối không quay vòng lại từ đầu.
const exhausted = buildSurvey({ usedApps: ['vocab'], askedIds: ids.flatMap((id) => [id, `${id}:vocab`]), seed: 'x' });
check(exhausted.length === 0, 'hỏi hết bộ câu → trả về RỖNG, không quay vòng hỏi lại');

// ── 3. KHÔNG HỎI THỨ CHƯA TỪNG DÙNG ──────────────────────────────────────────
const used = ['vocab', 'arcade'];
const everyAppQuestion = simulateYear(used, 24).asked
  .map(parseQuestionId).filter((p) => p.appId);
check(everyAppQuestion.every((p) => used.includes(p.appId)),
  'suốt 24 tháng, không một câu nào hỏi về ứng dụng chưa dùng');
check(buildSurvey({ usedApps: [], askedIds: [], seed: 'x' }).every((q) => q.appId === ''),
  'không có ứng dụng nào đã dùng → không sinh câu hỏi về ứng dụng');

// Ba tầng lọc "đã trải nghiệm chưa". Đây là chỗ thực thi lời hứa "không hỏi vô
// lý khi người dùng chưa từng trải nghiệm" — buildSurvey chỉ tin danh sách nó
// được đưa, nên nếu tầng này hở thì không còn gì chặn nữa.
const NOW = new Date('2026-09-20T00:00:00Z');
const daysAgo = (n) => new Date(NOW.getTime() - n * 86400000);

check(eligibleApps({ vocab: MIN_OPENS }, { vocab: NOW }, NOW).includes('vocab'),
  `dùng đủ ${MIN_OPENS} ngày và còn mới → được hỏi`);
check(!eligibleApps({ vocab: MIN_OPENS - 1 }, { vocab: NOW }, NOW).includes('vocab'),
  `mới dùng ${MIN_OPENS - 1} ngày → CHƯA được hỏi (liếc qua không phải trải nghiệm)`);
check(!eligibleApps({ vocab: 50 }, { vocab: daysAgo(RECENT_DAYS + 1) }, NOW).includes('vocab'),
  `bỏ quên quá ${RECENT_DAYS} ngày → thôi hỏi, dù trước kia dùng rất nhiều`);
check(eligibleApps({ vocab: 50 }, { vocab: daysAgo(RECENT_DAYS - 1) }, NOW).includes('vocab'),
  'vừa đúng trong hạn → vẫn hỏi');
check(!eligibleApps({ vocab: 50 }, {}, NOW).includes('vocab'),
  'có số lần dùng nhưng KHÔNG biết dùng khi nào → không hỏi (thà bỏ sót còn hơn hỏi bừa)');

const retiredIds = [...RETIRED_APP_IDS];
if (retiredIds.length) {
  const opens = Object.fromEntries(retiredIds.map((id) => [id, 99]));
  const at = Object.fromEntries(retiredIds.map((id) => [id, NOW]));
  check(eligibleApps(opens, at, NOW).length === 0,
    `${retiredIds.length} ứng dụng đã nghỉ hưu bị loại hết — không ai phải đánh giá thứ đã bị gỡ`);
  check(retiredIds.every((id) => !isLiveApp(id)), 'isLiveApp nhận ra ứng dụng đã nghỉ hưu');
}
check(eligibleApps({ khong_co_app_nay: 99 }, { khong_co_app_nay: NOW }, NOW).length === 0,
  'id ứng dụng lạ → loại, không tin dữ liệu cũ trong database');
check(eligibleApps().length === 0 && eligibleApps(null, null, NOW).length === 0,
  'người chưa có nhật ký dùng → mảng rỗng, không ném lỗi');

const eligibleOrder = eligibleApps({ zulu: 9, bio: 9, vocab: 9 },
  { zulu: NOW, bio: NOW, vocab: NOW }, NOW);
check(JSON.stringify(eligibleOrder) === JSON.stringify([...eligibleOrder].sort()),
  'thứ tự ổn định (đã sắp xếp) — nếu không, cùng một người tải lại sẽ ra đề khác');

// ── 4. CÙNG NGƯỜI + CÙNG THÁNG = CÙNG ĐỀ ─────────────────────────────────────
// Tải lại trang không được đổi câu hỏi: người đang đọc dở một câu mà nó nhảy
// sang câu khác thì họ mất niềm tin vào cả bảng khảo sát.
const a = buildSurvey({ usedApps: ['vocab', 'bio'], askedIds: [], seed: 'ai@do.com2026-09' });
const b = buildSurvey({ usedApps: ['vocab', 'bio'], askedIds: [], seed: 'ai@do.com2026-09' });
check(JSON.stringify(a) === JSON.stringify(b), 'cùng người + cùng tháng → đúng cùng bộ câu');
const c = buildSurvey({ usedApps: ['vocab', 'bio'], askedIds: [], seed: 'ai@do.com2026-10' });
check(JSON.stringify(a) !== JSON.stringify(c), 'sang tháng khác → bộ câu khác');

// ── 5. KHÔNG DỒN MỘT KHÍA CẠNH ───────────────────────────────────────────────
for (let m = 1; m <= 12; m += 1) {
  const round = buildSurvey({ usedApps: ['vocab', 'arcade', 'study'], askedIds: [], seed: `s${m}` });
  const keys = round.map((q) => `${q.facet}:${q.appId}`);
  if (new Set(keys).size !== keys.length) {
    check(false, `đợt seed s${m} có hai câu cùng khía cạnh: ${keys.join(', ')}`);
  }
}
check(true, 'không đợt nào hỏi hai câu cùng khía cạnh về cùng một ứng dụng');

// ── 6. DỰNG CHỮ ──────────────────────────────────────────────────────────────
const rendered = renderQuestion('fit.need:vocab', 'vi', 'Hoa Ngữ');
check(rendered?.text === 'Hoa Ngữ có làm được đúng việc Quý thành viên cần không?',
  `thay tên ứng dụng đúng chỗ ("${rendered?.text}")`);
check(!renderQuestion('fit.need:vocab', 'en', 'Chinese').text.includes('{{'),
  'không còn chỗ trống {{app}} sau khi dựng');
check(renderQuestion('khong.ton.tai:vocab') === null, 'khoá lạ → null, không ném lỗi');
check(renderQuestion('joy.fair', 'ko')?.text === renderQuestion('joy.fair', 'vi')?.text,
  'ngôn ngữ chưa hỗ trợ → rơi về tiếng Việt, không trả undefined');
check(LANGS.every((l) => SURVEY_ANSWERS.every((k) => renderQuestion('joy.fair', l).labels[k])),
  'ba nút Có/Không/Không chắc có nhãn ở cả ba ngôn ngữ');

// ── 7. TÍNH ĐIỂM ─────────────────────────────────────────────────────────────
check(isPositive('yes', false) === true && isPositive('no', false) === false,
  'câu thường: Có = tốt');
check(isPositive('yes', true) === false && isPositive('no', true) === true,
  'câu âm: Có = XẤU (đây là chỗ dễ cộng ngược nhất)');
check(isPositive('unsure') === null, '"không chắc" không tính về phe nào');

check(scoreOf([{ answer: 'yes' }, { answer: 'yes' }, { answer: 'no' }]).score === 67,
  '2 Có / 1 Không → 67 điểm');
check(scoreOf([{ answer: 'yes', negative: true }]).score === 0,
  'một câu âm trả lời Có → 0 điểm, không phải 100');
check(scoreOf([{ answer: 'unsure' }]).score === null,
  'toàn "không chắc" → KHÔNG có điểm (null), không phải 0 điểm');
check(scoreOf([]).score === null, 'chưa ai trả lời → null, không phải 0');
const mixed = scoreOf([{ answer: 'yes' }, { answer: 'unsure' }, { answer: 'no' }]);
check(mixed.counted === 2 && mixed.unsure === 1, 'đếm tách "không chắc" ra khỏi mẫu tính điểm');

// ── 8. HẰNG SỐ HỢP LÝ ────────────────────────────────────────────────────────
check(MIN_OPENS >= 2, `phải mở ít nhất ${MIN_OPENS} lần mới bị hỏi (1 lần là tò mò, không phải trải nghiệm)`);
check(RECENT_DAYS <= 180, `chỉ hỏi về app dùng trong ${RECENT_DAYS} ngày qua`);
check(NO_REPEAT_DAYS >= 365, `khoá câu đã hỏi ${NO_REPEAT_DAYS} ngày — đúng yêu cầu "khác nhau hết năm"`);
check(QUESTIONS_PER_ROUND <= 5, `${QUESTIONS_PER_ROUND} câu mỗi đợt — dài hơn thì người ta bấm cho xong`);

// ── 9. BÁO CÁO ĐỘ PHỦ ────────────────────────────────────────────────────────
const live = APP_REGISTRY.filter((a) => !RETIRED_APP_IDS.includes(a.id)).length;
console.log(`\n   Bộ câu hỏi: ${APP_TEMPLATES.length} câu/ứng dụng × ${live} ứng dụng + ${SYSTEM_TEMPLATES.length} câu hệ thống.`);
console.log(`   Người dùng 5 ứng dụng có ${APP_TEMPLATES.length * 5 + SYSTEM_TEMPLATES.length} câu khác nhau — đủ cho ${Math.floor((APP_TEMPLATES.length * 5 + SYSTEM_TEMPLATES.length) / QUESTIONS_PER_ROUND)} tháng.`);

console.log(failed
  ? `\n❌ Khảo sát định kỳ: ${failed} mục chưa đạt`
  : '\n✅ Khảo sát định kỳ đạt — không lặp trong năm, không hỏi thứ chưa dùng');
process.exit(failed ? 1 : 0);
