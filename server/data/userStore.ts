import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE_PATH = path.resolve(__dirname, 'user_data.json');

export interface User {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
}

export interface Session {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
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

export interface UserDataStore {
  users: User[];
  sessions: Session[];
  savedPlanets: Record<string, SavedPlanetItem[]>; // userId -> saved items
  collections: Record<string, UserCollection[]>; // userId -> collections
}

// Initial state with a demo account for convenience
const initialStore: UserDataStore = {
  users: [],
  sessions: [],
  savedPlanets: {},
  collections: {},
};

function loadStore(): UserDataStore {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const data = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('[UserStore] Error loading user store:', err);
  }
  return initialStore;
}

function saveStore(store: UserDataStore) {
  try {
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('[UserStore] Error saving user store:', err);
  }
}

let memoryStore = loadStore();

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

export function registerUser(email: string, password: string, displayName?: string) {
  const normalizedEmail = email.toLowerCase().trim();

  if (memoryStore.users.some((u) => u.email === normalizedEmail)) {
    throw new Error('An account with this email address already exists.');
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(password, salt);
  const id = 'usr_' + crypto.randomBytes(12).toString('hex');

  const newUser: User = {
    id,
    email: normalizedEmail,
    displayName: displayName?.trim() || normalizedEmail.split('@')[0],
    passwordHash,
    salt,
    createdAt: new Date().toISOString(),
  };

  memoryStore.users.push(newUser);

  // Initialize empty saved list and default collection
  memoryStore.savedPlanets[id] = [
    { planetName: 'TRAPPIST-1 e', savedAt: new Date().toISOString(), notes: 'Primary target in conservative habitable zone' },
    { planetName: 'Kepler-452 b', savedAt: new Date().toISOString(), notes: 'Earth-size analog candidate orbiting G2V star' },
  ];

  memoryStore.collections[id] = [
    {
      id: 'col_' + crypto.randomBytes(8).toString('hex'),
      userId: id,
      name: 'Habitable Zone Candidates',
      description: 'Worlds within circumstellar habitable zone boundaries',
      planetNames: ['TRAPPIST-1 e', 'Kepler-452 b'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  saveStore(memoryStore);

  // Generate session token
  const token = 'tok_' + crypto.randomBytes(32).toString('hex');
  const session: Session = {
    token,
    userId: id,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(), // 30 days
  };

  memoryStore.sessions.push(session);
  saveStore(memoryStore);

  return {
    user: {
      id: newUser.id,
      email: newUser.email,
      displayName: newUser.displayName,
      createdAt: newUser.createdAt,
    },
    token,
  };
}

export function loginUser(email: string, password: string) {
  const normalizedEmail = email.toLowerCase().trim();
  const user = memoryStore.users.find((u) => u.email === normalizedEmail);

  if (!user) {
    throw new Error('Invalid email or password.');
  }

  const computedHash = hashPassword(password, user.salt);
  if (computedHash !== user.passwordHash) {
    throw new Error('Invalid email or password.');
  }

  const token = 'tok_' + crypto.randomBytes(32).toString('hex');
  const session: Session = {
    token,
    userId: user.id,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
  };

  memoryStore.sessions.push(session);
  saveStore(memoryStore);

  return {
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      createdAt: user.createdAt,
    },
    token,
  };
}

export function getUserByToken(token: string) {
  const session = memoryStore.sessions.find(
    (s) => s.token === token && new Date(s.expiresAt) > new Date()
  );
  if (!session) return null;

  const user = memoryStore.users.find((u) => u.id === session.userId);
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    createdAt: user.createdAt,
  };
}

export function logoutUser(token: string) {
  memoryStore.sessions = memoryStore.sessions.filter((s) => s.token !== token);
  saveStore(memoryStore);
}

export function getUserSavedPlanets(userId: string): SavedPlanetItem[] {
  return memoryStore.savedPlanets[userId] || [];
}

export function toggleUserSavedPlanet(userId: string, planetName: string, notes?: string) {
  if (!memoryStore.savedPlanets[userId]) {
    memoryStore.savedPlanets[userId] = [];
  }

  const list = memoryStore.savedPlanets[userId];
  const idx = list.findIndex((item) => item.planetName.toLowerCase() === planetName.toLowerCase());

  if (idx >= 0) {
    list.splice(idx, 1);
  } else {
    list.push({
      planetName,
      savedAt: new Date().toISOString(),
      notes: notes || undefined,
    });
  }

  saveStore(memoryStore);
  return list;
}

export function updateUserPlanetNotes(userId: string, planetName: string, notes: string) {
  if (!memoryStore.savedPlanets[userId]) return [];
  const list = memoryStore.savedPlanets[userId];
  const item = list.find((i) => i.planetName.toLowerCase() === planetName.toLowerCase());
  if (item) {
    item.notes = notes;
    saveStore(memoryStore);
  }
  return list;
}

export function getUserCollections(userId: string): UserCollection[] {
  return memoryStore.collections[userId] || [];
}

export function createCollection(
  userId: string,
  name: string,
  description?: string,
  planetNames: string[] = []
): UserCollection {
  if (!memoryStore.collections[userId]) {
    memoryStore.collections[userId] = [];
  }

  const newCol: UserCollection = {
    id: 'col_' + crypto.randomBytes(8).toString('hex'),
    userId,
    name: name.trim(),
    description: description?.trim(),
    planetNames,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  memoryStore.collections[userId].push(newCol);
  saveStore(memoryStore);
  return newCol;
}

export function updateCollection(
  userId: string,
  collectionId: string,
  updates: Partial<Pick<UserCollection, 'name' | 'description' | 'planetNames'>>
): UserCollection {
  if (!memoryStore.collections[userId]) {
    throw new Error('Collection not found');
  }

  const col = memoryStore.collections[userId].find((c) => c.id === collectionId);
  if (!col) {
    throw new Error('Collection not found');
  }

  if (updates.name !== undefined) col.name = updates.name.trim();
  if (updates.description !== undefined) col.description = updates.description.trim();
  if (updates.planetNames !== undefined) col.planetNames = updates.planetNames;
  col.updatedAt = new Date().toISOString();

  saveStore(memoryStore);
  return col;
}

export function deleteCollection(userId: string, collectionId: string): boolean {
  if (!memoryStore.collections[userId]) return false;
  const before = memoryStore.collections[userId].length;
  memoryStore.collections[userId] = memoryStore.collections[userId].filter(
    (c) => c.id !== collectionId
  );
  const after = memoryStore.collections[userId].length;
  saveStore(memoryStore);
  return before !== after;
}
