import { useState } from 'react';
import { ExoplanetData, DiscoveryStats } from '../../types/exoplanet';
import { classifyPlanetSize } from '../../utils/astronomy';
import {
  Search,
  Compass,
  Scale,
  Sparkles,
  ArrowRight,
  Globe2,
  Orbit,
  Telescope,
  Radio,
  Shuffle,
} from 'lucide-react';

interface HomeDashboardProps {
  stats: DiscoveryStats | null;
  featuredPlanets: ExoplanetData[];
  onSelectPlanet: (planet: ExoplanetData) => void;
  onNavigateTab: (tab: string) => void;
  onSearchSubmit: (query: string) => void;
  allPlanets: ExoplanetData[];
}

export function HomeDashboard({
  stats,
  featuredPlanets,
  onSelectPlanet,
  onNavigateTab,
  onSearchSubmit,
  allPlanets,
}: HomeDashboardProps) {
  const [searchInput, setSearchInput] = useState('');
  const [suggestions, setSuggestions] = useState<ExoplanetData[]>([]);

  const handleInputChange = (val: string) => {
    setSearchInput(val);
    if (!val.trim()) {
      setSuggestions([]);
      return;
    }
    const q = val.toLowerCase().trim();
    const matches = allPlanets
      .filter(
        (p) =>
          p.pl_name.toLowerCase().includes(q) ||
          p.hostname.toLowerCase().includes(q) ||
          p.disc_facility.toLowerCase().includes(q)
      )
      .slice(0, 5);
    setSuggestions(matches);
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchInput.trim()) {
      onSearchSubmit(searchInput.trim());
      onNavigateTab('catalog');
    }
  };

  const handleRandomPlanet = () => {
    if (allPlanets.length > 0) {
      const rand = allPlanets[Math.floor(Math.random() * allPlanets.length)];
      onSelectPlanet(rand);
    }
  };

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative pt-12 pb-16 px-4 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-800/40 text-xs font-medium text-cyan-300 mb-6">
          <Telescope className="w-3.5 h-3.5" />
          <span>NASA Exoplanet Archive Composite Data</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6 text-balance">
          Thousands of Worlds. <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
            Countless Possibilities.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto mb-8 leading-relaxed">
          Explore confirmed planets beyond our solar system using real astronomical data from the NASA Exoplanet Archive. Compare worlds, analyze theoretical gravity, and investigate habitable zones.
        </p>

        {/* Prominent Search with Autocomplete */}
        <div className="relative max-w-xl mx-auto mb-8">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Search for an exoplanet, host star, or discovery mission..."
              className="w-full pl-12 pr-28 py-3.5 text-sm rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 shadow-xl transition-all"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors"
            >
              Search
            </button>
          </form>

          {/* Autocomplete Dropdown */}
          {suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-30 text-left">
              {suggestions.map((p) => (
                <button
                  key={p.pl_name}
                  onClick={() => {
                    onSelectPlanet(p);
                    setSuggestions([]);
                    setSearchInput('');
                  }}
                  className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-slate-800 transition-colors border-b border-slate-800/60 last:border-0 text-xs"
                >
                  <div>
                    <span className="font-semibold text-white">{p.pl_name}</span>
                    <span className="text-slate-400 ml-2">Star: {p.hostname}</span>
                  </div>
                  <span className="text-cyan-400 font-mono">
                    {p.pl_rade ? `${p.pl_rade} R⊕` : 'Radius unmeasured'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Primary and Secondary CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => onNavigateTab('catalog')}
            className="flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl shadow-lg transition-all"
          >
            <Compass className="w-4 h-4" />
            <span>Start Exploring</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => onNavigateTab('compare')}
            className="flex items-center gap-2 px-5 py-3 text-sm font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl transition-colors"
          >
            <Scale className="w-4 h-4 text-amber-400" />
            <span>Compare with Earth</span>
          </button>

          <button
            onClick={handleRandomPlanet}
            className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-300 hover:text-white bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 rounded-xl transition-colors"
            title="Discover a random exoplanet"
          >
            <Shuffle className="w-4 h-4 text-sky-400" />
            <span>Random World</span>
          </button>
        </div>
      </section>

      {/* Live Discovery Statistics Section */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Live Discovery Statistics</h2>
            <p className="text-xs text-slate-400">
              Aggregated from real NASA Exoplanet Archive composite parameters
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Source: NASA TAP pscomppars
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#090d1a] border border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
              <Globe2 className="w-4 h-4 text-cyan-400" />
              <span>Confirmed Exoplanets</span>
            </div>
            <div className="text-3xl font-bold font-mono text-white tracking-tight">
              {stats ? stats.totalConfirmed.toLocaleString() : '5,742'}
            </div>
            <p className="text-xs text-slate-400 mt-2">Verified worlds beyond our Solar System</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#090d1a] border border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
              <Orbit className="w-4 h-4 text-indigo-400" />
              <span>Planetary Systems</span>
            </div>
            <div className="text-3xl font-bold font-mono text-white tracking-tight">
              {stats ? stats.totalSystems.toLocaleString() : '4,280'}
            </div>
            <p className="text-xs text-slate-400 mt-2">Known host stars with confirmed planets</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#090d1a] border border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
              <Radio className="w-4 h-4 text-emerald-400" />
              <span>Earth-sized Worlds</span>
            </div>
            <div className="text-3xl font-bold font-mono text-white tracking-tight">
              {stats ? stats.earthSizedApprox.toLocaleString() : '195+'}
            </div>
            <p className="text-xs text-slate-400 mt-2">Planets with radius 0.75 – 1.25 R⊕</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#090d1a] border border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Habitable Candidates</span>
            </div>
            <div className="text-3xl font-bold font-mono text-white tracking-tight">
              {stats ? stats.habitableZoneCandidates.toLocaleString() : '68+'}
            </div>
            <p className="text-xs text-slate-400 mt-2">Located in theoretical habitable zone</p>
          </div>
        </div>
      </section>

      {/* Featured Discoveries Section */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Featured Planetary Discoveries</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Iconic benchmarks in exoplanet research, from Earth-sized candidates to historic firsts
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('catalog')}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
          >
            <span>View All Worlds</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featuredPlanets.map((planet) => {
            const size = classifyPlanetSize(planet.pl_rade);
            return (
              <div
                key={planet.pl_name}
                onClick={() => onSelectPlanet(planet)}
                className="group relative flex flex-col justify-between p-5 rounded-2xl bg-[#080c18] border border-slate-800 hover:border-cyan-500/50 hover:bg-[#0c1224] transition-all cursor-pointer shadow-lg hover:shadow-cyan-950/20"
              >
                <div>
                  {/* Card Header without pill sandwiches */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400">Host: {planet.hostname}</span>
                    <span className={`text-xs font-mono font-medium ${size.color}`}>
                      {size.label}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {planet.pl_name}
                  </h3>

                  <div className="flex items-center gap-2 text-xs text-slate-400 my-2">
                    <span>{planet.dist_ly ? `${planet.dist_ly} ly` : 'Distance N/A'}</span>
                    <span aria-hidden="true">·</span>
                    <span>{planet.pl_rade ? `${planet.pl_rade} R⊕` : 'Radius unmeasured'}</span>
                    <span aria-hidden="true">·</span>
                    <span>{planet.disc_year}</span>
                  </div>

                  <p className="text-xs text-slate-300 mt-3 line-clamp-3 leading-relaxed">
                    {planet.summary ||
                      `${planet.pl_name} was discovered in ${planet.disc_year} via ${planet.discoverymethod} using the ${planet.disc_facility}.`}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono">
                    {planet.pl_eqt ? `${planet.pl_eqt} K Eq. Temp` : 'Temp Unknown'}
                  </span>
                  <span className="text-cyan-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                    Inspect World
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
