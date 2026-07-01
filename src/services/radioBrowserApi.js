// Client for our own backend's Radio Browser proxy (server/routes/radioRoutes.js).
// Calling the public Radio Browser API directly from the browser was unreliable —
// some of their mirror nodes return inconsistent CORS headers — so the actual
// lookups happen server-side, where CORS doesn't apply at all.
const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.startsWith("http")) return envUrl;
  if (typeof window !== "undefined") return `${window.location.origin}${envUrl || "/api"}`;
  return "/api";
};

export async function fetchStationByName(name, excludeUrl) {
  try {
    let url = `${getApiUrl()}/radio/station?name=${encodeURIComponent(name)}`;
    if (excludeUrl) url += `&exclude=${encodeURIComponent(excludeUrl)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchStationsByNames(names) {
  try {
    const res = await fetch(`${getApiUrl()}/radio/stations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ names })
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

// Radio Browser asks clients to "click" a station's url endpoint when played —
// it both resolves redirects/playlists server-side and feeds their clickcount ranking.
export function registerStationClick(stationUuid) {
  if (!stationUuid) return;
  fetch(`${getApiUrl()}/radio/click`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stationuuid: stationUuid })
  }).catch(() => {});
}
