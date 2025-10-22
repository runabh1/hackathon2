'use client';

import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  DocumentData,
  Firestore,
  WithFieldValue,
  serverTimestamp
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export interface StudyMaterial extends DocumentData {
  id: string;
  fileName: string;
  downloadUrl: string;
  courseId: string;
  userId: string;
}

const MATERIALS_COLLECTION = 'study_materials';

export function addMaterial(firestore: Firestore, material: WithFieldValue<Omit<StudyMaterial, 'id'>>) {
  const materialWithTimestamp = {
    ...material,
    createdAt: serverTimestamp(),
  };
  addDoc(collection(firestore, MATERIALS_COLLECTION), materialWithTimestamp)
  .catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: MATERIALS_COLLECTION,
        operation: 'create',
        requestResourceData: materialWithTimestamp,
      });
      errorEmitter.emit('permission-error', permissionError);
    });
}

export function removeMaterial(firestore: Firestore, materialId: string) {
  const materialRef = doc(firestore, MATERIALS_COLLECTION, materialId);
  deleteDoc(materialRef)
  .catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: materialRef.path,
        operation: 'delete',
      });
      errorEmitter.emit('permission-error', permissionError);
    });
}
