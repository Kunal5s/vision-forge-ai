
import { Card, CardContent } from '@/components/ui/card';
import { Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Aisha Khan',
    role: 'Digital Artist',
    quote: "Imagen BrainAi has completely transformed my workflow. The quality is astounding, and the fine-tuning options make it an indispensable tool for any artist."
  },
  {
    name: 'Ben Carter',
    role: 'Game Developer',
    quote: "The speed and variation are incredible! I can generate dozens of concept assets in minutes. The API access on the Mega plan is a game-changer for our studio."
  },
  {
    name: 'Chloe Garcia',
    role: 'Marketing Manager',
    quote: "We've elevated our social media content with unique, tailored, eye-catching visuals. It's so much more effective than stock photography. The results speak for themselves."
  }
];

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="bg-muted py-16">
      <div className="container mx-auto px-4">
        <header className="text-center mb-12">
            <h2 className="text-4xl font-extrabold tracking-tight text-primary">
                Loved by <span className="text-accent">Creatives</span>
            </h2>
            <p className="text-lg text-muted-foreground mt-2">
                Don't just take our word for it. Here's what our users are saying.
            </p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.name} className="bg-background text-center flex flex-col h-full shadow-none border animate-breathing-glow">
              <CardContent className="pt-10 relative flex-grow flex flex-col justify-between">
                <Quote className="absolute top-4 left-4 h-10 w-10 text-primary/20" />
                <blockquote className="text-foreground/80 mb-6 flex-grow text-left">
                  {testimonial.quote}
                </blockquote>
                <footer className="mt-auto">
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </footer>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
