
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
        <div className="w-full bg-muted border-b border-border/60">
            <nav className="container mx-auto px-4 py-2">
                <div className="flex items-center gap-2 flex-wrap">
                    {categoriesToShow.map(([slug, name]) => {
                         const isActive = isFilterablePage ? currentCategorySlug === slug : pathname === `/${slug}`;
                         return (
                            <Link
                                key={slug}
                                href={getLinkHref(slug)}
                                scroll={false}
                                className={cn(
                                    'px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap',
                                    'text-foreground/80 bg-background border border-border/80 hover:bg-accent hover:text-accent-foreground',
                                    isActive && 'bg-accent text-accent-foreground font-semibold border-accent'
                                )}
                            >
                                {name}
                            </Link>
                        )
                    })}
                </div>
            </nav>
        </div>
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

  // Calculate total header height for consistent layout padding
  const headerHeightClass = isAdminRoute ? "h-16" : "pt-16";
  const mainHeaderHeightClass = "h-16";

  if (!isClient) {
    return (
       <header className={cn("fixed top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60", isAdminRoute ? "h-16" : "h-32")} />
    );
  }

  return (
    <>
      <header className="fixed top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="bg-foreground text-background">
            <div className={cn("container mx-auto flex items-center justify-between px-4", mainHeaderHeightClass)}>
                <Link href="/" className="flex flex-shrink-0 items-center gap-2">
                <BrainCircuit className="h-7 w-7 text-background" />
                <span className="text-xl font-bold text-background">
                    Imagen BrainAi
                </span>
                </Link>
                
                <div className="flex items-center gap-4">
                    {isAdminRoute ? (
                    <Button variant="outline" onClick={handleLogout} className="bg-transparent text-background border-background/50 hover:bg-background/10">
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </Button>
                    ) : (
                    <Link href="/admin/login">
                        <Button variant="outline" className="bg-transparent text-background border-background/50 hover:bg-background/10">
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
      <div className={isAdminRoute ? "pt-16" : "pt-[124px]"} />
    </>
  );
}
