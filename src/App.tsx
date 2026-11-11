import { useState, useEffect } from 'react';
import { ExoplanetData, DiscoveryStats } from './types/exoplanet';
import { CURATED_EXOPLANETS } from '../server/data/fallbackPlanets';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { StarfieldCanvas } from './components/common/StarfieldCanvas';
import { HomeDashboard } from './components/views/HomeDashboard';
import { ExoplanetExplorer } from './components/views/ExoplanetExplorer';
import { PlanetProfileModal } from './components/views/PlanetProfileModal';
import { EarthComparisonLab } from './components/views/EarthComparisonLab';
import { HabitableZoneExplorer } from './components/views/HabitableZoneExplorer';
import { PlanetarySystemsView } from './components/views/PlanetarySystemsView';
import { DiscoveryTimeline } from './components/views/DiscoveryTimeline';
import { SavedPlanetsView } from './components/views/SavedPlanetsView';
import { ScientificMethodology } from './components/views/ScientificMethodology';
import { AIAssistantModal } from './components/views/AIAssistantModal';
import { AuthModal } from './components/auth/AuthModal';

function MainApp() {
  const { savedItems, toggleSavePlanet } = useAuth();

  // Navigation State
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [planets, setPlanets] = useState<ExoplanetData[]>(CURATED_EXOPLANETS);
  const [stats, setStats] = useState<DiscoveryStats | null>(null);
  const [featuredPlanets, setFeaturedPlanets] = useState<ExoplanetData[]>([]);

  // Selected Planet for Modal
  const [selectedPlanet, setSelectedPlanet] = useState<ExoplanetData | null>(null);

  // Modals
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiContextPlanet, setAiContextPlanet] = useState<ExoplanetData | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Search filter query passed between components
  const [catalogSearch, setCatalogSearch] = useState('');

  // Extract saved planet names array for fast lookups
  const savedPlanetNames = savedItems.map((i) => i.planetName);

  // Initial Data Fetching from NASA TAP endpoints
  useEffect(() => {
    // 1. Fetch Stats
    fetch('/api/nasa/stats')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setStats(data);
      })
      .catch((err) => console.warn('Stats fetch notice:', err.message));

    // 2. Fetch Featured Planets
    fetch('/api/nasa/featured')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.length > 0) {
          setFeaturedPlanets(data);
        } else {
          setFeaturedPlanets(CURATED_EXOPLANETS.slice(0, 8));
        }
      })
      .catch(() => setFeaturedPlanets(CURATED_EXOPLANETS.slice(0, 8)));

    // 3. Fetch Full Catalog Batch
    fetch('/api/nasa/planets?limit=1000')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.planets && data.planets.length > 0) {
          setPlanets(data.planets);

          // Check if URL has ?planet= query parameter
          const urlParams = new URLSearchParams(window.location.search);
          const planetParam = urlParams.get('planet');
          if (planetParam) {
            const matched = data.planets.find(
              (p: ExoplanetData) => p.pl_name.toLowerCase() === planetParam.toLowerCase()
            );
            if (matched) {
              setSelectedPlanet(matched);
            }
          }
        }
      })
      .catch((err) => console.warn('Catalog fetch notice:', err.message));
  }, []);

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCurrentTab('catalog');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#05070e] text-slate-100 flex flex-col selection:bg-cyan-500/25 selection:text-cyan-200">
      {/* Background Starfield Canvas */}
      <StarfieldCanvas />

      {/* Strict Top Bar Navigation */}
      <Header
        currentTab={currentTab}
        onTabChange={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        savedCount={savedPlanetNames.length}
        onOpenSaved={() => {
          setCurrentTab('saved');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAI={() => {
          setAiContextPlanet(selectedPlanet || null);
          setShowAIAssistant(true);
        }}
        onOpenSearch={() => {
          setCurrentTab('catalog');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAuth={() => setShowAuthModal(true)}
      />

      {/* Main View Router */}
      <main className="relative z-10 flex-1 pt-6 pb-12">
        {currentTab === 'home' && (
          <HomeDashboard
            stats={stats}
            featuredPlanets={featuredPlanets.length > 0 ? featuredPlanets : CURATED_EXOPLANETS.slice(0, 8)}
            onSelectPlanet={(p) => setSelectedPlanet(p)}
            onNavigateTab={(tab) => {
              setCurrentTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSearchSubmit={(q) => {
              setCatalogSearch(q);
              setCurrentTab('catalog');
            }}
            allPlanets={planets}
          />
        )}

        {currentTab === 'catalog' && (
          <ExoplanetExplorer
            planets={planets}
            onSelectPlanet={(p) => setSelectedPlanet(p)}
            savedPlanetNames={savedPlanetNames}
            onToggleSave={(name) => toggleSavePlanet(name)}
            initialSearch={catalogSearch}
          />
        )}

        {currentTab === 'compare' && (
          <EarthComparisonLab
            planets={planets}
            initialPlanet={selectedPlanet}
            onSelectPlanet={(p) => setSelectedPlanet(p)}
          />
        )}

        {currentTab === 'habitable' && (
          <HabitableZoneExplorer
            planets={planets}
            onSelectPlanet={(p) => setSelectedPlanet(p)}
          />
        )}

        {currentTab === 'systems' && (
          <PlanetarySystemsView
            planets={planets}
            onSelectPlanet={(p) => setSelectedPlanet(p)}
          />
        )}

        {currentTab === 'timeline' && (
          <DiscoveryTimeline
            planets={planets}
            onSelectPlanet={(p) => setSelectedPlanet(p)}
            onFilterByYear={(year) => {
              setCatalogSearch(String(year));
              setCurrentTab('catalog');
            }}
          />
        )}

        {currentTab === 'saved' && (
          <SavedPlanetsView
            planets={planets}
            onSelectPlanet={(p) => setSelectedPlanet(p)}
            onComparePlanet={(p) => {
              setSelectedPlanet(p);
              setCurrentTab('compare');
            }}
            onNavigateTab={(tab) => setCurrentTab(tab)}
            onOpenAuth={() => setShowAuthModal(true)}
          />
        )}

        {currentTab === 'science' && <ScientificMethodology />}
      </main>

      {/* Individual Planetary Profile Modal */}
      {selectedPlanet && (
        <PlanetProfileModal
          planet={selectedPlanet}
          onClose={() => setSelectedPlanet(null)}
          isSaved={savedPlanetNames.includes(selectedPlanet.pl_name)}
          onToggleSave={() => toggleSavePlanet(selectedPlanet.pl_name)}
          onOpenAIWithPlanet={(p) => {
            setAiContextPlanet(p);
            setShowAIAssistant(true);
          }}
          onCompareWithPlanet={(p) => {
            setSelectedPlanet(p);
            setCurrentTab('compare');
            setSelectedPlanet(null);
          }}
        />
      )}

      {/* AI Space Assistant Modal */}
      {showAIAssistant && (
        <AIAssistantModal
          onClose={() => setShowAIAssistant(false)}
          currentPlanet={aiContextPlanet}
          onSelectPlanetByName={(name) => {
            const found = planets.find((p) => p.pl_name.toLowerCase() === name.toLowerCase());
            if (found) setSelectedPlanet(found);
          }}
        />
      )}

      {/* Authentication Modal */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
        />
      )}

      {/* Footer */}
      <Footer onTabChange={(tab) => setCurrentTab(tab)} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
