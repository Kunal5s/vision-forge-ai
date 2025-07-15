
'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Save, Trash2, Wand2 } from 'lucide-react';
import { useState } from 'react';
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

const editSchema = z.object({
  title: z.string().min(1, "Title is required."),
  slug: z.string().min(1, "Slug is required."),
  content: z.string().min(50, 'Content must be at least 50 characters.'), 
});

type EditFormData = z.infer<typeof editSchema>;

interface EditArticleFormProps {
    article: Article;
    categoryName: string;
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

export default function EditArticleForm({ article, categoryName }: EditArticleFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddingImages, setIsAddingImages] = useState(false);
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors }, control, getValues, setValue } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      title: article.title.replace(/<[^>]*>?/gm, ''),
      slug: article.slug,
      content: contentToHtml(article.articleContent),
    }
  });


  const onSubmit = async (data: EditFormData) => {
    setIsSaving(true);
    toast({ title: "Saving...", description: "Updating your article." });

    const result = await editArticleAction({
      ...data,
      originalSlug: article.slug,
      category: categoryName
    });

    if (result?.error) {
      toast({ title: "Error Saving", description: result.error, variant: 'destructive' });
    } else {
      toast({ title: "Article Saved!", description: `"${data.title}" has been updated.` });
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
        const result = await addImagesToArticleAction(currentContent);

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
      <div className="mb-8">
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/dashboard/edit">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to All Articles
          </Link>
        </Button>
      </div>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Edit Article</CardTitle>
          <CardDescription>
            Make changes to your article below. Pasting content from other sources will preserve its formatting.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
              <Label htmlFor="content">Content</Label>
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

            <div className="border-t pt-6 flex flex-wrap justify-between items-center gap-4">
              <div className="flex gap-2">
                <Button type="submit" disabled={isSaving || isDeleting || isAddingImages}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
                 <Button
                    type="button"
                    variant="secondary"
                    onClick={handleAddImages}
                    disabled={isAddingImages || isSaving || isDeleting}
                >
                    {isAddingImages ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Wand2 className="mr-2 h-4 w-4" />
                    )}
                    Generate & Add Images
                </Button>
              </div>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                   <Button type="button" variant="destructive" disabled={isSaving || isDeleting || isAddingImages}>
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
          </form>
        </CardContent>
      </Card>
    </>
  );
}
