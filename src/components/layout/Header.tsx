
'use client';

import Link from 'next/link';
import { BrainCircuit } from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import React, { Suspense } from 'react';
import { categorySlugMap } from '@/lib/constants';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const CategoryNavBarContent = () => {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const isFilterablePage = ['/blog'].includes(pathname);
    const currentCategorySlug = searchParams.get('category');
    
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
            <div className="flex w-max space-x-2 py-3 justify-start md:justify-center">
                {categoriesToShow.map(([slug, name]) => {
                     const isActive = isFilterablePage ? currentCategorySlug === slug : pathname === `/${slug}`;
                     return (
                        <Link
                            key={slug}
                            href={getLinkHref(slug)}
                            scroll={false}
                            className={cn(
                                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors border border-border/60',
                                'bg-background text-foreground hover:bg-foreground hover:text-background',
                                isActive && 'bg-foreground text-background hover:bg-foreground/90'
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

const CategoryNavBar = () => (
    <Suspense fallback={<div className="border-b h-[53px]" />}>
        <CategoryNavBarContent />
    </Suspense>
);


export function Header() {
  const pathname = usePathname();

  return (
    <header className={cn("sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b")}>
      <div>
        <div className={cn("container mx-auto flex items-center justify-between px-4 h-16")}>
          <Link href="/" className="flex flex-shrink-0 items-center gap-2">
            <BrainCircuit className="h-7 w-7 text-foreground" />
            <span className="text-xl font-bold text-foreground">
              Imagen BrainAi
            </span>
          </Link>
        </div>
      </div>
      <CategoryNavBar />
    </header>
  );