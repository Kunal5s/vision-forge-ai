// src/components/layout/Header.tsx
"use client";

import Link from 'next/link';
import { BrainCircuit, Wrench } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { SubscriptionManager } from '../vision-forge/SubscriptionManager';
import React, { useEffect, useState } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';

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
  const [isClient, setIsClient] = useState(false);
  
  // This hook is used to prevent hydration mismatch by ensuring
  // that the component only renders on the client side where `pathname` is available.
  useEffect(() => {
    setIsClient(true);
  }, []);


  // Hide header on the admin login page
  if (pathname === '/admin' && isClient) {
    return null;
  }
  
  // Render a placeholder or nothing on the server until the client-side check is complete
  if (!isClient) {
    return (
       <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto h-16" />
      </header>
    );
  }

  const isAdminPage = pathname.startsWith('/admin');

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
            {isAdminPage && (
              <Link href="/" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), "text-xs h-8")}>
                 Home
              </Link>
            )}
            <SubscriptionManager />
          </div>
        </div>
        
        {/* Bottom Row: Navigation Links (hide on admin pages) */}
        {!isAdminPage && (
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
        )}
      </div>
    </header>
  );
}