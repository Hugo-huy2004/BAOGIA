import redis from '../utils/redisClient.js';
import Redis from 'ioredis';
import Bio from '../models/Bio.js';

let subClient = null;
const REDIS_KEY = 'hugo:valid_slugs';
const PUB_CHANNEL = 'hugo:slug_updates';

if (process.env.REDIS_URL) {
  try {
    subClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 2,
      retryStrategy: (times) => Math.min(times * 200, 2000),
    });
    subClient.on('error', (err) => console.error('[Redis PubSub] connection error:', err.message));
  } catch (err) {
    console.warn('[Redis PubSub] Unable to initialize subscriber:', err.message);
  }
}

export const redisSlugService = {
  async init() {
    try {
      // 1. Initialize Local Memory Set
      const bios = await Bio.find({}, 'slug').lean();
      global.validSlugs = new Set(bios.map(b => b.slug).filter(Boolean));
      console.log(`🛡️ Valid-slug O(1) set initialized with ${global.validSlugs.size} slugs`);

      // 2. Sync to Redis if online
      if (redis) {
        const pipeline = redis.pipeline();
        pipeline.del(REDIS_KEY);
        for (const slug of global.validSlugs) {
          pipeline.sadd(REDIS_KEY, slug);
        }
        await pipeline.exec();
        console.log(`⚡ Redis: Synced ${global.validSlugs.size} valid slugs to Redis Set`);
      }

      // 3. Subscribe to PubSub updates across multi-instance nodes
      if (subClient) {
        subClient.subscribe(PUB_CHANNEL, (err) => {
          if (err) console.error('[Redis PubSub] Failed to subscribe to slug channel:', err.message);
        });

        subClient.on('message', (channel, message) => {
          if (channel === PUB_CHANNEL) {
            try {
              const { type, slug } = JSON.parse(message);
              if (!slug) return;
              if (type === 'ADD') {
                if (global.validSlugs) global.validSlugs.add(slug);
              } else if (type === 'DELETE') {
                if (global.validSlugs) global.validSlugs.delete(slug);
              }
            } catch (e) {
              console.error('[Redis PubSub] Invalid message payload:', e.message);
            }
          }
        });
      }
    } catch (error) {
      console.error('[redisSlugService] Initialization error:', error.message);
      if (!global.validSlugs) global.validSlugs = new Set();
    }
  },

  async addSlug(slug) {
    if (!slug) return;
    if (!global.validSlugs) global.validSlugs = new Set();
    global.validSlugs.add(slug);

    if (redis) {
      try {
        await redis.sadd(REDIS_KEY, slug);
        await redis.publish(PUB_CHANNEL, JSON.stringify({ type: 'ADD', slug }));
      } catch (err) {
        console.error('[redisSlugService] Redis add error:', err.message);
      }
    }
  },

  async deleteSlug(slug) {
    if (!slug) return;
    if (global.validSlugs) global.validSlugs.delete(slug);

    if (redis) {
      try {
        await redis.srem(REDIS_KEY, slug);
        await redis.publish(PUB_CHANNEL, JSON.stringify({ type: 'DELETE', slug }));
      } catch (err) {
        console.error('[redisSlugService] Redis delete error:', err.message);
      }
    }
  },

  hasSlug(slug) {
    if (!global.validSlugs) return true; // Fail safe
    return global.validSlugs.has(slug);
  }
};

export default redisSlugService;
