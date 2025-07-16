
// src/components/layout/Header.tsx
"use client";

import Link from 'next/link';
import { BrainCircuit, Menu, X, BookImage } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import React, { useEffect, useState } from 'react';
import { AdminLogin } from '../vision-forge/AdminLogin';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Button } from '../ui/button';

const navLinks = [
  { href: '/stories', label: 'Web Stories', icon: BookImage },
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

const MobileNav = ({ isAdminPage }: { isAdminPage: boolean }) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full max-w-xs p-0">
        <ScrollArea className="h-full">
            <div className="p-6">
                <Link href="/" className="flex items-center gap-2 mb-6">
                    <BrainCircuit className="h-7 w-7 text-foreground" />
                    <span className="text-xl font-bold text-foreground">
                        Imagen BrainAi
                    </span>
                </Link>

                <div className="space-y-2">
                  <AdminLogin />
                  {!isAdminPage && navLinks.map(link => (
                    <SheetClose asChild key={link.href}>
                      <Link
                          href={link.href}
                          className={cn(
                          "flex items-center gap-2 rounded-md px-3 py-2 text-base font-medium transition-colors",
                          usePathname() === link.href
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                      >
                           {link.icon && <link.icon className="h-4 w-4" />}
                          {link.label}
                      </Link>
                     </SheetClose>
                  ))}
                </div>
            </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export function Header({ isAdminPage }: { isAdminPage: boolean }) {
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
          <span className="hidden sm:inline-block text-xl font-bold text-foreground">
            Imagen BrainAi
          </span>
        </Link>
        
        {/* Desktop Buttons */}
        <div className="hidden md:flex items-center gap-2">
            <AdminLogin />
        </div>
        
        {/* Mobile Nav Trigger */}
        <div className="md:hidden">
          <MobileNav isAdminPage={isAdminPage} />
        </div>
      </div>
      {!isAdminPage && (
        <div className="container mx-auto hidden h-10 items-center px-4 md:flex">
          <ScrollArea className="w-full whitespace-nowrap">
              <nav className="flex items-center space-x-1">
                  {navLinks.map((link) => (
                      <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                          "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                          pathname === link.href 
                          ? "bg-foreground text-background" 
                          : "text-foreground/70 hover:bg-muted hover:text-foreground",
                          link.icon && "text-orange-500 hover:text-orange-600"
                      )}
                      >
                      {link.icon && <link.icon className="h-4 w-4" />}
                      {link.label}
                      </Link>
                  ))}
              </nav>
              <ScrollBar orientation="horizontal" className="h-0" />
          </ScrollArea>
        </div>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {mainHeaderContent}
    </header>
  );
}
