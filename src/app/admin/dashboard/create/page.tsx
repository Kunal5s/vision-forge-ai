
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
  IMAGE_COUNTS,
} from '@/lib/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Wand2, KeyRound } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { generateArticleAction } from './actions';

const FormSchema = z.object({
  topic: z.string().min(1, 'Please enter a topic.'),
  category: z.string().min(1, 'Please select a category.'),
  provider: z.enum(['openrouter', 'sambanova']),
  model: z.string().min(1, 'Please select an AI model.'),
  style: z.string().min(1, 'Please select a writing style.'),
  mood: z.string().min(1, 'Please select an article mood.'),
  wordCount: z.string().min(1, 'Please select a word count.'),
  imageCount: z.string().min(1, 'Please select the number of images.'),
  openRouterApiKey: z.string().optional(),
  sambaNovaApiKey: z.string().optional(),
});

type FormData = z.infer<typeof FormSchema>;

export default function CreateArticlePage() {
  const [isGenerating, setIsGenerating] = useState(false);
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
    },
  });

  const provider = watch('provider');

  useEffect(() => {
    if (provider === 'openrouter') {
      setValue('model', OPENROUTER_MODELS[0]);
    } else {
      setValue('model', SAMBANOVA_MODELS[0]);
    }
  }, [provider, setValue]);

  const handleArticleGeneration = async (data: FormData) => {
    setIsGenerating(true);
    toast({
      title: 'Starting AI Article Generation...',
      description: `Using provider: ${data.provider}, model: ${data.model}. This might take a minute or two.`,
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
              <Controller name="category" control={control} render={({ field }) => ( <div className="space-y-2"> <Label>Category</Label> <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isGenerating}> <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger> <SelectContent>{Object.entries(categorySlugMap).map(([slug, name]) => (<SelectItem key={slug} value={name}>{name}</SelectItem>))}</SelectContent> </Select> {errors.category && <p className="text-sm text-destructive mt-1">{errors.category.message}</p>} </div> )} />
              
              <Controller name="provider" control={control} render={({ field }) => ( <div className="space-y-2"> <Label>AI Provider</Label> <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isGenerating}> <SelectTrigger><SelectValue placeholder="Select a provider" /></SelectTrigger> <SelectContent><SelectItem value="openrouter">OpenRouter</SelectItem><SelectItem value="sambanova">SambaNova</SelectItem></SelectContent> </Select> {errors.provider && <p className="text-sm text-destructive mt-1">{errors.provider.message}</p>} </div> )} />
              
              <Controller name="model" control={control} render={({ field }) => ( <div className="space-y-2"> <Label>AI Model</Label> <Select onValueChange={field.onChange} value={field.value} disabled={isGenerating}> <SelectTrigger><SelectValue placeholder="Select an AI model" /></SelectTrigger> <SelectContent>{(provider === 'openrouter' ? OPENROUTER_MODELS : SAMBANOVA_MODELS).map(model => (<SelectItem key={model} value={model}>{model}</SelectItem>))}</SelectContent> </Select> {errors.model && <p className="text-sm text-destructive mt-1">{errors.model.message}</p>} </div> )} />
              <Controller name="style" control={control} render={({ field }) => ( <div className="space-y-2"> <Label>Writing Style</Label> <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isGenerating}> <SelectTrigger><SelectValue placeholder="Select a style" /></SelectTrigger> <SelectContent>{WRITING_STYLES.map(opt => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}</SelectContent> </Select> {errors.style && <p className="text-sm text-destructive mt-1">{errors.style.message}</p>} </div> )} />
              <Controller name="mood" control={control} render={({ field }) => ( <div className="space-y-2"> <Label>Article Mood</Label> <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isGenerating}> <SelectTrigger><SelectValue placeholder="Select a mood" /></SelectTrigger> <SelectContent>{ARTICLE_MOODS.map(opt => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}</SelectContent> </Select> {errors.mood && <p className="text-sm text-destructive mt-1">{errors.mood.message}</p>} </div> )} />
              <Controller name="wordCount" control={control} render={({ field }) => ( <div className="space-y-2"> <Label>Word Count</Label> <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isGenerating}> <SelectTrigger><SelectValue placeholder="Select a word count" /></SelectTrigger> <SelectContent>{WORD_COUNTS.map(opt => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}</SelectContent> </Select> {errors.wordCount && <p className="text-sm text-destructive mt-1">{errors.wordCount.message}</p>} </div> )} />
              <Controller name="imageCount" control={control} render={({ field }) => ( <div className="space-y-2"> <Label>Number of Images</Label> <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isGenerating}> <SelectTrigger><SelectValue placeholder="Select image count" /></SelectTrigger> <SelectContent>{IMAGE_COUNTS.map(opt => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}</SelectContent> </Select> {errors.imageCount && <p className="text-sm text-destructive mt-1">{errors.imageCount.message}</p>} </div> )} />
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
                      disabled={isGenerating}
                    />
                </div>
                <p className="text-xs text-muted-foreground">If you provide a key here, it will be used instead of the one on the server for OpenRouter.</p>
              </div>

               <div className="space-y-2">
                <Label htmlFor="sambaNovaApiKey">SambaNova API Key (Optional)</Label>
                 <div className="relative flex items-center">
                    <KeyRound className="absolute left-3 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="sambaNovaApiKey"
                      type="password"
                      placeholder="Your SambaNova API Key"
                      {...register('sambaNovaApiKey')}
                      className="pl-10"
                      disabled={isGenerating}
                    />
                </div>
                <p className="text-xs text-muted-foreground">If you provide a key here, it will be used instead of the one on the server for SambaNova.</p>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-2">Actions</h3>
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
