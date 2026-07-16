import { describe, it, expect } from 'vitest';
import { isOpenNow } from '../services/discoveryService.js';

// Wed 2026-07-15 10:30 local time
const wedMorning = new Date(2026, 6, 15, 10, 30);
// Wed 2026-07-15 23:30 local time
const wedNight = new Date(2026, 6, 15, 23, 30);

describe('isOpenNow (OSM opening_hours)', () => {
  it('handles 24/7', () => {
    expect(isOpenNow('24/7', wedMorning)).toBe(true);
  });

  it('handles simple daily range', () => {
    expect(isOpenNow('Mo-Su 07:00-22:00', wedMorning)).toBe(true);
    expect(isOpenNow('Mo-Su 07:00-22:00', wedNight)).toBe(false);
  });

  it('handles day-restricted rules', () => {
    expect(isOpenNow('Sa-Su 08:00-23:00', wedMorning)).toBe(false);
    expect(isOpenNow('Mo-Fr 08:00-18:00; Sa 08:00-12:00', wedMorning)).toBe(true);
  });

  it('handles overnight ranges', () => {
    expect(isOpenNow('Mo-Su 18:00-02:00', wedNight)).toBe(true);
    expect(isOpenNow('Mo-Su 18:00-02:00', wedMorning)).toBe(false);
  });

  it('returns null for missing or unparseable specs', () => {
    expect(isOpenNow('', wedMorning)).toBe(null);
    expect(isOpenNow(null, wedMorning)).toBe(null);
    expect(isOpenNow('sunrise-sunset', wedMorning)).toBe(null);
  });
});
