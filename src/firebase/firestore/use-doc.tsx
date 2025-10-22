'use client';

import { useState, useEffect, useMemo } from 'react';
import { doc, onSnapshot, type DocumentReference, type DocumentData } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';

// This hook can now accept either a string path or a DocumentReference
export const useDoc = <T extends DocumentData>(pathOrRef: string | DocumentReference | null) => {
  const firestore = useFirestore();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  // Memoize the document reference to prevent unnecessary re-renders
  const docRef = useMemo(() => {
    if (!firestore || !pathOrRef) return null;
    return typeof pathOrRef === 'string' ? doc(firestore, pathOrRef) : pathOrRef;
  }, [firestore, pathOrRef]);

  useEffect(() => {
    if (!docRef) {
      setLoading(false);
      setData(null);
      return;
    }

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setData({ id: docSnap.id, ...docSnap.data() } as T);
      } else {
        setData(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching document:", error);
      setLoading(false);
      setData(null);
    });

    return () => unsubscribe();
  }, [docRef]); // Effect now depends on the memoized docRef

  return { data, loading };
};
