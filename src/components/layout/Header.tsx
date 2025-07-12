
"use client";

import Link from 'next/link';
import { BrainCircuit } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { SubscriptionManager } from '../vision-forge/SubscriptionManager';
import { motion } from 'framer-motion';
import React from 'react';

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
  const [activeLink, setActiveLink] = React.useState(pathname);

  React.useEffect(() => {
    setActiveLink(pathname);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex flex-col px-4">
        {/* Top Row: Logo and Subscription Manager */}
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex flex-shrink-0 items-center gap-2">
            <BrainCircuit className="h-7 w-7 text-foreground" />
            <span className="text-xl font-bold text-foreground">
              Imagen <span className="text-accent">BrainAi</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <SubscriptionManager />
          </div>
        </div>
        
        {/* Bottom Row: Navigation Links */}
        <nav className="flex w-full items-center overflow-x-auto pb-2 no-scrollbar">
          <div className="relative flex gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setActiveLink(link.href)}
                className={cn(
                  "relative text-sm font-medium transition-colors whitespace-nowrap px-1 py-2",
                  activeLink === link.href
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {activeLink === link.href && (
                  <motion.span
                    layoutId="underline"
                    className="absolute bottom-0 left-0 h-0.5 w-full bg-foreground"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}
