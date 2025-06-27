
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Cookie } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // We run this in a try-catch block to prevent server-side rendering errors
    try {
      const consent = localStorage.getItem('cookie_consent');
      if (consent !== 'true') {
        setShowBanner(true);
      }
    } catch (error) {
        // If localStorage is not available, we can't store consent, so we don't show the banner.
        // This is a graceful fallback for environments where localStorage is blocked.
        setShowBanner(false);
    }
  }, []);

  const handleAccept = () => {
    try {
        localStorage.setItem('cookie_consent', 'true');
        setShowBanner(false);
    } catch(error) {
        // Even if we can't save, we should hide the banner to not block the UI
        setShowBanner(false);
        console.error("Could not save cookie consent to localStorage.", error);
    }
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-[100] p-4 bg-background border-t",
      "data-[state=visible]:animate-in data-[state=hidden]:animate-out data-[state=hidden]:slide-out-to-bottom-full data-[state=visible]:slide-in-from-bottom-full",
      "transition-all duration-500"
      )}
      data-state={showBanner ? 'visible' : 'hidden'}
    >
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-start gap-3">
            <Cookie className="h-5 w-5 mt-1 text-primary shrink-0" />
            <p className="text-sm text-foreground/80">
                We use cookies and browser storage to enhance your experience, manage your session, and remember your preferences. By continuing to use our site, you agree to our{' '}
                <Link href="/privacy" className="underline text-primary hover:text-primary/80">
                    Privacy Policy
                </Link>
                .
            </p>
        </div>
        <Button onClick={handleAccept} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground shrink-0">
          Accept
        </Button>
      </div>
    </div>
  );
}
