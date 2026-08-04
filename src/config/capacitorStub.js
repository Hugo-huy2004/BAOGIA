/**
 * Stand-in for every `@capacitor/*` package in the web build.
 *
 * All Capacitor use in src/ sits behind `IS_NATIVE` (NativeShell.jsx,
 * pushService.js), so on the web those `import()`s are unreachable. Rollup
 * still emitted a chunk per plugin — each one calls `registerPlugin()` at
 * module scope, and a side-effectful module survives tree-shaking even when
 * nothing imports it. Those orphan chunks then landed in the PWA precache, so
 * every browser visitor downloaded ~32K of native-only code.
 *
 * Naming them into one chunk was worse: Rollup hoisted it into the entry's
 * modulepreload. Aliasing the packages away is the fix that leaves nothing to
 * emit — same trick the native build uses for `virtual:pwa-register/react`.
 *
 * The Proxy means a stray import of any plugin still destructures cleanly
 * instead of throwing at module scope; the methods resolve to undefined, which
 * is only reachable if a native guard is ever wrong.
 */
export default new Proxy({}, { get: () => () => Promise.resolve() });
