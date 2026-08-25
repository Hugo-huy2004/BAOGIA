import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  pairKey: { type: String, required: true, unique: true },
  members: {
    type: [{ type: String, lowercase: true, trim: true }],
    required: true,
    validate: [(value) => value.length === 2, 'Friendship needs exactly two members'],
  },
  requesterEmail: { type: String, required: true, lowercase: true, trim: true },
  recipientEmail: { type: String, required: true, lowercase: true, trim: true },
  status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
  respondedAt: { type: Date, default: null },
}, { timestamps: true });

schema.index({ members: 1, status: 1, updatedAt: -1 });
schema.index({ recipientEmail: 1, status: 1, createdAt: -1 });
// A decline prevents immediate repeat spam, but it is not a permanent block.
schema.index(
  { respondedAt: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60, partialFilterExpression: { status: 'declined' } },
);

export default mongoose.model('Friendship', schema);
