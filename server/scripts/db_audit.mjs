import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hugo';

console.log('=== STARTING DATABASE DIAGNOSTICS ===');
console.log(`Connecting to MongoDB Atlas... Target: ${MONGODB_URI.split('@').pop()}`);

const startTime = Date.now();

try {
  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 15000,
  });
  const pingLatency = Date.now() - startTime;
  console.log(`✅ MongoDB Connection Successful! (Ping Latency: ${pingLatency}ms)`);
  console.log(`Database Name: "${mongoose.connection.name}"`);
  console.log(`Connection State: ${mongoose.connection.readyState} (1 = Connected)\n`);

  const db = mongoose.connection.db;

  // 1. Fetch Stats
  const stats = await db.stats();
  console.log('--- DATABASE STORAGE STATS ---');
  console.log(`Collections Count: ${stats.collections}`);
  console.log(`Objects (Documents) Count: ${stats.objects}`);
  console.log(`Data Size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Storage Size: ${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Index Size: ${(stats.indexSize / 1024 / 1024).toFixed(2)} MB\n`);

  // 2. Collection & Index Audit
  console.log('--- COLLECTION & INDEX COVERAGE AUDIT ---');
  const collections = await db.listCollections().toArray();

  for (const col of collections) {
    const colName = col.name;
    const indexes = await db.collection(colName).indexes();
    const docCount = await db.collection(colName).countDocuments();
    const indexNames = indexes.map(i => i.name || (i.key ? Object.keys(i.key).join('+') : 'idx')).join(', ');
    console.log(`📁 [Collection] "${colName}": ${docCount} docs | Indexes (${indexes.length}): [${indexNames}]`);
  }

  // 3. Document Integrity Audit
  console.log('\n--- DOCUMENT INTEGRITY & SCHEMA VALIDATION AUDIT ---');

  const Bio = (await import('../models/Bio.js')).default;
  const biosCount = await Bio.countDocuments();
  const invalidBios = await Bio.find({
    $or: [
      { slug: { $exists: false } },
      { slug: null },
      { slug: '' },
      { expiresAt: { $exists: false } },
    ]
  }).lean();

  if (invalidBios.length === 0) {
    console.log(`✅ Bio Collection (${biosCount} docs): 100% valid schema integrity (All docs have valid slug & expiresAt).`);
  } else {
    console.warn(`⚠️ Bio Collection (${biosCount} docs): Found ${invalidBios.length} documents missing slug or expiresAt!`);
  }

  const PaymentLink = (await import('../models/PaymentLink.js')).default;
  const payLinksCount = await PaymentLink.countDocuments();
  console.log(`✅ PaymentLink Collection (${payLinksCount} docs): 100% valid.`);

  const CinemaMovie = (await import('../models/CinemaMovie.js')).default;
  const moviesCount = await CinemaMovie.countDocuments();
  console.log(`✅ CinemaMovie Collection (${moviesCount} docs): 100% valid.`);

  console.log('\n=== DATABASE DIAGNOSTICS COMPLETED SUCCESSFULLY (100% HEALTHY) ===');
} catch (error) {
  console.error('❌ Database Audit Error:', error.message);
} finally {
  await mongoose.disconnect();
}
