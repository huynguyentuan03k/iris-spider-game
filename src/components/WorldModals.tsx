import React, { useState } from 'react';
import {
  BiomeRegion,
  GROUP_LABELS,
  HABIT_LABELS,
  OrganismGroup,
  REGION_LABELS,
  SPECIES_CATALOG,
  WORLD_LOCATIONS,
} from '../game/biodiversity';
import {
  ActiveDialogue,
  GameState,
  HudSnapshot,
  PetMode,
  PlacedStructure,
  StructureKind,
  WorldMapRenderData,
} from '../game/types';
import { sound } from '../game/audio';
import { TILE_SIZE, formatCoordLabel, tileToLonLat } from '../game/worldGen';
import { BuildMenuModal } from './BuildMenuModal';
import { CraftingWorkbenchModal } from './CraftingWorkbenchModal';
import { EarthMapCanvas } from './EarthMapCanvas';
import { JournalLogbookModal } from './JournalLogbookModal';
import { PetCompanionModal } from './PetCompanionModal';
import { SkillTreeModal } from './SkillTreeModal';
import { SpeciesIllustration } from './SpeciesIllustration';
import { StorageChestModal } from './StorageChestModal';
import { WeaponUpgradeModal } from './WeaponUpgradeModal';
import { BuildableStructureSpec } from '../game/recipes';

interface WorldModalsProps {
  gameState: GameState;
  hud: HudSnapshot;
  dialogue: ActiveDialogue | null;
  userEmail: string | null;
  cloudSyncStatus: string | null;
  getMapData: () => WorldMapRenderData | null;
  activeStructure?: PlacedStructure | null;
  onResume: () => void;
  onCraft: (recipeId: string) => void;
  onUnlockSkill: (skillId: string) => void;
  onFastTravel: (x: number, y: number) => void;
  onAdvanceDialogue: () => void;
  onOpenCrafting: () => void;
  onOpenSkillTree: () => void;
  onOpenPetModal: () => void;
  onOpenCodex: () => void;
  onOpenJournal: () => void;
  onDepositStorage?: (resource: 'berry' | 'bioSample', amount: number) => void;
  onWithdrawStorage?: (resource: 'berry' | 'bioSample', amount: number) => void;
  onDepositAllStorage?: () => void;
  onWithdrawAllStorage?: () => void;
  onRenamePet: (newName: string) => void;
  onSetPetMode: (mode: PetMode) => void;
  onFeedPet: (food: 'berry' | 'potion') => void;
  onReleasePet: () => void;
  onSaveManual: () => void;
  onGoogleAuth: () => void;
  onRespawnSanctuary: () => void;
  onRestartNewWorld: () => void;
  onReturnTitle: () => void;
  onOpenPhaserLab?: () => void;
  onSelectStructureToBuild?: (spec: BuildableStructureSpec) => void;
}

type RegionFilterKey = 'ALL' | 'MARINE' | 'RIVER' | 'SAVANNA' | 'FOREST' | 'DESERT' | 'MOUNTAIN';

const REGION_FILTERS: { key: RegionFilterKey; label: string; match: BiomeRegion[] }[] = [
  { key: 'ALL', label: 'Tất cả khu vực', match: [] },
  { key: 'MARINE', label: 'Biển & Đại Dương', match: [BiomeRegion.OCEAN, BiomeRegion.COAST] },
  { key: 'RIVER', label: 'Sông & Châu Thổ', match: [BiomeRegion.RIVER, BiomeRegion.RIVERBANK] },
  { key: 'SAVANNA', label: 'Thảo Nguyên', match: [BiomeRegion.SAVANNA] },
  { key: 'FOREST', label: 'Rừng Mưa', match: [BiomeRegion.FOREST] },
  { key: 'DESERT', label: 'Sa Mạc & Ốc Đảo', match: [BiomeRegion.DESERT] },
  { key: 'MOUNTAIN', label: 'Núi & Đỉnh Tuyết', match: [BiomeRegion.MOUNTAIN, BiomeRegion.SNOW_PEAK] },
];

export const WorldModals: React.FC<WorldModalsProps> = ({
  gameState,
  hud,
  dialogue,
  userEmail,
  cloudSyncStatus,
  getMapData,
  activeStructure,
  onResume,
  onCraft,
  onUnlockSkill,
  onFastTravel,
  onAdvanceDialogue,
  onOpenCrafting,
  onOpenSkillTree,
  onOpenPetModal,
  onOpenCodex,
  onOpenJournal,
  onDepositStorage,
  onWithdrawStorage,
  onDepositAllStorage,
  onWithdrawAllStorage,
  onRenamePet,
  onSetPetMode,
  onFeedPet,
  onReleasePet,
  onSaveManual,
  onGoogleAuth,
  onRespawnSanctuary,
  onRestartNewWorld,
  onReturnTitle,
  onOpenPhaserLab,
  onSelectStructureToBuild,
}) => {
  const [regionFilter, setRegionFilter] = useState<RegionFilterKey>('ALL');
  const [groupFilter, setGroupFilter] = useState<'ALL' | OrganismGroup>('ALL');
  const [selectedMapLocId, setSelectedMapLocId] = useState<string>('loc_biosphere_hub');

  if (gameState === GameState.TITLE || gameState === GameState.PLAYING) {
    return null;
  }

  // BUILD MENU MODAL
  if (gameState === GameState.BUILD_MENU) {
    return (
      <BuildMenuModal
        isOpen={true}
        inventory={hud.inventory}
        onClose={onResume}
        onSelectStructureToBuild={(spec) => {
          if (onSelectStructureToBuild) {
            onSelectStructureToBuild(spec);
          }
          onResume();
        }}
      />
    );
  }

  // 0A. PRESERVATION STORAGE STRUCTURE MODAL
  if (gameState === GameState.STORAGE) {
    return (
      <StorageChestModal
        isOpen={true}
        hud={hud}
        structure={activeStructure || null}
        onDeposit={onDepositStorage || (() => {})}
        onWithdraw={onWithdrawStorage || (() => {})}
        onDepositAll={onDepositAllStorage || (() => {})}
        onWithdrawAll={onWithdrawAllStorage || (() => {})}
        onClose={onResume}
      />
    );
  }

  // 0. CHRONICLE & DISCOVERY JOURNAL MODAL
  if (gameState === GameState.JOURNAL) {
    return (
      <JournalLogbookModal
        isOpen={true}
        onClose={onResume}
        entries={hud.journalEntries}
        dayCount={hud.dayCount}
        clockLabel={hud.clockLabel}
        timeLabel={hud.timeLabel}
        beaconsActivated={hud.beaconsActivated}
        beaconsTotal={hud.beaconsTotal}
        discoveredSpeciesCount={hud.discoveredSpeciesIds.length}
        totalSpeciesCount={hud.totalSpeciesCount}
        companionName={hud.companion?.customName || null}
        companionSpecies={hud.companion?.speciesName || null}
      />
    );
  }

  // 1. BIODIVERSITY CODEX MODAL (Thực vật · Động vật · Côn trùng · Vi khuẩn)
  if (gameState === GameState.CODEX) {
    const discoveredSet = new Set(hud.discoveredSpeciesIds);
    const activeRegionSpec = REGION_FILTERS.find((r) => r.key === regionFilter)!;

    const filteredSpecies = SPECIES_CATALOG.filter((sp) => {
      if (regionFilter !== 'ALL' && !activeRegionSpec.match.includes(sp.region)) {
        return false;
      }
      if (groupFilter !== 'ALL' && sp.group !== groupFilter) {
        return false;
      }
      return true;
    });

    return (
      <div className="fixed inset-0 z-30 flex items-center justify-center p-4 sm:p-6 bg-[#080d0b]/82">
        <div className="w-full max-w-5xl max-h-[90vh] flex flex-col bg-[#101815] border border-[#2d4038] rounded-xl p-6 shadow-2xl overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#22312b]">
            <div>
              <h2 className="font-display text-2xl font-bold text-[#f7f4eb]">
                Bách Khoa Sinh Quyển Thế Giới
              </h2>
              <p className="mt-1 text-xs text-[#b8b4a8] tabular-nums">
                Đã phân tích {hud.discoveredSpeciesIds.length}/{SPECIES_CATALOG.length} loài sinh vật · Đã đặt chân tới {hud.discoveredLocationIds.length}/{WORLD_LOCATIONS.length} địa danh · Bấm [V] ngoài thực địa để soi kính hiển vi 400x
              </p>
            </div>
            <button
              type="button"
              onClick={onResume}
              className="h-10 px-4 rounded-lg bg-[#182420] hover:bg-[#21322c] border border-[#31453d] text-xs font-medium text-[#e7e5dc] whitespace-nowrap shrink-0 cursor-pointer"
            >
              Đóng [B / Esc]
            </button>
          </div>

          {/* Interactive Filter Controls (Region + Organism Kingdom) */}
          <div className="py-3 border-b border-[#22312b] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1 p-1 bg-[#0b110f] rounded-lg">
              {REGION_FILTERS.map((rf) => (
                <button
                  key={rf.key}
                  type="button"
                  onClick={() => {
                    sound.unlock();
                    sound.playUiClick();
                    setRegionFilter(rf.key);
                  }}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    regionFilter === rf.key
                      ? 'bg-[#21352d] text-[#e8c468]'
                      : 'text-[#94a3b8] hover:text-[#f2efe9]'
                  }`}
                >
                  {rf.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-1 p-1 bg-[#0b110f] rounded-lg">
              <button
                type="button"
                onClick={() => {
                  sound.unlock();
                  sound.playUiClick();
                  setGroupFilter('ALL');
                }}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  groupFilter === 'ALL'
                    ? 'bg-[#1f3422] text-[#a3e635]'
                    : 'text-[#94a3b8] hover:text-[#f2efe9]'
                }`}
              >
                Tất cả nhóm
              </button>
              {(Object.keys(GROUP_LABELS) as OrganismGroup[]).map((gk) => (
                <button
                  key={gk}
                  type="button"
                  onClick={() => {
                    sound.unlock();
                    sound.playUiClick();
                    setGroupFilter(gk);
                  }}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    groupFilter === gk
                      ? 'bg-[#1f3422] text-[#a3e635]'
                      : 'text-[#94a3b8] hover:text-[#f2efe9]'
                  }`}
                >
                  {GROUP_LABELS[gk]}
                </button>
              ))}
            </div>
          </div>

          {/* Species Catalog Grid */}
          <div className="mt-4 overflow-y-auto pr-1 grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredSpecies.map((sp) => {
              const found = discoveredSet.has(sp.id);
              return (
                <div
                  key={sp.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    found
                      ? 'bg-[#141f1b] border-[#2d443a]'
                      : 'bg-[#0e1513] border-[#1c2823] opacity-85'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    {/* Detailed 64x64 Anatomical Specimen Illustration */}
                    <div className="w-16 h-16 rounded-lg bg-[#090f0d] border border-[#23332c] flex items-center justify-center shrink-0 overflow-hidden">
                      <SpeciesIllustration
                        speciesId={sp.id}
                        species={sp}
                        discovered={found}
                        className="w-14 h-14"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <h3 className="text-sm font-semibold text-[#f7f4eb] truncate">
                          {sp.name}
                        </h3>
                        <span className={`text-[11px] shrink-0 ${found ? 'text-[#a3e635]' : 'text-[#64748b]'}`}>
                          {found ? 'Đã thu mẫu' : 'Chưa quét'}
                        </span>
                      </div>

                      {/* Zero-Pill Unboxed Taxonomic & Circadian Metadata */}
                      <div className="mt-0.5 text-[11px] text-[#94a3b8]">
                        <span className="italic text-[#cbd5e1]">{sp.scientificName}</span>
                        <span className="mx-1.5" aria-hidden="true">·</span>
                        <span>{GROUP_LABELS[sp.group]}</span>
                        <span className="mx-1.5" aria-hidden="true">·</span>
                        <span className="text-[#e8c468]">{REGION_LABELS[sp.region]}</span>
                        {sp.activityHabit && (
                          <>
                            <span className="mx-1.5" aria-hidden="true">·</span>
                            <span
                              className={
                                sp.activityHabit === 'NOCTURNAL'
                                  ? 'text-[#fbbf24]'
                                  : sp.activityHabit === 'CREPUSCULAR'
                                  ? 'text-[#c084fc]'
                                  : 'text-[#7dd3fc]'
                              }
                            >
                              {HABIT_LABELS[sp.activityHabit]}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Morphological Shape Detail */}
                      <p className="mt-1.5 text-[11px] text-[#dce7df] leading-snug">
                        <span className="text-[#86efac] font-medium">Hình thái:</span> {sp.morphology}
                      </p>

                      <p className="mt-1 text-xs text-[#b8b4a8] leading-relaxed">
                        {sp.ecologicalRole}
                      </p>

                      {/* Acoustic Signature + Interactive Sound Preview Button */}
                      <div className="mt-2.5 pt-2 border-t border-[#1e2d27] flex items-center justify-between gap-2">
                        <span className="text-[11px] text-[#94a3b8] truncate" title={sp.soundLabel}>
                          Âm sinh học · {sp.soundLabel}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            sound.unlock();
                            sound.playSpeciesSound(sp.id, 1);
                          }}
                          title={`Phát âm thanh: ${sp.soundLabel}`}
                          className="h-8 px-2.5 rounded-md bg-[#192822] hover:bg-[#233830] border border-[#2f493e] text-[11px] font-medium text-[#e8c468] flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <svg
                            className="w-3.5 h-3.5 text-[#e8c468] shrink-0"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            aria-hidden="true"
                          >
                            <path d="M11 5L6 9H2v6h4l5 4V5z" />
                            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                          </svg>
                          <span>Nghe âm thanh</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // 2. NPC DIALOGUE OVERLAY
  if (gameState === GameState.DIALOGUE && dialogue) {
    return (
      <div className="fixed inset-0 z-30 flex items-end justify-center p-5 sm:p-8 bg-[#090f0d]/35">
        <div className="w-full max-w-2xl bg-[#101815] border border-[#3a5248] rounded-xl p-6 shadow-2xl">
          <div className="flex items-center justify-between gap-4 text-xs text-[#c8c4b8]">
            <div>
              <span className="font-semibold text-sm text-[#e8c468]">{dialogue.npcName}</span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span>{dialogue.npcRole}</span>
            </div>
            <span className="font-mono-num text-[#94a3b8]">
              {dialogue.lineIndex + 1}/{dialogue.lines.length}
            </span>
          </div>

          <p className="mt-3 text-base text-[#f2efe9] leading-relaxed">
            {dialogue.lines[dialogue.lineIndex]}
          </p>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={onAdvanceDialogue}
              className="h-10 px-5 rounded-lg bg-[#e8c468] hover:bg-[#f2d27e] text-[#111916] text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {dialogue.lineIndex + 1 < dialogue.lines.length ? 'Tiếp Tục [E]' : 'Hoàn Tất [E]'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. ADVANCED VISUAL CRAFTING WORKBENCH MODAL
  if (gameState === GameState.CRAFTING) {
    return (
      <CraftingWorkbenchModal
        hud={hud}
        onClose={onResume}
        onCraft={onCraft}
      />
    );
  }

  // 3A. CHARACTER PASSIVE SKILL TREE MODAL
  if (gameState === GameState.SKILL_TREE) {
    return (
      <SkillTreeModal
        hud={hud}
        onClose={onResume}
        onUnlockSkill={onUnlockSkill}
      />
    );
  }

  // 3B. WILD ANIMAL TAMING & PET COMPANION MODAL
  if (gameState === GameState.PET_COMPANION) {
    return (
      <PetCompanionModal
        hud={hud}
        onClose={onResume}
        onRenamePet={onRenamePet}
        onSetPetMode={onSetPetMode}
        onFeedPet={onFeedPet}
        onReleasePet={onReleasePet}
      />
    );
  }

  // 4. INTERACTIVE PLANET EARTH WORLD ATLAS & 12 GLOBAL LANDMARKS MODAL
  if (gameState === GameState.WORLD_MAP) {
    const mapData = getMapData();
    const campfires = mapData ? mapData.structures.filter((s) => s.kind === StructureKind.CAMPFIRE) : [];
    const selectedLoc =
      WORLD_LOCATIONS.find((l) => l.id === selectedMapLocId) || WORLD_LOCATIONS[0];
    const selectedBeacon = mapData?.beacons.find((b) => b.locationId === selectedLoc.id);
    const isSelectedVisited = hud.discoveredLocationIds.includes(selectedLoc.id);

    return (
      <div className="fixed inset-0 z-30 flex items-center justify-center p-4 sm:p-6 bg-[#060c0e]/84">
        <div className="w-full max-w-6xl max-h-[92vh] overflow-y-auto bg-[#0e1715] border border-[#2d423a] rounded-xl p-5 sm:p-6 shadow-2xl">
          <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#21332c]">
            <div>
              <h2 className="font-display text-2xl font-bold text-[#f7f4eb]">
                Bản Đồ Thế Giới Trái Đất — 6 Châu Lục &amp; 12 Địa Danh
              </h2>
              <p className="mt-1 text-xs text-[#b8b4a8] tabular-nums">
                Vị trí hiện tại: {hud.locationName} ({hud.coordLabel}) · Đã mở {hud.exploredPercent}% bản đồ · Đã đặt chân tới {hud.discoveredLocationIds.length}/{WORLD_LOCATIONS.length} địa danh
              </p>
            </div>
            <button
              type="button"
              onClick={onResume}
              className="h-10 px-4 rounded-lg bg-[#182420] hover:bg-[#21322c] border border-[#31453d] text-xs font-medium text-[#e7e5dc] whitespace-nowrap shrink-0 cursor-pointer"
            >
              Đóng Bản Đồ [M]
            </button>
          </div>

          <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Widescreen Cartographic Planet Earth Map Canvas */}
            <div className="lg:col-span-7 flex flex-col">
              <EarthMapCanvas
                mode="atlas"
                mapData={mapData}
                discoveredLocationIds={hud.discoveredLocationIds}
                selectedLocationId={selectedLoc.id}
                onSelectLocation={setSelectedMapLocId}
                className="w-full aspect-[7/4] rounded-lg border border-[#243d47] cursor-pointer block shadow-inner"
              />

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#cbd5e1]">
                <div className="flex flex-wrap items-center gap-3.5">
                  <span className="flex items-center gap-1.5 whitespace-nowrap">
                    <span className="w-2.5 h-2.5 rounded-full bg-white inline-block" /> Bạn
                  </span>
                  {hud.companion && (
                    <span className="flex items-center gap-1.5 whitespace-nowrap">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#fde047] inline-block" /> {hud.companion.customName}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 whitespace-nowrap">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8] inline-block" /> Trạm Đã Bật
                  </span>
                  <span className="flex items-center gap-1.5 whitespace-nowrap">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] inline-block" /> Trạm Chưa Bật
                  </span>
                  <span className="flex items-center gap-1.5 whitespace-nowrap">
                    <span className="w-2.5 h-2.5 bg-[#f97316] inline-block" /> Đài Đỉnh Himalaya
                  </span>
                </div>
                <span className="text-[#94a3b8]">Nhấp vào điểm trên châu lục để xem &amp; dịch chuyển</span>
              </div>

              {/* Selected Landmark Detail & Instant Expedition Action */}
              <div className="mt-4 pt-4 border-t border-[#21332c] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="text-sm font-semibold text-[#fde047]">{selectedLoc.name}</span>
                    <span className="text-[#64748b]" aria-hidden="true">·</span>
                    <span className="text-[#cbd5e1]">{selectedLoc.continent}</span>
                    <span className="text-[#64748b]" aria-hidden="true">·</span>
                    <span className="font-mono-num text-[#7dd3fc] tabular-nums">
                      {formatCoordLabel(selectedLoc.lon, selectedLoc.lat)}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-[#a3e635]">
                    {REGION_LABELS[selectedLoc.region]}
                    {selectedBeacon
                      ? selectedBeacon.activated
                        ? ' · Trạm Quan Trắc đã kích hoạt'
                        : ' · Có Trạm Quan Trắc cần kích hoạt [E]'
                      : ''}
                    {isSelectedVisited ? ' · Đã khảo sát' : ''}
                  </div>
                  <p className="mt-1 text-xs text-[#c8c4b8] leading-relaxed">
                    {selectedLoc.subtitle}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onFastTravel(
                      (selectedLoc.tx + 0.5) * TILE_SIZE,
                      (selectedLoc.ty + 0.5) * TILE_SIZE
                    )
                  }
                  className="h-10 px-4 rounded-lg bg-[#e8c468] hover:bg-[#f2d27e] text-[#111916] text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Dịch Chuyển Tới Đây
                </button>
              </div>
            </div>

            {/* Right Column: All 12 Earth Locations across 6 Continents + Field Campfires */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-semibold text-[#e8c468]">
                  12 Địa Danh Tự Nhiên Khắp Thế Giới
                </h3>
                <div className="mt-2 max-h-[300px] overflow-y-auto divide-y divide-[#1d2c26] pr-1">
                  {WORLD_LOCATIONS.map((loc) => {
                    const visited = hud.discoveredLocationIds.includes(loc.id);
                    const isSelected = loc.id === selectedLoc.id;
                    return (
                      <div
                        key={loc.id}
                        className={`py-2.5 px-2 rounded-md flex items-center justify-between gap-2 transition-colors ${
                          isSelected ? 'bg-[#172822]' : 'hover:bg-[#13201b]'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedMapLocId(loc.id)}
                          className="min-w-0 text-left flex-1 cursor-pointer"
                        >
                          <div className="flex items-center gap-1.5 text-xs">
                            <span
                              className={`truncate ${
                                isSelected
                                  ? 'font-semibold text-[#fde047]'
                                  : visited
                                  ? 'font-semibold text-[#f7f4eb]'
                                  : 'font-medium text-[#cbd5e1]'
                              }`}
                            >
                              {loc.name}
                            </span>
                          </div>
                          <div className="mt-0.5 text-[11px] text-[#94a3b8] truncate tabular-nums">
                            {loc.continent} · {formatCoordLabel(loc.lon, loc.lat)}
                            {visited ? ' · Đã tới' : ''}
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            onFastTravel(
                              (loc.tx + 0.5) * TILE_SIZE,
                              (loc.ty + 0.5) * TILE_SIZE
                            )
                          }
                          className="h-8 px-2.5 rounded-md bg-[#1a2b24] hover:bg-[#e8c468] hover:text-[#111916] text-[11px] font-medium text-[#e8c468] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          Tới Ngay
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {campfires.length > 1 && (
                <div className="pt-3 border-t border-[#21332c]">
                  <h3 className="text-xs font-semibold text-[#fdba74]">
                    Lửa Trại Thực Địa Đã Dựng ({campfires.length - 1})
                  </h3>
                  <div className="mt-1.5 max-h-[105px] overflow-y-auto divide-y divide-[#1d2c26] pr-1">
                    {campfires.slice(1).map((cf, index) => {
                      const { lon, lat } = tileToLonLat(cf.x / TILE_SIZE, cf.y / TILE_SIZE);
                      return (
                        <div key={cf.id} className="py-1.5 flex items-center justify-between gap-2">
                          <div>
                            <div className="text-xs font-medium text-[#f7f4eb]">
                              Lửa Trại #{index + 1}
                            </div>
                            <div className="text-[11px] font-mono-num text-[#94a3b8] tabular-nums">
                              {formatCoordLabel(lon, lat)}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => onFastTravel(cf.x, cf.y)}
                            className="h-8 px-2.5 rounded-md bg-[#1a2b24] hover:bg-[#fb923c] hover:text-[#111916] text-[11px] font-medium text-[#fdba74] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            Dịch Chuyển
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 5. PAUSE MODAL (With Cloud Sync Status)
  if (gameState === GameState.PAUSED) {
    return (
      <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-[#080d0b]/75">
        <div className="w-full max-w-md bg-[#101815] border border-[#2d4038] rounded-xl p-6 shadow-2xl text-center">
          <h2 className="font-display text-2xl font-bold text-[#f7f4eb]">Tạm Dừng Khảo Sát</h2>
          <p className="mt-1.5 text-xs text-[#b8b4a8] tabular-nums">
            {hud.locationName} · Đã thu mẫu {hud.discoveredSpeciesIds.length}/{hud.totalSpeciesCount} loài
          </p>
          {cloudSyncStatus && (
            <p className="mt-1 text-xs text-[#a3e635]">{cloudSyncStatus}</p>
          )}

          <div className="mt-6 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={onResume}
              className="h-11 px-5 rounded-lg bg-[#e8c468] hover:bg-[#f2d27e] text-[#111916] font-semibold text-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Tiếp Tục Thám Hiểm
            </button>
            <button
              type="button"
              onClick={onOpenCodex}
              className="h-11 px-5 rounded-lg bg-[#17231f] hover:bg-[#20312b] border border-[#36532c] text-[#d9f99d] font-medium text-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Bách Khoa Sinh Quyển [B]
            </button>
            <button
              type="button"
              onClick={onOpenJournal}
              className="h-11 px-5 rounded-lg bg-[#17231f] hover:bg-[#20312b] border border-[#4a3b2c] text-[#fcd34d] font-medium text-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Nhật Ký Hành Trình [L]</span>
              {hud.journalEntries.length > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[11px] bg-amber-500/20 text-amber-300 font-mono-num">
                  {hud.journalEntries.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={onOpenCrafting}
              className="h-11 px-5 rounded-lg bg-[#17231f] hover:bg-[#20312b] border border-[#2d4038] text-[#f2efe9] font-medium text-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Mở Bàn Chế Tạo [C]
            </button>
            <button
              type="button"
              onClick={onOpenSkillTree}
              className="h-11 px-5 rounded-lg bg-[#17231f] hover:bg-[#20312b] border border-[#2f4f3c] text-[#bbf7d0] font-medium text-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Cây Kỹ Năng Nhân Vật [T]
            </button>
            <button
              type="button"
              onClick={onOpenPetModal}
              className="h-11 px-5 rounded-lg bg-[#17231f] hover:bg-[#20312b] border border-[#2d4038] text-[#bae6fd] font-medium text-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Thú Cưng Đồng Hành [P]
            </button>
            {onOpenPhaserLab && (
              <button
                type="button"
                onClick={onOpenPhaserLab}
                className="h-11 px-5 rounded-lg bg-gradient-to-r from-amber-800/80 via-amber-700/80 to-yellow-700/80 hover:from-amber-700 hover:to-yellow-600 border border-amber-500/50 text-amber-200 font-semibold text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>🎨 Thử Nghiệm Đồ Họa Fantasy [Phaser Lab]</span>
              </button>
            )}
            <button
              type="button"
              onClick={onSaveManual}
              className="h-11 px-5 rounded-lg bg-[#17231f] hover:bg-[#20312b] border border-[#2d4038] text-[#f2efe9] font-medium text-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {userEmail ? 'Lưu Tiến Trình & Đám Mây' : 'Lưu Tiến Trình Máy'}
            </button>
            {!userEmail && (
              <button
                type="button"
                onClick={onGoogleAuth}
                className="h-11 px-5 rounded-lg bg-[#152229] hover:bg-[#1c2f38] border border-[#294957] text-[#7dd3fc] font-medium text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Kết Nối Google Để Đồng Bộ Đám Mây
              </button>
            )}
            <button
              type="button"
              onClick={onReturnTitle}
              className="h-10 px-5 rounded-lg bg-transparent hover:bg-[#1a2622] text-[#94a3b8] hover:text-[#f2efe9] font-medium text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Lưu & Về Sảnh Chờ (Lobby)
            </button>
          </div>
        </div>
      </div>
    );
  }


  // 6. WEAPON UPGRADE BENCH MODAL
  if (gameState === GameState.UPGRADE) {
    return (
      <WeaponUpgradeModal
        hud={hud}
        onClose={onResume}
        onUpgrade={(weaponId, upgradeId) => {
          console.log(`Upgrading ${weaponId} with ${upgradeId}`);
        }}
      />
    );
  }

  // 6. VICTORY / GAME OVER MODAL
  const isVictory = gameState === GameState.VICTORY;
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-[#080d0b]/82">
      <div className="w-full max-w-lg bg-[#101815] border border-[#3a5248] rounded-xl p-7 shadow-2xl text-center">
        <h2 className="font-display text-3xl font-bold text-[#f7f4eb]">
          {isVictory ? 'Chinh Phục Đỉnh Sinh Quyển!' : 'Lữ Khách Cần Hồi Sức'}
        </h2>
        <p className="mt-2 text-sm text-[#cbd5e1] leading-relaxed">
          {isVictory
            ? 'Bạn đã hoàn tất sứ mệnh trên Đỉnh Tuyết Himalaya! Bản đồ Trái Đất vẫn luôn rộng mở để bạn tiếp tục thu thập trọn bộ Thực Vật, Động Vật, Côn Trùng và Vi Khuẩn trên khắp 6 châu lục.'
            : 'Thiên nhiên hoang dã đầy thử thách đã làm bạn kiệt sức. Hãy hồi sinh tại Trạm Sinh Quyển Địa Cầu để tiếp tục chuyến khảo sát.'}
        </p>

        <div className="mt-5 py-4 border-y border-[#22312b] grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div>
            <div className="text-lg font-mono-num font-bold text-[#a3e635]">
              {hud.discoveredSpeciesIds.length}/{hud.totalSpeciesCount}
            </div>
            <div className="text-[11px] text-[#94a3b8]">Loài đã quét</div>
          </div>
          <div>
            <div className="text-lg font-mono-num font-bold text-[#e8c468]">
              {hud.discoveredLocationIds.length}/{hud.totalLocationsCount}
            </div>
            <div className="text-[11px] text-[#94a3b8]">Địa danh</div>
          </div>
          <div>
            <div className="text-lg font-mono-num font-bold text-[#f7f4eb]">{hud.dayCount}</div>
            <div className="text-[11px] text-[#94a3b8]">Ngày khảo sát</div>
          </div>
          <div>
            <div className="text-lg font-mono-num font-bold text-[#38bdf8]">{hud.exploredPercent}%</div>
            <div className="text-[11px] text-[#94a3b8]">Bản đồ mở</div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {isVictory ? (
            <button
              type="button"
              onClick={onResume}
              className="h-11 px-6 rounded-lg bg-[#e8c468] hover:bg-[#f2d27e] text-[#111916] font-semibold text-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Tiếp Tục Khám Phá
            </button>
          ) : (
            <button
              type="button"
              onClick={onRespawnSanctuary}
              className="h-11 px-6 rounded-lg bg-[#e8c468] hover:bg-[#f2d27e] text-[#111916] font-semibold text-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Hồi Sinh Tại Trạm Trung Tâm
            </button>
          )}

          <button
            type="button"
            onClick={onRestartNewWorld}
            className="h-11 px-5 rounded-lg bg-[#17231f] hover:bg-[#20312b] border border-[#2d4038] text-[#f2efe9] font-medium text-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Khởi Tạo Lục Địa Mới
          </button>
        </div>
      </div>
    </div>
  );
};
