
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
import { ArrowLeft, Loader2, PlusCircle, Trash2, FileSignature, Upload } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createManualStoryAction } from './actions';
import { categorySlugMap } from '@/lib/constants';

// The imageUrl will now be a Base64 encoded data URI string.
const StoryPageFormSchema = z.object({
  imageUrl: z.string().min(1, "An image is required for each page."),
  caption: z.string().min(1, "Caption cannot be empty.").max(150, "Caption cannot be more than 150 characters."),
});

const StoryFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long."),
  slug: z.string().min(3, "Slug is required.").regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and dashes.'),
  seoDescription: z.string().min(10, "SEO Description is required.").max(160, "Description cannot be more than 160 characters."),
  category: z.string().min(1, "Please select a category."),
  pages: z.array(StoryPageFormSchema).min(5, "A story must have at least 5 pages."),
});

type StoryFormData = z.infer<typeof StoryFormSchema>;

export default function CreateManualStoryPage() {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const { register, handleSubmit, control, formState: { errors }, watch, setValue } = useForm<StoryFormData>({
        resolver: zodResolver(StoryFormSchema),
        defaultValues: {
            title: '',
            slug: '',
            seoDescription: '',
            category: 'Featured',
            pages: Array.from({ length: 5 }, () => ({ imageUrl: '', caption: '' })),
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "pages",
    });

    const titleValue = watch('title');
    const pagesValue = watch('pages');

    const generateSlug = useCallback((title: string) => {
        return title
            .toLowerCase()
            .replace(/<[^>]*>?/gm, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .replace(/^-+|-+$/g, '');
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

    const handleFormSubmit = async (data: StoryFormData) => {
        setIsLoading(true);
        toast({
            title: 'Publishing Web Story...',
            description: 'Please wait while we save your story to GitHub.',
        });

        const result = await createManualStoryAction(data);

        if (result && !result.success) {
            toast({
                title: 'Error Publishing Story',
                description: result.error,
                variant: 'destructive',
                duration: 9000,
            });
        }
        // On success, the action redirects, so we don't need a success toast here.
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

            <Card className="max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle className="text-2xl">Create a New Web Story</CardTitle>
                    <CardDescription>
                        Manually build a multi-page visual story. Add at least 5 pages to publish.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                   <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="title">Story Title</Label>
                                <Input id="title" {...register('title')} placeholder="e.g., A Journey Through the Himalayas" disabled={isLoading} />
                                {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
                            </div>
                            <div>
                                <Label htmlFor="slug">Story Slug (URL)</Label>
                                <Input id="slug" {...register('slug')} placeholder="a-journey-through-the-himalayas" disabled={isLoading} />
                                {errors.slug && <p className="text-sm text-destructive mt-1">{errors.slug.message}</p>}
                            </div>
                             <div>
                                <Label htmlFor="seoDescription">SEO Description (Max 160 characters)</Label>
                                <Textarea id="seoDescription" {...register('seoDescription')} placeholder="A short, catchy description for search engines." disabled={isLoading} rows={2} />
                                {errors.seoDescription && <p className="text-sm text-destructive mt-1">{errors.seoDescription.message}</p>}
                            </div>
                            <div>
                                <Label>Category</Label>
                                 <Controller
                                    name="category"
                                    control={control}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
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
                        </div>
                        
                        <div className="space-y-6 border-t pt-6">
                            <h3 className="text-lg font-semibold">Story Pages</h3>
                            {fields.map((field, index) => (
                                <div key={field.id} className="p-4 border rounded-md space-y-4 relative bg-background">
                                     <Label className="font-semibold">Page {index + 1}</Label>
                                    <div>
                                        <Label htmlFor={`pages.${index}.imageUrl`}>Image (JPG, PNG, WebP)</Label>
                                        <div className="flex items-center gap-4 mt-1">
                                            {pagesValue[index]?.imageUrl && (
                                                <Image 
                                                    src={pagesValue[index].imageUrl} 
                                                    alt={`Preview for page ${index + 1}`} 
                                                    width={80}
                                                    height={142} // 9:16 aspect ratio
                                                    className="object-cover rounded-md border"
                                                />
                                            )}
                                            <Button type="button" variant="outline" onClick={() => (document.getElementById(`file-input-${index}`) as HTMLInputElement)?.click()} disabled={isLoading}>
                                                <Upload className="mr-2 h-4 w-4" />
                                                {pagesValue[index]?.imageUrl ? 'Change Image' : 'Upload Image'}
                                            </Button>
                                            <input
                                                id={`file-input-${index}`}
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp"
                                                className="hidden"
                                                onChange={(e) => handleFileChange(e, index)}
                                            />
                                        </div>
                                        {errors.pages?.[index]?.imageUrl && <p className="text-sm text-destructive mt-1">{errors.pages[index]?.imageUrl?.message}</p>}
                                    </div>
                                    <div>
                                        <Label htmlFor={`pages.${index}.caption`}>Caption (Max 150 characters)</Label>
                                        <Textarea id={`pages.${index}.caption`} {...register(`pages.${index}.caption`)} placeholder="A short, engaging caption for this page." disabled={isLoading} rows={2} />
                                        {errors.pages?.[index]?.caption && <p className="text-sm text-destructive mt-1">{errors.pages[index]?.caption?.message}</p>}
                                    </div>
                                    {fields.length > 5 && (
                                         <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => remove(index)} disabled={isLoading}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                             {errors.pages && <p className="text-sm text-destructive mt-2">{errors.pages.root?.message || errors.pages.message}</p>}
                            <div className="flex justify-start">
                                <Button type="button" variant="outline" onClick={() => append({ imageUrl: '', caption: '' })} disabled={isLoading || fields.length >= 20}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Add Page
                                </Button>
                            </div>
                        </div>

                        <div className="border-t pt-6">
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publishing...</>
                                ) : (
                                    <><FileSignature className="mr-2 h-4 w-4" /> Publish Story</>
                                )}
                            </Button>
                        </div>
                   </form>
                </CardContent>
            </Card>
        </main>
    );
}
