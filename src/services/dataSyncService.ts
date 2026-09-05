import { AppDataPackage } from '../types';
import { STORAGE_KEYS, saveToStorage } from '../utils/storage';

const BROADCAST_CHANNEL_NAME = 'welfareflow_realtime_sync';
let broadcastChannel: BroadcastChannel | null = null;

export const CLIENT_TAB_ID =
  typeof window !== 'undefined'
    ? 'tab_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now()
    : 'server';

try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  }
} catch (e) {
  console.warn('[SyncService] BroadcastChannel not supported:', e);
}

// 1. Multi-tab / Multi-window real-time broadcast
export function broadcastAppDataChange(pkg: AppDataPackage) {
  if (broadcastChannel) {
    try {
      // Ensure plain serializable object
      const safeData = JSON.parse(JSON.stringify(pkg));
      broadcastChannel.postMessage({
        type: 'APP_DATA_UPDATED',
        senderId: CLIENT_TAB_ID,
        data: safeData,
        timestamp: safeData.updatedAt || new Date().toISOString(),
      });
    } catch (err) {
      console.warn('[SyncService] Failed to broadcast message:', err);
    }
  }
}

export function subscribeToCrossTabSync(callback: (pkg: AppDataPackage) => void): () => void {
  if (!broadcastChannel) {
    return () => {};
  }

  const handler = (event: MessageEvent) => {
    try {
      if (
        event.data &&
        event.data.type === 'APP_DATA_UPDATED' &&
        event.data.data &&
        event.data.senderId !== CLIENT_TAB_ID // Prevent loopback from same tab/instance
      ) {
        callback(event.data.data);
      }
    } catch (err) {
      console.warn('[SyncService] Error in cross-tab sync message handler:', err);
    }
  };

  broadcastChannel.addEventListener('message', handler);
  return () => {
    try {
      broadcastChannel?.removeEventListener('message', handler);
    } catch {
      // Ignore
    }
  };
}

// 2. Server API synchronization
export async function fetchServerAppData(): Promise<AppDataPackage | null> {
  try {
    const res = await fetch('/api/app-data', {
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (!res.ok) {
      console.warn(`[SyncService] Failed to fetch server app data: ${res.status}`);
      return null;
    }
    const json = await res.json();
    if (json.success && json.data) {
      return json.data as AppDataPackage;
    }
    return null;
  } catch (err) {
    console.warn('[SyncService] Network error fetching server data:', err);
    return null;
  }
}

export async function fetchServerAppVersion(): Promise<{
  version: string;
  updatedAt: string;
  residentCount: number;
  recordCount: number;
  taskCount: number;
} | null> {
  try {
    const res = await fetch('/api/app-data/version', {
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json;
  } catch {
    return null;
  }
}

let syncTimeout: any = null;

export function debouncedSaveToServer(pkg: AppDataPackage, delay = 600): Promise<boolean> {
  return new Promise((resolve) => {
    if (syncTimeout) {
      clearTimeout(syncTimeout);
    }

    syncTimeout = setTimeout(async () => {
      try {
        const res = await fetch('/api/app-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(pkg),
        });
        const json = await res.json();
        resolve(!!json.success);
      } catch (err) {
        console.warn('[SyncService] Failed to persist data to server:', err);
        resolve(false);
      }
    }, delay);
  });
}

export async function resetServerAppData(): Promise<AppDataPackage | null> {
  try {
    const res = await fetch('/api/app-data/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const json = await res.json();
    if (json.success && json.data) {
      return json.data as AppDataPackage;
    }
    return null;
  } catch (err) {
    console.error('[SyncService] Failed to reset server state:', err);
    return null;
  }
}

// 3. Save full package to both localStorage and broadcast
export function persistLocallyAndBroadcast(pkg: AppDataPackage) {
  if (pkg.residents) saveToStorage(STORAGE_KEYS.RESIDENTS, pkg.residents);
  if (pkg.records) saveToStorage(STORAGE_KEYS.RECORDS, pkg.records);
  if (pkg.tasks) saveToStorage(STORAGE_KEYS.TASKS, pkg.tasks);
  if (pkg.monthlyTasks) saveToStorage(STORAGE_KEYS.MONTHLY_TASKS, pkg.monthlyTasks);
  if (pkg.timeline) saveToStorage(STORAGE_KEYS.TIMELINE, pkg.timeline);
  if (pkg.caseItems) saveToStorage(STORAGE_KEYS.CASE_ITEMS, pkg.caseItems);
  if (pkg.programs) saveToStorage(STORAGE_KEYS.PROGRAMS, pkg.programs);
  if (pkg.handover) saveToStorage(STORAGE_KEYS.HANDOVER, pkg.handover);
  if (pkg.documents) saveToStorage(STORAGE_KEYS.DOCUMENTS, pkg.documents);
  if (pkg.stats) saveToStorage(STORAGE_KEYS.STATS, pkg.stats);
  if (pkg.staff) saveToStorage(STORAGE_KEYS.STAFF, pkg.staff);

  localStorage.setItem('welfareflow_last_local_save', pkg.updatedAt || new Date().toISOString());
  broadcastAppDataChange(pkg);
}
