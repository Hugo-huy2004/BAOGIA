import EduProduct from '../models/EduProduct.js';
import EduPurchase from '../models/EduPurchase.js';
import EduLearner from '../models/EduLearner.js';
import { awardJoy } from '../utils/joyService.js';

// Sản phẩm mẫu: chèn khi chưa có slug đó ($setOnInsert) — admin sửa/tắt rồi thì khởi động lại không ghi đè.
const SEED = [
  { slug: 'streak-shield', kind: 'streak_shield', value: 1, image: '/edu/cast-2.svg', priceJoy: 200, sort: 0, name: { vi: 'Khiên lửa', en: 'Streak Shield', zh: '火焰护盾' }, description: { vi: 'Lỡ học một ngày? 8 giờ sáng hôm sau khiên tự phá băng, chuỗi vẫn cháy. Giữ tối đa 5 khiên.', en: 'Missed a day? At 8am the next morning a shield thaws it automatically. Hold up to 5.', zh: '漏学一天？次日早上 8 点护盾自动破冰，连胜继续。最多持有 5 个。' } },
  { slug: 'xp-boost-24h', kind: 'xp_boost', value: 24, image: '/edu/cast-5.svg', priceJoy: 250, sort: 0, name: { vi: 'Nhân đôi XP 24 giờ', en: 'Double XP · 24h', zh: '双倍 XP · 24 小时' }, description: { vi: 'Mọi XP thi đua tuần nhân đôi trong 24 giờ, có hiệu lực ngay. Mua thêm là cộng dồn.', en: 'All league XP is doubled for 24 hours, starting now. Stacks if you buy more.', zh: '24 小时内每周排行 XP 翻倍，立即生效，可叠加。' } },
  { slug: 'sticker-hat', kind: 'badge', image: '/edu/cast-6.svg', priceJoy: 120, sort: 1, name: { vi: 'Nhãn dán Hạt', en: 'Hạt sticker', zh: 'Hạt 贴纸' }, description: { vi: 'Bạn đồng hành của khoá SQL, dán vào túi đồ.', en: 'Your SQL course buddy for your bag.', zh: 'SQL 课程的小伙伴。' } },
  { slug: 'sticker-nhip', kind: 'badge', image: '/edu/cast-1.svg', priceJoy: 120, sort: 2, name: { vi: 'Nhãn dán Nhịp', en: 'Nhịp sticker', zh: 'Nhịp 贴纸' }, description: { vi: 'Linh vật khoá Lập trình Web.', en: 'Mascot of the Web Programming course.', zh: '网页编程课程吉祥物。' } },
  { slug: 'badge-night-owl', kind: 'badge', image: '/edu/cast-8.svg', priceJoy: 300, sort: 3, name: { vi: 'Huy hiệu Cú đêm', en: 'Night Owl badge', zh: '夜猫子徽章' }, description: { vi: 'Cho người hay học sau 21 giờ.', en: 'For late-night learners.', zh: '献给夜间学习者。' } },
  { slug: 'badge-query-master', kind: 'badge', image: '/edu/cast-4.svg', priceJoy: 800, sort: 4, name: { vi: 'Huy hiệu Bậc thầy truy vấn', en: 'Query Master badge', zh: '查询大师徽章' }, description: { vi: 'Khoe với bạn bè rằng bạn đã đi hết khoá SQL.', en: 'Show friends you finished SQL.', zh: '向朋友展示你完成了 SQL。' } },
  { slug: 'limited-founder', kind: 'badge', image: '/edu/cast-3.svg', priceJoy: 1500, stock: 100, sort: 5, name: { vi: 'Thẻ Người học khai trương', en: 'Founding Learner card', zh: '首批学员卡' }, description: { vi: 'Chỉ 100 thẻ cho những người học đầu tiên.', en: 'Only 100 for the first learners.', zh: '仅限首批 100 位学员。' } },
];

export async function seedEduProducts() {
  await EduProduct.bulkWrite(SEED.map((p) => ({ updateOne: { filter: { slug: p.slug }, update: { $setOnInsert: p }, upsert: true } })));
}

export async function listEduProducts(email) {
  const [products, owned] = await Promise.all([
    EduProduct.find({ active: true }).sort({ sort: 1, createdAt: 1 }).lean(),
    email ? EduPurchase.find({ email }).select('productId createdAt').lean() : [],
  ]);
  const have = new Map(owned.map((p) => [String(p.productId), p.createdAt]));
  return products.map((p) => ({
    id: String(p._id), slug: p.slug, kind: p.kind === 'collectible' ? 'badge' : p.kind, value: p.value || 1,
    name: p.name, description: p.description, image: p.image, priceJoy: p.priceJoy,
    left: p.stock == null ? null : Math.max(0, p.stock - p.sold), ownedAt: have.get(String(p._id)) || null,
  }));
}

const ONCE = new Set(['badge', 'collectible']);
const MAX_SHIELDS = 5;

/** Trạng thái vật phẩm đang có tác dụng của người học — cửa hàng hiện cạnh từng món. */
export async function eduPerks(email) {
  const doc = await EduLearner.findOne({ email }).select('shields xpBoostUntil badge').lean();
  const until = doc?.xpBoostUntil && new Date(doc.xpBoostUntil) > new Date() ? doc.xpBoostUntil : null;
  return { shields: doc?.shields || 0, xpBoostUntil: until, badge: doc?.badge || null };
}

// Áp tác dụng ngay sau khi trừ JOY. Trả false nếu không áp được (vd. đã đủ khiên) để hoàn tiền.
async function applyEffect(email, product) {
  if (product.kind === 'streak_shield') {
    const r = await EduLearner.updateOne({ email, shields: { $not: { $gt: MAX_SHIELDS - product.value } } }, { $inc: { shields: product.value } }, { upsert: false });
    return r.modifiedCount === 1;
  }
  if (product.kind === 'xp_boost') {
    // Cộng dồn: còn hạn thì nối tiếp từ hạn cũ, hết hạn thì tính từ bây giờ (pipeline update — một lệnh nguyên tử).
    const ms = product.value * 3600_000;
    const r = await EduLearner.updateOne({ email }, [{ $set: { xpBoostUntil: { $add: [{ $max: ['$xpBoostUntil', '$$NOW'] }, ms] } } }]);
    return r.matchedCount === 1;
  }
  await EduLearner.updateOne({ email }, { $set: { badge: product.image } });
  return true;
}

/** Đổi huy hiệu đang đeo — chỉ huy hiệu đã mua. */
export async function equipEduBadge(email, productId) {
  const product = await EduProduct.findById(productId).select('kind image').lean();
  if (!product || !ONCE.has(product.kind) || !(await EduPurchase.exists({ email, productId }))) {
    throw Object.assign(new Error('Bạn chưa có huy hiệu này.'), { status: 403 });
  }
  await EduLearner.updateOne({ email }, { $set: { badge: product.image } });
  return { badge: product.image };
}

/**
 * Mua: (1) giữ một suất tồn kho có điều kiện, (2) huy hiệu: ghi quyền sở hữu (chỉ mục duy nhất chặn mua đôi),
 * (3) trừ JOY (awardJoy chặn số dư âm), (4) áp tác dụng ngay. Bước sau hỏng thì hoàn tác các bước trước.
 */
export async function buyEduProduct(email, productId) {
  const product = await EduProduct.findOne({ _id: productId, active: true }).lean();
  if (!product) throw Object.assign(new Error('Sản phẩm không còn bán.'), { status: 404 });
  const once = ONCE.has(product.kind);
  const held = await EduProduct.updateOne(
    { _id: product._id, active: true, $or: [{ stock: null }, { $expr: { $lt: ['$sold', '$stock'] } }] },
    { $inc: { sold: 1 } },
  );
  if (!held.modifiedCount) throw Object.assign(new Error('Sản phẩm đã hết hàng.'), { status: 409, code: 'SOLD_OUT' });
  const release = () => EduProduct.updateOne({ _id: product._id }, { $inc: { sold: -1 } });
  let purchase = null;
  if (once) {
    try {
      purchase = await EduPurchase.create({ email, productId: product._id, priceJoy: product.priceJoy });
    } catch (error) {
      await release();
      if (error?.code === 11000) throw Object.assign(new Error('Bạn đã có vật phẩm này.'), { status: 409, code: 'OWNED' });
      throw error;
    }
  }
  const undo = () => Promise.all([purchase && EduPurchase.deleteOne({ _id: purchase._id }), release()]);
  let balance;
  try {
    ({ balance } = await awardJoy(email, -product.priceJoy, 'store_purchase', `Cửa hàng Edu: ${product.name.vi}`, { notify: false, refId: `edu-shop-${product.slug}` }));
  } catch (error) {
    await undo();
    if (String(error.message).startsWith('INSUFFICIENT_JOY')) throw Object.assign(new Error('Số dư JOY chưa đủ.'), { status: 400, code: 'INSUFFICIENT_JOY' });
    throw error;
  }
  let applied = false;
  try { applied = await applyEffect(email, product); } catch (error) { console.error('[edu-store effect]', error.message); }
  if (!applied) {
    await awardJoy(email, product.priceJoy, 'admin_adjustment', `Hoàn JOY: chưa áp dụng được ${product.name.vi}`, { rawAmount: true, notify: false })
      .catch((error) => console.error('[edu-store refund]', email, product.slug, error.message));
    await undo();
    throw Object.assign(new Error(product.kind === 'streak_shield' ? `Bạn đã có tối đa ${MAX_SHIELDS} khiên.` : 'Chưa áp dụng được vật phẩm, JOY đã được hoàn.'), { status: 409, code: 'NOT_APPLIED' });
  }
  return { balance, productId: String(product._id), perks: await eduPerks(email) };
}
