"use client";

import Link from 'next/link';
import { BrainCircuit } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { SubscriptionManager } from '../vision-forge/SubscriptionManager';

const navLinks = [
  // User request: Remove 'Generate' and 'Models'
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

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      {/* Use flex-col on mobile and flex-row on desktop */}
      <div className="container mx-auto flex flex-col md:flex-row md:items-center md:h-16 md:justify-between px-4 py-2">
        
        {/* Logo */}
        <div className="flex-shrink-0 self-start md:self-center">
          <Link href="/" className="flex items-center gap-2">
            <BrainCircuit className="h-7 w-7 text-foreground" />
            <span className="text-xl font-bold text-foreground">
              Imagen <span className="text-accent">BrainAi</span>
            </span>
          </Link>
        </div>

        {/* Navigation container */}
        {/* For mobile: overflow-x-auto, For desktop: flex items-center */}
        <div className="flex items-center gap-4 mt-2 md:mt-0 w-full md:w-auto overflow-x-auto no-scrollbar pb-2 md:pb-0">
          <nav className="flex items-center gap-4 md:gap-6 w-full md:w-auto">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  // Simpler style, closer to the screenshot. No more buttons.
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
          <div className="flex-shrink-0">
            <SubscriptionManager />
          </div>
        </div>

      </div>
    </header>
  );
}
