/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { getGameForUser, getOrCreateUser, saveGameForUser } from './src/db/users.ts';
import { AuthRequest, requireAuth } from './src/middleware/auth.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const httpServer = http.createServer(app);
  const EXTERNAL_BACKEND = process.env.EXTERNAL_BACKEND_URL || 'http://localhost:8001';

  app.use(express.json({ limit: '10mb' }));

  // API Routes
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', database: 'cloudsql_postgresql', externalBackend: EXTERNAL_BACKEND });
  });

  // Multiplayer Rooms Proxy to external WebSocket server (port 8001)
  app.get('/api/multiplayer/rooms', async (_req, res) => {
    try {
      const resp = await fetch(`${EXTERNAL_BACKEND}/api/v1/rooms`);
      if (resp.ok) return res.json(await resp.json());
      const altResp = await fetch(`${EXTERNAL_BACKEND}/api/multiplayer/rooms`);
      if (altResp.ok) return res.json(await altResp.json());
      res.json([]);
    } catch {
      res.json([]);
    }
  });

  app.get('/api/multiplayer/stats', async (_req, res) => {
    try {
      const resp = await fetch(`${EXTERNAL_BACKEND}/api/v1/stats`);
      if (resp.ok) return res.json(await resp.json());
      res.json({ totalOnlinePlayers: 0, activeRoomsCount: 0, rooms: [] });
    } catch {
      res.json({ totalOnlinePlayers: 0, activeRoomsCount: 0, rooms: [] });
    }
  });

  app.get('/api/users/me', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const user = await getOrCreateUser(req.user.uid, req.user.email || '', (req.user as any).name);
      res.json(user);
    } catch (error: any) {
      console.error('Failed to get user profile:', error);
      res.status(500).json({ error: 'Failed to retrieve user profile' });
    }
  });

  app.post('/api/save', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const { saveData } = req.body;
      if (!saveData) {
        return res.status(400).json({ error: 'Missing saveData' });
      }
      const dataStr = typeof saveData === 'string' ? saveData : JSON.stringify(saveData);
      const saved = await saveGameForUser(req.user.uid, req.user.email || '', dataStr);
      res.json({ success: true, savedAt: saved.updatedAt });
    } catch (error: any) {
      console.error('Failed to save game data:', error);
      res.status(500).json({ error: 'Failed to save game data' });
    }
  });

  app.get('/api/save', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const saved = await getGameForUser(req.user.uid);
      if (!saved) {
        return res.json({ save: null });
      }
      let parsed = null;
      try {
        parsed = JSON.parse(saved.saveData);
      } catch {
        parsed = saved.saveData;
      }
      res.json({ save: parsed, updatedAt: saved.updatedAt });
    } catch (error: any) {
      console.error('Failed to load game save:', error);
      res.status(500).json({ error: 'Failed to load game save' });
    }
  });

  // Vite middleware in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT} with WebSocket Multiplayer enabled at /ws/multiplayer`);
  });
}

startServer();
