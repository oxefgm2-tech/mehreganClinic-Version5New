const DB_NAME = 'mehregan-clinic-cache';
const STORE_NAME = 'snapshots';
const SNAPSHOT_KEY = 'live-data';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export type LiveDataSnapshot = {
  version: string;
  savedAt: string;
  data: Record<string, unknown>;
};

function openCache(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2);
    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      if (event.oldVersion < 2 && !db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function cleanupExpiredSnapshots(db: IDBDatabase): Promise<void> {
  const cutoff = Date.now() - CACHE_TTL_MS;
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  const request = store.getAllKeys();
  request.onsuccess = () => {
    (request.result as string[]).forEach((key) => {
      if (key.startsWith(`${SNAPSHOT_KEY}:`)) {
        const getReq = store.get(key);
        getReq.onsuccess = () => {
          const snap = getReq.result as LiveDataSnapshot | undefined;
          if (snap && new Date(snap.savedAt).getTime() < cutoff) {
            store.delete(key);
          }
        };
      }
    });
  };
  return new Promise((resolve) => { tx.oncomplete = () => resolve(); });
}

export async function readLiveDataSnapshot(scope: string): Promise<LiveDataSnapshot | null> {
  if (typeof indexedDB === 'undefined') return null;
  try {
    const db = await openCache();
    await cleanupExpiredSnapshots(db);
    return await new Promise((resolve, reject) => {
      const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(`${SNAPSHOT_KEY}:${scope}`);
      request.onsuccess = () => resolve((request.result as LiveDataSnapshot | undefined) || null);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('Live cache read failed:', error);
    return null;
  }
}

export async function writeLiveDataSnapshot(scope: string, snapshot: LiveDataSnapshot): Promise<void> {
  if (typeof indexedDB === 'undefined') return;
  try {
    const db = await openCache();
    await new Promise<void>((resolve, reject) => {
      const request = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(snapshot, `${SNAPSHOT_KEY}:${scope}`);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('Live cache write failed:', error);
  }
}

export async function clearLiveDataSnapshot(scope: string): Promise<void> {
  if (typeof indexedDB === 'undefined') return;
  try {
    const db = await openCache();
    await new Promise<void>((resolve, reject) => {
      const request = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).delete(`${SNAPSHOT_KEY}:${scope}`);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('Live cache clear failed:', error);
  }
}

export async function getCacheInfo(): Promise<{ count: number; oldestSavedAt?: string; newestSavedAt?: string }> {
  if (typeof indexedDB === 'undefined') return { count: 0 };
  try {
    const db = await openCache();
    return await new Promise((resolve, reject) => {
      const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAllKeys();
      request.onsuccess = () => {
        const keys = (request.result as string[]).filter((k) => k.startsWith(`${SNAPSHOT_KEY}:`));
        if (keys.length === 0) return resolve({ count: 0 });
        const getAll = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll(keys);
        getAll.onsuccess = () => {
          const snaps = (getAll.result as LiveDataSnapshot[]).filter(Boolean);
          const times = snaps.map((s) => new Date(s.savedAt).getTime()).sort((a, b) => a - b);
          resolve({
            count: snaps.length,
            oldestSavedAt: times[0] ? new Date(times[0]).toISOString() : undefined,
            newestSavedAt: times[times.length - 1] ? new Date(times[times.length - 1]).toISOString() : undefined,
          });
        };
        getAll.onerror = () => reject(getAll.error);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('Cache info failed:', error);
    return { count: 0 };
  }
}
