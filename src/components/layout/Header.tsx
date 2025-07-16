// src/components/layout/Header.tsx
"use client";

import Link from 'next/link';
import { BrainCircuit, Menu, BookImage } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import React, { useEffect, useState } from 'react';
import { AdminLogin } from '../vision-forge/AdminLogin';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Button } from '../ui/button';

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

const MobileNav = () => {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admin');
  const isHomePage = pathname === '/';

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full max-w-xs p-0">
        <SheetHeader className="p-6 pb-0">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        </SheetHeader>
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
                          pathname === link.href
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                      >
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
  const isHomePage = pathname === '/';
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  const headerHeightClass = isHomePage ? 'h-24' : 'h-14';

  if (!isClient) {
    return (
       <header className={cn("sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60", headerHeightClass)}>
        <div className="container mx-auto h-full" />
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
          <MobileNav />
        </div>
      </div>
      {isHomePage && (
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
      )}
    </>
  );

  return (
    <header className={cn("sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60", headerHeightClass)}>
      {mainHeaderContent}
    </header>
  );
}
