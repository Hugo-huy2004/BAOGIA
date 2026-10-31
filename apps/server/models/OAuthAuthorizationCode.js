import mongoose from 'mongoose';

const OAuthAuthorizationCodeSchema = new mongoose.Schema(
  {
    codeHash: { type: String, required: true, unique: true, index: true },
    clientId: { type: String, required: true, index: true },
    memberEmail: { type: String, required: true, index: true },
    redirectUri: { type: String, required: true },
    scopes: { type: [String], default: [] },
    codeChallenge: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    usedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.OAuthAuthorizationCode || mongoose.model('OAuthAuthorizationCode', OAuthAuthorizationCodeSchema);
