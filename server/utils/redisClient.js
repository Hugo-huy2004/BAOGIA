import Redis from 'ioredis';

let redis = null;

if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 2,
    retryStrategy: (times) => Math.min(times * 200, 2000),
  });
  redis.on('error', (err) => console.error('[Redis] connection error:', err.message));
  redis.on('connect', () => console.log('✅ Redis: Connected (online presence enabled)'));
} else {
  console.warn('⚠️  REDIS_URL not set — online/offline presence tracking disabled.');
}

export default redis;
