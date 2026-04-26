import React, { createContext, useCallback, useContext, useState } from 'react';

// --- Types ---
export interface AttendanceSession {
  unitId: string;
  unitCode: string;
  unitName: string;
  classLat: number;
  classLon: number;
  startedAt: string; // human-readable time string
}

export interface MarkedAttendance {
  unitId: string;
  unitCode: string;
  unitName: string;
  time: string;
}

interface AttendanceContextType {
  activeSession: AttendanceSession | null;
  startSession: (session: AttendanceSession) => void;
  endSession: () => void;
  markedAttendances: MarkedAttendance[];
  markAttendance: (unitId: string, unitCode: string, unitName: string) => void;
  hasMarked: (unitId: string) => boolean;
}

// --- Context ---
const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

// --- Provider ---
export function AttendanceProvider({ children }: { children: React.ReactNode }) {
  const [activeSession, setActiveSession] = useState<AttendanceSession | null>(null);
  const [markedAttendances, setMarkedAttendances] = useState<MarkedAttendance[]>([]);

  const startSession = useCallback((session: AttendanceSession) => {
    setActiveSession(session);
  }, []);

  const endSession = useCallback(() => {
    setActiveSession(null);
  }, []);

  const markAttendance = useCallback((unitId: string, unitCode: string, unitName: string) => {
    setMarkedAttendances(prev => {
      if (prev.some(m => m.unitId === unitId)) return prev; // prevent duplicates
      return [
        ...prev,
        {
          unitId,
          unitCode,
          unitName,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ];
    });
  }, []);

  const hasMarked = useCallback(
    (unitId: string) => markedAttendances.some(m => m.unitId === unitId),
    [markedAttendances]
  );

  return (
    <AttendanceContext.Provider
      value={{ activeSession, startSession, endSession, markedAttendances, markAttendance, hasMarked }}
    >
      {children}
    </AttendanceContext.Provider>
  );
}

// --- Hook ---
export function useAttendance() {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
}
