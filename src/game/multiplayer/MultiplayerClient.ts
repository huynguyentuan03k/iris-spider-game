/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ChatMessage,
  CoOpRoom,
  MultiplayerConnectionStatus,
  RemotePlayer,
  WorldPing,
} from './types.ts';

export interface MultiplayerClientEvents {
  onStatusChange?: (status: MultiplayerConnectionStatus) => void;
  onPlayersChange?: (players: RemotePlayer[]) => void;
  onNewChatMessage?: (msg: ChatMessage) => void;
  onNewPing?: (ping: WorldPing) => void;
  onRoomInfoChange?: (room: { id: string; name: string }) => void;
}

export class MultiplayerClient {
  private ws: WebSocket | null = null;
  private status: MultiplayerConnectionStatus = 'DISCONNECTED';
  private selfId: string | null = null;
  private currentRoomId: string = 'global-sanctuary';
  private currentRoomName: string = 'Đại Lãnh Địa Thánh (Public Realm)';
  private playerName: string = 'Nhà Thám Hiểm';
  private playerColor: string = '#38bdf8';
  private skinColor: string = '#fde68a';
  private hairStyle: string = 'cap';
  private hairColor: string = '#475569';
  private outfitStyle: string = 'explorer';
  private currentCustomRoomName?: string;
  private currentIsPrivate?: boolean;
  private currentSeed?: number;
  private remotePlayers: Map<string, RemotePlayer> = new Map();
  private pings: Map<string, WorldPing> = new Map();
  private messages: ChatMessage[] = [];
  private events: MultiplayerClientEvents = {};
  private reconnectTimer: NodeJS.Timeout | null = null;
  private shouldReconnect: boolean = true;
  private lastPingTime: number = 0;
  private pingLatencyMs: number = 24;

  constructor(events: MultiplayerClientEvents = {}) {
    this.events = events;
  }

  public setEvents(events: MultiplayerClientEvents) {
    this.events = { ...this.events, ...events };
  }

  public getStatus(): MultiplayerConnectionStatus {
    return this.status;
  }

  public getSelfId(): string | null {
    return this.selfId;
  }

  public getCurrentRoom(): { id: string; name: string } {
    return { id: this.currentRoomId, name: this.currentRoomName };
  }

  public getLatency(): number {
    return this.pingLatencyMs;
  }

  public getRemotePlayers(): RemotePlayer[] {
    return Array.from(this.remotePlayers.values());
  }

  public getPings(): WorldPing[] {
    const now = Date.now();
    return Array.from(this.pings.values()).filter((p) => p.expiresAt > now);
  }

  public getRecentMessages(): ChatMessage[] {
    return this.messages.slice(-30);
  }

  public async checkBackendHealth(): Promise<{ healthy: boolean; status?: any; error?: string }> {
    try {
      const healthUrl = (import.meta as any).env?.VITE_HEALTH_URL || 'http://localhost:8001/api/v1/health';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(healthUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const json = await res.json().catch(() => ({ status: 'ok' }));
        return { healthy: true, status: json };
      }
      return { healthy: false, error: `HTTP ${res.status}` };
    } catch (e: any) {
      return { healthy: false, error: e?.message || 'Connection refused' };
    }
  }

  public connect(
    roomId: string = 'global-sanctuary',
    name: string = 'Nhà Thám Hiểm',
    color: string = '#38bdf8',
    appearance?: { skinColor?: string; hairStyle?: string; hairColor?: string; outfitStyle?: string },
    roomOptions?: { customRoomName?: string; isPrivate?: boolean; seed?: number }
  ) {
    this.shouldReconnect = true;
    this.currentRoomId = roomId;
    this.playerName = name;
    this.playerColor = color;
    if (appearance?.skinColor) this.skinColor = appearance.skinColor;
    if (appearance?.hairStyle) this.hairStyle = appearance.hairStyle;
    if (appearance?.hairColor) this.hairColor = appearance.hairColor;
    if (appearance?.outfitStyle) this.outfitStyle = appearance.outfitStyle;
    if (roomOptions?.customRoomName) this.currentCustomRoomName = roomOptions.customRoomName;
    if (roomOptions?.isPrivate !== undefined) this.currentIsPrivate = roomOptions.isPrivate;
    if (roomOptions?.seed !== undefined) this.currentSeed = roomOptions.seed;

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      this.ws.close();
    }

    this.setStatus('CONNECTING');

    // Connect to external WebSocket server running at localhost:8001
    const wsUrl = (import.meta as any).env?.VITE_WS_URL || 'ws://localhost:8001/ws/multiplayer';

    // Verify health of http://localhost:8001/api/v1/health
    this.checkBackendHealth().then((health) => {
      if (!health.healthy) {
        console.warn('[MultiplayerClient] Backend health check failed at http://localhost:8001/api/v1/health:', health.error);
      }
    });

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.setStatus('CONNECTED');
        this.lastPingTime = Date.now();

        // Send Join Packet
        this.send({
          type: 'join',
          roomId: this.currentRoomId,
          name: this.playerName,
          color: this.playerColor,
          skinColor: this.skinColor,
          hairStyle: this.hairStyle,
          hairColor: this.hairColor,
          outfitStyle: this.outfitStyle,
          customRoomName: this.currentCustomRoomName,
          isPrivate: this.currentIsPrivate,
          seed: this.currentSeed,
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleServerMessage(data);
        } catch (e) {
          console.warn('[MultiplayerClient] Failed to parse message:', e);
        }
      };

      this.ws.onclose = () => {
        this.setStatus('DISCONNECTED');
        if (this.shouldReconnect) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = () => {
        this.setStatus('ERROR');
      };
    } catch {
      this.setStatus('ERROR');
      this.scheduleReconnect();
    }
  }

  private handleServerMessage(data: any) {
    const now = Date.now();
    this.pingLatencyMs = Math.max(8, Math.min(250, Date.now() - this.lastPingTime));
    this.lastPingTime = now;

    switch (data.type) {
      case 'init': {
        this.selfId = data.selfId;
        this.currentRoomId = data.roomId;
        this.currentRoomName = data.roomName;
        this.remotePlayers.clear();

        if (Array.isArray(data.players)) {
          data.players.forEach((p: RemotePlayer) => {
            if (p.id !== this.selfId) {
              this.remotePlayers.set(p.id, p);
            }
          });
        }

        if (Array.isArray(data.pings)) {
          this.pings.clear();
          data.pings.forEach((ping: WorldPing) => {
            this.pings.set(ping.id, ping);
          });
        }

        if (Array.isArray(data.recentMessages)) {
          this.messages = data.recentMessages;
        }

        this.events.onRoomInfoChange?.({ id: this.currentRoomId, name: this.currentRoomName });
        this.events.onPlayersChange?.(this.getRemotePlayers());
        break;
      }

      case 'players_sync': {
        if (Array.isArray(data.players)) {
          const activeIds = new Set<string>();

          data.players.forEach((p: RemotePlayer) => {
            if (p.id === this.selfId) return;
            activeIds.add(p.id);

            const existing = this.remotePlayers.get(p.id);
            if (existing) {
              // Smooth lerp or update
              existing.x = p.x;
              existing.y = p.y;
              existing.vx = p.vx;
              existing.vy = p.vy;
              existing.facing = p.facing;
              existing.hp = p.hp;
              existing.maxHp = p.maxHp;
              existing.anim = p.anim;
              existing.swinging = p.swinging;
              existing.swingAngle = p.swingAngle;
              existing.swordTier = p.swordTier;
              existing.armorTier = p.armorTier;
              existing.biome = p.biome;
              existing.petName = p.petName;
              existing.chatMessage = p.chatMessage;
              existing.lastSeen = p.lastSeen;
              existing.color = p.color || existing.color;
              existing.name = p.name || existing.name;
              existing.skinColor = p.skinColor || existing.skinColor;
              existing.hairStyle = p.hairStyle || existing.hairStyle;
              existing.hairColor = p.hairColor || existing.hairColor;
              existing.outfitStyle = p.outfitStyle || existing.outfitStyle;
            } else {
              this.remotePlayers.set(p.id, p);
            }
          });

          // Remove any player not in the sync list
          this.remotePlayers.forEach((_, id) => {
            if (!activeIds.has(id)) {
              this.remotePlayers.delete(id);
            }
          });

          this.events.onPlayersChange?.(this.getRemotePlayers());
        }
        break;
      }

      case 'player_joined': {
        if (data.player && data.player.id !== this.selfId) {
          this.remotePlayers.set(data.player.id, data.player);
          this.events.onPlayersChange?.(this.getRemotePlayers());
        }
        if (data.message) {
          this.messages.push(data.message);
          this.events.onNewChatMessage?.(data.message);
        }
        break;
      }

      case 'player_left': {
        if (data.playerId) {
          this.remotePlayers.delete(data.playerId);
          this.events.onPlayersChange?.(this.getRemotePlayers());
        }
        if (data.message) {
          this.messages.push(data.message);
          this.events.onNewChatMessage?.(data.message);
        }
        break;
      }

      case 'chat_broadcast': {
        if (data.message) {
          this.messages.push(data.message);
          if (this.messages.length > 50) this.messages.shift();

          // Also attach to sender remote player's bubble
          const sender = this.remotePlayers.get(data.message.senderId);
          if (sender) {
            sender.chatMessage = data.message.text;
          }

          this.events.onNewChatMessage?.(data.message);
        }
        break;
      }

      case 'ping_broadcast': {
        if (data.ping) {
          this.pings.set(data.ping.id, data.ping);
          this.events.onNewPing?.(data.ping);
        }
        break;
      }
    }
  }

  public sendPlayerUpdate(state: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    facing: 'left' | 'right';
    hp: number;
    maxHp: number;
    anim: 'idle' | 'walk' | 'run' | 'attack';
    swinging: boolean;
    swingAngle: number;
    swordTier: number;
    armorTier: number;
    biome?: string;
    petName?: string;
  }) {
    if (this.status !== 'CONNECTED' || !this.ws) return;
    this.send({
      type: 'player_update',
      ...state,
    });
  }

  public sendChatMessage(text: string, emote?: string) {
    if (this.status !== 'CONNECTED' || !this.ws) return;
    this.send({
      type: 'chat_message',
      text,
      emote,
    });
  }

  public sendWorldPing(
    x: number,
    y: number,
    label: string = 'Tập hợp!',
    pingType: 'help' | 'resource' | 'rally' | 'danger' = 'rally'
  ) {
    if (this.status !== 'CONNECTED' || !this.ws) return;
    this.send({
      type: 'world_ping',
      x,
      y,
      label,
      pingType,
    });
  }

  public joinRoom(
    roomId: string,
    customRoomName?: string,
    isPrivate: boolean = false,
    seed?: number,
    appearance?: { skinColor?: string; hairStyle?: string; hairColor?: string; outfitStyle?: string }
  ) {
    this.currentRoomId = roomId;
    if (appearance?.skinColor) this.skinColor = appearance.skinColor;
    if (appearance?.hairStyle) this.hairStyle = appearance.hairStyle;
    if (appearance?.hairColor) this.hairColor = appearance.hairColor;
    if (appearance?.outfitStyle) this.outfitStyle = appearance.outfitStyle;
    if (seed !== undefined) this.currentSeed = seed;
    if (customRoomName) this.currentCustomRoomName = customRoomName;
    this.currentIsPrivate = isPrivate;

    if (this.status === 'CONNECTED' && this.ws) {
      this.send({
        type: 'join',
        roomId,
        customRoomName,
        isPrivate,
        seed,
        name: this.playerName,
        color: this.playerColor,
        skinColor: this.skinColor,
        hairStyle: this.hairStyle,
        hairColor: this.hairColor,
        outfitStyle: this.outfitStyle,
      });
    } else {
      this.connect(roomId, this.playerName, this.playerColor, appearance, {
        customRoomName,
        isPrivate,
        seed,
      });
    }
  }

  public updateProfile(
    name: string,
    color: string,
    appearance?: { skinColor?: string; hairStyle?: string; hairColor?: string; outfitStyle?: string }
  ) {
    this.playerName = name;
    this.playerColor = color;
    if (appearance?.skinColor) this.skinColor = appearance.skinColor;
    if (appearance?.hairStyle) this.hairStyle = appearance.hairStyle;
    if (appearance?.hairColor) this.hairColor = appearance.hairColor;
    if (appearance?.outfitStyle) this.outfitStyle = appearance.outfitStyle;

    if (this.status === 'CONNECTED' && this.ws) {
      this.send({
        type: 'join',
        roomId: this.currentRoomId,
        name,
        color,
        skinColor: this.skinColor,
        hairStyle: this.hairStyle,
        hairColor: this.hairColor,
        outfitStyle: this.outfitStyle,
      });
    }
  }

  private send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  private setStatus(status: MultiplayerConnectionStatus) {
    this.status = status;
    this.events.onStatusChange?.(status);
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      if (this.shouldReconnect) {
        this.setStatus('RECONNECTING');
        this.connect(this.currentRoomId, this.playerName, this.playerColor);
      }
    }, 2500);
  }

  public disconnect() {
    this.shouldReconnect = false;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setStatus('DISCONNECTED');
    this.remotePlayers.clear();
  }
}

export const multiplayerClient = new MultiplayerClient();
