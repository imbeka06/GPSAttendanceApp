/**
 * authService.ts
 * Wraps Firebase Auth so the rest of the app never imports firebase/auth directly.
 */
import {
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    User,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './config';

export type UserRole = 'student' | 'lecturer';

export interface AppUser {
  uid: string;
  email: string;
  role: UserRole;
  displayName: string;
  /** Populated for students */
  registrationNumber?: string;
  /** Populated for lecturers */
  staffId?: string;
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
    registrationNumber: data.registrationNumber ?? undefined,
    staffId: data.staffId ?? undefined,
  };
}

/** Sign the current user out of Firebase Auth. */
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export interface SignUpData {
  role: UserRole;
  displayName: string;
  email: string;
  password: string;
  registrationNumber?: string; // students
  staffId?: string;            // lecturers
}

/**
 * Create a new Firebase Auth account and write the user doc to Firestore.
 * Returns the new AppUser on success.
 */
export async function signUp(data: SignUpData): Promise<AppUser> {
  let credential;
  try {
    credential = await createUserWithEmailAndPassword(auth, data.email.trim().toLowerCase(), data.password);
  } catch (err: any) {
    switch (err.code) {
      case 'auth/email-already-in-use':
        throw new Error('An account with this email already exists.');
      case 'auth/invalid-email':
        throw new Error('Please enter a valid email address.');
      case 'auth/weak-password':
        throw new Error('Password must be at least 6 characters.');
      default:
        throw new Error('Registration failed. Check your internet connection.');
    }
  }

  const uid = credential.user.uid;
  const userDoc: Record<string, any> = {
    uid,
    email: data.email.trim().toLowerCase(),
    role: data.role,
    displayName: data.displayName.trim(),
    createdAt: new Date().toISOString(),
  };

  if (data.role === 'student' && data.registrationNumber) {
    userDoc.registrationNumber = data.registrationNumber.trim().toUpperCase();
  }
  if (data.role === 'lecturer' && data.staffId) {
    userDoc.staffId = data.staffId.trim().toUpperCase();
  }

  try {
    await setDoc(doc(db, 'users', uid), userDoc);
  } catch (err: any) {
    // Auth user was created but Firestore write failed — delete the orphan Auth account
    await credential.user.delete();
    throw new Error('Could not save your account details. Please try again.');
  }

  return {
    uid,
    email: userDoc.email,
    role: data.role,
    displayName: userDoc.displayName,
    registrationNumber: userDoc.registrationNumber,
    staffId: userDoc.staffId,
  };
}

/**
 * Subscribe to auth state changes.
 * Returns the unsubscribe function (call it in useEffect cleanup).
 */
export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
