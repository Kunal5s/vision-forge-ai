
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

const StoryFormSchema = z.object({
  topic: z.string().min(3, "Topic must be at least 3 characters long."),
  pageCount: z.string().refine(val => !isNaN(parseInt(val)), { message: "Page count must be a number." })
    .transform(val => parseInt(val, 10))
    .refine(val => val >= 5 && val <= 20, { message: "Story must have between 5 and 20 pages." }),
  category: z.string().min(1, "Please select a category."),
  openRouterApiKey: z.string().optional(),
});

type StoryFormData = z.infer<typeof StoryFormSchema>;

export default function CreateWebStoryPage() {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const { register, handleSubmit, control, formState: { errors }, setValue } = useForm<StoryFormData>({
        resolver: zodResolver(StoryFormSchema),
        defaultValues: {
            topic: '',
            pageCount: 10,
            category: 'featured',
            openRouterApiKey: '',
        },
    });

    // Load API key from localStorage on initial render
    useEffect(() => {
        try {
            const savedOpenRouterKey = localStorage.getItem('openRouterApiKey');
            if (savedOpenRouterKey) {
                setValue('openRouterApiKey', savedOpenRouterKey);
            }
        } catch (error) {
            console.error("Could not access localStorage. API key will not be persisted.", error);
        }
    }, [setValue]);

    const handleGeneration = async (data: StoryFormData) => {
        setIsLoading(true);
        toast({
            title: 'Generating Web Story...',
            description: `AI is crafting a ${data.pageCount}-page story on "${data.topic}". This might take a few moments.`,
        });

        const result = await generateStoryAction(data);

        // Redirect on success is handled by the server action
        if (result && !result.success) {
            toast({
                title: 'Error Generating Story',
                description: result.error,
                variant: 'destructive',
                duration: 9000,
            });
        }
        setIsLoading(false);
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
                                            onValueChange={(value) => field.onChange(parseInt(value))} 
                                            defaultValue={String(field.value)} 
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
                                                <SelectItem value="featured">Featured</SelectItem>
                                                {/* Add other story categories here in the future */}
                                            </SelectContent>
                                        </Select>
                                        {errors.category && <p className="text-sm text-destructive mt-1">{errors.category.message}</p>}
                                    </div>
                                )}
                            />
                        </div>
                        
                         <div className="space-y-2 border-t pt-4">
                            <Label htmlFor="openRouterApiKey">OpenRouter API Key (Optional)</Label>
                            <div className="relative flex items-center">
                                <KeyRound className="absolute left-3 h-5 w-5 text-muted-foreground" />
                                <Input
                                    id="openRouterApiKey"
                                    type="password"
                                    placeholder="sk-or-v1-... (leave blank to use server key)"
                                    {...register('openRouterApiKey')}
                                    className="pl-10"
                                    disabled={isLoading}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">If you provide a key here, it will be used instead of the one on the server.</p>
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
