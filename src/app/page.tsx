

import { ImageGenerator } from '@/components/vision-forge/ImageGenerator';
import { TestimonialsSection } from '@/components/vision-forge/TestimonialsSection';
import { PricingSection } from '@/components/vision-forge/PricingSection';
import { FaqSection } from '@/components/vision-forge/FaqSection';
import type { Metadata } from 'next';
import { getArticles } from '@/lib/articles';
import { Suspense } from 'react';
import { ArticlesSkeleton } from '@/components/vision-forge/ArticlesSkeleton';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { HomePageClient } from '@/components/vision-forge/HomePageClient';

export const metadata: Metadata = {
  title: 'Imagen BrainAi: Your Free AI Image Generator',
  description: "Welcome to the future of AI image generation. Describe your vision, and our advanced text-to-image AI will bring it to life. Create stunning, high-quality images, illustrations, and art from text prompts in seconds. Get started for free and see what you can create.",
};

// This ensures the page is dynamically rendered, allowing article generation on first load.
export const dynamic = 'force-dynamic';

const CATEGORY_NAME = 'Featured';

async function FeaturedArticleList() {
    const articles = await getArticles(CATEGORY_NAME);
    return <HomePageClient allArticles={articles} />;
}


export default function HomePage() {
  return (
    <main>
      <section className="w-full bg-foreground text-background">
        <div className="container mx-auto px-4 py-16 text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
              Imagen BrainAi: Your Free AI Image Generator
            </h1>
            <p className="mt-6 max-w-3xl mx-auto text-lg text-background/90">
              Welcome to the future of AI image generation. Describe your vision, and our advanced text-to-image AI will bring it to life. Create stunning, high-quality images, illustrations, and art from text prompts in seconds. Get started for free and see what you can create.
            </p>
        </div>
      </section>

      <section className="container mx-auto px-4 pt-12 pb-8">
        <ImageGenerator />
      </section>
      
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <header className="text-center mb-12">
            <h2 className="text-4xl font-extrabold tracking-tight text-foreground">
              Featured Articles
            </h2>
            <p className="text-muted-foreground mt-2 max-w-3xl mx-auto">
              Explore fresh insights on AI, creativity, and technology, automatically updated for you.
            </p>
          </header>
          <Suspense fallback={<ArticlesSkeleton />}>
            <FeaturedArticleList />
          </Suspense>
           <div className="text-center mt-12">
              <Button asChild size="lg" variant="default" className="bg-foreground text-background hover:bg-foreground/90">
                  <Link href="/blog">
                      Explore All Articles <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
              </Button>
          </div>
        </div>
      </section>
      
      <TestimonialsSection />
      <FeaturesHighlightSection />
      <PricingSection />
      <FaqSection />
    </main>
  );
}
