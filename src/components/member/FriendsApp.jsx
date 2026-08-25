import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { notify } from "../../lib/notify";
import { getCachedGeolocation } from "../../utils/geoCache";

const API = "/api/friends";
const LOCATION_ASKED_KEY = "hugo:friends:location-asked:v1";
const LOCATION_GRANTED_KEY = "hugo:pwa:location-granted:v1";

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

function Avatar({ person, size = "h-12 w-12" }) {
  return person.avatarUrl ? (
    <img src={person.avatarUrl} alt="" className={`${size} shrink-0 rounded-full object-cover bg-muted`} />
  ) : (
    <span className={`${size} shrink-0 rounded-full bg-muted grid place-items-center text-sm font-black text-muted-foreground`} aria-hidden="true">
      {initials(person.displayName)}
    </span>
  );
}

function PersonCard({ person, children, onOpen }) {
  const { t } = useTranslation();
  return (
    <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <button type="button" onClick={onOpen} className="flex w-full min-w-0 items-center gap-3 text-left rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
        <Avatar person={person} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-black text-foreground">{person.displayName}</span>
          <span className="block truncate text-xs text-muted-foreground">{person.headline || `@${person.slug}`}</span>
          {person.distanceKm != null && (
            <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
              <span className="material-symbols-outlined text-sm" aria-hidden="true">near_me</span>
              {t("friends.distance", { count: person.distanceKm })}
            </span>
          )}
          {person.mutualFriendsCount > 0 && <span className="mt-1 block text-[11px] font-semibold text-primary">{t("friends.mutualFriends", { count: person.mutualFriendsCount })}</span>}
        </span>
      </button>
      {children && <div className="mt-3 flex flex-wrap justify-end gap-2">{children}</div>}
    </article>
  );
}

function Empty({ icon, title, body }) {
  return (
    <div className="rounded-3xl border border-dashed border-border px-5 py-12 text-center">
      <span className="material-symbols-outlined text-4xl text-muted-foreground" aria-hidden="true">{icon}</span>
      <p className="mt-3 text-sm font-black text-foreground">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

export default function FriendsApp({ onBack }) {
  const { t } = useTranslation();
  const requestedView = new URLSearchParams(window.location.search).get("view");
  const [view, setView] = useState(["friends", "requests", "map"].includes(requestedView) ? requestedView : "discover");
  const [snapshot, setSnapshot] = useState({ friends: [], incoming: [], outgoing: [], settings: { discoverable: false, hasLocation: false, shareLocation: false } });
  const [people, setPeople] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState("");
  const [profile, setProfile] = useState(null);
  const [locationBlocked, setLocationBlocked] = useState(false);
  const autoLocationStarted = useRef(false);

  const loadSnapshot = useCallback(async () => {
    const result = await api();
    setSnapshot(result);
    return result;
  }, []);

  const discover = useCallback(async (search = "") => {
    const result = await api(`/discover${search.trim() ? `?q=${encodeURIComponent(search.trim())}` : ""}`);
    setPeople(result.people || []);
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([loadSnapshot(), discover()])
      .catch(() => active && notify.error(t("friends.errors.load")))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [discover, loadSnapshot, t]);

  const refresh = async () => {
    await Promise.all([loadSnapshot(), discover(query)]);
  };

  const act = async (key, request, successKey) => {
    setWorking(key);
    try {
      await request();
      notify.success(t(successKey));
      await refresh();
    } catch {
      notify.error(t("friends.errors.action"));
    } finally {
      setWorking("");
    }
  };

  const openProfile = async (person) => {
    setWorking(`profile:${person.slug}`);
    try {
      setProfile(await api(`/users/${encodeURIComponent(person.slug)}`));
    } catch {
      notify.error(t("friends.errors.profile"));
    } finally {
      setWorking("");
    }
  };

  const search = async (event) => {
    event.preventDefault();
    if (query.trim() && query.trim().length < 2) {
      notify.info(t("friends.searchTooShort"));
      return;
    }
    setWorking("search");
    try {
      await discover(query);
    } catch {
      notify.error(t("friends.errors.search"));
    } finally {
      setWorking("");
    }
  };

  const syncNearby = useCallback(async ({ fresh = false, notifySuccess = false } = {}) => {
    setWorking("nearby");
    let positionReady = false;
    try {
      let permission = localStorage.getItem(LOCATION_GRANTED_KEY) === "true" ? "granted" : "prompt";
      try {
        const status = await navigator.permissions?.query({ name: "geolocation" });
        if (status) permission = status.state;
      } catch {
        // Safari uses the successful-read marker above because Permissions API may be unavailable.
      }
      const asked = localStorage.getItem(LOCATION_ASKED_KEY) === "true";
      if (permission === "denied" || (permission === "prompt" && asked)) {
        setLocationBlocked(true);
        return;
      }
      if (permission === "prompt") localStorage.setItem(LOCATION_ASKED_KEY, "true");
      const position = await getCachedGeolocation({ fresh, ask: permission === "prompt" });
      positionReady = true;
      localStorage.setItem(LOCATION_GRANTED_KEY, "true");
      const result = await api("/discover/nearby", {
        method: "POST",
        body: JSON.stringify({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          share: true,
        }),
      });
      setPeople(result.people || []);
      setSnapshot((current) => ({ ...current, settings: result.settings }));
      setLocationBlocked(false);
      if (notifySuccess) notify.success(t("friends.nearbyEnabled"));
    } catch {
      if (!positionReady) setLocationBlocked(true);
      if (notifySuccess) notify.error(t(positionReady ? "friends.errors.search" : "friends.errors.location"));
    } finally {
      setWorking("");
    }
  }, [t]);

  useEffect(() => {
    if (loading || autoLocationStarted.current) return;
    autoLocationStarted.current = true;
    syncNearby();
  }, [loading, syncNearby]);

  const findNearby = () => {
    if (locationBlocked) {
      notify.info(t("friends.errors.locationSettings"));
      return;
    }
    syncNearby({ fresh: true, notifySuccess: true });
  };

  const toggleLocationSharing = async () => {
    const shareLocation = !snapshot.settings.shareLocation;
    setWorking("location-sharing");
    try {
      const settings = await api("/settings", { method: "PATCH", body: JSON.stringify({ shareLocation }) });
      setSnapshot((current) => ({ ...current, settings }));
      await loadSnapshot();
      notify.success(t(shareLocation ? "friends.locationSharingOn" : "friends.locationSharingOff"));
    } catch {
      notify.error(t(snapshot.settings.hasLocation ? "friends.errors.action" : "friends.errors.locationRequired"));
    } finally {
      setWorking("");
    }
  };

  const toggleDiscovery = async () => {
    const discoverable = !snapshot.settings.discoverable;
    setWorking("settings");
    try {
      const settings = await api("/settings", { method: "PATCH", body: JSON.stringify({ discoverable }) });
      setSnapshot((current) => ({ ...current, settings }));
      notify.success(t(discoverable ? "friends.discoveryOn" : "friends.discoveryOff"));
    } catch {
      notify.error(t("friends.errors.action"));
    } finally {
      setWorking("");
    }
  };

  const sendRequest = (person) => act(
    `send:${person.slug}`,
    () => api(`/requests/${encodeURIComponent(person.slug)}`, { method: "POST" }),
    "friends.sent",
  );
  const accept = (id) => act(`accept:${id}`, () => api(`/${id}/accept`, { method: "PATCH" }), "friends.accepted");
  const remove = (id, successKey = "friends.removed") => act(`remove:${id}`, () => api(`/${id}`, { method: "DELETE" }), successKey);

  const discoveryAction = (person) => {
    const relation = person.relationship;
    if (!relation) return <ActionButton onClick={() => sendRequest(person)} disabled={working === `send:${person.slug}`}>{t("friends.add")}</ActionButton>;
    if (relation.status === "accepted") return <span className="px-3 py-2 text-xs font-bold text-muted-foreground">{t("friends.alreadyFriends")}</span>;
    if (relation.status === "pending" && relation.direction === "incoming") {
      return <ActionButton onClick={() => accept(relation.id)} disabled={working === `accept:${relation.id}`}>{t("friends.accept")}</ActionButton>;
    }
    if (relation.status === "pending") return <span className="px-3 py-2 text-xs font-bold text-muted-foreground">{t("friends.pending")}</span>;
    return <span className="px-3 py-2 text-xs font-bold text-muted-foreground">{t("friends.declined")}</span>;
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-3 py-4 sm:px-6 sm:py-6">
      <header className="flex items-center gap-3">
        <button type="button" onClick={onBack} className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-border bg-card text-foreground hover:bg-muted" aria-label={t("friends.back")}>
          <span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-black text-foreground">{t("friends.title")}</h1>
          <p className="text-xs text-muted-foreground">{t("friends.subtitle")}</p>
        </div>
      </header>

      <nav className="mt-5 grid grid-cols-4 rounded-2xl bg-muted p-1" aria-label={t("friends.sections")}>
        {[
          ["discover", "person_search", t("friends.tabs.discover")],
          ["requests", "person_add", `${t("friends.tabs.requests")} (${snapshot.incoming.length})`],
          ["friends", "group", `${t("friends.tabs.friends")} (${snapshot.friends.length})`],
          ["map", "map", t("friends.tabs.map")],
        ].map(([id, icon, label]) => (
          <button key={id} type="button" onClick={() => setView(id)} className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[10px] font-black transition-colors sm:min-h-11 sm:flex-row sm:gap-1 sm:px-2 sm:text-xs ${view === id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            <span className="material-symbols-outlined text-lg" aria-hidden="true">{icon}</span><span className="max-w-full truncate">{label}</span>
          </button>
        ))}
      </nav>

      {loading ? (
        <div className="grid min-h-64 place-items-center"><span className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" /></div>
      ) : view === "discover" ? (
        <section className="mt-5 space-y-4">
          <form onSubmit={search} className="flex gap-2">
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">{t("friends.search")}</span>
              <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xl text-muted-foreground" aria-hidden="true">search</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("friends.searchPlaceholder")} className="min-h-11 w-full rounded-xl border border-border bg-card pl-10 pr-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary" />
            </label>
            <ActionButton type="submit" disabled={working === "search"}>{t("friends.search")}</ActionButton>
          </form>

          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <span className="material-symbols-outlined text-2xl text-muted-foreground" aria-hidden="true">location_on</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-foreground">{t("friends.nearbyTitle")}</p>
                <p className="text-xs leading-relaxed text-muted-foreground">{t(locationBlocked ? "friends.locationPermissionBlocked" : "friends.nearbyPrivacy")}</p>
              </div>
              <button type="button" onClick={findNearby} disabled={working === "nearby"} className="min-h-11 rounded-xl border border-border px-4 text-xs font-black text-foreground hover:bg-muted disabled:opacity-50">
                {t(snapshot.settings.hasLocation ? "friends.refreshNearby" : "friends.findNearby")}
              </button>
            </div>
            <label className="mt-4 flex cursor-pointer items-center justify-between gap-4 border-t border-border pt-4">
              <span className="text-xs font-semibold text-muted-foreground">{t("friends.discoverable")}</span>
              <input type="checkbox" checked={snapshot.settings.discoverable} onChange={toggleDiscovery} disabled={working === "settings"} className="h-5 w-5 accent-primary" />
            </label>
            <label className={`mt-4 flex items-start justify-between gap-4 border-t border-border pt-4 ${snapshot.settings.hasLocation ? "cursor-pointer" : "opacity-55"}`}>
              <span>
                <span className="block text-xs font-semibold text-foreground">{t("friends.shareLocation")}</span>
                <span className="mt-1 block text-[11px] leading-relaxed text-muted-foreground">{t("friends.shareLocationPrivacy")}</span>
              </span>
              <input type="checkbox" checked={snapshot.settings.shareLocation} onChange={toggleLocationSharing} disabled={!snapshot.settings.hasLocation || working === "location-sharing"} className="mt-0.5 h-5 w-5 shrink-0 accent-primary" />
            </label>
          </div>

          {people.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {people.map((person) => <PersonCard key={person.slug} person={person} onOpen={() => openProfile(person)}>{discoveryAction(person)}</PersonCard>)}
            </div>
          ) : <Empty icon="person_search" title={t("friends.emptyDiscoverTitle")} body={t("friends.emptyDiscoverBody")} />}
        </section>
      ) : view === "requests" ? (
        <section className="mt-5 space-y-6">
          <FriendSection title={t("friends.incoming")} people={snapshot.incoming} empty={t("friends.noIncoming")} onOpen={openProfile}>
            {(person) => <><ActionButton onClick={() => accept(person.relationshipId)} disabled={working === `accept:${person.relationshipId}`}>{t("friends.accept")}</ActionButton><SecondaryButton onClick={() => remove(person.relationshipId, "friends.declinedToast")}>{t("friends.reject")}</SecondaryButton></>}
          </FriendSection>
          <FriendSection title={t("friends.outgoing")} people={snapshot.outgoing} empty={t("friends.noOutgoing")} onOpen={openProfile}>
            {(person) => <SecondaryButton onClick={() => remove(person.relationshipId, "friends.cancelled")}>{t("friends.cancelRequest")}</SecondaryButton>}
          </FriendSection>
        </section>
      ) : view === "map" ? (
        <FriendMap
          friends={snapshot.friends}
          sharing={snapshot.settings.shareLocation}
          onOpen={openProfile}
          onSetup={() => setView("discover")}
        />
      ) : (
        <section className="mt-5">
          {snapshot.friends.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {snapshot.friends.map((person) => (
                <PersonCard key={person.slug} person={person} onOpen={() => openProfile(person)}>
                  <SecondaryButton onClick={() => remove(person.relationshipId)}>{t("friends.unfriend")}</SecondaryButton>
                </PersonCard>
              ))}
            </div>
          ) : <Empty icon="group" title={t("friends.emptyFriendsTitle")} body={t("friends.emptyFriendsBody")} />}
        </section>
      )}

      {profile && <ProfileDialog data={profile} onClose={() => setProfile(null)} onAccept={(id) => { setProfile(null); accept(id); }} onSend={(person) => { setProfile(null); sendRequest(person); }} working={working} />}
    </div>
  );
}

function FriendMap({ friends, sharing, onOpen, onSetup }) {
  const { t } = useTranslation();
  const visible = friends.filter((friend) => friend.sharedLocation);
  return (
    <section className="mt-5 space-y-4">
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-2xl text-primary" aria-hidden="true">privacy_tip</span>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-black text-foreground">{t("friends.mapTitle")}</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("friends.mapPrivacy")}</p>
          </div>
          {!sharing && <SecondaryButton onClick={onSetup}>{t("friends.enableSharing")}</SecondaryButton>}
        </div>
      </div>
      {visible.length
        ? <div className="grid gap-4 sm:grid-cols-2">{visible.map((friend) => <FriendMapCard key={friend.slug} friend={friend} onOpen={() => onOpen(friend)} />)}</div>
        : <Empty icon="location_off" title={t("friends.emptyMapTitle")} body={t(sharing ? "friends.emptyMapBody" : "friends.mapSharingRequired")} />}
    </section>
  );
}

function FriendMapCard({ friend, onOpen }) {
  const { t } = useTranslation();
  const { lat, lng } = friend.sharedLocation;
  const delta = 0.012;
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - delta}%2C${lat - delta}%2C${lng + delta}%2C${lat + delta}&layer=mapnik&marker=${lat}%2C${lng}`;
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <iframe title={t("friends.friendMapTitle", { name: friend.displayName })} className="h-52 w-full border-0" loading="lazy" referrerPolicy="no-referrer" src={mapUrl} />
      <button type="button" onClick={onOpen} disabled={!onOpen} className="flex w-full items-center gap-3 p-4 text-left hover:bg-muted disabled:cursor-default disabled:hover:bg-transparent">
        <Avatar person={friend} />
        <span className="min-w-0 flex-1"><strong className="block truncate text-sm text-foreground">{friend.displayName}</strong><span className="block text-xs text-muted-foreground">{t("friends.approximateLocation")}</span></span>
        {onOpen && <span className="material-symbols-outlined text-muted-foreground" aria-hidden="true">chevron_right</span>}
      </button>
    </article>
  );
}

function FriendSection({ title, people, empty, onOpen, children }) {
  return (
    <div>
      <h2 className="mb-3 text-sm font-black text-foreground">{title}</h2>
      {people.length ? <div className="grid gap-3 sm:grid-cols-2">{people.map((person) => <PersonCard key={person.slug} person={person} onOpen={() => onOpen(person)}>{children(person)}</PersonCard>)}</div> : <p className="rounded-2xl border border-dashed border-border p-5 text-center text-xs text-muted-foreground">{empty}</p>}
    </div>
  );
}

function ActionButton({ children, className = "", ...props }) {
  return <button type="button" {...props} className={`min-h-10 rounded-xl bg-foreground px-4 text-xs font-black text-background hover:opacity-90 disabled:opacity-50 ${className}`}>{children}</button>;
}

function SecondaryButton({ children, ...props }) {
  return <button type="button" {...props} className="min-h-10 rounded-xl border border-border px-4 text-xs font-black text-foreground hover:bg-muted disabled:opacity-50">{children}</button>;
}

function ProfileDialog({ data, onClose, onAccept, onSend, working }) {
  const { t } = useTranslation();
  const { profile, relationship } = data;
  const details = [
    ["work", profile.jobTitle],
    ["school", profile.education],
    ["interests", profile.hobbies],
    ["terminal", profile.skills],
    ["location_on", profile.address],
  ].filter(([, value]) => value);
  return (
    <div className="fixed inset-0 z-[260] grid place-items-end bg-black/55 p-0 sm:place-items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="friend-profile-title" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="max-h-[90dvh] w-full overflow-y-auto rounded-t-3xl border border-border bg-card p-5 shadow-2xl sm:max-w-lg sm:rounded-3xl">
        <div className="flex justify-end"><button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full hover:bg-muted" aria-label={t("friends.close")}><span className="material-symbols-outlined">close</span></button></div>
        <div className="text-center">
          <div className="mx-auto w-fit rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-fuchsia-600 p-1">
            <div className="rounded-full bg-card p-1"><Avatar person={profile} size="h-24 w-24" /></div>
          </div>
          <h2 id="friend-profile-title" className="mt-3 text-xl font-black text-foreground">{profile.displayName}</h2>
          <p className="text-sm font-semibold text-muted-foreground">@{profile.slug}</p>
          {profile.headline && <p className="mt-1 text-sm text-muted-foreground">{profile.headline}</p>}
          {profile.friendsCount != null && <p className="mt-1 text-xs font-semibold text-muted-foreground">{t("friends.friendCount", { count: profile.friendsCount })}</p>}
          {profile.mutualFriendsCount > 0 && <p className="mt-1 text-xs font-bold text-primary">{t("friends.mutualFriends", { count: profile.mutualFriendsCount })}</p>}
        </div>
        {profile.bio && <p className="mt-5 whitespace-pre-line rounded-2xl bg-muted p-4 text-sm leading-relaxed text-foreground">{profile.bio}</p>}
        {details.length > 0 && <div className="mt-4 space-y-2">{details.map(([icon, value]) => <p key={icon} className="flex gap-3 text-sm text-foreground"><span className="material-symbols-outlined text-xl text-muted-foreground" aria-hidden="true">{icon}</span><span>{value}</span></p>)}</div>}
        {profile.sharedLocation && <div className="mt-4"><FriendMapCard friend={profile} /></div>}
        {profile.links?.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{profile.links.map((link) => <a key={`${link.label}:${link.url}`} href={link.url} target="_blank" rel="noreferrer" className="rounded-full border border-border px-3 py-2 text-xs font-bold text-foreground hover:bg-muted">{link.label || t("friends.link")}</a>)}</div>}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <a href={`/bio/${encodeURIComponent(profile.slug)}`} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center rounded-xl border border-border px-4 text-xs font-black text-foreground hover:bg-muted">{t("friends.fullProfile")}</a>
          {!relationship && <ActionButton onClick={() => onSend(profile)} disabled={working === `send:${profile.slug}`}>{t("friends.add")}</ActionButton>}
          {relationship?.status === "pending" && relationship.direction === "incoming" && <ActionButton onClick={() => onAccept(relationship.id)} disabled={working === `accept:${relationship.id}`}>{t("friends.accept")}</ActionButton>}
          {relationship?.status === "accepted" && <a href="/member/utilities/arcade?game=chess&from=friends" className="inline-flex min-h-10 items-center rounded-xl bg-foreground px-4 text-xs font-black text-background hover:opacity-90">{t("friends.playChess")}</a>}
        </div>
      </div>
    </div>
  );
}
