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

// Execute the real browser modules with small in-memory browser/transport stubs.
const { readFileSync } = await import('node:fs');
const { runInNewContext } = await import('node:vm');
function browserModule(file, names, globals = {}) {
  const source = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')
    .replace(/^import .*;?\n/gm, '')
    .replace(/^export \{[^}]+\};?$/gm, '')
    .replace(/\bexport /g, '')
    .replace(/import\.meta\.env/g, '__env');
  return runInNewContext(`${source}\n;({${names.join(',')}})`, {
    __env: {}, URL, URLSearchParams, Headers, Response, Request, AbortSignal,
    performance, console, ...globals,
  });
}
const storage = () => {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
};
const local = storage(), session = storage();
const auth = browserModule('src/services/authSession.js', ['loginMember', 'loginAdmin', 'getAdminSession'], {
  localStorage: local, sessionStorage: session, isCrossOriginApi: false, API_BASE: '/api',
  fetch: async () => Response.json({success: true}),
});
local.setItem('price-doc-admin-session', JSON.stringify({username: 'old'}));
await auth.loginAdmin({username: 'new', password: 'example'}, {remember: false});
assert.equal(auth.getAdminSession().username, 'new', 'sessionStorage login replaces stale persistent login');

let currentToken = 'old', pending;
const win = {
  location: { origin: 'https://example.com' },
  fetch: () => new Promise(resolve => { pending = resolve; }),
};
const interceptor = browserModule('src/services/apiAuthInterceptor.js', ['installApiAuthInterceptor'], {
  window: win, getMemberToken: () => currentToken, getAdminToken: () => null,
  clearMemberSession: () => { currentToken = null; }, authDecision,
  recordApiOutcome: () => {}, reportClientEvent: () => {}, SLOW_API_MS: Infinity,
});
interceptor.installApiAuthInterceptor();
const json401 = code => Response.json({code}, {status: 401});
let request = win.fetch('/api/bios/me');
currentToken = 'new';
pending(json401('AUTH_SESSION_INVALID'));
await request;
assert.equal(currentToken, 'new', 'late 401 cannot erase a newer login');
for (const response of [json401('WRONG_PIN'), Response.json({error: 'PROFILE_INCOMPLETE'}, {status: 403}), new Response('', {status: 503})]) {
  request = win.fetch('/api/bios/me'); pending(response); await request;
  assert.equal(currentToken, 'new', 'permission, PIN and server failures preserve session');
}
request = win.fetch(new URL('https://example.com/api/joy/balance'));
pending(json401('AUTH_SESSION_INVALID')); await request;
assert.equal(currentToken, null, 'URL inputs and wallet routes expire rejected sessions');

for (const [file, names, expression] of [
  ['src/services/api.js', ['apiFetch'], module => module.apiFetch('/bios/me')],
  ['src/services/api/BaseApi.js', ['api'], module => module.api.get('/bios/me')],
]) {
  local.setItem('price-doc-member-session', JSON.stringify({token: 'valid'}));
  const module = browserModule(file, names, {localStorage: local, window: {location: {}}, fetch: async () => Response.json({error: 'PROFILE_INCOMPLETE'}, {status: 403})});
  await assert.rejects(expression(module));
  assert.ok(local.getItem('price-doc-member-session'), `${file}: 403 retains login`);
}

let mode = 'browser';
const media = new Map();
const platformWindow = {
  location: {search: '?source=pwa'}, navigator: {},
  sessionStorage: {setItem() {throw new Error('storage blocked');}, getItem() {throw new Error('storage blocked');}},
  addEventListener() {}, removeEventListener() {},
  matchMedia(query) {
    if (!media.has(query)) media.set(query, {
      get matches() {return query === `(display-mode: ${mode})`;},
      addEventListener(_event, fn) {this.listener = fn;},
      removeEventListener() {this.listener = null;},
    });
    return media.get(query);
  },
};
const platform = browserModule('src/config/platform.js', ['isStandalone', 'subscribeDisplayMode'], {
  window: platformWindow, navigator: {userAgent: 'Android'},
});
assert.equal(platform.isStandalone(), false, 'source=pwa alone is not installed mode');
mode = 'fullscreen';
assert.equal(platform.isStandalone(), true, 'fullscreen launch survives blocked sessionStorage');
mode = 'standalone';
assert.equal(platform.isStandalone(), true);
let updates = 0;
const dispose = platform.subscribeDisplayMode(() => updates++);
mode = 'minimal-ui';
media.get('(display-mode: minimal-ui)').listener();
assert.equal(updates, 1, 'all app display modes are subscribed separately');
assert.equal(platform.isStandalone(), true);
dispose();
assert.ok([...media.values()].every(value => !value.listener), 'display listeners are disposed');
platformWindow.location.search = '';
const plainTab = browserModule('src/config/platform.js', ['isStandalone'], {window: platformWindow, navigator: {userAgent: 'Android'}});
mode = 'fullscreen';
assert.equal(plainTab.isStandalone(), false, 'fullscreen mobile browser is still web');

const {requireMemberSession, requireMember, signMemberToken} = await import('../server/middleware/authMiddleware.js');
const {default: SecurityBlock} = await import('../server/models/SecurityBlock.js');
const findOne = SecurityBlock.findOne;
try {
  SecurityBlock.findOne = () => ({lean: async () => {throw new Error('simulated database outage');}});
  for (const middleware of [requireMemberSession, requireMember]) {
    for (const [token, expected] of [[signMemberToken('regression@example.com'), 503], ['broken-token', 401]]) {
      const res = {status(code) {this.statusCode = code; return this;}, json(body) {this.body = body; return this;}};
      await middleware({headers: {authorization: `Bearer ${token}`}}, res, () => assert.fail('unverified request passed'));
      assert.equal(res.statusCode, expected, 'only invalid JWTs return 401; DB failures return 503');
      assert.equal(res.body.code, expected === 401 ? 'AUTH_SESSION_INVALID' : 'AUTH_UNAVAILABLE');
    }
  }
} finally {SecurityBlock.findOne = findOne;}
console.log('check-api-auth: session races, permission failures, display modes and database outages passed.');
