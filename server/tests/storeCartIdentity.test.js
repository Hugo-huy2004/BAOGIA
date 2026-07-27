import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';

// ponytail: source grep, not supertest — no HTTP harness exists in this repo yet.
// Guards the rule from CLAUDE.md: member identity comes from req.memberEmail only.
const src = readFileSync(new URL('../routes/storeCartRoutes.js', import.meta.url), 'utf8');

describe('storeCartRoutes identity', () => {
  it('never reads email from the client', () => {
    expect(src).not.toMatch(/req\.(body|query|params)\.email/);
    expect(src).not.toMatch(/const\s*\{[^}]*\bemail\b[^}]*\}\s*=\s*req\.(body|query)/);
  });

  it('guards every route with auth middleware', () => {
    const routes = [...src.matchAll(/router\.(get|post|put|delete)\((.*)$/gm)].map(m => m[2]);
    expect(routes.length).toBeGreaterThan(0);
    for (const r of routes) expect(r).toMatch(/requireMember|requireAdmin/);
  });
});
