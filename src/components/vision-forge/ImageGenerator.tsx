
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  ASPECT_RATIOS,
  ARTISTIC_STYLES,
  MOODS,
  LIGHTING_OPTIONS,
  COLOR_PALETTES,
  QUALITY_OPTIONS
} from '@/lib/constants';
import { ImageDisplay } from './ImageDisplay';
import { FuturisticPanel } from './FuturisticPanel';
import { Wand2, Sparkles, XCircle, Loader2 } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { SubscriptionManager } from './SubscriptionManager';

const formSchema = z.object({
  prompt: z.string().trim().min(1, 'Prompt cannot be empty. Let your imagination flow!').max(2000, 'Prompt is too long.'),
});
type FormData = z.infer<typeof formSchema>;


// This client component will now safely wrap the SubscriptionManager and other hooks.
function ImageGeneratorClient() {
  const { toast } = useToast();
  const [generationCancelled, setGenerationCancelled] = useState(false);
  
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<string>(ASPECT_RATIOS[0].value);
  const [displayAspectRatio, setDisplayAspectRatio] = useState<string>(ASPECT_RATIOS[0].value);
  const numberOfImages = 4; // Hardcoded to match screenshot
  
  const [generatedImageUrls, setGeneratedImageUrls] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New states for dropdowns
  const [artisticStyle, setArtisticStyle] = useState<string>('photographic');
  const [mood, setMood] = useState<string>('none');
  const [lighting, setLighting] = useState<string>('none');
  const [colorPalette, setColorPalette] = useState<string>('none');
  const [quality, setQuality] = useState<string>('standard quality, 1080p');
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { prompt: '' },
  });
  
  const currentPrompt = watch('prompt');

  useEffect(() => {
    return () => {
      generatedImageUrls.forEach(url => {
        if (url.startsWith('blob:')) {
            URL.revokeObjectURL(url)
        }
      });
    };
  }, [generatedImageUrls]);

  const getConstructedPrompt = (): string => {
    const promptText = watch('prompt').trim();
    const parts = [
      promptText,
      artisticStyle,
      mood,
      lighting,
      colorPalette,
      quality,
    ];
    // Filter out any "none" values or empty strings before joining
    return parts.filter(part => part && part !== 'none').join(', ').trim();
  };

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setGenerationCancelled(false);
    setIsGenerating(true);
    setError(null);
    setGeneratedImageUrls([]);

    const constructedPrompt = getConstructedPrompt();

    if (!constructedPrompt) {
        setError('Prompt cannot be empty.');
        setIsGenerating(false);
        toast({ title: 'Error', description: 'Please enter a prompt to generate an image.', variant: 'destructive' });
        return;
    }

    try {
      const payload = {
        prompt: constructedPrompt,
        aspect: selectedAspectRatio,
        count: numberOfImages,
      };

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (generationCancelled) {
        console.log("Generation was cancelled by the user.");
        return;
      }
      
      if (!response.ok) {
        let errorMessage = `API Error: ${response.statusText} (${response.status})`;
        try {
            // Try to parse the error response as text first, as it might not be JSON
            const errorBody = await response.text();
            try {
                // Then, attempt to parse it as JSON
                const errorData = JSON.parse(errorBody);
                errorMessage = errorData.details || errorData.error || errorMessage;
            } catch (jsonError) {
                // If it's not JSON, the text itself might be the error message
                errorMessage = errorBody || errorMessage;
                console.error("API error response was not valid JSON. Body:", errorBody);
            }
        } catch (textError) {
             console.error("Could not read API error response body.", textError);
        }
        throw new Error(errorMessage);
      }
      
      const result = await response.json();

      if (!result.images || result.images.length === 0) {
        throw new Error('The API returned no images. Please try a different prompt.');
      }

      setGeneratedImageUrls(result.images);
      setDisplayAspectRatio(selectedAspectRatio);
      toast({ title: 'Vision Forged!', description: `Successfully generated ${result.images.length} image(s).` });

    } catch (e: any) {
      if (!generationCancelled) {
        console.error("Image generation failed:", e);
        const errorMessage = e.message || 'An unknown error occurred during image generation.';
        setError(errorMessage);
        toast({ title: 'Generation Failed', description: errorMessage, variant: 'destructive', duration: 9000 });
      }
    } finally {
      if (!generationCancelled) {
        setIsGenerating(false);
      }
    }
  };

  const handleRegenerate = () => {
     if(currentPrompt) {
        handleSubmit(onSubmit)();
     } else {
        toast({ title: 'Nothing to Regenerate', description: 'Enter a prompt to generate images.', variant: 'destructive' });
     }
  };

  const handleCopyPrompt = () => {
    const finalPrompt = getConstructedPrompt();
    if (!finalPrompt) return;
    navigator.clipboard.writeText(finalPrompt);
    toast({ title: 'Prompt Copied!', description: 'The final constructed prompt is copied to your clipboard.' });
  };

  const handleStopGeneration = () => {
    setGenerationCancelled(true);
    setIsGenerating(false);
    setError("Image generation was cancelled by the user.");
    toast({
        title: 'Generation Cancelled',
        description: 'The image generation process has been stopped.',
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-5 space-y-6">
        <FuturisticPanel>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex justify-end">
                <Suspense fallback={<Button variant="default" className="text-xs h-9 w-full md:w-auto bg-foreground text-background hover:bg-foreground/90" disabled><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading Plan...</Button>}>
                    <SubscriptionManager />
                </Suspense>
            </div>
            <div>
                <Label htmlFor="prompt" className="text-lg font-semibold text-foreground/90">
                  Enter your prompt
                </Label>
                <p className="text-sm text-muted-foreground mb-2">Describe the image you want to create in detail.</p>
                <div className="relative">
                  <Textarea
                    id="prompt"
                    {...register('prompt')}
                    placeholder="e.g., A majestic lion wearing a crown, sitting on a throne in a cosmic library..."
                    rows={4}
                    className="bg-background focus:border-primary focus:ring-primary text-base resize-none"
                    disabled={isGenerating}
                  />
                </div>
                {errors.prompt && <p className="text-sm text-destructive mt-1">{errors.prompt.message}</p>}
              </div>
              
              <Accordion type="single" collapsible defaultValue="item-1" className="w-full border-t pt-4">
                <AccordionItem value="item-1" className="border-b-0">
                  <AccordionTrigger className="text-base font-semibold hover:no-underline pt-0">
                    <Wand2 className="mr-2 h-5 w-5" /> Creative Tools
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <div>
                        <Label htmlFor="artistic-style" className="text-sm font-medium mb-2 block">Artistic Style</Label>
                        <Select value={artisticStyle} onValueChange={setArtisticStyle} disabled={isGenerating}>
                          <SelectTrigger id="artistic-style"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {ARTISTIC_STYLES.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="aspect-ratio" className="text-sm font-medium mb-2 block">Aspect Ratio</Label>
                        <Select value={selectedAspectRatio} onValueChange={setSelectedAspectRatio} disabled={isGenerating}>
                          <SelectTrigger id="aspect-ratio"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {ASPECT_RATIOS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="mood" className="text-sm font-medium mb-2 block">Mood</Label>
                        <Select value={mood} onValueChange={setMood} disabled={isGenerating}>
                          <SelectTrigger id="mood"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {MOODS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="lighting" className="text-sm font-medium mb-2 block">Lighting</Label>
                        <Select value={lighting} onValueChange={setLighting} disabled={isGenerating}>
                          <SelectTrigger id="lighting"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {LIGHTING_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="color-palette" className="text-sm font-medium mb-2 block">Color Palette</Label>
                        <Select value={colorPalette} onValueChange={setColorPalette} disabled={isGenerating}>
                          <SelectTrigger id="color-palette"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {COLOR_PALETTES.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                       <div>
                        <Label htmlFor="quality" className="text-sm font-medium mb-2 block">Quality</Label>
                        <Select value={quality} onValueChange={setQuality} disabled={isGenerating}>
                          <SelectTrigger id="quality"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {QUALITY_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
            </Accordion>
            
            <div className="flex w-full items-center gap-2 pt-4">
                {isGenerating ? (
                  <Button
                    type="button"
                    onClick={handleStopGeneration}
                    variant="destructive"
                    className="w-full text-lg py-3"
                  >
                    <XCircle size={20} className="mr-2" /> Stop
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="w-full text-base py-3 bg-foreground hover:bg-foreground/80 text-background transition-shadow hover:shadow-xl hover:shadow-primary/20"
                    disabled={!currentPrompt}
                  >
                    <Sparkles size={18} className="mr-2" />
                    Generate {numberOfImages} Images
                  </Button>
                )}
              </div>
          </form>
        </FuturisticPanel>
      </div>

      <div className="lg:col-span-7">
        <ImageDisplay
          imageUrls={generatedImageUrls}
          prompt={getConstructedPrompt()}
          aspectRatio={displayAspectRatio}
          isLoading={isGenerating}
          error={error}
          onRegenerate={handleRegenerate}
          onCopyPrompt={handleCopyPrompt}
          imageCount={numberOfImages}
        />
      </div>
    </div>
  );
}


// The main component remains a server component.
export function ImageGenerator() {
  // It now renders the client component which handles all state and effects.
  return <ImageGeneratorClient />;
}
