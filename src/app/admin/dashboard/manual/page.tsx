
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
import { ArrowLeft, Loader2, FileSignature, PlusCircle, Trash2, ImageIcon } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { createManualArticleAction } from './actions';
import Image from 'next/image';
import { RichTextEditor } from '@/components/vision-forge/RichTextEditor';

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
  const formValues = watch();

  // Load draft from localStorage on initial render
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_KEY);
      if (savedDraft) {
        const draftData = JSON.parse(savedDraft);
        const result = manualArticleSchema.partial().safeParse(draftData);
        if (result.success) {
            Object.keys(result.data).forEach(key => {
              setValue(key as keyof ManualArticleFormData, result.data[key as keyof ManualArticleFormData]);
            });
            toast({ title: "Draft Loaded", description: "Your previously unsaved draft has been restored." });
        }
      }
    } catch (e) {
      console.error("Failed to load draft from localStorage", e);
    }
  }, [setValue, toast]);

  // Autosave functionality
  useEffect(() => {
    const subscription = watch((value) => {
        if (autosaveTimeout.current) {
          clearTimeout(autosaveTimeout.current);
        }
        autosaveTimeout.current = setTimeout(() => {
          try {
            localStorage.setItem(DRAFT_KEY, JSON.stringify(value));
            console.log("Draft saved to localStorage");
          } catch (e) {
            console.error("Failed to save draft to localStorage", e);
          }
        }, 5000); // Autosave every 5 seconds
    });
    return () => {
        subscription.unsubscribe();
        if (autosaveTimeout.current) {
            clearTimeout(autosaveTimeout.current);
        }
    };
  }, [watch]);


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
      const newSlug = generateSlug(titleValue || '');
      setValue('slug', newSlug, { shouldValidate: true });
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
        setPreviewImage(`https://placehold.co/600x400.png`); // Fallback
    } finally {
        setIsGeneratingImage(false);
    }
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
        if (titleValue) {
            fetchPreviewImage(titleValue);
        }
    }, 1500); // Wait 1.5 seconds after user stops typing
    
    return () => clearTimeout(debounceTimer);
  }, [titleValue, fetchPreviewImage]);
  

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
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch (e) {
        console.error("Failed to remove draft from localStorage", e);
      }
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
                    Write your article below. Pasting content from other sources will preserve its formatting. Your work is auto-saved.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="title">Article Title</Label>
                        <Input 
                          id="title" 
                          placeholder="Your engaging article title"
                          {...register('title')} 
                          disabled={isPublishing} 
                        />
                        {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
                      </div>
                      <div>
                        <Label htmlFor="slug">URL Slug</Label>
                        <Input id="slug" placeholder="your-engaging-article-title" {...register('slug')} disabled={isPublishing} />
                        {errors.slug && <p className="text-sm text-destructive mt-1">{errors.slug.message}</p>}
                      </div>
                  </div>

                  <div>
                      <Label htmlFor="category">Category</Label>
                      <Controller
                        name="category"
                        control={control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={isPublishing}>
                            <SelectTrigger id="category">
                              <SelectValue placeholder="Select a category for your article" />
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
                    <Label htmlFor="content">Article Content</Label>
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
                    <Label>Key Takeaways</Label>
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
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => append({ value: "" })}
                       disabled={isPublishing || fields.length >= 6}
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
                                disabled={isPublishing}
                                placeholder="Write your conclusion here..."
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
                    <CardTitle>Article Preview & Publish</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
