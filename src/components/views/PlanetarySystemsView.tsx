import { useState, useMemo } from 'react';
import { ExoplanetData, PlanetarySystem } from '../../types/exoplanet';
import { PlanetarySystem3D } from '../3d/PlanetarySystem3D';
import { classifyPlanetSize, formatKelvinAndCelsius } from '../../utils/astronomy';
import { Orbit, Sparkles, ArrowRight, Info, Layers } from 'lucide-react';

interface PlanetarySystemsViewProps {
  planets: ExoplanetData[];
  onSelectPlanet: (planet: ExoplanetData) => void;
}

export function PlanetarySystemsView({
  planets,
  onSelectPlanet,
}: PlanetarySystemsViewProps) {
  // Aggregate multi-planet systems
  const systems = useMemo(() => {
    const map = new Map<string, ExoplanetData[]>();
    for (const p of planets) {
      if (!map.has(p.hostname)) {
        map.set(p.hostname, []);
      }
      map.get(p.hostname)!.push(p);
    }

    return Array.from(map.entries())
      .filter(([_, list]) => list.length >= 2)
      .map(([hostname, list]) => {
        list.sort((a, b) => (a.pl_orbsmax ?? 0) - (b.pl_orbsmax ?? 0));
        const ref = list[0];
        return {
          hostname,
          planetCount: list.length,
          starType: ref.st_spectype || 'Unknown',
          starTeff: ref.st_teff,
          starRad: ref.st_rad,
          starMass: ref.st_mass,
          distanceLy: ref.dist_ly,
          planets: list,
        } as PlanetarySystem;
      })
      .sort((a, b) => b.planetCount - a.planetCount);
  }, [planets]);

  // Selected System (defaults to TRAPPIST-1 or Kepler-90)
  const [selectedHostname, setSelectedHostname] = useState<string>('TRAPPIST-1');
  const [selectedPlanet, setSelectedPlanet] = useState<ExoplanetData | null>(null);

  const activeSystem = useMemo(() => {
    return systems.find((s) => s.hostname === selectedHostname) || systems[0];
  }, [systems, selectedHostname]);

  return (
    <div className="max-w-7xl mx-auto px-4 space-y-10">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/40 border border-indigo-800/40 text-xs font-medium text-indigo-300 mb-2">
          <Orbit className="w-3.5 h-3.5" />
          <span>Multi-Planetary Architectures</span>
        </div>
        <h2 className="text-3xl font-bold text-white tracking-tight">Planetary System Explorer</h2>
        <p className="text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
          Examine multiple worlds sharing the same host star. Discover how solar systems with tightly packed inner orbits or eight-planet configurations differ from our own.
        </p>
      </div>

      {/* Famous Systems Selector Strip */}
      <div className="p-4 rounded-2xl bg-[#080c18] border border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-xs font-semibold uppercase text-slate-400 whitespace-nowrap mr-2">
          Featured Systems:
        </span>
        {systems.slice(0, 10).map((sys) => {
          const isSelected = sys.hostname === activeSystem?.hostname;
          return (
            <button
              key={sys.hostname}
              onClick={() => {
                setSelectedHostname(sys.hostname);
                setSelectedPlanet(null);
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-mono rounded-xl transition-all whitespace-nowrap shrink-0 border ${
                isSelected
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-md'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
              }`}
            >
              <span>{sys.hostname}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-800 text-slate-300">
                {sys.planetCount} worlds
              </span>
            </button>
          );
        })}
      </div>

      {/* 3D Multi-Orbit Interactive Stage */}
      {activeSystem && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-mono text-cyan-400 uppercase">Interactive Orbital Space</span>
              <h3 className="text-xl font-bold text-white">
                {activeSystem.hostname} System ({activeSystem.planetCount} Known Planets)
              </h3>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-4">
              <span>Star Type: {activeSystem.starType}</span>
              <span>Distance: {activeSystem.distanceLy ? `${activeSystem.distanceLy} ly` : 'N/A'}</span>
            </div>
          </div>

          <PlanetarySystem3D
            hostname={activeSystem.hostname}
            planets={activeSystem.planets}
            selectedPlanet={selectedPlanet}
            onSelectPlanet={(p) => setSelectedPlanet(p)}
            height="480px"
          />
        </section>
      )}

      {/* Comparative Planets Table within the active system */}
      {activeSystem && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white tracking-tight">
              Planets of the {activeSystem.hostname} System
            </h3>
            <span className="text-xs text-slate-400">Ordered by distance from star</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {activeSystem.planets.map((planet, idx) => {
              const size = classifyPlanetSize(planet.pl_rade);
              const isSelected = selectedPlanet?.pl_name === planet.pl_name;

              return (
                <div
                  key={planet.pl_name}
                  onClick={() => setSelectedPlanet(planet)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#0f172f] border-cyan-500/70 shadow-lg'
                      : 'bg-[#080c18] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span className="font-mono">Planet #{idx + 1}</span>
                      <span className={size.color}>{size.label}</span>
                    </div>

                    <h4 className="text-base font-bold text-white mb-2">{planet.pl_name}</h4>

                    <div className="space-y-1.5 text-xs font-mono border-t border-slate-800/80 pt-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-sans">Semi-major Axis:</span>
                        <span className="text-slate-200">
                          {planet.pl_orbsmax ? `${planet.pl_orbsmax} AU` : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-sans">Orbital Period:</span>
                        <span className="text-slate-200">
                          {planet.pl_orbper ? `${planet.pl_orbper.toFixed(2)} d` : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-sans">Radius:</span>
                        <span className="text-cyan-300 font-bold">
                          {planet.pl_rade ? `${planet.pl_rade} R⊕` : 'Unmeasured'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-sans">Equilibrium Temp:</span>
                        <span className="text-slate-200">{formatKelvinAndCelsius(planet.pl_eqt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectPlanet(planet);
                      }}
                      className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
                    >
                      <span>Full Profile</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                    <span className="text-[11px] text-slate-400">{planet.discoverymethod}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
