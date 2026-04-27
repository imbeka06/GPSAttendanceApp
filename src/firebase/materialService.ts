/**
 * materialService.ts
 * Handles file uploads to Firebase Storage and metadata writes to Firestore.
 *
 * Firestore structure:
 *  units/{unitId}/materials/{materialId}
 *    title, type ('pdf'|'docx'|'pptx'|'link'), url, mimeType,
 *    uploadedBy, uploaderName, uploadedAt
 *
 * Firebase Storage path:
 *  materials/{unitId}/{timestamp}_{filename}
 */
import {
    addDoc,
    collection,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { db, storage } from './config';

// ─── Types ────────────────────────────────────────────────────────────────────

export type MaterialType = 'pdf' | 'docx' | 'pptx' | 'link';

export interface Material {
  id: string;
  title: string;
  type: MaterialType;
  url: string;
  mimeType: string;
  uploadedBy: string;
  uploaderName: string;
  uploadedAt: string;
}

/** Allowed MIME types for file uploads */
export const ALLOWED_MIME_TYPES: Record<string, MaterialType> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword': 'docx',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/vnd.ms-powerpoint': 'pptx',
};

// ─── Upload a file to Firebase Storage then save metadata ────────────────────

export async function uploadMaterial(params: {
  unitId: string;
  title: string;
  mimeType: string;
  fileUri: string;
  fileName: string;
  uploadedBy: string;
  uploaderName: string;
  onProgress?: (pct: number) => void;
}): Promise<void> {
  const { unitId, title, mimeType, fileUri, fileName, uploadedBy, uploaderName, onProgress } = params;

  // MIME type validation
  const materialType = ALLOWED_MIME_TYPES[mimeType];
  if (!materialType) {
    throw new Error(
      'Unsupported file type. Only PDF, DOCX, and PPTX files are allowed.'
    );
  }

  // Fetch the file as a Blob from its local URI
  const response = await fetch(fileUri);
  const blob = await response.blob();

  // Upload to Firebase Storage
  const timestamp = Date.now();
  const storageRef = ref(storage, `materials/${unitId}/${timestamp}_${fileName}`);

  await new Promise<void>((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, blob, { contentType: mimeType });
    task.on(
      'state_changed',
      (snapshot) => {
        if (onProgress) {
          onProgress(
            Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
          );
        }
      },
      reject,
      async () => {
        const downloadURL = await getDownloadURL(task.snapshot.ref);
        // Save metadata to Firestore
        await addDoc(collection(db, 'units', unitId, 'materials'), {
          title,
          type: materialType,
          url: downloadURL,
          mimeType,
          uploadedBy,
          uploaderName,
          uploadedAt: serverTimestamp(),
        });
        resolve();
      }
    );
  });
}

// ─── Save a link (no file upload needed) ─────────────────────────────────────

export async function uploadLink(params: {
  unitId: string;
  title: string;
  url: string;
  uploadedBy: string;
  uploaderName: string;
}): Promise<void> {
  const { unitId, title, url, uploadedBy, uploaderName } = params;

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    throw new Error('Please enter a valid URL starting with http:// or https://');
  }

  await addDoc(collection(db, 'units', unitId, 'materials'), {
    title,
    type: 'link' as MaterialType,
    url,
    mimeType: 'text/uri-list',
    uploadedBy,
    uploaderName,
    uploadedAt: serverTimestamp(),
  });
}

// ─── Real-time listener for materials in a unit ───────────────────────────────

export function listenToMaterials(
  unitId: string,
  onChange: (materials: Material[]) => void
) {
  const q = query(
    collection(db, 'units', unitId, 'materials'),
    orderBy('uploadedAt', 'desc')
  );

  return onSnapshot(q, (snap) => {
    const materials: Material[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        title: data.title,
        type: data.type as MaterialType,
        url: data.url,
        mimeType: data.mimeType,
        uploadedBy: data.uploadedBy,
        uploaderName: data.uploaderName,
        uploadedAt: data.uploadedAt?.toDate
          ? data.uploadedAt.toDate().toLocaleDateString([], {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
          : '—',
      };
    });
    onChange(materials);
  });
}
