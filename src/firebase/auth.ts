import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  User,
} from 'firebase/auth';
import { getFirebaseAuth, isFirebaseConfigured } from './config';

export interface AdminAuthState {
  isAuthenticated: boolean;
  userEmail: string | null;
  isAdmin: boolean;
}

const LOCAL_ADMIN_KEY = 'tribute_admin_session_v1';
const LEGACY_STORAGE_KEY = 'local_admin_authenticated';

export const isLocalAdminAuthenticated = (): boolean => {
  try {
    const auth = getFirebaseAuth();
    if (auth?.currentUser) {
      return true;
    }
    return (
      localStorage.getItem(LOCAL_ADMIN_KEY) === 'true' ||
      localStorage.getItem(LEGACY_STORAGE_KEY) === 'true' ||
      sessionStorage.getItem(LEGACY_STORAGE_KEY) === 'true' ||
      sessionStorage.getItem(LOCAL_ADMIN_KEY) === 'true'
    );
  } catch {
    return false;
  }
};

export const setLocalAdminAuthenticated = (val: boolean): void => {
  try {
    if (val) {
      localStorage.setItem(LOCAL_ADMIN_KEY, 'true');
      localStorage.setItem(LEGACY_STORAGE_KEY, 'true');
      sessionStorage.setItem(LEGACY_STORAGE_KEY, 'true');
      sessionStorage.setItem(LOCAL_ADMIN_KEY, 'true');
    } else {
      localStorage.removeItem(LOCAL_ADMIN_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      sessionStorage.removeItem(LEGACY_STORAGE_KEY);
      sessionStorage.removeItem(LOCAL_ADMIN_KEY);
    }
  } catch (err) {
    console.warn('Error setting local admin auth:', err);
  }
};

/**
 * Sign in as administrator using Google Login (configured with Firebase Auth)
 */
export const adminGoogleLogin = async (): Promise<{ success: boolean; error?: string }> => {
  const auth = getFirebaseAuth();

  if (isFirebaseConfigured() && auth) {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
      setLocalAdminAuthenticated(true);
      return { success: true };
    } catch (err: any) {
      console.warn('Firebase Google sign-in failed:', err?.message || err);
      return { success: false, error: err?.message || 'Google sign-in could not be completed.' };
    }
  }

  setLocalAdminAuthenticated(true);
  return { success: true };
};

export const adminLogin = async (
  email: string,
  pass: string
): Promise<{ success: boolean; error?: string }> => {
  const auth = getFirebaseAuth();

  if (isFirebaseConfigured() && auth) {
    // If email is provided, try Firebase Auth email & password
    if (email.trim()) {
      try {
        await signInWithEmailAndPassword(auth, email.trim(), pass);
        setLocalAdminAuthenticated(true);
        return { success: true };
      } catch (err: any) {
        if (err.code === 'auth/user-not-found') {
          try {
            await createUserWithEmailAndPassword(auth, email.trim(), pass);
            setLocalAdminAuthenticated(true);
            return { success: true };
          } catch {
            // Ignore error and check fallback
          }
        }
      }
    }

    // Valid passcode access
    const isPasscodeValid = pass.trim() === 'admin123' || pass.trim() === 'september19';
    if (isPasscodeValid) {
      // Attempt anonymous Firebase sign-in if available so request.auth != null is populated
      try {
        if (!auth.currentUser) {
          await signInAnonymously(auth);
        }
      } catch {
        // Anonymous auth might be disabled in Firebase console, fallback to local admin session
      }
      setLocalAdminAuthenticated(true);
      return { success: true };
    }
  }

  // Fallback demo admin authentication
  if (pass.trim() === 'admin123' || pass.trim() === 'september19') {
    setLocalAdminAuthenticated(true);
    return { success: true };
  }

  return {
    success: false,
    error: 'Invalid admin credentials. Use passcode "september19" or sign in with Google.',
  };
};

export const adminLogout = async (): Promise<void> => {
  const auth = getFirebaseAuth();
  if (isFirebaseConfigured() && auth) {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('Error signing out of Firebase Auth:', err);
    }
  }
  setLocalAdminAuthenticated(false);
};

export const subscribeToAdminAuth = (
  callback: (user: User | null, isLocalAdmin: boolean) => void
): (() => void) => {
  const auth = getFirebaseAuth();

  if (isFirebaseConfigured() && auth) {
    return onAuthStateChanged(auth, (user) => {
      callback(user, isLocalAdminAuthenticated());
    });
  }

  // Initial callback for local status
  callback(null, isLocalAdminAuthenticated());
  return () => {};
};
