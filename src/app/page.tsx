
import { ImageGenerator } from '@/components/vision-forge/ImageGenerator';
import { Wand2, Maximize, BrainCircuit, SlidersHorizontal, ZoomIn, Grid } from 'lucide-react';
import { FuturisticPanel } from '@/components/vision-forge/FuturisticPanel';
import { TestimonialsSection } from '@/components/vision-forge/TestimonialsSection';
import { PricingSection } from '@/components/vision-forge/PricingSection';
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
    <FuturisticPanel className="flex flex-col items-center text-center h-full glassmorphism-panel !p-4 md:!p-6">
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
          <h1 className="text-5xl font-extrabold tracking-tight text-primary">
              Imagen <span className="text-accent">BrainAi</span>
          </h1>
          <p className="mt-4 text-lg text-foreground/80 max-w-3xl mx-auto">
              Welcome to the future of creativity. Describe your vision, and our advanced AI, powered by Google's Imagen technology, will bring it to life in stunning detail. From photorealistic images to fantastical art, your imagination is the only limit. Get started for free and see what you can create.
          </p>
        </header>
        <ImageGenerator />
      </div>

      <section id="features" className="container mx-auto py-16 px-4">
        <header className="text-center mb-12">
          <h2 className="text-4xl font-extrabold tracking-tight text-primary mb-3">
            Latest & Trending <span className="text-accent">Features</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore the cutting-edge capabilities we've integrated to push the boundaries of your creativity.
          </p>
        </header>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon={<ZoomIn className="h-10 w-10 text-primary" />}
            title="Hyper-Detailed 4K Quality"
            description="Leveraging our enhanced prompting, generate images with breathtaking detail and sharpness. Our AI is instructed to aim for a 4K, ultra-detailed look for every creation."
            iconBgClass="bg-primary/10"
            iconTextClass="text-primary"
          />
          <FeatureCard
            icon={<SlidersHorizontal className="h-10 w-10 text-accent" />}
            title="Advanced Style & Mood Control"
            description="Go beyond simple prompts. Master the final image by dictating the exact artistic style, mood, lighting, and color palette with our non-negotiable directive system."
            iconBgClass="bg-accent/10"
            iconTextClass="text-accent"
          />
          <FeatureCard
            icon={<BrainCircuit className="h-10 w-10 text-primary" />}
            title="Complex Prompt Comprehension"
            description="Our AI understands nuanced and detailed prompts, allowing you to create complex scenes with multiple subjects and actions more accurately than ever before."
            iconBgClass="bg-primary/10"
            iconTextClass="text-primary"
          />
           <FeatureCard
            icon={<Maximize className="h-10 w-10 text-accent" />}
            title="Strict Aspect Ratio Adherence"
            description="Generate images that strictly adhere to your chosen aspect ratio. From widescreen cinematic shots (16:9) to tall portraits (9:16), get the perfect frame every time."
            iconBgClass="bg-accent/10"
            iconTextClass="text-accent"
          />
           <FeatureCard
            icon={<Wand2 className="h-10 w-10 text-primary" />}
            title="AI-Powered Prompt Enhancement"
            description="Stuck for ideas or need more detail? Let our AI assistant analyze your prompt and suggest improvements to unlock more creative and vivid results."
            iconBgClass="bg-primary/10"
            iconTextClass="text-primary"
          />
          <FeatureCard
            icon={<Grid className="h-10 w-10 text-accent" />}
            title="Rapid Quad-Variations"
            description="Get four unique, high-quality image variations from a single prompt in seconds. This gives you more creative options to choose from instantly, speeding up your workflow."
            iconBgClass="bg-accent/10"
            iconTextClass="text-accent"
          />
        </div>
      </section>

      <TestimonialsSection />
      <PricingSection />

    </main>
  );
}
