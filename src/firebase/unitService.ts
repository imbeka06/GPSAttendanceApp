/**
 * unitService.ts
 * Firestore reads/writes for academic units (courses).
 *
 * Firestore structure:
 *  units/{unitId}
 *    code, name, lecturerId, lecturerName, joinCode, createdAt
 */
import {
    addDoc,
    collection,
    doc,
    onSnapshot,
    query,
    serverTimestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import { db } from './config';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Unit {
  id: string;
  code: string;
  name: string;
  lecturerId: string;
  lecturerName: string;
  /** Short alphanumeric code students use to self-enrol */
  joinCode: string;
  createdAt: string;
  /** True when the lecturer has soft-deleted the unit */
  archivedByLecturer?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateJoinCode(): string {
  // 8 alphanumeric chars (letters + digits), minimum length
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ─── Lecturer: create a unit ──────────────────────────────────────────────────

export async function createUnit(params: {
  code: string;
  name: string;
  lecturerId: string;
  lecturerName: string;
}): Promise<string> {
  const ref = await addDoc(collection(db, 'units'), {
    ...params,
    joinCode: generateJoinCode(),
    archivedByLecturer: false,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

// ── Lecturer: soft-delete a unit (students keep access for revision) ──────────

export async function deleteUnit(unitId: string): Promise<void> {
  await updateDoc(doc(db, 'units', unitId), { archivedByLecturer: true });
}

// ─── Lecturer: update unit details ────────────────────────────────────────────

export async function updateUnit(
  unitId: string,
  updates: Partial<Pick<Unit, 'code' | 'name'>>
): Promise<void> {
  await updateDoc(doc(db, 'units', unitId), updates);
}

// ─── Lecturer: real-time listener for their own units ─────────────────────────

export function listenToLecturerUnits(
  lecturerId: string,
  onChange: (units: Unit[]) => void
) {
  const q = query(
    collection(db, 'units'),
    where('lecturerId', '==', lecturerId)
  );
  return onSnapshot(q, (snap) => {
    const units: Unit[] = snap.docs
      .filter((d) => !d.data().archivedByLecturer)
      .map((d) => {
      const data = d.data();
      return {
        id: d.id,
        code: data.code,
        name: data.name,
        lecturerId: data.lecturerId,
        lecturerName: data.lecturerName,
        joinCode: data.joinCode,
        createdAt: data.createdAt?.toDate
          ? data.createdAt.toDate().toLocaleDateString()
          : '—',
      };
    });
    onChange(units);
  });
}

// ─── Student: real-time listener for enrolled units ───────────────────────────

export function listenToStudentUnits(
  studentUid: string,
  onChange: (units: Unit[]) => void
) {
  const enrollQ = query(
    collection(db, 'enrollments'),
    where('studentUid', '==', studentUid)
  );

  return onSnapshot(enrollQ, async (enrollSnap) => {
    if (enrollSnap.empty) {
      onChange([]);
      return;
    }
    const unitIds = enrollSnap.docs.map((d) => d.data().unitId as string);

    // Fetch each unit document individually (avoids documentId() 'in' complexity)
    const { getDoc, doc: docRef } = await import('firebase/firestore');
    const unitPromises = unitIds.map((id) => getDoc(docRef(db, 'units', id)));
    const unitDocs = await Promise.all(unitPromises);

    const results: Unit[] = unitDocs
      .filter((d) => d.exists())
      .map((d) => {
        const data = d.data()!;
        return {
          id: d.id,
          code: data.code,
          name: data.name,
          lecturerId: data.lecturerId,
          lecturerName: data.lecturerName,
          joinCode: data.joinCode,
          createdAt: data.createdAt?.toDate
            ? data.createdAt.toDate().toLocaleDateString()
            : '—',
        };
      });

    onChange(results);
  });
}
