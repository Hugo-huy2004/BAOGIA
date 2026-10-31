// No database needed: RAM response cache (utils/cacheHelper.js).
import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';

const a = await import('../utils/cacheHelper.js');
const deferred = () => {
  let resolve;
  const promise = new Promise(r => { resolve = r; });
  return { promise, resolve };
};

let calls = 0;
const source = async () => { calls++; await delay(10); return { value: calls }; };
const burst = await Promise.all(Array.from({ length: 20 }, () => a.fetchWithCache('burst', 1000, source)));
assert.equal(calls, 1, 'cold requests coalesce');
assert.ok(burst.every(item => item.value === 1));
assert.equal((await a.fetchWithCache('burst', 1000, source)).value, 1);
await a.clearCache('burst');
assert.equal((await a.fetchWithCache('burst', 1000, source)).value, 2, 'invalidation reaches readers');

const old = deferred();
const started = deferred();
const before = a.fetchWithCache('race', 1000, () => { started.resolve(); return old.promise; });
await started.promise;
await a.clearCache('race');
old.resolve('old');
await before;
assert.equal(await a.fetchWithCache('race', 1000, () => 'new'), 'new', 'old fill cannot undo invalidation');

let version = 1;
await a.fetchWithCache('stale', 100, () => version);
await delay(120);
const refresh = deferred();
const stale = await a.fetchWithCache('stale', 100, () => refresh.promise);
assert.equal(stale, 1, 'stale responds before refresh completes');
refresh.resolve(++version);
await delay(20);
assert.equal(await a.fetchWithCache('stale', 100, () => 99), 2, 'background refresh stored');

await a.fetchWithCache('expires', 20, () => 'old');
await delay(80);
await assert.rejects(a.fetchWithCache('expires', 20, () => { throw new Error('source down'); }), /source down/, 'hard expiry cannot serve stale forever');
assert.equal(await a.fetchWithCache('expires', 20, () => 'recovered'), 'recovered', 'failed load releases single-flight');

console.log('OK — RAM: coalescing, invalidation race, SWR, hard expiry, recovery.');
