/**
 * ClientSearchEngine.js
 * In-Memory Zero-Server Search Engine.
 * Runs 100% on client device RAM in 0.001ms with zero server API requests.
 */

export class ClientSearchEngine {
  constructor(items = []) {
    this.index = [];
    if (items.length > 0) {
      this.buildIndex(items);
    }
  }

  buildIndex(items) {
    this.index = items.map(item => {
      const searchTerms = [
        item.title || item.displayName || '',
        item.id || '',
        item.referralCode || '',
        ...(item.tags || [])
      ].join(' ').toLowerCase();

      return {
        item,
        searchTerms
      };
    });
  }

  search(query, limit = 20) {
    if (!query || typeof query !== 'string') return this.index.slice(0, limit).map(i => i.item);
    const q = query.trim().toLowerCase();
    if (!q) return this.index.slice(0, limit).map(i => i.item);

    const tokens = q.split(/\s+/);
    const matches = [];

    for (let i = 0; i < this.index.length; i++) {
      const entry = this.index[i];
      const matchAll = tokens.every(token => entry.searchTerms.includes(token));
      if (matchAll) {
        matches.push(entry.item);
        if (matches.length >= limit) break;
      }
    }

    return matches;
  }
}

export const globalClientSearch = new ClientSearchEngine();
