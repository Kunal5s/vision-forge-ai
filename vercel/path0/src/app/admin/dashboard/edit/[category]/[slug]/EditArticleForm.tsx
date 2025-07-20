
'use client';

import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Save, Trash2, Wand2, Eye, PlusCircle, Globe, FileText, CheckCircle } from 'lucide-react';
import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import type { Article } from '@/lib/articles';
import { editArticleAction, deleteArticleAction } from '@/lib/articles';
import { autoSaveArticleDraft } from './actions';
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
import { IMAGE_COUNTS, categorySlugMap } from '@/lib/constants';
import { ManualArticleSchema as EditSchema } from '@/lib/types';
import { addImagesToArticleAction } from '../../../manual/actions';


type EditFormData = z.infer<typeof EditSchema>;

interface EditArticleFormProps {
    article: Article;
    categorySlug: string;
}

const contentToHtml = (content: Article['articleContent']): string => {
    return content.map(block => {
        // Since content is now stored as HTML, this can be simplified.
        // The block.type is less relevant if block.content is full HTML.
        return block.content;
    }).join(''); 
}

export default function EditArticleForm({ article, categorySlug }: EditArticleFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddingImages, setIsAddingImages] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [imageCount, setImageCount] = useState(IMAGE_COUNTS[1].value); // Default to 2 images
  
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { toast } = useToast();
  
  const { register, handleSubmit, formState: { errors, isDirty }, control, getValues, setValue, watch, reset } = useForm<EditFormData>({
    resolver: zodResolver(EditSchema),
    defaultValues: {
      title: article.title.replace(/<[^>]*>?/gm, ''),
      slug: article.slug,
      status: article.status || 'published',
      category: article.category,
      summary: article.summary || '',
      content: contentToHtml(article.articleContent),
      keyTakeaways: article.keyTakeaways?.map(t => ({ value: t })) || [{ value: '' }],
      conclusion: article.conclusion || '',
      image: article.image || '',
      originalSlug: article.slug,
    }
  });

  const formValues = watch(); // Watch all form values
  const wordCount = watch('content').replace(/<[^>]*>?/gm, '').split(/\s+/).filter(Boolean).length;
  const isPublishedArticle = article.status === 'published';

  // Auto-saving logic
  useEffect(() => {
    const performAutoSave = async () => {
      setAutoSaveStatus('saving');
      const currentData = getValues();
      const draftArticleData: Article = {
          title: currentData.title || 'Untitled Draft',
          slug: currentData.slug,
          category: currentData.category,
          status: 'draft', // Always save as draft
          image: currentData.image || 'https://placehold.co/600x400.png',
          dataAiHint: article.dataAiHint || 'draft content',
          publishedDate: article.publishedDate || new Date().toISOString(),
          summary: currentData.summary,
          articleContent: [{ type: 'p', content: currentData.content, alt: '' }], // Simplified for draft
          keyTakeaways: (currentData.keyTakeaways || []).map(t => t.value),
          conclusion: currentData.conclusion,
      };

      const result = await autoSaveArticleDraft(draftArticleData);
      
      if (result.success) {
        setAutoSaveStatus('saved');
      } else {
        setAutoSaveStatus('error');
        console.error("Auto-save failed:", result.error);
      }
    };
    
    if (isDirty) {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      debounceTimeoutRef.current = setTimeout(performAutoSave, 10000); // Auto-save every 10 seconds
    }
    
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [formValues, isDirty, getValues, article]);


  const { fields, append, remove } = useFieldArray({
    control,
    name: "keyTakeaways",
  });
  
  const getFullArticleHtml = useCallback(() => {
    const currentValues = getValues();
    const takeawaysHtml = (currentValues.keyTakeaways || [])
      .map(t => t.value ? `<li>${t.value}</li>` : '')
      .join('');
    
    return `${currentValues.content}<h2>Key Takeaways</h2><ul>${takeawaysHtml}</ul><h2>Conclusion</h2>${currentValues.conclusion}`;
  }, [getValues]);


  const onSubmit = async (data: EditFormData) => {
    setIsSaving(true);
    toast({ title: "Saving...", description: "Updating your article." });

    const result = await editArticleAction(data);

    if (result?.error) {
      toast({ title: "Error Saving", description: result.error, variant: 'destructive' });
      setIsSaving(false);
    } else {
      toast({ title: "Article Saved!", description: `"${data.title}" has been updated.` });
      // On success, the server action will redirect, so no need to setIsSaving(false) here.
    }
  };
  
  const handleDelete = async () => {
    setIsDeleting(true);
    toast({ title: "Deleting...", description: `Removing article "${article.title}".` });
    
    // If it's a published article, we delete from the category file. If not, from drafts.
    const result = await deleteArticleAction(article.category, article.slug, !isPublishedArticle);
    
     if (result?.error) {
      toast({ title: "Error Deleting", description: result.error, variant: 'destructive' });
      setIsDeleting(false);
    } else {
      toast({ title: "Article Deleted", description: "The article has been successfully removed." });
       // Redirect is handled by the action now
    }
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


  return (
    <>
      <ArticlePreview 
        isOpen={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        title={watch('title')}
        content={getFullArticleHtml()}
        category={watch('category')}
        image={article.image}
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
                            Make changes to your article below. Drafts are auto-saved to GitHub every 10 seconds.
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

                        <div className="space-y-2 border-t pt-4">
                        <Label className="text-lg font-semibold">Key Takeaways</Label>
                            {fields.map((field, index) => (
                            <div key={field.id} className="flex items-center gap-2">
                                <Input
                                {...register(`keyTakeaways.${index}.value`)}
                                placeholder={`Takeaway #${index + 1}`}
                                disabled={isSaving || isDeleting}
                                />
                                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={isSaving || isDeleting || fields.length <= 1}>
                                <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                            ))}
                        {errors.keyTakeaways && <p className="text-sm text-destructive mt-1">{errors.keyTakeaways.root?.message || (errors.keyTakeaways as any)[0]?.value?.message}</p>}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => append({ value: "" })}
                            disabled={isSaving || isDeleting || fields.length >= 6}
                        >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Takeaway
                        </Button>
                        </div>

                        <div>
                        <Label htmlFor="conclusion">Conclusion</Label>
                        <Controller
                            name="conclusion"
                            control={control}
                            render={({ field }) => (
                                <RichTextEditor 
                                    value={field.value} 
                                    onChange={field.onChange}
                                    disabled={isSaving || isDeleting}
                                    placeholder="Write your powerful conclusion here..."
                                />
                            )}
                        />
                        {errors.conclusion && <p className="text-sm text-destructive mt-1">{errors.conclusion.message}</p>}
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
                            <div className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
                                {autoSaveStatus === 'saving' && <><Loader2 className="h-4 w-4 animate-spin" /> Saving draft...</>}
                                {autoSaveStatus === 'saved' && <><CheckCircle className="h-4 w-4 text-green-500" /> All changes saved.</>}
                                {autoSaveStatus === 'error' && <p className="text-destructive">Auto-save failed.</p>}
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="status">Status</Label>
                            <Controller
                                name="status"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value} disabled={isSaving || isDeleting}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="published">
                                                <div className="flex items-center gap-2"><Globe className="h-4 w-4 text-green-500" /> Published</div>
                                            </SelectItem>
                                            <SelectItem value="draft">
                                                <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-yellow-500" /> Draft</div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>
                        
                        <div className="space-y-2 border-t pt-4">
                            <Label>AI Tools</Label>
                            <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
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
                                <Button type="submit" disabled={isSaving || isDeleting || isAddingImages} className="w-full">
                                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Save & Publish
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
