
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Paintbrush, SlidersHorizontal, Layers, Zap, BookOpen } from 'lucide-react';

const features = [
  {
    icon: <Bot className="h-8 w-8 text-primary" />,
    title: 'Advanced Text-to-Image AI',
    description: 'Our core engine turns your words into breathtaking art. By leveraging cutting-edge diffusion models, we offer unparalleled quality and prompt understanding, enabling you to create everything from photorealistic portraits to fantastical landscapes.',
  },
  {
    icon: <Paintbrush className="h-8 w-8 text-primary" />,
    title: 'Diverse Artistic Styles',
    description: 'Don\'t settle for one look. Our platform provides a vast library of artistic styles. Choose from digital art, anime, fantasy, cartoon, 3D renders, and classic mediums like oil painting or watercolor to give your creation the perfect aesthetic.',
  },
  {
    icon: <SlidersHorizontal className="h-8 w-8 text-primary" />,
    title: 'Fine-Tuned Creative Control',
    description: 'You are the director. Control the mood, lighting, color palette, and quality of your generations. Our intuitive creative tools allow for precise adjustments, ensuring the final image aligns perfectly with your creative vision.',
  },
  {
    icon: <Layers className="h-8 w-8 text-primary" />,
    title: 'Multiple Aspect Ratios',
    description: 'Create for any platform. Whether you need a square image for Instagram, a widescreen (16:9) banner for your website, or a portrait (9:16) for mobile stories, our generator supports a wide range of aspect ratios for perfect compositions.',
  },
  {
    icon: <Zap className="h-8 w-8 text-primary" />,
    title: 'Rapid Generation & Iteration',
    description: 'Creativity shouldn\'t have to wait. Our optimized engine delivers multiple high-quality image variations in seconds, allowing you to iterate on your ideas quickly and explore different creative paths without friction.',
  },
  {
    icon: <BookOpen className="h-8 w-8 text-primary" />,
    title: 'Rich Educational Content',
    description: 'We believe in empowering our users. Our site is filled with automatically updated articles and tutorials on prompt engineering, artistic styles, and creative strategies, helping you master the art of AI generation and stay ahead of the trends.',
  },
];

export function FeaturesHighlightSection() {
  return (
    <section className="py-16 bg-muted">
      <div className="container mx-auto px-4">
        <header className="text-center mb-12">
          <h2 className="text-4xl font-extrabold tracking-tight text-foreground">
            A Universe of Creative Possibilities
          </h2>
          <p className="text-muted-foreground mt-2 max-w-3xl mx-auto">
            Imagen BrainAi is more than just a text-to-image tool. It's a comprehensive creative suite designed to supercharge your workflow and unlock your artistic potential.
          </p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="bg-background text-left transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-muted rounded-lg">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl font-semibold text-foreground">
                    {feature.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
