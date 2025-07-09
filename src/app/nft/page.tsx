
import { ArticlesSection } from '@/components/vision-forge/ArticlesSection';
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

export default function NftPage() {
    return (
        <main className="py-12">
            <ArticlesSection 
                topics={nftTopics} 
                category="NFT" 
                headline="NFT & Digital Art"
                subheadline="Navigate the world of NFTs with our in-depth articles on creation, marketing, and technology."
            />
        </main>
    );
}
