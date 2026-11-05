import { initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  User,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  getDocFromServer,
   getFirestore,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Mandatory startup connectivity check
async function testConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
void testConnection();

export type CloudPetMode = 'BALANCED' | 'COMBAT' | 'GATHER' | 'FOLLOW';

export interface CloudSaveData {
  ownerId: string;
  seed: number;
  playerX: number;
  playerY: number;
  hp: number;
  maxHp: number;
  dayCount: number;
  timeOfDay: number;
  swordTier: number;
  toolTier: number;
  armorTier: number;
  wood: number;
  stone: number;
  iron: number;
  crystal: number;
  berry: number;
  bioSample: number;
  potion: number;
  exploredPercent: number;
  petKind: string;
  petName: string;
  petLoyalty: number;
  petMode: CloudPetMode;
  discoveredSpecies: string[];
  discoveredLocations: string[];
  unlockedSkills: string[];
}

function clampNum(val: number, min: number, max: number): number {
  if (!Number.isFinite(val)) return min;
  return Math.max(min, Math.min(max, val));
}

function sanitizeIdArray(arr: string[], maxItems: number): string[] {
  const unique = Array.from(new Set(arr))
    .filter((item) => typeof item === 'string' && item.length >= 1 && item.length <= 64)
    .slice(0, maxItems);
  return unique;
}

function sanitizePetKind(kind: unknown): string {
  if (typeof kind !== 'string') return '';
  const trimmed = kind.trim().slice(0, 32);
  return /^[A-Z_]*$/.test(trimmed) ? trimmed : '';
}

function sanitizePetName(name: unknown): string {
  if (typeof name !== 'string') return '';
  return name.trim().slice(0, 32);
}

function sanitizePetMode(mode: unknown): CloudPetMode {
  if (mode === 'COMBAT' || mode === 'GATHER' || mode === 'FOLLOW' || mode === 'BALANCED') {
    return mode;
  }
  return 'BALANCED';
}

export async function signInWithGooglePopup(): Promise<User | null> {
  const cred = await signInWithPopup(auth, googleProvider);
  return cred.user;
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

export function subscribeAuth(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

export async function loadCloudWorldSave(uid: string): Promise<CloudSaveData | null> {
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(uid)) return null;
  const path = `worldSaves/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'worldSaves', uid));
    if (!snap.exists()) return null;
    const d = snap.data();
    return {
      ownerId: String(d.ownerId || uid),
      seed: Number(d.seed || 202611),
      playerX: Number(d.playerX || 3960),
      playerY: Number(d.playerY || 3960),
      hp: Number(d.hp || 100),
      maxHp: Number(d.maxHp || 100),
      dayCount: Number(d.dayCount || 1),
      timeOfDay: Number(d.timeOfDay ?? 0.35),
      swordTier: Number(d.swordTier || 1),
      toolTier: Number(d.toolTier || 1),
      armorTier: Number(d.armorTier || 0),
      wood: Number(d.wood || 0),
      stone: Number(d.stone || 0),
      iron: Number(d.iron || 0),
      crystal: Number(d.crystal || 0),
      berry: Number(d.berry || 0),
      bioSample: Number(d.bioSample || 0),
      potion: Number(d.potion || 0),
      exploredPercent: Number(d.exploredPercent || 0),
      petKind: sanitizePetKind(d.petKind),
      petName: sanitizePetName(d.petName),
      petLoyalty: clampNum(Number(d.petLoyalty ?? 0), 0, 100),
      petMode: sanitizePetMode(d.petMode),
      discoveredSpecies: Array.isArray(d.discoveredSpecies) ? d.discoveredSpecies.map(String) : [],
      discoveredLocations: Array.isArray(d.discoveredLocations) ? d.discoveredLocations.map(String) : [],
      unlockedSkills: Array.isArray(d.unlockedSkills) ? d.unlockedSkills.map(String) : [],
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function syncCloudWorldSave(raw: CloudSaveData): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return;
  const uid = user.uid;
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(uid)) return;

  const path = `worldSaves/${uid}`;
  const docRef = doc(db, 'worldSaves', uid);

  const mutableFields = {
    seed: Math.round(clampNum(raw.seed, 1, 999999999)),
    playerX: Math.round(clampNum(raw.playerX, 0, 50000)),
    playerY: Math.round(clampNum(raw.playerY, 0, 50000)),
    hp: Math.round(clampNum(raw.hp, 0, 2000)),
    maxHp: Math.round(clampNum(raw.maxHp, 50, 2000)),
    dayCount: Math.round(clampNum(raw.dayCount, 1, 100000)),
    timeOfDay: Number(clampNum(raw.timeOfDay, 0, 1).toFixed(4)),
    swordTier: Math.round(clampNum(raw.swordTier, 1, 10)),
    toolTier: Math.round(clampNum(raw.toolTier, 1, 10)),
    armorTier: Math.round(clampNum(raw.armorTier, 0, 10)),
    wood: Math.round(clampNum(raw.wood, 0, 999999)),
    stone: Math.round(clampNum(raw.stone, 0, 999999)),
    iron: Math.round(clampNum(raw.iron, 0, 999999)),
    crystal: Math.round(clampNum(raw.crystal, 0, 999999)),
    berry: Math.round(clampNum(raw.berry, 0, 999999)),
    bioSample: Math.round(clampNum(raw.bioSample, 0, 999999)),
    potion: Math.round(clampNum(raw.potion, 0, 999999)),
    exploredPercent: Math.round(clampNum(raw.exploredPercent, 0, 100)),
    petKind: sanitizePetKind(raw.petKind),
    petName: sanitizePetName(raw.petName),
    petLoyalty: Math.round(clampNum(raw.petLoyalty, 0, 100)),
    petMode: sanitizePetMode(raw.petMode),
    discoveredSpecies: sanitizeIdArray(raw.discoveredSpecies, 80),
    discoveredLocations: sanitizeIdArray(raw.discoveredLocations, 24),
    unlockedSkills: sanitizeIdArray(raw.unlockedSkills, 24),
  };

  let exists = false;
  try {
    const snap = await getDoc(docRef);
    exists = snap.exists();
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }

  if (!exists) {
    try {
      await setDoc(docRef, {
        ownerId: uid,
        ...mutableFields,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  } else {
    try {
      await updateDoc(docRef, {
        ...mutableFields,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }
}
