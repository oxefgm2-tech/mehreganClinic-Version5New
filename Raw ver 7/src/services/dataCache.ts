export interface LiveDataSnapshot {
  version: string;
  savedAt: string;
  data: Record<string, any>;
}

const CACHE_PREFIX = 'mehregan_live_snapshot_';

export async function writeLiveDataSnapshot(username: string, payload: LiveDataSnapshot): Promise<void> {
  try {
    localStorage.setItem(`${CACHE_PREFIX}${username}`, JSON.stringify(payload));
  } catch (err) {
    console.warn('Failed to write local live snapshot:', err);
  }
}

export async function readLiveDataSnapshot(username: string): Promise<LiveDataSnapshot | null> {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${username}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to read local live snapshot:', err);
    return null;
  }
}
