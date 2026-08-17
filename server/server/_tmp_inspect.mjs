// Read-only: xem 9 đơn "đã mua bằng JOY" thực sự cấp được gì.
import 'dotenv/config';
import mongoose from 'mongoose';

await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection.db;

const email = process.argv[2] || 'hugowishpax@gmail.com';

const orders = await db.collection('utilityorders').find({ email }).sort({ createdAt: -1 }).limit(15).toArray();
console.log('--- ORDERS ---');
for (const o of orders) {
  console.log(o.createdAt?.toISOString().slice(0, 10), '|', o.productName, '|', o.priceJoy, 'JOY |', o.status, '| product:', String(o.productId));
}

const ids = [...new Set(orders.map((o) => o.productId).filter(Boolean).map(String))];
const products = await db.collection('utilityproducts')
  .find({ _id: { $in: ids.map((i) => new mongoose.Types.ObjectId(i)) } }).toArray();
console.log('\n--- PRODUCTS ---');
for (const p of products) {
  console.log(p.name, '| type:', p.productType, '| tokenType:', p.tokenType, '| tokenAmount:', p.tokenAmount,
    '| extendDays:', p.extendDays, '| radioMinutes:', p.radioMinutes, '| category:', p.category);
}
const missing = ids.filter((i) => !products.some((p) => String(p._id) === i));
if (missing.length) console.log('sản phẩm đã bị xoá khỏi kho:', missing.length);

const bio = await db.collection('bios').findOne({ email },
  { projection: { bonusChatTokens: 1, bonusCallTokens: 1, radioTokens: 1, expiresAt: 1, joyBalance: 1, serviceVouchers: 1 } });
console.log('\n--- BIO ---');
console.log(JSON.stringify(bio, null, 1));

await mongoose.disconnect();
