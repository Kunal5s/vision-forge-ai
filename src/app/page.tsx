
import { ImageGenerator } from '@/components/vision-forge/ImageGenerator';
import { Sparkles, Cpu, Lightbulb, Palette, Maximize, Brain } from 'lucide-react'; // Added Palette, Maximize, Brain for more variety
import { FuturisticPanel } from '@/components/vision-forge/FuturisticPanel';

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
      <ImageGenerator />

      <section className="container mx-auto py-16 px-4">
        <header className="text-center mb-12">
          <h2 className="text-4xl font-extrabold tracking-tight text-primary mb-3">
            Discover What Vision<span className="text-accent">Forge</span> AI Offers
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Unlock a new era of creativity with our powerful and intuitive AI image generation platform.
          </p>
        </header>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Sparkles className="h-10 w-10 text-primary" />}
            title="Stunning Image Generation"
            description="Leverage the power of advanced AI models to generate high-quality, diverse, and coherent images from simple text prompts. From photorealistic scenes to fantastical illustrations, the only limit is your imagination."
            iconBgClass="bg-primary/10"
            iconTextClass="text-primary"
          />
          <FeatureCard
            icon={<Palette className="h-10 w-10 text-accent" />} // Changed icon
            title="Advanced Customization"
            description="Fine-tune your creations with a wide array of options including aspect ratios, artistic styles (e.g., 3D, Anime, Realistic), moods (e.g., Cyberpunk, Dreamy), lighting, and color palettes. Our intuitive interface gives you precise control."
            iconBgClass="bg-accent/10"
            iconTextClass="text-accent"
          />
          <FeatureCard
            icon={<Brain className="h-10 w-10 text-primary" />} // Changed icon
            title="AI-Powered Prompt Assistance"
            description="Not sure how to phrase your idea? Our AI-powered prompt improvement feature helps you refine your text descriptions to achieve more accurate and compelling results, unlocking the full potential of the AI model."
            iconBgClass="bg-primary/10"
            iconTextClass="text-primary"
          />
           <FeatureCard
            icon={<Maximize className="h-10 w-10 text-accent" />}
            title="Flexible Aspect Ratios"
            description="Choose from a wide range of aspect ratios like 1:1 (Square), 16:9 (Widescreen), 4:3 (Standard), 9:16 (Tall Portrait) and more, to perfectly fit your creative needs, whether for social media, presentations, or art projects."
            iconBgClass="bg-accent/10"
            iconTextClass="text-accent"
          />
           <FeatureCard
            icon={<Cpu className="h-10 w-10 text-primary" />}
            title="Cutting-Edge AI Models"
            description="Powered by Google's state-of-the-art Imagen 3 technology, VisionForge AI delivers exceptional image quality, coherence, and prompt understanding, pushing the boundaries of AI-generated art."
            iconBgClass="bg-primary/10"
            iconTextClass="text-primary"
          />
          <FeatureCard
            icon={<Lightbulb className="h-10 w-10 text-accent" />}
            title="Intuitive User Experience"
            description="Designed for both beginners and professionals, our user-friendly interface makes it easy to navigate options, manage your creations with a usage history, and bring your visions to life without a steep learning curve."
            iconBgClass="bg-accent/10"
            iconTextClass="text-accent"
          />
        </div>
      </section>
    </main>
  );
}
