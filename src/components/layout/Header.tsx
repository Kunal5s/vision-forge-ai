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
      {/* Use flex-col on all screen sizes to stack logo and nav */}
      <div className="container mx-auto flex flex-col px-4 py-2">
        
        {/* Logo */}
        <div className="flex-shrink-0 self-start">
          <Link href="/" className="flex items-center gap-2">
            <BrainCircuit className="h-7 w-7 text-foreground" />
            <span className="text-xl font-bold text-foreground">
              Imagen <span className="text-accent">BrainAi</span>
            </span>
          </Link>
        </div>

        {/* Navigation container */}
        {/* Horizontally scrollable container for nav links and button */}
        <div className="flex items-center justify-between mt-2 w-full overflow-x-auto no-scrollbar pb-2">
          <nav className="flex items-center gap-6">
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
          <div className="flex-shrink-0 pl-6">
            <SubscriptionManager />
          </div>
        </div>

      </div>
    </header>
  );
}
