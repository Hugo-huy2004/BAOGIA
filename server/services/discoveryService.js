// Discovery service — live nearby places for the "Khám phá" tab.
// Source priority (all real data, never fabricated):
//   1. Google Places API (New)  — GOOGLE_MAPS_API_KEY   (ratings, reviews, open-now)
//   2. Foursquare Places v3     — FOURSQUARE_API_KEY    (ratings, open-now; free tier)
//   3. OpenStreetMap Overpass   — no key needed          (places + opening_hours only;
//      ratings/reviews are null so the UI links out to Google instead of faking numbers)

const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY || '';
const FSQ_KEY = process.env.FOURSQUARE_API_KEY || '';
// ponytail: 1500m = "quanh bạn" đúng nghĩa; Overpass truncates results, so a
// wider radius paradoxically LOSES nearby places to far-away ones.
const RADIUS_M = 1500;

// Category → Google Places includedTypes / Overpass tag regexes
const CATEGORY_MAP = {
  food: {
    google: ['restaurant', 'meal_takeaway', 'meal_delivery', 'fast_food_restaurant'],
    overpass: 'restaurant|fast_food|food_court'
  },
  cafe: {
    google: ['cafe', 'coffee_shop', 'bakery', 'tea_house'],
    overpass: 'cafe|bar|pub|ice_cream'
  },
  play: {
    google: ['movie_theater', 'amusement_center', 'bowling_alley', 'karaoke', 'park', 'video_arcade'],
    overpass: 'cinema|theatre|nightclub|arts_centre'
  }
};
const ALL_GOOGLE_TYPES = [...new Set(Object.values(CATEGORY_MAP).flatMap(c => c.google))];

// ── Simple opening_hours parser (OSM) ────────────────────────────────────────
// Handles "24/7" and the common "Mo-Su 07:00-22:00; Sa-Su 08:00-23:00" shape,
// including overnight ranges. Returns true/false, or null when unparseable.
// ponytail: covers the overwhelmingly common patterns; full spec needs the
// opening_hours npm lib if users ever complain.
const OSM_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
export function isOpenNow(spec, now = new Date()) {
  if (!spec) return null;
  spec = spec.trim();
  if (spec === '24/7') return true;
  const day = OSM_DAYS[now.getDay()];
  const minutes = now.getHours() * 60 + now.getMinutes();
  let parsedAny = false;

  for (const rule of spec.split(';').map(r => r.trim()).filter(Boolean)) {
    const m = rule.match(/^([A-Za-z,\- ]+?)?\s*((?:\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2},?\s*)+)$/);
    if (!m) continue;
    const [, daysPart, timesPart] = m;

    let dayMatch = true;
    if (daysPart && daysPart.trim()) {
      dayMatch = false;
      for (const chunk of daysPart.split(',').map(c => c.trim())) {
        const range = chunk.match(/^([A-Za-z]{2})(?:-([A-Za-z]{2}))?$/);
        if (!range) continue;
        const from = OSM_DAYS.indexOf(range[1]);
        const to = OSM_DAYS.indexOf(range[2] || range[1]);
        if (from < 0 || to < 0) continue;
        const di = OSM_DAYS.indexOf(day);
        const inRange = from <= to ? di >= from && di <= to : di >= from || di <= to;
        if (inRange) { dayMatch = true; break; }
      }
    }
    parsedAny = true;
    if (!dayMatch) continue;

    for (const t of timesPart.split(',').map(s => s.trim()).filter(Boolean)) {
      const tm = t.match(/^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/);
      if (!tm) continue;
      const start = Number(tm[1]) * 60 + Number(tm[2]);
      const end = Number(tm[3]) * 60 + Number(tm[4]);
      const open = start <= end
        ? minutes >= start && minutes < end
        : minutes >= start || minutes < end; // overnight (22:00-02:00)
      if (open) return true;
    }
  }
  return parsedAny ? false : null;
}

// ── Google Places (New) ──────────────────────────────────────────────────────
const FIELD_MASK = [
  'places.id', 'places.displayName', 'places.location', 'places.rating',
  'places.userRatingCount', 'places.currentOpeningHours.openNow',
  'places.formattedAddress', 'places.priceLevel', 'places.googleMapsUri',
  'places.primaryType', 'places.reviews', 'places.websiteUri'
].join(',');

function googleCategoryOf(primaryType) {
  for (const [cat, def] of Object.entries(CATEGORY_MAP)) {
    if (def.google.includes(primaryType)) return cat;
  }
  return 'play';
}

const PRICE_LABELS = {
  PRICE_LEVEL_INEXPENSIVE: '₫', PRICE_LEVEL_MODERATE: '₫₫',
  PRICE_LEVEL_EXPENSIVE: '₫₫₫', PRICE_LEVEL_VERY_EXPENSIVE: '₫₫₫₫'
};

async function searchGoogle({ lat, lng, category, q }) {
  const url = q
    ? 'https://places.googleapis.com/v1/places:searchText'
    : 'https://places.googleapis.com/v1/places:searchNearby';
  const body = q
    ? {
        textQuery: q,
        locationBias: { circle: { center: { latitude: lat, longitude: lng }, radius: RADIUS_M } },
        maxResultCount: 20,
        languageCode: 'vi'
      }
    : {
        includedTypes: category && CATEGORY_MAP[category] ? CATEGORY_MAP[category].google : ALL_GOOGLE_TYPES,
        locationRestriction: { circle: { center: { latitude: lat, longitude: lng }, radius: RADIUS_M } },
        maxResultCount: 20,
        rankPreference: 'POPULARITY',
        languageCode: 'vi'
      };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_KEY,
      'X-Goog-FieldMask': FIELD_MASK
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`Google Places ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();

  return (data.places || []).map(p => ({
    id: p.id,
    name: p.displayName?.text || 'Địa điểm',
    category: googleCategoryOf(p.primaryType),
    lat: p.location?.latitude,
    lng: p.location?.longitude,
    rating: p.rating ?? null,
    ratingCount: p.userRatingCount ?? null,
    openNow: p.currentOpeningHours?.openNow ?? null,
    address: p.formattedAddress || '',
    priceRange: PRICE_LABELS[p.priceLevel] || '',
    review: p.reviews?.[0]?.text?.text?.slice(0, 220) || '',
    googleMapsUri: p.googleMapsUri || '',
    website: p.websiteUri || '',
    source: 'google'
  })).filter(p => p.lat && p.lng);
}

// ── Foursquare Places v3 ─────────────────────────────────────────────────────
// Category IDs from the FSQ v3 taxonomy (13000 Dining & Drinking umbrella,
// 10000 Arts & Entertainment umbrella). Rating is 0-10 → converted to /5.
const FSQ_CATEGORIES = {
  food: '13065',            // Restaurant
  cafe: '13032,13035',      // Café, Coffee Shop
  play: '10000',
  all: '13000,10000'
};

function fsqCategoryOf(cats) {
  const first = cats?.[0];
  if (!first) return 'play';
  if (String(first.id).startsWith('10')) return 'play';
  if (/caf|coffee|tea|bubble|juice|dessert/i.test(first.name || '')) return 'cafe';
  return 'food';
}

async function searchFoursquare({ lat, lng, category, q }) {
  const params = new URLSearchParams({
    ll: `${lat},${lng}`,
    radius: String(RADIUS_M),
    limit: '50',
    categories: FSQ_CATEGORIES[category] || FSQ_CATEGORIES.all,
    fields: 'fsq_id,name,geocodes,location,categories,distance,rating,stats,hours,website,price'
  });
  if (q) params.set('query', q);

  const res = await fetch(`https://api.foursquare.com/v3/places/search?${params}`, {
    headers: { Authorization: FSQ_KEY, 'Accept-Language': 'vi' }
  });
  if (!res.ok) throw new Error(`Foursquare ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();

  return (data.results || []).map(p => {
    const plat = p.geocodes?.main?.latitude;
    const plng = p.geocodes?.main?.longitude;
    return {
      id: `fsq-${p.fsq_id}`,
      name: p.name,
      category: fsqCategoryOf(p.categories),
      lat: plat,
      lng: plng,
      rating: p.rating != null ? Math.round((p.rating / 2) * 10) / 10 : null,
      ratingCount: p.stats?.total_ratings ?? null,
      openNow: p.hours?.open_now ?? null,
      address: p.location?.formatted_address || '',
      priceRange: p.price ? '₫'.repeat(p.price) : '',
      review: '',
      googleMapsUri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.name} ${plat},${plng}`)}`,
      website: p.website || '',
      source: 'foursquare'
    };
  }).filter(p => p.name && p.lat && p.lng);
}

// ── OpenStreetMap Overpass fallback ──────────────────────────────────────────
async function searchOverpass({ lat, lng, category, q }) {
  const amenity = category && CATEGORY_MAP[category]
    ? CATEGORY_MAP[category].overpass
    : Object.values(CATEGORY_MAP).map(c => c.overpass).join('|');
  const leisure = !category || category === 'play' ? 'park|playground|fitness_centre|bowling_alley' : null;
  const nameFilter = q ? `["name"~"${q.replace(/[^\p{L}\p{N} ]/gu, '')}", i]` : '';

  const query = `
    [out:json][timeout:15];
    (
      nwr["amenity"~"${amenity}"]["name"]${nameFilter}(around:${RADIUS_M},${lat},${lng});
      ${leisure ? `nwr["leisure"~"${leisure}"]["name"]${nameFilter}(around:${RADIUS_M},${lat},${lng});` : ''}
    );
    out center;
  `;
  const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`, {
    headers: { 'User-Agent': 'HugoStudio/1.0 (support@hugostudio.vn)' }
  });
  if (!res.ok) throw new Error(`Overpass ${res.status}`);
  const data = await res.json();

  return (data.elements || []).map(el => {
    const tags = el.tags || {};
    const plat = el.lat ?? el.center?.lat;
    const plng = el.lon ?? el.center?.lon;
    const amen = tags.amenity || '';
    let cat = 'play';
    if (/^(cafe|bar|pub|ice_cream)$/.test(amen)) cat = 'cafe';
    else if (/^(restaurant|fast_food|food_court)$/.test(amen)) cat = 'food';
    const addr = [tags['addr:housenumber'], tags['addr:street'], tags['addr:suburb'] || tags['addr:city']]
      .filter(Boolean).join(' ').trim();
    return {
      id: `osm-${el.type}-${el.id}`,
      name: tags.name,
      category: cat,
      lat: plat,
      lng: plng,
      rating: null,
      ratingCount: null,
      openNow: isOpenNow(tags.opening_hours),
      address: addr,
      priceRange: '',
      review: '',
      googleMapsUri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${tags.name} ${plat},${plng}`)}`,
      website: tags.website || tags['contact:website'] || '',
      source: 'osm'
    };
  }).filter(p => p.name && p.lat && p.lng);
}

// ── Cache (5-minute TTL, ~200m location grid) ────────────────────────────────
// ponytail: in-process Map cache; move to Redis if this ever runs multi-node.
const cache = new Map();
const TTL_MS = 5 * 60 * 1000;

export async function discoverPlaces({ lat, lng, category = '', q = '' }) {
  const key = `${lat.toFixed(3)},${lng.toFixed(3)},${category},${q.toLowerCase().trim()}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.data;

  let places;
  let source = 'osm';
  if (GOOGLE_KEY) {
    try {
      places = await searchGoogle({ lat, lng, category, q });
      source = 'google';
    } catch (err) {
      console.warn('[Discovery] Google Places failed:', err.message);
    }
  }
  if (!places && FSQ_KEY) {
    try {
      places = await searchFoursquare({ lat, lng, category, q });
      source = 'foursquare';
    } catch (err) {
      console.warn('[Discovery] Foursquare failed:', err.message);
    }
  }
  if (!places) places = await searchOverpass({ lat, lng, category, q });

  const data = { places, source };
  if (cache.size > 200) cache.clear();
  cache.set(key, { at: Date.now(), data });
  return data;
}
