
'use client';

import { useForm, Controller, type SubmitHandler, useFormState } from 'react-hook-form';
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from '@/hooks/use-toast';
import { categorySlugMap, OPENROUTER_MODELS, WRITING_STYLES, ARTICLE_MOODS, WORD_COUNTS, IMAGE_COUNTS } from '@/lib/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Wand2, KeyRound, BrainCircuit, FileText } from 'lucide-react';
import { useState, useTransition } from 'react';
import Link from 'next/link';
import { generateTopicsAction, generateArticleAction } from './actions';

// Schema for the two-stage form process
const FormSchema = z.object({
  prompt: z.string().min(10, 'Prompt must be at least 10 characters long.'),
  topic: z.string().optional(),
  category: z.string().optional(),
  model: z.string().optional(),
  style: z.string().optional(),
  mood: z.string().optional(),
  wordCount: z.string().optional(),
  imageCount: z.string().optional(),
  apiKey: z.string().optional(),
});

type FormData = z.infer<typeof FormSchema>;

export default function CreateArticlePage() {
  const [stage, setStage] = useState<'prompt' | 'details'>('prompt');
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
  const { toast } = useToast();

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      model: OPENROUTER_MODELS[0],
      style: WRITING_STYLES[0].value,
      mood: ARTICLE_MOODS[0].value,
      wordCount: WORD_COUNTS[1].value,
      imageCount: IMAGE_COUNTS[1].value, // Default to 5 images
      apiKey: '',
    }
  });

  const selectedTopic = watch('topic');

  const handleTopicGeneration: SubmitHandler<FormData> = async (data) => {
    setIsGenerating(true);
    setSuggestedTopics([]);
    toast({
      title: 'Generating Topic Ideas...',
      description: `Using AI to brainstorm titles based on your prompt.`,
    });

    const result = await generateTopicsAction(data);

    if (result.success && result.topics) {
      setSuggestedTopics(result.topics);
      setStage('details');
      toast({
        title: 'Topics Generated!',
        description: `Please select one of the 5 topics to continue.`,
      });
    } else {
      toast({
        title: 'Error Generating Topics',
        description: result.error,
        variant: 'destructive',
      });
    }
    setIsGenerating(false);
  };

  const handleArticleGeneration: SubmitHandler<FormData> = async (data) => {
    if (!data.topic || !data.category || !data.model || !data.style || !data.mood || !data.wordCount || !data.imageCount) {
        toast({ title: "Missing Information", description: "Please fill out all fields before generating the article.", variant: "destructive" });
        return;
    }
    
    setIsGenerating(true);
    toast({
      title: 'Starting AI Article Generation...',
      description: `Using model: ${data.model}. This might take a minute or two.`,
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
  
  const resetForm = () => {
    setStage('prompt');
    setSuggestedTopics([]);
    setValue('prompt', '');
    setValue('topic', undefined);
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
            {stage === 'prompt' 
              ? "Start by entering a topic idea. The AI will suggest several titles for you."
              : "Now, choose a title and provide details for your article."
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form 
            onSubmit={
              stage === 'prompt' 
                ? handleSubmit(handleTopicGeneration) 
                : handleSubmit(handleArticleGeneration)
            } 
            className="space-y-6"
          >
            {/* STAGE 1: PROMPT INPUT */}
            {stage === 'prompt' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="prompt">Article Idea / Prompt</Label>
                  <Input
                    id="prompt"
                    placeholder="e.g., The future of AI in photography"
                    {...register('prompt')}
                    disabled={isGenerating}
                  />
                  {errors.prompt && <p className="text-sm text-destructive mt-1">{errors.prompt.message}</p>}
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
                </div>
                <Button type="submit" className="w-full" disabled={isGenerating}>
                  {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
                  Generate Topics
                </Button>
              </div>
            )}

            {/* STAGE 2: DETAILS & GENERATION */}
            {stage === 'details' && (
              <div className="space-y-6">
                <div>
                    <Label className="font-semibold">Choose an Article Title</Label>
                    <p className="text-sm text-muted-foreground mb-2">Select one of the AI-generated titles below.</p>
                     <Controller
                      name="topic"
                      control={control}
                      render={({ field }) => (
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="space-y-2">
                          {suggestedTopics.map((topic, index) => (
                            <Label key={index} className="flex items-center gap-3 border rounded-md p-3 hover:bg-muted/50 has-[:checked]:bg-primary/10 has-[:checked]:border-primary transition-colors cursor-pointer">
                              <RadioGroupItem value={topic} id={`topic-${index}`} />
                              <span className="font-normal">{topic}</span>
                            </Label>
                          ))}
                        </RadioGroup>
                      )}
                    />
                    {errors.topic && <p className="text-sm text-destructive mt-1">{errors.topic.message}</p>}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Controller name="category" control={control} render={({ field }) => ( <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isGenerating}> <Label>Category</Label> <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger> <SelectContent>{Object.entries(categorySlugMap).map(([slug, name]) => (<SelectItem key={slug} value={name}>{name}</SelectItem>))}</SelectContent> </Select> )} />
                  <Controller name="model" control={control} render={({ field }) => ( <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isGenerating}> <Label>AI Model</Label> <SelectTrigger><SelectValue placeholder="Select an AI model" /></SelectTrigger> <SelectContent>{OPENROUTER_MODELS.map(model => (<SelectItem key={model} value={model}>{model}</SelectItem>))}</SelectContent> </Select> )} />
                  <Controller name="style" control={control} render={({ field }) => ( <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isGenerating}> <Label>Writing Style</Label> <SelectTrigger><SelectValue placeholder="Select a style" /></SelectTrigger> <SelectContent>{WRITING_STYLES.map(opt => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}</SelectContent> </Select> )} />
                  <Controller name="mood" control={control} render={({ field }) => ( <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isGenerating}> <Label>Article Mood</Label> <SelectTrigger><SelectValue placeholder="Select a mood" /></SelectTrigger> <SelectContent>{ARTICLE_MOODS.map(opt => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}</SelectContent> </Select> )} />
                  <Controller name="wordCount" control={control} render={({ field }) => ( <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isGenerating}> <Label>Word Count</Label> <SelectTrigger><SelectValue placeholder="Select a word count" /></SelectTrigger> <SelectContent>{WORD_COUNTS.map(opt => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}</SelectContent> </Select> )} />
                  <Controller name="imageCount" control={control} render={({ field }) => ( <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isGenerating}> <Label>Number of Images</Label> <SelectTrigger><SelectValue placeholder="Select image count" /></SelectTrigger> <SelectContent>{IMAGE_COUNTS.map(opt => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}</SelectContent> </Select> )} />
                </div>
                
                <div className="flex flex-col-reverse sm:flex-row gap-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={resetForm} disabled={isGenerating}>
                    Start Over
                  </Button>
                  <Button type="submit" className="w-full" disabled={isGenerating || !selectedTopic}>
                    {isGenerating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Article...</> : <><FileText className="mr-2 h-4 w-4" /> Generate Full Article</>}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
