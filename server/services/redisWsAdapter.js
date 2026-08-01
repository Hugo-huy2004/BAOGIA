import Redis from 'ioredis';

let pub = null;
let sub = null;
let isRedisAvailable = false;

const REDIS_URL = process.env.REDIS_URL;

if (REDIS_URL) {
  try {
    pub = new Redis(REDIS_URL, { maxRetriesPerRequest: 3 });
    sub = new Redis(REDIS_URL, { maxRetriesPerRequest: 3 });

    sub.subscribe('WS_USER_NOTIFICATIONS', (err) => {
      if (err) {
        console.error('[Redis WS Sub Error]', err.message);
      } else {
        isRedisAvailable = true;
        console.log('📡 Redis WebSocket Adapter initialized for multi-instance pub/sub');
      }
    });

    sub.on('message', (channel, message) => {
      if (channel === 'WS_USER_NOTIFICATIONS') {
        try {
          const { email, payload } = JSON.parse(message);
          sendLocalWsMessage(email, payload);
        } catch (_) {
          // Ignore parse errors
        }
      }
    });
  } catch (err) {
    console.warn('[Redis WS] Redis URL provided but connection failed, falling back to local WS in-memory:', err.message);
  }
} else {
  console.log('ℹ️  No REDIS_URL configured; using local in-memory WebSocket dispatcher');
}

/** Sends a WebSocket message directly to locally connected clients for an email */
function sendLocalWsMessage(email, payload) {
  const clients = global.wsClients?.[email];
  if (clients && clients.size > 0) {
    const dataStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
    for (const ws of clients) {
      if (ws.readyState === 1 /* OPEN */) {
        ws.send(dataStr);
      }
    }
  }
}

/**
 * Broadcasts a WebSocket payload to a specific user email across all server instances.
 * Falls back seamlessly to local in-memory delivery if Redis is not configured.
 */
export function broadcastToUser(email, payload) {
  if (isRedisAvailable && pub) {
    pub.publish('WS_USER_NOTIFICATIONS', JSON.stringify({ email, payload })).catch(err => {
      console.error('[Redis WS Publish Error]', err.message);
      sendLocalWsMessage(email, payload);
    });
  } else {
    sendLocalWsMessage(email, payload);
  }
}
