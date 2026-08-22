import mongoose from 'mongoose';

const OAuthTokenSchema = new mongoose.Schema(
  {
    accessTokenHash: { type: String, required: true, unique: true, index: true },
    refreshTokenHash: { type: String, default: null, unique: true, sparse: true, index: true },
    clientId: { type: String, required: true, index: true },
    memberEmail: { type: String, required: true, index: true },
    scopes: { type: [String], default: [] },
    accessExpiresAt: { type: Date, required: true, index: true },
    refreshExpiresAt: { type: Date, required: true, index: { expires: 0 } },
    revokedAt: { type: Date, default: null, index: true },
    lastUsedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

OAuthTokenSchema.index({ clientId: 1, memberEmail: 1, revokedAt: 1 });

export default mongoose.models.OAuthToken || mongoose.model('OAuthToken', OAuthTokenSchema);
