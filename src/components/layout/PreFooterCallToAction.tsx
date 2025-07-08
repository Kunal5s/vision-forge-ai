
import Link from 'next/link';
import { Brain, SlidersHorizontal, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FuturisticPanel } from '@/components/vision-forge/FuturisticPanel';

export function PreFooterCallToAction() {
  return (
    <section className="py-12 md:py-16 bg-background">
      <div className="container mx-auto px-4">
        <FuturisticPanel className="!p-8 md:!p-12">
          <div className="max-w-xl">
            <p className="text-xl text-foreground mb-8">
              Imagen BrainAi empowers you with state-of-the-art tools to
              transform your imagination into stunning reality. Explore endless
              creative possibilities with our intuitive platform.
            </p>
            
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="/">
                Start Creating Now <ArrowRight size={20} className="ml-2" />
              </Link>
            </Button>
            
            <div className="space-y-8 w-full mt-12">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 p-3 bg-muted rounded-full">
                  <Brain className="h-6 w-6 text-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">Advanced AI Technology</h3>
                  <p className="text-sm text-muted-foreground">
                    Leverage a diverse range of sophisticated AI models for high-quality image generation. We continuously innovate to bring you the best creative tools.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 p-3 bg-muted rounded-full">
                  <SlidersHorizontal className="h-6 w-6 text-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">Intuitive & Powerful Editing</h3>
                  <p className="text-sm text-muted-foreground">
                    From generating unique visuals to fine-tuning details, our user-friendly interface provides comprehensive control over your creative process.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 p-3 bg-muted rounded-full">
                  <Sparkles className="h-6 w-6 text-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">Unleash Your Creativity</h3>
                  <p className="text-sm text-muted-foreground">
                    Whether you're a professional designer or exploring your artistic side, Imagen BrainAi is your partner in digital art creation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </FuturisticPanel>
      </div>
    </section>
  );
}
