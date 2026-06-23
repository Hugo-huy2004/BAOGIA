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

// RP_ID must be a bare registrable domain (no scheme/port) and a suffix of
// the origin host — e.g. "hugowishpax.studio" covers both the apex and the
// "www." subdomain in production. Falls back to localhost for dev.
const RP_NAME = 'Hugo Studio';
const RP_ID = process.env.WEBAUTHN_RP_ID || (process.env.NODE_ENV === 'production' ? 'hugowishpax.studio' : 'localhost');
const ORIGINS = (process.env.CLIENT_URLS || '').split(',').filter(Boolean).concat([
  'https://www.hugowishpax.studio',
  'https://hugowishpax.studio',
  'http://localhost:5173',
  'http://localhost:5174',
]);

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

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
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

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: ORIGINS,
      expectedRPID: RP_ID,
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

    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
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

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: ORIGINS,
      expectedRPID: RP_ID,
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
