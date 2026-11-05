/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  CharacterAppearance,
  OUTFIT_CLASSES,
  drawCharacterSprite,
} from '../game/characterArt';
import { MultiplayerClient } from '../game/multiplayer/MultiplayerClient';
import {
  ChatMessage,
  CoOpRoom,
  MultiplayerConnectionStatus,
  RemotePlayer,
} from '../game/multiplayer/types';
import { sound } from '../game/audio';
import { REGION_LABELS, WORLD_LOCATIONS } from '../game/biodiversity';
import { WorldMapRenderData } from '../game/types';
import { TILE_SIZE, formatCoordLabel } from '../game/worldGen';
import { EarthMapCanvas } from './EarthMapCanvas';
import {
  Users,
  Compass,
  Play,
  Copy,
  Check,
  Send,
  Sparkles,
  Wifi,
  WifiOff,
  PlusCircle,
  LogIn,
  RefreshCw,
  Edit3,
  Globe,
  Radio,
  Lock,
  Unlock,
  Shield,
  MessageSquare,
} from 'lucide-react';

interface PrivateLobbyViewProps {
  playerProfile: CharacterAppearance;
  seed: number;
  canContinue: boolean;
  isMuted: boolean;
  userEmail: string | null;
  cloudSyncStatus: string | null;
  mapData: WorldMapRenderData | null;
  multiplayerClient: MultiplayerClient;
  onEditCharacter: () => void;
  onEnterMap: (worldX?: number, worldY?: number) => void;
  onContinue: () => void;
  onRerollSeed: () => void;
  onToggleMute: () => void;
  onGoogleAuth: () => void;
  onSignOut: () => void;
  onOpenPhaserLab?: () => void;
}

export const PrivateLobbyView: React.FC<PrivateLobbyViewProps> = ({
  playerProfile,
  seed,
  canContinue,
  isMuted,
  userEmail,
  cloudSyncStatus,
  mapData,
  multiplayerClient,
  onEditCharacter,
  onEnterMap,
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

  // Multiplayer Room & Squad states
  const [mpStatus, setMpStatus] = useState<MultiplayerConnectionStatus>(multiplayerClient.getStatus());
  const [currentRoom, setCurrentRoom] = useState(multiplayerClient.getCurrentRoom());
  const [squadPlayers, setSquadPlayers] = useState<RemotePlayer[]>(multiplayerClient.getRemotePlayers());
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(multiplayerClient.getRecentMessages());
  const [chatInput, setChatInput] = useState('');
  const [latency, setLatency] = useState(multiplayerClient.getLatency());

  // Lobby Tabs: 'play' | 'create_room' | 'browse_rooms'
  const [lobbyTab, setLobbyTab] = useState<'play' | 'room' | 'browse'>('play');

  // Room Creation Form states
  const [newRoomName, setNewRoomName] = useState(() => `Phòng của ${playerProfile.name}`);
  const [newRoomCode, setNewRoomCode] = useState(() => `IRIS-${Math.floor(1000 + Math.random() * 9000)}`);
  const [newRoomIsPrivate, setNewRoomIsPrivate] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [publicRooms, setPublicRooms] = useState<CoOpRoom[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [backendHealth, setBackendHealth] = useState<{ checked: boolean; healthy: boolean }>({
    checked: false,
    healthy: false,
  });

  // Hero Canvas Animation
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);

  // Fetch Public Rooms
  const fetchPublicRooms = async () => {
    setIsLoadingRooms(true);
    try {
      let res = await fetch('http://localhost:8001/api/v1/rooms').catch(() => null);
      if (!res || !res.ok) {
        res = await fetch('http://localhost:8001/api/multiplayer/rooms').catch(() => null);
      }
      if (!res || !res.ok) {
        res = await fetch('/api/multiplayer/rooms').catch(() => null);
      }
      if (res && res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.rooms || [];
        setPublicRooms(list);
      }
    } catch (e) {
      console.warn('Failed to fetch rooms in lobby:', e);
    } finally {
      setIsLoadingRooms(false);
    }
  };

  useEffect(() => {
    fetchPublicRooms();

    // Check backend health at http://localhost:8001/api/v1/health
    multiplayerClient.checkBackendHealth().then((h) => {
      setBackendHealth({ checked: true, healthy: h.healthy });
    });

    multiplayerClient.setEvents({
      onStatusChange: (s) => setMpStatus(s),
      onPlayersChange: (p) => setSquadPlayers([...p]),
      onRoomInfoChange: (r) => setCurrentRoom(r),
      onNewChatMessage: () => setChatMessages([...multiplayerClient.getRecentMessages()]),
    });

    const interval = setInterval(() => {
      setLatency(multiplayerClient.getLatency());
      setSquadPlayers(multiplayerClient.getRemotePlayers());
    }, 1500);

    return () => clearInterval(interval);
  }, [multiplayerClient]);

  // Live Hero Character Preview
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

          const cx = canvas.width / 2;
          const cy = canvas.height / 2 + 30;

          // Pedestal ground shadow & radiance
          const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 85);
          grad.addColorStop(0, `${playerProfile.color}35`);
          grad.addColorStop(0.7, `${playerProfile.color}0d`);
          grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(cx, cy, 85, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.ellipse(cx, cy + 26, 60, 20, 0, 0, Math.PI * 2);
          ctx.stroke();

          // Render Character Sprite
          drawCharacterSprite(ctx, {
            x: cx,
            y: cy + 14,
            scale: 3.6,
            facing: 'right',
            appearance: playerProfile,
            anim: 'idle',
            animTime: timeRef.current,
            showNametag: false,
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
  }, [playerProfile]);

  const handleCreateRoom = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const roomCode = newRoomCode.trim().toUpperCase() || `IRIS-${Math.floor(1000 + Math.random() * 9000)}`;
    const roomName = newRoomName.trim() || `Phòng của ${playerProfile.name}`;
    sound.playObeliskActivate();

    multiplayerClient.connect(
      roomCode,
      playerProfile.name,
      playerProfile.color,
      {
        skinColor: playerProfile.skinColor,
        hairStyle: playerProfile.hairStyle,
        hairColor: playerProfile.hairColor,
        outfitStyle: playerProfile.outfitStyle,
      },
      {
        customRoomName: roomName,
        isPrivate: newRoomIsPrivate,
        seed,
      }
    );

    setLobbyTab('room');
  };

  const handleJoinByCode = (codeToJoin?: string) => {
    const target = (codeToJoin || joinCodeInput).trim().toUpperCase();
    if (!target) return;
    sound.playObeliskActivate();

    multiplayerClient.connect(
      target,
      playerProfile.name,
      playerProfile.color,
      {
        skinColor: playerProfile.skinColor,
        hairStyle: playerProfile.hairStyle,
        hairColor: playerProfile.hairColor,
        outfitStyle: playerProfile.outfitStyle,
      }
    );

    setJoinCodeInput('');
    setLobbyTab('room');
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    multiplayerClient.sendChatMessage(chatInput.trim());
    setChatInput('');
    sound.playCraftOrHeal();
  };

  const handleCopyRoomCode = () => {
    navigator.clipboard.writeText(currentRoom.id);
    setCopiedCode(true);
    sound.playPickup();
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const currentClass = OUTFIT_CLASSES.find((c) => c.id === playerProfile.outfitStyle) || OUTFIT_CLASSES[0];
  const isCustomRoomActive = currentRoom.id !== 'global-sanctuary';

  return (
    <div className="fixed inset-0 z-20 flex flex-col justify-between p-4 sm:p-6 bg-gradient-to-t from-[#060b0a]/96 via-[#091312]/85 to-[#060b0a]/75 pointer-events-auto overflow-y-auto">
      {/* Top Perimeter Utility Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1c2c26]/60">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-[#d6d3c9]">
            <span className="font-semibold text-[#f7f4eb] flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-[#38bdf8]" />
              Sảnh Chờ Riêng
            </span>
            <span aria-hidden="true" className="text-[#475569]">·</span>
            <span className="font-mono-num tabular-nums text-[#e8c468]">Hạt giống #{seed}</span>
            <button
              type="button"
              onClick={onRerollSeed}
              className="text-[#e8c468] hover:text-[#fde68a] underline underline-offset-4 transition-colors whitespace-nowrap cursor-pointer text-xs"
            >
              Đổi biến thể
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* External WebSocket Server Health Indicator */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              mpStatus === 'CONNECTED'
                ? 'bg-[#10241b] border-emerald-500/40 text-emerald-300'
                : backendHealth.healthy
                ? 'bg-[#18261e] border-teal-500/40 text-teal-300'
                : 'bg-[#1e1919] border-amber-500/30 text-amber-300/80'
            }`}
            title="Trạng thái máy chủ WebSocket ngoài: http://localhost:8001/api/v1/health"
          >
            {mpStatus === 'CONNECTED' ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>Máy chủ :8001 (Đã nối)</span>
                <span className="text-[10px] text-emerald-400/80 font-mono-num">({latency}ms)</span>
              </>
            ) : backendHealth.healthy ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-teal-400" />
                <span>Máy chủ :8001 (Sẵn sàng)</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400/80" />
                <span>WS: :8001 (Chờ kết nối)</span>
              </>
            )}
          </div>

          {/* Cloud Auth */}
          {userEmail ? (
            <div className="flex items-center gap-2 text-xs text-[#d6d3c9]">
              <span className="truncate max-w-[150px] font-medium">{userEmail}</span>
              <button
                type="button"
                onClick={onSignOut}
                className="h-8 px-2.5 rounded-lg bg-[#14201b] border border-[#2c3e36] hover:border-[#f87171]/60 text-xs text-[#e7e5dc] transition-colors cursor-pointer"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onGoogleAuth}
              className="h-8 px-3 rounded-lg bg-[#14201b] border border-[#2c3e36] hover:border-[#38bdf8] text-xs font-medium text-[#e7e5dc] transition-colors cursor-pointer"
            >
              Đăng nhập Đám Mây
            </button>
          )}

          {/* Audio Mute Toggle */}
          <button
            type="button"
            onClick={onToggleMute}
            className="h-8 px-3 flex items-center gap-1.5 rounded-lg bg-[#14201b] border border-[#2c3e36] text-xs font-medium text-[#e7e5dc] hover:border-[#e8c468] transition-colors cursor-pointer"
          >
            <span>{isMuted ? '🔇 Tắt tiếng' : '🔊 Âm thanh'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: 3 Balanced Pillars: Left (Hero Card) | Middle (Lobby Play & Room Actions) | Right (Earth Atlas) */}
      <div className="my-auto py-4 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Player Hero Profile Card */}
        <div className="lg:col-span-3 bg-[#0d1614]/92 border border-[#243831] rounded-2xl p-4 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#1c2c26]">
              <div className="text-xs font-semibold text-[#f7f4eb]">Hồ Sơ Nhân Vật</div>
              <button
                type="button"
                onClick={onEditCharacter}
                className="px-2.5 py-1 rounded-lg bg-[#182822] hover:bg-[#22382f] border border-[#30483e] text-xs font-semibold text-[#e8c468] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Chỉnh Sửa</span>
              </button>
            </div>

            {/* Character Canvas */}
            <div className="flex items-center justify-center py-2">
              <canvas
                ref={canvasRef}
                width={200}
                height={200}
                className="max-w-[190px] aspect-square rounded-xl"
              />
            </div>

            {/* Player Info Badge */}
            <div className="text-center">
              <h3 className="text-base font-bold text-[#f7f4eb] flex items-center justify-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: playerProfile.color }}
                />
                <span>{playerProfile.name}</span>
              </h3>
              <p className="text-xs text-[#fbbf24] font-medium mt-0.5">{currentClass.name}</p>
              <p className="text-[11px] text-[#94a3b8] mt-0.5">{currentClass.title}</p>
            </div>

            {/* Class Details Pill */}
            <div className="mt-4 bg-[#121f1a] border border-[#263c32] rounded-xl p-3 text-left">
              <div className="text-[11px] text-[#cbd5e1] leading-relaxed">
                {currentClass.desc}
              </div>
              <div className="mt-2 pt-2 border-t border-[#1e3028] text-[10px] text-[#a3e635] font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#a3e635]" />
                <span>{currentClass.perk}</span>
              </div>
            </div>
          </div>

          {/* Quick Character Status Footer */}
          <div className="mt-4 pt-3 border-t border-[#1c2c26] text-center text-[11px] text-[#94a3b8]">
            Sẵn sàng khám phá 12 địa danh sinh quyển
          </div>
        </div>

        {/* Center Column: Primary Actions & Co-Op Rooms Management */}
        <div className="lg:col-span-5 bg-[#0e1816]/94 border border-[#263e35] rounded-2xl p-5 shadow-2xl flex flex-col justify-between">
          <div>
            {/* Lobby Navigation Tabs */}
            <div className="flex border-b border-[#21352d] pb-2.5 gap-2">
              <button
                type="button"
                onClick={() => setLobbyTab('play')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  lobbyTab === 'play'
                    ? 'bg-[#e8c468] text-[#111916]'
                    : 'bg-[#14221b] text-[#cbd5e1] hover:bg-[#1a2c24]'
                }`}
              >
                <Compass className="w-4 h-4" />
                <span>Vào Bản Đồ</span>
              </button>
              <button
                type="button"
                onClick={() => setLobbyTab('room')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  lobbyTab === 'room'
                    ? 'bg-[#e8c468] text-[#111916]'
                    : 'bg-[#14221b] text-[#cbd5e1] hover:bg-[#1a2c24]'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Tạo / Quản Lý Phòng</span>
                {squadPlayers.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/30 text-emerald-300 text-[10px]">
                    {squadPlayers.length + 1}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setLobbyTab('browse');
                  fetchPublicRooms();
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  lobbyTab === 'browse'
                    ? 'bg-[#e8c468] text-[#111916]'
                    : 'bg-[#14221b] text-[#cbd5e1] hover:bg-[#1a2c24]'
                }`}
              >
                <Radio className="w-4 h-4" />
                <span>Tìm Phòng</span>
              </button>
            </div>

            {/* TAB 1: ENTER MAP (Play Solo / Launch World) */}
            {lobbyTab === 'play' && (
              <div className="mt-4 space-y-4">
                <div>
                  <h4 className="text-base font-bold text-[#f7f4eb]">Sẵn Sàng Bước Vào Bản Đồ</h4>
                  <p className="text-xs text-[#94a3b8] mt-1 leading-relaxed">
                    Khám phá thế giới Trái Đất 2D mở, thu thập mẫu sinh học, thuần hóa thú cưng và kích hoạt tháp cổ quan trắc khí hậu.
                  </p>
                </div>

                {/* Selected Launch Destination Card */}
                <div className="bg-[#14231d] border border-[#2e473c] rounded-xl p-3.5">
                  <div className="text-[11px] text-[#94a3b8] uppercase tracking-wider font-semibold">
                    Điểm Xuất Phát Dự Kiến:
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-[#fde047]">{selectedLoc.name}</div>
                      <div className="text-xs text-[#cbd5e1]">{selectedLoc.continent} · {REGION_LABELS[selectedLoc.region]}</div>
                    </div>
                    <span className="text-[11px] font-mono-num text-[#7dd3fc]">
                      {formatCoordLabel(selectedLoc.lon, selectedLoc.lat)}
                    </span>
                  </div>
                </div>

                {/* Big Action Buttons */}
                <div className="space-y-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() =>
                      onEnterMap(
                        (selectedLoc.tx + 0.5) * TILE_SIZE,
                        (selectedLoc.ty + 0.5) * TILE_SIZE
                      )
                    }
                    className="w-full h-13 rounded-xl bg-gradient-to-r from-[#e8c468] via-[#f2d27e] to-[#fde047] hover:from-[#f2d27e] hover:to-[#fef08a] text-[#111916] font-bold text-sm tracking-wide shadow-xl flex items-center justify-center gap-2.5 transition-transform active:scale-95 cursor-pointer"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    <span>VÀO BẢN ĐỒ NGAY</span>
                  </button>

                  {canContinue && (
                    <button
                      type="button"
                      onClick={onContinue}
                      className="w-full h-11 rounded-xl bg-[#172720] hover:bg-[#20362c] border border-[#385346] text-xs font-semibold text-[#f7f4eb] flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-[#fbbf24]" />
                      <span>Tiếp Tục Tiến Trình Đã Lưu</span>
                    </button>
                  )}

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setLobbyTab('room')}
                      className="w-full h-10 rounded-xl bg-[#14201b] hover:bg-[#1c2e26] border border-[#2b3e36] text-xs font-medium text-[#cbd5e1] flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <Users className="w-4 h-4 text-[#38bdf8]" />
                      <span>Muốn chơi cùng bạn bè? Tạo phòng hoặc gia nhập nhóm</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: ROOM MANAGEMENT (Create Room / Squad Lobby) */}
            {lobbyTab === 'room' && (
              <div className="mt-4 space-y-4">
                {/* Active Room Badge & Info */}
                <div className="bg-[#14231d] border border-[#2e473c] rounded-xl p-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-[#94a3b8] uppercase font-semibold">Phòng Hiện Tại:</div>
                      <div className="text-sm font-bold text-[#f7f4eb]">{currentRoom.name}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-[#1d3329] border border-[#3b594b] text-[#fde047]">
                        Mã: {currentRoom.id}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyRoomCode}
                        className="p-1.5 rounded-lg bg-[#1e2e27] hover:bg-[#293f35] border border-[#385045] text-xs text-[#cbd5e1] transition-colors cursor-pointer"
                        title="Sao chép mã phòng để gửi cho bạn bè"
                      >
                        {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Squad Members in Room */}
                  <div className="mt-3 pt-3 border-t border-[#1e332a]">
                    <div className="text-xs font-semibold text-[#cbd5e1] mb-2 flex items-center justify-between">
                      <span>Thành Viên Trong Phòng ({squadPlayers.length + 1})</span>
                      <span className="text-[10px] text-emerald-400">● Đang hoạt động</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {/* Host (Current Player) */}
                      <div className="p-2 rounded-lg bg-[#192b23] border border-[#345244] flex items-center gap-2.5">
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/30"
                          style={{ backgroundColor: playerProfile.color }}
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[#f7f4eb] truncate">
                            {playerProfile.name} <span className="text-[10px] text-[#fbbf24]">(Bạn - Trưởng phòng)</span>
                          </div>
                          <div className="text-[10px] text-[#94a3b8]">{currentClass.name}</div>
                        </div>
                      </div>

                      {/* Other Remote Squad Allies */}
                      {squadPlayers.map((ally) => (
                        <div
                          key={ally.id}
                          className="p-2 rounded-lg bg-[#14201b] border border-[#2b3e36] flex items-center gap-2.5"
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/30"
                            style={{ backgroundColor: ally.color || '#38bdf8' }}
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-[#f7f4eb] truncate">{ally.name}</div>
                            <div className="text-[10px] text-[#94a3b8]">Đồng đội</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Form to Create a Brand New Room */}
                <div className="bg-[#121d18] border border-[#253930] rounded-xl p-3.5">
                  <div className="text-xs font-bold text-[#f7f4eb] mb-2 flex items-center gap-1.5">
                    <PlusCircle className="w-4 h-4 text-[#38bdf8]" />
                    <span>Tạo Phòng Chơi Mới Cho Đồng Đội</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] text-[#94a3b8] mb-1">Tên Phòng</label>
                      <input
                        type="text"
                        value={newRoomName}
                        onChange={(e) => setNewRoomName(e.target.value)}
                        className="w-full h-8 px-2.5 rounded-lg bg-[#17241f] border border-[#2c4036] text-xs text-[#f7f4eb] focus:outline-none focus:border-[#e8c468]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#94a3b8] mb-1">Mã Phòng Tự Đặt / Chia Sẻ</label>
                      <input
                        type="text"
                        value={newRoomCode}
                        onChange={(e) => setNewRoomCode(e.target.value.toUpperCase())}
                        className="w-full h-8 px-2.5 rounded-lg bg-[#17241f] border border-[#2c4036] text-xs font-mono text-[#f7f4eb] focus:outline-none focus:border-[#e8c468]"
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <label className="flex items-center gap-2 text-xs text-[#cbd5e1] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newRoomIsPrivate}
                        onChange={(e) => setNewRoomIsPrivate(e.target.checked)}
                        className="rounded border-[#30483e] text-[#e8c468] focus:ring-0"
                      />
                      <span>Riêng tư (Chỉ vào được bằng mã phòng)</span>
                    </label>

                    <button
                      type="button"
                      onClick={handleCreateRoom}
                      className="h-8 px-4 rounded-lg bg-[#e8c468] hover:bg-[#f2d27e] text-[#111916] text-xs font-bold transition-transform active:scale-95 cursor-pointer"
                    >
                      Tạo & Kết Nối Phòng
                    </button>
                  </div>
                </div>

                {/* Squad Chat Preview & Emote */}
                <div className="bg-[#121d18] border border-[#253930] rounded-xl p-3">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1c2c26] text-xs font-semibold text-[#cbd5e1]">
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-[#e8c468]" />
                      Trò Chuyện Sảnh Chờ
                    </span>
                    <span className="text-[10px] text-[#94a3b8]">Đồng bộ tức thì</span>
                  </div>

                  <div className="h-20 overflow-y-auto space-y-1.5 text-xs pr-1">
                    {chatMessages.length === 0 ? (
                      <div className="text-[11px] text-[#64748b] italic">Chưa có tin nhắn trong phòng...</div>
                    ) : (
                      chatMessages.slice(-5).map((msg) => (
                        <div key={msg.id} className="leading-tight">
                          <span className="font-semibold" style={{ color: msg.senderColor }}>
                            {msg.senderName}:
                          </span>{' '}
                          <span className="text-[#e2e8f0]">{msg.text}</span>
                        </div>
                      ))
                    )}
                  </div>

                  <form onSubmit={handleSendChat} className="mt-2 flex gap-2">
                    <input
                      type="text"
                      maxLength={80}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Nhắn tin cho đồng đội..."
                      className="flex-1 h-8 px-2.5 rounded-lg bg-[#17241f] border border-[#2c4036] text-xs text-[#f7f4eb] focus:outline-none focus:border-[#e8c468]"
                    />
                    <button
                      type="submit"
                      className="h-8 px-3 rounded-lg bg-[#1f3028] hover:bg-[#2b4237] border border-[#385044] text-xs text-[#f7f4eb] flex items-center justify-center cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>

                {/* Big Launch Squad Button */}
                <button
                  type="button"
                  onClick={() =>
                    onEnterMap(
                      (selectedLoc.tx + 0.5) * TILE_SIZE,
                      (selectedLoc.ty + 0.5) * TILE_SIZE
                    )
                  }
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-sm tracking-wide shadow-xl flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>VÀO BẢN ĐỒ CÙNG ĐỒNG ĐỘI</span>
                </button>
              </div>
            )}

            {/* TAB 3: BROWSE ROOMS & ENTER CODE */}
            {lobbyTab === 'browse' && (
              <div className="mt-4 space-y-4">
                {/* Enter Code Directly */}
                <div className="bg-[#14231d] border border-[#2e473c] rounded-xl p-3.5">
                  <div className="text-xs font-bold text-[#f7f4eb] mb-1.5 flex items-center gap-1.5">
                    <LogIn className="w-4 h-4 text-[#e8c468]" />
                    <span>Nhập Mã Phòng Từ Bạn Bè</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={joinCodeInput}
                      onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                      placeholder="VD: IRIS-8821"
                      className="flex-1 h-9 px-3 rounded-lg bg-[#182620] border border-[#2e4238] font-mono text-xs text-[#f7f4eb] focus:outline-none focus:border-[#e8c468]"
                    />
                    <button
                      type="button"
                      onClick={() => handleJoinByCode()}
                      className="h-9 px-4 rounded-lg bg-[#e8c468] hover:bg-[#f2d27e] text-[#111916] text-xs font-bold cursor-pointer transition-transform active:scale-95"
                    >
                      Tham Gia
                    </button>
                  </div>
                </div>

                {/* Public Rooms List */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-[#f7f4eb]">Danh Sách Phòng Khám Phá Công Khai</span>
                    <button
                      type="button"
                      onClick={fetchPublicRooms}
                      className="text-[11px] text-[#38bdf8] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoadingRooms ? 'animate-spin' : ''}`} />
                      <span>Làm mới</span>
                    </button>
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                    {publicRooms.length === 0 ? (
                      <div className="p-4 rounded-xl bg-[#121c17] border border-[#22332a] text-center text-xs text-[#94a3b8]">
                        Không có phòng công khai nào. Hãy tạo phòng mới ở tab bên cạnh!
                      </div>
                    ) : (
                      publicRooms.map((room) => {
                        const isCurrent = currentRoom.id === room.id;
                        return (
                          <div
                            key={room.id}
                            className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                              isCurrent
                                ? 'bg-[#1b2b24] border-[#e8c468]'
                                : 'bg-[#121c17] border-[#22332a] hover:border-[#334b3e]'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-[#f7f4eb] truncate">{room.name}</span>
                                {room.isPrivate && <Lock className="w-3 h-3 text-[#f87171]" />}
                              </div>
                              <div className="text-[11px] text-[#94a3b8] mt-0.5">
                                Trưởng phòng: <span className="text-[#cbd5e1]">{room.hostName}</span> ·{' '}
                                <span className="text-emerald-400">{room.playerCount}/{room.maxPlayers} người</span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleJoinByCode(room.id)}
                              disabled={isCurrent}
                              className={`h-8 px-3 rounded-lg text-xs font-semibold shrink-0 cursor-pointer transition-colors ${
                                isCurrent
                                  ? 'bg-[#293d34] text-[#a3e635] cursor-default'
                                  : 'bg-[#1f3028] hover:bg-[#2b4237] border border-[#385044] text-[#e2e8f0]'
                              }`}
                            >
                              {isCurrent ? 'Đang ở phòng' : 'Gia Nhập'}
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Phaser Fantasy Lab Link Footer */}
          {onOpenPhaserLab && (
            <div className="pt-3 border-t border-[#1e3129] flex items-center justify-between">
              <span className="text-[11px] text-[#94a3b8]">Thử nghiệm môi trường đồ họa Phaser 3:</span>
              <button
                type="button"
                onClick={onOpenPhaserLab}
                className="h-8 px-3 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-medium hover:bg-amber-500/30 transition-colors cursor-pointer"
              >
                🎨 Phaser Fantasy Lab
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Interactive Earth Map Preview Atlas */}
        <div className="lg:col-span-4 bg-[#0c1618]/92 border border-[#233832] rounded-2xl p-4 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-baseline justify-between pb-2.5 border-b border-[#1c2c26]">
              <span className="text-xs font-semibold text-[#f7f4eb]">
                Bản Đồ Thế Giới (Chọn điểm đến)
              </span>
              <span className="text-[11px] font-mono-num text-[#7dd3fc]">
                {formatCoordLabel(selectedLoc.lon, selectedLoc.lat)}
              </span>
            </div>

            <div className="mt-2.5">
              <EarthMapCanvas
                mode="preview"
                mapData={mapData}
                selectedLocationId={selectedLoc.id}
                onSelectLocation={setSelectedLocId}
                className="w-full aspect-[7/4] rounded-xl border border-[#223842] cursor-pointer block shadow-lg"
              />
            </div>

            <div className="mt-3 p-3 bg-[#13201b] border border-[#273d33] rounded-xl">
              <div className="flex items-center gap-1.5 text-xs text-[#f7f4eb]">
                <span className="font-bold text-[#fde047]">{selectedLoc.name}</span>
                <span className="text-[#64748b]">·</span>
                <span className="text-[#cbd5e1]">{selectedLoc.continent}</span>
                <span className="text-[#64748b]">·</span>
                <span className="text-[#a3e635]">{REGION_LABELS[selectedLoc.region]}</span>
              </div>
              <p className="mt-1 text-[11px] text-[#94a3b8] leading-relaxed">
                {selectedLoc.subtitle}
              </p>
            </div>
          </div>

          <div className="mt-3 text-center text-[11px] text-[#64748b]">
            Nhấp chuột vào bất kỳ điểm biểu tượng nào trên bản đồ để chọn tọa độ khởi hành
          </div>
        </div>
      </div>

      {/* Single Bottom Control-Hint Bar */}
      <div className="text-center text-xs text-[#94a3b8] tracking-wide pt-2 border-t border-[#1c2c26]/60">
        Phím tắt: WASD Di chuyển · Chuột trái Tấn công/Khai thác · F Thuần hóa thú · P Thú cưng · M Đồng đội Co-op
      </div>
    </div>
  );
};

