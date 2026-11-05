/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User } from 'firebase/auth';
import { useCallback, useEffect, useRef, useState } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { GameHud } from './components/GameHud';
import { MultiplayerModal } from './components/MultiplayerModal';
import { PhaserFantasyLabModal } from './components/PhaserFantasyLabModal';
import { TitleScreen } from './components/TitleScreen';
import { WorldModals } from './components/WorldModals';
import { MultiplayerClient } from './game/multiplayer/MultiplayerClient';
import {
  CloudSaveData,
  loadCloudWorldSave,
  signInWithGooglePopup,
  signOutUser,
  subscribeAuth,
  syncCloudWorldSave,
} from './firebase';
import { sound } from './game/audio';
import { BiomeRegion, SPECIES_CATALOG, WORLD_LOCATIONS } from './game/biodiversity';
import { OpenWorldEngine, hasSavedWorld } from './game/engine';
import {
  ActiveDialogue,
  GameState,
  HudSnapshot,
  WeatherKind,
  WorldMapRenderData,
} from './game/types';
import {
  TILE_SIZE,
  WORLD_TILES_H,
  WORLD_TILES_W,
  formatCoordLabel,
} from './game/worldGen';

const INITIAL_HUD: HudSnapshot = {
  hp: 100,
  maxHp: 100,
  stamina: 100,
  maxStamina: 100,
  biome: BiomeRegion.SANCTUARY,
  biomeLabel: 'Trạm Nghiên Cứu Địa Cầu',
  locationName: 'Trạm Sinh Quyển Địa Cầu',
  locationArrivalBanner: null,
  weather: WeatherKind.CLEAR,
  weatherLabel: 'Quang Đãng',
  weatherIntensity: 0,
  visibilityPercent: 100,
  moveSpeedPercent: 100,
  weatherEffectNote: 'Tầm nhìn thoáng · Địa hình ổn định',
  weatherAudioNote: 'Gió êm & thanh âm sinh quyển rõ nét',
  weatherBonusSummary: 'Tầm nhìn 100% Hoàn Hảo · Tốc Độ Cân Bằng · Quét Sinh Học Tối Ưu',
  weatherChallengeSummary: 'Địa hình ổn định',
  weatherBonuses: [
    'Tầm nhìn quang đãng 100%, dễ dàng quan sát mọi địa danh và kỳ quan từ xa',
    'Nhiệt độ cân bằng lý tưởng giúp duy trì thể lực và tốc độ di chuyển ổn định',
    'Sóng quét Kính Hiển Vi Vi Sinh đạt hiệu quả phát hiện chuẩn xác nhất',
  ],
  weatherChallenges: ['Nắng gắt chang chang giữa trưa tại sa mạc làm tiêu hao thể lực nhanh hơn'],
  weatherPerkColor: '#fde047',
  dayCount: 1,
  timeOfDay: 0.34,
  timeLabel: 'Ban Mai',
  clockLabel: '08:09',
  dayPhase: 'MORNING',
  skyTopColor: '#1d6fa5',
  skyHorizonColor: '#fdda76',
  wildlifeActivityNote: 'Thú ban ngày kiếm ăn · Thú săn đêm ngủ ẩn mình',
  playerX: 162,
  playerY: 50,
  worldTilesW: WORLD_TILES_W,
  worldTilesH: WORLD_TILES_H,
  tileSize: TILE_SIZE,
  coordLabel: formatCoordLabel(31, 30),
  inventory: {
    wood: 6,
    stone: 4,
    iron: 0,
    crystal: 0,
    berry: 6,
    bioSample: 1,
    potion: 1,
  },
  equipment: {
    swordTier: 1,
    spearTier: 0,
    shieldTier: 0,
    toolTier: 1,
    armorTier: 0,
    upgrades: {},
  },
  selectedSlot: 0,
  microscopeActive: false,
  beaconsActivated: 0,
  beaconsTotal: 5,
  discoveredSpeciesIds: [],
  discoveredLocationIds: ['loc_biosphere_hub'],
  totalSpeciesCount: SPECIES_CATALOG.length,
  totalLocationsCount: WORLD_LOCATIONS.length,
  bossSpawned: false,
  bossDefeated: false,
  bossName: '',
  bossHp: 0,
  bossMaxHp: 780,
  interactPrompt: null,
  questObjective: `Khám phá sinh quyển (0/${SPECIES_CATALOG.length} loài) · Trạm quan trắc (0/3)`,
  enemiesDefeated: 0,
  resourcesGathered: 0,
  exploredPercent: 4,
  seed: 202611,
  companion: null,
  unlockedSkillIds: [],
  journalEntries: [],
  newJournalAlert: null,
  perishableFreshness: 100,
  perishableStatusNote: 'Tươi mới (100%)',
  isPreservedByStructure: false,
  activeStorageStructureId: null,
  activeHazardAlert: null,
};

export default function App() {
  const engineRef = useRef<OpenWorldEngine | null>(null);
  const userRef = useRef<User | null>(null);
  const multiplayerClientRef = useRef<MultiplayerClient | null>(null);
  if (!multiplayerClientRef.current) {
    multiplayerClientRef.current = new MultiplayerClient();
  }

  const [gameState, setGameState] = useState<GameState>(GameState.TITLE);
  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [dialogue, setDialogue] = useState<ActiveDialogue | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(() => sound.isMuted());
  const [canContinue, setCanContinue] = useState<boolean>(() => hasSavedWorld());
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<string | null>(null);
  const [cloudSaveCache, setCloudSaveCache] = useState<CloudSaveData | null>(null);
  const [titleMapData, setTitleMapData] = useState<WorldMapRenderData | null>(null);
  const [isPhaserLabOpen, setIsPhaserLabOpen] = useState<boolean>(false);
  const [isMultiplayerModalOpen, setIsMultiplayerModalOpen] = useState<boolean>(false);
  const [multiplayerStatus, setMultiplayerStatus] = useState<{
    isConnected: boolean;
    count: number;
    latency: number;
    roomName: string;
  }>({
    isConnected: false,
    count: 0,
    latency: 24,
    roomName: 'Đại Lãnh Địa Thánh',
  });

  useEffect(() => {
    const client = multiplayerClientRef.current;
    if (!client) return;

    client.setEvents({
      onStatusChange: (s) => {
        setMultiplayerStatus((prev) => ({
          ...prev,
          isConnected: s === 'CONNECTED',
          latency: client.getLatency(),
          roomName: client.getCurrentRoom().name,
          count: client.getRemotePlayers().length,
        }));
      },
      onPlayersChange: (players) => {
        setMultiplayerStatus((prev) => ({
          ...prev,
          count: players.length,
        }));
      },
      onRoomInfoChange: (room) => {
        setMultiplayerStatus((prev) => ({
          ...prev,
          roomName: room.name,
        }));
      },
    });

    const interval = setInterval(() => {
      setMultiplayerStatus((prev) => ({
        ...prev,
        isConnected: client.getStatus() === 'CONNECTED',
        latency: client.getLatency(),
        count: client.getRemotePlayers().length,
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyM' && gameState === GameState.PLAYING && !dialogue) {
        e.preventDefault();
        setIsMultiplayerModalOpen((prev) => !prev);
      } else if (e.code === 'Escape' && isMultiplayerModalOpen) {
        e.preventDefault();
        setIsMultiplayerModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, dialogue, isMultiplayerModalOpen]);

  useEffect(() => {
    const unsub = subscribeAuth(async (user) => {
      userRef.current = user;
      setCurrentUser(user);
      if (user && user.emailVerified) {
        try {
          const remote = await loadCloudWorldSave(user.uid);
          if (remote) {
            setCloudSaveCache(remote);
            setCanContinue(true);
            setCloudSyncStatus('Đã tải dữ liệu Đám Mây');
          } else {
            setCloudSyncStatus('Đã kết nối Đám Mây');
          }
        } catch {
          setCloudSyncStatus('Chế độ ngoại tuyến');
        }
      } else {
        setCloudSaveCache(null);
        setCloudSyncStatus(null);
      }
    });
    return () => unsub();
  }, []);

  const handleEngineReady = useCallback((engine: OpenWorldEngine) => {
    engineRef.current = engine;
    if (multiplayerClientRef.current) {
      engine.setMultiplayerClient(multiplayerClientRef.current);
    }
    setTitleMapData(engine.getWorldDataForMap());
  }, []);

  const handleHudUpdate = useCallback((snapshot: HudSnapshot) => {
    setHud(snapshot);
  }, []);

  const handleStateChange = useCallback((next: GameState) => {
    setGameState(next);
    if (next === GameState.TITLE) {
      setCanContinue(hasSavedWorld() || Boolean(userRef.current));
    }
  }, []);

  const handleAutoCloudSync = useCallback(async (payload: CloudSaveData) => {
    const user = userRef.current;
    if (!user || !user.emailVerified) return;
    try {
      await syncCloudWorldSave({ ...payload, ownerId: user.uid });
      setCloudSyncStatus('Đã đồng bộ Đám Mây');
    } catch {
      setCloudSyncStatus('Lỗi đồng bộ Đám Mây');
    }
  }, []);

  const handleGoogleAuth = useCallback(async () => {
    try {
      setCloudSyncStatus('Đang đăng nhập...');
      const user = await signInWithGooglePopup();
      if (user && engineRef.current && gameState !== GameState.TITLE) {
        const payload = engineRef.current.exportCloudSavePayload(user.uid);
        await syncCloudWorldSave(payload);
        setCloudSyncStatus('Đã lưu lên Đám Mây');
      }
    } catch {
      setCloudSyncStatus('Đã hủy đăng nhập');
    }
  }, [gameState]);

  const handleSignOut = useCallback(async () => {
    await signOutUser();
    setCloudSaveCache(null);
    setCanContinue(hasSavedWorld());
  }, []);

  const handleToggleMute = useCallback(() => {
    const nextMuted = sound.toggleMute();
    setIsMuted(nextMuted);
  }, []);

  const autoConnectMultiplayer = useCallback(() => {
    const client = multiplayerClientRef.current;
    if (client && client.getStatus() === 'DISCONNECTED') {
      const name =
        currentUser?.displayName ||
        currentUser?.email?.split('@')[0] ||
        localStorage.getItem('coop_player_name') ||
        'Nhà Thám Hiểm';
      const color = localStorage.getItem('coop_player_color') || '#38bdf8';
      client.connect('global-sanctuary', name, color);
    }
  }, [currentUser]);

  const handleStartNew = useCallback(() => {
    const eng = engineRef.current;
    if (!eng) return;
    sound.unlock();
    sound.playObeliskActivate();
    autoConnectMultiplayer();
    eng.initNewWorld(hud.seed);
    eng.setGameState(GameState.PLAYING);
  }, [hud.seed, autoConnectMultiplayer]);

  const handleContinue = useCallback(() => {
    const eng = engineRef.current;
    if (!eng) return;
    sound.unlock();
    autoConnectMultiplayer();
    const loadedLocal = eng.loadSavedWorld();
    if (!loadedLocal && cloudSaveCache) {
      eng.applyCloudSavePayload(cloudSaveCache);
    } else if (loadedLocal && cloudSaveCache && cloudSaveCache.discoveredSpecies.length > 0) {
      // Prefer richer cloud save if it has more species discovered
      if (cloudSaveCache.discoveredSpecies.length >= hud.discoveredSpeciesIds.length) {
        eng.applyCloudSavePayload(cloudSaveCache);
      }
    }
    sound.playObeliskActivate();
    eng.setGameState(GameState.PLAYING);
  }, [cloudSaveCache, hud.discoveredSpeciesIds.length, autoConnectMultiplayer]);

  const handleStartAtLocation = useCallback(
    (worldX: number, worldY: number) => {
      const eng = engineRef.current;
      if (!eng) return;
      sound.unlock();
      autoConnectMultiplayer();
      eng.initNewWorld(hud.seed);
      setTitleMapData(eng.getWorldDataForMap());
      eng.fastTravelTo(worldX, worldY);
    },
    [hud.seed, autoConnectMultiplayer]
  );

  const handleRerollSeed = useCallback(() => {
    const eng = engineRef.current;
    if (!eng) return;
    const nextSeed = Math.floor(100000 + Math.random() * 899999);
    eng.initNewWorld(nextSeed);
    setTitleMapData(eng.getWorldDataForMap());
    sound.unlock();
    sound.playPickup();
  }, []);

  const getMapData = useCallback(() => {
    return engineRef.current ? engineRef.current.getWorldDataForMap() : null;
  }, []);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#0d1412]">
      <GameCanvas
        onEngineReady={handleEngineReady}
        onHudUpdate={handleHudUpdate}
        onStateChange={handleStateChange}
        onOpenDialogue={setDialogue}
        onAutoCloudSync={handleAutoCloudSync}
      />

      {gameState === GameState.TITLE && (
        <TitleScreen
          seed={hud.seed}
          canContinue={canContinue}
          isMuted={isMuted}
          userEmail={currentUser?.email || null}
          cloudSyncStatus={cloudSyncStatus}
          mapData={titleMapData}
          onStartNew={handleStartNew}
          onStartAtLocation={handleStartAtLocation}
          onContinue={handleContinue}
          onRerollSeed={handleRerollSeed}
          onToggleMute={handleToggleMute}
          onGoogleAuth={handleGoogleAuth}
          onSignOut={handleSignOut}
          onOpenPhaserLab={() => setIsPhaserLabOpen(true)}
        />
      )}

      {gameState !== GameState.TITLE && (
        <GameHud
          hud={hud}
          isMuted={isMuted}
          getMapData={getMapData}
          onSelectSlot={(slot) => engineRef.current?.selectHotbarSlot(slot)}
          onOpenCodex={() => engineRef.current?.setGameState(GameState.CODEX)}
          onOpenCrafting={() => engineRef.current?.setGameState(GameState.CRAFTING)}
          onOpenBuildMenu={() => engineRef.current?.setGameState(GameState.BUILD_MENU)}
          onOpenSkillTree={() => engineRef.current?.setGameState(GameState.SKILL_TREE)}
          onOpenPetModal={() => engineRef.current?.setGameState(GameState.PET_COMPANION)}
          onFeedOrTame={() => engineRef.current?.interactCompanionOrTame()}
          onAdvanceTime={() => engineRef.current?.advanceTimePhase()}
          onCycleWeather={() => engineRef.current?.cycleWeatherPreset()}
          onOpenMap={() => engineRef.current?.setGameState(GameState.WORLD_MAP)}
          onOpenJournal={() => engineRef.current?.setGameState(GameState.JOURNAL)}
          onPause={() => engineRef.current?.setGameState(GameState.PAUSED)}
          onToggleMute={handleToggleMute}
          onOpenMultiplayer={() => setIsMultiplayerModalOpen(true)}
          multiplayerStatus={multiplayerStatus}
        />
      )}

      <WorldModals
        gameState={gameState}
        hud={hud}
        dialogue={dialogue}
        userEmail={currentUser?.email || null}
        cloudSyncStatus={cloudSyncStatus}
        getMapData={getMapData}
        activeStructure={engineRef.current?.getActiveStorageStructure() || null}
        onResume={() => engineRef.current?.setGameState(GameState.PLAYING)}
        onCraft={(recipeId) => engineRef.current?.craftItem(recipeId)}
        onUnlockSkill={(skillId) => engineRef.current?.unlockSkill(skillId)}
        onFastTravel={(x, y) => engineRef.current?.fastTravelTo(x, y)}
        onAdvanceDialogue={() => engineRef.current?.advanceDialogue()}
        onOpenCrafting={() => engineRef.current?.setGameState(GameState.CRAFTING)}
        onOpenSkillTree={() => engineRef.current?.setGameState(GameState.SKILL_TREE)}
        onOpenPetModal={() => engineRef.current?.setGameState(GameState.PET_COMPANION)}
        onOpenCodex={() => engineRef.current?.setGameState(GameState.CODEX)}
        onOpenJournal={() => engineRef.current?.setGameState(GameState.JOURNAL)}
        onSelectStructureToBuild={(spec) => engineRef.current?.armStructureBlueprint(spec)}
        onDepositStorage={(resource, amount) => engineRef.current?.depositToActiveStorage(resource, amount)}
        onWithdrawStorage={(resource, amount) => engineRef.current?.withdrawFromActiveStorage(resource, amount)}
        onDepositAllStorage={() => engineRef.current?.depositAllToActiveStorage()}
        onWithdrawAllStorage={() => engineRef.current?.withdrawAllFromActiveStorage()}
        onRenamePet={(newName) => engineRef.current?.renameCompanion(newName)}
        onSetPetMode={(mode) => engineRef.current?.setCompanionMode(mode)}
        onFeedPet={(food) => engineRef.current?.feedCompanion(food)}
        onReleasePet={() => engineRef.current?.releaseCompanion()}
        onOpenPhaserLab={() => setIsPhaserLabOpen(true)}
        onSaveManual={async () => {
          const eng = engineRef.current;
          if (!eng) return;
          eng.saveWorld(false);
          if (currentUser && currentUser.emailVerified) {
            try {
              await syncCloudWorldSave(eng.exportCloudSavePayload(currentUser.uid));
              setCloudSyncStatus('Đã lưu lên Đám Mây');
            } catch {
              setCloudSyncStatus('Đã lưu trên máy');
            }
          }
          setCanContinue(true);
          eng.setGameState(GameState.PLAYING);
        }}
        onGoogleAuth={handleGoogleAuth}
        onRespawnSanctuary={() => engineRef.current?.respawnAtSanctuary()}
        onRestartNewWorld={() => {
          const eng = engineRef.current;
          if (!eng) return;
          const freshSeed = Math.floor(100000 + Math.random() * 899999);
          eng.initNewWorld(freshSeed);
          setTitleMapData(eng.getWorldDataForMap());
          eng.setGameState(GameState.PLAYING);
        }}
        onReturnTitle={() => {
          if (engineRef.current) {
            engineRef.current.saveWorld(true);
            setTitleMapData(engineRef.current.getWorldDataForMap());
            setCanContinue(true);
            engineRef.current.setGameState(GameState.TITLE);
          }
        }}
      />

      <PhaserFantasyLabModal
        isOpen={isPhaserLabOpen}
        onClose={() => setIsPhaserLabOpen(false)}
      />

      {isMultiplayerModalOpen && multiplayerClientRef.current && (
        <MultiplayerModal
          client={multiplayerClientRef.current}
          playerPos={{
            x: engineRef.current ? engineRef.current.getWorldDataForMap().playerX : 0,
            y: engineRef.current ? engineRef.current.getWorldDataForMap().playerY : 0,
          }}
          onClose={() => setIsMultiplayerModalOpen(false)}
          onTeleportToTeammate={(x, y) => {
            if (engineRef.current) {
              engineRef.current.fastTravelTo(x, y);
            }
          }}
          onSendWorldPing={(type, label) => {
            if (engineRef.current) {
              engineRef.current.sendWorldPing(type, label);
            }
          }}
        />
      )}
    </main>
  );
}
