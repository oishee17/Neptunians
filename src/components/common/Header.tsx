import { Sparkles, Bookmark, Search, User, LogOut, Cloud } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  savedCount: number;
  onOpenSaved: () => void;
  onOpenAI: () => void;
  onOpenSearch: () => void;
  onOpenAuth: () => void;
}

export function Header({
  currentTab,
  onTabChange,
  savedCount,
  onOpenSaved,
  onOpenAI,
  onOpenSearch,
  onOpenAuth,
}: HeaderProps) {
  const { user, logout } = useAuth();
  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'catalog', label: 'Catalog' },
    { id: 'compare', label: 'Compare Lab' },
    { id: 'habitable', label: 'Habitable Zone' },
    { id: 'systems', label: 'Systems' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'science', label: 'Methodology' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#05070e]/85 backdrop-blur-md border-b border-slate-800/80 px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => onTabChange('home')}
          className="flex items-center gap-2.5 text-left group whitespace-nowrap shrink-0"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 via-sky-500 to-indigo-600 flex items-center justify-center shadow-sm">
            <svg
              className="w-4 h-4 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="6" />
              <path d="M3 12c2.5-3.5 6.5-5.5 9-5.5s6.5 2 9 5.5-6.5 5.5-9 5.5-6.5-2-9-5.5z" />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight text-white group-hover:text-cyan-400 transition-colors">
            Neptunians
          </span>
        </button>

        {/* Zone 2: 4–7 clean single-line text navigation links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-400">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => onTabChange(link.id)}
              className={`transition-colors whitespace-nowrap shrink-0 py-1 ${
                currentTab === link.id
                  ? 'text-cyan-400 font-semibold border-b-2 border-cyan-400'
                  : 'hover:text-slate-200'
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Zone 3: 1 primary action / utility actions */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-400 bg-slate-900 border border-slate-800 rounded-lg hover:text-slate-200 hover:border-slate-700 transition-colors"
            title="Search exoplanets"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Search (Ctrl+K)</span>
          </button>

          <button
            onClick={onOpenSaved}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 rounded-lg hover:text-white hover:border-slate-700 transition-colors whitespace-nowrap shrink-0"
            title="View saved planets and collections"
          >
            <Bookmark className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Saved</span>
            <span className="font-mono text-cyan-400">({savedCount})</span>
          </button>

          <button
            onClick={onOpenAI}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 to-indigo-600 rounded-lg hover:opacity-90 transition-opacity shadow-sm whitespace-nowrap shrink-0"
            title="Ask Deep Space AI Assistant"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Deep Space AI</span>
          </button>

          {/* User Profile / Sign In */}
          {user ? (
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
              <button
                onClick={onOpenSaved}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-cyan-300 bg-slate-900 border border-cyan-500/30 rounded-lg hover:border-cyan-500 transition-colors"
                title={`Logged in as ${user.email} (Cloud Synced)`}
              >
                <Cloud className="w-3.5 h-3.5 text-cyan-400" />
                <span className="max-w-[100px] truncate">{user.displayName || user.email}</span>
              </button>
              <button
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                title="Sign out of account"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-lg transition-colors whitespace-nowrap shrink-0"
              title="Sign in to sync your worlds across devices"
            >
              <User className="w-3.5 h-3.5 text-sky-400" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Nav Bar */}
      <div className="flex lg:hidden overflow-x-auto gap-4 pt-3 mt-2 border-t border-slate-800/60 no-scrollbar text-xs font-medium text-slate-400">
        {navLinks.map((link) => (
          <button
            key={link.id}
            onClick={() => onTabChange(link.id)}
            className={`whitespace-nowrap shrink-0 pb-1 ${
              currentTab === link.id
                ? 'text-cyan-400 font-semibold border-b-2 border-cyan-400'
                : 'hover:text-slate-200'
            }`}
          >
            {link.label}
          </button>
        ))}
      </div>
    </header>
  );
}
