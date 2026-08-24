import express from 'express';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import OAuthClient from '../models/OAuthClient.js';
import OAuthAuthorizationCode from '../models/OAuthAuthorizationCode.js';
import OAuthToken from '../models/OAuthToken.js';
import Bio from '../models/Bio.js';
import AdminAuditLog from '../models/AdminAuditLog.js';
import { requireAdmin, requireMemberSession } from '../middleware/authMiddleware.js';
import { JWT_SECRET } from '../utils/secrets.js';

const router = express.Router();
const ACCESS_TOKEN_TTL_MS = 60 * 60 * 1000;
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const AUTH_CODE_TTL_MS = 5 * 60 * 1000;
const SUPPORTED_SCOPES = new Set(['profile', 'email']);

const tokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 120 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'temporarily_unavailable', error_description: 'Quá nhiều yêu cầu token.' },
});

const hash = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');
const randomToken = (prefix) => `${prefix}_${crypto.randomBytes(32).toString('base64url')}`;
const safeEqualHash = (raw, expectedHash) => {
  const actual = Buffer.from(hash(raw));
  const expected = Buffer.from(String(expectedHash || ''));
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
};

const oauthError = (res, status, error, description) =>
  res.status(status).json({ error, error_description: description });

const parseScopes = (scopeValue, allowedScopes) => {
  const requested = String(scopeValue || 'profile email').split(/\s+/).filter(Boolean);
  const unique = [...new Set(requested)];
  if (!unique.length || unique.some((scope) => !SUPPORTED_SCOPES.has(scope) || !allowedScopes.includes(scope))) {
    return null;
  }
  return unique;
};

const isValidRedirectUri = (value) => {
  try {
    const parsed = new URL(value);
    if (parsed.hash || parsed.username || parsed.password) return false;
    if (parsed.protocol === 'https:') return true;
    if (parsed.protocol === 'http:') return ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname);
    return /^[a-z][a-z0-9+.-]*:$/.test(parsed.protocol) && !['javascript:', 'data:', 'file:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

const normalizeRedirectUris = (input) => {
  const values = Array.isArray(input) ? input : String(input || '').split(/[\n,]/);
  const uris = [...new Set(values.map((value) => String(value).trim()).filter(Boolean))];
  if (!uris.length || uris.length > 20 || uris.some((uri) => !isValidRedirectUri(uri))) return null;
  return uris;
};

const originsFromRedirectUris = (redirectUris) => [...new Set(redirectUris.map((uri) => {
  try {
    const origin = new URL(uri).origin;
    return origin === 'null' ? '' : origin;
  } catch {
    return '';
  }
}).filter(Boolean))];

const optionalWebUrl = (value) => {
  const clean = String(value || '').trim();
  if (!clean) return '';
  try {
    const url = new URL(clean);
    return ['https:', 'http:'].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
};

const serializeClient = (client, extra = {}) => ({
  id: String(client._id),
  name: client.name,
  description: client.description,
  clientId: client.clientId,
  clientType: client.clientType,
  redirectUris: client.redirectUris,
  allowedScopes: client.allowedScopes,
  logoUrl: client.logoUrl,
  homepageUrl: client.homepageUrl,
  privacyUrl: client.privacyUrl,
  status: client.status,
  createdAt: client.createdAt,
  updatedAt: client.updatedAt,
  lastUsedAt: client.lastUsedAt,
  secretRotatedAt: client.secretRotatedAt,
  ...extra,
});

const audit = (req, action, client, details = {}) =>
  AdminAuditLog.create({
    adminId: String(req.admin?.id || 'admin'),
    adminUsername: req.admin?.username || 'admin',
    action,
    ipAddress: req.ip || '',
    userAgent: req.headers['user-agent'] || '',
    details: { clientId: client?.clientId || '', clientName: client?.name || '', ...details },
  }).catch((error) => console.error(`[OAuth audit ${action}]`, error.message));

const readClientCredentials = (req) => {
  let clientId = String(req.body?.client_id || '').trim();
  let clientSecret = String(req.body?.client_secret || '');
  const auth = String(req.headers.authorization || '');
  if (auth.startsWith('Basic ')) {
    try {
      const decoded = Buffer.from(auth.slice(6), 'base64').toString('utf8');
      const separator = decoded.indexOf(':');
      if (separator >= 0) {
        clientId = decodeURIComponent(decoded.slice(0, separator));
        clientSecret = decodeURIComponent(decoded.slice(separator + 1));
      }
    } catch {
      return { clientId: '', clientSecret: '' };
    }
  }
  return { clientId, clientSecret };
};

const authenticateClient = async (req) => {
  const { clientId, clientSecret } = readClientCredentials(req);
  if (!clientId) return null;
  const client = await OAuthClient.findOne({ clientId, status: 'active' }).select('+clientSecretHash');
  if (!client) return null;
  if (client.clientType === 'confidential' && (!clientSecret || !safeEqualHash(clientSecret, client.clientSecretHash))) {
    return null;
  }
  return client;
};

const validateAuthorizationRequest = async (query) => {
  const clientId = String(query.client_id || '');
  const redirectUri = String(query.redirect_uri || '');
  const responseType = String(query.response_type || '');
  const codeChallenge = String(query.code_challenge || '');
  const codeChallengeMethod = String(query.code_challenge_method || '');
  const state = String(query.state || '');
  if (!clientId || !redirectUri) return { error: 'invalid_request', description: 'Thiếu client_id hoặc redirect_uri.' };
  const client = await OAuthClient.findOne({ clientId, status: 'active' });
  if (!client) return { error: 'unauthorized_client', description: 'Ứng dụng không tồn tại hoặc đã bị thu hồi.' };
  if (!client.redirectUris.includes(redirectUri)) return { error: 'invalid_request', description: 'redirect_uri không được đăng ký.' };
  if (responseType !== 'code') return { error: 'unsupported_response_type', description: 'Chỉ hỗ trợ response_type=code.', client, redirectUri, state };
  if (codeChallengeMethod !== 'S256' || !/^[A-Za-z0-9_-]{43,128}$/.test(codeChallenge)) {
    return { error: 'invalid_request', description: 'PKCE S256 là bắt buộc.', client, redirectUri, state };
  }
  if (state.length > 1000) return { error: 'invalid_request', description: 'state quá dài.', client, redirectUri };
  const scopes = parseScopes(query.scope, client.allowedScopes);
  if (!scopes) return { error: 'invalid_scope', description: 'Scope không hợp lệ.', client, redirectUri, state };
  return { client, redirectUri, scopes, codeChallenge, state };
};

const withRedirectParams = (redirectUri, params) => {
  const target = new URL(redirectUri);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') target.searchParams.set(key, String(value));
  });
  return target.toString();
};

// GET /api/oauth/authorize/context — SPA consent page reads validated details.
router.get('/authorize/context', requireMemberSession, async (req, res) => {
  try {
    const checked = await validateAuthorizationRequest(req.query);
    if (checked.error) return oauthError(res, 400, checked.error, checked.description);
    const bio = await Bio.findOne({ email: req.memberEmail }).select('displayName avatarUrl').lean();
    return res.json({
      success: true,
      application: {
        name: checked.client.name,
        description: checked.client.description,
        logoUrl: checked.client.logoUrl,
        homepageUrl: checked.client.homepageUrl,
        privacyUrl: checked.client.privacyUrl,
      },
      member: { displayName: bio?.displayName || req.memberEmail.split('@')[0], email: req.memberEmail },
      scopes: checked.scopes,
    });
  } catch (error) {
    console.error('[OAuth authorize context]', error.message);
    return oauthError(res, 500, 'server_error', 'Không thể kiểm tra yêu cầu đăng nhập.');
  }
});

// POST /api/oauth/authorize/decision — user approves or denies the request.
router.post('/authorize/decision', requireMemberSession, async (req, res) => {
  try {
    const checked = await validateAuthorizationRequest(req.body);
    if (checked.error) return oauthError(res, 400, checked.error, checked.description);
    if (req.body.decision !== 'approve') {
      return res.json({ redirectTo: withRedirectParams(checked.redirectUri, { error: 'access_denied', state: checked.state }) });
    }

    const code = randomToken('hsc');
    await OAuthAuthorizationCode.create({
      codeHash: hash(code),
      clientId: checked.client.clientId,
      memberEmail: req.memberEmail,
      redirectUri: checked.redirectUri,
      scopes: checked.scopes,
      codeChallenge: checked.codeChallenge,
      expiresAt: new Date(Date.now() + AUTH_CODE_TTL_MS),
    });
    return res.json({ redirectTo: withRedirectParams(checked.redirectUri, { code, state: checked.state }) });
  } catch (error) {
    console.error('[OAuth authorize decision]', error.message);
    return oauthError(res, 500, 'server_error', 'Không thể hoàn tất cấp quyền.');
  }
});

router.post('/token', tokenLimiter, async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
  try {
    const client = await authenticateClient(req);
    if (!client) {
      res.setHeader('WWW-Authenticate', 'Basic realm="Hugo Studio OAuth"');
      return oauthError(res, 401, 'invalid_client', 'Thông tin ứng dụng không hợp lệ.');
    }

    const grantType = String(req.body.grant_type || '');
    if (grantType === 'authorization_code') {
      const code = String(req.body.code || '');
      const redirectUri = String(req.body.redirect_uri || '');
      const verifier = String(req.body.code_verifier || '');
      if (!code || !redirectUri || !/^[A-Za-z0-9._~-]{43,128}$/.test(verifier)) {
        return oauthError(res, 400, 'invalid_request', 'Thiếu code, redirect_uri hoặc code_verifier hợp lệ.');
      }
      const authCode = await OAuthAuthorizationCode.findOneAndUpdate(
        { codeHash: hash(code), usedAt: null, expiresAt: { $gt: new Date() } },
        { $set: { usedAt: new Date() } },
        { new: true }
      );
      if (!authCode || authCode.clientId !== client.clientId || authCode.redirectUri !== redirectUri) {
        return oauthError(res, 400, 'invalid_grant', 'Authorization code không hợp lệ hoặc đã được dùng.');
      }
      const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
      if (challenge !== authCode.codeChallenge) {
        return oauthError(res, 400, 'invalid_grant', 'PKCE code_verifier không khớp.');
      }

      const accessToken = randomToken('hsa');
      const refreshToken = randomToken('hsr');
      await OAuthToken.create({
        accessTokenHash: hash(accessToken),
        refreshTokenHash: hash(refreshToken),
        clientId: client.clientId,
        memberEmail: authCode.memberEmail,
        scopes: authCode.scopes,
        accessExpiresAt: new Date(Date.now() + ACCESS_TOKEN_TTL_MS),
        refreshExpiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      });
      await OAuthClient.updateOne({ _id: client._id }, { $set: { lastUsedAt: new Date() } });
      return res.json({
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: Math.floor(ACCESS_TOKEN_TTL_MS / 1000),
        refresh_token: refreshToken,
        scope: authCode.scopes.join(' '),
      });
    }

    if (grantType === 'refresh_token') {
      const supplied = String(req.body.refresh_token || '');
      const tokenRecord = await OAuthToken.findOne({
        refreshTokenHash: hash(supplied),
        clientId: client.clientId,
        revokedAt: null,
        refreshExpiresAt: { $gt: new Date() },
      });
      if (!supplied || !tokenRecord) return oauthError(res, 400, 'invalid_grant', 'Refresh token không hợp lệ.');
      const accessToken = randomToken('hsa');
      const refreshToken = randomToken('hsr');
      tokenRecord.accessTokenHash = hash(accessToken);
      tokenRecord.refreshTokenHash = hash(refreshToken);
      tokenRecord.accessExpiresAt = new Date(Date.now() + ACCESS_TOKEN_TTL_MS);
      tokenRecord.refreshExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
      tokenRecord.lastUsedAt = new Date();
      await tokenRecord.save();
      return res.json({
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: Math.floor(ACCESS_TOKEN_TTL_MS / 1000),
        refresh_token: refreshToken,
        scope: tokenRecord.scopes.join(' '),
      });
    }

    return oauthError(res, 400, 'unsupported_grant_type', 'Chỉ hỗ trợ authorization_code và refresh_token.');
  } catch (error) {
    console.error('[OAuth token]', error.message);
    return oauthError(res, 500, 'server_error', 'Không thể cấp token.');
  }
});

router.get('/userinfo', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const match = String(req.headers.authorization || '').match(/^Bearer\s+(.+)$/i);
    if (!match) return oauthError(res, 401, 'invalid_token', 'Thiếu Bearer access token.');
    const record = await OAuthToken.findOne({
      accessTokenHash: hash(match[1]),
      revokedAt: null,
      accessExpiresAt: { $gt: new Date() },
    });
    if (!record) return oauthError(res, 401, 'invalid_token', 'Access token không hợp lệ hoặc đã hết hạn.');
    const bio = await Bio.findOne({ email: record.memberEmail }).select('displayName avatarUrl').lean();
    const payload = {
      sub: crypto.createHmac('sha256', JWT_SECRET).update(`${record.clientId}:${record.memberEmail}`).digest('base64url'),
    };
    if (record.scopes.includes('profile')) {
      payload.name = bio?.displayName || record.memberEmail.split('@')[0];
      payload.picture = bio?.avatarUrl || '';
    }
    if (record.scopes.includes('email')) {
      payload.email = record.memberEmail;
      payload.email_verified = true;
    }
    record.lastUsedAt = new Date();
    await record.save();
    return res.json(payload);
  } catch (error) {
    console.error('[OAuth userinfo]', error.message);
    return oauthError(res, 500, 'server_error', 'Không thể đọc hồ sơ người dùng.');
  }
});

router.post('/revoke', tokenLimiter, async (req, res) => {
  try {
    const client = await authenticateClient(req);
    if (!client) return oauthError(res, 401, 'invalid_client', 'Thông tin ứng dụng không hợp lệ.');
    const tokenHash = hash(req.body.token || '');
    await OAuthToken.updateMany(
      { clientId: client.clientId, $or: [{ accessTokenHash: tokenHash }, { refreshTokenHash: tokenHash }] },
      { $set: { revokedAt: new Date() } }
    );
    return res.status(200).send();
  } catch (error) {
    console.error('[OAuth revoke]', error.message);
    return oauthError(res, 500, 'server_error', 'Không thể thu hồi token.');
  }
});

router.post('/introspect', tokenLimiter, async (req, res) => {
  try {
    const client = await authenticateClient(req);
    if (!client || client.clientType !== 'confidential') return oauthError(res, 401, 'invalid_client', 'Confidential client là bắt buộc.');
    const record = await OAuthToken.findOne({ accessTokenHash: hash(req.body.token || ''), clientId: client.clientId });
    const active = Boolean(record && !record.revokedAt && record.accessExpiresAt > new Date());
    if (!active) return res.json({ active: false });
    return res.json({
      active: true,
      client_id: record.clientId,
      scope: record.scopes.join(' '),
      sub: crypto.createHmac('sha256', JWT_SECRET).update(`${record.clientId}:${record.memberEmail}`).digest('base64url'),
      exp: Math.floor(record.accessExpiresAt.getTime() / 1000),
    });
  } catch (error) {
    console.error('[OAuth introspect]', error.message);
    return oauthError(res, 500, 'server_error', 'Không thể kiểm tra token.');
  }
});

export const oauthMetadata = (req, res) => {
  // Render nhận request đã được Vercel rewrite nên Host có thể là api.*; trang
  // authorize lại nằm ở web origin. Production có mặc định đúng để quên env
  // không sinh ra authorization_endpoint trỏ vào một trang 404 trên API host.
  const fallbackOrigin = process.env.NODE_ENV === 'production'
    ? 'https://www.hugowishpax.studio'
    : `${req.protocol}://${req.get('host')}`;
  const publicOrigin = String(process.env.OAUTH_ISSUER || fallbackOrigin).replace(/\/$/, '');
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.json({
    issuer: publicOrigin,
    authorization_endpoint: `${publicOrigin}/oauth/authorize`,
    token_endpoint: `${publicOrigin}/api/oauth/token`,
    userinfo_endpoint: `${publicOrigin}/api/oauth/userinfo`,
    revocation_endpoint: `${publicOrigin}/api/oauth/revoke`,
    introspection_endpoint: `${publicOrigin}/api/oauth/introspect`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    code_challenge_methods_supported: ['S256'],
    scopes_supported: [...SUPPORTED_SCOPES],
    token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post', 'none'],
  });
};

router.get('/.well-known/oauth-authorization-server', oauthMetadata);

// ── Admin client registry ──────────────────────────────────────────────────
router.get('/admin/clients', requireAdmin, async (req, res) => {
  try {
    const clients = await OAuthClient.find({}).sort({ createdAt: -1 }).lean();
    const data = await Promise.all(clients.map(async (client) => {
      const [activeTokens, totalTokens] = await Promise.all([
        OAuthToken.countDocuments({ clientId: client.clientId, revokedAt: null, refreshExpiresAt: { $gt: new Date() } }),
        OAuthToken.countDocuments({ clientId: client.clientId }),
      ]);
      return serializeClient(client, { activeTokens, totalTokens });
    }));
    return res.json({ success: true, clients: data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/admin/clients', requireAdmin, async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const redirectUris = normalizeRedirectUris(req.body.redirectUris);
    const clientType = req.body.clientType === 'public' ? 'public' : 'confidential';
    const homepageUrl = optionalWebUrl(req.body.homepageUrl);
    const privacyUrl = optionalWebUrl(req.body.privacyUrl);
    const logoUrl = optionalWebUrl(req.body.logoUrl);
    if (!name || !redirectUris) return res.status(400).json({ error: 'Tên và redirect URI hợp lệ là bắt buộc.' });
    if ([homepageUrl, privacyUrl, logoUrl].includes(null)) return res.status(400).json({ error: 'Logo/homepage/privacy URL không hợp lệ.' });
    const clientId = randomToken('hugo');
    const clientSecret = clientType === 'confidential' ? randomToken('hugs') : '';
    const client = await OAuthClient.create({
      name,
      description: String(req.body.description || '').trim(),
      clientId,
      clientSecretHash: clientSecret ? hash(clientSecret) : '',
      clientType,
      redirectUris,
      allowedOrigins: originsFromRedirectUris(redirectUris),
      allowedScopes: ['profile', 'email'],
      homepageUrl,
      privacyUrl,
      logoUrl,
      createdBy: String(req.admin?.id || 'admin'),
      secretRotatedAt: clientSecret ? new Date() : null,
    });
    audit(req, 'oauth_client_create', client, { clientType, redirectUris });
    return res.status(201).json({ success: true, client: serializeClient(client), clientSecret: clientSecret || undefined });
  } catch (error) {
    console.error('[OAuth admin create]', error.message);
    return res.status(500).json({ error: 'Không thể tạo ứng dụng OAuth.' });
  }
});

router.patch('/admin/clients/:id', requireAdmin, async (req, res) => {
  try {
    const client = await OAuthClient.findById(req.params.id);
    if (!client) return res.status(404).json({ error: 'Không tìm thấy ứng dụng.' });
    if (req.body.name !== undefined) client.name = String(req.body.name).trim();
    if (req.body.description !== undefined) client.description = String(req.body.description).trim();
    if (req.body.redirectUris !== undefined) {
      const redirects = normalizeRedirectUris(req.body.redirectUris);
      if (!redirects) return res.status(400).json({ error: 'Redirect URI không hợp lệ.' });
      client.redirectUris = redirects;
      client.allowedOrigins = originsFromRedirectUris(redirects);
    }
    for (const field of ['homepageUrl', 'privacyUrl', 'logoUrl']) {
      if (req.body[field] !== undefined) {
        const value = optionalWebUrl(req.body[field]);
        if (value === null) return res.status(400).json({ error: `${field} không hợp lệ.` });
        client[field] = value;
      }
    }
    if (['active', 'revoked'].includes(req.body.status)) client.status = req.body.status;
    await client.save();
    if (client.status === 'revoked') {
      await OAuthToken.updateMany({ clientId: client.clientId, revokedAt: null }, { $set: { revokedAt: new Date() } });
    }
    audit(req, 'oauth_client_update', client, { status: client.status, redirectUris: client.redirectUris });
    return res.json({ success: true, client: serializeClient(client) });
  } catch (error) {
    console.error('[OAuth admin update]', error.message);
    return res.status(500).json({ error: 'Không thể cập nhật ứng dụng OAuth.' });
  }
});

router.post('/admin/clients/:id/rotate-secret', requireAdmin, async (req, res) => {
  try {
    const client = await OAuthClient.findById(req.params.id).select('+clientSecretHash');
    if (!client) return res.status(404).json({ error: 'Không tìm thấy ứng dụng.' });
    if (client.clientType !== 'confidential') return res.status(400).json({ error: 'Public client không có client secret.' });
    const clientSecret = randomToken('hugs');
    client.clientSecretHash = hash(clientSecret);
    client.secretRotatedAt = new Date();
    await client.save();
    await OAuthToken.updateMany({ clientId: client.clientId, revokedAt: null }, { $set: { revokedAt: new Date() } });
    audit(req, 'oauth_client_rotate_secret', client, { tokensRevoked: true });
    return res.json({ success: true, clientSecret });
  } catch (error) {
    console.error('[OAuth admin rotate]', error.message);
    return res.status(500).json({ error: 'Không thể luân chuyển client secret.' });
  }
});

router.post('/admin/clients/:id/revoke-tokens', requireAdmin, async (req, res) => {
  try {
    const client = await OAuthClient.findById(req.params.id);
    if (!client) return res.status(404).json({ error: 'Không tìm thấy ứng dụng.' });
    const result = await OAuthToken.updateMany({ clientId: client.clientId, revokedAt: null }, { $set: { revokedAt: new Date() } });
    audit(req, 'oauth_client_revoke_tokens', client, { revoked: result.modifiedCount });
    return res.json({ success: true, revoked: result.modifiedCount });
  } catch {
    return res.status(500).json({ error: 'Không thể thu hồi token.' });
  }
});

export default router;
