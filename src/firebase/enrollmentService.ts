/**
 * enrollmentService.ts
 * Manages the many-to-many relationship between students and units.
 *
 * Firestore structure:
 *  enrollments/{enrollmentId}
 *    studentUid, registrationNumber, unitId, unitCode, unitName, enrolledAt
 *
 * Students self-enrol using a unit's joinCode.
 * Access control: Firestore Security Rules enforce that only enrolled students
 *   can read materials for a unit (server-side). This service also checks
 *   enrollment client-side before rendering the materials screen.
 */
import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    query,
    serverTimestamp,
    setDoc,
    where,
} from 'firebase/firestore';
import { db } from './config';

export interface Enrollment {
  id: string;
  studentUid: string;
  registrationNumber: string;
  unitId: string;
  unitCode: string;
  unitName: string;
  enrolledAt: string;
}

// ─── Student: join a unit via join code ───────────────────────────────────────

export async function joinUnitByCode(params: {
  joinCode: string;
  studentUid: string;
  registrationNumber: string;
}): Promise<{ unitId: string; unitName: string; unitCode: string }> {
  const { joinCode, studentUid, registrationNumber } = params;

  // 1. Find the unit with this join code
  const unitSnap = await getDocs(
    query(collection(db, 'units'), where('joinCode', '==', joinCode.toUpperCase()))
  );

  if (unitSnap.empty) {
    throw new Error('Invalid join code. Please check and try again.');
  }

  const unitDoc = unitSnap.docs[0];
  const unitData = unitDoc.data();
  const unitId = unitDoc.id;

  // 2. Check if already enrolled (predictable doc ID: studentUid_unitId)
  const enrollmentId = `${studentUid}_${unitId}`;
  const existing = await getDocs(
    query(
      collection(db, 'enrollments'),
      where('studentUid', '==', studentUid),
      where('unitId', '==', unitId)
    )
  );

  if (!existing.empty) {
    throw new Error(`You are already enrolled in ${unitData.code} — ${unitData.name}.`);
  }

  // 3. Create enrollment record with predictable ID so Firestore rules can exists() check it
  await setDoc(doc(db, 'enrollments', enrollmentId), {
    studentUid,
    registrationNumber,
    unitId,
    unitCode: unitData.code,
    unitName: unitData.name,
    enrolledAt: serverTimestamp(),
  });

  return { unitId, unitName: unitData.name, unitCode: unitData.code };
}

// ─── Student: leave/remove a unit from their list ────────────────────────────

export async function leaveUnit(
  studentUid: string,
  unitId: string
): Promise<void> {
  await deleteDoc(doc(db, 'enrollments', `${studentUid}_${unitId}`));
}

// ─── Check if a student is enrolled in a specific unit ────────────────────────

export async function isStudentEnrolled(
  studentUid: string,
  unitId: string
): Promise<boolean> {
  const { getDoc } = await import('firebase/firestore');
  const snap = await getDoc(doc(db, 'enrollments', `${studentUid}_${unitId}`));
  return snap.exists();
}
