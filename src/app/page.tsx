import { Logo } from '@/components/logo';
import { HomeHero } from '@/components/home-hero';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 z-10">
        <div className="flex justify-between items-center">
          <Logo />
        </div>
      </header>
      <HomeHero />
      <footer className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-slate-400 text-sm z-10">
        <p>&copy; {new Date().getFullYear()} MentorAI. All rights reserved.</p>
      </footer>
    </div>
  );
}
