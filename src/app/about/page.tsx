
import type { Metadata } from 'next';
import Image from 'next/image';
import { Sparkles, Cpu, Lightbulb } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us | VisionForge AI',
  description: 'Discover the mission, vision, and technology behind VisionForge AI. We are dedicated to revolutionizing creative workflows with AI-powered image generation.',
};

export default function AboutPage() {
  return (
    <main className="container mx-auto py-16 px-4">
      <header className="text-center mb-12">
        <h1 className="text-5xl font-extrabold tracking-tight text-primary mb-4">
          About Vision<span className="text-accent">Forge</span> AI
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          We are passionate about unlocking human creativity through the power of artificial intelligence. Learn how VisionForge AI is shaping the future of digital art and design.
        </p>
      </header>

      <div className="space-y-12">
        <section className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-3xl font-semibold text-foreground mb-4">Our Mission</h2>
            <p className="text-lg text-foreground/80 mb-4">
              At VisionForge AI, our mission is to democratize creativity by providing intuitive and powerful AI tools that enable anyone to bring their imaginative visions to life. We believe that technology should serve as a catalyst for innovation, breaking down barriers and opening up new possibilities for artists, designers, marketers, and dreamers alike.
            </p>
            <p className="text-lg text-foreground/80">
              We strive to build a platform that is not only technologically advanced, leveraging the cutting-edge capabilities of models like Google's Imagen 3, but also user-friendly and accessible. Our goal is to empower you to create stunning, unique visuals with unprecedented ease and control.
            </p>
          </div>
          <div className="relative h-64 md:h-80 rounded-xl overflow-hidden shadow-xl">
            <Image src="https://placehold.co/600x400.png" alt="Abstract AI art" layout="fill" objectFit="cover" data-ai-hint="abstract technology" />
          </div>
        </section>

        <section className="bg-card/50 p-8 rounded-xl shadow-lg">
          <h2 className="text-3xl font-semibold text-foreground mb-6 text-center">What We Offer</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-4">
              <div className="p-3 bg-primary/10 rounded-full mb-4">
                <Sparkles className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Stunning Image Generation</h3>
              <p className="text-sm text-muted-foreground">
                Leverage the power of Google's Imagen 3 to generate high-quality, diverse, and coherent images from simple text prompts. From photorealistic scenes to fantastical illustrations, the only limit is your imagination.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-4">
              <div className="p-3 bg-accent/10 rounded-full mb-4">
                <Cpu className="h-10 w-10 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Advanced Customization</h3>
              <p className="text-sm text-muted-foreground">
                Fine-tune your creations with a wide array of options including aspect ratios, artistic styles, moods, lighting, and color palettes. Our intuitive interface gives you precise control over the final output.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-4">
              <div className="p-3 bg-primary/10 rounded-full mb-4">
                 <Lightbulb className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">AI-Powered Prompt Assistance</h3>
              <p className="text-sm text-muted-foreground">
                Not sure how to phrase your idea? Our AI-powered prompt improvement feature helps you refine your text descriptions to achieve more accurate and compelling results, unlocking the full potential of the AI model.
              </p>
            </div>
          </div>
        </section>
        
        <section>
          <h2 className="text-3xl font-semibold text-foreground mb-4">Our Vision for the Future</h2>
          <p className="text-lg text-foreground/80 mb-4">
            We envision a future where AI acts as a seamless partner in the creative process, augmenting human ingenuity rather than replacing it. VisionForge AI is committed to continuous innovation, exploring new AI capabilities, and expanding our toolset to support an ever-wider range of creative endeavors.
          </p>
          <p className="text-lg text-foreground/80">
            Join us on this exciting journey as we continue to push the boundaries of what's possible with AI and art. Your feedback and creativity are integral to our growth and evolution. Together, let's forge new realities.
          </p>
        </section>
      </div>
    </main>
  );
}
