
import type { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BrainCircuit, Cpu, Gem } from 'lucide-react';
import { MODELS } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'AI Models | Imagen BrainAi',
  description: 'Explore the powerful and diverse AI models available in Imagen BrainAi for text-to-image generation.',
};

const getIconForType = (type: string) => {
    switch(type) {
        case 'gemini':
            return <Gem className="h-8 w-8 text-primary" />;
        case 'huggingface':
            return <Cpu className="h-8 w-8 text-accent" />;
        default:
            return <BrainCircuit className="h-8 w-8 text-secondary-foreground" />;
    }
}

export default function ModelsPage() {
  return (
    <main className="container mx-auto py-16 px-4">
      <header className="text-center mb-12">
        <h1 className="text-5xl font-extrabold tracking-tight text-primary mb-4">
          Our AI <span className="text-accent">Models</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          We leverage a suite of powerful AI models to provide a versatile and high-quality image generation experience.
        </p>
      </header>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {MODELS.map((model) => (
          <Card key={model.value} className="flex flex-col transition-shadow hover:shadow-lg">
            <CardHeader>
                <div className="flex items-center gap-4 mb-2">
                    {getIconForType(model.type)}
                    <CardTitle className="text-2xl">{model.label}</CardTitle>
                </div>
              <CardDescription className="capitalize text-primary font-semibold">{model.type} Model</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-muted-foreground">{model.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
