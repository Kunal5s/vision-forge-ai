
'use client';

import Link from 'next/link';
import { BrainCircuit, LayoutDashboard, LogOut } from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import React, { useEffect, useState } from 'react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '../ui/button';
import { logoutAction } from '@/app/admin/login/actions';
import { useRouter } from 'next/navigation';
import { categorySlugMap } from '@/lib/constants';

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
    const searchParams = useSearchParams();
    const router = useRouter();

    const currentCategorySlug = searchParams.get('category');

    const isStoriesPage = pathname === '/stories';

    const handleCategoryClick = (slug: string) => {
        if (isStoriesPage) {
            // On stories page, update the query parameter to filter
            const params = new URLSearchParams(searchParams.toString());
            params.set('category', slug);
            router.push(`${pathname}?${params.toString()}`);
        } else {
            // On other pages, navigate to the category page
            router.push(`/${slug}`);
        }
    };

    return (
        <div className="w-full bg-background border-b">
            <ScrollArea className="w-full whitespace-nowrap">
                <nav className="h-14 flex items-center p-2 container mx-auto px-4">
                    <div className="flex items-center gap-2">
                        {Object.entries(categorySlugMap).map(([slug, name]) => {
                             const isActive = isStoriesPage ? currentCategorySlug === slug : pathname === `/${slug}`;
                             return (
                                <Button
                                    key={slug}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleCategoryClick(slug)}
                                    className={cn(
                                        'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                                        'border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground',
                                        isActive ? 'bg-secondary font-semibold' : ''
                                    )}
                                >
                                    {name}
                                </Button>
                            )
                        })}
                    </div>
                </nav>
                <ScrollBar orientation="horizontal" className="h-2 opacity-0" />
            </ScrollArea>
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
              <Link href="/admin">
                <Button variant="outline">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                </Button>
              </Link>
            )}
         </div>
       </div>
       {!isAdminRoute && <CategoryNavBar />}
    </header>
  );
}
