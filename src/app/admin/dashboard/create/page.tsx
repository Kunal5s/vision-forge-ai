
'use client';

import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
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
import { categorySlugMap, OPENROUTER_MODELS, WRITING_STYLES, ARTICLE_MOODS, WORD_COUNTS } from '@/lib/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Wand2, KeyRound } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { generateArticleAction } from './actions';


const articleSchema = z.object({
  prompt: z.string().min(10, 'Prompt must be at least 10 characters long.'),
  category: z.string().min(1, 'Please select a category.'),
  model: z.string().min(1, 'Please select an AI model.'),
  style: z.string().min(1, 'Please select a writing style.'),
  mood: z.string().min(1, 'Please select an article mood.'),
  wordCount: z.string().min(1, 'Please select a word count.'),
  apiKey: z.string().optional(),
});

type ArticleFormData = z.infer<typeof articleSchema>;

export default function CreateArticlePage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const { register, handleSubmit, control, formState: { errors } } = useForm<ArticleFormData>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      model: OPENROUTER_MODELS[0],
      style: WRITING_STYLES[0].value,
      mood: ARTICLE_MOODS[0].value,
      wordCount: WORD_COUNTS[1].value, // Default to Medium
      apiKey: '',
    }
  });

  const onSubmit: SubmitHandler<ArticleFormData> = async (data) => {
    setIsGenerating(true);
    toast({
      title: 'Starting AI Article Generation...',
      description: `Using model: ${data.model}. This might take a minute or two. If one model fails, we'll try the next.`,
    });

    const result = await generateArticleAction(data);

    // The redirect on success is handled by the server action itself.
    // We only need to handle the error case here.
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

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Create a New Article with AI</CardTitle>
          <CardDescription>
            Choose a topic, category, and AI model. The AI will generate a complete, SEO-friendly article for you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="prompt">Article Prompt / Topic</Label>
              <Input
                id="prompt"
                placeholder="e.g., The Ultimate Guide to AI-Powered Photography"
                {...register('prompt')}
                disabled={isGenerating}
              />
              {errors.prompt && <p className="text-sm text-destructive mt-1">{errors.prompt.message}</p>}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isGenerating}>
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(categorySlugMap).map(([slug, name]) => (
                          <SelectItem key={slug} value={name}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.category && <p className="text-sm text-destructive mt-1">{errors.category.message}</p>}
              </div>

              <div>
                <Label htmlFor="model">AI Model</Label>
                 <Controller
                  name="model"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isGenerating}>
                      <SelectTrigger id="model">
                        <SelectValue placeholder="Select an AI model" />
                      </SelectTrigger>
                      <SelectContent>
                        {OPENROUTER_MODELS.map(model => (
                          <SelectItem key={model} value={model}>
                            {model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.model && <p className="text-sm text-destructive mt-1">{errors.model.message}</p>}
              </div>

              <div>
                <Label htmlFor="style">Writing Style</Label>
                 <Controller
                  name="style"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isGenerating}>
                      <SelectTrigger id="style">
                        <SelectValue placeholder="Select a style" />
                      </SelectTrigger>
                      <SelectContent>
                        {WRITING_STYLES.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.style && <p className="text-sm text-destructive mt-1">{errors.style.message}</p>}
              </div>

              <div>
                <Label htmlFor="mood">Article Mood</Label>
                 <Controller
                  name="mood"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isGenerating}>
                      <SelectTrigger id="mood">
                        <SelectValue placeholder="Select a mood" />
                      </SelectTrigger>
                      <SelectContent>
                        {ARTICLE_MOODS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.mood && <p className="text-sm text-destructive mt-1">{errors.mood.message}</p>}
              </div>

               <div>
                <Label htmlFor="wordCount">Word Count</Label>
                 <Controller
                  name="wordCount"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isGenerating}>
                      <SelectTrigger id="wordCount">
                        <SelectValue placeholder="Select a word count" />
                      </SelectTrigger>
                      <SelectContent>
                        {WORD_COUNTS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.wordCount && <p className="text-sm text-destructive mt-1">{errors.wordCount.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey">OpenRouter API Key (Optional)</Label>
              <div className="relative flex items-center">
                  <KeyRound className="absolute left-3 h-5 w-5 text-muted-foreground" />
                  <Input
                      id="apiKey"
                      type="password"
                      placeholder="sk-or-v1-..."
                      {...register('apiKey')}
                      className="pl-10"
                      disabled={isGenerating}
                  />
              </div>
              <p className="text-xs text-muted-foreground">If you provide a key here, it will be used instead of the one on the server. This key is not stored.</p>
            </div>


            <div className="border-t pt-6 space-y-4">
               <h3 className="text-lg font-semibold">Actions</h3>
               <Button type="submit" className="w-full" disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate Article with AI
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
