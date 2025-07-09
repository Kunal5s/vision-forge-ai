
"use client";

import Link from 'next/link';
import { BrainCircuit, Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { SubscriptionManager } from '../vision-forge/SubscriptionManager';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        
        <Link href="/" className="flex flex-shrink-0 items-center gap-2 mr-6">
          <BrainCircuit className="h-7 w-7 text-foreground" />
          <span className="text-xl font-bold text-foreground">
            Imagen <span className="text-accent">BrainAi</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors whitespace-nowrap",
                pathname === link.href
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-4">
            <div className="hidden md:block">
                <SubscriptionManager />
            </div>

            <div className="md:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] p-0">
                    <div className='p-6 h-full flex flex-col'>
                        <Link href="/" className="flex items-center gap-2 mb-8">
                            <BrainCircuit className="h-7 w-7 text-foreground" />
                            <span className="text-xl font-bold text-foreground">
                                Imagen <span className="text-accent">BrainAi</span>
                            </span>
                        </Link>
                        <nav className="flex flex-col gap-4">
                            {navLinks.map((link) => (
                              <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                  "text-base font-medium p-2 rounded-md",
                                  pathname === link.href
                                    ? 'bg-muted text-foreground'
                                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                                )}
                              >
                                {link.label}
                              </Link>
                            ))}
                        </nav>
                        <div className="mt-auto">
                            <SubscriptionManager />
                        </div>
                    </div>
                </SheetContent>
              </Sheet>
            </div>
        </div>
      </div>
    </header>
  );
}
