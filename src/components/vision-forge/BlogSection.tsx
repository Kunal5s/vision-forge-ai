
'use client';

import { useState } from 'react';
import { categories, articles } from '@/lib/blog-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';
import { FuturisticPanel } from './FuturisticPanel';

const createSlug = (title: string) => {
    return title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
}

export function BlogSection() {
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);

  const categorySlug = createSlug(selectedCategory);
  const currentArticles = articles[categorySlug] || [];

  return (
    <section className="space-y-12">
      <div>
        <h2 className="text-2xl font-semibold text-center mb-6 text-foreground/90">Explore Trending Categories</h2>
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              className={cn(
                'futuristic-glow-button',
                selectedCategory === category && 'futuristic-glow-button-primary bg-primary hover:bg-primary/90'
              )}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 min-h-[500px]">
        {currentArticles.map((article) => (
          <Card key={article.slug} className="glassmorphism-panel flex flex-col group">
            <CardHeader>
              <div className="relative aspect-video w-full rounded-md overflow-hidden mb-4 bg-muted/20">
                 <Image 
                    src="https://placehold.co/600x400.png"
                    alt={article.title}
                    layout="fill"
                    objectFit="cover"
                    className="transition-transform duration-300 group-hover:scale-105"
                    data-ai-hint="futuristic abstract"
                  />
              </div>
              <CardTitle className="text-xl leading-tight">
                 <Link href={`/blog/${article.slug}`} className="hover:text-primary transition-colors duration-200">
                    {article.title}
                  </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col">
              <p className="text-sm text-muted-foreground flex-grow">
                Click to generate a live, in-depth article on this topic using our real-time AI writing assistant.
              </p>
               <Link href={`/blog/${article.slug}`} className="text-sm font-semibold text-primary hover:text-accent mt-4 inline-flex items-center group/link">
                  Generate & Read Article
                  <ArrowRight size={16} className="ml-1 transition-transform duration-300 group-hover/link:translate-x-1" />
                </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <FuturisticPanel className="!p-8">
        <div className="text-center">
            <h2 className="text-2xl font-bold text-primary mb-3">Stay Ahead of the Curve</h2>
            <p className="max-w-3xl mx-auto text-foreground/80">
                The VisionForge Blog is your go-to resource for everything related to AI image generation. We provide in-depth guides to help you master prompting techniques, showcase inspiring art from the community, and keep you updated on the latest news and model updates. Whether you're a beginner learning the basics or a professional pushing creative boundaries, our articles are designed to fuel your imagination and enhance your skills.
            </p>
        </div>
      </FuturisticPanel>
    </section>
  );
}
