// src/components/layout/Header.tsx
"use client";

import Link from 'next/link';
import { BrainCircuit, Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import React, { useEffect, useState } from 'react';
import { AdminLogin } from '../vision-forge/AdminLogin';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Button } from '../ui/button';
import { SubscriptionManager } from '../vision-forge/SubscriptionManager';

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
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
       <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto h-24" />
      </header>
    );
  }

  const mainHeaderContent = (
    <>
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex flex-shrink-0 items-center gap-2">
          <BrainCircuit className="h-7 w-7 text-foreground" />
          <span className="text-xl font-bold text-foreground">
            Imagen BrainAi
          </span>
        </Link>
        
        {/* Desktop Buttons */}
        <div className="hidden md:flex items-center gap-2">
            <AdminLogin />
        </div>

        {/* Mobile Menu Trigger */}
        <div className="md:hidden">
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Menu className="h-6 w-6" />
                        <span className="sr-only">Open Menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] p-4">
                    <nav className="flex flex-col space-y-2 mt-8">
                        {navLinks.map((link) => (
                           <SheetClose asChild key={link.href}>
                             <Link
                                href={link.href}
                                className={cn(
                                    "rounded-md px-3 py-2 text-base font-medium transition-colors",
                                    pathname === link.href 
                                    ? "bg-foreground text-background" 
                                    : "text-foreground/70 hover:bg-muted hover:text-foreground"
                                )}
                                >
                                {link.label}
                            </Link>
                           </SheetClose>
                        ))}
                    </nav>
                    <div className="mt-auto pt-8 space-y-2">
                        <AdminLogin />
                    </div>
                </SheetContent>
            </Sheet>
        </div>

      </div>
      <div className="container mx-auto hidden h-10 items-center px-4 md:flex">
         <ScrollArea className="w-full whitespace-nowrap">
            <nav className="flex items-center space-x-1">
                {navLinks.map((link) => (
                    <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                        "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                        pathname === link.href 
                        ? "bg-foreground text-background" 
                        : "text-foreground/70 hover:bg-muted hover:text-foreground"
                    )}
                    >
                    {link.label}
                    </Link>
                ))}
            </nav>
            <ScrollBar orientation="horizontal" className="h-0" />
        </ScrollArea>
      </div>
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {mainHeaderContent}
    </header>
  );
}
