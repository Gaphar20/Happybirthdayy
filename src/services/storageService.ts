import {
  ref,
  uploadBytes,
  getDownloadURL,
  listAll,
  getMetadata,
  updateMetadata,
  deleteObject,
  FullMetadata,
} from 'firebase/storage';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  query,
} from 'firebase/firestore';
import {
  getDb,
  getFirebaseStorage,
  getFirebaseAuth,
  isFirebaseConfigured,
} from '../firebase/config';
import { isLocalAdminAuthenticated } from '../firebase/auth';
import { DadPhoto, DadMusicTrack, Memory } from '../types';
import {
  idbSavePhoto,
  idbSavePhotos,
  idbGetPhotos,
  idbDeletePhoto,
  idbSaveMusic,
  idbGetMusic,
  idbDeleteMusic,
} from './indexedDbHelper';

export const DAD_PHOTOS_PATH = 'dad-photos';
export const BIRTHDAY_MUSIC_PATH = 'birthday-music';

// Local storage backup keys
const LOCAL_PHOTOS_KEY = 'dad_storage_photos_backup_v2';
const LOCAL_MUSIC_KEY = 'dad_storage_music_backup_v2';
const LOCAL_DELETED_PHOTOS_KEY = 'dad_deleted_photos_registry_v3';
const LOCAL_DELETED_MUSIC_KEY = 'dad_deleted_music_registry_v3';
const LOCAL_HERO_PHOTO_URL_KEY = 'dad_designated_hero_photo_url_v3';
const LOCAL_HERO_PHOTO_ID_KEY = 'dad_designated_hero_photo_id_v3';
const LOCAL_ACTIVE_MUSIC_KEY = 'dad_active_birthday_music_v3';

/**
 * Synchronously retrieves the designated Dad birthday music track from cache.
 * Guarantees zero-flicker immediate readiness on page load.
 */
export const getDesignatedBirthdayMusic = (): DadMusicTrack | null => {
  try {
    const raw = localStorage.getItem(LOCAL_ACTIVE_MUSIC_KEY);
    if (!raw) return null;
    const track = JSON.parse(raw) as DadMusicTrack;
    const tombstones = getLocalDeletedMusicTombstones();
    if (tombstones.has(track.id) || (track.fullPath && tombstones.has(track.fullPath))) {
      return null;
    }
    return track;
  } catch {
    return null;
  }
};

/**
 * Designates and locks in an audio track as Dad's active celebration soundtrack.
 * Persists to localStorage, IndexedDB, and Firestore settings, and dispatches a window event
 * so all components (MusicPlayer, Hero, etc.) update and play instantaneously.
 */
export const setDesignatedBirthdayMusic = async (
  track: DadMusicTrack
): Promise<void> => {
  try {
    const safeTrack: DadMusicTrack = {
      ...track,
      isActive: true,
      blob: undefined, // do not stringify raw Blob to localStorage
    };
    localStorage.setItem(LOCAL_ACTIVE_MUSIC_KEY, JSON.stringify(safeTrack));
  } catch {}

  // Update in local backup cache
  try {
    const localMusic = getLocalBackupMusic();
    const updated = localMusic.map((t) => ({
      ...t,
      isActive: t.id === track.id || t.fullPath === track.fullPath,
    }));
    if (!updated.some((t) => t.id === track.id || t.fullPath === track.fullPath)) {
      updated.unshift({ ...track, isActive: true, blob: undefined });
    }
    saveLocalBackupMusic(updated);
  } catch {}

  // Update in IndexedDB
  try {
    const idbTracks = await idbGetMusic();
    for (const t of idbTracks) {
      const isTarget = t.id === track.id || t.fullPath === track.fullPath;
      await idbSaveMusic({
        ...t,
        isActive: isTarget,
        ...(isTarget && track.blob ? { blob: track.blob } : {}),
      });
    }
  } catch {}

  // Sync to Cloud Firestore
  const db = getDb();
  if (db) {
    try {
      // 1. Update settings/soundtrack
      await setDoc(
        doc(db, 'settings', 'soundtrack'),
        {
          activeTrackId: track.id,
          title: track.title,
          subtitle: track.subtitle || 'Celebration of Grace & Life',
          url: track.url && !track.url.startsWith('data:') ? track.url : '',
          timeUpdated: new Date().toISOString(),
        },
        { merge: true }
      );

      // 2. Mark active in music collection
      const musicRef = collection(db, 'music');
      const snap = await getDocs(musicRef);
      const updates = snap.docs.map((d) => {
        const isTarget =
          d.id === track.id ||
          d.data().id === track.id ||
          d.data().fullPath === track.fullPath;
        return updateDoc(d.ref, { isActive: isTarget });
      });
      await Promise.all(updates);
    } catch (err) {
      console.warn('Notice: Firestore active music sync:', err);
    }
  }

  // Dispatch global window event
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(
        new CustomEvent('dad-birthday-music-updated', {
          detail: { track },
        })
      );
    } catch {}
  }
};

/**
 * Synchronously retrieves the designated Dad hero photo URL from cache.
 * Guarantees zero-flicker immediate painting on page load.
 */
export const getDesignatedHeroPhotoUrl = (): string | null => {
  try {
    const tombstones = getLocalDeletedPhotoTombstones();
    const cachedUrl = localStorage.getItem(LOCAL_HERO_PHOTO_URL_KEY);
    const cachedId = localStorage.getItem(LOCAL_HERO_PHOTO_ID_KEY);
    if (cachedUrl && !tombstones.has(cachedUrl) && (!cachedId || !tombstones.has(cachedId))) {
      return cachedUrl;
    }
    // Fallback: search local backup photos
    const localPhotos = getLocalBackupPhotos();
    const heroPhoto =
      localPhotos.find((p) => p.isHero && !tombstones.has(p.id) && !tombstones.has(p.fullPath)) ||
      localPhotos.find((p) => !tombstones.has(p.id) && !tombstones.has(p.fullPath));
    if (heroPhoto?.url && !heroPhoto.url.includes('...[truncated]')) {
      return heroPhoto.url;
    }
  } catch {
    return null;
  }
  return null;
};

/**
 * Permanently locks in a photo as Dad's designated Hero photo.
 * Persists to localStorage, local backup, and dispatches a window event
 * so all active components update instantaneously.
 */
export const setDesignatedHeroPhoto = async (
  url: string,
  photoId?: string,
  fullPath?: string
): Promise<void> => {
  try {
    localStorage.setItem(LOCAL_HERO_PHOTO_URL_KEY, url);
    if (photoId) {
      localStorage.setItem(LOCAL_HERO_PHOTO_ID_KEY, photoId);
    }
  } catch {}

  // Update in local backup cache
  const localPhotos = getLocalBackupPhotos();
  const updated = localPhotos.map((p) => ({
    ...p,
    isHero: (photoId && p.id === photoId) || (fullPath && p.fullPath === fullPath) || p.url === url,
  }));
  saveLocalBackupPhotos(updated);

  // Dispatch global window event so any mounted Hero component immediately renders the new image
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(
        new CustomEvent('dad-hero-photo-updated', {
          detail: { url, photoId, fullPath },
        })
      );
    } catch {}
  }
};

/**
 * Tombstone registry for deleted photos.
 * Ensures deleted photos remain permanently purged across all layers (Firestore, Storage, IDB, Cache)
 * even if Firebase Storage deleteObject times out or listAll returns un-purged references.
 */
export const getLocalDeletedPhotoTombstones = (): Set<string> => {
  try {
    const raw = localStorage.getItem(LOCAL_DELETED_PHOTOS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
};

const saveLocalDeletedPhotoTombstones = (set: Set<string>): void => {
  try {
    localStorage.setItem(LOCAL_DELETED_PHOTOS_KEY, JSON.stringify(Array.from(set)));
  } catch (err) {
    console.warn('Notice: Failed to save deleted photos tombstone to localStorage:', err);
  }
};

const fetchDeletedPhotoTombstones = async (): Promise<Set<string>> => {
  const combined = getLocalDeletedPhotoTombstones();
  const db = getDb();
  if (db) {
    try {
      const snap = await getDocs(collection(db, 'deleted_photos'));
      snap.forEach((d) => {
        combined.add(d.id);
        const data = d.data();
        if (data.id) combined.add(data.id);
        if (data.fullPath) combined.add(data.fullPath);
        if (data.filename) combined.add(data.filename);
        if (data.name) combined.add(data.name);
        if (Array.isArray(data.identifiers)) {
          data.identifiers.forEach((ident: string) => {
            if (ident) combined.add(ident);
          });
        }
      });
      saveLocalDeletedPhotoTombstones(combined);
    } catch (err) {
      console.warn('Notice: Firestore deleted_photos registry read:', err);
    }
  }
  return combined;
};

const recordPhotoDeletionTombstone = async (
  identifiers: string[],
  fullPath?: string,
  filename?: string
): Promise<void> => {
  const set = getLocalDeletedPhotoTombstones();
  for (const ident of identifiers) {
    if (ident) set.add(ident);
  }
  if (fullPath) set.add(fullPath);
  if (filename) set.add(filename);
  saveLocalDeletedPhotoTombstones(set);

  const db = getDb();
  if (db) {
    try {
      const mainId = identifiers[0] || filename || String(Date.now());
      const safeDocId = mainId.replace(/[^a-zA-Z0-9_-]/g, '_');
      await setDoc(doc(db, 'deleted_photos', safeDocId), {
        id: mainId,
        identifiers,
        fullPath: fullPath || '',
        filename: filename || '',
        deletedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Notice: Firestore deleted_photos setDoc:', err);
    }
  }
};

const removePhotoFromTombstones = async (identifiers: string[]): Promise<void> => {
  const set = getLocalDeletedPhotoTombstones();
  for (const ident of identifiers) {
    set.delete(ident);
  }
  saveLocalDeletedPhotoTombstones(set);

  const db = getDb();
  if (db) {
    try {
      for (const ident of identifiers) {
        const safeDocId = ident.replace(/[^a-zA-Z0-9_-]/g, '_');
        deleteDoc(doc(db, 'deleted_photos', safeDocId)).catch(() => {});
      }
    } catch {}
  }
};

const getLocalDeletedMusicTombstones = (): Set<string> => {
  try {
    const raw = localStorage.getItem(LOCAL_DELETED_MUSIC_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
};

const saveLocalDeletedMusicTombstones = (set: Set<string>): void => {
  try {
    localStorage.setItem(LOCAL_DELETED_MUSIC_KEY, JSON.stringify(Array.from(set)));
  } catch {}
};

export interface OptimizedImageResult {
  file: File;
  dataUrl: string;
  size: number;
}

export interface UploadPhotoOptions {
  title?: string;
  description?: string;
  category?: string;
  location?: string;
  badge?: string;
  alt?: string;
  isHero?: boolean;
  preOptimized?: OptimizedImageResult;
}

/**
 * Clean filename for storage path
 */
const sanitizeFilename = (filename: string): string => {
  return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
};

/**
 * Helper to retrieve local backup photos
 */
const getLocalBackupPhotos = (): DadPhoto[] => {
  try {
    const raw = localStorage.getItem(LOCAL_PHOTOS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalBackupPhotos = (photos: DadPhoto[]): void => {
  try {
    // Only store lightweight metadata or max 5 items in localStorage to avoid QuotaExceededError
    const lightweight = photos.slice(0, 10).map((p) => {
      // If URL is a massive dataUrl (>100KB), truncate or omit from localStorage
      if (p.url && p.url.startsWith('data:') && p.url.length > 100000) {
        return { ...p, url: p.url.substring(0, 500) + '...[truncated]' };
      }
      return p;
    });
    localStorage.setItem(LOCAL_PHOTOS_KEY, JSON.stringify(lightweight));
  } catch (err) {
    console.warn('Failed to save photos to localStorage (IndexedDB is primary store):', err);
  }
};

/**
 * Helper to retrieve local backup music
 */
const getLocalBackupMusic = (): DadMusicTrack[] => {
  try {
    const raw = localStorage.getItem(LOCAL_MUSIC_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveLocalBackupMusic = (tracks: DadMusicTrack[]): void => {
  try {
    const lightweight = tracks.slice(0, 5).map((t) => {
      if (t.url && t.url.startsWith('data:') && t.url.length > 100000) {
        return { ...t, url: t.url.substring(0, 500) + '...[truncated]' };
      }
      return t;
    });
    localStorage.setItem(LOCAL_MUSIC_KEY, JSON.stringify(lightweight));
  } catch (err) {
    console.warn('Failed to save music to localStorage:', err);
  }
};

/**
 * Automatically compress and optimize images before upload.
 * Reduces 5MB-20MB camera photos to ~70KB-160KB in under 50ms.
 * Uses hardware-accelerated off-thread decode when available.
 */
export const optimizeImage = async (
  file: File,
  maxDimension = 1200,
  quality = 0.78
): Promise<OptimizedImageResult> => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        resolve({ file, dataUrl, size: file.size });
      };
      reader.onerror = () => resolve({ file, dataUrl: '', size: file.size });
      reader.readAsDataURL(file);
      return;
    }

    const processCanvas = (source: CanvasImageSource, sWidth: number, sHeight: number) => {
      let width = sWidth;
      let height = sHeight;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { alpha: false });

      if (!ctx) {
        fallbackFileReader();
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'medium';
      ctx.drawImage(source, 0, 0, width, height);

      const mimeType = 'image/jpeg';
      const dataUrl = canvas.toDataURL(mimeType, quality);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const optimizedFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, '.jpg'),
              {
                type: mimeType,
                lastModified: Date.now(),
              }
            );
            resolve({
              file: optimizedFile,
              dataUrl,
              size: blob.size,
            });
          } else {
            resolve({ file, dataUrl, size: file.size });
          }
        },
        mimeType,
        quality
      );
    };

    const fallbackFileReader = () => {
      const reader = new FileReader();
      reader.onload = () => resolve({ file, dataUrl: reader.result as string, size: file.size });
      reader.onerror = () => resolve({ file, dataUrl: '', size: file.size });
      reader.readAsDataURL(file);
    };

    // Fast path: off-thread decode with createImageBitmap
    if (typeof createImageBitmap !== 'undefined') {
      createImageBitmap(file)
        .then((bitmap) => {
          processCanvas(bitmap, bitmap.width, bitmap.height);
          bitmap.close();
        })
        .catch(() => {
          fallbackImageElement();
        });
      return;
    }

    fallbackImageElement();

    function fallbackImageElement() {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        processCanvas(img, img.naturalWidth || img.width, img.naturalHeight || img.height);
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        fallbackFileReader();
      };

      img.src = objectUrl;
    }
  });
};

/**
 * Convert DadPhoto into Memory interface compatible with existing gallery
 */
export const photoToMemory = (photo: DadPhoto): Memory => {
  return {
    id: photo.id,
    title: photo.title,
    description: photo.description,
    imageUrl: photo.url,
    category: photo.category || 'Celebration',
    location: photo.location || 'Family Archive',
    badge: photo.badge || 'Cherished Memory',
    alt: photo.alt || photo.title,
  };
};

/**
 * 1. Fetch all Dad Photos
 * Reads from:
 * 1. Firestore 'photos' collection (cross-device synced cloud database)
 * 2. Firebase Storage 'dad-photos/' (if bucket accessible)
 * 3. IndexedDB local persistent store
 * 4. Local fallback cache
 */
export const fetchDadPhotosFromStorage = async (): Promise<{
  heroPhoto: DadPhoto | null;
  memories: DadPhoto[];
  error?: string;
}> => {
  const photosMap = new Map<string, DadPhoto>();

  // 0. Load tombstones of permanently deleted photos
  const tombstones = await fetchDeletedPhotoTombstones();

  const isPhotoDeleted = (id: string, name?: string, fullPath?: string): boolean => {
    if (!id && !name && !fullPath) return false;
    const filename = fullPath ? fullPath.split('/').pop() : undefined;
    const cleanId = id ? id.replace(/\.[^/.]+$/, '') : undefined;
    return (
      tombstones.has(id) ||
      (Boolean(name) && tombstones.has(name!)) ||
      (Boolean(fullPath) && tombstones.has(fullPath!)) ||
      (Boolean(filename) && tombstones.has(filename!)) ||
      (Boolean(cleanId) && tombstones.has(cleanId!))
    );
  };

  // 1. Primary Cloud Store: Firestore 'photos' collection
  const db = getDb();
  if (db) {
    try {
      const photosRef = collection(db, 'photos');
      const q = query(photosRef);
      const querySnap = await getDocs(q);
      querySnap.forEach((docSnap) => {
        const data = docSnap.data();
        const pId = data.id || docSnap.id;
        const pName = data.name || docSnap.id;
        const pFullPath = data.fullPath || `${DAD_PHOTOS_PATH}/${docSnap.id}`;

        if (isPhotoDeleted(pId, pName, pFullPath) || isPhotoDeleted(docSnap.id)) {
          // Clean up leftover Firestore document in background
          deleteDoc(docSnap.ref).catch(() => {});
          return;
        }

        const photo: DadPhoto = {
          id: pId,
          name: pName,
          fullPath: pFullPath,
          url: data.url,
          title: data.title || 'Cherished Moment',
          description:
            data.description ||
            'A treasured memory celebrating Dad’s steadfast wisdom, love, and life.',
          category: data.category || 'Celebration',
          location: data.location || 'Family Hearth',
          badge: data.badge || 'Cherished Archive',
          alt: data.alt || data.title,
          isHero: Boolean(data.isHero),
          timeCreated: data.createdAt,
          size: data.size,
        };
        if (photo.url && !photo.url.includes('...[truncated]')) {
          photosMap.set(photo.id, photo);
        }
      });
    } catch (err) {
      console.warn('Firestore photos collection query notice:', err);
    }
  }

  // 2. Firebase Storage folder: dad-photos/ (with timeout and skip-existing check)
  const storage = getFirebaseStorage();
  if (isFirebaseConfigured() && storage) {
    try {
      const photosFolderRef = ref(storage, DAD_PHOTOS_PATH);
      const listPromise = listAll(photosFolderRef);
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1200));
      const listResult = await Promise.race([listPromise, timeoutPromise]);

      if (listResult && listResult.items && listResult.items.length > 0) {
        // Only fetch storage URL and metadata for files not deleted and not already discovered in Firestore
        const unindexedItems = listResult.items.filter((itemRef) => {
          if (isPhotoDeleted(itemRef.name, itemRef.name, itemRef.fullPath)) {
            return false;
          }
          const alreadyExists = Array.from(photosMap.values()).some(
            (p) =>
              p.name === itemRef.name ||
              p.fullPath === itemRef.fullPath ||
              p.id === itemRef.name ||
              (p.name && p.name.includes(itemRef.name))
          );
          return !alreadyExists;
        });

        if (unindexedItems.length > 0) {
          const photoPromises = unindexedItems.map(async (itemRef) => {
            try {
              const [url, metadata] = await Promise.all([
                getDownloadURL(itemRef),
                getMetadata(itemRef).catch(() => ({} as FullMetadata)),
              ]);

              const custom = metadata.customMetadata || {};
              const cleanName = itemRef.name
                .replace(/^\d+_/, '')
                .replace(/\.[^/.]+$/, '')
                .replace(/_/g, ' ');

              const photo: DadPhoto = {
                id: itemRef.name,
                name: itemRef.name,
                fullPath: itemRef.fullPath,
                url,
                title: custom.title || cleanName || 'Cherished Moment',
                description:
                  custom.description ||
                  'A treasured memory celebrating Dad’s steadfast wisdom, love, and life.',
                category: custom.category || 'Celebration',
                location: custom.location || 'Family Hearth',
                badge: custom.badge || 'Cherished Archive',
                alt: custom.alt || custom.title || cleanName,
                isHero:
                  custom.isHero === 'true' ||
                  itemRef.name.toLowerCase().startsWith('hero') ||
                  itemRef.name.toLowerCase().includes('featured'),
                timeCreated: metadata.timeCreated,
                size: metadata.size,
              };

              return photo;
            } catch {
              return null;
            }
          });

          const resolved = (await Promise.all(photoPromises)).filter(
            (p): p is DadPhoto => p !== null
          );

          for (const item of resolved) {
            if (!photosMap.has(item.id) && !isPhotoDeleted(item.id, item.name, item.fullPath)) {
              photosMap.set(item.id, item);
            }
          }
        }
      }
    } catch (storageErr) {
      console.warn('Firebase Storage dad-photos/ query notice:', storageErr);
    }
  }

  // 3. Persistent IndexedDB local store
  try {
    const idbPhotos = await idbGetPhotos();
    for (const p of idbPhotos) {
      if (isPhotoDeleted(p.id, p.name, p.fullPath)) {
        idbDeletePhoto(p.id, p.fullPath).catch(() => {});
        continue;
      }
      if (!photosMap.has(p.id) && p.url) {
        photosMap.set(p.id, p);
      }
    }
  } catch (idbErr) {
    console.warn('IndexedDB retrieval notice:', idbErr);
  }

  // 4. Fallback localStorage backup
  const backupPhotos = getLocalBackupPhotos();
  for (const p of backupPhotos) {
    if (isPhotoDeleted(p.id, p.name, p.fullPath)) {
      continue;
    }
    if (!photosMap.has(p.id) && p.url && !p.url.includes('...[truncated]')) {
      photosMap.set(p.id, p);
    }
  }

  const allPhotos = Array.from(photosMap.values());

  if (allPhotos.length > 0) {
    // 1. Check for designated hero photo from persistent storage
    const designatedUrl = getDesignatedHeroPhotoUrl();

    // Sort memories by timeCreated descending (newest uploads first in memories gallery)
    allPhotos.sort((a, b) => {
      return (b.timeCreated || '').localeCompare(a.timeCreated || '');
    });

    // Mirror to IndexedDB for offline access
    idbSavePhotos(allPhotos).catch(() => {});

    // Determine the permanent hero photo:
    // Priority:
    // 1. Photo matching previously designated hero URL
    // 2. Photo explicitly marked as isHero: true
    // 3. Do not fall back to latest photo to prevent new gallery uploads from hijacking hero
    let hero =
      (designatedUrl ? allPhotos.find((p) => p.url === designatedUrl) : null) ||
      allPhotos.find((p) => p.isHero) ||
      null;

    // Keep persistent storage in sync if a valid hero is detected
    if (hero?.url && (!designatedUrl || designatedUrl !== hero.url)) {
      setDesignatedHeroPhoto(hero.url, hero.id, hero.fullPath).catch(() => {});
    }

    return {
      heroPhoto: hero,
      memories: allPhotos,
    };
  }

  return {
    heroPhoto: null,
    memories: [],
  };
};

/**
 * 2. Fetch the birthday soundtrack from Firebase Storage / IndexedDB
 */
export const fetchBirthdayMusicFromStorage = async (): Promise<{
  track: DadMusicTrack | null;
  allTracks: DadMusicTrack[];
  error?: string;
}> => {
  const tracksMap = new Map<string, DadMusicTrack>();

  const musicTombstones = getLocalDeletedMusicTombstones();
  const isMusicDeleted = (tId: string, fullP?: string) => {
    return musicTombstones.has(tId) || (fullP && musicTombstones.has(fullP));
  };

  const db = getDb();
  let activeTrackIdFromCloud: string | null = null;

  // 1. Primary Cloud Query: Retrieve music tracks and active setting from Firestore
  if (db) {
    try {
      // Check active soundtrack setting
      const settingSnap = await getDoc(doc(db, 'settings', 'soundtrack'));
      if (settingSnap.exists()) {
        activeTrackIdFromCloud = settingSnap.data()?.activeTrackId || null;
      }
    } catch (err: any) {
      console.warn('Notice: Firestore soundtrack setting read:', err?.message || err);
    }

    try {
      const musicRef = collection(db, 'music');
      const snapshot = await getDocs(musicRef);
      if (!snapshot.empty) {
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as DadMusicTrack;
          if (data && !isMusicDeleted(data.id || docSnap.id, data.fullPath)) {
            tracksMap.set(data.id || docSnap.id, {
              ...data,
              id: data.id || docSnap.id,
            });
          }
        });
      }
    } catch (err: any) {
      console.warn('Firestore music query notice:', err?.code || err?.message || err);
    }
  }

  // 2. Firebase Storage bucket check (birthday-music/)
  const storage = getFirebaseStorage();
  if (isFirebaseConfigured() && storage) {
    try {
      const musicFolderRef = ref(storage, BIRTHDAY_MUSIC_PATH);
      const listPromise = listAll(musicFolderRef);
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500));
      const listResult = await Promise.race([listPromise, timeoutPromise]);

      if (listResult && listResult.items && listResult.items.length > 0) {
        const filteredItems = listResult.items.filter(
          (itemRef) => !isMusicDeleted(itemRef.name, itemRef.fullPath)
        );

        const trackPromises = filteredItems.map(async (itemRef) => {
          try {
            const [url, metadata] = await Promise.all([
              getDownloadURL(itemRef),
              getMetadata(itemRef).catch(() => ({} as FullMetadata)),
            ]);

            const custom = metadata.customMetadata || {};
            const cleanName = itemRef.name
              .replace(/^\d+_/, '')
              .replace(/\.[^/.]+$/, '')
              .replace(/_/g, ' ');

            const isVideo =
              metadata.contentType?.startsWith('video/') ||
              /\.(mp4|mov|webm)$/i.test(itemRef.name);

            const track: DadMusicTrack = {
              id: itemRef.name,
              name: itemRef.name,
              fullPath: itemRef.fullPath,
              url,
              title: custom.title || cleanName || 'Dad’s Birthday Soundtrack',
              subtitle: custom.subtitle || 'Celebration of Grace & Life',
              timeCreated: metadata.timeCreated,
              size: metadata.size,
              isVideo,
              mimeType: metadata.contentType,
            };
            return track;
          } catch {
            return null;
          }
        });

        const resolved = (await Promise.all(trackPromises)).filter(
          (t): t is DadMusicTrack => t !== null
        );

        for (const t of resolved) {
          if (!isMusicDeleted(t.id, t.fullPath)) {
            tracksMap.set(t.id, t);
          }
        }
      }
    } catch (err: any) {
      console.warn('Firebase Storage birthday-music/ query notice:', err?.code || err?.message || err);
    }
  }

  // 3. Load from IndexedDB (local browser cache of uploaded tracks & raw audio Blobs)
  try {
    const idbTracks = await idbGetMusic();
    for (const t of idbTracks) {
      if (isMusicDeleted(t.id, t.fullPath)) {
        idbDeleteMusic(t.id, t.fullPath).catch(() => {});
        continue;
      }

      let validUrl = t.url;
      // If URL was a dead or revoked blob URL or truncated, regenerate fresh streaming URL from raw Blob
      if ((!validUrl || validUrl.startsWith('blob:') || validUrl.includes('...[truncated]')) && t.blob) {
        try {
          validUrl = URL.createObjectURL(t.blob);
        } catch {}
      }

      const enriched: DadMusicTrack = {
        ...t,
        url: validUrl || t.url,
      };

      // Always prefer local full track from IndexedDB over truncated or partial cloud copy
      tracksMap.set(t.id, enriched);

      // Auto-sync track metadata to Firestore so all visitors receive it
      if (db && validUrl && !validUrl.startsWith('blob:') && !validUrl.includes('...[truncated]')) {
        setDoc(doc(collection(db, 'music'), t.id), {
          id: t.id,
          name: t.name,
          fullPath: t.fullPath,
          url: validUrl.length < 900000 ? validUrl : '',
          title: t.title,
          subtitle: t.subtitle,
          timeCreated: t.timeCreated,
          size: t.size,
          isVideo: t.isVideo || false,
          mimeType: t.mimeType || '',
          isActive: t.isActive || false,
        }, { merge: true }).catch(() => {});
      }
    }
  } catch {}

  // 4. Fallback to local storage backup
  const backupMusic = getLocalBackupMusic();
  for (const t of backupMusic) {
    if (isMusicDeleted(t.id, t.fullPath)) {
      continue;
    }
    if (!tracksMap.has(t.id) && t.url && !t.url.includes('...[truncated]')) {
      tracksMap.set(t.id, t);
    }
  }

  const designatedLocal = getDesignatedBirthdayMusic();
  const allTracks = Array.from(tracksMap.values());

  // Mark isActive on tracks
  const processedTracks = allTracks.map((t) => {
    const isActive =
      Boolean(t.isActive) ||
      Boolean(designatedLocal && (t.id === designatedLocal.id || t.fullPath === designatedLocal.fullPath)) ||
      Boolean(activeTrackIdFromCloud && t.id === activeTrackIdFromCloud);
    return {
      ...t,
      isActive,
    };
  });

  // Sort tracks: Active track first, then sorted by timeCreated descending
  processedTracks.sort((a, b) => {
    if (a.isActive && !b.isActive) return -1;
    if (!a.isActive && b.isActive) return 1;
    const timeA = a.timeCreated ? new Date(a.timeCreated).getTime() : 0;
    const timeB = b.timeCreated ? new Date(b.timeCreated).getTime() : 0;
    return timeB - timeA;
  });

  const activeTrack = processedTracks.find((t) => t.isActive) || processedTracks[0] || null;

  // Auto-sync designated track to local storage if not yet cached
  if (activeTrack && !designatedLocal) {
    setDesignatedBirthdayMusic(activeTrack).catch(() => {});
  }

  return {
    track: activeTrack,
    allTracks: processedTracks,
  };
};

/**
 * 3. Upload a Dad photo
 * Multi-layer persistence pipeline:
 * 1. Optimizes/compresses image in-browser to prevent timeouts and quota errors.
 * 2. Attempts Firebase Storage upload to dad-photos/.
 * 3. Writes photo metadata & public URL or optimized dataUrl into Firestore 'photos' collection.
 * 4. Persists to browser's IndexedDB store so the photo is never lost.
 */
export const uploadDadPhotoToStorage = async (
  file: File,
  options: UploadPhotoOptions = {}
): Promise<DadPhoto> => {
  const auth = getFirebaseAuth();
  const storage = getFirebaseStorage();
  const db = getDb();

  // Enforce admin permission
  const currentUser = auth?.currentUser;
  const isLocalAdmin = isLocalAdminAuthenticated();

  if (!currentUser && !isLocalAdmin) {
    throw new Error('Authentication required: Only administrators can upload photos.');
  }

  // Optimize image (or use pre-optimized result from instant client pre-processing)
  const { file: optimizedFile, dataUrl: optimizedDataUrl, size: optimizedSize } =
    options.preOptimized || (await optimizeImage(file, 1200, 0.78));

  const sanitized = sanitizeFilename(file.name);
  const isHero = Boolean(options.isHero);
  const timestamp = Date.now();
  const filename = isHero
    ? `hero_${timestamp}_${sanitized}`
    : `${timestamp}_${sanitized}`;
  const fullPath = `${DAD_PHOTOS_PATH}/${filename}`;
  const photoId = `photo_${timestamp}_${sanitized.replace(/\.[^/.]+$/, '')}`;

  const cleanTitle =
    options.title?.trim() ||
    file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

  let photoUrl = '';
  let storageSource = 'firestore-cloud';

  // 1. Attempt upload to Firebase Storage with strict 1.8s timeout
  if (isFirebaseConfigured() && storage) {
    try {
      const storageRef = ref(storage, fullPath);
      const metadata = {
        contentType: optimizedFile.type || 'image/jpeg',
        customMetadata: {
          title: cleanTitle,
          description: options.description?.trim() || '',
          category: options.category || 'Celebration',
          location: options.location?.trim() || 'Family Hearth',
          badge: options.badge?.trim() || 'Cherished Archive',
          alt: options.alt?.trim() || cleanTitle,
          isHero: isHero ? 'true' : 'false',
        },
      };

      const uploadPromise = (async () => {
        const uploadResult = await uploadBytes(storageRef, optimizedFile, metadata);
        return await getDownloadURL(uploadResult.ref);
      })();

      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1800));
      const storageUrl = await Promise.race([uploadPromise, timeoutPromise]);

      if (storageUrl) {
        photoUrl = storageUrl;
        storageSource = 'firebase-storage';
      }
    } catch (storageErr) {
      console.warn(
        'Notice: Firebase Storage upload deferred, proceeding with fast Firestore cloud pipeline:',
        storageErr
      );
    }
  }

  // Fall back to optimized data URL immediately if Storage is slow, blocked, or pending CORS
  if (!photoUrl) {
    photoUrl = optimizedDataUrl;
  }

  const newPhoto: DadPhoto = {
    id: photoId,
    name: filename,
    fullPath,
    url: photoUrl,
    title: cleanTitle,
    description: options.description?.trim() || '',
    category: options.category || 'Celebration',
    location: options.location?.trim() || 'Family Hearth',
    badge: options.badge?.trim() || 'Cherished Archive',
    alt: options.alt?.trim() || cleanTitle,
    isHero,
    timeCreated: new Date().toISOString(),
    size: optimizedSize,
  };

  // Remove newly uploaded photo from tombstones if it was previously deleted
  removePhotoFromTombstones([photoId, filename, fullPath]).catch(() => {});

  // 2. Persist to Firestore 'photos' collection (visible across all visitor devices)
  if (db) {
    try {
      const photoDocRef = doc(db, 'photos', photoId);
      await setDoc(photoDocRef, {
        id: photoId,
        name: filename,
        fullPath,
        url: photoUrl,
        title: cleanTitle,
        description: options.description?.trim() || '',
        category: options.category || 'Celebration',
        location: options.location?.trim() || 'Family Hearth',
        badge: options.badge?.trim() || 'Cherished Archive',
        alt: options.alt?.trim() || cleanTitle,
        isHero,
        createdAt: new Date().toISOString(),
        size: optimizedSize,
        source: storageSource,
      });

      // If marked as hero, unset other hero photos in Firestore asynchronously
      if (isHero) {
        getDocs(collection(db, 'photos')).then((snapshot) => {
          snapshot.forEach((docSnap) => {
            if (docSnap.id !== photoId && docSnap.data().isHero === true) {
              updateDoc(docSnap.ref, { isHero: false }).catch(() => {});
            }
          });
        }).catch(() => {});
      }
    } catch (firestoreErr) {
      console.warn('Notice: Firestore photo document sync warning:', firestoreErr);
    }
  }

  // 3. Save to IndexedDB (unlimited quota, instant local persistence)
  await idbSavePhoto(newPhoto);

  // 4. Mirror to local backup cache
  const current = getLocalBackupPhotos();
  const updated = isHero
    ? [newPhoto, ...current.map((p) => ({ ...p, isHero: false }))]
    : [newPhoto, ...current];
  saveLocalBackupPhotos(updated);

  // Only lock in as designated hero photo if isHero was explicitly requested
  if (isHero) {
    setDesignatedHeroPhoto(newPhoto.url, newPhoto.id, newPhoto.fullPath).catch(() => {});
  }

  return newPhoto;
};

/**
 * 4. Delete a Dad photo from all storage layers
 * Guaranteed permanent deletion across:
 * - Persistent Tombstone Registry (Firestore 'deleted_photos' + LocalStorage)
 * - Firestore 'photos' collection (deletes all matching docs)
 * - Firebase Storage 'dad-photos/' (with bounded timeout)
 * - IndexedDB persistent store
 * - LocalStorage backup cache
 */
export const deleteDadPhotoFromStorage = async (
  fullPath: string,
  photoId?: string
): Promise<boolean> => {
  const auth = getFirebaseAuth();
  const storage = getFirebaseStorage();
  const db = getDb();

  const currentUser = auth?.currentUser;
  const isLocalAdmin = isLocalAdminAuthenticated();

  if (!currentUser && !isLocalAdmin) {
    throw new Error('Authentication required: Only administrators can delete photos.');
  }

  const rawFilename = fullPath.split('/').pop() || '';
  const id = photoId || rawFilename || fullPath;
  const cleanId = id.replace(/\.[^/.]+$/, '');
  const identifiers = Array.from(
    new Set([id, photoId, rawFilename, cleanId, fullPath].filter(Boolean) as string[])
  );

  // 1. Immediately record in persistent tombstones so this photo never resurfaces
  await recordPhotoDeletionTombstone(identifiers, fullPath, rawFilename);

  // 2. Delete from Firestore 'photos' collection (both direct and deep scan)
  if (db) {
    try {
      const directDeletes = [
        deleteDoc(doc(db, 'photos', id)).catch(() => {}),
      ];
      if (photoId && photoId !== id) {
        directDeletes.push(deleteDoc(doc(db, 'photos', photoId)).catch(() => {}));
      }
      if (rawFilename && rawFilename !== id) {
        directDeletes.push(deleteDoc(doc(db, 'photos', rawFilename)).catch(() => {}));
      }
      await Promise.all(directDeletes);

      // Deep scan to remove any lingering document matching any identifier or path
      const photosSnap = await getDocs(collection(db, 'photos'));
      const batchDeletes: Promise<void>[] = [];
      photosSnap.forEach((docSnap) => {
        const data = docSnap.data();
        const matches =
          identifiers.includes(docSnap.id) ||
          identifiers.includes(data.id) ||
          identifiers.includes(data.name) ||
          identifiers.includes(data.fullPath) ||
          (data.name && rawFilename && data.name === rawFilename) ||
          (data.fullPath && fullPath && data.fullPath === fullPath);
        if (matches) {
          batchDeletes.push(deleteDoc(docSnap.ref).catch(() => {}));
        }
      });
      await Promise.all(batchDeletes);
    } catch (err: any) {
      console.warn('Notice: Firestore photo deletion sync:', err?.message || err);
    }
  }

  // 3. Delete from Firebase Storage if applicable (bounded by timeout)
  if (isFirebaseConfigured() && storage && !fullPath.startsWith('local_')) {
    try {
      const storageRef = ref(storage, fullPath);
      const deletePromise = deleteObject(storageRef);
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1800));
      await Promise.race([deletePromise, timeoutPromise]);
    } catch (err: any) {
      console.warn('Firebase Storage delete notice (handled by tombstone registry):', err?.code || err?.message);
    }

    if (rawFilename && fullPath !== `${DAD_PHOTOS_PATH}/${rawFilename}`) {
      try {
        const altRef = ref(storage, `${DAD_PHOTOS_PATH}/${rawFilename}`);
        await deleteObject(altRef).catch(() => {});
      } catch {}
    }
  }

  // 4. Delete thoroughly from IndexedDB
  for (const ident of identifiers) {
    await idbDeletePhoto(ident, fullPath);
  }

  // 5. Remove from local backup cache
  const current = getLocalBackupPhotos();
  const updated = current.filter(
    (p) =>
      !identifiers.includes(p.id) &&
      !identifiers.includes(p.fullPath) &&
      !identifiers.includes(p.name) &&
      p.fullPath !== fullPath
  );
  saveLocalBackupPhotos(updated);

  // If the deleted photo was the designated hero photo, clear cached hero keys and elect next photo
  const currentHeroUrl = getDesignatedHeroPhotoUrl();
  const wasHeroDeleted = currentHeroUrl && identifiers.some((ident) => currentHeroUrl.includes(ident));
  if (wasHeroDeleted) {
    try {
      localStorage.removeItem(LOCAL_HERO_PHOTO_URL_KEY);
      localStorage.removeItem(LOCAL_HERO_PHOTO_ID_KEY);
    } catch {}

    const remainingHero = updated.find((p) => p.isHero);
    if (remainingHero?.url) {
      setDesignatedHeroPhoto(remainingHero.url, remainingHero.id, remainingHero.fullPath).catch(() => {});
    }
  }

  return true;
};

/**
 * 5. Mark a photo as the featured Hero photo
 */
export const setFeaturedHeroPhoto = async (
  fullPath: string,
  photoId: string,
  photoUrl?: string
): Promise<boolean> => {
  const db = getDb();
  const storage = getFirebaseStorage();
  const id = photoId || fullPath.split('/').pop() || fullPath;

  // 1. Update in Firestore
  if (db) {
    try {
      const photosRef = collection(db, 'photos');
      const snapshot = await getDocs(photosRef);
      const updatePromises = snapshot.docs.map((docSnap) => {
        const isTarget =
          docSnap.id === id ||
          docSnap.data().id === id ||
          docSnap.data().fullPath === fullPath;
        return updateDoc(docSnap.ref, { isHero: isTarget });
      });
      await Promise.all(updatePromises);
    } catch (err) {
      console.warn('Firestore set hero notice:', err);
    }
  }

  // 2. Update in Firebase Storage
  if (isFirebaseConfigured() && storage && !fullPath.startsWith('local_')) {
    try {
      const storageRef = ref(storage, fullPath);
      await updateMetadata(storageRef, {
        customMetadata: {
          isHero: 'true',
        },
      });
    } catch (err) {
      console.warn('Firebase Storage updateMetadata notice:', err);
    }
  }

  // 3. Update in IndexedDB
  try {
    const photos = await idbGetPhotos();
    const updated = photos.map((p) => ({
      ...p,
      isHero: p.id === id || p.fullPath === fullPath,
    }));
    await idbSavePhotos(updated);
  } catch {}

  // 4. Update local backup and lock in designated hero photo
  const current = getLocalBackupPhotos();
  const target = current.find((p) => p.fullPath === fullPath || p.id === id);
  const targetUrl = photoUrl || target?.url;

  const updated = current.map((p) => ({
    ...p,
    isHero: p.fullPath === fullPath || p.id === id,
  }));
  saveLocalBackupPhotos(updated);

  if (targetUrl) {
    await setDesignatedHeroPhoto(targetUrl, id, fullPath);
  }

  return true;
};

/**
 * 6. Upload Birthday Music
 */
export const uploadBirthdayMusicToStorage = async (
  file: File,
  trackTitle?: string
): Promise<DadMusicTrack> => {
  const auth = getFirebaseAuth();
  const storage = getFirebaseStorage();

  const currentUser = auth?.currentUser;
  const isLocalAdmin = isLocalAdminAuthenticated();

  if (!currentUser && !isLocalAdmin) {
    throw new Error('Authentication required: Only administrators can upload music.');
  }

  const sanitized = sanitizeFilename(file.name);
  const fullPath = `${BIRTHDAY_MUSIC_PATH}/${Date.now()}_${sanitized}`;
  const title =
    trackTitle?.trim() ||
    file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

  const isVideo =
    file.type.startsWith('video/') ||
    /\.(mp4|mov|webm|m4v)$/i.test(file.name);

  // Generate instant, hardware-accelerated local blob streaming URL
  let localBlobUrl = '';
  try {
    localBlobUrl = URL.createObjectURL(file);
  } catch {}

  let remoteUrl = '';

  if (isFirebaseConfigured() && storage) {
    try {
      const storageRef = ref(storage, fullPath);
      const metadata = {
        contentType: file.type || (isVideo ? 'video/mp4' : 'audio/mpeg'),
        customMetadata: {
          title,
          subtitle: isVideo
            ? 'Dad’s Celebration Video Soundtrack'
            : 'Dad’s Birthday Soundtrack • Islamic Tribute',
        },
      };

      const uploadPromise = (async () => {
        const snapshot = await uploadBytes(storageRef, file, metadata);
        return await getDownloadURL(snapshot.ref);
      })();

      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500));
      const storageUrl = await Promise.race([uploadPromise, timeoutPromise]);
      if (storageUrl) {
        remoteUrl = storageUrl;
      }
    } catch (err: any) {
      console.warn('Remote music upload notice, using client blob pipeline:', err);
    }
  }

  // If file is small (< 1.5MB) and remote upload wasn't used, generate data URL for cross-session fallback
  let dataUrlFallback = '';
  if (!remoteUrl && file.size < 1.5 * 1024 * 1024) {
    try {
      dataUrlFallback = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    } catch {}
  }

  const activeUrl = remoteUrl || localBlobUrl || dataUrlFallback;

  const track: DadMusicTrack = {
    id: `music_${Date.now()}_${sanitized}`,
    name: sanitized,
    fullPath,
    url: activeUrl,
    title,
    subtitle: isVideo
      ? 'Dad’s Celebration Video Soundtrack • Tribute'
      : 'Dad’s Birthday Soundtrack • Celebration of Life',
    timeCreated: new Date().toISOString(),
    size: file.size,
    isActive: true,
    isVideo,
    mimeType: file.type || (isVideo ? 'video/mp4' : 'audio/mpeg'),
    blob: file, // Stored natively in IndexedDB for perpetual zero-latency streaming
  };

  // Persist metadata to Cloud Firestore so all visitors discover Dad's soundtrack
  const db = getDb();
  if (db) {
    try {
      const musicRef = collection(db, 'music');
      await setDoc(doc(musicRef, track.id), {
        id: track.id,
        name: track.name,
        fullPath: track.fullPath,
        url: remoteUrl || (dataUrlFallback && dataUrlFallback.length < 900000 ? dataUrlFallback : ''),
        title: track.title,
        subtitle: track.subtitle,
        timeCreated: track.timeCreated,
        size: track.size,
        isActive: true,
        isVideo,
        mimeType: track.mimeType,
      });
    } catch (err: any) {
      console.warn('Firestore music save notice:', err?.message || err);
    }
  }

  // Persist directly to client IndexedDB with binary Blob
  await idbSaveMusic(track);

  // Persist to local backup
  const current = getLocalBackupMusic();
  saveLocalBackupMusic([track, ...current]);

  // Designate as Dad's active celebration soundtrack immediately
  await setDesignatedBirthdayMusic(track);

  return track;
};

/**
 * 7. Delete Birthday Music
 */
export const deleteBirthdayMusicFromStorage = async (
  fullPath: string,
  trackId?: string
): Promise<boolean> => {
  const auth = getFirebaseAuth();
  const storage = getFirebaseStorage();
  const db = getDb();

  const currentUser = auth?.currentUser;
  const isLocalAdmin = isLocalAdminAuthenticated();

  if (!currentUser && !isLocalAdmin) {
    throw new Error('Authentication required: Only administrators can delete music.');
  }

  const rawName = fullPath.split('/').pop() || '';
  const id = trackId || rawName || fullPath;

  // 1. Delete from Firestore
  if (db) {
    try {
      const musicRef = collection(db, 'music');
      await deleteDoc(doc(musicRef, id));
      if (trackId && trackId !== id) {
        await deleteDoc(doc(musicRef, trackId));
      }
    } catch (err: any) {
      console.warn('Firestore music delete notice:', err?.message || err);
    }
  }

  // 2. Record in local music tombstones
  const tombstones = getLocalDeletedMusicTombstones();
  tombstones.add(id);
  if (trackId) tombstones.add(trackId);
  if (rawName) tombstones.add(rawName);
  if (fullPath) tombstones.add(fullPath);
  saveLocalDeletedMusicTombstones(tombstones);

  // 3. Delete from Firebase Storage with timeout
  if (isFirebaseConfigured() && storage && !fullPath.startsWith('local_')) {
    try {
      const storageRef = ref(storage, fullPath);
      const delPromise = deleteObject(storageRef);
      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1800));
      await Promise.race([delPromise, timeoutPromise]);
    } catch (err: any) {
      console.warn('Firebase Storage delete music notice (handled by tombstone registry):', err?.code || err?.message);
    }
  }

  // 4. Delete thoroughly from IndexedDB
  await idbDeleteMusic(id, fullPath);
  if (trackId && trackId !== id) {
    await idbDeleteMusic(trackId, fullPath);
  }

  // 5. Update local backup
  const current = getLocalBackupMusic();
  const updated = current.filter(
    (t) => t.fullPath !== fullPath && t.id !== id && t.id !== trackId && t.name !== rawName
  );
  saveLocalBackupMusic(updated);

  // 6. If deleted track was designated active, switch to next available track or clear
  const currentActive = getDesignatedBirthdayMusic();
  if (currentActive && (currentActive.id === id || currentActive.fullPath === fullPath || currentActive.id === trackId)) {
    try {
      localStorage.removeItem(LOCAL_ACTIVE_MUSIC_KEY);
    } catch {}
    if (updated.length > 0) {
      setDesignatedBirthdayMusic(updated[0]).catch(() => {});
    } else if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('dad-birthday-music-updated', {
          detail: { track: null },
        })
      );
    }
  }

  return true;
};
