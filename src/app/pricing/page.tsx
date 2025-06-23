
import { PricingSection } from '@/components/vision-forge/PricingSection';
import { TestimonialsSection } from '@/components/vision-forge/TestimonialsSection';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Pricing | VisionForge AI',
    description: 'Choose the perfect plan for your creative needs. VisionForge AI offers simple, transparent pricing with no hidden fees.',
};

export default function PricingPage() {
    return (
        <main className="py-12">
            <TestimonialsSection />
            <PricingSection />
        </main>
    );
}
