import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(scriptDir, '../.env') });

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('Thiếu MONGODB_URI trong server/.env; dừng để tránh kết nối nhầm cơ sở dữ liệu.');
  process.exit(1);
}

try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  const collection = mongoose.connection.db.collection('bios');
  const indexes = await collection.indexes();
  const ttlExpiryIndexes = indexes.filter((index) => {
    const keys = Object.entries(index.key || {});
    return keys.length === 1 && keys[0][0] === 'expiresAt' && index.expireAfterSeconds !== undefined;
  });

  for (const index of ttlExpiryIndexes) {
    await collection.dropIndex(index.name);
    console.log(`Removed TTL index ${index.name}`);
  }

  const currentIndexes = await collection.indexes();
  const hasExpiryIndex = currentIndexes.some((index) => {
    const keys = Object.entries(index.key || {});
    return keys.length === 1 && keys[0][0] === 'expiresAt' && index.expireAfterSeconds === undefined;
  });
  if (!hasExpiryIndex) {
    const name = await collection.createIndex({ expiresAt: 1 });
    console.log(`Created regular index ${name}`);
  }

  const trialCap = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const normalized = await collection.updateMany(
    {
      isEduVerified: { $ne: true },
    },
    [
      {
        $set: {
          trialExpiresAt: {
            $min: [
              { $ifNull: ['$trialExpiresAt', { $ifNull: ['$expiresAt', trialCap] }] },
              trialCap,
            ],
          },
        },
      },
      { $set: { expiresAt: '$trialExpiresAt' } },
    ],
  );

  console.log(`Normalized expiry for ${normalized.modifiedCount} unverified accounts to at most seven days.`);
  console.log('Bio expiry index migration completed.');
} catch (error) {
  console.error('Bio expiry index migration failed:', error);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
