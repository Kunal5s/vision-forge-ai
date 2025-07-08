
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';

const articles = [
  {
    image: 'https://placehold.co/600x400.png',
    dataAiHint: 'autonomous driving',
    category: 'Technology',
    title: 'The Future of AI: How Artificial Intelligence is Reshaping Industries',
    description: 'Explore how AI is revolutionizing various sectors, from healthcare to finance, and what the future holds for this transformative technology.',
  },
  {
    image: 'https://placehold.co/600x400.png',
    dataAiHint: 'creative design',
    category: 'Creativity',
    title: 'Unlocking Your Creative Potential with AI Image Generation Tools',
    description: 'Learn how to use AI image generators to overcome creative blocks, visualize ideas, and produce stunning artwork effortlessly.',
  },
  {
    image: 'https://placehold.co/600x400.png',
    dataAiHint: 'artistic prompt',
    category: 'Tips & Tricks',
    title: 'Mastering the Art of Crafting the Perfect AI Prompts',
    description: 'Discover the secrets to writing effective text prompts that yield incredible and precise results from AI image generators.',
  },
  {
    image: 'https://placehold.co/600x400.png',
    dataAiHint: 'digital marketing',
    category: 'Business',
    title: 'How AI-Generated Visuals Are Disrupting Modern Digital Marketing',
    description: 'See how businesses are leveraging AI-generated images to create unique, engaging content and stand out in a crowded marketplace.',
  },
];

export function ArticlesSection() {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <header className="text-center mb-12">
          <h2 className="text-4xl font-extrabold tracking-tight text-foreground">
            Recently Added Articles
          </h2>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {articles.map((article, index) => (
            <Card key={index} className="flex flex-col overflow-hidden transition-shadow hover:shadow-lg">
              <CardHeader className="p-0">
                 <div className="aspect-video relative">
                    <Image 
                      src={article.image} 
                      alt={article.title} 
                      layout="fill"
                      objectFit="cover"
                      data-ai-hint={article.dataAiHint}
                    />
                 </div>
              </CardHeader>
              <CardContent className="p-6 flex-grow">
                <Badge variant="secondary" className="mb-2">{article.category}</Badge>
                <CardTitle className="text-lg font-semibold leading-snug mb-2">{article.title}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {article.description}
                </p>
              </CardContent>
              <CardFooter className="p-6 pt-0">
                <Link href="#" className="flex items-center text-sm font-semibold text-primary hover:underline">
                  Read More <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
