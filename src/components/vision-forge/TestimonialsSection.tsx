
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';

const testimonials = [
  {
    name: 'Aisha Khan',
    role: 'Digital Artist',
    avatar: 'https://placehold.co/100x100.png',
    dataAiHint: 'woman portrait',
    quote: "VisionForge AI has completely transformed my workflow. The quality is astounding, and the fine-tuning options make it an indispensable tool for any artist."
  },
  {
    name: 'Ben Carter',
    role: 'Game Developer',
    avatar: 'https://placehold.co/100x100.png',
    dataAiHint: 'man developer',
    quote: "The speed and variation are incredible! I can generate dozens of concept assets in minutes. The API access on the Mega plan is a game-changer for our studio."
  },
  {
    name: 'Chloe Garcia',
    role: 'Marketing Manager',
    avatar: 'https://placehold.co/100x100.png',
    dataAiHint: 'woman professional',
    quote: "We've elevated our social media content with unique, tailored, eye-catching visuals. It's so much more effective than stock photography. The results speak for themselves."
  }
];

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="bg-background py-16">
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
            <Card key={testimonial.name} className="glassmorphism-panel text-center">
              <CardContent className="pt-6">
                <p className="text-foreground/80 italic mb-4">"{testimonial.quote}"</p>
                <div className="flex items-center justify-center gap-3">
                    <Avatar>
                        <AvatarImage src={testimonial.avatar} alt={testimonial.name} data-ai-hint={testimonial.dataAiHint} />
                        <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold text-foreground">{testimonial.name}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
