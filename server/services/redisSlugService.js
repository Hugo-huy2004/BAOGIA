import redis from '../utils/redisClient.js';
import Redis from 'ioredis';
import Bio from '../models/Bio.js';

let subClient = null;
const REDIS_KEY_SLUGS = 'hugo:valid_slugs';
const REDIS_KEY_DOMAINS = 'hugo:valid_domains';
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
      // 1. Initialize Local Memory Sets for Slugs & Custom Domains
      const bios = await Bio.find({}, 'slug customDomain').lean();
      global.validSlugs = new Set(bios.map(b => b.slug).filter(Boolean));
      global.validCustomDomains = new Set(bios.map(b => b.customDomain).filter(Boolean));
      console.log(`🛡️ Valid-slug O(1) set initialized with ${global.validSlugs.size} slugs, ${global.validCustomDomains.size} custom domains`);

      // 2. Sync to Redis if online
      if (redis) {
        const pipeline = redis.pipeline();
        pipeline.del(REDIS_KEY_SLUGS);
        pipeline.del(REDIS_KEY_DOMAINS);
        for (const slug of global.validSlugs) {
          pipeline.sadd(REDIS_KEY_SLUGS, slug);
        }
        for (const domain of global.validCustomDomains) {
          pipeline.sadd(REDIS_KEY_DOMAINS, domain);
        }
        await pipeline.exec();
        console.log(`⚡ Redis: Synced ${global.validSlugs.size} slugs & ${global.validCustomDomains.size} domains`);
      }

      // 3. Subscribe to PubSub updates across multi-instance nodes
      if (subClient) {
        subClient.subscribe(PUB_CHANNEL, (err) => {
          if (err) console.error('[Redis PubSub] Failed to subscribe to channel:', err.message);
        });

        subClient.on('message', (channel, message) => {
          if (channel === PUB_CHANNEL) {
            try {
              const { type, slug, domain } = JSON.parse(message);
              if (slug) {
                if (type === 'ADD' && global.validSlugs) global.validSlugs.add(slug);
                if (type === 'DELETE' && global.validSlugs) global.validSlugs.delete(slug);
              }
              if (domain) {
                if (type === 'ADD_DOMAIN' && global.validCustomDomains) global.validCustomDomains.add(domain);
                if (type === 'DELETE_DOMAIN' && global.validCustomDomains) global.validCustomDomains.delete(domain);
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
      if (!global.validCustomDomains) global.validCustomDomains = new Set();
    }
  },

  async addSlug(slug) {
    if (!slug) return;
    if (!global.validSlugs) global.validSlugs = new Set();
    global.validSlugs.add(slug);

    if (redis) {
      try {
        await redis.sadd(REDIS_KEY_SLUGS, slug);
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
        await redis.srem(REDIS_KEY_SLUGS, slug);
        await redis.publish(PUB_CHANNEL, JSON.stringify({ type: 'DELETE', slug }));
      } catch (err) {
        console.error('[redisSlugService] Redis delete error:', err.message);
      }
    }
  },

  hasSlug(slug) {
    if (!global.validSlugs) return true; // Fail safe
    return global.validSlugs.has(slug);
  },

  async addCustomDomain(domain) {
    if (!domain) return;
    const clean = domain.trim().toLowerCase();
    if (!global.validCustomDomains) global.validCustomDomains = new Set();
    global.validCustomDomains.add(clean);

    if (redis) {
      try {
        await redis.sadd(REDIS_KEY_DOMAINS, clean);
        await redis.publish(PUB_CHANNEL, JSON.stringify({ type: 'ADD_DOMAIN', domain: clean }));
      } catch (err) {
        console.error('[redisSlugService] Redis add domain error:', err.message);
      }
    }
  },

  async deleteCustomDomain(domain) {
    if (!domain) return;
    const clean = domain.trim().toLowerCase();
    if (global.validCustomDomains) global.validCustomDomains.delete(clean);

    if (redis) {
      try {
        await redis.srem(REDIS_KEY_DOMAINS, clean);
        await redis.publish(PUB_CHANNEL, JSON.stringify({ type: 'DELETE_DOMAIN', domain: clean }));
      } catch (err) {
        console.error('[redisSlugService] Redis delete domain error:', err.message);
      }
    }
  },

  hasCustomDomain(domain) {
    if (!global.validCustomDomains) return true;
    return global.validCustomDomains.has(domain.trim().toLowerCase());
  }
};

export default redisSlugService;
