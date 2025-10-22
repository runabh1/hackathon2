'use client';

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  DocumentData,
  Firestore,
  WithFieldValue,
} from 'firebase/firestore';

export interface Subject extends DocumentData {
  id: string;
  name: string;
  attended: number;
  missed: number;
  userId: string;
}

const SUBJECTS_COLLECTION = 'subjects';

export async function addSubject(firestore: Firestore, subject: WithFieldValue<Omit<Subject, 'id'>>) {
  try {
    await addDoc(collection(firestore, SUBJECTS_COLLECTION), subject);
  } catch (e) {
    console.error('Error adding document: ', e);
  }
}

export async function updateSubjectCount(
  firestore: Firestore,
  subjectId: string,
  field: 'attended' | 'missed',
  count: number
) {
  const subjectRef = doc(firestore, SUBJECTS_COLLECTION, subjectId);
  try {
    await updateDoc(subjectRef, {
      [field]: count,
    });
  } catch (e) {
    console.error('Error updating document: ', e);
  }
}

export async function removeSubject(firestore: Firestore, subjectId: string) {
  try {
    await deleteDoc(doc(firestore, SUBJECTS_COLLECTION, subjectId));
  } catch (e) {
    console.error('Error deleting document: ', e);
  }
}
