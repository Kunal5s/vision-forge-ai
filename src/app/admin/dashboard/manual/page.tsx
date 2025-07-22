
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
import { categorySlugMap, IMAGE_COUNTS } from '@/lib/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, FileSignature, ImageIcon, Wand2, Eye, Save } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useDebounce } from 'use-debounce';
import Image from 'next/image';
import { RichTextEditor } from '@/components/vision-forge/RichTextEditor';
import { ArticlePreview } from '@/components/vision-forge/ArticlePreview';
import { ManualArticleSchema, getFullArticleHtmlForPreview } from '@/lib/types';
import { createManualArticleAction, addImagesToArticleAction, autoSaveArticleDraftAction } from './actions';

type ManualArticleFormData = z.infer<typeof ManualArticleSchema>;

export default function ManualPublishPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isAddingImagesToArticle, setIsAddingImagesToArticle] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [imageCount, setImageCount] = useState(IMAGE_COUNTS[1].value); 

  const { toast } = useToast();
  const { register, handleSubmit, control, formState: { errors, isDirty }, watch, setValue, getValues } = useForm<ManualArticleFormData>({
    resolver: zodResolver(ManualArticleSchema),
    defaultValues: {
      title: '',
      slug: '',
      summary: '',
      content: '',
      status: 'draft',
      image: '',
    }
  });
  
  const [debouncedValue] = useDebounce(watch(), 10000); // Watch all form fields
  
  const autoSaveDraft = useCallback(async () => {
    if (isDirty && getValues('title') && getValues('slug') && getValues('category')) {
        const result = await autoSaveArticleDraftAction(getValues());
        if (result.success) {
            toast({ title: 'Draft Auto-Saved', description: 'Your progress has been saved.' });
        } else {
            console.error("Autosave failed:", result.error);
        }
    }
  }, [getValues, isDirty, toast]);
  
  useEffect(() => {
    autoSaveDraft();
  }, [debouncedValue, autoSaveDraft]);

  const wordCount = (watch('content') || '').replace(/<[^>]*>?/gm, '').split(/\s+/).filter(Boolean).length;
  
  const titleValue = watch('title');
  const categoryValue = watch('category');

  const generateSlug = useCallback((title: string) => {
    return title
      .toLowerCase()
      .replace(/<[^>]*>?/gm, '') // strip html
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/^-+|-+$/g, '');
  }, []);
  
  useEffect(() => {
    if (titleValue) {
        const newSlug = generateSlug(titleValue);
        setValue('slug', newSlug, { shouldValidate: true });
    }
  }, [titleValue, setValue, generateSlug]);
  
  const fetchPreviewImage = useCallback(async (topic: string) => {
    if (!topic) return;
    setIsGeneratingImage(true);
    toast({ title: "Generating Image...", description: "Please wait while the AI creates a preview."});
    try {
        const seed = Math.floor(Math.random() * 1_000_000);
        const finalPrompt = `${topic}, digital art, high detail`;
        const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=600&height=400&seed=${seed}&nologo=true`;
        setPreviewImage(pollinationsUrl);
        setValue('image', pollinationsUrl, { shouldValidate: true, shouldDirty: true });
        toast({ title: "Image Generated!", description: "A preview image has been created."});
    } catch (e) {
        console.error("Failed to generate preview image", e);
        const placeholder = 'https://placehold.co/600x400.png';
        setPreviewImage(placeholder);
        setValue('image', placeholder, { shouldValidate: true, shouldDirty: true });
        toast({ title: "Error", description: "Could not generate an image.", variant: "destructive" });
    } finally {
        setIsGeneratingImage(false);
    }
  }, [setValue, toast]);

  const addImagesToArticle = async () => {
    setIsAddingImagesToArticle(true);
    toast({ title: 'AI is reading your article...', description: 'Generating and adding relevant images. This may take a moment.' });
    
    try {
        const currentContent = getValues('content');
        if (!currentContent || currentContent.length < 50) {
            toast({ title: 'Content Too Short', description: 'Please write more content before adding images.', variant: 'destructive' });
            setIsAddingImagesToArticle(false);
            return;
        }
        const result = await addImagesToArticleAction(currentContent, parseInt(imageCount, 10));

        if (result.success && result.content) {
            setValue('content', result.content, { shouldDirty: true, shouldValidate: true });
            toast({ title: 'Images Added!', description: 'AI has added contextual images to your article.' });
        } else {
            throw new Error(result.error || "Failed to add images.");
        }

    } catch (e: any) {
        console.error("Failed to add images to article", e);
        toast({ title: 'Error Adding Images', description: e.message || 'Could not automatically add images.', variant: 'destructive' });
    } finally {
        setIsAddingImagesToArticle(false);
    }
  };
  

  const onSubmit = async (data: ManualArticleFormData) => {
    setIsSubmitting(true);
    const status = data.status || 'draft';
    
    toast({
      title: status === 'published' ? 'Publishing...' : 'Saving Draft...',
      description: `Saving "${data.title}". Please wait.`,
    });

    if (!data.image) {
        toast({
            title: 'Error',
            description: 'Please generate or provide a featured image URL before publishing.',
            variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
    }
    
    try {
        await createManualArticleAction(data);
        toast({
            title: status === 'published' ? 'Article Published!' : 'Draft Saved!',
            description: `Your article "${data.title}" has been saved.`,
        });
    } catch (e: any) {
      toast({
        title: 'Error Saving Article',
        description: e.message,
        variant: 'destructive',
        duration: 9000,
      });
      setIsSubmitting(false);
    }
  };

  const getFullArticleHtml = useCallback(() => {
    return getFullArticleHtmlForPreview(getValues());
  }, [getValues]);
  

  return (
    <main className="flex-grow container mx-auto py-12 px-4 bg-muted/20 min-h-screen">
       <ArticlePreview 
        isOpen={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        title={watch('title')}
        content={getFullArticleHtml()}
        category={categoryValue}
        image={previewImage || watch('image') || ''}
      />
      <div className="mb-8">
        <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
          <Link href="/admin/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">Publish a New Article Manually</CardTitle>
                    <CardDescription>
                    Write your article below. Save as a draft, or publish to the live site when ready.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="title" className="text-lg font-semibold">Article Title</Label>
                    <Input 
                      id="title" 
                      placeholder="Your engaging article title..."
                      {...register('title')} 
                      disabled={isSubmitting}
                      className="text-2xl font-bold h-auto py-2 border-0 shadow-none px-0 focus-visible:ring-0" 
                    />
                    {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
                    <Input id="slug" placeholder="your-slug-will-be-here" {...register('slug')} disabled className="border-0 px-0 h-auto text-sm text-muted-foreground" />
                    {errors.slug && <p className="text-sm text-destructive mt-1">{errors.slug.message}</p>}
                  </div>

                  <div>
                    <Label htmlFor="summary" className="text-lg font-semibold">Summary</Label>
                    <Controller
                        name="summary"
                        control={control}
                        render={({ field }) => (
                            <RichTextEditor 
                                value={field.value || ''} 
                                onChange={field.onChange}
                                disabled={isSubmitting}
                                placeholder="A short, engaging summary for the top of the article."
                            />
                        )}
                    />
                    {errors.summary && <p className="text-sm text-destructive mt-1">{errors.summary.message}</p>}
                  </div>

                  <div>
                    <Label htmlFor="content" className="text-lg font-semibold">Content</Label>
                    <Controller
                        name="content"
                        control={control}
                        render={({ field }) => (
                            <RichTextEditor 
                                value={field.value} 
                                onChange={field.onChange}
                                disabled={isAddingImagesToArticle || isSubmitting}
                            />
                        )}
                    />
                    {errors.content && <p className="text-sm text-destructive mt-1">{errors.content.message}</p>}
                  </div>
              </CardContent>
            </Card>
        </div>

        <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
            <Card>
                <CardHeader>
                    <CardTitle>Publishing Tools</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div>
                        <p className="text-sm font-medium">Word Count: <span className="font-bold text-primary">{wordCount}</span></p>
                    </div>

                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Controller
                        name="category"
                        control={control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} defaultValue={field.value || ''} value={field.value || ''} disabled={isSubmitting}>
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
                        <Label>Featured Image</Label>
                        <div className="mt-2 aspect-video w-full rounded-md border bg-muted flex items-center justify-center overflow-hidden">
                            {isGeneratingImage ? (
                                <div className="text-center text-muted-foreground p-4">
                                  <Loader2 className="mx-auto h-10 w-10 animate-spin" />
                                  <p className="text-sm mt-2">Generating image...</p>
                                </div>
                            ) : previewImage || watch('image') ? (
                                <Image 
                                  src={previewImage || watch('image')} 
                                  alt="Article preview"
                                  width={600}
                                  height={400}
                                  className="object-cover"
                                  data-ai-hint="manual content feature"
                                  key={previewImage || watch('image')}
                                />
                            ) : (
                                <div className="text-center text-muted-foreground p-4">
                                  <ImageIcon className="mx-auto h-10 w-10" />
                                  <p className="text-sm mt-2">Enter a title to generate a preview image.</p>
                                </div>
                            )}
                        </div>
                        <Button
                            type="button"
                            variant="secondary"
                            className="w-full mt-2"
                            onClick={() => fetchPreviewImage(titleValue)}
                            disabled={isGeneratingImage || !titleValue || isSubmitting}
                        >
                            {isGeneratingImage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-2 h-4 w-4" />}
                            Generate Image from Title
                        </Button>
                         {errors.image && <p className="text-sm text-destructive mt-1">{errors.image.message}</p>}
                    </div>
                    
                    <div className="space-y-2 border-t pt-4">
                        <Label>AI Tools</Label>
                         <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={addImagesToArticle}
                                disabled={isAddingImagesToArticle || isSubmitting}
                                className="w-full justify-center"
                            >
                                {isAddingImagesToArticle ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Wand2 className="mr-2 h-4 w-4" />
                                )}
                                Add Images
                            </Button>
                            <Select onValueChange={setImageCount} defaultValue={imageCount} disabled={isAddingImagesToArticle || isSubmitting}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Number of Images" />
                                </SelectTrigger>
                                <SelectContent>
                                    {IMAGE_COUNTS.map(opt => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2 border-t pt-4">
                      <Label>Actions</Label>
                      <Button onClick={handleSubmit((data) => {
                          setValue('status', 'published');
                          onSubmit(data);
                      })} className="w-full" disabled={isSubmitting || isGeneratingImage}>
                        {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : <><FileSignature className="mr-2 h-4 w-4" /> Publish Article</>}
                      </Button>
                       <Button onClick={handleSubmit((data) => {
                           setValue('status', 'draft');
                           onSubmit(data);
                       })} variant="secondary" className="w-full" disabled={isSubmitting || isGeneratingImage}>
                        {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : <><Save className="mr-2 h-4 w-4" /> Save as Draft</>}
                      </Button>
                      <Button type="button" variant="outline" className="w-full" onClick={() => setIsPreviewOpen(true)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Preview Article
                      </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
      </form>
    </main>
  );
}
