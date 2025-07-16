
// src/components/layout/Header.tsx
"use client";

import Link from 'next/link';
import { BrainCircuit, Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import React, { useEffect, useState } from 'react';
import { AdminLogin } from '../vision-forge/AdminLogin';
import { SubscriptionManager } from '../vision-forge/SubscriptionManager';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader } from '../ui/sheet';
import { Separator } from '../ui/separator';

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
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  if (!isClient) {
    return (
       <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto h-16" />
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex flex-shrink-0 items-center gap-2">
          <BrainCircuit className="h-7 w-7 text-foreground" />
          <span className="text-xl font-bold text-foreground">
            Imagen BrainAi
          </span>
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex flex-grow items-center justify-center">
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
        </div>

        {/* Desktop Buttons */}
        <div className="hidden md:flex items-center gap-2">
            <SubscriptionManager />
            <AdminLogin />
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Menu className="h-6 w-6" />
                        <span className="sr-only">Open Menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] p-4">
                    <SheetHeader>
                        <Link href="/" className="flex flex-shrink-0 items-center gap-2 mb-4">
                            <BrainCircuit className="h-7 w-7 text-foreground" />
                            <span className="text-xl font-bold text-foreground">
                                Imagen BrainAi
                            </span>
                        </Link>
                    </SheetHeader>
                    <Separator className="my-4" />
                    <div className="flex flex-col space-y-2 mb-4">
                        <SubscriptionManager />
                        <AdminLogin />
                    </div>
                    <Separator className="my-4" />
                    <nav className="flex flex-col space-y-2">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    "block rounded-md px-3 py-2 text-base font-medium",
                                    pathname === link.href
                                    ? "bg-muted text-foreground"
                                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                )}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                </SheetContent>
            </Sheet>
        </div>
      </div>
    </header>
  );
}
