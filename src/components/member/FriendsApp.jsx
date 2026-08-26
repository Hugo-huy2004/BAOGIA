import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGesture } from "@use-gesture/react";
import { flushSync } from "react-dom";
import { useTranslation } from "react-i18next";
import { notify } from "../../lib/notify";
import { getCachedGeolocation } from "../../utils/geoCache";
import { resolveCoords } from "../../utils/weather";
import "./friends-app.css";

const API = "/api/friends";
const LOCATION_ASKED_KEY = "hugo:friends:location-asked:v1";
const LOCATION_GRANTED_KEY = "hugo:pwa:location-granted:v1";
const NEARBY_CACHE_KEY = "hugo:friends:nearby:v1";
const NEARBY_CACHE_MS = 5 * 60 * 1000;
const DEFAULT_CENTER = { lat: 16.0471, lng: 108.2068 };
const TILE_CDNS = ["a", "b", "c", "d"];
const MAP_MODE_KEY = "hugo:friends:map-mode:v1";

async function api(path = "", options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: options.body ? { "Content-Type": "application/json", ...options.headers } : options.headers,
  });
  if (response.status === 204) return null;
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "FRIENDS_REQUEST_FAILED");
  return payload;
}

const initials = (name = "") => name.trim().split(/\s+/).slice(-2).map((part) => part[0]).join("").toUpperCase() || "H";

function Avatar({ person, size = "h-12 w-12", className = "" }) {
  return person.avatarUrl ? (
    <img src={person.avatarUrl} alt="" className={`${size} ${className} shrink-0 rounded-full object-cover bg-muted`} />
  ) : (
    <span className={`${size} ${className} shrink-0 rounded-full bg-[#dfff70] grid place-items-center text-sm font-black text-[#15151b]`} aria-hidden="true">{initials(person.displayName)}</span>
  );
}

function PersonCard({ person, children, onOpen, tone = "lime" }) {
  const { t } = useTranslation();
  return (
    <article className={`friends-person friends-person--${tone}`}>
      <button type="button" onClick={onOpen} className="flex w-full min-w-0 items-center gap-3 rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black">
        <Avatar person={person} className="ring-4 ring-white shadow-md" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-black text-[#15151b]">{person.displayName}</span>
          <span className="block truncate text-xs font-semibold text-[#595966]">{person.headline || `@${person.slug}`}</span>
          <span className="mt-1 flex flex-wrap gap-1.5">
            {person.distanceKm != null && <span className="friends-chip"><span className="material-symbols-outlined" aria-hidden="true">near_me</span>{t("friends.distance", { count: person.distanceKm })}</span>}
            {person.mutualFriendsCount > 0 && <span className="friends-chip friends-chip--violet">{t("friends.mutualFriends", { count: person.mutualFriendsCount })}</span>}
          </span>
        </span>
      </button>
      {children && <div className="mt-3 flex flex-wrap justify-end gap-2">{children}</div>}
    </article>
  );
}

function Empty({ icon, title, body }) {
  return <div className="rounded-[28px] border-2 border-dashed border-black/15 bg-white/60 px-5 py-10 text-center"><span className="material-symbols-outlined text-4xl text-[#777786]" aria-hidden="true">{icon}</span><p className="mt-3 text-sm font-black text-[#15151b]">{title}</p><p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-[#666674]">{body}</p></div>;
}

export default function FriendsApp({ onBack }) {
  const { t } = useTranslation();
  const requestedView = new URLSearchParams(window.location.search).get("view");
  const [view, setView] = useState(["discover", "friends", "requests", "map"].includes(requestedView) ? requestedView : "map");
  const [snapshot, setSnapshot] = useState({ friends: [], incoming: [], outgoing: [], settings: { discoverable: false, hasLocation: false, shareLocation: false } });
  const [people, setPeople] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState("");
  const [profile, setProfile] = useState(null);
  const [locationBlocked, setLocationBlocked] = useState(false);
  const [locationMode, setLocationMode] = useState("");
  const [focusedFriend, setFocusedFriend] = useState("");
  const [dismissedRequest, setDismissedRequest] = useState("");
  const autoLocationStarted = useRef(false);

  const loadSnapshot = useCallback(async () => {
    const result = await api();
    setSnapshot(result);
    setLocationMode(result.settings?.locationSource || "");
    return result;
  }, []);

  const discover = useCallback(async (search = "") => {
    const result = await api(`/discover${search.trim() ? `?q=${encodeURIComponent(search.trim())}` : ""}`);
    setPeople(result.people || []);
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([loadSnapshot(), discover()]).catch(() => active && notify.error(t("friends.errors.load"))).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [discover, loadSnapshot, t]);

  useEffect(() => {
    if (view !== "discover") return undefined;
    const text = query.trim();
    if (text.length < 2) return undefined;
    const timer = setTimeout(() => {
      setWorking("search");
      discover(text).catch(() => notify.error(t("friends.errors.search"))).finally(() => setWorking(""));
    }, 350);
    return () => clearTimeout(timer);
  }, [discover, query, t, view]);

  const refresh = async () => Promise.all([loadSnapshot(), discover(query)]);
  const act = async (key, request, successKey) => {
    setWorking(key);
    try { await request(); notify.success(t(successKey)); await refresh(); }
    catch { notify.error(t("friends.errors.action")); }
    finally { setWorking(""); }
  };

  const openProfile = async (person) => {
    setWorking(`profile:${person.slug}`);
    try { setProfile(await api(`/users/${encodeURIComponent(person.slug)}`)); }
    catch { notify.error(t("friends.errors.profile")); }
    finally { setWorking(""); }
  };

  const search = async (event) => {
    event.preventDefault();
    if (query.trim() && query.trim().length < 2) return notify.info(t("friends.searchTooShort"));
    setWorking("search");
    try { await discover(query); }
    catch { notify.error(t("friends.errors.search")); }
    finally { setWorking(""); }
  };

  const syncNearby = useCallback(async ({ fresh = false, notifySuccess = false } = {}) => {
    setWorking("nearby");
    try {
      if (!fresh) {
        let cached = null;
        try { cached = JSON.parse(sessionStorage.getItem(NEARBY_CACHE_KEY) || "null"); }
        catch { sessionStorage.removeItem(NEARBY_CACHE_KEY); }
        if (cached?.at && Date.now() - cached.at < NEARBY_CACHE_MS) {
          setPeople(cached.people || []);
          setSnapshot((current) => ({ ...current, settings: cached.settings }));
          setLocationMode(cached.source || "");
          setLocationBlocked(false);
          return;
        }
      }
      let permission = localStorage.getItem(LOCATION_GRANTED_KEY) === "true" ? "granted" : "prompt";
      try {
        const status = await navigator.permissions?.query({ name: "geolocation" });
        if (status) permission = status.state;
      } catch { /* Safari may not expose permission state. */ }
      const asked = localStorage.getItem(LOCATION_ASKED_KEY) === "true";
      let location;
      if (permission !== "denied" && !(permission === "prompt" && asked)) {
        if (permission === "prompt") localStorage.setItem(LOCATION_ASKED_KEY, "true");
        try {
          const position = await getCachedGeolocation({ fresh, ask: permission === "prompt" });
          localStorage.setItem(LOCATION_GRANTED_KEY, "true");
          location = { lat: position.coords.latitude, lng: position.coords.longitude, source: "gps" };
        } catch { /* IP city fallback below. */ }
      }
      if (!location) {
        const network = await resolveCoords();
        if (network.source !== "ip") throw new Error("LOCATION_UNAVAILABLE");
        location = { lat: network.lat, lng: network.lon, source: "ip" };
      }
      const result = await api("/discover/nearby", { method: "POST", body: JSON.stringify({ ...location, share: true }) });
      setPeople(result.people || []);
      setSnapshot((current) => ({ ...current, settings: result.settings }));
      setLocationMode(location.source);
      setLocationBlocked(false);
      try { sessionStorage.setItem(NEARBY_CACHE_KEY, JSON.stringify({ at: Date.now(), people: result.people || [], settings: result.settings, source: location.source })); }
      catch { /* Private mode or quota errors must not break location sync. */ }
      if (notifySuccess) notify.success(t(location.source === "gps" ? "friends.nearbyEnabled" : "friends.networkEnabled"));
    } catch {
      setLocationBlocked(true);
      if (notifySuccess) notify.error(t("friends.errors.location"));
    } finally { setWorking(""); }
  }, [t]);

  useEffect(() => {
    if (loading || autoLocationStarted.current) return;
    autoLocationStarted.current = true;
    syncNearby();
  }, [loading, syncNearby]);

  const sendRequest = (person) => act(`send:${person.slug}`, () => api(`/requests/${encodeURIComponent(person.slug)}`, { method: "POST" }), "friends.sent");
  const accept = (id) => act(`accept:${id}`, () => api(`/${id}/accept`, { method: "PATCH" }), "friends.accepted");
  const remove = (id, successKey = "friends.removed") => act(`remove:${id}`, () => api(`/${id}`, { method: "DELETE" }), successKey);

  const discoveryAction = (person) => {
    const relation = person.relationship;
    if (!relation) return <ActionButton onClick={() => sendRequest(person)} disabled={working === `send:${person.slug}`}>{t("friends.add")}</ActionButton>;
    if (relation.status === "accepted") return <span className="px-3 py-2 text-xs font-black text-[#686876]">{t("friends.alreadyFriends")}</span>;
    if (relation.status === "pending" && relation.direction === "incoming") return <ActionButton onClick={() => accept(relation.id)} disabled={working === `accept:${relation.id}`}>{t("friends.accept")}</ActionButton>;
    return <span className="px-3 py-2 text-xs font-black text-[#686876]">{t(relation.status === "pending" ? "friends.pending" : "friends.declined")}</span>;
  };

  const visibleFriends = snapshot.friends.filter((friend) => friend.sharedLocation);
  const focused = snapshot.friends.find((friend) => friend.slug === focusedFriend && friend.sharedLocation);
  const mapCenter = focused?.sharedLocation || snapshot.settings.location || DEFAULT_CENTER;
  const nearestFriend = snapshot.settings.location && visibleFriends.reduce((nearest, friend) => {
    const latScale = Math.cos((snapshot.settings.location.lat * Math.PI) / 180);
    const distance = ((friend.sharedLocation.lat - snapshot.settings.location.lat) ** 2)
      + (((friend.sharedLocation.lng - snapshot.settings.location.lng) * latScale) ** 2);
    return !nearest || distance < nearest.distance ? { friend, distance } : nearest;
  }, null)?.friend;
  const incomingPopup = !loading && !profile
    ? snapshot.incoming.find((person) => person.relationshipId !== dismissedRequest)
    : null;
  const locationLabel = locationMode === "gps" ? t("friends.gpsLive") : locationMode === "ip" ? t("friends.ipApproximate") : t("friends.locating");

  return (
    <div className="friends-app">
      <FriendsMap center={mapCenter} friends={visibleFriends} hasLocation={snapshot.settings.hasLocation && !focused} source={locationMode} focusedSlug={focusedFriend} onOpen={openProfile} />
      <header className="friends-topbar">
        <button type="button" onClick={onBack} className="friends-round-button" aria-label={t("friends.back")}><span className="material-symbols-outlined" aria-hidden="true">arrow_back</span></button>
        <div className="min-w-0 flex-1"><p className="friends-wordmark">HUGO NEAR</p><span className="friends-location-pill"><span className={`friends-live-dot ${locationMode === "ip" ? "friends-live-dot--ip" : ""}`} />{locationLabel}</span></div>
        <button type="button" onClick={() => setView("discover")} className="friends-round-button" aria-label={t("friends.search")}><span className="material-symbols-outlined" aria-hidden="true">search</span></button>
      </header>

      {loading && <div className="friends-loader" aria-label={t("friends.loading")}><span /></div>}
      {!loading && view === "map" && <MapSummary visibleFriends={visibleFriends} settings={snapshot.settings} nearestFriend={nearestFriend} />}
      {!loading && view === "friends" && <FriendsCarousel friends={snapshot.friends} focusedSlug={focusedFriend} working={working} onFocus={setFocusedFriend} onOpen={openProfile} onRemove={remove} />}

      {!loading && ["discover", "requests"].includes(view) && (
        <section className="friends-sheet" aria-label={t(`friends.tabs.${view}`)}>
          <div className="friends-sheet__handle" />
          <div className="friends-sheet__heading"><div><p className="friends-kicker">HUGO NEAR</p><h1>{t(`friends.tabs.${view}`)}</h1></div><button type="button" onClick={() => setView("map")} className="friends-sheet__close" aria-label={t("friends.tabs.map")}><span className="material-symbols-outlined">close</span></button></div>

          {view === "discover" ? (
            <div className="space-y-4">
              <form onSubmit={search} className="friends-search"><span className="material-symbols-outlined" aria-hidden="true">search</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("friends.searchPlaceholder")} aria-label={t("friends.search")} /><button type="submit" disabled={working === "search"} aria-label={t("friends.search")}><span className="material-symbols-outlined">arrow_forward</span></button></form>
              <div className="friends-nearby-card"><div className="friends-nearby-icon"><span className="material-symbols-outlined">radar</span></div><div className="min-w-0 flex-1"><p className="text-sm font-black text-[#15151b]">{t("friends.nearbyTitle")}</p><p className="mt-0.5 text-[11px] font-semibold leading-relaxed text-[#5f5f6d]">{t(locationBlocked ? "friends.locationUnavailable" : locationMode === "ip" ? "friends.networkPrivacy" : "friends.nearbyPrivacy")}</p></div><button type="button" onClick={() => syncNearby({ fresh: true, notifySuccess: true })} disabled={working === "nearby"} className="friends-icon-action" aria-label={t("friends.refreshNearby")}><span className={`material-symbols-outlined ${working === "nearby" ? "animate-spin" : ""}`}>refresh</span></button></div>
              {people.length ? <div className="grid gap-3 sm:grid-cols-2">{people.map((person, index) => <PersonCard key={person.slug} person={person} tone={["lime", "cyan", "coral", "violet"][index % 4]} onOpen={() => openProfile(person)}>{discoveryAction(person)}</PersonCard>)}</div> : <Empty icon="person_search" title={t("friends.emptyDiscoverTitle")} body={t("friends.emptyDiscoverBody")} />}
            </div>
          ) : view === "requests" ? (
            <div className="space-y-6"><FriendSection title={t("friends.incoming")} people={snapshot.incoming} empty={t("friends.noIncoming")} onOpen={openProfile}>{(person) => <><ActionButton onClick={() => accept(person.relationshipId)} disabled={working === `accept:${person.relationshipId}`}>{t("friends.accept")}</ActionButton><SecondaryButton onClick={() => remove(person.relationshipId, "friends.declinedToast")}>{t("friends.reject")}</SecondaryButton></>}</FriendSection><FriendSection title={t("friends.outgoing")} people={snapshot.outgoing} empty={t("friends.noOutgoing")} onOpen={openProfile}>{(person) => <SecondaryButton onClick={() => remove(person.relationshipId, "friends.cancelled")}>{t("friends.cancelRequest")}</SecondaryButton>}</FriendSection></div>
          ) : null}
        </section>
      )}

      <nav className="friends-dock" aria-label={t("friends.sections")}>{[["map", "map", t("friends.tabs.map")], ["requests", "person_add", t("friends.tabs.requests"), snapshot.incoming.length], ["friends", "group", t("friends.tabs.friends"), snapshot.friends.length]].map(([id, icon, label, count]) => <button key={id} type="button" onClick={() => { setView(id); if (id === "map") setFocusedFriend(""); if (id === "friends" && snapshot.friends[0]) setFocusedFriend((current) => current || snapshot.friends[0].slug); }} className={view === id ? "is-active" : ""} aria-label={label} aria-current={view === id ? "page" : undefined}><span className="material-symbols-outlined" aria-hidden="true">{icon}</span>{count > 0 && <b>{count}</b>}</button>)}</nav>
      {incomingPopup && <FriendRequestPopup person={incomingPopup} working={working} onClose={() => setDismissedRequest(incomingPopup.relationshipId)} onOpen={() => openProfile(incomingPopup)} onAccept={() => { setDismissedRequest(incomingPopup.relationshipId); accept(incomingPopup.relationshipId); }} onReject={() => { setDismissedRequest(incomingPopup.relationshipId); remove(incomingPopup.relationshipId, "friends.declinedToast"); }} />}
      {profile && <ProfileDialog data={profile} onClose={() => setProfile(null)} onAccept={(id) => { setProfile(null); accept(id); }} onSend={(person) => { setProfile(null); sendRequest(person); }} working={working} />}
    </div>
  );
}

function MapSummary({ visibleFriends, settings, nearestFriend }) {
  const { t } = useTranslation();
  const directions = nearestFriend ? `https://www.google.com/maps/dir/?api=1&destination=${nearestFriend.sharedLocation.lat},${nearestFriend.sharedLocation.lng}&travelmode=walking` : "";
  return <div className="friends-map-card"><div className="flex min-w-0 items-center gap-3"><div className="flex -space-x-2">{visibleFriends.slice(0, 3).map((friend) => <Avatar key={friend.slug} person={friend} size="h-9 w-9" className="ring-2 ring-white" />)}</div><div className="min-w-0"><p className="truncate text-sm font-black text-[#15151b]">{visibleFriends.length ? t("friends.peopleOnMap", { count: visibleFriends.length }) : t("friends.emptyMapTitle")}</p><p className="truncate text-[11px] font-semibold text-[#686876]">{nearestFriend ? nearestFriend.displayName : t(settings.hasLocation ? "friends.mapPrivacyShort" : "friends.locating")}</p></div></div>{directions ? <a href={directions} target="_blank" rel="noreferrer" className="friends-share-button is-on" aria-label={t("friends.directions")}><span className="material-symbols-outlined">directions</span></a> : <span className="friends-share-button is-on" aria-hidden="true"><span className="material-symbols-outlined">location_on</span></span>}</div>;
}

function FriendsCarousel({ friends, focusedSlug, working, onFocus, onOpen, onRemove }) {
  const { t } = useTranslation();
  const handleScroll = (event) => {
    const track = event.currentTarget;
    const center = track.scrollLeft + (track.clientWidth / 2);
    const card = [...track.children].reduce((closest, item) => (
      Math.abs(item.offsetLeft + (item.offsetWidth / 2) - center) < Math.abs(closest.offsetLeft + (closest.offsetWidth / 2) - center) ? item : closest
    ), track.children[0]);
    if (card?.dataset.slug && card.dataset.slug !== focusedSlug) onFocus(card.dataset.slug);
  };
  if (!friends.length) return <div className="friends-carousel friends-carousel--empty"><Empty icon="group" title={t("friends.emptyFriendsTitle")} body={t("friends.emptyFriendsBody")} /></div>;
  return <div className="friends-carousel"><div className="friends-carousel__track" onScroll={handleScroll}>{friends.map((friend) => <article key={friend.slug} data-slug={friend.slug} className={`friends-carousel__card ${focusedSlug === friend.slug ? "is-focused" : ""}`} onClick={() => onFocus(friend.slug)}><button type="button" onClick={(event) => { event.stopPropagation(); onOpen(friend); }} className="friends-carousel__profile"><Avatar person={friend} size="h-14 w-14" className="ring-4 ring-white" /><span className="min-w-0"><strong>{friend.displayName}</strong><small>{friend.sharedLocation ? t("friends.approximateLocation") : t("friends.emptyMapTitle")}</small></span></button><SecondaryButton onClick={(event) => { event.stopPropagation(); onRemove(friend.relationshipId); }} disabled={working === `remove:${friend.relationshipId}`}>{t("friends.unfriend")}</SecondaryButton></article>)}</div><p className="friends-carousel__hint"><span className="material-symbols-outlined">swipe</span>{t("friends.mapPrivacyShort")}</p></div>;
}

function project(lat, lng, zoom) {
  const scale = 256 * (2 ** zoom);
  const safeLat = Math.max(-85.0511, Math.min(85.0511, lat));
  const sin = Math.sin((safeLat * Math.PI) / 180);
  return { x: ((lng + 180) / 360) * scale, y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale };
}

function unproject(x, y, zoom) {
  const scale = 256 * (2 ** zoom);
  const n = Math.PI - ((2 * Math.PI * y) / scale);
  return { lat: (Math.atan(Math.sinh(n)) * 180) / Math.PI, lng: ((x / scale) * 360) - 180 };
}

function FriendsMap({ center, friends, hasLocation, source, focusedSlug, onOpen }) {
  const { t } = useTranslation();
  const [zoom, setZoom] = useState(source === "ip" ? 10 : 13);
  const [viewportCenter, setViewportCenter] = useState(center);
  const [mode, setMode] = useState(() => ["2d", "3d", "satellite"].includes(localStorage.getItem(MAP_MODE_KEY)) ? localStorage.getItem(MAP_MODE_KEY) : "3d");
  const mapRef = useRef(null);
  const worldRef = useRef(null);
  const animationRef = useRef(null);
  const pinchingRef = useRef(false);
  useEffect(() => setZoom(source === "ip" ? 10 : 13), [source]);
  useEffect(() => {
    animationRef.current?.cancel();
    if (worldRef.current) worldRef.current.style.transform = "";
    setViewportCenter({ lat: center.lat, lng: center.lng });
  }, [center.lat, center.lng]);
  useEffect(() => localStorage.setItem(MAP_MODE_KEY, mode), [mode]);
  useEffect(() => () => animationRef.current?.cancel(), []);
  const map = useMemo(() => {
    const point = project(viewportCenter.lat, viewportCenter.lng, zoom);
    const baseX = Math.floor(point.x / 256);
    const baseY = Math.floor(point.y / 256);
    const max = 2 ** zoom;
    const tiles = [];
    for (let y = baseY - 2; y <= baseY + 2; y += 1) for (let x = baseX - 2; x <= baseX + 2; x += 1) if (y >= 0 && y < max) tiles.push({ x, y, urlX: ((x % max) + max) % max, left: (x * 256) - point.x, top: (y * 256) - point.y });
    return { point, tiles };
  }, [viewportCenter.lat, viewportCenter.lng, zoom]);

  const finishPan = useCallback((x, y) => {
    const point = project(viewportCenter.lat, viewportCenter.lng, zoom);
    animationRef.current?.cancel();
    animationRef.current = null;
    flushSync(() => setViewportCenter(unproject(point.x - x, point.y - y, zoom)));
    if (worldRef.current) worldRef.current.style.transform = "";
  }, [viewportCenter.lat, viewportCenter.lng, zoom]);

  const stopInertia = useCallback(() => {
    if (!animationRef.current || !worldRef.current) return;
    const matrix = new DOMMatrixReadOnly(getComputedStyle(worldRef.current).transform);
    finishPan(matrix.m41, matrix.m42);
  }, [finishPan]);

  const bind = useGesture({
    onDrag: ({ first, last, movement: [x, y], velocity: [vx, vy], direction: [dx, dy] }) => {
      if (pinchingRef.current || !worldRef.current) return;
      if (first) stopInertia();
      worldRef.current.style.transform = `translate3d(${x}px,${y}px,0)`;
      if (!last) return;
      const targetX = x + (dx * Math.min(180, vx * 160));
      const targetY = y + (dy * Math.min(180, vy * 160));
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !worldRef.current.animate) return finishPan(x, y);
      animationRef.current = worldRef.current.animate(
        [{ transform: `translate3d(${x}px,${y}px,0)` }, { transform: `translate3d(${targetX}px,${targetY}px,0)` }],
        { duration: 420, easing: "cubic-bezier(.16,1,.3,1)", fill: "forwards" },
      );
      animationRef.current.onfinish = () => finishPan(targetX, targetY);
    },
    onPinch: ({ first, last, offset: [scale], origin }) => {
      if (!worldRef.current || !mapRef.current) return;
      if (first) {
        pinchingRef.current = true;
        stopInertia();
        const rect = mapRef.current.getBoundingClientRect();
        worldRef.current.style.transformOrigin = `${origin[0] - rect.left}px ${origin[1] - rect.top}px`;
      }
      worldRef.current.style.transform = `scale(${scale})`;
      if (!last) return;
      const delta = Math.round(Math.log2(scale));
      const nextZoom = Math.max(5, Math.min(18, zoom + delta));
      const rect = mapRef.current.getBoundingClientRect();
      const offsetX = origin[0] - rect.left - (rect.width / 2);
      const offsetY = origin[1] - rect.top - (rect.height / 2);
      const anchor = unproject(map.point.x + offsetX, map.point.y + offsetY, zoom);
      const nextAnchor = project(anchor.lat, anchor.lng, nextZoom);
      flushSync(() => {
        setZoom(nextZoom);
        setViewportCenter(unproject(nextAnchor.x - offsetX, nextAnchor.y - offsetY, nextZoom));
      });
      worldRef.current.style.transform = "";
      worldRef.current.style.transformOrigin = "";
      pinchingRef.current = false;
    },
  }, {
    drag: { filterTaps: true, threshold: 2 },
    pinch: { from: () => [1, 0], scaleBounds: { min: 0.4, max: 2.5 }, rubberband: true, pinchOnWheel: false, pointer: { touch: true } },
  });

  const selfPoint = project(center.lat, center.lng, zoom);
  const tileUrl = (tile) => mode === "satellite"
    ? `https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${tile.y}/${tile.urlX}`
    : `https://${TILE_CDNS[Math.abs(tile.urlX + tile.y) % TILE_CDNS.length]}.basemaps.cartocdn.com/rastertiles/voyager/${zoom}/${tile.urlX}/${tile.y}.png`;

  return <div {...bind()} ref={mapRef} className={`friends-map is-${mode}`} aria-label={t("friends.mapTitle")}><div ref={worldRef} className="friends-map__world"><div className="friends-map__plane">{map.tiles.map((tile) => <img key={`${mode}:${zoom}:${tile.x}:${tile.y}`} src={tileUrl(tile)} alt="" draggable="false" referrerPolicy="no-referrer" onError={(event) => { if (!event.currentTarget.dataset.fallback) { event.currentTarget.dataset.fallback = "osm"; event.currentTarget.src = `https://tile.openstreetmap.org/${zoom}/${tile.urlX}/${tile.y}.png`; } }} style={{ left: `calc(50% + ${tile.left}px)`, top: `calc(50% + ${tile.top}px)` }} />)}</div>{hasLocation && <div className={`friends-self-pin ${source === "ip" ? "is-ip" : ""}`} style={{ "--map-x": `${selfPoint.x - map.point.x}px`, "--map-y": `${selfPoint.y - map.point.y}px` }}><span className="friends-self-pin__pulse" /><span className="material-symbols-outlined">near_me</span></div>}{friends.map((friend, index) => { const point = project(friend.sharedLocation.lat, friend.sharedLocation.lng, zoom); const x = Math.max(-480, Math.min(480, point.x - map.point.x)); const y = Math.max(-640, Math.min(640, point.y - map.point.y)); return <button key={friend.slug} type="button" onClick={() => onOpen(friend)} className={`friends-map-marker friends-map-marker--${index % 4} ${focusedSlug === friend.slug ? "is-focused" : ""}`} style={{ "--map-x": `${x}px`, "--map-y": `${y}px` }} aria-label={friend.displayName}><Avatar person={friend} size="h-14 w-14" /><span>{friend.displayName.split(" ").slice(-1)}</span>{friend.sharedLocation.source === "ip" && <b>IP</b>}</button>; })}</div><div className="friends-map__wash" /><div className="friends-map__modes">{[["2d", "2D"], ["3d", "3D"], ["satellite", t("friends.satellite")]].map(([id, label]) => <button key={id} type="button" onClick={() => setMode(id)} className={mode === id ? "is-active" : ""} aria-pressed={mode === id}>{label}</button>)}</div><div className="friends-map__zoom"><button type="button" onClick={() => setZoom((value) => Math.min(18, value + 1))} aria-label={t("friends.zoomIn")}>+</button><button type="button" onClick={() => setZoom((value) => Math.max(5, value - 1))} aria-label={t("friends.zoomOut")}>−</button></div><p className="friends-map__gesture-hint"><span className="material-symbols-outlined">pan_tool</span>{t("friends.mapGestureHint")}</p><span className="friends-map__credit">{mode === "satellite" ? "Imagery © Esri · Maxar · Earthstar Geographics" : "© OpenStreetMap · CARTO"}</span></div>;
}

function FriendRequestPopup({ person, working, onClose, onOpen, onAccept, onReject }) {
  const { t } = useTranslation();
  return <div className="friends-request-popup" role="dialog" aria-modal="true" aria-labelledby="friend-request-title"><div className="friends-request-popup__card"><button type="button" onClick={onClose} className="friends-request-popup__close" aria-label={t("friends.close")}><span className="material-symbols-outlined">close</span></button><button type="button" onClick={onOpen} className="friends-request-popup__person"><Avatar person={person} size="h-20 w-20" className="ring-4 ring-white" /><span><small>{t("friends.incoming")}</small><strong id="friend-request-title">{person.displayName}</strong><b>@{person.slug}</b></span></button><div className="friends-request-popup__actions"><SecondaryButton onClick={onReject} disabled={working === `remove:${person.relationshipId}`}>{t("friends.reject")}</SecondaryButton><ActionButton onClick={onAccept} disabled={working === `accept:${person.relationshipId}`}>{t("friends.accept")}</ActionButton></div></div></div>;
}

function FriendSection({ title, people, empty, onOpen, children }) {
  return <div><h2 className="mb-3 text-sm font-black text-[#15151b]">{title}</h2>{people.length ? <div className="grid gap-3 sm:grid-cols-2">{people.map((person, index) => <PersonCard key={person.slug} person={person} tone={["coral", "lime", "cyan"][index % 3]} onOpen={() => onOpen(person)}>{children(person)}</PersonCard>)}</div> : <p className="rounded-2xl border-2 border-dashed border-black/10 p-5 text-center text-xs font-semibold text-[#6b6b79]">{empty}</p>}</div>;
}

function ActionButton({ children, className = "", ...props }) {
  return <button type="button" {...props} className={`min-h-10 rounded-full bg-[#15151b] px-4 text-xs font-black text-white shadow-md transition-transform active:scale-95 disabled:opacity-50 ${className}`}>{children}</button>;
}

function SecondaryButton({ children, ...props }) {
  return <button type="button" {...props} className="min-h-10 rounded-full border-2 border-black/10 bg-white/70 px-4 text-xs font-black text-[#15151b] transition-transform active:scale-95 disabled:opacity-50">{children}</button>;
}

function ProfileDialog({ data, onClose, onAccept, onSend, working }) {
  const { t } = useTranslation();
  const { profile, relationship } = data;
  const details = [["work", profile.jobTitle], ["school", profile.education], ["interests", profile.hobbies], ["terminal", profile.skills], ["location_on", profile.address]].filter(([, value]) => value);
  return <div className="fixed inset-0 z-[300] grid place-items-end bg-black/60 p-0 backdrop-blur-sm sm:place-items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="friend-profile-title" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="friends-profile"><button type="button" onClick={onClose} className="friends-profile__close" aria-label={t("friends.close")}><span className="material-symbols-outlined">close</span></button><div className="text-center"><div className="friends-profile__avatar"><Avatar person={profile} size="h-24 w-24" /></div><h2 id="friend-profile-title" className="mt-3 text-2xl font-black text-[#15151b]">{profile.displayName}</h2><p className="text-sm font-bold text-[#666674]">@{profile.slug}</p>{profile.headline && <p className="mt-1 text-sm text-[#666674]">{profile.headline}</p>}{profile.friendsCount != null && <p className="mt-2 text-xs font-black text-[#15151b]">{t("friends.friendCount", { count: profile.friendsCount })}</p>}{profile.mutualFriendsCount > 0 && <span className="friends-chip friends-chip--violet mt-2">{t("friends.mutualFriends", { count: profile.mutualFriendsCount })}</span>}</div>{profile.bio && <p className="mt-5 whitespace-pre-line rounded-3xl bg-[#f1f1f6] p-4 text-sm leading-relaxed text-[#30303a]">{profile.bio}</p>}{details.length > 0 && <div className="mt-4 space-y-2">{details.map(([icon, value]) => <p key={icon} className="flex gap-3 text-sm text-[#30303a]"><span className="material-symbols-outlined text-xl text-[#777786]">{icon}</span><span>{value}</span></p>)}</div>}{profile.sharedLocation && <p className="mt-4 flex items-center gap-2 rounded-2xl bg-[#c7f7ff] p-3 text-xs font-black text-[#15151b]"><span className="material-symbols-outlined">location_on</span>{t(profile.sharedLocation.source === "ip" ? "friends.ipLocation" : "friends.approximatePin")}</p>}{profile.links?.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{profile.links.map((link) => <a key={`${link.label}:${link.url}`} href={link.url} target="_blank" rel="noreferrer" className="rounded-full border-2 border-black/10 px-3 py-2 text-xs font-black text-[#15151b]">{link.label || t("friends.link")}</a>)}</div>}<div className="mt-6 flex flex-wrap justify-center gap-2"><a href={`/bio/${encodeURIComponent(profile.slug)}`} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center rounded-full border-2 border-black/10 px-4 text-xs font-black text-[#15151b]">{t("friends.fullProfile")}</a>{!relationship && <ActionButton onClick={() => onSend(profile)} disabled={working === `send:${profile.slug}`}>{t("friends.add")}</ActionButton>}{relationship?.status === "pending" && relationship.direction === "incoming" && <ActionButton onClick={() => onAccept(relationship.id)} disabled={working === `accept:${relationship.id}`}>{t("friends.accept")}</ActionButton>}{relationship?.status === "accepted" && <a href="/member/utilities/arcade?game=chess&from=friends" className="inline-flex min-h-10 items-center rounded-full bg-[#15151b] px-4 text-xs font-black text-white">{t("friends.playChess")}</a>}</div></div></div>;
}
