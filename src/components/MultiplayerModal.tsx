/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  Users,
  Wifi,
  WifiOff,
  Radio,
  Send,
  MapPin,
  Compass,
  AlertTriangle,
  HeartHandshake,
  Gem,
  CheckCircle2,
  Copy,
  ChevronRight,
  Shield,
  Sword,
  X,
  RefreshCw,
} from 'lucide-react';
import { MultiplayerClient } from '../game/multiplayer/MultiplayerClient';
import {
  ChatMessage,
  CoOpRoom,
  MultiplayerConnectionStatus,
  RemotePlayer,
  WorldPing,
} from '../game/multiplayer/types';
import { sound } from '../game/audio';

interface MultiplayerModalProps {
  client: MultiplayerClient;
  playerPos: { x: number; y: number };
  onClose: () => void;
  onTeleportToTeammate: (x: number, y: number, name: string) => void;
  onSendWorldPing: (type: 'RALLY' | 'DANGER' | 'RESOURCE' | 'ASSIST', label: string) => void;
}

const PLAYER_COLORS = [
  { name: 'Xanh Lam Tinh Khôi', hex: '#38bdf8' },
  { name: 'Lục Bảo Rừng Rậm', hex: '#22c55e' },
  { name: 'Hổ Phách Mặt Trời', hex: '#f59e0b' },
  { name: 'Huyết Hồng Đỉnh Cao', hex: '#f43f5e' },
  { name: 'Tím Cổ Đại', hex: '#a855f7' },
  { name: 'Ngọc Bích Biển Sâu', hex: '#14b8a6' },
];

export const MultiplayerModal: React.FC<MultiplayerModalProps> = ({
  client,
  playerPos,
  onClose,
  onTeleportToTeammate,
  onSendWorldPing,
}) => {
  const [activeTab, setActiveTab] = useState<'rooms' | 'allies' | 'chat'>('rooms');
  const [status, setStatus] = useState<MultiplayerConnectionStatus>(client.getStatus());
  const [currentRoom, setCurrentRoom] = useState(client.getCurrentRoom());
  const [latency, setLatency] = useState(client.getLatency());
  const [players, setPlayers] = useState<RemotePlayer[]>(client.getRemotePlayers());
  const [messages, setMessages] = useState<ChatMessage[]>(client.getRecentMessages());
  const [roomsList, setRoomsList] = useState<CoOpRoom[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);

  // Form states
  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem('coop_player_name') || 'Nhà Thám Hiểm';
  });
  const [selectedColor, setSelectedColor] = useState(() => {
    return localStorage.getItem('coop_player_color') || '#38bdf8';
  });
  const [customRoomId, setCustomRoomId] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [copiedRoomId, setCopiedRoomId] = useState(false);

  const fetchRooms = async () => {
    setIsLoadingRooms(true);
    try {
      const res = await fetch('/api/multiplayer/rooms');
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.rooms || [];
        setRoomsList(list);
      }
    } catch (e) {
      console.warn('Failed to fetch rooms:', e);
    } finally {
      setIsLoadingRooms(false);
    }
  };

  useEffect(() => {
    fetchRooms();

    client.setEvents({
      onStatusChange: (s) => setStatus(s),
      onPlayersChange: (p) => setPlayers([...p]),
      onRoomInfoChange: (r) => setCurrentRoom(r),
      onNewChatMessage: () => {
        setMessages([...client.getRecentMessages()]);
      },
      onNewPing: () => {
        // Handled via engine pings
      },
    });

    const interval = setInterval(() => {
      setLatency(client.getLatency());
      setPlayers(client.getRemotePlayers());
    }, 1000);

    return () => clearInterval(interval);
  }, [client]);

  const handleJoinRoom = (roomId: string) => {
    sound.playObeliskActivate();
    localStorage.setItem('coop_player_name', playerName);
    localStorage.setItem('coop_player_color', selectedColor);
    client.connect(roomId, playerName, selectedColor);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    client.sendChatMessage(chatInput.trim());
    setChatInput('');
    sound.playCraftOrHeal();
  };

  const handleQuickEmote = (text: string) => {
    client.sendChatMessage(text);
    sound.playCraftOrHeal();
  };

  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(currentRoom.id);
    setCopiedRoomId(true);
    setTimeout(() => setCopiedRoomId(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-2xl border border-emerald-500/30 bg-[#0d1615] text-slate-100 shadow-2xl shadow-emerald-950/50 flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-emerald-900/40 px-6 py-4 bg-gradient-to-r from-emerald-950/60 to-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-inner">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-wide text-emerald-100">
                  CHẾ ĐỘ NHIỀU NGƯỜI CHƠI (CO-OP MULTIPLAYER)
                </h2>
                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                  REAL-TIME
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Thám hiểm cùng bạn bè, chia sẻ tọa độ và săn Boss cổ đại chung thế giới
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Status Indicator */}
            <div className="flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-1.5 text-xs">
              {status === 'CONNECTED' ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-300 font-medium">Trực Tuyến</span>
                  <span className="text-slate-500">|</span>
                  <span className="text-slate-400 text-[11px]">{latency}ms</span>
                </>
              ) : status === 'CONNECTING' ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                  <span className="text-amber-300 font-medium">Đang Kết Nối...</span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-rose-400" />
                  <span className="text-rose-300 font-medium">Ngoại Tuyến</span>
                </>
              )}
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              title="Đóng [Esc]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-emerald-950/80 bg-slate-950/50 px-6 gap-2">
          <button
            onClick={() => setActiveTab('rooms')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wider transition border-b-2 ${
              activeTab === 'rooms'
                ? 'border-emerald-400 text-emerald-300 bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="h-4 w-4" />
            Phòng Chơi ({roomsList.length})
          </button>
          <button
            onClick={() => setActiveTab('allies')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wider transition border-b-2 ${
              activeTab === 'allies'
                ? 'border-emerald-400 text-emerald-300 bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="h-4 w-4" />
            Đồng Đội ({players.length})
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wider transition border-b-2 ${
              activeTab === 'chat'
                ? 'border-emerald-400 text-emerald-300 bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Send className="h-4 w-4" />
            Kênh Đội & Tín Hiệu
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: ROOMS BROWSER & PROFILE */}
          {activeTab === 'rooms' && (
            <div className="space-y-6">
              
              {/* Player Profile Setup */}
              <div className="rounded-xl border border-emerald-800/40 bg-slate-900/60 p-4 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Hồ Sơ Nhân Vật Thám Hiểm
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Tên Nhân Vật Hiển Thị
                    </label>
                    <input
                      type="text"
                      value={playerName}
                      maxLength={20}
                      onChange={(e) => setPlayerName(e.target.value)}
                      placeholder="Nhập tên nhân vật..."
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Màu Nhận Diện Đồng Đội
                    </label>
                    <div className="flex items-center gap-2">
                      {PLAYER_COLORS.map((col) => (
                        <button
                          key={col.hex}
                          type="button"
                          onClick={() => setSelectedColor(col.hex)}
                          className={`h-7 w-7 rounded-full border-2 transition transform hover:scale-110 ${
                            selectedColor === col.hex ? 'border-white scale-110 shadow-md ring-2 ring-emerald-400/50' : 'border-transparent opacity-70'
                          }`}
                          style={{ backgroundColor: col.hex }}
                          title={col.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Active Room Banner */}
              <div className="flex items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-4">
                <div>
                  <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                    Phòng Hiện Tại
                  </span>
                  <h4 className="text-base font-bold text-slate-100 flex items-center gap-2 mt-0.5">
                    {currentRoom.name}
                    <span className="text-xs font-normal text-slate-400">
                      (Mã: <code className="text-emerald-300 font-mono">{currentRoom.id}</code>)
                    </span>
                  </h4>
                </div>
                <button
                  onClick={handleCopyRoomId}
                  className="flex items-center gap-1.5 rounded-lg border border-emerald-600/40 bg-emerald-900/50 px-3 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-800/60 transition"
                >
                  {copiedRoomId ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      Đã Sao Chép!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Sao Chép Mã Phòng
                    </>
                  )}
                </button>
              </div>

              {/* Public Rooms List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Phòng Công Cộng Có Sẵn
                  </h3>
                  <button
                    onClick={fetchRooms}
                    disabled={isLoadingRooms}
                    className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 transition"
                  >
                    <RefreshCw className={`h-3 w-3 ${isLoadingRooms ? 'animate-spin' : ''}`} />
                    Làm Mới
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {roomsList.map((room) => {
                    const isCurrent = currentRoom.id === room.id && status === 'CONNECTED';
                    return (
                      <div
                        key={room.id}
                        className={`rounded-xl border p-3.5 flex flex-col justify-between transition ${
                          isCurrent
                            ? 'border-emerald-400 bg-emerald-950/40 shadow-md shadow-emerald-950/50'
                            : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-emerald-400/80">
                              {room.id}
                            </span>
                            <span className="flex items-center gap-1 text-[11px] text-slate-300 font-medium">
                              <Users className="h-3 w-3 text-emerald-400" />
                              {room.playerCount}/{room.maxPlayers}
                            </span>
                          </div>
                          <h4 className="text-sm font-semibold text-slate-100 mt-1">
                            {room.name}
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                            {room.description}
                          </p>
                        </div>

                        <button
                          onClick={() => handleJoinRoom(room.id)}
                          disabled={isCurrent}
                          className={`mt-3 w-full rounded-lg py-1.5 text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                            isCurrent
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                          }`}
                        >
                          {isCurrent ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Đang Tham Gia
                            </>
                          ) : (
                            <>
                              Vào Phòng Này
                              <ChevronRight className="h-3.5 w-3.5" />
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Join Custom / Private Room */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Tạo Hoặc Tham Gia Phòng Riêng Biệt
                </h3>
                <p className="text-xs text-slate-400">
                  Nhập mã phòng bạn muốn tạo hoặc mã phòng do bạn bè chia sẻ (ví dụ: <code className="text-emerald-400 font-mono">coop-team-vietnam</code>).
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customRoomId}
                    onChange={(e) => setCustomRoomId(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    placeholder="Nhập mã phòng tùy chọn..."
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      if (customRoomId.trim()) {
                        handleJoinRoom(customRoomId.trim());
                      }
                    }}
                    disabled={!customRoomId.trim()}
                    className="rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-4 py-2 text-xs font-semibold text-white transition flex items-center gap-1.5"
                  >
                    Tham Gia
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: CONNECTED ALLIES */}
          {activeTab === 'allies' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Đồng Đội Trong Lãnh Địa ({players.length})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Bạn có thể dịch chuyển nhanh đến cạnh đồng đội hoặc gửi tín hiệu hỗ trợ
                  </p>
                </div>
              </div>

              {players.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center space-y-2">
                  <Users className="h-8 w-8 text-slate-600 mx-auto" />
                  <p className="text-sm text-slate-400 font-medium">
                    Chưa có đồng đội nào khác trong phòng này.
                  </p>
                  <p className="text-xs text-slate-500">
                    Hãy chia sẻ mã phòng <code className="text-emerald-400 font-mono">{currentRoom.id}</code> cho bạn bè để cùng chơi!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {players.map((p) => {
                    const dist = Math.round(Math.hypot(p.x - playerPos.x, p.y - playerPos.y) / 10);
                    const hpPct = Math.round(((p.hp || 100) / (p.maxHp || 100)) * 100);

                    return (
                      <div
                        key={p.id}
                        className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="h-9 w-9 rounded-full flex items-center justify-center font-bold text-slate-900 shadow"
                              style={{ backgroundColor: p.color || '#38bdf8' }}
                            >
                              {p.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
                                {p.name}
                                {p.isAttacking && (
                                  <span className="text-[10px] text-amber-400 flex items-center gap-0.5">
                                    <Sword className="h-3 w-3" /> Đang Giao Tranh
                                  </span>
                                )}
                              </h4>
                              <p className="text-xs text-slate-400">
                                Cách bạn <span className="text-emerald-400 font-semibold">{dist}m</span>
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-semibold text-emerald-400">
                              {hpPct}% Máu
                            </span>
                            <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                              <div
                                className="h-full bg-emerald-400 rounded-full"
                                style={{ width: `${hpPct}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Teleport / Actions */}
                        <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                          <button
                            onClick={() => {
                              onTeleportToTeammate(p.x, p.y, p.name);
                              onClose();
                            }}
                            className="flex-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/40 py-1.5 text-xs font-semibold text-emerald-300 transition flex items-center justify-center gap-1"
                          >
                            <MapPin className="h-3.5 w-3.5" />
                            Dịch Chuyển Đến
                          </button>

                          <button
                            onClick={() => {
                              onSendWorldPing('ASSIST', `Yêu Cầu Hỗ Trợ Gần ${p.name}`);
                            }}
                            className="rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 transition flex items-center gap-1"
                            title="Đánh dấu hỗ trợ"
                          >
                            <HeartHandshake className="h-3.5 w-3.5 text-emerald-400" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CHAT & QUICK PINGS */}
          {activeTab === 'chat' && (
            <div className="space-y-4">
              
              {/* Tactical World Ping Shortcuts */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Tín Hiệu Chiến Thuật (Tactical Radar Pings)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => onSendWorldPing('RALLY', 'Tập Hợp Tại Vị Trí Này')}
                    className="flex items-center gap-2 rounded-xl border border-sky-500/30 bg-sky-950/30 hover:bg-sky-900/40 p-2.5 text-xs font-semibold text-sky-200 transition"
                  >
                    <Compass className="h-4 w-4 text-sky-400" />
                    🚩 Tập Hợp
                  </button>
                  <button
                    onClick={() => onSendWorldPing('DANGER', 'Nguy Hiểm! Quái Cổ Đại!')}
                    className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-950/30 hover:bg-rose-900/40 p-2.5 text-xs font-semibold text-rose-200 transition"
                  >
                    <AlertTriangle className="h-4 w-4 text-rose-400" />
                    ⚠️ Nguy Hiểm
                  </button>
                  <button
                    onClick={() => onSendWorldPing('RESOURCE', 'Tài Nguyên Hiếm / Kho Báu!')}
                    className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-950/30 hover:bg-amber-900/40 p-2.5 text-xs font-semibold text-amber-200 transition"
                  >
                    <Gem className="h-4 w-4 text-amber-400" />
                    💎 Tài Nguyên
                  </button>
                  <button
                    onClick={() => onSendWorldPing('ASSIST', 'Cần Cứu Viện Gấp!')}
                    className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/30 hover:bg-emerald-900/40 p-2.5 text-xs font-semibold text-emerald-200 transition"
                  >
                    <Shield className="h-4 w-4 text-emerald-400" />
                    🛡️ Cứu Viện
                  </button>
                </div>
              </div>

              {/* Quick Preset Phrases */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Lời Thoại Nhanh (Quick Emotes)
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Chào mọi người! 👋',
                    'Cùng đi kích hoạt Hải Đăng nào! ⚡',
                    'Cần thêm Trái Cây để thuần thú! 🍎',
                    'Chuẩn bị săn Boss Himalaya! ⚔️',
                    'Tôi đang xây Lửa Trại đây! 🔥',
                    'Đợi tôi với! 🏃',
                  ].map((phrase) => (
                    <button
                      key={phrase}
                      onClick={() => handleQuickEmote(phrase)}
                      className="rounded-full border border-slate-700 bg-slate-900/80 px-2.5 py-1 text-[11px] text-slate-300 hover:border-emerald-500 hover:text-emerald-200 transition"
                    >
                      {phrase}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Feed */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 h-52 overflow-y-auto space-y-2 font-sans text-xs">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-600 italic">
                    Chưa có tin nhắn nào trong kênh này. Hãy gửi lời chào đầu tiên!
                  </div>
                ) : (
                  messages.map((m) => (
                    <div key={m.id} className="leading-relaxed">
                      <span className="text-[10px] text-slate-500 font-mono mr-1.5">
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span
                        className="font-bold mr-1.5"
                        style={{ color: m.senderColor || '#38bdf8' }}
                      >
                        {m.senderName}:
                      </span>
                      <span className="text-slate-200">{m.text}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendChat} className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Nhập tin nhắn trò chuyện hoặc bóng thoại..."
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-4 py-2 text-xs font-semibold text-white transition flex items-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                  Gửi
                </button>
              </form>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-emerald-950/80 bg-slate-950/80 px-6 py-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Radio className="h-3.5 w-3.5 text-emerald-400" />
            <span>Mạng đồng bộ 20Hz trực tiếp qua WebSocket Port 3000</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-1.5 text-xs font-semibold text-slate-200 transition"
          >
            Đóng [Esc]
          </button>
        </div>

      </div>
    </div>
  );
};
