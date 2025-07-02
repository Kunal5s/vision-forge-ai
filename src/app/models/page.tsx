
import type { Metadata } from 'next';
import { BrainCircuit } from 'lucide-react';

export const metadata: Metadata = {
  title: 'AI Models | Imagen BrainAi',
  description: 'Explore the powerful and diverse AI models available in Imagen BrainAi.',
};

export default function ModelsPage() {
  return (
    <main className="container mx-auto py-16 px-4">
      <header className="text-center mb-12">
        <h1 className="text-5xl font-extrabold tracking-tight text-primary mb-4">
          Our AI <span className="text-accent">Models</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Our AI services are currently undergoing scheduled maintenance to bring you an even better experience.
        </p>
      </header>

      <div className="text-center">
        <BrainCircuit className="h-16 w-16 text-primary mx-auto mb-4" />
        <p className="text-lg text-muted-foreground">
          We are working on enhancing our model offerings. Please check back soon for updates.
        </p>
      </div>
    </main>
  );
}
