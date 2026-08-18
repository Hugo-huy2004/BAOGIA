import CinemaMovie from '../models/CinemaMovie.js';

/**
 * Thư viện Hugo Cinema — phim thật, lấy metadata thật từ Internet Archive.
 *
 * Toàn bộ phim ở đây là phim KHÔNG CÒN BẢN QUYỀN (public domain) hoặc phim mở
 * theo giấy phép CC-BY, nên cho cả cộng đồng xem là hợp pháp. Danh sách được
 * chọn tay chứ không quét theo bộ sưu tập: Internet Archive để người dùng tự
 * gắn nhãn "public domain", nhãn đó sai khá nhiều (Frankenstein 1931 của
 * Universal vẫn còn bản quyền mà vẫn bị gắn PD), và xếp theo lượt tải thì lọt
 * cả phim khai thác tình dục — cả hai đều không được phép có trong một portal
 * 14+. Mỗi id dưới đây là một bản phim có tình trạng công cộng đã rõ:
 *
 *   • phim câm / phim trước 1929 (Nosferatu, Caligari, Phantom of the Opera…);
 *   • phim Mỹ mất bản quyền do thiếu ghi chú hoặc không gia hạn (His Girl
 *     Friday, Night of the Living Dead, Plan 9, Carnival of Souls…);
 *   • phim ngắn Chaplin thời Keystone/Essanay/Mutual 1914–1917;
 *   • phim tài liệu Prelinger và phim của cơ quan liên bang Mỹ (NASA);
 *   • phim mở 3D của Blender Foundation (CC-BY).
 *
 * Thêm phim mới = thêm một dòng vào PUBLIC_DOMAIN_FILMS rồi chạy
 * `node server/scripts/syncCinema.mjs`. Không tự bịa metadata: id nào Internet
 * Archive không trả về file video thì sync bỏ qua, không lưu bản ghi rỗng.
 */

const SEARCH_URL = 'https://archive.org/advancedsearch.php';
const META_URL = 'https://archive.org/metadata';
const DOWNLOAD_URL = 'https://archive.org/download';
const THUMB_URL = 'https://archive.org/services/img';
const DETAILS_URL = 'https://archive.org/details';

export const PUBLIC_DOMAIN_FILMS = [
  // ── Kinh điển: Chaplin, Keaton, Three Stooges, phim Mỹ mất bản quyền ──
  { id: 'CC_1915_10_04_CharlieShanghaied', category: 'classic' },
  { id: 'CC_1914_08_31_TheGoodforNothing', category: 'classic' },
  { id: 'CC_1916_10_02_ThePawnshop', category: 'classic' },
  { id: 'CC_1916_09_04_TheCount', category: 'classic' },
  { id: 'CC_1916_05_15_TheFloorwalker', category: 'classic' },
  { id: 'CC_1916_12_04_TheRink', category: 'classic' },
  { id: 'CC_1917_04_16_TheCure', category: 'classic' },
  { id: 'charlie_chaplin_film_fest', category: 'classic' },
  { id: 'The_General_Buster_Keaton', category: 'classic' },
  { id: 'disorder_in_the_court', category: 'classic' },
  { id: 'his_girl_friday', category: 'classic' },
  { id: 'TheStranger_0', category: 'classic' },
  { id: 'suddenly', category: 'classic' },
  { id: 'dressed_to_kill', category: 'classic' },
  { id: 'angel_on_my_shoulder', category: 'classic' },
  { id: 'abraham_lincoln', category: 'classic' },

  // ── Kinh điển MÀU (Technicolor) — bản in nét nhất tìm được trên Internet Archive ──
  { id: 'AStarIsBorn1937FullHDMovie', category: 'classic' },
  { id: 'NothingSacredVideoQualityUpgrade', category: 'classic' },
  { id: 'JungleBook', category: 'classic' },
  { id: 'TheLittlePrincess1939', category: 'classic' },
  { id: 'royal_wedding', category: 'classic' },
  { id: 'Kilimanjaro', category: 'classic' },
  { id: 'the-outlaw-1943-western-old-movie', category: 'classic' },
  { id: 'meet_john_doe', category: 'classic' },
  { id: 'penny_serenade', category: 'classic' },
  { id: 'MyFavoriteBrunette1947', category: 'classic' },
  // Charade (1963) mất bản quyền vì bản chiếu rạp thiếu ghi chú © — bản 720p màu.
  { id: 'charade-1963-cary-grant-audrey-hepburn-comedy-mystery-romance-thriller-full-movie', category: 'classic' },
  { id: 'cco_thegunandthepulpit', category: 'classic' },

  // ── Kinh dị công cộng ──
  { id: 'Night.Of.The.Living.Dead_1080p', category: 'horror' },
  { id: 'Nosferatu_DVD_quality', category: 'horror' },
  { id: 'DasKabinettdesDoktorCaligariTheCabinetofDrCaligari', category: 'horror' },
  { id: 'ThePhantomoftheOpera', category: 'horror' },
  { id: 'CarnivalofSouls', category: 'horror' },
  { id: 'The_House_On_Haunted_Hill', category: 'horror' },
  { id: 'TheGhoul', category: 'horror' },
  { id: 'The_Little_Shop_of_Horrors.mpeg', category: 'horror' },

  // ── Khoa học viễn tưởng MÀU ──
  { id: 'ATripToTheMoon20Fps', category: 'scifi' },
  { id: 'lost_world', category: 'scifi' },
  { id: '20000LeaguesUndertheSea', category: 'scifi' },
  { id: 'plan-9-from-outer-space', category: 'scifi' },
  { id: 'the-last-man-on-earth-1964_20251031', category: 'scifi' },
  { id: 'Eegah', category: 'scifi' },
  { id: 'LastWonanOnEarthColor', category: 'scifi' },
  { id: 'SantaClausConquerstheMartians1964', category: 'scifi' },
  { id: 'TheBrainThatWouldNotDie1962', category: 'scifi' },
  { id: 'FirstSpaceshipOnVenusMPEG', category: 'scifi' },

  // ── Hoạt hình kinh điển (Fleischer: Superman & Betty Boop đã hết bản quyền) ──
  { id: 'superman_1941', category: 'cartoon' },
  { id: 'bb_snow_white', category: 'cartoon' },
  { id: 'bb_minnie_the_moocher', category: 'cartoon' },

  // ── Phim ngắn 3D mở của Blender Foundation (CC-BY 4K/1080p Màu) ──
  { id: 'big-buck-bunny-4k', category: 'shorts' },
  { id: 'Sintel', category: 'shorts' },
  { id: 'elephants-dream', category: 'shorts' },
  { id: 'GlassHalf1080p', category: 'shorts' },
  { id: 'Tears-of-Steel', category: 'shorts' },
  { id: 'Sita_Sings_the_Blues', category: 'shorts' },
  { id: 'CosmosLaundromatFirstCycle', category: 'shorts' },
  { id: 'sprite-fright', category: 'shorts' },
  { id: 'wing_it', category: 'shorts' },
  { id: 'agent327operationbarbershop', category: 'shorts' },
  { id: 'Caminandes1LlamaDrama', category: 'shorts' },
  { id: 'Caminandes2GranDillama', category: 'shorts' },
  { id: 'CaminandesLlamigos', category: 'shorts' },
  // Bản 4K (3840×1608) của Blender Studio — phim nét nhất trong kho.
  { id: 'charge-blender-open-movie-1608p', category: 'shorts' },
  { id: 'springblenderopenmoviedownloadlagump3.com', category: 'shorts' },
  { id: 'GulliversTravels1939_201509', category: 'cartoon' },
  { id: 'popeye-meets-sinbad', category: 'cartoon' },

  // ── Tài liệu: Prelinger Archives & phim NASA ──
  { id: 'Apollo1116mmOnboardFilm', category: 'doc' },
  { id: 'Apollo15And1616mmOnboardFilm', category: 'doc' },
  { id: 'MercurygeminiapolloOverview', category: 'doc' },
  { id: 'DuckandC1951', category: 'doc' },
  { id: 'Despotis1946', category: 'doc' },
  { id: 'Operatio1955', category: 'doc' },
];

/** Fetch JSON có timeout + thử lại: Internet Archive hay treo kết nối lẻ. */
async function fetchJson(url, tries = 3) {
  for (let attempt = 1; attempt <= tries; attempt += 1) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (error) {
      if (attempt === tries) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
    }
  }
  return null;
}

/**
 * Thời lượng ra giây. Internet Archive ghi thời lượng mỗi item một kiểu:
 * "1:31:44", "51:56", "108 min", "89 min.", và file derivative thì ghi
 * `length` là số giây thập phân ("596.5").
 */
export function parseRuntimeSeconds(raw) {
  const text = String(raw ?? '').trim();
  if (!text) return 0;

  const clock = text.match(/^(\d+):([0-5]?\d)(?:[:.]([0-5]?\d))?/);
  if (clock) {
    const [, first, second, third] = clock;
    return third !== undefined
      ? Number(first) * 3600 + Number(second) * 60 + Number(third)
      : Number(first) * 60 + Number(second);
  }

  const minutes = text.match(/(\d+(?:\.\d+)?)\s*(?:min|phút)/i);
  if (minutes) return Math.round(Number(minutes[1]) * 60);

  const seconds = Number(text);
  return Number.isFinite(seconds) && seconds > 0 ? Math.round(seconds) : 0;
}

/** "1h 31m" / "16m" — chỉ dựng từ thời lượng thật, không có thì để rỗng. */
export function formatDuration(totalSeconds) {
  if (!totalSeconds) return '';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.round((totalSeconds % 3600) / 60);
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
}

/**
 * Chọn file phát: BẢN NÉT TRƯỚC.
 *
 * Bản trước lấy derivative "*_512kb.mp4" làm nguồn chính cho nhẹ, nhưng 512kb
 * trên màn hình điện thoại ngày nay là mờ, mà cái làm phim đứng máy ở Việt Nam
 * không phải bitrate — là chặng mạng tới máy dữ liệu của Internet Archive (xem
 * workers/media-proxy). Nên nguồn chính là bản gốc (thường 720p), bản 512kb
 * giữ làm đường lùi khi mạng yếu; client tự đổi khi bản nét không chạy nổi.
 */
export function pickVideoFiles(files = []) {
  const videos = files.filter((f) => /\.(mp4|m4v|webm|ogv)$/i.test(f.name || ''));
  if (!videos.length) return null;

  const mp4 = videos.filter((f) => /\.(mp4|m4v)$/i.test(f.name));
  const pool = mp4.length ? mp4 : videos;
  // Xếp theo SỐ ĐIỂM ẢNH trước, dung lượng chỉ để phân giải hoà: một bản 1080p
  // nén tốt có thể nhẹ hơn một bản 480p quét từ băng, mà nét hơn hẳn.
  const pixels = (f) => (Number(f.width) || 0) * (Number(f.height) || 0);
  const ranked = [...pool].sort((a, b) => pixels(b) - pixels(a) || (Number(b.size) || 0) - (Number(a.size) || 0));
  const sized = ranked.filter((f) => pixels(f) > 0);

  // Trần 1080p. Bản 4K của Big Buck Bunny nặng 2.8GB cho 10 phút — trên điện
  // thoại nó không đẹp hơn, chỉ đứng hình lâu hơn. Item nào chỉ có bản trên
  // 1080p thì lấy bản nhỏ nhất trong số đó.
  const underCeiling = sized.filter((f) => (Number(f.height) || 0) <= 1080);
  const hd = underCeiling[0] || sized[sized.length - 1] || ranked[0];
  const light = pool.find((f) => /512kb\.(mp4|m4v)$/i.test(f.name)) || ranked[ranked.length - 1];

  return { primary: hd, fallback: light === hd ? null : light };
}

/**
 * Ảnh cho màn hero. `services/img/<id>` chỉ trả 180×124 — đủ cho thẻ phim
 * nhưng phóng lên nửa màn hình thì nhoè. Hầu hết item của Internet Archive có
 * kèm một ảnh GIF động cắt từ chính bộ phim (200–450KB): dùng nó làm ảnh nền
 * hero, vừa nét hơn vừa động như trang chủ Netflix. Ảnh trong `*.thumbs/` bị
 * loại — đó là khung xem trước 160px.
 */
export function pickPreview(files = []) {
  const gif = files.find((f) => /\.gif$/i.test(f.name || "") && !f.name.includes(".thumbs/"));
  if (gif) return gif.name;

  const stills = files
    .filter((f) => /\.(jpe?g|png)$/i.test(f.name || '') && !f.name.includes('.thumbs/') && !f.name.startsWith('__ia_thumb'))
    .sort((a, b) => (Number(b.size) || 0) - (Number(a.size) || 0));
  return stills[0] && Number(stills[0].size) > 20000 ? stills[0].name : '';
}

/** Mô tả của Internet Archive là HTML — bỏ thẻ, giữ chữ. */
export function plainText(html, limit = 1400) {
  const text = String(html || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/[ \t]+/g, ' ')
    .replace(/[ \t]*\n[ \t]*/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return text.length > limit ? `${text.slice(0, limit).trimEnd()}…` : text;
}

const first = (value) => (Array.isArray(value) ? value[0] : value);
const list = (value) => (Array.isArray(value) ? value : value ? [value] : []);

/**
 * Lượt xem + điểm đánh giá thật chỉ có ở API tìm kiếm (không có trong
 * /metadata), nên lấy một lượt cho cả lô thay vì mỗi phim một request.
 */
async function fetchStats(ids) {
  const stats = new Map();
  const fields = ['identifier', 'downloads', 'avg_rating', 'num_reviews'];

  for (let i = 0; i < ids.length; i += 20) {
    const chunk = ids.slice(i, i + 20);
    const query = `identifier:(${chunk.join(' OR ')})`;
    const url = `${SEARCH_URL}?q=${encodeURIComponent(query)}&${fields
      .map((f) => `fl%5B%5D=${f}`)
      .join('&')}&rows=${chunk.length}&page=1&output=json`;

    try {
      const json = await fetchJson(url);
      for (const doc of json?.response?.docs || []) {
        stats.set(doc.identifier, {
          views: Number(doc.downloads) || 0,
          rating: Number(doc.avg_rating) || 0,
          reviews: Number(doc.num_reviews) || 0,
        });
      }
    } catch {
      // Không có số liệu thì phim vẫn lên kệ, chỉ là không hiện lượt xem.
    }
  }

  return stats;
}

/** Một item Internet Archive → bản ghi CinemaMovie, hoặc null nếu không phát được. */
export async function buildMovieDoc(film, stats = {}) {
  const json = await fetchJson(`${META_URL}/${film.id}`);
  const meta = json?.metadata;
  if (!meta) return null;

  const picked = pickVideoFiles(json.files || []);
  if (!picked?.primary) return null;

  const durationSeconds =
    parseRuntimeSeconds(meta.runtime) || parseRuntimeSeconds(picked.primary.length) || 0;
  const year = Number(String(meta.year || meta.date || '').slice(0, 4)) || 0;
  const encode = (name) => name.split('/').map(encodeURIComponent).join('/');
  const preview = pickPreview(json.files || []);

  return {
    movieId: `ia-${film.id}`,
    source: 'archive',
    archiveId: film.id,
    sourceUrl: `${DETAILS_URL}/${film.id}`,
    title: plainText(meta.title, 160) || film.id,
    description: plainText(meta.description),
    category: film.category,
    subjects: list(meta.subject).flatMap((s) => String(s).split(';')).map((s) => s.trim()).filter(Boolean).slice(0, 6),
    year,
    creator: plainText(first(meta.creator), 120),
    durationSeconds,
    duration: formatDuration(durationSeconds),
    license: plainText(first(meta.licenseurl) || '', 200),
    width: Number(picked.primary.width) || 0,
    height: Number(picked.primary.height) || 0,
    videoUrl: `${DOWNLOAD_URL}/${film.id}/${encode(picked.primary.name)}`,
    videoFallbackUrl: picked.fallback ? `${DOWNLOAD_URL}/${film.id}/${encode(picked.fallback.name)}` : '',
    poster: `${DOWNLOAD_URL}/${film.id}/__ia_thumb.jpg`,
    preview: preview ? `${DOWNLOAD_URL}/${film.id}/${encode(preview)}` : '',
    views: Number(stats.views) || 0,
    rating: Number(stats.rating) || 0,
    active: true,
  };
}

/**
 * Đồng bộ toàn bộ thư viện phim công cộng vào MongoDB.
 * Phim admin tự thêm (`source: 'admin'`) không bị chạm tới.
 */
export async function syncCinemaLibrary({ films = PUBLIC_DOMAIN_FILMS, log = () => {} } = {}) {
  const stats = await fetchStats(films.map((f) => f.id));
  const result = { total: films.length, saved: 0, skipped: [] };

  for (const film of films) {
    try {
      const doc = await buildMovieDoc(film, stats.get(film.id) || {});
      if (!doc) {
        result.skipped.push(film.id);
        log(`bỏ qua ${film.id} — không có file video`);
        continue;
      }
      await CinemaMovie.findOneAndUpdate({ movieId: doc.movieId }, doc, {
        upsert: true,
        new: true,
        runValidators: true,
      });
      result.saved += 1;
      log(`đã lưu ${doc.title} (${doc.duration || '?'})`);
    } catch (error) {
      result.skipped.push(film.id);
      log(`lỗi ${film.id} — ${error.message}`);
    }
  }

  // Phim đã rút khỏi danh sách chọn tay thì cũng rút khỏi kệ, để thư viện không
  // giữ lại bản ghi mà không ai còn đối chiếu được nguồn.
  const keep = films.map((f) => `ia-${f.id}`);
  const stale = await CinemaMovie.deleteMany({ source: 'archive', movieId: { $nin: keep } });
  result.removed = stale.deletedCount || 0;

  return result;
}
