/**
 * Tạo ứng dụng "Đăng nhập bằng Hugo Studio" (OAuth client, confidential).
 *   node scripts/create-oauth-client.mjs "Education Hugo" https://education.hugowishpax.studio/api/auth/callback/hugo-studio
 * In client_id + client_secret MỘT lần (DB chỉ giữ SHA-256 của secret). Tên đã có thì báo, không tạo trùng.
 */
import 'dotenv/config';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import OAuthClient from '../models/OAuthClient.js';

const [name, ...redirectUris] = process.argv.slice(2);
if (!name || !redirectUris.length || !redirectUris.every((u) => /^https:\/\/[^\s]+$/.test(u) || /^http:\/\/localhost(:\d+)?\//.test(u))) {
  console.error('Cách dùng: node scripts/create-oauth-client.mjs "<tên>" <redirect_uri> [redirect_uri...]');
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);
const existing = await OAuthClient.findOne({ name, status: 'active' }).lean();
if (existing) {
  console.log(`"${name}" đã có: client_id = ${existing.clientId}`);
  console.log('Quên secret thì xoay secret trong admin (POST /api/oauth/admin/clients/:id/rotate-secret).');
  await mongoose.disconnect();
  process.exit(0);
}

const token = (prefix) => `${prefix}_${crypto.randomBytes(24).toString('base64url')}`;
const clientId = token('hugo');
const clientSecret = token('hugs');
await OAuthClient.create({
  name,
  clientId,
  clientSecretHash: crypto.createHash('sha256').update(clientSecret).digest('hex'),
  clientType: 'confidential',
  redirectUris,
  allowedOrigins: [...new Set(redirectUris.map((u) => new URL(u).origin))],
  allowedScopes: ['profile', 'email'],
  homepageUrl: new URL(redirectUris[0]).origin,
  createdBy: 'script',
  secretRotatedAt: new Date(),
});
console.log(`Đã tạo "${name}". Dán hai dòng này vào Environment của service Edu trên Render:\n`);
console.log(`HUGO_OAUTH_CLIENT_ID=${clientId}`);
console.log(`HUGO_OAUTH_CLIENT_SECRET=${clientSecret}`);
console.log('\nSecret chỉ hiện lần này.');
await mongoose.disconnect();
