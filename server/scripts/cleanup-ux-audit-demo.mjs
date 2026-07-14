// One-off: removes the throwaway demo account created during the UI/UX audit
// (email ux-audit@demo.local). Safe to delete this file after running.
// Run:  cd server && node scripts/cleanup-ux-audit-demo.mjs
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const EMAIL = 'ux-audit@demo.local';
const q = { $or: [{ email: EMAIL }, { contactEmail: EMAIL }, { memberEmail: EMAIL }, { userEmail: EMAIL }] };

await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
const db = mongoose.connection.db;
for (const c of await db.listCollections().toArray()) {
  const n = await db.collection(c.name).countDocuments(q).catch(() => 0);
  if (n > 0) {
    const r = await db.collection(c.name).deleteMany(q);
    console.log(`${c.name}: deleted ${r.deletedCount}`);
  }
}
await mongoose.disconnect();
console.log('Done.');
