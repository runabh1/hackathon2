'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useUser } from '@/firebase';

export function HomeHero() {
  const { user, loading } = useUser();

  if (loading) {
    return null;
  }

  return (
    <main className="flex-grow flex items-center bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 z-10">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-6">
            <h1 className="relative font-headline text-5xl md:text-7xl font-bold tracking-tighter text-foreground">
              MentorAI
            </h1>
          </div>
          <p className="mt-4 max-w-2xl text-lg md:text-xl text-muted-foreground">
            Your personal AI-powered guide for exam prep, email management, and attendance tracking. Supercharge your student life.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
             {user ? (
                <Button asChild size="lg" className="font-semibold">
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg" className="font-semibold">
                    <Link href="/signup">Get Started for Free</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="font-semibold">
                    <Link href="/login">I have an account</Link>
                  </Button>
                </>
              )}
          </div>
        </div>
      </div>
    </main>
  );
}
