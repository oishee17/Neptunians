import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, SavedPlanetItem, UserCollection, AuthContextType } from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'neptunians_auth_token';
const GUEST_SAVED_KEY = 'neptunians_saved_planets';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<User | null>(null);
  const [savedItems, setSavedItems] = useState<SavedPlanetItem[]>([]);
  const [collections, setCollections] = useState<UserCollection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Sync token changes to localStorage
  const updateToken = (newToken: string | null) => {
    setToken(newToken);
    if (newToken) {
      localStorage.setItem(TOKEN_KEY, newToken);
    } else {
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
      setCollections([]);
    }
  };

  // Fetch initial profile & user data if token exists
  useEffect(() => {
    if (!token) {
      // Load guest saved planets
      try {
        const stored = localStorage.getItem(GUEST_SAVED_KEY);
        const names: string[] = stored
          ? JSON.parse(stored)
          : ['TRAPPIST-1 e', 'Kepler-452 b', 'Proxima Centauri b'];
        setSavedItems(
          names.map((planetName) => ({
            planetName,
            savedAt: new Date().toISOString(),
          }))
        );
      } catch {
        setSavedItems([]);
      }
      setIsLoading(false);
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch('/api/auth/me', { headers }).then((r) => (r.ok ? r.json() : null)),
      fetch('/api/user/saved', { headers }).then((r) => (r.ok ? r.json() : null)),
      fetch('/api/user/collections', { headers }).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([userData, savedData, colData]) => {
        if (userData?.user) {
          setUser(userData.user);
          if (savedData?.saved) setSavedItems(savedData.saved);
          if (colData?.collections) setCollections(colData.collections);
        } else {
          // Token invalid or expired
          updateToken(null);
        }
      })
      .catch((err) => {
        console.error('Auth initialization error:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to authenticate.');
    }

    const data = await res.json();
    setUser(data.user);
    updateToken(data.token);

    // Fetch user's persistent cloud data
    const headers = { Authorization: `Bearer ${data.token}` };
    const [savedRes, colRes] = await Promise.all([
      fetch('/api/user/saved', { headers }),
      fetch('/api/user/collections', { headers }),
    ]);

    if (savedRes.ok) {
      const s = await savedRes.json();
      setSavedItems(s.saved || []);
    }
    if (colRes.ok) {
      const c = await colRes.json();
      setCollections(c.collections || []);
    }
  };

  const register = async (email: string, password: string, displayName?: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, displayName }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to register account.');
    }

    const data = await res.json();
    setUser(data.user);
    updateToken(data.token);

    const headers = { Authorization: `Bearer ${data.token}` };
    const [savedRes, colRes] = await Promise.all([
      fetch('/api/user/saved', { headers }),
      fetch('/api/user/collections', { headers }),
    ]);

    if (savedRes.ok) {
      const s = await savedRes.json();
      setSavedItems(s.saved || []);
    }
    if (colRes.ok) {
      const c = await colRes.json();
      setCollections(c.collections || []);
    }
  };

  const logout = () => {
    if (token) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    updateToken(null);
  };

  const toggleSavePlanet = async (planetName: string, notes?: string) => {
    if (!token) {
      // Local guest storage
      setSavedItems((prev) => {
        const idx = prev.findIndex((i) => i.planetName.toLowerCase() === planetName.toLowerCase());
        let updated: SavedPlanetItem[];
        if (idx >= 0) {
          updated = prev.filter((_, i) => i !== idx);
        } else {
          updated = [...prev, { planetName, savedAt: new Date().toISOString(), notes }];
        }
        localStorage.setItem(
          GUEST_SAVED_KEY,
          JSON.stringify(updated.map((i) => i.planetName))
        );
        return updated;
      });
      return;
    }

    // Authenticated cloud persistence
    const res = await fetch('/api/user/saved/toggle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ planetName, notes }),
    });

    if (res.ok) {
      const data = await res.json();
      setSavedItems(data.saved || []);
    }
  };

  const updatePlanetNotes = async (planetName: string, notes: string) => {
    if (!token) {
      setSavedItems((prev) =>
        prev.map((i) =>
          i.planetName.toLowerCase() === planetName.toLowerCase() ? { ...i, notes } : i
        )
      );
      return;
    }

    const res = await fetch('/api/user/saved/notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ planetName, notes }),
    });

    if (res.ok) {
      const data = await res.json();
      setSavedItems(data.saved || []);
    }
  };

  const createCollection = async (name: string, description?: string, planetNames: string[] = []) => {
    if (!token) {
      throw new Error('Please sign in or create an account to organize custom collections in the cloud.');
    }

    const res = await fetch('/api/user/collections', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, description, planetNames }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create collection.');
    }

    const data = await res.json();
    setCollections((prev) => [...prev, data.collection]);
    return data.collection;
  };

  const updateCollection = async (
    id: string,
    updates: Partial<Pick<UserCollection, 'name' | 'description' | 'planetNames'>>
  ) => {
    if (!token) {
      throw new Error('Please sign in to update collections.');
    }

    const res = await fetch(`/api/user/collections/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update collection.');
    }

    const data = await res.json();
    setCollections((prev) => prev.map((c) => (c.id === id ? data.collection : c)));
  };

  const deleteCollection = async (id: string) => {
    if (!token) return;

    const res = await fetch(`/api/user/collections/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      setCollections((prev) => prev.filter((c) => c.id !== id));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        savedItems,
        collections,
        login,
        register,
        logout,
        toggleSavePlanet,
        updatePlanetNotes,
        createCollection,
        updateCollection,
        deleteCollection,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
