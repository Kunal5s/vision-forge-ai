
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
import { ArrowLeft, Loader2, PlusCircle, Trash2, FileSignature, Upload, Wand2, Eye, Sparkles, Image as ImageIcon } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createManualStoryAction, generateStoryImagesAction } from './actions';
import { categorySlugMap, CAPTION_STYLES } from '@/lib/constants';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { StoryPlayer } from '@/components/vision-forge/StoryPlayer';
import type { Story } from '@/lib/stories';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';


// Schema for a single page on the client
const StoryPageClientSchema = z.object({
  imageUrl: z.string().min(1, "An image is required for each page."),
  caption: z.string().min(1, "Caption cannot be empty.").max(250, "Caption cannot be more than 250 characters."),
  imagePrompt: z.string().optional(),
  styleName: z.string().optional().default('Classic Black'),
});

// Schema for the full story form
const StoryFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long."),
  slug: z.string().min(3, "Slug is required.").regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and dashes.'),
  seoDescription: z.string().min(10, "SEO Description is required.").max(160, "Description cannot be more than 160 characters."),
  category: z.string().min(1, "Please select a category."),
  logo: z.string().optional(),
  websiteUrl: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
  pages: z.array(StoryPageClientSchema).min(5, "A story must have at least 5 pages.").max(50, "A story cannot have more than 50 pages."),
});

type StoryFormData = z.infer<typeof StoryFormSchema>;

const imageCountOptions = Array.from({ length: 16 }, (_, i) => 5 + i); // Generates numbers 5 to 20

export default function CreateManualStoryPage() {
    const [isPublishing, setIsPublishing] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const { toast } = useToast();
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    // State for the AI generator form
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiImageCount, setAiImageCount] = useState(10);
    const [globalStyle, setGlobalStyle] = useState('Classic Black');


    const { register, handleSubmit, control, formState: { errors }, watch, setValue } = useForm<StoryFormData>({
        resolver: zodResolver(StoryFormSchema),
        defaultValues: {
            title: '',
            slug: '',
            seoDescription: '',
            category: 'Featured',
            logo: '',
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
    const logoValue = watch('logo');
    const websiteUrlValue = watch('websiteUrl');
    const seoDescriptionValue = watch('seoDescription');
    const categoryValue = watch('category');

    // Effect to apply global style to all pages
    useEffect(() => {
        pagesValue.forEach((_, index) => {
            setValue(`pages.${index}.styleName`, globalStyle, { shouldDirty: true });
        });
    }, [globalStyle, pagesValue, setValue]);


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

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                toast({ title: "Invalid File Type", description: "Please upload an image file.", variant: "destructive" });
                return;
            }
             if (file.size > 2 * 1024 * 1024) { // 2MB limit for logo
                toast({ title: "File Too Large", description: "Logo size cannot exceed 2MB.", variant: "destructive" });
                return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                setValue('logo', event.target?.result as string, { shouldValidate: true, shouldDirty: true });
            };
            reader.readAsDataURL(file);
        }
    };


    const handleGenerateImages = async () => {
        if (!aiPrompt) {
            toast({ title: "Prompt Required", description: "Please enter a prompt to generate images.", variant: "destructive" });
            return;
        }
        setIsGenerating(true);
        toast({ title: "AI Image Generation Started...", description: `Generating ${aiImageCount} images. This may take a few moments.` });

        const result = await generateStoryImagesAction({ prompt: aiPrompt, imageCount: aiImageCount });
        
        if (result.success && result.images) {
            const newPages = result.images.map(img => ({
                imageUrl: img.imageUrl,
                caption: '', // Leave caption empty for manual input
                imagePrompt: img.imagePrompt,
                styleName: globalStyle, // Apply global style
            }));
            replace(newPages);
            toast({ title: "Images Generated!", description: `Successfully created ${newPages.length} story pages. Now, add your captions.` });
        } else {
            toast({ title: "Image Generation Failed", description: result.error || "The AI failed to generate images.", variant: "destructive" });
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

     const constructPreviewStory = (): Story => {
        return {
            slug: 'preview-story',
            title: titleValue || 'Preview Title',
            seoDescription: seoDescriptionValue || 'A preview of the web story.',
            author: 'Preview Author',
            category: categoryValue || 'Featured',
            publishedDate: new Date().toISOString(),
            status: 'published',
            logo: logoValue,
            websiteUrl: websiteUrlValue,
            cover: pagesValue[0]?.imageUrl || 'https://placehold.co/1080x1920.png',
            dataAiHint: pagesValue[0]?.imagePrompt || 'preview',
            pages: pagesValue.map(p => ({
                type: 'image',
                url: p.imageUrl,
                dataAiHint: p.imagePrompt || 'preview',
                styleName: p.styleName,
                content: {
                    title: p.caption,
                }
            })),
        };
    };
    
    return (
        <main className="flex-grow container mx-auto py-12 px-4 bg-muted/20 min-h-screen">
            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogContent className="p-0 border-0 bg-transparent max-w-[420px] h-full shadow-none">
                    <StoryPlayer story={constructPreviewStory()} isPreview={true} onClose={() => setIsPreviewOpen(false)} />
                </DialogContent>
            </Dialog>

            <div className="mb-8">
                <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
                    <Link href="/admin/dashboard">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Link>
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                 <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2"><Wand2 /> AI Image Generator</CardTitle>
                        <CardDescription>
                            Provide a prompt and let Pollinations.ai generate a set of images for your story. Captions will be left blank for you to fill.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="aiPrompt">Image Prompt</Label>
                            <Textarea id="aiPrompt" value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="e.g., A majestic dragon soaring over a mystical forest at dawn" disabled={isGenerating} rows={3} />
                        </div>
                        <div>
                            <Label htmlFor="aiImageCount">Number of Images</Label>
                             <Select
                                onValueChange={(value) => setAiImageCount(parseInt(value, 10))}
                                defaultValue={String(aiImageCount)}
                                disabled={isGenerating}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select number of images" />
                                </SelectTrigger>
                                <SelectContent>
                                    {imageCountOptions.map(count => (
                                        <SelectItem key={count} value={String(count)}>{count} Images</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button onClick={handleGenerateImages} disabled={isGenerating || !aiPrompt} className="w-full">
                            {isGenerating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : <><Sparkles className="mr-2 h-4 w-4" /> Generate Images</>}
                        </Button>
                    </CardContent>
                </Card>

                <Card className="lg:sticky lg:top-24">
                     <CardHeader>
                        <CardTitle className="text-xl">Final Story Details</CardTitle>
                        <CardDescription>
                            Review the content and provide the final details before publishing.
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
                                <Label>Brand Logo (Optional)</Label>
                                <div className="mt-1 flex items-center gap-4">
                                    <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center border">
                                        {logoValue ? <Image src={logoValue} alt="Logo Preview" width={64} height={64} className="object-contain" /> : <ImageIcon className="h-8 w-8 text-muted-foreground"/>}
                                    </div>
                                    <Button type="button" variant="outline" onClick={() => (document.getElementById('logo-input') as HTMLInputElement)?.click()} disabled={isPublishing}>
                                        <Upload className="mr-2 h-4 w-4" /> Upload Logo
                                    </Button>
                                    <input
                                        id="logo-input"
                                        type="file"
                                        accept="image/png, image/jpeg, image/webp"
                                        className="hidden"
                                        onChange={handleLogoUpload}
                                    />
                                </div>
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
                            <div className="border-t pt-4 flex flex-col gap-2">
                                <Button type="button" variant="outline" onClick={() => setIsPreviewOpen(true)} disabled={isPublishing || isGenerating}>
                                    <Eye className="mr-2 h-4 w-4" /> Preview Story
                                </Button>
                                <Button type="submit" className="w-full" disabled={isPublishing || isGenerating || fields.length < 5}>
                                    {isPublishing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publishing...</> : <><FileSignature className="mr-2 h-4 w-4" /> Publish Story</>}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
            
            <Card className="mt-8 col-span-1 lg:col-span-2">
                <CardHeader>
                    <div className='flex flex-col sm:flex-row justify-between sm:items-center gap-4'>
                        <div>
                            <CardTitle>Edit Story Pages ({fields.length})</CardTitle>
                            <CardDescription>Add captions, remove pages, or upload your own. You need at least 5 pages to publish.</CardDescription>
                        </div>
                        <div className="w-full sm:w-auto">
                            <Label className="text-xs">Apply Style to All Pages</Label>
                             <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start text-left font-normal h-9">
                                        <span>{globalStyle}</span>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[260px] p-0" align="start">
                                    <ScrollArea className="h-72">
                                        <div className="p-2 space-y-1">
                                            {CAPTION_STYLES.map((style) => (
                                                <Button
                                                    key={style.name}
                                                    variant="ghost"
                                                    className={cn("w-full h-auto justify-start p-2 text-left", style.className)}
                                                    onClick={() => setGlobalStyle(style.name)}
                                                >
                                                    {style.name}
                                                </Button>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                     {errors.pages && <p className="text-sm text-destructive mt-2">{errors.pages.root?.message || errors.pages.message}</p>}
                </CardHeader>
                <CardContent>
                     {isGenerating && (
                        <div className="flex items-center justify-center h-64 text-muted-foreground">
                            <Loader2 className="mr-4 h-8 w-8 animate-spin" />
                            <p>Generating images, please wait...</p>
                        </div>
                    )}
                    {!isGenerating && fields.length > 0 && (
                        <ScrollArea className="w-full">
                            <div className="flex space-x-4 pb-4">
                                {fields.map((field, index) => (
                                    <div key={field.id} className="p-4 border rounded-md space-y-3 relative bg-background w-[220px] shrink-0">
                                        <Label className="font-semibold">Page {index + 1}</Label>
                                        <div className="aspect-[9/16] relative bg-muted rounded-md overflow-hidden">
                                            {pagesValue[index]?.imageUrl ? (
                                                <Image 
                                                    src={pagesValue[index].imageUrl} 
                                                    alt={`Preview for page ${index + 1}`} 
                                                    width={220}
                                                    height={391}
                                                    className="object-cover w-full h-full"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-muted-foreground text-xs p-2">Upload an image</div>
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
                                        
                                        <div>
                                            <Label htmlFor={`caption-${index}`} className="text-xs">Caption</Label>
                                            <Textarea id={`caption-${index}`} {...register(`pages.${index}.caption`)} placeholder="Enter caption..." disabled={isPublishing} rows={3} />
                                            {errors.pages?.[index]?.caption && <p className="text-sm text-destructive mt-1">{errors.pages[index]?.caption?.message}</p>}
                                        </div>

                                        <Button type="button" variant="destructive" size="sm" className="w-full !mt-4" onClick={() => remove(index)} disabled={isPublishing}>
                                            <Trash2 className="mr-2 h-4 w-4" /> Remove
                                        </Button>
                                    </div>
                                ))}
                                <div className="flex items-center justify-center w-[220px] shrink-0">
                                    <Button type="button" variant="outline" onClick={() => append({ imageUrl: '', caption: '', imagePrompt: 'manual upload', styleName: globalStyle })} disabled={isPublishing || fields.length >= 50}>
                                        <PlusCircle className="mr-2 h-4 w-4" /> Add Page
                                    </Button>
                                </div>
                            </div>
                            <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                    )}
                </CardContent>
            </Card>
        </main>
    );
}
