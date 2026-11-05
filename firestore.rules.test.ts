/**
 * Phase 0 Security Test Runner Specification for `/worldSaves/{userId}`
 * Verifies that all 12 "Dirty Dozen" adversarial payloads return PERMISSION_DENIED.
 */

export interface MockAuthContext {
  uid: string | null;
  emailVerified: boolean;
}

export interface DirtyPayloadCase {
  id: number;
  name: string;
  operation: 'get' | 'list' | 'create' | 'update';
  path: string;
  auth: MockAuthContext | null;
  payload?: Record<string, unknown>;
  usesServerTime?: boolean;
  expected: 'PERMISSION_DENIED';
}

const VALID_BASE_SAVE = {
  ownerId: 'user_1',
  seed: 202611,
  playerX: 3960,
  playerY: 3960,
  hp: 100,
  maxHp: 100,
  dayCount: 1,
  timeOfDay: 0.35,
  swordTier: 1,
  toolTier: 1,
  armorTier: 0,
  wood: 10,
  stone: 8,
  iron: 2,
  crystal: 0,
  berry: 5,
  bioSample: 3,
  potion: 1,
  exploredPercent: 12,
  petKind: 'PRAIRIE_WOLF',
  petName: 'Tiểu Lang',
  petLoyalty: 75,
  petMode: 'BALANCED',
  discoveredSpecies: ['oak_tree', 'rhizobium_bacteria'],
  discoveredLocations: ['central_savanna'],
  unlockedSkills: ['mob_1', 'wea_1'],
};

export const DIRTY_DOZEN_CASES: DirtyPayloadCase[] = [
  {
    id: 1,
    name: 'Unauthenticated Write',
    operation: 'create',
    path: 'worldSaves/user_1',
    auth: null,
    payload: VALID_BASE_SAVE,
    usesServerTime: true,
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Unverified Email Spoof',
    operation: 'create',
    path: 'worldSaves/user_1',
    auth: { uid: 'user_1', emailVerified: false },
    payload: VALID_BASE_SAVE,
    usesServerTime: true,
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Cross-Tenant Path Hijack',
    operation: 'get',
    path: 'worldSaves/victim_1',
    auth: { uid: 'attacker_1', emailVerified: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'OwnerId Payload Mismatch',
    operation: 'create',
    path: 'worldSaves/user_1',
    auth: { uid: 'user_1', emailVerified: true },
    payload: { ...VALID_BASE_SAVE, ownerId: 'victim_2' },
    usesServerTime: true,
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'ID Poisoning (>128 chars)',
    operation: 'create',
    path: `worldSaves/${'a'.repeat(140)}`,
    auth: { uid: 'a'.repeat(140), emailVerified: true },
    payload: { ...VALID_BASE_SAVE, ownerId: 'a'.repeat(140) },
    usesServerTime: true,
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Shadow / Ghost Field Injection',
    operation: 'create',
    path: 'worldSaves/user_1',
    auth: { uid: 'user_1', emailVerified: true },
    payload: { ...VALID_BASE_SAVE, isAdmin: true },
    usesServerTime: true,
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Client-Forged Timestamp',
    operation: 'create',
    path: 'worldSaves/user_1',
    auth: { uid: 'user_1', emailVerified: true },
    payload: VALID_BASE_SAVE,
    usesServerTime: false,
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Immutable createdAt / ownerId Mutation on Update',
    operation: 'update',
    path: 'worldSaves/user_1',
    auth: { uid: 'user_1', emailVerified: true },
    payload: { ...VALID_BASE_SAVE, ownerId: 'user_2' },
    usesServerTime: true,
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Denial-of-Wallet Oversized Pet Name / Unbounded Array',
    operation: 'create',
    path: 'worldSaves/user_1',
    auth: { uid: 'user_1', emailVerified: true },
    payload: {
      ...VALID_BASE_SAVE,
      petName: 'X'.repeat(512),
      discoveredSpecies: Array.from({ length: 85 }, (_, i) => `sp_${i}`),
    },
    usesServerTime: true,
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Array Element Type Poisoning',
    operation: 'create',
    path: 'worldSaves/user_1',
    auth: { uid: 'user_1', emailVerified: true },
    payload: {
      ...VALID_BASE_SAVE,
      discoveredSpecies: [99999],
    },
    usesServerTime: true,
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Value Poisoning on Update (Invalid petLoyalty / petMode / HP)',
    operation: 'update',
    path: 'worldSaves/user_1',
    auth: { uid: 'user_1', emailVerified: true },
    payload: {
      ...VALID_BASE_SAVE,
      hp: -999,
      petLoyalty: 500,
      petMode: 'GOD_MODE',
    },
    usesServerTime: true,
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Blanket Collection List Scraping',
    operation: 'list',
    path: 'worldSaves',
    auth: { uid: 'user_1', emailVerified: true },
    expected: 'PERMISSION_DENIED',
  },
];
