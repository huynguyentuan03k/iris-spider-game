/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HudSnapshot, PlacedStructure } from '../game/types';
import { sound } from '../game/audio';

interface StorageChestModalProps {
  isOpen: boolean;
  hud: HudSnapshot;
  structure: PlacedStructure | null;
  onDeposit: (resource: 'berry' | 'bioSample', amount: number) => void;
  onWithdraw: (resource: 'berry' | 'bioSample', amount: number) => void;
  onDepositAll: () => void;
  onWithdrawAll: () => void;
  onClose: () => void;
}

export const StorageChestModal: React.FC<StorageChestModalProps> = ({
  isOpen,
  hud,
  structure,
  onDeposit,
  onWithdraw,
  onDepositAll,
  onWithdrawAll,
  onClose,
}) => {
  if (!isOpen || !structure) return null;

  const storedBerries = structure.storedBerries || 0;
  const storedBioSamples = structure.storedBioSamples || 0;
  const carriedBerries = hud.inventory.berry || 0;
  const carriedBioSamples = hud.inventory.bioSample || 0;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-[#080d0b]/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#101815] border border-[#2d423a] rounded-xl p-6 shadow-2xl overflow-hidden flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-[#21332c]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#162a22] border border-[#38bdf8]/40 flex items-center justify-center text-xl shrink-0 text-[#38bdf8]">
              ❄️
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-[#f7f4eb]">
                Thùng Bảo Quản Thực Địa
              </h2>
              <p className="text-xs text-[#94a3b8] mt-0.5">
                Khí lạnh giữ thực phẩm không bị hỏng hoặc phân hủy do thời gian
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              sound.playUiClick();
              onClose();
            }}
            className="h-8 px-3 rounded-md bg-[#182420] hover:bg-[#21322c] border border-[#31453d] text-xs font-medium text-[#e7e5dc] transition-colors shrink-0 cursor-pointer"
          >
            Đóng [Esc]
          </button>
        </div>

        {/* Freshness Status Banner */}
        <div className="p-3 rounded-lg bg-[#0e1d17] border border-[#233d32] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[#38bdf8] font-semibold">Tình trạng thực phẩm:</span>
            <span className="text-[#f7f4eb] font-medium">{hud.perishableStatusNote}</span>
          </div>
          <span className="text-[11px] font-mono-num text-[#86efac]">
            Độ tươi túi đồ: {Math.round(hud.perishableFreshness)}%
          </span>
        </div>

        {/* Two-Column Grid: Carried vs Stored */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Carried Perishables */}
          <div className="p-3.5 rounded-lg bg-[#0b1310] border border-[#21332c] flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#1b2b24]">
              <span className="text-xs font-semibold text-[#fde047]">🎒 Đang Mang Trong Túi</span>
              <span className="text-[11px] text-[#94a3b8]">Biến chất theo thời gian</span>
            </div>

            {/* Berry Row */}
            <div className="flex items-center justify-between gap-2 text-xs">
              <div>
                <span className="text-[#f7f4eb] font-medium">Trái Cây</span>
                <div className="text-[11px] text-[#94a3b8] tabular-nums">Số lượng: {carriedBerries}</div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={carriedBerries <= 0}
                  onClick={() => onDeposit('berry', 1)}
                  className="px-2 py-1 rounded bg-[#182921] hover:bg-[#233d32] disabled:opacity-40 text-[#fde68a] text-[11px] font-medium border border-[#2f493d] transition-colors cursor-pointer"
                >
                  Cất 1
                </button>
                <button
                  type="button"
                  disabled={carriedBerries <= 0}
                  onClick={() => onDeposit('berry', carriedBerries)}
                  className="px-2 py-1 rounded bg-[#1f382c] hover:bg-[#2c4e3e] disabled:opacity-40 text-[#fde047] text-[11px] font-semibold border border-[#3a5d4b] transition-colors cursor-pointer"
                >
                  Hết
                </button>
              </div>
            </div>

            {/* BioSample Row */}
            <div className="flex items-center justify-between gap-2 text-xs">
              <div>
                <span className="text-[#f7f4eb] font-medium">Mẫu Vi Sinh</span>
                <div className="text-[11px] text-[#94a3b8] tabular-nums">Số lượng: {carriedBioSamples}</div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={carriedBioSamples <= 0}
                  onClick={() => onDeposit('bioSample', 1)}
                  className="px-2 py-1 rounded bg-[#182921] hover:bg-[#233d32] disabled:opacity-40 text-[#bbf7d0] text-[11px] font-medium border border-[#2f493d] transition-colors cursor-pointer"
                >
                  Cất 1
                </button>
                <button
                  type="button"
                  disabled={carriedBioSamples <= 0}
                  onClick={() => onDeposit('bioSample', carriedBioSamples)}
                  className="px-2 py-1 rounded bg-[#1f382c] hover:bg-[#2c4e3e] disabled:opacity-40 text-[#86efac] text-[11px] font-semibold border border-[#3a5d4b] transition-colors cursor-pointer"
                >
                  Hết
                </button>
              </div>
            </div>
          </div>

          {/* Stored Perishables */}
          <div className="p-3.5 rounded-lg bg-[#0b1310] border border-[#1e343b] flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#182c33]">
              <span className="text-xs font-semibold text-[#38bdf8]">🧊 Đã Cất Trong Thùng</span>
              <span className="text-[11px] text-[#7dd3fc]">An toàn 100% ❄️</span>
            </div>

            {/* Stored Berry Row */}
            <div className="flex items-center justify-between gap-2 text-xs">
              <div>
                <span className="text-[#f7f4eb] font-medium">Trái Cây</span>
                <div className="text-[11px] text-[#7dd3fc] tabular-nums">Số lượng: {storedBerries}</div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={storedBerries <= 0}
                  onClick={() => onWithdraw('berry', 1)}
                  className="px-2 py-1 rounded bg-[#132730] hover:bg-[#1c3845] disabled:opacity-40 text-[#bae6fd] text-[11px] font-medium border border-[#244857] transition-colors cursor-pointer"
                >
                  Rút 1
                </button>
                <button
                  type="button"
                  disabled={storedBerries <= 0}
                  onClick={() => onWithdraw('berry', storedBerries)}
                  className="px-2 py-1 rounded bg-[#163542] hover:bg-[#20495c] disabled:opacity-40 text-[#38bdf8] text-[11px] font-semibold border border-[#2d5c73] transition-colors cursor-pointer"
                >
                  Hết
                </button>
              </div>
            </div>

            {/* Stored BioSample Row */}
            <div className="flex items-center justify-between gap-2 text-xs">
              <div>
                <span className="text-[#f7f4eb] font-medium">Mẫu Vi Sinh</span>
                <div className="text-[11px] text-[#7dd3fc] tabular-nums">Số lượng: {storedBioSamples}</div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={storedBioSamples <= 0}
                  onClick={() => onWithdraw('bioSample', 1)}
                  className="px-2 py-1 rounded bg-[#132730] hover:bg-[#1c3845] disabled:opacity-40 text-[#bae6fd] text-[11px] font-medium border border-[#244857] transition-colors cursor-pointer"
                >
                  Rút 1
                </button>
                <button
                  type="button"
                  disabled={storedBioSamples <= 0}
                  onClick={() => onWithdraw('bioSample', storedBioSamples)}
                  className="px-2 py-1 rounded bg-[#163542] hover:bg-[#20495c] disabled:opacity-40 text-[#38bdf8] text-[11px] font-semibold border border-[#2d5c73] transition-colors cursor-pointer"
                >
                  Hết
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Global Batch Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#21332c]">
          <button
            type="button"
            disabled={carriedBerries === 0 && carriedBioSamples === 0}
            onClick={onDepositAll}
            className="flex-1 h-10 rounded-lg bg-[#193226] hover:bg-[#224434] disabled:opacity-40 border border-[#2f5744] text-[#fde047] font-semibold text-xs transition-colors cursor-pointer"
          >
            Cất Toàn Bộ Thực Phẩm 📥
          </button>
          <button
            type="button"
            disabled={storedBerries === 0 && storedBioSamples === 0}
            onClick={onWithdrawAll}
            className="flex-1 h-10 rounded-lg bg-[#142933] hover:bg-[#1d3a47] disabled:opacity-40 border border-[#254d5e] text-[#38bdf8] font-semibold text-xs transition-colors cursor-pointer"
          >
            Rút Tất Cả Về Túi 📤
          </button>
        </div>
      </div>
    </div>
  );
};
