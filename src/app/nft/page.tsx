
import { ArticlesSection } from '@/components/vision-forge/ArticlesSection';
import { getArticles } from '@/lib/articles';
import type { Metadata } from 'next';

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

export default async function NftPage() {
    const articles = await getArticles('NFT', nftTopics);
    return (
        <main className="py-12">
            <ArticlesSection 
                articles={articles}
                topics={nftTopics} 
                category="NFT" 
                headline="NFT & Digital Art"
                subheadline="Navigate the world of NFTs with our in-depth articles on creation, marketing, and technology."
            />
        </main>
    );
}
