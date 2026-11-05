import React, { useMemo, useState } from 'react';
import { sound } from '../game/audio';
import { ARMOR_WEATHER_RESIST, RESOURCE_META, canAfford } from '../game/recipes';
import {
  SKILL_BRANCHES,
  SKILL_BY_ID,
  SKILL_TREE_NODES,
  SkillIconKind,
  SkillNodeDef,
  computePassiveSkillBonuses,
  isSkillPrerequisiteMet,
} from '../game/skillTree';
import { HudSnapshot, ResourceId } from '../game/types';

interface SkillTreeModalProps {
  hud: HudSnapshot;
  onClose: () => void;
  onUnlockSkill: (skillId: string) => void;
}

const GATHERED_RESOURCE_KEYS: ResourceId[] = [
  'wood',
  'stone',
  'iron',
  'crystal',
  'berry',
  'bioSample',
];

function ResourceSmallIcon({ id, className = 'w-4 h-4' }: { id: ResourceId; className?: string }) {
  switch (id) {
    case 'wood':
      return (
        <svg className={className} viewBox="0 0 28 28" fill="none" aria-hidden="true">
          <rect x="4" y="13" width="20" height="7" rx="3.5" fill="#9a5b25" />
          <rect x="6" y="7" width="16" height="6.5" rx="3.2" fill="#c88a4b" />
          <circle cx="20.5" cy="16.5" r="2.2" fill="#fde68a" />
        </svg>
      );
    case 'stone':
      return (
        <svg className={className} viewBox="0 0 28 28" fill="none" aria-hidden="true">
          <polygon points="5,20 8,9 17,7 23,14 21,21" fill="#94a3b8" />
          <polygon points="8,9 17,7 15,14 6,16" fill="#cbd5e1" />
        </svg>
      );
    case 'iron':
      return (
        <svg className={className} viewBox="0 0 28 28" fill="none" aria-hidden="true">
          <polygon points="5,18 9,10 21,10 24,18" fill="#cbd5e1" />
          <polygon points="9,10 21,10 19,14 7,14" fill="#f8fafc" />
          <rect x="7" y="18" width="15" height="3" fill="#64748b" />
        </svg>
      );
    case 'crystal':
      return (
        <svg className={className} viewBox="0 0 28 28" fill="none" aria-hidden="true">
          <polygon points="14,3 21,12 17,24 11,24 7,12" fill="#38bdf8" />
          <polygon points="14,3 18,12 14,22 10,12" fill="#bae6fd" />
        </svg>
      );
    case 'berry':
      return (
        <svg className={className} viewBox="0 0 28 28" fill="none" aria-hidden="true">
          <circle cx="11" cy="16" r="5.5" fill="#fb7185" />
          <circle cx="18" cy="17" r="5" fill="#f43f5e" />
          <path d="M14 11C14 7 18 5 21 6" stroke="#4ade80" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );
    case 'bioSample':
    default:
      return (
        <svg className={className} viewBox="0 0 28 28" fill="none" aria-hidden="true">
          <circle cx="14" cy="14" r="9" fill="#1a2e19" stroke="#a3e635" strokeWidth="2" />
          <circle cx="11.5" cy="12.5" r="2.2" fill="#a3e635" />
          <circle cx="17" cy="15.5" r="1.8" fill="#bef264" />
          <path d="M10 17.5Q14 14 17.5 18" stroke="#4ade80" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
  }
}

function SkillNodeIcon({
  kind,
  accent,
  unlocked,
  className = 'w-9 h-9',
}: {
  kind: SkillIconKind;
  accent: string;
  unlocked: boolean;
  className?: string;
}) {
  const strokeMain = unlocked ? accent : '#94a3b8';
  const fillSoft = unlocked ? accent : '#64748b';

  switch (kind) {
    case 'swift_step':
      return (
        <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden="true">
          <path d="M7 22H21M5 27H17" stroke={strokeMain} strokeWidth="2.2" strokeLinecap="round" />
          <path
            d="M16 14L20 23L31 25C33 25.4 34 28 31.8 29H15V14H16Z"
            fill={fillSoft}
            fillOpacity="0.28"
            stroke={strokeMain}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M23 11L31 8L27 16" stroke="#e0f2fe" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'river_stride':
      return (
        <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden="true">
          <path d="M6 27C10 24 14 30 19 27C24 24 29 30 34 27" stroke={strokeMain} strokeWidth="2.2" strokeLinecap="round" />
          <path d="M8 32C12 29 17 34 22 31C27 28 30 33 34 31" stroke="#7dd3fc" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="20" cy="15" r="5.5" fill={fillSoft} fillOpacity="0.3" stroke={strokeMain} strokeWidth="2" />
          <path d="M20 9V6M14 15H11M29 15H26" stroke="#bae6fd" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'gale_dash':
      return (
        <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden="true">
          <path d="M6 15H25C28.5 15 30.5 12.5 29 10C27.5 8 24.5 9 24 11" stroke={strokeMain} strokeWidth="2.2" strokeLinecap="round" />
          <path d="M4 21H32L27 17M32 21L27 25" stroke="#e0f2fe" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 27H23C26 27 28 29.5 26.5 31.5C25 33.5 22.5 32.5 22 30.5" stroke={strokeMain} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'horizon_runner':
      return (
        <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden="true">
          <circle cx="20" cy="20" r="12" stroke={strokeMain} strokeWidth="2" />
          <polygon points="20,9 24,20 20,17.5 16,20" fill={accent} />
          <polygon points="20,31 16,20 20,22.5 24,20" fill="#94a3b8" />
          <circle cx="20" cy="20" r="2.2" fill="#f8fafc" />
        </svg>
      );
    case 'steady_breath':
      return (
        <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden="true">
          <path
            d="M21 7L11 21H20L18 33L29 19H20L21 7Z"
            fill={fillSoft}
            fillOpacity="0.28"
            stroke={strokeMain}
            strokeWidth="2.1"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'vital_core':
      return (
        <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden="true">
          <path
            d="M20 32L17.6 29.8C10.4 23.3 6 19.3 6 14.2C6 10.2 9.1 7 13.1 7C15.4 7 17.7 8.1 20 10C22.3 8.1 24.6 7 26.9 7C30.9 7 34 10.2 34 14.2C34 19.3 29.6 23.3 22.4 29.8L20 32Z"
            fill={fillSoft}
            fillOpacity="0.28"
            stroke={strokeMain}
            strokeWidth="2"
          />
          <path d="M16 18H24M20 14V22" stroke="#ecfccb" strokeWidth="2.1" strokeLinecap="round" />
        </svg>
      );
    case 'pulse_recovery':
      return (
        <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden="true">
          <rect x="6" y="8" width="28" height="24" rx="5" fill={fillSoft} fillOpacity="0.16" stroke={strokeMain} strokeWidth="1.9" />
          <path
            d="M9 21H14.5L17.5 13.5L21.5 26.5L24.8 18.5L27 21H31"
            stroke="#86efac"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'ancient_vigor':
      return (
        <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden="true">
          <path
            d="M20 6L31 11V19.5C31 26.5 26.2 31.8 20 34C13.8 31.8 9 26.5 9 19.5V11L20 6Z"
            fill={fillSoft}
            fillOpacity="0.26"
            stroke={strokeMain}
            strokeWidth="2.1"
          />
          <path d="M20 12C23.5 15 24 20 20 25C16 20 16.5 15 20 12Z" fill="#bbf7d0" />
        </svg>
      );
    case 'rain_cloak':
      return (
        <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden="true">
          <path
            d="M8 21C8 14.4 13.4 9 20 9C26.6 9 32 14.4 32 21H8Z"
            fill={fillSoft}
            fillOpacity="0.28"
            stroke={strokeMain}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M20 21V29C20 31.2 18.2 32.5 16.5 31.5" stroke={strokeMain} strokeWidth="2.1" strokeLinecap="round" />
          <path d="M12 6L10.5 9M20 4.5L18.5 7.5M28 6L26.5 9" stroke="#93c5fd" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'storm_sight':
      return (
        <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden="true">
          <path
            d="M5 20C8.8 13.5 14.2 10.5 20 10.5C25.8 10.5 31.2 13.5 35 20C31.2 26.5 25.8 29.5 20 29.5C14.2 29.5 8.8 26.5 5 20Z"
            fill={fillSoft}
            fillOpacity="0.22"
            stroke={strokeMain}
            strokeWidth="2"
          />
          <circle cx="20" cy="20" r="4.5" fill={accent} />
          <circle cx="21.4" cy="18.6" r="1.4" fill="#0f172a" />
        </svg>
      );
    case 'thermal_blood':
      return (
        <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden="true">
          <path
            d="M20 7C20 7 28 15.5 28 22.5C28 27.2 24.4 31 20 31C15.6 31 12 27.2 12 22.5C12 15.5 20 7 20 7Z"
            fill={fillSoft}
            fillOpacity="0.28"
            stroke={strokeMain}
            strokeWidth="2"
          />
          <path d="M20 16V26M16 21H24" stroke="#fef08a" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'climate_master':
    default:
      return (
        <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden="true">
          <circle cx="20" cy="20" r="6.5" fill={fillSoft} fillOpacity="0.34" stroke={strokeMain} strokeWidth="2.1" />
          <path
            d="M20 6V10M20 30V34M6 20H10M30 20H34M10.2 10.2L13 13M27 27L29.8 29.8M29.8 10.2L27 13M13 27L10.2 29.8"
            stroke="#fde047"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
  }
}

export const SkillTreeModal: React.FC<SkillTreeModalProps> = ({
  hud,
  onClose,
  onUnlockSkill,
}) => {
  const unlockedSet = useMemo(() => new Set(hud.unlockedSkillIds), [hud.unlockedSkillIds]);

  const initialDefaultId = useMemo(() => {
    const firstUnlockable = SKILL_TREE_NODES.find(
      (n) => !unlockedSet.has(n.id) && isSkillPrerequisiteMet(n, unlockedSet) && canAfford(hud.inventory, n.costs)
    );
    if (firstUnlockable) return firstUnlockable.id;
    const firstNext = SKILL_TREE_NODES.find(
      (n) => !unlockedSet.has(n.id) && isSkillPrerequisiteMet(n, unlockedSet)
    );
    return firstNext ? firstNext.id : SKILL_TREE_NODES[0].id;
  }, [hud.inventory, unlockedSet]);

  const [selectedSkillId, setSelectedSkillId] = useState<string>(initialDefaultId);

  const selectedSkill: SkillNodeDef =
    SKILL_BY_ID[selectedSkillId] || SKILL_TREE_NODES[0];

  const bonuses = useMemo(
    () => computePassiveSkillBonuses(hud.unlockedSkillIds),
    [hud.unlockedSkillIds]
  );

  const armorWeatherResist = ARMOR_WEATHER_RESIST[hud.equipment.armorTier] || 0;
  const totalWeatherResistPct = Math.round(
    Math.min(0.92, armorWeatherResist + bonuses.weatherResistBonus) * 100
  );
  const skillWeatherResistPct = Math.round(bonuses.weatherResistBonus * 100);
  const moveBonusPct = Math.round(bonuses.moveSpeedBonus * 100);
  const staminaRegenPct = Math.round(bonuses.staminaRegenBonus * 100);
  const stormVisionPct = Math.round(bonuses.weatherVisibilityBonus * 100);

  const isSelectedUnlocked = unlockedSet.has(selectedSkill.id);
  const isSelectedPrereqMet = isSkillPrerequisiteMet(selectedSkill, unlockedSet);
  const isSelectedAffordable = canAfford(hud.inventory, selectedSkill.costs);
  const canUnlockSelected =
    !isSelectedUnlocked && isSelectedPrereqMet && isSelectedAffordable;

  const parentSkill = selectedSkill.parentId ? SKILL_BY_ID[selectedSkill.parentId] : null;
  const selectedBranchMeta = SKILL_BRANCHES.find((b) => b.id === selectedSkill.branch)!;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-3 sm:p-5 bg-[#070d0b]/86">
      <div className="w-full max-w-6xl max-h-[93vh] flex flex-col bg-[#0f1815] border border-[#2d423a] rounded-xl p-5 sm:p-6 shadow-2xl overflow-hidden">
        {/* Header Row */}
        <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#21332c]">
          <div>
            <h2 className="font-display text-2xl font-bold text-[#f7f4eb]">
              Cây Kỹ Năng Sinh Tồn &amp; Thích Nghi
            </h2>
            <p className="mt-1 text-xs text-[#b8b4a8] tabular-nums">
              Đã lĩnh hội {hud.unlockedSkillIds.length}/{SKILL_TREE_NODES.length} kỹ năng thụ động · Tiêu hao nguyên liệu thu thập được để tăng tốc độ di chuyển, sức bền và kháng thời tiết khắc nghiệt
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-lg bg-[#182520] hover:bg-[#22352e] border border-[#31473f] text-xs font-medium text-[#e7e5dc] whitespace-nowrap shrink-0 cursor-pointer"
          >
            Đóng [T / Esc]
          </button>
        </div>

        {/* Gathered Resource Inventory & Active Passive Summary Bar */}
        <div className="py-3 border-b border-[#21332c] flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3.5 text-xs">
            <span className="text-[#94a3b8] font-medium">Kho tài nguyên:</span>
            {GATHERED_RESOURCE_KEYS.map((rk) => {
              const meta = RESOURCE_META[rk];
              return (
                <div key={rk} className="flex items-center gap-1.5 whitespace-nowrap">
                  <ResourceSmallIcon id={rk} className="w-4 h-4 shrink-0" />
                  <span className="text-[#cbd5e1]">{meta.shortName}</span>
                  <span className="font-mono-num font-semibold text-[#f7f4eb] tabular-nums">
                    {hud.inventory[rk]}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-[#cbd5e1] tabular-nums">
            <span className="text-[#38bdf8] font-medium">
              Tốc độ +{moveBonusPct}%
            </span>
            <span className="text-[#64748b]" aria-hidden="true">·</span>
            <span className="text-[#4ade80] font-medium">
              Thể lực {hud.maxStamina} (+{staminaRegenPct}% hồi)
            </span>
            <span className="text-[#64748b]" aria-hidden="true">·</span>
            <span className="text-[#fbbf24] font-medium">
              Kháng thời tiết +{skillWeatherResistPct}% (Tổng {totalWeatherResistPct}%)
            </span>
            {stormVisionPct > 0 && (
              <>
                <span className="text-[#64748b]" aria-hidden="true">·</span>
                <span className="text-[#fde047] font-medium">
                  Tầm nhìn bão +{stormVisionPct}%
                </span>
              </>
            )}
          </div>
        </div>

        {/* Main 2-Zone Layout: 3-Branch Skill Tree Canvas (Left) + Skill Node Inspector (Right) */}
        <div className="mt-4 flex-1 min-h-0 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-5 pr-1">
          {/* Left 8 Columns: 3-Branch Connected Skill Tree */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            {SKILL_BRANCHES.map((branch) => {
              const branchNodes = SKILL_TREE_NODES.filter((n) => n.branch === branch.id);
              const unlockedInBranch = branchNodes.filter((n) => unlockedSet.has(n.id)).length;

              return (
                <div key={branch.id} className="flex flex-col">
                  {/* Branch Header */}
                  <div className="pb-2.5 mb-2 border-b border-[#21332c]">
                    <div className="flex items-center justify-between gap-2">
                      <h3
                        className={`text-sm font-semibold whitespace-nowrap ${
                          branch.id === 'mobility'
                            ? 'text-[#38bdf8]'
                            : branch.id === 'endurance'
                            ? 'text-[#4ade80]'
                            : 'text-[#fbbf24]'
                        }`}
                      >
                        {branch.title}
                      </h3>
                      <span className="text-xs font-mono-num text-[#94a3b8] tabular-nums whitespace-nowrap">
                        {unlockedInBranch}/{branchNodes.length}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-[#94a3b8] truncate" title={branch.subtitle}>
                      {branch.subtitle}
                    </p>
                  </div>

                  {/* Connected Tier Nodes (Tier I -> Tier IV) */}
                  <div className="flex flex-col items-stretch">
                    {branchNodes.map((node, idx) => {
                      const isUnlocked = unlockedSet.has(node.id);
                      const prereqMet = isSkillPrerequisiteMet(node, unlockedSet);
                      const affordable = canAfford(hud.inventory, node.costs);
                      const isReady = !isUnlocked && prereqMet && affordable;
                      const isSelected = selectedSkill.id === node.id;

                      const statusText = isUnlocked
                        ? 'Đã mở khóa'
                        : !prereqMet
                        ? `Cần Bậc ${node.tier - 1}`
                        : affordable
                        ? 'Sẵn sàng mở'
                        : 'Thiếu nguyên liệu';

                      return (
                        <React.Fragment key={node.id}>
                          {idx > 0 && (
                            <div className="flex justify-center py-0.5" aria-hidden="true">
                              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                                <line
                                  x1="12"
                                  y1="1"
                                  x2="12"
                                  y2="19"
                                  stroke={
                                    isUnlocked
                                      ? node.accentColor
                                      : prereqMet
                                      ? '#64748b'
                                      : '#25362f'
                                  }
                                  strokeWidth="2.2"
                                  strokeDasharray={isUnlocked ? undefined : '3 3'}
                                />
                                <polygon
                                  points="8,16 12,22 16,16"
                                  fill={
                                    isUnlocked
                                      ? node.accentColor
                                      : prereqMet
                                      ? '#64748b'
                                      : '#25362f'
                                  }
                                />
                              </svg>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              sound.unlock();
                              sound.playUiClick();
                              setSelectedSkillId(node.id);
                            }}
                            className={`w-full text-left rounded-lg p-3 border transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-[#192b24] border-[#e8c468]'
                                : isUnlocked
                                ? 'bg-[#14241e] border-[#385c4b] hover:border-[#86efac]'
                                : isReady
                                ? 'bg-[#14201c] border-[#4b6a5c] hover:border-[#e8c468]'
                                : prereqMet
                                ? 'bg-[#111a17] border-[#25362f] hover:border-[#3c544a]'
                                : 'bg-[#0c1311] border-[#1b2823] opacity-75 hover:opacity-95'
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <div className="w-10 h-10 rounded-md bg-[#0b1210] border border-[#22342d] flex items-center justify-center shrink-0">
                                <SkillNodeIcon
                                  kind={node.iconKind}
                                  accent={node.accentColor}
                                  unlocked={isUnlocked || isReady}
                                  className="w-7 h-7"
                                />
                              </div>

                              <div className="min-w-0 flex-1">
                                {/* Unboxed Tier & Status Metadata */}
                                <div className="flex items-center gap-1.5 text-[11px] tabular-nums">
                                  <span className="text-[#94a3b8]">{node.tierLabel}</span>
                                  <span className="text-[#475569]" aria-hidden="true">·</span>
                                  <span
                                    className={
                                      isUnlocked
                                        ? 'text-[#86efac] font-medium'
                                        : isReady
                                        ? 'text-[#fde047] font-medium'
                                        : prereqMet
                                        ? 'text-[#cbd5e1]'
                                        : 'text-[#64748b]'
                                    }
                                  >
                                    {statusText}
                                  </span>
                                </div>

                                <div className="mt-0.5 text-xs font-semibold text-[#f7f4eb] truncate">
                                  {node.name}
                                </div>
                                <div className="mt-0.5 text-[11px] text-[#cbd5e1] leading-snug">
                                  {node.statSummary}
                                </div>
                              </div>
                            </div>

                            {/* Compact Cost Row */}
                            {!isUnlocked && (
                              <div className="mt-2 pt-2 border-t border-[#1e2e28] flex flex-wrap items-center gap-2 text-[11px] font-mono-num tabular-nums">
                                {(Object.entries(node.costs) as [ResourceId, number][]).map(
                                  ([resId, amt]) => {
                                    const have = hud.inventory[resId] || 0;
                                    const enough = have >= amt;
                                    return (
                                      <span
                                        key={resId}
                                        className={enough ? 'text-[#cbd5e1]' : 'text-[#fca5a5]'}
                                      >
                                        {RESOURCE_META[resId].shortName} {amt}
                                      </span>
                                    );
                                  }
                                )}
                              </div>
                            )}
                          </button>
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right 4 Columns: Detailed Node Inspector & Unlock Action */}
          <div className="lg:col-span-4 bg-[#121d19] border border-[#293d35] rounded-lg p-4 sm:p-5 flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-lg bg-[#0b1210] border border-[#293d35] flex items-center justify-center shrink-0">
                  <SkillNodeIcon
                    kind={selectedSkill.iconKind}
                    accent={selectedSkill.accentColor}
                    unlocked={isSelectedUnlocked || canUnlockSelected}
                    className="w-9 h-9"
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-[#94a3b8]">
                    <span>{selectedBranchMeta.title}</span>
                    <span className="mx-1.5" aria-hidden="true">·</span>
                    <span>{selectedSkill.tierLabel}</span>
                  </div>
                  <h3 className="mt-0.5 font-display text-lg font-bold text-[#f7f4eb]">
                    {selectedSkill.name}
                  </h3>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-[#21332c]">
                <div className="text-xs font-semibold text-[#fde047]">
                  Hiệu ứng thụ động: {selectedSkill.shortPerk}
                </div>
                <p className="mt-1.5 text-xs text-[#cbd5e1] leading-relaxed">
                  {selectedSkill.description}
                </p>
              </div>

              {/* Prerequisite Line */}
              <div className="mt-3 pt-3 border-t border-[#21332c] text-xs">
                <span className="text-[#94a3b8]">Điều kiện nhánh: </span>
                {parentSkill ? (
                  <span
                    className={
                      isSelectedPrereqMet
                        ? 'text-[#86efac] font-medium'
                        : 'text-[#fbbf24] font-medium'
                    }
                  >
                    {parentSkill.name} ({isSelectedPrereqMet ? 'Đã lĩnh hội' : 'Chưa mở khóa'})
                  </span>
                ) : (
                  <span className="text-[#86efac] font-medium">
                    Kỹ năng khởi đầu — Không cần điều kiện trước
                  </span>
                )}
              </div>

              {/* Resource Requirements Table */}
              <div className="mt-3 pt-3 border-t border-[#21332c]">
                <div className="text-xs font-semibold text-[#e2e8f0]">
                  Nguyên liệu tiêu hao để mở khóa
                </div>
                <div className="mt-2 divide-y divide-[#1d2e27]">
                  {(Object.entries(selectedSkill.costs) as [ResourceId, number][]).map(
                    ([resId, requiredAmt]) => {
                      const haveAmt = hud.inventory[resId] || 0;
                      const enough = haveAmt >= requiredAmt;
                      const meta = RESOURCE_META[resId];
                      return (
                        <div
                          key={resId}
                          className="py-2 flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <ResourceSmallIcon id={resId} className="w-4 h-4 shrink-0" />
                            <span className="text-[#e2e8f0] truncate">{meta.name}</span>
                          </div>
                          <span
                            className={`font-mono-num tabular-nums whitespace-nowrap font-semibold ${
                              isSelectedUnlocked
                                ? 'text-[#86efac]'
                                : enough
                                ? 'text-[#f7f4eb]'
                                : 'text-[#fca5a5]'
                            }`}
                          >
                            {isSelectedUnlocked
                              ? `Đã chi ${requiredAmt}`
                              : `${haveAmt} / ${requiredAmt}`}
                          </span>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            </div>

            {/* Primary Unlock Action + Character Passive Overview */}
            <div className="pt-3 border-t border-[#21332c]">
              <button
                type="button"
                disabled={!canUnlockSelected}
                onClick={() => onUnlockSkill(selectedSkill.id)}
                className={`w-full h-11 px-4 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  isSelectedUnlocked
                    ? 'bg-[#1a3326] border border-[#365e48] text-[#86efac] cursor-default'
                    : canUnlockSelected
                    ? 'bg-[#e8c468] hover:bg-[#f2d27e] text-[#111916] cursor-pointer'
                    : 'bg-[#18231f] border border-[#283933] text-[#94a3b8] cursor-not-allowed'
                }`}
              >
                {isSelectedUnlocked
                  ? 'Đã Mở Khóa Kỹ Năng Này'
                  : !isSelectedPrereqMet
                  ? 'Cần Mở Kỹ Năng Bậc Trước'
                  : !isSelectedAffordable
                  ? 'Chưa Đủ Tài Nguyên Thu Thập'
                  : 'Mở Khóa Kỹ Năng'}
              </button>

              <div className="mt-3 text-[11px] text-[#94a3b8] leading-relaxed tabular-nums">
                Tổng cộng từ Cây Kỹ Năng: Máu +{bonuses.maxHpBonus} HP · Thể lực +{bonuses.maxStaminaBonus} · Giảm sát thương +{bonuses.damageReductionBonusPct}% · Lướt -{bonuses.dashStaminaDiscount} TL
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
