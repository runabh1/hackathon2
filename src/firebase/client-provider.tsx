'use client';

import { useEffect, useState } from 'react';
import { initializeFirebase, FirebaseProvider } from '@/firebase';

export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
  const [firebase, setFirebase] = useState<ReturnType<typeof initializeFirebase> | null>(
    null
  );

  useEffect(() => {
    const firebaseInstances = initializeFirebase();
    setFirebase(firebaseInstances);
  }, []);

  if (!firebase) {
    // You can return a loader here if you'd like
    return null; 
  }

  return (
    <FirebaseProvider
      firebaseApp={firebase.firebaseApp}
      auth={firebase.auth}
      firestore={firebase.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
