
import type { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MODELS } from '@/lib/constants';
import { BrainCircuit, Cpu, Cog } from 'lucide-react';

export const metadata: Metadata = {
  title: 'AI Models | Imagen BrainAi',
  description: 'Explore the powerful and diverse AI models available in Imagen BrainAi, including Google Gemini, Stable Diffusion, OpenJourney, and more.',
};

const modelGroups = MODELS.reduce((acc, model) => {
  const typeKey = model.type === 'gemini' ? 'googleai' : (model.type === 'pollinations' ? 'community' : 'huggingface');
  if (!acc[typeKey]) {
    acc[typeKey] = [];
  }
  acc[typeKey].push(model);
  return acc;
}, {} as Record<string, typeof MODELS>);

const groupDetails: Record<string, { title: string; icon: React.ReactNode }> = {
    googleai: { title: 'Google AI', icon: <BrainCircuit className="h-8 w-8 text-primary" /> },
    huggingface: { title: 'Hugging Face Models', icon: <Cpu className="h-8 w-8 text-accent" /> },
    community: { title: 'Community Models', icon: <Cog className="h-8 w-8 text-muted-foreground" /> },
}

export default function ModelsPage() {
  return (
    <main className="container mx-auto py-16 px-4">
      <header className="text-center mb-12">
        <h1 className="text-5xl font-extrabold tracking-tight text-primary mb-4">
          Our AI <span className="text-accent">Models</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Imagen BrainAi harnesses the power of multiple cutting-edge text-to-image models to provide a diverse range of artistic styles and capabilities.
        </p>
      </header>

      <div className="space-y-12">
        {Object.entries(groupDetails).map(([key, details]) => (
            <section key={key}>
                <div className="flex items-center gap-4 mb-6">
                    {details.icon}
                    <h2 className="text-3xl font-semibold text-foreground">{details.title}</h2>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {modelGroups[key]?.map(model => (
                        <Card key={model.value} className="transition-shadow hover:shadow-lg flex flex-col bg-card">
                            <CardHeader>
                                <CardTitle>{model.label}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <p className="text-muted-foreground">{model.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>
        ))}
      </div>
    </main>
  );
}
