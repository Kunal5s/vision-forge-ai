
import { ArticlesSection } from '@/components/vision-forge/ArticlesSection';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Storybook Articles | Imagen BrainAi',
    description: 'Learn how to use AI for visual storytelling, character design, and creating comic book panels.',
};

const storybookTopics = [
    'A Guide to Visual Storytelling with AI Image Generators',
    'Step-by-Step AI Character Design for Your Next Big Project',
    'Creating Dynamic and Engaging Scenes for Your Digital Storybook',
    'How to Generate Comic Book Panels Using AI Tools',
];

export default function StorybookPage() {
    return (
        <main className="py-12">
            <ArticlesSection 
                topics={storybookTopics} 
                category="Storybook" 
                headline="AI for Storytellers"
                subheadline="Bring your stories to life with guides on character design, scene creation, and visual narrative."
            />
        </main>
    );
}
