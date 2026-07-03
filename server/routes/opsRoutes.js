import express from 'express';
import { Buffer } from 'buffer';
import { requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();
const events = [];
const MAX_EVENTS = 500;
const ALLOWED_TYPES = new Set([
  'web-vital',
  'runtime-error',
  'unhandled-rejection',
  'react-error-boundary',
  'slow-api',
  'api-error',
  'api-network-error',
]);

function clean(value, limit = 500) {
  return String(value || '').replace(/[\r\n\t]+/g, ' ').slice(0, limit);
}

function cleanPath(value) {
  const raw = clean(value, 220);
  return raw.split('?')[0].replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/ig, '[email]');
}

function normalizeEvent(body = {}, req) {
  const type = ALLOWED_TYPES.has(body.type) ? body.type : 'runtime-error';
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    type,
    name: clean(body.name, 80),
    rating: clean(body.rating, 40),
    value: Number.isFinite(Number(body.value)) ? Number(body.value) : undefined,
    durationMs: Number.isFinite(Number(body.durationMs)) ? Math.round(Number(body.durationMs)) : undefined,
    status: Number.isFinite(Number(body.status)) ? Number(body.status) : undefined,
    method: clean(body.method, 12),
    path: cleanPath(body.path),
    page: cleanPath(body.page),
    message: clean(body.message, 240),
    stack: clean(body.stack, 700),
    source: clean(body.source || 'web', 40),
    ipHash: req.ip ? Buffer.from(req.ip).toString('base64').slice(0, 16) : '',
    createdAt: new Date().toISOString(),
  };
}

router.post('/client-event', (req, res) => {
  try {
    const event = normalizeEvent(req.body, req);
    events.push(event);
    if (events.length > MAX_EVENTS) events.splice(0, events.length - MAX_EVENTS);

    if (event.type !== 'web-vital' || event.rating === 'poor') {
      console.warn('[client-event]', event.type, event.method || '', event.status || '', event.durationMs || '', event.path || event.name || '');
    }
    res.status(204).end();
  } catch {
    res.status(204).end();
  }
});

router.get('/client-events', requireAdmin, (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, MAX_EVENTS);
  res.json({ events: events.slice(-limit).reverse() });
});

export default router;
