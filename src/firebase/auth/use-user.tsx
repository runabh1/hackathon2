'use client';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, signInAnonymously, type User } from 'firebase/auth';
import { useAuth } from '@/firebase/provider';
import { useMockAuth } from '@/hooks/use-mock-auth';

export const useUser = () => {
  const auth = useAuth();
  const { user: mockUser, loading: mockLoading } = useMockAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setLoading(false);
      } else if (mockUser) {
        // This is a bridge for the mock auth to work with Firebase rules.
        // It's not a real anonymous user in the Firebase sense, but
        // it allows us to have a UID for Firestore rules.
        setUser({
          uid: mockUser.uid,
          isAnonymous: true,
          // Add other required User properties as needed, with mock values
          email: mockUser.email,
          displayName: mockUser.name,
          photoURL: mockUser.avatarUrl,
          providerId: 'mock',
          emailVerified: true,
          tenantId: null,
          providerData: [],
          getIdToken: async () => 'mock-token',
          getIdTokenResult: async () => ({ token: 'mock-token', expirationTime: '', authTime: '', issuedAtTime: '', signInProvider: null, signInSecondFactor: null, claims: {} }),
          reload: async () => {},
          delete: async () => {},
          toJSON: () => ({}),
        } as User);
        setLoading(false);
      } else {
        // If no mock user and no firebase user, sign in anonymously
        signInAnonymously(auth).catch((error) => {
          console.error("Anonymous sign-in failed:", error);
          setLoading(false);
        });
      }
    });

    return () => unsubscribe();
  }, [auth, mockUser]);

  return { user, loading: loading || mockLoading };
};
