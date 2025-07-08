
"use client";

import Link from 'next/link';
import { BrainCircuit } from 'lucide-react';
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
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container mx-auto flex flex-col items-center px-0 sm:px-4 py-3">
        {/* Top row: Logo */}
        <div className="w-full flex justify-center items-center px-4 sm:px-0">
          <Link href="/" className="flex items-center gap-2">
            <BrainCircuit className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold text-foreground">
              Imagen <span className="text-accent">BrainAi</span>
            </span>
          </Link>
        </div>

        {/* Scrollable Navigation for all screen sizes */}
        <div className="w-full overflow-x-auto no-scrollbar md:mt-4">
          <nav className="flex gap-3 items-center py-2 px-4 md:justify-center md:px-0">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-4 py-1.5 rounded-md text-sm font-medium whitespace-nowrap",
                  pathname === link.href
                    ? 'bg-foreground text-background font-bold'
                    : 'border border-input bg-background hover:bg-muted'
                )}
              >
                {link.label}
              </Link>
            ))}
            <SubscriptionManager />
          </nav>
        </div>
      </div>
    </header>
  );
}
