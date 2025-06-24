
'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { generateImage, type GenerateImageInput } from '@/ai/flows/generate-image';
import { improvePrompt, type ImprovePromptOutput } from '@/ai/flows/improve-prompt';
import { ASPECT_RATIOS, STYLES, MOODS, LIGHTING_OPTIONS, COLOR_OPTIONS } from '@/lib/constants';
import type { GeneratedImageHistoryItem } from '@/types';
import { ImageDisplay } from './ImageDisplay';
import { UsageHistory } from './UsageHistory';
import { FuturisticPanel } from './FuturisticPanel';
import { Wand2, ThumbsUp, ThumbsDown, Gem } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';
import { useSubscription } from '@/hooks/use-subscription';

const formSchema = z.object({
  prompt: z.string().min(1, 'Prompt cannot be empty. Let your imagination flow!').max(1000, 'Prompt is too long.'),
});
type FormData = z.infer<typeof formSchema>;

type StrippedImprovePromptOutput = Omit<ImprovePromptOutput, 'error'>;


const aspectRatiosWithText = ASPECT_RATIOS.map(ar => ({
  ...ar,
  textHint: ar.label.split(' (')[1]?.replace(')', '')?.toLowerCase() || ar.value,
}));

export function ImageGenerator() {
  const { toast } = useToast();
  const { subscription, useCredit, isLoading: isSubLoading } = useSubscription();

  const [selectedAspectRatio, setSelectedAspectRatio] = useState<string>(aspectRatiosWithText[0].value);
  const [selectedStyle, setSelectedStyle] = useState<string>(STYLES[0]);
  const [selectedMood, setSelectedMood] = useState<string>(MOODS[0]);
  const [selectedLighting, setSelectedLighting] = useState<string>(LIGHTING_OPTIONS[0]);
  const [selectedColor, setSelectedColor] = useState<string>(COLOR_OPTIONS[0]);
  
  const [generatedImageUrls, setGeneratedImageUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isImprovingPrompt, setIsImprovingPrompt] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [history, setHistory] = useState<GeneratedImageHistoryItem[]>([]);
  const [improvedPromptSuggestion, setImprovedPromptSuggestion] = useState<StrippedImprovePromptOutput | null>(null);
  const [showImprovePromptDialog, setShowImprovePromptDialog] = useState(false);

  const { register, handleSubmit, watch, setValue: setFormValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { prompt: '' },
  });
  const currentPrompt = watch('prompt');

  const createThumbnail = useCallback((dataUrl: string, width = 128, height = 128): Promise<string> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          console.error('Could not get canvas context, returning original URL.');
          return resolve(dataUrl);
        }
        
        const sourceWidth = img.naturalWidth;
        const sourceHeight = img.naturalHeight;
        const sourceAspectRatio = sourceWidth / sourceHeight;
        const targetAspectRatio = width / height;
        
        let sx = 0, sy = 0, sw = sourceWidth, sh = sourceHeight;
  
        if (sourceAspectRatio > targetAspectRatio) {
          sw = sourceHeight * targetAspectRatio;
          sx = (sourceWidth - sw) / 2;
        } else if (sourceAspectRatio < targetAspectRatio) {
          sh = sourceWidth / targetAspectRatio;
          sy = (sourceHeight - sh) / 2;
        }
  
        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);
        
        resolve(canvas.toDataURL('image/jpeg', 0.7)); // Use JPEG for smaller size
      };
      img.onerror = (err) => {
        console.error("Failed to load image for thumbnail creation, returning original URL.", err);
        resolve(dataUrl);
      };
      img.src = dataUrl;
    });
  }, []);
  
  useEffect(() => {
    const storedHistory = localStorage.getItem('imagenBrainAiHistory');
    if (storedHistory) {
      try {
        setHistory(JSON.parse(storedHistory).map((item:GeneratedImageHistoryItem) => ({...item, timestamp: new Date(item.timestamp)})));
      } catch (e) {
        console.error("Failed to parse history from localStorage", e);
        localStorage.removeItem('imagenBrainAiHistory');
      }
    }
  }, []);

  useEffect(() => {
    if (history.length > 0) {
      try {
        localStorage.setItem('imagenBrainAiHistory', JSON.stringify(history));
      } catch (e: any) {
        console.error("Failed to save history to localStorage:", e);
        if (e instanceof DOMException && e.name === 'QuotaExceededError') {
             toast({
              title: "Could not save history",
              description: "Your browser storage is full. Please clear some history items to save new ones.",
              variant: "destructive"
            });
        } else {
            toast({
              title: "Could not save history",
              description: "An unknown error occurred while saving to browser storage.",
              variant: "destructive"
            });
        }
      }
    } else {
      localStorage.removeItem('imagenBrainAiHistory');
    }
  }, [history, toast]);

  const canGenerate = () => {
    if (isSubLoading || !subscription) return false;
    if (subscription.plan === 'mega') return true;
    return subscription.credits > 0;
  };

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    if (!canGenerate()) {
      toast({
        title: subscription?.plan === 'free' ? 'Free Limit Reached' : 'Out of Credits',
        description: subscription?.plan === 'free' 
          ? 'You have used all 10 of your free generations. Please upgrade to continue creating.'
          : 'Please upgrade or renew your plan to continue generating.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setGeneratedImageUrls([]);

    const promptParts = [data.prompt];
    if (selectedStyle !== 'None') promptParts.push(selectedStyle);
    if (selectedMood !== 'None') promptParts.push(`${selectedMood} mood`);
    if (selectedLighting !== 'None') promptParts.push(selectedLighting);
    if (selectedColor !== 'None') promptParts.push(`${selectedColor} color palette`);

    const aspectRatioTextHint = aspectRatiosWithText.find(ar => ar.value === selectedAspectRatio)?.textHint || '';
    if (aspectRatioTextHint) promptParts.push(aspectRatioTextHint);

    const fullPrompt = promptParts.join(', ');

    const generationParams: GenerateImageInput = {
      prompt: fullPrompt,
    };
    
    const result = await generateImage(generationParams);

    setIsLoading(false);

    if (result.error) {
      console.error('Image generation error from flow:', result.error);
      setError(result.error);
      toast({ title: 'Generation Failed', description: result.error, variant: 'destructive', duration: 9000 });
    } else if (result.imageUrls && result.imageUrls.length > 0) {
      const creditUsed = useCredit();
      if (!creditUsed) {
         toast({ title: 'Credit Error', description: 'Could not use a credit. Please try again.', variant: 'destructive' });
         return;
      }

      setGeneratedImageUrls(result.imageUrls);
      
      const thumbnailUrl = await createThumbnail(result.imageUrls[0]);

      const historyItem: GeneratedImageHistoryItem = {
        id: new Date().toISOString() + Math.random().toString(36).substring(2,9),
        prompt: data.prompt,
        aspectRatio: selectedAspectRatio,
        imageUrl: thumbnailUrl,
        timestamp: new Date(),
      };
      setHistory(prev => [historyItem, ...prev.slice(0, 19)]); // Keep history size to 20
      toast({ title: 'Vision Forged!', description: `Your images have been successfully generated.` });
    } else {
      const fallbackError = 'The AI returned no images. This can happen with very complex or unsafe prompts. Please try simplifying your request.';
      setError(fallbackError);
      toast({ title: 'Generation Issue', description: fallbackError, variant: 'destructive' });
    }
  };

  const handleImprovePrompt = async () => {
    if (!currentPrompt) {
      toast({ title: 'Empty Prompt', description: 'Please enter a prompt to improve.', variant: 'destructive' });
      return;
    }
    setIsImprovingPrompt(true);
    setImprovedPromptSuggestion(null);

    const suggestion = await improvePrompt({ prompt: currentPrompt });
    
    setIsImprovingPrompt(false);

    if (suggestion.error) {
        toast({ title: 'Suggestion Failed', description: suggestion.error, variant: 'destructive', duration: 9000 });
        return;
    }

    if (suggestion.improvedPrompt) {
        setImprovedPromptSuggestion({
            improvedPrompt: suggestion.improvedPrompt,
            reasoning: suggestion.reasoning
        });
        setShowImprovePromptDialog(true);
    } else {
        toast({ title: 'Suggestion Failed', description: 'The AI could not generate a suggestion for this prompt.', variant: 'destructive' });
    }
  };

  const applyImprovedPrompt = () => {
    if (improvedPromptSuggestion) {
      setFormValue('prompt', improvedPromptSuggestion.improvedPrompt);
      setShowImprovePromptDialog(false);
      toast({ title: 'Prompt Updated!', description: 'The improved prompt has been applied.' });
    }
  };

  const handleRegenerate = () => {
     if(currentPrompt) {
        handleSubmit(onSubmit)();
     } else if (history.length > 0) {
        handleSelectHistoryItem(history[0]); 
     } else {
        toast({ title: 'Nothing to Regenerate', description: 'Enter a prompt or select from history.', variant: 'destructive' });
     }
  };

  const handleCopyPrompt = () => {
    if (!currentPrompt) return;
    navigator.clipboard.writeText(currentPrompt);
    toast({ title: 'Prompt Copied!', description: 'The current prompt is copied to your clipboard.' });
  };

  const handleSelectHistoryItem = (item: GeneratedImageHistoryItem) => {
    setFormValue('prompt', item.prompt);
    setSelectedAspectRatio(item.aspectRatio);
    // Reset other controls to default as they are not stored in history
    setSelectedStyle(STYLES[0]);
    setSelectedMood(MOODS[0]);
    setSelectedLighting(LIGHTING_OPTIONS[0]);
    setSelectedColor(COLOR_OPTIONS[0]);
    setGeneratedImageUrls([]); // Clear the main display
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast({ title: 'History Item Loaded', description: 'Parameters loaded. Click "Forge Vision" to regenerate.' });
  };

  const handleDeleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
    toast({ title: 'History Item Deleted', description: 'The item was removed from your history.' });
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem('imagenBrainAiHistory');
    toast({ title: 'History Cleared', description: 'All generated image history has been cleared.' });
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-6">
          <FuturisticPanel>
            {isSubLoading ? (
              <div className="text-center text-sm text-muted-foreground p-4">Loading subscription...</div>
            ) : subscription ? (
              <div className="flex justify-between items-center text-sm mb-4 p-2 rounded-md bg-primary/10 border border-primary/20">
                  <span className="font-semibold text-primary">
                    Plan: {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)}
                  </span>
                  <div className="flex items-center gap-2 text-primary">
                    <Gem size={16} />
                    <span className="font-semibold">
                      {subscription.plan === 'mega' ? 'Unlimited' : `${subscription.credits} Credits`}
                    </span>
                  </div>
              </div>
            ) : (
               <div className="text-center text-sm text-muted-foreground p-4">Loading subscription...</div>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                    className="bg-input border-border/70 focus:border-primary focus:ring-primary text-base resize-none pr-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-accent hover:text-accent/80 futuristic-glow-button"
                    onClick={handleImprovePrompt}
                    disabled={isImprovingPrompt || !currentPrompt}
                    title="Improve Prompt with AI"
                  >
                    {isImprovingPrompt ? <LoadingSpinner size={18} /> : <Wand2 size={18} />}
                  </Button>
                </div>
                {errors.prompt && <p className="text-sm text-destructive mt-1">{errors.prompt.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <Label htmlFor="style" className="text-sm font-medium mb-1 block text-foreground/80">Artistic Style</Label>
                    <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                        <SelectTrigger id="style" className="w-full futuristic-glow-button bg-input hover:bg-input/80">
                            <SelectValue placeholder="Select style" />
                        </SelectTrigger>
                        <SelectContent>
                            {STYLES.map((style) => (
                                <SelectItem key={style} value={style}>{style}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label htmlFor="mood" className="text-sm font-medium mb-1 block text-foreground/80">Mood</Label>
                    <Select value={selectedMood} onValueChange={setSelectedMood}>
                        <SelectTrigger id="mood" className="w-full futuristic-glow-button bg-input hover:bg-input/80">
                            <SelectValue placeholder="Select mood" />
                        </SelectTrigger>
                        <SelectContent>
                            {MOODS.map((mood) => (
                                <SelectItem key={mood} value={mood}>{mood}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label htmlFor="lighting" className="text-sm font-medium mb-1 block text-foreground/80">Lighting</Label>
                    <Select value={selectedLighting} onValueChange={setSelectedLighting}>
                        <SelectTrigger id="lighting" className="w-full futuristic-glow-button bg-input hover:bg-input/80">
                            <SelectValue placeholder="Select lighting" />
                        </SelectTrigger>
                        <SelectContent>
                            {LIGHTING_OPTIONS.map((lighting) => (
                                <SelectItem key={lighting} value={lighting}>{lighting}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label htmlFor="color" className="text-sm font-medium mb-1 block text-foreground/80">Color Palette</Label>
                    <Select value={selectedColor} onValueChange={setSelectedColor}>
                        <SelectTrigger id="color" className="w-full futuristic-glow-button bg-input hover:bg-input/80">
                            <SelectValue placeholder="Select color" />
                        </SelectTrigger>
                        <SelectContent>
                            {COLOR_OPTIONS.map((color) => (
                                <SelectItem key={color} value={color}>{color}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="aspect-ratio" className="text-sm font-medium mb-1 block text-foreground/80">Aspect Ratio</Label>
                <Select value={selectedAspectRatio} onValueChange={setSelectedAspectRatio}>
                  <SelectTrigger id="aspect-ratio" className="w-full futuristic-glow-button bg-input hover:bg-input/80">
                    <SelectValue placeholder="Select aspect ratio" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {aspectRatiosWithText.map((ratio) => (
                      <SelectItem key={ratio.value} value={ratio.value}>
                        {ratio.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button type="submit" disabled={isLoading || !canGenerate()} className="w-full text-lg py-3 futuristic-glow-button-primary bg-primary hover:bg-primary/90 text-primary-foreground">
                {isLoading ? <LoadingSpinner size={24} className="mr-2"/> : null}
                Forge Vision
              </Button>
            </form>
          </FuturisticPanel>
        </div>

        <div className="lg:col-span-7">
          <ImageDisplay
            imageUrls={generatedImageUrls}
            prompt={currentPrompt}
            aspectRatio={selectedAspectRatio}
            isLoading={isLoading}
            error={error}
            onRegenerate={handleRegenerate}
            onCopyPrompt={handleCopyPrompt}
          />
        </div>
      </div>
      
      <div className="mt-12">
         <UsageHistory 
            history={history} 
            onSelectHistoryItem={handleSelectHistoryItem}
            onDeleteHistoryItem={handleDeleteHistoryItem}
            onClearHistory={handleClearHistory}
          />
      </div>

      {improvedPromptSuggestion && (
        <Dialog open={showImprovePromptDialog} onOpenChange={setShowImprovePromptDialog}>
          <DialogContent className="sm:max-w-lg glassmorphism-panel">
            <DialogHeader>
              <DialogTitle className="text-2xl text-primary flex items-center gap-2"><Wand2 /> AI Prompt Enhancement</DialogTitle>
              <DialogDescription className="text-foreground/80 pt-2">
                Our AI has analyzed your prompt and suggests the following improvements for potentially better results.
              </DialogDescription>
            </DialogHeader>
            <div className="my-4 space-y-4">
              <div>
                <h4 className="font-semibold text-foreground/90">Original Prompt:</h4>
                <p className="text-sm p-3 bg-muted/50 rounded-md border border-border/30">{currentPrompt}</p>
              </div>
              <div>
                <h4 className="font-semibold text-accent">Suggested Prompt:</h4>
                <p className="text-sm p-3 bg-accent/10 rounded-md border border-accent/30 text-accent-foreground">{improvedPromptSuggestion.improvedPrompt}</p>
              </div>
              <div>
                <h4 className="font-semibold text-foreground/90">Reasoning:</h4>
                <p className="text-sm p-3 bg-muted/50 rounded-md border border-border/30">{improvedPromptSuggestion.reasoning}</p>
              </div>
            </div>
            <DialogFooter className="sm:justify-between gap-2">
              <Button variant="outline" onClick={() => setShowImprovePromptDialog(false)} className="futuristic-glow-button">
                 <ThumbsDown size={18} className="mr-2"/> Keep Original
              </Button>
              <Button onClick={applyImprovedPrompt} className="futuristic-glow-button-primary bg-primary hover:bg-primary/90 text-primary-foreground">
                <ThumbsUp size={18} className="mr-2"/> Apply Suggestion
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
