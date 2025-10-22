'use client';

import { useState, useEffect } from 'react';
import { onSnapshot, type Query, type DocumentData } from 'firebase/firestore';

export const useCollection = <T extends DocumentData>(query: Query<DocumentData> | null) => {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query) {
      setData([]);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(query, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
      setData(docs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching collection:", error);
      setData([]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [query ? query.toString() : 'null']);

  return { data, loading };
};
