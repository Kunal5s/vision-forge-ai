
'use client';

import Link from 'next/link';
import { BrainCircuit, Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import React, { useEffect, useState, useRef } from 'react';
import { AdminLogin } from '../vision-forge/AdminLogin';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetHeader, SheetTitle } from '@/components/ui/sheet';
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
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = direction === 'left' ? -200 : 200;
            scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };
  
    return (
        <div className="relative group">
             <Button
                variant="outline"
                size="icon"
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-background/80 hover:bg-background opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => scroll('left')}
            >
                &lt;
            </Button>
            <ScrollArea className="w-full whitespace-nowrap" ref={scrollContainerRef}>
                <div className="flex items-center gap-2 py-2 px-12">
                {navLinks.map((link) => (
                    <Button
                    key={link.href}
                    asChild
                    variant={pathname === link.href ? 'secondary' : 'default'}
                    size="sm"
                    className="rounded-full text-sm font-medium"
                    >
                    <Link href={link.href}>{link.label}</Link>
                    </Button>
                ))}
                </div>
            </ScrollArea>
             <Button
                variant="outline"
                size="icon"
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-background/80 hover:bg-background opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => scroll('right')}
            >
                &gt;
            </Button>
        </div>
    );
  };
  

const MobileNav = () => {
  const pathname = usePathname();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Menu />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full max-w-xs p-0">
         <SheetHeader className="p-6 pb-4 border-b">
            <Link href="/" className="flex items-center gap-2">
              <BrainCircuit className="h-7 w-7 text-foreground" />
              <span className="text-xl font-bold text-foreground">
                  Imagen BrainAi
              </span>
            </Link>
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100%-80px)]">
            <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <AdminLogin />
                </div>
                 <div className="space-y-2 border-t pt-4">
                    <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Categories</p>
                    <div className="flex flex-col gap-1">
                      {navLinks.map(link => (
                          <SheetClose asChild key={link.href}>
                          <Link
                              href={link.href}
                              className={cn(
                              "flex items-center rounded-md px-3 py-2 text-base font-medium transition-colors",
                              pathname === link.href
                                  ? "bg-muted text-foreground"
                                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                              )}
                          >
                              {link.label}
                          </Link>
                          </SheetClose>
                      ))}
                    </div>
                 </div>
            </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
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
    <header className="fixed top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
       <div className="container mx-auto flex h-14 items-center justify-between px-4">
         <Link href="/" className="flex flex-shrink-0 items-center gap-2">
           <BrainCircuit className="h-7 w-7 text-foreground" />
           <span className="hidden sm:inline-block text-xl font-bold text-foreground">
             Imagen BrainAi
           </span>
         </Link>
         
         <div className="hidden md:flex items-center gap-2">
            <AdminLogin />
         </div>
         
         <div className="md:hidden">
           <MobileNav />
         </div>
       </div>
       <div className="border-t">
        <CategoryNavBar />
       </div>
    </header>
  );
}
