// utils/security.js
// Advanced Anti-Hacker & Anti-DevTools Module

/**
 * Mute all console logs on the client side
 */
const obfuscateConsole = () => {
  if (import.meta.env.PROD) {
    const noop = () => {};
    window.console.log = noop;
    window.console.warn = noop;
    window.console.error = noop;
    window.console.info = noop;
    window.console.debug = noop;
    window.console.trace = noop;
  }
};

/**
 * Main initialization function to start all security layers
 */
export const initSecurityShield = () => {
  // Only activate in production to allow local development
  if (import.meta.env.PROD) {
    obfuscateConsole();
  }
};
