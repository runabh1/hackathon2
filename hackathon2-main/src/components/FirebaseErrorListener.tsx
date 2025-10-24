'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

// This component listens for Firestore permission errors and throws them
// so that the Next.js error overlay can display them during development.
export function FirebaseErrorListener() {
  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      // In a production environment, you might want to log this to a service
      if (process.env.NODE_ENV === 'development') {
        // Throwing the error will cause the Next.js development error overlay to appear
        throw error;
      } else {
        console.error(error); // Or log to a monitoring service
      }
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  return null; // This component does not render anything
}
