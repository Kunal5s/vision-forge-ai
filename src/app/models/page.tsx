
import type { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BrainCircuit, Cpu, Gem } from 'lucide-react';

export const metadata: Metadata = {
  title: 'AI Models | Imagen BrainAi',
  description: 'Explore the powerful and diverse AI models available in Imagen BrainAi for text-to-image generation.',
};

export default function ModelsPage() {
  return (
    <main className="container mx-auto py-16 px-4">
      <header className="text-center mb-12">
        <h1 className="text-5xl font-extrabold tracking-tight text-primary mb-4">
          Our AI <span className="text-accent">Model</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          We leverage a powerful, community-driven AI model to provide a versatile and high-quality image generation experience, optimized for speed and creativity.
        </p>
      </header>

      <div className="max-w-2xl mx-auto">
        <Card className="flex flex-col transition-shadow hover:shadow-lg">
            <CardHeader>
                <div className="flex items-center gap-4 mb-2">
                    <BrainCircuit className="h-8 w-8 text-primary" />
                    <CardTitle className="text-2xl">Community Model (Pollinations)</CardTitle>
                </div>
              <CardDescription className="capitalize text-primary font-semibold">Edge-Optimized Model</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-muted-foreground">
                Our application is powered by a fast, community-supported model from Pollinations. It is highly optimized to be compatible with modern serverless platforms like Vercel Edge and Cloudflare Pages, ensuring rapid image generation and a smooth user experience. This model is excellent for quick experiments, creative explorations, and generating a wide variety of artistic styles.
              </p>
            </CardContent>
          </Card>
      </div>
    </main>
  );
}
