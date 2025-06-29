
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
import { improvePrompt, type ImprovePromptInput, type ImprovePromptOutput } from '@/ai/flows/improve-prompt';
import { ASPECT_RATIOS, MODEL_GROUPS, GOOGLE_AI_MODELS, HF_MODELS } from '@/lib/constants';
import { ImageDisplay } from './ImageDisplay';
import { FuturisticPanel } from './FuturisticPanel';
import { Gem, AlertTriangle, ImageIcon as ImageIconIcon, RefreshCcw, XCircle, Sparkles, Lightbulb } from 'lucide-react';
import { useSubscription } from '@/hooks/use-subscription';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from './LoadingSpinner';

const formSchema = z.object({
  prompt: z.string().min(1, 'Prompt cannot be empty. Let your imagination flow!').max(2000, 'Prompt is too long.'),
  style: z.string().max(200, 'Style is too long.').optional(),
  mood: z.string().max(200, 'Mood is too long.').optional(),
  lighting: z.string().max(200, 'Lighting is too long.').optional(),
  color: z.string().max(200, 'Color is too long.').optional(),
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { register, handleSubmit, watch, setValue: setFormValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { prompt: '', style: '', mood: '', lighting: '', color: '' },
  });
  
  const currentPrompt = watch('prompt');

  const isPremiumFeature = useMemo(() => {
    const group = MODEL_GROUPS.find(g => g.models.some(m => m.value === activeModel));
    return group?.premium ?? false;
  }, [activeModel]);
  
  const showAdvancedOptions = useMemo(() => {
    const isGoogleModel = GOOGLE_AI_MODELS.some(m => m.value === activeModel);
    const isHfModel = HF_MODELS.some(m => m.value === activeModel);
    return isGoogleModel || isHfModel;
  }, [activeModel]);
  
  const isFreePlan = subscription?.plan === 'free';

  const constructFinalPrompt = (data: FormData): string => {
    let finalPrompt = data.prompt;
    if (showAdvancedOptions) {
        if (data.style) finalPrompt += `, in the style of ${data.style}`;
        if (data.mood) finalPrompt += `, ${data.mood} mood`;
        if (data.lighting) finalPrompt += `, ${data.lighting} lighting`;
        if (data.color) finalPrompt += `, color palette based on ${data.color}`;
    }
    return finalPrompt;
  };

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    if (isPremiumFeature && isFreePlan) {
      toast({
        title: 'Upgrade Required',
        description: 'You need a Pro or Mega plan to use this model. Please upgrade your plan.',
        variant: 'destructive',
      });
      return;
    }
    
    generationCancelled.current = false;
    setIsGenerating(true);
    setError(null);
    setGeneratedImageUrls([]);

    const finalPrompt = constructFinalPrompt(data);

    const generationParams: GenerateImageInput = { 
        prompt: finalPrompt,
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

    setIsGenerating(false);

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

  const handleImprovePrompt = async () => {
    if (!currentPrompt) {
        toast({ title: 'Prompt is empty', description: 'Please enter a prompt to improve.', variant: 'destructive' });
        return;
    }

    if (isFreePlan) {
      toast({ title: 'Upgrade Required', description: 'Prompt Improvement is a premium feature. Please upgrade.', variant: 'destructive'});
      return;
    }

    setIsImproving(true);
    const result: ImprovePromptOutput = await improvePrompt({ prompt: currentPrompt });
    setIsImproving(false);

    if (result.error) {
        toast({ title: 'Failed to Improve Prompt', description: result.error, variant: 'destructive' });
    } else if (result.improvedPrompt) {
        setFormValue('prompt', result.improvedPrompt);
        toast({ title: 'Prompt Improved!', description: result.reasoning });
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
    const finalPrompt = constructFinalPrompt(watch());
    if (!finalPrompt) return;
    navigator.clipboard.writeText(finalPrompt);
    toast({ title: 'Prompt Copied!', description: 'The final constructed prompt is copied to your clipboard.' });
  };
  
  const handleReset = () => {
    setFormValue('prompt', '');
    setFormValue('style', '');
    setFormValue('mood', '');
    setFormValue('lighting', '');
    setFormValue('color', '');
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
    setIsGenerating(false);
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
                <Select value={activeModel} onValueChange={setActiveModel} disabled={isSubLoading || isGenerating}>
                  <SelectTrigger id="model-select" className="w-full bg-background hover:bg-muted/50">
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    {MODEL_GROUPS.map(group => (
                      <SelectGroup key={group.label}>
                        <Label className='px-2 text-xs text-muted-foreground'>{group.label}</Label>
                        {group.models.map(model => (
                          <SelectItem key={model.value} value={model.value} disabled={group.premium && isFreePlan}>
                            <div className="flex items-center justify-between w-full">
                              <span className="flex items-center gap-2">
                                {model.label}
                                {group.premium && <Gem size={14} className="text-primary" />}
                              </span>
                              {group.premium && isFreePlan && <Badge variant="secondary">Upgrade</Badge>}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                    <Label htmlFor="prompt" className="text-lg font-semibold text-foreground/90">
                      Enter Your Vision
                    </Label>
                    <Button type="button" variant="ghost" size="sm" onClick={handleImprovePrompt} disabled={isImproving || isGenerating || !showAdvancedOptions || isFreePlan}>
                        {isImproving ? <LoadingSpinner size={16}/> : <Sparkles size={16} className="text-primary" />}
                        <span className="ml-2">Improve</span>
                    </Button>
                </div>
                <div className="relative">
                  <Textarea
                    id="prompt"
                    {...register('prompt')}
                    placeholder="e.g., A futuristic cityscape at sunset, neon lights reflecting on wet streets..."
                    rows={4}
                    className="bg-background border-input focus:border-primary focus:ring-primary text-base resize-none"
                    disabled={isGenerating}
                  />
                </div>
                {errors.prompt && <p className="text-sm text-destructive mt-1">{errors.prompt.message}</p>}
              </div>

              {showAdvancedOptions && (
                <div>
                  <Label className="text-lg font-semibold mb-2 block text-foreground/90">
                    Advanced Options
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input {...register('style')} placeholder="Artistic Style (e.g., cyberpunk)" disabled={isGenerating} />
                    <Input {...register('mood')} placeholder="Mood (e.g., mysterious)" disabled={isGenerating} />
                    <Input {...register('lighting')} placeholder="Lighting (e.g., cinematic)" disabled={isGenerating} />
                    <Input {...register('color')} placeholder="Color Palette (e.g., neon blue)" disabled={isGenerating} />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="aspect-ratio" className="text-sm font-semibold mb-1 block text-foreground/80">Aspect Ratio</Label>
                  <Select value={selectedAspectRatio} onValueChange={setSelectedAspectRatio} disabled={isGenerating}>
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
                        disabled={isGenerating}
                    >
                        <SelectTrigger id="num-images" className="w-full bg-background hover:bg-muted/50">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {imageCountOptions.map((opt) => (
                                <SelectItem key={opt.value} value={String(opt.value)} disabled={isPremiumFeature && isFreePlan && opt.value > 1}>{opt.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
              </div>
              
              <div className="flex w-full items-center gap-2">
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
                      disabled={isSubLoading || (isPremiumFeature && isFreePlan)}
                      className="w-full text-lg py-3 bg-primary hover:bg-primary/90 text-primary-foreground transition-shadow hover:shadow-xl hover:shadow-primary/20"
                    >
                      <ImageIconIcon size={20} className="mr-2" />
                      Forge Vision
                    </Button>
                  </>
                )}
              </div>
              {isPremiumFeature && isFreePlan && (
                <div className='text-center text-sm p-2 bg-muted rounded-md'>
                    <Lightbulb size={16} className="inline-block mr-2 text-primary" />
                    To use this model, please{' '}
                    <Link href="/pricing" className="underline text-primary">upgrade your plan</Link>.
                </div>
              )}
            </form>
          </FuturisticPanel>
        </div>

        <div className="lg:col-span-7">
          <ImageDisplay
            imageUrls={generatedImageUrls}
            prompt={constructFinalPrompt(watch())}
            aspectRatio={displayAspectRatio}
            isLoading={isGenerating}
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
