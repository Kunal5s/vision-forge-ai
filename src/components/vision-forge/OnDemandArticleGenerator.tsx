
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Check, Loader2, Sparkles } from 'lucide-react';
import { categorySlugMap } from '@/lib/constants';

const categories = Object.keys(categorySlugMap).filter(slug => slug !== 'featured');

interface Position {
  left: string;
  top: string;
}

export function OnDemandArticleGenerator() {
  const { toast } = useToast();
  const [loadingCategory, setLoadingCategory] = useState<string | null>(null);
  const [completedCategories, setCompletedCategories] = useState<string[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);

  useEffect(() => {
    // This calculation is now deferred until the component mounts on the client.
    // This prevents server-client mismatch (hydration error).
    const calculatePositions = () => {
      return categories.map((_, index) => {
        const angle = (index / categories.length) * 2 * Math.PI;
        const radius = '45%';
        const x = `calc(50% + ${radius} * ${Math.cos(angle)} - 24px)`;
        const y = `calc(50% + ${radius} * ${Math.sin(angle)} - 24px)`;
        return { left: x, top: y };
      });
    };
    setPositions(calculatePositions());
  }, []); // Empty dependency array ensures this runs only once on the client.

  const handleGenerate = async (categorySlug: string) => {
    if (loadingCategory) {
        toast({
            title: 'Please Wait',
            description: `Already generating articles for "${loadingCategory}". Please wait for it to finish.`,
            variant: 'destructive',
        });
        return;
    }
    
    const categoryName = categorySlugMap[categorySlug];
    if (!categoryName) return;

    setLoadingCategory(categoryName);
    toast({
        title: 'Starting Generation',
        description: `Generating 4 new articles for the "${categoryName}" category. This may take a few minutes...`,
    });

    try {
      const response = await fetch('/api/generate-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: categoryName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to start generation.');
      }
      
      setCompletedCategories(prev => [...prev, categorySlug]);
      toast({
        title: 'Success!',
        description: `Successfully generated new articles for "${categoryName}". They will appear at the top of the category page shortly.`,
      });

    } catch (error: any) {
      console.error(`Failed to generate articles for ${categoryName}:`, error);
      toast({
        title: 'Generation Failed',
        description: error.message || `An error occurred while generating articles for "${categoryName}".`,
        variant: 'destructive',
      });
    } finally {
      setLoadingCategory(null);
    }
  };
  
  // If positions aren't calculated yet, render a placeholder or nothing to avoid the error
  if (positions.length === 0) {
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
                <Loader2 className="w-16 h-16 text-primary/50 animate-spin" />
            </div>
          </div>
        </section>
    );
  }

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
            {categories.map((categorySlug, index) => {
                const position = positions[index];
                const categoryName = categorySlugMap[categorySlug];
                const isLoading = loadingCategory === categoryName;
                const isCompleted = completedCategories.includes(categorySlug);
                
                return (
                    <div 
                        key={categorySlug} 
                        className="absolute w-12 h-12"
                        style={{ left: position.left, top: position.top }}
                        title={`Generate articles for ${categoryName}`}
                    >
                        <Button 
                            variant={isCompleted ? "default" : "outline"}
                            size="icon"
                            className={cn(
                                "rounded-full w-12 h-12 text-lg font-bold transition-all duration-300 transform hover:scale-110",
                                isLoading && "bg-primary text-primary-foreground animate-pulse",
                                isCompleted && "bg-green-500 hover:bg-green-600 text-white border-2 border-primary-foreground/50"
                            )}
                            onClick={() => handleGenerate(categorySlug)}
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
