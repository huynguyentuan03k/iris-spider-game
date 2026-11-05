/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface RemotePlayer {
  id: string;
  uid?: string;
  name: string;
  color: string;
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
  chatMessage?: string;
  chatTimer?: number;
  lastSeen: number;
  isAttacking?: boolean;
  lastSpeechBubble?: string;
  speechBubbleTimer?: number;
}

export interface CoOpRoom {
  id: string;
  name: string;
  description?: string;
  hostName: string;
  playerCount: number;
  maxPlayers: number;
  isPrivate: boolean;
  seed?: number;
}

export interface WorldPing {
  id: string;
  senderId: string;
  senderName: string;
  createdByName?: string;
  x: number;
  y: number;
  label: string;
  color: string;
  type: 'help' | 'resource' | 'rally' | 'danger';
  createdAt?: number;
  expiresAt: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderColor: string;
  text: string;
  emote?: string;
  timestamp: number;
  isSystem?: boolean;
}

export type MultiplayerConnectionStatus =
  | 'DISCONNECTED'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'RECONNECTING'
  | 'ERROR';
