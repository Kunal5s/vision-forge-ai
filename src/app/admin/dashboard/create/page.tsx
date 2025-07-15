
'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    categorySlugMap, 
    OPENROUTER_MODELS, 
    SAMBANOVA_MODELS,
    WRITING_STYLES, 
    ARTICLE_MOODS, 
    WORD_COUNTS, 
    IMAGE_COUNTS 
} from '@/lib/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Wand2, KeyRound } from 'lucide-react';
import { useState, useTransition } from 'react';
import Link from 'next/link';
import { generateArticleAction } from './actions';

// Schema for the form
const FormSchema = z.object({
  topic: z.string().min(10, 'Prompt must be at least 10 characters long.'),
  category: z.string().min(1, 'Please select a category.'),
  provider: z.enum(['openrouter', 'sambanova']),
  model: z.string().min(1, 'Please select a model.'),
  style: z.string().min(1, 'Please select a writing style.'),
  mood: z.string().min(1, 'Please select a mood.'),
  wordCount: z.string().min(1, 'Please select a word count.'),
  imageCount: z.string().min(1, 'Please select an image count.'),
  openRouterApiKey: z.string().optional(),
  sambaNovaApiKey: z.string().optional(),
});

type FormData = z.infer<typeof FormSchema>;

export default function CreateArticlePage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'openrouter' | 'sambanova'>('openrouter');
  const { toast } = useToast();

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      provider: 'openrouter',
      model: OPENROUTER_MODELS[0],
      style: WRITING_STYLES[0].value,
      mood: ARTICLE_MOODS[0].value,
      wordCount: WORD_COUNTS[1].value,
      imageCount: IMAGE_COUNTS[1].value,
      openRouterApiKey: '',
      sambaNovaApiKey: '',
    }
  });

  const handleProviderChange = (provider: 'openrouter' | 'sambanova') => {
    setSelectedProvider(provider);
    setValue('provider', provider);
    // Reset model selection when provider changes
    setValue('model', provider === 'openrouter' ? OPENROUTER_MODELS[0] : SAMBANOVA_MODELS[0]);
  }

  const handleArticleGeneration: SubmitHandler<FormData> = async (data) => {
    setIsGenerating(true);
    toast({
      title: 'Starting AI Article Generation...',
      description: `Using ${data.provider} model: ${data.model}. This might take a minute or two.`,
    });

    const result = await generateArticleAction(data);
    
    // Redirect on success is handled by the server action itself.
    if (!result.success) {
      toast({
        title: 'Error Generating Article',
        description: result.error,
        variant: 'destructive',
        duration: 9000,
      });
    }
    setIsGenerating(false);
  };
  
  const currentModels = selectedProvider === 'openrouter' ? OPENROUTER_MODELS : SAMBANOVA_MODELS;

  return (
    <main className="flex-grow container mx-auto py-12 px-4 bg-muted/20 min-h-screen">
      <div className="mb-8">
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Create a New Article with AI</CardTitle>
          <CardDescription>
            Choose a topic, category, and AI model. The AI will generate a complete, SEO-friendly article for you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form 
            onSubmit={handleSubmit(handleArticleGeneration)} 
            className="space-y-6"
          >
            <div>
              <Label htmlFor="topic">Article Prompt / Topic</Label>
              <Input
                id="topic"
                placeholder="e.g., The Ultimate Guide to AI-Powered Photography"
                {...register('topic')}
                disabled={isGenerating}
              />
              {errors.topic && <p className="text-sm text-destructive mt-1">{errors.topic.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Controller name="category" control={control} render={({ field }) => ( <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isGenerating}> <Label>Category</Label> <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger> <SelectContent>{Object.entries(categorySlugMap).map(([slug, name]) => (<SelectItem key={slug} value={name}>{name}</SelectItem>))}</SelectContent> </Select> )} />
              <Controller name="provider" control={control} render={({ field }) => ( <Select onValueChange={(value: 'openrouter' | 'sambanova') => { field.onChange(value); handleProviderChange(value); }} value={field.value} disabled={isGenerating}> <Label>AI Provider</Label> <SelectTrigger><SelectValue placeholder="Select a provider" /></SelectTrigger> <SelectContent>{['openrouter', 'sambanova'].map(p => (<SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>))}</SelectContent> </Select> )} />
              <Controller name="model" control={control} render={({ field }) => ( <Select onValueChange={field.onChange} value={field.value} disabled={isGenerating}> <Label>AI Model</Label> <SelectTrigger><SelectValue placeholder="Select an AI model" /></SelectTrigger> <SelectContent>{currentModels.map(model => (<SelectItem key={model} value={model}>{model}</SelectItem>))}</SelectContent> </Select> )} />
              <Controller name="style" control={control} render={({ field }) => ( <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isGenerating}> <Label>Writing Style</Label> <SelectTrigger><SelectValue placeholder="Select a style" /></SelectTrigger> <SelectContent>{WRITING_STYLES.map(opt => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}</SelectContent> </Select> )} />
              <Controller name="mood" control={control} render={({ field }) => ( <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isGenerating}> <Label>Article Mood</Label> <SelectTrigger><SelectValue placeholder="Select a mood" /></SelectTrigger> <SelectContent>{ARTICLE_MOODS.map(opt => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}</SelectContent> </Select> )} />
              <Controller name="wordCount" control={control} render={({ field }) => ( <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isGenerating}> <Label>Word Count</Label> <SelectTrigger><SelectValue placeholder="Select a word count" /></SelectTrigger> <SelectContent>{WORD_COUNTS.map(opt => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}</SelectContent> </Select> )} />
              <Controller name="imageCount" control={control} render={({ field }) => ( <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isGenerating}> <Label>Number of Images</Label> <SelectTrigger><SelectValue placeholder="Select image count" /></SelectTrigger> <SelectContent>{IMAGE_COUNTS.map(opt => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}</SelectContent> </Select> )} />
            </div>

            <div className="space-y-4 border-t pt-6">
                <div className="space-y-2">
                    <Label htmlFor="openRouterApiKey">OpenRouter API Key (Optional)</Label>
                    <div className="relative flex items-center">
                        <KeyRound className="absolute left-3 h-5 w-5 text-muted-foreground" />
                        <Input
                            id="openRouterApiKey"
                            type="password"
                            placeholder="sk-or-v1-..."
                            {...register('openRouterApiKey')}
                            className="pl-10"
                            disabled={isGenerating || selectedProvider !== 'openrouter'}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="sambaNovaApiKey">SambaNova API Key (Optional)</Label>
                    <div className="relative flex items-center">
                        <KeyRound className="absolute left-3 h-5 w-5 text-muted-foreground" />
                        <Input
                            id="sambaNovaApiKey"
                            type="password"
                            placeholder="sn-..."
                            {...register('sambaNovaApiKey')}
                            className="pl-10"
                            disabled={isGenerating || selectedProvider !== 'sambanova'}
                        />
                    </div>
                </div>
            </div>

            <div className="border-t pt-6">
                 <Button type="submit" className="w-full" disabled={isGenerating}>
                    {isGenerating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Article...</> : <><Wand2 className="mr-2 h-4 w-4" /> Generate Article with AI</>}
                </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

    