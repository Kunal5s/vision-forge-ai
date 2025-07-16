
'use client';

import Link from 'next/link';
import { BrainCircuit, ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import React, { useEffect, useState, useRef } from 'react';
import { AdminLogin } from '../vision-forge/AdminLogin';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Button } from '../ui/button';

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
  { href: '/stories', label: 'Web Stories' },
];

const CategoryNavBar = () => {
    const pathname = usePathname();
    const scrollViewportRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollViewportRef.current) {
            const { current } = scrollViewportRef;
            const scrollAmount = current.clientWidth * 0.8;
            current.scrollBy({ 
                left: direction === 'left' ? -scrollAmount : scrollAmount, 
                behavior: 'smooth' 
            });
        }
    };
    
    return (
        <div className="group relative w-full border-b bg-background">
            <Button
                variant="ghost"
                size="icon"
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-full w-10 rounded-none bg-gradient-to-r from-background to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => scroll('left')}
            >
                <ChevronLeft />
            </Button>
            <ScrollArea className="w-full whitespace-nowrap" viewportRef={scrollViewportRef}>
                <nav className="flex w-max items-center space-x-2 p-2 container mx-auto">
                    {navLinks.map((link) => (
                        <Button
                            key={link.href}
                            asChild
                            variant={pathname === link.href ? "secondary" : "default"}
                             className={cn(
                                "text-sm font-medium transition-colors h-8 px-4",
                                pathname === link.href 
                                ? "bg-primary text-primary-foreground" 
                                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                            )}
                        >
                            <Link href={link.href}>{link.label}</Link>
                        </Button>
                    ))}
                </nav>
              <ScrollBar orientation="horizontal" className="h-0" />
            </ScrollArea>
             <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-full w-10 rounded-none bg-gradient-to-l from-background to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => scroll('right')}
            >
                <ChevronRight />
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
          <SheetTitle>
             <Link href="/" className="flex items-center gap-2">
                <BrainCircuit className="h-7 w-7 text-foreground" />
                <span className="text-xl font-bold text-foreground">
                    Imagen BrainAi
                </span>
            </Link>
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100%-80px)]">
            <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <AdminLogin />
                </div>
                 <div className="space-y-2 border-t pt-4">
                    <p className="px-3 text-xs font-semibold text-muted-foreground uppercase">Categories</p>
                    {navLinks.map(link => (
                        <SheetClose asChild key={link.href}>
                        <Link
                            href={link.href}
                            className={cn(
                            "flex items-center gap-2 rounded-md px-3 py-2 text-base font-medium transition-colors",
                            pathname === link.href
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            {link.label}
                        </Link>
                        </SheetClose>
                    ))}
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
       <header className={cn("fixed top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 h-28")}>
        <div className="container mx-auto h-full" />
      </header>
    );
  }
  
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admin');

  return (
    <header className={cn("fixed top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60")}>
       {/* Top Tier */}
       <div className="container mx-auto flex h-14 items-center justify-between px-4 border-b">
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
       
       {/* Bottom Tier - Category Nav */}
       {!isAdminPage && (
          <div className="hidden md:block">
            <CategoryNavBar />
          </div>
       )}
    </header>
  );
}
