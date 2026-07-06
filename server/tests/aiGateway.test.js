import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { generate, embed, cosine, getQuotaStatus, __resetQuota } from '../services/aiGateway.js';

// Deterministic quota limits + fast backoff for the test run.
process.env.GEMINI_API_KEY = 'test-key';
process.env.GEMINI_RPM_LIMIT = '10';
process.env.GEMINI_RPD_LIMIT = '20';
process.env.GEMINI_BACKOFF_MS = '1';

function mockGenOk(text = 'hello', tokens = 5) {
  return {
    ok: true,
    json: async () => ({
      candidates: [{ content: { parts: [{ text }] } }],
      usageMetadata: { totalTokenCount: tokens },
    }),
  };
}
function mockEmbedOk(vec = [0.1, 0.2, 0.3]) {
  return { ok: true, json: async () => ({ embedding: { values: vec } }) };
}
function mockErr(status) {
  return { ok: false, status, text: async () => 'err' };
}

describe('aiGateway', () => {
  beforeEach(() => { __resetQuota(); vi.restoreAllMocks(); });
  afterEach(() => { vi.restoreAllMocks(); });

  it('cosine: identical=1, orthogonal=0', () => {
    expect(cosine([1, 2, 3], [1, 2, 3])).toBeCloseTo(1, 5);
    expect(cosine([1, 0], [0, 1])).toBeCloseTo(0, 5);
    expect(cosine([1, 2], [1, 2, 3])).toBe(0); // mismatched length
  });

  it('generate returns text and counts one request + tokens', async () => {
    global.fetch = vi.fn().mockResolvedValue(mockGenOk('xin chào', 7));
    const out = await generate('hi');
    expect(out).toBe('xin chào');
    const q = getQuotaStatus();
    expect(q.rpd).toBe(1);
    expect(q.tokensToday).toBe(7);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('caches identical prompts by cacheKey (no second network call)', async () => {
    global.fetch = vi.fn().mockResolvedValue(mockGenOk('cached'));
    const a = await generate('same', { cacheKey: 'k1', cacheTtlMs: 60000 });
    const b = await generate('same', { cacheKey: 'k1', cacheTtlMs: 60000 });
    expect(a).toBe('cached');
    expect(b).toBe('cached');
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(getQuotaStatus().rpd).toBe(1); // cached hit didn't spend quota
  });

  it('retries on 429 then succeeds', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce(mockErr(429))
      .mockResolvedValueOnce(mockGenOk('after retry'));
    const out = await generate('retry me');
    expect(out).toBe('after retry');
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('does not retry on 400 (non-retryable) and returns null', async () => {
    global.fetch = vi.fn().mockResolvedValue(mockErr(400));
    const out = await generate('bad');
    expect(out).toBeNull();
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('downgrades to the lite model once quota crosses ~60%', async () => {
    global.fetch = vi.fn().mockResolvedValue(mockGenOk('x'));
    // RPD limit is 20 → push past 60% (12) so the next call downgrades.
    for (let i = 0; i < 13; i++) await generate('warm ' + i);
    await generate('now downgraded');
    const lastUrl = global.fetch.mock.calls.at(-1)[0];
    expect(lastUrl).toContain('flash-lite');
  });

  it('drops low-priority calls when saturated, but lets interactive calls through', async () => {
    global.fetch = vi.fn().mockResolvedValue(mockGenOk('x'));
    for (let i = 0; i < 20; i++) await generate('fill ' + i); // hit RPD limit (20)
    expect(getQuotaStatus().saturated).toBe(true);

    // Low-priority (bot) call is dropped — no network hit.
    let calls = global.fetch.mock.calls.length;
    const low = await generate('bot post', { lowPriority: true });
    expect(low).toBeNull();
    expect(global.fetch.mock.calls.length).toBe(calls);

    // Interactive call (default) still attempts even when saturated.
    calls = global.fetch.mock.calls.length;
    const high = await generate('user is chatting with HugoPSY');
    expect(high).toBe('x');
    expect(global.fetch.mock.calls.length).toBe(calls + 1);
  });

  it('embed returns a vector and caches it', async () => {
    global.fetch = vi.fn().mockResolvedValue(mockEmbedOk([1, 2, 3]));
    const v1 = await embed('some text');
    const v2 = await embed('some text');
    expect(v1).toEqual([1, 2, 3]);
    expect(v2).toEqual([1, 2, 3]);
    expect(global.fetch).toHaveBeenCalledTimes(1); // 2nd served from cache
  });

  it('returns null with no API key', async () => {
    const saved = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    global.fetch = vi.fn();
    expect(await generate('x')).toBeNull();
    expect(await embed('x')).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
    process.env.GEMINI_API_KEY = saved;
  });
});
