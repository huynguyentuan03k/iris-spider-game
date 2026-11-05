import React, { useEffect, useMemo, useState } from 'react';
import {
  ARMOR_DAMAGE_REDUCTION_PCT,
  ARMOR_HP_BONUS,
  ARMOR_NAMES,
  ARMOR_WEATHER_RESIST,
  BUILDABLE_SLOTS,
  CRAFT_RECIPES,
  CraftCategory,
  CraftRecipe,
  RESOURCE_META,
  RecipeIconKind,
  SWORD_DAMAGE,
  SWORD_NAMES,
  SWORD_REACH,
  TOOL_NAMES,
  TOOL_POWER,
  TOOL_YIELD_BONUS,
  canAfford,
} from '../game/recipes';
import { HudSnapshot, ResourceId } from '../game/types';

interface CraftingWorkbenchModalProps {
  hud: HudSnapshot;
  onClose: () => void;
  onCraft: (recipeId: string) => void;
}

const CATEGORY_TABS: { key: 'all' | CraftCategory; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'weapon', label: 'Vũ Khí' },
  { key: 'tool', label: 'Công Cụ' },
  { key: 'armor', label: 'Giáp Bảo Hộ' },
  { key: 'refining', label: 'Luyện Kim & Dược' },
];

const RAW_MATERIAL_KEYS: ResourceId[] = ['wood', 'stone', 'crystal', 'iron', 'berry', 'bioSample'];

const QUICK_COMBOS: { label: string; materials: ResourceId[] }[] = [
  { label: 'Gỗ + Đá', materials: ['wood', 'stone'] },
  { label: 'Gỗ + Đá + Tinh Thể', materials: ['wood', 'stone', 'crystal'] },
  { label: 'Gỗ + Đá + Sắt', materials: ['wood', 'stone', 'iron'] },
  { label: 'Tinh Thể + Mẫu Vi Sinh', materials: ['crystal', 'bioSample'] },
];

function ResourceIconSvg({ id, className = 'w-5 h-5' }: { id: ResourceId; className?: string }) {
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
      return (
        <svg className={className} viewBox="0 0 28 28" fill="none" aria-hidden="true">
          <circle cx="14" cy="14" r="9" fill="#1a2e19" stroke="#a3e635" strokeWidth="2" />
          <circle cx="11.5" cy="12.5" r="2.2" fill="#a3e635" />
          <circle cx="17" cy="15.5" r="1.8" fill="#bef264" />
          <path d="M10 17.5Q14 14 17.5 18" stroke="#4ade80" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case 'potion':
    default:
      return (
        <svg className={className} viewBox="0 0 28 28" fill="none" aria-hidden="true">
          <rect x="11" y="4" width="6" height="4" rx="1" fill="#cbd5e1" />
          <path d="M10 9H18L22 19C22.6 20.8 21.3 23 19.2 23H8.8C6.7 23 5.4 20.8 6 19L10 9Z" fill="#34d399" />
        </svg>
      );
  }
}

function RecipeItemSvg({
  kind,
  accent,
  className = 'w-9 h-9',
}: {
  kind: RecipeIconKind;
  accent: string;
  className?: string;
}) {
  if (kind.startsWith('sword_')) {
    return (
      <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <path d="M29 7L33 11L16 28L12 24L29 7Z" fill={accent} />
        <path d="M31 6L34 9L30 13L27 10L31 6Z" fill="#f8fafc" />
        <rect x="9" y="22" width="10" height="3.2" rx="1.5" transform="rotate(45 9 22)" fill="#e8c468" />
        <path d="M7 31L11 27L13.5 29.5L9.5 33.5L7 31Z" fill="#9a5b25" />
      </svg>
    );
  }

  if (kind.startsWith('tool_')) {
    return (
      <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <path d="M10 31L25 16" stroke="#c88a4b" strokeWidth="4" strokeLinecap="round" />
        <path d="M17 9C23 8 29 12 31 18L25 21C23 16 19 14 14 14L17 9Z" fill={accent} />
        <circle cx="24" cy="15" r="2.2" fill="#f8fafc" />
      </svg>
    );
  }

  if (kind.startsWith('armor_')) {
    return (
      <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <path
          d="M13 8L20 11L27 8L32 14L29 20L27 19V31H13V19L11 20L8 14L13 8Z"
          fill={accent}
          fillOpacity="0.88"
        />
        <path d="M20 11V31" stroke="#0b110f" strokeWidth="1.8" />
        <circle cx="20" cy="17" r="2.8" fill="#fef3c7" />
      </svg>
    );
  }

  if (kind === 'refine_crystal') {
    return (
      <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <polygon points="20,5 29,16 25,33 15,33 11,16" fill="#38bdf8" />
        <polygon points="20,5 25,16 20,30 15,16" fill="#e0f2fe" />
      </svg>
    );
  }

  if (kind === 'refine_iron') {
    return (
      <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <polygon points="8,26 13,14 27,14 32,26" fill="#cbd5e1" />
        <polygon points="13,14 27,14 25,19 11,19" fill="#f8fafc" />
      </svg>
    );
  }

  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect x="16" y="7" width="8" height="4" rx="1.5" fill="#e2e8f0" />
      <path d="M15 12H25L30 26C30.8 28.6 28.9 32 26 32H14C11.1 32 9.2 28.6 10 26L15 12Z" fill={accent} />
      <circle cx="18" cy="23" r="2" fill="#ecfccb" />
    </svg>
  );
}

export const CraftingWorkbenchModal: React.FC<CraftingWorkbenchModalProps> = ({
  hud,
  onClose,
  onCraft,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<'all' | CraftCategory>('all');
  const [selectedMaterials, setSelectedMaterials] = useState<ResourceId[]>([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(() => {
    const firstAvailable = CRAFT_RECIPES.find(
      (r) => !(r.isMaxed && r.isMaxed(hud.equipment)) && r.isAvailable(hud.equipment)
    );
    return firstAvailable ? firstAvailable.id : CRAFT_RECIPES[0].id;
  });
  const [lastCraftNotice, setLastCraftNotice] = useState<string | null>(null);

  const toggleMaterialFilter = (mat: ResourceId) => {
    setSelectedMaterials((prev) =>
      prev.includes(mat) ? prev.filter((m) => m !== mat) : [...prev, mat]
    );
  };

  const applyQuickCombo = (materials: ResourceId[]) => {
    const same =
      materials.length === selectedMaterials.length &&
      materials.every((m) => selectedMaterials.includes(m));
    if (same) {
      setSelectedMaterials([]);
    } else {
      setCategoryFilter('all');
      setSelectedMaterials(materials);
    }
  };

  const filteredRecipes = useMemo(() => {
    return CRAFT_RECIPES.filter((recipe) => {
      if (categoryFilter !== 'all' && recipe.category !== categoryFilter) {
        return false;
      }
      if (selectedMaterials.length > 0) {
        // Match recipes that utilize ALL chosen raw materials in the combiner!
        const costKeys = Object.keys(recipe.costs) as ResourceId[];
        for (const reqMat of selectedMaterials) {
          if (!costKeys.includes(reqMat)) return false;
        }
      }
      return true;
    });
  }, [categoryFilter, selectedMaterials]);

  useEffect(() => {
    if (filteredRecipes.length > 0 && !filteredRecipes.some((r) => r.id === selectedRecipeId)) {
      const preferred =
        filteredRecipes.find(
          (r) => !(r.isMaxed && r.isMaxed(hud.equipment)) && canAfford(hud.inventory, r.costs)
        ) || filteredRecipes[0];
      setSelectedRecipeId(preferred.id);
    }
  }, [filteredRecipes, selectedRecipeId, hud.equipment, hud.inventory]);

  const activeRecipe: CraftRecipe =
    CRAFT_RECIPES.find((r) => r.id === selectedRecipeId) || CRAFT_RECIPES[0];

  const isMaxed = activeRecipe.isMaxed ? activeRecipe.isMaxed(hud.equipment) : false;
  const isUnlocked = activeRecipe.isAvailable(hud.equipment);
  const isAffordable = isUnlocked && !isMaxed && canAfford(hud.inventory, activeRecipe.costs);

  const handleTriggerCraft = (recipe: CraftRecipe) => {
    const maxed = recipe.isMaxed ? recipe.isMaxed(hud.equipment) : false;
    if (maxed || !recipe.isAvailable(hud.equipment) || !canAfford(hud.inventory, recipe.costs)) {
      return;
    }
    onCraft(recipe.id);
    setLastCraftNotice(`Đã chế tạo thành công: ${recipe.name}`);

    // If an equipment upgrade was forged, smoothly advance focus to the next tier in that branch if available
    if (recipe.category !== 'refining' && recipe.targetTier !== undefined) {
      const nextInBranch = CRAFT_RECIPES.find(
        (r) => r.category === recipe.category && (r.targetTier || 0) > (recipe.targetTier || 0)
      );
      if (nextInBranch) {
        setSelectedRecipeId(nextInBranch.id);
      }
    }
  };

  const costEntries = Object.entries(activeRecipe.costs) as [ResourceId, number][];

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-3 sm:p-5 bg-[#080d0b]/82">
      <div className="w-full max-w-5xl max-h-[92vh] flex flex-col bg-[#101815] border border-[#2d4038] rounded-xl p-5 sm:p-6 shadow-2xl overflow-hidden">
        {/* TOP HEADER */}
        <div className="flex flex-wrap items-start justify-between gap-4 pb-3.5 border-b border-[#22312b]">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#f7f4eb]">
              Bàn Chế Tạo &amp; Tổ Hợp Nguyên Liệu
            </h2>
            <p className="mt-1 text-xs text-[#b8b4a8]">
              Đang trang bị: <span className="text-[#f2efe9] font-medium">{SWORD_NAMES[hud.equipment.swordTier]}</span>
              <span className="mx-1.5 text-[#64748b]" aria-hidden="true">·</span>
              <span className="text-[#f2efe9] font-medium">{TOOL_NAMES[hud.equipment.toolTier]}</span>
              <span className="mx-1.5 text-[#64748b]" aria-hidden="true">·</span>
              <span className="text-[#f2efe9] font-medium">{ARMOR_NAMES[hud.equipment.armorTier]}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-lg bg-[#182420] hover:bg-[#21322c] border border-[#31453d] text-xs font-medium text-[#e7e5dc] whitespace-nowrap shrink-0 cursor-pointer"
          >
            Đóng [C / Esc]
          </button>
        </div>

        {/* INTERACTIVE RAW MATERIAL PALETTE & COMBINATION FILTER */}
        <div className="py-3 border-b border-[#22312b] flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-[#cbd5e1]">
              Kho nguyên liệu thô <span className="text-[#94a3b8]">(bấm chọn các nguyên liệu để lọc công thức kết hợp):</span>
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {QUICK_COMBOS.map((combo) => {
                const isComboActive =
                  combo.materials.length === selectedMaterials.length &&
                  combo.materials.every((m) => selectedMaterials.includes(m));
                return (
                  <button
                    key={combo.label}
                    type="button"
                    onClick={() => applyQuickCombo(combo.materials)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isComboActive
                        ? 'bg-[#21352d] border-[#e8c468] text-[#fde68a]'
                        : 'bg-[#141f1b] border-[#253630] text-[#94a3b8] hover:text-[#e7e5dc]'
                    }`}
                  >
                    {combo.label}
                  </button>
                );
              })}
              {selectedMaterials.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedMaterials([])}
                  className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#1f2925] hover:bg-[#2a3833] text-[#fca5a5] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Xóa lọc ({selectedMaterials.length})
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {RAW_MATERIAL_KEYS.map((rk) => {
              const meta = RESOURCE_META[rk];
              const active = selectedMaterials.includes(rk);
              const count = hud.inventory[rk] || 0;
              return (
                <button
                  key={rk}
                  type="button"
                  onClick={() => toggleMaterialFilter(rk)}
                  className={`h-11 px-2.5 rounded-lg border flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#1d3129] border-[#e8c468] text-[#f7f4eb]'
                      : 'bg-[#0d1412] border-[#22322c] hover:border-[#3c564c] text-[#cbd5e1]'
                  }`}
                >
                  <span className="flex items-center gap-1.5 min-w-0">
                    <ResourceIconSvg id={rk} className="w-4 h-4 shrink-0" />
                    <span className="text-xs font-medium truncate">{meta.shortName}</span>
                  </span>
                  <span className="font-mono-num text-xs font-semibold text-[#f7f4eb] shrink-0">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* MAIN 2-COLUMN WORKBENCH */}
        <div className="mt-4 flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-5 overflow-y-auto lg:overflow-hidden">
          {/* LEFT COLUMN: CATEGORIZED BLUEPRINT LIST */}
          <div className="lg:col-span-6 flex flex-col min-h-0">
            <div className="flex flex-wrap items-center gap-1 p-1 bg-[#0b110f] rounded-lg mb-3 shrink-0">
              {CATEGORY_TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setCategoryFilter(tab.key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    categoryFilter === tab.key
                      ? 'bg-[#21352d] text-[#e8c468]'
                      : 'text-[#94a3b8] hover:text-[#f2efe9]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-2">
              {filteredRecipes.length === 0 ? (
                <div className="p-6 rounded-lg bg-[#0d1412] border border-[#22312b] text-center">
                  <p className="text-sm text-[#cbd5e1]">
                    Không có công thức nào dùng đồng thời tất cả nguyên liệu đang chọn.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedMaterials([])}
                    className="mt-3 h-9 px-4 rounded-lg bg-[#1d2e28] hover:bg-[#273d35] text-xs font-medium text-[#e8c468] whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Hiển thị toàn bộ công thức
                  </button>
                </div>
              ) : (
                filteredRecipes.map((recipe) => {
                  const maxed = recipe.isMaxed ? recipe.isMaxed(hud.equipment) : false;
                  const unlocked = recipe.isAvailable(hud.equipment);
                  const affordable = unlocked && !maxed && canAfford(hud.inventory, recipe.costs);
                  const isSelected = recipe.id === activeRecipe.id;

                  return (
                    <button
                      key={recipe.id}
                      type="button"
                      onClick={() => {
                        setSelectedRecipeId(recipe.id);
                        setLastCraftNotice(null);
                      }}
                      className={`w-full text-left p-3 rounded-lg border transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-[#182822] border-[#e8c468]'
                          : 'bg-[#121c18] border-[#21302a] hover:border-[#385046]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-lg bg-[#0b110f] border border-[#23332c] flex items-center justify-center shrink-0">
                          <RecipeItemSvg kind={recipe.iconKind} accent={recipe.accentColor} className="w-8 h-8" />
                        </div>

                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-[#f7f4eb] truncate">
                            {recipe.name}
                          </div>

                          {/* Unboxed Zero-Pill Metadata */}
                          <div className="mt-0.5 text-[11px] text-[#94a3b8] flex flex-wrap items-center gap-1.5">
                            <span className="text-[#e8c468]">{recipe.tierLabel}</span>
                            <span aria-hidden="true">·</span>
                            {maxed ? (
                              <span className="text-[#34d399]">Đã trang bị</span>
                            ) : affordable ? (
                              <span className="text-[#a3e635]">Đủ nguyên liệu</span>
                            ) : (
                              <span>Thiếu nguyên liệu</span>
                            )}
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-2.5 text-[11px] font-mono-num">
                            {Object.entries(recipe.costs).map(([rk, amt]) => {
                              const meta = RESOURCE_META[rk as ResourceId];
                              const have = hud.inventory[rk as ResourceId] || 0;
                              const ok = have >= (amt || 0);
                              return (
                                <span key={rk} className={ok ? 'text-[#cbd5e1]' : 'text-[#fca5a5]'}>
                                  {meta.shortName} {have}/{amt}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <span className="text-xs font-medium text-[#94a3b8] shrink-0 hidden sm:inline">
                        {isSelected ? 'Đang chọn' : 'Xem'}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: VISUAL MATERIAL FUSION BENCH & STAT COMPARISON */}
          <div className="lg:col-span-6 flex flex-col justify-between bg-[#0c1311] border border-[#24362f] rounded-xl p-4 sm:p-5 overflow-y-auto">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-[#e8c468]">
                    Sơ Đồ Tổ Hợp Nguyên Liệu · {activeRecipe.tierLabel}
                  </div>
                  <h3 className="mt-0.5 font-display text-lg sm:text-xl font-bold text-[#f7f4eb]">
                    {activeRecipe.name}
                  </h3>
                </div>
                <span className="text-xs font-mono-num text-[#94a3b8] shrink-0">
                  {activeRecipe.outputLabel}
                </span>
              </div>

              <p className="mt-1.5 text-xs text-[#c8c4b8] leading-relaxed">
                {activeRecipe.description}
              </p>

              {/* VISUAL COMBINATION SLOTS: [RAW MATERIALS] -> [FORGED OUTPUT] */}
              <div className="mt-4 p-3.5 rounded-lg bg-[#111b18] border border-[#22332c]">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
                  {costEntries.map(([rk, needed], idx) => {
                    const meta = RESOURCE_META[rk];
                    const have = hud.inventory[rk] || 0;
                    const enough = have >= needed;
                    return (
                      <React.Fragment key={rk}>
                        {idx > 0 && (
                          <span className="text-sm font-bold text-[#64748b] select-none" aria-hidden="true">
                            +
                          </span>
                        )}
                        <div
                          className={`min-w-[82px] px-2.5 py-2 rounded-lg border flex flex-col items-center text-center ${
                            enough
                              ? 'bg-[#15231e] border-[#315243]'
                              : 'bg-[#1c1616] border-[#522d2d]'
                          }`}
                        >
                          <ResourceIconSvg id={rk} className="w-6 h-6" />
                          <span className="mt-1 text-[11px] font-medium text-[#e7e5dc] whitespace-nowrap">
                            {meta.shortName}
                          </span>
                          <span
                            className={`text-[11px] font-mono-num font-semibold ${
                              enough ? 'text-[#86efac]' : 'text-[#fca5a5]'
                            }`}
                          >
                            {have}/{needed}
                          </span>
                        </div>
                      </React.Fragment>
                    );
                  })}

                  <span className="text-base font-bold text-[#e8c468] px-1 select-none" aria-hidden="true">
                    →
                  </span>

                  {/* FORGED RESULT PREVIEW SLOT */}
                  <div className="min-w-[96px] px-3 py-2 rounded-lg bg-[#182822] border border-[#e8c468]/80 flex flex-col items-center text-center">
                    <RecipeItemSvg
                      kind={activeRecipe.iconKind}
                      accent={activeRecipe.accentColor}
                      className="w-8 h-8"
                    />
                    <span className="mt-1 text-[11px] font-semibold text-[#fde68a] whitespace-nowrap">
                      Thành Phẩm
                    </span>
                    <span className="text-[10px] text-[#cbd5e1] whitespace-nowrap">
                      {activeRecipe.tierLabel}
                    </span>
                  </div>
                </div>
              </div>

              {/* LIVE BEFORE -> AFTER STAT COMPARISON */}
              <div className="mt-4 pt-3.5 border-t border-[#1f2f29] space-y-2 text-xs">
                <div className="font-semibold text-[#e7e5dc]">
                  Hiệu quả nâng cấp &amp; thuộc tính kỹ thuật
                </div>

                {activeRecipe.category === 'weapon' && activeRecipe.targetTier && (
                  <div className="space-y-1.5 font-mono-num text-[#cbd5e1]">
                    <div className="flex items-center justify-between">
                      <span className="font-sans text-[#94a3b8]">Sát thương cận chiến:</span>
                      <span>
                        {SWORD_DAMAGE[hud.equipment.swordTier]} →{' '}
                        <strong className="text-[#a3e635]">
                          {SWORD_DAMAGE[Math.max(hud.equipment.swordTier, activeRecipe.targetTier)]}
                        </strong>
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-sans text-[#94a3b8]">Tầm vung kiếm:</span>
                      <span>
                        {SWORD_REACH[hud.equipment.swordTier]}px →{' '}
                        <strong className="text-[#7dd3fc]">
                          {SWORD_REACH[Math.max(hud.equipment.swordTier, activeRecipe.targetTier)]}px
                        </strong>
                      </span>
                    </div>
                  </div>
                )}

                {activeRecipe.category === 'tool' && activeRecipe.targetTier && (
                  <div className="space-y-1.5 font-mono-num text-[#cbd5e1]">
                    <div className="flex items-center justify-between">
                      <span className="font-sans text-[#94a3b8]">Sức công phá tài nguyên:</span>
                      <span>
                        {TOOL_POWER[hud.equipment.toolTier]} →{' '}
                        <strong className="text-[#a3e635]">
                          {TOOL_POWER[Math.max(hud.equipment.toolTier, activeRecipe.targetTier)]}
                        </strong>
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-sans text-[#94a3b8]">Sản lượng thu hoạch thêm:</span>
                      <span>
                        +{TOOL_YIELD_BONUS[hud.equipment.toolTier]} →{' '}
                        <strong className="text-[#fde68a]">
                          +{TOOL_YIELD_BONUS[Math.max(hud.equipment.toolTier, activeRecipe.targetTier)]} nguyên liệu
                        </strong>
                      </span>
                    </div>
                  </div>
                )}

                {activeRecipe.category === 'armor' && activeRecipe.targetTier && (
                  <div className="space-y-1.5 font-mono-num text-[#cbd5e1]">
                    <div className="flex items-center justify-between">
                      <span className="font-sans text-[#94a3b8]">Máu tối đa (HP):</span>
                      <span>
                        {hud.maxHp} →{' '}
                        <strong className="text-[#a3e635]">
                          {hud.maxHp +
                            Math.max(
                              0,
                              ARMOR_HP_BONUS[activeRecipe.targetTier] -
                                ARMOR_HP_BONUS[hud.equipment.armorTier]
                            )}
                        </strong>
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-sans text-[#94a3b8]">Giảm sát thương thú dữ:</span>
                      <span>
                        {ARMOR_DAMAGE_REDUCTION_PCT[hud.equipment.armorTier]}% →{' '}
                        <strong className="text-[#7dd3fc]">
                          {ARMOR_DAMAGE_REDUCTION_PCT[Math.max(hud.equipment.armorTier, activeRecipe.targetTier)]}%
                        </strong>
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-sans text-[#94a3b8]">Kháng cản trở thời tiết:</span>
                      <span>
                        {Math.round(ARMOR_WEATHER_RESIST[hud.equipment.armorTier] * 100)}% →{' '}
                        <strong className="text-[#fde68a]">
                          {Math.round(
                            ARMOR_WEATHER_RESIST[Math.max(hud.equipment.armorTier, activeRecipe.targetTier)] * 100
                          )}
                          %
                        </strong>
                      </span>
                    </div>
                  </div>
                )}

                {activeRecipe.category === 'refining' && (
                  <div className="flex items-center justify-between font-mono-num text-[#cbd5e1]">
                    <span className="font-sans text-[#94a3b8]">Dự trữ hiện có:</span>
                    <span>
                      {activeRecipe.id === 'refine_iron'
                        ? `Quặng Sắt: ${hud.inventory.iron} → ${hud.inventory.iron + 2}`
                        : activeRecipe.id === 'refine_crystal'
                        ? `Tinh Thể: ${hud.inventory.crystal} → ${hud.inventory.crystal + 2}`
                        : `Dược Thảo: ${hud.inventory.potion} → ${hud.inventory.potion + 1}`}
                    </span>
                  </div>
                )}

                <p className="text-xs text-[#a3e635] pt-0.5">
                  Đặc tính: {activeRecipe.specialPerk}
                </p>
              </div>
            </div>

            {/* ACTION CTA & FIELD STRUCTURES NOTE */}
            <div className="mt-4 pt-3.5 border-t border-[#1f2f29]">
              {lastCraftNotice && (
                <div className="mb-2.5 text-xs font-medium text-[#a3e635]">
                  {lastCraftNotice}
                </div>
              )}

              <button
                type="button"
                disabled={!isAffordable || isMaxed}
                onClick={() => handleTriggerCraft(activeRecipe)}
                className={`w-full h-11 px-5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  isMaxed
                    ? 'bg-[#17231f] text-[#64748b] cursor-default'
                    : isAffordable
                    ? 'bg-[#e8c468] hover:bg-[#f2d27e] text-[#111916] cursor-pointer'
                    : 'bg-[#18231f] border border-[#263630] text-[#64748b] cursor-not-allowed'
                }`}
              >
                {isMaxed
                  ? 'Đã Sở Hữu Trang Bị Này'
                  : isAffordable
                  ? activeRecipe.category === 'refining'
                    ? `Tinh Luyện Ngay · ${activeRecipe.name}`
                    : `Rèn Trang Bị · ${activeRecipe.name}`
                  : 'Chưa Đủ Nguyên Liệu Yêu Cầu'}
              </button>

              <div className="mt-3 pt-2.5 border-t border-[#192621] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#94a3b8]">
                <span>Công trình dựng nhanh ngoài thực địa:</span>
                <span className="font-mono-num text-[#cbd5e1]">
                  {BUILDABLE_SLOTS.map(
                    (b, i) =>
                      `[Phím ${i + 5}] ${b.name} (${Object.entries(b.costs)
                        .map(([rk, amt]) => `${RESOURCE_META[rk as ResourceId].shortName} ${amt}`)
                        .join(', ')})`
                  ).join(' · ')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
