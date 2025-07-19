
'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { PreFooterCallToAction } from '@/components/layout/PreFooterCallToAction';
import { Toaster } from '@/components/ui/toaster';
import { CookieConsent } from '@/components/layout/CookieConsent';

export default function RootLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminLoginPage = pathname === '/admin/login';
  const isAdminDashboard = pathname.startsWith('/admin') && !isAdminLoginPage;

  return (
    <>
      {!isAdminLoginPage && <Header />}
      <div className={isAdminDashboard ? "" : "flex-grow pt-28"}>
        {children}
      </div>
      {!isAdminDashboard && !isAdminLoginPage && <PreFooterCallToAction />}
      {!isAdminDashboard && !isAdminLoginPage && <Footer />}
      <Toaster />
      <CookieConsent />
    </>
  );
}
