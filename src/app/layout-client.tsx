
'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from "@clerk/nextjs";
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { PreFooterCallToAction } from '@/components/layout/PreFooterCallToAction';
import { Toaster } from '@/components/ui/toaster';
import { CookieConsent } from '@/components/layout/CookieConsent';

interface RootLayoutClientProps {
  children: React.ReactNode;
}

export default function RootLayoutClient({ children }: RootLayoutClientProps) {
  const pathname = usePathname();
  const { userId } = useAuth(); // Clerk's hook to check authentication
  
  const isAdminRoute = pathname.startsWith('/admin');
  const isAuthRoute = ['/sign-in', '/sign-up'].includes(pathname);
  const isStoryPage = pathname.startsWith('/stories/') && pathname.split('/').length > 2;

  const showHeaderAndFooter = !isAuthRoute && !isAdminRoute && !isStoryPage;

  return (
    <>
      {showHeaderAndFooter ? <Header /> : null}
      <div className={isAdminRoute ? "" : "flex-grow"}>
        {children}
      </div>
      {showHeaderAndFooter && <PreFooterCallToAction />}
      {showHeaderAndFooter && <Footer />}
      <Toaster />
      <CookieConsent />
    </>
  );
}
