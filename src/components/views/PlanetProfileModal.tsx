import { useState } from 'react';
import { ExoplanetData } from '../../types/exoplanet';
import {
  classifyPlanetSize,
  calculateSurfaceGravityRatio,
  formatKelvinAndCelsius,
  getStarColor,
} from '../../utils/astronomy';
import { Planet3DViewer } from '../3d/Planet3DViewer';
import { HabitableZoneDiagram } from '../3d/HabitableZoneDiagram';
import {
  X,
  Share2,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Sparkles,
  Info,
  Check,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface PlanetProfileModalProps {
  planet: ExoplanetData;
  onClose: () => void;
  isSaved: boolean;
  onToggleSave: () => void;
  onOpenAIWithPlanet: (planet: ExoplanetData) => void;
  onCompareWithPlanet: (planet: ExoplanetData) => void;
}

export function PlanetProfileModal({
  planet,
  onClose,
  isSaved,
  onToggleSave,
  onOpenAIWithPlanet,
  onCompareWithPlanet,
}: PlanetProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'3d' | 'hz' | 'earth_scale'>('3d');
  const [copied, setCopied] = useState(false);

  const sizeInfo = classifyPlanetSize(planet.pl_rade);
  const gravityInfo = calculateSurfaceGravityRatio(planet.pl_bmasse, planet.pl_rade);
  const starColor = getStarColor(planet.st_spectype, planet.st_teff);

  const handleCopyLink = () => {
    const url = `${window.location.origin}?planet=${encodeURIComponent(planet.pl_name)}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl my-auto rounded-2xl bg-[#070b16] border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Host Star: {planet.hostname}</span>
              <span aria-hidden="true">·</span>
              <span className={sizeInfo.color}>{sizeInfo.label}</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">{planet.pl_name}</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              title="Copy shareable link"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Share'}</span>
            </button>

            <button
              onClick={onToggleSave}
              className={`p-2 rounded-lg border transition-colors ${
                isSaved
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
              title={isSaved ? 'Remove from saved' : 'Save planet'}
            >
              {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Visual Showcase (3D Viewer / Habitable Zone / Earth Scale) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => setActiveTab('3d')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    activeTab === '3d'
                      ? 'bg-slate-800 text-cyan-400 font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Interactive 3D Globe
                </button>
                <button
                  onClick={() => setActiveTab('hz')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    activeTab === 'hz'
                      ? 'bg-slate-800 text-cyan-400 font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Habitable Zone Orbit
                </button>
                <button
                  onClick={() => setActiveTab('earth_scale')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    activeTab === 'earth_scale'
                      ? 'bg-slate-800 text-cyan-400 font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Earth Size Scale
                </button>
              </div>

              <span className="text-[11px] text-slate-400">
                Artistic visual representation based on physical parameters
              </span>
            </div>

            {activeTab === '3d' && (
              <Planet3DViewer planet={planet} height="360px" />
            )}

            {activeTab === 'hz' && (
              <HabitableZoneDiagram planet={planet} height={360} />
            )}

            {activeTab === 'earth_scale' && (
              <div className="p-6 rounded-2xl bg-[#060812] border border-slate-800 flex flex-col items-center justify-center min-h-[360px]">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-6">
                  Physical Radius Comparison vs Earth
                </h4>
                <div className="flex items-end justify-center gap-12 max-w-lg w-full">
                  {/* Earth */}
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 via-sky-400 to-emerald-500 shadow-lg shadow-sky-900/30 mb-3 border border-sky-300/40" />
                    <span className="text-sm font-bold text-white">Earth</span>
                    <span className="text-xs font-mono text-slate-400">1.00 R⊕</span>
                    <span className="text-[10px] text-slate-400">6,371 km</span>
                  </div>

                  {/* Exoplanet */}
                  <div className="flex flex-col items-center text-center">
                    {planet.pl_rade ? (
                      (() => {
                        // Clamp scale for display between 12px and 160px
                        const diameterPx = Math.max(16, Math.min(180, 64 * planet.pl_rade));
                        return (
                          <div
                            style={{ width: `${diameterPx}px`, height: `${diameterPx}px` }}
                            className="rounded-full bg-gradient-to-tr from-cyan-600 via-sky-500 to-indigo-600 shadow-lg shadow-cyan-900/40 mb-3 border border-cyan-400/40"
                          />
                        );
                      })()
                    ) : (
                      <div className="w-16 h-16 rounded-full border border-dashed border-slate-700 flex items-center justify-center text-slate-400 text-xs mb-3">
                        Unknown
                      </div>
                    )}
                    <span className="text-sm font-bold text-cyan-300">{planet.pl_name}</span>
                    <span className="text-xs font-mono text-slate-300">
                      {planet.pl_rade ? `${planet.pl_rade} R⊕` : 'Radius unmeasured'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {planet.pl_rade
                        ? `~${Math.round(planet.pl_rade * 6371).toLocaleString()} km`
                        : 'Requires transit detection'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Scientific Highlights & Overview */}
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800">
            <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-cyan-300">
              <Sparkles className="w-4 h-4" />
              <span>Scientific Significance</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {planet.summary ||
                `${planet.pl_name} orbits the ${planet.st_spectype || 'main-sequence'} star ${
                  planet.hostname
                } at an estimated distance of ${planet.dist_ly ?? 'N/A'} light-years from Earth. Confirmed in ${
                  planet.disc_year
                } via ${planet.discoverymethod} using ${
                  planet.disc_facility
                }, this world represents a key reference in our understanding of exoplanetary demographics.`}
            </p>
          </div>

          {/* Physical & Stellar Parameters Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Planetary Physical Characteristics */}
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-2">
                Planetary Characteristics
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Size Classification:</span>
                  <span className={`font-semibold ${sizeInfo.color}`}>{sizeInfo.label}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Radius:</span>
                  <span className="font-mono text-white">
                    {planet.pl_rade ? `${planet.pl_rade} R⊕ (${(planet.pl_rade / 11.21).toFixed(2)} RJ)` : 'Not measured'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Mass:</span>
                  <span className="font-mono text-white">
                    {planet.pl_bmasse
                      ? `${planet.pl_bmasse} M⊕ (${(planet.pl_bmasse / 317.8).toFixed(3)} MJ)`
                      : 'Not measured'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Theoretical Surface Gravity:</span>
                  <span className="font-mono text-white">
                    {gravityInfo.status === 'valid'
                      ? `${gravityInfo.ratio} g (relative to Earth)`
                      : 'Unavailable (requires M & R)'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Orbital Period:</span>
                  <span className="font-mono text-white">
                    {planet.pl_orbper ? `${planet.pl_orbper.toFixed(3)} Earth days` : 'N/A'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Semi-major Axis:</span>
                  <span className="font-mono text-white">
                    {planet.pl_orbsmax ? `${planet.pl_orbsmax} AU` : 'N/A'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Orbital Eccentricity:</span>
                  <span className="font-mono text-white">
                    {planet.pl_orbeccen != null ? planet.pl_orbeccen : 'Circular (assumed ~0)'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Equilibrium Temp (Teq):</span>
                  <span className="font-mono text-cyan-300">
                    {formatKelvinAndCelsius(planet.pl_eqt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Host Star Characteristics */}
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-2">
                Host Star ({planet.hostname})
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Spectral Type:</span>
                  <span className="font-mono font-semibold" style={{ color: starColor }}>
                    {planet.st_spectype || 'Unclassified'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Effective Temperature:</span>
                  <span className="font-mono text-white">
                    {planet.st_teff ? `${planet.st_teff} K` : 'Estimated'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Stellar Radius:</span>
                  <span className="font-mono text-white">
                    {planet.st_rad ? `${planet.st_rad} R☉ (Solar radii)` : 'N/A'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Stellar Mass:</span>
                  <span className="font-mono text-white">
                    {planet.st_mass ? `${planet.st_mass} M☉ (Solar masses)` : 'N/A'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Distance from Solar System:</span>
                  <span className="font-mono text-white">
                    {planet.dist_ly ? `${planet.dist_ly} light-years (${planet.sy_dist} pc)` : 'N/A'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Planets in System:</span>
                  <span className="font-mono text-white">{planet.sy_pnum} confirmed</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Discovery Facility:</span>
                  <span className="text-slate-200 truncate max-w-[200px]" title={planet.disc_facility}>
                    {planet.disc_facility}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Discovery Method:</span>
                  <span className="text-cyan-400">{planet.discoverymethod}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Scientific Transparency Notice */}
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 flex items-start gap-3 text-xs text-slate-400">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-slate-300 block">Measurement Transparency</span>
              <p>
                NASA Exoplanet Archive composite solutions prioritize high-precision peer-reviewed publications. Equilibrium temperature assumes a spherical blackbody with standard albedo and zero atmospheric greenhouse warming.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/60">
          <a
            href={`https://exoplanetarchive.ipac.caltech.edu/overview/${encodeURIComponent(planet.pl_name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <span>NASA Exoplanet Archive Record</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onCompareWithPlanet(planet)}
              className="px-4 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Compare in Lab
            </button>

            <button
              onClick={() => onOpenAIWithPlanet(planet)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-indigo-600 rounded-lg hover:opacity-90 transition-opacity"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask AI About This World</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
