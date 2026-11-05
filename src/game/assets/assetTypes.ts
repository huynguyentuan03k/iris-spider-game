/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum AssetCategory {
  CHARACTER = 'CHARACTER',
  VEGETATION = 'VEGETATION',
  ANIMAL = 'ANIMAL',
  TERRAIN = 'TERRAIN',
  STRUCTURE = 'STRUCTURE',
  TERRAIN_DECOR = 'TERRAIN_DECOR',
  VFX = 'VFX',
  ITEM = 'ITEM',
}

export interface AtlasFrameRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface AtlasFrameDef {
  frame: AtlasFrameRect;
  rotated: boolean;
  trimmed: boolean;
  spriteSourceSize: AtlasFrameRect;
  sourceSize: { w: number; h: number };
  anchor?: { x: number; y: number };
}

export interface TextureAtlasData {
  frames: Record<string, AtlasFrameDef>;
  meta: {
    app: string;
    version: string;
    image: string; // Base64 data URI or relative path
    format: string;
    size: { w: number; h: number };
    scale: string;
  };
}

export interface AnimationDef {
  animId: string;
  frames: string[]; // List of frame keys inside the atlas
  frameRate: number;
  repeat: number; // -1 for infinite loop, 0 for play once
  yoyo?: boolean;
}

export interface CollisionBoxDef {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayeredSpritePart {
  layerId: string;
  frameKey: string;
  depthOffset: number; // Added to base Y for sorting
  canOccludePlayer?: boolean;
  swayWithWind?: boolean;
}

export interface AssetMetadata {
  id: string;
  name: string;
  category: AssetCategory;
  description: string;
  textureAtlasKey: string;
  defaultFrameKey: string;
  imagePath?: string;
  atlasPath?: { png: string; json: string };
  scale: number;
  anchor: { x: number; y: number };
  collisionBox: CollisionBoxDef;
  animations?: Record<string, AnimationDef>;
  layers?: LayeredSpritePart[];
  tags: string[];
}

export interface AssetManifest {
  manifestVersion: string;
  artStyle: string;
  description: string;
  assets: AssetMetadata[];
}
