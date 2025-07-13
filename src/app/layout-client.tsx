
'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { PreFooterCallToAction } from '@/components/layout/PreFooterCallToAction';
import { Toaster } from '@/components/ui/toaster';
import { CookieConsent } from '@/components/layout/CookieConsent';

export default function RootLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admin');

  return (
    <>
      {!isAdminPage && <Header />}
      <div className="flex-grow">
        {children}
      </div>
      {!isAdminPage && <PreFooterCallToAction />}
      {!isAdminPage && <Footer />}
      <Toaster />
      <CookieConsent />
    </>
  );
}
