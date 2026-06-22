// One-off migration: reset every existing Bio's page template to 'default'
// (Classic) as the Brutalism/Flat paid-rental feature ships. Run ONCE manually:
//   node server/scripts/resetBioThemesToDefault.js
// Not imported/run automatically anywhere — intentionally not wired into
// server.js or cronJobs.js.
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Bio from '../models/Bio.js';

dotenv.config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hugo_wishpax';

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('[MIGRATION] Connected. Resetting all Bio.theme.template to "default"...');

  const result = await Bio.updateMany(
    { 'theme.template': { $ne: 'default' } },
    { $set: { 'theme.template': 'default', 'bioThemeRental.template': 'default', 'bioThemeRental.expiresAt': null } }
  );

  console.log(`[MIGRATION] Done. Modified ${result.modifiedCount} Bio documents.`);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('[MIGRATION] Failed:', err);
  process.exit(1);
});
