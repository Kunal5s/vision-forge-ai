
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Wand2, KeyRound } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Textarea } from '@/components/ui/textarea';
import { generateStoryAction } from './actions';
import { categorySlugMap } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';


const StoryFormSchema = z.object({
  topic: z.string().min(3, "Topic must be at least 3 characters long."),
  pageCount: z.string() // The value from the Select is a string, so we validate as a string
    .refine(val => !isNaN(parseInt(val)), { message: "Page count must be a number." }),
  category: z.string().min(1, "Please select a category."),
  openRouterApiKey: z.string().optional(),
  huggingFaceApiKey: z.string().optional(),
});

type StoryFormData = z.infer<typeof StoryFormSchema>;

export default function CreateWebStoryPage() {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const { register, handleSubmit, control, formState: { errors }, setValue, watch } = useForm<StoryFormData>({
        resolver: zodResolver(StoryFormSchema),
        defaultValues: {
            topic: '',
            pageCount: '10', // Default to a string value
            category: 'Featured', // Default to a valid category name
            openRouterApiKey: '',
            huggingFaceApiKey: '',
        },
    });

    const openRouterApiKey = watch('openRouterApiKey');
    const huggingFaceApiKey = watch('huggingFaceApiKey');

    // Load API keys from localStorage on initial render
    useEffect(() => {
        try {
            const savedOpenRouterKey = localStorage.getItem('openRouterApiKey');
            const savedHuggingFaceKey = localStorage.getItem('huggingFaceApiKey');
            if (savedOpenRouterKey) setValue('openRouterApiKey', savedOpenRouterKey);
            if (savedHuggingFaceKey) setValue('huggingFaceApiKey', savedHuggingFaceKey);
        } catch (error) {
            console.error("Could not access localStorage. API keys will not be persisted.", error);
        }
    }, [setValue]);
    
     // Save API keys to localStorage whenever they change
    useEffect(() => {
      try {
        if (openRouterApiKey) localStorage.setItem('openRouterApiKey', openRouterApiKey); else localStorage.removeItem('openRouterApiKey');
        if (huggingFaceApiKey) localStorage.setItem('huggingFaceApiKey', huggingFaceApiKey); else localStorage.removeItem('huggingFaceApiKey');
      } catch (error) {
        // Silently fail if localStorage is not available
      }
    }, [openRouterApiKey, huggingFaceApiKey]);

    const handleGeneration = async (data: StoryFormData) => {
        setIsLoading(true);
        toast({
            title: 'Generating Web Story...',
            description: `AI is crafting a ${data.pageCount}-page story on "${data.topic}". This might take a few moments.`,
        });

        const result = await generateStoryAction(data);

        if (result && !result.success) {
            toast({
                title: 'Error Generating Story',
                description: result.error,
                variant: 'destructive',
                duration: 9000,
            });
            setIsLoading(false);
        } else if (result.slug) {
            toast({
                title: 'Story Generated!',
                description: 'Your new Web Story has been created and saved.',
            });
            // Redirect on success
            window.location.href = `/stories/${result.slug}`;
        }
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
                    <CardTitle className="text-2xl">Create a New Web Story with AI</CardTitle>
                    <CardDescription>
                        Provide a topic and the AI will automatically generate a multi-page visual story with images and captions.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                   <form onSubmit={handleSubmit(handleGeneration)} className="space-y-6">
                        <div>
                            <Label htmlFor="topic">Story Topic</Label>
                            <Textarea
                                id="topic"
                                placeholder="e.g., The journey of a lonely robot finding a friend"
                                {...register('topic')}
                                rows={3}
                                disabled={isLoading}
                                className="mt-1"
                            />
                            {errors.topic && <p className="text-sm text-destructive mt-1">{errors.topic.message}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Controller
                                name="pageCount"
                                control={control}
                                render={({ field }) => (
                                    <div className="space-y-1">
                                        <Label>Number of Pages</Label>
                                        <Select 
                                            onValueChange={field.onChange} 
                                            defaultValue={field.value} 
                                            disabled={isLoading}
                                        >
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {Array.from({ length: 16 }, (_, i) => i + 5).map(num => (
                                                    <SelectItem key={num} value={String(num)}>{num} Pages</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.pageCount && <p className="text-sm text-destructive mt-1">{errors.pageCount.message}</p>}
                                    </div>
                                )}
                            />
                            <Controller
                                name="category"
                                control={control}
                                render={({ field }) => (
                                    <div className="space-y-1">
                                        <Label>Category</Label>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                                            <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(categorySlugMap).map(([slug, name]) => (
                                                    <SelectItem key={slug} value={name}>{name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.category && <p className="text-sm text-destructive mt-1">{errors.category.message}</p>}
                                    </div>
                                )}
                            />
                        </div>
                        
                         <div className="space-y-4 border-t pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="huggingFaceApiKey">Hugging Face API Key (Optional)</Label>
                                <div className="relative flex items-center">
                                    <KeyRound className="absolute left-3 h-5 w-5 text-muted-foreground" />
                                    <Input id="huggingFaceApiKey" type="password" placeholder="hf_... (leave blank to use server key)" {...register('huggingFaceApiKey')} className="pl-10" disabled={isLoading} />
                                    {huggingFaceApiKey && <Badge className="absolute right-2 bg-green-600 text-white">Active</Badge>}
                                </div>
                                <p className="text-xs text-muted-foreground">This key will be prioritized for generation.</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="openRouterApiKey">OpenRouter API Key (Optional)</Label>
                                <div className="relative flex items-center">
                                    <KeyRound className="absolute left-3 h-5 w-5 text-muted-foreground" />
                                    <Input id="openRouterApiKey" type="password" placeholder="sk-or-v1-... (leave blank to use server key)" {...register('openRouterApiKey')} className="pl-10" disabled={isLoading} />
                                    {openRouterApiKey && !huggingFaceApiKey && <Badge className="absolute right-2 bg-green-600 text-white">Active</Badge>}
                                </div>
                                <p className="text-xs text-muted-foreground">Used if Hugging Face key is not provided.</p>
                            </div>
                        </div>


                        <div className="border-t pt-6">
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Story...</>
                                ) : (
                                    <><Wand2 className="mr-2 h-4 w-4" /> Generate Story with AI</>
                                )}
                            </Button>
                        </div>
                   </form>
                </CardContent>
            </Card>
        </main>
    );
}
