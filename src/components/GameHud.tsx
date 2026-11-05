import React from 'react';
import { BUILDABLE_SLOTS, RESOURCE_META, SWORD_NAMES, countAffordableUpgrades } from '../game/recipes';
import { countAffordableSkills } from '../game/skillTree';
import { PET_MODE_LABELS } from '../game/engine';
import { HudSnapshot, ResourceId, WorldMapRenderData } from '../game/types';
import { EarthMapCanvas } from './EarthMapCanvas';

interface GameHudProps {
  hud: HudSnapshot;
  isMuted: boolean;
  getMapData: () => WorldMapRenderData | null;
  onSelectSlot: (slot: number) => void;
  onOpenCodex: () => void;
  onOpenCrafting: () => void;
  onOpenBuildMenu: () => void;
  onOpenSkillTree: () => void;
  onOpenPetModal: () => void;
  onFeedOrTame: () => void;
  onAdvanceTime: () => void;
  onCycleWeather: () => void;
  onOpenMap: () => void;
  onOpenJournal: () => void;
  onPause: () => void;
  onToggleMute: () => void;
  onOpenMultiplayer: () => void;
  multiplayerStatus?: { isConnected: boolean; count: number; latency: number; roomName: string };
}

export const GameHud: React.FC<GameHudProps> = ({
  hud,
  isMuted,
  getMapData,
  onSelectSlot,
  onOpenCodex,
  onOpenCrafting,
  onOpenBuildMenu,
  onOpenSkillTree,
  onOpenPetModal,
  onFeedOrTame,
  onAdvanceTime,
  onCycleWeather,
  onOpenMap,
  onOpenJournal,
  onPause,
  onToggleMute,
  onOpenMultiplayer,
  multiplayerStatus,
}) => {
  const hpPct = Math.max(0, Math.min(100, (hud.hp / hud.maxHp) * 100));
  const stamPct = Math.max(0, Math.min(100, (hud.stamina / hud.maxStamina) * 100));
  const resourceKeys: ResourceId[] = ['wood', 'stone', 'iron', 'crystal', 'bioSample'];
  const readyUpgrades = countAffordableUpgrades(hud.inventory, hud.equipment);
  const readySkills = countAffordableSkills(hud.inventory, hud.unlockedSkillIds);
  const liveMapData = getMapData();

  const isDaylightOrb = hud.timeOfDay >= 0.2 && hud.timeOfDay <= 0.8;
  const orbX = 10 + (((hud.timeOfDay % 1) + 1) % 1) * 140;
  const orbArcNorm = isDaylightOrb
    ? Math.sin(((hud.timeOfDay - 0.2) / 0.6) * Math.PI)
    : Math.sin((((hud.timeOfDay < 0.2 ? hud.timeOfDay + 0.2 : hud.timeOfDay - 0.8) / 0.4) * Math.PI));
  const orbY = 17.5 - orbArcNorm * 11;

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-4 sm:p-5">
      {/* TOP PERIMETER ROW */}
      <div className="flex items-start justify-between gap-4">
        {/* Top-Left: Vitals + Sky Cycle Dial + Current Location & Wildlife Rhythm */}
        <div className="bg-[#101815]/92 border border-[#2a3b34] rounded-lg px-3.5 py-2.5 shadow-md max-w-md">
          <div className="flex items-center gap-2.5">
            <svg className="w-4 h-4 text-[#f87171] shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <svg className="w-36 sm:w-44 h-2.5 rounded-sm overflow-hidden shrink-0" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true">
              <rect width="100" height="10" fill="#1d2a25" />
              <rect width={hpPct} height="10" fill="#ef4444" />
            </svg>
            <span className="text-xs font-mono-num tabular-nums text-[#f2efe9] whitespace-nowrap">
              HP {hud.hp}/{hud.maxHp}
            </span>
          </div>

          <div className="mt-1.5 flex items-center gap-2.5">
            <svg className="w-4 h-4 text-[#fbbf24] shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
            </svg>
            <svg className="w-36 sm:w-44 h-2 rounded-sm overflow-hidden shrink-0" viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden="true">
              <rect width="100" height="8" fill="#1d2a25" />
              <rect width={stamPct} height="8" fill="#e8c468" />
            </svg>
            <span className="text-[11px] font-mono-num tabular-nums text-[#cbd5e1] whitespace-nowrap">
              TL {hud.stamina}/{hud.maxStamina}
            </span>
          </div>

          {/* Live 24h Sky Color & Celestial Cycle Strip */}
          <div className="mt-2 pt-2 border-t border-[#23322c] pointer-events-auto">
            <div className="flex items-center gap-2.5">
              <svg
                className="w-36 h-6 rounded border border-[#2a3b34] shrink-0 overflow-hidden"
                viewBox="0 0 160 24"
                aria-label={`Bầu trời ${hud.timeLabel} lúc ${hud.clockLabel}`}
              >
                <defs>
                  <linearGradient id="hud-sky-atmosphere" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={hud.skyTopColor} />
                    <stop offset="100%" stopColor={hud.skyHorizonColor} />
                  </linearGradient>
                </defs>
                <rect width="160" height="24" fill="url(#hud-sky-atmosphere)" />
                {!isDaylightOrb && (
                  <g fill="#e2e8f0" opacity="0.72">
                    <circle cx="24" cy="6" r="0.8" />
                    <circle cx="58" cy="4.5" r="0.9" />
                    <circle cx="96" cy="7" r="0.75" />
                    <circle cx="134" cy="5.5" r="0.85" />
                  </g>
                )}
                {/* Celestial Trajectory Guide */}
                <path
                  d="M 10 19 Q 80 3 150 19"
                  fill="none"
                  stroke="#ffffff"
                  strokeOpacity="0.22"
                  strokeDasharray="2 2"
                  strokeWidth="0.9"
                />
                {isDaylightOrb ? (
                  <g>
                    <circle cx={orbX} cy={orbY} r="5.2" fill="#fde047" opacity="0.32" />
                    <circle cx={orbX} cy={orbY} r="3.1" fill="#fef08a" />
                  </g>
                ) : (
                  <g>
                    <circle cx={orbX} cy={orbY} r="4.6" fill="#bae6fd" opacity="0.25" />
                    <circle cx={orbX} cy={orbY} r="2.8" fill="#f1f5f9" />
                    <circle cx={orbX + 1.2} cy={orbY - 0.8} r="2.3" fill={hud.skyTopColor} />
                  </g>
                )}
                {/* Horizon Terrain Silhouette */}
                <path d="M0 24 L0 20.5 L34 19 L72 21 L115 18.8 L160 20.5 L160 24 Z" fill="#0b1310" opacity="0.65" />
              </svg>

              <div className="min-w-0 flex-1 flex items-center justify-between gap-2 text-[11px]">
                <div className="truncate text-[#e2e8f0]">
                  <span className="font-mono-num font-semibold text-[#fef08a] tabular-nums">{hud.clockLabel}</span>
                  <span className="mx-1 text-[#64748b]" aria-hidden="true">·</span>
                  <span className="font-medium text-[#f7f4eb]">{hud.timeLabel}</span>
                  <span className="mx-1 text-[#64748b]" aria-hidden="true">·</span>
                  <span className="tabular-nums text-[#cbd5e1]">Ngày {hud.dayCount}</span>
                </div>
                <button
                  type="button"
                  onClick={onAdvanceTime}
                  title="Chuyển nhanh sang buổi tiếp theo để quan sát thú ban ngày hoặc thú săn đêm (Phím N)"
                  className="text-[11px] font-medium text-[#7dd3fc] hover:text-[#bae6fd] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Tua buổi [N]
                </button>
              </div>
            </div>

            <div className="mt-1 text-[11px] text-[#cbd5e1] truncate" title={hud.wildlifeActivityNote}>
              <span className={hud.dayPhase === 'NIGHT' || hud.dayPhase === 'DUSK' ? 'text-[#fbbf24]' : 'text-[#86efac]'}>
                Sinh thái:
              </span>{' '}
              {hud.wildlifeActivityNote}
            </div>
          </div>

          {/* Unboxed Location, Biome & Earth Latitude/Longitude Metadata */}
          <div className="mt-1.5 pt-1.5 border-t border-[#23322c] flex flex-wrap items-center gap-1.5 text-[11px] text-[#c8c4b8]">
            <span className="font-semibold text-[#e8c468]">{hud.locationName}</span>
            <span aria-hidden="true">·</span>
            <span>{hud.biomeLabel}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-num text-[#7dd3fc] tabular-nums">{hud.coordLabel}</span>
          </div>

          {/* Unboxed Dynamic Weather, Visibility, Movement Speed & Acoustic Readout */}
          <div className="mt-1.5 pt-1.5 border-t border-[#23322c] pointer-events-auto">
            <div className="flex items-center justify-between gap-2 text-[11px]">
              <div className="min-w-0 flex flex-wrap items-center gap-1.5">
                <span
                  className={
                    hud.weather === 'BLIZZARD' || hud.weather === 'SNOW'
                      ? 'font-medium text-[#e0f2fe]'
                      : hud.weather === 'RAIN'
                      ? 'font-medium text-[#7dd3fc]'
                      : hud.weather === 'FOG'
                      ? 'font-medium text-[#cbd5e1]'
                      : hud.weather === 'SANDSTORM'
                      ? 'font-medium text-[#fcd34d]'
                      : hud.weather === 'WINDY'
                      ? 'font-medium text-[#bef264]'
                      : 'text-[#cbd5e1]'
                  }
                >
                  {hud.weatherLabel}
                </span>
                <span className="text-[#64748b]" aria-hidden="true">·</span>
                <span
                  className={`font-mono-num tabular-nums ${
                    hud.visibilityPercent < 65
                      ? 'text-[#fbbf24]'
                      : hud.visibilityPercent < 88
                      ? 'text-[#7dd3fc]'
                      : 'text-[#cbd5e1]'
                  }`}
                >
                  Tầm nhìn {hud.visibilityPercent}%
                </span>
                <span className="text-[#64748b]" aria-hidden="true">·</span>
                <span
                  className={`font-mono-num tabular-nums ${
                    hud.moveSpeedPercent < 90
                      ? 'text-[#fbbf24]'
                      : hud.moveSpeedPercent > 102
                      ? 'text-[#86efac]'
                      : 'text-[#cbd5e1]'
                  }`}
                >
                  Tốc độ {hud.moveSpeedPercent}%
                </span>
              </div>
              <button
                type="button"
                onClick={onCycleWeather}
                title="Chuyển nhanh kiểu thời tiết (Mưa, Tuyết, Sương mù, Bão tuyết...) để trải nghiệm tầm nhìn, tốc độ & âm thanh (Phím K)"
                className="text-[11px] font-medium text-[#7dd3fc] hover:text-[#bae6fd] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
              >
                Thời tiết [K]
              </button>
            </div>
            <div
              className="mt-0.5 text-[11px] text-[#94a3b8] truncate"
              title={`${hud.weatherEffectNote} · ${hud.weatherAudioNote}`}
            >
              {hud.weatherEffectNote} · <span className="text-[#a5b4fc]">{hud.weatherAudioNote}</span>
            </div>
          </div>

          <div className="mt-1 text-[11px] text-[#a3e635] truncate" title={hud.questObjective}>
            {hud.questObjective}
          </div>

          {/* Tamed Pet Companion & Loyalty ('Độ trung thành') Bar */}
          {hud.companion ? (
            <div className="mt-2 pt-2 border-t border-[#23322c] pointer-events-auto">
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <div className="min-w-0 truncate text-[#f7f4eb]">
                  <span className="font-semibold text-[#fde047]">{hud.companion.customName}</span>
                  <span className="mx-1 text-[#64748b]" aria-hidden="true">·</span>
                  <span className="text-[#cbd5e1]">{hud.companion.speciesName}</span>
                  <span className="mx-1 text-[#64748b]" aria-hidden="true">·</span>
                  <span className="text-[#7dd3fc]">{PET_MODE_LABELS[hud.companion.mode]}</span>
                </div>
                <button
                  type="button"
                  onClick={onOpenPetModal}
                  className="text-[11px] font-medium text-[#e8c468] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Đặt tên [P]
                </button>
              </div>

              <div className="mt-1 flex items-center gap-2">
                <svg className="w-28 sm:w-36 h-2 rounded-sm overflow-hidden shrink-0" viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden="true">
                  <rect width="100" height="8" fill="#1d2a25" />
                  <rect
                    width={Math.max(0, Math.min(100, hud.companion.loyalty))}
                    height="8"
                    fill={
                      hud.companion.loyalty >= 80
                        ? '#a3e635'
                        : hud.companion.loyalty >= 45
                        ? '#38bdf8'
                        : hud.companion.loyalty >= 20
                        ? '#fbbf24'
                        : '#ef4444'
                    }
                  />
                </svg>
                <span className="text-[11px] font-mono-num tabular-nums text-[#cbd5e1] whitespace-nowrap truncate">
                  Độ trung thành {hud.companion.loyalty}/100 · {hud.companion.loyaltyStatus}
                </span>
                <button
                  type="button"
                  onClick={onFeedOrTame}
                  title="Cho thú cưng ăn 1 Trái Cây (+18 Độ trung thành) hoặc Thuần hóa thú gần đó (Phím F)"
                  className="ml-auto text-[11px] font-medium text-[#86efac] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Cho ăn [F]
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-1.5 pt-1.5 border-t border-[#23322c] flex items-center justify-between gap-2 text-[11px] text-[#94a3b8] pointer-events-auto">
              <span className="truncate">Đến gần thú hoang &amp; nhấn [F] để thuần hóa</span>
              <button
                type="button"
                onClick={onOpenPetModal}
                className="text-[#e8c468] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
              >
                Hướng dẫn [P]
              </button>
            </div>
          )}
        </div>

        {/* Top-Center: Hazard Warning / Location Discovery Banner / Boss Bar */}
        <div className="hidden md:flex flex-col items-center gap-1.5 pointer-events-auto">
          {hud.activeHazardAlert && (
            <div className="bg-[#2a0e0e]/95 border border-[#ef4444] rounded-lg px-4 py-2 shadow-lg max-w-md text-center animate-pulse">
              <span className="text-xs font-semibold text-[#fca5a5]">{hud.activeHazardAlert}</span>
            </div>
          )}
          {hud.bossSpawned ? (
            <div className="flex flex-col items-center bg-[#181310]/95 border border-[#f59e0b] rounded-lg px-5 py-2.5 shadow-lg min-w-[300px]">
              <div className="flex items-center justify-between w-full text-xs font-semibold text-[#fef3c7]">
                <span>{hud.bossName}</span>
                <span className="font-mono-num tabular-nums">
                  {hud.bossHp}/{hud.bossMaxHp}
                </span>
              </div>
              <svg className="mt-1.5 w-full h-2.5 rounded-sm overflow-hidden" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true">
                <rect width="100" height="10" fill="#291e14" />
                <rect width={Math.max(0, Math.min(100, (hud.bossHp / hud.bossMaxHp) * 100))} height="10" fill="#f59e0b" />
              </svg>
            </div>
          ) : hud.locationArrivalBanner ? (
            <div className="flex flex-col items-center bg-[#101815]/95 border border-[#e8c468]/70 rounded-lg px-5 py-2.5 shadow-lg max-w-md text-center">
              <span className="text-[11px] text-[#e8c468]">Địa điểm mới được ghi nhận</span>
              <span className="mt-0.5 text-xs font-medium text-[#f7f4eb]">{hud.locationArrivalBanner}</span>
            </div>
          ) : null}
        </div>

        {/* Top-Right: Codex, Crafting, Mute, Pause & Minimap */}
        <div className="flex items-start gap-2.5 pointer-events-auto">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onOpenCodex}
                title="Bách Khoa Sinh Quyển: Thực Vật, Động Vật, Côn Trùng & Vi Khuẩn (B)"
                className="h-10 px-3 rounded-lg bg-[#101815]/92 border border-[#36532c] hover:border-[#a3e635] text-xs font-medium text-[#d9f99d] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Sinh Quyển [{hud.discoveredSpeciesIds.length}/{hud.totalSpeciesCount}]
              </button>
              <button
                type="button"
                onClick={onOpenJournal}
                title="Nhật Ký & Bản Ghi Lịch Sử Hành Trình (L)"
                className="h-10 px-3 rounded-lg bg-[#101815]/92 border border-[#4a3b2c] hover:border-[#fde047] text-xs font-medium text-[#fcd34d] transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5"
              >
                <span>Nhật Ký [L]</span>
                {hud.journalEntries.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-mono-num">
                    {hud.journalEntries.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={onOpenCrafting}
                title="Bàn Chế Tạo & Tổ Hợp Nguyên Liệu (C)"
                className={`h-10 px-3 rounded-lg bg-[#101815]/92 border text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
                  readyUpgrades > 0
                    ? 'border-[#e8c468] text-[#fde68a] hover:bg-[#192621]'
                    : 'border-[#2a3b34] hover:border-[#e8c468] text-[#f2efe9]'
                }`}
              >
                {readyUpgrades > 0 ? `Chế Tạo [C] · ${readyUpgrades}` : 'Chế Tạo [C]'}
              </button>
              <button
                type="button"
                onClick={onOpenBuildMenu}
                title="Danh Mục Kiến Trúc: Tường Gỗ, Tường Đá, Sàn Nền, Tháp Thu Nước Mưa & Trạm Tiện Ích (B)"
                className="h-10 px-3 rounded-lg bg-[#101815]/92 border border-amber-500/50 hover:border-amber-400 text-xs font-medium text-amber-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5"
              >
                <span>🔨 Xây Dựng [B]</span>
              </button>
              <button
                type="button"
                onClick={onOpenSkillTree}
                title="Cây Kỹ Năng Nhân Vật: Tăng tốc độ di chuyển, sức bền & kháng thời tiết khắc nghiệt (T)"
                className={`h-10 px-3 rounded-lg bg-[#101815]/92 border text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
                  readySkills > 0
                    ? 'border-[#4ade80] text-[#bbf7d0] hover:bg-[#16281f]'
                    : 'border-[#2a3b34] hover:border-[#4ade80] text-[#f2efe9]'
                }`}
              >
                {readySkills > 0 ? `Kỹ Năng [T] · ${readySkills}` : `Kỹ Năng [T]`}
              </button>
              <button
                type="button"
                onClick={onOpenPetModal}
                title="Quản lý Thú Cưng Đồng Hành, Đặt Tên & Độ Trung Thành (P)"
                className={`h-10 px-3 rounded-lg bg-[#101815]/92 border text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  hud.companion
                    ? 'border-[#38bdf8]/70 text-[#bae6fd] hover:border-[#fde047]'
                    : 'border-[#2a3b34] hover:border-[#e8c468] text-[#f2efe9]'
                }`}
              >
                {hud.companion ? `Thú Cưng [P]` : 'Thuần Hóa [P]'}
              </button>
              <button
                type="button"
                onClick={onOpenMultiplayer}
                title="Chế độ chơi nhiều người Co-op (WebSocket Real-Time) - Phím M"
                className="h-10 px-3 rounded-lg bg-[#101815]/92 border border-emerald-500/50 hover:border-emerald-400 text-xs font-medium text-emerald-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5"
              >
                <span className={`h-2 w-2 rounded-full ${multiplayerStatus?.isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                Đồng Đội [M] {multiplayerStatus && multiplayerStatus.count > 0 ? `(${multiplayerStatus.count})` : ''}
              </button>
              <button
                type="button"
                onClick={onToggleMute}
                aria-label={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
                className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#101815]/92 border border-[#2a3b34] hover:border-[#e8c468] text-[#e7e5dc] transition-colors shrink-0 cursor-pointer"
              >
                {isMuted ? (
                  <svg className="w-4 h-4 text-[#94a3b8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 5L6 9H2v6h4l5 4V5z" />
                    <line x1="23" y1="9" x2="17" y2="15" />
                    <line x1="17" y1="9" x2="23" y2="15" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-[#e8c468]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 5L6 9H2v6h4l5 4V5z" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  </svg>
                )}
              </button>
              <button
                type="button"
                onClick={onPause}
                aria-label="Tạm dừng trò chơi"
                className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#101815]/92 border border-[#2a3b34] hover:border-[#e8c468] text-[#e7e5dc] transition-colors shrink-0 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              </button>
            </div>

            <div className="text-right text-[11px] text-[#c8c4b8] tabular-nums pr-0.5">
              Bản Đồ Trái Đất · Địa danh {hud.discoveredLocationIds.length}/{hud.totalLocationsCount} · Đã mở {hud.exploredPercent}%
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenMap}
            title="Mở Bản Đồ Thế Giới Trái Đất — 6 Châu Lục & Dịch Chuyển Nhanh (M)"
            className="relative w-[154px] h-[88px] sm:w-[196px] sm:h-[112px] rounded-lg overflow-hidden bg-[#081b26] border border-[#344940] hover:border-[#e8c468] shadow-md shrink-0 cursor-pointer"
          >
            <EarthMapCanvas
              mode="minimap"
              mapData={liveMapData}
              discoveredLocationIds={hud.discoveredLocationIds}
              className="w-full h-full block"
            />
            <span className="absolute bottom-1 left-1.5 text-[10px] font-medium text-[#f7f4eb]/90 drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)] whitespace-nowrap">
              Trái Đất
            </span>
            <span className="absolute bottom-1 right-1.5 text-[10px] font-mono-num text-[#e8c468] bg-[#08131a]/85 px-1 rounded">
              [M]
            </span>
          </button>
        </div>
      </div>

      {/* BOTTOM PERIMETER CLUSTER */}
      <div className="flex flex-col items-center gap-2">
        {hud.interactPrompt && (
          <div className="px-3.5 py-1.5 rounded-md bg-[#101815]/95 border border-[#a3e635]/70 text-xs font-medium text-[#ecfccb] shadow-md">
            {hud.interactPrompt}
          </div>
        )}

        <div className="pointer-events-auto bg-[#101815]/94 border border-[#2a3b34] rounded-lg px-3 py-2 shadow-lg flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-1.5">
            {/* Slot 1: Sword & Harvester */}
            <button
              type="button"
              onClick={() => onSelectSlot(0)}
              className={`h-11 px-2.5 rounded-md border flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                hud.selectedSlot === 0
                  ? 'bg-[#1f3029] border-[#e8c468] text-[#f7f4eb]'
                  : 'bg-[#141e1a] border-[#263630] text-[#cbd5e1] hover:border-[#476257]'
              }`}
            >
              <span className="text-[10px] font-mono-num text-[#94a3b8]">1</span>
              <span className="text-xs font-medium">{SWORD_NAMES[hud.equipment.swordTier]}</span>
            </button>

            {/* Slot 2: 400x Microscope & Bio-Scanner */}
            <button
              type="button"
              onClick={() => onSelectSlot(1)}
              title="Kính Hiển Vi 400x & Quét Vi Khuẩn / Sinh Vật (Phím 2 hoặc V)"
              className={`h-11 px-2.5 rounded-md border flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                hud.selectedSlot === 1
                  ? 'bg-[#1c311b] border-[#a3e635] text-[#ecfccb]'
                  : 'bg-[#141e1a] border-[#263630] text-[#cbd5e1] hover:border-[#a3e635]/60'
              }`}
            >
              <span className="text-[10px] font-mono-num text-[#94a3b8]">2</span>
              <svg className="w-4 h-4 text-[#a3e635]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                <circle cx="11" cy="11" r="2.5" />
              </svg>
              <span className="text-xs font-medium">Kính Hiển Vi [V]</span>
            </button>

            {/* Slot 3: Eat Fruit */}
            <button
              type="button"
              onClick={() => onSelectSlot(2)}
              title="Ăn Trái Cây (+18 HP, +35 Thể lực)"
              className="h-11 px-2.5 rounded-md border bg-[#141e1a] border-[#263630] hover:border-[#fb7185] text-[#f2efe9] flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span className="text-[10px] font-mono-num text-[#94a3b8]">3</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#fb7185]" />
              <span className="text-xs font-mono-num">{hud.inventory.berry}</span>
            </button>

            {/* Slot 4: Antibiotic Potion */}
            <button
              type="button"
              onClick={() => onSelectSlot(3)}
              title="Dùng Dược Thảo Kháng Sinh (+60 HP, phím 4 hoặc Q)"
              className="h-11 px-2.5 rounded-md border bg-[#141e1a] border-[#263630] hover:border-[#34d399] text-[#f2efe9] flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span className="text-[10px] font-mono-num text-[#94a3b8]">4</span>
              <span className="w-2.5 h-2.5 rounded-sm bg-[#34d399]" />
              <span className="text-xs font-mono-num">{hud.inventory.potion}</span>
            </button>

            {/* Slots 5 & 6: Campfire & Bioluminescent Lantern */}
            {BUILDABLE_SLOTS.map((b, idx) => {
              const keyNum = idx + 5;
              const isSelected = hud.selectedSlot === b.slotIndex;
              return (
                <button
                  key={b.kind}
                  type="button"
                  onClick={() => onSelectSlot(b.slotIndex)}
                  title={`${b.name}: ${b.shortDesc}`}
                  className={`h-11 px-2.5 rounded-md border flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-[#1f3029] border-[#e8c468] text-[#fde68a]'
                      : 'bg-[#141e1a] border-[#263630] text-[#cbd5e1] hover:border-[#476257]'
                  }`}
                >
                  <span className="text-[10px] font-mono-num text-[#94a3b8]">{keyNum}</span>
                  <span className="text-xs font-medium hidden md:inline">{b.name}</span>
                </button>
              );
            })}
          </div>

          {/* Unboxed Tabular Resource Strip with Perishable Freshness Meter */}
          <div className="flex items-center gap-2.5 sm:pl-3 sm:border-l border-[#263630] text-xs">
            <div
              className={`text-[10px] font-mono-num px-2 py-1 rounded border flex items-center gap-1.5 whitespace-nowrap cursor-help ${
                hud.isPreservedByStructure
                  ? 'bg-[#0f242d] border-[#38bdf8]/50 text-[#7dd3fc]'
                  : hud.perishableFreshness > 50
                  ? 'bg-[#0f241a] border-[#34d399]/40 text-[#86efac]'
                  : 'bg-[#2a1711] border-[#f87171]/50 text-[#fca5a5]'
              }`}
              title={`Độ tươi thực phẩm: ${hud.perishableStatusNote}`}
            >
              <span>{hud.isPreservedByStructure ? '❄️' : '🌿'}</span>
              <span className="font-semibold tabular-nums">{hud.perishableStatusNote}</span>
            </div>

            {resourceKeys.map((rk) => {
              const meta = RESOURCE_META[rk];
              const isPerishable = rk === 'berry' || rk === 'bioSample';
              return (
                <div
                  key={rk}
                  className="flex items-center gap-1 whitespace-nowrap"
                  title={isPerishable ? `${meta.name} (Hàng mau hỏng)` : meta.name}
                >
                  <svg className="w-2 h-2 shrink-0" viewBox="0 0 8 8" aria-hidden="true">
                    <rect width="8" height="8" rx="1.5" fill={meta.color} />
                  </svg>
                  <span className="text-[#94a3b8] hidden xl:inline">{meta.shortName}</span>
                  <span className="font-mono-num font-semibold text-[#f2efe9] tabular-nums">
                    {hud.inventory[rk]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
