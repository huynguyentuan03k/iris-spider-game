import React, { useState } from 'react';
import { REGION_LABELS, WORLD_LOCATIONS } from '../game/biodiversity';
import { WorldMapRenderData } from '../game/types';
import { TILE_SIZE, formatCoordLabel } from '../game/worldGen';
import { EarthMapCanvas } from './EarthMapCanvas';

interface TitleScreenProps {
  seed: number;
  canContinue: boolean;
  isMuted: boolean;
  userEmail: string | null;
  cloudSyncStatus: string | null;
  mapData: WorldMapRenderData | null;
  onStartNew: () => void;
  onStartAtLocation: (worldX: number, worldY: number) => void;
  onContinue: () => void;
  onRerollSeed: () => void;
  onToggleMute: () => void;
  onGoogleAuth: () => void;
  onSignOut: () => void;
  onOpenPhaserLab?: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  seed,
  canContinue,
  isMuted,
  userEmail,
  cloudSyncStatus,
  mapData,
  onStartNew,
  onStartAtLocation,
  onContinue,
  onRerollSeed,
  onToggleMute,
  onGoogleAuth,
  onSignOut,
  onOpenPhaserLab,
}) => {
  const [selectedLocId, setSelectedLocId] = useState<string>('loc_biosphere_hub');
  const selectedLoc =
    WORLD_LOCATIONS.find((l) => l.id === selectedLocId) || WORLD_LOCATIONS[0];

  return (
    <div className="fixed inset-0 z-20 flex flex-col justify-between p-5 md:p-8 bg-gradient-to-t from-[#070d0c]/94 via-[#091214]/72 to-[#070d0c]/58 pointer-events-auto overflow-y-auto">
      {/* Top Perimeter Utility: Seed + Cloud Account + Mute */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 text-xs text-[#d6d3c9]/90 tracking-wide">
          <span>Bản Đồ Trái Đất Mở 2D</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono-num tabular-nums">Hạt giống #{seed}</span>
          <button
            type="button"
            onClick={onRerollSeed}
            className="text-[#e8c468] hover:text-[#fde68a] underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Đổi biến thể sinh quyển
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          {userEmail ? (
            <div className="flex items-center gap-2.5 text-xs text-[#d6d3c9]">
              <span className="truncate max-w-[180px]">{userEmail}</span>
              {cloudSyncStatus && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-[#a3e635]">{cloudSyncStatus}</span>
                </>
              )}
              <button
                type="button"
                onClick={onSignOut}
                className="h-10 px-3 rounded-lg bg-[#121c18]/90 border border-[#2c3e36] hover:border-[#f87171]/60 text-xs font-medium text-[#e7e5dc] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onGoogleAuth}
              className="h-10 px-3.5 rounded-lg bg-[#121c18]/90 border border-[#2c3e36] hover:border-[#38bdf8] text-xs font-medium text-[#e7e5dc] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Đăng nhập Google (Lưu Đám Mây)
            </button>
          )}

          <button
            type="button"
            onClick={onToggleMute}
            aria-label={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
            className="h-10 px-3.5 flex items-center gap-2 rounded-lg bg-[#121c18]/90 border border-[#2c3e36] text-xs font-medium text-[#e7e5dc] hover:border-[#e8c468]/60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
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
            <span>{isMuted ? 'Tắt tiếng' : 'Âm thanh'}</span>
          </button>
        </div>
      </div>

      {/* 2-Column Balanced Hero Split: Brand & CTA Left + Live Planet Earth World Map Right */}
      <div className="my-auto py-4 w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-5 flex flex-col items-start text-left">
          <p className="text-xs font-medium text-[#e8c468] tracking-wide">
            6 Châu Lục · 4 Đại Dương · 12 Địa Danh Trái Đất
          </p>

          <h1
            className="mt-2 font-display text-4xl sm:text-5xl font-bold tracking-tight text-[#f7f4eb] drop-shadow-[0_4px_20px_rgba(0,0,0,0.85)]"
            style={{ textWrap: 'balance' }}
          >
            Chân Trời Sinh Quyển
          </h1>

          <p className="mt-3 text-sm sm:text-base text-[#dbd7cc] leading-relaxed">
            Hành trình sinh quyển trên bản đồ thế giới thực từ Châu Á, Châu Âu, Châu Phi, Bắc Mỹ, Nam Mỹ tới Châu Đại Dương và Nam Cực — khám phá Sông Mê Kông, Amazon, Sahara, Himalaya cùng 42 loài Động Vật, Thực Vật, Côn Trùng và Vi Khuẩn.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {canContinue ? (
              <>
                <button
                  type="button"
                  onClick={onContinue}
                  className="h-12 px-6 rounded-lg bg-[#e8c468] hover:bg-[#f2d27e] text-[#111916] font-semibold text-sm tracking-wide shadow-lg transition-transform active:scale-95 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Tiếp Tục Hành Trình
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onStartAtLocation(
                      (selectedLoc.tx + 0.5) * TILE_SIZE,
                      (selectedLoc.ty + 0.5) * TILE_SIZE
                    )
                  }
                  className="h-12 px-5 rounded-lg bg-[#14201b]/95 hover:bg-[#1c2d26] border border-[#385046] text-[#f2efe9] font-medium text-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Khởi Hành Tại Điểm Chọn
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() =>
                    onStartAtLocation(
                      (selectedLoc.tx + 0.5) * TILE_SIZE,
                      (selectedLoc.ty + 0.5) * TILE_SIZE
                    )
                  }
                  className="h-12 px-6 rounded-lg bg-[#e8c468] hover:bg-[#f2d27e] text-[#111916] font-semibold text-sm tracking-wide shadow-lg transition-transform active:scale-95 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Khởi Hành Tại {selectedLoc.name}
                </button>
                {selectedLoc.id !== 'loc_biosphere_hub' && (
                  <button
                    type="button"
                    onClick={onStartNew}
                    className="h-12 px-4 rounded-lg bg-[#14201b]/95 hover:bg-[#1c2d26] border border-[#385046] text-[#f2efe9] font-medium text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Về Trạm Trung Tâm
                  </button>
                )}
              </>
            )}

            {onOpenPhaserLab && (
              <button
                type="button"
                onClick={onOpenPhaserLab}
                className="h-12 px-4 rounded-lg bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-bold text-xs tracking-wide shadow-xl border border-amber-300/50 flex items-center gap-2 transition-transform active:scale-95 whitespace-nowrap shrink-0 cursor-pointer"
                title="Mở phòng thí nghiệm kiểm tra đồ họa 2D Hand-Painted Fantasy (Phaser 3)"
              >
                <span>🎨 Thử Nghiệm Fantasy (Phaser Lab)</span>
              </button>
            )}
          </div>
        </div>

        {/* Interactive Widescreen Planet Earth Preview Atlas */}
        <div className="lg:col-span-7 bg-[#0c1618]/92 border border-[#2c423c] rounded-xl p-4 shadow-2xl">
          <div className="flex flex-wrap items-baseline justify-between gap-2 pb-2.5">
            <span className="text-xs font-semibold text-[#f7f4eb]">
              Bản Đồ Thế Giới Trái Đất (Nhấp chọn địa danh khởi hành)
            </span>
            <span className="text-[11px] font-mono-num text-[#7dd3fc] tabular-nums">
              {formatCoordLabel(selectedLoc.lon, selectedLoc.lat)}
            </span>
          </div>

          <EarthMapCanvas
            mode="preview"
            mapData={mapData}
            selectedLocationId={selectedLoc.id}
            onSelectLocation={setSelectedLocId}
            className="w-full aspect-[7/4] rounded-lg border border-[#223842] cursor-pointer block"
          />

          <div className="mt-3 pt-2.5 border-t border-[#1e312c] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 text-[#f7f4eb]">
                <span className="font-semibold text-[#fde047]">{selectedLoc.name}</span>
                <span className="text-[#64748b]" aria-hidden="true">·</span>
                <span className="text-[#cbd5e1]">{selectedLoc.continent}</span>
                <span className="text-[#64748b]" aria-hidden="true">·</span>
                <span className="text-[#a3e635]">{REGION_LABELS[selectedLoc.region]}</span>
              </div>
              <p className="mt-0.5 text-[11px] text-[#94a3b8] truncate">
                {selectedLoc.subtitle}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Single Flat Control-Hint Line */}
      <div className="text-center text-xs sm:text-sm text-[#d4d0c5]/90 tracking-wide drop-shadow-[0_1px_6px_rgba(0,0,0,0.9)]">
        WASD Di chuyển · Chuột trái Khai thác · F Thuần hóa thú · P Thú cưng · V Kính hiển vi 400x · C Chế tạo · B Bách khoa · M Bản đồ Trái Đất
      </div>
    </div>
  );
};
