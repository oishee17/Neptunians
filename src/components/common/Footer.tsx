import { ExternalLink } from 'lucide-react';

interface FooterProps {
  onTabChange: (tab: string) => void;
}

export function Footer({ onTabChange }: FooterProps) {
  return (
    <footer className="border-t border-slate-800 bg-[#04060c] py-12 px-6 mt-20 text-xs text-slate-400">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-bold text-sm tracking-tight text-slate-200">Neptunians</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>Interactive Exoplanet Discovery Explorer</span>
          </div>
          <p className="max-w-md text-slate-400 leading-relaxed">
            Data sourced directly from the NASA Exoplanet Archive (Caltech/IPAC), providing verified astronomical parameters for worlds orbiting stars beyond our Solar System.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <button
            onClick={() => onTabChange('science')}
            className="hover:text-slate-200 transition-colors"
          >
            Scientific Methodology
          </button>
          <button
            onClick={() => onTabChange('habitable')}
            className="hover:text-slate-200 transition-colors"
          >
            Habitable Zone Physics
          </button>
          <button
            onClick={() => onTabChange('compare')}
            className="hover:text-slate-200 transition-colors"
          >
            Earth Comparison Lab
          </button>
          <a
            href="https://exoplanetarchive.ipac.caltech.edu"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <span>NASA Exoplanet Archive TAP</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400">
        <p>© {new Date().getFullYear()} Neptunians. For scientific research and public astronomy education.</p>
        <p>TAP Service: pscomppars / Composite Parameters</p>
      </div>
    </footer>
  );
}
