
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Check, Loader2, Sparkles } from 'lucide-react';

const categories = [
  'Prompts', 'Styles', 'Tutorials', 'Storybook', 'Usecases',
  'Inspiration', 'Trends', 'Technology', 'NFT', 'Featured'
];

export function OnDemandArticleGenerator() {
  const { toast } = useToast();
  const [loadingCategory, setLoadingCategory] = useState<string | null>(null);
  const [completedCategories, setCompletedCategories] = useState<string[]>([]);

  const handleGenerate = async (category: string) => {
    if (loadingCategory) {
        toast({
            title: 'Please Wait',
            description: `Already generating articles for "${loadingCategory}". Please wait for it to finish.`,
            variant: 'destructive',
        });
        return;
    }

    setLoadingCategory(category);
    toast({
        title: 'Starting Generation',
        description: `Generating 4 new articles for the "${category}" category. This may take a few minutes...`,
    });

    try {
      const response = await fetch('/api/generate-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to start generation.');
      }
      
      setCompletedCategories(prev => [...prev, category]);
      toast({
        title: 'Success!',
        description: `Successfully generated new articles for "${category}". They will appear at the top of the category page shortly.`,
      });

    } catch (error: any) {
      console.error(`Failed to generate articles for ${category}:`, error);
      toast({
        title: 'Generation Failed',
        description: error.message || `An error occurred while generating articles for "${category}".`,
        variant: 'destructive',
      });
    } finally {
      setLoadingCategory(null);
    }
  };

  return (
    <section className="py-16 bg-muted">
      <div className="container mx-auto px-4">
        <header className="text-center mb-12">
          <h2 className="text-4xl font-extrabold tracking-tight text-foreground">
            On-Demand Article Generator
          </h2>
          <p className="text-muted-foreground mt-2 max-w-3xl mx-auto">
            Manually trigger article generation for any category. Click a number to get 4 fresh articles.
          </p>
        </header>

        <div className="relative w-full max-w-lg mx-auto aspect-square flex items-center justify-center">
            {categories.map((category, index) => {
                const angle = (index / categories.length) * 2 * Math.PI;
                const radius = '45%'; // Use percentage for responsiveness
                const x = `calc(50% + ${radius} * ${Math.cos(angle)} - 24px)`;
                const y = `calc(50% + ${radius} * ${Math.sin(angle)} - 24px)`;
                const isLoading = loadingCategory === category;
                const isCompleted = completedCategories.includes(category);
                
                return (
                    <div 
                        key={category} 
                        className="absolute w-12 h-12"
                        style={{ left: x, top: y }}
                        title={`Generate articles for ${category}`}
                    >
                        <Button 
                            variant={isCompleted ? "default" : "outline"}
                            size="icon"
                            className={cn(
                                "rounded-full w-12 h-12 text-lg font-bold transition-all duration-300 transform hover:scale-110",
                                isLoading && "bg-primary text-primary-foreground animate-pulse",
                                isCompleted && "bg-primary text-primary-foreground border-2 border-primary-foreground/50"
                            )}
                            onClick={() => handleGenerate(category)}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin" />
                            ) : isCompleted ? (
                                <Check />
                            ) : (
                                index + 1
                            )}
                        </Button>
                    </div>
                );
            })}
             <div className="absolute flex flex-col items-center justify-center text-center">
                <Sparkles className="w-16 h-16 text-primary/50" />
                <p className="mt-2 text-sm text-muted-foreground font-semibold">Click to Generate</p>
            </div>
        </div>
      </div>
    </section>
  );
}
