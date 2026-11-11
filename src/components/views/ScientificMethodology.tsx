import { BookOpen, HelpCircle, ShieldCheck, Atom, Orbit, Sparkles, ExternalLink } from 'lucide-react';

export function ScientificMethodology() {
  const glossary = [
    {
      term: 'Exoplanet (Extrasolar Planet)',
      definition:
        'A planet located outside our Solar System that orbits a star other than our Sun, a stellar remnant, or drifts freely as a rogue planet through interstellar space.',
    },
    {
      term: 'Astronomical Unit (AU)',
      definition:
        'The mean distance from the center of the Earth to the center of the Sun, approximately 149,597,870.7 kilometers (92.96 million miles). Commonly used to measure planetary orbital radii.',
    },
    {
      term: 'Light-Year (ly)',
      definition:
        'The distance electromagnetic radiation travels in a vacuum in one Julian year, approximately 9.461 trillion kilometers (63,241 AU). 1 parsec (pc) equals 3.26156 light-years.',
    },
    {
      term: 'Orbital Period (days / years)',
      definition:
        'The time required for an exoplanet to complete one full revolution around its parent star. Ranging from ultra-short periods under 1 Earth day to thousands of years.',
    },
    {
      term: 'Equilibrium Temperature (Teq)',
      definition:
        'The theoretical blackbody temperature an exoplanet reaches assuming radiation balance between absorbed stellar flux and thermal emission. It does NOT include greenhouse warming (e.g. Earth Teq is -18 °C, but surface averages +15 °C due to greenhouse gases).',
    },
    {
      term: 'Theoretical Surface Gravity (g)',
      definition:
        'Gravitational acceleration at the apparent spherical surface: g = G · M / R². Relative to Earth: g/g⊕ = (M/M⊕) / (R/R⊕)². Valid strictly when both empirical mass and transit radius are measured.',
    },
    {
      term: 'Circumstellar Habitable Zone (HZ)',
      definition:
        'The circumstellar orbital shell wherein an Earth-like planet with sufficient atmospheric pressure could support liquid water on its surface. Calculated using Kopparapu et al. stellar insolation models.',
    },
    {
      term: 'Super-Earth & Sub-Neptune',
      definition:
        'Size classes between Earth (1.0 R⊕) and Neptune (3.88 R⊕). Super-Earths (1.25 – 2.0 R⊕) are typically rocky or water-rich, while Sub-Neptunes (2.0 – 4.0 R⊕) possess extended hydrogen-helium atmospheres.',
    },
  ];

  const detectionMethods = [
    {
      name: 'Transit Photometry (Kepler, TESS, CHEOPS)',
      share: '~75% of Confirmed Discoveries',
      description:
        'Measures minute, periodic dips in starlight as an exoplanet transits across the face of its host star. Directly yields orbital period and planetary radius (Rp/R*), but cannot determine planet mass without radial velocity follow-up or transit timing variations (TTV).',
    },
    {
      name: 'Radial Velocity / Doppler Wobble (HARPS, ESPRESSO, HIRES)',
      share: '~19% of Confirmed Discoveries',
      description:
        'Measures gravitational tugs exerted by an orbiting planet on its parent star, producing Doppler shifts in stellar spectral absorption lines. Directly measures minimum mass (M · sin i) and orbital period.',
    },
    {
      name: 'Gravitational Microlensing (OGLE, Roman Space Telescope)',
      share: '~3% of Confirmed Discoveries',
      description:
        'Occurs when the gravitational field of a foreground star and planet bends and magnifies light from a background star. Exceptionally sensitive to cold planets at wide separations and free-floating rogue worlds.',
    },
    {
      name: 'Direct Imaging (Keck, VLT, JWST)',
      share: '~1.5% of Confirmed Discoveries',
      description:
        'Uses coronagraphs or starshades to block out intense stellar glare, capturing photons emitted directly by young, hot, widely separated gas giants.',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 space-y-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-800/40 text-xs font-medium text-cyan-300 mb-2">
          <BookOpen className="w-3.5 h-3.5" />
          <span>NASA Hackathon Standards</span>
        </div>
        <h2 className="text-3xl font-bold text-white tracking-tight">Data & Scientific Methodology</h2>
        <p className="text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
          Full transparency on scientific assumptions, mathematical formulas, detection mechanics, and data provenance governing the Neptunians exploration engine.
        </p>
      </div>

      {/* Core Scientific Rigor Principles */}
      <section className="p-6 rounded-2xl bg-[#080c18] border border-slate-800 space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>Scientific Accuracy & Data Ethics Rules</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
            <span className="font-bold text-white block">1. No Invented Measurements</span>
            <p className="text-slate-400">
              If an exoplanet lacks measured mass or radius, surface gravity and density are explicitly marked as unavailable. We never synthesize fabricated numbers.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
            <span className="font-bold text-white block">2. Habitable Zone ≠ Inhabited</span>
            <p className="text-slate-400">
              Orbiting within the circumstellar habitable zone is an astronomical prerequisite for liquid surface water, not proof of habitability, an atmosphere, or biological activity.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
            <span className="font-bold text-white block">3. Equilibrium Temp vs Surface Temp</span>
            <p className="text-slate-400">
              Equilibrium temperature assumes an idealized blackbody sphere. Real surface conditions depend heavily on atmospheric composition, greenhouse warming, and atmospheric circulation.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
            <span className="font-bold text-white block">4. Artistic 3D Renders are Conceptual</span>
            <p className="text-slate-400">
              All 3D globe visualizations and illustrations are procedural models informed by empirical size, insolation, and temperature—never direct optical photographs.
            </p>
          </div>
        </div>
      </section>

      {/* Exoplanet Detection Methods */}
      <section className="space-y-4">
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight">How We Find Exoplanets</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Primary astronomical techniques responsible for confirmed discoveries
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {detectionMethods.map((m) => (
            <div key={m.name} className="p-5 rounded-2xl bg-[#080c18] border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-cyan-400 font-semibold">{m.share}</span>
                <span className="text-slate-400">NASA TAP Primary Solution</span>
              </div>
              <h4 className="text-base font-bold text-white">{m.name}</h4>
              <p className="text-xs text-slate-300 leading-relaxed">{m.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Beginner-Friendly Scientific Glossary */}
      <section className="space-y-4">
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight">Astronomical Terminology Guide</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Standard definitions and units of measurement used across Neptunians
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {glossary.map((g) => (
            <div key={g.term} className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-1">
              <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">{g.term}</h4>
              <p className="text-xs text-slate-300 leading-relaxed">{g.definition}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Official Data Source Attribution */}
      <section className="p-6 rounded-2xl bg-[#080c18] border border-slate-800 space-y-3">
        <h4 className="text-base font-bold text-white">Data Provenance & Acknowledgement</h4>
        <p className="text-xs text-slate-300 leading-relaxed">
          This research application utilizes the <strong>NASA Exoplanet Archive</strong>, operated by the California Institute of Technology under contract with the National Aeronautics and Space Administration under the Exoplanet Exploration Program. All queries utilize the Table Access Protocol (TAP) service interfacing with the composite parameters catalog (<code className="text-cyan-300 font-mono">pscomppars</code>).
        </p>
        <div className="pt-2">
          <a
            href="https://exoplanetarchive.ipac.caltech.edu"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
          >
            <span>Visit NASA Exoplanet Archive (Caltech/IPAC)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </section>
    </div>
  );
}
