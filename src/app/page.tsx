
import { Wand2, Maximize, BrainCircuit, SlidersHorizontal, ZoomIn, Grid } from 'lucide-react';
import { FuturisticPanel } from '@/components/vision-forge/FuturisticPanel';
import { TestimonialsSection } from '@/components/vision-forge/TestimonialsSection';
import { PricingSection } from '@/components/vision-forge/PricingSection';
import { FaqSection } from '@/components/vision-forge/FaqSection';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Free AI Image Generator - Create Art from Text | Imagen BrainAi',
  description: "Experience the magic of text-to-image AI. With Imagen BrainAi, you can generate unique, high-resolution images from simple text prompts for free. Powered by Google's advanced models, it's perfect for artists, designers, and creators.",
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  iconBgClass?: string;
  iconTextClass?: string;
}

function FeatureCard({ icon, title, description, iconBgClass = 'bg-primary/10', iconTextClass = 'text-primary' }: FeatureCardProps) {
  return (
    <FuturisticPanel className="flex flex-col items-center text-center h-full !p-4 md:!p-6">
      <div className={`p-3 ${iconBgClass} rounded-full mb-4`}>
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground flex-grow">
        {description}
      </p>
    </FuturisticPanel>
  );
}

export default function HomePage() {
  return (
    <main>
      <div className="container mx-auto py-8 px-4">
        <header className="text-center mb-10">
          <h1 className="text-5xl font-extrabold tracking-tight text-foreground">
              Welcome to <span className="text-accent">Imagen BrainAi</span>
          </h1>
          <p className="mt-4 text-lg text-foreground/80 max-w-3xl mx-auto">
              Explore a modern web application built with Next.js and ShadCN UI. Discover powerful features, user testimonials, and more. Our AI image generation tools are currently under maintenance, but please explore the rest of our site.
          </p>
        </header>
        <FuturisticPanel className="text-center py-12">
            <h2 className="text-2xl font-semibold">Image Generation Under Maintenance</h2>
            <p className="text-muted-foreground mt-2">
                We are working hard to improve our AI features. Please check back later.
            </p>
        </FuturisticPanel>
      </div>

      <section id="features" className="container mx-auto py-16 px-4">
        <header className="text-center mb-12">
          <h2 className="text-4xl font-extrabold tracking-tight text-foreground mb-3">
            Powerful <span className="text-accent">Application Features</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore the cutting-edge capabilities we've integrated to give you a great user experience.
          </p>
        </header>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon={<ZoomIn className="h-10 w-10 text-primary" />}
            title="Premium High-Resolution"
            description="Our application is designed to support high-resolution content for a crisp, professional-quality user experience."
            iconBgClass="bg-primary/10"
            iconTextClass="text-primary"
          />
          <FeatureCard
            icon={<SlidersHorizontal className="h-10 w-10 text-accent" />}
            title="Advanced Customization"
            description="Fine-tune your experience with a wide array of options and controls. Our intuitive interface gives you precise control."
            iconBgClass="bg-accent/10"
            iconTextClass="text-accent"
          />
          <FeatureCard
            icon={<BrainCircuit className="h-10 w-10 text-primary" />}
            title="Complex Logic Handling"
            description="Our backend understands nuanced and detailed requests, allowing for complex operations to be handled with ease."
            iconBgClass="bg-primary/10"
            iconTextClass="text-primary"
          />
           <FeatureCard
            icon={<Maximize className="h-10 w-10 text-accent" />}
            title="Flexible Aspect Ratios"
            description="Our UI supports various aspect ratios, from cinematic shots (16:9) to portraits (9:16), ensuring a perfect layout every time."
            iconBgClass="bg-accent/10"
            iconTextClass="text-accent"
          />
          <FeatureCard
            icon={<Grid className="h-10 w-10 text-accent" />}
            title="Rapid Quad-Variations"
            description="Experience fast performance with multiple variations presented instantly, speeding up your workflow."
            iconBgClass="bg-accent/10"
            iconTextClass="text-accent"
          />
        </div>
      </section>

      <TestimonialsSection />
      <PricingSection />
      <FaqSection />

    </main>
  );
}
