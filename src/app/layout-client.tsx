
'use client';

import { usePathname } from 'next/navigation';
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
  
  const showHeaderAndFooter = true;

  return (
    <>
      {showHeaderAndFooter && <Header />}
      <div className={"flex-grow"}>
        {children}
      </div>
      {showHeaderAndFooter && <PreFooterCallToAction />}
      {showHeaderAndFooter && <Footer />}
      <Toaster />
      <CookieConsent />
    </>
  );
}
