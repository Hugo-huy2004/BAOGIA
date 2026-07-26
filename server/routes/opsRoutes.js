import express from 'express';
import { createHash } from 'crypto';
import { requireAdmin } from '../middleware/authMiddleware.js';
import ClientMetric from '../models/ClientMetric.js';

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
  'api-summary',
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
    requestCount: Math.max(0, Number(body.requestCount) || 0),
    errorCount: Math.max(0, Number(body.errorCount) || 0),
    device: ['mobile', 'tablet', 'desktop'].includes(body.device) ? body.device : 'unknown',
    network: clean(body.network, 20),
    ipHash: req.ip
      ? createHash('sha256').update(`${process.env.METRICS_HASH_SALT || 'local'}:${req.ip}`).digest('hex').slice(0, 16)
      : '',
    createdAt: new Date().toISOString(),
  };
}

router.post('/client-event', (req, res) => {
  try {
    const event = normalizeEvent(req.body, req);
    
    // Only accumulate events in memory in development mode to prevent RAM exhaustion / DDoS in production
    if (process.env.NODE_ENV !== 'production') {
      events.push(event);
      if (events.length > MAX_EVENTS) events.splice(0, events.length - MAX_EVENTS);
    }

    if (process.env.NODE_ENV === 'production' && ['web-vital', 'api-summary'].includes(event.type)) {
      ClientMetric.create({
        type: event.type,
        name: event.name,
        rating: event.rating,
        value: event.value || 0,
        requestCount: event.requestCount,
        errorCount: event.errorCount,
        device: event.device,
        network: event.network,
        page: event.page,
      }).catch((error) => console.warn('[client-metric-write]', error.message));
    }

    if ((event.type !== 'web-vital' && event.type !== 'api-summary') || event.rating === 'poor') {
      console.warn('[client-event]', event.type, event.method || '', event.status || '', event.durationMs || '', event.path || event.name || '');
    }
    res.status(204).end();
  } catch {
    res.status(204).end();
  }
});

router.get('/metrics/summary', requireAdmin, async (req, res) => {
  const hours = Math.min(24 * 30, Math.max(1, Number(req.query.hours) || 24));
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  const [vitals, api] = await Promise.all([
    ClientMetric.aggregate([
      { $match: { type: 'web-vital', createdAt: { $gte: since } } },
      {
        $group: {
          _id: { name: '$name', device: '$device' },
          average: { $avg: '$value' },
          samples: { $sum: 1 },
          poor: { $sum: { $cond: [{ $eq: ['$rating', 'poor'] }, 1, 0] } },
        }
      },
      { $sort: { '_id.name': 1, '_id.device': 1 } }
    ]),
    ClientMetric.aggregate([
      { $match: { type: 'api-summary', createdAt: { $gte: since } } },
      {
        $group: {
          _id: '$device',
          requests: { $sum: '$requestCount' },
          errors: { $sum: '$errorCount' },
        }
      }
    ])
  ]);

  res.json({
    since,
    hours,
    vitals,
    api: api.map((item) => ({
      device: item._id,
      requests: item.requests,
      errors: item.errors,
      errorRate: item.requests ? item.errors / item.requests : 0,
    })),
  });
});

router.get('/client-events', requireAdmin, (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, MAX_EVENTS);
  res.json({ events: events.slice(-limit).reverse() });
});

router.post('/clean-events', requireAdmin, (req, res) => {
  events.length = 0;
  res.json({ success: true });
});

export default router;
