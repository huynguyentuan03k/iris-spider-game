/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  CharacterAppearance,
  DEFAULT_CHARACTER,
  HAIR_COLORS,
  HAIR_STYLES,
  OUTFIT_CLASSES,
  OUTFIT_COLORS,
  SKIN_COLORS,
  drawCharacterSprite,
  getRandomName,
  saveCharacterProfile,
} from '../game/characterArt';
import { sound } from '../game/audio';
import { Sparkles, Dice5, Check, ChevronRight, User, Palette, Crown, Shield, Shirt } from 'lucide-react';

interface CharacterCustomizerModalProps {
  initialProfile?: CharacterAppearance;
  onConfirm: (profile: CharacterAppearance) => void;
  onCancel?: () => void;
  isInitialSetup?: boolean;
}

export const CharacterCustomizerModal: React.FC<CharacterCustomizerModalProps> = ({
  initialProfile,
  onConfirm,
  onCancel,
  isInitialSetup = false,
}) => {
  const [profile, setProfile] = useState<CharacterAppearance>(() => {
    return initialProfile || DEFAULT_CHARACTER;
  });

  const [activeTab, setActiveTab] = useState<'basics' | 'hair' | 'outfit' | 'class'>('basics');
  const [animMode, setAnimMode] = useState<'idle' | 'walk' | 'attack'>('idle');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);

  // Live Canvas Animation
  useEffect(() => {
    let lastTs = performance.now();
    const render = (now: number) => {
      const dt = (now - lastTs) / 1000;
      lastTs = now;
      timeRef.current += dt;

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Soft backdrop pedestal glow
          const cx = canvas.width / 2;
          const cy = canvas.height / 2 + 35;

          const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 90);
          grad.addColorStop(0, `${profile.color}33`);
          grad.addColorStop(0.7, `${profile.color}0a`);
          grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(cx, cy, 90, 0, Math.PI * 2);
          ctx.fill();

          // Pedestal stone ring
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.ellipse(cx, cy + 30, 65, 22, 0, 0, Math.PI * 2);
          ctx.stroke();

          // Render Character Sprite with 3.8x scale
          drawCharacterSprite(ctx, {
            x: cx,
            y: cy + 18,
            scale: 3.8,
            facing: 'right',
            appearance: profile,
            anim: animMode,
            animTime: timeRef.current,
            showNametag: true,
            nametagSubtitle: OUTFIT_CLASSES.find((c) => c.id === profile.outfitStyle)?.name,
            glowAura: true,
            shadow: true,
          });
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [profile, animMode]);

  const handleRandomizeName = () => {
    sound.playPickup();
    const newName = getRandomName();
    setProfile((prev) => ({ ...prev, name: newName }));
  };

  const handleRandomizeAll = () => {
    sound.playCraftOrHeal();
    const randColor = OUTFIT_COLORS[Math.floor(Math.random() * OUTFIT_COLORS.length)].hex;
    const randSkin = SKIN_COLORS[Math.floor(Math.random() * SKIN_COLORS.length)].hex;
    const randHairStyle = HAIR_STYLES[Math.floor(Math.random() * HAIR_STYLES.length)].id;
    const randHairColor = HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)].hex;
    const randClass = OUTFIT_CLASSES[Math.floor(Math.random() * OUTFIT_CLASSES.length)].id;
    const randName = getRandomName();

    setProfile({
      name: randName,
      color: randColor,
      skinColor: randSkin,
      hairStyle: randHairStyle,
      hairColor: randHairColor,
      outfitStyle: randClass,
    });
  };

  const handleSave = () => {
    sound.playObeliskActivate();
    const finalProfile: CharacterAppearance = {
      ...profile,
      name: profile.name.trim() || 'Nhà Thám Hiểm',
    };
    saveCharacterProfile(finalProfile);
    onConfirm(finalProfile);
  };

  const currentClass = OUTFIT_CLASSES.find((c) => c.id === profile.outfitStyle) || OUTFIT_CLASSES[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-gradient-to-t from-[#060a09]/96 via-[#09110f]/92 to-[#060a09]/96 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-4xl bg-[#0f1715]/95 border border-[#2b3d36] rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#22332c] flex items-center justify-between bg-[#14201b]/80">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-inner"
              style={{
                backgroundColor: `${profile.color}22`,
                borderColor: `${profile.color}66`,
              }}
            >
              <User className="w-5 h-5" style={{ color: profile.color }} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#f7f4eb] flex items-center gap-2">
                <span>{isInitialSetup ? 'Thiết Lập Nhân Vật Khởi Hành' : 'Tùy Chỉnh Nhân Vật'}</span>
                <span className="text-xs font-normal px-2 py-0.5 rounded bg-[#1e2e28] text-[#e8c468] border border-[#3b5247]">
                  Sinh Quyển Trái Đất
                </span>
              </h2>
              <p className="text-xs text-[#94a3b8]">
                Chọn ngoại hình, màu áo choàng và danh xưng của bạn trước khi bước vào sảnh chờ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRandomizeAll}
              className="h-9 px-3 rounded-lg bg-[#182620] hover:bg-[#22352c] border border-[#30453c] text-xs font-medium text-[#e2e8f0] flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Ngẫu nhiên toàn bộ ngoại hình và danh xưng"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#fbbf24]" />
              <span>Ngẫu Nhiên</span>
            </button>
            {onCancel && !isInitialSetup && (
              <button
                type="button"
                onClick={onCancel}
                className="h-9 px-3 rounded-lg bg-transparent hover:bg-[#1f2d26] text-xs text-[#94a3b8] transition-colors cursor-pointer"
              >
                Đóng
              </button>
            )}
          </div>
        </div>

        {/* 2-Column Body: Left Character Stage + Right Customization Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden">
          {/* Left Hero Canvas Stage */}
          <div className="md:col-span-5 p-5 flex flex-col items-center justify-between border-b md:border-b-0 md:border-r border-[#22332c] bg-gradient-to-b from-[#0c1412] to-[#121c19]">
            <div className="w-full flex items-center justify-between text-xs text-[#94a3b8]">
              <span className="font-medium text-[#e2e8f0]">Mô Hình Trực Quan 2D</span>
              <div className="flex items-center gap-1 bg-[#16221c] p-1 rounded-lg border border-[#2b3d36]">
                <button
                  type="button"
                  onClick={() => setAnimMode('idle')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    animMode === 'idle' ? 'bg-[#3b5247] text-[#fde047]' : 'text-[#94a3b8] hover:text-[#e2e8f0]'
                  }`}
                >
                  Đứng
                </button>
                <button
                  type="button"
                  onClick={() => setAnimMode('walk')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    animMode === 'walk' ? 'bg-[#3b5247] text-[#fde047]' : 'text-[#94a3b8] hover:text-[#e2e8f0]'
                  }`}
                >
                  Chạy
                </button>
                <button
                  type="button"
                  onClick={() => setAnimMode('attack')}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    animMode === 'attack' ? 'bg-[#3b5247] text-[#fde047]' : 'text-[#94a3b8] hover:text-[#e2e8f0]'
                  }`}
                >
                  Tấn Công
                </button>
              </div>
            </div>

            {/* Canvas */}
            <div className="relative my-auto flex items-center justify-center py-2">
              <canvas
                ref={canvasRef}
                width={260}
                height={260}
                className="max-w-[240px] aspect-square rounded-2xl drop-shadow-[0_10px_25px_rgba(0,0,0,0.6)]"
              />
            </div>

            {/* Selected Class Perk Card */}
            <div className="w-full bg-[#16221d]/90 border border-[#2b3f36] rounded-xl p-3 text-left">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#f7f4eb] flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#fbbf24]" />
                  {currentClass.name}
                </span>
                <span className="text-[10px] text-[#38bdf8] font-medium">{currentClass.title}</span>
              </div>
              <p className="mt-1 text-[11px] text-[#cbd5e1] leading-relaxed">
                {currentClass.desc}
              </p>
              <div className="mt-1.5 pt-1.5 border-t border-[#24352e] text-[10px] text-[#a3e635] flex items-center gap-1">
                <span>✨ Đặc quyền:</span>
                <span>{currentClass.perk}</span>
              </div>
            </div>
          </div>

          {/* Right Customization Controls */}
          <div className="md:col-span-7 flex flex-col overflow-hidden bg-[#0d1513]">
            {/* Nav Tabs */}
            <div className="flex border-b border-[#22332c] px-4 pt-3 gap-2 bg-[#121c18]/60 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('basics')}
                className={`pb-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  activeTab === 'basics'
                    ? 'border-[#e8c468] text-[#e8c468]'
                    : 'border-transparent text-[#94a3b8] hover:text-[#e2e8f0]'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Tên & Màu Sắc</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('hair')}
                className={`pb-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  activeTab === 'hair'
                    ? 'border-[#e8c468] text-[#e8c468]'
                    : 'border-transparent text-[#94a3b8] hover:text-[#e2e8f0]'
                }`}
              >
                <Crown className="w-3.5 h-3.5" />
                <span>Tóc & Mũ Trùm</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('class')}
                className={`pb-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  activeTab === 'class'
                    ? 'border-[#e8c468] text-[#e8c468]'
                    : 'border-transparent text-[#94a3b8] hover:text-[#e2e8f0]'
                }`}
              >
                <Shirt className="w-3.5 h-3.5" />
                <span>Nghề Nghiệp & Trang Phục</span>
              </button>
            </div>

            {/* Scrollable Tab Content */}
            <div className="p-5 flex-1 overflow-y-auto space-y-5">
              {/* TAB 1: Basics (Name, Outfit Accent Color, Skin Tone) */}
              {activeTab === 'basics' && (
                <div className="space-y-5">
                  {/* Name Input */}
                  <div>
                    <label className="block text-xs font-semibold text-[#f7f4eb] mb-1.5">
                      Tên Nhà Thám Hiểm
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={20}
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        placeholder="Nhập tên nhân vật..."
                        className="flex-1 h-10 px-3.5 rounded-lg bg-[#14201b] border border-[#2e4238] focus:border-[#e8c468] focus:outline-none text-sm text-[#f7f4eb] placeholder-[#64748b]"
                      />
                      <button
                        type="button"
                        onClick={handleRandomizeName}
                        className="h-10 px-3.5 rounded-lg bg-[#1e2e26] hover:bg-[#283d33] border border-[#385044] text-xs font-medium text-[#e2e8f0] flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Tạo tên ngẫu nhiên"
                      >
                        <Dice5 className="w-4 h-4 text-[#e8c468]" />
                        <span>Ngẫu nhiên</span>
                      </button>
                    </div>
                  </div>

                  {/* Outfit Accent Color */}
                  <div>
                    <label className="block text-xs font-semibold text-[#f7f4eb] mb-1.5">
                      Màu Áo Choàng & Phù Hiệu
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {OUTFIT_COLORS.map((col) => {
                        const isSelected = profile.color === col.hex;
                        return (
                          <button
                            key={col.hex}
                            type="button"
                            onClick={() => {
                              sound.playPickup();
                              setProfile({ ...profile, color: col.hex });
                            }}
                            className={`p-2 rounded-xl border flex items-center gap-2 transition-all cursor-pointer text-left ${
                              isSelected
                                ? 'bg-[#1b2b24] border-[#e8c468] shadow-md ring-1 ring-[#e8c468]/50'
                                : 'bg-[#121c17] border-[#25362f] hover:border-[#385044]'
                            }`}
                          >
                            <span
                              className="w-5 h-5 rounded-full shrink-0 shadow-sm border border-white/30 flex items-center justify-center"
                              style={{ backgroundColor: col.hex }}
                            >
                              {isSelected && <Check className="w-3 h-3 text-slate-900 stroke-[3]" />}
                            </span>
                            <span className="text-[11px] font-medium text-[#e2e8f0] truncate">
                              {col.name.split(' ')[0]}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Skin Tone */}
                  <div>
                    <label className="block text-xs font-semibold text-[#f7f4eb] mb-1.5">
                      Sắc Tộc & Màu Da
                    </label>
                    <div className="flex flex-wrap gap-2.5">
                      {SKIN_COLORS.map((skin) => {
                        const isSelected = profile.skinColor === skin.hex;
                        return (
                          <button
                            key={skin.hex}
                            type="button"
                            onClick={() => {
                              sound.playPickup();
                              setProfile({ ...profile, skinColor: skin.hex });
                            }}
                            className={`h-9 px-3 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#1b2b24] border-[#e8c468] ring-1 ring-[#e8c468]/50'
                                : 'bg-[#121c17] border-[#25362f] hover:border-[#385044]'
                            }`}
                          >
                            <span
                              className="w-4 h-4 rounded-full shrink-0 border border-black/20"
                              style={{ backgroundColor: skin.hex }}
                            />
                            <span className="text-xs text-[#e2e8f0]">{skin.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Hair & Headwear */}
              {activeTab === 'hair' && (
                <div className="space-y-5">
                  {/* Hair / Headwear Style */}
                  <div>
                    <label className="block text-xs font-semibold text-[#f7f4eb] mb-1.5">
                      Kiểu Tóc & Mũ Đội
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {HAIR_STYLES.map((h) => {
                        const isSelected = profile.hairStyle === h.id;
                        return (
                          <button
                            key={h.id}
                            type="button"
                            onClick={() => {
                              sound.playPickup();
                              setProfile({ ...profile, hairStyle: h.id });
                            }}
                            className={`p-3 rounded-xl border flex items-start gap-3 transition-all cursor-pointer text-left ${
                              isSelected
                                ? 'bg-[#1b2b24] border-[#e8c468] shadow-md ring-1 ring-[#e8c468]/50'
                                : 'bg-[#121c17] border-[#25362f] hover:border-[#385044]'
                            }`}
                          >
                            <span className="text-2xl shrink-0">{h.icon}</span>
                            <div>
                              <div className="text-xs font-bold text-[#f7f4eb]">{h.name}</div>
                              <p className="text-[11px] text-[#94a3b8] mt-0.5">{h.desc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Hair Color */}
                  <div>
                    <label className="block text-xs font-semibold text-[#f7f4eb] mb-1.5">
                      Màu Tóc
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {HAIR_COLORS.map((hc) => {
                        const isSelected = profile.hairColor === hc.hex;
                        return (
                          <button
                            key={hc.hex}
                            type="button"
                            onClick={() => {
                              sound.playPickup();
                              setProfile({ ...profile, hairColor: hc.hex });
                            }}
                            className={`p-2 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#1b2b24] border-[#e8c468] ring-1 ring-[#e8c468]/50'
                                : 'bg-[#121c17] border-[#25362f] hover:border-[#385044]'
                            }`}
                          >
                            <span
                              className="w-4 h-4 rounded-full shrink-0 border border-white/20"
                              style={{ backgroundColor: hc.hex }}
                            />
                            <span className="text-xs text-[#e2e8f0] truncate">{hc.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Class & Archetype */}
              {activeTab === 'class' && (
                <div className="space-y-4">
                  <label className="block text-xs font-semibold text-[#f7f4eb] mb-1">
                    Chọn Lớp Nghề Khám Phá Sinh Quyển
                  </label>
                  <p className="text-xs text-[#94a3b8] mb-3">
                    Lớp nghề định hình trang phục, phù hiệu và tinh thần thám hiểm trên khắp các châu lục Trái Đất.
                  </p>

                  <div className="space-y-2.5">
                    {OUTFIT_CLASSES.map((cls) => {
                      const isSelected = profile.outfitStyle === cls.id;
                      return (
                        <button
                          key={cls.id}
                          type="button"
                          onClick={() => {
                            sound.playCraftOrHeal();
                            setProfile({ ...profile, outfitStyle: cls.id });
                          }}
                          className={`w-full p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start justify-between gap-3 ${
                            isSelected
                              ? 'bg-[#1c2e25] border-[#e8c468] shadow-lg ring-1 ring-[#e8c468]/60'
                              : 'bg-[#121c17] border-[#25362f] hover:border-[#385044]'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-[#f7f4eb]">{cls.name}</span>
                              <span className="text-[11px] font-medium text-[#fbbf24]">· {cls.title}</span>
                            </div>
                            <p className="text-xs text-[#94a3b8] mt-1">{cls.desc}</p>
                            <p className="text-[11px] text-[#a3e635] mt-1.5 flex items-center gap-1 font-medium">
                              <span>✨ {cls.perk}</span>
                            </p>
                          </div>
                          <span
                            className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                              isSelected
                                ? 'bg-[#e8c468] border-[#e8c468] text-[#111916]'
                                : 'border-[#385044] bg-[#14201b]'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions Footer */}
            <div className="p-4 border-t border-[#22332c] bg-[#14201b]/90 flex items-center justify-between gap-4">
              <div className="text-xs text-[#cbd5e1] hidden sm:block">
                Nhân vật: <span className="font-semibold text-[#fde047]">{profile.name}</span> ({currentClass.name})
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                {onCancel && !isInitialSetup && (
                  <button
                    type="button"
                    onClick={onCancel}
                    className="h-11 px-4 rounded-xl bg-[#1b2722] hover:bg-[#25372f] border border-[#2f4339] text-xs font-semibold text-[#e2e8f0] transition-colors cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSave}
                  className="h-11 px-6 rounded-xl bg-gradient-to-r from-[#e8c468] to-[#f2d27e] hover:from-[#f2d27e] hover:to-[#fde68a] text-[#111916] font-bold text-sm tracking-wide shadow-xl flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
                >
                  <span>Xác Nhận & Vào Sảnh Chờ</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

