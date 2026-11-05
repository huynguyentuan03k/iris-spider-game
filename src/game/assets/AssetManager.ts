/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AssetManifest, AssetMetadata, TextureAtlasData } from './assetTypes';
import { DEFAULT_FANTASY_MANIFEST } from './AssetRegistry';
import {
  generateFantasyPropsAtlas,
  generateHeroAtlas,
  generateLayeredTreeAtlas,
} from './proceduralFantasyArt';

export interface LoadedAtlasBundle {
  atlasData: TextureAtlasData;
  image: HTMLImageElement;
  imageUri: string;
}

export interface LoadedImageRecord {
  key: string;
  url: string;
  image: HTMLImageElement;
  width: number;
  height: number;
}

/**
 * Standalone Asset Management System
 * - Independent of Phaser or Canvas 2D engine
 * - Real Image & Atlas Lazy Loading & Caching
 * - Procedural fallback if remote/local files fail
 * - Atlas & Animation Manifest integration
 * - Memory & Cache Metrics
 */
export class AssetManager {
  private static instance: OpenWorldAssetManager | null = null;

  public static getInstance(): OpenWorldAssetManager {
    if (!AssetManager.instance) {
      AssetManager.instance = new OpenWorldAssetManager();
    }
    return AssetManager.instance;
  }
}

export class OpenWorldAssetManager {
  private manifest: AssetManifest = DEFAULT_FANTASY_MANIFEST;
  private metadataMap: Map<string, AssetMetadata> = new Map();
  private atlasCache: Map<string, LoadedAtlasBundle> = new Map();
  private imageCache: Map<string, LoadedImageRecord> = new Map();
  private loadPromises: Map<string, Promise<LoadedAtlasBundle>> = new Map();
  private imagePromises: Map<string, Promise<LoadedImageRecord>> = new Map();

  constructor() {
    this.registerManifest(DEFAULT_FANTASY_MANIFEST);
  }

  /**
   * Registers an asset manifest, mapping all asset definitions by unique ID.
   */
  public registerManifest(manifest: AssetManifest) {
    this.manifest = manifest;
    manifest.assets.forEach((asset) => {
      this.metadataMap.set(asset.id, asset);
    });
  }

  /**
   * Retrieves asset metadata by unique string ID.
   */
  public getAssetMetadata(assetId: string): AssetMetadata | undefined {
    return this.metadataMap.get(assetId);
  }

  /**
   * Lists all registered assets.
   */
  public getAllAssets(): AssetMetadata[] {
    return Array.from(this.metadataMap.values());
  }

  /**
   * Loads a real standalone PNG/WebP image from URL with in-memory caching.
   */
  public async loadRealImage(key: string, url: string): Promise<LoadedImageRecord> {
    const cached = this.imageCache.get(key);
    if (cached) return cached;

    const pending = this.imagePromises.get(key);
    if (pending) return pending;

    const promise = new Promise<LoadedImageRecord>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const record: LoadedImageRecord = {
          key,
          url,
          image: img,
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height,
        };
        this.imageCache.set(key, record);
        this.imagePromises.delete(key);
        resolve(record);
      };
      img.onerror = (err) => {
        this.imagePromises.delete(key);
        reject(new Error(`Failed to load real image: ${key} from ${url} -> ${err}`));
      };
      img.src = url;
    });

    this.imagePromises.set(key, promise);
    return promise;
  }

  /**
   * Loads a Texture Atlas from PNG and JSON URL.
   */
  public async loadJsonAtlas(key: string, pngUrl: string, jsonUrl: string): Promise<LoadedAtlasBundle> {
    const cached = this.atlasCache.get(key);
    if (cached) return cached;

    const res = await fetch(jsonUrl);
    if (!res.ok) throw new Error(`HTTP error loading atlas json: ${res.status}`);
    const atlasData: TextureAtlasData = await res.json();

    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = (e) => reject(new Error(`Failed to load atlas PNG: ${pngUrl} -> ${e}`));
      img.src = pngUrl;
    });

    const bundle: LoadedAtlasBundle = {
      atlasData,
      image: img,
      imageUri: pngUrl,
    };

    this.atlasCache.set(key, bundle);
    return bundle;
  }

  /**
   * Loads or retrieves a cached texture atlas by key (supports real files and procedural fallback).
   */
  public async loadAtlas(atlasKey: string): Promise<LoadedAtlasBundle> {
    const cached = this.atlasCache.get(atlasKey);
    if (cached) {
      return cached;
    }

    const pending = this.loadPromises.get(atlasKey);
    if (pending) {
      return pending;
    }

    const promise = (async () => {
      // 1. Check for real atlas files
      if (atlasKey === 'atlas_outside') {
        try {
          return await this.loadJsonAtlas(
            'atlas_outside',
            '/assets/fantasy/atlases/outside_atlas.png',
            '/assets/fantasy/atlases/outside_atlas.json'
          );
        } catch (e) {
          console.warn('[AssetManager] Failed to load real outside atlas, falling back...', e);
        }
      }

      if (atlasKey === 'atlas_terrain') {
        try {
          return await this.loadJsonAtlas(
            'atlas_terrain',
            '/assets/fantasy/atlases/terrain_atlas.png',
            '/assets/fantasy/atlases/terrain_atlas.json'
          );
        } catch (e) {
          console.warn('[AssetManager] Failed to load real terrain atlas, falling back...', e);
        }
      }

      // 2. Procedural atlas fallback
      let rawBundle: { atlasData: TextureAtlasData; imageUri: string };

      switch (atlasKey) {
        case 'atlas_hero_paladin':
          rawBundle = generateHeroAtlas();
          break;
        case 'atlas_layered_oak':
          rawBundle = generateLayeredTreeAtlas();
          break;
        case 'atlas_fantasy_props':
        default:
          rawBundle = generateFantasyPropsAtlas();
          break;
      }

      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = (e) => reject(new Error(`Failed to load atlas image: ${atlasKey} -> ${e}`));
        img.src = rawBundle.imageUri;
      });

      const bundle: LoadedAtlasBundle = {
        atlasData: rawBundle.atlasData,
        image: img,
        imageUri: rawBundle.imageUri,
      };

      this.atlasCache.set(atlasKey, bundle);
      this.loadPromises.delete(atlasKey);
      return bundle;
    })();

    this.loadPromises.set(atlasKey, promise);
    return promise;
  }

  /**
   * Preheats and caches all core fantasy atlases and primary real assets.
   */
  public async preloadAll(): Promise<void> {
    const atlasKeys = ['atlas_outside', 'atlas_hero_paladin', 'atlas_layered_oak', 'atlas_fantasy_props'];
    await Promise.allSettled(atlasKeys.map((k) => this.loadAtlas(k)));

    // Preload key real images
    const realImages = [
      { key: 'real_deer', url: '/assets/fantasy/animals/fantasy_deer.png' },
      { key: 'real_wolf', url: '/assets/fantasy/animals/forest_wolf.png' },
      { key: 'real_boar', url: '/assets/fantasy/animals/wild_boar.png' },
      { key: 'real_rabbit', url: '/assets/fantasy/animals/forest_rabbit.png' },
      { key: 'real_tree_oak', url: '/assets/fantasy/vegetation/trees/ancient_oak_full.png' },
      { key: 'real_tree_shadow', url: '/assets/fantasy/vegetation/trees/ancient_oak_shadow.png' },
      { key: 'real_tree_trunk', url: '/assets/fantasy/vegetation/trees/ancient_oak_trunk.png' },
      { key: 'real_tree_lower', url: '/assets/fantasy/vegetation/trees/ancient_oak_lower_foliage.png' },
      { key: 'real_tree_canopy', url: '/assets/fantasy/vegetation/trees/ancient_oak_upper_canopy.png' },
    ];

    await Promise.allSettled(realImages.map((img) => this.loadRealImage(img.key, img.url)));
  }

  /**
   * Gets cached atlas bundle synchronously if loaded.
   */
  public getCachedAtlas(atlasKey: string): LoadedAtlasBundle | undefined {
    return this.atlasCache.get(atlasKey);
  }

  /**
   * Gets cached real image synchronously if loaded.
   */
  public getCachedImage(key: string): LoadedImageRecord | undefined {
    return this.imageCache.get(key);
  }

  /**
   * Memory & cache stats
   */
  public getMemoryStats() {
    let estimatedBytes = 0;
    this.atlasCache.forEach((bundle) => {
      const size = bundle.atlasData.meta.size;
      estimatedBytes += size.w * size.h * 4; // 32-bit RGBA
    });
    this.imageCache.forEach((rec) => {
      estimatedBytes += rec.width * rec.height * 4;
    });

    return {
      cachedAtlasesCount: this.atlasCache.size,
      cachedImagesCount: this.imageCache.size,
      registeredAssetsCount: this.metadataMap.size,
      estimatedMemoryMb: (estimatedBytes / (1024 * 1024)).toFixed(2),
    };
  }

  /**
   * Clears cache for disposal
   */
  public dispose() {
    this.atlasCache.clear();
    this.imageCache.clear();
    this.loadPromises.clear();
    this.imagePromises.clear();
  }
}

export const assetManager = AssetManager.getInstance();
