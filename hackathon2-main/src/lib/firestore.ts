import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  DocumentData,
  Firestore,
  WithFieldValue,
  serverTimestamp
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export interface Subject extends DocumentData {
  id: string;
  name: string;
  attended: number;
  missed: number;
  userId: string;
}

const SUBJECTS_COLLECTION = 'subjects';

export function addSubject(firestore: Firestore, subject: WithFieldValue<Omit<Subject, 'id'>>) {
  const subjectWithTimestamp = {
    ...subject,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  addDoc(collection(firestore, SUBJECTS_COLLECTION), subjectWithTimestamp)
  .catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: SUBJECTS_COLLECTION,
        operation: 'create',
        requestResourceData: subjectWithTimestamp,
      });
      errorEmitter.emit('permission-error', permissionError);
    });
}

export function updateSubjectCount(
  firestore: Firestore,
  subjectId: string,
  field: 'attended' | 'missed',
  count: number
) {
  const subjectRef = doc(firestore, SUBJECTS_COLLECTION, subjectId);
  const updateData = { [field]: count, updatedAt: serverTimestamp() };
  updateDoc(subjectRef, updateData)
  .catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: subjectRef.path,
        operation: 'update',
        requestResourceData: updateData,
      });
      errorEmitter.emit('permission-error', permissionError);
    });
}

export function removeSubject(firestore: Firestore, subjectId: string) {
  const subjectRef = doc(firestore, SUBJECTS_COLLECTION, subjectId);
  deleteDoc(subjectRef)
  .catch(async (serverError) => {
      const permissionError = new FirestorePermissionError({
        path: subjectRef.path,
        operation: 'delete',
      });
      errorEmitter.emit('permission-error', permissionError);
    });
}
