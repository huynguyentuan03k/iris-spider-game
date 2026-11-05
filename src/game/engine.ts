import { CloudSaveData } from '../firebase';
import { sound } from './audio';
import {
  BiomeRegion,
  REGION_LABELS,
  SPECIES_BY_ID,
  SPECIES_CATALOG,
  WORLD_LOCATIONS,
} from './biodiversity';
import {
  ALL_BUILDABLE_STRUCTURES,
  ARMOR_DAMAGE_REDUCTION_PCT,
  ARMOR_HP_BONUS,
  ARMOR_WEATHER_RESIST,
  BUILDABLE_SLOTS,
  BuildableStructureSpec,
  CRAFT_RECIPES,
  RESOURCE_META,
  SWORD_DAMAGE,
  TOOL_POWER,
  canAfford,
  spendCosts,
} from './recipes';
import {
  SKILL_BY_ID,
  VALID_SKILL_IDS,
  computePassiveSkillBonuses,
  isSkillPrerequisiteMet,
} from './skillTree';
import {
  ActiveDialogue,
  AmbientInsect,
  AnimalEntity,
  AnimalKind,
  CircadianHabit,
  CompanionHudInfo,
  DayPhase,
  EnemyState,
  EnvironmentalHazardNode,
  FloatingText,
  GameState,
  HazardKind,
  HudSnapshot,
  Inventory,
  LootDrop,
  MicrobialColony,
  Particle,
  PetMode,
  PlacedStructure,
  Player,
  Projectile,
  ResourceId,
  ResourceKind,
  ResourceNode,
  StructureKind,
  TamedCompanion,
  WeatherKind,
  WorldMapRenderData,
} from './types';
import {
  GeneratedWorld,
  TILE_SIZE,
  WORLD_PIXEL_H,
  WORLD_PIXEL_W,
  WORLD_TILES_H,
  WORLD_TILES_W,
  createAnimalFromKind,
  formatCoordLabel,
  generateWorld,
  revealFogRadius,
  tileToLonLat,
} from './worldGen';
import { MultiplayerClient } from './multiplayer/MultiplayerClient';
import { RemotePlayer, WorldPing } from './multiplayer/types';
import {
  BIOME_JOURNAL_LORE,
  JournalEntry,
  buildCompanionJournalEntry,
  buildObeliskJournalEntry,
  buildSpeciesMilestoneEntry,
  buildSurvivalMilestoneEntry,
  buildTitanAwakeningEntry,
  buildTitanDefeatedEntry,
} from './journal';
import {
  WeatherGameplayPerks,
  computeWeatherGameplayPerks,
} from './weatherEffects';

const CHUNK_TILES = 20;
const CHUNK_PX = CHUNK_TILES * TILE_SIZE;
const CHUNKS_X = Math.ceil(WORLD_TILES_W / CHUNK_TILES);
const CHUNKS_Y = Math.ceil(WORLD_TILES_H / CHUNK_TILES);
const SAVE_STORAGE_KEY = 'chantroicodai_earth_save_v3';

interface WeatherParticle {
  x: number;
  y: number;
  speed: number;
  length: number;
  size: number;
  alpha: number;
  driftPhase: number;
  layer: 0 | 1 | 2; // 0 = background, 1 = midground, 2 = foreground (near lens)
  rot: number;
  rotSpeed: number;
}

interface LensDroplet {
  active: boolean;
  x: number;
  y: number;
  radius: number;
  alpha: number;
  life: number;
  maxLife: number;
  trailY: number;
  dripSpeed: number;
}

interface RainSplash {
  active: boolean;
  x: number;
  y: number;
  life: number;
  maxLife: number;
  maxRadius: number;
}

interface FogCloud {
  offsetX: number;
  offsetY: number;
  radiusX: number;
  radiusY: number;
  speedMult: number;
  alpha: number;
  phase: number;
}

const WEATHER_LABELS: Record<WeatherKind, string> = {
  [WeatherKind.CLEAR]: 'Quang Đãng',
  [WeatherKind.RAIN]: 'Mưa Rào Nhiệt Đới',
  [WeatherKind.SNOW]: 'Tuyết Rơi',
  [WeatherKind.FOG]: 'Sương Mù Dày Đặc',
  [WeatherKind.BLIZZARD]: 'Bão Tuyết',
  [WeatherKind.SANDSTORM]: 'Bão Cát Sa Mạc',
  [WeatherKind.WINDY]: 'Gió Mùa',
};

const WEATHER_AUDIO_NOTES: Record<WeatherKind, string> = {
  [WeatherKind.CLEAR]: 'Gió êm & thanh âm sinh quyển rõ nét',
  [WeatherKind.RAIN]: 'Tiếng mưa rơi lộp độp, bước chân bì bõm & sấm rền',
  [WeatherKind.SNOW]: 'Tuyết hấp thụ âm cao, chuông băng & bước chân lạo xạo',
  [WeatherKind.FOG]: 'Sương ẩm làm trầm âm thanh & tiếng giọt sương vọng',
  [WeatherKind.BLIZZARD]: 'Gió rít tần số cao, bão tuyết gầm & lạo xạo băng giá',
  [WeatherKind.SANDSTORM]: 'Gió sa mạc gầm rít & cát bay xào xạc',
  [WeatherKind.WINDY]: 'Gió mùa lộng qua tán lá & đồng cỏ',
};

interface CompanionProfile {
  speciesName: string;
  defaultPetName: string;
  radius: number;
  damage: number;
  gatherPower: number;
  specialtyDesc: string;
}

export const COMPANION_PROFILES: Partial<Record<AnimalKind, CompanionProfile>> = {
  [AnimalKind.SEA_TURTLE]: {
    speciesName: 'Rùa Biển Xanh',
    defaultPetName: 'Bích Quy',
    radius: 15,
    damage: 14,
    gatherPower: 25,
    specialtyDesc: 'Bền bỉ vùng biển, hỗ trợ khai thác tảo & khoáng thạch',
  },
  [AnimalKind.RIVER_OTTER]: {
    speciesName: 'Rái Cá Sông',
    defaultPetName: 'Rái Nhỏ',
    radius: 13,
    damage: 14,
    gatherPower: 24,
    specialtyDesc: 'Nhanh nhẹn ven sông, hái thảo mộc & gom vật phẩm xa',
  },
  [AnimalKind.SPOTTED_DEER]: {
    speciesName: 'Hươu Sao Thảo Nguyên',
    defaultPetName: 'Tiểu Lộc',
    radius: 15,
    damage: 13,
    gatherPower: 23,
    specialtyDesc: 'Chuyên thu thập gỗ, bụi quả & nhặt chiến lợi phẩm',
  },
  [AnimalKind.DESERT_CAMEL]: {
    speciesName: 'Lạc Đà Một Bướu',
    defaultPetName: 'Kim Sa',
    radius: 18,
    damage: 17,
    gatherPower: 28,
    specialtyDesc: 'Sức bền sa mạc, khai thác đá & quặng năng suất cao',
  },
  [AnimalKind.ALPINE_IBEX]: {
    speciesName: 'Dê Núi Sừng Cong',
    defaultPetName: 'Bạch Dương',
    radius: 15,
    damage: 19,
    gatherPower: 30,
    specialtyDesc: 'Sừng cứng húc vỡ mỏ đá, quặng sắt & cụm tinh thể',
  },
  [AnimalKind.REEF_CRAB]: {
    speciesName: 'Cua Đá Rạn San Hô',
    defaultPetName: 'Thiết Giáp',
    radius: 14,
    damage: 21,
    gatherPower: 22,
    specialtyDesc: 'Càng kẹp cứng cáp, cân bằng cận chiến & đập đá khoáng',
  },
  [AnimalKind.PRAIRIE_WOLF]: {
    speciesName: 'Sói Xám Thảo Nguyên',
    defaultPetName: 'Tiểu Lang',
    radius: 15,
    damage: 25,
    gatherPower: 15,
    specialtyDesc: 'Tốc độ săn mồi chớp nhoáng, áp sát dồn sát thương',
  },
  [AnimalKind.WILD_BOAR]: {
    speciesName: 'Lợn Rừng Nanh Dài',
    defaultPetName: 'Nanh Trắng',
    radius: 16,
    damage: 26,
    gatherPower: 21,
    specialtyDesc: 'Húc văng thú dữ & ủi bật gốc cây, bụi quả nhanh',
  },
  [AnimalKind.RIVER_CROC]: {
    speciesName: 'Cá Sấu Nước Ngọt',
    defaultPetName: 'Ngạc Vương',
    radius: 18,
    damage: 29,
    gatherPower: 16,
    specialtyDesc: 'Cú đớp uy lực, áp chế mãnh thú vùng sông & đầm lầy',
  },
  [AnimalKind.EMPEROR_SCORPION]: {
    speciesName: 'Bọ Cạp Cát Vàng',
    defaultPetName: 'Hoàng Châm',
    radius: 15,
    damage: 28,
    gatherPower: 19,
    specialtyDesc: 'Đòn chích hiểm hóc & đào bới tinh thể sa mạc',
  },
  [AnimalKind.JUNGLE_JAGUAR]: {
    speciesName: 'Báo Đốm Rừng Già',
    defaultPetName: 'Hổ Phách',
    radius: 16,
    damage: 33,
    gatherPower: 15,
    specialtyDesc: 'Sát thủ rừng mưa, tung đòn vồ cận chiến uy lực lớn',
  },
  [AnimalKind.MOUNTAIN_BEAR]: {
    speciesName: 'Gấu Xám Đỉnh Núi',
    defaultPetName: 'Đại Ngàn',
    radius: 20,
    damage: 38,
    gatherPower: 25,
    specialtyDesc: 'Vệ thần núi tuyết, sát thương hạng nặng & đập quặng',
  },
};

export const PET_MODE_LABELS: Record<PetMode, string> = {
  BALANCED: 'Toàn Diện',
  COMBAT: 'Chiến Đấu',
  GATHER: 'Thu Thập',
  FOLLOW: 'Đi Theo',
};

export const ANIMAL_HABITS: Record<AnimalKind, CircadianHabit> = {
  // Diurnal Wildlife (Ban ngày kiếm ăn / tuần tra, ban đêm ngủ nghỉ)
  [AnimalKind.SEA_TURTLE]: 'DIURNAL',
  [AnimalKind.RIVER_OTTER]: 'DIURNAL',
  [AnimalKind.SPOTTED_DEER]: 'DIURNAL',
  [AnimalKind.DESERT_CAMEL]: 'DIURNAL',
  [AnimalKind.ALPINE_IBEX]: 'DIURNAL',
  [AnimalKind.MOUNTAIN_BEAR]: 'DIURNAL',
  // Nocturnal Predators (Thú săn đêm: ẩn nghỉ ban ngày, mắt sáng & săn mồi hung hãn về đêm)
  [AnimalKind.JUNGLE_JAGUAR]: 'NOCTURNAL',
  [AnimalKind.PRAIRIE_WOLF]: 'NOCTURNAL',
  [AnimalKind.EMPEROR_SCORPION]: 'NOCTURNAL',
  [AnimalKind.RIVER_CROC]: 'NOCTURNAL',
  // Crepuscular / Dusk-to-Dawn Foragers
  [AnimalKind.WILD_BOAR]: 'CREPUSCULAR',
  [AnimalKind.REEF_CRAB]: 'CREPUSCULAR',
  [AnimalKind.ANCIENT_TITAN]: 'CREPUSCULAR',
};

interface SkyKeyframe {
  t: number;
  skyTop: [number, number, number];
  skyHorizon: [number, number, number];
  tintRgb: [number, number, number];
  tintAlpha: number;
  darkness: number;
  nightRgb: [number, number, number];
}

// Continuous 24-hour atmospheric & sky color keyframes (0.00 = 00:00 Midnight -> 0.50 = 12:00 Noon -> 1.00 = 24:00)
const SKY_KEYFRAMES: SkyKeyframe[] = [
  { t: 0.0, skyTop: [7, 13, 31], skyHorizon: [18, 35, 68], tintRgb: [14, 28, 64], tintAlpha: 0.08, darkness: 0.66, nightRgb: [7, 14, 30] },
  { t: 0.18, skyTop: [15, 20, 48], skyHorizon: [58, 38, 82], tintRgb: [52, 34, 84], tintAlpha: 0.12, darkness: 0.52, nightRgb: [12, 17, 38] },
  { t: 0.24, skyTop: [54, 42, 92], skyHorizon: [249, 126, 62], tintRgb: [251, 146, 92], tintAlpha: 0.21, darkness: 0.18, nightRgb: [28, 22, 48] },
  { t: 0.31, skyTop: [29, 108, 168], skyHorizon: [253, 218, 118], tintRgb: [253, 224, 138], tintAlpha: 0.09, darkness: 0.02, nightRgb: [18, 28, 46] },
  { t: 0.5, skyTop: [14, 148, 214], skyHorizon: [165, 228, 252], tintRgb: [255, 252, 235], tintAlpha: 0.02, darkness: 0, nightRgb: [10, 20, 36] },
  { t: 0.67, skyTop: [27, 94, 152], skyHorizon: [251, 186, 72], tintRgb: [251, 176, 64], tintAlpha: 0.11, darkness: 0.04, nightRgb: [22, 20, 42] },
  { t: 0.76, skyTop: [44, 28, 78], skyHorizon: [234, 88, 44], tintRgb: [238, 96, 54], tintAlpha: 0.24, darkness: 0.28, nightRgb: [26, 18, 44] },
  { t: 0.85, skyTop: [12, 21, 46], skyHorizon: [32, 49, 92], tintRgb: [22, 36, 78], tintAlpha: 0.1, darkness: 0.61, nightRgb: [8, 15, 32] },
  { t: 1.0, skyTop: [7, 13, 31], skyHorizon: [18, 35, 68], tintRgb: [14, 28, 64], tintAlpha: 0.08, darkness: 0.66, nightRgb: [7, 14, 30] },
];

function lerpChannel(a: number, b: number, u: number): number {
  return Math.round(a + (b - a) * u);
}

function rgbToHex(rgb: [number, number, number]): string {
  const [r, g, b] = rgb;
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function getLoyaltyTier(loyalty: number): { status: string; mult: number; cadence: number } {
  if (loyalty >= 80) {
    return { status: 'Tuyệt đối trung thành', mult: 1.35, cadence: 0.92 };
  }
  if (loyalty >= 45) {
    return { status: 'Gắn bó', mult: 1.0, cadence: 1.15 };
  }
  if (loyalty >= 20) {
    return { status: 'Cần chăm sóc', mult: 0.65, cadence: 1.45 };
  }
  return { status: 'Đói bụng · Tạm nghỉ', mult: 0, cadence: 1.8 };
}

interface EngineCallbacks {
  onHudUpdate: (snapshot: HudSnapshot) => void;
  onStateChange: (nextState: GameState) => void;
  onOpenDialogue: (dialogue: ActiveDialogue | null) => void;
  onAutoCloudSync?: (payload: CloudSaveData) => void;
}

interface LocalSavedPayload {
  seed: number;
  playerX: number;
  playerY: number;
  hp: number;
  maxHp: number;
  inventory: Inventory;
  equipment: Player['equipment'];
  dayCount: number;
  timeOfDay: number;
  activatedBeaconIds: number[];
  discoveredSpeciesIds: string[];
  discoveredLocationIds: string[];
  bossDefeated: boolean;
  enemiesDefeated: number;
  resourcesGathered: number;
  structures: PlacedStructure[];
  fogBase64: string;
  companion?: {
    kind: AnimalKind;
    customName: string;
    loyalty: number;
    mode: PetMode;
  } | null;
  unlockedSkillIds?: string[];
  discoveredBiomeIds?: BiomeRegion[];
  journalEntries?: JournalEntry[];
}

const BIOME_PALETTE: Record<BiomeRegion, { base: string; alt: string; accent: string }> = {
  [BiomeRegion.OCEAN]: { base: '#0e4d64', alt: '#125a73', accent: '#38bdf8' },
  [BiomeRegion.COAST]: { base: '#d9c38c', alt: '#cfb67c', accent: '#fef3c7' },
  [BiomeRegion.RIVER]: { base: '#1d6f8a', alt: '#227c99', accent: '#7dd3fc' },
  [BiomeRegion.RIVERBANK]: { base: '#3d6b48', alt: '#355e3f', accent: '#84cc16' },
  [BiomeRegion.SANCTUARY]: { base: '#59635e', alt: '#4e5853', accent: '#d6b265' },
  [BiomeRegion.SAVANNA]: { base: '#4c7c44', alt: '#44703c', accent: '#a3e635' },
  [BiomeRegion.FOREST]: { base: '#214d30', alt: '#1c4229', accent: '#4ade80' },
  [BiomeRegion.DESERT]: { base: '#cf9553', alt: '#c48947', accent: '#facc15' },
  [BiomeRegion.MOUNTAIN]: { base: '#474954', alt: '#3e404a', accent: '#94a3b8' },
  [BiomeRegion.SNOW_PEAK]: { base: '#cbd5e1', alt: '#bcc8d6', accent: '#f8fafc' },
};

export function hasSavedWorld(): boolean {
  try {
    return Boolean(localStorage.getItem(SAVE_STORAGE_KEY));
  } catch {
    return false;
  }
}

export class OpenWorldEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private callbacks: EngineCallbacks;

  private gameState: GameState = GameState.TITLE;
  private world!: GeneratedWorld;
  private chunkCanvases: (HTMLCanvasElement | null)[] = [];

  private player!: Player;
  private companion: TamedCompanion | null = null;
  private inventory!: Inventory;
  private unlockedSkills = new Set<string>();
  private discoveredSpecies = new Set<string>();
  private discoveredLocations = new Set<string>();
  private discoveredBiomes = new Set<BiomeRegion>();
  private journalEntries: JournalEntry[] = [];
  private newJournalAlert: string | null = null;
  private newJournalAlertTimer = 0;
  private currentLocationName = 'Trạm Sinh Quyển Địa Cầu';
  private arrivalBanner: string | null = null;
  private arrivalBannerTimer = 0;

  // Perishable Food Preservation & Storage State
  private perishableFreshness = 100;
  private perishableStatusNote = 'Bao tải rỗng';
  private isPreservedByStructure = false;
  private activeStorageStructureId: number | null = null;
  private activeBlueprintSpec: BuildableStructureSpec | null = null;
  private activeHazardAlert: string | null = null;

  private lootDrops: LootDrop[] = [];
  private projectiles: Projectile[] = [];
  private particles: Particle[] = [];
  private floatingTexts: FloatingText[] = [];

  // Dynamic Biome Weather State & Zero-Alloc Pools
  private weatherParticles: WeatherParticle[] = [];
  private rainSplashes: RainSplash[] = [];
  private fogClouds: FogCloud[] = [];
  private lensDroplets: LensDroplet[] = [];
  private frostIntensity = 0;
  private sandVignetteIntensity = 0;
  private currentBiome: BiomeRegion = BiomeRegion.SANCTUARY;
  private activeWeather: WeatherKind = WeatherKind.CLEAR;
  private targetWeather: WeatherKind = WeatherKind.CLEAR;
  private weatherIntensity = 0;
  private weatherCycleTime = 24;
  private windDirX = -0.82;
  private windDirY = 0.57;
  private lightningFlash = 0;
  private weatherAudioCooldown = 5;
  private currentVisibilityPercent = 100;
  private currentMoveSpeedPercent = 100;
  private currentWeatherEffectNote = 'Địa hình ổn định';
  private currentWeatherAudioNote = WEATHER_AUDIO_NOTES[WeatherKind.CLEAR];
  private lastAnnouncedWeather: WeatherKind = WeatherKind.CLEAR;
  private manualWeatherOverride: WeatherKind | null = null;
  private manualWeatherTimer = 0;

  private nextEntityId = 8000;
  private dayCount = 1;
  private timeOfDay = 0.34;
  private lastDayPhase: DayPhase = 'MORNING';
  private enemiesDefeated = 0;
  private resourcesGathered = 0;
  private bossSpawned = false;
  private bossDefeated = false;

  // Camera & Juice
  private camX = WORLD_PIXEL_W / 2;
  private camY = WORLD_PIXEL_H / 2;
  private titlePanAngle = 0;
  private shakeTrauma = 0;
  private hitstopTimer = 0;
  private globalTime = 0;
  private hudSyncTimer = 0;
  private autoSaveTimer = 0;
  private campfireHealAccum = 0;
  private bioSoundTimer = 2.2;
  private lastFootstepStep = 0;

  // Input State
  private keysHeld = new Set<string>();
  private keysJustPressed = new Set<string>();
  private mouseHeld = false;
  private mouseScreenX = 0;
  private mouseScreenY = 0;
  private pointerInside = false;
  private attackBuffer = 0;
  private dashBuffer = 0;

  private rafId: number | null = null;
  private lastTimestamp = 0;
  private activeDialogue: ActiveDialogue | null = null;
  private multiplayerClient: MultiplayerClient | null = null;
  private multiplayerSyncTimer = 0;

  private lightCanvas: HTMLCanvasElement;
  private lightCtx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement, callbacks: EngineCallbacks) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('2D context unavailable');
    this.ctx = context;
    this.callbacks = callbacks;

    this.lightCanvas = document.createElement('canvas');
    this.lightCanvas.width = 480;
    this.lightCanvas.height = 270;
    this.lightCtx = this.lightCanvas.getContext('2d')!;

    this.initPools();
    this.initNewWorld(202611);
    this.bindEvents();
    this.handleResize();
    this.startLoop();
  }

  private initPools(): void {
    this.particles = Array.from({ length: 420 }, () => ({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      size: 3,
      color: '#ffffff',
      alpha: 1,
      life: 0,
      maxLife: 1,
      drag: 0.94,
      glow: false,
    }));

    this.projectiles = Array.from({ length: 90 }, () => ({
      active: false,
      fromPlayer: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      radius: 6,
      damage: 10,
      color: '#38bdf8',
      life: 0,
    }));

    this.floatingTexts = Array.from({ length: 48 }, () => ({
      active: false,
      x: 0,
      y: 0,
      vy: -30,
      text: '',
      color: '#ffffff',
      life: 0,
      maxLife: 0.95,
      scale: 1,
    }));

    this.weatherParticles = Array.from({ length: 360 }, (_, i) => {
      const layer = (i % 3) as 0 | 1 | 2;
      return {
        x: Math.random() * 1920,
        y: Math.random() * 1080,
        speed: (0.65 + (i % 7) * 0.1) * (layer === 2 ? 1.45 : layer === 0 ? 0.75 : 1.0),
        length: (12 + (i % 5) * 4) * (layer === 2 ? 1.6 : layer === 0 ? 0.7 : 1.0),
        size: (1.6 + (i % 4) * 0.9) * (layer === 2 ? 1.8 : layer === 0 ? 0.65 : 1.0),
        alpha: (0.3 + (i % 6) * 0.1) * (layer === 2 ? 0.85 : layer === 0 ? 0.5 : 1.0),
        driftPhase: i * 0.73,
        layer,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 2.5,
      };
    });

    this.lensDroplets = Array.from({ length: 36 }, () => ({
      active: false,
      x: 0,
      y: 0,
      radius: 4,
      alpha: 0,
      life: 0,
      maxLife: 3.5,
      trailY: 0,
      dripSpeed: 12,
    }));

    this.rainSplashes = Array.from({ length: 52 }, () => ({
      active: false,
      x: 0,
      y: 0,
      life: 0,
      maxLife: 0.42,
      maxRadius: 9,
    }));

    this.fogClouds = Array.from({ length: 18 }, (_, i) => ({
      offsetX: ((i * 211) % 1800) - 300,
      offsetY: ((i * 137) % 1100) - 180,
      radiusX: 190 + (i % 5) * 55,
      radiusY: 95 + (i % 4) * 32,
      speedMult: 0.55 + (i % 4) * 0.22,
      alpha: 0.12 + (i % 3) * 0.05,
      phase: i * 1.1,
    }));
  }

  public initNewWorld(seed?: number): void {
    this.world = generateWorld(seed);
    this.chunkCanvases = new Array(CHUNKS_X * CHUNKS_Y).fill(null);

    this.player = {
      x: this.world.spawnX,
      y: this.world.spawnY + 18,
      vx: 0,
      vy: 0,
      facingX: 0,
      facingY: 1,
      aimAngle: Math.PI / 2,
      radius: 13,
      hp: 100,
      maxHp: 100,
      stamina: 100,
      maxStamina: 100,
      invulnTimer: 0,
      hitFlash: 0,
      squash: 0,
      dashTimer: 0,
      dashCooldown: 0,
      dashDirX: 0,
      dashDirY: 1,
      attackCooldown: 0,
      swingTimer: 0,
      swingDuration: 0.2,
      swingAngle: 0,
      swingCombo: 0,
      scannerPulseTimer: 0,
      microscopeActive: false,
      walkCycle: 0,
      equipment: {
        swordTier: 1,
        toolTier: 1,
        armorTier: 0,
      },
      selectedSlot: 0,
    };

    this.inventory = {
      wood: 6,
      stone: 4,
      iron: 0,
      crystal: 0,
      berry: 6,
      bioSample: 1,
      potion: 1,
    };
    this.companion = null;
    this.unlockedSkills = new Set<string>();

    this.discoveredSpecies = new Set<string>();
    this.discoveredLocations = new Set<string>(['loc_biosphere_hub']);
    this.discoveredBiomes = new Set<BiomeRegion>([BiomeRegion.SANCTUARY]);
    const initSanctuaryLore = BIOME_JOURNAL_LORE[BiomeRegion.SANCTUARY];
    this.journalEntries = [
      {
        id: `init_sanctuary_${Date.now()}`,
        category: 'BIOME',
        title: initSanctuaryLore.title,
        narrative: initSanctuaryLore.narrative,
        timestamp: 'Ngày 1 · 08:09 · Ban Mai',
        dayCount: 1,
        locationName: 'Trạm Sinh Quyển Địa Cầu',
        coords: '30°B · 31°Đ',
        icon: initSanctuaryLore.icon,
        accentColor: initSanctuaryLore.accentColor,
      },
    ];
    this.newJournalAlert = null;
    this.newJournalAlertTimer = 0;
    this.currentLocationName = 'Trạm Sinh Quyển Địa Cầu';
    this.arrivalBanner = null;
    this.arrivalBannerTimer = 0;
    this.perishableFreshness = 100;
    this.activeStorageStructureId = null;
    this.activeHazardAlert = null;

    this.lootDrops = [];
    this.particles.forEach((p) => (p.active = false));
    this.projectiles.forEach((p) => (p.active = false));
    this.floatingTexts.forEach((t) => (t.active = false));
    this.rainSplashes.forEach((s) => (s.active = false));

    this.activeWeather = WeatherKind.CLEAR;
    this.targetWeather = WeatherKind.CLEAR;
    this.weatherIntensity = 0;
    this.weatherCycleTime = 24;
    this.lightningFlash = 0;
    this.currentVisibilityPercent = 100;
    this.currentMoveSpeedPercent = 100;
    this.currentWeatherEffectNote = 'Địa hình ổn định';
    this.currentWeatherAudioNote = WEATHER_AUDIO_NOTES[WeatherKind.CLEAR];
    this.lastAnnouncedWeather = WeatherKind.CLEAR;
    this.manualWeatherOverride = null;
    this.manualWeatherTimer = 0;

    this.dayCount = 1;
    this.timeOfDay = 0.34;
    this.enemiesDefeated = 0;
    this.resourcesGathered = 0;
    this.bossSpawned = false;
    this.bossDefeated = false;
    this.camX = this.player.x;
    this.camY = this.player.y;
    this.activeDialogue = null;
    this.callbacks.onOpenDialogue(null);
    this.emitHudSnapshot();
  }

  private buildCompanionInstance(
    kind: AnimalKind,
    customName: string,
    loyalty: number,
    mode: PetMode,
    x: number,
    y: number
  ): TamedCompanion | null {
    const profile = COMPANION_PROFILES[kind];
    if (!profile) return null;
    const cleanName = customName.trim().slice(0, 32) || profile.defaultPetName;
    return {
      kind,
      speciesName: profile.speciesName,
      customName: cleanName,
      loyalty: Math.max(0, Math.min(100, loyalty)),
      mode,
      x,
      y,
      vx: 0,
      vy: 0,
      radius: profile.radius,
      damage: profile.damage,
      gatherPower: profile.gatherPower,
      actionCooldown: 0.4,
      animPhase: 0,
      squash: 0,
      hitFlash: 0,
    };
  }

  public exportCloudSavePayload(ownerId: string): CloudSaveData {
    let exploredCells = 0;
    for (let i = 0; i < this.world.fog.length; i++) {
      if (this.world.fog[i] > 0) exploredCells++;
    }
    const exploredPercent = Math.min(100, Math.round((exploredCells / this.world.fog.length) * 100));

    return {
      ownerId,
      seed: this.world.seed,
      playerX: Math.round(this.player.x),
      playerY: Math.round(this.player.y),
      hp: Math.round(this.player.hp),
      maxHp: this.player.maxHp,
      dayCount: this.dayCount,
      timeOfDay: this.timeOfDay,
      swordTier: this.player.equipment.swordTier,
      toolTier: this.player.equipment.toolTier,
      armorTier: this.player.equipment.armorTier,
      wood: this.inventory.wood,
      stone: this.inventory.stone,
      iron: this.inventory.iron,
      crystal: this.inventory.crystal,
      berry: this.inventory.berry,
      bioSample: this.inventory.bioSample,
      potion: this.inventory.potion,
      exploredPercent,
      petKind: this.companion ? this.companion.kind : '',
      petName: this.companion ? this.companion.customName.slice(0, 32) : '',
      petLoyalty: this.companion ? Math.round(this.companion.loyalty) : 0,
      petMode: this.companion ? this.companion.mode : 'BALANCED',
      discoveredSpecies: Array.from(this.discoveredSpecies),
      discoveredLocations: Array.from(this.discoveredLocations),
      unlockedSkills: Array.from(this.unlockedSkills),
    };
  }

  public applyCloudSavePayload(cloud: CloudSaveData): void {
    this.initNewWorld(cloud.seed);
    const candidateX = Math.max(80, Math.min(WORLD_PIXEL_W - 80, cloud.playerX));
    const candidateY = Math.max(80, Math.min(WORLD_PIXEL_H - 80, cloud.playerY));
    if (this.isDeepImpassableOcean(candidateX, candidateY)) {
      this.player.x = this.world.spawnX;
      this.player.y = this.world.spawnY + 18;
    } else {
      this.player.x = candidateX;
      this.player.y = candidateY;
    }
    this.player.equipment = {
      swordTier: cloud.swordTier || 1,
      toolTier: cloud.toolTier || 1,
      armorTier: cloud.armorTier || 0,
    };
    this.unlockedSkills = new Set(
      (cloud.unlockedSkills || []).filter((id) => VALID_SKILL_IDS.has(id))
    );
    this.syncPlayerMaxVitals(false);
    this.player.hp = Math.max(25, Math.min(this.player.maxHp, cloud.hp || 100));
    this.player.stamina = this.player.maxStamina;
    this.inventory = {
      wood: cloud.wood || 0,
      stone: cloud.stone || 0,
      iron: cloud.iron || 0,
      crystal: cloud.crystal || 0,
      berry: cloud.berry || 0,
      bioSample: cloud.bioSample || 0,
      potion: cloud.potion || 0,
    };
    this.dayCount = cloud.dayCount || 1;
    this.timeOfDay = cloud.timeOfDay ?? 0.35;
    this.discoveredSpecies = new Set(cloud.discoveredSpecies || []);
    this.discoveredLocations = new Set(cloud.discoveredLocations || ['loc_biosphere_hub']);

    if (cloud.petKind && (cloud.petKind as AnimalKind) in COMPANION_PROFILES) {
      this.companion = this.buildCompanionInstance(
        cloud.petKind as AnimalKind,
        cloud.petName || '',
        cloud.petLoyalty ?? 75,
        cloud.petMode || 'BALANCED',
        this.player.x - 34,
        this.player.y + 18
      );
    } else {
      this.companion = null;
    }

    // Reveal fog around discovered locations & current player position
    for (const locId of this.discoveredLocations) {
      const loc = WORLD_LOCATIONS.find((l) => l.id === locId);
      if (loc) {
        revealFogRadius(this.world.fog, (loc.tx + 0.5) * TILE_SIZE, (loc.ty + 0.5) * TILE_SIZE, 460);
      }
    }
    revealFogRadius(this.world.fog, this.player.x, this.player.y, 440);

    this.camX = this.player.x;
    this.camY = this.player.y;
    this.saveWorld();
    this.emitHudSnapshot();
  }

  public loadSavedWorld(): boolean {
    try {
      const raw = localStorage.getItem(SAVE_STORAGE_KEY);
      if (!raw) return false;
      const saved = JSON.parse(raw) as LocalSavedPayload;
      this.initNewWorld(saved.seed);

      const cx = Math.max(80, Math.min(WORLD_PIXEL_W - 80, saved.playerX));
      const cy = Math.max(80, Math.min(WORLD_PIXEL_H - 80, saved.playerY));
      if (this.isDeepImpassableOcean(cx, cy)) {
        this.player.x = this.world.spawnX;
        this.player.y = this.world.spawnY + 18;
      } else {
        this.player.x = cx;
        this.player.y = cy;
      }
      this.player.equipment = saved.equipment || { swordTier: 1, toolTier: 1, armorTier: 0 };
      this.unlockedSkills = new Set(
        Array.isArray(saved.unlockedSkillIds)
          ? saved.unlockedSkillIds.filter((id) => VALID_SKILL_IDS.has(id))
          : []
      );
      this.syncPlayerMaxVitals(false);
      this.player.hp = Math.max(25, Math.min(this.player.maxHp, saved.hp || 100));
      this.player.stamina = this.player.maxStamina;
      this.inventory = { ...this.inventory, ...saved.inventory };
      this.dayCount = saved.dayCount || 1;
      this.timeOfDay = saved.timeOfDay ?? 0.35;
      this.bossDefeated = Boolean(saved.bossDefeated);
      this.enemiesDefeated = saved.enemiesDefeated || 0;
      this.resourcesGathered = saved.resourcesGathered || 0;

      if (saved.companion && saved.companion.kind in COMPANION_PROFILES) {
        this.companion = this.buildCompanionInstance(
          saved.companion.kind,
          saved.companion.customName || '',
          saved.companion.loyalty ?? 75,
          saved.companion.mode || 'BALANCED',
          this.player.x - 34,
          this.player.y + 18
        );
      } else {
        this.companion = null;
      }

      if (Array.isArray(saved.discoveredSpeciesIds)) {
        this.discoveredSpecies = new Set(saved.discoveredSpeciesIds);
      }
      if (Array.isArray(saved.discoveredLocationIds)) {
        this.discoveredLocations = new Set(saved.discoveredLocationIds);
      }
      if (Array.isArray(saved.discoveredBiomeIds) && saved.discoveredBiomeIds.length > 0) {
        this.discoveredBiomes = new Set(saved.discoveredBiomeIds);
      } else {
        this.discoveredBiomes = new Set<BiomeRegion>([BiomeRegion.SANCTUARY]);
      }
      if (Array.isArray(saved.activatedBeaconIds)) {
        for (const b of this.world.beacons) {
          if (saved.activatedBeaconIds.includes(b.id)) {
            b.activated = true;
          }
        }
      }
      if (Array.isArray(saved.structures) && saved.structures.length > 0) {
        this.world.structures = saved.structures;
      }
      if (saved.fogBase64) {
        const bin = atob(saved.fogBase64);
        for (let i = 0; i < Math.min(bin.length, this.world.fog.length); i++) {
          this.world.fog[i] = bin.charCodeAt(i);
        }
      }

      if (Array.isArray(saved.journalEntries) && saved.journalEntries.length > 0) {
        this.journalEntries = saved.journalEntries;
      } else {
        this.backfillHistoricalJournal();
      }

      this.camX = this.player.x;
      this.camY = this.player.y;
      this.emitHudSnapshot();
      return true;
    } catch {
      return false;
    }
  }

  public saveWorld(triggerCloud: boolean = false): void {
    if (this.gameState === GameState.TITLE || this.player.hp <= 0) return;
    try {
      let bin = '';
      for (let i = 0; i < this.world.fog.length; i++) {
        bin += String.fromCharCode(this.world.fog[i]);
      }
      const payload: LocalSavedPayload = {
        seed: this.world.seed,
        playerX: this.player.x,
        playerY: this.player.y,
        hp: Math.round(this.player.hp),
        maxHp: this.player.maxHp,
        inventory: this.inventory,
        equipment: this.player.equipment,
        dayCount: this.dayCount,
        timeOfDay: this.timeOfDay,
        activatedBeaconIds: this.world.beacons.filter((b) => b.activated).map((b) => b.id),
        discoveredSpeciesIds: Array.from(this.discoveredSpecies),
        discoveredLocationIds: Array.from(this.discoveredLocations),
        discoveredBiomeIds: Array.from(this.discoveredBiomes),
        journalEntries: this.journalEntries,
        bossDefeated: this.bossDefeated,
        enemiesDefeated: this.enemiesDefeated,
        resourcesGathered: this.resourcesGathered,
        structures: this.world.structures,
        fogBase64: btoa(bin),
        companion: this.companion
          ? {
              kind: this.companion.kind,
              customName: this.companion.customName,
              loyalty: Number(this.companion.loyalty.toFixed(1)),
              mode: this.companion.mode,
            }
          : null,
        unlockedSkillIds: Array.from(this.unlockedSkills),
      };
      localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(payload));
      if (triggerCloud && this.callbacks.onAutoCloudSync) {
        this.callbacks.onAutoCloudSync(this.exportCloudSavePayload('current'));
      }
    } catch {
      // ignore storage quota errors
    }
  }

  public setGameState(next: GameState): void {
    this.gameState = next;
    this.keysJustPressed.clear();
    if (next === GameState.PLAYING) {
      sound.unlock();
      this.camX = this.player.x;
      this.camY = this.player.y;
    }
    this.callbacks.onStateChange(next);
    this.emitHudSnapshot();
  }

  public setMultiplayerClient(client: MultiplayerClient | null): void {
    this.multiplayerClient = client;
  }

  public getMultiplayerClient(): MultiplayerClient | null {
    return this.multiplayerClient;
  }

  public sendWorldPing(type: 'RALLY' | 'DANGER' | 'RESOURCE' | 'ASSIST' = 'RALLY', label?: string): void {
    if (this.multiplayerClient && this.multiplayerClient.getStatus() === 'CONNECTED') {
      const pType: 'help' | 'resource' | 'rally' | 'danger' =
        type === 'DANGER' ? 'danger' : type === 'RESOURCE' ? 'resource' : type === 'ASSIST' ? 'help' : 'rally';
      this.multiplayerClient.sendWorldPing(this.player.x, this.player.y, label || type, pType);
      sound.playObeliskActivate();
      this.spawnFloatingText(this.player.x, this.player.y - 36, `Đã đánh dấu: ${label || type}`, '#38bdf8', 1.1);
    }
  }

  public fastTravelTo(x: number, y: number): void {
    this.spawnBurst(this.player.x, this.player.y, '#38bdf8', 25, 140, true);
    this.player.x = x;
    this.player.y = y;
    if (this.companion) {
      this.companion.x = x - 30;
      this.companion.y = y;
      this.companion.vx = 0;
      this.companion.vy = 0;
    }
    this.camX = x;
    this.camY = y;
    revealFogRadius(this.world.fog, x, y, 550);
    sound.playObeliskActivate();
    this.addShake(0.35);
    this.spawnBurst(x, y, '#38bdf8', 35, 180, true);
    this.setGameState(GameState.PLAYING);
    this.saveWorld(true);
    this.emitHudSnapshot();
  }

  public activateObelisk(obeliskId: number): boolean {
    const obelisk = this.world.beacons.find((b) => b.id === obeliskId);
    if (!obelisk) return false;
    if (obelisk.activated) {
      this.spawnFloatingText(
        obelisk.x,
        obelisk.y - 36,
        `Cổng Cổ Thần ${obelisk.name} đã kích hoạt!`,
        '#38bdf8',
        1.0
      );
      return false;
    }

    if (obelisk.activationCost && !canAfford(this.inventory, obelisk.activationCost)) {
      this.spawnFloatingText(
        this.player.x,
        this.player.y - 36,
        'Thiếu tài nguyên kích hoạt Cổng Cổ Thần!',
        '#fca5a5',
        1.1
      );
      sound.playEnemyHit(false);
      return false;
    }

    if (obelisk.activationCost) {
      spendCosts(this.inventory, obelisk.activationCost);
    }

    obelisk.activated = true;
    this.discoveredLocations.add(obelisk.locationId);
    sound.playObeliskActivate();
    this.addShake(0.48);
    revealFogRadius(this.world.fog, obelisk.x, obelisk.y, 680);
    this.spawnBurst(obelisk.x, obelisk.y, '#38bdf8', 42, 210, true);
    this.player.hp = this.player.maxHp;
    this.spawnFloatingText(
      obelisk.x,
      obelisk.y - 44,
      `Kích Hoạt Cổng Cổ Thần: ${obelisk.name}!`,
      '#7dd3fc',
      1.25
    );

    const activatedCount = this.world.beacons.filter((bc) => bc.activated).length;
    this.addJournalEntry(
      buildObeliskJournalEntry(
        obelisk.name,
        obelisk.name,
        this.getPlayerCoordLabel(),
        this.getFormattedTimestamp(),
        this.dayCount,
        activatedCount,
        this.world.beacons.length
      )
    );

    this.saveWorld(true);
    this.emitHudSnapshot();
    return true;
  }

  public fastTravelToObelisk(obeliskId: number): boolean {
    const obelisk = this.world.beacons.find((b) => b.id === obeliskId);
    if (!obelisk || !obelisk.activated) {
      this.spawnFloatingText(
        this.player.x,
        this.player.y - 32,
        'Cổng Cổ Thần chưa được kích hoạt!',
        '#fca5a5',
        1.0
      );
      return false;
    }

    this.fastTravelTo(obelisk.x, obelisk.y + 36);
    this.spawnFloatingText(
      this.player.x,
      this.player.y - 38,
      `Đã Dịch Chuyển Tới ${obelisk.name}`,
      '#38bdf8',
      1.2
    );
    return true;
  }

  public getWorldDataForMap(): WorldMapRenderData {
    return {
      tiles: this.world.tiles,
      fog: this.world.fog,
      beacons: this.world.beacons,
      structures: this.world.structures,
      altarX: this.world.altarX,
      altarY: this.world.altarY,
      spawnX: this.world.spawnX,
      spawnY: this.world.spawnY,
      playerX: this.player.x,
      playerY: this.player.y,
      companionX: this.companion ? this.companion.x : null,
      companionY: this.companion ? this.companion.y : null,
      camX: this.camX,
      camY: this.camY,
      viewW: window.innerWidth || 1280,
      viewH: window.innerHeight || 720,
      remotePlayers: this.multiplayerClient
        ? this.multiplayerClient.getRemotePlayers().map((p) => ({
            id: p.id,
            name: p.name,
            color: p.color,
            x: p.x,
            y: p.y,
          }))
        : undefined,
      pings: this.multiplayerClient
        ? this.multiplayerClient.getPings().map((pg) => ({
            x: pg.x,
            y: pg.y,
            label: pg.label || pg.type,
            color: pg.color,
          }))
        : undefined,
    };
  }

  public getJournalEntries(): JournalEntry[] {
    return this.journalEntries;
  }

  public getFormattedTimestamp(): string {
    return `Ngày ${this.dayCount} · ${this.getClockLabel()} · ${this.getTimeLabel()}`;
  }

  public getPlayerCoordLabel(): string {
    const pTileX = this.player.x / TILE_SIZE;
    const pTileY = this.player.y / TILE_SIZE;
    const { lon, lat } = tileToLonLat(pTileX, pTileY);
    return formatCoordLabel(lon, lat);
  }

  public triggerJournalNotification(title: string): void {
    this.newJournalAlert = title;
    this.newJournalAlertTimer = 4.5;
    this.spawnFloatingText(
      this.player.x,
      this.player.y - 42,
      `📜 Ghi Nhật Ký: ${title}`,
      '#fde047',
      1.16
    );
    sound.playSkillUnlock();
  }

  public addJournalEntry(entry: JournalEntry): void {
    if (this.journalEntries.some((e) => e.title === entry.title)) return;
    this.journalEntries.push(entry);
    this.triggerJournalNotification(entry.title);
    this.saveWorld(true);
    this.emitHudSnapshot();
  }

  public backfillHistoricalJournal(): void {
    const list: JournalEntry[] = [];
    const sanctuaryLore = BIOME_JOURNAL_LORE[BiomeRegion.SANCTUARY];
    list.push({
      id: 'hist_sanctuary',
      category: 'BIOME',
      title: sanctuaryLore.title,
      narrative: sanctuaryLore.narrative,
      timestamp: 'Ngày 1 · 08:09 · Ban Mai',
      dayCount: 1,
      locationName: 'Trạm Sinh Quyển Địa Cầu',
      coords: '30°B · 31°Đ',
      icon: sanctuaryLore.icon,
      accentColor: sanctuaryLore.accentColor,
    });

    for (const b of this.discoveredBiomes) {
      if (b === BiomeRegion.SANCTUARY) continue;
      const lore = BIOME_JOURNAL_LORE[b];
      if (lore) {
        list.push({
          id: `hist_biome_${b}`,
          category: 'BIOME',
          title: lore.title,
          narrative: lore.narrative,
          timestamp: 'Ngày 1 · 12:00 · Giữa Trưa',
          dayCount: 1,
          locationName: REGION_LABELS[b],
          coords: this.getPlayerCoordLabel(),
          icon: lore.icon,
          accentColor: lore.accentColor,
        });
      }
    }

    const totalBeacons = this.world.beacons.length;
    let actIdx = 1;
    for (const b of this.world.beacons) {
      if (b.activated) {
        const coords = tileToLonLat(b.x / TILE_SIZE, b.y / TILE_SIZE);
        list.push(
          buildObeliskJournalEntry(
            b.name,
            b.name,
            formatCoordLabel(coords.lon, coords.lat),
            'Ngày 1 · 15:30 · Chiều Tà',
            1,
            actIdx++,
            totalBeacons
          )
        );
      }
    }

    if (this.bossDefeated) {
      list.push(
        buildTitanDefeatedEntry(
          `Ngày ${this.dayCount} · 18:45 · Hoàng Hôn`,
          this.dayCount,
          this.getPlayerCoordLabel()
        )
      );
    }

    if (this.companion) {
      list.push(
        buildCompanionJournalEntry(
          this.companion.customName,
          this.companion.speciesName,
          'Ngày 1 · 10:15 · Ban Mai',
          1,
          this.currentLocationName,
          this.getPlayerCoordLabel()
        )
      );
    }

    if (this.discoveredSpecies.size > 0) {
      list.push(
        buildSpeciesMilestoneEntry(
          this.discoveredSpecies.size,
          SPECIES_CATALOG.length,
          'Mẫu sinh học khảo sát',
          `Ngày ${this.dayCount} · 11:20 · Ban Mai`,
          this.dayCount,
          this.currentLocationName,
          this.getPlayerCoordLabel()
        )
      );
    }

    this.journalEntries = list;
  }

  public getCurrentWeatherPerks(): WeatherGameplayPerks {
    let nearCampfire = false;
    let nearBioLantern = false;
    if (this.player && this.world && this.world.structures) {
      for (const st of this.world.structures) {
        const d = Math.hypot(this.player.x - st.x, this.player.y - st.y);
        if (st.kind === StructureKind.CAMPFIRE && d < 175) nearCampfire = true;
        if (st.kind === StructureKind.BIO_LANTERN && d < 210) nearBioLantern = true;
      }
    }
    const weatherResist = this.unlockedSkills.has('weather_resist') ? 0.5 : 0;
    return computeWeatherGameplayPerks(
      this.activeWeather,
      this.weatherIntensity,
      nearCampfire,
      nearBioLantern,
      weatherResist
    );
  }

  public selectHotbarSlot(slot: number): void {
    if (slot < 0 || slot > 5) return;
    if (slot === 2) {
      this.consumeBerry();
      return;
    }
    if (slot === 3) {
      this.consumePotion();
      return;
    }
    const wasActive = this.player.microscopeActive;
    this.player.selectedSlot = slot;
    this.player.microscopeActive = slot === 1;
    if (slot === 1) {
      if (!wasActive) sound.playMicroscopeToggle(true);
      this.performBioScan();
    } else if (wasActive) {
      sound.playMicroscopeToggle(false);
    }
    this.emitHudSnapshot();
  }

  public toggleMicroscope(): void {
    if (this.player.selectedSlot === 1) {
      this.player.selectedSlot = 0;
      this.player.microscopeActive = false;
      sound.playMicroscopeToggle(false);
    } else {
      this.player.selectedSlot = 1;
      this.player.microscopeActive = true;
      sound.playMicroscopeToggle(true);
      this.performBioScan();
    }
    this.emitHudSnapshot();
  }

  private registerSpeciesDiscovery(speciesId?: string): boolean {
    if (!speciesId) return false;
    if (this.discoveredSpecies.has(speciesId)) return false;
    const sp = SPECIES_BY_ID[speciesId];
    if (!sp) return false;

    this.discoveredSpecies.add(speciesId);
    this.inventory.bioSample += 1;
    sound.playCraftOrHeal();
    sound.playSpeciesSound(sp.id, 0.9);
    this.spawnFloatingText(
      this.player.x,
      this.player.y - 36,
      `Phát hiện mới: ${sp.name}! (+1 Mẫu Vi Sinh)`,
      '#a3e635',
      1.15
    );

    const totalDiscovered = this.discoveredSpecies.size;
    if (
      totalDiscovered === 1 ||
      totalDiscovered === 5 ||
      totalDiscovered === 10 ||
      totalDiscovered === 15 ||
      totalDiscovered === 20 ||
      totalDiscovered === SPECIES_CATALOG.length
    ) {
      this.addJournalEntry(
        buildSpeciesMilestoneEntry(
          totalDiscovered,
          SPECIES_CATALOG.length,
          sp.name,
          this.getFormattedTimestamp(),
          this.dayCount,
          this.currentLocationName,
          this.getPlayerCoordLabel()
        )
      );
    }

    return true;
  }

  public performBioScan(): void {
    const p = this.player;
    p.scannerPulseTimer = 0.55;
    p.attackCooldown = 0.32;
    sound.playMicrobeScan(false);

    const scanRadius = 175;
    let newlyFound = 0;
    let sampledColonies = 0;

    // 1. Scan Microbial Colonies (Bacteria)
    for (const col of this.world.microbes) {
      if (Math.hypot(col.x - p.x, col.y - p.y) <= scanRadius) {
        if (this.registerSpeciesDiscovery(col.speciesId)) newlyFound++;
        if (col.sampledCooldown <= 0) {
          col.sampledCooldown = 45;
          sampledColonies++;
          const weatherPerks = this.getCurrentWeatherPerks();
          const extraYield = weatherPerks.microbeExtraYield || 0;
          this.inventory.bioSample += 1 + extraYield;
          this.spawnBurst(col.x, col.y, col.color, 12, 95, true);
        }
      }
    }

    // 2. Scan Ambient Insects
    for (const ins of this.world.insects) {
      if (Math.hypot(ins.x - p.x, ins.y - p.y) <= scanRadius) {
        if (this.registerSpeciesDiscovery(ins.speciesId)) {
          newlyFound++;
          this.spawnBurst(ins.x, ins.y, ins.color, 10, 80, true);
        }
      }
    }

    // 3. Scan Flora (Plants)
    for (const res of this.world.resources) {
      if (res.respawnTimer > 0 || !res.speciesId) continue;
      if (Math.hypot(res.x - p.x, res.y - p.y) <= scanRadius) {
        if (this.registerSpeciesDiscovery(res.speciesId)) {
          newlyFound++;
          this.spawnBurst(res.x, res.y, '#4ade80', 10, 80, true);
        }
      }
    }

    // 4. Scan Fauna (Peaceful & Predator Animals)
    for (const ani of this.world.animals) {
      if (!ani.speciesId) continue;
      if (Math.hypot(ani.x - p.x, ani.y - p.y) <= scanRadius + 25) {
        if (this.registerSpeciesDiscovery(ani.speciesId)) {
          newlyFound++;
          this.spawnBurst(ani.x, ani.y, '#38bdf8', 12, 95, true);
        }
      }
    }

    if (newlyFound === 0 && sampledColonies > 0) {
      this.spawnFloatingText(p.x, p.y - 28, `+${sampledColonies} Mẫu Vi Khuẩn`, '#a3e635', 1.05);
    } else if (newlyFound === 0 && sampledColonies === 0) {
      this.spawnFloatingText(p.x, p.y - 26, 'Đã phân tích sinh vật quanh đây', '#94a3b8', 0.92);
    }

    if (newlyFound > 0) {
      this.saveWorld(true);
    }
    this.emitHudSnapshot();
  }

  private syncPlayerMaxVitals(healIncrease: boolean): void {
    const armorHp = ARMOR_HP_BONUS[this.player.equipment.armorTier] || 0;
    const skillBonuses = computePassiveSkillBonuses(this.unlockedSkills);
    const targetMaxHp = 100 + armorHp + skillBonuses.maxHpBonus;
    const targetMaxStamina = 100 + skillBonuses.maxStaminaBonus;

    if (healIncrease) {
      if (targetMaxHp > this.player.maxHp) {
        this.player.hp += targetMaxHp - this.player.maxHp;
      }
      if (targetMaxStamina > this.player.maxStamina) {
        this.player.stamina += targetMaxStamina - this.player.maxStamina;
      }
    }

    this.player.maxHp = targetMaxHp;
    this.player.hp = Math.min(this.player.maxHp, this.player.hp);
    this.player.maxStamina = targetMaxStamina;
    this.player.stamina = Math.min(this.player.maxStamina, this.player.stamina);
  }

  public craftItem(recipeId: string): boolean {
    const recipe = CRAFT_RECIPES.find((r) => r.id === recipeId);
    if (!recipe) return false;
    if (!recipe.isAvailable(this.player.equipment)) return false;
    if (!canAfford(this.inventory, recipe.costs)) return false;

    spendCosts(this.inventory, recipe.costs);
    if (recipe.applyUpgrade) {
      recipe.applyUpgrade(this.player.equipment, this.inventory);
      this.syncPlayerMaxVitals(true);
    }
    sound.playCraftOrHeal();
    this.spawnFloatingText(this.player.x, this.player.y - 28, `Đã chế tạo ${recipe.name}`, '#fde047', 1.15);
    this.spawnBurst(this.player.x, this.player.y, '#fbbf24', 18, 120, true);
    this.saveWorld(true);
    this.emitHudSnapshot();
    return true;
  }

  public unlockSkill(skillId: string): boolean {
    const skill = SKILL_BY_ID[skillId];
    if (!skill) return false;
    if (this.unlockedSkills.has(skillId)) return false;
    if (!isSkillPrerequisiteMet(skill, this.unlockedSkills)) return false;
    if (!canAfford(this.inventory, skill.costs)) return false;

    spendCosts(this.inventory, skill.costs);
    this.unlockedSkills.add(skillId);
    this.syncPlayerMaxVitals(true);

    sound.playSkillUnlock();
    this.addShake(0.18);
    this.spawnBurst(this.player.x, this.player.y, skill.accentColor, 24, 145, true);
    this.spawnBurst(this.player.x, this.player.y, '#fef08a', 14, 110, true);
    this.spawnFloatingText(
      this.player.x,
      this.player.y - 32,
      `Kỹ năng mới: ${skill.name} (${skill.statSummary})`,
      skill.accentColor,
      1.12
    );
    this.saveWorld(true);
    this.emitHudSnapshot();
    return true;
  }

  public fastTravelTo(targetX: number, targetY: number): void {
    this.player.x = Math.max(80, Math.min(WORLD_PIXEL_W - 80, targetX));
    this.player.y = Math.max(80, Math.min(WORLD_PIXEL_H - 80, targetY + 14));
    if (this.companion) {
      this.companion.x = this.player.x - 30;
      this.companion.y = this.player.y + 10;
      this.companion.vx = 0;
      this.companion.vy = 0;
    }
    this.camX = this.player.x;
    this.camY = this.player.y;
    this.checkLocationDiscovery();
    revealFogRadius(this.world.fog, this.player.x, this.player.y, 480);
    sound.playObeliskActivate();
    this.spawnBurst(this.player.x, this.player.y, '#38bdf8', 26, 150, true);
    this.spawnFloatingText(this.player.x, this.player.y - 32, 'Dịch Chuyển Thành Công', '#7dd3fc', 1.1);
    this.saveWorld(true);
    this.setGameState(GameState.PLAYING);
  }

  public advanceTimePhase(): void {
    // Advance smoothly to the next distinct ecological phase: Bình Minh (0.24) -> Giữa Trưa (0.50) -> Hoàng Hôn (0.75) -> Đêm Săn Mồi (0.92)
    const anchors = [0.24, 0.5, 0.75, 0.92];
    let nextT = anchors[0];
    let wrappedDay = false;
    const found = anchors.find((a) => a > this.timeOfDay + 0.04);
    if (found !== undefined) {
      nextT = found;
    } else {
      nextT = anchors[0];
      wrappedDay = true;
    }

    if (wrappedDay) {
      this.dayCount += 1;
    }
    this.timeOfDay = nextT;
    const phase = this.getDayPhase();
    this.lastDayPhase = phase;
    const isNightish = phase === 'DUSK' || phase === 'NIGHT';
    sound.unlock();
    sound.playDayPhaseTransition(!isNightish);

    const msg =
      phase === 'DAWN'
        ? `Bình Minh (${this.getClockLabel()}) · Thú ban ngày thức giấc`
        : phase === 'NOON'
        ? `Giữa Trưa (${this.getClockLabel()}) · Nắng đỉnh đầu, thú săn đêm ẩn mình`
        : phase === 'DUSK'
        ? `Hoàng Hôn (${this.getClockLabel()}) · Bầu trời đỏ rực, thú săn đêm thức tỉnh`
        : `Đêm Khuya (${this.getClockLabel()}) · Thú săn đêm rình mồi!`;

    this.spawnFloatingText(
      this.player.x,
      this.player.y - 36,
      msg,
      isNightish ? '#fbbf24' : '#fde68a',
      1.08
    );
    this.emitHudSnapshot();
  }

  public cycleWeatherPreset(): void {
    const order: (WeatherKind | null)[] = [
      WeatherKind.RAIN,
      WeatherKind.SNOW,
      WeatherKind.FOG,
      WeatherKind.BLIZZARD,
      WeatherKind.SANDSTORM,
      WeatherKind.WINDY,
      WeatherKind.CLEAR,
      null,
    ];
    const curKey = this.manualWeatherTimer > 0 ? this.manualWeatherOverride : null;
    const curIdx = order.indexOf(curKey);
    const nextChoice = order[(curIdx + 1) % order.length];

    sound.unlock();
    if (nextChoice === null) {
      this.manualWeatherOverride = null;
      this.manualWeatherTimer = 0;
      const biome = this.getBiomeAt(this.player.x, this.player.y);
      const natural = this.resolveDesiredWeather(biome);
      this.activeWeather = natural.kind;
      this.targetWeather = natural.kind;
      this.weatherIntensity = natural.kind === WeatherKind.CLEAR ? 0 : Math.max(0.55, natural.intensity);
      sound.playWeatherTransition(this.activeWeather);
      this.spawnFloatingText(
        this.player.x,
        this.player.y - 38,
        `Khí hậu tự động theo vùng (${WEATHER_LABELS[this.activeWeather]})`,
        '#86efac',
        1.04
      );
    } else {
      this.manualWeatherOverride = nextChoice;
      this.manualWeatherTimer = 75;
      this.activeWeather = nextChoice;
      this.targetWeather = nextChoice;
      this.lastAnnouncedWeather = nextChoice;
      this.weatherIntensity = nextChoice === WeatherKind.CLEAR ? 0 : 0.86;
      sound.playWeatherTransition(nextChoice);
      this.spawnFloatingText(
        this.player.x,
        this.player.y - 38,
        `Thời tiết: ${WEATHER_LABELS[nextChoice]}`,
        nextChoice === WeatherKind.SNOW || nextChoice === WeatherKind.BLIZZARD
          ? '#e0f2fe'
          : nextChoice === WeatherKind.FOG
          ? '#cbd5e1'
          : nextChoice === WeatherKind.SANDSTORM
          ? '#fcd34d'
          : '#7dd3fc',
        1.08
      );
    }
    this.updatePlayer(0.016);
    this.emitHudSnapshot();
  }

  public interactCompanionOrTame(): void {
    const nearestIdx = this.findNearestTamableAnimalIndex(115);
    if (nearestIdx >= 0) {
      this.tryTameAnimal(nearestIdx);
      return;
    }

    if (this.companion) {
      this.feedCompanion('berry');
      return;
    }

    this.spawnFloatingText(
      this.player.x,
      this.player.y - 28,
      'Tiến lại gần động vật hoang dã và nhấn [F] để thuần hóa!',
      '#fde68a',
      0.98
    );
  }

  private findNearestTamableAnimalIndex(maxDist: number): number {
    const p = this.player;
    let bestIdx = -1;
    let bestDist = maxDist;
    for (let i = 0; i < this.world.animals.length; i++) {
      const a = this.world.animals[i];
      if (a.isBoss || !(a.kind in COMPANION_PROFILES)) continue;
      const d = Math.hypot(a.x - p.x, a.y - p.y);
      if (d <= bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    return bestIdx;
  }

  private tryTameAnimal(animalIndex: number): void {
    const a = this.world.animals[animalIndex];
    if (!a || a.isBoss) return;
    const profile = COMPANION_PROFILES[a.kind];
    if (!profile) return;

    if (a.speciesId) {
      this.registerSpeciesDiscovery(a.speciesId);
    }

    let tameGain = 0;
    if (a.peaceful) {
      if (this.inventory.berry < 2) {
        this.spawnFloatingText(a.x, a.y - 28, 'Cần 2 Trái Cây để thuần hóa!', '#fca5a5', 1.0);
        return;
      }
      this.inventory.berry -= 2;
      tameGain = 100;
    } else {
      if (this.inventory.berry < 2 || this.inventory.bioSample < 1) {
        this.spawnFloatingText(
          a.x,
          a.y - 28,
          'Cần 2 Trái Cây + 1 Mẫu Vi Sinh để thuần hóa thú săn mồi!',
          '#fca5a5',
          0.98
        );
        return;
      }
      this.inventory.berry -= 2;
      this.inventory.bioSample -= 1;
      const isWeakened = a.hp <= a.maxHp * 0.65;
      tameGain = isWeakened ? 100 : 55;
      // Calms territorial predator temporarily while bonding
      a.state = EnemyState.WANDER;
      a.stateTimer = 4.5;
      a.vx *= 0.25;
      a.vy *= 0.25;
    }

    const nextProgress = Math.min(100, (a.tameProgress || 0) + tameGain);
    a.tameProgress = nextProgress;
    a.squash = -0.22;

    if (nextProgress < 100) {
      sound.playCraftOrHeal();
      this.spawnBurst(a.x, a.y, '#a3e635', 18, 115, true);
      this.spawnFloatingText(
        a.x,
        a.y - a.radius - 14,
        `Thuần hóa ${a.name}: ${Math.round(nextProgress)}% (Nhấn [F] lần nữa)`,
        '#bef264',
        1.04
      );
      this.emitHudSnapshot();
      return;
    }

    // Return previous companion peacefully to nature if swapping
    if (this.companion) {
      const released = createAnimalFromKind(
        this.nextEntityId++,
        this.companion.kind,
        this.companion.x,
        this.companion.y
      );
      released.peaceful = true;
      released.state = EnemyState.WANDER;
      this.world.animals.push(released);
    }

    this.world.animals.splice(animalIndex, 1);
    this.companion = this.buildCompanionInstance(
      a.kind,
      profile.defaultPetName,
      78,
      'BALANCED',
      a.x,
      a.y
    );

    sound.playObeliskActivate();
    sound.playAnimalCall(a.kind, 0.95);
    this.addShake(0.26);
    this.spawnBurst(a.x, a.y, '#fde047', 28, 155, true);
    this.spawnBurst(a.x, a.y, '#4ade80', 18, 120, true);
    this.spawnFloatingText(
      a.x,
      a.y - 34,
      `Đã thuần hóa ${profile.speciesName}! Hãy đặt tên cho thú cưng`,
      '#fde047',
      1.16
    );
    if (this.companion) {
      this.addJournalEntry(
        buildCompanionJournalEntry(
          this.companion.customName,
          profile.speciesName,
          this.getFormattedTimestamp(),
          this.dayCount,
          this.currentLocationName,
          this.getPlayerCoordLabel()
        )
      );
    }
    this.saveWorld(true);
    // Open Pet Naming & Management Modal so player can immediately customize pet name & role
    this.setGameState(GameState.PET_COMPANION);
  }

  public feedCompanion(food: 'berry' | 'potion'): boolean {
    if (!this.companion) return false;
    const c = this.companion;

    if (c.loyalty >= 99.5) {
      this.spawnFloatingText(c.x, c.y - 26, `${c.customName} đã no và tuyệt đối trung thành!`, '#a3e635', 0.96);
      return false;
    }

    if (food === 'berry') {
      if (this.inventory.berry <= 0) {
        this.spawnFloatingText(c.x, c.y - 24, 'Hết Trái Cây cho thú cưng!', '#fca5a5', 0.96);
        return false;
      }
      this.inventory.berry -= 1;
      c.loyalty = Math.min(100, c.loyalty + 18);
      c.squash = -0.22;
      sound.playCraftOrHeal();
      sound.playAnimalCall(c.kind, 0.75);
      this.spawnBurst(c.x, c.y, '#fb7185', 14, 95, true);
      this.spawnFloatingText(c.x, c.y - 28, `${c.customName}: +18 Độ trung thành`, '#4ade80', 1.05);
    } else {
      if (this.inventory.potion <= 0) {
        this.spawnFloatingText(c.x, c.y - 24, 'Chưa có Dược Thảo!', '#fca5a5', 0.96);
        return false;
      }
      this.inventory.potion -= 1;
      c.loyalty = Math.min(100, c.loyalty + 45);
      c.squash = -0.26;
      sound.playCraftOrHeal();
      this.spawnBurst(c.x, c.y, '#34d399', 20, 120, true);
      this.spawnFloatingText(c.x, c.y - 30, `${c.customName}: +45 Độ trung thành`, '#34d399', 1.12);
    }

    this.saveWorld(true);
    this.emitHudSnapshot();
    return true;
  }

  public renameCompanion(newName: string): void {
    if (!this.companion) return;
    const profile = COMPANION_PROFILES[this.companion.kind];
    const fallback = profile ? profile.defaultPetName : this.companion.speciesName;
    const clean = newName.trim().slice(0, 32) || fallback;
    this.companion.customName = clean;
    sound.playCraftOrHeal();
    this.spawnBurst(this.companion.x, this.companion.y, '#fde047', 16, 105, true);
    this.spawnFloatingText(this.companion.x, this.companion.y - 30, `Tên thú cưng: ${clean}`, '#fde047', 1.1);
    this.saveWorld(true);
    this.emitHudSnapshot();
  }

  public setCompanionMode(mode: PetMode): void {
    if (!this.companion) return;
    this.companion.mode = mode;
    sound.playPickup();
    this.spawnFloatingText(
      this.companion.x,
      this.companion.y - 26,
      `${this.companion.customName} · Chế độ ${PET_MODE_LABELS[mode]}`,
      '#7dd3fc',
      1.0
    );
    this.saveWorld(true);
    this.emitHudSnapshot();
  }

  public releaseCompanion(): void {
    if (!this.companion) return;
    const old = this.companion;
    const wild = createAnimalFromKind(this.nextEntityId++, old.kind, old.x, old.y);
    wild.peaceful = true;
    wild.state = EnemyState.WANDER;
    this.world.animals.push(wild);
    this.companion = null;
    sound.playPickup();
    this.spawnBurst(old.x, old.y, '#94a3b8', 16, 95, false);
    this.spawnFloatingText(old.x, old.y - 28, `Đã thả ${old.customName} về tự nhiên`, '#cbd5e1', 1.02);
    this.saveWorld(true);
    this.setGameState(GameState.PLAYING);
  }

  public getActiveStorageStructure(): PlacedStructure | null {
    if (this.activeStorageStructureId !== null) {
      const st = this.world.structures.find((s) => s.id === this.activeStorageStructureId);
      if (st && st.kind === StructureKind.FOOD_PRESERVER) return st;
    }
    const p = this.player;
    for (const st of this.world.structures) {
      if (st.kind === StructureKind.FOOD_PRESERVER && Math.hypot(p.x - st.x, p.y - st.y) < 130) {
        this.activeStorageStructureId = st.id;
        return st;
      }
    }
    return null;
  }

  public depositToActiveStorage(resource: 'berry' | 'bioSample', amount: number): void {
    const st = this.getActiveStorageStructure();
    if (!st) return;
    const avail = this.inventory[resource] || 0;
    const toDeposit = Math.max(1, Math.min(amount, avail));
    if (toDeposit <= 0) return;

    this.inventory[resource] -= toDeposit;
    if (resource === 'berry') {
      st.storedBerries = (st.storedBerries || 0) + toDeposit;
    } else {
      st.storedBioSamples = (st.storedBioSamples || 0) + toDeposit;
    }

    sound.playCraftOrHeal();
    this.spawnBurst(st.x, st.y - 12, '#38bdf8', 12, 85, true);
    const nameLabel = resource === 'berry' ? 'Trái Cây' : 'Mẫu Vi Sinh';
    this.spawnFloatingText(st.x, st.y - 28, `Đã cất ${toDeposit} ${nameLabel}`, '#a5f3fc', 1.05);
    this.saveWorld(true);
    this.emitHudSnapshot();
  }

  public withdrawFromActiveStorage(resource: 'berry' | 'bioSample', amount: number): void {
    const st = this.getActiveStorageStructure();
    if (!st) return;
    const stored = resource === 'berry' ? (st.storedBerries || 0) : (st.storedBioSamples || 0);
    const toWithdraw = Math.max(1, Math.min(amount, stored));
    if (toWithdraw <= 0) return;

    if (resource === 'berry') {
      st.storedBerries = Math.max(0, (st.storedBerries || 0) - toWithdraw);
    } else {
      st.storedBioSamples = Math.max(0, (st.storedBioSamples || 0) - toWithdraw);
    }
    this.inventory[resource] += toWithdraw;

    sound.playCraftOrHeal();
    this.spawnBurst(this.player.x, this.player.y - 12, '#38bdf8', 12, 85, true);
    const nameLabel = resource === 'berry' ? 'Trái Cây' : 'Mẫu Vi Sinh';
    this.spawnFloatingText(this.player.x, this.player.y - 28, `Đã lấy ${toWithdraw} ${nameLabel}`, '#38bdf8', 1.05);
    this.saveWorld(true);
    this.emitHudSnapshot();
  }

  public depositAllToActiveStorage(): void {
    const st = this.getActiveStorageStructure();
    if (!st) return;
    const berries = this.inventory.berry;
    const bio = this.inventory.bioSample;
    if (berries <= 0 && bio <= 0) return;

    if (berries > 0) {
      st.storedBerries = (st.storedBerries || 0) + berries;
      this.inventory.berry = 0;
    }
    if (bio > 0) {
      st.storedBioSamples = (st.storedBioSamples || 0) + bio;
      this.inventory.bioSample = 0;
    }

    sound.playCraftOrHeal();
    this.spawnBurst(st.x, st.y - 12, '#38bdf8', 16, 110, true);
    this.spawnFloatingText(st.x, st.y - 32, 'Đã cất toàn bộ thực phẩm & mẫu vi sinh!', '#a5f3fc', 1.12);
    this.saveWorld(true);
    this.emitHudSnapshot();
  }

  public withdrawAllFromActiveStorage(): void {
    const st = this.getActiveStorageStructure();
    if (!st) return;
    const berries = st.storedBerries || 0;
    const bio = st.storedBioSamples || 0;
    if (berries <= 0 && bio <= 0) return;

    if (berries > 0) {
      this.inventory.berry += berries;
      st.storedBerries = 0;
    }
    if (bio > 0) {
      this.inventory.bioSample += bio;
      st.storedBioSamples = 0;
    }

    sound.playCraftOrHeal();
    this.spawnBurst(this.player.x, this.player.y - 12, '#38bdf8', 16, 110, true);
    this.spawnFloatingText(this.player.x, this.player.y - 32, 'Đã lấy toàn bộ đồ từ thùng bảo quản!', '#38bdf8', 1.12);
    this.saveWorld(true);
    this.emitHudSnapshot();
  }

  public respawnAtSanctuary(): void {
    this.player.hp = this.player.maxHp;
    this.player.stamina = this.player.maxStamina;
    this.player.invulnTimer = 1.5;
    this.player.x = this.world.spawnX;
    this.player.y = this.world.spawnY + 20;
    this.camX = this.player.x;
    this.camY = this.player.y;
    sound.playObeliskActivate();
    this.spawnBurst(this.player.x, this.player.y, '#34d399', 28, 150, true);
    this.spawnFloatingText(this.player.x, this.player.y - 32, 'Đã Hồi Sinh Tại Trạm Trung Tâm', '#4ade80', 1.15);
    this.saveWorld(true);
    this.setGameState(GameState.PLAYING);
  }

  public advanceDialogue(): void {
    if (!this.activeDialogue) {
      this.setGameState(GameState.PLAYING);
      return;
    }
    if (this.activeDialogue.lineIndex + 1 < this.activeDialogue.lines.length) {
      this.activeDialogue = {
        ...this.activeDialogue,
        lineIndex: this.activeDialogue.lineIndex + 1,
      };
      sound.playPickup();
      this.callbacks.onOpenDialogue(this.activeDialogue);
    } else {
      this.activeDialogue = null;
      this.callbacks.onOpenDialogue(null);
      this.setGameState(GameState.PLAYING);
    }
  }

  private consumeBerry(): void {
    if (this.inventory.berry <= 0) {
      this.spawnFloatingText(this.player.x, this.player.y - 24, 'Hết Trái Cây!', '#fca5a5', 0.95);
      return;
    }
    if (this.player.hp >= this.player.maxHp && this.player.stamina >= this.player.maxStamina - 5) {
      this.spawnFloatingText(this.player.x, this.player.y - 24, 'Thể trạng đã đầy', '#cbd5e1', 0.95);
      return;
    }
    this.inventory.berry -= 1;
    const heal = 18;
    this.player.hp = Math.min(this.player.maxHp, this.player.hp + heal);
    this.player.stamina = Math.min(this.player.maxStamina, this.player.stamina + 35);
    sound.playCraftOrHeal();
    this.spawnBurst(this.player.x, this.player.y, '#fb7185', 10, 80, true);
    this.spawnFloatingText(this.player.x, this.player.y - 26, `+${heal} HP`, '#4ade80', 1.05);
    this.emitHudSnapshot();
  }

  private consumePotion(): void {
    if (this.inventory.potion <= 0) {
      this.spawnFloatingText(this.player.x, this.player.y - 24, 'Chưa có Dược Thảo!', '#fca5a5', 0.95);
      return;
    }
    if (this.player.hp >= this.player.maxHp) {
      this.spawnFloatingText(this.player.x, this.player.y - 24, 'Máu đã đầy', '#cbd5e1', 0.95);
      return;
    }
    this.inventory.potion -= 1;
    const heal = 60;
    this.player.hp = Math.min(this.player.maxHp, this.player.hp + heal);
    sound.playCraftOrHeal();
    this.spawnBurst(this.player.x, this.player.y, '#34d399', 18, 110, true);
    this.spawnFloatingText(this.player.x, this.player.y - 28, `+${heal} HP`, '#34d399', 1.18);
    this.emitHudSnapshot();
  }

  private bindEvents(): void {
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.clearInputs);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    window.addEventListener('pointerup', this.handlePointerUp);
    this.canvas.addEventListener('pointermove', this.handlePointerMove);
    this.canvas.addEventListener('contextmenu', this.preventContext);
  }

  public destroy(): void {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.clearInputs);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);

    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    window.removeEventListener('pointerup', this.handlePointerUp);
    this.canvas.removeEventListener('pointermove', this.handlePointerMove);
    this.canvas.removeEventListener('contextmenu', this.preventContext);
  }

  private preventContext = (e: Event): void => {
    e.preventDefault();
  };

  private clearInputs = (): void => {
    this.keysHeld.clear();
    this.keysJustPressed.clear();
    this.mouseHeld = false;
  };

  private handleVisibilityChange = (): void => {
    if (document.hidden) {
      this.clearInputs();
    }
  };

  private handleResize = (): void => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  private handleKeyDown = (e: KeyboardEvent): void => {
    const target = e.target as HTMLElement | null;
    if (
      target &&
      (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
    ) {
      if (e.code === 'Escape') {
        target.blur();
      }
      return;
    }

    const code = e.code;

    if (this.gameState === GameState.TITLE) {
      if (code === 'Enter' || code === 'Space') {
        e.preventDefault();
        sound.unlock();
        sound.playObeliskActivate();
        this.setGameState(GameState.PLAYING);
      }
      return;
    }

    if (this.gameState === GameState.DIALOGUE) {
      if (code === 'KeyE' || code === 'Space' || code === 'Enter' || code === 'Escape') {
        e.preventDefault();
        this.advanceDialogue();
      }
      return;
    }

    if (code === 'Escape') {
      e.preventDefault();
      if (this.gameState === GameState.PLAYING) {
        this.setGameState(GameState.PAUSED);
      } else if (
        this.gameState === GameState.PAUSED ||
        this.gameState === GameState.CRAFTING ||
        this.gameState === GameState.SKILL_TREE ||
        this.gameState === GameState.PET_COMPANION ||
        this.gameState === GameState.WORLD_MAP ||
        this.gameState === GameState.CODEX ||
        this.gameState === GameState.JOURNAL ||
        this.gameState === GameState.STORAGE ||
        this.gameState === GameState.BUILD_MENU
      ) {
        this.setGameState(GameState.PLAYING);
      }
      return;
    }

    if (code === 'KeyL') {
      e.preventDefault();
      if (this.gameState === GameState.PLAYING) {
        this.setGameState(GameState.JOURNAL);
      } else if (this.gameState === GameState.JOURNAL) {
        this.setGameState(GameState.PLAYING);
      }
      return;
    }

    if (code === 'KeyB') {
      e.preventDefault();
      if (this.gameState === GameState.PLAYING) {
        this.setGameState(GameState.BUILD_MENU);
      } else if (this.gameState === GameState.BUILD_MENU) {
        this.setGameState(GameState.PLAYING);
      }
      return;
    }

    if (code === 'KeyN') {
      e.preventDefault();
      if (this.gameState === GameState.PLAYING) {
        this.setGameState(GameState.CODEX);
      } else if (this.gameState === GameState.CODEX) {
        this.setGameState(GameState.PLAYING);
      }
      return;
    }

    if (code === 'KeyC') {
      e.preventDefault();
      if (this.gameState === GameState.PLAYING) {
        this.setGameState(GameState.CRAFTING);
      } else if (this.gameState === GameState.CRAFTING) {
        this.setGameState(GameState.PLAYING);
      }
      return;
    }

    if (code === 'KeyT') {
      e.preventDefault();
      if (this.gameState === GameState.PLAYING) {
        this.setGameState(GameState.SKILL_TREE);
      } else if (this.gameState === GameState.SKILL_TREE) {
        this.setGameState(GameState.PLAYING);
      }
      return;
    }

    if (code === 'KeyP') {
      e.preventDefault();
      if (this.gameState === GameState.PLAYING) {
        this.setGameState(GameState.PET_COMPANION);
      } else if (this.gameState === GameState.PET_COMPANION) {
        this.setGameState(GameState.PLAYING);
      }
      return;
    }

    if (code === 'KeyM' || code === 'Tab') {
      e.preventDefault();
      if (this.gameState === GameState.PLAYING) {
        this.setGameState(GameState.WORLD_MAP);
      } else if (this.gameState === GameState.WORLD_MAP) {
        this.setGameState(GameState.PLAYING);
      }
      return;
    }

    if (this.gameState !== GameState.PLAYING) return;

    if (!this.keysHeld.has(code)) {
      this.keysJustPressed.add(code);
      if (code === 'Space' || code === 'ShiftLeft') {
        this.dashBuffer = 0.14;
      }
      if (code === 'KeyJ') {
        this.attackBuffer = 0.14;
      }
      if (code === 'KeyV') {
        this.toggleMicroscope();
      }
      if (code === 'KeyR') {
        this.tryDeconstructNearestStructure();
      }
      if (code === 'KeyF') {
        this.interactCompanionOrTame();
      }
      if (code === 'KeyN') {
        this.advanceTimePhase();
      }
      if (code === 'KeyK') {
        this.cycleWeatherPreset();
      }
      if (code === 'Digit1') this.selectHotbarSlot(0);
      if (code === 'Digit2') this.selectHotbarSlot(1);
      if (code === 'Digit3') this.selectHotbarSlot(2);
      if (code === 'Digit4' || code === 'KeyQ') this.selectHotbarSlot(3);
      if (code === 'Digit5') this.selectHotbarSlot(4);
      if (code === 'Digit6') this.selectHotbarSlot(5);
    }
    this.keysHeld.add(code);
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    this.keysHeld.delete(e.code);
  };

  private handlePointerDown = (e: PointerEvent): void => {
    sound.unlock();
    const rect = this.canvas.getBoundingClientRect();
    this.mouseScreenX = e.clientX - rect.left;
    this.mouseScreenY = e.clientY - rect.top;
    this.pointerInside = true;

    if (this.gameState === GameState.PLAYING && e.button === 0) {
      this.mouseHeld = true;
      this.attackBuffer = 0.14;
    } else if (this.gameState === GameState.PLAYING && e.button === 2) {
      this.dashBuffer = 0.14;
    }
  };

  private handlePointerUp = (e: PointerEvent): void => {
    if (e.button === 0) {
      this.mouseHeld = false;
    }
  };

  private handlePointerMove = (e: PointerEvent): void => {
    const rect = this.canvas.getBoundingClientRect();
    this.mouseScreenX = e.clientX - rect.left;
    this.mouseScreenY = e.clientY - rect.top;
    this.pointerInside = true;
  };

  private startLoop(): void {
    this.lastTimestamp = performance.now();
    const tick = (now: number) => {
      const rawDt = (now - this.lastTimestamp) / 1000;
      this.lastTimestamp = now;
      const dt = Math.min(Math.max(rawDt, 0.001), 0.05);

      this.update(dt);
      this.render();

      this.keysJustPressed.clear();
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private update(dt: number): void {
    this.globalTime += dt;
    this.shakeTrauma = Math.max(0, this.shakeTrauma - dt * 2.4);

    if (this.arrivalBannerTimer > 0) {
      this.arrivalBannerTimer -= dt;
      if (this.arrivalBannerTimer <= 0) {
        this.arrivalBanner = null;
      }
    }

    if (this.newJournalAlertTimer > 0) {
      this.newJournalAlertTimer -= dt;
      if (this.newJournalAlertTimer <= 0) {
        this.newJournalAlert = null;
      }
    }

    if (this.gameState === GameState.TITLE) {
      this.titlePanAngle += dt * 0.095;
      const panRadius = 920;
      this.camX = this.world.spawnX + Math.cos(this.titlePanAngle) * panRadius;
      this.camY = this.world.spawnY + 340 + Math.sin(this.titlePanAngle * 0.75) * (panRadius * 0.68);
      this.updateWeather(dt, this.camX, this.camY, false);
      sound.updateBiomeAmbience(BiomeRegion.SANCTUARY, WeatherKind.CLEAR, 0, false, false, dt);
      this.updateInsects(dt);
      this.updateAmbientParticles(dt);
      this.updateParticles(dt);
      return;
    }

    if (this.gameState !== GameState.PLAYING) {
      sound.updateBiomeAmbience(BiomeRegion.SANCTUARY, WeatherKind.CLEAR, 0, false, false, dt);
      return;
    }

    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      this.updateParticles(dt);
      this.updateFloatingTexts(dt);
      return;
    }

    const prevTime = this.timeOfDay;
    this.timeOfDay = (this.timeOfDay + dt / 240) % 1;
    if (this.timeOfDay < prevTime) {
      this.dayCount += 1;
      this.spawnFloatingText(this.player.x, this.player.y - 36, `Ngày ${this.dayCount} · Đêm Mới`, '#bae6fd', 1.15);
    }

    const curPhase = this.getDayPhase();
    if (curPhase !== this.lastDayPhase) {
      this.lastDayPhase = curPhase;
      if (curPhase === 'DAWN') {
        sound.playDayPhaseTransition(true);
        this.spawnFloatingText(
          this.player.x,
          this.player.y - 40,
          'Bình minh ló rạng · Thú ban ngày thức giấc, thú săn đêm về ổ',
          '#fde68a',
          1.1
        );
      } else if (curPhase === 'DUSK') {
        this.spawnFloatingText(
          this.player.x,
          this.player.y - 40,
          'Hoàng hôn buông xuống · Hãy chuẩn bị Lửa Trại hoặc Đèn Sinh Học!',
          '#fdba74',
          1.08
        );
      } else if (curPhase === 'NIGHT') {
        sound.playDayPhaseTransition(false);
        this.spawnFloatingText(
          this.player.x,
          this.player.y - 40,
          'Màn đêm bao phủ · Thú săn đêm thức tỉnh đi săn!',
          '#fbbf24',
          1.12
        );
      }
    }

    this.attackBuffer = Math.max(0, this.attackBuffer - dt);
    this.dashBuffer = Math.max(0, this.dashBuffer - dt);

    const activeBiome = this.getBiomeAt(this.player.x, this.player.y);
    const isNight = this.timeOfDay < 0.22 || this.timeOfDay > 0.78;
    this.updateWeather(dt, this.player.x, this.player.y, true);
    sound.updateBiomeAmbience(
      activeBiome,
      this.activeWeather,
      this.weatherIntensity,
      isNight,
      true,
      dt
    );
    this.updatePlayer(dt);
    this.checkLocationDiscovery();
    this.updateInteractions();
    this.updateResourcesAndMicrobes(dt);
    this.updateInsects(dt);
    this.updateAnimals(dt);
    this.updateProximityBioSounds(dt);
    this.updateCompanion(dt);
    this.updateProjectiles(dt);
    this.updateLootDrops(dt);
    this.updateAmbientParticles(dt);
    this.updateParticles(dt);
    this.updateFloatingTexts(dt);
    this.updateMultiplayerSync(dt);

    const visRatio = Math.max(0.35, this.currentVisibilityPercent / 100);
    const lookAheadDist = 26 * visRatio;
    const lookAheadX = Math.cos(this.player.aimAngle) * lookAheadDist;
    const lookAheadY = Math.sin(this.player.aimAngle) * lookAheadDist;
    const camSmooth = 1 - Math.exp(-9.5 * dt);
    this.camX += (this.player.x + lookAheadX - this.camX) * camSmooth;
    this.camY += (this.player.y + lookAheadY - this.camY) * camSmooth;

    this.hudSyncTimer += dt;
    if (this.hudSyncTimer >= 0.14) {
      this.hudSyncTimer = 0;
      const skillBonuses = computePassiveSkillBonuses(this.unlockedSkills);
      const dynamicRevealPx = Math.max(
        150,
        Math.round(390 * visRatio * (1 + skillBonuses.fogRevealMultiplier))
      );
      revealFogRadius(this.world.fog, this.player.x, this.player.y, dynamicRevealPx);
      this.emitHudSnapshot();
    }

    this.autoSaveTimer += dt;
    if (this.autoSaveTimer >= 16) {
      this.autoSaveTimer = 0;
      this.saveWorld(false);
    }
  }

  private getBiomeAt(wx: number, wy: number): BiomeRegion {
    const tx = Math.max(0, Math.min(WORLD_TILES_W - 1, Math.floor(wx / TILE_SIZE)));
    const ty = Math.max(0, Math.min(WORLD_TILES_H - 1, Math.floor(wy / TILE_SIZE)));
    return this.world.tiles[ty * WORLD_TILES_W + tx];
  }

  private isDeepImpassableOcean(wx: number, wy: number): boolean {
    const tx = Math.max(0, Math.min(WORLD_TILES_W - 1, Math.floor(wx / TILE_SIZE)));
    const ty = Math.max(0, Math.min(WORLD_TILES_H - 1, Math.floor(wy / TILE_SIZE)));
    if (this.world.tiles[ty * WORLD_TILES_W + tx] !== BiomeRegion.OCEAN) return false;
    // Allow wading 3 tiles into nearshore ocean reefs if Coast is adjacent!
    for (let dy = -3; dy <= 3; dy += 3) {
      for (let dx = -3; dx <= 3; dx += 3) {
        const nx = Math.max(0, Math.min(WORLD_TILES_W - 1, tx + dx));
        const ny = Math.max(0, Math.min(WORLD_TILES_H - 1, ty + dy));
        if (this.world.tiles[ny * WORLD_TILES_W + nx] === BiomeRegion.COAST) {
          return false;
        }
      }
    }
    return true;
  }

  private checkLocationDiscovery(): void {
    const currentBiome = this.getBiomeAt(this.player.x, this.player.y);
    if (!this.discoveredBiomes.has(currentBiome)) {
      this.discoveredBiomes.add(currentBiome);
      const lore = BIOME_JOURNAL_LORE[currentBiome];
      if (lore) {
        this.addJournalEntry({
          id: `biome_${currentBiome}_${Date.now()}`,
          category: 'BIOME',
          title: lore.title,
          narrative: lore.narrative,
          timestamp: this.getFormattedTimestamp(),
          dayCount: this.dayCount,
          locationName: REGION_LABELS[currentBiome] || this.currentLocationName,
          coords: this.getPlayerCoordLabel(),
          icon: lore.icon,
          accentColor: lore.accentColor,
        });
      }
    }

    const ptx = this.player.x / TILE_SIZE;
    const pty = this.player.y / TILE_SIZE;

    let nearestLoc = WORLD_LOCATIONS[0];
    let bestDist = Infinity;

    for (const loc of WORLD_LOCATIONS) {
      const d = Math.hypot(ptx - loc.tx, pty - loc.ty);
      if (d < bestDist) {
        bestDist = d;
        nearestLoc = loc;
      }
      if (d <= loc.radiusTiles && !this.discoveredLocations.has(loc.id)) {
        this.discoveredLocations.add(loc.id);
        this.arrivalBanner = `${loc.name} — ${loc.subtitle}`;
        this.arrivalBannerTimer = 4.2;
        sound.playObeliskActivate();
        this.saveWorld(true);
      }
    }

    this.currentLocationName =
      bestDist <= nearestLoc.radiusTiles * 1.4
        ? nearestLoc.name
        : REGION_LABELS[currentBiome];
  }

  private updatePlayer(dt: number): void {
    const p = this.player;
    p.invulnTimer = Math.max(0, p.invulnTimer - dt);
    p.hitFlash = Math.max(0, p.hitFlash - dt * 5);
    p.squash += (0 - p.squash) * Math.min(1, dt * 14);
    p.dashCooldown = Math.max(0, p.dashCooldown - dt);
    p.attackCooldown = Math.max(0, p.attackCooldown - dt);
    p.scannerPulseTimer = Math.max(0, p.scannerPulseTimer - dt);

    if (p.swingTimer > 0) {
      p.swingTimer = Math.max(0, p.swingTimer - dt);
    }

    const viewW = window.innerWidth;
    const viewH = window.innerHeight;
    if (this.pointerInside) {
      const worldMouseX = this.camX - viewW / 2 + this.mouseScreenX;
      const worldMouseY = this.camY - viewH / 2 + this.mouseScreenY;
      p.aimAngle = Math.atan2(worldMouseY - p.y, worldMouseX - p.x);
    }

    let moveX = 0;
    let moveY = 0;
    if (this.keysHeld.has('KeyW') || this.keysHeld.has('ArrowUp')) moveY -= 1;
    if (this.keysHeld.has('KeyS') || this.keysHeld.has('ArrowDown')) moveY += 1;
    if (this.keysHeld.has('KeyA') || this.keysHeld.has('ArrowLeft')) moveX -= 1;
    if (this.keysHeld.has('KeyD') || this.keysHeld.has('ArrowRight')) moveX += 1;

    const isMovingInput = moveX !== 0 || moveY !== 0;
    if (isMovingInput) {
      const len = Math.hypot(moveX, moveY);
      moveX /= len;
      moveY /= len;
      p.facingX = moveX;
      p.facingY = moveY;
      if (!this.pointerInside) {
        p.aimAngle = Math.atan2(moveY, moveX);
      }
    }

    const skillBonuses = computePassiveSkillBonuses(this.unlockedSkills);
    const weatherPerks = this.getCurrentWeatherPerks();
    const dashCost = Math.max(10, 22 - skillBonuses.dashStaminaDiscount);
    const dashCooldownMult = weatherPerks.dashCooldownMult || 1.0;
    const dashDistanceMult = weatherPerks.dashDistanceMult || 1.0;

    if (this.dashBuffer > 0 && p.dashCooldown <= 0 && p.stamina >= dashCost) {
      this.dashBuffer = 0;
      p.stamina -= dashCost;
      p.dashTimer = 0.17;
      p.dashCooldown = Math.max(0.2, (0.5 - skillBonuses.dashCooldownReduction) * dashCooldownMult);
      p.invulnTimer = Math.max(p.invulnTimer, 0.2);
      const dirX = isMovingInput ? moveX : Math.cos(p.aimAngle);
      const dirY = isMovingInput ? moveY : Math.sin(p.aimAngle);
      p.dashDirX = dirX;
      p.dashDirY = dirY;
      p.squash = 0.28;
      sound.playDash();
      this.spawnBurst(p.x, p.y, '#e2e8f0', 12, 95, false);
    }

    let nearCampfire = false;
    let nearBioLantern = false;
    for (const st of this.world.structures) {
      const d = Math.hypot(p.x - st.x, p.y - st.y);
      if (st.kind === StructureKind.CAMPFIRE && d < 175) nearCampfire = true;
      if (st.kind === StructureKind.BIO_LANTERN && d < 210) nearBioLantern = true;
    }

    let passiveRegenRate = nearCampfire ? 3.5 : nearBioLantern ? 2.2 : 0;
    if (skillBonuses.passiveHpRegenPerSec > 0 && p.stamina >= p.maxStamina * 0.8) {
      passiveRegenRate += skillBonuses.passiveHpRegenPerSec;
    }
    if (passiveRegenRate > 0) {
      this.campfireHealAccum += dt * passiveRegenRate;
      if (this.campfireHealAccum >= 1 && p.hp < p.maxHp) {
        const gain = Math.floor(this.campfireHealAccum);
        this.campfireHealAccum -= gain;
        p.hp = Math.min(p.maxHp, p.hp + gain);
      }
    }

    const currentBiome = this.getBiomeAt(p.x, p.y);
    const isWading = currentBiome === BiomeRegion.RIVER || currentBiome === BiomeRegion.OCEAN;
    const rawTerrainPenalty = isWading ? 0.22 : currentBiome === BiomeRegion.SNOW_PEAK ? 0.06 : 0;
    const terrainMult = 1 - rawTerrainPenalty * Math.max(0, 1 - skillBonuses.terrainPenaltyReduction);

    // Weather-driven movement speed, traction & visibility modifiers (mitigated by Armor, Passive Skills, Campfire & Bio-Lantern!)
    const wInt = this.weatherIntensity;
    const armorWeatherResist = ARMOR_WEATHER_RESIST[p.equipment.armorTier] || 0;
    const weatherResist = Math.min(0.92, armorWeatherResist + skillBonuses.weatherResistBonus);
    const resistFactor = 1 - weatherResist;
    let weatherSpeedMult = weatherPerks.moveSpeedMult;
    let tractionMult = weatherPerks.tractionMult;
    let staminaRegenMult = weatherPerks.staminaRegenMult;
    let visibilityPenalty = 0;
    let windPushX = 0;
    let windPushY = 0;
    let effectNote = isWading
      ? skillBonuses.terrainPenaltyReduction >= 0.5
        ? 'Kỹ năng lội suối giúp bước đi nhẹ nhàng'
        : 'Lội nước nông'
      : currentBiome === BiomeRegion.SNOW_PEAK
      ? 'Tuyết phủ nhẹ'
      : `${weatherPerks.bonusSummary} (${weatherPerks.challengeSummary})`;

    if (wInt > 0.05 && this.activeWeather !== WeatherKind.CLEAR) {
      switch (this.activeWeather) {
        case WeatherKind.BLIZZARD: {
          visibilityPenalty = 0.58 * wInt;
          if (!nearCampfire) {
            windPushX = this.windDirX * 36 * wInt * resistFactor;
            windPushY = this.windDirY * 36 * wInt * resistFactor;
          }
          break;
        }
        case WeatherKind.SNOW: {
          visibilityPenalty = 0.3 * wInt;
          if (isMovingInput && Math.random() < dt * 11 * wInt) {
            this.spawnSingleParticle(
              p.x + (Math.random() - 0.5) * 10,
              p.y + 9,
              (Math.random() - 0.5) * 20,
              -8 - Math.random() * 12,
              '#f8fafc',
              3.4,
              0.38,
              false
            );
          }
          break;
        }
        case WeatherKind.RAIN: {
          visibilityPenalty = 0.28 * wInt;
          windPushX = this.windDirX * 12 * wInt * resistFactor;
          windPushY = this.windDirY * 12 * wInt * resistFactor;
          if (isMovingInput && Math.random() < dt * 14 * wInt) {
            this.spawnSingleParticle(
              p.x,
              p.y + 8,
              (Math.random() - 0.5) * 32,
              (Math.random() - 0.5) * 22,
              '#93c5fd',
              3.3,
              0.32,
              false
            );
          }
          break;
        }
        case WeatherKind.FOG: {
          visibilityPenalty = 0.62 * wInt;
          break;
        }
        case WeatherKind.SANDSTORM: {
          visibilityPenalty = 0.5 * wInt;
          windPushX = this.windDirX * 28 * wInt * resistFactor;
          windPushY = this.windDirY * 28 * wInt * resistFactor;
          break;
        }
        case WeatherKind.WINDY: {
          visibilityPenalty = 0.05 * wInt;
          if (isMovingInput) {
            const align = moveX * this.windDirX + moveY * this.windDirY;
            weatherSpeedMult = 1 + align * 0.16 * wInt;
          }
          break;
        }
        default:
          break;
      }
    }

    tractionMult = Math.min(1.25, tractionMult + skillBonuses.tractionBonus);
    if (skillBonuses.ignoreWeatherStaminaPenalty && staminaRegenMult < 1) {
      staminaRegenMult = 1.0;
    }

    // Environmental Hazards Proximity & Status Effects
    let currentHazardAlert: string | null = null;
    if (this.world.hazards) {
      for (let i = 0; i < this.world.hazards.length; i++) {
        const h = this.world.hazards[i];
        const hDist = Math.hypot(p.x - h.x, p.y - h.y);
        if (hDist <= h.radius) {
          if (h.kind === HazardKind.VOLCANIC_HEAT_VENT) {
            currentHazardAlert = `🌋 ${h.name}: ${h.hazardNote}`;
            p.stamina = Math.max(0, p.stamina - dt * 14);
            if (!isWading && p.equipment.armorTier < 2 && Math.random() < dt * 0.75) {
              p.hp = Math.max(1, p.hp - 3);
              p.hitFlash = 0.5;
              sound.playEnemyHit(false);
              this.spawnSingleParticle(p.x, p.y, (Math.random() - 0.5) * 15, -28, '#f97316', 3.8, 0.45, true);
            }
          } else if (h.kind === HazardKind.GLACIAL_FROSTBITE) {
            currentHazardAlert = `❄️ ${h.name}: ${h.hazardNote}`;
            weatherSpeedMult *= 0.8;
            tractionMult *= 0.65;
            if (!nearCampfire && p.equipment.armorTier < 3 && Math.random() < dt * 0.75) {
              p.hp = Math.max(1, p.hp - 4);
              p.hitFlash = 0.5;
              sound.playEnemyHit(false);
              this.spawnSingleParticle(p.x, p.y, (Math.random() - 0.5) * 15, -22, '#38bdf8', 3.8, 0.45, true);
            }
          } else if (h.kind === HazardKind.SPORE_TOXIC_BOG) {
            currentHazardAlert = `☣️ ${h.name}: ${h.hazardNote}`;
            visibilityPenalty = Math.max(visibilityPenalty, 0.52);
            if (!p.microscopeActive && !nearBioLantern && Math.random() < dt * 0.85) {
              p.hp = Math.max(1, p.hp - 2);
              p.hitFlash = 0.5;
              sound.playEnemyHit(false);
              this.spawnSingleParticle(p.x, p.y, (Math.random() - 0.5) * 15, -22, '#a3e635', 3.8, 0.45, true);
            }
          } else if (h.kind === HazardKind.QUICKSAND) {
            currentHazardAlert = `🏜️ ${h.name}: ${h.hazardNote}`;
            weatherSpeedMult *= 0.4;
            if (p.equipment.armorTier < 2 && !this.unlockedSkills.has('sand_walker')) {
              p.stamina = Math.max(0, p.stamina - dt * 20);
            }
          } else if (h.kind === HazardKind.ROCKFALL) {
            currentHazardAlert = `🪨 ${h.name}: ${h.hazardNote}`;
            if (p.equipment.armorTier < 3 && !this.unlockedSkills.has('sturdy_helm')) {
              if (Math.random() < dt * 0.5) {
                p.hp = Math.max(1, p.hp - 8);
                p.hitFlash = 0.5;
                sound.playEnemyHit(false);
                this.addShake(0.3);
              }
            }
          } else if (h.kind === HazardKind.RAZOR_CORAL) {
            currentHazardAlert = `🪸 ${h.name}: ${h.hazardNote}`;
            if (isWading && p.equipment.armorTier < 2) {
              if (Math.random() < dt * 0.6) {
                p.hp = Math.max(1, p.hp - 5);
                p.hitFlash = 0.5;
                sound.playEnemyHit(false);
              }
            }
          }
          break;
        }
      }
    }
    this.activeHazardAlert = currentHazardAlert;

    // Light/heat beacons, passive weather sight skills & Bio-Scanner recover weather-obscured visibility!
    let visibilityRecovery = skillBonuses.weatherVisibilityBonus;
    if (nearBioLantern) visibilityRecovery += 0.22;
    else if (nearCampfire) visibilityRecovery += 0.17;
    if (p.microscopeActive) visibilityRecovery += 0.12;

    const netVisibility = Math.max(0.34, Math.min(1, 1 - Math.max(0, visibilityPenalty - visibilityRecovery)));
    this.currentVisibilityPercent = Math.round(netVisibility * 100);
    this.currentWeatherAudioNote =
      wInt > 0.08 && this.activeWeather !== WeatherKind.CLEAR
        ? WEATHER_AUDIO_NOTES[this.activeWeather]
        : WEATHER_AUDIO_NOTES[WeatherKind.CLEAR];

    const staminaRegenPerSec = 24 * (1 + skillBonuses.staminaRegenBonus) * staminaRegenMult;
    p.stamina = Math.min(p.maxStamina, p.stamina + dt * staminaRegenPerSec);

    let floorSpeedMult = 1.0;
    for (let i = 0; i < this.world.structures.length; i++) {
      const st = this.world.structures[i];
      if (st.kind === StructureKind.WOOD_FLOOR || st.kind === StructureKind.STONE_FLOOR) {
        if (Math.hypot(p.x - st.x, p.y - st.y) < 32) {
          const bonus = st.kind === StructureKind.STONE_FLOOR ? 1.3 : 1.2;
          if (bonus > floorSpeedMult) floorSpeedMult = bonus;
        }
      }
    }

    const stormStrideBonus =
      wInt > 0.12 && this.activeWeather !== WeatherKind.CLEAR
        ? skillBonuses.stormStrideSpeedBonus
        : 0;
    const skillSpeedMult = 1 + skillBonuses.moveSpeedBonus + stormStrideBonus;
    const combinedSpeedMult = Math.max(0.52, Math.min(1.75, terrainMult * weatherSpeedMult * skillSpeedMult * floorSpeedMult));
    this.currentMoveSpeedPercent = Math.round(combinedSpeedMult * 100);
    this.currentWeatherEffectNote = effectNote;

    // Footstep cadence & terrain/weather acoustic footsteps scale directly with movement speed!
    if (isMovingInput) {
      p.walkCycle += dt * 11 * combinedSpeedMult;
      const stepIdx = Math.floor(p.walkCycle / Math.PI);
      if (stepIdx !== this.lastFootstepStep) {
        this.lastFootstepStep = stepIdx;
        sound.playFootstep(currentBiome, this.activeWeather, wInt);
      }
    }

    if (isWading && isMovingInput && Math.random() < dt * 10) {
      this.spawnSingleParticle(p.x, p.y + 6, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20, '#bae6fd', 4, 0.35, false);
    }

    if (p.dashTimer > 0) {
      p.dashTimer -= dt;
      const dashSpd = (520 + skillBonuses.dashSpeedBonus) * dashDistanceMult;
      p.vx = p.dashDirX * dashSpd;
      p.vy = p.dashDirY * dashSpd;
    } else {
      const baseSpeed = 212 * combinedSpeedMult;
      const accel = 1 - Math.exp(-16 * tractionMult * dt);
      const targetVx = moveX * baseSpeed + windPushX;
      const targetVy = moveY * baseSpeed + windPushY;
      p.vx += (targetVx - p.vx) * accel;
      p.vy += (targetVy - p.vy) * accel;
    }

    this.moveWithWorldCollisions(p, dt, false);

    // Food & BioSample Perishable Degradation Logic
    const totalPerishables = this.inventory.berry + this.inventory.bioSample;
    if (totalPerishables <= 0) {
      this.perishableFreshness = 100;
      this.isPreservedByStructure = false;
      this.perishableStatusNote = 'Bao tải rỗng';
    } else {
      let preservedByStructure = false;
      let preservedByWeather = false;

      // Check nearby food preservers or research structures (radius 220px)
      for (const st of this.world.structures) {
        if (
          (st.kind === StructureKind.FOOD_PRESERVER || st.kind === StructureKind.RESEARCH_TENT) &&
          Math.hypot(p.x - st.x, p.y - st.y) < 220
        ) {
          preservedByStructure = true;
          break;
        }
      }

      // Check cold weather or cold arctic/tundra biomes
      if (
        this.activeWeather === WeatherKind.SNOW ||
        this.activeWeather === WeatherKind.BLIZZARD ||
        currentBiome === BiomeRegion.SNOW_PEAK ||
        currentBiome === BiomeRegion.MOUNTAIN
      ) {
        preservedByWeather = true;
      }

      this.isPreservedByStructure = preservedByStructure || preservedByWeather;

      if (preservedByStructure) {
        this.perishableFreshness = Math.min(100, this.perishableFreshness + dt * 18);
        this.perishableStatusNote = '❄️ An toàn (Thùng bảo quản)';
      } else if (preservedByWeather) {
        this.perishableFreshness = Math.min(100, this.perishableFreshness + dt * 12);
        this.perishableStatusNote = '❄️ An toàn (Khí hậu băng giá)';
      } else {
        // Unpreserved in warm/normal conditions: degrade slowly (2.2% per second)
        this.perishableFreshness -= dt * 2.2;
        if (this.perishableFreshness > 70) {
          this.perishableStatusNote = '🌿 Tươi mới (Bao dã ngoại)';
        } else if (this.perishableFreshness > 30) {
          this.perishableStatusNote = '🍂 Đang héo (Bao dã ngoại)';
        } else {
          this.perishableStatusNote = '⚠️ Sắp hỏng! (Bao dã ngoại)';
        }

        if (this.perishableFreshness <= 0) {
          this.perishableFreshness = 100;
          if (this.inventory.berry > 0) {
            this.inventory.berry -= 1;
            this.spawnFloatingText(p.x, p.y - 28, '1 Trái cây bị phân hủy!', '#f87171', 1.1);
          } else if (this.inventory.bioSample > 0) {
            this.inventory.bioSample -= 1;
            this.spawnFloatingText(p.x, p.y - 28, '1 Mẫu vi sinh bị hỏng!', '#f87171', 1.1);
          }
          sound.playEnemyHit(false);
          this.saveWorld(true);
        }
      }
    }

    if ((this.attackBuffer > 0 || (this.mouseHeld && p.selectedSlot === 0)) && p.attackCooldown <= 0) {
      this.attackBuffer = 0;
      if (p.selectedSlot === 1) {
        this.performBioScan();
      } else if (p.selectedSlot >= 4) {
        this.tryPlaceSelectedStructure();
      } else {
        this.performSlashAndHarvest();
      }
    }
  }

  private moveWithWorldCollisions(
    entity: { x: number; y: number; vx: number; vy: number; radius: number },
    dt: number,
    aquaticOnly: boolean
  ): void {
    const nextX = entity.x + entity.vx * dt;
    const blockedX = aquaticOnly
      ? this.getBiomeAt(nextX, entity.y) !== BiomeRegion.RIVER &&
        this.getBiomeAt(nextX, entity.y) !== BiomeRegion.OCEAN &&
        this.getBiomeAt(nextX, entity.y) !== BiomeRegion.COAST &&
        this.getBiomeAt(nextX, entity.y) !== BiomeRegion.RIVERBANK
      : this.isDeepImpassableOcean(nextX, entity.y);

    if (!blockedX) {
      entity.x = Math.max(70, Math.min(WORLD_PIXEL_W - 70, nextX));
    } else {
      entity.vx = 0;
    }

    const nextY = entity.y + entity.vy * dt;
    const blockedY = aquaticOnly
      ? this.getBiomeAt(entity.x, nextY) !== BiomeRegion.RIVER &&
        this.getBiomeAt(entity.x, nextY) !== BiomeRegion.OCEAN &&
        this.getBiomeAt(entity.x, nextY) !== BiomeRegion.COAST &&
        this.getBiomeAt(entity.x, nextY) !== BiomeRegion.RIVERBANK
      : this.isDeepImpassableOcean(entity.x, nextY);

    if (!blockedY) {
      entity.y = Math.max(70, Math.min(WORLD_PIXEL_H - 70, nextY));
    } else {
      entity.vy = 0;
    }

    for (let i = 0; i < this.world.resources.length; i++) {
      const r = this.world.resources[i];
      if (r.respawnTimer > 0) continue;
      if (r.kind === ResourceKind.SACRED_LOTUS || r.kind === ResourceKind.EDELWEISS_HERB || r.kind === ResourceKind.GIANT_KELP) {
        continue; // soft plants can be walked through smoothly
      }
      const dx = entity.x - r.x;
      const dy = entity.y - r.y;
      const minDist = entity.radius + r.radius * 0.7;
      if (Math.abs(dx) < minDist && Math.abs(dy) < minDist) {
        const dist = Math.hypot(dx, dy) || 0.01;
        if (dist < minDist) {
          const overlap = minDist - dist;
          entity.x += (dx / dist) * overlap;
          entity.y += (dy / dist) * overlap;
        }
      }
    }

    // Physical Wall Structures Collision Check (Wood Walls & Stone Walls)
    for (let i = 0; i < this.world.structures.length; i++) {
      const st = this.world.structures[i];
      if (st.kind === StructureKind.WOOD_WALL || st.kind === StructureKind.STONE_WALL) {
        const dx = entity.x - st.x;
        const dy = entity.y - st.y;
        const wallRadius = st.kind === StructureKind.STONE_WALL ? 24 : 18;
        const minDist = entity.radius + wallRadius;
        if (Math.abs(dx) < minDist && Math.abs(dy) < minDist) {
          const dist = Math.hypot(dx, dy) || 0.01;
          if (dist < minDist) {
            const overlap = minDist - dist;
            entity.x += (dx / dist) * overlap;
            entity.y += (dy / dist) * overlap;
          }
        }
      }
    }
  }

  public armStructureBlueprint(spec: BuildableStructureSpec): void {
    this.activeBlueprintSpec = spec;
    this.player.selectedSlot = 4;
    sound.playCraftOrHeal();
    this.spawnFloatingText(
      this.player.x,
      this.player.y - 32,
      `Bản vẽ: ${spec.name} (Nhấn [Click] hoặc [Space] để đặt)`,
      spec.accentColor,
      1.12
    );
    this.setGameState(GameState.PLAYING);
  }

  public tryDeconstructNearestStructure(): void {
    const p = this.player;
    let nearestIdx = -1;
    let nearestDist = 85;
    for (let i = 0; i < this.world.structures.length; i++) {
      const st = this.world.structures[i];
      const d = Math.hypot(p.x - st.x, p.y - st.y);
      if (d < nearestDist) {
        nearestDist = d;
        nearestIdx = i;
      }
    }

    if (nearestIdx < 0) {
      this.spawnFloatingText(p.x, p.y - 28, 'Không có công trình ở gần để tháo dỡ', '#94a3b8', 0.92);
      return;
    }

    const st = this.world.structures[nearestIdx];
    const spec = ALL_BUILDABLE_STRUCTURES.find((s) => s.kind === st.kind);
    if (spec) {
      for (const [resId, amount] of Object.entries(spec.costs)) {
        if (amount) {
          const refund = Math.max(1, Math.floor(amount * 0.75));
          this.inventory[resId as ResourceId] = (this.inventory[resId as ResourceId] || 0) + refund;
        }
      }
    }

    this.world.structures.splice(nearestIdx, 1);
    sound.playStoneClink(false);
    this.spawnBurst(st.x, st.y, '#94a3b8', 16, 110, false);
    this.spawnFloatingText(p.x, p.y - 32, 'Đã tháo dỡ công trình & thu hồi 75% nguyên liệu!', '#cbd5e1', 1.08);
    this.saveWorld(true);
    this.emitHudSnapshot();
  }

  private tryPlaceSelectedStructure(): void {
    const p = this.player;
    let buildKind: StructureKind | null = null;
    let buildName = 'Công Trình';
    let costs: Partial<Record<ResourceId, number>> = {};
    let hp = 240;

    if (this.activeBlueprintSpec) {
      buildKind = this.activeBlueprintSpec.kind;
      buildName = this.activeBlueprintSpec.name;
      costs = this.activeBlueprintSpec.costs;
      hp = this.activeBlueprintSpec.hp;
    } else {
      const buildSpec = BUILDABLE_SLOTS.find((b) => b.slotIndex === p.selectedSlot);
      if (buildSpec) {
        buildKind = buildSpec.kind;
        buildName = buildSpec.name;
        costs = buildSpec.costs;
        const fullSpec = ALL_BUILDABLE_STRUCTURES.find((s) => s.kind === buildSpec.kind);
        if (fullSpec) hp = fullSpec.hp;
      }
    }

    if (!buildKind) return;

    p.attackCooldown = 0.35;
    if (!canAfford(this.inventory, costs)) {
      this.spawnFloatingText(p.x, p.y - 28, 'Thiếu nguyên liệu xây dựng!', '#fca5a5', 1.0);
      return;
    }

    const tx = p.x + Math.cos(p.aimAngle) * 52;
    const ty = p.y + Math.sin(p.aimAngle) * 52;
    const bAt = this.getBiomeAt(tx, ty);
    if (bAt === BiomeRegion.OCEAN || bAt === BiomeRegion.RIVER) {
      this.spawnFloatingText(tx, ty - 16, 'Hãy xây trên đất liền hoặc bờ bãi', '#fca5a5', 0.95);
      return;
    }

    spendCosts(this.inventory, costs);
    this.world.structures.push({
      id: this.nextEntityId++,
      kind: buildKind,
      x: tx,
      y: ty,
      hp,
      maxHp: hp,
      collectedWater: 0,
    });

    revealFogRadius(this.world.fog, tx, ty, 440);
    sound.playCraftOrHeal();
    this.spawnBurst(tx, ty, '#38bdf8', 18, 105, true);
    this.spawnFloatingText(tx, ty - 24, `Đã hoàn thành ${buildName}!`, '#fde047', 1.08);

    if (this.world.structures.length === 1) {
      this.addJournalEntry(
        buildSurvivalMilestoneEntry(
          'Dựng Trạm Dã Ngoại Đầu Tiên',
          `Một ${buildName} đã được dựng lên giữa thiên nhiên hoang dã. Ánh sáng và hơi ấm xua tan bóng tối rình rập, hồi phục sinh lực và tạo điểm tựa an toàn cho các chặng hành trình viễn chinh tiếp theo.`,
          'flame',
          '#f97316',
          this.getFormattedTimestamp(),
          this.dayCount,
          this.currentLocationName,
          this.getPlayerCoordLabel()
        )
      );
    }

    this.activeBlueprintSpec = null;
    p.selectedSlot = 0;
    this.saveWorld(true);
    this.emitHudSnapshot();
  }

  private performSlashAndHarvest(): void {
    const p = this.player;
    p.attackCooldown = 0.28;
    p.swingDuration = 0.19;
    p.swingTimer = p.swingDuration;
    p.swingAngle = p.aimAngle;
    p.swingCombo = (p.swingCombo + 1) % 3;
    p.squash = -0.18;

    sound.playSwing(p.swingCombo);

    p.x += Math.cos(p.aimAngle) * 4.5;
    p.y += Math.sin(p.aimAngle) * 4.5;

    const swordDamage = SWORD_DAMAGE[p.equipment.swordTier] || 16;
    const toolPower = TOOL_POWER[p.equipment.toolTier] || 18;
    const reach = 58 + p.equipment.swordTier * 5;
    const arcHalf = 1.1;

    if (p.equipment.swordTier >= 3 && p.swingCombo === 2) {
      const spreadAngles = p.equipment.swordTier >= 5 ? [-0.18, 0, 0.18] : [0];
      const waveColor =
        p.equipment.swordTier >= 5
          ? '#a3e635'
          : p.equipment.swordTier === 4
          ? '#c084fc'
          : '#38bdf8';
      for (const offset of spreadAngles) {
        const ang = p.aimAngle + offset;
        this.spawnProjectile(
          true,
          p.x + Math.cos(ang) * 20,
          p.y + Math.sin(ang) * 20,
          Math.cos(ang) * 405,
          Math.sin(ang) * 405,
          p.equipment.swordTier >= 4 ? 11.5 : 9,
          Math.round(swordDamage * 0.85),
          waveColor,
          0.62
        );
      }
    }

    // 1. Harvest Flora & Mineral Nodes
    let hitAnyResource = false;
    for (let i = 0; i < this.world.resources.length; i++) {
      const r = this.world.resources[i];
      if (r.respawnTimer > 0) continue;
      const dx = r.x - p.x;
      const dy = r.y - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist > reach + r.radius) continue;

      const angleDiff = Math.abs(normalizeAngle(Math.atan2(dy, dx) - p.aimAngle));
      if (angleDiff <= arcHalf || dist < r.radius + 16) {
        hitAnyResource = true;
        r.hp -= toolPower;
        r.hitFlash = 1;
        r.squash = 0.25;

        if (r.speciesId) {
          this.registerSpeciesDiscovery(r.speciesId);
        }

        const isMineral =
          r.kind === ResourceKind.STONE_ROCK ||
          r.kind === ResourceKind.IRON_VEIN ||
          r.kind === ResourceKind.CRYSTAL_CLUSTER ||
          r.kind === ResourceKind.ANCIENT_CHEST;

        if (!isMineral) {
          sound.playWoodChop();
          this.spawnBurst(r.x, r.y - 6, '#84cc16', 7, 85, false);
        } else {
          sound.playStoneClink(r.kind === ResourceKind.CRYSTAL_CLUSTER);
          this.spawnBurst(r.x, r.y - 6, r.kind === ResourceKind.CRYSTAL_CLUSTER ? '#38bdf8' : '#cbd5e1', 8, 95, true);
        }

        if (r.hp <= 0) {
          this.harvestResourceNode(r);
        }
      }
    }

    // 2. Also allow net-catching / cataloging nearby Insects or Microbes in swing arc!
    for (const ins of this.world.insects) {
      if (Math.hypot(ins.x - p.x, ins.y - p.y) < reach + 14) {
        if (this.registerSpeciesDiscovery(ins.speciesId)) {
          this.spawnBurst(ins.x, ins.y, ins.color, 10, 80, true);
        }
      }
    }

    // 3. Check Animals (Predators take combat damage; Peaceful animals flee & get cataloged without dying!)
    let hitHeavy = false;
    for (let i = this.world.animals.length - 1; i >= 0; i--) {
      const a = this.world.animals[i];
      const dx = a.x - p.x;
      const dy = a.y - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist > reach + a.radius) continue;

      const angleDiff = Math.abs(normalizeAngle(Math.atan2(dy, dx) - p.aimAngle));
      if (angleDiff <= arcHalf || dist < a.radius + 16) {
        if (a.speciesId) {
          this.registerSpeciesDiscovery(a.speciesId);
        }
        if (a.peaceful) {
          // Peaceful wildlife sprints away safely and emits its natural call
          a.state = EnemyState.FLEE;
          a.stateTimer = 2.2;
          a.squash = 0.22;
          sound.playAnimalCall(a.kind, 0.72);
          const len = dist || 1;
          a.vx = (dx / len) * 220;
          a.vy = (dy / len) * 220;
          continue;
        }
        const weatherPerks = this.getCurrentWeatherPerks();
        const isCrit =
          p.swingCombo === 2 ||
          (weatherPerks.critChanceBonus > 0 && Math.random() < weatherPerks.critChanceBonus);
        const dmg = isCrit ? Math.round(swordDamage * 1.35) : swordDamage;
        this.damagePredator(a, i, dmg, dx, dy, isCrit);
        hitHeavy = hitHeavy || isCrit;
      }
    }

    if (hitHeavy) {
      this.hitstopTimer = 0.045;
      this.addShake(0.28);
    } else if (hitAnyResource) {
      this.addShake(0.09);
    }
  }

  private damagePredator(a: AnimalEntity, index: number, dmg: number, dx: number, dy: number, isCrit: boolean): void {
    a.hp -= dmg;
    a.hitFlash = 1;
    a.squash = 0.3;

    const len = Math.hypot(dx, dy) || 1;
    const kb = a.isBoss ? 70 : a.kind === AnimalKind.MOUNTAIN_BEAR ? 115 : 215;
    a.vx += (dx / len) * kb;
    a.vy += (dy / len) * kb;

    if (a.state === EnemyState.WANDER || a.state === EnemyState.IDLE) {
      a.state = EnemyState.CHASE;
    }

    sound.playEnemyHit(isCrit || Boolean(a.isBoss));
    this.spawnBurst(a.x, a.y, isCrit ? '#fde047' : '#f87171', isCrit ? 14 : 8, 125, isCrit);
    this.spawnFloatingText(a.x, a.y - a.radius - 8, `-${dmg}`, isCrit ? '#fde047' : '#ffffff', isCrit ? 1.2 : 1.0);

    if (a.hp <= 0) {
      this.world.animals.splice(index, 1);
      this.enemiesDefeated += 1;
      this.hitstopTimer = a.isBoss ? 0.08 : 0.04;
      this.addShake(a.isBoss ? 0.65 : 0.28);
      this.spawnBurst(a.x, a.y, '#fbbf24', a.isBoss ? 46 : 18, a.isBoss ? 220 : 140, true);

      this.dropLoot(a.x, a.y, 'bioSample', a.isBoss ? 8 : 2);
      this.dropLoot(a.x, a.y, 'berry', 1);

      if (a.isBoss) {
        this.bossDefeated = true;
        this.bossSpawned = false;
        sound.playObeliskActivate();
        this.addJournalEntry(
          buildTitanDefeatedEntry(
            this.getFormattedTimestamp(),
            this.dayCount,
            this.getPlayerCoordLabel()
          )
        );
        this.saveWorld(true);
        this.setGameState(GameState.VICTORY);
      }
    }
  }

  private harvestResourceNode(r: ResourceNode): void {
    r.respawnTimer = r.kind === ResourceKind.ANCIENT_CHEST ? 99999 : 70;
    this.resourcesGathered += 1;
    this.hitstopTimer = 0.032;
    this.addShake(0.2);

    const bonus = this.player.equipment.toolTier - 1;
    const weatherPerks = this.getCurrentWeatherPerks();
    const floraBonus = weatherPerks.floraExtraYield || 0;
    const mineralBonus = weatherPerks.mineralExtraYield || 0;
    this.spawnBurst(r.x, r.y, '#fde68a', 14, 120, true);

    switch (r.kind) {
      case ResourceKind.ANCIENT_OAK:
      case ResourceKind.RAINFOREST_BANYAN:
      case ResourceKind.WEEPING_WILLOW:
      case ResourceKind.ALPINE_PINE:
        this.dropLoot(r.x, r.y, 'wood', 3 + bonus + floraBonus);
        if (Math.random() < 0.35) this.dropLoot(r.x, r.y, 'berry', 1);
        break;
      case ResourceKind.COCONUT_PALM:
      case ResourceKind.SAGUARO_CACTUS:
        this.dropLoot(r.x, r.y, 'wood', 2 + bonus + floraBonus);
        this.dropLoot(r.x, r.y, 'berry', 2 + floraBonus);
        break;
      case ResourceKind.BERRY_BUSH:
      case ResourceKind.SACRED_LOTUS:
      case ResourceKind.GIANT_KELP:
      case ResourceKind.GLOW_MUSHROOM:
      case ResourceKind.EDELWEISS_HERB:
        this.dropLoot(r.x, r.y, 'berry', 2 + Math.min(1, bonus) + floraBonus);
        this.dropLoot(r.x, r.y, 'bioSample', 1);
        break;
      case ResourceKind.STONE_ROCK:
        this.dropLoot(r.x, r.y, 'stone', 3 + bonus + mineralBonus);
        break;
      case ResourceKind.IRON_VEIN:
        this.dropLoot(r.x, r.y, 'iron', 2 + bonus + mineralBonus);
        this.dropLoot(r.x, r.y, 'stone', 1 + mineralBonus);
        break;
      case ResourceKind.CRYSTAL_CLUSTER:
        this.dropLoot(r.x, r.y, 'crystal', 2 + bonus + mineralBonus);
        break;
      case ResourceKind.ANCIENT_CHEST:
        sound.playObeliskActivate();
        this.dropLoot(r.x, r.y, 'iron', 4);
        this.dropLoot(r.x, r.y, 'crystal', 3);
        this.dropLoot(r.x, r.y, 'bioSample', 3);
        this.dropLoot(r.x, r.y, 'potion', 1);
        this.spawnFloatingText(r.x, r.y - 26, 'Hòm Khảo Cổ Quý!', '#fde047', 1.2);
        break;
    }
  }

  private dropLoot(x: number, y: number, resource: ResourceId, amount: number): void {
    for (let i = 0; i < amount; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 65 + Math.random() * 85;
      this.lootDrops.push({
        id: this.nextEntityId++,
        resource,
        amount: 1,
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        age: 0,
      });
    }
  }

  private updateInteractions(): void {
    const p = this.player;
    if (!this.keysJustPressed.has('KeyE')) return;

    for (const npc of this.world.npcs) {
      if (Math.hypot(p.x - npc.x, p.y - npc.y) < 78) {
        this.activeDialogue = {
          npcName: npc.name,
          npcRole: npc.role,
          lines: npc.lines,
          lineIndex: 0,
        };
        sound.playPickup();
        this.callbacks.onOpenDialogue(this.activeDialogue);
        this.setGameState(GameState.DIALOGUE);
        return;
      }
    }

    for (const b of this.world.beacons) {
      if (Math.hypot(p.x - b.x, p.y - b.y) < 95) {
        if (!b.activated) {
          this.activateObelisk(b.id);
        } else {
          this.setGameState(GameState.WORLD_MAP);
        }
        return;
      }
    }

    if (Math.hypot(p.x - this.world.altarX, p.y - this.world.altarY) < 110) {
      const activeCount = this.world.beacons.filter((b) => b.activated).length;
      if (this.bossSpawned) return;
      if (activeCount < 3) {
        this.spawnFloatingText(
          this.world.altarX,
          this.world.altarY - 36,
          `Cần kích hoạt 3 Trạm Quan Trắc (${activeCount}/3)`,
          '#fde047',
          1.1
        );
        return;
      }
      this.bossSpawned = true;
      const boss = createAnimalFromKind(
        this.nextEntityId++,
        AnimalKind.ANCIENT_TITAN,
        this.world.altarX,
        this.world.altarY - 60
      );
      this.world.animals.push(boss);
      sound.playBossSlam();
      this.addShake(0.68);
      this.spawnBurst(boss.x, boss.y, '#f59e0b', 45, 220, true);
      this.spawnFloatingText(boss.x, boss.y - 54, 'Cổ Thần Địa Nhiệt Thức Tỉnh!', '#fde047', 1.28);
      this.addJournalEntry(
        buildTitanAwakeningEntry(
          this.getFormattedTimestamp(),
          this.dayCount,
          this.getPlayerCoordLabel()
        )
      );
      this.emitHudSnapshot();
      return;
    }

    for (const st of this.world.structures) {
      if (st.kind === StructureKind.FOOD_PRESERVER && Math.hypot(p.x - st.x, p.y - st.y) < 85) {
        this.activeStorageStructureId = st.id;
        this.setGameState(GameState.STORAGE);
        sound.playPickup();
        return;
      }
      if (st.kind === StructureKind.RAIN_COLLECTOR && Math.hypot(p.x - st.x, p.y - st.y) < 85) {
        const collected = st.collectedWater || 0;
        if (collected >= 20) {
          st.collectedWater = Math.max(0, collected - 20);
          this.inventory.potion += 1;
          sound.playCraftOrHeal();
          this.spawnBurst(st.x, st.y - 12, '#60a5fa', 16, 100, true);
          this.spawnFloatingText(st.x, st.y - 28, '+1 Dược Thảo (Thu hoạch Nước Mưa)', '#60a5fa', 1.1);
          this.saveWorld(true);
          this.emitHudSnapshot();
          return;
        } else {
          this.spawnFloatingText(st.x, st.y - 24, `Đang đọng sương/mưa (${Math.round(collected)}%)`, '#93c5fd', 0.95);
          return;
        }
      }
      if (st.kind === StructureKind.UPGRADE_BENCH && Math.hypot(p.x - st.x, p.y - st.y) < 85) {
        this.setGameState(GameState.UPGRADE);
        sound.playPickup();
        return;
      }
    }

    this.setGameState(GameState.CRAFTING);
  }

  private getCurrentInteractPrompt(): string | null {
    const p = this.player;
    for (const st of this.world.structures) {
      if (st.kind === StructureKind.FOOD_PRESERVER && Math.hypot(p.x - st.x, p.y - st.y) < 85) {
        const totalStored = (st.storedBerries || 0) + (st.storedBioSamples || 0);
        return `[E] Cất / Lấy thực phẩm bảo quản (${totalStored} món)`;
      }
      if (st.kind === StructureKind.RAIN_COLLECTOR && Math.hypot(p.x - st.x, p.y - st.y) < 85) {
        const collected = st.collectedWater || 0;
        return collected >= 20
          ? `[E] Thu hoạch Nước Mưa (${Math.round(collected)}% - Nhận +1 Dược Thảo)`
          : `Tháp Thu Nước Mưa: Đang đọng sương/mưa (${Math.round(collected)}%)`;
      }
      if (st.kind === StructureKind.UPGRADE_BENCH && Math.hypot(p.x - st.x, p.y - st.y) < 85) {
        return '[E] Nâng cấp trang bị';
      }
    }
    for (const npc of this.world.npcs) {
      if (Math.hypot(p.x - npc.x, p.y - npc.y) < 78) {
        return `[E] Trò chuyện với ${npc.name}`;
      }
    }
    for (const b of this.world.beacons) {
      if (!b.activated && Math.hypot(p.x - b.x, p.y - b.y) < 92) {
        return `[E] Kích hoạt ${b.name}`;
      }
    }
    const tamableIdx = this.findNearestTamableAnimalIndex(112);
    if (tamableIdx >= 0) {
      const a = this.world.animals[tamableIdx];
      const sleepTag = a.sleeping ? ' · Đang ngủ say' : '';
      const progText = a.tameProgress && a.tameProgress > 0 ? ` · Đã thân thiện ${Math.round(a.tameProgress)}%` : '';
      return a.peaceful
        ? `[F] Thuần hóa ${a.name} (2 Trái Cây${sleepTag}${progText})`
        : `[F] Thuần hóa ${a.name} (2 Trái Cây + 1 Mẫu Vi Sinh${sleepTag}${progText})`;
    }
    for (const col of this.world.microbes) {
      if (Math.hypot(p.x - col.x, p.y - col.y) < 62) {
        const sp = SPECIES_BY_ID[col.speciesId];
        return `[V / Phím 2] Soi kính hiển vi: ${sp ? sp.name : 'Quần thể vi khuẩn'}`;
      }
    }
    if (Math.hypot(p.x - this.world.altarX, p.y - this.world.altarY) < 110 && !this.bossSpawned) {
      const count = this.world.beacons.filter((b) => b.activated).length;
      return count >= 3
        ? '[E] Triệu hồi Cổ Thần Đỉnh Himalaya'
        : `Đài Đỉnh Himalaya (${count}/3 Trạm Quan Trắc)`;
    }
    return null;
  }

  private updateCompanion(dt: number): void {
    const c = this.companion;
    if (!c) return;
    const p = this.player;

    c.actionCooldown = Math.max(0, c.actionCooldown - dt);
    if (c.hitFlash > 0) c.hitFlash = Math.max(0, c.hitFlash - dt * 5.5);
    if (Math.abs(c.squash) > 0.002) c.squash += (0 - c.squash) * Math.min(1, dt * 13);

    // Loyalty dynamics: warms up near Campfire, slowly hungers over time / harsh storms
    let nearCampfire = false;
    for (const st of this.world.structures) {
      if (st.kind === StructureKind.CAMPFIRE && Math.hypot(c.x - st.x, c.y - st.y) < 180) {
        nearCampfire = true;
        break;
      }
    }
    if (nearCampfire && c.loyalty < 92) {
      c.loyalty = Math.min(100, c.loyalty + dt * 1.6);
    } else {
      const harshStorm =
        (this.activeWeather === WeatherKind.BLIZZARD || this.activeWeather === WeatherKind.SANDSTORM) &&
        this.weatherIntensity > 0.55;
      c.loyalty = Math.max(0, c.loyalty - dt * (harshStorm ? 0.3 : 0.15));
    }

    // Teleport leash if far behind across water/cliffs
    const distToPlayer = Math.hypot(p.x - c.x, p.y - c.y);
    if (distToPlayer > 520) {
      c.x = p.x - p.facingX * 34;
      c.y = p.y - p.facingY * 34;
      c.vx = 0;
      c.vy = 0;
      this.spawnBurst(c.x, c.y, '#a3e635', 10, 75, true);
    }

    // Companion Loot Fetching Magnet
    const magnetRange = c.mode === 'GATHER' || c.mode === 'BALANCED' ? 245 : 135;
    for (let i = this.lootDrops.length - 1; i >= 0; i--) {
      const drop = this.lootDrops[i];
      if (drop.age <= 0.14) continue;
      const dx = c.x - drop.x;
      const dy = c.y - drop.y;
      const d = Math.hypot(dx, dy);
      if (d < magnetRange) {
        const pull = 390 * (1 - d / (magnetRange + 15)) + 150;
        drop.x += (dx / (d || 1)) * pull * dt;
        drop.y += (dy / (d || 1)) * pull * dt;
      }
      if (d < 28) {
        this.inventory[drop.resource] = (this.inventory[drop.resource] || 0) + drop.amount;
        const meta = RESOURCE_META[drop.resource];
        sound.playPickup();
        this.spawnFloatingText(c.x, c.y - 22, `+${drop.amount} ${meta.shortName}`, meta.color, 0.92);
        this.lootDrops.splice(i, 1);
        this.emitHudSnapshot();
      }
    }

    const tier = getLoyaltyTier(c.loyalty);
    let targetX = p.x - p.facingX * 38 + p.facingY * 22;
    let targetY = p.y - p.facingY * 38 - p.facingX * 22;
    let moveSpeed = 225;
    let engaged = false;

    // 1. Combat Assist (BALANCED or COMBAT when Loyalty >= 20)
    if (tier.mult > 0 && (c.mode === 'BALANCED' || c.mode === 'COMBAT')) {
      let bestEnemyIdx = -1;
      let bestScore = 290;
      for (let i = 0; i < this.world.animals.length; i++) {
        const a = this.world.animals[i];
        if (a.peaceful) continue;
        const dp = Math.hypot(a.x - p.x, a.y - p.y);
        if (dp > 285) continue;
        const aggressiveBonus =
          a.state === EnemyState.CHASE || a.state === EnemyState.WINDUP || a.state === EnemyState.ATTACK ? -65 : 0;
        const score = dp + aggressiveBonus;
        if (score < bestScore) {
          bestScore = score;
          bestEnemyIdx = i;
        }
      }

      if (bestEnemyIdx >= 0) {
        const enemy = this.world.animals[bestEnemyIdx];
        engaged = true;
        targetX = enemy.x;
        targetY = enemy.y;
        moveSpeed = 268;
        const dx = enemy.x - c.x;
        const dy = enemy.y - c.y;
        const dEnemy = Math.hypot(dx, dy);

        if (dEnemy <= c.radius + enemy.radius + 26 && c.actionCooldown <= 0) {
          c.actionCooldown = tier.cadence;
          c.squash = -0.26;
          const len = dEnemy || 1;
          c.vx = (dx / len) * 210;
          c.vy = (dy / len) * 210;
          const finalDmg = Math.max(4, Math.round(c.damage * tier.mult));
          if (enemy.speciesId) {
            this.registerSpeciesDiscovery(enemy.speciesId);
          }
          this.spawnBurst(enemy.x, enemy.y, '#4ade80', 9, 105, true);
          this.damagePredator(enemy, bestEnemyIdx, finalDmg, dx, dy, tier.mult > 1.2);
          c.loyalty = Math.min(100, c.loyalty + 0.45);
        }
      }
    }

    // 2. Resource Gathering Assist (BALANCED when clear of enemies, or GATHER when Loyalty >= 20)
    if (!engaged && tier.mult > 0 && (c.mode === 'BALANCED' || c.mode === 'GATHER')) {
      let bestRes: ResourceNode | null = null;
      let bestResDist = 215;
      for (let i = 0; i < this.world.resources.length; i++) {
        const r = this.world.resources[i];
        if (r.respawnTimer > 0 || r.kind === ResourceKind.ANCIENT_CHEST) continue;
        const dp = Math.hypot(r.x - p.x, r.y - p.y);
        if (dp < bestResDist) {
          bestResDist = dp;
          bestRes = r;
        }
      }

      if (bestRes) {
        engaged = true;
        targetX = bestRes.x;
        targetY = bestRes.y;
        moveSpeed = 235;
        const dx = bestRes.x - c.x;
        const dy = bestRes.y - c.y;
        const dRes = Math.hypot(dx, dy);

        if (dRes <= c.radius + bestRes.radius + 22 && c.actionCooldown <= 0) {
          c.actionCooldown = tier.cadence * 1.05;
          c.squash = -0.22;
          const gatherHit = Math.max(4, Math.round(c.gatherPower * tier.mult));
          bestRes.hp -= gatherHit;
          bestRes.hitFlash = 1;
          bestRes.squash = 0.22;

          if (bestRes.speciesId) {
            this.registerSpeciesDiscovery(bestRes.speciesId);
          }

          const isMineral =
            bestRes.kind === ResourceKind.STONE_ROCK ||
            bestRes.kind === ResourceKind.IRON_VEIN ||
            bestRes.kind === ResourceKind.CRYSTAL_CLUSTER;

          if (isMineral) {
            sound.playStoneClink(bestRes.kind === ResourceKind.CRYSTAL_CLUSTER);
            this.spawnBurst(bestRes.x, bestRes.y - 4, '#7dd3fc', 6, 80, true);
          } else {
            sound.playWoodChop();
            this.spawnBurst(bestRes.x, bestRes.y - 4, '#a3e635', 6, 75, false);
          }

          if (bestRes.hp <= 0) {
            this.harvestResourceNode(bestRes);
            c.loyalty = Math.min(100, c.loyalty + 0.4);
          }
        }
      }
    }

    // Smooth steering toward target or flanking formation
    const tx = targetX - c.x;
    const ty = targetY - c.y;
    const tDist = Math.hypot(tx, ty);
    if (tDist > (engaged ? 18 : 10)) {
      const desiredVx = (tx / tDist) * moveSpeed;
      const desiredVy = (ty / tDist) * moveSpeed;
      c.vx += (desiredVx - c.vx) * Math.min(1, dt * 8.5);
      c.vy += (desiredVy - c.vy) * Math.min(1, dt * 8.5);
      c.animPhase += dt * 9.5;
    } else {
      c.vx *= Math.pow(0.08, dt);
      c.vy *= Math.pow(0.08, dt);
      c.animPhase += dt * 3.2;
    }

    this.moveWithWorldCollisions(c, dt, false);
  }

  private updateResourcesAndMicrobes(dt: number): void {
    for (let i = 0; i < this.world.resources.length; i++) {
      const r = this.world.resources[i];
      if (r.respawnTimer > 0) {
        r.respawnTimer -= dt;
        if (r.respawnTimer <= 0) {
          r.respawnTimer = 0;
          r.hp = r.maxHp;
          r.squash = -0.25;
        }
        continue;
      }
      if (r.hitFlash > 0) r.hitFlash = Math.max(0, r.hitFlash - dt * 5.5);
      if (Math.abs(r.squash) > 0.002) r.squash += (0 - r.squash) * Math.min(1, dt * 14);
    }

    for (let i = 0; i < this.world.microbes.length; i++) {
      const m = this.world.microbes[i];
      if (m.sampledCooldown > 0) {
        m.sampledCooldown = Math.max(0, m.sampledCooldown - dt);
      }
    }

    // Passive Structure Mechanics (Rain Water Collection & Base Auto-Repair)
    for (let i = 0; i < this.world.structures.length; i++) {
      const st = this.world.structures[i];
      if (st.kind === StructureKind.RAIN_COLLECTOR) {
        const isRainingOrFoggy =
          this.activeWeather === WeatherKind.RAIN ||
          this.activeWeather === WeatherKind.SNOW ||
          this.activeWeather === WeatherKind.FOG ||
          this.activeWeather === WeatherKind.BLIZZARD;
        if (isRainingOrFoggy) {
          st.collectedWater = Math.min(
            100,
            (st.collectedWater || 0) + dt * 4.5 * Math.max(0.5, this.weatherIntensity)
          );
        }
      } else if (st.kind === StructureKind.REPAIR_STATION) {
        for (let j = 0; j < this.world.structures.length; j++) {
          const targetSt = this.world.structures[j];
          if (targetSt.id !== st.id && targetSt.hp < targetSt.maxHp) {
            if (Math.hypot(st.x - targetSt.x, st.y - targetSt.y) < 220) {
              targetSt.hp = Math.min(targetSt.maxHp, targetSt.hp + dt * 16);
              if (Math.random() < dt * 2.2) {
                this.spawnSingleParticle(
                  targetSt.x + (Math.random() - 0.5) * 16,
                  targetSt.y - 8,
                  0,
                  -18,
                  '#facc15',
                  2.5,
                  0.4,
                  true
                );
              }
            }
          }
        }
      }
    }
  }

  private isNightPeriod(): boolean {
    return this.timeOfDay < 0.22 || this.timeOfDay >= 0.79;
  }

  private isCrepuscularOrNight(): boolean {
    return this.timeOfDay < 0.28 || this.timeOfDay >= 0.71;
  }

  private updateInsects(dt: number): void {
    const isNight = this.isNightPeriod();
    const isDuskOrNight = this.isCrepuscularOrNight();

    for (let i = 0; i < this.world.insects.length; i++) {
      const ins = this.world.insects[i];
      if (Math.hypot(ins.x - this.camX, ins.y - this.camY) > 850) continue;

      const isFireflyOrNocturnalBeetle =
        ins.speciesId === 'water_firefly' || ins.speciesId === 'hercules_beetle';

      // Diurnal butterflies, bees & dragonflies rest quietly on foliage at night; Fireflies dance wider at dusk/night!
      if (!isFireflyOrNocturnalBeetle && isNight) {
        ins.wingPhase += dt * 1.4;
        ins.x += (ins.homeX - ins.x) * Math.min(1, dt * 2.2);
        ins.y += (ins.homeY - ins.y) * Math.min(1, dt * 2.2);
        continue;
      }

      const activeMult = isFireflyOrNocturnalBeetle ? (isDuskOrNight ? 1.35 : 0.35) : 1.0;
      ins.wingPhase += dt * (ins.isFlying ? 18 : 9) * activeMult;
      const orbitAng = this.globalTime * (ins.isFlying ? 1.1 : 0.55) * activeMult + ins.id * 1.7;
      const radius = (ins.isFlying ? 44 : 22) * (isFireflyOrNocturnalBeetle && isDuskOrNight ? 1.4 : 1.0);
      const targetX = ins.homeX + Math.cos(orbitAng) * radius;
      const targetY = ins.homeY + Math.sin(orbitAng * 1.3) * radius;

      ins.x += (targetX - ins.x) * Math.min(1, dt * 3.5);
      ins.y += (targetY - ins.y) * Math.min(1, dt * 3.5);
    }
  }

  private updateAnimals(dt: number): void {
    const p = this.player;
    const isNight = this.isNightPeriod();
    const isDuskOrNight = this.isCrepuscularOrNight();
    const isMidday = this.timeOfDay >= 0.31 && this.timeOfDay <= 0.69;

    for (let i = 0; i < this.world.animals.length; i++) {
      const a = this.world.animals[i];
      const dx = p.x - a.x;
      const dy = p.y - a.y;
      const distToPlayer = Math.hypot(dx, dy);

      if (!a.isBoss && distToPlayer > 980) continue;

      const habit = ANIMAL_HABITS[a.kind] || 'DIURNAL';
      const wantsSleep =
        !a.isBoss &&
        ((habit === 'DIURNAL' && isNight) ||
          (habit === 'NOCTURNAL' && isMidday) ||
          (habit === 'CREPUSCULAR' && this.timeOfDay >= 0.43 && this.timeOfDay <= 0.61));
      const inPeakHunt =
        a.isBoss ||
        (habit === 'NOCTURNAL' && isDuskOrNight) ||
        (habit === 'CREPUSCULAR' && isDuskOrNight) ||
        (habit === 'DIURNAL' && !isNight);

      a.animPhase += dt * (a.sleeping ? 1.8 : inPeakHunt ? 6.8 : 5.0);
      if (a.hitFlash > 0) {
        a.hitFlash = Math.max(0, a.hitFlash - dt * 5.5);
        a.sleeping = false;
      }
      if (Math.abs(a.squash) > 0.002) a.squash += (0 - a.squash) * Math.min(1, dt * 12);

      a.stateTimer -= dt;

      // 1. Peaceful wildlife behavior (Diurnal grazers active in sunlight, curl up to sleep at night)
      if (a.peaceful) {
        if (a.state === EnemyState.FLEE) {
          a.sleeping = false;
          if (a.stateTimer <= 0) {
            a.state = EnemyState.WANDER;
          }
        } else if (wantsSleep && distToPlayer > 68) {
          // Rests peacefully near home territory at night
          const hx = a.homeX - a.x;
          const hy = a.homeY - a.y;
          const hDist = Math.hypot(hx, hy);
          if (hDist > 26) {
            a.sleeping = false;
            a.vx += ((hx / hDist) * a.speed * 0.32 - a.vx) * Math.min(1, dt * 4);
            a.vy += ((hy / hDist) * a.speed * 0.32 - a.vy) * Math.min(1, dt * 4);
          } else {
            a.sleeping = true;
            a.vx *= 0.8;
            a.vy *= 0.8;
          }
        } else {
          a.sleeping = false;
          if (a.stateTimer <= 0) {
            const ang = Math.random() * Math.PI * 2;
            const roamR = inPeakHunt ? 112 : 70;
            a.targetX = a.homeX + Math.cos(ang) * roamR;
            a.targetY = a.homeY + Math.sin(ang) * roamR;
            a.stateTimer = 2.2 + Math.random() * 2.4;
          }
          const wx = a.targetX - a.x;
          const wy = a.targetY - a.y;
          const wDist = Math.hypot(wx, wy);
          const daySpeed = a.speed * (inPeakHunt ? 0.56 : 0.4);
          if (wDist > 12) {
            a.vx += ((wx / wDist) * daySpeed - a.vx) * Math.min(1, dt * 5);
            a.vy += ((wy / wDist) * daySpeed - a.vy) * Math.min(1, dt * 5);
          } else {
            a.vx *= 0.88;
            a.vy *= 0.88;
          }
        }
        this.moveWithWorldCollisions(a, dt, Boolean(a.aquatic));
        continue;
      }

      // 2. Predator & Territorial Wildlife Circadian State Machine
      // Weather visibility modifier + Day/Night biological sense multiplier!
      const sightPenalty =
        this.activeWeather === WeatherKind.FOG
          ? 1 - 0.36 * this.weatherIntensity
          : this.activeWeather === WeatherKind.BLIZZARD || this.activeWeather === WeatherKind.SANDSTORM
          ? 1 - 0.3 * this.weatherIntensity
          : this.activeWeather === WeatherKind.SNOW || this.activeWeather === WeatherKind.RAIN
          ? 1 - 0.16 * this.weatherIntensity
          : 1;

      let circadianAggroMult = 1.0;
      let circadianSpeedMult = 1.0;
      let circadianDamageMult = 1.0;

      if (!a.isBoss) {
        if (habit === 'NOCTURNAL') {
          if (isDuskOrNight) {
            // Nocturnal Apex Hunt: heightened night vision, speed & ambush ferocity!
            circadianAggroMult = 1.38;
            circadianSpeedMult = 1.26;
            circadianDamageMult = 1.2;
          } else if (wantsSleep) {
            // Daytime slumber/basking: only wakes if player steps close (< 108px) or attacks
            circadianAggroMult = 0.42;
            circadianSpeedMult = 0.78;
            circadianDamageMult = 0.9;
          }
        } else if (habit === 'DIURNAL') {
          // Diurnal Bear: active & vigilant in daylight, sleeps deeply in cave/rocks at night
          if (isNight) {
            circadianAggroMult = 0.34;
            circadianSpeedMult = 0.82;
          } else {
            circadianAggroMult = 1.12;
            circadianSpeedMult = 1.1;
          }
        } else if (habit === 'CREPUSCULAR') {
          if (isDuskOrNight) {
            circadianAggroMult = 1.22;
            circadianSpeedMult = 1.16;
          } else if (wantsSleep) {
            circadianAggroMult = 0.58;
            circadianSpeedMult = 0.85;
          }
        }
      }

      const aggroRange = (a.isBoss ? 900 : 255) * sightPenalty * circadianAggroMult;
      const effectiveSpeed = a.speed * circadianSpeedMult;
      const effectiveDamage = Math.round(a.damage * circadianDamageMult);

      switch (a.state) {
        case EnemyState.IDLE:
        case EnemyState.WANDER: {
          if (distToPlayer < aggroRange) {
            const wasSleeping = Boolean(a.sleeping);
            a.sleeping = false;
            a.state = EnemyState.CHASE;
            a.stateTimer = 0.45;
            if (wasSleeping) {
              sound.playAnimalCall(a.kind, 0.78);
              this.spawnFloatingText(a.x, a.y - a.radius - 16, `${a.name} thức giấc!`, '#fbbf24', 0.96);
            }
            break;
          }

          if (wantsSleep) {
            const hx = a.homeX - a.x;
            const hy = a.homeY - a.y;
            const hDist = Math.hypot(hx, hy);
            if (hDist > 28) {
              a.sleeping = false;
              a.vx += ((hx / hDist) * a.speed * 0.35 - a.vx) * Math.min(1, dt * 5);
              a.vy += ((hy / hDist) * a.speed * 0.35 - a.vy) * Math.min(1, dt * 5);
            } else {
              a.sleeping = true;
              a.vx *= 0.8;
              a.vy *= 0.8;
            }
            break;
          }

          a.sleeping = false;
          if (a.stateTimer <= 0) {
            const ang = Math.random() * Math.PI * 2;
            const patrolRadius = habit === 'NOCTURNAL' && isDuskOrNight ? 150 : 80;
            a.targetX = a.homeX + Math.cos(ang) * patrolRadius;
            a.targetY = a.homeY + Math.sin(ang) * patrolRadius;
            a.stateTimer = (habit === 'NOCTURNAL' && isDuskOrNight ? 1.3 : 1.9) + Math.random() * 2.0;
          }
          const wx = a.targetX - a.x;
          const wy = a.targetY - a.y;
          const wDist = Math.hypot(wx, wy);
          const patrolSpeed = effectiveSpeed * (habit === 'NOCTURNAL' && isDuskOrNight ? 0.65 : 0.45);
          if (wDist > 10) {
            a.vx += ((wx / wDist) * patrolSpeed - a.vx) * Math.min(1, dt * 6);
            a.vy += ((wy / wDist) * patrolSpeed - a.vy) * Math.min(1, dt * 6);
          } else {
            a.vx *= 0.88;
            a.vy *= 0.88;
          }
          break;
        }

        case EnemyState.CHASE: {
          a.sleeping = false;
          if (!a.isBoss && distToPlayer > Math.max(260, aggroRange * 1.65)) {
            a.state = EnemyState.WANDER;
            break;
          }

          // Nocturnal stalkers hesitate near bright Campfire flames if unhurt!
          if (!a.isBoss && isNight && habit === 'NOCTURNAL' && a.hp >= a.maxHp) {
            let repelledByFire = false;
            for (const st of this.world.structures) {
              if (st.kind === StructureKind.CAMPFIRE) {
                const df = Math.hypot(a.x - st.x, a.y - st.y);
                if (df < 138) {
                  const rx = (a.x - st.x) / (df || 1);
                  const ry = (a.y - st.y) / (df || 1);
                  a.vx = rx * effectiveSpeed * 0.95;
                  a.vy = ry * effectiveSpeed * 0.95;
                  a.state = EnemyState.WANDER;
                  a.stateTimer = 1.6;
                  repelledByFire = true;
                  break;
                }
              }
            }
            if (repelledByFire) break;
          }

          const nx = dx / (distToPlayer || 1);
          const ny = dy / (distToPlayer || 1);

          if (
            (a.kind === AnimalKind.WILD_BOAR || a.kind === AnimalKind.RIVER_CROC || a.kind === AnimalKind.JUNGLE_JAGUAR) &&
            distToPlayer < (habit === 'NOCTURNAL' && isDuskOrNight ? 235 : 205) &&
            a.stateTimer <= 0
          ) {
            a.state = EnemyState.WINDUP;
            a.stateTimer = habit === 'NOCTURNAL' && isDuskOrNight ? 0.54 : 0.65;
            a.chargeDirX = nx;
            a.chargeDirY = ny;
            a.vx = 0;
            a.vy = 0;
            sound.playAnimalCall(a.kind, 0.85);
          } else if (a.kind === AnimalKind.EMPEROR_SCORPION && distToPlayer < 260 && a.stateTimer <= 0) {
            a.state = EnemyState.WINDUP;
            a.stateTimer = isDuskOrNight ? 0.52 : 0.64;
            a.chargeDirX = nx;
            a.chargeDirY = ny;
            sound.playAnimalCall(a.kind, 0.8);
          } else if (a.kind === AnimalKind.MOUNTAIN_BEAR && distToPlayer < 118 && a.stateTimer <= 0) {
            a.state = EnemyState.WINDUP;
            a.stateTimer = 0.82;
            a.vx = 0;
            a.vy = 0;
            sound.playAnimalCall(a.kind, 0.92);
          } else if (a.isBoss && a.stateTimer <= 0) {
            a.state = EnemyState.WINDUP;
            a.stateTimer = 0.88;
            a.chargeDirX = nx;
            a.chargeDirY = ny;
          } else {
            a.vx += (nx * effectiveSpeed - a.vx) * Math.min(1, dt * 8);
            a.vy += (ny * effectiveSpeed - a.vy) * Math.min(1, dt * 8);
          }
          break;
        }

        case EnemyState.WINDUP: {
          a.sleeping = false;
          a.vx *= 0.82;
          a.vy *= 0.82;
          if (a.stateTimer <= 0) {
            a.state = EnemyState.ATTACK;
            if (
              a.kind === AnimalKind.WILD_BOAR ||
              a.kind === AnimalKind.RIVER_CROC ||
              a.kind === AnimalKind.JUNGLE_JAGUAR
            ) {
              const lungeSpd = 385 * (habit === 'NOCTURNAL' && isDuskOrNight ? 1.16 : 1.0);
              a.vx = a.chargeDirX * lungeSpd;
              a.vy = a.chargeDirY * lungeSpd;
              a.squash = -0.25;
              a.stateTimer = 0.4;
            } else if (a.kind === AnimalKind.EMPEROR_SCORPION) {
              const baseAng = Math.atan2(dy, dx);
              const projSpd = isDuskOrNight ? 295 : 260;
              [-0.14, 0.14].forEach((offset) => {
                this.spawnProjectile(
                  false,
                  a.x,
                  a.y,
                  Math.cos(baseAng + offset) * projSpd,
                  Math.sin(baseAng + offset) * projSpd,
                  6,
                  effectiveDamage,
                  '#f59e0b',
                  1.45
                );
              });
              a.state = EnemyState.RECOVER;
              a.stateTimer = isDuskOrNight ? 0.92 : 1.15;
            } else if (a.kind === AnimalKind.MOUNTAIN_BEAR) {
              sound.playBossSlam();
              this.addShake(0.36);
              this.spawnBurst(a.x, a.y, '#fbbf24', 20, 160, true);
              if (distToPlayer < 118) {
                this.hurtPlayer(effectiveDamage, dx, dy);
              }
              a.state = EnemyState.RECOVER;
              a.stateTimer = 1.2;
            } else if (a.isBoss) {
              sound.playBossSlam();
              this.addShake(0.52);
              this.spawnBurst(a.x, a.y, '#f97316', 34, 210, true);
              if (distToPlayer < 148) {
                this.hurtPlayer(a.damage + 6, dx, dy);
              }
              const phaseOffset = this.globalTime * 1.3;
              for (let k = 0; k < 8; k++) {
                const ang = phaseOffset + (k * Math.PI * 2) / 8;
                this.spawnProjectile(
                  false,
                  a.x,
                  a.y,
                  Math.cos(ang) * 225,
                  Math.sin(ang) * 225,
                  8,
                  22,
                  '#fb923c',
                  2.2
                );
              }
              a.state = EnemyState.RECOVER;
              a.stateTimer = 1.35;
            } else {
              a.stateTimer = 0.25;
            }
          }
          break;
        }

        case EnemyState.ATTACK: {
          if (a.stateTimer <= 0) {
            a.state = EnemyState.RECOVER;
            a.stateTimer = 0.65;
          }
          break;
        }

        case EnemyState.RECOVER: {
          a.vx *= 0.85;
          a.vy *= 0.85;
          if (a.stateTimer <= 0) {
            a.state = EnemyState.CHASE;
            a.stateTimer = 0.9 + Math.random() * 0.5;
          }
          break;
        }

        default:
          break;
      }

      this.moveWithWorldCollisions(a, dt, false);

      // Spike Traps Counter-Damage & Physical Wall Attack Handling
      for (let sIdx = this.world.structures.length - 1; sIdx >= 0; sIdx--) {
        const st = this.world.structures[sIdx];
        if (st.kind === StructureKind.SPIKE_TRAP) {
          const dTrap = Math.hypot(a.x - st.x, a.y - st.y);
          if (dTrap < a.radius + 18) {
            if (!a.peaceful && a.hp > 0) {
              const spikeDamage = 45;
              a.hp -= spikeDamage;
              a.hitFlash = 1;
              sound.playEnemyHit(true);
              this.spawnBurst(a.x, a.y, '#ef4444', 12, 110, true);
              this.spawnFloatingText(a.x, a.y - a.radius - 12, `-${spikeDamage} HP (Bẫy Chông)`, '#fca5a5', 1.1);
              st.hp -= 8;
              if (st.hp <= 0) {
                this.world.structures.splice(sIdx, 1);
                this.spawnBurst(st.x, st.y, '#94a3b8', 12, 90, false);
              }
              if (a.hp <= 0) {
                this.damagePredator(a, i, spikeDamage, 0, 0, false);
                break;
              }
            }
          }
        } else if (st.kind === StructureKind.WOOD_WALL || st.kind === StructureKind.STONE_WALL) {
          const dWall = Math.hypot(a.x - st.x, a.y - st.y);
          const wallR = st.kind === StructureKind.STONE_WALL ? 24 : 18;
          if (dWall < a.radius + wallR + 4 && !a.peaceful && (a.state === EnemyState.ATTACK || a.state === EnemyState.CHASE)) {
            const wallDmg = Math.max(2, Math.round(effectiveDamage * 0.45));
            st.hp -= wallDmg;
            if (st.hp <= 0) {
              this.world.structures.splice(sIdx, 1);
              sound.playStoneClink(false);
              this.spawnBurst(st.x, st.y, '#94a3b8', 18, 120, false);
              this.spawnFloatingText(st.x, st.y - 20, 'Tường bị sụp đổ!', '#f87171', 1.08);
            }
          }
        }
      }

      if (!a.sleeping && distToPlayer < a.radius + p.radius - 2) {
        this.hurtPlayer(effectiveDamage, dx, dy);
      }
    }
  }

  private updateProximityBioSounds(dt: number): void {
    this.bioSoundTimer -= dt;
    if (this.bioSoundTimer > 0) return;
    this.bioSoundTimer = 2.8 + Math.random() * 3.4;

    const p = this.player;
    const isNight = this.isNightPeriod();

    // If microscope is open near a bacterial colony, play subtle microbial bubbling
    if (p.microscopeActive) {
      for (let i = 0; i < this.world.microbes.length; i++) {
        const col = this.world.microbes[i];
        const d = Math.hypot(col.x - p.x, col.y - p.y);
        if (d < 165) {
          sound.playBacteriaSound(col.speciesId, 0.52 * (1 - d / 210));
          return;
        }
      }
    }

    // Check closest awake insect or animal for natural spatial bio-acoustics
    if (Math.random() < 0.5) {
      let bestIns: AmbientInsect | null = null;
      let bestDist = 230;
      for (let i = 0; i < this.world.insects.length; i++) {
        const ins = this.world.insects[i];
        const nocturnalIns = ins.speciesId === 'water_firefly' || ins.speciesId === 'hercules_beetle';
        if (isNight && !nocturnalIns) continue;
        const d = Math.hypot(ins.x - p.x, ins.y - p.y);
        if (d < bestDist) {
          bestDist = d;
          bestIns = ins;
        }
      }
      if (bestIns) {
        sound.playInsectSound(bestIns.speciesId, 0.55 * (1 - bestDist / 260));
        return;
      }
    }

    let bestAni: AnimalEntity | null = null;
    let bestAniDist = 375;
    for (let i = 0; i < this.world.animals.length; i++) {
      const a = this.world.animals[i];
      if (a.sleeping) continue;
      const d = Math.hypot(a.x - p.x, a.y - p.y);
      if (d < bestAniDist) {
        bestAniDist = d;
        bestAni = a;
      }
    }
    if (bestAni) {
      sound.playAnimalCall(bestAni.kind, 0.55 * (1 - bestAniDist / 415));
    }
  }

  private hurtPlayer(rawDamage: number, pushX: number, pushY: number): void {
    const p = this.player;
    if (p.invulnTimer > 0 || p.hp <= 0) return;

    const skillBonuses = computePassiveSkillBonuses(this.unlockedSkills);
    const weatherPerks = this.getCurrentWeatherPerks();
    const weatherDamageReduction = weatherPerks.damageReductionBonus || 0;
    const reductionPct = Math.min(
      85,
      (ARMOR_DAMAGE_REDUCTION_PCT[p.equipment.armorTier] || 0) +
        skillBonuses.damageReductionBonusPct +
        weatherDamageReduction * 100
    );
    const armorReduction = Math.max(0.18, 1 - reductionPct / 100);
    const finalDmg = Math.max(2, Math.round(rawDamage * armorReduction));

    p.hp = Math.max(0, p.hp - finalDmg);
    p.invulnTimer = 0.68;
    p.hitFlash = 1;
    p.squash = 0.3;

    const len = Math.hypot(pushX, pushY) || 1;
    p.vx = (pushX / len) * 280;
    p.vy = (pushY / len) * 280;

    sound.playPlayerHurt();
    this.hitstopTimer = 0.045;
    this.addShake(0.42);
    this.spawnBurst(p.x, p.y, '#ef4444', 16, 135, false);
    this.spawnFloatingText(p.x, p.y - 26, `-${finalDmg} HP`, '#fca5a5', 1.15);
    this.emitHudSnapshot();

    if (p.hp <= 0) {
      this.setGameState(GameState.GAME_OVER);
    }
  }

  private spawnProjectile(
    fromPlayer: boolean,
    x: number,
    y: number,
    vx: number,
    vy: number,
    radius: number,
    damage: number,
    color: string,
    life: number
  ): void {
    for (let i = 0; i < this.projectiles.length; i++) {
      const proj = this.projectiles[i];
      if (!proj.active) {
        proj.active = true;
        proj.fromPlayer = fromPlayer;
        proj.x = x;
        proj.y = y;
        proj.vx = vx;
        proj.vy = vy;
        proj.radius = radius;
        proj.damage = damage;
        proj.color = color;
        proj.life = life;
        return;
      }
    }
  }

  private updateProjectiles(dt: number): void {
    const p = this.player;
    for (let i = 0; i < this.projectiles.length; i++) {
      const proj = this.projectiles[i];
      if (!proj.active) continue;

      proj.life -= dt;
      if (proj.life <= 0) {
        proj.active = false;
        continue;
      }

      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;

      if (proj.fromPlayer) {
        for (let j = this.world.animals.length - 1; j >= 0; j--) {
          const a = this.world.animals[j];
          if (a.peaceful) continue;
          if (Math.hypot(proj.x - a.x, proj.y - a.y) < proj.radius + a.radius) {
            this.damagePredator(a, j, proj.damage, proj.vx, proj.vy, true);
            if (this.player.equipment.swordTier < 4) proj.active = false;
            break;
          }
        }
      } else if (Math.hypot(proj.x - p.x, proj.y - p.y) < proj.radius + p.radius) {
        proj.active = false;
        this.hurtPlayer(proj.damage, proj.vx, proj.vy);
      }
    }
  }

  private updateLootDrops(dt: number): void {
    const p = this.player;
    for (let i = this.lootDrops.length - 1; i >= 0; i--) {
      const drop = this.lootDrops[i];
      drop.age += dt;
      drop.vx *= Math.pow(0.05, dt);
      drop.vy *= Math.pow(0.05, dt);
      drop.x += drop.vx * dt;
      drop.y += drop.vy * dt;

      const dx = p.x - drop.x;
      const dy = p.y - drop.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 140 && drop.age > 0.16) {
        const pull = 360 * (1 - dist / 150) + 145;
        drop.x += (dx / (dist || 1)) * pull * dt;
        drop.y += (dy / (dist || 1)) * pull * dt;
      }

      if (dist < 24 && drop.age > 0.12) {
        this.inventory[drop.resource] = (this.inventory[drop.resource] || 0) + drop.amount;
        const meta = RESOURCE_META[drop.resource];
        sound.playPickup();
        this.spawnFloatingText(p.x, p.y - 24, `+${drop.amount} ${meta.shortName}`, meta.color, 0.95);
        this.lootDrops.splice(i, 1);
        this.emitHudSnapshot();
      }
    }
  }

  private spawnSingleParticle(
    x: number,
    y: number,
    vx: number,
    vy: number,
    color: string,
    size: number,
    maxLife: number,
    glow: boolean
  ): void {
    for (let i = 0; i < this.particles.length; i++) {
      const pt = this.particles[i];
      if (!pt.active) {
        pt.active = true;
        pt.x = x;
        pt.y = y;
        pt.vx = vx;
        pt.vy = vy;
        pt.color = color;
        pt.size = size;
        pt.life = maxLife;
        pt.maxLife = maxLife;
        pt.alpha = 1;
        pt.drag = 0.92;
        pt.glow = glow;
        return;
      }
    }
  }

  private spawnBurst(x: number, y: number, color: string, count: number, maxSpeed: number, glow: boolean): void {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 25 + Math.random() * maxSpeed;
      this.spawnSingleParticle(
        x,
        y,
        Math.cos(ang) * spd,
        Math.sin(ang) * spd,
        color,
        2.5 + Math.random() * 3.5,
        0.28 + Math.random() * 0.35,
        glow
      );
    }
  }

  private updateAmbientParticles(dt: number): void {
    if (Math.random() < dt * 16) {
      const viewW = window.innerWidth;
      const viewH = window.innerHeight;
      const px = this.camX + (Math.random() - 0.5) * viewW;
      const py = this.camY + (Math.random() - 0.5) * viewH;
      const b = this.getBiomeAt(px, py);
      const color =
        b === BiomeRegion.SNOW_PEAK
          ? '#ffffff'
          : b === BiomeRegion.OCEAN || b === BiomeRegion.COAST
          ? '#38bdf8'
          : b === BiomeRegion.DESERT
          ? '#fde68a'
          : '#bef264';
      this.spawnSingleParticle(
        px,
        py,
        (Math.random() - 0.5) * 18,
        b === BiomeRegion.SNOW_PEAK ? 18 + Math.random() * 14 : -12 - Math.random() * 14,
        color,
        2.5,
        1.4 + Math.random() * 1.1,
        true
      );
    }
  }

  private updateParticles(dt: number): void {
    for (let i = 0; i < this.particles.length; i++) {
      const pt = this.particles[i];
      if (!pt.active) continue;
      pt.life -= dt;
      if (pt.life <= 0) {
        pt.active = false;
        continue;
      }
      pt.vx *= Math.pow(pt.drag, dt * 60);
      pt.vy *= Math.pow(pt.drag, dt * 60);
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.alpha = Math.max(0, pt.life / pt.maxLife);
    }
  }

  private spawnFloatingText(x: number, y: number, text: string, color: string, scale: number = 1): void {
    for (let i = 0; i < this.floatingTexts.length; i++) {
      const ft = this.floatingTexts[i];
      if (!ft.active) {
        ft.active = true;
        ft.x = x + (Math.random() - 0.5) * 12;
        ft.y = y;
        ft.vy = -34;
        ft.text = text;
        ft.color = color;
        ft.life = 1.05;
        ft.maxLife = 1.05;
        ft.scale = scale;
        return;
      }
    }
  }

  private updateFloatingTexts(dt: number): void {
    for (let i = 0; i < this.floatingTexts.length; i++) {
      const ft = this.floatingTexts[i];
      if (!ft.active) continue;
      ft.life -= dt;
      if (ft.life <= 0) {
        ft.active = false;
        continue;
      }
      ft.y += ft.vy * dt;
      ft.vy *= 0.95;
    }
  }

  private addShake(amount: number): void {
    this.shakeTrauma = Math.min(1, this.shakeTrauma + amount);
  }

  private resolveDesiredWeather(biome: BiomeRegion): {
    kind: WeatherKind;
    intensity: number;
    windAngle: number;
  } {
    if (this.manualWeatherTimer > 0 && this.manualWeatherOverride !== null) {
      const w = this.manualWeatherOverride;
      return {
        kind: w,
        intensity: w === WeatherKind.CLEAR ? 0 : 0.88,
        windAngle:
          w === WeatherKind.BLIZZARD || w === WeatherKind.SNOW
            ? 2.5
            : w === WeatherKind.SANDSTORM
            ? 2.92
            : 1.9,
      };
    }

    // Smooth regional meteorological fronts shifting every ~28 seconds + diurnal modulation
    const frontSlot = Math.floor(this.weatherCycleTime / 28);
    const isDawnOrNight = this.timeOfDay < 0.28 || this.timeOfDay > 0.74;

    switch (biome) {
      case BiomeRegion.SNOW_PEAK: {
        // High alpine snow peaks cycle between gentle Snowfall, fierce Blizzards, and Alpine Fog
        const slot = frontSlot % 3;
        if (slot === 0) {
          return { kind: WeatherKind.BLIZZARD, intensity: 0.92, windAngle: 2.55 };
        }
        if (slot === 1) {
          return { kind: WeatherKind.SNOW, intensity: 0.86, windAngle: 2.15 };
        }
        return { kind: WeatherKind.FOG, intensity: 0.82, windAngle: 2.65 };
      }

      case BiomeRegion.MOUNTAIN: {
        const slot = frontSlot % 3;
        if (slot === 0) {
          return { kind: WeatherKind.SNOW, intensity: 0.84, windAngle: 2.2 };
        }
        if (slot === 1) {
          return { kind: WeatherKind.FOG, intensity: 0.85, windAngle: 2.4 };
        }
        return { kind: WeatherKind.BLIZZARD, intensity: 0.72, windAngle: 2.5 };
      }

      case BiomeRegion.FOREST: {
        // Rainforest alternates between Tropical Downpours and Dense Canopy Mist
        const slot = (frontSlot + (isDawnOrNight ? 1 : 0)) % 3;
        if (slot === 0) {
          return { kind: WeatherKind.RAIN, intensity: 0.9, windAngle: 1.92 };
        }
        if (slot === 1) {
          return { kind: WeatherKind.FOG, intensity: 0.88, windAngle: 1.75 };
        }
        return { kind: WeatherKind.RAIN, intensity: 0.7, windAngle: 1.88 };
      }

      case BiomeRegion.RIVER:
      case BiomeRegion.RIVERBANK: {
        // River & Alluvial Delta feature thick river fog and monsoon showers
        const slot = frontSlot % 3;
        if (isDawnOrNight || slot === 0) {
          return { kind: WeatherKind.FOG, intensity: 0.86, windAngle: 1.8 };
        }
        if (slot === 1) {
          return { kind: WeatherKind.RAIN, intensity: 0.82, windAngle: 1.95 };
        }
        return { kind: WeatherKind.CLEAR, intensity: 0, windAngle: 1.6 };
      }

      case BiomeRegion.OCEAN:
      case BiomeRegion.COAST: {
        const slot = frontSlot % 3;
        if (slot === 0) {
          return { kind: WeatherKind.WINDY, intensity: 0.82, windAngle: -2.4 };
        }
        if (slot === 1) {
          return { kind: WeatherKind.RAIN, intensity: 0.84, windAngle: 2.1 };
        }
        return { kind: WeatherKind.FOG, intensity: 0.78, windAngle: -2.2 };
      }

      case BiomeRegion.DESERT: {
        const slot = frontSlot % 3;
        if (slot === 0 || slot === 1) {
          return { kind: WeatherKind.SANDSTORM, intensity: slot === 0 ? 0.9 : 0.68, windAngle: 2.92 };
        }
        return { kind: WeatherKind.CLEAR, intensity: 0, windAngle: 2.8 };
      }

      case BiomeRegion.SAVANNA: {
        const slot = frontSlot % 4;
        if (slot === 0) {
          return { kind: WeatherKind.WINDY, intensity: 0.82, windAngle: 0.42 };
        }
        if (slot === 1) {
          return { kind: WeatherKind.RAIN, intensity: 0.74, windAngle: 1.9 };
        }
        if (slot === 2 && isDawnOrNight) {
          return { kind: WeatherKind.FOG, intensity: 0.75, windAngle: 1.7 };
        }
        return { kind: WeatherKind.CLEAR, intensity: 0, windAngle: 0.35 };
      }

      case BiomeRegion.SANCTUARY:
      default: {
        // Central Biosphere Hub experiences Clear Skies, Passing Rain, Morning Fog, and Highland Snow Flurries
        const slot = frontSlot % 4;
        if (slot === 1) {
          return { kind: WeatherKind.RAIN, intensity: 0.76, windAngle: 1.9 };
        }
        if (slot === 2) {
          return { kind: WeatherKind.FOG, intensity: 0.8, windAngle: 1.7 };
        }
        if (slot === 3) {
          return { kind: WeatherKind.SNOW, intensity: 0.78, windAngle: 2.15 };
        }
        return { kind: WeatherKind.CLEAR, intensity: 0, windAngle: 0.5 };
      }
    }
  }

  private updateWeather(dt: number, focusX: number, focusY: number, announceChanges: boolean): void {
    this.weatherCycleTime += dt;
    if (this.manualWeatherTimer > 0) {
      this.manualWeatherTimer = Math.max(0, this.manualWeatherTimer - dt);
      if (this.manualWeatherTimer <= 0) {
        this.manualWeatherOverride = null;
      }
    }
    this.lightningFlash = Math.max(0, this.lightningFlash - dt * 2.6);
    this.weatherAudioCooldown = Math.max(0, this.weatherAudioCooldown - dt);

    const biome = this.getBiomeAt(focusX, focusY);
    this.currentBiome = biome;
    const desired = this.resolveDesiredWeather(biome);
    this.targetWeather = desired.kind;

    // Smoothly steer wind vector
    const targetWx = Math.cos(desired.windAngle);
    const targetWy = Math.sin(desired.windAngle);
    const windLerp = Math.min(1, dt * 1.8);
    this.windDirX += (targetWx - this.windDirX) * windLerp;
    this.windDirY += (targetWy - this.windDirY) * windLerp;
    const wLen = Math.hypot(this.windDirX, this.windDirY) || 1;
    this.windDirX /= wLen;
    this.windDirY /= wLen;

    // Smooth dynamic frost & sandstorm screen-space vignette transitions based on biome & weather
    const isColdBiome =
      biome === BiomeRegion.SNOW_PEAK ||
      biome === BiomeRegion.MOUNTAIN ||
      this.activeWeather === WeatherKind.BLIZZARD ||
      this.activeWeather === WeatherKind.SNOW;
    const targetFrost = isColdBiome
      ? Math.min(1, (biome === BiomeRegion.SNOW_PEAK ? 0.88 : 0.45) + this.weatherIntensity * 0.45)
      : 0;
    this.frostIntensity += (targetFrost - this.frostIntensity) * Math.min(1, dt * 1.4);

    const isDesertBiome =
      biome === BiomeRegion.DESERT ||
      this.activeWeather === WeatherKind.SANDSTORM;
    const targetSand = isDesertBiome
      ? Math.min(1, (biome === BiomeRegion.DESERT ? 0.65 : 0.35) + this.weatherIntensity * 0.45)
      : 0;
    this.sandVignetteIntensity += (targetSand - this.sandVignetteIntensity) * Math.min(1, dt * 1.5);

    // Smooth crossfade when transitioning between weather types across biomes
    if (this.activeWeather !== this.targetWeather) {
      this.weatherIntensity = Math.max(0, this.weatherIntensity - dt * 0.95);
      if (this.weatherIntensity <= 0.03) {
        this.activeWeather = this.targetWeather;
        if (announceChanges && this.activeWeather !== this.lastAnnouncedWeather) {
          this.lastAnnouncedWeather = this.activeWeather;
          sound.playWeatherTransition(this.activeWeather);
          if (this.activeWeather !== WeatherKind.CLEAR) {
            this.spawnFloatingText(
              focusX,
              focusY - 42,
              `Thời tiết: ${WEATHER_LABELS[this.activeWeather]}`,
              this.activeWeather === WeatherKind.BLIZZARD || this.activeWeather === WeatherKind.SNOW
                ? '#e0f2fe'
                : this.activeWeather === WeatherKind.SANDSTORM
                ? '#fcd34d'
                : this.activeWeather === WeatherKind.FOG
                ? '#cbd5e1'
                : '#7dd3fc',
              1.04
            );
          }
        }
      }
    } else {
      const targetInt = this.activeWeather === WeatherKind.CLEAR ? 0 : desired.intensity;
      this.weatherIntensity += (targetInt - this.weatherIntensity) * Math.min(1, dt * 0.85);
    }

    const viewW = Math.max(320, window.innerWidth);
    const viewH = Math.max(240, window.innerHeight);

    // Update screen-space camera lens droplets (rain beads & trickles)
    const isRainy = this.activeWeather === WeatherKind.RAIN;
    if (isRainy && this.weatherIntensity > 0.15) {
      if (Math.random() < dt * 7.5 * this.weatherIntensity) {
        for (let i = 0; i < this.lensDroplets.length; i++) {
          const d = this.lensDroplets[i];
          if (!d.active) {
            d.active = true;
            d.x = 24 + Math.random() * (viewW - 48);
            d.y = 12 + Math.random() * (viewH * 0.72);
            d.radius = 3.2 + Math.random() * 4.6;
            d.maxLife = 2.6 + Math.random() * 2.4;
            d.life = d.maxLife;
            d.trailY = d.y;
            d.dripSpeed = 8 + Math.random() * 18;
            d.alpha = 0;
            break;
          }
        }
      }
    }

    for (let i = 0; i < this.lensDroplets.length; i++) {
      const d = this.lensDroplets[i];
      if (!d.active) continue;
      d.life -= dt;
      if (d.life <= 0 || d.y > viewH + 20) {
        d.active = false;
        continue;
      }
      d.y += d.dripSpeed * dt;
      const progress = 1 - d.life / d.maxLife;
      d.alpha = Math.sin(progress * Math.PI) * (isRainy ? 0.9 : 0.45);
    }

    // Update screen-space weather particles (multi-depth parallax layers)
    if (this.weatherIntensity > 0.02 && this.activeWeather !== WeatherKind.CLEAR) {
      let vxBase = 0;
      let vyBase = 0;

      if (this.activeWeather === WeatherKind.RAIN) {
        vxBase = -175;
        vyBase = 820;
      } else if (this.activeWeather === WeatherKind.SNOW) {
        vxBase = this.windDirX * 78;
        vyBase = 132;
      } else if (this.activeWeather === WeatherKind.BLIZZARD) {
        vxBase = this.windDirX * 580;
        vyBase = Math.abs(this.windDirY) * 295 + 175;
      } else if (this.activeWeather === WeatherKind.SANDSTORM) {
        vxBase = this.windDirX * 660;
        vyBase = this.windDirY * 145 + 50;
      } else if (this.activeWeather === WeatherKind.WINDY) {
        vxBase = this.windDirX * 430;
        vyBase = this.windDirY * 215;
      } else if (this.activeWeather === WeatherKind.FOG) {
        vxBase = this.windDirX * 42;
        vyBase = this.windDirY * 18;
      }

      for (let i = 0; i < this.weatherParticles.length; i++) {
        const wp = this.weatherParticles[i];
        const flutter =
          this.activeWeather === WeatherKind.SNOW
            ? Math.sin(this.globalTime * 2.4 + wp.driftPhase) * 48
            : this.activeWeather === WeatherKind.BLIZZARD || this.activeWeather === WeatherKind.WINDY
            ? Math.sin(this.globalTime * 4.5 + wp.driftPhase) * 55
            : 0;

        wp.x += (vxBase * wp.speed + (this.activeWeather === WeatherKind.SNOW ? flutter : flutter * 0.4)) * dt;
        wp.y += (vyBase * wp.speed + (this.activeWeather === WeatherKind.SNOW ? Math.abs(flutter) * 0.15 : flutter)) * dt;
        wp.rot += wp.rotSpeed * dt;

        if (wp.x < -80) wp.x += viewW + 160;
        else if (wp.x > viewW + 80) wp.x -= viewW + 160;

        if (wp.y < -80) wp.y += viewH + 160;
        else if (wp.y > viewH + 80) wp.y -= viewH + 160;
      }

      // Update rolling fog & snow mist clouds
      if (
        this.activeWeather === WeatherKind.FOG ||
        this.activeWeather === WeatherKind.BLIZZARD ||
        this.activeWeather === WeatherKind.SNOW
      ) {
        for (let i = 0; i < this.fogClouds.length; i++) {
          const fc = this.fogClouds[i];
          fc.offsetX += this.windDirX * 32 * fc.speedMult * dt;
          fc.offsetY += this.windDirY * 14 * fc.speedMult * dt;
          if (fc.offsetX < -fc.radiusX * 1.5) fc.offsetX += viewW + fc.radiusX * 3;
          if (fc.offsetX > viewW + fc.radiusX * 1.5) fc.offsetX -= viewW + fc.radiusX * 3;
          if (fc.offsetY < -fc.radiusY * 1.5) fc.offsetY += viewH + fc.radiusY * 3;
          if (fc.offsetY > viewH + fc.radiusY * 1.5) fc.offsetY -= viewH + fc.radiusY * 3;
        }
      }

      // Spawn world-space raindrop ground/water ripples & occasional lightning/thunder
      if (this.activeWeather === WeatherKind.RAIN) {
        if (Math.random() < dt * 42 * this.weatherIntensity) {
          for (let i = 0; i < this.rainSplashes.length; i++) {
            const sp = this.rainSplashes[i];
            if (!sp.active) {
              sp.active = true;
              sp.x = this.camX + (Math.random() - 0.5) * viewW;
              sp.y = this.camY + (Math.random() - 0.5) * viewH;
              sp.maxLife = 0.34 + Math.random() * 0.18;
              sp.life = sp.maxLife;
              sp.maxRadius = 6 + Math.random() * 6;
              break;
            }
          }
        }

        if (
          announceChanges &&
          this.weatherIntensity > 0.72 &&
          this.weatherAudioCooldown <= 0 &&
          Math.random() < dt * 0.085
        ) {
          this.lightningFlash = 0.52;
          this.weatherAudioCooldown = 14;
          sound.playThunderRumble();
        }
      } else if (
        announceChanges &&
        (this.activeWeather === WeatherKind.BLIZZARD || this.activeWeather === WeatherKind.SANDSTORM) &&
        this.weatherIntensity > 0.65 &&
        this.weatherAudioCooldown <= 0 &&
        Math.random() < dt * 0.14
      ) {
        this.weatherAudioCooldown = 11;
        sound.playWindGust(this.activeWeather === WeatherKind.BLIZZARD);
      }
    }

    // Update active rain splashes
    for (let i = 0; i < this.rainSplashes.length; i++) {
      const sp = this.rainSplashes[i];
      if (!sp.active) continue;
      sp.life -= dt;
      if (sp.life <= 0) sp.active = false;
    }
  }

  private getSkyAtmosphere(): {
    skyTopHex: string;
    skyHorizonHex: string;
    skyHorizonRgb: [number, number, number];
    tintRgb: [number, number, number];
    tintAlpha: number;
    darkness: number;
    nightRgb: [number, number, number];
  } {
    const t = ((this.timeOfDay % 1) + 1) % 1;
    let k0 = SKY_KEYFRAMES[0];
    let k1 = SKY_KEYFRAMES[SKY_KEYFRAMES.length - 1];
    for (let i = 0; i < SKY_KEYFRAMES.length - 1; i++) {
      if (t >= SKY_KEYFRAMES[i].t && t <= SKY_KEYFRAMES[i + 1].t) {
        k0 = SKY_KEYFRAMES[i];
        k1 = SKY_KEYFRAMES[i + 1];
        break;
      }
    }
    const span = Math.max(0.0001, k1.t - k0.t);
    const rawU = (t - k0.t) / span;
    const u = rawU * rawU * (3 - 2 * rawU);

    const skyTop: [number, number, number] = [
      lerpChannel(k0.skyTop[0], k1.skyTop[0], u),
      lerpChannel(k0.skyTop[1], k1.skyTop[1], u),
      lerpChannel(k0.skyTop[2], k1.skyTop[2], u),
    ];
    const skyHorizon: [number, number, number] = [
      lerpChannel(k0.skyHorizon[0], k1.skyHorizon[0], u),
      lerpChannel(k0.skyHorizon[1], k1.skyHorizon[1], u),
      lerpChannel(k0.skyHorizon[2], k1.skyHorizon[2], u),
    ];
    const tintRgb: [number, number, number] = [
      lerpChannel(k0.tintRgb[0], k1.tintRgb[0], u),
      lerpChannel(k0.tintRgb[1], k1.tintRgb[1], u),
      lerpChannel(k0.tintRgb[2], k1.tintRgb[2], u),
    ];
    const nightRgb: [number, number, number] = [
      lerpChannel(k0.nightRgb[0], k1.nightRgb[0], u),
      lerpChannel(k0.nightRgb[1], k1.nightRgb[1], u),
      lerpChannel(k0.nightRgb[2], k1.nightRgb[2], u),
    ];

    return {
      skyTopHex: rgbToHex(skyTop),
      skyHorizonHex: rgbToHex(skyHorizon),
      skyHorizonRgb: skyHorizon,
      tintRgb,
      tintAlpha: k0.tintAlpha + (k1.tintAlpha - k0.tintAlpha) * u,
      darkness: k0.darkness + (k1.darkness - k0.darkness) * u,
      nightRgb,
    };
  }

  private getShadowTransform(): { offX: number; offY: number; stretchX: number; alpha: number } {
    const t = this.timeOfDay;
    if (t >= 0.21 && t <= 0.79) {
      // Solar arc from East (+X -> casts West -offX) through Noon (0) to West (-X -> casts East +offX)
      const dayProgress = (t - 0.21) / 0.58; // 0 at sunrise -> 0.5 at noon -> 1 at sunset
      const sunFactor = (dayProgress - 0.5) * 2; // -1 at dawn -> 0 at noon -> +1 at dusk
      const offX = sunFactor * 10.5;
      const offY = 2.5 + Math.abs(sunFactor) * 2.0;
      const stretchX = 0.92 + Math.abs(sunFactor) * 0.62;
      const elevation = Math.sin(dayProgress * Math.PI);
      const alpha = 0.17 + elevation * 0.14;
      return { offX, offY, stretchX, alpha };
    }
    // Soft cool lunar shadow at night
    const nightAngle = t < 0.5 ? t + 0.2 : t - 0.8;
    return {
      offX: Math.sin(nightAngle * Math.PI * 2) * 5.5,
      offY: 3,
      stretchX: 1.12,
      alpha: 0.2,
    };
  }

  private getDayPhase(): DayPhase {
    const t = this.timeOfDay;
    if (t >= 0.2 && t < 0.28) return 'DAWN';
    if (t >= 0.28 && t < 0.45) return 'MORNING';
    if (t >= 0.45 && t < 0.64) return 'NOON';
    if (t >= 0.64 && t < 0.72) return 'AFTERNOON';
    if (t >= 0.72 && t < 0.81) return 'DUSK';
    return 'NIGHT';
  }

  private getTimeLabel(): string {
    switch (this.getDayPhase()) {
      case 'DAWN':
        return 'Bình Minh';
      case 'MORNING':
        return 'Ban Mai';
      case 'NOON':
        return 'Giữa Trưa';
      case 'AFTERNOON':
        return 'Chiều Vàng';
      case 'DUSK':
        return 'Hoàng Hôn';
      case 'NIGHT':
      default:
        return 'Đêm Sao';
    }
  }

  private getClockLabel(): string {
    const totalMinutes = Math.floor(((this.timeOfDay % 1) + 1) % 1 * 24 * 60);
    const hh = Math.floor(totalMinutes / 60) % 24;
    const mm = totalMinutes % 60;
    return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
  }

  private getWildlifeActivityNote(): string {
    const phase = this.getDayPhase();
    switch (phase) {
      case 'DAWN':
        return 'Thú ban ngày thức giấc · Chim muông ca hót';
      case 'MORNING':
      case 'NOON':
      case 'AFTERNOON':
        return 'Thú ban ngày kiếm ăn · Thú săn đêm ngủ ẩn mình';
      case 'DUSK':
        return 'Giao thoa chạng vạng · Thú săn đêm rời hang';
      case 'NIGHT':
      default:
        return 'Thú săn đêm rình mồi (+Tốc độ & tầm nhìn) · Thú ngày ngủ say';
    }
  }

  private emitHudSnapshot(): void {
    const p = this.player;
    const biome = this.getBiomeAt(p.x, p.y);
    const activeBeacons = this.world.beacons.filter((b) => b.activated).length;

    let exploredCells = 0;
    for (let i = 0; i < this.world.fog.length; i++) {
      if (this.world.fog[i] > 0) exploredCells++;
    }
    const exploredPercent = Math.min(100, Math.round((exploredCells / this.world.fog.length) * 100));

    const boss = this.world.animals.find((a) => a.isBoss);
    let questObjective = `Khám phá Trái Đất (${this.discoveredSpecies.size}/${SPECIES_CATALOG.length} loài) · Trạm quan trắc (${activeBeacons}/3)`;
    if (this.bossDefeated) {
      questObjective = `Đã chinh phục Đỉnh Himalaya · Thu thập trọn bộ ${this.discoveredSpecies.size}/${SPECIES_CATALOG.length} loài`;
    } else if (boss) {
      questObjective = 'Đánh bại Cổ Thần trên Đỉnh Tuyết Himalaya!';
    } else if (activeBeacons >= 3) {
      questObjective = 'Mở Bản Đồ Trái Đất [M] và tới Đỉnh Tuyết Himalaya triệu hồi Cổ Thần';
    }

    let companionHud: CompanionHudInfo | null = null;
    if (this.companion) {
      const c = this.companion;
      const tier = getLoyaltyTier(c.loyalty);
      const profile = COMPANION_PROFILES[c.kind];
      companionHud = {
        kind: c.kind,
        speciesName: c.speciesName,
        customName: c.customName,
        loyalty: Math.round(c.loyalty),
        loyaltyStatus: tier.status,
        efficiencyPercent: Math.round(tier.mult * 100),
        mode: c.mode,
        damage: Math.round(c.damage * Math.max(0.65, tier.mult)),
        gatherPower: Math.round(c.gatherPower * Math.max(0.65, tier.mult)),
        specialtyDesc: profile ? profile.specialtyDesc : 'Đồng hành hoang dã đa năng',
      };
    }

    const pTileX = p.x / TILE_SIZE;
    const pTileY = p.y / TILE_SIZE;
    const { lon, lat } = tileToLonLat(pTileX, pTileY);
    const skyAtmo = this.getSkyAtmosphere();
    const weatherPerks = this.getCurrentWeatherPerks();

    this.callbacks.onHudUpdate({
      hp: Math.ceil(p.hp),
      maxHp: p.maxHp,
      stamina: Math.round(p.stamina),
      maxStamina: p.maxStamina,
      biome,
      biomeLabel: REGION_LABELS[biome] || 'Lục Địa Tự Nhiên',
      locationName: this.currentLocationName,
      locationArrivalBanner: this.arrivalBanner,
      weather: this.activeWeather,
      weatherLabel: WEATHER_LABELS[this.activeWeather],
      weatherIntensity: Number(this.weatherIntensity.toFixed(2)),
      visibilityPercent: this.currentVisibilityPercent,
      moveSpeedPercent: this.currentMoveSpeedPercent,
      weatherEffectNote: this.currentWeatherEffectNote,
      weatherAudioNote: this.currentWeatherAudioNote,
      weatherBonusSummary: weatherPerks.bonusSummary,
      weatherChallengeSummary: weatherPerks.challengeSummary,
      weatherBonuses: weatherPerks.bonuses,
      weatherChallenges: weatherPerks.challenges,
      weatherPerkColor: weatherPerks.accentColor,
      dayCount: this.dayCount,
      timeOfDay: this.timeOfDay,
      timeLabel: this.getTimeLabel(),
      clockLabel: this.getClockLabel(),
      dayPhase: this.getDayPhase(),
      skyTopColor: skyAtmo.skyTopHex,
      skyHorizonColor: skyAtmo.skyHorizonHex,
      wildlifeActivityNote: this.getWildlifeActivityNote(),
      playerX: Math.round(pTileX),
      playerY: Math.round(pTileY),
      worldTilesW: WORLD_TILES_W,
      worldTilesH: WORLD_TILES_H,
      coordLabel: formatCoordLabel(lon, lat),
      tileSize: TILE_SIZE,
      inventory: { ...this.inventory },
      equipment: { ...p.equipment },
      selectedSlot: p.selectedSlot,
      microscopeActive: p.microscopeActive,
      beaconsActivated: activeBeacons,
      beaconsTotal: this.world.beacons.length,
      discoveredSpeciesIds: Array.from(this.discoveredSpecies),
      discoveredLocationIds: Array.from(this.discoveredLocations),
      totalSpeciesCount: SPECIES_CATALOG.length,
      totalLocationsCount: WORLD_LOCATIONS.length,
      bossSpawned: Boolean(boss),
      bossDefeated: this.bossDefeated,
      bossName: boss ? boss.name : '',
      bossHp: boss ? Math.max(0, Math.ceil(boss.hp)) : 0,
      bossMaxHp: boss ? boss.maxHp : 780,
      interactPrompt: this.getCurrentInteractPrompt(),
      questObjective,
      enemiesDefeated: this.enemiesDefeated,
      resourcesGathered: this.resourcesGathered,
      exploredPercent,
      seed: this.world.seed,
      companion: companionHud,
      unlockedSkillIds: Array.from(this.unlockedSkills),
      journalEntries: [...this.journalEntries],
      newJournalAlert: this.newJournalAlert,
      perishableFreshness: Math.max(0, Math.min(100, Math.round(this.perishableFreshness))),
      perishableStatusNote: this.perishableStatusNote,
      isPreservedByStructure: this.isPreservedByStructure,
      activeStorageStructureId: this.activeStorageStructureId,
      activeHazardAlert: this.activeHazardAlert,
    });
  }

  // =========================================================================
  // RENDERING PIPELINE
  // =========================================================================

  private getOrBuildChunk(cx: number, cy: number): HTMLCanvasElement {
    const idx = cy * CHUNKS_X + cx;
    const cached = this.chunkCanvases[idx];
    if (cached) return cached;

    const off = document.createElement('canvas');
    off.width = CHUNK_PX;
    off.height = CHUNK_PX;
    const c = off.getContext('2d')!;

    const startTx = cx * CHUNK_TILES;
    const startTy = cy * CHUNK_TILES;

    for (let ly = 0; ly < CHUNK_TILES; ly++) {
      const ty = startTy + ly;
      if (ty >= WORLD_TILES_H) continue;
      for (let lx = 0; lx < CHUNK_TILES; lx++) {
        const tx = startTx + lx;
        if (tx >= WORLD_TILES_W) continue;

        const wIdx = ty * WORLD_TILES_W + tx;
        const biome = this.world.tiles[wIdx];
        const dSeed = this.world.decorSeed[wIdx];
        const pal = BIOME_PALETTE[biome];

        const px = lx * TILE_SIZE;
        const py = ly * TILE_SIZE;

        c.fillStyle = (tx + ty + (dSeed & 1)) % 2 === 0 ? pal.base : pal.alt;
        c.fillRect(px, py, TILE_SIZE, TILE_SIZE);

        if (biome === BiomeRegion.SANCTUARY) {
          c.strokeStyle = 'rgba(20, 26, 24, 0.28)';
          c.strokeRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);
        } else if (biome === BiomeRegion.SAVANNA || biome === BiomeRegion.FOREST || biome === BiomeRegion.RIVERBANK) {
          if (dSeed < 62) {
            c.fillStyle = pal.accent;
            c.fillRect(px + (dSeed % 22) + 4, py + ((dSeed * 3) % 22) + 4, 2.5, 6);
            c.fillRect(px + (dSeed % 22) + 8, py + ((dSeed * 3) % 22) + 6, 2.5, 4);
          } else if (dSeed > 238) {
            c.fillStyle = biome === BiomeRegion.FOREST ? '#4ade80' : '#fde047';
            c.beginPath();
            c.arc(px + (dSeed % 24) + 6, py + ((dSeed * 5) % 24) + 6, 2.2, 0, Math.PI * 2);
            c.fill();
          }
        } else if (biome === BiomeRegion.DESERT || biome === BiomeRegion.COAST) {
          if (dSeed < 48) {
            c.strokeStyle = 'rgba(255, 244, 214, 0.25)';
            c.lineWidth = 1.4;
            c.beginPath();
            c.moveTo(px + 5, py + 18);
            c.quadraticCurveTo(px + 18, py + 13, px + 31, py + 18);
            c.stroke();
          }
        } else if (biome === BiomeRegion.SNOW_PEAK) {
          if (dSeed < 50) {
            c.fillStyle = '#ffffff';
            c.fillRect(px + (dSeed % 24) + 4, py + ((dSeed * 3) % 24) + 4, 4, 4);
          }
        }

        // Shoreline / Riverbank water foam
        const isWater = biome === BiomeRegion.OCEAN || biome === BiomeRegion.RIVER;
        if (!isWater) {
          const checkWater = (ntx: number, nty: number) => {
            if (ntx < 0 || ntx >= WORLD_TILES_W || nty < 0 || nty >= WORLD_TILES_H) return false;
            const nb = this.world.tiles[nty * WORLD_TILES_W + ntx];
            return nb === BiomeRegion.OCEAN || nb === BiomeRegion.RIVER;
          };
          c.fillStyle = 'rgba(186, 230, 253, 0.48)';
          if (checkWater(tx, ty - 1)) c.fillRect(px, py, TILE_SIZE, 4);
          if (checkWater(tx, ty + 1)) c.fillRect(px, py + TILE_SIZE - 4, TILE_SIZE, 4);
          if (checkWater(tx - 1, ty)) c.fillRect(px, py, 4, TILE_SIZE);
          if (checkWater(tx + 1, ty)) c.fillRect(px + TILE_SIZE - 4, py, 4, TILE_SIZE);
        }
      }
    }

    this.chunkCanvases[idx] = off;
    return off;
  }

  private render(): void {
    const ctx = this.ctx;
    const viewW = window.innerWidth;
    const viewH = window.innerHeight;

    ctx.fillStyle = '#0d1412';
    ctx.fillRect(0, 0, viewW, viewH);

    const shakeMag = this.shakeTrauma * this.shakeTrauma * 14;
    const shakeX = (Math.random() * 2 - 1) * shakeMag;
    const shakeY = (Math.random() * 2 - 1) * shakeMag;

    const camLeft = this.camX - viewW / 2 + shakeX;
    const camTop = this.camY - viewH / 2 + shakeY;

    ctx.save();
    ctx.translate(-Math.round(camLeft), -Math.round(camTop));

    const minCx = Math.max(0, Math.floor(camLeft / CHUNK_PX));
    const maxCx = Math.min(CHUNKS_X - 1, Math.floor((camLeft + viewW) / CHUNK_PX));
    const minCy = Math.max(0, Math.floor(camTop / CHUNK_PX));
    const maxCy = Math.min(CHUNKS_Y - 1, Math.floor((camTop + viewH) / CHUNK_PX));

    for (let cy = minCy; cy <= maxCy; cy++) {
      for (let cx = minCx; cx <= maxCx; cx++) {
        const chunkImg = this.getOrBuildChunk(cx, cy);
        ctx.drawImage(chunkImg, cx * CHUNK_PX, cy * CHUNK_PX);
      }
    }

    // Dynamic Sky Shimmer & Starlight Reflections on Oceans and Rivers
    this.drawWaterSkyReflections(ctx, camLeft, camTop, viewW, viewH);

    // Sanctuary & Summit Plazas
    this.drawGroundPlaza(ctx, this.world.spawnX, this.world.spawnY, 125, '#d6b265', false);
    const activeBeacons = this.world.beacons.filter((b) => b.activated).length;
    this.drawGroundPlaza(ctx, this.world.altarX, this.world.altarY, 145, activeBeacons >= 3 ? '#f59e0b' : '#64748b', activeBeacons >= 3);

    // Procedural Archipelago Environmental Hazard Zones
    this.drawEnvironmentalHazards(ctx, camLeft, camTop, viewW, viewH);

    // Draw Living Microbial Colonies (Biofilms, Bioluminescent Surf, Geothermal Mats)
    this.drawMicrobialColonies(ctx, camLeft, camTop, viewW, viewH);

    // Draw Ground Raindrop Ripples on Water & Soil
    this.drawRainSplashes(ctx, camLeft, camTop, viewW, viewH);

    // Build Preview
    if (this.gameState === GameState.PLAYING && (this.player.selectedSlot >= 4 || this.activeBlueprintSpec !== null)) {
      const px = this.player.x + Math.cos(this.player.aimAngle) * 52;
      const py = this.player.y + Math.sin(this.player.aimAngle) * 52;
      const spec =
        this.activeBlueprintSpec ||
        ALL_BUILDABLE_STRUCTURES.find(
          (b) => BUILDABLE_SLOTS.find((s) => s.slotIndex === this.player.selectedSlot)?.kind === b.kind
        );
      const accent = spec ? spec.accentColor : '#fde047';

      ctx.save();
      ctx.strokeStyle = accent;
      ctx.fillStyle = 'rgba(253, 224, 71, 0.12)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(px, py, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);

      if (spec) {
        ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = accent;
        ctx.textAlign = 'center';
        ctx.fillText(`🔨 Xây: ${spec.name}`, px, py - 26);
      }
      ctx.restore();
    }

    this.drawEnemyTelegraphs(ctx, camLeft, camTop, viewW, viewH);
    this.drawLootDrops(ctx, camLeft, camTop, viewW, viewH);

    // Y-Sorted Entities
    const renderList: { y: number; draw: () => void }[] = [];
    const pad = 95;

    for (let i = 0; i < this.world.resources.length; i++) {
      const r = this.world.resources[i];
      if (r.respawnTimer > 0) continue;
      if (r.x < camLeft - pad || r.x > camLeft + viewW + pad || r.y < camTop - pad || r.y > camTop + viewH + pad) continue;
      renderList.push({ y: r.y, draw: () => this.drawResource(ctx, r) });
    }

    for (const b of this.world.beacons) {
      if (b.x < camLeft - pad || b.x > camLeft + viewW + pad || b.y < camTop - pad || b.y > camTop + viewH + pad) continue;
      renderList.push({ y: b.y, draw: () => this.drawBeacon(ctx, b) });
    }

    for (const st of this.world.structures) {
      if (st.x < camLeft - pad || st.x > camLeft + viewW + pad || st.y < camTop - pad || st.y > camTop + viewH + pad) continue;
      renderList.push({ y: st.y, draw: () => this.drawStructure(ctx, st) });
    }

    for (const npc of this.world.npcs) {
      if (npc.x < camLeft - pad || npc.x > camLeft + viewW + pad || npc.y < camTop - pad || npc.y > camTop + viewH + pad) continue;
      renderList.push({ y: npc.y, draw: () => this.drawNpc(ctx, npc) });
    }

    for (let i = 0; i < this.world.animals.length; i++) {
      const a = this.world.animals[i];
      if (a.x < camLeft - pad || a.x > camLeft + viewW + pad || a.y < camTop - pad || a.y > camTop + viewH + pad) continue;
      renderList.push({ y: a.y, draw: () => this.drawAnimal(ctx, a) });
    }

    if (this.gameState !== GameState.TITLE && this.companion) {
      const comp = this.companion;
      renderList.push({ y: comp.y, draw: () => this.drawCompanion(ctx, comp) });
    }

    if (this.gameState !== GameState.TITLE && this.player.hp > 0) {
      renderList.push({ y: this.player.y, draw: () => this.drawPlayer(ctx) });
    }

    if (this.multiplayerClient && this.gameState !== GameState.TITLE) {
      const remotes = this.multiplayerClient.getRemotePlayers();
      for (let i = 0; i < remotes.length; i++) {
        const rp = remotes[i];
        if (rp.x < camLeft - pad || rp.x > camLeft + viewW + pad || rp.y < camTop - pad || rp.y > camTop + viewH + pad) continue;
        renderList.push({ y: rp.y, draw: () => this.drawRemotePlayer(ctx, rp) });
      }
    }

    renderList.sort((a, b) => a.y - b.y);
    for (let i = 0; i < renderList.length; i++) {
      renderList[i].draw();
    }

    // Draw Fluttering & Crawling Regional Insects
    this.drawInsects(ctx, camLeft, camTop, viewW, viewH);

    this.drawProjectiles(ctx);
    this.drawParticles(ctx);

    if (this.multiplayerClient) {
      this.drawMultiplayerPings(ctx);
    }

    // Draw Interactive Microscope / Bio-Scanner Overlay in World Space!
    if (this.gameState === GameState.PLAYING && (this.player.microscopeActive || this.player.scannerPulseTimer > 0)) {
      this.drawMicroscopeLens(ctx);
    }

    this.drawFloatingTexts(ctx);
    ctx.restore();

    this.drawDayNightLighting(ctx, camLeft, camTop, viewW, viewH);
    this.drawWeatherOverlay(ctx, camLeft, camTop, viewW, viewH);
  }

  private drawMicrobialColonies(
    ctx: CanvasRenderingContext2D,
    camLeft: number,
    camTop: number,
    viewW: number,
    viewH: number
  ): void {
    for (let i = 0; i < this.world.microbes.length; i++) {
      const col = this.world.microbes[i];
      if (
        col.x < camLeft - 65 ||
        col.x > camLeft + viewW + 65 ||
        col.y < camTop - 65 ||
        col.y > camTop + viewH + 65
      ) {
        continue;
      }

      const sp = SPECIES_BY_ID[col.speciesId];
      const shape = sp?.microbeShape || 'rod';
      const dim = col.sampledCooldown > 0 ? 0.35 : 1;
      const t = this.globalTime * 2.2 + col.id;

      ctx.save();
      ctx.translate(col.x, col.y);

      // Soft outer biofilm / mineral halo
      ctx.globalAlpha = (0.24 + Math.sin(t) * 0.07) * dim;
      ctx.fillStyle = col.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, col.radius * 1.12, col.radius * 0.72, 0, 0, Math.PI * 2);
      ctx.fill();

      // Distinct natural macro-colony morphology per bacterial species!
      ctx.globalAlpha = 0.82 * dim;
      if (col.speciesId === 'thermus_aquaticus') {
        // Geothermal hot-spring vent rim + rising golden mineral bubbles
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.ellipse(0, 0, col.radius * 0.78, col.radius * 0.48, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.ellipse(0, 0, col.radius * 0.48, col.radius * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        for (let b = 0; b < 4; b++) {
          const by = -((this.globalTime * 14 + b * 7 + col.id) % 16);
          const bx = Math.sin(t + b * 2) * 8;
          ctx.beginPath();
          ctx.arc(bx, by, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (shape === 'filament') {
        // Streptomyces branching white-emerald actinomycete mycelial threads
        ctx.strokeStyle = col.secondaryColor;
        ctx.lineWidth = 1.6;
        for (let k = 0; k < 7; k++) {
          const ang = (k * Math.PI * 2) / 7 + col.id * 0.3;
          const rLen = col.radius * 0.78;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(
            Math.cos(ang + 0.3) * rLen * 0.5,
            Math.sin(ang + 0.3) * rLen * 0.35,
            Math.cos(ang) * rLen,
            Math.sin(ang) * rLen * 0.65
          );
          ctx.stroke();
          ctx.fillStyle = '#ecfdf5';
          ctx.beginPath();
          ctx.arc(Math.cos(ang) * rLen, Math.sin(ang) * rLen * 0.65, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (shape === 'spiral') {
        // Spirulina emerald helical cyanobacterial ribbons floating on water
        ctx.strokeStyle = col.secondaryColor;
        ctx.lineWidth = 2.2;
        ctx.lineCap = 'round';
        [-5, 4].forEach((oy, idx) => {
          ctx.beginPath();
          for (let sx = -14; sx <= 14; sx += 3.5) {
            const sy = oy + Math.sin(sx * 0.48 + t + idx) * 3.2;
            if (sx === -14) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
          }
          ctx.stroke();
        });
      } else if (col.speciesId === 'deinococcus_radiodurans') {
        // Radiation-resistant orange-coral 4-cell Tetrad micro-crusts
        const offsets = [
          [-8, -3],
          [7, -4],
          [-2, 5],
        ];
        offsets.forEach(([ox, oy]) => {
          ctx.fillStyle = '#f97316';
          [
            [-2.2, -2],
            [2.2, -2],
            [-2.2, 2],
            [2.2, 2],
          ].forEach(([dx, dy]) => {
            ctx.beginPath();
            ctx.arc(ox + dx, oy + dy, 2, 0, Math.PI * 2);
            ctx.fill();
          });
        });
      } else if (col.speciesId === 'psychrobacter_arcticus') {
        // Subglacial crystalline cryo-pockets
        ctx.strokeStyle = '#ecfeff';
        ctx.lineWidth = 1.4;
        for (let k = 0; k < 6; k++) {
          const ang = (k * Math.PI) / 3 + col.id * 0.2;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(ang) * 13, Math.sin(ang) * 8.5);
          ctx.stroke();
        }
        ctx.fillStyle = '#a5f3fc';
        ctx.beginPath();
        ctx.arc(-5, -2, 2.5, 0, Math.PI * 2);
        ctx.arc(5, 2, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Bioluminescent Vibrio / Prochlorococcus / Rhizobium / Nitrosomonas micro-rods & bubbles
        ctx.fillStyle = col.secondaryColor;
        for (let k = 0; k < 6; k++) {
          const a = (k * Math.PI * 2) / 6 + this.globalTime * 0.75 + col.id;
          const r = 7 + (k % 2) * 7;
          const cx = Math.cos(a) * r;
          const cy = Math.sin(a) * r * 0.62;
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(a + Math.PI / 2);
          ctx.beginPath();
          ctx.ellipse(0, 0, 3.6, 1.7, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // Subtle dashed microscope target ring when player is nearby
      const dPlayer = Math.hypot(this.player.x - col.x, this.player.y - col.y);
      if (dPlayer < 150 && col.sampledCooldown <= 0) {
        ctx.globalAlpha = 0.55;
        ctx.strokeStyle = col.secondaryColor;
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.ellipse(0, 0, col.radius + 4, (col.radius + 4) * 0.66, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.restore();
    }
  }

  private drawMicroscopeLens(ctx: CanvasRenderingContext2D): void {
    const p = this.player;
    if (p.scannerPulseTimer > 0) {
      const prog = 1 - p.scannerPulseTimer / 0.55;
      ctx.save();
      ctx.strokeStyle = '#a3e635';
      ctx.globalAlpha = (1 - prog) * 0.85;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 24 + prog * 155, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (!p.microscopeActive) return;

    const lensX = p.x + Math.cos(p.aimAngle) * 62;
    const lensY = p.y + Math.sin(p.aimAngle) * 62;
    const lensR = 58;

    let nearestCol: MicrobialColony | null = null;
    let bestD = 135;
    for (const col of this.world.microbes) {
      const d = Math.hypot(col.x - lensX, col.y - lensY);
      if (d < bestD) {
        bestD = d;
        nearestCol = col;
      }
    }

    ctx.save();
    ctx.beginPath();
    ctx.arc(lensX, lensY, lensR, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(6, 18, 17, 0.9)';
    ctx.fill();
    ctx.clip();

    // Darkfield concentric optical reticle + micrometer ticks
    ctx.strokeStyle = 'rgba(163, 230, 53, 0.16)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(lensX - lensR, lensY);
    ctx.lineTo(lensX + lensR, lensY);
    ctx.moveTo(lensX, lensY - lensR);
    ctx.lineTo(lensX, lensY + lensR);
    ctx.arc(lensX, lensY, lensR * 0.55, 0, Math.PI * 2);
    ctx.stroke();

    const sp = nearestCol ? SPECIES_BY_ID[nearestCol.speciesId] : null;
    const cellColor = sp ? sp.color : '#a3e635';
    const subColor = sp ? sp.secondaryColor : '#ecfccb';
    const shape = sp?.microbeShape || 'rod';

    for (let i = 0; i < 10; i++) {
      const t = this.globalTime * 1.75 + i * 1.28;
      const cx = lensX + Math.cos(t * 0.85 + i) * 34;
      const cy = lensY + Math.sin(t * 1.08 + i * 1.7) * 32;
      const rot = t * 0.9 + i;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);

      if (shape === 'spiral') {
        // Multi-turn Spirulina helix with cellular cross-septa
        ctx.strokeStyle = cellColor;
        ctx.lineWidth = 3.4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        for (let sx = -13; sx <= 13; sx += 2.6) {
          const sy = Math.sin(sx * 0.55 + this.globalTime * 5) * 4.2;
          if (sx === -13) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.stroke();
        ctx.strokeStyle = subColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -3);
        ctx.lineTo(0, 3);
        ctx.stroke();
      } else if (sp?.id === 'deinococcus_radiodurans') {
        // Signature 4-cell Tetrad with radiation-shield outer capsule
        ctx.strokeStyle = subColor;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(0, 0, 8.2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = cellColor;
        [
          [-3.1, -3.1],
          [3.1, -3.1],
          [-3.1, 3.1],
          [3.1, 3.1],
        ].forEach(([dx, dy]) => {
          ctx.beginPath();
          ctx.arc(dx, dy, 2.8, 0, Math.PI * 2);
          ctx.fill();
        });
      } else if (shape === 'cocci') {
        // Prochlorococcus / Psychrobacter diplococci with thylakoid / cryo-lipid membrane halo
        ctx.fillStyle = cellColor;
        ctx.globalAlpha = 0.28;
        ctx.beginPath();
        ctx.arc(-3.5, -1.5, 5.8, 0, Math.PI * 2);
        ctx.arc(3.8, 1.8, 5.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(-3.5, -1.5, 3.8, 0, Math.PI * 2);
        ctx.arc(3.8, 1.8, 3.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-4.5, -2.5, 1.1, 0, Math.PI * 2);
        ctx.fill();
      } else if (shape === 'filament') {
        // Streptomyces branching hyphae + terminal conidia spore chains
        ctx.strokeStyle = cellColor;
        ctx.lineWidth = 2.4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-12, 3);
        ctx.quadraticCurveTo(-2, -1, 10, -4);
        ctx.moveTo(-2, 0);
        ctx.quadraticCurveTo(3, 5, 7, 10);
        ctx.stroke();
        ctx.fillStyle = subColor;
        [
          [12, -5],
          [15, -6],
          [9, 12],
        ].forEach(([bx, by]) => {
          ctx.beginPath();
          ctx.arc(bx, by, 1.8, 0, Math.PI * 2);
          ctx.fill();
        });
      } else {
        // Detailed Rod Bacillus: capsule membrane, body, internal nucleoid strand & waving flagella!
        ctx.fillStyle = cellColor;
        ctx.globalAlpha = 0.25;
        ctx.beginPath();
        ctx.roundRect(-9.5, -5, 19, 10, 5);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.roundRect(-7.5, -3.4, 15, 6.8, 3.4);
        ctx.fill();
        // Nucleoid DNA line
        ctx.strokeStyle = '#ffffff';
        ctx.globalAlpha = 0.7;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(-4.5, 0);
        ctx.quadraticCurveTo(0, -1.8, 4.5, 0);
        ctx.stroke();
        // Polar flagellum whip
        ctx.globalAlpha = 0.9;
        ctx.strokeStyle = subColor;
        ctx.lineWidth = 1.2;
        const whip = Math.sin(this.globalTime * 16 + i) * 4.5;
        ctx.beginPath();
        ctx.moveTo(-7.5, 0);
        ctx.quadraticCurveTo(-13, whip, -19, -whip * 0.5);
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.restore();

    // Microscope Optical Rim & Live Taxonomic Readout
    ctx.save();
    ctx.strokeStyle = nearestCol ? '#a3e635' : '#38bdf8';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.arc(lensX, lensY, lensR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.font = '600 10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#ecfccb';
    ctx.textAlign = 'center';
    ctx.fillText(
      sp ? `400x · ${sp.name} (${sp.scientificName})` : '400x · Đưa ống kính vào quần thể vi sinh [Click]',
      lensX,
      lensY + lensR + 15
    );
    ctx.restore();
  }

  private drawInsects(
    ctx: CanvasRenderingContext2D,
    camLeft: number,
    camTop: number,
    viewW: number,
    viewH: number
  ): void {
    for (let i = 0; i < this.world.insects.length; i++) {
      const ins = this.world.insects[i];
      if (
        ins.x < camLeft - 36 ||
        ins.x > camLeft + viewW + 36 ||
        ins.y < camTop - 36 ||
        ins.y > camTop + viewH + 36
      ) {
        continue;
      }

      const hoverY = ins.isFlying ? 13 + Math.sin(ins.wingPhase * 0.28) * 3.5 : 0;
      const moveAngle = Math.cos(this.globalTime * 1.1 + ins.id * 1.7) >= 0 ? 0.15 : -0.15;

      ctx.save();
      ctx.translate(ins.x, ins.y - hoverY);

      // Soft ground shadow for flying insects
      if (ins.isFlying) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(0, hoverY + 2, 5, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.rotate(moveAngle);
      const flap = Math.abs(Math.sin(ins.wingPhase));

      if (ins.speciesId === 'emperor_dragonfly' || ins.speciesId === 'coastal_skimmer') {
        // 4 veined dragonfly wings + slender segmented tail + compound eyes
        const wSpan = 7.5 + flap * 4.5;
        ctx.fillStyle = 'rgba(186, 230, 253, 0.72)';
        ctx.strokeStyle = ins.color;
        ctx.lineWidth = 0.8;
        [
          [-wSpan * 0.58, -2, wSpan, 2.2, -0.22],
          [wSpan * 0.58, -2, wSpan, 2.2, 0.22],
          [-wSpan * 0.5, 1.8, wSpan * 0.88, 2, 0.2],
          [wSpan * 0.5, 1.8, wSpan * 0.88, 2, -0.2],
        ].forEach(([wx, wy, rx, ry, rot]) => {
          ctx.beginPath();
          ctx.ellipse(wx, wy, rx, ry, rot, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        });
        ctx.fillStyle = ins.color;
        ctx.fillRect(-1.2, -4, 2.4, 13);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-1.2, 2, 2.4, 1);
        ctx.fillRect(-1.2, 5.5, 2.4, 1);
        ctx.fillStyle = '#e0f2fe';
        ctx.beginPath();
        ctx.arc(-1.3, -4.5, 1.5, 0, Math.PI * 2);
        ctx.arc(1.3, -4.5, 1.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (
        ins.speciesId === 'morpho_butterfly' ||
        ins.speciesId === 'monarch_butterfly' ||
        ins.speciesId === 'apollo_butterfly'
      ) {
        // Patterned butterfly forewings + hindwings (folded quietly when resting at night!)
        const restingAtNight = this.isNightPeriod();
        const wOpen = restingAtNight ? 0.24 : 0.35 + flap * 0.65;
        ctx.save();
        ctx.scale(wOpen, 1);
        // Forewings
        ctx.fillStyle = ins.color;
        ctx.strokeStyle = ins.speciesId === 'apollo_butterfly' ? '#64748b' : '#1e293b';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.ellipse(-6.5, -2.5, 6.8, 4.8, -0.35, 0, Math.PI * 2);
        ctx.ellipse(6.5, -2.5, 6.8, 4.8, 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Hindwings
        ctx.beginPath();
        ctx.ellipse(-5, 3.5, 5.2, 4.2, 0.3, 0, Math.PI * 2);
        ctx.ellipse(5, 3.5, 5.2, 4.2, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Wing markings / Apollo red eyespots
        ctx.fillStyle = ins.secondaryColor;
        ctx.beginPath();
        ctx.arc(-5, 3.8, 1.6, 0, Math.PI * 2);
        ctx.arc(5, 3.8, 1.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-1, -5, 2, 10);
      } else if (ins.speciesId === 'golden_honeybee') {
        // Honeybee: translucent wings + black-and-yellow striped abdomen
        const wSpan = this.isNightPeriod() ? 3.5 : 4.5 + flap * 3.5;
        ctx.fillStyle = 'rgba(224, 242, 254, 0.78)';
        ctx.beginPath();
        ctx.ellipse(-wSpan * 0.6, -1, wSpan, 2.5, -0.3, 0, Math.PI * 2);
        ctx.ellipse(wSpan * 0.6, -1, wSpan, 2.5, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.ellipse(0, 1.5, 3.8, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-3.4, 0, 6.8, 1.4);
        ctx.fillRect(-3, 2.8, 6, 1.4);
        ctx.beginPath();
        ctx.arc(0, -4, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (ins.speciesId === 'water_firefly') {
        // Firefly with glowing pulsing golden-lime bioluminescent lantern (shines brightest at dusk & night!)
        const nightBoost = this.isCrepuscularOrNight() ? 1.0 : 0.32;
        const glowPulse = (0.48 + Math.sin(this.globalTime * 6 + ins.id) * 0.32) * nightBoost;
        ctx.fillStyle = '#fde047';
        ctx.globalAlpha = glowPulse;
        ctx.beginPath();
        ctx.arc(0, 4, this.isCrepuscularOrNight() ? 13 : 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        // Wings + dark elytra + lantern tail
        const wSpan = 4 + flap * 3.5;
        ctx.fillStyle = 'rgba(254, 249, 195, 0.55)';
        ctx.beginPath();
        ctx.ellipse(-wSpan * 0.6, -1, wSpan, 2.2, -0.25, 0, Math.PI * 2);
        ctx.ellipse(wSpan * 0.6, -1, wSpan, 2.2, 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.ellipse(0, -0.5, 3.2, 4.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(0, 4, 2.8, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Crawling Beetles (Hercules Horned Beetle, Sacred Scarab, Coastal Tiger Beetle)
        const legWiggle = Math.sin(ins.wingPhase) * 1.5;
        ctx.strokeStyle = '#422006';
        ctx.lineWidth = 1.3;
        [-3, 0, 3].forEach((ly, idx) => {
          const off = idx % 2 === 0 ? legWiggle : -legWiggle;
          ctx.beginPath();
          ctx.moveTo(-3.5, ly);
          ctx.lineTo(-7.5, ly + off);
          ctx.moveTo(3.5, ly);
          ctx.lineTo(7.5, ly - off);
          ctx.stroke();
        });
        // Carapace elytra
        ctx.fillStyle = ins.color;
        ctx.beginPath();
        ctx.ellipse(0, 1.5, 4.8, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#422006';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -4);
        ctx.lineTo(0, 7.5);
        ctx.stroke();
        // Thorax
        ctx.fillStyle = ins.secondaryColor;
        ctx.beginPath();
        ctx.ellipse(0, -4.5, 3.8, 2.6, 0, 0, Math.PI * 2);
        ctx.fill();

        if (ins.speciesId === 'hercules_beetle') {
          // Giant Hercules pincer horns!
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(-1, -6.5);
          ctx.quadraticCurveTo(-2.5, -12, 0.5, -13.5);
          ctx.moveTo(1.2, -6.5);
          ctx.lineTo(0.8, -11);
          ctx.stroke();
        } else if (ins.speciesId === 'sacred_scarab') {
          // Scarab rolling a tiny golden sand/mineral sphere!
          ctx.fillStyle = '#d97706';
          ctx.beginPath();
          ctx.arc(0, -9.5, 2.8, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Tiger beetle white stripes & sickle mandibles
          ctx.strokeStyle = '#fef9c3';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(-3.5, 0.5);
          ctx.lineTo(3.5, 0.5);
          ctx.moveTo(-1.8, -6.8);
          ctx.lineTo(-0.5, -9.5);
          ctx.moveTo(1.8, -6.8);
          ctx.lineTo(0.5, -9.5);
          ctx.stroke();
        }
      }

      ctx.restore();
    }
  }

  private drawGroundPlaza(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    runeColor: string,
    pulsing: boolean
  ): void {
    ctx.save();
    ctx.strokeStyle = runeColor;
    ctx.globalAlpha = pulsing ? 0.45 + Math.sin(this.globalTime * 3) * 0.18 : 0.28;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.66, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  private drawEnvironmentalHazards(
    ctx: CanvasRenderingContext2D,
    camLeft: number,
    camTop: number,
    viewW: number,
    viewH: number
  ): void {
    if (!this.world.hazards) return;
    ctx.save();
    for (let i = 0; i < this.world.hazards.length; i++) {
      const h = this.world.hazards[i];
      if (
        h.x < camLeft - h.radius ||
        h.x > camLeft + viewW + h.radius ||
        h.y < camTop - h.radius ||
        h.y > camTop + viewH + h.radius
      ) {
        continue;
      }

      const pulse = Math.sin(this.globalTime * 2.5 + h.id) * 0.12;
      const alpha = 0.22 + pulse;

      if (h.kind === HazardKind.VOLCANIC_HEAT_VENT) {
        const grad = ctx.createRadialGradient(h.x, h.y, h.radius * 0.1, h.x, h.y, h.radius);
        grad.addColorStop(0, 'rgba(239, 68, 68, 0.42)');
        grad.addColorStop(0.6, 'rgba(249, 115, 22, 0.2)');
        grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `rgba(249, 115, 22, ${(alpha + 0.22).toFixed(2)})`;
        ctx.lineWidth = 1.8;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (h.kind === HazardKind.GLACIAL_FROSTBITE) {
        const grad = ctx.createRadialGradient(h.x, h.y, h.radius * 0.1, h.x, h.y, h.radius);
        grad.addColorStop(0, 'rgba(56, 189, 248, 0.38)');
        grad.addColorStop(0.6, 'rgba(224, 242, 254, 0.18)');
        grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `rgba(186, 230, 253, ${(alpha + 0.25).toFixed(2)})`;
        ctx.lineWidth = 1.8;
        ctx.setLineDash([8, 4]);
        ctx.beginPath();
        ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (h.kind === HazardKind.SPORE_TOXIC_BOG) {
        const grad = ctx.createRadialGradient(h.x, h.y, h.radius * 0.1, h.x, h.y, h.radius);
        grad.addColorStop(0, 'rgba(163, 230, 53, 0.36)');
        grad.addColorStop(0.6, 'rgba(192, 132, 252, 0.2)');
        grad.addColorStop(1, 'rgba(163, 230, 53, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `rgba(192, 132, 252, ${(alpha + 0.25).toFixed(2)})`;
        ctx.lineWidth = 1.8;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.arc(h.x, h.y, h.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    ctx.restore();
  }

  private drawEnemyTelegraphs(
    ctx: CanvasRenderingContext2D,
    camLeft: number,
    camTop: number,
    viewW: number,
    viewH: number
  ): void {
    for (let i = 0; i < this.world.animals.length; i++) {
      const a = this.world.animals[i];
      if (a.peaceful || a.state !== EnemyState.WINDUP) continue;
      if (a.x < camLeft - 220 || a.x > camLeft + viewW + 220 || a.y < camTop - 220 || a.y > camTop + viewH + 220) {
        continue;
      }

      ctx.save();
      if (
        a.kind === AnimalKind.WILD_BOAR ||
        a.kind === AnimalKind.RIVER_CROC ||
        a.kind === AnimalKind.JUNGLE_JAGUAR
      ) {
        const len = 180;
        const ang = Math.atan2(a.chargeDirY, a.chargeDirX);
        ctx.translate(a.x, a.y);
        ctx.rotate(ang);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.22)';
        ctx.strokeStyle = 'rgba(252, 165, 165, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.fillRect(0, -14, len, 28);
        ctx.strokeRect(0, -14, len, 28);
      } else if (a.kind === AnimalKind.MOUNTAIN_BEAR || a.isBoss) {
        const maxR = a.isBoss ? 148 : 118;
        const progress = Math.max(0.1, Math.min(1, 1 - a.stateTimer / 0.88));
        ctx.fillStyle = 'rgba(239, 68, 68, 0.18)';
        ctx.strokeStyle = 'rgba(248, 113, 113, 0.85)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(a.x, a.y, maxR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(a.x, a.y, maxR * progress, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.85)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(a.x, a.y - 6, a.radius + 7, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  private drawWaterSkyReflections(
    ctx: CanvasRenderingContext2D,
    camLeft: number,
    camTop: number,
    viewW: number,
    viewH: number
  ): void {
    const sky = this.getSkyAtmosphere();
    const isNight = this.isNightPeriod();
    const startTx = Math.max(0, Math.floor(camLeft / TILE_SIZE));
    const endTx = Math.min(WORLD_TILES_W - 1, Math.ceil((camLeft + viewW) / TILE_SIZE));
    const startTy = Math.max(0, Math.floor(camTop / TILE_SIZE));
    const endTy = Math.min(WORLD_TILES_H - 1, Math.ceil((camTop + viewH) / TILE_SIZE));

    ctx.save();
    for (let ty = startTy; ty <= endTy; ty += 2) {
      for (let tx = startTx; tx <= endTx; tx += 2) {
        const idx = ty * WORLD_TILES_W + tx;
        const b = this.world.tiles[idx];
        if (b !== BiomeRegion.OCEAN && b !== BiomeRegion.RIVER) continue;
        const seed = this.world.decorSeed[idx];
        if (seed > 96) continue;

        const wx = tx * TILE_SIZE + (seed % 26) + 5;
        const wy = ty * TILE_SIZE + ((seed * 3) % 26) + 5;
        const wave = Math.sin(this.globalTime * 2.1 + seed * 0.35);

        if (isNight) {
          // Twinkling starlight reflections on night water
          if (wave > 0.2) {
            ctx.fillStyle = `rgba(224, 242, 254, ${((wave - 0.2) * 0.52).toFixed(3)})`;
            ctx.beginPath();
            ctx.arc(wx, wy, 1.4, 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          // Horizon sky-color shimmer ribbons on water (coral-gold at dawn/dusk, sky-white at noon)
          const [hr, hg, hb] = sky.skyHorizonRgb;
          ctx.fillStyle = `rgba(${hr}, ${hg}, ${hb}, ${(0.18 + (wave + 1) * 0.09).toFixed(3)})`;
          ctx.fillRect(wx - 5 + wave * 3, wy, 10, 1.8);
        }
      }
    }
    ctx.restore();
  }

  private drawResource(ctx: CanvasRenderingContext2D, r: ResourceNode): void {
    ctx.save();
    ctx.translate(r.x, r.y);

    const sh = this.getShadowTransform();
    ctx.fillStyle = `rgba(0, 0, 0, ${sh.alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.ellipse(sh.offX, 6 + sh.offY * 0.4, r.radius * 0.92 * sh.stretchX, r.radius * 0.44, 0, 0, Math.PI * 2);
    ctx.fill();

    const sway = Math.sin(this.globalTime * 1.75 + r.id) * 0.032;
    ctx.scale(1 + r.squash, 1 - r.squash * 0.8);
    ctx.rotate(sway);

    const flash = r.hitFlash > 0.2;

    switch (r.kind) {
      case ResourceKind.ANCIENT_OAK:
      case ResourceKind.RAINFOREST_BANYAN: {
        const isBanyan = r.kind === ResourceKind.RAINFOREST_BANYAN;
        // Flared buttress roots + branches
        ctx.fillStyle = flash ? '#ffffff' : isBanyan ? '#573a22' : '#6b4423';
        ctx.beginPath();
        ctx.moveTo(-11, 10);
        ctx.quadraticCurveTo(-6, 2, -6, -15);
        ctx.lineTo(6, -15);
        ctx.quadraticCurveTo(6, 2, 11, 10);
        ctx.closePath();
        ctx.fill();
        // Bark furrow line
        ctx.strokeStyle = '#3e2723';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(-1, -12);
        ctx.lineTo(-2, 7);
        ctx.moveTo(-5, -13);
        ctx.lineTo(-14, -21);
        ctx.moveTo(5, -13);
        ctx.lineTo(14, -21);
        ctx.stroke();

        if (isBanyan) {
          // Curtain of hanging aerial prop roots
          ctx.strokeStyle = flash ? '#ffffff' : '#78350f';
          ctx.lineWidth = 2;
          [-17, -12, 12, 17].forEach((rx) => {
            ctx.beginPath();
            ctx.moveTo(rx, -16);
            ctx.lineTo(rx + (rx < 0 ? -1.5 : 1.5), 8);
            ctx.stroke();
          });
        }

        // Layered canopy clusters + sunlit crown highlight
        ctx.fillStyle = flash ? '#ffffff' : isBanyan ? '#14532d' : '#2f6e3b';
        ctx.beginPath();
        ctx.arc(-16, -19, isBanyan ? 15 : 13, 0, Math.PI * 2);
        ctx.arc(16, -19, isBanyan ? 15 : 13, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = flash ? '#ffffff' : isBanyan ? '#166534' : '#3f7d44';
        ctx.beginPath();
        ctx.arc(0, -27, isBanyan ? 23 : 19, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = flash ? '#ffffff' : isBanyan ? '#22c55e' : '#65a30d';
        ctx.globalAlpha = 0.55;
        ctx.beginPath();
        ctx.arc(-5, -32, isBanyan ? 12 : 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Acorns / Banyan figs
        ctx.fillStyle = isBanyan ? '#ef4444' : '#d97706';
        [
          [-12, -13],
          [9, -15],
          [2, -21],
        ].forEach(([fx, fy]) => {
          ctx.beginPath();
          ctx.arc(fx, fy, 2.1, 0, Math.PI * 2);
          ctx.fill();
        });
        break;
      }

      case ResourceKind.WEEPING_WILLOW: {
        // Gracefully leaning riverside trunk
        ctx.fillStyle = flash ? '#ffffff' : '#6b4423';
        ctx.beginPath();
        ctx.moveTo(-7, 10);
        ctx.quadraticCurveTo(-4, -4, -1, -18);
        ctx.lineTo(5, -18);
        ctx.quadraticCurveTo(3, -3, 6, 10);
        ctx.closePath();
        ctx.fill();

        // Dome crown
        ctx.fillStyle = flash ? '#ffffff' : '#4d7c0f';
        ctx.beginPath();
        ctx.ellipse(0, -24, 21, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = flash ? '#ffffff' : '#65a30d';
        ctx.beginPath();
        ctx.ellipse(-6, -26, 12, 8, 0, 0, Math.PI * 2);
        ctx.ellipse(7, -25, 12, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Swaying curtain of weeping willow leaf strands
        const breeze = Math.sin(this.globalTime * 2.5 + r.id) * 3.5;
        ctx.strokeStyle = flash ? '#ffffff' : '#a3e635';
        ctx.lineWidth = 1.8;
        ctx.lineCap = 'round';
        [-16, -10, -4, 3, 9, 15].forEach((ox, idx) => {
          ctx.beginPath();
          ctx.moveTo(ox, -22);
          ctx.quadraticCurveTo(ox + breeze * 0.5, -8, ox + breeze, 4 + (idx % 2) * 3);
          ctx.stroke();
        });
        break;
      }

      case ResourceKind.ALPINE_PINE: {
        ctx.fillStyle = flash ? '#ffffff' : '#4a321f';
        ctx.fillRect(-4.5, -6, 9, 16);
        for (let tier = 0; tier < 3; tier++) {
          const yOff = -7 - tier * 13;
          const w = 23 - tier * 4;
          ctx.fillStyle = flash ? '#ffffff' : '#1e4631';
          ctx.beginPath();
          ctx.moveTo(0, yOff - 21);
          ctx.lineTo(-w, yOff);
          ctx.lineTo(-w * 0.4, yOff - 2);
          ctx.lineTo(0, yOff + 1);
          ctx.lineTo(w * 0.4, yOff - 2);
          ctx.lineTo(w, yOff);
          ctx.closePath();
          ctx.fill();
          // Crisp snow cap
          ctx.fillStyle = '#f1f5f9';
          ctx.beginPath();
          ctx.moveTo(0, yOff - 21);
          ctx.lineTo(-w * 0.48, yOff - 11);
          ctx.lineTo(0, yOff - 9);
          ctx.lineTo(w * 0.48, yOff - 11);
          ctx.closePath();
          ctx.fill();
        }
        // Hanging pine cones
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.ellipse(-9, -8, 2, 3.2, 0, 0, Math.PI * 2);
        ctx.ellipse(8, -19, 2, 3.2, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case ResourceKind.COCONUT_PALM: {
        // Curved ringed coconut trunk
        ctx.strokeStyle = flash ? '#ffffff' : '#8c5e35';
        ctx.lineWidth = 7.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-2, 8);
        ctx.quadraticCurveTo(-7, -10, 3, -27);
        ctx.stroke();

        // Pinnate arching fronds
        ctx.fillStyle = flash ? '#ffffff' : '#4d9c46';
        for (let k = 0; k < 6; k++) {
          const a = (k * Math.PI * 2) / 6 + 0.25;
          ctx.save();
          ctx.translate(3, -27);
          ctx.rotate(a);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(11, -5, 22, 2);
          ctx.quadraticCurveTo(11, 2, 0, 0);
          ctx.fill();
          ctx.restore();
        }
        // 3 coconuts cluster
        ctx.fillStyle = '#713f12';
        [
          [0, -24],
          [5, -24],
          [2.5, -21],
        ].forEach(([cx, cy]) => {
          ctx.beginPath();
          ctx.arc(cx, cy, 3, 0, Math.PI * 2);
          ctx.fill();
        });
        break;
      }

      case ResourceKind.SAGUARO_CACTUS: {
        // Rounded pleated cactus column + curved arms + crown flowers
        ctx.fillStyle = flash ? '#ffffff' : '#4d7c0f';
        ctx.beginPath();
        ctx.roundRect(-5.5, -31, 11, 39, 5.5);
        ctx.roundRect(-15, -22, 10, 6, 3);
        ctx.roundRect(-15, -30, 6, 13, 3);
        ctx.roundRect(5, -17, 10, 6, 3);
        ctx.roundRect(9, -27, 6, 15, 3);
        ctx.fill();

        // Vertical rib highlight
        ctx.strokeStyle = '#bef264';
        ctx.globalAlpha = 0.55;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(-1.5, -28);
        ctx.lineTo(-1.5, 5);
        ctx.moveTo(2, -28);
        ctx.lineTo(2, 5);
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Desert cactus blossoms on tips
        ctx.fillStyle = '#fef08a';
        [
          [0, -32],
          [-12, -31],
          [12, -28],
        ].forEach(([fx, fy]) => {
          ctx.beginPath();
          ctx.arc(fx, fy, 2.6, 0, Math.PI * 2);
          ctx.fill();
        });
        break;
      }

      case ResourceKind.SACRED_LOTUS: {
        // Cattail reed stems behind
        ctx.strokeStyle = '#15803d';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-11, 4);
        ctx.lineTo(-13, -18);
        ctx.moveTo(12, 3);
        ctx.lineTo(14, -15);
        ctx.stroke();
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.roundRect(-14.5, -15, 3.2, 7.5, 1.6);
        ctx.fill();

        // Notched green lotus leaf pad
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(0, 2, 13.5, 0.25, Math.PI * 2 - 0.25);
        ctx.lineTo(0, 2);
        ctx.closePath();
        ctx.fill();

        // Multi-petal pink lotus blossom + golden stamen
        ctx.fillStyle = flash ? '#ffffff' : '#f472b6';
        for (let k = 0; k < 6; k++) {
          const ang = (k * Math.PI) / 3;
          ctx.beginPath();
          ctx.ellipse(Math.cos(ang) * 4.8, -4 + Math.sin(ang) * 3.2, 4.8, 2.4, ang, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#fbcfe8';
        ctx.beginPath();
        ctx.arc(0, -5, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(0, -4.5, 2.2, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case ResourceKind.GIANT_KELP: {
        // Pink coral holdfast at base
        ctx.fillStyle = '#fb7185';
        ctx.beginPath();
        ctx.arc(-5, 6, 4.5, Math.PI, 0);
        ctx.arc(4, 6, 5, Math.PI, 0);
        ctx.fill();

        // Undulating kelp stipes, blades & gas bladders
        ctx.strokeStyle = flash ? '#ffffff' : '#14b8a6';
        ctx.lineWidth = 3.2;
        ctx.lineCap = 'round';
        [-6, 1, 7].forEach((ox, idx) => {
          const wave = Math.sin(this.globalTime * 2.8 + idx + r.id) * 3;
          ctx.beginPath();
          ctx.moveTo(ox, 6);
          ctx.quadraticCurveTo(ox - 5 + wave, -6, ox + 2 + wave, -19 - idx * 3);
          ctx.stroke();

          ctx.fillStyle = '#2dd4bf';
          ctx.beginPath();
          ctx.ellipse(ox + wave * 0.7, -11 - idx * 2, 4.5, 2, 0.4, 0, Math.PI * 2);
          ctx.fill();
        });
        break;
      }

      case ResourceKind.GLOW_MUSHROOM: {
        // Unfurling forest fern fronds + 3 bioluminescent Mycena mushrooms
        ctx.strokeStyle = '#15803d';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(-3, 5);
        ctx.quadraticCurveTo(-13, -2, -11, -9);
        ctx.moveTo(3, 5);
        ctx.quadraticCurveTo(13, -2, 11, -9);
        ctx.stroke();

        // Ambient green bioluminescence halo
        ctx.fillStyle = '#4ade80';
        ctx.globalAlpha = 0.22 + Math.sin(this.globalTime * 3.5 + r.id) * 0.08;
        ctx.beginPath();
        ctx.arc(0, -9, 17, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        [
          [-7, 4, -7, -6, 6.5],
          [0, 5, 0, -13, 9.5],
          [7, 4, 7, -5, 5.5],
        ].forEach(([x0, y0, x1, y1, capR]) => {
          ctx.strokeStyle = '#dcfce7';
          ctx.lineWidth = 2.8;
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x1, y1);
          ctx.stroke();

          ctx.fillStyle = flash ? '#ffffff' : '#4ade80';
          ctx.beginPath();
          ctx.arc(x1, y1, capR, Math.PI, 0);
          ctx.fill();
        });
        break;
      }

      case ResourceKind.EDELWEISS_HERB: {
        // Lichen alpine stone cushion + woolly 8-pointed white Edelweiss star blossom
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.ellipse(0, 3, 11, 5.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#166534';
        ctx.beginPath();
        ctx.ellipse(0, 0, 9, 4.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = flash ? '#ffffff' : '#f8fafc';
        for (let k = 0; k < 8; k++) {
          const a = (k * Math.PI) / 4;
          ctx.beginPath();
          ctx.ellipse(Math.cos(a) * 6.5, -5 + Math.sin(a) * 6.5, 4.6, 2.1, a, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(0, -5, 3.2, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case ResourceKind.BERRY_BUSH: {
        // Multi-lobed bramble bush + white flowers + glossy berries
        ctx.fillStyle = flash ? '#ffffff' : '#166534';
        ctx.beginPath();
        ctx.arc(-8, -4, 10, 0, Math.PI * 2);
        ctx.arc(8, -4, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = flash ? '#ffffff' : '#2f6e3b';
        ctx.beginPath();
        ctx.arc(0, -9, 13, 0, Math.PI * 2);
        ctx.fill();
        [
          [-6, -10],
          [5, -12],
          [3, -4],
          [-4, -3],
          [9, -6],
        ].forEach(([bx, by]) => {
          ctx.fillStyle = '#fb7185';
          ctx.beginPath();
          ctx.arc(bx, by, 2.9, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(bx - 0.8, by - 0.8, 0.9, 0, Math.PI * 2);
          ctx.fill();
        });
        break;
      }

      case ResourceKind.STONE_ROCK:
      case ResourceKind.IRON_VEIN: {
        ctx.fillStyle = flash ? '#ffffff' : '#64748b';
        ctx.beginPath();
        ctx.moveTo(-17, 6);
        ctx.lineTo(-13, -12);
        ctx.lineTo(3, -17);
        ctx.lineTo(17, -6);
        ctx.lineTo(14, 8);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.moveTo(-13, -12);
        ctx.lineTo(3, -17);
        ctx.lineTo(6, -6);
        ctx.lineTo(-8, -3);
        ctx.closePath();
        ctx.fill();
        if (r.kind === ResourceKind.IRON_VEIN) {
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(-7, -9, 6, 4);
          ctx.fillRect(3, -5, 7, 4);
          ctx.fillRect(-2, 0, 5, 3.5);
        }
        break;
      }

      case ResourceKind.CRYSTAL_CLUSTER: {
        const colors = ['#0284c7', '#38bdf8', '#7dd3fc'];
        [
          [-11, 5, -6, -21, 1, 5],
          [-2, 6, 5, -27, 12, 6],
          [5, 6, 13, -16, 16, 6],
        ].forEach(([x1, y1, x2, y2, x3, y3], idx) => {
          ctx.fillStyle = flash ? '#ffffff' : colors[idx];
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.lineTo(x3, y3);
          ctx.closePath();
          ctx.fill();
        });
        break;
      }

      case ResourceKind.ANCIENT_CHEST: {
        ctx.fillStyle = flash ? '#ffffff' : '#78350f';
        ctx.fillRect(-14, -12, 28, 20);
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(-14, -12, 28, 20);
        ctx.fillStyle = '#fde047';
        ctx.fillRect(-3, -4, 6, 6);
        break;
      }
    }

    ctx.restore();
  }

  private drawBeacon(ctx: CanvasRenderingContext2D, b: GeneratedWorld['beacons'][number]): void {
    ctx.save();
    ctx.translate(b.x, b.y);

    ctx.fillStyle = 'rgba(0,0,0,0.34)';
    ctx.beginPath();
    ctx.ellipse(0, 10, 24, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#334155';
    ctx.fillRect(-18, -2, 36, 12);

    ctx.fillStyle = b.activated ? '#1e293b' : '#27272a';
    ctx.beginPath();
    ctx.moveTo(-12, 2);
    ctx.lineTo(-8, -54);
    ctx.lineTo(0, -64);
    ctx.lineTo(8, -54);
    ctx.lineTo(12, 2);
    ctx.closePath();
    ctx.fill();

    const bob = Math.sin(this.globalTime * 3 + b.id) * 3;
    ctx.fillStyle = b.activated ? '#38bdf8' : '#f59e0b';
    ctx.beginPath();
    ctx.arc(0, -34 + bob, b.activated ? 7.5 : 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawStructure(ctx: CanvasRenderingContext2D, st: PlacedStructure): void {
    ctx.save();
    ctx.translate(st.x, st.y);

    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(0, 7, 18, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    switch (st.kind) {
      case StructureKind.WOOD_WALL: {
        // Interlocking wooden logs with iron bands & spiked tops
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-18, -26, 36, 28);
        ctx.fillStyle = '#b45309';
        [-14, -6, 2, 10].forEach((lx) => {
          ctx.fillRect(lx, -28, 6, 30);
          ctx.beginPath();
          ctx.moveTo(lx, -28);
          ctx.lineTo(lx + 3, -34);
          ctx.lineTo(lx + 6, -28);
          ctx.closePath();
          ctx.fill();
        });
        // Iron binding straps
        ctx.fillStyle = '#475569';
        ctx.fillRect(-19, -20, 38, 3.5);
        ctx.fillRect(-19, -8, 38, 3.5);
        break;
      }

      case StructureKind.STONE_WALL: {
        // Heavy chiseled stone block wall with battlements/crenels & mortar
        ctx.fillStyle = '#334155';
        ctx.fillRect(-22, -28, 44, 30);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(-20, -26, 40, 26);

        // Stone block grid lines
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-20, -17);
        ctx.lineTo(20, -17);
        ctx.moveTo(-20, -8);
        ctx.lineTo(20, -8);
        ctx.moveTo(-6, -26);
        ctx.lineTo(-6, -17);
        ctx.moveTo(8, -26);
        ctx.lineTo(8, -17);
        ctx.moveTo(0, -17);
        ctx.lineTo(0, -8);
        ctx.moveTo(-10, -8);
        ctx.lineTo(-10, 0);
        ctx.moveTo(10, -8);
        ctx.lineTo(10, 0);
        ctx.stroke();

        // Crenels / battlements
        ctx.fillStyle = '#475569';
        [-20, -8, 4, 14].forEach((cx) => {
          ctx.fillRect(cx, -33, 6, 7);
        });
        break;
      }

      case StructureKind.WOOD_FLOOR: {
        // Finished timber plank floor tile
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-22, -18, 44, 24);
        ctx.fillStyle = '#b45309';
        [-20, -8, 4, 14].forEach((py) => {
          ctx.fillRect(-20, py, 40, 4.5);
        });
        ctx.fillStyle = '#fde047';
        [-16, 12].forEach((nx) => {
          [-16, -4, 8].forEach((ny) => {
            ctx.beginPath();
            ctx.arc(nx, ny, 0.8, 0, Math.PI * 2);
            ctx.fill();
          });
        });
        break;
      }

      case StructureKind.STONE_FLOOR: {
        // Carved stone flagstone tile pavement
        ctx.fillStyle = '#334155';
        ctx.fillRect(-24, -20, 48, 26);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(-22, -18, 44, 22);

        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1.4;
        ctx.strokeRect(-22, -18, 44, 22);
        ctx.beginPath();
        ctx.moveTo(0, -18);
        ctx.lineTo(0, 4);
        ctx.moveTo(-22, -7);
        ctx.lineTo(22, -7);
        ctx.stroke();

        // Moss / rune corner
        ctx.fillStyle = '#15803d';
        ctx.fillRect(-20, -16, 6, 4);
        break;
      }

      case StructureKind.RAIN_COLLECTOR: {
        // Wooden water barrel collector with top funnel & water level gauge
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.ellipse(0, 0, 16, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(-15, -20, 30, 20);

        // Metal bands
        ctx.fillStyle = '#d97706';
        ctx.fillRect(-16, -17, 32, 2.5);
        ctx.fillRect(-16, -5, 32, 2.5);

        // Top funnel rim & accumulated water
        const collectedPct = Math.min(100, st.collectedWater || 0) / 100;
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.ellipse(0, -20, 15, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        if (collectedPct > 0) {
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.ellipse(0, -20, 13 * collectedPct, 4.5 * collectedPct, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        // Tap spout
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(-2, -2, 4, 8);
        break;
      }

      case StructureKind.REPAIR_STATION: {
        // Anvil & workbench table with golden repair aura
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-18, -12, 36, 16);
        ctx.fillStyle = '#475569';
        ctx.fillRect(-14, -18, 28, 8);

        // Anvil
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-10, -24, 20, 6);
        ctx.fillRect(-12, -26, 8, 3);

        // Pulsing golden aura
        const auraAlpha = 0.35 + Math.sin(this.globalTime * 3.5 + st.id) * 0.2;
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 1.8;
        ctx.globalAlpha = auraAlpha;
        ctx.beginPath();
        ctx.arc(0, -10, 24, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
        break;
      }

      case StructureKind.SPIKE_TRAP: {
        // Low wooden frame platform with sharp triangular iron spikes
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-18, -6, 36, 10);
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(-18, -6, 36, 10);

        // Sharp iron spikes
        ctx.fillStyle = '#cbd5e1';
        [-13, -6, 0, 6, 13].forEach((sx) => {
          ctx.beginPath();
          ctx.moveTo(sx - 3, -6);
          ctx.lineTo(sx, -18);
          ctx.lineTo(sx + 3, -6);
          ctx.closePath();
          ctx.fill();
          // Red counter-damage tip
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.moveTo(sx - 1.2, -13);
          ctx.lineTo(sx, -18);
          ctx.lineTo(sx + 1.2, -13);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#cbd5e1';
        });
        break;
      }

      case StructureKind.RESEARCH_TENT: {
        // Explorer canvas tent with bio-scanner antenna & warm interior light
        ctx.fillStyle = '#3f6212';
        ctx.beginPath();
        ctx.moveTo(-22, 2);
        ctx.lineTo(0, -32);
        ctx.lineTo(22, 2);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#a3e635';
        ctx.beginPath();
        ctx.moveTo(-8, 2);
        ctx.lineTo(0, -18);
        ctx.lineTo(8, 2);
        ctx.closePath();
        ctx.fill();

        // Antenna
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -32);
        ctx.lineTo(0, -42);
        ctx.stroke();
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(0, -42, 3, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case StructureKind.FOOD_PRESERVER: {
        // Metallic/Wooden preservation chest with ice blue frost glow
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-15, -13, 30, 20);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-13, -11, 26, 16);

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.strokeRect(-15, -13, 30, 20);

        const frostGlow = 0.6 + Math.sin(this.globalTime * 4 + st.id) * 0.4;
        ctx.fillStyle = `rgba(56, 189, 248, ${frostGlow.toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(0, -3, 4.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(224, 242, 254, 0.6)';
        const wave = Math.sin(this.globalTime * 3 + st.id) * 4;
        ctx.beginPath();
        ctx.arc(wave * 0.5, -16, 2, 0, Math.PI * 2);
        ctx.arc(-wave * 0.5, -20, 1.5, 0, Math.PI * 2);
        ctx.fill();

        const storedCount = (st.storedBerries || 0) + (st.storedBioSamples || 0);
        if (storedCount > 0) {
          ctx.fillStyle = '#0284c7';
          ctx.beginPath();
          ctx.arc(11, -13, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = '700 9px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`${storedCount}`, 11, -10);
        }
        break;
      }

      case StructureKind.CAMPFIRE: {
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-12, -2, 24, 5);
        const flicker = Math.sin(this.globalTime * 15 + st.id) * 2.5;
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(-9, 3);
        ctx.quadraticCurveTo(0, -24 + flicker, 9, 3);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.moveTo(-5, 3);
        ctx.quadraticCurveTo(0, -14 - flicker * 0.6, 5, 3);
        ctx.closePath();
        ctx.fill();
        break;
      }

      case StructureKind.BIO_LANTERN:
      default: {
        // Vibrio Bioluminescent Lantern
        ctx.fillStyle = '#334155';
        ctx.fillRect(-3, -24, 6, 28);
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(0, -26, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#bae6fd';
        ctx.beginPath();
        ctx.arc(0, -26, 4, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
    }

    // Health bar for damaged structures
    if (st.hp < st.maxHp) {
      const bw = 30;
      const pct = Math.max(0, st.hp / st.maxHp);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(-bw / 2, -38, bw, 4);
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(-bw / 2 + 0.5, -37.5, (bw - 1) * pct, 3);
    }

    ctx.restore();
  }

  private drawNpc(ctx: CanvasRenderingContext2D, npc: GeneratedWorld['npcs'][number]): void {
    ctx.save();
    ctx.translate(npc.x, npc.y);

    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 10, 13, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    const bob = Math.sin(this.globalTime * 2.6) * 1.5;
    ctx.fillStyle = '#0f766e';
    ctx.beginPath();
    ctx.arc(0, -4 + bob, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fde68a';
    ctx.beginPath();
    ctx.arc(0, -16 + bob, 8.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#a3e635';
    ctx.beginPath();
    ctx.moveTo(0, -35 + bob);
    ctx.lineTo(-4.5, -30 + bob);
    ctx.lineTo(0, -25 + bob);
    ctx.lineTo(4.5, -30 + bob);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  private drawAnimalBody(
    ctx: CanvasRenderingContext2D,
    kind: AnimalKind,
    flash: boolean,
    animPhase: number,
    facingLeft: boolean,
    isMoving: boolean
  ): void {
    ctx.save();
    if (facingLeft && kind !== AnimalKind.ANCIENT_TITAN && kind !== AnimalKind.REEF_CRAB) {
      ctx.scale(-1, 1);
    }

    const stride = isMoving ? Math.sin(animPhase * 2.1) * 3.5 : 0;

    switch (kind) {
      case AnimalKind.SEA_TURTLE: {
        // 4 animated swimming flippers + head + hexagonal carapace scutes
        const paddle = Math.sin(animPhase * 1.6) * 0.28;
        ctx.fillStyle = flash ? '#ffffff' : '#34d399';
        ctx.beginPath();
        ctx.ellipse(2, -13, 9, 3.8, -0.55 + paddle, 0, Math.PI * 2);
        ctx.ellipse(2, 9, 9, 3.8, 0.55 - paddle, 0, Math.PI * 2);
        ctx.ellipse(-12, -8, 5.5, 2.6, 0.4, 0, Math.PI * 2);
        ctx.ellipse(-12, 4, 5.5, 2.6, -0.4, 0, Math.PI * 2);
        ctx.ellipse(17, -2, 5.5, 4.2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = flash ? '#ffffff' : '#065f46';
        ctx.strokeStyle = '#6ee7b7';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.ellipse(0, -2, 14.5, 10.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = flash ? '#ffffff' : '#10b981';
        ctx.beginPath();
        ctx.roundRect(-6, -6, 12, 8, 3);
        ctx.fill();

        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(19, -3.5, 1.2, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case AnimalKind.RIVER_OTTER: {
        // Sleek undulating body + tapered tail + cream throat + whiskers + webbed feet
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-7, 2);
        ctx.lineTo(-9 + stride, 8);
        ctx.moveTo(7, 2);
        ctx.lineTo(9 - stride, 8);
        ctx.stroke();

        ctx.fillStyle = flash ? '#ffffff' : '#78350f';
        ctx.beginPath();
        ctx.moveTo(-21, 1);
        ctx.quadraticCurveTo(-12, -8, 4, -7);
        ctx.quadraticCurveTo(16, -9, 17, -2);
        ctx.quadraticCurveTo(16, 4, 4, 4);
        ctx.quadraticCurveTo(-10, 6, -21, 1);
        ctx.fill();

        ctx.fillStyle = '#fde68a';
        ctx.beginPath();
        ctx.ellipse(11, -1, 5, 2.6, -0.15, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(14, -4.5, 1.3, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case AnimalKind.SPOTTED_DEER: {
        // 4 slender animated legs + white tail + spotted coat + neck + branching antlers
        ctx.strokeStyle = flash ? '#ffffff' : '#92400e';
        ctx.lineWidth = 2.4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-9, -1);
        ctx.lineTo(-10 + stride, 10);
        ctx.moveTo(-4, -1);
        ctx.lineTo(-4 - stride, 10);
        ctx.moveTo(6, -1);
        ctx.lineTo(6 - stride, 10);
        ctx.moveTo(10, -1);
        ctx.lineTo(11 + stride, 10);
        ctx.stroke();

        ctx.fillStyle = flash ? '#ffffff' : '#d97706';
        ctx.beginPath();
        ctx.ellipse(-1, -7, 13, 7.5, 0, 0, Math.PI * 2);
        ctx.fill();
        // Neck & head
        ctx.beginPath();
        ctx.moveTo(7, -9);
        ctx.lineTo(13, -19);
        ctx.lineTo(19, -17);
        ctx.lineTo(12, -5);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(16, -18, 5, 3.4, 0.1, 0, Math.PI * 2);
        ctx.fill();

        // White tail & star spots
        ctx.fillStyle = '#fef3c7';
        ctx.beginPath();
        ctx.ellipse(-14, -9, 2.8, 1.8, 0.3, 0, Math.PI * 2);
        ctx.arc(-6, -8, 1.4, 0, Math.PI * 2);
        ctx.arc(-1, -10, 1.4, 0, Math.PI * 2);
        ctx.arc(3, -6, 1.4, 0, Math.PI * 2);
        ctx.fill();

        // Branching antlers
        ctx.strokeStyle = '#fef3c7';
        ctx.lineWidth = 1.9;
        ctx.beginPath();
        ctx.moveTo(14, -20);
        ctx.lineTo(11, -28);
        ctx.moveTo(12.5, -24);
        ctx.lineTo(8.5, -25);
        ctx.moveTo(16, -20);
        ctx.lineTo(18, -28);
        ctx.stroke();

        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(17.5, -18.5, 1.2, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case AnimalKind.DESERT_CAMEL: {
        // 4 long desert legs + single prominent hump + curved U-neck + snout
        ctx.strokeStyle = flash ? '#ffffff' : '#a16207';
        ctx.lineWidth = 2.8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-10, -2);
        ctx.lineTo(-11 + stride, 12);
        ctx.moveTo(-5, -2);
        ctx.lineTo(-5 - stride, 12);
        ctx.moveTo(6, -2);
        ctx.lineTo(6 - stride, 12);
        ctx.moveTo(10, -2);
        ctx.lineTo(11 + stride, 12);
        ctx.stroke();

        ctx.fillStyle = flash ? '#ffffff' : '#d97706';
        ctx.beginPath();
        ctx.ellipse(-2, -9, 15, 8.8, 0, 0, Math.PI * 2);
        ctx.arc(-2, -18, 7.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = flash ? '#ffffff' : '#d97706';
        ctx.lineWidth = 5.5;
        ctx.beginPath();
        ctx.moveTo(10, -9);
        ctx.quadraticCurveTo(18, -9, 18, -22);
        ctx.stroke();

        ctx.fillStyle = flash ? '#ffffff' : '#fde68a';
        ctx.beginPath();
        ctx.ellipse(20, -23, 5.5, 3.6, 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(21, -23.5, 1.2, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case AnimalKind.ALPINE_IBEX: {
        // 4 nimble hooves + muscular body + beard + sweeping ridged scimitar horns
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(-9, -1);
        ctx.lineTo(-10 + stride, 10);
        ctx.moveTo(-4, -1);
        ctx.lineTo(-4 - stride, 10);
        ctx.moveTo(6, -1);
        ctx.lineTo(6 - stride, 10);
        ctx.moveTo(10, -1);
        ctx.lineTo(11 + stride, 10);
        ctx.stroke();

        ctx.fillStyle = flash ? '#ffffff' : '#cbd5e1';
        ctx.beginPath();
        ctx.ellipse(-1, -7, 13.5, 8.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(8, -8);
        ctx.lineTo(13, -17);
        ctx.lineTo(19, -14);
        ctx.lineTo(12, -5);
        ctx.closePath();
        ctx.fill();

        // Sweeping ridged horns + chin beard
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(13, -17);
        ctx.quadraticCurveTo(4, -30, -9, -22);
        ctx.stroke();
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(17, -12);
        ctx.lineTo(16, -8);
        ctx.stroke();

        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(15.5, -15, 1.2, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case AnimalKind.REEF_CRAB: {
        // 8 jointed sideways legs + 2 snapping serrated pincer claws + eyestalks
        const legMove = Math.sin(animPhase * 2.5) * 2.2;
        ctx.strokeStyle = flash ? '#ffffff' : '#b91c1c';
        ctx.lineWidth = 2.2;
        [-5, -1, 3, 7].forEach((ly, idx) => {
          const off = idx % 2 === 0 ? legMove : -legMove;
          ctx.beginPath();
          ctx.moveTo(-10, -3 + ly * 0.4);
          ctx.lineTo(-18, -1 + ly + off * 0.5);
          ctx.moveTo(10, -3 + ly * 0.4);
          ctx.lineTo(18, -1 + ly - off * 0.5);
          ctx.stroke();
        });

        ctx.fillStyle = flash ? '#ffffff' : '#ef4444';
        ctx.beginPath();
        ctx.ellipse(0, -3, 12.5, 8.8, 0, 0, Math.PI * 2);
        ctx.arc(-13, -11, 5.2, 0.4, Math.PI * 1.85);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(13, -11, 5.2, -Math.PI * 0.85, -0.4);
        ctx.fill();

        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(-4.5, -11, 1.7, 0, Math.PI * 2);
        ctx.arc(4.5, -11, 1.7, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case AnimalKind.RIVER_CROC: {
        // Armored dorsal osteoderm scutes + muscular notched tail + 4 legs + toothed jaws
        const tailSway = Math.sin(animPhase * 1.8) * 3;
        ctx.strokeStyle = '#365314';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(-7, 2);
        ctx.lineTo(-9 + stride, 8);
        ctx.moveTo(7, 2);
        ctx.lineTo(9 - stride, 8);
        ctx.stroke();

        ctx.fillStyle = flash ? '#ffffff' : '#3f6212';
        ctx.beginPath();
        ctx.moveTo(-25, -2 + tailSway);
        ctx.quadraticCurveTo(-12, -8, 6, -7);
        ctx.lineTo(24, -5);
        ctx.lineTo(24, 1);
        ctx.lineTo(6, 3);
        ctx.quadraticCurveTo(-12, 4, -25, -2 + tailSway);
        ctx.fill();

        // Osteoderm back ridges + white teeth + yellow reptile eye
        ctx.fillStyle = '#84cc16';
        [-14, -8, -2, 4].forEach((sx) => {
          ctx.beginPath();
          ctx.moveTo(sx, -7);
          ctx.lineTo(sx + 2.5, -11);
          ctx.lineTo(sx + 5, -7);
          ctx.fill();
        });
        ctx.fillStyle = '#fef9c3';
        ctx.fillRect(13, -1, 2, 2.2);
        ctx.fillRect(17, -1, 2, 2.2);
        ctx.fillRect(21, -1, 2, 2.2);
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(10, -6.5, 1.8, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case AnimalKind.PRAIRIE_WOLF: {
        // Bushy tail + 4 lupine legs + silver ruff + pointed ears + snout
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(-9, -1);
        ctx.lineTo(-10 + stride, 9);
        ctx.moveTo(-4, -1);
        ctx.lineTo(-4 - stride, 9);
        ctx.moveTo(6, -1);
        ctx.lineTo(6 - stride, 9);
        ctx.moveTo(10, -1);
        ctx.lineTo(11 + stride, 9);
        ctx.stroke();

        // Bushy tail
        ctx.fillStyle = flash ? '#ffffff' : '#64748b';
        ctx.beginPath();
        ctx.ellipse(-16, -5, 6.5, 3.2, 0.4, 0, Math.PI * 2);
        ctx.fill();

        // Body & silver neck ruff
        ctx.fillStyle = flash ? '#ffffff' : '#94a3b8';
        ctx.beginPath();
        ctx.ellipse(0, -6, 13.5, 7.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = flash ? '#ffffff' : '#cbd5e1';
        ctx.beginPath();
        ctx.arc(9, -9, 6.5, 0, Math.PI * 2);
        ctx.fill();
        // Snout & pointed ears
        ctx.fillStyle = flash ? '#ffffff' : '#94a3b8';
        ctx.beginPath();
        ctx.moveTo(11, -13);
        ctx.lineTo(22, -10);
        ctx.lineTo(21, -6);
        ctx.lineTo(11, -6);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.moveTo(8, -14);
        ctx.lineTo(10, -21);
        ctx.lineTo(13, -14);
        ctx.moveTo(12, -14);
        ctx.lineTo(15, -20);
        ctx.lineTo(16, -13);
        ctx.fill();
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(14.5, -10.5, 1.3, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case AnimalKind.WILD_BOAR: {
        // Stocky legs + dark bristled dorsal ridge + snout + curved white tusks!
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-9, 1);
        ctx.lineTo(-10 + stride, 9);
        ctx.moveTo(8, 1);
        ctx.lineTo(9 - stride, 9);
        ctx.stroke();

        ctx.fillStyle = flash ? '#ffffff' : '#7c2d12';
        ctx.beginPath();
        ctx.ellipse(0, -5, 16, 10.5, 0, 0, Math.PI * 2);
        ctx.ellipse(15, -4, 5.5, 4.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Dorsal bristles
        ctx.strokeStyle = '#3e2723';
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(-11, -14);
        ctx.quadraticCurveTo(0, -18, 10, -13);
        ctx.stroke();

        // Curved white tusks
        ctx.strokeStyle = '#fef3c7';
        ctx.lineWidth = 2.4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(16, -2);
        ctx.quadraticCurveTo(22, -4, 20, -10);
        ctx.stroke();
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(12, -7.5, 1.4, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case AnimalKind.JUNGLE_JAGUAR: {
        // Curling feline tail + 4 legs + golden coat with rosette rings + cat ears
        ctx.strokeStyle = flash ? '#ffffff' : '#b45309';
        ctx.lineWidth = 2.8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-13, -6);
        ctx.quadraticCurveTo(-22, -7, -21, -15);
        ctx.moveTo(-9, 0);
        ctx.lineTo(-10 + stride, 9);
        ctx.moveTo(-4, 0);
        ctx.lineTo(-4 - stride, 9);
        ctx.moveTo(6, 0);
        ctx.lineTo(6 - stride, 9);
        ctx.moveTo(11, 0);
        ctx.lineTo(12 + stride, 9);
        ctx.stroke();

        ctx.fillStyle = flash ? '#ffffff' : '#f59e0b';
        ctx.beginPath();
        ctx.ellipse(0, -6, 15, 7.8, 0, 0, Math.PI * 2);
        ctx.arc(14, -10, 6.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#92400e';
        ctx.beginPath();
        ctx.arc(11.5, -15.5, 2.2, 0, Math.PI * 2);
        ctx.arc(16, -15.5, 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Dark jaguar rosette rings
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 1.3;
        [
          [-7, -7],
          [-1, -8],
          [5, -5],
          [-3, -3],
        ].forEach(([rx, ry]) => {
          ctx.beginPath();
          ctx.arc(rx, ry, 2, 0, Math.PI * 2);
          ctx.stroke();
        });
        ctx.fillStyle = '#bef264';
        ctx.beginPath();
        ctx.arc(16.5, -10.5, 1.3, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case AnimalKind.EMPEROR_SCORPION: {
        // 8 arachnid legs + 2 pedipalp pincers + curved segmented tail + venomous stinger!
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 1.8;
        [-4, -1, 2, 5].forEach((off) => {
          ctx.beginPath();
          ctx.moveTo(off * 1.5, -1);
          ctx.lineTo(off * 2.2, 7 + (off % 2) * stride * 0.4);
          ctx.stroke();
        });

        ctx.fillStyle = flash ? '#ffffff' : '#b45309';
        ctx.beginPath();
        ctx.ellipse(1, -4, 11.5, 6.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Front pincers
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(11, -7);
        ctx.quadraticCurveTo(19, -11, 21, -7);
        ctx.moveTo(11, -2);
        ctx.quadraticCurveTo(19, 2, 21, -2);
        ctx.stroke();

        // Curved segmented scorpion tail arching overhead
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3.8;
        ctx.beginPath();
        ctx.moveTo(-9, -5);
        ctx.quadraticCurveTo(-19, -10, -16, -19);
        ctx.quadraticCurveTo(-13, -26, -3, -24);
        ctx.stroke();

        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.moveTo(-3, -26);
        ctx.lineTo(3, -23);
        ctx.lineTo(-2, -21);
        ctx.closePath();
        ctx.fill();
        break;
      }

      case AnimalKind.MOUNTAIN_BEAR: {
        // Heavy clawed legs + massive humped grizzly shoulders + rounded ears + tan snout
        ctx.strokeStyle = '#291509';
        ctx.lineWidth = 4.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-10, 1);
        ctx.lineTo(-11 + stride, 10);
        ctx.moveTo(-3, 1);
        ctx.lineTo(-3 - stride, 10);
        ctx.moveTo(7, 1);
        ctx.lineTo(7 - stride, 10);
        ctx.moveTo(12, 1);
        ctx.lineTo(13 + stride, 10);
        ctx.stroke();

        ctx.fillStyle = flash ? '#ffffff' : '#573a22';
        ctx.beginPath();
        ctx.ellipse(-1, -8, 17.5, 12, 0, 0, Math.PI * 2);
        ctx.arc(6, -16, 8, 0, Math.PI * 2);
        ctx.arc(16, -12, 7.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#3e2723';
        ctx.beginPath();
        ctx.arc(12, -19, 2.8, 0, Math.PI * 2);
        ctx.arc(18, -18.5, 2.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#d6d3d1';
        ctx.beginPath();
        ctx.ellipse(22, -10.5, 3.8, 2.8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(18, -13, 1.3, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case AnimalKind.ANCIENT_TITAN:
        ctx.fillStyle = flash ? '#ffffff' : '#1e293b';
        ctx.beginPath();
        ctx.moveTo(-32, 12);
        ctx.lineTo(-26, -42);
        ctx.lineTo(0, -58);
        ctx.lineTo(26, -42);
        ctx.lineTo(32, 12);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(-9, -32, 3.5, 0, Math.PI * 2);
        ctx.arc(9, -32, 3.5, 0, Math.PI * 2);
        ctx.fill();
        break;
    }

    ctx.restore();
  }

  private drawAnimal(ctx: CanvasRenderingContext2D, a: AnimalEntity): void {
    const sh = this.getShadowTransform();
    ctx.save();
    ctx.translate(a.x, a.y);

    ctx.fillStyle = `rgba(0, 0, 0, ${sh.alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.ellipse(
      sh.offX * 0.75,
      a.radius * 0.52 + sh.offY * 0.35,
      a.radius * 0.95 * sh.stretchX,
      a.radius * 0.43,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Sleeping animals settle lower with slow calm breathing
    if (a.sleeping) {
      const breath = Math.sin(a.animPhase * 1.1) * 0.035;
      ctx.translate(0, 3.5);
      ctx.scale(1.06 + breath, 0.84 - breath);
    } else {
      const sx = 1 + a.squash + Math.sin(a.animPhase) * 0.04;
      const sy = 1 - a.squash * 0.8 - Math.sin(a.animPhase) * 0.04;
      ctx.scale(sx, sy);
    }

    const speed = Math.hypot(a.vx, a.vy);
    const facingLeft = a.vx < -4;
    this.drawAnimalBody(
      ctx,
      a.kind,
      a.hitFlash > 0.2,
      a.animPhase,
      facingLeft,
      !a.sleeping && speed > 12
    );
    ctx.restore();

    // Subtle floating 'z' indicator when diurnal/nocturnal wildlife is sleeping peacefully
    if (a.sleeping) {
      const drift = (this.globalTime * 0.85 + a.id * 0.7) % 1;
      ctx.save();
      ctx.globalAlpha = Math.sin(drift * Math.PI) * 0.78;
      ctx.font = '600 10px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#cbd5e1';
      ctx.textAlign = 'center';
      ctx.fillText('zZ', a.x + 8 + drift * 6, a.y - a.radius - 6 - drift * 12);
      ctx.restore();
    }

    if (!a.isBoss && !a.peaceful && a.hp < a.maxHp) {
      const bw = 32;
      const pct = Math.max(0, a.hp / a.maxHp);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(a.x - bw / 2, a.y - a.radius - 16, bw, 4.5);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(a.x - bw / 2 + 0.5, a.y - a.radius - 15.5, (bw - 1) * pct, 3.5);
    }

    if (a.tameProgress && a.tameProgress > 0 && a.tameProgress < 100) {
      const bw = 36;
      const pct = Math.max(0, Math.min(1, a.tameProgress / 100));
      const yBar = a.y - a.radius - 23;
      ctx.fillStyle = 'rgba(10, 20, 16, 0.9)';
      ctx.fillRect(a.x - bw / 2, yBar, bw, 4.5);
      ctx.fillStyle = '#a3e635';
      ctx.fillRect(a.x - bw / 2 + 0.5, yBar + 0.5, (bw - 1) * pct, 3.5);
    }
  }

  private drawCompanion(ctx: CanvasRenderingContext2D, c: TamedCompanion): void {
    const sh = this.getShadowTransform();
    ctx.save();
    ctx.translate(c.x, c.y);

    // Friendly tamed companion ground ring
    const ringColor = c.loyalty >= 80 ? '#a3e635' : c.loyalty >= 45 ? '#38bdf8' : '#fbbf24';
    ctx.strokeStyle = ringColor;
    ctx.globalAlpha = 0.55 + Math.sin(this.globalTime * 4) * 0.15;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, c.radius * 0.52, c.radius * 1.15, c.radius * 0.58, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.fillStyle = `rgba(0, 0, 0, ${sh.alpha.toFixed(3)})`;
    ctx.beginPath();
    ctx.ellipse(
      sh.offX * 0.7,
      c.radius * 0.52 + sh.offY * 0.3,
      c.radius * 0.9 * sh.stretchX,
      c.radius * 0.42,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    const speed = Math.hypot(c.vx, c.vy);
    const bob = Math.abs(Math.sin(c.animPhase)) * (speed > 16 ? 2.2 : 0.4);
    ctx.translate(0, -bob);
    const sx = 1 + c.squash + Math.sin(c.animPhase) * 0.04;
    const sy = 1 - c.squash * 0.8 - Math.sin(c.animPhase) * 0.04;
    ctx.scale(sx, sy);

    const facingLeft = c.vx < -4;
    this.drawAnimalBody(ctx, c.kind, c.hitFlash > 0.2, c.animPhase, facingLeft, speed > 14);

    // Tamed golden-emerald collar emblem
    const collarX = facingLeft ? -7 : 7;
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(collarX, -8, 4.5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();

    // Crisp custom pet name & mini loyalty bar above companion
    ctx.save();
    ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    const labelY = c.y - c.radius - 19;
    ctx.fillStyle = 'rgba(9, 15, 13, 0.88)';
    ctx.fillText(c.customName, c.x + 1, labelY + 1);
    ctx.fillStyle = '#fef08a';
    ctx.fillText(c.customName, c.x, labelY);

    const bw = 34;
    const pct = Math.max(0, Math.min(1, c.loyalty / 100));
    ctx.fillStyle = 'rgba(12, 20, 17, 0.88)';
    ctx.fillRect(c.x - bw / 2, labelY + 4, bw, 3.5);
    ctx.fillStyle = ringColor;
    ctx.fillRect(c.x - bw / 2 + 0.5, labelY + 4.5, (bw - 1) * pct, 2.5);
    ctx.restore();
  }

  private drawPlayer(ctx: CanvasRenderingContext2D): void {
    const p = this.player;
    const sh = this.getShadowTransform();
    ctx.save();
    ctx.translate(p.x, p.y);

    ctx.fillStyle = `rgba(0, 0, 0, ${(sh.alpha + 0.06).toFixed(3)})`;
    ctx.beginPath();
    ctx.ellipse(sh.offX * 0.7, 10 + sh.offY * 0.3, 13 * sh.stretchX, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    if (p.swingTimer > 0) {
      const progress = 1 - p.swingTimer / p.swingDuration;
      const tierColors = ['#e2e8f0', '#e2e8f0', '#93c5fd', '#38bdf8', '#c084fc', '#a3e635'];
      const bladeColor = tierColors[p.equipment.swordTier] || '#e2e8f0';
      const reach = 52 + p.equipment.swordTier * 5;
      const dir = p.swingCombo % 2 === 0 ? 1 : -1;
      const startAng = p.swingAngle - dir * 1.15;
      const curAng = startAng + dir * progress * 2.3;

      ctx.save();
      ctx.strokeStyle = bladeColor;
      ctx.lineWidth = 8 * (1 - progress * 0.45);
      ctx.globalAlpha = 0.82 * (1 - progress * 0.35);
      ctx.beginPath();
      if (dir > 0) {
        ctx.arc(0, -4, reach * 0.82, startAng, curAng, false);
      } else {
        ctx.arc(0, -4, reach * 0.82, curAng, startAng, false);
      }
      ctx.stroke();

      ctx.rotate(curAng);
      ctx.fillStyle = bladeColor;
      ctx.fillRect(12, -3, reach - 10, 6);
      ctx.restore();
    }

    const bob = Math.abs(Math.sin(p.walkCycle)) * (Math.hypot(p.vx, p.vy) > 15 ? 2.5 : 0);
    ctx.scale(1 + p.squash, 1 - p.squash * 0.8);

    const flash = p.hitFlash > 0.2;
    const armorPalette = ['#0f766e', '#78552b', '#475569', '#0284c7', '#059669'];
    const coatColor = armorPalette[p.equipment.armorTier] || '#0f766e';

    ctx.fillStyle = flash ? '#ffffff' : coatColor;
    ctx.beginPath();
    ctx.arc(0, -3 - bob, 12.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = p.microscopeActive
      ? '#a3e635'
      : p.equipment.armorTier >= 3
      ? '#7dd3fc'
      : p.equipment.armorTier >= 1
      ? '#fbbf24'
      : '#99f6e4';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = flash ? '#ffffff' : '#fde68a';
    ctx.beginPath();
    ctx.arc(0, -14 - bob, 8.5, 0, Math.PI * 2);
    ctx.fill();

    const ex = Math.cos(p.aimAngle) * 3.2;
    const ey = Math.sin(p.aimAngle) * 2.2;
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(ex - 2.2, -14 - bob + ey, 1.4, 0, Math.PI * 2);
    ctx.arc(ex + 2.2, -14 - bob + ey, 1.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private updateMultiplayerSync(dt: number): void {
    if (!this.multiplayerClient || this.multiplayerClient.getStatus() !== 'CONNECTED') return;
    this.multiplayerSyncTimer += dt;
    if (this.multiplayerSyncTimer >= 0.05) {
      this.multiplayerSyncTimer = 0;
      const speed = Math.hypot(this.player.vx, this.player.vy);
      const isSwinging = this.player.swingTimer > 0;
      this.multiplayerClient.sendPlayerUpdate({
        x: this.player.x,
        y: this.player.y,
        vx: this.player.vx,
        vy: this.player.vy,
        facing: this.player.facingX < 0 ? 'left' : 'right',
        hp: this.player.hp,
        maxHp: this.player.maxHp,
        anim: isSwinging ? 'attack' : speed > 15 ? 'run' : speed > 0.1 ? 'walk' : 'idle',
        swinging: isSwinging,
        swingAngle: this.player.swingAngle,
        swordTier: this.player.equipment.swordTier,
        armorTier: this.player.equipment.armorTier,
      });
    }
  }

  private drawRemotePlayer(ctx: CanvasRenderingContext2D, rp: RemotePlayer): void {
    const sh = this.getShadowTransform();
    ctx.save();
    ctx.translate(rp.x, rp.y);

    // 1. Dynamic shadow
    ctx.fillStyle = `rgba(0, 0, 0, ${(sh.alpha + 0.06).toFixed(3)})`;
    ctx.beginPath();
    ctx.ellipse(sh.offX * 0.7, 10 + sh.offY * 0.3, 13 * sh.stretchX, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Weapon attack swing if attacking
    const isAttacking = rp.swinging || rp.anim === 'attack' || rp.isAttacking;
    if (isAttacking) {
      const bladeColor = rp.color || '#38bdf8';
      const reach = 52 + (rp.armorTier || 0) * 4;
      const curAng = rp.swingAngle || (rp.facing === 'left' ? Math.PI : 0);

      ctx.save();
      ctx.strokeStyle = bladeColor;
      ctx.lineWidth = 6;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(0, -4, reach * 0.82, curAng - 0.9, curAng + 0.9, false);
      ctx.stroke();

      ctx.rotate(curAng);
      ctx.fillStyle = bladeColor;
      ctx.fillRect(10, -2.5, reach - 8, 5);
      ctx.restore();
    }

    // 3. Movement bobbing
    const speed = Math.hypot(rp.vx || 0, rp.vy || 0);
    const bob = Math.abs(Math.sin(this.globalTime * 8)) * (speed > 15 ? 2.5 : 0);

    // 4. Remote Player Body (colored with custom player color / coat)
    const baseColor = rp.color || '#0f766e';
    ctx.fillStyle = baseColor;
    ctx.beginPath();
    ctx.arc(0, -3 - bob, 12.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // 5. Head
    ctx.fillStyle = '#fde68a';
    ctx.beginPath();
    ctx.arc(0, -14 - bob, 8.5, 0, Math.PI * 2);
    ctx.fill();

    // Eyes direction
    const eyeDir = rp.facing === 'left' ? -1 : 1;
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(eyeDir * 2.5, -14 - bob, 1.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // 6. Nametag & Health Bar & Speech Bubble in World Coordinates (above player)
    ctx.save();
    const tagY = rp.y - 32;

    // Nametag background pill
    ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
    const nameText = rp.name || 'Đồng Đội';
    const textWidth = ctx.measureText(nameText).width;
    const tagW = Math.max(textWidth + 14, 46);
    const tagH = 17;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.beginPath();
    ctx.roundRect(rp.x - tagW / 2, tagY - tagH, tagW, tagH, 4);
    ctx.fill();

    ctx.strokeStyle = rp.color || '#38bdf8';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Player Name
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(nameText, rp.x, tagY - tagH / 2);

    // Mini Health Bar under nametag
    const hpPct = Math.max(0, Math.min(1, (rp.hp || 100) / (rp.maxHp || 100)));
    const barW = tagW;
    const barH = 3.5;
    const barY = tagY + 2;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fillRect(rp.x - barW / 2, barY, barW, barH);
    ctx.fillStyle = hpPct > 0.5 ? '#22c55e' : hpPct > 0.25 ? '#eab308' : '#ef4444';
    ctx.fillRect(rp.x - barW / 2, barY, barW * hpPct, barH);

    // 7. Speech Bubble (if active)
    const bubbleText = rp.chatMessage || rp.lastSpeechBubble;
    const chatTimer = rp.chatTimer || rp.speechBubbleTimer || 0;
    if (bubbleText && chatTimer > 0) {
      ctx.font = '500 12px "Plus Jakarta Sans", sans-serif';
      const bubbleW = Math.min(220, ctx.measureText(bubbleText).width + 16);
      const bubbleH = 22;
      const bubbleY = tagY - tagH - 8 - bubbleH;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
      ctx.beginPath();
      ctx.roundRect(rp.x - bubbleW / 2, bubbleY, bubbleW, bubbleH, 6);
      ctx.fill();

      // Bubble tail
      ctx.beginPath();
      ctx.moveTo(rp.x - 4, bubbleY + bubbleH);
      ctx.lineTo(rp.x, bubbleY + bubbleH + 5);
      ctx.lineTo(rp.x + 4, bubbleY + bubbleH);
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.fillText(bubbleText, rp.x, bubbleY + bubbleH / 2);
    }

    ctx.restore();
  }

  private drawMultiplayerPings(ctx: CanvasRenderingContext2D): void {
    if (!this.multiplayerClient) return;
    const pings = this.multiplayerClient.getPings();
    if (!pings.length) return;

    const now = Date.now();
    ctx.save();
    for (let i = 0; i < pings.length; i++) {
      const p = pings[i];
      const pingCreated = p.createdAt || (p.expiresAt - 8000);
      const age = Math.max(0, (now - pingCreated) / 1000);
      const pulse = (age * 3) % 1;
      const radius = 12 + pulse * 36;
      const alpha = Math.max(0, 1 - pulse);

      // Radar Expanding Rings
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2.5;
      ctx.globalAlpha = alpha * 0.85;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Core Marker
      ctx.globalAlpha = 0.95;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Ping Label & Caller
      ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      const label = p.label || p.type;
      const callerName = p.senderName || p.createdByName || 'Đồng Đội';
      const tagText = `${callerName}: ${label}`;
      const tw = ctx.measureText(tagText).width;
      const bgW = tw + 14;
      const bgH = 18;
      const tagY = p.y - 18;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.beginPath();
      ctx.roundRect(p.x - bgW / 2, tagY - bgH, bgW, bgH, 4);
      ctx.fill();
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.textBaseline = 'middle';
      ctx.fillText(tagText, p.x, tagY - bgH / 2);
    }
    ctx.restore();
  }

  private drawLootDrops(
    ctx: CanvasRenderingContext2D,
    camLeft: number,
    camTop: number,
    viewW: number,
    viewH: number
  ): void {
    for (let i = 0; i < this.lootDrops.length; i++) {
      const d = this.lootDrops[i];
      if (d.x < camLeft - 30 || d.x > camLeft + viewW + 30 || d.y < camTop - 30 || d.y > camTop + viewH + 30) {
        continue;
      }
      const meta = RESOURCE_META[d.resource];
      const bob = Math.sin(this.globalTime * 5 + d.id) * 3;

      ctx.fillStyle = meta.color;
      ctx.beginPath();
      ctx.arc(d.x, d.y - 3 + bob, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  }

  private drawProjectiles(ctx: CanvasRenderingContext2D): void {
    for (let i = 0; i < this.projectiles.length; i++) {
      const pr = this.projectiles[i];
      if (!pr.active) continue;
      ctx.fillStyle = pr.color;
      ctx.beginPath();
      ctx.arc(pr.x, pr.y, pr.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawParticles(ctx: CanvasRenderingContext2D): void {
    for (let i = 0; i < this.particles.length; i++) {
      const pt = this.particles[i];
      if (!pt.active) continue;
      ctx.save();
      ctx.globalAlpha = pt.alpha;
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size * (0.4 + pt.alpha * 0.6), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private drawFloatingTexts(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.textAlign = 'center';
    for (let i = 0; i < this.floatingTexts.length; i++) {
      const ft = this.floatingTexts[i];
      if (!ft.active) continue;
      const alpha = Math.min(1, (ft.life / ft.maxLife) * 1.4);
      ctx.globalAlpha = alpha;
      ctx.font = `700 ${Math.round(13 * ft.scale)}px "Plus Jakarta Sans", sans-serif`;
      ctx.fillStyle = '#090d0c';
      ctx.fillText(ft.text, ft.x + 1, ft.y + 1);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.restore();
  }

  private drawDayNightLighting(
    ctx: CanvasRenderingContext2D,
    camLeft: number,
    camTop: number,
    viewW: number,
    viewH: number
  ): void {
    const sky = this.getSkyAtmosphere();
    const t = this.timeOfDay;

    // 1. Continuous 24h Sky & Ambient Color Wash across terrain and entities
    if (sky.tintAlpha > 0.008) {
      ctx.save();
      ctx.fillStyle = `rgba(${sky.tintRgb[0]}, ${sky.tintRgb[1]}, ${sky.tintRgb[2]}, ${sky.tintAlpha.toFixed(3)})`;
      ctx.fillRect(0, 0, viewW, viewH);
      ctx.restore();
    }

    // 2. Directional Sunrise (East -> West) & Sunset (West -> East) Horizon Sky Glow
    if (t >= 0.19 && t <= 0.31) {
      const dawnStrength = Math.sin(((t - 0.19) / 0.12) * Math.PI);
      ctx.save();
      const grad = ctx.createLinearGradient(viewW, viewH * 0.2, 0, viewH * 0.8);
      grad.addColorStop(0, `rgba(251, 146, 108, ${(0.22 * dawnStrength).toFixed(3)})`);
      grad.addColorStop(0.55, `rgba(253, 218, 130, ${(0.1 * dawnStrength).toFixed(3)})`);
      grad.addColorStop(1, `rgba(99, 102, 241, ${(0.09 * dawnStrength).toFixed(3)})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, viewW, viewH);
      ctx.restore();
    } else if (t >= 0.70 && t <= 0.83) {
      const duskStrength = Math.sin(((t - 0.70) / 0.13) * Math.PI);
      ctx.save();
      const grad = ctx.createLinearGradient(0, viewH * 0.18, viewW, viewH * 0.85);
      grad.addColorStop(0, `rgba(249, 115, 62, ${(0.25 * duskStrength).toFixed(3)})`);
      grad.addColorStop(0.52, `rgba(217, 70, 118, ${(0.12 * duskStrength).toFixed(3)})`);
      grad.addColorStop(1, `rgba(49, 46, 129, ${(0.14 * duskStrength).toFixed(3)})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, viewW, viewH);
      ctx.restore();
    }

    if (sky.darkness <= 0.015) return;

    // 3. Night & Twilight Darkness Mask with Dynamic Point-Light Cutouts
    const lw = this.lightCanvas.width;
    const lh = this.lightCanvas.height;
    const lctx = this.lightCtx;
    const scaleX = lw / viewW;
    const scaleY = lh / viewH;

    lctx.globalCompositeOperation = 'source-over';
    lctx.clearRect(0, 0, lw, lh);
    lctx.fillStyle = `rgba(${sky.nightRgb[0]}, ${sky.nightRgb[1]}, ${sky.nightRgb[2]}, ${sky.darkness.toFixed(3)})`;
    lctx.fillRect(0, 0, lw, lh);

    lctx.globalCompositeOperation = 'destination-out';

    const punchLight = (wx: number, wy: number, radiusPx: number, coreStrength = 0.96) => {
      const sx = (wx - camLeft) * scaleX;
      const sy = (wy - camTop) * scaleY;
      const sr = radiusPx * scaleX;
      if (sx < -sr || sx > lw + sr || sy < -sr || sy > lh + sr) return;
      const grad = lctx.createRadialGradient(sx, sy, sr * 0.08, sx, sy, sr);
      grad.addColorStop(0, `rgba(0,0,0,${coreStrength.toFixed(2)})`);
      grad.addColorStop(0.55, `rgba(0,0,0,${(coreStrength * 0.5).toFixed(2)})`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      lctx.fillStyle = grad;
      lctx.beginPath();
      lctx.arc(sx, sy, sr, 0, Math.PI * 2);
      lctx.fill();
    };

    const flicker = Math.sin(this.globalTime * 11.5) * 6 + Math.cos(this.globalTime * 17.3) * 3.5;

    if (this.gameState !== GameState.TITLE) {
      const skillBonuses = computePassiveSkillBonuses(this.unlockedSkills);
      const playerRadius =
        (this.player.microscopeActive ? 245 : 195) +
        skillBonuses.nightVisionBonusPx +
        flicker * 0.4;
      punchLight(this.player.x, this.player.y, playerRadius, 0.94);
      if (this.companion) {
        punchLight(this.companion.x, this.companion.y, 128, 0.85);
      }
    }

    for (const st of this.world.structures) {
      if (st.kind === StructureKind.BIO_LANTERN) {
        punchLight(st.x, st.y, 305 + Math.sin(this.globalTime * 3.2 + st.id) * 8, 0.98);
      } else if (st.kind === StructureKind.CAMPFIRE) {
        punchLight(st.x, st.y, 255 + flicker, 0.98);
      } else {
        punchLight(st.x, st.y, 215, 0.9);
      }
    }

    for (const b of this.world.beacons) {
      punchLight(b.x, b.y, b.activated ? 270 : 125, 0.94);
    }

    // Bioluminescent Vibrio ocean surf & geothermal Thermus colonies glow at night
    for (const col of this.world.microbes) {
      if (col.speciesId === 'vibrio_fischeri' || col.speciesId === 'thermus_aquaticus') {
        punchLight(col.x, col.y, 118, 0.82);
      }
    }

    // Bioluminescent forest Glow Mushrooms illuminate nearby undergrowth
    for (let i = 0; i < this.world.resources.length; i++) {
      const r = this.world.resources[i];
      if (r.respawnTimer <= 0 && r.kind === ResourceKind.GLOW_MUSHROOM) {
        punchLight(r.x, r.y, 92, 0.78);
      }
    }

    // Nocturnal water fireflies create tiny drifting pools of golden light
    for (let i = 0; i < this.world.insects.length; i++) {
      const ins = this.world.insects[i];
      if (ins.speciesId === 'water_firefly') {
        const pulse = 0.65 + Math.sin(this.globalTime * 5.5 + ins.id * 1.3) * 0.35;
        punchLight(ins.x, ins.y, 56 * pulse, 0.72 * pulse);
      }
    }

    ctx.save();
    ctx.drawImage(this.lightCanvas, 0, 0, viewW, viewH);

    // 4. Warm Campfire & Cyan Bio-Lantern Colored Atmospheric Halos
    const haloFactor = Math.min(1, sky.darkness * 1.35);
    for (const st of this.world.structures) {
      const sx = st.x - camLeft;
      const sy = st.y - camTop;
      if (sx < -280 || sx > viewW + 280 || sy < -280 || sy > viewH + 280) continue;
      if (st.kind === StructureKind.CAMPFIRE) {
        const r = 190 + flicker;
        const g = ctx.createRadialGradient(sx, sy, 6, sx, sy, r);
        g.addColorStop(0, `rgba(251, 146, 60, ${(0.24 * haloFactor).toFixed(3)})`);
        g.addColorStop(0.5, `rgba(245, 158, 11, ${(0.1 * haloFactor).toFixed(3)})`);
        g.addColorStop(1, 'rgba(245, 158, 11, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();
      } else if (st.kind === StructureKind.BIO_LANTERN) {
        const r = 230;
        const g = ctx.createRadialGradient(sx, sy, 8, sx, sy, r);
        g.addColorStop(0, `rgba(45, 212, 191, ${(0.2 * haloFactor).toFixed(3)})`);
        g.addColorStop(0.55, `rgba(56, 189, 248, ${(0.08 * haloFactor).toFixed(3)})`);
        g.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 5. Nocturnal Predator Tapetum Lucidum Eye-Shine in the Dark!
    if (sky.darkness > 0.24) {
      const eyeAlpha = Math.min(0.95, (sky.darkness - 0.22) * 1.8);
      for (let i = 0; i < this.world.animals.length; i++) {
        const a = this.world.animals[i];
        if (a.peaceful || a.sleeping) continue;
        const habit = ANIMAL_HABITS[a.kind];
        if (habit !== 'NOCTURNAL' && habit !== 'CREPUSCULAR' && !a.isBoss) continue;

        const sx = a.x - camLeft;
        const sy = a.y - camTop;
        if (sx < -40 || sx > viewW + 40 || sy < -40 || sy > viewH + 40) continue;

        const facingSign = a.vx < -4 ? -1 : 1;
        let eyeColor = '#fde047';
        let eyeYOffset = -11;
        let eyeXOffset = 13 * facingSign;
        if (a.kind === AnimalKind.JUNGLE_JAGUAR) {
          eyeColor = '#a3e635';
          eyeYOffset = -11;
          eyeXOffset = 15 * facingSign;
        } else if (a.kind === AnimalKind.RIVER_CROC) {
          eyeColor = '#fb923c';
          eyeYOffset = -6.5;
          eyeXOffset = 13 * facingSign;
        } else if (a.kind === AnimalKind.EMPEROR_SCORPION) {
          eyeColor = '#38bdf8';
          eyeYOffset = -5;
          eyeXOffset = 8 * facingSign;
        } else if (a.kind === AnimalKind.ANCIENT_TITAN) {
          eyeColor = '#facc15';
          eyeYOffset = -32;
          eyeXOffset = 0;
        }

        ctx.globalAlpha = eyeAlpha * (a.state === EnemyState.CHASE || a.state === EnemyState.WINDUP ? 1 : 0.78);
        ctx.fillStyle = eyeColor;
        ctx.beginPath();
        if (a.kind === AnimalKind.ANCIENT_TITAN) {
          ctx.arc(sx - 9, sy + eyeYOffset, 3.6, 0, Math.PI * 2);
          ctx.arc(sx + 9, sy + eyeYOffset, 3.6, 0, Math.PI * 2);
        } else {
          ctx.arc(sx + eyeXOffset - 2, sy + eyeYOffset, 2.1, 0, Math.PI * 2);
          ctx.arc(sx + eyeXOffset + 2.2, sy + eyeYOffset, 2.1, 0, Math.PI * 2);
        }
        ctx.fill();
      }
    }

    ctx.restore();
  }

  private drawRainSplashes(
    ctx: CanvasRenderingContext2D,
    camLeft: number,
    camTop: number,
    viewW: number,
    viewH: number
  ): void {
    if (this.weatherIntensity <= 0.04) return;
    ctx.save();
    ctx.lineWidth = 1.25;
    for (let i = 0; i < this.rainSplashes.length; i++) {
      const sp = this.rainSplashes[i];
      if (!sp.active) continue;
      if (sp.x < camLeft - 20 || sp.x > camLeft + viewW + 20 || sp.y < camTop - 20 || sp.y > camTop + viewH + 20) {
        continue;
      }
      const prog = 1 - sp.life / sp.maxLife;
      const r = 1.5 + prog * sp.maxRadius;
      ctx.strokeStyle = `rgba(186, 230, 253, ${((1 - prog) * 0.48 * this.weatherIntensity).toFixed(3)})`;
      ctx.beginPath();
      ctx.ellipse(sp.x, sp.y, r, r * 0.56, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawScreenSpaceLensDroplets(ctx: CanvasRenderingContext2D): void {
    for (let i = 0; i < this.lensDroplets.length; i++) {
      const d = this.lensDroplets[i];
      if (!d.active || d.alpha <= 0.01) continue;

      ctx.save();

      // 1. Dribble trickle line behind droplet
      if (d.y > d.trailY + 4) {
        ctx.strokeStyle = `rgba(186, 230, 253, ${(d.alpha * 0.28).toFixed(3)})`;
        ctx.lineWidth = Math.max(1, d.radius * 0.45);
        ctx.beginPath();
        ctx.moveTo(d.x, d.trailY);
        ctx.lineTo(d.x, d.y);
        ctx.stroke();
      }

      // 2. Outer dark refraction rim
      ctx.fillStyle = `rgba(15, 23, 42, ${(d.alpha * 0.45).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.radius + 0.8, 0, Math.PI * 2);
      ctx.fill();

      // 3. Inner translucent water refraction
      const grad = ctx.createRadialGradient(
        d.x - d.radius * 0.2,
        d.y - d.radius * 0.2,
        0.5,
        d.x,
        d.y,
        d.radius
      );
      grad.addColorStop(0, `rgba(224, 242, 254, ${(d.alpha * 0.52).toFixed(3)})`);
      grad.addColorStop(0.7, `rgba(186, 230, 253, ${(d.alpha * 0.35).toFixed(3)})`);
      grad.addColorStop(1, `rgba(125, 211, 252, ${(d.alpha * 0.18).toFixed(3)})`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
      ctx.fill();

      // 4. Crisp specular reflection glint on upper corner
      ctx.fillStyle = `rgba(255, 255, 255, ${(d.alpha * 0.92).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(d.x - d.radius * 0.35, d.y - d.radius * 0.35, Math.max(1, d.radius * 0.28), 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  private drawScreenSpaceFrost(ctx: CanvasRenderingContext2D, viewW: number, viewH: number): void {
    const frostAlpha = Math.min(0.92, this.frostIntensity * 0.95);
    ctx.save();

    // 1. Soft icy radial border vignette
    const minDim = Math.min(viewW, viewH);
    const maxDim = Math.max(viewW, viewH);
    const g = ctx.createRadialGradient(
      viewW * 0.5,
      viewH * 0.5,
      minDim * 0.34,
      viewW * 0.5,
      viewH * 0.5,
      maxDim * 0.72
    );
    g.addColorStop(0, 'rgba(224, 242, 254, 0)');
    g.addColorStop(0.68, `rgba(224, 242, 254, ${(frostAlpha * 0.14).toFixed(3)})`);
    g.addColorStop(0.88, `rgba(186, 230, 253, ${(frostAlpha * 0.36).toFixed(3)})`);
    g.addColorStop(1, `rgba(147, 197, 253, ${(frostAlpha * 0.65).toFixed(3)})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, viewW, viewH);

    // 2. Dendritic crystalline ice branches at the 4 viewport corners
    const drawFrostCorner = (cx: number, cy: number, dirX: number, dirY: number) => {
      const reach = 85 + frostAlpha * 65;
      ctx.strokeStyle = `rgba(248, 250, 252, ${(frostAlpha * 0.75).toFixed(3)})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();

      // Main trunk
      ctx.moveTo(cx, cy);
      const tipX = cx + dirX * reach;
      const tipY = cy + dirY * reach;
      ctx.lineTo(tipX, tipY);

      // Sub-branches
      for (let s = 0.25; s <= 0.85; s += 0.2) {
        const bx = cx + dirX * reach * s;
        const by = cy + dirY * reach * s;
        const branchLen = reach * (1 - s) * 0.55;
        // Left prong
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + dirX * branchLen * 0.6 - dirY * branchLen * 0.55, by + dirY * branchLen * 0.6 + dirX * branchLen * 0.55);
        // Right prong
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + dirX * branchLen * 0.6 + dirY * branchLen * 0.55, by + dirY * branchLen * 0.6 - dirX * branchLen * 0.55);
      }
      ctx.stroke();

      // Icy shimmer star
      const shimmer = 0.6 + Math.sin(this.globalTime * 3.5 + cx) * 0.4;
      ctx.fillStyle = `rgba(255, 255, 255, ${(frostAlpha * shimmer * 0.9).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(tipX, tipY, 2.5, 0, Math.PI * 2);
      ctx.fill();
    };

    drawFrostCorner(0, 0, 1, 1);
    drawFrostCorner(viewW, 0, -1, 1);
    drawFrostCorner(0, viewH, 1, -1);
    drawFrostCorner(viewW, viewH, -1, -1);

    ctx.restore();
  }

  private drawScreenSpaceSandVignette(ctx: CanvasRenderingContext2D, viewW: number, viewH: number): void {
    const sandAlpha = Math.min(0.85, this.sandVignetteIntensity * 0.88);
    ctx.save();

    const minDim = Math.min(viewW, viewH);
    const maxDim = Math.max(viewW, viewH);
    const g = ctx.createRadialGradient(
      viewW * 0.5,
      viewH * 0.5,
      minDim * 0.38,
      viewW * 0.5,
      viewH * 0.5,
      maxDim * 0.72
    );
    g.addColorStop(0, 'rgba(180, 83, 9, 0)');
    g.addColorStop(0.7, `rgba(180, 83, 9, ${(sandAlpha * 0.18).toFixed(3)})`);
    g.addColorStop(0.9, `rgba(146, 64, 14, ${(sandAlpha * 0.38).toFixed(3)})`);
    g.addColorStop(1, `rgba(120, 53, 15, ${(sandAlpha * 0.62).toFixed(3)})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, viewW, viewH);

    ctx.restore();
  }

  private drawWeatherOverlay(
    ctx: CanvasRenderingContext2D,
    camLeft: number,
    camTop: number,
    viewW: number,
    viewH: number
  ): void {
    const wInt = this.weatherIntensity;
    const hasActiveWeather = wInt > 0.02 && this.activeWeather !== WeatherKind.CLEAR;
    const hasScreenEffect =
      this.frostIntensity > 0.02 ||
      this.sandVignetteIntensity > 0.02 ||
      hasActiveWeather;

    if (!hasScreenEffect) return;

    ctx.save();

    // Helper: Draws a player-centered visibility shroud restricting distant sightlines directly!
    const drawPlayerVisibilityCurtain = (
      innerClearPx: number,
      outerFadePx: number,
      midRgb: string,
      midAlpha: number,
      outerRgb: string,
      outerAlpha: number
    ) => {
      const px = this.gameState === GameState.TITLE ? viewW * 0.5 : this.player.x - camLeft;
      const py = this.gameState === GameState.TITLE ? viewH * 0.5 : this.player.y - camTop;

      const skillBonuses = computePassiveSkillBonuses(this.unlockedSkills);
      let bonusClear =
        (this.player.microscopeActive ? 55 : 0) +
        Math.round(skillBonuses.weatherVisibilityBonus * 260);
      if (this.gameState !== GameState.TITLE) {
        for (const st of this.world.structures) {
          const d = Math.hypot(this.player.x - st.x, this.player.y - st.y);
          if (d < 225) {
            bonusClear = Math.max(
              bonusClear,
              (st.kind === StructureKind.BIO_LANTERN ? 115 : 85) +
                Math.round(skillBonuses.weatherVisibilityBonus * 140)
            );
          }
        }
      }

      const rInner = Math.max(85, innerClearPx + bonusClear);
      const rOuter = Math.max(rInner + 140, outerFadePx + bonusClear * 0.8);
      const shroud = ctx.createRadialGradient(px, py, rInner * 0.58, px, py, rOuter);
      shroud.addColorStop(0, `rgba(${midRgb}, 0)`);
      shroud.addColorStop(0.54, `rgba(${midRgb}, ${midAlpha.toFixed(3)})`);
      shroud.addColorStop(1, `rgba(${outerRgb}, ${outerAlpha.toFixed(3)})`);
      ctx.fillStyle = shroud;
      ctx.fillRect(0, 0, viewW, viewH);
    };

    const maxSpan = Math.max(viewW, viewH);

    if (hasActiveWeather) {
      if (this.activeWeather === WeatherKind.RAIN) {
        // Cool overcast monsoon atmospheric wash
        ctx.fillStyle = `rgba(14, 30, 48, ${(0.26 * wInt).toFixed(3)})`;
        ctx.fillRect(0, 0, viewW, viewH);

        // Multi-layer rain streaks
        const activeCount = Math.floor(this.weatherParticles.length * Math.min(1, wInt * 1.15));

        // Layer 0: fine background rain mist
        ctx.strokeStyle = `rgba(148, 163, 184, ${(0.28 * wInt).toFixed(3)})`;
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        for (let i = 0; i < activeCount; i++) {
          const wp = this.weatherParticles[i];
          if (wp.layer !== 0) continue;
          ctx.moveTo(wp.x, wp.y);
          ctx.lineTo(wp.x - wp.length * 0.18, wp.y + wp.length * 0.85);
        }
        ctx.stroke();

        // Layer 1: midground rain streaks
        ctx.strokeStyle = `rgba(186, 230, 253, ${(0.52 * wInt).toFixed(3)})`;
        ctx.lineWidth = 1.35;
        ctx.beginPath();
        for (let i = 0; i < activeCount; i++) {
          const wp = this.weatherParticles[i];
          if (wp.layer !== 1) continue;
          ctx.moveTo(wp.x, wp.y);
          ctx.lineTo(wp.x - wp.length * 0.22, wp.y + wp.length * 1.35);
        }
        ctx.stroke();

        // Layer 2: foreground heavy raindrops close to camera lens
        ctx.strokeStyle = `rgba(224, 242, 254, ${(0.68 * wInt).toFixed(3)})`;
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        for (let i = 0; i < activeCount; i++) {
          const wp = this.weatherParticles[i];
          if (wp.layer !== 2) continue;
          ctx.moveTo(wp.x, wp.y);
          ctx.lineTo(wp.x - wp.length * 0.26, wp.y + wp.length * 1.85);
        }
        ctx.stroke();

        // Misty storm-rain curtain narrowing distant player visibility (lifted briefly during lightning!)
        const flashRelief = 1 - Math.min(0.75, this.lightningFlash * 1.4);
        drawPlayerVisibilityCurtain(
          245 - 55 * wInt,
          maxSpan * 0.68,
          '22, 42, 64',
          0.3 * wInt * flashRelief,
          '15, 31, 49',
          0.64 * wInt * flashRelief
        );

        // Distant lightning illumination flash
        if (this.lightningFlash > 0.01) {
          ctx.fillStyle = `rgba(224, 242, 254, ${(this.lightningFlash * 0.36).toFixed(3)})`;
          ctx.fillRect(0, 0, viewW, viewH);
        }
      } else if (this.activeWeather === WeatherKind.SNOW) {
        // Soft hushed winter snowfall wash + drifting mist wisps
        ctx.fillStyle = `rgba(219, 234, 254, ${(0.15 * wInt).toFixed(3)})`;
        ctx.fillRect(0, 0, viewW, viewH);

        for (let i = 0; i < 6; i++) {
          const fc = this.fogClouds[i];
          const grad = ctx.createRadialGradient(fc.offsetX, fc.offsetY, 18, fc.offsetX, fc.offsetY, fc.radiusX * 0.9);
          grad.addColorStop(0, `rgba(241, 245, 249, ${(0.14 * wInt).toFixed(3)})`);
          grad.addColorStop(1, 'rgba(241, 245, 249, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(fc.offsetX, fc.offsetY, fc.radiusX * 0.9, 0, Math.PI * 2);
          ctx.fill();
        }

        const activeCount = Math.floor(this.weatherParticles.length * Math.min(1, wInt * 0.95));

        // Layer 0: fine background snow powder
        ctx.fillStyle = `rgba(226, 232, 240, ${(0.55 * wInt).toFixed(3)})`;
        for (let i = 0; i < activeCount; i++) {
          const wp = this.weatherParticles[i];
          if (wp.layer !== 0) continue;
          ctx.beginPath();
          ctx.arc(wp.x, wp.y, wp.size * 0.8, 0, Math.PI * 2);
          ctx.fill();
        }

        // Layer 1: midground crystalline snowflake needles
        for (let i = 0; i < activeCount; i++) {
          const wp = this.weatherParticles[i];
          if (wp.layer !== 1) continue;
          const flakeAlpha = (wp.alpha * wInt * 1.15).toFixed(3);
          ctx.fillStyle = `rgba(248, 250, 252, ${flakeAlpha})`;
          const r = wp.size * 1.25;
          ctx.beginPath();
          ctx.arc(wp.x, wp.y, r, 0, Math.PI * 2);
          ctx.fill();

          // Hexagonal crystalline ice cross on rotating axis
          ctx.strokeStyle = `rgba(224, 242, 254, ${flakeAlpha})`;
          ctx.lineWidth = 0.85;
          const cos = Math.cos(wp.rot) * r * 1.8;
          const sin = Math.sin(wp.rot) * r * 1.8;
          ctx.beginPath();
          ctx.moveTo(wp.x - cos, wp.y - sin);
          ctx.lineTo(wp.x + cos, wp.y + sin);
          ctx.moveTo(wp.x + sin, wp.y - cos);
          ctx.lineTo(wp.x - sin, wp.y + cos);
          ctx.stroke();
        }

        // Layer 2: foreground soft bokeh snowflakes drifting right in front of the lens!
        for (let i = 0; i < activeCount; i++) {
          const wp = this.weatherParticles[i];
          if (wp.layer !== 2) continue;
          const bRadius = wp.size * 2.8;
          const bAlpha = wp.alpha * wInt * 0.65;
          const bokehGrad = ctx.createRadialGradient(wp.x, wp.y, bRadius * 0.1, wp.x, wp.y, bRadius);
          bokehGrad.addColorStop(0, `rgba(255, 255, 255, ${(bAlpha * 1.2).toFixed(3)})`);
          bokehGrad.addColorStop(0.5, `rgba(238, 242, 255, ${(bAlpha * 0.6).toFixed(3)})`);
          bokehGrad.addColorStop(1, 'rgba(238, 242, 255, 0)');
          ctx.fillStyle = bokehGrad;
          ctx.beginPath();
          ctx.arc(wp.x, wp.y, bRadius, 0, Math.PI * 2);
          ctx.fill();
        }

        // Winter snowfall haze curtain softening distant sightlines
        drawPlayerVisibilityCurtain(
          235 - 50 * wInt,
          maxSpan * 0.66,
          '214, 228, 242',
          0.32 * wInt,
          '198, 216, 234',
          0.66 * wInt
        );
      } else if (this.activeWeather === WeatherKind.FOG) {
        // Dense rolling mist banks
        for (let i = 0; i < this.fogClouds.length; i++) {
          const fc = this.fogClouds[i];
          const cx = fc.offsetX;
          const cy = fc.offsetY + Math.sin(this.globalTime * 0.45 + fc.phase) * 18;
          const grad = ctx.createRadialGradient(cx, cy, fc.radiusY * 0.15, cx, cy, fc.radiusX);
          const a = fc.alpha * wInt * 1.65;
          grad.addColorStop(0, `rgba(218, 232, 238, ${a.toFixed(3)})`);
          grad.addColorStop(0.6, `rgba(203, 218, 226, ${(a * 0.6).toFixed(3)})`);
          grad.addColorStop(1, 'rgba(203, 218, 226, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.ellipse(cx, cy, fc.radiusX, fc.radiusY, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        // Thick player-centered fog shroud directly restricting distant visibility!
        drawPlayerVisibilityCurtain(
          185 - 45 * wInt,
          maxSpan * 0.56,
          '182, 200, 209',
          0.52 * wInt,
          '154, 175, 186',
          0.86 * wInt
        );
      } else if (this.activeWeather === WeatherKind.BLIZZARD) {
        // Subzero whiteout wash + swirling mist clouds
        ctx.fillStyle = `rgba(226, 238, 250, ${(0.25 * wInt).toFixed(3)})`;
        ctx.fillRect(0, 0, viewW, viewH);

        for (let i = 0; i < 8; i++) {
          const fc = this.fogClouds[i];
          const grad = ctx.createRadialGradient(fc.offsetX, fc.offsetY, 20, fc.offsetX, fc.offsetY, fc.radiusX);
          grad.addColorStop(0, `rgba(241, 245, 249, ${(0.22 * wInt).toFixed(3)})`);
          grad.addColorStop(1, 'rgba(241, 245, 249, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(fc.offsetX, fc.offsetY, fc.radiusX, 0, Math.PI * 2);
          ctx.fill();
        }

        // High-velocity wind-whipped snowflakes & streaks
        const activeCount = Math.floor(this.weatherParticles.length * Math.min(1, wInt * 1.15));
        const stormAngle = Math.atan2(this.windDirY * 0.5 + 0.3, this.windDirX);

        for (let i = 0; i < activeCount; i++) {
          const wp = this.weatherParticles[i];
          const pAlpha = (wp.alpha * wInt * 1.15).toFixed(3);
          if (wp.layer === 2) {
            // Foreground whipping flurry
            ctx.fillStyle = `rgba(255, 255, 255, ${pAlpha})`;
            ctx.beginPath();
            ctx.ellipse(wp.x, wp.y, wp.size * 3.2, wp.size * 1.1, stormAngle, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillStyle = `rgba(248, 250, 252, ${pAlpha})`;
            ctx.beginPath();
            ctx.ellipse(wp.x, wp.y, wp.size * 1.9, wp.size * 0.85, stormAngle, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Whiteout blizzard visibility curtain around player
        drawPlayerVisibilityCurtain(
          190 - 45 * wInt,
          maxSpan * 0.58,
          '212, 230, 246',
          0.48 * wInt,
          '186, 218, 242',
          0.84 * wInt
        );
      } else if (this.activeWeather === WeatherKind.SANDSTORM) {
        // Warm Sahara dust haze
        ctx.fillStyle = `rgba(194, 132, 62, ${(0.26 * wInt).toFixed(3)})`;
        ctx.fillRect(0, 0, viewW, viewH);

        const activeCount = Math.floor(this.weatherParticles.length * Math.min(1, wInt));

        // Layer 0 & 1: Whistling sand ribbons and streaks
        ctx.strokeStyle = `rgba(254, 240, 138, ${(0.45 * wInt).toFixed(3)})`;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        for (let i = 0; i < activeCount; i++) {
          const wp = this.weatherParticles[i];
          if (wp.layer === 2) continue;
          ctx.moveTo(wp.x, wp.y);
          ctx.lineTo(wp.x + this.windDirX * wp.length * 1.4, wp.y + this.windDirY * wp.length * 0.5);
        }
        ctx.stroke();

        // Layer 2: Coarse tumbling sand pebbles / grit particles
        for (let i = 0; i < activeCount; i++) {
          const wp = this.weatherParticles[i];
          if (wp.layer !== 2) continue;
          ctx.fillStyle = `rgba(180, 83, 9, ${(wp.alpha * wInt * 0.85).toFixed(3)})`;
          ctx.beginPath();
          ctx.ellipse(
            wp.x,
            wp.y,
            wp.size * 1.6,
            wp.size * 0.9,
            wp.rot,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }

        // Swirling desert sand wall narrowing distant visibility
        drawPlayerVisibilityCurtain(
          205 - 45 * wInt,
          maxSpan * 0.6,
          '186, 122, 52',
          0.44 * wInt,
          '156, 94, 32',
          0.78 * wInt
        );
      } else if (this.activeWeather === WeatherKind.WINDY) {
        // Crisp monsoon wind ribbons & drifting grass pollen/leaves
        const ribbonCount = 36;
        ctx.strokeStyle = `rgba(226, 248, 214, ${(0.24 * wInt).toFixed(3)})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        for (let i = 0; i < ribbonCount; i++) {
          const wp = this.weatherParticles[i * 4];
          if (!wp) continue;
          const len = wp.length * 2.6;
          ctx.moveTo(wp.x, wp.y);
          ctx.quadraticCurveTo(
            wp.x + this.windDirX * len * 0.5,
            wp.y + this.windDirY * len * 0.5 - 6,
            wp.x + this.windDirX * len,
            wp.y + this.windDirY * len
          );
        }
        ctx.stroke();

        // Drifting leaves / golden pollen specks
        for (let i = 0; i < 40; i++) {
          const wp = this.weatherParticles[i * 3];
          if (!wp) continue;
          ctx.fillStyle = `rgba(234, 179, 8, ${(wp.alpha * wInt * 0.7).toFixed(3)})`;
          ctx.beginPath();
          ctx.ellipse(wp.x, wp.y, wp.size * 1.4, wp.size * 0.7, wp.rot, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // --- Screen-Space Biome & Atmospheric Overlays ---
    // 1. Camera lens condensation and water droplets during rain
    this.drawScreenSpaceLensDroplets(ctx);

    // 2. Subzero corner frost crystalline needles in cold biomes/blizzards
    if (this.frostIntensity > 0.02) {
      this.drawScreenSpaceFrost(ctx, viewW, viewH);
    }

    // 3. Warm amber desert perimeter heat & dust vignette
    if (this.sandVignetteIntensity > 0.02) {
      this.drawScreenSpaceSandVignette(ctx, viewW, viewH);
    }

    ctx.restore();
  }
}

function normalizeAngle(a: number): number {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}
