/**
 * QUẢN LÝ WEBSOCKET SERVER VÀ UPGRADE DISPATCHER
 * Tuân thủ Quy tắc 2 (Viblo): Tách logic nâng cấp WebSocket và xử lý kết nối khỏi server.js
 */
import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../utils/secrets.js';
import { initChessWS } from './chessWS.js';
import { findActiveSecurityBlock } from './securityEnforcement.js';

let realtimeWss = null;
let acceptedConnections = 0;
let closedConnections = 0;
let staleConnectionsTerminated = 0;

function getMemberToken(request, requestUrl) {
  const cookie = String(request.headers.cookie || '')
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('member_jwt='));

  if (cookie) {
    try {
      return decodeURIComponent(cookie.slice('member_jwt='.length));
    } catch {
      return '';
    }
  }

  // Keep older installed clients working while they update to cookie auth.
  return requestUrl.searchParams.get('token') || '';
}

function getMemberEmail(token) {
  if (!token) return '';
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.role === 'member' && decoded.email
      ? String(decoded.email).toLowerCase()
      : '';
  } catch {
    return '';
  }
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
  const chessWss = initChessWS({ noServer: true });

  // global.wsClients maps email -> Set of connected WebSocket clients
  global.wsClients = {};

  // Manual WebSocket upgrade dispatcher
  server.on('upgrade', async (request, socket, head) => {
    const requestUrl = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
    const { pathname } = requestUrl;

    try {
      const forwarded = String(request.headers['x-forwarded-for'] || '').split(',').map((item) => item.trim()).filter(Boolean);
      const clientIp = forwarded.at(-1) || request.socket.remoteAddress || '';
      let email = '';
      if (pathname === '/ws') {
        email = getMemberEmail(getMemberToken(request, requestUrl));
        request.memberEmail = email;
      }
      const block = await findActiveSecurityBlock({ ip: clientIp, email });
      if (block) {
        socket.write('HTTP/1.1 403 Forbidden\r\nConnection: close\r\nContent-Type: application/json\r\nCache-Control: no-store\r\n\r\n{"error":"ACCESS_BLOCKED"}');
        socket.destroy();
        return;
      }
    } catch (error) {
      console.error('[WebSocket security gate]', error.message);
    }

    if (pathname === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else if (pathname === '/ws/chess') {
      chessWss.handleUpgrade(request, socket, head, (ws) => {
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
    ws.on('pong', () => { ws.isAlive = true; });

    ws.on('message', (data) => {
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
