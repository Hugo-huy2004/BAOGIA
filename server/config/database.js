/**
 * CẤU HÌNH & KẾT NỐI DATABASE MONGODB
 * Tuân thủ Quy tắc 4 (Viblo): Cấu hình tập trung trong thư mục config/
 */
import mongoose from 'mongoose';
import { redisSlugService } from '../services/redisSlugService.js';
import Admin from '../models/Admin.js';

export const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hugo_wishpax';

export async function connectDatabase() {
  try {
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: process.env.MAX_DB_POOL ? parseInt(process.env.MAX_DB_POOL, 10) : 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB connected successfully');

    // In-memory valid-slug set: O(1) rejection of bogus /bio/:slug hits before
    // they reach MongoDB. Kept in sync by bioRoutes on create/rename/delete.
    try {
      await redisSlugService.init();
    } catch (err) {
      console.error('Valid-slug set error:', err);
    }

    // Seed admin if none exists
    try {
      const count = await Admin.countDocuments();
      if (count === 0) {
        const seedUser = process.env.ADMIN_SEED_USERNAME;
        const seedPass = process.env.ADMIN_SEED_PASSWORD;
        if (seedUser && seedPass) {
          const cryptoMod = await import('crypto');
          const bcryptMod = (await import('bcryptjs')).default;
          const usernameHash = cryptoMod.createHash('sha256').update(seedUser).digest('hex');
          await Admin.create({ username: usernameHash, password: await bcryptMod.hash(seedPass, 12) });
          console.log('👥 Admin account seeded from ADMIN_SEED_* env vars');
        } else {
          console.warn('⚠️  No admin account exists and ADMIN_SEED_USERNAME/ADMIN_SEED_PASSWORD are not set — admin login unavailable until seeded.');
        }
      }
    } catch (err) {
      console.error('Error seeding admin account:', err);
    }
  } catch (err) {
    console.error(' MongoDB connection failed:', err);
  }
}
