import {
  BiomeRegion,
  OrganismGroup,
  SPECIES_CATALOG,
  WORLD_LOCATIONS,
} from './biodiversity';
import {
  AmbientInsect,
  AnimalEntity,
  AnimalKind,
  EnemyState,
  EnvironmentalHazardNode,
  HazardKind,
  MicrobialColony,
  NpcEntity,
  PlacedStructure,
  ResearchBeacon,
  ResourceId,
  ResourceKind,
  ResourceNode,
  StructureKind,
} from './types';

export const TILE_SIZE = 36;
export const WORLD_TILES_W = 320;
export const WORLD_TILES_H = 180;
export const WORLD_PIXEL_W = WORLD_TILES_W * TILE_SIZE;
export const WORLD_PIXEL_H = WORLD_TILES_H * TILE_SIZE;
export const FOG_CELLS_W = 80; // 4x4 tiles per fog cell
export const FOG_CELLS_H = 45;

// Projection constants matching src/game/biodiversity.ts:
// Longitude [-175..180] (span 355) -> tx [0..320]
// Latitude  [78..-76]   (span 154) -> ty [0..180]
export const EARTH_LON_MIN = -175;
export const EARTH_LON_SPAN = 355;
export const EARTH_LAT_MAX = 78;
export const EARTH_LAT_SPAN = 154;

export function lonLatToTile(lon: number, lat: number): { tx: number; ty: number } {
  const tx = Math.max(2, Math.min(WORLD_TILES_W - 3, Math.round(((lon - EARTH_LON_MIN) / EARTH_LON_SPAN) * WORLD_TILES_W)));
  const ty = Math.max(2, Math.min(WORLD_TILES_H - 3, Math.round(((EARTH_LAT_MAX - lat) / EARTH_LAT_SPAN) * WORLD_TILES_H)));
  return { tx, ty };
}

export function tileToLonLat(tx: number, ty: number): { lon: number; lat: number } {
  const lon = (tx / WORLD_TILES_W) * EARTH_LON_SPAN + EARTH_LON_MIN;
  const lat = EARTH_LAT_MAX - (ty / WORLD_TILES_H) * EARTH_LAT_SPAN;
  return { lon, lat };
}

export function formatCoordLabel(lon: number, lat: number): string {
  const latAbs = Math.abs(Math.round(lat));
  const lonAbs = Math.abs(Math.round(lon));
  const latHem = lat >= 0 ? 'B' : 'N'; // Bắc / Nam
  const lonHem = lon >= 0 ? 'Đ' : 'T'; // Đông / Tây
  return `${latAbs}°${latHem} · ${lonAbs}°${lonHem}`;
}

export interface EarthMapLabel {
  text: string;
  lon: number;
  lat: number;
}

export const EARTH_CONTINENT_LABELS: EarthMapLabel[] = [
  { text: 'Bắc Mỹ', lon: -102, lat: 47 },
  { text: 'Nam Mỹ', lon: -59, lat: -16 },
  { text: 'Châu Âu', lon: 16, lat: 52 },
  { text: 'Châu Phi', lon: 21, lat: 8 },
  { text: 'Châu Á', lon: 92, lat: 46 },
  { text: 'Châu Đại Dương', lon: 134, lat: -25 },
  { text: 'Châu Nam Cực', lon: 15, lat: -71 },
];

export const EARTH_OCEAN_LABELS: EarthMapLabel[] = [
  { text: 'Thái Bình Dương', lon: -142, lat: 6 },
  { text: 'Thái Bình Dương', lon: 162, lat: 14 },
  { text: 'Đại Tây Dương', lon: -33, lat: 22 },
  { text: 'Ấn Độ Dương', lon: 76, lat: -22 },
  { text: 'Bắc Băng Dương', lon: 8, lat: 74 },
  { text: 'Biển Caribe', lon: -75, lat: 15 },
  { text: 'Biển Địa Trung Hải', lon: 18, lat: 35 },
];

export interface GeneratedWorld {
  seed: number;
  tiles: BiomeRegion[];
  decorSeed: Uint8Array;
  fog: Uint8Array;
  resources: ResourceNode[];
  microbes: MicrobialColony[];
  insects: AmbientInsect[];
  beacons: ResearchBeacon[];
  npcs: NpcEntity[];
  structures: PlacedStructure[];
  animals: AnimalEntity[];
  hazards: EnvironmentalHazardNode[];
  altarX: number;
  altarY: number;
  spawnX: number;
  spawnY: number;
}

export function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash2D(ix: number, iy: number, seed: number): number {
  let h = ix * 374761393 + iy * 668265263 + seed * 1442695041;
  h = (h ^ (h >> 13)) * 1274126177;
  return ((h ^ (h >> 16)) >>> 0) / 4294967296;
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

function valueNoise(x: number, y: number, seed: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = smoothstep(x - ix);
  const fy = smoothstep(y - iy);

  const v00 = hash2D(ix, iy, seed);
  const v10 = hash2D(ix + 1, iy, seed);
  const v01 = hash2D(ix, iy + 1, seed);
  const v11 = hash2D(ix + 1, iy + 1, seed);

  const nx0 = v00 + (v10 - v00) * fx;
  const nx1 = v01 + (v11 - v01) * fx;
  return nx0 + (nx1 - nx0) * fy;
}

function fbm(x: number, y: number, seed: number, octaves: number = 3): number {
  let value = 0;
  let amp = 0.5;
  let freq = 1;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    value += amp * valueNoise(x * freq, y * freq, seed + i * 97);
    norm += amp;
    amp *= 0.5;
    freq *= 2.02;
  }
  return value / norm;
}

type LonLat = [number, number];

// Authentic Planet Earth Landmass Polygons in (lon, lat) degrees
const EARTH_LAND_POLYGONS: LonLat[][] = [
  // 1. North & Central America
  [
    [-167, 64], [-158, 70], [-136, 69], [-112, 70], [-92, 68], [-80, 63],
    [-90, 56], [-78, 59], [-66, 58], [-55, 50], [-65, 45], [-70, 42],
    [-76, 36], [-81, 30], [-81, 25], [-83, 29], [-90, 29], [-97, 26],
    [-96, 19], [-90, 21], [-87, 21], [-88, 16], [-83, 14], [-83, 10],
    [-78, 8], [-80, 8], [-85, 11], [-92, 15], [-104, 19], [-109, 24],
    [-114, 30], [-117, 33], [-122, 38], [-124, 48], [-134, 56], [-148, 60],
    [-162, 58], [-166, 61],
  ],
  // Baja California peninsula
  [
    [-116, 32], [-113, 30], [-109, 23], [-112, 24], [-115, 29],
  ],
  // Canadian Arctic Archipelago (Baffin & Victoria)
  [
    [-116, 73], [-96, 74], [-95, 69], [-115, 69],
  ],
  [
    [-85, 73], [-64, 70], [-63, 64], [-76, 65],
  ],
  // Cuba & Caribbean Greater Antilles
  [
    [-84, 22.5], [-75, 20.5], [-74, 19.5], [-83, 21.5],
  ],
  [
    [-73, 19.8], [-68.5, 18.5], [-72, 18], [-74, 18.8],
  ],

  // 2. South America
  [
    [-79, 9], [-75, 11], [-68, 11.5], [-60, 8.5], [-50, 1.5], [-35, -6],
    [-38, -14], [-40, -21], [-48, -26], [-53, -33], [-58, -38], [-64, -42],
    [-67, -50], [-68, -55], [-73, -53], [-74, -44], [-72, -34], [-70.5, -22],
    [-76, -14], [-81, -5], [-79.5, 1.5], [-78, 7],
  ],

  // 3. Greenland & Iceland
  [
    [-53, 60], [-43, 60], [-24, 69], [-18, 76], [-42, 77.5], [-61, 75],
    [-56, 68],
  ],
  [
    [-24, 63.5], [-14, 64], [-13.5, 66.5], [-23, 66.2],
  ],

  // 4. Great Britain & Ireland
  [
    [-6, 50.2], [1.6, 51.2], [-0.5, 54.5], [-2.5, 58.5], [-5.5, 58], [-5, 54],
    [-5.5, 51.5],
  ],
  [
    [-10.2, 51.8], [-6.2, 52.2], [-6, 55], [-9.8, 54.5],
  ],

  // 5. Continental Europe & Scandinavia
  [
    [-9.2, 37], [-9.2, 43], [-2, 43.5], [-4.5, 48], [2, 51], [8.5, 54],
    [10.5, 57.5], [12, 55.5], [14, 54], [20, 55], [24, 59], [28, 60],
    [21, 64], [24, 66], [19, 60], [18, 56], [12, 57], [10, 59], [5, 59],
    [5, 62], [14, 68], [26, 71], [32, 69.5], [42, 67], [58, 69], [60, 54],
    [50, 47], [42, 44], [38, 45], [32, 46], [28.5, 41.5], [26, 40.5],
    [23.5, 38], [22, 37], [20, 39.5], [19, 42.5], [13.8, 45.5], [12.5, 44],
    [16.5, 41], [18, 40], [15.8, 38], [13, 41.5], [10, 44], [6, 43.2],
    [3, 42.5], [-0.5, 38.5], [-5.4, 36.1],
  ],

  // 6. Africa & Madagascar
  [
    [-5.8, 35.8], [3, 36.8], [10.5, 37], [11.5, 33.5], [20, 32.5], [25, 31.5],
    [32.5, 31.2], [34.5, 28], [37, 22], [40, 15], [43.5, 11.8], [51, 11.8],
    [49, 5], [41.5, -1.5], [40.2, -10.5], [35.5, -19], [32.8, -26], [28, -33],
    [20, -34.8], [17.8, -29], [14, -22], [12.2, -13], [12, -6], [9.5, 3.8],
    [3, 6.4], [-4, 5], [-8, 4.8], [-13.5, 9.5], [-17.2, 14.8], [-16.5, 21],
    [-13, 27.5], [-9.5, 31.5],
  ],
  // Madagascar
  [
    [44, -16], [49.5, -12.5], [50.2, -16], [47, -25.2], [43.8, -24.5],
  ],

  // 7. Mainland Asia (Anatolia, Arabia, India, Himalayas, Indochina/Vietnam, China, Korea, Siberia)
  [
    [26.5, 40], [35, 42], [41.5, 41.5], [48, 46], [58, 55], [58, 69],
    [74, 72.5], [104, 76], [138, 74], [172, 69], [179, 65], [164, 60],
    [162, 54], [157, 51], [156, 58], [142, 59], [140, 52], [135, 44],
    [130, 42], [129, 35.2], [126.5, 34.8], [126, 38], [124, 39.8], [121.5, 39],
    [118, 38.5], [122, 37], [120.5, 34], [121.8, 30.5], [119.5, 25.5],
    [114, 22.2], [109.5, 21.5], [106.8, 20.8], [105.8, 18.5], [108.5, 15.8],
    [109.2, 12.2], [105, 8.8], [103, 11.5], [100.8, 13.4], [99.5, 8.5],
    [103.8, 1.5], [101.2, 3], [98.5, 8], [97.5, 16], [94, 16.2], [92, 21.5],
    [88.5, 22], [85, 19.5], [80.2, 13], [77.5, 8.2], [75, 12.5], [72.8, 19],
    [69, 22.5], [67, 25], [57, 25.8], [56, 26.8], [50, 29.8], [48, 29.5],
    [51, 25], [55.5, 24.5], [59.5, 22.5], [54, 17], [44, 12.8], [42.5, 16],
    [39, 21.5], [35, 28.5], [32.5, 30.5], [35.5, 33], [36, 36.5], [32, 36.5],
    [27, 37],
  ],
  // Sri Lanka & Taiwan & Hainan
  [
    [79.8, 6], [81.8, 6.2], [81.2, 9.6], [79.8, 9],
  ],
  [
    [120.1, 22], [121.9, 22.5], [121.8, 25.2], [120.3, 24.5],
  ],
  [
    [108.8, 18.2], [110.8, 18.5], [110.8, 20], [109, 19.8],
  ],
  // Japan (Kyushu, Honshu, Hokkaido)
  [
    [130, 31.2], [132, 33], [136, 34.5], [140, 35.5], [141.5, 40.5],
    [140, 41], [137, 37], [131, 34],
  ],
  [
    [140.2, 42], [145.2, 43.2], [144.5, 45.2], [141.2, 44.5],
  ],
  // Sakhalin
  [
    [142, 46.5], [143.5, 47], [143, 53.5], [141.8, 53],
  ],

  // 8. Southeast Asian Maritime Archipelago (Philippines, Sumatra, Java, Borneo, Sulawesi, New Guinea)
  [
    [120, 14], [122.5, 18.2], [124, 13], [126.2, 7.5], [122, 6.5], [120.5, 10.5],
  ],
  [
    [95.5, 5.5], [99.5, 2.5], [105.8, -5.5], [104, -6], [99, -1.2],
  ],
  [
    [106, -6.2], [114.5, -7.5], [124.5, -9.2], [124, -10.3], [114, -8.8], [106, -7.5],
  ],
  [
    [109, 1.5], [115, 6.2], [118.5, 4.5], [117.5, -3.5], [111, -3.5],
  ],
  [
    [119, -1], [124.5, 1.2], [122.5, -5.2], [119.2, -5.2],
  ],
  [
    [131.5, -1.5], [141, -2.8], [150, -9.5], [146, -9.8], [136, -5.2],
  ],

  // 9. Australia, Tasmania & New Zealand
  [
    [114, -22], [122, -17.5], [130.5, -12], [136.5, -12.2], [139.5, -17],
    [142.5, -11], [146, -18.5], [150, -23], [153.2, -27.5], [150, -37.2],
    [146, -38.8], [140, -37.8], [136, -34.8], [131, -31.8], [123, -33.8],
    [115.2, -34.2], [113.8, -26],
  ],
  [
    [145, -40.8], [148.2, -41], [148, -43.5], [145.2, -43],
  ],
  [
    [173, -35], [178, -38], [175, -41.2], [171, -44], [167, -46.2],
    [169.5, -43], [173.8, -39.5],
  ],

  // 10. Antarctica
  [
    [-175, -76], [180, -76], [180, -68], [155, -67.5], [120, -67],
    [75, -68.5], [35, -69], [-12, -70.5], [-56, -72], [-61, -63.5],
    [-66, -66.5], [-95, -71.5], [-135, -72.5], [-175, -71],
  ],

  // 11. Oceanic Islands & Archipelagoes
  // Hawaiian Archipelago (Oahu, Maui, Hawaii Big Island)
  [
    [-158.2, 21.6], [-157.6, 21.2], [-158, 21], [-158.3, 21.4],
  ],
  [
    [-156.4, 20.9], [-155.1, 20], [-154.8, 19], [-155.8, 18.9], [-156.1, 20.2],
  ],
  // Galápagos Archipelago
  [
    [-91.5, -0.8], [-90.8, 0.1], [-90.2, -0.6], [-91, -1.2],
  ],
  // Mediterranean Islands (Sicily, Sardinia, Corsica, Crete, Cyprus)
  [
    [12.4, 38.2], [15.6, 38.3], [15.2, 36.6], [12.5, 37.8],
  ],
  [
    [8.2, 41.3], [9.7, 41.2], [9.8, 38.8], [8.3, 38.9],
  ],
  [
    [8.5, 43], [9.6, 43], [9.4, 41.4], [8.5, 41.5],
  ],
  [
    [23.5, 35.5], [26.3, 35.3], [26.2, 35], [23.6, 35.1],
  ],
  [
    [32.2, 35.2], [34.6, 35.7], [34, 34.8], [32.3, 34.7],
  ],
  // Caribbean Islands (Puerto Rico, Jamaica, Bahamas, Lesser Antilles)
  [
    [-67.2, 18.5], [-65.6, 18.2], [-65.5, 17.9], [-67, 17.9],
  ],
  [
    [-78.2, 18.5], [-76.2, 17.8], [-76.5, 17.6], [-78.1, 17.6],
  ],
  [
    [-78, 26.5], [-76, 24.5], [-75, 23.5], [-77, 25.2],
  ],
  [
    [-61.5, 16], [-61.2, 14.5], [-61.7, 12], [-62, 15.5],
  ],
  // Indian Ocean Islands (Maldives, Seychelles, Socotra, Mauritius)
  [
    [72.8, 7], [73.6, 3], [73.5, 0.5], [72.9, 4],
  ],
  [
    [55.3, -4.5], [55.8, -4.7], [55.5, -4.2],
  ],
  [
    [53.2, 12.6], [54.5, 12.7], [54.4, 12.2],
  ],
  // Arctic Islands (Svalbard, Novaya Zemlya)
  [
    [11, 76.5], [28, 80], [25, 76.8], [12, 76.8],
  ],
  [
    [52, 70.5], [57, 76.8], [69, 77], [56, 71.5],
  ],
  // Pacific Island Arcs (Kuril, Aleutian Arc, Fiji, New Caledonia, Falklands)
  [
    [145.5, 44], [156, 50.8], [155, 50.5], [145, 43.8],
  ],
  [
    [-178, 51.5], [-166, 54], [-165, 53.5], [-179, 51],
  ],
  [
    [177, -16.2], [180, -18], [178, -19],
  ],
  [
    [163.5, -20], [167.5, -22.5], [166.5, -22.8],
  ],
  [
    [-61.2, -51.2], [-57.8, -51.5], [-58, -52.4], [-61, -52.2],
  ],

  // 12. Procedural Archipelagos (Volcanic Coral, Glacial Cryo-Fjord, Bioluminescent Abyss)
  // Volcanic Coral Archipelago (Basalt Atoll Reefs)
  [
    [-142, 19], [-137, 21], [-135, 17], [-140, 15],
  ],
  [
    [-136, 11], [-130, 13], [-132, 8], [-137, 7],
  ],
  [
    [-130, -3], [-124, -2], [-126, -7], [-131, -6],
  ],
  [
    [-146, -11], [-141, -10], [-142, -14], [-147, -13],
  ],
  [
    [-122, 16], [-117, 18], [-118, 13], [-123, 12],
  ],
  // Glacial Cryo-Fjord Archipelago (Iceberg Stepping Stones & Fjord Cliffs)
  [
    [15, 73], [22, 76], [25, 72], [18, 70],
  ],
  [
    [-14, 66], [-8, 68], [-10, 65], [-16, 63],
  ],
  [
    [28, 70], [35, 73], [33, 69], [27, 67],
  ],
  [
    [-27, 68], [-21, 71], [-23, 67], [-29, 65],
  ],
  [
    [3, 63], [9, 66], [8, 62], [2, 60],
  ],
  // Bioluminescent Abyss Archipelago (Mangrove Root Mazes & Deep Tidepools)
  [
    [108, 4], [115, 5], [114, 1], [107, 0],
  ],
  [
    [124, -3], [130, -2], [128, -7], [122, -6],
  ],
  [
    [134, 7], [141, 8], [139, 4], [133, 3],
  ],
  [
    [103, -11], [109, -9], [107, -13], [101, -12],
  ],
  [
    [139, -6], [145, -5], [143, -9], [137, -8],
  ],
];

// Inland Seas / Great Lakes carved inside continents
const EARTH_INLAND_WATER_POLYGONS: { poly: LonLat[]; biome: BiomeRegion }[] = [
  // Caspian Sea
  {
    biome: BiomeRegion.OCEAN,
    poly: [
      [47.5, 46.5], [53.5, 45.5], [54, 37.2], [49, 37], [47.5, 41.5],
    ],
  },
  // North American Great Lakes
  {
    biome: BiomeRegion.RIVER,
    poly: [
      [-91, 47.8], [-82, 46.5], [-77, 43.8], [-83, 41.8], [-88, 42.5],
    ],
  },
  // Lake Victoria (East Africa)
  {
    biome: BiomeRegion.RIVER,
    poly: [
      [31.6, 0.4], [34.6, 0.3], [34.4, -2.8], [31.7, -2.6],
    ],
  },
  // Lake Baikal (Siberia)
  {
    biome: BiomeRegion.RIVER,
    poly: [
      [104.5, 51.5], [109.5, 55.5], [108.2, 55.8], [103.8, 51.8],
    ],
  },
];

// 5 Major World Rivers in (lon, lat) polylines
const EARTH_MAJOR_RIVERS: { points: LonLat[]; halfWidthDeg: number }[] = [
  // Amazon River (Andes -> Atlantic)
  {
    points: [[-75.5, -4.5], [-68, -3.8], [-60, -3.2], [-50.5, -0.5]],
    halfWidthDeg: 1.15,
  },
  // Nile River (Lake Victoria -> Sahara -> Mediterranean Hub)
  {
    points: [[32.8, 0.5], [32, 10], [31.2, 18], [31.2, 30.8]],
    halfWidthDeg: 0.95,
  },
  // Mekong River (Tibetan Plateau -> Vietnam Delta)
  {
    points: [[96, 30], [101, 21], [104.5, 15], [106.2, 10.2]],
    halfWidthDeg: 0.95,
  },
  // Mississippi River (North America)
  {
    points: [[-94, 46], [-91, 39], [-90.5, 33], [-89.5, 29.2]],
    halfWidthDeg: 0.9,
  },
  // Danube River (Alps -> Black Sea)
  {
    points: [[9.5, 48], [17, 47.8], [21, 44.8], [29.2, 45.2]],
    halfWidthDeg: 0.85,
  },
];

// Shallow Coral & Stepping-Stone Reef Corridors so players can wade/explore between all continents!
const EARTH_SHALLOW_CORRIDORS: { points: LonLat[]; halfWidthDeg: number }[] = [
  // North Atlantic Stepping Stones: Scotland -> Iceland -> Greenland -> Baffin/Labrador
  { points: [[-4.5, 58], [-15, 64.5], [-43, 61], [-57, 53]], halfWidthDeg: 1.55 },
  // Bering Strait Shallows
  { points: [[-174, 65], [-166, 65]], halfWidthDeg: 1.6 },
  { points: [[172, 65], [179, 65]], halfWidthDeg: 1.6 },
  // Gibraltar & Sicily Straits (Europe <-> Africa)
  { points: [[-5.6, 36.2], [-5.4, 35.6]], halfWidthDeg: 1.4 },
  { points: [[12.5, 38], [10.8, 36.8]], halfWidthDeg: 1.3 },
  // Southeast Asia <-> Borneo <-> Java/Timor <-> Australia <-> Great Barrier Reef
  { points: [[103.5, 1.8], [105, -5.5], [114, -7.8], [124.5, -9.8], [130.8, -12.2]], halfWidthDeg: 1.6 },
  { points: [[104, 1.5], [110, 1], [116, -2], [115, -7.5]], halfWidthDeg: 1.45 },
  { points: [[142.5, -11], [146.5, -19], [151, -24]], halfWidthDeg: 1.7 },
];

function pointInPolygon(x: number, y: number, poly: LonLat[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0];
    const yi = poly[i][1];
    const xj = poly[j][0];
    const yj = poly[j][1];

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-9) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1e-8) return Math.hypot(px - x1, py - y1);
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function distToPolyline(px: number, py: number, pts: LonLat[]): number {
  let best = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const d = distToSegment(px, py, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
    if (d < best) best = d;
  }
  return best;
}

function classifyContinentInteriorBiome(lon: number, lat: number, n1: number, n2: number): BiomeRegion {
  const wLon = lon + (n1 - 0.5) * 4.5;
  const wLat = lat + (n2 - 0.5) * 3.8;

  // 1. Polar Ice Caps (Antarctica, High Arctic, Greenland Ice Sheet)
  if (wLat <= -64 || wLat >= 69) {
    return BiomeRegion.SNOW_PEAK;
  }
  if (wLon >= -55 && wLon <= -18 && wLat >= 61) {
    return BiomeRegion.SNOW_PEAK;
  }

  // 2. Iconic Earth Mountain Ranges
  // Himalayas, Karakoram & Tibetan Plateau
  const distHimalaya = Math.hypot((wLon - 86) * 0.55, wLat - 31);
  if (distHimalaya < 7.8) {
    return distHimalaya < 4.8 ? BiomeRegion.SNOW_PEAK : BiomeRegion.MOUNTAIN;
  }
  // European Alps & Caucasus
  if (Math.hypot((wLon - 11) * 0.85, wLat - 46.5) < 3.4) {
    return distToSegment(wLon, wLat, 7, 46, 14, 47) < 1.6
      ? BiomeRegion.SNOW_PEAK
      : BiomeRegion.MOUNTAIN;
  }
  if (Math.hypot((wLon - 44) * 0.8, wLat - 42.5) < 3.0) {
    return BiomeRegion.MOUNTAIN;
  }
  // North American Rocky Mountains & Alaska Range
  const distRockies = distToPolyline(wLon, wLat, [
    [-150, 62], [-126, 55], [-113, 45], [-106, 36],
  ]);
  if (distRockies < 4.5) {
    return distRockies < 2.1 && wLat > 42 ? BiomeRegion.SNOW_PEAK : BiomeRegion.MOUNTAIN;
  }
  // South American Andes Cordillera
  const distAndes = distToPolyline(wLon, wLat, [
    [-76, 5], [-77, -10], [-69.5, -22], [-70.5, -36], [-72, -50],
  ]);
  if (distAndes < 3.4) {
    return distAndes < 1.6 ? BiomeRegion.SNOW_PEAK : BiomeRegion.MOUNTAIN;
  }
  // Iceland Geothermal Highlands & Ethiopian Highlands & Urals
  if (wLon >= -25 && wLon <= -12 && wLat >= 63 && wLat <= 67) {
    return BiomeRegion.MOUNTAIN;
  }
  if (Math.hypot(wLon - 39, wLat - 9) < 3.6) {
    return BiomeRegion.MOUNTAIN;
  }
  if (Math.abs(wLon - 59) < 2.2 && wLat >= 52 && wLat <= 66) {
    return BiomeRegion.MOUNTAIN;
  }

  // 3. Great Deserts of Earth
  // Sahara Desert (North Africa)
  if (wLon >= -17 && wLon <= 34.5 && wLat >= 16.5 && wLat <= 31.5) {
    return BiomeRegion.DESERT;
  }
  // Arabian & Iranian Deserts
  if (wLon > 34.5 && wLon <= 62 && wLat >= 12.5 && wLat <= 32.5) {
    return BiomeRegion.DESERT;
  }
  // Gobi & Taklamakan & Kyzylkum (Central/East Asia)
  if (wLon >= 56 && wLon <= 111 && wLat >= 37.5 && wLat <= 46.5) {
    return BiomeRegion.DESERT;
  }
  // Sonoran / Mojave / Chihuahuan Desert (SW North America)
  if (wLon >= -117 && wLon <= -101 && wLat >= 23 && wLat <= 35.5) {
    return BiomeRegion.DESERT;
  }
  // Australian Outback Desert
  if (wLon >= 115 && wLon <= 141 && wLat >= -30.5 && wLat <= -18.5) {
    return BiomeRegion.DESERT;
  }
  // Namib / Kalahari Desert (SW Africa)
  if (wLon >= 12 && wLon <= 23 && wLat >= -29 && wLat <= -18) {
    return BiomeRegion.DESERT;
  }

  // 4. Great Rainforests & Boreal Taiga Forests
  // Amazon Rainforest
  if (wLon >= -77 && wLon <= -46 && wLat >= -14 && wLat <= 7) {
    return BiomeRegion.FOREST;
  }
  // Central American Tropical Jungle
  if (wLon >= -92 && wLon <= -77 && wLat >= 7 && wLat <= 20) {
    return BiomeRegion.FOREST;
  }
  // Congo Basin Rainforest
  if (wLon >= 9 && wLon <= 30 && wLat >= -7 && wLat <= 6) {
    return BiomeRegion.FOREST;
  }
  // Southeast Asia, Vietnam, Southern China, India Western Ghats & Maritime Archipelago
  if (wLon >= 88 && wLon <= 152 && wLat >= -11 && wLat <= 25) {
    return BiomeRegion.FOREST;
  }
  // Boreal Taiga Belt (Canada, Scandinavia, Siberia) & Pacific Northwest
  if (wLat >= 52 && wLat < 69) {
    return BiomeRegion.FOREST;
  }
  if (wLon <= -116 && wLat >= 40 && wLat <= 54) {
    return BiomeRegion.FOREST;
  }

  // 5. Temperate Plains, Steppes & Tropical Savannas (Serengeti, Europe, Great Plains, Pampas, East Australia)
  return BiomeRegion.SAVANNA;
}

export function createAnimalFromKind(
  id: number,
  kind: AnimalKind,
  x: number,
  y: number
): AnimalEntity {
  const base = {
    id,
    kind,
    x,
    y,
    homeX: x,
    homeY: y,
    vx: 0,
    vy: 0,
    state: EnemyState.WANDER,
    stateTimer: 1.4,
    targetX: x,
    targetY: y,
    chargeDirX: 0,
    chargeDirY: 0,
    hitFlash: 0,
    squash: 0,
    animPhase: Math.random() * Math.PI * 2,
  };

  switch (kind) {
    case AnimalKind.SEA_TURTLE:
      return {
        ...base,
        speciesId: 'sea_turtle',
        name: 'Rùa Biển Xanh',
        peaceful: true,
        aquatic: true,
        radius: 16,
        hp: 70,
        maxHp: 70,
        speed: 62,
        damage: 0,
      };
    case AnimalKind.RIVER_OTTER:
      return {
        ...base,
        speciesId: 'river_otter',
        name: 'Rái Cá Sông',
        peaceful: true,
        aquatic: true,
        radius: 13,
        hp: 48,
        maxHp: 48,
        speed: 105,
        damage: 0,
      };
    case AnimalKind.SPOTTED_DEER:
      return {
        ...base,
        speciesId: 'spotted_deer',
        name: 'Hươu Sao Thảo Nguyên',
        peaceful: true,
        radius: 16,
        hp: 55,
        maxHp: 55,
        speed: 118,
        damage: 0,
      };
    case AnimalKind.DESERT_CAMEL:
      return {
        ...base,
        speciesId: 'desert_camel',
        name: 'Lạc Đà Một Bướu',
        peaceful: true,
        radius: 20,
        hp: 95,
        maxHp: 95,
        speed: 74,
        damage: 0,
      };
    case AnimalKind.ALPINE_IBEX:
      return {
        ...base,
        speciesId: 'alpine_ibex',
        name: 'Dê Núi Sừng Cong',
        peaceful: true,
        radius: 16,
        hp: 68,
        maxHp: 68,
        speed: 112,
        damage: 0,
      };
    case AnimalKind.REEF_CRAB:
      return {
        ...base,
        speciesId: 'reef_crab',
        name: 'Cua Đá Rạn San Hô',
        peaceful: false,
        radius: 15,
        hp: 62,
        maxHp: 62,
        speed: 86,
        damage: 11,
      };
    case AnimalKind.RIVER_CROC:
      return {
        ...base,
        speciesId: 'river_croc',
        name: 'Cá Sấu Nước Ngọt',
        peaceful: false,
        aquatic: true,
        radius: 19,
        hp: 105,
        maxHp: 105,
        speed: 98,
        damage: 18,
      };
    case AnimalKind.PRAIRIE_WOLF:
      return {
        ...base,
        speciesId: 'prairie_wolf',
        name: 'Sói Xám Thảo Nguyên',
        peaceful: false,
        radius: 15,
        hp: 65,
        maxHp: 65,
        speed: 116,
        damage: 13,
      };
    case AnimalKind.WILD_BOAR:
      return {
        ...base,
        speciesId: 'wild_boar',
        name: 'Lợn Rừng Nanh Dài',
        peaceful: false,
        radius: 17,
        hp: 88,
        maxHp: 88,
        speed: 108,
        damage: 16,
      };
    case AnimalKind.JUNGLE_JAGUAR:
      return {
        ...base,
        speciesId: 'jungle_jaguar',
        name: 'Báo Đốm Rừng Già',
        peaceful: false,
        radius: 17,
        hp: 112,
        maxHp: 112,
        speed: 132,
        damage: 20,
      };
    case AnimalKind.EMPEROR_SCORPION:
      return {
        ...base,
        speciesId: 'emperor_scorpion',
        name: 'Bọ Cạp Cát Vàng',
        peaceful: false,
        radius: 16,
        hp: 96,
        maxHp: 96,
        speed: 110,
        damage: 18,
      };
    case AnimalKind.MOUNTAIN_BEAR:
      return {
        ...base,
        speciesId: 'mountain_bear',
        name: 'Gấu Xám Đỉnh Núi',
        peaceful: false,
        radius: 23,
        hp: 175,
        maxHp: 175,
        speed: 78,
        damage: 26,
      };
    case AnimalKind.ANCIENT_TITAN:
      return {
        ...base,
        name: 'Cổ Thần Đỉnh Himalaya',
        peaceful: false,
        isBoss: true,
        state: EnemyState.CHASE,
        radius: 36,
        hp: 780,
        maxHp: 780,
        speed: 88,
        damage: 30,
      };
  }
}

export function generateWorld(seedInput?: number): GeneratedWorld {
  const seed = seedInput ?? Math.floor(100000 + Math.random() * 899999);
  const rng = createRng(seed);

  const totalTiles = WORLD_TILES_W * WORLD_TILES_H;
  const tiles = new Array<BiomeRegion>(totalTiles);
  const decorSeed = new Uint8Array(totalTiles);
  const fog = new Uint8Array(FOG_CELLS_W * FOG_CELLS_H);

  // Central Hub at Afro-Eurasian Crossroads (31°E, 30°N — Nile Delta / Sinai / Mediterranean)
  const hubLoc = WORLD_LOCATIONS[0];
  const spawnX = (hubLoc.tx + 0.5) * TILE_SIZE;
  const spawnY = (hubLoc.ty + 0.5) * TILE_SIZE;

  // Himalayan Roof-of-the-World Boss Summit Altar (91°E, 31°N — adjacent to loc_white_alps)
  const altarTile = lonLatToTile(91, 31);
  const altarTx = altarTile.tx;
  const altarTy = altarTile.ty;
  const altarX = (altarTx + 0.5) * TILE_SIZE;
  const altarY = (altarTy + 0.5) * TILE_SIZE;

  // 2. Place Ancient Obelisk Portals across Continents & Archipelagos
  const obeliskListLocations = WORLD_LOCATIONS.filter(
    (loc) => loc.id === 'loc_biosphere_hub' || loc.hasResearchBeacon
  );

  const OBELISK_CONFIGS: Record<
    string,
    {
      name: string;
      cost: Partial<Record<ResourceId, number>>;
      rune: string;
      lore: string;
    }
  > = {
    loc_biosphere_hub: {
      name: 'Cổng Cổ Thần Trung Tâm',
      cost: {},
      rune: '🌟',
      lore: 'Trụ Cổ Thần Khởi Đầu kết nối trục năng lượng sinh quyển toàn cầu.',
    },
    loc_alluvial_delta: {
      name: 'Cổng Cổ Thần Phù Sa Sông Mê Kông',
      cost: { wood: 8, bioSample: 4 },
      rune: '🌾',
      lore: 'Cổng Cổ Thần Châu Thổ bồi đắp phù sa trù phú và nguồn nước ngọt.',
    },
    loc_amazonia_jungle: {
      name: 'Cổng Cổ Thần Mưa Rừng Amazon',
      cost: { wood: 12, bioSample: 5 },
      rune: '🌿',
      lore: 'Cổng Cổ Thần Nam Mỹ ngưng đọng linh khí rừng nhiệt đới bạt ngàn.',
    },
    loc_red_sahara: {
      name: 'Tháp Cổ Thần Cát Vàng Sahara',
      cost: { stone: 12, crystal: 3 },
      rune: '☀️',
      lore: 'Tháp Cổ Thần Sa Mạc Bắc Phi chịu nhiệt và tích tụ bức xạ mặt trời.',
    },
    loc_white_alps: {
      name: 'Đài Cổ Thần Đỉnh Tuyết Himalaya',
      cost: { crystal: 8, bioSample: 4 },
      rune: '❄️',
      lore: 'Đài Cổ Thần Đỉnh Tuyết cô đọng ma trận băng giá và bão tuyết vĩnh cửu.',
    },
    loc_coral_bay: {
      name: 'Cổng Cổ Thần Rạn San Hô Great Barrier',
      cost: { wood: 8, crystal: 4 },
      rune: '🌊',
      lore: 'Cổng Cổ Thần Hải Đảo Úc cộng hưởng sóng biển phát quang Vibrio.',
    },
    loc_fern_valley: {
      name: 'Cổng Cổ Thần Dãy Rocky Bắc Mỹ',
      cost: { wood: 10, iron: 4 },
      rune: '🌲',
      lore: 'Cổng Cổ Thần Rừng Thông dâng trào mạch khoáng đại ngàn Bắc Mỹ.',
    },
    loc_hawaii_volcano: {
      name: 'Đài Cổ Thần Nham Thạch Hawaii',
      cost: { iron: 6, crystal: 4 },
      rune: '🌋',
      lore: 'Đài Cổ Thần Quần Đảo Volcanic Coral dẫn truyền mạch địa nhiệt nham thạch.',
    },
    loc_svalbard_arctic: {
      name: 'Cổng Cổ Thần Băng Sơn Svalbard',
      cost: { stone: 10, crystal: 5 },
      rune: '🧊',
      lore: 'Cổng Cổ Thần Quần Đảo Cryo-Fjord lưu trữ mã gen cực hàn vĩnh cửu.',
    },
    loc_madagascar_isle: {
      name: 'Trụ Cổ Thần Đảo Độc Đáo Madagascar',
      cost: { wood: 10, bioSample: 4 },
      rune: '🌺',
      lore: 'Trụ Cổ Thần Biệt Lập lưu giữ linh hồn rừng cây baobab Ấn Độ Dương.',
    },
  };

  const beacons: ResearchBeacon[] = obeliskListLocations.map((loc, idx) => {
    const cfg = OBELISK_CONFIGS[loc.id] || {
      name: `Cổng Cổ Thần ${loc.name}`,
      cost: { wood: 8, stone: 8 },
      rune: '🔮',
      lore: `Cổng Cổ Thần linh thiêng ngự trị tại ${loc.name}.`,
    };
    return {
      id: idx + 1,
      locationId: loc.id,
      name: cfg.name,
      region: loc.region,
      x: (loc.tx + 0.5) * TILE_SIZE,
      y: (loc.ty + 0.5) * TILE_SIZE,
      activated: loc.id === 'loc_biosphere_hub',
      activationCost: cfg.cost,
      runeSymbol: cfg.rune,
      lore: cfg.lore,
    };
  });

  // Pass 1: Build Planet Earth Landmasses, Oceans, Inland Seas & Rivers
  const isLandMask = new Uint8Array(totalTiles);

  for (let ty = 0; ty < WORLD_TILES_H; ty++) {
    for (let tx = 0; tx < WORLD_TILES_W; tx++) {
      const idx = ty * WORLD_TILES_W + tx;
      decorSeed[idx] = Math.floor(rng() * 255);

      // Keep 2-tile outer ocean rim around world border
      if (tx < 2 || tx >= WORLD_TILES_W - 2 || ty < 2 || ty >= WORLD_TILES_H - 2) {
        tiles[idx] = BiomeRegion.OCEAN;
        continue;
      }

      const { lon, lat } = tileToLonLat(tx + 0.5, ty + 0.5);
      // Organic coastal micro-detail (±1.05 deg) so coastlines look natural while preserving real Earth shapes
      const jitterLon = (fbm(tx * 0.08, ty * 0.08, seed + 31, 3) - 0.5) * 2.1;
      const jitterLat = (fbm(tx * 0.08, ty * 0.08, seed + 173, 3) - 0.5) * 1.9;
      const qLon = lon + jitterLon;
      const qLat = lat + jitterLat;

      let onLand = false;
      for (let p = 0; p < EARTH_LAND_POLYGONS.length; p++) {
        if (pointInPolygon(qLon, qLat, EARTH_LAND_POLYGONS[p])) {
          onLand = true;
          break;
        }
      }

      // Check inland seas / great lakes
      if (onLand) {
        let carvedBiome: BiomeRegion | null = null;
        for (let w = 0; w < EARTH_INLAND_WATER_POLYGONS.length; w++) {
          if (pointInPolygon(qLon, qLat, EARTH_INLAND_WATER_POLYGONS[w].poly)) {
            carvedBiome = EARTH_INLAND_WATER_POLYGONS[w].biome;
            break;
          }
        }
        if (carvedBiome) {
          tiles[idx] = carvedBiome;
          continue;
        }
      }

      if (!onLand) {
        // Check shallow coral / stepping-stone archipelagos for trans-oceanic wading
        let onShallowCorridor = false;
        for (let c = 0; c < EARTH_SHALLOW_CORRIDORS.length; c++) {
          const corr = EARTH_SHALLOW_CORRIDORS[c];
          const d = distToPolyline(qLon, qLat, corr.points);
          if (d < corr.halfWidthDeg) {
            onShallowCorridor = true;
            break;
          }
        }
        tiles[idx] = onShallowCorridor ? BiomeRegion.COAST : BiomeRegion.OCEAN;
        continue;
      }

      isLandMask[idx] = 1;

      // Check 5 Major Earth Rivers (Amazon, Nile, Mekong, Mississippi, Danube)
      let riverBiome: BiomeRegion | null = null;
      for (let r = 0; r < EARTH_MAJOR_RIVERS.length; r++) {
        const rv = EARTH_MAJOR_RIVERS[r];
        const d = distToPolyline(qLon, qLat, rv.points);
        if (d <= rv.halfWidthDeg) {
          riverBiome = BiomeRegion.RIVER;
          break;
        }
        if (d <= rv.halfWidthDeg * 2.25) {
          riverBiome = BiomeRegion.RIVERBANK;
        }
      }

      if (riverBiome) {
        tiles[idx] = riverBiome;
        continue;
      }

      const n1 = fbm(tx * 0.045, ty * 0.045, seed + 521, 3);
      const n2 = fbm(tx * 0.045, ty * 0.045, seed + 887, 3);
      tiles[idx] = classifyContinentInteriorBiome(lon, lat, n1, n2);
    }
  }

  // Pass 2: Natural sandy/rocky beaches (COAST) where non-polar land meets OCEAN
  for (let ty = 2; ty < WORLD_TILES_H - 2; ty++) {
    for (let tx = 2; tx < WORLD_TILES_W - 2; tx++) {
      const idx = ty * WORLD_TILES_W + tx;
      if (isLandMask[idx] === 0) continue;
      const cur = tiles[idx];
      if (cur === BiomeRegion.SNOW_PEAK || cur === BiomeRegion.RIVER || cur === BiomeRegion.RIVERBANK) {
        continue;
      }
      const touchesOcean =
        tiles[idx - 1] === BiomeRegion.OCEAN ||
        tiles[idx + 1] === BiomeRegion.OCEAN ||
        tiles[idx - WORLD_TILES_W] === BiomeRegion.OCEAN ||
        tiles[idx + WORLD_TILES_W] === BiomeRegion.OCEAN;
      if (touchesOcean) {
        tiles[idx] = BiomeRegion.COAST;
      }
    }
  }

  // Pass 3: Guarantee walkable pads around all 12 Earth Landmarks, Hub & Himalayan Altar
  for (const loc of WORLD_LOCATIONS) {
    const padBiome =
      loc.id === 'loc_biosphere_hub'
        ? BiomeRegion.SANCTUARY
        : loc.region === BiomeRegion.OCEAN
        ? BiomeRegion.COAST
        : loc.region === BiomeRegion.RIVER
        ? BiomeRegion.RIVERBANK
        : loc.region;
    const padRadius = loc.id === 'loc_biosphere_hub' ? 5.2 : 3.6;

    for (let dy = -6; dy <= 6; dy++) {
      for (let dx = -6; dx <= 6; dx++) {
        const ntx = loc.tx + dx;
        const nty = loc.ty + dy;
        if (ntx < 2 || ntx >= WORLD_TILES_W - 2 || nty < 2 || nty >= WORLD_TILES_H - 2) continue;
        const d = Math.hypot(dx, dy);
        if (d <= padRadius) {
          tiles[nty * WORLD_TILES_W + ntx] = padBiome;
        } else if (d <= padRadius + 1.6 && tiles[nty * WORLD_TILES_W + ntx] === BiomeRegion.OCEAN) {
          tiles[nty * WORLD_TILES_W + ntx] = BiomeRegion.COAST;
        }
      }
    }
  }

  // Stamp Himalayan Summit Boss Plaza
  for (let dy = -6; dy <= 6; dy++) {
    for (let dx = -6; dx <= 6; dx++) {
      const ntx = altarTx + dx;
      const nty = altarTy + dy;
      if (ntx < 2 || ntx >= WORLD_TILES_W - 2 || nty < 2 || nty >= WORLD_TILES_H - 2) continue;
      const d = Math.hypot(dx, dy);
      if (d <= 4.8) {
        tiles[nty * WORLD_TILES_W + ntx] = BiomeRegion.SANCTUARY;
      } else if (d <= 6.8) {
        tiles[nty * WORLD_TILES_W + ntx] = BiomeRegion.SNOW_PEAK;
      }
    }
  }

  // 3. Place Field Scientists & Geographers at Global Biosphere Hub
  const npcs: NpcEntity[] = [
    {
      id: 'prof_minh',
      name: 'Giáo Sư Sinh Thái Minh',
      role: 'Viện Trưởng Sinh Quyển Địa Cầu',
      x: spawnX - 84,
      y: spawnY - 62,
      lines: [
        'Chào mừng nhà thám hiểm! Bạn đang đứng tại Trạm Sinh Quyển Địa Cầu — giao điểm kết nối Châu Á, Châu Âu và Châu Phi trên bản đồ Trái Đất.',
        'Nhấn phím [M] bất cứ lúc nào để mở Bản Đồ Thế Giới với 6 châu lục, 4 đại dương, các dòng sông Amazon, Nile, Mê Kông, sa mạc Sahara và dãy Himalaya!',
        'Bấm phím [V] để bật Kính Hiển Vi 400x soi Vi Khuẩn, hoặc nhấn [F] gần thú hoang dã để thuần hóa thú cưng đồng hành.',
      ],
    },
    {
      id: 'cartographer_ha',
      name: 'Nhà Địa Lý Hạ Linh',
      role: 'Trưởng Đoàn Bản Đồ Thế Giới',
      x: spawnX + 92,
      y: spawnY - 48,
      lines: [
        'Trên Bản Đồ Trái Đất [phím M], bạn có thể lội qua các rạn san hô nông liên lục địa hoặc bấm chọn bất kỳ địa danh nào trong 12 vùng của thế giới để Dịch Chuyển nhanh!',
        'Kích hoạt ít nhất 3 Trạm Quan Trắc trên các châu lục sẽ mở khóa Đài Cổ Thần trên Đỉnh Tuyết Himalaya!',
      ],
    },
  ];

  // 4. Starter Sanctuary Campfire
  const structures: PlacedStructure[] = [
    {
      id: 1,
      kind: StructureKind.CAMPFIRE,
      x: spawnX,
      y: spawnY - 52,
      hp: 250,
      maxHp: 250,
    },
  ];

  const isClearOfLandmarks = (px: number, py: number, minRadius: number): boolean => {
    if (Math.hypot(px - spawnX, py - spawnY) < minRadius + 125) return false;
    if (Math.hypot(px - altarX, py - altarY) < minRadius + 145) return false;
    for (const b of beacons) {
      if (Math.hypot(px - b.x, py - b.y) < minRadius + 90) return false;
    }
    return true;
  };

  // 5. Populate Region-Authentic Flora & Mineral Resources across Continents & Reefs
  const resources: ResourceNode[] = [];
  let nextResId = 1;

  for (let ty = 4; ty < WORLD_TILES_H - 4; ty += 2) {
    for (let tx = 4; tx < WORLD_TILES_W - 4; tx += 2) {
      const wx = (tx + 0.5 + (rng() - 0.5) * 1.3) * TILE_SIZE;
      const wy = (ty + 0.5 + (rng() - 0.5) * 1.3) * TILE_SIZE;
      const tileX = Math.max(0, Math.min(WORLD_TILES_W - 1, Math.floor(wx / TILE_SIZE)));
      const tileY = Math.max(0, Math.min(WORLD_TILES_H - 1, Math.floor(wy / TILE_SIZE)));
      const biome = tiles[tileY * WORLD_TILES_W + tileX];

      if (biome === BiomeRegion.SANCTUARY) continue;
      if (!isClearOfLandmarks(wx, wy, 24)) continue;

      const roll = rng();
      let kind: ResourceKind | null = null;
      let speciesId: string | undefined;
      let hp = 50;
      let radius = 18;

      if (biome === BiomeRegion.OCEAN) {
        // Nearshore kelp beds within 2 tiles of coast
        let nearCoast = false;
        for (let dy = -2; dy <= 2 && !nearCoast; dy += 2) {
          for (let dx = -2; dx <= 2; dx += 2) {
            const nx = Math.max(0, Math.min(WORLD_TILES_W - 1, tileX + dx));
            const ny = Math.max(0, Math.min(WORLD_TILES_H - 1, tileY + dy));
            if (tiles[ny * WORLD_TILES_W + nx] === BiomeRegion.COAST) {
              nearCoast = true;
              break;
            }
          }
        }
        if (nearCoast && roll < 0.18) {
          kind = ResourceKind.GIANT_KELP;
          speciesId = 'giant_kelp';
          hp = 36;
          radius = 16;
        }
      } else if (biome === BiomeRegion.COAST) {
        if (roll < 0.095) {
          kind = ResourceKind.COCONUT_PALM;
          speciesId = 'palm_coconut';
          hp = 55;
          radius = 19;
        } else if (roll < 0.145) {
          kind = ResourceKind.GIANT_KELP;
          speciesId = 'giant_kelp';
          hp = 34;
          radius = 15;
        } else if (roll < 0.178) {
          kind = ResourceKind.STONE_ROCK;
          hp = 55;
          radius = 18;
        } else if (roll < 0.184) {
          kind = ResourceKind.ANCIENT_CHEST;
          hp = 35;
          radius = 16;
        }
      } else if (biome === BiomeRegion.RIVER) {
        if (roll < 0.13) {
          kind = ResourceKind.SACRED_LOTUS;
          speciesId = 'sacred_lotus';
          hp = 26;
          radius = 14;
        }
      } else if (biome === BiomeRegion.RIVERBANK) {
        if (roll < 0.14) {
          kind = ResourceKind.WEEPING_WILLOW;
          speciesId = 'weeping_willow';
          hp = 58;
          radius = 20;
        } else if (roll < 0.21) {
          kind = ResourceKind.SACRED_LOTUS;
          speciesId = 'sacred_lotus';
          hp = 28;
          radius = 15;
        } else if (roll < 0.245) {
          kind = ResourceKind.STONE_ROCK;
          hp = 55;
          radius = 18;
        }
      } else if (biome === BiomeRegion.SAVANNA) {
        if (roll < 0.09) {
          kind = ResourceKind.ANCIENT_OAK;
          speciesId = 'ancient_oak';
          hp = 52;
          radius = 20;
        } else if (roll < 0.155) {
          kind = ResourceKind.BERRY_BUSH;
          speciesId = 'wild_berry';
          hp = 25;
          radius = 15;
        } else if (roll < 0.19) {
          kind = ResourceKind.STONE_ROCK;
          hp = 55;
          radius = 18;
        } else if (roll < 0.205) {
          kind = ResourceKind.IRON_VEIN;
          hp = 78;
          radius = 19;
        }
      } else if (biome === BiomeRegion.FOREST) {
        if (roll < 0.2) {
          kind = ResourceKind.RAINFOREST_BANYAN;
          speciesId = 'rainforest_banyan';
          hp = 68;
          radius = 22;
        } else if (roll < 0.27) {
          kind = ResourceKind.GLOW_MUSHROOM;
          speciesId = 'glow_mushroom';
          hp = 28;
          radius = 15;
        } else if (roll < 0.31) {
          kind = ResourceKind.BERRY_BUSH;
          speciesId = 'wild_berry';
          hp = 26;
          radius = 15;
        } else if (roll < 0.335) {
          kind = ResourceKind.STONE_ROCK;
          hp = 60;
          radius = 18;
        } else if (roll < 0.342) {
          kind = ResourceKind.ANCIENT_CHEST;
          hp = 38;
          radius = 16;
        }
      } else if (biome === BiomeRegion.DESERT) {
        if (roll < 0.095) {
          kind = ResourceKind.SAGUARO_CACTUS;
          speciesId = 'saguaro_cactus';
          hp = 52;
          radius = 17;
        } else if (roll < 0.15) {
          kind = ResourceKind.STONE_ROCK;
          hp = 65;
          radius = 19;
        } else if (roll < 0.215) {
          kind = ResourceKind.IRON_VEIN;
          hp = 88;
          radius = 20;
        } else if (roll < 0.223) {
          kind = ResourceKind.ANCIENT_CHEST;
          hp = 38;
          radius = 16;
        }
      } else if (biome === BiomeRegion.MOUNTAIN || biome === BiomeRegion.SNOW_PEAK) {
        if (roll < 0.105) {
          kind = ResourceKind.ALPINE_PINE;
          speciesId = 'alpine_pine';
          hp = 66;
          radius = 20;
        } else if (roll < 0.155 && biome === BiomeRegion.SNOW_PEAK) {
          kind = ResourceKind.EDELWEISS_HERB;
          speciesId = 'edelweiss_herb';
          hp = 28;
          radius = 14;
        } else if (roll < 0.21) {
          kind = ResourceKind.IRON_VEIN;
          hp = 95;
          radius = 20;
        } else if (roll < 0.27) {
          kind = ResourceKind.CRYSTAL_CLUSTER;
          hp = 115;
          radius = 20;
        } else if (roll < 0.278) {
          kind = ResourceKind.ANCIENT_CHEST;
          hp = 44;
          radius = 16;
        }
      }

      if (kind) {
        resources.push({
          id: nextResId++,
          kind,
          speciesId,
          x: wx,
          y: wy,
          radius,
          hp,
          maxHp: hp,
          hitFlash: 0,
          squash: 0,
          respawnTimer: 0,
          variant: Math.floor(rng() * 4),
        });
      }
    }
  }

  // 6. Populate Microbial Colonies (Bacteria / Microorganisms native to each biome)
  const microbes: MicrobialColony[] = [];
  const bacteriaSpecies = SPECIES_CATALOG.filter((s) => s.group === OrganismGroup.BACTERIA);
  let nextMicrobeId = 1;

  for (let ty = 6; ty < WORLD_TILES_H - 6; ty += 6) {
    for (let tx = 6; tx < WORLD_TILES_W - 6; tx += 6) {
      if (rng() > 0.54) continue;
      const wx = (tx + (rng() - 0.5) * 3.5) * TILE_SIZE;
      const wy = (ty + (rng() - 0.5) * 3.5) * TILE_SIZE;
      const tileX = Math.max(0, Math.min(WORLD_TILES_W - 1, Math.floor(wx / TILE_SIZE)));
      const tileY = Math.max(0, Math.min(WORLD_TILES_H - 1, Math.floor(wy / TILE_SIZE)));
      const biome = tiles[tileY * WORLD_TILES_W + tileX];

      if (biome === BiomeRegion.OCEAN) {
        // Keep ocean microbes reachable near coasts/islands
        const nearShelf =
          tileX > 3 &&
          tileX < WORLD_TILES_W - 4 &&
          (tiles[tileY * WORLD_TILES_W + tileX - 2] === BiomeRegion.COAST ||
            tiles[tileY * WORLD_TILES_W + tileX + 2] === BiomeRegion.COAST);
        if (!nearShelf) continue;
      }

      const matching = bacteriaSpecies.filter(
        (b) =>
          b.region === biome ||
          (biome === BiomeRegion.COAST && b.region === BiomeRegion.OCEAN)
      );
      if (matching.length === 0) continue;

      const chosen = matching[Math.floor(rng() * matching.length)];
      microbes.push({
        id: nextMicrobeId++,
        speciesId: chosen.id,
        x: wx,
        y: wy,
        radius: 26,
        color: chosen.color,
        secondaryColor: chosen.secondaryColor,
        sampledCooldown: 0,
      });
    }
  }

  // 7. Populate Ambient Living Insects across Biomes
  const insects: AmbientInsect[] = [];
  const insectSpecies = SPECIES_CATALOG.filter((s) => s.group === OrganismGroup.INSECT);
  let nextInsectId = 1;

  for (let ty = 6; ty < WORLD_TILES_H - 6; ty += 5) {
    for (let tx = 6; tx < WORLD_TILES_W - 6; tx += 5) {
      if (rng() > 0.55) continue;
      const wx = (tx + (rng() - 0.5) * 3) * TILE_SIZE;
      const wy = (ty + (rng() - 0.5) * 3) * TILE_SIZE;
      const tileX = Math.max(0, Math.min(WORLD_TILES_W - 1, Math.floor(wx / TILE_SIZE)));
      const tileY = Math.max(0, Math.min(WORLD_TILES_H - 1, Math.floor(wy / TILE_SIZE)));
      const biome = tiles[tileY * WORLD_TILES_W + tileX];
      if (biome === BiomeRegion.OCEAN) continue;

      const matching = insectSpecies.filter(
        (ins) =>
          ins.region === biome ||
          (biome === BiomeRegion.COAST && ins.region === BiomeRegion.OCEAN) ||
          (biome === BiomeRegion.MOUNTAIN && ins.region === BiomeRegion.SNOW_PEAK)
      );
      if (matching.length === 0) continue;

      const chosen = matching[Math.floor(rng() * matching.length)];
      const isBeetleOrAnt =
        chosen.id.includes('beetle') ||
        chosen.id.includes('scarab') ||
        chosen.id.includes('flea');

      insects.push({
        id: nextInsectId++,
        speciesId: chosen.id,
        x: wx,
        y: wy,
        homeX: wx,
        homeY: wy,
        vx: 0,
        vy: 0,
        color: chosen.color,
        secondaryColor: chosen.secondaryColor,
        wingPhase: rng() * Math.PI * 2,
        isFlying: !isBeetleOrAnt,
      });
    }
  }

  // 8. Populate Peaceful & Predator Regional Fauna (Animals) across Continents
  const animals: AnimalEntity[] = [];
  let nextAnimalId = 1;

  for (let ty = 6; ty < WORLD_TILES_H - 6; ty += 5) {
    for (let tx = 6; tx < WORLD_TILES_W - 6; tx += 5) {
      const wx = (tx + (rng() - 0.5) * 3) * TILE_SIZE;
      const wy = (ty + (rng() - 0.5) * 3) * TILE_SIZE;

      if (Math.hypot(wx - spawnX, wy - spawnY) < 340) {
        if (Math.hypot(wx - spawnX, wy - spawnY) > 190 && rng() < 0.35) {
          animals.push(createAnimalFromKind(nextAnimalId++, AnimalKind.SPOTTED_DEER, wx, wy));
        }
        continue;
      }
      if (Math.hypot(wx - altarX, wy - altarY) < 200) continue;

      const tileX = Math.max(0, Math.min(WORLD_TILES_W - 1, Math.floor(wx / TILE_SIZE)));
      const tileY = Math.max(0, Math.min(WORLD_TILES_H - 1, Math.floor(wy / TILE_SIZE)));
      const biome = tiles[tileY * WORLD_TILES_W + tileX];

      const r = rng();
      if (biome === BiomeRegion.OCEAN && r < 0.06) {
        animals.push(createAnimalFromKind(nextAnimalId++, AnimalKind.SEA_TURTLE, wx, wy));
      } else if (biome === BiomeRegion.COAST && r < 0.35) {
        const k = rng() < 0.48 ? AnimalKind.SEA_TURTLE : AnimalKind.REEF_CRAB;
        animals.push(createAnimalFromKind(nextAnimalId++, k, wx, wy));
      } else if ((biome === BiomeRegion.RIVER || biome === BiomeRegion.RIVERBANK) && r < 0.38) {
        const k = rng() < 0.52 ? AnimalKind.RIVER_OTTER : AnimalKind.RIVER_CROC;
        animals.push(createAnimalFromKind(nextAnimalId++, k, wx, wy));
      } else if (biome === BiomeRegion.SAVANNA && r < 0.36) {
        const k = rng() < 0.58 ? AnimalKind.SPOTTED_DEER : AnimalKind.PRAIRIE_WOLF;
        animals.push(createAnimalFromKind(nextAnimalId++, k, wx, wy));
      } else if (biome === BiomeRegion.FOREST && r < 0.38) {
        const k = rng() < 0.55 ? AnimalKind.WILD_BOAR : AnimalKind.JUNGLE_JAGUAR;
        animals.push(createAnimalFromKind(nextAnimalId++, k, wx, wy));
      } else if (biome === BiomeRegion.DESERT && r < 0.36) {
        const k = rng() < 0.46 ? AnimalKind.DESERT_CAMEL : AnimalKind.EMPEROR_SCORPION;
        animals.push(createAnimalFromKind(nextAnimalId++, k, wx, wy));
      } else if ((biome === BiomeRegion.MOUNTAIN || biome === BiomeRegion.SNOW_PEAK) && r < 0.34) {
        const k = rng() < 0.48 ? AnimalKind.ALPINE_IBEX : AnimalKind.MOUNTAIN_BEAR;
        animals.push(createAnimalFromKind(nextAnimalId++, k, wx, wy));
      }
    }
  }

  // 9. Populate Procedural Archipelago Environmental Hazards
  const hazards: EnvironmentalHazardNode[] = [];
  let nextHazardId = 1;

  // 1) Volcanic Coral Archipelago (Polynesian Basalt Atoll Sector)
  const volcanicCenters = [
    { lon: -138, lat: 18, name: 'Miệng Núi Lửa Mauna Basalt', note: 'Phún xuất địa nhiệt nhiệt độ cao. Suy giảm thể lực!' },
    { lon: -133, lat: 10, name: 'Lỗ Thông Phún Xuất Coral Ridge', note: 'Luồng khí nóng từ rãnh biển lửa. Cần cẩn trọng!' },
    { lon: -128, lat: -5, name: 'Bão Nhiệt Nham Thạch Bora-Bora', note: 'Bức xạ nhiệt dâng cao. Mất HP nếu ở lâu!' },
    { lon: -144, lat: -12, name: 'Cột Khói Lưu Huỳnh Atoll', note: 'Khí nóng lưu huỳnh ngột ngạt. Cần giáp chịu nhiệt!' },
    { lon: -120, lat: 15, name: 'Rạn San Hô Lửa Pele', note: 'Bọt khí nhiệt bùng cháy từ thềm lục địa.' },
  ];

  for (const c of volcanicCenters) {
    const { tx, ty } = lonLatToTile(c.lon, c.lat);
    hazards.push({
      id: nextHazardId++,
      kind: HazardKind.VOLCANIC_HEAT_VENT,
      x: tx * TILE_SIZE + TILE_SIZE / 2,
      y: ty * TILE_SIZE + TILE_SIZE / 2,
      radius: 180 + rng() * 60,
      intensity: 0.88 + rng() * 0.25,
      name: c.name,
      hazardNote: c.note,
    });
  }

  // 2) Glacial Cryo-Fjord Archipelago (Arctic Fjord & Iceberg Sector)
  const glacialCenters = [
    { lon: 18, lat: 73, name: 'Vịnh Băng Giá Svalbard Fjord', note: 'Gió cực lạnh cước tay chân, giảm 20% tốc độ!' },
    { lon: -12, lat: 66, name: 'Bão Tuyết Băng Sơn Cryo-Grip', note: 'Mặt băng trượt mất đà và hạ thân nhiệt nguy hiểm!' },
    { lon: 30, lat: 71, name: 'Băng Xương Cảnh Giới Franz Josef', note: 'Sương giá làm đóng đông huyết mạch. Mất HP!' },
    { lon: -25, lat: 67, name: 'Khe Băng Rạn Nứt Greenland Sea', note: 'Gió buốt thấu xương. Cần lửa trại hoặc lều!' },
    { lon: 6, lat: 63, name: 'Vách Đá Băng Trôi Jan Mayen', note: 'Băng tuyết đóng đông mất ma sát di chuyển.' },
  ];

  for (const c of glacialCenters) {
    const { tx, ty } = lonLatToTile(c.lon, c.lat);
    hazards.push({
      id: nextHazardId++,
      kind: HazardKind.GLACIAL_FROSTBITE,
      x: tx * TILE_SIZE + TILE_SIZE / 2,
      y: ty * TILE_SIZE + TILE_SIZE / 2,
      radius: 190 + rng() * 50,
      intensity: 0.9 + rng() * 0.2,
      name: c.name,
      hazardNote: c.note,
    });
  }

  // 3) Bioluminescent Abyss Archipelago (Indo-Pacific Mangrove Sector)
  const sporeCenters = [
    { lon: 111, lat: 3, name: 'Đầm Lầy Bào Tử Vibrio Abyss', note: 'Sương độc mịt mờ, tầm nhìn giảm mạnh & trúng độc!' },
    { lon: 126, lat: -5, name: 'Mê Cung Rễ Cây Rừng Đước Spore-Bog', note: 'Bào tử phát quang độc hại. Trúng độc bào tử!' },
    { lon: 136, lat: 6, name: 'Vùng Hồ Thủy Triều Biển Độc Sunda', note: 'Sương mù bào tử độc tố. Cần Kính Hiển Vi / Đèn Vibrio!' },
    { lon: 105, lat: -10, name: 'Bão Bào Tử Dạ Quang Wallace', note: 'Độc tố đầm lầy lan tỏa. Cần dùng Dược Thảo!' },
    { lon: 141, lat: -7, name: 'Vùng Nước Trầm Tích Bismarck', note: 'Sương độc bào tử che khuất tầm nhìn nghiên cứu.' },
  ];

  for (const c of sporeCenters) {
    const { tx, ty } = lonLatToTile(c.lon, c.lat);
    hazards.push({
      id: nextHazardId++,
      kind: HazardKind.SPORE_TOXIC_BOG,
      x: tx * TILE_SIZE + TILE_SIZE / 2,
      y: ty * TILE_SIZE + TILE_SIZE / 2,
      radius: 175 + rng() * 55,
      intensity: 0.85 + rng() * 0.25,
      name: c.name,
      hazardNote: c.note,
    });
  }

  // 4) Quicksand (Desert)
  const quicksandCenters = [
    { lon: 10, lat: 25, name: 'Cát Lún Sahara', note: 'Cát lún sâu, giảm tốc độ và thể lực!' },
    { lon: -110, lat: 30, name: 'Bẫy Cát Mojave', note: 'Đất cát không ổn định, tiêu hao thể lực nhanh!' },
  ];
  for (const c of quicksandCenters) {
    const { tx, ty } = lonLatToTile(c.lon, c.lat);
    hazards.push({
      id: nextHazardId++,
      kind: HazardKind.QUICKSAND,
      x: tx * TILE_SIZE + TILE_SIZE / 2,
      y: ty * TILE_SIZE + TILE_SIZE / 2,
      radius: 150 + rng() * 50,
      intensity: 0.7 + rng() * 0.2,
      name: c.name,
      hazardNote: c.note,
    });
  }

  // 5) Rockfall (Mountain)
  const rockfallCenters = [
    { lon: 85, lat: 30, name: 'Đá Lở Đỉnh Himalaya', note: 'Đá lở liên tục! Cần mũ cứng hoặc giáp cao cấp!' },
    { lon: -70, lat: -30, name: 'Vách Đá Andes', note: 'Nguy cơ đá rơi từ trên cao!' },
  ];
  for (const c of rockfallCenters) {
    const { tx, ty } = lonLatToTile(c.lon, c.lat);
    hazards.push({
      id: nextHazardId++,
      kind: HazardKind.ROCKFALL,
      x: tx * TILE_SIZE + TILE_SIZE / 2,
      y: ty * TILE_SIZE + TILE_SIZE / 2,
      radius: 120 + rng() * 40,
      intensity: 0.75 + rng() * 0.2,
      name: c.name,
      hazardNote: c.note,
    });
  }

  // 6) Razor Coral (Ocean)
  const razorCoralCenters = [
    { lon: -150, lat: 0, name: 'Rạn San Hô Dao Cạo Thái Bình Dương', note: 'San hô sắc nhọn, gây sát thương khi lội nước!' },
    { lon: 140, lat: -10, name: 'Vành Đai San Hô Úc', note: 'San hô sắc bén bao phủ thềm lục địa!' },
  ];
  for (const c of razorCoralCenters) {
    const { tx, ty } = lonLatToTile(c.lon, c.lat);
    hazards.push({
      id: nextHazardId++,
      kind: HazardKind.RAZOR_CORAL,
      x: tx * TILE_SIZE + TILE_SIZE / 2,
      y: ty * TILE_SIZE + TILE_SIZE / 2,
      radius: 200 + rng() * 60,
      intensity: 0.7 + rng() * 0.25,
      name: c.name,
      hazardNote: c.note,
    });
  }

  revealFogRadius(fog, spawnX, spawnY, 480);

  return {
    seed,
    tiles,
    decorSeed,
    fog,
    resources,
    microbes,
    insects,
    beacons,
    npcs,
    structures,
    animals,
    hazards,
    altarX,
    altarY,
    spawnX,
    spawnY,
  };
}

export function revealFogRadius(fog: Uint8Array, worldX: number, worldY: number, radiusPx: number): boolean {
  const cellW = WORLD_PIXEL_W / FOG_CELLS_W;
  const cellH = WORLD_PIXEL_H / FOG_CELLS_H;
  const cx = Math.floor(worldX / cellW);
  const cy = Math.floor(worldY / cellH);
  const rCellsX = Math.ceil(radiusPx / cellW);
  const rCellsY = Math.ceil(radiusPx / cellH);
  let newlyRevealed = false;

  for (let dy = -rCellsY; dy <= rCellsY; dy++) {
    for (let dx = -rCellsX; dx <= rCellsX; dx++) {
      if ((dx * dx) / (rCellsX * rCellsX + 0.01) + (dy * dy) / (rCellsY * rCellsY + 0.01) > 1) {
        continue;
      }
      const fx = cx + dx;
      const fy = cy + dy;
      if (fx >= 0 && fx < FOG_CELLS_W && fy >= 0 && fy < FOG_CELLS_H) {
        const idx = fy * FOG_CELLS_W + fx;
        if (fog[idx] === 0) {
          fog[idx] = 1;
          newlyRevealed = true;
        }
      }
    }
  }
  return newlyRevealed;
}
