// src/lib/firebase/admin.ts
import { initializeApp, getApps, getApp, App, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import 'server-only';

// This is a flag to ensure we only initialize once.
let app: App | null = null;
let firestore: Firestore | null = null;

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : null;

/**
 * Returns an admin instance of the Firestore database.
 * This function ensures that Firestore is initialized only once.
 */
export function getAdminDb(): Firestore {
  if (firestore) {
    return firestore;
  }
  
  if (!serviceAccount) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not set or invalid.');
  }

  try {
    // Try to get existing app first
    app = getApp();
  } catch (error) {
    // If no app exists, initialize a new one
    app = initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id
    });
  }

  firestore = getFirestore(app);
  return firestore;
}
