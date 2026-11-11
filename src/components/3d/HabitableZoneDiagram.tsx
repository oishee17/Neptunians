import { ExoplanetData } from '../../types/exoplanet';
import { calculateHabitableZone, getStarColor } from '../../utils/astronomy';
import { Info, AlertCircle, CheckCircle2 } from 'lucide-react';

interface HabitableZoneDiagramProps {
  planet: ExoplanetData;
  height?: number;
}

export function HabitableZoneDiagram({
  planet,
  height = 360,
}: HabitableZoneDiagramProps) {
  const hz = calculateHabitableZone(planet);
  const starColor = getStarColor(planet.st_spectype, planet.st_teff);

  // If insufficient data to compute zone boundaries
  if (hz.status === 'insufficient_data' || hz.innerAU == null || hz.outerAU == null) {
    return (
      <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center">
        <AlertCircle className="w-8 h-8 text-amber-400 mb-2" />
        <h4 className="text-sm font-semibold text-slate-200">Habitable Zone Cannot Be Computed</h4>
        <p className="text-xs text-slate-400 max-w-md mt-1">
          {hz.description} NASA records do not currently provide sufficient stellar luminosity or effective temperature measurements for {planet.hostname}.
        </p>
      </div>
    );
  }

  // Dimension calculations for SVG
  const width = 640;
  const cx = width / 2;
  const cy = height / 2;

  // Scaling factor: ensure outer optimistic boundary + planet fits comfortably
  const maxAU = Math.max(
    hz.optimisticOuterAU || hz.outerAU * 1.25,
    (planet.pl_orbsmax || 0) * 1.25,
    0.1
  );
  const maxRadiusPx = Math.min(cx, cy) - 45;
  const scale = maxRadiusPx / maxAU;

  const rConsInner = hz.innerAU * scale;
  const rConsOuter = hz.outerAU * scale;
  const rOptInner = (hz.optimisticInnerAU || hz.innerAU * 0.9) * scale;
  const rOptOuter = (hz.optimisticOuterAU || hz.outerAU * 1.15) * scale;

  const planetOrbAU = planet.pl_orbsmax;
  const planetRPx = planetOrbAU ? planetOrbAU * scale : null;

  return (
    <div className="w-full flex flex-col rounded-2xl border border-slate-800 bg-[#070a14] p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            Circumstellar Habitable Zone Diagram
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Kopparapu et al. stellar flux limits based on host star {planet.hostname} (Teff: {planet.st_teff ? `${planet.st_teff} K` : 'Estimated'})
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {hz.status === 'conservative' && (
            <span className="flex items-center gap-1.5 text-emerald-400 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Conservative HZ
            </span>
          )}
          {hz.status === 'optimistic' && (
            <span className="flex items-center gap-1.5 text-cyan-400 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Optimistic HZ
            </span>
          )}
          {hz.status === 'too_hot' && (
            <span className="flex items-center gap-1.5 text-rose-400 font-mono">
              Too Hot (Interior)
            </span>
          )}
          {hz.status === 'too_cold' && (
            <span className="flex items-center gap-1.5 text-blue-400 font-mono">
              Too Cold (Exterior)
            </span>
          )}
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full overflow-hidden flex items-center justify-center py-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-h-[380px] select-none">
          <defs>
            {/* Radial gradient for central star glow */}
            <radialGradient id="starGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={starColor} stopOpacity="1" />
              <stop offset="40%" stopColor={starColor} stopOpacity="0.4" />
              <stop offset="100%" stopColor={starColor} stopOpacity="0" />
            </radialGradient>

            {/* Pattern/Gradient for Habitable Zone Ring */}
            <radialGradient id="hzGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#059669" stopOpacity="0.05" />
              <stop offset="60%" stopColor="#10b981" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#065f46" stopOpacity="0.08" />
            </radialGradient>
          </defs>

          {/* Background grid lines */}
          <line x1={cx} y1={10} x2={cx} y2={height - 10} stroke="#1e293b" strokeDasharray="3 3" />
          <line x1={10} y1={cy} x2={width - 10} y2={cy} stroke="#1e293b" strokeDasharray="3 3" />

          {/* Optimistic Outer HZ Ring */}
          <circle
            cx={cx}
            cy={cy}
            r={rOptOuter}
            fill="none"
            stroke="#0ea5e9"
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity="0.5"
          />

          {/* Conservative HZ Ring Solid fill */}
          <circle
            cx={cx}
            cy={cy}
            r={rConsOuter}
            fill="url(#hzGradient)"
            stroke="#10b981"
            strokeWidth="1.5"
            opacity="0.8"
          />

          {/* Conservative Inner HZ Cutout / Ring */}
          <circle
            cx={cx}
            cy={cy}
            r={rConsInner}
            fill="#070a14"
            stroke="#10b981"
            strokeWidth="1.5"
            opacity="0.9"
          />

          {/* Optimistic Inner HZ Ring */}
          <circle
            cx={cx}
            cy={cy}
            r={rOptInner}
            fill="none"
            stroke="#0ea5e9"
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity="0.5"
          />

          {/* Host Star Corona Glow & Sphere */}
          <circle cx={cx} cy={cy} r="28" fill="url(#starGlow)" />
          <circle cx={cx} cy={cy} r="10" fill={starColor} />

          {/* Star label */}
          <text
            x={cx}
            y={cy - 16}
            textAnchor="middle"
            fill="#e2e8f0"
            fontSize="10"
            fontFamily="monospace"
          >
            {planet.hostname}
          </text>

          {/* Planet Orbit & Planet Position */}
          {planetRPx && (
            <>
              {/* Planetary Orbit Track */}
              <circle
                cx={cx}
                cy={cy}
                r={planetRPx}
                fill="none"
                stroke="#f43f5e"
                strokeWidth="1.5"
                strokeDasharray="5 3"
              />

              {/* Target Planet Marker at 35 degree offset */}
              {(() => {
                const angle = THREE_FIFTHS_RAD;
                const px = cx + Math.cos(angle) * planetRPx;
                const py = cy + Math.sin(angle) * planetRPx;
                return (
                  <g>
                    {/* Pulsing ring indication (pure static svg, compliant) */}
                    <circle cx={px} cy={py} r="12" fill="none" stroke="#f43f5e" strokeWidth="1" opacity="0.6" />
                    <circle cx={px} cy={py} r="5" fill="#f43f5e" />
                    <text
                      x={px + 10}
                      y={py - 8}
                      fill="#ffffff"
                      fontSize="11"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {planet.pl_name} ({planetOrbAU?.toFixed(3)} AU)
                    </text>
                  </g>
                );
              })()}
            </>
          )}

          {/* Boundary Labels */}
          <text
            x={cx + rConsInner + 4}
            y={cy - 6}
            fill="#34d399"
            fontSize="9"
            fontFamily="monospace"
          >
            Inner (Runaway Greenhouse): {hz.innerAU?.toFixed(3)} AU
          </text>
          <text
            x={cx + rConsOuter + 4}
            y={cy - 6}
            fill="#34d399"
            fontSize="9"
            fontFamily="monospace"
          >
            Outer (Max Greenhouse): {hz.outerAU?.toFixed(3)} AU
          </text>
        </svg>
      </div>

      {/* Scientific Legend & Cautionary Note */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-emerald-500/25 border border-emerald-500/60" />
            <span>Conservative Habitable Zone</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t border-dashed border-sky-400" />
            <span>Optimistic Boundaries</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Planet Orbit: {planet.pl_orbsmax ? `${planet.pl_orbsmax} AU` : 'Unknown'}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-slate-400 max-w-sm">
          <Info className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            Habitable zone candidacy signifies potential surface liquid water under an Earth-like atmosphere, NOT confirmed habitability or life.
          </span>
        </div>
      </div>
    </div>
  );
}

const THREE_FIFTHS_RAD = 0.65;
