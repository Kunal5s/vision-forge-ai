

'use client';

import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, PlusCircle, Trash2, FileSignature, Upload, Wand2, RefreshCw, Eye } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createManualStoryAction, generateStoryScenesAction } from './actions';
import { categorySlugMap } from '@/lib/constants';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

// Schema for a single page on the client
const StoryPageClientSchema = z.object({
  imageUrl: z.string().min(1, "An image is required for each page."),
  caption: z.string().min(1, "Caption cannot be empty.").max(250, "Caption cannot be more than 250 characters."),
  imagePrompt: z.string().optional(),
});

// Schema for the full story form
const StoryFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long."),
  slug: z.string().min(3, "Slug is required.").regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and dashes.'),
  seoDescription: z.string().min(10, "SEO Description is required.").max(160, "Description cannot be more than 160 characters."),
  category: z.string().min(1, "Please select a category."),
  websiteUrl: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
  pages: z.array(StoryPageClientSchema).min(5, "A story must have at least 5 pages.").max(50, "A story cannot have more than 50 pages."),
});

type StoryFormData = z.infer<typeof StoryFormSchema>;

interface Scene {
  image_prompt: string;
  caption: string;
}

export default function CreateManualStoryPage() {
    const [isPublishing, setIsPublishing] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const { toast } = useToast();

    // State for the AI generator form
    const [aiTopic, setAiTopic] = useState('');
    const [aiDescription, setAiDescription] = useState('');
    const [aiImageCount, setAiImageCount] = useState(20);

    const { register, handleSubmit, control, formState: { errors }, watch, setValue } = useForm<StoryFormData>({
        resolver: zodResolver(StoryFormSchema),
        defaultValues: {
            title: '',
            slug: '',
            seoDescription: '',
            category: 'Featured',
            websiteUrl: '',
            pages: [],
        },
    });

    const { fields, append, remove, replace } = useFieldArray({
        control,
        name: "pages",
    });

    const titleValue = watch('title');
    const pagesValue = watch('pages');

    const generateSlug = useCallback((title: string) => {
        return title.toLowerCase().replace(/<[^>]*>?/gm, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/^-+|-+$/g, '');
    }, []);

    useEffect(() => {
        if (titleValue) {
            setValue('slug', generateSlug(titleValue), { shouldValidate: true });
        }
    }, [titleValue, setValue, generateSlug]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                toast({ title: "Invalid File Type", description: "Please upload a valid image file (PNG, JPG, WebP).", variant: "destructive" });
                return;
            }
            if (file.size > 4 * 1024 * 1024) { // 4MB limit
                toast({ title: "File Too Large", description: "Image size cannot exceed 4MB.", variant: "destructive" });
                return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64String = event.target?.result as string;
                setValue(`pages.${index}.imageUrl`, base64String, { shouldValidate: true, shouldDirty: true });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerateImages = async () => {
        if (!aiTopic || !aiDescription) {
            toast({ title: "Topic and Description Required", description: "Please fill out both topic and description to generate images.", variant: "destructive" });
            return;
        }
        setIsGenerating(true);
        toast({ title: "AI Story Generation Started...", description: `Generating ${aiImageCount} scenes. This may take a few minutes.` });

        const scenesResult = await generateStoryScenesAction({ topic: aiTopic, description: aiDescription, imageCount: aiImageCount });

        if (!scenesResult.success || !scenesResult.scenes) {
            setIsGenerating(false);
            toast({ title: "Scene Generation Failed", description: scenesResult.error || "The AI failed to generate story ideas.", variant: "destructive" });
            return;
        }

        toast({ title: "Scenes Generated!", description: "Now generating images for each scene. Please be patient." });
        
        const imagePromises = scenesResult.scenes.map(async (scene): Promise<z.infer<typeof StoryPageClientSchema> | null> => {
            try {
                const finalPrompt = `${scene.image_prompt}, 9:16 aspect ratio, vertical, cinematic`;
                const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=1080&height=1920&seed=${Math.floor(Math.random() * 100000)}&nologo=true`;

                // We are using the direct URL from Pollinations.ai for simplicity here.
                // A more robust implementation might fetch and convert to Base64, but that's much slower.
                return {
                    imageUrl: pollinationsUrl,
                    caption: scene.caption,
                    imagePrompt: scene.image_prompt,
                };
            } catch (e) {
                console.error("Error generating single image:", e);
                return null;
            }
        });

        const newPages = (await Promise.all(imagePromises)).filter(p => p !== null) as z.infer<typeof StoryPageClientSchema>[];

        if (newPages.length < 5) {
             toast({ title: "Image Generation Incomplete", description: `Only ${newPages.length} images were created. Please try again.`, variant: "destructive" });
        } else {
            replace(newPages);
            toast({ title: "Images Generated!", description: `Successfully created ${newPages.length} story pages.` });
        }

        setIsGenerating(false);
    };

    const handleFormSubmit = async (data: StoryFormData) => {
        setIsPublishing(true);
        toast({ title: 'Publishing Web Story...', description: 'Please wait while we save your story to GitHub.' });
        
        const result = await createManualStoryAction(data);
        if (result && !result.success) {
            toast({ title: 'Error Publishing Story', description: result.error, variant: 'destructive', duration: 9000 });
        }
        setIsPublishing(false);
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                 <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2"><Wand2 /> AI Story Generator</CardTitle>
                        <CardDescription>
                            Provide a topic and description, and let AI generate a full web story for you. You can edit it afterwards.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="aiTopic">Topic</Label>
                            <Input id="aiTopic" value={aiTopic} onChange={e => setAiTopic(e.target.value)} placeholder="e.g., The Secret Life of Urban Foxes" disabled={isGenerating} />
                        </div>
                         <div>
                            <Label htmlFor="aiDescription">Short Description</Label>
                            <Textarea id="aiDescription" value={aiDescription} onChange={e => setAiDescription(e.target.value)} placeholder="e.g., A visual story exploring the nightly adventures of foxes in a neon-lit city." disabled={isGenerating} rows={3} />
                        </div>
                        <div>
                            <Label htmlFor="aiImageCount">Number of Images (20-50)</Label>
                            <Input id="aiImageCount" type="number" value={aiImageCount} onChange={e => setAiImageCount(Math.max(20, Math.min(50, parseInt(e.target.value, 10) || 20)))} min="20" max="50" disabled={isGenerating} />
                        </div>
                        <Button onClick={handleGenerateImages} disabled={isGenerating} className="w-full">
                            {isGenerating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : 'Generate Story with AI'}
                        </Button>
                    </CardContent>
                </Card>

                <Card className="lg:sticky lg:top-24">
                     <CardHeader>
                        <CardTitle className="text-xl">Final Story Details</CardTitle>
                        <CardDescription>
                            Review the generated content and provide the final details before publishing.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                            <div>
                                <Label htmlFor="title">Story Title</Label>
                                <Input id="title" {...register('title')} placeholder="e.g., A Journey Through the Himalayas" disabled={isPublishing} />
                                {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
                            </div>
                            <div>
                                <Label htmlFor="slug">Story Slug (URL)</Label>
                                <Input id="slug" {...register('slug')} placeholder="a-journey-through-the-himalayas" disabled={isPublishing} />
                                {errors.slug && <p className="text-sm text-destructive mt-1">{errors.slug.message}</p>}
                            </div>
                            <div>
                                <Label htmlFor="websiteUrl">Website Link (Optional)</Label>
                                <Input id="websiteUrl" {...register('websiteUrl')} placeholder="https://example.com" disabled={isPublishing} />
                                {errors.websiteUrl && <p className="text-sm text-destructive mt-1">{errors.websiteUrl.message}</p>}
                            </div>
                             <div>
                                <Label htmlFor="seoDescription">SEO Description (Max 160 characters)</Label>
                                <Textarea id="seoDescription" {...register('seoDescription')} placeholder="A short, catchy description for search engines." disabled={isPublishing} rows={2} />
                                {errors.seoDescription && <p className="text-sm text-destructive mt-1">{errors.seoDescription.message}</p>}
                            </div>
                            <div>
                                <Label>Category</Label>
                                 <Controller
                                    name="category"
                                    control={control}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isPublishing}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(categorySlugMap).map(([slug, name]) => (
                                                    <SelectItem key={slug} value={name}>{name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.category && <p className="text-sm text-destructive mt-1">{errors.category.message}</p>}
                            </div>
                            <div className="border-t pt-4">
                                <Button type="submit" className="w-full" disabled={isPublishing || fields.length < 5}>
                                    {isPublishing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publishing...</> : <><FileSignature className="mr-2 h-4 w-4" /> Publish Story</>}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
            
            <Card className="mt-8 col-span-1 lg:col-span-2">
                <CardHeader>
                    <CardTitle>Edit Story Pages ({fields.length})</CardTitle>
                    <CardDescription>Review, edit, remove, or add pages to your story. You need at least 5 pages to publish.</CardDescription>
                     {errors.pages && <p className="text-sm text-destructive mt-2">{errors.pages.root?.message || errors.pages.message}</p>}
                </CardHeader>
                <CardContent>
                    <ScrollArea className="w-full">
                        <div className="flex space-x-4 pb-4">
                            {fields.map((field, index) => (
                                <div key={field.id} className="p-4 border rounded-md space-y-2 relative bg-background w-[220px] shrink-0">
                                     <Label className="font-semibold">Page {index + 1}</Label>
                                    <div className="aspect-[9/16] relative bg-muted rounded-md overflow-hidden">
                                        {pagesValue[index]?.imageUrl && (
                                            <Image 
                                                src={pagesValue[index].imageUrl} 
                                                alt={`Preview for page ${index + 1}`} 
                                                layout="fill"
                                                objectFit="cover"
                                            />
                                        )}
                                    </div>
                                    <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => (document.getElementById(`file-input-${index}`) as HTMLInputElement)?.click()} disabled={isPublishing}>
                                        <Upload className="mr-2 h-4 w-4" />
                                        Upload Image
                                    </Button>
                                    <input
                                        id={`file-input-${index}`}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        className="hidden"
                                        onChange={(e) => handleFileChange(e, index)}
                                    />
                                    {errors.pages?.[index]?.imageUrl && <p className="text-sm text-destructive mt-1">{errors.pages[index]?.imageUrl?.message}</p>}
                                    <Textarea {...register(`pages.${index}.caption`)} placeholder="A short, engaging caption." disabled={isPublishing} rows={3} />
                                    {errors.pages?.[index]?.caption && <p className="text-sm text-destructive mt-1">{errors.pages[index]?.caption?.message}</p>}
                                    <Button type="button" variant="destructive" size="sm" className="w-full" onClick={() => remove(index)} disabled={isPublishing}>
                                        <Trash2 className="mr-2 h-4 w-4" /> Remove
                                    </Button>
                                </div>
                            ))}
                            <div className="flex items-center justify-center w-[220px] shrink-0">
                                <Button type="button" variant="outline" onClick={() => append({ imageUrl: '', caption: '', imagePrompt: 'manual upload' })} disabled={isPublishing || fields.length >= 50}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Add Page
                                </Button>
                            </div>
                        </div>
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </CardContent>
            </Card>
        </main>
    );
}
