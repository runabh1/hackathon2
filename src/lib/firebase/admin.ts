// src/lib/firebase/admin.ts
import 'dotenv/config'; // Ensure env vars are loaded
import { initializeApp, getApps, cert, type App, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

// Define a type for our singleton cache
interface FirebaseAdminSingleton {
  app: App;
  db: Firestore;
}

// Use a global symbol to store the singleton instance to avoid issues with module caching in serverless environments.
const FB_ADMIN_SINGLETON_KEY = Symbol.for('firebase.admin.singleton');

// Extend the NodeJS.Global interface to declare our symbol
declare global {
  var [FB_ADMIN_SINGLETON_KEY]: FirebaseAdminSingleton | undefined;
}

function initializeAdminApp(): FirebaseAdminSingleton {
  // If the singleton is already cached, return it.
  if (global[FB_ADMIN_SINGLETON_KEY]) {
    return global[FB_ADMIN_SINGLETON_KEY]!;
  }
  
  const existingApps = getApps();
  if (existingApps.length > 0) {
      // This case might happen in some environments, though less likely with the global symbol approach.
      const app = existingApps[0];
      const db = getFirestore(app);
      const singleton = { app, db };
      global[FB_ADMIN_SINGLETON_KEY] = singleton;
      return singleton;
  }

  // This block will only run ONCE per cold start.
  let serviceAccount: ServiceAccount;
  try {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
      throw new Error('CRITICAL: FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set or empty.');
    }
    serviceAccount = JSON.parse(serviceAccountKey);
  } catch (e: any) {
    console.error("FATAL: Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY. Make sure it's a valid JSON string.", e.message);
    throw new Error("Firebase Admin SDK initialization failed due to invalid service account key.");
  }

  try {
    const app = initializeApp({
      credential: cert(serviceAccount),
    });
    const db = getFirestore(app);
    const singleton: FirebaseAdminSingleton = { app, db };
    
    // Cache the singleton instance globally.
    global[FB_ADMIN_SINGLETON_KEY] = singleton;
    return singleton;

  } catch (e: any) {
    console.error("FATAL: Failed to initialize Firebase Admin App.", e.message);
    throw new Error("Firebase Admin SDK could not be initialized.");
  }
}

// Export a single getter function for the Firestore database instance.
export function getAdminDb(): Firestore {
  return initializeAdminApp().db;
}
