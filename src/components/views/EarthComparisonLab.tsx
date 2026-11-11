import { useState, useMemo } from 'react';
import { ExoplanetData } from '../../types/exoplanet';
import { calculateSurfaceGravityRatio, classifyPlanetSize, formatKelvinAndCelsius } from '../../utils/astronomy';
import { Scale, ArrowRightLeft, Info, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';

interface EarthComparisonLabProps {
  planets: ExoplanetData[];
  initialPlanet?: ExoplanetData | null;
  onSelectPlanet: (planet: ExoplanetData) => void;
}

export function EarthComparisonLab({
  planets,
  initialPlanet,
  onSelectPlanet,
}: EarthComparisonLabProps) {
  // Selected Target Planet (defaults to initialPlanet or TRAPPIST-1 e / first planet)
  const [selectedPlanetName, setSelectedPlanetName] = useState<string>(
    initialPlanet?.pl_name || 'TRAPPIST-1 e'
  );

  // Optional Second Planet (defaults to Earth)
  const [compareToEarth, setCompareToEarth] = useState(true);
  const [secondPlanetName, setSecondPlanetName] = useState<string>('Kepler-452 b');

  // Gravity Calculator Weight state
  const [userWeightKg, setUserWeightKg] = useState<number>(70);
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');

  const targetPlanet = useMemo(() => {
    return (
      planets.find((p) => p.pl_name.toLowerCase() === selectedPlanetName.toLowerCase()) ||
      planets[0]
    );
  }, [planets, selectedPlanetName]);

  const secondPlanet = useMemo(() => {
    if (compareToEarth) return null;
    return (
      planets.find((p) => p.pl_name.toLowerCase() === secondPlanetName.toLowerCase()) ||
      planets[1]
    );
  }, [planets, secondPlanetName, compareToEarth]);

  // Surface gravity calculation for target planet
  const targetGravity = calculateSurfaceGravityRatio(
    targetPlanet?.pl_bmasse ?? null,
    targetPlanet?.pl_rade ?? null
  );

  // Compute scale reading
  const displayEarthWeight = weightUnit === 'kg' ? userWeightKg : Number((userWeightKg * 2.20462).toFixed(1));
  const scaleReadingKg =
    targetGravity.status === 'valid' && targetGravity.ratio != null
      ? Number((userWeightKg * targetGravity.ratio).toFixed(1))
      : null;
  const scaleReadingDisplay =
    scaleReadingKg != null
      ? weightUnit === 'kg'
        ? `${scaleReadingKg} kg`
        : `${(scaleReadingKg * 2.20462).toFixed(1)} lbs`
      : 'N/A';

  const percentageDelta =
    targetGravity.status === 'valid' && targetGravity.ratio != null
      ? Math.round((targetGravity.ratio - 1.0) * 100)
      : null;

  return (
    <div className="max-w-7xl mx-auto px-4 space-y-12">
      {/* Section Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-800/40 text-xs font-medium text-cyan-300 mb-2">
          <Scale className="w-3.5 h-3.5" />
          <span>Comparative Astrophysics</span>
        </div>
        <h2 className="text-3xl font-bold text-white tracking-tight">Earth Comparison Lab</h2>
        <p className="text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
          Directly evaluate exoplanetary physical dimensions, atmospheres, and gravitational dynamics alongside Earth or another world.
        </p>
      </div>

      {/* Selector Toolbar */}
      <div className="p-5 rounded-2xl bg-[#080c18] border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <label className="text-xs font-semibold uppercase text-slate-400 whitespace-nowrap">
            Target World:
          </label>
          <select
            value={selectedPlanetName}
            onChange={(e) => setSelectedPlanetName(e.target.value)}
            className="w-full md:w-64 py-2 px-3 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 font-medium"
          >
            {planets.map((p) => (
              <option key={p.pl_name} value={p.pl_name}>
                {p.pl_name} ({p.pl_rade ? `${p.pl_rade} R⊕` : 'Unmeasured R'})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => setCompareToEarth(!compareToEarth)}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-400" />
            <span>{compareToEarth ? 'Compare With Another Exoplanet' : 'Compare With Earth'}</span>
          </button>

          {!compareToEarth && (
            <select
              value={secondPlanetName}
              onChange={(e) => setSecondPlanetName(e.target.value)}
              className="w-full md:w-64 py-2 px-3 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 font-medium"
            >
              {planets
                .filter((p) => p.pl_name !== selectedPlanetName)
                .map((p) => (
                  <option key={p.pl_name} value={p.pl_name}>
                    {p.pl_name}
                  </option>
                ))}
            </select>
          )}
        </div>
      </div>

      {/* Signature Feature: "How Much Would You Weigh There?" Gravity Calculator */}
      <section className="p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-[#090e1f] to-[#070b16] border border-cyan-500/30 shadow-2xl relative overflow-hidden">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">
                Signature Tool
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                How Much Would You Weigh on {targetPlanet.pl_name}?
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Unit:</span>
              <div className="flex items-center p-0.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                <button
                  onClick={() => setWeightUnit('kg')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    weightUnit === 'kg' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Kilograms (kg)
                </button>
                <button
                  onClick={() => setWeightUnit('lbs')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    weightUnit === 'lbs' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Pounds (lbs)
                </button>
              </div>
            </div>
          </div>

          {/* User Input & Computation Display */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Input Box */}
            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <label className="block text-xs font-semibold text-slate-300">
                Enter Your Weight on Earth ({weightUnit})
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="20"
                  max="300"
                  value={weightUnit === 'kg' ? userWeightKg : Math.round(userWeightKg * 2.20462)}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val > 0) {
                      setUserWeightKg(weightUnit === 'kg' ? val : Number((val / 2.20462).toFixed(1)));
                    }
                  }}
                  className="w-full py-2.5 px-3 text-lg font-mono font-bold rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                />
                <span className="text-sm font-mono text-slate-400">{weightUnit}</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Standard terrestrial baseline gravitational acceleration: 9.807 m/s² (1.00 g).
              </p>
            </div>

            {/* Equivalent Reading Card */}
            <div className="md:col-span-2 p-5 rounded-xl bg-[#0b1226] border border-cyan-500/40 space-y-3">
              {targetGravity.status === 'valid' ? (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-cyan-300 font-semibold uppercase">
                      Equivalent Spring-Scale Reading
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      g/g⊕ = {targetGravity.ratio}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-extrabold font-mono text-white tracking-tight">
                      {scaleReadingDisplay}
                    </span>
                    {percentageDelta !== null && (
                      <span
                        className={`text-sm font-semibold font-mono ${
                          percentageDelta > 0
                            ? 'text-rose-400'
                            : percentageDelta < 0
                            ? 'text-emerald-400'
                            : 'text-slate-300'
                        }`}
                      >
                        {percentageDelta > 0 ? `+${percentageDelta}%` : `${percentageDelta}%`} vs Earth
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    If you weigh {displayEarthWeight} {weightUnit} on Earth, a calibrated scale on the surface of{' '}
                    <strong className="text-white">{targetPlanet.pl_name}</strong> would read approximately{' '}
                    <strong className="text-cyan-300">{scaleReadingDisplay}</strong>.
                  </p>
                </div>
              ) : (
                <div className="flex items-start gap-3 py-2 text-amber-300">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
                  <div>
                    <h5 className="text-xs font-bold text-amber-300 uppercase">
                      Theoretical Gravity Cannot Be Computed
                    </h5>
                    <p className="text-xs text-slate-400 mt-1">
                      {targetGravity.message} Scientific rigor prohibits inventing unmeasured parameters.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Scientific Qualification Callout */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-slate-300">
              <Info className="w-4 h-4 text-cyan-400" />
              <span>Scientific Qualification & Physics Principles</span>
            </div>
            <p className="leading-relaxed">
              This calculation represents <strong>theoretical surface gravity</strong> based on Newton’s Universal Gravitation: <code className="text-cyan-300 font-mono">g_planet / g_earth = (M_planet / M_earth) / (R_planet / R_earth)²</code>. It assumes an idealized non-rotating spherical body. It does not account for centrifugal reduction from planetary spin, atmospheric buoyancy, or local topographical variation.
            </p>
            <p className="leading-relaxed text-slate-400">
              <strong>Mass vs. Weight:</strong> Remember that your <em>mass</em> (inertia, amount of matter) remains identical across the universe. Only your <em>weight</em> (the downward normal force on a scale) changes due to local gravitational acceleration.
            </p>
          </div>
        </div>
      </section>

      {/* Side-by-Side Parameter Matrix */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white tracking-tight">Direct Physical Comparison</h3>
          <span className="text-xs text-slate-400">NASA Empirical Values</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Reference (Earth or Planet 2) */}
          <div className="p-5 rounded-2xl bg-[#080c18] border border-slate-800 space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <span className="text-xs font-mono text-cyan-400 block uppercase">
                {compareToEarth ? 'Solar System Reference' : 'Comparison Subject'}
              </span>
              <h4 className="text-xl font-bold text-white">
                {compareToEarth ? 'Earth (Sol d)' : secondPlanet?.pl_name}
              </h4>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Mass:</span>
                <span className="font-mono text-white font-semibold">
                  {compareToEarth ? '1.00 M⊕ (5.972 × 10²⁴ kg)' : `${secondPlanet?.pl_bmasse ?? 'N/A'} M⊕`}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Radius:</span>
                <span className="font-mono text-white font-semibold">
                  {compareToEarth ? '1.00 R⊕ (6,371 km)' : `${secondPlanet?.pl_rade ?? 'N/A'} R⊕`}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Surface Gravity:</span>
                <span className="font-mono text-white font-semibold">
                  {compareToEarth ? '1.00 g (9.807 m/s²)' : 'Calculated in Lab'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Orbital Period:</span>
                <span className="font-mono text-white font-semibold">
                  {compareToEarth ? '365.25 days (1.00 year)' : `${secondPlanet?.pl_orbper?.toFixed(2) ?? 'N/A'} days`}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Semi-major Axis:</span>
                <span className="font-mono text-white font-semibold">
                  {compareToEarth ? '1.00 AU (149.6M km)' : `${secondPlanet?.pl_orbsmax ?? 'N/A'} AU`}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Equilibrium Temp:</span>
                <span className="font-mono text-white font-semibold">
                  {compareToEarth ? '255 K (-18 °C without greenhouse)' : formatKelvinAndCelsius(secondPlanet?.pl_eqt ?? null)}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400">Host Star:</span>
                <span className="font-mono text-white font-semibold">
                  {compareToEarth ? 'The Sun (G2V Yellow Dwarf)' : `${secondPlanet?.hostname} (${secondPlanet?.st_spectype || 'N/A'})`}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Selected Target Exoplanet */}
          <div className="p-5 rounded-2xl bg-[#080c18] border border-cyan-500/30 space-y-4">
            <div className="border-b border-slate-800 pb-3 flex items-start justify-between">
              <div>
                <span className="text-xs font-mono text-cyan-400 block uppercase">Target World</span>
                <h4 className="text-xl font-bold text-white">{targetPlanet.pl_name}</h4>
              </div>
              <button
                onClick={() => onSelectPlanet(targetPlanet)}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium underline"
              >
                Inspect 3D Profile
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Mass:</span>
                <span className="font-mono text-white font-semibold">
                  {targetPlanet.pl_bmasse ? `${targetPlanet.pl_bmasse} M⊕` : 'Unmeasured'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Radius:</span>
                <span className="font-mono text-white font-semibold">
                  {targetPlanet.pl_rade ? `${targetPlanet.pl_rade} R⊕` : 'Unmeasured'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Surface Gravity:</span>
                <span className="font-mono text-white font-semibold">
                  {targetGravity.status === 'valid' ? `${targetGravity.ratio} g` : 'Unavailable'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Orbital Period:</span>
                <span className="font-mono text-white font-semibold">
                  {targetPlanet.pl_orbper ? `${targetPlanet.pl_orbper.toFixed(2)} days` : 'N/A'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Semi-major Axis:</span>
                <span className="font-mono text-white font-semibold">
                  {targetPlanet.pl_orbsmax ? `${targetPlanet.pl_orbsmax} AU` : 'N/A'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Equilibrium Temp:</span>
                <span className="font-mono text-white font-semibold">
                  {formatKelvinAndCelsius(targetPlanet.pl_eqt)}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400">Host Star:</span>
                <span className="font-mono text-white font-semibold">
                  {targetPlanet.hostname} ({targetPlanet.st_spectype || 'Unclassified'})
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
