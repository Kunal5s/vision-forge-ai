
'use client';

import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Save, Trash2, Wand2, Eye, PlusCircle, Globe, FileText } from 'lucide-react';
import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import type { Article } from '@/lib/articles';
import { editArticleAction, deleteArticleAction } from '../../../create/actions';
import { addImagesToArticleAction } from '../../../manual/actions';
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


const editSchema = z.object({
  title: z.string().min(1, "Title is required."),
  slug: z.string().min(1, "Slug is required."),
  status: z.enum(['published', 'draft']),
  summary: z.string().optional(),
  content: z.string().min(50, 'Content must be at least 50 characters.'),
  keyTakeaways: z.array(z.object({ value: z.string().min(1, 'Takeaway cannot be empty.') })).optional(),
  conclusion: z.string().min(20, 'Conclusion must be at least 20 characters long.'),
});

type EditFormData = z.infer<typeof editSchema>;

interface EditArticleFormProps {
    article: Article;
    categoryName: string;
    categorySlug: string;
}

const contentToHtml = (content: Article['articleContent']): string => {
    return content.map(block => {
        const contentWithTags = block.content;
        switch (block.type) {
            case 'h1': return `<h1>${contentWithTags}</h1>`;
            case 'h2': return `<h2>${contentWithTags}</h2>`;
            case 'h3': return `<h3>${contentWithTags}</h3>`;
            case 'h4': return `<h4>${contentWithTags}</h4>`;
            case 'h5': return `<h5>${contentWithTags}</h5>`;
            case 'h6': return `<h6>${contentWithTags}</h6>`;
            case 'p': return `<p>${contentWithTags}</p>`;
            case 'img': return `<img src="${block.content}" alt="${block.alt || ''}" />`;
            default: return `<p>${contentWithTags}</p>`;
        }
    }).join(''); 
}

export default function EditArticleForm({ article, categoryName, categorySlug }: EditArticleFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddingImages, setIsAddingImages] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [imageCount, setImageCount] = useState(IMAGE_COUNTS[1].value); // Default to 2 images
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { toast } = useToast();
  const DRAFT_KEY = `draft-article-${categorySlug}-${article.slug}`;

  const { register, handleSubmit, formState: { errors, isDirty }, control, getValues, setValue, watch, reset } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      title: article.title.replace(/<[^>]*>?/gm, ''),
      slug: article.slug,
      status: article.status || 'published',
      summary: article.summary || '',
      content: contentToHtml(article.articleContent),
      keyTakeaways: article.keyTakeaways?.map(t => ({ value: t })) || [{ value: '' }],
      conclusion: article.conclusion,
    }
  });

  const formValues = watch();

  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_KEY);
      if (savedDraft) {
        const draftData = JSON.parse(savedDraft);
        reset(draftData); // Use reset to update form values
        toast({
          title: "Draft Restored",
          description: "Your unsaved changes have been loaded.",
        });
      }
    } catch (e) {
      console.error("Failed to load draft from localStorage", e);
    }
  }, [DRAFT_KEY, reset, toast]);

  useEffect(() => {
    const subscription = watch((value) => {
      if (isDirty) {
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }
        debounceTimeoutRef.current = setTimeout(() => {
          try {
            localStorage.setItem(DRAFT_KEY, JSON.stringify(value));
            console.log("Draft saved to localStorage");
          } catch (e) {
            console.error("Failed to save draft to localStorage", e);
          }
        }, 2000); // Save every 2 seconds after user stops typing
      }
    });
    return () => {
      subscription.unsubscribe();
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [watch, DRAFT_KEY, isDirty]);


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

    const takeaways = (data.keyTakeaways || []).filter(item => item && item.value.trim() !== '');

    const result = await editArticleAction({
      ...data,
      keyTakeaways: takeaways.length > 0 ? takeaways.map(t => t.value) : undefined,
      originalSlug: article.slug,
      category: categoryName
    });

    if (result?.error) {
      toast({ title: "Error Saving", description: result.error, variant: 'destructive' });
    } else {
      toast({ title: "Article Saved!", description: `"${data.title}" has been updated.` });
      // Clear the auto-saved draft from localStorage on successful save
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch (e) {
        console.error("Failed to remove draft from localStorage", e);
      }
    }
    setIsSaving(false);
  };
  
  const handleDelete = async () => {
    setIsDeleting(true);
    toast({ title: "Deleting...", description: `Removing article "${article.title}".` });
    
    const result = await deleteArticleAction(categoryName, article.slug);
    
     if (result?.error) {
      toast({ title: "Error Deleting", description: result.error, variant: 'destructive' });
      setIsDeleting(false);
    } else {
      toast({ title: "Article Deleted", description: "The article has been successfully removed." });
       try {
        localStorage.removeItem(DRAFT_KEY);
      } catch (e) {
        console.error("Failed to remove draft from localStorage", e);
      }
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
        category={categoryName}
        image={article.image}
      />
      <div className="mb-8">
        <Button asChild variant="outline" size="sm">
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
                            Make changes to your article below. Your work is auto-saved as a draft every few seconds.
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
                                    Save Changes
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
