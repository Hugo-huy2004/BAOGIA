const apiBase = () => import.meta.env.VITE_API_URL || "/api";

async function requestTheme(path, payload) {
  try {
    const response = await fetch(`${apiBase()}${path}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      // apiAuthInterceptor consumes this before calling native fetch().
      hugoNetworkFallback: true,
    });
    const data = await response.json().catch(() => ({}));
    return {
      ok: response.ok && data.success === true,
      status: response.status,
      data,
      networkUnavailable: data.networkUnavailable === true,
    };
  } catch {
    // Isolated renders and tests may run before the interceptor is installed.
    return {
      ok: false,
      status: 0,
      data: { code: "NETWORK_UNAVAILABLE", networkUnavailable: true },
      networkUnavailable: true,
    };
  }
}

export const setPortalTheme = (themeId) => requestTheme("/joy/set-theme", { themeId });

export const rentPortalTheme = (themeId, duration = "day") => (
  requestTheme("/joy/rent-theme", { themeId, duration })
);
