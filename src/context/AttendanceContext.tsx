/**
 * AttendanceContext.tsx
 *
 * Holds two pieces of global state:
 *  1. The currently signed-in AppUser (from Firebase Auth)
 *  2. The active attendance session (from Firestore, real-time)
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthChange } from '../firebase/authService';
import { ActiveSession } from '../firebase/attendanceService';
import type { AppUser } from '../firebase/authService';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AttendanceContextType {
  // Auth
  currentUser: AppUser | null;
  authLoading: boolean;
  setCurrentUser: (user: AppUser | null) => void;

  // Active session (set by the relevant dashboard via Firestore listeners)
  activeSession: ActiveSession | null;
  setActiveSession: (session: ActiveSession | null) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AttendanceProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);

  // Listen for Firebase Auth state changes (handles app re-opens, token refresh)
  useEffect(() => {
    const unsubscribe = onAuthChange((firebaseUser) => {
      if (!firebaseUser) {
        setCurrentUser(null);
        setActiveSession(null);
      }
      // If firebaseUser exists but currentUser is null (e.g. app reload),
      // the login screen will repopulate currentUser via signIn().
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AttendanceContext.Provider
      value={{
        currentUser,
        authLoading,
        setCurrentUser,
        activeSession,
        setActiveSession,
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAttendance() {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
}

