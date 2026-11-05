/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { BiomeRegion, REGION_LABELS } from '../game/biodiversity';
import { JournalCategory, JournalEntry } from '../game/journal';

interface JournalLogbookModalProps {
  isOpen: boolean;
  entries: JournalEntry[];
  dayCount: number;
  clockLabel: string;
  timeLabel: string;
  beaconsActivated: number;
  beaconsTotal: number;
  discoveredSpeciesCount: number;
  totalSpeciesCount: number;
  companionName?: string | null;
  companionSpecies?: string | null;
  onClose: () => void;
}

type FilterTab = 'ALL' | JournalCategory;

const CATEGORY_META: Record<
  JournalCategory,
  { label: string; badgeBg: string; textCol: string; borderCol: string; icon: string }
> = {
  BIOME: {
    label: 'Sinh Quyển',
    badgeBg: 'bg-emerald-950/70',
    textCol: 'text-emerald-300',
    borderCol: 'border-emerald-600/40',
    icon: '🧭',
  },
  OBELISK: {
    label: 'Tháp Cổ Obelisk',
    badgeBg: 'bg-sky-950/70',
    textCol: 'text-sky-300',
    borderCol: 'border-sky-600/40',
    icon: '⚡',
  },
  TITAN: {
    label: 'Cổ Thần Titan',
    badgeBg: 'bg-amber-950/70',
    textCol: 'text-amber-300',
    borderCol: 'border-amber-600/40',
    icon: '🌋',
  },
  SPECIES: {
    label: 'Sinh Vật & Bạn',
    badgeBg: 'bg-lime-950/70',
    textCol: 'text-lime-300',
    borderCol: 'border-lime-600/40',
    icon: '🐾',
  },
  SURVIVAL: {
    label: 'Sinh Tồn & Kỷ Lục',
    badgeBg: 'bg-rose-950/70',
    textCol: 'text-rose-300',
    borderCol: 'border-rose-600/40',
    icon: '🔥',
  },
};

export const JournalLogbookModal: React.FC<JournalLogbookModalProps> = ({
  isOpen,
  entries,
  dayCount,
  clockLabel,
  timeLabel,
  beaconsActivated,
  beaconsTotal,
  discoveredSpeciesCount,
  totalSpeciesCount,
  companionName,
  companionSpecies,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Count unique biomes discovered in the journal
  const discoveredBiomesCount = useMemo(() => {
    const biomeTitles = new Set(
      entries.filter((e) => e.category === 'BIOME').map((e) => e.title)
    );
    return Math.max(1, biomeTitles.size);
  }, [entries]);

  const filteredEntries = useMemo(() => {
    // Sort reverse chronological (newest discoveries first)
    const sorted = [...entries].reverse();
    return sorted.filter((entry) => {
      const matchCategory = activeTab === 'ALL' || entry.category === activeTab;
      if (!matchCategory) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        entry.title.toLowerCase().includes(q) ||
        entry.narrative.toLowerCase().includes(q) ||
        entry.locationName.toLowerCase().includes(q) ||
        entry.coords.toLowerCase().includes(q)
      );
    });
  }, [entries, activeTab, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-[#0c1411] border-2 border-[#b49048]/60 shadow-[0_20px_60px_rgba(0,0,0,0.85)] overflow-hidden text-[#e2e8f0]">
        {/* Subtle Antique Ledger Grid Background Texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:16px_16px]"
          aria-hidden="true"
        />

        {/* MODAL HEADER */}
        <div className="relative px-6 py-5 border-b border-[#2a3c34] bg-gradient-to-r from-[#14201b] via-[#101b17] to-[#14201b] flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl" role="img" aria-label="Journal icon">
                📜
              </span>
              <div>
                <h2 className="text-lg sm:text-xl font-bold tracking-wide uppercase text-[#fef08a] font-serif drop-shadow-sm">
                  Nhật Ký Thám Hiểm Sinh Quyển
                </h2>
                <p className="text-xs text-[#94a3b8] mt-0.5">
                  Biên niên sử tự động ghi nhận các phát hiện, vùng đất mới và tháp cổ đại
                </p>
              </div>
            </div>

            {/* EXPEDITION METRICS SUMMARY STRIP */}
            <div className="mt-3.5 flex flex-wrap items-center gap-2 text-xs">
              <div className="px-2.5 py-1 rounded-md bg-[#162520] border border-[#2b4137] text-[#cbd5e1] flex items-center gap-1.5">
                <span className="text-[#fef08a] font-semibold tabular-nums">{entries.length}</span>
                <span>Ghi chép</span>
              </div>

              <div className="px-2.5 py-1 rounded-md bg-[#162520] border border-[#2b4137] text-[#cbd5e1] flex items-center gap-1.5">
                <span>🧭 Sinh quyển:</span>
                <span className="text-[#4ade80] font-semibold tabular-nums">
                  {discoveredBiomesCount}/10
                </span>
              </div>

              <div className="px-2.5 py-1 rounded-md bg-[#162520] border border-[#2b4137] text-[#cbd5e1] flex items-center gap-1.5">
                <span>⚡ Tháp Obelisk:</span>
                <span className="text-[#38bdf8] font-semibold tabular-nums">
                  {beaconsActivated}/{beaconsTotal}
                </span>
              </div>

              <div className="px-2.5 py-1 rounded-md bg-[#162520] border border-[#2b4137] text-[#cbd5e1] flex items-center gap-1.5">
                <span>🌿 Loài:</span>
                <span className="text-[#a3e635] font-semibold tabular-nums">
                  {discoveredSpeciesCount}/{totalSpeciesCount}
                </span>
              </div>

              {companionName && (
                <div className="px-2.5 py-1 rounded-md bg-[#1c2918] border border-[#3b5930] text-[#bef264] flex items-center gap-1.5">
                  <span>🐾 Đồng hành:</span>
                  <span className="font-semibold text-[#fef08a]">{companionName}</span>
                </div>
              )}

              <div className="ml-auto text-[11px] text-[#94a3b8] tabular-nums font-mono-num hidden sm:block">
                Ngày {dayCount} · {clockLabel} ({timeLabel})
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-lg bg-[#182620] hover:bg-[#22352c] border border-[#2f463c] hover:border-[#e8c468] text-[#cbd5e1] hover:text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
            title="Đóng nhật ký (Phím ESC hoặc L)"
            aria-label="Đóng nhật ký"
          >
            ✕
          </button>
        </div>

        {/* TABS & SEARCH BAR */}
        <div className="px-6 py-3 border-b border-[#203029] bg-[#0e1714] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'ALL'
                  ? 'bg-[#b49048] text-[#0a120e] font-semibold shadow-sm'
                  : 'bg-[#15201b] hover:bg-[#1a2923] text-[#cbd5e1] border border-[#24372e]'
              }`}
            >
              Tất cả ({entries.length})
            </button>

            {(Object.keys(CATEGORY_META) as JournalCategory[]).map((cat) => {
              const meta = CATEGORY_META[cat];
              const count = entries.filter((e) => e.category === cat).length;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveTab(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    activeTab === cat
                      ? `${meta.badgeBg} ${meta.textCol} border ${meta.borderCol} font-semibold ring-1 ring-[#b49048]/40`
                      : 'bg-[#15201b] hover:bg-[#1a2923] text-[#94a3b8] hover:text-[#cbd5e1] border border-[#24372e]'
                  }`}
                >
                  <span>{meta.icon}</span>
                  <span>{meta.label}</span>
                  <span className="opacity-70 tabular-nums">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64 shrink-0">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm sự kiện, địa danh..."
              className="w-full h-8 pl-8 pr-3 text-xs rounded-lg bg-[#14201b] border border-[#283d33] focus:border-[#d4af37] text-[#f1f5f9] placeholder-[#64748b] focus:outline-none transition-colors"
            />
            <svg
              className="w-4 h-4 text-[#64748b] absolute left-2.5 top-2 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2 text-[#94a3b8] hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* TIMELINE ENTRIES LIST */}
        <div className="relative flex-1 overflow-y-auto px-6 py-6 scrollbar-thin scrollbar-thumb-[#2a3f35] scrollbar-track-transparent">
          {filteredEntries.length === 0 ? (
            <div className="py-16 text-center text-[#94a3b8]">
              <span className="text-4xl block mb-2 opacity-50">📖</span>
              <p className="text-sm font-medium text-[#cbd5e1]">Chưa có ghi chép nào phù hợp</p>
              <p className="text-xs text-[#64748b] mt-1">
                Hãy tiến vào các sinh quyển mới, kích hoạt tháp Obelisk hoặc thuần hóa thú để mở
                rộng trang sử!
              </p>
            </div>
          ) : (
            <div className="relative pl-6 sm:pl-8 space-y-6">
              {/* Vertical Glowing Chronicle Thread Line */}
              <div
                className="absolute left-[11px] sm:left-[15px] top-3 bottom-3 w-[2px] bg-gradient-to-b from-[#e8c468] via-[#38bdf8]/50 to-[#22352c]"
                aria-hidden="true"
              />

              {filteredEntries.map((entry, idx) => {
                const meta = CATEGORY_META[entry.category] || CATEGORY_META.BIOME;
                const isLatest = idx === 0 && !searchQuery && activeTab === 'ALL';

                return (
                  <div key={entry.id} className="relative group">
                    {/* Glowing Timeline Marker Node */}
                    <div
                      className={`absolute -left-[27px] sm:-left-[31px] top-3 w-5 h-5 rounded-full flex items-center justify-center border-2 transition-transform group-hover:scale-110 ${
                        isLatest
                          ? 'bg-[#d4af37] border-[#fef08a] ring-4 ring-[#d4af37]/30 shadow-lg'
                          : `${meta.badgeBg} ${meta.borderCol}`
                      }`}
                    >
                      <span className="text-[10px]">{meta.icon}</span>
                    </div>

                    {/* Entry Card */}
                    <div className="p-4 sm:p-5 rounded-xl bg-[#111c17]/95 border border-[#24372e] group-hover:border-[#b49048]/60 transition-all shadow-md group-hover:shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
                      {/* Top Metadata Row */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1b2b24] pb-2.5 mb-3 text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${meta.badgeBg} ${meta.textCol} ${meta.borderCol}`}
                          >
                            {meta.label}
                          </span>

                          <span className="font-mono-num font-semibold text-[#fef08a] tabular-nums">
                            {entry.timestamp}
                          </span>

                          {isLatest && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                              MỚI NHẤT
                            </span>
                          )}
                        </div>

                        {/* Location & Coordinates */}
                        <div className="flex items-center gap-1.5 text-[11px] text-[#94a3b8] font-mono-num">
                          <span className="text-[#38bdf8]">📍 {entry.locationName}</span>
                          <span className="text-[#475569]">·</span>
                          <span className="text-[#cbd5e1]">{entry.coords}</span>
                        </div>
                      </div>

                      {/* Title */}
                      <h3
                        className="text-base sm:text-lg font-bold tracking-tight text-[#f8fafc] font-serif group-hover:text-[#fde047] transition-colors"
                        style={{ color: entry.accentColor || undefined }}
                      >
                        {entry.title}
                      </h3>

                      {/* Narrative Chronicle Story Prose */}
                      <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#cbd5e1] font-sans antialiased text-justify opacity-95">
                        {entry.narrative}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-3.5 border-t border-[#203029] bg-[#0c1411] flex items-center justify-between text-xs text-[#94a3b8]">
          <div className="flex items-center gap-2">
            <span className="text-[#d4af37]">💡 Mẹo:</span>
            <span>
              Nhấn phím <kbd className="px-1.5 py-0.5 rounded bg-[#1c2a23] border border-[#2d4237] text-[#fef08a] font-mono">L</kbd> bất kỳ lúc nào để mở nhanh Nhật Ký Hành Trình.
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#182620] hover:bg-[#22352c] border border-[#2d4237] hover:border-[#b49048] text-[#f1f5f9] font-medium transition-colors cursor-pointer"
          >
            Đóng [ESC]
          </button>
        </div>
      </div>
    </div>
  );
};
