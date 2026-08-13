/**
 * Self-check for the fetch auth interceptor.
 *
 * The interceptor sits in front of every API call in the app, so a mistake here
 * is invisible until requests start failing in production. These assertions
 * cover the rules that are easy to break while refactoring:
 *
 *   - a request with nothing to add is forwarded untouched (headers === null),
 *     which is what stops a Request body from being disturbed by a rebuild;
 *   - a caller's valid Bearer wins over the session token;
 *   - "Bearer undefined" is stripped and replaced by the live token;
 *   - sentAuth reports truthfully, since it decides whether a 401 wipes the
 *     session — clearing it on an unauthenticated call would log users out.
 *
 * Run: node scripts/check-api-auth.mjs
 */
import assert from "node:assert/strict";

// Import only the pure decision function; the module's browser-facing parts are
// never touched here.
const { authDecision } = await import("../src/services/apiAuthHeaders.js");

const TOKEN = "live-token-123";

// 1. Nothing to add → forward untouched.
let d = authDecision("/api/bios/me", {}, null);
assert.equal(d.headers, null, "no token and no auth header must forward untouched");
assert.equal(d.sentAuth, false);
assert.equal(d.authToken, null);

// 2. Session token present → attach it.
d = authDecision("/api/bios/me", {}, TOKEN);
assert.equal(d.headers.Authorization, `Bearer ${TOKEN}`);
assert.equal(d.sentAuth, true);
assert.equal(d.authToken, TOKEN);

// 3. Caller already sent a valid Bearer → keep theirs, do not overwrite.
d = authDecision("/api/bios/me", { headers: { Authorization: "Bearer caller-token" } }, TOKEN);
assert.equal(d.headers, null, "a valid caller token needs no rewrite");
assert.equal(d.sentAuth, true);
assert.equal(d.authToken, "caller-token");

// 4. Malformed header → strip it and use the live token.
for (const bad of ["Bearer undefined", "Bearer null", "Bearer "]) {
  d = authDecision("/api/bios/me", { headers: { Authorization: bad } }, TOKEN);
  assert.equal(d.headers.Authorization, `Bearer ${TOKEN}`, `must replace "${bad}"`);
  assert.equal(d.sentAuth, true);
}

// 5. Malformed header and no session → strip, and report that nothing was sent,
//    so a 401 does not wipe a session the request never used.
d = authDecision("/api/bios/me", { headers: { Authorization: "Bearer undefined" } }, null);
assert.equal(d.headers.Authorization, undefined, "malformed header must be removed");
assert.equal(d.sentAuth, false, "a stripped header must not count as sent auth");
assert.equal(d.authToken, null);

// 6. Header casing varies across call sites.
d = authDecision("/api/bios/me", { headers: { authorization: "Bearer undefined" } }, TOKEN);
assert.equal(d.headers.Authorization, `Bearer ${TOKEN}`);
assert.equal(Object.keys(d.headers).some(k => k.toLowerCase() === "authorization" && k !== "Authorization"), false);

// 7. Headers instances and pair arrays are accepted, and other headers survive.
d = authDecision("/api/upload", { headers: new Headers({ "X-Trace": "abc" }) }, TOKEN);
assert.equal(d.headers["x-trace"], "abc", "unrelated headers must be preserved");
d = authDecision("/api/upload", { headers: [["X-Trace", "abc"]] }, TOKEN);
assert.equal(d.headers["X-Trace"], "abc");

// 8. A Request object carries its own headers when init has none.
d = authDecision({ url: "/api/bios/me", headers: new Headers({ Authorization: "Bearer undefined" }) }, {}, TOKEN);
assert.equal(d.headers.Authorization, `Bearer ${TOKEN}`);

console.log("check-api-auth: 8 nhóm assertion đều đạt.");
