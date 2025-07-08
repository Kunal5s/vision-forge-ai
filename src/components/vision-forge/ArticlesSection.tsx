
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';

const staticArticles = [
    {
        image: 'https://placehold.co/600x400.png',
        dataAiHint: 'artificial intelligence',
        category: 'Technology',
        title: 'The Future of AI in Various Industries',
        description: 'Explore how Artificial Intelligence is revolutionizing sectors from healthcare to finance with unprecedented efficiency and innovation.',
    },
    {
        image: 'https://placehold.co/600x400.png',
        dataAiHint: 'creativity art',
        category: 'Creativity',
        title: 'Unlocking Creative Potential with AI Tools',
        description: 'Discover how AI-powered tools can break creative blocks and open up new avenues for artists, writers, and designers.',
    },
    {
        image: 'https://placehold.co/600x400.png',
        dataAiHint: 'prompt engineering',
        category: 'AI Skills',
        title: 'Crafting the Perfect AI Art Prompts',
        description: 'Learn the art and science of writing effective prompts to get the most stunning and accurate results from text-to-image AI models.',
    },
    {
        image: 'https://placehold.co/600x400.png',
        dataAiHint: 'digital marketing',
        category: 'Business',
        title: 'AI Visuals in Modern Digital Marketing',
        description: 'See how AI-generated visuals are creating more engaging and personalized ad campaigns that captivate audiences.',
    },
];

export function ArticlesSection() {
    return (
        <section className="py-16 bg-background">
            <div className="container mx-auto px-4">
                <header className="text-center mb-12">
                    <h2 className="text-4xl font-extrabold tracking-tight text-foreground">
                        Featured Articles
                    </h2>
                    <p className="text-muted-foreground mt-2">
                        Explore insights on AI, creativity, and technology.
                    </p>
                </header>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {staticArticles.map((article, index) => (
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
                                <Link href="#" className="flex items-center text-sm font-semibold text-foreground hover:underline">
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
