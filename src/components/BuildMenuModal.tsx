import React, { useState } from 'react';
import {
  ALL_BUILDABLE_STRUCTURES,
  BuildableStructureSpec,
  RESOURCE_META,
  StructureCategory,
  canAfford,
} from '../game/recipes';
import { Inventory, ResourceId, StructureKind } from '../game/types';
import { sound } from '../game/audio';

interface BuildMenuModalProps {
  isOpen: boolean;
  inventory: Inventory;
  selectedStructureKind?: StructureKind;
  onClose: () => void;
  onSelectStructureToBuild: (spec: BuildableStructureSpec) => void;
}

export const BuildMenuModal: React.FC<BuildMenuModalProps> = ({
  isOpen,
  inventory,
  selectedStructureKind,
  onClose,
  onSelectStructureToBuild,
}) => {
  const [activeCategory, setActiveCategory] = useState<StructureCategory>('UTILITY');
  const [selectedSpec, setSelectedSpec] = useState<BuildableStructureSpec>(
    ALL_BUILDABLE_STRUCTURES[0]
  );

  if (!isOpen) return null;

  const categories: { id: StructureCategory; label: string; icon: string }[] = [
    { id: 'UTILITY', label: 'Bảo Quản & Tiện Ích', icon: '❄️' },
    { id: 'DEFENSE', label: 'Tường & Phòng Thủ', icon: '🧱' },
    { id: 'FOUNDATION', label: 'Sàn & Nền Móng', icon: '🟫' },
  ];

  const filteredSpecs = ALL_BUILDABLE_STRUCTURES.filter(
    (spec) => spec.category === activeCategory
  );

  const handleSelectSpec = (spec: BuildableStructureSpec) => {
    setSelectedSpec(spec);
    sound.playPickup();
  };

  const handleBuild = (spec: BuildableStructureSpec) => {
    if (!canAfford(inventory, spec.costs)) {
      sound.playEnemyHit(false);
      return;
    }
    sound.playCraftOrHeal();
    onSelectStructureToBuild(spec);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl rounded-2xl bg-slate-900/95 border border-emerald-500/30 shadow-2xl shadow-emerald-950/50 text-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-xl">
              🔨
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-wide text-amber-200 flex items-center gap-2">
                Danh Mục Kiến Trúc & Xây Dựng
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/30 text-emerald-400 font-mono">
                  Bản Đồ Dã Ngoại
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Xây dựng tường chắn, sàn di chuyển & trạm tiện ích mở rộng căn cứ khảo sát.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playPickup();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            title="Đóng cửa sổ"
          >
            ✕
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-800 bg-slate-950/40 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                const first = ALL_BUILDABLE_STRUCTURES.find((s) => s.category === cat.id);
                if (first) setSelectedSpec(first);
                sound.playPickup();
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                activeCategory === cat.id
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50 border border-emerald-400/50'
                  : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-slate-100 border border-slate-700/40'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 p-6 overflow-y-auto">
          {/* Spec Grid */}
          <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3 auto-rows-max">
            {filteredSpecs.map((spec) => {
              const affordable = canAfford(inventory, spec.costs);
              const isSelected = selectedSpec.id === spec.id;
              const isCurrentlyArmed = selectedStructureKind === spec.kind;

              return (
                <div
                  key={spec.id}
                  onClick={() => handleSelectSpec(spec)}
                  className={`relative p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-slate-800/90 border-emerald-400 shadow-md shadow-emerald-950/40'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl p-1.5 rounded-lg bg-slate-950 border border-slate-800">
                          {spec.iconSymbol}
                        </span>
                        <div>
                          <h3 className="font-semibold text-sm text-slate-100 leading-snug">
                            {spec.name}
                          </h3>
                          <span
                            className="text-[10px] font-mono font-medium"
                            style={{ color: spec.accentColor }}
                          >
                            Độ bền: {spec.hp} HP
                          </span>
                        </div>
                      </div>
                      {isCurrentlyArmed && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-medium">
                          Đang chọn
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                      {spec.shortDesc}
                    </p>
                  </div>

                  {/* Resource Costs Strip */}
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800/60">
                    {Object.entries(spec.costs).map(([resId, amount]) => {
                      const resMeta = RESOURCE_META[resId as ResourceId];
                      const currentAmount = inventory[resId as ResourceId] || 0;
                      const hasEnough = currentAmount >= (amount || 0);

                      return (
                        <span
                          key={resId}
                          className={`text-[11px] font-mono px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                            hasEnough
                              ? 'bg-slate-950/80 border-slate-700 text-slate-200'
                              : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                          }`}
                        >
                          <span style={{ color: resMeta.color }}>●</span>
                          <span>
                            {amount} {resMeta.shortName}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            ({currentAmount})
                          </span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Spec Details Panel */}
          <div className="md:col-span-5 bg-slate-950/60 rounded-xl border border-slate-800 p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="p-3 rounded-xl border text-3xl"
                  style={{
                    backgroundColor: `${selectedSpec.accentColor}15`,
                    borderColor: `${selectedSpec.accentColor}40`,
                  }}
                >
                  {selectedSpec.iconSymbol}
                </div>
                <div>
                  <span className="text-xs font-mono text-emerald-400 font-semibold uppercase tracking-wider">
                    {selectedSpec.categoryLabel}
                  </span>
                  <h3 className="text-lg font-bold text-amber-200">
                    {selectedSpec.name}
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    Độ bền kết cấu: {selectedSpec.hp} HP
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                  <h4 className="text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                    <span>✨</span> Tính Năng Đặc Biệt:
                  </h4>
                  <p className="text-xs text-emerald-300 leading-relaxed font-medium">
                    {selectedSpec.specialPerk}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                  <h4 className="text-xs font-bold text-slate-300 mb-1">
                    Mô Tả Kiến Trúc:
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {selectedSpec.shortDesc}
                  </p>
                </div>

                {/* Detailed Resource Breakdown */}
                <div>
                  <h4 className="text-xs font-bold text-slate-300 mb-2">
                    Chi Phí Nguyên Liệu Cần Thiết:
                  </h4>
                  <div className="space-y-1.5">
                    {Object.entries(selectedSpec.costs).map(([resId, amount]) => {
                      const resMeta = RESOURCE_META[resId as ResourceId];
                      const currentAmount = inventory[resId as ResourceId] || 0;
                      const hasEnough = currentAmount >= (amount || 0);

                      return (
                        <div
                          key={resId}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-900/50 border border-slate-800 text-xs"
                        >
                          <span className="flex items-center gap-2 text-slate-200">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: resMeta.color }}
                            />
                            {resMeta.name}
                          </span>
                          <span
                            className={`font-mono font-bold ${
                              hasEnough ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {currentAmount} / {amount}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Build Action Button */}
            <div className="mt-6 pt-4 border-t border-slate-800">
              <button
                onClick={() => handleBuild(selectedSpec)}
                disabled={!canAfford(inventory, selectedSpec.costs)}
                className={`w-full py-3 px-4 rounded-xl font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 ${
                  canAfford(inventory, selectedSpec.costs)
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50 hover:shadow-emerald-900/60 active:scale-[0.99]'
                    : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                }`}
              >
                <span>🔨</span>
                <span>
                  {canAfford(inventory, selectedSpec.costs)
                    ? 'Trang Bị Blueprint & Đặt Xây'
                    : 'Thiếu Nguyên Liệu Xây Dựng'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
