import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
  onSnapshot,
} from 'firebase/firestore';
import { getDb, getFirebaseAuth, isFirebaseConfigured } from './config';
import { Wish } from '../types';
import { INITIAL_WISHES } from '../data/tributeData';

export const COLLECTION_NAME = 'wishes';
const LOCAL_STORAGE_KEY = 'tribute_wishes_backup_v2';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const auth = getFirebaseAuth();
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Helper to format Firestore server timestamps or local dates
export const formatWishDate = (dateVal: any): string => {
  if (!dateVal) return 'Just now';
  if (typeof dateVal === 'string') return dateVal;
  if (dateVal instanceof Timestamp) {
    const d = dateVal.toDate();
    return d.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }
  if (dateVal instanceof Date) {
    return dateVal.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }
  return 'September 19, 2024';
};

const getMillisFromDate = (dateVal: any): number => {
  if (!dateVal) return Date.now();
  if (dateVal instanceof Timestamp) return dateVal.toMillis();
  if (dateVal instanceof Date) return dateVal.getTime();
  if (typeof dateVal === 'string') {
    const parsed = new Date(dateVal).getTime();
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

// Local storage helper for fallback when offline or in demonstration
const getLocalWishes = (): Wish[] => {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn('Unable to read from localStorage:', err);
  }
  return [...INITIAL_WISHES];
};

const saveLocalWishes = (wishes: Wish[]): void => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(wishes));
  } catch (err) {
    console.warn('Unable to save to localStorage:', err);
  }
};

/**
 * Submit a new birthday wish to Firestore.
 * Each document in the 'wishes' collection contains:
 * - name (string)
 * - message (string)
 * - relationship (string)
 * - createdAt (Firebase server timestamp)
 * - approved (boolean, initially false)
 */
export const submitWish = async (wishData: {
  name: string;
  relationship: string;
  message: string;
}): Promise<{ success: boolean; id: string; approved: boolean; error?: string }> => {
  const db = getDb();
  // Under the hybrid moderation model, newly submitted wishes are approved: true by default
  // so they immediately display publicly on the tribute guestbook.
  const approved = true;

  if (isFirebaseConfigured() && db) {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        name: wishData.name.trim(),
        message: wishData.message.trim(),
        relationship: wishData.relationship.trim(),
        createdAt: serverTimestamp(),
        approved: true,
      });

      return { success: true, id: docRef.id, approved: true };
    } catch (err: any) {
      console.error('Error submitting wish to Firestore:', err);
      return {
        success: false,
        id: '',
        approved: false,
        error: err.message || 'Unable to submit wish to Firestore database.',
      };
    }
  }

  // Fallback to local storage
  try {
    const current = getLocalWishes();
    const newWish: Wish = {
      id: 'local_' + Date.now(),
      name: wishData.name.trim(),
      relationship: wishData.relationship.trim(),
      message: wishData.message.trim(),
      createdAt: new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }) + ' • Just Now',
      approved: true,
      reactionsCount: 1,
      badge: wishData.relationship.trim(),
    };

    const updated = [newWish, ...current];
    saveLocalWishes(updated);

    return { success: true, id: newWish.id, approved: true };
  } catch (err: any) {
    return {
      success: false,
      id: '',
      approved: false,
      error: 'Unable to save wish locally.',
    };
  }
};

/**
 * Retrieve only approved wishes from Firestore where approved == true.
 * Public visitors can only view approved == true.
 */
export const fetchApprovedWishes = async (): Promise<Wish[]> => {
  const db = getDb();

  if (isFirebaseConfigured() && db) {
    try {
      // Query documents where approved == true
      const q = query(
        collection(db, COLLECTION_NAME),
        where('approved', '==', true)
      );

      const querySnapshot = await getDocs(q);
      const fetched: (Wish & { _millis?: number })[] = [];

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const millis = getMillisFromDate(data.createdAt);
        fetched.push({
          id: docSnap.id,
          name: data.name || 'Anonymous',
          relationship: data.relationship || 'Well-wisher',
          message: data.message || '',
          createdAt: formatWishDate(data.createdAt),
          approved: true,
          reactionsCount: data.reactionsCount || 1,
          badge: data.relationship,
          _millis: millis,
        });
      });

      // Sort newest first
      fetched.sort((a, b) => (b._millis || 0) - (a._millis || 0));

      if (fetched.length > 0) {
        return fetched.map(({ _millis, ...rest }) => rest);
      }
    } catch (err) {
      console.error('Error fetching approved wishes from Firestore:', err);
    }
  }

  // Fallback to local storage (or initial starter tributes)
  const localList = getLocalWishes();
  return localList.filter((w) => w.approved);
};

/**
 * Subscribe to real-time updates for approved wishes (where approved == true).
 */
export const subscribeToApprovedWishes = (
  onWishesUpdated: (wishes: Wish[]) => void,
  onError?: (err: Error) => void
): (() => void) => {
  const db = getDb();

  if (isFirebaseConfigured() && db) {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('approved', '==', true)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list: (Wish & { _millis?: number })[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const millis = getMillisFromDate(data.createdAt);
            list.push({
              id: docSnap.id,
              name: data.name || 'Anonymous',
              relationship: data.relationship || 'Well-wisher',
              message: data.message || '',
              createdAt: formatWishDate(data.createdAt),
              approved: true,
              reactionsCount: data.reactionsCount || 1,
              badge: data.relationship,
              _millis: millis,
            });
          });

          // Sort newest first
          list.sort((a, b) => (b._millis || 0) - (a._millis || 0));

          if (list.length > 0) {
            onWishesUpdated(list.map(({ _millis, ...rest }) => rest));
          } else {
            // Show starter family wishes if Firestore has no approved wishes yet
            onWishesUpdated(INITIAL_WISHES.filter((w) => w.approved));
          }
        },
        (error) => {
          console.warn('Firestore subscription notice:', error);
          if (onError) onError(error);
          onWishesUpdated(INITIAL_WISHES.filter((w) => w.approved));
        }
      );

      return unsubscribe;
    } catch (err: any) {
      console.warn('Unable to initialize Firestore onSnapshot listener:', err);
    }
  }

  // Fallback
  onWishesUpdated(getLocalWishes().filter((w) => w.approved));
  return () => {};
};

/**
 * Retrieve all wishes (including pending where approved == false) for admin moderation.
 */
export const fetchAllWishesForAdmin = async (): Promise<Wish[]> => {
  const db = getDb();
  const auth = getFirebaseAuth();

  if (isFirebaseConfigured() && db) {
    try {
      // When authenticated in Firebase Auth, query all documents in wishes collection
      if (auth?.currentUser) {
        const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
        const fetched: (Wish & { _millis?: number })[] = [];

        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const millis = getMillisFromDate(data.createdAt);
          fetched.push({
            id: docSnap.id,
            name: data.name || '',
            relationship: data.relationship || '',
            message: data.message || '',
            createdAt: formatWishDate(data.createdAt),
            approved: Boolean(data.approved),
            reactionsCount: data.reactionsCount || 0,
            badge: data.relationship,
            _millis: millis,
          });
        });

        fetched.sort((a, b) => (b._millis || 0) - (a._millis || 0));

        if (fetched.length > 0) {
          return fetched.map(({ _millis, ...rest }) => rest);
        }
      } else {
        // When in local admin session, fetch approved wishes and merge with local moderation state
        const approvedWishes = await fetchApprovedWishes();
        const localWishes = getLocalWishes();
        const combined = [...approvedWishes];
        for (const lw of localWishes) {
          if (!combined.some((w) => w.id === lw.id)) {
            combined.push(lw);
          }
        }
        return combined;
      }
    } catch (err: any) {
      if (err?.code === 'permission-denied') {
        handleFirestoreError(err, OperationType.LIST, COLLECTION_NAME);
      }
      console.warn('Notice retrieving wishes for admin:', err?.message || err);
    }
  }

  return getLocalWishes();
};

/**
 * Admin action: Hide a wish by changing approved to false in Firestore.
 */
export const hideWish = async (wishId: string): Promise<boolean> => {
  const db = getDb();

  if (isFirebaseConfigured() && db && !wishId.startsWith('local_')) {
    try {
      const wishRef = doc(db, COLLECTION_NAME, wishId);
      await updateDoc(wishRef, { approved: false });
      return true;
    } catch (err: any) {
      if (err?.code === 'permission-denied') {
        handleFirestoreError(err, OperationType.UPDATE, `${COLLECTION_NAME}/${wishId}`);
      }
      console.error('Error hiding wish in Firestore:', err);
      throw err;
    }
  }

  // Update local storage fallback
  const current = getLocalWishes();
  const updated = current.map((w) => (w.id === wishId ? { ...w, approved: false } : w));
  saveLocalWishes(updated);
  return true;
};

/**
 * Admin action: Approve / Unhide a wish (sets approved: true in Firestore).
 */
export const approveWish = async (wishId: string): Promise<boolean> => {
  const db = getDb();

  if (isFirebaseConfigured() && db && !wishId.startsWith('local_')) {
    try {
      const wishRef = doc(db, COLLECTION_NAME, wishId);
      await updateDoc(wishRef, { approved: true });
      return true;
    } catch (err: any) {
      if (err?.code === 'permission-denied') {
        handleFirestoreError(err, OperationType.UPDATE, `${COLLECTION_NAME}/${wishId}`);
      }
      console.error('Error approving wish in Firestore:', err);
      throw err;
    }
  }

  // Update local storage fallback
  const current = getLocalWishes();
  const updated = current.map((w) => (w.id === wishId ? { ...w, approved: true } : w));
  saveLocalWishes(updated);
  return true;
};

/**
 * Admin action: Permanently delete a wish from Firestore.
 */
export const deleteWish = async (wishId: string): Promise<boolean> => {
  const db = getDb();

  if (isFirebaseConfigured() && db && !wishId.startsWith('local_')) {
    try {
      const wishRef = doc(db, COLLECTION_NAME, wishId);
      await deleteDoc(wishRef);
      return true;
    } catch (err: any) {
      if (err?.code === 'permission-denied') {
        handleFirestoreError(err, OperationType.DELETE, `${COLLECTION_NAME}/${wishId}`);
      }
      console.error('Error deleting wish from Firestore:', err);
      throw err;
    }
  }

  const current = getLocalWishes();
  const updated = current.filter((w) => w.id !== wishId);
  saveLocalWishes(updated);
  return true;
};

// Backwards compatibility alias
export const rejectOrDeleteWish = deleteWish;

/**
 * Increment or decrement wish reaction counter.
 */
export const updateWishReaction = async (wishId: string, incrementVal: number): Promise<number> => {
  let newCount = 1;

  const current = getLocalWishes();
  const updated = current.map((w) => {
    if (w.id === wishId) {
      newCount = Math.max(0, (w.reactionsCount || 0) + incrementVal);
      return { ...w, reactionsCount: newCount };
    }
    return w;
  });
  saveLocalWishes(updated);

  return newCount;
};
