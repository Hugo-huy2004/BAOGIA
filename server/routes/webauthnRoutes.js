import express from 'express';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import Bio from '../models/Bio.js';
import WebAuthnCredential from '../models/WebAuthnCredential.js';
import { saveChallenge, consumeChallenge } from '../utils/webauthnChallengeStore.js';

const router = express.Router();

// Default RP_NAME
const RP_NAME = 'Hugo Studio';

// Helper to get dynamic RP_ID and Origin based on the request
// This allows WebAuthn to work seamlessly on localhost, Ngrok, Vercel, Railway, etc.
function getDynamicOriginAndRPID(req) {
  const origin = req.get('origin') || (process.env.NODE_ENV === 'production' ? 'https://hugowishpax.studio' : 'http://localhost:5173');
  let rpID = 'localhost';
  try {
    rpID = new URL(origin).hostname;
  } catch (e) {
    console.warn("Invalid origin URL:", origin);
  }
  return { expectedOrigin: origin, rpID };
}

function bufToB64Url(buf) {
  return Buffer.from(buf).toString('base64url');
}

// POST /api/webauthn/register-options — start registering a new authenticator
// (fingerprint/Face ID) for an already-logged-in member.
router.post('/register-options', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const bio = await Bio.findOne({ email });
    if (!bio) return res.status(404).json({ error: 'Bio not found' });

    const existingCreds = await WebAuthnCredential.find({ email });
    const { rpID } = getDynamicOriginAndRPID(req);

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: rpID,
      userName: email,
      userDisplayName: bio.displayName || email,
      attestationType: 'none',
      excludeCredentials: existingCreds.map(c => ({ id: c.credentialID })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'required', // forces actual fingerprint/Face ID, not just "tap"
      },
    });

    saveChallenge(`reg_${email}`, options.challenge);
    res.json(options);
  } catch (err) {
    console.error('webauthn register-options error:', err);
    res.status(500).json({ error: 'Failed to generate registration options' });
  }
});

// POST /api/webauthn/register-verify — finish registering the authenticator.
router.post('/register-verify', async (req, res) => {
  try {
    const { email, response, deviceName } = req.body;
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

    await WebAuthnCredential.create({
      email,
      credentialID,
      publicKey: bufToB64Url(credentialPublicKey),
      counter,
      transports: response.response?.transports || [],
      deviceName: deviceName || 'Thiết bị',
    });

    res.json({ verified: true });
  } catch (err) {
    console.error('webauthn register-verify error:', err);
    res.status(500).json({ error: 'Failed to verify registration' });
  }
});

// POST /api/webauthn/login-options — start a biometric login for a known email.
router.post('/login-options', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const creds = await WebAuthnCredential.find({ email });
    if (!creds.length) return res.status(404).json({ error: 'NO_CREDENTIALS' });

    const { rpID } = getDynamicOriginAndRPID(req);

    const options = await generateAuthenticationOptions({
      rpID: rpID,
      allowCredentials: creds.map(c => ({ id: c.credentialID, transports: c.transports })),
      userVerification: 'required',
    });

    saveChallenge(`auth_${email}`, options.challenge);
    res.json(options);
  } catch (err) {
    console.error('webauthn login-options error:', err);
    res.status(500).json({ error: 'Failed to generate login options' });
  }
});

// POST /api/webauthn/login-verify — finish the biometric login, returns the
// same profile shape the Google login flow hands to loginMember() client-side.
router.post('/login-verify', async (req, res) => {
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
    res.json({
      verified: true,
      member: {
        email,
        displayName: bio?.displayName || email,
        avatarUrl: bio?.avatarUrl || '',
        provider: 'webauthn',
      },
    });
  } catch (err) {
    console.error('webauthn login-verify error:', err);
    res.status(500).json({ error: 'Failed to verify login' });
  }
});

// GET /api/webauthn/credentials/:email — list registered devices (for the
// member's own security settings screen).
router.get('/credentials/:email', async (req, res) => {
  try {
    const creds = await WebAuthnCredential.find({ email: req.params.email })
      .select('deviceName createdAt lastUsedAt _id')
      .sort({ createdAt: -1 });
    res.json({ credentials: creds });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list credentials' });
  }
});

// DELETE /api/webauthn/credentials/:id — remove a registered device.
router.delete('/credentials/:id', async (req, res) => {
  try {
    const { email } = req.body;
    await WebAuthnCredential.deleteOne({ _id: req.params.id, email });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove credential' });
  }
});

export default router;
