'use client';

import { useState, useEffect } from 'react';
import { onSnapshot, query, collection, where, type Query, type DocumentData } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';

export const useCollection = <T extends DocumentData>(path: string, ...queryConstraints: any[]) => {
  const firestore = useFirestore();
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firestore) return;

    const collectionRef = collection(firestore, path);
    const q = query(collectionRef, ...queryConstraints);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
      setData(docs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching collection:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [firestore, path, ...queryConstraints.map(c => c.toString())]);

  return { data, loading };
};
