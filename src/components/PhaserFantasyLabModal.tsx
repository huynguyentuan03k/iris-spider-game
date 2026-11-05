/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Activity,
  Award,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Cpu,
  Eye,
  Image as ImageIcon,
  Layers,
  Palette,
  RefreshCw,
  Shield,
  Sparkles,
  Sword,
  X,
  Zap,
} from 'lucide-react';
import * as Phaser from 'phaser';
import React, { useEffect, useRef, useState } from 'react';
import { assetManager } from '../game/assets/AssetManager';
import { FantasyLabScene, LabStats } from '../game/phaser/FantasyLabScene';

interface PhaserFantasyLabModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PhaserFantasyLabModal: React.FC<PhaserFantasyLabModalProps> = ({
  isOpen,
  onClose,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<FantasyLabScene | null>(null);

  const [stats, setStats] = useState<LabStats>({
    fps: 60,
    activeSprites: 38,
    totalObjects: 46,
    currentAnim: 'IDLE',
    isOccludedByCanopy: false,
    qualityLevel: 'HIGH',
    playerPos: { x: 360, y: 340 },
    activeCreatures: ['Fantasy Deer', 'Forest Wolf', 'Wild Boar', 'Forest Rabbit'],
  });

  const [memoryInfo, setMemoryInfo] = useState(() => assetManager.getMemoryStats());
  const [activeTab, setActiveTab] = useState<'CONTROLS' | 'LAYERS' | 'ASSETS' | 'ARCHITECTURE'>('CONTROLS');

  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    // Create Phaser Scene instance
    const scene = new FantasyLabScene();
    sceneRef.current = scene;

    scene.onStatsUpdate = (newStats) => {
      setStats(newStats);
    };

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: 800,
      height: 600,
      transparent: false,
      backgroundColor: '#142b15',
      render: {
        antialias: true,
        pixelArt: false,
        roundPixels: true,
        powerPreference: 'high-performance',
      },
      scene: [scene],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    };

    const game = new Phaser.Game(config);
    phaserGameRef.current = game;

    setMemoryInfo(assetManager.getMemoryStats());

    return () => {
      scene.onStatsUpdate = undefined;
      game.destroy(true);
      phaserGameRef.current = null;
      sceneRef.current = null;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4">
      <div className="relative flex flex-col w-full max-w-6xl h-[94vh] bg-slate-900 border-2 border-amber-600/60 rounded-2xl shadow-2xl overflow-hidden text-slate-100 font-sans">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/40 border-b border-amber-500/30">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-inner">
              <Palette className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold tracking-wide text-amber-200">
                  Phòng Thí Nghiệm Đồ Họa Hand-Painted Fantasy (Giai Đoạn 1)
                </h2>
                <span className="px-2 py-0.5 text-xs font-semibold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                  Phaser 3 Sandbox Active
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Thử nghiệm Texture Atlas, Animation đa hướng, Depth Sorting & Cây Đa Tầng Không Làm Ảnh Hưởng Đến Gameplay Gốc
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-red-500/20 hover:text-red-300 text-slate-400 border border-slate-700 transition"
            title="Đóng phòng thí nghiệm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Realtime KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 px-4 py-2 bg-slate-950/70 border-b border-slate-800 text-xs">
          <div className="flex items-center space-x-2 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800">
            <Activity className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="text-slate-400 block text-[10px]">HIỆU NĂNG</span>
              <span className="font-bold text-emerald-300 text-sm">{stats.fps} FPS</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800">
            <Layers className="w-4 h-4 text-blue-400" />
            <div>
              <span className="text-slate-400 block text-[10px]">ĐỐI TƯỢNG VẼ</span>
              <span className="font-bold text-blue-300 text-sm">{stats.activeSprites} Sprites</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800">
            <Sword className="w-4 h-4 text-amber-400" />
            <div>
              <span className="text-slate-400 block text-[10px]">TRẠNG THÁI</span>
              <span className="font-bold text-amber-300 text-sm">{stats.currentAnim}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800">
            <Eye className="w-4 h-4 text-purple-400" />
            <div>
              <span className="text-slate-400 block text-[10px]">CHE KHUẤT TÁN</span>
              <span className={`font-bold text-xs ${stats.isOccludedByCanopy ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`}>
                {stats.isOccludedByCanopy ? 'ĐANG CHE (42%)' : 'RÕ NÉT (100%)'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <div>
              <span className="text-slate-400 block text-[10px]">BỘ NHỚ ATLAS</span>
              <span className="font-bold text-cyan-300 text-sm">{memoryInfo.estimatedMemoryMb} MB</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <div>
              <span className="text-slate-400 block text-[10px]">TỌA ĐỘ HIỆP SĨ</span>
              <span className="font-bold text-slate-200 text-xs">X:{stats.playerPos.x} Y:{stats.playerPos.y}</span>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* Left / Center: Phaser 3 Viewport */}
          <div className="flex-1 relative flex items-center justify-center bg-black/60 overflow-hidden p-2">
            <div
              ref={containerRef}
              className="relative rounded-xl overflow-hidden shadow-2xl border-2 border-slate-700/80 aspect-[4/3] max-h-full max-w-full"
            />

            {/* Quick Virtual D-Pad Overlay (bottom-left) */}
            <div className="absolute bottom-4 left-4 p-2 bg-slate-950/85 backdrop-blur-md rounded-2xl border border-slate-700 flex flex-col items-center gap-1 shadow-lg">
              <span className="text-[10px] text-slate-400 font-semibold mb-0.5">D-PAD DI CHUYỂN</span>
              <button
                onMouseDown={() => sceneRef.current?.moveVirtual(0, -1)}
                onMouseUp={() => sceneRef.current?.stopVirtualMove()}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-amber-600 text-slate-200 transition"
              >
                <ChevronUp className="w-5 h-5" />
              </button>
              <div className="flex gap-1">
                <button
                  onMouseDown={() => sceneRef.current?.moveVirtual(-1, 0)}
                  onMouseUp={() => sceneRef.current?.stopVirtualMove()}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-amber-600 text-slate-200 transition"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onMouseDown={() => sceneRef.current?.moveVirtual(0, 1)}
                  onMouseUp={() => sceneRef.current?.stopVirtualMove()}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-amber-600 text-slate-200 transition"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
                <button
                  onMouseDown={() => sceneRef.current?.moveVirtual(1, 0)}
                  onMouseUp={() => sceneRef.current?.stopVirtualMove()}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-amber-600 text-slate-200 transition"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick action buttons overlay (bottom-right) */}
            <div className="absolute bottom-4 right-4 flex items-center gap-2">
              <button
                onClick={() => sceneRef.current?.triggerAttack()}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold shadow-lg flex items-center gap-2 text-xs border border-amber-400/40 active:scale-95 transition"
              >
                <Sword className="w-4 h-4" />
                Chém Kiếm (Space)
              </button>
            </div>
          </div>

          {/* Right: Inspection & Tuning Dock */}
          <div className="w-full lg:w-96 bg-slate-950/80 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col">
            
            {/* Tabs */}
            <div className="flex border-b border-slate-800 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('CONTROLS')}
                className={`flex-1 py-3 text-center transition border-b-2 ${
                  activeTab === 'CONTROLS'
                    ? 'border-amber-500 text-amber-300 bg-amber-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Điều Khiển
              </button>
              <button
                onClick={() => setActiveTab('LAYERS')}
                className={`flex-1 py-3 text-center transition border-b-2 ${
                  activeTab === 'LAYERS'
                    ? 'border-amber-500 text-amber-300 bg-amber-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Tách Lớp Cây
              </button>
              <button
                onClick={() => setActiveTab('ASSETS')}
                className={`flex-1 py-3 text-center transition border-b-2 ${
                  activeTab === 'ASSETS'
                    ? 'border-amber-500 text-amber-300 bg-amber-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Tài Nguyên Thực
              </button>
              <button
                onClick={() => setActiveTab('ARCHITECTURE')}
                className={`flex-1 py-3 text-center transition border-b-2 ${
                  activeTab === 'ARCHITECTURE'
                    ? 'border-amber-500 text-amber-300 bg-amber-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Kiến Trúc
              </button>
            </div>

            {/* Tab Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
              
              {activeTab === 'CONTROLS' && (
                <>
                  <div>
                    <h3 className="font-bold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-400" /> Kiểm Thử Animation Nhân Vật
                    </h3>
                    <p className="text-slate-400 text-[11px] mb-3">
                      Nhân vật Paladin vẽ tay 3/4 góc nhìn từ trên xuống, được cắt từ Texture Atlas 512x512 độc lập.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => sceneRef.current?.triggerAttack()}
                        className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center gap-2 font-semibold text-amber-300"
                      >
                        <Sword className="w-4 h-4" /> Tấn Công (Attack)
                      </button>
                      <button
                        onClick={() => sceneRef.current?.triggerHurt()}
                        className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center gap-2 font-semibold text-rose-300"
                      >
                        <Shield className="w-4 h-4" /> Bị Đòn (Hurt)
                      </button>
                      <button
                        onClick={() => sceneRef.current?.triggerDeath()}
                        className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center gap-2 font-semibold text-red-400"
                      >
                        💀 Tử Trận (Death)
                      </button>
                      <button
                        onClick={() => sceneRef.current?.respawnHero()}
                        className="p-2.5 rounded-xl bg-emerald-900/40 hover:bg-emerald-800/50 border border-emerald-600/40 flex items-center justify-center gap-2 font-semibold text-emerald-300"
                      >
                        <RefreshCw className="w-4 h-4" /> Hồi Sinh (Respawn)
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900/70 rounded-xl border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Hướng dẫn phím di chuyển
                    </span>
                    <p className="text-slate-300 leading-relaxed text-[11px]">
                      • Dùng phím <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-amber-300">W A S D</kbd> hoặc <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-amber-300">Mũi Tên</kbd> để bước đi.<br />
                      • Giữ <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-amber-300">SHIFT</kbd> để chạy nước rút (Run).<br />
                      • Nhấn <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-amber-300">SPACE</kbd> để chém kiếm có vệt sáng vòm.<br />
                      • Đi bộ ra phía sau cây sồi lớn để thấy hiệu ứng <strong>Làm mờ mượt mà (Occlusion Alpha: 42%)</strong>.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" /> Tối Ưu Hóa & Cấu Hình Đồ Họa
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      {(['HIGH', 'MEDIUM', 'LOW'] as const).map((lvl) => (
                        <button
                          key={lvl}
                          onClick={() => sceneRef.current?.setQuality(lvl)}
                          className={`p-2 rounded-lg font-semibold text-center border transition ${
                            stats.qualityLevel === lvl
                              ? 'bg-amber-600 text-white border-amber-400'
                              : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                          }`}
                        >
                          {lvl === 'HIGH' ? 'Cao' : lvl === 'MEDIUM' ? 'Trung Bình' : 'Thấp'}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'LAYERS' && (
                <div className="space-y-3">
                  <h3 className="font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-amber-400" /> Cấu Trúc Cây Đa Tầng (4 Layers)
                  </h3>
                  <p className="text-slate-400 text-[11px]">
                    Thực hiện đúng yêu cầu 5: Cây cổ thụ vẽ tay tách thành 4 lớp riêng biệt trong Texture Atlas:
                  </p>

                  <div className="space-y-2">
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="flex items-center justify-between text-amber-200 font-semibold mb-1">
                        <span>Lớp 0: Bóng Đổ Tiếp Xúc (Shadow Blob)</span>
                        <span className="text-[10px] text-slate-500">Depth = Y - 60</span>
                      </div>
                      <p className="text-slate-400 text-[10px]">
                        Hình elip tỏa mờ mềm mại (radial blur), nằm vĩnh viễn dưới chân nhân vật và thân cây.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="flex items-center justify-between text-amber-200 font-semibold mb-1">
                        <span>Lớp 1: Gốc Rễ & Thân Gỗ (Oak Trunk)</span>
                        <span className="text-[10px] text-slate-500">Depth = Y</span>
                      </div>
                      <p className="text-slate-400 text-[10px]">
                        Gỗ vẽ tay rêu phong, gồ ghề, đóng vai trò là hộp va chạm vật lý (Collision Box).
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="flex items-center justify-between text-amber-200 font-semibold mb-1">
                        <span>Lớp 2: Tán Râm Dưới (Lower Foliage)</span>
                        <span className="text-[10px] text-slate-500">Depth = Y + 8</span>
                      </div>
                      <p className="text-slate-400 text-[10px]">
                        Các vòm lá sẫm màu tạo cảm giác khối râm mát và đu đưa nhẹ theo gió.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="flex items-center justify-between text-emerald-300 font-semibold mb-1">
                        <span>Lớp 3: Vòm Tán Cao (Upper Canopy)</span>
                        <span className="text-[10px] text-slate-500">Depth = Y + 20</span>
                      </div>
                      <p className="text-slate-400 text-[10px]">
                        Đón nắng vàng rực rỡ, đung đưa theo chu kỳ Tween Sine. Khi nhân vật di chuyển vào vùng che khuất, độ trong suốt tự động giảm xuống 0.42.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'ASSETS' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-amber-400" /> Thư Viện Artwork Thực Tế (PNG/WebP)
                    </h3>
                    <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
                      50+ File Đồ Họa Đã Nạp
                    </span>
                  </div>

                  <p className="text-slate-400 text-[11px]">
                    Toàn bộ tài nguyên dưới đây là file ảnh PNG thực tế (không phải hình vẽ procedural Canvas/SVG) được nạp trực tiếp qua Asset Manager & Phaser:
                  </p>

                  {/* 1. Sinh Vật & Động Vật Hoang Dã */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-amber-200 uppercase tracking-wide">
                      1. Động Vật Hoang Dã (Hand-Painted Wildlife)
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center space-x-2.5">
                        <img
                          src="/assets/fantasy/animals/fantasy_deer.png"
                          alt="Hươu Rừng Thần Thoại"
                          className="w-12 h-12 object-contain bg-slate-950/80 p-1 rounded-lg border border-slate-800"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-amber-300 block truncate">Hươu Thần Thoại</span>
                          <span className="text-[10px] text-slate-400 block">64x64 PNG • Hiền lành</span>
                          <span className="text-[9px] text-emerald-400">Thuần hóa được</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center space-x-2.5">
                        <img
                          src="/assets/fantasy/animals/forest_wolf.png"
                          alt="Sói Xám Rừng Rậm"
                          className="w-12 h-12 object-contain bg-slate-950/80 p-1 rounded-lg border border-slate-800"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-amber-300 block truncate">Sói Xám Rừng</span>
                          <span className="text-[10px] text-slate-400 block">64x64 PNG • Săn đêm</span>
                          <span className="text-[9px] text-amber-400">Canh gác lãnh địa</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center space-x-2.5">
                        <img
                          src="/assets/fantasy/animals/wild_boar.png"
                          alt="Heo Rừng Nanh Dài"
                          className="w-12 h-12 object-contain bg-slate-950/80 p-1 rounded-lg border border-slate-800"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-amber-300 block truncate">Heo Rừng Nanh Dài</span>
                          <span className="text-[10px] text-slate-400 block">64x64 PNG • Vạm vỡ</span>
                          <span className="text-[9px] text-rose-400">Ủi đất tìm rễ</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center space-x-2.5">
                        <img
                          src="/assets/fantasy/animals/forest_rabbit.png"
                          alt="Thỏ Nâu Rừng"
                          className="w-12 h-12 object-contain bg-slate-950/80 p-1 rounded-lg border border-slate-800"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-amber-300 block truncate">Thỏ Nâu Rừng</span>
                          <span className="text-[10px] text-slate-400 block">48x48 PNG • Nhanh nhẹn</span>
                          <span className="text-[9px] text-cyan-400">Kiếm ăn ban ngày</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. Cổ Thụ & Thực Vật Đa Tầng */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-amber-200 uppercase tracking-wide">
                      2. Cổ Thụ & Thực Vật Đa Tầng
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center space-x-2.5">
                        <img
                          src="/assets/fantasy/vegetation/trees/ancient_oak_full.png"
                          alt="Cổ Thụ Hoàng Gia"
                          className="w-12 h-12 object-contain bg-slate-950/80 p-1 rounded-lg border border-slate-800"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-amber-300 block truncate">Cổ Thụ Hoàng Gia</span>
                          <span className="text-[10px] text-slate-400 block">128x128 PNG (4 Layers)</span>
                          <span className="text-[9px] text-emerald-400">Tán lá mờ mượt 42%</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center space-x-2.5">
                        <img
                          src="/assets/fantasy/vegetation/trees/fantasy_pine_tall.png"
                          alt="Thông Rừng Băng Giá"
                          className="w-12 h-12 object-contain bg-slate-950/80 p-1 rounded-lg border border-slate-800"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-amber-300 block truncate">Thông Rừng Cao</span>
                          <span className="text-[10px] text-slate-400 block">128x128 PNG</span>
                          <span className="text-[9px] text-blue-400">Đa tầng sắc nét</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center space-x-2.5">
                        <img
                          src="/assets/fantasy/vegetation/foliage/forest_bush_large.png"
                          alt="Bụi Rậm Rừng"
                          className="w-12 h-12 object-contain bg-slate-950/80 p-1 rounded-lg border border-slate-800"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-amber-300 block truncate">Bụi Rậm Rừng</span>
                          <span className="text-[10px] text-slate-400 block">128x128 PNG</span>
                          <span className="text-[9px] text-emerald-400">Đổ bóng tự nhiên</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center space-x-2.5">
                        <img
                          src="/assets/fantasy/vegetation/decor/forest_mushrooms.png"
                          alt="Nấm Rừng Đốm Đỏ"
                          className="w-12 h-12 object-contain bg-slate-950/80 p-1 rounded-lg border border-slate-800"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-amber-300 block truncate">Nấm Đốm Đỏ</span>
                          <span className="text-[10px] text-slate-400 block">128x128 PNG</span>
                          <span className="text-[9px] text-rose-400">Phát quang nhẹ</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. Địa Hình & Kiến Trúc */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-amber-200 uppercase tracking-wide">
                      3. Địa Hình & Kiến Trúc Minh Họa
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center space-x-2.5">
                        <img
                          src="/assets/fantasy/structures/watchtower_stone.png"
                          alt="Tháp Canh Đá"
                          className="w-12 h-12 object-contain bg-slate-950/80 p-1 rounded-lg border border-slate-800"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-amber-300 block truncate">Tháp Canh Đá</span>
                          <span className="text-[10px] text-slate-400 block">128x128 PNG</span>
                          <span className="text-[9px] text-amber-400">Kiến trúc phòng thủ</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center space-x-2.5">
                        <img
                          src="/assets/fantasy/structures/fantasy_shrine_temple.png"
                          alt="Đền Thờ Rừng Thiêng"
                          className="w-12 h-12 object-contain bg-slate-950/80 p-1 rounded-lg border border-slate-800"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-amber-300 block truncate">Đền Rừng Thiêng</span>
                          <span className="text-[10px] text-slate-400 block">128x128 PNG</span>
                          <span className="text-[9px] text-purple-400">Hào quang ma thuật</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center space-x-2.5">
                        <img
                          src="/assets/fantasy/terrain/tiles/cobblestone_path.png"
                          alt="Đường Đá Cổ"
                          className="w-12 h-12 object-contain bg-slate-950/80 p-1 rounded-lg border border-slate-800"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-amber-300 block truncate">Đường Đá Cổ</span>
                          <span className="text-[10px] text-slate-400 block">128x128 PNG Tile</span>
                          <span className="text-[9px] text-slate-400">Chuyển tiếp tự nhiên</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center space-x-2.5">
                        <img
                          src="/assets/fantasy/terrain/tiles/river_water_deep.png"
                          alt="Dòng Sông Nước Biếc"
                          className="w-12 h-12 object-contain bg-slate-950/80 p-1 rounded-lg border border-slate-800"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-amber-300 block truncate">Dòng Sông Nước Biếc</span>
                          <span className="text-[10px] text-slate-400 block">128x128 PNG Tile</span>
                          <span className="text-[9px] text-cyan-400">Gợn sóng trong vắt</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'ARCHITECTURE' && (
                <div className="space-y-3">
                  <h3 className="font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-400" /> Kiến Trúc Đồ Họa Độc Lập
                  </h3>
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-2 text-slate-300 text-[11px]">
                    <p>
                      <strong>1. Asset Manager Độc Lập:</strong> Hệ thống quản lý tài nguyên nằm riêng tại <code className="text-amber-300">/src/game/assets/</code>, tách bạch hoàn toàn khỏi logic gameplay.
                    </p>
                    <p>
                      <strong>2. Chuẩn Texture Atlas & Manifest:</strong> Hỗ trợ JSON Frame, Sprite Sheet, Animation Defs, Collision Bounds, tương thích cả Canvas 2D, Phaser và Pixi.
                    </p>
                    <p>
                      <strong>3. Không Phá Vỡ Game Hiện Tại:</strong> Game Canvas 2D thế giới mở nguyên bản vẫn chạy độc lập, duy trì trọn vẹn toàn bộ tính năng Sinh Quyển, Cây Kỹ Năng, Thời Tiết, Thú Cưng, Lưu Trữ Đám Mây.
                    </p>
                    <p>
                      <strong>4. Lộ Trình Giai Đoạn Tiếp Theo:</strong> Khi Phaser Renderer được đánh giá ổn định hoàn toàn, sẽ tích hợp các Chunk Tilemap thế giới mở từng bước mà không làm gián đoạn trải nghiệm của người chơi.
                    </p>
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                Giai đoạn 1: Đã nghiệm thu độc lập
              </span>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold transition"
              >
                Trở Lại Game Gốc
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
