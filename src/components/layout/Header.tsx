
"use client";

import Link from 'next/link';
import { BrainCircuit, Wrench } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { SubscriptionManager } from '../vision-forge/SubscriptionManager';
import React from 'react';
import { useAdminAuth } from '@/hooks/use-admin-auth';

const navLinks = [
  { href: '/prompts', label: 'Prompts' },
  { href: '/styles',label: 'Styles' },
  { href: '/tutorials', label: 'Tutorials' },
  { href: '/storybook', label: 'Storybook' },
  { href: '/usecases', label: 'Usecases' },
  { href: '/inspiration', label: 'Inspiration' },
  { href: '/trends', label: 'Trends' },
  { href: '/technology', label: 'Technology' },
  { href: '/nft', label: 'NFT' },
];

export function Header() {
  const pathname = usePathname();
  const { isAuthenticated } = useAdminAuth();

  // Hide header on the admin login page
  if (pathname === '/admin') {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex flex-col px-4">
        {/* Top Row: Logo and Subscription Manager */}
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex flex-shrink-0 items-center gap-2">
            <BrainCircuit className="h-7 w-7 text-foreground" />
            <span className="text-xl font-bold text-foreground">
              Imagen BrainAi
            </span>
          </Link>
          <div className="flex items-center gap-4">
            {isAuthenticated && (
                <Link href="/admin/dashboard" className={cn(
                    buttonVariants({ variant: 'outline', size: 'sm' }),
                    "text-xs h-8"
                )}>
                  <Wrench className="mr-2 h-4 w-4" /> Admin
                </Link>
            )}
            <SubscriptionManager />
          </div>
        </div>
        
        {/* Bottom Row: Navigation Links */}
        <nav className="flex w-full items-center overflow-x-auto no-scrollbar pb-2">
          <div className="flex gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-medium transition-colors border",
                  pathname === link.href 
                    ? "bg-foreground text-background border-transparent" 
                    : "bg-background text-foreground border-input hover:bg-muted"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}
