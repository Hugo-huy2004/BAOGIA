import { describe, it, expect } from 'vitest';
import { mergeDedupe } from '../services/discoveryService.js';

describe('mergeDedupe (Discovery: more suggestions, no duplicates)', () => {
  it('appends new places and drops same-name/near-same-spot dupes', () => {
    const google = [
      { name: 'Cà phê Sương', lat: 10.78651, lng: 106.66612 },
      { name: 'Bún bò Huế', lat: 10.78700, lng: 106.66700 }
    ];
    const osm = [
      { name: 'CÀ PHÊ SƯƠNG', lat: 10.786509, lng: 106.666119 }, // dupe (case + tiny coord drift)
      { name: 'Trà sữa Mây', lat: 10.78800, lng: 106.66800 }      // new
    ];
    const merged = mergeDedupe(google, osm);
    expect(merged).toHaveLength(3);
    expect(merged.map((p) => p.name)).toContain('Trà sữa Mây');
  });
});
