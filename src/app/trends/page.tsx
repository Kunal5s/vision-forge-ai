
import { ArticlesSection } from '@/components/vision-forge/ArticlesSection';
import { getArticles } from '@/lib/articles';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Trends Articles | Imagen BrainAi',
    description: 'Stay ahead of the curve with AI-generated articles on the latest trends in generative art and technology.',
};

const trendsTopics = [
    'The Biggest AI Art and Design Trends of This Year',
    'Understanding Diffusion Models: The Tech Behind Your Favorite AI',
    'The Important Ethical Considerations of Modern AI Art Generation',
    'What is the Future of Generative AI Technology Models',
];

export default async function TrendsPage() {
    const articles = await getArticles('Trends', trendsTopics);
    return (
        <main className="py-12">
            <ArticlesSection 
                articles={articles}
                topics={trendsTopics} 
                category="Trends" 
                headline="The Future is Now"
                subheadline="Keep up with the fast-paced world of AI art with our articles on current and future trends."
            />
        </main>
    );
}
