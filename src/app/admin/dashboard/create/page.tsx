
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
import { generateTopicsAction, generateArticleAction } from './actions';
import { Textarea } from '@/components/ui/textarea';

const TopicFormSchema = z.object({
  prompt: z.string().min(1, 'Please enter a prompt for topic ideas.'),
});

const ArticleFormSchema = z.object({
  topic: z.string().min(1, 'Please select a topic.'),
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

type TopicFormData = z.infer<typeof TopicFormSchema>;
type ArticleFormData = z.infer<typeof ArticleFormSchema>;

export default function CreateArticlePage() {
  const [stage, setStage] = useState<'topic' | 'article'>('topic');
  const [isTopicLoading, setIsTopicLoading] = useState(false);
  const [isArticleLoading, setIsArticleLoading] = useState(false);
  const [generatedTopics, setGeneratedTopics] = useState<string[]>([]);
  
  const { toast } = useToast();

  const topicForm = useForm<TopicFormData>({
    resolver: zodResolver(TopicFormSchema),
    defaultValues: { prompt: '' },
  });

  const articleForm = useForm<ArticleFormData>({
    resolver: zodResolver(ArticleFormSchema),
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

  const provider = articleForm.watch('provider');
  const openRouterApiKey = articleForm.watch('openRouterApiKey');
  const sambaNovaApiKey = articleForm.watch('sambaNovaApiKey');

  // Load API keys from localStorage on initial render
  useEffect(() => {
    try {
        const savedOpenRouterKey = localStorage.getItem('openRouterApiKey');
        const savedSambaNovaKey = localStorage.getItem('sambaNovaApiKey');
        if (savedOpenRouterKey) {
            articleForm.setValue('openRouterApiKey', savedOpenRouterKey);
        }
        if (savedSambaNovaKey) {
            articleForm.setValue('sambaNovaApiKey', savedSambaNovaKey);
        }
    } catch (error) {
        console.error("Could not access localStorage. API keys will not be persisted.", error);
    }
  }, [articleForm]);

  // Save API keys to localStorage whenever they change
  useEffect(() => {
      try {
        if (openRouterApiKey) {
            localStorage.setItem('openRouterApiKey', openRouterApiKey);
        } else {
            localStorage.removeItem('openRouterApiKey');
        }
      } catch (error) {
        // Silently fail if localStorage is not available
      }
  }, [openRouterApiKey]);

  useEffect(() => {
    try {
        if (sambaNovaApiKey) {
            localStorage.setItem('sambaNovaApiKey', sambaNovaApiKey);
        } else {
            localStorage.removeItem('sambaNovaApiKey');
        }
    } catch (error) {
        // Silently fail if localStorage is not available
    }
  }, [sambaNovaApiKey]);


  useEffect(() => {
    if (provider === 'openrouter') {
      articleForm.setValue('model', OPENROUTER_MODELS[0]);
    } else {
      articleForm.setValue('model', SAMBANOVA_MODELS[0]);
    }
  }, [provider, articleForm]);

  const handleTopicGeneration = async (data: TopicFormData) => {
    setIsTopicLoading(true);
    const result = await generateTopicsAction(data);
    if (result.success && result.topics) {
      setGeneratedTopics(result.topics);
      setStage('article');
      articleForm.setValue('topic', result.topics[0]); // Pre-select the first topic
    } else {
      toast({
        title: 'Error Generating Topics',
        description: result.error,
        variant: 'destructive',
      });
    }
    setIsTopicLoading(false);
  };
  
  const handleArticleGeneration = async (data: ArticleFormData) => {
    setIsArticleLoading(true);
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
    setIsArticleLoading(false);
  };

  const isGenerating = isTopicLoading || isArticleLoading;

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
            {stage === 'topic' 
              ? 'Start by entering a core idea. The AI will suggest several compelling article titles for you to choose from.'
              : 'Now, choose a title and configure the settings. The AI will generate a complete, SEO-friendly article for you.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stage === 'topic' ? (
            <form onSubmit={topicForm.handleSubmit(handleTopicGeneration)} className="space-y-6">
              <div>
                <Label htmlFor="prompt">Core Idea or Prompt</Label>
                <Textarea
                  id="prompt"
                  placeholder="e.g., The future of AI in photography, how to make money with NFTs..."
                  {...topicForm.register('prompt')}
                  rows={4}
                  disabled={isTopicLoading}
                />
                {topicForm.formState.errors.prompt && <p className="text-sm text-destructive mt-1">{topicForm.formState.errors.prompt.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={isTopicLoading}>
                {isTopicLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Topics...</> : <><Wand2 className="mr-2 h-4 w-4" /> Generate Topics</>}
              </Button>
            </form>
          ) : (
            <form onSubmit={articleForm.handleSubmit(handleArticleGeneration)} className="space-y-6">
              <div>
                <Label htmlFor="topic">Choose Your Article Topic</Label>
                 <Controller name="topic" control={articleForm.control} render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isGenerating}>
                    <SelectTrigger><SelectValue placeholder="Select a generated topic" /></SelectTrigger>
                    <SelectContent>
                      {generatedTopics.map((topic, index) => (
                        <SelectItem key={index} value={topic}>{topic}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                 )} />
                {articleForm.formState.errors.topic && <p className="text-sm text-destructive mt-1">{articleForm.formState.errors.topic.message}</p>}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Controller name="category" control={articleForm.control} render={({ field }) => ( <div className="space-y-2"> <Label>Category</Label> <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isGenerating}> <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger> <SelectContent>{Object.entries(categorySlugMap).map(([slug, name]) => (<SelectItem key={slug} value={name}>{name}</SelectItem>))}</SelectContent> </Select> {articleForm.formState.errors.category && <p className="text-sm text-destructive mt-1">{articleForm.formState.errors.category.message}</p>} </div> )} />
                <Controller name="provider" control={articleForm.control} render={({ field }) => ( <div className="space-y-2"> <Label>AI Provider</Label> <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isGenerating}> <SelectTrigger><SelectValue placeholder="Select a provider" /></SelectTrigger> <SelectContent><SelectItem value="openrouter">OpenRouter</SelectItem><SelectItem value="sambanova">SambaNova</SelectItem></SelectContent> </Select> {articleForm.formState.errors.provider && <p className="text-sm text-destructive mt-1">{articleForm.formState.errors.provider.message}</p>} </div> )} />
                <Controller name="model" control={articleForm.control} render={({ field }) => ( <div className="space-y-2"> <Label>AI Model</Label> <Select onValueChange={field.onChange} value={field.value} disabled={isGenerating}> <SelectTrigger><SelectValue placeholder="Select an AI model" /></SelectTrigger> <SelectContent>{(provider === 'openrouter' ? OPENROUTER_MODELS : SAMBANOVA_MODELS).map(model => (<SelectItem key={model} value={model}>{model}</SelectItem>))}</SelectContent> </Select> {articleForm.formState.errors.model && <p className="text-sm text-destructive mt-1">{articleForm.formState.errors.model.message}</p>} </div> )} />
                <Controller name="style" control={articleForm.control} render={({ field }) => ( <div className="space-y-2"> <Label>Writing Style</Label> <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isGenerating}> <SelectTrigger><SelectValue placeholder="Select a style" /></SelectTrigger> <SelectContent>{WRITING_STYLES.map(opt => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}</SelectContent> </Select> {articleForm.formState.errors.style && <p className="text-sm text-destructive mt-1">{articleForm.formState.errors.style.message}</p>} </div> )} />
                <Controller name="mood" control={articleForm.control} render={({ field }) => ( <div className="space-y-2"> <Label>Article Mood</Label> <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isGenerating}> <SelectTrigger><SelectValue placeholder="Select a mood" /></SelectTrigger> <SelectContent>{ARTICLE_MOODS.map(opt => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}</SelectContent> </Select> {articleForm.formState.errors.mood && <p className="text-sm text-destructive mt-1">{articleForm.formState.errors.mood.message}</p>} </div> )} />
                <Controller name="wordCount" control={articleForm.control} render={({ field }) => ( <div className="space-y-2"> <Label>Word Count</Label> <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isGenerating}> <SelectTrigger><SelectValue placeholder="Select a word count" /></SelectTrigger> <SelectContent>{WORD_COUNTS.map(opt => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}</SelectContent> </Select> {articleForm.formState.errors.wordCount && <p className="text-sm text-destructive mt-1">{articleForm.formState.errors.wordCount.message}</p>} </div> )} />
                <Controller name="imageCount" control={articleForm.control} render={({ field }) => ( <div className="space-y-2"> <Label>Number of Images</Label> <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isGenerating}> <SelectTrigger><SelectValue placeholder="Select image count" /></SelectTrigger> <SelectContent>{IMAGE_COUNTS.map(opt => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}</SelectContent> </Select> {articleForm.formState.errors.imageCount && <p className="text-sm text-destructive mt-1">{articleForm.formState.errors.imageCount.message}</p>} </div> )} />
              </div>

              <div className="space-y-4 border-t pt-6">
                <div className="space-y-2">
                  <Label htmlFor="openRouterApiKey">OpenRouter API Key (Optional)</Label>
                  <div className="relative flex items-center">
                      <KeyRound className="absolute left-3 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="openRouterApiKey"
                        type="password"
                        placeholder="sk-or-v1-... (leave blank to use server key)"
                        {...articleForm.register('openRouterApiKey')}
                        className="pl-10"
                        disabled={isGenerating}
                      />
                  </div>
                  <p className="text-xs text-muted-foreground">This key is saved in your browser and will be used instead of the server key.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sambaNovaApiKey">SambaNova API Key (Optional)</Label>
                  <div className="relative flex items-center">
                      <KeyRound className="absolute left-3 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="sambaNovaApiKey"
                        type="password"
                        placeholder="Your SambaNova API Key (leave blank to use server key)"
                        {...articleForm.register('sambaNovaApiKey')}
                        className="pl-10"
                        disabled={isGenerating}
                      />
                  </div>
                  <p className="text-xs text-muted-foreground">This key is saved in your browser and will be used instead of the server key.</p>
                </div>
              </div>

              <div className="border-t pt-6 flex flex-col sm:flex-row items-center gap-4">
                 <Button type="button" variant="secondary" onClick={() => { setStage('topic'); setGeneratedTopics([]); }}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
                </Button>
                <Button type="submit" className="w-full" disabled={isArticleLoading}>
                  {isArticleLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Article...</> : <><Wand2 className="mr-2 h-4 w-4" /> Generate Article with AI</>}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
