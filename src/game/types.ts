import { BiomeRegion } from './biodiversity';
import { JournalCategory, JournalEntry } from './journal';
import type { CharacterAppearance } from './characterArt';

export type { JournalCategory, JournalEntry, CharacterAppearance };

export enum GameState {
  TITLE = 'TITLE',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  CRAFTING = 'CRAFTING',
  BUILD_MENU = 'BUILD_MENU',
  SKILL_TREE = 'SKILL_TREE',
  PET_COMPANION = 'PET_COMPANION',
  WORLD_MAP = 'WORLD_MAP',
  CODEX = 'CODEX',
  JOURNAL = 'JOURNAL',
  STORAGE = 'STORAGE',
  DIALOGUE = 'DIALOGUE',
  VICTORY = 'VICTORY',
  GAME_OVER = 'GAME_OVER',
  UPGRADE = 'UPGRADE',
}

export type PetMode = 'BALANCED' | 'COMBAT' | 'GATHER' | 'FOLLOW';

export type CircadianHabit = 'DIURNAL' | 'NOCTURNAL' | 'CREPUSCULAR';

export type DayPhase = 'NIGHT' | 'DAWN' | 'MORNING' | 'NOON' | 'AFTERNOON' | 'DUSK';

export { BiomeRegion as BiomeType };

export enum WeatherKind {
  CLEAR = 'CLEAR',
  RAIN = 'RAIN',
  SNOW = 'SNOW',
  FOG = 'FOG',
  BLIZZARD = 'BLIZZARD',
  SANDSTORM = 'SANDSTORM',
  WINDY = 'WINDY',
}

export enum HazardKind {
  VOLCANIC_HEAT_VENT = 'VOLCANIC_HEAT_VENT',
  GLACIAL_FROSTBITE = 'GLACIAL_FROSTBITE',
  SPORE_TOXIC_BOG = 'SPORE_TOXIC_BOG',
  QUICKSAND = 'QUICKSAND',
  ROCKFALL = 'ROCKFALL',
  RAZOR_CORAL = 'RAZOR_CORAL',
}

export interface EnvironmentalHazardNode {
  id: number;
  kind: HazardKind;
  x: number;
  y: number;
  radius: number;
  intensity: number;
  name: string;
  hazardNote: string;
}

export enum ResourceKind {
  ANCIENT_OAK = 'ANCIENT_OAK',
  RAINFOREST_BANYAN = 'RAINFOREST_BANYAN',
  WEEPING_WILLOW = 'WEEPING_WILLOW',
  ALPINE_PINE = 'ALPINE_PINE',
  COCONUT_PALM = 'COCONUT_PALM',
  SAGUARO_CACTUS = 'SAGUARO_CACTUS',
  SACRED_LOTUS = 'SACRED_LOTUS',
  GIANT_KELP = 'GIANT_KELP',
  GLOW_MUSHROOM = 'GLOW_MUSHROOM',
  EDELWEISS_HERB = 'EDELWEISS_HERB',
  BERRY_BUSH = 'BERRY_BUSH',
  STONE_ROCK = 'STONE_ROCK',
  IRON_VEIN = 'IRON_VEIN',
  CRYSTAL_CLUSTER = 'CRYSTAL_CLUSTER',
  ANCIENT_CHEST = 'ANCIENT_CHEST',
}

export enum AnimalKind {
  // Peaceful Animals
  SEA_TURTLE = 'SEA_TURTLE',
  RIVER_OTTER = 'RIVER_OTTER',
  SPOTTED_DEER = 'SPOTTED_DEER',
  DESERT_CAMEL = 'DESERT_CAMEL',
  ALPINE_IBEX = 'ALPINE_IBEX',
  // Territorial / Predator Animals
  REEF_CRAB = 'REEF_CRAB',
  RIVER_CROC = 'RIVER_CROC',
  PRAIRIE_WOLF = 'PRAIRIE_WOLF',
  WILD_BOAR = 'WILD_BOAR',
  JUNGLE_JAGUAR = 'JUNGLE_JAGUAR',
  EMPEROR_SCORPION = 'EMPEROR_SCORPION',
  MOUNTAIN_BEAR = 'MOUNTAIN_BEAR',
  ANCIENT_TITAN = 'ANCIENT_TITAN',
}

export enum EnemyState {
  IDLE = 'IDLE',
  WANDER = 'WANDER',
  FLEE = 'FLEE',
  CHASE = 'CHASE',
  WINDUP = 'WINDUP',
  ATTACK = 'ATTACK',
  RECOVER = 'RECOVER',
}

export enum StructureKind {
  CAMPFIRE = 'CAMPFIRE',
  BIO_LANTERN = 'BIO_LANTERN',
  RESEARCH_TENT = 'RESEARCH_TENT',
  FOOD_PRESERVER = 'FOOD_PRESERVER',
  WOOD_WALL = 'WOOD_WALL',
  STONE_WALL = 'STONE_WALL',
  WOOD_FLOOR = 'WOOD_FLOOR',
  STONE_FLOOR = 'STONE_FLOOR',
  RAIN_COLLECTOR = 'RAIN_COLLECTOR',
  REPAIR_STATION = 'REPAIR_STATION',
  SPIKE_TRAP = 'SPIKE_TRAP',
  UPGRADE_BENCH = 'UPGRADE_BENCH',
}

export type ResourceId = 'wood' | 'stone' | 'iron' | 'crystal' | 'berry' | 'bioSample' | 'potion';

export type Inventory = Record<ResourceId, number>;

export interface PlayerEquipment {
  swordTier: number; // 1..5
  spearTier: number; // 0..5
  shieldTier: number; // 0..5
  toolTier: number;  // 1..4
  armorTier: number; // 0..4
  upgrades: Record<string, number>;
}

export interface ResourceNode {
  id: number;
  kind: ResourceKind;
  speciesId?: string;
  x: number;
  y: number;
  radius: number;
  hp: number;
  maxHp: number;
  hitFlash: number;
  squash: number;
  respawnTimer: number;
  variant: number;
}

export interface MicrobialColony {
  id: number;
  speciesId: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  secondaryColor: string;
  sampledCooldown: number;
}

export interface AmbientInsect {
  id: number;
  speciesId: string;
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  vx: number;
  vy: number;
  color: string;
  secondaryColor: string;
  wingPhase: number;
  isFlying: boolean;
}

export interface ResearchBeacon {
  id: number;
  locationId: string;
  name: string;
  region: BiomeRegion;
  x: number;
  y: number;
  activated: boolean;
  activationCost?: Partial<Record<ResourceId, number>>;
  runeSymbol?: string;
  lore?: string;
}

export interface NpcEntity {
  id: string;
  name: string;
  role: string;
  x: number;
  y: number;
  lines: string[];
}

export interface PlacedStructure {
  id: number;
  kind: StructureKind;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  storedBerries?: number;
  storedBioSamples?: number;
  collectedWater?: number;
}

export interface LootDrop {
  id: number;
  resource: ResourceId;
  amount: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
}

export interface Projectile {
  active: boolean;
  fromPlayer: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  color: string;
  life: number;
}

export interface AnimalEntity {
  id: number;
  kind: AnimalKind;
  speciesId?: string;
  name: string;
  peaceful: boolean;
  aquatic?: boolean;
  isBoss?: boolean;
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  state: EnemyState;
  stateTimer: number;
  targetX: number;
  targetY: number;
  chargeDirX: number;
  chargeDirY: number;
  hitFlash: number;
  squash: number;
  animPhase: number;
  tameProgress?: number;
  sleeping?: boolean;
}

export interface TamedCompanion {
  kind: AnimalKind;
  speciesName: string;
  customName: string;
  loyalty: number; // 0..100
  mode: PetMode;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  gatherPower: number;
  actionCooldown: number;
  animPhase: number;
  squash: number;
  hitFlash: number;
}

export interface CompanionHudInfo {
  kind: AnimalKind;
  speciesName: string;
  customName: string;
  loyalty: number;
  loyaltyStatus: string;
  efficiencyPercent: number;
  mode: PetMode;
  damage: number;
  gatherPower: number;
  specialtyDesc: string;
}

export interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  drag: number;
  glow: boolean;
}

export interface FloatingText {
  active: boolean;
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  scale: number;
}

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facingX: number;
  facingY: number;
  aimAngle: number;
  radius: number;
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  invulnTimer: number;
  hitFlash: number;
  squash: number;
  dashTimer: number;
  dashCooldown: number;
  dashDirX: number;
  dashDirY: number;
  attackCooldown: number;
  swingTimer: number;
  swingDuration: number;
  swingAngle: number;
  swingCombo: number;
  scannerPulseTimer: number;
  microscopeActive: boolean;
  walkCycle: number;
  equipment: PlayerEquipment;
  selectedSlot: number; // 0: Vũ khí/Khai thác, 1: Kính Hiển Vi Quét Sinh Học, 2: Ăn Quả, 3: Dược Thảo, 4: Lửa Trại, 5: Đèn Sinh Học Vibrio
  appearance?: CharacterAppearance;
}

export interface HudSnapshot {
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  biome: BiomeRegion;
  biomeLabel: string;
  locationName: string;
  locationArrivalBanner: string | null;
  weather: WeatherKind;
  weatherLabel: string;
  weatherIntensity: number;
  visibilityPercent: number;
  moveSpeedPercent: number;
  weatherEffectNote: string;
  weatherAudioNote: string;
  weatherBonusSummary: string;
  weatherChallengeSummary: string;
  weatherBonuses: string[];
  weatherChallenges: string[];
  weatherPerkColor: string;
  dayCount: number;
  timeOfDay: number;
  timeLabel: string;
  clockLabel: string;
  dayPhase: DayPhase;
  skyTopColor: string;
  skyHorizonColor: string;
  wildlifeActivityNote: string;
  playerX: number;
  playerY: number;
  worldTilesW: number;
  worldTilesH: number;
  coordLabel: string;
  tileSize: number;
  inventory: Inventory;
  equipment: PlayerEquipment;
  selectedSlot: number;
  microscopeActive: boolean;
  beaconsActivated: number;
  beaconsTotal: number;
  discoveredSpeciesIds: string[];
  discoveredLocationIds: string[];
  totalSpeciesCount: number;
  totalLocationsCount: number;
  bossSpawned: boolean;
  bossDefeated: boolean;
  bossName: string;
  bossHp: number;
  bossMaxHp: number;
  interactPrompt: string | null;
  questObjective: string;
  enemiesDefeated: number;
  resourcesGathered: number;
  exploredPercent: number;
  seed: number;
  companion: CompanionHudInfo | null;
  unlockedSkillIds: string[];
  journalEntries: JournalEntry[];
  newJournalAlert: string | null;
  perishableFreshness: number;
  perishableStatusNote: string;
  isPreservedByStructure: boolean;
  activeStorageStructureId: number | null;
  activeHazardAlert: string | null;
}

export interface WorldMapRenderData {
  tiles: BiomeRegion[];
  fog: Uint8Array;
  beacons: ResearchBeacon[];
  structures: PlacedStructure[];
  altarX: number;
  altarY: number;
  spawnX: number;
  spawnY: number;
  playerX: number;
  playerY: number;
  companionX: number | null;
  companionY: number | null;
  camX: number;
  camY: number;
  viewW: number;
  viewH: number;
  remotePlayers?: { id: string; name: string; color: string; x: number; y: number }[];
  pings?: { x: number; y: number; label: string; color: string }[];
}

export interface ActiveDialogue {
  npcName: string;
  npcRole: string;
  lines: string[];
  lineIndex: number;
}
