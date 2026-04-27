/**
 * materialService.ts
 * Handles file uploads to Cloudinary and metadata writes to Firestore.
 *
 * Firestore structure:
 *  units/{unitId}/materials/{materialId}
 *    title, type ('pdf'|'docx'|'pptx'|'link'), url, mimeType,
 *    uploadedBy, uploaderName, uploadedAt
 *
 * File storage: Cloudinary (cloud name + unsigned upload preset from .env)
 */
import {
    addDoc,
    collection,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';

const CLOUDINARY_CLOUD_NAME  = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME  ?? '';
const CLOUDINARY_UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? '';
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/raw/upload`;

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

// ─── Upload a file to Cloudinary then save metadata to Firestore ─────────────

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

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error('Cloudinary is not configured. Check your .env file.');
  }

  // Build multipart form data for Cloudinary.
  // On web, fileUri is a blob: URL — fetch it to get a real Blob.
  // On native, use the { uri, type, name } RN shorthand.
  const formData = new FormData();
  if (fileUri.startsWith('blob:') || fileUri.startsWith('http')) {
    const response = await fetch(fileUri);
    const blob = await response.blob();
    formData.append('file', blob, fileName);
  } else {
    formData.append('file', { uri: fileUri, type: mimeType, name: fileName } as any);
  }
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  // Upload via XMLHttpRequest so we get progress events
  const downloadURL = await new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', CLOUDINARY_UPLOAD_URL);

    xhr.upload.onprogress = (e) => {
      if (onProgress && e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        resolve(data.secure_url as string);
      } else {
        // Surface the actual Cloudinary error message
        let msg = `Upload failed (${xhr.status}).`;
        try {
          const err = JSON.parse(xhr.responseText);
          if (err?.error?.message) msg = err.error.message;
        } catch {}
        reject(new Error(msg));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload.'));
    xhr.send(formData);
  });

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
