
'use client';

import Link from 'next/link';
import { BrainCircuit, Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import React, { useEffect, useState } from 'react';
import { AdminLogin } from '../vision-forge/AdminLogin';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '../ui/button';

const navLinks = [
  { href: '/prompts', label: 'Prompts' },
  { href: '/styles', label: 'Styles' },
  { href: '/tutorials', label: 'Tutorials' },
  { href: '/storybook', label: 'Storybook' },
  { href: '/usecases', label: 'Usecases' },
  { href: '/inspiration', label: 'Inspiration' },
  { href: '/trends', label: 'Trends' },
  { href: '/technology', label: 'Technology' },
  { href: '/nft', label: 'NFT' },
];

const CategoryNavBar = () => {
    const pathname = usePathname();
  
    return (
        <div className="w-full bg-background border-b">
            <ScrollArea className="w-full whitespace-nowrap">
                <nav className="container mx-auto flex items-center gap-2 p-2 h-14">
                {navLinks.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                            'inline-block rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                            'border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground',
                            pathname === link.href ? 'bg-secondary font-semibold' : ''
                        )}
                        >
                        {link.label}
                    </Link>
                ))}
                </nav>
            </ScrollArea>
        </div>
    );
};


export function Header() {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
       <header className="fixed top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b h-28" />
    );
  }

  return (
    <header className="fixed top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
       <div className="container mx-auto flex h-16 items-center justify-between px-4">
         <Link href="/" className="flex flex-shrink-0 items-center gap-2">
           <BrainCircuit className="h-7 w-7 text-foreground" />
           <span className="text-xl font-bold text-foreground">
             Imagen BrainAi
           </span>
         </Link>
         
         <div className="flex items-center gap-2">
            <AdminLogin />
         </div>

       </div>
       <CategoryNavBar />
    </header>
  );
}
