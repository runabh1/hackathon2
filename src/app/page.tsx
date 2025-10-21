import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { HeroGraphic } from '@/components/hero-graphic';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 z-10">
        <div className="flex justify-between items-center">
          <Logo />
        </div>
      </header>
      <main className="flex-grow flex items-center">
        <HeroGraphic />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-6">
                <h1 className="relative font-headline text-5xl md:text-7xl font-bold tracking-tighter text-white">
                  MentorAI
                </h1>
            </div>
            <p className="mt-4 max-w-2xl text-lg md:text-xl text-slate-300">
              Your personal AI-powered guide for exam prep, email management, and attendance tracking. Supercharge your student life.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="font-semibold">
                <Link href="/signup">Get Started for Free</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="font-semibold bg-transparent text-white hover:bg-white hover:text-primary">
                <Link href="/login">I have an account</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
      <footer className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-slate-400 text-sm z-10">
        <p>&copy; {new Date().getFullYear()} MentorAI. All rights reserved.</p>
      </footer>
    </div>
  );
}
