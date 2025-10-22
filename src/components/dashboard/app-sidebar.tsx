'use client';

import React from 'react';
import Link from 'next/link';
import {
  LogOut,
  BookOpen,
  Home,
  CalendarCheck,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Logo } from '@/components/logo';
import { UserStats } from '@/components/dashboard/user-stats';
import { usePathname } from 'next/navigation';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export function AppSidebar() {
  const { user, loading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/login');
  };

  if (loading) {
    return (
        <div className="flex h-full w-64 flex-col border-r p-4">
            <Skeleton className="h-8 w-32 mb-8" />
            <Skeleton className="h-10 w-full mb-4" />
            <div className="space-y-2 flex-grow">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
            </div>
             <Skeleton className="h-10 w-full" />
        </div>
    )
  }

  if (!user) {
    return null; // Or a redirect component, though the hook handles redirection
  }
  
  const userName = user.displayName || 'User';
  const userEmail = user.email || 'No email';
  const userAvatar = user.photoURL || '';


  return (
    <Sidebar>
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/dashboard'}>
              <Link href="/dashboard">
                <Home />
                Chat
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
           <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/dashboard/attendance'}>
              <Link href="/dashboard/attendance">
                <CalendarCheck />
                Attendance
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton href="#">
              <BookOpen />
              Resources
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <div className="mt-auto p-2">
            <SidebarSeparator className="my-4" />
            <UserStats />
        </div>

      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center gap-3 p-2">
          <Avatar className="h-10 w-10">
            <AvatarImage src={userAvatar} alt={userName} />
            <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="truncate font-semibold text-sm">{userName}</p>
            <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
          </div>
          <SidebarMenuButton
            onClick={handleLogout}
            className="h-9 w-9 p-0 ml-auto flex-shrink-0"
            variant="ghost"
            tooltip={{children: 'Log Out', side: 'right'}}
          >
            <LogOut />
          </SidebarMenuButton>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
