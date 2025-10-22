'use client';

import { useState, useEffect } from 'react';
import { doc, onSnapshot, type DocumentReference, type DocumentData } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';

export const useDoc = <T extends DocumentData>(pathOrRef: string | DocumentReference | null) => {
  const firestore = useFirestore();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firestore || !pathOrRef) {
      setLoading(false);
      setData(null);
      return;
    }

    const docRef = typeof pathOrRef === 'string' ? doc(firestore, pathOrRef) : pathOrRef;

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
    });

    return () => unsubscribe();
  }, [firestore, pathOrRef]);

  return { data, loading };
};
