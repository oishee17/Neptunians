import { useState, useMemo } from 'react';
import { ExoplanetData } from '../../types/exoplanet';
import { useAuth } from '../../context/AuthContext';
import { classifyPlanetSize, formatKelvinAndCelsius } from '../../utils/astronomy';
import {
  Bookmark,
  Trash2,
  ArrowRight,
  Download,
  Scale,
  Compass,
  Cloud,
  CloudOff,
  FolderPlus,
  Plus,
  FileText,
  Edit3,
  Check,
  X,
  Layers,
} from 'lucide-react';

interface SavedPlanetsViewProps {
  planets: ExoplanetData[];
  onSelectPlanet: (planet: ExoplanetData) => void;
  onComparePlanet: (planet: ExoplanetData) => void;
  onNavigateTab: (tab: string) => void;
  onOpenAuth: () => void;
}

export function SavedPlanetsView({
  planets,
  onSelectPlanet,
  onComparePlanet,
  onNavigateTab,
  onOpenAuth,
}: SavedPlanetsViewProps) {
  const {
    user,
    savedItems,
    collections,
    toggleSavePlanet,
    updatePlanetNotes,
    createCollection,
    deleteCollection,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'all' | 'collections'>('all');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);

  // New Collection Modal / Form state
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColDesc, setNewColDesc] = useState('');

  // Editing notes state
  const [editingPlanetName, setEditingPlanetName] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState('');

  const savedPlanetNames = useMemo(() => savedItems.map((i) => i.planetName), [savedItems]);

  const savedPlanets = useMemo(() => {
    return planets.filter((p) => savedPlanetNames.includes(p.pl_name));
  }, [planets, savedPlanetNames]);

  // Active collection filter
  const displayedPlanets = useMemo(() => {
    if (activeTab === 'collections' && selectedCollectionId) {
      const col = collections.find((c) => c.id === selectedCollectionId);
      if (col) {
        return planets.filter((p) => col.planetNames.includes(p.pl_name));
      }
    }
    return savedPlanets;
  }, [activeTab, selectedCollectionId, collections, planets, savedPlanets]);

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) return;
    try {
      const created = await createCollection(newColName, newColDesc, []);
      setSelectedCollectionId(created.id);
      setNewColName('');
      setNewColDesc('');
      setIsCreatingCollection(false);
    } catch (err: any) {
      alert(err.message || 'Failed to create collection');
    }
  };

  const handleSaveNote = async (planetName: string) => {
    await updatePlanetNotes(planetName, tempNote);
    setEditingPlanetName(null);
  };

  const exportSavedJSON = () => {
    const exportData = {
      user: user ? { email: user.email, displayName: user.displayName } : 'guest',
      exportedAt: new Date().toISOString(),
      savedWorlds: savedItems.map((item) => {
        const fullPlanet = planets.find((p) => p.pl_name === item.planetName);
        return {
          ...item,
          details: fullPlanet || null,
        };
      }),
      collections: collections,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `neptunians_saved_collection_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/40 border border-amber-800/40 text-xs font-medium text-amber-300">
              <Bookmark className="w-3.5 h-3.5" />
              <span>Personal Research Dossier</span>
            </div>

            {user ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-800/40 text-xs font-mono text-cyan-300">
                <Cloud className="w-3.5 h-3.5 text-cyan-400" />
                <span>Cloud Synced: {user.email}</span>
              </span>
            ) : (
              <button
                onClick={onOpenAuth}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-700 hover:border-cyan-400 text-xs text-slate-300 hover:text-white transition-colors"
                title="Click to sign in and save to cloud"
              >
                <CloudOff className="w-3.5 h-3.5 text-slate-400" />
                <span>Local Storage (Click to Sign In & Sync)</span>
              </button>
            )}
          </div>

          <h2 className="text-3xl font-bold text-white tracking-tight">Saved Exoplanet Research</h2>
          <p className="text-sm text-slate-400 mt-1">
            {savedItems.length} {savedItems.length === 1 ? 'world' : 'worlds'} saved across {collections.length} custom collections
          </p>
        </div>

        {savedItems.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={exportSavedJSON}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 rounded-lg hover:text-white transition-colors"
              title="Download backup file"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export Dossier (JSON)</span>
            </button>
          </div>
        )}
      </div>

      {/* Tabs: All Saved vs Collections */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveTab('all');
              setSelectedCollectionId(null);
            }}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'all'
                ? 'bg-slate-800 text-cyan-300 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Saved Worlds ({savedItems.length})
          </button>

          <button
            onClick={() => setActiveTab('collections')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'collections'
                ? 'bg-slate-800 text-cyan-300 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Custom Collections ({collections.length})
          </button>
        </div>

        {activeTab === 'collections' && (
          <button
            onClick={() => {
              if (!user) {
                onOpenAuth();
              } else {
                setIsCreatingCollection(true);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>New Collection</span>
          </button>
        )}
      </div>

      {/* New Collection Modal */}
      {isCreatingCollection && (
        <div className="p-5 rounded-2xl bg-[#080c18] border border-cyan-500/40 space-y-4 max-w-lg">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white">Create New Research Collection</h4>
            <button
              onClick={() => setIsCreatingCollection(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleCreateCollection} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Collection Name</label>
              <input
                type="text"
                required
                value={newColName}
                onChange={(e) => setNewColName(e.target.value)}
                placeholder="e.g. JWST Atmospheric Targets, Terrestrial Worlds..."
                className="w-full py-2 px-3 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Description (Optional)</label>
              <input
                type="text"
                value={newColDesc}
                onChange={(e) => setNewColDesc(e.target.value)}
                placeholder="Brief objective of this research dossier"
                className="w-full py-2 px-3 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreatingCollection(false)}
                className="px-3 py-1.5 text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 font-semibold text-white transition-colors"
              >
                Create Collection
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Collections Strip */}
      {activeTab === 'collections' && collections.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
          {collections.map((col) => {
            const isSelected = selectedCollectionId === col.id;
            return (
              <div
                key={col.id}
                onClick={() => setSelectedCollectionId(col.id)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-mono rounded-xl border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-md'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-sans font-medium text-white">{col.name}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                  {col.planetNames.length}
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete collection "${col.name}"?`)) {
                      deleteCollection(col.id);
                    }
                  }}
                  className="p-1 hover:text-rose-400 text-slate-500 transition-colors ml-1"
                  title="Delete collection"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Grid Content */}
      {displayedPlanets.length === 0 ? (
        <div className="p-16 rounded-2xl bg-slate-900/30 border border-slate-800 text-center space-y-4 max-w-md mx-auto">
          <Bookmark className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Worlds in this View</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            {activeTab === 'collections'
              ? 'This custom collection currently has no planets assigned. Add worlds from the catalog!'
              : 'Click the bookmark icon on any exoplanet in the Catalog to save it to your dossier.'}
          </p>
          <button
            onClick={() => onNavigateTab('catalog')}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Browse Catalog</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedPlanets.map((planet) => {
            const size = classifyPlanetSize(planet.pl_rade);
            const savedItem = savedItems.find((i) => i.planetName === planet.pl_name);
            const isEditingNote = editingPlanetName === planet.pl_name;

            return (
              <div
                key={planet.pl_name}
                className="group relative flex flex-col justify-between p-5 rounded-2xl bg-[#080c18] border border-slate-800 hover:border-slate-700 transition-all shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-xs text-slate-400 block">Host: {planet.hostname}</span>
                      <h4 className="text-lg font-bold text-white">{planet.pl_name}</h4>
                    </div>

                    <button
                      onClick={() => toggleSavePlanet(planet.pl_name)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors rounded-md hover:bg-slate-800"
                      title="Remove from saved"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400 my-2">
                    <span className={size.color}>{size.label}</span>
                    <span aria-hidden="true">·</span>
                    <span>{planet.dist_ly ? `${planet.dist_ly} ly` : 'Dist. unk.'}</span>
                    <span aria-hidden="true">·</span>
                    <span>{planet.disc_year}</span>
                  </div>

                  {/* Physical metrics */}
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-xs font-mono">
                    <div>
                      <span className="text-slate-400 block text-[10px] font-sans uppercase">Radius</span>
                      <span className="text-white">{planet.pl_rade ? `${planet.pl_rade} R⊕` : 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-sans uppercase">Mass</span>
                      <span className="text-white">{planet.pl_bmasse ? `${planet.pl_bmasse} M⊕` : 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-sans uppercase">Period</span>
                      <span className="text-white">{planet.pl_orbper ? `${planet.pl_orbper.toFixed(1)} d` : 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-sans uppercase">Teq</span>
                      <span className="text-cyan-300">{formatKelvinAndCelsius(planet.pl_eqt)}</span>
                    </div>
                  </div>

                  {/* Personal Research Notes */}
                  <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span className="flex items-center gap-1 text-slate-300 font-medium">
                        <FileText className="w-3 h-3 text-cyan-400" />
                        <span>Research Notes</span>
                      </span>

                      {!isEditingNote && (
                        <button
                          onClick={() => {
                            setEditingPlanetName(planet.pl_name);
                            setTempNote(savedItem?.notes || '');
                          }}
                          className="hover:text-cyan-300 transition-colors"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {isEditingNote ? (
                      <div className="space-y-2 mt-1">
                        <textarea
                          rows={2}
                          value={tempNote}
                          onChange={(e) => setTempNote(e.target.value)}
                          placeholder="Add research observations, spectral signatures..."
                          className="w-full p-2 text-xs rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                        />
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => setEditingPlanetName(null)}
                            className="px-2 py-0.5 text-slate-400 hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveNote(planet.pl_name)}
                            className="px-2.5 py-0.5 rounded bg-cyan-600 hover:bg-cyan-500 font-semibold text-white"
                          >
                            Save Note
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-400 text-[11px] italic bg-slate-900/40 p-2 rounded-lg border border-slate-800/60">
                        {savedItem?.notes || 'No notes added yet. Click edit to add observations.'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
                  <button
                    onClick={() => onComparePlanet(planet)}
                    className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors"
                  >
                    <Scale className="w-3.5 h-3.5 text-amber-400" />
                    <span>Compare in Lab</span>
                  </button>

                  <button
                    onClick={() => onSelectPlanet(planet)}
                    className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
                  >
                    <span>Inspect</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
