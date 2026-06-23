import mongoose from 'mongoose';

// One document per registered authenticator (a member can register more than
// one device — phone fingerprint, laptop Face ID/Touch ID, etc).
const WebAuthnCredentialSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  credentialID: { type: String, required: true, unique: true, index: true }, // base64url
  publicKey: { type: String, required: true }, // base64url-encoded COSE public key
  counter: { type: Number, default: 0 },
  transports: { type: [String], default: [] },
  deviceName: { type: String, default: 'Thiết bị' },
  createdAt: { type: Date, default: Date.now },
  lastUsedAt: { type: Date, default: Date.now },
});

export default mongoose.model('WebAuthnCredential', WebAuthnCredentialSchema);
