
import { ImageGenerator } from '@/components/vision-forge/ImageGenerator';
import { TestimonialsSection } from '@/components/vision-forge/TestimonialsSection';
import { PricingSection } from '@/components/vision-forge/PricingSection';
import { FaqSection } from '@/components/vision-forge/FaqSection';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Imagen BrainAi: Your Free AI Image Generator',
  description: "Welcome to the future of AI image generation. Describe your vision, and our advanced text-to-image AI, powered by Google's Imagen technology, will bring it to life. Create stunning, high-quality images, illustrations, and art from text prompts in seconds. Get started for free and see what you can create.",
};

export default function HomePage() {
  return (
    <main>
      <section className="container mx-auto py-8 px-4">
        <header className="text-center mb-10">
          <h1 className="text-5xl font-extrabold tracking-tight text-foreground">
            Imagen BrainAi: Your Free <span className="text-accent">AI Image Generator</span>
          </h1>
          <p className="mt-4 text-lg text-foreground/80 max-w-3xl mx-auto">
            Welcome to the future of AI image generation. Describe your vision, and our advanced text-to-image AI will bring it to life. Create stunning, high-quality images, illustrations, and art from text prompts in seconds. Get started for free and see what you can create.
          </p>
        </header>
        <ImageGenerator />
      </section>

      <TestimonialsSection />
      <PricingSection />
      <FaqSection />

    </main>
  );
}
