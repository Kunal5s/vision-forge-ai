
'use client';

import Link from 'next/link';
import { BrainCircuit, Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import React, { useEffect, useState, useRef } from 'react';
import { AdminLogin } from '../vision-forge/AdminLogin';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
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
  
    return (
        <div className="w-full bg-background border-b">
            <ScrollArea className="w-full whitespace-nowrap" ref={scrollContainerRef}>
                <nav className="container mx-auto flex items-center gap-6 px-4 h-12">
                {navLinks.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                            "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                            pathname === link.href && "text-foreground font-semibold"
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
    <header className="fixed top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
       <div className="container mx-auto flex h-16 items-center justify-between px-4 border-b">
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
       <div className="hidden md:block">
        <CategoryNavBar />
       </div>
    </header>
  );
}
