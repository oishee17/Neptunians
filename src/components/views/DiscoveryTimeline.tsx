import { useState, useMemo } from 'react';
import { ExoplanetData } from '../../types/exoplanet';
import { Telescope, Calendar, Rocket, Sparkles, Filter, ArrowRight } from 'lucide-react';

interface DiscoveryTimelineProps {
  planets: ExoplanetData[];
  onSelectPlanet: (planet: ExoplanetData) => void;
  onFilterByYear: (year: number) => void;
}

export function DiscoveryTimeline({
  planets,
  onSelectPlanet,
  onFilterByYear,
}: DiscoveryTimelineProps) {
  // Milestones in astronomy
  const milestones = [
    {
      year: 1992,
      title: 'First Pulsar Exoplanets Discovered',
      target: 'PSR B1257+12',
      description: 'Radio astronomers Aleksander Wolszczan and Dale Frail announce planets orbiting a rapidly spinning pulsar remnant.',
      badge: 'Historic First',
    },
    {
      year: 1995,
      title: '51 Pegasi b: First Around a Sun-like Star',
      target: '51 Pegasi b',
      description: 'Michel Mayor and Didier Queloz detect the first hot Jupiter orbiting a main-sequence star, earning the 2019 Nobel Prize in Physics.',
      badge: 'Nobel Milestone',
    },
    {
      year: 1999,
      title: 'First Transiting Planet Detected (HD 209458 b)',
      target: 'HD 209458 b',
      description: 'Astronomers observe the dip in starlight as HD 209458 b crosses the stellar disc, unlocking transit photometry.',
      badge: 'Transit Epoch',
    },
    {
      year: 2009,
      title: 'Kepler Space Telescope Launches',
      target: 'Kepler-11 b',
      description: 'NASA launches Kepler to monitor 150,000 stars simultaneously, transforming statistical exoplanet demographics.',
      badge: 'NASA Flagship',
    },
    {
      year: 2014,
      title: 'First Earth-size Habitable Planet (Kepler-186 f)',
      target: 'Kepler-186 f',
      description: 'Validation of Kepler-186 f proves that Earth-size worlds exist within the habitable zones of other stars.',
      badge: 'Earth Analog',
    },
    {
      year: 2016,
      title: 'Proxima Centauri b Detected at 4.2 Light-Years',
      target: 'Proxima Centauri b',
      description: 'ESO’s Pale Red Dot campaign discovers an Earth-mass planet in the habitable zone of the Sun’s nearest neighboring star.',
      badge: 'Closest Neighbor',
    },
    {
      year: 2017,
      title: 'TRAPPIST-1 Seven-Planet System Revealed',
      target: 'TRAPPIST-1 e',
      description: 'Spitzer and ground telescopes discover seven Earth-sized rocky planets around an ultra-cool red dwarf, with three in the habitable zone.',
      badge: 'Historic System',
    },
    {
      year: 2018,
      title: 'TESS Spacecraft Begins All-Sky Survey',
      target: 'TOI-700 d',
      description: 'NASA launches the Transiting Exoplanet Survey Satellite to survey 85% of the sky for exoplanets around bright nearby stars.',
      badge: 'All-Sky Era',
    },
    {
      year: 2022,
      title: 'James Webb Space Telescope (JWST) Transmission Spectra',
      target: 'WASP-39 b',
      description: 'JWST delivers the first definitive detection of carbon dioxide and sulfur dioxide in an exoplanetary atmosphere.',
      badge: 'Spectroscopy Era',
    },
  ];

  // Dynamic discovery distribution by year from the real dataset
  const yearlyStats = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const p of planets) {
      if (p.disc_year) {
        counts[p.disc_year] = (counts[p.disc_year] || 0) + 1;
      }
    }
    const years = Object.keys(counts).map(Number).sort((a, b) => a - b);
    const maxCount = Math.max(...Object.values(counts), 1);
    return { counts, years, maxCount };
  }, [planets]);

  const [hoveredYear, setHoveredYear] = useState<number | null>(null);

  return (
    <div className="max-w-7xl mx-auto px-4 space-y-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-950/40 border border-sky-800/40 text-xs font-medium text-sky-400 mb-2">
          <Calendar className="w-3.5 h-3.5" />
          <span>Historical Discovery Arc</span>
        </div>
        <h2 className="text-3xl font-bold text-white tracking-tight">Discovery Timeline & Mission Explorer</h2>
        <p className="text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
          Trace how humanity went from speculating about worlds around other stars to cataloging thousands of confirmed planetary systems.
        </p>
      </div>

      {/* Dynamic Discovery Histogram by Year */}
      <section className="p-6 rounded-2xl bg-[#080c18] border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-white">Confirmed Discoveries by Year</h3>
            <p className="text-xs text-slate-400">
              Interactive distribution chart computed dynamically from the active NASA dataset
            </p>
          </div>
          {hoveredYear && (
            <span className="text-xs font-mono text-cyan-400 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
              Year {hoveredYear}: {yearlyStats.counts[hoveredYear]} verified planets
            </span>
          )}
        </div>

        {/* Dynamic Bar Histogram */}
        <div className="h-44 w-full flex items-end gap-1 pt-6 px-1 border-b border-slate-800">
          {yearlyStats.years.map((year) => {
            const count = yearlyStats.counts[year];
            const heightPct = Math.max(6, Math.min(100, (count / yearlyStats.maxCount) * 100));
            const isHovered = hoveredYear === year;

            return (
              <div
                key={year}
                onMouseEnter={() => setHoveredYear(year)}
                onMouseLeave={() => setHoveredYear(null)}
                onClick={() => onFilterByYear(year)}
                className="flex-1 flex flex-col items-center h-full justify-end cursor-pointer group"
                title={`${year}: ${count} discoveries (Click to filter catalog)`}
              >
                <div
                  style={{ height: `${heightPct}%` }}
                  className={`w-full rounded-t-sm transition-all ${
                    isHovered
                      ? 'bg-cyan-400 shadow-md shadow-cyan-500/50'
                      : year >= 2014
                      ? 'bg-sky-500 group-hover:bg-cyan-400'
                      : 'bg-indigo-600/70 group-hover:bg-indigo-400'
                  }`}
                />
              </div>
            );
          })}
        </div>

        <div className="flex justify-between text-[11px] font-mono text-slate-400 pt-1">
          <span>{yearlyStats.years[0] || 1992} (First confirmed)</span>
          <span>2009 (Kepler launch)</span>
          <span>2016 (Kepler surge)</span>
          <span>{yearlyStats.years[yearlyStats.years.length - 1] || 2024}</span>
        </div>
      </section>

      {/* Curated Historical Milestones */}
      <section className="space-y-6">
        <h3 className="text-xl font-bold text-white tracking-tight">Major Astronomical Milestones</h3>

        <div className="relative pl-6 sm:pl-8 border-l border-slate-800 space-y-8">
          {milestones.map((m) => {
            const matchingPlanet = planets.find(
              (p) => p.pl_name.toLowerCase() === m.target.toLowerCase()
            );

            return (
              <div key={m.year} className="relative group">
                {/* Timeline node marker (static clean circle, no pulsing dot slop) */}
                <div className="absolute -left-[31px] sm:-left-[39px] top-1 w-3.5 h-3.5 rounded-full bg-slate-900 border-2 border-cyan-400 group-hover:bg-cyan-400 transition-colors" />

                <div className="p-5 rounded-2xl bg-[#080c18] border border-slate-800 group-hover:border-slate-700 transition-all space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold font-mono text-cyan-400">{m.year}</span>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span className="text-xs font-semibold uppercase text-slate-400">{m.badge}</span>
                    </div>

                    {matchingPlanet && (
                      <button
                        onClick={() => onSelectPlanet(matchingPlanet)}
                        className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                      >
                        <span>Inspect {m.target}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <h4 className="text-lg font-bold text-white">{m.title}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{m.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
