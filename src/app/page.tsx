
import { ImageGenerator } from '@/components/vision-forge/ImageGenerator';
import { TestimonialsSection } from '@/components/vision-forge/TestimonialsSection';
import { PricingSection } from '@/components/vision-forge/PricingSection';
import { FaqSection } from '@/components/vision-forge/FaqSection';
import type { Metadata } from 'next';
import { ArticlesSection } from '@/components/vision-forge/ArticlesSection';
import { getArticles } from '@/lib/articles';
import { Suspense } from 'react';
import { ArticlesSkeleton } from '@/components/vision-forge/ArticlesSkeleton';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Imagen BrainAi: Your Free AI Image Generator',
  description: "Welcome to the future of AI image generation. Describe your vision, and our advanced text-to-image AI will bring it to life. Create stunning, high-quality images, illustrations, and art from text prompts in seconds. Get started for free and see what you can create.",
};

const featuredTopics = [
    'The Definitive Guide to Advanced Prompt Engineering for AI Art',
    'How AI is Blurring the Lines Between Photography and Imagination',
    'Creating Consistent Characters: A Deep Dive into AI Storytelling',
    'Beyond Pretty Pictures: The Business Case for AI Image Generation',
];

async function FeaturedArticleList() {
    const articles = await getArticles('Featured', featuredTopics);
    return <ArticlesSection articles={articles} topics={featuredTopics} category="Featured" showRegenerate={true} />;
}

export default function HomePage() {
  return (
    <main>
      <section className="w-full bg-foreground text-background">
        <div className="container mx-auto px-4 py-16 text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
              Imagen BrainAi: Your Free AI Image Generator
            </h1>
            <p className="mt-6 max-w-3xl mx-auto text-lg text-background">
              Welcome to the future of AI image generation. Describe your vision, and our advanced text-to-image AI will bring it to life. Create stunning, high-quality images, illustrations, and art from text prompts in seconds. Get started for free and see what you can create.
            </p>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <header className="text-center mb-12">
            <h2 className="text-4xl font-extrabold tracking-tight text-foreground">
              Featured Articles
            </h2>
            <p className="text-muted-foreground mt-2 max-w-3xl mx-auto">
              Explore fresh insights on AI, creativity, and technology, generated just for you.
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
      
      <section className="container mx-auto px-4 pt-12 pb-8">
        <ImageGenerator />
      </section>

      <TestimonialsSection />
      <PricingSection />
      <FaqSection />

    </main>
  );
}
