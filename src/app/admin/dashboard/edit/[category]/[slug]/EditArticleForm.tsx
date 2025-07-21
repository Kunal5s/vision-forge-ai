
'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Save, Trash2, Wand2, Eye, Globe, Upload } from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import type { Article } from '@/lib/articles';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { RichTextEditor } from '@/components/vision-forge/RichTextEditor';
import { ArticlePreview } from '@/components/vision-forge/ArticlePreview';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { IMAGE_COUNTS } from '@/lib/constants';
import { ManualArticleSchema, articleContentToHtml, getFullArticleHtmlForPreview } from '@/lib/types';
import { editArticleAction, deleteArticleAction, addImagesToArticleAction, autoSaveArticleDraftAction } from './actions';
import { useDebounce } from 'use-debounce';
import Image from 'next/image';


type EditFormData = z.infer<typeof ManualArticleSchema>;

interface EditArticleFormProps {
    article: Article;
    categorySlug: string;
}


export default function EditArticleForm({ article, categorySlug }: EditArticleFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddingImages, setIsAddingImages] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [imageCount, setImageCount] = useState(IMAGE_COUNTS[1].value); // Default to 2 images

  const { toast } = useToast();
  
  const form = useForm<EditFormData>({
    resolver: zodResolver(ManualArticleSchema),
    defaultValues: {
      title: article.title.replace(/<[^>]*>?/gm, ''),
      slug: article.slug,
      status: article.status || 'published',
      category: article.category,
      summary: article.summary || '',
      content: articleContentToHtml(article.articleContent),
      image: article.image || '',
      originalSlug: article.slug,
      originalStatus: article.status || 'published',
    }
  });

  const { register, handleSubmit, formState: { errors, isDirty }, control, getValues, setValue, watch, reset } = form;
  
  // Reset form when the article prop changes
    useEffect(() => {
        reset({
            title: article.title.replace(/<[^>]*>?/gm, ''),
            slug: article.slug,
            status: article.status || 'published',
            category: article.category,
            summary: article.summary || '',
            content: articleContentToHtml(article.articleContent),
            image: article.image || '',
            originalSlug: article.slug,
            originalStatus: article.status || 'published',
        });
    }, [article, reset]);

  
  const [debouncedValue] = useDebounce(watch(), 10000); // Watch all fields for debouncing
  
  const watchedImage = watch('image');
  const titleValue = watch('title');

  const autoSaveDraft = useCallback(async () => {
    if (isDirty && getValues('status') === 'draft') {
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

  const wordCount = watch('content').replace(/<[^>]*>?/gm, '').split(/\s+/).filter(Boolean).length;
  
  const getFullArticleHtml = useCallback(() => {
    return getFullArticleHtmlForPreview(getValues());
  }, [getValues]);


  const onSubmit = async (data: EditFormData) => {
    setIsSaving(true);
    const statusToSave = data.status || 'published';
    toast({ title: statusToSave === 'published' ? 'Publishing...' : 'Saving Changes...', description: "Updating your article on GitHub." });

    const result = await editArticleAction(data);

    if (result?.error) {
      toast({ title: "Error Saving", description: result.error, variant: 'destructive' });
    } else {
      toast({ title: "Article Saved!", description: `"${data.title}" has been updated.` });
      // Redirect is now handled by the server action
    }
    setIsSaving(false);
  };
  
  const handleDelete = async () => {
    setIsDeleting(true);
    toast({ title: "Deleting...", description: `Removing article "${article.title}".` });
    
    await deleteArticleAction(article.category, article.slug, article.status === 'draft');
    
    // Redirect is handled by the action, but we can toast success before navigation
    toast({ title: "Article Deleted", description: "The article has been successfully removed." });
  }

  const handleAddImages = async () => {
    setIsAddingImages(true);
    toast({ title: 'AI is reading your article...', description: 'Generating and adding relevant images. This may take a moment.' });
    
    try {
        const currentContent = getValues('content');
        if (!currentContent || currentContent.length < 50) {
            toast({ title: 'Content Too Short', description: 'Please write more content before adding images.', variant: 'destructive' });
            setIsAddingImages(false);
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
        setIsAddingImages(false);
    }
  };

  const handleGenerateFeaturedImage = useCallback(async (topic: string) => {
    if (!topic) return;
    setIsGeneratingImage(true);
    toast({ title: "Generating Image...", description: "Please wait while the AI creates a preview."});
    try {
        const seed = Math.floor(Math.random() * 1_000_000);
        const finalPrompt = `${topic}, digital art, high detail`;
        const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=600&height=400&seed=${seed}&nologo=true`;
        setValue('image', pollinationsUrl, { shouldValidate: true, shouldDirty: true });
        toast({ title: "Image Generated!", description: "A new featured image has been created."});
    } catch (e) {
        console.error("Failed to generate preview image", e);
        toast({ title: "Error", description: "Could not generate an image.", variant: "destructive" });
    } finally {
        setIsGeneratingImage(false);
    }
  }, [setValue, toast]);

  const handleManualImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({ title: "Invalid File", description: "Please upload an image.", variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target?.result as string;
        setValue('image', base64String, { shouldValidate: true, shouldDirty: true });
        toast({ title: "Image Uploaded", description: "New featured image is ready." });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      <ArticlePreview 
        isOpen={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        title={watch('title')}
        content={getFullArticleHtml()}
        category={watch('category')}
        image={watchedImage}
      />
      <div className="mb-8">
        <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
          <Link href="/admin/dashboard/edit">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to All Articles
          </Link>
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">Edit Article Content</CardTitle>
                        <CardDescription>
                            Your progress is saved as a draft when you stop typing. Use the buttons to publish.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="title">Title</Label>
                                <Input id="title" {...register('title')} disabled={isSaving || isDeleting} />
                                {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
                            </div>
                            <div>
                                <Label htmlFor="slug">Slug</Label>
                                <Input id="slug" {...register('slug')} disabled={isSaving || isDeleting} />
                                {errors.slug && <p className="text-sm text-destructive mt-1">{errors.slug.message}</p>}
                            </div>
                        </div>

                        <div>
                        <Label htmlFor="summary">Summary</Label>
                            <Controller
                                name="summary"
                                control={control}
                                render={({ field }) => (
                                    <RichTextEditor
                                        value={field.value || ''}
                                        onChange={field.onChange}
                                        disabled={isSaving || isDeleting}
                                        placeholder="A short, engaging summary for the top of the article."
                                    />
                                )}
                            />
                        {errors.summary && <p className="text-sm text-destructive mt-1">{errors.summary.message}</p>}
                        </div>

                        <div>
                        <Label htmlFor="content">Main Content</Label>
                        <Controller
                            name="content"
                            control={control}
                            render={({ field }) => (
                                <RichTextEditor 
                                    value={field.value} 
                                    onChange={field.onChange}
                                    disabled={isSaving || isDeleting || isAddingImages}
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
                            <Label>Featured Image</Label>
                            <div className="mt-2 aspect-video w-full rounded-md border bg-muted flex items-center justify-center overflow-hidden">
                                {isGeneratingImage ? (
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                ) : (
                                    watchedImage && <Image src={watchedImage} alt="Featured image preview" width={300} height={169} className="object-cover w-full h-full" data-ai-hint="article feature" />
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                <Button type="button" variant="secondary" onClick={() => handleGenerateFeaturedImage(titleValue)} disabled={isGeneratingImage || !titleValue}>
                                    <Wand2 className="mr-2 h-4 w-4" /> AI Generate
                                </Button>
                                <Button type="button" variant="outline" onClick={() => document.getElementById('manual-upload-input')?.click()} disabled={isGeneratingImage}>
                                    <Upload className="mr-2 h-4 w-4" /> Upload
                                </Button>
                                <input id="manual-upload-input" type="file" className="hidden" accept="image/*" onChange={handleManualImageUpload} />
                            </div>
                        </div>

                        <div>
                            <Label>AI Tools</Label>
                            <div className="flex flex-col sm:flex-row lg:flex-col gap-2 mt-2">
                                <Button type="button" variant="secondary" onClick={handleAddImages} disabled={isAddingImages || isSaving || isDeleting} className="w-full justify-center">
                                    {isAddingImages ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                                    Add Images
                                </Button>
                                <Select onValueChange={setImageCount} defaultValue={imageCount} disabled={isAddingImages || isSaving || isDeleting}>
                                    <SelectTrigger><SelectValue placeholder="Number of Images" /></SelectTrigger>
                                    <SelectContent>
                                        {IMAGE_COUNTS.map(opt => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                         <div className="space-y-2 border-t pt-4">
                            <Label>Actions</Label>
                            <div className="flex flex-col gap-2">
                                <Button onClick={handleSubmit((data) => {
                                    setValue('status', 'published');
                                    onSubmit(data);
                                })} className="w-full" disabled={isSaving || isDeleting || isAddingImages}>
                                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Globe className="mr-2 h-4 w-4" />}
                                    Publish
                                </Button>
                                <Button onClick={handleSubmit((data) => {
                                   setValue('status', 'draft');
                                   onSubmit(data);
                                })} variant="secondary" className="w-full" disabled={isSaving || isDeleting || isAddingImages}>
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Save as Draft
                                </Button>
                                <Button type="button" variant="outline" onClick={() => setIsPreviewOpen(true)} className="w-full">
                                    <Eye className="mr-2 h-4 w-4" />
                                    Preview Article
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                    <Button type="button" variant="destructive" disabled={isSaving || isDeleting || isAddingImages} className="w-full">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete Article
                                    </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete the article from your GitHub repository.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90" disabled={isDeleting}>
                                            {isDeleting ? 'Deleting...' : 'Yes, delete it'}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                         </div>
                    </CardContent>
                </Card>
            </div>
        </div>
      </form>
    </>
  );
}
