import express from 'express';
import Data from '../models/Data.js';
import { decryptText, encryptText } from '../utils/cryptoUtils.js';

const router = express.Router();

const noStore = (res) => {
  res.set({
    'Cache-Control': 'no-store, max-age=0',
    Pragma: 'no-cache',
    'Referrer-Policy': 'no-referrer',
    'X-Robots-Tag': 'noindex, nofollow',
  });
};

const allowedZaloUrl = (value) => {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return null;
    if (!['zalo.me', 'oa.zalo.me', 'chat.zalo.me'].includes(url.hostname)) return null;
    return url.toString();
  } catch {
    return null;
  }
};

// The public client receives only this endpoint. The private number remains in
// an encrypted environment value or encrypted MongoDB field and is never sent
// in HTML/JSON. CONTACT_ZALO_URL can point to an opaque Zalo OA link, which is
// preferable because even the final redirect then contains no phone number.
router.get('/zalo', async (_req, res) => {
  noStore(res);

  try {
    const configuredUrl = allowedZaloUrl(process.env.CONTACT_ZALO_URL);
    if (configuredUrl) return res.redirect(302, configuredUrl);

    let storedValue = process.env.CONTACT_ZALO_NUMBER_ENCRYPTED || '';
    let sourceIsDatabase = false;

    if (!storedValue) {
      const rawData = await Data.collection.findOne(
        { userId: 'default' },
        { projection: { 'profile.zaloNumber': 1 } },
      );
      storedValue = rawData?.profile?.zaloNumber || '';
      sourceIsDatabase = Boolean(storedValue);
    }

    const phone = String(decryptText(storedValue) || '').replace(/[^0-9]/g, '');
    if (!/^\d{8,15}$/.test(phone)) {
      return res.status(503).send('Kênh Zalo hiện chưa khả dụng. Vui lòng liên hệ qua email.');
    }

    // One-time, silent migration for an existing plaintext value. Use the raw
    // collection so model decryption hooks cannot write plaintext back by error.
    if (sourceIsDatabase && !storedValue.startsWith('enc:')) {
      await Data.collection.updateOne(
        { userId: 'default' },
        { $set: { 'profile.zaloNumber': encryptText(phone) } },
      );
    }

    return res.redirect(302, `https://zalo.me/${phone}`);
  } catch {
    // Never reveal database, encryption or server details on a public contact
    // endpoint. The global error logger is intentionally bypassed here too.
    return res.status(503).send('Kênh Zalo hiện chưa khả dụng. Vui lòng liên hệ qua email.');
  }
});

export default router;
