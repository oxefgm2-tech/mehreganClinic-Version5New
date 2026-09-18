const DB_NAME = 'mehregan-clinic-cache';
const STORE_NAME = 'snapshots';
const SNAPSHOT_KEY = 'live-data';

export type LiveDataSnapshot = {
  version: string;
  savedAt: string;
  data: Record<string, unknown>;
};

function openCache(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function readLiveDataSnapshot(scope: string): Promise<LiveDataSnapshot | null> {
  if (typeof indexedDB === 'undefined') return null;
  try {
    const db = await openCache();
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
