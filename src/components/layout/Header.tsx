
'use client';

import Link from 'next/link';
import { BrainCircuit, LogIn, LogOut } from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import React from 'react';
import { Button } from '../ui/button';
import { logoutAction, verifySession } from '@/app/admin/login/actions';
import { useRouter } from 'next/navigation';
import { categorySlugMap } from '@/lib/constants';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const CategoryNavBar = () => {
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


// This is an async component to correctly handle session verification on the server.
export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const isAdminRoute = pathname.startsWith('/admin');
  
  // This state will be determined on the server and passed to the client component part.
  const [isClient, setIsClient] = React.useState(false);
  const [session, setSession] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  
  React.useEffect(() => {
    setIsClient(true);
    if (isAdminRoute) {
      verifySession().then(s => {
        setSession(s);
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, [pathname, isAdminRoute]);

  const handleLogout = async () => {
    await logoutAction();
    router.push('/admin/login');
    router.refresh(); // Ensure the header re-renders
  }
  
  const headerHeightClass = isAdminRoute ? "h-16" : "h-[124px]";
  const spacerHeightClass = isAdminRoute ? "pt-16" : "pt-[124px]";
  
  // Only render the logout button logic if we are on an admin route and the client has mounted
  const showAdminButtons = isClient && isAdminRoute;

  return (
    <>
      <header className={cn("fixed top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b", headerHeightClass)}>
        <div>
            <div className={cn("container mx-auto flex items-center justify-between px-4 h-16")}>
                <Link href="/" className="flex flex-shrink-0 items-center gap-2">
                <BrainCircuit className="h-7 w-7 text-foreground" />
                <span className="text-xl font-bold text-foreground">
                    Imagen BrainAi
                </span>
                </Link>
                
                <div className="flex items-center gap-4">
                  {!showAdminButtons ? (
                     <Link href="/admin/login">
                        <Button variant="outline">
                            <LogIn className="mr-2 h-4 w-4" />
                            Admin
                        </Button>
                    </Link>
                  ) : isLoading ? (
                     <Button variant="outline" disabled>
                        Loading...
                    </Button>
                  ) : session ? (
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
      <div className={spacerHeightClass} />
    </>
  );
}
