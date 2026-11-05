/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Phaser from 'phaser';
import { assetManager } from '../assets/AssetManager';
import {
  ASSET_ANCIENT_OAK,
  ASSET_FANTASY_DEER,
  ASSET_FANTASY_PINE,
  ASSET_FOREST_BUSH,
  ASSET_FOREST_RABBIT,
  ASSET_FOREST_WOLF,
  ASSET_MOSS_BOULDER,
  ASSET_MUSHROOMS,
  ASSET_PALADIN_HERO,
  ASSET_SHRINE,
  ASSET_WATCHTOWER,
  ASSET_WILDFLOWERS,
  ASSET_WILD_BOAR,
} from '../assets/AssetRegistry';

export interface LabStats {
  fps: number;
  activeSprites: number;
  totalObjects: number;
  currentAnim: string;
  isOccludedByCanopy: boolean;
  qualityLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  playerPos: { x: number; y: number };
  activeCreatures: string[];
}

export class FantasyLabScene extends Phaser.Scene {
  private heroSprite!: Phaser.GameObjects.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
    SPACE: Phaser.Input.Keyboard.Key;
    SHIFT: Phaser.Input.Keyboard.Key;
  };

  private currentAnimState: 'idle' | 'walk' | 'run' | 'attack' | 'hurt' | 'death' = 'idle';
  private isAttacking = false;
  private isDead = false;
  private isHurting = false;

  // Layered Tree references
  private treeCanopySprites: Phaser.GameObjects.Sprite[] = [];
  private treePositions: { x: number; y: number }[] = [];

  // Animals references
  private deerSprite?: Phaser.GameObjects.Sprite;
  private wolfSprite?: Phaser.GameObjects.Sprite;
  private boarSprite?: Phaser.GameObjects.Sprite;
  private rabbitSprite?: Phaser.GameObjects.Sprite;

  // Wind Tweens
  private windTweens: Phaser.Tweens.Tween[] = [];

  // Particle Emitter
  private sporeParticles?: Phaser.GameObjects.Particles.ParticleEmitter;

  // Stats reporting
  public onStatsUpdate?: (stats: LabStats) => void;
  private statsTimer = 0;
  private qualityLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 'HIGH';
  private isOccluded = false;

  constructor() {
    super({ key: 'FantasyLabScene' });
  }

  public preload() {
    // 1. Real Character Hero Animation Frames
    const heroFrames = [
      'hero_idle_0',
      'hero_walk_0',
      'hero_walk_1',
      'hero_walk_2',
      'hero_walk_3',
      'hero_run_0',
      'hero_run_1',
      'hero_run_2',
      'hero_attack_0',
      'hero_attack_1',
      'hero_attack_2',
      'hero_hurt_0',
      'hero_death_0',
      'hero_interact_0',
      'hero_cheer_0',
    ];
    heroFrames.forEach((frame) => {
      this.load.image(frame, `/assets/fantasy/characters/hero/${frame}.png`);
    });

    // 2. Real Layered Ancient Oak Tree Slices
    this.load.image('ancient_oak_full', '/assets/fantasy/vegetation/trees/ancient_oak_full.png');
    this.load.image('ancient_oak_shadow', '/assets/fantasy/vegetation/trees/ancient_oak_shadow.png');
    this.load.image('ancient_oak_trunk', '/assets/fantasy/vegetation/trees/ancient_oak_trunk.png');
    this.load.image('ancient_oak_lower_foliage', '/assets/fantasy/vegetation/trees/ancient_oak_lower_foliage.png');
    this.load.image('ancient_oak_upper_canopy', '/assets/fantasy/vegetation/trees/ancient_oak_upper_canopy.png');

    // 3. Real Pine & Forest Trees
    this.load.image('fantasy_pine_tall', '/assets/fantasy/vegetation/trees/fantasy_pine_tall.png');
    this.load.image('fantasy_pine_medium', '/assets/fantasy/vegetation/trees/fantasy_pine_medium.png');
    this.load.image('forest_oak_small', '/assets/fantasy/vegetation/trees/forest_oak_small.png');

    // 4. Real Animals / Wildlife
    this.load.image('fantasy_deer', '/assets/fantasy/animals/fantasy_deer.png');
    this.load.image('forest_wolf', '/assets/fantasy/animals/forest_wolf.png');
    this.load.image('wild_boar', '/assets/fantasy/animals/wild_boar.png');
    this.load.image('forest_rabbit', '/assets/fantasy/animals/forest_rabbit.png');

    // 5. Real Foliage & Decor
    this.load.image('forest_bush_large', '/assets/fantasy/vegetation/foliage/forest_bush_large.png');
    this.load.image('forest_bush_small', '/assets/fantasy/vegetation/foliage/forest_bush_small.png');
    this.load.image('mossy_boulder_large', '/assets/fantasy/vegetation/decor/mossy_boulder_large.png');
    this.load.image('mossy_boulder_small', '/assets/fantasy/vegetation/decor/mossy_boulder_small.png');
    this.load.image('ancient_tree_stump', '/assets/fantasy/vegetation/decor/ancient_tree_stump.png');
    this.load.image('fallen_moss_log', '/assets/fantasy/vegetation/decor/fallen_moss_log.png');
    this.load.image('wildflower_patch_red', '/assets/fantasy/vegetation/decor/wildflower_patch_red.png');
    this.load.image('wildflower_patch_blue', '/assets/fantasy/vegetation/decor/wildflower_patch_blue.png');
    this.load.image('forest_mushrooms', '/assets/fantasy/vegetation/decor/forest_mushrooms.png');

    // 6. Real Terrain Tiles
    this.load.image('tile_grass_meadow', '/assets/fantasy/terrain/tiles/grass_lush_meadow.png');
    this.load.image('tile_grass_forest', '/assets/fantasy/terrain/tiles/grass_deep_forest.png');
    this.load.image('tile_stone_path', '/assets/fantasy/terrain/tiles/cobblestone_path.png');
    this.load.image('tile_dirt_straight', '/assets/fantasy/terrain/tiles/dirt_path_straight.png');
    this.load.image('tile_dirt_corner', '/assets/fantasy/terrain/tiles/dirt_path_corner.png');
    this.load.image('tile_water_deep', '/assets/fantasy/terrain/tiles/river_water_deep.png');
    this.load.image('tile_riverbank', '/assets/fantasy/terrain/tiles/riverbank_stone_transition.png');

    // 7. Real Fantasy Structures
    this.load.image('watchtower_stone', '/assets/fantasy/structures/watchtower_stone.png');
    this.load.image('fantasy_shrine_temple', '/assets/fantasy/structures/fantasy_shrine_temple.png');

    // 8. Atlases for wildlife & nature
    this.load.atlas('atlas_outside', '/assets/fantasy/atlases/outside_atlas.png', '/assets/fantasy/atlases/outside_atlas.json');
  }

  public async create() {
    // 1. Ensure AssetManager preheats any procedural backups if needed
    await assetManager.preloadAll();

    // 2. Build Hero Animations from real loaded frames
    this.createHeroAnimations();

    // 3. Render Illustrated Fantasy Terrain Surface
    this.renderIllustratedTerrain();

    // 4. Spawn Real Structures
    this.spawnFantasyStructures();

    // 5. Spawn Real Environment Decor & Foliage
    this.spawnEnvironmentDecor();

    // 6. Spawn Multi-Layered Ancient Oak Trees (with shadow, trunk, lower foliage, upper canopy + occlusion)
    this.spawnLayeredOak(380, 240);
    this.spawnLayeredOak(170, 470);
    this.spawnLayeredOak(640, 420);

    // 7. Spawn Real Fantasy Wildlife (Deer, Wolf, Boar, Rabbit)
    this.spawnFantasyWildlife();

    // 8. Spawn Hero Character
    this.heroSprite = this.add.sprite(360, 340, 'hero_idle_0');
    this.heroSprite.setOrigin(0.5, 0.88);
    this.heroSprite.setScale(0.52); // Scale HD 192x256 sprite for 2D top-down perspective
    this.heroSprite.play('anim_hero_idle');

    // 9. Ambient Magic Spores
    this.createAmbientAtmosphere();

    // 10. Setup Keyboard Inputs
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasdKeys = {
        W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        SPACE: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
        SHIFT: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT),
      };

      this.wasdKeys.SPACE.on('down', () => this.triggerAttack());
    }

    this.cameras.main.setBounds(0, 0, 800, 600);
  }

  private createHeroAnimations() {
    // Build animations using the individual real image keys
    if (!this.anims.exists('anim_hero_idle')) {
      this.anims.create({
        key: 'anim_hero_idle',
        frames: [{ key: 'hero_idle_0' }],
        frameRate: 4,
        repeat: -1,
      });
    }

    if (!this.anims.exists('anim_hero_walk')) {
      this.anims.create({
        key: 'anim_hero_walk',
        frames: [
          { key: 'hero_walk_0' },
          { key: 'hero_walk_1' },
          { key: 'hero_walk_2' },
          { key: 'hero_walk_3' },
        ],
        frameRate: 8,
        repeat: -1,
      });
    }

    if (!this.anims.exists('anim_hero_run')) {
      this.anims.create({
        key: 'anim_hero_run',
        frames: [
          { key: 'hero_run_0' },
          { key: 'hero_run_1' },
          { key: 'hero_run_2' },
        ],
        frameRate: 10,
        repeat: -1,
      });
    }

    if (!this.anims.exists('anim_hero_attack')) {
      this.anims.create({
        key: 'anim_hero_attack',
        frames: [
          { key: 'hero_attack_0' },
          { key: 'hero_attack_1' },
          { key: 'hero_attack_2' },
        ],
        frameRate: 12,
        repeat: 0,
      });
    }

    if (!this.anims.exists('anim_hero_hurt')) {
      this.anims.create({
        key: 'anim_hero_hurt',
        frames: [{ key: 'hero_hurt_0' }],
        frameRate: 6,
        repeat: 0,
      });
    }

    if (!this.anims.exists('anim_hero_death')) {
      this.anims.create({
        key: 'anim_hero_death',
        frames: [{ key: 'hero_death_0' }],
        frameRate: 4,
        repeat: 0,
      });
    }
  }

  /**
   * Renders real illustrated fantasy terrain:
   * - Lush meadow grass base tiles
   - Deep forest patches
   - Cobblestone and dirt footpath
   - Winding river water with stone riverbank transition
   */
  private renderIllustratedTerrain() {
    // 1. Base Meadow Grid
    const tileSize = 64;
    for (let y = 0; y < 600; y += tileSize) {
      for (let x = 0; x < 800; x += tileSize) {
        const key = (x + y) % 192 === 0 ? 'tile_grass_forest' : 'tile_grass_meadow';
        const tile = this.add.image(x + tileSize / 2, y + tileSize / 2, key);
        tile.setDisplaySize(tileSize, tileSize);
        tile.setDepth(-1000);
      }
    }

    // 2. Winding Dirt & Cobblestone Path
    for (let py = 0; py < 600; py += 32) {
      const px = 370 + Math.sin(py * 0.012) * 50;
      const pathTile = this.add.image(px, py + 16, 'tile_dirt_straight');
      pathTile.setDisplaySize(48, 48);
      pathTile.setDepth(-950);
      pathTile.setAlpha(0.85);

      // Cobblestones along center
      if (py % 64 === 0) {
        const stoneTile = this.add.image(px, py + 16, 'tile_stone_path');
        stoneTile.setDisplaySize(36, 36);
        stoneTile.setDepth(-940);
        stoneTile.setAlpha(0.7);
      }
    }

    // 3. River Stream on Top-Right Edge
    for (let ry = 0; ry < 220; ry += 32) {
      const rx = 740 - ry * 0.4;
      const bank = this.add.image(rx - 24, ry, 'tile_riverbank');
      bank.setDisplaySize(40, 40);
      bank.setDepth(-930);

      const water = this.add.image(rx + 16, ry, 'tile_water_deep');
      water.setDisplaySize(48, 48);
      water.setDepth(-930);
    }
  }

  /**
   * Spawns real fantasy structures (Watchtower, Mystic Shrine).
   */
  private spawnFantasyStructures() {
    // Royal Watchtower
    const tower = this.add.sprite(80, 160, 'watchtower_stone');
    tower.setOrigin(0.5, 0.9);
    tower.setScale(1.2);
    tower.setDepth(160);

    // Forest Mystic Shrine
    const shrine = this.add.sprite(710, 290, 'fantasy_shrine_temple');
    shrine.setOrigin(0.5, 0.88);
    shrine.setScale(1.15);
    shrine.setDepth(290);

    // Subtle magical glow pulse around shrine
    this.tweens.add({
      targets: shrine,
      alpha: { from: 0.92, to: 1.0 },
      y: 288,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /**
   * Spawns real environment decor:
   * - Tall Pines, Small Oaks, Boulders, Stumps, Mushrooms, Flowers.
   */
  private spawnEnvironmentDecor() {
    // Pines
    const pineCoords = [
      { x: 50, y: 380, scale: 1.3 },
      { x: 740, y: 480, scale: 1.2 },
      { x: 520, y: 130, scale: 1.1 },
    ];
    pineCoords.forEach((pt) => {
      const pine = this.add.sprite(pt.x, pt.y, 'fantasy_pine_tall');
      pine.setOrigin(0.5, 0.92);
      pine.setScale(pt.scale);
      pine.setDepth(pt.y);
    });

    // Small Oaks
    const smallOak = this.add.sprite(280, 150, 'forest_oak_small');
    smallOak.setOrigin(0.5, 0.88);
    smallOak.setDepth(150);

    // Mossy Boulders
    const boulderCoords = [
      { x: 140, y: 220, key: 'mossy_boulder_large', scale: 0.9 },
      { x: 670, y: 170, key: 'mossy_boulder_small', scale: 1.0 },
      { x: 580, y: 530, key: 'mossy_boulder_large', scale: 1.0 },
      { x: 260, y: 560, key: 'mossy_boulder_small', scale: 1.1 },
    ];
    boulderCoords.forEach((pt) => {
      const stone = this.add.sprite(pt.x, pt.y, pt.key);
      stone.setOrigin(0.5, 0.82);
      stone.setScale(pt.scale);
      stone.setDepth(pt.y);
    });

    // Ancient Tree Stump & Fallen Moss Log
    const stump = this.add.sprite(480, 480, 'ancient_tree_stump');
    stump.setOrigin(0.5, 0.85);
    stump.setScale(0.9);
    stump.setDepth(480);

    const log = this.add.sprite(220, 310, 'fallen_moss_log');
    log.setOrigin(0.5, 0.85);
    log.setScale(0.95);
    log.setDepth(310);

    // Wildflower Patches (Red and Blue)
    for (let i = 0; i < 8; i++) {
      const fx = (i * 92 + 55) % 720 + 40;
      const fy = (i * 115 + 45) % 480 + 60;
      const flowerKey = i % 2 === 0 ? 'wildflower_patch_red' : 'wildflower_patch_blue';
      const flower = this.add.sprite(fx, fy, flowerKey);
      flower.setScale(0.8);
      flower.setDepth(fy - 10);
    }

    // Forest Mushrooms Cluster
    const mush1 = this.add.sprite(320, 270, 'forest_mushrooms');
    mush1.setOrigin(0.5, 0.75);
    mush1.setScale(0.9);
    mush1.setDepth(270);

    const mush2 = this.add.sprite(620, 480, 'forest_mushrooms');
    mush2.setOrigin(0.5, 0.75);
    mush2.setScale(0.85);
    mush2.setDepth(480);

    // Forest Bushes
    const bush1 = this.add.sprite(110, 410, 'forest_bush_large');
    bush1.setOrigin(0.5, 0.8);
    bush1.setDepth(410);

    const bush2 = this.add.sprite(560, 360, 'forest_bush_small');
    bush2.setOrigin(0.5, 0.8);
    bush2.setDepth(360);
  }

  /**
   * Spawns multi-layered Ancient Oak Tree fulfilling requirements:
   * - Layer 0: Ground Shadow (soft ambient contact, depth = y - 60)
   * - Layer 1: Trunk & Gnarled Roots (depth = y)
   * - Layer 2: Lower Foliage (depth = y + 12, sways with wind)
   * - Layer 3: Upper Canopy (depth = y + 24, sways with wind, dynamically fades to 42% alpha when player stands behind it)
   */
  private spawnLayeredOak(x: number, y: number) {
    const scale = 1.6;
    this.treePositions.push({ x, y });

    // Layer 0: Soft Ground Shadow
    const shadow = this.add.sprite(x, y - 4, 'ancient_oak_shadow');
    shadow.setOrigin(0.5, 0.5);
    shadow.setDepth(y - 60);
    shadow.setScale(scale);

    // Layer 1: Trunk & Roots
    const trunk = this.add.sprite(x, y, 'ancient_oak_trunk');
    trunk.setOrigin(0.5, 0.88);
    trunk.setDepth(y);
    trunk.setScale(scale);

    // Layer 2: Lower Foliage
    const lower = this.add.sprite(x, y - 48, 'ancient_oak_lower_foliage');
    lower.setOrigin(0.5, 0.65);
    lower.setDepth(y + 12);
    lower.setScale(scale);

    // Layer 3: Upper Canopy
    const upper = this.add.sprite(x, y - 58, 'ancient_oak_upper_canopy');
    upper.setOrigin(0.5, 0.65);
    upper.setDepth(y + 24);
    upper.setScale(scale);
    this.treeCanopySprites.push(upper);

    // Gentle wind sway tween on foliage layers
    const windTween = this.tweens.add({
      targets: [lower, upper],
      angle: { from: -1.6, to: 1.6 },
      duration: 2400 + Math.random() * 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.windTweens.push(windTween);
  }

  /**
   * Spawns real wildlife creatures:
   * - Fantasy Deer
   * - Forest Wolf
   * - Wild Boar
   * - Forest Rabbit
   */
  private spawnFantasyWildlife() {
    // 1. Fantasy Deer
    this.deerSprite = this.add.sprite(480, 220, 'fantasy_deer');
    this.deerSprite.setOrigin(0.5, 0.85);
    this.deerSprite.setDepth(220);
    // Subtle breathing & head-tilt tween
    this.tweens.add({
      targets: this.deerSprite,
      scaleY: { from: 1.0, to: 1.04 },
      y: 219,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 2. Timber Wolf
    this.wolfSprite = this.add.sprite(620, 190, 'forest_wolf');
    this.wolfSprite.setOrigin(0.5, 0.85);
    this.wolfSprite.setDepth(190);
    // Prowling pacing tween
    this.tweens.add({
      targets: this.wolfSprite,
      x: 650,
      duration: 3200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      onYoyo: () => {
        if (this.wolfSprite) this.wolfSprite.setFlipX(true);
      },
      onRepeat: () => {
        if (this.wolfSprite) this.wolfSprite.setFlipX(false);
      },
    });

    // 3. Wild Boar
    this.boarSprite = this.add.sprite(260, 440, 'wild_boar');
    this.boarSprite.setOrigin(0.5, 0.85);
    this.boarSprite.setDepth(440);
    // Rooting in ground animation
    this.tweens.add({
      targets: this.boarSprite,
      angle: { from: -2, to: 3 },
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 4. Forest Rabbit
    this.rabbitSprite = this.add.sprite(440, 380, 'forest_rabbit');
    this.rabbitSprite.setOrigin(0.5, 0.85);
    this.rabbitSprite.setDepth(380);
    // Hopping tween
    this.tweens.add({
      targets: this.rabbitSprite,
      y: 374,
      duration: 500,
      hold: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Quad.easeOut',
    });
  }

  private createAmbientAtmosphere() {
    if (!this.textures.exists('magic_spore')) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0xfde047, 0.85);
      g.fillCircle(3, 3, 2.5);
      g.generateTexture('magic_spore', 6, 6);
      g.destroy();
    }

    this.sporeParticles = this.add.particles(0, 0, 'magic_spore', {
      x: { min: 20, max: 780 },
      y: { min: 20, max: 580 },
      speedX: { min: -12, max: 18 },
      speedY: { min: -20, max: -4 },
      scale: { start: 1.0, end: 0.2 },
      alpha: { start: 0.7, end: 0 },
      lifespan: 3600,
      frequency: 280,
      quantity: 1,
    });
    this.sporeParticles.setDepth(9999);
  }

  public override update(_time: number, delta: number) {
    if (!this.heroSprite) return;

    // 1. Player Input & Animation Movement
    if (!this.isDead && !this.isAttacking && !this.isHurting) {
      this.handlePlayerMovement();
    }

    // 2. Continuous 3/4 Depth Sorting
    this.heroSprite.setDepth(this.heroSprite.y);

    // 3. Dynamic Environment Occlusion:
    // If the player is behind any tree canopy, gracefully fade the canopy to 42% opacity
    let occludedThisFrame = false;
    for (let i = 0; i < this.treePositions.length; i++) {
      const pos = this.treePositions[i];
      const canopy = this.treeCanopySprites[i];

      const dx = Math.abs(this.heroSprite.x - pos.x);
      const dy = this.heroSprite.y - pos.y;

      if (dx < 76 && dy < -4 && dy > -120) {
        occludedThisFrame = true;
        canopy.alpha = Phaser.Math.Linear(canopy.alpha, 0.42, 0.1);
      } else {
        canopy.alpha = Phaser.Math.Linear(canopy.alpha, 1.0, 0.08);
      }
    }
    this.isOccluded = occludedThisFrame;

    // 4. Report statistics to React modal at throttled 100ms rate
    this.statsTimer += delta;
    if (this.statsTimer > 100 && this.onStatsUpdate) {
      this.statsTimer = 0;
      this.onStatsUpdate({
        fps: Math.round(this.game.loop.actualFps),
        activeSprites: this.children.list.filter((c) => c.active).length,
        totalObjects: this.children.length,
        currentAnim: this.currentAnimState.toUpperCase(),
        isOccludedByCanopy: this.isOccluded,
        qualityLevel: this.qualityLevel,
        playerPos: {
          x: Math.round(this.heroSprite.x),
          y: Math.round(this.heroSprite.y),
        },
        activeCreatures: ['Fantasy Deer', 'Forest Wolf', 'Wild Boar', 'Forest Rabbit'],
      });
    }
  }

  private handlePlayerMovement() {
    let vx = 0;
    let vy = 0;

    const left = this.cursors?.left.isDown || this.wasdKeys?.A.isDown;
    const right = this.cursors?.right.isDown || this.wasdKeys?.D.isDown;
    const up = this.cursors?.up.isDown || this.wasdKeys?.W.isDown;
    const down = this.cursors?.down.isDown || this.wasdKeys?.S.isDown;
    const isRunning = this.cursors?.shift?.isDown || this.wasdKeys?.SHIFT.isDown;

    if (left) vx -= 1;
    if (right) vx += 1;
    if (up) vy -= 1;
    if (down) vy += 1;

    const speed = isRunning ? 2.8 : 1.7;

    if (vx !== 0 || vy !== 0) {
      const len = Math.hypot(vx, vy);
      this.heroSprite.x += (vx / len) * speed;
      this.heroSprite.y += (vy / len) * speed;

      this.heroSprite.x = Phaser.Math.Clamp(this.heroSprite.x, 30, 770);
      this.heroSprite.y = Phaser.Math.Clamp(this.heroSprite.y, 60, 570);

      if (vx < 0) {
        this.heroSprite.setFlipX(true);
      } else if (vx > 0) {
        this.heroSprite.setFlipX(false);
      }

      const targetAnim = isRunning ? 'run' : 'walk';
      if (this.currentAnimState !== targetAnim) {
        this.currentAnimState = targetAnim;
        this.heroSprite.play(isRunning ? 'anim_hero_run' : 'anim_hero_walk', true);
      }
    } else {
      if (this.currentAnimState !== 'idle') {
        this.currentAnimState = 'idle';
        this.heroSprite.play('anim_hero_idle', true);
      }
    }
  }

  // --- External Control Hooks for Testing All Animations ---

  public triggerAttack() {
    if (this.isAttacking || this.isDead) return;
    this.isAttacking = true;
    this.currentAnimState = 'attack';
    this.heroSprite.play('anim_hero_attack');
    this.heroSprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.isAttacking = false;
      this.currentAnimState = 'idle';
      this.heroSprite.play('anim_hero_idle');
    });
  }

  public triggerHurt() {
    if (this.isDead) return;
    this.isHurting = true;
    this.currentAnimState = 'hurt';
    this.heroSprite.play('anim_hero_hurt');
    this.tweens.add({
      targets: this.heroSprite,
      x: this.heroSprite.x - (this.heroSprite.flipX ? -12 : 12),
      duration: 180,
      yoyo: true,
    });
    this.heroSprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.isHurting = false;
      this.currentAnimState = 'idle';
      this.heroSprite.play('anim_hero_idle');
    });
  }

  public triggerDeath() {
    if (this.isDead) return;
    this.isDead = true;
    this.currentAnimState = 'death';
    this.heroSprite.play('anim_hero_death');
  }

  public respawnHero() {
    this.isDead = false;
    this.isAttacking = false;
    this.isHurting = false;
    this.heroSprite.alpha = 1;
    this.heroSprite.setPosition(360, 340);
    this.currentAnimState = 'idle';
    this.heroSprite.play('anim_hero_idle');
  }

  public setQuality(level: 'HIGH' | 'MEDIUM' | 'LOW') {
    this.qualityLevel = level;
    if (level === 'LOW') {
      this.sporeParticles?.stop();
      this.windTweens.forEach((t) => t.pause());
    } else if (level === 'MEDIUM') {
      this.sporeParticles?.stop();
      this.windTweens.forEach((t) => t.resume());
    } else {
      this.sporeParticles?.start();
      this.windTweens.forEach((t) => t.resume());
    }
  }

  public moveVirtual(dx: number, dy: number) {
    if (this.isAttacking || this.isDead) return;
    this.heroSprite.x += dx * 2.2;
    this.heroSprite.y += dy * 2.2;
    this.heroSprite.x = Phaser.Math.Clamp(this.heroSprite.x, 30, 770);
    this.heroSprite.y = Phaser.Math.Clamp(this.heroSprite.y, 60, 570);
    if (dx < 0) this.heroSprite.setFlipX(true);
    else if (dx > 0) this.heroSprite.setFlipX(false);
    if (this.currentAnimState !== 'walk') {
      this.currentAnimState = 'walk';
      this.heroSprite.play('anim_hero_walk', true);
    }
  }

  public stopVirtualMove() {
    if (this.currentAnimState === 'walk' || this.currentAnimState === 'run') {
      this.currentAnimState = 'idle';
      this.heroSprite.play('anim_hero_idle', true);
    }
  }
}
