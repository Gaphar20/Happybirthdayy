/**
 * IndexedDB helper for persistent client-side storage of Dad's photos and music.
 * Completely eliminates the 5MB localStorage QuotaExceededError while providing
 * reliable offline resilience across browser sessions.
 */

import { DadPhoto, DadMusicTrack } from '../types';

const DB_NAME = 'DadTributeArchivalDB_v1';
const DB_VERSION = 1;
const STORE_PHOTOS = 'dad_photos';
const STORE_MUSIC = 'dad_music';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not available'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_PHOTOS)) {
        db.createObjectStore(STORE_PHOTOS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_MUSIC)) {
        db.createObjectStore(STORE_MUSIC, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function idbSavePhoto(photo: DadPhoto): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_PHOTOS, 'readwrite');
    const store = tx.objectStore(STORE_PHOTOS);
    store.put(photo);
    await new Promise<void>((res, rej) => {
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB save photo notice:', err);
  }
}

export async function idbSavePhotos(photos: DadPhoto[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_PHOTOS, 'readwrite');
    const store = tx.objectStore(STORE_PHOTOS);
    store.clear();
    for (const photo of photos) {
      store.put(photo);
    }
    await new Promise<void>((res, rej) => {
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB save photos notice:', err);
  }
}

export async function idbGetPhotos(): Promise<DadPhoto[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_PHOTOS, 'readonly');
    const store = tx.objectStore(STORE_PHOTOS);
    const req = store.getAll();
    return await new Promise<DadPhoto[]>((res, rej) => {
      req.onsuccess = () => res(req.result || []);
      req.onerror = () => rej(req.error);
    });
  } catch {
    return [];
  }
}

export async function idbDeletePhoto(id: string, fullPath?: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_PHOTOS, 'readwrite');
    const store = tx.objectStore(STORE_PHOTOS);
    
    // Delete by key directly
    store.delete(id);
    if (fullPath) {
      store.delete(fullPath);
    }

    // Also scan all records to ensure no stale entries remain under another key format
    const req = store.getAll();
    req.onsuccess = () => {
      const items = req.result as DadPhoto[];
      if (items && Array.isArray(items)) {
        for (const item of items) {
          if (
            item.id === id ||
            item.name === id ||
            item.fullPath === id ||
            (fullPath && (item.fullPath === fullPath || item.name === fullPath || item.id === fullPath))
          ) {
            store.delete(item.id);
          }
        }
      }
    };

    await new Promise<void>((res, rej) => {
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB delete photo notice:', err);
  }
}

export async function idbSaveMusic(track: DadMusicTrack): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_MUSIC, 'readwrite');
    const store = tx.objectStore(STORE_MUSIC);
    store.put(track);
    await new Promise<void>((res, rej) => {
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB save music notice:', err);
  }
}

export async function idbGetMusic(): Promise<DadMusicTrack[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_MUSIC, 'readonly');
    const store = tx.objectStore(STORE_MUSIC);
    const req = store.getAll();
    return await new Promise<DadMusicTrack[]>((res, rej) => {
      req.onsuccess = () => res(req.result || []);
      req.onerror = () => rej(req.error);
    });
  } catch {
    return [];
  }
}

export async function idbDeleteMusic(id: string, fullPath?: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_MUSIC, 'readwrite');
    const store = tx.objectStore(STORE_MUSIC);
    store.delete(id);
    if (fullPath) {
      store.delete(fullPath);
    }

    const req = store.getAll();
    req.onsuccess = () => {
      const items = req.result as DadMusicTrack[];
      if (items && Array.isArray(items)) {
        for (const item of items) {
          if (
            item.id === id ||
            item.name === id ||
            item.fullPath === id ||
            (fullPath && (item.fullPath === fullPath || item.name === fullPath || item.id === fullPath))
          ) {
            store.delete(item.id);
          }
        }
      }
    };

    await new Promise<void>((res, rej) => {
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB delete music notice:', err);
  }
}
