/**
 * Where the API lives. One definition for the whole client.
 *
 * `/api` works on the web because the frontend and the API share an origin
 * (Vercel rewrites /api/* to the API host). A native build has no such origin:
 * the WebView serves the app from capacitor://localhost or https://localhost,
 * so every relative "/api/..." would resolve against that scheme and fail. Any
 * call written as `${API_BASE}/...` keeps working in both, because a native
 * build sets VITE_API_URL to the absolute API host.
 *
 * The same constant was previously copy-pasted into ~110 modules as
 * `import.meta.env.VITE_API_URL || "/api"`. Import it from here instead so the
 * value can never drift between call sites.
 */
export const API_BASE = import.meta.env?.VITE_API_URL || "/api";

/** True when the client talks to a different origin than the page it runs on. */
export const isCrossOriginApi = /^https?:\/\//i.test(API_BASE);

// ponytail: no getter/config object — this is read-only and fixed at build time.
