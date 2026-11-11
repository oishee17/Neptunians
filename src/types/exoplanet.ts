export interface ExoplanetData {
  pl_name: string;
  hostname: string;
  sy_snum: number;
  sy_pnum: number;
  discoverymethod: string;
  disc_year: number;
  disc_facility: string;
  pl_orbper: number | null;
  pl_orbsmax: number | null;
  pl_orbeccen: number | null;
  pl_rade: number | null;
  pl_bmasse: number | null;
  pl_bmassj: number | null;
  pl_eqt: number | null;
  pl_insol: number | null;
  st_spectype: string | null;
  st_teff: number | null;
  st_rad: number | null;
  st_mass: number | null;
  st_lum: number | null;
  sy_dist: number | null;
  dist_ly?: number | null;
  summary?: string;
}

export interface PlanetarySystem {
  hostname: string;
  planetCount: number;
  starType: string;
  starTeff: number | null;
  starRad: number | null;
  starMass: number | null;
  distanceLy: number | null;
  planets: ExoplanetData[];
}

export interface DiscoveryStats {
  totalConfirmed: number;
  totalSystems: number;
  earthSizedApprox: number;
  habitableZoneCandidates: number;
  topMissions: { name: string; count: number }[];
  latestYear: number;
  lastUpdated: string;
  source: string;
}

export type PlanetSizeCategory =
  | 'all'
  | 'sub-earth'
  | 'earth-sized'
  | 'super-earth'
  | 'mini-neptune'
  | 'neptune-sized'
  | 'jupiter-sized'
  | 'larger-jupiter';

export type StellarSpectralType = 'ALL' | 'O' | 'B' | 'A' | 'F' | 'G' | 'K' | 'M' | 'UNKNOWN';

export type HabitabilityFilter = 'all' | 'candidate' | 'outside' | 'unknown';

export interface FilterState {
  search: string;
  size: PlanetSizeCategory;
  starType: StellarSpectralType;
  habitability: HabitabilityFilter;
  method: string;
  maxDistance: number;
  minYear: number;
  maxYear: number;
  sort: string;
}
