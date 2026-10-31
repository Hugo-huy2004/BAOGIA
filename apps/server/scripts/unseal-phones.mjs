// Chuyển số điện thoại đã mã hoá trong DB về chữ thường (26/10/2026).
//
//   node apps/server/scripts/unseal-phones.mjs        → chỉ ĐẾM, không sửa
//   node apps/server/scripts/unseal-phones.mjs --yes  → ghi chữ thường
//
// Đọc/ghi bằng collection thô để không đi qua hook của model. Bản nào không giải
// được (khoá đã xoay) thì đặt rỗng: chuỗi đó đã không còn cứu được, để lại chỉ
// làm nó hiện ra form.
import 'dotenv/config';
import mongoose from 'mongoose';
import { unsealField } from '../utils/dbSealingCipher.js';
import { decryptText } from '../utils/cryptoUtils.js';

const apply = process.argv.includes('--yes');
const { MONGODB_URI } = process.env;
if (!MONGODB_URI) {
  console.error('Thiếu MONGODB_URI (apps/server/.env).');
  process.exit(1);
}

const open = (value) => {
  if (value.startsWith('$enc$')) {
    const plain = unsealField(value);
    return plain.startsWith('$enc$') ? '' : plain;
  }
  const plain = decryptText(value);
  return plain.startsWith('enc:') ? '' : plain;
};

const JOBS = [
  ['bios', 'phone'],
  ['bios', 'verificationRequest.phoneZalo'],
  ['bookings', 'phone'],
];

await mongoose.connect(MONGODB_URI);
const db = mongoose.connection.db;
for (const [name, path] of JOBS) {
  const filter = { [path]: { $regex: /^(\$enc\$|enc:)/ } };
  let fixed = 0;
  let lost = 0;
  for await (const doc of db.collection(name).find(filter, { projection: { [path]: 1 } })) {
    const value = path.split('.').reduce((o, k) => o?.[k], doc);
    const plain = open(value);
    if (plain) fixed += 1; else lost += 1;
    if (apply) await db.collection(name).updateOne({ _id: doc._id }, { $set: { [path]: plain } });
  }
  console.log(`${name}.${path}: ${fixed} giải được, ${lost} không giải được (→ rỗng)${apply ? '' : ' — chưa ghi, thêm --yes'}`);
}
await mongoose.disconnect();
