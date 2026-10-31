// Loaded here (not just in server.js) because ES module imports hoist above
// server.js's dotenv.config() call — without this, secrets resolve before
// .env is read and silently fall back to dev defaults.
import 'dotenv/config';

// Central secret resolution. In production a missing secret is a fatal
// misconfiguration (a fallback value would let anyone who reads this public
// repo forge tokens), so we crash at boot instead of serving insecurely.
const isProduction = process.env.NODE_ENV === 'production';

function requireSecret(name, devFallback) {
  const value = process.env[name];
  if (value && value.trim()) return value.trim();
  if (isProduction) {
    console.error(`❌ FATAL: ${name} is not set. Refusing to start in production with an insecure default.`);
    process.exit(1);
  }
  console.warn(`⚠️  ${name} not set — using an insecure dev-only fallback. Never deploy like this.`);
  return devFallback;
}

export const JWT_SECRET = requireSecret('JWT_SECRET', 'dev-only-jwt-secret-do-not-deploy');
export const JOY_QR_SECRET = requireSecret('JOY_QR_SECRET', 'dev-insecure-joy-qr-secret-change-me');

// Google OAuth client id used to validate the `aud` claim of Google ID tokens.
// Not secret (it ships in the frontend bundle), but must match the frontend's
// VITE_GOOGLE_CLIENT_ID for member login to succeed.
export const GOOGLE_CLIENT_ID = (process.env.GOOGLE_CLIENT_ID || '').trim();

// The iOS build cannot use the web client: Google will not accept
// `capacitor://localhost` as a JavaScript origin, so the App Store build signs
// in through its own iOS OAuth client and its ID tokens carry that `aud`.
// (Android does not need an entry here — its Credential Manager flow is given
// the web client id as the server client, so those tokens keep the web `aud`.)
export const GOOGLE_IOS_CLIENT_ID = (process.env.GOOGLE_IOS_CLIENT_ID || '').trim();
