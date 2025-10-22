'use client';
// This is a client component because we need to check auth state.
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // We only want to redirect once the loading state is false.
    if (!loading) {
      if (user) {
        // If the user is logged in, send them to the dashboard.
        router.replace('/dashboard');
      } else {
        // If the user is not logged in, send them to the login page.
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  // While authentication is loading, we show a spinner.
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
