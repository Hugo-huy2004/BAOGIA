import EduProduct from '../models/EduProduct.js';
import EduPurchase from '../models/EduPurchase.js';
import { awardJoy } from '../utils/joyService.js';

// Sản phẩm mẫu: chèn khi chưa có slug đó ($setOnInsert) — admin sửa/tắt rồi thì khởi động lại không ghi đè.
const SEED = [
  { slug: 'sticker-hat', image: '/edu/cast-6.svg', priceJoy: 120, sort: 1, name: { vi: 'Nhãn dán Hạt', en: 'Hạt sticker', zh: 'Hạt 贴纸' }, description: { vi: 'Bạn đồng hành của khoá SQL, dán vào túi đồ.', en: 'Your SQL course buddy for your bag.', zh: 'SQL 课程的小伙伴。' } },
  { slug: 'sticker-nhip', image: '/edu/cast-1.svg', priceJoy: 120, sort: 2, name: { vi: 'Nhãn dán Nhịp', en: 'Nhịp sticker', zh: 'Nhịp 贴纸' }, description: { vi: 'Linh vật khoá Lập trình Web.', en: 'Mascot of the Web Programming course.', zh: '网页编程课程吉祥物。' } },
  { slug: 'badge-night-owl', image: '/edu/cast-8.svg', priceJoy: 300, sort: 3, name: { vi: 'Huy hiệu Cú đêm', en: 'Night Owl badge', zh: '夜猫子徽章' }, description: { vi: 'Cho người hay học sau 21 giờ.', en: 'For late-night learners.', zh: '献给夜间学习者。' } },
  { slug: 'badge-query-master', image: '/edu/cast-4.svg', priceJoy: 800, sort: 4, name: { vi: 'Huy hiệu Bậc thầy truy vấn', en: 'Query Master badge', zh: '查询大师徽章' }, description: { vi: 'Khoe với bạn bè rằng bạn đã đi hết khoá SQL.', en: 'Show friends you finished SQL.', zh: '向朋友展示你完成了 SQL。' } },
  { slug: 'limited-founder', image: '/edu/cast-3.svg', priceJoy: 1500, stock: 100, sort: 5, name: { vi: 'Thẻ Người học khai trương', en: 'Founding Learner card', zh: '首批学员卡' }, description: { vi: 'Chỉ 100 thẻ cho những người học đầu tiên.', en: 'Only 100 for the first learners.', zh: '仅限首批 100 位学员。' } },
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
    id: String(p._id), slug: p.slug, name: p.name, description: p.description, image: p.image, priceJoy: p.priceJoy,
    left: p.stock == null ? null : Math.max(0, p.stock - p.sold), ownedAt: have.get(String(p._id)) || null,
  }));
}

/**
 * Mua: (1) giữ một suất tồn kho có điều kiện, (2) ghi quyền sở hữu (chỉ mục duy nhất chặn mua đôi),
 * (3) trừ JOY (awardJoy chặn số dư âm). Bước sau hỏng thì hoàn tác các bước trước.
 */
export async function buyEduProduct(email, productId) {
  const product = await EduProduct.findOne({ _id: productId, active: true }).lean();
  if (!product) throw Object.assign(new Error('Sản phẩm không còn bán.'), { status: 404 });
  const held = await EduProduct.updateOne(
    { _id: product._id, active: true, $or: [{ stock: null }, { $expr: { $lt: ['$sold', '$stock'] } }] },
    { $inc: { sold: 1 } },
  );
  if (!held.modifiedCount) throw Object.assign(new Error('Sản phẩm đã hết hàng.'), { status: 409, code: 'SOLD_OUT' });
  const release = () => EduProduct.updateOne({ _id: product._id }, { $inc: { sold: -1 } });
  let purchase;
  try {
    purchase = await EduPurchase.create({ email, productId: product._id, priceJoy: product.priceJoy });
  } catch (error) {
    await release();
    if (error?.code === 11000) throw Object.assign(new Error('Bạn đã có vật phẩm này.'), { status: 409, code: 'OWNED' });
    throw error;
  }
  try {
    const { balance } = await awardJoy(email, -product.priceJoy, 'store_purchase', `Cửa hàng Edu: ${product.name.vi}`, { notify: false });
    return { balance, productId: String(product._id) };
  } catch (error) {
    await Promise.all([EduPurchase.deleteOne({ _id: purchase._id }), release()]);
    if (String(error.message).startsWith('INSUFFICIENT_JOY')) throw Object.assign(new Error('Số dư JOY chưa đủ.'), { status: 400, code: 'INSUFFICIENT_JOY' });
    throw error;
  }
}
