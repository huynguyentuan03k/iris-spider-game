/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import http from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import { ChatMessage, CoOpRoom, RemotePlayer, WorldPing } from '../game/multiplayer/types.ts';

interface ServerPlayerSession extends RemotePlayer {
  ws: WebSocket;
  currentRoomId: string;
}

interface RoomState {
  id: string;
  name: string;
  hostName: string;
  createdAt: number;
  isPrivate: boolean;
  maxPlayers: number;
  seed?: number;
  players: Map<string, ServerPlayerSession>;
  pings: WorldPing[];
  messages: ChatMessage[];
}

export class MultiplayerServer {
  private wss: WebSocketServer;
  private rooms: Map<string, RoomState> = new Map();
  private tickInterval: NodeJS.Timeout | null = null;

  constructor(server: http.Server) {
    this.wss = new WebSocketServer({
      server,
      path: '/ws/multiplayer',
    });

    // Ensure default public sanctuary realm exists
    this.ensureRoom('global-sanctuary', 'Đại Lãnh Địa Thánh (Public Realm)', 'Hệ Thống', false, 32);
    this.ensureRoom('coop-forest-1', 'Thám Hiểm Rừng Thiêng #1', 'Đội Tiên Phong', false, 8);
    this.ensureRoom('coop-expedition', 'Viễn Chinh Di Tích Cổ #2', 'Hiệp Sĩ Hoàng Gia', false, 8);

    this.setupListeners();
    this.startTickLoop();
  }

  public ensureRoom(
    id: string,
    name: string,
    hostName: string = 'Hệ Thống',
    isPrivate: boolean = false,
    maxPlayers: number = 16,
    seed?: number
  ): RoomState {
    let room = this.rooms.get(id);
    if (!room) {
      room = {
        id,
        name,
        hostName,
        createdAt: Date.now(),
        isPrivate,
        maxPlayers,
        seed,
        players: new Map(),
        pings: [],
        messages: [],
      };
      this.rooms.set(id, room);
    }
    return room;
  }

  public getPublicRooms(): CoOpRoom[] {
    const list: CoOpRoom[] = [];
    this.rooms.forEach((r) => {
      if (!r.isPrivate || r.players.size > 0) {
        list.push({
          id: r.id,
          name: r.name,
          hostName: r.hostName,
          playerCount: r.players.size,
          maxPlayers: r.maxPlayers,
          isPrivate: r.isPrivate,
          seed: r.seed,
        });
      }
    });
    return list;
  }

  public getStats() {
    let totalPlayers = 0;
    this.rooms.forEach((r) => {
      totalPlayers += r.players.size;
    });
    return {
      totalOnlinePlayers: totalPlayers,
      activeRoomsCount: this.rooms.size,
      rooms: this.getPublicRooms(),
    };
  }

  private setupListeners() {
    this.wss.on('connection', (ws: WebSocket) => {
      let currentSession: ServerPlayerSession | null = null;

      ws.on('message', (raw: string) => {
        try {
          const data = JSON.parse(raw.toString());
          const type = data.type;

          if (type === 'join') {
            const { roomId, name, color, x, y, uid, customRoomName, isPrivate, seed } = data;
            const targetRoomId = (roomId || 'global-sanctuary').trim();
            const roomName = customRoomName || `Phòng Thám Hiểm ${targetRoomId.toUpperCase()}`;
            const room = this.ensureRoom(targetRoomId, roomName, name, isPrivate || false, 12, seed);

            // Clean up old session if any
            if (currentSession) {
              this.removePlayer(currentSession);
            }

            const playerId = `p_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            const session: ServerPlayerSession = {
              ws,
              currentRoomId: room.id,
              id: playerId,
              uid: uid || undefined,
              name: (name || 'Nhà Thám Hiểm').trim().substring(0, 24),
              color: color || '#38bdf8',
              x: Number(x) || 162,
              y: Number(y) || 50,
              vx: 0,
              vy: 0,
              facing: 'right',
              hp: 100,
              maxHp: 100,
              anim: 'idle',
              swinging: false,
              swingAngle: 0,
              swordTier: 1,
              armorTier: 0,
              biome: 'SANCTUARY',
              chatMessage: undefined,
              chatTimer: 0,
              lastSeen: Date.now(),
            };

            currentSession = session;
            room.players.set(playerId, session);

            // Broadcast join notification
            const sysMsg: ChatMessage = {
              id: `sys_${Date.now()}`,
              senderId: 'SYSTEM',
              senderName: 'Hệ Thống',
              senderColor: '#fbbf24',
              text: `✨ ${session.name} đã bước vào thế giới!`,
              timestamp: Date.now(),
              isSystem: true,
            };
            room.messages.push(sysMsg);
            if (room.messages.length > 50) room.messages.shift();

            // Send init packet to the joining player
            const allPlayers: RemotePlayer[] = Array.from(room.players.values()).map(this.toRemotePlayer);
            this.send(ws, {
              type: 'init',
              selfId: playerId,
              roomId: room.id,
              roomName: room.name,
              players: allPlayers,
              pings: room.pings,
              recentMessages: room.messages.slice(-15),
            });

            // Broadcast to other players in room
            this.broadcastToRoom(room.id, playerId, {
              type: 'player_joined',
              player: this.toRemotePlayer(session),
              message: sysMsg,
            });
          }

          if (type === 'player_update' && currentSession) {
            currentSession.x = Number(data.x) || currentSession.x;
            currentSession.y = Number(data.y) || currentSession.y;
            currentSession.vx = Number(data.vx) || 0;
            currentSession.vy = Number(data.vy) || 0;
            currentSession.facing = data.facing === 'left' ? 'left' : 'right';
            currentSession.hp = Number(data.hp) ?? currentSession.hp;
            currentSession.maxHp = Number(data.maxHp) ?? currentSession.maxHp;
            currentSession.anim = data.anim || 'idle';
            currentSession.swinging = Boolean(data.swinging);
            currentSession.swingAngle = Number(data.swingAngle) || 0;
            currentSession.swordTier = Number(data.swordTier) || currentSession.swordTier;
            currentSession.armorTier = Number(data.armorTier) || currentSession.armorTier;
            currentSession.biome = data.biome || currentSession.biome;
            currentSession.petName = data.petName || currentSession.petName;
            currentSession.lastSeen = Date.now();
          }

          if (type === 'chat_message' && currentSession) {
            const rawText = String(data.text || '').trim().substring(0, 100);
            const emote = data.emote ? String(data.emote) : undefined;
            if (rawText || emote) {
              const fullText = emote ? `${emote} ${rawText}`.trim() : rawText;
              currentSession.chatMessage = fullText;
              currentSession.chatTimer = Date.now() + 6000;

              const chatMsg: ChatMessage = {
                id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                senderId: currentSession.id,
                senderName: currentSession.name,
                senderColor: currentSession.color,
                text: fullText,
                emote,
                timestamp: Date.now(),
              };

              const room = this.rooms.get(currentSession.currentRoomId);
              if (room) {
                room.messages.push(chatMsg);
                if (room.messages.length > 50) room.messages.shift();
                this.broadcastToRoom(room.id, null, {
                  type: 'chat_broadcast',
                  message: chatMsg,
                });
              }
            }
          }

          if (type === 'world_ping' && currentSession) {
            const room = this.rooms.get(currentSession.currentRoomId);
            if (room) {
              const ping: WorldPing = {
                id: `ping_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                senderId: currentSession.id,
                senderName: currentSession.name,
                x: Number(data.x) || currentSession.x,
                y: Number(data.y) || currentSession.y,
                label: String(data.label || 'Tập hợp!').substring(0, 40),
                color: currentSession.color,
                type: data.pingType || 'rally',
                expiresAt: Date.now() + 10000,
              };

              room.pings.push(ping);
              // Clean up expired pings
              const now = Date.now();
              room.pings = room.pings.filter((p) => p.expiresAt > now);

              this.broadcastToRoom(room.id, null, {
                type: 'ping_broadcast',
                ping,
              });
            }
          }
        } catch (err) {
          console.warn('[MultiplayerServer] Error handling message:', err);
        }
      });

      ws.on('close', () => {
        if (currentSession) {
          this.removePlayer(currentSession);
        }
      });

      ws.on('error', (err) => {
        console.warn('[MultiplayerServer] Socket error:', err.message);
        if (currentSession) {
          this.removePlayer(currentSession);
        }
      });
    });
  }

  private removePlayer(session: ServerPlayerSession) {
    const room = this.rooms.get(session.currentRoomId);
    if (!room) return;

    room.players.delete(session.id);

    const leaveMsg: ChatMessage = {
      id: `sys_leave_${Date.now()}`,
      senderId: 'SYSTEM',
      senderName: 'Hệ Thống',
      senderColor: '#94a3b8',
      text: `👋 ${session.name} đã rời thế giới.`,
      timestamp: Date.now(),
      isSystem: true,
    };
    room.messages.push(leaveMsg);
    if (room.messages.length > 50) room.messages.shift();

    this.broadcastToRoom(room.id, session.id, {
      type: 'player_left',
      playerId: session.id,
      message: leaveMsg,
    });

    // Clean up empty non-default rooms after 5 minutes
    if (room.players.size === 0 && room.id !== 'global-sanctuary') {
      setTimeout(() => {
        const check = this.rooms.get(room.id);
        if (check && check.players.size === 0) {
          this.rooms.delete(room.id);
        }
      }, 300000);
    }
  }

  private startTickLoop() {
    // 20Hz broadcast delta sync
    this.tickInterval = setInterval(() => {
      const now = Date.now();

      this.rooms.forEach((room) => {
        if (room.players.size === 0) return;

        // Clean up expired pings and chat bubbles
        room.pings = room.pings.filter((p) => p.expiresAt > now);

        const playersList: RemotePlayer[] = [];
        const deadSockets: ServerPlayerSession[] = [];

        room.players.forEach((p) => {
          if (p.ws.readyState !== WebSocket.OPEN) {
            deadSockets.push(p);
            return;
          }
          if (p.chatTimer && now > p.chatTimer) {
            p.chatMessage = undefined;
            p.chatTimer = 0;
          }
          playersList.push(this.toRemotePlayer(p));
        });

        deadSockets.forEach((p) => this.removePlayer(p));

        if (playersList.length > 0) {
          const syncPacket = JSON.stringify({
            type: 'players_sync',
            roomId: room.id,
            players: playersList,
            timestamp: now,
          });

          room.players.forEach((session) => {
            if (session.ws.readyState === WebSocket.OPEN) {
              session.ws.send(syncPacket);
            }
          });
        }
      });
    }, 50);
  }

  private toRemotePlayer(s: ServerPlayerSession): RemotePlayer {
    return {
      id: s.id,
      uid: s.uid,
      name: s.name,
      color: s.color,
      x: s.x,
      y: s.y,
      vx: s.vx,
      vy: s.vy,
      facing: s.facing,
      hp: s.hp,
      maxHp: s.maxHp,
      anim: s.anim,
      swinging: s.swinging,
      swingAngle: s.swingAngle,
      swordTier: s.swordTier,
      armorTier: s.armorTier,
      biome: s.biome,
      petName: s.petName,
      chatMessage: s.chatMessage,
      chatTimer: s.chatTimer,
      lastSeen: s.lastSeen,
    };
  }

  private broadcastToRoom(roomId: string, excludePlayerId: string | null, payload: any) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    const msg = JSON.stringify(payload);
    room.players.forEach((session) => {
      if (session.id !== excludePlayerId && session.ws.readyState === WebSocket.OPEN) {
        session.ws.send(msg);
      }
    });
  }

  private send(ws: WebSocket, payload: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  }

  public destroy() {
    if (this.tickInterval) clearInterval(this.tickInterval);
    this.wss.close();
  }
}

let serverInstance: MultiplayerServer | null = null;

export function setupMultiplayerServer(httpServer: http.Server): MultiplayerServer {
  if (!serverInstance) {
    serverInstance = new MultiplayerServer(httpServer);
  }
  return serverInstance;
}

export function getMultiplayerServerInstance(): MultiplayerServer | null {
  return serverInstance;
}
