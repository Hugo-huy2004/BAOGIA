import { createHash } from 'node:crypto';
import { logError } from '../utils/alert.js';
import { sendTelegramAlert } from './telegramService.js';
import { createAndRunAIWorkforceTask } from './aiWorkforceService.js';

const INCIDENT_COOLDOWN_MS = 5 * 60 * 1000;
const MAX_NEW_INCIDENTS_PER_HOUR = 20;
const recentIncidents = new Map();
const hourlyIncidents = [];

function clean(value, limit = 500) {
  return String(value || '').replace(/[\r\n\t]+/g, ' ').slice(0, limit);
}

function cleanPath(value) {
  return clean(value, 220)
    .split('?')[0]
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/ig, '[email]');
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function normalizeForFingerprint(value) {
  return clean(value, 500)
    .toLowerCase()
    .replace(/\b[0-9a-f]{8,}\b/gi, ':id')
    .replace(/\b\d+\b/g, ':n');
}

function sanitizeEvent(event = {}) {
  return {
    type: clean(event.type || 'runtime-error', 60),
    name: clean(event.name || 'Error', 100),
    message: clean(event.message || 'Unknown error', 500),
    stack: clean(event.stack, 2000),
    method: clean(event.method, 12),
    path: cleanPath(event.path || event.page),
    status: Number.isFinite(Number(event.status)) ? Number(event.status) : undefined,
    source: clean(event.source || 'runtime', 60),
    sentryIssueId: clean(event.sentryIssueId, 120),
    sentryUrl: /^https:\/\//i.test(String(event.sentryUrl || ''))
      ? clean(event.sentryUrl, 500)
      : '',
  };
}

function fingerprint(specialist, event) {
  return createHash('sha256')
    .update([
      specialist,
      normalizeForFingerprint(event.type),
      normalizeForFingerprint(event.message),
      normalizeForFingerprint(event.path),
      normalizeForFingerprint(event.stack.split(' ').slice(0, 16).join(' ')),
    ].join('|'))
    .digest('hex')
    .slice(0, 12);
}

function canOpenIncident(key) {
  const now = Date.now();
  const previous = recentIncidents.get(key);
  if (previous && now - previous < INCIDENT_COOLDOWN_MS) return false;

  while (hourlyIncidents.length && now - hourlyIncidents[0] >= 60 * 60 * 1000) {
    hourlyIncidents.shift();
  }
  if (hourlyIncidents.length >= MAX_NEW_INCIDENTS_PER_HOUR) return false;

  recentIncidents.set(key, now);
  hourlyIncidents.push(now);
  if (recentIncidents.size > 500) {
    for (const [storedKey, createdAt] of recentIncidents) {
      if (now - createdAt >= INCIDENT_COOLDOWN_MS) recentIncidents.delete(storedKey);
    }
  }
  return true;
}

export function specialistForClientEvent(event) {
  if (['runtime-error', 'unhandled-rejection', 'react-error-boundary'].includes(event.type)) {
    return 'ui_specialist';
  }
  if (event.type === 'api-error' && Number(event.status) >= 500) {
    return 'server_specialist';
  }
  return '';
}

export async function reportSpecialistIncident({ specialist, event } = {}) {
  if (!['server_specialist', 'ui_specialist'].includes(specialist)) return { skipped: 'unknown_specialist' };
  const safeEvent = sanitizeEvent(event);
  const incidentKey = fingerprint(specialist, safeEvent);
  if (!canOpenIncident(incidentKey)) return { skipped: 'throttled', fingerprint: incidentKey };

  const specialistName = specialist === 'server_specialist' ? 'Server Specialist' : 'UI Specialist';
  const route = [safeEvent.method, safeEvent.path].filter(Boolean).join(' ');
  const telegramMessage = [
    `🚨 <b>${specialistName} phát hiện sự cố</b>`,
    `<b>Loại:</b> <code>${escapeHtml(safeEvent.type)}</code>`,
    route ? `<b>Vị trí:</b> <code>${escapeHtml(route)}</code>` : '',
    safeEvent.status ? `<b>HTTP:</b> <code>${safeEvent.status}</code>` : '',
    `<b>Lỗi:</b> ${escapeHtml(safeEvent.message)}`,
    `<b>Mã sự cố:</b> <code>${incidentKey}</code>`,
    safeEvent.sentryUrl ? `<a href="${escapeHtml(safeEvent.sentryUrl)}">Mở trên Sentry</a>` : '',
    'Đã mở nhiệm vụ chẩn đoán tự động. Sửa mã chỉ được tạo qua PR có kiểm tra.',
  ].filter(Boolean).join('\n');

  await Promise.allSettled([
    sendTelegramAlert(telegramMessage),
    logError({
      level: 'error',
      source: specialist,
      message: safeEvent.message,
      stack: safeEvent.stack,
      path: safeEvent.path,
      meta: {
        fingerprint: incidentKey,
        type: safeEvent.type,
        status: safeEvent.status,
        sentryIssueId: safeEvent.sentryIssueId,
      },
    }),
  ]);

  const task = await createAndRunAIWorkforceTask({
    agentKey: specialist,
    objective: `Chẩn đoán sự cố ${incidentKey}, đề xuất cách sửa và khởi động autofix an toàn nếu đủ điều kiện.`,
    context: { incident: safeEvent, fingerprint: incidentKey },
    requestedBy: `system:${safeEvent.source}`,
  });
  return { fingerprint: incidentKey, taskId: String(task._id), status: task.status };
}
