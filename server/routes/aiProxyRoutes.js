import express from 'express';
import { Readable } from 'stream';
import CompanionHistory from '../models/CompanionHistory.js';
import { embedText, cosine } from '../services/embeddingService.js';
import {
  assessHugoPsyContent,
  recordSecurityViolation,
  sendSecurityBlockResponse,
  serverAiUserId,
} from '../services/securityEnforcement.js';

const router = express.Router();

// The Python AI server (python-ai-server/main.py) is never exposed to the
// browser directly — there is no public "ai.<domain>" subdomain. The frontend
// always calls same-origin `/api/ai/...`, and this proxy forwards it
// server-to-server to AI_SERVER_URL (a private env var, e.g. an internal
// Render/Railway URL or http://localhost:8000 in dev).
const AI_SERVER_URL = process.env.AI_SERVER_URL || 'http://localhost:8000';

// Only worth the embedding round-trip near the start of a session — this is
// mounted at /chat so it also covers /chat/stream, but never /chat/audio
// (multipart body, req.body.message is never set there so it no-ops safely).
const MEMORY_RECALL_MAX_HISTORY_TURNS = 1;
const MEMORY_RECALL_MIN_SCORE = 0.55;
const MEMORY_RECALL_TOP_K = 2;
const MAX_REPORT_REQUEST_BYTES = 11 * 1024 * 1024;

// Node owns both identity and enforcement. The browser-supplied userId can be
// changed in DevTools, so it must never be the key for quota or abuse history.
// Political criticism, discussion of war, profanity and distress disclosures
// are deliberately not security violations; only concrete attack/exfiltration,
// credible threats and requests for violent operational instructions match.
async function enforceTextChatSecurity(req, res, next) {
  if (!req.body || typeof req.body.message !== 'string') return next();
  req.body.userId = serverAiUserId(req.memberEmail);

  const threat = assessHugoPsyContent(req.body.message);
  if (!threat) return next();

  try {
    const result = await recordSecurityViolation({
      req,
      email: req.memberEmail,
      ...threat,
    });

    if (result.block && !req.path.endsWith('/stream')) {
      return sendSecurityBlockResponse(res, result.block);
    }

    const status = result.block ? 403 : 422;
    const payload = result.block
      ? {
          error: 'ACCESS_BLOCKED',
          message: result.block.permanent
            ? 'Tài khoản đã bị khóa vĩnh viễn theo tiêu chuẩn an toàn.'
            : 'Tài khoản và mạng truy cập đã bị khóa 30 ngày theo tiêu chuẩn an toàn.',
          caseId: result.caseId,
          permanent: Boolean(result.block.permanent),
          blockedUntil: result.block.expiresAt || null,
        }
      : {
          error: 'CONTENT_REJECTED',
          message: 'Yêu cầu này không thể được xử lý vì có dấu hiệu hướng dẫn bạo lực hoặc gây hại. Nếu bạn đang gặp nguy hiểm thực tế, hãy liên hệ người tin cậy hoặc dịch vụ khẩn cấp tại nơi bạn sống.',
          caseId: result.caseId,
        };

    if (req.path.endsWith('/stream')) {
      res.status(status);
      res.set('Content-Type', 'text/event-stream; charset=utf-8');
      res.set('Cache-Control', 'no-store');
      if (result.block) {
        res.set('X-Security-Blocked', '1');
        res.set('X-Security-Case', result.caseId);
        res.set('X-Security-Permanent', result.block.permanent ? '1' : '0');
        if (result.block.expiresAt) res.set('X-Security-Until', new Date(result.block.expiresAt).toISOString());
      }
      return res.end(`data: ${JSON.stringify(payload)}\n\n`);
    }
    return res.status(status).json(payload);
  } catch (error) {
    console.error('[HugoPsy security enforcement]', error.message);
    return res.status(503).json({ error: 'Không thể kiểm tra tiêu chuẩn an toàn lúc này.' });
  }
}

// Long-term semantic recall: this router sits behind requireMember (see
// server.js), so req.memberEmail identifies the real user even though the
// browser only ever sends a pseudonymized userId to the AI server itself.
// Best-effort and silent on any failure — chat must never break because
// memory lookup/embedding hiccups. Mutates req.body.bio in place.
async function enrichWithLongTermMemory(req, _res, next) {
  try {
    const email = req.memberEmail;
    const message = req.body?.message;
    const historyLen = Array.isArray(req.body?.history) ? req.body.history.length : 0;
    if (!email || typeof message !== 'string' || !message.trim() || historyLen > MEMORY_RECALL_MAX_HISTORY_TURNS) {
      return next();
    }

    const doc = await CompanionHistory.findOne({ email }, { longTermMemories: 1 });
    const memories = doc?.longTermMemories || [];
    if (memories.length === 0) return next();

    const queryVec = await embedText(message.trim());
    if (!queryVec?.length) return next();

    const ranked = memories
      .map((m) => ({ summary: m.summary, score: cosine(queryVec, m.embedding || []) }))
      .filter((m) => m.summary && Number.isFinite(m.score) && m.score >= MEMORY_RECALL_MIN_SCORE)
      .sort((a, b) => b.score - a.score)
      .slice(0, MEMORY_RECALL_TOP_K);

    if (ranked.length > 0) {
      req.body.bio = { ...(req.body.bio || {}), longTermMemories: ranked.map((m) => m.summary) };
    }
  } catch (err) {
    console.error('Long-term memory recall skipped:', err.message);
  }
  next();
}

// Generic forward for JSON POST/GET endpoints (chat, intent classify, analyze-test,
// therapy/*, report/weekly, etc). The request already passed express.json()/
// urlencoded() at the app level, so req.body is a parsed object for JSON bodies.
async function forwardJson(req, res) {
  const targetUrl = `${AI_SERVER_URL}/api/ai${req.path}${req._parsedUrl?.search || ''}`;
  try {
    const upstreamBody = { ...(req.body || {}), userId: serverAiUserId(req.memberEmail) };
    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Key': process.env.INTERNAL_API_KEY || '',
        'X-Member-Id': serverAiUserId(req.memberEmail),
        // Chỉ dùng để trừ token đã mua trong Bio (Mongo). KHÔNG bao giờ đi tiếp
        // sang Gemini: payload bio gửi cho model vẫn là allow-list ở AIBot.js.
        'X-Member-Email': req.memberEmail || '',
      },
      body: req.method === 'GET' || req.method === 'HEAD' ? undefined : JSON.stringify(upstreamBody)
    });
    const text = await upstream.text();
    if (upstream.status >= 500) {
      return res.status(upstream.status).json({ error: 'Dịch vụ AI tạm thời không khả dụng.' });
    }
    res.status(upstream.status);
    res.set('Content-Type', upstream.headers.get('content-type') || 'application/json');
    res.send(text);
  } catch (err) {
    console.error('AI proxy error:', targetUrl, err.message);
    res.status(502).json({ error: 'AI server unreachable' });
  }
}

// Medical report OCR receives multipart/form-data. Forward the untouched
// request stream so the filename, MIME type and binary body reach FastAPI.
// Treating this route as JSON silently discarded the uploaded file.
router.post('/analyze-report', async (req, res) => {
  const targetUrl = `${AI_SERVER_URL}/api/ai/analyze-report`;
  const contentType = req.headers['content-type'] || '';
  if (!contentType.toLowerCase().startsWith('multipart/form-data')) {
    return res.status(415).json({ error: 'Expected a multipart file upload' });
  }
  const contentLength = Number(req.headers['content-length']);
  if (Number.isFinite(contentLength) && contentLength > MAX_REPORT_REQUEST_BYTES) {
    return res.status(413).json({ error: 'Report upload exceeds the 10 MB file limit' });
  }

  try {
    const upstream = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': contentType,
        'X-Internal-Key': process.env.INTERNAL_API_KEY || '',
        'X-Member-Id': serverAiUserId(req.memberEmail),
        // Chỉ dùng để trừ token đã mua trong Bio (Mongo). KHÔNG bao giờ đi tiếp
        // sang Gemini: payload bio gửi cho model vẫn là allow-list ở AIBot.js.
        'X-Member-Email': req.memberEmail || '',
      },
      body: Readable.toWeb(req),
      duplex: 'half'
    });
    const text = await upstream.text();
    if (upstream.status >= 500) {
      return res.status(upstream.status).json({ error: 'Dịch vụ phân tích tạm thời không khả dụng.' });
    }
    res.status(upstream.status);
    res.set('Content-Type', upstream.headers.get('content-type') || 'application/json');
    res.set('Cache-Control', 'no-store');
    res.send(text);
  } catch (err) {
    console.error('AI report proxy error:', targetUrl, err.message);
    res.status(502).json({ error: 'Report analysis service unavailable' });
  }
});

// Applies to /chat and /chat/stream (both declared below); /chat/audio's
// multipart body has no req.body.message so it passes through untouched.
router.use('/chat', enforceTextChatSecurity);
router.use('/chat', enrichWithLongTermMemory);

// Streaming endpoint (Server-Sent Events) — pipe the upstream stream straight
// through instead of buffering, so the client still sees live token-by-token
// chunks exactly as if it talked to the Python server directly.
router.post('/chat/stream', async (req, res) => {
  const targetUrl = `${AI_SERVER_URL}/api/ai/chat/stream`;
  try {
    const upstream = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Key': process.env.INTERNAL_API_KEY || '',
        'X-Member-Id': serverAiUserId(req.memberEmail),
        // Chỉ dùng để trừ token đã mua trong Bio (Mongo). KHÔNG bao giờ đi tiếp
        // sang Gemini: payload bio gửi cho model vẫn là allow-list ở AIBot.js.
        'X-Member-Email': req.memberEmail || '',
      },
      body: JSON.stringify(req.body || {})
    });
    if (upstream.status >= 500) {
      return res.status(upstream.status).json({ error: 'Dịch vụ AI tạm thời không khả dụng.' });
    }
    res.status(upstream.status);
    res.set('Content-Type', upstream.headers.get('content-type') || 'text/event-stream');
    res.set('Cache-Control', 'no-cache');
    res.set('Connection', 'keep-alive');
    if (!upstream.body) return res.end();
    Readable.fromWeb(upstream.body).pipe(res);
  } catch (err) {
    console.error('AI proxy stream error:', targetUrl, err.message);
    res.status(502).json({ error: 'AI server unreachable' });
  }
});

// Audio chat (multipart/form-data: file + history + bio + isCallMode + userId).
// express.json()/urlencoded() at the app level skip non-matching content-types,
// so the raw multipart body stream is still intact here — pipe it straight
// through to the Python server with the same headers (incl. boundary).
router.post('/chat/audio', async (req, res) => {
  const targetUrl = `${AI_SERVER_URL}/api/ai/chat/audio`;
  try {
    const upstream = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': req.headers['content-type'],
        'X-Internal-Key': process.env.INTERNAL_API_KEY || '',
        'X-Member-Id': serverAiUserId(req.memberEmail),
        // Chỉ dùng để trừ token đã mua trong Bio (Mongo). KHÔNG bao giờ đi tiếp
        // sang Gemini: payload bio gửi cho model vẫn là allow-list ở AIBot.js.
        'X-Member-Email': req.memberEmail || '',
      },
      body: Readable.toWeb(req),
      duplex: 'half'
    });
    const text = await upstream.text();
    if (upstream.status >= 500) {
      return res.status(upstream.status).json({ error: 'Dịch vụ hội thoại âm thanh tạm thời không khả dụng.' });
    }
    res.status(upstream.status);
    res.set('Content-Type', upstream.headers.get('content-type') || 'application/json');
    res.send(text);
  } catch (err) {
    console.error('AI proxy audio error:', targetUrl, err.message);
    res.status(502).json({ error: 'AI server unreachable' });
  }
});

router.all('/*', forwardJson);

export default router;
