
'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { PreFooterCallToAction } from '@/components/layout/PreFooterCallToAction';
import { Toaster } from '@/components/ui/toaster';
import { CookieConsent } from '@/components/layout/CookieConsent';

export default function RootLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');
  const isLoginPage = pathname === '/admin/login';
  // A story page will have a path like /stories/[slug], so it will have more than 2 segments.
  const isStoryPage = pathname.startsWith('/stories/') && pathname.split('/').length > 2;

  const showHeaderAndFooter = !isLoginPage && !isAdminRoute && !isStoryPage;

  return (
    <>
      {showHeaderAndFooter && <Header />}
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
