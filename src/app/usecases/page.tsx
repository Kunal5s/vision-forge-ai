
import { ArticlesSection } from '@/components/vision-forge/ArticlesSection';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Use Cases | Imagen BrainAi',
    description: 'Discover the practical applications of AI image generation in marketing, gaming, design, and more.',
};

const usecasesTopics = [
    'How AI Image Generation is Revolutionizing Digital Marketing',
    'Creating Rapid Concept Art for Video Games with AI',
    'The Use of AI in Modern Architectural Visualization Projects',
    'A Guide to AI-Assisted Product Design and Prototyping',
];

export default function UsecasesPage() {
    return (
        <main className="py-12">
            <ArticlesSection 
                topics={usecasesTopics} 
                category="Use Cases" 
                headline="Practical AI Applications"
                subheadline="Explore how AI image generation is being used across different industries to drive innovation."
            />
        </main>
    );
}
