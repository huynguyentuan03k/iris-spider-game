/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// In AI Studio preview environment, HMR WebSockets are disabled; suppress harmless connection events
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    const msg = event.message || '';
    const src = event.filename || '';
    if (
      msg.includes('WebSocket') ||
      msg.includes('createWebSocketModuleRunnerTransport') ||
      msg.includes('ws://') ||
      msg.includes('wss://') ||
      src.includes('@vite/client')
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reasonMsg = event.reason?.message || String(event.reason || '');
    if (
      reasonMsg.includes('WebSocket') ||
      reasonMsg.includes('createWebSocketModuleRunnerTransport') ||
      reasonMsg.includes('ws://') ||
      reasonMsg.includes('wss://')
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });
}

createRoot(document.getElementById('root')!).render(<App />);
