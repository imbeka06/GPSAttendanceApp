/**
 * authService.ts
 * Wraps Firebase Auth so the rest of the app never imports firebase/auth directly.
 */
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './config';

export type UserRole = 'student' | 'lecturer';

export interface AppUser {
  uid: string;
  email: string;
  role: UserRole;
  displayName: string;
}

/**
 * Sign in and return the AppUser (includes role from Firestore).
 * Throws a user-friendly error string on failure.
 */
export async function signIn(email: string, password: string): Promise<AppUser> {
  let credential;
  try {
    credential = await signInWithEmailAndPassword(auth, email, password);
  } catch (err: any) {
    // Translate Firebase error codes into readable messages
    switch (err.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        throw new Error('Invalid email or password.');
      case 'auth/too-many-requests':
        throw new Error('Too many attempts. Please wait and try again.');
      default:
        throw new Error('Login failed. Check your internet connection.');
    }
  }

  // Fetch role from Firestore /users/{uid}
  const userDoc = await getDoc(doc(db, 'users', credential.user.uid));
  if (!userDoc.exists()) {
    await firebaseSignOut(auth);
    throw new Error('Account not found in the system. Contact admin.');
  }

  const data = userDoc.data();
  return {
    uid: credential.user.uid,
    email: credential.user.email ?? email,
    role: data.role as UserRole,
    displayName: data.displayName ?? email,
  };
}

/** Sign the current user out of Firebase Auth. */
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

/**
 * Subscribe to auth state changes.
 * Returns the unsubscribe function (call it in useEffect cleanup).
 */
export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
