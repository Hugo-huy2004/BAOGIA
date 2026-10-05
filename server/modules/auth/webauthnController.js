/**
 * webauthnController.js
 * Controller tập trung toàn bộ logic nghiệp vụ xác thực sinh trắc học Passkey / WebAuthn.
 */
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import crypto from 'crypto';
import Bio from '../../models/Bio.js';
import WebAuthnCredential from '../../models/WebAuthnCredential.js';
import { saveChallenge, consumeChallenge } from '../../utils/webauthnChallengeStore.js';
import { signMemberToken, invalidateMemberGate } from '../../middleware/authMiddleware.js';

export const RP_NAME = 'Hugo Studio';

export function getDynamicOriginAndRPID(req) {
  const origin =
    req.get('origin') ||
    (process.env.NODE_ENV === 'production' ? 'https://hugowishpax.studio' : 'http://localhost:5173');
  let rpID = 'localhost';
  try {
    rpID = new URL(origin).hostname;
  } catch {
    console.warn('Invalid origin URL:', origin);
  }
  return { expectedOrigin: origin, rpID };
}

export function bufToB64Url(buf) {
  return Buffer.from(buf).toString('base64url');
}

/**
 * [Member] Khởi tạo tùy chọn đăng ký thiết bị sinh trắc học mới
 */
export async function getRegisterOptions(req, res) {
  try {
    const email = req.memberEmail;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const bio = await Bio.findOne({ email });
    if (!bio) return res.status(404).json({ error: 'Bio not found' });

    const existingCreds = await WebAuthnCredential.find({ email });
    const { rpID } = getDynamicOriginAndRPID(req);

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID,
      userName: email,
      userDisplayName: bio.displayName || email,
      attestationType: 'none',
      excludeCredentials: existingCreds.map((c) => ({ id: c.credentialID })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'required',
      },
    });

    saveChallenge(`reg_${email}`, options.challenge);
    return res.json(options);
  } catch (err) {
    console.error('webauthn register-options error:', err);
    return res.status(500).json({ error: 'Failed to generate registration options' });
  }
}

/**
 * [Member] Xác thực và lưu trữ credential sau khi quét vân tay/khuôn mặt thành công
 */
export async function verifyRegistration(req, res) {
  try {
    const { response, deviceName, baseDeviceName } = req.body;
    const email = req.memberEmail;
    if (!email || !response) return res.status(400).json({ error: 'Missing fields' });

    const expectedChallenge = consumeChallenge(`reg_${email}`);
    if (!expectedChallenge) return res.status(400).json({ error: 'Challenge expired, please try again' });

    const { expectedOrigin, rpID } = getDynamicOriginAndRPID(req);

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin,
      expectedRPID: rpID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return res.status(400).json({ error: 'Could not verify registration' });
    }

    const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;

    if (baseDeviceName) {
      const regex = new RegExp(`^${baseDeviceName.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}`);
      await WebAuthnCredential.deleteMany({ email, deviceName: { $regex: regex } });
    }

    await WebAuthnCredential.create({
      email,
      credentialID,
      publicKey: bufToB64Url(credentialPublicKey),
      counter,
      transports: response.response?.transports || [],
      deviceName: deviceName || 'Thiết bị',
    });

    return res.json({ verified: true });
  } catch (err) {
    console.error('webauthn register-verify error:', err);
    return res.status(500).json({ error: 'Failed to verify registration' });
  }
}

/**
 * Tạo thử thách đăng nhập bằng sinh trắc học
 */
export async function getLoginOptions(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const creds = await WebAuthnCredential.find({ email });
    if (!creds.length) return res.status(404).json({ error: 'NO_CREDENTIALS' });

    const { rpID } = getDynamicOriginAndRPID(req);

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: creds.map((c) => ({ id: c.credentialID, transports: c.transports })),
      userVerification: 'required',
    });

    saveChallenge(`auth_${email}`, options.challenge);
    return res.json(options);
  } catch (err) {
    console.error('webauthn login-options error:', err);
    return res.status(500).json({ error: 'Failed to generate login options' });
  }
}

/**
 * Xác minh chữ ký sinh trắc học và phát hành token phiên đăng nhập
 */
export async function verifyLogin(req, res) {
  try {
    const { email, response } = req.body;
    if (!email || !response) return res.status(400).json({ error: 'Missing fields' });

    const expectedChallenge = consumeChallenge(`auth_${email}`);
    if (!expectedChallenge) return res.status(400).json({ error: 'Challenge expired, please try again' });

    const cred = await WebAuthnCredential.findOne({ email, credentialID: response.id });
    if (!cred) return res.status(404).json({ error: 'Credential not found' });

    const { expectedOrigin, rpID } = getDynamicOriginAndRPID(req);

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin,
      expectedRPID: rpID,
      authenticator: {
        credentialID: cred.credentialID,
        credentialPublicKey: Buffer.from(cred.publicKey, 'base64url'),
        counter: cred.counter,
        transports: cred.transports,
      },
    });

    if (!verification.verified) {
      return res.status(400).json({ error: 'Could not verify login' });
    }

    cred.counter = verification.authenticationInfo.newCounter;
    cred.lastUsedAt = new Date();
    await cred.save();

    const bio = await Bio.findOne({ email });
    const ua = req.headers['user-agent'] || '';
    const uaHash = crypto.createHash('sha256').update(ua).digest('hex');
    if (bio) {
      bio.lastUserAgentHash = uaHash;
      bio.locationAnomaly = false;
      invalidateMemberGate(bio.email);
      await bio.save();
    }

    const token = signMemberToken(email, req);
    res.cookie('member_jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 14 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      verified: true,
      token,
      member: {
        email,
        displayName: bio?.displayName || email,
        avatarUrl: bio?.avatarUrl || '',
        provider: 'webauthn',
        token,
      },
    });
  } catch (err) {
    console.error('webauthn login-verify error:', err);
    return res.status(500).json({ error: 'Failed to verify login' });
  }
}

/**
 * [Member] Danh sách thiết bị sinh trắc học đã đăng ký
 */
export async function listMemberCredentials(req, res) {
  try {
    const creds = await WebAuthnCredential.find({ email: req.memberEmail })
      .select('deviceName createdAt lastUsedAt _id')
      .sort({ createdAt: -1 });
    return res.json({ credentials: creds });
  } catch {
    return res.status(500).json({ error: 'Failed to list credentials' });
  }
}

/**
 * [Member] Gỡ bỏ thiết bị sinh trắc học
 */
export async function removeMemberCredential(req, res) {
  try {
    await WebAuthnCredential.deleteOne({ _id: req.params.id, email: req.memberEmail });
    return res.json({ success: true });
  } catch {
    return res.status(500).json({ error: 'Failed to remove credential' });
  }
}
