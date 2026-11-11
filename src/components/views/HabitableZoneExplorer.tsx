import { useState, useMemo } from 'react';
import { ExoplanetData } from '../../types/exoplanet';
import { calculateHabitableZone, classifyPlanetSize, formatKelvinAndCelsius } from '../../utils/astronomy';
import { HabitableZoneDiagram } from '../3d/HabitableZoneDiagram';
import { Sparkles, ShieldAlert, CheckCircle2, SlidersHorizontal, Info, ArrowRight } from 'lucide-react';

interface HabitableZoneExplorerProps {
  planets: ExoplanetData[];
  onSelectPlanet: (planet: ExoplanetData) => void;
}

export function HabitableZoneExplorer({
  planets,
  onSelectPlanet,
}: HabitableZoneExplorerProps) {
  const [selectedPlanetName, setSelectedPlanetName] = useState<string>('TRAPPIST-1 e');
  const [radiusFilter, setRadiusFilter] = useState<'all' | 'rocky' | 'super-earth'>('all');
  const [starTempFilter, setStarTempFilter] = useState<'all' | 'cool' | 'sun-like'>('all');

  // Filter candidates that reside in or near the habitable zone
  const hzCandidates = useMemo(() => {
    return planets.filter((p) => {
      // Must have equilibrium temp in broad habitable range (180K - 330K) or calculated HZ
      const hz = calculateHabitableZone(p);
      const isCandidate =
        hz.status === 'conservative' ||
        hz.status === 'optimistic' ||
        (p.pl_eqt != null && p.pl_eqt >= 180 && p.pl_eqt <= 320 && (p.pl_rade == null || p.pl_rade <= 2.2));

      if (!isCandidate) return false;

      // Radius filter
      if (radiusFilter === 'rocky' && (p.pl_rade == null || p.pl_rade > 1.25)) return false;
      if (radiusFilter === 'super-earth' && (p.pl_rade == null || p.pl_rade <= 1.25 || p.pl_rade > 2.0)) return false;

      // Star temperature filter
      if (starTempFilter === 'cool' && (p.st_teff == null || p.st_teff > 4000)) return false;
      if (starTempFilter === 'sun-like' && (p.st_teff == null || p.st_teff < 5000 || p.st_teff > 6200)) return false;

      return true;
    });
  }, [planets, radiusFilter, starTempFilter]);

  const activePlanet = useMemo(() => {
    return (
      hzCandidates.find((p) => p.pl_name.toLowerCase() === selectedPlanetName.toLowerCase()) ||
      hzCandidates[0] ||
      planets[0]
    );
  }, [hzCandidates, selectedPlanetName, planets]);

  return (
    <div className="max-w-7xl mx-auto px-4 space-y-10">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-800/40 text-xs font-medium text-emerald-400 mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Astrobiology & Atmospheric Physics</span>
        </div>
        <h2 className="text-3xl font-bold text-white tracking-tight">Habitable Zone Explorer</h2>
        <p className="text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
          Explore worlds orbiting at distances where liquid water could theoretically persist on their surface, modeled using stellar flux limits.
        </p>
      </div>

      {/* Mandatory Scientific Demarcation Banner */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-2">
        <div className="flex items-center gap-2 font-semibold text-emerald-400 text-sm">
          <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Critical Scientific Demarcation (NASA Hackathon Protocol)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2 text-slate-400 text-xs">
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="font-bold text-white block mb-1">1. Confirmed Exoplanet</span>
            Empirically detected world verified through transit photometry or radial velocity spectroscopy.
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="font-bold text-white block mb-1">2. In Habitable Zone</span>
            Orbital position where incident stellar flux permits liquid water, <em className="text-slate-300">provided</em> an atmosphere exists.
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="font-bold text-white block mb-1">3. Habitability Potential</span>
            Theoretical candidate pending atmospheric spectroscopy (e.g. JWST transmission spectra).
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="font-bold text-white block mb-1">4. Life Confirmed</span>
            <strong className="text-rose-400">Zero confirmed evidence.</strong> No exoplanet has confirmed biosignatures or extraterrestrial biology.
          </div>
        </div>
      </div>

      {/* Main Focus: Selected Planet Diagram */}
      {activePlanet && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-mono text-cyan-400 uppercase">Interactive Stellar Map</span>
              <h3 className="text-xl font-bold text-white">{activePlanet.pl_name} Habitable Zone</h3>
            </div>
            <button
              onClick={() => onSelectPlanet(activePlanet)}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
            >
              <span>Full 3D Planetary Profile</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <HabitableZoneDiagram planet={activePlanet} height={380} />
        </section>
      )}

      {/* Candidate Worlds Catalog & Filters */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Habitable Zone Candidates ({hzCandidates.length} Worlds)
            </h3>
            <p className="text-xs text-slate-400">
              Filter by planetary radius and host stellar classification
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={radiusFilter}
              onChange={(e) => setRadiusFilter(e.target.value as any)}
              className="py-1.5 px-2.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-300 focus:outline-none focus:border-cyan-400"
            >
              <option value="all">All Sizes (≤ 2.5 R⊕)</option>
              <option value="rocky">Earth-sized Rocky (≤ 1.25 R⊕)</option>
              <option value="super-earth">Super-Earth (1.25 - 2.0 R⊕)</option>
            </select>

            <select
              value={starTempFilter}
              onChange={(e) => setStarTempFilter(e.target.value as any)}
              className="py-1.5 px-2.5 text-xs rounded-lg bg-slate-900 border border-slate-700 text-slate-300 focus:outline-none focus:border-cyan-400"
            >
              <option value="all">All Stars</option>
              <option value="cool">M-Dwarf / Red Stars (&lt; 4000 K)</option>
              <option value="sun-like">Sun-like Stars (5000 - 6200 K)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {hzCandidates.map((planet) => {
            const size = classifyPlanetSize(planet.pl_rade);
            const isSelected = activePlanet?.pl_name === planet.pl_name;
            const hz = calculateHabitableZone(planet);

            return (
              <div
                key={planet.pl_name}
                onClick={() => setSelectedPlanetName(planet.pl_name)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#0e162d] border-emerald-500/60 shadow-lg'
                    : 'bg-[#080c18] border-slate-800 hover:border-slate-700 hover:bg-[#0b1020]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Host: {planet.hostname}</span>
                    <span className="font-mono text-emerald-400">
                      {hz.status === 'conservative' ? 'Conservative HZ' : 'Optimistic HZ'}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-white mb-2">{planet.pl_name}</h4>

                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
                    <span className={size.color}>{size.label}</span>
                    <span aria-hidden="true">·</span>
                    <span>{planet.dist_ly ? `${planet.dist_ly} ly` : 'N/A'}</span>
                    <span aria-hidden="true">·</span>
                    <span>{planet.pl_orbper ? `${planet.pl_orbper.toFixed(1)} d` : 'N/A'}</span>
                  </div>

                  <div className="space-y-1.5 text-xs border-t border-slate-800/80 pt-2 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-sans">Equilibrium Temp:</span>
                      <span className="text-cyan-300 font-bold">{formatKelvinAndCelsius(planet.pl_eqt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-sans">Orbital Distance:</span>
                      <span className="text-slate-200">{planet.pl_orbsmax ? `${planet.pl_orbsmax} AU` : 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-sans">Insolation Flux:</span>
                      <span className="text-slate-200">{planet.pl_insol ? `${planet.pl_insol} S⊕` : 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">{planet.discoverymethod}</span>
                  <span className="text-cyan-400 font-medium">
                    {isSelected ? 'Viewing Orbit' : 'Inspect Orbit'}
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
