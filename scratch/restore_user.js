import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('./server/.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("No MONGODB_URI found in env");
  process.exit(1);
}

const BioSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  isEduVerified: { type: Boolean, default: true },
  expiresAt: { type: Date, required: true },
  joyBalance: { type: Number, default: 0 },
  status: { type: String, default: 'active' },
}, { strict: false });

const Bio = mongoose.model('Bio', BioSchema);

async function restore() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB successfully!");

    const originalId = "6a0d37a6866eb8f503e36bd8";
    const email = "huylggcs230377@fpt.edu.vn";

    await Bio.deleteOne({ email });

    const restoredBio = await Bio.create({
      _id: new mongoose.Types.ObjectId(originalId),
      email: email,
      displayName: "LÊ GIA HUY",
      slug: "huylegiahuy",
      isEduVerified: true,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      joyBalance: 1000,
      status: "active",
      headline: "Lập trình viên Hugo Studio",
      bio: "Đội ngũ phát triển Hugo Studio"
    });

    console.log("Successfully restored user profile:", restoredBio);
  } catch (error) {
    console.error("Restoration failed:", error);
  } finally {
    await mongoose.disconnect();
  }
}

restore();
