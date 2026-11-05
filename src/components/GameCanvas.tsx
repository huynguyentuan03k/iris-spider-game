import React, { useEffect, useRef } from 'react';
import { CloudSaveData } from '../firebase';
import { OpenWorldEngine } from '../game/engine';
import { ActiveDialogue, GameState, HudSnapshot } from '../game/types';

interface GameCanvasProps {
  onEngineReady: (engine: OpenWorldEngine) => void;
  onHudUpdate: (snapshot: HudSnapshot) => void;
  onStateChange: (nextState: GameState) => void;
  onOpenDialogue: (dialogue: ActiveDialogue | null) => void;
  onAutoCloudSync: (payload: CloudSaveData) => void;
}

export const GameCanvas = React.memo(function GameCanvas({
  onEngineReady,
  onHudUpdate,
  onStateChange,
  onOpenDialogue,
  onAutoCloudSync,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const callbacksRef = useRef({ onHudUpdate, onStateChange, onOpenDialogue, onAutoCloudSync });
  callbacksRef.current = { onHudUpdate, onStateChange, onOpenDialogue, onAutoCloudSync };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new OpenWorldEngine(canvas, {
      onHudUpdate: (snap) => callbacksRef.current.onHudUpdate(snap),
      onStateChange: (st) => callbacksRef.current.onStateChange(st),
      onOpenDialogue: (dlg) => callbacksRef.current.onOpenDialogue(dlg),
      onAutoCloudSync: (payload) => callbacksRef.current.onAutoCloudSync(payload),
    });

    onEngineReady(engine);

    return () => {
      engine.destroy();
    };
  }, [onEngineReady]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 block w-full h-full cursor-crosshair"
      aria-label="Khung cảnh thế giới mở Chân Trời Cổ Đại"
    />
  );
});
