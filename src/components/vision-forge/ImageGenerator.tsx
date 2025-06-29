
'use client';

import { useState, useEffect, useRef } from 'react';
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
  SelectGroup,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { generateImage, type GenerateImageInput } from '@/ai/flows/generate-image';
import { ASPECT_RATIOS, MODEL_GROUPS } from '@/lib/constants';
import { ImageDisplay } from './ImageDisplay';
import { FuturisticPanel } from './FuturisticPanel';
import { Gem, AlertTriangle, ImageIcon as ImageIconIcon, RefreshCcw, XCircle } from 'lucide-react';
import { useSubscription } from '@/hooks/use-subscription';
import Link from 'next/link';

const formSchema = z.object({
  prompt: z.string().min(1, 'Prompt cannot be empty. Let your imagination flow!').max(1000, 'Prompt is too long.'),
});
type FormData = z.infer<typeof formSchema>;

const imageCountOptions = [
    { label: '1 Image', value: 1 },
    { label: '2 Images', value: 2 },
    { label: '4 Images', value: 4 },
    { label: '6 Images', value: 6 },
];

export function ImageGenerator() {
  const { toast } = useToast();
  const { subscription, isLoading: isSubLoading } = useSubscription();
  const generationCancelled = useRef(false);
  
  const [activeModel, setActiveModel] = useState<string>(MODEL_GROUPS[0].models[0].value);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<string>(ASPECT_RATIOS[0].value);
  const [displayAspectRatio, setDisplayAspectRatio] = useState<string>(ASPECT_RATIOS[0].value);
  const [numberOfImages, setNumberOfImages] = useState<number>(1);
  
  const [generatedImageUrls, setGeneratedImageUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { register, handleSubmit, watch, setValue: setFormValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { prompt: '' },
  });
  const currentPrompt = watch('prompt');

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    generationCancelled.current = false;
    setIsLoading(true);
    setError(null);

    const generationParams: GenerateImageInput = { 
        prompt: data.prompt,
        plan: subscription?.plan || 'free',
        aspectRatio: selectedAspectRatio,
        model: activeModel,
        numberOfImages: numberOfImages,
     };
    const result = await generateImage(generationParams);
    
    if (generationCancelled.current) {
        console.log("Generation was cancelled by the user. Results ignored.");
        return;
    }

    setIsLoading(false);

    if (result.error) {
      setError(result.error);
      toast({ title: 'Generation Failed', description: result.error, variant: 'destructive', duration: 9000 });
    } else if (result.imageUrls && result.imageUrls.length > 0) {
      setGeneratedImageUrls(result.imageUrls);
      setDisplayAspectRatio(selectedAspectRatio);
      
      toast({ title: 'Vision Forged!', description: `Your image(s) have been successfully generated.` });
    } else {
      setError('The API returned no images. This can happen with very specific or unusual search terms.');
      setGeneratedImageUrls([]);
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
    if (!currentPrompt) return;
    navigator.clipboard.writeText(currentPrompt);
    toast({ title: 'Prompt Copied!', description: 'The current prompt is copied to your clipboard.' });
  };
  
  const handleReset = () => {
    setFormValue('prompt', '');
    setActiveModel(MODEL_GROUPS[0].models[0].value);
    setSelectedAspectRatio(ASPECT_RATIOS[0].value);
    setDisplayAspectRatio(ASPECT_RATIOS[0].value);
    setNumberOfImages(1);
    setGeneratedImageUrls([]);
    setError(null);
    toast({ title: 'Form Reset', description: 'All settings have been reset to their defaults.' });
  };

  const handleStopGeneration = () => {
    generationCancelled.current = true;
    setIsLoading(false);
    setError("Image generation was cancelled by the user.");
    toast({
        title: 'Generation Cancelled',
        description: 'The image generation process has been stopped.',
    });
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-6">
          <FuturisticPanel>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <Label htmlFor="model-select" className="text-lg font-semibold mb-2 block text-foreground/90">
                  Model
                </Label>
                <Select value={activeModel} onValueChange={setActiveModel}>
                  <SelectTrigger id="model-select" className="w-full bg-background hover:bg-muted/50">
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    {MODEL_GROUPS.map(group => (
                      <SelectGroup key={group.label}>
                        {group.models.map(model => (
                          <SelectItem key={model.value} value={model.value}>
                            <div className="flex items-center gap-2">
                              {model.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-2">
                  Powered by the Pexels API.
                </p>
              </div>

              <div>
                <Label htmlFor="prompt" className="text-lg font-semibold mb-2 block text-foreground/90">
                  Enter Your Vision
                </Label>
                <div className="relative">
                  <Textarea
                    id="prompt"
                    {...register('prompt')}
                    placeholder="e.g., A futuristic cityscape at sunset, neon lights reflecting on wet streets..."
                    rows={4}
                    className="bg-background border-input focus:border-primary focus:ring-primary text-base resize-none"
                  />
                </div>
                {errors.prompt && <p className="text-sm text-destructive mt-1">{errors.prompt.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="aspect-ratio" className="text-sm font-semibold mb-1 block text-foreground/80">Aspect Ratio</Label>
                  <Select value={selectedAspectRatio} onValueChange={setSelectedAspectRatio}>
                    <SelectTrigger id="aspect-ratio" className="w-full bg-background hover:bg-muted/50">
                      <SelectValue placeholder="Select aspect ratio" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {ASPECT_RATIOS.map((ratio) => (
                        <SelectItem key={ratio.value} value={ratio.value}>
                          {ratio.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                    <Label htmlFor="num-images" className="text-sm font-semibold mb-1 block text-foreground/80">Number of Images</Label>
                    <Select 
                        value={String(numberOfImages)} 
                        onValueChange={(val) => setNumberOfImages(Number(val))}
                    >
                        <SelectTrigger id="num-images" className="w-full bg-background hover:bg-muted/50">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {imageCountOptions.map((opt) => (
                                <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
              </div>
              
              <div className="flex w-full items-center gap-2">
                {isLoading ? (
                  <Button
                    type="button"
                    onClick={handleStopGeneration}
                    variant="destructive"
                    className="w-full text-lg py-3"
                  >
                    <XCircle size={20} className="mr-2" /> Stop
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      onClick={handleReset}
                      variant="outline"
                      className="text-lg py-3"
                      title="Reset all settings to default"
                    >
                      <RefreshCcw size={20} />
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubLoading}
                      className="w-full text-lg py-3 bg-primary hover:bg-primary/90 text-primary-foreground transition-shadow hover:shadow-xl hover:shadow-primary/20"
                    >
                      <ImageIconIcon size={20} className="mr-2" />
                      Forge Vision
                    </Button>
                  </>
                )}
              </div>
            </form>
          </FuturisticPanel>
        </div>

        <div className="lg:col-span-7">
          <ImageDisplay
            imageUrls={generatedImageUrls}
            prompt={currentPrompt}
            aspectRatio={displayAspectRatio}
            isLoading={isLoading}
            error={error}
            onRegenerate={handleRegenerate}
            onCopyPrompt={handleCopyPrompt}
            userPlan={subscription?.plan || 'free'}
          />
        </div>
      </div>
    </>
  );
}
