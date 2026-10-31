// Thin wrapper — all embedding calls now go through the central AI Gateway
// (quota accounting, cache, retry/backoff). Kept for backward-compatible imports.
import { embed, cosine } from './aiGateway.js';

export const embedText = (text) => embed(text);
export { cosine };
