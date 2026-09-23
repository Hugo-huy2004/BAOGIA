// Soát bộ cứu sinh HugoPsy phía Node — nhánh chạy khi KHÔNG gọi được máy chủ
// Python. Chạy cùng `npm run check:psy`.
//
// Nhánh này từng trả về đúng một câu chào cố định cho mọi tin nhắn và không hề
// kiểm tra khủng hoảng. Người dùng thật đã gặp: trả lời "Không" thì nhận lại y
// nguyên câu chào, kèm chữ "[DONE]" in ra cuối tin.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { composeReply, isCrisis, CRISIS_RESPONSE, normalize, detectAddress, render } from '../../server/services/hugopsyFallback.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const fails = [];
const check = (name, ok, detail = '') => {
  console.log(`  ${ok ? '✅' : '❌'} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) fails.push(name);
};

console.log('Hai bên dùng chung một kho tri thức');
const shared = JSON.parse(fs.readFileSync(path.join(ROOT, 'shared/hugopsyKnowledge.json'), 'utf8'));
const pyEngine = fs.readFileSync(path.join(ROOT, 'python-ai-server/services/hugopsy_companion_engine.py'), 'utf8');
check('engine Python đọc shared/hugopsyKnowledge.json', pyEngine.includes('hugopsyKnowledge.json'));
check('Python không còn chép cứng từ khoá khủng hoảng', !/^CRISIS_TERMS = \[/m.test(pyEngine));
check('kho có đủ 14 chủ đề', shared.topics.length >= 14, `${shared.topics.length} chủ đề`);

console.log('\nRadar khủng hoảng phía Node');
for (const msg of ['tôi muốn chết', 'mình không muốn sống nữa', 'em muốn tự tử', 'sống làm gì nữa']) {
  check(`nhận ra ${JSON.stringify(msg)}`, isCrisis(msg));
}
check('không báo động nhầm câu thường', !isCrisis('hôm nay mình hơi mệt'));
check('bỏ dấu khớp với bên Python', normalize('Tôi Muốn Chết!!') === 'toi muon chet');

console.log('\nTin khủng hoảng có đủ ba số hotline');
for (const num of ['096 306 1414', '111', '1900 599 830']) {
  check(`số ${num}`, CRISIS_RESPONSE.includes(num));
}

console.log('\nKhông trả lời như cái máy');
const canned = 'mình luôn ở đây để lắng nghe và đồng hành cùng bạn';
const proxy = fs.readFileSync(path.join(ROOT, 'server/routes/aiProxyRoutes.js'), 'utf8');
check('proxy không còn câu chào cố định', !proxy.includes(canned));
check('proxy có kiểm tra khủng hoảng', proxy.includes('isCrisis('));

const a = composeReply('mình buồn quá');
const b = composeReply('Không');
const c = composeReply('áp lực thi cử làm em mất ngủ');
check('ba tin nhắn khác nhau cho ba câu trả lời khác nhau', new Set([a, b, c]).size === 3);
check('nhận ra hai vấn đề trong một câu', c.includes('không chỉ có một chuyện'), c.slice(0, 60) + '…');

let history = [];
const seen = [];
for (let i = 0; i < 3; i += 1) {
  const r = composeReply('mình buồn quá', { history: [...history] });
  seen.push(r);
  history = [...history, { role: 'user', content: 'mình buồn quá' }, { role: 'model', content: r }];
}
check('ba lượt liên tiếp không lặp nguyên văn', new Set(seen).size === 3, `${new Set(seen).size}/3`);

console.log('\nXưng hô theo cách người ta tự xưng');
const addr = (m) => detectAddress(m);
check('"em ..." → gọi em', addr('em thấy buồn').user === 'em');
check('"tớ ..." → gọi cậu', addr('tớ mệt lắm').user === 'cậu');
check('"tôi ..." → gọi bạn', addr('tôi lo lắng').user === 'bạn');
check('"con ..." → gọi em, KHÔNG gọi lại là con', addr('con sợ bố mẹ buồn').user === 'em');
check('mặc định là cậu/tớ, đúng giọng phần còn lại của app', addr('chán quá').user === 'cậu');
check('câu trả lời không còn sót chỗ trống', !/\{(user|self|User|Self)\}/.test(composeReply('em buồn quá')));
check('tin khủng hoảng đổ được đại từ',
  !/\{(user|self|User|Self)\}/.test(render(CRISIS_RESPONSE, addr('em muốn chết'))));
const proxySrc = fs.readFileSync(path.join(ROOT, 'server/routes/aiProxyRoutes.js'), 'utf8');
check('proxy đổ đại từ trước khi gửi tin khủng hoảng', proxySrc.includes('render(CRISIS_RESPONSE'));

console.log('\nChủ đề đặc thù Á Đông');
for (const [msg, want] of [['con sợ làm bố mẹ thất vọng', 'filial'],
                           ['em sợ người ta biết thì xấu hổ', 'face'],
                           ['chắc tại em kém thôi', 'minimising'],
                           ['em không dám đi khám tâm lý sợ bị nói là điên', 'stigma'],
                           ['dạo này em hay tức ngực', 'body']]) {
  const reply = composeReply(msg);
  const topic = shared.topics.find((t) => t.id === want);
  const hit = topic.reflect.concat(topic.ask).some((line) => reply.includes(render(line, addr(msg)).slice(0, 25)));
  check(`${JSON.stringify(msg)} → ${want}`, hit, reply.slice(0, 55) + '…');
}
check('"tức ngực" không bị đọc thành cơn giận',
  !composeReply('dạo này em hay đau đầu tức ngực').includes('giận'));

console.log('\nDấu hết luồng không lọt ra màn hình');
const bot = fs.readFileSync(path.join(ROOT, 'src/services/classes/CompanionBot/AIBot.js'), 'utf8');
check('client bỏ qua "[DONE]"', (bot.match(/rawContent[^\n]*\[DONE\]/g) || []).length >= 2);
check('không dùng return làm hỏng onDone', !/\[DONE\]"\)\s*return;/.test(bot));

console.log();
if (fails.length) {
  console.log(`❌ HugoPsy (Node): ${fails.length} phép kiểm hỏng`);
  fails.forEach((f) => console.log(`   · ${f}`));
  process.exit(1);
}
console.log('✅ HugoPsy (Node) đạt — có radar khủng hoảng, trả lời theo ngữ cảnh, không lộ [DONE]');
