"use client";

import Link from 'next/link';
import Image from 'next/image'; // Placeholder for a potential logo image
import { Sparkles, Menu, X } from 'lucide-react';
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
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
          <Sparkles className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold text-foreground">
            Imagen <span className="text-accent">BrainAi</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-6 items-center">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === link.href 
                  ? (link.href === '/' ? 'text-foreground font-semibold' : 'text-primary font-semibold') 
                  : 'text-foreground/80'
              )}
            >
              {link.label}
            </Link>
          ))}
          <SubscriptionManager />
        </nav>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center gap-2">
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
                        "block rounded-md px-3 py-2 text-base font-medium transition-colors hover:bg-muted hover:text-foreground",
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
    </header>
  );
}
