import { WebSocketServer } from 'ws';
import { Chess } from 'chess.js';
import { randomUUID } from 'crypto';
import ChessRating from '../models/ChessRating.js';
import ChessGame from '../models/ChessGame.js';

// In-memory state
const rooms = new Map();     // roomId -> RoomState
const queue = new Map();     // timeControl -> ClientState[]
const clientMap = new Map(); // ws -> ClientState

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function calcElo(rating, opponentRating, score) {
  const expected = 1 / (1 + Math.pow(10, (opponentRating - rating) / 400));
  const K = 32;
  return Math.round(rating + K * (score - expected));
}

function send(ws, payload) {
  if (ws && ws.readyState === 1 /* OPEN */) {
    ws.send(JSON.stringify(payload));
  }
}

function sendBoth(room, payload) {
  if (room.white) send(room.white.ws, payload);
  if (room.black) send(room.black.ws, payload);
}

function playerInfo(client) {
  if (!client) return null;
  return {
    email: client.email || null,
    displayName: client.displayName,
    rating: client.rating,
    guestId: client.guestId,
    avatarUrl: client.avatarUrl || '',
  };
}

// ─── ELO & DB persistence ───────────────────────────────────────────────────

async function saveGame(room) {
  try {
    const chess = new Chess();
    // Rebuild PGN from moves
    for (const san of room.moves) {
      chess.move(san);
    }
    const pgn = chess.pgn();
    const durationSeconds = Math.floor((Date.now() - room.startedAt) / 1000);

    await ChessGame.create({
      roomId: room.id,
      white: room.white ? {
        email: room.white.email || null,
        displayName: room.white.displayName,
        rating: room.white.rating,
        guestId: room.white.guestId,
        avatarUrl: room.white.avatarUrl || '',
      } : null,
      black: room.black ? {
        email: room.black.email || null,
        displayName: room.black.displayName,
        rating: room.black.rating,
        guestId: room.black.guestId,
        avatarUrl: room.black.avatarUrl || '',
      } : null,
      result: room.result || '*',
      reason: room.reason || null,
      moves: room.moves,
      pgn,
      timeControl: room.timeControl,
      playedAt: new Date(),
      durationSeconds,
    });

    // Update ELO only for authenticated (email) players
    const wEmail = room.white?.email;
    const bEmail = room.black?.email;
    if (!wEmail || !bEmail) return;

    let whiteScore, blackScore;
    if (room.result === '1-0') { whiteScore = 1; blackScore = 0; }
    else if (room.result === '0-1') { whiteScore = 0; blackScore = 1; }
    else { whiteScore = 0.5; blackScore = 0.5; }

    const wRating = room.white.rating;
    const bRating = room.black.rating;
    const newWhiteRating = calcElo(wRating, bRating, whiteScore);
    const newBlackRating = calcElo(bRating, wRating, blackScore);

    const now = new Date();

    await ChessRating.findOneAndUpdate(
      { email: wEmail },
      {
        $set: { rating: newWhiteRating, lastPlayedAt: now, updatedAt: now },
        $inc: {
          gamesPlayed: 1,
          wins: whiteScore === 1 ? 1 : 0,
          losses: whiteScore === 0 ? 1 : 0,
          draws: whiteScore === 0.5 ? 1 : 0,
        },
      },
      { upsert: true }
    );

    await ChessRating.findOneAndUpdate(
      { email: bEmail },
      {
        $set: { rating: newBlackRating, lastPlayedAt: now, updatedAt: now },
        $inc: {
          gamesPlayed: 1,
          wins: blackScore === 1 ? 1 : 0,
          losses: blackScore === 0 ? 1 : 0,
          draws: blackScore === 0.5 ? 1 : 0,
        },
      },
      { upsert: true }
    );

    return { newWhiteRating, newBlackRating };
  } catch (err) {
    console.error('[ChessWS] saveGame error:', err.message);
  }
}

// ─── Clock management ────────────────────────────────────────────────────────

function startClock(room) {
  if (room.intervalId) clearInterval(room.intervalId);
  room.lastMoveAt = Date.now();

  room.intervalId = setInterval(() => {
    if (room.status !== 'active') {
      clearInterval(room.intervalId);
      room.intervalId = null;
      return;
    }

    const now = Date.now();
    const elapsed = now - room.lastMoveAt;

    if (room.turn === 'w') {
      room.whiteTime = Math.max(0, room.whiteTime - elapsed);
    } else {
      room.blackTime = Math.max(0, room.blackTime - elapsed);
    }
    room.lastMoveAt = now;

    // Timeout check
    if (room.whiteTime <= 0 || room.blackTime <= 0) {
      clearInterval(room.intervalId);
      room.intervalId = null;
      const loser = room.whiteTime <= 0 ? 'white' : 'black';
      endGame(room, loser === 'white' ? '0-1' : '1-0', 'timeout');
    }
  }, 500);
}

function stopClock(room) {
  if (room.intervalId) {
    clearInterval(room.intervalId);
    room.intervalId = null;
  }
}

// Deduct elapsed time from the player who just moved (called before flipping turn)
function deductElapsed(room) {
  const elapsed = Date.now() - (room.lastMoveAt || Date.now());
  if (room.turn === 'w') {
    room.whiteTime = Math.max(0, room.whiteTime - elapsed);
  } else {
    room.blackTime = Math.max(0, room.blackTime - elapsed);
  }
  room.lastMoveAt = Date.now();
}

// ─── Game lifecycle ──────────────────────────────────────────────────────────

function startGame(room) {
  room.status = 'active';
  room.startedAt = Date.now();
  startClock(room);

  const base = {
    type: 'game_start',
    fen: room.fen,
    timeControl: room.timeControl,
    white: playerInfo(room.white),
    black: playerInfo(room.black),
    boardTheme: room.boardTheme || 'blue',
    whitePieceTheme: room.whitePieceTheme || 'maestro',
    blackPieceTheme: room.blackPieceTheme || 'maestro',
  };
  if (room.white) send(room.white.ws, { ...base, color: 'white' });
  if (room.black) send(room.black.ws, { ...base, color: 'black' });
}

async function endGame(room, result, reason) {
  if (room.status === 'finished') return;
  room.status = 'finished';
  room.result = result;
  room.reason = reason;
  stopClock(room);

  const ratingChanges = await saveGame(room);

  const basePayload = { type: 'game_over', result, reason };

  if (ratingChanges && room.white?.email && room.black?.email) {
    const { newWhiteRating, newBlackRating } = ratingChanges;
    if (room.white) {
      send(room.white.ws, {
        ...basePayload,
        ratingChange: newWhiteRating - room.white.rating,
        newRating: newWhiteRating,
      });
    }
    if (room.black) {
      send(room.black.ws, {
        ...basePayload,
        ratingChange: newBlackRating - room.black.rating,
        newRating: newBlackRating,
      });
    }
  } else {
    sendBoth(room, basePayload);
  }

  // Cleanup client state
  if (room.white) { room.white.roomId = null; room.white.color = null; }
  if (room.black) { room.black.roomId = null; room.black.color = null; }

  // Remove room after short delay to allow reconnect messages
  setTimeout(() => rooms.delete(room.id), 30000);
}

// ─── Matchmaking ─────────────────────────────────────────────────────────────

function dequeueMatch(client, timeControl) {
  if (!queue.has(timeControl)) queue.set(timeControl, []);
  const q = queue.get(timeControl);

  // Remove stale entries (disconnected clients)
  const alive = q.filter(c => c.ws.readyState === 1 /* OPEN */);
  queue.set(timeControl, alive);

  if (alive.length === 0) {
    alive.push(client);
    send(client.ws, { type: 'queue_position', position: 1, timeControl });
    return null;
  }

  // Match with first in queue
  const opponent = alive.shift();
  queue.set(timeControl, alive);

  // Assign colors randomly
  const [white, black] = Math.random() < 0.5 ? [client, opponent] : [opponent, client];
  return createRoom({ white, black, timeControl });
}

function createRoom({ white, black, timeControl, friendRoomId = null }) {
  const id = friendRoomId || generateRoomId();
  const tcMs = timeControl * 1000;

  const room = {
    id,
    white,
    black,
    fen: new Chess().fen(),
    moves: [],
    pgn: '',
    timeControl,
    whiteTime: tcMs,
    blackTime: tcMs,
    lastMoveAt: null,
    startedAt: null,
    turn: 'w',
    status: white && black ? 'active' : 'waiting',
    result: null,
    reason: null,
    intervalId: null,
    drawOfferedBy: null,
    chess: new Chess(),
  };

  rooms.set(id, room);

  if (white) { white.roomId = id; white.color = 'white'; }
  if (black) { black.roomId = id; black.color = 'black'; }

  return room;
}

// ─── Message handlers ────────────────────────────────────────────────────────

function handleAuth(ws, msg) {
  const client = clientMap.get(ws);
  if (!client) return;
  client.email = msg.email || null;
  client.displayName = msg.displayName || 'Guest';
  client.rating = Number(msg.rating) || 1500;
  client.guestId = msg.guestId || client.guestId;
  client.avatarUrl = msg.avatarUrl || '';
}

function handleCreateRoom(ws, msg) {
  const client = clientMap.get(ws);
  if (!client) return;

  const timeControl = Number(msg.timeControl) || 600;
  client.timeControl = timeControl;

  if (msg.mode === 'random') {
    const room = dequeueMatch(client, timeControl);
    if (room) {
      // startGame sends game_start with color to each matched player
      startGame(room);
    }
    // else: client is in queue, already sent queue_position
  } else {
    // friend room
    let color = msg.color || 'white';
    if (color === 'random') color = Math.random() < 0.5 ? 'white' : 'black';

    const room = createRoom({
      white: color === 'white' ? client : null,
      black: color === 'black' ? client : null,
      timeControl,
    });

    room.boardTheme = msg.boardTheme || 'blue';
    if (color === 'white') {
      room.whitePieceTheme = msg.myPieceTheme || 'maestro';
      room.blackPieceTheme = msg.oppPieceTheme || 'maestro';
    } else {
      room.blackPieceTheme = msg.myPieceTheme || 'maestro';
      room.whitePieceTheme = msg.oppPieceTheme || 'maestro';
    }

    client.roomId = room.id;
    client.color = color;

    send(ws, { type: 'room_created', roomId: room.id, color });
  }
}

function handleJoinRoom(ws, msg) {
  const client = clientMap.get(ws);
  if (!client) return;

  const room = rooms.get(msg.roomId);
  if (!room) {
    return send(ws, { type: 'error', message: 'Room not found' });
  }
  if (room.status !== 'waiting') {
    return send(ws, { type: 'error', message: 'Room is not open for joining' });
  }

  // Assign the empty color slot
  const color = !room.white ? 'white' : 'black';
  if (color === 'white') room.white = client;
  else room.black = client;

  client.roomId = room.id;
  client.color = color;

  const joinPayload = {
    type: 'joined',
    roomId: room.id,
    color,
    fen: room.fen,
    timeControl: room.timeControl,
    white: playerInfo(room.white),
    black: playerInfo(room.black),
    boardTheme: room.boardTheme || 'blue',
    whitePieceTheme: room.whitePieceTheme || 'maestro',
    blackPieceTheme: room.blackPieceTheme || 'maestro',
  };
  send(ws, joinPayload);

  if (room.white && room.black) {
    startGame(room);
  }
}

function handleMove(ws, msg) {
  const client = clientMap.get(ws);
  if (!client || !client.roomId) return;

  const room = rooms.get(client.roomId);
  if (!room || room.status !== 'active') {
    return send(ws, { type: 'error', message: 'No active game' });
  }

  // Verify it is this client's turn
  const expectedColor = room.turn === 'w' ? 'white' : 'black';
  if (client.color !== expectedColor) {
    return send(ws, { type: 'error', message: 'Not your turn' });
  }

  // Validate & execute move
  let moveResult;
  try {
    moveResult = room.chess.move({ from: msg.from, to: msg.to, promotion: msg.promotion || 'q' });
  } catch (_) {
    return send(ws, { type: 'error', message: 'Illegal move' });
  }

  if (!moveResult) {
    return send(ws, { type: 'error', message: 'Illegal move' });
  }

  // Deduct elapsed time from the player who just moved, then flip turn
  deductElapsed(room);
  room.fen = room.chess.fen();
  room.moves.push(moveResult.san);
  room.turn = room.chess.turn();

  const movePayload = {
    type: 'move',
    from: msg.from,
    to: msg.to,
    san: moveResult.san,
    fen: room.fen,
    turn: room.turn,
    whiteTime: room.whiteTime,
    blackTime: room.blackTime,
    isCheck: room.chess.inCheck(),
    isCheckmate: room.chess.isCheckmate(),
  };
  sendBoth(room, movePayload);

  // Reset draw offer on move
  room.drawOfferedBy = null;

  // Check game-ending conditions
  if (room.chess.isCheckmate()) {
    const winner = room.turn === 'w' ? '0-1' : '1-0'; // the side that just moved won
    endGame(room, winner, 'checkmate');
  } else if (room.chess.isStalemate() || room.chess.isDraw()) {
    endGame(room, '1/2-1/2', room.chess.isStalemate() ? 'stalemate' : 'draw');
  }
}

function handleResign(ws) {
  const client = clientMap.get(ws);
  if (!client || !client.roomId) return;
  const room = rooms.get(client.roomId);
  if (!room || room.status !== 'active') return;

  const result = client.color === 'white' ? '0-1' : '1-0';
  endGame(room, result, 'resign');
}

function handleDrawOffer(ws) {
  const client = clientMap.get(ws);
  if (!client || !client.roomId) return;
  const room = rooms.get(client.roomId);
  if (!room || room.status !== 'active') return;

  room.drawOfferedBy = client.color;
  const opponent = client.color === 'white' ? room.black : room.white;
  send(opponent?.ws, { type: 'draw_offer' });
}

function handleDrawAccept(ws) {
  const client = clientMap.get(ws);
  if (!client || !client.roomId) return;
  const room = rooms.get(client.roomId);
  if (!room || room.status !== 'active') return;

  // Only the non-offering player can accept
  const offerColor = room.drawOfferedBy;
  if (!offerColor || offerColor === client.color) {
    return send(ws, { type: 'error', message: 'No draw offer to accept' });
  }

  endGame(room, '1/2-1/2', 'draw');
}

function handleDrawDecline(ws) {
  const client = clientMap.get(ws);
  if (!client || !client.roomId) return;
  const room = rooms.get(client.roomId);
  if (!room || room.status !== 'active') return;

  room.drawOfferedBy = null;
  const opponent = client.color === 'white' ? room.black : room.white;
  send(opponent?.ws, { type: 'draw_declined' });
}

function handleAbort(ws) {
  const client = clientMap.get(ws);
  if (!client || !client.roomId) return;
  const room = rooms.get(client.roomId);
  if (!room) return;

  // Abort only allowed before first move
  if (room.moves.length > 0) {
    return send(ws, { type: 'error', message: 'Cannot abort after moves have been made' });
  }

  room.status = 'finished';
  room.result = '*';
  room.reason = 'abort';
  stopClock(room);
  sendBoth(room, { type: 'game_over', result: '*', reason: 'abort' });

  if (room.white) { room.white.roomId = null; room.white.color = null; }
  if (room.black) { room.black.roomId = null; room.black.color = null; }
  setTimeout(() => rooms.delete(room.id), 5000);
}

function handleRematch(ws, msg) {
  const client = clientMap.get(ws);
  if (!client) return;
  const roomId = msg.roomId || client.roomId;
  if (!roomId) return;

  const room = rooms.get(roomId);
  if (!room) {
    return send(ws, { type: 'error', message: 'Không tìm thấy phòng chơi' });
  }

  let color = null;
  if (room.white && room.white.ws === ws) color = 'white';
  else if (room.black && room.black.ws === ws) color = 'black';
  if (!color) return;

  room.rematchRequests = room.rematchRequests || new Set();
  room.rematchRequests.add(color);

  // Notify the opponent
  const opponent = color === 'white' ? room.black : room.white;
  if (opponent && opponent.ws) {
    send(opponent.ws, { type: 'rematch_offer', offeredBy: color });
  }

  // If both players have requested rematch
  if (room.rematchRequests.has('white') && room.rematchRequests.has('black')) {
    // Swap colors
    const oldWhite = room.white;
    const oldBlack = room.black;

    room.white = oldBlack;
    room.black = oldWhite;

    room.white.color = 'white';
    room.white.roomId = room.id;
    room.black.color = 'black';
    room.black.roomId = room.id;

    // Reset chess instance and state
    room.chess = new Chess();
    room.fen = room.chess.fen();
    room.moves = [];
    room.turn = 'w';
    room.status = 'active';
    room.result = null;
    room.reason = null;
    room.drawOfferedBy = null;
    room.rematchRequests = new Set();

    const tcMs = room.timeControl * 1000;
    room.whiteTime = tcMs;
    room.blackTime = tcMs;

    // Restart game
    startGame(room);
  }
}

function handleDisconnect(ws) {
  const client = clientMap.get(ws);
  if (!client) return;

  // Remove from queue if waiting
  if (client.timeControl && queue.has(client.timeControl)) {
    const q = queue.get(client.timeControl).filter(c => c !== client);
    queue.set(client.timeControl, q);
  }

  if (client.roomId) {
    const room = rooms.get(client.roomId);
    if (room && room.status === 'active') {
      const opponent = client.color === 'white' ? room.black : room.white;
      send(opponent?.ws, { type: 'opponent_disconnected' });

      // Give a 30-second grace period; if not reconnected, end the game
      room._disconnectTimeout = setTimeout(() => {
        if (room.status === 'active') {
          const result = client.color === 'white' ? '0-1' : '1-0';
          endGame(room, result, 'resign');
        }
      }, 30000);
    } else if (room && room.status === 'waiting') {
      // Remove from waiting room
      if (room.white === client) room.white = null;
      if (room.black === client) room.black = null;
      if (!room.white && !room.black) rooms.delete(room.id);
    }
  }

  clientMap.delete(ws);
}

// ─── Public init ─────────────────────────────────────────────────────────────

export function initChessWS(options) {
  const wss = new WebSocketServer(options);

  wss.on('connection', (ws) => {
    const client = {
      ws,
      guestId: randomUUID(),
      email: null,
      displayName: 'Guest',
      rating: 1500,
      roomId: null,
      color: null,
      timeControl: null,
      avatarUrl: '',
    };
    clientMap.set(ws, client);

    ws.on('message', (data) => {
      let msg;
      try {
        msg = JSON.parse(data.toString());
      } catch (_) {
        return send(ws, { type: 'error', message: 'Invalid JSON' });
      }

      switch (msg.type) {
        case 'auth':         handleAuth(ws, msg);        break;
        case 'create_room':  handleCreateRoom(ws, msg);  break;
        case 'join_room':    handleJoinRoom(ws, msg);    break;
        case 'move':         handleMove(ws, msg);        break;
        case 'resign':       handleResign(ws);           break;
        case 'draw_offer':   handleDrawOffer(ws);        break;
        case 'draw_accept':  handleDrawAccept(ws);       break;
        case 'draw_decline': handleDrawDecline(ws);      break;
        case 'abort':        handleAbort(ws);            break;
        case 'rematch':      handleRematch(ws, msg);     break;
        case 'ping':         send(ws, { type: 'pong' }); break;
        default:             send(ws, { type: 'error', message: `Unknown message type: ${msg.type}` });
      }
    });

    ws.on('close', () => handleDisconnect(ws));

    ws.on('error', (err) => {
      console.error('[ChessWS] WebSocket error:', err.message);
      handleDisconnect(ws);
    });
  });

  console.log('♟️  Chess WebSocket server listening on /ws/chess');
  return wss;
}
