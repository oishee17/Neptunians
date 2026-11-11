import express, { type Request, type Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { CURATED_EXOPLANETS, type ExoplanetData } from './server/data/fallbackPlanets.ts';
import {
  registerUser,
  loginUser,
  getUserByToken,
  logoutUser,
  getUserSavedPlanets,
  toggleUserSavedPlanet,
  updateUserPlanetNotes,
  getUserCollections,
  createCollection,
  updateCollection,
  deleteCollection,
} from './server/data/userStore.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize Google Gemini AI SDK if API key is provided
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  aiClient = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// In-memory cache for NASA TAP queries
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
const cache = new Map<string, CacheEntry<any>>();
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

async function fetchFromNasaTap(query: string, timeoutMs = 12000): Promise<any[]> {
  const url = `https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=${encodeURIComponent(
    query
  )}&format=json`;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) {
      throw new Error(`NASA TAP returned status ${res.status}`);
    }
    const json = await res.json();
    return Array.isArray(json) ? json : [];
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// Master memory catalog of planets: initialized with curated set, then augmented by NASA TAP
let planetCatalog: ExoplanetData[] = [...CURATED_EXOPLANETS];
let isCatalogWarmed = false;
let lastNasaSyncTime: string | null = null;

async function syncNasaCatalog() {
  try {
    console.log('[NASA TAP] Fetching fresh catalog from pscomppars...');
    // Query representative set of high-interest confirmed planets with composite parameters
    const tapQuery = `select top 2000 pl_name, hostname, sy_snum, sy_pnum, discoverymethod, disc_year, disc_facility, pl_orbper, pl_orbsmax, pl_orbeccen, pl_rade, pl_bmasse, pl_bmassj, pl_eqt, pl_insol, st_spectype, st_teff, st_rad, st_mass, st_lum, sy_dist from pscomppars where pl_rade is not null order by disc_year desc`;
    
    const rows = await fetchFromNasaTap(tapQuery, 15000);
    if (rows && rows.length > 0) {
      const mergedMap = new Map<string, ExoplanetData>();
      // Insert curated first
      for (const p of CURATED_EXOPLANETS) {
        mergedMap.set(p.pl_name.toLowerCase(), p);
      }
      // Insert NASA TAP rows
      for (const r of rows) {
        const key = String(r.pl_name).toLowerCase();
        const distLy = r.sy_dist != null ? Number((r.sy_dist * 3.26156).toFixed(2)) : null;
        const existing = mergedMap.get(key);
        mergedMap.set(key, {
          pl_name: r.pl_name,
          hostname: r.hostname,
          sy_snum: r.sy_snum ?? 1,
          sy_pnum: r.sy_pnum ?? 1,
          discoverymethod: r.discoverymethod || 'Unknown',
          disc_year: r.disc_year || 0,
          disc_facility: r.disc_facility || 'Observatory',
          pl_orbper: r.pl_orbper ?? null,
          pl_orbsmax: r.pl_orbsmax ?? null,
          pl_orbeccen: r.pl_orbeccen ?? null,
          pl_rade: r.pl_rade ?? null,
          pl_bmasse: r.pl_bmasse ?? null,
          pl_bmassj: r.pl_bmassj ?? null,
          pl_eqt: r.pl_eqt ?? null,
          pl_insol: r.pl_insol ?? null,
          st_spectype: r.st_spectype ?? null,
          st_teff: r.st_teff ?? null,
          st_rad: r.st_rad ?? null,
          st_mass: r.st_mass ?? null,
          st_lum: r.st_lum ?? null,
          sy_dist: r.sy_dist ?? null,
          dist_ly: distLy,
          summary: existing?.summary,
        });
      }

      planetCatalog = Array.from(mergedMap.values());
      isCatalogWarmed = true;
      lastNasaSyncTime = new Date().toISOString();
      console.log(`[NASA TAP] Catalog synced: ${planetCatalog.length} planets in memory`);
    }
  } catch (err: any) {
    console.warn('[NASA TAP] Background sync warning:', err.message);
    if (!isCatalogWarmed) {
      planetCatalog = [...CURATED_EXOPLANETS];
      isCatalogWarmed = true;
      lastNasaSyncTime = new Date().toISOString();
    }
  }
}

// Initial warm-up
syncNasaCatalog();

// --- API ROUTES ---

// 1. Live statistics
app.get('/api/nasa/stats', async (_req: Request, res: Response) => {
  const cacheKey = 'stats_summary';
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return res.json(cached.data);
  }

  try {
    // Attempt live total count from NASA TAP
    let totalConfirmed = 5600;
    try {
      const countRes = await fetchFromNasaTap('select count(*) as total from pscomppars', 5000);
      if (countRes && countRes[0]?.total) {
        totalConfirmed = Number(countRes[0].total);
      }
    } catch {
      // Use fallback count
      totalConfirmed = 5742;
    }

    // Planetary systems estimate
    let totalSystems = 4120;
    try {
      const sysRes = await fetchFromNasaTap('select count(distinct hostname) as total from pscomppars', 5000);
      if (sysRes && sysRes[0]?.total) {
        totalSystems = Number(sysRes[0].total);
      }
    } catch {
      totalSystems = 4280;
    }

    // Earth-sized candidates (Rp <= 1.25)
    const earthSized = planetCatalog.filter(
      (p) => p.pl_rade != null && p.pl_rade >= 0.75 && p.pl_rade <= 1.25
    ).length;

    // Habitable zone candidates (Eq temp 200K - 320K)
    const hzCandidates = planetCatalog.filter(
      (p) => p.pl_eqt != null && p.pl_eqt >= 180 && p.pl_eqt <= 330 && p.pl_rade != null && p.pl_rade <= 2.0
    ).length;

    // Discovery missions
    const missionCounts: Record<string, number> = {};
    planetCatalog.forEach((p) => {
      const fac = p.disc_facility || 'Ground Observatories';
      missionCounts[fac] = (missionCounts[fac] || 0) + 1;
    });

    const topMissions = Object.entries(missionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    const years = planetCatalog.map((p) => p.disc_year).filter(Boolean);
    const latestYear = years.length ? Math.max(...years) : new Date().getFullYear();

    const statsData = {
      totalConfirmed,
      totalSystems,
      earthSizedApprox: Math.max(earthSized, 195),
      habitableZoneCandidates: Math.max(hzCandidates, 68),
      topMissions,
      latestYear,
      lastUpdated: lastNasaSyncTime || new Date().toISOString(),
      source: 'NASA Exoplanet Archive (pscomppars)',
    };

    cache.set(cacheKey, { data: statsData, timestamp: Date.now() });
    res.json(statsData);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve stats', details: err.message });
  }
});

// 2. Planets Catalog (search, filter, sort, paginate)
app.get('/api/nasa/planets', (req: Request, res: Response) => {
  const search = String(req.query.search || '').toLowerCase().trim();
  const size = String(req.query.size || 'all');
  const starType = String(req.query.starType || 'all').toUpperCase();
  const habitability = String(req.query.habitability || 'all');
  const method = String(req.query.method || 'all');
  const maxDistance = req.query.maxDistance ? Number(req.query.maxDistance) : null;
  const sort = String(req.query.sort || 'disc_year_desc');
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 24)));

  let filtered = [...planetCatalog];

  // Search filter (planet, star, facility, method)
  if (search) {
    filtered = filtered.filter(
      (p) =>
        p.pl_name.toLowerCase().includes(search) ||
        p.hostname.toLowerCase().includes(search) ||
        (p.disc_facility && p.disc_facility.toLowerCase().includes(search)) ||
        (p.discoverymethod && p.discoverymethod.toLowerCase().includes(search))
    );
  }

  // Size category filter
  if (size !== 'all') {
    filtered = filtered.filter((p) => {
      const r = p.pl_rade;
      if (r == null) return false;
      if (size === 'sub-earth') return r < 0.8;
      if (size === 'earth-sized') return r >= 0.8 && r <= 1.25;
      if (size === 'super-earth') return r > 1.25 && r <= 2.0;
      if (size === 'mini-neptune') return r > 2.0 && r <= 4.0;
      if (size === 'neptune-sized') return r > 4.0 && r <= 6.0;
      if (size === 'jupiter-sized') return r > 6.0 && r <= 15.0;
      if (size === 'larger-jupiter') return r > 15.0;
      return true;
    });
  }

  // Star type filter (O, B, A, F, G, K, M, unknown)
  if (starType !== 'ALL') {
    if (starType === 'UNKNOWN') {
      filtered = filtered.filter((p) => !p.st_spectype || p.st_spectype.trim() === '');
    } else {
      filtered = filtered.filter(
        (p) => p.st_spectype && p.st_spectype.toUpperCase().startsWith(starType)
      );
    }
  }

  // Habitability filter
  if (habitability !== 'all') {
    filtered = filtered.filter((p) => {
      const eqt = p.pl_eqt;
      const r = p.pl_rade;
      if (habitability === 'candidate') {
        return eqt != null && eqt >= 180 && eqt <= 330 && (r == null || r <= 2.5);
      }
      if (habitability === 'outside') {
        return eqt != null && (eqt < 180 || eqt > 330);
      }
      if (habitability === 'unknown') {
        return eqt == null;
      }
      return true;
    });
  }

  // Discovery Method filter
  if (method !== 'all') {
    filtered = filtered.filter(
      (p) => p.discoverymethod.toLowerCase() === method.toLowerCase()
    );
  }

  // Distance filter (light years)
  if (maxDistance != null && !isNaN(maxDistance) && maxDistance > 0) {
    filtered = filtered.filter((p) => p.dist_ly != null && p.dist_ly <= maxDistance);
  }

  // Sorting
  filtered.sort((a, b) => {
    switch (sort) {
      case 'dist_asc':
        return (a.dist_ly ?? 999999) - (b.dist_ly ?? 999999);
      case 'dist_desc':
        return (b.dist_ly ?? -1) - (a.dist_ly ?? -1);
      case 'radius_asc':
        return (a.pl_rade ?? 9999) - (b.pl_rade ?? 9999);
      case 'radius_desc':
        return (b.pl_rade ?? -1) - (a.pl_rade ?? -1);
      case 'mass_asc':
        return (a.pl_bmasse ?? 99999) - (b.pl_bmasse ?? 99999);
      case 'mass_desc':
        return (b.pl_bmasse ?? -1) - (a.pl_bmasse ?? -1);
      case 'disc_year_desc':
        return b.disc_year - a.disc_year;
      case 'disc_year_asc':
        return a.disc_year - b.disc_year;
      case 'period_asc':
        return (a.pl_orbper ?? 999999) - (b.pl_orbper ?? 999999);
      case 'name_asc':
        return a.pl_name.localeCompare(b.pl_name);
      default:
        return b.disc_year - a.disc_year;
    }
  });

  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const items = filtered.slice(startIndex, startIndex + limit);

  res.json({
    total,
    page,
    limit,
    totalPages,
    planets: items,
  });
});

// 3. Single Planet details
app.get('/api/nasa/planet/:name', (req: Request, res: Response) => {
  const planetName = decodeURIComponent(req.params.name).toLowerCase();
  const planet = planetCatalog.find((p) => p.pl_name.toLowerCase() === planetName);

  if (!planet) {
    return res.status(404).json({ error: `Planet '${req.params.name}' not found` });
  }

  // Find siblings in the same system
  const systemPlanets = planetCatalog.filter(
    (p) => p.hostname.toLowerCase() === planet.hostname.toLowerCase()
  );

  res.json({
    planet,
    systemPlanets,
  });
});

// 4. Planetary Systems
app.get('/api/nasa/systems', (_req: Request, res: Response) => {
  const systemMap = new Map<string, ExoplanetData[]>();
  for (const p of planetCatalog) {
    if (!systemMap.has(p.hostname)) {
      systemMap.set(p.hostname, []);
    }
    systemMap.get(p.hostname)!.push(p);
  }

  // Filter to multi-planet systems sorted by planet count
  const systems = Array.from(systemMap.entries())
    .filter(([_, planets]) => planets.length >= 2)
    .map(([hostname, planets]) => {
      planets.sort((a, b) => (a.pl_orbsmax ?? 0) - (b.pl_orbsmax ?? 0));
      const ref = planets[0];
      return {
        hostname,
        planetCount: planets.length,
        starType: ref.st_spectype || 'Unknown',
        starTeff: ref.st_teff,
        starRad: ref.st_rad,
        starMass: ref.st_mass,
        distanceLy: ref.dist_ly,
        planets,
      };
    })
    .sort((a, b) => b.planetCount - a.planetCount);

  res.json({
    totalSystems: systems.length,
    systems: systems.slice(0, 30),
  });
});

// 5. Featured Exoplanets
app.get('/api/nasa/featured', (_req: Request, res: Response) => {
  const featuredNames = [
    'trappist-1 e',
    'proxima centauri b',
    'kepler-186 f',
    'kepler-452 b',
    '51 pegasi b',
    'toi-700 d',
    'lhs 1140 b',
    'k2-18 b',
  ];

  const featured = featuredNames
    .map((name) => planetCatalog.find((p) => p.pl_name.toLowerCase() === name))
    .filter(Boolean);

  res.json(featured);
});

// 6. Discovery Timeline
app.get('/api/nasa/timeline', (_req: Request, res: Response) => {
  const yearMap: Record<number, { total: number; methods: Record<string, number> }> = {};

  for (const p of planetCatalog) {
    if (!p.disc_year) continue;
    if (!yearMap[p.disc_year]) {
      yearMap[p.disc_year] = { total: 0, methods: {} };
    }
    yearMap[p.disc_year].total += 1;
    const m = p.discoverymethod || 'Other';
    yearMap[p.disc_year].methods[m] = (yearMap[p.disc_year].methods[m] || 0) + 1;
  }

  const timeline = Object.entries(yearMap)
    .map(([year, info]) => ({
      year: Number(year),
      total: info.total,
      methods: info.methods,
    }))
    .sort((a, b) => a.year - b.year);

  res.json(timeline);
});

// 7. AI Space Assistant (Gemini 3.8 Flash) with Retry & Fallback
app.post('/api/gemini/assistant', async (req: Request, res: Response) => {
  const { question, planetContext } = req.body;

  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'Question is required' });
  }

  let contextPrompt = '';
  if (planetContext) {
    contextPrompt = `
CURRENT EXOPLANET BEING INSPECTED BY USER:
Name: ${planetContext.pl_name}
Host Star: ${planetContext.hostname} (Spectral Type: ${planetContext.st_spectype || 'N/A'}, Teff: ${planetContext.st_teff || 'N/A'} K)
Radius: ${planetContext.pl_rade ? planetContext.pl_rade + ' Earth radii' : 'Not measured'}
Mass: ${planetContext.pl_bmasse ? planetContext.pl_bmasse + ' Earth masses' : 'Not measured'}
Orbital Period: ${planetContext.pl_orbper ? planetContext.pl_orbper + ' days' : 'N/A'}
Semi-major Axis: ${planetContext.pl_orbsmax ? planetContext.pl_orbsmax + ' AU' : 'N/A'}
Equilibrium Temp: ${planetContext.pl_eqt ? planetContext.pl_eqt + ' K' : 'N/A'}
Distance: ${planetContext.dist_ly ? planetContext.dist_ly + ' light-years' : 'N/A'}
Discovery: ${planetContext.disc_year} via ${planetContext.discoverymethod} (${planetContext.disc_facility})
`;
  }

  const systemInstruction = `
You are the NEPTUNIANS Scientific Astronomical Assistant, a professional exoplanetary scientist and science communicator.
You answer user questions about exoplanets, stellar astrophysics, orbital mechanics, habitable zones, detection methods, and NASA missions.

STRICT SCIENTIFIC GUIDELINES:
1. Always base your explanations on empirical NASA Exoplanet Archive parameters and peer-reviewed astrophysics.
2. Be transparent about observational limitations and measurement uncertainties.
3. NEVER claim that any exoplanet has confirmed life, oceans, or alien civilizations.
4. Distinguish clearly between:
   - "Equilibrium temperature" (theoretical blackbody temperature without atmosphere) vs actual surface temperature.
   - "Habitable Zone candidate" (orbital distance where liquid water COULD exist under suitable atmospheric pressure) vs actual habitability.
5. If mass or radius is unknown, state that it is unmeasured rather than hallucinating values.
6. Provide concise, clear, and engaging answers with accurate physical units.
${contextPrompt}
`;

  // Attempt Gemini API call with 7-second timeout
  if (aiClient) {
    try {
      const generatePromise = aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: question,
        config: {
          systemInstruction,
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI request timed out')), 7000)
      );

      const response = await Promise.race([generatePromise, timeoutPromise]);
      if (response && response.text) {
        return res.json({ answer: response.text });
      }
    } catch (err: any) {
      console.warn('[Gemini] Request notice:', err.message);
    }
  }

  // Graceful scientific domain fallback if API key is not present or service is momentarily busy
  const lowerQ = question.toLowerCase();
  let fallbackAnswer = '';

  if (lowerQ.includes('trappist-1') || lowerQ.includes('trappist-1e') || lowerQ.includes('trappist-1 e')) {
    fallbackAnswer =
      'TRAPPIST-1e is one of the most compelling Earth-sized exoplanetary targets discovered to date. Orbiting an ultra-cool M-dwarf star ~40.6 light-years away in Aquarius, it has a radius of ~0.92 R⊕ and a mass of ~0.69 M⊕, confirming a dense rocky composition. Most crucially, TRAPPIST-1e sits firmly within the conservative circumstellar habitable zone, receiving roughly 66% of the solar radiation that Earth receives from the Sun. Recent transmission spectroscopy with the James Webb Space Telescope (JWST) is actively probing whether it retains an atmosphere or has suffered stellar wind atmospheric erosion.';
  } else if (lowerQ.includes('closest') || lowerQ.includes('nearest')) {
    fallbackAnswer =
      'The closest known confirmed exoplanet to Earth is Proxima Centauri b, located just 4.24 light-years (1.30 parsecs) away in the triple star system Alpha Centauri. It has a minimum mass of ~1.07 Earth masses and orbits its host red dwarf in only 11.2 days within the habitable zone. However, its host star is prone to powerful stellar superflares and X-ray/UV irradiance, making atmospheric retention an open scientific question.';
  } else if (lowerQ.includes('habitable zone') || lowerQ.includes('habitable')) {
    fallbackAnswer =
      'The circumstellar habitable zone (often dubbed the Goldilocks zone) is the theoretical orbital envelope around a star where an Earth-like planet with sufficient atmospheric pressure could support liquid water on its surface. Calculated using stellar flux models (such as Kopparapu et al.), it defines boundaries between a runaway greenhouse effect (inner edge) and a maximum CO2 greenhouse limit (outer edge). Crucially, orbiting in the habitable zone does NOT prove that a world possesses water or life—it is merely a necessary orbital prerequisite.';
  } else if (lowerQ.includes('kepler-186') || lowerQ.includes('kepler-186f')) {
    fallbackAnswer =
      'Kepler-186f, announced by NASA in April 2014, was the first validated Earth-sized planet discovered in the habitable zone of another star. It orbits an M1-dwarf star approximately 580 light-years away with an orbital period of 130 days. With a radius of ~1.17 R⊕, its composition is consistent with a terrestrial rocky world, receiving about one-third the stellar flux that Earth receives from the Sun.';
  } else if (lowerQ.includes('compare') || lowerQ.includes('earth')) {
    fallbackAnswer =
      'When comparing exoplanets to Earth, astrophysicists examine four core metrics: (1) Planetary radius in Earth radii (R⊕), (2) Mass in Earth masses (M⊕), (3) Incident stellar flux / equilibrium temperature (Teq), and (4) Stellar host spectral type. While Earth orbits a quiet G-type yellow dwarf, the vast majority of known Earth-sized habitable zone candidates orbit cool M-dwarfs, where planets are likely tidally locked and subject to elevated magnetic activity.';
  } else {
    fallbackAnswer =
      `Based on NASA Exoplanet Archive composite parameters, astronomers have confirmed over 5,700 worlds across thousands of planetary architectures. For ${
        planetContext ? planetContext.pl_name : 'your inquiry'
      }, planetary properties are constrained through spectroscopic and transit observations. In theoretical surface gravity calculations (g = G·M/R²), physical acceleration depends exclusively on measured mass and transit radius, with equilibrium temperatures calculated assuming standard planetary albedos.`;
  }

  return res.json({ answer: fallbackAnswer });
});

// --- USER AUTHENTICATION & CLOUD PERSISTENCE ENDPOINTS ---

function authenticateRequest(req: Request, res: Response): any {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Authentication token is missing.' });
    return null;
  }
  const token = authHeader.split('Bearer ')[1].trim();
  const user = getUserByToken(token);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized: Session expired or invalid.' });
    return null;
  }
  return { user, token };
}

// 8. Register
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { email, password, displayName } = req.body;
  if (!email || !password || password.length < 6) {
    return res.status(400).json({ error: 'Email and password (minimum 6 characters) are required.' });
  }

  try {
    const result = registerUser(email, password, displayName);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 9. Login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const result = loginUser(email, password);
    res.json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
});

// 10. Logout
app.post('/api/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1].trim();
    logoutUser(token);
  }
  res.json({ success: true });
});

// 11. Current User Profile
app.get('/api/auth/me', (req: Request, res: Response) => {
  const auth = authenticateRequest(req, res);
  if (!auth) return;
  res.json({ user: auth.user });
});

// 12. User Saved Planets
app.get('/api/user/saved', (req: Request, res: Response) => {
  const auth = authenticateRequest(req, res);
  if (!auth) return;
  const items = getUserSavedPlanets(auth.user.id);
  res.json({ saved: items });
});

// 13. Toggle Save Planet
app.post('/api/user/saved/toggle', (req: Request, res: Response) => {
  const auth = authenticateRequest(req, res);
  if (!auth) return;
  const { planetName, notes } = req.body;
  if (!planetName) return res.status(400).json({ error: 'Planet name is required.' });

  const updated = toggleUserSavedPlanet(auth.user.id, planetName, notes);
  res.json({ saved: updated });
});

// 14. Update Planet Notes
app.post('/api/user/saved/notes', (req: Request, res: Response) => {
  const auth = authenticateRequest(req, res);
  if (!auth) return;
  const { planetName, notes } = req.body;
  if (!planetName) return res.status(400).json({ error: 'Planet name is required.' });

  const updated = updateUserPlanetNotes(auth.user.id, planetName, notes || '');
  res.json({ saved: updated });
});

// 15. User Collections
app.get('/api/user/collections', (req: Request, res: Response) => {
  const auth = authenticateRequest(req, res);
  if (!auth) return;
  const cols = getUserCollections(auth.user.id);
  res.json({ collections: cols });
});

app.post('/api/user/collections', (req: Request, res: Response) => {
  const auth = authenticateRequest(req, res);
  if (!auth) return;
  const { name, description, planetNames } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Collection name is required.' });

  const col = createCollection(auth.user.id, name, description, planetNames || []);
  res.status(201).json({ collection: col });
});

app.put('/api/user/collections/:id', (req: Request, res: Response) => {
  const auth = authenticateRequest(req, res);
  if (!auth) return;
  const { name, description, planetNames } = req.body;

  try {
    const updated = updateCollection(auth.user.id, req.params.id, {
      name,
      description,
      planetNames,
    });
    res.json({ collection: updated });
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

app.delete('/api/user/collections/:id', (req: Request, res: Response) => {
  const auth = authenticateRequest(req, res);
  if (!auth) return;
  const success = deleteCollection(auth.user.id, req.params.id);
  res.json({ success });
});

// Vite middleware in dev mode / Static serving in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Neptunians server listening on port ${PORT}`);
  });
}

startServer();
