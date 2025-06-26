
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Header } from '@/components/layout/Header'; // Import Header
import { Footer } from '@/components/layout/Footer'; 
import { PreFooterCallToAction } from '@/components/layout/PreFooterCallToAction'; 
import { SubscriptionProvider } from '@/hooks/use-subscription';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// Programmatically create an SVG icon to avoid creating new files.
const iconSvg = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="32" height="32" rx="8" fill="#3B82F6"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="20px" fill="white">B</text></svg>`;
const iconDataUrl = `data:image/svg+xml,${encodeURIComponent(iconSvg)}`;

export const metadata: Metadata = {
  title: {
    default: 'Imagen BrainAi | AI Image Generator - Turn Text to Art',
    template: '%s | Imagen BrainAi',
  },
  description: 'Unleash your creativity with Imagen BrainAi, a powerful and free AI image generator powered by Google\'s Imagen 3. Turn text prompts into stunning, high-quality art, photos, and illustrations in seconds.',
  verification: {
    google: 'aa8zBqwKzkPcVhwnOe6eO2zOlvMqqUk41xpBzV9kSts',
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
        </SubscriptionProvider>
      </body>
    </html>
  );
}
