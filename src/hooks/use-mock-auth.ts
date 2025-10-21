
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export type MockUser = {
  email: string;
  name: string;
  avatarUrl: string;
};

const MOCK_USER_STORAGE_KEY = 'mentor-ai-user';

export function useMockAuth() {
  const [user, setUser] = useState<MockUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(MOCK_USER_STORAGE_KEY);
      if (storedUser) {
        const parsedUser: MockUser = JSON.parse(storedUser);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error("Could not parse user from localStorage", error);
      localStorage.removeItem(MOCK_USER_STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback((email: string) => {
    const name = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const mockUser: MockUser = { email, name, avatarUrl: "https://picsum.photos/seed/user1/100/100" };
    localStorage.setItem(MOCK_USER_STORAGE_KEY, JSON.stringify(mockUser));
    setUser(mockUser);
    router.push('/dashboard');
  }, [router]);

  const signup = useCallback((email: string) => {
    // In this mock, signup and login are identical.
    login(email);
  }, [login]);

  const logout = useCallback(() => {
    localStorage.removeItem(MOCK_USER_STORAGE_KEY);
    setUser(null);
    router.push('/login');
  }, [router]);

  useEffect(() => {
    if (loading) return;

    const isAuthPage = pathname === '/login' || pathname === '/signup';
    
    if (!user && !isAuthPage) {
      router.push('/login');
    }
    
    if (user && isAuthPage) {
      router.push('/dashboard');
    }

  }, [user, loading, pathname, router]);


  return { user, loading, login, signup, logout };
}
