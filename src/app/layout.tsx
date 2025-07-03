
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer'; 
import { PreFooterCallToAction } from '@/components/layout/PreFooterCallToAction'; 
import { SubscriptionProvider } from '@/hooks/use-subscription';
import { CookieConsent } from '@/components/layout/CookieConsent';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const iconSvg = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="favicon-gradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#F2D82D"/><stop offset="100%" style="stop-color:#2ECC71"/></linearGradient></defs><rect width="32" height="32" rx="8" fill="url(#favicon-gradient)"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="20px" fill="white">B</text></svg>`;
const iconDataUrl = `data:image/svg+xml,${encodeURIComponent(iconSvg)}`;

export const metadata: Metadata = {
  title: {
    default: 'Imagen BrainAi | AI Image Generator - Turn Text to Art',
    template: '%s | Imagen BrainAi',
  },
  description: 'Unleash your creativity with Imagen BrainAi, a powerful and free AI image generator powered by Google\'s Imagen technology. Turn text prompts into stunning, high-quality art, photos, and illustrations in seconds. Create unique AI-generated images for free.',
  keywords: 'AI image generator, text to image, AI art generator, free AI image generator, create AI art, Google Imagen, AI photo generator, text to art, AI image creator',
  verification: {
    google: 'aa8zBqwKzkPcVhwnOe6eO2zOlvMqqUk41xpBzV9kSts',
    other: {
      'netpub_7b9465a6c000fc668f19805afb86902b': '7b9465a6c000fc668f19805afb86902b_05f79ef00f4f084d4066151ea34f5b21',
    },
  },
  icons: {
    icon: iconDataUrl,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-full bg-background`}>
        <SubscriptionProvider>
          <Header />
          <div className="flex-grow">
            {children}
          </div>
          <PreFooterCallToAction /> 
          <Footer />
          <Toaster />
          <CookieConsent />
        </SubscriptionProvider>
      </body>
    </html>
  );
}
