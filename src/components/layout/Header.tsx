
'use client';

import Link from 'next/link';
import { BrainCircuit, LogIn, LogOut } from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import React, { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { logoutAction } from '@/app/admin/login/actions';
import { useRouter } from 'next/navigation';
import { categorySlugMap } from '@/lib/constants';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const CategoryNavBar = () => {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const filterablePages = ['/blog', '/stories'];
    const isFilterablePage = filterablePages.includes(pathname);
    const currentCategorySlug = searchParams.get('category');
    
    // Remove "Featured" category from the navigation
    const categoriesToShow = Object.entries(categorySlugMap).filter(([slug]) => slug !== 'featured');

    const getLinkHref = (slug: string) => {
        if (isFilterablePage) {
            const params = new URLSearchParams(searchParams.toString());
             if (currentCategorySlug === slug) {
                params.delete('category');
            } else {
                params.set('category', slug);
            }
            const queryString = params.toString();
            return `${pathname}${queryString ? `?${queryString}` : ''}`;
        }
        return `/${slug}`;
    };

    return (
      <nav className="border-b bg-background">
        <div className="container mx-auto px-4">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex w-max space-x-2 py-3 md:justify-center md:w-full">
                {categoriesToShow.map(([slug, name]) => {
                     const isActive = isFilterablePage ? currentCategorySlug === slug : pathname === `/${slug}`;
                     return (
                        <Link
                            key={slug}
                            href={getLinkHref(slug)}
                            scroll={false}
                            className={cn(
                                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                                'bg-background text-foreground hover:bg-muted',
                                isActive && 'bg-foreground text-background hover:bg-foreground/80'
                            )}
                        >
                            {name}
                        </Link>
                    )
                })}
            </div>
            <ScrollBar orientation="horizontal" className="h-0" />
          </ScrollArea>
        </div>
      </nav>
    );
};


export function Header() {
  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const isAdminRoute = pathname.startsWith('/admin');
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLogout = async () => {
    await logoutAction();
    router.push('/admin/login');
  }
  
  const headerHeightClass = isAdminRoute ? "pt-16" : "pt-[124px]";

  if (!isClient) {
    return (
       <header className={cn("fixed top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60", isAdminRoute ? "h-16" : "h-[124px]")} />
    );
  }

  return (
    <>
      <header className="fixed top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div>
            <div className={cn("container mx-auto flex items-center justify-between px-4 h-16")}>
                <Link href="/" className="flex flex-shrink-0 items-center gap-2">
                <BrainCircuit className="h-7 w-7 text-foreground" />
                <span className="text-xl font-bold text-foreground">
                    Imagen BrainAi
                </span>
                </Link>
                
                <div className="flex items-center gap-4">
                    {isAdminRoute ? (
                    <Button variant="outline" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </Button>
                    ) : (
                    <Link href="/admin/login">
                        <Button variant="outline">
                            <LogIn className="mr-2 h-4 w-4" />
                            Admin
                        </Button>
                    </Link>
                    )}
                </div>
            </div>
        </div>
        {!isAdminRoute && <CategoryNavBar />}
      </header>
      {/* This div acts as a spacer to push content below the fixed header */}
      <div className={headerHeightClass} />
    </>
  );
}
