"use client";

import Link from 'next/link';
import { Sparkles, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { SubscriptionManager } from '../vision-forge/SubscriptionManager';

const navLinks = [
  { href: '/', label: 'Generate' },
  { href: '/models', label: 'Models' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container mx-auto flex flex-col items-center px-4 py-3">
        {/* Top row: Logo, Subscription Manager (desktop), and Mobile Menu Trigger */}
        <div className="w-full flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
            <Sparkles className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold text-foreground">
              Imagen <span className="text-accent">BrainAi</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
             <div className="hidden md:block">
                <SubscriptionManager />
             </div>
             {/* Mobile Navigation Trigger */}
            <div className="md:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-foreground">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] bg-background p-0">
                  <SheetHeader className="p-4 border-b">
                    <SheetTitle className="flex items-center gap-2">
                      <Link href="/" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                        <Sparkles className="h-6 w-6 text-primary" />
                        <span className="text-lg font-bold text-foreground">
                          Imagen <span className="text-accent">BrainAi</span>
                        </span>
                      </Link>
                    </SheetTitle>
                  </SheetHeader>
                  <nav className="flex flex-col gap-1 p-4">
                    {navLinks.map((link) => (
                      <SheetClose asChild key={link.href}>
                        <Link
                          href={link.href}
                          className={cn(
                            "block rounded-md px-3 py-2 text-base font-medium hover:bg-muted hover:text-foreground",
                             pathname === link.href ? "bg-muted text-foreground font-semibold" : "text-foreground/80"
                          )}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {link.label}
                        </Link>
                      </SheetClose>
                    ))}
                    <div className="border-t pt-4 mt-4">
                      <SubscriptionManager />
                    </div>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>

        {/* Desktop Navigation - Below the logo */}
        <nav className="hidden md:flex gap-3 items-center mt-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-4 py-1.5 rounded-md text-sm font-medium",
                pathname === link.href
                  ? 'bg-foreground text-background'
                  : 'border border-input bg-background hover:bg-muted'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
