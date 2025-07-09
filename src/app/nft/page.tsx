
import { ArticlesSection } from '@/components/vision-forge/ArticlesSection';
import { getArticles } from '@/lib/articles';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ArticlesSkeleton } from '@/components/vision-forge/ArticlesSkeleton';

export const metadata: Metadata = {
    title: 'NFT Articles | Imagen BrainAi',
    description: 'Learn about creating, promoting, and understanding the NFT market with our AI-generated articles.',
};

const nftTopics = [
    'How to Create Your First Successful NFT Art Collection',
    'Understanding The Volatile and Exciting NFT Art Marketplace',
    'Effective Strategies for Promoting Your NFT Artwork Online',
    'A Deep Dive into the Technology Behind NFTs Explained',
];

async function ArticleList() {
    const articles = await getArticles('NFT', nftTopics);
    return <ArticlesSection articles={articles} topics={nftTopics} category="NFT" />;
}

export default function NftPage() {
    return (
        <main className="py-12">
            <section className="container mx-auto px-4">
                <header className="text-center mb-12">
                    <h2 className="text-4xl font-extrabold tracking-tight text-foreground">
                        NFT & Digital Art
                    </h2>
                    <p className="text-muted-foreground mt-2 max-w-3xl mx-auto">
                        Navigate the world of NFTs with our in-depth articles on creation, marketing, and technology.
                    </p>
                </header>
                <Suspense fallback={<ArticlesSkeleton />}>
                    <ArticleList />
                </Suspense>
            </section>
        </main>
    );
}
