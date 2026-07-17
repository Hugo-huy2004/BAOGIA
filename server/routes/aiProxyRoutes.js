import express from 'express';
import { Readable } from 'stream';

const router = express.Router();

// The Python AI server (python-ai-server/main.py) is never exposed to the
// browser directly — there is no public "ai.<domain>" subdomain. The frontend
// always calls same-origin `/api/ai/...`, and this proxy forwards it
// server-to-server to AI_SERVER_URL (a private env var, e.g. an internal
// Render/Railway URL or http://localhost:8000 in dev).
const AI_SERVER_URL = process.env.AI_SERVER_URL || 'http://localhost:8000';

// Generic forward for JSON POST/GET endpoints (chat, intent classify, analyze-test,
// therapy/*, report/weekly, etc). The request already passed express.json()/
// urlencoded() at the app level, so req.body is a parsed object for JSON bodies.
async function forwardJson(req, res) {
  const targetUrl = `${AI_SERVER_URL}/api/ai${req.path}${req._parsedUrl?.search || ''}`;
  try {
    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Key': process.env.INTERNAL_API_KEY || ''
      },
      body: req.method === 'GET' || req.method === 'HEAD' ? undefined : JSON.stringify(req.body || {})
    });
    const text = await upstream.text();
    res.status(upstream.status);
    res.set('Content-Type', upstream.headers.get('content-type') || 'application/json');
    res.send(text);
  } catch (err) {
    console.error('AI proxy error:', targetUrl, err.message);
    res.status(502).json({ error: 'AI server unreachable' });
  }
}

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
        'X-Internal-Key': process.env.INTERNAL_API_KEY || ''
      },
      body: JSON.stringify(req.body || {})
    });
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
        'X-Internal-Key': process.env.INTERNAL_API_KEY || ''
      },
      body: Readable.toWeb(req),
      duplex: 'half'
    });
    const text = await upstream.text();
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
