/**
 * CẤU HÌNH CORS CHO SERVER
 * Tuân thủ Quy tắc 4 (Viblo): Cấu hình tập trung trong thư mục config/
 */
import OAuthClient from '../models/OAuthClient.js';

export const allowedOrigins = [
  ...((process.env.CLIENT_URLS || "").split(",")),
  "https://www.hugowishpax.studio",
  "https://hugowishpax.studio",
  // The App Store build is not served over http(s): WKWebView loads it from
  // `capacitor://localhost`, and that string is what lands in the Origin
  // header. It is a constant baked into Capacitor, not a host anyone can point
  // DNS at, so listing it literally is the whole check — a web page cannot
  // forge this origin.
  "capacitor://localhost"
].filter(Boolean);

export const isDev = process.env.NODE_ENV !== 'production';
export const localOriginRegex = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/;

// Origin lạ đã bị từ chối, ghi nhớ để không lặp lại log. Reset khi restart.
export const corsRejected = new Set();

/** Cấu hình options CORS riêng cho các route /api/oauth */
export const oauthCorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || (isDev && localOriginRegex.test(origin))) {
      return callback(null, true);
    }
    OAuthClient.exists({ status: 'active', clientType: 'public', allowedOrigins: origin })
      .then((exists) => callback(null, Boolean(exists)))
      .catch(() => callback(null, false));
  },
  credentials: true,
};

/** Cấu hình options CORS toàn cục */
export const appCorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || (isDev && localOriginRegex.test(origin))) {
      return callback(null, true);
    }
    if (!corsRejected.has(origin)) {
      corsRejected.add(origin);
      console.warn('[CORS] từ chối origin lạ:', origin);
    }
    return callback(null, false);
  },
  credentials: true,
};
