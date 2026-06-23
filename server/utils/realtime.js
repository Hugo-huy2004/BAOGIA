// Shared helper for pushing a JSON payload to every open WebSocket connection
// a given member currently has (see global.wsClients in server.js). Used so
// portal state (JOY balance, verification approval, etc.) updates instantly
// on-screen without the member needing to reload.
export function broadcastToEmail(email, payload) {
  const clients = global.wsClients?.[email];
  if (!clients || clients.size === 0) return;
  const message = JSON.stringify(payload);
  for (const client of clients) {
    if (client.readyState === 1) client.send(message);
  }
}
