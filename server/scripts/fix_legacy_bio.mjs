import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hugo';

async function repair() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB for Bio repair...');

  const Bio = (await import('../models/Bio.js')).default;
  const invalidBios = await Bio.find({
    $or: [
      { slug: { $exists: false } },
      { slug: null },
      { slug: '' },
      { expiresAt: { $exists: false } },
    ]
  });

  console.log(`Found ${invalidBios.length} Bio documents to repair.`);

  for (const doc of invalidBios) {
    if (!doc.slug) {
      const emailPrefix = doc.email ? doc.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') : 'bio';
      doc.slug = `${emailPrefix}-${Date.now().toString(36)}`;
    }
    if (!doc.expiresAt) {
      doc.expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    }
    await doc.save();
    console.log(`✅ Repaired Bio for "${doc.email}": slug="${doc.slug}", expiresAt="${doc.expiresAt}"`);
  }

  await mongoose.disconnect();
  console.log('Repair completed!');
}

repair().catch(console.error);
