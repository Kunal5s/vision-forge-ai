
'use client';

import Link from 'next/link';
import { BrainCircuit, LogIn, LogOut } from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import React, { Suspense } from 'react';
import { Button } from '../ui/button';
import { logoutAction } from '@/app/admin/login/actions';
import { useRouter } from 'next/navigation';
import { categorySlugMap } from '@/lib/constants';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import type { SessionPayload } from 'jose';

const CategoryNavBarContent = () => {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const isFilterablePage = ['/blog', '/stories'].includes(pathname);
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


interface HeaderProps {
    session: SessionPayload | null;
}

export function Header({ session }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isAdminRoute = pathname.startsWith('/admin');

  const handleLogout = async () => {
    await logoutAction();
    router.push('/admin/login');
    router.refresh(); 
  }

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

          <div className="flex items-center gap-4">
            {isAdminRoute ? (
              <>
                {session ? (
                  <Button variant="outline" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                ) : (
                  <Link href="/admin/login">
                    <Button variant="outline">
                      <LogIn className="mr-2 h-4 w-4" />
                      Admin Login
                    </Button>
                  </Link>
                )}
              </>
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
  );
}
