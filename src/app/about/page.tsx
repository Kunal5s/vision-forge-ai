
import type { Metadata } from 'next';
import Image from 'next/image';
import { Sparkles, Cpu, Lightbulb } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us | Imagen BrainAi AI Art Generator',
  description: 'Discover the mission, vision, and technology behind Imagen BrainAi. We are dedicated to revolutionizing creative workflows with our powerful AI-powered image generation tool.',
};

export default function AboutPage() {
  return (
    <main className="container mx-auto py-16 px-4">
      <header className="text-center mb-12">
        <h1 className="text-5xl font-extrabold tracking-tight text-primary mb-4">
          About Imagen <span className="text-accent">BrainAi</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          We are passionate about unlocking human creativity with our powerful AI image generator. Learn how Imagen BrainAi is shaping the future of AI-generated art and design.
        </p>
      </header>

      <div className="space-y-12">
        <section>
          <div>
            <h2 className="text-3xl font-semibold text-foreground mb-4">Our Mission</h2>
            <p className="text-lg text-foreground/80 mb-4">
              At Imagen BrainAi, our mission is to democratize creativity by providing an intuitive and powerful AI art generator that enables anyone to bring their imaginative visions to life. We believe that text-to-image technology should serve as a catalyst for innovation, breaking down barriers and opening up new possibilities for artists, designers, marketers, and dreamers alike.
            </p>
            <p className="text-lg text-foreground/80">
              We strive to build a platform that is not only technologically advanced, leveraging the cutting-edge capabilities of multiple AI models, but also user-friendly and accessible. Our goal is to empower you to create stunning, unique AI-generated images with unprecedented ease and control.
            </p>
          </div>
        </section>

        <section className="bg-muted p-8 rounded-xl">
          <h2 className="text-3xl font-semibold text-foreground mb-6 text-center">What Our AI Image Generator Offers</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="flex flex-col items-center text-center p-4">
              <div className="p-3 bg-primary/10 rounded-full mb-4">
                <Sparkles className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Stunning Image Generation</h3>
              <p className="text-sm text-muted-foreground">
                Leverage the power of multiple AI models to generate high-quality, diverse, and coherent images from simple text prompts. From photorealistic scenes to fantastical illustrations, your imagination is the only limit.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-4">
              <div className="p-3 bg-accent/10 rounded-full mb-4">
                <Cpu className="h-10 w-10 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Advanced Customization</h3>
              <p className="text-sm text-muted-foreground">
                Fine-tune your AI-generated creations with a wide array of options including aspect ratios, artistic styles, moods, lighting, and color palettes. Our intuitive interface gives you precise control.
              </p>
            </div>
          </div>
        </section>
        
        <section>
          <h2 className="text-3xl font-semibold text-foreground mb-4">Our Vision for the Future</h2>
          <p className="text-lg text-foreground/80 mb-4">
            We envision a future where AI acts as a seamless partner in the creative process, augmenting human ingenuity rather than replacing it. Imagen BrainAi is committed to continuous innovation, exploring new AI capabilities, and expanding our toolset to support an ever-wider range of creative endeavors in the text-to-art space.
          </p>
          <p className="text-lg text-foreground/80">
            Join us on this exciting journey as we continue to push the boundaries of what's possible with AI and art. Your feedback and creativity are integral to our growth and evolution. Together, let's create new realities.
          </p>
        </section>
      </div>
    </main>
  );
}
