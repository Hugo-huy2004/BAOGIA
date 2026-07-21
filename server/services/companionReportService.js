import CompanionHistory from '../models/CompanionHistory.js';
import { embedText } from './embeddingService.js';

const AI_SERVER = process.env.AI_SERVER_URL || 'http://localhost:8000';

// Bounds CompanionHistory.longTermMemories doc size (each entry carries a
// 768-dim embedding array) while keeping enough history for semantic recall
// across many weeks. Oldest entries drop off first. Kept in sync with the
// route-level constant this replaces (companionRoutes.js used to inline this).
const MAX_LONG_TERM_MEMORIES = 16;

// Encryption helpers live in companionRoutes.js only; duplicated here (not
// imported) to avoid a routes->services dependency for two one-line functions.
import { decryptText } from '../utils/cryptoUtils.js';
function decryptChatMessages(messages) {
  if (!Array.isArray(messages)) return messages;
  return messages.map((m) => {
    const plain = m?.toObject ? m.toObject() : m;
    return (plain && typeof plain.text === 'string' && plain.text)
      ? { ...plain, text: decryptText(plain.text) }
      : plain;
  });
}

/**
 * Generates a weekly wellness report for one user via the Python AI server,
 * saves it to CompanionHistory.lastWeeklyReport, and — best-effort — embeds
 * the report's condensed memoryDigest into CompanionHistory.longTermMemories
 * so later chat sessions can semantically recall it (see
 * server/routes/aiProxyRoutes.js's enrichWithLongTermMemory).
 *
 * Shared by the on-demand route (POST /api/companion/report/weekly) and the
 * weekly cron job (server/utils/companionMemoryCron.js) so both paths stay
 * in sync — do not duplicate this logic at either call site.
 *
 * @param {string} email
 * @param {object} [bioOverride] - extra bio fields to merge in (route call
 *   sites have a live client-side bio; the cron job has none, so omit it).
 * @returns {Promise<{report: object}>}
 * @throws if the CompanionHistory doc is missing or the AI server call fails.
 */
export async function generateWeeklyReportForUser(email, bioOverride = {}) {
  const historyDoc = await CompanionHistory.findOne({ email });
  if (!historyDoc) {
    throw new Error('Companion history not found for this email');
  }

  const payload = {
    email,
    bio: {
      ...(bioOverride || {}),
      historyLogs: historyDoc.historyLogs || [],
      // Decrypt before sending to the AI report generator — messages are
      // stored encrypted at rest, so the raw docs are ciphertext.
      chatMessages: decryptChatMessages(historyDoc.chatMessages || [])
    }
  };

  const fetch = (await import('node-fetch')).default;
  const aiResponse = await fetch(`${AI_SERVER}/api/ai/report/weekly`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Key': process.env.INTERNAL_API_KEY || ''
    },
    body: JSON.stringify(payload)
  });
  if (!aiResponse.ok) {
    throw new Error(`AI server responded with ${aiResponse.status}`);
  }
  const report = await aiResponse.json();

  await CompanionHistory.findOneAndUpdate(
    { email },
    {
      $set: {
        lastWeeklyReport: {
          generatedAt: new Date(),
          summary: report.summary || '',
          moodTrend: report.moodTrend || 'unknown',
          wellnessScore: report.wellnessScore || null
        }
      }
    }
  );

  if (report.memoryDigest && typeof report.memoryDigest === 'string' && report.memoryDigest.trim()) {
    try {
      const embedding = await embedText(report.memoryDigest.trim());
      if (embedding?.length) {
        const doc = await CompanionHistory.findOne({ email }, { longTermMemories: 1 });
        const next = [...(doc?.longTermMemories || []), {
          summary: report.memoryDigest.trim(),
          embedding,
          createdAt: new Date()
        }].slice(-MAX_LONG_TERM_MEMORIES);
        await CompanionHistory.updateOne({ email }, { $set: { longTermMemories: next } });
      }
    } catch (memErr) {
      console.error(`Failed to store long-term memory digest for ${email}:`, memErr.message);
    }
  }

  return { report };
}
