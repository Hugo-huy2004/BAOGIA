// No database needed. Default: RAM; --redis: isolated local Redis + two instances.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

if (process.argv.includes('--redis')) {
  const dir = await mkdtemp(join(tmpdir(), 'hugo-cache-'));
  const socket = join(dir, 'redis.sock');
  const server = spawn('redis-server', ['--port', '0', '--unixsocket', socket, '--save', '', '--appendonly', 'no'], { stdio: ['ignore', 'pipe', 'pipe'] });
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Redis startup timeout')), 5000);
      server.once('error', reject);
      server.once('exit', code => { clearTimeout(timer); reject(new Error(`Redis exited ${code}`)); });
      server.stdout.on('data', chunk => {
        if (String(chunk).toLowerCase().includes('ready to accept connections')) { clearTimeout(timer); resolve(); }
      });
    });
    const child = spawn(process.execPath, [process.argv[1], '--worker'], {
      stdio: 'inherit', env: { ...process.env, REDIS_URL: socket },
    });
    const code = await new Promise((resolve, reject) => { child.once('exit', resolve); child.once('error', reject); });
    assert.equal(code, 0, 'Redis checks');
  } finally {
    server.kill('SIGTERM');
    if (server.exitCode === null) await new Promise(resolve => server.once('exit', resolve));
    await rm(dir, { recursive: true, force: true });
  }
} else {
  // Never connect to a real deployment's REDIS_URL from a check.
  const useRedis = process.argv.includes('--worker');
  if (!useRedis) process.env.REDIS_URL = '';
  const { default: redis } = await import('../utils/redisClient.js');
  const a = await import('../utils/cacheHelper.js?instance=a');
  const b = await import('../utils/cacheHelper.js?instance=b');
  if (redis) {
    if (redis.status !== 'ready') await new Promise(resolve => redis.once('ready', resolve));
    await delay(50); // Duplicate cache connections finish their local handshake.
  }
  const deferred = () => {
    let resolve;
    const promise = new Promise(r => { resolve = r; });
    return { promise, resolve };
  };
  try {
    let calls = 0;
    const source = async () => { calls++; await delay(10); return { value: calls }; };
    const burst = await Promise.all(Array.from({ length: 20 }, () => a.fetchWithCache('burst', 1000, source)));
    assert.equal(calls, 1, 'cold requests coalesce');
    assert.ok(burst.every(item => item.value === 1));
    assert.equal((await a.fetchWithCache('burst', 1000, source)).value, 1);
    if (useRedis) assert.equal((await b.fetchWithCache('burst', 1000, source)).value, 1, 'second instance shares Redis');
    await (useRedis ? b : a).clearCache('burst');
    assert.equal((await a.fetchWithCache('burst', 1000, source)).value, 2, 'invalidation reaches readers');

    const old = deferred();
    const started = deferred();
    const before = a.fetchWithCache('race', 1000, () => { started.resolve(); return old.promise; });
    await started.promise;
    await (useRedis ? b : a).clearCache('race');
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

    if (useRedis) {
      await redis.set('hugo:response:v1:corrupt', '{invalid', 'PX', 1000);
      assert.equal(await a.fetchWithCache('corrupt', 100, () => 'safe'), 'safe', 'corrupt Redis is a miss');
      await redis.call('SHUTDOWN', 'NOSAVE').catch(() => {});
      await delay(30);
      assert.equal(await a.fetchWithCache('offline', 100, () => 'fallback'), 'fallback', 'Redis outage falls back');
    }
    console.log(`OK — ${useRedis ? 'Redis sharing + outage' : 'RAM'}: coalescing, invalidation race, SWR, hard expiry, recovery.`);
    process.exit(0); // Close check-only Redis sockets/retry timers.
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
