import React, { useEffect, useRef } from 'react';
import { BiomeRegion, WORLD_LOCATIONS } from '../game/biodiversity';
import { StructureKind, WorldMapRenderData } from '../game/types';
import {
  EARTH_CONTINENT_LABELS,
  EARTH_LAT_MAX,
  EARTH_LAT_SPAN,
  EARTH_LON_MIN,
  EARTH_LON_SPAN,
  EARTH_OCEAN_LABELS,
  FOG_CELLS_H,
  FOG_CELLS_W,
  WORLD_PIXEL_H,
  WORLD_PIXEL_W,
  WORLD_TILES_H,
  WORLD_TILES_W,
} from '../game/worldGen';

export type EarthMapMode = 'minimap' | 'preview' | 'atlas';

interface EarthMapCanvasProps {
  mode: EarthMapMode;
  mapData: WorldMapRenderData | null;
  discoveredLocationIds?: string[];
  selectedLocationId?: string | null;
  onSelectLocation?: (locationId: string) => void;
  className?: string;
}

const BIOME_RGB: Record<BiomeRegion, [number, number, number]> = {
  [BiomeRegion.OCEAN]: [12, 66, 94],
  [BiomeRegion.COAST]: [216, 196, 138],
  [BiomeRegion.RIVER]: [36, 138, 178],
  [BiomeRegion.RIVERBANK]: [68, 128, 78],
  [BiomeRegion.SANCTUARY]: [218, 184, 102],
  [BiomeRegion.SAVANNA]: [92, 146, 74],
  [BiomeRegion.FOREST]: [34, 96, 56],
  [BiomeRegion.DESERT]: [214, 158, 88],
  [BiomeRegion.MOUNTAIN]: [98, 102, 114],
  [BiomeRegion.SNOW_PEAK]: [232, 240, 248],
};

function lonLatToNorm(lon: number, lat: number): { nx: number; ny: number } {
  return {
    nx: (lon - EARTH_LON_MIN) / EARTH_LON_SPAN,
    ny: (EARTH_LAT_MAX - lat) / EARTH_LAT_SPAN,
  };
}

export const EarthMapCanvas: React.FC<EarthMapCanvasProps> = ({
  mode,
  mapData,
  discoveredLocationIds = [],
  selectedLocationId = null,
  onSelectLocation,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);

  const canvasW = mode === 'minimap' ? 320 : mode === 'preview' ? 640 : 800;
  const canvasH = mode === 'minimap' ? 180 : mode === 'preview' ? 360 : 450;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !mapData) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!offscreenRef.current) {
      const off = document.createElement('canvas');
      off.width = WORLD_TILES_W;
      off.height = WORLD_TILES_H;
      offscreenRef.current = off;
    }

    const off = offscreenRef.current;
    const octx = off.getContext('2d');
    if (!octx) return;

    const img = octx.createImageData(WORLD_TILES_W, WORLD_TILES_H);
    const buf = img.data;
    const { tiles, fog } = mapData;
    const hasFog = mode !== 'preview' && fog.length === FOG_CELLS_W * FOG_CELLS_H;

    for (let ty = 0; ty < WORLD_TILES_H; ty++) {
      const fy = Math.min(FOG_CELLS_H - 1, Math.floor((ty / WORLD_TILES_H) * FOG_CELLS_H));
      const latFactor = Math.abs(ty / WORLD_TILES_H - 0.506) * 2; // 0 at Equator, ~1 at Poles

      for (let tx = 0; tx < WORLD_TILES_W; tx++) {
        const wIdx = ty * WORLD_TILES_W + tx;
        const biome = tiles[wIdx] ?? BiomeRegion.OCEAN;
        let [r, g, b] = BIOME_RGB[biome];

        if (biome === BiomeRegion.OCEAN) {
          // Subtle continental shelf turquoise glow near land & polar bathymetry depth
          const nearShelf =
            (tx > 1 && tiles[wIdx - 1] !== BiomeRegion.OCEAN) ||
            (tx < WORLD_TILES_W - 2 && tiles[wIdx + 1] !== BiomeRegion.OCEAN) ||
            (ty > 1 && tiles[wIdx - WORLD_TILES_W] !== BiomeRegion.OCEAN) ||
            (ty < WORLD_TILES_H - 2 && tiles[wIdx + WORLD_TILES_W] !== BiomeRegion.OCEAN);
          if (nearShelf) {
            r = 24;
            g = 112;
            b = 144;
          } else {
            const depthShade = 1 - latFactor * 0.22;
            r = Math.round(r * depthShade);
            g = Math.round(g * depthShade);
            b = Math.round(b * (0.9 + (1 - latFactor) * 0.12));
          }
        } else {
          // Crisp dark coastline outline where continent meets deep ocean
          const touchesOcean =
            (tx > 0 && tiles[wIdx - 1] === BiomeRegion.OCEAN) ||
            (tx < WORLD_TILES_W - 1 && tiles[wIdx + 1] === BiomeRegion.OCEAN) ||
            (ty > 0 && tiles[wIdx - WORLD_TILES_W] === BiomeRegion.OCEAN) ||
            (ty < WORLD_TILES_H - 1 && tiles[wIdx + WORLD_TILES_W] === BiomeRegion.OCEAN);
          if (touchesOcean && biome !== BiomeRegion.COAST) {
            r = Math.round(r * 0.78);
            g = Math.round(g * 0.78);
            b = Math.round(b * 0.78);
          }
        }

        if (hasFog) {
          const fx = Math.min(FOG_CELLS_W - 1, Math.floor((tx / WORLD_TILES_W) * FOG_CELLS_W));
          const explored = fog[fy * FOG_CELLS_W + fx] > 0;
          if (!explored) {
            // Keep the full Earth satellite map clearly visible even in unvisited zones!
            const dim = mode === 'minimap' ? 0.68 : 0.72;
            r = Math.round(r * dim + 6);
            g = Math.round(g * dim + 10);
            b = Math.round(b * dim + 12);
          } else {
            r = Math.min(255, Math.round(r * 1.08));
            g = Math.min(255, Math.round(g * 1.08));
            b = Math.min(255, Math.round(b * 1.08));
          }
        }

        const pIdx = wIdx * 4;
        buf[pIdx] = r;
        buf[pIdx + 1] = g;
        buf[pIdx + 2] = b;
        buf[pIdx + 3] = 255;
      }
    }

    octx.putImageData(img, 0, 0);

    ctx.clearRect(0, 0, canvasW, canvasH);
    ctx.imageSmoothingEnabled = mode !== 'minimap';
    ctx.drawImage(off, 0, 0, canvasW, canvasH);

    // Latitude & Longitude Cartographic Graticule Grid
    const latLines = [60, 30, 0, -30, -60];
    const lonLines = [-120, -60, 0, 60, 120];

    ctx.save();
    for (const lat of latLines) {
      const { ny } = lonLatToNorm(0, lat);
      const y = Math.round(ny * canvasH) + 0.5;
      ctx.beginPath();
      if (lat === 0) {
        ctx.strokeStyle = 'rgba(253, 224, 71, 0.34)';
        ctx.setLineDash([4, 4]);
      } else {
        ctx.strokeStyle = 'rgba(186, 230, 253, 0.14)';
        ctx.setLineDash([]);
      }
      ctx.lineWidth = 1;
      ctx.moveTo(0, y);
      ctx.lineTo(canvasW, y);
      ctx.stroke();

      if (mode === 'atlas') {
        ctx.setLineDash([]);
        ctx.font = '500 9px "JetBrains Mono", monospace';
        ctx.fillStyle = lat === 0 ? 'rgba(253, 224, 71, 0.78)' : 'rgba(203, 213, 225, 0.55)';
        ctx.textAlign = 'left';
        const label = lat === 0 ? 'Xích Đạo 0°' : lat > 0 ? `${lat}°B` : `${Math.abs(lat)}°N`;
        ctx.fillText(label, 6, y - 3);
      }
    }

    ctx.setLineDash([]);
    for (const lon of lonLines) {
      const { nx } = lonLatToNorm(lon, 0);
      const x = Math.round(nx * canvasW) + 0.5;
      ctx.beginPath();
      ctx.strokeStyle = lon === 0 ? 'rgba(226, 232, 240, 0.22)' : 'rgba(186, 230, 253, 0.12)';
      ctx.lineWidth = 1;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasH);
      ctx.stroke();

      if (mode === 'atlas') {
        ctx.font = '500 9px "JetBrains Mono", monospace';
        ctx.fillStyle = 'rgba(203, 213, 225, 0.55)';
        ctx.textAlign = 'center';
        const label = lon === 0 ? '0°' : lon > 0 ? `${lon}°Đ` : `${Math.abs(lon)}°T`;
        ctx.fillText(label, x, canvasH - 5);
      }
    }
    ctx.restore();

    // Cartographic Ocean & Continent Labels for Preview and Atlas Modes
    if (mode === 'atlas' || mode === 'preview') {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Ocean Names (subtle italic cartography)
      ctx.font = mode === 'atlas' ? 'italic 500 11px "Plus Jakarta Sans", sans-serif' : 'italic 500 9.5px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = 'rgba(186, 230, 253, 0.52)';
      for (const oc of EARTH_OCEAN_LABELS) {
        const { nx, ny } = lonLatToNorm(oc.lon, oc.lat);
        ctx.fillText(oc.text, nx * canvasW, ny * canvasH);
      }

      // Continent Names (crisp shadowed cartography)
      ctx.font = mode === 'atlas' ? '700 11px "Plus Jakarta Sans", sans-serif' : '700 9.5px "Plus Jakarta Sans", sans-serif';
      for (const cont of EARTH_CONTINENT_LABELS) {
        const { nx, ny } = lonLatToNorm(cont.lon, cont.lat);
        const cx = nx * canvasW;
        const cy = ny * canvasH;
        ctx.fillStyle = 'rgba(8, 14, 12, 0.78)';
        ctx.fillText(cont.text, cx + 1, cy + 1);
        ctx.fillStyle = 'rgba(247, 244, 235, 0.88)';
        ctx.fillText(cont.text, cx, cy);
      }
      ctx.restore();
    }

    // 12 Earth Locations Pins
    const discoveredSet = new Set(discoveredLocationIds);
    for (const loc of WORLD_LOCATIONS) {
      const lx = ((loc.tx + 0.5) / WORLD_TILES_W) * canvasW;
      const ly = ((loc.ty + 0.5) / WORLD_TILES_H) * canvasH;
      const isSelected = selectedLocationId === loc.id;
      const isVisited = discoveredSet.has(loc.id) || mode === 'preview';

      if (mode === 'minimap') {
        if (loc.hasResearchBeacon) {
          const beacon = mapData.beacons.find((b) => b.locationId === loc.id);
          ctx.fillStyle =
            loc.id === 'loc_biosphere_hub'
              ? '#e8c468'
              : beacon?.activated
              ? '#38bdf8'
              : '#f59e0b';
          ctx.beginPath();
          ctx.arc(lx, ly, 2.4, 0, Math.PI * 2);
          ctx.fill();
        }
        continue;
      }

      if (isSelected) {
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(lx, ly, mode === 'atlas' ? 9.5 : 7.5, 0, Math.PI * 2);
        ctx.stroke();
      }

      const beacon = mapData.beacons.find((b) => b.locationId === loc.id);
      const pinColor =
        loc.id === 'loc_biosphere_hub'
          ? '#fde047'
          : beacon
          ? beacon.activated
            ? '#38bdf8'
            : '#f59e0b'
          : isVisited
          ? '#a3e635'
          : '#cbd5e1';

      ctx.fillStyle = pinColor;
      ctx.strokeStyle = '#090f0d';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(lx, ly, mode === 'atlas' ? 4.8 : 3.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Campfire Markers (in minimap & atlas)
    if (mode !== 'preview') {
      for (const st of mapData.structures) {
        if (st.kind !== StructureKind.CAMPFIRE) continue;
        const sx = (st.x / WORLD_PIXEL_W) * canvasW;
        const sy = (st.y / WORLD_PIXEL_H) * canvasH;
        ctx.fillStyle = '#fb923c';
        ctx.beginPath();
        ctx.arc(sx, sy, mode === 'atlas' ? 3.6 : 2.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Himalayan Boss Altar Marker
      const ax = (mapData.altarX / WORLD_PIXEL_W) * canvasW;
      const ay = (mapData.altarY / WORLD_PIXEL_H) * canvasH;
      const s = mode === 'atlas' ? 4.5 : 2.8;
      ctx.fillStyle = '#f97316';
      ctx.strokeStyle = '#090f0d';
      ctx.lineWidth = 1.2;
      ctx.fillRect(ax - s, ay - s, s * 2, s * 2);
      ctx.strokeRect(ax - s, ay - s, s * 2, s * 2);

      // Camera Viewport Rectangle on Minimap & Atlas
      const vw = (mapData.viewW / WORLD_PIXEL_W) * canvasW;
      const vh = (mapData.viewH / WORLD_PIXEL_H) * canvasH;
      const vx = ((mapData.camX - mapData.viewW / 2) / WORLD_PIXEL_W) * canvasW;
      const vy = ((mapData.camY - mapData.viewH / 2) / WORLD_PIXEL_H) * canvasH;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.lineWidth = 1;
      ctx.strokeRect(vx, vy, Math.max(8, vw), Math.max(6, vh));

      // Tamed Companion Marker
      if (mapData.companionX !== null && mapData.companionY !== null) {
        const cx = (mapData.companionX / WORLD_PIXEL_W) * canvasW;
        const cy = (mapData.companionY / WORLD_PIXEL_H) * canvasH;
        ctx.fillStyle = '#fde047';
        ctx.strokeStyle = '#090f0d';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(cx, cy, mode === 'atlas' ? 3.8 : 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Live Player Marker
      const px = (mapData.playerX / WORLD_PIXEL_W) * canvasW;
      const py = (mapData.playerY / WORLD_PIXEL_H) * canvasH;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#090f0d';
      ctx.lineWidth = mode === 'atlas' ? 2 : 1.5;
      ctx.beginPath();
      ctx.arc(px, py, mode === 'atlas' ? 5.2 : 3.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Remote Players Markers
      if (mapData.remotePlayers && mapData.remotePlayers.length > 0) {
        for (const rp of mapData.remotePlayers) {
          const rpx = (rp.x / WORLD_PIXEL_W) * canvasW;
          const rpy = (rp.y / WORLD_PIXEL_H) * canvasH;
          ctx.fillStyle = rp.color || '#38bdf8';
          ctx.strokeStyle = '#090f0d';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.arc(rpx, rpy, mode === 'atlas' ? 4.5 : 2.8, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          if (mode === 'atlas') {
            ctx.font = '600 9px "Plus Jakarta Sans", sans-serif';
            ctx.fillStyle = '#f8fafc';
            ctx.textAlign = 'center';
            ctx.fillText(rp.name, rpx, rpy - 7);
          }
        }
      }

      // World Pings Markers
      if (mapData.pings && mapData.pings.length > 0) {
        for (const ping of mapData.pings) {
          const pgx = (ping.x / WORLD_PIXEL_W) * canvasW;
          const pgy = (ping.y / WORLD_PIXEL_H) * canvasH;
          ctx.fillStyle = ping.color || '#38bdf8';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(pgx, pgy, mode === 'atlas' ? 4 : 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      }
    }
  }, [mapData, mode, canvasW, canvasH, discoveredLocationIds, selectedLocationId]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onSelectLocation) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * canvasW;
    const clickY = ((e.clientY - rect.top) / rect.height) * canvasH;

    let nearestId: string | null = null;
    let bestDist = mode === 'atlas' ? 26 : 22;

    for (const loc of WORLD_LOCATIONS) {
      const lx = ((loc.tx + 0.5) / WORLD_TILES_W) * canvasW;
      const ly = ((loc.ty + 0.5) / WORLD_TILES_H) * canvasH;
      const d = Math.hypot(clickX - lx, clickY - ly);
      if (d <= bestDist) {
        bestDist = d;
        nearestId = loc.id;
      }
    }

    if (nearestId) {
      onSelectLocation(nearestId);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={canvasW}
      height={canvasH}
      onClick={onSelectLocation ? handleCanvasClick : undefined}
      className={className}
    />
  );
};
