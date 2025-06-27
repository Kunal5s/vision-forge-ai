
import { PricingSection } from '@/components/vision-forge/PricingSection';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Pricing Plans | Imagen BrainAi',
    description: 'Choose the perfect plan for your creative needs. Imagen BrainAi offers simple, transparent pricing to unlock premium AI image generation features, more credits, and higher quality results.',
};

export default function PricingPage() {
    return (
        <main className="py-12">
            <PricingSection />
        </main>
    );
}
