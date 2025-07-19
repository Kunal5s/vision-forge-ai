
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
    const router = useRouter();

    const filterablePages = ['/blog', '/stories'];
    const isFilterablePage = filterablePages.includes(pathname);
    const currentCategorySlug = searchParams.get('category');

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
        <div className="w-full bg-background border-b">
            <nav className="h-14 flex items-center justify-center container mx-auto px-4 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-6">
                    {Object.entries(categorySlugMap).map(([slug, name]) => {
                         const isActive = isFilterablePage ? currentCategorySlug === slug : pathname === `/${slug}`;
                         return (
                            <Link
                                key={slug}
                                href={getLinkHref(slug)}
                                scroll={false}
                                className={cn(
                                    'text-sm font-medium transition-colors whitespace-nowrap',
                                    isActive ? 'text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
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
                    Login
                </Button>
              </Link>
            )}
         </div>
       </div>
       {!isAdminRoute && <CategoryNavBar />}
    </header>
  );
}
