'use client';

import React from 'react';
import Link from 'next/link';
import {
  LogOut,
  BookOpen,
  Home,
  CalendarCheck,
} from 'lucide-react';
import { useMockAuth } from '@/hooks/use-mock-auth';
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

export function AppSidebar() {
  const { user, loading, logout } = useMockAuth();
  const pathname = usePathname();

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
            <AvatarImage src={user.avatarUrl} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="truncate font-semibold text-sm">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
          <SidebarMenuButton
            onClick={logout}
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
