/**
 * attendanceService.ts
 * All Firestore reads/writes for attendance sessions and records.
 *
 * Firestore structure:
 *  sessions/{sessionId}
 *    unitId, unitCode, unitName, classLat, classLon,
 *    lecturerId, lecturerName, startedAt (Timestamp), active (bool)
 *
 *  sessions/{sessionId}/records/{studentUid}
 *    studentUid, studentName, studentEmail,
 *    markedAt (Timestamp), distanceMeters (number)
 */
import {
    addDoc,
    collection,
    doc,
    onSnapshot,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where,
} from 'firebase/firestore';
import { db } from './config';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ActiveSession {
  id: string;
  unitId: string;
  unitCode: string;
  unitName: string;
  classLat: number;
  classLon: number;
  lecturerId: string;
  lecturerName: string;
  startedAt: string;
  active: boolean;
}

// ─── Lecturer: start / end ────────────────────────────────────────────────────

export async function startAttendanceSession(params: {
  unitId: string;
  unitCode: string;
  unitName: string;
  classLat: number;
  classLon: number;
  lecturerId: string;
  lecturerName: string;
}): Promise<string> {
  const ref = await addDoc(collection(db, 'sessions'), {
    ...params,
    startedAt: serverTimestamp(),
    active: true,
  });
  return ref.id;
}

export async function endAttendanceSession(sessionId: string): Promise<void> {
  await updateDoc(doc(db, 'sessions', sessionId), { active: false });
}

// ─── Lecturer: real-time listener for their own active sessions ───────────────

export function listenToLecturerActiveSession(
  lecturerId: string,
  onChange: (session: ActiveSession | null) => void
) {
  const q = query(
    collection(db, 'sessions'),
    where('lecturerId', '==', lecturerId),
    where('active', '==', true)
  );

  return onSnapshot(q, (snap) => {
    if (snap.empty) {
      onChange(null);
      return;
    }
    const d = snap.docs[0];
    const data = d.data();
    onChange({
      id: d.id,
      unitId: data.unitId,
      unitCode: data.unitCode,
      unitName: data.unitName,
      classLat: data.classLat,
      classLon: data.classLon,
      lecturerId: data.lecturerId,
      lecturerName: data.lecturerName,
      startedAt: data.startedAt?.toDate
        ? data.startedAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '—',
      active: true,
    });
  });
}

// ─── Student: real-time listener for any active session ──────────────────────

export function listenToAnyActiveSession(
  onChange: (session: ActiveSession | null) => void
) {
  const q = query(
    collection(db, 'sessions'),
    where('active', '==', true)
  );

  return onSnapshot(q, (snap) => {
    if (snap.empty) {
      onChange(null);
      return;
    }
    const d = snap.docs[0];
    const data = d.data();
    onChange({
      id: d.id,
      unitId: data.unitId,
      unitCode: data.unitCode,
      unitName: data.unitName,
      classLat: data.classLat,
      classLon: data.classLon,
      lecturerId: data.lecturerId,
      lecturerName: data.lecturerName,
      startedAt: data.startedAt?.toDate
        ? data.startedAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '—',
      active: true,
    });
  });
}

// ─── Student: mark attendance ─────────────────────────────────────────────────

export async function markStudentAttendance(params: {
  sessionId: string;
  studentUid: string;
  studentName: string;
  studentEmail: string;
  distanceMeters: number;
}): Promise<void> {
  // Use studentUid as the record doc ID — guarantees one record per student per session
  await setDoc(
    doc(db, 'sessions', params.sessionId, 'records', params.studentUid),
    {
      studentUid: params.studentUid,
      studentName: params.studentName,
      studentEmail: params.studentEmail,
      distanceMeters: Math.round(params.distanceMeters),
      markedAt: serverTimestamp(),
    }
  );
}

// ─── Student: check if already marked ────────────────────────────────────────

export function listenToStudentRecord(
  sessionId: string,
  studentUid: string,
  onChange: (marked: boolean) => void
) {
  const ref = doc(db, 'sessions', sessionId, 'records', studentUid);
  return onSnapshot(ref, (snap) => onChange(snap.exists()));
}
