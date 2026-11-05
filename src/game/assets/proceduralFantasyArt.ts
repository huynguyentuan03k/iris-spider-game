/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AtlasFrameDef, TextureAtlasData } from './assetTypes';

/**
 * Creates an in-memory canvas for procedural rasterization of hand-painted style fantasy textures.
 */
function createBuffer(w: number, h: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  return { canvas, ctx };
}

/**
 * Helper to draw soft ambient drop shadow underneath entities.
 */
function drawDropShadow(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, alpha = 0.42) {
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, rx);
  grad.addColorStop(0, `rgba(15, 23, 42, ${alpha})`);
  grad.addColorStop(0.65, `rgba(15, 23, 42, ${alpha * 0.5})`);
  grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.restore();
}

/**
 * Generates the Character Atlas (Hand-Painted Paladin Hero).
 * Contains Idle (4 frames), Walk (6 frames), Run (6 frames), Attack (4 frames), Hurt (2 frames), Death (4 frames).
 * Total 26 animation frames arranged on a 512x512 atlas.
 */
export function generateHeroAtlas(): { atlasData: TextureAtlasData; imageUri: string } {
  const ATLAS_W = 512;
  const ATLAS_H = 512;
  const FRAME_W = 64;
  const FRAME_H = 64;

  const { canvas, ctx } = createBuffer(ATLAS_W, ATLAS_H);
  const frames: Record<string, AtlasFrameDef> = {};

  const registerFrame = (name: string, col: number, row: number) => {
    const x = col * FRAME_W;
    const y = row * FRAME_H;
    frames[name] = {
      frame: { x, y, w: FRAME_W, h: FRAME_H },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: FRAME_W, h: FRAME_H },
      sourceSize: { w: FRAME_W, h: FRAME_H },
      anchor: { x: 0.5, y: 0.85 },
    };
    return { x, y };
  };

  // Common Paladin drawing routine
  const renderPaladin = (
    targetX: number,
    targetY: number,
    params: {
      bobY: number;
      bodyAngle: number;
      legL: number;
      legR: number;
      armL: number;
      armR: number;
      swordAngle: number;
      capeWave: number;
      slashEffect?: number; // 0..1
      hurtFlash?: boolean;
      deathAlpha?: number;
      tiltedDown?: boolean;
    }
  ) => {
    ctx.save();
    ctx.translate(targetX + FRAME_W / 2, targetY + FRAME_H - 10 + params.bobY);

    if (params.deathAlpha !== undefined) {
      ctx.globalAlpha = Math.max(0, params.deathAlpha);
    }

    // 1. Soft Shadow
    drawDropShadow(ctx, 0, 0, 16, 6, 0.45);

    // If hurting, apply red tint
    if (params.hurtFlash) {
      ctx.filter = 'drop-shadow(0 0 6px #ef4444) brightness(1.2)';
    }

    ctx.rotate(params.bodyAngle);

    // 2. Billowing Cape (Back)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-6, -26);
    ctx.quadraticCurveTo(-18 + params.capeWave * 4, -14, -14 + params.capeWave * 6, -2);
    ctx.quadraticCurveTo(-6, 2, 6, -2);
    ctx.quadraticCurveTo(8 + params.capeWave * 2, -14, 6, -26);
    ctx.closePath();
    const capeGrad = ctx.createLinearGradient(-10, -26, -10, 2);
    capeGrad.addColorStop(0, '#991b1b');
    capeGrad.addColorStop(0.7, '#dc2626');
    capeGrad.addColorStop(1, '#7f1d1d');
    ctx.fillStyle = capeGrad;
    ctx.fill();
    ctx.strokeStyle = '#450a0a';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // 3. Legs & Greaves
    const drawLeg = (offsetX: number, angle: number) => {
      ctx.save();
      ctx.translate(offsetX, -12);
      ctx.rotate(angle);
      // Thigh & Greave
      ctx.fillStyle = '#475569';
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.2;
      ctx.fillRect(-3, 0, 6, 11);
      ctx.strokeRect(-3, 0, 6, 11);
      // Gold trim kneepad
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-3.5, 3, 7, 3);
      // Boot
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-4, 9, 8, 4);
      ctx.restore();
    };
    drawLeg(-5, params.legL);
    drawLeg(5, params.legR);

    // 4. Chestplate & Tabard
    ctx.save();
    ctx.translate(0, -24);
    // Armored torso
    ctx.beginPath();
    ctx.roundRect(-10, 0, 20, 14, 4);
    const armorGrad = ctx.createLinearGradient(-10, 0, 10, 14);
    armorGrad.addColorStop(0, '#f8fafc');
    armorGrad.addColorStop(0.4, '#cbd5e1');
    armorGrad.addColorStop(1, '#64748b');
    ctx.fillStyle = armorGrad;
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Royal Blue Tabard / Crest stripe
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(-3.5, 0, 7, 14);
    // Golden lion sigil cross
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(-2, 3, 4, 6);
    ctx.fillRect(-4, 5, 8, 2);

    // Pauldrons (Shoulder Guards)
    const drawPuldron = (px: number) => {
      ctx.save();
      ctx.translate(px, -2);
      ctx.beginPath();
      ctx.ellipse(0, 0, 6, 4, px < 0 ? -0.2 : 0.2, 0, Math.PI * 2);
      ctx.fillStyle = '#e2e8f0';
      ctx.fill();
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    };
    drawPuldron(-10);
    drawPuldron(10);
    ctx.restore();

    // 5. Shield (Left Hand / Side)
    ctx.save();
    ctx.translate(-12, -18);
    ctx.rotate(params.armL);
    // Kite Shield
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(8, -8);
    ctx.lineTo(7, 4);
    ctx.lineTo(0, 12);
    ctx.lineTo(-7, 4);
    ctx.lineTo(-8, -8);
    ctx.closePath();
    const shieldGrad = ctx.createLinearGradient(-8, -8, 8, 12);
    shieldGrad.addColorStop(0, '#3b82f6');
    shieldGrad.addColorStop(0.8, '#1d4ed8');
    shieldGrad.addColorStop(1, '#1e3a8a');
    ctx.fillStyle = shieldGrad;
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Shield boss
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#fef08a';
    ctx.fill();
    ctx.restore();

    // 6. Knight Helmet & Crest
    ctx.save();
    ctx.translate(0, -32);
    // Main helm dome
    ctx.beginPath();
    ctx.arc(0, 0, 9, Math.PI, 0);
    ctx.lineTo(8, 7);
    ctx.lineTo(-8, 7);
    ctx.closePath();
    const helmGrad = ctx.createRadialGradient(-3, -4, 2, 0, 0, 10);
    helmGrad.addColorStop(0, '#ffffff');
    helmGrad.addColorStop(0.5, '#cbd5e1');
    helmGrad.addColorStop(1, '#475569');
    ctx.fillStyle = helmGrad;
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Visor eye slit with glowing gaze
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-6, 0, 12, 3);
    ctx.fillStyle = '#60a5fa';
    ctx.fillRect(-4, 0.5, 3, 2);
    ctx.fillRect(1, 0.5, 3, 2);

    // Golden Plume / Feather Crest
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.quadraticCurveTo(8 + params.capeWave * 3, -18, 0, -22);
    ctx.quadraticCurveTo(-4, -16, 0, -9);
    ctx.fillStyle = '#ef4444';
    ctx.fill();
    ctx.strokeStyle = '#b91c1c';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();

    // 7. Right Hand & Paladin Greatsword
    ctx.save();
    ctx.translate(11, -19);
    ctx.rotate(params.armR);

    // Hand gauntlet
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.stroke();

    // Sword
    ctx.save();
    ctx.rotate(params.swordAngle);
    // Hilt / Crossguard
    ctx.fillStyle = '#d97706';
    ctx.fillRect(-6, -1, 12, 3);
    // Pommel
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(0, 4, 2.5, 0, Math.PI * 2);
    ctx.fill();
    // Steel Blade
    ctx.beginPath();
    ctx.moveTo(-3, -1);
    ctx.lineTo(-2.5, -26);
    ctx.lineTo(0, -32); // tip
    ctx.lineTo(2.5, -26);
    ctx.lineTo(3, -1);
    ctx.closePath();
    const bladeGrad = ctx.createLinearGradient(-3, 0, 3, 0);
    bladeGrad.addColorStop(0, '#f1f5f9');
    bladeGrad.addColorStop(0.5, '#ffffff');
    bladeGrad.addColorStop(1, '#94a3b8');
    ctx.fillStyle = bladeGrad;
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    // Fuller line
    ctx.strokeStyle = '#64748b';
    ctx.beginPath();
    ctx.moveTo(0, -2);
    ctx.lineTo(0, -24);
    ctx.stroke();

    ctx.restore();
    ctx.restore();

    // 8. Attack Slash VFX arc (if applicable)
    if (params.slashEffect && params.slashEffect > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(10, -20, 34, -0.6 * Math.PI, 0.4 * Math.PI, false);
      ctx.strokeStyle = `rgba(254, 240, 138, ${params.slashEffect})`;
      ctx.lineWidth = 4;
      ctx.shadowColor = '#60a5fa';
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  };

  // 1. IDLE (4 frames) - Row 0
  for (let i = 0; i < 4; i++) {
    const { x, y } = registerFrame(`hero_idle_${i}`, i, 0);
    const t = (i / 4) * Math.PI * 2;
    renderPaladin(x, y, {
      bobY: Math.sin(t) * 1.5,
      bodyAngle: 0,
      legL: 0,
      legR: 0,
      armL: -0.1,
      armR: 0.15,
      swordAngle: -0.2 + Math.sin(t) * 0.05,
      capeWave: Math.sin(t),
    });
  }

  // 2. WALK (6 frames) - Row 1
  for (let i = 0; i < 6; i++) {
    const { x, y } = registerFrame(`hero_walk_${i}`, i, 1);
    const t = (i / 6) * Math.PI * 2;
    renderPaladin(x, y, {
      bobY: Math.abs(Math.sin(t)) * -2,
      bodyAngle: Math.sin(t) * 0.05,
      legL: Math.sin(t) * 0.45,
      legR: -Math.sin(t) * 0.45,
      armL: -Math.sin(t) * 0.3,
      armR: Math.sin(t) * 0.35,
      swordAngle: -0.3 + Math.sin(t) * 0.15,
      capeWave: Math.sin(t * 1.5) * 1.8,
    });
  }

  // 3. RUN (6 frames) - Row 2
  for (let i = 0; i < 6; i++) {
    const { x, y } = registerFrame(`hero_run_${i}`, i, 2);
    const t = (i / 6) * Math.PI * 2;
    renderPaladin(x, y, {
      bobY: Math.abs(Math.sin(t)) * -3.5,
      bodyAngle: 0.14,
      legL: Math.sin(t) * 0.85,
      legR: -Math.sin(t) * 0.85,
      armL: -Math.sin(t) * 0.6,
      armR: Math.sin(t) * 0.6,
      swordAngle: -0.6 + Math.sin(t) * 0.2,
      capeWave: 2.5 + Math.sin(t * 2) * 2,
    });
  }

  // 4. ATTACK (4 frames) - Row 3
  const attackConfigs = [
    { bobY: 0, bodyAngle: -0.1, legL: -0.2, legR: 0.2, armL: 0.1, armR: -0.8, swordAngle: 1.2, capeWave: -1, slashEffect: 0 },
    { bobY: -2, bodyAngle: 0.25, legL: 0.3, legR: -0.3, armL: -0.3, armR: 0.9, swordAngle: -1.6, capeWave: 2.2, slashEffect: 1.0 },
    { bobY: 1, bodyAngle: 0.15, legL: 0.2, legR: -0.2, armL: -0.2, armR: 0.6, swordAngle: -1.2, capeWave: 1.5, slashEffect: 0.5 },
    { bobY: 0, bodyAngle: 0.05, legL: 0.0, legR: 0.0, armL: 0.0, armR: 0.2, swordAngle: -0.4, capeWave: 0.4, slashEffect: 0 },
  ];
  for (let i = 0; i < 4; i++) {
    const { x, y } = registerFrame(`hero_attack_${i}`, i, 3);
    renderPaladin(x, y, attackConfigs[i]);
  }

  // 5. HURT (2 frames) - Row 4 (cols 0, 1)
  for (let i = 0; i < 2; i++) {
    const { x, y } = registerFrame(`hero_hurt_${i}`, i, 4);
    renderPaladin(x, y, {
      bobY: -3,
      bodyAngle: -0.25,
      legL: -0.4,
      legR: 0.2,
      armL: 0.6,
      armR: -0.5,
      swordAngle: 0.8,
      capeWave: -2,
      hurtFlash: true,
    });
  }

  // 6. DEATH (4 frames) - Row 4 (cols 2, 3, 4, 5)
  for (let i = 0; i < 4; i++) {
    const { x, y } = registerFrame(`hero_death_${i}`, i + 2, 4);
    const alpha = 1 - i * 0.22;
    renderPaladin(x, y, {
      bobY: i * 4,
      bodyAngle: -0.3 * (i + 1),
      legL: -0.3 * (i + 1),
      legR: 0.4,
      armL: 0.5,
      armR: 0.8,
      swordAngle: 1.4,
      capeWave: -1,
      deathAlpha: alpha,
    });
  }

  const imageUri = canvas.toDataURL('image/png');
  const atlasData: TextureAtlasData = {
    frames,
    meta: {
      app: 'FantasyGameAssetManager',
      version: '1.0.0',
      image: imageUri,
      format: 'RGBA8888',
      size: { w: ATLAS_W, h: ATLAS_H },
      scale: '1',
    },
  };

  return { atlasData, imageUri };
}

/**
 * Generates the Multi-Layered Ancient Oak Tree Atlas.
 * Features:
 * - layer_shadow: ground contact ambient drop shadow
 * - layer_trunk: gnarled roots and textured wood bark
 * - layer_lower_foliage: shaded lower leafy cluster with organic depth
 * - layer_upper_canopy: sunlit upper foliage crown that sways with wind and occludes the player
 */
export function generateLayeredTreeAtlas(): { atlasData: TextureAtlasData; imageUri: string } {
  const ATLAS_W = 512;
  const ATLAS_H = 512;
  const { canvas, ctx } = createBuffer(ATLAS_W, ATLAS_H);
  const frames: Record<string, AtlasFrameDef> = {};

  // 1. Oak Shadow (256 x 128) -> placed at (0, 0)
  {
    const w = 256;
    const h = 128;
    ctx.save();
    drawDropShadow(ctx, 128, 64, 96, 42, 0.55);
    ctx.restore();

    frames['oak_shadow'] = {
      frame: { x: 0, y: 0, w, h },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w, h },
      sourceSize: { w, h },
      anchor: { x: 0.5, y: 0.5 },
    };
  }

  // 2. Oak Trunk (256 x 256) -> placed at (256, 0)
  {
    const ox = 256;
    const oy = 0;
    const w = 256;
    const h = 256;
    ctx.save();
    ctx.translate(ox + 128, oy + 220);

    // Gnarled Roots
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.moveTo(-54, 18);
    ctx.quadraticCurveTo(-38, -10, -22, -36);
    ctx.lineTo(22, -36);
    ctx.quadraticCurveTo(38, -10, 56, 18);
    ctx.lineTo(36, 22);
    ctx.quadraticCurveTo(14, 2, 0, 8);
    ctx.quadraticCurveTo(-18, 4, -40, 22);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#1c1917';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Moss on roots
    ctx.fillStyle = '#4d7c0f';
    ctx.beginPath();
    ctx.ellipse(-30, 10, 14, 5, -0.3, 0, Math.PI * 2);
    ctx.ellipse(26, 12, 12, 4, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Main Trunk & Lower Branches
    ctx.beginPath();
    ctx.moveTo(-22, -36);
    ctx.quadraticCurveTo(-18, -90, -42, -140);
    ctx.lineTo(-24, -146);
    ctx.quadraticCurveTo(-10, -105, 0, -120);
    ctx.quadraticCurveTo(14, -105, 34, -142);
    ctx.lineTo(48, -136);
    ctx.quadraticCurveTo(24, -90, 22, -36);
    ctx.closePath();

    const barkGrad = ctx.createLinearGradient(-30, -140, 30, -36);
    barkGrad.addColorStop(0, '#78350f');
    barkGrad.addColorStop(0.5, '#5c2c10');
    barkGrad.addColorStop(1, '#3b1805');
    ctx.fillStyle = barkGrad;
    ctx.fill();
    ctx.strokeStyle = '#1c1917';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Wood Bark Chisel highlights
    ctx.strokeStyle = '#9a3412';
    ctx.lineWidth = 2;
    for (let i = -14; i <= 14; i += 7) {
      ctx.beginPath();
      ctx.moveTo(i, -45);
      ctx.quadraticCurveTo(i + 4, -80, i - 2, -115);
      ctx.stroke();
    }

    ctx.restore();

    frames['oak_trunk'] = {
      frame: { x: ox, y: oy, w, h },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w, h },
      sourceSize: { w, h },
      anchor: { x: 0.5, y: 0.86 },
    };
  }

  // 3. Oak Lower Foliage (256 x 256) -> placed at (0, 140)
  {
    const ox = 0;
    const oy = 140;
    const w = 256;
    const h = 256;
    ctx.save();
    ctx.translate(ox + 128, oy + 128);

    // Dark under-canopy leaf clumps
    const leafClusters = [
      { x: -50, y: 15, r: 42, color: '#14532d' },
      { x: 50, y: 15, r: 42, color: '#166534' },
      { x: 0, y: -25, r: 55, color: '#15803d' },
      { x: -35, y: -45, r: 38, color: '#166534' },
      { x: 35, y: -45, r: 38, color: '#14532d' },
    ];

    leafClusters.forEach((cl) => {
      ctx.beginPath();
      ctx.arc(cl.x, cl.y, cl.r, 0, Math.PI * 2);
      ctx.fillStyle = cl.color;
      ctx.fill();
      ctx.strokeStyle = '#052e16';
      ctx.lineWidth = 3;
      ctx.stroke();
    });

    ctx.restore();

    frames['oak_lower_foliage'] = {
      frame: { x: ox, y: oy, w, h },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w, h },
      sourceSize: { w, h },
      anchor: { x: 0.5, y: 0.65 },
    };
  }

  // 4. Oak Upper Canopy (256 x 256) -> placed at (256, 256)
  {
    const ox = 256;
    const oy = 256;
    const w = 256;
    const h = 256;
    ctx.save();
    ctx.translate(ox + 128, oy + 128);

    // Vibrant sunlit foliage clusters
    const upperClusters = [
      { x: -40, y: 10, r: 48, colA: '#22c55e', colB: '#15803d' },
      { x: 42, y: 12, r: 48, colA: '#4ade80', colB: '#16a34a' },
      { x: 0, y: -35, r: 62, colA: '#86efac', colB: '#22c55e' },
      { x: -30, y: -50, r: 40, colA: '#bbf7d0', colB: '#4ade80' },
      { x: 28, y: -55, r: 42, colA: '#bef264', colB: '#22c55e' },
      { x: 0, y: 25, r: 36, colA: '#16a34a', colB: '#14532d' },
    ];

    upperClusters.forEach((cl) => {
      ctx.beginPath();
      ctx.arc(cl.x, cl.y, cl.r, 0, Math.PI * 2);
      const rad = ctx.createRadialGradient(cl.x - cl.r * 0.35, cl.y - cl.r * 0.35, 4, cl.x, cl.y, cl.r);
      rad.addColorStop(0, cl.colA);
      rad.addColorStop(0.85, cl.colB);
      rad.addColorStop(1, '#052e16');
      ctx.fillStyle = rad;
      ctx.fill();
      ctx.strokeStyle = '#052e16';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Dappled leaf highlights
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.ellipse(cl.x - cl.r * 0.3, cl.y - cl.r * 0.3, cl.r * 0.35, cl.r * 0.18, -0.4, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();

    frames['oak_upper_canopy'] = {
      frame: { x: ox, y: oy, w, h },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w, h },
      sourceSize: { w, h },
      anchor: { x: 0.5, y: 0.65 },
    };
  }

  const imageUri = canvas.toDataURL('image/png');
  const atlasData: TextureAtlasData = {
    frames,
    meta: {
      app: 'FantasyGameAssetManager',
      version: '1.0.0',
      image: imageUri,
      format: 'RGBA8888',
      size: { w: ATLAS_W, h: ATLAS_H },
      scale: '1',
    },
  };

  return { atlasData, imageUri };
}

/**
 * Generates Fantasy Pine Tree & Mystic Crystal Atlas.
 */
export function generateFantasyPropsAtlas(): { atlasData: TextureAtlasData; imageUri: string } {
  const ATLAS_W = 512;
  const ATLAS_H = 512;
  const { canvas, ctx } = createBuffer(ATLAS_W, ATLAS_H);
  const frames: Record<string, AtlasFrameDef> = {};

  // 1. Fantasy Pine (192 x 256) -> (0, 0)
  {
    const ox = 0;
    const oy = 0;
    const w = 192;
    const h = 256;
    ctx.save();
    ctx.translate(ox + 96, oy + 230);

    // Pine shadow
    drawDropShadow(ctx, 0, 0, 48, 16, 0.5);

    // Pine trunk
    ctx.fillStyle = '#451a03';
    ctx.fillRect(-8, -40, 16, 40);
    ctx.strokeStyle = '#1c1917';
    ctx.lineWidth = 2;
    ctx.strokeRect(-8, -40, 16, 40);

    // 4 Tiered Cones (bottom to top)
    const tiers = [
      { y: -35, hw: 58, h: 48, col1: '#047857', col2: '#064e3b' },
      { y: -75, hw: 48, h: 44, col1: '#10b981', col2: '#047857' },
      { y: -112, hw: 38, h: 40, col1: '#34d399', col2: '#059669' },
      { y: -145, hw: 26, h: 42, col1: '#6ee7b7', col2: '#10b981' },
    ];

    tiers.forEach((tier) => {
      ctx.beginPath();
      ctx.moveTo(-tier.hw, tier.y);
      // Serrated pine needle skirts
      for (let s = -tier.hw; s <= tier.hw; s += 16) {
        ctx.lineTo(s + 6, tier.y - 6);
        ctx.lineTo(s + 12, tier.y);
      }
      ctx.lineTo(0, tier.y - tier.h);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, tier.y - tier.h, 0, tier.y);
      grad.addColorStop(0, tier.col1);
      grad.addColorStop(1, tier.col2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = '#022c22';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Frosty tip highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.moveTo(0, tier.y - tier.h);
      ctx.lineTo(8, tier.y - tier.h + 12);
      ctx.lineTo(-8, tier.y - tier.h + 12);
      ctx.closePath();
      ctx.fill();
    });

    ctx.restore();

    frames['fantasy_pine'] = {
      frame: { x: ox, y: oy, w, h },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w, h },
      sourceSize: { w, h },
      anchor: { x: 0.5, y: 0.9 },
    };
  }

  // 2. Mystic Crystal Spire (192 x 256) -> (200, 0)
  {
    const ox = 200;
    const oy = 0;
    const w = 192;
    const h = 256;
    ctx.save();
    ctx.translate(ox + 96, oy + 210);

    // Floating shadow
    drawDropShadow(ctx, 0, 16, 36, 12, 0.4);

    // Glowing core glow
    const glow = ctx.createRadialGradient(0, -60, 10, 0, -60, 70);
    glow.addColorStop(0, 'rgba(168, 85, 247, 0.5)');
    glow.addColorStop(1, 'rgba(168, 85, 247, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(-70, -130, 140, 140);

    // Crystalline facets
    const drawFacet = (pts: [number, number][], c1: string, c2: string) => {
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i][0], pts[i][1]);
      }
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, -120, 0, 0);
      grad.addColorStop(0, c1);
      grad.addColorStop(1, c2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = '#581c87';
      ctx.lineWidth = 2;
      ctx.stroke();
    };

    // Central Pillar
    drawFacet([[0, -130], [22, -60], [14, 0], [0, 8]], '#f0abfc', '#a855f7');
    drawFacet([[0, -130], [-22, -60], [-14, 0], [0, 8]], '#e879f9', '#7e22ce');
    // Side Shards
    drawFacet([[-22, -60], [-38, -30], [-26, 10], [-14, 0]], '#c084fc', '#6b21a8');
    drawFacet([[22, -60], [38, -30], [26, 10], [14, 0]], '#d8b4fe', '#9333ea');

    // Runes
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -80);
    ctx.lineTo(0, -40);
    ctx.moveTo(-6, -65);
    ctx.lineTo(6, -55);
    ctx.stroke();

    ctx.restore();

    frames['mystic_crystal_spire'] = {
      frame: { x: ox, y: oy, w, h },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w, h },
      sourceSize: { w, h },
      anchor: { x: 0.5, y: 0.88 },
    };
  }

  // 3. Ground Decors: Wildflowers (128 x 128) -> (0, 260)
  {
    const ox = 0;
    const oy = 260;
    const w = 128;
    const h = 128;
    ctx.save();
    ctx.translate(ox + 64, oy + 64);
    // Flower blossoms
    const flowers = [
      { x: -24, y: 6, r: 8, col: '#f43f5e' },
      { x: 18, y: -4, r: 9, col: '#38bdf8' },
      { x: 4, y: 16, r: 7, col: '#facc15' },
      { x: -10, y: -14, r: 8, col: '#e879f9' },
    ];
    flowers.forEach((fl) => {
      ctx.beginPath();
      ctx.arc(fl.x, fl.y, fl.r, 0, Math.PI * 2);
      ctx.fillStyle = fl.col;
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Center dot
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(fl.x, fl.y, fl.r * 0.35, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    frames['ground_decor_flower'] = {
      frame: { x: ox, y: oy, w, h },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w, h },
      sourceSize: { w, h },
      anchor: { x: 0.5, y: 0.5 },
    };
  }

  // 4. Ground Decors: Moss Boulder (128 x 128) -> (140, 260)
  {
    const ox = 140;
    const oy = 260;
    const w = 128;
    const h = 128;
    ctx.save();
    ctx.translate(ox + 64, oy + 84);

    drawDropShadow(ctx, 0, 0, 36, 14, 0.45);

    // Stone body
    ctx.beginPath();
    ctx.moveTo(-34, 0);
    ctx.quadraticCurveTo(-38, -32, -10, -42);
    ctx.quadraticCurveTo(24, -46, 36, -20);
    ctx.quadraticCurveTo(40, -4, 28, 4);
    ctx.quadraticCurveTo(0, 8, -34, 0);
    ctx.closePath();
    const rockGrad = ctx.createLinearGradient(-30, -40, 30, 4);
    rockGrad.addColorStop(0, '#94a3b8');
    rockGrad.addColorStop(0.5, '#64748b');
    rockGrad.addColorStop(1, '#334155');
    ctx.fillStyle = rockGrad;
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Moss patch on top
    ctx.beginPath();
    ctx.ellipse(-6, -34, 20, 8, -0.2, 0, Math.PI * 2);
    ctx.fillStyle = '#65a30d';
    ctx.fill();
    ctx.strokeStyle = '#365314';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();

    frames['ground_decor_moss_boulder'] = {
      frame: { x: ox, y: oy, w, h },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w, h },
      sourceSize: { w, h },
      anchor: { x: 0.5, y: 0.8 },
    };
  }

  const imageUri = canvas.toDataURL('image/png');
  const atlasData: TextureAtlasData = {
    frames,
    meta: {
      app: 'FantasyGameAssetManager',
      version: '1.0.0',
      image: imageUri,
      format: 'RGBA8888',
      size: { w: ATLAS_W, h: ATLAS_H },
      scale: '1',
    },
  };

  return { atlasData, imageUri };
}
