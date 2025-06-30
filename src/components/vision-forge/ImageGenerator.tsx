
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
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { generateImage, type GenerateImageInput } from '@/ai/flows/generate-image';
import { ASPECT_RATIOS, STYLES, MOODS, LIGHTING, COLOURS, MODELS } from '@/lib/constants';
import { ImageDisplay } from './ImageDisplay';
import { FuturisticPanel } from './FuturisticPanel';
import { ImageIcon as ImageIconIcon, RefreshCcw, XCircle, Bot } from 'lucide-react';
import { useSubscription } from '@/hooks/use-subscription';
import { StyleSelector } from './StyleSelector';
import { ScrollArea } from '../ui/scroll-area';

const formSchema = z.object({
  prompt: z.string().min(1, 'Prompt cannot be empty. Let your imagination flow!').max(2000, 'Prompt is too long.'),
});
type FormData = z.infer<typeof formSchema>;

const imageCountOptions = [
    { label: '1 Image', value: 1 },
    { label: '2 Images', value: 2 },
    { label: '4 Images', value: 4 },
];

export function ImageGenerator() {
  const { toast } = useToast();
  const { subscription } = useSubscription();
  const generationCancelled = useRef(false);
  
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<string>(ASPECT_RATIOS[0].value);
  const [displayAspectRatio, setDisplayAspectRatio] = useState<string>(ASPECT_RATIOS[0].value);
  const [numberOfImages, setNumberOfImages] = useState<number>(1);
  const [selectedModel, setSelectedModel] = useState<string>(MODELS[0].value);
  
  const [generatedImageUrls, setGeneratedImageUrls] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New state for visual selectors
  const [selectedStyle, setSelectedStyle] = useState<string>('');
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [selectedLighting, setSelectedLighting] = useState<string>('');
  const [selectedColour, setSelectedColour] = useState<string>('');
  
  const { register, handleSubmit, watch, setValue: setFormValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { prompt: '' },
  });
  
  const currentPrompt = watch('prompt');

  const constructFinalPrompt = (data: FormData): string => {
    let finalPrompt = data.prompt;
    if (selectedStyle) finalPrompt += `, ${selectedStyle} style`;
    if (selectedMood) finalPrompt += `, ${selectedMood} mood`;
    if (selectedLighting) finalPrompt += `, ${selectedLighting} lighting`;
    if (selectedColour) finalPrompt += `, ${selectedColour} color palette`;
    return finalPrompt;
  };

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    generationCancelled.current = false;
    setIsGenerating(true);
    setError(null);
    
    setGeneratedImageUrls([]);

    const finalPrompt = constructFinalPrompt(data);

    const generationParams: GenerateImageInput = { 
        prompt: finalPrompt,
        aspectRatio: selectedAspectRatio,
        numberOfImages: numberOfImages,
        model: selectedModel,
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
    setSelectedStyle('');
    setSelectedMood('');
    setSelectedLighting('');
    setSelectedColour('');
    setSelectedAspectRatio(ASPECT_RATIOS[0].value);
    setDisplayAspectRatio(ASPECT_RATIOS[0].value);
    setNumberOfImages(1);
    setSelectedModel(MODELS[0].value);
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

  const selectedModelData = MODELS.find(m => m.value === selectedModel) || MODELS[0];

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-6">
          <FuturisticPanel>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <ScrollArea className="h-[calc(100vh-200px)] pr-4">
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                      <Label htmlFor="prompt" className="text-lg font-semibold text-foreground/90">
                        Enter Your Vision
                      </Label>
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

                <div>
                  <Label htmlFor="model-selector" className="text-lg font-semibold text-foreground/90 mb-2 block">
                    Choose Your Engine
                  </Label>
                   <Select value={selectedModel} onValueChange={setSelectedModel} disabled={isGenerating}>
                      <SelectTrigger id="model-selector" className="w-full bg-background hover:bg-muted/50 h-auto">
                        <SelectValue>
                          <div className="flex items-center gap-3 py-1">
                            <Bot className="h-5 w-5 text-primary" />
                            <div className='text-left'>
                              <p className="font-semibold text-foreground">{selectedModelData.label}</p>
                              <p className="text-xs text-muted-foreground">{selectedModelData.description}</p>
                            </div>
                          </div>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {MODELS.map((model) => (
                          <SelectItem key={model.value} value={model.value}>
                            <div className='flex flex-col'>
                              <span className='font-semibold'>{model.label}</span>
                              <span className='text-xs text-muted-foreground'>{model.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                </div>

                <div className='space-y-4'>
                    <StyleSelector title="Styles" options={STYLES} selectedValue={selectedStyle} onSelect={setSelectedStyle} />
                    <StyleSelector title="Moods" options={MOODS} selectedValue={selectedMood} onSelect={setSelectedMood} />
                    <StyleSelector title="Lighting" options={LIGHTING} selectedValue={selectedLighting} onSelect={setSelectedLighting} />
                    <StyleSelector title="Colours" options={COLOURS} selectedValue={selectedColour} onSelect={setSelectedColour} />
                </div>

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
                                  <SelectItem key={opt.value} value={String(opt.value)}>{opt.label}</SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                  </div>
                </div>
              
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
                        className="w-full text-lg py-3 bg-primary hover:bg-primary/90 text-primary-foreground transition-shadow hover:shadow-xl hover:shadow-primary/20"
                      >
                        <ImageIconIcon size={20} className="mr-2" />
                        Forge Vision
                      </Button>
                    </>
                  )}
                </div>
              </div>
              </ScrollArea>
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
