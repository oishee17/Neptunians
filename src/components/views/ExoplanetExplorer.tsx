import { useState, useMemo } from 'react';
import { ExoplanetData, PlanetSizeCategory, StellarSpectralType, HabitabilityFilter } from '../../types/exoplanet';
import { classifyPlanetSize, formatKelvinAndCelsius } from '../../utils/astronomy';
import {
  Search,
  SlidersHorizontal,
  LayoutGrid,
  Table as TableIcon,
  Download,
  RotateCcw,
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

interface ExoplanetExplorerProps {
  planets: ExoplanetData[];
  onSelectPlanet: (planet: ExoplanetData) => void;
  savedPlanetNames: string[];
  onToggleSave: (planetName: string) => void;
  initialSearch?: string;
}

export function ExoplanetExplorer({
  planets,
  onSelectPlanet,
  savedPlanetNames,
  onToggleSave,
  initialSearch = '',
}: ExoplanetExplorerProps) {
  // Filter States
  const [search, setSearch] = useState(initialSearch);
  const [sizeFilter, setSizeFilter] = useState<PlanetSizeCategory>('all');
  const [starTypeFilter, setStarTypeFilter] = useState<StellarSpectralType>('ALL');
  const [habitabilityFilter, setHabitabilityFilter] = useState<HabitabilityFilter>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [maxDistance, setMaxDistance] = useState<number>(5000);
  const [sortOption, setSortOption] = useState<string>('disc_year_desc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [showFiltersPanel, setShowFiltersPanel] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 24;

  // Unique discovery methods from dataset
  const availableMethods = useMemo(() => {
    const set = new Set<string>();
    planets.forEach((p) => {
      if (p.discoverymethod) set.add(p.discoverymethod);
    });
    return Array.from(set).sort();
  }, [planets]);

  // Filter & Sort Logic
  const filteredPlanets = useMemo(() => {
    const q = search.toLowerCase().trim();

    return planets
      .filter((p) => {
        // Search
        if (q) {
          const matchName = p.pl_name.toLowerCase().includes(q);
          const matchHost = p.hostname.toLowerCase().includes(q);
          const matchFac = p.disc_facility?.toLowerCase().includes(q);
          const matchMeth = p.discoverymethod?.toLowerCase().includes(q);
          if (!matchName && !matchHost && !matchFac && !matchMeth) return false;
        }

        // Planet Size
        if (sizeFilter !== 'all') {
          const r = p.pl_rade;
          if (r == null) return false;
          if (sizeFilter === 'sub-earth' && !(r < 0.8)) return false;
          if (sizeFilter === 'earth-sized' && !(r >= 0.8 && r <= 1.25)) return false;
          if (sizeFilter === 'super-earth' && !(r > 1.25 && r <= 2.0)) return false;
          if (sizeFilter === 'mini-neptune' && !(r > 2.0 && r <= 4.0)) return false;
          if (sizeFilter === 'neptune-sized' && !(r > 4.0 && r <= 6.0)) return false;
          if (sizeFilter === 'jupiter-sized' && !(r > 6.0 && r <= 15.0)) return false;
          if (sizeFilter === 'larger-jupiter' && !(r > 15.0)) return false;
        }

        // Host Star Type
        if (starTypeFilter !== 'ALL') {
          if (starTypeFilter === 'UNKNOWN') {
            if (p.st_spectype && p.st_spectype.trim() !== '') return false;
          } else {
            if (!p.st_spectype || !p.st_spectype.toUpperCase().startsWith(starTypeFilter)) return false;
          }
        }

        // Habitability
        if (habitabilityFilter !== 'all') {
          const eqt = p.pl_eqt;
          const r = p.pl_rade;
          if (habitabilityFilter === 'candidate') {
            if (!(eqt != null && eqt >= 180 && eqt <= 330 && (r == null || r <= 2.5))) return false;
          } else if (habitabilityFilter === 'outside') {
            if (!(eqt != null && (eqt < 180 || eqt > 330))) return false;
          } else if (habitabilityFilter === 'unknown') {
            if (eqt != null) return false;
          }
        }

        // Method
        if (methodFilter !== 'all') {
          if (p.discoverymethod.toLowerCase() !== methodFilter.toLowerCase()) return false;
        }

        // Max Distance
        if (p.dist_ly != null && p.dist_ly > maxDistance) return false;

        return true;
      })
      .sort((a, b) => {
        switch (sortOption) {
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
  }, [planets, search, sizeFilter, starTypeFilter, habitabilityFilter, methodFilter, maxDistance, sortOption]);

  const totalResults = filteredPlanets.length;
  const totalPages = Math.ceil(totalResults / itemsPerPage) || 1;
  const paginatedPlanets = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPlanets.slice(start, start + itemsPerPage);
  }, [filteredPlanets, currentPage]);

  const handleResetFilters = () => {
    setSearch('');
    setSizeFilter('all');
    setStarTypeFilter('ALL');
    setHabitabilityFilter('all');
    setMethodFilter('all');
    setMaxDistance(5000);
    setSortOption('disc_year_desc');
    setCurrentPage(1);
  };

  const exportCSV = () => {
    const headers = [
      'Planet Name',
      'Host Star',
      'Distance (ly)',
      'Radius (Earth Radii)',
      'Mass (Earth Mass)',
      'Orbital Period (days)',
      'Semi-major Axis (AU)',
      'Equilibrium Temp (K)',
      'Discovery Year',
      'Discovery Method',
      'Facility',
    ];

    const rows = filteredPlanets.map((p) => [
      `"${p.pl_name}"`,
      `"${p.hostname}"`,
      p.dist_ly ?? '',
      p.pl_rade ?? '',
      p.pl_bmasse ?? '',
      p.pl_orbper ?? '',
      p.pl_orbsmax ?? '',
      p.pl_eqt ?? '',
      p.disc_year,
      `"${p.discoverymethod}"`,
      `"${p.disc_facility}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `neptunians_exoplanet_catalog_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 space-y-6">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Exoplanet Explorer</h2>
          <p className="text-xs text-slate-400 mt-1">
            Confirmed exoplanets catalog synchronized from NASA Exoplanet Archive ({totalResults.toLocaleString()} worlds match criteria)
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View mode toggle */}
          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'grid' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-white'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'table' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-white'
              }`}
              title="Table View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Toggle filter panel */}
          <button
            onClick={() => setShowFiltersPanel(!showFiltersPanel)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              showFiltersPanel
                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/40'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 rounded-lg hover:text-white hover:border-slate-700 transition-colors"
            title="Download CSV of current results"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Search and Sort Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative md:col-span-2">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search planet name, star, mission (e.g. TRAPPIST, Kepler, TESS)..."
            className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition-colors"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        <div>
          <select
            value={sortOption}
            onChange={(e) => {
              setSortOption(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full py-2.5 px-3 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-cyan-400 cursor-pointer"
          >
            <option value="disc_year_desc">Sort: Newest Discovery First</option>
            <option value="disc_year_asc">Sort: Oldest Discovery First</option>
            <option value="dist_asc">Sort: Nearest to Earth</option>
            <option value="dist_desc">Sort: Furthest from Earth</option>
            <option value="radius_asc">Sort: Smallest Radius</option>
            <option value="radius_desc">Sort: Largest Radius</option>
            <option value="mass_desc">Sort: Highest Mass</option>
            <option value="period_asc">Sort: Shortest Orbital Period</option>
            <option value="name_asc">Sort: Alphabetical (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Advanced Filter Panel */}
      {showFiltersPanel && (
        <div className="p-5 rounded-2xl bg-[#080c18] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Astronomical Filters
            </span>
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset All</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {/* Filter: Planet Size */}
            <div>
              <label className="block text-slate-400 font-medium mb-1.5">Planet Size Category</label>
              <select
                value={sizeFilter}
                onChange={(e) => {
                  setSizeFilter(e.target.value as PlanetSizeCategory);
                  setCurrentPage(1);
                }}
                className="w-full py-2 px-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-400"
              >
                <option value="all">All Sizes</option>
                <option value="sub-earth">Sub-Earth (&lt; 0.8 R⊕)</option>
                <option value="earth-sized">Earth-sized (0.8 - 1.25 R⊕)</option>
                <option value="super-earth">Super-Earth (1.25 - 2.0 R⊕)</option>
                <option value="mini-neptune">Sub-Neptune (2.0 - 4.0 R⊕)</option>
                <option value="neptune-sized">Neptune-sized (4.0 - 6.0 R⊕)</option>
                <option value="jupiter-sized">Jupiter-sized (6.0 - 15.0 R⊕)</option>
                <option value="larger-jupiter">Super-Jupiter (&gt; 15.0 R⊕)</option>
              </select>
            </div>

            {/* Filter: Host Star Type */}
            <div>
              <label className="block text-slate-400 font-medium mb-1.5">Host Star Spectral Class</label>
              <select
                value={starTypeFilter}
                onChange={(e) => {
                  setStarTypeFilter(e.target.value as StellarSpectralType);
                  setCurrentPage(1);
                }}
                className="w-full py-2 px-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-400"
              >
                <option value="ALL">All Spectral Types</option>
                <option value="O">O-type (Extremely Hot, Blue)</option>
                <option value="B">B-type (Hot Blue-White)</option>
                <option value="A">A-type (White Stars)</option>
                <option value="F">F-type (Yellow-White)</option>
                <option value="G">G-type (Sun-like Yellow)</option>
                <option value="K">K-type (Orange Dwarfs)</option>
                <option value="M">M-type (Red Dwarfs)</option>
                <option value="UNKNOWN">Unclassified / Unknown</option>
              </select>
            </div>

            {/* Filter: Habitability */}
            <div>
              <label className="block text-slate-400 font-medium mb-1.5">Habitability Potential</label>
              <select
                value={habitabilityFilter}
                onChange={(e) => {
                  setHabitabilityFilter(e.target.value as HabitabilityFilter);
                  setCurrentPage(1);
                }}
                className="w-full py-2 px-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-400"
              >
                <option value="all">All Orbit Regimes</option>
                <option value="candidate">Potential Habitable-Zone Candidates</option>
                <option value="outside">Outside Habitable Zone</option>
                <option value="unknown">Unknown / Insufficient Data</option>
              </select>
            </div>

            {/* Filter: Discovery Method */}
            <div>
              <label className="block text-slate-400 font-medium mb-1.5">Discovery Method</label>
              <select
                value={methodFilter}
                onChange={(e) => {
                  setMethodFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full py-2 px-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-400"
              >
                <option value="all">All Methods</option>
                {availableMethods.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Distance Slider */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Maximum Distance from Earth:</span>
              <span className="font-mono text-cyan-400">
                {maxDistance >= 5000 ? 'Any distance (5,000+ ly)' : `${maxDistance} light-years`}
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="5000"
              step="50"
              value={maxDistance}
              onChange={(e) => {
                setMaxDistance(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
              <span>Nearby (10 ly)</span>
              <span>Local Bubble (100 ly)</span>
              <span>Galactic Arm (1,000 ly)</span>
              <span>Deep Galaxy (5,000+ ly)</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Catalog Content */}
      {paginatedPlanets.length === 0 ? (
        <div className="p-16 rounded-2xl bg-slate-900/40 border border-slate-800 text-center">
          <p className="text-base font-semibold text-slate-300">No exoplanets found matching filters</p>
          <p className="text-xs text-slate-400 mt-1">Try relaxing size, distance, or search parameters.</p>
          <button
            onClick={handleResetFilters}
            className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedPlanets.map((planet) => {
            const size = classifyPlanetSize(planet.pl_rade);
            const isSaved = savedPlanetNames.includes(planet.pl_name);
            const isHabCandidate =
              planet.pl_eqt != null &&
              planet.pl_eqt >= 180 &&
              planet.pl_eqt <= 330 &&
              (planet.pl_rade == null || planet.pl_rade <= 2.5);

            return (
              <div
                key={planet.pl_name}
                className="group relative flex flex-col justify-between p-4 rounded-xl bg-[#080c18] border border-slate-800 hover:border-slate-700 hover:bg-[#0b1020] transition-all cursor-pointer shadow-md"
                onClick={() => onSelectPlanet(planet)}
              >
                <div>
                  {/* Card Header without pill box slop */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[11px] text-slate-400 block">
                        Star: {planet.hostname} ({planet.st_spectype || 'N/A'})
                      </span>
                      <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {planet.pl_name}
                      </h3>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSave(planet.pl_name);
                      }}
                      className="p-1 text-slate-400 hover:text-amber-400 transition-colors"
                      title={isSaved ? 'Remove from saved' : 'Save planet'}
                    >
                      {isSaved ? (
                        <BookmarkCheck className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Clean unboxed metadata with typographic separators */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 my-2">
                    <span className={size.color}>{size.label}</span>
                    <span aria-hidden="true">·</span>
                    <span>{planet.dist_ly ? `${planet.dist_ly} ly` : 'Dist. unk.'}</span>
                    <span aria-hidden="true">·</span>
                    <span>{planet.disc_year}</span>
                  </div>

                  {/* Physical Properties Grid */}
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Radius</span>
                      <span className="font-mono text-slate-200">
                        {planet.pl_rade ? `${planet.pl_rade} R⊕` : 'Unmeasured'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Mass</span>
                      <span className="font-mono text-slate-200">
                        {planet.pl_bmasse ? `${planet.pl_bmasse} M⊕` : 'Unmeasured'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Orbital Period</span>
                      <span className="font-mono text-slate-200">
                        {planet.pl_orbper ? `${planet.pl_orbper.toFixed(1)} d` : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Eq. Temp</span>
                      <span className="font-mono text-slate-200">
                        {planet.pl_eqt ? `${planet.pl_eqt} K` : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 truncate max-w-[150px]">
                    {planet.discoverymethod}
                  </span>
                  {isHabCandidate && (
                    <span className="text-emerald-400 font-medium">HZ Candidate</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#080c18]">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800 font-mono">
              <tr>
                <th className="py-3 px-4">Planet Name</th>
                <th className="py-3 px-4">Host Star</th>
                <th className="py-3 px-4">Radius (R⊕)</th>
                <th className="py-3 px-4">Mass (M⊕)</th>
                <th className="py-3 px-4">Period (days)</th>
                <th className="py-3 px-4">Dist (ly)</th>
                <th className="py-3 px-4">Eq. Temp (K)</th>
                <th className="py-3 px-4">Year</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono tabular-nums">
              {paginatedPlanets.map((planet) => {
                const isSaved = savedPlanetNames.includes(planet.pl_name);
                return (
                  <tr
                    key={planet.pl_name}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                    onClick={() => onSelectPlanet(planet)}
                  >
                    <td className="py-2.5 px-4 font-sans font-semibold text-white">
                      {planet.pl_name}
                    </td>
                    <td className="py-2.5 px-4 text-slate-300">{planet.hostname}</td>
                    <td className="py-2.5 px-4 text-cyan-300">{planet.pl_rade ?? '—'}</td>
                    <td className="py-2.5 px-4 text-sky-300">{planet.pl_bmasse ?? '—'}</td>
                    <td className="py-2.5 px-4">{planet.pl_orbper ? planet.pl_orbper.toFixed(2) : '—'}</td>
                    <td className="py-2.5 px-4">{planet.dist_ly ?? '—'}</td>
                    <td className="py-2.5 px-4">{planet.pl_eqt ?? '—'}</td>
                    <td className="py-2.5 px-4">{planet.disc_year}</td>
                    <td className="py-2.5 px-4 font-sans text-slate-400">{planet.discoverymethod}</td>
                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleSave(planet.pl_name);
                        }}
                        className="p-1 hover:text-amber-400 transition-colors"
                        title={isSaved ? 'Remove' : 'Save'}
                      >
                        {isSaved ? (
                          <BookmarkCheck className="w-4 h-4 text-amber-400" />
                        ) : (
                          <Bookmark className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs text-slate-400">
          <div>
            Showing {(currentPage - 1) * itemsPerPage + 1} –{' '}
            {Math.min(currentPage * itemsPerPage, totalResults)} of {totalResults.toLocaleString()} worlds
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-slate-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
