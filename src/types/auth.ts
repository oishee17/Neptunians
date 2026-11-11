export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

export interface SavedPlanetItem {
  planetName: string;
  savedAt: string;
  notes?: string;
}

export interface UserCollection {
  id: string;
  userId: string;
  name: string;
  description?: string;
  planetNames: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  savedItems: SavedPlanetItem[];
  collections: UserCollection[];
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => void;
  toggleSavePlanet: (planetName: string, notes?: string) => Promise<void>;
  updatePlanetNotes: (planetName: string, notes: string) => Promise<void>;
  createCollection: (name: string, description?: string, planetNames?: string[]) => Promise<UserCollection>;
  updateCollection: (id: string, updates: Partial<Pick<UserCollection, 'name' | 'description' | 'planetNames'>>) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
}
