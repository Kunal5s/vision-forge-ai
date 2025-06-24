
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

export const metadata: Metadata = {
  title: {
    default: 'Imagen BrainAi | AI Image Generator - Turn Text to Art',
    template: '%s | Imagen BrainAi',
  },
  description: 'Unleash your creativity with Imagen BrainAi, a powerful and free AI image generator powered by Google\'s Imagen 3. Turn text prompts into stunning, high-quality art, photos, and illustrations in seconds.',
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
