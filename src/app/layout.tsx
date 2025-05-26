
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Footer } from '@/components/layout/Footer'; // Import Footer
import { PreFooterCallToAction } from '@/components/layout/PreFooterCallToAction'; // Import PreFooterCallToAction

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'VisionForge AI',
  description: 'Generate stunning AI images with VisionForge AI, powered by Google Imagen 3.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-full bg-background`}>
        <div className="flex-grow">
          {children}
        </div>
        <PreFooterCallToAction /> {/* Add PreFooterCallToAction here */}
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}
