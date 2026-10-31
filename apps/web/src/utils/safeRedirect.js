/**
 * Resolve a post-login destination without allowing a query parameter to send
 * the browser to another origin. Only root-relative URLs are accepted; paths
 * that browsers may interpret as protocol-relative (including encoded slash or
 * backslash variants) fall back to the member home.
 */
export function getSafeMemberRedirect(search, fallback = "/member") {
  const requestedPath = new URLSearchParams(search).get("redirect");
  if (!requestedPath || !requestedPath.startsWith("/") || requestedPath.startsWith("//")) {
    return fallback;
  }

  try {
    const decodedPath = decodeURIComponent(requestedPath);
    if (decodedPath.includes("\\") || decodedPath.startsWith("//")) return fallback;

    const origin = window.location.origin;
    const target = new URL(requestedPath, origin);
    if (target.origin !== origin || target.pathname === "/login") return fallback;
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return fallback;
  }
}
