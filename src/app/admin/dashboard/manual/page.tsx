
'use client';

import { useForm, Controller, useFieldArray } from 'react-hook-form';
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
import { categorySlugMap } from '@/lib/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, FileSignature, PlusCircle, Trash2, ImageIcon, Wand2 } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { createManualArticleAction } from './actions';
import Image from 'next/image';
import { RichTextEditor } from '@/components/vision-forge/RichTextEditor';
import { JSDOM } from 'jsdom';

const manualArticleSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters long.'),
  slug: z.string().min(5, 'Slug must be at least 5 characters long. Use dashes instead of spaces.').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and dashes.'),
  category: z.string().min(1, 'Please select a category.'),
  content: z.string().min(50, 'Content must be at least 50 characters long.'),
  keyTakeaways: z.array(z.object({ value: z.string().min(1, 'Takeaway cannot be empty.') })).min(1, "Please provide at least one key takeaway.").optional(),
  conclusion: z.string().min(20, 'Conclusion must be at least 20 characters long.'),
});

type ManualArticleFormData = z.infer<typeof manualArticleSchema>;

export default function ManualPublishPage() {
  const [isPublishing, setIsPublishing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isAddingImagesToArticle, setIsAddingImagesToArticle] = useState(false);
  const autosaveTimeout = useRef<NodeJS.Timeout | null>(null);
  const DRAFT_KEY = 'manual_article_draft';

  const { toast } = useToast();
  const { register, handleSubmit, control, formState: { errors }, watch, setValue, getValues, trigger } = useForm<ManualArticleFormData>({
    resolver: zodResolver(manualArticleSchema),
    defaultValues: {
      content: '',
      keyTakeaways: [{ value: '' }],
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "keyTakeaways",
  });

  const titleValue = watch('title');

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
    try {
        const seed = Math.floor(Math.random() * 1_000_000);
        const finalPrompt = `${topic}, digital art, high detail`;
        const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=600&height=400&seed=${seed}&nologo=true`;
        setPreviewImage(pollinationsUrl);
    } catch (e) {
        console.error("Failed to generate preview image", e);
        setPreviewImage(`https://placehold.co/600x400.png`);
    } finally {
        setIsGeneratingImage(false);
    }
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
        if (titleValue) {
            fetchPreviewImage(titleValue);
        }
    }, 1500);
    
    return () => clearTimeout(debounceTimer);
  }, [titleValue, fetchPreviewImage]);

  const addImagesToArticle = useCallback(async () => {
    setIsAddingImagesToArticle(true);
    toast({ title: 'AI is reading your article...', description: 'Generating and adding relevant images. This may take a moment.' });
    
    try {
        const currentContent = getValues('content');
        const dom = new JSDOM(currentContent);
        const document = dom.window.document;
        const headings = document.querySelectorAll('h2, h3');
        let newContent = document.body;

        for (const heading of Array.from(headings)) {
            const topic = heading.textContent?.trim();
            if (topic && topic.split(' ').length > 2) { // Only generate for reasonably descriptive headings
                const seed = Math.floor(Math.random() * 1_000_000);
                const finalPrompt = `${topic}, relevant photography, high detail`;
                const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=800&height=450&seed=${seed}&nologo=true`;

                const img = document.createElement('img');
                img.src = pollinationsUrl;
                img.alt = topic;
                
                // Insert the image after the heading
                heading.parentNode?.insertBefore(img, heading.nextSibling);
            }
        }
        
        setValue('content', newContent.innerHTML, { shouldDirty: true });
        toast({ title: 'Images Added!', description: 'AI has added contextual images to your article.' });

    } catch (e) {
        console.error("Failed to add images to article", e);
        toast({ title: 'Error Adding Images', description: 'Could not automatically add images.', variant: 'destructive' });
    } finally {
        setIsAddingImagesToArticle(false);
    }
  }, [getValues, setValue, toast]);
  

  const onSubmit = async (data: ManualArticleFormData) => {
    setIsPublishing(true);
    toast({
      title: 'Publishing Your Article...',
      description: `Saving "${data.title}" to GitHub. Please wait.`,
    });

    if (!previewImage) {
        toast({
            title: 'Error',
            description: 'Please wait for the preview image to load before publishing.',
            variant: 'destructive',
        });
        setIsPublishing(false);
        return;
    }

    const result = await createManualArticleAction({
      ...data,
      image: previewImage
    });

    if (result.success) {
      toast({
        title: 'Article Published Successfully!',
        description: `Your article "${result.title}" has been saved and is now live.`,
      });
    } else {
      toast({
        title: 'Error Publishing Article',
        description: result.error,
        variant: 'destructive',
      });
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

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">Publish a New Article Manually</CardTitle>
                    <CardDescription>
                    Write your article below. Pasting content from other sources will preserve its formatting.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="title" className="text-lg font-semibold">Article Title</Label>
                    <Input 
                      id="title" 
                      placeholder="Your engaging article title..."
                      {...register('title')} 
                      disabled={isPublishing}
                      className="text-2xl font-bold h-auto py-2 border-0 shadow-none px-0 focus-visible:ring-0" 
                    />
                    {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
                    <Input id="slug" placeholder="your-slug-will-be-here" {...register('slug')} disabled className="border-0 px-0 h-auto text-sm text-muted-foreground" />
                    {errors.slug && <p className="text-sm text-destructive mt-1">{errors.slug.message}</p>}
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
                                disabled={isPublishing}
                            />
                        )}
                    />
                    {errors.content && <p className="text-sm text-destructive mt-1">{errors.content.message}</p>}
                  </div>
                  
                  <div>
                    <Label className="text-lg font-semibold">Key Takeaways</Label>
                    <div className="space-y-2">
                      {fields.map((field, index) => (
                        <div key={field.id} className="flex items-center gap-2">
                          <Input
                            {...register(`keyTakeaways.${index}.value`)}
                            placeholder={`Takeaway #${index + 1}`}
                            disabled={isPublishing}
                          />
                          <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={isPublishing || fields.length <= 1}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                     {errors.keyTakeaways && <p className="text-sm text-destructive mt-1">{errors.keyTakeaways.root?.message || (errors.keyTakeaways as any)[0]?.value?.message}</p>}
                    <div className="flex items-center gap-4 mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => append({ value: "" })}
                        disabled={isPublishing || fields.length >= 6}
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Takeaway
                      </Button>
                      <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={addImagesToArticle}
                          disabled={isAddingImagesToArticle || isPublishing}
                      >
                          {isAddingImagesToArticle ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                              <Wand2 className="mr-2 h-4 w-4" />
                          )}
                          Generate & Add Images to Article
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="conclusion" className="text-lg font-semibold">Conclusion</Label>
                     <Controller
                        name="conclusion"
                        control={control}
                        render={({ field }) => (
                             <RichTextEditor 
                                value={field.value} 
                                onChange={field.onChange}
                                disabled={isPublishing}
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
                      <Label htmlFor="category">Category</Label>
                      <Controller
                        name="category"
                        control={control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value || ''} disabled={isPublishing}>
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
                            ) : previewImage ? (
                                <Image 
                                  src={previewImage} 
                                  alt="Article preview"
                                  width={600}
                                  height={400}
                                  className="object-cover"
                                  data-ai-hint="manual content feature"
                                  key={previewImage}
                                />
                            ) : (
                                <div className="text-center text-muted-foreground p-4">
                                  <ImageIcon className="mx-auto h-10 w-10" />
                                  <p className="text-sm mt-2">Enter a title to generate a preview image.</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={isPublishing || !previewImage || isGeneratingImage}>
                    {isPublishing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Publishing...
                      </>
                    ) : (
                      <>
                        <FileSignature className="mr-2 h-4 w-4" />
                        Publish Article
                      </>
                    )}
                  </Button>
                </CardContent>
            </Card>
        </div>
      </form>
    </main>
  );
}
