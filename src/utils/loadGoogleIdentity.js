const GOOGLE_IDENTITY_SRC = "https://accounts.google.com/gsi/client";
const GOOGLE_IDENTITY_SCRIPT_ID = "hugo-google-identity";

let loadingPromise = null;
const LOAD_TIMEOUT_MS = 10000;

/**
 * Load Google Identity Services only on screens that actually render a Google
 * sign-in button. Keeping it out of index.html avoids a third-party request and
 * cookie work on every public portfolio route.
 */
export function loadGoogleIdentity() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.reject(new Error("Google Identity Services requires a browser."));
  }

  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id);
  if (loadingPromise) return loadingPromise;

  loadingPromise = new Promise((resolve, reject) => {
    let timeoutId;

    const cleanup = (script) => {
      window.clearTimeout(timeoutId);
      script?.removeEventListener("load", onLoad);
      script?.removeEventListener("error", onError);
    };

    const onLoad = () => {
      const script = document.getElementById(GOOGLE_IDENTITY_SCRIPT_ID);
      cleanup(script);
      const googleId = window.google?.accounts?.id;
      if (googleId) {
        if (script) script.dataset.loadState = "ready";
        resolve(googleId);
        return;
      }
      script?.remove();
      loadingPromise = null;
      reject(new Error("Google Identity Services loaded without an accounts API."));
    };

    const onError = () => {
      const script = document.getElementById(GOOGLE_IDENTITY_SCRIPT_ID);
      cleanup(script);
      script?.remove();
      loadingPromise = null;
      reject(new Error("Unable to load Google Identity Services."));
    };

    const existing = document.getElementById(GOOGLE_IDENTITY_SCRIPT_ID);
    if (existing) {
      if (existing.dataset.loadState === "ready") {
        onLoad();
        return;
      }
      existing.addEventListener("load", onLoad);
      existing.addEventListener("error", onError);
      timeoutId = window.setTimeout(onError, LOAD_TIMEOUT_MS);
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_IDENTITY_SCRIPT_ID;
    script.src = GOOGLE_IDENTITY_SRC;
    script.async = true;
    script.defer = true;
    script.dataset.loadState = "loading";
    script.addEventListener("load", onLoad);
    script.addEventListener("error", onError);
    timeoutId = window.setTimeout(onError, LOAD_TIMEOUT_MS);
    document.head.appendChild(script);
  });

  return loadingPromise;
}
