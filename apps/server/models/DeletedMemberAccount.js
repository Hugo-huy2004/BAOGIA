import mongoose from 'mongoose';

const DeletedMemberAccountSchema = new mongoose.Schema({
  emailHash: { type: String, required: true, unique: true, index: true },
  deletedAt: { type: Date, default: Date.now, required: true },
}, { versionKey: false });

export default mongoose.models.DeletedMemberAccount
  || mongoose.model('DeletedMemberAccount', DeletedMemberAccountSchema);
