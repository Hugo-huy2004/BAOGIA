/**
 * QUẢN LÝ WEBSOCKET SERVER VÀ UPGRADE DISPATCHER
 * Tuân thủ Quy tắc 2 (Viblo): Tách logic nâng cấp WebSocket và xử lý kết nối khỏi server.js
 */
import { WebSocketServer } from 'ws';
import { memberEmailFromRequest } from '../middleware/authMiddleware.js';
import { initChessWS } from './chessWS.js';
import { findActiveSecurityBlock } from './securityEnforcement.js';
import { originAllowed } from '../middleware/originLock.js';
import { clientIp as getClientIp } from '../utils/clientIp.js';
import { allowedOrigins, isDev, localOriginRegex } from '../config/cors.js';

let realtimeWss = null;
let acceptedConnections = 0;
let closedConnections = 0;
let staleConnectionsTerminated = 0;
const activeConnectionsByIp = new Map();
const upgradeWindows = new Map();
const MAX_CONNECTIONS_PER_IP = 12;
const MAX_CONNECTIONS_PER_MEMBER = 6;
const MAX_UPGRADES_PER_MINUTE = 30;

// Phiên Better Auth từ cookie; app native không gửi được cookie nên đưa token
// phiên qua ?token= và ta coi nó như Bearer.
async function getMemberEmail(request, requestUrl) {
  const token = requestUrl.searchParams.get('token');
  const headers = token ? { ...request.headers, authorization: `Bearer ${token}` } : request.headers;
  return (await memberEmailFromRequest({ headers })) || '';
}

function rejectUpgrade(socket, status, message) {
  socket.write(`HTTP/1.1 ${status}\r\nConnection: close\r\nCache-Control: no-store\r\n\r\n${message}`);
  socket.destroy();
}

function upgradeAllowed(ip) {
  const now = Date.now();
  const current = upgradeWindows.get(ip);
  const window = !current || current.until <= now ? { count: 0, until: now + 60000 } : current;
  window.count += 1;
  if (upgradeWindows.size >= 10000) upgradeWindows.clear();
  upgradeWindows.set(ip, window);
  return window.count <= MAX_UPGRADES_PER_MINUTE;
}

function trackConnection(ws, ip) {
  activeConnectionsByIp.set(ip, (activeConnectionsByIp.get(ip) || 0) + 1);
  ws.once('close', () => {
    const remaining = (activeConnectionsByIp.get(ip) || 1) - 1;
    if (remaining > 0) activeConnectionsByIp.set(ip, remaining);
    else activeConnectionsByIp.delete(ip);
  });
}

export function getWebSocketStats() {
  return {
    activeConnections: realtimeWss?.clients.size || 0,
    acceptedConnections,
    closedConnections,
    staleConnectionsTerminated,
  };
}

export function setupWebSocketServers(server) {
  // WebSocket server cho real-time data / notifications (path: /ws)
  const wss = new WebSocketServer({ noServer: true, maxPayload: 1024 * 1024 });
  realtimeWss = wss;
  const heartbeat = setInterval(() => {
    for (const ws of wss.clients) {
      if (ws.readyState !== 1) continue;
      if (ws.isAlive === false) {
        staleConnectionsTerminated += 1;
        ws.terminate();
        continue;
      }
      ws.isAlive = false;
      ws.ping();
    }
  }, 30000);
  heartbeat.unref();

  // Chess WebSocket server (path: /ws/chess)
  const chessWss = initChessWS({ noServer: true, maxPayload: 64 * 1024 });

  // global.wsClients maps email -> Set of connected WebSocket clients
  global.wsClients = {};

  // Manual WebSocket upgrade dispatcher
  server.on('upgrade', async (request, socket, head) => {
    const requestUrl = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
    const { pathname } = requestUrl;
    const clientIp = getClientIp(request, request.socket.remoteAddress || '');
    const origin = String(request.headers.origin || '');

    if ((!origin || (!allowedOrigins.includes(origin) && !(isDev && localOriginRegex.test(origin))))) {
      return rejectUpgrade(socket, '403 Forbidden', 'Origin not allowed');
    }
    if (!originAllowed(request)) {
      return rejectUpgrade(socket, '403 Forbidden', 'Origin locked');
    }

    // Hạn mức theo tài khoản khi biết là ai: IP ở đây là IP proxy dùng chung,
    // đếm theo IP thì một nút Cloudflare chứa hàng trăm người thật sẽ chạm trần.
    let email = '';
    let subject = '';
    try {
      email = await getMemberEmail(request, requestUrl);
      request.memberEmail = email;
      subject = email ? `m:${email}` : clientIp;
      const cap = email ? MAX_CONNECTIONS_PER_MEMBER : MAX_CONNECTIONS_PER_IP;
      if (!upgradeAllowed(subject) || (activeConnectionsByIp.get(subject) || 0) >= cap) {
        return rejectUpgrade(socket, '429 Too Many Requests', 'WebSocket limit exceeded');
      }
      const block = await findActiveSecurityBlock({ ip: clientIp, email });
      if (block) {
        return rejectUpgrade(socket, '403 Forbidden', '{"error":"ACCESS_BLOCKED"}');
      }
    } catch (error) {
      console.error('[WebSocket security gate]', error.message);
      return rejectUpgrade(socket, '503 Service Unavailable', 'Security check unavailable');
    }

    if (pathname === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        trackConnection(ws, subject);
        wss.emit('connection', ws, request);
      });
    } else if (pathname === '/ws/chess') {
      chessWss.handleUpgrade(request, socket, head, (ws) => {
        trackConnection(ws, subject);
        chessWss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  // Client connection handler
  wss.on('connection', (ws, req) => {
    const email = req.memberEmail;
    if (!email) {
      ws.close(4001, 'Authentication required');
      return;
    }

    if (!global.wsClients[email]) {
      global.wsClients[email] = new Set();
    }
    global.wsClients[email].add(ws);
    acceptedConnections += 1;

    ws.isAlive = true;
    let messageCount = 0;
    let messageWindowStartedAt = Date.now();
    ws.on('pong', () => { ws.isAlive = true; });

    ws.on('message', (data) => {
      const now = Date.now();
      if (now - messageWindowStartedAt >= 60000) {
        messageWindowStartedAt = now;
        messageCount = 0;
      }
      messageCount += 1;
      if (messageCount > 120) return ws.close(1008, 'Message rate exceeded');

      try {
        const msg = JSON.parse(data.toString());
        let relay = null;
        if (msg.type === 'vitals' && msg.data) {
          relay = msg;
        }
        if (relay) {
          const payload = JSON.stringify(relay);
          for (const client of global.wsClients[email]) {
            if (client !== ws && client.readyState === 1 /* OPEN */) client.send(payload);
          }
        }
      } catch {
        // Ignore malformed messages
      }
    });

    ws.on('close', () => {
      closedConnections += 1;
      if (global.wsClients[email]) {
        global.wsClients[email].delete(ws);
        if (global.wsClients[email].size === 0) {
          delete global.wsClients[email];
        }
      }
    });

    ws.on('error', (err) => {
      console.error('[WebSocket] Error:', err.message);
    });
  });

  return { wss, chessWss };
}
