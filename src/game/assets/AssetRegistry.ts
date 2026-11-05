/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AssetCategory, AssetManifest, AssetMetadata } from './assetTypes';

export const ASSET_PALADIN_HERO: AssetMetadata = {
  id: 'hero_knight_paladin',
  name: 'Hiệp Sĩ Thánh Điện (Paladin Knight)',
  category: AssetCategory.CHARACTER,
  description: 'Nhân vật hiệp sĩ hand-painted phong cách fantasy hoạt họa, áo choàng đỏ, giáp bạc và đại kiếm. Sử dụng bộ sprite HD 192x256 đa chuyển động.',
  textureAtlasKey: 'atlas_hero_paladin',
  defaultFrameKey: 'hero_idle_0',
  imagePath: '/assets/fantasy/characters/hero/hero_idle_0.png',
  scale: 0.5,
  anchor: { x: 0.5, y: 0.88 },
  collisionBox: { x: -16, y: -24, width: 32, height: 28 },
  tags: ['hero', 'character', 'melee', 'playable', 'hd_hand_painted'],
  animations: {
    idle: {
      animId: 'anim_hero_idle',
      frames: ['hero_idle_0'],
      frameRate: 4,
      repeat: -1,
    },
    walk: {
      animId: 'anim_hero_walk',
      frames: ['hero_walk_0', 'hero_walk_1', 'hero_walk_2', 'hero_walk_3'],
      frameRate: 8,
      repeat: -1,
    },
    run: {
      animId: 'anim_hero_run',
      frames: ['hero_run_0', 'hero_run_1', 'hero_run_2'],
      frameRate: 10,
      repeat: -1,
    },
    attack: {
      animId: 'anim_hero_attack',
      frames: ['hero_attack_0', 'hero_attack_1', 'hero_attack_2'],
      frameRate: 12,
      repeat: 0,
    },
    hurt: {
      animId: 'anim_hero_hurt',
      frames: ['hero_hurt_0'],
      frameRate: 6,
      repeat: 0,
    },
    death: {
      animId: 'anim_hero_death',
      frames: ['hero_death_0'],
      frameRate: 4,
      repeat: 0,
    },
    interact: {
      animId: 'anim_hero_interact',
      frames: ['hero_interact_0', 'hero_cheer_0'],
      frameRate: 6,
      repeat: 0,
    },
  },
};

export const ASSET_ANCIENT_OAK: AssetMetadata = {
  id: 'ancient_oak_layered',
  name: 'Cổ Thụ Hoàng Gia Đa Tầng (Royal Ancient Oak)',
  category: AssetCategory.VEGETATION,
  description: 'Cây sồi cổ thụ vẽ tay cao cấp tách thành 4 lớp: bóng đổ mềm, gốc rễ sần sùi, tán lá thấp và vòm tán cao có gió đu đưa cùng hiệu ứng che khuất nhân vật (dynamic occlusion alpha).',
  textureAtlasKey: 'atlas_layered_oak',
  defaultFrameKey: 'ancient_oak_full',
  imagePath: '/assets/fantasy/vegetation/trees/ancient_oak_full.png',
  scale: 1.5,
  anchor: { x: 0.5, y: 0.88 },
  collisionBox: { x: -30, y: -45, width: 60, height: 45 },
  tags: ['tree', 'layered', 'vegetation', 'foliage', 'occlusion', 'hand_painted'],
  layers: [
    {
      layerId: 'shadow',
      frameKey: 'ancient_oak_shadow',
      depthOffset: -60,
      canOccludePlayer: false,
      swayWithWind: false,
    },
    {
      layerId: 'trunk',
      frameKey: 'ancient_oak_trunk',
      depthOffset: 0,
      canOccludePlayer: false,
      swayWithWind: false,
    },
    {
      layerId: 'lower_foliage',
      frameKey: 'ancient_oak_lower_foliage',
      depthOffset: 12,
      canOccludePlayer: true,
      swayWithWind: true,
    },
    {
      layerId: 'upper_canopy',
      frameKey: 'ancient_oak_upper_canopy',
      depthOffset: 24,
      canOccludePlayer: true,
      swayWithWind: true,
    },
  ],
};

export const ASSET_FANTASY_DEER: AssetMetadata = {
  id: 'fauna_fantasy_deer',
  name: 'Hươu Rừng Thần Thoại (Mystic Forest Stag)',
  category: AssetCategory.ANIMAL,
  description: 'Hươu vẽ tay phong cách fantasy cổ điển với gạc hươu thanh thoát, đứng canh gác trong trảng cỏ bìa rừng.',
  textureAtlasKey: 'atlas_outside',
  defaultFrameKey: 'deer.png',
  imagePath: '/assets/fantasy/animals/fantasy_deer.png',
  scale: 1.0,
  anchor: { x: 0.5, y: 0.85 },
  collisionBox: { x: -16, y: -20, width: 32, height: 24 },
  tags: ['animal', 'herbivore', 'tameable', 'wildlife', 'deer'],
};

export const ASSET_FOREST_WOLF: AssetMetadata = {
  id: 'fauna_forest_wolf',
  name: 'Sói Xám Rừng Rậm (Timber Forest Wolf)',
  category: AssetCategory.ANIMAL,
  description: 'Sói săn mồi vẽ tay với dáng vóc săn chắc, mắt sắc bén canh gác lãnh địa ban đêm.',
  textureAtlasKey: 'atlas_outside',
  defaultFrameKey: 'wolf.png',
  imagePath: '/assets/fantasy/animals/forest_wolf.png',
  scale: 1.0,
  anchor: { x: 0.5, y: 0.85 },
  collisionBox: { x: -16, y: -18, width: 32, height: 22 },
  tags: ['animal', 'predator', 'nocturnal', 'tameable', 'wolf'],
};

export const ASSET_WILD_BOAR: AssetMetadata = {
  id: 'fauna_wild_boar',
  name: 'Heo Rừng Nanh Dài (Tusked Wild Boar)',
  category: AssetCategory.ANIMAL,
  description: 'Heo rừng bờm rậm với cặp nanh sắc nhọn và thân hình vạm vỡ, lang thang ủi đất tìm rễ cây.',
  textureAtlasKey: 'atlas_animals',
  defaultFrameKey: 'wild_boar',
  imagePath: '/assets/fantasy/animals/wild_boar.png',
  scale: 1.0,
  anchor: { x: 0.5, y: 0.85 },
  collisionBox: { x: -18, y: -18, width: 36, height: 24 },
  tags: ['animal', 'beast', 'tameable', 'boar'],
};

export const ASSET_FOREST_RABBIT: AssetMetadata = {
  id: 'fauna_forest_rabbit',
  name: 'Thỏ Nâu Tinh Nghịch (Forest Brown Hare)',
  category: AssetCategory.ANIMAL,
  description: 'Thỏ rừng tai dài nhanh nhẹn với đôi mắt to tròn, thường xuất hiện kiếm ăn ban ngày trên đồng cỏ.',
  textureAtlasKey: 'atlas_animals',
  defaultFrameKey: 'forest_rabbit',
  imagePath: '/assets/fantasy/animals/forest_rabbit.png',
  scale: 1.0,
  anchor: { x: 0.5, y: 0.85 },
  collisionBox: { x: -12, y: -12, width: 24, height: 18 },
  tags: ['animal', 'critter', 'peaceful', 'rabbit'],
};

export const ASSET_FANTASY_PINE: AssetMetadata = {
  id: 'fantasy_pine_tree',
  name: 'Thông Rừng Băng Giá (Fantasy Pine)',
  category: AssetCategory.VEGETATION,
  description: 'Cây thông phong cách hoạt họa fantasy nhiều tầng tán xanh mướt sắc nét.',
  textureAtlasKey: 'atlas_props',
  defaultFrameKey: 'fantasy_pine_tall',
  imagePath: '/assets/fantasy/vegetation/trees/fantasy_pine_tall.png',
  scale: 1.2,
  anchor: { x: 0.5, y: 0.9 },
  collisionBox: { x: -20, y: -30, width: 40, height: 30 },
  tags: ['tree', 'pine', 'vegetation'],
};

export const ASSET_FOREST_BUSH: AssetMetadata = {
  id: 'forest_bush_large',
  name: 'Bụi Cây Rừng Rậm (Dense Forest Bush)',
  category: AssetCategory.VEGETATION,
  description: 'Bụi cây xanh mướt vẽ tay đổ bóng tự nhiên, che chắn lối đi.',
  textureAtlasKey: 'atlas_props',
  defaultFrameKey: 'forest_bush_large',
  imagePath: '/assets/fantasy/vegetation/foliage/forest_bush_large.png',
  scale: 1.0,
  anchor: { x: 0.5, y: 0.8 },
  collisionBox: { x: -18, y: -20, width: 36, height: 24 },
  tags: ['bush', 'foliage', 'vegetation'],
};

export const ASSET_MOSS_BOULDER: AssetMetadata = {
  id: 'ground_moss_boulder',
  name: 'Khối Đá Rêu Phong Cổ (Mossy Granite Boulder)',
  category: AssetCategory.TERRAIN_DECOR,
  description: 'Tảng đá hoa cương phủ rêu xanh với bóng đổ tiếp xúc mặt đất.',
  textureAtlasKey: 'atlas_props',
  defaultFrameKey: 'mossy_boulder_large',
  imagePath: '/assets/fantasy/vegetation/decor/mossy_boulder_large.png',
  scale: 1.0,
  anchor: { x: 0.5, y: 0.8 },
  collisionBox: { x: -24, y: -24, width: 48, height: 26 },
  tags: ['stone', 'decor', 'obstacle'],
};

export const ASSET_WILDFLOWERS: AssetMetadata = {
  id: 'ground_wildflowers',
  name: 'Cụm Hoa Rừng Đỏ Thắm (Wild Forest Blossoms)',
  category: AssetCategory.TERRAIN_DECOR,
  description: 'Các đóa hoa dại vẽ tay sinh động tô điểm mặt cỏ thần tiên.',
  textureAtlasKey: 'atlas_props',
  defaultFrameKey: 'wildflower_patch_red',
  imagePath: '/assets/fantasy/vegetation/decor/wildflower_patch_red.png',
  scale: 1.0,
  anchor: { x: 0.5, y: 0.5 },
  collisionBox: { x: 0, y: 0, width: 0, height: 0 },
  tags: ['flower', 'decor', 'passable'],
};

export const ASSET_MUSHROOMS: AssetMetadata = {
  id: 'ground_mushrooms',
  name: 'Cụm Nấm Rừng Đốm Đỏ (Forest Toadstools)',
  category: AssetCategory.TERRAIN_DECOR,
  description: 'Cụm nấm đốm đỏ tươi thắm phát quang nhẹ trong bóng râm cây cổ thụ.',
  textureAtlasKey: 'atlas_props',
  defaultFrameKey: 'forest_mushrooms',
  imagePath: '/assets/fantasy/vegetation/decor/forest_mushrooms.png',
  scale: 1.0,
  anchor: { x: 0.5, y: 0.7 },
  collisionBox: { x: -12, y: -12, width: 24, height: 16 },
  tags: ['mushroom', 'decor', 'forage'],
};

export const ASSET_WATCHTOWER: AssetMetadata = {
  id: 'structure_watchtower',
  name: 'Tháp Canh Đá Hoàng Gia (Royal Stone Watchtower)',
  category: AssetCategory.STRUCTURE,
  description: 'Công trình kiến trúc đá kiên cố phong cách fantasy với ngọn cờ hoàng gia.',
  textureAtlasKey: 'atlas_props',
  defaultFrameKey: 'watchtower_stone',
  imagePath: '/assets/fantasy/structures/watchtower_stone.png',
  scale: 1.1,
  anchor: { x: 0.5, y: 0.9 },
  collisionBox: { x: -25, y: -30, width: 50, height: 40 },
  tags: ['structure', 'tower', 'defense'],
};

export const ASSET_SHRINE: AssetMetadata = {
  id: 'structure_shrine',
  name: 'Đền Thờ Rừng Thiêng (Forest Mystic Shrine)',
  category: AssetCategory.STRUCTURE,
  description: 'Điện thờ cổ kính lưu giữ cổ thuật và năng lượng tự nhiên của khu rừng.',
  textureAtlasKey: 'atlas_props',
  defaultFrameKey: 'fantasy_shrine_temple',
  imagePath: '/assets/fantasy/structures/fantasy_shrine_temple.png',
  scale: 1.1,
  anchor: { x: 0.5, y: 0.88 },
  collisionBox: { x: -28, y: -28, width: 56, height: 36 },
  tags: ['structure', 'shrine', 'magic'],
};

export const DEFAULT_FANTASY_MANIFEST: AssetManifest = {
  manifestVersion: '2.0.0-phase1-real-art',
  artStyle: '2D Hand-Painted Cartoon Fantasy (Kingdom Rush aesthetic quality)',
  description: 'Hệ thống tài nguyên đồ họa thực sự (PNG/WebP & Texture Atlases), hỗ trợ Spritesheet đa frame, Layered Foliage Occlusion, Depth Sorting và Animation State Machine.',
  assets: [
    ASSET_PALADIN_HERO,
    ASSET_ANCIENT_OAK,
    ASSET_FANTASY_DEER,
    ASSET_FOREST_WOLF,
    ASSET_WILD_BOAR,
    ASSET_FOREST_RABBIT,
    ASSET_FANTASY_PINE,
    ASSET_FOREST_BUSH,
    ASSET_MOSS_BOULDER,
    ASSET_WILDFLOWERS,
    ASSET_MUSHROOMS,
    ASSET_WATCHTOWER,
    ASSET_SHRINE,
  ],
};
