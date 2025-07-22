import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { Geist_Sans } from 'next/font/sans';
import { Geist_Mono } from 'next/font/mono';
import './globals.css';
import { SubscriptionProvider } from '@/hooks/use-subscription';
import RootLayoutClient from './layout-client';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: {
    default: 'Imagen BrainAi | AI Image Generator - Turn Text to Art',
    template: '%s | Imagen BrainAi',
  },
  description: 'Unleash your creativity with Imagen BrainAi, a powerful and free AI image generator powered by Google\'s Imagen technology. Turn text prompts into stunning, high-quality art, photos, and illustrations in seconds. Create unique AI-generated images for free.',
  keywords: 'AI image generator, text to image, AI art generator, free AI image generator, create AI art, Google Imagen, AI photo generator, text to art, AI image creator',
  verification: {
    google: 'ca-pub-4293357936314029',
    other: {
      'netpub_7b9465a6c000fc668f19805afb86902b': '7b9465a6c000fc668f19805afb86902b_05f79ef00f4f084d4066151ea34f5b21',
      'netpub_f2a54d8cbe66a52f8648704f26cb6188': 'f2a54d8cbe66a52f8648704f26cb6188_a8a35270a322bf1d60c6f6d8c6081c7e',
      'ezoic-site-verification': 'ARNEb1PANm51Bre5U3z0zTQYFeFYg7',
    },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
        <html lang="en" className={`${Geist_Sans.variable} ${Geist_Mono.variable} h-full`}>
        <body className="antialiased flex flex-col min-h-full bg-background">
            <SubscriptionProvider>
            <Suspense>
                <RootLayoutClient>
                {children}
                </RootLayoutClient>
            </Suspense>
            </SubscriptionProvider>
        </body>
        </html>
    </ClerkProvider>
  );
}
