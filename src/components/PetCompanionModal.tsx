import React, { useEffect, useState } from 'react';
import { sound } from '../game/audio';
import { COMPANION_PROFILES, PET_MODE_LABELS } from '../game/engine';
import { AnimalKind, HudSnapshot, PetMode } from '../game/types';
import { ANIMAL_KIND_SPECIES_MAP, SpeciesIllustration } from './SpeciesIllustration';

interface PetCompanionModalProps {
  hud: HudSnapshot;
  onClose: () => void;
  onRenamePet: (newName: string) => void;
  onSetPetMode: (mode: PetMode) => void;
  onFeedPet: (food: 'berry' | 'potion') => void;
  onReleasePet: () => void;
}

const PRESET_PET_NAMES = [
  'Tiểu Lộc',
  'Hổ Phách',
  'Tiểu Lang',
  'Bích Quy',
  'Đại Ngàn',
  'Sấm Chớp',
  'Bạch Tuyết',
  'Mộc Linh',
];

const MODE_OPTIONS: { mode: PetMode; desc: string }[] = [
  {
    mode: 'BALANCED',
    desc: 'Vừa bảo vệ bạn khi gặp thú dữ, vừa hỗ trợ đốn gỗ, đập quặng và hút vật phẩm.',
  },
  {
    mode: 'COMBAT',
    desc: 'Tập trung áp sát tấn công các loài thú săn mồi quanh bạn với tốc độ cao.',
  },
  {
    mode: 'GATHER',
    desc: 'Ưu tiên khai thác cây cối, khoáng thạch, thảo mộc và thu gom vật phẩm rơi.',
  },
  {
    mode: 'FOLLOW',
    desc: 'Đi sát bên cạnh bạn trong trật tự, bảo toàn sức lực và chỉ hỗ trợ nhặt đồ gần.',
  },
];

const SAMPLE_TAMABLE_SPECIES: { kind: AnimalKind; peaceful: boolean }[] = [
  { kind: AnimalKind.SPOTTED_DEER, peaceful: true },
  { kind: AnimalKind.RIVER_OTTER, peaceful: true },
  { kind: AnimalKind.ALPINE_IBEX, peaceful: true },
  { kind: AnimalKind.DESERT_CAMEL, peaceful: true },
  { kind: AnimalKind.PRAIRIE_WOLF, peaceful: false },
  { kind: AnimalKind.JUNGLE_JAGUAR, peaceful: false },
  { kind: AnimalKind.MOUNTAIN_BEAR, peaceful: false },
  { kind: AnimalKind.RIVER_CROC, peaceful: false },
];

export const PetCompanionModal: React.FC<PetCompanionModalProps> = ({
  hud,
  onClose,
  onRenamePet,
  onSetPetMode,
  onFeedPet,
  onReleasePet,
}) => {
  const comp = hud.companion;
  const [nameInput, setNameInput] = useState<string>(comp ? comp.customName : '');
  const [savedNotice, setSavedNotice] = useState<boolean>(false);

  useEffect(() => {
    if (comp) {
      setNameInput(comp.customName);
    }
  }, [comp?.kind, comp?.customName]);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comp) return;
    const trimmed = nameInput.trim().slice(0, 32);
    if (!trimmed) return;
    onRenamePet(trimmed);
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 1800);
  };

  const handlePickPreset = (preset: string) => {
    setNameInput(preset);
    if (comp) {
      onRenamePet(preset);
      setSavedNotice(true);
      window.setTimeout(() => setSavedNotice(false), 1800);
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 sm:p-6 bg-[#080d0b]/82">
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#101815] border border-[#2d4038] rounded-xl p-6 shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#22312b]">
          <div>
            <h2 className="font-display text-2xl font-bold text-[#f7f4eb]">
              Hệ Thống Thuần Hóa &amp; Thú Cưng Đồng Hành
            </h2>
            <p className="mt-1 text-xs text-[#b8b4a8] tabular-nums">
              {comp
                ? `${comp.customName} · Loài ${comp.speciesName} · Độ trung thành ${comp.loyalty}/100 (${comp.loyaltyStatus})`
                : 'Tiến lại gần động vật hoang dã ngoài thực địa và nhấn [F] để cho ăn thuần hóa'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-lg bg-[#182420] hover:bg-[#21322c] border border-[#31453d] text-xs font-medium text-[#e7e5dc] whitespace-nowrap shrink-0 cursor-pointer"
          >
            Đóng [P / Esc]
          </button>
        </div>

        {comp ? (
          <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* LEFT COLUMN: Pet Naming + Loyalty Meter + Feeding */}
            <div className="lg:col-span-6 flex flex-col justify-between gap-5 bg-[#0c1310] border border-[#22322b] rounded-lg p-5">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-16 h-16 rounded-lg bg-[#080d0b] border border-[#23332c] flex items-center justify-center shrink-0 overflow-hidden">
                      <SpeciesIllustration
                        speciesId={ANIMAL_KIND_SPECIES_MAP[comp.kind]}
                        discovered={true}
                        className="w-14 h-14"
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-[#f7f4eb] truncate">{comp.customName}</h3>
                      <div className="mt-0.5 text-xs text-[#94a3b8]">
                        <span>{comp.speciesName}</span>
                        <span className="mx-1.5" aria-hidden="true">·</span>
                        <span className="text-[#e8c468]">Chế độ {PET_MODE_LABELS[comp.mode]}</span>
                      </div>
                      <div className="mt-1 text-xs font-mono-num text-[#cbd5e1] tabular-nums">
                        Sát thương {comp.damage} · Khai thác {comp.gatherPower}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      sound.unlock();
                      sound.playAnimalCall(comp.kind, 1);
                    }}
                    className="h-9 px-3 rounded-lg bg-[#172620] hover:bg-[#21362d] border border-[#2e483d] text-xs font-medium text-[#e8c468] flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
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
                    <span>Nghe tiếng kêu</span>
                  </button>
                </div>

                <p className="mt-2.5 text-xs text-[#c8c4b8] leading-relaxed">
                  {comp.specialtyDesc}
                </p>

                {/* Pet Naming Form */}
                <form onSubmit={handleSaveName} className="mt-4 pt-4 border-t border-[#1e2c26]">
                  <div className="flex items-center justify-between gap-2">
                    <label htmlFor="pet-custom-name" className="text-xs font-semibold text-[#e8c468]">
                      Đặt Tên Cho Thú Cưng
                    </label>
                    <span className="text-[11px] font-mono-num text-[#94a3b8]">
                      {savedNotice ? 'Đã lưu tên mới' : `${nameInput.trim().length}/32 ký tự`}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      id="pet-custom-name"
                      type="text"
                      maxLength={32}
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="Nhập tên thú cưng của bạn..."
                      className="flex-1 h-10 px-3 rounded-lg bg-[#131e1a] border border-[#2c4037] focus:border-[#e8c468] focus:outline-none text-sm text-[#f7f4eb] placeholder:text-[#64748b]"
                    />
                    <button
                      type="submit"
                      className="h-10 px-4 rounded-lg bg-[#e8c468] hover:bg-[#f2d27e] text-[#111916] text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Lưu Tên
                    </button>
                  </div>

                  {/* Quick Name Suggestions */}
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    {PRESET_PET_NAMES.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handlePickPreset(preset)}
                        className={`h-8 px-2.5 rounded-md border text-[11px] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          comp.customName === preset
                            ? 'bg-[#1f3329] border-[#a3e635] text-[#ecfccb]'
                            : 'bg-[#121c18] border-[#25362f] text-[#cbd5e1] hover:border-[#476257]'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </form>

                {/* Loyalty Meter Section */}
                <div className="mt-5 pt-4 border-t border-[#1e2c26]">
                  <div className="flex items-baseline justify-between gap-2 text-xs">
                    <span className="font-semibold text-[#f7f4eb]">Chỉ Số Độ Trung Thành</span>
                    <span
                      className={`font-mono-num font-semibold ${
                        comp.loyalty >= 80
                          ? 'text-[#a3e635]'
                          : comp.loyalty >= 45
                          ? 'text-[#7dd3fc]'
                          : comp.loyalty >= 20
                          ? 'text-[#fbbf24]'
                          : 'text-[#f87171]'
                      }`}
                    >
                      {comp.loyalty}/100 · {comp.loyaltyStatus}
                    </span>
                  </div>

                  <div className="mt-2 w-full h-3 bg-[#192621] rounded-sm overflow-hidden">
                    <div
                      className={`h-full transition-transform duration-150 origin-left ${
                        comp.loyalty >= 80
                          ? 'bg-[#a3e635]'
                          : comp.loyalty >= 45
                          ? 'bg-[#38bdf8]'
                          : comp.loyalty >= 20
                          ? 'bg-[#fbbf24]'
                          : 'bg-[#ef4444]'
                      }`}
                      style={{ transform: `scaleX(${Math.max(0, Math.min(1, comp.loyalty / 100))})` }}
                    />
                  </div>

                  <div className="mt-2 text-[11px] text-[#94a3b8] leading-relaxed tabular-nums">
                    Hiệu suất hỗ trợ hiện tại: <span className="text-[#f2efe9] font-semibold">{comp.efficiencyPercent}%</span> · Đạt ≥80 tăng 135% sức mạnh · Dưới 20 thú cưng tạm nghỉ chờ cho ăn · Đứng gần Lửa Trại giúp hồi Độ trung thành tự nhiên.
                  </div>
                </div>
              </div>

              {/* Feeding Controls */}
              <div className="pt-3 border-t border-[#1e2c26] grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  disabled={hud.inventory.berry <= 0 || comp.loyalty >= 100}
                  onClick={() => onFeedPet('berry')}
                  className={`h-10 px-3 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    hud.inventory.berry > 0 && comp.loyalty < 100
                      ? 'bg-[#192822] hover:bg-[#22362e] border-[#36532c] text-[#ecfccb] cursor-pointer'
                      : 'bg-[#121a17] border-[#1f2d28] text-[#64748b] cursor-not-allowed'
                  }`}
                >
                  Cho Ăn Trái Cây (+18) · Có {hud.inventory.berry}
                </button>
                <button
                  type="button"
                  disabled={hud.inventory.potion <= 0 || comp.loyalty >= 100}
                  onClick={() => onFeedPet('potion')}
                  className={`h-10 px-3 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    hud.inventory.potion > 0 && comp.loyalty < 100
                      ? 'bg-[#172924] hover:bg-[#1f3831] border-[#2d5a4c] text-[#6ee7b7] cursor-pointer'
                      : 'bg-[#121a17] border-[#1f2d28] text-[#64748b] cursor-not-allowed'
                  }`}
                >
                  Dược Thảo (+45) · Có {hud.inventory.potion}
                </button>
              </div>
            </div>

            {/* RIGHT COLUMN: Tactical Companion Role Selector + Release */}
            <div className="lg:col-span-6 flex flex-col justify-between gap-5 bg-[#0c1310] border border-[#22322b] rounded-lg p-5">
              <div>
                <h3 className="text-sm font-semibold text-[#e8c468]">
                  Chế Độ Hỗ Trợ Chiến Đấu &amp; Thu Thập Tài Nguyên
                </h3>
                <p className="mt-1 text-xs text-[#94a3b8]">
                  Chọn nhiệm vụ ưu tiên cho {comp.customName} khi đồng hành cùng bạn trên bản đồ.
                </p>

                <div className="mt-3.5 flex flex-col gap-2.5">
                  {MODE_OPTIONS.map((opt) => {
                    const active = comp.mode === opt.mode;
                    return (
                      <button
                        key={opt.mode}
                        type="button"
                        onClick={() => onSetPetMode(opt.mode)}
                        className={`w-full text-left p-3.5 rounded-lg border transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#172921] border-[#a3e635]'
                            : 'bg-[#111b17] border-[#22322b] hover:border-[#3c564b]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-xs font-semibold ${active ? 'text-[#ecfccb]' : 'text-[#f2efe9]'}`}>
                            {PET_MODE_LABELS[opt.mode]}
                          </span>
                          <span className={`text-[11px] ${active ? 'text-[#a3e635]' : 'text-[#64748b]'}`}>
                            {active ? 'Đang kích hoạt' : 'Chọn chế độ'}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-[#b8b4a8] leading-relaxed">
                          {opt.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-[#1e2c26] flex items-center justify-between gap-3">
                <span className="text-xs text-[#94a3b8]">
                  Mẹo: Nhấn [F] gần thú hoang khác nếu muốn đổi bạn đồng hành mới.
                </span>
                <button
                  type="button"
                  onClick={onReleasePet}
                  className="h-10 px-3.5 rounded-lg bg-[#1c1917] hover:bg-[#29201d] border border-[#44332d] text-xs font-medium text-[#fca5a5] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Thả Về Tự Nhiên
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Empty State: Field Guide to Taming Wild Animals */
          <div className="mt-5 flex flex-col gap-5">
            <div className="bg-[#0c1310] border border-[#24362e] rounded-lg p-5">
              <h3 className="text-base font-semibold text-[#e8c468]">
                Hướng Dẫn Thuần Hóa Động Vật Hoang Dã Ngoài Thực Địa
              </h3>
              <div className="mt-2.5 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[#cbd5e1] leading-relaxed">
                <div>
                  <div className="font-semibold text-[#a3e635]">01. Thú Hiền Lành (Chuyên Thu Thập)</div>
                  <p className="mt-1 text-[#b8b4a8]">
                    Tiến lại gần Hươu Sao, Rái Cá, Rùa Biển, Lạc Đà hoặc Dê Núi và nhấn <span className="text-[#f7f4eb] font-semibold">[F]</span> với <span className="text-[#fde68a]">2 Trái Cây</span> để thuần hóa ngay lập tức.
                  </p>
                </div>
                <div>
                  <div className="font-semibold text-[#38bdf8]">02. Thú Săn Mồi (Chuyên Chiến Đấu)</div>
                  <p className="mt-1 text-[#b8b4a8]">
                    Với Sói Xám, Lợn Rừng, Cá Sấu, Báo Đốm hoặc Gấu Xám: nhấn <span className="text-[#f7f4eb] font-semibold">[F]</span> dùng <span className="text-[#fde68a]">2 Trái Cây + 1 Mẫu Vi Sinh</span> (thuần hóa 1 lần nếu máu thú ≤65%, hoặc cho ăn 2 lần).
                  </p>
                </div>
                <div>
                  <div className="font-semibold text-[#fbbf24]">03. Độ Trung Thành &amp; Đặt Tên</div>
                  <p className="mt-1 text-[#b8b4a8]">
                    Sau khi thuần hóa, đặt tên riêng cho thú cưng và cho ăn bằng phím <span className="text-[#f7f4eb] font-semibold">[F]</span> để giữ Độ trung thành ≥80, kích hoạt 135% sát thương và tốc độ khai thác.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-[#cbd5e1]">
                Các Loài Động Vật Tiêu Biểu Có Thể Thuần Hóa Trên Lục Địa
              </h4>
              <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {SAMPLE_TAMABLE_SPECIES.map(({ kind, peaceful }) => {
                  const prof = COMPANION_PROFILES[kind];
                  if (!prof) return null;
                  return (
                    <div
                      key={kind}
                      className="p-3.5 rounded-lg bg-[#121c18] border border-[#22332c] flex flex-col justify-between gap-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-12 h-12 rounded-md bg-[#090f0d] border border-[#22332c] flex items-center justify-center shrink-0 overflow-hidden">
                            <SpeciesIllustration
                              speciesId={ANIMAL_KIND_SPECIES_MAP[kind]}
                              discovered={true}
                              className="w-11 h-11"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-[#f7f4eb] truncate">
                              {prof.speciesName}
                            </div>
                            <div className="mt-0.5 text-[11px] text-[#94a3b8] tabular-nums">
                              <span>{peaceful ? '2 Trái Cây' : '2 Trái Cây + 1 Vi Sinh'}</span>
                            </div>
                            <div className="text-[11px] font-mono-num text-[#cbd5e1] tabular-nums">
                              ST {prof.damage} · KT {prof.gatherPower}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            sound.unlock();
                            sound.playAnimalCall(kind, 1);
                          }}
                          title={`Nghe tiếng kêu: ${prof.speciesName}`}
                          aria-label={`Nghe tiếng kêu ${prof.speciesName}`}
                          className="h-8 px-2 rounded-md bg-[#192822] hover:bg-[#233830] border border-[#2f493e] text-[11px] font-medium text-[#e8c468] flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <svg
                            className="w-3 h-3 text-[#e8c468] shrink-0"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            aria-hidden="true"
                          >
                            <path d="M11 5L6 9H2v6h4l5 4V5z" />
                            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                          </svg>
                          <span>Nghe</span>
                        </button>
                      </div>
                      <p className="text-[11px] text-[#b8b4a8] leading-snug">{prof.specialtyDesc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
